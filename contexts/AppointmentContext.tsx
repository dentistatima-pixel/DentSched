import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Appointment, AppointmentStatus, UserRole, TreatmentPlanStatus, SignatureChainEntry, PediatricConsent, InstrumentSet } from '../types';
import { APPOINTMENTS, generateUid, PROCEDURE_TO_CONSENT_MAP, isExpired } from '../constants';
import { useToast } from '../components/ToastSystem';
import { useAppContext } from './AppContext';
import { useModal } from './ModalContext';
import { usePatient } from './PatientContext';
import { useSettings } from './SettingsContext';
import { DataService } from '../services/dataService';
import { checkClinicalProtocols } from '../services/protocolEnforcement';
import { useStaff } from './StaffContext';
import { canStartTreatment } from '../services/medicolegalGuard';
import { validateSignatureChain } from '../services/signatureVerification';
import { sendSms, formatSmsTemplate, sanitizeSmsContent } from '../services/smsService';

const generateDiff = (oldObj: any, newObj: any): string => {
    if (!oldObj) return 'Created record';
    const changes: string[] = [];
    Object.keys(newObj).forEach(key => {
        if (oldObj[key] !== newObj[key]) changes.push(`${key}: ${oldObj[key]} -> ${newObj[key]}`);
    });
    return changes.join('; ');
};

interface AppointmentContextType {
    appointments: Appointment[];
    handleSaveAppointment: (appointment: Appointment) => Promise<void>;
    handleMoveAppointment: (appointmentId: string, newDate: string, newTime: string, newProviderId: string, newResourceId?: string) => Promise<void>;
    handleUpdateAppointmentStatus: (appointmentId: string, status: AppointmentStatus, additionalData?: Partial<Appointment>, bypassProtocol?: boolean) => Promise<void>;
    handleVerifyDowntimeEntry: (id: string) => Promise<void>;
    handleVerifyMedHistory: (appointmentId: string) => Promise<void>;
    handleConfirmFollowUp: (appointmentId: string) => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const AppointmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    const { isOnline, logAction, currentUser, enqueueAction } = useAppContext();
    const { showModal, hideModal } = useModal();
    const { patients } = usePatient();
    const { fieldSettings, addScheduledSms, invalidateFutureRecalls } = useSettings();
    const [appointments, setAppointments] = useState<Appointment[]>(APPOINTMENTS);
    const { staff } = useStaff();
    
    const canManageAppointments = useMemo(() => {
        if (!currentUser) return false;
        return [UserRole.ADMIN, UserRole.SYSTEM_ARCHITECT, UserRole.DENTIST].includes(currentUser.role);
    }, [currentUser]);
    
    const _finishSavingAppointment = async (appointmentData: Appointment) => {
        try {
            if (!canManageAppointments) throw new Error("Authorization Denied");
            
            const isNew = !appointments.some(a => a.id === appointmentData.id);
            const oldApt = isNew ? null : appointments.find(a => a.id === appointmentData.id);
            
            if (!isOnline) {
                const offlineApt = { ...appointmentData, isPendingSync: true };
                setAppointments(prev => isNew ? [...prev, offlineApt] : prev.map(a => a.id === offlineApt.id ? offlineApt : a));
                await enqueueAction(isNew ? 'CREATE_APPOINTMENT' : 'UPDATE_APPOINTMENT', offlineApt);
                toast.info('Offline: Appointment saved locally.');

                if (offlineApt.patientId !== 'ADMIN_BLOCK') {
                    invalidateFutureRecalls(offlineApt.patientId, offlineApt.date);
                }
                return;
            }
            
            const finalAppointment = await DataService.saveAppointment(appointmentData);

            setAppointments(prev => isNew ? [...prev, finalAppointment] : prev.map(a => a.id === finalAppointment.id ? finalAppointment : a));
            
            logAction(isNew ? 'CREATE' : 'UPDATE', 'Appointment', finalAppointment.id, generateDiff(oldApt, finalAppointment));
            toast.success(`Appointment saved.`);

            if (finalAppointment.patientId !== 'ADMIN_BLOCK') {
                invalidateFutureRecalls(finalAppointment.patientId, finalAppointment.date);
                
                if (isNew) {
                    const patient = patients.find(p => p.id === finalAppointment.patientId);
                    const template = fieldSettings.smsTemplates['new_appointment_confirmation'];
                    if (patient && template && template.enabled && patient.phone) {
                        const data = {
                            PatientName: patient.firstName || patient.name.split(' ')[0],
                            ClinicName: fieldSettings.clinicName || 'Clinic',
                            Date: finalAppointment.date,
                            Time: finalAppointment.time
                        };
                        const msg = formatSmsTemplate(template.text, data);
                        sendSms(patient.phone, sanitizeSmsContent(msg), fieldSettings.smsConfig).catch(console.error);
                    }
                }
            }

        } catch (e) {
            toast.error('Failed to save appointment.');
        }
    };

    const handleSaveAppointment = async (appointmentData: Appointment): Promise<void> => {
        if (!canManageAppointments) {
            toast.error("Authorization Denied: You cannot create or modify appointments.");
            return;
        }

        const patient = patients.find(p => p.id === appointmentData.patientId);
        const procedure = fieldSettings.procedures.find(p => p.name === appointmentData.type);
        const isNew = !appointments.some(a => a.id === appointmentData.id);

        if (procedure?.requiresConsent && isNew && patient) {
            // --- PRE-FLIGHT FINANCIAL CONSENT CHECK ---
            if (appointmentData.planId) {
                const plan = patient.treatmentPlans?.find(tp => tp.id === appointmentData.planId);

                if (!plan) {
                    toast.error('CRITICAL ERROR: Appointment is linked to a non-existent treatment plan.');
                    return;
                }

                if (plan.status === TreatmentPlanStatus.DRAFT || plan.status === TreatmentPlanStatus.PENDING_REVIEW) {
                    toast.warning('This procedure is part of a plan that has not been clinically approved yet.');
                    showModal('approvalDashboard', { patient, plan, onConfirm: () => {}, onReject: () => {} });
                    return;
                }

                if (plan.status === TreatmentPlanStatus.PENDING_FINANCIAL_CONSENT) {
                    toast.error('Financial consent for the treatment plan must be captured before this procedure.');
                    showModal('financialConsent', { patient, plan });
                    return;
                }
            }
            // --- END PRE-FLIGHT CHECK ---
            
            let consentTemplateId = 'GENERAL_AUTHORIZATION'; // Default
            const procedureNameLower = procedure.name.toLowerCase();

            for (const keyword in PROCEDURE_TO_CONSENT_MAP) {
                if (procedureNameLower.includes(keyword)) {
                    consentTemplateId = PROCEDURE_TO_CONSENT_MAP[keyword];
                    break;
                }
            }

            const consentTemplate = fieldSettings.consentFormTemplates.find(t => t.id === consentTemplateId);
            
            if (!consentTemplate) {
                toast.error(`Consent form template "${consentTemplateId}" not found. Please check settings. Proceeding without consent.`);
                _finishSavingAppointment(appointmentData);
                return;
            }

            showModal('consentCapture', { 
                patient, 
                appointment: appointmentData,
                template: consentTemplate,
                procedure,
                onSave: (chain: SignatureChainEntry[], pediatricConsent?: PediatricConsent) => {
                    const finalAppointment = { 
                        ...appointmentData, 
                        consentSignatureChain: chain,
                        pediatricConsent: pediatricConsent,
                    };
                    _finishSavingAppointment(finalAppointment as Appointment);
                }
            });
        } else {
            _finishSavingAppointment(appointmentData);
        }
    };

    const handleMoveAppointment = async (appointmentId: string, newDate: string, newTime: string, newProviderId: string, newResourceId?: string): Promise<void> => {
        if (!canManageAppointments) {
            toast.error("Authorization Denied: You cannot move appointments.");
            return;
        }
        
        const aptToMove = appointments.find(a => a.id === appointmentId);
        if (!aptToMove) {
            toast.error("Appointment not found");
            return;
        }

        const updatedApt = { ...aptToMove, date: newDate, time: newTime, providerId: newProviderId, resourceId: newResourceId };
        
        if (!isOnline) {
            const offlineApt = { ...updatedApt, isPendingSync: true };
            setAppointments(prev => prev.map(apt => apt.id === appointmentId ? offlineApt : apt));
            await enqueueAction('UPDATE_APPOINTMENT', offlineApt);
            toast.info("Offline: Appointment move saved locally.");
            if (updatedApt.patientId !== 'ADMIN_BLOCK') {
                invalidateFutureRecalls(updatedApt.patientId, updatedApt.date);
            }
            return;
        }

        try {
            await DataService.saveAppointment(updatedApt);
            setAppointments(prev => prev.map(apt => apt.id === appointmentId ? { ...updatedApt, isPendingSync: false } : apt));
            toast.success("Appointment rescheduled.");
            logAction('UPDATE', 'Appointment', appointmentId, `Moved to ${newDate} @ ${newTime}`);
            if (updatedApt.patientId !== 'ADMIN_BLOCK') {
                invalidateFutureRecalls(updatedApt.patientId, updatedApt.date);
                
                const patient = patients.find(p => p.id === updatedApt.patientId);
                const template = fieldSettings.smsTemplates['reschedule_confirmation_patient'];
                if (patient && template && template.enabled && patient.phone) {
                    const data = {
                        PatientName: patient.firstName || patient.name.split(' ')[0],
                        ClinicName: fieldSettings.clinicName || 'Clinic',
                        Date: updatedApt.date,
                        Time: updatedApt.time
                    };
                    const msg = formatSmsTemplate(template.text, data);
                    sendSms(patient.phone, sanitizeSmsContent(msg), fieldSettings.smsConfig).catch(console.error);
                }
            }
        } catch (e) {
            toast.error('Failed to move appointment.');
        }
    };
    
    const handleUpdateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus, additionalData: Partial<Appointment> = {}, bypassProtocol = false): Promise<void> => {
        if (!canManageAppointments) {
            toast.error("Authorization Denied: You cannot update appointment status.");
            return;
        }
        
        const aptToUpdate = appointments.find(a => a.id === appointmentId);
        if (!aptToUpdate) {
            toast.error("Appointment not found");
            return;
        }
        
        const patient = patients.find(p => p.id === aptToUpdate.patientId);
        const provider = staff.find(s => s.id === aptToUpdate.providerId);
    
        if (status === AppointmentStatus.TREATING && !bypassProtocol && patient && provider && fieldSettings) {
            const block = canStartTreatment(aptToUpdate, patient, provider, fieldSettings);
            if (block.isBlocked) {
                toast.error(block.reason, { duration: 8000 });
                const modal = block.modal;
                if (modal) {
                    const props: any = {
                        ...modal.props,
                        onConfirm: (data: any) => {
                            let updatedData = {};
                            if (modal.type === 'medicalHistoryAffirmation') {
                                updatedData = { medHistoryAffirmation: data };
                            } else if (modal.type === 'sterilizationVerification') {
                                updatedData = { sterilizationVerified: true, linkedInstrumentSetIds: data };
                            }
                            hideModal();
                            handleUpdateAppointmentStatus(appointmentId, status, { ...additionalData, ...updatedData }, true);
                        }
                    };
                    
                    if (modal.type === 'protocolOverride' && modal.props.rule) {
                        props.onConfirm = (reason: string) => {
                            logAction('SECURITY_ALERT', 'System', patient.id, `Protocol Override: ${modal.props.rule!.name}. Reason: ${reason}`);
                            hideModal();
                            handleUpdateAppointmentStatus(appointmentId, status, additionalData, true);
                        }
                    }
    
                    if (modal.type === 'consentCapture') {
                        props.onSave = (chain: SignatureChainEntry[]) => {
                            hideModal();
                            handleUpdateAppointmentStatus(appointmentId, status, { ...additionalData, consentSignatureChain: chain }, true);
                        }
                    }
                    
                    showModal(modal.type, props);
                }
                return;
            }
        }
        
        // POST-OP HANDOVER & SOAP NOTE GATE
        if (status === AppointmentStatus.COMPLETED && !bypassProtocol) {
            // This entire block is now handled by the Dashboard -> PostOpHandover -> ClinicalCheckout flow.
            // We just need to stop the direct update here.
            // The actual status update will be called from ClinicalCheckoutModal with bypassProtocol=true.
             toast.error("Completion must be done via the clinical checkout workflow."); // This should not be hit if UI is correct.
             return;
        }
    
        const updatedApt = { ...aptToUpdate, status, ...additionalData };
    
        if (!isOnline) {
            const offlineApt = { ...updatedApt, isPendingSync: true };
            setAppointments(prev => prev.map(apt => apt.id === appointmentId ? offlineApt : apt));
            await enqueueAction('UPDATE_STATUS', offlineApt);
            toast.info(`Offline: Status update saved locally.`);
            return;
        }
    
        try {
            await DataService.saveAppointment(updatedApt);
            setAppointments(prev => prev.map(apt => apt.id === appointmentId ? { ...updatedApt, isPendingSync: false } : apt));
            logAction('UPDATE_STATUS', 'Appointment', appointmentId, `Status changed to ${status}.`);
            
            if (status === AppointmentStatus.COMPLETED) {
                const procedure = fieldSettings.procedures.find(p => p.name === aptToUpdate.type);
                
                if (procedure?.triggersPostOpSequence) {
                    const now = new Date();
                    const patient = patients.find(p => p.id === aptToUpdate.patientId);
                    if (patient) {
                        const data = { PatientName: patient.firstName, ClinicName: fieldSettings.clinicName };

                        // Schedule 24-hour check-in
                        const date24hr = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                        addScheduledSms({ patientId: patient.id, templateId: 'post_treatment_24hr', dueDate: date24hr.toISOString(), data });

                        // Schedule 1-month check-in
                        const date1mo = new Date(now);
                        date1mo.setMonth(now.getMonth() + 1);
                        addScheduledSms({ patientId: patient.id, templateId: 'post_treatment_1mo', dueDate: date1mo.toISOString(), data });

                        // Schedule 3-month check-in
                        const date3mo = new Date(now);
                        date3mo.setMonth(now.getMonth() + 3);
                        addScheduledSms({ patientId: patient.id, templateId: 'post_treatment_3mo', dueDate: date3mo.toISOString(), data });

                        toast.info("Post-treatment care sequence scheduled.");
                    }
                }
            } else if (status === AppointmentStatus.CANCELLED) {
                const patient = patients.find(p => p.id === aptToUpdate.patientId);
                const isClinicCancellation = additionalData.cancellationReason?.toLowerCase().includes('clinic') || additionalData.cancellationReason?.toLowerCase().includes('doctor');
                const templateId = isClinicCancellation ? 'cancellation_by_clinic' : 'cancellation_confirmation_patient';
                const template = fieldSettings.smsTemplates[templateId];
                
                if (patient && template && template.enabled && patient.phone) {
                    const data = {
                        PatientName: patient.firstName || patient.name.split(' ')[0],
                        ClinicName: fieldSettings.clinicName || 'Clinic',
                        Date: aptToUpdate.date,
                        Time: aptToUpdate.time,
                        Reason: additionalData.cancellationReason || 'Not specified'
                    };
                    const msg = formatSmsTemplate(template.text, data);
                    sendSms(patient.phone, sanitizeSmsContent(msg), fieldSettings.smsConfig).catch(console.error);
                }
            }
        } catch (e) {
            toast.error('Failed to update appointment status.');
        }
    };

    const handleVerifyDowntimeEntry = async (id: string) => {
        await handleUpdateAppointmentStatus(id, appointments.find(a => a.id === id)!.status, { reconciled: true });
        toast.success("Downtime entry reconciled.");
    };

    const handleVerifyMedHistory = async (id: string) => {
        await handleUpdateAppointmentStatus(id, appointments.find(a => a.id === id)!.status, { medHistoryVerified: true, medHistoryVerifiedAt: new Date().toISOString() });
        toast.success("Medical history verified.");
    };

    const handleConfirmFollowUp = async (id: string) => {
        await handleUpdateAppointmentStatus(id, appointments.find(a => a.id === id)!.status, { followUpConfirmed: true, followUpConfirmedAt: new Date().toISOString() });
        toast.success("Post-op follow-up confirmed.");
    };

    const value = { appointments, handleSaveAppointment, handleMoveAppointment, handleUpdateAppointmentStatus, handleVerifyDowntimeEntry, handleVerifyMedHistory, handleConfirmFollowUp };

    return <AppointmentContext.Provider value={value}>{children}</AppointmentContext.Provider>;
};

export const useAppointments = () => {
    const context = useContext(AppointmentContext);
    if (context === undefined) {
        throw new Error('useAppointments must be used within an AppointmentProvider');
    }
    return context;
};

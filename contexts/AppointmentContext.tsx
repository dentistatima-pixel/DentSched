
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
    handleUpdateAppointmentStatus: (appointmentId: string, status: AppointmentStatus, additionalData?: Partial<Appointment>) => Promise<void>;
    handleVerifyDowntimeEntry: (id: string) => Promise<void>;
    handleVerifyMedHistory: (appointmentId: string) => Promise<void>;
    handleConfirmFollowUp: (appointmentId: string) => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const AppointmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    const { isOnline, logAction, currentUser, enqueueAction } = useAppContext();
    const { showModal } = useModal();
    const { patients } = usePatient();
    const { fieldSettings, handleUpdateSettings } = useSettings();
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
                toast.info('Offline: Appointment with signature saved locally.');
                return;
            }
            
            const finalAppointment = await DataService.saveAppointment(appointmentData);

            setAppointments(prev => isNew ? [...prev, finalAppointment] : prev.map(a => a.id === finalAppointment.id ? finalAppointment : a));
            
            logAction(isNew ? 'CREATE' : 'UPDATE', 'Appointment', finalAppointment.id, generateDiff(oldApt, finalAppointment));
            toast.success(`Appointment saved.`);

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
                        ...(pediatricConsent && { pediatricConsent: pediatricConsent }),
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
            return;
        }

        try {
            await DataService.saveAppointment(updatedApt);
            setAppointments(prev => prev.map(apt => apt.id === appointmentId ? { ...updatedApt, isPendingSync: false } : apt));
            toast.success("Appointment rescheduled.");
            logAction('UPDATE', 'Appointment', appointmentId, `Moved to ${newDate} @ ${newTime}`);
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
        
        if (status === AppointmentStatus.ARRIVED && patient) {
            const lastConsentTimestamp = patient.registrationSignatureTimestamp; 
            if (lastConsentTimestamp) {
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                if (new Date(lastConsentTimestamp) < oneYearAgo) {
                    toast.warning(`Patient consent is over 1 year old. Please initiate consent renewal.`, { duration: 10000 });
                }
            }
        }

        if (provider && (status === AppointmentStatus.TREATING || status === AppointmentStatus.SEATED)) {
            const todayStr = new Date(aptToUpdate.date).toLocaleDateString('en-CA');
            const providerAppointmentsToday = appointments
                .filter(a => a.providerId === provider.id && a.date === todayStr && !a.isBlock)
                .sort((a, b) => a.time.localeCompare(b.time));

            let continuousWorkMinutes = 0;
            let lastAppointmentEndTime: Date | null = null;
            let crossedThreshold = false;

            for (const apt of providerAppointmentsToday) {
                const aptStart = new Date(`${apt.date}T${apt.time}`);
                
                if (lastAppointmentEndTime && (aptStart.getTime() - lastAppointmentEndTime.getTime()) >= 30 * 60 * 1000) {
                    continuousWorkMinutes = 0;
                }

                const previousTotal = continuousWorkMinutes;
                continuousWorkMinutes += apt.durationMinutes;
                lastAppointmentEndTime = new Date(aptStart.getTime() + apt.durationMinutes * 60 * 1000);
                
                if (apt.id === appointmentId && previousTotal < 240 && continuousWorkMinutes >= 240) {
                    crossedThreshold = true;
                }
            }

            if(crossedThreshold) {
                toast.warning(
                    `Fatigue Alert for ${provider.name}: This session marks over 4 hours of continuous treatment. A short break is recommended for safety.`, 
                    { duration: 15000 }
                );
            }
        }
    
        if (status === AppointmentStatus.TREATING && !bypassProtocol && patient && provider && fieldSettings) {
            const block = canStartTreatment(aptToUpdate, patient, provider, fieldSettings);
            if (block.isBlocked) {
                toast.error(block.reason, { duration: 8000 });
                if (block.modal) {
                    const props: any = {
                        ...block.modal.props,
                        onConfirm: (data: any) => {
                            let updatedData = {};
                            if (block.modal.type === 'medicalHistoryAffirmation') {
                                updatedData = { medHistoryAffirmation: data };
                            } else if (block.modal.type === 'sterilizationVerification') {
                                updatedData = { sterilizationVerified: true, linkedInstrumentSetIds: data };
                            }
                            handleUpdateAppointmentStatus(appointmentId, status, { ...additionalData, ...updatedData }, true);
                        }
                    };
                    
                    if (block.modal.type === 'protocolOverride' && block.modal.props.rule) {
                        props.onConfirm = (reason: string, signatureChain: SignatureChainEntry[]) => {
                            logAction('SECURITY_ALERT', 'System', patient.id, `Protocol Override: ${block.modal.props.rule.name}. Reason: ${reason}`);
                            const newOverride = { ruleId: block.modal.props.rule.id, reason, signatureChain };
                            const existingOverrides = aptToUpdate.protocolOverrides || [];
                            handleUpdateAppointmentStatus(appointmentId, status, { ...additionalData, protocolOverrides: [...existingOverrides, newOverride] }, true);
                        }
                    }
    
                    if (block.modal.type === 'consentCapture') {
                        props.onSave = (chain: SignatureChainEntry[]) => {
                            handleUpdateAppointmentStatus(appointmentId, status, { ...additionalData, consentSignatureChain: chain }, true);
                        }
                    }
                    
                    showModal(block.modal.type, props);
                }
                return;
            }
        }
        
        if (status === AppointmentStatus.COMPLETED && !bypassProtocol) {
            if (patient) {
                const noteForAppointment = patient.dentalChart?.find(note => note.appointmentId === appointmentId);
                const hasSoapNotes = noteForAppointment && (
                    (noteForAppointment.subjective && noteForAppointment.subjective.trim() !== '') ||
                    (noteForAppointment.objective && noteForAppointment.objective.trim() !== '') ||
                    (noteForAppointment.assessment && noteForAppointment.assessment.trim() !== '') ||
                    (noteForAppointment.plan && noteForAppointment.plan.trim() !== '')
                );

                if (!hasSoapNotes) {
                    toast.error("Cannot complete appointment: A clinical note with SOAP details is required.");
                    return; 
                }
            }

            if (aptToUpdate.consentSignatureChain && aptToUpdate.consentSignatureChain.length > 0) {
                const validation = validateSignatureChain(aptToUpdate.consentSignatureChain);
                if (!validation.valid) {
                    toast.error(`Signature integrity compromised: ${validation.errors.join(', ')}`, { duration: 10000 });
                    logAction('SECURITY_ALERT', 'Appointment', appointmentId, `Signature chain validation failed: ${validation.errors.join(', ')}`);
                    return;
                }
            }
            
            const procedure = fieldSettings?.procedures.find(p => p.name === aptToUpdate.type);
            
            // FIX: Added medico-legal gates before allowing appointment completion.
            if (!aptToUpdate.medHistoryVerified) {
                toast.error("Cannot complete: Patient's medical history for this session has not been affirmed.");
                return;
            }

            if (procedure?.traySetup && procedure.traySetup.length > 0 && !aptToUpdate.sterilizationVerified) {
                toast.error("Cannot complete: Sterilization for required instrument sets has not been verified.");
                return;
            }
            
            showModal('postOpHandover', { 
                appointment: aptToUpdate,
                onConfirm: async (handoverData: { handoverChain: SignatureChainEntry[] }) => {
                    await handleUpdateAppointmentStatus(appointmentId, status, { 
                        postOpVerified: true, 
                        postOpVerifiedAt: new Date().toISOString(),
                        postOpHandoverChain: handoverData.handoverChain
                    }, true);
                }
            });
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


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
                toast.info('Offline: Appointment saved locally.');
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
        
        // --- PRC & SCOPE VALIDATION GATE ---
        if (status === AppointmentStatus.TREATING && !bypassProtocol) {
            const provider = staff.find(s => s.id === aptToUpdate.providerId);
            const procedure = fieldSettings.procedures.find(p => p.name === aptToUpdate.type);
            if (provider) {
                if (isExpired(provider.prcExpiry)) {
                    toast.error(`CLINICAL AUTHORITY LOCK: Practitioner ${provider.name}'s PRC license has expired. Cannot start treatment.`);
                    return;
                }
                
                const highRiskCats = ['Surgery', 'Endodontics', 'Prosthodontics'];
                const isHighRisk = highRiskCats.includes(procedure?.category || '');
                if (isHighRisk && isExpired(provider.malpracticeExpiry)) {
                    toast.error(`INDEMNITY LOCK: ${provider.name}'s Malpractice Insurance has expired. High-risk procedure '${procedure?.name}' cannot be started.`);
                    return;
                }

                if (procedure && procedure.allowedLicenseCategories && !procedure.allowedLicenseCategories.includes(provider.licenseCategory!)) {
                     toast.error(`Scope of Practice Violation: ${procedure.name} requires a ${procedure.allowedLicenseCategories.join('/')} license. ${provider.name} is a ${provider.licenseCategory}.`);
                     return;
                }
            }
        }
        
        const patient = patients.find(p => p.id === aptToUpdate.patientId);

        // --- NEW STERILIZATION VERIFICATION GATE ---
        if (status === AppointmentStatus.TREATING && !bypassProtocol && fieldSettings.features.enableMaterialTraceability) {
            const procedure = fieldSettings.procedures.find(p => p.name === aptToUpdate.type);
            
            const reVerify = () => {
                showModal('sterilizationVerification', {
                    appointment: aptToUpdate,
                    requiredSets: procedure?.traySetup || [],
                    instrumentSets: fieldSettings.instrumentSets || [],
                    sterilizationCycles: fieldSettings.sterilizationCycles || [],
                    onConfirm: (instrumentSetIds: string[]) => {
                        handleUpdateAppointmentStatus(appointmentId, status, { 
                            ...additionalData, 
                            sterilizationVerified: true,
                            linkedInstrumentSetIds: instrumentSetIds
                        }, true);
                    }
                });
            };

            if (aptToUpdate.linkedInstrumentSetIds && aptToUpdate.linkedInstrumentSetIds.length > 0 && !aptToUpdate.sterilizationVerified) {
                toast.error("Infection Control Block: Linked instruments require re-verification for this session.");
                reVerify();
                return;
            }
            
            if (procedure?.traySetup && procedure.traySetup.length > 0) {
                reVerify();
                return; // Stop execution
            }
        }
        
        // --- NEW STATUS UPDATE LOGIC for COMPLETED ---
        if (status === AppointmentStatus.COMPLETED && aptToUpdate.linkedInstrumentSetIds && fieldSettings.features.enableMaterialTraceability) {
            const updatedSets = fieldSettings.instrumentSets?.map(set => {
                if (aptToUpdate.linkedInstrumentSetIds?.includes(set.id)) {
                    return { ...set, status: 'Used' as const };
                }
                return set;
            });
            await handleUpdateSettings({ ...fieldSettings, instrumentSets: updatedSets });
            toast.info(`${aptToUpdate.linkedInstrumentSetIds.length} instrument set(s) marked as used.`);
        }

        // MEDICAL HISTORY AFFIRMATION GATE
        if (patient && status === AppointmentStatus.ARRIVED && !aptToUpdate.medHistoryAffirmation && !additionalData.medHistoryAffirmation && !bypassProtocol) {
            showModal('medicalHistoryAffirmation', {
                patient,
                appointment: aptToUpdate,
                onConfirm: (affirmationData: any) => {
                    handleUpdateAppointmentStatus(appointmentId, status, { ...additionalData, medHistoryAffirmation: affirmationData }, true);
                }
            });
            return; // Stop execution, it will be re-triggered by the modal's confirmation
        }

        // PROTOCOL ENFORCEMENT GATE
        if (status === AppointmentStatus.TREATING && !bypassProtocol && fieldSettings.features.enableClinicalProtocolAlerts) {
            const procedure = fieldSettings.procedures.find(p => p.name === aptToUpdate.type);
    
            if (patient && procedure) {
                const { violations, rule } = checkClinicalProtocols(patient, procedure, fieldSettings.clinicalProtocolRules || []);
                
                if (violations.length > 0 && rule) {
                    showModal('protocolOverride', {
                        rule: rule,
                        onConfirm: (reason: string) => {
                            logAction('SECURITY_ALERT', 'System', patient.id, `Protocol Override: ${rule.name}. Reason: ${reason}`);
                            handleUpdateAppointmentStatus(appointmentId, status, additionalData, true); // Re-call with bypass
                        }
                    });
                    return; // Stop execution until override is confirmed
                }
            }
        }
    
        // POST-OP HANDOVER & SOAP NOTE GATE
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
                    return; // Abort.
                }
            }
            
            showModal('postOpHandover', {
                appointment: aptToUpdate,
                onConfirm: async (handoverData: { instructions: string, followUpDays: number }) => {
                    handleUpdateAppointmentStatus(appointmentId, status, { 
                        postOpVerified: true, 
                        postOpVerifiedAt: new Date().toISOString()
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


import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { Appointment, AppointmentStatus, Patient, User } from '../types';
import { APPOINTMENTS, generateUid } from '../constants';
import { useToast } from '../components/ToastSystem';
import { useAppContext } from './AppContext';
import { DataService } from '../services/dataService';
import { canTransitionTo } from '../services/appointmentStatusValidator';
import { canStartTreatment, canCompleteAppointment } from '../services/medicolegalGuard';
import { usePatient } from './PatientContext';
import { useStaff } from './StaffContext';
import { useSettings } from './SettingsContext';
import { useModal } from './ModalContext';

interface AppointmentContextType {
    appointments: Appointment[];
    handleSaveAppointment: (appointment: Appointment) => Promise<void>;
    handleUpdateAppointmentStatus: (appointmentId: string, status: AppointmentStatus, details?: any) => Promise<void>;
    handleMoveAppointment: (appointmentId: string, newDate: string, newTime: string, newProviderId: string, newResourceId?: string) => Promise<void>;
    transitionAppointmentStatus: (appointmentId: string, newStatus: AppointmentStatus) => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const AppointmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    const { isOnline, logAction, currentUser, enqueueAction } = useAppContext();
    const [appointments, setAppointments] = useState<Appointment[]>(APPOINTMENTS);
    const { patients, handleSavePatient } = usePatient();
    const { staff } = useStaff();
    const { fieldSettings, addScheduledSms } = useSettings();
    const { openModal, closeModal } = useModal();

    const handleSaveAppointment = useCallback(async (appointmentData: Appointment): Promise<void> => {
        const isNew = !appointments.some(a => a.id === appointmentData.id);

        if (!isOnline) {
            const offlineAppointment = { ...appointmentData, isPendingSync: true };
            setAppointments(prev => isNew ? [...prev, offlineAppointment] : prev.map(a => a.id === offlineAppointment.id ? offlineAppointment : a));
            await enqueueAction(isNew ? 'CREATE_APPOINTMENT' : 'UPDATE_APPOINTMENT', offlineAppointment);
            toast.info(`Offline: Appointment for "${appointmentData.type}" saved locally.`);
            return;
        }

        try {
            const updatedAppointment = await DataService.saveAppointment(appointmentData);
            setAppointments(prev => {
                return isNew ? [...prev, updatedAppointment] : prev.map(a => a.id === updatedAppointment.id ? updatedAppointment : a);
            });
            
            if (isNew && fieldSettings.features.enableSmsAutomation) {
                const procedure = fieldSettings?.procedures.find(p => p.name === appointmentData.type);
                if (procedure?.requiresConsent) {
                    const appointmentDate = new Date(appointmentData.date + 'T' + appointmentData.time);
                    const reminderDate = new Date(appointmentDate);
                    reminderDate.setDate(reminderDate.getDate() - 1);
                    
                    const patient = patients.find(p => p.id === appointmentData.patientId);
                    const provider = staff.find(s => s.id === appointmentData.providerId);

                    if (patient && provider) {
                        addScheduledSms({
                            patientId: patient.id,
                            templateId: 'pre_appointment_consent',
                            dueDate: reminderDate.toISOString(),
                            data: {
                                PatientName: patient.name,
                                ProviderName: provider.name,
                                ConsentUrl: `https://dentsched.app/consent/${appointmentData.id}` // Placeholder URL
                            }
                        });
                    }
                }
            }

            logAction(isNew ? 'CREATE' : 'UPDATE', 'Appointment', updatedAppointment.id, `Appointment for ${updatedAppointment.type} ${isNew ? 'created' : 'updated'}.`);
            toast.success(`Appointment for "${updatedAppointment.type}" saved.`);
        } catch (error) {
            console.error("Error saving appointment:", error);
            toast.error("Failed to save appointment.");
            throw error;
        }
    }, [isOnline, appointments, enqueueAction, toast, logAction, fieldSettings, patients, staff, addScheduledSms]);
    
    const handleUpdateAppointmentStatus = useCallback(async (appointmentId: string, status: AppointmentStatus, details: any = {}): Promise<void> => {
        const appointment = appointments.find(a => a.id === appointmentId);
        if (!appointment || !currentUser) return;
        
        const updatedAppointment = { 
            ...appointment, 
            status,
            statusHistory: [...(appointment.statusHistory || []), { status, timestamp: new Date().toISOString(), userId: currentUser.id, userName: currentUser.name }],
            ...details 
        };
        
        if (!isOnline) {
            const offlineUpdate = { ...updatedAppointment, isPendingSync: true };
            setAppointments(prev => prev.map(a => a.id === appointmentId ? offlineUpdate : a));
            await enqueueAction('UPDATE_STATUS', { id: appointmentId, status, details });
            toast.info(`Offline: Appointment status updated locally.`);
            return;
        }

        try {
            await DataService.saveAppointment(updatedAppointment);
            setAppointments(prev => prev.map(a => a.id === appointmentId ? updatedAppointment : a));
            logAction('UPDATE', 'Appointment', appointmentId, `Status changed from ${appointment.status} to ${status}.`);
            toast.success(`Appointment status updated to ${status}.`);
        } catch (error) {
             console.error("Error updating appointment status:", error);
            toast.error("Failed to update appointment status.");
            throw error;
        }
    }, [appointments, currentUser, isOnline, enqueueAction, toast, logAction]);

    const transitionAppointmentStatus = useCallback(async (appointmentId: string, newStatus: AppointmentStatus): Promise<void> => {
        const appointment = appointments.find(a => a.id === appointmentId);
        const patient = patients.find(p => p.id === appointment?.patientId);
        const provider = staff.find(s => s.id === appointment?.providerId);

        if (!appointment || !patient || !provider || !currentUser || !fieldSettings) {
            toast.error("Cannot change status: Required data is missing.");
            return;
        }

        if (!canTransitionTo(appointment.status, newStatus)) {
            toast.error(`Invalid workflow transition from "${appointment.status}" to "${newStatus}".`);
            return;
        }

        if (newStatus === AppointmentStatus.CANCELLED) {
            openModal('cancellation', {
                onConfirm: (reason: string) => {
                    handleUpdateAppointmentStatus(appointmentId, newStatus, { cancellationReason: reason });
                }
            });
            return;
        }

        // 2. Medico-legal Guard checks (Issue #1)
        let block;
        if (newStatus === AppointmentStatus.SEATED) {
            block = canStartTreatment(appointment, patient, provider, fieldSettings, staff);
        } else if (newStatus === AppointmentStatus.COMPLETED) {
            const procedure = fieldSettings.procedures.find(p => p.name === appointment.type);
            block = canCompleteAppointment(appointment, patient, procedure);
        }

        if (block && block.isBlocked) {
            if (block.modal) {
                let modalProps = { ...block.modal.props };

                if (block.modal.type === 'consentCapture') {
                    modalProps.onRefuse = () => {
                        closeModal(); // Close consent modal
                        setTimeout(() => openModal('informedRefusal', {
                            patient,
                            currentUser,
                            relatedEntity: {
                                type: 'Procedure',
                                entityId: block.modal.props.procedure.id,
                                entityDescription: `Refusal of Procedure: "${block.modal.props.procedure.name}"`
                            },
                            risks: block.modal.props.procedure.riskDisclosures || ['Progression of disease'],
                            alternatives: block.modal.props.procedure.alternatives || ['No treatment'],
                            recommendation: `Proceed with procedure "${block.modal.props.procedure.name}" as recommended.`,
                            onSave: (refusalData: any) => {
                                handleSavePatient({ 
                                    ...patient, 
                                    informedRefusals: [...(patient.informedRefusals || []), { ...refusalData, id: generateUid('ref'), patientId: patient.id }]
                                });
                                toast.success("Informed refusal has been documented.");
                            }
                        }), 300);
                    };
                }
                
                openModal(block.modal.type, {
                    ...modalProps,
                    onConfirm: async (data: any) => {
                         const detailsToUpdate: Partial<Appointment> = {};
                         // FIX: Also update the patient record with the latest medical history affirmation
                         // to ensure global state is current for subsequent checks.
                         if (block?.modal?.type === 'medicalHistoryAffirmation') {
                            detailsToUpdate.medHistoryAffirmation = data;
                            // Also update patient with the latest affirmation
                            await handleSavePatient({ ...patient, medHistoryAffirmation: data });
                         }
                         if (block?.modal?.type === 'safetyTimeout') detailsToUpdate.safetyChecklistChain = data;
                         if (block?.modal?.type === 'sterilizationVerification') {
                             detailsToUpdate.sterilizationVerified = true;
                             detailsToUpdate.linkedInstrumentSetIds = data;
                         }
                         if (block?.modal?.type === 'postOpHandover') detailsToUpdate.postOpHandoverChain = data.handoverChain;
                         if (block?.modal?.type === 'protocolOverride') {
                            detailsToUpdate.protocolOverrides = [...(appointment.protocolOverrides || []), { ruleId: block.modal.props.rule.id, reason: data.reason, signatureChain: data.signatureChain }];
                         }
                         
                         const updatedAppointment = { ...appointment, ...detailsToUpdate };
                         await DataService.saveAppointment(updatedAppointment);
                         setAppointments(prev => prev.map(a => a.id === appointmentId ? updatedAppointment : a));
                         
                         transitionAppointmentStatus(appointmentId, newStatus);
                    },
                    onSave: async (data: any) => {
                        if (block?.modal?.type === 'consentCapture') {
                           const updatedAppointment = { ...appointment, consentSignatureChain: data };
                           await DataService.saveAppointment(updatedAppointment);
                           setAppointments(prev => prev.map(a => a.id === appointmentId ? updatedAppointment : a));
                           transitionAppointmentStatus(appointmentId, newStatus);
                        }
                    }
                });
            } else {
                toast.error(block.reason, { duration: 10000 });
            }
            return; // Halt the transition
        }

        // 3. If all checks pass, proceed with the status update
        await handleUpdateAppointmentStatus(appointmentId, newStatus);

    }, [appointments, patients, staff, fieldSettings, toast, openModal, closeModal, currentUser, handleUpdateAppointmentStatus, handleSavePatient]);

    const handleMoveAppointment = useCallback(async (appointmentId: string, newDate: string, newTime: string, newProviderId: string, newResourceId?: string): Promise<void> => {
        const appointment = appointments.find(a => a.id === appointmentId);
        if (!appointment) return;

        const updatedAppointment: Appointment = {
            ...appointment,
            date: newDate,
            time: newTime,
            providerId: newProviderId,
            resourceId: newResourceId,
            modifiedAt: new Date().toISOString(),
        };
        
        if (!isOnline) {
             const offlineMove = { ...updatedAppointment, isPendingSync: true };
             setAppointments(prev => prev.map(a => a.id === appointmentId ? offlineMove : a));
             await enqueueAction('UPDATE_APPOINTMENT', offlineMove);
             toast.info(`Offline: Appointment moved locally.`);
             return;
        }
        
        try {
            await DataService.saveAppointment(updatedAppointment);
            setAppointments(prev => prev.map(a => a.id === appointmentId ? updatedAppointment : a));
            logAction('UPDATE', 'Appointment', appointmentId, `Rescheduled to ${newDate} at ${newTime}.`);
            toast.success(`Appointment moved successfully.`);
        } catch (error) {
            console.error("Error moving appointment:", error);
            toast.error("Failed to move appointment.");
            throw error;
        }
    }, [appointments, isOnline, enqueueAction, toast, logAction]);
    
    const value: AppointmentContextType = {
        appointments,
        handleSaveAppointment,
        handleUpdateAppointmentStatus,
        handleMoveAppointment,
        transitionAppointmentStatus,
    };

    return <AppointmentContext.Provider value={value}>{children}</AppointmentContext.Provider>;
};

export const useAppointments = () => {
    const context = useContext(AppointmentContext);
    if (context === undefined) {
        throw new Error('useAppointments must be used within an AppointmentProvider');
    }
    return context;
};
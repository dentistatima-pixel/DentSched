import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Appointment, AppointmentStatus, UserRole } from '../types';
import { APPOINTMENTS, generateUid, PROCEDURE_TO_CONSENT_MAP } from '../constants';
import { useToast } from '../components/ToastSystem';
import { useAppContext } from './AppContext';
import { useModal } from './ModalContext';
import { usePatient } from './PatientContext';
import { useSettings } from './SettingsContext';
// Fix: Import DataService to handle appointment data persistence.
import { DataService } from '../services/dataService';

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
    const { fieldSettings } = useSettings();
    const [appointments, setAppointments] = useState<Appointment[]>(APPOINTMENTS);
    
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
                onSave: (signatureUrl: string) => {
                    const finalAppointment = { ...appointmentData, signedConsentUrl: signatureUrl };
                    _finishSavingAppointment(finalAppointment);
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

    const handleUpdateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus, additionalData: Partial<Appointment> = {}): Promise<void> => {
        if (!canManageAppointments) {
            toast.error("Authorization Denied: You cannot update appointment status.");
            return;
        }
        
        const aptToUpdate = appointments.find(a => a.id === appointmentId);
        if (!aptToUpdate) {
            toast.error("Appointment not found");
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

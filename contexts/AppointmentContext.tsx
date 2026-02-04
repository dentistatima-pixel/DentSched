import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { Appointment, AppointmentStatus } from '../types';
import { APPOINTMENTS } from '../constants';
import { useToast } from '../components/ToastSystem';
import { useAppContext } from './AppContext';
import { DataService } from '../services/dataService';

interface AppointmentContextType {
    appointments: Appointment[];
    handleSaveAppointment: (appointment: Appointment) => Promise<void>;
    handleUpdateAppointmentStatus: (appointmentId: string, status: AppointmentStatus, details?: any) => Promise<void>;
    handleMoveAppointment: (appointmentId: string, newDate: string, newTime: string, newProviderId: string, newResourceId?: string) => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const AppointmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    const { isOnline, logAction, currentUser, enqueueAction } = useAppContext();
    const [appointments, setAppointments] = useState<Appointment[]>(APPOINTMENTS);

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
            toast.success(`Appointment for "${updatedAppointment.type}" saved.`);
        } catch (error) {
            console.error("Error saving appointment:", error);
            toast.error("Failed to save appointment.");
            throw error;
        }
    }, [isOnline, appointments, enqueueAction, toast]);
    
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
            toast.success(`Appointment status updated to ${status}.`);
        } catch (error) {
             console.error("Error updating appointment status:", error);
            toast.error("Failed to update appointment status.");
            throw error;
        }
    }, [appointments, currentUser, isOnline, enqueueAction, toast]);

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
            toast.success(`Appointment moved successfully.`);
        } catch (error) {
            console.error("Error moving appointment:", error);
            toast.error("Failed to move appointment.");
            throw error;
        }
    }, [appointments, isOnline, enqueueAction, toast]);
    
    const value: AppointmentContextType = {
        appointments,
        handleSaveAppointment,
        handleUpdateAppointmentStatus,
        handleMoveAppointment,
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

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Appointment } from '../types';
import { APPOINTMENTS } from '../constants';

interface AppointmentContextType {
    appointments: Appointment[];
    setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const AppointmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appointments, setAppointments] = useState<Appointment[]>(APPOINTMENTS);

    const value = { appointments, setAppointments };

    return <AppointmentContext.Provider value={value}>{children}</AppointmentContext.Provider>;
};

export const useAppointmentState = () => {
    const context = useContext(AppointmentContext);
    if (context === undefined) {
        throw new Error('useAppointmentState must be used within an AppointmentProvider');
    }
    return context;
};

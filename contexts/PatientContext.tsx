import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Patient } from '../types';
import { PATIENTS } from '../constants';

interface PatientContextType {
    patients: Patient[];
    setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [patients, setPatients] = useState<Patient[]>(PATIENTS);

    const value = { patients, setPatients };

    return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
};

export const usePatientState = () => {
    const context = useContext(PatientContext);
    if (context === undefined) {
        throw new Error('usePatientState must be used within a PatientProvider');
    }
    return context;
};

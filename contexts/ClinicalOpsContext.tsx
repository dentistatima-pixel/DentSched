
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PinboardTask, ClinicalIncident, Referral, WaitlistEntry } from '../types';
import { MOCK_WAITLIST, generateUid } from '../constants';
import { useToast } from '../components/ToastSystem';
import { usePatient } from './PatientContext';

interface ClinicalOpsContextType {
    tasks: PinboardTask[];
    incidents: ClinicalIncident[];
    referrals: Referral[];
    waitlist: WaitlistEntry[];
    handleAddTask: (text: string, isUrgent: boolean, assignedTo: string) => Promise<void>;
    handleToggleTask: (id: string) => Promise<void>;
    handleSaveIncident: (incident: Omit<ClinicalIncident, 'id'>) => Promise<void>;
    handleResolveIncident: (incidentId: string) => Promise<void>;
    handleSaveReferral: (referral: Omit<Referral, 'id'>) => Promise<void>;
    handleAddToWaitlist: (entry: Omit<WaitlistEntry, 'id' | 'patientName'>) => Promise<void>;
}

const ClinicalOpsContext = createContext<ClinicalOpsContextType | undefined>(undefined);

export const ClinicalOpsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    const { patients } = usePatient();
    const [tasks, setTasks] = useState<PinboardTask[]>([]);
    const [incidents, setIncidents] = useState<ClinicalIncident[]>([]);
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(MOCK_WAITLIST);
    
    const createAsyncHandler = <T extends any[]>(handler: (...args: T) => void, successMsg?: string) => {
        return async (...args: T): Promise<void> => {
            try {
                handler(...args);
                if (successMsg) toast.success(successMsg);
            } catch (e: any) {
                toast.error(e.message || "An unexpected error occurred.");
            }
        };
    };

    const handleAddTask = async (text: string, isUrgent: boolean, assignedTo: string) => {
        setTasks(t => [...t, { id: generateUid('task'), text, isUrgent, assignedTo, isCompleted: false }]);
    };
    
    const value = { 
        tasks, 
        incidents, 
        referrals, 
        waitlist, 
        handleAddTask,
        handleToggleTask: createAsyncHandler((id: string) => setTasks(t => t.map(i => i.id === id ? { ...i, isCompleted: !i.isCompleted } : i))),
        handleSaveIncident: createAsyncHandler((incident: Omit<ClinicalIncident, 'id'>) => setIncidents(i => [...i, { id: generateUid('inc'), ...incident }]), "Incident logged."),
        handleResolveIncident: createAsyncHandler((incidentId: string) => {
            setIncidents(i => i.map(inc => inc.id === incidentId ? { ...inc, advisoryCallSigned: true } : inc));
        }, "Incident resolved and logged."),
        handleSaveReferral: createAsyncHandler((referral: Omit<Referral, 'id'>) => setReferrals(r => [...r, { id: generateUid('ref'), ...referral }]), "Referral saved."),
        handleAddToWaitlist: createAsyncHandler((entry: Omit<WaitlistEntry, 'id' | 'patientName'>) => { const patientName = patients.find(p => p.id === entry.patientId)?.name || 'Unknown'; setWaitlist(w => [...w, { id: generateUid('wl'), patientName, ...entry }]); }, "Added to waitlist."),
    };
    
    return <ClinicalOpsContext.Provider value={value}>{children}</ClinicalOpsContext.Provider>;
};

export const useClinicalOps = () => {
    const context = useContext(ClinicalOpsContext);
    if (context === undefined) {
        throw new Error('useClinicalOps must be used within a ClinicalOpsProvider');
    }
    return context;
};

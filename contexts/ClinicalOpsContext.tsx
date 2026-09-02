
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { PinboardTask, ClinicalIncident, Referral, WaitlistEntry } from '../types';
import { MOCK_WAITLIST, generateUid } from '../constants';
import { useToast } from '../components/ToastSystem';
import { usePatient } from './PatientContext';
import { useAppContext } from './AppContext';

interface ClinicalOpsContextType {
    tasks: PinboardTask[];
    incidents: ClinicalIncident[];
    referrals: Referral[];
    waitlist: WaitlistEntry[];
    handleAddTask: (text: string, isUrgent: boolean, assignedTo: string, patientId?: string) => Promise<void>;
    handleToggleTask: (id: string) => Promise<void>;
    handleClearCompletedTasks: (userId: string) => Promise<void>;
    handleSaveIncident: (incident: Omit<ClinicalIncident, 'id'>) => Promise<void>;
    handleResolveIncident: (incidentId: string) => Promise<void>;
    handleSaveReferral: (referral: Omit<Referral, 'id'>) => Promise<void>;
    handleAddToWaitlist: (entry: Omit<WaitlistEntry, 'id' | 'patientName'>) => Promise<void>;
}

const ClinicalOpsContext = createContext<ClinicalOpsContextType | undefined>(undefined);

export const ClinicalOpsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    const { patients } = usePatient();
    const { currentUser } = useAppContext();
    const [tasks, setTasks] = useState<PinboardTask[]>([]);
    const [incidents, setIncidents] = useState<ClinicalIncident[]>([]);
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(MOCK_WAITLIST);
    
    useEffect(() => {
        const checkBreachDeadlines = () => {
          incidents.forEach(incident => {
            if (incident.isDataBreach && incident.breachDetails && incident.breachDetails.npcDeadline) {
              const deadline = new Date(incident.breachDetails.npcDeadline);
              const now = new Date();
              const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
              
              if (hoursRemaining <= 24 && hoursRemaining > 0 && !incident.breachDetails.npcNotifiedAt) {
                toast.error(`URGENT: NPC notification deadline in ${Math.floor(hoursRemaining)} hours for breach ${incident.id}`);
              }
              
              if (hoursRemaining <= 0 && !incident.breachDetails.npcNotifiedAt && incident.breachDetails.npcNotificationStatus !== 'Filed' && incident.breachDetails.npcNotificationStatus !== 'Late Filing') {
                toast.error(`LEGAL VIOLATION: NPC notification deadline passed for breach ${incident.id}`);
                // In a real app, you would also update the incident status here to prevent re-firing alerts
              }
            }
          });
        };
      
        const interval = setInterval(checkBreachDeadlines, 3600000); // Check hourly
        return () => clearInterval(interval);
      }, [incidents, toast]);

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

    const handleAddTask = async (text: string, isUrgent: boolean, assignedTo: string, patientId?: string) => {
        if (!currentUser) return;
        const newTask: PinboardTask = {
            id: generateUid('task'),
            text,
            isCompleted: false,
            isUrgent,
            assignedTo,
            createdBy: currentUser.id,
            patientId,
        };
        setTasks(t => [newTask, ...t]);
    };

    const handleToggleTask = async (id: string) => {
        const originalTasks = tasks;
        // Optimistically update UI
        setTasks(t => t.map(i => i.id === id ? { ...i, isCompleted: !i.isCompleted } : i));

        try {
            // Simulate async operation
            await new Promise(resolve => setTimeout(resolve, 500));
            // Simulate a failure for testing
            if (Math.random() > 0.8) {
                throw new Error("Failed to sync task update.");
            }
        } catch (error) {
            // Revert on failure
            setTasks(originalTasks);
            toast.error("Couldn't update task. Please try again.");
        }
    };

    const handleClearCompletedTasks = async (userId: string) => {
        setTasks(prevTasks => prevTasks.filter(t => !(t.assignedTo === userId && t.isCompleted)));
        toast.info("Completed tasks cleared from pinboard.");
    };
    
    const handleSaveIncident = async (incident: Omit<ClinicalIncident, 'id'>) => {
        let incidentToSave: ClinicalIncident = { id: generateUid('inc'), ...incident } as ClinicalIncident;
        if (incidentToSave.isDataBreach && incidentToSave.breachDetails) {
            const discovery = new Date();
            const deadline = new Date(discovery);
            deadline.setHours(deadline.getHours() + 72);
            incidentToSave.breachDetails = {
                ...incidentToSave.breachDetails,
                discoveryTimestamp: discovery.toISOString(),
                npcDeadline: deadline.toISOString(),
                npcNotificationStatus: 'Pending',
            };
        }
        setIncidents(i => [incidentToSave, ...i]);
        toast.success("Incident logged successfully.");
    };

    const value = { 
        tasks, 
        incidents, 
        referrals, 
        waitlist, 
        handleAddTask,
        handleToggleTask,
        handleClearCompletedTasks,
        handleSaveIncident,
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

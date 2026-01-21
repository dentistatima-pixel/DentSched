
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Patient, RecallStatus, ConsentCategory, DentalChartEntry, LedgerEntry, UserRole, TreatmentPlan, TreatmentPlanStatus } from '../types';
import { PATIENTS, generateUid } from '../constants';
import { useAppContext } from './AppContext';
import { useToast } from '../components/ToastSystem';
import { useSettings } from './SettingsContext';

const generateDiff = (oldObj: any, newObj: any): string => {
    if (!oldObj) return 'Created record';
    const changes: string[] = [];
    const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    const ignoredKeys = ['lastDigitalUpdate', 'lastPrintedDate', 'dentalChart', 'ledger', 'perioChart', 'treatmentPlans', 'files', 'timestamp', 'isVerifiedTimestamp', 'hash', 'previousHash']; 

    keys.forEach(key => {
        if (ignoredKeys.includes(key)) return;
        const oldVal = JSON.stringify(oldObj[key]);
        const newVal = JSON.stringify(newObj[key]);
        if (oldVal !== newVal) {
            const formattedOld = typeof oldObj[key] === 'object' ? '...' : String(oldObj[key]);
            const formattedNew = typeof newObj[key] === 'object' ? '...' : String(newObj[key]);
            changes.push(`${key}: ${formattedOld} -> ${formattedNew}`);
        }
    });
    return changes.length === 0 ? 'Updated complex fields' : changes.join('; ');
};


interface PatientContextType {
    patients: Patient[];
    handleSavePatient: (patientData: Partial<Patient>) => Promise<void>;
    handlePurgePatient: (patientId: string) => Promise<void>;
    handleUpdatePatientRecall: (patientId: string, status: RecallStatus) => Promise<void>;
    handleDeleteClinicalNote: (patientId: string, noteId: string) => Promise<void>;
    handleSupervisorySeal: (noteToSeal: DentalChartEntry) => Promise<void>;
    handleConfirmRevocation: (patient: Patient, category: ConsentCategory, reason: string, notes: string) => Promise<void>;
    handleRecordPaymentWithReceipt: (patientId: string, paymentDetails: { description: string; date: string; amount: number; orNumber: string; }) => Promise<void>;
    handleApproveFinancialConsent: (patientId: string, planId: string, signature: string) => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    const { isOnline, logAction, currentUser, isAuthorityLocked } = useAppContext();
    const { fieldSettings, setFieldSettings } = useSettings();
    const [patients, setPatients] = useState<Patient[]>(PATIENTS);
    const [offlineQueue, setOfflineQueue] = useState<any[]>([]); // Simplified for this context
    
    const canManagePatients = useMemo(() => {
        if (!currentUser) return false;
        return [UserRole.ADMIN, UserRole.SYSTEM_ARCHITECT, UserRole.DENTIST].includes(currentUser.role);
    }, [currentUser]);

    const canManageFinancials = useMemo(() => {
        if (!currentUser) return false;
        return [UserRole.ADMIN, UserRole.SYSTEM_ARCHITECT].includes(currentUser.role);
    }, [currentUser]);
    
    const scopedPatients = useMemo(() => {
        if (!currentUser) return [];

        if (currentUser.role === UserRole.DENTAL_ASSISTANT) {
            return patients.map(p => {
                const { ledger, currentBalance, ...rest } = p;
                const patientWithoutFinancials: Patient = { 
                  ...rest,
                  currentBalance: undefined,
                  ledger: undefined,
                };
                return patientWithoutFinancials;
            });
        }
        
        return patients;
    }, [patients, currentUser]);

    const createAsyncHandler = <T extends any[]>(handler: (...args: T) => void, successMsg?: string) => {
        return async (...args: T): Promise<void> => {
            try {
                await new Promise(res => setTimeout(res, 100)); // Simulate async
                handler(...args);
                if (successMsg) toast.success(successMsg);
            } catch (e: any) {
                console.error("Async handler failed:", e);
                toast.error(e.message || "An unexpected error occurred.");
            }
        };
    };

    const handleSavePatient = async (patientData: Partial<Patient>): Promise<void> => {
        try {
            if (!canManagePatients) {
                toast.error("Authorization Denied: Your role cannot modify patient records.");
                throw new Error("Authorization Denied");
            }
            if (isAuthorityLocked) {
                toast.error("CLINICAL AUTHORITY LOCKED: Your credentials have expired. Data modification is disabled.");
                throw new Error("Authority Locked");
            }
            const isNew = !patientData.id || !patients.some(p => p.id === patientData.id);
            const finalPatientId = isNew ? generateUid('p_offline') : patientData.id!;
            const oldPatient = isNew ? null : patients.find(p => p.id === finalPatientId);
            
            const finalPatient = (isNew 
                ? { ...patientData, id: finalPatientId, isPendingSync: !isOnline } 
                : { ...oldPatient, ...patientData, isPendingSync: !isOnline }
            ) as Patient;

            setPatients(prev => isNew ? [...prev, finalPatient] : prev.map(p => p.id === finalPatient.id ? finalPatient : p));
            
            if (!isOnline) {
                setOfflineQueue(prev => [...prev, { id: generateUid('sync'), action: isNew ? 'REGISTER_PATIENT' : 'UPDATE_PATIENT', payload: finalPatient, timestamp: new Date().toISOString() }]);
                toast.info(`Offline: Patient "${finalPatient.name}" saved locally.`);
            } else {
                await new Promise(resolve => setTimeout(resolve, 300));
                setPatients(prev => prev.map(p => p.id === finalPatientId ? { ...p, isPendingSync: false } : p));
                logAction(isNew ? 'CREATE' : 'UPDATE', 'Patient', finalPatient.id, generateDiff(oldPatient, finalPatient));
                toast.success(`Patient "${finalPatient.name}" saved.`);
            }
        } catch (error) {
            if (!(error instanceof Error && error.message.includes("Authorization Denied")) && !(error instanceof Error && error.message === "Authority Locked")) {
                console.error("Error saving patient:", error);
                toast.error("Failed to save patient record.");
            }
        }
    };
    
    const handleRecordPaymentWithReceipt = async (patientId: string, paymentDetails: { description: string; date: string; amount: number; orNumber: string; }): Promise<void> => {
        try {
            if (!canManageFinancials) {
                 toast.error("Authorization Denied: Your role cannot record payments.");
                 throw new Error("Authorization Denied");
            }
            if (!currentUser) throw new Error("No authenticated user.");
            const patient = patients.find(p => p.id === patientId);
            if (!patient) throw new Error("Patient not found");
            if (!fieldSettings) throw new Error("Settings not found");

            const currentBalance = patient.currentBalance || 0;
            const newBalance = currentBalance - paymentDetails.amount;
            
            const newLedgerEntry: LedgerEntry = {
                id: generateUid('l'), date: paymentDetails.date, description: paymentDetails.description, type: 'Payment',
                amount: paymentDetails.amount, balanceAfter: newBalance, orNumber: paymentDetails.orNumber, orDate: paymentDetails.date,
            };

            const updatedPatient = { ...patient, ledger: [...(patient.ledger || []), newLedgerEntry], currentBalance: newBalance };
            
            setPatients(prev => prev.map(p => p.id === patientId ? updatedPatient : p));

            const nextOr = parseInt(paymentDetails.orNumber) + 1;
            if (!isNaN(nextOr)) {
                const newSettings = { ...fieldSettings, taxConfig: { ...fieldSettings.taxConfig, nextOrNumber: nextOr } };
                setFieldSettings(newSettings);
            }
            
            logAction('CREATE', 'LedgerEntry', newLedgerEntry.id, `Recorded payment with OR# ${paymentDetails.orNumber}`);
            toast.success(`Payment with OR# ${paymentDetails.orNumber} recorded.`);
        } catch (e: any) {
            if (!(e instanceof Error && e.message.includes("Authorization Denied"))) {
                 toast.error(`Failed to record payment: ${e.message}`);
            }
        }
    };

    const handleApproveFinancialConsent = async (patientId: string, planId: string, signature: string): Promise<void> => {
        const patientToUpdate = patients.find(p => p.id === patientId);
        if (!patientToUpdate) throw new Error("Patient not found for consent approval.");
    
        const planToUpdate = patientToUpdate.treatmentPlans?.find(p => p.id === planId);
        if (!planToUpdate) throw new Error("Treatment plan not found for consent approval.");
    
        const updatedPlan: TreatmentPlan = {
            ...planToUpdate,
            status: TreatmentPlanStatus.APPROVED,
            financialConsentSignature: signature
        };
        
        const updatedPlans = patientToUpdate.treatmentPlans?.map(p => p.id === planId ? updatedPlan : p) || [];
        
        const updatedPatient: Partial<Patient> = {
            ...patientToUpdate,
            treatmentPlans: updatedPlans
        };
    
        await handleSavePatient(updatedPatient);
        toast.success(`Financial consent for "${planToUpdate.name}" approved and sealed.`);
    };

    const value: PatientContextType = {
        patients: scopedPatients,
        handleSavePatient,
        handleRecordPaymentWithReceipt,
        handleApproveFinancialConsent,
        handlePurgePatient: createAsyncHandler((patientId: string) => { setPatients(p => p.filter(i => i.id !== patientId)); logAction('SECURITY_ALERT', 'Patient', patientId, 'Patient record permanently purged.'); }, "Patient record purged."),
        handleUpdatePatientRecall: createAsyncHandler((patientId: string, status: RecallStatus) => setPatients(p => p.map(i => i.id === patientId ? { ...i, recallStatus: status } : i)), "Recall status updated."),
        handleDeleteClinicalNote: createAsyncHandler((patientId: string, noteId: string) => { setPatients(p => p.map(patient => patient.id === patientId ? { ...patient, dentalChart: patient.dentalChart?.filter(note => note.id !== noteId) } : patient)); }, "Clinical note deleted."),
        handleSupervisorySeal: createAsyncHandler((noteToSeal: DentalChartEntry) => { if(!currentUser) return; setPatients(p => p.map(patient => (patient.dentalChart?.some(note => note.id === noteToSeal.id)) ? { ...patient, dentalChart: patient.dentalChart.map(note => note.id === noteToSeal.id ? { ...note, isPendingSupervision: false, supervisorySeal: { dentistId: currentUser.id, dentistName: currentUser.name, timestamp: new Date().toISOString(), hash: 'sealed' } } : note) } : patient)); }, "Note sealed under supervision."),
        handleConfirmRevocation: createAsyncHandler((patient: Patient, category: ConsentCategory, reason: string, notes: string) => { setPatients(p => p.map(pat => pat.id === patient.id ? { ...pat, consentLogs: [...(pat.consentLogs || []), { category: category, status: 'Revoked', timestamp: new Date().toISOString(), version: '1.0'}] } : pat)); logAction('SECURITY_ALERT', 'Patient', patient.id, `Consent Revoked for category: ${category}. Reason: ${reason}`); }, "Consent revoked."),
    };

    return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
};

export const usePatient = () => {
    const context = useContext(PatientContext);
    if (context === undefined) {
        throw new Error('usePatient must be used within a PatientProvider');
    }
    return context;
};

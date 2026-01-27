import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { Patient, RecallStatus, ConsentCategory, DentalChartEntry, LedgerEntry, UserRole, TreatmentPlan, TreatmentPlanStatus } from '../types';
import { generateUid, formatDate } from '../constants';
import { useAppContext } from './AppContext';
import { useToast } from '../components/ToastSystem';
import { useSettings } from './SettingsContext';
import { DataService } from '../services/dataService';

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
    handleSupervisorySeal: (patientId: string, noteToSeal: DentalChartEntry) => Promise<void>;
    handleConfirmRevocation: (patient: Patient, category: ConsentCategory, reason: string, notes: string) => Promise<void>;
    handleRecordPaymentWithReceipt: (patientId: string, paymentDetails: { description: string; date: string; amount: number; orNumber: string; }) => Promise<void>;
    handleApproveFinancialConsent: (patientId: string, planId: string, signature: string) => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    const { isOnline, logAction, currentUser, isAuthorityLocked } = useAppContext();
    const { fieldSettings, setFieldSettings, addScheduledSms } = useSettings();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [offlineQueue, setOfflineQueue] = useState<any[]>([]); // Simplified for this context
    
    useEffect(() => {
        DataService.getPatients().then(setPatients).catch(err => {
            toast.error("Failed to load patient data.");
            console.error(err);
        });
    }, []);

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

    const handleSavePatient = async (patientData: Partial<Patient>): Promise<void> => {
        if (!canManagePatients) {
            toast.error("Authorization Denied: Your role cannot modify patient records.");
            throw new Error("Authorization Denied");
        }
        if (isAuthorityLocked) {
            toast.error("CLINICAL AUTHORITY LOCKED: Your credentials have expired. Data modification is disabled.");
            throw new Error("Authority Locked");
        }

        try {
            const oldPatient = patients.find(p => p.id === patientData.id) || null;
            const updatedPatient = await DataService.savePatient(patientData);

            setPatients(prev => {
                const isNew = !prev.some(p => p.id === updatedPatient.id);
                return isNew ? [...prev, updatedPatient] : prev.map(p => p.id === updatedPatient.id ? updatedPatient : p);
            });

            logAction(oldPatient ? 'UPDATE' : 'CREATE', 'Patient', updatedPatient.id, generateDiff(oldPatient, updatedPatient));
            toast.success(`Patient "${updatedPatient.name}" saved.`);
        } catch (error) {
             console.error("Error saving patient:", error);
             toast.error("Failed to save patient record.");
             throw error;
        }
    };
    
    const handleRecordPaymentWithReceipt = async (patientId: string, paymentDetails: { description: string; date: string; amount: number; orNumber: string; }): Promise<void> => {
        if (!canManageFinancials) {
             toast.error("Authorization Denied: Your role cannot record payments.");
             throw new Error("Authorization Denied");
        }
        const patient = patients.find(p => p.id === patientId);
        if (!patient || !fieldSettings) throw new Error("Patient or settings not found");

        const currentBalance = patient.currentBalance || 0;
        const newBalance = currentBalance - paymentDetails.amount;
        
        const newLedgerEntry: LedgerEntry = {
            id: generateUid('l'), date: paymentDetails.date, description: paymentDetails.description, type: 'Payment',
            amount: paymentDetails.amount, balanceAfter: newBalance, orNumber: paymentDetails.orNumber, orDate: paymentDetails.date,
        };

        await handleSavePatient({ ...patient, ledger: [...(patient.ledger || []), newLedgerEntry], currentBalance: newBalance });
        
        const nextOr = parseInt(paymentDetails.orNumber) + 1;
        if (!isNaN(nextOr)) {
            const newSettings = { ...fieldSettings, taxConfig: { ...fieldSettings.taxConfig, nextOrNumber: nextOr } };
            setFieldSettings(newSettings); // This should be updated via its own context handler
        }
        
        addScheduledSms({
            patientId, templateId: 'payment_receipt', dueDate: new Date().toISOString(),
            data: { Amount: `PHP ${paymentDetails.amount.toLocaleString()}`, Date: formatDate(paymentDetails.date), Balance: `PHP ${newBalance.toLocaleString()}`, ORNumber: paymentDetails.orNumber, }
        });
    };

    const handleApproveFinancialConsent = async (patientId: string, planId: string, signature: string): Promise<void> => {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;
        const updatedPlans = patient.treatmentPlans?.map(p => p.id === planId ? { ...p, status: TreatmentPlanStatus.APPROVED, financialConsentSignature: signature } : p);
        await handleSavePatient({ ...patient, treatmentPlans: updatedPlans });
        toast.success("Financial consent approved.");
    };

    const handlePurgePatient = async (patientId: string) => {
        setPatients(p => p.filter(i => i.id !== patientId));
        logAction('SECURITY_ALERT', 'Patient', patientId, 'Patient record permanently purged.');
        toast.success("Patient record purged.");
    };

    const handleUpdatePatientRecall = async (patientId: string, status: RecallStatus) => {
        const patient = patients.find(p => p.id === patientId);
        if(patient) await handleSavePatient({ ...patient, recallStatus: status });
    };

    const handleDeleteClinicalNote = async (patientId: string, noteId: string) => {
        const patient = patients.find(p => p.id === patientId);
        if(patient) await handleSavePatient({ ...patient, dentalChart: patient.dentalChart?.filter(note => note.id !== noteId) });
        toast.info("Clinical note deleted.");
    };
    
    const handleSupervisorySeal = async (patientId: string, noteToSeal: DentalChartEntry) => {
        if(!currentUser) return;
        const patient = patients.find(p => p.id === patientId);
        if(patient) {
            const updatedChart = patient.dentalChart?.map(note => note.id === noteToSeal.id ? { ...note, isPendingSupervision: false, supervisorySeal: { dentistId: currentUser.id, dentistName: currentUser.name, timestamp: new Date().toISOString(), hash: 'sealed' } } : note);
            await handleSavePatient({ ...patient, dentalChart: updatedChart });
            toast.success("Note sealed under supervision.");
        }
    };
    
    const handleConfirmRevocation = async (patient: Patient, category: ConsentCategory, reason: string, notes: string) => {
        const updatedLogs = [...(patient.consentLogs || []), { category, status: 'Revoked' as const, timestamp: new Date().toISOString(), version: fieldSettings.currentPrivacyVersion }];
        await handleSavePatient({ ...patient, consentLogs: updatedLogs });
        logAction('SECURITY_ALERT', 'Patient', patient.id, `Consent Revoked for category: ${category}. Reason: ${reason}`);
        toast.warning(`Consent for ${category} has been revoked.`);
    };

    const value: PatientContextType = {
        patients: scopedPatients,
        handleSavePatient,
        handleRecordPaymentWithReceipt,
        handleApproveFinancialConsent,
        handlePurgePatient,
        handleUpdatePatientRecall,
        handleDeleteClinicalNote,
        handleSupervisorySeal,
        handleConfirmRevocation,
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

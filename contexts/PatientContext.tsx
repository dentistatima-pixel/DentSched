
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useReducer } from 'react';
import { Patient, RecallStatus, ConsentCategory, DentalChartEntry, LedgerEntry, UserRole, TreatmentPlan, TreatmentPlanStatus, InformedRefusal } from '../types';
import { generateUid, formatDate } from '../constants';
import { useAppContext } from './AppContext';
import { useToast } from '../components/ToastSystem';
import { useSettings } from './SettingsContext';
import { DataService } from '../services/dataService';

// --- START: REDUCER LOGIC ---
type PatientAction =
  | { type: 'SET_PATIENTS'; payload: Patient[] }
  | { type: 'ADD_PATIENT'; payload: Patient }
  | { type: 'UPDATE_PATIENT'; payload: Partial<Patient> & { id: string } };

const patientReducer = (state: Patient[], action: PatientAction): Patient[] => {
  switch (action.type) {
    case 'SET_PATIENTS':
      return action.payload;
    case 'ADD_PATIENT':
      return [...state, action.payload];
    case 'UPDATE_PATIENT':
      return state.map(patient =>
        patient.id === action.payload.id
          ? { ...patient, ...action.payload }
          : patient
      );
    default:
      return state;
  }
};
// --- END: REDUCER LOGIC ---

const generateDiff = (oldObj: any, newObj: any): string => {
    if (!oldObj) return 'Created record';
    const changes: string[] = [];
    const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    const ignoredKeys = ['lastDigitalUpdate', 'lastPrintedDate', 'dentalChart', 'ledger', 'perioChart', 'treatmentPlans', 'files', 'timestamp', 'isVerifiedTimestamp', 'hash', 'previousHash', 'isPendingSync']; 

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
    isLoading: boolean;
    handleSavePatient: (patientData: Partial<Patient>) => Promise<void>;
    handleAnonymizePatient: (patientId: string) => Promise<void>;
    handleUpdatePatientRecall: (patientId: string, status: RecallStatus) => Promise<void>;
    handleDeleteClinicalNote: (patientId: string, noteId: string) => Promise<void>;
    handleSupervisorySeal: (patientId: string, noteToSeal: DentalChartEntry) => Promise<void>;
    handleConfirmRevocation: (patient: Patient, category: ConsentCategory, reason: string, notes: string) => Promise<void>;
    handleRecordPaymentWithReceipt: (patientId: string, paymentDetails: { description: string; date: string; amount: number; orNumber: string; }) => Promise<void>;
    handleApproveFinancialConsent: (patientId: string, planId: string, signature: string) => Promise<void>;
    handleSaveInformedRefusal: (patientId: string, refusal: Omit<InformedRefusal, 'id' | 'patientId'>) => Promise<void>;
    handleVoidNote: (patientId: string, noteId: string, reason: string) => Promise<string | null>;
    handlePatientSignOffOnNote: (patientId: string, noteId: string, signature: string) => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    const { isOnline, logAction, currentUser, isAuthorityLocked, enqueueAction } = useAppContext();
    const { fieldSettings, handleUpdateSettings, addScheduledSms } = useSettings();
    const [patients, dispatch] = useReducer(patientReducer, []);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        setIsLoading(true);
        DataService.getPatients().then(data => {
            dispatch({ type: 'SET_PATIENTS', payload: data });
        }).catch(err => {
            toast.error("Failed to load patient data.");
            console.error(err);
        }).finally(() => setIsLoading(false));
    }, [toast]);

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
        
        const isNew = !patientData.id || !patients.some(p => p.id === patientData.id);
        const oldPatient = isNew ? null : patients.find(p => p.id === patientData.id);
        const fullName = ('firstName' in patientData && 'surname' in patientData) 
            ? `${patientData.firstName || ''} ${patientData.middleName || ''} ${patientData.surname || ''}`.replace(/\s+/g, ' ').trim() 
            : oldPatient?.name;

        if (!isOnline) {
            const offlinePatient = { ...patientData, name: fullName, isPendingSync: true } as Patient;
            
            if (isNew) {
                dispatch({ type: 'ADD_PATIENT', payload: offlinePatient });
            } else {
                dispatch({ type: 'UPDATE_PATIENT', payload: offlinePatient as Partial<Patient> & { id: string } });
            }
            await enqueueAction(isNew ? 'REGISTER_PATIENT' : 'UPDATE_PATIENT', offlinePatient);
            toast.info(`Offline: Patient "${offlinePatient.name}" saved locally.`);
            return;
        }

        try {
            const patientToSave = { ...patientData, name: fullName };
            const updatedPatient = await DataService.savePatient(patientToSave);

            if (isNew) {
                dispatch({ type: 'ADD_PATIENT', payload: updatedPatient });
            } else {
                dispatch({ type: 'UPDATE_PATIENT', payload: updatedPatient as Partial<Patient> & { id: string } });
            }

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

        await handleSavePatient({ id: patient.id, ledger: [...(patient.ledger || []), newLedgerEntry], currentBalance: newBalance });
        
        const nextOr = parseInt(paymentDetails.orNumber) + 1;
        if (!isNaN(nextOr)) {
            const newSettings = { ...fieldSettings, taxConfig: { ...fieldSettings.taxConfig, nextOrNumber: nextOr } };
            await handleUpdateSettings(newSettings);
        }
        
        addScheduledSms({
            patientId, templateId: 'payment_receipt', dueDate: new Date().toISOString(),
            data: { Amount: `PHP ${paymentDetails.amount.toLocaleString()}`, Date: formatDate(paymentDetails.date), Balance: `PHP ${newBalance.toLocaleString()}`, ORNumber: paymentDetails.orNumber, }
        });
    };

    const handleApproveFinancialConsent = async (patientId: string, planId: string, signature: string): Promise<void> => {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;
        const updatedPlans = patient.treatmentPlans?.map(p => 
            p.id === planId 
            ? { ...p, status: TreatmentPlanStatus.APPROVED, financialConsentSignature: signature, financialConsentTimestamp: new Date().toISOString() } 
            : p
        );
        await handleSavePatient({ id: patient.id, treatmentPlans: updatedPlans });
        toast.success("Financial consent approved.");
    };

    const handleAnonymizePatient = async (patientId: string): Promise<void> => {
        const patientToAnonymize = patients.find(p => p.id === patientId);
        if (!patientToAnonymize) {
            toast.error("Patient not found for anonymization.");
            return;
        }

        const anonymizedPatient: Partial<Patient> & { id: string } = {
            ...patientToAnonymize,
            isAnonymized: true,
            name: `ANONYMIZED-${patientId}`,
            firstName: 'ANONYMIZED',
            surname: `PATIENT-${patientId}`,
            middleName: '',
            suffix: '',
            nickname: '',
            phone: '000-000-0000',
            email: `${patientId}@anonymized.local`,
            homeAddress: 'REDACTED',
            city: 'REDACTED',
            barangay: 'REDACTED',
            homeNumber: '',
            officeNumber: '',
            faxNumber: '',
            occupation: 'REDACTED',
            insuranceProvider: '',
            insuranceNumber: '',
            guardianProfile: undefined,
            referredById: undefined,
            responsibleParty: undefined,
            previousDentist: 'REDACTED',
            physicianName: 'REDACTED',
            physicianSpecialty: 'REDACTED',
            physicianAddress: 'REDACTED',
            physicianNumber: 'REDACTED',
            registrationSignature: undefined,
            registrationSignatureTimestamp: undefined,
            registrationPhotoHash: undefined,
            familyGroupId: undefined,
        };

        // Re-use handleSavePatient to persist the changes
        await handleSavePatient(anonymizedPatient);
        logAction('SECURITY_ALERT', 'Patient', patientId, 'Patient record anonymized (Right to Erasure).');
        toast.success("Patient record has been successfully anonymized.");
    };

    const handleUpdatePatientRecall = async (patientId: string, status: RecallStatus) => {
        await handleSavePatient({ id: patientId, recallStatus: status });
    };

    const handleDeleteClinicalNote = async (patientId: string, noteId: string) => {
        const patient = patients.find(p => p.id === patientId);
        if(patient) await handleSavePatient({ id: patient.id, dentalChart: patient.dentalChart?.filter(note => note.id !== noteId) });
        toast.info("Clinical note deleted.");
    };
    
    const handleSupervisorySeal = async (patientId: string, noteToSeal: DentalChartEntry) => {
        if(!currentUser) return;
        const patient = patients.find(p => p.id === patientId);
        if(patient) {
            const updatedChart = patient.dentalChart?.map(note => note.id === noteToSeal.id ? { ...note, isPendingSupervision: false, supervisorySeal: { dentistId: currentUser.id, dentistName: currentUser.name, timestamp: new Date().toISOString(), hash: 'sealed' } } : note);
            await handleSavePatient({ id: patient.id, dentalChart: updatedChart });
            toast.success("Note sealed under supervision.");
        }
    };
    
    const handleConfirmRevocation = async (patient: Patient, category: ConsentCategory, reason: string, notes: string) => {
        const timestamp = new Date().toISOString();
        const updatedLogs = [...(patient.consentLogs || []), { 
            category, 
            status: 'Revoked' as const, 
            timestamp, 
            version: fieldSettings.currentPrivacyVersion,
            expiryDate: timestamp 
        }];
        await handleSavePatient({ id: patient.id, consentLogs: updatedLogs });
        logAction('SECURITY_ALERT', 'Patient', patient.id, `Consent Revoked for category: ${category}. Reason: ${reason}`);
        toast.warning(`Consent for ${category} has been revoked.`);
    };
    
    const handleSaveInformedRefusal = async (patientId: string, refusalData: Omit<InformedRefusal, 'id' | 'patientId'>) => {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) {
            toast.error("Patient not found to save informed refusal.");
            return;
        }

        const newRefusal: InformedRefusal = {
            ...refusalData,
            id: generateUid('ref'),
            patientId: patientId,
        };

        await handleSavePatient({
            id: patient.id,
            informedRefusals: [...(patient.informedRefusals || []), newRefusal],
        });
        logAction('CREATE', 'InformedRefusal', newRefusal.id, `Documented refusal for: ${refusalData.relatedEntity.entityDescription}`);
    };

    const handleVoidNote = async (patientId: string, noteId: string, reason: string): Promise<string | null> => {
        if (!currentUser) return null;
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return null;

        let newNoteId: string | null = null;
        const newChart = patient.dentalChart?.map(note => {
            if (note.id === noteId) {
                const amendment = { ...note };
                // Create amendment
                delete amendment.id;
                delete amendment.sealedAt;
                delete amendment.sealedHash;
                delete amendment.isVoided;
                delete amendment.voidDetails;
                amendment.originalNoteId = note.id;
                amendment.id = generateUid('dca'); // amendment ID
                newNoteId = amendment.id;

                // Void original
                const voidedNote = {
                    ...note,
                    isVoided: true,
                    voidDetails: {
                        reason,
                        userId: currentUser.id,
                        userName: currentUser.name,
                        timestamp: new Date().toISOString(),
                    }
                };
                
                return [voidedNote, amendment];
            }
            return note;
        }).flat() as DentalChartEntry[];

        await handleSavePatient({ id: patient.id, dentalChart: newChart });
        logAction('SECURITY_ALERT', 'ClinicalNote', noteId, `Note VOIDED and amended. Reason: ${reason}. New note is ${newNoteId}`);
        toast.success("Note amended. Please complete and save the new version.");
        return newNoteId;
    };
    
    const handlePatientSignOffOnNote = async (patientId: string, noteId: string, signature: string) => {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;
        const newChart = patient.dentalChart?.map(note => {
            if (note.id === noteId) {
                return {
                    ...note,
                    patientSignature: signature,
                    patientSignatureTimestamp: new Date().toISOString(),
                };
            }
            return note;
        });
        await handleSavePatient({ id: patient.id, dentalChart: newChart });
        logAction('SIGN', 'ClinicalNote', noteId, 'Patient sign-off captured for completed procedure.');
        toast.success("Patient sign-off recorded.");
    };

    const value: PatientContextType = {
        patients: scopedPatients,
        isLoading,
        handleSavePatient,
        handleRecordPaymentWithReceipt,
        handleApproveFinancialConsent,
        handleAnonymizePatient,
        handleUpdatePatientRecall,
        handleDeleteClinicalNote,
        handleSupervisorySeal,
        handleConfirmRevocation,
        handleSaveInformedRefusal,
        handleVoidNote,
        handlePatientSignOffOnNote,
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

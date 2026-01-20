import React, { createContext, useContext, useState, useMemo, ReactNode, useCallback, useEffect } from 'react';
import { useToast } from './components/ToastSystem';
import {
  Appointment, User, Patient, FieldSettings, UserRole, AppointmentStatus, PinboardTask, AuditLogEntry, StockItem,
  DentalChartEntry, SterilizationCycle, HMOClaim, PhilHealthClaim, ClinicalIncident, Referral, ReconciliationRecord,
  StockTransfer, RecallStatus, CashSession, PayrollPeriod, PayrollAdjustment, CommissionDispute,
  SyncIntent, SyncConflict, SystemStatus, WaitlistEntry,
  GovernanceTrack, ConsentCategory, LeaveRequest, TreatmentPlanStatus, TreatmentPlan, ClearanceRequest,
  ClinicalProtocolRule, InstrumentSet, Expense, HMOClaimStatus, PhilHealthClaimStatus, PayrollStatus, ScheduledSms,
  LedgerEntry
} from './types';
import {
  STAFF, DEFAULT_FIELD_SETTINGS, MOCK_AUDIT_LOG, MOCK_STOCK, MOCK_CLAIMS, MOCK_EXPENSES,
  MOCK_STERILIZATION_CYCLES, generateUid, MOCK_WAITLIST
} from './constants';
import { useAppContext } from './contexts/AppContext';
import { usePatientState } from './contexts/PatientContext';
import { useAppointmentState } from './contexts/AppointmentContext';

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

interface DataContextType {
  staff: User[];
  stock: StockItem[];
  expenses: Expense[];
  sterilizationCycles: SterilizationCycle[];
  fieldSettings: FieldSettings;
  tasks: PinboardTask[];
  incidents: ClinicalIncident[];
  referrals: Referral[];
  reconciliations: ReconciliationRecord[];
  cashSessions: CashSession[];
  transfers: StockTransfer[];
  waitlist: WaitlistEntry[];
  leaveRequests: LeaveRequest[];
  payrollPeriods: PayrollPeriod[];
  payrollAdjustments: PayrollAdjustment[];
  commissionDisputes: CommissionDispute[];
  hmoClaims: HMOClaim[];
  philHealthClaims: PhilHealthClaim[];
  scheduledSms: ScheduledSms[];
  offlineQueue: SyncIntent[];
  syncConflicts: SyncConflict[];
  governanceTrack: GovernanceTrack;
  handleSavePatient: (patientData: Partial<Patient>) => Promise<void>;
  handleSaveAppointment: (appointment: Appointment) => Promise<void>;
  handleMoveAppointment: (appointmentId: string, newDate: string, newTime: string, newProviderId: string, newResourceId?: string) => Promise<void>;
  handleUpdateAppointmentStatus: (appointmentId: string, status: AppointmentStatus, additionalData?: Partial<Appointment>) => Promise<void>;
  handleAddToWaitlist: (entry: Omit<WaitlistEntry, 'id' | 'patientName'>) => Promise<void>;
  handleAddTask: (text: string, isUrgent: boolean, assignedTo: string) => Promise<void>;
  handleToggleTask: (id: string) => Promise<void>;
  handleUpdateSettings: (newSettings: FieldSettings) => Promise<void>;
  handleSaveIncident: (incident: Omit<ClinicalIncident, 'id'>) => Promise<void>;
  handleSaveReferral: (referral: Omit<Referral, 'id'>) => Promise<void>;
  handleUpdateStaffRoster: (staffId: string, day: string, branch: string) => Promise<void>;
  handleAddLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'staffName' | 'status'>) => Promise<void>;
  handleApproveLeaveRequest: (id: string, approve: boolean) => Promise<void>;
  handleSaveReconciliation: (record: Omit<ReconciliationRecord, 'id' | 'timestamp'>) => Promise<void>;
  handleStartCashSession: (openingBalance: number, currentBranch: string) => Promise<void>;
  handleCloseCashSession: (sessionId: string) => Promise<void>;
  handlePerformTransfer: (transfer: StockTransfer) => Promise<void>;
  handleUpdatePatientRecall: (patientId: string, status: RecallStatus) => Promise<void>;
  handleAddPayrollPeriod: (period: Omit<PayrollPeriod, 'id'>) => Promise<PayrollPeriod | undefined>;
  handleUpdatePayrollPeriod: (period: PayrollPeriod) => Promise<void>;
  handleAddPayrollAdjustment: (adj: PayrollAdjustment) => Promise<void>;
  handleApproveAdjustment: (id: string) => Promise<void>;
  handleAddCommissionDispute: (dispute: CommissionDispute) => Promise<void>;
  handleResolveCommissionDispute: (id: string) => Promise<void>;
  handleSaveHmoClaim: (claim: Omit<HMOClaim, 'id'>) => Promise<void>;
  handleUpdateHmoClaimStatus: (claimId: string, status: HMOClaimStatus, amountReceived?: number) => Promise<void>;
  handleUpdatePhilHealthClaim: (updatedClaim: PhilHealthClaim) => Promise<void>;
  handleAddExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  handleAddSterilizationCycle: (cycle: SterilizationCycle) => Promise<void>;
  handlePurgePatient: (patientId: string) => Promise<void>;
  handleDeactivateStaff: (userId: string) => Promise<void>;
  handleSaveStaff: (staffData: User) => Promise<void>;
  handleDeleteClinicalNote: (patientId: string, noteId: string) => Promise<void>;
  handleSupervisorySeal: (noteToSeal: DentalChartEntry) => Promise<void>;
  handleConfirmRevocation: (patient: Patient, category: ConsentCategory, reason: string, notes: string) => Promise<void>;
  handleVerifyDowntimeEntry: (id: string) => Promise<void>;
  handleVerifyMedHistory: (appointmentId: string) => Promise<void>;
  handleConfirmFollowUp: (appointmentId: string) => Promise<void>;
  handleRecordPaymentWithReceipt: (patientId: string, paymentDetails: { description: string; date: string; amount: number; orNumber: string; }) => Promise<void>;
  setGovernanceTrack: (track: GovernanceTrack) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const toast = useToast();
  const { isOnline, logAction, currentUser } = useAppContext();
  const { patients, setPatients } = usePatientState();
  const { appointments, setAppointments } = useAppointmentState();

  const [staff, setStaff] = useState<User[]>(STAFF);
  const [stock, setStock] = useState<StockItem[]>(MOCK_STOCK);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [sterilizationCycles, setSterilizationCycles] = useState<SterilizationCycle[]>(MOCK_STERILIZATION_CYCLES);
  const [fieldSettings, setFieldSettings] = useState<FieldSettings>(DEFAULT_FIELD_SETTINGS);
  const [tasks, setTasks] = useState<PinboardTask[]>([]);
  const [incidents, setIncidents] = useState<ClinicalIncident[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [reconciliations, setReconciliations] = useState<ReconciliationRecord[]>([]);
  const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(MOCK_WAITLIST);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollAdjustments, setPayrollAdjustments] = useState<PayrollAdjustment[]>([]);
  const [commissionDisputes, setCommissionDisputes] = useState<CommissionDispute[]>([]);
  const [hmoClaims, setHmoClaims] = useState<HMOClaim[]>(MOCK_CLAIMS);
  const [philHealthClaims, setPhilHealthClaims] = useState<PhilHealthClaim[]>([]);
  const [scheduledSms, setScheduledSms] = useState<ScheduledSms[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<SyncIntent[]>([]);
  const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>([]);
  const [governanceTrack, setGovernanceTrack] = useState<GovernanceTrack>('OPERATIONAL');

  const isAuthorityLocked = useMemo(() => {
    if (currentUser.status === 'Inactive') return true;
    const isPrcExpired = currentUser.prcExpiry && new Date(currentUser.prcExpiry) < new Date();
    const isMalpracticeExpired = currentUser.malpracticeExpiry && new Date(currentUser.malpracticeExpiry) < new Date();
    return isPrcExpired || isMalpracticeExpired;
  }, [currentUser]);

  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
        const syncOfflineQueue = async () => {
            toast.info(`Syncing ${offlineQueue.length} offline changes...`);
            const queueToProcess = [...offlineQueue];
            setOfflineQueue([]); 
            await new Promise(res => setTimeout(res, 1500)); 
            const processedIds = new Set(queueToProcess.map(intent => intent.payload.id));
            setPatients(prev => prev.map(p => processedIds.has(p.id) ? { ...p, isPendingSync: false } : p));
            setAppointments(prev => prev.map(a => processedIds.has(a.id) ? { ...a, isPendingSync: false } : a));
            toast.success("All offline changes have been synced.");
        };
        syncOfflineQueue();
    }
  }, [isOnline, offlineQueue, toast, setPatients, setAppointments]);

  const handleSavePatient = async (patientData: Partial<Patient>): Promise<void> => {
    if (isAuthorityLocked) {
        toast.error("CLINICAL AUTHORITY LOCKED: Your credentials have expired. Data modification is disabled.");
        throw new Error("Authority Locked");
    }
    try {
      const isNew = !patientData.id || !patients.some(p => p.id === patientData.id);
      const action: SyncIntent['action'] = isNew ? 'REGISTER_PATIENT' : 'UPDATE_PATIENT';
      const finalPatientId = isNew ? generateUid('p_offline') : patientData.id!;
      const oldPatient = isNew ? null : patients.find(p => p.id === finalPatientId);
      
      const finalPatient = (isNew 
          ? { ...patientData, id: finalPatientId, isPendingSync: !isOnline } 
          : { ...oldPatient, ...patientData, isPendingSync: !isOnline }
      ) as Patient;

      setPatients(isNew ? [...patients, finalPatient] : patients.map(p => p.id === finalPatient.id ? finalPatient : p));
      
      if (isOnline) {
          await new Promise(resolve => setTimeout(resolve, 300));
          setPatients(prev => prev.map(p => p.id === finalPatientId ? { ...p, isPendingSync: false } : p));
          logAction(isNew ? 'CREATE' : 'UPDATE', 'Patient', finalPatient.id, generateDiff(oldPatient, finalPatient));
          toast.success(`Patient "${finalPatient.name}" saved.`);
      } else {
          const intent: SyncIntent = { id: generateUid('sync'), action, payload: finalPatient, timestamp: new Date().toISOString() };
          setOfflineQueue(prev => [...prev, intent]);
          toast.info(`Offline: Patient "${finalPatient.name}" saved locally.`);
      }
    } catch (error) {
        console.error("Error saving patient:", error);
        toast.error("An error occurred while saving the patient record.");
        throw error;
    }
  };
  
  const handleSaveAppointment = async (appointmentData: Appointment): Promise<void> => {
    if (isAuthorityLocked) {
        toast.error("CLINICAL AUTHORITY LOCKED: Your credentials have expired. Data modification is disabled.");
        throw new Error("Authority Locked");
    }
    try {
      const isNew = !appointments.some(a => a.id === appointmentData.id);
      const action: SyncIntent['action'] = isNew ? 'CREATE_APPOINTMENT' : 'UPDATE_APPOINTMENT';
      const oldApt = isNew ? null : appointments.find(a => a.id === appointmentData.id);
      const finalAppointment = { ...appointmentData, isPendingSync: !isOnline };

      setAppointments(isNew ? [...appointments, finalAppointment] : appointments.map(a => a.id === finalAppointment.id ? finalAppointment : a));
      
      if (isOnline) {
          await new Promise(resolve => setTimeout(resolve, 300));
          setAppointments(prev => prev.map(a => a.id === finalAppointment.id ? { ...a, isPendingSync: false } : a));
          logAction(isNew ? 'CREATE' : 'UPDATE', 'Appointment', finalAppointment.id, generateDiff(oldApt, finalAppointment));
          toast.success(`Appointment for ${finalAppointment.date} saved.`);
      } else {
          const intent: SyncIntent = { id: generateUid('sync'), action, payload: finalAppointment, timestamp: new Date().toISOString() };
          setOfflineQueue(prev => [...prev, intent]);
          toast.info(`Offline: Appointment for ${finalAppointment.date} saved locally.`);
      }
    } catch(error) {
        console.error("Error saving appointment:", error);
        toast.error("An error occurred while saving the appointment.");
        throw error;
    }
  };
  
  const handleMoveAppointment = async (appointmentId: string, newDate: string, newTime: string, newProviderId: string, newResourceId?: string): Promise<void> => {
    try {
      const originalApt = appointments.find(a => a.id === appointmentId);
      if (!originalApt) return;
      
      const updatedApt = { ...originalApt, date: newDate, time: newTime, providerId: newProviderId, resourceId: newResourceId, isPendingSync: !isOnline };
      
      setAppointments(prev => prev.map(apt => apt.id === appointmentId ? updatedApt : apt));

      if(isOnline) {
          await new Promise(resolve => setTimeout(resolve, 300));
          setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, isPendingSync: false } : a));
          toast.success("Appointment rescheduled.");
          logAction('UPDATE', 'Appointment', appointmentId, `Moved to ${newDate} @ ${newTime}`);
      } else {
          const intent: SyncIntent = { id: generateUid('sync'), action: 'UPDATE_APPOINTMENT', payload: updatedApt, timestamp: new Date().toISOString() };
          setOfflineQueue(prev => [...prev, intent]);
          toast.info("Offline: Appointment move saved locally.");
      }
    } catch(error) {
        console.error("Error moving appointment:", error);
        toast.error("An error occurred while rescheduling the appointment.");
        throw error;
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus, additionalData: Partial<Appointment> = {}): Promise<void> => {
    try {
        const originalApt = appointments.find(a => a.id === appointmentId);
        if (!originalApt) return;

        const updatedApt = { ...originalApt, status, ...additionalData, isPendingSync: !isOnline };
        
        setAppointments(prev => prev.map(apt => apt.id === appointmentId ? updatedApt : apt));

        if (isOnline) {
             await new Promise(resolve => setTimeout(resolve, 300));
             setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, isPendingSync: false } : a));
            logAction('UPDATE_STATUS', 'Appointment', appointmentId, `Status changed to ${status}.`);
        } else {
            const intent: SyncIntent = { id: generateUid('sync'), action: 'UPDATE_STATUS', payload: updatedApt, timestamp: new Date().toISOString() };
            setOfflineQueue(prev => [...prev, intent]);
            toast.info(`Offline: Status update for appointment saved locally.`);
        }
    } catch (error) {
        console.error("Error updating appointment status:", error);
        toast.error("An error occurred while updating the appointment status.");
        throw error;
    }
  };

  const handleRecordPaymentWithReceipt = async (patientId: string, paymentDetails: { description: string; date: string; amount: number; orNumber: string; }): Promise<void> => {
    setPatients(prev => prev.map(p => {
        if (p.id === patientId) {
            const currentBalance = p.currentBalance || 0;
            const newBalance = currentBalance - paymentDetails.amount;
            const newEntry: LedgerEntry = {
                id: generateUid('l_bir'),
                date: paymentDetails.date,
                description: paymentDetails.description,
                type: 'Payment',
                amount: paymentDetails.amount,
                balanceAfter: newBalance,
                orNumber: paymentDetails.orNumber,
            };
            return {
                ...p,
                ledger: [...(p.ledger || []), newEntry],
                currentBalance: newBalance,
            };
        }
        return p;
    }));
    setFieldSettings(prev => ({
        ...prev,
        taxConfig: { ...prev.taxConfig, nextOrNumber: prev.taxConfig.nextOrNumber + 1 }
    }));
    logAction('CREATE', 'LedgerEntry', patientId, `Logged payment of ₱${paymentDetails.amount} with OR# ${paymentDetails.orNumber}`);
    toast.success(`Payment with OR# ${paymentDetails.orNumber} recorded.`);
  };

  const createAsyncHandler = <T extends any[]>(handler: (...args: T) => void, successMsg?: string, errorMsg?: string) => {
    return async (...args: T): Promise<void> => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        handler(...args);
        if (successMsg) toast.success(successMsg);
      } catch (error) {
        toast.error(errorMsg || "An unexpected error occurred.");
        throw error;
      }
    };
  };

  const handlePurgePatient = createAsyncHandler((patientId: string) => {
    setPatients(prev => prev.filter(p => p.id !== patientId));
    logAction('SECURITY_ALERT', 'Patient', patientId, 'Patient record permanently purged.');
  }, "Patient record purged.");

  const handleUpdatePatientRecall = createAsyncHandler((patientId: string, status: RecallStatus) => {
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, recallStatus: status } : p));
  }, "Recall status updated.");

  const value: DataContextType = {
      staff, stock, expenses, sterilizationCycles, fieldSettings, tasks, 
      incidents, referrals, reconciliations, cashSessions, transfers, waitlist, leaveRequests, payrollPeriods, payrollAdjustments, commissionDisputes,
      hmoClaims, philHealthClaims, scheduledSms, offlineQueue, syncConflicts, governanceTrack,
      handleSavePatient,
      handleSaveAppointment,
      handleMoveAppointment,
      handleUpdateAppointmentStatus,
      handleRecordPaymentWithReceipt,
      setGovernanceTrack,
      handlePurgePatient,
      handleUpdatePatientRecall,
      handleSaveStaff: createAsyncHandler((staffData: User) => {
          const isNew = !staffData.id;
          const updated = isNew ? [...staff, {...staffData, id: generateUid('staff')}] : staff.map(s => s.id === staffData.id ? staffData : s);
          setStaff(updated);
      }, "Staff saved."),
      handleUpdateSettings: createAsyncHandler(setFieldSettings, "Settings updated."),
      handleAddToWaitlist: async () => {},
      handleAddTask: async () => {},
      handleToggleTask: async () => {},
      handleSaveIncident: async () => {},
      handleSaveReferral: async () => {},
      handleUpdateStaffRoster: async () => {},
      handleAddLeaveRequest: async () => {},
      handleApproveLeaveRequest: async () => {},
      handleSaveReconciliation: async () => {},
      handleStartCashSession: async () => {},
      handleCloseCashSession: async () => {},
      handlePerformTransfer: async () => {},
      handleAddPayrollPeriod: async () => undefined,
      handleUpdatePayrollPeriod: async () => {},
      handleAddPayrollAdjustment: async () => {},
      handleApproveAdjustment: async () => {},
      handleAddCommissionDispute: async () => {},
      handleResolveCommissionDispute: async () => {},
      handleSaveHmoClaim: async () => {},
      handleUpdateHmoClaimStatus: async () => {},
      handleUpdatePhilHealthClaim: async () => {},
      handleAddExpense: async () => {},
      handleAddSterilizationCycle: async () => {},
      handleDeactivateStaff: async () => {},
      handleDeleteClinicalNote: async () => {},
      handleSupervisorySeal: async () => {},
      handleConfirmRevocation: async () => {},
      handleVerifyDowntimeEntry: async (id: string) => { 
        await handleUpdateAppointmentStatus(id, appointments.find(a => a.id === id)!.status, { reconciled: true });
        toast.success("Downtime entry reconciled.");
      },
      handleVerifyMedHistory: async (id: string) => {
        await handleUpdateAppointmentStatus(id, appointments.find(a => a.id === id)!.status, { medHistoryVerified: true, medHistoryVerifiedAt: new Date().toISOString() });
        toast.success("Medical history verified.");
      },
      handleConfirmFollowUp: async (id: string) => {
        await handleUpdateAppointmentStatus(id, appointments.find(a => a.id === id)!.status, { followUpConfirmed: true, followUpConfirmedAt: new Date().toISOString() });
        toast.success("Post-op follow-up confirmed.");
      }
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
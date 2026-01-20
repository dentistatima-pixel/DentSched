import React, { createContext, useContext, useState, useMemo, ReactNode, useCallback } from 'react';
import { useToast } from './components/ToastSystem';
import {
  Appointment, User, Patient, FieldSettings, UserRole, AppointmentStatus, PinboardTask, AuditLogEntry, StockItem,
  DentalChartEntry, SterilizationCycle, HMOClaim, PhilHealthClaim, ClinicalIncident, Referral, ReconciliationRecord,
  StockTransfer, RecallStatus, CashSession, PayrollPeriod, PayrollAdjustment, CommissionDispute,
  SyncIntent, SyncConflict, SystemStatus, WaitlistEntry,
  GovernanceTrack, ConsentCategory, LeaveRequest, TreatmentPlanStatus, TreatmentPlan, ClearanceRequest,
  ClinicalProtocolRule, InstrumentSet, Expense, HMOClaimStatus, PhilHealthClaimStatus, PayrollStatus, ScheduledSms
} from './types';
import {
  STAFF, PATIENTS, APPOINTMENTS, DEFAULT_FIELD_SETTINGS, MOCK_AUDIT_LOG, MOCK_STOCK, MOCK_CLAIMS, MOCK_EXPENSES,
  MOCK_STERILIZATION_CYCLES, generateUid, MOCK_WAITLIST
} from './constants';
import CryptoJS from 'crypto-js';

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
  // State
  appointments: Appointment[];
  patients: Patient[];
  staff: User[];
  currentUser: User;
  originalUser: User | null;
  stock: StockItem[];
  expenses: Expense[];
  sterilizationCycles: SterilizationCycle[];
  fieldSettings: FieldSettings;
  tasks: PinboardTask[];
  auditLog: AuditLogEntry[];
  isAuditLogVerified: boolean | null;
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
  systemStatus: SystemStatus;
  isOnline: boolean;
  offlineQueue: SyncIntent[];
  syncConflicts: SyncConflict[];
  governanceTrack: GovernanceTrack;
  
  // Handlers
  logAction: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
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
  handleStartImpersonating: (userToImpersonate: User) => void;
  handleStopImpersonating: () => void;
  handleDeleteClinicalNote: (patientId: string, noteId: string) => Promise<void>;
  handleSupervisorySeal: (noteToSeal: DentalChartEntry) => Promise<void>;
  handleConfirmRevocation: (patient: Patient, category: ConsentCategory, reason: string, notes: string) => Promise<void>;
  handleVerifyDowntimeEntry: (id: string) => Promise<void>;
  handleVerifyMedHistory: (appointmentId: string) => Promise<void>;
  handleConfirmFollowUp: (appointmentId: string) => Promise<void>;
  setCurrentUser: (user: User) => void;
  setSystemStatus: (status: SystemStatus) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const toast = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>(APPOINTMENTS);
  const [patients, setPatients] = useState<Patient[]>(PATIENTS);
  const [staff, setStaff] = useState<User[]>(STAFF);
  const [stock, setStock] = useState<StockItem[]>(MOCK_STOCK);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [sterilizationCycles, setSterilizationCycles] = useState<SterilizationCycle[]>(MOCK_STERILIZATION_CYCLES);
  const [fieldSettings, setFieldSettings] = useState<FieldSettings>(DEFAULT_FIELD_SETTINGS);
  const [tasks, setTasks] = useState<PinboardTask[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOG);
  const [isAuditLogVerified, setIsAuditLogVerified] = useState<boolean | null>(null);
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
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(SystemStatus.OPERATIONAL);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<SyncIntent[]>([]);
  const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>([]);
  const [governanceTrack, setGovernanceTrack] = useState<GovernanceTrack>('OPERATIONAL');
  const [currentUser, setCurrentUser] = useState<User>(STAFF[0]);
  const [originalUser, setOriginalUser] = useState<User | null>(null);

  const logAction = useCallback((action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => {
      setAuditLog(prevLog => {
          const lastLog = prevLog[prevLog.length - 1];
          const previousHash = lastLog ? lastLog.hash : '0'.repeat(64);
          const timestamp = new Date().toISOString();
          const payload = `${timestamp}|${currentUser.id}|${action}|${entityId}|${previousHash}`;
          const hash = CryptoJS.SHA256(payload).toString();

          const newLogEntry: AuditLogEntry = {
              id: generateUid('al'), timestamp, userId: currentUser.id, userName: currentUser.name,
              action, entity, entityId, details, hash, previousHash,
              impersonatingUser: originalUser ? { id: originalUser.id, name: originalUser.name } : undefined
          };
          return [...prevLog, newLogEntry];
      });
  }, [currentUser, originalUser]);
  
  const handleSavePatient = async (patientData: Partial<Patient>) => {
      try {
          await new Promise(resolve => setTimeout(resolve, 200));
          const isNew = !patientData.id || !patients.some(p => p.id === patientData.id);
          const oldPatient = isNew ? null : patients.find(p => p.id === patientData.id);
          const finalPatient = isNew ? { ...patientData, id: generateUid('p') } as Patient : { ...oldPatient, ...patientData } as Patient;
          const updatedPatients = isNew ? [...patients, finalPatient] : patients.map(p => p.id === finalPatient.id ? finalPatient : p);
          setPatients(updatedPatients);
          logAction(isNew ? 'CREATE' : 'UPDATE', 'Patient', finalPatient.id, generateDiff(oldPatient, finalPatient));
          toast.success(`Patient "${finalPatient.name}" saved.`);
      } catch (error) { toast.error("Failed to save patient."); }
  };
  
  const handleSaveAppointment = async (appointment: Appointment) => {
      try {
          await new Promise(resolve => setTimeout(resolve, 200));
          const isNew = !appointments.some(a => a.id === appointment.id);
          const oldApt = isNew ? null : appointments.find(a => a.id === appointment.id);
          const updatedAppointments = isNew ? [...appointments, appointment] : appointments.map(a => a.id === appointment.id ? appointment : a);
          setAppointments(updatedAppointments);
          logAction(isNew ? 'CREATE' : 'UPDATE', 'Appointment', appointment.id, generateDiff(oldApt, appointment));
          toast.success(`Appointment for ${appointment.date} saved.`);
      } catch (error) { toast.error("Failed to save appointment."); }
  };
  
  const handleMoveAppointment = async (appointmentId: string, newDate: string, newTime: string, newProviderId: string, newResourceId?: string) => {
      try {
          await new Promise(resolve => setTimeout(resolve, 200));
          setAppointments(prev => prev.map(apt => apt.id === appointmentId ? { ...apt, date: newDate, time: newTime, providerId: newProviderId, resourceId: newResourceId } : apt));
          toast.success("Appointment rescheduled.");
          logAction('UPDATE', 'Appointment', appointmentId, `Moved to ${newDate} @ ${newTime}`);
      } catch (error) { toast.error("Failed to move appointment."); }
  };

  const handleUpdateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus, additionalData: Partial<Appointment> = {}) => {
      try {
          await new Promise(resolve => setTimeout(resolve, 200));
          setAppointments(prev => prev.map(apt => apt.id === appointmentId ? { ...apt, status, ...additionalData } : apt));
          logAction('UPDATE_STATUS', 'Appointment', appointmentId, `Status changed to ${status}.`);
      } catch (error) { toast.error("Failed to update status."); }
  };

  const handleStartImpersonating = (userToImpersonate: User) => {
    if (currentUser.id === userToImpersonate.id) return;
    logAction('SECURITY_ALERT', 'System', userToImpersonate.id, `Impersonation started by ${currentUser.name} for user ${userToImpersonate.name}.`);
    setOriginalUser(currentUser);
    setCurrentUser(userToImpersonate);
    toast.warning(`Now impersonating ${userToImpersonate.name}.`);
  };

  const handleStopImpersonating = () => {
    if (originalUser) {
        logAction('SECURITY_ALERT', 'System', currentUser.id, `Impersonation stopped. Reverted to ${originalUser.name}.`);
        setCurrentUser(originalUser);
        setOriginalUser(null);
        toast.info("Impersonation stopped.");
    }
  };
  
  // Placeholder async handlers for other functions
  const createAsyncHandler = <T extends any[]>(handler: (...args: T) => void, successMsg?: string, errorMsg?: string) => {
    return async (...args: T) => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        handler(...args);
        if (successMsg) toast.success(successMsg);
      } catch (error) {
        toast.error(errorMsg || "An unexpected error occurred.");
      }
    };
  };

  const value = useMemo(() => ({
      appointments, patients, staff, currentUser, originalUser, stock, expenses, sterilizationCycles, fieldSettings, tasks, auditLog, isAuditLogVerified,
      incidents, referrals, reconciliations, cashSessions, transfers, waitlist, leaveRequests, payrollPeriods, payrollAdjustments, commissionDisputes,
      hmoClaims, philHealthClaims, scheduledSms, systemStatus, isOnline, offlineQueue, syncConflicts, governanceTrack,
      logAction,
      handleSavePatient,
      handleSaveAppointment,
      handleMoveAppointment,
      handleUpdateAppointmentStatus,
      handleStartImpersonating,
      handleStopImpersonating,
      setCurrentUser,
      setSystemStatus,
      // Add other handlers here, wrapped in createAsyncHandler or as full async functions
      handleSaveStaff: async (staffData: User) => {
          try {
              await new Promise(resolve => setTimeout(resolve, 200));
              const isNew = !staffData.id || !staff.some(s => s.id === staffData.id);
              let finalStaffData = { ...staffData };
              if (isNew) {
                  finalStaffData.id = generateUid('staff');
                  finalStaffData.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${finalStaffData.name}`;
              }
              const updatedStaff = isNew ? [...staff, finalStaffData] : staff.map(s => s.id === finalStaffData.id ? finalStaffData : s);
              setStaff(updatedStaff);
              logAction(isNew ? 'CREATE' : 'UPDATE', 'User', finalStaffData.id, `Staff profile saved.`);
              toast.success(`Staff member ${finalStaffData.name} saved.`);
          } catch(e) { toast.error("Failed to save staff member.")}
      },
      handleUpdateSettings: createAsyncHandler(setFieldSettings, "Settings updated."),
      // Continue for all other handlers...
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
      handleUpdatePatientRecall: async () => {},
      handleAddPayrollPeriod: async () => { return undefined; },
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
      handlePurgePatient: async () => {},
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
  }), [
      appointments, patients, staff, currentUser, originalUser, stock, expenses, sterilizationCycles, fieldSettings, tasks, auditLog, isAuditLogVerified,
      incidents, referrals, reconciliations, cashSessions, transfers, waitlist, leaveRequests, payrollPeriods, payrollAdjustments, commissionDisputes,
      hmoClaims, philHealthClaims, scheduledSms, systemStatus, isOnline, offlineQueue, syncConflicts, governanceTrack, logAction, toast
  ]);

  return <DataContext.Provider value={value as DataContextType}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};


import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import PatientList from './components/PatientList';
import AppointmentModal from './components/AppointmentModal';
import PatientRegistrationModal from './components/PatientRegistrationModal';
import FieldManagement from './components/FieldManagement';
import Inventory from './components/Inventory';
import Financials from './components/Financials';
import KioskView from './components/KioskView';
import { STAFF, PATIENTS, APPOINTMENTS, DEFAULT_FIELD_SETTINGS, MOCK_AUDIT_LOG, MOCK_STOCK, MOCK_CLAIMS, MOCK_EXPENSES, MOCK_STERILIZATION_CYCLES } from './constants';
import { Appointment, User, Patient, FieldSettings, UserRole, AppointmentStatus, PinboardTask, AuditLogEntry, StockItem, SterilizationCycle, HMOClaim, PhilHealthClaim, ClinicalIncident, Referral, ReconciliationRecord, StockTransfer, RecallStatus, CashSession, PayrollPeriod, PayrollAdjustment, CommissionDispute, SystemStatus, SyncIntent, SyncConflict, PurgeRequest, AccessPurpose } from './types';
import { useToast } from './components/ToastSystem';
import CryptoJS from 'crypto-js';
import { ShieldCheck } from 'lucide-react';
import { getTrustedTime } from './services/timeService';

const CANARY_KEY = 'dentsched_auth_canary';
const SALT_KEY = 'dentsched_security_salt';
const VERIFICATION_TOKEN = 'DENTSCHED_VERIFIED_ACCESS';
const PBKDF2_ITERATIONS = 600000; 

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

function App() {
  const toast = useToast();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInKioskMode, setIsInKioskMode] = useState(false);

  const [systemStatus, setSystemStatus] = useState<SystemStatus>(SystemStatus.OPERATIONAL);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<SyncIntent[]>([]);
  const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>([]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [sterilizationCycles, setSterilizationCycles] = useState<SterilizationCycle[]>([]);
  const [fieldSettings, setFieldSettings] = useState<FieldSettings>(DEFAULT_FIELD_SETTINGS);
  const [tasks, setTasks] = useState<PinboardTask[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [isAuditLogVerified, setIsAuditLogVerified] = useState<boolean | null>(null);
  const [incidents, setIncidents] = useState<ClinicalIncident[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [reconciliations, setReconciliations] = useState<ReconciliationRecord[]>([]);
  const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);

  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollAdjustments, setPayrollAdjustments] = useState<PayrollAdjustment[]>([]);
  const [commissionDisputes, setCommissionDisputes] = useState<CommissionDispute[]>([]);
  
  const [hmoClaims, setHmoClaims] = useState<HMOClaim[]>(MOCK_CLAIMS);
  const [philHealthClaims, setPhilHealthClaims] = useState<PhilHealthClaim[]>([]);

  const [currentUser, setCurrentUser] = useState<User>(STAFF[0]); 
  const [currentBranch, setCurrentBranch] = useState<string>('Makati Branch');

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<string | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState<string | undefined>(undefined);
  const [initialBookingPatientId, setInitialBookingPatientId] = useState<string | undefined>(undefined);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  useEffect(() => {
      const handleOnline = () => { 
        setIsOnline(true); 
        toast.success("Connection restored."); 
        if (systemStatus === SystemStatus.DOWNTIME) setSystemStatus(SystemStatus.RECONCILIATION);
      };
      const handleOffline = () => { 
        setIsOnline(false); 
        toast.warning("Connection lost. Protocol Downtime suggested."); 
      };
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [systemStatus]);

  useEffect(() => {
      if (isOnline && offlineQueue.length > 0) {
          processOfflineQueue();
      }
  }, [isOnline, offlineQueue]);

  const processOfflineQueue = async () => {
      toast.info(`Processing ${offlineQueue.length} queued changes...`);
      setOfflineQueue([]);
      setAppointments(prev => prev.map(a => ({...a, isPendingSync: false})));
  };

  const isLicenseExpired = useMemo(() => {
    if (currentUser.role !== UserRole.DENTIST || !currentUser.prcExpiry) return false;
    return new Date(currentUser.prcExpiry) < new Date();
  }, [currentUser]);

  const effectiveUser = useMemo(() => ({
    ...currentUser,
    isReadOnly: currentUser.isReadOnly || isLicenseExpired
  }), [currentUser, isLicenseExpired]);

  const logAction = async (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string, previousState?: any, newState?: any, accessPurpose?: AccessPurpose) => {
      if (!fieldSettings.features.enableAccountabilityLog) return;
      
      let finalDetails = details;
      if (previousState && newState) {
          const diff = generateDiff(previousState, newState);
          finalDetails = `${details} [Changes: ${diff}]`;
      }

      const { timestamp, isVerified } = await getTrustedTime();

      setAuditLog(prev => {
          const lastEntry = prev[0];
          const prevHash = lastEntry?.hash || "GENESIS_LINK_PDA_RA10173";
          const payload = `${timestamp}|${currentUser?.id || 'system'}|${action}|${entityId}|${prevHash}`;
          const currentHash = CryptoJS.SHA256(payload).toString();

          const newLog: AuditLogEntry = {
              id: `log_${Date.now()}`,
              timestamp,
              isVerifiedTimestamp: isVerified,
              userId: currentUser?.id || 'system',
              userName: currentUser?.name || 'System',
              action,
              entity,
              entityId,
              details: finalDetails,
              accessPurpose,
              hash: currentHash,
              previousHash: prevHash
          };
          return [newLog, ...prev];
      });
  };

  const verifyAuditTrail = useCallback((logs: AuditLogEntry[]) => {
      if (logs.length <= 1) return true;
      const sorted = [...logs].reverse();
      for (let i = 1; i < sorted.length; i++) {
          const current = sorted[i];
          const prev = sorted[i-1];
          const payload = `${current.timestamp}|${current.userId}|${current.action}|${current.entityId}|${prev.hash}`;
          const expectedHash = CryptoJS.SHA256(payload).toString();
          if (current.hash !== expectedHash || current.previousHash !== prev.hash) {
              return false;
          }
      }
      return true;
  }, []);

  const sanitizedPatients = useMemo(() => {
      const activePatients = patients.filter(p => !p.purgeRequest && !p.isArchived);
      if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DENTIST) return activePatients;
      if (currentUser.role === UserRole.DENTAL_ASSISTANT) {
          return activePatients.map(p => ({
              ...p,
              currentBalance: undefined,
              ledger: [],
              installmentPlans: []
          })) as Patient[];
      }
      return []; 
  }, [patients, currentUser.role]);

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      setIsInitializing(true);

      setTimeout(async () => {
          try {
              let salt = localStorage.getItem(SALT_KEY);
              if (!salt) {
                  salt = localStorage.getItem(CANARY_KEY) ? "dentsched-salt-v1" : CryptoJS.lib.WordArray.random(128/8).toString();
                  localStorage.setItem(SALT_KEY, salt);
              }

              const derivedKey = CryptoJS.PBKDF2(passwordInput, salt, { keySize: 256/32, iterations: PBKDF2_ITERATIONS }).toString();
              const storedCanary = localStorage.getItem(CANARY_KEY);
              
              if (storedCanary) {
                  const bytes = CryptoJS.AES.decrypt(storedCanary, derivedKey);
                  if (bytes.toString(CryptoJS.enc.Utf8) !== VERIFICATION_TOKEN) {
                      toast.error("Incorrect password.");
                      setIsInitializing(false);
                      return;
                  }
              } else {
                  localStorage.setItem(CANARY_KEY, CryptoJS.AES.encrypt(VERIFICATION_TOKEN, derivedKey).toString());
              }

              setEncryptionKey(derivedKey);
              await loadSecureData(derivedKey);
              setIsAuthenticated(true);
              setIsInitializing(false);
              logAction('LOGIN', 'System', 'Session', `User logged in. Status: ${navigator.onLine ? 'Online' : 'Offline'}`);
          } catch (error) {
              setIsInitializing(false);
              toast.error("Login error.");
          }
      }, 100);
  };

  const loadSecureData = async (key: string) => {
      const load = (k: string, def: any) => {
          const enc = localStorage.getItem(k);
          if (!enc) return def;
          try {
              const bytes = CryptoJS.AES.decrypt(enc, key);
              return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
          } catch { return def; } 
      };

      setAppointments(load('dentsched_appointments', APPOINTMENTS));
      setPatients(load('dentsched_patients', PATIENTS));
      setStaff(load('dentsched_staff', STAFF));
      setStock(load('dentsched_stock', MOCK_STOCK));
      setSterilizationCycles(load('dentsched_sterilization', MOCK_STERILIZATION_CYCLES));
      const loadedLogs = load('dentsched_auditlog', MOCK_AUDIT_LOG);
      setAuditLog(loadedLogs);
      setIsAuditLogVerified(verifyAuditTrail(loadedLogs));
      setTasks(load('dentsched_pinboard_tasks', []));
      setHmoClaims(load('dentsched_hmo_claims', MOCK_CLAIMS));
      setPhilHealthClaims(load('dentsched_philhealth_claims', []));
      setIncidents(load('dentsched_incidents', []));
      setReferrals(load('dentsched_referrals', []));
      setReconciliations(load('dentsched_reconciliations', []));
      setCashSessions(load('dentsched_cash_sessions', []));
      setStaff(load('dentsched_staff', STAFF));
      setTransfers(load('dentsched_transfers', []));
      setPayrollPeriods(load('dentsched_payroll_periods', []));
      setPayrollAdjustments(load('dentsched_payroll_adjustments', []));
      setCommissionDisputes(load('dentsched_commission_disputes', []));
      setOfflineQueue(load('dentsched_offline_queue', []));
      setSyncConflicts(load('dentsched_sync_conflicts', []));
      setSystemStatus(load('dentsched_system_status', SystemStatus.OPERATIONAL));
      const savedSettings = load('dentsched_fields', null);
      if (savedSettings) {
          setFieldSettings({
              ...DEFAULT_FIELD_SETTINGS,
              ...savedSettings,
              features: { ...DEFAULT_FIELD_SETTINGS.features, ...(savedSettings.features || {}) }
          });
      }
  };

  useEffect(() => {
      if (!isAuthenticated || !encryptionKey) return;
      const save = (k: string, data: any) => localStorage.setItem(k, CryptoJS.AES.encrypt(JSON.stringify(data), encryptionKey).toString());
      save('dentsched_appointments', appointments);
      save('dentsched_patients', patients);
      save('dentsched_staff', staff);
      save('dentsched_stock', stock);
      save('dentsched_sterilization', sterilizationCycles);
      save('dentsched_auditlog', auditLog);
      save('dentsched_pinboard_tasks', tasks);
      save('dentsched_fields', fieldSettings);
      save('dentsched_hmo_claims', hmoClaims);
      save('dentsched_philhealth_claims', philHealthClaims);
      save('dentsched_incidents', incidents);
      save('dentsched_referrals', referrals);
      save('dentsched_reconciliations', reconciliations);
      save('dentsched_cash_sessions', cashSessions);
      save('dentsched_transfers', transfers);
      save('dentsched_payroll_periods', payrollPeriods);
      save('dentsched_payroll_adjustments', payrollAdjustments);
      save('dentsched_commission_disputes', commissionDisputes);
      save('dentsched_offline_queue', offlineQueue);
      save('dentsched_sync_conflicts', syncConflicts);
      save('dentsched_system_status', systemStatus);
  }, [appointments, patients, staff, stock, sterilizationCycles, auditLog, tasks, fieldSettings, hmoClaims, philHealthClaims, incidents, referrals, reconciliations, cashSessions, transfers, payrollPeriods, payrollAdjustments, commissionDisputes, offlineQueue, syncConflicts, systemStatus, isAuthenticated, encryptionKey]);

  const handleUpdatePatientRecall = (patientId: string, status: RecallStatus) => {
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, recallStatus: status } : p));
  };

  const handleSaveAppointment = (newAppointment: Appointment) => {
    const isManual = systemStatus === SystemStatus.DOWNTIME;
    const aptWithSync = { 
        ...newAppointment, 
        branch: newAppointment.branch || currentBranch, 
        isPendingSync: !isOnline,
        entryMode: isManual ? 'MANUAL' : 'AUTO',
        reconciled: !isManual
    } as Appointment;
    setAppointments(prev => {
        const existingIndex = prev.findIndex(a => a.id === aptWithSync.id);
        if (existingIndex >= 0) {
            const updated = [...prev]; updated[existingIndex] = aptWithSync; return updated;
        } else { return [...prev, aptWithSync]; }
    });
  };

  const handleUpdateAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => {
      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status, isPendingSync: !isOnline } : a));
  };

  const handleSavePatient = (newPatientData: Partial<Patient>) => {
    const dataWithTimestamp = { ...newPatientData, lastDigitalUpdate: new Date().toISOString() };
    const existingIndex = patients.findIndex(p => p.id === newPatientData.id);
    if (existingIndex >= 0) {
        setPatients(prev => prev.map(p => p.id === newPatientData.id ? { ...p, ...dataWithTimestamp } as Patient : p));
        setEditingPatient(null);
    } else {
        const newPatient: Patient = { ...dataWithTimestamp as Patient, id: newPatientData.id || `p_new_${Date.now()}`, lastVisit: 'First Visit', nextVisit: null, notes: newPatientData.notes || '', recallStatus: 'Due' };
        setPatients(prev => [...prev, newPatient]);
    }
    if (isInKioskMode) {
        logAction('UPDATE', 'Kiosk', newPatientData.id || 'new', `Kiosk: Patient registered/updated record.`);
    }
  };

  const handleInitiatePurge = (patientId: string, initiatorId: string, initiatorName: string) => {
      const purgeReq: PurgeRequest = {
          initiatorId,
          initiatorName,
          timestamp: new Date().toISOString()
      };
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, purgeRequest: purgeReq } : p));
      logAction('INITIATE_PURGE', 'Patient', patientId, `Destruction initiated by ${initiatorName}. Awaiting co-signer authorization.`);
      toast.warning("Soft-purge executed. Record moved to final destruction queue.");
  };

  const handleFinalPurge = (patientId: string, validatorId: string, validatorName: string) => {
      setPatients(prev => prev.filter(p => p.id !== patientId));
      setAppointments(prev => prev.filter(a => a.patientId !== patientId));
      logAction('DESTRUCTION_CERTIFICATE', 'DataArchive', patientId, `Permanent destruction authorized by ${validatorName}. Data irrecoverable.`);
      toast.success("Final purge complete. Encryption keys shredded.");
  };

  const handleQuickUpdatePatient = (updatedPatient: Patient) => setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));

  const handleTabChange = (tab: string) => {
      if (tab === 'field-mgmt' && currentUser.role !== UserRole.ADMIN) {
          toast.error("Access Restricted.");
          return;
      }
      setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard appointments={appointments.filter(a => a.branch === currentBranch)} patientsCount={patients.length} staffCount={staff.length} staff={staff} currentUser={effectiveUser} patients={sanitizedPatients} onAddPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} onPatientSelect={setSelectedPatientId} onBookAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }} onUpdateAppointmentStatus={handleUpdateAppointmentStatus} onCompleteRegistration={(id) => { const p = patients.find(pt => pt.id === id); if (p) { setEditingPatient(p); setIsPatientModalOpen(true); }}} onUpdatePatientRecall={handleUpdatePatientRecall} fieldSettings={fieldSettings} onUpdateSettings={setFieldSettings} onViewAllSchedule={() => setActiveTab('schedule')} tasks={tasks} onChangeBranch={setCurrentBranch} currentBranch={currentBranch} onSaveConsent={(aid, url) => setAppointments(prev => prev.map(a => a.id === aid ? { ...a, signedConsentUrl: url } : a))} onPatientPortalToggle={() => {}} auditLogVerified={isAuditLogVerified} sterilizationCycles={sterilizationCycles} stock={stock} auditLog={auditLog} logAction={logAction} syncConflicts={syncConflicts} setSyncConflicts={setSyncConflicts} systemStatus={systemStatus} onSwitchSystemStatus={setSystemStatus} onVerifyDowntimeEntry={(id) => setAppointments(prev => prev.map(a => a.id === id ? {...a, entryMode: 'AUTO', reconciled: true} : a))} />;
      case 'schedule': return <CalendarView appointments={appointments.filter(a => a.branch === currentBranch)} staff={staff} onAddAppointment={(d, t, pid, apt) => { setBookingDate(d); setBookingTime(t); setInitialBookingPatientId(pid); setEditingAppointment(apt || null); setIsAppointmentModalOpen(true); }} onMoveAppointment={(id, d, t, pr) => setAppointments(prev => prev.map(a => a.id === id ? { ...a, date: d, time: t, providerId: pr } : a))} currentUser={effectiveUser} patients={sanitizedPatients} currentBranch={currentBranch} fieldSettings={fieldSettings} />;
      // Added currentBranch to PatientList fix "Cannot find name 'currentBranch'"
      case 'patients': return <PatientList patients={sanitizedPatients} appointments={appointments} currentUser={effectiveUser} selectedPatientId={selectedPatientId} onSelectPatient={setSelectedPatientId} onAddPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} onEditPatient={(p) => { setEditingPatient(p); setIsPatientModalOpen(true); }} onQuickUpdatePatient={handleQuickUpdatePatient} onDeletePatient={(id) => setPatients(prev => prev.map(p => p.id === id ? { ...p, isArchived: true } : p))} onBookAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }} fieldSettings={fieldSettings} logAction={logAction} staff={staff} currentBranch={currentBranch} />;
      case 'inventory': return <Inventory stock={stock} onUpdateStock={setStock} currentUser={effectiveUser} sterilizationCycles={sterilizationCycles} onAddCycle={(c) => setSterilizationCycles(prev => [...prev, { id: `c_${Date.now()}`, ...c }])} currentBranch={currentBranch} availableBranches={fieldSettings.branches} transfers={transfers} fieldSettings={fieldSettings} onUpdateSettings={setFieldSettings} appointments={appointments} logAction={logAction} />;
      case 'financials': return <Financials claims={hmoClaims} expenses={MOCK_EXPENSES} philHealthClaims={philHealthClaims} currentUser={effectiveUser} appointments={appointments} patients={sanitizedPatients} fieldSettings={fieldSettings} staff={staff} reconciliations={reconciliations} onSaveReconciliation={(r) => setReconciliations(prev => [r, ...prev])} onSaveCashSession={(s) => setCashSessions(prev => [s, ...prev])} currentBranch={currentBranch} payrollPeriods={payrollPeriods} payrollAdjustments={payrollAdjustments} commissionDisputes={commissionDisputes} onUpdatePayrollPeriod={(p) => setPayrollPeriods(prev => [...prev, p])} onAddPayrollAdjustment={(a) => setPayrollAdjustments(prev => [...prev, a])} onApprovePayrollAdjustment={(id) => setPayrollAdjustments(prev => prev.map(a => a.id === id ? { ...a, status: 'Approved' } : a))} onAddCommissionDispute={(d) => setCommissionDisputes(prev => [...prev, d])} onResolveCommissionDispute={(id) => setCommissionDisputes(prev => prev.map(d => d.id === id ? { ...d, status: 'Resolved' } : d))} onUpdateHmoClaim={(c) => setHmoClaims(prev => prev.map(cl => cl.id === c.id ? c : cl))} onUpdatePhilHealthClaim={(c) => setPhilHealthClaims(prev => prev.map(cl => cl.id === c.id ? c : cl))} onUpdatePatient={handleQuickUpdatePatient} logAction={logAction} />;
      case 'field-mgmt': return <FieldManagement settings={fieldSettings} onUpdateSettings={setFieldSettings} staff={staff} currentUser={effectiveUser} auditLog={auditLog} patients={patients} onInitiatePurge={handleInitiatePurge} onFinalPurge={handleFinalPurge} auditLogVerified={isAuditLogVerified} />;
      default: return null;
    }
  };

  if (!isAuthenticated) {
      return (
          <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
                  <div className="flex flex-col items-center mb-8">
                      <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg mb-4"><ShieldCheck size={32} className="text-white"/></div>
                      <h1 className="text-2xl font-bold text-slate-800">Secure Access</h1>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-4">
                      <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label><input type="password" required value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl mt-1 focus:ring-4 focus:ring-teal-500/20 outline-none text-lg font-bold" placeholder="••••••••" /></div>
                      <button type="submit" disabled={isInitializing || !passwordInput} className="w-full py-4 bg-teal-600 text-white font-bold rounded-xl shadow-xl transition-all">{isInitializing ? 'Verifying...' : 'Unlock System'}</button>
                  </form>
              </div>
          </div>
      )
  }

  if (isInKioskMode) {
      return <KioskView patients={patients} onUpdatePatient={handleSavePatient} onExitKiosk={() => setIsInKioskMode(false)} fieldSettings={fieldSettings} logAction={logAction} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={handleTabChange} onAddAppointment={() => setIsAppointmentModalOpen(true)} currentUser={effectiveUser} onSwitchUser={setCurrentUser} staff={staff} currentBranch={currentBranch} availableBranches={fieldSettings.branches} onChangeBranch={setCurrentBranch} fieldSettings={fieldSettings} onGenerateReport={() => {}} tasks={tasks} onToggleTask={(id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))} isOnline={isOnline} pendingSyncCount={offlineQueue.length} systemStatus={systemStatus} onSwitchSystemStatus={setSystemStatus} onEnterKiosk={() => setIsInKioskMode(true)} >
      {renderContent()}
      <AppointmentModal isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} onSave={handleSaveAppointment} patients={patients} staff={staff} appointments={appointments} initialDate={bookingDate} initialTime={bookingTime} initialPatientId={initialBookingPatientId} existingAppointment={editingAppointment} fieldSettings={fieldSettings} sterilizationCycles={sterilizationCycles} isDowntime={systemStatus === SystemStatus.DOWNTIME} />
      <PatientRegistrationModal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} onSave={handleSavePatient} initialData={editingPatient} fieldSettings={fieldSettings} patients={patients} />
    </Layout>
  );
}

export default App;

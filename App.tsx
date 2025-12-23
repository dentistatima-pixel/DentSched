
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
import ClosureRitualModal from './components/ClosureRitualModal';
import { STAFF, PATIENTS, APPOINTMENTS, DEFAULT_FIELD_SETTINGS, MOCK_AUDIT_LOG, MOCK_STOCK, MOCK_CLAIMS, MOCK_EXPENSES, MOCK_STERILIZATION_CYCLES } from './constants';
import { Appointment, User, Patient, FieldSettings, UserRole, AppointmentStatus, PinboardTask, AuditLogEntry, StockItem, SterilizationCycle, HMOClaim, PhilHealthClaim, ClinicalIncident, Referral, ReconciliationRecord, StockTransfer, RecallStatus, CashSession, PayrollPeriod, PayrollAdjustment, CommissionDispute, SystemStatus, SyncIntent, SyncConflict, PurgeRequest, AccessPurpose, ClinicStatus, UIMode, TreatmentPlanStatus } from './types';
import { useToast } from './components/ToastSystem';
import CryptoJS from 'crypto-js';
import { ShieldCheck, Mail, Lock as LockIcon, Fingerprint } from 'lucide-react';
import { getTrustedTime } from './services/timeService';
import { db, auth } from './firebase';
import { ref, onValue, set, get, child } from "firebase/database";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";

const REGISTRY_MASTER_SECRET_PATH = 'registry_secrets/master_key';

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
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInKioskMode, setIsInKioskMode] = useState(false);
  const [uiMode, setUiMode] = useState<UIMode>(UIMode.OPERATIONAL);

  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const isRemoteUpdate = useRef(false);

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
  const [currentBranch, currentBranchSetter] = useState<string>('Your Clinic');
  const [isClosureRitualOpen, setIsClosureRitualOpen] = useState(false);

  // --- FIREBASE AUTH LISTENER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Already logged in, ensure we have the key
            if (!encryptionKey) {
                await fetchRegistrySecrets();
            }
        } else {
            setIsAuthenticated(false);
            setEncryptionKey(null);
        }
    });
    return () => unsubscribe();
  }, [encryptionKey]);

  // --- FIREBASE CONNECTIVITY MONITOR ---
  useEffect(() => {
    const connectedRef = ref(db, ".info/connected");
    const unsub = onValue(connectedRef, (snap) => {
        setIsFirebaseConnected(snap.val() === true);
    });
    return () => unsub();
  }, []);

  const isCorporateReadOnly = useMemo(() => {
    return fieldSettings.features.enableCentralAdmin && currentBranch !== currentUser.defaultBranch;
  }, [fieldSettings.features.enableCentralAdmin, currentBranch, currentUser.defaultBranch]);

  const isBranchArchived = useMemo(() => {
    const meta = fieldSettings.clinicMetadata?.[currentBranch];
    return meta?.status === ClinicStatus.ARCHIVED;
  }, [fieldSettings.clinicMetadata, currentBranch]);

  const isBranchSuspended = useMemo(() => {
    const meta = fieldSettings.clinicMetadata?.[currentBranch];
    return meta?.status === ClinicStatus.SUSPENDED;
  }, [fieldSettings.clinicMetadata, currentBranch]);

  const restrictedBranches = useMemo(() => {
    if (currentUser.role === UserRole.DENTAL_ASSISTANT) {
        return [currentUser.defaultBranch || 'Your Clinic'];
    }
    return fieldSettings.branches;
  }, [currentUser.role, currentUser.defaultBranch, fieldSettings.branches]);

  useEffect(() => {
    if (!restrictedBranches.includes(currentBranch)) {
        currentBranchSetter(restrictedBranches[0]);
    }
  }, [restrictedBranches, currentBranch]);

  const effectiveReadOnly = useMemo(() => {
    return currentUser.isReadOnly || isCorporateReadOnly || isBranchArchived;
  }, [currentUser.isReadOnly, isCorporateReadOnly, isBranchArchived]);

  useEffect(() => {
    if (!fieldSettings.features.enableMultiBranch) {
        if (currentBranch !== 'Your Clinic') currentBranchSetter('Your Clinic');
    }
  }, [fieldSettings.features.enableMultiBranch, currentBranch]);

  useEffect(() => {
      const handleOnline = () => { 
        setIsOnline(true); 
        toast.success("Connection restored."); 
        if (systemStatus === SystemStatus.DOWNTIME) setSystemStatus(SystemStatus.RECONCILIATION);
      };
      const handleOffline = () => { 
        setIsOnline(false); 
        toast.warning("Link dropped. Safety protocols active."); 
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
      const branchWork = offlineQueue.filter(item => item.originatingBranch === currentBranch || !item.originatingBranch);
      if (branchWork.length > 0) {
          toast.info(`Syncing ${branchWork.length} branch-specific record amendments...`);
          setOfflineQueue(prev => prev.filter(item => !branchWork.includes(item)));
          setAppointments(prev => prev.map(a => a.branch === currentBranch ? {...a, isPendingSync: false} : a));
      }
  };

  const isLicenseExpired = useMemo(() => {
    if (currentUser.role !== UserRole.DENTIST || !currentUser.prcExpiry) return false;
    return new Date(currentUser.prcExpiry) < new Date();
  }, [currentUser]);

  // --- CLINICAL FATIGUE LOGIC ---
  const currentFatigue = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const load = appointments
      .filter(a => a.date === today && a.providerId === currentUser.id && [AppointmentStatus.COMPLETED, AppointmentStatus.TREATING].includes(a.status))
      .reduce((sum, a) => sum + a.durationMinutes, 0);
    return load;
  }, [appointments, currentUser.id]);

  const effectiveUser = useMemo(() => ({
    ...currentUser,
    isReadOnly: effectiveReadOnly || isLicenseExpired,
    fatigueMetric: currentFatigue
  }), [currentUser, effectiveReadOnly, isLicenseExpired, currentFatigue]);

  // --- PES CALCULATION LOGIC ---
  const calculatePES = useCallback((p: Patient): number => {
    const punctuality = p.reliabilityScore || 100;
    const allPlans = p.treatmentPlans || [];
    const acceptance = allPlans.length > 0 
        ? (allPlans.filter(tp => tp.status === TreatmentPlanStatus.APPROVED).length / allPlans.length) * 100 
        : 100;
    const payment = p.currentBalance && p.currentBalance > 10000 ? 50 : 100;
    
    return Math.round((punctuality * 0.4) + (acceptance * 0.4) + (payment * 0.2));
  }, []);

  const patientsWithPES = useMemo(() => {
    return patients.map(p => ({
        ...p,
        engagementScore: calculatePES(p)
    }));
  }, [patients, calculatePES]);

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
          const payload = `${timestamp}|${auth.currentUser?.email || 'system'}|${action}|${entityId}|${prevHash}|${fieldSettings.encryptionEpoch || 1}`;
          const currentHash = CryptoJS.SHA256(payload).toString();

          const newLog: AuditLogEntry = {
              id: `log_${Date.now()}`,
              timestamp,
              isVerifiedTimestamp: isVerified,
              userId: auth.currentUser?.uid || 'system',
              userName: auth.currentUser?.email || 'System',
              action,
              entity,
              entityId,
              details: finalDetails,
              accessPurpose,
              hash: currentHash,
              previousHash: prevHash,
              encryptionEpoch: fieldSettings.encryptionEpoch || 1
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
          const payload = `${current.timestamp}|${current.userName}|${current.action}|${current.entityId}|${prev.hash}|${current.encryptionEpoch || 1}`;
          const expectedHash = CryptoJS.SHA256(payload).toString();
          if (current.hash !== expectedHash || current.previousHash !== prev.hash) {
              return false;
          }
      }
      return true;
  }, []);

  const sanitizedPatients = useMemo(() => {
      let activePatients = patientsWithPES.filter(p => !p.purgeRequest && !p.isArchived);
      
      // RULE: Staff Role Ceiling - Assistants are isolated to the current branch silo
      if (currentUser.role === UserRole.DENTAL_ASSISTANT) {
          activePatients = activePatients.filter(p => p.originatingBranch === currentBranch)
            .map(p => ({
                ...p,
                currentBalance: undefined,
                ledger: [],
                installmentPlans: []
            })) as Patient[];
      }
      
      return activePatients;
  }, [patientsWithPES, currentUser.role, currentBranch]);

  const fetchRegistrySecrets = async () => {
    try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, REGISTRY_MASTER_SECRET_PATH));
        if (snapshot.exists()) {
            const key = snapshot.val();
            setEncryptionKey(key);
            await loadSecureData(key);
            setIsAuthenticated(true);
            return true;
        } else {
            // Initial Practice Setup: Generate first key
            const initialKey = CryptoJS.lib.WordArray.random(256/8).toString();
            await set(ref(db, REGISTRY_MASTER_SECRET_PATH), initialKey);
            setEncryptionKey(initialKey);
            await loadSecureData(initialKey);
            setIsAuthenticated(true);
            return true;
        }
    } catch (e) {
        console.error("Vault access denied:", e);
        toast.error("Registry Vault Locked. Verify credentials.");
        return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsInitializing(true);

      try {
          const userCredential = await signInWithEmailAndPassword(auth, emailInput, passwordInput);
          if (userCredential.user) {
              const success = await fetchRegistrySecrets();
              if (success) {
                  logAction('LOGIN', 'System', 'Session', `Authenticated Registry Access by ${userCredential.user.email}`);
              }
          }
      } catch (error: any) {
          toast.error(error.message || "Authentication Failure.");
      } finally {
          setIsInitializing(false);
      }
  };

  const loadSecureData = async (key: string) => {
      const load = (k: string, def: any) => {
          const enc = localStorage.getItem(k);
          if (!enc) return def;
          try {
              const bytes = CryptoJS.AES.decrypt(enc, key);
              const str = bytes.toString(CryptoJS.enc.Utf8);
              return str ? JSON.parse(str) : def;
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
      setTransfers(load('dentsched_transfers', []));
      setPayrollPeriods(load('dentsched_payroll_periods', []));
      setPayrollAdjustments(load('dentsched_payroll_adjustments', []));
      setCommissionDisputes(load('dentsched_commission_disputes', []));
      setOfflineQueue(load('dentsched_offline_queue', []));
      setSyncConflicts(load('dentsched_sync_conflicts', []));
      setSystemStatus(load('dentsched_system_status', SystemStatus.OPERATIONAL));
      setUiMode(load('dentsched_ui_mode', UIMode.OPERATIONAL));
      const savedSettings = load('dentsched_fields', null);
      if (savedSettings) {
          setFieldSettings({
              ...DEFAULT_FIELD_SETTINGS,
              ...savedSettings,
              features: { ...DEFAULT_FIELD_SETTINGS.features, ...(savedSettings.features || {}) }
          });
      }
  };

  // --- FIREBASE REAL-TIME SYNC ENGINE ---
  useEffect(() => {
    if (!isAuthenticated || !encryptionKey) return;

    const syncNode = (path: string, setter: (val: any) => void) => {
        const syncRef = ref(db, `registry_v1/${path}`);
        return onValue(syncRef, (snapshot) => {
            const encryptedData = snapshot.val();
            if (encryptedData) {
                isRemoteUpdate.current = true;
                try {
                    const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
                    const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                    setter(decrypted);
                } catch (e) {
                    console.warn(`[Cloud Sync] Decrypt failed for ${path}. Likely key mismatch.`);
                }
                setTimeout(() => { isRemoteUpdate.current = false; }, 100);
            }
        });
    };

    const unsubscribes = [
        syncNode('appointments', setAppointments),
        syncNode('patients', setPatients),
        syncNode('fieldSettings', setFieldSettings),
        syncNode('auditLog', (logs) => { setAuditLog(logs); setIsAuditLogVerified(verifyAuditTrail(logs)); }),
        syncNode('stock', setStock),
        syncNode('hmoClaims', setHmoClaims),
        syncNode('philHealthClaims', setPhilHealthClaims),
        syncNode('reconciliations', setReconciliations)
    ];

    return () => unsubscribes.forEach(unsub => unsub());
  }, [isAuthenticated, encryptionKey, verifyAuditTrail]);

  // --- GLOBAL PERSISTENCE EFFECT (Cloud + Local) ---
  useEffect(() => {
      if (!isAuthenticated || !encryptionKey || isRemoteUpdate.current) return;

      const saveItem = (key: string, cloudPath: string, data: any) => {
          const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), encryptionKey).toString();
          localStorage.setItem(key, encrypted);
          if (isFirebaseConnected) {
              set(ref(db, `registry_v1/${cloudPath}`), encrypted);
          }
      };

      saveItem('dentsched_appointments', 'appointments', appointments);
      saveItem('dentsched_patients', 'patients', patients);
      saveItem('dentsched_staff', 'staff', staff);
      saveItem('dentsched_stock', 'stock', stock);
      saveItem('dentsched_sterilization', 'sterilization', sterilizationCycles);
      saveItem('dentsched_auditlog', 'auditLog', auditLog);
      saveItem('dentsched_pinboard_tasks', 'tasks', tasks);
      saveItem('dentsched_fields', 'fieldSettings', fieldSettings);
      saveItem('dentsched_hmo_claims', 'hmoClaims', hmoClaims);
      saveItem('dentsched_philhealth_claims', 'philHealthClaims', philHealthClaims);
      saveItem('dentsched_incidents', 'incidents', incidents);
      saveItem('dentsched_referrals', 'referrals', referrals);
      saveItem('dentsched_reconciliations', 'reconciliations', reconciliations);
      saveItem('dentsched_cash_sessions', 'cashSessions', cashSessions);
      saveItem('dentsched_transfers', 'transfers', transfers);
      saveItem('dentsched_payroll_periods', 'payrollPeriods', payrollPeriods);
      saveItem('dentsched_payroll_adjustments', 'payrollAdjustments', payrollAdjustments);
      saveItem('dentsched_commission_disputes', 'commissionDisputes', commissionDisputes);
      saveItem('dentsched_system_status', 'systemStatus', systemStatus);
      saveItem('dentsched_ui_mode', 'uiMode', uiMode);
      
  }, [appointments, patients, staff, stock, sterilizationCycles, auditLog, tasks, fieldSettings, hmoClaims, philHealthClaims, incidents, referrals, reconciliations, cashSessions, transfers, payrollPeriods, payrollAdjustments, commissionDisputes, offlineQueue, syncConflicts, systemStatus, uiMode, isAuthenticated, encryptionKey, isFirebaseConnected]);

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  const handleCloseDay = async () => {
    const verified = verifyAuditTrail(auditLog);
    if (!verified) {
      toast.error("Integrity Breach: Audit log hashes do not match state. Manual reconciliation required.");
      return;
    }
    await logAction('CLOSE_DAY', 'System', 'Closure', `Clinic closure ritual completed for ${currentBranch}.`);
    toast.success("Closure ritual complete. Records sealed for the day.");
    setIsClosureRitualOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard appointments={appointments} currentUser={effectiveUser} patients={sanitizedPatients} onPatientSelect={setSelectedPatientId} onUpdateAppointmentStatus={(id, s) => setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: s } : a))} fieldSettings={fieldSettings} currentBranch={currentBranch} auditLog={auditLog} systemStatus={systemStatus} onViewAllSchedule={() => setActiveTab('schedule')} uiMode={uiMode} onOpenClosureRitual={() => setIsClosureRitualOpen(true)} isAuditLogVerified={isAuditLogVerified} />;
      case 'schedule': return <CalendarView appointments={appointments.filter(a => a.branch === currentBranch)} staff={staff} onAddAppointment={() => !isBranchSuspended && !isBranchArchived && setIsAppointmentModalOpen(true)} onMoveAppointment={(id, d, t, pr) => setAppointments(prev => prev.map(a => a.id === id ? { ...a, date: d, time: t, providerId: pr } : a))} currentUser={effectiveUser} patients={sanitizedPatients} currentBranch={currentBranch} fieldSettings={fieldSettings} uiMode={uiMode} />;
      case 'patients': return <PatientList patients={sanitizedPatients} appointments={appointments} currentUser={effectiveUser} selectedPatientId={selectedPatientId} onSelectPatient={setSelectedPatientId} onAddPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} onEditPatient={(p) => { setEditingPatient(p); setIsPatientModalOpen(true); }} onQuickUpdatePatient={(up) => setPatients(prev => prev.map(p => p.id === up.id ? up : p))} onDeletePatient={(id) => setPatients(prev => prev.map(p => p.id === id ? { ...p, isArchived: true } : p))} onBookAppointment={() => setIsAppointmentModalOpen(true)} fieldSettings={fieldSettings} logAction={logAction} staff={staff} currentBranch={currentBranch} uiMode={uiMode} />;
      case 'inventory': return <Inventory stock={stock} onUpdateStock={setStock} currentUser={effectiveUser} sterilizationCycles={sterilizationCycles} onAddCycle={(c) => setSterilizationCycles(prev => [...prev, { id: `c_${Date.now()}`, ...c }])} currentBranch={currentBranch} availableBranches={restrictedBranches} transfers={transfers} fieldSettings={fieldSettings} logAction={logAction} uiMode={uiMode} appointments={appointments} patients={patients} />;
      case 'financials': return <Financials claims={hmoClaims} expenses={MOCK_EXPENSES} philHealthClaims={philHealthClaims} currentUser={effectiveUser} appointments={appointments} patients={sanitizedPatients} fieldSettings={fieldSettings} staff={staff} reconciliations={reconciliations} onSaveReconciliation={(r) => setReconciliations(prev => [r, ...prev])} onSaveCashSession={(s) => setCashSessions(prev => [s, ...prev])} currentBranch={currentBranch} payrollPeriods={payrollPeriods} payrollAdjustments={payrollAdjustments} commissionDisputes={commissionDisputes} onUpdatePayrollPeriod={(p) => setPayrollPeriods(prev => [...prev, p])} onAddPayrollAdjustment={(a) => setPayrollAdjustments(prev => [...prev, a])} onApprovePayrollAdjustment={(id) => setPayrollAdjustments(prev => prev.map(a => a.id === id ? { ...a, status: 'Approved' } : a))} onAddCommissionDispute={(d) => setCommissionDisputes(prev => [...prev, d])} onResolveCommissionDispute={(id) => setCommissionDisputes(prev => prev.map(d => d.id === id ? { ...d, status: 'Resolved' } : d))} onUpdateHmoClaim={(c) => setHmoClaims(prev => prev.map(cl => cl.id === c.id ? c : cl))} onUpdatePhilHealthClaim={(c) => setPhilHealthClaims(prev => prev.map(cl => cl.id === c.id ? c : cl))} onUpdatePatient={(up) => setPatients(prev => prev.map(p => p.id === up.id ? up : p))} logAction={logAction} uiMode={uiMode} />;
      case 'field-mgmt': return <FieldManagement settings={fieldSettings} onUpdateSettings={setFieldSettings} staff={staff} currentUser={effectiveUser} auditLog={auditLog} patients={patients} onInitiatePurge={(id, uid, un) => setPatients(prev => prev.map(p => p.id === id ? { ...p, purgeRequest: { initiatorId: uid, initiatorName: un, timestamp: new Date().toISOString() } } : p))} onFinalPurge={(id) => setPatients(prev => prev.filter(p => p.id !== id))} auditLogVerified={isAuditLogVerified} uiMode={uiMode} logAction={logAction} />;
      default: return null;
    }
  };

  if (!isAuthenticated) {
      return (
          <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4">
              {/* GLASSMORPHISM BACKGROUND ACCENTS */}
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px] animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-lilac-500/20 rounded-full blur-[120px] animate-pulse delay-700"></div>

              <div className="bg-white/80 backdrop-blur-2xl w-full max-w-md rounded-[3rem] shadow-2xl p-10 border border-white/20 animate-in zoom-in-95 duration-500 relative z-10">
                  <div className="flex flex-col items-center mb-10">
                      <div className="w-20 h-20 bg-teal-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-teal-600/30 mb-6"><ShieldCheck size={40} className="text-white"/></div>
                      <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Boutique Registry</h1>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 px-4 py-1 bg-slate-100 rounded-full">PDA Encrypted Infrastructure</p>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-5">
                      <div className="relative">
                        <label className="label ml-2 mb-2 block">Staff Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input type="email" required value={emailInput} onChange={e => setEmailInput(e.target.value)} className="input pl-12 h-14 bg-white/50 border-white/40 focus:bg-white" placeholder="practitioner@clinic.ph" />
                        </div>
                      </div>
                      <div className="relative">
                        <label className="label ml-2 mb-2 block">Security Password</label>
                        <div className="relative">
                            <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input type="password" required value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="input pl-12 h-14 bg-white/50 border-white/40 focus:bg-white" placeholder="••••••••" />
                        </div>
                      </div>
                      <button type="submit" disabled={isInitializing} className="w-full h-16 bg-teal-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-lilac-500/30 hover:shadow-lilac-500/50 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3">
                        {isInitializing ? (
                            <><div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div> Verification Active...</>
                        ) : (
                            <><Fingerprint size={24}/> Unlock Clinic</>
                        )}
                      </button>
                      <div className="text-center mt-4">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Compliance with National Privacy Commission R.A. 10173</p>
                      </div>
                  </form>
              </div>
          </div>
      )
  }

  if (isInKioskMode) {
      return <KioskView patients={patients} onUpdatePatient={(up) => setPatients(prev => prev.map(p => p.id === up.id ? { ...p, ...up } as Patient : p))} onExitKiosk={() => setIsInKioskMode(false)} fieldSettings={fieldSettings} logAction={logAction} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onAddAppointment={() => setIsAppointmentModalOpen(true)} currentUser={effectiveUser} onSwitchUser={setCurrentUser} staff={staff} currentBranch={currentBranch} availableBranches={restrictedBranches} onChangeBranch={currentBranchSetter} fieldSettings={fieldSettings} onGenerateReport={() => {}} tasks={tasks} onToggleTask={(id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))} isOnline={isFirebaseConnected} pendingSyncCount={offlineQueue.length} systemStatus={systemStatus} onSwitchSystemStatus={setSystemStatus} onEnterKiosk={() => setIsInKioskMode(true)} isCorporateReadOnly={isCorporateReadOnly} uiMode={uiMode} onChangeUiMode={setUiMode} isAuditLogVerified={isAuditLogVerified} >
      {renderContent()}
      <AppointmentModal isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} onSave={(a) => setAppointments(prev => [...prev, a])} patients={patients} staff={staff} appointments={appointments} fieldSettings={fieldSettings} sterilizationCycles={sterilizationCycles} isDowntime={systemStatus === SystemStatus.DOWNTIME} currentUser={effectiveUser} />
      <PatientRegistrationModal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} onSave={(p) => setPatients(prev => [...prev, { ...p, originatingBranch: currentBranch } as Patient])} initialData={editingPatient} fieldSettings={fieldSettings} patients={patients} currentBranch={currentBranch} />
      <ClosureRitualModal isOpen={isClosureRitualOpen} onClose={() => setIsClosureRitualOpen(false)} onConfirm={handleCloseDay} appointments={appointments.filter(a => a.date === new Date().toLocaleDateString('en-CA') && a.branch === currentBranch)} reconciliations={reconciliations.filter(r => r.date === new Date().toLocaleDateString('en-CA'))} />
    </Layout>
  );
}

export default App;

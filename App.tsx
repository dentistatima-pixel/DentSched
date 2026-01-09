import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import PatientList from './components/PatientList';
import { AppointmentModal } from './components/AppointmentModal';
import PatientRegistrationModal from './components/PatientRegistrationModal';
import FieldManagement from './components/FieldManagement';
import KioskView from './components/KioskView';
import Inventory from './components/Inventory';
import Financials from './components/Financials';
import PostOpHandoverModal from './components/PostOpHandoverModal';
import SafetyTimeoutModal from './components/SafetyTimeoutModal';
import { STAFF, PATIENTS, APPOINTMENTS, DEFAULT_FIELD_SETTINGS, MOCK_AUDIT_LOG, MOCK_STOCK, MOCK_CLAIMS, MOCK_EXPENSES, MOCK_STERILIZATION_CYCLES, CRITICAL_CLEARANCE_CONDITIONS } from './constants';
import { Appointment, User, Patient, FieldSettings, AppointmentType, UserRole, AppointmentStatus, PinboardTask, AuditLogEntry, StockItem, DentalChartEntry, SterilizationCycle, HMOClaim, PhilHealthClaim, PhilHealthClaimStatus, HMOClaimStatus, ClinicalIncident, Referral, ReconciliationRecord, StockTransfer, RecallStatus, TriageLevel, CashSession, PayrollPeriod, PayrollAdjustment, CommissionDispute, PayrollStatus, SyncIntent, SyncConflict, SystemStatus, LabStatus, ScheduledSms } from './types';
import { useToast } from './components/ToastSystem';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import CryptoJS from 'crypto-js';
import { Lock, FileText, CheckCircle, ShieldCheck, ShieldAlert, AlertTriangle, MessageSquare, Loader2, ShieldX, Info, RefreshCw, X, Database, Zap, Trash2 } from 'lucide-react';
import { getTrustedTime } from './services/timeService';

const CANARY_KEY = 'dentsched_auth_canary_v2';
const SALT_KEY = 'dentsched_security_salt_v2';
const VERIFICATION_TOKEN = 'DENTSCHED_VERIFIED_ACCESS_V2';
const GHOST_LOG_KEY = '_ds_ext_sys_0x1'; 
const PBKDF2_ITERATIONS = 100000; 
const EMERGENCY_STALE_THRESHOLD = 60 * 60 * 1000; 

type EnvStatus = 'SCANNING' | 'VERIFIED' | 'RESTRICTED' | 'INSECURE';

// --- NATIVE WEB CRYPTO UTILITIES ---
const getCryptoKey = async (password: string, salt: string): Promise<CryptoKey> => {
    const encoder = new TextEncoder();
    const passwordKey = await window.crypto.subtle.importKey(
        'raw', 
        encoder.encode(password), 
        { name: 'PBKDF2' }, 
        false, 
        ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(salt),
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
};

const encryptNative = async (data: any, key: CryptoKey): Promise<string> => {
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = encoder.encode(JSON.stringify(data));
    const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedData);
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...combined));
};

const decryptNative = async (base64: string, key: CryptoKey): Promise<any> => {
    const combined = new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
};

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

const verifyAuditTrail = (logs: AuditLogEntry[]): boolean => {
    if (logs.length <= 1) return true;
    const logsSorted = [...logs].reverse();
    for (let i = 1; i < logsSorted.length; i++) {
        const current = logsSorted[i];
        const prev = logsSorted[i - 1];
        const payload = `${current.timestamp}|${current.userId}|${current.action}|${current.entityId}|${prev.hash}`;
        const currentCalculatedHash = CryptoJS.SHA256(payload).toString();
        if (current.hash !== currentCalculatedHash || current.previousHash !== prev.hash) {
            return false;
        }
    }
    return true;
};

function App() {
  const toast = useToast();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [loginSubtext, setLoginSubtext] = useState('');
  const [cryptoStatus, setCryptoStatus] = useState('');
  const [derivationProgress, setDerivationProgress] = useState(0);
  const [showTamperAlert, setShowTamperAlert] = useState(false);

  const [envStatus, setEnvStatus] = useState<EnvStatus>('SCANNING');
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [showDiagnosticOverlay, setShowDiagnosticOverlay] = useState(false);

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
  const [fieldSettings, setFieldSettings] = useState<FieldSettings>(() => {
    const cachedBranding = localStorage.getItem('dentsched_public_branding');
    return cachedBranding 
        ? { ...DEFAULT_FIELD_SETTINGS, clinicName: cachedBranding }
        : DEFAULT_FIELD_SETTINGS;
  });
  const [tasks, setTask] = useState<PinboardTask[]>([]);
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
  
  const [scheduledSms, setScheduledSms] = useState<ScheduledSms[]>([]);

  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const idleTimerRef = useRef<any>(null);
  const IDLE_TIMEOUT_MS = 15 * 60 * 1000; 

  const [currentUser, setCurrentUser] = useState<User>(STAFF[0]); 
  const [isInKioskMode, setIsInKioskMode] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<string>('Makati Main');

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<string | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState<string | undefined>(undefined);
  const [initialBookingPatientId, setInitialBookingPatientId] = useState<string | undefined>(undefined);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const [pendingPostOpAppointment, setPendingPostOpAppointment] = useState<Appointment | null>(null);
  const [pendingSafetyTimeout, setPendingSafetyTimeout] = useState<{ appointmentId: string, status: AppointmentStatus, patient: Patient } | null>(null);

  useEffect(() => {
    const checkEnv = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));

      if (!window.isSecureContext) {
        setEnvStatus('INSECURE');
        setFatalError("Protocol Violation: Clinical encryption requires a secure (HTTPS) connection.");
        return;
      }

      if (!window.crypto?.subtle) {
        setEnvStatus('RESTRICTED');
        setFatalError("Hardware Restriction: The Web Crypto API is disabled in this environment.");
        return;
      }

      setEnvStatus('VERIFIED');
    };
    checkEnv();
  }, []);

  const resetSecurityVault = () => {
      const confirmReset = window.confirm("NUCEAL RESET: This will purge local security metadata (SALT and CANARY). Proceed?");
      if (confirmReset) {
          localStorage.removeItem(SALT_KEY);
          localStorage.removeItem(CANARY_KEY);
          Object.keys(localStorage).forEach(key => {
              if (key.startsWith('dentsched_') && key.endsWith('_v2')) {
                  localStorage.removeItem(key);
              }
          });
          toast.success("Security Vault Resurrected. Please reload.");
          window.location.reload();
      }
  };

  const handleManualOverride = (gateId: string, reason: string) => {
    logAction('SECURITY_ALERT', 'SystemGate', gateId, `Manual Override Executed. Reason: ${reason}`);
    toast.warning(`Manual override logged for gate ${gateId}.`);
  };

  const triggerSms = useCallback(async (templateId: string, patient: Patient, extras: Record<string, string> = {}) => {
      if (!isOnline || systemStatus === SystemStatus.DOWNTIME) return; 
      if (!fieldSettings.features.enableSmsAutomation) return;
      
      const config = fieldSettings.smsTemplates[templateId];
      if (!config || !config.enabled) return;

      const marketingCategories = ['Onboarding', 'Efficiency', 'Reputation'];
      if (marketingCategories.includes(config.category) && !patient.marketingConsent) {
          return;
      }

      let message = config.text;
      const doctor = extras.doctor || 'your dentist';
      const procedure = extras.procedure || 'your appointment';
      const date = extras.date || 'your scheduled date';
      const time = extras.time || 'your scheduled time';
      const branch = extras.branch || currentBranch;
      const amount = extras.amount || '0.00';
      const provider = extras.provider || 'your insurer';

      message = message
          .replace(/{PatientName}/g, patient.firstName)
          .replace(/{Doctor}/g, doctor)
          .replace(/{Procedure}/g, procedure)
          .replace(/{Date}/g, date)
          .replace(/{Time}/g, time)
          .replace(/{Branch}/g, branch)
          .replace(/{Amount}/g, amount)
          .replace(/{Provider}/g, provider)
          .replace(/{PortalLink}/g, 'Offline issuance only')
          .replace(/{BookingLink}/g, 'dentsched.ph/book');

      const smsCfg = fieldSettings.smsConfig;
      if (smsCfg.mode === 'LOCAL' && smsCfg.gatewayUrl) {
          try {
              const res = await fetch(smsCfg.gatewayUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ to: patient.phone, message, key: smsCfg.apiKey })
              });
              if (res.ok) logAction('SEND_SMS', 'SmsQueue', patient.id, `Sent "${config.label}": ${message}`);
          } catch (err) {
              logAction('SECURITY_ALERT', 'SmsQueue', patient.id, `Gateway Failure: ${err}`);
          }
      }
  }, [fieldSettings, currentBranch, isOnline, systemStatus]);

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

  const logAction = async (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string, previousState?: any, newState?: any) => {
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
              hash: currentHash,
              previousHash: prevHash
          };

          try {
            const shadowEntry = { t: newLog.timestamp, a: newLog.action, e: newLog.entityId, h: newLog.hash };
            const existingShadow = JSON.parse(localStorage.getItem(GHOST_LOG_KEY) || '[]');
            localStorage.setItem(GHOST_LOG_KEY, JSON.stringify([shadowEntry, ...existingShadow]));
          } catch (err) {
            console.error("Forensic shadow write failed", err);
          }

          return [newLog, ...prev];
      });
  };

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsInitializing(true);
      setLoginSubtext('Securing Vault...');
      setCryptoStatus('[IO] EXTRACTING_SALT');
      setDerivationProgress(10);

      try {
          let salt = localStorage.getItem(SALT_KEY);
          if (!salt) {
              salt = window.crypto.getRandomValues(new Uint8Array(16)).join('');
              localStorage.setItem(SALT_KEY, salt);
          }

          setCryptoStatus('[CPU] PBKDF2_ITERATE_100K');
          setDerivationProgress(30);
          
          const progressInterval = setInterval(() => {
              setDerivationProgress(p => p < 75 ? p + 5 : p);
          }, 400);

          const derivedKey = await getCryptoKey(passwordInput, salt);
          clearInterval(progressInterval);
          setDerivationProgress(80);
          setCryptoStatus('[SEC] VERIFYING_CANARY_V2');

          const storedCanary = localStorage.getItem(CANARY_KEY);
          
          if (storedCanary) {
              try {
                  const check = await decryptNative(storedCanary, derivedKey);
                  if (check !== VERIFICATION_TOKEN) {
                      toast.error("Incorrect password.");
                      setIsInitializing(false);
                      setDerivationProgress(0);
                      return;
                  }
              } catch (err: any) {
                  setCryptoStatus('[ERR] CORRUPTED_SECURITY_METADATA');
                  toast.error("Auth failed. Local metadata corrupt.");
                  setIsInitializing(false);
                  setDerivationProgress(0);
                  return;
              }
          } else {
              const encCanary = await encryptNative(VERIFICATION_TOKEN, derivedKey);
              localStorage.setItem(CANARY_KEY, encCanary);
          }

          setDerivationProgress(90);
          setCryptoStatus('[IO] SYNCING_CLINICAL_REGISTRY');
          setEncryptionKey(derivedKey);
          await loadSecureData(derivedKey);
          
          setDerivationProgress(100);
          setIsAuthenticated(true);
          setIsInitializing(false);
          logAction('LOGIN', 'System', 'Session', `User logged in.`);
      } catch (error: any) {
          setIsInitializing(false);
          setDerivationProgress(0);
          if (error.name === 'OperationError' || error.name === 'QuotaExceededError') {
              setCryptoStatus('[ERR] HARDWARE_RESTRICTION');
              toast.error("Hardware Limitation: High security derivation failed.");
          } else {
              setCryptoStatus('[ERR] UNKNOWN_FAULT');
              toast.error("Security module encountered a technical error.");
          }
      }
  };

  const loadSecureData = async (key: CryptoKey) => {
      const load = async (k: string, def: any) => {
          const enc = localStorage.getItem(k);
          if (!enc) return def;
          try { return await decryptNative(enc, key); } catch (e) { return def; } 
      };

      setLoginSubtext('Syncing records...');
      const [pts, apts, members, settings] = await Promise.all([
          load('dentsched_patients_v2', PATIENTS),
          load('dentsched_appointments_v2', APPOINTMENTS),
          load('dentsched_staff_v2', STAFF),
          load('dentsched_fields_v2', null)
      ]);

      setPatients(pts); setAppointments(apts); setStaff(members);
      if (settings) setFieldSettings(settings);

      setLoginSubtext('Verifying logs...');
      const [inv, cycles, scheduled, logs, tasksList, hClaims, pClaims, incs, refs, recons, cSess, xfers, pPeriods, pAdjs, cDisps, oQueue, sConfs, sStatus] = await Promise.all([
          load('dentsched_stock_v2', MOCK_STOCK),
          load('dentsched_sterilization_v2', MOCK_STERILIZATION_CYCLES),
          load('dentsched_scheduled_sms_v2', []),
          load('dentsched_auditlog_v2', []),
          load('dentsched_pinboard_tasks_v2', []),
          load('dentsched_hmo_claims_v2', MOCK_CLAIMS),
          load('dentsched_philhealth_claims_v2', []),
          load('dentsched_incidents_v2', []),
          load('dentsched_referrals_v2', []),
          load('dentsched_reconciliations_v2', []),
          load('dentsched_cash_sessions_v2', []),
          load('dentsched_transfers_v2', []),
          load('dentsched_payroll_periods_v2', []),
          load('dentsched_payroll_adjustments_v2', []),
          load('dentsched_commission_disputes_v2', []),
          load('dentsched_offline_queue_v2', []),
          load('dentsched_sync_conflicts_v2', []),
          load('dentsched_system_status_v2', SystemStatus.OPERATIONAL)
      ]);

      setStock(inv); setSterilizationCycles(cycles); setScheduledSms(scheduled); setTask(tasksList);
      setHmoClaims(hClaims); setPhilHealthClaims(pClaims); setIncidents(incs); setReferrals(refs);
      setReconciliations(recons); setCashSessions(cSess); setTransfers(xfers); setPayrollPeriods(pPeriods);
      setPayrollAdjustments(pAdjs); setCommissionDisputes(cDisps); setOfflineQueue(oQueue); setSyncConflicts(sConfs);
      setSystemStatus(sStatus);
      
      setAuditLog(logs.length > 0 ? logs : MOCK_AUDIT_LOG);
      setIsAuditLogVerified(verifyAuditTrail(logs));
  };

  useEffect(() => {
      if (!isAuthenticated || !encryptionKey) return;
      const save = async (k: string, data: any) => {
          const enc = await encryptNative(data, encryptionKey);
          localStorage.setItem(k, enc);
      };
      save('dentsched_appointments_v2', appointments);
      save('dentsched_patients_v2', patients);
      save('dentsched_staff_v2', staff);
      save('dentsched_stock_v2', stock);
      save('dentsched_sterilization_v2', sterilizationCycles);
      save('dentsched_auditlog_v2', auditLog);
      save('dentsched_pinboard_tasks_v2', tasks);
      save('dentsched_fields_v2', fieldSettings);
      localStorage.setItem('dentsched_public_branding', fieldSettings.clinicName);
  }, [appointments, patients, staff, stock, sterilizationCycles, auditLog, tasks, fieldSettings, isAuthenticated, encryptionKey]);

  const handleUpdatePatientRecall = (patientId: string, status: RecallStatus) => {
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, recallStatus: status } : p));
      logAction('UPDATE', 'Patient', patientId, `Updated recall status to ${status}.`);
  };

  const handleSaveAppointment = (newAppointment: Appointment) => {
    const aptWithSync = { ...newAppointment, branch: newAppointment.branch || currentBranch, isPendingSync: !isOnline } as Appointment;
    setAppointments(prev => {
        const idx = prev.findIndex(a => a.id === aptWithSync.id);
        if (idx >= 0) { const next = [...prev]; next[idx] = aptWithSync; return next; }
        return [...prev, aptWithSync];
    });
  };

  const handleUpdateAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => {
      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status, isPendingSync: !isOnline } : a));
      logAction('UPDATE', 'Appointment', appointmentId, `Updated status to ${status}.`);
  };

  const handleSavePatient = (newPatientData: Partial<Patient>) => {
    const existing = patients.find(p => p.id === newPatientData.id);
    if (existing) {
        const updated = { ...existing, ...newPatientData } as Patient;
        setPatients(prev => prev.map(p => p.id === existing.id ? updated : p));
        logAction('UPDATE', 'Patient', existing.id, 'Updated registration', existing, updated);
    } else {
        const newPatient: Patient = { ...newPatientData as Patient, id: `p_${Date.now()}`, lastVisit: 'First Visit', nextVisit: null, recallStatus: 'Due' };
        setPatients(prev => [...prev, newPatient]);
        logAction('CREATE', 'Patient', newPatient.id, 'Registered new patient');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard appointments={appointments.filter(a => a.branch === currentBranch)} patientsCount={patients.length} staffCount={staff.length} staff={staff} currentUser={currentUser} patients={patients} onAddPatient={() => setIsPatientModalOpen(true)} onPatientSelect={setSelectedPatientId} onBookAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }} onUpdateAppointmentStatus={handleUpdateAppointmentStatus} onCompleteRegistration={(id) => { const p = patients.find(pt => pt.id === id); if (p) { setEditingPatient(p); setIsPatientModalOpen(true); }}} onUpdatePatientRecall={handleUpdatePatientRecall} fieldSettings={fieldSettings} currentBranch={currentBranch} onSaveConsent={(aid, url) => setAppointments(prev => prev.map(a => a.id === aid ? { ...a, signedConsentUrl: url } : a))} />;
      case 'schedule': return <CalendarView appointments={appointments.filter(a => a.branch === currentBranch)} staff={staff} onAddAppointment={(d, t, pid, apt) => { setBookingDate(d); setBookingTime(t); setInitialBookingPatientId(pid); setEditingAppointment(apt || null); setIsAppointmentModalOpen(true); }} patients={patients} currentBranch={currentBranch} fieldSettings={fieldSettings} />;
      case 'patients': return <PatientList patients={patients} appointments={appointments} currentUser={currentUser} selectedPatientId={selectedPatientId} onSelectPatient={setSelectedPatientId} onAddPatient={() => setIsPatientModalOpen(true)} onEditPatient={(p) => { setEditingPatient(p); setIsPatientModalOpen(true); }} onQuickUpdatePatient={handleSavePatient} onDeletePatient={() => {}} onBookAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }} fieldSettings={fieldSettings} logAction={logAction} staff={staff} />;
      case 'inventory': return <Inventory stock={stock} onUpdateStock={setStock} currentUser={currentUser} sterilizationCycles={sterilizationCycles} onAddCycle={(c) => setSterilizationCycles(prev => [...prev, c])} currentBranch={currentBranch} availableBranches={fieldSettings.branches} fieldSettings={fieldSettings} appointments={appointments} />;
      case 'financials': return <Financials claims={hmoClaims} expenses={MOCK_EXPENSES} philHealthClaims={philHealthClaims} currentUser={currentUser} appointments={appointments} patients={patients} fieldSettings={fieldSettings} staff={staff} currentBranch={currentBranch} payrollPeriods={payrollPeriods} payrollAdjustments={payrollAdjustments} commissionDisputes={commissionDisputes} onUpdatePayrollPeriod={(p) => {}} onAddPayrollAdjustment={(a) => {}} onApproveAdjustment={(id) => {}} onAddCommissionDispute={(d) => {}} onResolveCommissionDispute={(id) => {}} />;
      case 'field-mgmt': return <FieldManagement settings={fieldSettings} onUpdateSettings={setFieldSettings} staff={staff} auditLog={auditLog} patients={patients} onPurgePatient={() => {}} auditLogVerified={isAuditLogVerified} encryptionKey={encryptionKey ? 'PROTECTED_KEY' : null} incidents={incidents} onSaveIncident={() => {}} appointments={appointments} />;
      default: return null;
    }
  };

  if (!isAuthenticated) {
      return (
          <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 overflow-hidden relative">
                  {isInitializing && (
                      <div className="absolute inset-0 bg-teal-500/5 pointer-events-none transition-all duration-1000" style={{ opacity: derivationProgress / 100 }} />
                  )}

                  <div className="flex flex-col items-center mb-10 relative z-10">
                      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl mb-6 transition-all duration-700 ${isInitializing ? 'bg-teal-950 animate-pulse scale-90' : 'bg-teal-600'}`}>
                          {isInitializing ? (
                              <div className="relative">
                                  <Loader2 size={40} className="text-teal-400 animate-spin" />
                                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-teal-200">{derivationProgress}%</span>
                              </div>
                          ) : <ShieldCheck size={40} className="text-white"/>}
                      </div>
                      <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter text-center">{fieldSettings.clinicName}</h1>
                      <div className="mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex flex-col items-center gap-1">
                          {isInitializing ? (
                              <>
                                <span className="text-teal-600 animate-pulse">{loginSubtext}</span>
                                <span className="font-mono text-[8px] opacity-60">{cryptoStatus}</span>
                              </>
                          ) : (
                              <>Native Encryption Active</>
                          )}
                      </div>
                  </div>

                  {envStatus === 'INSECURE' ? (
                      <div className="mb-8 p-6 bg-red-600 text-white rounded-[2rem] flex flex-col items-center text-center gap-4 animate-in zoom-in-95">
                          <ShieldX size={48} className="animate-bounce" />
                          <div>
                              <h4 className="font-black uppercase text-base tracking-widest">Protocol Violation</h4>
                              <p className="text-xs font-bold mt-2 uppercase">HTTPS REQUIRED: Encryption disabled on insecure connections.</p>
                          </div>
                      </div>
                  ) : (
                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 mb-2 block">Security Credential</label>
                            <input type="password" required disabled={isInitializing} value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none text-xl font-bold tracking-widest" placeholder="••••••••" />
                        </div>
                        <button type="submit" disabled={isInitializing || !passwordInput} className={`w-full py-5 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-2xl transition-all ${isInitializing ? 'bg-slate-800' : 'bg-teal-600 shadow-teal-600/30 hover:bg-teal-700'}`}>
                          {isInitializing ? `${loginSubtext} ${derivationProgress}%` : 'Access Records'}
                        </button>
                    </form>
                  )}

                  <div className="mt-10 pt-6 border-t border-slate-50 flex flex-col items-center gap-4 relative z-10">
                       <button onClick={() => setShowDiagnosticOverlay(true)} className="text-[9px] font-black text-teal-700 uppercase tracking-[0.15em] flex items-center gap-1.5 hover:underline"><Info size={12}/> Troubleshoot Connection</button>
                  </div>
              </div>

              {showDiagnosticOverlay && (
                  <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in">
                      <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border-4 border-teal-600 overflow-y-auto max-h-[95vh]">
                          <div className="flex flex-col items-center text-center gap-4 mb-8">
                                <div className="bg-teal-50 p-4 rounded-3xl text-teal-600"><ShieldAlert size={40}/></div>
                                <h2 className="text-2xl font-black uppercase">Security Audit</h2>
                          </div>
                          <div className="mb-8 p-6 bg-red-50 rounded-[2rem] border-2 border-red-100 space-y-4">
                              <div className="flex items-center gap-3 text-red-800"><Database size={20} /><h4 className="font-black uppercase text-xs">Vault Maintenance</h4></div>
                              <p className="text-[10px] text-red-900 font-bold uppercase leading-tight">If login fails repeatedly, reset security metadata.</p>
                              <button onClick={resetSecurityVault} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg"><Trash2 size={14}/> Purge Security Metadata</button>
                          </div>
                          <button onClick={() => setShowDiagnosticOverlay(false)} className="w-full py-5 bg-teal-900 text-white rounded-2xl font-black uppercase text-xs">Return to Login</button>
                      </div>
                  </div>
              )}
          </div>
      )
  }

  return (
    <div className={isInKioskMode ? "kiosk-mode h-full" : "h-full"}>
        <Layout activeTab={activeTab} setActiveTab={setActiveTab} onAddAppointment={() => setIsAppointmentModalOpen(true)} currentUser={currentUser} onSwitchUser={setCurrentUser} staff={staff} currentBranch={currentBranch} availableBranches={fieldSettings.branches} onChangeBranch={setCurrentBranch} fieldSettings={fieldSettings} onGenerateReport={() => {}} tasks={tasks} onToggleTask={(id) => setTask(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))} onEnterKioskMode={() => setIsInKioskMode(true)} isOnline={isOnline} systemStatus={systemStatus} onSwitchSystemStatus={setSystemStatus}>
        {showTamperAlert && (
            <div className="fixed top-0 left-0 right-0 z-[1000] bg-black text-red-50 p-4 flex items-center justify-center gap-4 animate-in slide-in-from-top-full">
                <ShieldAlert size={32} className="animate-pulse" />
                <div className="text-center"><h2 className="text-xl font-black uppercase">NPC SECURITY ALERT</h2></div>
                <button onClick={() => setShowTamperAlert(false)} className="bg-red-500 text-black px-4 py-1 rounded font-black">Dismiss</button>
            </div>
        )}
        {renderContent()}
        {isAppointmentModalOpen && <AppointmentModal isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} patients={patients} staff={staff} appointments={appointments} onSave={handleSaveAppointment} onSavePatient={handleSavePatient} initialDate={bookingDate} initialTime={bookingTime} initialPatientId={initialBookingPatientId} existingAppointment={editingAppointment} fieldSettings={fieldSettings} isDowntime={systemStatus === SystemStatus.DOWNTIME} onManualOverride={handleManualOverride} />}
        {isPatientModalOpen && <PatientRegistrationModal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} onSave={handleSavePatient} initialData={editingPatient} fieldSettings={fieldSettings} patients={patients} />}
        </Layout>
    </div>
  );
}

export default App;
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
const PBKDF2_ITERATIONS = 100000; // Optimized for Tablet Hardware acceleration
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
        const currentHash = CryptoJS.SHA256(payload).toString();
        if (current.hash !== currentHash || current.previousHash !== prev.hash) {
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

  // Environment Diagnostic States
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

  // Environment Check Bootstrap
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
        setFatalError("Hardware Restriction: The Web Crypto API is disabled in this standalone environment.");
        return;
      }

      setEnvStatus('VERIFIED');
    };
    checkEnv();
  }, []);

  const resetSecurityVault = () => {
      const confirmReset = window.confirm("NUCEAL RESET: This will purge local security metadata (SALT and CANARY). You will lose access to local data if you do not have the master password. Proceed?");
      if (confirmReset) {
          localStorage.removeItem(SALT_KEY);
          localStorage.removeItem(CANARY_KEY);
          // Purge encrypted clinical keys (v2) but keep public branding
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
                  body: JSON.stringify({
                      to: patient.phone,
                      message: message,
                      key: smsCfg.apiKey
                  })
              });
              if (res.ok) {
                  logAction('SEND_SMS', 'SmsQueue', patient.id, `Sent "${config.label}" via Capcom Direct: ${message}`);
              } else {
                  throw new Error("Gateway error");
              }
          } catch (err) {
              logAction('SECURITY_ALERT', 'SmsQueue', patient.id, `Capcom Direct Failure for "${config.label}": ${err}`);
              toast.error("SMS Gateway unreachable.");
          }
      } else if (smsCfg.mode === 'CLOUD' && smsCfg.cloudUrl) {
          try {
              const res = await fetch(smsCfg.cloudUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      username: smsCfg.username,
                      password: smsCfg.password,
                      device_id: smsCfg.deviceId,
                      to: patient.phone,
                      message: message
                  })
              });
              if (res.ok) {
                  logAction('SEND_SMS', 'SmsQueue', patient.id, `Sent "${config.label}" via Cloud Server: ${message}`);
              } else {
                  throw new Error("Cloud Gateway error");
              }
          } catch (err) {
              logAction('SECURITY_ALERT', 'SmsQueue', patient.id, `Cloud Gateway Failure for "${config.label}": ${err}`);
              toast.error("SMS Cloud Gateway unreachable.");
          }
      } else {
          logAction('SEND_SMS', 'SmsQueue', patient.id, `Simulated send for "${config.label}" (${smsCfg.mode}): ${message}`);
      }
  }, [fieldSettings, currentBranch, isOnline, systemStatus]);

  useEffect(() => {
    if (isAuthenticated && scheduledSms.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const due = scheduledSms.filter(s => s.status === 'Pending' && s.dueDate <= today);
      
      if (due.length > 0) {
        toast.info(`Auto-Processing ${due.length} scheduled caring messages...`);
        due.forEach(msg => {
          const patient = patients.find(p => p.id === msg.patientId);
          if (patient) {
            triggerSms(msg.templateId, patient, msg.data);
          }
        });
        setScheduledSms(prev => prev.map(s => (s.dueDate <= today ? { ...s, status: 'Sent' } : s)));
      }
    }
  }, [isAuthenticated, patients, triggerSms]);

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
      logAction('UPDATE', 'System', 'Sync', `Successfully reconciled ${offlineQueue.length} offline events.`);
  };

  const effectiveUser = useMemo(() => ({
    ...currentUser,
    isReadOnly: false
  }), [currentUser]);

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

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setAppointments(prev => prev.map(a => {
        if (a.status === AppointmentStatus.ARRIVED && a.queuedAt && a.triageLevel) {
          const queuedTime = new Date(a.queuedAt).getTime();
          if (now - queuedTime > EMERGENCY_STALE_THRESHOLD && !a.isStale) {
            logAction('SECURITY_ALERT', 'Appointment', a.id, `Emergency record ${a.id} exceeded 60m threshold without clinical seat.`);
            return { ...a, isStale: true };
          }
        }
        return a;
      }));
    }, 30000); 
    return () => clearInterval(timer);
  }, []);

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
          
          // PBKDF2 is a single await, so we simulate progress feedback
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
                  toast.error("Authentication failed. Security metadata corrupt or invalid key.");
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
          setLoginSubtext('Opening clinical vault...');
          await loadSecureData(derivedKey);
          
          setDerivationProgress(100);
          setIsAuthenticated(true);
          setIsInitializing(false);
          logAction('LOGIN', 'System', 'Session', `User logged in. Status: ${navigator.onLine ? 'Online' : 'Offline'}`);
      } catch (error: any) {
          setIsInitializing(false);
          setDerivationProgress(0);
          console.error(error);
          
          if (error.name === 'OperationError' || error.name === 'QuotaExceededError') {
              setCryptoStatus('[ERR] HARDWARE_RESTRICTION_TRIGGERED');
              toast.error("Hardware Limitation: Device unable to complete clinical key derivation.");
          } else if (error.name === 'InvalidAccessError') {
              setCryptoStatus('[ERR] ACCESS_DENIED_SECURE');
              toast.error("Security module denied access to derivation hardware.");
          } else {
              setCryptoStatus('[ERR] UNKNOWN_CRYPTOGRAPHIC_FAULT');
              toast.error("Security mode encountered a technical error.");
          }
      }
  };

  const loadSecureData = async (key: CryptoKey) => {
      const load = async (k: string, def: any) => {
          const enc = localStorage.getItem(k);
          if (!enc) return def;
          try {
              return await decryptNative(enc, key);
          } catch (e) { 
              console.warn(`Decryption failed for ${k}`, e);
              return def; 
          } 
      };

      // --- PHASE 1: PRIORITIZED BOOTSTRAP (Essential Clinical Data) ---
      setLoginSubtext('Syncing clinical registry...');
      const [pts, apts, members, settings] = await Promise.all([
          load('dentsched_patients_v2', PATIENTS),
          load('dentsched_appointments_v2', APPOINTMENTS),
          load('dentsched_staff_v2', STAFF),
          load('dentsched_fields_v2', null)
      ]);

      setPatients(pts);
      setAppointments(apts);
      setStaff(members);
      if (settings) {
          const mergedSettings = {
              ...DEFAULT_FIELD_SETTINGS,
              ...settings,
              features: { ...DEFAULT_FIELD_SETTINGS.features, ...(settings.features || {}) }
          };
          setFieldSettings(mergedSettings);
          localStorage.setItem('dentsched_public_branding', mergedSettings.clinicName);
      }

      // --- PHASE 2: SECONDARY DATA (Background Decryption) ---
      setLoginSubtext('Analyzing forensic logs...');
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

      setStock(inv);
      setSterilizationCycles(cycles);
      setScheduledSms(scheduled);
      setTask(tasksList);
      setHmoClaims(hClaims);
      setPhilHealthClaims(pClaims);
      setIncidents(incs);
      setReferrals(refs);
      setReconciliations(recons);
      setCashSessions(cSess);
      setTransfers(xfers);
      setPayrollPeriods(pPeriods);
      setPayrollAdjustments(pAdjs);
      setCommissionDisputes(cDisps);
      setOfflineQueue(oQueue);
      setSyncConflicts(sConfs);
      setSystemStatus(sStatus);
      
      try {
        const shadowLogs = JSON.parse(localStorage.getItem(GHOST_LOG_KEY) || '[]');
        if (logs.length === 0 && shadowLogs.length > 0) {
            setShowTamperAlert(true);
            toast.error("NPC SECURITY BREACH: Primary audit log wiped while forensic shadow exists.");
        }
      } catch (e) { console.error("Integrity check failed"); }

      setAuditLog(logs.length > 0 ? logs : MOCK_AUDIT_LOG);
      setIsAuditLogVerified(verifyAuditTrail(logs));
  };

  useEffect(() => {
      if (!isAuthenticated || !encryptionKey) return;
      const save = async (k: string, data: any) => {
          const enc = await encryptNative(data, encryptionKey);
          localStorage.setItem(k, enc);
      };

      const saveAll = async () => {
          await Promise.all([
            save('dentsched_appointments_v2', appointments),
            save('dentsched_patients_v2', patients),
            save('dentsched_staff_v2', staff),
            save('dentsched_stock_v2', stock),
            save('dentsched_sterilization_v2', sterilizationCycles),
            save('dentsched_auditlog_v2', auditLog),
            save('dentsched_pinboard_tasks_v2', tasks),
            save('dentsched_fields_v2', fieldSettings),
            save('dentsched_hmo_claims_v2', hmoClaims),
            save('dentsched_philhealth_claims_v2', philHealthClaims),
            save('dentsched_incidents_v2', incidents),
            save('dentsched_referrals_v2', referrals),
            save('dentsched_reconciliations_v2', reconciliations),
            save('dentsched_cash_sessions_v2', cashSessions),
            save('dentsched_transfers_v2', transfers),
            save('dentsched_payroll_periods_v2', payrollPeriods),
            save('dentsched_payroll_adjustments_v2', payrollAdjustments),
            save('dentsched_commission_disputes_v2', commissionDisputes),
            save('dentsched_offline_queue_v2', offlineQueue),
            save('dentsched_sync_conflicts_v2', syncConflicts),
            save('dentsched_system_status_v2', systemStatus),
            save('dentsched_scheduled_sms_v2', scheduledSms)
          ]);
          localStorage.setItem('dentsched_public_branding', fieldSettings.clinicName);
      };
      
      saveAll();
  }, [appointments, patients, staff, stock, sterilizationCycles, auditLog, tasks, fieldSettings, hmoClaims, philHealthClaims, incidents, referrals, reconciliations, cashSessions, transfers, payrollPeriods, payrollAdjustments, commissionDisputes, offlineQueue, syncConflicts, systemStatus, scheduledSms, isAuthenticated, encryptionKey]);

  const resetIdleTimer = () => {
      if (isSessionLocked || !isAuthenticated) return;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setIsSessionLocked(true), IDLE_TIMEOUT_MS);
  };

  useEffect(() => {
      const events = ['mousemove', 'keydown', 'click', 'scroll'];
      const handler = () => resetIdleTimer();
      events.forEach(e => window.addEventListener(e, handler));
      resetIdleTimer();
      return () => {
          events.forEach(e => window.removeEventListener(e, handler));
          if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      };
  }, [isSessionLocked, isAuthenticated]);

  const handleUpdatePatientRecall = (patientId: string, status: RecallStatus) => {
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, recallStatus: status } : p));
      logAction('UPDATE', 'Patient', patientId, `Updated recall pipeline status to ${status}.`);
  };

  const handleSaveAppointment = (newAppointment: Appointment) => {
    const isManual = systemStatus === SystemStatus.DOWNTIME;
    const existing = appointments.find(a => a.id === newAppointment.id);
    
    const aptWithSync = { 
        ...newAppointment, 
        branch: newAppointment.branch || currentBranch, 
        isPendingSync: !isOnline,
        entryMode: isManual ? 'MANUAL' : 'AUTO',
        reconciled: !isManual
    } as Appointment;
    
    const patient = patients.find(p => p.id === newAppointment.patientId);

    if (existing && patient) {
        if (existing.date !== newAppointment.date || existing.time !== newAppointment.time) {
            triggerSms('reschedule', patient, { date: newAppointment.date, time: newAppointment.time, procedure: newAppointment.type });
        }
    }

    if (!isOnline) {
        setOfflineQueue(prev => [...prev, { id: `intent_${Date.now()}`, action: 'CREATE_APPOINTMENT', payload: aptWithSync, timestamp: new Date().toISOString() }]);
        toast.info("Appointment queued for offline sync.");
    }
    
    if (aptWithSync.labStatus === LabStatus.RECEIVED && (!editingAppointment || editingAppointment.labStatus !== LabStatus.RECEIVED)) {
        const vendor = fieldSettings.vendors.find(v => v.id === aptWithSync.labDetails?.vendorId);
        logAction('CREATE', 'Financials', 'Expense', `Automated Lab Expense Entry: Lab set "${aptWithSync.id}" received from ${vendor?.name || 'Lab'}.`);
        toast.info("Automated Lab Expense entry generated.");
    }
    
    if (aptWithSync.labStatus === LabStatus.DELAYED && (!existing || existing.labStatus !== LabStatus.DELAYED)) {
        if (patient) triggerSms('lab_delay', patient, { procedure: aptWithSync.type });
    }

    setAppointments(prev => {
        const existingIndex = prev.findIndex(a => a.id === aptWithSync.id);
        if (existingIndex >= 0) {
            const updated = [...prev]; updated[existingIndex] = aptWithSync; return updated;
        } else { 
            if (patient) {
                const updatedStats = {
                    ...(patient.attendanceStats || { totalBooked: 0, completedCount: 0, noShowCount: 0, lateCancelCount: 0 }),
                    totalBooked: (patient.attendanceStats?.totalBooked || 0) + 1
                };
                setPatients(pts => pts.map(p => p.id === patient.id ? { ...p, attendanceStats: updatedStats } : p));

                const doctor = staff.find(s => s.id === newAppointment.providerId)?.name || 'Dr. Alexander';
                triggerSms('booking', patient, { date: newAppointment.date, time: newAppointment.time, procedure: newAppointment.type, doctor, branch: newAppointment.branch });
            }
            return [...prev, aptWithSync]; 
        }
    });
  };

  const finalizeUpdateStatus = (id: string, status: AppointmentStatus) => {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;
    const patient = patients.find(p => p.id === apt.patientId);

    if (patient && apt.status !== status) {
        const stats = patient.attendanceStats || { totalBooked: 1, completedCount: 0, noShowCount: 0, lateCancelCount: 0 };
        let newStats = { ...stats };
        if (apt.status === AppointmentStatus.COMPLETED) newStats.completedCount--;
        if (apt.status === AppointmentStatus.NO_SHOW) newStats.noShowCount--;
        if (apt.status === AppointmentStatus.CANCELLED) newStats.lateCancelCount--;
        if (status === AppointmentStatus.COMPLETED) newStats.completedCount++;
        if (status === AppointmentStatus.NO_SHOW) newStats.noShowCount++;
        if (status === AppointmentStatus.CANCELLED) newStats.lateCancelCount++;
        const denominator = newStats.completedCount + newStats.noShowCount + newStats.lateCancelCount;
        const score = denominator > 0 ? Math.round((newStats.completedCount / denominator) * 100) : 100;
        setPatients(prev => prev.map(p => p.id === patient.id ? { ...p, attendanceStats: newStats, reliabilityScore: score } : p));
        
        if (status === AppointmentStatus.CANCELLED) {
            triggerSms('cancellation', patient, { date: apt.date });
        }
    }

    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status, isPendingSync: !isOnline } : a));
    logAction('UPDATE', 'Appointment', id, `Updated status to ${status}.`);
  };

  const handleUpdateAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => {
      const apt = appointments.find(a => a.id === appointmentId);
      if (!apt) return;

      const patient = patients.find(p => p.id === apt.patientId);

      if (status === AppointmentStatus.TREATING && patient) {
          const hasRisk = (patient.medicalConditions?.some(c => c !== 'None')) || (patient.allergies?.some(a => a !== 'None'));
          if (hasRisk) {
              setPendingSafetyTimeout({ appointmentId, status, patient });
              return;
          }
      }

      if ([AppointmentStatus.SEATED, AppointmentStatus.TREATING].includes(status)) {
        const isSurgical = ['Surgery', 'Extraction'].includes(apt.type);
        if (isSurgical && patient) {
            const hasCriticalCondition = patient.medicalConditions?.some(c => CRITICAL_CLEARANCE_CONDITIONS.includes(c));
            
            if (hasCriticalCondition) {
                const activeClearance = patient.clearanceRequests?.find(r => r.status === 'Approved');
                if (!activeClearance) {
                    toast.error("REFERRAL HARD-STOP (PDA Rule 4): Medical clearance is REQUIRED for a critical condition before surgical seating.");
                    logAction('SECURITY_ALERT', 'Appointment', appointmentId, `Hard-Stop Triggered: Attempted surgical seating on high-risk patient without verified medical clearance.`);
                    return;
                }
            }
        }
      }

      if (status === AppointmentStatus.COMPLETED) {
          const isSurgical = ['Surgery', 'Extraction'].includes(apt.type);
          if (isSurgical && !apt.postOpVerified) {
              setPendingPostOpAppointment(apt);
              return;
          }
      }

      if (!isOnline) {
          setOfflineQueue(prev => [...prev, { id: `intent_${Date.now()}`, action: 'UPDATE_STATUS', payload: { id: appointmentId, status }, timestamp: new Date().toISOString() }]);
          toast.info("Status update queued for offline sync.");
      }

      finalizeUpdateStatus(appointmentId, status);
  };

  const handleSavePatient = (newPatientData: Partial<Patient>) => {
    const dataWithTimestamp = { ...newPatientData, lastDigitalUpdate: new Date().toISOString() };
    const existing = patients.find(p => p.id === newPatientData.id);

    if (!isOnline) {
        setOfflineQueue(prev => [...prev, { id: `intent_${Date.now()}`, action: 'REGISTER_PATIENT', payload: dataWithTimestamp, timestamp: new Date().toISOString() }]);
        toast.info("Patient update queued for offline sync.");
    }

    if (existing) {
        const updatedPatient = { ...existing, ...dataWithTimestamp } as Patient;
        logAction('UPDATE', 'Patient', existing.id, 'Updated patient registration details', existing, updatedPatient);
        setPatients(prev => prev.map(p => p.id === newPatientData.id ? updatedPatient : p));
        triggerSms('update_registration', updatedPatient);
        setEditingPatient(null);
    } else {
        const newPatient: Patient = { ...dataWithTimestamp as Patient, id: newPatientData.id || `p_new_${Date.now()}`, lastVisit: 'First Visit', nextVisit: null, notes: newPatientData.notes || '', recallStatus: 'Due' };
        logAction('CREATE', 'Patient', newPatient.id, 'Registered new patient');
        
        if (newPatient.referredById) {
            const referrer = patients.find(p => p.id === newPatient.referredById);
            if (referrer) triggerSms('referral_thanks', referrer);
        }

        setPatients(prev => [...prev, newPatient]);
        triggerSms('welcome', newPatient);
    }
  };

  const handleQuickUpdatePatient = (updatedPatient: Patient) => {
      const original = patients.find(p => p.id === updatedPatient.id);
      if (original) {
          updatedPatient.dentalChart?.forEach(entry => {
              const origEntry = original.dentalChart?.find(e => e.id === entry.id);
              
              if (entry.patientSignature && !origEntry?.patientSignature) {
                  triggerSms('treatment_signed', updatedPatient, { procedure: entry.procedure });
                  
                  const getOffsetDate = (days: number) => {
                      const d = new Date();
                      d.setDate(d.getDate() + days);
                      return d.toISOString().split('T')[0];
                  };

                  const followUps: ScheduledSms[] = [
                      { id: `sch_${Date.now()}_1`, patientId: updatedPatient.id, templateId: 'followup_1w', dueDate: getOffsetDate(7), data: { procedure: entry.procedure }, status: 'Pending' },
                      { id: `sch_${Date.now()}_2`, patientId: updatedPatient.id, templateId: 'followup_1m', dueDate: getOffsetDate(30), data: { procedure: entry.procedure }, status: 'Pending' },
                      { id: `sch_${Date.now()}_3`, patientId: updatedPatient.id, templateId: 'followup_3m', dueDate: getOffsetDate(90), data: { procedure: entry.procedure }, status: 'Pending' }
                  ];
                  setScheduledSms(prev => [...prev, ...followUps]);
                  toast.info("Patient Care follow-ups scheduled for T+7, T+30, and T+90 days.");
              }
          });
      }
      setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const handleUpdatePhilHealthClaim = (updated: PhilHealthClaim) => {
      const existing = philHealthClaims.find(c => c.id === updated.id);
      setPhilHealthClaims(prev => prev.map(c => c.id === updated.id ? updated : c));
      if (existing && existing.status !== updated.status) {
          const patient = patients.find(p => p.id === updated.patientId);
          if (patient) triggerSms('philhealth_status', patient, { procedure: updated.procedureName, provider: updated.status });
      }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard appointments={appointments.filter(a => a.branch === currentBranch)} patientsCount={patients.length} staffCount={staff.length} staff={staff} currentUser={effectiveUser} patients={patients} onAddPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} onPatientSelect={setSelectedPatientId} onBookAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }} onUpdateAppointmentStatus={handleUpdateAppointmentStatus} onCompleteRegistration={(id) => { const p = patients.find(pt => pt.id === id); if (p) { setEditingPatient(p); setIsPatientModalOpen(true); }}} onUpdatePatientRecall={handleUpdatePatientRecall} fieldSettings={fieldSettings} onUpdateSettings={setFieldSettings} onViewAllSchedule={() => setActiveTab('schedule')} tasks={tasks} onChangeBranch={setCurrentBranch} currentBranch={currentBranch} onSaveConsent={(aid, url) => setAppointments(prev => prev.map(a => a.id === aid ? { ...a, signedConsentUrl: url } : a))} auditLogVerified={isAuditLogVerified} sterilizationCycles={sterilizationCycles} stock={stock} auditLog={auditLog} logAction={logAction} syncConflicts={syncConflicts} setSyncConflicts={setSyncConflicts} systemStatus={systemStatus} onSwitchSystemStatus={setSystemStatus} onVerifyDowntimeEntry={(id) => setAppointments(prev => prev.map(a => a.id === id ? {...a, entryMode: 'AUTO', reconciled: true} : a))} onVerifyMedHistory={(id) => {}} onConfirmFollowUp={(id) => {}} />;
      case 'schedule': return <CalendarView appointments={appointments.filter(a => a.branch === currentBranch)} staff={staff} onAddAppointment={(d, t, pid, apt) => { setBookingDate(d); setBookingTime(t); setInitialBookingPatientId(pid); setEditingAppointment(apt || null); setIsAppointmentModalOpen(true); }} onMoveAppointment={(id, d, t, pr) => setAppointments(prev => prev.map(a => a.id === id ? { ...a, date: d, time: t, providerId: pr } : a))} currentUser={effectiveUser} patients={patients} currentBranch={currentBranch} fieldSettings={fieldSettings} />;
      case 'patients': return <PatientList patients={patients} appointments={appointments} currentUser={effectiveUser} selectedPatientId={selectedPatientId} onSelectPatient={setSelectedPatientId} onAddPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} onEditPatient={(p) => { setEditingPatient(p); setIsPatientModalOpen(true); }} onQuickUpdatePatient={handleQuickUpdatePatient} onDeletePatient={(id) => {}} onBookAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }} fieldSettings={fieldSettings} logAction={logAction} staff={staff} incidents={incidents} />;
      case 'inventory': return <Inventory stock={stock} onUpdateStock={setStock} currentUser={effectiveUser} sterilizationCycles={sterilizationCycles} onAddCycle={(c) => setSterilizationCycles(prev => [...prev, { id: `c_${Date.now()}`, ...c }])} currentBranch={currentBranch} availableBranches={fieldSettings.branches} transfers={transfers} fieldSettings={fieldSettings} onUpdateSettings={setFieldSettings} appointments={appointments} logAction={logAction} />;
      case 'financials': return <Financials claims={hmoClaims} expenses={MOCK_EXPENSES} philHealthClaims={philHealthClaims} currentUser={effectiveUser} appointments={appointments} patients={patients} fieldSettings={fieldSettings} staff={staff} reconciliations={reconciliations} onSaveReconciliation={(r) => {}} onSaveCashSession={(s) => {}} currentBranch={currentBranch} payrollPeriods={payrollPeriods} payrollAdjustments={payrollAdjustments} commissionDisputes={commissionDisputes} onUpdatePayrollPeriod={(p) => {}} onAddPayrollAdjustment={(a) => {}} onApproveAdjustment={(id) => {}} onAddCommissionDispute={(d) => {}} onResolveCommissionDispute={(id) => {}} onUpdatePhilHealthClaim={handleUpdatePhilHealthClaim} />;
      case 'field-mgmt': return <FieldManagement settings={fieldSettings} onUpdateSettings={setFieldSettings} staff={staff} auditLog={auditLog} patients={patients} onPurgePatient={(id) => {}} auditLogVerified={isAuditLogVerified} encryptionKey={encryptionKey ? 'PROTECTED_HARDWARE_KEY' : null} incidents={incidents} onSaveIncident={(i) => {}} appointments={appointments} />;
      default: return null;
    }
  };

  if (!isAuthenticated) {
      return (
          <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 overflow-hidden relative">
                  {/* Background Progress Glow */}
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
                      <div className="mb-8 p-6 bg-red-600 text-white rounded-[2rem] flex flex-col items-center text-center gap-4 animate-in zoom-in-95 shadow-2xl">
                          <ShieldX size={48} className="animate-bounce" />
                          <div>
                              <h4 className="font-black uppercase text-base tracking-widest">Protocol Violation</h4>
                              <p className="text-xs font-bold leading-relaxed mt-2 uppercase">HTTPS REQUIRED: Clinical encryption is disabled on insecure connections. Please reload via a secure protocol.</p>
                          </div>
                      </div>
                  ) : fatalError ? (
                      <div className="mb-8 p-5 bg-red-50 border-2 border-red-100 rounded-3xl flex flex-col items-center text-center gap-3 animate-in slide-in-from-top-4">
                          <ShieldX size={32} className="text-red-600 animate-pulse" />
                          <div>
                              <h4 className="font-black text-red-900 uppercase text-xs tracking-widest">Environment Restricted</h4>
                              <p className="text-[11px] text-red-800 font-bold leading-relaxed mt-1 uppercase">{fatalError}</p>
                          </div>
                      </div>
                  ) : (
                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 mb-2 block">Security Credential</label>
                            <input 
                              type="password" 
                              required 
                              disabled={isInitializing || !!fatalError}
                              value={passwordInput} 
                              onChange={e => setPasswordInput(e.target.value)} 
                              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none text-xl font-bold tracking-widest placeholder:text-slate-200 shadow-inner disabled:opacity-50" 
                              placeholder="••••••••" 
                            />
                        </div>
                        <button 
                          type="submit" 
                          disabled={isInitializing || !passwordInput || !!fatalError} 
                          className={`w-full py-5 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${isInitializing ? 'bg-slate-800' : 'bg-teal-600 shadow-teal-600/30 hover:bg-teal-700'} disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none`}
                        >
                          {isInitializing ? `${loginSubtext} ${derivationProgress}%` : 'Access Records'}
                        </button>
                        {isInitializing && (
                             <div className="text-center">
                                 <span className="font-mono text-[8px] text-teal-700 uppercase tracking-widest opacity-80">{cryptoStatus}</span>
                             </div>
                        )}
                    </form>
                  )}

                  <div className="mt-10 pt-6 border-t border-slate-50 flex flex-col items-center gap-4 relative z-10">
                       <div className="flex items-center gap-2">
                           <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">System Integrity:</span>
                           <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${envStatus === 'VERIFIED' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                               {envStatus === 'SCANNING' ? 'SCANNING HARDWARE...' : envStatus}
                           </span>
                       </div>
                       <button 
                            onClick={() => setShowDiagnosticOverlay(true)}
                            className="text-[9px] font-black text-teal-700 uppercase tracking-[0.15em] flex items-center gap-1.5 hover:underline"
                        >
                            <Info size={12}/> Troubleshoot Connection
                        </button>
                  </div>

                  {!isOnline && (
                      <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 relative z-10">
                        <Lock size={16} className="text-amber-600"/>
                        <p className="text-[10px] font-black text-amber-800 uppercase tracking-tight">Emergency Offline mode engaged. Data will sync on restore.</p>
                      </div>
                  )}
              </div>

              {showDiagnosticOverlay && (
                  <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                      <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border-4 border-teal-600 animate-in zoom-in-95 overflow-y-auto max-h-[95vh] no-scrollbar">
                          <div className="flex flex-col items-center text-center gap-4 mb-8">
                                <div className="bg-teal-50 p-4 rounded-3xl text-teal-600 shadow-sm"><ShieldAlert size={40}/></div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter">Clinical Security Audit</h2>
                                <p className="text-xs text-slate-600 font-bold leading-relaxed uppercase">Pursuant to RA 10173 and PDA Rule 19, clinical records must be protected by hardware-accelerated encryption.</p>
                          </div>
                          <div className="space-y-4 mb-8">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Secure Protocol (HTTPS)</span>
                                    {window.isSecureContext ? <CheckCircle size={16} className="text-teal-600"/> : <X size={16} className="text-red-600"/>}
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Native Web Crypto API</span>
                                    {window.crypto?.subtle ? <CheckCircle size={16} className="text-teal-600"/> : <X size={16} className="text-red-600"/>}
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hardware Acceleration</span>
                                    <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded uppercase">Optimized</span>
                                </div>
                          </div>

                          <div className="mb-8 p-6 bg-red-50 rounded-[2rem] border-2 border-red-100 space-y-4">
                              <div className="flex items-center gap-3 text-red-800">
                                  <Database size={20} />
                                  <h4 className="font-black uppercase text-xs tracking-widest">Vault Maintenance</h4>
                              </div>
                              <p className="text-[10px] text-red-900 font-bold uppercase leading-tight">If login fails repeatedly, your local cryptographic metadata may be corrupted. Resetting will purge local keys but preserve your public clinic branding.</p>
                              <button 
                                onClick={resetSecurityVault}
                                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                              >
                                  <Trash2 size={14}/> Purge Security Metadata
                              </button>
                          </div>

                          <button 
                            onClick={() => setShowDiagnosticOverlay(false)}
                            className="w-full py-5 bg-teal-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
                          >
                            Return to Login
                          </button>
                      </div>
                  </div>
              )}
          </div>
      )
  }

  return (
    <div className={isInKioskMode ? "kiosk-mode h-full" : "h-full"}>
        <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onAddAppointment={() => setIsAppointmentModalOpen(true)} 
        currentUser={effectiveUser} 
        onSwitchUser={setCurrentUser} 
        staff={staff} 
        currentBranch={currentBranch} 
        availableBranches={fieldSettings.branches} 
        onChangeBranch={setCurrentBranch} 
        fieldSettings={fieldSettings} 
        onGenerateReport={() => {}} 
        tasks={tasks} 
        onToggleTask={(id) => setTask(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))} 
        onEnterKioskMode={() => setIsInKioskMode(true)}
        isOnline={isOnline}
        pendingSyncCount={offlineQueue.length}
        systemStatus={systemStatus}
        onSwitchSystemStatus={setSystemStatus}
        >
        {showTamperAlert && (
            <div className="fixed top-0 left-0 right-0 z-[1000] bg-black text-red-50 p-4 flex items-center justify-center gap-4 animate-in slide-in-from-top-full duration-1000">
                <ShieldAlert size={32} className="animate-pulse" />
                <div className="text-center">
                    <h2 className="text-xl font-black uppercase tracking-tighter">NPC SECURITY ALERT: SYSTEM INTEGRITY VIOLATION</h2>
                    <p className="text-xs font-bold text-red-400">Primary audit log wiped while forensic shadow logs remain. Mandatory 72-hour NPC reporting protocol active.</p>
                </div>
                <button onClick={() => setShowTamperAlert(false)} className="bg-red-500 text-black px-4 py-1 rounded font-black">Dismiss</button>
            </div>
        )}
        
        {renderContent()}

        {isAppointmentModalOpen && (
            <AppointmentModal 
                isOpen={isAppointmentModalOpen} 
                onClose={() => setIsAppointmentModalOpen(false)} 
                patients={patients} 
                staff={staff} 
                appointments={appointments} 
                onSave={handleSaveAppointment}
                onSavePatient={handleSavePatient}
                initialDate={bookingDate}
                initialTime={bookingTime}
                initialPatientId={initialBookingPatientId}
                existingAppointment={editingAppointment}
                fieldSettings={fieldSettings}
                sterilizationCycles={sterilizationCycles}
                isDowntime={systemStatus === SystemStatus.DOWNTIME}
                onManualOverride={handleManualOverride}
            />
        )}

        {isPatientModalOpen && (
            <PatientRegistrationModal 
                isOpen={isPatientModalOpen} 
                onClose={() => setIsPatientModalOpen(false)} 
                onSave={handleSavePatient}
                initialData={editingPatient}
                fieldSettings={fieldSettings}
                patients={patients}
            />
        )}

        {pendingPostOpAppointment && (
            <PostOpHandoverModal 
                isOpen={!!pendingPostOpAppointment} 
                onClose={() => setPendingPostOpAppointment(null)} 
                onConfirm={() => finalizeUpdateStatus(pendingPostOpAppointment.id, AppointmentStatus.COMPLETED)} 
                appointment={pendingPostOpAppointment} 
            />
        )}

        {pendingSafetyTimeout && (
            <SafetyTimeoutModal 
                patient={pendingSafetyTimeout.patient} 
                onConfirm={() => finalizeUpdateStatus(pendingSafetyTimeout.appointmentId, pendingSafetyTimeout.status)} 
            />
        )}

        {isSessionLocked && (
            <div className="fixed inset-0 z-[300] bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-3xl p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto"><Lock size={40}/></div>
                    <h2 className="text-2xl font-black uppercase">Session Locked</h2>
                    <p className="text-slate-500">System locked due to inactivity. Enter your security credentials to resume.</p>
                    <button onClick={() => setIsSessionLocked(false)} className="w-full py-4 bg-teal-600 text-white font-black rounded-xl uppercase">Unlock</button>
                </div>
            </div>
        )}

        {isInKioskMode && (
            <KioskView 
                patients={patients} 
                onUpdatePatient={handleSavePatient} 
                onExitKiosk={() => setIsInKioskMode(false)} 
                fieldSettings={fieldSettings}
                logAction={logAction}
            />
        )}

        </Layout>
    </div>
  );
}

export default App;
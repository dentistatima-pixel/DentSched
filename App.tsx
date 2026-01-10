
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
import { Lock, FileText, CheckCircle, ShieldCheck, ShieldAlert, AlertTriangle, MessageSquare } from 'lucide-react';
import { getTrustedTime } from './services/timeService';

const CANARY_KEY = 'dentsched_auth_canary';
const SALT_KEY = 'dentsched_security_salt';
const VERIFICATION_TOKEN = 'DENTSCHED_VERIFIED_ACCESS';
const GHOST_LOG_KEY = '_ds_ext_sys_0x1'; 
const PBKDF2_ITERATIONS = 600000; 
const EMERGENCY_STALE_THRESHOLD = 60 * 60 * 1000; 

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
        const expectedHash = CryptoJS.SHA256(payload).toString();
        if (current.hash !== expectedHash || current.previousHash !== prev.hash) {
            return false;
        }
    }
    return true;
};

function App() {
  const toast = useToast();
  
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState<string | null>('dentsched_architect_bypass');
  const [showTamperAlert, setShowTamperAlert] = useState(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

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

  // PWA Event Listener
  useEffect(() => {
    const handler = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
          logAction('UPDATE', 'System', 'Install', 'User installed application to home screen.');
          setDeferredPrompt(null);
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
  }, [isAuthenticated, patients, triggerSms, scheduledSms]);

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
      setScheduledSms(load('dentsched_scheduled_sms', []));
      
      const loadedLogs = load('dentsched_auditlog', []);
      
      try {
        const shadowLogs = JSON.parse(localStorage.getItem(GHOST_LOG_KEY) || '[]');
        if (loadedLogs.length === 0 && shadowLogs.length > 0) {
            setShowTamperAlert(true);
            toast.error("NPC SECURITY BREACH: Primary audit log wiped while forensic shadow exists.");
        }
      } catch (e) { console.error("Integrity check failed"); }

      setAuditLog(loadedLogs.length > 0 ? loadedLogs : MOCK_AUDIT_LOG);
      setIsAuditLogVerified(verifyAuditTrail(loadedLogs));

      setTask(load('dentsched_pinboard_tasks', []));
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
    if (isAuthenticated && encryptionKey) {
        loadSecureData(encryptionKey);
    }
  }, []);

  const saveToLocal = useCallback((key: string, data: any) => {
    if (!isAuthenticated || !encryptionKey) return;
    localStorage.setItem(key, CryptoJS.AES.encrypt(JSON.stringify(data), encryptionKey).toString());
  }, [isAuthenticated, encryptionKey]);

  useEffect(() => { saveToLocal('dentsched_appointments', appointments); }, [appointments, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_patients', patients); }, [patients, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_staff', staff); }, [staff, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_stock', stock); }, [stock, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_sterilization', sterilizationCycles); }, [sterilizationCycles, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_auditlog', auditLog); }, [auditLog, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_pinboard_tasks', tasks); }, [tasks, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_fields', fieldSettings); }, [fieldSettings, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_hmo_claims', hmoClaims); }, [hmoClaims, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_philhealth_claims', philHealthClaims); }, [philHealthClaims, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_incidents', incidents); }, [incidents, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_referrals', referrals); }, [referrals, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_reconciliations', reconciliations); }, [reconciliations, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_cash_sessions', cashSessions); }, [cashSessions, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_transfers', transfers); }, [transfers, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_payroll_periods', payrollPeriods); }, [payrollPeriods, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_payroll_adjustments', payrollAdjustments); }, [payrollAdjustments, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_commission_disputes', commissionDisputes); }, [commissionDisputes, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_offline_queue', offlineQueue); }, [offlineQueue, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_sync_conflicts', syncConflicts); }, [syncConflicts, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_system_status', systemStatus); }, [systemStatus, saveToLocal]);
  useEffect(() => { saveToLocal('dentsched_scheduled_sms', scheduledSms); }, [scheduledSms, saveToLocal]);

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
      case 'dashboard': return <Dashboard appointments={appointments.filter(a => a.branch === currentBranch)} patientsCount={patients.length} staffCount={staff.length} staff={staff} currentUser={effectiveUser} patients={patients} onAddPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} onPatientSelect={setSelectedPatientId} onBookAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }} onUpdateAppointmentStatus={handleUpdateAppointmentStatus} onCompleteRegistration={(id) => { const p = patients.find(pt => pt.id === id); if (p) { setEditingPatient(p); setIsPatientModalOpen(true); }}} onUpdatePatientRecall={handleUpdatePatientRecall} fieldSettings={fieldSettings} onUpdateSettings={setFieldSettings} onViewAllSchedule={() => setActiveTab('schedule')} tasks={tasks} onChangeBranch={setCurrentBranch} currentBranch={currentBranch} onSaveConsent={(aid, url) => setAppointments(prev => prev.map(a => a.id === aid ? { ...a, signedConsentUrl: url } : a))} auditLogVerified={isAuditLogVerified} sterilizationCycles={sterilizationCycles} stock={stock} auditLog={auditLog} logAction={logAction} syncConflicts={syncConflicts} setSyncConflicts={setSyncConflicts} systemStatus={systemStatus} onSwitchSystemStatus={setSystemStatus} onVerifyDowntimeEntry={(id) => setAppointments(prev => prev.map(a => a.id === id ? {...a, entryMode: 'AUTO', reconciled: true} : a))} onVerifyMedHistory={() => {}} onConfirmFollowUp={() => {}} />;
      case 'schedule': return <CalendarView appointments={appointments.filter(a => a.branch === currentBranch)} staff={staff} onAddAppointment={(d, t, pid, apt) => { setBookingDate(d); setBookingTime(t); setInitialBookingPatientId(pid); setEditingAppointment(apt || null); setIsAppointmentModalOpen(true); }} onMoveAppointment={(id, d, t, pr) => setAppointments(prev => prev.map(a => a.id === id ? { ...a, date: d, time: t, providerId: pr } : a))} currentUser={effectiveUser} patients={patients} currentBranch={currentBranch} fieldSettings={fieldSettings} />;
      case 'patients': return <PatientList patients={patients} appointments={appointments} currentUser={effectiveUser} selectedPatientId={selectedPatientId} onSelectPatient={setSelectedPatientId} onAddPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} onEditPatient={(p) => { setEditingPatient(p); setIsPatientModalOpen(true); }} onQuickUpdatePatient={handleQuickUpdatePatient} onDeletePatient={() => {}} onBookAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }} fieldSettings={fieldSettings} logAction={logAction} staff={staff} incidents={incidents} />;
      case 'inventory': return <Inventory stock={stock} onUpdateStock={setStock} currentUser={effectiveUser} sterilizationCycles={sterilizationCycles} onAddCycle={(c) => setSterilizationCycles(prev => [...prev, { id: `c_${Date.now()}`, ...c }])} currentBranch={currentBranch} availableBranches={fieldSettings.branches} transfers={transfers} fieldSettings={fieldSettings} onUpdateSettings={setFieldSettings} appointments={appointments} logAction={logAction} />;
      case 'financials': return <Financials claims={hmoClaims} expenses={MOCK_EXPENSES} philHealthClaims={philHealthClaims} currentUser={effectiveUser} appointments={appointments} patients={patients} fieldSettings={fieldSettings} staff={staff} reconciliations={reconciliations} onSaveReconciliation={() => {}} onSaveCashSession={() => {}} currentBranch={currentBranch} payrollPeriods={payrollPeriods} payrollAdjustments={payrollAdjustments} commissionDisputes={commissionDisputes} onUpdatePayrollPeriod={() => {}} onAddPayrollAdjustment={() => {}} onApproveAdjustment={() => {}} onAddCommissionDispute={() => {}} onResolveCommissionDispute={() => {}} onUpdatePhilHealthClaim={handleUpdatePhilHealthClaim} />;
      case 'field-mgmt': return <FieldManagement settings={fieldSettings} onUpdateSettings={setFieldSettings} staff={staff} auditLog={auditLog} patients={patients} onPurgePatient={() => {}} auditLogVerified={isAuditLogVerified} encryptionKey={encryptionKey} incidents={incidents} onSaveIncident={() => {}} appointments={appointments} />;
      default: return null;
    }
  };

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
        installable={!!deferredPrompt}
        onInstall={handleInstallApp}
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
                onConfirm={() => {
                    finalizeUpdateStatus(pendingPostOpAppointment.id, AppointmentStatus.COMPLETED);
                    setPendingPostOpAppointment(null);
                }} 
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

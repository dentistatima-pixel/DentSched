import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import PatientRegistryManager from './components/PatientRegistryManager';
import PatientDetailView from './components/PatientDetailView';
import PatientAppointmentsView from './components/PatientAppointmentsView';
import { AppointmentModal } from './components/AppointmentModal';
import PatientRegistrationModal from './components/PatientRegistrationModal';
import FieldManagement from './components/FieldManagement';
import KioskView from './components/KioskView';
import Inventory from './components/Inventory';
import Financials from './components/Financials';
import PostOpHandoverModal from './components/PostOpHandoverModal';
import SafetyTimeoutModal from './components/SafetyTimeoutModal';
import QuickTriageModal from './components/QuickTriageModal';
import { STAFF, PATIENTS, APPOINTMENTS, DEFAULT_FIELD_SETTINGS, MOCK_AUDIT_LOG, MOCK_STOCK, MOCK_CLAIMS, MOCK_EXPENSES, MOCK_STERILIZATION_CYCLES, CRITICAL_CLEARANCE_CONDITIONS } from './constants';
import { Appointment, User, Patient, FieldSettings, AppointmentType, UserRole, AppointmentStatus, PinboardTask, AuditLogEntry, StockItem, DentalChartEntry, SterilizationCycle, HMOClaim, PhilHealthClaim, PhilHealthClaimStatus, HMOClaimStatus, ClinicalIncident, Referral, ReconciliationRecord, StockTransfer, RecallStatus, TriageLevel, CashSession, PayrollPeriod, PayrollAdjustment, CommissionDispute, PayrollStatus, SyncIntent, SyncConflict, SystemStatus, LabStatus, ScheduledSms } from './types';
import { useToast } from './components/ToastSystem';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import CryptoJS from 'crypto-js';
import { Lock, FileText, CheckCircle, ShieldCheck, ShieldAlert, AlertTriangle, MessageSquare, X } from 'lucide-react';
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
  const [appointments, setAppointments] = useState<Appointment[]>(APPOINTMENTS);
  const [patients, setPatients] = useState<Patient[]>(PATIENTS);
  const [staff, setStaff] = useState<User[]>(STAFF);
  const [stock, setStock] = useState<StockItem[]>(MOCK_STOCK);
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
  const [isQuickTriageModalOpen, setIsQuickTriageModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<string | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState<string | undefined>(undefined);
  const [initialBookingPatientId, setInitialBookingPatientId] = useState<string | undefined>(undefined);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const [pendingPostOpAppointment, setPendingPostOpAppointment] = useState<Appointment | null>(null);
  const [pendingSafetyTimeout, setPendingSafetyTimeout] = useState<{ appointmentId: string, status: AppointmentStatus, patient: Patient } | null>(null);

  // New Drawer State
  const [isTimelineDrawerOpen, setIsTimelineDrawerOpen] = useState(false);

  const saveToLocal = useCallback((key: string, data: any) => {
    if (!isAuthenticated || !encryptionKey) return;
    localStorage.setItem(key, CryptoJS.AES.encrypt(JSON.stringify(data), encryptionKey).toString());
  }, [isAuthenticated, encryptionKey]);

  const logAction = useCallback(async (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string, previousState?: any, newState?: any) => {
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

          const newAuditLogState = [newLog, ...prev];
          saveToLocal('dentsched_auditlog', newAuditLogState);
          return newAuditLogState;
      });
  }, [currentUser, fieldSettings.features.enableAccountabilityLog, saveToLocal]);

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

  const loadSecureData = useCallback(async (key: string) => {
      const load = (k: string, def: any) => {
          const enc = localStorage.getItem(k);
          if (!enc) return def;
          try {
              const bytes = CryptoJS.AES.decrypt(enc, key);
              const decrypted = bytes.toString(CryptoJS.enc.Utf8);
              if (!decrypted) return def;
              return JSON.parse(decrypted);
          } catch { return def; } 
      };

      setAppointments(load('dentsched_appointments', APPOINTMENTS));
      setPatients(load('dentsched_patients', PATIENTS));
      setStaff(load('dentsched_staff', STAFF));
      setStock(load('dentsched_stock', MOCK_STOCK));
      setSterilizationCycles(load('dentsched_sterilization', MOCK_STERILIZATION_CYCLES));
      setScheduledSms(load('dentsched_scheduled_sms', []));
      
      const loadedLogs = load('dentsched_auditlog', MOCK_AUDIT_LOG);
      
      try {
        const shadowLogs = JSON.parse(localStorage.getItem(GHOST_LOG_KEY) || '[]');
        if (loadedLogs.length === 0 && shadowLogs.length > 0) {
            setShowTamperAlert(true);
            toast.error("NPC SECURITY BREACH: Primary audit log wiped while forensic shadow exists.");
        }
      } catch (e) { console.error("Integrity check failed"); }

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
      
      const savedSettings = load('dentsched_fields', null);
      if (savedSettings) {
          setFieldSettings({
              ...DEFAULT_FIELD_SETTINGS,
              ...savedSettings,
              features: { ...DEFAULT_FIELD_SETTINGS.features, ...(savedSettings.features || {}) }
          });
      }
  }, [toast]);

  useEffect(() => {
    if (isAuthenticated && encryptionKey) {
        loadSecureData(encryptionKey);
    }
  }, [isAuthenticated, encryptionKey, loadSecureData]);

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
  }, [fieldSettings, currentBranch, isOnline, systemStatus, toast, logAction]);

  useEffect(() => {
    if (isAuthenticated && scheduledSms.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const due = scheduledSms.filter(s => s.status === 'Pending' && s.dueDate <= today);
      
      if (due.length > 0) {
        toast.info(`Auto-Processing ${due.length} scheduled caring messages...`);
        const sentIds = due.map(d => d.id);
        due.forEach(msg => {
          const patient = patients.find(p => p.id === msg.patientId);
          if (patient) {
            triggerSms(msg.templateId, patient, msg.data);
          }
        });
        const newSmsState = scheduledSms.map(s => (sentIds.includes(s.id) ? { ...s, status: 'Sent' as const } : s));
        setScheduledSms(newSmsState);
        saveToLocal('dentsched_scheduled_sms', newSmsState);
      }
    }
  }, [isAuthenticated, patients, triggerSms, scheduledSms, saveToLocal, toast]);

  const handleSwitchSystemStatus = useCallback((status: SystemStatus) => {
    setSystemStatus(status);
    saveToLocal('dentsched_system_status', status);
  }, [saveToLocal]);

  useEffect(() => {
      const handleOnline = () => { 
        setIsOnline(true); 
        toast.success("Connection restored."); 
        if (systemStatus === SystemStatus.DOWNTIME) handleSwitchSystemStatus(SystemStatus.RECONCILIATION);
      };
      const handleOffline = () => { 
        setIsOnline(false); 
        toast.warning("Connection lost. Protocol Downtime suggested."); 
      };
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [systemStatus, toast, handleSwitchSystemStatus]);

  const processOfflineQueue = useCallback(() => {
      toast.info(`Processing ${offlineQueue.length} queued changes...`);
      setOfflineQueue([]);
      saveToLocal('dentsched_offline_queue', []);
      const newAppointments = appointments.map(a => ({...a, isPendingSync: false}));
      setAppointments(newAppointments);
      saveToLocal('dentsched_appointments', newAppointments);
      logAction('UPDATE', 'System', 'Sync', `Successfully reconciled ${offlineQueue.length} offline events.`);
  }, [appointments, offlineQueue, toast, saveToLocal, logAction]);

  useEffect(() => {
      if (isOnline && offlineQueue.length > 0) {
          processOfflineQueue();
      }
  }, [isOnline, offlineQueue, processOfflineQueue]);

  const effectiveUser = useMemo(() => ({
    ...currentUser,
    isReadOnly: false
  }), [currentUser]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const updatedAppointments = appointments.map(a => {
        if (a.status === AppointmentStatus.ARRIVED && a.queuedAt && a.triageLevel) {
          const queuedTime = new Date(a.queuedAt).getTime();
          if (now - queuedTime > EMERGENCY_STALE_THRESHOLD && !a.isStale) {
            logAction('SECURITY_ALERT', 'Appointment', a.id, `Emergency record ${a.id} exceeded 60m threshold without clinical seat.`);
            return { ...a, isStale: true };
          }
        }
        return a;
      });
      if (JSON.stringify(updatedAppointments) !== JSON.stringify(appointments)) {
        setAppointments(updatedAppointments);
        saveToLocal('dentsched_appointments', updatedAppointments);
      }
    }, 30000); 
    return () => clearInterval(timer);
  }, [appointments, logAction, saveToLocal]);

  const resetIdleTimer = useCallback(() => {
      if (isSessionLocked || !isAuthenticated) return;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setIsSessionLocked(true), IDLE_TIMEOUT_MS);
  }, [isSessionLocked, isAuthenticated]);

  useEffect(() => {
      const events = ['mousemove', 'keydown', 'click', 'scroll'];
      const handler = () => resetIdleTimer();
      events.forEach(e => window.addEventListener(e, handler));
      resetIdleTimer();
      return () => {
          events.forEach(e => window.removeEventListener(e, handler));
          if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      };
  }, [resetIdleTimer]);

  const handleUpdatePatientRecall = (patientId: string, status: RecallStatus) => {
      const newPatients = patients.map(p => p.id === patientId ? { ...p, recallStatus: status } : p);
      setPatients(newPatients);
      saveToLocal('dentsched_patients', newPatients);
      logAction('UPDATE', 'Patient', patientId, `Updated recall pipeline status to ${status}.`);
  };

  const handleSaveAppointment = (newAppointment: Appointment) => {
    const isManual = systemStatus === SystemStatus.DOWNTIME;
    const existing = appointments.find(a => a.id === newAppointment.id);
    
    const aptWithSync = { 
        ...newAppointment, 
        branch: newAppointment.branch || currentBranch, 
        isPendingSync: !isOnline,
        entryMode: isManual ? 'MANUAL' as const : 'AUTO' as const,
        reconciled: !isManual
    } as Appointment;
    
    const patient = patients.find(p => p.id === newAppointment.patientId);

    if (existing && patient) {
        if (existing.date !== newAppointment.date || existing.time !== newAppointment.time) {
            triggerSms('reschedule', patient, { date: newAppointment.date, time: newAppointment.time, procedure: newAppointment.type });
        }
    }

    if (!isOnline) {
        const newQueue = [...offlineQueue, { id: `intent_${Date.now()}`, action: 'CREATE_APPOINTMENT' as const, payload: aptWithSync, timestamp: new Date().toISOString() }];
        setOfflineQueue(newQueue);
        saveToLocal('dentsched_offline_queue', newQueue);
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
        let newAppointmentsState: Appointment[];
        if (existingIndex >= 0) {
            const updated = [...prev]; updated[existingIndex] = aptWithSync; 
            newAppointmentsState = updated;
        } else { 
            if (patient) {
                const updatedStats = {
                    ...(patient.attendanceStats || { totalBooked: 0, completedCount: 0, noShowCount: 0, lateCancelCount: 0 }),
                    totalBooked: (patient.attendanceStats?.totalBooked || 0) + 1
                };
                const newPatientsState = patients.map(p => p.id === patient.id ? { ...p, attendanceStats: updatedStats } : p);
                setPatients(newPatientsState);
                saveToLocal('dentsched_patients', newPatientsState);

                const doctor = staff.find(s => s.id === newAppointment.providerId)?.name || 'Dr. Alexander';
                triggerSms('booking', patient, { date: newAppointment.date, time: newAppointment.time, procedure: newAppointment.type, doctor, branch: newAppointment.branch });
            }
            newAppointmentsState = [...prev, aptWithSync];
        }
        saveToLocal('dentsched_appointments', newAppointmentsState);
        return newAppointmentsState;
    });
  };

  const finalizeUpdateStatus = async (id: string, status: AppointmentStatus): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const apt = appointments.find(a => a.id === id);
        if (!apt) return reject(new Error("Appointment not found"));
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
            
            const newPatientsState = patients.map(p => p.id === patient.id ? { ...p, attendanceStats: newStats, reliabilityScore: score } : p);
            setPatients(newPatientsState);
            saveToLocal('dentsched_patients', newPatientsState);
            
            if (status === AppointmentStatus.CANCELLED) {
                triggerSms('cancellation', patient, { date: apt.date });
            }
        }
        
        const newAppointments = appointments.map(a => a.id === id ? { ...a, status, isPendingSync: !isOnline } : a);
        setAppointments(newAppointments);
        saveToLocal('dentsched_appointments', newAppointments);

        logAction('UPDATE', 'Appointment', id, `Updated status to ${status}.`);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
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
          const newQueue = [...offlineQueue, { id: `intent_${Date.now()}`, action: 'UPDATE_STATUS' as const, payload: { id: appointmentId, status }, timestamp: new Date().toISOString() }];
          setOfflineQueue(newQueue);
          saveToLocal('dentsched_offline_queue', newQueue);
          toast.info("Status update queued for offline sync.");
      }

      finalizeUpdateStatus(appointmentId, status);
  };

  const handleSavePatient = (newPatientData: Partial<Patient>) => {
    const dataWithTimestamp = { ...newPatientData, lastDigitalUpdate: new Date().toISOString() };
    const existing = patients.find(p => p.id === newPatientData.id);

    if (!isOnline) {
        const newQueue = [...offlineQueue, { id: `intent_${Date.now()}`, action: 'REGISTER_PATIENT' as const, payload: dataWithTimestamp, timestamp: new Date().toISOString() }];
        setOfflineQueue(newQueue);
        saveToLocal('dentsched_offline_queue', newQueue);
        toast.info("Patient update queued for offline sync.");
    }

    if (existing) {
        const updatedPatient = { ...existing, ...dataWithTimestamp } as Patient;
        logAction('UPDATE', 'Patient', existing.id, 'Updated patient registration details', existing, updatedPatient);
        const newPatientsState = patients.map(p => p.id === newPatientData.id ? updatedPatient : p);
        setPatients(newPatientsState);
        saveToLocal('dentsched_patients', newPatientsState);
        triggerSms('update_registration', updatedPatient);
        setEditingPatient(null);
    } else {
        const newPatient: Patient = { ...dataWithTimestamp as Patient, id: newPatientData.id || `p_new_${Date.now()}`, lastVisit: 'First Visit', nextVisit: null, notes: newPatientData.notes || '', recallStatus: 'Due' };
        logAction('CREATE', 'Patient', newPatient.id, 'Registered new patient');
        
        if (newPatient.referredById) {
            const referrer = patients.find(p => p.id === newPatient.referredById);
            if (referrer) triggerSms('referral_thanks', referrer);
        }
        
        const newPatientsState = [...patients, newPatient];
        setPatients(newPatientsState);
        saveToLocal('dentsched_patients', newPatientsState);
        triggerSms('welcome', newPatient);
    }
  };

  const handleSaveQuickQueue = (name: string, phone: string, complaint: string, isEmergency: boolean) => {
      const tempPatientId = `q_pat_${Date.now()}`;
      const [firstName, ...surnameParts] = name.split(' ');
      const surname = surnameParts.join(' ');

      const tempPatient: Patient = {
          id: tempPatientId,
          name: name,
          firstName: firstName,
          surname: surname || 'Triage',
          phone: phone,
          email: '',
          dob: '',
          lastVisit: 'First Visit',
          nextVisit: null,
          recallStatus: 'Due',
      };
      
      const now = new Date();
      const triageLevel = isEmergency ? 'Level 2: Acute Pain/Swelling' : 'Level 3: Appliance/Maintenance';

      const tempAppointment: Appointment = {
          id: `q_apt_${Date.now()}`,
          patientId: tempPatientId,
          providerId: '',
          branch: currentBranch,
          date: now.toLocaleDateString('en-CA'),
          time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          durationMinutes: 30,
          type: complaint,
          status: AppointmentStatus.ARRIVED,
          triageLevel,
          queuedAt: now.toISOString(),
      };

      setPatients(prev => [...prev, tempPatient]);
      setAppointments(prev => [...prev, tempAppointment]);
      logAction('CREATE', 'Patient', tempPatientId, `Unregistered Intake: ${name}. Complaint: ${complaint}. Emergency: ${isEmergency}`);
      toast.success(`${name} added to Queue.`);
      setIsQuickTriageModalOpen(false);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setIsPatientModalOpen(true);
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
                  const newSms = [...scheduledSms, ...followUps];
                  setScheduledSms(newSms);
                  saveToLocal('dentsched_scheduled_sms', newSms);
                  toast.info("Patient Care follow-ups scheduled for T+7, T+30, and T+90 days.");
              }
          });
      }
      const newPatientsState = patients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
      setPatients(newPatientsState);
      saveToLocal('dentsched_patients', newPatientsState);
  };

  const handleUpdatePhilHealthClaim = (updated: PhilHealthClaim) => {
      const existing = philHealthClaims.find(c => c.id === updated.id);
      const newClaims = philHealthClaims.map(c => c.id === updated.id ? updated : c);
      setPhilHealthClaims(newClaims);
      saveToLocal('dentsched_philhealth_claims', newClaims);
      if (existing && existing.status !== updated.status) {
          const patient = patients.find(p => p.id === updated.patientId);
          if (patient) triggerSms('philhealth_status', patient, { procedure: updated.procedureName, provider: updated.status });
      }
  };

  const handleUpdateSettings = (newSettings: FieldSettings) => {
    setFieldSettings(newSettings);
    saveToLocal('dentsched_fields', newSettings);
  };
  
  const handleUpdateStock = (newStock: StockItem[]) => {
    setStock(newStock);
    saveToLocal('dentsched_stock', newStock);
  }

  const handleAddCycle = (cycle: any) => {
    const newCycles = [...sterilizationCycles, { id: `c_${Date.now()}`, ...cycle }];
    setSterilizationCycles(newCycles);
    saveToLocal('dentsched_sterilization', newCycles);
  };

  const handleToggleTask = (id: string) => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t);
    setTasks(newTasks);
    saveToLocal('dentsched_pinboard_tasks', newTasks);
  };

  const handleSetSyncConflicts = (conflicts: SyncConflict[]) => {
    setSyncConflicts(conflicts);
    saveToLocal('dentsched_sync_conflicts', conflicts);
  }

  const handleVerifyDowntimeEntry = (id: string) => {
      const newAppointments = appointments.map(a => a.id === id ? {...a, entryMode: 'AUTO' as const, reconciled: true} : a);
      setAppointments(newAppointments);
      saveToLocal('dentsched_appointments', newAppointments);
      logAction('VERIFY', 'Appointment', id, "Verified and reconciled manual downtime entry.");
  }

  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard appointments={appointments} allAppointments={appointments} patientsCount={patients.length} staffCount={staff.length} staff={staff} currentUser={effectiveUser} patients={patients} onAddPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} onPatientSelect={setSelectedPatientId} onBookAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }} onUpdateAppointmentStatus={handleUpdateAppointmentStatus} onCompleteRegistration={(id) => { const p = patients.find(pt => pt.id === id); if (p) { setEditingPatient(p); setIsPatientModalOpen(true); }}} onUpdatePatientRecall={handleUpdatePatientRecall} fieldSettings={fieldSettings} onUpdateSettings={handleUpdateSettings} onViewAllSchedule={() => setActiveTab('schedule')} tasks={tasks} onChangeBranch={setCurrentBranch} currentBranch={currentBranch} onSaveConsent={(aid, url) => { const newApts = appointments.map(a => a.id === aid ? { ...a, signedConsentUrl: url } : a); setAppointments(newApts); saveToLocal('dentsched_appointments', newApts); }} auditLogVerified={isAuditLogVerified} sterilizationCycles={sterilizationCycles} stock={stock} auditLog={auditLog} logAction={logAction} syncConflicts={syncConflicts} setSyncConflicts={handleSetSyncConflicts} systemStatus={systemStatus} onSwitchSystemStatus={handleSwitchSystemStatus} onVerifyDowntimeEntry={handleVerifyDowntimeEntry} onVerifyMedHistory={() => {}} onConfirmFollowUp={() => {}} onQuickQueue={() => setIsQuickTriageModalOpen(true)} />;
      case 'schedule': return <CalendarView appointments={appointments.filter(a => a.branch === currentBranch)} staff={staff} onAddAppointment={(d, t, pid, apt) => { setBookingDate(d); setBookingTime(t); setInitialBookingPatientId(pid); setEditingAppointment(apt || null); setIsAppointmentModalOpen(true); }} onMoveAppointment={(id, d, t, pr) => { const newApts = appointments.map(a => a.id === id ? { ...a, date: d, time: t, providerId: pr } : a); setAppointments(newApts); saveToLocal('dentsched_appointments', newApts); }} currentUser={effectiveUser} patients={patients} currentBranch={currentBranch} fieldSettings={fieldSettings} />;
      case 'patients': 
        return (
          <div className="h-full bg-slate-50 relative overflow-hidden flex flex-col">
            {selectedPatientId ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                    <PatientDetailView
                        patient={selectedPatient}
                        appointments={appointments}
                        staff={staff}
                        currentUser={effectiveUser}
                        onQuickUpdatePatient={handleQuickUpdatePatient}
                        onBookAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }}
                        onEditPatient={handleEditPatient}
                        fieldSettings={fieldSettings}
                        logAction={logAction}
                        incidents={incidents}
                        onToggleTimeline={() => setIsTimelineDrawerOpen(!isTimelineDrawerOpen)}
                        onBack={() => setSelectedPatientId(null)}
                    />
                    
                    {/* Sliding Timeline Drawer (Scoped to Selection) */}
                    <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-[100] transform transition-transform duration-500 ease-in-out border-l border-slate-200 flex flex-col ${isTimelineDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-teal-900 text-white shrink-0">
                            <div className="flex items-center gap-3">
                                <MessageSquare size={20} className="text-teal-400"/>
                                <h3 className="text-sm font-black uppercase tracking-widest">Clinical Timeline</h3>
                            </div>
                            <button onClick={() => setIsTimelineDrawerOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90"><X/></button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <PatientAppointmentsView
                                patient={selectedPatient}
                                appointments={appointments}
                                onBookAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }}
                                onSelectAppointment={(apt) => { setEditingAppointment(apt); setIsAppointmentModalOpen(true); }}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <PatientRegistryManager
                    patients={patients}
                    appointments={appointments}
                    onSelectPatient={setSelectedPatientId}
                    onAddPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }}
                    onBookAppointment={() => { setInitialBookingPatientId(undefined); setIsAppointmentModalOpen(true); }}
                    fieldSettings={fieldSettings}
                />
            )}
          </div>
        );
      case 'inventory': return <Inventory stock={stock} onUpdateStock={handleUpdateStock} currentUser={effectiveUser} sterilizationCycles={sterilizationCycles} onAddCycle={handleAddCycle} currentBranch={currentBranch} availableBranches={fieldSettings.branches} transfers={transfers} fieldSettings={fieldSettings} onUpdateSettings={handleUpdateSettings} appointments={appointments} logAction={logAction} />;
      case 'financials': return <Financials claims={hmoClaims} expenses={MOCK_EXPENSES} philHealthClaims={philHealthClaims} currentUser={effectiveUser} appointments={appointments} patients={patients} fieldSettings={fieldSettings} staff={staff} reconciliations={reconciliations} onSaveReconciliation={() => {}} onSaveCashSession={() => {}} currentBranch={currentBranch} payrollPeriods={payrollPeriods} payrollAdjustments={payrollAdjustments} commissionDisputes={commissionDisputes} onUpdatePayrollPeriod={() => {}} onAddPayrollAdjustment={() => {}} onApproveAdjustment={() => {}} onAddCommissionDispute={() => {}} onResolveCommissionDispute={() => {}} onUpdatePhilHealthClaim={handleUpdatePhilHealthClaim} />;
      case 'field-mgmt': return <FieldManagement settings={fieldSettings} onUpdateSettings={handleUpdateSettings} staff={staff} auditLog={auditLog} patients={patients} onPurgePatient={() => {}} auditLogVerified={isAuditLogVerified} encryptionKey={encryptionKey} incidents={incidents} onSaveIncident={() => {}} appointments={appointments} />;
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
        onToggleTask={handleToggleTask} 
        onEnterKioskMode={() => setIsInKioskMode(true)}
        isOnline={isOnline}
        pendingSyncCount={offlineQueue.length}
        systemStatus={systemStatus}
        onSwitchSystemStatus={handleSwitchSystemStatus}
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

        {isQuickTriageModalOpen && (
            <QuickTriageModal
                isOpen={isQuickTriageModalOpen}
                onClose={() => setIsQuickTriageModalOpen(false)}
                onSave={handleSaveQuickQueue}
            />
        )}

        {pendingPostOpAppointment && (
            <PostOpHandoverModal 
                isOpen={!!pendingPostOpAppointment} 
                appointment={pendingPostOpAppointment} 
                onConfirm={async () => {
                    if (pendingPostOpAppointment) {
                        await finalizeUpdateStatus(pendingPostOpAppointment.id, AppointmentStatus.COMPLETED);
                    }
                }}
                onClose={() => setPendingPostOpAppointment(null)} 
            />
        )}

        {pendingSafetyTimeout && (
            <SafetyTimeoutModal 
                patient={pendingSafetyTimeout.patient} 
                onConfirm={() => {
                  finalizeUpdateStatus(pendingSafetyTimeout.appointmentId, pendingSafetyTimeout.status);
                  setPendingSafetyTimeout(null);
                }} 
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

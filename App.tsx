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
import AdminHub from './components/AdminHub';
import PostOpHandoverModal from './components/PostOpHandoverModal';
import SafetyTimeoutModal from './components/SafetyTimeoutModal';
import QuickTriageModal from './components/QuickTriageModal';
import QuickAddPatientModal from './components/QuickAddPatientModal'; // Import new modal
import MedicoLegalExportModal from './components/MedicoLegalExportModal'; // Import MedicoLegalExportModal
import RecallCenter from './components/RecallCenter';
import ReferralManager from './components/ReferralManager'; // Import new component
import RosterView from './components/RosterView'; // Import RosterView
import SafetyAlertModal from './components/SafetyAlertModal'; // Import new safety alert modal
import { STAFF, PATIENTS, APPOINTMENTS, DEFAULT_FIELD_SETTINGS, MOCK_AUDIT_LOG, MOCK_STOCK, MOCK_CLAIMS, MOCK_EXPENSES, MOCK_STERILIZATION_CYCLES, CRITICAL_CLEARANCE_CONDITIONS, formatDate, MOCK_WAITLIST, generateUid } from './constants';
import { Appointment, User, Patient, FieldSettings, AppointmentType, UserRole, AppointmentStatus, PinboardTask, AuditLogEntry, StockItem, DentalChartEntry, SterilizationCycle, HMOClaim, PhilHealthClaim, PhilHealthClaimStatus, HMOClaimStatus, ClinicalIncident, Referral, ReconciliationRecord, StockTransfer, RecallStatus, TriageLevel, CashSession, PayrollPeriod, PayrollAdjustment, CommissionDispute, PayrollStatus, SyncIntent, SyncConflict, SystemStatus, LabStatus, ScheduledSms, AppNotification, WaitlistEntry, GovernanceTrack, ConsentCategory } from './types';
import { useToast } from './components/ToastSystem';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import CryptoJS from 'crypto-js';
import { Lock, FileText, CheckCircle, ShieldCheck, ShieldAlert, AlertTriangle, MessageSquare, X, CloudOff, FileWarning, MessageCircle as MessageIcon } from 'lucide-react';
import { getTrustedTime } from './services/timeService';
import PrivacyRevocationModal from './components/PrivacyRevocationModal';

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
  const [governanceTrack, setGovernanceTrack] = useState<GovernanceTrack>('OPERATIONAL');

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
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [isInKioskMode, setIsInKioskMode] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<string>('Makati Main');

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isReconciliationMode, setIsReconciliationMode] = useState(false);
  const [isQuickTriageModalOpen, setIsQuickTriageModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<string | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState<string | undefined>(undefined);
  const [initialBookingPatientId, setInitialBookingPatientId] = useState<string | undefined>(undefined);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isQuickAddPatientModalOpen, setIsQuickAddPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const [pendingPostOpAppointment, setPendingPostOpAppointment] = useState<Appointment | null>(null);
  const [pendingSafetyTimeout, setPendingSafetyTimeout] = useState<{ appointmentId: string, status: AppointmentStatus, patient: Patient } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [safetyAlert, setSafetyAlert] = useState<{ title: string; message: string } | null>(null);

  const [isMedicoLegalExportOpen, setIsMedicoLegalExportOpen] = useState(false);
  const [medicoLegalExportPatient, setMedicoLegalExportPatient] = useState<Patient | null>(null);

  // New Drawer State
  const [isTimelineDrawerOpen, setIsTimelineDrawerOpen] = useState(false);
  
  // Gap 5 state
  const [revocationTarget, setRevocationTarget] = useState<{ patient: Patient, category: ConsentCategory } | null>(null);


  // Gap 9: Real-time LATE status check
  useEffect(() => {
    const timer = setInterval(() => {
        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA');
        
        const updatedAppointments = appointments.map(apt => {
            if (apt.date === todayStr && apt.status === AppointmentStatus.SCHEDULED) {
                const [hour, minute] = apt.time.split(':').map(Number);
                const aptTime = new Date();
                aptTime.setHours(hour, minute, 0, 0);

                // Mark as late if 10 mins past schedule
                if (now.getTime() > aptTime.getTime() + 10 * 60 * 1000) {
                    return { ...apt, isLate: true };
                }
            }
            // Reset if status changes
            if (apt.isLate && apt.status !== AppointmentStatus.SCHEDULED) {
                return { ...apt, isLate: false };
            }
            return apt;
        });
        
        if (JSON.stringify(updatedAppointments) !== JSON.stringify(appointments)) {
            setAppointments(updatedAppointments);
        }
    }, 60000); // Check every minute

    return () => clearInterval(timer);
  }, [appointments]);

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
              previousHash: prevHash,
              impersonatingUser: originalUser ? { id: originalUser.id, name: originalUser.name } : undefined
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
  }, [currentUser, originalUser, fieldSettings.features.enableAccountabilityLog, saveToLocal]);

  const notifications = useMemo((): AppNotification[] => {
    const items: AppNotification[] = [];
    const now = new Date();

    // 1. Sync Conflicts
    if (syncConflicts.length > 0) {
        items.push({ id: 'sync', type: 'critical', icon: CloudOff, title: `${syncConflicts.length} Sync Conflicts`, description: 'Offline data conflicts require manual resolution.', timestamp: now.toISOString(), actionType: 'navigate', payload: { tab: 'admin' } });
    }
    // 2. Downtime Entries
    const downtimeEntries = appointments.filter(a => a.entryMode === 'MANUAL' && !a.reconciled);
    if (downtimeEntries.length > 0) {
        items.push({ id: 'downtime', type: 'critical', icon: FileWarning, title: `${downtimeEntries.length} Downtime Entries`, description: 'Manual entries need verification and reconciliation.', timestamp: now.toISOString(), actionType: 'navigate', payload: { tab: 'dashboard' } });
    }
    // 3. License Expiry
    staff.forEach(s => {
        if (s.prcExpiry && new Date(s.prcExpiry) > now) {
            const daysLeft = (new Date(s.prcExpiry).getTime() - now.getTime()) / (1000 * 3600 * 24);
            if (daysLeft < 30) {
                items.push({ id: `prc_${s.id}`, type: 'critical', icon: ShieldAlert, title: 'License Expiring', description: `${s.name}'s PRC license expires in ${Math.ceil(daysLeft)} days.`, timestamp: now.toISOString(), actionType: 'modal', payload: { modal: 'userProfile', entityId: s.id } });
            }
        }
    });

    // 4. Med History Verification
    const medHistoryNeeded = appointments.filter(a => a.status === AppointmentStatus.ARRIVED && !a.medHistoryVerified);
    if (medHistoryNeeded.length > 0) {
        items.push({ id: 'med_history', type: 'action', icon: ShieldAlert, title: 'Medical History', description: `${medHistoryNeeded.length} arrived patients need medical history verification.`, timestamp: now.toISOString(), actionType: 'navigate', payload: { tab: 'dashboard' } });
    }
    // 5. Post-Op Follow-up
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600000).toISOString();
    const postOpPatients = appointments.filter(a => ['Surgery', 'Extraction'].includes(a.type) && a.status === AppointmentStatus.COMPLETED && a.date >= twentyFourHoursAgo.split('T')[0] && !a.followUpConfirmed);
    if(postOpPatients.length > 0) {
        items.push({ id: 'post_op', type: 'action', icon: MessageIcon, title: 'Post-Op Follow-Up', description: `${postOpPatients.length} surgical patients require follow-up calls.`, timestamp: now.toISOString(), actionType: 'navigate', payload: { tab: 'dashboard' } });
    }

    return items;
  }, [appointments, staff, syncConflicts]);

  const handleNotificationClick = (notification: AppNotification) => {
      if (notification.actionType === 'navigate' && notification.payload.tab) {
          setActiveTab(notification.payload.tab);
      }
      if (notification.actionType === 'modal' && notification.payload.modal === 'userProfile') {
          const userToView = staff.find(s => s.id === notification.payload.entityId);
          if (userToView) {
              // This is a simplified way. A better way would be to pass the user to the modal.
              // For now, we assume the modal uses the `currentUser`.
              // A proper implementation might need a dedicated `viewingUser` state.
              setIsProfileOpen(true);
          }
      }
  };


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
    logAction('UPDATE', 'System', 'Status', `System status changed to ${status}.`);
  }, [saveToLocal, logAction]);

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
  
  const handleStartImpersonating = (userToImpersonate: User) => {
    if (currentUser.role !== UserRole.SYSTEM_ARCHITECT) {
      toast.error("Privilege Elevation is restricted to System Architect role.");
      return;
    }
    if (originalUser) {
      toast.warning("Already impersonating. Stop current session first.");
      return;
    }
    logAction('SECURITY_ALERT', 'System', userToImpersonate.id, `System Architect started impersonating ${userToImpersonate.name}.`);
    setOriginalUser(currentUser);
    setCurrentUser(userToImpersonate);
    toast.success(`Now impersonating ${userToImpersonate.name}.`);
    setActiveTab('dashboard'); // Go to dashboard to see effects
  };

  const handleStopImpersonating = () => {
    if (!originalUser) return;
    logAction('SECURITY_ALERT', 'System', originalUser.id, `System Architect stopped impersonating ${currentUser.name}.`);
    setCurrentUser(originalUser);
    setOriginalUser(null);
    toast.info("Privilege elevation session ended.");
    setActiveTab('field-mgmt'); // Go back to settings
  };

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

  const handlePurgePatient = (patientId: string) => {
    const patientToPurge = patients.find(p => p.id === patientId);
    if (!patientToPurge) {
        toast.error("Patient not found for purging.");
        return;
    }

    const anonymizedPatient: Patient = {
        ...patientToPurge,
        name: `ANONYMIZED_${patientId}`,
        firstName: 'Anonymized',
        surname: 'Patient',
        middleName: undefined,
        suffix: undefined,
        phone: '00000000000',
        email: 'anon@dentsched.ph',
        homeAddress: undefined,
        city: undefined,
        barangay: undefined,
        occupation: undefined,
        guardianProfile: undefined,
        isAnonymized: true,
        dob: '1900-01-01',
        age: undefined,
        sex: undefined,
        civilStatus: undefined,
        insuranceProvider: undefined,
        insuranceNumber: undefined,
        physicianName: undefined,
        physicianAddress: undefined,
        physicianNumber: undefined,
        physicianSpecialty: undefined,
        philHealthPIN: undefined
    };
    
    const newPatients = patients.map(p => p.id === patientId ? anonymizedPatient : p);
    setPatients(newPatients);
    saveToLocal('dentsched_patients', newPatients);
    logAction('DELETE', 'Patient', patientId, 'Anonymized patient record as per data retention policy.');
    toast.success(`Patient record ${patientId} has been anonymized.`);
  };

  const handleGenerateReport = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('en-CA');
    const todaysAppointments = appointments.filter(a => a.date === today && a.branch === currentBranch);

    doc.setFontSize(18);
    doc.text(`Daily Report for ${currentBranch} - ${today}`, 14, 22);
    
    (doc as any).autoTable({
        startY: 30,
        head: [['Time', 'Patient', 'Procedure', 'Provider', 'Status']],
        body: todaysAppointments.map(apt => {
            const patient = patients.find(p => p.id === apt.patientId);
            const provider = staff.find(s => s.id === apt.providerId);
            return [
                apt.time,
                patient?.name || 'N/A',
                apt.type,
                provider?.name || 'N/A',
                apt.status
            ];
        }),
    });

    doc.save(`dentsched_report_${today}.pdf`);
    toast.success("Daily report generated.");
    logAction('EXPORT_RECORD', 'System', 'DailyReport', 'Generated daily summary report.');
  };

  const handleMoveAppointment = (appointmentId: string, newDate: string, newTime: string, newProviderId: string, newResourceId?: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;

    const movedAppointment = { ...apt, date: newDate, time: newTime, providerId: newProviderId, resourceId: newResourceId || apt.resourceId, isPendingSync: !isOnline, modifiedAt: new Date().toISOString() };

    if (!isOnline) {
        const intent: SyncIntent = {
            id: `intent_${Date.now()}`,
            action: 'UPDATE_APPOINTMENT',
            payload: movedAppointment,
            timestamp: new Date().toISOString()
        };
        const newQueue = [...offlineQueue, intent];
        setOfflineQueue(newQueue);
        saveToLocal('dentsched_offline_queue', newQueue);
        toast.info("Appointment move queued for offline sync.");
    }
    
    const newAppointments = appointments.map(a => a.id === appointmentId ? movedAppointment : a);
    setAppointments(newAppointments);
    saveToLocal('dentsched_appointments', newAppointments);
    const providerName = staff.find(s => s.id === newProviderId)?.name || newProviderId;
    logAction('UPDATE', 'Appointment', appointmentId, `Rescheduled to ${newDate} at ${newTime} with ${providerName}.`);
  };

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
        entryMode: newAppointment.entryMode || (isManual ? 'MANUAL' as const : 'AUTO' as const),
        reconciled: newAppointment.reconciled || !isManual,
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
            logAction('UPDATE', 'Appointment', aptWithSync.id, `Updated appointment.`, prev[existingIndex], aptWithSync);
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
            logAction('CREATE', 'Appointment', aptWithSync.id, `Created new appointment.`);
        }
        saveToLocal('dentsched_appointments', newAppointmentsState);
        return newAppointmentsState;
    });
    setIsReconciliationMode(false);
  };

  const finalizeUpdateStatus = async (id: string, status: AppointmentStatus): Promise<void> => {
      const apt = appointments.find(a => a.id === id);
      if (!apt) throw new Error("Appointment not found");
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
      
      if (status === AppointmentStatus.COMPLETED) {
          const procedure = fieldSettings.procedures.find(p => p.name === apt.type);
          if (procedure?.billOfMaterials) {
              let stockUpdated = false;
              const newStock = [...stock];
              procedure.billOfMaterials.forEach(bomItem => {
                  const stockIndex = newStock.findIndex(s => s.id === bomItem.stockItemId);
                  if (stockIndex > -1) {
                      newStock[stockIndex].quantity -= bomItem.quantity;
                      stockUpdated = true;
                      logAction('UPDATE', 'StockItem', bomItem.stockItemId, `Auto-depleted ${bomItem.quantity} units for procedure: ${apt.type}.`);
                  }
              });
              if (stockUpdated) {
                  setStock(newStock);
                  saveToLocal('dentsched_stock', newStock);
                  toast.info("Inventory automatically updated.");
              }
          }
      }
      
      const newAppointments = appointments.map(a => a.id === id ? { ...a, status, isPendingSync: !isOnline } : a);
      setAppointments(newAppointments);
      saveToLocal('dentsched_appointments', newAppointments);

      logAction('UPDATE', 'Appointment', id, `Updated status to ${status}.`);
  };

  const handleUpdateAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => {
      const apt = appointments.find(a => a.id === appointmentId);
      if (!apt) return;

      const patient = patients.find(p => p.id === apt.patientId);

      // Gap 4.2: Safety Timeout
      if (status === AppointmentStatus.TREATING && patient) {
          const hasRisk = (patient.medicalConditions?.some(c => c !== 'None' && c.trim() !== '')) || (patient.allergies?.some(a => a !== 'None' && a.trim() !== ''));
          if (hasRisk) {
              setPendingSafetyTimeout({ appointmentId, status, patient });
              return;
          }
      }

      // Gap 4.1: Medical Clearance Gate
      if ([AppointmentStatus.SEATED, AppointmentStatus.TREATING].includes(status)) {
          const procedureIsSurgical = apt.type.toLowerCase().includes('surg') || apt.type.toLowerCase().includes('extract');
          if (procedureIsSurgical && patient) {
              const hasCriticalCondition = patient.medicalConditions?.some(c => CRITICAL_CLEARANCE_CONDITIONS.includes(c));
              if (hasCriticalCondition) {
                  const threeMonthsAgo = new Date();
                  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                  const hasValidClearance = patient.clearanceRequests?.some(r => r.status === 'Approved' && r.approvedAt && new Date(r.approvedAt) > threeMonthsAgo);
                  if (!hasValidClearance) {
                      setSafetyAlert({
                          title: "REFERRAL HARD-STOP (PDA Rule 4)",
                          message: "Medical clearance is REQUIRED for a high-risk patient before any surgical procedure. No valid clearance found on file within the last 3 months."
                      });
                      logAction('SECURITY_ALERT', 'Appointment', appointmentId, `Hard-Stop Triggered: Attempted surgical seating on high-risk patient without verified medical clearance.`);
                      return;
                  }
              }
          }
      }

      // Gap 5: Post-Op Handover
      if (status === AppointmentStatus.COMPLETED) {
          const procedureIsSurgical = apt.type.toLowerCase().includes('surg') || apt.type.toLowerCase().includes('extract');
          if (procedureIsSurgical && !apt.postOpVerified) {
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
    let patientToSave = { ...newPatientData, lastDigitalUpdate: new Date().toISOString() };
    
    // Fix: Ensure a new patient gets a unique ID.
    const isNew = !patientToSave.id;
    if (isNew) {
      patientToSave.id = generateUid('p_reg');
    }
  
    const existing = isNew ? null : patients.find(p => p.id === patientToSave.id);
    
    patientToSave.name = `${patientToSave.firstName || ''} ${patientToSave.middleName || ''} ${patientToSave.surname || ''}`.replace(/\s+/g, ' ').trim();
  
    // Fix: Correctly queue update vs. register actions when offline.
    if (!isOnline) {
      const action = isNew ? 'REGISTER_PATIENT' : 'UPDATE_PATIENT';
      const newQueue = [...offlineQueue, { id: `intent_${Date.now()}`, action: action as any, payload: patientToSave, timestamp: new Date().toISOString() }];
      setOfflineQueue(newQueue);
      saveToLocal('dentsched_offline_queue', newQueue);
      toast.info("Patient update queued for offline sync.");
    }
  
    if (existing) {
      const updatedPatient = { ...existing, ...patientToSave } as Patient;
      logAction('UPDATE', 'Patient', existing.id, 'Updated patient registration details', existing, updatedPatient);
      const newPatientsState = patients.map(p => p.id === patientToSave.id ? updatedPatient : p);
      setPatients(newPatientsState);
      saveToLocal('dentsched_patients', newPatientsState);
      triggerSms('update_registration', updatedPatient);
      setEditingPatient(null);
    } else {
      const newPatient: Patient = { ...patientToSave as Patient, lastVisit: 'First Visit', nextVisit: null, notes: patientToSave.notes || '', recallStatus: 'Due' };
      logAction('CREATE', 'Patient', newPatient.id, 'Registered new patient');
      
      if (newPatient.referredById) {
        const referrer = patients.find(p => p.id === newPatient.referredById);
        if (referrer) triggerSms('referral_thanks', referrer);
      }
      
      const newPatientsState = [...patients, newPatient];
      setPatients(newPatientsState);
      saveToLocal('dentsched_patients', newPatientsState);
      triggerSms('welcome', newPatient);
  
      toast.success(`Patient ${newPatient.name} registered. Opening their chart.`);
      setSelectedPatientId(newPatient.id);
      setActiveTab('patients');
    }
  };

  const handleSaveQuickAddPatient = (firstName: string, surname: string, phone: string) => {
      const newPatient: Patient = {
          id: `p_prov_${Date.now()}`,
          name: `${firstName} ${surname}`,
          firstName,
          surname,
          phone,
          email: '',
          dob: '',
          lastVisit: 'First Visit',
          nextVisit: null,
          recallStatus: 'Due',
          dpaConsent: false, // This marks it as incomplete for the dashboard
      };
      logAction('CREATE', 'Patient', newPatient.id, `Created provisional patient record: ${newPatient.name}`);
      const newPatientsState = [...patients, newPatient];
      setPatients(newPatientsState);
      saveToLocal('dentsched_patients', newPatientsState);
      toast.success(`Provisional record for ${newPatient.name} created.`);
  };

  const handleSaveQuickQueue = (name: string, phone: string, complaint: string, isEmergency: boolean) => {
      const existingPatient = patients.find(p => p.name.toLowerCase() === name.toLowerCase() || (phone && p.phone === phone));
      const patientId = existingPatient ? existingPatient.id : `q_pat_${Date.now()}`;
      
      if (!existingPatient) {
          const [firstName, ...surnameParts] = name.split(' ');
          const surname = surnameParts.join(' ');
          const tempPatient: Patient = {
              id: patientId,
              name: name,
              firstName: firstName,
              surname: surname || 'Triage',
              phone: phone,
              email: '',
              dob: '',
              lastVisit: 'First Visit',
              nextVisit: null,
              recallStatus: 'Due',
              dpaConsent: false,
          };
          setPatients(prev => [...prev, tempPatient]);
      }
      
      const now = new Date();
      const triageLevel = isEmergency ? 'Level 2: Acute Pain/Swelling' : 'Level 3: Appliance/Maintenance';

      const tempAppointment: Appointment = {
          id: `q_apt_${Date.now()}`,
          patientId: patientId,
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

      setAppointments(prev => [...prev, tempAppointment]);
      logAction('CREATE', 'Patient', patientId, `Unregistered Intake: ${name}. Complaint: ${complaint}. Emergency: ${isEmergency}`);
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

  const handleUpdateSettings = useCallback((newSettings: FieldSettings) => {
    setFieldSettings(newSettings);
    saveToLocal('dentsched_fields', newSettings);
  }, [saveToLocal]);
  
  const handleUpdateStock = useCallback((newStock: StockItem[]) => {
    setStock(newStock);
    saveToLocal('dentsched_stock', newStock);
  }, [saveToLocal]);

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

  const handleOpenReconciliationModal = (id: string) => {
      const apt = appointments.find(a => a.id === id);
      if (apt) {
          setEditingAppointment(apt);
          setIsReconciliationMode(true);
          setIsAppointmentModalOpen(true);
      }
  };
  
  const handleNavigateToPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('patients');
  };

  const handleOpenMedicoLegalExport = (patientToExport: Patient) => {
    setMedicoLegalExportPatient(patientToExport);
    setIsMedicoLegalExportOpen(true);
  };

  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);

  const handleSaveIncident = (incident: ClinicalIncident) => {
    const newIncidents = [...incidents, incident];
    setIncidents(newIncidents);
    saveToLocal('dentsched_incidents', newIncidents);
    logAction('CREATE', 'ClinicalIncident', incident.id, `Logged new clinical incident.`);
    toast.success('Clinical incident has been logged.');
  };

  const handleSaveReferral = (referral: Referral) => {
    const newReferrals = [...referrals, referral];
    setReferrals(newReferrals);
    saveToLocal('dentsched_referrals', newReferrals);
    logAction('CREATE', 'Referral', referral.id, `Created new referral to ${referral.referredTo}.`);
    toast.success('Referral has been logged.');
  };
  
    const handleSaveCashSession = (session: CashSession) => {
        const isNew = !cashSessions.some(s => s.id === session.id);
        const newSessions = isNew ? [...cashSessions, session] : cashSessions.map(s => s.id === session.id ? session : s);
        setCashSessions(newSessions);
        saveToLocal('dentsched_cash_sessions', newSessions);
        logAction(isNew ? 'CREATE' : 'UPDATE', 'CashSession', session.id, `Session ${session.status} by ${session.openedByName}`);
    };

    const handleSaveReconciliation = (record: ReconciliationRecord) => {
        setReconciliations(prev => [...prev, record]);
        saveToLocal('dentsched_reconciliations', [...reconciliations, record]);
        logAction('CREATE', 'Reconciliation', record.id, `EOD Reconciliation for ${record.branch} submitted.`);
    };
    
    const handlePerformTransfer = (transfer: StockTransfer) => {
        setTransfers(prev => [...prev, transfer]);
        saveToLocal('dentsched_transfers', [...transfers, transfer]);

        const newStock = [...stock];
        const fromIndex = newStock.findIndex(s => s.id === transfer.itemId && s.branch === transfer.fromBranch);
        const toIndex = newStock.findIndex(s => s.id === transfer.itemId && s.branch === transfer.toBranch);

        if (fromIndex > -1) newStock[fromIndex].quantity -= transfer.quantity;
        if (toIndex > -1) newStock[toIndex].quantity += transfer.quantity;
        
        setStock(newStock);
        saveToLocal('dentsched_stock', newStock);
        logAction('CREATE', 'StockTransfer', transfer.id, `Transferred ${transfer.quantity} of ${transfer.itemName} from ${transfer.fromBranch} to ${transfer.toBranch}.`);
    };

    const handleUpdatePayrollPeriod = (period: PayrollPeriod) => {
        const isNew = !payrollPeriods.some(p => p.id === period.id);
        const newPeriods = isNew ? [...payrollPeriods, period] : payrollPeriods.map(p => p.id === period.id ? period : p);
        setPayrollPeriods(newPeriods);
        saveToLocal('dentsched_payroll_periods', newPeriods);
    };

    const handleAddPayrollAdjustment = (adj: PayrollAdjustment) => {
        setPayrollAdjustments(prev => [...prev, adj]);
        saveToLocal('dentsched_payroll_adjustments', [...payrollAdjustments, adj]);
    };

    const handleApproveAdjustment = (id: string) => {
        const newAdjs = payrollAdjustments.map(a => a.id === id ? { ...a, status: 'Approved' as const, verifiedBy: currentUser.id } : a);
        setPayrollAdjustments(newAdjs);
        saveToLocal('dentsched_payroll_adjustments', newAdjs);
    };

    const handleAddCommissionDispute = (dispute: CommissionDispute) => {
        setCommissionDisputes(prev => [...prev, dispute]);
        saveToLocal('dentsched_commission_disputes', [...commissionDisputes, dispute]);
    };

    const handleResolveCommissionDispute = (id: string) => {
        const newDisputes = commissionDisputes.map(d => d.id === id ? { ...d, status: 'Resolved' as const } : d);
        setCommissionDisputes(newDisputes);
        saveToLocal('dentsched_commission_disputes', newDisputes);
    };


  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard 
          appointments={appointments}
          patientsCount={patients.length} 
          staffCount={staff.length} 
          staff={staff} 
          currentUser={effectiveUser} 
          patients={patients} 
          onAddPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} 
          onPatientSelect={handleNavigateToPatient} 
          onAddAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }} 
          onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
          fieldSettings={fieldSettings}
          onCompleteRegistration={(id) => handleEditPatient(patients.find(p => p.id === id)!)}
          tasks={tasks}
          onToggleTask={handleToggleTask}
          syncConflicts={syncConflicts}
          onVerifyDowntimeEntry={handleOpenReconciliationModal}
          onQuickQueue={() => setIsQuickTriageModalOpen(true)}
          onQuickAddPatient={() => setIsQuickAddPatientModalOpen(true)}
          currentBranch={currentBranch}
      />;
      case 'schedule': return <CalendarView 
          appointments={appointments} 
          staff={staff} 
          onAddAppointment={(date, time, patientId, aptToEdit) => {
              setBookingDate(date);
              setBookingTime(time);
              setInitialBookingPatientId(patientId);
              setEditingAppointment(aptToEdit || null);
              setIsAppointmentModalOpen(true);
          }}
          onMoveAppointment={handleMoveAppointment}
          onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
          onPatientSelect={handleNavigateToPatient}
          currentUser={currentUser}
          patients={patients}
          currentBranch={currentBranch}
          fieldSettings={fieldSettings}
      />;
      case 'patients': return selectedPatient ? 
          <PatientDetailView 
              patient={selectedPatient}
              appointments={appointments}
              staff={staff}
              currentUser={currentUser}
              onQuickUpdatePatient={handleQuickUpdatePatient}
              onBookAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }}
              onEditPatient={handleEditPatient}
              fieldSettings={fieldSettings}
              logAction={logAction}
              incidents={incidents}
              onSaveIncident={handleSaveIncident}
              referrals={referrals}
              onSaveReferral={handleSaveReferral}
              onBack={() => setSelectedPatientId(null)}
              governanceTrack={governanceTrack}
              onOpenRevocationModal={(p, c) => setRevocationTarget({ patient: p, category: c })}
              onOpenMedicoLegalExport={handleOpenMedicoLegalExport}
          /> : 
          <PatientRegistryManager 
              patients={patients} 
              appointments={appointments}
              onSelectPatient={setSelectedPatientId}
              onAddPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }}
              onBookAppointment={() => { setInitialBookingPatientId(undefined); setIsAppointmentModalOpen(true); }}
              fieldSettings={fieldSettings}
          />;
      case 'admin':
          return (
            <AdminHub 
                onNavigate={(tab) => {
                    if (tab === 'inventory') { setActiveTab('inventory'); }
                    if (tab === 'financials') { setActiveTab('financials'); }
                    if (tab === 'recall') { setActiveTab('recall'); }
                    if (tab === 'referrals') { setActiveTab('referrals'); }
                    if (tab === 'roster') { setActiveTab('roster'); }
                }}
            />
          );
      case 'inventory': return <Inventory 
          stock={stock} 
          onUpdateStock={handleUpdateStock} 
          sterilizationCycles={sterilizationCycles}
          onAddCycle={handleAddCycle}
          currentUser={currentUser}
          currentBranch={currentBranch}
          availableBranches={fieldSettings.branches}
          transfers={transfers}
          onPerformTransfer={handlePerformTransfer}
          patients={patients}
          fieldSettings={fieldSettings}
          onUpdateSettings={handleUpdateSettings}
          appointments={appointments}
          logAction={logAction}
      />;
      case 'financials': return <Financials 
          claims={hmoClaims} 
          expenses={[]} 
          philHealthClaims={philHealthClaims}
          patients={patients}
          appointments={appointments}
          fieldSettings={fieldSettings}
          staff={staff}
          currentUser={currentUser}
          onUpdatePhilHealthClaim={handleUpdatePhilHealthClaim}
          reconciliations={reconciliations}
          onSaveReconciliation={handleSaveReconciliation}
          onSaveCashSession={handleSaveCashSession}
          currentBranch={currentBranch}
          payrollPeriods={payrollPeriods}
          payrollAdjustments={payrollAdjustments}
          commissionDisputes={commissionDisputes}
          onUpdatePayrollPeriod={handleUpdatePayrollPeriod}
          onAddPayrollAdjustment={handleAddPayrollAdjustment}
          onApproveAdjustment={handleApproveAdjustment}
          onAddCommissionDispute={handleAddCommissionDispute}
          onResolveCommissionDispute={handleResolveCommissionDispute}
          governanceTrack={governanceTrack}
          setGovernanceTrack={setGovernanceTrack}
      />;
      case 'recall': return <RecallCenter patients={patients} onUpdatePatientRecall={handleUpdatePatientRecall} />;
      case 'referrals': return <ReferralManager patients={patients} referrals={referrals} staff={staff} onSaveReferral={handleSaveReferral} />;
      case 'roster': return <RosterView staff={staff} fieldSettings={fieldSettings} />;
      case 'field-mgmt': return <FieldManagement 
          settings={fieldSettings} 
          onUpdateSettings={handleUpdateSettings}
          auditLog={auditLog}
          auditLogVerified={isAuditLogVerified}
          staff={staff}
          patients={patients}
          onPurgePatient={handlePurgePatient}
          encryptionKey={encryptionKey}
          incidents={incidents}
          onSaveIncident={handleSaveIncident}
          appointments={appointments}
          currentUser={currentUser}
          onStartImpersonating={handleStartImpersonating}
      />;
      default: return <Dashboard 
          appointments={appointments}
          patientsCount={patients.length} 
          staffCount={staff.length}
          staff={staff}
          currentUser={effectiveUser} 
          patients={patients} 
          onAddPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} 
          onPatientSelect={handleNavigateToPatient} 
          onAddAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }} 
          onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
          fieldSettings={fieldSettings}
          onCompleteRegistration={(id) => handleEditPatient(patients.find(p => p.id === id)!)}
          tasks={tasks}
          onToggleTask={handleToggleTask}
          syncConflicts={syncConflicts}
          onVerifyDowntimeEntry={handleOpenReconciliationModal}
          onQuickQueue={() => setIsQuickTriageModalOpen(true)}
          onQuickAddPatient={() => setIsQuickAddPatientModalOpen(true)}
          currentBranch={currentBranch}
      />;
    }
  };

  if (isInKioskMode) {
      return <KioskView 
          patients={patients} 
          onUpdatePatient={handleSavePatient}
          onExitKiosk={() => setIsInKioskMode(false)}
          fieldSettings={fieldSettings}
          logAction={logAction}
      />;
  }

  return (
    <>
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddAppointment={() => {
            setInitialBookingPatientId(undefined);
            setEditingAppointment(null);
            setIsAppointmentModalOpen(true);
        }}
        currentUser={effectiveUser}
        onSwitchUser={setCurrentUser}
        staff={staff}
        currentBranch={currentBranch}
        availableBranches={fieldSettings.branches}
        onChangeBranch={setCurrentBranch}
        fieldSettings={fieldSettings}
        onGenerateReport={handleGenerateReport}
        tasks={tasks}
        onToggleTask={handleToggleTask}
        onEnterKioskMode={() => setIsInKioskMode(true)}
        isOnline={isOnline}
        pendingSyncCount={offlineQueue.length}
        systemStatus={systemStatus}
        onSwitchSystemStatus={handleSwitchSystemStatus}
        installable={!!deferredPrompt}
        onInstall={handleInstallApp}
        impersonatingUser={originalUser}
        onStopImpersonating={handleStopImpersonating}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        isProfileOpen={isProfileOpen}
        onOpenProfile={() => setIsProfileOpen(true)}
        onCloseProfile={() => setIsProfileOpen(false)}
      >
        {renderContent()}
      </Layout>
      <AppointmentModal 
        isOpen={isAppointmentModalOpen}
        onClose={() => { 
            setIsAppointmentModalOpen(false); 
            setEditingAppointment(null); 
            setIsReconciliationMode(false);
            setBookingDate(undefined);
            setBookingTime(undefined);
            setInitialBookingPatientId(undefined);
        }}
        patients={patients}
        staff={staff}
        appointments={appointments}
        onSave={handleSaveAppointment}
        initialDate={bookingDate}
        initialTime={bookingTime}
        initialPatientId={initialBookingPatientId}
        existingAppointment={editingAppointment}
        fieldSettings={fieldSettings}
        isDowntime={systemStatus === SystemStatus.DOWNTIME}
      />
      <PatientRegistrationModal 
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSave={handleSavePatient}
        initialData={editingPatient}
        fieldSettings={fieldSettings}
        patients={patients}
      />
      <QuickAddPatientModal
        isOpen={isQuickAddPatientModalOpen}
        onClose={() => setIsQuickAddPatientModalOpen(false)}
        onSave={handleSaveQuickAddPatient}
      />
      <QuickTriageModal 
        isOpen={isQuickTriageModalOpen}
        onClose={() => setIsQuickTriageModalOpen(false)}
        onSave={handleSaveQuickQueue}
      />
      {pendingPostOpAppointment && (
          <PostOpHandoverModal 
            isOpen={!!pendingPostOpAppointment}
            onClose={() => setPendingPostOpAppointment(null)}
            appointment={pendingPostOpAppointment}
            onConfirm={async () => {
                const apt = pendingPostOpAppointment;
                setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, postOpVerified: true } : a));
                await finalizeUpdateStatus(apt.id, AppointmentStatus.COMPLETED);
                setPendingPostOpAppointment(null);
            }}
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
      {safetyAlert && (
        <SafetyAlertModal 
            isOpen={!!safetyAlert}
            onClose={() => setSafetyAlert(null)}
            title={safetyAlert.title}
            message={safetyAlert.message}
        />
      )}
      {isMedicoLegalExportOpen && medicoLegalExportPatient && (
          <MedicoLegalExportModal
            isOpen={isMedicoLegalExportOpen}
            onClose={() => setIsMedicoLegalExportOpen(false)}
            patient={medicoLegalExportPatient}
            staff={staff}
            logAction={logAction}
          />
      )}
    </>
  );
}

export default App;
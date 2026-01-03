import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import PatientList from './components/PatientList';
import AppointmentModal from './components/AppointmentModal';
import PatientRegistrationModal from './components/PatientRegistrationModal';
import FieldManagement from './components/FieldManagement';
import KioskView from './components/KioskView';
import Inventory from './components/Inventory';
import Financials from './components/Financials';
import PostOpHandoverModal from './components/PostOpHandoverModal';
import { STAFF, PATIENTS, APPOINTMENTS, DEFAULT_FIELD_SETTINGS, MOCK_AUDIT_LOG, MOCK_STOCK, MOCK_CLAIMS, MOCK_EXPENSES, MOCK_STERILIZATION_CYCLES, CRITICAL_CLEARANCE_CONDITIONS } from './constants';
import { Appointment, User, Patient, FieldSettings, AppointmentType, UserRole, AppointmentStatus, PinboardTask, AuditLogEntry, StockItem, DentalChartEntry, SterilizationCycle, HMOClaim, PhilHealthClaim, PhilHealthClaimStatus, HMOClaimStatus, ClinicalIncident, Referral, ReconciliationRecord, StockTransfer, RecallStatus, TriageLevel, CashSession, PayrollPeriod, PayrollAdjustment, CommissionDispute, PayrollStatus, SyncIntent, SyncConflict, SystemStatus } from './types';
import { useToast } from './components/ToastSystem';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import CryptoJS from 'crypto-js';
import { Lock, FileText, CheckCircle, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { getTrustedTime } from './services/timeService';

const CANARY_KEY = 'dentsched_auth_canary';
const SALT_KEY = 'dentsched_security_salt';
const VERIFICATION_TOKEN = 'DENTSCHED_VERIFIED_ACCESS';
const GHOST_LOG_KEY = '_ds_ext_sys_0x1'; 
const TERMS_VERSION = '1.0-2024'; 
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

function App() {
  const toast = useToast();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [showTamperAlert, setShowTamperAlert] = useState(false);

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

  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const idleTimerRef = useRef<any>(null);
  const IDLE_TIMEOUT_MS = 15 * 60 * 1000; 

  const [currentUser, setCurrentUser] = useState<User>(STAFF[0]); 
  const [isInKioskMode, setIsInKioskMode] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<string>('Makati Branch');

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<string | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState<string | undefined>(undefined);
  const [initialBookingPatientId, setInitialBookingPatientId] = useState<string | undefined>(undefined);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const [pendingPostOpAppointment, setPendingPostOpAppointment] = useState<Appointment | null>(null);

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

  const isLicenseExpired = useMemo(() => {
    if (currentUser.role !== UserRole.DENTIST || !currentUser.prcExpiry) return false;
    return new Date(currentUser.prcExpiry) < new Date();
  }, [currentUser]);

  const effectiveUser = useMemo(() => ({
    ...currentUser,
    isReadOnly: currentUser.isReadOnly || isLicenseExpired
  }), [currentUser, isLicenseExpired]);

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

  const sanitizedPatients = useMemo(() => {
      if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DENTIST) return patients;
      if (currentUser.role === UserRole.DENTAL_ASSISTANT) {
          return patients.map(p => ({
              ...p,
              currentBalance: undefined,
              ledger: [],
              installmentPlans: []
          })) as Patient[];
      }
      return []; 
  }, [patients, currentUser.role]);

  const handleManualOverride = (gateId: string, reason: string) => {
      logAction('DOWNTIME_BYPASS', 'System', gateId, `Manual clinical override. Reason: ${reason}`);
      toast.info("Validation bypassed. Logged for review.");
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

  const triggerSms = useCallback((templateId: string, patient: Patient, extras: Record<string, string> = {}) => {
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

      logAction('SEND_SMS', 'SmsQueue', patient.id, `Queued "${config.label}" for ${patient.phone}: ${message}`);
  }, [fieldSettings, currentBranch, isOnline, systemStatus]);

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
    const aptWithSync = { 
        ...newAppointment, 
        branch: newAppointment.branch || currentBranch, 
        isPendingSync: !isOnline,
        entryMode: isManual ? 'MANUAL' : 'AUTO',
        reconciled: !isManual
    } as Appointment;
    const patient = patients.find(p => p.id === newAppointment.patientId);

    if (!isOnline) {
        setOfflineQueue(prev => [...prev, { id: `intent_${Date.now()}`, action: 'CREATE_APPOINTMENT', payload: aptWithSync, timestamp: new Date().toISOString() }]);
        toast.info("Appointment queued for offline sync.");
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

  const handleVerifyMedHistory = (appointmentId: string) => {
    const timestamp = new Date().toISOString();
    setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, medHistoryVerified: true, medHistoryVerifiedAt: timestamp } : a));
    logAction('VIEW_RECORD', 'Appointment', appointmentId, "Chair-side Safety Protocol: Re-verified patient medical history before treatment.");
    toast.success("Medical history verified for session safety.");
  };

  const handleConfirmFollowUp = (appointmentId: string) => {
      const timestamp = new Date().toISOString();
      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, followUpConfirmed: true, followUpConfirmedAt: timestamp } : a));
      logAction('UPDATE', 'Appointment', appointmentId, "Standard of Care Compliance: Executed 24h Post-Op Vigilance contact. Patient stabilized.");
      toast.success("Post-op follow-up documented.");
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
    }

    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status, isPendingSync: !isOnline } : a));
    logAction('UPDATE', 'Appointment', id, `Updated status to ${status}.`);
  };

  const handleUpdateAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => {
      const apt = appointments.find(a => a.id === appointmentId);
      if (!apt) return;

      const patient = patients.find(p => p.id === apt.patientId);

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

  const handleConfirmPostOp = () => {
      if (!pendingPostOpAppointment) return;
      const id = pendingPostOpAppointment.id;
      const timestamp = new Date().toISOString();
      
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, postOpVerified: true, postOpVerifiedAt: timestamp } : a));
      logAction('UPDATE', 'Appointment', id, "Post-Op Handover Shield: Verified that oral/written instructions were received and understood by the patient.");
      
      finalizeUpdateStatus(id, AppointmentStatus.COMPLETED);
      setPendingPostOpAppointment(null);
      toast.success("Post-op verification logged. Treatment finalized.");
  };

  const handleSavePatient = (newPatientData: Partial<Patient>) => {
    const dataWithTimestamp = { ...newPatientData, lastDigitalUpdate: new Date().toISOString() };
    if (!isOnline) {
        setOfflineQueue(prev => [...prev, { id: `intent_${Date.now()}`, action: 'UPDATE_PATIENT', payload: dataWithTimestamp, timestamp: new Date().toISOString() }]);
        toast.info("Patient update queued for offline sync.");
    }

    if (editingPatient) {
        const updatedPatient = { ...editingPatient, ...dataWithTimestamp } as Patient;
        logAction('UPDATE', 'Patient', editingPatient.id, 'Updated patient registration details', editingPatient, updatedPatient);
        setPatients(prev => prev.map(p => p.id === newPatientData.id ? updatedPatient : p));
        setEditingPatient(null);
    } else {
        const newPatient: Patient = { ...dataWithTimestamp as Patient, id: newPatientData.id || `p_new_${Date.now()}`, lastVisit: 'First Visit', nextVisit: null, notes: newPatientData.notes || '', recallStatus: 'Due' };
        logAction('CREATE', 'Patient', newPatient.id, 'Registered new patient');
        setPatients(prev => [...prev, newPatient]);
    }
  };

  const handleQuickUpdatePatient = (updatedPatient: Patient) => {
      const original = patients.find(p => p.id === updatedPatient.id);
      if (original) {
          updatedPatient.dentalChart?.forEach(entry => {
              const origEntry = original.dentalChart?.find(e => e.id === entry.id);
              if (entry.sealedHash && !origEntry?.sealedHash && entry.materialBatchId) {
                  setStock(prev => prev.map(s => s.id === entry.materialBatchId ? { ...s, isLockedForEvidence: true } : s));
              }
          });
      }
      setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const handleSaveIncident = async (incident: ClinicalIncident) => {
      const newIncident = { ...incident, id: incident.id || `inc_${Date.now()}` };
      setIncidents(prev => [newIncident, ...prev]);
      logAction('LOG_INCIDENT', 'Incident', newIncident.id, `Reported ${incident.type}: ${incident.description}`);

      if (incident.patientId && incident.type === 'Complication') {
          const patient = patients.find(p => p.id === incident.patientId);
          if (patient && patient.dentalChart) {
              const chart = [...patient.dentalChart];
              const { timestamp } = await getTrustedTime();
              let sealCount = 0;
              
              for (let i = chart.length - 1; i >= 0 && sealCount < 3; i--) {
                  if (!chart[i].sealedHash) {
                      const payload = `${chart[i].id}|AUTO_SEAL_INCIDENT|${newIncident.id}|${timestamp}`;
                      chart[i].sealedHash = CryptoJS.SHA256(payload).toString();
                      chart[i].sealedAt = timestamp;
                      chart[i].isLocked = true;
                      chart[i].notes = `[AUTO-SEALED FORENSIC LOCK: INCIDENT ${newIncident.id}]\n${chart[i].notes}`;
                      sealCount++;
                  }
              }
              
              if (sealCount > 0) {
                  setPatients(prev => prev.map(p => p.id === incident.patientId ? { ...p, dentalChart: chart } : p));
                  logAction('SECURITY_ALERT', 'Patient', incident.patientId, `Forensic Auto-Seal active: Frozen ${sealCount} notes following reported complication.`);
                  toast.warning(`Clinical Shield: Preceding ${sealCount} notes have been forensically frozen.`);
              }
          }
      }
      
      toast.success("Incident logged successfully.");
  };

  const handleSaveReconciliation = (record: ReconciliationRecord) => {
      setReconciliations(prev => [record, ...prev]);
      logAction('DAILY_RECONCILE', 'CashBox', currentBranch, `Finalized daily reconciliation. Discrepancy: ${record.discrepancy}`);
  };

  const handleSaveCashSession = (session: CashSession) => {
      setCashSessions(prev => {
          const idx = prev.findIndex(s => s.id === session.id);
          if (idx >= 0) {
              const next = [...prev];
              next[idx] = session;
              return next;
          }
          return [session, ...prev];
      });
      if (session.status === 'Open') {
          logAction('OPEN_CASH_DRAWER', 'CashBox', session.id, `Opened cash drawer for shift with float: ${session.openingBalance}`);
      } else {
          logAction('CLOSE_CASH_DRAWER', 'CashBox', session.id, `Closed cash drawer for shift.`);
      }
  };

  const handleUpdatePayrollPeriod = (period: PayrollPeriod) => {
      setPayrollPeriods(prev => {
          const existing = prev.find(p => p.id === period.id);
          if (existing) return prev.map(p => p.id === period.id ? period : p);
          return [period, ...prev];
      });
  };

  const handleAddAdjustment = (adj: PayrollAdjustment) => setPayrollAdjustments(prev => [adj, ...prev]);
  const handleApproveAdjustment = (adjId: string) => setPayrollAdjustments(prev => prev.map(a => a.id === adjId ? { ...a, status: 'Approved', verifiedBy: currentUser.id } : a));
  const handleAddDispute = (dispute: CommissionDispute) => setCommissionDisputes(prev => [dispute, ...prev]);
  const handleResolveDispute = (disputeId: string) => setCommissionDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status: 'Resolved' } : d));

  const anonymizePatient = (p: Patient): Patient => ({
      ...p,
      name: '[REDACTED-DPA]',
      firstName: 'REDACTED',
      surname: 'REDACTED',
      middleName: '',
      email: 'redacted@dentsched.ph',
      phone: '000-0000',
      homeAddress: 'REDACTED',
      barangay: 'REDACTED',
      city: 'REDACTED',
      occupation: 'REDACTED',
      guardian: 'REDACTED',
      guardianMobile: 'REDACTED',
      isAnonymized: true,
      dob: '0000-00-00',
  });

  const handlePurgePatient = (patientId: string) => {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;

      const lastVisitStr = patient.lastVisit === 'First Visit' ? new Date().toLocaleDateString('en-CA') : patient.lastVisit;
      const lastVisitDate = new Date(lastVisitStr);
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

      if (lastVisitDate > tenYearsAgo) {
          const identityToken = CryptoJS.SHA256(patient.name + patient.dob).toString();
          const anonymized = anonymizePatient(patient);
          setPatients(prev => prev.map(p => p.id === patientId ? anonymized : p));
          logAction('DESTRUCTION_CERTIFICATE', 'Patient', patientId, `PDA Right to Erasure exercised. Record anonymized. Identity Token Hash: ${identityToken.substring(0, 16)}...`);
          toast.warning("DOH Compliance: Record scrubbed for DPA but clinical history preserved for mandatory 10-year period.");
      } else {
          setPatients(prev => prev.filter(p => p.id !== patientId));
          setAppointments(prev => prev.filter(a => a.patientId !== patientId));
          logAction('DESTRUCTION_CERTIFICATE', 'DataArchive', patientId, `Purged inactive record (>10 years).`);
          toast.success("Inactive record permanently destroyed.");
      }
  };

  const handleTabChange = (tab: string) => {
      if (tab === 'field-mgmt' && currentUser.role !== UserRole.ADMIN) {
          toast.error("Access Restricted.");
          return;
      }
      setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard appointments={appointments.filter(a => a.branch === currentBranch)} patientsCount={patients.length} staffCount={staff.length} staff={staff} currentUser={effectiveUser} patients={sanitizedPatients} onAddPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} onPatientSelect={setSelectedPatientId} onBookAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }} onUpdateAppointmentStatus={handleUpdateAppointmentStatus} onCompleteRegistration={(id) => { const p = patients.find(pt => pt.id === id); if (p) { setEditingPatient(p); setIsPatientModalOpen(true); }}} onUpdatePatientRecall={handleUpdatePatientRecall} fieldSettings={fieldSettings} onUpdateSettings={setFieldSettings} onViewAllSchedule={() => setActiveTab('schedule')} tasks={tasks} onChangeBranch={setCurrentBranch} currentBranch={currentBranch} onSaveConsent={(aid, url) => setAppointments(prev => prev.map(a => a.id === aid ? { ...a, signedConsentUrl: url } : a))} auditLogVerified={isAuditLogVerified} sterilizationCycles={sterilizationCycles} stock={stock} auditLog={auditLog} logAction={logAction} syncConflicts={syncConflicts} setSyncConflicts={setSyncConflicts} systemStatus={systemStatus} onSwitchSystemStatus={setSystemStatus} onVerifyDowntimeEntry={(id) => setAppointments(prev => prev.map(a => a.id === id ? {...a, entryMode: 'AUTO', reconciled: true} : a))} onVerifyMedHistory={handleVerifyMedHistory} onConfirmFollowUp={handleConfirmFollowUp} />;
      case 'schedule': return <CalendarView appointments={appointments.filter(a => a.branch === currentBranch)} staff={staff} onAddAppointment={(d, t, pid, apt) => { setBookingDate(d); setBookingTime(t); setInitialBookingPatientId(pid); setEditingAppointment(apt || null); setIsAppointmentModalOpen(true); }} onMoveAppointment={(id, d, t, pr) => setAppointments(prev => prev.map(a => a.id === id ? { ...a, date: d, time: t, providerId: pr } : a))} currentUser={effectiveUser} patients={sanitizedPatients} currentBranch={currentBranch} fieldSettings={fieldSettings} />;
      case 'patients': return <PatientList patients={sanitizedPatients} appointments={appointments} currentUser={effectiveUser} selectedPatientId={selectedPatientId} onSelectPatient={setSelectedPatientId} onAddPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} onEditPatient={(p) => { setEditingPatient(p); setIsPatientModalOpen(true); }} onQuickUpdatePatient={handleQuickUpdatePatient} onDeletePatient={handlePurgePatient} onBookAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }} fieldSettings={fieldSettings} logAction={logAction} staff={staff} />;
      case 'inventory': return <Inventory stock={stock} onUpdateStock={setStock} currentUser={effectiveUser} sterilizationCycles={sterilizationCycles} onAddCycle={(c) => setSterilizationCycles(prev => [...prev, { id: `c_${Date.now()}`, ...c }])} currentBranch={currentBranch} availableBranches={fieldSettings.branches} transfers={transfers} fieldSettings={fieldSettings} onUpdateSettings={setFieldSettings} appointments={appointments} logAction={logAction} />;
      case 'financials': return <Financials claims={hmoClaims} expenses={MOCK_EXPENSES} philHealthClaims={philHealthClaims} currentUser={effectiveUser} appointments={appointments} patients={sanitizedPatients} fieldSettings={fieldSettings} staff={staff} reconciliations={reconciliations} onSaveReconciliation={handleSaveReconciliation} onSaveCashSession={handleSaveCashSession} currentBranch={currentBranch} payrollPeriods={payrollPeriods} payrollAdjustments={payrollAdjustments} commissionDisputes={commissionDisputes} onUpdatePayrollPeriod={handleUpdatePayrollPeriod} onAddPayrollAdjustment={handleAddAdjustment} onApprovePayrollAdjustment={handleApproveAdjustment} onAddCommissionDispute={handleAddDispute} onResolveCommissionDispute={handleResolveDispute} />;
      case 'field-mgmt': return <FieldManagement settings={fieldSettings} onUpdateSettings={setFieldSettings} staff={staff} auditLog={auditLog} patients={patients} onPurgePatient={handlePurgePatient} auditLogVerified={isAuditLogVerified} encryptionKey={encryptionKey} incidents={incidents} onSaveIncident={handleSaveIncident} />;
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
                      {!isOnline && <div className="mt-2 text-xs font-bold text-lilac-600 uppercase flex items-center gap-1"><Lock size={12}/> Emergency Offline Entry Active</div>}
                  </div>
                  <form onSubmit={handleLogin} className="space-y-4">
                      <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label><input type="password" required value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl mt-1 focus:ring-4 focus:ring-teal-500/20 outline-none text-lg font-bold" placeholder="••••••••" /></div>
                      <button type="submit" disabled={isInitializing || !passwordInput} className="w-full py-4 bg-teal-600 text-white font-bold rounded-xl shadow-xl transition-all">{isInitializing ? 'Verifying...' : 'Unlock System'}</button>
                  </form>
              </div>
          </div>
      )
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={handleTabChange} 
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
      onToggleTask={(id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))} 
      onEnterKioskMode={() => setIsInKioskMode(true)}
      isOnline={isOnline}
      pendingSyncCount={offlineQueue.length}
      systemStatus={systemStatus}
      onSwitchSystemStatus={setSystemStatus}
    >
      {showTamperAlert && (
          <div className="fixed top-0 left-0 right-0 z-[1000] bg-black text-red-500 p-4 flex items-center justify-center gap-4 animate-in slide-in-from-top-full duration-1000">
              <ShieldAlert size={32} className="animate-pulse" />
              <div className="text-center">
                  <h2 className="text-xl font-black uppercase tracking-tighter">NPC SECURITY ALERT: SYSTEM INTEGRITY VIOLATION</h2>
                  <p className="text-xs font-bold text-red-400">Primary audit log wiped while forensic shadow logs remain. Mandatory 72-hour NPC reporting protocol active.</p>
              </div>
              <button onClick={() => setShowTamperAlert(false)} className="bg-red-500 text-black px-4 py-1 rounded font-black text-xs">Acknowledge</button>
          </div>
      )}
      {isInKioskMode ? <KioskView patients={patients} onUpdatePatient={handleSavePatient} onExitKiosk={() => setIsInKioskMode(false)} fieldSettings={fieldSettings} logAction={logAction} /> : renderContent()}
      <AppointmentModal isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} onSave={handleSaveAppointment} patients={patients} staff={staff} appointments={appointments} initialDate={bookingDate} initialTime={bookingTime} initialPatientId={initialBookingPatientId} existingAppointment={editingAppointment} fieldSettings={fieldSettings} sterilizationCycles={sterilizationCycles} onManualOverride={handleManualOverride} isDowntime={systemStatus === SystemStatus.DOWNTIME} />
      <PatientRegistrationModal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} onSave={handleSavePatient} initialData={editingPatient} fieldSettings={fieldSettings} patients={patients} />
      {pendingPostOpAppointment && <PostOpHandoverModal isOpen={!!pendingPostOpAppointment} onClose={() => setPendingPostOpAppointment(null)} onConfirm={handleConfirmPostOp} appointment={pendingPostOpAppointment} />}
    </Layout>
  );
}

export default App;
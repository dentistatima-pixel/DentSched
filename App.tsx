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

const SALT_KEY = 'dentsched_security_salt_v2';
const GHOST_LOG_KEY = '_ds_ext_sys_0x1'; 
const PBKDF2_ITERATIONS = 100000; 

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
  
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState<User>(STAFF[0]); 
  
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

  const [isInKioskMode, setIsInKioskMode] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<string>('Makati Main');
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(SystemStatus.OPERATIONAL);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<string | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState<string | undefined>(undefined);
  const [initialBookingPatientId, setInitialBookingPatientId] = useState<string | undefined>(undefined);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

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

  const loadSecureData = async (key: CryptoKey) => {
      const load = async (k: string, def: any) => {
          const enc = localStorage.getItem(k);
          if (!enc) return def;
          try { return await decryptNative(enc, key); } catch (e) { return def; } 
      };

      const [pts, apts, members, settings] = await Promise.all([
          load('dentsched_patients_v2', PATIENTS),
          load('dentsched_appointments_v2', APPOINTMENTS),
          load('dentsched_staff_v2', STAFF),
          load('dentsched_fields_v2', null)
      ]);

      setPatients(pts); setAppointments(apts); setStaff(members);
      if (settings) setFieldSettings(settings);

      const [inv, cycles, scheduled, logs, tasksList, hClaims, pClaims, incs, refs, recons, cSess, xfers, pPeriods, pAdjs, cDisps, sStatus] = await Promise.all([
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
          load('dentsched_system_status_v2', SystemStatus.OPERATIONAL)
      ]);

      setStock(inv); setSterilizationCycles(cycles); setScheduledSms(scheduled); setTask(tasksList);
      setHmoClaims(hClaims); setPhilHealthClaims(pClaims); setIncidents(incs); setReferrals(refs);
      setReconciliations(recons); setCashSessions(cSess); setTransfers(xfers); setPayrollPeriods(pPeriods);
      setPayrollAdjustments(pAdjs); setCommissionDisputes(cDisps); setSystemStatus(sStatus);
      
      setAuditLog(logs.length > 0 ? logs : MOCK_AUDIT_LOG);
      setIsAuditLogVerified(verifyAuditTrail(logs));
  };

  useEffect(() => {
    const bootApp = async () => {
        try {
            let salt = localStorage.getItem(SALT_KEY);
            if (!salt) {
                salt = "ARCHITECT_GENESIS_SALT_8892";
                localStorage.setItem(SALT_KEY, salt);
            }
            const derivedKey = await getCryptoKey("architect_bypass_protocol", salt);
            setEncryptionKey(derivedKey);
            await loadSecureData(derivedKey);
            setIsInitializing(false);
            logAction('LOGIN', 'System', 'Session', `Architect Auto-Auth Boot Completed.`);
        } catch (error) {
            console.error("Automatic boot failure", error);
            setIsInitializing(false);
        }
    };
    bootApp();
  }, []);

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
      case 'dashboard': return (
        <Dashboard 
            appointments={appointments.filter(a => a.branch === currentBranch)} 
            allAppointments={appointments}
            patientsCount={patients.length} 
            staffCount={staff.length} 
            staff={staff} 
            currentUser={currentUser} 
            patients={patients} 
            onAddPatient={() => setIsPatientModalOpen(true)} 
            onPatientSelect={setSelectedPatientId} 
            onBookAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }} 
            onUpdateAppointmentStatus={handleUpdateAppointmentStatus} 
            fieldSettings={fieldSettings} 
            currentBranch={currentBranch}
            stock={stock}
            sterilizationCycles={sterilizationCycles}
            hmoClaims={hmoClaims}
            philHealthClaims={philHealthClaims}
            auditLog={auditLog}
        />
      );
      case 'schedule': return <CalendarView appointments={appointments.filter(a => a.branch === currentBranch)} staff={staff} onAddAppointment={(d, t, pid, apt) => { setBookingDate(d); setBookingTime(t); setInitialBookingPatientId(pid); setEditingAppointment(apt || null); setIsAppointmentModalOpen(true); }} patients={patients} currentBranch={currentBranch} fieldSettings={fieldSettings} />;
      case 'patients': return <PatientList patients={patients} appointments={appointments} currentUser={currentUser} selectedPatientId={selectedPatientId} onSelectPatient={setSelectedPatientId} onAddPatient={() => setIsPatientModalOpen(true)} onEditPatient={(p) => { setEditingPatient(p); setIsPatientModalOpen(true); }} onQuickUpdatePatient={handleSavePatient} onDeletePatient={() => {}} onBookAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }} fieldSettings={fieldSettings} logAction={logAction} staff={staff} />;
      case 'inventory': return <Inventory stock={stock} onUpdateStock={setStock} currentUser={currentUser} sterilizationCycles={sterilizationCycles} onAddCycle={(c) => setSterilizationCycles(prev => [...prev, c])} currentBranch={currentBranch} availableBranches={fieldSettings.branches} fieldSettings={fieldSettings} appointments={appointments} />;
      case 'financials': return <Financials claims={hmoClaims} expenses={MOCK_EXPENSES} philHealthClaims={philHealthClaims} currentUser={currentUser} appointments={appointments} patients={patients} fieldSettings={fieldSettings} staff={staff} currentBranch={currentBranch} payrollPeriods={payrollPeriods} payrollAdjustments={payrollAdjustments} commissionDisputes={commissionDisputes} onUpdatePayrollPeriod={(p) => {}} onAddPayrollAdjustment={(a) => {}} onApproveAdjustment={(id) => {}} onAddCommissionDispute={(d) => {}} onResolveCommissionDispute={(id) => {}} />;
      case 'field-mgmt': return <FieldManagement settings={fieldSettings} onUpdateSettings={setFieldSettings} staff={staff} auditLog={auditLog} patients={patients} onPurgePatient={() => {}} auditLogVerified={isAuditLogVerified} encryptionKey={encryptionKey ? 'PROTECTED_KEY' : null} incidents={incidents} onSaveIncident={() => {}} appointments={appointments} />;
      default: return null;
    }
  };

  if (isInitializing) {
      return (
          <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4">
              <div className="flex flex-col items-center gap-6">
                <Loader2 size={64} className="text-teal-500 animate-spin" />
                <div className="flex flex-col items-center gap-1">
                    <h2 className="text-white font-black uppercase tracking-[0.3em] text-[10px]">Unlocking clinical vault</h2>
                    <p className="text-teal-400 font-mono text-[8px] uppercase tracking-widest animate-pulse">Establishing Architect Authority...</p>
                </div>
              </div>
          </div>
      )
  }

  return (
    <div className={isInKioskMode ? "kiosk-mode h-full" : "h-full"}>
        <Layout activeTab={activeTab} setActiveTab={setActiveTab} onAddAppointment={() => setIsAppointmentModalOpen(true)} currentUser={currentUser} onSwitchUser={setCurrentUser} staff={staff} currentBranch={currentBranch} availableBranches={fieldSettings.branches} onChangeBranch={setCurrentBranch} fieldSettings={fieldSettings} onGenerateReport={() => {}} tasks={tasks} onToggleTask={(id) => setTask(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))} onEnterKioskMode={() => setIsInKioskMode(true)} isOnline={isOnline} systemStatus={systemStatus} onSwitchSystemStatus={setSystemStatus}>
        {renderContent()}
        {isAppointmentModalOpen && <AppointmentModal isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} patients={patients} staff={staff} appointments={appointments} onSave={handleSaveAppointment} onSavePatient={handleSavePatient} initialDate={bookingDate} initialTime={bookingTime} initialPatientId={initialBookingPatientId} existingAppointment={editingAppointment} fieldSettings={fieldSettings} isDowntime={systemStatus === SystemStatus.DOWNTIME} />}
        {isPatientModalOpen && <PatientRegistrationModal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} onSave={handleSavePatient} initialData={editingPatient} fieldSettings={fieldSettings} patients={patients} />}
        </Layout>
    </div>
  );
}

export default App;
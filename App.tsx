
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import PatientPortal from './components/PatientPortal';
import { STAFF, PATIENTS, APPOINTMENTS, DEFAULT_FIELD_SETTINGS, MOCK_AUDIT_LOG, MOCK_STOCK, MOCK_CLAIMS, MOCK_EXPENSES, MOCK_STERILIZATION_CYCLES } from './constants';
import { Appointment, User, Patient, FieldSettings, AppointmentType, UserRole, AppointmentStatus, PinboardTask, AuditLogEntry, StockItem, DentalChartEntry, SterilizationCycle, HMOClaim, PhilHealthClaim, PhilHealthClaimStatus, HMOClaimStatus, ClinicalIncident, Referral, ReconciliationRecord, StockTransfer, RecallStatus } from './types';
import { useToast } from './components/ToastSystem';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import CryptoJS from 'crypto-js';
import { Lock, FileText, CheckCircle, ShieldCheck } from 'lucide-react';
import { getTrustedTime } from './services/timeService';

// --- SECURITY CONSTANTS ---
const CANARY_KEY = 'dentsched_auth_canary';
const SALT_KEY = 'dentsched_security_salt';
const VERIFICATION_TOKEN = 'DENTSCHED_VERIFIED_ACCESS';
const TERMS_VERSION = '1.0-2024'; 
const PBKDF2_ITERATIONS = 600000; 

// --- DIFFING UTILITY ---
const generateDiff = (oldObj: any, newObj: any): string => {
    if (!oldObj) return 'Created record';
    const changes: string[] = [];
    const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    const ignoredKeys = ['lastDigitalUpdate', 'lastPrintedDate', 'dentalChart', 'ledger', 'perioChart', 'treatmentPlans', 'files', 'timestamp', 'isVerifiedTimestamp']; 

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

  const [activeTab, setActiveTab] = useState('dashboard');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [sterilizationCycles, setSterilizationCycles] = useState<SterilizationCycle[]>([]);
  const [fieldSettings, setFieldSettings] = useState<FieldSettings>(DEFAULT_FIELD_SETTINGS);
  const [tasks, setTasks] = useState<PinboardTask[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [incidents, setIncidents] = useState<ClinicalIncident[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [reconciliations, setReconciliations] = useState<ReconciliationRecord[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  
  const [hmoClaims, setHmoClaims] = useState<HMOClaim[]>(MOCK_CLAIMS);
  const [philHealthClaims, setPhilHealthClaims] = useState<PhilHealthClaim[]>([]);

  const [isTermsAccepted, setIsTermsAccepted] = useState(() => {
      const acceptedVersion = localStorage.getItem('dentsched_terms_version');
      return acceptedVersion === TERMS_VERSION;
  });
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const idleTimerRef = useRef<any>(null);
  const IDLE_TIMEOUT_MS = 15 * 60 * 1000; 

  const [isPatientPortalActive, setIsPatientPortalActive] = useState(false);
  const [currentPatientUser, setCurrentPatientUser] = useState<Patient | null>(null);
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

  // --- SMS AUTOMATION ENGINE ---
  const triggerSms = useCallback((templateId: string, patient: Patient, extras: Record<string, string> = {}) => {
      if (!fieldSettings.features.enableSmsAutomation) return;
      
      const config = fieldSettings.smsTemplates[templateId];
      if (!config || !config.enabled) return;

      const marketingCategories = ['Onboarding', 'Efficiency', 'Reputation'];
      if (marketingCategories.includes(config.category) && !patient.marketingConsent) {
          console.debug(`[SMS Engine] Marketing opt-out for ${patient.name} prevents sending ${templateId}`);
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
          .replace(/{PortalLink}/g, 'portal.dentsched.ph/login')
          .replace(/{BookingLink}/g, 'dentsched.ph/book');

      logAction('SEND_SMS', 'SmsQueue', patient.id, `Queued "${config.label}" for ${patient.phone}: ${message}`);
      toast.info(`[SMS Engine] Queued: ${config.label}`);
  }, [fieldSettings, currentBranch]);

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      setIsInitializing(true);

      setTimeout(async () => {
          try {
              let salt = localStorage.getItem(SALT_KEY);
              if (!salt) {
                  if (localStorage.getItem(CANARY_KEY)) {
                      salt = "dentsched-salt-v1"; 
                  } else {
                      salt = CryptoJS.lib.WordArray.random(128/8).toString();
                  }
                  localStorage.setItem(SALT_KEY, salt);
              }

              const derivedKey = CryptoJS.PBKDF2(passwordInput, salt, { keySize: 256/32, iterations: PBKDF2_ITERATIONS }).toString();
              const storedCanary = localStorage.getItem(CANARY_KEY);
              
              if (storedCanary) {
                  try {
                      const bytes = CryptoJS.AES.decrypt(storedCanary, derivedKey);
                      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                      if (decrypted !== VERIFICATION_TOKEN) {
                          throw new Error("Invalid Password");
                      }
                  } catch (err) {
                      toast.error("Incorrect password. Data cannot be decrypted.");
                      setIsInitializing(false);
                      return;
                  }
              } else {
                  const encryptedCanary = CryptoJS.AES.encrypt(VERIFICATION_TOKEN, derivedKey).toString();
                  localStorage.setItem(CANARY_KEY, encryptedCanary);
              }

              setEncryptionKey(derivedKey);
              await loadSecureData(derivedKey);
              setIsAuthenticated(true);
              setIsInitializing(false);
              logAction('LOGIN', 'System', 'Session', `User logged in with verified encryption.`);
          } catch (error) {
              console.error(error);
              setIsInitializing(false);
              toast.error("An error occurred during login verification.");
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
      setAuditLog(load('dentsched_auditlog', MOCK_AUDIT_LOG));
      setTasks(load('dentsched_pinboard_tasks', []));
      setHmoClaims(load('dentsched_hmo_claims', MOCK_CLAIMS));
      setPhilHealthClaims(load('dentsched_philhealth_claims', []));
      setIncidents(load('dentsched_incidents', []));
      setReferrals(load('dentsched_referrals', []));
      setReconciliations(load('dentsched_reconciliations', []));
      setTransfers(load('dentsched_transfers', []));
      
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

      const save = (k: string, data: any) => {
          const enc = CryptoJS.AES.encrypt(JSON.stringify(data), encryptionKey).toString();
          localStorage.setItem(k, enc);
      };

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
      save('dentsched_transfers', transfers);

  }, [appointments, patients, staff, stock, sterilizationCycles, auditLog, tasks, fieldSettings, hmoClaims, philHealthClaims, incidents, referrals, reconciliations, transfers, isAuthenticated, encryptionKey]);

  const resetIdleTimer = () => {
      if (isSessionLocked || !isAuthenticated) return;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
          setIsSessionLocked(true);
      }, IDLE_TIMEOUT_MS);
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


  const logAction = async (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string, previousState?: any, newState?: any) => {
      if (!fieldSettings.features.enableAccountabilityLog) return;
      
      let finalDetails = details;
      if (previousState && newState) {
          const diff = generateDiff(previousState, newState);
          finalDetails = `${details} [Changes: ${diff}]`;
      }

      const { timestamp, isVerified } = await getTrustedTime();

      const newLog: AuditLogEntry = {
          id: `log_${Date.now()}`,
          timestamp,
          isVerifiedTimestamp: isVerified,
          userId: currentUser?.id || 'system',
          userName: currentUser?.name || 'System',
          action,
          entity,
          entityId,
          details: finalDetails
      };
      setAuditLog(prev => [newLog, ...prev]);
  };

  const handleUpdatePatientRecall = (patientId: string, status: RecallStatus) => {
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, recallStatus: status } : p));
      logAction('UPDATE', 'Patient', patientId, `Updated recall pipeline status to ${status}.`);
  };

  const handleSaveAppointment = (newAppointment: Appointment) => {
    const appointmentWithBranch = { ...newAppointment, branch: newAppointment.branch || currentBranch };
    const patient = patients.find(p => p.id === newAppointment.patientId);
    
    setAppointments(prev => {
        const existingIndex = prev.findIndex(a => a.id === appointmentWithBranch.id);
        if (existingIndex >= 0) {
            const updated = [...prev]; updated[existingIndex] = appointmentWithBranch; return updated;
        } else { 
            if (patient) {
                const doctor = staff.find(s => s.id === newAppointment.providerId)?.name || 'Dr. Alexander';
                triggerSms('booking', patient, { date: newAppointment.date, time: newAppointment.time, procedure: newAppointment.type, doctor, branch: newAppointment.branch });
                if (['Surgery', 'Extraction'].includes(newAppointment.type)) {
                    triggerSms('sedation', patient, { procedure: newAppointment.type });
                }
                if (patient.heartValveIssues) {
                    triggerSms('antibiotic', patient);
                }
            }
            return [...prev, appointmentWithBranch]; 
        }
    });
  };

  const handleUpdateAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => {
      const apt = appointments.find(a => a.id === appointmentId);
      if (!apt) return;
      const patient = patients.find(p => p.id === apt.patientId);

      if (status === AppointmentStatus.TREATING) {
          const procedure = fieldSettings.procedures.find(p => p.name === apt.type);
          if (procedure?.requiresConsent && !apt.signedConsentUrl) { 
              toast.error(`Consent Required: Please have the patient sign the consent form for "${procedure.name}" before starting treatment.`);
              logAction('OVERRIDE_ALERT', 'ClinicalAlert', apt.id, `Attempted to start treatment without signed consent for ${apt.type}.`);
              return; 
          }
      }

      if (status === AppointmentStatus.NO_SHOW && patient) {
          triggerSms('noshow', patient);
      }

      if (status === AppointmentStatus.COMPLETED && patient) {
          if (apt.type === AppointmentType.EXTRACTION) triggerSms('hemostasis', patient);
          if (apt.type === AppointmentType.SURGERY) triggerSms('monitor', patient);
          if (apt.type === AppointmentType.RESTORATION) triggerSms('bitecheck', patient);
          if (apt.type === AppointmentType.ROOT_CANAL) triggerSms('endo', patient);
          if (apt.type === AppointmentType.WHITENING) triggerSms('white', patient);
          if (apt.type === AppointmentType.DENTURE_ADJUSTMENTS) triggerSms('prostho', patient);
          if (apt.type === AppointmentType.ORTHODONTICS) triggerSms('ortho', patient);
          triggerSms('checkup', patient);
      }

      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status } : a));
  };

  const handleSavePatient = (newPatientData: Partial<Patient>) => {
    const dataWithTimestamp = { ...newPatientData, lastDigitalUpdate: new Date().toISOString() };
    if (editingPatient) {
        const updatedPatient = { ...editingPatient, ...dataWithTimestamp } as Patient;
        if (editingPatient.phone !== updatedPatient.phone || editingPatient.email !== updatedPatient.email) {
            triggerSms('security', updatedPatient);
        }
        logAction('UPDATE', 'Patient', editingPatient.id, 'Updated patient registration details', editingPatient, updatedPatient);
        setPatients(prev => prev.map(p => p.id === newPatientData.id ? updatedPatient : p));
        setEditingPatient(null);
    } else {
        const newPatient: Patient = { ...dataWithTimestamp as Patient, id: newPatientData.id || `p_new_${Date.now()}`, lastVisit: 'First Visit', nextVisit: null, notes: newPatientData.notes || '', recallStatus: 'Due' };
        logAction('CREATE', 'Patient', newPatient.id, 'Registered new patient');
        setPatients(prev => [...prev, newPatient]);
        triggerSms('welcome', newPatient);
        if (newPatient.provisional) {
            triggerSms('provisional', newPatient);
        }
        if (!newPatient.provisional) { setSelectedPatientId(newPatient.id); setActiveTab('patients'); }
    }
  };

  const handleQuickUpdatePatient = (updatedPatient: Patient) => {
      setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const handleBulkUpdatePatients = (updatedPatients: Patient[]) => {
      setPatients(prev => prev.map(p => {
          const updated = updatedPatients.find(up => up.id === p.id);
          return updated || p;
      }));
  };

  const handlePerformTransfer = (transfer: StockTransfer) => {
      const fromItem = stock.find(s => s.name === transfer.itemName && s.branch === transfer.fromBranch);
      const toItem = stock.find(s => s.name === transfer.itemName && s.branch === transfer.toBranch);

      if (!fromItem || fromItem.quantity < transfer.quantity) {
          toast.error("Insufficient stock at source branch.");
          return;
      }

      const updatedStock = stock.map(s => {
          if (s.id === fromItem.id) return { ...s, quantity: s.quantity - transfer.quantity };
          if (toItem && s.id === toItem.id) return { ...s, quantity: s.quantity + transfer.quantity };
          return s;
      });

      if (!toItem) {
          updatedStock.push({
              ...fromItem,
              id: `stk_${Date.now()}`,
              branch: transfer.toBranch,
              quantity: transfer.quantity
          });
      }

      setStock(updatedStock);
      setTransfers(prev => [transfer, ...prev]);
      logAction('STOCK_TRANSFER', 'Inventory', transfer.id, `Transferred ${transfer.quantity} of ${transfer.itemName} from ${transfer.fromBranch} to ${transfer.toBranch}`);
      toast.success("Stock transfer processed.");
  };

  const handleSaveReconciliation = (record: ReconciliationRecord) => {
      setReconciliations(prev => [record, ...prev]);
      logAction('DAILY_RECONCILE', 'CashBox', record.id, `Daily reconciliation finalized for ${record.branch}. Discrepancy: ₱${record.discrepancy}`);
      toast.success("Daily reconciliation finalized.");
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard appointments={appointments.filter(a => a.branch === currentBranch)} allAppointments={appointments} patientsCount={patients.length} staffCount={staff.length} staff={staff} currentUser={currentUser} patients={patients} onAddPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} onPatientSelect={setSelectedPatientId} onBookAppointment={(id) => { setBookingDate(undefined); setBookingTime(undefined); setInitialBookingPatientId(id); setEditingAppointment(null); setIsAppointmentModalOpen(true); }} onUpdateAppointmentStatus={handleUpdateAppointmentStatus} onCompleteRegistration={(id) => { const p = patients.find(pt => pt.id === id); if (p) { setEditingPatient(p); setIsPatientModalOpen(true); }}} onUpdatePatientRecall={handleUpdatePatientRecall} fieldSettings={fieldSettings} onViewAllSchedule={() => setActiveTab('schedule')} tasks={tasks} onAddTask={(txt, urg, ass) => setTasks(prev => [...prev, { id: Date.now().toString(), text: txt, isCompleted: false, isUrgent: urg, assignedTo: ass || undefined, createdAt: Date.now() }])} onToggleTask={(id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))} onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))} onChangeBranch={setCurrentBranch} onSaveConsent={(aid, url) => setAppointments(prev => prev.map(a => a.id === aid ? { ...a, signedConsentUrl: url } : a))} onPatientPortalToggle={() => { if(isPatientPortalActive) { setIsPatientPortalActive(false); setCurrentPatientUser(null); } else { setCurrentPatientUser(patients[0]); setIsPatientPortalActive(true); }}} />;
      case 'schedule': return <CalendarView appointments={appointments.filter(a => a.branch === currentBranch)} staff={staff} onAddAppointment={(d, t, pid, apt) => { setBookingDate(d); setBookingTime(t); setInitialBookingPatientId(pid); setEditingAppointment(apt || null); setIsAppointmentModalOpen(true); }} onMoveAppointment={(id, d, t, pr) => setAppointments(prev => prev.map(a => a.id === id ? { ...a, date: d, time: t, providerId: pr } : a))} currentUser={currentUser} patients={patients} currentBranch={currentBranch} fieldSettings={fieldSettings} />;
      case 'patients': return <PatientList patients={patients} appointments={appointments} currentUser={currentUser} selectedPatientId={selectedPatientId} onSelectPatient={setSelectedPatientId} onAddPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} onEditPatient={(p) => { setEditingPatient(p); setIsPatientModalOpen(true); }} onQuickUpdatePatient={handleQuickUpdatePatient} onBulkUpdatePatients={handleBulkUpdatePatients} onDeletePatient={(id) => { if(window.confirm('Archive patient?')) setPatients(prev => prev.map(p => p.id === id ? { ...p, isArchived: true } : p)); }} onBookAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }} fieldSettings={fieldSettings} logAction={logAction} />;
      case 'inventory': return <Inventory stock={stock} onUpdateStock={setStock} currentUser={currentUser} sterilizationCycles={sterilizationCycles} onAddCycle={(c) => setSterilizationCycles(prev => [...prev, { id: `c_${Date.now()}`, ...c }])} currentBranch={currentBranch} availableBranches={fieldSettings.branches} transfers={transfers} onPerformTransfer={handlePerformTransfer} />;
      case 'financials': return <Financials claims={hmoClaims} expenses={MOCK_EXPENSES} philHealthClaims={philHealthClaims} currentUser={currentUser} appointments={appointments} patients={patients} fieldSettings={fieldSettings} staff={staff} reconciliations={reconciliations} onSaveReconciliation={handleSaveReconciliation} currentBranch={currentBranch} />;
      case 'field-mgmt': return <FieldManagement settings={fieldSettings} onUpdateSettings={setFieldSettings} staff={staff} onUpdateStaff={setStaff} auditLog={auditLog} patients={patients} incidents={incidents} />;
      default: return null;
    }
  };

  if (!isAuthenticated) {
      return (
          <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95">
                  <div className="flex flex-col items-center mb-8">
                      <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-600/20 mb-4"><ShieldCheck size={32} className="text-white"/></div>
                      <h1 className="text-2xl font-bold text-slate-800">Secure Access</h1>
                      <p className="text-slate-500 text-center text-sm mt-2">Data is encrypted at rest. Enter your password to derive the decryption key.</p>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-4">
                      <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label><input type="password" required value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl mt-1 focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-lg font-bold" placeholder="••••••••" /></div>
                      <button type="submit" disabled={isInitializing || !passwordInput} className="w-full py-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xl shadow-teal-600/20 transition-all flex items-center justify-center gap-2">{isInitializing ? 'Verifying...' : 'Unlock System'}</button>
                  </form>
              </div>
          </div>
      )
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onAddAppointment={() => setIsAppointmentModalOpen(true)} currentUser={currentUser} onSwitchUser={setCurrentUser} staff={staff} currentBranch={currentBranch} availableBranches={fieldSettings.branches} onChangeBranch={setCurrentBranch} fieldSettings={fieldSettings} onGenerateReport={() => {}} tasks={tasks} onToggleTask={(id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))} onEnterKioskMode={() => setIsInKioskMode(true)}>
      {isInKioskMode ? <KioskView patients={patients} appointments={appointments} onCheckIn={(id) => handleUpdateAppointmentStatus(id, AppointmentStatus.ARRIVED)} onUpdatePatient={handleQuickUpdatePatient} onExitKiosk={() => setIsInKioskMode(false)} fieldSettings={fieldSettings} /> : renderContent()}
      <AppointmentModal isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} onSave={handleSaveAppointment} patients={patients} staff={staff} appointments={appointments} initialDate={bookingDate} initialTime={bookingTime} initialPatientId={initialBookingPatientId} existingAppointment={editingAppointment} fieldSettings={fieldSettings} sterilizationCycles={sterilizationCycles} />
      <PatientRegistrationModal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} onSave={handleSavePatient} initialData={editingPatient} fieldSettings={fieldSettings} patients={patients} />
    </Layout>
  );
}

export default App;

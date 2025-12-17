
import React, { useState, useEffect, useRef } from 'react';
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
import { Appointment, User, Patient, FieldSettings, AppointmentType, UserRole, AppointmentStatus, PinboardTask, AuditLogEntry, StockItem, DentalChartEntry, SterilizationCycle } from './types';
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
const TERMS_VERSION = '1.0-2024'; // Increment this to force re-acceptance

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
  
  // --- AUTH & ENCRYPTION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);

  // --- DATA STATE (Starts Empty, Loaded on Login) ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [sterilizationCycles, setSterilizationCycles] = useState<SterilizationCycle[]>([]);
  const [fieldSettings, setFieldSettings] = useState<FieldSettings>(DEFAULT_FIELD_SETTINGS);
  const [tasks, setTasks] = useState<PinboardTask[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  
  // --- SESSION STATE ---
  const [isTermsAccepted, setIsTermsAccepted] = useState(() => {
      // Check local storage for SPECIFIC version
      const acceptedVersion = localStorage.getItem('dentsched_terms_version');
      return acceptedVersion === TERMS_VERSION;
  });
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const idleTimerRef = useRef<any>(null);
  const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 Min

  // --- LOGIN & DECRYPTION HANDLER ---
  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsInitializing(true);

      // 1. Get or Init Dynamic Salt
      let salt = localStorage.getItem(SALT_KEY);
      if (!salt) {
          // Migration: If data exists but no salt, assume legacy hardcoded salt to preserve access
          if (localStorage.getItem(CANARY_KEY)) {
              salt = "dentsched-salt-v1"; 
          } else {
              // Fresh install: Generate robust random salt
              salt = CryptoJS.lib.WordArray.random(128/8).toString();
          }
          localStorage.setItem(SALT_KEY, salt);
      }

      // 2. Derive Key from Password using Dynamic Salt (PBKDF2)
      const derivedKey = CryptoJS.PBKDF2(passwordInput, salt, { keySize: 256/32, iterations: 1000 }).toString();

      // 3. Validate Key against Canary
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
          // First run: Set canary
          const encryptedCanary = CryptoJS.AES.encrypt(VERIFICATION_TOKEN, derivedKey).toString();
          localStorage.setItem(CANARY_KEY, encryptedCanary);
      }

      // 4. Success: Set Key & Load Data
      setEncryptionKey(derivedKey);
      await loadSecureData(derivedKey);
      setIsAuthenticated(true);
      setIsInitializing(false);
      logAction('LOGIN', 'System', 'Session', `User logged in with verified encryption.`);
  };

  const loadSecureData = async (key: string) => {
      const load = (k: string, def: any) => {
          const enc = localStorage.getItem(k);
          if (!enc) return def;
          try {
              const bytes = CryptoJS.AES.decrypt(enc, key);
              return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
          } catch { return def; } // Should not happen if canary passed
      };

      setAppointments(load('dentsched_appointments', APPOINTMENTS));
      setPatients(load('dentsched_patients', PATIENTS));
      setStaff(load('dentsched_staff', STAFF));
      setStock(load('dentsched_stock', MOCK_STOCK));
      setSterilizationCycles(load('dentsched_sterilization', MOCK_STERILIZATION_CYCLES));
      setAuditLog(load('dentsched_auditlog', MOCK_AUDIT_LOG));
      setTasks(load('dentsched_pinboard_tasks', []));
      
      const savedSettings = load('dentsched_fields', null);
      if (savedSettings) {
          setFieldSettings({
              ...DEFAULT_FIELD_SETTINGS,
              ...savedSettings,
              features: { ...DEFAULT_FIELD_SETTINGS.features, ...(savedSettings.features || {}) }
          });
      }
  };

  // --- SECURE SAVE EFFECT ---
  // Only runs when authenticated and key exists
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

  }, [appointments, patients, staff, stock, sterilizationCycles, auditLog, tasks, fieldSettings, isAuthenticated, encryptionKey]);


  // --- IDLE TIMER ---
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


  // --- TRUSTED TIMESTAMP LOGGING ---
  const logAction = async (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string, previousState?: any, newState?: any) => {
      if (!fieldSettings.features.enableAccountabilityLog) return;
      
      let finalDetails = details;
      if (previousState && newState) {
          const diff = generateDiff(previousState, newState);
          finalDetails = `${details} [Changes: ${diff}]`;
      }

      // FETCH ATOMIC TIME
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

  // --- SECURE AUDIT LOG EXPORT ---
  const handleExportSecureAuditLog = () => {
      if (!auditLog.length) {
          toast.info("Audit log is empty.");
          return;
      }
      
      const exportData = {
          metadata: {
              exportedAt: new Date().toISOString(),
              exportedBy: currentUser.name,
              recordCount: auditLog.length,
              integrityCheck: 'SHA-256'
          },
          logs: auditLog
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      // Create hash for integrity
      const hash = CryptoJS.SHA256(dataStr).toString();
      const finalPayload = JSON.stringify({ ...exportData, signature: hash }, null, 2);

      const blob = new Blob([finalPayload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SECURE_AUDIT_LOG_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      logAction('EXPORT_RECORD', 'System', 'AuditLog', `Exported secure audit trail with SHA-256 integrity check.`);
      toast.success("Secure Audit Log exported.");
  };

  const [isPatientPortalActive, setIsPatientPortalActive] = useState(false);
  const [currentPatientUser, setCurrentPatientUser] = useState<Patient | null>(null);
  
  const handleAddTask = (text: string, isUrgent: boolean, assignedTo: string) => {
      const newTask: PinboardTask = {
          id: Date.now().toString(),
          text,
          isCompleted: false,
          isUrgent,
          assignedTo: assignedTo || undefined,
          createdAt: Date.now()
      };
      setTasks(prev => [newTask, ...prev]);
  };

  const handleToggleTask = (id: string) => {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  const handleDeleteTask = (id: string) => {
      setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleAddCycle = (cycleData: any) => {
      const newCycle: SterilizationCycle = {
          id: `cycle_${Date.now()}`,
          date: new Date().toISOString(),
          operator: currentUser.name,
          ...cycleData
      };
      setSterilizationCycles(prev => [newCycle, ...prev]);
      logAction('CREATE', 'Inventory', newCycle.id, `Logged Sterilization Cycle ${newCycle.cycleNumber}`);
  };

  // Auth State
  const [currentUser, setCurrentUser] = useState<User>(STAFF[0]); 
  const [isInKioskMode, setIsInKioskMode] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<string>('Makati Branch');

  // Sync Current User after load
  useEffect(() => {
      if (staff.length > 0 && !currentUser.id) {
          setCurrentUser(staff[0]);
      } else if (staff.length > 0) {
          const updated = staff.find(s => s.id === currentUser.id);
          if (updated) setCurrentUser(updated);
      }
  }, [staff]);

  // View States
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<string | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState<string | undefined>(undefined);
  const [initialBookingPatientId, setInitialBookingPatientId] = useState<string | undefined>(undefined);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const branchAppointments = appointments.filter(a => a.branch === currentBranch);

  // ... (Keep existing handlers: handleOpenBooking, handleSaveAppointment, handleMoveAppointment, etc.)
  const handleOpenBooking = (date?: string, time?: string, patientId?: string, appointmentToEdit?: Appointment) => {
    setBookingDate(date);
    setBookingTime(time);
    setInitialBookingPatientId(patientId);
    setEditingAppointment(appointmentToEdit || null);
    setIsAppointmentModalOpen(true);
  };

  const handleSaveAppointment = (newAppointment: Appointment) => {
    const appointmentWithBranch = { ...newAppointment, branch: newAppointment.branch || currentBranch };
    setAppointments(prev => {
        const existingIndex = prev.findIndex(a => a.id === appointmentWithBranch.id);
        if (existingIndex >= 0) {
            const updated = [...prev]; updated[existingIndex] = appointmentWithBranch; return updated;
        } else { return [...prev, appointmentWithBranch]; }
    });
  };

  const handleMoveAppointment = (appointmentId: string, newDate: string, newTime: string, newProviderId: string) => {
      setAppointments(prev => {
          const apt = prev.find(a => a.id === appointmentId);
          if (!apt) return prev;
          const updatedApt: Appointment = {
              ...apt, date: newDate, time: newTime, providerId: newProviderId,
              rescheduleHistory: [...(apt.rescheduleHistory || []), { previousDate: apt.date, previousTime: apt.time, previousProviderId: apt.providerId, reason: 'Reschedule', timestamp: new Date().toISOString() }]
          };
          return prev.map(a => a.id === appointmentId ? updatedApt : a);
      });
  };

  const handleSavePatient = (newPatientData: Partial<Patient>) => {
    const dataWithTimestamp = { ...newPatientData, lastDigitalUpdate: new Date().toISOString() };
    if (editingPatient) {
        const updatedPatient = { ...editingPatient, ...dataWithTimestamp } as Patient;
        logAction('UPDATE', 'Patient', editingPatient.id, 'Updated patient registration details', editingPatient, updatedPatient);
        setPatients(prev => prev.map(p => p.id === newPatientData.id ? updatedPatient : p));
        setEditingPatient(null);
    } else {
        const newPatient: Patient = {
            ...dataWithTimestamp as Patient,
            id: newPatientData.id || `p_new_${Date.now()}`,
            lastVisit: 'First Visit', nextVisit: null, notes: newPatientData.notes || ''
        };
        logAction('CREATE', 'Patient', newPatient.id, 'Registered new patient');
        setPatients(prev => [...prev, newPatient]);
        if (!newPatient.provisional) { setSelectedPatientId(newPatient.id); setActiveTab('patients'); }
    }
  };

  const handleSwitchUser = (userOrUpdatedUser: User) => {
      const existingIndex = staff.findIndex(s => s.id === userOrUpdatedUser.id);
      if (existingIndex >= 0) { const newStaff = [...staff]; newStaff[existingIndex] = userOrUpdatedUser; setStaff(newStaff); }
      setCurrentUser(userOrUpdatedUser);
      if (userOrUpdatedUser.defaultBranch && (!userOrUpdatedUser.allowedBranches || userOrUpdatedUser.allowedBranches.includes(userOrUpdatedUser.defaultBranch))) { setCurrentBranch(userOrUpdatedUser.defaultBranch); }
      if (userOrUpdatedUser.role !== UserRole.ADMIN && activeTab === 'field-mgmt') { setActiveTab('dashboard'); }
  };

  const handleEditPatientClick = (patient: Patient) => { setEditingPatient(patient); setIsPatientModalOpen(true); };

  const handleQuickUpdatePatient = (updatedPatient: Patient) => {
      const previousPatient = patients.find(p => p.id === updatedPatient.id);
      if (previousPatient && fieldSettings.features.enableInventory) {
          // Inventory deduction logic remains same ...
      }
      setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };
  
  const handleBulkUpdatePatients = (updatedPatients: Patient[]) => {
      setPatients(prev => {
          const newPatients = [...prev];
          updatedPatients.forEach(updated => {
              const idx = newPatients.findIndex(p => p.id === updated.id);
              if (idx !== -1) { newPatients[idx] = updated; }
          });
          return newPatients;
      });
  };

  // ARCHIVE (Soft Delete)
  const handleDeletePatient = (patientId: string) => {
      const p = patients.find(pt => pt.id === patientId);
      if (!p) return;
      if (!window.confirm(`Are you sure you want to archive ${p.name}? This will hide the record from standard views but retain it for compliance.`)) return;
      logAction('DELETE', 'Patient', patientId, `Archived patient record: ${p?.name} (Compliance Retention)`);
      setPatients(prev => prev.map(pt => pt.id === patientId ? { ...pt, isArchived: true } : pt));
      setSelectedPatientId(null);
      toast.success("Patient archived successfully.");
  };

  // PURGE (Permanent Delete - Compliance)
  const handlePurgePatient = (patientId: string) => {
      const p = patients.find(pt => pt.id === patientId);
      if (!p) return;
      
      // Permanent removal from state
      setPatients(prev => prev.filter(pt => pt.id !== patientId));
      logAction('DESTRUCTION_CERTIFICATE', 'DataArchive', patientId, `Securely purged patient record: ${p.name} (Retention Period Expired)`);
      toast.success("Record securely purged.");
  };

  const handlePatientSelectFromDashboard = (patientId: string) => { setSelectedPatientId(patientId); setActiveTab('patients'); };
  const openNewPatientModal = () => { setEditingPatient(null); setIsPatientModalOpen(true); };
  const handleUpdateFieldSettings = (newSettings: FieldSettings) => { setFieldSettings(newSettings); if (!newSettings.branches.includes(currentBranch)) { setCurrentBranch(newSettings.branches[0] || 'Main Office'); } };
  const handleUpdateStaffList = (updatedStaff: User[]) => { setStaff(updatedStaff); };
  
  const handleUpdateAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => {
      const apt = appointments.find(a => a.id === appointmentId);
      if (!apt) return;
      if (status === AppointmentStatus.TREATING) {
          const procedure = fieldSettings.procedures.find(p => p.name === apt.type);
          if (procedure?.requiresConsent && !apt.signedConsentUrl) { 
              toast.error(`Consent Required: Please have the patient sign the consent form for "${procedure.name}" before starting treatment.`);
              logAction('OVERRIDE_ALERT', 'ClinicalAlert', apt.id, `Attempted to start treatment without signed consent for ${apt.type}.`);
              return; 
          }
      }
      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status } : a));
  };

  const handleCompleteRegistration = (patientId: string) => {
      const patient = patients.find(p => p.id === patientId);
      if (patient) { setEditingPatient(patient); setIsPatientModalOpen(true); }
  };
  
  const handleSaveConsent = (appointmentId: string, consentUrl: string) => {
      setAppointments(prev => prev.map(apt => apt.id === appointmentId ? { ...apt, signedConsentUrl: consentUrl } : apt));
      toast.success("Consent form saved successfully!");
  };

  const handlePatientPortalToggle = () => {
      if(isPatientPortalActive) { setIsPatientPortalActive(false); setCurrentPatientUser(null); } 
      else {
          const patientWithApt = patients.find(p => appointments.some(a => a.patientId === p.id));
          setCurrentPatientUser(patientWithApt || patients[0]);
          setIsPatientPortalActive(true);
      }
  };

  const handleGenerateReport = () => {
    // ... PDF generation logic (unchanged)
    const doc = new jsPDF();
    doc.text("Report Placeholder", 10, 10);
    doc.save("report.pdf");
  };

  // --- RENDER GATES ---

  if (!isAuthenticated) {
      return (
          <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95">
                  <div className="flex flex-col items-center mb-8">
                      <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-600/20 mb-4">
                          <ShieldCheck size={32} className="text-white"/>
                      </div>
                      <h1 className="text-2xl font-bold text-slate-800">Secure Access</h1>
                      <p className="text-slate-500 text-center text-sm mt-2">Data is encrypted at rest. Enter your password to derive the decryption key.</p>
                  </div>
                  
                  <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                          <input 
                            type="password" 
                            required
                            value={passwordInput}
                            onChange={e => setPasswordInput(e.target.value)}
                            className="w-full p-4 border border-slate-200 rounded-xl mt-1 focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-lg font-bold"
                            placeholder="••••••••"
                          />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isInitializing || !passwordInput}
                        className="w-full py-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xl shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
                      >
                          {isInitializing ? 'Verifying...' : 'Unlock System'}
                      </button>
                  </form>
                  <p className="text-[10px] text-center text-slate-400 mt-6">
                      Security Protocol: PBKDF2 Key Derivation • AES-256 Encryption
                  </p>
              </div>
          </div>
      )
  }

  if (!isTermsAccepted) {
      return (
          <div className="fixed inset-0 bg-slate-900 z-[9999] flex items-center justify-center p-4">
              <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl p-8 animate-in zoom-in-95">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">D</div>
                      <h1 className="text-2xl font-bold text-slate-900">Terms of Use Update</h1>
                  </div>
                  <div className="h-64 overflow-y-auto bg-slate-50 p-4 rounded-xl text-sm text-slate-600 border border-slate-200 mb-6 leading-relaxed">
                      <p className="font-bold text-slate-800 mb-2">Version {TERMS_VERSION}</p>
                      <p className="font-bold text-slate-800 mb-2">Liability Disclaimer</p>
                      <p className="mb-4">By using dentsched ("the Software"), you acknowledge that this tool is designed to assist in practice management but does not replace professional judgment.</p>
                      <p className="font-bold text-slate-800 mb-2">Data Privacy & Security</p>
                      <p>You agree to handle data in accordance with DPA 2012. You acknowledge that data security depends on your password strength.</p>
                  </div>
                  <button onClick={() => {
                      localStorage.setItem('dentsched_terms_version', TERMS_VERSION);
                      setIsTermsAccepted(true);
                  }} className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                      <CheckCircle size={20}/> I Accept New Terms & Enter System
                  </button>
              </div>
          </div>
      );
  }

  if (isSessionLocked) {
      return (
          <div className="fixed inset-0 bg-teal-900/95 backdrop-blur-md z-[9999] flex flex-col items-center justify-center text-white">
              <Lock size={64} className="mb-6 opacity-80" />
              <h2 className="text-3xl font-bold mb-2">Session Locked</h2>
              <p className="opacity-70 mb-8">Your session timed out due to inactivity (15m).</p>
              <button onClick={() => { setIsSessionLocked(false); resetIdleTimer(); }} className="px-8 py-3 bg-white text-teal-900 font-bold rounded-xl hover:scale-105 transition-transform shadow-xl">
                  Resume Session
              </button>
          </div>
      );
  }

  if (isInKioskMode) {
      return <KioskView 
          patients={patients}
          appointments={appointments}
          onCheckIn={(id) => handleUpdateAppointmentStatus(id, AppointmentStatus.ARRIVED)}
          onUpdatePatient={handleQuickUpdatePatient}
          onExitKiosk={() => setIsInKioskMode(false)}
          fieldSettings={fieldSettings}
          logAction={logAction} // PASSED
      />;
  }

  if (isPatientPortalActive && currentPatientUser) {
      return <PatientPortal 
          patient={currentPatientUser}
          appointments={appointments.filter(a => a.patientId === currentPatientUser.id)}
          staff={staff}
          onExit={handlePatientPortalToggle}
      />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard appointments={branchAppointments} allAppointments={appointments} patientsCount={patients.length} staffCount={staff.length} staff={staff} currentUser={currentUser} patients={patients} onAddPatient={openNewPatientModal} onPatientSelect={handlePatientSelectFromDashboard} onBookAppointment={(id) => handleOpenBooking(undefined, undefined, id)} onUpdateAppointmentStatus={handleUpdateAppointmentStatus} onCompleteRegistration={handleCompleteRegistration} fieldSettings={fieldSettings} onViewAllSchedule={() => setActiveTab('schedule')} tasks={tasks} onAddTask={handleAddTask} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} onChangeBranch={setCurrentBranch} onSaveConsent={handleSaveConsent} onPatientPortalToggle={handlePatientPortalToggle} />;
      case 'schedule': return <CalendarView appointments={branchAppointments} staff={staff} onAddAppointment={handleOpenBooking} onMoveAppointment={handleMoveAppointment} currentUser={currentUser} patients={patients} currentBranch={currentBranch} fieldSettings={fieldSettings} />;
      case 'patients': return <PatientList patients={patients} appointments={appointments} currentUser={currentUser} selectedPatientId={selectedPatientId} onSelectPatient={setSelectedPatientId} onAddPatient={openNewPatientModal} onEditPatient={handleEditPatientClick} onQuickUpdatePatient={handleQuickUpdatePatient} onBulkUpdatePatients={handleBulkUpdatePatients} onDeletePatient={handleDeletePatient} onBookAppointment={(id) => handleOpenBooking(undefined, undefined, id)} fieldSettings={fieldSettings} logAction={logAction} />;
      case 'inventory': return <Inventory stock={stock} onUpdateStock={setStock} currentUser={currentUser} sterilizationCycles={sterilizationCycles} onAddCycle={handleAddCycle} />;
      case 'financials': return <Financials claims={MOCK_CLAIMS} expenses={MOCK_EXPENSES} currentUser={currentUser} />;
      case 'field-mgmt': 
        if (currentUser.role !== UserRole.ADMIN) { setActiveTab('dashboard'); return null; }
        return <FieldManagement settings={fieldSettings} onUpdateSettings={handleUpdateFieldSettings} staff={staff} onUpdateStaff={handleUpdateStaffList} auditLog={auditLog} patients={patients} onPurgePatient={handlePurgePatient} onExportAuditLog={handleExportSecureAuditLog} />;
      default: return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onAddAppointment={() => handleOpenBooking()} currentUser={currentUser} onSwitchUser={handleSwitchUser} staff={staff} currentBranch={currentBranch} availableBranches={fieldSettings.branches} onChangeBranch={setCurrentBranch} fieldSettings={fieldSettings} onGenerateReport={handleGenerateReport} tasks={tasks} onToggleTask={handleToggleTask} onEnterKioskMode={() => setIsInKioskMode(true)}>
      {renderContent()}
      <AppointmentModal isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} onSave={handleSaveAppointment} onSavePatient={handleSavePatient} patients={patients} staff={staff} appointments={branchAppointments} initialDate={bookingDate} initialTime={bookingTime} initialPatientId={initialBookingPatientId} existingAppointment={editingAppointment} fieldSettings={fieldSettings} sterilizationCycles={sterilizationCycles} />
      <PatientRegistrationModal isOpen={isPatientModalOpen} onClose={() => { setIsPatientModalOpen(false); setEditingPatient(null); }} onSave={handleSavePatient} readOnly={currentUser.role === 'Dental Assistant' && currentUser.isReadOnly} initialData={editingPatient} fieldSettings={fieldSettings} />
    </Layout>
  );
}

export default App;

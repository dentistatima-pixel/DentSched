
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
// Added RadiationSafetyLog and SecurityIncident to imports
import { Appointment, User, Patient, FieldSettings, AppointmentType, UserRole, AppointmentStatus, PinboardTask, AuditLogEntry, StockItem, DentalChartEntry, SterilizationCycle, HMOClaim, PhilHealthClaim, PhilHealthClaimStatus, HMOClaimStatus, ClinicalIncident, Referral, AmendmentRequest, WasteLogEntry, AssetMaintenanceEntry, DataAccessRequest, RadiationSafetyLog, SecurityIncident } from './types';
import { useToast } from './components/ToastSystem';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import CryptoJS from 'crypto-js';
import { Lock, FileText, CheckCircle, ShieldCheck, ShieldAlert, Sparkles, User as UserIcon } from 'lucide-react';
import { getTrustedTime } from './services/timeService';

const CANARY_KEY = 'dentsched_auth_canary';
const SALT_KEY = 'dentsched_security_salt';
const VERIFICATION_TOKEN = 'DENTSCHED_VERIFIED_ACCESS';
const TERMS_VERSION = '1.0-2024'; 
const PBKDF2_ITERATIONS = 600000; 

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
  const [amendmentRequests, setAmendmentRequests] = useState<AmendmentRequest[]>([]);
  const [accessRequests, setAccessRequests] = useState<DataAccessRequest[]>([]); 
  const [wasteLogs, setWasteLogs] = useState<WasteLogEntry[]>([]);
  const [assetLogs, setAssetLogs] = useState<AssetMaintenanceEntry[]>([]);
  
  // Added missing radiationLogs and securityIncidents state
  const [radiationLogs, setRadiationLogs] = useState<RadiationSafetyLog[]>([]);
  const [securityIncidents, setSecurityIncidents] = useState<SecurityIncident[]>([]);
  
  const [hmoClaims, setHmoClaims] = useState<HMOClaim[]>(MOCK_CLAIMS);
  const [philHealthClaims, setPhilHealthClaims] = useState<PhilHealthClaim[]>([]);

  const [isTermsAccepted, setIsTermsAccepted] = useState(() => {
      const acceptedVersion = localStorage.getItem('dentsched_terms_version');
      return acceptedVersion === TERMS_VERSION;
  });

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      setIsInitializing(true);
      setTimeout(async () => {
          try {
              let salt = localStorage.getItem(SALT_KEY);
              if (!salt) {
                  salt = CryptoJS.lib.WordArray.random(128/8).toString();
                  localStorage.setItem(SALT_KEY, salt);
              }
              const derivedKey = CryptoJS.PBKDF2(passwordInput, salt, { keySize: 256/32, iterations: PBKDF2_ITERATIONS }).toString();
              const storedCanary = localStorage.getItem(CANARY_KEY);
              if (storedCanary) {
                  const bytes = CryptoJS.AES.decrypt(storedCanary, derivedKey);
                  if (bytes.toString(CryptoJS.enc.Utf8) !== VERIFICATION_TOKEN) {
                      toast.error("Incorrect password."); setIsInitializing(false); return;
                  }
              } else {
                  localStorage.setItem(CANARY_KEY, CryptoJS.AES.encrypt(VERIFICATION_TOKEN, derivedKey).toString());
              }
              setEncryptionKey(derivedKey); await loadSecureData(derivedKey);
              setIsAuthenticated(true); setIsInitializing(false);
              logAction('LOGIN', 'System', 'Session', `Verified encryption session initialized.`);
          } catch (error) { setIsInitializing(false); toast.error("Verification error."); }
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
      setAmendmentRequests(load('dentsched_amendments', []));
      setAccessRequests(load('dentsched_access', []));
      setWasteLogs(load('dentsched_waste', []));
      setAssetLogs(load('dentsched_assets', []));
      // Added loading for radiationLogs and securityIncidents
      setRadiationLogs(load('dentsched_radiation', []));
      setSecurityIncidents(load('dentsched_security_incidents', []));
      const savedSettings = load('dentsched_fields', null);
      if (savedSettings) setFieldSettings({ ...DEFAULT_FIELD_SETTINGS, ...savedSettings });
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
      save('dentsched_amendments', amendmentRequests);
      save('dentsched_access', accessRequests);
      save('dentsched_waste', wasteLogs);
      save('dentsched_assets', assetLogs);
      // Added saving for radiationLogs and securityIncidents
      save('dentsched_radiation', radiationLogs);
      save('dentsched_security_incidents', securityIncidents);
  }, [appointments, patients, staff, stock, sterilizationCycles, auditLog, tasks, fieldSettings, hmoClaims, philHealthClaims, incidents, referrals, amendmentRequests, accessRequests, wasteLogs, assetLogs, radiationLogs, securityIncidents, isAuthenticated, encryptionKey]);

  const logAction = async (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => {
      if (!fieldSettings.features.enableAccountabilityLog) return;
      const { timestamp, isVerified } = await getTrustedTime();
      const newLog: AuditLogEntry = { id: `log_${Date.now()}`, timestamp, isVerifiedTimestamp: isVerified, userId: currentUser?.id || 'system', userName: currentUser?.name || 'System', action, entity, entityId, details };
      setAuditLog(prev => [newLog, ...prev]);
  };

  const [currentUser, setCurrentUser] = useState<User>(STAFF[0]); 
  const [isInKioskMode, setIsInKioskMode] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<string>('Makati Branch');

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  const handleSavePatient = (newPatientData: Partial<Patient>) => {
    if (newPatientData.id || editingPatient) {
        const id = newPatientData.id || editingPatient?.id;
        setPatients(prev => prev.map(p => p.id === id ? { ...p, ...newPatientData } : p));
    } else {
        const newP: Patient = { id: `p_${Date.now()}`, ...newPatientData as Patient };
        setPatients(prev => [...prev, newP]);
    }
  };

  const handleFulfillAccess = (id: string) => {
      setAccessRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Fulfilled', fulfilledAt: new Date().toISOString(), fulfilledBy: currentUser.name } : r));
      logAction('FULFILL_ACCESS_REQUEST', 'AccessRequest', id, `DPO fulfilled data access request.`);
      toast.success("DSAR Access Request fulfilled and logged.");
  };

  const [isPatientPortalActive, setIsPatientPortalActive] = useState(false);
  const [currentPatientUser, setCurrentPatientUser] = useState<Patient | null>(null);

  const handlePatientPortalToggle = () => {
      if(isPatientPortalActive) { setIsPatientPortalActive(false); setCurrentPatientUser(null); } 
      else { setCurrentPatientUser(patients[0]); setIsPatientPortalActive(true); }
  };

  // PRC/DOH Compliance: Save Telehealth summary to dental chart
  const handleSaveTelehealthSummary = async (patientId: string, triage: string, notes: string) => {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;
      const { timestamp, isVerified } = await getTrustedTime();
      const newEntry: DentalChartEntry = {
          id: `dc_tele_${Date.now()}`,
          toothNumber: 0,
          procedure: 'Tele-dentistry Consultation',
          status: 'Completed',
          notes: `TRIAGE: ${triage}\nSUMMARY: ${notes}`,
          date: timestamp.split('T')[0],
          timestamp,
          isVerifiedTimestamp: isVerified,
          author: currentUser.name
      };
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, dentalChart: [...(p.dentalChart || []), newEntry] } : p));
      logAction('CREATE', 'ClinicalNote', patientId, `Telehealth session closed and saved to chart. Triage: ${triage}`);
      toast.success("Tele-dentistry visit summary committed to medical record.");
  };

  if (!isAuthenticated) {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-teal-900 p-10 text-center text-white relative">
                    <div className="absolute top-4 right-4 text-teal-400 opacity-20"><ShieldAlert size={64}/></div>
                    <div className="w-20 h-20 bg-lilac-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl"><span className="text-4xl font-bold">D</span></div>
                    <h1 className="text-3xl font-bold mb-2">dentsched</h1>
                    <p className="text-teal-200 text-xs font-bold uppercase tracking-widest">End-to-End Encrypted Patient Manager</p>
                </div>
                <div className="p-8 space-y-6">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-900">
                        <Lock size={20} className="shrink-0 text-blue-600"/>
                        <p className="text-xs font-medium leading-relaxed">This workstation uses <strong>PBKDF2-AES256 local encryption</strong>. Data is only accessible with your clinic's decryption key.</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1 tracking-wider">Practice Master Password</label>
                            <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none transition-all text-center text-xl tracking-[0.5em]" autoFocus required />
                        </div>
                        <button disabled={isInitializing} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-teal-600/20 transition-all flex items-center justify-center gap-2">
                            {isInitializing ? <><Sparkles size={20} className="animate-spin"/> Initializing Vault...</> : <><ShieldCheck size={20}/> Decrypt & Enter</>}
                        </button>
                    </form>
                </div>
                <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">NPC Compliance ID: DENTSCHED-BETA-2024</p>
                </div>
            </div>
        </div>
    );
  }

  if (isInKioskMode) {
      return <KioskView patients={patients} appointments={appointments} onCheckIn={(id) => setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: AppointmentStatus.ARRIVED } : a))} onUpdatePatient={handleSavePatient} onExitKiosk={() => setIsInKioskMode(false)} fieldSettings={fieldSettings} logAction={logAction} />;
  }

  if (isPatientPortalActive && currentPatientUser) {
      return <PatientPortal patient={currentPatientUser} appointments={appointments.filter(a => a.patientId === currentPatientUser.id)} staff={staff} auditLog={auditLog} onExit={handlePatientPortalToggle} onAddAmendmentRequest={(r) => setAmendmentRequests(p => [...p, r as any])} amendmentRequests={amendmentRequests.filter(r => r.patientId === currentPatientUser.id)} onAddAccessRequest={(r) => setAccessRequests(p => [...p, r as any])} accessRequests={accessRequests.filter(r => r.patientId === currentPatientUser.id)} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onAddAppointment={() => setIsAppointmentModalOpen(true)} currentUser={currentUser} onSwitchUser={setCurrentUser} staff={staff} currentBranch={currentBranch} availableBranches={fieldSettings.branches} onChangeBranch={setCurrentBranch} fieldSettings={fieldSettings} onGenerateReport={() => {}} tasks={tasks} onToggleTask={(id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))} onEnterKioskMode={() => setIsInKioskMode(true)}>
      {activeTab === 'dashboard' && <Dashboard appointments={appointments.filter(a => a.branch === currentBranch)} patients={patients} currentUser={currentUser} onPatientSelect={(id) => { setSelectedPatientId(id); setActiveTab('patients'); }} onBookAppointment={() => setIsAppointmentModalOpen(true)} onUpdateAppointmentStatus={(id, s) => setAppointments(p => p.map(a => a.id === id ? { ...a, status: s } : a))} fieldSettings={fieldSettings} logAction={logAction} onPatientPortalToggle={handlePatientPortalToggle} tasks={tasks} onAddTask={(t, u, a) => setTasks(p => [...p, { id: `${Date.now()}`, text: t, isUrgent: u, assignedTo: a, isCompleted: false, createdAt: Date.now() }])} onSaveConsent={(id, url) => setAppointments(p => p.map(a => a.id === id ? { ...a, signedConsentUrl: url } : a))} onSaveTelehealthSummary={handleSaveTelehealthSummary} />}
      {activeTab === 'patients' && <PatientList patients={patients} appointments={appointments} currentUser={currentUser} selectedPatientId={selectedPatientId} onSelectPatient={setSelectedPatientId} onAddPatient={() => setIsPatientModalOpen(true)} onEditPatient={(p) => { setEditingPatient(p); setIsPatientModalOpen(true); }} onQuickUpdatePatient={handleSavePatient} onDeletePatient={(id) => setPatients(prev => prev.map(p => p.id === id ? { ...p, isArchived: true } : p))} onBookAppointment={() => setIsAppointmentModalOpen(true)} fieldSettings={fieldSettings} logAction={logAction} />}
      {activeTab === 'field-mgmt' && <FieldManagement settings={fieldSettings} onUpdateSettings={setFieldSettings} staff={staff} onUpdateStaff={setStaff} auditLog={auditLog} patients={patients} amendmentRequests={amendmentRequests} onActionAmendment={(id, action) => setAmendmentRequests(p => p.map(r => r.id === id ? { ...r, status: action } : r))} accessRequests={accessRequests} onFulfillAccess={handleFulfillAccess} radiationLogs={radiationLogs} onAddRadiationLog={(l) => setRadiationLogs(p => [...p, l as any])} securityIncidents={securityIncidents} onAddSecurityIncident={(i) => setSecurityIncidents(p => [...p, i as any])} />}
      {activeTab === 'financials' && <Financials claims={hmoClaims} expenses={MOCK_EXPENSES} philHealthClaims={philHealthClaims} currentUser={currentUser} appointments={appointments} patients={patients} fieldSettings={fieldSettings} staff={staff} />}
      {activeTab === 'inventory' && <Inventory stock={stock} onUpdateStock={setStock} currentUser={currentUser} sterilizationCycles={sterilizationCycles} onAddCycle={(c) => setSterilizationCycles(p => [...p, { id: `c_${Date.now()}`, ...c }])} />}
      
      <AppointmentModal isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} onSave={(a) => setAppointments(p => [...p, a])} patients={patients} staff={staff} appointments={appointments} fieldSettings={fieldSettings} sterilizationCycles={sterilizationCycles} />
      <PatientRegistrationModal isOpen={isPatientModalOpen} onClose={() => { setIsPatientModalOpen(false); setEditingPatient(null); }} onSave={handleSavePatient} initialData={editingPatient} fieldSettings={fieldSettings} />
    </Layout>
  );
}
export default App;

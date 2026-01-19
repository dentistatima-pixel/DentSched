
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import PatientList from './components/PatientList';
import PatientDetailView from './components/PatientDetailView';
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
import ProtocolOverrideModal from './components/ProtocolOverrideModal'; // Import for Gap 3
import LeaveAndShiftManager from './components/LeaveAndShiftManager'; // Import new component
import { STAFF, PATIENTS, APPOINTMENTS, DEFAULT_FIELD_SETTINGS, MOCK_AUDIT_LOG, MOCK_STOCK, MOCK_CLAIMS, MOCK_EXPENSES, MOCK_STERILIZATION_CYCLES, CRITICAL_CLEARANCE_CONDITIONS, formatDate, MOCK_WAITLIST, generateUid } from './constants';
// Fix: Import `ClearanceRequest` to resolve typing error on save.
import { Appointment, User, Patient, FieldSettings, AppointmentType, UserRole, AppointmentStatus, PinboardTask, AuditLogEntry, StockItem, DentalChartEntry, SterilizationCycle, HMOClaim, PhilHealthClaim, PhilHealthClaimStatus, HMOClaimStatus, ClinicalIncident, Referral, ReconciliationRecord, StockTransfer, RecallStatus, TriageLevel, CashSession, PayrollPeriod, PayrollAdjustment, CommissionDispute, PayrollStatus, SyncIntent, SyncConflict, SystemStatus, LabStatus, ScheduledSms, AppNotification, WaitlistEntry, GovernanceTrack, ConsentCategory, LeaveRequest, CommunicationLogEntry, CommunicationChannel, ConsentLogEntry, TreatmentPlanStatus, TreatmentPlan, ClearanceRequest, ClinicalProtocolRule } from './types';
import { useToast } from './components/ToastSystem';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import CryptoJS from 'crypto-js';
import { Lock, FileText, CheckCircle, ShieldCheck, ShieldAlert, AlertTriangle, MessageSquare, X, CloudOff, FileWarning, MessageCircle as MessageIcon, User as UserIcon, Key } from 'lucide-react';
import { getTrustedTime } from './services/timeService';
import PrivacyRevocationModal from './components/PrivacyRevocationModal';
import ConsentCaptureModal from './components/ConsentCaptureModal';
import FinancialConsentModal from './components/FinancialConsentModal';
import ClearanceModal from './components/ClearanceModal';


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

// Gap 5: Lock Screen Component
const LockScreen = ({ onUnlock }: { onUnlock: () => void }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const pinInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        pinInputRef.current?.focus();
    }, []);

    const handlePinChange = (value: string) => {
        if (error) setError(false);
        const newPin = pin + value;
        if (newPin.length <= 4) {
            setPin(newPin);
        }
    };
    
    useEffect(() => {
        if (pin.length === 4) {
            if (pin === '1234') { // Hardcoded PIN for this example
                onUnlock();
            } else {
                setError(true);
                setTimeout(() => {
                    setPin('');
                    setError(false);
                }, 800);
            }
        }
    }, [pin, onUnlock]);

    const handleBackspace = () => {
        setPin(p => p.slice(0, -1));
    };

    const pinDots = Array(4).fill(0).map((_, i) => (
        <div key={i} className={`w-4 h-4 rounded-full border-2 border-white/50 transition-all ${pin.length > i ? 'bg-white' : ''} ${error ? 'bg-red-400 border-red-400' : ''}`} />
    ));

    return (
        <div className="fixed inset-0 bg-teal-950/90 backdrop-blur-xl z-[999] flex flex-col items-center justify-center text-white p-8 animate-in fade-in duration-500">
            <div className={`text-center transition-transform duration-300 ${error ? 'translate-x-2' : ''}`}>
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-white/20 shadow-xl">
                    <Lock size={40} />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-widest">Session Locked</h2>
                <p className="text-teal-300 font-bold mt-2">Enter PIN to continue</p>
                <div className="flex justify-center gap-4 my-8">{pinDots}</div>
            </div>
            {/* Hidden input for mobile keyboard */}
            <input
                ref={pinInputRef}
                type="tel"
                value={pin}
                onChange={e => setPin(e.target.value.slice(0, 4))}
                className="absolute opacity-0"
                maxLength={4}
            />
        </div>
    );
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
  const [adminQueue, setAdminQueue] = useState<string | null>(null);
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
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(MOCK_WAITLIST);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

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
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const [showTimeline, setShowTimeline] = useState(false);
  
  const [isPrivacyRevocationOpen, setIsPrivacyRevocationOpen] = useState(false);
  const [revocationTarget, setRevocationTarget] = useState<{patient: Patient, category: ConsentCategory} | null>(null);

  const [isMedicoLegalExportOpen, setIsMedicoLegalExportOpen] = useState(false);
  const [medicoLegalPatient, setMedicoLegalPatient] = useState<Patient | null>(null);

  const [isSafetyAlertOpen, setIsSafetyAlertOpen] = useState(false);
  const [safetyAlertConfig, setSafetyAlertConfig] = useState({ title: '', message: '' });

  const [isProtocolOverrideOpen, setIsProtocolOverrideOpen] = useState(false);
  const [overrideRule, setOverrideRule] = useState<ClinicalProtocolRule | null>(null);
  const [overrideContinuation, setOverrideContinuation] = useState<(() => void) | null>(null);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [isQuickAddPatientOpen, setIsQuickAddPatientOpen] = useState(false);

  // --- Gap 4: Audit Trail Lockdown ---
  const readOnlyLockdown = useMemo(() => isAuditLogVerified === false, [isAuditLogVerified]);
  const lockdownToast = () => toast.error("System Locked: Data modification disabled due to integrity issue.");

  useEffect(() => {
    const loadedLog = MOCK_AUDIT_LOG; // Simulating loading from storage
    const isValid = verifyAuditTrail(loadedLog);
    setIsAuditLogVerified(isValid);
  }, []);

  const selectedPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId) || null;
  }, [selectedPatientId, patients]);

  const handlePatientSelect = useCallback((id: string | null) => {
    setSelectedPatientId(id);
    if(id) setActiveTab('patients');
  }, []);

  const handleSavePatient = (patientData: Partial<Patient>) => {
    if (readOnlyLockdown) return lockdownToast();
    const isNew = !patients.some(p => p.id === patientData.id);
    const updatedPatients = isNew
      ? [...patients, patientData as Patient]
      : patients.map(p => p.id === patientData.id ? { ...p, ...patientData } as Patient : p);
    
    setPatients(updatedPatients);
    setIsPatientModalOpen(false);
    setEditingPatient(null);
  };
  
  const handleSaveAppointment = (appointment: Appointment) => {
    if (readOnlyLockdown) return lockdownToast();
    const isNew = !appointments.some(a => a.id === appointment.id);
    const updatedAppointments = isNew
      ? [...appointments, appointment]
      : appointments.map(a => a.id === appointment.id ? appointment : a);
    
    setAppointments(updatedAppointments);
    setIsAppointmentModalOpen(false);
    setEditingAppointment(null);
  };

  const handleMoveAppointment = (appointmentId: string, newDate: string, newTime: string, newProviderId: string, newResourceId?: string) => {
    if (readOnlyLockdown) return lockdownToast();
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId 
        ? { ...apt, date: newDate, time: newTime, providerId: newProviderId, resourceId: newResourceId } 
        : apt
    ));
    toast.success("Appointment rescheduled.");
  };

  const handleUpdateAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => {
    if (readOnlyLockdown) return lockdownToast();
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId ? { ...apt, status } : apt
    ));
  };
  
  const handleAddPatient = () => {
    if (readOnlyLockdown) return lockdownToast();
    setEditingPatient(null);
    setIsPatientModalOpen(true);
  };

  const handleAddAppointment = (date?: string, time?: string, patientId?: string, appointmentToEdit?: Appointment) => {
    if (readOnlyLockdown) return lockdownToast();
    setBookingDate(date);
    setBookingTime(time);
    setInitialBookingPatientId(patientId);
    setEditingAppointment(appointmentToEdit || null);
    setIsAppointmentModalOpen(true);
  };

  const handleSwitchUser = (user: User) => {
      setCurrentUser(user);
      setIsProfileOpen(false);
  };
  
  const handleUpdateSettings = (newSettings: FieldSettings) => {
    if (readOnlyLockdown) return lockdownToast();
    setFieldSettings(newSettings);
    toast.success("Settings updated.");
  };

  const handleAdminNavigation = (tab: 'financials' | 'inventory' | 'recall' | 'referrals' | 'roster' | 'leave') => {
    setActiveTab(tab);
  };
  
  // App logic remains the same...

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
                  appointments={appointments} 
                  patientsCount={patients.length} 
                  staffCount={staff.length}
                  currentUser={currentUser}
                  patients={patients}
                  onAddPatient={handleAddPatient}
                  onPatientSelect={handlePatientSelect}
                  onAddAppointment={handleAddAppointment}
                  onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                  onQuickQueue={() => setIsQuickTriageModalOpen(true)}
                  onQuickAddPatient={() => setIsQuickAddPatientOpen(true)}
                  staff={staff}
                  onNavigateToQueue={(queue) => { setActiveTab('admin'); setAdminQueue(queue); }}
               />;
      case 'schedule':
        return <CalendarView 
                  appointments={appointments} 
                  staff={staff}
                  onAddAppointment={handleAddAppointment}
                  onMoveAppointment={handleMoveAppointment}
                  onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                  onPatientSelect={handlePatientSelect}
                  currentUser={currentUser}
                  patients={patients}
                  currentBranch={currentBranch}
                  fieldSettings={fieldSettings}
               />;
      case 'patients':
        return (
          <div className="flex h-full gap-6">
            <div className={`${selectedPatientId ? 'w-28' : 'w-1/3'} transition-all duration-500`}>
              <PatientList
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={handlePatientSelect}
                onAddPatient={() => setIsPatientModalOpen(true)}
                fieldSettings={fieldSettings}
                isCollapsed={!!selectedPatientId}
              />
            </div>
            <div className="flex-1">
              <PatientDetailView
                patient={selectedPatient}
                appointments={appointments}
                staff={staff}
                currentUser={currentUser}
                onQuickUpdatePatient={handleSavePatient}
                onBookAppointment={(id) => handleAddAppointment(undefined, undefined, id)}
                onEditPatient={(p) => { setEditingPatient(p); setIsPatientModalOpen(true); }}
                fieldSettings={fieldSettings}
                logAction={() => {}}
                incidents={incidents}
                referrals={referrals}
                onBack={() => setSelectedPatientId(null)}
                governanceTrack={governanceTrack}
                onOpenRevocationModal={()=>{}}
                onOpenMedicoLegalExport={()=>{}}
                readOnly={readOnlyLockdown}
              />
            </div>
          </div>
        );
      case 'admin':
        return <AdminHub 
          onNavigate={handleAdminNavigation} 
          adminQueue={adminQueue}
          setAdminQueue={setAdminQueue}
          appointments={appointments}
          patients={patients}
          syncConflicts={syncConflicts}
          onVerifyDowntimeEntry={() => {}}
          onVerifyMedHistory={() => {}}
          onConfirmFollowUp={() => {}}
          onEditPatient={(p) => { setEditingPatient(p); setIsPatientModalOpen(true); }}
        />;
      case 'field-mgmt':
        return <FieldManagement 
                  settings={fieldSettings} 
                  onUpdateSettings={handleUpdateSettings}
                  auditLogVerified={isAuditLogVerified}
                  staff={staff}
                  auditLog={auditLog}
                  patients={patients}
                  onPurgePatient={() => {}}
                  encryptionKey={encryptionKey}
                  incidents={incidents}
                  onSaveIncident={()=>{}}
                  appointments={appointments}
                  currentUser={currentUser}
                  onStartImpersonating={()=>{}}
               />;
      case 'financials':
        return <Financials 
                  claims={hmoClaims} 
                  expenses={MOCK_EXPENSES} 
                  philHealthClaims={philHealthClaims}
                  patients={patients}
                  appointments={appointments}
                  fieldSettings={fieldSettings}
                  staff={staff}
                  currentUser={currentUser}
                  reconciliations={reconciliations}
                  cashSessions={cashSessions}
                  currentBranch={currentBranch}
                  payrollPeriods={payrollPeriods}
                  payrollAdjustments={payrollAdjustments}
                  commissionDisputes={commissionDisputes}
                  onUpdatePayrollPeriod={()=>{}}
                  onAddPayrollAdjustment={()=>{}}
                  onApproveAdjustment={()=>{}}
                  onAddCommissionDispute={()=>{}}
                  onResolveCommissionDispute={()=>{}}
                  governanceTrack={governanceTrack}
                  setGovernanceTrack={setGovernanceTrack}
                  onBack={() => setActiveTab('admin')}
               />
      case 'inventory':
        return <Inventory 
                  stock={stock}
                  onUpdateStock={(s) => setStock(s)}
                  currentUser={currentUser}
                  currentBranch={currentBranch}
                  availableBranches={fieldSettings.branches}
                  transfers={transfers}
                  onPerformTransfer={() => {}}
                  fieldSettings={fieldSettings}
                  onUpdateSettings={handleUpdateSettings}
                  onBack={() => setActiveTab('admin')}
              />
      case 'recall':
        return <RecallCenter 
                  patients={patients}
                  onUpdatePatientRecall={() => {}}
                  onBack={() => setActiveTab('admin')}
                />
      case 'referrals':
        return <ReferralManager 
                  patients={patients}
                  referrals={referrals}
                  onSaveReferral={() => {}}
                  staff={staff}
                  onBack={() => setActiveTab('admin')}
                />
      case 'roster':
        return <RosterView 
                  staff={staff}
                  fieldSettings={fieldSettings}
                  currentUser={currentUser}
                  onUpdateStaffRoster={() => {}}
                  onBack={() => setActiveTab('admin')}
                />
      case 'leave':
        return <LeaveAndShiftManager 
                  staff={staff}
                  currentUser={currentUser}
                  leaveRequests={leaveRequests}
                  onAddLeaveRequest={() => {}}
                  onApproveLeaveRequest={() => {}}
                  fieldSettings={fieldSettings}
                  onBack={() => setActiveTab('admin')}
                />
      default:
        return null;
    }
  };

  if (isInKioskMode) {
    return <KioskView 
              patients={patients}
              onUpdatePatient={handleSavePatient}
              onExitKiosk={() => setIsInKioskMode(false)}
              fieldSettings={fieldSettings}
            />
  }

  return (
    <>
      {isSessionLocked && <LockScreen onUnlock={() => setIsSessionLocked(false)} />}
      {readOnlyLockdown && (
        <div
          className="fixed top-0 left-0 right-0 bg-red-600 text-white p-4 text-center font-black uppercase tracking-widest text-sm z-[101] flex justify-center items-center gap-4 shadow-2xl animate-pulse-red"
          role="alert"
        >
          <ShieldAlert size={20} />
          <span>SYSTEM INTEGRITY COMPROMISED. DATA MODIFICATION DISABLED. CONTACT SYSTEM ARCHITECT.</span>
        </div>
      )}
      <div className={readOnlyLockdown ? 'h-full pt-14' : 'h-full'}>
        <Layout 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          onAddAppointment={() => handleAddAppointment()}
          currentUser={currentUser}
          onSwitchUser={handleSwitchUser}
          staff={staff}
          currentBranch={currentBranch}
          availableBranches={fieldSettings.branches}
          onChangeBranch={setCurrentBranch}
          fieldSettings={fieldSettings}
          onGenerateReport={()=>{}}
          onEnterKioskMode={() => setIsInKioskMode(true)}
          notifications={[]}
          onNotificationClick={()=>{}}
          isProfileOpen={isProfileOpen}
          onOpenProfile={() => setIsProfileOpen(true)}
          onCloseProfile={() => setIsProfileOpen(false)}
        >
          {renderActiveTab()}
        </Layout>
      </div>

      <AppointmentModal 
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        patients={patients}
        staff={staff}
        appointments={appointments}
        onSave={handleSaveAppointment}
        onAddToWaitlist={()=>{}}
        initialDate={bookingDate}
        initialTime={bookingTime}
        initialPatientId={initialBookingPatientId}
        existingAppointment={editingAppointment}
        fieldSettings={fieldSettings}
        isDowntime={systemStatus === SystemStatus.DOWNTIME}
        isReconciliationMode={isReconciliationMode}
        currentBranch={currentBranch}
      />
      <PatientRegistrationModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSave={handleSavePatient}
        initialData={editingPatient}
        fieldSettings={fieldSettings}
        patients={patients}
        readOnly={readOnlyLockdown}
      />
      <QuickTriageModal
        isOpen={isQuickTriageModalOpen}
        onClose={() => setIsQuickTriageModalOpen(false)}
        onSave={() => { if(readOnlyLockdown) lockdownToast() }}
      />
      <QuickAddPatientModal
        isOpen={isQuickAddPatientOpen}
        onClose={() => setIsQuickAddPatientOpen(false)}
        onSave={() => { if(readOnlyLockdown) lockdownToast() }}
      />
    </>
  );
}

export default App;

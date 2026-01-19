import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import PatientList from './components/PatientList';
import PatientDetailView from './components/PatientDetailView';
import AppointmentModal from './components/AppointmentModal';
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
import { Appointment, User, Patient, FieldSettings, UserRole, AppointmentStatus, PinboardTask, AuditLogEntry, StockItem, DentalChartEntry, SterilizationCycle, HMOClaim, PhilHealthClaim, PhilHealthClaimStatus, HMOClaimStatus, ClinicalIncident, Referral, ReconciliationRecord, StockTransfer, RecallStatus, TriageLevel, CashSession, PayrollPeriod, PayrollAdjustment, CommissionDispute, PayrollStatus, SyncIntent, SyncConflict, SystemStatus, LabStatus, ScheduledSms, AppNotification, WaitlistEntry, GovernanceTrack, ConsentCategory, LeaveRequest, CommunicationLogEntry, CommunicationChannel, ConsentLogEntry, TreatmentPlanStatus, TreatmentPlan, ClearanceRequest, ClinicalProtocolRule, InstrumentSet, Expense } from './types';
import { useToast } from './components/ToastSystem';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import CryptoJS from 'crypto-js';
import { Lock, FileText, CheckCircle, ShieldCheck, ShieldAlert, AlertTriangle, MessageSquare, X, CloudOff, FileWarning, MessageCircle as MessageIcon, User as UserIcon, Key, FileSearch } from 'lucide-react';
import { getTrustedTime } from './services/timeService';
import PrivacyRevocationModal from './components/PrivacyRevocationModal';
import ConsentCaptureModal from './components/ConsentCaptureModal';
import FinancialConsentModal from './components/FinancialConsentModal';
import ClearanceModal from './components/ClearanceModal';
import GeminiAssistant from './components/GeminiAssistant';


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
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES); // Problem 6 Fix
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
  const [bookingOverrideInfo, setBookingOverrideInfo] = useState<{ isWaitlistOverride: boolean; authorizedManagerId: string; } | null>(null);

  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const [showTimeline, setShowTimeline] = useState(false);
  
  // --- GAP 1 MODAL STATES ---
  const [isSafetyTimeoutOpen, setIsSafetyTimeoutOpen] = useState(false);
  const [safetyTimeoutPatient, setSafetyTimeoutPatient] = useState<Patient | null>(null);
  const [isPostOpHandoverOpen, setIsPostOpHandoverOpen] = useState(false);
  const [postOpAppointment, setPostOpAppointment] = useState<Appointment | null>(null);
  const [isPrivacyRevocationOpen, setIsPrivacyRevocationOpen] = useState(false);
  const [revocationTarget, setRevocationTarget] = useState<{patient: Patient, category: ConsentCategory} | null>(null);
  const [isMedicoLegalExportOpen, setIsMedicoLegalExportOpen] = useState(false);
  const [medicoLegalPatient, setMedicoLegalPatient] = useState<Patient | null>(null);
  // ConsentCaptureModal state would also go here if needed from App.tsx

  // --- GAP 5 PREFILL STATE ---
  const [prefillNote, setPrefillNote] = useState<Partial<DentalChartEntry> | null>(null);

  const [isSafetyAlertOpen, setIsSafetyAlertOpen] = useState(false);
  const [safetyAlertConfig, setSafetyAlertConfig] = useState<any>({ title: '', message: '' });
  const [clearancePatient, setClearancePatient] = useState<Patient | null>(null);
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);

  // --- GAP 4: Protocol Override State ---
  const [isProtocolOverrideOpen, setIsProtocolOverrideOpen] = useState(false);
  const [overrideRule, setOverrideRule] = useState<ClinicalProtocolRule | null>(null);
  const [overrideContinuation, setOverrideContinuation] = useState<(() => void) | null>(null);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [isQuickAddPatientOpen, setIsQuickAddPatientOpen] = useState(false);

  // --- GAP 4: Audit Trail Lockdown ---
  const readOnlyLockdown = useMemo(() => isAuditLogVerified === false, [isAuditLogVerified]);
  const lockdownToast = () => toast.error("System Locked: Data modification disabled due to integrity issue.");

  // --- GAP 5: Audit Log Implementation ---
  const logAction = (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => {
    if (readOnlyLockdown) return;
    
    setAuditLog(prevLog => {
        const lastLog = prevLog[prevLog.length - 1];
        const previousHash = lastLog ? lastLog.hash : '0'.repeat(64);
        
        const timestamp = new Date().toISOString();
        const payload = `${timestamp}|${currentUser.id}|${action}|${entityId}|${previousHash}`;
        const hash = CryptoJS.SHA256(payload).toString();

        const newLogEntry: AuditLogEntry = {
            id: generateUid('al'),
            timestamp,
            userId: currentUser.id,
            userName: currentUser.name,
            action,
            entity,
            entityId,
            details,
            hash,
            previousHash,
            impersonatingUser: originalUser ? { id: originalUser.id, name: originalUser.name } : undefined
        };
        return [...prevLog, newLogEntry];
    });
  };

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
    const oldPatient = isNew ? null : patients.find(p => p.id === patientData.id);
    
    const finalPatient = isNew 
        ? patientData as Patient 
        : { ...oldPatient, ...patientData } as Patient;

    const updatedPatients = isNew
      ? [...patients, finalPatient]
      : patients.map(p => p.id === finalPatient.id ? finalPatient : p);
    
    setPatients(updatedPatients);
    logAction(isNew ? 'CREATE' : 'UPDATE', 'Patient', finalPatient.id, generateDiff(oldPatient, finalPatient));

    // Supply Chain Logic
    const newOrUpdatedEntries = finalPatient.dentalChart?.filter(newEntry => {
      const oldEntry = oldPatient?.dentalChart?.find(old => old.id === newEntry.id);
      return !oldEntry || JSON.stringify(oldEntry) !== JSON.stringify(newEntry);
    });
  
    if (newOrUpdatedEntries && newOrUpdatedEntries.length > 0) {
      let stockUpdated = false;
      let settingsUpdated = false;
      const nextStock = [...stock];
      const nextInstrumentSets = [...(fieldSettings.instrumentSets || [])];
  
      newOrUpdatedEntries.forEach(entry => {
        if (entry.materialBatchId) {
          const stockIndex = nextStock.findIndex(s => s.id === entry.materialBatchId);
          if (stockIndex > -1) {
            nextStock[stockIndex] = { ...nextStock[stockIndex], quantity: nextStock[stockIndex].quantity - 1 };
            stockUpdated = true;
          }
        }
        if (entry.instrumentSetId) {
          const setIndex = nextInstrumentSets.findIndex(s => s.id === entry.instrumentSetId);
          if (setIndex > -1 && nextInstrumentSets[setIndex].status === 'Sterile') {
            nextInstrumentSets[setIndex] = { 
              ...nextInstrumentSets[setIndex], 
              status: 'Used',
              lastCycleId: entry.sterilizationCycleId || nextInstrumentSets[setIndex].lastCycleId
            };
            settingsUpdated = true;
          }
        }
      });
  
      if (stockUpdated) {
        setStock(nextStock);
      }
      if (settingsUpdated) {
        setFieldSettings(prev => ({ ...prev, instrumentSets: nextInstrumentSets }));
      }
    }

    setIsPatientModalOpen(false);
    setEditingPatient(null);
  };
  
  const handleSaveAppointment = (appointment: Appointment) => {
    if (readOnlyLockdown) return lockdownToast();
    const isNew = !appointments.some(a => a.id === appointment.id);
    const oldApt = isNew ? null : appointments.find(a => a.id === appointment.id);

    const updatedAppointments = isNew
      ? [...appointments, appointment]
      : appointments.map(a => a.id === appointment.id ? appointment : a);
    
    setAppointments(updatedAppointments);
    logAction(isNew ? 'CREATE' : 'UPDATE', 'Appointment', appointment.id, generateDiff(oldApt, appointment));
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
    const appointment = appointments.find(a => a.id === appointmentId);
    const patient = patients.find(p => p.id === appointment?.patientId);

    if (patient && appointment) {
        // --- GAP 1: Safety Timeout Trigger ---
        const isHighRisk = patient.medicalConditions?.some(c => CRITICAL_CLEARANCE_CONDITIONS.includes(c));
        if (isHighRisk && (status === AppointmentStatus.SEATED || status === AppointmentStatus.TREATING)) {
            setSafetyTimeoutPatient(patient);
            setIsSafetyTimeoutOpen(true);
            // We show the modal but still update the status optimistically
        }

        // --- GAP 1: Post-Op Handover Trigger ---
        const isSurgical = appointment.type.toLowerCase().includes('surgery') || appointment.type.toLowerCase().includes('extraction');
        if (isSurgical && status === AppointmentStatus.COMPLETED) {
            setPostOpAppointment(appointment);
            setIsPostOpHandoverOpen(true);
            return; // Halt status update until handover is confirmed
        }
    }
    
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId ? { ...apt, status } : apt
    ));
    logAction('UPDATE_STATUS', 'Appointment', appointmentId, `Status changed to ${status}.`);
  };
  
  const handleAddPatient = () => {
    if (readOnlyLockdown) return lockdownToast();
    setEditingPatient(null);
    setIsPatientModalOpen(true);
  };

  const handleAddAppointment = (date?: string, time?: string, patientId?: string, appointmentToEdit?: Appointment, overrideInfo?: { isWaitlistOverride: boolean; authorizedManagerId: string; }) => {
    if (readOnlyLockdown) return lockdownToast();
    setBookingDate(date);
    setBookingTime(time);
    setInitialBookingPatientId(patientId);
    setEditingAppointment(appointmentToEdit || null);
    setBookingOverrideInfo(overrideInfo || null);
    setIsAppointmentModalOpen(true);
  };

  const handleSwitchUser = (user: User) => {
    // This function is now used for both switching and saving the current user's profile.
    const isSaveOperation = staff.some(s => s.id === user.id);
    
    if (isSaveOperation) {
        // This is a save operation from the profile modal
        setStaff(prevStaff => prevStaff.map(s => (s.id === user.id ? user : s)));
        logAction('UPDATE', 'User', user.id, `Profile updated for ${user.name}.`);
        toast.success("Profile updated successfully.");
    }

    // This handles both switching to a new user and updating the view for the current user after a save
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
  
  // --- GAP 5: Prefill Note Handler ---
  const handlePrefillNote = (entry: Partial<DentalChartEntry>) => {
    setPrefillNote(entry);
    setActiveTab('patients');
  };
  const handleClearPrefill = () => setPrefillNote(null);

  // --- GAP 1: Modal Openers ---
  const handleOpenMedicoLegalExport = (patient: Patient) => {
      setMedicoLegalPatient(patient);
      setIsMedicoLegalExportOpen(true);
  };
  const handleOpenRevocationModal = (patient: Patient, category: ConsentCategory) => {
      setRevocationTarget({ patient, category });
      setIsPrivacyRevocationOpen(true);
  };

  const handleCompleteRegistration = (patientId: string) => {
      if (readOnlyLockdown) return lockdownToast();
      const patientToComplete = patients.find(p => p.id === patientId);
      if (patientToComplete) {
          setEditingPatient(patientToComplete);
          setIsPatientModalOpen(true);
      }
  };
  
  // --- GAP 1: Quick Intake Handlers ---
  const handleQuickAddPatient = (firstName: string, surname: string, phone: string) => {
    if (readOnlyLockdown) return lockdownToast();

    const newPatient: Patient = {
        id: generateUid('p'),
        firstName,
        surname,
        phone,
        name: `${firstName} ${surname}`,
        registrationStatus: 'Provisional',
        dob: '',
        lastVisit: 'First Visit',
        nextVisit: null,
        recallStatus: 'Due',
        email: '',
    };

    setPatients(prev => [...prev, newPatient]);
    logAction('CREATE', 'Patient', newPatient.id, 'Provisional patient record created via Quick Intake.');
    toast.success(`Provisional record for ${newPatient.name} created.`);
    setIsQuickAddPatientOpen(false);
  };
  
  const handleQuickTriage = (name: string, phone: string, complaint: string, isEmergency: boolean) => {
    if (readOnlyLockdown) return lockdownToast();
    
    const [firstName, ...surnameParts] = name.split(' ');
    const surname = surnameParts.join(' ');
    const triageLevel: TriageLevel = isEmergency ? 'Level 1: Trauma/Bleeding' : 'Level 3: Appliance/Maintenance';

    const newPatient: Patient = {
        id: generateUid('p'),
        firstName,
        surname,
        phone,
        name,
        registrationStatus: 'Provisional',
        chiefComplaint: complaint,
        dob: '',
        lastVisit: 'First Visit',
        nextVisit: null,
        recallStatus: 'Due',
        email: '',
    };
    
    setPatients(prev => [...prev, newPatient]);
    logAction('CREATE', 'Patient', newPatient.id, 'Provisional patient record created via Walk-In.');

    const newAppointment: Appointment = {
        id: generateUid('apt'),
        patientId: newPatient.id,
        providerId: staff.find(s => s.role === UserRole.DENTIST)?.id || 'doc1',
        branch: currentBranch,
        date: new Date().toLocaleDateString('en-CA'),
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        durationMinutes: 30,
        type: `Walk-In: ${complaint}`,
        status: AppointmentStatus.ARRIVED,
        triageLevel: triageLevel,
        queuedAt: new Date().toISOString(),
    };

    setAppointments(prev => [...prev, newAppointment]);
    logAction('CREATE', 'Appointment', newAppointment.id, 'Walk-in triage appointment created.');
    toast.success(`${name} added to triage queue.`);
    setIsQuickTriageModalOpen(false);
  };

  // --- GAP 2: Admin Hub Handlers ---
  const handleVerifyDowntimeEntry = (id: string) => {
    if (readOnlyLockdown) return lockdownToast();
    setAppointments(prev => prev.map(apt => apt.id === id ? { ...apt, reconciled: true } : apt));
    logAction('VERIFY', 'Appointment', id, 'Downtime entry reconciled.');
    toast.success("Downtime entry reconciled.");
  };

  const handleVerifyMedHistory = (id: string) => {
    if (readOnlyLockdown) return lockdownToast();
    setAppointments(prev => prev.map(apt => apt.id === id ? { ...apt, medHistoryVerified: true, medHistoryVerifiedAt: new Date().toISOString() } : apt));
    logAction('VERIFY', 'Appointment', id, 'Medical history verified at chairside.');
    toast.success("Medical history verified for appointment.");
  };

  const handleConfirmFollowUp = (id: string) => {
    if (readOnlyLockdown) return lockdownToast();
    setAppointments(prev => prev.map(apt => apt.id === id ? { ...apt, followUpConfirmed: true, followUpConfirmedAt: new Date().toISOString() } : apt));
    logAction('VERIFY', 'Appointment', id, 'Post-op follow-up call confirmed.');
    toast.success("Post-op follow-up confirmed.");
  };

  // --- GAP 3: Staff Management Handlers ---
  const handleSaveReferral = (referral: Omit<Referral, 'id'>) => {
    if (readOnlyLockdown) return lockdownToast();
    const newReferral = { ...referral, id: generateUid('ref') };
    setReferrals(prev => [...prev, newReferral]);
    logAction('CREATE', 'Referral', newReferral.id, `Referred patient to ${newReferral.referredTo}.`);
    toast.success("Referral logged successfully.");
  };

  const handleUpdateStaffRoster = (staffId: string, day: string, branch: string) => {
    if (readOnlyLockdown) return lockdownToast();
    setStaff(prev => prev.map(s => {
        if (s.id === staffId) {
            const newRoster = { ...(s.roster || {}), [day]: branch === 'Off' ? undefined : branch };
            // clean up undefined
            Object.keys(newRoster).forEach(key => newRoster[key] === undefined && delete newRoster[key]);
            logAction('UPDATE', 'Staff', staffId, `Roster updated for ${day}: ${branch}.`);
            return { ...s, roster: newRoster };
        }
        return s;
    }));
    toast.success("Roster updated.");
  };

  const handleAddLeaveRequest = (request: Omit<LeaveRequest, 'id' | 'staffName' | 'status'>) => {
    if (readOnlyLockdown) return lockdownToast();
    const staffMember = staff.find(s => s.id === request.staffId);
    if (!staffMember) return;
    const newRequest: LeaveRequest = {
        ...request,
        id: generateUid('leave'),
        staffName: staffMember.name,
        status: 'Pending'
    };
    setLeaveRequests(prev => [newRequest, ...prev]);
    logAction('CREATE', 'LeaveRequest', newRequest.id, `Leave request submitted for ${staffMember.name}.`);
    toast.info("Leave request submitted for approval.");
  };

  const handleApproveLeaveRequest = (id: string, approve: boolean) => {
    if (readOnlyLockdown) return lockdownToast();
    const req = leaveRequests.find(r => r.id === id);
    if (!req) return;

    setLeaveRequests(prev => prev.map(r => 
        r.id === id ? { ...r, status: approve ? 'Approved' : 'Rejected' } : r
    ));

    if (approve) {
        const staffMember = staff.find(s => s.id === req.staffId);
        if (!staffMember) return;

        const newBlocks: Appointment[] = [];
        const startDate = new Date(req.startDate);
        const endDate = new Date(req.endDate);

        for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
            const newBlock: Appointment = {
                id: generateUid('apt_block'),
                patientId: 'ADMIN_BLOCK',
                providerId: req.staffId,
                branch: staffMember.defaultBranch, 
                date: d.toLocaleDateString('en-CA'),
                time: '09:00',
                durationMinutes: 540, // 9 hours
                type: 'Clinical Block',
                isBlock: true,
                title: `${req.type} Leave`,
                status: AppointmentStatus.SCHEDULED,
            };
            newBlocks.push(newBlock);
        }
        setAppointments(prev => [...prev, ...newBlocks]);
        logAction('CREATE_BATCH', 'Appointment', req.id, `Created ${newBlocks.length} clinical blocks for approved leave.`);
    }

    logAction('UPDATE_STATUS', 'LeaveRequest', id, `Request ${approve ? 'Approved' : 'Rejected'}.`);
    toast.success(`Leave request ${approve ? 'approved' : 'rejected'}.`);
  };

  // --- GAP 4: Protocol Override Handlers ---
  const handleRequestProtocolOverride = (rule: ClinicalProtocolRule, continuation: () => void) => {
    if (readOnlyLockdown) return lockdownToast();
    const canOverride = currentUser.role === UserRole.SYSTEM_ARCHITECT || currentUser.role === UserRole.ADMIN;
    if (!canOverride) {
        toast.error("You do not have permission to override clinical protocols.");
        return;
    }
    setOverrideRule(rule);
    setOverrideContinuation(() => continuation);
    setIsProtocolOverrideOpen(true);
  };
  
  const handleConfirmOverride = (reason: string) => {
    if (overrideContinuation) {
        overrideContinuation();
        logAction('OVERRIDE_PROTOCOL', 'ClinicalProtocol', overrideRule!.id, `Reason: ${reason}`);
        toast.warning(`Protocol "${overrideRule?.name}" overridden.`);
    }
    setIsProtocolOverrideOpen(false);
    setOverrideRule(null);
    setOverrideContinuation(null);
  };

  // --- GAP 5: Consent Revocation Handler ---
  const handleConfirmRevocation = (patient: Patient, category: ConsentCategory, reason: string, notes: string) => {
    if (readOnlyLockdown) return lockdownToast();
    
    const consentLogEntry: ConsentLogEntry = {
        category,
        status: 'Revoked',
        timestamp: new Date().toISOString(),
        version: fieldSettings.currentPrivacyVersion,
    };
    
    const updatedPatient: Patient = {
        ...patient,
        dpaConsent: category === 'Clinical' ? false : patient.dpaConsent,
        marketingConsent: category === 'Marketing' ? false : patient.marketingConsent,
        thirdPartyDisclosureConsent: category === 'ThirdParty' ? false : patient.thirdPartyDisclosureConsent,
        consentLogs: [...(patient.consentLogs || []), consentLogEntry]
    };

    setPatients(prev => prev.map(p => p.id === patient.id ? updatedPatient : p));
    
    logAction('REVOKE_CONSENT', 'Patient', patient.id, `Consent revoked for category: ${category}. Reason: ${reason}. Notes: ${notes}`);
    
    setIsPrivacyRevocationOpen(false);
    setRevocationTarget(null);
    toast.warning(`Consent for ${category} has been permanently revoked for ${patient.name}.`);
  };

  // Problem 4: Unwired Payroll Period Creation - FIX
  const handleAddPayrollPeriod = (period: Omit<PayrollPeriod, 'id'>): PayrollPeriod | undefined => {
      if (readOnlyLockdown) { lockdownToast(); return; }
      const newPeriod: PayrollPeriod = {
          ...period,
          id: `pp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      };
      setPayrollPeriods(prev => [...prev, newPeriod].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
      logAction('CREATE', 'PayrollPeriod', newPeriod.id, `Created new payroll period for ${newPeriod.providerId}.`);
      return newPeriod;
  };

  // Problem 5: Placeholder Financial Modules (Reconciliation Handler) -> Problem 2 in new list
  const handleSaveReconciliation = (record: Omit<ReconciliationRecord, 'id' | 'timestamp'>) => {
    if (readOnlyLockdown) { lockdownToast(); return; }
    const newRecord: ReconciliationRecord = {
        ...record,
        id: `recon_${Date.now()}`,
        timestamp: new Date().toISOString()
    };
    setReconciliations(prev => [newRecord, ...prev]);
    logAction('CREATE', 'Reconciliation', newRecord.id, `New reconciliation saved for branch ${record.branch}.`);
    toast.success("Cash reconciliation record saved.");
  };

  // --- Problem 3: Incomplete Admin & Staff Management Logic ---
  const handleStartImpersonating = (userToImpersonate: User) => {
    if (readOnlyLockdown) { lockdownToast(); return; }
    if (currentUser.id === userToImpersonate.id) return;
    
    logAction('SECURITY_ALERT', 'System', userToImpersonate.id, `Impersonation started by ${currentUser.name} for user ${userToImpersonate.name}.`);
    setOriginalUser(currentUser);
    setCurrentUser(userToImpersonate);
    toast.warning(`Now impersonating ${userToImpersonate.name}. All actions are logged under your authority.`);
    setActiveTab('dashboard');
  };

  const handleStopImpersonating = () => {
    if (originalUser) {
        logAction('SECURITY_ALERT', 'System', currentUser.id, `Impersonation stopped. Reverted to ${originalUser.name}.`);
        setCurrentUser(originalUser);
        setOriginalUser(null);
        toast.info("Impersonation stopped. Session returned to original user.");
    }
  };
    
  const handlePurgePatient = (patientId: string) => {
      if (readOnlyLockdown) { lockdownToast(); return; }
      if (window.confirm("Are you sure you want to permanently purge this patient record? This action cannot be undone and will be logged.")) {
          setPatients(prev => prev.filter(p => p.id !== patientId));
          setAppointments(prev => prev.filter(a => a.patientId !== patientId));
          logAction('DELETE', 'Patient', patientId, 'Patient record and all associated appointments purged from system.');
          toast.success("Patient record purged.");
          setSelectedPatientId(null);
      }
  };
  
  const handlePerformTransfer = (transfer: StockTransfer) => {
      if (readOnlyLockdown) { lockdownToast(); return; }
      setStock(prevStock => {
          const nextStock = [...prevStock];
          const fromIndex = nextStock.findIndex(s => s.id === transfer.itemId);
          
          if (fromIndex === -1 || nextStock[fromIndex].quantity < transfer.quantity) {
              toast.error("Transfer failed: Insufficient stock.");
              return prevStock;
          }
          
          nextStock[fromIndex] = { ...nextStock[fromIndex], quantity: nextStock[fromIndex].quantity - transfer.quantity };

          const toIndex = nextStock.findIndex(s => s.name === transfer.itemName && s.branch === transfer.toBranch);
          if (toIndex > -1) {
              nextStock[toIndex] = { ...nextStock[toIndex], quantity: nextStock[toIndex].quantity + transfer.quantity };
          } else {
              const newItem: StockItem = {
                  ...nextStock[fromIndex],
                  id: generateUid('stk'),
                  branch: transfer.toBranch,
                  quantity: transfer.quantity,
              };
              nextStock.push(newItem);
          }
          return nextStock;
      });
      setTransfers(prev => [transfer, ...prev]);
      logAction('TRANSFER', 'StockItem', transfer.itemId, `Transferred ${transfer.quantity} of ${transfer.itemName} from ${transfer.fromBranch} to ${transfer.toBranch}.`);
      toast.success("Stock transfer completed.");
  };

  const handleUpdatePatientRecall = (patientId: string, status: RecallStatus) => {
      if (readOnlyLockdown) { lockdownToast(); return; }
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, recallStatus: status } : p));
      logAction('UPDATE', 'Patient', patientId, `Recall status updated to ${status}.`);
  };

  const handleUpdatePayrollPeriod = (period: PayrollPeriod) => {
    if (readOnlyLockdown) { lockdownToast(); return; }
    setPayrollPeriods(prev => prev.map(p => p.id === period.id ? period : p));
  };
  
  const handleAddPayrollAdjustment = (adj: PayrollAdjustment) => {
    if (readOnlyLockdown) { lockdownToast(); return; }
    setPayrollAdjustments(prev => [...prev, adj]);
  };

  const handleApproveAdjustment = (id: string) => {
    if (readOnlyLockdown) { lockdownToast(); return; }
    setPayrollAdjustments(prev => prev.map(a => a.id === id ? { ...a, status: 'Approved', verifiedBy: currentUser.name } : a));
  };

  const handleAddCommissionDispute = (dispute: CommissionDispute) => {
    if (readOnlyLockdown) { lockdownToast(); return; }
    setCommissionDisputes(prev => [...prev, dispute]);
  };
  
  const handleResolveCommissionDispute = (id: string) => {
    if (readOnlyLockdown) { lockdownToast(); return; }
    setCommissionDisputes(prev => prev.map(d => d.id === id ? { ...d, status: 'Resolved' } : d));
  };

  const handleClearProfessionalismReview = (patientId: string, noteId: string) => {
      if (readOnlyLockdown) { lockdownToast(); return; }
      setPatients(prev => prev.map(p => {
          if (p.id === patientId) {
              return { ...p, dentalChart: p.dentalChart?.map(note => note.id === noteId ? { ...note, needsProfessionalismReview: false } : note) };
          }
          return p;
      }));
      logAction('VERIFY', 'ClinicalNote', noteId, 'Professionalism review flag cleared.');
      toast.success("Note approved for sealing.");
  };
  
  // Problem 3 Fix: Handler for saving clinical incidents
  const handleSaveIncident = (incident: Omit<ClinicalIncident, 'id'>) => {
    if (readOnlyLockdown) { lockdownToast(); return; }
    const newIncident: ClinicalIncident = {
      ...incident,
      id: `inc_${Date.now()}`
    };
    setIncidents(prev => [newIncident, ...prev]);
    logAction('CREATE', 'ClinicalIncident', newIncident.id, `New incident report filed: ${incident.type}.`);
    toast.success("Clinical incident report logged successfully.");
  };

  // Problem 2 Fix: Handler for deleting unsealed clinical notes
  const handleDeleteClinicalNote = (patientId: string, noteId: string) => {
    if (readOnlyLockdown) { lockdownToast(); return; }
    if (window.confirm("Are you sure you want to delete this unsealed clinical note? This action is irreversible and will be logged.")) {
      setPatients(prev => prev.map(p => {
        if (p.id === patientId) {
          const noteToDelete = p.dentalChart?.find(note => note.id === noteId);
          if (noteToDelete && noteToDelete.sealedHash) {
            toast.error("Cannot delete a digitally sealed forensic record.");
            return p;
          }
          if (noteToDelete && currentUser.id !== noteToDelete.authorId) {
            toast.error("Only the original author can delete an unsealed note.");
            return p;
          }
          return {
            ...p,
            dentalChart: p.dentalChart?.filter(note => note.id !== noteId)
          };
        }
        return p;
      }));
      logAction('DELETE', 'ClinicalNote', noteId, 'Unsealed clinical note deleted.');
      toast.success("Clinical note deleted.");
    }
  };

  // Problem 1 Fix: Appointment Safety Check Handler
  const handleProcedureSafetyCheck = (patientId: string, procedureName: string, continuation: () => void) => {
    if (!fieldSettings.features.enableClinicalProtocolAlerts) {
        continuation();
        return;
    }

    const patient = patients.find(p => p.id === patientId);
    const procedure = fieldSettings.procedures.find(p => p.name === procedureName);
    if (!patient || !procedure) {
        continuation();
        return;
    }

    const rules = fieldSettings.clinicalProtocolRules || [];
    for (const rule of rules) {
        const procedureCategoryMatch = rule.triggerProcedureCategories.includes(procedure.category || '');
        const medicalConditionMatch = rule.requiresMedicalConditions.some(cond => (patient.medicalConditions || []).includes(cond));
        
        if (procedureCategoryMatch && medicalConditionMatch) {
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

            const hasValidClearance = (patient.clearanceRequests || []).some(cr =>
                cr.status === 'Approved' &&
                cr.approvedAt &&
                new Date(cr.approvedAt) >= threeMonthsAgo
            );

            if (!hasValidClearance) {
                setSafetyAlertConfig({
                    title: rule.name,
                    message: rule.alertMessage,
                    actionLabel: "Log Medical Clearance",
                    onAction: () => {
                        setClearancePatient(patient);
                        setIsClearanceModalOpen(true);
                    },
                    onOverride: () => {
                        handleRequestProtocolOverride(rule, continuation);
                    },
                    overrideLabel: "Request Manager Override"
                });
                setIsSafetyAlertOpen(true);
                return; 
            }
        }
    }
    continuation();
  };

  // Problem 2 Fix: Cash Session Handlers
  const handleStartCashSession = (openingBalance: number) => {
      if (cashSessions.some(s => s.branch === currentBranch && s.status === 'Open')) {
          toast.error("An active session is already running for this branch.");
          return;
      }
      const newSession: CashSession = {
          id: `cs_${Date.now()}`,
          branch: currentBranch,
          openedBy: currentUser.id,
          openedByName: currentUser.name,
          startTime: new Date().toISOString(),
          openingBalance,
          status: 'Open'
      };
      setCashSessions(prev => [...prev, newSession]);
      toast.success("Cash session started for " + currentBranch);
  };

  const handleCloseCashSession = (sessionId: string) => {
      setCashSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'Closed', endTime: new Date().toISOString() } : s));
      toast.info("Cash session closed.");
  };

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
                  onCompleteRegistration={handleCompleteRegistration}
                  onQuickQueue={() => setIsQuickTriageModalOpen(true)}
                  onQuickAddPatient={() => setIsQuickAddPatientOpen(true)}
                  staff={staff}
                  onNavigateToQueue={(queue) => { setActiveTab('admin'); setAdminQueue(queue); }}
                  currentBranch={currentBranch}
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
                  onPrefillNote={handlePrefillNote}
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
                stock={stock}
                sterilizationCycles={sterilizationCycles}
                currentUser={currentUser}
                onQuickUpdatePatient={handleSavePatient}
                onBookAppointment={(id) => handleAddAppointment(undefined, undefined, id)}
                onEditPatient={(p) => { setEditingPatient(p); setIsPatientModalOpen(true); }}
                fieldSettings={fieldSettings}
                logAction={logAction}
                incidents={incidents}
                referrals={referrals}
                onBack={() => setSelectedPatientId(null)}
                governanceTrack={governanceTrack}
                onOpenRevocationModal={handleOpenRevocationModal}
                onOpenMedicoLegalExport={handleOpenMedicoLegalExport}
                readOnly={readOnlyLockdown}
                prefill={prefillNote}
                onClearPrefill={handleClearPrefill}
                onRequestProtocolOverride={handleRequestProtocolOverride}
                onDeleteClinicalNote={handleDeleteClinicalNote}
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
          onVerifyDowntimeEntry={handleVerifyDowntimeEntry}
          onVerifyMedHistory={handleVerifyMedHistory}
          onConfirmFollowUp={handleConfirmFollowUp}
          onEditPatient={(p) => { setEditingPatient(p); setIsPatientModalOpen(true); }}
          onClearProfessionalismReview={handleClearProfessionalismReview}
        />;
      case 'field-mgmt':
        return <FieldManagement 
                  settings={fieldSettings} 
                  onUpdateSettings={handleUpdateSettings}
                  auditLogVerified={isAuditLogVerified}
                  staff={staff}
                  auditLog={auditLog}
                  patients={patients}
                  onPurgePatient={handlePurgePatient}
                  encryptionKey={encryptionKey}
                  appointments={appointments}
                  currentUser={currentUser}
                  onStartImpersonating={handleStartImpersonating}
               />;
      case 'financials':
        return <Financials 
                  claims={hmoClaims} 
                  expenses={expenses} 
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
                  onUpdatePayrollPeriod={handleUpdatePayrollPeriod}
                  onAddPayrollAdjustment={handleAddPayrollAdjustment}
                  onApproveAdjustment={handleApproveAdjustment}
                  onAddCommissionDispute={handleAddCommissionDispute}
                  onResolveCommissionDispute={handleResolveCommissionDispute}
                  governanceTrack={governanceTrack}
                  setGovernanceTrack={setGovernanceTrack}
                  onAddPayrollPeriod={handleAddPayrollPeriod}
                  onSaveReconciliation={handleSaveReconciliation} 
                  onStartCashSession={handleStartCashSession}
                  onCloseCashSession={handleCloseCashSession}
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
                  onPerformTransfer={handlePerformTransfer}
                  fieldSettings={fieldSettings}
                  onUpdateSettings={handleUpdateSettings}
                  onBack={() => setActiveTab('admin')}
              />
      case 'recall':
        return <RecallCenter 
                  patients={patients}
                  onUpdatePatientRecall={handleUpdatePatientRecall}
                  onBack={() => setActiveTab('admin')}
                />
      case 'referrals':
        return <ReferralManager 
                  patients={patients}
                  referrals={referrals}
                  onSaveReferral={handleSaveReferral}
                  staff={staff}
                  onBack={() => setActiveTab('admin')}
                />
      case 'roster':
        return <RosterView 
                  staff={staff}
                  fieldSettings={fieldSettings}
                  currentUser={currentUser}
                  onUpdateStaffRoster={handleUpdateStaffRoster}
                  onBack={() => setActiveTab('admin')}
                />
      case 'leave':
        return <LeaveAndShiftManager 
                  staff={staff}
                  currentUser={currentUser}
                  leaveRequests={leaveRequests}
                  onAddLeaveRequest={handleAddLeaveRequest}
                  onApproveLeaveRequest={handleApproveLeaveRequest}
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
          impersonatingUser={originalUser}
          onStopImpersonating={handleStopImpersonating}
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
        onClose={() => {
            setIsAppointmentModalOpen(false);
            setBookingOverrideInfo(null);
        }}
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
        overrideInfo={bookingOverrideInfo}
        isReconciliationMode={isReconciliationMode}
        currentBranch={currentBranch}
        onSavePatient={handleSavePatient}
        onProcedureSafetyCheck={handleProcedureSafetyCheck}
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
        onSave={handleQuickTriage}
      />
      <QuickAddPatientModal
        isOpen={isQuickAddPatientOpen}
        onClose={() => setIsQuickAddPatientOpen(false)}
        onSave={handleQuickAddPatient}
      />
      
      {/* --- GAP 1: RENDER MODALS --- */}
      {isSafetyTimeoutOpen && safetyTimeoutPatient && (
          <SafetyTimeoutModal 
              patient={safetyTimeoutPatient} 
              onConfirm={() => {
                  setIsSafetyTimeoutOpen(false);
                  setSafetyTimeoutPatient(null);
              }}
          />
      )}
      {isPostOpHandoverOpen && postOpAppointment && (
          <PostOpHandoverModal
              isOpen={isPostOpHandoverOpen}
              appointment={postOpAppointment}
              onClose={() => {
                  setIsPostOpHandoverOpen(false);
                  setPostOpAppointment(null);
              }}
              onConfirm={async () => {
                  handleUpdateAppointmentStatus(postOpAppointment.id, AppointmentStatus.COMPLETED);
              }}
          />
      )}
      {isMedicoLegalExportOpen && medicoLegalPatient && (
          <MedicoLegalExportModal 
              isOpen={isMedicoLegalExportOpen}
              onClose={() => setIsMedicoLegalExportOpen(false)}
              patient={medicoLegalPatient}
              staff={staff}
              logAction={logAction}
          />
      )}
      {isPrivacyRevocationOpen && revocationTarget && (
          <PrivacyRevocationModal
              isOpen={isPrivacyRevocationOpen}
              onClose={() => setIsPrivacyRevocationOpen(false)}
              patient={revocationTarget.patient}
              category={revocationTarget.category}
              onConfirm={(reason, notes) => handleConfirmRevocation(revocationTarget.patient, revocationTarget.category, reason, notes)}
          />
      )}
      {isProtocolOverrideOpen && overrideRule && (
        <ProtocolOverrideModal
            isOpen={isProtocolOverrideOpen}
            rule={overrideRule}
            onCancel={() => {
                setIsProtocolOverrideOpen(false);
                setOverrideRule(null);
                setOverrideContinuation(null);
            }}
            onConfirm={handleConfirmOverride}
        />
      )}
      <SafetyAlertModal 
        isOpen={isSafetyAlertOpen}
        onClose={() => setIsSafetyAlertOpen(false)}
        {...safetyAlertConfig}
      />
      {isClearanceModalOpen && clearancePatient && (
        <ClearanceModal
            isOpen={isClearanceModalOpen}
            onClose={() => setIsClearanceModalOpen(false)}
            patient={clearancePatient}
            currentUser={currentUser}
            onSave={(clearance) => {
                const updatedPatient = {
                    ...clearancePatient,
                    clearanceRequests: [...(clearancePatient.clearanceRequests || []), { ...clearance, id: `cr_${Date.now()}`, patientId: clearancePatient.id }]
                };
                handleSavePatient(updatedPatient);
                setIsClearanceModalOpen(false);
            }}
        />
      )}
      <GeminiAssistant />
    </>
  );
}

export default App;

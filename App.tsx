import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import PatientList from './components/PatientList';
import PatientDetailView from './components/PatientDetailView';
import AppointmentModal from './components/AppointmentModal';
import PatientRegistrationModal from './components/PatientRegistrationModal';
import FieldManagement from './components/FieldManagement';
import KioskView from './components/KioskView';
import AdminHub from './components/AdminHub';
import Financials from './components/Financials';
import Inventory from './components/Inventory';
import RecallCenter from './components/RecallCenter';
import ReferralManager from './components/ReferralManager';
import RosterView from './components/RosterView';
import LeaveAndShiftManager from './components/LeaveAndShiftManager';
import PostOpHandoverModal from './components/PostOpHandoverModal';
import SafetyTimeoutModal from './components/SafetyTimeoutModal';
import QuickTriageModal from './components/QuickTriageModal';
import QuickAddPatientModal from './components/QuickAddPatientModal';
import MedicoLegalExportModal from './components/MedicoLegalExportModal';
import SafetyAlertModal from './components/SafetyAlertModal';
import ProtocolOverrideModal from './components/ProtocolOverrideModal';
import PrivacyRevocationModal from './components/PrivacyRevocationModal';
import ConsentCaptureModal from './components/ConsentCaptureModal';
import FinancialConsentModal from './components/FinancialConsentModal';
import ClearanceModal from './components/ClearanceModal';
import UserProfileModal from './components/UserProfileModal';
import GeminiAssistant from './components/GeminiAssistant';
import { useData } from './dataContext';
import { Appointment, User, Patient, DentalChartEntry, TreatmentPlan, ConsentCategory, TreatmentPlanStatus, AppointmentStatus, ClinicalProtocolRule, TriageLevel, UserRole } from './types';
import { useToast } from './components/ToastSystem';
import { CRITICAL_CLEARANCE_CONDITIONS, generateUid } from './constants';
import { Lock, X } from 'lucide-react';


const LockScreen = ({ onUnlock }: { onUnlock: () => void }) => {
    return (
        <div className="fixed inset-0 bg-teal-950/90 backdrop-blur-xl z-[999] flex flex-col items-center justify-center text-white p-8 animate-in fade-in duration-500 cursor-pointer" onClick={onUnlock}>
            <div className="text-center">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-white/20 shadow-xl"><Lock size={40} /></div>
                <h2 className="text-3xl font-black uppercase tracking-widest">Session Locked</h2>
                <p className="text-teal-300 font-bold mt-2 animate-pulse">Click anywhere to unlock</p>
            </div>
        </div>
    );
};

function App() {
  const toast = useToast();
  const data = useData();
  const { 
    patients, appointments, staff, fieldSettings, tasks, auditLog, incidents, referrals,
    currentUser, originalUser, systemStatus, isOnline, offlineQueue, syncConflicts,
    isAuditLogVerified, governanceTrack, cashSessions,
    handleSavePatient, handleSaveAppointment, handleUpdateAppointmentStatus, handleMoveAppointment,
    handleAddTask, handleToggleTask, handleUpdateSettings, 
    handleStartImpersonating, handleStopImpersonating, handleDeactivateStaff, handleSaveStaff, setCurrentUser, setSystemStatus,
    handleVerifyDowntimeEntry, handleVerifyMedHistory, handleConfirmFollowUp
  } = data;
  
  // UI and Routing State
  const [route, setRoute] = useState({ path: 'dashboard', param: null as string | null });
  const [isInKioskMode, setIsInKioskMode] = useState(false);
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<string>('Makati Main');

  // Modal States
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isQuickTriageModalOpen, setIsQuickTriageModalOpen] = useState(false);
  const [isQuickAddPatientOpen, setIsQuickAddPatientOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSafetyTimeoutOpen, setIsSafetyTimeoutOpen] = useState(false);
  const [isPostOpHandoverOpen, setIsPostOpHandoverOpen] = useState(false);
  const [isMedicoLegalExportOpen, setIsMedicoLegalExportOpen] = useState(false);
  const [isPrivacyRevocationOpen, setIsPrivacyRevocationOpen] = useState(false);
  const [isProtocolOverrideOpen, setIsProtocolOverrideOpen] = useState(false);
  const [isSafetyAlertOpen, setIsSafetyAlertOpen] = useState(false);
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [consentRequest, setConsentRequest] = useState<{ patient: Patient; appointment: Appointment; continuation: () => void; } | null>(null);
  const [financialConsentInfo, setFinancialConsentInfo] = useState<{ plan: TreatmentPlan, patient: Patient } | null>(null);
  
  // Modal Data State
  const [bookingDate, setBookingDate] = useState<string | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState<string | undefined>(undefined);
  const [initialBookingPatientId, setInitialBookingPatientId] = useState<string | undefined>(undefined);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editingStaffMember, setEditingStaffMember] = useState<Partial<User> | null>(null);
  const [safetyTimeoutPatient, setSafetyTimeoutPatient] = useState<Patient | null>(null);
  const [postOpAppointment, setPostOpAppointment] = useState<Appointment | null>(null);
  const [medicoLegalPatient, setMedicoLegalPatient] = useState<Patient | null>(null);
  const [revocationTarget, setRevocationTarget] = useState<{patient: Patient, category: ConsentCategory} | null>(null);
  const [overrideRule, setOverrideRule] = useState<ClinicalProtocolRule | null>(null);
  const [overrideContinuation, setOverrideContinuation] = useState<(() => void) | null>(null);
  const [safetyAlertConfig, setSafetyAlertConfig] = useState<any>({ title: '', message: '' });
  const [clearancePatient, setClearancePatient] = useState<Patient | null>(null);

  // Prefill State
  const [prefillNote, setPrefillNote] = useState<Partial<DentalChartEntry> | null>(null);

  // Idle Timer
  const idleTimerRef = useRef<any>(null);
  const IDLE_TIMEOUT_MS = 15 * 60 * 1000; 

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setIsSessionLocked(true), IDLE_TIMEOUT_MS);
  }, [IDLE_TIMEOUT_MS]);

  useEffect(() => {
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
    };
  }, [resetIdleTimer]);
  
  // Routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '') || 'dashboard';
      const [path, param] = hash.split('/');
      setRoute({ path, param: param || null });
    };
    window.addEventListener('hashchange', handleHashChange, false);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (path: string) => { window.location.hash = path; };
  
  const isAdmin = useMemo(() => currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SYSTEM_ARCHITECT, [currentUser]);

  const selectedPatientId = route.path === 'patients' ? route.param : null;
  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId) || null, [selectedPatientId, patients]);

  const geminiPatientContext = useMemo(() => {
    if (!selectedPatient) return '';
    const activePlans = (selectedPatient.treatmentPlans || []).filter(p => p.status !== TreatmentPlanStatus.COMPLETED && p.status !== TreatmentPlanStatus.REJECTED).map(p => p.name).join(', ');
    return `- Patient: ${selectedPatient.name}, Age ${selectedPatient.age}\n- Critical Alerts: ${(selectedPatient.allergies?.join(', ') || 'None')}, ${(selectedPatient.medicalConditions?.join(', ') || 'None')}\n- Outstanding Balance: ₱${selectedPatient.currentBalance || 0}\n- Active Treatment Plans: ${activePlans || 'None'}`;
  }, [selectedPatient]);
  
  const handlePatientSelect = useCallback((id: string | null) => {
    if (id) navigateTo(`patients/${id}`);
    else navigateTo('patients');
  }, []);

  const handleAddAppointment = (date?: string, time?: string, patientId?: string, appointmentToEdit?: Appointment) => {
    setBookingDate(date);
    setBookingTime(time);
    setInitialBookingPatientId(patientId);
    setEditingAppointment(appointmentToEdit || null);
    setIsAppointmentModalOpen(true);
  };
  
  const handleUpdateApptStatusWithSafety = (appointmentId: string, status: AppointmentStatus) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    const patient = patients.find(p => p.id === appointment?.patientId);
    if (patient && appointment) {
        const isHighRisk = patient.medicalConditions?.some(c => CRITICAL_CLEARANCE_CONDITIONS.includes(c));
        if (isHighRisk && (status === AppointmentStatus.SEATED || status === AppointmentStatus.TREATING)) {
            setSafetyTimeoutPatient(patient);
            setIsSafetyTimeoutOpen(true);
        }
        const isSurgical = appointment.type.toLowerCase().includes('surgery') || appointment.type.toLowerCase().includes('extraction');
        if (isSurgical && status === AppointmentStatus.COMPLETED) {
            setPostOpAppointment(appointment);
            setIsPostOpHandoverOpen(true);
            return; 
        }
    }
    handleUpdateAppointmentStatus(appointmentId, status);
  };
  
  const handlePostOpConfirm = async () => {
    if (postOpAppointment) {
      await handleUpdateAppointmentStatus(postOpAppointment.id, AppointmentStatus.COMPLETED, { postOpVerified: true });
    }
  };

  const handleRequestConsent = (patient: Patient, appointment: Appointment, continuation: () => void) => {
    setConsentRequest({ patient, appointment, continuation });
  };
    
  const handleConfirmConsent = async (signatureUrl: string) => {
      if (!consentRequest) return;
      consentRequest.appointment.signedConsentUrl = signatureUrl;
      consentRequest.continuation();
      setConsentRequest(null);
  };
  
  const handleInitiateFinancialConsent = (plan: TreatmentPlan) => {
    const patientForPlan = patients.find(p => p.id === plan.patientId);
    if (patientForPlan) setFinancialConsentInfo({ plan, patient: patientForPlan });
  };

  const handleConfirmFinancialConsent = async (signatureUrl: string) => {
      if (!financialConsentInfo) return;
      const { patient, plan } = financialConsentInfo;
      const updatedPlans = (patient.treatmentPlans || []).map(p => p.id === plan.id ? { ...p, status: TreatmentPlanStatus.APPROVED, financialConsentSignature: signatureUrl } : p);
      await handleSavePatient({ ...patient, treatmentPlans: updatedPlans });
      setFinancialConsentInfo(null);
  };
  
  const handleProcedureSafetyCheck = (patientId: string, procedureName: string, continuation: () => void) => {
      // Logic for this is now mostly in the data context, but the modal trigger stays here
      continuation(); // Simplified for now
  };

  const handleQuickAddPatientSave = (firstName: string, surname: string, phone: string) => {
    const newPatient: Partial<Patient> = {
      firstName,
      surname,
      name: `${firstName} ${surname}`.trim(),
      phone,
      registrationStatus: 'Provisional',
      lastVisit: 'First Visit',
      nextVisit: null,
      recallStatus: 'Due'
    };
    handleSavePatient(newPatient);
    setIsQuickAddPatientOpen(false);
    toast.success(`Provisional patient ${newPatient.name} created.`);
  };

  const handleQuickTriageSave = (name: string, phone: string, complaint: string, isEmergency: boolean) => {
    const [firstName, ...surnameParts] = name.split(' ');
    const surname = surnameParts.join(' ');
    const newPatientId = generateUid('p_triage');

    const newPatient: Partial<Patient> = {
      id: newPatientId,
      firstName: firstName || 'Walk-In',
      surname: surname || `Patient-${newPatientId.slice(-4)}`,
      name: name,
      phone,
      chiefComplaint: complaint,
      registrationStatus: 'Provisional',
      lastVisit: 'First Visit',
      nextVisit: null,
      recallStatus: 'Due'
    };
    
    handleSavePatient(newPatient);

    const newAppointment: Appointment = {
      id: generateUid('apt_triage'),
      patientId: newPatientId,
      providerId: staff.find(s => s.role === UserRole.DENTIST)?.id || staff[0].id,
      branch: currentBranch,
      date: new Date().toLocaleDateString('en-CA'),
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit'}),
      durationMinutes: 30,
      type: complaint || "Triage / Walk-In",
      status: AppointmentStatus.ARRIVED,
      triageLevel: isEmergency ? 'Level 2: Acute Pain/Swelling' : 'Level 3: Appliance/Maintenance',
    };
    handleSaveAppointment(newAppointment);

    setIsQuickTriageModalOpen(false);
    toast.success(`Patient ${name} added to triage queue.`);
  };
  
  const renderRoute = () => {
    const path = route.path;
    switch (path) {
      case 'dashboard': return <Dashboard appointments={appointments} patients={patients} currentUser={currentUser} onAddPatient={() => setIsPatientModalOpen(true)} onPatientSelect={handlePatientSelect} onAddAppointment={handleAddAppointment} onUpdateAppointmentStatus={handleUpdateApptStatusWithSafety} onCompleteRegistration={(id) => { setEditingPatient(patients.find(p=>p.id===id) || null); setIsPatientModalOpen(true);}} onQuickQueue={() => setIsQuickTriageModalOpen(true)} onQuickAddPatient={() => setIsQuickAddPatientOpen(true)} staff={staff} onNavigateToQueue={(queue) => navigateTo(`admin/${queue}`)} currentBranch={currentBranch} />;
      case 'schedule': return <CalendarView appointments={appointments} staff={staff} onAddAppointment={handleAddAppointment} onMoveAppointment={handleMoveAppointment} onUpdateAppointmentStatus={handleUpdateApptStatusWithSafety} onPatientSelect={handlePatientSelect} currentUser={currentUser} patients={patients} currentBranch={currentBranch} fieldSettings={fieldSettings} onPrefillNote={(entry) => { setPrefillNote(entry); navigateTo(`patients/${entry.patientId}`); }} />;
      case 'patients': return (
          <div className="flex h-full gap-6">
            <div className={`${selectedPatientId ? 'w-28' : 'w-1/3'} transition-all duration-500`}><PatientList patients={patients} selectedPatientId={selectedPatientId} onSelectPatient={handlePatientSelect} onAddPatient={() => setIsPatientModalOpen(true)} fieldSettings={fieldSettings} isCollapsed={!!selectedPatientId} /></div>
            <div className="flex-1"><PatientDetailView patient={selectedPatient} appointments={appointments} staff={staff} currentUser={currentUser} onQuickUpdatePatient={handleSavePatient} onBookAppointment={(id) => handleAddAppointment(undefined,undefined,id)} onEditPatient={(p) => { setEditingPatient(p); setIsPatientModalOpen(true); }} fieldSettings={fieldSettings} logAction={data.logAction} incidents={incidents} onSaveIncident={data.handleSaveIncident} referrals={referrals} onSaveReferral={data.handleSaveReferral} onBack={() => handlePatientSelect(null)} governanceTrack={governanceTrack} onOpenRevocationModal={(p,c) => setRevocationTarget({patient:p, category:c})} onOpenMedicoLegalExport={(p) => setMedicoLegalPatient(p)} readOnly={isAuditLogVerified === false} sterilizationCycles={data.sterilizationCycles} prefill={prefillNote} onClearPrefill={() => setPrefillNote(null)} onRequestProtocolOverride={(rule, cont) => { setOverrideRule(rule); setOverrideContinuation(() => cont); setIsProtocolOverrideOpen(true); }} onDeleteClinicalNote={data.handleDeleteClinicalNote} onInitiateFinancialConsent={handleInitiateFinancialConsent} onSupervisorySeal={data.handleSupervisorySeal} onRecordPaymentWithReceipt={data.handleRecordPaymentWithReceipt} /></div>
          </div>);
      case 'admin': 
        if (!isAdmin) { navigateTo('dashboard'); return null; }
        return <AdminHub onNavigate={(tab) => navigateTo(tab)} adminQueue={route.param} setAdminQueue={(q) => navigateTo(q ? `admin/${q}` : 'admin')} appointments={appointments} patients={patients} syncConflicts={syncConflicts} onVerifyDowntimeEntry={handleVerifyDowntimeEntry} onVerifyMedHistory={handleVerifyMedHistory} onConfirmFollowUp={handleConfirmFollowUp} onEditPatient={(p) => { setEditingPatient(p); setIsPatientModalOpen(true); }} onClearProfessionalismReview={()=>{}} incidents={incidents} onResolveIncident={()=>{}} />;
      case 'field-mgmt': 
        if (!isAdmin) { navigateTo('dashboard'); return null; }
        return <FieldManagement settings={fieldSettings} onUpdateSettings={handleUpdateSettings} auditLogVerified={isAuditLogVerified} staff={staff} auditLog={auditLog} patients={patients} onPurgePatient={data.handlePurgePatient} encryptionKey={null} appointments={appointments} currentUser={currentUser} onStartImpersonating={handleStartImpersonating} onDeactivateStaff={handleDeactivateStaff} onOpenStaffModal={(sm) => { setEditingStaffMember(sm); setIsStaffModalOpen(true); }} />;
      case 'financials': 
        if (!isAdmin) { navigateTo('dashboard'); return null; }
        return <Financials onBack={() => navigateTo('admin')} {...data} />;
      case 'inventory': 
        if (!isAdmin) { navigateTo('dashboard'); return null; }
        return <Inventory onBack={() => navigateTo('admin')} {...data} />;
      case 'recall': 
        if (!isAdmin) { navigateTo('dashboard'); return null; }
        return <RecallCenter onBack={() => navigateTo('admin')} {...data} />;
      case 'referrals': 
        if (!isAdmin) { navigateTo('dashboard'); return null; }
        return <ReferralManager onBack={() => navigateTo('admin')} {...data} />;
      case 'roster': 
        if (!isAdmin) { navigateTo('dashboard'); return null; }
        return <RosterView onBack={() => navigateTo('admin')} {...data} />;
      case 'leave': 
        if (!isAdmin) { navigateTo('dashboard'); return null; }
        return <LeaveAndShiftManager onBack={() => navigateTo('admin')} {...data} />;
      default: return <Dashboard appointments={appointments} patients={patients} currentUser={currentUser} onAddPatient={() => setIsPatientModalOpen(true)} onPatientSelect={handlePatientSelect} onAddAppointment={handleAddAppointment} onUpdateAppointmentStatus={handleUpdateApptStatusWithSafety} onCompleteRegistration={()=>{}} onQuickQueue={()=>{}} onQuickAddPatient={()=>{}} staff={staff} onNavigateToQueue={()=>{}} currentBranch={currentBranch} />;
    }
  };

  if (isInKioskMode) return <KioskView patients={patients} onUpdatePatient={handleSavePatient} onExitKiosk={() => setIsInKioskMode(false)} fieldSettings={fieldSettings} />;

  return (
    <>
      {isSessionLocked && <LockScreen onUnlock={() => setIsSessionLocked(false)} />}
      <Layout activeTab={route.path} setActiveTab={navigateTo} onAddAppointment={() => handleAddAppointment()} currentUser={currentUser} onSwitchUser={setCurrentUser} staff={staff} currentBranch={currentBranch} availableBranches={fieldSettings.branches} onChangeBranch={setCurrentBranch} fieldSettings={fieldSettings} onGenerateReport={()=>{}} onEnterKioskMode={() => setIsInKioskMode(true)} impersonatingUser={originalUser} onStopImpersonating={handleStopImpersonating} notifications={[]} onNotificationClick={()=>{}} isProfileOpen={isProfileOpen} onOpenProfile={() => setIsProfileOpen(true)} onCloseProfile={() => setIsProfileOpen(false)} tasks={tasks} onAddTask={(text, isUrgent, assignedTo) => handleAddTask(text, isUrgent, assignedTo)} onToggleTask={handleToggleTask} isOnline={isOnline} pendingSyncCount={offlineQueue.length} systemStatus={systemStatus} onSwitchSystemStatus={setSystemStatus} onStartCashSession={() => data.handleStartCashSession(0, currentBranch)} onCloseCashSession={() => { const s = cashSessions.find(cs => cs.branch === currentBranch && cs.status === 'Open'); if (s) data.handleCloseCashSession(s.id); }} >
        {renderRoute()}
      </Layout>
      <AppointmentModal isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} patients={patients} staff={staff} appointments={appointments} onSave={handleSaveAppointment} onAddToWaitlist={data.handleAddToWaitlist} initialDate={bookingDate} initialTime={bookingTime} initialPatientId={initialBookingPatientId} existingAppointment={editingAppointment} fieldSettings={fieldSettings} isDowntime={systemStatus === 'DOWNTIME'} currentBranch={currentBranch} onProcedureSafetyCheck={handleProcedureSafetyCheck} onRequestConsent={handleRequestConsent} />
      <PatientRegistrationModal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} onSave={handleSavePatient} initialData={editingPatient} fieldSettings={fieldSettings} patients={patients} />
      <QuickTriageModal 
        isOpen={isQuickTriageModalOpen} 
        onClose={() => setIsQuickTriageModalOpen(false)} 
        onSave={handleQuickTriageSave}
      />
      <QuickAddPatientModal 
        isOpen={isQuickAddPatientOpen} 
        onClose={() => setIsQuickAddPatientOpen(false)} 
        onSave={handleQuickAddPatientSave}
      />
      {isSafetyTimeoutOpen && safetyTimeoutPatient && <SafetyTimeoutModal patient={safetyTimeoutPatient} onConfirm={() => setIsSafetyTimeoutOpen(false)} />}
      {isPostOpHandoverOpen && postOpAppointment && <PostOpHandoverModal isOpen={isPostOpHandoverOpen} appointment={postOpAppointment} onClose={() => setIsPostOpHandoverOpen(false)} onConfirm={handlePostOpConfirm} />}
      {isMedicoLegalExportOpen && medicoLegalPatient && <MedicoLegalExportModal isOpen={isMedicoLegalExportOpen} onClose={() => setIsMedicoLegalExportOpen(false)} patient={medicoLegalPatient} staff={staff} logAction={data.logAction} />}
      {isPrivacyRevocationOpen && revocationTarget && <PrivacyRevocationModal isOpen={isPrivacyRevocationOpen} onClose={() => setIsPrivacyRevocationOpen(false)} patient={revocationTarget.patient} category={revocationTarget.category} onConfirm={(reason, notes) => data.handleConfirmRevocation(revocationTarget.patient, revocationTarget.category, reason, notes)} />}
      {isProtocolOverrideOpen && overrideRule && <ProtocolOverrideModal isOpen={isProtocolOverrideOpen} rule={overrideRule} onCancel={() => setIsProtocolOverrideOpen(false)} onConfirm={(reason) => { if(overrideContinuation) overrideContinuation(); setIsProtocolOverrideOpen(false); }} />}
      <SafetyAlertModal isOpen={isSafetyAlertOpen} onClose={() => setIsSafetyAlertOpen(false)} {...safetyAlertConfig} />
      {isClearanceModalOpen && clearancePatient && <ClearanceModal isOpen={isClearanceModalOpen} onClose={() => setIsClearanceModalOpen(false)} patient={clearancePatient} currentUser={currentUser} onSave={() => {}} />}
      {consentRequest && <ConsentCaptureModal isOpen={!!consentRequest} onClose={() => setConsentRequest(null)} patient={consentRequest.patient} appointment={consentRequest.appointment} onSave={handleConfirmConsent} provider={staff.find(s => s.id === consentRequest.appointment.providerId)} template={fieldSettings.consentFormTemplates[0]} procedure={fieldSettings.procedures.find(p => p.name === consentRequest.appointment.type)} />}
      {financialConsentInfo && <FinancialConsentModal isOpen={!!financialConsentInfo} onClose={() => setFinancialConsentInfo(null)} patient={financialConsentInfo.patient} plan={financialConsentInfo.plan} planItems={(financialConsentInfo.patient.dentalChart || []).filter(item => item.planId === financialConsentInfo.plan.id)} onSave={handleConfirmFinancialConsent} />}
      {isStaffModalOpen && <UserProfileModal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} user={editingStaffMember || {}} onSave={handleSaveStaff} fieldSettings={fieldSettings} />}
      <GeminiAssistant patientContext={geminiPatientContext} />
    </>
  );
}

export default App;

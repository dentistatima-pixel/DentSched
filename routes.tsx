
import React, { useMemo, Suspense } from 'react';
import { Dashboard } from './components/Dashboard';
// FIX: CalendarView is a default export, not a named export.
import CalendarView from './components/CalendarView';
import { PatientList } from './components/PatientList';
// FIX: FieldManagement is a default export, not a named export.
import FieldManagement from './components/FieldManagement';
import { AdminHub } from './components/AdminHub';
// FIX: Financials is a named export, not a default export.
import { Financials } from './components/Financials';
// FIX: Inventory is a default export, not a named export.
import Inventory from './components/Inventory';
// FIX: RecallCenter is a default export, not a named export.
import RecallCenter from './components/RecallCenter';
// FIX: ReferralManager is a default export, not a named export.
import ReferralManager from './components/ReferralManager';
// FIX: RosterView is a default export, not a named export.
import RosterView from './components/RosterView';
// FIX: LeaveAndShiftManager is a default export, not a named export.
import LeaveAndShiftManager from './components/LeaveAndShiftManager';
import { UserRole, ConsentCategory, ClinicalProtocolRule, TreatmentPlan, Patient, TreatmentPlanStatus, Appointment, AppointmentStatus } from './types';

// Import all necessary hooks for the new container components
import { usePatient } from './contexts/PatientContext';
import { useAppointments } from './contexts/AppointmentContext';
import { useStaff } from './contexts/StaffContext';
import { useInventory } from './contexts/InventoryContext';
import { useFinancials } from './contexts/FinancialContext';
import { useAppContext } from './contexts/AppContext';
import { useSettings } from './contexts/SettingsContext';
import { useClinicalOps } from './contexts/ClinicalOpsContext';
import { useModal } from './contexts/ModalContext';
import { useNavigate } from './contexts/RouterContext';
import { PatientListSkeleton, PatientDetailSkeleton } from './skeletons/PatientSkeletons';

export interface RouteConfig {
  path: string;
  component: React.ComponentType<any>;
  requiredRoles?: UserRole[];
  props?: Record<string, any>;
  layout?: React.ComponentType<any>; 
}

const PageLoader: React.FC = () => (
  <div className="h-full w-full flex items-center justify-center bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>
);


// --- CONTAINER COMPONENTS ---

// FIX: Correct lazy import syntax for default exports.
const AnalyticsHub = React.lazy(() => import('./components/Analytics'));
const GovernanceHub = React.lazy(() => import('./components/GovernanceHub'));
const CommunicationHub = React.lazy(() => import('./components/CommunicationHub'));

function CommunicationHubContainer() {
    return <Suspense fallback={<PageLoader />}><CommunicationHub /></Suspense>;
}

function AdminHubContainer({ route }: { route: { param: string | null } }) {
    const navigate = useNavigate();

    const renderAdminPage = () => {
        switch (route.param) {
            case 'financials':
                return <FinancialsContainer route={route} />;
            case 'inventory':
                return <InventoryContainer />;
            case 'analytics':
                return <Suspense fallback={<PageLoader />}><AnalyticsHubContainer /></Suspense>;
            case 'governance':
                return <Suspense fallback={<PageLoader />}><GovernanceHubContainer onNavigate={navigate} /></Suspense>;
            case 'communications':
                return <CommunicationHubContainer />;
            case 'recall':
                return <RecallCenterContainer />;
            case 'referrals':
                return <ReferralManagerContainer />;
            case 'roster':
                return <RosterViewContainer />;
            case 'leave':
                return <LeaveAndShiftManagerContainer />;
            default:
                // If no param, show the main Admin Hub dashboard
                return <AdminHub onNavigate={navigate} />;
        }
    };
    
    return <div className="h-full w-full">{renderAdminPage()}</div>;
}


function AnalyticsHubContainer() {
    const { patients } = usePatient();
    const { appointments } = useAppointments();
    const { fieldSettings } = useSettings();
    const { staff } = useStaff();

    return <AnalyticsHub
        patients={patients}
        appointments={appointments}
        fieldSettings={fieldSettings}
        staff={staff}
    />;
}

function GovernanceHubContainer({ onNavigate }: { onNavigate: (path: string) => void }) {
    const { patients, handleAnonymizePatient: onPurgePatient } = usePatient();
    const { showModal } = useModal();
    const { auditLog, isAuditLogVerified } = useAppContext();
    const { fieldSettings, handleUpdateSettings } = useSettings();
    const { incidents } = useClinicalOps();

    return <GovernanceHub 
        patients={patients}
        showModal={showModal}
        auditLog={auditLog}
        auditLogVerified={isAuditLogVerified}
        settings={fieldSettings}
        onUpdateSettings={handleUpdateSettings}
        onAnonymizePatient={onPurgePatient}
        onBack={() => onNavigate('admin')}
        incidents={incidents}
    />;
}


function FinancialsContainer({ route }: { route: { param: string | null } }) {
    const { 
        hmoClaims, handleSaveHmoClaim, handleUpdateHmoClaimStatus, 
        expenses, handleAddExpense, 
        philHealthClaims, handleUpdatePhilHealthClaim,
        reconciliations, handleSaveReconciliation,
        cashSessions, handleStartCashSession, handleCloseCashSession,
        payrollPeriods, handleAddPayrollPeriod, handleUpdatePayrollPeriod,
        payrollAdjustments, handleAddPayrollAdjustment, handleApproveAdjustment,
        commissionDisputes, handleAddCommissionDispute, handleResolveCommissionDispute
    } = useFinancials();
    const { patients } = usePatient();
    const { appointments } = useAppointments();
    const { fieldSettings } = useSettings();
    const { staff } = useStaff();
    const { currentUser, currentBranch, governanceTrack, setGovernanceTrack } = useAppContext();
    const { incidents } = useClinicalOps();
    const navigate = useNavigate();

    return <Financials 
        claims={hmoClaims} onSaveHmoClaim={handleSaveHmoClaim} onUpdateHmoClaimStatus={handleUpdateHmoClaimStatus}
        expenses={expenses} onAddExpense={handleAddExpense}
        philHealthClaims={philHealthClaims} onUpdatePhilHealthClaim={handleUpdatePhilHealthClaim}
        reconciliations={reconciliations} onSaveReconciliation={handleSaveReconciliation}
        cashSessions={cashSessions} onStartCashSession={(bal) => handleStartCashSession(bal, currentBranch)} onCloseCashSession={handleCloseCashSession}
        payrollPeriods={payrollPeriods} onAddPayrollPeriod={handleAddPayrollPeriod} onUpdatePayrollPeriod={handleUpdatePayrollPeriod}
        payrollAdjustments={payrollAdjustments} onAddPayrollAdjustment={handleAddPayrollAdjustment} onApproveAdjustment={handleApproveAdjustment}
        commissionDisputes={commissionDisputes} onAddCommissionDispute={handleAddCommissionDispute} onResolveCommissionDispute={handleResolveCommissionDispute}
        patients={patients}
        appointments={appointments}
        staff={staff}
        currentUser={currentUser!}
        currentBranch={currentBranch}
        governanceTrack={governanceTrack}
        setGovernanceTrack={setGovernanceTrack}
        onBack={() => navigate('admin')}
        activeSubTab={route.param}
        incidents={incidents}
    />;
}

function InventoryContainer() {
    const { stock, onUpdateStock, sterilizationCycles, handleAddSterilizationCycle, transfers, handlePerformTransfer } = useInventory();
    const { currentUser, currentBranch, logAction } = useAppContext();
    const { fieldSettings, handleUpdateSettings } = useSettings();
    const { patients } = usePatient();
    const { appointments } = useAppointments();
    const navigate = useNavigate();

    return <Inventory 
        stock={stock} onUpdateStock={onUpdateStock}
        sterilizationCycles={sterilizationCycles} onAddCycle={handleAddSterilizationCycle}
        currentUser={currentUser!}
        currentBranch={currentBranch}
        availableBranches={fieldSettings.branches}
        transfers={transfers}
        onPerformTransfer={handlePerformTransfer}
        patients={patients}
        fieldSettings={fieldSettings}
        onUpdateSettings={handleUpdateSettings}
        appointments={appointments}
        logAction={logAction}
        onBack={() => navigate('admin')}
    />;
}

function FieldManagementContainer() {
    const { fieldSettings, handleUpdateSettings } = useSettings();
    const { staff, handleDeactivateStaff } = useStaff();
    const { auditLog, isAuditLogVerified, currentUser, handleStartImpersonating } = useAppContext();
    const { patients, handleAnonymizePatient: handlePurgePatient } = usePatient();
    const { appointments } = useAppointments();
    const { showModal } = useModal();

    return <FieldManagement
        settings={fieldSettings} onUpdateSettings={handleUpdateSettings}
        staff={staff} onDeactivateStaff={handleDeactivateStaff}
        auditLog={auditLog}
        patients={patients} onPurgePatient={handlePurgePatient}
        auditLogVerified={isAuditLogVerified}
        encryptionKey={null} // Placeholder
        appointments={appointments}
        currentUser={currentUser!}
        onStartImpersonating={handleStartImpersonating}
        showModal={showModal}
    />;
}

function RecallCenterContainer() {
    const { patients, handleUpdatePatientRecall } = usePatient();
    const navigate = useNavigate();
    return <RecallCenter 
        patients={patients} 
        onUpdatePatientRecall={handleUpdatePatientRecall}
        onBack={() => navigate('admin')}
    />;
}

function ReferralManagerContainer() {
    const { patients } = usePatient();
    const { referrals, handleSaveReferral } = useClinicalOps();
    const { staff } = useStaff();
    const navigate = useNavigate();
    return <ReferralManager
        patients={patients}
        referrals={referrals}
        onSaveReferral={handleSaveReferral}
        staff={staff}
        onBack={() => navigate('admin')}
    />;
}

function RosterViewContainer() {
    const { staff, handleUpdateStaffRoster } = useStaff();
    const { fieldSettings } = useSettings();
    const { currentUser } = useAppContext();
    const navigate = useNavigate();
    return <RosterView 
        staff={staff}
        fieldSettings={fieldSettings}
        currentUser={currentUser!}
        onUpdateStaffRoster={handleUpdateStaffRoster}
        onBack={() => navigate('admin')}
    />;
}

function LeaveAndShiftManagerContainer() {
    const { staff, leaveRequests, handleAddLeaveRequest, handleApproveLeaveRequest, handleUpdateStaffRoster } = useStaff();
    const { currentUser } = useAppContext();
    const { fieldSettings } = useSettings();
    const navigate = useNavigate();
    return <LeaveAndShiftManager
        staff={staff}
        currentUser={currentUser!}
        leaveRequests={leaveRequests}
        onAddLeaveRequest={handleAddLeaveRequest}
        onApproveLeaveRequest={handleApproveLeaveRequest}
        fieldSettings={fieldSettings}
        onBack={() => navigate('admin')}
        onUpdateStaffRoster={handleUpdateStaffRoster}
    />;
}

export const routes: RouteConfig[] = [
  { path: 'dashboard', component: Dashboard },
  { path: 'schedule', component: CalendarView },
  { path: 'patients', component: PatientList, layout: PatientListLayout },
  { 
    path: 'admin', 
    component: AdminHubContainer, 
    requiredRoles: [UserRole.ADMIN, UserRole.SYSTEM_ARCHITECT] 
  },
  { 
    path: 'field-mgmt', 
    component: FieldManagementContainer, 
    requiredRoles: [UserRole.ADMIN, UserRole.SYSTEM_ARCHITECT] 
  },
];

// Special layout for the patient list/detail view
function PatientListLayout({ route }: { route: { param: string | null } }) {
  const { isLoading: arePatientsLoading } = usePatient();
  const selectedPatientId = route.param;
  const navigate = useNavigate();

  if (arePatientsLoading) {
      return selectedPatientId 
          ? <PatientDetailSkeleton /> 
          : <PatientListSkeleton />;
  }
  
  if (!selectedPatientId) {
    // Full screen patient list view
    return (
      <div className="h-full w-full">
        <PatientList selectedPatientId={null} />
      </div>
    );
  }

  // Full screen detail view when a patient is selected
  return (
    <div className="h-full w-full animate-in fade-in duration-500">
      <PatientDetailContainer patientId={selectedPatientId} onBack={() => navigate('patients')} />
    </div>
  );
}

const PatientPlaceholder = React.lazy(() => import('./components/PatientDetailView').then(module => ({ default: module.PatientPlaceholder })));
// FIX: Correct lazy import syntax for default exports.
const PatientDetailView = React.lazy(() => import('./components/PatientDetailView'));

function PatientDetailContainer({ patientId, onBack }: { patientId: string | null; onBack: () => void; }) {
  const { patients, isLoading, handleSavePatient, handleDeleteClinicalNote, handleSupervisorySeal, handleRecordPaymentWithReceipt, handleApproveFinancialConsent, handleConfirmRevocation } = usePatient();
  const { appointments, handleSaveAppointment, handleUpdateAppointmentStatus } = useAppointments();
  const { staff } = useStaff();
  const { stock, sterilizationCycles } = useInventory();
  const { currentUser, logAction, governanceTrack, isReadOnly, auditLog } = useAppContext();
  const { fieldSettings, handleUpdateSettings } = useSettings();
  const { incidents, referrals, handleSaveIncident, handleSaveReferral, handleAddToWaitlist } = useClinicalOps();
  const { showModal } = useModal();
  
  const patient = useMemo(() => patients.find(p => p.id === patientId) || null, [patients, patientId]);

  if (isLoading) {
    return <PatientDetailSkeleton />;
  }

  if (!patientId || !patient || !currentUser || !fieldSettings) {
    return <Suspense fallback={<PageLoader />}><PatientPlaceholder /></Suspense>;
  }
  
  const onBookAppointment = (pId: string) => showModal('appointment', { 
    initialPatientId: pId, 
    onSave: handleSaveAppointment,
    onAddToWaitlist: handleAddToWaitlist,
    currentBranch: currentUser.defaultBranch
  });
  const onEditPatient = (p: Patient) => showModal('patientRegistration', { initialData: p, onSave: handleSavePatient });
  const onOpenRevocationModal = (p: Patient, category: ConsentCategory) => showModal('privacyRevocation', { patient: p, category, onConfirm: (reason: string, notes: string) => handleConfirmRevocation(p, category, reason, notes) });
  const onRequestProtocolOverride = (rule: ClinicalProtocolRule, continuation: () => void) => showModal('protocolOverride', { rule, onConfirm: (reason: string) => { logAction('SECURITY_ALERT', 'System', patient.id, `Protocol Override: ${rule.name}. Reason: ${reason}`); continuation(); } });
  const onInitiateFinancialConsent = (plan: TreatmentPlan) => {
    showModal('financialConsent', { 
        patient, 
        plan, 
    });
  };
  const onOpenPostOpHandover = (apt: Appointment) => {
    showModal('postOpHandover', { 
        appointment: apt,
        onConfirm: async () => {
            // FIX: Use correct enum member 'COMPLETED'.
            await handleUpdateAppointmentStatus(apt.id, AppointmentStatus.COMPLETED, { postOpVerified: true });
        }
    });
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <PatientDetailView 
        patient={patient}
        appointments={appointments}
        staff={staff}
        stock={stock}
        currentUser={currentUser}
        onQuickUpdatePatient={handleSavePatient}
        onBookAppointment={onBookAppointment}
        onEditPatient={onEditPatient}
        fieldSettings={fieldSettings}
        logAction={logAction}
        incidents={incidents}
        onSaveIncident={handleSaveIncident}
        referrals={referrals}
        onSaveReferral={handleSaveReferral}
        onToggleTimeline={() => {}}
        onBack={onBack}
        governanceTrack={governanceTrack}
        onOpenRevocationModal={onOpenRevocationModal}
        readOnly={isReadOnly}
        sterilizationCycles={sterilizationCycles}
        onUpdateSettings={handleUpdateSettings}
        onRequestProtocolOverride={onRequestProtocolOverride}
        onDeleteClinicalNote={(noteId: string) => handleDeleteClinicalNote(patient.id, noteId)}
        onInitiateFinancialConsent={onInitiateFinancialConsent}
        onSupervisorySeal={(note) => handleSupervisorySeal(patient.id, note)}
        onRecordPaymentWithReceipt={handleRecordPaymentWithReceipt}
        onOpenPostOpHandover={onOpenPostOpHandover}
        auditLog={auditLog}
      />
    </Suspense>
  );
}

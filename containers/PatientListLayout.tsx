import React, { useState, useEffect, Suspense } from 'react';
import { PatientList } from '../components/PatientList';
import { usePatient } from '../contexts/PatientContext';
import { useNavigate } from '../contexts/RouterContext';
import { PatientListSkeleton, PatientDetailSkeleton } from '../skeletons/PatientSkeletons';

// Import all necessary hooks for PatientDetailContainer
import { useAppointments } from '../contexts/AppointmentContext';
import { useStaff } from '../contexts/StaffContext';
import { useInventory } from '../contexts/InventoryContext';
import { useAppContext } from '../contexts/AppContext';
import { useSettings } from '../contexts/SettingsContext';
import { useClinicalOps } from '../contexts/ClinicalOpsContext';
import { useModal } from '../contexts/ModalContext';
import { Patient, ConsentCategory, ClinicalProtocolRule, TreatmentPlan, Appointment, AppointmentStatus } from '../types';


const PatientPlaceholder = React.lazy(() => import('../components/PatientDetailView').then(module => ({ default: module.PatientPlaceholder })));
const PatientDetailView = React.lazy(() => import('../components/PatientDetailView'));

const PageLoader: React.FC = () => (
  <div className="h-full w-full flex items-center justify-center bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>
);

function PatientDetailContainer({ patientId, onBack }: { patientId: string | null; onBack: () => void; }) {
  const { patients, isLoading: arePatientsLoading, handleSavePatient, handleDeleteClinicalNote, handleSupervisorySeal, handleRecordPaymentWithReceipt, handleApproveFinancialConsent, handleConfirmRevocation, handleSaveInformedRefusal, handleVoidNote, handlePatientSignOffOnNote } = usePatient();
  const { appointments, handleSaveAppointment, handleUpdateAppointmentStatus } = useAppointments();
  const { staff } = useStaff();
  const { stock, sterilizationCycles } = useInventory();
  const { currentUser, logAction, governanceTrack, isReadOnly, auditLog } = useAppContext();
  const { fieldSettings, handleUpdateSettings } = useSettings();
  const { incidents, referrals, handleSaveIncident, handleSaveReferral, handleAddToWaitlist } = useClinicalOps();
  const { showModal } = useModal();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  
  useEffect(() => {
    if (patientId) {
      const fetchedPatient = patients.find(p => p.id === patientId);
      setPatient(fetchedPatient || null);
    } else {
      setPatient(null);
    }
  }, [patientId, patients]);

  if (arePatientsLoading) {
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
        onDeleteClinicalNote={(patientId: string, noteId: string) => handleDeleteClinicalNote(patientId, noteId)}
        onInitiateFinancialConsent={onInitiateFinancialConsent}
        onSupervisorySeal={(note) => handleSupervisorySeal(patient.id, note)}
        onRecordPaymentWithReceipt={handleRecordPaymentWithReceipt}
        onOpenPostOpHandover={onOpenPostOpHandover}
        auditLog={auditLog}
      />
    </Suspense>
  );
}


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

export default PatientListLayout;


import React from 'react';

// Lazy load modals to improve initial load time
const AppointmentModal = React.lazy(() => import('./AppointmentModal'));
const PatientRegistrationModal = React.lazy(() => import('./PatientRegistrationModal'));
const QuickTriageModal = React.lazy(() => import('./QuickTriageModal'));
const QuickAddPatientModal = React.lazy(() => import('./QuickAddPatientModal'));
const SafetyTimeoutModal = React.lazy(() => import('./SafetyTimeoutModal'));
const PostOpHandoverModal = React.lazy(() => import('./PostOpHandoverModal'));
const MedicoLegalExportModal = React.lazy(() => import('./MedicoLegalExportModal'));
const PrivacyRevocationModal = React.lazy(() => import('./PrivacyRevocationModal'));
const ProtocolOverrideModal = React.lazy(() => import('./ProtocolOverrideModal'));
const SafetyAlertModal = React.lazy(() => import('./SafetyAlertModal'));
const ClearanceModal = React.lazy(() => import('./ClearanceModal'));
const UserProfileModal = React.lazy(() => import('./UserProfileModal'));
const ConsentCaptureModal = React.lazy(() => import('./ConsentCaptureModal'));
const FinancialConsentModal = React.lazy(() => import('./FinancialConsentModal'));
const ManagePlanContentModal = React.lazy(() => import('./ManagePlanContentModal'));
const ApprovalDashboardModal = React.lazy(() => import('./ApprovalDashboardModal'));
const DailyReportModal = React.lazy(() => import('./Financials').then(module => ({ default: (module as any).DailyReportModal })) );
const InfoDisplayModal = React.lazy(() => import('./InfoDisplayModal'));
const PrintPreviewModal = React.lazy(() => import('./PrintPreviewModal'));
const PreparationChecklistModal = React.lazy(() => import('./PreparationChecklistModal'));
const InformedRefusalModal = React.lazy(() => import('./InformedRefusalModal'));
const PhotoCaptureModal = React.lazy(() => import('./PhotoCaptureModal'));
const QuickCheckInModal = React.lazy(() => import('./QuickCheckInModal'));
const LeadDentistApprovalModal = React.lazy(() => import('./LeadDentistApprovalModal'));
const MedicalHistoryAffirmationModal = React.lazy(() => import('./MedicalHistoryAffirmationModal'));
const VoidNoteModal = React.lazy(() => import('./VoidNoteModal'));
const PatientSignOffModal = React.lazy(() => import('./PatientSignOffModal'));
const EmergencyConsentModal = React.lazy(() => import('./EmergencyConsentModal'));
const EPrescriptionModal = React.lazy(() => import('./EPrescriptionModal'));
const SterilizationVerificationModal = React.lazy(() => import('./SterilizationVerificationModal'));
const DataSubjectRightsModal = React.lazy(() => import('./DataSubjectRightsModal'));
const ShortcutHelpModal = React.lazy(() => import('./ShortcutHelpModal'));
const IncompleteRegistrationModal = React.lazy(() => import('./IncompleteRegistrationModal'));


import { useModal } from '../contexts/ModalContext';

const modalMap: { [key: string]: React.LazyExoticComponent<React.ComponentType<any>> } = {
    appointment: AppointmentModal,
    patientRegistration: PatientRegistrationModal,
    quickTriage: QuickTriageModal,
    quickAddPatient: QuickAddPatientModal,
    safetyTimeout: SafetyTimeoutModal,
    postOpHandover: PostOpHandoverModal,
    medicoLegalExport: MedicoLegalExportModal,
    privacyRevocation: PrivacyRevocationModal,
    protocolOverride: ProtocolOverrideModal,
    safetyAlert: SafetyAlertModal,
    clearance: ClearanceModal,
    userProfile: UserProfileModal,
    consentCapture: ConsentCaptureModal,
    financialConsent: FinancialConsentModal,
    managePlanContent: ManagePlanContentModal,
    approvalDashboard: ApprovalDashboardModal,
    dailyReport: DailyReportModal,
    infoDisplay: InfoDisplayModal,
    printPreview: PrintPreviewModal,
    preparationChecklist: PreparationChecklistModal,
    informedRefusal: InformedRefusalModal,
    photoCapture: PhotoCaptureModal,
    quickCheckIn: QuickCheckInModal,
    leadDentistApproval: LeadDentistApprovalModal,
    medicalHistoryAffirmation: MedicalHistoryAffirmationModal,
    voidNote: VoidNoteModal,
    patientSignOff: PatientSignOffModal,
    emergencyConsent: EmergencyConsentModal,
    ePrescription: EPrescriptionModal,
    sterilizationVerification: SterilizationVerificationModal,
    dataSubjectRights: DataSubjectRightsModal,
    shortcutHelp: ShortcutHelpModal,
    incompleteRegistration: IncompleteRegistrationModal,
};

const ModalManager: React.FC = () => {
    const { modalState, hideModal } = useModal();

    if (!modalState.type) {
        return null;
    }

    const ModalComponent = modalMap[modalState.type];

    if (!ModalComponent) {
        console.warn(`Modal type "${modalState.type}" not found.`);
        return null;
    }
    
    const props = {
        ...modalState.props,
        isOpen: true,
        onClose: hideModal,
    };

    return (
        <React.Suspense fallback={<div className="fixed inset-0 bg-slate-900/50 z-[100]" />}>
            <ModalComponent {...props} />
        </React.Suspense>
    );
};

export default ModalManager;


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
const DailyReportModal = React.lazy(() => import('./Financials').then(module => ({ default: (module as any).DailyReportModal })) );


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
    dailyReport: DailyReportModal,
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
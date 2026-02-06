import React, { Suspense, useContext, useEffect } from 'react';
import { ModalContext } from '../contexts/ModalContext';
import { useAppContext } from '../contexts/AppContext';
import { useFinancials } from '../contexts/FinancialContext';

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
const PayrollAdjustmentModal = React.lazy(() => import('./PayrollAdjustmentModal'));
const SyncQueueModal = React.lazy(() => import('./SyncQueueModal'));
const ReconciliationWizard = React.lazy(() => import('./Financials').then(module => ({ default: (module as any).ReconciliationWizard })) );
const CancellationModal = React.lazy(() => import('./CancellationModal'));


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
    payrollAdjustment: PayrollAdjustmentModal,
    syncQueue: SyncQueueModal,
    reconciliationWizard: ReconciliationWizard,
    cancellation: CancellationModal,
};

const ModalManager: React.FC = () => {
    const context = useContext(ModalContext);
    const { isSyncing, processSyncQueue } = useAppContext();
    const { handleSaveReconciliation } = useFinancials();

    if (!context) return null;
    const { modalStack, closeModal } = context;

    useEffect(() => {
        const visualViewport = window.visualViewport;
        if (!visualViewport) return; // Not supported on all browsers

        let lastFocusedElement: HTMLElement | null = null;
        
        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target;
            if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
                lastFocusedElement = target;
            }
        };

        const handleResize = () => {
            // A common heuristic for keyboard appearance on mobile/tablet
            const isKeyboardVisible = visualViewport.height < window.innerHeight * 0.8;

            document.querySelectorAll('.modal-content-scrollable').forEach(el => {
                if (isKeyboardVisible) {
                    el.classList.add('keyboard-visible');
                } else {
                    el.classList.remove('keyboard-visible');
                }
            });
            
            // After DOM update from class change, scroll the focused element into view
            if (isKeyboardVisible && lastFocusedElement) {
                setTimeout(() => {
                    lastFocusedElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 150); // Small delay to allow layout shift
            }
        };

        if (modalStack.length > 0) {
            window.addEventListener('focusin', handleFocusIn, true);
            visualViewport.addEventListener('resize', handleResize);
        }

        return () => {
            window.removeEventListener('focusin', handleFocusIn, true);
            visualViewport.removeEventListener('resize', handleResize);
            // Clean up class when last modal is closed
            document.querySelectorAll('.modal-content-scrollable').forEach(el => {
                el.classList.remove('keyboard-visible');
            });
        };
    }, [modalStack.length]);


    if (modalStack.length === 0) {
        return null;
    }

    return (
        <>
            {modalStack.map((modalState, index) => {
                const ModalComponent = modalMap[modalState.type];
                if (!ModalComponent) {
                    console.warn(`Modal type "${modalState.type}" not found.`);
                    return null;
                }

                const isTopModal = index === modalStack.length - 1;
                const stackDepth = modalStack.length - 1 - index;

                let extraProps: any = {};
                if (modalState.type === 'syncQueue') {
                    extraProps.isSyncing = isSyncing;
                    extraProps.onForceSync = processSyncQueue;
                }
                if (modalState.type === 'reconciliationWizard') {
                    extraProps.onSave = handleSaveReconciliation;
                }

                const props = {
                    ...modalState.props,
                    ...extraProps,
                    isOpen: true,
                    onClose: isTopModal ? closeModal : () => {}, // Only top modal can be closed directly
                };
                
                const wrapperStyle: React.CSSProperties = {
                    position: 'fixed',
                    inset: 0,
                    zIndex: 100 + index,
                    transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), filter 300ms ease-out',
                    pointerEvents: isTopModal ? 'auto' : 'none',
                };

                if (!isTopModal) {
                    wrapperStyle.transform = `scale(${1 - stackDepth * 0.04}) translateY(${stackDepth * -20}px)`;
                    wrapperStyle.filter = `blur(${stackDepth * 2}px) brightness(0.95)`;
                }

                return (
                    <div key={`${modalState.type}-${index}`} style={wrapperStyle}>
                        <Suspense fallback={<div className="fixed inset-0 bg-slate-900/50 z-[100]" />}>
                            <ModalComponent {...props} />
                        </Suspense>
                    </div>
                );
            })}
        </>
    );
};

export default ModalManager;

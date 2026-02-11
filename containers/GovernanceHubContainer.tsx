import React, { Suspense } from 'react';
import { usePatient } from '../contexts/PatientContext';
import { useModal } from '../contexts/ModalContext';
import { useAppContext } from '../contexts/AppContext';
import { useSettings } from '../contexts/SettingsContext';
import { useClinicalOps } from '../contexts/ClinicalOpsContext';

const GovernanceHub = React.lazy(() => import('../components/GovernanceHub'));

const PageLoader: React.FC = () => (
  <div className="h-full w-full flex items-center justify-center bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>
);

function GovernanceHubContainer({ onNavigate }: { onNavigate: (path: string) => void }) {
    const { patients, handleAnonymizePatient: onPurgePatient } = usePatient();
    const { showModal } = useModal();
    const { auditLog, isAuditLogVerified } = useAppContext();
    const { fieldSettings, handleUpdateSettings } = useSettings();
    const { incidents } = useClinicalOps();

    return (
        <Suspense fallback={<PageLoader />}>
            <GovernanceHub 
                patients={patients}
                showModal={showModal}
                auditLog={auditLog}
                auditLogVerified={isAuditLogVerified}
                settings={fieldSettings}
                onUpdateSettings={handleUpdateSettings}
                onAnonymizePatient={onPurgePatient}
                onBack={() => onNavigate('admin')}
                incidents={incidents}
            />
        </Suspense>
    );
}

export default GovernanceHubContainer;

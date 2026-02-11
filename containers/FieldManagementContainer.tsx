import React from 'react';
import FieldManagement from '../components/FieldManagement';
import { useSettings } from '../contexts/SettingsContext';
import { useStaff } from '../contexts/StaffContext';
import { useAppContext } from '../contexts/AppContext';
import { usePatient } from '../contexts/PatientContext';
import { useAppointments } from '../contexts/AppointmentContext';
import { useModal } from '../contexts/ModalContext';

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

export default FieldManagementContainer;

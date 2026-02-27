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
    const { auditLog, isAuditLogVerified, currentUser } = useAppContext();
    const { patients, handleAnonymizePatient: handlePurgePatient } = usePatient();
    const { appointments } = useAppointments();
    const { showModal } = useModal();

    return <FieldManagement
        settings={fieldSettings} onUpdateSettings={handleUpdateSettings}
        auditLog={auditLog}
        patients={patients} onPurgePatient={handlePurgePatient}
        auditLogVerified={isAuditLogVerified}
        encryptionKey={null} // Placeholder
        appointments={appointments}
        currentUser={currentUser!}
        showModal={showModal}
    />;
}

export default FieldManagementContainer;

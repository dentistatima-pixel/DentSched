import FieldManagement from '../components/FieldManagement';
import { useSettings } from '../contexts/SettingsContext';
import { useAppContext } from '../contexts/AppContext';
import { usePatient } from '../contexts/PatientContext';
import { useAppointments } from '../contexts/AppointmentContext';
import { useModal } from '../contexts/ModalContext';
import { useInventory } from '../contexts/InventoryContext';

function FieldManagementContainer() {
    const { fieldSettings, handleUpdateSettings } = useSettings();
    const { auditLog, isAuditLogVerified, currentUser } = useAppContext();
    const { patients, handleAnonymizePatient: handlePurgePatient } = usePatient();
    const { appointments } = useAppointments();
    const { showModal } = useModal();
    const { stock, onUpdateStock } = useInventory();

    return <FieldManagement
        settings={fieldSettings} onUpdateSettings={handleUpdateSettings}
        auditLog={auditLog}
        patients={patients} onPurgePatient={handlePurgePatient}
        auditLogVerified={isAuditLogVerified}
        encryptionKey={null} // Placeholder
        appointments={appointments}
        currentUser={currentUser!}
        showModal={showModal}
        stock={stock}
        onUpdateStock={onUpdateStock}
    />;
}

export default FieldManagementContainer;

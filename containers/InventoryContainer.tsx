import React from 'react';
import Inventory from '../components/Inventory';
import { useInventory } from '../contexts/InventoryContext';
import { useAppContext } from '../contexts/AppContext';
import { useSettings } from '../contexts/SettingsContext';
import { usePatient } from '../contexts/PatientContext';
import { useAppointments } from '../contexts/AppointmentContext';
import { useNavigate } from '../contexts/RouterContext';

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

export default InventoryContainer;

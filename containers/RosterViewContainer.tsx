import React from 'react';
import RosterView from '../components/RosterView';
import { useStaff } from '../contexts/StaffContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAppContext } from '../contexts/AppContext';
import { useNavigate } from '../contexts/RouterContext';

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

export default RosterViewContainer;

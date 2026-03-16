import RosterView from '../components/RosterView';
import { useStaff } from '../contexts/StaffContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAppContext } from '../contexts/AppContext';

function RosterViewContainer() {
    const { staff, handleUpdateStaffRoster } = useStaff();
    const { fieldSettings } = useSettings();
    const { currentUser } = useAppContext();
    return <RosterView 
        staff={staff}
        fieldSettings={fieldSettings}
        currentUser={currentUser!}
        onUpdateStaffRoster={handleUpdateStaffRoster}
    />;
}

export default RosterViewContainer;
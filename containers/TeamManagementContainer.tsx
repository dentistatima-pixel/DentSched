import TeamManagement from '../components/TeamManagement';
import { useStaff } from '../contexts/StaffContext';
import { useAppContext } from '../contexts/AppContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate } from '../contexts/RouterContext';

function TeamManagementContainer() {
    const { staff, leaveRequests, handleAddLeaveRequest, handleApproveLeaveRequest, handleUpdateStaffRoster } = useStaff();
    const { currentUser } = useAppContext();
    const { fieldSettings } = useSettings();
    const navigate = useNavigate();
    
    return <TeamManagement
        staff={staff}
        currentUser={currentUser!}
        leaveRequests={leaveRequests}
        onAddLeaveRequest={handleAddLeaveRequest}
        onApproveLeaveRequest={handleApproveLeaveRequest}
        fieldSettings={fieldSettings}
        onUpdateStaffRoster={handleUpdateStaffRoster}
        onBack={() => navigate('admin')}
    />;
}

export default TeamManagementContainer;
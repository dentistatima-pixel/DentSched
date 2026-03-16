import LeaveAndShiftManager from '../components/LeaveAndShiftManager';
import { useStaff } from '../contexts/StaffContext';
import { useAppContext } from '../contexts/AppContext';
import { useSettings } from '../contexts/SettingsContext';


function LeaveAndShiftManagerContainer() {
    const { staff, leaveRequests, handleAddLeaveRequest, handleApproveLeaveRequest, handleUpdateStaffRoster } = useStaff();
    const { currentUser } = useAppContext();
    const { fieldSettings } = useSettings();
    return <LeaveAndShiftManager
        staff={staff}
        currentUser={currentUser!}
        leaveRequests={leaveRequests}
        onAddLeaveRequest={handleAddLeaveRequest}
        onApproveLeaveRequest={handleApproveLeaveRequest}
        fieldSettings={fieldSettings}
        onUpdateStaffRoster={handleUpdateStaffRoster}
    />;
}

export default LeaveAndShiftManagerContainer;
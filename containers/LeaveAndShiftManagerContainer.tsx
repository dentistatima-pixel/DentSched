import React from 'react';
import LeaveAndShiftManager from '../components/LeaveAndShiftManager';
import { useStaff } from '../contexts/StaffContext';
import { useAppContext } from '../contexts/AppContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate } from '../contexts/RouterContext';


function LeaveAndShiftManagerContainer() {
    const { staff, leaveRequests, handleAddLeaveRequest, handleApproveLeaveRequest, handleUpdateStaffRoster } = useStaff();
    const { currentUser } = useAppContext();
    const { fieldSettings } = useSettings();
    const navigate = useNavigate();
    return <LeaveAndShiftManager
        staff={staff}
        currentUser={currentUser!}
        leaveRequests={leaveRequests}
        onAddLeaveRequest={handleAddLeaveRequest}
        onApproveLeaveRequest={handleApproveLeaveRequest}
        fieldSettings={fieldSettings}
        onBack={() => navigate('admin')}
        onUpdateStaffRoster={handleUpdateStaffRoster}
    />;
}

export default LeaveAndShiftManagerContainer;

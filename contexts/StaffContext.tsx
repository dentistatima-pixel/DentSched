
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { User, LeaveRequest, UserRole } from '../types';
import { STAFF, generateUid } from '../constants';
import { useToast } from '../components/ToastSystem';
import { useAppContext } from './AppContext';

interface StaffContextType {
    staff: User[];
    leaveRequests: LeaveRequest[];
    handleSaveStaff: (staffData: User) => Promise<void>;
    handleDeactivateStaff: (userId: string) => Promise<void>;
    handleUpdateStaffRoster: (staffId: string, day: string, branch: string) => Promise<void>;
    handleAddLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'staffName' | 'status'>) => Promise<void>;
    handleApproveLeaveRequest: (id: string, approve: boolean) => Promise<void>;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export const StaffProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    const { currentUser } = useAppContext();
    const [staff, setStaff] = useState<User[]>(STAFF);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    
    const scopedStaff = useMemo(() => {
        if (!currentUser) return [];

        const allowedRoles = [UserRole.ADMIN, UserRole.SYSTEM_ARCHITECT];
        if (allowedRoles.includes(currentUser.role)) {
            return staff; // Admins/Architects see everything
        }

        // Other roles see a stripped-down version of other users' profiles
        return staff.map(s => {
            if (s.id === currentUser.id) return s; // Users can see their own full profile
            
            const { pin, commissionRate, s2License, s2Expiry, tin, payoutHandle, ...rest } = s;
            const publicProfile: User = rest;
            return publicProfile;
        });
    }, [staff, currentUser]);

    const createAsyncHandler = <T extends any[]>(handler: (...args: T) => void, successMsg?: string) => {
        return async (...args: T): Promise<void> => {
            try {
                handler(...args);
                if (successMsg) toast.success(successMsg);
            } catch (e: any) {
                toast.error(e.message || "An unexpected error occurred.");
            }
        };
    };
    
    const value = {
        staff: scopedStaff,
        leaveRequests,
        handleSaveStaff: createAsyncHandler((staffData: User) => setStaff(s => { const isNew = !s.some(i => i.id === staffData.id); return isNew ? [...s, {...staffData, id: staffData.id || generateUid('staff')}] : s.map(i => i.id === staffData.id ? staffData : i); }), "Staff saved."),
        handleDeactivateStaff: createAsyncHandler((userId: string) => setStaff(s => s.map(u => u.id === userId ? { ...u, status: 'Inactive' } : u)), "Staff deactivated."),
        handleUpdateStaffRoster: createAsyncHandler((staffId: string, day: string, branch: string) => setStaff(s => s.map(u => u.id === staffId ? { ...u, roster: { ...u.roster, [day]: branch }} : u))),
        handleAddLeaveRequest: createAsyncHandler((request: Omit<LeaveRequest, 'id' | 'staffName' | 'status'>) => { const staffName = staff.find(s => s.id === request.staffId)?.name || 'Unknown'; setLeaveRequests(l => [...l, {id: generateUid('leave'), staffName, status: 'Pending', ...request}]); }, "Leave request submitted."),
        handleApproveLeaveRequest: createAsyncHandler((id: string, approve: boolean) => setLeaveRequests(l => l.map(r => r.id === id ? { ...r, status: approve ? 'Approved' : 'Rejected' } : r))),
    };
    
    return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
};

export const useStaff = () => {
    const context = useContext(StaffContext);
    if (context === undefined) {
        throw new Error('useStaff must be used within a StaffProvider');
    }
    return context;
};

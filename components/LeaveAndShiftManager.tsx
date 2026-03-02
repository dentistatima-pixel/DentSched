
import React from 'react';
import { LeaveRequest, User, FieldSettings, UserRole } from '../types';
import { Check, X, Plus, UserX, ArrowLeft, User as UserIcon } from 'lucide-react';
import { formatDate } from '../constants';

interface LeaveAndShiftManagerProps {
    staff: User[];
    currentUser: User;
    leaveRequests: LeaveRequest[];
    onAddLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'staffName' | 'status'>) => void;
    onApproveLeaveRequest: (id: string, approve: boolean) => void;
    fieldSettings: FieldSettings;
    onBack?: () => void;
    onUpdateStaffRoster?: (staffId: string, day: string, branch: string) => void; // For Roster management
}

const LeaveAndShiftManager: React.FC<LeaveAndShiftManagerProps> = ({ staff, currentUser, leaveRequests, onApproveLeaveRequest, fieldSettings, onBack, onUpdateStaffRoster }) => {
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dentists = staff.filter(s => s.role === UserRole.DENTIST);

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500 pb-24">
            <div className="flex items-center gap-4">
                {onBack && (
                  <button onClick={onBack} className="bg-white p-4 rounded-full shadow-sm border hover:bg-slate-100 transition-all active:scale-90" aria-label="Back to Admin Hub">
                      <ArrowLeft size={24} className="text-slate-600"/>
                  </button>
                )}
                <div className="bg-rose-600 p-4 rounded-3xl text-white shadow-xl"><UserX size={36} /></div>
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">Leave & Shift Management</h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Staff Availability & Roster Integrity</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-3 space-y-8">
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Pending Leave Requests</h3>
                            {!isAdmin && <button onClick={() => {}} className="bg-teal-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2"><Plus size={16}/> Submit Request</button>}
                        </div>
                        <div className="space-y-3">
                            {leaveRequests.filter(r => r.status === 'Pending').map(req => (
                                <div key={req.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white p-3 rounded-lg shadow-sm text-slate-500">
                                            <UserIcon size={24} />
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-800 text-sm uppercase tracking-tight">{req.staffName}</div>
                                            <div className="text-xs font-bold text-slate-500 mt-1">{req.type} Leave: {formatDate(req.startDate)} - {formatDate(req.endDate)}</div>
                                        </div>
                                    </div>
                                    {isAdmin && (
                                        <div className="flex gap-2">
                                            <button onClick={() => onApproveLeaveRequest(req.id, false)} className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-200 transition-all"><X size={20}/></button>
                                            <button onClick={() => onApproveLeaveRequest(req.id, true)} className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center hover:bg-teal-200 transition-all"><Check size={20}/></button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {leaveRequests.filter(r => r.status === 'Pending').length === 0 && <p className="text-center text-sm text-slate-400 font-bold p-10 italic">No pending requests.</p>}
                        </div>
                    </div>
                    
                    {/* Shift Management Section */}
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-6">Weekly Shift Roster</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[800px]">
                                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-500 tracking-[0.2em]">
                                    <tr>
                                        <th className="p-5 text-left">Practitioner</th>
                                        {weekDays.map(day => <th key={day} className="p-5 text-center">{day}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {dentists.map(dentist => (
                                        <tr key={dentist.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full border-2 border-white shadow bg-teal-100 text-teal-700 flex items-center justify-center">
                                                        <UserIcon size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 uppercase tracking-tight">{dentist.name}</div>
                                                        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">{dentist.specialization}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            {weekDays.map(day => {
                                                const assignment = dentist.roster?.[day];
                                                return (
                                                    <td key={day} className="p-5 text-center">
                                                        <select
                                                            value={assignment || 'Off'}
                                                            onChange={(e) => onUpdateStaffRoster?.(dentist.id, day, e.target.value)}
                                                            className="bg-white border border-slate-200 rounded-lg p-2 text-[10px] font-bold uppercase tracking-tight focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                                        >
                                                            <option value="Off">Day Off</option>
                                                            {fieldSettings.branches.map(branch => (
                                                                <option key={branch} value={branch}>{branch}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaveAndShiftManager;

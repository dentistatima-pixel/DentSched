import React, { useState, useMemo } from 'react';
import { LeaveRequest, User, FieldSettings, UserRole } from '../types';
import { Calendar, Check, X, Plus, Send, ShieldCheck, Sun, Moon, Briefcase, UserX, UserCheck, ArrowLeft, Phone } from 'lucide-react';
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

const LeaveAndShiftManager: React.FC<LeaveAndShiftManagerProps> = ({ staff, currentUser, leaveRequests, onAddLeaveRequest, onApproveLeaveRequest, fieldSettings, onBack, onUpdateStaffRoster }) => {
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [newRequest, setNewRequest] = useState({
        type: 'Vacation' as LeaveRequest['type'],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: ''
    });

    const isAdmin = currentUser.role === UserRole.ADMIN;
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dentists = staff.filter(s => s.role === UserRole.DENTIST);

    const handleSubmitRequest = () => {
        onAddLeaveRequest({
            ...newRequest,
            staffId: currentUser.id
        });
        setShowRequestForm(false);
    };

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
                            {!isAdmin && <button onClick={() => setShowRequestForm(true)} className="bg-teal-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2"><Plus size={16}/> Submit Request</button>}
                        </div>
                        <div className="space-y-3">
                            {leaveRequests.filter(r => r.status === 'Pending').map(req => (
                                <div key={req.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white p-3 rounded-lg shadow-sm"><img src={staff.find(s=>s.id === req.staffId)?.avatar} className="w-8 h-8 rounded-full" /></div>
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
                                                    <img src={dentist.avatar} alt={dentist.name} className="w-10 h-10 rounded-full border-2 border-white shadow" />
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
                                                            disabled={!isAdmin}
                                                        >
                                                            <option value="Off">Day Off</option>
                                                            {fieldSettings.branches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
                                                        </select>
                                                        {isAdmin && 
                                                            <label className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-500">
                                                                <input type="checkbox" className="w-4 h-4 rounded" /> On Call
                                                            </label>
                                                        }
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {showRequestForm && (
                        <div className="bg-white p-8 rounded-[3rem] border-2 border-teal-100 shadow-2xl space-y-6 animate-in zoom-in-95">
                             <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Submit Leave Request</h3>
                             <div className="grid grid-cols-2 gap-4">
                                <div><label className="label text-xs">Type</label><select value={newRequest.type} onChange={e => setNewRequest({...newRequest, type: e.target.value as any})} className="input"><option>Vacation</option><option>Sick</option><option>Conference</option><option>Emergency</option></select></div>
                                <div><label className="label text-xs">Start Date</label><input type="date" value={newRequest.startDate} onChange={e => setNewRequest({...newRequest, startDate: e.target.value})} className="input"/></div>
                                <div><label className="label text-xs">End Date</label><input type="date" value={newRequest.endDate} onChange={e => setNewRequest({...newRequest, endDate: e.target.value})} className="input"/></div>
                             </div>
                             <div><label className="label text-xs">Reason (Optional)</label><textarea value={newRequest.reason} onChange={e => setNewRequest({...newRequest, reason: e.target.value})} className="input h-24"/></div>
                             <div className="flex gap-4"><button onClick={() => setShowRequestForm(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase">Cancel</button><button onClick={handleSubmitRequest} className="flex-1 py-3 bg-teal-600 text-white rounded-xl text-xs font-black uppercase">Submit</button></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeaveAndShiftManager;
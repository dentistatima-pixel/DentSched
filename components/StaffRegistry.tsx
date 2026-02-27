import React, { useState } from 'react';
import { User } from '../types';
import { ShieldAlert, UserX, Plus, Edit2, Trash2 } from 'lucide-react';
import { useModal } from '../contexts/ModalContext';

interface StaffRegistryProps {
    staff: User[];
    onStartImpersonating: (user: User) => void;
    initialTab?: string;
    onDeactivateStaff: (userId: string) => void;
    onDeleteStaff?: (userId: string) => void;
    onOpenStaffModal: (staffMember: Partial<User> | null) => void;
}

const StaffRegistry: React.FC<StaffRegistryProps> = ({ staff, onStartImpersonating, onDeactivateStaff, onDeleteStaff, onOpenStaffModal }) => {
    const { showModal } = useModal();
    
    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
             <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Staff Management</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">View staff registry and manage system privileges.</p>
            </div>
            
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold">Clinician Registry</h4>
                    <button onClick={() => onOpenStaffModal(null)} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                        <Plus size={16}/> New Staff Member
                    </button>
                </div>
                <div className="space-y-2">
                    {staff.map(user => (
                        <div key={user.id} className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${user.status === 'Inactive' ? 'bg-slate-200' : 'bg-slate-50 group'}`}>
                            <div className="flex-1">
                                <div className={`font-bold text-sm ${user.status === 'Inactive' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{user.name}</div>
                                <div className="text-xs text-slate-500">{user.role} {user.status === 'Inactive' && <span className="font-black text-red-600">(INACTIVE)</span>}</div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onOpenStaffModal(user)} className="p-2 bg-white text-slate-500 rounded-lg hover:bg-blue-100 hover:text-blue-700" title="Edit Profile">
                                    <Edit2 size={16} />
                                </button>
                                {user.status !== 'Inactive' ? (
                                    <button
                                        onClick={() => {
                                            showModal('confirm', {
                                                title: 'Deactivate Account',
                                                message: `Are you sure you want to deactivate ${user.name}'s account? They will lose all system access.`,
                                                confirmText: 'Deactivate',
                                                isDestructive: true,
                                                onConfirm: () => onDeactivateStaff(user.id)
                                            });
                                        }}
                                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                        title="Deactivate Account"
                                    >
                                        <UserX size={16} />
                                    </button>
                                ) : (
                                    onDeleteStaff && (
                                        <button
                                            onClick={() => {
                                                showModal('confirm', {
                                                    title: 'Permanently Delete User',
                                                    message: `PERMANENT ACTION: Are you sure you want to DELETE ${user.name}? This cannot be undone.`,
                                                    confirmText: 'Delete Permanently',
                                                    isDestructive: true,
                                                    onConfirm: () => onDeleteStaff(user.id)
                                                });
                                            }}
                                            className="p-2 bg-slate-300 text-slate-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                                            title="Permanently Delete User"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border-2 border-amber-200 shadow-lg space-y-4">
                <div className="flex items-center gap-3 text-amber-800 font-black uppercase text-xs tracking-widest border-b border-amber-200 pb-3 mb-4">
                    <ShieldAlert size={20} />
                    Privilege Elevation
                </div>
                <p className="text-xs text-amber-900 font-bold">Impersonate another user for testing or support. All actions will be logged under your authority.</p>
                <div className="flex flex-wrap gap-2">
                    {staff.map(user => (
                        <button 
                            key={user.id} 
                            onClick={() => onStartImpersonating(user)} 
                            disabled={user.status === 'Inactive'}
                            className="flex items-center gap-2 p-2 pr-4 bg-amber-200 hover:bg-amber-300 rounded-full text-xs font-bold text-amber-950 transition-colors disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                        >
                            <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full"/>
                            Impersonate {user.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StaffRegistry;
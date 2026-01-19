import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { User as UserIcon, Key, ShieldAlert } from 'lucide-react';
import { useToast } from './ToastSystem';

interface StaffRegistryProps {
    staff: User[];
    onStartImpersonating: (user: User) => void;
    initialTab?: string;
}

const StaffRegistry: React.FC<StaffRegistryProps> = ({ staff, onStartImpersonating, initialTab }) => {
    const [activeTab, setActiveTab] = useState(initialTab || 'staff');
    
    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
             <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Staff Management</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">View staff registry and manage system privileges.</p>
            </div>
            
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <h4 className="font-bold mb-4">Clinician Registry</h4>
                <div className="space-y-2">
                    {staff.map(user => (
                        <div key={user.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                            <div>
                                <div className="font-bold text-sm text-slate-800">{user.name}</div>
                                <div className="text-xs text-slate-500">{user.role}</div>
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
                            className="flex items-center gap-2 p-2 pr-4 bg-amber-100 hover:bg-amber-200 rounded-full text-xs font-bold text-amber-800 transition-colors"
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

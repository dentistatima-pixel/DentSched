import React from 'react';
import { BarChart2, ShieldCheck, DollarSign, Package, Users, History, Send, UserX, Users2, LayoutGrid, ArrowLeft } from 'lucide-react';
import { useNavigate } from '../contexts/RouterContext';

interface AdminLayoutProps {
    children: React.ReactNode;
    activePage: string;
}

const adminSections = [
    { id: 'hub', title: 'Admin Hub', icon: LayoutGrid },
    { id: 'analytics', title: 'Analytics', icon: BarChart2 },
    { id: 'governance', title: 'Governance', icon: ShieldCheck },
    { id: 'financials', title: 'Financials', icon: DollarSign },
    { id: 'inventory', title: 'Inventory', icon: Package },
    { id: 'roster', title: 'Roster', icon: Users },
    { id: 'familygroups', title: 'Family Groups', icon: Users2 },
    { id: 'recall', title: 'Recall', icon: History },
    { id: 'referrals', title: 'Referrals', icon: Send },
    { id: 'leave', title: 'Leave', icon: UserX },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activePage }) => {
    const navigate = useNavigate();

    return (
        <div className="h-full flex">
            <nav className="w-64 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col p-4">
                <div className="p-4 mb-4">
                     <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Admin</h2>
                </div>
                <div className="space-y-1">
                    {adminSections.map(section => (
                        <button 
                            key={section.id} 
                            onClick={() => navigate(section.id === 'hub' ? 'admin' : `admin/${section.id}`)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-bold text-sm transition-colors ${activePage === section.id ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                            <section.icon size={18} />
                            {section.title}
                        </button>
                    ))}
                </div>
                <div className="mt-auto">
                    <button onClick={() => navigate('dashboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-bold text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                        <ArrowLeft size={18} />
                        Exit Admin
                    </button>
                </div>
            </nav>
            <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900">
                {children}
            </main>
        </div>
    );
};
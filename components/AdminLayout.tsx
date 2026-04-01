import React from 'react';
import { BarChart2, ShieldCheck, DollarSign, Package, Users, Users2, ArrowLeft } from 'lucide-react';
import { useNavigate } from '../contexts/RouterContext';

interface AdminLayoutProps {
    children: React.ReactNode;
    activePage: string;
}

const adminSections = [
    { id: 'analytics', title: 'Analytics', icon: BarChart2 },
    { id: 'governance', title: 'Compliance', icon: ShieldCheck },
    { id: 'financials', title: 'Finance', icon: DollarSign },
    { id: 'inventory', title: 'Inventory', icon: Package },
    { id: 'team-management', title: 'Team', icon: Users },
    { id: 'patient-engagement', title: 'Patients', icon: Users2 },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activePage }) => {
    const navigate = useNavigate();

    return (
        <div className="h-full flex flex-col">
            <nav className="w-full bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 py-2 gap-2 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1">
                    {adminSections.map(section => (
                        <button 
                            key={section.id} 
                            onClick={() => navigate(`admin/${section.id}`)}
                            className={`whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${activePage === section.id ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                            <section.icon size={16} />
                            {section.title}
                        </button>
                    ))}
                </div>
                <div className="ml-auto">
                    <button onClick={() => navigate('dashboard')} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                        <ArrowLeft size={16} />
                        Back
                    </button>
                </div>
            </nav>
            <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900">
                {children}
            </main>
        </div>
    );
};
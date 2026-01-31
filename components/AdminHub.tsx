import React from 'react';
import { BarChart2, ShieldCheck, DollarSign, Package, Users, History, Send, UserX } from 'lucide-react';

interface AdminHubProps {
  onNavigate: (path: string) => void;
}

export const AdminHub: React.FC<AdminHubProps> = ({ onNavigate }) => {
  const adminSections = [
    { id: 'analytics', title: 'Analytics Hub', description: 'View performance dashboards and generate reports.', icon: BarChart2, color: 'bg-teal-600' },
    { id: 'governance', title: 'Governance Hub', description: 'Manage compliance, audit trails, and legal forms.', icon: ShieldCheck, color: 'bg-lilac-600' },
    { id: 'financials', title: 'Financials', description: 'Handle claims, expenses, and reconciliation.', icon: DollarSign, color: 'bg-emerald-600' },
    { id: 'inventory', title: 'Inventory', description: 'Manage stock levels and sterilization cycles.', icon: Package, color: 'bg-blue-600' },
    { id: 'roster', title: 'Staff Roster', description: 'View and manage weekly staff assignments.', icon: Users, color: 'bg-sky-600' },
    { id: 'recall', title: 'Recall Center', description: 'Manage patient recall and retention workflows.', icon: History, color: 'bg-rose-600' },
    { id: 'referrals', title: 'Referral Hub', description: 'Track incoming and outgoing patient referrals.', icon: Send, color: 'bg-amber-600' },
    { id: 'leave', title: 'Leave Requests', description: 'Approve or reject staff leave applications.', icon: UserX, color: 'bg-violet-600' },
  ];

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">Admin Control Center</h1>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Practice-wide Oversight & Management Queues</p>
      </div>

      <div className="grid gap-8 admin-hub-grid">
        {adminSections.map(section => (
          <button 
            key={section.id} 
            onClick={() => onNavigate(`admin/${section.id}`)}
            className="bg-white p-6 rounded-[2rem] border-4 border-white shadow-lg text-left group hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-400/10 transition-all duration-300"
          >
            <div className={`p-4 rounded-2xl text-white inline-block shadow-lg ${section.color}`}>
              <section.icon size={28} />
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-800 uppercase tracking-tighter">{section.title}</h3>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">{section.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
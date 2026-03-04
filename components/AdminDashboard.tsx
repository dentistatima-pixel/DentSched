
import React, { useState } from 'react';
import { BarChart2, ShieldCheck, DollarSign, Package, Users, History, Send, UserX, Users2, Activity } from 'lucide-react';
import InspectorPanel from './InspectorPanel';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [showSystemInspector, setShowSystemInspector] = useState(false);

  const adminSections = [
    { id: 'analytics', title: 'Analytics', description: 'View performance dashboards and generate reports.', icon: BarChart2, color: 'bg-teal-600' },
    { id: 'governance', title: 'Compliance', description: 'Manage compliance, audit trails, and legal forms.', icon: ShieldCheck, color: 'bg-lilac-600' },
    { id: 'financials', title: 'Finance', description: 'Handle claims, expenses, and reconciliation.', icon: DollarSign, color: 'bg-emerald-600' },
    { id: 'inventory', title: 'Supplies', description: 'Manage stock levels.', icon: Package, color: 'bg-blue-600' },
    { id: 'roster', title: 'Roster', description: 'View and manage weekly staff assignments.', icon: Users, color: 'bg-sky-600' },
    { id: 'familygroups', title: 'Family Groups', description: 'Manage family units and shared accounts.', icon: Users2, color: 'bg-pink-600' },
    { id: 'recall', title: 'Recall', description: 'Manage patient recall and retention workflows.', icon: History, color: 'bg-rose-600' },
    { id: 'referrals', title: 'Referrals', description: 'Track incoming and outgoing patient referrals.', icon: Send, color: 'bg-amber-600' },
    { id: 'leave', title: 'Leave', description: 'Approve or reject staff leave applications.', icon: UserX, color: 'bg-violet-600' },
  ];

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">Admin</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Manage your practice settings, staff, and workflows.</p>
        </div>
        <button 
          onClick={() => setShowSystemInspector(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-colors"
        >
          <Activity size={16} /> System Inspector
        </button>
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
      
      {showSystemInspector && (
        <InspectorPanel 
          inspected={null} 
          mode="system" 
          onClose={() => setShowSystemInspector(false)} 
        />
      )}
    </div>
  );
};

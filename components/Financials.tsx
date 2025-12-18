
import React, { useState, useMemo } from 'react';
import { DollarSign, FileText, Package, BarChart2, Heart, CheckCircle, Clock, Edit2, TrendingUp, Award, UserCheck, Briefcase } from 'lucide-react';
import { HMOClaim, Expense, PhilHealthClaim, Patient, Appointment, FieldSettings, PhilHealthClaimStatus, User, UserRole, AppointmentStatus, HMOClaimStatus } from '../types';
import Analytics from './Analytics';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';

interface FinancialsProps {
  claims: HMOClaim[];
  expenses: Expense[];
  philHealthClaims?: PhilHealthClaim[];
  patients?: Patient[];
  appointments?: Appointment[];
  fieldSettings?: FieldSettings;
  staff?: User[];
  currentUser: User;
  onUpdatePhilHealthClaim?: (updatedClaim: PhilHealthClaim) => void;
}

const Financials: React.FC<FinancialsProps> = ({ claims, expenses, philHealthClaims = [], patients = [], appointments = [], fieldSettings, staff, currentUser, onUpdatePhilHealthClaim }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'claims' | 'philhealth' | 'productivity' | 'expenses'>('analytics');

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'productivity', label: 'My Productivity', icon: Award },
    { id: 'claims', label: 'HMO Claims', icon: Heart },
    { id: 'philhealth', label: 'PhilHealth', icon: FileText },
    { id: 'expenses', label: 'Expenses', icon: Package },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics': return <Analytics patients={patients} appointments={appointments} fieldSettings={fieldSettings} staff={staff} />;
      case 'productivity': return <ProductivityTab appointments={appointments || []} currentUser={currentUser} fieldSettings={fieldSettings} />;
      case 'philhealth': return <PhilHealthClaimsTab claims={philHealthClaims} patients={patients} onUpdateClaim={onUpdatePhilHealthClaim} />;
      case 'claims': return <HMOClaimsTab claims={claims} patients={patients} />;
      default: return <div className="p-10 text-center text-slate-400 italic">Interface for this financial group is under development.</div>;
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex-shrink-0"><div className="flex items-center gap-3"><div className="bg-emerald-100 p-3 rounded-2xl text-emerald-700 shadow-sm"><DollarSign size={32} /></div><div><h1 className="text-3xl font-bold text-slate-800">Financial Command Center</h1><p className="text-slate-500">Practice economics and professional productivity.</p></div></div></header>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
        <div className="flex border-b border-slate-200 px-4 shrink-0 bg-slate-50/50">
            {tabs.map(tab => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`py-4 px-5 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><tab.icon size={16} /> {tab.label}</button>
            ))}
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">{renderContent()}</div>
      </div>
    </div>
  );
};

const ProductivityTab: React.FC<{appointments: Appointment[], currentUser: User, fieldSettings?: FieldSettings}> = ({ appointments, currentUser, fieldSettings }) => {
    const commissionRate = 0.30; 
    
    const myStats = useMemo(() => {
        const completed = appointments.filter(a => a.providerId === currentUser.id && a.status === AppointmentStatus.COMPLETED);
        let production = 0;
        const mix: Record<string, number> = {};

        completed.forEach(apt => {
            const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
            const price = proc?.price || 0;
            production += price;
            mix[apt.type] = (mix[apt.type] || 0) + 1;
        });

        return { completedCount: completed.length, production, commission: production * commissionRate, mix: Object.entries(mix).sort((a,b) => b[1] - a[1]) };
    }, [appointments, currentUser.id, fieldSettings]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4"><div className="p-3 bg-blue-100 text-blue-700 rounded-xl"><Briefcase size={24}/></div><div><p className="text-xs font-bold text-slate-400 uppercase">Completed Procedures</p><p className="text-3xl font-extrabold text-slate-800">{myStats.completedCount}</p></div></div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4"><div className="p-3 bg-teal-100 text-teal-700 rounded-xl"><TrendingUp size={24}/></div><div><p className="text-xs font-bold text-slate-400 uppercase">Total Production</p><p className="text-3xl font-extrabold text-slate-800">₱{myStats.production.toLocaleString()}</p></div></div>
                <div className="bg-white p-6 rounded-2xl border border-teal-100 shadow-lg shadow-teal-600/5 flex items-center gap-4 ring-2 ring-teal-500/20"><div className="p-3 bg-teal-600 text-white rounded-xl"><Award size={24}/></div><div><p className="text-xs font-bold text-teal-600 uppercase">Estimated Earnings</p><p className="text-3xl font-extrabold text-teal-700">₱{myStats.commission.toLocaleString()}</p><p className="text-[10px] text-slate-400 italic">Based on {commissionRate*100}% collection</p></div></div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg"><UserCheck size={18} className="text-teal-600"/> Clinical Case Mix</h3>
                <div className="space-y-4">
                    {myStats.mix.map(([name, count]) => {
                        const percentage = (count / myStats.completedCount) * 100;
                        return (
                            <div key={name} className="flex items-center gap-4">
                                <div className="w-40 text-sm font-bold text-slate-600 truncate">{name}</div>
                                <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden"><div className="bg-teal-500 h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}/></div>
                                <div className="w-12 text-right text-xs font-bold text-slate-800">{count}x</div>
                            </div>
                        );
                    })}
                    {myStats.completedCount === 0 && <p className="text-center text-slate-400 py-10 italic">No clinical data recorded for this period.</p>}
                </div>
            </div>
        </div>
    );
}

const PhilHealthClaimsTab: React.FC<{ claims: PhilHealthClaim[], patients: Patient[], onUpdateClaim?: (c: PhilHealthClaim) => void }> = ({ claims, patients, onUpdateClaim }) => {
    const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'Unknown';
    const getStatusChip = (status: PhilHealthClaimStatus) => {
        switch(status) {
            case PhilHealthClaimStatus.PAID: return <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10}/> Paid</span>;
            case PhilHealthClaimStatus.IN_PROCESS: return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Clock size={10}/> In Process</span>;
            case PhilHealthClaimStatus.SUBMITTED: return <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Submitted</span>;
            default: return <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>;
        }
    }
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs"><tr className="divide-x divide-slate-100"><th className="p-4">Patient</th><th className="p-4">Procedure</th><th className="p-4">Date Submitted</th><th className="p-4 text-right">Amount Claimed</th><th className="p-4 text-center">Status</th><th className="p-4"></th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                    {claims.length > 0 ? claims.map(claim => (
                        <tr key={claim.id} className="group hover:bg-slate-50/50"><td className="p-4 font-bold text-slate-800">{getPatientName(claim.patientId)}</td><td className="p-4">{claim.procedureName}</td><td className="p-4 text-slate-500 font-mono text-xs">{formatDate(claim.dateSubmitted)}</td><td className="p-4 text-right font-mono font-bold">₱{claim.amountClaimed.toLocaleString()}</td><td className="p-4 text-center">{getStatusChip(claim.status)}</td><td className="p-4"><button className="opacity-0 group-hover:opacity-100 bg-slate-100 p-1.5 rounded text-slate-500 hover:bg-slate-200 transition-all"><Edit2 size={14}/></button></td></tr>
                    )) : <tr><td colSpan={6} className="p-10 text-center text-slate-400 italic">No PhilHealth claims recorded.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}

// NEW: HMO Claims Tab
const HMOClaimsTab: React.FC<{ claims: HMOClaim[], patients: Patient[] }> = ({ claims, patients }) => {
    const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'Unknown';
    const getStatusChip = (status: HMOClaimStatus) => {
        switch(status) {
            case HMOClaimStatus.PAID: return <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10}/> Paid</span>;
            case HMOClaimStatus.PENDING: return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Clock size={10}/> Pending</span>;
            case HMOClaimStatus.REJECTED: return <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Rejected</span>;
            default: return <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>;
        }
    }
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs"><tr className="divide-x divide-slate-100"><th className="p-4">Patient</th><th className="p-4">Provider</th><th className="p-4">Procedure</th><th className="p-4">Date Submitted</th><th className="p-4 text-right">Amount Claimed</th><th className="p-4 text-center">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                    {claims.length > 0 ? claims.map(claim => (
                        <tr key={claim.id} className="group hover:bg-slate-50/50"><td className="p-4 font-bold text-slate-800">{getPatientName(claim.patientId)}</td><td className="p-4 font-bold text-blue-700">{claim.hmoProvider}</td><td className="p-4">{claim.procedureName}</td><td className="p-4 text-slate-500 font-mono text-xs">{formatDate(claim.dateSubmitted)}</td><td className="p-4 text-right font-mono font-bold">₱{claim.amountClaimed.toLocaleString()}</td><td className="p-4 text-center">{getStatusChip(claim.status)}</td></tr>
                    )) : <tr><td colSpan={6} className="p-10 text-center text-slate-400 italic">No HMO claims recorded.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}

export default Financials;

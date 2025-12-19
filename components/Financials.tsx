
import React, { useState, useMemo } from 'react';
import { DollarSign, FileText, Package, BarChart2, Heart, CheckCircle, Clock, Edit2, TrendingUp, Award, UserCheck, Briefcase, Calculator, ShieldCheck, AlertCircle, History, Download, Receipt, User as UserIcon, Filter, PieChart, Calendar, AlertTriangle, ChevronRight, User } from 'lucide-react';
/* FIX: Added UserRole to imports */
import { HMOClaim, Expense, PhilHealthClaim, Patient, Appointment, FieldSettings, User as StaffUser, AppointmentStatus, ReconciliationRecord, LedgerEntry, TreatmentPlanStatus, UserRole } from '../types';
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
  staff?: StaffUser[];
  currentUser: StaffUser;
  onUpdatePhilHealthClaim?: (updatedClaim: PhilHealthClaim) => void;
  reconciliations?: ReconciliationRecord[];
  onSaveReconciliation?: (record: ReconciliationRecord) => void;
  currentBranch: string;
}

const Financials: React.FC<FinancialsProps> = ({ 
    claims, expenses, philHealthClaims = [], patients = [], appointments = [], fieldSettings, staff, currentUser, 
    onUpdatePhilHealthClaim, reconciliations = [], onSaveReconciliation, currentBranch 
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'reconciliation' | 'aging' | 'payroll' | 'compliance' | 'claims' | 'philhealth' | 'expenses'>('analytics');

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'reconciliation', label: 'Cash Reconciliation', icon: Calculator },
    { id: 'aging', label: 'Debt Aging', icon: Clock },
    { id: 'payroll', label: 'Staff Payroll', icon: Award },
    { id: 'compliance', label: 'BIR Compliance', icon: ShieldCheck },
    { id: 'claims', label: 'HMO Claims', icon: Heart },
    { id: 'philhealth', label: 'PhilHealth', icon: FileText },
    { id: 'expenses', label: 'Expenses', icon: Package },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics': return <Analytics patients={patients} appointments={appointments} fieldSettings={fieldSettings} staff={staff} />;
      case 'reconciliation': return <CashReconciliationTab patients={patients} currentBranch={currentBranch} currentUser={currentUser} reconciliations={reconciliations} onSave={onSaveReconciliation} />;
      case 'payroll': return <PayrollTab appointments={appointments || []} staff={staff || []} expenses={expenses} fieldSettings={fieldSettings} />;
      case 'compliance': return <BIRComplianceTab patients={patients} currentBranch={currentBranch} />;
      case 'aging': return <DebtAgingTab patients={patients} />;
      case 'philhealth': return <PhilHealthClaimsTab claims={philHealthClaims} patients={patients} onUpdateClaim={onUpdatePhilHealthClaim} />;
      case 'claims': return <HMOClaimsTab claims={claims} patients={patients} />;
      default: return <div className="p-10 text-center text-slate-400 italic">Interface for this financial group is under development.</div>;
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex-shrink-0 flex justify-between items-start">
          <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-700 shadow-sm"><DollarSign size={32} /></div>
              <div><h1 className="text-3xl font-bold text-slate-800">Practice Economics</h1><p className="text-slate-500">Clinical production and growth metrics.</p></div>
          </div>
          <div className="flex gap-2">
              <TreatmentAcceptanceCard patients={patients || []} />
          </div>
      </header>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
        <div className="flex border-b border-slate-200 px-4 shrink-0 bg-slate-50/50 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`py-4 px-5 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><tab.icon size={16} /> {tab.label}</button>
            ))}
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">{renderContent()}</div>
      </div>
    </div>
  );
};

const DebtAgingTab: React.FC<{ patients: Patient[] }> = ({ patients }) => {
    const report = useMemo(() => {
        const groups = { current: [] as Patient[], thirty: [] as Patient[], sixty: [] as Patient[], ninety: [] as Patient[] };
        const now = new Date();
        patients.filter(p => (p.currentBalance || 0) > 0).forEach(p => {
            const oldestUnpaid = p.ledger?.find(e => e.type === 'Charge');
            if (!oldestUnpaid) { groups.current.push(p); return; }
            const diff = Math.ceil((now.getTime() - new Date(oldestUnpaid.date).getTime()) / (1000 * 3600 * 24));
            if (diff > 90) groups.ninety.push(p);
            else if (diff > 60) groups.sixty.push(p);
            else if (diff > 30) groups.thirty.push(p);
            else groups.current.push(p);
        });
        return groups;
    }, [patients]);

    const GroupSection = ({ title, list, color }: { title: string, list: Patient[], color: string }) => (
        <div className="space-y-4">
            <h4 className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg inline-block ${color}`}>{title} ({list.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {list.length > 0 ? list.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-teal-500 transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                            <div><div className="font-bold text-slate-800">{p.name}</div><div className="text-[10px] text-slate-400 font-bold uppercase">ID: {p.id}</div></div>
                            <span className="text-lg font-black text-red-600">₱{p.currentBalance?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold border-t border-slate-50 pt-3 mt-1">
                            <span className="text-slate-400 uppercase">Oldest Debt: {formatDate(p.ledger?.find(e => e.type === 'Charge')?.date)}</span>
                            <ChevronRight size={14} className="text-slate-200 group-hover:text-teal-500"/>
                        </div>
                    </div>
                )) : <div className="col-span-full py-6 text-center text-slate-300 italic text-sm">No accounts in this category.</div>}
            </div>
        </div>
    );

    return (
        <div className="space-y-12">
            <div className="bg-teal-900 p-8 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl shadow-teal-900/20">
                <div className="flex items-center gap-4"><div className="p-4 bg-teal-800 rounded-2xl"><Clock size={32}/></div><div><h3 className="text-2xl font-bold">Debt Aging Analysis</h3><p className="text-teal-300 text-sm">Manage Practice Receivables & Outstanding Promissory Notes.</p></div></div>
                <div className="bg-teal-800/50 p-6 rounded-2xl border border-teal-700 text-center"><div className="text-[10px] font-black uppercase text-teal-400 tracking-widest mb-1">Total Outstanding</div><div className="text-3xl font-black">₱{patients.reduce((s, p) => s + (p.currentBalance || 0), 0).toLocaleString()}</div></div>
            </div>
            <GroupSection title="90+ Days (Critical)" list={report.ninety} color="bg-red-100 text-red-700" />
            <GroupSection title="60-90 Days" list={report.sixty} color="bg-orange-100 text-orange-700" />
            <GroupSection title="30-60 Days" list={report.thirty} color="bg-amber-100 text-amber-700" />
            <GroupSection title="Current (0-30 Days)" list={report.current} color="bg-teal-100 text-teal-700" />
        </div>
    );
};

const TreatmentAcceptanceCard: React.FC<{ patients: Patient[] }> = ({ patients }) => {
    const acceptance = useMemo(() => {
        let totalPlanned = 0;
        let totalCompletedFromPlan = 0;
        patients.forEach(p => {
            p.dentalChart?.forEach(item => {
                if (item.status === 'Planned') totalPlanned++;
                if (item.status === 'Completed' && item.planId) totalCompletedFromPlan++;
            });
        });
        return totalPlanned > 0 ? Math.round((totalCompletedFromPlan / (totalPlanned + totalCompletedFromPlan)) * 100) : 0;
    }, [patients]);

    return (
        <div className="bg-white p-3 rounded-2xl border border-teal-200 shadow-sm flex items-center gap-4 animate-in slide-in-from-right-4 duration-700">
            <div className="relative w-12 h-12">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={126} strokeDashoffset={126 - (126 * acceptance) / 100} className="text-teal-600" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-teal-700">{acceptance}%</div>
            </div>
            <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Treatment Acceptance</div>
                <div className="text-sm font-black text-slate-800 uppercase mt-1">Case Conversion</div>
            </div>
        </div>
    );
};

const PayrollTab: React.FC<{ appointments: Appointment[], staff: StaffUser[], expenses: Expense[], fieldSettings?: FieldSettings }> = ({ appointments, staff, expenses, fieldSettings }) => {
    const dentists = staff.filter(s => s.role === UserRole.DENTIST);
    
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-6 flex items-center gap-2"><Award className="text-teal-600"/> Provider Multi-Split Commission Statement</h3>
                <div className="space-y-4">
                    {dentists.map(dentist => {
                        const commissionRate = dentist.commissionRate || 0.30;
                        const completed = appointments.filter(a => a.providerId === dentist.id && a.status === AppointmentStatus.COMPLETED);
                        let grossProduction = 0;
                        completed.forEach(apt => {
                            const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
                            grossProduction += (proc?.price || 0);
                        });

                        const labFees = expenses.filter(e => e.staffId === dentist.id && e.category === 'Lab Fee').reduce((s, e) => s + e.amount, 0);
                        const netBase = grossProduction - labFees;
                        const commission = netBase * commissionRate;

                        return (
                            <div key={dentist.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <img src={dentist.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                                    <div>
                                        <div className="font-bold text-slate-800">{dentist.name}</div>
                                        <div className="text-[10px] font-bold text-teal-600 uppercase tracking-tighter">Split Rule: {commissionRate * 100}% of Net</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                    <div><div className="text-[10px] font-bold text-slate-400 uppercase">Gross</div><div className="font-bold text-slate-700">₱{grossProduction.toLocaleString()}</div></div>
                                    <div><div className="text-[10px] font-bold text-slate-400 uppercase">Lab Fees</div><div className="font-bold text-red-600">-(₱{labFees.toLocaleString()})</div></div>
                                    <div><div className="text-[10px] font-bold text-slate-400 uppercase">Net Base</div><div className="font-black text-slate-800">₱{netBase.toLocaleString()}</div></div>
                                    <div className="bg-teal-600 text-white p-2 rounded-xl text-center shadow-lg shadow-teal-600/20"><div className="text-[9px] font-bold uppercase opacity-80">Payout</div><div className="text-lg font-black leading-tight">₱{commission.toLocaleString()}</div></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const BIRComplianceTab: React.FC<{ patients: Patient[], currentBranch: string }> = ({ patients, currentBranch }) => {
    const toast = useToast();

    const handleExportCAS = (type: 'Sales' | 'VAT') => {
        let csv = type === 'Sales' ? "Date,OR Number,Patient Name,Gross Amount,VAT,Net Amount,VAT Exempt\n" : "TIN,Supplier,Invoice No,Gross,VAT,Net\n";
        patients.forEach(p => {
            p.ledger?.filter(e => e.type === 'Payment' || e.type === 'Charge').forEach(e => {
                if (e.type === 'Payment' && e.orNumber) {
                     const vat = e.isVatExempt ? 0 : e.amount * 0.12;
                     const net = e.amount - vat;
                     csv += `${e.date},${e.orNumber},${p.name},${e.amount},${vat.toFixed(2)},${net.toFixed(2)},${e.isVatExempt ? 'YES' : 'NO'}\n`;
                }
            });
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `BIR_CAS_${type}_${currentBranch.replace(' ', '_')}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        toast.success(`BIR ${type} Report generated.`);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck size={120}/></div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">BIR Computerized Accounting (CAS)</h3>
                <p className="text-sm text-slate-500 mb-8 max-w-xl">Generate audit-ready reports for your Philippine clinic compliance. Handles Split PF/Materials and Senior/PWD Exemption logic.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-teal-50 border border-teal-100 flex flex-col justify-between group hover:bg-teal-100 transition-all">
                        <div><div className="p-3 bg-white rounded-xl text-teal-600 shadow-sm w-fit mb-4"><Receipt size={24}/></div><h4 className="font-bold text-teal-900">Summary of Sales</h4></div>
                        <button onClick={() => handleExportCAS('Sales')} className="mt-6 w-full py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2"><Download size={18}/> Export CSV</button>
                    </div>
                    <div className="p-6 rounded-2xl bg-lilac-50 border border-lilac-100 flex flex-col justify-between group hover:bg-lilac-100 transition-all">
                        <div><div className="p-3 bg-white rounded-xl text-lilac-600 shadow-sm w-fit mb-4"><Filter size={24}/></div><h4 className="font-bold text-lilac-900">VAT Relief Report</h4></div>
                        <button onClick={() => handleExportCAS('VAT')} className="mt-6 w-full py-3 bg-lilac-600 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2"><Download size={18}/> Export CSV</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CashReconciliationTab: React.FC<{ patients: Patient[], currentBranch: string, currentUser: StaffUser, reconciliations: ReconciliationRecord[], onSave?: (r: ReconciliationRecord) => void }> = ({ patients, currentBranch, currentUser, reconciliations, onSave }) => {
    const toast = useToast();
    const [cash, setCash] = useState('');
    const [card, setCard] = useState('');
    const [ewallet, setEWallet] = useState('');
    const [notes, setNotes] = useState('');

    const today = new Date().toISOString().split('T')[0];
    const isAlreadyFinalized = reconciliations.some(r => r.date === today && r.branch === currentBranch);

    const expectedFromLedger = useMemo(() => {
        let total = 0;
        patients.forEach(p => {
            p.ledger?.forEach(entry => {
                if (entry.date === today && entry.type === 'Payment' && (!entry.branch || entry.branch === currentBranch)) {
                    total += entry.amount;
                }
            });
        });
        return total;
    }, [patients, today, currentBranch]);

    const actualTotal = (parseFloat(cash) || 0) + (parseFloat(card) || 0) + (parseFloat(ewallet) || 0);
    const discrepancy = actualTotal - expectedFromLedger;

    const handleFinalize = () => {
        if (!onSave || isAlreadyFinalized) return;
        const record: ReconciliationRecord = {
            id: `recon_${Date.now()}`, date: today, branch: currentBranch, expectedTotal: expectedFromLedger, actualCash: parseFloat(cash) || 0, actualCard: parseFloat(card) || 0, actualEWallet: parseFloat(ewallet) || 0, discrepancy, notes, verifiedBy: currentUser.name, timestamp: new Date().toISOString()
        };
        onSave(record);
        setCash(''); setCard(''); setEWallet(''); setNotes('');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-700 flex items-center gap-2"><Calculator size={20} className="text-teal-600"/> Reconcile: {currentBranch}</h3><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{today}</span></div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6"><div className="text-xs font-bold text-slate-500 uppercase">System Expected Total</div><div className="text-3xl font-black text-slate-800">₱{expectedFromLedger.toLocaleString()}</div></div>
                        <div className="space-y-3">
                            <input type="number" value={cash} onChange={e => setCash(e.target.value)} disabled={isAlreadyFinalized} className="w-full p-3 border rounded-xl font-mono font-bold" placeholder="Physical Cash" />
                            <input type="number" value={card} onChange={e => setCard(e.target.value)} disabled={isAlreadyFinalized} className="w-full p-3 border rounded-xl font-mono font-bold" placeholder="POS Terminal" />
                            <input type="number" value={ewallet} onChange={e => setEWallet(e.target.value)} disabled={isAlreadyFinalized} className="w-full p-3 border rounded-xl font-mono font-bold" placeholder="E-Wallet" />
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                        <div><div className="text-xs font-bold text-slate-400 uppercase">Discrepancy</div><div className={`text-xl font-black ${discrepancy === 0 ? 'text-green-600' : 'text-red-600'}`}>₱{discrepancy.toLocaleString()}</div></div>
                        <button onClick={handleFinalize} disabled={isAlreadyFinalized} className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all ${isAlreadyFinalized ? 'bg-slate-100 text-slate-400' : 'bg-teal-600 text-white shadow-teal-600/20'}`}><ShieldCheck size={20}/> {isAlreadyFinalized ? 'Finalized' : 'Finalize'}</button>
                    </div>
                </div>
                <div className="bg-slate-900 rounded-2xl p-6 text-white"><h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-teal-400"><History size={18}/> Verification History</h3><div className="space-y-3 overflow-y-auto max-h-[300px]">{reconciliations.length > 0 ? reconciliations.map(r => (<div key={r.id} className="bg-white/5 border border-white/10 p-4 rounded-xl"><div className="flex justify-between font-bold"><span>{formatDate(r.date)}</span><span className={r.discrepancy === 0 ? 'text-green-400' : 'text-red-400'}>{r.discrepancy === 0 ? 'BALANCED' : `MISSING: ₱${Math.abs(r.discrepancy)}`}</span></div></div>)) : <div className="text-center py-10 opacity-20 italic">No records found.</div>}</div></div>
            </div>
        </div>
    );
};

const PhilHealthClaimsTab: React.FC<{ claims: PhilHealthClaim[], patients: Patient[], onUpdateClaim?: (c: PhilHealthClaim) => void }> = ({ claims, patients }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs"><tr><th className="p-4">Patient</th><th className="p-4">Procedure</th><th className="p-4">Date</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{claims.length > 0 ? claims.map(claim => (<tr key={claim.id} className="hover:bg-slate-50/50"><td className="p-4 font-bold text-slate-800">{patients.find(p => p.id === claim.patientId)?.name}</td><td className="p-4">{claim.procedureName}</td><td className="p-4 text-slate-500 font-mono text-xs">{formatDate(claim.dateSubmitted)}</td><td className="p-4 text-right font-mono font-bold">₱{claim.amountClaimed.toLocaleString()}</td><td className="p-4 text-center">{String(claim.status)}</td></tr>)) : <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">No PhilHealth claims recorded.</td></tr>}</tbody>
        </table>
    </div>
);

const HMOClaimsTab: React.FC<{ claims: HMOClaim[], patients: Patient[] }> = ({ claims, patients }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs"><tr><th className="p-4">Patient</th><th className="p-4">Provider</th><th className="p-4">Date</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{claims.length > 0 ? claims.map(claim => (<tr key={claim.id} className="hover:bg-slate-50/50"><td className="p-4 font-bold text-slate-800">{patients.find(p => p.id === claim.patientId)?.name}</td><td className="p-4 font-bold text-blue-700">{claim.hmoProvider}</td><td className="p-4 text-slate-500 font-mono text-xs">{formatDate(claim.dateSubmitted)}</td><td className="p-4 text-right font-mono font-bold">₱{claim.amountClaimed.toLocaleString()}</td><td className="p-4 text-center">{String(claim.status)}</td></tr>)) : <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">No HMO claims recorded.</td></tr>}</tbody>
        </table>
    </div>
);

export default Financials;

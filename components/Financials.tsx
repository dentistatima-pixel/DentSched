import React, { useState, useMemo } from 'react';
/* Added Plus to lucide-react imports to fix Error on line 396 */
import { DollarSign, FileText, Package, BarChart2, Heart, CheckCircle, Clock, Edit2, TrendingUp, Award, UserCheck, Briefcase, Calculator, ShieldCheck, AlertCircle, History, Download, Receipt, User as UserIcon, Filter, PieChart, Calendar, AlertTriangle, ChevronRight, X, User as StaffIcon, ShieldAlert, CreditCard, Lock, Flag, Send, ChevronDown, CheckSquare, Save, Plus } from 'lucide-react';
import { HMOClaim, Expense, PhilHealthClaim, Patient, Appointment, FieldSettings, User as StaffUser, AppointmentStatus, ReconciliationRecord, LedgerEntry, TreatmentPlanStatus, UserRole, CashSession, PayrollPeriod, PayrollAdjustment, CommissionDispute, PayrollStatus } from '../types';
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
  onSaveCashSession?: (session: CashSession) => void;
  currentBranch: string;
  payrollPeriods: PayrollPeriod[];
  payrollAdjustments: PayrollAdjustment[];
  commissionDisputes: CommissionDispute[];
  onUpdatePayrollPeriod: (p: PayrollPeriod) => void;
  onAddPayrollAdjustment: (a: PayrollAdjustment) => void;
  onApprovePayrollAdjustment: (id: string) => void;
  onAddCommissionDispute: (d: CommissionDispute) => void;
  onResolveCommissionDispute: (id: string) => void;
}

const Financials: React.FC<FinancialsProps> = (props) => {
  const { 
    claims, expenses, philHealthClaims = [], patients = [], appointments = [], fieldSettings, staff, currentUser, 
    onUpdatePhilHealthClaim, reconciliations = [], onSaveReconciliation, onSaveCashSession, currentBranch 
  } = props;
  const [activeTab, setActiveTab] = useState<'analytics' | 'reconciliation' | 'aging' | 'payroll' | 'claims' | 'philhealth' | 'expenses'>('analytics');

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'reconciliation', label: 'Cash Reconciliation', icon: Calculator },
    { id: 'aging', label: 'Debt Aging', icon: Clock },
    { id: 'payroll', label: 'Staff Payroll', icon: Award },
    { id: 'claims', label: 'HMO Claims', icon: Heart },
    { id: 'philhealth', label: 'PhilHealth', icon: FileText },
    { id: 'expenses', label: 'Expenses', icon: Package },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics': return <Analytics patients={patients} appointments={appointments} fieldSettings={fieldSettings} staff={staff} />;
      case 'reconciliation': return <CashReconciliationTab patients={patients} currentBranch={currentBranch} currentUser={currentUser} reconciliations={reconciliations} onSave={onSaveReconciliation} onSaveSession={onSaveCashSession} fieldSettings={fieldSettings} />;
      case 'payroll': return (
        <PayrollTab 
            appointments={appointments || []} 
            staff={staff || []} 
            expenses={expenses} 
            fieldSettings={fieldSettings} 
            currentUser={currentUser}
            payrollPeriods={props.payrollPeriods}
            payrollAdjustments={props.payrollAdjustments}
            commissionDisputes={props.commissionDisputes}
            onUpdatePayrollPeriod={props.onUpdatePayrollPeriod}
            onAddAdjustment={props.onAddPayrollAdjustment}
            onApproveAdjustment={props.onApprovePayrollAdjustment}
            onAddDispute={props.onAddCommissionDispute}
            onResolveDispute={props.onResolveCommissionDispute}
        />
      );
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

const PayrollTab: React.FC<{ 
    appointments: Appointment[], 
    staff: StaffUser[], 
    expenses: Expense[], 
    fieldSettings?: FieldSettings, 
    currentUser: StaffUser,
    payrollPeriods: PayrollPeriod[],
    payrollAdjustments: PayrollAdjustment[],
    commissionDisputes: CommissionDispute[],
    onUpdatePayrollPeriod: (p: PayrollPeriod) => void,
    onAddAdjustment: (a: PayrollAdjustment) => void,
    onApproveAdjustment: (id: string) => void,
    onAddDispute: (d: CommissionDispute) => void,
    onResolveDispute: (id: string) => void
}> = ({ appointments, staff, expenses, fieldSettings, currentUser, payrollPeriods, payrollAdjustments, commissionDisputes, onUpdatePayrollPeriod, onAddAdjustment, onApproveAdjustment, onAddDispute, onResolveDispute }) => {
    const toast = useToast();
    const dentists = staff.filter(s => s.role === UserRole.DENTIST);
    const [selectedDentistId, setSelectedDentistId] = useState<string>(currentUser.role === UserRole.DENTIST ? currentUser.id : dentists[0]?.id || '');
    const [disputeModal, setDisputeModal] = useState<{ itemId: string, itemName: string } | null>(null);
    const [disputeNote, setDisputeNote] = useState('');
    const [adjModal, setAdjModal] = useState(false);
    const [adjForm, setAdjForm] = useState({ reason: '', amount: '' });

    const isAdmin = currentUser.role === UserRole.ADMIN;

    const currentDentist = staff.find(s => s.id === selectedDentistId);
    
    // Find or init current period for dentist
    const period = useMemo(() => {
        const existing = payrollPeriods.find(p => p.providerId === selectedDentistId);
        if (existing) return existing;
        return {
            id: `period_${selectedDentistId}_init`,
            providerId: selectedDentistId,
            startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
            endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
            status: PayrollStatus.OPEN
        } as PayrollPeriod;
    }, [payrollPeriods, selectedDentistId]);

    const isLocked = period.status === PayrollStatus.LOCKED;
    const isClosed = period.status === PayrollStatus.CLOSED;

    const commissionRate = currentDentist?.commissionRate || 0.30;
    const completed = appointments.filter(a => a.providerId === selectedDentistId && a.status === AppointmentStatus.COMPLETED);
    
    let grossProduction = 0;
    completed.forEach(apt => {
        const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
        grossProduction += (proc?.price || 0);
    });

    const labFees = expenses.filter(e => e.staffId === selectedDentistId && e.category === 'Lab Fee').reduce((s, e) => s + e.amount, 0);
    const approvedAdjustmentsTotal = payrollAdjustments
        .filter(a => a.periodId === period.id && a.status === 'Approved')
        .reduce((s, a) => s + a.amount, 0);
    
    const netBase = grossProduction - labFees;
    const baseCommission = netBase * commissionRate;
    const finalPayout = baseCommission + approvedAdjustmentsTotal;

    const handleClosePeriod = () => {
        onUpdatePayrollPeriod({ ...period, status: PayrollStatus.CLOSED, closedAt: new Date().toISOString() });
        toast.success("Statement closed. Review period active.");
    };

    const handleLockPeriod = () => {
        onUpdatePayrollPeriod({ ...period, status: PayrollStatus.LOCKED, lockedAt: new Date().toISOString() });
        toast.success("Statement locked. Record is now immutable.");
    };

    const handleDisputeSubmit = () => {
        if (!disputeModal || !disputeNote.trim()) return;
        onAddDispute({
            id: `disp_${Date.now()}`,
            itemId: disputeModal.itemId,
            note: disputeNote,
            status: 'Open',
            date: new Date().toISOString()
        });
        setDisputeModal(null);
        setDisputeNote('');
        toast.warning("Dispute logged for Admin review.");
    };

    const handleAdjSubmit = () => {
        if (!adjForm.reason || !adjForm.amount) return;
        onAddAdjustment({
            id: `adj_${Date.now()}`,
            periodId: period.id,
            amount: parseFloat(adjForm.amount),
            reason: adjForm.reason,
            requestedBy: currentUser.id,
            status: 'Pending',
            date: new Date().toISOString()
        });
        setAdjModal(false);
        setAdjForm({ reason: '', amount: '' });
        toast.info("Adjustment request queued.");
    };

    return (
        <div className="space-y-6">
            {/* PROVIDER SELECTOR (ADMIN ONLY) */}
            {isAdmin && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <UserIcon size={20} className="text-teal-600"/>
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">Viewing Provider Statement:</span>
                        <select 
                            value={selectedDentistId} 
                            onChange={e => setSelectedDentistId(e.target.value)}
                            className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-sm font-bold outline-none"
                        >
                            {dentists.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        {period.status === PayrollStatus.OPEN && <button onClick={handleClosePeriod} className="px-4 py-2 bg-lilac-600 text-white text-xs font-bold rounded-xl shadow-lg">Close Period</button>}
                        {period.status === PayrollStatus.CLOSED && <button onClick={handleLockPeriod} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2"><Lock size={14}/> Permanent Lock</button>}
                    </div>
                </div>
            )}

            {/* STATUS RIBBON */}
            <div className={`p-4 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-4 ${isLocked ? 'bg-slate-900' : isClosed ? 'bg-lilac-600' : 'bg-teal-900'}`}>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isLocked ? 'bg-slate-800 text-red-400 border-slate-700' : 'bg-white/10 text-white border-white/20'}`}>
                            {isLocked ? <Lock size={20}/> : <Award size={20}/>}
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">Statement Status</div>
                            <div className="text-sm font-bold text-white uppercase">{period.status} {isLocked && '• IMMUTABLE RECORD'}</div>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-black text-white/40 uppercase">Statement Period</div>
                    <div className="text-xs font-bold text-white">{formatDate(period.startDate)} - {formatDate(period.endDate)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* PRODUCTION BREAKDOWN */}
                <div className="xl:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2"><Briefcase size={18}/> Procedure-Level Production</h3>
                    <div className="overflow-hidden border border-slate-100 rounded-2xl">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
                                <tr><th className="p-4">Date</th><th className="p-4">Procedure</th><th className="p-4 text-right">Fee (₱)</th><th className="p-4 text-center">Status</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {completed.map(apt => {
                                    const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
                                    const dispute = commissionDisputes.find(d => d.itemId === apt.id);
                                    return (
                                        <tr key={apt.id} className={`group hover:bg-slate-50 transition-colors ${dispute ? 'bg-orange-50/50' : ''}`}>
                                            <td className="p-4 font-mono text-[10px] text-slate-400">{formatDate(apt.date)}</td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-700">{apt.type}</div>
                                                {dispute && <div className="text-[9px] font-bold text-orange-600 flex items-center gap-1 mt-1"><AlertTriangle size={10}/> DISPUTED: "{dispute.note}"</div>}
                                            </td>
                                            <td className="p-4 text-right font-black text-slate-800">₱{proc?.price.toLocaleString()}</td>
                                            <td className="p-4 text-center">
                                                {!isLocked && !dispute && (
                                                    <button 
                                                        onClick={() => setDisputeModal({ itemId: apt.id, itemName: apt.type })}
                                                        className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-orange-500 transition-all"
                                                        title="Raise Dispute"
                                                    >
                                                        <Flag size={14}/>
                                                    </button>
                                                )}
                                                {dispute && dispute.status === 'Open' && isAdmin && (
                                                    <button onClick={() => onResolveDispute(dispute.id)} className="text-[9px] font-black text-teal-600 uppercase bg-teal-50 px-2 py-1 rounded-full border border-teal-100">Resolve</button>
                                                )}
                                                {dispute && dispute.status === 'Resolved' && (
                                                    <span className="text-[9px] font-black text-slate-400 uppercase">Resolved</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* ADJUSTMENT LEDGER */}
                    <div className="pt-8 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2"><CreditCard size={18}/> Correction & Adjustment Ledger</h3>
                            {!isLocked && <button onClick={() => setAdjModal(true)} className="px-3 py-1 bg-teal-50 text-teal-600 text-[10px] font-black uppercase rounded-lg border border-teal-100 hover:bg-teal-100 transition-all">+ Add Adjustment</button>}
                        </div>
                        <div className="space-y-2">
                            {payrollAdjustments.filter(a => a.periodId === period.id).map(adj => (
                                <div key={adj.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${adj.status === 'Approved' ? 'bg-teal-50/50 border-teal-100' : 'bg-slate-50 border-slate-200 border-dashed'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl ${adj.status === 'Approved' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                            <DollarSign size={16}/>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-800">{adj.reason}</div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{adj.status} • Requested by {staff.find(s => s.id === adj.requestedBy)?.name}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`font-black ${adj.amount >= 0 ? 'text-teal-600' : 'text-red-600'}`}>₱{adj.amount.toLocaleString()}</span>
                                        {adj.status === 'Pending' && isAdmin && (
                                            <button onClick={() => onApproveAdjustment(adj.id)} className="p-2 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 transition-all"><CheckSquare size={14}/></button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {payrollAdjustments.filter(a => a.periodId === period.id).length === 0 && <div className="py-10 text-center text-slate-300 italic text-sm border-2 border-dashed border-slate-100 rounded-3xl">No manual adjustments recorded.</div>}
                        </div>
                    </div>
                </div>

                {/* PAYOUT SUMMARY CARD */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border-2 border-teal-500 shadow-xl space-y-6 flex-1 flex flex-col">
                        <h3 className="font-black text-teal-900 uppercase tracking-tighter text-lg">Payout Statement</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Gross Production</span>
                                <span className="font-black text-slate-800">₱{grossProduction.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Lab Expenses (-)</span>
                                <span className="font-black text-red-600">-₱{labFees.toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-slate-100" />
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-700 font-black uppercase tracking-widest text-[10px]">Net Practice Base</span>
                                <span className="font-black text-slate-900">₱{netBase.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-teal-600 font-black uppercase tracking-widest text-[10px]">Commission ({commissionRate * 100}%)</span>
                                <span className="font-black text-teal-700">₱{baseCommission.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Adjustments (+)</span>
                                <span className={`font-black ${approvedAdjustmentsTotal >= 0 ? 'text-teal-600' : 'text-red-600'}`}>₱{approvedAdjustmentsTotal.toLocaleString()}</span>
                            </div>
                            
                            <div className="pt-6 mt-6 border-t-2 border-teal-50">
                                <div className="text-[10px] font-black uppercase tracking-widest text-teal-600 text-center mb-1">Final Payout Amount</div>
                                <div className="text-4xl font-black text-teal-900 text-center">₱{finalPayout.toLocaleString()}</div>
                            </div>
                        </div>

                        {isAdmin && period.status === PayrollStatus.OPEN && (
                            <button onClick={handleClosePeriod} className="w-full py-4 bg-lilac-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-lilac-600/20 hover:scale-105 transition-all">Close & Send for Review</button>
                        )}
                        {isAdmin && period.status === PayrollStatus.CLOSED && (
                            <button onClick={handleLockPeriod} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-105 transition-all flex items-center justify-center gap-2"><Lock size={18}/> Verify & Lock Statement</button>
                        )}
                        {isLocked && (
                             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                                <ShieldCheck size={24} className="text-teal-600 mx-auto mb-2"/>
                                <p className="text-[10px] font-black text-slate-400 uppercase">Verified immutable record</p>
                             </div>
                        )}
                    </div>
                </div>
            </div>

            {/* DISPUTE MODAL */}
            {disputeModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95">
                        <div className="flex items-center gap-3 text-orange-600 mb-6">
                            <Flag size={32} />
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Raise Dispute</h3>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mb-6">Raising a dispute for <strong>{disputeModal.itemName}</strong>. This item will be flagged for Administrative review.</p>
                        <textarea 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-32 focus:ring-4 focus:ring-orange-500/10 outline-none font-medium mb-6"
                            placeholder="Reason for dispute (e.g., 'Lab fee incorrect', 'Should be 40% split')..."
                            value={disputeNote}
                            onChange={e => setDisputeNote(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setDisputeModal(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl">Cancel</button>
                            <button onClick={handleDisputeSubmit} className="flex-[2] py-4 bg-orange-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-500/20">Raise Fight</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADJUSTMENT MODAL */}
            {adjModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95">
                        <div className="flex items-center gap-3 text-teal-600 mb-6">
                            <Plus size={32} />
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Manual Adjustment</h3>
                        </div>
                        <div className="space-y-4 mb-8">
                            <div><label className="label">Adjustment Amount (₱)</label><input type="number" className="input text-lg font-black text-teal-700" placeholder="0.00" value={adjForm.amount} onChange={e => setAdjForm({...adjForm, amount: e.target.value})} /></div>
                            <div><label className="label">Reason / Narrative</label><input type="text" className="input" placeholder="e.g. Training Bonus, Deduct Breakage" value={adjForm.reason} onChange={e => setAdjForm({...adjForm, reason: e.target.value})} /></div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setAdjModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl">Cancel</button>
                            <button onClick={handleAdjSubmit} className="flex-[2] py-4 bg-teal-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-teal-600/20">Log Adjustment</button>
                        </div>
                    </div>
                </div>
            )}
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

const PHP_DENOMINATIONS = [
    { label: '₱1000', value: 1000, type: 'bill' },
    { label: '₱500', value: 500, type: 'bill' },
    { label: '₱200', value: 200, type: 'bill' },
    { label: '₱100', value: 100, type: 'bill' },
    { label: '₱50', value: 50, type: 'bill' },
    { label: '₱20', value: 20, type: 'bill' },
    { label: '₱10', value: 10, type: 'coin' },
    { label: '₱5', value: 5, type: 'coin' },
    { label: '₱1', value: 1, type: 'coin' }
];

const CashReconciliationTab: React.FC<{ 
    patients: Patient[], 
    currentBranch: string, 
    currentUser: StaffUser, 
    reconciliations: ReconciliationRecord[], 
    onSave?: (r: ReconciliationRecord) => void,
    onSaveSession?: (s: CashSession) => void,
    fieldSettings?: FieldSettings
}> = ({ patients, currentBranch, currentUser, reconciliations, onSave, onSaveSession, fieldSettings }) => {
    const toast = useToast();
    const [counts, setCounts] = useState<Record<number, number>>({});
    const [card, setCard] = useState('');
    const [ewallet, setEWallet] = useState('');
    const [notes, setNotes] = useState('');
    const [explanation, setExplanation] = useState('');
    const [openingBalance, setOpeningBalance] = useState('');

    const today = new Date().toISOString().split('T')[0];
    
    // Find active session for this branch
    const activeSession = useMemo(() => {
        return (fieldSettings as any)?.cashSessions?.find((s: CashSession) => s.branch === currentBranch && s.status === 'Open');
    }, [fieldSettings, currentBranch]);

    const isAlreadyFinalized = reconciliations.some(r => r.date === today && r.branch === currentBranch);

    // FIX: Removed inaccurate comments and ensured explicit numeric type safety in RHS arithmetic operations
    const expectedFromLedger = useMemo<number>(() => {
        let total = 0;
        patients.forEach(p => {
            p.ledger?.forEach(entry => {
                if (activeSession) {
                    if (new Date(entry.date).getTime() >= new Date(activeSession.startTime).getTime() && entry.type === 'Payment' && (!entry.branch || entry.branch === currentBranch)) {
                        total += Number(entry.amount || 0);
                    }
                } else if (entry.date === today && entry.type === 'Payment' && (!entry.branch || entry.branch === currentBranch)) {
                    total += Number(entry.amount || 0);
                }
            });
        });
        return Number(total) + (activeSession ? Number((activeSession as any).openingBalance || 0) : 0);
    }, [patients, today, currentBranch, activeSession]);

    // FIX: Ensured accumulation uses explicit Number type to prevent arithmetic inference errors
    const cashTotal = Object.entries(counts).reduce((acc, [val, count]) => Number(acc) + (Number(val) * Number(count)), 0);
    const actualTotal = Number(cashTotal) + (Number(card) || 0) + (Number(ewallet) || 0);
    const discrepancy = Number(actualTotal) - Number(expectedFromLedger);
    const hasVariance = discrepancy !== 0;

    const handleOpenDrawer = () => {
        if (!onSaveSession || !openingBalance) return;
        const newSession: CashSession = {
            id: `session_${Date.now()}`,
            branch: currentBranch,
            openedBy: currentUser.id,
            openedByName: currentUser.name,
            startTime: new Date().toISOString(),
            openingBalance: parseFloat(openingBalance),
            status: 'Open'
        };
        onSaveSession(newSession);
        setOpeningBalance('');
        toast.success(`Drawer opened by ${currentUser.name}. Shift accountability active.`);
    };

    const handleFinalize = () => {
        if (!onSave || !activeSession) return;
        if (hasVariance && !explanation.trim()) {
            toast.error("Variance explanation is mandatory for discrepancies.");
            return;
        }

        const record: ReconciliationRecord = {
            id: `recon_${Date.now()}`, 
            date: today, 
            branch: currentBranch, 
            expectedTotal: expectedFromLedger, 
            actualCash: cashTotal, 
            actualCard: parseFloat(card) || 0, 
            actualEWallet: parseFloat(ewallet) || 0, 
            discrepancy, 
            notes, 
            explanation,
            verifiedBy: currentUser.id,
            verifiedByName: currentUser.name,
            timestamp: new Date().toISOString()
        };

        if (onSaveSession) {
            onSaveSession({ ...activeSession, status: 'Closed', endTime: new Date().toISOString() });
        }

        onSave(record);
        setCounts({}); setCard(''); setEWallet(''); setNotes(''); setExplanation('');
        toast.success("Cash session closed and reconciled.");
    };

    const updateCount = (denom: number, delta: number) => {
        setCounts(prev => ({ ...prev, [denom]: Math.max(0, (prev[denom] || 0) + delta) }));
    };

    if (!activeSession && !isAlreadyFinalized) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20 animate-in fade-in zoom-in-95">
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-lilac-100 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-lilac-100 text-lilac-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-lilac-200">
                        <Calculator size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Shift Initialization</h3>
                    <p className="text-slate-500 mb-8 text-sm">Assign a staff member to the cash drawer for accountability tagging.</p>
                    
                    <div className="space-y-4">
                        <div className="text-left">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Opening Balance (Float)</label>
                            <input 
                                type="number" 
                                value={openingBalance} 
                                onChange={e => setOpeningBalance(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-2xl text-teal-700 focus:border-teal-500 outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100 flex items-center gap-3">
                             <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-teal-200" />
                             <div className="text-left"><div className="text-[9px] font-black text-teal-600 uppercase">Accountable User</div><div className="text-xs font-bold text-teal-900">{currentUser.name}</div></div>
                        </div>
                        <button onClick={handleOpenDrawer} className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:scale-105 transition-all">Open Shift Drawer</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {activeSession && (
                <div className="bg-teal-900 p-4 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-800 rounded-xl flex items-center justify-center text-teal-400 border border-teal-700"><Receipt size={20}/></div>
                            <div>
                                <div className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Active Shift Drawer</div>
                                <div className="text-sm font-bold text-white uppercase">{currentBranch}</div>
                            </div>
                        </div>
                        <div className="h-10 w-px bg-white/10 hidden md:block" />
                        <div className="hidden md:flex items-center gap-3">
                            <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-white/20" />
                            <div><div className="text-[9px] font-black text-teal-500 uppercase">Staff Assigned</div><div className="text-xs font-bold text-white">{activeSession.openedByName}</div></div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-[9px] font-black text-teal-500 uppercase">Shift Started</div>
                            <div className="text-xs font-bold text-white">{new Date(activeSession.startTime).toLocaleTimeString()}</div>
                        </div>
                        <div className="bg-teal-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase animate-pulse">Live</div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                    <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6"><DollarSign size={16}/> Cash Denomination Breakdown</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {PHP_DENOMINATIONS.map(denom => (
                                <div key={denom.value} className="bg-slate-50 p-4 rounded-3xl border border-slate-200 flex items-center justify-between group hover:border-teal-500 transition-all">
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] font-black uppercase ${denom.type === 'bill' ? 'text-teal-600' : 'text-lilac-600'}`}>{denom.type}</span>
                                        <span className="text-xl font-black text-slate-800">{denom.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => updateCount(denom.value, -1)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 border border-slate-200 shadow-sm">-</button>
                                        <div className="w-10 text-center font-black text-slate-700">{counts[denom.value] || 0}</div>
                                        <button onClick={() => updateCount(denom.value, 1)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-teal-600 border border-slate-200 shadow-sm">+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6"><CreditCard size={16}/> Digital Terminals</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="label text-slate-500">POS Card Machine Total</label><input type="number" value={card} onChange={e => setCard(e.target.value)} className="input" placeholder="₱ 0.00" /></div>
                            <div><label className="label text-slate-500">E-Wallet (GCash/Maya) Total</label><input type="number" value={ewallet} onChange={e => setEWallet(e.target.value)} className="input" placeholder="₱ 0.00" /></div>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-4 flex flex-col gap-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border-2 border-teal-500 shadow-xl space-y-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-center"><h3 className="font-black text-teal-900 uppercase tracking-tighter text-lg">Closing Summary</h3><ShieldCheck size={24} className="text-teal-500"/></div>
                        
                        <div className="space-y-4 flex-1">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Expected (Shift)</span>
                                <span className="text-xl font-black text-slate-800">₱{expectedFromLedger.toLocaleString()}</span>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Actual Counted</span>
                                <span className="text-xl font-black text-teal-600">₱{actualTotal.toLocaleString()}</span>
                            </div>

                            <div className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${discrepancy === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200 ring-4 ring-red-500/10'}`}>
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Session Variance</div>
                                <div className={`text-4xl font-black ${discrepancy === 0 ? 'text-green-600' : 'text-red-600'} flex items-center gap-2`}>
                                    {discrepancy !== 0 && <AlertTriangle size={32} className="animate-pulse"/>}
                                    ₱{discrepancy.toLocaleString()}
                                </div>
                                {discrepancy !== 0 && <span className="text-[10px] font-black text-red-700 uppercase animate-pulse">Leakage Warning Detected</span>}
                            </div>

                            {hasVariance && (
                                <div className="animate-in slide-in-from-bottom-2">
                                    <label className="text-[10px] font-black text-red-600 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-1"><ShieldAlert size={12}/> Mandatory Variance Explanation *</label>
                                    <textarea 
                                        required
                                        value={explanation}
                                        onChange={e => setExplanation(e.target.value)}
                                        placeholder="Explain the discrepancy (e.g., missed logging of emergency walk-in cash)..."
                                        className="w-full p-4 bg-red-50/50 border-2 border-red-200 rounded-2xl text-xs font-medium h-24 focus:ring-4 focus:ring-red-500/10 outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={handleFinalize} 
                            disabled={hasVariance && !explanation.trim()}
                            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all ${
                                hasVariance && !explanation.trim() ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-teal-600 text-white shadow-teal-600/20 hover:scale-[1.02]'
                            }`}
                        >
                            Finalize & Close Shift
                        </button>
                    </div>

                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-4">
                        <div className="flex justify-between items-center"><h3 className="font-bold flex items-center gap-2 text-teal-400"><History size={18}/> Audit History</h3><span className="text-[9px] font-black uppercase opacity-40">Persistence Layer</span></div>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                            {reconciliations.length > 0 ? reconciliations.map(r => (
                                <div key={r.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div><div className="text-[9px] font-black text-teal-500 uppercase">{formatDate(r.date)}</div><div className="text-xs font-bold">{r.branch}</div></div>
                                        <div className={`text-xs font-black px-2 py-0.5 rounded ${r.discrepancy === 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>₱{r.discrepancy}</div>
                                    </div>
                                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                        <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center text-[8px] font-bold"><StaffIcon size={10}/></div>
                                        <span className="text-[10px] font-bold opacity-60">Verified by {r.verifiedByName}</span>
                                    </div>
                                    {r.explanation && <p className="text-[9px] italic opacity-40 leading-tight">" {r.explanation} "</p>}
                                </div>
                            )) : <div className="py-10 text-center text-white/20 italic text-sm">No verification history.</div>}
                        </div>
                    </div>
                </div>
            </div>
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
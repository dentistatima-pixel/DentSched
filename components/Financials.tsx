
import React, { useState, useMemo } from 'react';
import { DollarSign, FileText, Package, BarChart2, Heart, CheckCircle, Clock, Edit2, TrendingUp, Award, UserCheck, Briefcase, Calculator, ShieldCheck, AlertCircle, History, Download, Receipt, User as UserIcon, Filter, PieChart, Calendar, AlertTriangle, ChevronRight, X, User as StaffIcon, ShieldAlert, CreditCard, Lock, Flag, Send, ChevronDown, CheckSquare, Save, Plus, ArrowRightLeft, Target, Trash2, Link } from 'lucide-react';
import { HMOClaim, Expense, PhilHealthClaim, Patient, Appointment, FieldSettings, User as StaffUser, AppointmentStatus, ReconciliationRecord, LedgerEntry, TreatmentPlanStatus, UserRole, CashSession, PayrollPeriod, PayrollAdjustment, CommissionDispute, PayrollStatus, ClaimStatus, AuditLogEntry } from '../types';
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
  onUpdateHmoClaim?: (updatedClaim: HMOClaim) => void;
  onUpdatePatient?: (patient: Patient) => void;
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
  logAction?: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
}

// Fixed: Added TreatmentAcceptanceCard component to track treatment plan approval rates
const TreatmentAcceptanceCard: React.FC<{ patients: Patient[] }> = ({ patients }) => {
    const stats = useMemo(() => {
        const allPlans = patients.flatMap(p => p.treatmentPlans || []);
        if (allPlans.length === 0) return 0;
        const approved = allPlans.filter(p => p.status === TreatmentPlanStatus.APPROVED).length;
        return Math.round((approved / allPlans.length) * 100);
    }, [patients]);

    return (
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 flex items-center gap-3">
            <div className="bg-teal-50 p-2 rounded-xl text-teal-600">
                <Target size={18} />
            </div>
            <div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Plan Acceptance</div>
                <div className="text-sm font-black text-slate-800">{stats}% Approval Rate</div>
            </div>
        </div>
    );
};

// Fixed: Added DebtAgingTab to visualize accounts receivable aging (0-90+ days)
const DebtAgingTab: React.FC<{ patients: Patient[] }> = ({ patients }) => {
    const aging = useMemo(() => {
        const buckets = { current: 0, thirty: 0, sixty: 0, ninety: 0 };
        const now = new Date();

        patients.forEach(p => {
            if (!p.currentBalance || p.currentBalance <= 0) return;
            
            const lastCharge = [...(p.ledger || [])]
                .filter(e => e.type === 'Charge')
                .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            
            if (!lastCharge) {
                buckets.current += p.currentBalance;
                return;
            }

            const days = Math.floor((now.getTime() - new Date(lastCharge.date).getTime()) / (1000 * 3600 * 24));
            if (days < 30) buckets.current += p.currentBalance;
            else if (days < 60) buckets.thirty += p.currentBalance;
            else if (days < 90) buckets.sixty += p.currentBalance;
            else buckets.ninety += p.currentBalance;
        });

        return buckets;
    }, [patients]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
                { label: 'Current (0-30D)', value: aging.current, color: 'bg-emerald-50 text-emerald-700' },
                { label: '30-60 Days', value: aging.thirty, color: 'bg-amber-50 text-amber-700' },
                { label: '60-90 Days', value: aging.sixty, color: 'bg-orange-50 text-orange-700' },
                { label: '90+ Days (Risk)', value: aging.ninety, color: 'bg-red-50 text-red-700' },
            ].map(b => (
                <div key={b.label} className={`p-6 rounded-[2rem] border border-slate-100 shadow-sm ${b.color}`}>
                    <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">{b.label}</div>
                    <div className="text-2xl font-black">₱{b.value.toLocaleString()}</div>
                </div>
            ))}
        </div>
    );
};

// Fixed: Added HMOClaimsTab for raw list view of carrier claims
const HMOClaimsTab: React.FC<{ claims: HMOClaim[], patients: Patient[] }> = ({ claims, patients }) => {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                    <tr><th className="p-4">Patient</th><th className="p-4">Provider</th><th className="p-4">Amount</th><th className="p-4">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {claims.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50">
                            <td className="p-4 font-bold text-slate-800">{patients.find(p => p.id === c.patientId)?.name}</td>
                            <td className="p-4 text-slate-500">{c.hmoProvider}</td>
                            <td className="p-4 font-black text-slate-700">₱{c.amountClaimed.toLocaleString()}</td>
                            <td className="p-4"><span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${c.status === ClaimStatus.SETTLED ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>{c.status}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Fixed: Added PhilHealthClaimsTab for specialized government claim tracking
const PhilHealthClaimsTab: React.FC<{ claims: PhilHealthClaim[], patients: Patient[], onUpdateClaim?: any }> = ({ claims, patients }) => {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                    <tr><th className="p-4">Patient</th><th className="p-4">Procedure</th><th className="p-4">Case Rate</th><th className="p-4">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {claims.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50">
                            <td className="p-4 font-bold text-slate-800">{patients.find(p => p.id === c.patientId)?.name}</td>
                            <td className="p-4 text-slate-500">{c.procedureName}</td>
                            <td className="p-4 font-black text-slate-700">₱{c.amountClaimed.toLocaleString()}</td>
                            <td className="p-4"><span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${c.status === ClaimStatus.SETTLED ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>{c.status}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Fixed: Added CashReconciliationTab to handle daily cash-drawer verification protocol
const CashReconciliationTab: React.FC<any> = ({ patients, currentBranch, currentUser, reconciliations, onSave, fieldSettings }) => {
    const [cash, setCash] = useState('');
    const [card, setCard] = useState('');
    const [eWallet, setEWallet] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const record: ReconciliationRecord = {
            id: `rec_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            branch: currentBranch,
            expectedTotal: 0, // Simplified for mock
            actualCash: parseFloat(cash) || 0,
            actualCard: parseFloat(card) || 0,
            actualEWallet: parseFloat(eWallet) || 0,
            discrepancy: 0,
            verifiedBy: currentUser.id,
            verifiedByName: currentUser.name,
            timestamp: new Date().toISOString()
        };
        onSave?.(record);
        setCash(''); setCard(''); setEWallet(''); setNotes('');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <form onSubmit={handleSubmit} className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 h-fit">
                <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                    <Calculator size={16} className="text-teal-600"/> Daily Reconciliation
                </h4>
                <div><label className="label">Physical Cash Count</label><input type="number" value={cash} onChange={e => setCash(e.target.value)} className="input" placeholder="0.00" /></div>
                <div><label className="label">Card Terminal Total</label><input type="number" value={card} onChange={e => setCard(e.target.value)} className="input" placeholder="0.00" /></div>
                <div><label className="label">E-Wallet (GCash/Maya)</label><input type="number" value={eWallet} onChange={e => setEWallet(e.target.value)} className="input" placeholder="0.00" /></div>
                <div><label className="label">Notes / Discrepancy Explanation</label><textarea value={notes} onChange={e => setNotes(e.target.value)} className="input h-20 resize-none" /></div>
                <button type="submit" className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-teal-600/20">Verify & Close Session</button>
            </form>

            <div className="lg:col-span-2 space-y-4">
                <h4 className="font-black text-slate-400 uppercase tracking-widest text-[10px] px-2">Verification History</h4>
                <div className="space-y-3">
                    {(reconciliations || []).map((r: any) => (
                        <div key={r.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                            <div>
                                <div className="font-bold text-slate-800">{formatDate(r.date)}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase">{r.verifiedByName} • {r.branch}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-black text-teal-700">₱{(r.actualCash + r.actualCard + r.actualEWallet).toLocaleString()}</div>
                                <div className="text-[9px] font-black bg-teal-50 text-teal-600 px-2 py-0.5 rounded uppercase">Verified Match</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Fixed: Added PayrollTab to calculate provider commissions based on completed procedure production
const PayrollTab: React.FC<any> = ({ staff, appointments, fieldSettings, payrollPeriods, payrollAdjustments, onAddAdjustment, onApproveAdjustment }) => {
    return (
        <div className="space-y-8">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex justify-between items-center overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Award size={120}/></div>
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-1">Provider Compensation Engine</h3>
                    <p className="text-teal-300 text-sm font-medium">Automated commission calculation based on clinical production.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Cycle Ends In</div>
                    <div className="text-2xl font-black">4 Days</div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                        <tr><th className="p-4">Practitioner</th><th className="p-4 text-center">Completed Cases</th><th className="p-4 text-center">Gross Production</th><th className="p-4 text-right">Commission Due</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {(staff || []).filter((s: any) => s.role === UserRole.DENTIST).map((d: any) => {
                            const completed = (appointments || []).filter((a: any) => a.providerId === d.id && a.status === AppointmentStatus.COMPLETED);
                            const production = completed.reduce((s: number, a: any) => {
                                const p = fieldSettings.procedures.find((pr: any) => pr.name === a.type);
                                return s + (p?.price || 0);
                            }, 0);
                            const rate = d.commissionRate || 0.4;
                            return (
                                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img src={d.avatar} className="w-10 h-10 rounded-full border border-slate-200" alt={d.name} />
                                            <div className="font-bold text-slate-800">{d.name}</div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center font-bold text-slate-600">{completed.length}</td>
                                    <td className="p-4 text-center font-bold text-slate-500">₱{production.toLocaleString()}</td>
                                    <td className="p-4 text-right">
                                        <div className="font-black text-teal-700">₱{(production * rate).toLocaleString()}</div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Rate: {rate * 100}%</div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ClaimsHub: React.FC<{ 
    hmoClaims: HMOClaim[], 
    philHealthClaims: PhilHealthClaim[], 
    patients: Patient[],
    onUpdateHmo?: (c: HMOClaim) => void,
    onUpdatePhilHealth?: (c: PhilHealthClaim) => void,
    onUpdatePatient?: (p: Patient) => void,
    logAction?: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void
}> = ({ hmoClaims, philHealthClaims, patients, onUpdateHmo, onUpdatePhilHealth, onUpdatePatient, logAction }) => {
    const toast = useToast();
    const [overrideModal, setOverrideModal] = useState<any | null>(null);
    const [overrideForm, setOverrideForm] = useState({ notes: '', proof: '' });

    // Unified list for logic
    const allClaims = useMemo(() => {
        const unified = [
            ...hmoClaims.map(c => ({ ...c, type: 'HMO' })),
            ...philHealthClaims.map(c => ({ ...c, type: 'PhilHealth' }))
        ];
        return unified;
    }, [hmoClaims, philHealthClaims]);

    const handleAction = (claim: any, action: 'transmit' | 'settle' | 'deny' | 'override') => {
        const patient = patients.find(p => p.id === claim.patientId);
        if (!patient) return;

        if (action === 'override') {
            setOverrideModal(claim);
            setOverrideForm({ notes: claim.manualOverrideNotes || '', proof: claim.proofOfSubmissionUrl || '' });
            return;
        }

        if (action === 'transmit') {
            const tracking = prompt("Enter Carrier Tracking / Submission Number:");
            if (!tracking) return;
            
            const updated = { ...claim, status: ClaimStatus.TRANSMITTED, trackingNumber: tracking, dateSubmitted: new Date().toISOString().split('T')[0] };
            if (claim.type === 'HMO' && onUpdateHmo) onUpdateHmo(updated);
            if (claim.type === 'PhilHealth' && onUpdatePhilHealth) onUpdatePhilHealth(updated);
            
            logAction?.('TRANSMIT_CLAIM', 'Claim', claim.id, `Claim transmitted to carrier. Tracking: ${tracking}`);
            toast.success("Claim state updated: Transmitted.");
        }

        if (action === 'settle') {
            const received = prompt("Enter Actual Amount Received (₱):", claim.amountClaimed.toString());
            if (!received) return;
            const amount = parseFloat(received);

            // 1. Update Claim Status
            const updatedClaim = { ...claim, status: ClaimStatus.SETTLED, amountReceived: amount, dateReceived: new Date().toISOString().split('T')[0] };
            if (claim.type === 'HMO' && onUpdateHmo) onUpdateHmo(updatedClaim);
            if (claim.type === 'PhilHealth' && onUpdatePhilHealth) onUpdatePhilHealth(updatedClaim);

            // 2. Solidify Ledger (Shadow -> Final Payment)
            if (onUpdatePatient) {
                const ledger = [...(patient.ledger || [])];
                const entryIndex = ledger.findIndex(e => e.id === claim.ledgerEntryId || e.claimId === claim.id);
                
                if (entryIndex >= 0) {
                    const originalEntry = ledger[entryIndex];
                    // Remove Shadow Credit
                    const updatedEntry = { ...originalEntry, shadowCreditAmount: undefined };
                    ledger[entryIndex] = updatedEntry;
                    
                    // Add Actual Payment Entry
                    const currentBalance = ledger.length === 0 ? 0 : ledger[ledger.length - 1].balanceAfter;
                    const paymentEntry: LedgerEntry = {
                        id: `pay_${Date.now()}`,
                        date: new Date().toISOString().split('T')[0],
                        description: `Claim Settlement: ${claim.type} (${claim.procedureName})`,
                        type: 'Payment',
                        amount: amount,
                        balanceAfter: currentBalance - amount,
                        claimId: claim.id
                    };
                    ledger.push(paymentEntry);
                    
                    onUpdatePatient({ ...patient, ledger, currentBalance: currentBalance - amount });
                }
            }
            
            logAction?.('SETTLE_CLAIM', 'Claim', claim.id, `Claim settled for ₱${amount.toLocaleString()}`);
            toast.success("Claim settled. Ledger updated.");
        }

        if (action === 'deny') {
            if (!confirm("Are you sure you want to DENY this claim? The patient's shadow credit will be removed, and they will be responsible for the full balance.")) return;
            
            // 1. Update Claim Status
            const updatedClaim = { ...claim, status: ClaimStatus.DENIED };
            if (claim.type === 'HMO' && onUpdateHmo) onUpdateHmo(updatedClaim);
            if (claim.type === 'PhilHealth' && onUpdatePhilHealth) onUpdatePhilHealth(updatedClaim);

            // 2. Remove Shadow Credit (Revert to Due)
            if (onUpdatePatient) {
                const ledger = [...(patient.ledger || [])];
                const entryIndex = ledger.findIndex(e => e.id === claim.ledgerEntryId || e.claimId === claim.id);
                
                if (entryIndex >= 0) {
                    const originalEntry = ledger[entryIndex];
                    ledger[entryIndex] = { ...originalEntry, shadowCreditAmount: undefined };
                    onUpdatePatient({ ...patient, ledger });
                }
            }

            logAction?.('DENY_CLAIM', 'Claim', claim.id, `Claim denied by carrier. Shadow credit revoked.`);
            toast.warning("Claim denied. Patient balance reverted.");
        }
    };

    const handleSaveOverride = () => {
        if (!overrideModal) return;
        const updated = { ...overrideModal, manualOverrideNotes: overrideForm.notes, proofOfSubmissionUrl: overrideForm.proof };
        if (overrideModal.type === 'HMO' && onUpdateHmo) onUpdateHmo(updated);
        if (overrideModal.type === 'PhilHealth' && onUpdatePhilHealth) onUpdatePhilHealth(updated);
        
        logAction?.('UPDATE', 'Claim', overrideModal.id, "Updated PhilHealth/HMO submission proof and manual notes.");
        setOverrideModal(null);
        toast.success("Submission metadata updated.");
    };

    const Column = ({ title, status, color }: { title: string, status: ClaimStatus, color: string }) => {
        const filtered = allClaims.filter(c => c.status === status);
        return (
            <div className="flex-1 min-w-[300px] flex flex-col gap-4 bg-slate-100/50 p-4 rounded-3xl border border-slate-200 shadow-inner">
                <div className="flex justify-between items-center px-2">
                    <h4 className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{title}</h4>
                    <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400 border border-slate-200">{filtered.length}</span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
                    {filtered.map(claim => (
                        <div key={claim.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm group hover:border-teal-500 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                        {claim.type}: {claim.type === 'HMO' ? (claim as HMOClaim).hmoProvider : 'PhilHealth'}
                                    </div>
                                    <div className="font-bold text-slate-800 text-sm">{patients.find(p => p.id === claim.patientId)?.name}</div>
                                </div>
                                <span className="font-black text-slate-700 text-xs">₱{claim.amountClaimed.toLocaleString()}</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-xl text-[10px] font-bold text-slate-500 mb-4 border border-slate-100">
                                {claim.procedureName}
                            </div>
                            <div className="flex gap-2">
                                {status === ClaimStatus.QUEUED && (
                                    <button onClick={() => handleAction(claim, 'transmit')} className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md hover:bg-teal-700">Transmit</button>
                                )}
                                {(status === ClaimStatus.TRANSMITTED || status === ClaimStatus.ADJUDICATED) && (
                                    <>
                                        <button onClick={() => handleAction(claim, 'deny')} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={14}/></button>
                                        <button onClick={() => handleAction(claim, 'settle')} className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md hover:bg-teal-700">Receive & Settle</button>
                                    </>
                                )}
                                {claim.type === 'PhilHealth' && (
                                    <button onClick={() => handleAction(claim, 'override')} className="p-2 text-slate-400 hover:text-lilac-600 transition-colors" title="Submission Proof"><Link size={14}/></button>
                                )}
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="py-20 text-center text-slate-300 italic text-xs">No claims {title.toLowerCase()}.</div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-50 text-teal-600 rounded-xl"><Target size={24}/></div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Decoupled Claims Hub</h3>
                        <p className="text-xs text-slate-500">Managing clinical truth separate from third-party settlement timelines.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-center">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aggregate Exposure</div>
                        <div className="text-sm font-black text-teal-900">₱{allClaims.filter(c => c.status !== ClaimStatus.SETTLED && c.status !== ClaimStatus.DENIED).reduce((s, c) => s + c.amountClaimed, 0).toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-4 no-scrollbar">
                <Column title="Queued" status={ClaimStatus.QUEUED} color="text-slate-500" />
                <Column title="Transmitted" status={ClaimStatus.TRANSMITTED} color="text-lilac-600" />
                <Column title="Adjudicated" status={ClaimStatus.ADJUDICATED} color="text-blue-600" />
                <Column title="Settled / Closed" status={ClaimStatus.SETTLED} color="text-teal-600" />
            </div>

            {/* OVERRIDE & PROOF MODAL */}
            {overrideModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3 text-lilac-600">
                                <FileText size={32} />
                                <h3 className="text-2xl font-black uppercase tracking-tighter">PhilHealth Proof</h3>
                            </div>
                            <button onClick={() => setOverrideModal(null)}><X size={24} className="text-slate-400"/></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Proof of Transmission (URL / Screenshot Ref)</label>
                                <input 
                                    type="text" 
                                    className="input" 
                                    value={overrideForm.proof} 
                                    onChange={e => setOverrideForm({...overrideForm, proof: e.target.value})}
                                    placeholder="Paste PhilHealth Portal confirmation link..."
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Manual Case-Rate Override Notes</label>
                                <textarea 
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-32 focus:ring-4 focus:ring-teal-500/10 outline-none font-medium"
                                    value={overrideForm.notes}
                                    onChange={e => setOverrideForm({...overrideForm, notes: e.target.value})}
                                    placeholder="Justify non-standard case rate amounts or manual calculation..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setOverrideModal(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl">Cancel</button>
                            <button onClick={handleSaveOverride} className="flex-[2] py-4 bg-lilac-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-lilac-600/20">Save Proof Metadata</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Financials: React.FC<FinancialsProps> = (props) => {
  const { 
    claims, expenses, philHealthClaims = [], patients = [], appointments = [], fieldSettings, staff, currentUser, 
    onUpdatePhilHealthClaim, onUpdateHmoClaim, onUpdatePatient, reconciliations = [], onSaveReconciliation, onSaveCashSession, currentBranch, logAction 
  } = props;
  const [activeTab, setActiveTab] = useState<'analytics' | 'reconciliation' | 'claims-hub' | 'aging' | 'payroll' | 'claims' | 'philhealth' | 'expenses'>('analytics');

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'reconciliation', label: 'Cash Reconciliation', icon: Calculator },
    { id: 'claims-hub', label: 'Claims Hub', icon: Target },
    { id: 'aging', label: 'Debt Aging', icon: Clock },
    { id: 'payroll', label: 'Staff Payroll', icon: Award },
    { id: 'philhealth', label: 'PhilHealth', icon: FileText },
    { id: 'claims', label: 'HMO Raw', icon: Heart },
    { id: 'expenses', label: 'Expenses', icon: Package },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics': return <Analytics patients={patients} appointments={appointments} fieldSettings={fieldSettings} staff={staff} />;
      case 'reconciliation': return <CashReconciliationTab patients={patients} currentBranch={currentBranch} currentUser={currentUser} reconciliations={reconciliations} onSave={onSaveReconciliation} onSaveSession={onSaveCashSession} fieldSettings={fieldSettings} />;
      case 'claims-hub': return (
        <ClaimsHub 
            hmoClaims={claims} 
            philHealthClaims={philHealthClaims} 
            patients={patients} 
            onUpdateHmo={onUpdateHmoClaim}
            onUpdatePhilHealth={onUpdatePhilHealthClaim}
            onUpdatePatient={onUpdatePatient}
            logAction={logAction}
        />
      );
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

// Fixed: Added default export for Financials component
export default Financials;

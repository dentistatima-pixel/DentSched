import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    DollarSign, FileText, Package, BarChart2, Heart, CheckCircle, Clock, Edit2, 
    TrendingUp, Award, UserCheck, Briefcase, Calculator, ShieldCheck, AlertCircle, 
    History, Download, Receipt, User as UserIcon, Filter, PieChart, Calendar, 
    AlertTriangle, ChevronRight, X, User as StaffIcon, ShieldAlert, CreditCard, 
    Lock, Flag, Send, ChevronDown, CheckSquare, Save, Plus, Activity, Target, 
    Scale, Layers, ArrowRight, Shield, PenTool, Fingerprint, ArrowLeft
} from 'lucide-react';
import { 
    HMOClaim, Expense, PhilHealthClaim, Patient, Appointment, FieldSettings, 
    User as StaffUser, AppointmentStatus, ReconciliationRecord, LedgerEntry, 
    TreatmentPlanStatus, UserRole, CashSession, PayrollPeriod, PayrollAdjustment, 
    CommissionDispute, PayrollStatus, PhilHealthClaimStatus, HMOClaimStatus, PractitionerSignOff, AuditLogEntry, GovernanceTrack 
} from '../types';
import Analytics from './Analytics';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';
import CryptoJS from 'crypto-js';

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
  onSaveReconciliation: (record: Omit<ReconciliationRecord, 'id' | 'timestamp'>) => void;
  cashSessions?: CashSession[];
  onSaveCashSession?: (session: CashSession) => void;
  currentBranch: string;
  payrollPeriods: PayrollPeriod[];
  payrollAdjustments: PayrollAdjustment[];
  commissionDisputes: CommissionDispute[];
  onUpdatePayrollPeriod: (p: PayrollPeriod) => void;
  onAddPayrollAdjustment: (a: PayrollAdjustment) => void;
  onApproveAdjustment: (id: string) => void;
  onAddCommissionDispute: (d: CommissionDispute) => void;
  onResolveCommissionDispute: (id: string) => void;
  governanceTrack: GovernanceTrack;
  setGovernanceTrack: (track: GovernanceTrack) => void;
  // Fix: Corrected the return type for onAddPayrollPeriod to match the implementation in App.tsx.
  onAddPayrollPeriod?: (period: Omit<PayrollPeriod, 'id'>) => PayrollPeriod | undefined;
  onBack?: () => void;
  onStartCashSession?: (openingBalance: number) => void;
  onCloseCashSession?: (sessionId: string) => void;
}

// Problem 2 Fix: Implemented functional Cash Reconciliation Tab
const CashReconciliationTab: React.FC<{
  onSave: (record: Omit<ReconciliationRecord, 'id' | 'timestamp'>) => void;
  currentUser: StaffUser;
  currentBranch: string;
  reconciliations: ReconciliationRecord[];
  cashSessions: CashSession[];
  patients: Patient[];
  fieldSettings?: FieldSettings;
  onStartSession: (openingBalance: number) => void;
  onCloseSession: (sessionId: string) => void;
}> = ({ onSave, currentUser, currentBranch, reconciliations, cashSessions, patients, fieldSettings, onStartSession, onCloseSession }) => {
    const [form, setForm] = useState({ actualCash: '', actualCard: '', actualEWallet: '', notes: '' });
    const [openingBalance, setOpeningBalance] = useState('');

    const activeSession = useMemo(() => cashSessions.find(s => s.branch === currentBranch && s.status === 'Open'), [cashSessions, currentBranch]);
    
    const sessionPayments = useMemo(() => {
        if (!activeSession) return [];
        const cashPaymentModes = (fieldSettings?.paymentModes || []).filter(pm => pm.toLowerCase().includes('cash')).map(pm => pm.toLowerCase());
        
        return patients.flatMap(p => p.ledger || [])
            .filter(l => 
                l.type === 'Payment' &&
                new Date(l.date) >= new Date(activeSession.startTime) &&
                cashPaymentModes.some(mode => l.description.toLowerCase().includes(mode))
            );
    }, [activeSession, patients, fieldSettings]);

    const systemExpected = useMemo(() => {
        if (!activeSession) return 0;
        const paymentTotal = sessionPayments.reduce((sum, l) => sum + l.amount, 0);
        return activeSession.openingBalance + paymentTotal;
    }, [activeSession, sessionPayments]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({...prev, [name]: value}));
    };
    
    const handleSubmit = () => {
        const cash = parseFloat(form.actualCash) || 0;
        const card = parseFloat(form.actualCard) || 0;
        const ewallet = parseFloat(form.actualEWallet) || 0;
        const actualTotal = cash + card + ewallet;
        
        onSave({
            date: new Date().toISOString().split('T')[0],
            branch: currentBranch,
            expectedTotal: systemExpected,
            actualCash: cash,
            actualCard: card,
            actualEWallet: ewallet,
            discrepancy: actualTotal - systemExpected,
            notes: form.notes,
            verifiedBy: currentUser.id,
            verifiedByName: currentUser.name,
            sessionId: activeSession!.id,
        });
        if (activeSession) {
            onCloseSession(activeSession.id);
        }
        setForm({ actualCash: '', actualCard: '', actualEWallet: '', notes: '' });
    };

    if (!activeSession) {
        return (
             <div className="bg-white p-8 rounded-[2.5rem] border-4 border-teal-100 shadow-xl space-y-6 max-w-md mx-auto">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter text-center">Start of Day Session</h3>
                <p className="text-sm text-center text-slate-500">No active cash session for {currentBranch}. Enter opening balance to begin.</p>
                <div>
                    <label className="label text-xs">Opening Cash Balance (₱)</label>
                    <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} className="input text-center font-black text-2xl" autoFocus/>
                </div>
                <button onClick={() => onStartSession(parseFloat(openingBalance) || 0)} className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold uppercase text-xs">Start Session</button>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">End of Day Reconciliation</h3>
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="label text-xs">System Expected (₱)</label>
                        <div className="font-black text-2xl text-teal-700">{systemExpected.toLocaleString()}</div>
                    </div>
                    <div><label className="label text-xs">Actual Cash Count (₱)</label><input type="number" name="actualCash" value={form.actualCash} onChange={handleChange} className="input" /></div>
                    <div><label className="label text-xs">Actual Card Slips (₱)</label><input type="number" name="actualCard" value={form.actualCard} onChange={handleChange} className="input" /></div>
                    <div><label className="label text-xs">Actual E-Wallet (₱)</label><input type="number" name="actualEWallet" value={form.actualEWallet} onChange={handleChange} className="input" /></div>
                    <div><label className="label text-xs">Notes/Explanation</label><textarea name="notes" value={form.notes} onChange={handleChange} className="input h-24" /></div>
                </div>
                <button onClick={handleSubmit} className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold uppercase text-xs">Save & Close Session</button>
            </div>
            <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                 <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-6">Active Session Details</h3>
                 <div className="space-y-3">
                     <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between">
                         <span className="font-bold text-slate-500">Opening Balance</span>
                         <span className="font-black text-slate-800">₱{activeSession.openingBalance.toLocaleString()}</span>
                     </div>
                     <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between">
                         <span className="font-bold text-slate-500">Session Cash Payments</span>
                         <span className="font-black text-teal-700">₱{(systemExpected - activeSession.openingBalance).toLocaleString()}</span>
                     </div>
                      <div className="p-4 bg-teal-50 border-2 border-teal-100 rounded-xl flex justify-between">
                         <span className="font-bold text-teal-800">System Expected Total</span>
                         <span className="font-black text-teal-800">₱{systemExpected.toLocaleString()}</span>
                     </div>
                 </div>
            </div>
        </div>
    );
};

const DebtAgingTab: React.FC<{ patients: Patient[] }> = ({ patients }) => {
    const agingBuckets = useMemo(() => {
        const buckets: { [key: string]: { patients: Patient[], total: number } } = {
            '0-30 Days': { patients: [], total: 0 },
            '31-60 Days': { patients: [], total: 0 },
            '61-90 Days': { patients: [], total: 0 },
            '90+ Days': { patients: [], total: 0 },
        };
        const now = new Date();
        patients.filter(p => (p.currentBalance || 0) > 0).forEach(p => {
            const lastVisitDate = p.lastVisit === 'First Visit' ? new Date() : new Date(p.lastVisit);
            if (isNaN(lastVisitDate.getTime())) return;
            const daysOutstanding = Math.floor((now.getTime() - lastVisitDate.getTime()) / (1000 * 3600 * 24));
            
            let bucketKey: string;
            if (daysOutstanding <= 30) bucketKey = '0-30 Days';
            else if (daysOutstanding <= 60) bucketKey = '31-60 Days';
            else if (daysOutstanding <= 90) bucketKey = '61-90 Days';
            else bucketKey = '90+ Days';
            
            buckets[bucketKey].patients.push(p);
            buckets[bucketKey].total += p.currentBalance || 0;
        });
        return buckets;
    }, [patients]);

    const bucketColors: { [key: string]: string } = {
        '0-30 Days': 'border-teal-200',
        '31-60 Days': 'border-amber-200',
        '61-90 Days': 'border-orange-300',
        '90+ Days': 'border-red-300',
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(agingBuckets).map(([title, data]) => {
                // Fix: Cast 'data' to explicitly type it and resolve property access errors.
                const typedData = data as { patients: Patient[], total: number };
                return (
                    <div key={title} className={`bg-white rounded-[2.5rem] border-4 ${bucketColors[title]} shadow-sm flex flex-col`}>
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">{title}</h3>
                            <p className="text-3xl font-black text-slate-800 mt-2">₱{typedData.total.toLocaleString()}</p>
                        </div>
                        <div className="p-4 space-y-2 flex-1 overflow-y-auto no-scrollbar">
                            {typedData.patients.map(p => (
                                <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:bg-white cursor-pointer">
                                    <p className="font-bold text-sm text-slate-800 group-hover:text-teal-700">{p.name}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-slate-400 font-mono">{p.id}</span>
                                        <span className="text-red-600 font-black text-xs">₱{p.currentBalance?.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                            {typedData.patients.length === 0 && <p className="text-xs text-center text-slate-400 italic p-8">No accounts in this period.</p>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const PhilHealthClaimsTab: React.FC<{
  claims: PhilHealthClaim[],
  patients: Patient[],
  onUpdateClaim?: (claim: PhilHealthClaim) => void
}> = ({ claims, patients, onUpdateClaim }) => {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-6">PhilHealth Claims Registry</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs font-black uppercase text-slate-400 tracking-wider bg-slate-50">
                            <th className="p-4 text-left">Patient</th>
                            <th className="p-4 text-left">Procedure</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-left">Submitted</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {claims.map(claim => {
                            const patient = patients.find(p => p.id === claim.patientId);
                            return (
                                <tr key={claim.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-bold">{patient?.name}</td>
                                    <td className="p-4">{claim.procedureName}</td>
                                    <td className="p-4 text-right font-mono">₱{claim.amountClaimed.toLocaleString()}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                            claim.status === PhilHealthClaimStatus.PAID ? 'bg-teal-50 text-teal-700 border-teal-100' : 
                                            claim.status === PhilHealthClaimStatus.REJECTED ? 'bg-red-50 text-red-700 border-red-100' : 
                                            'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>{claim.status}</span>
                                    </td>
                                    <td className="p-4 font-mono text-xs">{formatDate(claim.dateSubmitted)}</td>
                                </tr>
                            );
                        })}
                         {claims.length === 0 && <tr><td colSpan={5} className="text-center p-12 text-slate-400 italic">No PhilHealth claims recorded.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const HMOClaimsTab: React.FC<{
  claims: HMOClaim[],
  patients: Patient[]
}> = ({ claims, patients }) => {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-6">HMO Claims Management</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs font-black uppercase text-slate-400 tracking-wider bg-slate-50">
                            <th className="p-4 text-left">Patient</th>
                             <th className="p-4 text-left">Provider</th>
                            <th className="p-4 text-left">Procedure</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-left">Submitted</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {claims.map(claim => {
                            const patient = patients.find(p => p.id === claim.patientId);
                            return (
                                <tr key={claim.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-bold">{patient?.name}</td>
                                    <td className="p-4 font-bold text-blue-700">{claim.hmoProvider}</td>
                                    <td className="p-4">{claim.procedureName}</td>
                                    <td className="p-4 text-right font-mono">₱{claim.amountClaimed.toLocaleString()}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                            claim.status === HMOClaimStatus.PAID ? 'bg-teal-50 text-teal-700 border-teal-100' : 
                                            claim.status === HMOClaimStatus.REJECTED ? 'bg-red-50 text-red-700 border-red-100' : 
                                            'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>{claim.status}</span>
                                    </td>
                                    <td className="p-4 font-mono text-xs">{formatDate(claim.dateSubmitted)}</td>
                                </tr>
                            );
                        })}
                        {claims.length === 0 && <tr><td colSpan={6} className="text-center p-12 text-slate-400 italic">No HMO claims recorded.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface PayrollTabProps {
  appointments: Appointment[];
  staff: StaffUser[];
  patients: Patient[];
  fieldSettings?: FieldSettings;
  currentUser: StaffUser;
  payrollPeriods: PayrollPeriod[];
  payrollAdjustments: PayrollAdjustment[];
  commissionDisputes: CommissionDispute[];
  onUpdatePayrollPeriod: (p: PayrollPeriod) => void;
  onAddAdjustment: (a: PayrollAdjustment) => void;
  onApproveAdjustment: (id: string) => void;
  onAddCommissionDispute: (d: CommissionDispute) => void;
  onResolveCommissionDispute: (id: string) => void;
  onAddPayrollPeriod?: (period: Omit<PayrollPeriod, 'id'>) => PayrollPeriod | undefined;
}

const PayrollTab: React.FC<PayrollTabProps> = (props) => {
    const { staff, payrollPeriods, onAddPayrollPeriod, appointments, patients, fieldSettings, payrollAdjustments } = props;
    const [selectedProviderId, setSelectedProviderId] = useState<string>('');
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
    const toast = useToast();

    const handleCreatePeriod = () => {
        if (!selectedProviderId || !onAddPayrollPeriod) return;
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        onAddPayrollPeriod({ providerId: selectedProviderId, startDate, endDate, status: PayrollStatus.OPEN });
        toast.success("New payroll period created.");
    }

    const providerPeriods = useMemo(() => payrollPeriods.filter(p => p.providerId === selectedProviderId), [payrollPeriods, selectedProviderId]);

    const statementData = useMemo(() => {
        if (!selectedPeriodId || !selectedProviderId || !fieldSettings) return null;
        const period = payrollPeriods.find(p => p.id === selectedPeriodId);
        const provider = staff.find(s => s.id === selectedProviderId);
        if (!period || !provider) return null;
        
        const providerAppointments = appointments.filter(a => 
            a.providerId === selectedProviderId && 
            a.date >= period.startDate && 
            a.date <= period.endDate &&
            a.status === AppointmentStatus.COMPLETED
        );

        const commissionItems = providerAppointments.map(apt => {
            const proc = fieldSettings.procedures.find(p => p.name === apt.type);
            const patient = patients.find(p => p.id === apt.patientId);
            if (!proc || !patient) return null;

            const patientHMO = fieldSettings.vendors.find(v => v.type === 'HMO' && v.name === patient.insuranceProvider);
            let priceBookId = patientHMO?.priceBookId || fieldSettings.priceBooks?.find(pb => pb.isDefault)?.id || 'pb_1';
            
            const priceEntry = fieldSettings.priceBookEntries?.find(pbe => pbe.procedureId === proc.id && pbe.priceBookId === priceBookId);
            const price = priceEntry?.price || 0;
            const commission = price * (provider.commissionRate || 0);
            return { apt, patientName: patient.name, price, commission };
        }).filter(Boolean);

        const grossProduction = commissionItems.reduce((sum, item) => sum + (item?.price || 0), 0);
        const totalCommission = commissionItems.reduce((sum, item) => sum + (item?.commission || 0), 0);

        const adjustments = payrollAdjustments.filter(adj => adj.periodId === selectedPeriodId && adj.status === 'Approved');
        const totalAdjustments = adjustments.reduce((sum, adj) => sum + adj.amount, 0);

        return {
            period, provider, commissionItems, grossProduction, totalCommission, adjustments, totalAdjustments, netPayout: totalCommission + totalAdjustments
        };
    }, [selectedPeriodId, selectedProviderId, payrollPeriods, staff, appointments, patients, fieldSettings, payrollAdjustments]);

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div className="flex gap-4">
                    <select value={selectedProviderId} onChange={e => { setSelectedProviderId(e.target.value); setSelectedPeriodId(''); }} className="input w-64"><option value="">Select Practitioner</option>{staff.filter(s => s.role === UserRole.DENTIST).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                    <select value={selectedPeriodId} onChange={e => setSelectedPeriodId(e.target.value)} disabled={!selectedProviderId} className="input w-64"><option value="">Select Period</option>{providerPeriods.map(p => <option key={p.id} value={p.id}>{formatDate(p.startDate)} - {formatDate(p.endDate)}</option>)}</select>
                </div>
                <button onClick={handleCreatePeriod} disabled={!selectedProviderId || !onAddPayrollPeriod} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50">Create Period</button>
            </div>

            {statementData && (
                 <div className="bg-white p-8 rounded-[2.5rem] border-2 border-teal-100 shadow-xl space-y-6">
                     <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Payout Statement: {statementData.provider.name}</h3>
                     <div className="grid grid-cols-3 gap-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><label className="label text-xs">Gross Production</label><div className="font-black text-2xl text-slate-800">₱{statementData.grossProduction.toLocaleString()}</div></div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><label className="label text-xs">Total Commission</label><div className="font-black text-2xl text-teal-700">₱{statementData.totalCommission.toLocaleString()}</div></div>
                        <div className="bg-teal-50 p-4 rounded-xl border-2 border-teal-200"><label className="label text-xs">Net Payout</label><div className="font-black text-3xl text-teal-800">₱{statementData.netPayout.toLocaleString()}</div></div>
                     </div>
                     <div>
                        <h4 className="font-bold text-sm mb-2">Commission Breakdown</h4>
                        <div className="max-h-60 overflow-y-auto border rounded-xl">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-100 sticky top-0"><tr><th className="p-2 text-left">Date</th><th className="p-2 text-left">Patient</th><th className="p-2 text-left">Procedure</th><th className="p-2 text-right">Price</th><th className="p-2 text-right">Commission</th></tr></thead>
                                <tbody>{statementData.commissionItems.map((item, i) => item && <tr key={i} className="border-t"><td className="p-2">{formatDate(item.apt.date)}</td><td className="p-2">{item.patientName}</td><td className="p-2">{item.apt.type}</td><td className="p-2 text-right">₱{item.price.toLocaleString()}</td><td className="p-2 text-right font-bold text-teal-700">₱{item.commission.toLocaleString()}</td></tr>)}</tbody>
                            </table>
                        </div>
                     </div>
                 </div>
            )}
        </div>
    );
};


const Financials: React.FC<FinancialsProps> = (props) => {
  const { 
    claims, expenses, philHealthClaims = [], patients = [], appointments = [], fieldSettings, staff = [], currentUser, 
    onUpdatePhilHealthClaim, reconciliations = [], onSaveReconciliation, cashSessions = [], onStartCashSession, onCloseCashSession, currentBranch,
    governanceTrack, setGovernanceTrack, onAddPayrollPeriod, onBack
  } = props;
  
  const [activeTab, setActiveTab] = useState<string>('analytics');

  const isStatutory = governanceTrack === 'STATUTORY';
  const isBirEnabled = fieldSettings?.features.enableStatutoryBirTrack ?? true;
  const isHmoEnabled = fieldSettings?.features.enableHmoInsuranceTrack ?? true;

  const trackTabs = useMemo(() => {
    const tabs = [
      { id: 'analytics', label: isStatutory ? 'Official Sales Journal' : 'Practice Performance Metrics', icon: isStatutory ? Receipt : Activity },
      { id: 'reconciliation', label: isStatutory ? 'Cash Audit Registry' : 'Operational Estimated Yield', icon: Calculator },
      { id: 'aging', label: isStatutory ? 'Official A/R Aging' : 'Pending Responsibility', icon: Clock },
      { id: 'payroll', label: 'Internal Fee Splits', icon: Award }, 
    ];

    if (isHmoEnabled && fieldSettings?.features.enableHMOClaims) {
      tabs.push({ id: 'claims', label: 'HMO Claims', icon: Heart });
    }
    if (isHmoEnabled && fieldSettings?.features.enablePhilHealthClaims) {
      tabs.push({ id: 'philhealth', label: 'PhilHealth Registry', icon: FileText });
    }

    tabs.push({ id: 'expenses', label: isStatutory ? 'Official Purchase Book' : 'Operational Overhead', icon: isStatutory ? FileText : Package });
    
    return tabs;
  }, [governanceTrack, fieldSettings?.features, isHmoEnabled]);

  const trackMetrics = useMemo(() => {
    let dcv = 0; 
    let ptv = 0; 
    let totalOperationalCollections = 0; 
    let totalStatutoryReceipted = 0; 

    patients.forEach(p => {
        p.dentalChart?.forEach(entry => {
            if (entry.status === 'Completed') dcv += (entry.price || 0);
            if (entry.status === 'Planned') ptv += (entry.price || 0);
        });
        p.ledger?.forEach(entry => {
            if (entry.type === 'Payment') {
                totalOperationalCollections += entry.amount;
                if (entry.orNumber) totalStatutoryReceipted += entry.amount;
            }
        });
    });

    return { 
        dcv, 
        ptv, 
        totalOperationalCollections, 
        totalStatutoryReceipted, 
        gap: totalOperationalCollections - totalStatutoryReceipted 
    };
  }, [patients]);

  const renderContent = () => {
    const filteredPatients = isStatutory 
        ? patients.map(p => ({
            ...p,
            ledger: p.ledger?.filter(l => !!l.orNumber) || []
          }))
        : patients;

    const filteredExpenses = isStatutory
        ? expenses.filter(e => false) 
        : expenses;

    switch (activeTab) {
      case 'analytics': 
        return (
            <div className="space-y-8">
                {!isStatutory && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-500" role="region" aria-label="Financial High-Level Metrics">
                        <div className="bg-white p-6 rounded-[2rem] border border-teal-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
                            <div>
                                <div className="text-xs font-black text-teal-600 uppercase tracking-widest mb-1">Direct Clinical Value</div>
                                <div className="text-3xl font-black text-slate-800">₱{trackMetrics.dcv.toLocaleString()}</div>
                            </div>
                            <div className="text-xs font-bold text-slate-500 mt-4 uppercase flex items-center gap-1"><ShieldCheck size={14} aria-hidden="true"/> Completed Clinical Production</div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-lilac-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
                            <div>
                                <div className="text-xs font-black text-lilac-600 uppercase tracking-widest mb-1">Pending Treatment</div>
                                <div className="text-3xl font-black text-slate-800">₱{trackMetrics.ptv.toLocaleString()}</div>
                            </div>
                            <div className="text-xs font-bold text-slate-500 mt-4 uppercase flex items-center gap-1"><Target size={14} aria-hidden="true"/> Planned Asset Yield</div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
                            <div>
                                <div className="text-xs font-black text-slate-600 uppercase tracking-widest mb-1">Real-World Flow</div>
                                <div className="text-3xl font-black text-slate-800">₱{trackMetrics.totalOperationalCollections.toLocaleString()}</div>
                            </div>
                            <div className="text-xs font-bold text-slate-500 mt-4 uppercase flex items-center gap-1"><CreditCard size={14} aria-hidden="true"/> Gross Cash Position</div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border-2 border-amber-200 shadow-lg ring-8 ring-amber-500/5 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 opacity-5 rotate-12" aria-hidden="true"><ShieldAlert size={80}/></div>
                            <div>
                                <div className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">Audit Compliance Gap</div>
                                <div className="text-3xl font-black text-amber-700">₱{trackMetrics.gap.toLocaleString()}</div>
                            </div>
                            <div className="text-xs font-black text-amber-500 mt-4 uppercase flex items-center gap-1 animate-pulse"><AlertTriangle size={14} aria-hidden="true"/> Potential Audit Exposure</div>
                        </div>
                    </div>
                )}
                
                {!isStatutory && (
                    <div className="bg-white p-10 rounded-[3rem] border border-teal-100 shadow-xl shadow-teal-600/5 animate-in slide-in-from-bottom-4 duration-700" role="region" aria-label="Reconciliation Monitoring">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="bg-teal-100 p-2 rounded-xl text-teal-700"><Layers size={24}/></div>
                                <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">Governance Reconciliation Bridge</h3>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-black text-slate-500 uppercase tracking-widest">Registry Sync Health</div>
                                <div className={`text-sm font-black ${trackMetrics.gap === 0 ? 'text-teal-600' : 'text-amber-600'}`}>
                                    {Math.round((trackMetrics.totalStatutoryReceipted / trackMetrics.totalOperationalCollections) * 100) || 0}% Match
                                </div>
                            </div>
                        </div>
                        <div className="relative h-14 bg-slate-100 rounded-2xl overflow-hidden flex border-4 border-white shadow-inner" role="progressbar" aria-valuenow={Math.round((trackMetrics.totalStatutoryReceipted / trackMetrics.totalOperationalCollections) * 100) || 0} aria-valuemin={0} aria-valuemax={100}>
                            <div className="h-full bg-teal-600 relative group transition-all duration-1000" style={{ width: `${(trackMetrics.totalStatutoryReceipted / trackMetrics.totalOperationalCollections) * 100}%` }}>
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white uppercase px-4 truncate">BIR Receipted</div>
                            </div>
                            <div className="h-full bg-amber-500 flex-1 relative group transition-all duration-1000 delay-300">
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white uppercase px-4 truncate">Unreceipted Flow</div>
                            </div>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-4">
                             <div className="bg-slate-50 p-4 rounded-2xl border border-teal-100 flex items-center justify-between">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Statutory (Official)</span>
                                <span className="font-black text-teal-700 text-lg">₱{trackMetrics.totalStatutoryReceipted.toLocaleString()}</span>
                             </div>
                             <div className="bg-slate-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Risk Margin (Gap)</span>
                                <span className="font-black text-amber-700 text-lg">₱{trackMetrics.gap.toLocaleString()}</span>
                             </div>
                        </div>
                    </div>
                )}

                <Analytics patients={filteredPatients} appointments={appointments} fieldSettings={fieldSettings} staff={staff} />
            </div>
        );
      case 'reconciliation': return <CashReconciliationTab currentBranch={currentBranch} currentUser={currentUser} reconciliations={reconciliations} onSave={onSaveReconciliation} cashSessions={cashSessions} patients={patients} fieldSettings={fieldSettings} onStartSession={onStartCashSession!} onCloseSession={onCloseCashSession!} />;
      case 'payroll': return <PayrollTab {...props} patients={patients} />;
      case 'aging': return <DebtAgingTab patients={filteredPatients} />;
      case 'philhealth': return <PhilHealthClaimsTab claims={philHealthClaims} patients={patients || []} onUpdateClaim={onUpdatePhilHealthClaim} />;
      case 'claims': return <HMOClaimsTab claims={claims} patients={patients || []} />;
      case 'expenses': 
        return (
            <div className="space-y-6">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm text-center">
                    <Package size={48} className="text-slate-200 mx-auto mb-4" aria-hidden="true"/>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{isStatutory ? 'Official Purchase Journal' : 'Operational'}</h3>
                </div>
            </div>
        )
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                {onBack && (
                  <button onClick={onBack} className="bg-white p-4 rounded-full shadow-sm border hover:bg-slate-100 transition-all active:scale-90" aria-label="Back to Admin Hub">
                      <ArrowLeft size={24} className="text-slate-600"/>
                  </button>
                )}
                <div className="bg-teal-600 p-4 rounded-3xl text-white shadow-xl"><DollarSign size={36} /></div>
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">Financial Hub</h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Practice Revenue & Expense Analytics</p>
                </div>
            </div>

            {isBirEnabled && (
                 <div className="bg-white rounded-[2rem] p-2 flex items-center justify-between border-2 border-slate-100 shadow-sm">
                    <div className="flex gap-2">
                        <button onClick={() => setGovernanceTrack('OPERATIONAL')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${governanceTrack === 'OPERATIONAL' ? 'bg-teal-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <Activity size={14}/> Operational
                        </button>
                        <button onClick={() => setGovernanceTrack('STATUTORY')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${governanceTrack === 'STATUTORY' ? 'bg-lilac-700 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <Shield size={14}/> Statutory
                        </button>
                    </div>
                    <div className="px-4 text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Governance Track</div>
                        <div className={`text-xs font-black uppercase tracking-widest ${isStatutory ? 'text-lilac-700' : 'text-teal-700'}`}>{isStatutory ? 'BIR Compliance Mode' : 'Internal Operations'}</div>
                    </div>
                 </div>
            )}
        </div>
        
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-900/5 border-2 border-white flex-1 flex flex-col overflow-hidden relative">
            <div className="flex border-b border-slate-100 px-8 shrink-0 bg-slate-50/50 overflow-x-auto no-scrollbar" role="tablist">
                {trackTabs.map(tab => (
                    <button 
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)} 
                        className={`py-6 px-4 font-black text-xs uppercase tracking-widest border-b-4 flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-teal-600 text-teal-900' : 'border-transparent text-slate-500 hover:text-teal-700 hover:border-teal-200'}`}
                    >
                        <tab.icon size={16} strokeWidth={activeTab === tab.id ? 3 : 2} /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 no-scrollbar">
                {renderContent()}
            </div>
        </div>
    </div>
  );
};

export default Financials;

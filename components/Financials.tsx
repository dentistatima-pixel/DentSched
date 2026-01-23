import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    DollarSign, FileText, Package, BarChart2, Heart, CheckCircle, Clock, Edit2, 
    TrendingUp, Award, UserCheck, Briefcase, Calculator, ShieldCheck, AlertCircle, 
    History, Download, Receipt, User as UserIcon, Filter, PieChart, Calendar, 
    AlertTriangle, ChevronRight, X, User as StaffIcon, ShieldAlert, CreditCard, 
    Lock, Flag, Send, ChevronDown, CheckSquare, Save, Plus, Activity, Target, 
    Scale, Layers, ArrowRight, Shield, PenTool, Fingerprint, ArrowLeft, Printer
} from 'lucide-react';
import { 
    HMOClaim, Expense, PhilHealthClaim, Patient, Appointment, FieldSettings, 
    User as StaffUser, AppointmentStatus, ReconciliationRecord, LedgerEntry, 
    TreatmentPlanStatus, UserRole, CashSession, PayrollPeriod, PayrollAdjustment, 
    CommissionDispute, PayrollStatus, PhilHealthClaimStatus, HMOClaimStatus, PractitionerSignOff, AuditLogEntry, GovernanceTrack,
    // Fix: Import ClinicalIncident type.
    ClinicalIncident 
} from '../types';
import Analytics from './Analytics';
import { formatDate, generateUid } from '../constants';
import { useToast } from './ToastSystem';
import jsPDF from 'jspdf';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  patients: Patient[];
  incidents: ClinicalIncident[];
  fieldSettings?: FieldSettings;
}

const DailyReportModal: React.FC<DailyReportModalProps> = ({ isOpen, onClose, appointments, patients, incidents, fieldSettings }) => {
    const reportData = useMemo(() => {
        const todayStr = new Date().toLocaleDateString('en-CA');
        const todaysApts = appointments.filter(a => a.date === todayStr);
        const completedApts = todaysApts.filter(a => a.status === AppointmentStatus.COMPLETED);
        
        const production = completedApts.reduce((sum, apt) => {
            const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
            const priceEntry = fieldSettings?.priceBookEntries?.find(pbe => pbe.procedureId === proc?.id);
            return sum + (priceEntry?.price || 0);
        }, 0);

        // This is a simplified collection calculation. A real one would check the ledger.
        const collections = production * 0.85; // Assuming 85% collection rate for demo

        const newPatients = patients.filter(p => p.lastVisit === 'First Visit' && todaysApts.some(a => a.patientId === p.id)).length;
        const noShows = todaysApts.filter(a => a.status === AppointmentStatus.NO_SHOW).length;
        const todaysIncidents = incidents.filter(i => i.date === todayStr);

        return { production, collections, patientsSeen: completedApts.length, newPatients, noShows, incidents: todaysIncidents };
    }, [appointments, patients, incidents, fieldSettings]);

    const handlePrint = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("End of Day Report", 105, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.text(new Date().toLocaleDateString('en-US', { dateStyle: 'full' }), 105, 22, { align: 'center' });
        
        (doc as any).autoTable({
            startY: 30,
            head: [['Metric', 'Value']],
            body: [
                ['Total Production', `PHP ${reportData.production.toLocaleString()}`],
                ['Estimated Collections', `PHP ${reportData.collections.toLocaleString()}`],
                ['Patients Seen', reportData.patientsSeen],
                ['New Patients', reportData.newPatients],
                ['No-Shows / Cancellations', reportData.noShows],
                ['Clinical Incidents Logged', reportData.incidents.length],
            ],
        });
        
        doc.save(`EOD_Report_${new Date().toLocaleDateString('en-CA')}.pdf`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-border-primary flex justify-between items-center">
                    <h3 className="font-bold text-text-primary">End of Day Report</h3>
                    <button onClick={onClose}><X/></button>
                </div>
                <div className="p-6 space-y-4">
                    {Object.entries(reportData).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg">
                            <span className="text-sm font-bold text-text-secondary uppercase">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-lg font-black text-text-primary">
                                {typeof value === 'number' ? value.toLocaleString() : Array.isArray(value) ? value.length : 'N/A'}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-border-primary">
                    <button onClick={handlePrint} className="w-full py-3 bg-teal-600 text-white rounded-lg font-bold flex items-center justify-center gap-2"><Printer size={16}/> Print Report</button>
                </div>
            </div>
        </div>
    );
};


interface FinancialsProps {
  claims: HMOClaim[];
  onSaveHmoClaim: (claim: Omit<HMOClaim, 'id'>) => void;
  onUpdateHmoClaimStatus: (claimId: string, status: HMOClaimStatus, amountReceived?: number) => void;
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  philHealthClaims?: PhilHealthClaim[];
  patients?: Patient[];
  appointments?: Appointment[];
  fieldSettings?: FieldSettings;
  staff?: StaffUser[];
  currentUser: StaffUser;
  onUpdatePhilHealthClaim: (updatedClaim: PhilHealthClaim) => void;
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
  onAddPayrollPeriod?: (period: Omit<PayrollPeriod, 'id'>) => PayrollPeriod | undefined;
  onBack?: () => void;
  onStartCashSession: (openingBalance: number) => void;
  onCloseCashSession: (sessionId: string) => void;
  activeSubTab?: string;
  incidents: ClinicalIncident[];
}

const HMOClaimsTab: React.FC<{
  claims: HMOClaim[],
  patients: Patient[],
  onSaveHmoClaim: (claim: Omit<HMOClaim, 'id'>) => void;
  onUpdateHmoClaimStatus: (claimId: string, status: HMOClaimStatus, amountReceived?: number) => void;
}> = ({ claims, patients, onSaveHmoClaim, onUpdateHmoClaimStatus }) => {
    const [showForm, setShowForm] = useState(false);
    const [selectedLedgerEntry, setSelectedLedgerEntry] = useState<{patientId: string, entryId: string} | null>(null);

    const eligibleEntries = useMemo(() => {
        return patients.flatMap(p => 
            p.ledger?.filter(l => l.type === 'Charge' && !claims.some(c => c.ledgerEntryId === l.id))
                .map(l => ({...l, patientId: p.id, patientName: p.name})) || []
        );
    }, [patients, claims]);

    const handleCreateClaim = () => {
        if (!selectedLedgerEntry) return;
        const patient = patients.find(p => p.id === selectedLedgerEntry.patientId);
        const entry = patient?.ledger?.find(l => l.id === selectedLedgerEntry.entryId);
        if (!patient || !entry) return;

        onSaveHmoClaim({
            patientId: patient.id,
            ledgerEntryId: entry.id,
            hmoProvider: patient.insuranceProvider || '',
            procedureName: entry.description,
            amountClaimed: entry.amount,
            status: HMOClaimStatus.SUBMITTED,
            dateSubmitted: new Date().toISOString().split('T')[0]
        });
        setShowForm(false);
        setSelectedLedgerEntry(null);
    };

    return (
        <div className="space-y-6">
            <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><Plus size={16}/> New HMO Claim</button>
            {showForm && (
                <div className="bg-bg-secondary p-6 rounded-2xl border border-border-primary space-y-4">
                    <select onChange={e => setSelectedLedgerEntry(JSON.parse(e.target.value))} className="input">
                        <option value="">Select an eligible charge...</option>
                        {eligibleEntries.map(e => <option key={e.id} value={JSON.stringify({patientId: e.patientId, entryId: e.id})}>{e.patientName} - {e.description} (₱{e.amount})</option>)}
                    </select>
                    <button onClick={handleCreateClaim} className="w-full py-3 bg-teal-600 text-white rounded-lg text-xs font-black uppercase">Create Claim</button>
                </div>
            )}
            <div className="bg-bg-secondary rounded-2xl border border-border-primary overflow-hidden">
                <table className="w-full text-sm">
                    <thead><tr className="bg-bg-tertiary text-xs uppercase"><th className="p-3 text-left text-text-secondary">Patient</th><th className="p-3 text-left text-text-secondary">Procedure</th><th className="p-3 text-right text-text-secondary">Amount</th><th className="p-3 text-center text-text-secondary">Status</th><th className="p-3 text-center text-text-secondary">Actions</th></tr></thead>
                    <tbody>{claims.map(claim => {
                        const patient = patients.find(p => p.id === claim.patientId);
                        return (
                        <tr key={claim.id} className="border-t border-border-secondary">
                            <td className="p-3 font-bold text-text-primary">{patient?.name}</td>
                            <td className="p-3 text-text-primary">{claim.procedureName}</td>
                            <td className="p-3 text-right font-mono text-text-primary">₱{claim.amountClaimed.toLocaleString()}</td>
                            <td className="p-3 text-center"><span className="text-xs font-bold px-2 py-1 rounded bg-bg-tertiary text-text-primary">{claim.status}</span></td>
                            <td className="p-3 text-center">
                                {claim.status === 'Submitted' && 
                                    <div className="flex gap-2 justify-center">
                                        <button onClick={() => { const amt = prompt("Enter amount received:"); onUpdateHmoClaimStatus(claim.id, HMOClaimStatus.PAID, parseFloat(amt || '0'))}} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Paid</button>
                                        <button onClick={() => onUpdateHmoClaimStatus(claim.id, HMOClaimStatus.REJECTED)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Reject</button>
                                    </div>
                                }
                            </td>
                        </tr>
                    )})}</tbody>
                </table>
            </div>
        </div>
    );
};


const ExpensesTab: React.FC<{ expenses: Expense[], categories: string[], onAddExpense: (expense: Omit<Expense, 'id'>) => void, currentBranch: string }> = ({ expenses, categories, onAddExpense, currentBranch }) => {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        category: categories[0] || '',
        description: '',
        amount: '',
        receiptNumber: '',
        supplierTIN: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        const amount = parseFloat(form.amount);
        if (!form.description || isNaN(amount) || amount <= 0) {
            alert("Description and valid amount are required.");
            return;
        }
        onAddExpense({
            ...form,
            amount,
            branch: currentBranch
        });
        setShowForm(false);
        setForm({ date: new Date().toISOString().split('T')[0], category: categories[0] || '', description: '', amount: '', receiptNumber: '', supplierTIN: '' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-text-primary uppercase tracking-tighter">Operational Expenses</h3>
                <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><Plus size={16}/> Log Expense</button>
            </div>
            {showForm && (
                <div className="bg-bg-secondary p-6 rounded-2xl border border-border-primary space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="label text-xs">Date</label><input type="date" name="date" value={form.date} onChange={handleChange} className="input"/></div>
                        <div><label className="label text-xs">Category</label><select name="category" value={form.category} onChange={handleChange} className="input">{categories.map(c => <option key={c}>{c}</option>)}</select></div>
                    </div>
                    <div><label className="label text-xs">Description</label><input type="text" name="description" value={form.description} onChange={handleChange} className="input"/></div>
                    <div className="grid grid-cols-3 gap-4">
                        <div><label className="label text-xs">Amount (₱)</label><input type="number" name="amount" value={form.amount} onChange={handleChange} className="input"/></div>
                        <div><label className="label text-xs">OR #</label><input type="text" name="receiptNumber" value={form.receiptNumber} onChange={handleChange} className="input"/></div>
                        <div><label className="label text-xs">Supplier TIN</label><input type="text" name="supplierTIN" value={form.supplierTIN} onChange={handleChange} className="input"/></div>
                    </div>
                    <div className="flex justify-end gap-2"><button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-xs">Cancel</button><button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold">Save</button></div>
                </div>
            )}
            <div className="bg-bg-secondary rounded-2xl border border-border-primary overflow-hidden">
                <table className="w-full text-sm">
                    <thead><tr className="bg-bg-tertiary text-xs text-text-secondary uppercase"><th className="p-3 text-left">Date</th><th className="p-3 text-left">Description</th><th className="p-3 text-left">Category</th><th className="p-3 text-right">Amount</th></tr></thead>
                    <tbody>{expenses.map(exp => <tr key={exp.id} className="border-t border-border-secondary"><td className="p-3 text-text-secondary">{formatDate(exp.date)}</td><td className="p-3 font-bold text-text-primary">{exp.description}</td><td className="p-3 text-text-primary">{exp.category}</td><td className="p-3 text-right font-mono text-text-primary">₱{exp.amount.toLocaleString()}</td></tr>)}</tbody>
                </table>
            </div>
        </div>
    );
};


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
        if (!activeSession) return;
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
            sessionId: activeSession.id,
        });
        
        onCloseSession(activeSession.id);
        setForm({ actualCash: '', actualCard: '', actualEWallet: '', notes: '' });
    };

    if (!activeSession) {
        return (
             <div className="bg-bg-secondary p-8 rounded-[2.5rem] border-4 border-teal-100 dark:border-teal-900 shadow-xl space-y-6 max-w-md mx-auto">
                <h3 className="text-lg font-black text-text-primary uppercase tracking-tighter text-center">Start of Day Session</h3>
                <p className="text-sm text-center text-text-secondary">No active cash session for {currentBranch}. Enter opening balance to begin.</p>
                <div>
                    <label className="label text-xs">Opening Cash Balance (₱)</label>
                    <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} className="input text-center font-black text-2xl" autoFocus/>
                </div>
                <button onClick={() => onStartSession(parseFloat(openingBalance) || 0)} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-teal-600/20">Start Session</button>
             </div>
        );
    }

    const { actualCash, actualCard, actualEWallet } = form;
    const actualTotal = (parseFloat(actualCash) || 0) + (parseFloat(actualCard) || 0) + (parseFloat(actualEWallet) || 0);
    const discrepancy = actualTotal - systemExpected;

    return (
        <div className="space-y-6 max-w-lg mx-auto">
            <div className="bg-bg-secondary p-8 rounded-[2.5rem] border-4 border-teal-100 dark:border-teal-900 shadow-xl space-y-6">
                <h3 className="text-lg font-black text-text-primary uppercase tracking-tighter">End of Day Session Reconciliation</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-bg-tertiary p-4 rounded-xl">
                        <label className="label text-xs">System Expected Total</label>
                        <div className="text-2xl font-black text-teal-700 dark:text-teal-400">₱{systemExpected.toLocaleString()}</div>
                    </div>
                    <div className={`p-4 rounded-xl ${discrepancy !== 0 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-green-50 dark:bg-green-900/30'}`}>
                        <label className="label text-xs">Discrepancy</label>
                        <div className={`text-2xl font-black ${discrepancy !== 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>₱{discrepancy.toLocaleString()}</div>
                    </div>
                </div>
                <div>
                    <label className="label text-xs">Actual Cash Count</label>
                    <input type="number" name="actualCash" value={form.actualCash} onChange={handleChange} className="input text-lg" />
                </div>
                <div>
                    <label className="label text-xs">Actual Card Slips Total</label>
                    <input type="number" name="actualCard" value={form.actualCard} onChange={handleChange} className="input text-lg" />
                </div>
                <div>
                    <label className="label text-xs">Actual E-Wallet Total</label>
                    <input type="number" name="actualEWallet" value={form.actualEWallet} onChange={handleChange} className="input text-lg" />
                </div>
                <div>
                    <label className="label text-xs">Notes (for discrepancies)</label>
                    <textarea name="notes" value={form.notes} onChange={handleChange} className="input h-24" />
                </div>
                <button onClick={handleSubmit} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-teal-600/20">Finalize & Close Session</button>
            </div>
        </div>
    );
};

const Financials: React.FC<FinancialsProps> = (props) => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [showReportModal, setShowReportModal] = useState(false);
  
  const { 
    claims, expenses, philHealthClaims = [], patients = [], appointments = [], fieldSettings, staff = [], 
    currentUser, onUpdatePhilHealthClaim, reconciliations = [], cashSessions = [], 
    currentBranch, payrollPeriods, payrollAdjustments, commissionDisputes, onUpdatePayrollPeriod,
    onAddPayrollAdjustment, onApproveAdjustment, onAddCommissionDispute, onResolveCommissionDispute,
    governanceTrack, setGovernanceTrack, onAddPayrollPeriod, onSaveReconciliation, onStartCashSession,
    onCloseCashSession, onBack, onAddExpense, onSaveHmoClaim, onUpdateHmoClaimStatus, incidents
  } = props;

  const renderContent = () => {
    switch(activeTab) {
        case 'analytics': return <Analytics patients={patients} appointments={appointments} fieldSettings={fieldSettings} staff={staff} />;
        case 'hmo': return <HMOClaimsTab claims={claims} patients={patients} onSaveHmoClaim={onSaveHmoClaim} onUpdateHmoClaimStatus={onUpdateHmoClaimStatus} />;
        case 'expenses': return <ExpensesTab expenses={expenses} categories={fieldSettings?.expenseCategories || []} onAddExpense={onAddExpense} currentBranch={currentBranch} />;
        case 'reconciliation': return <CashReconciliationTab onSave={onSaveReconciliation} currentUser={currentUser} currentBranch={currentBranch} reconciliations={reconciliations} cashSessions={cashSessions} patients={patients} fieldSettings={fieldSettings} onStartSession={onStartCashSession} onCloseSession={onCloseCashSession} />;
        default: return null;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex-shrink-0 flex orientation-flex justify-between items-start gap-6">
          <div className="flex items-center gap-4">
              {onBack && (
                <button onClick={onBack} className="bg-bg-secondary p-4 rounded-full shadow-sm border border-border-primary hover:bg-bg-tertiary transition-all active:scale-90" aria-label="Back to Admin Hub">
                    <ArrowLeft size={24} className="text-text-primary"/>
                </button>
              )}
              <div className="bg-teal-600 p-4 rounded-3xl text-white shadow-xl" aria-hidden="true"><DollarSign size={36} /></div>
              <div><h1 className="text-4xl font-black text-text-primary tracking-tighter leading-none">Financial Command</h1><p className="text-sm font-bold text-text-secondary uppercase tracking-widest mt-1">Claims, Payroll, and Performance Intelligence.</p></div>
          </div>
          <button onClick={() => setShowReportModal(true)} className="bg-lilac-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3">
              <Printer size={16}/> Generate Daily Report
          </button>
      </header>

      <div className="bg-bg-secondary rounded-[3rem] shadow-2xl shadow-slate-900/5 border-2 border-white dark:border-slate-800/50 flex flex-col relative">
          <div className="flex border-b border-border-primary px-8 shrink-0 bg-slate-50/50 dark:bg-slate-900/20 overflow-x-auto no-scrollbar justify-between items-center" role="tablist" aria-label="Financial Sections">
              <div className="flex gap-2 pt-2">
                  <button role="tab" onClick={() => setActiveTab('analytics')} className={`py-6 px-6 font-black text-xs uppercase tracking-widest border-b-4 flex items-center gap-3 transition-all ${activeTab === 'analytics' ? 'border-teal-600 text-teal-900 dark:text-teal-300 bg-bg-secondary' : 'border-transparent text-text-secondary'}`}><BarChart2 size={18}/> Analytics</button>
                  <button role="tab" onClick={() => setActiveTab('hmo')} className={`py-6 px-6 font-black text-xs uppercase tracking-widest border-b-4 flex items-center gap-3 transition-all ${activeTab === 'hmo' ? 'border-teal-600 text-teal-900 dark:text-teal-300 bg-bg-secondary' : 'border-transparent text-text-secondary'}`}><Heart size={18}/> HMO Claims</button>
                  <button role="tab" onClick={() => setActiveTab('expenses')} className={`py-6 px-6 font-black text-xs uppercase tracking-widest border-b-4 flex items-center gap-3 transition-all ${activeTab === 'expenses' ? 'border-teal-600 text-teal-900 dark:text-teal-300 bg-bg-secondary' : 'border-transparent text-text-secondary'}`}><Package size={18}/> Expenses</button>
                  <button role="tab" onClick={() => setActiveTab('reconciliation')} className={`py-6 px-6 font-black text-xs uppercase tracking-widest border-b-4 flex items-center gap-3 transition-all ${activeTab === 'reconciliation' ? 'border-teal-600 text-teal-900 dark:text-teal-300 bg-bg-secondary' : 'border-transparent text-text-secondary'}`}><Calculator size={18}/> Reconciliation</button>
              </div>
          </div>
          
          <div className="p-10 bg-bg-primary/50">
              {renderContent()}
          </div>
      </div>

      <DailyReportModal 
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        appointments={appointments}
        patients={patients}
        incidents={incidents}
        fieldSettings={fieldSettings}
      />
    </div>
  );
};

export default Financials;
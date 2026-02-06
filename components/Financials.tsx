
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
    CommissionDispute, PayrollStatus, PhilHealthClaimStatus, PractitionerSignOff, AuditLogEntry, GovernanceTrack,
    ClinicalIncident,
    HMOClaimStatus
} from '../types';
import Analytics from './Analytics';
import { formatDate, generateUid } from '../constants';
import { useToast } from './ToastSystem';
import { useSettings } from '../contexts/SettingsContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Payroll from './Payroll';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  patients: Patient[];
  incidents: ClinicalIncident[];
  fieldSettings?: FieldSettings;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({ isOpen, onClose, appointments, patients, incidents, fieldSettings }) => {
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


interface ReconciliationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<ReconciliationRecord, 'id' | 'timestamp'>) => void;
  session: CashSession;
  appointments: Appointment[];
  patients: Patient[];
  currentUser: StaffUser;
}

const ReconciliationWizard: React.FC<ReconciliationWizardProps> = ({ isOpen, onClose, onSave, session, appointments, patients, currentUser }) => {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ actualCash: '', actualCard: '', actualEWallet: '', notes: '' });

    const expectedTotal = useMemo(() => {
        // A real implementation would filter ledger entries by this specific cash session
        return 50000; // Placeholder
    }, [session, appointments, patients]);
    
    const actualTotal = useMemo(() => {
        return parseFloat(form.actualCash || '0') + parseFloat(form.actualCard || '0') + parseFloat(form.actualEWallet || '0');
    }, [form]);
    
    const discrepancy = actualTotal - expectedTotal;

    if (!isOpen) return null;

    const renderStep = () => {
        switch(step) {
            case 1:
                return (
                    <div className="text-center">
                        <h3 className="text-2xl font-black">Reconcile Session</h3>
                        <p className="text-slate-500 mt-2">Opened by {session.openedByName} at {new Date(session.startTime).toLocaleTimeString()}</p>
                        <div className="mt-6 bg-slate-100 p-4 rounded-xl">
                            <p className="text-sm font-bold">Opening Balance: ₱{session.openingBalance.toLocaleString()}</p>
                            <p className="text-sm font-bold">Expected Collections: ₱{expectedTotal.toLocaleString()}</p>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div>
                        <h3 className="text-xl font-black mb-4">Enter Actual Collections</h3>
                        <div className="space-y-4">
                            <div><label className="label text-xs">Actual Cash</label><input type="number" value={form.actualCash} onChange={e => setForm({...form, actualCash: e.target.value})} className="input text-lg font-black" autoFocus/></div>
                            <div><label className="label text-xs">Actual Card</label><input type="number" value={form.actualCard} onChange={e => setForm({...form, actualCard: e.target.value})} className="input text-lg font-black"/></div>
                            <div><label className="label text-xs">Actual E-Wallet</label><input type="number" value={form.actualEWallet} onChange={e => setForm({...form, actualEWallet: e.target.value})} className="input text-lg font-black"/></div>
                        </div>
                    </div>
                );
            case 3:
                 return (
                    <div className="text-center">
                        <h3 className="text-2xl font-black">Review Discrepancy</h3>
                        <p className={`text-4xl font-black my-4 ${discrepancy === 0 ? 'text-teal-600' : 'text-red-600'}`}>
                            {discrepancy > 0 ? '+' : ''}₱{discrepancy.toLocaleString()}
                        </p>
                        {discrepancy !== 0 && (
                            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input h-24" placeholder="Explain the discrepancy..."/>
                        )}
                    </div>
                 );
            default: return null;
        }
    }
    
    const handleNext = () => {
        if (step === 3) {
            onSave({
                date: new Date().toISOString().split('T')[0],
                branch: session.branch,
                expectedTotal,
                actualCash: parseFloat(form.actualCash),
                actualCard: parseFloat(form.actualCard),
                actualEWallet: parseFloat(form.actualEWallet),
                discrepancy,
                notes: form.notes,
                verifiedBy: currentUser.id,
                sessionId: session.id,
                resolutionStatus: discrepancy === 0 ? 'Resolved' : 'Pending Review'
            });
            onClose();
        } else {
            setStep(s => s + 1);
        }
    };

    return (
      <div className="fixed inset-0 bg-slate-900/60 z-[110] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg p-8">
            <div className="mb-8">{renderStep()}</div>
            <div className="flex justify-between items-center">
                <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="text-sm font-bold disabled:opacity-50">Back</button>
                <button onClick={handleNext} className="px-6 py-3 bg-teal-600 text-white rounded-lg text-sm font-bold">
                    {step === 3 ? 'Submit Reconciliation' : 'Next'}
                </button>
            </div>
        </div>
      </div>
    );
};


interface FinancialsProps {
  claims: HMOClaim[];
  onSaveHmoClaim: (claim: Omit<HMOClaim, 'id'>) => void;
  onUpdateHmoClaimStatus: (claimId: string, status: HMOClaimStatus, data?: { amountReceived?: number; rejectionReason?: string }) => void;
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  philHealthClaims?: PhilHealthClaim[];
  patients?: Patient[];
  appointments?: Appointment[];
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
  onAddPayrollPeriod?: (period: Omit<PayrollPeriod, 'id'>) => Promise<PayrollPeriod | undefined>;
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
  onUpdateHmoClaimStatus: (claimId: string, status: HMOClaimStatus, data?: { amountReceived?: number; rejectionReason?: string }) => void;
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
                                {claim.status === HMOClaimStatus.SUBMITTED && 
                                    <div className="flex gap-2 justify-center">
                                        <button onClick={() => { const amt = prompt("Enter amount received:"); onUpdateHmoClaimStatus(claim.id, HMOClaimStatus.PAID, { amountReceived: parseFloat(amt || '0') })}} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Paid</button>
                                        <button onClick={() => { const reason = prompt("Reason for rejection:"); onUpdateHmoClaimStatus(claim.id, HMOClaimStatus.REJECTED, { rejectionReason: reason || 'No reason provided' })}} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Reject</button>
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
                    <div className="flex justify-end gap-2"><button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold">Cancel</button><button onClick={handleSubmit} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold">Save Expense</button></div>
                </div>
            )}
            <div className="bg-bg-secondary rounded-2xl border border-border-primary overflow-hidden">
                <table className="w-full text-sm">
                    <thead><tr className="bg-bg-tertiary text-xs uppercase"><th className="p-3 text-left text-text-secondary">Date</th><th className="p-3 text-left text-text-secondary">Description</th><th className="p-3 text-left text-text-secondary">Category</th><th className="p-3 text-right text-text-secondary">Amount</th></tr></thead>
                    <tbody>{expenses.map(exp => (
                        <tr key={exp.id} className="border-t border-border-secondary">
                            <td className="p-3 font-mono text-xs text-text-secondary">{formatDate(exp.date)}</td>
                            <td className="p-3 font-bold text-text-primary">{exp.description}</td>
                            <td className="p-3 text-text-secondary">{exp.category}</td>
                            <td className="p-3 text-right font-mono font-bold text-text-primary">₱{exp.amount.toLocaleString()}</td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
};

export const Financials: React.FC<FinancialsProps> = (props) => {
    const { onBack, activeSubTab, reconciliations = [] } = props;
    const { fieldSettings } = useSettings();
    const [activeTab, setActiveTab] = useState(activeSubTab || 'hmo');
    const [showEODReport, setShowEODReport] = useState(false);
    const [showReconWizard, setShowReconWizard] = useState(false);

    const tabs = [
        { id: 'hmo', label: 'HMO Claims', icon: Briefcase },
        { id: 'expenses', label: 'Expenses', icon: DollarSign },
        { id: 'payroll', label: 'Payroll', icon: Calculator },
        { id: 'reconciliation', label: 'Reconciliation', icon: ShieldCheck },
    ];
    
    const activeCashSession = props.cashSessions?.find(cs => cs.branch === props.currentBranch && cs.status === 'Open');

    const renderContent = () => {
        switch(activeTab) {
            case 'hmo':
                return <HMOClaimsTab claims={props.claims} patients={props.patients || []} onSaveHmoClaim={props.onSaveHmoClaim} onUpdateHmoClaimStatus={props.onUpdateHmoClaimStatus} />;
            case 'expenses':
                return <ExpensesTab expenses={props.expenses} categories={fieldSettings.expenseCategories || []} onAddExpense={props.onAddExpense} currentBranch={props.currentBranch} />;
            case 'payroll':
                return <Payroll
                    payrollPeriods={props.payrollPeriods}
                    payrollAdjustments={props.payrollAdjustments}
                    commissionDisputes={props.commissionDisputes}
                    onUpdatePayrollPeriod={props.onUpdatePayrollPeriod}
                    onAddPayrollAdjustment={props.onAddPayrollAdjustment}
                    onApproveAdjustment={props.onApproveAdjustment}
                    onAddCommissionDispute={props.onAddCommissionDispute}
                    onResolveCommissionDispute={props.onResolveCommissionDispute}
                    staff={props.staff || []}
                    currentUser={props.currentUser}
                    onAddPayrollPeriod={props.onAddPayrollPeriod}
                />;
            case 'reconciliation':
                 return (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <button onClick={() => activeCashSession && setShowReconWizard(true)} disabled={!activeCashSession} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                                <Plus size={16}/> Start EOD Reconciliation
                            </button>
                        </div>
                        {!activeCashSession && <p className="text-sm text-slate-500 text-center p-4 bg-slate-50 rounded-lg">No active cash session for this branch.</p>}
                        
                        <h4 className="font-black text-sm text-slate-500 uppercase tracking-[0.3em]">Reconciliation History</h4>
                        <div className="bg-bg-secondary rounded-2xl border border-border-primary overflow-hidden">
                            <table className="w-full text-sm">
                                <thead><tr className="bg-bg-tertiary text-xs uppercase"><th className="p-3 text-left text-text-secondary">Date</th><th className="p-3 text-right text-text-secondary">Expected</th><th className="p-3 text-right text-text-secondary">Actual</th><th className="p-3 text-right text-text-secondary">Discrepancy</th><th className="p-3 text-center text-text-secondary">Status</th><th className="p-3 text-left text-text-secondary">Verified By</th></tr></thead>
                                <tbody>
                                    {reconciliations.map(rec => {
                                        const actual = rec.actualCash + rec.actualCard + rec.actualEWallet;
                                        return (
                                            <tr key={rec.id} className="border-t border-border-secondary">
                                                <td className="p-3 font-mono text-xs">{formatDate(rec.date)}</td>
                                                <td className="p-3 text-right font-mono">₱{rec.expectedTotal.toLocaleString()}</td>
                                                <td className="p-3 text-right font-mono">₱{actual.toLocaleString()}</td>
                                                <td className={`p-3 text-right font-mono font-bold ${rec.discrepancy !== 0 ? 'text-red-600' : 'text-green-600'}`}>₱{rec.discrepancy.toLocaleString()}</td>
                                                <td className="p-3 text-center"><span className={`text-xs font-bold px-2 py-1 rounded ${rec.resolutionStatus === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{rec.resolutionStatus}</span></td>
                                                <td className="p-3 text-xs font-bold">{rec.verifiedByName}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                             {reconciliations.length === 0 && <p className="text-center italic text-slate-400 p-8">No reconciliation records found.</p>}
                        </div>
                    </div>
                 );
            default:
                return null;
        }
    };
    
    return (
      <div className="p-8 space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
            {onBack && (<button onClick={onBack} className="bg-white p-4 rounded-full shadow-sm border hover:bg-slate-100 transition-all active:scale-90" aria-label="Back to Admin Hub"><ArrowLeft size={24} className="text-slate-600"/></button>)}
            <div className="bg-emerald-600 p-4 rounded-3xl text-white shadow-xl"><DollarSign size={36} /></div>
            <div><h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">Financials</h1><p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Claims, Expenses, and Reconciliation</p></div>
        </div>
        <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm self-start flex gap-2">
            {tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500'}`}><tab.icon size={16} /> {tab.label}</button>))}
             <button onClick={() => setShowEODReport(true)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg"><History size={16}/> EOD Report</button>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            {renderContent()}
        </div>
        <DailyReportModal isOpen={showEODReport} onClose={() => setShowEODReport(false)} appointments={props.appointments || []} patients={props.patients || []} incidents={props.incidents} fieldSettings={fieldSettings} />
        {activeCashSession && <ReconciliationWizard isOpen={showReconWizard} onClose={() => setShowReconWizard(false)} onSave={props.onSaveReconciliation} session={activeCashSession} appointments={props.appointments || []} patients={props.patients || []} currentUser={props.currentUser} />}
      </div>
    );
};

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    DollarSign, FileText, Package, BarChart2, Heart, CheckCircle, Clock, Edit2, 
    TrendingUp, Award, UserCheck, Briefcase, Calculator, ShieldCheck, AlertCircle, 
    History, Download, Receipt, User as UserIcon, Filter, PieChart, Calendar, 
    AlertTriangle, ChevronRight, X, User as StaffIcon, ShieldAlert, CreditCard, 
    Lock, Flag, Send, ChevronDown, CheckSquare, Save, Plus, Activity, Target, 
    Scale, Layers, ArrowRight, Shield, PenTool, Fingerprint
} from 'lucide-react';
import { 
    HMOClaim, Expense, PhilHealthClaim, Patient, Appointment, FieldSettings, 
    User as StaffUser, AppointmentStatus, ReconciliationRecord, LedgerEntry, 
    TreatmentPlanStatus, UserRole, CashSession, PayrollPeriod, PayrollAdjustment, 
    CommissionDispute, PayrollStatus, PhilHealthClaimStatus, HMOClaimStatus, PractitionerSignOff, AuditLogEntry 
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
  onSaveReconciliation?: (record: ReconciliationRecord) => void;
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
}

type GovernanceTrack = 'STATUTORY' | 'OPERATIONAL';

const CashReconciliationTab: React.FC<any> = () => <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-100 text-slate-500 font-bold italic">Cash Reconciliation Interface Syncing...</div>;
const DebtAgingTab: React.FC<any> = () => <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-100 text-slate-500 font-bold italic">A/R Aging Analysis Interface Syncing...</div>;
const PhilHealthClaimsTab: React.FC<any> = () => <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-100 text-slate-500 font-bold italic">PhilHealth Statutory Registry Syncing...</div>;
const HMOClaimsTab: React.FC<any> = () => <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-100 text-slate-500 font-bold italic">HMO Claims Management Interface Syncing...</div>;

const Financials: React.FC<FinancialsProps> = (props) => {
  const { 
    claims, expenses, philHealthClaims = [], patients = [], appointments = [], fieldSettings, staff, currentUser, 
    onUpdatePhilHealthClaim, reconciliations = [], onSaveReconciliation, onSaveCashSession, currentBranch 
  } = props;
  
  const [activeTab, setActiveTab] = useState<string>('analytics');
  const [governanceTrack, setGovernanceTrack] = useState<GovernanceTrack>('OPERATIONAL');

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
      case 'reconciliation': return <CashReconciliationTab patients={filteredPatients} currentBranch={currentBranch} currentUser={currentUser} reconciliations={reconciliations} onSave={onSaveReconciliation} onSaveSession={onSaveCashSession} fieldSettings={fieldSettings} />;
      case 'payroll': return (
        <PayrollTab 
            appointments={appointments || []} 
            staff={staff || []} 
            expenses={filteredExpenses} 
            fieldSettings={fieldSettings} 
            currentUser={currentUser}
            payrollPeriods={props.payrollPeriods}
            payrollAdjustments={props.payrollAdjustments}
            commissionDisputes={props.commissionDisputes}
            onUpdatePayrollPeriod={props.onUpdatePayrollPeriod}
            onAddAdjustment={props.onAddPayrollAdjustment}
            onApproveAdjustment={props.onApproveAdjustment}
            onAddCommissionDispute={props.onAddCommissionDispute}
            onResolveCommissionDispute={props.onResolveCommissionDispute}
        />
      );
      case 'aging': return <DebtAgingTab patients={filteredPatients} />;
      case 'philhealth': return <PhilHealthClaimsTab claims={philHealthClaims} patients={patients} onUpdateClaim={onUpdatePhilHealthClaim} />;
      case 'claims': return <HMOClaimsTab claims={claims} patients={patients} />;
      case 'expenses': 
        return (
            <div className="space-y-6">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm text-center">
                    <Package size={48} className="text-slate-200 mx-auto mb-4" aria-hidden="true"/>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{isStatutory ? 'Official Purchase Journal' : 'Operational Overhead Analysis'}</h3>
                    <p className="text-sm text-slate-600 mt-2 font-bold uppercase tracking-widest">Resource tracking and clinic functioning expenditures.</p>
                </div>
            </div>
        );
      default: return <div className="p-10 text-center text-slate-500 italic font-bold">Module interface synchronizing...</div>;
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24" role="main" aria-label="Financial Management System">
      <header className="flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
              <div className={`p-4 rounded-3xl shadow-xl transition-all duration-500 ${isStatutory ? 'bg-lilac-600 text-white rotate-6' : 'bg-teal-600 text-white'}`} aria-hidden="true">
                  {isStatutory ? <ShieldCheck size={36} /> : <Activity size={36} />}
              </div>
              <div>
                  <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">{isStatutory ? 'Registry Monitor' : 'Practice Pulse'}</h1>
                  <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-widest border ${isStatutory ? 'bg-lilac-50 border-lilac-200 text-lilac-700' : 'bg-teal-50 border-teal-200 text-teal-800'}`}>
                          {isStatutory ? 'Statutory Audit Active' : 'Real-World Business Intelligence'}
                      </span>
                      {isStatutory && <span className="text-xs font-bold text-slate-500 uppercase italic tracking-tight">NPC/BIR Compliance Mode</span>}
                  </div>
              </div>
          </div>
          
          {isBirEnabled && (
            <div className="bg-slate-200/50 p-1.5 rounded-[1.5rem] flex gap-2 border border-slate-300 shadow-inner" role="group" aria-label="Compliance Track Toggle">
                  <button 
                      onClick={() => { setGovernanceTrack('STATUTORY'); setActiveTab('analytics'); }}
                      className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isStatutory ? 'bg-white text-lilac-800 shadow-xl border border-lilac-100 scale-105' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                      aria-pressed={isStatutory}
                  >
                      <Receipt size={16} aria-hidden="true"/> Statutory Registry (BIR)
                  </button>
                  <button 
                      onClick={() => { setGovernanceTrack('OPERATIONAL'); setActiveTab('analytics'); }}
                      className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${!isStatutory ? 'bg-white text-teal-800 shadow-xl border border-lilac-100 scale-105' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                      aria-pressed={!isStatutory}
                  >
                      <Target size={16} aria-hidden="true"/> Operational Pulse (Real)
                  </button>
            </div>
          )}
      </header>

      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-900/5 border-2 border-white flex-1 flex flex-col overflow-hidden relative">
        <div className="flex border-b border-slate-100 px-8 shrink-0 bg-slate-50/50 overflow-x-auto no-scrollbar gap-2 pt-2" role="tablist" aria-label="Financial modules">
            {trackTabs.map(tab => (
                 <button 
                    key={tab.id} 
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`${tab.id}-panel`}
                    onClick={() => setActiveTab(tab.id)} 
                    className={`py-6 px-6 font-black text-xs uppercase tracking-widest border-b-4 transition-all whitespace-nowrap flex items-center gap-3 ${activeTab === tab.id ? 'border-teal-600 text-teal-900 bg-white' : 'border-transparent text-slate-500 hover:text-teal-700 hover:bg-white/50'}`}
                >
                    <tab.icon size={18} aria-hidden="true" /> {tab.label}
                </button>
            ))}
        </div>
        
        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 no-scrollbar" id={`${activeTab}-panel`}>
            {renderContent()}
        </div>

        {!isStatutory && (
            <div className="absolute bottom-0 left-0 right-0 bg-lilac-700 text-white px-8 py-3 flex items-center justify-center gap-4 z-50 shadow-[0_-8px_30px_rgba(162,28,175,0.4)] animate-in slide-in-from-bottom-full duration-1000" role="complementary">
                <Shield size={16} className="animate-bounce shrink-0" aria-hidden="true"/>
                <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">INTERNAL MANAGEMENT AID ONLY: THESE METRICS REPRESENT CLINICAL WORKFLOW AND OPERATIONAL ESTIMATES. THIS IS NOT AN ACCOUNTING RECORD AND DOES NOT REFLECT STATUTORY TAX DECLARATIONS. CLINICAL DECISIONS REMAIN THE SOLE RESPONSIBILITY OF THE DENTIST.</span>
            </div>
        )}
      </div>

      {isStatutory && (
          <div className="flex justify-center animate-in slide-in-from-bottom-2">
              <button className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center gap-4 shadow-2xl hover:bg-slate-800 hover:-translate-y-1 transition-all active:scale-95 group">
                  <Download size={20} className="text-teal-400 group-hover:animate-bounce" aria-hidden="true"/> Compile Official Journals for External Audit
              </button>
          </div>
      )}
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
    onAddCommissionDispute: (d: CommissionDispute) => void,
    onResolveCommissionDispute: (id: string) => void
}> = ({ appointments, staff, expenses, fieldSettings, currentUser, payrollPeriods, payrollAdjustments, commissionDisputes, onUpdatePayrollPeriod, onAddAdjustment, onApproveAdjustment, onAddCommissionDispute: onAddDispute, onResolveCommissionDispute: onResolveDispute }) => {
    const toast = useToast();
    const dentists = staff.filter(s => s.role === UserRole.DENTIST);
    const [selectedDentistId, setSelectedDentistId] = useState<string>(currentUser.role === UserRole.DENTIST ? currentUser.id : dentists[0]?.id || '');
    const [disputeModal, setDisputeModal] = useState<{ itemId: string, itemName: string } | null>(null);
    const [disputeNote, setDisputeNote] = useState('');
    const [adjModal, setAdjModal] = useState(false);
    const [adjForm, setAdjForm] = useState({ reason: '', amount: '' });

    const isAdmin = currentUser.role === UserRole.ADMIN;

    const currentDentist = staff.find(s => s.id === selectedDentistId);
    
    const isEligibleForSplit = useMemo(() => currentDentist?.role === UserRole.DENTIST, [currentDentist]);

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
    const baseCommission = isEligibleForSplit ? (netBase * commissionRate) : 0;
    const finalPayout = baseCommission + approvedAdjustmentsTotal;

    const handleClosePeriod = () => {
        onUpdatePayrollPeriod({ ...period, status: PayrollStatus.CLOSED, closedAt: new Date().toISOString() });
        toast.success("Split statement closed. Review period active.");
    };

    const handleLockPeriod = () => {
        onUpdatePayrollPeriod({ ...period, status: PayrollStatus.LOCKED, lockedAt: new Date().toISOString() });
        toast.success("Split statement locked. Record is now immutable.");
    };

    const handlePractitionerSignOff = async () => {
        const pin = prompt(`Digital Certification: Please enter your professional PIN to acknowledge production of ₱${finalPayout.toLocaleString()}:`);
        if (pin === '1234') {
            const payload = `${period.id}|${selectedDentistId}|${finalPayout}|${new Date().toISOString()}`;
            const hash = CryptoJS.SHA256(payload).toString();
            
            const signOff: PractitionerSignOff = {
                timestamp: new Date().toISOString(),
                hash: hash,
                ipAddress: 'Internal Practice Terminal'
            };

            onUpdatePayrollPeriod({ 
                ...period, 
                status: PayrollStatus.LOCKED, 
                lockedAt: signOff.timestamp,
                practitionerSignOff: signOff 
            });

            logAction('SIGN_OFF_RECORD', 'Payroll', period.id, `Practitioner ${currentDentist?.name} verified and certified production payout statement.`);
            toast.success("Statement certified and locked.");
        }
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

    const logAction = async (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => {};

    return (
        <div className="space-y-6" role="region" aria-label="Fee Split Management">
            {isAdmin && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <UserIcon size={20} className="text-teal-600" aria-hidden="true"/>
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">Viewing Practitioner Statement:</span>
                        <select 
                            aria-label="Select practitioner"
                            value={selectedDentistId} 
                            onChange={e => setSelectedDentistId(e.target.value)}
                            className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-sm font-black outline-none focus:border-teal-500"
                        >
                            {dentists.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        {period.status === PayrollStatus.OPEN && <button onClick={handleClosePeriod} className="px-4 py-2 bg-lilac-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-lilac-700 transition-colors">Close for Review</button>}
                        {period.status === PayrollStatus.CLOSED && <button onClick={handleLockPeriod} className="px-4 py-2 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg flex items-center gap-2 hover:bg-slate-800 transition-colors"><Lock size={14} aria-hidden="true"/> Finalize & Sign</button>}
                    </div>
                </div>
            )}

            <div className={`p-4 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-4 ${isLocked ? 'bg-slate-900' : isClosed ? 'bg-lilac-600' : 'bg-teal-900'}`}>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isLocked ? 'bg-slate-800 text-red-400 border-slate-700' : 'bg-white/10 text-white border-white/20'}`}>
                            {isLocked ? <Lock size={20} aria-hidden="true"/> : <Award size={20} aria-hidden="true"/>}
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Fee Split Statement</div>
                            <div className="text-sm font-black text-white uppercase tracking-wider">{period.status} {isLocked && '• IMMUTABLE RECORD'}</div>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Statement Period</div>
                    <div className="text-xs font-black text-white tracking-widest uppercase">{formatDate(period.startDate)} - {formatDate(period.endDate)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2"><Briefcase size={18} aria-hidden="true"/> Production Attribution</h3>
                    <div className="overflow-hidden border border-slate-100 rounded-2xl">
                        <table className="w-full text-left text-sm" role="table" aria-label="Attributed Procedures">
                            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-500 tracking-widest">
                                <tr><th className="p-4">Date</th><th className="p-4">Procedure</th><th className="p-4 text-right">Fee (₱)</th><th className="p-4 text-center">Status</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                                {completed.map(apt => {
                                    const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
                                    const dispute = commissionDisputes.find(d => d.itemId === apt.id);
                                    return (
                                        <tr key={apt.id} className={`group hover:bg-slate-50 transition-colors ${dispute ? 'bg-orange-50/50' : ''}`}>
                                            <td className="p-4 font-mono text-xs text-slate-500">{formatDate(apt.date)}</td>
                                            <td className="p-4">
                                                <div className="uppercase tracking-tight text-slate-800">{apt.type}</div>
                                                {dispute && <div className="text-[10px] font-black text-orange-600 flex items-center gap-1 mt-1 uppercase tracking-tighter"><AlertTriangle size={12} aria-hidden="true"/> DISPUTED: "{dispute.note}"</div>}
                                            </td>
                                            <td className="p-4 text-right font-black text-slate-900">₱{proc?.price.toLocaleString()}</td>
                                            <td className="p-4 text-center">
                                                {!isLocked && !dispute && (
                                                    <button 
                                                        onClick={() => setDisputeModal({ itemId: apt.id, itemName: apt.type })}
                                                        className="p-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-orange-600 transition-all"
                                                        title="Raise Split Dispute"
                                                        aria-label={`Raise dispute for ${apt.type}`}
                                                    >
                                                        <Flag size={14}/>
                                                    </button>
                                                )}
                                                {dispute && dispute.status === 'Open' && isAdmin && (
                                                    <button onClick={() => onResolveDispute(dispute.id)} className="text-xs font-black text-teal-800 uppercase bg-teal-100 px-3 py-1 rounded-full border border-teal-200 hover:bg-teal-200 transition-colors">Resolve</button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="pt-8 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2"><CreditCard size={18} aria-hidden="true"/> Non-Percentage Adjustments</h3>
                            {!isLocked && <button onClick={() => setAdjModal(true)} className="px-4 py-1.5 bg-teal-50 text-teal-800 text-xs font-black uppercase rounded-xl border border-teal-200 hover:bg-teal-100 transition-all">+ Add Credit/Debit</button>}
                        </div>
                        <div className="space-y-3">
                            {payrollAdjustments.filter(a => a.periodId === period.id).map(adj => (
                                <div key={adj.id} className={`p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${adj.status === 'Approved' ? 'bg-teal-50/50 border-teal-200' : 'bg-slate-50 border-slate-300 border-dashed'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl shadow-sm ${adj.status === 'Approved' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                            <DollarSign size={20} aria-hidden="true"/>
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{adj.reason}</div>
                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{adj.status} • Requested by {staff.find(s => s.id === adj.requestedBy)?.name}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-lg font-black ${adj.amount >= 0 ? 'text-teal-700' : 'text-red-700'}`}>{adj.amount >= 0 ? '+' : ''}₱{Math.abs(adj.amount).toLocaleString()}</span>
                                        {adj.status === 'Pending' && isAdmin && (
                                            <button onClick={() => onApproveAdjustment(adj.id)} className="p-3 bg-teal-600 text-white rounded-xl shadow-xl hover:bg-teal-700 transition-all" aria-label="Approve adjustment"><CheckSquare size={18}/></button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border-4 border-teal-500 shadow-2xl space-y-8 flex-1 flex flex-col">
                        <div className="flex justify-between items-start">
                            <h3 className="font-black text-teal-900 uppercase tracking-tighter text-xl">Payout Summary</h3>
                        </div>
                        <div className="space-y-5">
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-slate-500 uppercase tracking-widest text-xs">Gross Attribution</span>
                                <span className="font-black text-slate-900">₱{grossProduction.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-slate-500 uppercase tracking-widest text-xs">Attributable Lab (-)</span>
                                <span className="font-black text-red-700">-₱{labFees.toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-slate-100" aria-hidden="true" />
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-slate-800 font-black uppercase tracking-widest text-xs">Adjusted Practice Yield</span>
                                <span className="font-black text-slate-950">₱{netBase.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className={`font-black uppercase tracking-widest text-xs ${isEligibleForSplit ? 'text-teal-700' : 'text-slate-400 italic'}`}>
                                    {isEligibleForSplit ? `Contracted Split (${commissionRate * 100}%)` : 'Non-eligible for Splits'}
                                </span>
                                <span className={`font-black ${isEligibleForSplit ? 'text-teal-800' : 'text-slate-400'}`}>
                                    ₱{baseCommission.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-slate-500 uppercase tracking-widest text-xs">Manual Adjustments (+)</span>
                                <span className={`font-black ${approvedAdjustmentsTotal >= 0 ? 'text-teal-700' : 'text-red-700'}`}>₱{approvedAdjustmentsTotal.toLocaleString()}</span>
                            </div>
                            
                            <div className="pt-8 mt-8 border-t-4 border-teal-50">
                                <div className="text-xs font-black uppercase tracking-[0.2em] text-teal-700 text-center mb-2">Total Payout Entitlement</div>
                                <div className="text-5xl font-black text-teal-900 text-center tracking-tighter">₱{finalPayout.toLocaleString()}</div>
                            </div>
                        </div>

                        {!isLocked && currentUser.id === selectedDentistId && isClosed && (
                            <div className="p-6 rounded-3xl border-2 border-lilac-300 bg-lilac-50/50 space-y-4 animate-in slide-in-from-bottom-4 duration-500" role="complementary">
                                <div className="flex items-center gap-3 text-lilac-900">
                                    <PenTool size={20} aria-hidden="true"/>
                                    <h4 className="font-black uppercase tracking-widest text-sm">Practitioner Attestation</h4>
                                </div>
                                <p className="text-xs text-lilac-800 leading-relaxed font-bold uppercase tracking-tight">
                                    I certify that I have reviewed the production attribution and final split calculation for this period. I acknowledge receipt of this statement as an accurate reflection of clinical work performed.
                                </p>
                                <button 
                                    onClick={handlePractitionerSignOff}
                                    className="w-full py-5 bg-lilac-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-lilac-600/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    <Fingerprint size={20} aria-hidden="true"/> Certify & Lock Statement
                                </button>
                            </div>
                        )}

                        {isLocked && period.practitionerSignOff && (
                            <div className="p-6 rounded-3xl border-2 border-teal-300 bg-teal-50 space-y-3 animate-in fade-in" role="status">
                                <div className="flex items-center gap-2 text-teal-900">
                                    <ShieldCheck size={20} aria-hidden="true"/>
                                    <span className="font-black uppercase tracking-widest text-xs">Verified Digital Sign-Off</span>
                                </div>
                                <div className="p-4 bg-white rounded-xl border border-teal-200 font-mono text-xs text-teal-800 break-all leading-tight shadow-inner">
                                    SIGNATURE_HASH: {period.practitionerSignOff.hash}
                                </div>
                                <div className="flex flex-col gap-1 text-xs font-black text-slate-500 uppercase tracking-tighter">
                                    <span>Locked: {new Date(period.practitionerSignOff.timestamp).toLocaleString()}</span>
                                    <span className="text-teal-700">Audit Status: VERIFIED TRACE</span>
                                </div>
                            </div>
                        )}

                        {isAdmin && period.status === PayrollStatus.OPEN && (
                            <button onClick={handleClosePeriod} className="w-full py-5 bg-lilac-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-lilac-600/30 hover:scale-105 transition-all">Close & Certify Split</button>
                        )}
                        {isAdmin && period.status === PayrollStatus.CLOSED && (
                            <button onClick={handleLockPeriod} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/30 hover:scale-105 transition-all flex items-center justify-center gap-3"><Lock size={18} aria-hidden="true"/> Verify & Archive Statement</button>
                        )}
                    </div>
                </div>
            </div>

            {disputeModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" role="dialog" aria-labelledby="dispute-title" aria-modal="true">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 border-4 border-orange-100">
                        <div className="flex items-center gap-3 text-orange-700 mb-6">
                            <Flag size={32} aria-hidden="true" />
                            <h3 id="dispute-title" className="text-2xl font-black uppercase tracking-tighter">Raise Split Dispute</h3>
                        </div>
                        <p className="text-sm text-slate-600 font-bold uppercase tracking-tight leading-relaxed mb-6">Raising a professional fee dispute for <strong>{disputeModal.itemName}</strong>. This item will be flagged for Administrative Audit.</p>
                        <textarea 
                            aria-label="Reason for dispute"
                            className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl h-32 focus:border-orange-500 outline-none font-bold text-sm mb-6 shadow-inner"
                            placeholder="Reason for dispute (e.g., 'Split tier mismatch')..."
                            value={disputeNote}
                            onChange={e => setDisputeNote(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setDisputeModal(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-xs rounded-2xl">Cancel</button>
                            <button onClick={handleDisputeSubmit} className="flex-[2] py-4 bg-orange-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-orange-600/20 hover:bg-orange-700">Raise Issue</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Financials;
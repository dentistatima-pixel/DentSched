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
  onSaveReconciliation?: (record: ReconciliationRecord) => void;
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
  onAddPayrollPeriod?: (period: Omit<PayrollPeriod, 'id'>) => void;
  onBack?: () => void;
}

const CashReconciliationTab: React.FC<any> = () => <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-100 text-slate-500 font-bold italic">Cash Reconciliation Interface Syncing...</div>;
const DebtAgingTab: React.FC<any> = () => <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-100 text-slate-500 font-bold italic">A/R Aging Analysis Interface Syncing...</div>;
const PhilHealthClaimsTab: React.FC<any> = () => <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-100 text-slate-500 font-bold italic">PhilHealth Statutory Registry Syncing...</div>;
const HMOClaimsTab: React.FC<any> = () => <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-100 text-slate-500 font-bold italic">HMO Claims Management Interface Syncing...</div>;

const Financials: React.FC<FinancialsProps> = (props) => {
  const { 
    claims, expenses, philHealthClaims = [], patients = [], appointments = [], fieldSettings, staff, currentUser, 
    onUpdatePhilHealthClaim, reconciliations = [], onSaveReconciliation, onSaveCashSession, currentBranch,
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
            onAddPayrollPeriod={onAddPayrollPeriod}
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
    <div className={`h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 ${isStatutory ? 'statutory-mode' : ''}`} role="main" aria-label="Financial Management System">
      <header className="flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
              {onBack && (
                  <button onClick={onBack} className="bg-white p-4 rounded-full shadow-sm border hover:bg-slate-100 transition-all active:scale-90" aria-label="Back to Admin Hub">
                      <ArrowLeft size={24} className="text-slate-600"/>
                  </button>
              )}
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

      <div className={`bg-white rounded-[3rem] shadow-2xl shadow-slate-900/5 border-2 flex-1 flex flex-col overflow-hidden relative transition-colors ${isStatutory ? 'border-lilac-100' : 'border-white'}`}>
        {isStatutory && (
            <div className="bg-lilac-600 text-white p-4 text-center font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3">
                <ShieldCheck size={20} /> Official Registry
            </div>
        )}
        <div className="flex border-b border-slate-100 px-8 shrink-0 bg-slate-50/50 overflow-x-auto no-scrollbar gap-2 pt-2" role="tablist" aria-label="Financial modules">
            {trackTabs.map(tab => (
                 <button 
                    key={tab.id} 
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`${tab.id}-panel`}
                    onClick={() => setActiveTab(tab.id)} 
                    className={`py-6 px-6 font-black text-xs uppercase tracking-widest border-b-4 transition-all whitespace-nowrap flex items-center gap-3 ${activeTab === tab.id ? `${isStatutory ? 'border-lilac-600 text-lilac-900' : 'border-teal-600 text-teal-900'} bg-white` : `border-transparent text-slate-500 hover:${isStatutory ? 'text-lilac-700 border-lilac-200' : 'text-teal-700 border-teal-200'} hover:bg-white/50`}`}
                >
                    <tab.icon size={18} aria-hidden="true" /> {tab.label}
                </button>
            ))}
        </div>
        
        <div className={`flex-1 overflow-y-auto p-10 no-scrollbar transition-colors ${isStatutory ? 'bg-lilac-50/20' : 'bg-slate-50/30'}`} id={`${activeTab}-panel`}>
            {renderContent()}
        </div>

        {!isStatutory && (
            <div className="absolute bottom-0 left-0 right-0 bg-lilac-700 text-white px-8 py-3 flex items-center justify-center gap-4 z-50 shadow-[0_-8px_30px_rgba(162,28,175,0.4)] animate-in slide-in-from-bottom-full duration-1000" role="complementary">
                <Shield size={16} className="animate-bounce shrink-0" aria-hidden="true"/>
                <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">
                    INTERNAL MANAGEMENT AID ONLY: THESE METRICS REPRESENT CLINICAL WORKFLOW AND OPERATIONAL ESTIMATES. THIS IS NOT AN ACCOUNTING RECORD AND DOES NOT REFLECT STATUTORY TAX DECLARATIONS. CLINICAL DECISIONS REMAIN THE SOLE RESPONSIBILITY OF THE DENTIST.
                </span>
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

const PayrollTab: React.FC<any> = ({ appointments, staff, expenses, fieldSettings, currentUser, payrollPeriods, payrollAdjustments, commissionDisputes, onUpdatePayrollPeriod, onAddAdjustment, onApproveAdjustment, onAddCommissionDispute: onAddDispute, onResolveCommissionDispute: onResolveDispute, onAddPayrollPeriod }) => {
    const toast = useToast();
    const dentists = staff.filter((s: StaffUser) => s.role === UserRole.DENTIST);
    const [selectedDentistId, setSelectedDentistId] = useState<string>(currentUser.role === UserRole.DENTIST ? currentUser.id : dentists[0]?.id || '');
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
    
    const [isCreatingPeriod, setIsCreatingPeriod] = useState(false);
    const [newPeriod, setNewPeriod] = useState({ startDate: '', endDate: '' });

    const [disputeModal, setDisputeModal] = useState<{ itemId: string, itemName: string } | null>(null);
    const [disputeNote, setDisputeNote] = useState('');
    const [adjModal, setAdjModal] = useState(false);
    const [adjForm, setAdjForm] = useState({ reason: '', amount: '' });

    const isAdmin = currentUser.role === UserRole.ADMIN;
    const currentDentist = staff.find((s: StaffUser) => s.id === selectedDentistId);
    const isEligibleForSplit = useMemo(() => currentDentist?.role === UserRole.DENTIST, [currentDentist]);
    
    const dentistPeriods = useMemo(() => payrollPeriods.filter((p: PayrollPeriod) => p.providerId === selectedDentistId), [payrollPeriods, selectedDentistId]);
    
    useEffect(() => {
        if (dentistPeriods.length > 0) {
            setSelectedPeriodId(dentistPeriods[0].id);
        } else {
            setSelectedPeriodId('');
        }
    }, [dentistPeriods]);

    const period = useMemo(() => dentistPeriods.find(p => p.id === selectedPeriodId), [dentistPeriods, selectedPeriodId]);

    const isLocked = period?.status === PayrollStatus.LOCKED;
    const isClosed = period?.status === PayrollStatus.CLOSED;

    const { grossProduction, labFees, netBase, baseCommission, finalPayout, periodAppointments } = useMemo(() => {
        if (!period) return { grossProduction: 0, labFees: 0, netBase: 0, baseCommission: 0, finalPayout: 0, periodAppointments: [] };
        
        const periodAppointments = appointments.filter((a: Appointment) => 
            a.providerId === selectedDentistId && 
            a.status === AppointmentStatus.COMPLETED &&
            a.date >= period.startDate &&
            a.date <= period.endDate
        );

        let gross = 0;
        periodAppointments.forEach((apt: Appointment) => {
            const proc = fieldSettings?.procedures.find((p: any) => p.name === apt.type);
            if (proc) {
                const priceEntry = fieldSettings?.priceBookEntries?.find((pbe: any) => pbe.procedureId === proc.id);
                gross += (priceEntry?.price || 0);
            }
        });

        const labs = expenses.filter((e: Expense) => e.staffId === selectedDentistId && e.category === 'Lab Fee' && e.date >= period.startDate && e.date <= period.endDate).reduce((s: number, e: Expense) => s + e.amount, 0);
        const net = gross - labs;
        const commissionRate = currentDentist?.commissionRate || 0.30;
        const base = isEligibleForSplit ? (net * commissionRate) : 0;
        
        const adjTotal = payrollAdjustments
            .filter((a: PayrollAdjustment) => a.periodId === period.id && a.status === 'Approved')
            .reduce((s: number, a: PayrollAdjustment) => s + a.amount, 0);

        return {
            grossProduction: gross,
            labFees: labs,
            netBase: net,
            baseCommission: base,
            finalPayout: base + adjTotal,
            periodAppointments
        };
    }, [period, appointments, selectedDentistId, fieldSettings, expenses, currentDentist, isEligibleForSplit, payrollAdjustments]);
    
    const handleCreatePeriod = () => {
        if (!newPeriod.startDate || !newPeriod.endDate) return;
        onAddPayrollPeriod({
            providerId: selectedDentistId,
            ...newPeriod,
            status: 'Open'
        });
        setIsCreatingPeriod(false);
        setNewPeriod({ startDate: '', endDate: '' });
    };

    const logAction = async (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => {};

    // ... other handlers remain the same
    
    return (
        <div className="space-y-6" role="region" aria-label="Fee Split Management">
            {isAdmin && (
                 <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <select value={selectedDentistId} onChange={e => setSelectedDentistId(e.target.value)} className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-sm font-black outline-none focus:border-teal-500">
                            {dentists.map((d: StaffUser) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <select value={selectedPeriodId} onChange={e => setSelectedPeriodId(e.target.value)} className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-sm font-black outline-none focus:border-teal-500">
                            {dentistPeriods.map((p: PayrollPeriod) => <option key={p.id} value={p.id}>{formatDate(p.startDate)} - {formatDate(p.endDate)}</option>)}
                        </select>
                        <button onClick={() => setIsCreatingPeriod(true)} className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200"><Plus size={16}/></button>
                    </div>
                 </div>
            )}
             {isCreatingPeriod && (
                <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-teal-400 flex items-end gap-4 animate-in zoom-in-95">
                    <div className="flex-1"><label className="label text-xs">Start Date</label><input type="date" value={newPeriod.startDate} onChange={e => setNewPeriod({...newPeriod, startDate: e.target.value})} className="input" /></div>
                    <div className="flex-1"><label className="label text-xs">End Date</label><input type="date" value={newPeriod.endDate} onChange={e => setNewPeriod({...newPeriod, endDate: e.target.value})} className="input" /></div>
                    <button onClick={handleCreatePeriod} className="px-6 py-3 bg-teal-600 text-white rounded-xl text-xs font-black">Create Period</button>
                    <button onClick={() => setIsCreatingPeriod(false)} className="p-3 bg-slate-100 rounded-xl"><X size={16}/></button>
                </div>
             )}

            {period ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl border-2 border-teal-100"><div className="text-xs font-black text-teal-700 uppercase">Gross Production</div><div className="text-2xl font-black mt-1">₱{grossProduction.toLocaleString()}</div></div>
                        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100"><div className="text-xs font-black text-slate-500 uppercase">Net Base</div><div className="text-2xl font-black mt-1">₱{netBase.toLocaleString()}</div></div>
                        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100"><div className="text-xs font-black text-slate-500 uppercase">Adjustments</div><div className="text-2xl font-black mt-1">₱{(finalPayout - baseCommission).toLocaleString()}</div></div>
                        <div className="bg-teal-900 text-white p-6 rounded-2xl"><div className="text-xs font-black text-teal-300 uppercase">Final Payout</div><div className="text-2xl font-black mt-1">₱{finalPayout.toLocaleString()}</div></div>
                    </div>
                    {/* Placeholder for tabs */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 min-h-[300px]">
                        <p className="text-center text-slate-400 font-bold italic p-10">Detailed production, adjustments, and disputes will be shown here.</p>
                    </div>
                </div>
            ) : (
                <div className="p-20 text-center bg-white rounded-2xl border-dashed border-2">
                    <p className="font-bold text-slate-500">No payroll period selected or created for this practitioner.</p>
                </div>
            )}
        </div>
    );
};


export default Financials;

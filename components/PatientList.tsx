import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Phone, MessageSquare, ChevronRight, X, UserPlus, AlertTriangle, Shield, Heart, Activity, Hash, Plus, Trash2, CalendarPlus, Pencil, Printer, CheckCircle, FileCheck, ChevronDown, ChevronUp, AlertCircle, Download, Pill, Cigarette, Baby, User as UserIcon, MapPin, Briefcase, Users, CreditCard, Stethoscope, Mail, Clock, FileText, Grid, LayoutGrid, List, ClipboardList, DollarSign, StickyNote, PenLine, DownloadCloud, Archive, FileImage, FileUp, FileSignature, ShieldCheck, Lock, Megaphone, BellOff, ArrowRightLeft, Sliders, Sun, Contrast, Save, HeartPulse, ExternalLink, Star, Timeline, ShieldAlert, Crown, Award, ShieldOff, Zap, Circle, LockKeyhole, History, Scale, Fingerprint, Armchair, ZapIcon, Info, Target, Share2, Edit3, Trash, Eye } from 'lucide-react';
import { Patient, Appointment, User, UserRole, DentalChartEntry, TreatmentStatus, FieldSettings, PerioMeasurement, AuditLogEntry, PatientFile, AppointmentStatus, LedgerEntry, ClinicalProtocolRule, ClearanceRequest, TreatmentPlanStatus, ConsentCategory, ConsentLogEntry, AuthorityLevel, AccessPurpose, UIMode } from '../types';
import Odontogram from './Odontogram';
import Odontonotes from './Odontonotes';
import TreatmentPlan from './TreatmentPlan';
import PerioChart from './PerioChart';
import PatientLedger from './PatientLedger';
import PhilHealthCF4Generator from './PhilHealthCF4Generator'; 
import PrivacyRevocationModal from './PrivacyRevocationModal';
import MedicoLegalExportModal from './MedicoLegalExportModal';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';

interface PatientListProps {
  patients: Patient[];
  appointments: Appointment[];
  currentUser: User;
  selectedPatientId: string | null;
  onSelectPatient: (id: string | null) => void;
  onAddPatient: () => void;
  onEditPatient: (patient: Patient) => void;
  onQuickUpdatePatient: (patient: Patient) => void;
  onBulkUpdatePatients?: (patients: Patient[]) => void;
  onDeletePatient: (patientId: string) => void;
  onBookAppointment: (patientId: string) => void;
  fieldSettings?: FieldSettings; 
  logAction: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string, previousState?: any, newState?: any, accessPurpose?: AccessPurpose) => void;
  staff?: User[];
  currentBranch: string;
  uiMode?: UIMode;
}

const PatientList: React.FC<PatientListProps> = ({ 
    patients, appointments, currentUser, selectedPatientId, onSelectPatient, onAddPatient, onEditPatient,
    onQuickUpdatePatient, onBulkUpdatePatients, onDeletePatient, onBookAppointment, fieldSettings, logAction, staff = [], currentBranch, uiMode
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<string>('info'); 
  const [revocationTarget, setRevocationTarget] = useState<{ category: ConsentCategory } | null>(null);
  const [isLegalExportOpen, setIsLegalExportOpen] = useState(false);
  
  const isAssistant = currentUser.role === UserRole.DENTAL_ASSISTANT;
  const isAdmin = currentUser.role === UserRole.ADMIN;

  const [sessionAccessPurpose, setSessionAccessPurpose] = useState<AccessPurpose | null>(null);

  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId) || null, [patients, selectedPatientId]);

  useEffect(() => {
    setSessionAccessPurpose(null);
    setActiveTab('info');
  }, [selectedPatientId]);

  const handlePurposeSelection = (purpose: AccessPurpose) => {
    setSessionAccessPurpose(purpose);
    if (selectedPatientId) {
        logAction('VIEW_RECORD', 'Patient', selectedPatientId, `Opened patient clinical folder for purpose: ${purpose}`, undefined, undefined, purpose);
    }
  };

  const getAttendancePatternUI = (score?: number) => {
      if (score === undefined) return { icon: Circle, color: 'text-slate-300', label: 'New Patient' };
      if (score >= 80) return { icon: CheckCircle, color: 'text-teal-500', label: 'Reliable Pattern' };
      if (score >= 60) return { icon: Circle, color: 'text-lilac-400', label: 'Standard Pattern' };
      return { icon: AlertTriangle, color: 'text-red-500', label: 'Irregular Pattern (No-Show Risk)' };
  };

  const highRiskConditions = useMemo(() => {
      if (!selectedPatient) return [];
      const alerts = [];
      if (selectedPatient.heartValveIssues) alerts.push("HEART VALVE ISSUE");
      if (selectedPatient.takingBloodThinners) alerts.push("BLOOD THINNERS");
      if (selectedPatient.takingBisphosphonates) alerts.push("BISPHOSPHONATES");
      if (selectedPatient.anesthesiaReaction) alerts.push("ANESTHESIA REACTION");
      if (selectedPatient.respiratoryIssues) alerts.push("RESPIRATORY ISSUES");
      return alerts;
  }, [selectedPatient]);

  const nowViewSnapshot = useMemo(() => {
      if (!selectedPatient) return null;
      const today = new Date().toLocaleDateString('en-CA');
      const todaysApt = appointments.find(a => a.patientId === selectedPatient.id && a.date === today);
      
      return {
          complaint: selectedPatient.chiefComplaint || 'None Reported',
          procedure: todaysApt?.type || 'No Scheduled Visit',
          allergies: selectedPatient.allergies?.length ? selectedPatient.allergies.join(', ') : 'No Known Allergies',
          consent: selectedPatient.dpaConsent ? 'Verified' : 'MISSING',
          chair: todaysApt?.resourceId || 'Unassigned'
      };
  }, [selectedPatient, appointments]);

  // Fix: Calculate referrals derived from the patients list for the selected patient
  // This resolves the errors: "Cannot find name 'referrals'" on line 226 and 228.
  const referrals = useMemo(() => {
    if (!selectedPatient) return [];
    return patients.filter(p => p.referredById === selectedPatient.id);
  }, [patients, selectedPatient]);

  const tabs = useMemo(() => {
    if (isAssistant) {
        return [
            { id: 'info', label: 'Identity', icon: UserIcon },
            { id: 'prep', label: 'Chair Prep', icon: Armchair },
            { id: 'imaging', label: 'Imaging', icon: FileImage },
        ];
    }
    const base = [
        { id: 'info', label: 'Identity', icon: UserIcon },
        { id: 'medical', label: 'History', icon: Heart },
        { id: 'chart', label: 'Chart', icon: LayoutGrid },
        { id: 'perio', label: 'Perio', icon: Activity },
        { id: 'plan', label: 'Plan', icon: ClipboardList },
        { id: 'ledger', label: 'Financials', icon: DollarSign },
        { id: 'imaging', label: 'Imaging', icon: FileImage },
        { id: 'documents', label: 'Docs', icon: FileText },
    ];
    
    if (uiMode === UIMode.AUDIT) {
        base.push({ id: 'forensics', label: 'Forensic Audit', icon: Fingerprint });
    }
    
    return base;
  }, [isAssistant, uiMode]);

  const clinicalTabs = ['medical', 'chart', 'imaging', 'perio', 'plan'];

  const handleRightsAction = (type: 'Correction' | 'Access' | 'Portability' | 'Erasure') => {
    if (!selectedPatient) return;
    toast.info(`PDA Rights Protocol: Initiating ${type} request...`);
    // Mock logging the request
    const newLog = { id: `req_${Date.now()}`, type, status: 'Pending' as const, timestamp: new Date().toISOString() };
    const updated = { ...selectedPatient, rightsLog: [newLog, ...(selectedPatient.rightsLog || [])] };
    onQuickUpdatePatient(updated);
    logAction('UPDATE', 'Patient', selectedPatient.id, `Patient exercised PDA Right: ${type}`);
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
      {/* LIST COLUMN */}
      <div className={`flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col ${selectedPatientId ? 'hidden md:flex' : 'flex'}`}>
           <div className="p-4 border-b border-slate-100">
               <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input type="text" placeholder="Registry search..." className="input pl-10 h-11" />
               </div>
           </div>
           <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
               {patients.map(p => {
                   const reliability = getAttendancePatternUI(p.reliabilityScore);
                   const pes = p.engagementScore || 0;
                   return (
                   <button key={p.id} onClick={() => onSelectPatient(p.id)} className={`w-full text-left p-4 rounded-xl transition-all flex justify-between items-center group ${selectedPatientId === p.id ? 'bg-teal-600 text-white shadow-lg' : 'hover:bg-teal-50'}`}>
                       <div className="flex-1 min-w-0 flex items-center gap-3">
                           <div className="relative w-10 h-10 shrink-0">
                               <svg className="w-full h-full transform -rotate-90">
                                   <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="transparent" className={selectedPatientId === p.id ? 'text-teal-800/30' : 'text-slate-100'} />
                                   <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="transparent" strokeDasharray={113} strokeDashoffset={113 - (113 * pes) / 100} className={`${selectedPatientId === p.id ? 'text-white' : pes > 80 ? 'text-teal-500' : pes > 60 ? 'text-lilac-500' : 'text-red-500'} transition-all duration-1000`} />
                               </svg>
                               <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`text-[8px] font-black ${selectedPatientId === p.id ? 'text-white' : 'text-slate-500'}`}>{pes}%</span>
                               </div>
                           </div>
                           <div className="min-w-0">
                               <div className="flex items-center gap-2">
                                   <div className="font-bold text-sm truncate">{p.name}</div>
                                   <reliability.icon size={12} className={selectedPatientId === p.id ? 'text-white' : reliability.color} />
                               </div>
                               <div className={`text-[10px] uppercase font-bold flex items-center gap-2 ${selectedPatientId === p.id ? 'text-teal-100' : 'text-slate-400'}`}>ID: {p.id}</div>
                           </div>
                       </div>
                       <ChevronRight size={16} className={selectedPatientId === p.id ? 'text-white' : 'text-slate-300 group-hover:text-teal-400'} />
                   </button>
               )})}
           </div>
      </div>

      {selectedPatient ? (
        <div className="flex-[2.5] bg-white rounded-2xl shadow-sm border border-slate-100 p-0 relative animate-in slide-in-from-right-10 duration-300 overflow-hidden flex flex-col max-h-full">
           
           {!sessionAccessPurpose && (
               <div className="absolute inset-0 z-[100] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 overflow-y-auto">
                    <div className="w-16 h-16 bg-lilac-50 text-lilac-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-lilac-200 ring-4 ring-lilac-50"><Fingerprint size={32}/></div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1">Access Identification</h2>
                    <p className="text-xs text-slate-500 font-medium mb-8 max-w-xs">Explicitly tag information access events for PDA R.A. 10173.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                        <button onClick={() => handlePurposeSelection(AccessPurpose.TREATMENT)} className="p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-teal-500 hover:bg-teal-50 transition-all flex items-center gap-4 group"><Activity size={20} className="text-slate-400 group-hover:text-teal-600"/><span className="font-black uppercase tracking-widest text-[9px] text-slate-600">Clinical Treatment</span></button>
                        {!isAssistant && <button onClick={() => handlePurposeSelection(AccessPurpose.BILLING)} className="p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-teal-500 hover:bg-teal-50 transition-all flex items-center gap-4 group"><CreditCard size={20} className="text-slate-400 group-hover:text-teal-600"/><span className="font-black uppercase tracking-widest text-[9px] text-slate-600">Financial / Billing</span></button>}
                        <button onClick={() => handlePurposeSelection(AccessPurpose.AUDIT)} className="p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-teal-500 hover:bg-teal-50 transition-all flex items-center gap-4 group"><Scale size={20} className="text-slate-400 group-hover:text-teal-600"/><span className="font-black uppercase tracking-widest text-[9px] text-slate-600">Compliance Audit</span></button>
                        <button onClick={() => handlePurposeSelection(AccessPurpose.COORDINATION)} className="p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-teal-500 hover:bg-teal-50 transition-all flex items-center gap-4 group"><Users size={20} className="text-slate-400 group-hover:text-teal-600"/><span className="font-black uppercase tracking-widest text-[9px] text-slate-600">Care Coordination</span></button>
                    </div>
               </div>
           )}

           <div className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6 border-b bg-white shrink-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="relative w-12 h-12 sm:w-16 sm:h-16 shrink-0">
                             <svg className="w-full h-full transform -rotate-90">
                                <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-100" />
                                <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="3" fill="transparent" strokeDasharray="100%" strokeDashoffset={`${100 - (selectedPatient.engagementScore || 0)}%`} className={`${(selectedPatient.engagementScore || 0) > 80 ? 'text-teal-500' : 'text-lilac-500'} transition-all duration-1000`} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] sm:text-xs font-black text-slate-800">{(selectedPatient.engagementScore || 0)}%</span>
                            </div>
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 truncate leading-tight uppercase tracking-tight">{selectedPatient.name}</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">ID: {selectedPatient.id}</span>
                            </div>
                        </div>
                    </div>
                </div>
           </div>

           <div className="bg-white px-4 sm:px-6 border-b border-slate-200 flex gap-4 sm:gap-6 shrink-0 z-0 overflow-x-auto no-scrollbar">
               {tabs.map(tab => (
                   <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`py-3 sm:py-4 font-black text-[9px] sm:text-[10px] uppercase tracking-widest border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                       <tab.icon size={14}/> {tab.label}
                   </button>
               ))}
           </div>

           <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 no-scrollbar">
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pb-20 relative">
                        <div className="space-y-4 sm:space-y-6">
                            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit">
                                <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-4"><Crown size={16} className="text-amber-500"/> Referral Ambassador Tree</h4>
                                {referrals.length > 0 ? (
                                    <div className="space-y-2 p-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        {referrals.slice(0, 5).map(r => (
                                            <div key={r.id} className="text-[11px] font-bold p-2 bg-white rounded-lg border border-slate-100 flex justify-between">
                                                <span className="truncate">{r.name}</span>
                                                <span className="text-[9px] text-teal-600">{formatDate(r.lastVisit)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : <div className="p-8 text-center flex flex-col items-center gap-2"><Users size={32} className="text-slate-200" /><p className="text-slate-400 text-[10px] italic font-bold uppercase tracking-tighter">Growth loop inactive.</p></div>}
                            </div>

                            {/* PDA PRIVACY RIGHTS HUB */}
                            <div className="bg-white p-6 rounded-3xl border-2 border-teal-100 shadow-md">
                                <h4 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-[10px] mb-4">
                                    <ShieldCheck size={16} className="text-teal-600"/> PDA Privacy Rights Hub
                                </h4>
                                <div className="grid grid-cols-4 gap-2 mb-6">
                                    <button onClick={() => handleRightsAction('Portability')} className="flex flex-col items-center gap-2 group">
                                        <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all"><Share2 size={16}/></div>
                                        <span className="text-[8px] font-black uppercase text-slate-500 text-center">Portability</span>
                                    </button>
                                    <button onClick={() => handleRightsAction('Correction')} className="flex flex-col items-center gap-2 group">
                                        <div className="w-10 h-10 rounded-full bg-lilac-50 text-lilac-600 flex items-center justify-center group-hover:bg-lilac-600 group-hover:text-white transition-all"><Edit3 size={16}/></div>
                                        <span className="text-[8px] font-black uppercase text-slate-500 text-center">Rectification</span>
                                    </button>
                                    <button onClick={() => handleRightsAction('Erasure')} className="flex flex-col items-center gap-2 group">
                                        <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all"><Trash size={16}/></div>
                                        <span className="text-[8px] font-black uppercase text-slate-500 text-center">Erasure</span>
                                    </button>
                                    <button onClick={() => handleRightsAction('Access')} className="flex flex-col items-center gap-2 group">
                                        {/* Fix: Added missing 'Eye' icon from lucide-react. Resolves error on line 257. */}
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all"><Eye size={16}/></div>
                                        <span className="text-[8px] font-black uppercase text-slate-500 text-center">Access</span>
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-24 overflow-y-auto no-scrollbar border-t pt-3">
                                    {(selectedPatient.rightsLog || []).map(r => (
                                        <div key={r.id} className="flex justify-between items-center text-[9px] font-bold p-2 bg-slate-50 rounded-lg">
                                            <span className="text-slate-600 uppercase">{r.type} Request</span>
                                            <span className="text-teal-600">{formatDate(r.timestamp)}</span>
                                        </div>
                                    ))}
                                    {(!selectedPatient.rightsLog || selectedPatient.rightsLog.length === 0) && <p className="text-[8px] text-center text-slate-400 italic">No rights requests logged.</p>}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
                                <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-[10px] uppercase tracking-widest"><FileText size={16} className="text-teal-600"/> Identity Registry</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px]"><span className="text-slate-500">Demographics:</span><span className="font-bold text-slate-700">{selectedPatient.age || '-'}Y / {selectedPatient.sex || '-'}</span></div>
                                    <div className="flex justify-between text-[11px]"><span className="text-slate-500">Secure Line:</span><span className="font-bold text-teal-600">{selectedPatient.phone}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'chart' && !isAssistant && <div className="pb-20"><Odontogram chart={selectedPatient.dentalChart || []} onToothClick={() => {}} /></div>}
                {activeTab === 'perio' && !isAssistant && <div className="h-[500px] sm:h-[600px] pb-20"><PerioChart data={selectedPatient.perioChart || []} onSave={(newData) => onQuickUpdatePatient({...selectedPatient, perioChart: newData})} /></div>}
                {activeTab === 'plan' && !isAssistant && <div className="pb-20"><TreatmentPlan patient={selectedPatient} onUpdatePatient={onQuickUpdatePatient} currentUser={currentUser} logAction={logAction} featureFlags={fieldSettings?.features} /></div>}
                {activeTab === 'ledger' && !isAssistant && <div className="pb-20"><PatientLedger patient={selectedPatient} onUpdatePatient={onQuickUpdatePatient} fieldSettings={fieldSettings} /></div>}
           </div>
        </div>
      ) : <div className="hidden md:flex flex-[2.5] items-center justify-center text-slate-400 italic font-black uppercase tracking-widest text-xs">Registry Terminal Idle</div>}
    </div>
  );
};

export default PatientList;
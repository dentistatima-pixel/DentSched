import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Phone, MessageSquare, ChevronRight, X, UserPlus, AlertTriangle, Shield, Heart, Activity, Hash, Plus, Trash2, CalendarPlus, Pencil, Printer, CheckCircle, FileCheck, ChevronDown, ChevronUp, AlertCircle, Download, Pill, Cigarette, Baby, User as UserIcon, MapPin, Briefcase, Users, CreditCard, Stethoscope, Mail, Clock, FileText, Grid, LayoutGrid, List, ClipboardList, DollarSign, StickyNote, PenLine, DownloadCloud, Archive, FileImage, FileUp, FileSignature, ShieldCheck, Lock, Megaphone, BellOff, ArrowRightLeft, Sliders, Sun, Contrast, Save, HeartPulse, ExternalLink, Star, Timeline, ShieldAlert, Crown, Award, ShieldOff, Zap, Circle, LockKeyhole, History, Scale, Fingerprint, Armchair, ZapIcon, Info, Target } from 'lucide-react';
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

  const getConsentStatus = (patient: Patient, category: ConsentCategory) => {
      const logs = patient.consentLogs?.filter(l => l.category === category) || [];
      if (logs.length === 0) return { status: 'None', version: 'N/A' };
      const latest = [...logs].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      return { status: latest.status, version: latest.version };
  };

  const isClinicalProcessingAllowed = useMemo(() => {
      if (!selectedPatient) return true;
      const { status } = getConsentStatus(selectedPatient, 'Clinical');
      if (status === 'None') return selectedPatient.dpaConsent ?? false;
      return status === 'Granted';
  }, [selectedPatient]);

  const referrals = useMemo(() => {
      if (!selectedPatient) return [];
      return patients.filter(p => p.referredById === selectedPatient.id);
  }, [patients, selectedPatient]);

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

  // Clinical "Now View" Snapshot Data
  const nowViewSnapshot = useMemo(() => {
      if (!selectedPatient) return null;
      const today = new Date().toLocaleDateString('en-CA');
      const todaysApt = appointments.find(a => a.patientId === selectedPatient.id && a.date === today);
      const latestSoap = [...(selectedPatient.dentalChart || [])].sort((a,b) => new Date(b.date||'').getTime() - new Date(a.date||'').getTime())[0];
      
      return {
          complaint: selectedPatient.chiefComplaint || 'None Reported',
          procedure: todaysApt?.type || 'No Scheduled Visit',
          allergies: selectedPatient.allergies?.length ? selectedPatient.allergies.join(', ') : 'No Known Allergies',
          consent: selectedPatient.dpaConsent ? 'Verified' : 'MISSING',
          chair: todaysApt?.resourceId || 'Unassigned'
      };
  }, [selectedPatient, appointments]);

  const handleRevokeConsent = (reason: string, notes: string) => {
      if (!selectedPatient || !revocationTarget) return;
      
      const newLog: ConsentLogEntry = {
          id: `cl_${Date.now()}`,
          category: revocationTarget.category,
          status: 'Revoked',
          version: fieldSettings?.currentPrivacyVersion || 'v1.0',
          timestamp: new Date().toISOString(),
          reason,
          staffId: currentUser.id,
          staffName: currentUser.name
      };

      const updatedPatient = {
          ...selectedPatient,
          consentLogs: [...(selectedPatient.consentLogs || []), newLog]
      };

      onQuickUpdatePatient(updatedPatient);
      logAction('UPDATE', 'Patient', selectedPatient.id, `Revoked ${revocationTarget.category} consent. Reason: ${reason}. Notes: ${notes}`, undefined, undefined, sessionAccessPurpose || undefined);
      setRevocationTarget(null);
      toast.warning(`${revocationTarget.category} consent successfully withdrawn.`);
      
      if (revocationTarget.category === 'Clinical') {
          setActiveTab('info');
      }
  };

  const ReferralNode: React.FC<{ patient: Patient; allPatients: Patient[]; level?: number }> = ({ patient, allPatients, level = 0 }) => {
      const children = allPatients.filter(p => p.referredById === patient.id);
      return (
          <div className="ml-4">
              <div className={`flex items-center gap-2 p-2 rounded-xl border mb-2 transition-all ${level === 0 ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-100 hover:border-teal-300 shadow-sm'}`}>
                  {level === 0 ? <Crown size={16} className="text-amber-500 fill-amber-100" /> : <div className="w-4 border-b-2 border-teal-100" />}
                  <div className="flex-1">
                      <span className="font-bold text-slate-800 text-sm">{patient.name}</span>
                      {children.length > 0 && <span className="ml-2 text-[10px] font-black text-teal-600 uppercase tracking-tighter">Ambassador ({children.length})</span>}
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{formatDate(patient.lastVisit)}</span>
              </div>
              {children.map(child => (
                  <ReferralNode key={child.id} patient={child} allPatients={allPatients} level={level + 1} />
              ))}
          </div>
      );
  };

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

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
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
                   const isMinorPt = p.age !== undefined && p.age < 18;
                   const pes = p.engagementScore || 0;
                   return (
                   <button key={p.id} onClick={() => onSelectPatient(p.id)} className={`w-full text-left p-4 rounded-xl transition-all flex justify-between items-center group ${selectedPatientId === p.id ? 'bg-teal-600 text-white shadow-lg' : 'hover:bg-teal-50'}`}>
                       <div className="flex-1 min-w-0 flex items-center gap-3">
                           {/* --- PES ENGAGEMENT RING --- */}
                           <div className="relative w-10 h-10 shrink-0">
                               <svg className="w-full h-full transform -rotate-90">
                                   <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="transparent" className={selectedPatientId === p.id ? 'text-teal-800/30' : 'text-slate-100'} />
                                   <circle 
                                        cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="transparent" 
                                        strokeDasharray={113} strokeDashoffset={113 - (113 * pes) / 100} 
                                        className={`${selectedPatientId === p.id ? 'text-white' : pes > 80 ? 'text-teal-500' : pes > 60 ? 'text-lilac-500' : 'text-red-500'} transition-all duration-1000`} 
                                    />
                               </svg>
                               <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`text-[8px] font-black ${selectedPatientId === p.id ? 'text-white' : 'text-slate-500'}`}>{pes}%</span>
                               </div>
                           </div>
                           <div className="min-w-0">
                               <div className="flex items-center gap-2">
                                   <div className="font-bold text-sm truncate">{p.name}</div>
                                   <reliability.icon size={12} className={selectedPatientId === p.id ? 'text-white' : reliability.color} title={reliability.label} />
                               </div>
                               <div className={`text-[10px] uppercase font-bold flex items-center gap-2 ${selectedPatientId === p.id ? 'text-teal-100' : 'text-slate-400'}`}>
                                   ID: {p.id}
                                   {p.currentBalance !== undefined && p.currentBalance > 0 && (
                                       <span className="bg-red-500 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5"><DollarSign size={8}/> DUE</span>
                                   )}
                                   {isMinorPt && <span className="bg-lilac-500 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5"><Baby size={8}/> MINOR</span>}
                               </div>
                           </div>
                       </div>
                       <ChevronRight size={16} className={selectedPatientId === p.id ? 'text-white' : 'text-slate-300 group-hover:text-teal-400'} />
                   </button>
               )})}
           </div>
      </div>

      {selectedPatient ? (
        <div className="flex-[2.5] bg-white rounded-2xl shadow-sm border border-slate-100 p-0 relative animate-in slide-in-from-right-10 duration-300 overflow-hidden flex flex-col">
           
           {/* PURPOSE PORTAL OVERLAY */}
           {!sessionAccessPurpose && (
               <div className="absolute inset-0 z-[100] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                    <div className="w-20 h-20 bg-lilac-50 text-lilac-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-lilac-200 ring-8 ring-lilac-50">
                        <Fingerprint size={40}/>
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-2">Identify Access Purpose</h2>
                    <p className="text-sm text-slate-500 font-medium mb-10 max-sm w-sm">R.A. 10173 requires explicit tagging of all sensitive information access events.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
                        <button onClick={() => handlePurposeSelection(AccessPurpose.TREATMENT)} className="p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-teal-500 hover:bg-teal-50 transition-all flex flex-col items-center gap-3 group">
                            <Activity size={24} className="text-slate-400 group-hover:text-teal-600"/>
                            <span className="font-black uppercase tracking-widest text-[10px] text-slate-600 group-hover:text-teal-900">Clinical Treatment</span>
                        </button>
                        {!isAssistant && (
                            <button onClick={() => handlePurposeSelection(AccessPurpose.BILLING)} className="p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-teal-500 hover:bg-teal-50 transition-all flex flex-col items-center gap-3 group">
                                <CreditCard size={24} className="text-slate-400 group-hover:text-teal-600"/>
                                <span className="font-black uppercase tracking-widest text-[10px] text-slate-600 group-hover:text-teal-900">Financial / Billing</span>
                            </button>
                        )}
                        <button onClick={() => handlePurposeSelection(AccessPurpose.AUDIT)} className="p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-teal-500 hover:bg-teal-50 transition-all flex flex-col items-center gap-3 group">
                            <Scale size={24} className="text-slate-400 group-hover:text-teal-600"/>
                            <span className="font-black uppercase tracking-widest text-[10px] text-slate-600 group-hover:text-teal-900">Compliance Audit</span>
                        </button>
                        <button onClick={() => handlePurposeSelection(AccessPurpose.COORDINATION)} className="p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-teal-500 hover:bg-teal-50 transition-all flex flex-col items-center gap-3 group">
                            <Users size={24} className="text-slate-400 group-hover:text-teal-600"/>
                            <span className="font-black uppercase tracking-widest text-[10px] text-slate-600 group-hover:text-teal-900">Care Coordination</span>
                        </button>
                    </div>
               </div>
           )}

           {/* HIGH RISK ALERT BANNER */}
           {highRiskConditions.length > 0 && (
               <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between animate-pulse shrink-0 z-50 shadow-xl">
                   <div className="flex items-center gap-4">
                       <ShieldAlert size={28} className="animate-bounce" />
                       <div>
                           <h3 className="font-black text-sm uppercase tracking-widest leading-none">High-Risk Clinical Alert</h3>
                           <p className="text-[10px] font-bold mt-1 opacity-90">{highRiskConditions.join(" • ")}</p>
                       </div>
                   </div>
                   <div className="text-[10px] font-black border-2 border-white px-2 py-1 rounded uppercase tracking-tighter">Verified Risk</div>
               </div>
           )}

           <div className="pt-6 px-6 pb-6 border-b bg-white">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        {/* --- ENLARGED PROFILE PES RING --- */}
                        <div className="relative w-16 h-16 group cursor-help">
                             <svg className="w-full h-full transform -rotate-90">
                                <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={188} strokeDashoffset={188 - (188 * (selectedPatient.engagementScore || 0)) / 100} className={`${(selectedPatient.engagementScore || 0) > 80 ? 'text-teal-500' : 'text-lilac-500'} transition-all duration-1000`} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-black text-slate-800">{(selectedPatient.engagementScore || 0)}%</span>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-slate-800 text-white p-3 rounded-xl text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[110] shadow-2xl">
                                <div className="font-black uppercase tracking-widest border-b border-white/10 pb-1 mb-1 flex items-center gap-2">
                                    <Target size={12}/> Patient Engagement Score
                                </div>
                                <div className="space-y-1 normal-case opacity-80">
                                    • Punctuality: {selectedPatient.reliabilityScore}%<br/>
                                    • Plan Acceptance: {Math.round((selectedPatient.treatmentPlans?.filter(tp => tp.status === TreatmentPlanStatus.APPROVED).length || 0) / (selectedPatient.treatmentPlans?.length || 1) * 100)}%<br/>
                                    • Payment Speed: {(selectedPatient.currentBalance || 0) > 10000 ? 'Low' : 'Verified'}
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-bold text-slate-900">{selectedPatient.name}</h2>
                                {selectedPatient.reliabilityScore !== undefined && (
                                    <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 border ${selectedPatient.reliabilityScore >= 80 ? 'bg-teal-50 border-teal-200 text-teal-700' : selectedPatient.reliabilityScore < 60 ? 'bg-red-50 border-red-200 text-red-700 animate-pulse' : 'bg-lilac-50 border-lilac-200 text-lilac-700'}`}>
                                        <Activity size={10}/> Attendance Pattern: {selectedPatient.reliabilityScore}%
                                    </div>
                                )}
                            </div>
                            <div className="text-sm font-bold text-slate-400 uppercase mt-1">ID: {selectedPatient.id}</div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {referrals.length > 0 && <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-3 py-1 rounded-full border border-teal-200 flex items-center gap-1 shadow-sm"><Star size={12} fill="currentColor"/> {referrals.length} REFERRALS</span>}
                        {isAdmin && (
                            <button 
                                onClick={() => setIsLegalExportOpen(true)}
                                className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-900/20 hover:scale-105 transition-all"
                            >
                                <Shield size={14} className="text-teal-400"/> Medico-Legal Export
                            </button>
                        )}
                    </div>
                </div>
           </div>

           {/* --- CLINICAL NOW VIEWSnapshot CARD --- */}
           {nowViewSnapshot && (
               <div className="mx-6 mt-4 p-4 bg-white border-2 border-lilac-100 rounded-[2rem] shadow-lg flex flex-wrap gap-6 items-center animate-in slide-in-from-top-4 duration-500 z-10 shrink-0">
                   <div className="bg-lilac-50 p-3 rounded-2xl text-lilac-600">
                        <ZapIcon size={24} className="animate-pulse" />
                   </div>
                   <div className="flex-1 min-w-[150px]">
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Today's Complaint</div>
                       <div className="text-sm font-black text-lilac-700 uppercase truncate">{nowViewSnapshot.complaint}</div>
                   </div>
                   <div className="flex-1 min-w-[150px]">
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Planned Procedure</div>
                       <div className="text-sm font-black text-slate-800 uppercase truncate">{nowViewSnapshot.procedure}</div>
                   </div>
                   <div className="flex-1 min-w-[150px]">
                       <div className="text-[9px] font-black text-red-400 uppercase tracking-widest">Allergies</div>
                       <div className="text-sm font-black text-red-600 uppercase truncate">{nowViewSnapshot.allergies}</div>
                   </div>
                   <div className="flex-1 min-w-[100px]">
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Consent</div>
                       <div className={`text-sm font-black uppercase ${nowViewSnapshot.consent === 'Verified' ? 'text-teal-600' : 'text-red-600'}`}>{nowViewSnapshot.consent}</div>
                   </div>
                   <div className="flex-1 min-w-[100px]">
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Chair</div>
                       <div className="text-sm font-black text-slate-800 uppercase">{nowViewSnapshot.chair}</div>
                   </div>
               </div>
           )}

           <div className="bg-white px-6 border-b border-slate-200 flex gap-6 shrink-0 z-0 overflow-x-auto no-scrollbar mt-4">
               {tabs.map(tab => {
                   const isBlocked = clinicalTabs.includes(tab.id) && !isClinicalProcessingAllowed;
                   return (
                   <button 
                    key={tab.id} 
                    onClick={() => !isBlocked && setActiveTab(tab.id as any)} 
                    className={`
                        py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap flex items-center gap-2
                        ${activeTab === tab.id ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-400 hover:text-slate-600'}
                        ${isBlocked ? 'opacity-30 cursor-not-allowed' : ''}
                    `}
                   >
                       <tab.icon size={16}/>
                       {tab.label}
                       {isBlocked && <LockKeyhole size={12}/>}
                   </button>
               )})}
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20 relative">
                        {/* LEFT COLUMN: REFERRALS & DEPENDENTS */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2"><Crown size={18} className="text-amber-500"/> Patient Referral Tree</h4>
                                </div>
                                {referrals.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                            <div className="space-y-2">
                                                {referrals.slice(0, 5).map(r => (
                                                    <ReferralNode key={r.id} patient={r} allPatients={patients} level={0} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-10 text-center flex flex-col items-center gap-3">
                                        <Users size={48} className="text-slate-200" />
                                        <p className="text-slate-400 text-sm italic">No referrals tracked.</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-6 rounded-3xl border-2 border-lilac-100 shadow-sm flex flex-col h-fit relative overflow-hidden">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-black text-teal-900 flex items-center gap-2 uppercase tracking-widest text-xs">
                                        <Scale size={18} className="text-lilac-600"/> Legal Guardianship
                                    </h4>
                                </div>

                                {selectedPatient.guardianProfile ? (
                                    <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100">
                                        <div className="text-xs font-black uppercase text-teal-900">{selectedPatient.guardianProfile.legalName}</div>
                                        <div className="text-[10px] text-teal-600 font-bold uppercase">{selectedPatient.guardianProfile.relationship}</div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                        <p className="text-slate-400 text-[10px] font-bold uppercase italic">No legal nexus identified.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: PRIVACY & REGISTRY */}
                        <div className="space-y-6">
                            {!isAssistant && (
                                <div className="bg-white p-6 rounded-3xl border-2 border-lilac-100 shadow-sm flex flex-col h-fit relative overflow-hidden">
                                    <h4 className="font-black text-teal-900 flex items-center gap-2 uppercase tracking-widest text-xs mb-6">
                                        <ShieldCheck size={18} className="text-lilac-600"/> Privacy Control Center
                                    </h4>
                                    <div className="space-y-4">
                                        {(['Clinical', 'Marketing', 'ThirdParty'] as ConsentCategory[]).map(cat => {
                                            const { status } = getConsentStatus(selectedPatient, cat);
                                            const isRevoked = status === 'Revoked';
                                            return (
                                                <div key={cat} className={`p-4 rounded-2xl border transition-all ${isRevoked ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-black uppercase text-slate-600">{cat}</span>
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isRevoked ? 'bg-red-600 text-white' : 'bg-teal-600 text-white'}`}>
                                                            {status === 'None' ? 'UNSET' : status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={18} className="text-teal-600"/> Registry Summary</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Age / Sex:</span>
                                        <span className="font-bold text-slate-700">{selectedPatient.age || '-'} / {selectedPatient.sex || '-'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Contact:</span>
                                        <span className="font-bold text-teal-600">{selectedPatient.phone}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RECORD SOVEREIGNTY DISCLAIMER */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center">
                            <div className="bg-lilac-50/50 border border-lilac-100 rounded-xl px-6 py-3 flex items-center gap-3">
                                <Lock size={12} className="text-lilac-400"/>
                                <p className="text-[10px] font-bold text-lilac-600 uppercase tracking-widest">
                                    Clinic-Specific Record Silo. Access governed by explicit identifier consent.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'prep' && isAssistant && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-teal-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-teal-600/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-20"><Armchair size={120}/></div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Clinical Environment Prep</h3>
                            <p className="text-teal-100 font-medium">Verify resources and tray setups for the next session.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={16}/> Scheduled Procedure</h4>
                                <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl">
                                    <div className="text-xl font-black text-teal-900 uppercase">Consultation & Exam</div>
                                    <div className="text-xs text-teal-600 font-bold mt-1">Est. Duration: 30 Minutes</div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><MapPin size={16}/> Target Resource</h4>
                                <div className="p-4 bg-lilac-50 border border-lilac-100 rounded-2xl">
                                    <div className="text-xl font-black text-lilac-900 uppercase">Dental Chair 1</div>
                                    <div className="text-xs text-lilac-600 font-bold mt-1">Branch: {currentBranch}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'chart' && !isAssistant && (
                    <div className="space-y-6">
                        <Odontogram chart={selectedPatient.dentalChart || []} onToothClick={() => {}} readOnly={!isClinicalProcessingAllowed} />
                    </div>
                )}

                {activeTab === 'perio' && !isAssistant && (
                    <div className="h-[600px]">
                        <PerioChart data={selectedPatient.perioChart || []} onSave={(newData) => onQuickUpdatePatient({...selectedPatient, perioChart: newData})} readOnly={!isClinicalProcessingAllowed} />
                    </div>
                )}

                {activeTab === 'plan' && !isAssistant && (
                    <TreatmentPlan patient={selectedPatient} onUpdatePatient={onQuickUpdatePatient} currentUser={currentUser} logAction={logAction} featureFlags={fieldSettings?.features} />
                )}

                {activeTab === 'ledger' && !isAssistant && (
                    <PatientLedger patient={selectedPatient} onUpdatePatient={onQuickUpdatePatient} fieldSettings={fieldSettings} />
                )}
           </div>
        </div>
      ) : <div className="hidden md:flex flex-[2.5] items-center justify-center text-slate-400 italic">Select Patient Registry Record</div>}

      {revocationTarget && selectedPatient && (
          <PrivacyRevocationModal 
            isOpen={!!revocationTarget} 
            onClose={() => setRevocationTarget(null)} 
            onConfirm={handleRevokeConsent} 
            patient={selectedPatient} 
            category={revocationTarget.category} 
          />
      )}
    </div>
  );
};

export default PatientList;
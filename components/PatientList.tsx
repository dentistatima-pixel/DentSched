import React, { useState, useMemo, useEffect, useRef } from 'react';
/* Added Award and Circle to lucide-react imports */
import { Search, Phone, MessageSquare, ChevronRight, X, UserPlus, AlertTriangle, Shield, Heart, Activity, Hash, Plus, Trash2, CalendarPlus, Pencil, Printer, CheckCircle, FileCheck, ChevronDown, ChevronUp, AlertCircle, Download, Pill, Cigarette, Baby, User as UserIcon, MapPin, Briefcase, Users, CreditCard, Stethoscope, Mail, Clock, FileText, Grid, List, ClipboardList, DollarSign, StickyNote, PenLine, DownloadCloud, Archive, FileImage, FileUp, FileSignature, ShieldCheck, Lock, Megaphone, BellOff, ArrowRightLeft, Sliders, Sun, Contrast, Save, HeartPulse, ExternalLink, Star, Timeline, ShieldAlert, Crown, Award, ShieldOff, Zap, Circle, LockKeyhole, History, Scale } from 'lucide-react';
import { Patient, Appointment, User, UserRole, DentalChartEntry, TreatmentStatus, FieldSettings, PerioMeasurement, AuditLogEntry, PatientFile, AppointmentStatus, LedgerEntry, ClinicalProtocolRule, ClearanceRequest, TreatmentPlanStatus, ConsentCategory, ConsentLogEntry, AuthorityLevel } from '../types';
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
  logAction: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
  staff?: User[];
}

const PatientList: React.FC<PatientListProps> = ({ 
    patients, appointments, currentUser, selectedPatientId, onSelectPatient, onAddPatient, onEditPatient,
    onQuickUpdatePatient, onBulkUpdatePatients, onDeletePatient, onBookAppointment, fieldSettings, logAction, staff = []
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'info' | 'medical' | 'chart' | 'perio' | 'plan' | 'ledger' | 'documents' | 'imaging'>('info'); 
  const [planViewMode, setPlanViewMode] = useState<'list' | 'timeline'>('list');
  const [revocationTarget, setRevocationTarget] = useState<{ category: ConsentCategory } | null>(null);
  const [isLegalExportOpen, setIsLegalExportOpen] = useState(false);

  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId) || null, [patients, selectedPatientId]);

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

  const isFinancialAccessRestricted = currentUser.role === UserRole.DENTAL_ASSISTANT;

  const isMinor = useMemo(() => selectedPatient && selectedPatient.age !== undefined && selectedPatient.age < 18, [selectedPatient]);
  const isSeniorDependent = useMemo(() => selectedPatient && selectedPatient.isSeniorDependent, [selectedPatient]);
  const isDependent = isMinor || isSeniorDependent || (selectedPatient && selectedPatient.isPwd);

  const dependents = useMemo(() => {
    if (!selectedPatient) return [];
    return patients.filter(p => p.guardianProfile?.linkedPatientId === selectedPatient.id);
  }, [patients, selectedPatient]);

  // AUTOMATED ACCOUNTABILITY TRIGGER: Log every folder view
  useEffect(() => {
    if (selectedPatientId) {
        logAction('VIEW_RECORD', 'Patient', selectedPatientId, `Opened patient clinical folder for review.`);
    }
  }, [selectedPatientId]);

  // Reliability Logic
  const getReliabilityUI = (score?: number) => {
      if (score === undefined) return { icon: Circle, color: 'text-slate-300', label: 'New Patient' };
      if (score >= 80) return { icon: CheckCircle, color: 'text-teal-500', label: 'High Reliability' };
      if (score >= 60) return { icon: Circle, color: 'text-lilac-400', label: 'Standard' };
      return { icon: AlertTriangle, color: 'text-red-500', label: 'High Risk (No-Show)' };
  };

  // High-Risk Alert Filter
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
      logAction('UPDATE', 'Patient', selectedPatient.id, `Revoked ${revocationTarget.category} consent. Reason: ${reason}. Notes: ${notes}`);
      setRevocationTarget(null);
      toast.warning(`${revocationTarget.category} consent successfully withdrawn.`);
      
      if (revocationTarget.category === 'Clinical') {
          setActiveTab('info');
      }
  };

  const handleGrantConsent = (category: ConsentCategory) => {
      if (!selectedPatient) return;
      
      const newLog: ConsentLogEntry = {
          id: `cl_${Date.now()}`,
          category,
          status: 'Granted',
          version: fieldSettings?.currentPrivacyVersion || 'v1.0',
          timestamp: new Date().toISOString(),
          staffId: currentUser.id,
          staffName: currentUser.name
      };

      const updatedPatient = {
          ...selectedPatient,
          consentLogs: [...(selectedPatient.consentLogs || []), newLog]
      };

      onQuickUpdatePatient(updatedPatient);
      logAction('UPDATE', 'Patient', selectedPatient.id, `Re-granted ${category} consent (v${fieldSettings?.currentPrivacyVersion}).`);
      toast.success(`${category} consent successfully updated.`);
  };

  // Referral Tree Recursive Component
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
                   const reliability = getReliabilityUI(p.reliabilityScore);
                   const isMinorPt = p.age !== undefined && p.age < 18;
                   return (
                   <button key={p.id} onClick={() => onSelectPatient(p.id)} className={`w-full text-left p-4 rounded-xl transition-all flex justify-between items-center group ${selectedPatientId === p.id ? 'bg-teal-600 text-white shadow-lg' : 'hover:bg-teal-50'}`}>
                       <div className="flex-1 min-w-0">
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
                       <ChevronRight size={16} className={selectedPatientId === p.id ? 'text-white' : 'text-slate-300 group-hover:text-teal-400'} />
                   </button>
               )})}
           </div>
      </div>

      {selectedPatient ? (
        <div className="flex-[2.5] bg-white rounded-2xl shadow-sm border border-slate-100 p-0 relative animate-in slide-in-from-right-10 duration-300 overflow-hidden flex flex-col">
           
           {/* HIGH RISK ALERT BANNER */}
           {highRiskConditions.length > 0 && (
               <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between animate-pulse shrink-0 z-50 shadow-xl">
                   <div className="flex items-center gap-4">
                       <ShieldAlert size={28} className="animate-bounce" />
                       <div>
                           {/* Fix: Added missing opening bracket for h3 tag */}
                           <h3 className="font-black text-sm uppercase tracking-widest leading-none">High-Risk Clinical Alert</h3>
                           <p className="text-[10px] font-bold mt-1 opacity-90">{highRiskConditions.join(" • ")}</p>
                       </div>
                   </div>
                   <div className="text-[10px] font-black border-2 border-white px-2 py-1 rounded uppercase tracking-tighter">Verified Risk</div>
               </div>
           )}

           <div className="pt-6 px-6 pb-6 border-b bg-white">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-bold text-slate-900">{selectedPatient.name}</h2>
                            {selectedPatient.reliabilityScore !== undefined && (
                                <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 border ${selectedPatient.reliabilityScore >= 80 ? 'bg-teal-50 border-teal-200 text-teal-700' : selectedPatient.reliabilityScore < 60 ? 'bg-red-50 border-red-200 text-red-700 animate-pulse' : 'bg-lilac-50 border-lilac-200 text-lilac-700'}`}>
                                    <Activity size={10}/> Reliability: {selectedPatient.reliabilityScore}%
                                </div>
                            )}
                            {isDependent && (
                                <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 border ${isMinor ? 'bg-lilac-50 border-lilac-200 text-lilac-700' : 'bg-teal-50 border-teal-200 text-teal-700'}`}>
                                    <Baby size={10}/> {isMinor ? 'MINOR' : isSeniorDependent ? 'SENIOR' : 'PWD'} DEPENDENT
                                </div>
                            )}
                        </div>
                        <div className="text-sm font-bold text-slate-400 uppercase mt-1">ID: {selectedPatient.id}</div>
                    </div>
                    <div className="flex gap-2">
                        {referrals.length > 0 && <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-3 py-1 rounded-full border border-teal-200 flex items-center gap-1 shadow-sm"><Star size={12} fill="currentColor"/> {referrals.length} REFERRALS</span>}
                        {currentUser.role !== UserRole.DENTAL_ASSISTANT && (
                            <button 
                                onClick={() => setIsLegalExportOpen(true)}
                                className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-900/20 hover:scale-105 transition-all"
                            >
                                <Shield size={14} className="text-teal-400"/> Medico-Legal Export
                            </button>
                        )}
                        {fieldSettings?.features.enablePhilHealthClaims && !isFinancialAccessRestricted && (
                            <PhilHealthCF4Generator patient={selectedPatient} currentUser={currentUser} odontogram={selectedPatient.dentalChart || []} />
                        )}
                    </div>
                </div>
           </div>

           <div className="bg-white px-6 border-b border-slate-200 flex gap-6 shrink-0 z-0 overflow-x-auto no-scrollbar">
               {['info', 'medical', 'chart', 'imaging', 'perio', 'plan', 'ledger', 'documents'].map(t => {
                   const isBlocked = clinicalTabs.includes(t) && !isClinicalProcessingAllowed;
                   return (
                   <button 
                    key={t} 
                    onClick={() => !isBlocked && setActiveTab(t as any)} 
                    className={`
                        py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap flex items-center gap-2
                        ${activeTab === t ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-400 hover:text-slate-600'}
                        ${isBlocked ? 'opacity-30 cursor-not-allowed' : ''}
                    `}
                   >
                       {t}
                       {isBlocked && <LockKeyhole size={12}/>}
                   </button>
               )})}
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* LEFT COLUMN: REFERRALS & DEPENDENTS */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2"><Crown size={18} className="text-amber-500"/> Patient Referral Tree</h4>
                                    <span className="text-[10px] font-black bg-teal-50 text-teal-700 px-2 py-1 rounded uppercase">Practice Ambassador</span>
                                </div>
                                {referrals.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                            <div className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-4">Downline Patients</div>
                                            <div className="space-y-2">
                                                {referrals.map(r => (
                                                    <ReferralNode key={r.id} patient={r} allPatients={patients} level={0} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                                            <Award size={20} className="text-amber-600 shrink-0" />
                                            <p className="text-xs text-amber-800 font-medium">This patient has brought <strong>{referrals.length}</strong> new cases to your practice. Consider issuing a loyalty gift certificate.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-10 text-center flex flex-col items-center gap-3">
                                        <Users size={48} className="text-slate-200" />
                                        <p className="text-slate-400 text-sm italic">No referrals tracked for this patient record.</p>
                                    </div>
                                )}
                            </div>

                            {/* Legal Guardianship & Dependents Card */}
                            <div className="bg-white p-6 rounded-3xl border-2 border-lilac-100 shadow-sm flex flex-col h-fit relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12"><Shield size={80}/></div>
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-black text-teal-900 flex items-center gap-2 uppercase tracking-widest text-xs">
                                        <Scale size={18} className="text-lilac-600"/> Legal Guardianship
                                    </h4>
                                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase">PDA AUTHORITY</span>
                                </div>

                                {selectedPatient.guardianProfile ? (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="text-xs font-black uppercase text-teal-900">{selectedPatient.guardianProfile.legalName}</div>
                                                    <div className="text-[10px] text-teal-600 font-bold uppercase">{selectedPatient.guardianProfile.relationship} (Authorized)</div>
                                                </div>
                                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${selectedPatient.guardianProfile.authorityLevel === AuthorityLevel.FULL ? 'bg-teal-600 text-white' : 'bg-lilac-50 text-white'}`}>
                                                    {selectedPatient.guardianProfile.authorityLevel.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600"><Phone size={10}/> {selectedPatient.guardianProfile.mobile}</div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600"><Mail size={10}/> {selectedPatient.guardianProfile.email}</div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest bg-white/50 p-2 rounded-lg">Verified ID: {selectedPatient.guardianProfile.idType} ({selectedPatient.guardianProfile.idNumber})</div>
                                            </div>
                                            {selectedPatient.guardianProfile.linkedPatientId && (
                                                <button onClick={() => onSelectPatient(selectedPatient.guardianProfile!.linkedPatientId!)} className="w-full mt-3 py-2 bg-white text-teal-700 rounded-xl text-[10px] font-black uppercase tracking-tighter border border-teal-200 hover:bg-teal-100 transition-colors flex items-center justify-center gap-2">
                                                    <UserIcon size={12}/> View Guardian Patient File
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {dependents.length > 0 ? (
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Authorized Dependents ({dependents.length})</div>
                                                <div className="space-y-2">
                                                    {dependents.map(dep => (
                                                        <button key={dep.id} onClick={() => onSelectPatient(dep.id)} className="w-full p-2 bg-white rounded-xl border border-slate-100 hover:border-teal-400 flex items-center justify-between transition-all group">
                                                            <div className="flex items-center gap-2">
                                                                <Baby size={12} className="text-lilac-500"/>
                                                                <span className="text-xs font-bold text-slate-700">{dep.name}</span>
                                                            </div>
                                                            <ChevronRight size={14} className="text-slate-300 group-hover:text-teal-500"/>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                                <p className="text-slate-400 text-[10px] font-bold uppercase italic">No legal nexus identified.</p>
                                                <button onClick={() => onEditPatient(selectedPatient)} className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">Establish Authority</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: PRIVACY & REGISTRY */}
                        <div className="space-y-6">
                            {/* Privacy Control Center Card */}
                            <div className="bg-white p-6 rounded-3xl border-2 border-lilac-100 shadow-sm flex flex-col h-fit relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12"><Shield size={80}/></div>
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-black text-teal-900 flex items-center gap-2 uppercase tracking-widest text-xs">
                                        <ShieldCheck size={18} className="text-lilac-600"/> Privacy Control Center
                                    </h4>
                                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase">PDA v{fieldSettings?.currentPrivacyVersion}</span>
                                </div>

                                <div className="space-y-4">
                                    {(['Clinical', 'Marketing', 'ThirdParty'] as ConsentCategory[]).map(cat => {
                                        const { status, version } = getConsentStatus(selectedPatient, cat);
                                        const isRevoked = status === 'Revoked';
                                        return (
                                            <div key={cat} className={`p-4 rounded-2xl border transition-all ${isRevoked ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-black uppercase text-slate-600">{cat} Processing</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isRevoked ? 'bg-red-600 text-white' : 'bg-teal-600 text-white'}`}>
                                                            {status === 'None' ? 'UNSET' : status.toUpperCase()}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-slate-400">Ver: {version}</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center mt-2">
                                                    <p className="text-[10px] text-slate-500 font-medium max-w-[150px]">
                                                        {cat === 'Clinical' ? 'Allows diagnosis, odontogram & dental chart entry.' : cat === 'Marketing' ? 'Allows clinic updates, promos & greetings.' : 'Allows medical clearance sharing.'}
                                                    </p>
                                                    {isRevoked ? (
                                                        <button onClick={() => handleGrantConsent(cat)} className="text-[10px] font-black text-teal-600 hover:text-teal-800 uppercase tracking-tighter flex items-center gap-1">
                                                            <Plus size={10}/> Restore Consent
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => setRevocationTarget({ category: cat })} className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-tighter flex items-center gap-1">
                                                            <ShieldOff size={10}/> Revoke Consent
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                                    <History size={14} className="text-slate-400"/>
                                    <button className="text-[10px] font-bold text-slate-400 uppercase hover:text-teal-600 transition-colors">View full privacy audit trail</button>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={18} className="text-teal-600"/> Registration Summary</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Age / Sex:</span>
                                        <span className="font-bold text-slate-700">{selectedPatient.age || '-'} / {selectedPatient.sex || '-'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Attendance Risk:</span>
                                        <span className={`font-black uppercase text-xs ${selectedPatient.reliabilityScore && selectedPatient.reliabilityScore < 60 ? 'text-red-600' : 'text-teal-600'}`}>{selectedPatient.reliabilityScore !== undefined ? `${selectedPatient.reliabilityScore}% Reliability` : 'New Case'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Contact:</span>
                                        <span className="font-bold text-teal-600">{selectedPatient.phone}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Occupation:</span>
                                        <span className="font-bold text-slate-700">{selectedPatient.occupation || '-'}</span>
                                    </div>
                                    {isFinancialAccessRestricted ? (
                                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-3 text-slate-400">
                                            <ShieldOff size={16}/>
                                            <p className="text-[10px] font-bold uppercase">Financial data scrubbed for Assistant role</p>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Balance Due:</span>
                                            <span className={`font-black ${selectedPatient.currentBalance && selectedPatient.currentBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>₱{selectedPatient.currentBalance?.toLocaleString() || '0.00'}</span>
                                        </div>
                                    )}
                                </div>
                                {currentUser.role === UserRole.ADMIN && (
                                    <div className="mt-8 pt-6 border-t border-red-50">
                                        <div className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Lock size={12}/> Administrative Management</div>
                                        <button 
                                          onClick={() => {
                                              if (window.confirm("CRITICAL: Permanent destruction of this patient record is requested. This cannot be undone. Proceed?")) {
                                                  onDeletePatient(selectedPatient.id);
                                              }
                                          }}
                                          className="w-full py-3 bg-white text-red-600 border-2 border-red-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 transition-all shadow-sm"
                                        >
                                          <Trash2 size={14}/> Delete Patient Record
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'plan' && (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <div className="bg-slate-100 p-1 rounded-xl flex">
                                <button onClick={() => setPlanViewMode('list')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${planViewMode === 'list' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}><List size={16} className="inline mr-2"/> List View</button>
                                <button onClick={() => setPlanViewMode('timeline')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${planViewMode === 'timeline' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}><Clock size={16} className="inline mr-2"/> Timeline</button>
                            </div>
                        </div>
                        {planViewMode === 'timeline' ? (
                            <div className="bg-white p-8 rounded-3xl border border-teal-100 shadow-xl overflow-x-auto min-h-[400px]">
                                <h3 className="font-black text-teal-900 uppercase tracking-widest text-sm mb-10 border-b border-teal-50 pb-4 flex items-center gap-2"><Activity size={18}/> Clinical Path Visualizer</h3>
                                <div className="relative space-y-12">
                                    <div className="absolute top-0 bottom-0 left-48 w-px bg-teal-100 border-dashed border-l-2" />
                                    {(selectedPatient.treatmentPlans || []).map((plan, i) => (
                                        <div key={plan.id} className="flex items-center gap-6 group animate-in slide-in-from-left-4 duration-500" style={{ transitionDelay: `${i * 100}ms` }}>
                                            <div className="w-48 shrink-0"><div className="font-black text-slate-800 text-xs uppercase tracking-tighter truncate">{plan.name}</div><div className="text-[10px] text-slate-400 font-bold uppercase">{plan.status}</div></div>
                                            <div className="flex-1 h-8 bg-teal-50/50 rounded-full relative overflow-hidden border border-teal-100">
                                                <div className={`h-full bg-lilac-500 rounded-full shadow-lg shadow-lilac-500/20 transition-all duration-1000 border-r-4 border-lilac-300 ${plan.status === TreatmentPlanStatus.APPROVED ? 'w-3/4' : 'w-1/4'}`} />
                                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-teal-900/40 uppercase tracking-widest">EST. DURATION: {i + 1 * 6} MONTHS</span>
                                            </div>
                                        </div>
                                    ))}
                                    {(selectedPatient.treatmentPlans || []).length === 0 && <div className="text-center py-20 text-slate-300 italic uppercase font-black text-xs">No plans to visualize.</div>}
                                </div>
                            </div>
                        ) : (
                            <TreatmentPlan patient={selectedPatient} onUpdatePatient={onQuickUpdatePatient} currentUser={currentUser} logAction={logAction} featureFlags={fieldSettings?.features} />
                        )}
                    </div>
                )}
                
                {activeTab === 'ledger' && (
                    isFinancialAccessRestricted ? (
                        <div className="h-full flex items-center justify-center bg-slate-100 rounded-3xl border-2 border-dashed border-slate-300 p-20 text-center">
                            <div className="max-w-md">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><ShieldOff size={40} className="text-slate-300"/></div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2 uppercase tracking-tight">Financial Access Restricted</h3>
                                <p className="text-sm text-slate-500 mb-6">Patient balance and ledger history are only viewable by Administrator and Clinical Dentist roles. Contact a supervisor for billing inquiries.</p>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-200 px-4 py-2 rounded-full inline-block">NPC Compliance Active</div>
                            </div>
                        </div>
                    ) : (
                        <PatientLedger patient={selectedPatient} onUpdatePatient={onQuickUpdatePatient} fieldSettings={fieldSettings} />
                    )
                )}
                
                {activeTab === 'chart' && (
                    <div className="space-y-6">
                        <Odontogram chart={selectedPatient.dentalChart || []} onToothClick={() => {}} readOnly={!isClinicalProcessingAllowed} />
                    </div>
                )}

                {activeTab === 'perio' && (
                    <div className="h-[600px]">
                        <PerioChart data={selectedPatient.perioChart || []} onSave={(newData) => onQuickUpdatePatient({...selectedPatient, perioChart: newData})} readOnly={!isClinicalProcessingAllowed} />
                    </div>
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

      {selectedPatient && (
          <MedicoLegalExportModal
            isOpen={isLegalExportOpen}
            onClose={() => setIsLegalExportOpen(false)}
            patient={selectedPatient}
            staff={staff}
            logAction={logAction}
          />
      )}
    </div>
  );
};

export default PatientList;
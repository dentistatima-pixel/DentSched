
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Phone, MessageSquare, ChevronRight, X, UserPlus, AlertTriangle, Shield, Heart, Activity, Hash, Plus, Trash2, CalendarPlus, Pencil, Printer, CheckCircle, FileCheck, ChevronDown, ChevronUp, AlertCircle, Download, Pill, Cigarette, Baby, User as UserIcon, MapPin, Briefcase, Users, CreditCard, Stethoscope, Mail, Clock, FileText, Grid, List, ClipboardList, DollarSign, StickyNote, PenLine, DownloadCloud, Archive, FileImage, FileUp, FileSignature, ShieldCheck, Lock, Megaphone, BellOff, ArrowRightLeft, Sliders, Sun, Contrast, Save, HeartPulse, ExternalLink, Star, Timeline, ShieldAlert, Crown, Award, ShieldOff, Zap, Circle, LockKeyhole, History, Scale, Calendar, FileBox, Database, ArrowUpRight, Upload } from 'lucide-react';
import { Patient, Appointment, User, UserRole, DentalChartEntry, TreatmentStatus, FieldSettings, PerioMeasurement, AuditLogEntry, PatientFile, AppointmentStatus, LedgerEntry, ClinicalProtocolRule, ClearanceRequest, TreatmentPlanStatus, ConsentCategory, ConsentLogEntry, AuthorityLevel, DpaRequestEntry } from '../types';
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
  staff: User[];
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
}

const PatientList: React.FC<PatientListProps> = ({ 
    patients, appointments, staff = [], currentUser, selectedPatientId, onSelectPatient, onAddPatient, onEditPatient,
    onQuickUpdatePatient, onBulkUpdatePatients, onDeletePatient, onBookAppointment, fieldSettings, logAction
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'info' | 'medical' | 'chart' | 'perio' | 'plan' | 'ledger' | 'documents' | 'imaging'>('info'); 
  const [planViewMode, setPlanViewMode] = useState<'list' | 'timeline'>('list');
  const [revocationTarget, setRevocationTarget] = useState<{ category: ConsentCategory } | null>(null);
  const [isLegalExportOpen, setIsLegalExportOpen] = useState(false);
  
  // File Upload Logic
  const [uploadJustification, setUploadJustification] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId) || null, [patients, selectedPatientId]);

  const getConsentStatus = (patient: Patient, category: ConsentCategory) => {
      const logs = patient.consentLogs?.filter(l => l.category === category) || [];
      if (logs.length === 0) return { status: 'None', version: 'N/A' };
      const latest = [...logs].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      return { status: latest.status, version: latest.version };
  };

  const handleEndorse = () => {
      if (!selectedPatient) return;
      const dentistId = prompt("Enter Practitioner ID to Endorse Patient (Rule 2):");
      if (!dentistId) return;
      const targetDoc = staff.find(s => s.id === dentistId);
      if (!targetDoc) { toast.error("Practitioner ID not found."); return; }

      const returnNote = prompt("RULE 2 COMPLIANCE: Enter 'Transfer of Care' note for return to Primary Dentist:", "Initial emergency resolved. Patient returned to Dr. " + targetDoc.name + " for definitive care.");
      if (returnNote === null) return;

      const updated = {
          ...selectedPatient,
          isEmergencyCase: false,
          provisional: false,
          primaryDentistId: targetDoc.id
      };
      onQuickUpdatePatient(updated);
      logAction('UPDATE', 'Patient', selectedPatient.id, `Rule 2 Endorsement: Transitioned from Emergency to permanent clinical ownership. Transfer Note: ${returnNote}`);
      toast.success(`Patient successfully endorsed and transferred to Dr. ${targetDoc.name}.`);
  };

  const handleFileUpload = () => {
      if (!selectedPatient || !uploadJustification.trim()) {
          toast.error("Rule 9: Clinical indication/justification is mandatory for all diagnostic records.");
          return;
      }
      // Mock upload logic
      const newFile: PatientFile = {
          id: `file_${Date.now()}`,
          patientId: selectedPatient.id,
          title: "Diagnostic Upload",
          category: activeTab === 'imaging' ? 'X-Ray' : 'Other',
          fileType: 'image/jpeg',
          url: '#',
          uploadedBy: currentUser.name,
          uploadedAt: new Date().toISOString(),
          justification: uploadJustification
      };
      onQuickUpdatePatient({ ...selectedPatient, files: [...(selectedPatient.files || []), newFile] });
      logAction('UPDATE', 'Patient', selectedPatient.id, `Uploaded diagnostic record. Indication: ${uploadJustification}`);
      setUploadJustification('');
      setShowUploadModal(false);
      toast.success("Diagnostic record saved with justification.");
  };

  const handleDpaExport = () => {
    if (!selectedPatient) return;
    const exportData = {
        metadata: { practice: fieldSettings?.clinicName || "Practice", exportedAt: new Date().toISOString(), regulatoryBasis: "R.A. 10173 Section 18 - Right to Data Portability", authorizedBy: currentUser.name },
        patient: { id: selectedPatient.id, name: selectedPatient.name, dob: selectedPatient.dob, clinicalHistory: selectedPatient.dentalChart || [], financialSummary: selectedPatient.ledger || [] }
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DPA_PORTABILITY_${selectedPatient.surname.toUpperCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    const newRequest: DpaRequestEntry = { timestamp: new Date().toISOString(), requestor: currentUser.name, type: 'DPA Portability Export (JSON)', fulfillmentDate: new Date().toISOString() };
    onQuickUpdatePatient({ ...selectedPatient, dpaRequestLog: [...(selectedPatient.dpaRequestLog || []), newRequest] });
    logAction('EXPORT_RECORD', 'Patient', selectedPatient.id, "Fulfilling DPA Data Subject Request: Portability export generated.");
    toast.success("DPA Portability export ready.");
  };

  const handlePurgeBiometric = () => {
      if (!selectedPatient || !selectedPatient.guardianProfile?.visualAnchorThumb) return;
      if (!window.confirm("PDA RIGHT TO ERASURE: This will permanently delete the visual anchor image thumbnail while maintaining the forensic cryptographic hash. Proceed?")) return;
      onQuickUpdatePatient({ ...selectedPatient, guardianProfile: { ...selectedPatient.guardianProfile, visualAnchorThumb: undefined } });
      logAction('UPDATE', 'Patient', selectedPatient.id, "DPA Compliance Action: Purged visual identity anchor image.");
      toast.success("Biometric thumbnail successfully purged.");
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

  useEffect(() => { if (selectedPatientId) logAction('VIEW_RECORD', 'Patient', selectedPatientId, `Opened patient clinical folder.`); }, [selectedPatientId]);

  const getReliabilityUI = (score?: number) => {
      if (score === undefined) return { icon: Circle, color: 'text-slate-300', label: 'New Patient' };
      if (score >= 80) return { icon: CheckCircle, color: 'text-teal-500', label: 'High Reliability' };
      if (score >= 60) return { icon: Circle, color: 'text-lilac-400', label: 'Standard' };
      return { icon: AlertTriangle, color: 'text-red-500', label: 'High Risk' };
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

  const handleRevokeConsent = (reason: string, notes: string) => {
      if (!selectedPatient || !revocationTarget) return;
      const newLog: ConsentLogEntry = { id: `cl_${Date.now()}`, category: revocationTarget.category, status: 'Revoked', version: fieldSettings?.currentPrivacyVersion || 'v1.0', timestamp: new Date().toISOString(), reason, staffId: currentUser.id, staffName: currentUser.name };
      onQuickUpdatePatient({ ...selectedPatient, consentLogs: [...(selectedPatient.consentLogs || []), newLog] });
      logAction('UPDATE', 'Patient', selectedPatient.id, `Revoked ${revocationTarget.category} consent.`);
      setRevocationTarget(null);
      toast.warning(`${revocationTarget.category} consent successfully withdrawn.`);
      if (revocationTarget.category === 'Clinical') setActiveTab('info');
  };

  const handleGrantConsent = (category: ConsentCategory) => {
      if (!selectedPatient) return;
      const newLog: ConsentLogEntry = { id: `cl_${Date.now()}`, category, status: 'Granted', version: fieldSettings?.currentPrivacyVersion || 'v1.0', timestamp: new Date().toISOString(), staffId: currentUser.id, staffName: currentUser.name };
      onQuickUpdatePatient({ ...selectedPatient, consentLogs: [...(selectedPatient.consentLogs || []), newLog] });
      logAction('UPDATE', 'Patient', selectedPatient.id, `Re-granted ${category} consent.`);
      toast.success(`${category} consent successfully updated.`);
  };

  const ReferralNode: React.FC<{ patient: Patient; allPatients: Patient[]; level?: number }> = ({ patient, allPatients, level = 0 }) => {
      const children = allPatients.filter(p => p.referredById === patient.id);
      return (
          <div className="ml-4">
              <div className={`flex items-center gap-2 p-2 rounded-xl border mb-2 transition-all ${level === 0 ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-100 hover:border-teal-300 shadow-sm'}`}>
                  {level === 0 ? <Activity size={16} className="text-teal-600" /> : <div className="w-4 border-b-2 border-teal-100" />}
                  <div className="flex-1">
                      <span className="font-bold text-slate-800 text-sm">{patient.name}</span>
                      {children.length > 0 && <span className="ml-2 text-[10px] font-black text-teal-600 uppercase tracking-tighter">Attributed Source ({children.length})</span>}
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
                            {(selectedPatient.provisional || selectedPatient.isEmergencyCase) && (
                                <button 
                                    onClick={handleEndorse}
                                    className="px-3 py-1 bg-lilac-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-lilac-600/20 hover:scale-105 transition-all"
                                >
                                    <ArrowUpRight size={14}/> Discharge & Return to Primary (Rule 2)
                                </button>
                            )}
                        </div>
                        <div className="text-sm font-bold text-slate-400 uppercase mt-1">ID: {selectedPatient.id}</div>
                    </div>
                    <div className="flex gap-2">
                        {currentUser.role !== UserRole.DENTAL_ASSISTANT && (
                            <button 
                                onClick={handleDpaExport}
                                className="bg-lilac-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-lilac-600/20 hover:scale-105 transition-all"
                            >
                                <Database size={14}/> Fulfill DPA Portability
                            </button>
                        )}
                        {currentUser.role !== UserRole.DENTAL_ASSISTANT && (
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
                        
                        {/* LEFT COLUMN: NIXUS MAPPING & DEPENDENTS */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2"><ArrowRightLeft size={18} className="text-teal-600"/> Clinical Relationship Nexus</h4>
                                    <span className="text-[10px] font-black bg-teal-50 text-teal-700 px-2 py-1 rounded uppercase">Source Mapping</span>
                                </div>
                                {referrals.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                            <div className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-4">Downline Nexus Patients</div>
                                            <div className="space-y-2">
                                                {referrals.map(r => (
                                                    <ReferralNode key={r.id} patient={r} allPatients={patients} level={0} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-10 text-center flex flex-col items-center gap-3">
                                        <Users size={48} className="text-slate-200" />
                                        <p className="text-slate-400 text-sm italic">No referral mapping identified.</p>
                                    </div>
                                )}
                            </div>

                            {/* Legal Guardianship Card */}
                            <div className="bg-white p-6 rounded-3xl border-2 border-lilac-100 shadow-sm flex flex-col h-fit relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12"><Shield size={80}/></div>
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-black text-teal-900 flex items-center gap-2 uppercase tracking-widest text-xs">
                                        <Scale size={18} className="text-lilac-600"/> Legal Guardianship
                                    </h4>
                                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase">Authority Matrix</span>
                                </div>

                                {selectedPatient.guardianProfile ? (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="text-xs font-black uppercase text-teal-900">{selectedPatient.guardianProfile.legalName}</div>
                                                    <div className="text-[10px] text-teal-600 font-bold uppercase">{selectedPatient.guardianProfile.relationship}</div>
                                                </div>
                                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${selectedPatient.guardianProfile.authorityLevel === AuthorityLevel.FULL ? 'bg-teal-600 text-white' : 'bg-lilac-50 text-white'}`}>
                                                    {selectedPatient.guardianProfile.authorityLevel.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest bg-white/50 p-2 rounded-lg">Verified ID: {selectedPatient.guardianProfile.idType} ({selectedPatient.guardianProfile.idNumber})</div>
                                        </div>
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
                            <div className="bg-white p-6 rounded-3xl border-2 border-lilac-100 shadow-sm flex flex-col h-fit relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12"><Shield size={80}/></div>
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-black text-teal-900 flex items-center gap-2 uppercase tracking-widest text-xs">
                                        <ShieldCheck size={18} className="text-lilac-600"/> Privacy Control Center
                                    </h4>
                                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase">v{fieldSettings?.currentPrivacyVersion}</span>
                                </div>

                                <div className="space-y-4">
                                    {(['Clinical', 'Marketing', 'ThirdParty'] as ConsentCategory[]).map(cat => {
                                        const { status, version } = getConsentStatus(selectedPatient, cat);
                                        const isRevoked = status === 'Revoked';
                                        return (
                                            <div key={cat} className={`p-4 rounded-2xl border transition-all ${isRevoked ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-black uppercase text-slate-600">{cat} Processing</span>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isRevoked ? 'bg-red-600 text-white' : 'bg-teal-600 text-white'}`}>
                                                        {status === 'None' ? 'UNSET' : status.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-end items-center mt-2">
                                                    {isRevoked ? (
                                                        <button onClick={() => handleGrantConsent(cat)} className="text-[10px] font-black text-teal-600 hover:text-teal-800 uppercase tracking-tighter flex items-center gap-1"><Plus size={10}/> Restore</button>
                                                    ) : (
                                                        <button onClick={() => setRevocationTarget({ category: cat })} className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-tighter flex items-center gap-1"><ShieldOff size={10}/> Revoke</button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={18} className="text-teal-600"/> Registration Summary</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Contact:</span><span className="font-bold text-teal-600">{selectedPatient.phone}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Practitioner of Record:</span><span className="font-bold text-slate-700">{staff.find(s => s.id === selectedPatient.primaryDentistId)?.name || 'None Assigned'}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'plan' && <TreatmentPlan patient={selectedPatient} onUpdatePatient={onQuickUpdatePatient} currentUser={currentUser} logAction={logAction} featureFlags={fieldSettings?.features} />}
                {activeTab === 'ledger' && !isFinancialAccessRestricted && <PatientLedger patient={selectedPatient} onUpdatePatient={onQuickUpdatePatient} fieldSettings={fieldSettings} />}
                {activeTab === 'chart' && (
                    <div className="space-y-6">
                        <Odontogram chart={selectedPatient.dentalChart || []} onToothClick={() => {}} readOnly={!isClinicalProcessingAllowed} />
                        <Odontonotes entries={selectedPatient.dentalChart || []} onAddEntry={(e) => onQuickUpdatePatient({...selectedPatient, dentalChart: [...(selectedPatient.dentalChart || []), e]})} onUpdateEntry={(e) => onQuickUpdatePatient({...selectedPatient, dentalChart: selectedPatient.dentalChart?.map(i => i.id === e.id ? e : i)})} currentUser={currentUser} readOnly={!isClinicalProcessingAllowed} procedures={fieldSettings?.procedures || []} inventory={fieldSettings?.stockItems || []} logAction={logAction} fieldSettings={fieldSettings} />
                    </div>
                )}
                
                {(activeTab === 'imaging' || activeTab === 'documents') && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-teal-900 uppercase tracking-widest text-sm">{activeTab === 'imaging' ? 'Radiographic Imaging' : 'Clinical Documents'}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Rule 9 Justification Required</p>
                            </div>
                            <button onClick={() => setShowUploadModal(true)} className="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-teal-600/20"><Upload size={18}/> New Diagnostic Record</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(selectedPatient.files || []).filter(f => activeTab === 'imaging' ? f.category === 'X-Ray' : f.category !== 'X-Ray').map(file => (
                                <div key={file.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-slate-50 p-4 rounded-2xl text-slate-400"><FileImage size={32}/></div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-800">{file.title}</h4>
                                            <p className="text-[10px] text-slate-400 uppercase font-black">{formatDate(file.uploadedAt)} • BY {file.uploadedBy}</p>
                                        </div>
                                    </div>
                                    <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100">
                                        <div className="text-[9px] font-black text-teal-600 uppercase mb-1">Clinical Indication / Justification (Rule 9)</div>
                                        <p className="text-xs text-teal-900 italic">"{file.justification || 'Baseline diagnostic documentation.'}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
           </div>
        </div>
      ) : <div className="hidden md:flex flex-[2.5] items-center justify-center text-slate-400 italic">Select Patient Registry Record</div>}

      {showUploadModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95">
                  <h3 className="text-xl font-black text-teal-900 uppercase tracking-widest mb-6">Diagnostic Admission</h3>
                  <div className="space-y-6">
                    <div className="border-4 border-dashed border-slate-100 rounded-3xl p-10 text-center flex flex-col items-center gap-3 bg-slate-50/50">
                        <Upload size={32} className="text-slate-300"/>
                        <span className="text-xs font-bold text-slate-400">Select File...</span>
                    </div>
                    <div>
                        <label className="label text-red-600 font-black flex items-center gap-1"><ShieldAlert size={12}/> Clinical Indication (Mandatory) *</label>
                        <textarea 
                            required
                            value={uploadJustification}
                            onChange={e => setUploadJustification(e.target.value)}
                            className="input h-32"
                            placeholder="Reason for exposure or document inclusion (e.g. Pre-surgical assessment of #38)..."
                        />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowUploadModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl">Cancel</button>
                        <button onClick={handleFileUpload} className="flex-[2] py-4 bg-teal-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-teal-600/20">Acknowledge & Save</button>
                    </div>
                  </div>
              </div>
          </div>
      )}

      {revocationTarget && selectedPatient && (
          <PrivacyRevocationModal isOpen={!!revocationTarget} onClose={() => setRevocationTarget(null)} onConfirm={handleRevokeConsent} patient={selectedPatient} category={revocationTarget.category} />
      )}

      {selectedPatient && (
          <MedicoLegalExportModal isOpen={isLegalExportOpen} onClose={() => setIsLegalExportOpen(false)} patient={selectedPatient} staff={staff} logAction={logAction} />
      )}
    </div>
  );
};

export default PatientList;

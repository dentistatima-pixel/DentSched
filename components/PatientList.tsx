
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Phone, MessageSquare, ChevronRight, X, UserPlus, AlertTriangle, Shield, Heart, Activity, Hash, Plus, Trash2, CalendarPlus, Pencil, Printer, CheckCircle, FileCheck, ChevronDown, ChevronUp, AlertCircle, Download, Pill, Cigarette, Baby, User as UserIcon, MapPin, Briefcase, Users, CreditCard, Stethoscope, Mail, Clock, FileText, Grid, List, ClipboardList, DollarSign, StickyNote, PenLine, DownloadCloud, Archive, FileImage, FileUp, FileSignature, ShieldCheck, Lock, Megaphone, BellOff, ArrowRightLeft, Sliders, Sun, Contrast, Save, HeartPulse, ExternalLink, Star, Timeline, ShieldAlert, Crown, Award, ShieldOff, Zap, Circle, LockKeyhole, History, Scale, Calendar, FileBox, Database, ArrowUpRight, Upload, Eye, QrCode } from 'lucide-react';
import { Patient, Appointment, User, UserRole, DentalChartEntry, TreatmentStatus, FieldSettings, PerioMeasurement, AuditLogEntry, PatientFile, AppointmentStatus, LedgerEntry, ClinicalProtocolRule, ClearanceRequest, TreatmentPlanStatus, ConsentCategory, ConsentLogEntry, AuthorityLevel, DpaRequestEntry, VerificationMethod, ClinicalIncident } from '../types';
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
import { jsPDF } from 'jspdf';
import CryptoJS from 'crypto-js';

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
  const [activeTab, setActiveTab] = useState<'info' | 'medical' | 'chart' | 'perio' | 'plan' | 'ledger' | 'documents' | 'imaging' | 'instructions' | 'certificates'>('info'); 
  const [revocationTarget, setRevocationTarget] = useState<{ category: ConsentCategory } | null>(null);
  const [isLegalExportOpen, setIsLegalExportOpen] = useState(false);
  
  // File Upload Logic
  const [uploadJustification, setUploadJustification] = useState('');
  const [safetyAffirmed, setSafetyAffirmed] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId) || null, [patients, selectedPatientId]);

  // FIX: Added the missing 'referrals' useMemo to resolve the reference error on line 253.
  // This computes all patients who have been referred by the currently active patient.
  const referrals = useMemo(() => {
    if (!selectedPatient) return [];
    return patients.filter(p => p.referredById === selectedPatient.id);
  }, [patients, selectedPatient]);

  const patientAppointments = useMemo(() => {
    if (!selectedPatient) return [];
    return appointments.filter(a => a.patientId === selectedPatient.id && a.status === AppointmentStatus.COMPLETED);
  }, [appointments, selectedPatient]);

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

  // --- HANDLERS FOR CHART & PERIO ---
  const handleChartUpdate = (entry: DentalChartEntry) => {
    if (!selectedPatient) return;
    const updatedChart = [...(selectedPatient.dentalChart || []), { ...entry, author: currentUser.name }];
    onQuickUpdatePatient({ ...selectedPatient, dentalChart: updatedChart });
    logAction('UPDATE', 'Patient', selectedPatient.id, `Updated dental chart: ${entry.procedure} on tooth #${entry.toothNumber}`);
    toast.success(`Record updated for tooth #${entry.toothNumber}`);
  };

  const handlePerioSave = (newData: PerioMeasurement[]) => {
    if (!selectedPatient) return;
    const today = new Date().toISOString().split('T')[0];
    const timedData = newData.map(m => ({ ...m, date: today }));
    const updatedPerio = [...(selectedPatient.perioChart || []), ...timedData];
    onQuickUpdatePatient({ ...selectedPatient, perioChart: updatedPerio });
    logAction('UPDATE', 'Patient', selectedPatient.id, "Performed periodontal examination.");
    toast.success("Perio exam saved.");
  };

  const handleEndorse = () => {
      if (!selectedPatient) return;
      const dentistId = prompt("Enter Practitioner ID to Endorse Patient (Rule 2):");
      if (!dentistId) return;
      const targetDoc = staff.find(s => s.id === dentistId);
      if (!targetDoc) { toast.error("Practitioner ID not found."); return; }

      const confirmContinuity = window.confirm("PDA RULE 2 CONTINUITY STATEMENT: I certify that the patient has been informed that I (the primary dentist) remain available for emergency care until Dr. " + targetDoc.name + " formally assumes the case. Accept Transfer terms?");
      if (!confirmContinuity) return;

      const returnNote = prompt("RULE 2 COMPLIANCE: Enter 'Transfer of Care' note for documentation:", "Initial emergency resolved. Patient returned to Dr. " + targetDoc.name + " for definitive care. Emergency availability affirmed.");
      if (returnNote === null) return;

      const updated = { ...selectedPatient, isEmergencyCase: false, provisional: false, primaryDentistId: targetDoc.id };
      onQuickUpdatePatient(updated);
      logAction('UPDATE', 'Patient', selectedPatient.id, `Rule 2 Endorsement: Transitioned to Dr. ${targetDoc.name}. Note: ${returnNote}`);
      toast.success(`Patient successfully endorsed.`);
  };

  const handleFileUpload = () => {
      if (!selectedPatient || !uploadJustification.trim()) {
          toast.error("Rule 9: Clinical indication/justification is mandatory.");
          return;
      }
      
      const isXRay = activeTab === 'imaging';
      if (isXRay && !safetyAffirmed) {
          toast.error("Rule 9: Safety affirmation is mandatory for X-ray uploads.");
          return;
      }

      const newFile: PatientFile = {
          id: `file_${Date.now()}`,
          patientId: selectedPatient.id,
          title: isXRay ? "Diagnostic Radiograph" : "Diagnostic Upload",
          category: isXRay ? 'X-Ray' : 'Other',
          fileType: 'image/jpeg',
          url: '#',
          uploadedBy: currentUser.name,
          uploadedAt: new Date().toISOString(),
          justification: uploadJustification,
          safetyAffirmed: isXRay ? safetyAffirmed : undefined
      };
      onQuickUpdatePatient({ ...selectedPatient, files: [...(selectedPatient.files || []), newFile] });
      logAction('UPDATE', 'Patient', selectedPatient.id, `Uploaded diagnostic record.`);
      setUploadJustification('');
      setSafetyAffirmed(false);
      setShowUploadModal(false);
      toast.success("Diagnostic record saved.");
  };

  const handleGenerateCertificate = (apt: Appointment) => {
      if (!selectedPatient) return;
      toast.info("Generating verified treatment certificate...");
      const doc = new jsPDF();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text("CERTIFICATE OF TREATMENT", 105, 30, { align: 'center' });
      doc.setFontSize(10);
      doc.text("OFFICIAL CLINICAL RECORD (PDA ETHICS SECTION 17)", 105, 38, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const text = `This is to certify that ${selectedPatient.name} was seen and treated at this clinic on ${formatDate(apt.date)} for ${apt.type}.`;
      doc.text(doc.splitTextToSize(text, 170), 20, 60);
      doc.save(`Certificate_${selectedPatient.surname}_${apt.date}.pdf`);
      logAction('EXPORT_RECORD', 'Patient', selectedPatient.id, `Issued verified certificate.`);
  };

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
                </div>
            </div>
            {children.map(child => <ReferralNode key={child.id} patient={child} allPatients={allPatients} level={level + 1} />)}
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
               {patients.map(p => (
                   <button key={p.id} onClick={() => onSelectPatient(p.id)} className={`w-full text-left p-4 rounded-xl transition-all flex justify-between items-center group ${selectedPatientId === p.id ? 'bg-teal-600 text-white shadow-lg' : 'hover:bg-teal-50'}`}>
                       <div className="flex-1 min-w-0">
                           <div className="font-bold text-sm truncate">{p.name}</div>
                           <div className={`text-[10px] uppercase font-bold flex items-center gap-2 ${selectedPatientId === p.id ? 'text-teal-100' : 'text-slate-400'}`}>ID: {p.id}</div>
                       </div>
                       <ChevronRight size={16} className={selectedPatientId === p.id ? 'text-white' : 'text-slate-300'} />
                   </button>
               ))}
           </div>
      </div>

      {selectedPatient ? (
        <div className="flex-[2.5] bg-white rounded-2xl shadow-sm border border-slate-100 p-0 relative animate-in slide-in-from-right-10 duration-300 overflow-hidden flex flex-col">
           
           <div className="pt-6 px-6 pb-6 border-b bg-white">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-bold text-slate-900">{selectedPatient.name}</h2>
                            {(selectedPatient.provisional || selectedPatient.isEmergencyCase) && (
                                <button onClick={handleEndorse} className="px-3 py-1 bg-lilac-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-lilac-600/20 hover:scale-105 transition-all">
                                    <ArrowUpRight size={14}/> Discharge & Return (Rule 2)
                                </button>
                            )}
                        </div>
                        <div className="text-sm font-bold text-slate-400 uppercase mt-1">ID: {selectedPatient.id}</div>
                    </div>
                </div>
           </div>

           <div className="bg-white px-6 border-b border-slate-200 flex gap-6 shrink-0 z-0 overflow-x-auto no-scrollbar">
               {['info', 'medical', 'chart', 'imaging', 'perio', 'plan', 'ledger', 'documents', 'instructions', 'certificates'].map(t => {
                   const isBlocked = clinicalTabs.includes(t) && !isClinicalProcessingAllowed;
                   return (
                   <button 
                    key={t} 
                    onClick={() => !isBlocked && setActiveTab(t as any)} 
                    className={`py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === t ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-400 hover:text-slate-600'} ${isBlocked ? 'opacity-30 cursor-not-allowed' : ''}`}
                   >
                       {t === 'instructions' ? 'Instruction Logs' : t}
                       {isBlocked && <LockKeyhole size={12}/>}
                   </button>
               )})}
           </div>

           <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit">
                            <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><ArrowRightLeft size={18} className="text-teal-600"/> Clinical Nexus</h4>
                            {referrals.length > 0 ? <ReferralNode patient={selectedPatient} allPatients={patients} /> : <div className="p-10 text-center text-slate-400 italic text-sm">No referral mapping identified.</div>}
                        </div>
                        <div className="bg-white p-6 rounded-3xl border-2 border-lilac-100 shadow-sm flex flex-col h-fit">
                            <h4 className="font-black text-teal-900 flex items-center gap-2 uppercase tracking-widest text-xs mb-6"><ShieldCheck size={18} className="text-lilac-600"/> Privacy Controls</h4>
                            <div className="space-y-4">
                                {(['Clinical', 'Marketing', 'ThirdParty'] as ConsentCategory[]).map(cat => {
                                    const { status } = getConsentStatus(selectedPatient, cat);
                                    return (
                                        <div key={cat} className={`p-4 rounded-2xl border transition-all ${status === 'Revoked' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-black uppercase text-slate-600">{cat} Processing</span>
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${status === 'Revoked' ? 'bg-red-600 text-white' : 'bg-teal-600 text-white'}`}>{status.toUpperCase()}</span>
                                            </div>
                                            <div className="flex justify-end items-center mt-2">
                                                {status === 'Revoked' ? <button onClick={() => handleGrantConsent(cat)} className="text-[10px] font-black text-teal-600 uppercase flex items-center gap-1">Restore</button> : <button onClick={() => setRevocationTarget({ category: cat })} className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1">Revoke</button>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'chart' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full min-h-[600px]">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6">
                            <Odontogram 
                                chart={selectedPatient.dentalChart || []} 
                                readOnly={!isClinicalProcessingAllowed}
                                onToothClick={() => {}} 
                                onChartUpdate={handleChartUpdate}
                            />
                        </div>
                        <div className="h-full">
                            <Odontonotes 
                                entries={selectedPatient.dentalChart || []}
                                onAddEntry={handleChartUpdate}
                                onUpdateEntry={(entry) => {
                                    const updated = (selectedPatient.dentalChart || []).map(e => e.id === entry.id ? entry : e);
                                    onQuickUpdatePatient({...selectedPatient, dentalChart: updated});
                                }}
                                currentUser={currentUser}
                                readOnly={!isClinicalProcessingAllowed}
                                procedures={fieldSettings?.procedures || []}
                                inventory={fieldSettings?.stockItems || []}
                                fieldSettings={fieldSettings}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'perio' && (
                    <div className="h-full min-h-[600px]">
                        <PerioChart 
                            data={selectedPatient.perioChart || []}
                            onSave={handlePerioSave}
                            readOnly={!isClinicalProcessingAllowed}
                        />
                    </div>
                )}

                {activeTab === 'plan' && (
                    <TreatmentPlan 
                        patient={selectedPatient} 
                        currentUser={currentUser} 
                        readOnly={!isClinicalProcessingAllowed} 
                        onUpdatePatient={onQuickUpdatePatient} 
                        logAction={logAction}
                        featureFlags={fieldSettings?.features}
                    />
                )}

                {activeTab === 'ledger' && (
                    <PatientLedger 
                        patient={selectedPatient} 
                        onUpdatePatient={onQuickUpdatePatient} 
                        readOnly={currentUser.role === UserRole.DENTAL_ASSISTANT} 
                        fieldSettings={fieldSettings}
                    />
                )}

                {activeTab === 'certificates' && (
                    <div className="space-y-4">
                        {patientAppointments.map(apt => (
                            <div key={apt.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-teal-600 transition-colors"><Calendar size={20}/></div>
                                    <div>
                                        <div className="font-black text-slate-800 uppercase text-xs">{apt.type} Session</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{formatDate(apt.date)} • Verified Record</div>
                                    </div>
                                </div>
                                <button onClick={() => handleGenerateCertificate(apt)} className="px-6 py-2.5 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-600/20 hover:scale-105 transition-all flex items-center gap-2"><FileCheck size={14}/> Issue Verified Certificate</button>
                            </div>
                        ))}
                    </div>
                )}

                {(activeTab === 'imaging' || activeTab === 'documents') && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
                            <h3 className="font-black text-teal-900 uppercase tracking-widest text-sm">{activeTab === 'imaging' ? 'Radiographic Imaging' : 'Clinical Documents'}</h3>
                            <button onClick={() => setShowUploadModal(true)} className="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-teal-600/20"><Upload size={18}/> New Admission</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(selectedPatient.files || []).filter(f => activeTab === 'imaging' ? f.category === 'X-Ray' : f.category !== 'X-Ray').map(file => (
                                <div key={file.id} className="bg-white p-6 rounded-[2rem] border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-slate-50 p-4 rounded-2xl text-slate-400"><FileImage size={32}/></div>
                                        <div className="flex-1"><h4 className="font-bold text-slate-800">{file.title}</h4><p className="text-[10px] text-slate-400 uppercase font-black">{formatDate(file.uploadedAt)} • BY {file.uploadedBy}</p></div>
                                    </div>
                                    <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100">
                                        <div className="text-[9px] font-black text-teal-600 uppercase mb-1">Clinical Indication (Rule 9)</div>
                                        <p className="text-xs text-teal-900 italic">"{file.justification || 'Diagnostic documentation.'}"</p>
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
                    <div><label className="label text-red-600 font-black flex items-center gap-1"><ShieldAlert size={12}/> Clinical Indication (Mandatory) *</label><textarea required value={uploadJustification} onChange={e => setUploadJustification(e.target.value)} className="input h-24" placeholder="Reason for exposure..." /></div>
                    {activeTab === 'imaging' && (
                        <label className="flex items-start gap-3 p-4 bg-teal-50 border border-teal-200 rounded-2xl cursor-pointer">
                            <input type="checkbox" checked={safetyAffirmed} onChange={e => setSafetyAffirmed(e.target.checked)} className="w-5 h-5 accent-teal-600 rounded mt-1" />
                            <div><span className="text-xs font-black text-teal-900 uppercase">Radiation Safety Affirmation (Rule 9)</span><p className="text-[10px] text-teal-700 leading-tight">I certify that Lead shielding was utilized during this exposure.</p></div>
                        </label>
                    )}
                    <div className="flex gap-3"><button onClick={() => setShowUploadModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl">Cancel</button><button onClick={handleFileUpload} className="flex-[2] py-4 bg-teal-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-teal-600/20">Acknowledge & Save</button></div>
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
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Phone, MessageSquare, ChevronRight, X, UserPlus, AlertTriangle, Shield, Heart, Activity, Hash, Plus, Trash2, CalendarPlus, Pencil, Printer, CheckCircle, FileCheck, ChevronDown, ChevronUp, AlertCircle, Download, Pill, Cigarette, Baby, User as UserIcon, MapPin, Briefcase, Users, CreditCard, Stethoscope, Mail, Clock, FileText, Grid, List, ClipboardList, DollarSign, StickyNote, PenLine, DownloadCloud, Archive, FileImage, FileUp, FileSignature, ShieldCheck, Lock, Megaphone, BellOff, ArrowRightLeft, Sliders, Sun, Contrast, Save, HeartPulse, ExternalLink, Star, Timeline, ShieldAlert, Crown, Award, ShieldOff, Zap, Circle, LockKeyhole, History, Scale, Calendar, FileBox, Database, ArrowUpRight, Upload, Eye, QrCode, Send, DatabaseBackup, Droplet } from 'lucide-react';
import { Patient, Appointment, User, UserRole, DentalChartEntry, TreatmentStatus, FieldSettings, PerioMeasurement, AuditLogEntry, PatientFile, AppointmentStatus, LedgerEntry, ClinicalProtocolRule, ClearanceRequest, TreatmentPlanStatus, ConsentCategory, ConsentLogEntry, AuthorityLevel, DpaRequestEntry, VerificationMethod, ClinicalIncident, Referral } from '../types';
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

  // Referral State (Rule 18)
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralForm, setReferralForm] = useState<Partial<Referral>>({
      referredTo: '', reason: '', question: ''
  });

  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId) || null, [patients, selectedPatientId]);

  const isArchitect = currentUser.role === UserRole.SYSTEM_ARCHITECT;

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

  const isClinicalLocked = useMemo(() => {
      if (!selectedPatient) return false;
      const { status } = getConsentStatus(selectedPatient, 'Clinical');
      // SYSTEM_ARCHITECT bypasses clinical locks for system integrity verification
      return status === 'Revoked' && !isArchitect;
  }, [selectedPatient, isArchitect]);

  const handleChartUpdate = (entry: DentalChartEntry) => {
    if (!selectedPatient) return;
    const updatedChart = [...(selectedPatient.dentalChart || []), { ...entry, author: currentUser.name, authorRole: currentUser.role }];
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

  const handleDataPortabilityExport = () => {
    if (!selectedPatient) return;
    
    const exportBundle = {
        meta: {
            practice: fieldSettings?.clinicName,
            exportTimestamp: new Date().toISOString(),
            complianceStandard: "RA 10173 Section 18 Data Portability",
            format: "Structured JSON (Machine Readable)"
        },
        patient: {
            id: selectedPatient.id,
            identity: {
                firstName: selectedPatient.firstName,
                surname: selectedPatient.surname,
                middleName: selectedPatient.middleName,
                dob: selectedPatient.dob,
                sex: selectedPatient.sex
            },
            clinicalHistory: selectedPatient.dentalChart || [],
            periodontalData: selectedPatient.perioChart || [],
            medicalConditions: selectedPatient.medicalConditions || [],
            allergies: selectedPatient.allergies || []
        }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `DPA_Portability_${selectedPatient.surname}_${selectedPatient.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    logAction('EXPORT_RECORD', 'Patient', selectedPatient.id, `DPA Section 18: Exercised Right to Data Portability. Structured JSON bundle issued.`);
    toast.success("Machine-readable DPA bundle exported.");
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
      
      const doc = new jsPDF();
      doc.setFont('helvetica', 'bold'); doc.text("OFFICIAL TRANSITION OF CARE", 105, 20, { align: 'center' });
      doc.setFontSize(10); doc.text(`Patient: ${selectedPatient.name} | Transition Date: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });
      doc.line(10, 35, 200, 35);
      doc.setFont('helvetica', 'normal');
      doc.text(`Originating Practitioner: Dr. ${currentUser.name}`, 15, 45);
      doc.text(`Receiving Practitioner: Dr. ${targetDoc.name}`, 15, 52);
      
      doc.setFont('helvetica', 'bold'); doc.text("CONTINUITY OF CARE STATEMENT (PDA RULE 2):", 15, 65);
      doc.setFont('helvetica', 'normal');
      const stmt = `The patient has been stabilized for the following emergency presentation. Dr. ${currentUser.name} has provided remediative care and remains available for consultation or secondary emergency care until Dr. ${targetDoc.name} formally acknowledges receipt of this clinical transition.`;
      doc.text(doc.splitTextToSize(stmt, 170), 20, 72);
      
      doc.setFont('helvetica', 'bold'); doc.text("TRANSITION NARRATIVE:", 15, 95);
      doc.setFont('helvetica', 'normal');
      doc.text(doc.splitTextToSize(returnNote, 170), 20, 102);

      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.text("SECTION II: CLINICAL SUMMARY FOR RECEIVING PRACTITIONER", 15, 20);
      doc.setLineWidth(0.5);
      doc.line(15, 25, 195, 25);
      
      let y = 35;
      const history = [...(selectedPatient.dentalChart || [])]
        .filter(e => e.notes)
        .sort((a,b) => new Date(b.date||'').getTime() - new Date(a.date||'').getTime())
        .slice(0, 5);

      if (history.length > 0) {
          history.forEach(entry => {
              if (y > 270) { doc.addPage(); y = 20; }
              doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
              doc.text(`${formatDate(entry.date)} - ${entry.procedure} (Tooth #${entry.toothNumber})`, 15, y);
              y += 5;
              doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
              const wrapNotes = doc.splitTextToSize(entry.notes || '', 170);
              doc.text(wrapNotes, 20, y);
              y += (wrapNotes.length * 4) + 10;
          });
      } else {
          doc.text("No prior clinical records found in this registry.", 20, 35);
      }

      doc.setFontSize(8);
      doc.text("END OF TRANSITION REPORT", 105, 285, { align: 'center' });
      
      doc.save(`Endorsement_${selectedPatient.surname}_to_${targetDoc.name.split(' ')[0]}.pdf`);

      toast.success(`Patient successfully endorsed. Transition PDF issued with history.`);
  };

  const handleReferralSubmit = () => {
      if (!selectedPatient || !referralForm.referredTo || !referralForm.question) {
          toast.error("Rule 18: Target specialist and specific clinical question are mandatory.");
          return;
      }

      const doc = new jsPDF();
      doc.setFont('helvetica', 'bold'); doc.text("CLINICAL REFERRAL & SECOND OPINION REQUEST", 105, 20, { align: 'center' });
      doc.setFontSize(8); doc.text("PDA CODE OF ETHICS SECTION 18 COMPLIANT", 105, 25, { align: 'center' });
      doc.line(10, 30, 200, 30);
      
      doc.setFontSize(10);
      doc.text(`RE: Patient ${selectedPatient.name} (DOB: ${selectedPatient.dob})`, 15, 40);
      doc.text(`TO: ${referralForm.referredTo}`, 15, 47);
      doc.text(`FROM: Dr. ${currentUser.name}`, 15, 54);
      
      doc.setFont('helvetica', 'bold'); doc.text("MANDATORY CLINICAL QUESTION (Rule 18):", 15, 65);
      doc.setFont('helvetica', 'normal');
      doc.text(doc.splitTextToSize(referralForm.question || '', 170), 20, 72);
      
      doc.setFont('helvetica', 'bold'); doc.text("CLINICAL REASON FOR REFERRAL:", 15, 95);
      doc.setFont('helvetica', 'normal');
      doc.text(doc.splitTextToSize(referralForm.reason || '', 170), 20, 102);
      
      doc.line(110, 260, 190, 260);
      doc.setFontSize(8); doc.text(`Digitally Signed: Dr. ${currentUser.name}`, 150, 265, { align: 'center' });
      
      doc.save(`Referral_${selectedPatient.surname}_to_${referralForm.referredTo}.pdf`);
      logAction('CREATE_REFERRAL', 'Referral', selectedPatient.id, `Issued Rule 18 Referral to ${referralForm.referredTo}. Question: ${referralForm.question}`);
      
      setShowReferralModal(false);
      setReferralForm({ referredTo: '', reason: '', question: '' });
      toast.success("Referral Question documented and letter issued.");
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

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className={`flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col ${selectedPatientId ? 'hidden md:flex' : 'flex'}`}>
           <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
               <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input type="text" placeholder="Registry search..." className="input pl-10 h-11" />
               </div>
               <button onClick={onAddPatient} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all flex items-center justify-center gap-2">
                   <UserPlus size={16}/> Register New
               </button>
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
           
           {isArchitect && (
               <div className="bg-lilac-600 text-white px-6 py-2 flex items-center justify-center gap-3 shadow-lg z-50">
                    <Zap size={14} className="animate-pulse"/>
                    <span className="text-[10px] font-black uppercase tracking-widest">INTEGRITY AUDIT MODE ACTIVE: Clinical restrictions bypassed for system verification.</span>
               </div>
           )}

           <div className="pt-6 px-6 pb-6 border-b bg-white">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-3xl font-black text-slate-900">{selectedPatient.name}</h2>
                            
                            {selectedPatient.allergies && selectedPatient.allergies.length > 0 && selectedPatient.allergies[0] !== 'None' && (
                                <div className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 shadow-lg shadow-red-600/20 animate-in zoom-in-95">
                                    <ShieldAlert size={14} fill="currentColor"/> ALLERGY: {selectedPatient.allergies.join(', ')}
                                </div>
                            )}
                            {selectedPatient.medicalConditions && selectedPatient.medicalConditions.length > 0 && selectedPatient.medicalConditions[0] !== 'None' && (
                                <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 shadow-lg shadow-orange-600/20 animate-in zoom-in-95">
                                    <AlertCircle size={14} fill="currentColor"/> CONDITION: {selectedPatient.medicalConditions.join(', ')}
                                </div>
                            )}
                            {selectedPatient.takingBloodThinners && (
                                <div className="bg-red-100 text-red-700 border-2 border-red-200 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 animate-pulse">
                                    <Droplet size={14}/> BLOOD THINNER
                                </div>
                            )}
                            {(selectedPatient.currentBalance || 0) > 0 && (
                                <div className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5">
                                    <DollarSign size={14}/> BALANCE: ₱{selectedPatient.currentBalance?.toLocaleString()}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="text-sm font-bold text-slate-400 uppercase">Registry ID: {selectedPatient.id}</div>
                            <div className="h-4 w-px bg-slate-200" />
                            <div className="flex items-center gap-2">
                                <button onClick={() => onEditPatient(selectedPatient)} className="text-[10px] font-black text-teal-600 uppercase hover:underline flex items-center gap-1"><Pencil size={12}/> Edit Details</button>
                                <button onClick={() => onBookAppointment(selectedPatient.id)} className="text-[10px] font-black text-lilac-600 uppercase hover:underline flex items-center gap-1 ml-3"><Calendar size={12}/> New Session</button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        {(selectedPatient.provisional || selectedPatient.isEmergencyCase) && (
                            <button onClick={handleEndorse} className="px-3 py-1.5 bg-lilac-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-lilac-600/20 hover:scale-105 transition-all">
                                <ArrowUpRight size={14}/> Discharge & Return (Rule 2)
                            </button>
                        )}
                        <button onClick={() => setShowReferralModal(true)} className="px-3 py-1.5 bg-teal-50 text-teal-600 border border-teal-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-teal-100 transition-all">
                            <Send size={14}/> Rule 18 Specialist Referral
                        </button>
                    </div>
                </div>
           </div>

           <div className="bg-white px-6 border-b border-slate-200 flex gap-6 shrink-0 z-0 overflow-x-auto no-scrollbar">
               {['info', 'medical', 'chart', 'imaging', 'perio', 'plan', 'ledger', 'documents', 'instructions', 'certificates'].map(t => (
                   <button 
                    key={t} 
                    onClick={() => setActiveTab(t as any)} 
                    className={`py-4 font-black text-[10px] uppercase tracking-widest border-b-4 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === t ? 'border-teal-600 text-teal-800 bg-teal-50/20 px-4 -mb-1' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                   >
                       {t === 'instructions' ? 'Care Log' : t}
                   </button>
               ))}
           </div>

           <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit">
                            <h4 className="font-black text-teal-900 uppercase tracking-widest text-xs mb-6 flex items-center gap-2"><Users size={18} className="text-teal-600"/> Patient Relationship Nexus</h4>
                            {patients.filter(p => p.referredById === selectedPatient.id).length > 0 ? <ReferralNode patient={selectedPatient} allPatients={patients} /> : <div className="p-10 text-center text-slate-400 italic text-sm">No referral mapping identified for this record.</div>}
                        </div>
                        <div className="bg-white p-6 rounded-3xl border-2 border-lilac-100 shadow-sm flex flex-col h-fit">
                            <h4 className="font-black text-teal-900 flex items-center gap-2 uppercase tracking-widest text-xs mb-6"><ShieldCheck size={18} className="text-lilac-600"/> Data Governance Controls</h4>
                            <div className="space-y-4">
                                {(['Clinical', 'Marketing', 'ThirdParty'] as ConsentCategory[]).map(cat => {
                                    const { status } = getConsentStatus(selectedPatient, cat);
                                    return (
                                        <div key={cat} className={`p-4 rounded-2xl border transition-all ${status === 'Revoked' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-black uppercase text-slate-600">{cat} Processing Access</span>
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${status === 'Revoked' ? 'bg-red-600 text-white' : 'bg-teal-600 text-white'}`}>{status.toUpperCase()}</span>
                                            </div>
                                            <div className="flex justify-end items-center mt-2">
                                                {status === 'Revoked' ? <button onClick={() => handleGrantConsent(cat)} className="text-[10px] font-black text-teal-600 uppercase flex items-center gap-1">Restore Rights</button> : <button onClick={() => setRevocationTarget({ category: cat })} className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1">Revoke Access</button>}
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
                                onToothClick={() => {}} 
                                onChartUpdate={handleChartUpdate}
                                readOnly={isClinicalLocked}
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
                                procedures={fieldSettings?.procedures || []}
                                inventory={fieldSettings?.stockItems || []}
                                fieldSettings={fieldSettings}
                                patient={selectedPatient}
                                readOnly={isClinicalLocked}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'perio' && (
                    <div className="h-full min-h-[600px]">
                        <PerioChart 
                            data={selectedPatient.perioChart || []}
                            onSave={handlePerioSave}
                            readOnly={isClinicalLocked}
                        />
                    </div>
                )}

                {activeTab === 'plan' && (
                    <TreatmentPlan 
                        patient={selectedPatient} 
                        currentUser={currentUser} 
                        onUpdatePatient={onQuickUpdatePatient} 
                        logAction={logAction}
                        featureFlags={fieldSettings?.features}
                        fieldSettings={fieldSettings}
                        readOnly={isClinicalLocked}
                    />
                )}

                {activeTab === 'ledger' && (
                    <PatientLedger 
                        patient={selectedPatient} 
                        onUpdatePatient={onQuickUpdatePatient} 
                        readOnly={isClinicalLocked} 
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
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{formatDate(apt.date)} • Verified Clinical Record</div>
                                    </div>
                                </div>
                                <button onClick={() => handleGenerateCertificate(apt)} className="px-6 py-2.5 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-600/20 hover:scale-105 transition-all flex items-center gap-2"><FileCheck size={14}/> Issue Verified Certificate</button>
                            </div>
                        ))}
                    </div>
                )}

                {(activeTab === 'imaging' || activeTab === 'documents') && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center gap-3">
                            <h3 className="font-black text-teal-900 uppercase tracking-widest text-sm flex-1">{activeTab === 'imaging' ? 'Radiographic Imaging' : 'Clinical Documents'}</h3>
                            <button onClick={handleDataPortabilityExport} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-all"><DatabaseBackup size={14}/> Data Portability Bundle</button>
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
      ) : <div className="hidden md:flex flex-[2.5] items-center justify-center text-slate-400 italic">Select Patient Registry Record to View History</div>}

      {/* REFERRAL MODAL (Rule 18) */}
      {showReferralModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
              <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="flex items-center gap-3 text-teal-700 mb-6">
                      <Send size={28}/>
                      <h3 className="text-xl font-black text-teal-900 uppercase tracking-widest">Specialist Referral Gate</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-6 no-scrollbar">
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                        <p className="text-xs text-amber-900 font-bold leading-relaxed">
                            PDA Ethics Rule 18: "Dentists must indicate the reason and specific clinical question for a second opinion referral to define the consultant's duty."
                        </p>
                    </div>
                    <div><label className="label text-teal-800 font-black">Target Specialist / Clinic *</label><input type="text" className="input" placeholder="e.g. Dr. Santos (Endodontics)" value={referralForm.referredTo} onChange={e => setReferralForm({...referralForm, referredTo: e.target.value})} /></div>
                    <div><label className="label text-teal-800 font-black">Clinical Question (The "Task") *</label><textarea required className="input h-24" placeholder="e.g. 'Please evaluate #16 for possibility of vertical root fracture...'" value={referralForm.question} onChange={e => setReferralForm({...referralForm, question: e.target.value})} /></div>
                    <div><label className="label">General Reason / Background</label><textarea className="input h-20" placeholder="Patient history or symptoms leading to this referral..." value={referralForm.reason} onChange={e => setReferralForm({...referralForm, reason: e.target.value})} /></div>
                  </div>
                  <div className="flex gap-3 mt-6 pt-6 border-t">
                      <button onClick={() => setShowReferralModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl">Cancel</button>
                      <button onClick={handleReferralSubmit} disabled={!referralForm.referredTo || !referralForm.question} className="flex-[2] py-4 bg-teal-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-teal-600/20 disabled:opacity-40">Issue Verified Referral</button>
                  </div>
              </div>
          </div>
      )}

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
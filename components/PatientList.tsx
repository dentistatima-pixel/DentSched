import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Phone, MessageSquare, ChevronRight, X, UserPlus, AlertTriangle, Shield, Heart, Activity, Hash, Plus, Trash2, CalendarPlus, Pencil, Printer, CheckCircle, FileCheck, ChevronDown, ChevronUp, AlertCircle, Download, Pill, Cigarette, Baby, User as UserIcon, MapPin, Briefcase, Users, CreditCard, Stethoscope, Mail, Clock, FileText, Grid, List, ClipboardList, DollarSign, StickyNote, PenLine, DownloadCloud, Archive, FileImage, FileUp, FileSignature, ShieldCheck, Lock, Megaphone, BellOff, ArrowRightLeft, Sliders, Sun, Contrast, Save, HeartPulse, ExternalLink, Star, ShieldAlert, Crown, Award, ShieldOff, Zap, Circle, LockKeyhole, History, Scale, Calendar, FileBox, Database, ArrowUpRight, Upload, Eye, QrCode, Send, DatabaseBackup, Droplet, UserCheck, Verified } from 'lucide-react';
import { Patient, Appointment, User, UserRole, DentalChartEntry, TreatmentStatus, FieldSettings, PerioMeasurement, AuditLogEntry, PatientFile, AppointmentStatus, LedgerEntry, ClinicalProtocolRule, ClearanceRequest, TreatmentPlanStatus, ConsentCategory, ConsentLogEntry, AuthorityLevel, VerificationMethod, ClinicalIncident, Referral } from '../types';
import Odontogram from './Odontogram';
import Odontonotes from './Odontonotes';
import TreatmentPlan from './TreatmentPlan';
import PerioChart from './PerioChart';
import PatientLedger from './PatientLedger';
import RegistrationMedical from './RegistrationMedical';
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
  incidents?: ClinicalIncident[];
}

const PatientList: React.FC<PatientListProps> = ({ 
    patients, appointments, staff = [], currentUser, selectedPatientId, onSelectPatient, onAddPatient, onEditPatient,
    onQuickUpdatePatient, onBulkUpdatePatients, onDeletePatient, onBookAppointment, fieldSettings, logAction, incidents = []
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'info' | 'medical' | 'chart' | 'perio' | 'plan' | 'ledger' | 'documents' | 'imaging' | 'instructions' | 'certificates' | 'clearance'>('info'); 
  const [revocationTarget, setRevocationTarget] = useState<{ category: ConsentCategory } | null>(null);
  const [isLegalExportOpen, setIsLegalExportOpen] = useState(false);
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);
  const [clearanceForm, setClearanceForm] = useState({ doctorName: '', specialty: '', remarks: '' });
  
  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId) || null, [patients, selectedPatientId]);

  const isArchitect = currentUser.role === UserRole.SYSTEM_ARCHITECT;

  const patientAppointments = useMemo(() => {
    if (!selectedPatient) return [];
    return appointments.filter(a => a.patientId === selectedPatient.id && a.status === AppointmentStatus.COMPLETED).sort((a,b) => b.date.localeCompare(a.date));
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
      return status === 'Revoked' && !isArchitect;
  }, [selectedPatient, isArchitect]);

  const handleChartUpdate = (entry: DentalChartEntry) => {
    if (!selectedPatient) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const activeApt = appointments.find(a => 
        a.patientId === selectedPatient.id && 
        a.date === todayStr && 
        [AppointmentStatus.ARRIVED, AppointmentStatus.SEATED, AppointmentStatus.TREATING].includes(a.status)
    );

    if (!activeApt && !isArchitect) {
        toast.error("GHOSTING PROTECTION: Records require a confirmed physical session for today.");
        return;
    }

    const updatedChart = [...(selectedPatient.dentalChart || []), { 
        ...entry, 
        appointmentId: activeApt?.id, 
        author: currentUser.name, 
        authorRole: currentUser.role 
    }];
    onQuickUpdatePatient({ ...selectedPatient, dentalChart: updatedChart });
    logAction('UPDATE', 'Patient', selectedPatient.id, `Updated chart: ${entry.procedure} on tooth #${entry.toothNumber}`);
    toast.success(`Entry finalized for tooth #${entry.toothNumber}`);
  };

  const handleChartDelete = (id: string) => {
      if (!selectedPatient) return;
      const updatedChart = (selectedPatient.dentalChart || []).filter(e => e.id !== id);
      onQuickUpdatePatient({ ...selectedPatient, dentalChart: updatedChart });
  };

  const handlePerioSave = (newData: PerioMeasurement[]) => {
    if (!selectedPatient) return;
    const today = new Date().toISOString().split('T')[0];
    const timedData = newData.map(m => ({ ...m, date: today }));
    const updatedPerio = [...(selectedPatient.perioChart || []), ...timedData];
    onQuickUpdatePatient({ ...selectedPatient, perioChart: updatedPerio });
    toast.success("Periodontal analysis committed.");
  };

  const handleRequestClearance = () => {
    if (!selectedPatient || !clearanceForm.doctorName) return;
    const newRequest: ClearanceRequest = {
        id: `clr_${Date.now()}`,
        patientId: selectedPatient.id,
        doctorName: clearanceForm.doctorName,
        specialty: clearanceForm.specialty,
        requestedAt: new Date().toISOString(),
        status: 'Pending',
        remarks: clearanceForm.remarks
    };
    const updatedRequests = [...(selectedPatient.clearanceRequests || []), newRequest];
    onQuickUpdatePatient({ ...selectedPatient, clearanceRequests: updatedRequests });
    setIsClearanceModalOpen(false);
    setClearanceForm({ doctorName: '', specialty: '', remarks: '' });
    toast.success("Medical Clearance Requested. Safety SMS dispatched.");
    logAction('CREATE', 'Clearance', newRequest.id, `Requested clearance from Dr. ${newRequest.doctorName} (${newRequest.specialty})`);
  };

  const printRegistrationRecord = () => {
      if (!selectedPatient) return;
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("PATIENT REGISTRATION RECORD", 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Patient ID: ${selectedPatient.id}`, 20, 35);
      doc.text(`Name: ${selectedPatient.name}`, 20, 42);
      doc.text(`DOB: ${formatDate(selectedPatient.dob)}`, 20, 49);
      doc.text(`Address: ${selectedPatient.homeAddress || '-'}`, 20, 56);
      doc.text(`Phone: ${selectedPatient.phone}`, 20, 63);
      doc.save(`Registration_${selectedPatient.surname}.pdf`);
  };

  const printVisualAnchor = () => {
      if (!selectedPatient) return;
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("VISUAL IDENTITY ANCHOR", 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Patient: ${selectedPatient.name}`, 20, 40);
      doc.text(`UID: ${selectedPatient.id}`, 20, 47);
      if (selectedPatient.guardianProfile?.visualAnchorThumb) {
          doc.addImage(selectedPatient.guardianProfile.visualAnchorThumb, 'JPEG', 20, 60, 50, 50);
      } else {
          doc.text("No visual anchor thumb found in registry.", 20, 70);
      }
      doc.text(`FORENSIC HASH: ${selectedPatient.guardianProfile?.visualAnchorHash || 'UNAVAILABLE'}`, 20, 120, { maxWidth: 170 });
      doc.save(`IdentityAnchor_${selectedPatient.surname}.pdf`);
  };

  const printDpaSummary = () => {
      if (!selectedPatient) return;
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("DATA SUBJECT ACCESS REQUEST (DPA)", 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text("Privacy Summary Statement:", 20, 40);
      doc.setFontSize(10);
      const summary = `We hold your personal data including medical history and dental charts for clinical diagnostic purposes. Your data is stored securely and processed in compliance with RA 10173. You have the right to rectification and erasure subject to DOH clinical retention mandates (10 years).`;
      doc.text(doc.splitTextToSize(summary, 170), 20, 50);
      doc.save(`DPASummary_${selectedPatient.surname}.pdf`);
  };

  const ReferralNode: React.FC<{ patient: Patient; allPatients: Patient[]; level?: number }> = ({ patient, allPatients, level = 0 }) => {
    const children = allPatients.filter(p => p.referredById === patient.id);
    return (
        <div className="ml-6 border-l-4 border-slate-200 pl-4 py-1">
            <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${level === 0 ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-200 hover:border-teal-400 shadow-sm'}`}>
                {level === 0 ? <Activity size={18} className="text-teal-600" /> : <div className="w-2 h-2 rounded-full bg-teal-500" />}
                <div className="flex-1 min-w-0">
                    <span className="font-black text-slate-800 text-sm uppercase tracking-tight truncate block">{patient.name}</span>
                </div>
            </div>
            {children.map(child => <ReferralNode key={child.id} patient={child} allPatients={allPatients} level={level + 1} />)}
        </div>
    );
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-10 animate-in fade-in slide-in-from-bottom-6 duration-700 relative pb-24">
      
      {/* Registry Column */}
      <div className={`w-full md:w-96 bg-white rounded-[3rem] shadow-xl border-2 border-white flex flex-col shrink-0 ${selectedPatientId ? 'hidden lg:flex' : 'flex'}`}>
           <div className="p-8 border-b border-slate-100 flex flex-col gap-6">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg" aria-hidden="true"><Users size={24}/></div>
                  <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Registry</h2>
               </div>
               <div className="relative group">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-600 transition-colors" size={20} />
                   <input type="text" placeholder="Identity lookup..." aria-label="Search patients by name or ID" className="w-full bg-slate-50 p-4 pl-12 rounded-2xl text-sm font-bold border-2 border-slate-100 focus:border-teal-500 outline-none transition-all shadow-inner" />
               </div>
               <button onClick={onAddPatient} className="w-full bg-lilac-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-lilac-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3" aria-label="Register new patient admission">
                   <UserPlus size={18}/> New Admission
               </button>
           </div>
           <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2" role="list" aria-label="Patient list">
               {patients.map(p => (
                   <button key={p.id} role="listitem" onClick={() => onSelectPatient(p.id)} className={`w-full text-left p-6 rounded-[2rem] transition-all flex justify-between items-center group ${selectedPatientId === p.id ? 'bg-teal-600 text-white shadow-2xl scale-105 z-10' : 'hover:bg-slate-50'}`} aria-label={`Select patient ${p.name}`}>
                       <div className="flex-1 min-w-0">
                           <div className="font-black text-sm uppercase tracking-tighter truncate">{p.name}</div>
                           <div className={`text-xs uppercase font-black flex items-center gap-2 mt-1 tracking-widest ${selectedPatientId === p.id ? 'text-teal-100' : 'text-slate-50'}`}>UID: {p.id.slice(-8)}</div>
                       </div>
                       <ChevronRight size={18} className={selectedPatientId === p.id ? 'text-white' : 'text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all'} />
                   </button>
               ))}
           </div>
      </div>

      {selectedPatient ? (
        <div className="flex-1 bg-white rounded-[3.5rem] shadow-2xl border-4 border-white p-0 relative animate-in slide-in-from-right-10 duration-500 overflow-hidden flex flex-col">
           
           {isArchitect && (
               <div className="bg-lilac-600 text-white px-8 py-3 flex items-center justify-center gap-4 shadow-xl z-50">
                    <Zap size={16} className="animate-pulse"/>
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Clinical Integrity Audit: Governance Restrictions Disabled</span>
               </div>
           )}

           <div className="pt-10 px-10 pb-8 border-b bg-white relative">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 flex-wrap mb-4">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{selectedPatient.name.toUpperCase()}</h2>
                            <div className="h-6 w-px bg-slate-200 mx-2" />
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">PATIENT_ID: {selectedPatient.id}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 flex-wrap" role="status" aria-label="Patient clinical status alerts">
                            {selectedPatient.allergies && selectedPatient.allergies.length > 0 && selectedPatient.allergies[0] !== 'None' && (
                                <div className="bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-2 shadow-lg shadow-red-600/20 animate-in zoom-in-95 ring-4 ring-red-50">
                                    <ShieldAlert size={14}/> ALLERGY: {selectedPatient.allergies.join(', ')}
                                </div>
                            )}
                            {selectedPatient.medicalConditions && selectedPatient.medicalConditions.length > 0 && selectedPatient.medicalConditions[0] !== 'None' && (
                                <div className="bg-orange-50 text-orange-800 px-4 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-2 shadow-sm border border-orange-200 animate-in zoom-in-95">
                                    <AlertCircle size={14}/> {selectedPatient.medicalConditions.join(', ')}
                                </div>
                            )}
                            {(selectedPatient.currentBalance || 0) > 0 && (
                                <div className="bg-amber-50 text-amber-900 border-2 border-amber-200 px-4 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-2">
                                    <DollarSign size={14}/> LEDGER: ₱{selectedPatient.currentBalance?.toLocaleString()}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button onClick={() => onBookAppointment(selectedPatient.id)} className="px-6 py-3 bg-lilac-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl shadow-lilac-600/30 hover:scale-105 active:scale-95 transition-all" aria-label="Book new session for this patient">
                            <CalendarPlus size={18}/> New Session
                        </button>
                    </div>
                </div>
           </div>

           {/* NAV HEADER */}
           <div className="bg-lilac-50/80 backdrop-blur-md px-8 border-b border-lilac-100 flex gap-1 shrink-0 z-10 overflow-x-auto no-scrollbar scroll-smooth" role="tablist" aria-label="Patient chart navigation">
               {['info', 'medical', 'chart', 'imaging', 'perio', 'plan', 'ledger', 'documents', 'certificates', 'clearance'].map(t => {
                   const isCare = ['info', 'plan', 'ledger'].includes(t);
                   return (
                       <button 
                        key={t} 
                        role="tab"
                        aria-selected={activeTab === t}
                        aria-controls={`${t}-panel`}
                        onClick={() => setActiveTab(t as any)} 
                        className={`py-6 px-6 font-black text-xs uppercase tracking-[0.3em] border-b-4 transition-all whitespace-nowrap flex items-center gap-2 ${
                            activeTab === t 
                                ? (isCare ? 'border-lilac-600 text-lilac-900 bg-white' : 'border-teal-600 text-teal-900 bg-white shadow-inner shadow-teal-500/5') 
                                : 'border-transparent text-slate-500 hover:text-lilac-700 hover:bg-white/50'
                        }`}
                       >
                           {t}
                       </button>
                   );
               })}
           </div>

           <div className="flex-1 overflow-y-auto p-10 bg-slate-50/20" id={`${activeTab}-panel`}>
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                        {/* OFFLINE FILING PRINTS SECTION */}
                        <div className="xl:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-teal-50 p-3 rounded-2xl text-teal-600"><Printer size={24}/></div>
                                <div><h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Offline Filing Prints</h4><p className="text-[10px] text-slate-400 font-bold uppercase">Generate documents for manual folder</p></div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={printRegistrationRecord} className="px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase hover:bg-teal-50 hover:border-teal-200 transition-all flex items-center gap-2"><FileText size={14}/> Registration Record</button>
                                {/* Fix: Changed non-existent ImageIcon to imported FileImage */}
                                <button onClick={printVisualAnchor} className="px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase hover:bg-teal-50 hover:border-teal-200 transition-all flex items-center gap-2"><FileImage size={14}/> Identity Anchor</button>
                                <button onClick={printDpaSummary} className="px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase hover:bg-teal-50 hover:border-teal-200 transition-all flex items-center gap-2"><Shield size={14}/> DPA Summary</button>
                            </div>
                        </div>

                        <div className="xl:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden relative">
                             <h4 className="font-black text-slate-800 uppercase tracking-[0.3em] text-sm mb-10 flex items-center gap-4"><History size={24} className="text-teal-600"/> Patient Journey Map</h4>
                             <div className="flex items-center gap-2 overflow-x-auto pb-6 no-scrollbar min-h-[100px] relative">
                                <div className="absolute top-[34px] left-0 right-0 h-1 bg-slate-100 -z-10" />
                                {patientAppointments.slice().reverse().map((apt, idx) => (
                                    <div key={apt.id} className="flex flex-col items-center gap-3 min-w-[120px] group">
                                        <div className={`w-10 h-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-all group-hover:scale-120 ${apt.status === AppointmentStatus.COMPLETED ? 'bg-teal-500' : 'bg-lilac-505'}`}>
                                            <CheckCircle size={16} className="text-white"/>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[10px] font-black text-slate-800 uppercase leading-none truncate w-[100px]">{apt.type}</div>
                                            <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">{formatDate(apt.date)}</div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>

                        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-900/5 flex flex-col h-fit">
                            <h4 className="font-black text-slate-800 uppercase tracking-[0.2em] text-sm mb-10 flex items-center gap-4"><Users size={24} className="text-lilac-600"/> Care Nexus Mapping</h4>
                            {patients.filter(p => p.referredById === selectedPatient.id).length > 0 ? <ReferralNode patient={selectedPatient} allPatients={patients} /> : <div className="p-20 text-center text-slate-500 italic text-sm">No secondary referral associations identified in registry.</div>}
                        </div>
                        <div className="bg-white p-10 rounded-[3rem] border-2 border-lilac-50 shadow-xl shadow-lilac-600/5 flex flex-col h-fit">
                            <h4 className="font-black text-slate-800 flex items-center gap-4 uppercase tracking-[0.2em] text-sm mb-10"><ShieldCheck size={24} className="text-teal-600"/> Data Governance Engine</h4>
                            <div className="space-y-6">
                                {(['Clinical', 'Marketing', 'ThirdParty'] as ConsentCategory[]).map(cat => {
                                    const { status } = getConsentStatus(selectedPatient, cat);
                                    return (
                                        <div key={cat} className={`p-6 rounded-[2rem] border-2 transition-all duration-500 ${status === 'Revoked' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 hover:border-teal-600 shadow-sm'}`}>
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black uppercase text-slate-500 tracking-widest mb-1">{cat} TRACK</span>
                                                    <span className="font-black text-slate-800 text-sm uppercase">Authority</span>
                                                </div>
                                                <span className={`text-xs font-black uppercase px-4 py-1.5 rounded-full shadow-sm ${status === 'Revoked' ? 'bg-red-600 text-white' : 'bg-teal-600 text-white'}`}>{status.toUpperCase()}</span>
                                            </div>
                                            <div className="flex justify-end items-center mt-4 pt-4 border-t border-slate-100">
                                                {status === 'Revoked' ? <button onClick={() => {}} className="text-xs font-black text-teal-700 uppercase flex items-center gap-2 hover:underline tracking-widest">Restore Rights</button> : <button onClick={() => setRevocationTarget({ category: cat })} className="text-xs font-black text-red-600 uppercase flex items-center gap-2 hover:underline tracking-widest">Withdraw Consent</button>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'clearance' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
                        <div className="bg-white p-10 rounded-[3rem] border border-teal-100 shadow-xl shadow-teal-600/5 flex flex-col md:flex-row justify-between items-center gap-6">
                             <div className="flex items-center gap-4">
                                <div className="bg-teal-50 p-4 rounded-3xl text-teal-600 shadow-sm"><Stethoscope size={40}/></div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Medical Clearance Sub-module</h3>
                                    <p className="text-xs text-slate-500 font-black uppercase tracking-widest mt-2">Specialist Coordination Registry</p>
                                </div>
                             </div>
                             <button onClick={() => setIsClearanceModalOpen(true)} className="px-10 py-5 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> Issue Clearance Request</button>
                        </div>

                        <div className="space-y-4">
                            {(selectedPatient.clearanceRequests || []).map(req => (
                                <div key={req.id} className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 shadow-xl flex flex-col md:flex-row justify-between items-center gap-8 group hover:border-teal-500 transition-all">
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className={`p-4 rounded-1.5rem shadow-sm ${req.status === 'Approved' ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 text-slate-400'}`}>
                                            {req.status === 'Approved' ? <Verified size={28}/> : <Clock size={28}/>}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Physician</div>
                                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Dr. {req.doctorName}</h4>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{req.specialty}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-10">
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</div>
                                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border ${req.status === 'Approved' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-50 text-slate-500'}`}>{req.status}</span>
                                        </div>
                                        <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-teal-600 transition-all shadow-sm"><Printer size={20}/></button>
                                    </div>
                                </div>
                            ))}
                            {(selectedPatient.clearanceRequests || []).length === 0 && <div className="py-20 text-center opacity-30 italic font-black uppercase text-slate-800 tracking-widest">No active clearance requests recorded.</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'chart' && (
                    <div className="flex flex-col h-full min-h-[700px] gap-10">
                        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-900/5">
                            <Odontogram 
                                chart={selectedPatient.dentalChart || []} 
                                onToothClick={() => {}} 
                                onChartUpdate={handleChartUpdate}
                                readOnly={isClinicalLocked}
                            />
                        </div>
                        <div className="flex-1">
                            <Odontonotes 
                                entries={selectedPatient.dentalChart || []}
                                onAddEntry={handleChartUpdate}
                                onUpdateEntry={(entry) => {
                                    const updated = (selectedPatient.dentalChart || []).map(e => e.id === entry.id ? entry : e);
                                    onQuickUpdatePatient({...selectedPatient, dentalChart: updated});
                                }}
                                onDeleteEntry={handleChartDelete}
                                currentUser={currentUser}
                                procedures={fieldSettings?.procedures || []}
                                inventory={fieldSettings?.stockItems || []}
                                fieldSettings={fieldSettings}
                                patient={selectedPatient}
                                appointments={appointments}
                                readOnly={isClinicalLocked}
                                logAction={logAction}
                                incidents={incidents}
                            />
                        </div>
                    </div>
                )}

                {['medical', 'perio', 'plan', 'ledger', 'imaging', 'documents', 'certificates'].includes(activeTab) && (
                    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-slate-900/5 overflow-hidden h-full min-h-[600px] animate-in slide-in-from-bottom-6 duration-500">
                        {activeTab === 'medical' && <RegistrationMedical formData={selectedPatient} handleChange={() => {}} handleArrayChange={() => {}} readOnly={true} fieldSettings={fieldSettings!} />}
                        {activeTab === 'perio' && <PerioChart data={selectedPatient.perioChart || []} onSave={handlePerioSave} readOnly={isClinicalLocked} />}
                        {activeTab === 'plan' && <TreatmentPlan patient={selectedPatient} currentUser={currentUser} onUpdatePatient={onQuickUpdatePatient} logAction={logAction} featureFlags={fieldSettings?.features} fieldSettings={fieldSettings} readOnly={isClinicalLocked} />}
                        {activeTab === 'ledger' && <PatientLedger patient={selectedPatient} onUpdatePatient={onQuickUpdatePatient} readOnly={isClinicalLocked} fieldSettings={fieldSettings} />}
                    </div>
                )}
           </div>
        </div>
      ) : <div className="hidden md:flex-1 md:flex flex-col items-center justify-center text-slate-400 space-y-6 opacity-40">
            <Users size={120} strokeWidth={1} />
            <p className="text-xl font-black uppercase tracking-[0.3em]">Patient Identity Hub</p>
            <p className="text-sm font-medium tracking-widest">Select a registry entry to begin clinical processing</p>
          </div>}

      {isClearanceModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border-4 border-teal-100 flex flex-col">
                  <div className="bg-teal-900 p-8 text-white flex justify-between items-center">
                      <div className="flex items-center gap-3"><Stethoscope size={28}/><h3 className="text-xl font-black uppercase tracking-tight">Request Clearance</h3></div>
                      <button onClick={() => setIsClearanceModalOpen(false)}><X size={24}/></button>
                  </div>
                  <div className="p-8 space-y-4">
                      <div><label className="label text-[10px]">Physician Full Name *</label><input type="text" value={clearanceForm.doctorName} onChange={e => setClearanceForm({...clearanceForm, doctorName: e.target.value})} className="input" placeholder="Dr. Juan Dela Cruz" /></div>
                      <div><label className="label text-[10px]">Specialty / Institution</label><input type="text" value={clearanceForm.specialty} onChange={e => setClearanceForm({...clearanceForm, specialty: e.target.value})} className="input" placeholder="Cardiologist / MMC" /></div>
                      <div><label className="label text-[10px]">Clinical Remarks / Questions</label><textarea value={clearanceForm.remarks} onChange={e => setClearanceForm({...clearanceForm, remarks: e.target.value})} className="input h-24" placeholder="Requesting clearance for surgical extraction..." /></div>
                  </div>
                  <div className="p-8 bg-slate-50 border-t flex gap-3">
                      <button onClick={() => setIsClearanceModalOpen(false)} className="flex-1 py-4 bg-white border rounded-2xl font-black uppercase text-[10px]">Cancel</button>
                      <button onClick={handleRequestClearance} className="flex-[2] py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl shadow-teal-600/20">Sync Request</button>
                  </div>
              </div>
          </div>
      )}

      {selectedPatient && (
          <div className="fixed bottom-10 right-10 z-[60] animate-in slide-in-from-right-10 duration-700">
              <button 
                  onClick={() => setIsLegalExportOpen(true)}
                  className="bg-slate-900 text-white px-8 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-2 transition-all active:scale-95 group border-2 border-slate-800"
                  aria-label="Export medico-legal clinical records"
              >
                  <ShieldCheck size={20} className="text-teal-400 group-hover:animate-pulse"/> Action Medico-Legal Export
              </button>
          </div>
      )}

      {revocationTarget && selectedPatient && (
          <PrivacyRevocationModal isOpen={!!revocationTarget} onClose={() => setRevocationTarget(null)} onConfirm={() => {}} patient={selectedPatient} category={revocationTarget.category} />
      )}

      {selectedPatient && (
          <MedicoLegalExportModal isOpen={isLegalExportOpen} onClose={() => setIsLegalExportOpen(false)} patient={selectedPatient} staff={staff} logAction={logAction} />
      )}
    </div>
  );
};

export default PatientList;
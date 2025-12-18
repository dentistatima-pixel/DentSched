
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Phone, MessageSquare, ChevronRight, X, UserPlus, AlertTriangle, Shield, Heart, Activity, Hash, Plus, Trash2, CalendarPlus, Pencil, Printer, CheckCircle, FileCheck, ChevronDown, ChevronUp, AlertCircle, Download, Pill, Cigarette, Baby, User as UserIcon, MapPin, Briefcase, Users, CreditCard, Stethoscope, Mail, Clock, FileText, Grid, List, ClipboardList, DollarSign, StickyNote, PenLine, DownloadCloud, Archive, FileImage, FileUp, FileSignature, ShieldCheck, Lock, Megaphone, BellOff, Radio } from 'lucide-react';
import { Patient, Appointment, User, UserRole, DentalChartEntry, TreatmentStatus, FieldSettings, PerioMeasurement, AuditLogEntry, PatientFile, AppointmentStatus, LedgerEntry, Referral } from '../types';
import Fuse from 'fuse.js';
import Odontogram from './Odontogram';
import Odontonotes from './Odontonotes';
import TreatmentPlan from './TreatmentPlan';
import PerioChart from './PerioChart';
import PatientLedger from './PatientLedger';
import RadiologyRequestModal from './RadiologyRequestModal'; // NEW
import EPrescriptionModal from './EPrescriptionModal';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { getTrustedTime } from '../services/timeService';

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
  logAction: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string, previousState?: any, newState?: any) => void;
  onPreparePhilHealthClaim?: (ledgerEntry: LedgerEntry, procedureName: string) => void;
  onCreateClaim?: (patientId: string, ledgerEntryId: string, provider: string, amount: number, type: 'HMO' | 'PhilHealth') => void;
}

const PatientList: React.FC<PatientListProps> = ({ 
    patients, appointments, currentUser, selectedPatientId, onSelectPatient, onAddPatient, onEditPatient,
    onQuickUpdatePatient, onBulkUpdatePatients, onDeletePatient, onBookAppointment, fieldSettings, logAction, onPreparePhilHealthClaim, onCreateClaim
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'info' | 'medical' | 'chart' | 'perio' | 'plan' | 'ledger' | 'documents'>('info'); 
  const [showNeedsPrintingOnly, setShowNeedsPrintingOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [chartViewMode, setChartViewMode] = useState<'visual' | 'notes'>('visual');
  const [isEPrescriptionModalOpen, setIsEPrescriptionModalOpen] = useState(false);
  const [isRadiologyModalOpen, setIsRadiologyModalOpen] = useState(false); // NEW
  const [editingTooth, setEditingTooth] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const enableCompliance = fieldSettings?.features?.enableComplianceAudit ?? true;
  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId) || null, [patients, selectedPatientId]);

  const handleRadiologySave = (referral: Referral) => {
      if (!selectedPatient) return;
      const updatedReferrals = [...(selectedPatient.referrals || []), referral];
      onQuickUpdatePatient({ ...selectedPatient, referrals: updatedReferrals });
      logAction('CREATE_REFERRAL', 'Referral', referral.id, `Issued radiology request to ${referral.referredTo}`);
  };

  const filteredPatients = useMemo(() => {
    let result = patients;
    if (!showArchived) {
        result = result.filter(p => !p.isArchived);
    }
    if (showNeedsPrintingOnly && enableCompliance) {
        result = result.filter(p => {
             if (!p.lastDigitalUpdate) return false; 
             if (!p.lastPrintedDate) return true; 
             return new Date(p.lastDigitalUpdate) > new Date(p.lastPrintedDate);
        });
    }
    if (searchTerm) {
        const fuse = new Fuse(result, { keys: ['name', 'firstName', 'surname', 'email', 'phone', 'insuranceProvider', 'id'], threshold: 0.3, distance: 100 });
        result = fuse.search(searchTerm).map(r => r.item);
    }
    return result;
  }, [patients, searchTerm, showNeedsPrintingOnly, showArchived, enableCompliance]);

  const isClinicalReadOnly = currentUser.role === UserRole.DENTAL_ASSISTANT;
  const canDelete = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DENTIST;
  const isAdmin = currentUser.role === UserRole.ADMIN;

  const handleSignOffToday = async () => {
      if (!selectedPatient) return;
      const today = new Date().toISOString().split('T')[0];
      const todayEntries = selectedPatient.dentalChart?.filter(e => e.date === today && !e.isLocked) || [];
      if (todayEntries.length === 0) {
          toast.info("No unsigned clinical entries found for today.");
          return;
      }
      if (window.confirm(`Are you sure you want to digitally sign off on today's clinical notes? This will lock ${todayEntries.length} entries.`)) {
          const { timestamp } = await getTrustedTime();
          const updatedChart = selectedPatient.dentalChart?.map(e => {
              if (e.date === today && !e.isLocked) {
                  return { ...e, isLocked: true, lockedInfo: { by: currentUser.name, at: timestamp } };
              }
              return e;
          });
          onQuickUpdatePatient({ ...selectedPatient, dentalChart: updatedChart });
          logAction('SIGN_OFF_RECORD', 'ClinicalNote', selectedPatient.id, `Digitally signed off on today's notes.`);
          toast.success("Record sealed and signed off.");
      }
  };

  const handleQuickUpdateChart = (entry: DentalChartEntry) => {
      if (!selectedPatient || isClinicalReadOnly) return;
      const updatedChart = selectedPatient.dentalChart?.map(e => e.id === entry.id ? entry : e);
      onQuickUpdatePatient({ ...selectedPatient, dentalChart: updatedChart });
  };

  const handleAddChartEntry = async (newEntry: DentalChartEntry) => {
      if (!selectedPatient || isClinicalReadOnly) return;
      const { timestamp, isVerified } = await getTrustedTime();
      const entryWithTime = {
          ...newEntry,
          timestamp,
          isVerifiedTimestamp: isVerified,
          date: newEntry.date || timestamp.split('T')[0]
      };
      const updatedChart = [...(selectedPatient.dentalChart || []), entryWithTime];
      
      // Auto-Ledger Logic
      let updatedLedger = selectedPatient.ledger || [];
      let newBalance = selectedPatient.currentBalance || 0;
      if (entryWithTime.price && entryWithTime.price > 0) {
          newBalance += entryWithTime.price;
          updatedLedger = [...updatedLedger, { id: Math.random().toString(36).substr(2, 9), date: entryWithTime.date, description: `${entryWithTime.procedure} (Charge)`, type: 'Charge', amount: entryWithTime.price, balanceAfter: newBalance, notes: entryWithTime.notes }];
      }
      
      onQuickUpdatePatient({ ...selectedPatient, dentalChart: updatedChart, ledger: updatedLedger, currentBalance: newBalance, lastDigitalUpdate: timestamp });
      toast.success("Entry saved with trusted timestamp");
  };

  const toggleMarketingConsent = async () => {
      if (!selectedPatient) return;
      const newVal = !selectedPatient.marketingConsent;
      onQuickUpdatePatient({ ...selectedPatient, marketingConsent: newVal });
      logAction('UPDATE', 'Patient', selectedPatient.id, `Marketing Consent ${newVal ? 'GRANTED' : 'REVOKED'}.`);
  };

  const InfoRow = ({ icon: Icon, label, value, subValue }: { icon: any, label: string, value?: string | number, subValue?: string }) => (
      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm shrink-0"><Icon size={16} className="text-teal-600" /></div>
          <div><div className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</div><div className="font-semibold text-slate-800 text-sm">{value || '-'}</div>{subValue && <div className="text-xs text-slate-500">{subValue}</div>}</div>
      </div>
  );

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className={`flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col ${selectedPatientId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center gap-2">
          <div className="flex-1"><h2 className="text-xl font-bold text-slate-800">Patients</h2></div>
          <button onClick={onAddPatient} className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium shadow-sm"><UserPlus size={18} /> <span className="hidden sm:inline">New</span></button>
        </div>
        <div className="p-4 pt-2 space-y-2">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div>
            <div className="grid grid-cols-2 gap-2">
                {enableCompliance && (<button onClick={() => setShowNeedsPrintingOnly(!showNeedsPrintingOnly)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold border transition-all ${showNeedsPrintingOnly ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}><div className="flex items-center gap-2"><Printer size={16} /> Needs Printing</div>{showNeedsPrintingOnly && <CheckCircle size={16} />}</button>)}
                 {(isAdmin || currentUser.role === UserRole.DENTIST) && (<button onClick={() => setShowArchived(!showArchived)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold border transition-all ${showArchived ? 'bg-slate-200 border-slate-300 text-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}><div className="flex items-center gap-2"><Archive size={16} /> Show Archived</div>{showArchived && <CheckCircle size={16} />}</button>)}
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredPatients.length === 0 ? (<div className="text-center py-8 text-slate-400"><p>No patients found.</p></div>) : (filteredPatients.map(p => (
              <button key={p.id} onClick={() => onSelectPatient(p.id)} className={`w-full text-left p-4 hover:bg-slate-50 rounded-xl transition-all group flex items-center justify-between border border-transparent hover:border-slate-100 ${selectedPatientId === p.id ? 'bg-teal-50 border-teal-100' : ''} ${p.isArchived ? 'opacity-60 bg-slate-100' : ''}`}><div className="flex-1 min-w-0 pr-2"><div className="flex items-center gap-2"><h3 className={`font-semibold truncate ${selectedPatientId === p.id ? 'text-teal-800' : 'text-slate-800 group-hover:text-teal-700'}`}>{p.name}</h3>{(p.seriousIllness || p.underMedicalTreatment) && <AlertTriangle size={14} className="text-red-500 fill-red-100 shrink-0" />}</div><div className="flex items-center gap-3 text-sm text-slate-500 mt-1"><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 flex items-center gap-1"><Hash size={10} className="text-slate-400"/> {p.id}</span>{p.currentBalance && p.currentBalance > 0 ? (<span className="flex items-center gap-1 text-red-600 font-bold text-xs"><DollarSign size={10} /> Bal: ₱{p.currentBalance.toLocaleString()}</span>) : (<span className="flex items-center gap-1"><Phone size={10} className="text-slate-400"/> {p.phone}</span>)}</div></div><ChevronRight size={18} className={`text-slate-300 group-hover:text-teal-500 ${selectedPatientId === p.id ? 'text-teal-500' : ''}`} /></button>
          )))}
        </div>
      </div>

      {selectedPatient ? (
        <div className="flex-[2] bg-white rounded-2xl shadow-sm border border-slate-100 p-0 relative animate-in slide-in-from-right-10 duration-300 overflow-hidden flex flex-col">
           <div className={`pt-6 px-6 pb-6 border-b sticky top-0 z-10 transition-colors duration-300 ${selectedPatient.seriousIllness ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
                <button onClick={() => onSelectPatient(null)} className={`md:hidden absolute top-4 right-4 p-2 rounded-full transition-colors bg-slate-100 text-slate-600`}><X size={20} /></button>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <div><h2 className="text-3xl font-bold">{selectedPatient.name}</h2><div className="flex gap-2 mt-1">{selectedPatient.suffix && <span className="text-sm font-semibold opacity-70">{selectedPatient.suffix}</span>}<span className="text-sm font-semibold opacity-70">({selectedPatient.sex}, {selectedPatient.age} yrs)</span></div></div>
                        <div className="flex flex-col items-end gap-1">
                            {selectedPatient.isArchived && <div className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-300">ARCHIVED RECORD</div>}
                            <button onClick={toggleMarketingConsent} className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border transition-all hover:scale-105 ${selectedPatient.marketingConsent ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{selectedPatient.marketingConsent ? <Megaphone size={10}/> : <BellOff size={10}/>}{selectedPatient.marketingConsent ? 'MARKETING ACTIVE' : 'NO MARKETING'}</button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-6 text-base font-semibold mt-2 text-slate-500"><span className="flex items-center gap-2"><Hash size={16} strokeWidth={2.5}/> {selectedPatient.id}</span><span className="flex items-center gap-2"><Phone size={16} strokeWidth={2.5}/> {selectedPatient.phone}</span>{(selectedPatient.currentBalance || 0) > 0 && (<span className="flex items-center gap-2 text-red-700 bg-red-100 px-2 rounded"><DollarSign size={16} strokeWidth={2.5}/> Due: ₱{selectedPatient.currentBalance?.toLocaleString()}</span>)}</div>
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                        <a href={`tel:${selectedPatient.phone}`} className="p-3 rounded-xl font-medium flex items-center justify-center transition-colors bg-slate-100 hover:bg-slate-200 text-slate-700" title="Call"><Phone size={20} /></a>
                        <button onClick={() => onBookAppointment(selectedPatient.id)} className="p-3 rounded-xl font-medium flex items-center justify-center transition-colors bg-lilac-100 hover:bg-lilac-200 text-lilac-700" title="Book"><CalendarPlus size={20} /></button>
                        <button onClick={() => onEditPatient(selectedPatient)} className="p-3 rounded-xl font-medium flex items-center justify-center transition-colors bg-slate-100 hover:bg-slate-200 text-slate-700" title="Edit"><Pencil size={20} /></button>
                        {canDelete && !selectedPatient.isArchived && (<button onClick={() => onDeletePatient(selectedPatient.id)} className="p-3 rounded-xl font-medium bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 ml-auto" title="Archive"><Archive size={20} /></button>)}
                    </div>
                </div>
           </div>
           <div className="bg-white px-6 border-b border-slate-200 flex gap-6 shrink-0 z-0 overflow-x-auto">{['info', 'medical', 'chart', 'perio', 'plan', 'ledger', 'documents'].map(t => (<button key={t} onClick={() => setActiveTab(t as any)} className={`py-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap capitalize ${activeTab === t ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{t === 'perio' ? 'Perio Chart' : t === 'plan' ? 'Treatment Plan' : t}</button>))}</div>
           <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
                {activeTab === 'chart' && (
                     <div className="space-y-6">
                         <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-800 text-lg">Clinical Records</h4>
                            {(currentUser.role === UserRole.DENTIST || currentUser.role === UserRole.ADMIN) && (
                                <button onClick={handleSignOffToday} className="px-4 py-2 bg-lilac-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg hover:bg-lilac-700 transition-all"><ShieldCheck size={16}/> Sign-Off Today</button>
                            )}
                         </div>
                         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><Odontonotes entries={selectedPatient.dentalChart || []} onAddEntry={handleAddChartEntry} onUpdateEntry={handleQuickUpdateChart} currentUser={currentUser.name} readOnly={isClinicalReadOnly} procedures={fieldSettings?.procedures || []}/></div>
                     </div>
                )}
                {activeTab === 'info' && (<section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><UserIcon size={18} className="text-teal-600"/> Personal Demographics</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><InfoRow icon={UserIcon} label="Full Name" value={selectedPatient.name} /><InfoRow icon={Baby} label="Date of Birth" value={formatDate(selectedPatient.dob)} subValue={`${selectedPatient.age} years old`} /><InfoRow icon={Users} label="Sex" value={selectedPatient.sex} /><InfoRow icon={Briefcase} label="Occupation" value={selectedPatient.occupation} /></div></section>)}
                {activeTab === 'ledger' && (<PatientLedger patient={selectedPatient} onUpdatePatient={onQuickUpdatePatient} readOnly={isClinicalReadOnly && !currentUser.canViewFinancials} fieldSettings={fieldSettings} />)}
                {activeTab === 'documents' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-full mb-2">
                            <h4 className="font-bold text-slate-700 text-sm uppercase tracking-widest flex items-center gap-2"><ClipboardList size={16} className="text-teal-600"/> Clinical Diagnostics & Referrals</h4>
                        </div>
                        <button onClick={() => setIsRadiologyModalOpen(true)} className="p-6 bg-white border-2 border-slate-100 rounded-2xl flex items-center gap-4 hover:border-teal-500 hover:shadow-xl transition-all group">
                            <div className="bg-teal-50 p-4 rounded-xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors"><Radio size={28}/></div>
                            <div className="text-left">
                                <h4 className="font-bold text-slate-800">Issue Radiology Request</h4>
                                <p className="text-xs text-slate-500">Auto-link to external request log.</p>
                            </div>
                        </button>
                        <button onClick={() => setIsEPrescriptionModalOpen(true)} className="p-6 bg-white border-2 border-slate-100 rounded-2xl flex items-center gap-4 hover:border-teal-500 hover:shadow-xl transition-all group">
                            <div className="bg-lilac-50 p-4 rounded-xl text-lilac-600 group-hover:bg-lilac-600 group-hover:text-white transition-colors"><Pill size={28}/></div>
                            <div className="text-left">
                                <h4 className="font-bold text-slate-800">Create e-Prescription</h4>
                                <p className="text-xs text-slate-500">Generate S2-compliant PDF.</p>
                            </div>
                        </button>
                        
                        {/* LIST OF ACTIVE REFERRALS */}
                        <div className="col-span-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                             <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Requests</div>
                             <div className="divide-y divide-slate-100">
                                {selectedPatient.referrals?.length ? selectedPatient.referrals.map(ref => (
                                    <div key={ref.id} className="p-4 flex justify-between items-center">
                                        <div><div className="font-bold text-slate-800">{ref.reason.split(':')[0]}</div><div className="text-xs text-slate-500">Center: {ref.referredTo} • {formatDate(ref.date)}</div></div>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ref.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{ref.status}</span>
                                    </div>
                                )) : <div className="p-8 text-center text-slate-400 italic text-sm">No external diagnostic requests recorded.</div>}
                             </div>
                        </div>
                    </div>
                )}
                {activeTab === 'perio' && (<PerioChart data={selectedPatient.perioChart || []} onSave={(d) => onQuickUpdatePatient({...selectedPatient, perioChart: d})} readOnly={isClinicalReadOnly}/>)}
                {activeTab === 'plan' && (<TreatmentPlan patient={selectedPatient} onUpdatePatient={onQuickUpdatePatient} currentUser={currentUser} logAction={logAction} featureFlags={fieldSettings?.features}/>)}
           </div>
        </div>
      ) : (<div className="hidden md:flex flex-[2] items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl"><div className="text-center text-slate-400"><Shield size={48} className="mx-auto mb-2 opacity-20" /><p className="font-medium">Select a patient to view full medical record</p></div></div>)}
      
      {isEPrescriptionModalOpen && selectedPatient && (
          <EPrescriptionModal isOpen={isEPrescriptionModalOpen} onClose={() => setIsEPrescriptionModalOpen(false)} patient={selectedPatient} fieldSettings={fieldSettings || { medications: [] } as any} currentUser={currentUser} />
      )}
      
      {isRadiologyModalOpen && selectedPatient && (
          <RadiologyRequestModal isOpen={isRadiologyModalOpen} onClose={() => setIsRadiologyModalOpen(false)} patient={selectedPatient} fieldSettings={fieldSettings || {} as any} onSave={handleRadiologySave} />
      )}
    </div>
  );
};

export default PatientList;

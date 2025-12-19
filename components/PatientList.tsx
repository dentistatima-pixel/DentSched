
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Phone, MessageSquare, ChevronRight, X, UserPlus, AlertTriangle, Shield, Heart, Activity, Hash, Plus, Trash2, CalendarPlus, Pencil, Printer, CheckCircle, FileCheck, ChevronDown, ChevronUp, AlertCircle, Download, Pill, Cigarette, Baby, User as UserIcon, MapPin, Briefcase, Users, CreditCard, Stethoscope, Mail, Clock, FileText, Grid, List, ClipboardList, DollarSign, StickyNote, PenLine, DownloadCloud, Archive, FileImage, FileUp, FileSignature, ShieldCheck, Lock, Megaphone, BellOff, ArrowRightLeft, Sliders, Sun, Contrast, Save, HeartPulse, ExternalLink, Star, Timeline } from 'lucide-react';
import { Patient, Appointment, User, UserRole, DentalChartEntry, TreatmentStatus, FieldSettings, PerioMeasurement, AuditLogEntry, PatientFile, AppointmentStatus, LedgerEntry, ClinicalProtocolRule, ClearanceRequest, TreatmentPlanStatus } from '../types';
import Odontogram from './Odontogram';
import Odontonotes from './Odontonotes';
import TreatmentPlan from './TreatmentPlan';
import PerioChart from './PerioChart';
import PatientLedger from './PatientLedger';
import PhilHealthCF4Generator from './PhilHealthCF4Generator'; // NEW
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
}

const PatientList: React.FC<PatientListProps> = ({ 
    patients, appointments, currentUser, selectedPatientId, onSelectPatient, onAddPatient, onEditPatient,
    onQuickUpdatePatient, onBulkUpdatePatients, onDeletePatient, onBookAppointment, fieldSettings, logAction
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'info' | 'medical' | 'chart' | 'perio' | 'plan' | 'ledger' | 'documents' | 'imaging'>('info'); 
  const [planViewMode, setPlanViewMode] = useState<'list' | 'timeline'>('list');

  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId) || null, [patients, selectedPatientId]);

  const referrals = useMemo(() => {
      if (!selectedPatient) return [];
      return patients.filter(p => p.referredById === selectedPatient.id);
  }, [patients, selectedPatient]);

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* Registry ... (Unchanged) */}
      <div className={`flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col ${selectedPatientId ? 'hidden md:flex' : 'flex'}`}>
          {/* Patient Search and List UI... (Locked) */}
      </div>

      {selectedPatient ? (
        <div className="flex-[2.5] bg-white rounded-2xl shadow-sm border border-slate-100 p-0 relative animate-in slide-in-from-right-10 duration-300 overflow-hidden flex flex-col">
           {/* Header ... (Locked) */}
           <div className="pt-6 px-6 pb-6 border-b bg-white">
                <div className="flex justify-between items-start">
                    <div><h2 className="text-3xl font-bold text-slate-900">{selectedPatient.name}</h2><div className="text-sm font-bold text-slate-400 uppercase mt-1">ID: {selectedPatient.id}</div></div>
                    <div className="flex gap-2">
                        {referrals.length > 0 && <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-3 py-1 rounded-full border border-teal-200 flex items-center gap-1 shadow-sm"><Star size={12} fill="currentColor"/> {referrals.length} REFERRALS</span>}
                        {/* NEW: CF-4 GENERATOR INTEGRATION */}
                        {fieldSettings?.features.enablePhilHealthClaims && (
                            <PhilHealthCF4Generator patient={selectedPatient} currentUser={currentUser} odontogram={selectedPatient.dentalChart || []} />
                        )}
                    </div>
                </div>
           </div>

           <div className="bg-white px-6 border-b border-slate-200 flex gap-6 shrink-0 z-0 overflow-x-auto no-scrollbar">
               {['info', 'medical', 'chart', 'imaging', 'perio', 'plan', 'ledger', 'documents'].map(t => (
                   <button key={t} onClick={() => setActiveTab(t as any)} className={`py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === t ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{t}</button>
               ))}
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Star size={18} className="text-teal-600"/> Loyalty & Practice Growth</h4>
                            {referrals.length > 0 ? (
                                <div className="space-y-3">
                                    <p className="text-xs text-slate-500 mb-2">Patients referred by {selectedPatient.firstName}:</p>
                                    {referrals.map(r => (
                                        <div key={r.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="font-bold text-slate-700 text-sm">{r.name}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{formatDate(r.lastVisit)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="p-6 text-center text-slate-400 italic text-sm">No referrals tracked for this patient.</div>}
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
                {/* Other tabs... (Locked) */}
                {activeTab === 'ledger' && (
                    <PatientLedger patient={selectedPatient} onUpdatePatient={onQuickUpdatePatient} fieldSettings={fieldSettings} />
                )}
           </div>
        </div>
      ) : <div className="hidden md:flex flex-[2.5] items-center justify-center">Select Patient Registry Record</div>}
    </div>
  );
};

export default PatientList;


import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, TrendingUp, Search, UserPlus, ChevronRight, CalendarPlus, ClipboardList, Beaker, Repeat, ArrowRight, HeartPulse, PieChart, Activity, DollarSign, FileText, StickyNote, Package, Sunrise, AlertCircle, Plus, CheckCircle, Circle, Trash2, Flag, User as UserIcon, Building2, MapPin, Inbox, FileSignature, Video, ShieldAlert, Radio, Clock } from 'lucide-react';
import { Appointment, AppointmentStatus, User, UserRole, Patient, LabStatus, FieldSettings, PinboardTask, TreatmentPlanStatus, TelehealthRequest } from '../types';
import Fuse from 'fuse.js';
import ConsentCaptureModal from './ConsentCaptureModal';
import ClinicalSafetyModal from './ClinicalSafetyModal'; 
import TelehealthModal from './TelehealthModal';
import { MOCK_TELEHEALTH_REQUESTS } from '../constants';
import { useToast } from './ToastSystem';
import { getTrustedTime } from '../services/timeService';

interface DashboardProps {
  appointments: Appointment[];
  allAppointments?: Appointment[];
  patientsCount: number;
  staffCount: number;
  staff?: User[];
  currentUser: User;
  patients: Patient[];
  onAddPatient: () => void;
  onPatientSelect: (patientId: string) => void;
  onBookAppointment: (patientId?: string) => void;
  onUpdateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onCompleteRegistration: (patientId: string) => void;
  fieldSettings?: FieldSettings;
  onViewAllSchedule?: () => void; 
  onChangeBranch?: (branch: string) => void;
  onPatientPortalToggle: () => void;
  tasks?: PinboardTask[];
  onAddTask?: (text: string, isUrgent: boolean, assignedTo: string) => void;
  onToggleTask?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
  onSaveConsent: (appointmentId: string, consentUrl: string) => void;
  onSaveTelehealthSummary?: (patientId: string, triage: string, notes: string) => void;
  logAction?: (action: any, entity: any, entityId: string, details: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  appointments, allAppointments = [], patientsCount, staffCount, staff, currentUser, patients, onAddPatient, onPatientSelect, onBookAppointment,
  onUpdateAppointmentStatus, onCompleteRegistration, fieldSettings, onViewAllSchedule, onChangeBranch, onPatientPortalToggle,
  tasks = [], onAddTask, onToggleTask, onDeleteTask, onSaveConsent, onSaveTelehealthSummary, logAction
}) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [openTrayId, setOpenTrayId] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskUrgent, setNewTaskUrgent] = useState(false);
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [consentModalApt, setConsentModalApt] = useState<Appointment | null>(null);
  const [safetyApt, setSafetyApt] = useState<{apt: Appointment, patient: Patient} | null>(null);
  const [activeTelehealth, setActiveTelehealth] = useState<{apt: Appointment, patient: Patient} | null>(null);
  const [timeDrift, setTimeDrift] = useState<number | null>(null); 

  const today = new Date().toLocaleDateString('en-CA');

  useEffect(() => {
      getTrustedTime().then(res => {
          if (res.isVerified && res.driftMs) setTimeDrift(res.driftMs);
      });
  }, []);

  const visibleAppointments = useMemo(() => appointments.filter(a => {
      if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DENTAL_ASSISTANT) return true;
      if (currentUser.role === UserRole.DENTIST) return a.providerId === currentUser.id;
      return false;
  }), [appointments, currentUser]);

  const todaysAppointments = visibleAppointments.filter(a => a.date === today && !a.isBlock);

  const radiologyReferrals = useMemo(() => {
      return patients.filter(p => p.referrals?.some(r => r.reason.toLowerCase().includes('x-ray') || r.reason.toLowerCase().includes('radiology'))).slice(0, 3);
  }, [patients]);

  const recallList = useMemo(() => {
      return patients
          .filter(p => !p.nextVisit && !p.isArchived)
          .map(p => {
              const lastCompleted = p.dentalChart
                  ?.filter(e => e.status === 'Completed')
                  .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())[0];
              const months = fieldSettings?.procedures.find(pr => pr.name === lastCompleted?.procedure)?.recallMonths || 6;
              const baseDate = lastCompleted ? new Date(lastCompleted.date || '') : new Date(p.lastVisit);
              const dueDate = new Date(baseDate);
              dueDate.setMonth(dueDate.getMonth() + months);
              const diffDays = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return { patient: p, dueDays: diffDays, isOverdue: diffDays <= 0, priority: diffDays <= 7 ? 'High' : 'Normal' };
          })
          .filter(item => item.dueDays <= 30)
          .sort((a, b) => a.dueDays - b.dueDays);
  }, [patients, fieldSettings]);

  const needsAttention = useMemo(() => {
      const issues = [];
      if (timeDrift && timeDrift > 300000) issues.push({ id: 'timedrift', label: `System Clock Drifted: ${Math.round(timeDrift/60000)}m`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' });
      const unsigned = todaysAppointments.filter(a => fieldSettings?.procedures.find(p => p.name === a.type)?.requiresConsent && !a.signedConsentUrl);
      if (unsigned.length > 0) issues.push({ id: 'consents', label: `${unsigned.length} Unsigned Consents`, icon: FileSignature, color: 'text-orange-600', bg: 'bg-orange-50' });
      const lowStock = fieldSettings?.stockItems?.filter(s => s.quantity <= s.lowStockThreshold) || [];
      if (lowStock.length > 0) issues.push({ id: 'stock', label: `${lowStock.length} Items Low on Stock`, icon: Package, color: 'text-red-600', bg: 'bg-red-50' });
      return issues;
  }, [todaysAppointments, fieldSettings, timeDrift]);

  const handleStatusChange = (aptId: string, status: AppointmentStatus) => {
      const apt = appointments.find(a => a.id === aptId);
      const patient = patients.find(p => p.id === apt?.patientId);
      if (apt && patient && (status === AppointmentStatus.TREATING)) {
          if (apt.type === 'Tele-dentistry Consultation') {
              setActiveTelehealth({ apt, patient });
              return;
          }
          const isSurgery = ['Surgery', 'Extraction', 'Implant'].includes(apt.type);
          if (isSurgery && patient.medicalConditions?.some(c => ['Diabetes', 'Heart Disease', 'High BP'].includes(c)) && !patient.files?.some(f => f.category === 'Medical Clearance')) {
              setSafetyApt({ apt, patient });
              return;
          }
      }
      onUpdateAppointmentStatus(aptId, status);
  };

  const handleSafetyProceed = (justification?: string) => {
      if (safetyApt) {
          if (justification && logAction) logAction('OVERRIDE_ALERT', 'ClinicalAlert', safetyApt.apt.id, `Clinical Override: ${justification}`);
          onUpdateAppointmentStatus(safetyApt.apt.id, AppointmentStatus.TREATING);
          setSafetyApt(null);
      }
  };

  const handleTelehealthEnd = (triage: string, notes: string) => {
      if (activeTelehealth) {
          onSaveTelehealthSummary?.(activeTelehealth.patient.id, triage, notes);
          onUpdateAppointmentStatus(activeTelehealth.apt.id, AppointmentStatus.COMPLETED);
          setActiveTelehealth(null);
      }
  };

  const handleAddTaskSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newTaskText.trim() || !onAddTask) return;
      onAddTask(newTaskText, newTaskUrgent, newTaskAssignee);
      setNewTaskText(''); setNewTaskUrgent(false); setNewTaskAssignee('');
  };

  const getPatient = (id: string) => patients.find(pt => pt.id === id);
  const getTrayItems = (type: string) => ['Mirror', 'Explorer', 'Probe', 'Bib'];
  const isCritical = (p?: Patient) => p && (p.seriousIllness || (p.allergies?.length && !p.allergies.includes('None')) || (p.medicalConditions?.length && !p.medicalConditions.includes('None')));

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    const fuse = new Fuse(patients, { keys: ['name', 'phone'], threshold: 0.3 });
    return fuse.search(searchTerm).map(result => result.item).slice(0, 5);
  }, [patients, searchTerm]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      <header className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="text" placeholder="Search patients..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm font-medium transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                {searchTerm && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                        {searchResults.length > 0 ? searchResults.map(p => (
                            <button key={p.id} onClick={() => { onPatientSelect(p.id); setSearchTerm(''); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 flex justify-between">
                                <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                                <ChevronRight size={16} className="text-slate-300" />
                            </button>
                        )) : <div className="p-4 text-center text-sm text-slate-400">No patients found.</div>}
                    </div>
                )}
            </div>
            <div className="flex gap-2 shrink-0">
                <button onClick={() => onBookAppointment()} className="h-11 px-4 bg-lilac-100 hover:bg-lilac-200 text-lilac-700 rounded-xl flex items-center justify-center gap-2"><CalendarPlus size={20} /></button>
                <button onClick={onAddPatient} className="h-11 px-4 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-xl flex items-center justify-center gap-2"><UserPlus size={20} /></button>
            </div>
      </header>

      {needsAttention.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {needsAttention.map(issue => (
                      <div key={issue.id} className={`${issue.bg} p-4 rounded-xl border border-black/5 flex items-center gap-4`}>
                          <div className={`p-3 rounded-full bg-white shadow-sm ${issue.color}`}><issue.icon size={24} /></div>
                          <div><div className={`text-sm font-bold ${issue.color}`}>{issue.label}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Attention Required</div></div>
                      </div>
                  ))}
              </div>
          </div>
      )}
      
      <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-50"><h2 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Calendar className="text-teal-600" size={20}/> Today's Schedule</h2></div>
              <div className="divide-y divide-slate-50">
                  {todaysAppointments.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 italic">No appointments for today.</div>
                  ) : (
                      todaysAppointments.map(apt => {
                          const patient = getPatient(apt.patientId);
                          const hasMedicalAlert = isCritical(patient);
                          const isTele = apt.type === 'Tele-dentistry Consultation';
                          return (
                              <div key={apt.id} className={`p-3 group flex flex-col md:flex-row items-start gap-3 bg-white hover:bg-slate-50`}>
                                  <div className="flex-1 flex items-start gap-3">
                                      <div className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold font-mono mt-0.5 shrink-0">{apt.time}</div>
                                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                          <button onClick={() => onPatientSelect(apt.patientId)} className={`font-bold text-sm flex items-center gap-2 hover:underline ${hasMedicalAlert ? 'text-red-600' : 'text-slate-800'}`}>{patient?.name}{hasMedicalAlert && <HeartPulse size={14} className="text-red-500 animate-pulse" />}</button>
                                          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                              {isTele && <Video size={12} className="text-lilac-600"/>}
                                              <span>{apt.type}</span>
                                          </div>
                                      </div>
                                      <select value={apt.status} onChange={(e) => handleStatusChange(apt.id, e.target.value as AppointmentStatus)} className={`appearance-none text-[10px] font-bold px-3 py-1 rounded-full uppercase border cursor-pointer outline-none bg-white`}>{Object.values(AppointmentStatus).map(s => <option key={s} value={s}>{s}</option>)}</select>
                                  </div>
                              </div>
                          );
                      })
                  )}
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[350px]">
                    <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Repeat className="text-purple-500" size={18} /> Recall Engine</h3></div>
                    <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                        <div className="space-y-2">
                            {recallList.length > 0 ? recallList.map(item => (
                                <div key={item.patient.id} onClick={() => onPatientSelect(item.patient.id)} className={`flex justify-between items-center text-sm p-3 border rounded-xl cursor-pointer group transition-all bg-slate-50 border-slate-100 hover:bg-purple-50`}>
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-700">{item.patient.name}</div>
                                        <div className={`text-[9px] font-bold uppercase ${item.dueDays <= 0 ? 'text-red-600' : 'text-slate-400'}`}>{item.dueDays <= 0 ? 'DUE NOW' : `In ${item.dueDays} days`}</div>
                                    </div>
                                    <ArrowRight size={12} className="text-purple-600"/>
                                </div>
                            )) : <div className="text-xs text-slate-400 italic text-center py-10">No intelligent recalls due.</div>}
                        </div>
                    </div>
              </div>

              <div className="bg-yellow-50 rounded-2xl shadow-sm border border-yellow-200 overflow-hidden flex flex-col h-[350px]">
                    <div className="px-4 py-3 border-b border-yellow-100 flex justify-between items-center"><h3 className="font-bold text-yellow-800 flex items-center gap-2 text-sm"><StickyNote size={16} /> Clinic Tasks</h3></div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">{tasks.map(task => (
                        <div key={task.id} className={`flex items-center gap-2 p-2 rounded-lg border bg-white border-yellow-100`}>
                            <button onClick={() => onToggleTask && onToggleTask(task.id)}>{task.isCompleted ? <CheckCircle size={18} className="text-yellow-600"/> : <Circle size={18} className="text-slate-300"/>}</button>
                            <div className={`text-sm leading-tight ${task.isCompleted ? 'line-through text-yellow-800/50' : 'text-yellow-900 font-medium'}`}>{task.text}</div>
                        </div>
                    ))}</div>
                    <div className="p-3 bg-yellow-100/50 border-t border-yellow-200"><form onSubmit={handleAddTaskSubmit} className="flex gap-2 items-center"><input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="New task..." className="flex-1 px-3 py-2 bg-white border border-yellow-200 rounded-lg text-sm"/><button type="submit" className="p-2 bg-yellow-500 text-white rounded-lg"><Plus size={18} /></button></form></div>
              </div>
          </div>
      </div>

      {consentModalApt && (
          <ConsentCaptureModal
              isOpen={!!consentModalApt}
              onClose={() => setConsentModalApt(null)}
              onSave={(url) => { onSaveConsent(consentModalApt.id, url); setConsentModalApt(null); }}
              patient={getPatient(consentModalApt.patientId)!}
              appointment={consentModalApt}
              provider={staff?.find(s => s.id === consentModalApt.providerId)}
              template={fieldSettings?.consentFormTemplates?.[0]!}
          />
      )}

      {safetyApt && <ClinicalSafetyModal isOpen={!!safetyApt} patient={safetyApt.patient} appointment={safetyApt.apt} onCancel={() => setSafetyApt(null)} onProceed={handleSafetyProceed} />}

      {activeTelehealth && (
          <TelehealthModal 
            appointment={activeTelehealth.apt} 
            patient={activeTelehealth.patient} 
            doctor={currentUser} 
            onClose={(triage, notes) => handleTelehealthEnd(triage || 'Elective', notes || '')} 
          />
      )}
    </div>
  );
};

export default Dashboard;

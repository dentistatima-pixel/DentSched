
import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, Search, UserPlus, ChevronRight, CalendarPlus, ClipboardList, Beaker, Repeat, ArrowRight, HeartPulse, PieChart, Activity, DollarSign, FileText, StickyNote, Package, Sunrise, AlertCircle, Plus, CheckCircle, Circle, Trash2, Flag, User as UserIcon, Building2, MapPin, Inbox, FileSignature, Video, ShieldAlert } from 'lucide-react';
import { Appointment, AppointmentStatus, User, UserRole, Patient, LabStatus, FieldSettings, PinboardTask, TreatmentPlanStatus, TelehealthRequest } from '../types';
import Fuse from 'fuse.js';
import ConsentCaptureModal from './ConsentCaptureModal';
import { MOCK_TELEHEALTH_REQUESTS } from '../constants';

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
}

const Dashboard: React.FC<DashboardProps> = ({ 
  appointments, allAppointments = [], patientsCount, staffCount, staff, currentUser, patients, onAddPatient, onPatientSelect, onBookAppointment,
  onUpdateAppointmentStatus, onCompleteRegistration, fieldSettings, onViewAllSchedule, onChangeBranch, onPatientPortalToggle,
  tasks = [], onAddTask, onToggleTask, onDeleteTask, onSaveConsent
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openTrayId, setOpenTrayId] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskUrgent, setNewTaskUrgent] = useState(false);
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [consentModalApt, setConsentModalApt] = useState<Appointment | null>(null);
  const [telehealthRequests] = useState<TelehealthRequest[]>(MOCK_TELEHEALTH_REQUESTS);

  const today = new Date().toLocaleDateString('en-CA');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString('en-CA');

  const visibleAppointments = useMemo(() => appointments.filter(a => {
      if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DENTAL_ASSISTANT) return true;
      if (currentUser.role === UserRole.DENTIST) return a.providerId === currentUser.id;
      return false;
  }), [appointments, currentUser]);

  const todaysAppointments = visibleAppointments.filter(a => a.date === today && !a.isBlock);

  // --- NEW: NEEDS ATTENTION LOGIC ---
  const needsAttention = useMemo(() => {
      const issues = [];
      
      // 1. Today's Unsigned Consents
      const unsigned = todaysAppointments.filter(a => {
          const proc = fieldSettings?.procedures.find(p => p.name === a.type);
          return proc?.requiresConsent && !a.signedConsentUrl;
      });
      if (unsigned.length > 0) issues.push({ id: 'consents', label: `${unsigned.length} Unsigned Consents`, icon: FileSignature, color: 'text-orange-600', bg: 'bg-orange-50' });

      // 2. Low Stock Items
      const lowStock = fieldSettings?.stockItems?.filter(s => s.quantity <= s.lowStockThreshold) || [];
      if (lowStock.length > 0) issues.push({ id: 'stock', label: `${lowStock.length} Items Low on Stock`, icon: Package, color: 'text-red-600', bg: 'bg-red-50' });

      // 3. Lab Cases for next 3 days not received
      const threeDays = new Date(); threeDays.setDate(threeDays.getDate() + 3);
      const pendingLabs = visibleAppointments.filter(a => a.labStatus === LabStatus.PENDING && new Date(a.date) <= threeDays);
      if (pendingLabs.length > 0) issues.push({ id: 'labs', label: `${pendingLabs.length} Pending Lab Cases`, icon: Beaker, color: 'text-blue-600', bg: 'bg-blue-50' });

      // 4. Treatment Plans for Review (Admin only)
      if (currentUser.role === UserRole.ADMIN) {
          let count = 0;
          patients.forEach(p => p.treatmentPlans?.forEach(tp => { if(tp.status === TreatmentPlanStatus.PENDING_REVIEW) count++; }));
          if (count > 0) issues.push({ id: 'plans', label: `${count} Plans for Review`, icon: ShieldAlert, color: 'text-lilac-600', bg: 'bg-lilac-50' });
      }

      return issues;
  }, [todaysAppointments, fieldSettings, visibleAppointments, currentUser.role, patients]);

  const handleAddTaskSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newTaskText.trim() || !onAddTask) return;
      onAddTask(newTaskText, newTaskUrgent, newTaskAssignee);
      setNewTaskText(''); setNewTaskUrgent(false); setNewTaskAssignee('');
  };

  const sortedTasks = useMemo(() => {
      return [...tasks].sort((a, b) => {
          if (a.isCompleted === b.isCompleted) {
              if (!a.isCompleted) return (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0);
              return parseInt(b.id) - parseInt(a.id);
          }
          return a.isCompleted ? 1 : -1;
      });
  }, [tasks]);

  const tomorrowStats = useMemo(() => {
      const apts = visibleAppointments.filter(a => a.date === tomorrowStr);
      return {
          total: apts.length,
          newPatients: apts.filter(a => {
              const p = patients.find(pt => pt.id === a.patientId);
              return p?.provisional || (p?.lastVisit === 'First Visit');
          }).length,
          surgeries: apts.filter(a => ['Surgery', 'Implant', 'Extraction', 'Root Canal'].includes(a.type)).length
      };
  }, [visibleAppointments, patients, tomorrowStr]);

  const incomingLabCases = useMemo(() => {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      return visibleAppointments.filter(a => {
          if (a.labStatus !== LabStatus.PENDING) return false;
          const d = new Date(a.date);
          const todayDate = new Date();
          return d > todayDate && d <= threeDaysFromNow;
      }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [visibleAppointments]);

  const recallList = useMemo(() => {
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return patients.filter(p => {
        if (!p.lastVisit) return false;
        const d = new Date(p.lastVisit);
        return !isNaN(d.getTime()) && d < sixMonthsAgo && !p.nextVisit;
    }).slice(0, 5);
  }, [patients]);

  const getPatient = (id: string) => patients.find(pt => pt.id === id);
  const getTrayItems = (type: string) => {
      const trays: Record<string, string[]> = {
          'Consultation': ['Mirror', 'Explorer', 'Probe', 'Bib', 'Mask'],
          'Restoration': ['High Speed', 'Bur Block', 'Etch', 'Bond', 'Composite', 'Curing Light'],
          'Extraction': ['Topical', 'Lidocaine', 'Elevators', 'Forceps', 'Gauze'],
          'Root Canal': ['Rubber Dam', 'Files', 'Motor', 'Apex Locator', 'Irrigation'],
          'Oral Prophylaxis': ['Scaler', 'Polishing Cup', 'Paste', 'Floss'],
      };
      return trays[type] || trays['Consultation'];
  };

  const isCritical = (p?: Patient) => p && (p.seriousIllness || p.underMedicalTreatment || (p.allergies?.length && !p.allergies.includes('None')) || (p.medicalConditions?.length && !p.medicalConditions.includes('None')));

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
                <input 
                    type="text" 
                    placeholder="Search patients, treatments, or notes..." 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm font-medium transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                        {searchResults.length > 0 ? (
                            searchResults.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => { onPatientSelect(p.id); setSearchTerm(''); }}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 flex justify-between"
                                >
                                    <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                                    <ChevronRight size={16} className="text-slate-300" />
                                </button>
                            ))
                        ) : <div className="p-4 text-center text-sm text-slate-400">No patients found.</div>}
                    </div>
                )}
            </div>
            <div className="flex gap-2 shrink-0">
                 <button onClick={() => onBookAppointment()} className="h-11 px-4 bg-lilac-100 hover:bg-lilac-200 text-lilac-700 rounded-xl flex items-center justify-center gap-2 transition-colors" title="Book Appointment">
                    <CalendarPlus size={20} /> <span className="hidden md:inline font-bold text-sm">Book</span>
                </button>
                <button onClick={onAddPatient} className="h-11 px-4 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-xl flex items-center justify-center gap-2 transition-colors" title="Add Patient">
                    <UserPlus size={20} /> <span className="hidden md:inline font-bold text-sm">Add Patient</span>
                </button>
            </div>
      </header>

      {/* --- NEW: ACTION-ORIENTED DASHBOARD WIDGET --- */}
      {needsAttention.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
                  <Activity size={18} className="text-teal-600" />
                  <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wider">Operational Awareness</h3>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {needsAttention.map(issue => (
                      <div key={issue.id} className={`${issue.bg} p-4 rounded-xl border border-black/5 flex items-center gap-4 animate-in fade-in zoom-in-95`}>
                          <div className={`p-3 rounded-full bg-white shadow-sm ${issue.color}`}>
                              <issue.icon size={24} />
                          </div>
                          <div>
                              <div className={`text-sm font-bold ${issue.color}`}>{issue.label}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Attention Required</div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
      
      <div className="space-y-6">
          {telehealthRequests.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-blue-200 overflow-hidden">
                  <div className="flex justify-between items-center px-6 py-3 border-b border-blue-100 bg-blue-50">
                      <h2 className="font-bold text-blue-800 text-sm flex items-center gap-2">
                          <Video className="text-blue-600" size={16}/> Tele-dentistry Inbox
                      </h2>
                      <span className="text-[10px] font-bold text-blue-600 uppercase bg-white border border-blue-200 px-2 py-0.5 rounded-full">{telehealthRequests.length} Pending</span>
                  </div>
                  <div className="divide-y divide-blue-50">
                      {telehealthRequests.map(req => (
                          <div key={req.id} className="p-3 flex justify-between items-center">
                              <div>
                                  <div className="font-bold text-sm text-slate-800">{req.patientName}</div>
                                  <div className="text-xs text-slate-500 italic">"{req.chiefComplaint}"</div>
                              </div>
                              <button onClick={() => onBookAppointment(req.patientId)} className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200">Schedule Call</button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* TODAY'S SCHEDULE */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-50">
                  <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Calendar className="text-teal-600" size={20}/> Today's Schedule</h2>
                  <button onClick={onViewAllSchedule} className="text-teal-600 text-xs font-bold uppercase tracking-wide hover:underline">View Calendar</button>
              </div>
              <div className="divide-y divide-slate-50">
                  {todaysAppointments.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 italic">No appointments for today.</div>
                  ) : (
                      todaysAppointments.map(apt => {
                          const patient = getPatient(apt.patientId);
                          const hasMedicalAlert = isCritical(patient);
                          const procDef = fieldSettings?.procedures.find(p => p.name === apt.type);
                          const rowClass = apt.status === AppointmentStatus.ARRIVED ? 'bg-orange-50/60 border-l-4 border-l-orange-400' : apt.status === AppointmentStatus.SEATED ? 'bg-blue-50/60 border-l-4 border-l-blue-400' : apt.status === AppointmentStatus.TREATING ? 'bg-lilac-50/60 border-l-4 border-l-lilac-400' : apt.status === AppointmentStatus.COMPLETED ? 'bg-emerald-50/40 opacity-70' : 'bg-white border-l-4 border-l-transparent';

                          return (
                              <div key={apt.id} className={`p-3 transition-colors group flex flex-col md:flex-row items-start gap-3 ${rowClass}`}>
                                  <div className="flex-1 flex items-start gap-3">
                                      <div className="bg-white/80 text-slate-600 px-2 py-0.5 rounded text-xs font-bold font-mono mt-0.5 shrink-0 shadow-sm border border-slate-100">{apt.time}</div>
                                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                          <div className="flex items-center gap-2">
                                              <button onClick={() => onPatientSelect(apt.patientId)} className={`font-bold text-sm leading-none flex items-center gap-2 hover:underline text-left ${hasMedicalAlert ? 'text-red-600' : 'text-slate-800'}`}>{patient?.name || 'Unknown'}{hasMedicalAlert && <HeartPulse size={14} className="text-red-500 animate-pulse" />}</button>
                                              {patient?.provisional && <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 rounded uppercase">New</span>}
                                          </div>
                                          <div className="flex items-center gap-2 text-xs text-slate-500 leading-none">
                                              <span className="truncate max-w-[200px] font-medium">{apt.type}</span>
                                              <div className="relative ml-1">
                                                  <button onClick={(e) => { e.stopPropagation(); setOpenTrayId(openTrayId === apt.id ? null : apt.id); }} className={`p-0.5 rounded transition-colors ${openTrayId === apt.id ? 'text-teal-600 bg-teal-50' : 'text-slate-400 hover:text-teal-600'}`}><ClipboardList size={12} /></button>
                                                  {openTrayId === apt.id && (
                                                      <>
                                                        <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpenTrayId(null); }} />
                                                        <div className="absolute left-0 top-full mt-1 bg-white shadow-xl border border-slate-100 p-3 rounded-xl z-20 text-xs w-48 text-left animate-in fade-in zoom-in-95">
                                                            <h4 className="font-bold mb-1 border-b pb-1 text-slate-800">Setup: {apt.type}</h4>
                                                            <ul className="list-disc pl-4 text-slate-600">{getTrayItems(apt.type).map(i => <li key={i}>{i}</li>)}</ul>
                                                        </div>
                                                      </>
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                      <select value={apt.status} onChange={(e) => onUpdateAppointmentStatus(apt.id, e.target.value as AppointmentStatus)} className={`appearance-none text-[10px] font-bold px-3 py-1 rounded-full uppercase border cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 bg-white`}>{Object.values(AppointmentStatus).map(s => <option key={s} value={s}>{s}</option>)}</select>
                                  </div>
                                  {procDef?.requiresConsent && !apt.signedConsentUrl && apt.status !== AppointmentStatus.COMPLETED && (
                                      <div className="w-full md:w-auto mt-2 md:mt-0 flex justify-end md:ml-auto">
                                          <button onClick={() => setConsentModalApt(apt)} className="px-3 py-1.5 text-xs font-bold text-lilac-700 bg-lilac-100 border border-lilac-200 rounded-lg flex items-center gap-1 hover:bg-lilac-200 transition-colors shadow-sm"><FileSignature size={14}/> Sign Consent</button>
                                      </div>
                                  )}
                              </div>
                          );
                      })
                  )}
              </div>
          </div>
          
          {/* TOMORROW'S PREP */}
          <div className="bg-teal-900 rounded-2xl shadow-lg border border-teal-800 p-4 text-white flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                  <div className="bg-teal-800 p-2 rounded-xl"><Sunrise size={24} className="text-teal-200" /></div>
                  <div><h3 className="font-bold text-lg">Tomorrow's Prep</h3><p className="text-teal-300 text-xs">Get a head start on tray setups & sterilization.</p></div>
              </div>
              <div className="flex gap-4 md:gap-8">
                  <div className="text-center"><div className="text-2xl font-bold">{tomorrowStats.total}</div><div className="text-[10px] text-teal-300 uppercase font-bold">Appointments</div></div>
                  <div className="w-px bg-teal-800"></div>
                  <div className="text-center"><div className="text-2xl font-bold">{tomorrowStats.surgeries}</div><div className="text-[10px] text-teal-300 uppercase font-bold">Major Procs</div></div>
                  <div className="w-px bg-teal-800"></div>
                  <div className="text-center"><div className="text-2xl font-bold">{tomorrowStats.newPatients}</div><div className="text-[10px] text-teal-300 uppercase font-bold">New Patients</div></div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-3 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><Package className="text-blue-500" size={16} /> Lab Watch</h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-white border border-slate-200 px-2 py-0.5 rounded-full">Next 3 Days</span>
                    </div>
                    <div className="p-2 space-y-1">
                        {incomingLabCases.length > 0 ? incomingLabCases.map(a => (
                            <div key={a.id} onClick={() => onPatientSelect(a.patientId)} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 text-blue-700 font-bold text-xs px-2 py-1 rounded uppercase w-10 text-center">{new Date(a.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm text-slate-700 group-hover:text-teal-700 transition-colors truncate">{getPatient(a.patientId)?.name}</div>
                                        <div className="text-xs text-slate-500 truncate">{a.type}</div>
                                        {/* NEW: ENHANCED LAB DETAILS BADGES */}
                                        {(a.labDetails?.shade || a.labDetails?.material) && (
                                            <div className="flex gap-1 mt-1">
                                                {a.labDetails.shade && <span className="bg-white border border-slate-200 text-slate-600 text-[9px] font-bold px-1.5 rounded uppercase font-mono shadow-sm">Shade: {a.labDetails.shade}</span>}
                                                {a.labDetails.material && <span className="bg-teal-50 border border-teal-100 text-teal-700 text-[9px] font-bold px-1.5 rounded uppercase shadow-sm">{a.labDetails.material}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 shrink-0"><AlertCircle size={10} /> PENDING</div>
                            </div>
                        )) : <div className="p-4 text-center text-xs text-slate-400 italic">No pending lab cases.</div>}
                    </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[350px]">
                    <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Repeat className="text-purple-500" size={18} /> Opportunities</h3></div>
                    <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                        <div className="space-y-2">{recallList.length > 0 ? recallList.map(p => (<div key={p.id} onClick={() => onPatientSelect(p.id)} className="flex justify-between items-center text-sm p-3 bg-slate-50 border border-slate-100 hover:bg-purple-50 rounded-xl cursor-pointer group transition-all"><span className="font-bold text-slate-700">{p.name}</span><span className="text-xs text-purple-600 font-bold opacity-0 group-hover:opacity-100">Book Now</span></div>)) : <div className="text-xs text-slate-400 italic">No recalls due.</div>}</div>
                    </div>
              </div>

              <div className="bg-yellow-50 rounded-2xl shadow-sm border border-yellow-200 overflow-hidden flex flex-col h-[350px]">
                    <div className="px-4 py-3 border-b border-yellow-100 bg-yellow-100/50 flex justify-between items-center"><h3 className="font-bold text-yellow-800 flex items-center gap-2 text-sm"><StickyNote size={16} /> Clinic Tasks</h3><span className="text-[10px] text-yellow-600 font-bold uppercase">{sortedTasks.filter(t => !t.isCompleted).length} Active</span></div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">{sortedTasks.map(task => (
                        <div key={task.id} className={`group flex items-center gap-2 p-2 rounded-lg border transition-all ${task.isCompleted ? 'bg-yellow-100/30 border-transparent opacity-60' : 'bg-white border-yellow-100 shadow-sm hover:border-yellow-300'}`}>
                            <button onClick={() => onToggleTask && onToggleTask(task.id)} className={`p-1 rounded-full transition-colors ${task.isCompleted ? 'text-yellow-600' : 'text-slate-300 hover:text-yellow-600'}`}>{task.isCompleted ? <CheckCircle size={18} /> : <Circle size={18} />}</button>
                            <div className="flex-1 min-w-0"><div className={`text-sm leading-tight ${task.isCompleted ? 'line-through text-yellow-800/50' : 'text-yellow-900 font-medium'}`}>{task.text}</div></div>
                            <button onClick={() => onDeleteTask && onDeleteTask(task.id)} className="p-1.5 text-yellow-300 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                        </div>
                    ))}</div>
                    <div className="p-3 bg-yellow-100/50 border-t border-yellow-200"><form onSubmit={handleAddTaskSubmit} className="flex gap-2 items-center"><input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="New task..." className="flex-1 px-3 py-2 bg-white border border-yellow-200 rounded-lg text-sm"/><button type="submit" disabled={!newTaskText.trim()} className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"><Plus size={18} /></button></form></div>
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
    </div>
  );
};

export default Dashboard;

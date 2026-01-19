import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, Search, UserPlus, CalendarPlus, ArrowRight, PieChart, Activity, DollarSign, 
  StickyNote, Plus, CheckCircle, Flag, User as UserIcon, Clock, List, 
  History, Timer, Lock, Send, Armchair, RefreshCcw, CloudOff, ShieldCheck as VerifiedIcon, 
  FileWarning, MessageCircle, Heart, Zap, Users, CheckSquare, ShieldAlert, X, FileBadge2, AlertTriangle
} from 'lucide-react';
import { 
  Appointment, AppointmentStatus, User, UserRole, Patient, FieldSettings, 
  PinboardTask, SyncConflict, SystemStatus 
} from '../types';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';
import GlobalSearchModal from './GlobalSearchModal';

interface DashboardProps {
  appointments: Appointment[];
  patientsCount: number;
  staffCount: number;
  staff?: User[];
  currentUser: User;
  patients: Patient[];
  onAddPatient: () => void;
  onPatientSelect: (patientId: string) => void;
  onAddAppointment: (patientId?: string) => void;
  onUpdateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onCompleteRegistration: (patientId: string) => void;
  fieldSettings?: FieldSettings;
  currentBranch: string;
  tasks?: PinboardTask[];
  onAddTask?: (text: string, isUrgent: boolean, assignedTo: string) => void;
  onToggleTask?: (id: string) => void;
  syncConflicts?: SyncConflict[];
  systemStatus?: SystemStatus;
  onVerifyDowntimeEntry?: (id: string) => void;
  onVerifyMedHistory?: (appointmentId: string) => void;
  onConfirmFollowUp?: (appointmentId: string) => void;
  onQuickQueue: () => void;
  onQuickAddPatient: () => void;
  onNavigateToQueue: (queue: string) => void;
}

const statusTextConfig: { [key in AppointmentStatus]?: { color: string; label: string } } = {
  [AppointmentStatus.SCHEDULED]: { color: 'text-slate-500', label: 'Scheduled' },
  [AppointmentStatus.CONFIRMED]: { color: 'text-blue-500', label: 'Confirmed' },
  [AppointmentStatus.ARRIVED]: { color: 'text-orange-700', label: 'Arrived' },
  [AppointmentStatus.SEATED]: { color: 'text-lilac-700', label: 'Seated' },
  [AppointmentStatus.TREATING]: { color: 'text-lilac-800', label: 'Treating' },
  [AppointmentStatus.COMPLETED]: { color: 'text-teal-700', label: 'Completed' },
  [AppointmentStatus.CANCELLED]: { color: 'text-red-500', label: 'Cancelled' },
  [AppointmentStatus.NO_SHOW]: { color: 'text-red-700', label: 'No Show' },
};


const Dashboard: React.FC<DashboardProps> = ({ 
  appointments, currentUser, patients, onAddPatient, onPatientSelect, onAddAppointment,
  onUpdateAppointmentStatus, fieldSettings, tasks = [], onToggleTask, onCompleteRegistration,
  syncConflicts = [], onVerifyDowntimeEntry, onVerifyMedHistory, onConfirmFollowUp, onQuickQueue, staff = [],
  onQuickAddPatient, onNavigateToQueue
}) => {
  const toast = useToast();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getPatient = (id: string) => patients.find(pt => pt.id === id);

  const todaysFullSchedule = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    return appointments
      .filter(a => a.date === todayStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments]);
  
  const triageQueue = useMemo(() => todaysFullSchedule.filter(a => a.triageLevel && a.status === AppointmentStatus.ARRIVED), [todaysFullSchedule]);

  const patientFlow = useMemo(() => {
    const todaysApts = todaysFullSchedule.filter(a => !a.isBlock && !a.triageLevel);
    return {
      arrived: todaysApts.filter(a => a.status === AppointmentStatus.ARRIVED),
      inClinic: todaysApts.filter(a => [AppointmentStatus.SEATED, AppointmentStatus.TREATING].includes(a.status)),
      needsCheckout: todaysApts.filter(a => a.status === AppointmentStatus.COMPLETED)
    };
  }, [todaysFullSchedule]);

  const dailyKPIs = useMemo(() => {
    const completedToday = todaysFullSchedule.filter(a => a.status === AppointmentStatus.COMPLETED);
    const production = completedToday.reduce((sum, apt) => {
        const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
        const patient = getPatient(apt.patientId);
        if (!proc || !patient) return sum;

        // Gap 7 Fix: Find price book for patient's insurance
        const patientHMO = fieldSettings?.vendors.find(v => v.type === 'HMO' && v.name === patient.insuranceProvider);
        let priceBookId = patientHMO?.priceBookId;

        // Fallback to default
        if (!priceBookId) {
            priceBookId = fieldSettings?.priceBooks?.find(pb => pb.isDefault)?.id || 'pb_1';
        }
        
        const priceEntry = fieldSettings?.priceBookEntries?.find(
            pbe => pbe.procedureId === proc.id && pbe.priceBookId === priceBookId
        );
        return sum + (priceEntry?.price || 0);
    }, 0);
    return {
      production: `₱${production.toLocaleString()}`,
      patientsSeen: completedToday.length,
      noShows: todaysFullSchedule.filter(a => a.status === AppointmentStatus.NO_SHOW).length
    };
  }, [todaysFullSchedule, fieldSettings, patients]);

  const actionItems = useMemo(() => {
    const items = [];
    const downtimeEntries = appointments.filter(a => a.entryMode === 'MANUAL' && !a.reconciled);
    const medHistoryEntries = appointments.filter(a => a.status === AppointmentStatus.ARRIVED && !a.medHistoryVerified);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600000).toISOString();
    const postOpPatients = appointments.filter(a => 
        ['Surgery', 'Extraction'].includes(a.type) && 
        a.status === AppointmentStatus.COMPLETED &&
        a.date >= twentyFourHoursAgo.split('T')[0] &&
        !a.followUpConfirmed
    );
    const pendingRegistrations = patients.filter(p => !p.dpaConsent);

    if(syncConflicts.length > 0) items.push({ type: 'Sync Conflicts', count: syncConflicts.length, icon: CloudOff, action: () => onNavigateToQueue('sync') });
    if(downtimeEntries.length > 0) items.push({ type: 'Downtime Entries', count: downtimeEntries.length, icon: FileWarning, action: () => onNavigateToQueue('downtime') });
    if(medHistoryEntries.length > 0) items.push({ type: 'Med History', count: medHistoryEntries.length, icon: ShieldAlert, action: () => onNavigateToQueue('med_history') });
    if(postOpPatients.length > 0) items.push({ type: 'Post-Op Follow-up', count: postOpPatients.length, icon: MessageCircle, action: () => onNavigateToQueue('post_op') });
    if(pendingRegistrations.length > 0) items.push({ type: 'Pending Registrations', count: pendingRegistrations.length, icon: FileBadge2, action: () => onNavigateToQueue('registrations') });
    
    return items;
  }, [appointments, syncConflicts, patients, onNavigateToQueue]);

  const myTasks = useMemo(() => tasks.filter(t => t.assignedTo === currentUser.id && !t.isCompleted), [tasks, currentUser.id]);

  const handleSearchNavigation = (type: 'patient' | 'action', payload?: any) => {
    setIsSearchOpen(false); // Close modal first
    if (type === 'patient') {
      onPatientSelect(payload);
    } else if (type === 'action' && payload === 'newPatient') {
      onAddPatient();
    } else if (type === 'action' && payload === 'newAppointment') {
      onAddAppointment();
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row items-center gap-6">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">Home</h1>
        
        <div className="flex-1" />

        <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
                onClick={() => setIsSearchOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/40 hover:scale-105 active:scale-95 transition-all"
                aria-label="Open global search"
            >
                <Search size={16}/> Search
            </button>
            <button onClick={onAddPatient} className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-3 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal-900/40 hover:scale-105 active:scale-95 transition-all">
                <UserPlus size={16}/> New
            </button>
            <button onClick={() => onAddAppointment()} className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-3 bg-lilac-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-lilac-900/40 hover:scale-105 active:scale-95 transition-all">
                <CalendarPlus size={16}/> Appointment
            </button>
            <button onClick={onQuickAddPatient} className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-3 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-900/40 hover:scale-105 active:scale-95 transition-all">
                <Plus size={16}/> Quick Add
            </button>
            <button onClick={onQuickQueue} className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-900/40 hover:scale-105 active:scale-95 transition-all">
                <Zap size={16}/> Walk-In
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Column 1: Full Day Schedule */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Calendar size={20} className="text-teal-700"/>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Today's Schedule</h3>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-4 space-y-2 max-h-[70vh] overflow-y-auto no-scrollbar">
            {todaysFullSchedule.length > 0 ? todaysFullSchedule.map(apt => {
                const patient = apt.isBlock ? null : getPatient(apt.patientId);
                
                if (apt.isBlock || !patient) {
                     return (
                        <div key={apt.id} className="p-4 rounded-2xl flex items-center gap-4 bg-slate-50">
                            <div className="w-16 shrink-0 font-black text-slate-500 text-sm">{apt.time}</div>
                            <div className="flex-1 min-w-0 truncate">
                                <span className="font-black text-blue-700 text-base uppercase truncate">{apt.title}</span>
                                <span className="text-blue-500 text-[10px] font-bold uppercase truncate ml-2">({apt.type})</span>
                            </div>
                        </div>
                    );
                }
                
                const isMinor = patient.age !== undefined && patient.age < 18;
                const isPwdOrMinor = patient.isPwd || isMinor;
                const balance = patient.currentBalance || 0;
                const medicalAlerts = (patient.allergies?.filter(a => a !== 'None').length || 0) + (patient.medicalConditions?.filter(c => c !== 'None').length || 0);
                const isProvisional = !patient.dpaConsent;
                const needsClearance = patient.medicalConditions?.some(c => (fieldSettings?.criticalRiskRegistry || []).includes(c)) && !patient.clearanceRequests?.some(r => r.status === 'Approved');

                const config = statusTextConfig[apt.status] || { color: 'text-slate-400', label: apt.status };

                return (
                    <div 
                        key={apt.id} 
                        onClick={() => onPatientSelect(apt.patientId)}
                        className={`relative p-4 rounded-2xl flex flex-col gap-3 transition-all group cursor-pointer bg-white hover:bg-slate-50 border border-slate-100 ${apt.isLate ? 'border-red-300 bg-red-50/50' : ''}`}
                    >
                        {apt.isLate && <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-700 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse"><Clock size={10}/> Late</div>}
                        <div className="flex items-center gap-4">
                            <div className="w-16 shrink-0 font-black text-slate-800 text-sm">{apt.time}</div>
                            <div className="flex-1 min-w-0 truncate">
                                <span className="font-black text-slate-800 text-base uppercase truncate group-hover:text-teal-900">{patient.name}</span>
                                <span className="text-slate-500 text-[10px] font-bold uppercase truncate ml-2">({apt.type})</span>
                            </div>
                            <div className={`w-24 shrink-0 text-right text-xs font-black uppercase ${config.color}`}>{config.label}</div>
                        </div>
                        <div className="flex items-center gap-2 pl-20">
                            {medicalAlerts > 0 && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[9px] font-black uppercase tracking-widest"><Heart size={10}/> Medical Alert</div>}
                            {balance > 0 && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[9px] font-black uppercase tracking-widest"><DollarSign size={10}/> Balance Due</div>}
                            {isProvisional && <button onClick={(e) => { e.stopPropagation(); onCompleteRegistration(patient.id);}} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-widest"><FileBadge2 size={10}/> Incomplete</button>}
                            {needsClearance && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-lilac-100 text-lilac-700 rounded-full text-[9px] font-black uppercase tracking-widest"><ShieldAlert size={10}/> Clearance</div>}
                        </div>
                    </div>
                )
            }) : <div className="p-10 text-center text-slate-400 italic">No appointments scheduled for today.</div>}
          </div>
        </div>

        {/* Column 2: Patient Flow */}
        <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-3 px-2">
                <Users size={20} className="text-lilac-700"/>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Patient Flow Monitor</h3>
            </div>
            <div className="space-y-6">
                {/* Triage Queue */}
                <div className="bg-white rounded-[2.5rem] border-2 border-red-200 shadow-lg p-6">
                    <h4 className="text-[10px] font-black text-red-800 uppercase tracking-[0.3em] mb-4">Triage & Walk-in Queue ({triageQueue.length})</h4>
                    <div className="space-y-3">
                         {triageQueue.map(apt => {
                            const patient = getPatient(apt.patientId);
                            const isEmergency = apt.triageLevel === 'Level 1: Trauma/Bleeding' || apt.triageLevel === 'Level 2: Acute Pain/Swelling';
                            return (
                                <div key={apt.id} onClick={() => onPatientSelect(apt.patientId)} className={`p-4 rounded-2xl flex justify-between items-center cursor-pointer hover:shadow-lg transition-all ${isEmergency ? 'bg-red-100 border-2 border-red-200 animate-pulse' : 'bg-orange-50 border-2 border-orange-200'}`}>
                                    <div>
                                        <div className={`font-black uppercase text-sm ${isEmergency ? 'text-red-900' : 'text-orange-900'}`}>{patient?.name}</div>
                                        <div className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${isEmergency ? 'text-red-700' : 'text-orange-700'}`}>{apt.type}</div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); onUpdateAppointmentStatus(apt.id, AppointmentStatus.SEATED); }} className="px-3 py-1 bg-white text-orange-800 text-[9px] font-black uppercase rounded-lg border border-orange-200">Seat Patient</button>
                                </div>
                            )
                        })}
                        {triageQueue.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">Triage queue is empty.</p>}
                    </div>
                </div>
                {/* Waiting Room */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Waiting Room ({patientFlow.arrived.length})</h4>
                    <div className="space-y-3">
                        {patientFlow.arrived.map(apt => {
                            const patient = getPatient(apt.patientId);
                            return (
                                <div key={apt.id} onClick={() => onPatientSelect(apt.patientId)} className="p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl flex justify-between items-center cursor-pointer hover:shadow-lg transition-all">
                                    <div>
                                        <div className="font-black text-orange-900 uppercase text-sm">{patient?.name}</div>
                                        <div className="text-[9px] font-bold text-orange-700 uppercase tracking-widest mt-1">{apt.type}</div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); onUpdateAppointmentStatus(apt.id, AppointmentStatus.SEATED); }} className="px-3 py-1 bg-white text-orange-800 text-[9px] font-black uppercase rounded-lg border border-orange-200">Seat Patient</button>
                                </div>
                            )
                        })}
                        {patientFlow.arrived.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">Waiting room is empty.</p>}
                    </div>
                </div>
                 {/* In Clinic */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">In Clinic ({patientFlow.inClinic.length})</h4>
                    <div className="space-y-3">
                        {patientFlow.inClinic.map(apt => {
                            const patient = getPatient(apt.patientId);
                            const provider = staff.find(s => s.id === apt.providerId);
                            return (
                                <div key={apt.id} className="p-4 bg-lilac-50 border-2 border-lilac-200 rounded-2xl">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-black text-lilac-900 uppercase text-sm">{patient?.name}</div>
                                            <div className="text-[9px] font-bold text-lilac-700 uppercase tracking-widest mt-1">{apt.status}</div>
                                        </div>
                                        {provider && <img src={provider.avatar} alt={provider.name} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />}
                                    </div>
                                    <button onClick={() => onUpdateAppointmentStatus(apt.id, AppointmentStatus.COMPLETED)} className="w-full mt-3 py-2 bg-lilac-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-lilac-700 transition-all">Mark as Completed</button>
                                </div>
                            )
                        })}
                        {patientFlow.inClinic.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">No patients currently in treatment.</p>}
                    </div>
                </div>
            </div>
        </div>

        {/* Column 3: Action Center */}
        <div className="lg:col-span-3 space-y-6">
             <div className="flex items-center gap-3 px-2">
                <Activity size={20} className="text-red-700"/>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Action Center</h3>
            </div>
            <div className="space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Huddle Board</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg"><span className="text-xs font-bold uppercase text-slate-500">Today's Production</span><span className="font-black text-teal-700">{dailyKPIs.production}</span></div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg"><span className="text-xs font-bold uppercase text-slate-500">Patients Seen</span><span className="font-black text-slate-800">{dailyKPIs.patientsSeen}</span></div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg"><span className="text-xs font-bold uppercase text-slate-500">No-Shows</span><span className={`font-black ${dailyKPIs.noShows > 0 ? 'text-red-600' : 'text-slate-800'}`}>{dailyKPIs.noShows}</span></div>
                    </div>
                </div>
                {actionItems.length > 0 && (
                    <div className="bg-white rounded-[2.5rem] border-2 border-orange-200 shadow-lg p-6">
                        <h4 className="text-[10px] font-black text-orange-800 uppercase tracking-[0.3em] mb-4">Alerts & Verifications</h4>
                        <div className="space-y-2">
                            {actionItems.map(item => (
                                <button key={item.type} onClick={item.action} className="w-full p-3 bg-orange-50 border border-orange-100 rounded-lg flex justify-between items-center text-left hover:bg-orange-100 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <item.icon size={14} className="text-orange-600" />
                                        <span className="text-xs font-black text-orange-900 uppercase">{item.type}</span>
                                    </div>
                                    <span className="font-black text-orange-700">{item.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                 <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">My Tasks ({myTasks.length})</h4>
                     <div className="space-y-2">
                        {myTasks.map(task => (
                            <div key={task.id} className="flex items-start gap-3 p-3 hover:bg-teal-50 rounded-lg group">
                                <button onClick={() => onToggleTask && onToggleTask(task.id)} className="mt-0.5 text-slate-400 hover:text-teal-700"><CheckCircle size={16} /></button>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-slate-700 leading-tight">{task.text}</div>
                                    {task.isUrgent && <div className="mt-1 flex items-center gap-1 text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-black uppercase w-fit"><Flag size={10} /> Urgent</div>}
                                </div>
                            </div>
                        ))}
                        {myTasks.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">No pending tasks.</p>}
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        patients={patients}
        todaysAppointments={todaysFullSchedule}
        onNavigate={handleSearchNavigation}
      />
    </div>
  );
};

export default Dashboard;


import React, { useState, useMemo } from 'react';
// FIX: Add missing 'X' icon from lucide-react to fix 'Cannot find name X' error.
import { 
  Calendar, Search, UserPlus, CalendarPlus, ArrowRight, PieChart, Activity, DollarSign, 
  StickyNote, Plus, CheckCircle, Flag, User as UserIcon, Clock, List, 
  History, Timer, Lock, Send, Armchair, RefreshCcw, CloudOff, ShieldCheck as VerifiedIcon, 
  FileWarning, MessageCircle, Heart, Zap, Users, CheckSquare, ShieldAlert, X
} from 'lucide-react';
import { 
  Appointment, AppointmentStatus, User, UserRole, Patient, FieldSettings, 
  PinboardTask, SyncConflict, SystemStatus 
} from '../types';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';

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
  appointments, allAppointments = [], currentUser, patients, onAddPatient, onPatientSelect, onAddAppointment,
  onUpdateAppointmentStatus, fieldSettings, tasks = [], onToggleTask,
  syncConflicts = [], onVerifyDowntimeEntry, onConfirmFollowUp, onQuickQueue, staff = []
}) => {
  const toast = useToast();
  const getPatient = (id: string) => patients.find(pt => pt.id === id);

  const getCriticalFlags = (patient: Patient) => {
    const flags: { type: string; value: string }[] = [];
    const criticalConditions = fieldSettings?.criticalRiskRegistry || [];
    
    (patient.allergies || []).forEach(allergy => {
        if (criticalConditions.includes(allergy) || (patient.allergies || []).length > 1 && allergy !== 'None') {
            flags.push({ type: 'Allergy', value: allergy });
        }
    });

    (patient.medicalConditions || []).forEach(condition => {
        if (criticalConditions.includes(condition) || (patient.medicalConditions || []).length > 1 && condition !== 'None') {
            flags.push({ type: 'Condition', value: condition });
        }
    });

    if (patient.takingBloodThinners) {
        flags.push({ type: 'Alert', value: 'Taking Blood Thinners' });
    }

    return flags;
  };

  const todaysFullSchedule = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    return appointments
      .filter(a => a.date === todayStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments]);
  
  const patientFlow = useMemo(() => {
    const todaysApts = todaysFullSchedule.filter(a => !a.isBlock);
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
        return sum + (proc?.price || 0);
    }, 0);
    return {
      production: `₱${production.toLocaleString()}`,
      patientsSeen: completedToday.length,
      noShows: todaysFullSchedule.filter(a => a.status === AppointmentStatus.NO_SHOW).length
    };
  }, [todaysFullSchedule, fieldSettings]);

  const actionItems = useMemo(() => {
    const items = [];
    const downtimeEntries = allAppointments.filter(a => a.entryMode === 'MANUAL' && !a.reconciled);
    const medHistoryEntries = allAppointments.filter(a => a.status === AppointmentStatus.ARRIVED && !a.medHistoryVerified);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600000).toISOString();
    const postOpPatients = allAppointments.filter(a => 
        ['Surgery', 'Extraction'].includes(a.type) && 
        a.status === AppointmentStatus.COMPLETED &&
        a.date >= twentyFourHoursAgo.split('T')[0] &&
        !a.followUpConfirmed
    );

    if(syncConflicts.length > 0) items.push({ type: 'Sync Conflicts', count: syncConflicts.length, icon: CloudOff });
    if(downtimeEntries.length > 0) items.push({ type: 'Downtime Entries', count: downtimeEntries.length, icon: FileWarning });
    if(medHistoryEntries.length > 0) items.push({ type: 'Med History', count: medHistoryEntries.length, icon: ShieldAlert });
    if(postOpPatients.length > 0) items.push({ type: 'Post-Op Follow-up', count: postOpPatients.length, icon: MessageCircle });
    
    return items;
  }, [allAppointments, syncConflicts]);

  const myTasks = useMemo(() => tasks.filter(t => t.assignedTo === currentUser.id && !t.isCompleted), [tasks, currentUser.id]);


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">Dashboard</h1>
        <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={onAddPatient} className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-3 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal-900/40 hover:scale-105 active:scale-95 transition-all">
                <UserPlus size={16}/> New
            </button>
            <button onClick={() => onAddAppointment()} className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-3 bg-lilac-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-lilac-900/40 hover:scale-105 active:scale-95 transition-all">
                <CalendarPlus size={16}/> Appointment
            </button>
            <button onClick={() => onQuickQueue()} className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-900/40 hover:scale-105 active:scale-95 transition-all">
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
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 space-y-3 max-h-[70vh] overflow-y-auto no-scrollbar">
            {todaysFullSchedule.length > 0 ? todaysFullSchedule.map(apt => {
                const patient = apt.isBlock ? null : getPatient(apt.patientId);
                
                if (apt.isBlock || !patient) {
                     return (
                        <div key={apt.id} className="p-4 rounded-2xl flex items-center gap-4 bg-slate-50">
                            <div className="w-16 shrink-0 font-black text-slate-500 text-sm">{apt.time}</div>
                            <div className="flex-1 min-w-0 truncate">
                                <span className="font-black text-slate-600 text-base uppercase truncate">{apt.title}</span>
                                <span className="text-slate-400 text-[10px] font-bold uppercase truncate ml-2">({apt.type})</span>
                            </div>
                        </div>
                    );
                }

                const flags = getCriticalFlags(patient);
                const hasFlags = flags.length > 0;
                const isMinor = patient.age !== undefined && patient.age < 18;
                const isPwdOrMinor = patient.isPwd || isMinor;
                const config = statusTextConfig[apt.status] || { color: 'text-slate-400', label: apt.status };

                return (
                    <div 
                        key={apt.id} 
                        onClick={() => onPatientSelect(apt.patientId)}
                        className={`relative pl-6 pr-4 py-4 rounded-2xl flex items-center gap-4 transition-all group cursor-pointer ${
                            hasFlags 
                            ? 'bg-red-100 hover:bg-red-200' 
                            : isPwdOrMinor 
                            ? 'bg-amber-100 hover:bg-amber-200' 
                            : 'bg-white hover:bg-slate-50'
                        }`}
                    >
                        {hasFlags ? (
                            <div className="absolute left-0 top-0 h-full w-1.5 bg-red-500 group-hover:bg-red-600 shadow-lg" />
                        ) : isPwdOrMinor ? (
                            <div className="absolute left-0 top-0 h-full w-1.5 bg-amber-500 group-hover:bg-amber-600 shadow-lg" />
                        ) : null}
                        
                        <div className="w-16 shrink-0 font-black text-slate-800 text-sm">{apt.time}</div>
                        
                        <div className="flex-1 min-w-0 truncate">
                            <span className="font-black text-slate-800 text-base uppercase truncate group-hover:text-teal-900">{patient.name}</span>
                            <span className="text-slate-500 text-[10px] font-bold uppercase truncate ml-2">({apt.type})</span>
                        </div>
                        
                        <div className="w-12 shrink-0 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">{apt.durationMinutes}m</div>
                        
                        <div className={`w-24 shrink-0 text-right text-xs font-black uppercase ${config.color}`}>
                            {config.label}
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
                 {/* Checkout */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Ready for Checkout ({patientFlow.needsCheckout.length})</h4>
                    <div className="space-y-3">
                         {patientFlow.needsCheckout.map(apt => {
                            const patient = getPatient(apt.patientId);
                            return (
                                <div key={apt.id} onClick={() => onPatientSelect(apt.patientId)} className="p-4 bg-teal-50 border-2 border-teal-200 rounded-2xl flex justify-between items-center cursor-pointer hover:shadow-lg transition-all">
                                    <div>
                                        <div className="font-black text-teal-900 uppercase text-sm">{patient?.name}</div>
                                    </div>
                                    <span className="text-[9px] font-black text-teal-700 uppercase">View Ledger</span>
                                </div>
                            )
                        })}
                        {patientFlow.needsCheckout.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">No patients awaiting checkout.</p>}
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
                                <div key={item.type} className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <item.icon size={14} className="text-orange-600" />
                                        <span className="text-xs font-black text-orange-900 uppercase">{item.type}</span>
                                    </div>
                                    <span className="font-black text-orange-700">{item.count}</span>
                                </div>
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
    </div>
  );
};

export default Dashboard;

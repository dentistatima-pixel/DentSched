import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Calendar, Search, UserPlus, CalendarPlus, ArrowRight, PieChart, Activity, DollarSign, 
  StickyNote, Plus, CheckCircle, Flag, User as UserIcon, Clock, List, 
  History, Timer, Lock, Send, Armchair, RefreshCcw, CloudOff, ShieldCheck as VerifiedIcon, 
  FileWarning, MessageSquare, Heart, Zap, Users, CheckSquare, ShieldAlert, X, FileBadge2, AlertTriangle, FileSearch, UserCheck, UserX,
  Sparkles, Loader, ClipboardCheck, Sun, Moon, Coffee, LogIn, Play, Check, Beaker
} from 'lucide-react';
import { 
  Appointment, AppointmentStatus, UserRole, Patient, 
  PinboardTask, SyncConflict, SystemStatus, User, FieldSettings, StockItem,
  ClinicalIncident, 
  RegistrationStatus,
  RecallStatus,
  LabStatus
} from '../types';
import { formatDate } from '../constants';
import { useModal } from '../contexts/ModalContext';
import { useAppointments } from '../contexts/AppointmentContext';
import { useStaff } from '../contexts/StaffContext';
import { useAppContext } from '../contexts/AppContext';
import { usePatient } from '../contexts/PatientContext';
import { useSettings } from '../contexts/SettingsContext';
import { useClinicalOps } from '../contexts/ClinicalOpsContext';
import { useNavigate } from '../contexts/RouterContext';


interface DashboardProps {}

const AnimatedCounter: React.FC<{ value: number; isCurrency?: boolean }> = ({ value, isCurrency }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const valueRef = useRef(0);

  const formatValue = useCallback((val: number) => {
    if (isCurrency) {
        return `₱${Math.round(val).toLocaleString()}`;
    }
    return Math.round(val).toLocaleString();
  }, [isCurrency]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const startValue = valueRef.current;
    const endValue = value;
    valueRef.current = value;

    if (startValue === endValue) {
        node.textContent = formatValue(endValue);
        return;
    }

    const duration = 1000;
    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      const currentVal = startValue + (endValue - startValue) * easedProgress;
      node.textContent = formatValue(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        node.textContent = formatValue(endValue);
      }
    };

    requestAnimationFrame(animate);
    
  }, [value, formatValue]);

  return <span ref={ref}>{formatValue(0)}</span>;
};

const PIPELINE_STAGES: AppointmentStatus[] = [
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.ARRIVED,
    AppointmentStatus.TREATING,
];

const StatusPipeline: React.FC<{ currentStatus: AppointmentStatus }> = ({ currentStatus }) => {
    const currentIdx = PIPELINE_STAGES.indexOf(currentStatus);
    return (
        <div className="flex items-center w-full my-2">
            {PIPELINE_STAGES.map((stage, idx) => {
                const isCompleted = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                    <React.Fragment key={stage}>
                        {idx > 0 && <div className={`flex-1 h-0.5 ${isCompleted || isCurrent ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                        <div
                            className={`w-3 h-3 rounded-full transition-all relative ${isCurrent ? 'bg-teal-500 ring-4 ring-teal-100 dark:ring-teal-900/50' : isCompleted ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                            title={stage}
                        />
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const AppointmentAlerts: React.FC<{ patient: Patient; settings?: FieldSettings }> = ({ patient, settings }) => {
    const alerts = useMemo(() => {
        const medicalAlerts = [
            ...(patient.allergies?.filter(a => a !== 'None') || []),
            ...(patient.medicalConditions?.filter(c => c !== 'None') || [])
        ];
        const hasBalance = (patient.currentBalance || 0) > 0;
        const isProvisional = patient.registrationStatus === RegistrationStatus.PROVISIONAL;
        const needsClearance = patient.medicalConditions?.some(c => (settings?.criticalRiskRegistry || []).includes(c)) && !patient.clearanceRequests?.some(r => r.status === 'Approved');

        const alertComponents = [];
        if (medicalAlerts.length > 0) {
            alertComponents.push(<div key="med" className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-widest"><Heart size={10}/> Medical Alert: {medicalAlerts[0]}</div>);
        }
        if (hasBalance) {
            alertComponents.push(<div key="fin" className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black uppercase tracking-widest"><DollarSign size={10}/> Unpaid Balance: ₱{patient.currentBalance?.toLocaleString()}</div>);
        }
        if (isProvisional) {
            alertComponents.push(<div key="prov" className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest"><FileBadge2 size={10}/> Incomplete Forms</div>);
        }
         if (needsClearance) {
            alertComponents.push(<div key="clear" className="flex items-center gap-1.5 px-2.5 py-1 bg-lilac-100 text-lilac-700 rounded-full text-[10px] font-black uppercase tracking-widest"><ShieldAlert size={10}/> Needs Clearance</div>);
        }
        return alertComponents;
    }, [patient, settings]);

    if (alerts.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 pt-3 mt-4 border-t border-slate-100 dark:border-slate-700/50">
            {alerts}
        </div>
    )
};

const TodaysTimeline: React.FC<{ 
  appointments: Appointment[], 
  patients: Patient[], 
  settings?: FieldSettings,
  onUpdateStatus: (id: string, status: AppointmentStatus) => void,
  disappearingApts: string[],
}> = ({ appointments, patients, settings, onUpdateStatus, disappearingApts }) => {
    const navigate = useNavigate();

    const NextActionButton: React.FC<{apt: Appointment}> = ({ apt }) => {
        const actions: Partial<Record<AppointmentStatus, { label: string, icon: React.ElementType, nextStatus: AppointmentStatus, color: string }>> = {
            [AppointmentStatus.SCHEDULED]: { label: 'Confirm', icon: CheckSquare, nextStatus: AppointmentStatus.CONFIRMED, color: 'bg-blue-600 shadow-blue-900/30' },
            [AppointmentStatus.CONFIRMED]: { label: 'Arrive', icon: LogIn, nextStatus: AppointmentStatus.ARRIVED, color: 'bg-orange-600 shadow-orange-900/30' },
            [AppointmentStatus.ARRIVED]: { label: 'Start Treatment', icon: Play, nextStatus: AppointmentStatus.TREATING, color: 'bg-lilac-600 shadow-lilac-900/30' },
            [AppointmentStatus.TREATING]: { label: 'Complete Session', icon: Check, nextStatus: AppointmentStatus.COMPLETED, color: 'bg-teal-600 shadow-teal-900/30' },
        };
        const action = actions[apt.status];
        if (!action) return null;

        const Icon = action.icon;
        return (
            <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(apt.id, action.nextStatus); }} className={`w-full flex items-center justify-center gap-3 px-4 py-3 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg btn-tactile ${action.color}`}>
                <Icon size={14}/> {action.label}
            </button>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
                <Calendar size={20} className="text-teal-700 dark:text-teal-400"/>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">Today's Timeline</h3>
            </div>
            <div className="bg-bg-secondary rounded-[2.5rem] border border-border-primary shadow-sm p-4 space-y-3 max-h-[80vh] overflow-y-auto no-scrollbar">
                {appointments.length > 0 ? appointments.map(apt => {
                    const isDisappearing = disappearingApts.includes(apt.id);
                    const patient = apt.isBlock ? null : patients.find(p => p.id === apt.patientId);
                    
                    if (apt.isBlock) {
                         return (
                            <div key={apt.id} className="p-4 rounded-2xl flex items-center gap-4 bg-bg-tertiary">
                                <div className="w-16 shrink-0 text-center">
                                    <div className="font-black text-text-secondary text-sm">{apt.time}</div>
                                    <div className="text-xs font-bold text-slate-400">{apt.durationMinutes}m</div>
                                </div>
                                <div className="flex-1 min-w-0 truncate border-l-4 border-slate-400 pl-4">
                                    <span className="font-black text-blue-700 dark:text-blue-400 text-base uppercase truncate">{apt.title}</span>
                                    <span className="text-blue-500 dark:text-blue-500 text-xs font-bold uppercase truncate ml-2">({apt.type})</span>
                                </div>
                            </div>
                        );
                    }
                    
                    if (!patient) return null;

                    const statusColor = {
                        [AppointmentStatus.ARRIVED]: 'border-orange-500',
                        [AppointmentStatus.TREATING]: 'border-lilac-500',
                    }[apt.status] || 'border-teal-500';

                    return (
                        <div 
                            key={apt.id} 
                            className={`p-4 rounded-2xl transition-all duration-300 group cursor-pointer bg-bg-secondary hover:bg-bg-tertiary border border-border-secondary ${isDisappearing ? 'animate-slide-out-up' : 'animate-in fade-in'}`}
                        >
                            <div className="flex items-start gap-4">
                               <div onClick={() => navigate(`patients/${apt.patientId}`)} className="w-20 shrink-0 text-center">
                                    <div className="font-black text-text-primary text-lg">{apt.time}</div>
                                    <div className="text-xs font-bold text-slate-400">{apt.durationMinutes} min</div>
                               </div>
                               <div onClick={() => navigate(`patients/${apt.patientId}`)} className={`flex-1 min-w-0 border-l-4 ${statusColor} pl-4`}>
                                   <div className="font-black text-text-primary text-base uppercase truncate group-hover:text-teal-900 dark:group-hover:text-teal-200">{patient.name}</div>
                                   <div className="text-text-secondary text-sm font-bold truncate">{apt.type}</div>
                                   <StatusPipeline currentStatus={apt.status}/>
                                   <AppointmentAlerts patient={patient} settings={settings}/>
                               </div>
                               <div className="w-40 shrink-0">
                                   <NextActionButton apt={apt} />
                               </div>
                            </div>
                        </div>
                    )
                }) : <div className="p-10 text-center text-text-secondary italic">No active appointments for today.</div>}
            </div>
        </div>
    )
}

const ActionWidgets: React.FC<{ dailyKPIs: any, myTasks: any[], onToggleTask: any, appointments: Appointment[], patients: Patient[] }> = ({ dailyKPIs, myTasks, onToggleTask, appointments, patients }) => {
    const { showModal } = useModal();
    const todayStr = new Date().toLocaleDateString('en-CA');
    const completedToday = appointments.filter(a => a.date === todayStr && a.status === AppointmentStatus.COMPLETED);
    const noShowsToday = appointments.filter(a => a.date === todayStr && a.status === AppointmentStatus.NO_SHOW);
    
    const showCompletedList = () => {
        const patientList = completedToday.map(apt => {
            const p = patients.find(p => p.id === apt.patientId);
            return `- ${apt.time}: ${p?.name} - *${apt.type}*`;
        }).join('\n');
        showModal('infoDisplay', { title: "Today's Completed Appointments", content: patientList || 'No completed appointments yet.' });
    };

    const showNoShowList = () => {
        const patientList = noShowsToday.map(apt => {
            const p = patients.find(p => p.id === apt.patientId);
            return `- ${apt.time}: ${p?.name} - *${apt.type}*`;
        }).join('\n');
        showModal('infoDisplay', { title: "Today's No-Shows", content: patientList || 'No-shows today. Great!' });
    };

    const StatWidget: React.FC<{title: string, value: React.ReactNode, icon: React.ElementType, color: string, onClick?: () => void}> = ({ title, value, icon: Icon, color, onClick }) => (
        <button onClick={onClick} disabled={!onClick} className={`p-4 rounded-2xl text-white shadow-md hover:-translate-y-0.5 transition-transform w-full text-left flex items-center gap-3 ${color} ${!onClick ? 'cursor-default' : ''}`}>
            <div className="bg-white/20 p-2 rounded-lg"><Icon size={18}/></div>
            <div>
                <p className="text-xl font-black tracking-tighter">{value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{title}</p>
            </div>
        </button>
    )

    return (
        <div className="space-y-4">
             <div className="flex items-center gap-3 px-2">
                <Activity size={20} className="text-red-700 dark:text-red-400"/>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">Action Center</h3>
            </div>
            <div className="space-y-4">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                    <StatWidget title="Production" value={<AnimatedCounter value={dailyKPIs.production} isCurrency={true}/>} icon={DollarSign} color="bg-teal-600 shadow-teal-900/30" />
                    <StatWidget title="Seen" value={<AnimatedCounter value={dailyKPIs.patientsSeen}/>} icon={UserCheck} color="bg-blue-600 shadow-blue-900/30" onClick={showCompletedList} />
                    <StatWidget title="No-Shows" value={<AnimatedCounter value={dailyKPIs.noShows}/>} icon={UserX} color="bg-red-600 shadow-red-900/30" onClick={showNoShowList} />
                </div>
                
                 <div className="bg-bg-secondary rounded-[2rem] border border-border-primary shadow-sm p-4">
                    <h4 className="text-xs font-black text-text-secondary uppercase tracking-[0.3em] mb-3 px-2">My Tasks ({myTasks.length})</h4>
                     <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                        {myTasks.map(task => (
                            <div key={task.id} className="flex items-start gap-3 p-2 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg group">
                                <button onClick={() => onToggleTask && onToggleTask(task.id)} className="mt-0.5 text-text-secondary hover:text-teal-700 dark:hover:text-teal-400"><CheckCircle size={16} /></button>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-text-primary leading-tight">{task.text}</div>
                                    {task.isUrgent && <div className="mt-1 flex items-center gap-1 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-black uppercase w-fit"><Flag size={10} /> Urgent</div>}
                                </div>
                            </div>
                        ))}
                        {myTasks.length === 0 && <p className="text-sm text-text-secondary italic text-center py-4">No pending tasks.</p>}
                    </div>
                </div>
            </div>
        </div>
    )
}

const VitalsCard: React.FC<{
    icon: React.ElementType;
    title: string;
    value: number;
    color: string;
    onClick: () => void;
}> = ({ icon: Icon, title, value, color, onClick }) => (
    <button onClick={onClick} className={`p-6 rounded-3xl text-white shadow-lg hover:-translate-y-1 transition-transform w-full text-left flex flex-col justify-between h-40 ${color}`}>
        <div className="flex justify-between items-start">
            <div className="bg-white/20 p-3 rounded-xl">
                <Icon size={24}/>
            </div>
        </div>
        <div>
            <p className="text-4xl font-black tracking-tighter">{value}</p>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">{title}</p>
        </div>
    </button>
);


export const Dashboard: React.FC<DashboardProps> = () => {
  const { showModal } = useModal();
  const { appointments, handleUpdateAppointmentStatus, handleSaveAppointment } = useAppointments();
  const { staff } = useStaff();
  const { currentUser, currentBranch } = useAppContext();
  const { patients } = usePatient();
  const { fieldSettings } = useSettings();
  const { tasks, handleToggleTask, handleAddToWaitlist, incidents } = useClinicalOps();
  
  const [time, setTime] = useState(new Date());
  const [disappearingApts, setDisappearingApts] = useState<string[]>([]);
  
  const handleStatusUpdate = (appointmentId: string, newStatus: AppointmentStatus) => {
    if (newStatus === AppointmentStatus.COMPLETED) {
        setDisappearingApts(prev => [...prev, appointmentId]);
        setTimeout(() => {
            handleUpdateAppointmentStatus(appointmentId, newStatus);
            // The item will naturally disappear after context update, 
            // but we clean up the state just in case.
            setTimeout(() => setDisappearingApts(prev => prev.filter(id => id !== appointmentId)), 500);
        }, 500);
    } else {
        handleUpdateAppointmentStatus(appointmentId, newStatus);
    }
  };

  useEffect(() => {
      const timer = setInterval(() => setTime(new Date()), 1000 * 60); // Update every minute
      return () => clearInterval(timer);
  }, []);
  
  const getGreeting = () => {
      const hour = time.getHours();
      if (hour < 12) return "Good Morning";
      if (hour < 18) return "Good Afternoon";
      return "Good Evening";
  };
  
  const todaysAppointments = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const nonTerminalStatuses = [
      AppointmentStatus.SCHEDULED,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.ARRIVED,
      AppointmentStatus.TREATING
    ];
    return appointments
      .filter(a => a.date === todayStr && a.branch === currentBranch && (nonTerminalStatuses.includes(a.status) || disappearingApts.includes(a.id)))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, currentBranch, disappearingApts]);
  
  // This is now for the widgets, which need to see all of today's appointments
  const allTodaysAppointments = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    return appointments.filter(a => a.date === todayStr && a.branch === currentBranch);
  }, [appointments, currentBranch]);

  const dailyKPIs = useMemo(() => {
    const completedToday = allTodaysAppointments.filter(a => a.status === AppointmentStatus.COMPLETED);
    const production = completedToday.reduce((sum, apt) => {
        const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
        return sum + (proc?.defaultPrice || 0);
    }, 0);
    return {
      production: production,
      patientsSeen: completedToday.length,
      noShows: allTodaysAppointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length
    };
  }, [allTodaysAppointments, fieldSettings]);

  const overdueRecalls = useMemo(() => patients.filter(p => p.recallStatus === RecallStatus.OVERDUE), [patients]);
  const pendingLabs = useMemo(() => appointments.filter(a => a.labStatus === LabStatus.PENDING), [appointments]);
  const unresolvedIncidents = useMemo(() => (incidents || []).filter(i => !i.advisoryCallSigned), [incidents]);
  const outstandingBalances = useMemo(() => patients.filter(p => p.currentBalance && p.currentBalance > 0), [patients]);

  const showOverdueRecalls = () => {
    const content = overdueRecalls.length > 0
        ? overdueRecalls.map(p => `- **${p.name}** (Last visit: ${formatDate(p.lastVisit)})`).join('\n')
        : 'No patients are currently overdue for recall.';
    showModal('infoDisplay', { title: `Overdue Recalls (${overdueRecalls.length})`, content });
  };

  const showPendingLabs = () => {
      const content = pendingLabs.length > 0
          ? pendingLabs.map(a => {
              const p = patients.find(pt => pt.id === a.patientId);
              return `- **${p?.name || 'Unknown'}**: *${a.type}* (Appt: ${formatDate(a.date)})`;
          }).join('\n')
          : 'No lab cases are currently pending.';
      showModal('infoDisplay', { title: `Pending Lab Cases (${pendingLabs.length})`, content });
  };

  const showUnresolvedIncidents = () => {
      const content = unresolvedIncidents.length > 0
          ? unresolvedIncidents.map(i => `- **${i.type}** on ${formatDate(i.date)}: *${i.description.substring(0, 50)}...*`).join('\n')
          : 'No unresolved clinical incidents.';
      showModal('infoDisplay', { title: `Unresolved Incidents (${unresolvedIncidents.length})`, content });
  };

  const showOutstandingBalances = () => {
      const content = outstandingBalances.length > 0
          ? outstandingBalances.map(p => `- **${p.name}**: ₱${p.currentBalance?.toLocaleString()}`).join('\n')
          : 'No patients with outstanding balances.';
      showModal('infoDisplay', { title: `Patients with Balances (${outstandingBalances.length})`, content });
  };


  const PracticeVitals = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <VitalsCard title="Overdue Recalls" value={overdueRecalls.length} icon={History} color="bg-amber-500 shadow-amber-900/20" onClick={showOverdueRecalls} />
        <VitalsCard title="Pending Lab Cases" value={pendingLabs.length} icon={Beaker} color="bg-blue-500 shadow-blue-900/20" onClick={showPendingLabs} />
        <VitalsCard title="Unresolved Incidents" value={unresolvedIncidents.length} icon={ShieldAlert} color="bg-red-500 shadow-red-900/20" onClick={showUnresolvedIncidents} />
        <VitalsCard title="Outstanding Balances" value={outstandingBalances.length} icon={DollarSign} color="bg-lilac-500 shadow-lilac-900/20" onClick={showOutstandingBalances} />
    </div>
  );

  if (!currentUser) return null;

  const myTasks = useMemo(() => tasks.filter(t => t.assignedTo === currentUser.id && !t.isCompleted), [tasks, currentUser.id]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center justify-between gap-6">
        <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter leading-none">{getGreeting()}, {currentUser.name.split(' ')[0]}!</h1>
            <div className="flex items-center gap-2 mt-2">
                <Clock size={14} className="text-slate-400"/>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={() => showModal('patientRegistration', { currentBranch })} className="flex items-center justify-center gap-3 px-6 py-4 bg-teal-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-teal-900/40 btn-tactile">
                <UserPlus size={16}/> New Patient
            </button>
            <button onClick={() => showModal('appointment', { onSave: handleSaveAppointment, onAddToWaitlist: handleAddToWaitlist, currentBranch })} className="flex items-center justify-center gap-3 px-6 py-4 bg-lilac-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-lilac-900/40 btn-tactile">
                <CalendarPlus size={16}/> New Appt
            </button>
            <button onClick={() => showModal('quickTriage', { currentBranch })} className="flex items-center justify-center gap-3 px-6 py-4 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-red-900/40 btn-tactile">
                <Zap size={16}/> Walk-In
            </button>
        </div>
      </div>
      
      <PracticeVitals />

      <div className="grid gap-8 items-start dashboard-grid">
        <div className="dashboard-main">
            <TodaysTimeline 
              appointments={todaysAppointments} 
              patients={patients} 
              settings={fieldSettings} 
              onUpdateStatus={handleStatusUpdate}
              disappearingApts={disappearingApts}
            />
        </div>
        <div className="dashboard-side">
            <ActionWidgets 
              dailyKPIs={dailyKPIs} 
              myTasks={myTasks} 
              onToggleTask={handleToggleTask} 
              appointments={allTodaysAppointments} 
              patients={patients} 
            />
        </div>
      </div>
    </div>
  );
};

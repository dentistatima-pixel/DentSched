import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Calendar, Search, UserPlus, CalendarPlus, ArrowRight, PieChart, Activity, DollarSign, 
  StickyNote, Plus, CheckCircle, Flag, User as UserIcon, Clock, List, 
  History, Timer, Lock, Send, Armchair, RefreshCcw, CloudOff, ShieldCheck as VerifiedIcon, 
  FileWarning, MessageSquare, Heart, Zap, Users, CheckSquare, ShieldAlert, X, FileBadge2, AlertTriangle, FileSearch, UserCheck, UserX,
  Sparkles, Loader, ClipboardCheck, Sun, Moon, Coffee
} from 'lucide-react';
import { 
  Appointment, AppointmentStatus, UserRole, Patient, 
  PinboardTask, SyncConflict, SystemStatus, User, FieldSettings, StockItem,
  ClinicalIncident, 
  RegistrationStatus
} from '../types';
import { formatDate } from '../constants';
import { useModal } from '../contexts/ModalContext';
import GlobalSearchModal from './GlobalSearchModal';

import { useAppointments } from '../contexts/AppointmentContext';
import { useStaff } from '../contexts/StaffContext';
import { useAppContext } from '../contexts/AppContext';
import { usePatient } from '../contexts/PatientContext';
import { useSettings } from '../contexts/SettingsContext';
import { useInventory } from '../contexts/InventoryContext';
import { useClinicalOps } from '../contexts/ClinicalOpsContext';
import { useNavigate } from '../contexts/RouterContext';
import { generateMorningHuddle } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';


interface DashboardProps {}

const statusTextConfig: { [key in AppointmentStatus]?: { color: string; label: string } } = {
  [AppointmentStatus.SCHEDULED]: { color: 'text-slate-500 dark:text-slate-400', label: 'Scheduled' },
  [AppointmentStatus.CONFIRMED]: { color: 'text-blue-500 dark:text-blue-400', label: 'Confirmed' },
  [AppointmentStatus.ARRIVED]: { color: 'text-orange-700 dark:text-orange-400', label: 'Arrived' },
  [AppointmentStatus.SEATED]: { color: 'text-lilac-700 dark:text-lilac-400', label: 'Seated' },
  [AppointmentStatus.TREATING]: { color: 'text-lilac-800 dark:text-lilac-300', label: 'Treating' },
  [AppointmentStatus.COMPLETED]: { color: 'text-teal-700 dark:text-teal-400', label: 'Completed' },
  [AppointmentStatus.CANCELLED]: { color: 'text-red-500 dark:text-red-400', label: 'Cancelled' },
  [AppointmentStatus.NO_SHOW]: { color: 'text-red-700 dark:text-red-400', label: 'No Show' },
};

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

const DailySchedule: React.FC<{ appointments: Appointment[], patients: Patient[], settings?: any }> = ({ appointments, patients, settings }) => {
    const navigate = useNavigate();
    const { showModal } = useModal();
    const { currentBranch } = useAppContext();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
                <Calendar size={20} className="text-teal-700 dark:text-teal-400"/>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">Today's Schedule</h3>
            </div>
            <div className="bg-bg-secondary rounded-[2.5rem] border border-border-primary shadow-sm p-4 space-y-2 max-h-[70vh] overflow-y-auto no-scrollbar">
                {appointments.length > 0 ? appointments.map(apt => {
                    const patient = apt.isBlock ? null : patients.find(p => p.id === apt.patientId);
                    
                    if (apt.isBlock || !patient) {
                         return (
                            <div key={apt.id} className="p-4 rounded-2xl flex items-center gap-4 bg-bg-tertiary">
                                <div className="w-16 shrink-0 font-black text-text-secondary text-sm">{apt.time}</div>
                                <div className="flex-1 min-w-0 truncate">
                                    <span className="font-black text-blue-700 dark:text-blue-400 text-base uppercase truncate">{apt.title}</span>
                                    <span className="text-blue-500 dark:text-blue-500 text-xs font-bold uppercase truncate ml-2">({apt.type})</span>
                                </div>
                            </div>
                        );
                    }
                    
                    const medicalAlerts = (patient.allergies?.filter(a => a !== 'None').length || 0) + (patient.medicalConditions?.filter(c => c !== 'None').length || 0);
                    const isProvisional = patient.registrationStatus === RegistrationStatus.PROVISIONAL;
                    const needsClearance = patient.medicalConditions?.some(c => (settings?.criticalRiskRegistry || []).includes(c)) && !patient.clearanceRequests?.some(r => r.status === 'Approved');

                    const config = statusTextConfig[apt.status] || { color: 'text-slate-400', label: apt.status };

                    return (
                        <div 
                            key={apt.id} 
                            onClick={() => navigate(`patients/${apt.patientId}`)}
                            className={`relative p-4 rounded-2xl flex flex-col gap-3 transition-all group cursor-pointer bg-bg-secondary hover:bg-bg-tertiary border border-border-secondary ${apt.isLate ? 'border-red-300 bg-red-50/50 dark:bg-red-900/20 dark:border-red-700' : ''}`}
                        >
                            {apt.isLate && <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-black uppercase tracking-widest animate-pulse"><Clock size={10}/> Late</div>}
                            <div className="flex items-center gap-4">
                                <div className="w-16 shrink-0 font-black text-text-primary text-sm">{apt.time}</div>
                                <div className="flex-1 min-w-0 truncate">
                                    <span className="font-black text-text-primary text-base uppercase truncate group-hover:text-teal-900 dark:group-hover:text-teal-200">{patient.name}</span>
                                    <span className="text-text-secondary text-xs font-bold uppercase truncate ml-2">({apt.type})</span>
                                </div>
                                <div className={`w-24 shrink-0 text-right text-sm font-black uppercase ${config.color}`}>{config.label}</div>
                            </div>
                            <div className="flex items-center gap-2 pl-20">
                                {medicalAlerts > 0 && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-black uppercase tracking-widest"><Heart size={10}/> Medical Alert</div>}
                                {(patient.currentBalance || 0) > 0 && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black uppercase tracking-widest"><DollarSign size={10}/> Balance Due</div>}
                                {isProvisional && <button onClick={(e) => { e.stopPropagation(); showModal('patientRegistration', { initialData: patient, currentBranch })}} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-black uppercase tracking-widest"><FileBadge2 size={10}/> Incomplete</button>}
                                {needsClearance && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-lilac-100 text-lilac-700 rounded-full text-xs font-black uppercase tracking-widest"><ShieldAlert size={10}/> Clearance</div>}
                            </div>
                        </div>
                    )
                }) : <div className="p-10 text-center text-text-secondary italic">No appointments scheduled for today.</div>}
            </div>
        </div>
    )
}

// Kanban-style Patient Flow
const PatientFlow: React.FC<{ triageQueue: Appointment[], patientFlow: any, staff: any[], patients: Patient[], onUpdateStatus: any }> = ({ triageQueue, patientFlow, staff, patients, onUpdateStatus }) => {
    const navigate = useNavigate();
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const PatientCard: React.FC<{ apt: Appointment, patient: Patient }> = ({ apt, patient }) => (
        <div 
            draggable 
            onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ appointmentId: apt.id }))}
            className="p-4 bg-white dark:bg-slate-700 rounded-2xl shadow-md border-l-4 border-orange-400 cursor-grab active:cursor-grabbing"
            onClick={() => navigate(`patients/${patient.id}`)}
        >
            <p className="font-black text-slate-800 dark:text-slate-100 uppercase text-sm">{patient.name}</p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{apt.type}</p>
        </div>
    );

    const InClinicPatientCard: React.FC<{ apt: Appointment, patient: Patient }> = ({ apt, patient }) => (
        <div 
            draggable 
            onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ appointmentId: apt.id }))}
            className="p-4 bg-white dark:bg-slate-700 rounded-2xl shadow-md border-l-4 border-lilac-400 cursor-grab active:cursor-grabbing"
            onClick={() => navigate(`patients/${patient.id}`)}
        >
            <p className="font-black text-slate-800 dark:text-slate-100 uppercase text-sm">{patient.name}</p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{apt.type}</p>
            <p className="text-xs font-bold text-lilac-600 dark:text-lilac-400 mt-2">{apt.status}</p>
        </div>
    );
    
    const FlowColumn: React.FC<{ title: string, count: number, onDropStatus?: AppointmentStatus, children: React.ReactNode, icon: React.ElementType, color: string }> = ({ title, count, onDropStatus, children, icon: Icon, color }) => (
        <div 
            onDragOver={(e) => { if (onDropStatus) { e.preventDefault(); setDragOverColumn(title); } }}
            onDragLeave={() => { if (onDropStatus) setDragOverColumn(null); }}
            onDrop={(e) => {
                if (onDropStatus) {
                    e.preventDefault();
                    setDragOverColumn(null);
                    const data = JSON.parse(e.dataTransfer.getData('application/json'));
                    if(data.appointmentId) {
                        onUpdateStatus(data.appointmentId, onDropStatus);
                    }
                }
            }}
            className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-4 transition-all ${dragOverColumn === title ? 'bg-teal-50 dark:bg-teal-900/50 ring-2 ring-teal-500' : ''}`}
        >
            <div className="flex items-center gap-2 mb-4 p-2">
                <Icon size={18} className={color}/>
                <h4 className="font-black text-sm text-slate-600 dark:text-slate-300 uppercase tracking-widest">{title}</h4>
                <span className="ml-auto bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">{count}</span>
            </div>
            <div className="space-y-3 overflow-y-auto no-scrollbar flex-1">
                {children}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
                <Users size={20} className="text-lilac-700 dark:text-lilac-400"/>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">Patient Flow</h3>
            </div>
            <div className="flex flex-col md:flex-row gap-6 h-[70vh]">
                <FlowColumn title="Waiting Room" count={patientFlow.arrived.length} icon={Armchair} color="text-orange-500">
                    {patientFlow.arrived.map((apt: Appointment) => {
                        const patient = patients.find(p => p.id === apt.patientId);
                        return patient ? <PatientCard key={apt.id} apt={apt} patient={patient}/> : null;
                    })}
                </FlowColumn>
                <FlowColumn title="In Clinic" count={patientFlow.inClinic.length} onDropStatus={AppointmentStatus.SEATED} icon={Activity} color="text-lilac-500">
                     {patientFlow.inClinic.map((apt: Appointment) => {
                        const patient = patients.find(p => p.id === apt.patientId);
                        return patient ? <InClinicPatientCard key={apt.id} apt={apt} patient={patient} /> : null;
                    })}
                </FlowColumn>
                <FlowColumn title="Ready for Checkout" count={patientFlow.needsCheckout.length} onDropStatus={AppointmentStatus.COMPLETED} icon={ClipboardCheck} color="text-teal-500">
                    {patientFlow.needsCheckout.map((apt: Appointment) => {
                        const patient = patients.find(p => p.id === apt.patientId);
                        return patient ? (
                            <div key={apt.id} className="p-4 bg-white dark:bg-slate-700 rounded-2xl shadow-md border-l-4 border-teal-400 cursor-pointer" onClick={() => navigate(`patients/${patient.id}`)}>
                                <p className="font-black text-slate-800 dark:text-slate-100 uppercase text-sm">{patient.name}</p>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{apt.type}</p>
                            </div>
                        ) : null;
                    })}
                </FlowColumn>
            </div>
        </div>
    )
}


const StatCard: React.FC<{title: string, value: string | React.ReactNode, icon: React.ElementType, color: string, onClick?: () => void}> = ({ title, value, icon: Icon, color, onClick }) => (
    <button onClick={onClick} disabled={!onClick} className={`p-6 rounded-[2rem] text-white shadow-xl hover:-translate-y-1 transition-transform w-full text-left ${color} ${!onClick ? 'cursor-default' : ''}`}>
        <div className="flex justify-between items-start">
            <div className="bg-white/20 p-3 rounded-xl"><Icon size={24}/></div>
        </div>
        <div className="mt-4">
            <p className="text-4xl font-black tracking-tighter">{value}</p>
            <p className="text-sm font-bold uppercase tracking-widest opacity-80 mt-1">{title}</p>
        </div>
    </button>
)

const ActionCenter: React.FC<{ dailyKPIs: any, actionItems: any[], myTasks: any[], onToggleTask: any, appointments: Appointment[], patients: Patient[] }> = ({ dailyKPIs, actionItems, myTasks, onToggleTask, appointments, patients }) => {
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

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-3 px-2">
                <Activity size={20} className="text-red-700 dark:text-red-400"/>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">Action Center</h3>
            </div>
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                    <StatCard title="Today's Production" value={<AnimatedCounter value={dailyKPIs.production} isCurrency={true}/>} icon={DollarSign} color="bg-teal-600 shadow-teal-900/30" />
                    <StatCard title="Patients Seen" value={<AnimatedCounter value={dailyKPIs.patientsSeen}/>} icon={UserCheck} color="bg-blue-600 shadow-blue-900/30" onClick={showCompletedList} />
                    <StatCard title="No-Shows" value={<AnimatedCounter value={dailyKPIs.noShows}/>} icon={UserX} color="bg-red-600 shadow-red-900/30" onClick={showNoShowList} />
                </div>
                
                 <div className="bg-bg-secondary rounded-[2.5rem] border border-border-primary shadow-sm p-6">
                    <h4 className="text-xs font-black text-text-secondary uppercase tracking-[0.3em] mb-4">My Tasks ({myTasks.length})</h4>
                     <div className="space-y-2">
                        {myTasks.map(task => (
                            <div key={task.id} className="flex items-start gap-3 p-3 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg group">
                                <button onClick={() => onToggleTask && onToggleTask(task.id)} className="mt-0.5 text-text-secondary hover:text-teal-700 dark:hover:text-teal-400"><CheckCircle size={16} /></button>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-text-primary leading-tight">{task.text}</div>
                                    {task.isUrgent && <div className="mt-1 flex items-center gap-1 text-[11px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-black uppercase w-fit"><Flag size={10} /> Urgent</div>}
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

const AIMorningHuddle: React.FC<{ appointments: Appointment[], patients: Patient[], currentUser: User }> = ({ appointments, patients, currentUser }) => {
    const [huddle, setHuddle] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHuddle = async () => {
            setIsLoading(true);
            try {
                // Filter appointments for the current user
                const userAppointments = appointments.filter(apt => apt.providerId === currentUser.id);
                if (userAppointments.length > 0) {
                    const huddleText = await generateMorningHuddle(userAppointments, patients);
                    setHuddle(huddleText);
                } else {
                    setHuddle("### AI Morning Huddle\n\nYou have no appointments scheduled for today.");
                }
            } catch (error) {
                console.error(error);
                setHuddle("### AI Morning Huddle\n\nCould not generate your daily briefing at this time.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchHuddle();
    }, [appointments, patients, currentUser]);

    return (
        <div className="bg-gradient-to-br from-lilac-700 to-teal-800 p-8 rounded-[2.5rem] shadow-2xl shadow-lilac-900/20 text-white relative overflow-hidden">
            <Sparkles size={128} className="absolute -top-8 -right-8 text-white/5 opacity-50" />
            <div className="relative z-10">
                {isLoading ? (
                    <div className="flex items-center gap-4">
                        <Loader className="animate-spin" size={24} />
                        <span className="font-bold text-lg">Generating your AI Morning Huddle...</span>
                    </div>
                ) : (
                    <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-lilac-100 prose-strong:text-amber-300">
                        <ReactMarkdown>{huddle || ''}</ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = () => {
  const { showModal } = useModal();
  const navigate = useNavigate();
  const { appointments, handleUpdateAppointmentStatus, handleSaveAppointment } = useAppointments();
  const { staff } = useStaff();
  const { currentUser, currentBranch } = useAppContext();
  const { patients } = usePatient();
  const { fieldSettings } = useSettings();
  const { stock } = useInventory();
  const { tasks, handleToggleTask, incidents, handleAddToWaitlist } = useClinicalOps();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
      const timer = setInterval(() => setTime(new Date()), 1000 * 60); // Update every minute
      return () => clearInterval(timer);
  }, []);
  
  const syncConflicts: SyncConflict[] = [];

  const getGreeting = () => {
      const hour = time.getHours();
      if (hour < 12) return "Good Morning";
      if (hour < 18) return "Good Afternoon";
      return "Good Evening";
  };
  
  const getPatient = (id: string) => patients.find(pt => pt.id === id);

  const todaysFullSchedule = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    return appointments
      .filter(a => a.date === todayStr && a.branch === currentBranch)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, currentBranch]);
  
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
        let priceBookId = fieldSettings?.priceBooks?.find(pb => pb.isDefault)?.id;
        if (!priceBookId) return sum;
        const priceEntry = fieldSettings?.priceBookEntries?.find(
            pbe => pbe.procedureId === proc.id && pbe.priceBookId === priceBookId
        );
        return sum + (priceEntry?.price || 0);
    }, 0);
    return {
      production: production,
      patientsSeen: completedToday.length,
      noShows: todaysFullSchedule.filter(a => a.status === AppointmentStatus.NO_SHOW).length
    };
  }, [todaysFullSchedule, fieldSettings, patients]);

  const actionItems = useMemo(() => {
    const items = [];
    if(syncConflicts.length > 0) items.push({ type: 'Sync Conflicts', count: syncConflicts.length, icon: CloudOff, action: () => navigate('admin/sync') });
    return items.sort((a,b) => b.count - a.count);
  }, [syncConflicts, navigate]);

  if (!currentUser) return null;

  const myTasks = useMemo(() => tasks.filter(t => t.assignedTo === currentUser.id && !t.isCompleted), [tasks, currentUser.id]);

  const roleBasedLayout = useMemo(() => {
    const components = {
        schedule: <DailySchedule appointments={todaysFullSchedule} patients={patients} settings={fieldSettings} />,
        flow: <PatientFlow triageQueue={triageQueue} patientFlow={patientFlow} staff={staff} patients={patients} onUpdateStatus={handleUpdateAppointmentStatus} />,
        actions: <ActionCenter dailyKPIs={dailyKPIs} actionItems={actionItems} myTasks={myTasks} onToggleTask={handleToggleTask} appointments={todaysFullSchedule} patients={patients} />,
    };

    switch (currentUser.role) {
        case UserRole.ADMIN:
            return [components.actions, components.flow, components.schedule];
        case UserRole.DENTIST:
            return [components.schedule, components.flow, components.actions];
        case UserRole.DENTAL_ASSISTANT:
            return [components.flow, components.schedule, components.actions];
        default:
            return [components.schedule, components.flow, components.actions];
    }
  }, [currentUser.role, todaysFullSchedule, patients, fieldSettings, triageQueue, patientFlow, staff, handleUpdateAppointmentStatus, dailyKPIs, actionItems, myTasks, handleToggleTask]);

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

      {currentUser && (currentUser.role === UserRole.DENTIST || currentUser.role === UserRole.SYSTEM_ARCHITECT) && (
        <AIMorningHuddle appointments={todaysFullSchedule} patients={patients} currentUser={currentUser} />
      )}

      <div className="grid gap-8 items-start dashboard-grid">
        <div className="dashboard-col-1">{roleBasedLayout[0]}</div>
        <div className="dashboard-col-2">{roleBasedLayout[1]}</div>
        <div className="dashboard-col-3">{roleBasedLayout[2]}</div>
      </div>
    </div>
  );
};

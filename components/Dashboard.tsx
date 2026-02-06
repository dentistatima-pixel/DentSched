

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calendar, Search, UserPlus, CalendarPlus, ArrowRight, PieChart, Activity, DollarSign, 
  StickyNote, Plus, CheckCircle, Flag, User as UserIcon, Clock, List, 
  History, Timer, Lock, Send, Armchair, RefreshCcw, CloudOff, ShieldCheck as VerifiedIcon, 
  FileWarning, MessageSquare, Heart, Users, CheckSquare, ShieldAlert, X, FileBadge2, AlertTriangle, FileSearch, UserCheck,
  Sparkles, Loader, ClipboardCheck, Sun, Moon, Coffee, 
  UserX
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
import { RecentPatientsWidget } from './RecentPatientsWidget';


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
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const startValue = displayValue;
    const endValue = value;
    if(startValue === endValue) return;

    const duration = 1000;
    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const currentVal = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    };

    requestAnimationFrame(animate);
    
  }, [value]);

  const formatValue = (val: number) => {
    if (isCurrency) {
        return `₱${Math.round(val).toLocaleString()}`;
    }
    return Math.round(val).toLocaleString();
  };

  return <span ref={ref}>{formatValue(displayValue)}</span>;
};

const DailySchedule: React.FC<{ appointments: Appointment[], patients: Patient[], settings?: any }> = ({ appointments, patients, settings }) => {
    const navigate = useNavigate();
    const { openModal } = useModal();
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
                                {isProvisional && <button onClick={(e) => { e.stopPropagation(); openModal('patientRegistration', { initialData: patient, currentBranch })}} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-black uppercase tracking-widest"><FileBadge2 size={10}/> Incomplete</button>}
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
    
    const FlowColumn: React.FC<{ title: string, count: number, status: AppointmentStatus, appointments: Appointment[], children: React.ReactNode, icon: React.ElementType, color: string }> = ({ title, count, status, appointments, children, icon: Icon, color }) => (
        <div 
            onDragOver={(e) => { e.preventDefault(); setDragOverColumn(title); }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => {
                e.preventDefault();
                setDragOverColumn(null);
                const data = JSON.parse(e.dataTransfer.getData('application/json'));
                if(data.appointmentId) {
                    onUpdateStatus(data.appointmentId, status);
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
                <FlowColumn title="Waiting Room" count={patientFlow.arrived.length} status={AppointmentStatus.SEATED} appointments={patientFlow.arrived} icon={Armchair} color="text-orange-500">
                    {patientFlow.arrived.map((apt: Appointment) => {
                        const patient = patients.find(p => p.id === apt.patientId);
                        return patient ? <PatientCard key={apt.id} apt={apt} patient={patient}/> : null;
                    })}
                </FlowColumn>
                <FlowColumn title="In Clinic" count={patientFlow.inClinic.length} status={AppointmentStatus.COMPLETED} appointments={patientFlow.inClinic} icon={Activity} color="text-lilac-500">
                     {patientFlow.inClinic.map((apt: Appointment) => {
                        const patient = patients.find(p => p.id === apt.patientId);
                        return patient ? (
                            <div key={apt.id} className="p-4 bg-white dark:bg-slate-700 rounded-2xl shadow-md border-l-4 border-lilac-400">
                                <p className="font-black text-slate-800 dark:text-slate-100 uppercase text-sm">{patient.name}</p>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{apt.type}</p>
                                <p className="text-xs font-bold text-lilac-600 dark:text-lilac-400 mt-2">{apt.status}</p>
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
    const { openModal } = useModal();
    const todayStr = new Date().toLocaleDateString('en-CA');
    const completedToday = appointments.filter(a => a.date === todayStr && a.status === AppointmentStatus.COMPLETED);
    const noShowsToday = appointments.filter(a => a.date === todayStr && a.status === AppointmentStatus.NO_SHOW);
    
    const showCompletedList = () => {
        const patientList = completedToday.map(apt => {
            const p = patients.find(p => p.id === apt.patientId);
            return `- ${apt.time}: ${p?.name} - *${apt.type}*`;
        }).join('\n');
        openModal('infoDisplay', { title: "Today's Completed Appointments", content: patientList || 'No completed appointments yet.' });
    };

    const showNoShowList = () => {
        const patientList = noShowsToday.map(apt => {
            const p = patients.find(p => p.id === apt.patientId);
            return `- ${apt.time}: ${p?.name} - *${apt.type}*`;
        }).join('\n');
        openModal('infoDisplay', { title: "Today's No-Shows", content: patientList || 'No no-shows recorded yet.' });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Production" value={<AnimatedCounter value={dailyKPIs.production} isCurrency={true} />} icon={DollarSign} color="bg-teal-600 shadow-teal-600/20"/>
                <StatCard title="Collections" value={<AnimatedCounter value={dailyKPIs.collections} isCurrency={true} />} icon={PieChart} color="bg-blue-600 shadow-blue-600/20"/>
                <StatCard title="Completed" value={<AnimatedCounter value={completedToday.length} />} icon={CheckCircle} color="bg-lilac-600 shadow-lilac-600/20" onClick={showCompletedList}/>
                <StatCard title="No Shows" value={<AnimatedCounter value={noShowsToday.length} />} icon={UserX} color="bg-red-600 shadow-red-600/20" onClick={showNoShowList}/>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">My Tasks</h3>
                {myTasks.length > 0 ? myTasks.map(task => (
                    <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl ${task.isUrgent ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                        <button onClick={() => onToggleTask(task.id)} className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center ${task.isCompleted ? 'bg-teal-600 border-teal-600' : 'border-slate-300 dark:border-slate-600'}`}>
                            {task.isCompleted && <CheckSquare size={14} className="text-white"/>}
                        </button>
                        <div className="flex-1">
                            <p className={`font-bold text-sm leading-tight ${task.isCompleted ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{task.text}</p>
                            {task.isUrgent && <div className="flex items-center gap-1 text-[10px] text-red-700 font-black uppercase mt-1"><Flag size={10}/> Urgent</div>}
                        </div>
                    </div>
                )) : <div className="text-center p-8 text-slate-400 italic">No tasks assigned to you.</div>}
            </div>
        </div>
    )
}

const QuickActionButton: React.FC<{onClick: () => void, icon: React.ElementType, color: string, label: string}> = ({ onClick, icon: Icon, color, label }) => (
    <button
        onClick={onClick}
        aria-label={label}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1 ${color} shadow-lg hover:shadow-2xl`}
    >
        <Icon size={32} className="text-white" />
    </button>
);

const QuickActionButtons: React.FC<{ openModal: (type: string, props?: any) => void; currentBranch: string }> = ({ openModal, currentBranch }) => {
    return (
        <div className="flex items-center gap-6 mb-6">
            <QuickActionButton
                onClick={() => openModal('quickAddPatient')}
                icon={UserPlus}
                color="bg-teal-600"
                label="New Patient"
            />
            <QuickActionButton
                onClick={() => openModal('appointment', { currentBranch })}
                icon={CalendarPlus}
                color="bg-blue-600"
                label="New Appointment"
            />
            <QuickActionButton
                onClick={() => openModal('quickTriage', { currentBranch })}
                icon={AlertTriangle}
                color="bg-red-600"
                label="Emergency Triage"
            />
        </div>
    );
};


export const Dashboard: React.FC<DashboardProps> = () => {
  const { openModal } = useModal();
  const { appointments, transitionAppointmentStatus } = useAppointments();
  const { staff } = useStaff();
  const { patients } = usePatient();
  const { fieldSettings } = useSettings();
  const { tasks, handleToggleTask } = useClinicalOps();
  const { currentUser, isOnline, systemStatus, currentBranch } = useAppContext();
  
  const [morningHuddle, setMorningHuddle] = useState<string | null>(null);
  const [isHuddleLoading, setIsHuddleLoading] = useState(false);

  const todayStr = new Date().toLocaleDateString('en-CA');
  
  const todaysAppointments = useMemo(() => {
    return appointments
      .filter(a => a.date === todayStr && a.branch === currentBranch)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, todayStr, currentBranch]);

  const patientFlow = useMemo(() => {
    const arrived = todaysAppointments.filter(a => a.status === AppointmentStatus.ARRIVED);
    const inClinic = todaysAppointments.filter(a => a.status === AppointmentStatus.SEATED || a.status === AppointmentStatus.TREATING);
    return { arrived, inClinic };
  }, [todaysAppointments]);

  const dailyKPIs = useMemo(() => {
      const completed = todaysAppointments.filter(a => a.status === AppointmentStatus.COMPLETED);
      const production = completed.reduce((sum, apt) => {
          const procedure = fieldSettings?.procedures.find(p => p.name === apt.type);
          const price = fieldSettings?.priceBookEntries?.find(pbe => pbe.procedureId === procedure?.id)?.price || 0;
          return sum + price;
      }, 0);
      return { production, collections: production * 0.85 }; // Simplified
  }, [todaysAppointments, fieldSettings]);

  const myTasks = useMemo(() => tasks.filter(t => t.assignedTo === currentUser?.id && !t.isCompleted), [tasks, currentUser]);
  
  const fetchHuddle = async () => {
    if (!currentUser || currentUser.role !== UserRole.DENTIST) return;
    setIsHuddleLoading(true);
    try {
        const huddleText = await generateMorningHuddle(todaysAppointments, patients);
        setMorningHuddle(huddleText);
    } catch (e) {
        setMorningHuddle("Error generating huddle.");
    } finally {
        setIsHuddleLoading(false);
    }
  };

  return (
    <div className="w-full h-full">
        <QuickActionButtons openModal={openModal} currentBranch={currentBranch} />
        <div className="w-full h-full dashboard-grid gap-6">
            <div className="dashboard-col-1 space-y-6">
                <ActionCenter dailyKPIs={dailyKPIs} actionItems={[]} myTasks={myTasks} onToggleTask={handleToggleTask} appointments={todaysAppointments} patients={patients}/>
                {currentUser?.role === UserRole.DENTIST && (
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">AI Huddle</h3>
                            <button onClick={fetchHuddle} disabled={isHuddleLoading} className="bg-lilac-100 text-lilac-700 px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2">
                               {isHuddleLoading ? <Loader size={14} className="animate-spin"/> : <Sparkles size={14}/>} {isHuddleLoading ? 'Generating...' : 'Generate Briefing'}
                            </button>
                        </div>
                        <div className="prose prose-sm max-w-none bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[100px]">
                            {morningHuddle ? <ReactMarkdown>{morningHuddle}</ReactMarkdown> : <p className="italic text-slate-400">Click generate to get your AI-powered morning briefing.</p>}
                        </div>
                    </div>
                )}
                <RecentPatientsWidget />
            </div>
            <div className="dashboard-col-2">
                <DailySchedule appointments={todaysAppointments} patients={patients} settings={fieldSettings} />
            </div>
            <div className="dashboard-col-3">
                 <PatientFlow triageQueue={[]} patientFlow={patientFlow} staff={staff} patients={patients} onUpdateStatus={transitionAppointmentStatus} />
            </div>
        </div>
    </div>
  );
};

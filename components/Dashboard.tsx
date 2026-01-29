
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calendar, Search, UserPlus, CalendarPlus, ArrowRight, PieChart, Activity, DollarSign, 
  StickyNote, Plus, CheckCircle, Flag, User as UserIcon, Clock, List, 
  History, Timer, Lock, Send, Armchair, RefreshCcw, CloudOff, ShieldCheck as VerifiedIcon, 
  FileWarning, MessageCircle, Heart, Zap, Users, CheckSquare, ShieldAlert, X, FileBadge2, AlertTriangle, FileSearch, UserCheck,
  Sparkles, Loader, ClipboardCheck
} from 'lucide-react';
import { 
  Appointment, AppointmentStatus, UserRole, Patient, 
  PinboardTask, SyncConflict, SystemStatus, User, FieldSettings, StockItem
} from '../types';
import { formatDate } from '../constants';
import { useModal } from '../contexts/ModalContext';
// Fix: Use default import for GlobalSearchModal as it's a default export.
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
                                    <span className="text-blue-500 dark:text-blue-500 text-[10px] font-bold uppercase truncate ml-2">({apt.type})</span>
                                </div>
                            </div>
                        );
                    }
                    
                    const medicalAlerts = (patient.allergies?.filter(a => a !== 'None').length || 0) + (patient.medicalConditions?.filter(c => c !== 'None').length || 0);
                    const isProvisional = patient.registrationStatus === 'Provisional';
                    const needsClearance = patient.medicalConditions?.some(c => (settings?.criticalRiskRegistry || []).includes(c)) && !patient.clearanceRequests?.some(r => r.status === 'Approved');

                    const config = statusTextConfig[apt.status] || { color: 'text-slate-400', label: apt.status };

                    return (
                        <div 
                            key={apt.id} 
                            onClick={() => navigate(`patients/${apt.patientId}`)}
                            className={`relative p-4 rounded-2xl flex flex-col gap-3 transition-all group cursor-pointer bg-bg-secondary hover:bg-bg-tertiary border border-border-secondary ${apt.isLate ? 'border-red-300 bg-red-50/50 dark:bg-red-900/20 dark:border-red-700' : ''}`}
                        >
                            {apt.isLate && <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-700 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse"><Clock size={10}/> Late</div>}
                            <div className="flex items-center gap-4">
                                <div className="w-16 shrink-0 font-black text-text-primary text-sm">{apt.time}</div>
                                <div className="flex-1 min-w-0 truncate">
                                    <span className="font-black text-text-primary text-base uppercase truncate group-hover:text-teal-900 dark:group-hover:text-teal-200">{patient.name}</span>
                                    <span className="text-text-secondary text-[10px] font-bold uppercase truncate ml-2">({apt.type})</span>
                                </div>
                                <div className={`w-24 shrink-0 text-right text-xs font-black uppercase ${config.color}`}>{config.label}</div>
                            </div>
                            <div className="flex items-center gap-2 pl-20">
                                {medicalAlerts > 0 && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[9px] font-black uppercase tracking-widest"><Heart size={10}/> Medical Alert</div>}
                                {(patient.currentBalance || 0) > 0 && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[9px] font-black uppercase tracking-widest"><DollarSign size={10}/> Balance Due</div>}
                                {isProvisional && <button onClick={(e) => { e.stopPropagation(); showModal('patientRegistration', { initialData: patient, currentBranch })}} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-widest"><FileBadge2 size={10}/> Incomplete</button>}
                                {needsClearance && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-lilac-100 text-lilac-700 rounded-full text-[9px] font-black uppercase tracking-widest"><ShieldAlert size={10}/> Clearance</div>}
                            </div>
                        </div>
                    )
                }) : <div className="p-10 text-center text-text-secondary italic">No appointments scheduled for today.</div>}
            </div>
        </div>
    )
}

const PatientFlow: React.FC<{ triageQueue: Appointment[], patientFlow: any, staff: any[], patients: Patient[], onUpdateStatus: any, settings: FieldSettings, stock: StockItem[] }> = ({ triageQueue, patientFlow, staff, patients, onUpdateStatus, settings, stock }) => {
    const navigate = useNavigate();
    const { showModal } = useModal();

    const handleShowPrepList = (apt: Appointment) => {
        const procedure = settings.procedures.find(p => p.name === apt.type);
        if (!procedure || (!procedure.billOfMaterials && !procedure.traySetup)) {
            showModal('infoDisplay', { 
                title: 'Preparation Info', 
                content: `### No Specific Preparation Information\n\nNo specific preparation information found for the procedure: **${apt.type}**.` 
            });
            return;
        }

        const consumables = (procedure.billOfMaterials || []).map(bomItem => {
            const stockItem = stock.find(s => s.id === bomItem.stockItemId);
            return {
                name: stockItem?.name || `Unknown Item (ID: ${bomItem.stockItemId})`,
                quantity: bomItem.quantity,
                unit: stockItem?.dispensingUnit || 'unit(s)'
            };
        });

        showModal('preparationChecklist', {
            consumables,
            traySetup: procedure.traySetup,
            procedureName: procedure.name
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
                <Users size={20} className="text-lilac-700 dark:text-lilac-400"/>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">Patient Flow Monitor</h3>
            </div>
            <div className="space-y-6">
                 {/* Triage Queue */}
                <div className="bg-bg-secondary rounded-[2.5rem] border-2 border-red-200 dark:border-red-700 shadow-lg p-6">
                    <h4 className="text-[10px] font-black text-red-800 dark:text-red-300 uppercase tracking-[0.3em] mb-4">Triage & Walk-in Queue ({triageQueue.length})</h4>
                    <div className="space-y-3">
                         {triageQueue.map(apt => {
                            const patient = patients.find(p => p.id === apt.patientId);
                            const isEmergency = apt.triageLevel === 'Level 1: Trauma/Bleeding' || apt.triageLevel === 'Level 2: Acute Pain/Swelling';
                            return (
                                <div key={apt.id} onClick={() => navigate(`patients/${apt.patientId}`)} className={`p-4 rounded-2xl flex justify-between items-center cursor-pointer hover:shadow-lg transition-all ${isEmergency ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 animate-pulse' : 'bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-200 dark:border-orange-700'}`}>
                                    <div>
                                        <div className={`font-black uppercase text-sm ${isEmergency ? 'text-red-900 dark:text-red-200' : 'text-orange-900 dark:text-orange-200'}`}>{patient?.name}</div>
                                        <div className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${isEmergency ? 'text-red-700 dark:text-red-400' : 'text-orange-700 dark:text-orange-400'}`}>{apt.type}</div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(apt.id, AppointmentStatus.SEATED); }} className="px-3 py-1 bg-white dark:bg-slate-700 text-orange-800 dark:text-orange-300 text-[9px] font-black uppercase rounded-lg border border-orange-200 dark:border-orange-700">Seat Patient</button>
                                </div>
                            )
                        })}
                        {triageQueue.length === 0 && <p className="text-xs text-text-secondary italic text-center py-4">Triage queue is empty.</p>}
                    </div>
                </div>
                {/* Waiting Room */}
                <div className="bg-bg-secondary rounded-[2.5rem] border border-border-primary shadow-sm p-6">
                    <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] mb-4">Waiting Room ({patientFlow.arrived.length})</h4>
                    <div className="space-y-3">
                        {patientFlow.arrived.map(apt => {
                            const patient = patients.find(p => p.id === apt.patientId);
                            return (
                                <div key={apt.id} onClick={() => navigate(`patients/${apt.patientId}`)} className="p-4 bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-200 dark:border-orange-700 rounded-2xl flex justify-between items-center cursor-pointer hover:shadow-lg transition-all">
                                    <div>
                                        <div className="font-black text-orange-900 dark:text-orange-200 uppercase text-sm">{patient?.name}</div>
                                        <div className="text-[9px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-widest mt-1">{apt.type}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); handleShowPrepList(apt); }} className="p-2 bg-white/50 rounded-lg text-teal-700 hover:bg-white" title="Show Preparation Checklist"><ClipboardCheck size={18}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(apt.id, AppointmentStatus.SEATED); }} className="px-3 py-1 bg-white dark:bg-slate-700 text-orange-800 dark:text-orange-300 text-[9px] font-black uppercase rounded-lg border border-orange-200 dark:border-orange-700">Seat Patient</button>
                                    </div>
                                </div>
                            )
                        })}
                        {patientFlow.arrived.length === 0 && <p className="text-xs text-text-secondary italic text-center py-4">Waiting room is empty.</p>}
                    </div>
                </div>
                 {/* In Clinic */}
                <div className="bg-bg-secondary rounded-[2.5rem] border border-border-primary shadow-sm p-6">
                    <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] mb-4">In Clinic ({patientFlow.inClinic.length})</h4>
                    <div className="space-y-3">
                        {patientFlow.inClinic.map(apt => {
                            const patient = patients.find(p => p.id === apt.patientId);
                            const provider = staff.find(s => s.id === apt.providerId);
                            return (
                                <div key={apt.id} className="p-4 bg-lilac-50 dark:bg-lilac-900/30 border-2 border-lilac-200 dark:border-lilac-700 rounded-2xl">
                                    <div className="flex justify-between items-start">
                                        <div onClick={() => navigate(`patients/${apt.patientId}`)} className="cursor-pointer">
                                            <div className="font-black text-lilac-900 dark:text-lilac-200 uppercase text-sm">{patient?.name}</div>
                                            <div className="text-[9px] font-bold text-lilac-700 dark:text-lilac-400 uppercase tracking-widest mt-1">{apt.status}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); handleShowPrepList(apt); }} className="p-2 bg-white/50 rounded-lg text-teal-700 hover:bg-white" title="Show Preparation Checklist"><ClipboardCheck size={18}/></button>
                                            {provider && (
                                                <div title={provider.name} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-600 shadow-sm bg-lilac-200 dark:bg-lilac-800 flex items-center justify-center">
                                                    <UserIcon size={16} className="text-lilac-600 dark:text-lilac-300"/>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => onUpdateStatus(apt.id, AppointmentStatus.COMPLETED)} className="w-full mt-3 py-2 bg-lilac-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-lilac-700 transition-all">Mark as Completed</button>
                                </div>
                            )
                        })}
                        {patientFlow.inClinic.length === 0 && <p className="text-xs text-text-secondary italic text-center py-4">No patients currently in treatment.</p>}
                    </div>
                </div>
            </div>
        </div>
    )
}

const ActionCenter: React.FC<{ dailyKPIs: any, actionItems: any[], myTasks: any[], onToggleTask: any }> = ({ dailyKPIs, actionItems, myTasks, onToggleTask }) => {
    return (
        <div className="space-y-6">
             <div className="flex items-center gap-3 px-2">
                <Activity size={20} className="text-red-700 dark:text-red-400"/>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">Action Center</h3>
            </div>
            <div className="space-y-6">
                <div className="bg-bg-secondary rounded-[2.5rem] border border-border-primary shadow-sm p-6">
                    <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] mb-4">Huddle Board</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-bg-tertiary p-3 rounded-lg"><span className="text-xs font-bold uppercase text-text-secondary">Today's Production</span><span className="font-black text-teal-700 dark:text-teal-400"><AnimatedCounter value={dailyKPIs.production} isCurrency={true} /></span></div>
                        <div className="flex justify-between items-center bg-bg-tertiary p-3 rounded-lg"><span className="text-xs font-bold uppercase text-text-secondary">Patients Seen</span><span className="font-black text-text-primary"><AnimatedCounter value={dailyKPIs.patientsSeen} /></span></div>
                        <div className="flex justify-between items-center bg-bg-tertiary p-3 rounded-lg"><span className="text-xs font-bold uppercase text-text-secondary">No-Shows</span><span className={`font-black ${dailyKPIs.noShows > 0 ? 'text-red-600 dark:text-red-400' : 'text-text-primary'}`}><AnimatedCounter value={dailyKPIs.noShows} /></span></div>
                    </div>
                </div>
                {actionItems.length > 0 && (
                    <div className="bg-bg-secondary rounded-[2.5rem] border-2 border-orange-200 dark:border-orange-700 shadow-lg p-6">
                        <h4 className="text-[10px] font-black text-orange-800 dark:text-orange-300 uppercase tracking-[0.3em] mb-4">Alerts & Verifications</h4>
                        <div className="space-y-2">
                            {actionItems.map(item => (
                                <button key={item.type} onClick={item.action} className="w-full p-3 bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 rounded-lg flex justify-between items-center text-left hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <item.icon size={14} className="text-orange-600 dark:text-orange-400" />
                                        <span className="text-xs font-black text-orange-900 dark:text-orange-200 uppercase">{item.type}</span>
                                    </div>
                                    <span className="font-black text-orange-700 dark:text-orange-300">{item.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                 <div className="bg-bg-secondary rounded-[2.5rem] border border-border-primary shadow-sm p-6">
                    <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] mb-4">My Tasks ({myTasks.length})</h4>
                     <div className="space-y-2">
                        {myTasks.map(task => (
                            <div key={task.id} className="flex items-start gap-3 p-3 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg group">
                                <button onClick={() => onToggleTask && onToggleTask(task.id)} className="mt-0.5 text-text-secondary hover:text-teal-700 dark:hover:text-teal-400"><CheckCircle size={16} /></button>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-text-primary leading-tight">{task.text}</div>
                                    {task.isUrgent && <div className="mt-1 flex items-center gap-1 text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-black uppercase w-fit"><Flag size={10} /> Urgent</div>}
                                </div>
                            </div>
                        ))}
                        {myTasks.length === 0 && <p className="text-xs text-text-secondary italic text-center py-4">No pending tasks.</p>}
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
  const { appointments, handleUpdateAppointmentStatus: onUpdateAppointmentStatus, handleSaveAppointment } = useAppointments();
  const { staff } = useStaff();
  const { currentUser, currentBranch } = useAppContext();
  const { patients } = usePatient();
  const { fieldSettings } = useSettings();
  const { stock } = useInventory();
  const { tasks, handleToggleTask: onToggleTask, incidents, handleAddToWaitlist } = useClinicalOps();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const syncConflicts: SyncConflict[] = [];

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

  const handleSearchNavigation = (type: 'patient' | 'action', payload?: any) => {
    setIsSearchOpen(false); // Close modal first
    if (type === 'patient') {
      navigate(`patients/${payload}`);
    } else if (type === 'action' && payload === 'newPatient') {
      showModal('patientRegistration', { currentBranch });
    } else if (type === 'action' && payload === 'newAppointment') {
      showModal('appointment', { onSave: handleSaveAppointment, onAddToWaitlist: handleAddToWaitlist, currentBranch });
    }
  }

  const roleBasedLayout = useMemo(() => {
    const components = {
        schedule: <DailySchedule appointments={todaysFullSchedule} patients={patients} settings={fieldSettings} />,
        flow: <PatientFlow triageQueue={triageQueue} patientFlow={patientFlow} staff={staff} patients={patients} onUpdateStatus={onUpdateAppointmentStatus} settings={fieldSettings!} stock={stock} />,
        actions: <ActionCenter dailyKPIs={dailyKPIs} actionItems={actionItems} myTasks={myTasks} onToggleTask={onToggleTask} />,
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
  }, [currentUser.role, todaysFullSchedule, patients, fieldSettings, triageQueue, patientFlow, staff, onUpdateAppointmentStatus, dailyKPIs, actionItems, myTasks, onToggleTask, stock]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center justify-between gap-6">
        <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter leading-none">Home</h1>
        <div className="flex items-center gap-3">
            <button onClick={() => setIsSearchOpen(true)} className="flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/40 btn-tactile" aria-label="Open global search"><Search size={16}/> Search</button>
            <button onClick={() => showModal('patientRegistration', { currentBranch })} className="flex items-center justify-center gap-3 px-6 py-3 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal-900/40 btn-tactile"><UserPlus size={16}/> New</button>
            <button onClick={() => showModal('appointment', { onSave: handleSaveAppointment, onAddToWaitlist: handleAddToWaitlist, currentBranch })} className="flex items-center justify-center gap-3 px-6 py-3 bg-lilac-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-lilac-900/40 btn-tactile"><CalendarPlus size={16}/> Appt</button>
            <button onClick={() => showModal('quickAddPatient')} className="flex items-center justify-center gap-3 px-6 py-3 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-900/40 btn-tactile"><Plus size={16}/> Quick Add</button>
            <button onClick={() => showModal('quickTriage', { currentBranch })} className="flex items-center justify-center gap-3 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-900/40 btn-tactile"><Zap size={16}/> Walk-In</button>
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
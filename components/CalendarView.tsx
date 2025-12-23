import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, LayoutGrid, List, Clock, AlertTriangle, User as UserIcon, 
  CheckCircle, Lock, Beaker, Move, GripHorizontal, CalendarDays, DollarSign, Layers, 
  Users, Plus, CreditCard, ArrowRightLeft, GripVertical, Armchair, AlertCircle, 
  CloudOff, ShieldAlert, CheckSquare, X, ShieldCheck, DollarSign as FinanceIcon, Slash, UserX
} from 'lucide-react';
import { 
  Appointment, User, UserRole, AppointmentType, AppointmentStatus, Patient, 
  LabStatus, FieldSettings, WaitlistEntry, ClinicResource, ReliabilityArchetype, UIMode 
} from '../types';
import { formatDate } from '../constants';

interface CalendarViewProps {
  appointments: Appointment[];
  staff: User[];
  onAddAppointment: (date?: string, time?: string, patientId?: string, appointmentToEdit?: Appointment) => void;
  onMoveAppointment?: (appointmentId: string, newDate: string, newTime: string, newProviderId: string, newResourceId?: string) => void;
  currentUser?: User;
  patients?: Patient[];
  currentBranch?: string;
  fieldSettings?: FieldSettings;
  uiMode?: UIMode;
}

const MOCK_WAITLIST: WaitlistEntry[] = [
    { id: 'wl_1', patientId: 'p_credit_03', patientName: 'Maria Clara', procedure: 'Restoration', durationMinutes: 60, priority: 'High', notes: 'Flexible anytime AM' },
    { id: 'wl_2', patientId: 'p_surg_04', patientName: 'Juan Dela Cruz', procedure: 'Extraction', durationMinutes: 30, priority: 'Normal', notes: 'Prefer afternoons' },
];

const ATTENDANCE_THRESHOLD = 70;

const CalendarView: React.FC<CalendarViewProps> = ({ appointments, staff, onAddAppointment, onMoveAppointment, currentUser, patients = [], currentBranch, fieldSettings, uiMode }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'agenda' | 'week'>('grid');
  const [viewDimension, setViewDimension] = useState<'provider' | 'chair'>('provider');
  const [showWaitlist, setShowWaitlist] = useState(false); 
  const [activeProviderId, setActiveProviderId] = useState<string>(currentUser?.id || '');
  const [draggedAptId, setDraggedAptId] = useState<string | null>(null);
  const [movingAptId, setMovingAptId] = useState<string | null>(null);
  
  // Waitlist Override State
  const [overrideTarget, setOverrideTarget] = useState<WaitlistEntry | null>(null);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  useEffect(() => {
      if (!activeProviderId && staff.length > 0) {
          const firstDentist = staff.find(s => s.role === UserRole.DENTIST);
          if (firstDentist) setActiveProviderId(firstDentist.id);
      }
  }, [staff, activeProviderId]);

  const next = () => {
    const nextDate = new Date(selectedDate);
    if (viewMode === 'week') nextDate.setDate(selectedDate.getDate() + 7);
    else nextDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(nextDate);
  };

  const prev = () => {
    const prevDate = new Date(selectedDate);
    if (viewMode === 'week') prevDate.setDate(selectedDate.getDate() - 7);
    else prevDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(prevDate);
  };

  const formattedDate = selectedDate.toLocaleDateString('en-CA');
  
  const displayDate = useMemo(() => {
      if (viewMode === 'week') {
          const day = selectedDate.getDay();
          const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
          const start = new Date(selectedDate);
          start.setDate(diff);
          const end = new Date(start);
          end.setDate(start.getDate() + 5); 
          return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      }
      return selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, [selectedDate, viewMode]);

  const weekDates = useMemo(() => {
      const dates = [];
      const day = selectedDate.getDay();
      const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(diff);
      for (let i = 0; i < 6; i++) {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);
          dates.push({
              dateObj: d,
              iso: d.toLocaleDateString('en-CA'),
              label: d.toLocaleDateString('en-US', { weekday: 'narrow', day: 'numeric' }),
              isToday: d.toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')
          });
      }
      return dates;
  }, [selectedDate]);

  const visibleProviders = useMemo(() => {
      if (!currentUser) return [];
      if (currentUser.role === UserRole.DENTIST && viewMode !== 'week') return [currentUser];
      let branchStaff = staff.filter(u => u.role === UserRole.DENTIST);
      if (currentBranch) branchStaff = branchStaff.filter(u => u.allowedBranches?.includes(currentBranch));
      return branchStaff;
  }, [staff, currentBranch, currentUser, viewMode]);

  const visibleResources = useMemo(() => {
      if (!fieldSettings?.resources) return [];
      return fieldSettings.resources.filter(r => r.branch === currentBranch);
  }, [fieldSettings, currentBranch]);

  const filteredAppointments = useMemo(() => {
      if (viewMode === 'week') {
          const weekIsos = weekDates.map(d => d.iso);
          return appointments.filter(a => weekIsos.includes(a.date) && (a.providerId === activeProviderId || a.isBlock));
      } else {
          const visibleIds = visibleProviders.map(p => p.id);
          const visibleResIds = visibleResources.map(r => r.id);
          return appointments.filter(a => a.date === formattedDate && (a.isBlock || visibleIds.includes(a.providerId) || (a.resourceId && visibleResIds.includes(a.resourceId))));
      }
  }, [appointments, viewMode, formattedDate, weekDates, activeProviderId, visibleProviders, visibleResources]);

  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM
  const getPatient = (id: string) => patients.find(p => p.id === id);

  const getBehavioralIcon = (p?: Patient) => {
    if (!p) return null;
    if (p.reliabilityScore !== undefined && p.reliabilityScore < 60) return <UserX size={12} className="text-red-600" />;
    return <ShieldCheck size={12} className="text-teal-500" />;
  };

  const getAppointmentBaseStyle = (type: AppointmentType, status: AppointmentStatus, isPendingSync?: boolean, entryMode?: string) => {
     let styles = { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-900' };
     if (status === AppointmentStatus.ARRIVED) styles = { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-900' };
     else if (status === AppointmentStatus.SEATED) styles = { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900' };
     else if (status === AppointmentStatus.TREATING) styles = { bg: 'bg-lilac-50', border: 'border-lilac-300', text: 'text-lilac-900' };
     return styles;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-3 border-b border-slate-100 flex flex-col gap-3 shrink-0 bg-white z-20 relative">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl shadow-inner flex-1">
                    <button onClick={prev} className="p-2 hover:bg-white rounded-lg text-slate-600"><ChevronLeft size={18} /></button>
                    <h2 className="text-xs font-black text-slate-800 flex-1 text-center uppercase tracking-tighter">{displayDate}</h2>
                    <button onClick={next} className="p-2 hover:bg-white rounded-lg text-slate-600"><ChevronRight size={18} /></button>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}><LayoutGrid size={16} /></button>
                    <button onClick={() => setViewMode('week')} className={`p-2 rounded-lg transition-all ${viewMode === 'week' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}><CalendarDays size={16} /></button>
                </div>
            </div>
            <div className="flex items-center justify-between gap-2">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 flex-1">
                    <button onClick={() => setViewDimension('provider')} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${viewDimension === 'provider' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500'}`}>Practitioners</button>
                    <button onClick={() => setViewDimension('chair')} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${viewDimension === 'chair' ? 'bg-lilac-600 text-white shadow-md' : 'text-slate-500'}`}>Bays</button>
                </div>
                <button onClick={() => setShowWaitlist(true)} className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 flex items-center gap-1 text-[10px] font-black uppercase"><Users size={14}/> Waitlist</button>
            </div>
        </div>

        <div className="flex-1 overflow-auto bg-white relative no-scrollbar">
            <div className="min-w-max flex flex-col h-full">
                {/* STICKY COLUMN HEADERS */}
                <div className="flex border-b border-slate-100 sticky top-0 z-30 bg-white shadow-sm">
                    <div className="w-12 flex-shrink-0 bg-slate-50 border-r border-slate-100 sticky left-0 z-40"></div> 
                    {(viewMode === 'week' ? weekDates : (viewDimension === 'provider' ? visibleProviders : visibleResources)).map((col: any) => (
                        <div key={col.id || col.iso} className="w-[120px] sm:w-[180px] flex-shrink-0 p-2 border-r border-slate-100 text-center bg-slate-50/50">
                            <div className="text-[10px] font-black text-slate-800 truncate uppercase tracking-tighter">
                                {viewMode === 'week' ? col.label : col.name}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col flex-1">
                    {timeSlots.map(hour => (
                        <div key={hour} className="flex min-h-[100px] border-b border-slate-50">
                            <div className="w-12 flex-shrink-0 flex justify-center pt-2 border-r border-slate-100 bg-slate-50/90 backdrop-blur-sm text-[9px] font-black text-slate-400 sticky left-0 z-20">
                                {hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'P' : 'A'}
                            </div>

                            {(viewMode === 'week' ? weekDates : (viewDimension === 'provider' ? visibleProviders : visibleResources)).map((col: any) => {
                                const colId = viewMode === 'week' ? activeProviderId : col.id;
                                const dateIso = viewMode === 'week' ? col.iso : formattedDate;
                                const slotAppointments = filteredAppointments.filter(a => {
                                    const matchesDate = a.date === dateIso;
                                    const matchesHour = parseInt(a.time.split(':')[0]) === hour;
                                    const matchesCol = viewMode === 'week' ? a.providerId === activeProviderId : (viewDimension === 'provider' ? a.providerId === colId : a.resourceId === colId);
                                    return matchesDate && matchesHour && matchesCol;
                                });
                            
                                return (
                                    <div key={`${col.id || col.iso}-${hour}`} className="w-[120px] sm:w-[180px] flex-shrink-0 border-r border-slate-100 p-1 relative hover:bg-slate-50/50" onClick={() => onAddAppointment(dateIso, `${hour}:00`)}>
                                        {slotAppointments.map(apt => {
                                            const p = getPatient(apt.patientId);
                                            const styles = getAppointmentBaseStyle(apt.type as AppointmentType, apt.status);
                                            return (
                                                <div key={apt.id} onClick={(e) => { e.stopPropagation(); onAddAppointment(undefined, undefined, undefined, apt); }} className={`rounded-lg p-1.5 text-[9px] border shadow-sm transition-all mb-1 ${styles.bg} ${styles.border} ${styles.text}`}>
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <span className="font-bold opacity-75">{apt.time}</span>
                                                        {getBehavioralIcon(p)}
                                                    </div>
                                                    <div className="font-black truncate uppercase tracking-tighter">{p?.name || 'Block'}</div>
                                                    <div className="text-[7px] font-bold opacity-50 truncate uppercase">{apt.type}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* --- WAITLIST SIDE PANEL - Full Screen Drawer for Mobile --- */}
      {showWaitlist && (
          <>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 animate-in fade-in" onClick={() => setShowWaitlist(false)} />
            <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white border-l border-slate-200 shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col pt-safe">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-teal-100 p-2 rounded-xl text-teal-700"><Users size={20}/></div>
                        <h3 className="font-black text-slate-800 uppercase tracking-tight">Waitlist Engine</h3>
                    </div>
                    <button onClick={() => setShowWaitlist(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                    {MOCK_WAITLIST.map(entry => (
                        <div key={entry.id} className="p-4 rounded-3xl border-2 border-slate-100 bg-white hover:border-teal-400 transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-black text-slate-800 uppercase text-xs sm:text-sm leading-tight">{entry.patientName}</h4>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase border border-teal-100">Priority: {entry.priority}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => { onAddAppointment(formattedDate, undefined, entry.patientId); setShowWaitlist(false); }}
                                className="w-full mt-3 py-3 bg-teal-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-teal-600/20 active:scale-95 transition-all"
                            >
                                Assign Slot
                            </button>
                        </div>
                    ))}
                </div>
            </div>
          </>
      )}
    </div>
  );
};

export default CalendarView;
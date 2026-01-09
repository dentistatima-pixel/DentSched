import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, LayoutGrid, List, Clock, AlertTriangle, User as UserIcon, 
  CheckCircle, Lock, Beaker, Move, GripHorizontal, CalendarDays, DollarSign, Layers, 
  Users, Plus, CreditCard, ArrowRightLeft, GripVertical, Armchair, AlertCircle, 
  CloudOff, ShieldAlert, CheckSquare, X, ShieldCheck, DollarSign as FinanceIcon, Key
} from 'lucide-react';
import { 
  Appointment, User, UserRole, AppointmentType, AppointmentStatus, Patient, 
  LabStatus, FieldSettings, WaitlistEntry, ClinicResource 
} from '../types';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';

interface CalendarViewProps {
  appointments: Appointment[];
  staff: User[];
  onAddAppointment: (date?: string, time?: string, patientId?: string, appointmentToEdit?: Appointment) => void;
  onMoveAppointment?: (appointmentId: string, newDate: string, newTime: string, newProviderId: string, newResourceId?: string) => void;
  currentUser?: User;
  patients?: Patient[];
  currentBranch?: string;
  fieldSettings?: FieldSettings;
}

const MOCK_WAITLIST: WaitlistEntry[] = [
    { id: 'wl_1', patientId: 'p_credit_03', patientName: 'Maria Clara', procedure: 'Restoration', durationMinutes: 60, priority: 'High', notes: 'Flexible anytime AM' },
    { id: 'wl_2', patientId: 'p_surg_04', patientName: 'Juan Dela Cruz', procedure: 'Extraction', durationMinutes: 30, priority: 'Normal', notes: 'Prefer afternoons' },
    { id: 'wl_3', patientId: 'p_full_perio_02', patientName: 'Sofia Reyes', procedure: 'Cleaning', durationMinutes: 45, priority: 'Low', notes: 'Short notice ok' },
    { id: 'wl_4', patientId: 'p_debt_09', patientName: 'Ronnie Runner', procedure: 'Root Canal', durationMinutes: 60, priority: 'High', notes: 'Emergency opening requested' },
];

const RELIABILITY_THRESHOLD = 70;

const CalendarView: React.FC<CalendarViewProps> = ({ appointments, staff, onAddAppointment, onMoveAppointment, currentUser, patients = [], currentBranch, fieldSettings }) => {
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'agenda' | 'week'>('grid');
  const [viewDimension, setViewDimension] = useState<'provider' | 'chair'>('provider');
  const [showWaitlist, setShowWaitlist] = useState(false); 
  const [activeProviderId, setActiveProviderId] = useState<string>(currentUser?.id || '');
  
  // Waitlist Override State
  const [overrideTarget, setOverrideTarget] = useState<WaitlistEntry | null>(null);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [managerPin, setManagerPin] = useState('');

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
          return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
      return selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
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
              label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
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

  const timeSlots = Array.from({ length: 16 }, (_, i) => i + 7); 
  const getPatient = (id: string) => patients.find(p => p.id === id);

  const getAppointmentBaseStyle = (type: AppointmentType, status: AppointmentStatus, isPendingSync?: boolean, entryMode?: string) => {
     let styles = { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-900', icon: 'text-slate-600' };
     if (status === AppointmentStatus.ARRIVED) styles = { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-900', icon: 'text-orange-700' };
     else if (status === AppointmentStatus.SEATED) styles = { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900', icon: 'text-blue-700' };
     else if (status === AppointmentStatus.TREATING) styles = { bg: 'bg-lilac-50', border: 'border-lilac-300', text: 'text-lilac-900', icon: 'text-lilac-700' };
     else {
        switch(type) {
            case AppointmentType.ROOT_CANAL: case AppointmentType.EXTRACTION: case AppointmentType.SURGERY: styles = { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', icon: 'text-red-600' }; break;
            case AppointmentType.ORAL_PROPHYLAXIS: case AppointmentType.WHITENING: styles = { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900', icon: 'text-teal-700' }; break;
        }
     }
     return styles;
  };

  const executeOverride = () => {
      if (overrideTarget && selectedManagerId && managerPin === '1234') {
          onAddAppointment(formattedDate, undefined, overrideTarget.patientId);
          toast.success("Manager Override Verified. Appointment Queued.");
          setOverrideTarget(null);
          setManagerPin('');
      } else if (managerPin !== '1234') {
          toast.error("Invalid Manager PIN.");
      }
  };

  return (
    <div className="flex flex-row h-full bg-slate-50 gap-4 relative overflow-hidden">
      <div className={`flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 transition-all ${showWaitlist ? 'mr-72' : 'mr-0'}`}>
        <div className="p-2.5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-3 shrink-0 bg-white z-20 relative">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl shadow-inner border border-slate-200">
                    <button onClick={prev} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-700"><ChevronLeft size={16} /></button>
                    <h2 className="text-[11px] font-black uppercase text-slate-800 min-w-[140px] text-center tracking-tight">{displayDate}</h2>
                    <button onClick={next} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-700"><ChevronRight size={16} /></button>
                </div>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200" role="group">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-teal-800' : 'text-slate-600'}`}><LayoutGrid size={14} /></button>
                    <button onClick={() => setViewMode('week')} className={`p-1.5 rounded-md transition-all ${viewMode === 'week' ? 'bg-white shadow text-teal-800' : 'text-slate-600'}`}><CalendarDays size={14} /></button>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {viewMode === 'grid' && (
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200" role="group">
                        <button onClick={() => setViewDimension('provider')} className={`px-2 py-1 rounded-md text-[9px] font-black uppercase transition-all ${viewDimension === 'provider' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600'}`}>Doctors</button>
                        <button onClick={() => setViewDimension('chair')} className={`px-2 py-1 rounded-md text-[9px] font-black uppercase transition-all ${viewDimension === 'chair' ? 'bg-lilac-600 text-white shadow-md' : 'text-slate-600'}`}>Chairs</button>
                    </div>
                )}
                 <button onClick={() => setShowWaitlist(!showWaitlist)} className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-[10px] font-black uppercase ${showWaitlist ? 'bg-teal-600 text-white border-teal-700 shadow-lg' : 'bg-white border-slate-300 text-slate-700 hover:border-teal-600'}`}><Users size={12}/> Waitlist</button>
            </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto bg-white relative no-scrollbar">
            <div className="min-w-max h-full flex flex-col">
                <div className="flex border-b border-slate-200 sticky top-0 z-30 bg-white">
                    <div className="w-12 flex-shrink-0 bg-slate-50 border-r border-slate-200 sticky left-0 z-40"></div> 
                    {(viewMode === 'week' ? weekDates : (viewDimension === 'provider' ? visibleProviders : visibleResources)).map((col: any) => (
                        <div key={col.id || col.iso} className={`w-[150px] flex-shrink-0 p-2 border-r border-slate-200 text-center ${col.isToday ? 'bg-teal-50/50' : 'bg-slate-50'}`}>
                            <div className="flex flex-col items-center">
                                {col.avatar && <img src={col.avatar} alt="" className="w-6 h-6 rounded-full mb-1 border shadow-sm" />}
                                <div className="text-[10px] font-black uppercase tracking-tight text-slate-800 truncate w-full">{col.label || col.name}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col flex-1">
                    {timeSlots.map(hour => (
                        <div key={hour} className="flex min-h-[80px] border-b border-slate-100">
                            <div className="w-12 flex-shrink-0 flex justify-center pt-2 border-r border-slate-200 bg-slate-50/90 backdrop-blur-sm text-[9px] font-black text-slate-500 sticky left-0 z-20">
                                {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
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
                                    <div key={`${col.id || col.iso}-${hour}`} className="w-[150px] flex-shrink-0 border-r border-slate-100 p-1 relative hover:bg-slate-50/50" onClick={() => onAddAppointment(dateIso, `${hour.toString().padStart(2, '0')}:00`)}>
                                        {slotAppointments.map(apt => {
                                            const patient = getPatient(apt.patientId);
                                            const styles = getAppointmentBaseStyle(apt.type as AppointmentType, apt.status);
                                            return (
                                                <div key={apt.id} onClick={(e) => { e.stopPropagation(); onAddAppointment(undefined, undefined, undefined, apt); }} className={`rounded-xl p-2 text-[9px] border transition-all mb-1 ${styles.bg} ${styles.border} ${styles.text}`}>
                                                    <div className="font-black truncate uppercase">{patient?.name || 'Administrative Block'}</div>
                                                    <div className="text-[8px] opacity-70 truncate uppercase">{apt.type}</div>
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
    </div>
  );
};

export default CalendarView;
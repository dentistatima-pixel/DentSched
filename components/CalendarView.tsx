import React,
{ useState, useEffect, useRef, useMemo, useContext } from 'react';
import { 
  ChevronLeft, ChevronRight, LayoutGrid, List, Clock, AlertTriangle, User as UserIcon, 
  CheckCircle, Lock, Beaker, Move, GripHorizontal, CalendarDays, DollarSign, Layers, 
  Users, Plus, CreditCard, ArrowRightLeft, GripVertical, Armchair, AlertCircle, 
  CloudOff, ShieldAlert, CheckSquare, X, ShieldCheck, DollarSign as FinanceIcon, Key, Edit, Users2, Shield, Droplet, Heart, Sparkles
} from 'lucide-react';
import { 
  Appointment, User, UserRole, AppointmentStatus, Patient, 
  LabStatus, WaitlistEntry, ClinicResource, DentalChartEntry
} from '../types';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';
import { useModal } from '../contexts/ModalContext';
import { useAppContext } from '../contexts/AppContext';
import { useAppointments } from '../contexts/AppointmentContext';
import { useStaff } from '../contexts/StaffContext';
import { usePatient } from '../contexts/PatientContext';
import { useSettings } from '../contexts/SettingsContext';
import { useClinicalOps } from '../contexts/ClinicalOpsContext';
import { useNavigate } from '../contexts/RouterContext';
import { generateSafetyBriefing } from '../services/geminiService';
import AppointmentStatusPipeline from './AppointmentStatusPipeline';

interface CalendarViewProps {}

const CalendarAppointment = React.memo(({ apt, patient, provider, styles, onMouseDown, onMouseUp, onDoubleClick, viewDimension }: any) => {
    if (!patient && !apt.isBlock) return null;
    if(apt.isBlock) {
      return (
          <div className="rounded-xl p-3 bg-slate-100 border-2 border-slate-200 text-slate-500 cursor-not-allowed">
              <div className="font-black text-sm uppercase tracking-tight truncate">{apt.title}</div>
              <div className="text-xs uppercase font-bold text-slate-400 mt-1 truncate">{apt.type}</div>
          </div>
      )
    }
    return (
        <div 
            draggable
            onDragStart={(e) => { 
                e.dataTransfer.setData('application/json', JSON.stringify({ appointmentId: apt.id })) 
            }}
            onMouseDown={(e) => onMouseDown(e, apt, patient)} 
            onMouseUp={(e) => onMouseUp(e, apt, patient)}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(apt); }}
            className={`rounded-xl p-3 text-xs border-2 cursor-grab active:cursor-grabbing hover:shadow-xl transition-all mb-2 ${styles.bg} ${styles.border} ${styles.text}`} role="button" aria-label={`Actions for ${patient?.name || 'Admin Block'}`}>
            <div className="flex justify-between items-center mb-2">
                <span className="font-black text-slate-600">{apt.time}</span>
                <div className="flex items-center gap-1">
                    {apt.isWaitlistOverride && <span title="Booked from Waitlist (Manager Override)"><ShieldAlert size={14} className="text-red-700 animate-pulse"/></span>}
                    {apt.entryMode === 'MANUAL' && <span title="Manual Downtime Entry"><AlertTriangle size={12} className="text-yellow-700 animate-pulse"/></span>}
                    {apt.isPendingSync && <span title="Pending Offline Sync"><CloudOff size={12} className="text-lilac-700 animate-pulse"/></span>}
                    {viewDimension === 'chair' && provider && 
                        <div className="w-5 h-5 rounded-full border border-white bg-teal-100 text-teal-700 flex items-center justify-center text-[8px] font-black" title={provider.name}>
                            {provider.name.replace('Dr. ', '').split(' ').map((n: string) => n[0]).join('').substring(0,2)}
                        </div>
                    }
                </div>
            </div>
            <div className="font-black text-sm uppercase tracking-tight truncate">{patient?.name || 'Clinical Block'}</div>
            <div className="text-xs uppercase font-black text-slate-500 mt-1 truncate">{apt.type}</div>
        </div>
    );
});

const CalendarSlot = React.memo(({ colId, hour, dateIso, appointmentsForSlot, onSlotClick, onDrop, onDragEnter, onDragLeave, isDragOver, patientGetter, staffGetter, onAptMouseDown, onAptMouseUp, onAptDoubleClick, viewDimension, getAppointmentBaseStyle }: any) => {
    return (
        <div 
            role="gridcell" 
            aria-label={`Add appointment for ${dateIso} at ${hour}:00`} 
            className={`h-[120px] flex-shrink-0 border-r border-slate-100 p-2 relative transition-colors ${isDragOver ? 'bg-teal-50 border-2 border-teal-500' : 'hover:bg-slate-50/50'}`}
            onDoubleClick={() => onSlotClick(colId, hour, dateIso)}
            onDragOver={e => e.preventDefault()}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {appointmentsForSlot.map((apt: Appointment) => {
                const patient = patientGetter(apt.patientId);
                const provider = staffGetter(apt.providerId);
                const styles = getAppointmentBaseStyle(apt.type, apt.status, apt.isPendingSync, apt.entryMode);
                return <CalendarAppointment key={apt.id} apt={apt} patient={patient} provider={provider} styles={styles} onMouseDown={onAptMouseDown} onMouseUp={onAptMouseUp} onDoubleClick={onAptDoubleClick} viewDimension={viewDimension} />;
            })}
        </div>
    );
});


const CalendarColumn = React.memo(({ col, appointmentsForCol, timeSlots, viewDimension, dateIso, onSlotClick, onDrop, onDragEnter, onDragLeave, dragOverInfo, patientGetter, staffGetter, onAptMouseDown, onAptMouseUp, onAptDoubleClick, getAppointmentBaseStyle, viewMode }: any) => {
    const colId = viewMode === 'week' ? col.providerId : col.id;
    return (
        <div className={`${viewMode === 'week' ? 'w-[200px]' : 'w-[240px]'} flex-shrink-0 border-r border-slate-100`}>
            {timeSlots.map((hour: number) => {
                const appointmentsForSlot = appointmentsForCol.filter((a: Appointment) => parseInt(a.time.split(':')[0]) === hour);
                const isDragOver = dragOverInfo?.colId === colId && dragOverInfo?.hour === hour && dragOverInfo?.dateIso === dateIso;
                return <CalendarSlot key={hour} colId={colId} hour={hour} dateIso={dateIso} appointmentsForSlot={appointmentsForSlot} onSlotClick={onSlotClick} onDrop={(e: any) => onDrop(e, colId, hour, dateIso)} onDragEnter={() => onDragEnter({colId, hour, dateIso})} onDragLeave={onDragLeave} isDragOver={isDragOver} patientGetter={patientGetter} staffGetter={staffGetter} onAptMouseDown={onAptMouseDown} onAptMouseUp={onAptMouseUp} onAptDoubleClick={onAptDoubleClick} viewDimension={viewDimension} getAppointmentBaseStyle={getAppointmentBaseStyle} />;
            })}
        </div>
    );
});


const CalendarView: React.FC<CalendarViewProps> = () => {
  const toast = useToast();
  const { openModal: showModal } = useModal();
  const navigate = useNavigate();

  const { currentUser, currentBranch } = useAppContext();
  const { appointments, handleMoveAppointment: onMoveAppointment, transitionAppointmentStatus, handleSaveAppointment } = useAppointments();
  const { staff } = useStaff();
  const { patients } = usePatient();
  const { fieldSettings } = useSettings();
  const { waitlist, handleAddToWaitlist } = useClinicalOps();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'agenda' | 'week'>('grid');
  const [viewDimension, setViewDimension] = useState<'provider' | 'chair'>('provider');
  const [showWaitlist, setShowWaitlist] = useState(false); 
  const [activeProviderId, setActiveProviderId] = useState<string>(currentUser?.id || '');
  
  const [peeked, setPeeked] = useState<{ apt: Appointment, patient: Patient, target: HTMLElement } | null>(null);
  const [inspected, setInspected] = useState<{ apt: Appointment, patient: Patient } | null>(null);
  const longPressTimer = useRef<number | null>(null);

  const [overrideTarget, setOverrideTarget] = useState<WaitlistEntry | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [managerPin, setManagerPin] = useState('');
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  const [dragOverInfo, setDragOverInfo] = useState<{colId: string, hour: number, dateIso: string} | null>(null);


  useEffect(() => {
      if (!activeProviderId && staff.length > 0) {
          const firstDentist = staff.find(s => s.role === UserRole.DENTIST);
          if (firstDentist) setActiveProviderId(firstDentist.id);
      }
  }, [staff, activeProviderId]);
  
  useEffect(() => {
    const handleGlobalClick = () => {
      if (peeked) setPeeked(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [peeked]);

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

    if (currentUser.role === UserRole.DENTIST && viewMode !== 'week') {
        const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'short' });
        if (currentUser.roster?.[dayOfWeek] === currentBranch) {
            return [currentUser];
        }
        return [];
    }

    const branchStaff = staff.filter(u => 
        u.role === UserRole.DENTIST &&
        u.allowedBranches.includes(currentBranch)
    );
    
    return branchStaff;
  }, [staff, currentBranch, currentUser, viewMode, selectedDate]);

  const visibleResources = useMemo(() => {
      if (!fieldSettings?.resources) return [];
      return fieldSettings.resources.filter(r => r.branch === currentBranch);
  }, [fieldSettings, currentBranch]);

  const authorizedManagers = useMemo(() => {
    return staff.filter(s => s.role === UserRole.ADMIN || s.role === UserRole.DENTIST);
  }, [staff]);

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach(apt => {
        const list = map.get(apt.date) || [];
        list.push(apt);
        map.set(apt.date, list);
    });
    return map;
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
      if (viewMode === 'week') {
          const weekApts = weekDates.flatMap(d => appointmentsByDate.get(d.iso) || []);
          return weekApts.filter(a => a.providerId === activeProviderId || a.isBlock);
      } else {
          const dayApts = appointmentsByDate.get(formattedDate) || [];
          const visibleIds = visibleProviders.map(p => p.id);
          const visibleResIds = visibleResources.map(r => r.id);
          return dayApts.filter(a => a.isBlock || visibleIds.includes(a.providerId) || (a.resourceId && visibleResIds.includes(a.resourceId)));
      }
  }, [appointmentsByDate, viewMode, formattedDate, weekDates, activeProviderId, visibleProviders, visibleResources]);

  const timeSlots = Array.from({ length: 16 }, (_, i) => i + 7); 
  const getPatient = (id: string) => patients.find(p => p.id === id);

  const getAppointmentBaseStyle = (type: string, status: AppointmentStatus, isPendingSync?: boolean, entryMode?: string) => {
     let styles = { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-900', icon: 'text-slate-600' };
     if (status === AppointmentStatus.ARRIVED) styles = { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-900', icon: 'text-orange-700' };
     else if (status === AppointmentStatus.SEATED) styles = { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900', icon: 'text-blue-700' };
     else if (status === AppointmentStatus.TREATING) styles = { bg: 'bg-lilac-50', border: 'border-lilac-300', text: 'text-lilac-900', icon: 'text-lilac-700' };
     else {
        const typeLower = type.toLowerCase();
        if (typeLower.includes('surg') || typeLower.includes('extract') || typeLower.includes('root canal')) {
            styles = { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', icon: 'text-red-600' };
        } else if (typeLower.includes('prophylaxis') || typeLower.includes('whitening')) {
            styles = { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900', icon: 'text-teal-700' };
        }
     }

     if (entryMode === 'MANUAL') {
         return { ...styles, bg: `${styles.bg} bg-[repeating-linear-gradient(45deg,rgba(251,191,36,0.1),rgba(251,191,36,0.1)_5px,transparent_5px,transparent_10px)] border-yellow-600` };
     }

     if (isPendingSync) {
         return { ...styles, bg: `${styles.bg} bg-[repeating-linear-gradient(45deg,rgba(192,38,211,0.1),rgba(192,38,211,0.1)_5px,transparent_5px,transparent_10px)] border-lilac-600` };
     }

     return styles;
  };

  const handleSlotClick = (colId: string, hour: number, dateIso: string) => {
      // FIX: The properties 'providerId' and 'resourceId' did not exist on the props object.
      // Conditionally add them based on the viewDimension.
      const props = {
          initialDate: dateIso,
          initialTime: `${hour.toString().padStart(2,'0')}:00`,
          onSave: handleSaveAppointment,
          onAddToWaitlist: handleAddToWaitlist,
          currentBranch,
          ...(viewDimension === 'provider' && { providerId: colId }),
          ...(viewDimension === 'chair' && { resourceId: colId }),
      };
      showModal('appointment', props);
  };
  
  const handleAptDoubleClick = (apt: Appointment) => {
    navigate(`patients/${apt.patientId}`);
  };

  const handleAptMouseDown = (e: React.MouseEvent, apt: Appointment, patient: Patient) => {
    if (e.button !== 0) return;
    longPressTimer.current = window.setTimeout(() => {
      setPeeked({ apt, patient, target: e.currentTarget as HTMLElement });
    }, 500);
  };

  const handleAptMouseUp = (e: React.MouseEvent, apt: Appointment, patient: Patient) => {
    if(longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
    }
    if (!peeked) {
        setInspected({ apt, patient });
    }
  };
  
  const handleDrop = (e: React.DragEvent, colId: string, hour: number, dateIso: string) => {
      setDragOverInfo(null);
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.appointmentId) {
          const newTime = `${hour.toString().padStart(2, '0')}:00`;
          const newProviderId = viewDimension === 'provider' ? colId : appointments.find(a => a.id === data.appointmentId)!.providerId;
          const newResourceId = viewDimension === 'chair' ? colId : appointments.find(a => a.id === data.appointmentId)!.resourceId;
          onMoveAppointment(data.appointmentId, dateIso, newTime, newProviderId, newResourceId);
      }
  };

  const staffGetter = (id: string) => staff.find(s => s.id === id);

  return (
    <div className="h-full flex flex-col relative">
       {/* Calendar Header */}
       <div className="flex-shrink-0 flex justify-between items-center bg-white p-4 rounded-t-[2.5rem]">
           <div className="flex items-center gap-4">
               <button onClick={prev}><ChevronLeft/></button>
               <h2 className="text-xl font-bold">{displayDate}</h2>
               <button onClick={next}><ChevronRight/></button>
           </div>
           <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
               <button onClick={() => setViewMode('grid')} className={`px-3 py-1 text-sm rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}><LayoutGrid/></button>
               <button onClick={() => setViewMode('agenda')} className={`px-3 py-1 text-sm rounded ${viewMode === 'agenda' ? 'bg-white shadow' : ''}`}><List/></button>
               {viewMode === 'week' ? <button onClick={() => setViewMode('grid')} className="px-3 py-1 text-sm rounded bg-white shadow"><List/></button> : null }
           </div>
       </div>

       {/* Grid View */}
       <div className="flex-1 overflow-auto bg-white rounded-b-[2.5rem]">
            <div className="flex min-w-max">
                {/* Time Column */}
                <div className="w-20 flex-shrink-0 border-r border-slate-100">
                    <div className="h-10"></div>
                    {timeSlots.map(hour => <div key={hour} className="h-[120px] text-center text-xs text-slate-400 font-bold border-t border-slate-100 p-2">{hour}:00</div>)}
                </div>
                {/* Columns */}
                {viewMode === 'grid' && (viewDimension === 'provider' ? visibleProviders : visibleResources).map(col => {
                    const appointmentsForCol = filteredAppointments.filter(a => (viewDimension === 'provider' ? a.providerId : a.resourceId) === col.id);
                    return <CalendarColumn key={col.id} col={col} appointmentsForCol={appointmentsForCol} timeSlots={timeSlots} dateIso={formattedDate} onSlotClick={handleSlotClick} onDrop={handleDrop} onDragEnter={setDragOverInfo} onDragLeave={() => setDragOverInfo(null)} dragOverInfo={dragOverInfo} patientGetter={getPatient} staffGetter={staffGetter} onAptMouseDown={handleAptMouseDown} onAptMouseUp={handleAptMouseUp} onAptDoubleClick={handleAptDoubleClick} viewDimension={viewDimension} getAppointmentBaseStyle={getAppointmentBaseStyle} viewMode="grid"/>
                })}
            </div>
       </div>

       {/* Inspector Panel */}
       <AppointmentInspector 
          appointment={inspected?.apt || null}
          patient={inspected?.patient || null}
          onClose={() => setInspected(null)}
          onEdit={(apt) => showModal('appointment', { existingAppointment: apt, onSave: handleSaveAppointment, onAddToWaitlist: handleAddToWaitlist, currentBranch })}
          onMove={(aptId) => console.log('move', aptId)}
          onUpdateStatus={transitionAppointmentStatus}
          onDelete={(aptId) => console.log('delete', aptId)}
          onGenerateSafetyBriefing={() => {}}
          isBriefingLoading={false}
          safetyBriefing={null}
       />
    </div>
  );
};


const AppointmentInspector: React.FC<{
  appointment: Appointment | null,
  patient: Patient | null,
  onClose: () => void,
  onEdit: (apt: Appointment) => void,
  onMove: (aptId: string) => void,
  onUpdateStatus: (aptId: string, newStatus: AppointmentStatus) => void,
  onDelete: (aptId: string) => void,
  onGenerateSafetyBriefing: (patient: Patient, procedureType: string) => void,
  isBriefingLoading: boolean,
  safetyBriefing: string | null,
}> = ({ appointment, patient, onClose, onEdit, onMove, onUpdateStatus, onDelete, onGenerateSafetyBriefing, isBriefingLoading, safetyBriefing }) => {

    const navigate = useNavigate();

    if (!appointment || !patient) {
        return <div className={`inspector-panel ${appointment ? 'open' : ''}`} />;
    }

    const handlePatientClick = () => {
        navigate(`patients/${patient.id}`);
        onClose();
    };

    return (
        <div className={`inspector-panel ${appointment ? 'open' : ''}`}>
            <div className="p-6 border-b border-slate-200 flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-slate-800">{appointment.type}</h3>
                    <button onClick={handlePatientClick} className="text-sm font-medium text-teal-600 hover:underline">{patient.name}</button>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 -mt-2"><X size={20}/></button>
            </div>

            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2"><CalendarDays size={14} className="text-slate-400"/><span className="font-bold">{formatDate(appointment.date)}</span></div>
                    <div className="flex items-center gap-2"><Clock size={14} className="text-slate-400"/><span className="font-bold">{appointment.time}</span></div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-black uppercase text-slate-400 mb-4">Workflow</h4>
                    <AppointmentStatusPipeline 
                        appointment={appointment} 
                        onUpdateStatus={(newStatus) => onUpdateStatus(appointment.id, newStatus)}
                    />
                </div>

                <div className="space-y-2 pt-4 border-t">
                    <h4 className="text-xs font-black uppercase text-slate-400">Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => onEdit(appointment)} className="bg-slate-100 p-3 rounded-lg text-xs font-bold text-center">Edit Details</button>
                        <button onClick={() => onMove(appointment.id)} className="bg-slate-100 p-3 rounded-lg text-xs font-bold text-center">Reschedule</button>
                    </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                    <h4 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2"><Sparkles size={14}/> AI Briefing</h4>
                    <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                        Briefing would go here.
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CalendarView;

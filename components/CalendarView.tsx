import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, List, Clock, AlertTriangle, User as UserIcon, CheckCircle, Lock, Beaker, Move, GripHorizontal, CalendarDays, DollarSign } from 'lucide-react';
import { Appointment, User, UserRole, AppointmentType, AppointmentStatus, Patient, LabStatus, FieldSettings } from '../types';

interface CalendarViewProps {
  appointments: Appointment[];
  staff: User[];
  onAddAppointment: (date?: string, time?: string, patientId?: string, appointmentToEdit?: Appointment) => void;
  onMoveAppointment?: (appointmentId: string, newDate: string, newTime: string, newProviderId: string) => void;
  currentUser?: User;
  patients?: Patient[];
  currentBranch?: string;
  fieldSettings?: FieldSettings;
}

const CalendarView: React.FC<CalendarViewProps> = ({ appointments, staff, onAddAppointment, onMoveAppointment, currentUser, patients = [], currentBranch, fieldSettings }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'agenda' | 'week'>('grid');
  
  // WEEK VIEW STATE
  const [activeProviderId, setActiveProviderId] = useState<string>(currentUser?.id || '');

  // DRAG AND DROP STATE
  const [draggedAptId, setDraggedAptId] = useState<string | null>(null);
  
  // MOBILE "TAP TO MOVE" STATE
  const [movingAptId, setMovingAptId] = useState<string | null>(null);

  // MOUSE TRACKING FOR CLICK VS DRAG
  const mouseDownPos = useRef<{ x: number, y: number } | null>(null);

  useEffect(() => {
      // Default Admin to first Dentist if activeProviderId is empty
      if (!activeProviderId && staff.length > 0) {
          const firstDentist = staff.find(s => s.role === UserRole.DENTIST);
          if (firstDentist) setActiveProviderId(firstDentist.id);
      }
  }, [staff, activeProviderId]);

  // Responsive Check
  useEffect(() => {
      const handleResize = () => {
          if (window.innerWidth < 768) {
              setViewMode('agenda');
          }
      };
      window.addEventListener('resize', handleResize);
      if (window.innerWidth < 768) setViewMode('agenda');
      return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Date Navigation
  const next = () => {
    const nextDate = new Date(selectedDate);
    if (viewMode === 'week') {
        nextDate.setDate(selectedDate.getDate() + 7);
    } else {
        nextDate.setDate(selectedDate.getDate() + 1);
    }
    setSelectedDate(nextDate);
  };

  const prev = () => {
    const prevDate = new Date(selectedDate);
    if (viewMode === 'week') {
        prevDate.setDate(selectedDate.getDate() - 7);
    } else {
        prevDate.setDate(selectedDate.getDate() - 1);
    }
    setSelectedDate(prevDate);
  };

  const formattedDate = selectedDate.toLocaleDateString('en-CA');
  
  const displayDate = useMemo(() => {
      if (viewMode === 'week') {
          // Calculate start and end of week (assuming Mon start)
          const day = selectedDate.getDay();
          const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
          const start = new Date(selectedDate);
          start.setDate(diff);
          const end = new Date(start);
          end.setDate(start.getDate() + 5); // Show Mon-Sat
          return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
      // Compact day format
      return selectedDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
  }, [selectedDate, viewMode]);

  // WEEK DATES GENERATOR
  const weekDates = useMemo(() => {
      const dates = [];
      const day = selectedDate.getDay();
      // Start Monday (1)
      const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(diff);

      for (let i = 0; i < 6; i++) { // Mon-Sat
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

  // VISIBLE PROVIDERS LOGIC
  const getVisibleProviders = () => {
      if (!currentUser) return [];
      if (currentUser.role === UserRole.DENTIST) return [currentUser];
      
      // Admin/Assistant sees branch providers
      let branchStaff = staff.filter(u => u.role === UserRole.DENTIST);
      if (currentBranch) {
          branchStaff = branchStaff.filter(u => u.allowedBranches?.includes(currentBranch));
      }
      return branchStaff;
  };

  const visibleProviders = getVisibleProviders();

  // Filter Appointments based on View Mode
  const filteredAppointments = useMemo(() => {
      if (viewMode === 'week') {
          // Show appointments for activeProviderId only, across the week dates
          const weekIsos = weekDates.map(d => d.iso);
          return appointments.filter(a => 
             weekIsos.includes(a.date) && 
             (a.providerId === activeProviderId || a.isBlock)
          );
      } else {
          // Day View: Show all visible providers for selected date
          const visibleIds = visibleProviders.map(p => p.id);
          return appointments.filter(a => 
              a.date === formattedDate && 
              (visibleIds.includes(a.providerId) || a.isBlock)
          );
      }
  }, [appointments, viewMode, formattedDate, weekDates, activeProviderId, visibleProviders]);
  
  // --- REVENUE PULSE (LIVE PRODUCTION COUNTER) ---
  const revenuePulse = useMemo(() => {
      if (!fieldSettings) return 0;
      return filteredAppointments.reduce((acc, apt) => {
          if (apt.isBlock || apt.status === AppointmentStatus.CANCELLED || apt.status === AppointmentStatus.NO_SHOW) return acc;
          const proc = fieldSettings.procedures.find(p => p.name === apt.type);
          return acc + (proc?.price || 0);
      }, 0);
  }, [filteredAppointments, fieldSettings]);

  const sortedAppointments = [...filteredAppointments].sort((a, b) => 
    parseInt(a.time.replace(':','')) - parseInt(b.time.replace(':',''))
  );

  const timeSlots = Array.from({ length: 16 }, (_, i) => i + 7); 
  const getPatient = (id: string) => patients.find(p => p.id === id);
  const isCritical = (p?: Patient) => p && (p.seriousIllness || (p.medicalConditions && p.medicalConditions.length > 0));

  const getAppointmentBaseStyle = (type: AppointmentType, status: AppointmentStatus) => {
     if (status === AppointmentStatus.ARRIVED) return { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-900', icon: 'text-orange-600' };
     if (status === AppointmentStatus.SEATED) return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900', icon: 'text-blue-600' };
     if (status === AppointmentStatus.TREATING) return { bg: 'bg-lilac-50', border: 'border-lilac-300', text: 'text-lilac-900', icon: 'text-lilac-600' };

     switch(type) {
         case AppointmentType.ROOT_CANAL:
         case AppointmentType.EXTRACTION:
         case AppointmentType.SURGERY:
            return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', icon: 'text-red-500' };
         case AppointmentType.ORAL_PROPHYLAXIS:
         case AppointmentType.WHITENING:
            return { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900', icon: 'text-teal-500' };
         case AppointmentType.ORTHODONTICS:
         case AppointmentType.PROSTHODONTICS:
            return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', icon: 'text-purple-500' };
         default: 
            return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-900', icon: 'text-slate-500' };
     }
  };

  // DRAG HANDLERS
  const handleDragStart = (e: React.DragEvent, aptId: string) => {
      setDraggedAptId(aptId);
      e.dataTransfer.setData("text/plain", aptId);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, providerId: string, hour: number, dateIso: string) => {
      e.preventDefault();
      const aptId = e.dataTransfer.getData("text/plain");
      if (aptId && onMoveAppointment) {
          const timeStr = `${hour.toString().padStart(2, '0')}:00`;
          onMoveAppointment(aptId, dateIso, timeStr, providerId);
      }
      setDraggedAptId(null);
  };

  const handleSlotClick = (providerId: string, hour: number, dateIso: string) => {
      if (movingAptId && onMoveAppointment) {
          const timeStr = `${hour.toString().padStart(2, '0')}:00`;
          onMoveAppointment(movingAptId, dateIso, timeStr, providerId);
          setMovingAptId(null);
          return;
      }
      const isAllowed = currentUser?.role === UserRole.ADMIN || currentUser?.id === providerId || currentUser?.role === UserRole.DENTAL_ASSISTANT;
      if (isAllowed) {
        onAddAppointment(dateIso, `${hour.toString().padStart(2, '0')}:00`);
      }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 bg-white z-20 relative">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl shadow-inner">
                <button onClick={prev} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600"><ChevronLeft size={20} /></button>
                <h2 className="text-lg font-bold text-slate-800 min-w-[180px] text-center">{displayDate}</h2>
                <button onClick={next} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600"><ChevronRight size={20} /></button>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`} title="Day View"><LayoutGrid size={18} /></button>
                <button onClick={() => setViewMode('week')} className={`p-2 rounded-md transition-all ${viewMode === 'week' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`} title="Week View"><CalendarDays size={18} /></button>
                <button onClick={() => setViewMode('agenda')} className={`p-2 rounded-md transition-all ${viewMode === 'agenda' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`} title="Agenda View"><List size={18} /></button>
            </div>
        </div>
        
        <div className="flex flex-col items-end">
            <div className="flex items-center gap-3">
                {/* Revenue Pulse Badge */}
                {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.DENTIST) && (
                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                         <DollarSign size={14} className="text-emerald-500" />
                         <span className="text-xs font-bold uppercase tracking-wide">Est. Production</span>
                         <span className="font-mono font-bold">₱{revenuePulse.toLocaleString()}</span>
                    </div>
                )}
                
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    {currentBranch && <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded">{currentBranch}</span>}
                    <span>{viewMode === 'week' ? 'Provider Week' : 'Daily Overview'}</span>
                </div>
            </div>
            {movingAptId && <div className="mt-1 text-xs font-bold text-white bg-teal-600 px-2 py-1 rounded animate-pulse shadow-sm flex items-center gap-1"><Move size={10} /> Tap to move</div>}
        </div>
      </div>

      {/* --- AVATAR SWITCHER (WEEK VIEW ONLY) --- */}
      {viewMode === 'week' && (currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.DENTAL_ASSISTANT) && (
          <div className="bg-slate-50 border-b border-slate-100 p-2 flex justify-center gap-4 overflow-x-auto">
              {visibleProviders.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setActiveProviderId(p.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${
                        activeProviderId === p.id 
                        ? 'bg-white border-teal-500 shadow-md scale-105' 
                        : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                      <img src={p.avatar} className="w-6 h-6 rounded-full bg-slate-200" alt={p.name}/>
                      <span className={`text-xs font-bold ${activeProviderId === p.id ? 'text-teal-900' : 'text-slate-500'}`}>{p.name}</span>
                  </button>
              ))}
          </div>
      )}

      {/* --- AGENDA VIEW --- */}
      {viewMode === 'agenda' ? (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
             {sortedAppointments.length === 0 ? (
                 <div className="text-center py-20 text-slate-400">
                     <Clock size={48} className="mx-auto mb-4 opacity-20" />
                     <p>No appointments scheduled.</p>
                     <button onClick={() => onAddAppointment(formattedDate)} className="mt-4 text-teal-600 font-bold hover:underline">Book an appointment</button>
                 </div>
             ) : (
                 <div className="max-w-3xl mx-auto space-y-4">
                     {sortedAppointments.map(apt => {
                         const provider = staff.find(s => s.id === apt.providerId);
                         const patient = getPatient(apt.patientId);
                         const styles = getAppointmentBaseStyle(apt.type as AppointmentType, apt.status);
                         return (
                             <div key={apt.id} onClick={() => onAddAppointment(undefined, undefined, undefined, apt)} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row cursor-pointer hover:border-teal-300 transition-colors">
                                 <div className="bg-slate-50 p-4 w-full md:w-32 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
                                     <span className="text-xl font-bold text-slate-800">{apt.time}</span>
                                     <span className="text-xs text-slate-500 font-medium">{apt.durationMinutes} min</span>
                                 </div>
                                 <div className="flex-1 p-4 flex flex-col justify-center">
                                     {apt.isBlock ? <div className="flex items-center gap-2 text-slate-500"><Lock size={18} /><span className="font-bold italic">{apt.title}</span></div> : (
                                         <>
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-lg text-slate-800">{patient ? patient.name : 'Unknown'}</h3>
                                                    {isCritical(patient) && <AlertTriangle size={16} className="text-red-500 fill-red-100" />}
                                                </div>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${styles.bg} ${styles.text}`}>{apt.status}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                                                <div className="flex items-center gap-1"><UserIcon size={12} />{provider?.name}</div>
                                                {apt.notes && <div className="italic">"{apt.notes}"</div>}
                                            </div>
                                         </>
                                     )}
                                 </div>
                             </div>
                         );
                     })}
                 </div>
             )}
          </div>
      ) : (
      /* --- GRID / WEEK VIEW --- */
      <div className="flex-1 overflow-x-auto overflow-y-auto bg-white">
         <div className="min-w-max h-full flex flex-col">
            
            {/* Header Row */}
            <div className="flex border-b border-slate-100 sticky top-0 z-30 bg-white">
                <div className="w-16 flex-shrink-0 bg-slate-50 border-r border-slate-100 sticky left-0 z-40 shadow-sm"></div> 
                {viewMode === 'week' ? (
                     weekDates.map(d => (
                         <div key={d.iso} className={`w-[200px] flex-shrink-0 p-3 border-r border-slate-100 text-center ${d.isToday ? 'bg-teal-50/50' : 'bg-slate-50'}`}>
                             <div className={`text-sm font-bold ${d.isToday ? 'text-teal-700' : 'text-slate-800'}`}>{d.label}</div>
                         </div>
                     ))
                ) : (
                    visibleProviders.length > 0 ? visibleProviders.map(p => (
                        <div key={p.id} className="w-[240px] flex-shrink-0 p-3 border-r border-slate-100 text-center bg-slate-50">
                            <div className="flex flex-col items-center">
                                <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full mb-1 border-2 border-white shadow-sm" />
                                <span className="text-sm font-bold text-slate-800 truncate w-full">{p.name}</span>
                            </div>
                        </div>
                    )) : <div className="p-4 text-sm text-slate-400 italic flex-1 text-center">No providers scheduled.</div>
                )}
            </div>

            {/* Time Slots Grid */}
            <div className="flex-1 relative">
                {timeSlots.map(hour => (
                    <div key={hour} className="flex min-h-[140px] border-b border-slate-50">
                        {/* Time Label */}
                        <div className="w-16 flex-shrink-0 flex justify-center pt-3 border-r border-slate-100 bg-slate-50/90 backdrop-blur-sm text-xs font-bold text-slate-400 sticky left-0 z-20">
                            {hour > 12 ? hour - 12 : hour} {hour >= 12 && hour < 24 ? 'PM' : 'AM'}
                        </div>

                        {/* Cells */}
                        {(viewMode === 'week' ? weekDates : visibleProviders).map((col, idx) => {
                           const providerId = viewMode === 'week' ? activeProviderId : (col as User).id;
                           const dateIso = viewMode === 'week' ? (col as any).iso : formattedDate;
                           const colKey = viewMode === 'week' ? (col as any).iso : (col as User).id;

                           const slotAppointments = filteredAppointments.filter(a => 
                               a.providerId === providerId && 
                               a.date === dateIso &&
                               parseInt(a.time.split(':')[0]) === hour
                           );
                           
                           return (
                               <div 
                                 key={`${colKey}-${hour}`} 
                                 className={`
                                    ${viewMode === 'week' ? 'w-[200px]' : 'w-[240px]'} flex-shrink-0 border-r border-slate-100 p-2 relative group transition-colors 
                                    ${(draggedAptId || movingAptId) ? "bg-green-50/30 ring-inset ring-2 ring-green-100" : "bg-white hover:bg-slate-50/30"}
                                 `}
                                 onDragOver={handleDragOver}
                                 onDrop={(e) => handleDrop(e, providerId, hour, dateIso)}
                                 onClick={() => handleSlotClick(providerId, hour, dateIso)}
                               >
                                  {slotAppointments.length > 0 ? (
                                      <div className="flex flex-col gap-1 h-full overflow-y-auto max-h-[200px] no-scrollbar">
                                        {slotAppointments.map(apt => {
                                            const patient = getPatient(apt.patientId);
                                            const styles = getAppointmentBaseStyle(apt.type as AppointmentType, apt.status);
                                            const isBeingMoved = movingAptId === apt.id;

                                            return (
                                                <div 
                                                    key={apt.id} 
                                                    draggable={true}
                                                    onDragStart={(e) => handleDragStart(e, apt.id)}
                                                    onMouseDown={(e) => { mouseDownPos.current = { x: e.clientX, y: e.clientY }; }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (mouseDownPos.current) {
                                                            const dist = Math.sqrt(Math.pow(e.clientX - mouseDownPos.current.x, 2) + Math.pow(e.clientY - mouseDownPos.current.y, 2));
                                                            if (dist > 5) return;
                                                        }
                                                        onAddAppointment(undefined, undefined, undefined, apt);
                                                    }}
                                                    className={`
                                                        rounded-xl p-2 text-xs border cursor-grab active:cursor-grabbing hover:shadow-lg transition-all flex flex-col shrink-0 relative
                                                        ${apt.isBlock ? 'bg-slate-100 border-slate-200 text-slate-500 min-h-[80px]' : `${styles?.bg} ${styles?.border} ${styles?.text} min-h-[100px]`}
                                                        ${isBeingMoved ? 'ring-4 ring-teal-400 ring-offset-2 scale-95 shadow-xl z-20 opacity-90' : ''}
                                                    `}
                                                >
                                                    {apt.isBlock ? (
                                                        <div className="flex items-center justify-center h-full gap-2 font-bold italic"><Lock size={14} /> {apt.title}</div>
                                                    ) : (
                                                        <>
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="font-bold opacity-75 flex items-center gap-1 cursor-grab"><GripHorizontal size={10} className="opacity-50" /> {apt.time}</span>
                                                                {apt.labStatus && apt.labStatus !== LabStatus.NONE && <Beaker size={10} className="text-amber-600" />}
                                                            </div>
                                                            <div className="font-bold text-xs mb-1 line-clamp-2 flex items-center gap-1">
                                                                {patient ? patient.name : 'Unknown'}
                                                                {isCritical(patient) && <AlertTriangle size={10} className="text-red-500 fill-red-100 shrink-0" />}
                                                            </div>
                                                            <div className="mt-auto flex justify-between items-center border-t border-black/5 pt-1">
                                                                <span className="font-bold uppercase text-[9px] opacity-70">{apt.status.slice(0,3)}</span>
                                                                {apt.status === AppointmentStatus.CONFIRMED && <CheckCircle size={10} />}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                      </div>
                                  ) : (
                                      (draggedAptId || movingAptId) && (
                                        <div className="w-full h-full rounded-xl border-2 border-dashed border-green-300 bg-green-50/50 flex items-center justify-center text-green-600 animate-pulse">
                                            <span className="font-bold text-xs">{movingAptId ? 'Tap Here' : 'Drop'}</span>
                                        </div>
                                      )
                                  )}
                               </div>
                           );
                        })}
                    </div>
                ))}
            </div>
         </div>
      </div>
      )}
    </div>
  );
};

export default CalendarView;
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, LayoutGrid, List, Clock, AlertTriangle, User as UserIcon, 
  CheckCircle, Lock, Beaker, Move, GripHorizontal, CalendarDays, DollarSign, Layers, 
  Users, Plus, CreditCard, ArrowRightLeft, GripVertical, Armchair, AlertCircle, 
  CloudOff, ShieldAlert, CheckSquare, X, ShieldCheck, DollarSign as FinanceIcon
} from 'lucide-react';
import { 
  Appointment, User, UserRole, AppointmentType, AppointmentStatus, Patient, 
  LabStatus, FieldSettings, WaitlistEntry, ClinicResource 
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
}

const MOCK_WAITLIST: WaitlistEntry[] = [
    { id: 'wl_1', patientId: 'p_credit_03', patientName: 'Maria Clara', procedure: 'Restoration', durationMinutes: 60, priority: 'High', notes: 'Flexible anytime AM' },
    { id: 'wl_2', patientId: 'p_surg_04', patientName: 'Juan Dela Cruz', procedure: 'Extraction', durationMinutes: 30, priority: 'Normal', notes: 'Prefer afternoons' },
    { id: 'wl_3', patientId: 'p_full_perio_02', patientName: 'Sofia Reyes', procedure: 'Cleaning', durationMinutes: 45, priority: 'Low', notes: 'Short notice ok' },
    { id: 'wl_4', patientId: 'p_debt_09', patientName: 'Ronnie Runner', procedure: 'Root Canal', durationMinutes: 60, priority: 'High', notes: 'Emergency opening requested' },
];

const RELIABILITY_THRESHOLD = 70;

const CalendarView: React.FC<CalendarViewProps> = ({ appointments, staff, onAddAppointment, onMoveAppointment, currentUser, patients = [], currentBranch, fieldSettings }) => {
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
     let styles = { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-900', icon: 'text-slate-500' };
     if (status === AppointmentStatus.ARRIVED) styles = { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-900', icon: 'text-orange-600' };
     else if (status === AppointmentStatus.SEATED) styles = { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900', icon: 'text-blue-600' };
     else if (status === AppointmentStatus.TREATING) styles = { bg: 'bg-lilac-50', border: 'border-lilac-300', text: 'text-lilac-900', icon: 'text-lilac-600' };
     else {
        switch(type) {
            case AppointmentType.ROOT_CANAL: case AppointmentType.EXTRACTION: case AppointmentType.SURGERY: styles = { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', icon: 'text-red-500' }; break;
            case AppointmentType.ORAL_PROPHYLAXIS: case AppointmentType.WHITENING: styles = { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900', icon: 'text-teal-500' }; break;
        }
     }

     if (entryMode === 'MANUAL') {
         return { ...styles, bg: `${styles.bg} bg-[repeating-linear-gradient(45deg,rgba(251,191,36,0.1),rgba(251,191,36,0.1)_5px,transparent_5px,transparent_10px)] border-yellow-500` };
     }

     if (isPendingSync) {
         return { ...styles, bg: `${styles.bg} repeating-linear-gradient-lilac opacity-80 border-dashed` };
     }
     return styles;
  };

  const handleDragStart = (e: React.DragEvent, aptId: string) => {
      setDraggedAptId(aptId);
      e.dataTransfer.setData("text/plain", aptId);
      e.dataTransfer.setData("type", "appointment");
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleDrop = (e: React.DragEvent, colId: string, hour: number, dateIso: string) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("type");
      const id = e.dataTransfer.getData("text/plain");
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      if (type === 'appointment' && onMoveAppointment) {
          if (viewDimension === 'provider') onMoveAppointment(id, dateIso, timeStr, colId);
          else { const apt = appointments.find(a => a.id === id); if (apt) onMoveAppointment(id, dateIso, timeStr, apt.providerId, colId); }
      }
      setDraggedAptId(null);
  };

  const handleSlotClick = (colId: string, hour: number, dateIso: string) => {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      if (movingAptId && onMoveAppointment) {
          if (viewDimension === 'provider') onMoveAppointment(movingAptId, dateIso, timeStr, colId);
          else { const apt = appointments.find(a => a.id === movingAptId); if (apt) onMoveAppointment(movingAptId, dateIso, timeStr, apt.providerId, colId); }
          setMovingAptId(null); 
      } else onAddAppointment(dateIso, timeStr);
  };

  const handleWaitlistAssign = (entry: WaitlistEntry) => {
      const patient = getPatient(entry.patientId);
      const isReliable = (patient?.reliabilityScore ?? 100) >= RELIABILITY_THRESHOLD;
      const hasBalance = (patient?.currentBalance ?? 0) > 0;

      if (!isReliable || hasBalance) {
          setOverrideTarget(entry);
          setOverrideConfirmed(false);
          return;
      }

      onAddAppointment(formattedDate, undefined, entry.patientId);
  };

  const executeOverride = () => {
      if (overrideTarget) {
          onAddAppointment(formattedDate, undefined, overrideTarget.patientId);
          setOverrideTarget(null);
      }
  };

  return (
    <div className="flex flex-row h-full bg-slate-50 gap-4 relative overflow-hidden">
      <style>{`
        .repeating-linear-gradient-lilac {
            background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(162, 28, 175, 0.05) 10px, rgba(162, 28, 175, 0.05) 20px);
        }
      `}</style>
      
      <div className={`flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 transition-all ${showWaitlist ? 'mr-96' : 'mr-0'}`}>
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 bg-white z-20 relative">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl shadow-inner">
                    <button onClick={prev} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600"><ChevronLeft size={20} /></button>
                    <h2 className="text-lg font-bold text-slate-800 min-w-[180px] text-center">{displayDate}</h2>
                    <button onClick={next} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600"><ChevronRight size={20} /></button>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}><LayoutGrid size={18} /></button>
                    <button onClick={() => setViewMode('week')} className={`p-2 rounded-md transition-all ${viewMode === 'week' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}><CalendarDays size={18} /></button>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                    {viewMode === 'grid' && (
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button onClick={() => setViewDimension('provider')} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${viewDimension === 'provider' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500'}`}>Providers</button>
                            <button onClick={() => setViewDimension('chair')} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${viewDimension === 'chair' ? 'bg-lilac-600 text-white shadow-md' : 'text-slate-500'}`}>Chairs</button>
                        </div>
                    )}
                     <button onClick={() => setShowWaitlist(!showWaitlist)} className={`p-2 rounded-lg border transition-all flex items-center gap-1 text-xs font-bold ${showWaitlist ? 'bg-teal-600 text-white border-teal-500 shadow-lg' : 'bg-white border-slate-200 text-slate-500'}`}><Users size={14}/> Waitlist</button>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto bg-white relative">
            <div className="min-w-max md:min-w-full h-full flex flex-col">
                <div className="flex border-b border-slate-100 sticky top-0 z-30 bg-white">
                    <div className="w-16 flex-shrink-0 bg-slate-50 border-r border-slate-100 sticky left-0 z-40 shadow-sm"></div> 
                    {viewMode === 'week' ? weekDates.map(d => (
                            <div key={d.iso} className={`w-[200px] flex-shrink-0 p-3 border-r border-slate-100 text-center ${d.isToday ? 'bg-teal-50/50' : 'bg-slate-50'}`}>
                                <div className={`text-sm font-bold ${d.isToday ? 'text-teal-700' : 'text-slate-800'}`}>{d.label}</div>
                            </div>
                        )) : viewDimension === 'provider' ? visibleProviders.map(p => (
                            <div key={p.id} className="w-[240px] flex-shrink-0 p-3 border-r border-slate-100 text-center bg-slate-50">
                                <div className="flex flex-col items-center"><img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full mb-1 border-2 border-white shadow-sm" /><span className="text-sm font-bold text-slate-800 truncate w-full">{p.name}</span></div>
                            </div>
                        )) : visibleResources.map(r => (
                            <div key={r.id} className="w-[240px] flex-shrink-0 p-3 border-r border-slate-100 text-center bg-slate-50">
                                <div className="flex flex-col items-center"><div className="w-10 h-10 bg-lilac-100 rounded-full flex items-center justify-center mb-1 border-2 border-white shadow-sm text-lilac-600"><Armchair size={20}/></div><span className="text-sm font-bold text-slate-800 truncate w-full">{r.name}</span></div>
                            </div>
                        ))
                    }
                </div>

                <div className="flex flex-col flex-1">
                    {timeSlots.map(hour => (
                        <div key={hour} className="flex min-h-[140px] border-b border-slate-50">
                            <div className="w-16 flex-shrink-0 flex justify-center pt-3 border-r border-slate-100 bg-slate-50/90 backdrop-blur-sm text-xs font-bold text-slate-400 sticky left-0 z-20">
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
                                    <div key={`${col.id || col.iso}-${hour}`} className={`${viewMode === 'week' ? 'w-[200px]' : 'w-[240px]'} flex-shrink-0 border-r border-slate-100 p-2 relative transition-colors hover:bg-slate-50/30`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, colId, hour, dateIso)} onClick={() => handleSlotClick(colId, hour, dateIso)}>
                                        {slotAppointments.map(apt => {
                                            const patient = getPatient(apt.patientId);
                                            const provider = staff.find(s => s.id === apt.providerId);
                                            const styles = getAppointmentBaseStyle(apt.type as AppointmentType, apt.status, apt.isPendingSync, apt.entryMode);
                                            return (
                                                <div key={apt.id} draggable={true} onDragStart={(e) => handleDragStart(e, apt.id)} onClick={(e) => { e.stopPropagation(); onAddAppointment(undefined, undefined, undefined, apt); }} className={`rounded-xl p-2 text-xs border cursor-grab active:cursor-grabbing hover:shadow-lg transition-all mb-1 ${styles.bg} ${styles.border} ${styles.text}`}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold opacity-75">{apt.time}</span>
                                                        <div className="flex items-center gap-1">
                                                            {apt.isWaitlistOverride && <ShieldAlert size={12} className="text-red-600 animate-pulse" title="Waitlist Priority Override Entry"/>}
                                                            {apt.entryMode === 'MANUAL' && <AlertTriangle size={10} className="text-yellow-600 animate-pulse" title="Manual Entry - Needs Reconciliation"/>}
                                                            {apt.isPendingSync && <CloudOff size={10} className="text-lilac-600 animate-pulse" title="Awaiting Sync"/>}
                                                            {viewDimension === 'chair' && <img src={provider?.avatar} className="w-4 h-4 rounded-full" title={provider?.name}/>}
                                                        </div>
                                                    </div>
                                                    <div className="font-bold truncate">{patient?.name || 'Block'}</div>
                                                    <div className="text-[9px] uppercase font-bold opacity-60 mt-1 truncate">{apt.type}</div>
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

      {/* --- WAITLIST SIDE PANEL --- */}
      <div className={`fixed top-16 bottom-20 right-0 w-96 bg-white border-l border-slate-200 shadow-2xl z-40 transition-transform duration-500 ease-in-out ${showWaitlist ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-3">
                      <div className="bg-teal-100 p-2 rounded-xl text-teal-700"><Users size={20}/></div>
                      <h3 className="font-black text-slate-800 uppercase tracking-tight">Waitlist Engine</h3>
                  </div>
                  <button onClick={() => setShowWaitlist(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                  {MOCK_WAITLIST.map(entry => {
                      const patient = getPatient(entry.patientId);
                      const isUnreliable = (patient?.reliabilityScore ?? 100) < RELIABILITY_THRESHOLD;
                      const hasBalance = (patient?.currentBalance ?? 0) > 0;
                      const isClear = !isUnreliable && !hasBalance;

                      return (
                          <div key={entry.id} className={`p-4 rounded-3xl border-2 transition-all group ${isClear ? 'bg-white border-slate-100 hover:border-teal-400' : 'bg-slate-50 border-slate-200 opacity-70 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'}`}>
                              <div className="flex justify-between items-start mb-2">
                                  <div>
                                      <h4 className="font-black text-slate-800 uppercase text-sm leading-tight">{entry.patientName}</h4>
                                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                          {isUnreliable && (
                                              <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border border-red-100">
                                                  {patient?.reliabilityScore}% Reliability
                                              </span>
                                          )}
                                          {hasBalance && (
                                              <div className="flex items-center gap-1 text-red-700 bg-red-100/50 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border border-red-200">
                                                  <FinanceIcon size={8}/> ₱{patient?.currentBalance?.toLocaleString()}
                                              </div>
                                          )}
                                          {isClear && (
                                              <span className="bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border border-teal-100 flex items-center gap-1">
                                                  <ShieldCheck size={10}/> Verified Clear
                                              </span>
                                          )}
                                      </div>
                                  </div>
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${entry.priority === 'High' ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{entry.priority}</span>
                              </div>

                              <div className="bg-slate-50/50 p-2 rounded-xl mt-3 space-y-1">
                                  <div className="text-[10px] font-bold text-slate-500 flex justify-between"><span>Procedure:</span><span className="text-slate-800">{entry.procedure}</span></div>
                                  <div className="text-[10px] font-bold text-slate-500 flex justify-between"><span>Duration:</span><span className="text-slate-800">{entry.durationMinutes}m</span></div>
                              </div>

                              <button 
                                onClick={() => handleWaitlistAssign(entry)}
                                className={`w-full mt-4 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95 ${
                                    isClear ? 'bg-teal-600 text-white shadow-teal-600/20' : 'bg-white text-red-600 border border-red-200 shadow-red-600/5'
                                }`}
                              >
                                  {isClear ? 'Assign Slot' : 'Request Override'}
                              </button>
                          </div>
                      );
                  })}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50">
                  <p className="text-[9px] font-bold text-slate-400 uppercase text-center leading-relaxed">
                      Integrity signals are derived from real-time patient ledger and attendance analytics.
                  </p>
              </div>
          </div>
      </div>

      {/* --- OVERRIDE POPOVER --- */}
      {overrideTarget && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 border-4 border-red-100">
                  <div className="flex items-center gap-4 text-red-600 mb-6">
                      <div className="bg-red-50 p-3 rounded-2xl"><ShieldAlert size={32} className="animate-pulse"/></div>
                      <div>
                          <h3 className="text-xl font-black uppercase tracking-tighter">Guardrail Triggered</h3>
                          <p className="text-[10px] font-bold uppercase text-red-800">Front-Desk Integrity Block</p>
                      </div>
                  </div>

                  <div className="bg-red-50 p-6 rounded-3xl mb-8 space-y-4">
                      <p className="text-sm font-medium text-red-900 leading-relaxed">
                          Attention: <strong>{overrideTarget.patientName}</strong> is currently flagged for:
                      </p>
                      <ul className="space-y-2">
                          {(getPatient(overrideTarget.patientId)?.reliabilityScore ?? 100) < RELIABILITY_THRESHOLD && (
                              <li className="flex items-center gap-2 text-xs font-bold text-red-700"><AlertCircle size={14}/> Low Appointment Reliability</li>
                          )}
                          {(getPatient(overrideTarget.patientId)?.currentBalance ?? 0) > 0 && (
                              <li className="flex items-center gap-2 text-xs font-bold text-red-700"><FinanceIcon size={14}/> Unresolved Practice Debt</li>
                          )}
                      </ul>
                  </div>

                  <label className="flex items-start gap-4 p-5 rounded-3xl border-2 border-slate-100 hover:border-teal-500 transition-all cursor-pointer mb-8">
                      <input 
                        type="checkbox" 
                        checked={overrideConfirmed}
                        onChange={e => setOverrideConfirmed(e.target.checked)}
                        className="w-6 h-6 mt-0.5 accent-teal-600 rounded" 
                      />
                      <div className="text-xs font-black uppercase text-slate-700 leading-tight">
                          I have received Managerial Approval to bypass clinical guardrails.
                      </div>
                  </label>

                  <div className="flex gap-3">
                      <button onClick={() => setOverrideTarget(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl uppercase text-[10px] tracking-widest">Cancel</button>
                      <button 
                        onClick={executeOverride}
                        disabled={!overrideConfirmed}
                        className="flex-[2] py-4 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-red-600/20 disabled:opacity-40"
                      >
                          Confirm Booking
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CalendarView;

import React,
{ useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ChevronLeft, ChevronRight, LayoutGrid, AlertTriangle, 
  Users, X, ShieldAlert, ShieldCheck, DollarSign as FinanceIcon, Key, CalendarDays, CloudOff, AlertCircle
} from 'lucide-react';
import { 
  Appointment, UserRole, AppointmentStatus, Patient, 
  WaitlistEntry
} from '../types';
import { useToast } from './ToastSystem';
import { useModal } from '../contexts/ModalContext';
import { useAppContext } from '../contexts/AppContext';
import { useAppointments } from '../contexts/AppointmentContext';
import { useStaff } from '../contexts/StaffContext';
import { usePatient } from '../contexts/PatientContext';
import { useSettings } from '../contexts/SettingsContext';
import { useClinicalOps } from '../contexts/ClinicalOpsContext';
import { useNavigate } from '../contexts/RouterContext';
import InspectorPanel from './InspectorPanel';

interface CalendarViewProps {}

const RELIABILITY_THRESHOLD = 70;

const CalendarView: React.FC<CalendarViewProps> = () => {
  const toast = useToast();
  const { showModal } = useModal();
  const navigate = useNavigate();

  const { currentUser, currentBranch } = useAppContext();
  const { appointments, handleMoveAppointment: onMoveAppointment, handleUpdateAppointmentStatus: onUpdateAppointmentStatus, handleSaveAppointment } = useAppointments();
  const { staff } = useStaff();
  const { patients } = usePatient();
  const { fieldSettings } = useSettings();
  const { waitlist, handleAddToWaitlist } = useClinicalOps();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'agenda' | 'week'>('grid');
  const [viewDimension, setViewDimension] = useState<'provider' | 'chair'>('provider');
  const [showWaitlist, setShowWaitlist] = useState(false); 
  const [activeProviderId, setActiveProviderId] = useState<string>(currentUser?.id || '');
  
  const [inspected, setInspected] = useState<{ apt: Appointment, patient: Patient } | null>(null);

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

    // Logic for a logged-in DENTIST viewing their own schedule
    if (currentUser.role === UserRole.DENTIST && viewMode !== 'week') {
        const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'short' });
        // Only show the current dentist if they are rostered for this day/branch
        if (currentUser.roster?.[dayOfWeek] === currentBranch) {
            return [currentUser];
        }
        return []; // Not rostered, show empty
    }

    // Logic for ADMIN/ARCHITECT to see all relevant dentists for the branch
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
     // FIX: Removed reference to `AppointmentStatus.SEATED` which does not exist in the enum.
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
         return { ...styles, bg: `${styles.bg} repeating-linear-gradient-lilac opacity-80 border-dashed` };
     }
     return styles;
  };
  
  const openAppointmentModal = (date?: string, time?: string, patientId?: string, appointmentToEdit?: Appointment, overrideInfo?: any) => {
    showModal('appointment', { 
        onSave: handleSaveAppointment, 
        onAddToWaitlist: handleAddToWaitlist,
        currentBranch,
        initialDate: date, 
        initialTime: time, 
        initialPatientId: patientId, 
        existingAppointment: appointmentToEdit, 
        overrideInfo 
    });
  };

  
  const handleSlotClick = (hour: number, dateIso: string) => {
      openAppointmentModal(dateIso, `${hour.toString().padStart(2, '0')}:00`);
  };

  const handleWaitlistAssign = (entry: WaitlistEntry) => {
      const patient = getPatient(entry.patientId);
      const isReliable = (patient?.reliabilityScore ?? 100) >= RELIABILITY_THRESHOLD;
      const hasBalance = (patient?.currentBalance ?? 0) > 0;

      if (!isReliable || hasBalance) {
          setOverrideTarget(entry);
          setOverrideConfirmed(false);
          setSelectedManagerId('');
          setManagerPin('');
          return;
      }

      openAppointmentModal(formattedDate, undefined, entry.patientId);
  };
  
  const handleOpenChart = (patientId: string, prefill: any) => {
    const query = new URLSearchParams();
    if (prefill.prefill_procedure) query.set('prefill_procedure', prefill.prefill_procedure);
    if (prefill.prefill_resourceId) query.set('prefill_resourceId', prefill.prefill_resourceId);
    
    navigate(`patients/${patientId}?${query.toString()}`);
    setInspected(null);
  };

  const executeOverride = useCallback(() => {
      const manager = authorizedManagers.find(m => m.id === selectedManagerId);
      if (overrideTarget && manager && managerPin.length > 0) {
          // In a real app, this would be a backend call.
          // For this exercise, we simulate a successful override if a manager is selected and a PIN is entered.
          // The actual PIN value is not checked on the client-side to mitigate security risks.
          openAppointmentModal(formattedDate, undefined, overrideTarget.patientId, undefined, { isWaitlistOverride: true, authorizedManagerId: selectedManagerId });
          toast.success("Manager Override Verified. Appointment Queued.");
          setOverrideTarget(null);
          setManagerPin('');
      } else {
          toast.error("Invalid Manager PIN or selection.");
      }
  }, [authorizedManagers, selectedManagerId, managerPin, overrideTarget, formattedDate, toast]);

  const handleDrop = (e: React.DragEvent, colId: string, hour: number, dateIso: string) => {
    e.preventDefault();
    setDragOverInfo(null);
    if (!onMoveAppointment) return;
    try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        const { appointmentId } = data;
        const originalApt = appointments.find(a => a.id === appointmentId);
        if (!originalApt) return;

        const newDate = dateIso;
        const newTime = `${hour.toString().padStart(2, '0')}:00`;
        
        let newProviderId: string;
        let newResourceId: string | undefined;

        if (viewMode === 'week') {
            newProviderId = activeProviderId;
            newResourceId = originalApt.resourceId; 
        } else if (viewDimension === 'provider') {
            newProviderId = colId;
            newResourceId = originalApt.resourceId;
        } else { // chair view
            newProviderId = originalApt.providerId;
            newResourceId = colId;
        }
        
        const newDayOfWeek = new Date(newDate + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
        const provider = staff.find(s => s.id === newProviderId);
        if (provider && provider.roster && provider.roster[newDayOfWeek] !== (currentBranch || originalApt.branch)) {
            toast.error("Provider is not rostered for this day/branch.");
            return;
        }

        const proposedStart = new Date(`${newDate}T${newTime}`);
        const proposedEnd = new Date(proposedStart.getTime() + originalApt.durationMinutes * 60000);

        const isConflict = appointments.some(apt => {
            if (apt.id === appointmentId) return false;

            const existingStart = new Date(`${apt.date}T${apt.time}`);
            const existingEnd = new Date(existingStart.getTime() + apt.durationMinutes * 60000);

            const overlap = (proposedStart < existingEnd) && (proposedEnd > existingStart);
            if (!overlap) return false;

            // Provider conflict
            if (!apt.isBlock && apt.providerId === newProviderId) return true;

            // Resource conflict
            if (newResourceId && apt.resourceId === newResourceId) return true;

            // Patient conflict
            if (!originalApt.isBlock && !apt.isBlock && apt.patientId === originalApt.patientId) return true;

            return false;
        });

        if (isConflict) {
            toast.error("Scheduling Conflict: This time slot overlaps for the patient, provider, or resource.");
            return;
        }

        onMoveAppointment(appointmentId, newDate, newTime, newProviderId, newResourceId);
    } catch (error) {
        console.error("Drag and drop failed:", error);
        toast.error("Could not move appointment.");
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
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 bg-white z-20 relative">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl shadow-inner border border-slate-200">
                    <button onClick={prev} aria-label="Previous date" className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-700"><ChevronLeft size={20} /></button>
                    <h2 className="text-lg font-bold text-slate-800 min-w-[180px] text-center">{displayDate}</h2>
                    <button onClick={next} aria-label="Next date" className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-700"><ChevronRight size={20} /></button>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200" role="group" aria-label="Calendar view mode">
                    <button onClick={() => setViewMode('grid')} aria-pressed={viewMode === 'grid'} aria-label="Grid view" className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-teal-800 font-bold' : 'text-slate-600'}`}><LayoutGrid size={18} /></button>
                    <button onClick={() => setViewMode('week')} aria-pressed={viewMode === 'week'} aria-label="Week view" className={`p-2 rounded-md transition-all ${viewMode === 'week' ? 'bg-white shadow text-teal-800 font-bold' : 'text-slate-600'}`}><CalendarDays size={18} /></button>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                    {viewMode === 'week' && (
                        <select value={activeProviderId} onChange={e => setActiveProviderId(e.target.value)} className="bg-white border-2 border-slate-200 text-slate-700 p-2.5 rounded-lg text-xs font-black uppercase tracking-widest">
                            {visibleProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    )}
                    {viewMode === 'grid' && (
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200" role="group" aria-label="Calendar dimension toggle">
                            <button onClick={() => setViewDimension('provider')} aria-pressed={viewDimension === 'provider'} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${viewDimension === 'provider' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}>Providers</button>
                            <button onClick={() => setViewDimension('chair')} aria-pressed={viewDimension === 'chair'} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${viewDimension === 'chair' ? 'bg-lilac-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}>Chairs</button>
                        </div>
                    )}
                     <button onClick={() => setShowWaitlist(!showWaitlist)} aria-expanded={showWaitlist} className={`p-2.5 rounded-lg border transition-all flex items-center gap-2 text-sm font-bold ${showWaitlist ? 'bg-teal-600 text-white border-teal-700 shadow-lg' : 'bg-white border-slate-300 text-slate-700 hover:border-teal-600'}`}><Users size={16}/> Waitlist</button>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto bg-white relative">
            <div className="min-w-max md:min-w-full h-full flex flex-col">
                <div className="flex border-b border-slate-200 sticky top-0 z-30 bg-white" role="row">
                    <div className="w-16 flex-shrink-0 bg-slate-50 border-r border-slate-200 sticky left-0 z-40 shadow-sm"></div> 
                    {viewMode === 'week' ? weekDates.map(d => (
                            <div key={d.iso} role="columnheader" className={`w-[200px] flex-shrink-0 p-4 border-r border-slate-200 text-center ${d.isToday ? 'bg-teal-50/50' : 'bg-slate-50'}`}>
                                <div className={`text-sm font-black uppercase tracking-widest ${d.isToday ? 'text-teal-700' : 'text-slate-800'}`}>{d.label}</div>
                            </div>
                        )) : viewDimension === 'provider' ? visibleProviders.map(p => (
                            <div key={p.id} role="columnheader" className="w-[240px] flex-shrink-0 p-4 border-r border-slate-200 text-center bg-slate-50 flex items-center justify-center h-24">
                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight truncate w-full">{p.name}</span>
                            </div>
                        )) : visibleResources.map(r => (
                            <div key={r.id} role="columnheader" className="w-[240px] flex-shrink-0 p-4 border-r border-slate-200 text-center bg-slate-50 flex items-center justify-center h-24">
                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight truncate w-full">{r.name}</span>
                            </div>
                        ))
                    }
                </div>

                <div className="flex flex-col flex-1">
                    {timeSlots.map(hour => (
                        <div key={hour} className="flex min-h-[80px] border-b border-slate-100" role="row">
                            <div className="w-16 flex-shrink-0 flex justify-center pt-3 border-r border-slate-200 bg-slate-50/90 backdrop-blur-sm text-xs font-black text-slate-500 sticky left-0 z-20">
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
                                const isDragOver = dragOverInfo?.colId === colId && dragOverInfo?.hour === hour && dragOverInfo?.dateIso === dateIso;
                            
                                return (
                                    <div 
                                        key={`${col.id || col.iso}-${hour}`} 
                                        role="gridcell" 
                                        aria-label={`Add appointment for ${dateIso} at ${hour}:00`} 
                                        className={`${viewMode === 'week' ? 'w-[200px]' : 'w-[240px]'} flex-shrink-0 border-r border-slate-100 p-2 relative transition-colors ${isDragOver ? 'bg-teal-50 border-2 border-teal-500' : 'hover:bg-slate-50/50'}`}
                                        onDoubleClick={() => handleSlotClick(hour, dateIso)}
                                        onDragOver={e => e.preventDefault()}
                                        onDragEnter={() => setDragOverInfo({ colId, hour, dateIso })}
                                        onDragLeave={() => setDragOverInfo(null)}
                                        onDrop={(e) => handleDrop(e, colId, hour, dateIso)}
                                    >
                                        {slotAppointments.map(apt => {
                                            const patient = getPatient(apt.patientId);
                                            const provider = staff.find(s => s.id === apt.providerId);
                                            const styles = getAppointmentBaseStyle(apt.type, apt.status, apt.isPendingSync, apt.entryMode);
                                            
                                            if (!patient && !apt.isBlock) return null;
                                            
                                            if(apt.isBlock) {
                                              return (
                                                  <div key={apt.id} className="rounded-xl p-3 bg-slate-100 border-2 border-slate-200 text-slate-500 cursor-not-allowed">
                                                      <div className="font-black text-sm uppercase tracking-tight truncate">{apt.title}</div>
                                                      <div className="text-xs uppercase font-bold text-slate-400 mt-1 truncate">{apt.type}</div>
                                                  </div>
                                              )
                                            }

                                            return (
                                                <div 
                                                    key={apt.id} 
                                                    draggable
                                                    onDragStart={(e) => { 
                                                        e.dataTransfer.setData('application/json', JSON.stringify({ appointmentId: apt.id })) 
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setInspected({ apt, patient: patient! });
                                                    }}
                                                    onDoubleClick={(e) => { e.stopPropagation(); openAppointmentModal(undefined, undefined, undefined, apt); }}
                                                    className={`rounded-xl p-3 text-xs border-2 cursor-grab active:cursor-grabbing hover:shadow-xl transition-all mb-2 ${styles.bg} ${styles.border} ${styles.text}`} role="button" aria-label={`Actions for ${patient?.name || 'Admin Block'}`}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-black text-slate-600">{apt.time}</span>
                                                        <div className="flex items-center gap-1">
                                                            {apt.isWaitlistOverride && <span title="Booked from Waitlist (Manager Override)"><ShieldAlert size={14} className="text-red-700 animate-pulse"/></span>}
                                                            {apt.entryMode === 'MANUAL' && <span title="Manual Downtime Entry"><AlertTriangle size={12} className="text-yellow-700 animate-pulse"/></span>}
                                                            {apt.isPendingSync && <span title="Pending Offline Sync"><CloudOff size={12} className="text-lilac-700 animate-pulse"/></span>}
                                                            {viewDimension === 'chair' && provider && 
                                                                <div className="w-5 h-5 rounded-full border border-white bg-teal-100 text-teal-700 flex items-center justify-center text-[8px] font-black" title={provider.name}>
                                                                    {provider.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').substring(0,2)}
                                                                </div>
                                                            }
                                                        </div>
                                                    </div>
                                                    <div className="font-black text-sm uppercase tracking-tight truncate">{patient?.name || 'Clinical Block'}</div>
                                                    <div className="text-xs uppercase font-black text-slate-500 mt-1 truncate">{apt.type}</div>
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

      <InspectorPanel
          inspected={inspected}
          onClose={() => setInspected(null)}
          onUpdateStatus={onUpdateAppointmentStatus}
          onOpenChart={handleOpenChart}
      />

      {/* --- WAITLIST SIDE PANEL --- */}
      <div className={`fixed top-24 bottom-8 right-0 w-96 bg-white border-l border-slate-300 shadow-2xl z-40 transition-transform duration-500 ease-in-out ${showWaitlist ? 'translate-x-0' : 'translate-x-full'}`} role="complementary" aria-label="Waitlist Management">
          <div className="h-full flex flex-col">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-3">
                      <div className="bg-teal-100 p-2 rounded-xl text-teal-800"><Users size={20}/></div>
                      <h3 className="font-black text-slate-800 uppercase tracking-tight">Waitlist Engine</h3>
                  </div>
                  <button onClick={() => setShowWaitlist(false)} aria-label="Close waitlist panel" className="p-2 text-slate-400 hover:text-slate-800 transition-colors"><X size={24}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                  {(waitlist || []).map(entry => {
                      const patient = getPatient(entry.patientId);
                      const isUnreliable = (patient?.reliabilityScore ?? 100) < RELIABILITY_THRESHOLD;
                      const hasBalance = (patient?.currentBalance ?? 0) > 0;
                      const isClear = !isUnreliable && !hasBalance;

                      return (
                          <div key={entry.id} className={`p-4 rounded-3xl border-2 transition-all group ${isClear ? 'bg-white border-slate-200 hover:border-teal-500 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-80 grayscale-[0.3] hover:opacity-100 hover:grayscale-0'}`}>
                              <div className="flex justify-between items-start mb-3">
                                  <div>
                                      <h4 className="font-black text-slate-800 uppercase text-sm leading-tight">{entry.patientName}</h4>
                                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                                          {isUnreliable && (
                                              <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-xs font-black uppercase border border-red-200">
                                                  {patient?.reliabilityScore}% Reliability
                                              </span>
                                          )}
                                          {hasBalance && (
                                              <div className="flex items-center gap-1 text-red-800 bg-red-100/50 px-2 py-0.5 rounded-full text-xs font-black uppercase border border-red-200">
                                                  <FinanceIcon size={10}/> ₱{patient?.currentBalance?.toLocaleString()}
                                              </div>
                                          )}
                                          {isClear && (
                                              <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-xs font-black uppercase border border-teal-200 flex items-center gap-1">
                                                  <ShieldCheck size={12}/> Verified Clear
                                              </span>
                                          )}
                                      </div>
                                  </div>
                                  <span className={`text-xs font-black uppercase px-2 py-1 rounded ${entry.priority === 'High' ? 'bg-orange-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'}`}>{entry.priority}</span>
                              </div>

                              <div className="bg-slate-50 p-3 rounded-xl mt-3 space-y-2 border border-slate-100">
                                  <div className="text-xs font-bold text-slate-600 flex justify-between uppercase tracking-tighter"><span>Procedure</span><span className="text-slate-900">{entry.procedure}</span></div>
                                  <div className="text-xs font-bold text-slate-600 flex justify-between uppercase tracking-tighter"><span>Duration</span><span className="text-slate-900">{entry.durationMinutes}m</span></div>
                              </div>

                              <button 
                                onClick={() => handleWaitlistAssign(entry)}
                                className={`w-full mt-4 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 ${
                                    isClear ? 'bg-teal-600 text-white shadow-teal-600/20 hover:bg-teal-700' : 'bg-white text-red-700 border-2 border-red-200 shadow-red-600/5 hover:bg-red-50'
                                }`}
                                aria-label={isClear ? `Assign slot to ${entry.patientName}` : `Request override for ${entry.patientName}`}
                              >
                                  {isClear ? 'Assign Slot' : 'Request Override'}
                              </button>
                          </div>
                      );
                  })}
              </div>

              <div className="p-6 border-t border-slate-200 bg-slate-50">
                  <p className="text-xs font-bold text-slate-500 uppercase text-center leading-relaxed tracking-wide">
                      Integrity signals derived from real-time ledger and attendance analytics.
                  </p>
              </div>
          </div>
      </div>

      {/* --- OVERRIDE POPOVER --- */}
      {overrideTarget && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-in zoom-in-95 border-4 border-red-100" role="dialog" aria-labelledby="override-title">
                  <div className="flex items-center gap-4 text-red-600 mb-8">
                      <div className="bg-red-50 p-4 rounded-2xl shadow-sm"><ShieldAlert size={40} className="animate-pulse"/></div>
                      <div>
                          <h3 id="override-title" className="text-2xl font-black uppercase tracking-tighter">Guardrail Triggered</h3>
                          <p className="text-xs font-bold uppercase text-red-800 tracking-widest mt-1">Front-Desk Integrity Block</p>
                      </div>
                  </div>

                  <div className="bg-red-50 p-6 rounded-3xl mb-8 space-y-4 border border-red-100">
                      <p className="text-sm font-bold text-red-900 leading-relaxed uppercase tracking-tighter">
                          Attention: <strong>{overrideTarget.patientName}</strong> is currently flagged for:
                      </p>
                      <ul className="space-y-3">
                          {(getPatient(overrideTarget.patientId)?.reliabilityScore ?? 100) < RELIABILITY_THRESHOLD && (
                              <li className="flex items-center gap-3 text-sm font-black text-red-700 uppercase tracking-tight"><AlertCircle size={18}/> Low Appointment Reliability</li>
                          )}
                          {(getPatient(overrideTarget.patientId)?.currentBalance ?? 0) > 0 && (
                              <li className="flex items-center gap-3 text-sm font-black text-red-700 uppercase tracking-tight"><FinanceIcon size={18}/> Unresolved Practice Debt</li>
                          )}
                      </ul>
                  </div>

                  <div className="space-y-6 mb-10">
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Select Authorizing Manager *</label>
                        <select 
                            aria-label="Authorizing Manager"
                            value={selectedManagerId} 
                            onChange={e => setSelectedManagerId(e.target.value)}
                            className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-slate-800 outline-none focus:border-red-600 mb-4 transition-all"
                        >
                            <option value="">- Choose Authorized Personnel -</option>
                            {authorizedManagers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
                        </select>
                        
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-2"><Key size={14}/> Verifying Staff PIN *</label>
                        <input 
                            aria-label="Verification PIN"
                            type="password"
                            maxLength={4}
                            value={managerPin}
                            onChange={e => setManagerPin(e.target.value)}
                            placeholder="••••"
                            className="w-full p-5 text-center text-3xl tracking-[1em] border-2 border-slate-200 rounded-2xl focus:border-teal-600 outline-none font-black bg-slate-50"
                        />
                    </div>

                    <label className="flex items-start gap-4 p-5 rounded-3xl border-2 border-slate-200 hover:border-teal-600 transition-all cursor-pointer bg-white">
                        <input 
                            type="checkbox" 
                            checked={overrideConfirmed}
                            onChange={e => setOverrideConfirmed(e.target.checked)}
                            className="w-8 h-8 mt-0.5 accent-teal-700 rounded shadow-sm" 
                        />
                        <div className="text-xs font-black uppercase text-slate-800 leading-snug">
                            I certify that verbal approval has been received from the selected manager for this booking.
                        </div>
                    </label>
                  </div>

                  <div className="flex gap-4">
                      <button onClick={() => setOverrideTarget(null)} className="flex-1 py-5 bg-slate-100 text-slate-600 font-black rounded-2xl uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                      <button 
                        onClick={executeOverride}
                        disabled={!overrideConfirmed || !selectedManagerId || managerPin.length < 4}
                        className={`flex-[2] py-5 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl transition-all ${
                            overrideConfirmed && selectedManagerId && managerPin.length === 4 ? 'bg-red-600 shadow-red-600/30 hover:bg-red-700' : 'bg-slate-300 shadow-none grayscale opacity-50'
                        }`}
                      >
                          Confirm & Book
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CalendarView;

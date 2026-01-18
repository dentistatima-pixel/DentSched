import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Calendar, Clock, User, Save, Search, AlertCircle, Sparkles, Beaker, CreditCard, Activity, ArrowRight, ClipboardCheck, FileSignature, CheckCircle, Shield, Briefcase, Lock, Armchair, AlertTriangle, ShieldAlert, BadgeCheck, ShieldX, Database, PackageCheck, UserCheck, Baby, Hash, Phone, FileText, Zap, UserPlus } from 'lucide-react';
import { Patient, User as Staff, AppointmentType, UserRole, Appointment, AppointmentStatus, FieldSettings, LabStatus, TreatmentPlanStatus, SterilizationCycle, ClinicResource, Vendor, DaySchedule, WaitlistEntry } from '../types';
import Fuse from 'fuse.js';
import { formatDate, CRITICAL_CLEARANCE_CONDITIONS } from '../constants';
import { useToast } from './ToastSystem';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  staff: Staff[];
  appointments: Appointment[]; 
  onSave: (appointment: Appointment) => void;
  onSavePatient?: (patient: Partial<Patient>) => void; 
  onAddToWaitlist: (entry: Omit<WaitlistEntry, 'id' | 'patientName'>) => void;
  initialDate?: string;
  initialTime?: string;
  initialPatientId?: string;
  existingAppointment?: Appointment | null;
  fieldSettings: FieldSettings; 
  sterilizationCycles?: SterilizationCycle[];
  onManualOverride?: (gateId: string, reason: string) => void;
  isDowntime?: boolean;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ 
  isOpen, onClose, patients, staff, appointments, onSave, onSavePatient, onAddToWaitlist, initialDate, initialTime, initialPatientId, existingAppointment, fieldSettings, sterilizationCycles = [], onManualOverride, isDowntime
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'existing' | 'new' | 'block'>('existing');
  
  const [providerId, setProviderId] = useState('');
  const [resourceId, setResourceId] = useState(''); 
  const [date, setDate] = useState(initialDate || new Date().toLocaleDateString('en-CA'));
  const [time, setTime] = useState(initialTime || '09:00');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [procedureType, setProcedureType] = useState<string>(fieldSettings.procedures[0]?.name || 'Consultation');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [blockTitle, setBlockTitle] = useState('');

  // Gap 6: Slot Finder State
  const [showFinder, setShowFinder] = useState(false);
  const [finderResults, setFinderResults] = useState<{ date: string, time: string }[]>([]);
  const [isFinding, setIsFinding] = useState(false);
  const [timePreference, setTimePreference] = useState<'any' | 'am' | 'pm'>('any');

  // Waitlist form state
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [waitlistPriority, setWaitlistPriority] = useState<'Normal' | 'High'>('Normal');
  const [waitlistNotes, setWaitlistNotes] = useState('');

  const handleAddToWaitlistClick = () => {
    const patientIdForWaitlist = selectedPatientId || initialPatientId;
    if (!onAddToWaitlist || !patientIdForWaitlist) return;
    onAddToWaitlist({
        patientId: patientIdForWaitlist,
        procedure: procedureType,
        durationMinutes: duration,
        priority: waitlistPriority,
        notes: waitlistNotes,
    });
    onClose();
  };

  const findAvailableSlots = useCallback(() => {
    setIsFinding(true);
    setFinderResults([]);

    setTimeout(() => { // Simulate async search
        const results: { date: string, time: string }[] = [];
        let currentDate = new Date();
        const searchLimit = new Date();
        searchLimit.setDate(searchLimit.getDate() + 30); // Look 30 days ahead

        const procedureDuration = duration;

        while (currentDate <= searchLimit && results.length < 5) {
            const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDate.getDay()] as keyof FieldSettings['operationalHours'];
            const hours = fieldSettings.operationalHours[dayKey];

            if (hours && !hours.isClosed) {
                const startHour = parseInt(hours.start.split(':')[0]);
                const endHour = parseInt(hours.end.split(':')[0]);

                for (let hour = startHour; hour < endHour; hour++) {
                    for (let minute = 0; minute < 60; minute += 15) { // Check every 15 mins
                        if (results.length >= 5) break;

                        const isAm = hour < 12;
                        if (timePreference === 'am' && !isAm) continue;
                        if (timePreference === 'pm' && isAm) continue;

                        const slotDate = currentDate.toLocaleDateString('en-CA');
                        const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                        const slotStart = new Date(`${slotDate}T${slotTime}`);
                        const slotEnd = new Date(slotStart.getTime() + procedureDuration * 60000);

                        const conflict = appointments.some(apt => {
                            if (apt.providerId !== providerId && apt.resourceId !== resourceId) return false;
                            
                            const practitionerDelay = fieldSettings.practitionerDelays?.[apt.providerId] || 0;
                            const effectiveDuration = apt.durationMinutes + practitionerDelay;
                            
                            const aptStart = new Date(`${apt.date}T${apt.time}`);
                            const aptEnd = new Date(aptStart.getTime() + effectiveDuration * 60000);
                            
                            return (slotStart < aptEnd && slotEnd > aptStart);
                        });

                        if (!conflict) {
                            results.push({ date: slotDate, time: slotTime });
                        }
                    }
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        setFinderResults(results);
        setIsFinding(false);
    }, 200);
  }, [providerId, resourceId, duration, appointments, fieldSettings.operationalHours, fieldSettings.practitionerDelays, timePreference]);

  // Fuzzy Search Setup
  const fuse = useMemo(() => new Fuse(patients, {
    keys: ['name', 'phone', 'id'],
    threshold: 0.3
  }), [patients]);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return fuse.search(searchTerm).map(r => r.item).slice(0, 5);
  }, [searchTerm, fuse]);

  const dentists = staff.filter(s => s.role === UserRole.DENTIST || s.role === UserRole.DENTAL_ASSISTANT);
  const selectedProvider = useMemo(() => staff.find(s => s.id === providerId), [staff, providerId]);
  const selectedPatient = useMemo(() => patients.find(p => p.id === (selectedPatientId || initialPatientId)), [patients, selectedPatientId, initialPatientId]);

  // Conflict Detection
  const hasConflict = useMemo(() => {
    if (!providerId || !date || !time) return false;
    return appointments.some(a => 
      a.id !== existingAppointment?.id &&
      a.date === date && 
      a.time === time && 
      (a.providerId === providerId || (resourceId && a.resourceId === resourceId))
    );
  }, [appointments, providerId, date, time, resourceId, existingAppointment]);

  useEffect(() => {
    if (isOpen) {
      if (existingAppointment) {
        setProviderId(existingAppointment.providerId);
        setResourceId(existingAppointment.resourceId || '');
        setDate(existingAppointment.date);
        setTime(existingAppointment.time);
        setDuration(existingAppointment.durationMinutes);
        setNotes(existingAppointment.notes || '');
        setProcedureType(existingAppointment.type);
        setSelectedPatientId(existingAppointment.patientId);
        setActiveTab(existingAppointment.isBlock ? 'block' : 'existing');
        if (existingAppointment.isBlock) setBlockTitle(existingAppointment.title || '');
      } else {
        setSelectedPatientId(initialPatientId || '');
        setProviderId(dentists[0]?.id || '');
        setResourceId(fieldSettings.resources[0]?.id || '');
        setDate(initialDate || new Date().toLocaleDateString('en-CA'));
        setTime(initialTime || '09:00');
      }
      setShowFinder(false);
      setFinderResults([]);
      setShowWaitlistForm(false);
    }
  }, [isOpen, existingAppointment, initialDate, initialTime, initialPatientId, dentists, fieldSettings.resources]);

  useEffect(() => {
    // Only auto-update duration for new appointments or when patient context changes for a new booking
    if (!existingAppointment && selectedPatient) {
        const proc = fieldSettings.procedures.find(p => p.name === procedureType);
        if (proc) {
            if (proc.name.toLowerCase().includes('surgical') || proc.name.toLowerCase().includes('root canal')) {
                setDuration(90);
            } else if (proc.name.toLowerCase().includes('restoration') || proc.name.toLowerCase().includes('crown') || proc.name.toLowerCase().includes('veneer')) {
                setDuration(60);
            } else {
                setDuration(30);
            }
        }
    }
  }, [procedureType, selectedPatient, fieldSettings.procedures, existingAppointment]);

  const handleSaveClick = () => {
    if ((activeTab !== 'block' && !selectedPatientId && !initialPatientId) || !providerId) {
      toast.error("Required fields missing.");
      return;
    }

    if (hasConflict) {
      setShowWaitlistForm(true);
      return;
    }

    const appointment: Appointment = {
      id: existingAppointment?.id || `apt_${Date.now()}`,
      patientId: activeTab === 'block' ? 'ADMIN_BLOCK' : (selectedPatientId || initialPatientId!),
      providerId,
      resourceId: resourceId || undefined,
      branch: existingAppointment?.branch || fieldSettings.branches[0],
      date,
      time,
      durationMinutes: duration,
      type: activeTab === 'block' ? 'Clinical Block' : procedureType,
      status: existingAppointment?.status || AppointmentStatus.SCHEDULED,
      notes,
      isBlock: activeTab === 'block',
      title: activeTab === 'block' ? blockTitle : undefined,
    };

    onSave(appointment);
    onClose();
  };

  // --- PATIENT-FIRST UI LOGIC ---

  const clinicalAlert = useMemo(() => {
      if (!selectedPatient) return null;

      const hasCriticalCondition = selectedPatient.medicalConditions?.some(c => CRITICAL_CLEARANCE_CONDITIONS.includes(c));
      const isMinor = (selectedPatient.age || 99) < 18;
      const isPwd = selectedPatient.isPwd;

      if (hasCriticalCondition) {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          
          const validClearance = (selectedPatient.clearanceRequests || [])
              .filter(r => r.status === 'Approved' && r.approvedAt)
              .sort((a, b) => new Date(b.approvedAt!).getTime() - new Date(a.approvedAt!).getTime())[0];

          if (validClearance && new Date(validClearance.approvedAt!) > threeMonthsAgo) {
              return {
                  type: 'red' as const,
                  title: 'CRITICAL ALERT: REVIEW CLEARANCE',
                  message: `VALID CLEARANCE ON FILE (Expires: ${new Date(new Date(validClearance.approvedAt!).setMonth(new Date(validClearance.approvedAt!).getMonth() + 3)).toLocaleDateString()}). Proceed with caution and review document.`,
                  isClear: true
              };
          } else {
              return {
                  type: 'red' as const,
                  title: 'CRITICAL ALERT: PHYSICIAN\'S CLEARANCE REQUIRED',
                  message: `This patient has a high-risk medical condition. A signed clearance letter from their physician is mandatory before proceeding with any invasive treatment. No valid clearance found on file within the last 3 months.`,
                  isClear: false
              };
          }
      }

      if (isMinor) {
          return {
              type: 'amber' as const,
              title: 'SPECIAL CONSIDERATION: PATIENT IS A MINOR',
              message: 'Ensure the legal guardian is present and that all consent forms are co-signed. Verify guardianship details are up to date.',
              isClear: true
          };
      }
      
      if (isPwd) {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          const validPwdCert = selectedPatient.files?.find(f => f.category === 'PWD Certificate' && new Date(f.date) > sixMonthsAgo);

          if (!validPwdCert) {
              return {
                  type: 'amber' as const,
                  title: 'SPECIAL CONSIDERATION: PWD CERTIFICATE',
                  message: 'Patient is registered as PWD but no valid certificate has been recorded in the last 6 months. Please verify and upload.',
                  isClear: false
              };
          }
      }

      return null;
  }, [selectedPatient]);

  const timeSlotInfo = useMemo(() => {
    if (!providerId || !date) return { slots: [], isAvailable: () => false };
    const day = new Date(date).getDay();
    const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day];
    const operationalHours = fieldSettings.operationalHours[dayKey as keyof typeof fieldSettings.operationalHours];
    
    if (!operationalHours || operationalHours.isClosed) return { slots: [], isAvailable: () => false };

    const startHour = parseInt(operationalHours.start.split(':')[0]);
    const endHour = parseInt(operationalHours.end.split(':')[0]);

    const slots = Array.from({ length: (endHour - startHour) * 2 }, (_, i) => {
        const hour = startHour + Math.floor(i / 2);
        const minute = (i % 2) * 30;
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    });

    const bookedTimes = appointments
        .filter(a => a.date === date && (a.providerId === providerId || (resourceId && a.resourceId === resourceId)))
        .map(a => {
            const start = new Date(`${a.date}T${a.time}`);
            const end = new Date(start.getTime() + a.durationMinutes * 60000);
            return { start, end };
        });

    const isAvailable = (slot: string) => {
        const slotTime = new Date(`${date}T${slot}`);
        return !bookedTimes.some(b => slotTime >= b.start && slotTime < b.end);
    };

    return { slots, isAvailable };

  }, [date, providerId, resourceId, appointments, fieldSettings.operationalHours]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-teal-900/60 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-in fade-in duration-300">
      <div className="bg-slate-50 w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-2xl border-4 border-white flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-teal-900 p-8 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-lilac-500 p-3 rounded-2xl shadow-lg shadow-lilac-900/40">
              <Calendar size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">
                {existingAppointment ? 'Reschedule Session' : 'New Booking'}
              </h2>
              <p className="text-[10px] text-teal-300 font-black uppercase tracking-[0.3em] mt-1">
                Branch: {existingAppointment?.branch || fieldSettings.branches[0]}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
        </div>

        {!existingAppointment && !selectedPatient && (
          <div className="flex bg-slate-50 border-b border-slate-100 shrink-0" role="tablist">
            <button 
              onClick={() => setActiveTab('existing')}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'existing' ? 'bg-white text-teal-700 border-b-4 border-teal-600' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              Patient Registry
            </button>
            <button 
              onClick={() => setActiveTab('block')}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'block' ? 'bg-white text-lilac-700 border-b-4 border-lilac-600' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              Clinical Block
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar bg-slate-50/20">
          
          {activeTab === 'existing' && !selectedPatient && (
            <div className="space-y-4 animate-in slide-in-from-top-4">
              <label className="label">Search Clinical Registry</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600" size={20} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Name, Phone, or Patient ID..."
                  className="input pl-12 h-16 text-lg"
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {searchResults.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className="p-5 bg-white rounded-2xl border-2 border-slate-100 hover:border-teal-500 hover:shadow-lg transition-all flex justify-between items-center group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center font-black group-hover:bg-teal-600 group-hover:text-white transition-colors">
                        {p.surname ? p.surname[0] : ''}
                      </div>
                      <div className="text-left">
                        <div className="font-black text-slate-800 uppercase text-sm tracking-tight">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mobile: {p.phone}</div>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {(selectedPatient || activeTab === 'block') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8 animate-in fade-in duration-500">
              
              {/* Column 1: Patient, Alerts, Procedure */}
              <div className="space-y-8">
                {activeTab === 'existing' && selectedPatient && (
                    <>
                    <div className="bg-white p-6 rounded-[2rem] border-2 border-teal-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center shadow-inner">
                            <UserCheck size={32} className="text-teal-600"/>
                        </div>
                        <div>
                            <div className="font-black text-slate-900 uppercase text-lg leading-none">{selectedPatient.name}</div>
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-4">
                                <span className="flex items-center gap-1.5"><Hash size={12}/> {selectedPatient.id}</span>
                                <span className="flex items-center gap-1.5"><Phone size={12}/> {selectedPatient.phone}</span>
                            </div>
                        </div>
                        </div>
                        {!existingAppointment && <button onClick={() => setSelectedPatientId('')} className="p-2 text-slate-300 hover:text-red-500"><X size={20}/></button>}
                    </div>
                    {clinicalAlert && (
                         <div className={`p-6 rounded-3xl border-2 space-y-3 ${clinicalAlert.type === 'red' ? `bg-red-50 border-red-200 animate-pulse-red` : `bg-amber-50 border-amber-200`}`}>
                            <div className={`flex items-center gap-3 font-black uppercase text-xs tracking-widest ${clinicalAlert.type === 'red' ? 'text-red-800' : 'text-amber-800'}`}>
                                <ShieldAlert size={18} className={clinicalAlert.type === 'red' ? 'text-red-600' : 'text-amber-600'}/>
                                {clinicalAlert.title}
                            </div>
                            <p className={`text-sm font-bold leading-relaxed ${clinicalAlert.type === 'red' ? 'text-red-900' : 'text-amber-900'}`}>{clinicalAlert.message}</p>
                            {clinicalAlert.isClear && <div className="pt-2"><span className="px-3 py-1 bg-white text-teal-800 text-[10px] font-black uppercase rounded-full border-2 border-teal-200 shadow-sm">Document Verified</span></div>}
                         </div>
                    )}
                    <div>
                      <label className="label">Intended Procedure</label>
                      <select value={procedureType} onChange={e => setProcedureType(e.target.value)} className="input text-sm font-bold">
                        {fieldSettings.procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    </>
                )}
                {activeTab === 'block' && (
                  <div>
                    <label className="label">Block Description</label>
                    <input type="text" value={blockTitle} onChange={e => setBlockTitle(e.target.value)} className="input" placeholder="e.g. Staff Lunch, Maintenance..." />
                  </div>
                )}
                 <div>
                    <label className="label">Internal Narrative</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input h-24 text-sm" placeholder="Clinical prep notes, special requests..." />
                  </div>
              </div>

              {/* Column 2: When & Who */}
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                        <label className="label">Booking Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input font-black" />
                    </div>
                    <div>
                        <label className="label">Duration (minutes)</label>
                        <input 
                            type="number" 
                            value={duration} 
                            onChange={e => setDuration(parseInt(e.target.value) || 0)} 
                            className="input font-black" 
                            step="5"
                        />
                    </div>
                    <div>
                         <button onClick={() => setShowFinder(!showFinder)} className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white border-2 border-slate-200 text-slate-500 hover:text-teal-700 hover:border-teal-500 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-all">
                             <Zap size={16}/> Find Next Available
                         </button>
                    </div>
                </div>

                {showFinder && (
                    <div className="bg-white p-6 rounded-3xl border-2 border-teal-100 shadow-lg space-y-4 animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-center">
                            <h4 className="font-black text-teal-800 uppercase tracking-widest text-xs">Slot Finder</h4>
                            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                                <button onClick={() => setTimePreference('any')} className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg ${timePreference === 'any' ? 'bg-white shadow' : ''}`}>Any</button>
                                <button onClick={() => setTimePreference('am')} className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg ${timePreference === 'am' ? 'bg-white shadow' : ''}`}>AM</button>
                                <button onClick={() => setTimePreference('pm')} className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg ${timePreference === 'pm' ? 'bg-white shadow' : ''}`}>PM</button>
                            </div>
                        </div>
                        {!isFinding && finderResults.length > 0 && (
                             <div className="grid grid-cols-1 gap-2">
                                {finderResults.map((slot, i) => (
                                    <button key={i} onClick={() => { setDate(slot.date); setTime(slot.time); setShowFinder(false); }} className="p-4 bg-teal-50 border border-teal-100 rounded-2xl text-left hover:bg-teal-100 transition-colors">
                                        <div className="font-black text-teal-800 uppercase text-sm">{new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                                        <div className="text-xs font-bold text-teal-600 mt-1">{new Date(`1970-01-01T${slot.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                         {!isFinding && finderResults.length === 0 && (
                            <div className="text-center p-4">
                                <p className="text-xs text-slate-400 font-bold">No slots found within 30 days.</p>
                                <button onClick={() => { setShowWaitlistForm(true); setShowFinder(false); }} className="mt-2 text-xs font-black text-teal-700 bg-teal-100 px-4 py-2 rounded-lg">Add to Waitlist?</button>
                            </div>
                         )}
                         {isFinding && <div className="text-center p-4 text-xs font-bold text-slate-400 animate-pulse">Searching...</div>}
                        <button onClick={findAvailableSlots} disabled={isFinding} className="w-full mt-2 py-3 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:scale-105 transition-all">Search</button>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">Attending Provider</label>
                    <select value={providerId} onChange={e => setProviderId(e.target.value)} className="input font-black uppercase text-xs">
                        {dentists.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Operating Unit</label>
                    <select value={resourceId} onChange={e => setResourceId(e.target.value)} className="input font-black uppercase text-xs">
                      <option value="">Full Area Access</option>
                      {fieldSettings.resources.filter(r => r.branch === (existingAppointment?.branch || fieldSettings.branches[0])).map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                    <label className="label">Manual Time Selection</label>
                    <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-inner grid grid-cols-4 gap-2">
                        {timeSlotInfo.slots.map(slot => {
                            const isBooked = !timeSlotInfo.isAvailable(slot);
                            const isSelected = slot === time;
                            return (
                                <button
                                    key={slot}
                                    onClick={() => !isBooked && setTime(slot)}
                                    disabled={isBooked}
                                    className={`py-3 rounded-xl font-black text-xs transition-all duration-200 ${
                                        isSelected ? 'bg-teal-600 text-white shadow-lg' :
                                        isBooked ? 'bg-slate-100 text-slate-300 cursor-not-allowed line-through' :
                                        'bg-white text-slate-500 border border-slate-200 hover:bg-teal-50 hover:border-teal-300'
                                    }`}
                                >
                                    {new Date(`1970-01-01T${slot}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </button>
                            )
                        })}
                         {timeSlotInfo.slots.length === 0 && <p className="col-span-4 text-center text-xs font-bold text-slate-400 p-8">Clinic is closed on this day.</p>}
                    </div>
                </div>

              </div>

            </div>
          )}
          {showWaitlistForm && (
            <div className="bg-white p-10 rounded-3xl border-4 border-teal-100 shadow-2xl space-y-6 animate-in zoom-in-95">
                <h3 className="font-black text-teal-800 text-lg uppercase tracking-tight">Add to Waitlist</h3>
                <select value={waitlistPriority} onChange={e => setWaitlistPriority(e.target.value as any)} className="input">
                    <option value="Normal">Normal Priority</option>
                    <option value="High">High Priority</option>
                </select>
                <textarea value={waitlistNotes} onChange={e => setWaitlistNotes(e.target.value)} className="input h-24" placeholder="Patient preferences or notes..." />
                <div className="flex gap-4">
                    <button onClick={() => setShowWaitlistForm(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs">Cancel</button>
                    <button onClick={handleAddToWaitlistClick} className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2"><UserPlus size={16}/> Add Request</button>
                </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(selectedPatient || activeTab === 'block') && !showWaitlistForm && (
          <div className="p-8 border-t border-slate-100 bg-white flex justify-end gap-4 shrink-0">
            <button onClick={onClose} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
            <button 
              onClick={handleSaveClick}
              className={`px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl transition-all flex items-center gap-3 hover:scale-105 active:scale-95 ${hasConflict ? 'bg-orange-600 text-white shadow-orange-600/30' : 'bg-teal-600 text-white shadow-teal-600/30'}`}
            >
              {hasConflict ? <AlertTriangle size={20}/> : <Save size={20}/>} 
              {hasConflict ? 'Add to Waitlist' : (existingAppointment ? 'Commit Changes' : 'Confirm Booking')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

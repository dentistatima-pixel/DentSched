import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, User, Save, Search, AlertCircle, Sparkles, Beaker, CreditCard, Activity, ArrowRight, ClipboardCheck } from 'lucide-react';
import { Patient, User as Staff, AppointmentType, UserRole, Appointment, AppointmentStatus, FieldSettings, LabStatus } from '../types';
import Fuse from 'fuse.js';
import { formatDate } from '../constants';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  staff: Staff[];
  appointments: Appointment[]; 
  onSave: (appointment: Appointment) => void;
  onSavePatient?: (patient: Partial<Patient>) => void; 
  initialDate?: string;
  initialTime?: string;
  initialPatientId?: string;
  existingAppointment?: Appointment | null;
  fieldSettings: FieldSettings; 
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ 
  isOpen, onClose, patients, staff, appointments, onSave, onSavePatient, initialDate, initialTime, initialPatientId, existingAppointment, fieldSettings 
}) => {
  const [activeTab, setActiveTab] = useState<'existing' | 'new' | 'block'>('existing');
  
  // Common Fields
  const [providerId, setProviderId] = useState('');
  const [date, setDate] = useState(initialDate || new Date().toLocaleDateString('en-CA'));
  const [time, setTime] = useState(initialTime || '09:00');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [labStatus, setLabStatus] = useState<LabStatus>(LabStatus.NONE);

  // Existing Patient Tab
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [procedureType, setProcedureType] = useState<string>(AppointmentType.CONSULTATION);

  // New Patient Tab (Provisional)
  const [newPatientData, setNewPatientData] = useState({
      firstName: '',
      surname: '',
      phone: '',
      notes: ''
  });

  // Block Tab
  const [blockTitle, setBlockTitle] = useState('');

  // Reschedule Logic
  const [rescheduleReason, setRescheduleReason] = useState<'Correction' | 'Reschedule' | 'Provider Change'>('Reschedule');

  const dentists = staff.filter(s => s.role === UserRole.DENTIST);
  const assistants = staff.filter(s => s.role === UserRole.DENTAL_ASSISTANT);

  useEffect(() => {
      if (isOpen) {
          if (existingAppointment) {
              setProviderId(existingAppointment.providerId);
              setDate(existingAppointment.date);
              setTime(existingAppointment.time);
              setDuration(existingAppointment.durationMinutes);
              setNotes(existingAppointment.notes || '');
              setLabStatus(existingAppointment.labStatus || LabStatus.NONE);
              
              if (existingAppointment.isBlock) {
                  setActiveTab('block');
                  setBlockTitle(existingAppointment.title || '');
              } else {
                  setActiveTab('existing');
                  setSelectedPatientId(existingAppointment.patientId);
                  setProcedureType(existingAppointment.type);
              }
          } else {
              // Reset for new booking
              setDate(initialDate || new Date().toLocaleDateString('en-CA'));
              setTime(initialTime || '09:00');
              setProviderId(staff.find(s => s.role === UserRole.DENTIST)?.id || '');
              setLabStatus(LabStatus.NONE);
              
              if (initialPatientId) {
                  setActiveTab('existing');
                  setSelectedPatientId(initialPatientId);
              } else {
                  setSelectedPatientId('');
                  setActiveTab('existing');
              }
              
              setSearchTerm('');
          }
      }
  }, [isOpen, initialDate, initialTime, initialPatientId, existingAppointment, staff]);

  // Search Logic
  const fuse = new Fuse(patients, { keys: ['name', 'phone', 'id'], threshold: 0.3 });
  const searchResults = searchTerm ? fuse.search(searchTerm).map(r => r.item).slice(0, 5) : [];
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // --- CLINICAL BRIDGE (PLANNED TREATMENTS) ---
  const plannedTreatments = useMemo(() => {
      if (!selectedPatient || !selectedPatient.dentalChart) return [];
      return selectedPatient.dentalChart.filter(e => e.status === 'Planned');
  }, [selectedPatient]);

  const handleApplyPlannedTreatment = (tx: any) => {
      setProcedureType(tx.procedure);
      // Try to find if this procedure is in settings to get a price or guess duration
      const procDef = fieldSettings.procedures.find(p => p.name === tx.procedure);
      
      // Smart Duration Guessing
      let guessDuration = 60;
      const lowerProc = tx.procedure.toLowerCase();
      if (lowerProc.includes('cleaning') || lowerProc.includes('prophylaxis')) guessDuration = 45;
      if (lowerProc.includes('consult')) guessDuration = 30;
      if (lowerProc.includes('surgery') || lowerProc.includes('canal')) guessDuration = 90;

      setDuration(guessDuration);
      
      // Auto-fill notes with Tooth #
      const toothInfo = tx.toothNumber ? `Tooth #${tx.toothNumber}` : '';
      const surfaceInfo = tx.surfaces ? `(${tx.surfaces})` : '';
      setNotes(`Scheduled from Treatment Plan: ${toothInfo} ${surfaceInfo}`);
  };

  // --- SMART SLOT LOGIC ---
  const availableSlots = useMemo(() => {
      if (!providerId || !date) return [];
      
      // 1. Generate all possible slots (e.g. 9:00 to 17:00)
      const slots: string[] = [];
      let startHour = 9;
      const endHour = 17;
      
      for (let h = startHour; h < endHour; h++) {
          slots.push(`${h.toString().padStart(2, '0')}:00`);
          slots.push(`${h.toString().padStart(2, '0')}:30`);
      }

      // 2. Find conflicts
      const dayAppointments = appointments.filter(a => 
          a.providerId === providerId && 
          a.date === date && 
          a.status !== AppointmentStatus.CANCELLED &&
          a.id !== existingAppointment?.id // Ignore self if editing
      );

      // 3. Filter slots
      return slots.map(slot => {
          const isTaken = dayAppointments.some(a => {
              // Simple check: exact match or overlap (simplified for demo)
              // Real logic needs minute-by-minute collision detection
              return a.time === slot; 
          });
          return { time: slot, available: !isTaken };
      });
  }, [providerId, date, appointments, existingAppointment]);


  // Helper to format date
  const getDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        return dateObj.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    } catch (e) {
        return dateStr;
    }
  };

  const isCritical = (p?: Patient) => {
      if (!p) return false;
      return (
          p.seriousIllness || 
          p.underMedicalTreatment || 
          (p.medicalConditions && p.medicalConditions.length > 0)
      );
  };

  const handleSave = () => {
      if (!providerId) {
          alert("Please select a provider");
          return;
      }

      // Double Booking Check
      const conflict = appointments.find(a => 
        a.providerId === providerId &&
        a.date === date &&
        a.time === time &&
        a.status !== AppointmentStatus.CANCELLED &&
        a.id !== existingAppointment?.id 
      );

      if (conflict) {
          const busyProvider = staff.find(s => s.id === providerId)?.name || 'Provider';
          if (!window.confirm(`Double Booking Warning:\n${busyProvider} is already busy at ${time}.\n\nBook anyway?`)) {
              return;
          }
      }

      let finalPatientId = selectedPatientId;
      let isBlock = false;
      let title = undefined;

      if (activeTab === 'new') {
          if (!newPatientData.firstName || !newPatientData.surname || !newPatientData.phone) {
              alert("Please fill in required fields");
              return;
          }
          const newId = Math.floor(10000000 + Math.random() * 90000000).toString(); 
          const newPatient: Partial<Patient> = {
              id: newId,
              name: `${newPatientData.firstName} ${newPatientData.surname}`,
              firstName: newPatientData.firstName,
              surname: newPatientData.surname,
              phone: newPatientData.phone,
              notes: newPatientData.notes,
              provisional: true, 
              dob: '',
              email: ''
          };
          if (onSavePatient) onSavePatient(newPatient);
          finalPatientId = newId;
      } 
      
      if (activeTab === 'block') {
          isBlock = true;
          title = blockTitle || 'Blocked Time';
          finalPatientId = 'BLOCK';
      } else {
          if (!finalPatientId) {
              alert("Please select a patient");
              return;
          }
      }

      const appointmentData: Appointment = {
          id: existingAppointment?.id || Math.random().toString(36).substr(2, 9),
          patientId: finalPatientId,
          providerId,
          branch: existingAppointment?.branch || '', // Placeholder if new, App.tsx will handle assignment
          date,
          time,
          durationMinutes: duration,
          type: activeTab === 'block' ? AppointmentType.CONSULTATION : procedureType,
          status: existingAppointment?.status || AppointmentStatus.SCHEDULED,
          notes,
          labStatus: isBlock ? LabStatus.NONE : labStatus,
          isBlock,
          title
      };

      if (existingAppointment) {
          const isDateChanged = existingAppointment.date !== date || existingAppointment.time !== time;
          const isProviderChanged = existingAppointment.providerId !== providerId;
          
          if (isDateChanged || isProviderChanged) {
              const history = existingAppointment.rescheduleHistory || [];
              let reason = rescheduleReason;
              if (isProviderChanged && reason !== 'Correction') {
                  reason = 'Provider Change';
              }
              history.push({
                  previousDate: existingAppointment.date,
                  previousTime: existingAppointment.time,
                  previousProviderId: existingAppointment.providerId,
                  reason: reason,
                  timestamp: new Date().toISOString()
              });
              appointmentData.rescheduleHistory = history;
          }
      }

      onSave(appointmentData);
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-end md:items-center p-0 md:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-20 duration-300 md:duration-200 md:zoom-in-95 max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <div className="md:hidden w-12 h-1 bg-slate-200 rounded-full mb-3 mx-auto"></div>
            <h2 className="text-xl font-bold text-slate-800">{existingAppointment ? 'Edit Appointment' : 'Book Appointment'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        {/* --- PATIENT SNAPSHOT HEADER --- */}
        {selectedPatient && activeTab === 'existing' && (
            <div className={`
                p-4 flex flex-col gap-3 border-b transition-colors
                ${isCritical(selectedPatient) ? 'bg-red-50 border-red-100' : 'bg-teal-50 border-teal-100'}
            `}>
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${isCritical(selectedPatient) ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-600'}`}>
                            {isCritical(selectedPatient) ? <AlertCircle size={24} /> : <User size={24} />}
                        </div>
                        <div>
                            <h3 className={`font-bold text-lg leading-none ${isCritical(selectedPatient) ? 'text-red-900' : 'text-teal-900'}`}>{selectedPatient.name}</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <div className="flex items-center gap-1 text-xs font-medium opacity-80">
                                    <Clock size={12} />
                                    Last: {formatDate(selectedPatient.lastVisit)}
                                </div>
                                {isCritical(selectedPatient) && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold bg-red-200 text-red-800 px-2 py-0.5 rounded uppercase">
                                        <Activity size={10} /> Medical Alert
                                    </span>
                                )}
                                <span className="flex items-center gap-1 text-[10px] font-bold bg-white/50 px-2 py-0.5 rounded border border-black/5">
                                    <CreditCard size={10} /> Balance: ₱0.00
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setSelectedPatientId('')} className="text-xs font-bold underline opacity-50 hover:opacity-100">Change</button>
                </div>

                {/* --- CLINICAL BRIDGE: TREATMENT PLAN INTEGRATION --- */}
                {plannedTreatments.length > 0 && (
                    <div className="bg-white/60 p-2 rounded-lg border border-black/5">
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase opacity-60 mb-2">
                            <ClipboardCheck size={10} /> Planned Treatments
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {plannedTreatments.map((tx, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleApplyPlannedTreatment(tx)}
                                    className="text-xs flex items-center gap-1 bg-white border border-slate-200 shadow-sm px-2 py-1.5 rounded-lg hover:border-teal-400 hover:text-teal-700 hover:shadow-md transition-all group"
                                >
                                    <span className="font-bold">{tx.procedure}</span>
                                    {tx.toothNumber && <span className="bg-slate-100 text-slate-600 px-1 rounded text-[10px] font-mono">#{tx.toothNumber}</span>}
                                    <ArrowRight size={10} className="text-slate-300 group-hover:text-teal-500"/>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Tabs */}
        {!existingAppointment && (
            <div className="flex border-b border-slate-200">
                <button onClick={() => setActiveTab('existing')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'existing' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500'}`}>Existing Patient</button>
                <button onClick={() => setActiveTab('new')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'new' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500'}`}>New Patient</button>
                <button onClick={() => setActiveTab('block')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'block' ? 'border-slate-600 text-slate-800' : 'border-transparent text-slate-500'}`}>Block Time</button>
            </div>
        )}

        <div className="p-6 space-y-6 pb-safe">
            
            {/* EXISTING PATIENT SEARCH */}
            {activeTab === 'existing' && !selectedPatient && (
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Find Patient</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Search by Name or ID..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    {searchTerm && searchResults.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            {searchResults.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => { setSelectedPatientId(p.id); setSearchTerm(''); }}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex justify-between items-center"
                                >
                                    <span className="font-bold text-slate-800">{p.name}</span>
                                    <span className="text-xs text-slate-400">{p.phone}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* NEW PATIENT FORM */}
            {activeTab === 'new' && (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                     <div className="col-span-2 text-xs font-bold text-teal-600 uppercase flex items-center gap-2"><Sparkles size={14}/> Quick Registration</div>
                     <input type="text" placeholder="First Name *" className="p-2 border rounded-lg" value={newPatientData.firstName} onChange={e => setNewPatientData({...newPatientData, firstName: e.target.value})}/>
                     <input type="text" placeholder="Surname *" className="p-2 border rounded-lg" value={newPatientData.surname} onChange={e => setNewPatientData({...newPatientData, surname: e.target.value})}/>
                     <input type="tel" placeholder="Mobile *" className="col-span-2 p-2 border rounded-lg" value={newPatientData.phone} onChange={e => setNewPatientData({...newPatientData, phone: e.target.value})}/>
                </div>
            )}

            {/* BLOCK FORM */}
            {activeTab === 'block' && (
                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Block Reason</label>
                    <input type="text" placeholder="e.g. Lunch, Meeting" className="w-full p-2 border rounded-lg" value={blockTitle} onChange={(e) => setBlockTitle(e.target.value)} />
                </div>
            )}

            {/* --- SCHEDULING DETAILS --- */}
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                     {/* Provider Select */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Provider</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none font-medium"
                            value={providerId}
                            onChange={(e) => setProviderId(e.target.value)}
                        >
                            <option value="">Select...</option>
                            {dentists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            <optgroup label="Assistants">
                                {assistants.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </optgroup>
                        </select>
                    </div>

                    {/* Date Picker */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
                        <div className="relative group">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                            <div className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium h-[46px] flex items-center truncate">
                                 {getDisplayDate(date)}
                            </div>
                            <input 
                                type="date" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* SMART TIME PICKER */}
                <div>
                     <label className="flex justify-between items-center text-sm font-bold text-slate-700 mb-2">
                        <span>Time Slot</span>
                        <span className="text-xs font-normal text-slate-400">{availableSlots.filter(s => s.available).length} available</span>
                     </label>
                     
                     {/* Grid of Slots */}
                     <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto mb-2 custom-scrollbar">
                         {availableSlots.map(slot => (
                             <button
                                key={slot.time}
                                type="button"
                                onClick={() => slot.available && setTime(slot.time)}
                                disabled={!slot.available}
                                className={`
                                    py-2 px-1 rounded-lg text-xs font-bold transition-all border
                                    ${time === slot.time 
                                        ? 'bg-teal-600 text-white border-teal-600 shadow-md transform scale-105' 
                                        : slot.available 
                                            ? 'bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-600' 
                                            : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed decoration-slate-300 line-through'}
                                `}
                             >
                                 {slot.time}
                             </button>
                         ))}
                     </div>
                     
                     {/* Custom Time Fallback */}
                     <div className="flex items-center gap-2 mt-2">
                         <span className="text-xs font-bold text-slate-400 uppercase">Manual:</span>
                         <input 
                            type="time" 
                            value={time} 
                            onChange={(e) => setTime(e.target.value)}
                            className="bg-transparent border-b border-slate-300 text-sm font-mono focus:border-teal-500 outline-none" 
                        />
                     </div>
                </div>

                {/* Duration & Procedure */}
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Duration</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                        >
                            {[15, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} mins</option>)}
                        </select>
                    </div>
                    {activeTab !== 'block' && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Procedure</label>
                            <select 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                value={procedureType}
                                onChange={(e) => setProcedureType(e.target.value)}
                            >
                                {fieldSettings.procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {/* Lab & Notes */}
                {activeTab !== 'block' && (
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center justify-between">
                         <span className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1"><Beaker size={14}/> Lab Case?</span>
                         <div className="flex gap-1">
                             {Object.values(LabStatus).map(s => (
                                 <button
                                    key={s}
                                    onClick={() => setLabStatus(s)}
                                    className={`px-3 py-1 rounded text-[10px] font-bold border transition-colors ${labStatus === s ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-500 border-amber-200'}`}
                                 >
                                     {s}
                                 </button>
                             ))}
                         </div>
                    </div>
                )}
                
                <textarea 
                    placeholder="Internal Notes..." 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-teal-500 outline-none resize-none h-20"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />

                {/* Reschedule Reason */}
                {existingAppointment && (
                     <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex flex-col gap-2">
                         <label className="text-xs font-bold text-blue-800 uppercase">Modification Reason</label>
                         <div className="flex gap-4">
                             {['Reschedule', 'Correction'].map(r => (
                                 <label key={r} className="flex items-center gap-2 cursor-pointer">
                                     <input type="radio" name="reason" value={r} checked={rescheduleReason === r} onChange={() => setRescheduleReason(r as any)} className="accent-blue-600"/>
                                     <span className="text-sm text-blue-900">{r}</span>
                                 </label>
                             ))}
                         </div>
                     </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex gap-3 pb-8 md:pb-4 bg-white md:rounded-b-3xl sticky bottom-0 z-20">
            <button 
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={handleSave}
                className="flex-[2] py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
            >
                <Save size={20} />
                {existingAppointment ? 'Update Booking' : 'Confirm Booking'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default AppointmentModal;
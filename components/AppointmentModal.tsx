
import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, User, Save, Search, AlertCircle, Sparkles, Beaker, CreditCard, Activity, ArrowRight, ClipboardCheck, FileSignature, CheckCircle, Shield, Briefcase, Lock, Armchair, AlertTriangle, ShieldAlert, BadgeCheck, ShieldX, Database, PackageCheck, UserCheck } from 'lucide-react';
import { Patient, User as Staff, AppointmentType, UserRole, Appointment, AppointmentStatus, FieldSettings, LabStatus, TreatmentPlanStatus, SterilizationCycle, ClinicResource, Vendor } from '../types';
import Fuse from 'fuse.js';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';

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
  sterilizationCycles?: SterilizationCycle[];
  onManualOverride?: (gateId: string, reason: string) => void;
  isDowntime?: boolean;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ 
  isOpen, onClose, patients, staff, appointments, onSave, onSavePatient, initialDate, initialTime, initialPatientId, existingAppointment, fieldSettings, sterilizationCycles = [], onManualOverride, isDowntime
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
    }
  }, [isOpen, existingAppointment, initialDate, initialTime, initialPatientId]);

  const handleSaveClick = () => {
    if ((activeTab !== 'block' && !selectedPatientId && !initialPatientId) || !providerId) {
      toast.error("Required fields missing.");
      return;
    }

    if (hasConflict) {
      toast.warning("Resource conflict detected. Selection required override.");
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-teal-900/60 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[3rem] shadow-2xl border-4 border-white flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
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

        {/* Tab Selection */}
        {!existingAppointment && (
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
                        {p.surname[0]}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-500">
              
              {/* Left Column: Who & What */}
              <div className="space-y-8">
                {activeTab === 'existing' && (
                  <div className="bg-white p-6 rounded-[2rem] border-2 border-teal-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><UserCheck size={28}/></div>
                      <div>
                        <div className="font-black text-slate-900 uppercase text-lg leading-none">{selectedPatient?.name}</div>
                        <div className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">Patient Verified</div>
                      </div>
                    </div>
                    {!existingAppointment && <button onClick={() => setSelectedPatientId('')} className="p-2 text-slate-300 hover:text-red-500"><X size={20}/></button>}
                  </div>
                )}

                {activeTab === 'block' && (
                  <div>
                    <label className="label">Block Description</label>
                    <input type="text" value={blockTitle} onChange={e => setBlockTitle(e.target.value)} className="input" placeholder="e.g. Staff Lunch, Maintenance..." />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="label">Attending Provider</label>
                    <div className="grid grid-cols-1 gap-2">
                      {dentists.map(d => (
                        <button 
                          key={d.id}
                          onClick={() => setProviderId(d.id)}
                          className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${providerId === d.id ? 'bg-teal-50 border-teal-500 shadow-md scale-[1.02]' : 'bg-white border-slate-100 opacity-60'}`}
                        >
                          <div className="flex items-center gap-3">
                            <img src={d.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                            <div className="text-left">
                              <div className="font-black text-slate-800 text-xs uppercase">{d.name}</div>
                              <div className="text-[9px] text-slate-400 font-bold uppercase">{d.role}</div>
                            </div>
                          </div>
                          {providerId === d.id && <BadgeCheck size={20} className="text-teal-600" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Operating Unit (Chair)</label>
                    <select value={resourceId} onChange={e => setResourceId(e.target.value)} className="input font-black uppercase text-xs">
                      <option value="">Full Area Access</option>
                      {fieldSettings.resources.filter(r => r.branch === (existingAppointment?.branch || fieldSettings.branches[0])).map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: When */}
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-xl space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Booking Date</label>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input font-black" />
                    </div>
                    <div>
                      <label className="label">Session Start</label>
                      <input type="time" value={time} onChange={e => setTime(e.target.value)} className="input font-black" />
                    </div>
                  </div>

                  <div>
                    <label className="label">Allocated Duration</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[30, 60, 120].map(m => (
                        <button key={m} onClick={() => setDuration(m)} className={`py-3 rounded-xl border-2 font-black text-xs transition-all ${duration === m ? 'bg-lilac-600 border-lilac-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeTab === 'existing' && (
                    <div>
                      <label className="label">Intended Procedure</label>
                      <select value={procedureType} onChange={e => setProcedureType(e.target.value)} className="input text-sm font-bold">
                        {fieldSettings.procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="label">Internal Narrative</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input h-24 text-sm" placeholder="Clinical prep notes, special requests..." />
                  </div>
                </div>

                {hasConflict && (
                  <div className="bg-red-50 border-2 border-red-200 p-6 rounded-3xl flex items-start gap-4 animate-in shake duration-500">
                    <ShieldAlert size={32} className="text-red-600 shrink-0 mt-1" />
                    <div>
                      <div className="font-black text-red-900 uppercase text-xs tracking-widest">Resource Overlap Detected</div>
                      <p className="text-[11px] text-red-700 font-bold leading-tight mt-1">
                        The selected provider or chair is already reserved for this slot. Double-booking requires administrative override.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        {(selectedPatient || activeTab === 'block') && (
          <div className="p-8 border-t border-slate-100 bg-white flex justify-end gap-4 shrink-0">
            <button onClick={onClose} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
            <button 
              onClick={handleSaveClick}
              className={`px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl transition-all flex items-center gap-3 hover:scale-105 active:scale-95 ${hasConflict ? 'bg-red-600 text-white shadow-red-600/30' : 'bg-teal-600 text-white shadow-teal-600/30'}`}
            >
              {hasConflict ? <ShieldAlert size={20}/> : <Save size={20}/>} 
              {existingAppointment ? 'Commit Changes' : 'Confirm Booking'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

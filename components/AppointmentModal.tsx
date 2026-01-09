import React, { useState, useEffect, useMemo } from 'react';
/* Fix: Added missing CalendarPlus, Stethoscope, and FileText icons to lucide-react imports */
import { X, Calendar, Clock, User, Save, Search, AlertCircle, Sparkles, Beaker, CreditCard, Activity, ArrowRight, ClipboardCheck, FileSignature, CheckCircle, Shield, Briefcase, Lock, Armchair, AlertTriangle, ShieldAlert, BadgeCheck, ShieldX, Database, PackageCheck, UserCheck, CalendarPlus, Stethoscope, FileText } from 'lucide-react';
/* Fix: Added missing UserRole to types import to resolve 'Cannot find name UserRole' error on line 39 */
import { Patient, User as Staff, UserRole, AppointmentType, AppointmentStatus, Appointment, FieldSettings, LabStatus, TreatmentPlanStatus, SterilizationCycle, ClinicResource, Vendor } from '../types';
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
  
  const [providerId, setProviderId] = useState('');
  const [resourceId, setResourceId] = useState(''); 
  const [date, setDate] = useState(initialDate || new Date().toLocaleDateString('en-CA'));
  const [time, setTime] = useState(initialTime || '09:00');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [procedureType, setProcedureType] = useState<string>(AppointmentType.CONSULTATION);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || '');

  // Fix: UserRole is now imported correctly from ../types
  const dentists = staff.filter(s => s.role === UserRole.DENTIST);
  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);

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
      } else {
        setSelectedPatientId(initialPatientId || '');
        setDate(initialDate || new Date().toLocaleDateString('en-CA'));
        setTime(initialTime || '09:00');
      }
    }
  }, [isOpen, existingAppointment, initialDate, initialTime, initialPatientId]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !providerId) {
        toast.error("Forensic requirement: Patient and Provider are mandatory.");
        return;
    }
    const newApt: Appointment = {
        id: existingAppointment?.id || `apt_${Date.now()}`,
        patientId: selectedPatientId,
        providerId,
        resourceId: resourceId || undefined,
        branch: existingAppointment?.branch || fieldSettings.branches[0],
        date,
        time,
        durationMinutes: duration,
        type: procedureType,
        status: existingAppointment?.status || AppointmentStatus.SCHEDULED,
        notes
    };
    onSave(newApt);
    onClose();
    toast.success(existingAppointment ? "Registry updated." : "Appointment queued.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border-4 border-white animate-in zoom-in-95">
        <div className="p-8 bg-teal-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             {/* Fix: CalendarPlus is now imported from lucide-react */}
             <div className="bg-teal-600 p-3 rounded-2xl shadow-lg"><CalendarPlus size={32} /></div>
             <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">{existingAppointment ? 'Reschedule Session' : 'New Intake Queue'}</h2>
                <p className="text-xs font-black text-teal-400 uppercase tracking-widest">RA 9484 Article IV Compliance</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-slate-50/30">
            {/* Patient Identity Selection - Stacked for tablet clarity */}
            <div className="space-y-4">
                <label className="label flex items-center gap-2"><User size={18}/> Patient Identity</label>
                <select 
                    value={selectedPatientId} 
                    onChange={e => setSelectedPatientId(e.target.value)} 
                    className="input text-lg font-black bg-white"
                    required
                >
                    <option value="">- SELECT FROM REGISTRY -</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <label className="label flex items-center gap-2"><Clock size={18}/> Schedule</label>
                    <div className="space-y-3">
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input bg-white" required />
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} className="input bg-white" required />
                    </div>
                </div>
                <div className="space-y-4">
                    <label className="label flex items-center gap-2"><UserCheck size={18}/> Provider</label>
                    <select value={providerId} onChange={e => setProviderId(e.target.value)} className="input bg-white h-full" required>
                        <option value="">- Select Doctor -</option>
                        {dentists.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                {/* Fix: Stethoscope is now imported from lucide-react */}
                <label className="label flex items-center gap-2"><Stethoscope size={18}/> Clinical Procedure Selection</label>
                <select value={procedureType} onChange={e => setProcedureType(e.target.value)} className="input text-base font-bold bg-white">
                    {fieldSettings.procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
            </div>

            <div className="space-y-4">
                {/* Fix: FileText is now imported from lucide-react */}
                <label className="label flex items-center gap-2"><FileText size={18}/> Clinical Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input h-32 bg-white resize-none" placeholder="Administrative or clinical flags for the provider..."/>
            </div>
        </form>

        <div className="p-8 border-t border-slate-100 bg-white flex gap-4 shrink-0">
            <button onClick={onClose} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl tracking-widest">Discard</button>
            <button onClick={handleSave} className="flex-[2] py-5 bg-teal-600 text-white font-black uppercase text-xs rounded-2xl shadow-2xl shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all tracking-widest">Commit to Schedule</button>
        </div>
      </div>
    </div>
  );
};
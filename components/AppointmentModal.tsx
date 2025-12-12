
import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, User, Save, Search, AlertCircle, Sparkles, Beaker, CreditCard, Activity, ArrowRight, ClipboardCheck, FileSignature, CheckCircle, Shield } from 'lucide-react';
import { Patient, User as Staff, AppointmentType, UserRole, Appointment, AppointmentStatus, FieldSettings, LabStatus, TreatmentPlanStatus, SterilizationCycle } from '../types';
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
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ 
  isOpen, onClose, patients, staff, appointments, onSave, onSavePatient, initialDate, initialTime, initialPatientId, existingAppointment, fieldSettings, sterilizationCycles = []
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'existing' | 'new' | 'block'>('existing');
  
  // Fields
  const [providerId, setProviderId] = useState('');
  const [date, setDate] = useState(initialDate || new Date().toLocaleDateString('en-CA'));
  const [time, setTime] = useState(initialTime || '09:00');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [labStatus, setLabStatus] = useState<LabStatus>(LabStatus.NONE);
  const [sterilizationCycleId, setSterilizationCycleId] = useState(''); // NEW

  // ... (rest of the state remains the same)
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [procedureType, setProcedureType] = useState<string>(AppointmentType.CONSULTATION);
  const [newPatientData, setNewPatientData] = useState({ firstName: '', surname: '', phone: '', notes: '' });
  const [blockTitle, setBlockTitle] = useState('');
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
              setSterilizationCycleId(existingAppointment.sterilizationCycleId || ''); // NEW
              
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
              setSterilizationCycleId(''); // NEW
              
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
  
  const selectedProcedure = fieldSettings.procedures.find(p => p.name === procedureType);
  const isCriticalProcedure = ['Surgery', 'Root Canal'].includes(procedureType);

  // ... (search, planned treatments, smart slot logic is unchanged)
  const fuse = useMemo(() => new Fuse(patients, { keys: ['name', 'phone', 'id'], threshold: 0.3 }), [patients]);
  const searchResults = useMemo(() => searchTerm ? fuse.search(searchTerm).map(r => r.item).slice(0, 5) : [], [searchTerm, fuse]);
  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const plannedTreatments = useMemo(() => (selectedPatient?.dentalChart || []).filter(e => e.status === 'Planned'), [selectedPatient]);
  const handleApplyPlannedTreatment = (tx: any) => { setProcedureType(tx.procedure); setNotes(`From Plan: #${tx.toothNumber}`); };
  const availableSlots = useMemo(() => {
    if (!providerId || !date) return [];
    const slots = Array.from({ length: 16 }, (_, i) => [`${(i + 7).toString().padStart(2, '0')}:00`, `${(i + 7).toString().padStart(2, '0')}:30`]).flat();
    const dayApts = appointments.filter(a => a.providerId === providerId && a.date === date && a.status !== AppointmentStatus.CANCELLED && a.id !== existingAppointment?.id);
    return slots.map(slot => ({ time: slot, available: !dayApts.some(a => a.time === slot) }));
  }, [providerId, date, appointments, existingAppointment]);
  const getDisplayDate = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const isCritical = (p?: Patient) => p && (p.seriousIllness || p.underMedicalTreatment || (p.medicalConditions && p.medicalConditions.length > 0));

  const handleSave = () => {
      // ... (conflict checks, patient creation logic remains)
      if (!providerId) { toast.error("Please select a provider"); return; }
      if (isCriticalProcedure && !sterilizationCycleId) {
          toast.error(`A passed Sterilization Cycle ID is mandatory for ${procedureType}.`);
          return;
      }
      // ... (double booking check)

      let finalPatientId = selectedPatientId;
      let isBlock = false;
      let title = undefined;

      if (activeTab === 'new') { /* ... new patient logic ... */ } 
      if (activeTab === 'block') { isBlock = true; title = blockTitle || 'Blocked'; finalPatientId = 'BLOCK'; } 
      else if (!finalPatientId) { toast.error("Please select a patient"); return; }

      const appointmentData: Appointment = {
          id: existingAppointment?.id || `apt_${Date.now()}`,
          patientId: finalPatientId,
          providerId,
          branch: existingAppointment?.branch || '',
          date, time,
          durationMinutes: duration,
          type: isBlock ? AppointmentType.CONSULTATION : procedureType,
          status: existingAppointment?.status || AppointmentStatus.SCHEDULED,
          notes,
          labStatus: isBlock ? LabStatus.NONE : labStatus,
          sterilizationCycleId: isBlock ? undefined : sterilizationCycleId, // NEW
          isBlock, title,
          signedConsentUrl: existingAppointment?.signedConsentUrl,
          // ... (reschedule history logic)
      };

      onSave(appointmentData);
      toast.success(existingAppointment ? "Appointment updated" : "Appointment booked");
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-end md:items-center p-0 md:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-20 duration-300 md:duration-200 md:zoom-in-95 max-h-[95vh] overflow-y-auto">
        {/* Header and Patient Info bar are mostly unchanged */}
        {/* ... */}
        
        <div className="p-6 space-y-6 pb-safe">
            {/* ... other form fields ... */}
            <div className="grid grid-cols-2 gap-4">
                {/* ... other fields ... */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Procedure</label>
                    <select value={procedureType} onChange={e => setProcedureType(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl ...">{fieldSettings.procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select>
                </div>
            </div>

            {/* NEW: Sterilization Field (Conditional) */}
            {isCriticalProcedure && (
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                    <label className="flex items-center gap-2 text-sm font-bold text-blue-800 mb-2">
                        <Shield size={16}/> Sterilization Cycle ID (Required)
                    </label>
                    <select
                        value={sterilizationCycleId}
                        onChange={e => setSterilizationCycleId(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl font-mono"
                    >
                        <option value="">- Select a passed cycle -</option>
                        {sterilizationCycles.filter(c => c.passed).map(c => (
                             <option key={c.id} value={c.id}>
                                {c.id} ({c.autoclaveName} on {formatDate(c.date)})
                             </option>
                        ))}
                    </select>
                </div>
            )}
            
            {/* ... rest of the form ... */}
            <textarea placeholder="Internal Notes..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl ... h-20" />
        </div>
        
        <div className="p-4 border-t border-slate-100 flex gap-3 pb-8 md:pb-4 bg-white md:rounded-b-3xl sticky bottom-0 z-20">
            <button onClick={onClose} className="flex-1 py-3 px-4 bg-slate-100 ...">Cancel</button>
            <button onClick={handleSave} className="flex-[2] py-3 px-4 bg-teal-600 ..."><Save size={20} />{existingAppointment ? 'Update' : 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;

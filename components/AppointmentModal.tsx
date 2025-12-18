
import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, User, Save, Search, AlertCircle, Sparkles, Beaker, CreditCard, Activity, ArrowRight, ClipboardCheck, FileSignature, CheckCircle, Shield, Briefcase, Lock } from 'lucide-react';
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
  
  const [providerId, setProviderId] = useState('');
  const [date, setDate] = useState(initialDate || new Date().toLocaleDateString('en-CA'));
  const [time, setTime] = useState(initialTime || '09:00');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [labStatus, setLabStatus] = useState<LabStatus>(LabStatus.NONE);
  const [labVendorId, setLabVendorId] = useState('');
  const [sterilizationCycleId, setSterilizationCycleId] = useState('');
  const [sterilizationVerified, setSterilizationVerified] = useState(false); // NEW

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [procedureType, setProcedureType] = useState<string>(AppointmentType.CONSULTATION);
  const [newPatientData, setNewPatientData] = useState({ firstName: '', surname: '', phone: '', notes: '' });
  const [blockTitle, setBlockTitle] = useState('');

  const dentists = staff.filter(s => s.role === UserRole.DENTIST);
  const isCriticalProcedure = ['Surgery', 'Root Canal', 'Extraction'].includes(procedureType);

  useEffect(() => {
      if (isOpen) {
          if (existingAppointment) {
              setProviderId(existingAppointment.providerId);
              setDate(existingAppointment.date);
              setTime(existingAppointment.time);
              setDuration(existingAppointment.durationMinutes);
              setNotes(existingAppointment.notes || '');
              setLabStatus(existingAppointment.labStatus || LabStatus.NONE);
              setLabVendorId(existingAppointment.labDetails?.vendorId || '');
              setSterilizationCycleId(existingAppointment.sterilizationCycleId || '');
              setSterilizationVerified(existingAppointment.sterilizationVerified || false);
              
              if (existingAppointment.isBlock) { setActiveTab('block'); setBlockTitle(existingAppointment.title || ''); } 
              else { setActiveTab('existing'); setSelectedPatientId(existingAppointment.patientId); setProcedureType(existingAppointment.type); }
          } else {
              setDate(initialDate || new Date().toLocaleDateString('en-CA'));
              setTime(initialTime || '09:00');
              setProviderId(dentists[0]?.id || '');
              setLabStatus(LabStatus.NONE); setLabVendorId(''); setSterilizationCycleId(''); setSterilizationVerified(false);
              if (initialPatientId) { setActiveTab('existing'); setSelectedPatientId(initialPatientId); } 
              else { setSelectedPatientId(''); setActiveTab('existing'); }
              setSearchTerm('');
          }
      }
  }, [isOpen, existingAppointment, staff]);

  const handleSave = () => {
      if (!providerId) { toast.error("Select a provider"); return; }
      if (isCriticalProcedure && !sterilizationCycleId) { toast.error("Sterilization ID mandatory for surgery."); return; }
      if (isCriticalProcedure && !sterilizationVerified) { toast.error("You must verify the internal chemical indicator change."); return; }

      let finalPatientId = selectedPatientId;
      if (activeTab === 'block') finalPatientId = 'BLOCK';
      else if (!finalPatientId) { toast.error("Select a patient"); return; }

      const appointmentData: Appointment = {
          id: existingAppointment?.id || `apt_${Date.now()}`,
          patientId: finalPatientId, providerId, branch: existingAppointment?.branch || 'Main Branch',
          date, time, durationMinutes: duration, type: procedureType, status: existingAppointment?.status || AppointmentStatus.SCHEDULED,
          notes, labStatus, labDetails: labStatus !== LabStatus.NONE ? { vendorId: labVendorId } : undefined,
          sterilizationCycleId, sterilizationVerified, // NEW
          isBlock: activeTab === 'block', title: blockTitle
      };

      onSave(appointmentData);
      toast.success(existingAppointment ? "Updated" : "Booked");
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-end md:items-center p-0 md:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-20 duration-300 max-h-[95vh] overflow-y-auto">
        <div className="p-6 border-b bg-teal-900 text-white shrink-0"><h2 className="text-xl font-bold">{existingAppointment ? 'Edit Appointment' : 'New Booking'}</h2></div>
        
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-slate-700 mb-2">Provider</label><select value={providerId} onChange={e => setProviderId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl">{dentists.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-2">Procedure</label><select value={procedureType} onChange={e => setProcedureType(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl">{fieldSettings.procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-slate-700 mb-2">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" /></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-2">Time</label><input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" /></div>
            </div>

            {isCriticalProcedure && (
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-blue-800"><Shield size={18}/> Clinical Infection Control</div>
                    <select value={sterilizationCycleId} onChange={e => setSterilizationCycleId(e.target.value)} className="w-full p-2 border rounded-lg bg-white text-sm">
                        <option value="">- Select Passed Autoclave Cycle -</option>
                        {sterilizationCycles.filter(c => c.passed).map(c => <option key={c.id} value={c.id}>{c.cycleNumber} ({c.autoclaveName})</option>)}
                    </select>
                    <label className="flex items-start gap-3 p-3 bg-white border border-blue-100 rounded-xl cursor-pointer hover:border-blue-400 transition-colors">
                        <input type="checkbox" checked={sterilizationVerified} onChange={e => setSterilizationVerified(e.target.checked)} className="w-5 h-5 accent-blue-600 rounded mt-0.5" />
                        <div><p className="text-xs font-bold text-blue-900">Chemical Indicator Verified *</p><p className="text-[10px] text-blue-600 italic">I have visually confirmed the internal pouch indicator strip has turned color.</p></div>
                    </label>
                </div>
            )}
            
            <textarea placeholder="Internal Notes..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-20 outline-none" />
        </div>
        
        <div className="p-4 border-t flex gap-3 bg-white md:rounded-b-3xl sticky bottom-0">
            <button onClick={onClose} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
            <button onClick={handleSave} className="flex-[2] py-3 bg-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"><Save size={20} />{existingAppointment ? 'Update' : 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;

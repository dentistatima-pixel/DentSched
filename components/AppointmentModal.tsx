
import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, User, Save, Search, AlertCircle, Sparkles, Beaker, CreditCard, Activity, ArrowRight, ClipboardCheck, FileSignature, CheckCircle, Shield, Briefcase, Lock, Armchair, AlertTriangle, ShieldAlert, MessageSquare, Zap, ShieldOff } from 'lucide-react';
import { Patient, User as Staff, AppointmentType, UserRole, Appointment, AppointmentStatus, FieldSettings, LabStatus, TreatmentPlanStatus, SterilizationCycle, ClinicResource } from '../types';
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
  currentUser: Staff;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ 
  isOpen, onClose, patients, staff, appointments, onSave, onSavePatient, initialDate, initialTime, initialPatientId, existingAppointment, fieldSettings, sterilizationCycles = [], onManualOverride, isDowntime, currentUser
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'existing' | 'new' | 'block'>('existing');
  
  const [providerId, setProviderId] = useState('');
  const [resourceId, setResourceId] = useState(''); 
  const [branch, setBranch] = useState('');
  const [date, setDate] = useState(initialDate || new Date().toLocaleDateString('en-CA'));
  const [time, setTime] = useState(initialTime || '09:00');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [labStatus, setLabStatus] = useState<LabStatus>(LabStatus.NONE);
  const [labVendorId, setLabVendorId] = useState('');
  const [sterilizationCycleId, setSterilizationCycleId] = useState('');
  const [sterilizationVerified, setSterilizationVerified] = useState(false); 
  const [sendSmsReminder, setSendSmsReminder] = useState(true);

  // Emergency Bypass State
  const [bypassActive, setBypassActive] = useState(false);
  const [bypassReason, setBypassReason] = useState('');
  const [bypassSupervisorId, setBypassSupervisorId] = useState('');

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [procedureType, setProcedureType] = useState<string>(AppointmentType.CONSULTATION);
  const [blockTitle, setBlockTitle] = useState('');

  const dentists = staff.filter(s => s.role === UserRole.DENTIST);
  const isCriticalProcedure = ['Surgery', 'Root Canal', 'Extraction'].includes(procedureType);

  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);
  const isPatternRisk = selectedPatient?.reliabilityScore !== undefined && selectedPatient.reliabilityScore < 60;

  // Fatigue Indicator
  const loadMinutes = currentUser.fatigueMetric || 0;
  const isHardGateTriggered = loadMinutes >= 480 && isCriticalProcedure;

  useEffect(() => {
      if (isOpen) {
          if (existingAppointment) {
              setProviderId(existingAppointment.providerId);
              setResourceId(existingAppointment.resourceId || '');
              setBranch(existingAppointment.branch);
              setDate(existingAppointment.date);
              setTime(existingAppointment.time);
              setDuration(existingAppointment.durationMinutes);
              setNotes(existingAppointment.notes || '');
              setLabStatus(existingAppointment.labStatus || LabStatus.NONE);
              setLabVendorId(existingAppointment.labDetails?.vendorId || '');
              setSterilizationCycleId(existingAppointment.sterilizationCycleId || '');
              setSterilizationVerified(existingAppointment.sterilizationVerified || false);
              setSendSmsReminder(existingAppointment.sendSmsReminder ?? true);
              if (existingAppointment.isBlock) { setActiveTab('block'); setBlockTitle(existingAppointment.title || ''); } 
              else { setActiveTab('existing'); setSelectedPatientId(existingAppointment.patientId); setProcedureType(existingAppointment.type); }
          } else {
              setDate(initialDate || new Date().toLocaleDateString('en-CA'));
              setTime(initialTime || '09:00');
              setProviderId(dentists[0]?.id || '');
              const defaultBranch = fieldSettings.branches[0];
              setBranch(defaultBranch);
              const firstRes = (fieldSettings.resources || []).find(r => r.branch === defaultBranch);
              setResourceId(firstRes?.id || '');
              if (initialPatientId) { setActiveTab('existing'); setSelectedPatientId(initialPatientId); } 
              else setSelectedPatientId('');
          }
          setBypassActive(false); setBypassReason(''); setBypassSupervisorId('');
      }
  }, [isOpen, existingAppointment, dentists, fieldSettings, initialDate, initialTime, initialPatientId]);

  const handleSave = () => {
      if (isHardGateTriggered && !bypassActive) {
          toast.error("Fatigue Gate: Practitioner exceeds clinical load limit for invasive procedures.");
          return;
      }
      if (isCriticalProcedure && !sterilizationCycleId && !bypassActive) {
          toast.error("Sterilization Protocol Violation: Autoclave Cycle Mandatory.");
          return;
      }
      if (bypassActive && (!bypassReason || !bypassSupervisorId)) {
          toast.error("Bypass Protocol: Reason and Supervisor PIN required.");
          return;
      }

      const appointmentData: Appointment = {
          id: existingAppointment?.id || `apt_${Date.now()}`,
          patientId: activeTab === 'block' ? 'BLOCK' : selectedPatientId, 
          providerId, resourceId, branch: branch || 'Main Clinic',
          date, time, durationMinutes: duration, type: procedureType, status: existingAppointment?.status || AppointmentStatus.SCHEDULED,
          notes, labStatus, sterilizationCycleId, sterilizationVerified,
          isBlock: activeTab === 'block', title: blockTitle,
          sendSmsReminder,
          emergencyBypass: bypassActive ? { reason: bypassReason, supervisorId: bypassSupervisorId, timestamp: new Date().toISOString() } : undefined
      };
      onSave(appointmentData);
      onClose();
  };

  const filteredPatients = useMemo(() => {
      if (!searchTerm) return patients.slice(0, 5);
      const fuse = new Fuse(patients, { keys: ['name', 'phone'], threshold: 0.3 });
      return fuse.search(searchTerm).map(r => r.item).slice(0, 5);
  }, [searchTerm, patients]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-end md:items-center p-0 md:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-20 duration-300 max-h-[95vh] overflow-y-auto">
        <div className={`p-6 border-b shrink-0 flex justify-between items-center text-white ${isHardGateTriggered ? 'bg-red-600' : 'bg-teal-900'}`}>
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{existingAppointment ? 'Edit Appointment' : 'New Booking'}</h2>
            </div>
            <button onClick={onClose}><X size={24}/></button>
        </div>
        
        <div className="p-6 space-y-6">
            {isHardGateTriggered && !bypassActive && (
                <div className="bg-red-50 p-6 rounded-[2rem] border-2 border-red-200 animate-in shake duration-500">
                    <div className="flex items-center gap-3 text-red-700 mb-4"><ShieldOff size={28}/><h4 className="font-black uppercase tracking-widest text-sm">Clinical Load Hard-Gate</h4></div>
                    <p className="text-xs text-red-800 font-medium leading-relaxed mb-6">Dr. {currentUser.name} has exceeded 480 mins of clinical load. Safety protocols prohibit new invasive procedures today.</p>
                    <button onClick={() => setBypassActive(true)} className="w-full py-4 bg-white border-2 border-red-200 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all">Emergency Bypass Protocol</button>
                </div>
            )}

            {bypassActive && (
                <div className="bg-lilac-50 p-6 rounded-[2rem] border-2 border-lilac-200 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-3 text-lilac-700 mb-4"><Zap size={24}/><h4 className="font-black uppercase tracking-widest text-sm">Emergency Protocol Override</h4></div>
                    <textarea value={bypassReason} onChange={e => setBypassReason(e.target.value)} placeholder="Provide specific clinical justification for bypass..." className="w-full p-4 bg-white border rounded-2xl text-xs mb-4 h-24" />
                    <input type="password" placeholder="Supervisor Authorization PIN" value={bypassSupervisorId} onChange={e => setBypassSupervisorId(e.target.value)} className="w-full p-4 bg-white border rounded-2xl text-center text-xl font-black tracking-widest" />
                </div>
            )}

            {!isHardGateTriggered && !bypassActive && (
                <>
                {!existingAppointment && (
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setActiveTab('existing')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'existing' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}>Existing Patient</button>
                        <button onClick={() => setActiveTab('block')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'block' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}>Admin Block</button>
                    </div>
                )}
                
                <div className="grid grid-cols-1 gap-4">
                    {activeTab === 'existing' && !existingAppointment && (
                        <div className="relative">
                            <label className="label">Search Patient</label>
                            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Name or mobile..." className="input pl-10" /></div>
                            {searchTerm && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl z-10 overflow-hidden">
                                    {filteredPatients.map(p => (<button key={p.id} onClick={() => { setSelectedPatientId(p.id); setSearchTerm(''); }} className="w-full text-left p-3 hover:bg-teal-50 border-b last:border-0 flex justify-between items-center"><span className="font-bold text-sm">{p.name}</span></button>))}
                                </div>
                            )}
                            {selectedPatientId && <div className="mt-2 p-3 bg-teal-50 border border-teal-100 rounded-xl flex justify-between items-center"><span className="font-bold text-teal-900">{patients.find(p => p.id === selectedPatientId)?.name}</span></div>}
                        </div>
                    )}
                    <div><label className="label">Procedure</label><select value={procedureType} onChange={e => setProcedureType(e.target.value)} className="input">{fieldSettings.procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div><label className="label">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" /></div>
                    <div><label className="label">Time</label><input type="time" value={time} onChange={e => setTime(e.target.value)} className="input" /></div>
                </div>

                {isCriticalProcedure && !bypassActive && (
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                        <div className="flex items-center gap-2 text-sm font-bold text-blue-800 mb-3"><Shield size={18}/> Clinical Infection Control</div>
                        <select value={sterilizationCycleId} onChange={e => setSterilizationCycleId(e.target.value)} className="w-full p-2 border rounded-lg bg-white text-sm">
                            <option value="">- Select Sterilization Batch -</option>
                            {sterilizationCycles.filter(c => c.passed).map(c => <option key={c.id} value={c.id}>{c.cycleNumber} ({c.autoclaveName})</option>)}
                        </select>
                        <p className="text-[9px] text-blue-600 mt-2 italic font-bold">Invasive procedures require a verified autoclave cycle.</p>
                    </div>
                )}
                </>
            )}
        </div>
        
        <div className="p-4 border-t flex gap-3 bg-white md:rounded-b-3xl sticky bottom-0">
            <button onClick={onClose} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
            <button onClick={handleSave} className="flex-[2] py-3 text-white rounded-xl font-bold bg-teal-600 hover:bg-teal-700 transition-all flex items-center justify-center gap-2">
                <Save size={20} />{existingAppointment ? 'Update' : 'Confirm Registry'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;


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

const AppointmentModal: React.FC<AppointmentModalProps> = ({ 
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
  const [labStatus, setLabStatus] = useState<LabStatus>(LabStatus.NONE);
  const [labVendorId, setLabVendorId] = useState('');
  
  // MATERIAL TRACEABILITY STATE (Rule 11)
  const [materialLotNumber, setMaterialLotNumber] = useState('');
  const [materialCertIssuer, setMaterialCertIssuer] = useState('');
  const [materialVerifiedBy, setMaterialVerifiedBy] = useState('');

  const [sterilizationCycleId, setSterilizationCycleId] = useState('');
  const [sterilizationVerified, setSterilizationVerified] = useState(false); 

  // Override States
  const [showOverridePrompt, setShowOverridePrompt] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [pendingOverrideType, setPendingOverrideType] = useState<string | null>(null);

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [procedureType, setProcedureType] = useState<string>(AppointmentType.CONSULTATION);
  const [blockTitle, setBlockTitle] = useState('');

  const dentists = staff.filter(s => s.role === UserRole.DENTIST);
  const isCriticalProcedure = ['Surgery', 'Root Canal', 'Extraction'].includes(procedureType);

  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);
  const isReliabilityRisk = selectedPatient?.reliabilityScore !== undefined && selectedPatient.reliabilityScore < 60;

  const availableResources = useMemo(() => {
      return (fieldSettings.resources || []).filter(r => !existingAppointment || r.branch === existingAppointment.branch);
  }, [fieldSettings.resources, existingAppointment]);

  const labVendors = useMemo(() => {
      return (fieldSettings.vendors || []).filter(v => v.type === 'Lab');
  }, [fieldSettings.vendors]);

  const selectedLab = useMemo(() => {
      return labVendors.find(v => v.id === labVendorId);
  }, [labVendorId, labVendors]);

  const isDsaValid = useMemo(() => {
      if (!selectedLab || !selectedLab.dsaSignedDate || !selectedLab.dsaExpiryDate) return false;
      const expiry = new Date(selectedLab.dsaExpiryDate);
      return expiry > new Date() && selectedLab.status === 'Active';
  }, [selectedLab]);

  useEffect(() => {
      if (isOpen) {
          if (existingAppointment) {
              setProviderId(existingAppointment.providerId);
              setResourceId(existingAppointment.resourceId || '');
              setDate(existingAppointment.date);
              setTime(existingAppointment.time);
              setDuration(existingAppointment.durationMinutes);
              setNotes(existingAppointment.notes || '');
              setLabStatus(existingAppointment.labStatus || LabStatus.NONE);
              setLabVendorId(existingAppointment.labDetails?.vendorId || '');
              setMaterialLotNumber(existingAppointment.labDetails?.materialLotNumber || '');
              setMaterialCertIssuer(existingAppointment.labDetails?.materialCertIssuer || '');
              setMaterialVerifiedBy(existingAppointment.labDetails?.materialVerifiedBy || '');
              setSterilizationCycleId(existingAppointment.sterilizationCycleId || '');
              setSterilizationVerified(existingAppointment.sterilizationVerified || false);
              
              if (existingAppointment.isBlock) { setActiveTab('block'); setBlockTitle(existingAppointment.title || ''); } 
              else { setActiveTab('existing'); setSelectedPatientId(existingAppointment.patientId); setProcedureType(existingAppointment.type); }
          } else {
              setDate(initialDate || new Date().toLocaleDateString('en-CA'));
              setTime(initialTime || '09:00');
              setProviderId(dentists[0]?.id || '');
              setResourceId(availableResources[0]?.id || '');
              setLabStatus(LabStatus.NONE); setLabVendorId(''); 
              setMaterialLotNumber(''); setMaterialCertIssuer(''); setMaterialVerifiedBy('');
              setSterilizationCycleId(''); setSterilizationVerified(false);
              if (initialPatientId) { setActiveTab('existing'); setSelectedPatientId(initialPatientId); } 
              else { setSelectedPatientId(''); setActiveTab('existing'); }
              setSearchTerm('');
          }
          setShowOverridePrompt(false);
          setOverrideReason('');
      }
  }, [isOpen, existingAppointment, staff, availableResources]);

  const checkConflict = () => {
    return appointments.some(apt => 
        apt.id !== existingAppointment?.id && 
        apt.date === date && 
        apt.time === time && 
        apt.resourceId === resourceId &&
        apt.status !== AppointmentStatus.CANCELLED
    );
  };

  const handleSave = () => {
      if (!providerId) { toast.error("Select a provider"); return; }
      if (!resourceId) { toast.error("Select a chair/resource"); return; }
      
      const hasConflict = checkConflict();
      if (hasConflict) {
          if (isDowntime) {
            setPendingOverrideType('RESOURCE_CONFLICT');
            setShowOverridePrompt(true);
            return;
          }
          toast.error("Chair Conflict: This resource is already booked for this slot.");
          return;
      }

      // --- NPC CIRCULAR 16-01 COMPLIANCE GATE ---
      if (labStatus !== LabStatus.NONE && labVendorId && !isDsaValid) {
          toast.error("NPC COMPLIANCE BLOCK: The selected Lab Vendor does not have a valid Data Sharing Agreement (DSA) on file. Sub-processing of patient Sensitive Personal Information is prohibited.");
          return;
      }

      // --- MATERIAL TRACEABILITY GATE (Rule 11) ---
      if (labStatus === LabStatus.RECEIVED) {
          if (!materialLotNumber || !materialCertIssuer || !materialVerifiedBy) {
              toast.error("MATERIAL TRACEABILITY BLOCK: Mandatory lot number, certificate issuer, and verifying staff are required for received prosthetics (Liability Defense).");
              return;
          }
      }

      if (isCriticalProcedure && !sterilizationCycleId) { 
          if (isDowntime) {
              setPendingOverrideType('STERILIZATION_BYPASS');
              setShowOverridePrompt(true);
              return;
          }
          toast.error("Sterilization ID mandatory for surgery."); 
          return; 
      }
      
      if (isCriticalProcedure && !sterilizationVerified) { toast.error("Verification mandatory."); return; }

      let finalPatientId = selectedPatientId;
      if (activeTab === 'block') finalPatientId = 'BLOCK';
      else if (!finalPatientId) { toast.error("Select a patient"); return; }

      execSave();
  };

  const execSave = () => {
    const isWaitlistOverride = !!initialPatientId && !existingAppointment && (isReliabilityRisk || (selectedPatient?.currentBalance ?? 0) > 0);

    // NPC CIRCULAR 16-01: Data Transfer ID generation
    let dataTransferId = existingAppointment?.dataTransferId;
    if (labStatus === LabStatus.PENDING && (!existingAppointment || existingAppointment.labStatus !== LabStatus.PENDING)) {
        dataTransferId = `XFER-NPC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        toast.info(`DPA Audit: Unique Data Transfer ID ${dataTransferId} generated for sub-processor.`);
    }

    const appointmentData: Appointment = {
        id: existingAppointment?.id || `apt_${Date.now()}`,
        patientId: activeTab === 'block' ? 'BLOCK' : selectedPatientId, 
        providerId, resourceId, branch: existingAppointment?.branch || 'Makati Branch',
        date, time, durationMinutes: duration, type: procedureType, status: existingAppointment?.status || AppointmentStatus.SCHEDULED,
        notes, labStatus, 
        labDetails: labStatus !== LabStatus.NONE ? { 
            vendorId: labVendorId, 
            materialLotNumber, 
            materialCertIssuer, 
            materialVerifiedBy 
        } : undefined,
        sterilizationCycleId, sterilizationVerified,
        isBlock: activeTab === 'block', title: blockTitle,
        isWaitlistOverride: existingAppointment?.isWaitlistOverride || isWaitlistOverride,
        authorizedManagerId: existingAppointment?.authorizedManagerId,
        medHistoryVerified: existingAppointment?.medHistoryVerified,
        medHistoryVerifiedAt: existingAppointment?.medHistoryVerifiedAt,
        dataTransferId
    };

    if (showOverridePrompt && onManualOverride && pendingOverrideType) {
        onManualOverride(pendingOverrideType, overrideReason);
    }

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
      <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-20 duration-300 max-h-[95vh] overflow-y-auto no-scrollbar">
        <div className={`p-6 border-b shrink-0 flex justify-between items-center text-white ${isDowntime ? 'bg-[repeating-linear-gradient(45deg,#b91c1c,#b91c1c_10px,#000_10px,#000_20px)]' : 'bg-teal-900'}`}>
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{isDowntime && 'DOWNTIME: '}{existingAppointment ? 'Edit Appointment' : 'New Booking'}</h2>
                {isDowntime && <div className="bg-white text-red-700 px-2 py-0.5 rounded text-[10px] font-black animate-pulse">OVERRIDE ENABLED</div>}
            </div>
            <button onClick={onClose}><X size={24}/></button>
        </div>
        
        <div className="p-6 space-y-6">
            {showOverridePrompt ? (
                <div className="bg-red-50 p-6 rounded-[2rem] border-2 border-red-200 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-3 text-red-700 mb-4">
                        <ShieldAlert size={28}/>
                        <h4 className="font-black uppercase tracking-widest text-sm">Emergency Manual Override</h4>
                    </div>
                    <p className="text-xs text-red-800 font-medium mb-4 leading-relaxed">
                        A clinical gate has been triggered (<strong>{pendingOverrideType}</strong>). In Downtime mode, you may bypass this validation. Providing a justification is mandatory for compliance.
                    </p>
                    <textarea 
                        autoFocus
                        required
                        value={overrideReason}
                        onChange={e => setOverrideReason(e.target.value)}
                        placeholder="Justify this emergency bypass..."
                        className="w-full p-4 bg-white border-2 border-red-100 rounded-2xl text-sm focus:ring-4 focus:ring-red-500/10 outline-none h-32"
                    />
                    <div className="flex gap-2 mt-6">
                        <button onClick={() => setShowOverridePrompt(false)} className="flex-1 py-3 font-bold text-slate-500">Back</button>
                        <button 
                            onClick={execSave}
                            disabled={!overrideReason.trim()}
                            className="flex-[2] py-3 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all disabled:opacity-50"
                        >
                            Authorize Bypass
                        </button>
                    </div>
                </div>
            ) : (
                <>
                {!existingAppointment && (
                    <div className="space-y-4">
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button onClick={() => setActiveTab('existing')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'existing' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}>Existing Patient</button>
                            <button onClick={() => setActiveTab('block')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'block' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}>Admin Block</button>
                        </div>

                        {activeTab === 'existing' && (
                            <div className="relative">
                                <label className="label">Search Patient</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Name or mobile..." className="input pl-10" />
                                </div>
                                {searchTerm && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl z-10 overflow-hidden">
                                        {filteredPatients.map(p => (
                                            <button key={p.id} onClick={() => { setSelectedPatientId(p.id); setSearchTerm(''); }} className="w-full text-left p-3 hover:bg-teal-50 border-b last:border-0 flex justify-between items-center"><span className="font-bold text-sm">{p.name}</span><span className="text-[10px] text-slate-400">{p.phone}</span></button>
                                        ))}
                                    </div>
                                )}
                                {selectedPatientId && (
                                    <div className="mt-3 p-3 bg-teal-50 border border-teal-100 rounded-xl flex justify-between items-center">
                                        <span className="font-bold text-teal-900">{patients.find(p => p.id === selectedPatientId)?.name}</span>
                                        <button onClick={() => setSelectedPatientId('')} className="text-xs font-bold text-teal-600">Change</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'block' && (
                            <div><label className="label">Block Title / Reason</label><input type="text" value={blockTitle} onChange={e => setBlockTitle(e.target.value)} placeholder="e.g. Lunch Break, Staff Meeting" className="input" /></div>
                        )}
                    </div>
                )}

                {(isReliabilityRisk || (selectedPatient?.currentBalance ?? 0) > 0) && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3 animate-in shake duration-500">
                        <AlertTriangle className="text-red-600 shrink-0" size={20} />
                        <div>
                            <p className="text-xs font-black text-red-900 uppercase tracking-widest">Front-Desk Alert</p>
                            <p className="text-[11px] text-red-700 leading-tight mt-1">
                                {isReliabilityRisk && `High No-Show Risk (${selectedPatient.reliabilityScore}%). `}
                                {(selectedPatient?.currentBalance ?? 0) > 0 && `Outstanding Balance: ₱${selectedPatient?.currentBalance?.toLocaleString()}. `}
                                Recommend confirming twice or requesting a reservation deposit.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div><label className="label">Clinical Provider</label><select value={providerId} onChange={e => setProviderId(e.target.value)} className="input">{dentists.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                    <div><label className="label">Clinical Resource / Chair</label><select value={resourceId} onChange={e => setResourceId(e.target.value)} className="input">{availableResources.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}</select></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div><label className="label">Procedure</label><select value={procedureType} onChange={e => setProcedureType((e.target as HTMLSelectElement).value)} className="input">{fieldSettings.procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
                    <div><label className="label">Duration (Min)</label><select value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="input"><option value={15}>15m</option><option value={30}>30m</option><option value={45}>45m</option><option value={60}>1h</option><option value={90}>1.5h</option><option value={120}>2h</option></select></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div><label className="label">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" /></div>
                    <div><label className="label">Time</label><input type="time" value={time} onChange={e => setTime(e.target.value)} className="input" /></div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="label mb-0 flex items-center gap-2"><Beaker size={14}/> Lab Sub-processing</label>
                        <select value={labStatus} onChange={e => setLabStatus(e.target.value as LabStatus)} className="p-1 text-xs border rounded bg-white">
                            <option value={LabStatus.NONE}>No Lab Required</option>
                            <option value={LabStatus.PENDING}>Order Pending</option>
                            <option value={LabStatus.RECEIVED}>Received</option>
                        </select>
                    </div>
                    {labStatus !== LabStatus.NONE && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                            <div className="relative">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Preferred Lab Vendor</label>
                                <select 
                                    value={labVendorId} 
                                    onChange={e => setLabVendorId(e.target.value)}
                                    className={`w-full p-2.5 rounded-xl border-2 bg-white text-xs font-bold outline-none transition-all ${labVendorId && !isDsaValid ? 'border-red-400 ring-4 ring-red-500/5' : 'border-slate-100 focus:border-teal-500'}`}
                                >
                                    <option value="">- Select Verified Lab -</option>
                                    {labVendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                                {labVendorId && (
                                    <div className={`mt-2 flex flex-col gap-2`}>
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${isDsaValid ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-red-50 border-red-200 text-red-700 animate-bounce'}`}>
                                            {isDsaValid ? <BadgeCheck size={14}/> : <ShieldX size={14}/>}
                                            {isDsaValid ? 'NPC Compliance: DSA Active' : 'CRITICAL: No DSA on File'}
                                        </div>
                                        {existingAppointment?.dataTransferId && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[8px] font-black text-blue-700 uppercase tracking-tighter">
                                                <Database size={12}/> DPA Audit ID: {existingAppointment.dataTransferId}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* MATERIAL INTAKE FORM (Logic Point 3) */}
                            {labStatus === LabStatus.RECEIVED && (
                                <div className="bg-white p-4 rounded-2xl border-2 border-teal-500 shadow-lg space-y-4 animate-in zoom-in-95">
                                    <div className="flex items-center gap-2 text-teal-700 mb-2">
                                        <PackageCheck size={18}/>
                                        <h4 className="text-[11px] font-black uppercase tracking-widest leading-none">Material Forensic Intake</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Lot / Serial # *</label>
                                            <input 
                                                type="text" 
                                                value={materialLotNumber} 
                                                onChange={e => setMaterialLotNumber(e.target.value)} 
                                                placeholder="e.g. SN-88912"
                                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-teal-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Cert Issuer *</label>
                                            <input 
                                                type="text" 
                                                value={materialCertIssuer} 
                                                onChange={e => setMaterialCertIssuer(e.target.value)} 
                                                placeholder="e.g. Ivoclar"
                                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-teal-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Verifying Staff *</label>
                                        <select 
                                            value={materialVerifiedBy} 
                                            onChange={e => setMaterialVerifiedBy(e.target.value)}
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-teal-500 outline-none"
                                        >
                                            <option value="">- Select Verifier -</option>
                                            {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                                        </select>
                                    </div>
                                    <div className="p-2 bg-teal-50 rounded-xl border border-teal-100 flex items-center gap-2">
                                        <UserCheck size={14} className="text-teal-600"/>
                                        <span className="text-[8px] font-black text-teal-800 uppercase leading-tight">Identity of staff who physically verified the material certification will be permanently logged.</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {isCriticalProcedure && (
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-blue-800"><Shield size={18}/> Clinical Infection Control</div>
                        <select value={sterilizationCycleId} onChange={e => setSterilizationCycleId(e.target.value)} className="w-full p-2 border rounded-lg bg-white text-sm">
                            <option value="">- Select Passed Autoclave Cycle -</option>
                            {sterilizationCycles.filter(c => c.passed).map(c => <option key={c.id} value={c.id}>{c.cycleNumber} ({c.autoclaveName})</option>)}
                        </select>
                    </div>
                )}
                
                <textarea placeholder="Internal Notes..." value={notes} onChange={e => setNotes(e.target.value)} className="input h-20 resize-none" />
                </>
            )}
        </div>
        
        {!showOverridePrompt && (
            <div className="p-4 border-t flex gap-3 bg-white md:rounded-b-3xl sticky bottom-0">
                <button onClick={onClose} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
                <button onClick={handleSave} className={`flex-[2] py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 ${isDowntime ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'}`}><Save size={20} />{existingAppointment ? 'Update' : 'Confirm'}</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentModal;

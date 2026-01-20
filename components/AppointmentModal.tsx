import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Calendar, Clock, User, Save, Search, AlertCircle, Sparkles, Beaker, CreditCard, Activity, ArrowRight, ClipboardCheck, FileSignature, CheckCircle, Shield, Briefcase, Lock, Armchair, AlertTriangle, ShieldAlert, BadgeCheck, ShieldX, Database, PackageCheck, UserCheck, Baby, Hash, Phone, FileText, Zap, UserPlus, Key, DollarSign as FinanceIcon, RotateCcw } from 'lucide-react';
import { Patient, User as Staff, UserRole, Appointment, AppointmentStatus, FieldSettings, LabStatus, TreatmentPlanStatus, SterilizationCycle, ClinicResource, Vendor, DaySchedule, WaitlistEntry, LedgerEntry, ResourceType, ClinicalProtocolRule, ProcedureItem } from '../types';
import Fuse from 'fuse.js';
import { formatDate, CRITICAL_CLEARANCE_CONDITIONS, generateUid } from '../constants';
import { useToast } from './ToastSystem';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  staff: Staff[];
  appointments: Appointment[]; 
  onSave: (appointment: Appointment) => Promise<void>;
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
  overrideInfo?: { isWaitlistOverride: boolean; authorizedManagerId: string; } | null;
  isReconciliationMode?: boolean;
  currentBranch: string;
  onProcedureSafetyCheck?: (patientId: string, procedureName: string, continuation: () => void) => void;
  onRequestConsent: (patient: Patient, appointment: Appointment, continuation: () => void) => void;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
    isOpen, onClose, patients, staff, appointments, onSave, onSavePatient, onAddToWaitlist,
    initialDate, initialTime, initialPatientId, existingAppointment, fieldSettings,
    isDowntime, overrideInfo, isReconciliationMode, currentBranch, onProcedureSafetyCheck,
    onRequestConsent
}) => {
    const toast = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [patientId, setPatientId] = useState('');
    const [providerId, setProviderId] = useState('');
    const [resourceId, setResourceId] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState('30');
    const [procedureType, setProcedureType] = useState('');
    const [notes, setNotes] = useState('');
    const [isBlock, setIsBlock] = useState(false);
    const [blockTitle, setBlockTitle] = useState('');

    const [patientSearch, setPatientSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    
    const patientFuse = useMemo(() => new Fuse(patients, { keys: ['name', 'id', 'phone'], threshold: 0.3 }), [patients]);

    useEffect(() => {
        if (isOpen) {
            if (existingAppointment) {
                setPatientId(existingAppointment.patientId);
                const p = patients.find(p => p.id === existingAppointment.patientId);
                setPatientSearch(p?.name || '');
                setProviderId(existingAppointment.providerId);
                setResourceId(existingAppointment.resourceId || '');
                setDate(existingAppointment.date);
                setTime(existingAppointment.time);
                setDuration(existingAppointment.durationMinutes.toString());
                setProcedureType(existingAppointment.type);
                setNotes(existingAppointment.notes || '');
                setIsBlock(existingAppointment.isBlock || false);
                setBlockTitle(existingAppointment.title || '');
            } else {
                setPatientId(initialPatientId || '');
                const p = patients.find(p => p.id === initialPatientId);
                setPatientSearch(p?.name || '');
                setDate(initialDate || new Date().toLocaleDateString('en-CA'));
                setTime(initialTime || '');
                setProviderId(''); setResourceId(''); setDuration('30');
                setProcedureType(fieldSettings?.procedures[0]?.name || '');
                setNotes(''); setIsBlock(false); setBlockTitle('');
            }
        }
    }, [isOpen, existingAppointment, initialDate, initialTime, initialPatientId, patients, fieldSettings]);

    useEffect(() => {
        if (isOpen && patientId && procedureType && onProcedureSafetyCheck && !existingAppointment) { // Don't re-check on edit
            // The main safety check is now in handleSubmit, but we can keep this for future real-time checks
        }
    }, [isOpen, patientId, procedureType, existingAppointment]);


    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPatientSearch(e.target.value);
        if (e.target.value) {
            setSearchResults(patientFuse.search(e.target.value).map(res => res.item).slice(0, 5));
        } else {
            setSearchResults([]);
        }
    };

    const selectPatient = (p: Patient) => {
        setPatientId(p.id);
        setPatientSearch(p.name);
        setSearchResults([]);
    };

    const handleWaitlist = () => {
        if (!patientId || !procedureType || !duration) {
            toast.error("Patient, procedure, and duration are required to add to waitlist.");
            return;
        }
        onAddToWaitlist({
            patientId,
            procedure: procedureType,
            durationMinutes: parseInt(duration),
            priority: 'Normal',
            notes: `Requested for ${date} around ${time}`,
        });
        onClose();
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const finalSave = async () => {
            setIsSaving(true);
            try {
                const finalPatientId = isBlock ? 'ADMIN_BLOCK' : patientId;
                const patient = patients.find(p => p.id === patientId);

                if (!finalPatientId || !providerId || !date || !time || (isBlock ? !blockTitle : !procedureType) || (isBlock ? false : !patient)) {
                    toast.error("All fields are required.");
                    setIsSaving(false);
                    return;
                }

                const proposedStart = new Date(`${date}T${time}`);
                const proposedEnd = new Date(proposedStart.getTime() + parseInt(duration) * 60000);

                const conflictingAppointment = appointments.find(apt => {
                    if (existingAppointment && apt.id === existingAppointment.id) return false;
                    const existingStart = new Date(`${apt.date}T${apt.time}`);
                    const existingEnd = new Date(existingStart.getTime() + apt.durationMinutes * 60000);
                    const overlap = (proposedStart < existingEnd) && (proposedEnd > existingStart);
                    if (!overlap) return false;
                    if (resourceId && apt.resourceId === resourceId) return true;
                    if (!isBlock && apt.providerId === providerId) return true;
                    return false;
                });

                if (conflictingAppointment) {
                    toast.error("Scheduling Conflict: Time slot overlaps with another appointment.");
                    setIsSaving(false);
                    return;
                }

                const appointment: Appointment = {
                    id: existingAppointment?.id || `apt_${Date.now()}`,
                    patientId: finalPatientId,
                    providerId,
                    resourceId,
                    branch: currentBranch,
                    date, time,
                    durationMinutes: parseInt(duration),
                    type: isBlock ? 'Clinical Block' : procedureType,
                    status: existingAppointment?.status || AppointmentStatus.SCHEDULED,
                    notes,
                    isBlock,
                    title: isBlock ? blockTitle : undefined,
                    isWaitlistOverride: overrideInfo?.isWaitlistOverride,
                    authorizedManagerId: overrideInfo?.authorizedManagerId,
                    entryMode: isDowntime ? 'MANUAL' : 'AUTO',
                };
                
                await onSave(appointment);
                onClose();
            } catch (error: any) {
                toast.error(error.message || "Could not save appointment.");
            } finally {
                setIsSaving(false);
            }
        };

        const patient = patients.find(p => p.id === patientId);
        const procedure = fieldSettings.procedures.find(p => p.name === procedureType);
        if (procedure?.requiresConsent && !existingAppointment && patient) {
            onRequestConsent(patient, { id: 'temp' } as Appointment, finalSave);
        } else {
            finalSave();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-teal-100 p-3 rounded-xl text-teal-700"><Calendar size={24} /></div>
                        <h2 className="text-xl font-bold text-slate-800">{existingAppointment ? 'Edit Appointment' : 'New Appointment'}</h2>
                    </div>
                    <button onClick={onClose}><X size={24} className="text-slate-500" /></button>
                </div>

                <form id="appointment-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                    <div className="relative">
                        <label className="label">Patient</label>
                        <input type="text" value={patientSearch} onChange={handleSearch} className="input" placeholder="Search by name, ID, or phone" />
                        {searchResults.length > 0 && (
                            <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                                {searchResults.map(p => (
                                    <div key={p.id} onClick={() => selectPatient(p)} className="p-2 hover:bg-teal-50 cursor-pointer">{p.name}</div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="label">Provider</label>
                            <select value={providerId} onChange={e => setProviderId(e.target.value)} className="input">
                                <option value="">Select Provider</option>
                                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Resource / Chair</label>
                            <select value={resourceId} onChange={e => setResourceId(e.target.value)} className="input">
                                <option value="">Select Resource</option>
                                {fieldSettings.resources.filter(r => r.branch === currentBranch).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div><label className="label">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" /></div>
                        <div><label className="label">Time</label><input type="time" step="900" value={time} onChange={e => setTime(e.target.value)} className="input" /></div>
                        <div><label className="label">Duration (min)</label><input type="number" step="15" value={duration} onChange={e => setDuration(e.target.value)} className="input" /></div>
                    </div>
                    
                    {!isBlock ? (
                        <div>
                            <label className="label">Procedure Type</label>
                            <select value={procedureType} onChange={e => setProcedureType(e.target.value)} className="input">
                                <option value="">Select Procedure...</option>
                                {fieldSettings.procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>
                        </div>
                    ) : (
                         <div>
                            <label className="label">Block Title</label>
                            <input type="text" value={blockTitle} onChange={e => setBlockTitle(e.target.value)} className="input"/>
                         </div>
                    )}

                    <div>
                        <label className="label">Notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input h-24" placeholder="Clinical notes for the appointment..."></textarea>
                    </div>
                </form>

                <div className="p-6 border-t border-slate-100 flex justify-between items-center shrink-0">
                    <button type="button" onClick={handleWaitlist} className="px-6 py-3 bg-amber-100 text-amber-800 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-200 transition-all">
                        Add to Waitlist
                    </button>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="px-8 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest">Cancel</button>
                        <button type="submit" form="appointment-form" disabled={isSaving} className="px-10 py-4 bg-teal-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-teal-600/30 disabled:opacity-50 flex items-center gap-2">
                            {isSaving ? <RotateCcw size={16} className="animate-spin" /> : <Save size={16} />}
                            {isSaving ? 'Saving...' : (existingAppointment ? 'Update' : 'Save')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppointmentModal;

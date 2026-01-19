

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Calendar, Clock, User, Save, Search, AlertCircle, Sparkles, Beaker, CreditCard, Activity, ArrowRight, ClipboardCheck, FileSignature, CheckCircle, Shield, Briefcase, Lock, Armchair, AlertTriangle, ShieldAlert, BadgeCheck, ShieldX, Database, PackageCheck, UserCheck, Baby, Hash, Phone, FileText, Zap, UserPlus, Key, DollarSign as FinanceIcon } from 'lucide-react';
import { Patient, User as Staff, UserRole, Appointment, AppointmentStatus, FieldSettings, LabStatus, TreatmentPlanStatus, SterilizationCycle, ClinicResource, Vendor, DaySchedule, WaitlistEntry, LedgerEntry, ResourceType } from '../types';
import Fuse from 'fuse.js';
import { formatDate, CRITICAL_CLEARANCE_CONDITIONS, generateUid } from '../constants';
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
  overrideInfo?: { isWaitlistOverride: boolean; authorizedManagerId: string; } | null;
  isReconciliationMode?: boolean;
  currentBranch: string;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
    isOpen, onClose, patients, staff, appointments, onSave, onSavePatient,
    initialDate, initialTime, initialPatientId, existingAppointment, fieldSettings,
    isDowntime, overrideInfo, isReconciliationMode, currentBranch
}) => {
    const toast = useToast();
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalPatientId = isBlock ? 'ADMIN_BLOCK' : patientId;
        if (!finalPatientId || !providerId || !date || !time) {
            toast.error("Patient, Provider, Date, and Time are required.");
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

        onSave(appointment);
        onClose();
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

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
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
                                {fieldSettings.procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>
                        </div>
                    ) : (
                        <div>
                             <label className="label">Block Title</label>
                             <input type="text" value={blockTitle} onChange={e => setBlockTitle(e.target.value)} className="input" placeholder="e.g., Staff Meeting"/>
                        </div>
                    )}

                    <div>
                        <label className="label">Notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input h-24" placeholder="Optional notes for this appointment..."/>
                    </div>
                    
                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <input type="checkbox" checked={isBlock} onChange={e => setIsBlock(e.target.checked)} className="w-5 h-5 accent-teal-600 rounded"/>
                        <span className="font-bold text-sm">Block out provider's time</span>
                    </label>

                </form>

                <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                    <button onClick={handleSubmit} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 flex items-center gap-2">
                        <Save size={16} /> {existingAppointment ? 'Save Changes' : 'Book Appointment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppointmentModal;

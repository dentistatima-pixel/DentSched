import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Calendar, Clock, User, Save, Search, AlertCircle, Sparkles, Beaker, CreditCard, Activity, ArrowRight, ClipboardCheck, FileSignature, CheckCircle, Shield, Briefcase, Lock, Armchair, AlertTriangle, ShieldAlert, BadgeCheck, ShieldX, Database, PackageCheck, UserCheck, Baby, Hash, Phone, FileText, Zap, UserPlus, Key, DollarSign as FinanceIcon, RotateCcw } from 'lucide-react';
import { Patient, User as Staff, UserRole, Appointment, AppointmentStatus, FieldSettings, LabStatus, TreatmentPlanStatus, SterilizationCycle, ClinicResource, Vendor, DaySchedule, WaitlistEntry, LedgerEntry, ResourceType, ClinicalProtocolRule, ProcedureItem, OperationalHours } from '../types';
import Fuse from 'fuse.js';
import { formatDate, CRITICAL_CLEARANCE_CONDITIONS, generateUid } from '../constants';
import { useToast } from './ToastSystem';
import { useModal } from '../contexts/ModalContext';
import { validateAppointment } from '../services/validationService';
import { usePatient } from '../contexts/PatientContext';
import { useStaff } from '../contexts/StaffContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAppointments } from '../contexts/AppointmentContext';
import { useLicenseValidation } from '../hooks/useLicenseValidation';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => Promise<void>;
  onAddToWaitlist: (entry: Omit<WaitlistEntry, 'id' | 'patientName'>) => void;
  initialDate?: string;
  initialTime?: string;
  initialPatientId?: string;
  existingAppointment?: Appointment | null;
  overrideInfo?: { isWaitlistOverride: boolean; authorizedManagerId: string; } | null;
  isDowntime?: boolean;
  isReconciliationMode?: boolean;
  currentBranch: string;
  readOnly?: boolean;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
    isOpen, onClose, onSave, onAddToWaitlist,
    initialDate, initialTime, initialPatientId, existingAppointment, 
    isDowntime, overrideInfo, isReconciliationMode, currentBranch, readOnly = false
}) => {
    const toast = useToast();
    const { showModal } = useModal();
    const { patients } = usePatient();
    const { staff } = useStaff();
    const { fieldSettings } = useSettings();
    const { appointments } = useAppointments();

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
    
    const { isPrcExpired, isMalpracticeExpired, licenseAlerts } = useLicenseValidation(providerId);
    
    useEffect(() => {
        if (isOpen) {
            licenseAlerts.forEach(alert => {
                if(alert.startsWith('CRITICAL')) {
                    toast.error(alert, { duration: 10000 });
                } else {
                    toast.warning(alert, { duration: 6000 });
                }
            });
        }
    }, [isOpen, JSON.stringify(licenseAlerts)]);

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
    
    const operationalHours = useMemo(() => {
        const branchProfile = fieldSettings.branchProfiles.find(b => b.name === currentBranch);
        return branchProfile?.operationalHours;
    }, [currentBranch, fieldSettings.branchProfiles]);

    const timeSlots = useMemo(() => {
        if (!date || !providerId || !operationalHours) return [];
        
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof operationalHours;
        const hours = operationalHours[dayOfWeek];
        if (!hours || hours.isClosed) return [];

        const slots = [];
        const start = parseInt(hours.start.split(':')[0]);
        const end = parseInt(hours.end.split(':')[0]);
        const appointmentDuration = parseInt(duration) || 30;

        for (let h = start; h < end; h++) {
            for (let m = 0; m < 60; m += 30) {
                const slotTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                const slotStart = new Date(`${date}T${slotTime}`);
                const slotEnd = new Date(slotStart.getTime() + appointmentDuration * 60000);

                const isBooked = appointments.some(apt => {
                    if (apt.date !== date) return false;
                    if (apt.providerId !== providerId && apt.resourceId !== resourceId) return false;
                    if (existingAppointment && apt.id === existingAppointment.id) return false;
                    
                    const existingStart = new Date(`${apt.date}T${apt.time}`);
                    const existingEnd = new Date(existingStart.getTime() + apt.durationMinutes * 60000);
                    
                    return (slotStart < existingEnd) && (slotEnd > existingStart);
                });

                slots.push({ time: slotTime, isBooked });
            }
        }
        return slots;
    }, [date, providerId, resourceId, duration, appointments, operationalHours, existingAppointment]);


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


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const provider = staff.find(s => s.id === providerId);
        if (!provider) {
            toast.error("A provider must be selected.");
            return;
        }

        if (isPrcExpired) {
            toast.error(`Cannot book: ${provider.name}'s PRC license has expired.`);
            return;
        }

        const procedure = fieldSettings.procedures.find(p => p.name === procedureType);
        const highRiskCats = ['Surgery', 'Endodontics', 'Prosthodontics'];
        const isHighRisk = highRiskCats.includes(procedure?.category || '');

        if (isHighRisk && isMalpracticeExpired) {
            toast.error(`Cannot book: ${provider.name}'s Malpractice Insurance is expired for this high-risk procedure.`);
            return;
        }

        if (!isBlock && procedure && procedure.allowedLicenseCategories && !procedure.allowedLicenseCategories.includes(provider.licenseCategory!)) {
            toast.error(`Scope of Practice Violation: ${procedure.name} requires a ${procedure.allowedLicenseCategories.join('/')} license. ${provider.name} is a ${provider.licenseCategory}.`);
            return;
        }

        setIsSaving(true);
        try {
            const appointmentData: Partial<Appointment> = {
                id: existingAppointment?.id || generateUid('apt'),
                patientId: isBlock ? 'ADMIN_BLOCK' : patientId,
                providerId,
                resourceId,
                branch: currentBranch,
                date,
                time,
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
            
            const errors = validateAppointment(appointmentData, appointments, patients, staff, existingAppointment?.id);
            if (errors) {
                Object.values(errors).forEach(errorMsg => toast.error(errorMsg, { duration: 6000 }));
                setIsSaving(false);
                return;
            }
            
            await onSave(appointmentData as Appointment);
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Could not save appointment.");
        } finally {
            setIsSaving(false);
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
                        <input type="text" value={patientSearch} onChange={handleSearch} className="input" placeholder="Search by name, ID, or phone" disabled={readOnly} />
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
                            <select value={providerId} onChange={e => setProviderId(e.target.value)} className="input" disabled={readOnly}>
                                <option value="">Select Provider</option>
                                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {isPrcExpired && (
                                <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs font-bold rounded-lg flex items-center gap-2">
                                    <ShieldAlert size={14}/> PRC License Expired - Cannot Book
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="label">Resource / Chair</label>
                            <select value={resourceId} onChange={e => setResourceId(e.target.value)} className="input" disabled={readOnly}>
                                <option value="">Select Resource</option>
                                {fieldSettings.resources.filter(r => r.branch === currentBranch).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div><label className="label">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" disabled={readOnly}/></div>
                        <div><label className="label">Time</label><input type="time" step="900" value={time} onChange={e => setTime(e.target.value)} className="input" disabled={readOnly}/></div>
                        <div><label className="label">Duration (min)</label><input type="number" step="15" value={duration} onChange={e => setDuration(e.target.value)} className="input" disabled={readOnly}/></div>
                    </div>

                    {timeSlots.length > 0 && (
                        <div>
                            <label className="label text-xs">Available Slots</label>
                            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                {timeSlots.map(slot => (
                                    <button 
                                        type="button"
                                        key={slot.time}
                                        onClick={() => !slot.isBooked && setTime(slot.time)}
                                        disabled={slot.isBooked || readOnly}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                            slot.isBooked ? 'bg-black text-white cursor-not-allowed' :
                                            time === slot.time ? 'bg-teal-600 text-white shadow-md' :
                                            'bg-slate-200 text-black hover:bg-teal-100'
                                        }`}
                                    >
                                        {new Date(`1970-01-01T${slot.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {!isBlock ? (
                        <div>
                            <label className="label">Procedure Type</label>
                            <select value={procedureType} onChange={e => setProcedureType(e.target.value)} className="input" disabled={readOnly}>
                                <option value="">Select Procedure...</option>
                                {fieldSettings.procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>
                        </div>
                    ) : (
                         <div>
                            <label className="label">Block Title</label>
                            <input type="text" value={blockTitle} onChange={e => setBlockTitle(e.target.value)} className="input" disabled={readOnly}/>
                         </div>
                    )}

                    <div>
                        <label className="label">Notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input h-24" placeholder="Clinical notes for the appointment..." disabled={readOnly}></textarea>
                    </div>
                </form>

                <div className="p-6 border-t border-slate-100 flex justify-between items-center shrink-0">
                    <button type="button" onClick={handleWaitlist} disabled={readOnly} className="px-6 py-3 bg-amber-100 text-amber-800 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-200 transition-all disabled:opacity-50 disabled:grayscale">
                        Add to Waitlist
                    </button>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="px-8 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest">Cancel</button>
                        <button type="submit" form="appointment-form" disabled={isSaving || readOnly || isPrcExpired} className="px-10 py-4 bg-teal-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-teal-600/30 disabled:opacity-50 flex items-center gap-2">
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
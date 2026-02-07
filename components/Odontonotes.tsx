import React, { useState, useMemo, useEffect } from 'react';
// FIX: Added 'Patient' to the import from '../types' to resolve type errors.
import { DentalChartEntry, ProcedureItem, TreatmentPlan, User, TreatmentStatus, UserRole, Appointment, ConsentCategory, Patient } from '../types';
import { Plus, Lock, FileText, Activity, Stethoscope, ClipboardList, Sparkles, ArrowRight, RotateCcw, ShieldCheck, FileSignature, AlertTriangle } from 'lucide-react';
import { formatDate, isExpired } from '../constants';
import { useToast } from './ToastSystem';
import { reviewClinicalNote, generateSoapNote } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { useModal } from '../contexts/ModalContext';

const statusColors: { [key in TreatmentStatus]: string } = {
    'Planned': 'border-lilac-500 bg-lilac-50 text-lilac-800',
    'Completed': 'border-teal-50 bg-teal-50 text-teal-800',
    'Existing': 'border-slate-400 bg-slate-100 text-slate-600',
    'Condition': 'border-red-500 bg-red-50 text-red-800',
};

// Standalone EntryForm component to manage its own state and prevent focus loss
interface EntryFormProps {
    note: DentalChartEntry;
    procedures: ProcedureItem[];
    treatmentPlans: TreatmentPlan[];
    onSave: (note: DentalChartEntry) => void;
    onCancel: () => void;
    currentUser: User;
    onAssign: (note: DentalChartEntry) => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ note, procedures, treatmentPlans, onSave, onCancel, currentUser, onAssign }) => {
    const [formData, setFormData] = useState<DentalChartEntry>(note);
    const [aiReview, setAiReview] = useState<string | null>(null);
    const [isReviewLoading, setIsReviewLoading] = useState(false);
    const [isSoapLoading, setIsSoapLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        setFormData(note);
        setAiReview(null);
    }, [note]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value === '' ? undefined : parseInt(value) }));
    };

    const handleStatusChange = (status: TreatmentStatus) => {
        setFormData(prev => ({ ...prev, status }));
    };
    
    const handleGetAiReview = async () => {
        setIsReviewLoading(true);
        try {
            const feedback = await reviewClinicalNote(formData);
            setAiReview(feedback);
        } catch (error) {
            setAiReview("Error getting AI review.");
        } finally {
            setIsReviewLoading(false);
        }
    };
    
    const handleGenerateAiSoap = async () => {
        if (!formData.procedure) {
            toast.error("Please select a procedure first.");
            return;
        }
        setIsSoapLoading(true);
        try {
            const result = await generateSoapNote(formData.procedure, formData.toothNumber);
            setFormData(prev => ({ ...prev, ...result }));
            toast.success("AI SOAP note generated.");
        } catch (error) {
            toast.error("Could not generate AI note.");
            console.error(error);
        } finally {
            setIsSoapLoading(false);
        }
    };


    const isSealed = !!formData.sealedHash;
    const canGetAiReview = (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SYSTEM_ARCHITECT) && formData.needsProfessionalismReview;

    const handleAssignClick = () => {
        onAssign(formData);
    };

    return (
      <div className="p-8 space-y-6 bg-white rounded-[2rem] border-2 border-teal-100 shadow-xl shadow-teal-900/5 relative">
        {isSealed && (
            <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 text-center rounded-[2rem]">
                <Lock size={32} className="text-teal-600 mb-4" />
                <h4 className="font-black text-teal-800 uppercase tracking-tight">Note Sealed & Finalized</h4>
                <p className="text-sm text-slate-500 font-bold mt-2">This clinical record is cryptographically sealed and cannot be edited for medico-legal integrity.</p>
            </div>
        )}
        
        {canGetAiReview && (
            <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-200 space-y-3">
                <div className="flex justify-between items-center">
                    <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Professionalism Audit</h4>
                    <button onClick={handleGetAiReview} disabled={isReviewLoading} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-black uppercase flex items-center gap-2">
                        <Sparkles size={14}/> {isReviewLoading ? 'Analyzing...' : 'Get AI Review'}
                    </button>
                </div>
                {aiReview && (
                    <div className="p-4 bg-white rounded-lg border border-amber-200 prose prose-sm max-w-none">
                        <ReactMarkdown>{aiReview}</ReactMarkdown>
                    </div>
                )}
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-3">
                <label className="label">Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="input" disabled={isSealed}/>
            </div>
            <div className="md:col-span-2">
                <label className="label">Tooth #</label>
                <input type="number" name="toothNumber" value={formData.toothNumber || ''} onChange={handleNumericChange} className="input" placeholder="e.g., 16" disabled={isSealed}/>
            </div>
            <div className="md:col-span-7">
                <label className="label">Procedure *</label>
                <select name="procedure" value={formData.procedure} onChange={handleChange} className="input font-bold" disabled={isSealed} required>
                    <option value="">Select Procedure...</option>
                    {procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="label">Status</label>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                    {(['Planned', 'Completed', 'Existing', 'Condition'] as TreatmentStatus[]).map(status => (
                        <button key={status} type="button" onClick={() => handleStatusChange(status)} className={`flex-1 py-2 text-sm font-black uppercase rounded-lg transition-all ${formData.status === status ? 'bg-white shadow' : 'opacity-60'}`}>{status}</button>
                    ))}
                </div>
            </div>
             <div>
                <label className="label">Treatment Phase</label>
                <select name="planId" value={formData.planId || ''} onChange={handleChange} className="input text-sm font-black uppercase" disabled={isSealed}>
                    <option value="">- Unassigned -</option>
                    {treatmentPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
        </div>
        <div className="space-y-4 pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center">
                <label className="label flex items-center gap-2"><Stethoscope size={14}/> SOAP Narrative</label>
                <button 
                    type="button" 
                    onClick={handleGenerateAiSoap}
                    disabled={isSoapLoading || isSealed || !formData.procedure}
                    className="flex items-center gap-2 px-4 py-2 bg-lilac-600 text-white rounded-lg text-sm font-black uppercase tracking-widest shadow-lg shadow-lilac-900/20 disabled:opacity-50 disabled:grayscale"
                >
                    {isSoapLoading ? <RotateCcw size={14} className="animate-spin" /> : <Sparkles size={14}/>}
                    {isSoapLoading ? 'Generating...' : 'Generate AI Note'}
                </button>
            </div>
            <div>
                <label className="label">S (Subjective)</label>
                <textarea name="subjective" value={formData.subjective || ''} onChange={handleChange} className="input h-20" disabled={isSealed} placeholder="Patient's chief complaint and history..."/>
            </div>
            <div>
                <label className="label">O (Objective)</label>
                <textarea name="objective" value={formData.objective || ''} onChange={handleChange} className="input h-28" disabled={isSealed} placeholder="Clinical findings and observations..."/>
            </div>
            <div>
                <label className="label">A (Assessment)</label>
                <textarea name="assessment" value={formData.assessment || ''} onChange={handleChange} className="input h-20" disabled={isSealed} placeholder="Diagnosis and clinical judgment..."/>
            </div>
             <div>
                <label className="label">P (Plan)</label>
                <textarea name="plan" value={formData.plan || ''} onChange={handleChange} className="input h-24" disabled={isSealed} placeholder="Treatment plan, prescriptions, and follow-up..."/>
            </div>
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={onCancel} className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-sm tracking-widest">Cancel</button>
            {formData.status === 'Planned' && (
                <button type="button" onClick={handleAssignClick} disabled={isSealed} className="px-8 py-3 bg-teal-700 text-white rounded-xl font-black uppercase text-sm tracking-widest shadow-lg shadow-teal-700/20 flex items-center gap-2">
                    Save & Assign <ArrowRight size={14}/>
                </button>
            )}
            <button type="button" onClick={() => onSave(formData)} disabled={isSealed} className="px-10 py-3 bg-teal-600 text-white rounded-xl font-black uppercase text-sm tracking-widest shadow-lg shadow-teal-600/20 disabled:opacity-50">
                {formData.id.startsWith('note_') ? 'Save Entry' : 'Update Entry'}
            </button>
        </div>
      </div>
    );
};

interface ConsentVerificationGateProps {
    appointment: Appointment;
    onAffirm: () => void;
    onReconsent: () => void;
}

const ConsentVerificationGate: React.FC<ConsentVerificationGateProps> = ({ appointment, onAffirm, onReconsent }) => {
    const lastConsentDate = appointment.consentSignatureChain?.[0]?.timestamp;
    
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white rounded-[2rem] border-4 border-dashed border-lilac-200 shadow-inner">
            <div className="w-24 h-24 bg-lilac-100 text-lilac-600 rounded-full flex items-center justify-center mb-6 ring-8 ring-lilac-50">
                <FileSignature size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight text-center">Consent Verification Gate</h3>
            <p className="text-sm text-slate-500 mt-2 text-center max-w-md">
                Before proceeding with documentation for <strong>{appointment.type}</strong>, please verify the patient's consent for today's session.
            </p>
            <div className="my-8 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Last Consent Captured</p>
                <p className="text-base font-bold text-slate-700 mt-1">
                    {lastConsentDate ? new Date(lastConsentDate).toLocaleString() : 'No prior consent found for this session.'}
                </p>
            </div>
            <div className="flex gap-4">
                <button onClick={onReconsent} className="px-8 py-4 bg-amber-500 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-lg shadow-amber-900/30 flex items-center gap-2">
                    <AlertTriangle size={16}/> Require Re-Consent
                </button>
                <button onClick={onAffirm} className="px-12 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-teal-600/30 flex items-center gap-2">
                    <ShieldCheck size={16}/> Affirm Consent is Valid
                </button>
            </div>
        </div>
    );
};


interface OdontonotesProps {
  entries: DentalChartEntry[];
  appointments: Appointment[];
  patient: Patient;
  onAddEntry: (entry: DentalChartEntry) => void;
  onUpdateEntry: (entry: DentalChartEntry) => void;
  onUpdateAppointment: (appointment: Appointment) => Promise<void>;
  onQuickUpdatePatient: (patientData: Partial<Patient>) => Promise<void>;
  onDeleteEntry?: (id: string) => void;
  currentUser: User;
  readOnly?: boolean;
  procedures: ProcedureItem[];
  treatmentPlans?: TreatmentPlan[];
  prefill?: DentalChartEntry | null;
  onClearPrefill?: () => void;
  onSwitchToPlanTab?: () => void;
  showModal: (type: string, props?: any) => void;
  logAction: (action: string, entity: string, entityId: string, details: string) => void;
}

export const Odontonotes: React.FC<OdontonotesProps> = ({ 
  entries, appointments, patient, onAddEntry, onUpdateEntry, onUpdateAppointment, onQuickUpdatePatient, onDeleteEntry, currentUser, readOnly, 
  procedures, treatmentPlans = [], prefill, onClearPrefill, onSwitchToPlanTab, showModal, logAction
}) => {
  const toast = useToast();
  const [editingNote, setEditingNote] = useState<DentalChartEntry | null>(null);
  const [verifiedConsentMap, setVerifiedConsentMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (prefill && onClearPrefill) {
      startNewNote(prefill);
      onClearPrefill();
    }
  }, [prefill, onClearPrefill]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [entries]);

  const startNewNote = (initialData?: Partial<DentalChartEntry>) => {
    const newNote: DentalChartEntry = {
      id: `note_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      procedure: '',
      status: 'Completed',
      author: currentUser.name,
      authorId: currentUser.id,
      authorRole: currentUser.role,
      authorPrc: currentUser.prcLicense,
      ...initialData
    };
    setEditingNote(newNote);
  };

  const handleSaveNote = (noteToSave: DentalChartEntry) => {
    if (!noteToSave.procedure) {
      toast.error("Procedure is a mandatory field for clinical entries.");
      return;
    }

    const procedure = procedures.find(p => p.name === noteToSave.procedure);
    const highRiskCats = ['Surgery', 'Endodontics', 'Prosthodontics'];
    const isHighRisk = highRiskCats.includes(procedure?.category || '');
    const malpracticeIsExpired = isExpired(currentUser.malpracticeExpiry);
    
    if (isHighRisk && malpracticeIsExpired) {
        toast.error("INDEMNITY LOCK: Cannot save note for high-risk procedure. Malpractice insurance has expired.");
        return;
    }

    const totalLength = (noteToSave.subjective || '').length + (noteToSave.objective || '').length + (noteToSave.assessment || '').length + (noteToSave.plan || '').length;
    const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SYSTEM_ARCHITECT;
    noteToSave.needsProfessionalismReview = !isAdmin && totalLength > 0 && totalLength < 100;

    const isNew = !entries.some(e => e.id === noteToSave.id);
    if (isNew) {
      onAddEntry(noteToSave);
      toast.success("New clinical entry added.");
    } else {
      onUpdateEntry(noteToSave);
      toast.success("Clinical entry updated.");
    }
    setEditingNote(null);
  };

  const handleAssignToPlan = (noteToSave: DentalChartEntry) => {
    handleSaveNote(noteToSave);
    if (onSwitchToPlanTab) {
        onSwitchToPlanTab();
    }
  };
  
  const appointmentForEditingNote = useMemo(() => {
      if (!editingNote || !editingNote.appointmentId) return null;
      return appointments.find(a => a.id === editingNote.appointmentId);
  }, [editingNote, appointments]);

  const needsConsentVerification = useMemo(() => {
      if (!editingNote || !appointmentForEditingNote) return false;
      const today = new Date().toISOString().split('T')[0];
      // Only trigger for today's appointments and if not yet verified in this session
      return appointmentForEditingNote.date === today && !verifiedConsentMap[editingNote.id];
  }, [editingNote, appointmentForEditingNote, verifiedConsentMap]);

  const handleAffirmConsent = () => {
    if (!editingNote || !appointmentForEditingNote) return;
    logAction('AFFIRM_CONSENT', 'Appointment', appointmentForEditingNote.id, `Practitioner affirmed consent validity for procedure: ${appointmentForEditingNote.type}`);
    setVerifiedConsentMap(prev => ({ ...prev, [editingNote.id]: true }));
    toast.success("Consent affirmed for this session.");
  };
  
  const handleReconsent = () => {
    if (!appointmentForEditingNote || !procedures) return;
    const procedureDef = procedures.find(p => p.name === appointmentForEditingNote.type);
    
    showModal('consentCapture', {
      patient,
      appointment: appointmentForEditingNote,
      template: procedures.find(p => p.id === 'GENERAL_AUTHORIZATION'), // This needs better logic
      procedure: procedureDef,
      onSave: (newChain: any) => {
          const updatedAppointment = { ...appointmentForEditingNote, consentSignatureChain: newChain };
          // FIX: The component now calls the onUpdateAppointment prop to correctly save the appointment.
          onUpdateAppointment(updatedAppointment as Appointment);
          handleAffirmConsent();
      }
    });
  };

  return (
    <div className="flex h-full">
        <div className="w-full md:w-1/3 border-r border-slate-200 flex flex-col bg-slate-50/50">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <h3 className="font-black text-slate-800 uppercase tracking-tight">Clinical Narrative</h3>
                <button onClick={() => startNewNote()} disabled={readOnly} className="bg-teal-600 text-white px-4 py-2 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-teal-600/20 flex items-center gap-2"><Plus size={16}/> New</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {sortedEntries.map(entry => {
                    const isSelected = editingNote?.id === entry.id;
                    return (
                        <div key={entry.id} onClick={() => setEditingNote(entry)} className={`p-5 rounded-2xl cursor-pointer border-2 transition-all ${isSelected ? 'bg-teal-50 border-teal-500 shadow-md' : entry.needsProfessionalismReview ? 'bg-amber-50 border-amber-200 hover:border-amber-400' : 'bg-white border-slate-100 hover:border-teal-200'}`}>
                            <div className="flex justify-between items-start">
                                <span className="font-black text-base text-slate-800 uppercase tracking-tight">{entry.procedure || 'Untitled Note'}</span>
                                {entry.sealedHash && <Lock size={14} className="text-teal-600 shrink-0"/>}
                            </div>
                            <div className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">{formatDate(entry.date)} &bull; {entry.toothNumber ? `Tooth #${entry.toothNumber}` : 'General Note'}</div>
                            <div className={`mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 ${isSelected ? 'border-teal-100' : ''}`}>
                                <span className={`text-sm font-black uppercase px-2 py-0.5 rounded-full border ${statusColors[entry.status]}`}>{entry.status}</span>
                                <span className="text-sm text-slate-400 font-bold">by {entry.author}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
        <div className="w-full md:w-2/3 flex flex-col p-6 overflow-y-auto">
            {editingNote ? (
                needsConsentVerification && appointmentForEditingNote ? (
                    <ConsentVerificationGate 
                        appointment={appointmentForEditingNote}
                        onAffirm={handleAffirmConsent}
                        onReconsent={handleReconsent}
                    />
                ) : (
                    <EntryForm 
                        note={editingNote}
                        procedures={procedures}
                        treatmentPlans={treatmentPlans}
                        onSave={handleSaveNote}
                        onCancel={() => setEditingNote(null)}
                        currentUser={currentUser}
                        onAssign={handleAssignToPlan}
                    />
                )
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-10">
                    <FileText size={48} className="mb-4 opacity-50"/>
                    <h4 className="font-black text-slate-500 uppercase">Select an entry or create a new one.</h4>
                    <p className="text-sm">This is the medico-legal record of the patient's clinical history.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default Odontonotes;
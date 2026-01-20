
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DentalChartEntry, ProcedureItem, StockItem, User, UserRole, FieldSettings, TreatmentStatus, ClinicalIncident, Patient, ResourceType, Appointment, AppointmentStatus, AuthorityLevel, InstrumentSet, TreatmentPlan, SterilizationCycle, ClinicalMacro, ClinicalProtocolRule } from '../types';
import { Plus, Edit3, ShieldCheck, Lock, Clock, GitCommit, ArrowDown, AlertCircle, FileText, Zap, Box, RotateCcw, CheckCircle2, PackageCheck, Mic, MicOff, Volume2, Sparkles, DollarSign, ShieldAlert, Key, Camera, ImageIcon, Check, MousePointer2, UserCheck, X, EyeOff, Shield, Eraser, Activity, Heart, HeartPulse, Droplet, UserSearch, RotateCcw as Undo, Trash2, Armchair, Star, PlusCircle, MinusCircle, UserPlus, ShieldX, Verified, ShieldQuestion, Pill, Fingerprint, Scale, History, Link } from 'lucide-react';
import { formatDate, STAFF, PDA_FORBIDDEN_COMMERCIAL_TERMS, PDA_INFORMED_CONSENT_TEXTS } from '../constants';
import { useToast } from './ToastSystem';
import EPrescriptionModal from './EPrescriptionModal';
import SignatureCaptureOverlay from './SignatureCaptureOverlay';
import CryptoJS from 'crypto-js';
import { getTrustedTime } from '../services/timeService';
import { useClinicalNotePermissions } from '../hooks/useClinicalNotePermissions';
import { useDictation } from '../hooks/useDictation';


interface OdontonotesProps {
  entries: DentalChartEntry[];
  onAddEntry: (entry: DentalChartEntry) => void;
  onUpdateEntry: (entry: DentalChartEntry) => void;
  onDeleteEntry?: (id: string) => void;
  currentUser: User;
  readOnly?: boolean;
  procedures: ProcedureItem[];
  inventory?: StockItem[]; 
  prefill?: Partial<DentalChartEntry> | null;
  onClearPrefill?: () => void;
  logAction?: (action: any, entity: any, id: string, details: string) => void;
  fieldSettings?: FieldSettings; 
  patient?: Patient;
  appointments?: Appointment[];
  incidents?: ClinicalIncident[];
  sterilizationCycles?: SterilizationCycle[];
  onRequestProtocolOverride?: (rule: ClinicalProtocolRule, continuation: () => void) => void;
  onSupervisorySeal?: (note: DentalChartEntry) => void;
}

type SoapData = Pick<DentalChartEntry, 'subjective' | 'objective' | 'assessment' | 'plan'>;

export const Odontonotes: React.FC<OdontonotesProps> = ({ entries, onAddEntry, onUpdateEntry, onDeleteEntry, currentUser, readOnly, procedures, inventory = [], prefill, onClearPrefill, logAction, fieldSettings, patient, appointments = [], incidents = [], sterilizationCycles = [], onRequestProtocolOverride, onSupervisorySeal }) => {
  const toast = useToast();
  const isAdvancedInventory = fieldSettings?.features.inventoryComplexity === 'ADVANCED';
  
  const [editingNote, setEditingNote] = useState<DentalChartEntry | null>(null);
  const [showSmartPhrases, setShowSmartPhrases] = useState(false);
  
  const handleSoapUpdate = (field: keyof SoapData, value: string | ((prev: string) => string)) => {
    if (!editingNote) return;
    const prevValue = editingNote[field] || '';
    const newValue = typeof value === 'function' ? value(prevValue) : value;
    const nextNote = { ...editingNote, [field]: newValue };
    setEditingNote(nextNote);
  };

  const { isRecording, toggleRecording } = useDictation({
      s: (val) => handleSoapUpdate('subjective', val),
      o: (val) => handleSoapUpdate('objective', val),
      a: (val) => handleSoapUpdate('assessment', val),
      p: (val) => handleSoapUpdate('plan', val),
  });
  
  const isArchitect = currentUser.role === UserRole.SYSTEM_ARCHITECT;
  const activeAppointmentToday = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA');
    return appointments.find(a => a.patientId === patient?.id && a.date === today && a.status !== AppointmentStatus.CANCELLED) || null;
  }, [appointments, patient]);

  const { isLockedForAction, getLockReason } = useClinicalNotePermissions(currentUser, patient, activeAppointmentToday, incidents, isArchitect);
  
  // EPrescription Modal
  const [showRx, setShowRx] = useState(false);
  const [isSigning, setIsSigning] = useState<DentalChartEntry | null>(null);
  
  const startNewNote = () => {
    if (isLockedForAction) {
      toast.error(`Clinical Gate: ${getLockReason()}`);
      return;
    }
    const newNote: DentalChartEntry = {
      id: `note_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      procedure: '',
      status: 'Completed',
      author: currentUser.name,
      authorId: currentUser.id,
      authorRole: currentUser.role,
      authorPrc: currentUser.prcLicense
    };
    if (prefill) {
      Object.assign(newNote, prefill);
      onClearPrefill?.();
    }
    setEditingNote(newNote);
  };
  
  const handleSaveNote = () => {
    if (!editingNote) return;
    const isNew = !entries.some(e => e.id === editingNote.id);
    if (isNew) onAddEntry(editingNote);
    else onUpdateEntry(editingNote);
    setEditingNote(null);
  };

  const handleSeal = async (note: DentalChartEntry) => {
    const time = await getTrustedTime();
    const payload = `${note.id}|${note.authorId}|${time.timestamp}|${note.subjective}|${note.objective}|${note.assessment}|${note.plan}`;
    const hash = CryptoJS.SHA256(payload).toString();
    const sealedNote: DentalChartEntry = { ...note, sealedHash: hash, sealedAt: time.timestamp, isVerifiedTime: time.isVerified };
    onUpdateEntry(sealedNote);
    logAction?.('SEAL_RECORD', 'ClinicalNote', note.id, `SHA256: ${hash.substring(0,16)}...`);
  };
  
  const canSupervise = [UserRole.DENTIST, UserRole.ADMIN, UserRole.SYSTEM_ARCHITECT].includes(currentUser.role);

  return (
    <div className="flex h-full bg-slate-50">
        <div className="w-1/3 border-r border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                <h3 className="font-bold text-sm">Clinical Notes</h3>
                <button onClick={startNewNote} disabled={readOnly} className="bg-teal-600 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Plus size={14}/> New Entry</button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {entries.map(entry => (
                    <div key={entry.id} onClick={() => setEditingNote(entry)} className={`p-4 border-b border-slate-100 cursor-pointer ${editingNote?.id === entry.id ? 'bg-teal-50' : 'hover:bg-slate-100'}`}>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">{entry.procedure || 'Untitled Note'}</span>
                            {entry.sealedHash && <Lock size={12} className="text-teal-600"/>}
                        </div>
                        <div className="text-xs text-slate-500">{formatDate(entry.date)} by {entry.author}</div>
                    </div>
                ))}
            </div>
        </div>
        <div className="w-2/3 flex flex-col bg-white">
            {editingNote ? (
                <>
                    <div className="p-4 border-b border-slate-200 space-y-2">
                         <div className="flex items-center gap-2">
                             <select value={editingNote.procedure} onChange={(e) => setEditingNote({...editingNote, procedure: e.target.value})} className="flex-1 input" disabled={!!editingNote.sealedHash}>
                                 <option value="">Select Procedure...</option>
                                 {procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                             </select>
                             <input type="number" value={editingNote.toothNumber || ''} onChange={(e) => setEditingNote({...editingNote, toothNumber: parseInt(e.target.value)})} className="input w-24" placeholder="Tooth #" disabled={!!editingNote.sealedHash}/>
                         </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* SOAP Fields with Dictation */}
                        <div>
                            <label className="label flex items-center justify-between">Subjective <button onClick={() => toggleRecording('s')} className={`p-1 rounded-full ${isRecording === 's' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}><Mic size={12}/></button></label>
                            <textarea value={editingNote.subjective || ''} onChange={(e) => handleSoapUpdate('subjective', e.target.value)} className="input h-24" disabled={!!editingNote.sealedHash} />
                        </div>
                        <div>
                            <label className="label flex items-center justify-between">Objective <button onClick={() => toggleRecording('o')} className={`p-1 rounded-full ${isRecording === 'o' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}><Mic size={12}/></button></label>
                            <textarea value={editingNote.objective || ''} onChange={(e) => handleSoapUpdate('objective', e.target.value)} className="input h-24" disabled={!!editingNote.sealedHash} />
                        </div>
                        <div>
                            <label className="label flex items-center justify-between">Assessment <button onClick={() => toggleRecording('a')} className={`p-1 rounded-full ${isRecording === 'a' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}><Mic size={12}/></button></label>
                            <textarea value={editingNote.assessment || ''} onChange={(e) => handleSoapUpdate('assessment', e.target.value)} className="input h-24" disabled={!!editingNote.sealedHash} />
                        </div>
                        <div>
                            <label className="label flex items-center justify-between">Plan <button onClick={() => toggleRecording('p')} className={`p-1 rounded-full ${isRecording === 'p' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}><Mic size={12}/></button></label>
                            <textarea value={editingNote.plan || ''} onChange={(e) => handleSoapUpdate('plan', e.target.value)} className="input h-24" disabled={!!editingNote.sealedHash} />
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-200 flex justify-between items-center">
                        <div>
                          {editingNote.sealedHash && <div className="text-xs text-teal-600 flex items-center gap-1"><ShieldCheck size={12}/> Digitally Sealed</div>}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleSaveNote} disabled={!!editingNote.sealedHash} className="bg-slate-200 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">Save</button>
                            {canSupervise && editingNote.isPendingSupervision && onSupervisorySeal && (
                                <button onClick={() => onSupervisorySeal(editingNote)} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1"><UserCheck size={12}/> Seal Under Supervision</button>
                            )}
                            <button onClick={() => handleSeal(editingNote)} disabled={!editingNote.id || !!editingNote.sealedHash} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-1"><Lock size={12}/> Seal Note</button>
                            <button onClick={() => setShowRx(true)} disabled={!editingNote.sealedHash} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">e-Rx</button>
                            {onDeleteEntry && <button onClick={() => onDeleteEntry(editingNote.id)} className="bg-red-100 text-red-700 p-2 rounded-lg disabled:opacity-50"><Trash2 size={16}/></button>}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center text-center text-slate-400">Select a note or create a new entry.</div>
            )}
        </div>
        {showRx && patient && fieldSettings && <EPrescriptionModal isOpen={showRx} onClose={() => setShowRx(false)} patient={patient} fieldSettings={fieldSettings} currentUser={currentUser} logAction={logAction} />}
    </div>
  );
};

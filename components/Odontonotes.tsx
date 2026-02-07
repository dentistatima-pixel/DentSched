
import React, { useState, useMemo, useEffect } from 'react';
import { DentalChartEntry, ProcedureItem, TreatmentPlan, User, TreatmentStatus, UserRole, Appointment, Patient } from '../types';
import { Plus, Lock, FileText, Stethoscope, ClipboardList, Sparkles, ArrowRight, RotateCcw, ShieldCheck, Key } from 'lucide-react';
import { formatDate, isExpired } from '../constants';
import { useToast } from './ToastSystem';
import { reviewClinicalNote, generateSoapNote } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
// Added import for CryptoJS to fix line 64 error
import CryptoJS from 'crypto-js';
import { SealBadge } from './SealBadge';

const statusColors: { [key in TreatmentStatus]: string } = {
    'Planned': 'border-lilac-500 bg-lilac-50 text-lilac-800',
    'Completed': 'border-teal-50 bg-teal-50 text-teal-800',
    'Existing': 'border-slate-400 bg-slate-100 text-slate-600',
    'Condition': 'border-red-500 bg-red-50 text-red-800',
};

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
    const [isSoapLoading, setIsSoapLoading] = useState(false);
    const [isPinPromptOpen, setIsPinPromptOpen] = useState(false);
    const [pin, setPin] = useState('');
    const toast = useToast();

    useEffect(() => { setFormData(note); }, [note]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleGenerateAiSoap = async () => {
        if (!formData.procedure) { toast.error("Select a procedure first."); return; }
        setIsSoapLoading(true);
        try {
            const result = await generateSoapNote(formData.procedure, formData.toothNumber);
            setFormData(prev => ({ ...prev, ...result }));
        } catch (error) {
            toast.error("AI Note generation failed.");
        } finally {
            setIsSoapLoading(false);
        }
    };

    const handleSealAttempt = () => {
        if (!formData.procedure) { toast.error("Procedure required."); return; }
        setIsPinPromptOpen(true);
    };

    const handleConfirmSeal = () => {
        if (pin === currentUser.pin) {
            const sealedNote = { 
                ...formData, 
                sealedAt: new Date().toISOString(), 
                // Fixed: CryptoJS is now imported
                sealedHash: CryptoJS.SHA256(JSON.stringify(formData)).toString() 
            };
            onSave(sealedNote);
            setIsPinPromptOpen(false);
        } else {
            toast.error("Incorrect Practitioner PIN.");
            setPin('');
        }
    };

    const isSealed = !!formData.sealedHash;

    return (
      <div className="p-8 space-y-6 bg-white rounded-[2rem] border-2 border-teal-100 shadow-xl shadow-teal-900/5 relative">
        {isSealed && (
            <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 text-center rounded-[2rem]">
                <div className="bg-white p-12 rounded-[3rem] shadow-2xl border-4 border-teal-100 flex flex-col items-center">
                    <Lock size={32} className="text-teal-600 mb-4" />
                    <h4 className="font-black text-teal-800 uppercase tracking-tight">Clinical Record Sealed</h4>
                    <p className="text-sm text-slate-500 font-bold mt-2">Authenticated by Dr. {formData.author}</p>
                    <div className="mt-6">
                        <SealBadge 
                            data={{
                                signerName: `Dr. ${formData.author}`,
                                signerRole: formData.authorRole,
                                timestamp: formData.sealedAt!,
                                signatureUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMzAiPjxwYXRoIGQ9Ik0xMCAxNSBDIDI1IDAgMzUgMzAgNTUgMTUgNzAgMCA4NSAzMCA5NSAxNSIgc3Ryb2tlPSIjMDAwIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=', // Simulated practitioner signature
                                hash: formData.sealedHash,
                                title: 'Clinical Note Registry Seal'
                            }}
                        />
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-3"><label className="label">Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} className="input" disabled={isSealed}/></div>
            <div className="md:col-span-2"><label className="label">Tooth #</label><input type="number" name="toothNumber" value={formData.toothNumber || ''} onChange={handleChange} className="input" disabled={isSealed}/></div>
            <div className="md:col-span-7"><label className="label">Procedure *</label><select name="procedure" value={formData.procedure} onChange={handleChange} className="input font-bold" disabled={isSealed} required><option value="">Select Procedure...</option>{procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
        </div>

        <div className="space-y-4 pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center">
                <label className="label flex items-center gap-2"><Stethoscope size={14}/> SOAP Narrative</label>
                <button type="button" onClick={handleGenerateAiSoap} disabled={isSoapLoading || isSealed} className="bg-lilac-100 text-lilac-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                    {isSoapLoading ? <RotateCcw size={14} className="animate-spin" /> : <Sparkles size={14}/>} AI Draft
                </button>
            </div>
            <textarea name="subjective" value={formData.subjective || ''} onChange={handleChange} className="input h-16 text-sm" disabled={isSealed} placeholder="Subjective..."/>
            <textarea name="objective" value={formData.objective || ''} onChange={handleChange} className="input h-20 text-sm" disabled={isSealed} placeholder="Objective..."/>
            <textarea name="assessment" value={formData.assessment || ''} onChange={handleChange} className="input h-16 text-sm" disabled={isSealed} placeholder="Assessment..."/>
            <textarea name="plan" value={formData.plan || ''} onChange={handleChange} className="input h-20 text-sm" disabled={isSealed} placeholder="Plan..."/>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={onCancel} className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-xs tracking-widest">Discard</button>
            <button type="button" onClick={() => onSave(formData)} className="px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-black uppercase text-xs tracking-widest">Save Draft</button>
            <button type="button" onClick={handleSealAttempt} className="px-12 py-3 bg-teal-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-2"><Lock size={16}/> PIN Seal & Finalize</button>
        </div>

        {isPinPromptOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-xs text-center space-y-6">
                    <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-teal-600"><Key size={32}/></div>
                    <h4 className="font-black text-slate-800 uppercase tracking-tight">Practitioner PIN</h4>
                    <input type="password" value={pin} onChange={e => setPin(e.target.value)} maxLength={4} className="input text-center text-4xl tracking-widest" autoFocus />
                    <div className="flex gap-2">
                        <button onClick={() => setIsPinPromptOpen(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
                        <button onClick={handleConfirmSeal} className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold">Seal</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
};

export const Odontonotes: React.FC<any> = ({ entries, procedures, currentUser, onAddEntry, onUpdateEntry }) => {
  const [editingNote, setEditingNote] = useState<DentalChartEntry | null>(null);

  const startNewNote = (initialData?: any) => {
    setEditingNote({
      id: `note_${Date.now()}`, date: new Date().toISOString().split('T')[0], procedure: '', status: 'Completed',
      author: currentUser.name, authorId: currentUser.id, authorRole: currentUser.role, authorPrc: currentUser.prcLicense,
      ...initialData
    });
  };

  return (
    <div className="flex h-full">
        <div className="w-full md:w-1/3 border-r border-slate-200 flex flex-col bg-slate-50/50">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 className="font-black text-slate-800 uppercase tracking-tight">Case Records</h3>
                <button onClick={() => startNewNote()} className="bg-teal-600 text-white px-4 py-2 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center gap-2"><Plus size={16}/> New</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {entries.sort((a:any,b:any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((entry: any) => (
                    <div key={entry.id} onClick={() => setEditingNote(entry)} className={`p-5 rounded-3xl cursor-pointer border-2 transition-all ${editingNote?.id === entry.id ? 'bg-teal-50 border-teal-500' : 'bg-white border-slate-100 hover:border-teal-200'}`}>
                        <div className="flex justify-between items-start">
                            <span className="font-black text-sm text-slate-800 uppercase tracking-tight leading-tight">{entry.procedure || 'Untitled Note'}</span>
                            {entry.sealedHash && (
                                <SealBadge 
                                    showLabel={false}
                                    data={{
                                        signerName: `Dr. ${entry.author}`,
                                        signerRole: entry.authorRole,
                                        timestamp: entry.sealedAt!,
                                        signatureUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMzAiPjxwYXRoIGQ9Ik0xMCAxNSBDIDI1IDAgMzUgMzAgNTUgMTUgNzAgMCA4NSAzMCA5NSAxNSIgc3Ryb2tlPSIjMDAwIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
                                        hash: entry.sealedHash,
                                        title: 'Clinical Note Registry Seal'
                                    }}
                                />
                            )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-black uppercase mt-1">{formatDate(entry.date)} &bull; {entry.author}</div>
                    </div>
                ))}
            </div>
        </div>
        <div className="w-full md:w-2/3 flex flex-col p-6 overflow-y-auto no-scrollbar">
            {editingNote ? (
                <EntryForm 
                    note={editingNote} 
                    procedures={procedures} 
                    treatmentPlans={[]} 
                    currentUser={currentUser}
                    onCancel={() => setEditingNote(null)}
                    onSave={(note: any) => { 
                        const isNew = !entries.some((e:any) => e.id === note.id);
                        isNew ? onAddEntry(note) : onUpdateEntry(note);
                        setEditingNote(null);
                    }}
                    onAssign={() => {}}
                />
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                    <ClipboardList size={64} className="mb-4 opacity-20"/>
                    <p className="font-black uppercase tracking-widest text-xs">Select or Create Clinical Entry</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default Odontonotes;

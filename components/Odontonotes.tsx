import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DentalChartEntry, ProcedureItem, StockItem, User, UserRole, FieldSettings, TreatmentStatus } from '../types';
import { Plus, Edit3, ShieldCheck, Lock, Clock, GitCommit, ArrowDown, AlertCircle, FileText, Zap, Box, RotateCcw, CheckCircle2, PackageCheck, Mic, MicOff, Volume2, Sparkles, DollarSign, ShieldAlert, Key, Camera, Image as ImageIcon, Check, MousePointer2, UserCheck, X, EyeOff, Shield, Eraser } from 'lucide-react';
import { formatDate, STAFF } from '../constants';
import { useToast } from './ToastSystem';
import CryptoJS from 'crypto-js';
import { getTrustedTime } from '../services/timeService';

interface ClinicalMacro {
    label: string;
    s: string;
    o: string;
    a: string;
    p: string;
}

const QUICK_FILLS: ClinicalMacro[] = [
    { label: 'Exam', s: 'Patient in for routine checkup. No pain reported.', o: 'Visual and tactile exam. Soft tissues normal.', a: 'Good oral hygiene maintained.', p: 'Recommended 6-month prophylaxis.' },
    { label: 'Filling', s: 'Sensitivity to cold in target quadrant.', o: 'Localized caries detected on target tooth surface.', a: 'Enamel/Dentin Caries.', p: 'Composite restoration performed. High-speed prep. Acid etch. Bond. Incremental fill.' },
    { label: 'SRP', s: 'Patient reports generalized bleeding when brushing.', o: 'Heavy subgingival calculus. Pockets 4-6mm.', a: 'Chronic Periodontitis.', p: 'Scaling and root planing performed by quadrant. Anesthesia administered.' }
];

interface OdontonotesProps {
  entries: DentalChartEntry[];
  onAddEntry: (entry: DentalChartEntry) => void;
  onUpdateEntry: (entry: DentalChartEntry) => void;
  currentUser: User;
  readOnly?: boolean;
  procedures: ProcedureItem[];
  inventory?: StockItem[]; 
  prefill?: Partial<DentalChartEntry> | null;
  onClearPrefill?: () => void;
  logAction?: (action: any, entity: any, id: string, details: string) => void;
  fieldSettings?: FieldSettings; 
}

const Odontonotes: React.FC<OdontonotesProps> = ({ entries, onAddEntry, onUpdateEntry, currentUser, readOnly, procedures, inventory = [], prefill, onClearPrefill, logAction, fieldSettings }) => {
  const toast = useToast();
  
  const [toothNum, setToothNum] = useState<string>('');
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [charge, setCharge] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [isRecording, setIsRecording] = useState<string | null>(null); 
  const [clinicalPearl, setClinicalPearl] = useState('');
  
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const [showWitnessModal, setShowWitnessModal] = useState(false);
  const [witnessPin, setWitnessPin] = useState('');
  const [pendingSealEntry, setPendingSealEntry] = useState<DentalChartEntry | null>(null);
  const [pendingSealTimestamp, setPendingSealTimestamp] = useState<string>('');

  const macroSnapshotRef = useRef<string>('');

  const isDentist = currentUser.role === UserRole.DENTIST || currentUser.role === UserRole.ADMIN;

  const activeProcedureDef = useMemo(() => {
      return procedures.find(p => p.name === selectedProcedure);
  }, [selectedProcedure, procedures]);

  const isTraceabilityRequired = useMemo(() => {
      if (!fieldSettings?.features.enableMaterialTraceability) return false;
      const categories = ['Restorative', 'Surgery', 'Endodontics', 'Prosthodontics'];
      return categories.includes(activeProcedureDef?.category || '');
  }, [activeProcedureDef, fieldSettings]);

  const isSurgicalProcedure = useMemo(() => {
      return activeProcedureDef?.category === 'Surgery' || selectedProcedure.toLowerCase().includes('extraction');
  }, [activeProcedureDef, selectedProcedure]);

  const pearlIsValid = useMemo(() => clinicalPearl.trim().length >= 20, [clinicalPearl]);

  const isOriginalNarrative = useMemo(() => {
      const currentNarrative = (subjective + objective + assessment + plan).trim().toLowerCase();
      if (!macroSnapshotRef.current) return true;
      return currentNarrative !== macroSnapshotRef.current.toLowerCase();
  }, [subjective, objective, assessment, plan]);

  useEffect(() => {
    if (prefill) {
        setToothNum(prefill.toothNumber?.toString() || '');
        setSelectedProcedure(prefill.procedure || '');
        setSubjective(prefill.subjective || '');
        setObjective(prefill.objective || '');
        setAssessment(prefill.assessment || '');
        setPlan(prefill.plan || '');
        setEditingId(null);
        if (onClearPrefill) onClearPrefill();
    }
  }, [prefill]);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setCapturedPhotos(prev => [...prev, event.target!.result as string]);
                  toast.success("Clinical photo linked to session.");
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const applyQuickFill = (fill: ClinicalMacro) => {
      const s = fill.s || '';
      const o = fill.o || '';
      const a = isDentist ? (fill.a || '') : '';
      const p = isDentist ? (fill.p || '') : '';
      setSubjective(s); setObjective(o); setAssessment(a); setPlan(p);
      macroSnapshotRef.current = (s + o + a + p).trim();
      toast.info(`Template applied. Narrative modification required to unlock Sealing.`);
  };

  const toggleRecording = (field: 's'|'o'|'a'|'p') => {
      if ((field === 'a' || field === 'p') && !isDentist) {
          toast.error("Role Restriction: Only Dentists can dictate Diagnosis or Treatment Plans.");
          return;
      }
      if (isRecording === field) { recognitionRef.current?.stop(); setIsRecording(null); return; }
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) { toast.error("Speech recognition not supported."); return; }
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsRecording(field);
      recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          const setter = field === 's' ? setSubjective : field === 'o' ? setObjective : field === 'a' ? setAssessment : setPlan;
          setter(prev => prev ? `${prev} ${transcript}` : transcript);
          setIsRecording(null);
      };
      recognition.onerror = () => setIsRecording(null);
      recognitionRef.current = recognition;
      recognition.start();
  };

  const isLocked = (entry: DentalChartEntry) => {
      if (entry.sealedHash) return true;
      if (!entry.date) return false;
      const created = new Date(entry.date);
      const diff = Date.now() - created.getTime();
      return diff > (24 * 60 * 60 * 1000); 
  };

  const handleSeal = async (entry: DentalChartEntry) => {
      if (entry.sealedHash) return;

      const isMalpracticeExpired = currentUser.malpracticeExpiry && new Date(currentUser.malpracticeExpiry) < new Date();
      if (isMalpracticeExpired) {
          toast.error("COVERAGE LOCK: Your Malpractice Liability Insurance is expired. Digital Sealing of clinical records is suspended until coverage is updated.");
          return;
      }

      toast.info("Connecting to Trusted Time Authority...");
      const { timestamp, isVerified } = await getTrustedTime();
      if (!isVerified) { 
          setPendingSealEntry(entry); setPendingSealTimestamp(timestamp); setShowWitnessModal(true); return;
      }
      executeSeal(entry, timestamp, true);
  };

  const executeSeal = (entry: DentalChartEntry, timestamp: string, isVerified: boolean, witness?: User) => {
      // --- FORENSIC STERILIZATION LINK (Malpractice Defense) ---
      // Inject sterilization ID and status into the hash payload
      const contentToHash = `${entry.id}|${entry.notes}|${entry.author}|${timestamp}|${entry.sterilizationCycleId || 'NONE'}|${(entry.imageHashes || []).join(',')}|${isVerified}${witness ? `|${witness.id}` : ''}`;
      const hash = CryptoJS.SHA256(contentToHash).toString();
      const updatedEntry: DentalChartEntry = { ...entry, sealedHash: hash, sealedAt: timestamp, isLocked: true, isVerifiedTime: isVerified, witnessId: witness?.id, witnessName: witness?.name };
      onUpdateEntry(updatedEntry);
      if (logAction) logAction('SEAL_RECORD', 'ClinicalNote', entry.id, `Digitally Sealed note. Hash: ${hash.substring(0, 8)}... Sterilization Link: ${entry.sterilizationCycleId || 'N/A'}`);
      toast.success(witness ? "Note sealed via Witness Protocol." : "Note digitally sealed.");
      setShowWitnessModal(false); setWitnessPin(''); setPendingSealEntry(null);
  };

  const handleWitnessVerify = () => {
      if (witnessPin === '1234' && pendingSealEntry) {
          const witness = STAFF.find(s => s.id !== currentUser.id);
          if (witness) executeSeal(pendingSealEntry, pendingSealTimestamp, false, witness);
          else toast.error("No eligible witness found.");
      } else toast.error("Invalid Witness Credentials.");
  };

  // Fix: Added the missing handleEdit function definition
  const handleEdit = (entry: DentalChartEntry) => {
      setEditingId(entry.id);
      setToothNum(entry.toothNumber?.toString() || '');
      setSelectedProcedure(entry.procedure || '');
      setSubjective(entry.subjective || '');
      setObjective(entry.objective || '');
      setAssessment(entry.assessment || '');
      setPlan(entry.plan || '');
      setCharge(entry.price?.toString() || '');
      setSelectedBatchId(entry.materialBatchId || '');
      setSelectedCycleId(entry.sterilizationCycleId || '');
      setCapturedPhotos(entry.imageHashes || []);
      
      // Attempt to extract clinical pearl from notes
      const pearlMatch = entry.notes?.match(/PEARL:\s*(.*?)(\[Batch:|$)/);
      if (pearlMatch && pearlMatch[1]) {
          setClinicalPearl(pearlMatch[1].trim());
      } else {
          setClinicalPearl('');
      }
      
      if (isLocked(entry)) {
          toast.info("Record is locked. This action will create a cross-referenced amendment.");
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjective && !objective && !assessment && !plan) return;
    if (!isOriginalNarrative) { toast.error("FORENSIC BLOCK: Please edit the macro text."); return; }
    if (!pearlIsValid) { toast.error("FORENSIC GUARD: unique 'Clinical Pearl' required."); return; }
    
    // --- STALE STOCK BLOCK (Product Liability) ---
    if (selectedBatchId) {
        const batchItem = inventory.find(i => i.id === selectedBatchId);
        if (batchItem?.expiryDate && new Date(batchItem.expiryDate) < new Date()) {
            toast.error("STALE STOCK BLOCK: The selected material batch has expired. Usage is prohibited under professional safety protocols.");
            return;
        }
    }

    if (isTraceabilityRequired && !selectedBatchId) { toast.error("Batch ID required."); return; }

    const batchSuffix = selectedBatchId ? ` [Batch: ${selectedBatchId}]` : '';
    const sterilizationSuffix = selectedCycleId ? ` [Autoclave Cycle: ${selectedCycleId}]` : '';
    const combinedNotes = `S: ${subjective}\nO: ${objective}\nA: ${assessment}\nP: ${plan}\nPEARL: ${clinicalPearl}${batchSuffix}${sterilizationSuffix}`;

    if (editingId) {
        const originalEntry = entries.find(e => e.id === editingId);
        if (originalEntry) {
            if (isLocked(originalEntry)) {
                const amendment: DentalChartEntry = { ...originalEntry, id: `dc_amend_${Date.now()}`, originalNoteId: originalEntry.id, notes: `[AMENDMENT]\n${combinedNotes}`, subjective, objective, assessment, plan, date: new Date().toISOString().split('T')[0], sealedHash: undefined, sealedAt: undefined, isLocked: false, imageHashes: capturedPhotos, sterilizationCycleId: selectedCycleId || originalEntry.sterilizationCycleId };
                onAddEntry(amendment);
                toast.success("Amendment logged.");
            } else {
                onUpdateEntry({ ...originalEntry, notes: combinedNotes, subjective, objective, assessment, plan, materialBatchId: selectedBatchId || undefined, sterilizationCycleId: selectedCycleId || undefined, imageHashes: capturedPhotos });
                toast.success("Note updated.");
            }
            setEditingId(null);
        }
    } else {
        const newEntry: DentalChartEntry = { 
            id: `dc_${Date.now()}`, toothNumber: (toothNum ? parseInt(toothNum) : 0), procedure: selectedProcedure || 'Clinical Note', status: 'Completed' as TreatmentStatus, notes: combinedNotes, subjective, objective, assessment, plan, price: charge ? parseFloat(charge) : 0, date: new Date().toISOString().split('T')[0], author: currentUser.name, materialBatchId: selectedBatchId || undefined, sterilizationCycleId: selectedCycleId || undefined, imageHashes: capturedPhotos 
        };
        onAddEntry(newEntry);
        toast.success(`Note saved.`);
    }
    setSubjective(''); setObjective(''); setAssessment(''); setPlan(''); setToothNum(''); setSelectedProcedure(''); setCharge(''); setSelectedBatchId(''); setSelectedCycleId(''); setCapturedPhotos([]); setClinicalPearl('');
    macroSnapshotRef.current = '';
  };

  const SoapField = ({ label, value, onChange, field, placeholder, disabled, watermark }: { label: string, value: string, onChange: (v: string) => void, field: 's'|'o'|'a'|'p', placeholder: string, disabled?: boolean, watermark?: string }) => (
      <div className="relative group/field">
          <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</label>
              <button type="button" onClick={() => toggleRecording(field)} className={`p-1.5 rounded-lg transition-all ${isRecording === field ? 'bg-red-50 text-white animate-pulse' : 'text-slate-300 hover:text-teal-600 hover:bg-teal-50 opacity-0 group-hover/field:opacity-100'}`}>{isRecording === field ? <MicOff size={12}/> : <Mic size={12}/>}</button>
          </div>
          <div className="relative">
              <textarea className={`w-full p-3 border rounded-xl text-xs h-20 bg-white focus:ring-2 transition-all outline-none ${isRecording === field ? 'border-red-400 ring-red-500/10 shadow-inner' : 'border-slate-200 focus:ring-teal-500/10 focus:border-teal-500 shadow-sm'} ${disabled ? 'bg-slate-50 cursor-not-allowed border-slate-100 opacity-60' : ''}`} value={value} onChange={e => onChange(e.target.value)} placeholder={disabled ? '' : placeholder} disabled={disabled} />
              {disabled && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="flex flex-col items-center gap-1"><Lock size={16} className="text-slate-300"/><span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{watermark || 'LOCKED'}</span></div></div>}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {!readOnly && (
          <div className={`border-b border-slate-200 p-6 ${editingId ? 'bg-amber-50/50' : 'bg-slate-50/50'} overflow-y-auto max-h-[80%]`}>
             <div className="flex justify-between items-center mb-4">
                 <h4 className="font-bold text-slate-700 flex items-center gap-2">{editingId ? <RotateCcw size={18}/> : <Plus size={18}/>} {editingId ? 'Amend Clinical Record' : 'SOAP Documentation'}</h4>
                 <div className="flex gap-2">
                    <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                        {QUICK_FILLS.map(q => <button key={q.label} type="button" onClick={() => applyQuickFill(q)} className="px-2 py-1 bg-white text-[9px] font-black uppercase rounded border border-slate-200 hover:border-teal-500 transition-all">{q.label}</button>)}
                    </div>
                    <input type="file" ref={photoInputRef} accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />
                    <button type="button" onClick={() => photoInputRef.current?.click()} className="px-3 py-1.5 bg-lilac-100 text-lilac-700 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 hover:bg-lilac-200 transition-all shadow-sm">
                        <Camera size={14}/> {capturedPhotos.length > 0 ? `${capturedPhotos.length} Photos` : 'Add Evidence Photo'}
                    </button>
                    {editingId && <button onClick={() => setEditingId(null)} className="text-xs font-bold text-amber-700 hover:underline">Cancel</button>}
                 </div>
             </div>
             
             <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                     <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tooth #</label><input type="number" className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none shadow-sm" value={toothNum} onChange={e => setToothNum(e.target.value)} disabled={!!editingId}/></div>
                     <div className="md:col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Clinical Procedure</label><select value={selectedProcedure} onChange={(e) => setSelectedProcedure(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white font-bold shadow-sm" disabled={!!editingId}><option value="">- Select -</option>{procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
                     <div><label className={`text-[10px] font-black uppercase ml-1 flex items-center gap-1 ${isTraceabilityRequired ? 'text-red-600' : 'text-slate-400'}`}>Material Batch {isTraceabilityRequired && '*'}</label><select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} className={`w-full p-2.5 rounded-xl border-2 text-xs outline-none bg-white font-medium shadow-sm transition-all ${isTraceabilityRequired && !selectedBatchId ? 'border-red-400 animate-pulse' : 'border-slate-200'}`}><option value="">- No Supply Used -</option>{inventory.filter(i => !i.expiryDate || new Date(i.expiryDate) > new Date()).map(item => (<option key={item.id} value={item.id}>{item.name} (ID: {item.id})</option>))}</select></div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <SoapField label="Subjective" value={subjective} onChange={setSubjective} field="s" placeholder="Symptoms reported..." />
                     <SoapField label="Objective" value={objective} onChange={setObjective} field="o" placeholder="Clinical findings..." />
                     <SoapField label="Assessment" value={assessment} onChange={setAssessment} field="a" placeholder="Diagnosis..." disabled={!isDentist} watermark="DENTIST ONLY" />
                     <SoapField label="Plan" value={plan} onChange={setPlan} field="p" placeholder="Treatment performed..." disabled={!isDentist} watermark="DENTIST ONLY" />
                 </div>

                 {isSurgicalProcedure && (
                     <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-100 shadow-sm animate-in slide-in-from-left-2">
                        <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest flex items-center gap-2 mb-2"><Shield size={14}/> Forensic Autoclave Verification *</label>
                        <select value={selectedCycleId} onChange={e => setSelectedCycleId(e.target.value)} className="w-full p-2.5 rounded-xl border border-blue-200 bg-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20">
                            <option value="">- Select Sterilization Cycle -</option>
                            <option value="CYCLE_2024_001">Cycle 2024-001 (Passed)</option>
                            <option value="CYCLE_2024_002">Cycle 2024-002 (Passed)</option>
                        </select>
                        <p className="text-[9px] text-blue-600 mt-2 italic font-bold">Autoclave metadata is forensically injected into the record hash for surgical defense.</p>
                     </div>
                 )}

                 <div className={`p-4 rounded-2xl animate-in slide-in-from-bottom-2 transition-colors ${pearlIsValid && isOriginalNarrative ? 'bg-teal-50 border border-teal-200' : 'bg-red-50 border border-red-200'}`}>
                    <label className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-2 ${pearlIsValid && isOriginalNarrative ? 'text-teal-800' : 'text-red-700'}`}><Sparkles size={14}/> Clinical Pearl (Required Personal Detail) *</label>
                    <input 
                        type="text" 
                        value={clinicalPearl}
                        onChange={e => setClinicalPearl(e.target.value)}
                        placeholder="Something unique about this session (Min 20 chars)..."
                        className={`w-full p-3 rounded-xl border-2 text-sm outline-none transition-all ${pearlIsValid ? 'border-teal-500 bg-white' : 'border-red-300 bg-white'}`}
                    />
                 </div>

                 <button type="submit" disabled={!pearlIsValid || !isOriginalNarrative || (isTraceabilityRequired && !selectedBatchId) || (isSurgicalProcedure && !selectedCycleId)} className="w-full py-4 rounded-xl font-black text-[11px] text-white flex items-center justify-center gap-3 shadow-lg bg-teal-600 hover:bg-teal-700 uppercase tracking-widest disabled:opacity-50">
                     <ShieldCheck size={20} /> Commit to Clinical History
                 </button>
             </form>
          </div>
      )}

      <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 sticky top-0 z-10 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><tr className="divide-x divide-slate-200"><th className="p-4 border-b w-24">Date</th><th className="p-4 border-b w-12 text-center">T#</th><th className="p-4 border-b w-1/4">Procedure</th><th className="p-4 border-b">Clinical Narrative & Evidence</th><th className="p-4 border-b w-24 text-right">Status</th></tr></thead>
              <tbody className="text-sm divide-y divide-slate-100">
                  {[...entries].sort((a,b) => new Date(b.date||'').getTime() - new Date(a.date||'').getTime()).map((entry, idx) => {
                      const locked = isLocked(entry);
                      return (
                      <tr key={idx} className={`${entry.isVoid ? 'bg-slate-100 opacity-50 grayscale' : 'bg-white'} hover:bg-teal-50/20 transition-colors group relative`}>
                          <td className="p-4 font-mono text-[10px] text-slate-500">{formatDate(entry.date)}</td>
                          <td className="p-4 text-center font-bold text-slate-700"><span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-xs">#{entry.toothNumber || '-'}</span></td>
                          <td className="p-4 font-bold text-slate-800">{entry.procedure}</td>
                          <td className="p-4 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed relative">
                              <div className="bg-white/50 p-2 rounded-lg space-y-3">
                                  <div className={entry.isVoid ? 'line-through text-slate-400' : ''}>{entry.notes}</div>
                                  {entry.imageHashes && entry.imageHashes.length > 0 && (
                                      <div className="flex gap-2 overflow-x-auto pb-2">
                                          {entry.imageHashes.map((img, i) => (
                                              <img key={i} src={img} className="h-16 w-16 object-cover rounded-lg border border-slate-200 shadow-sm hover:scale-110 transition-transform cursor-pointer" onClick={() => window.open(img, '_blank')} />
                                          ))}
                                      </div>
                                  )}
                                  {entry.sealedHash && (
                                      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                          <div className="flex items-center justify-between">
                                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Shield size={10} className="text-teal-600"/> Cryptographic Integrity Seal</span>
                                              {entry.isVerifiedTime ? <span className="text-[8px] font-black text-teal-600 bg-teal-50 px-1 rounded border border-teal-100">TRUSTED TIME</span> : <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1 rounded border border-amber-100">LOCAL TIME</span>}
                                          </div>
                                          <div className="font-mono text-[8px] text-slate-400 truncate break-all">{entry.sealedHash}</div>
                                          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                                              <span className="text-[8px] font-bold text-slate-400">Author: {entry.author}</span>
                                              {entry.witnessName && <span className="text-[8px] font-bold text-teal-600">Witness: {entry.witnessName}</span>}
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </td>
                          <td className="p-4 text-right">
                              <div className="flex flex-col items-end gap-2">
                                  {entry.sealedHash ? (
                                      <div className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-[10px] font-black border border-teal-200 uppercase flex items-center gap-1 shadow-sm"><ShieldCheck size={12}/> Sealed</div>
                                  ) : (
                                      <div className="flex gap-2">
                                          <button onClick={() => handleEdit(entry)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all" title="Edit/Amend Note"><Edit3 size={16}/></button>
                                          {!readOnly && isDentist && (
                                              <button onClick={() => handleSeal(entry)} className="bg-lilac-600 hover:bg-lilac-700 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-lg shadow-lilac-600/20 transition-all flex items-center gap-1 active:scale-95"><Lock size={12}/> Seal Now</button>
                                          )}
                                      </div>
                                  )}
                                  {locked && !entry.sealedHash && <span className="text-[8px] font-bold text-slate-400 uppercase italic">Timed-out auto lock</span>}
                              </div>
                          </td>
                      </tr>
                  )})}
                  {entries.length === 0 && (
                      <tr><td colSpan={5} className="p-20 text-center text-slate-300 italic">No clinical history for this patient.</td></tr>
                  )}
              </tbody>
          </table>
      </div>

      {showWitnessModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 border-4 border-teal-50">
                  <div className="flex items-center gap-3 text-teal-700 mb-6">
                      <ShieldCheck size={32}/>
                      <div><h3 className="text-xl font-black uppercase tracking-tighter">Temporal Witness Gate</h3><p className="text-[10px] font-bold uppercase text-teal-600">Trusted Time Sync Unavailable</p></div>
                  </div>
                  <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">External time verification failed. PDA clinical protocols require an independent staff witness to certify the local timestamp for this record.</p>
                  <div className="bg-teal-50 p-6 rounded-3xl mb-8">
                      <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-1"><Key size={12}/> Witness Staff PIN *</label>
                      <input type="password" maxLength={4} value={witnessPin} onChange={e => setWitnessPin(e.target.value)} placeholder="••••" className="w-full p-4 text-center text-3xl tracking-[1em] border-2 border-teal-200 rounded-2xl focus:border-teal-500 outline-none font-black bg-white" />
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => {setShowWitnessModal(false); setWitnessPin('');}} className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl">Cancel</button>
                      <button onClick={handleWitnessVerify} disabled={witnessPin.length < 4} className="flex-[2] py-4 bg-teal-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-teal-600/20 disabled:opacity-40">Authorize Temporal Witness</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Odontonotes;
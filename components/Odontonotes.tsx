
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DentalChartEntry, ProcedureItem, StockItem, User, UserRole, FieldSettings, TreatmentStatus } from '../types';
import { Plus, Edit3, ShieldCheck, Lock, Clock, GitCommit, ArrowDown, AlertCircle, FileText, Zap, Box, RotateCcw, CheckCircle2, PackageCheck, Mic, MicOff, Volume2, Sparkles, DollarSign, ShieldAlert, Key, Camera, Image as ImageIcon, Check, MousePointer2, UserCheck, X, EyeOff } from 'lucide-react';
import { formatDate, STAFF } from '../constants';
import { useToast } from './ToastSystem';
import CryptoJS from 'crypto-js';
import { getTrustedTime } from '../services/timeService';

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

const SMART_FINDINGS = {
  subjective: ['Sharp Pain', 'Dull Ache', 'Sensitivity (Cold)', 'Food Impaction', 'Swelling', 'Lost Filling'],
  objective: ['Active Decay', 'Fracture Line', 'Gingival Recession', 'Probe Catching', 'Mobility I-III', 'Interproximal Void'],
  anesthesia: ['Lido 2% Epi 1:100k', 'Septo 4% Epi 1:100k', 'Topical Only', 'Mepi 3% Plain'],
  findings: ['Class I', 'Class II', 'Occlusal Decay', 'Deep Caries', 'Recurrent Caries'],
  outcome: ['Hemostasis achieved', 'Bite checked', 'Polish completed', 'OHI given', 'Sutures placed']
};

interface ClinicalMacro {
    label: string;
    description: string;
    s?: string;
    o?: string;
    a?: string;
    p?: string;
}

const QUICK_FILLS: ClinicalMacro[] = [
    {
        label: 'Routine Prophy',
        description: 'Standard Cleaning',
        s: 'Routine cleaning. No complaints.',
        o: 'Mild plaque at cervical thirds. No periodontal pockets found.',
        a: 'K05.10 Gingivitis',
        p: 'Manual scaling, prophy paste polish. Flouride varnish 5%.'
    },
    {
        label: 'Class I Resto',
        description: 'Simple Restoration',
        s: 'Sensitivity to cold on indicated tooth.',
        o: 'Deep pit caries, probe catching. No pulpal involvement.',
        a: 'K02.1 Caries of dentine',
        p: 'Local infiltration 2% lido. Excavated caries. A2 composite restoration.'
    }
];

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
  const [isRecording, setIsRecording] = useState<string | null>(null); 
  const [clinicalPearl, setClinicalPearl] = useState('');
  
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // --- TEMPORAL WITNESS STATE ---
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

  const pearlIsValid = useMemo(() => clinicalPearl.trim().length >= 20, [clinicalPearl]);

  // --- RULE 14 PROFESSIONALISM GUARDRAIL ---
  const professionalismWarning = useMemo(() => {
      const narrative = (subjective + objective + assessment + plan + clinicalPearl).toLowerCase();
      const redFlags = ['poor job', 'bad work', 'wrong treatment', 'mistake by', 'previous dentist', 'incompetent', 'lawsuit'];
      return redFlags.some(flag => narrative.includes(flag));
  }, [subjective, objective, assessment, plan, clinicalPearl]);

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

  const toggleSmartFinding = (category: keyof typeof SMART_FINDINGS, finding: string) => {
      if (category === 'subjective') setSubjective(prev => prev.includes(finding) ? prev.replace(finding, '').trim() : `${prev} ${finding}`.trim());
      if (category === 'objective') setObjective(prev => prev.includes(finding) ? prev.replace(finding, '').trim() : `${prev} ${finding}`.trim());
      if (category === 'findings') setAssessment(prev => prev.includes(finding) ? prev.replace(finding, '').trim() : `${prev} ${finding}`.trim());
      if (category === 'anesthesia' || category === 'outcome') setPlan(prev => prev.includes(finding) ? prev.replace(finding, '').trim() : `${prev} ${finding}`.trim());
  };

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
      toast.info("Connecting to Trusted Time Authority...");
      const { timestamp, isVerified } = await getTrustedTime();
      if (!isVerified) { 
          setPendingSealEntry(entry); setPendingSealTimestamp(timestamp); setShowWitnessModal(true); return;
      }
      executeSeal(entry, timestamp, true);
  };

  const executeSeal = (entry: DentalChartEntry, timestamp: string, isVerified: boolean, witness?: User) => {
      const contentToHash = `${entry.id}|${entry.notes}|${entry.author}|${timestamp}|${(entry.imageHashes || []).join(',')}|${isVerified}${witness ? `|${witness.id}` : ''}`;
      const hash = CryptoJS.SHA256(contentToHash).toString();
      const updatedEntry: DentalChartEntry = { ...entry, sealedHash: hash, sealedAt: timestamp, isLocked: true, isVerifiedTime: isVerified, witnessId: witness?.id, witnessName: witness?.name };
      onUpdateEntry(updatedEntry);
      if (logAction) logAction('SEAL_RECORD', 'ClinicalNote', entry.id, `Digitally Sealed note. Hash: ${hash.substring(0, 8)}...`);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjective && !objective && !assessment && !plan) return;
    if (!isOriginalNarrative) { toast.error("FORENSIC BLOCK: Please edit the macro text."); return; }
    if (!pearlIsValid) { toast.error("FORENSIC GUARD: unique 'Clinical Pearl' required."); return; }
    if (isTraceabilityRequired && !selectedBatchId) { toast.error("Batch ID required."); return; }

    const batchSuffix = selectedBatchId ? ` [Batch: ${selectedBatchId}]` : '';
    const combinedNotes = `S: ${subjective}\nO: ${objective}\nA: ${assessment}\nP: ${plan}\nPEARL: ${clinicalPearl}${batchSuffix}`;

    if (editingId) {
        const originalEntry = entries.find(e => e.id === editingId);
        if (originalEntry) {
            if (isLocked(originalEntry)) {
                const amendment: DentalChartEntry = { ...originalEntry, id: `dc_amend_${Date.now()}`, originalNoteId: originalEntry.id, notes: `[AMENDMENT]\n${combinedNotes}`, subjective, objective, assessment, plan, date: new Date().toISOString().split('T')[0], sealedHash: undefined, sealedAt: undefined, isLocked: false, imageHashes: capturedPhotos };
                onAddEntry(amendment);
                toast.success("Amendment logged.");
            } else {
                onUpdateEntry({ ...originalEntry, notes: combinedNotes, subjective, objective, assessment, plan, materialBatchId: selectedBatchId || undefined, imageHashes: capturedPhotos });
                toast.success("Note updated.");
            }
            setEditingId(null);
        }
    } else {
        const newEntry: DentalChartEntry = { 
            id: `dc_${Date.now()}`, toothNumber: (toothNum ? parseInt(toothNum) : 0), procedure: selectedProcedure || 'Clinical Note', status: 'Completed' as TreatmentStatus, notes: combinedNotes, subjective, objective, assessment, plan, price: charge ? parseFloat(charge) : 0, date: new Date().toISOString().split('T')[0], author: currentUser.name, materialBatchId: selectedBatchId || undefined, imageHashes: capturedPhotos 
        };
        onAddEntry(newEntry);
        toast.success(`Note saved.`);
    }
    setSubjective(''); setObjective(''); setAssessment(''); setPlan(''); setToothNum(''); setSelectedProcedure(''); setCharge(''); setSelectedBatchId(''); setCapturedPhotos([]); setClinicalPearl('');
    macroSnapshotRef.current = '';
  };

  const handleEdit = (entry: DentalChartEntry) => {
      if (isLocked(entry)) toast.warning("Note is locked. Amendment will be linked.");
      setEditingId(entry.id);
      setSubjective(entry.subjective || ''); setObjective(entry.objective || ''); setAssessment(entry.assessment || ''); setPlan(entry.plan || ''); setToothNum(entry.toothNumber?.toString() || ''); setSelectedProcedure(entry.procedure || '');
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
    <div className="flex flex-col h-[1000px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
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
             
             {/* PROFESSIONALISM GUARDRAIL WARNING */}
             {professionalismWarning && (
                 <div className="bg-red-600 text-white p-4 rounded-2xl mb-6 shadow-xl animate-in shake duration-500 flex items-start gap-4">
                    <ShieldAlert size={28} className="shrink-0 animate-pulse" />
                    <div>
                        <h5 className="font-black uppercase tracking-widest text-[10px]">Rule 14 Admissibility Guardrail</h5>
                        <p className="text-xs font-bold mt-1 leading-tight">Detected potential defamatory sentiment or peer criticism. PDA Rule 14 prohibits disparaging colleagues in records. These notes will be highly discoverable in civil litigation.</p>
                    </div>
                 </div>
             )}

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

                 <button type="submit" disabled={!pearlIsValid || !isOriginalNarrative || (isTraceabilityRequired && !selectedBatchId)} className="w-full py-4 rounded-xl font-black text-[11px] text-white flex items-center justify-center gap-3 shadow-lg bg-teal-600 hover:bg-teal-700 uppercase tracking-widest disabled:opacity-50">
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
                              {entry.isVoid && (
                                  <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                                      <div className="bg-red-600/10 border-2 border-red-600 border-dashed text-red-600 font-black text-4xl uppercase -rotate-12 px-10 py-5 opacity-40">REDACTED</div>
                                  </div>
                              )}
                              <div className="bg-white/50 p-2 rounded-lg space-y-3">
                                  <div className={entry.isVoid ? 'line-through text-slate-400' : ''}>{entry.notes}</div>
                                  {entry.imageHashes && entry.imageHashes.length > 0 && (
                                      <div className="flex gap-2 overflow-x-auto p-1">
                                          {entry.imageHashes.map((img, i) => (
                                              <div key={i} className="relative w-16 h-16 rounded-lg border border-slate-200 bg-black overflow-hidden"><img src={img} className="w-full h-full object-cover opacity-60" /></div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                              <div className="text-[9px] text-slate-400 mt-2 uppercase font-bold flex justify-between items-center px-1">
                                  <span className="flex items-center gap-1">
                                      {entry.sealedHash ? <div className="flex items-center gap-1 text-lilac-600"><Key size={10}/> DIGITALLY SEALED</div> : <ShieldCheck size={10} className="text-teal-500"/>} 
                                      Verified by Dr. {entry.author}
                                  </span>
                                  {!readOnly && !entry.isVoid && (
                                      <div className="flex gap-2">
                                          {!entry.sealedHash && <button onClick={() => handleSeal(entry)} className="opacity-0 group-hover:opacity-100 text-lilac-600 hover:bg-lilac-50 px-2 py-0.5 rounded transition-all font-bold border border-lilac-100">SIGN & SEAL</button>}
                                          <button onClick={() => handleEdit(entry)} className="opacity-0 group-hover:opacity-100 text-teal-600 hover:bg-teal-100 px-2 py-0.5 rounded transition-all font-bold">AMEND</button>
                                      </div>
                                  )}
                                  {entry.isVoid && <span className="text-red-600 font-black italic">Rule 14: Record Preserved as Redacted</span>}
                              </div>
                          </td>
                          <td className="p-4 text-right">{locked && <Lock size={14} className="text-slate-300 ml-auto" />}</td>
                      </tr>
                  )})}
              </tbody>
          </table>
      </div>

      {showWitnessModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border-4 border-amber-100 overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="bg-amber-600 p-8 text-white flex flex-col items-center text-center">
                      <ShieldAlert size={48} className="animate-pulse mb-4"/>
                      <h3 className="text-2xl font-black uppercase tracking-tighter">Temporal Admissibility Guard</h3>
                      <p className="text-xs font-bold text-amber-100 uppercase tracking-widest mt-1">Downtime Witness Protocol Required</p>
                  </div>
                  <div className="p-8 space-y-6">
                      <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200"><p className="text-xs text-amber-900 font-bold leading-relaxed">System clock unverified. A secondary human witness must sign to ensure electronic record integrity (Rules on Electronic Evidence).</p></div>
                      <div className="text-center">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Witness Verification (PIN)</label>
                          <input type="password" maxLength={4} autoFocus value={witnessPin} onChange={e => setWitnessPin(e.target.value)} className="w-full text-center text-5xl tracking-[1em] p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-amber-500 font-black text-slate-800" />
                      </div>
                      <div className="flex gap-3">
                          <button onClick={() => { setShowWitnessModal(false); setWitnessPin(''); }} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-2xl">Cancel</button>
                          <button onClick={handleWitnessVerify} disabled={witnessPin.length < 4} className={`flex-[2] py-4 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl transition-all ${witnessPin.length === 4 ? 'bg-amber-600 shadow-amber-600/20' : 'bg-slate-300 opacity-50 cursor-not-allowed'}`}>Verify & Co-Sign</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Odontonotes;

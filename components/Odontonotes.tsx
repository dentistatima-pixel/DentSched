
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DentalChartEntry, ProcedureItem, StockItem } from '../types';
import { Plus, Edit3, ShieldCheck, Lock, Clock, GitCommit, ArrowDown, AlertCircle, FileText, Zap, Box, RotateCcw, CheckCircle2, PackageCheck, Mic, MicOff, Volume2, Sparkles, DollarSign, ShieldAlert, Key } from 'lucide-react';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';
import CryptoJS from 'crypto-js';
import { getTrustedTime } from '../services/timeService';

interface OdontonotesProps {
  entries: DentalChartEntry[];
  onAddEntry: (entry: DentalChartEntry) => void;
  onUpdateEntry: (entry: DentalChartEntry) => void;
  currentUser: string;
  readOnly?: boolean;
  procedures: ProcedureItem[];
  inventory?: StockItem[]; 
  prefill?: Partial<DentalChartEntry> | null;
  onClearPrefill?: () => void;
  logAction?: (action: any, entity: any, id: string, details: string) => void;
}

interface ClinicalMacro {
    label: string;
    description: string;
    s?: string;
    o?: string;
    a?: string;
    p?: string;
}

const CLINICAL_MACROS: ClinicalMacro[] = [
    { 
        label: 'OP Routine', 
        description: 'Standard Cleaning',
        s: 'Patient presents for routine oral prophylaxis. No sensitivity reported.', 
        o: 'Generalized light plaque and supra-gingival calculus.', 
        a: 'Generalized Gingivitis - Plaque induced.', 
        p: 'Performed scaling and polishing. OHI given. Fluoride applied.' 
    },
    { 
        label: 'Resto Comp', 
        description: 'Standard Filling',
        s: 'Patient reports mild food impaction in the area.', 
        o: 'Carious lesion involving enamel and dentin.', 
        a: 'Dental Caries.', 
        p: 'Administered 1 carpule LA. Excavated caries. Etched, bonded, and restored with composite resin. High points checked.' 
    },
    { 
        label: 'Ext Simple', 
        description: 'Simple Extraction',
        s: 'Patient requests extraction due to severe pain and non-restorability.', 
        o: 'Grossly carious tooth with associated apical periodontitis.', 
        a: 'Non-restorable tooth.', 
        p: 'Administered LA. Luxated and delivered tooth. Hemostasis achieved. Post-op instructions given.' 
    },
    {
        label: 'LA 1:100k',
        description: 'Inject Tag',
        p: 'Administered 1 carpule of Lidocaine 2% with Epinephrine 1:100k via infiltration.'
    }
];

const QUICK_FILLS: ClinicalMacro[] = [
    {
        label: 'Standard Prophy',
        description: 'Full SOAP for Cleaning',
        s: 'Routine cleaning. No complaints.',
        o: 'Mild plaque at cervical thirds. No periodontal pockets found.',
        a: 'K05.10 Gingivitis',
        p: 'Manual scaling, prophy paste polish. Flouride varnish 5%.'
    },
    {
        label: 'Simple Restoration',
        description: 'Full SOAP for Class I',
        s: 'Sensitivity to cold on indicated tooth.',
        o: 'Deep pit caries, probe catching. No pulpal involvement.',
        a: 'K02.1 Caries of dentine',
        p: 'Local infiltration 2% lido. Excavated caries. A2 composite restoration.'
    }
];

const Odontonotes: React.FC<OdontonotesProps> = ({ entries, onAddEntry, onUpdateEntry, currentUser, readOnly, procedures, inventory = [], prefill, onClearPrefill, logAction }) => {
  const toast = useToast();
  
  const [toothNum, setToothNum] = useState<string>('');
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [charge, setCharge] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [deductSupplies, setDeductSupplies] = useState(true);
  const [isRecording, setIsRecording] = useState<string | null>(null); 
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const activeProcedureDef = useMemo(() => {
      return procedures.find(p => p.name === selectedProcedure);
  }, [selectedProcedure, procedures]);

  const safeInventory = useMemo(() => {
      const now = new Date();
      return inventory.filter(item => {
          if (!item.expiryDate) return true;
          return new Date(item.expiryDate) >= now;
      });
  }, [inventory]);

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

  const applyMacro = (macro: ClinicalMacro) => {
      if (macro.s) setSubjective(prev => prev ? `${prev} ${macro.s}` : macro.s!);
      if (macro.o) setObjective(prev => prev ? `${prev} ${macro.o}` : macro.o!);
      if (macro.a) setAssessment(prev => prev ? `${prev} ${macro.a}` : macro.a!);
      if (macro.p) setPlan(prev => prev ? `${prev} ${macro.p}` : macro.p!);
      toast.success(`Macro "${macro.label}" applied.`);
  };

  const applyQuickFill = (fill: ClinicalMacro) => {
      setSubjective(fill.s || '');
      setObjective(fill.o || '');
      setAssessment(fill.a || '');
      setPlan(fill.p || '');
      toast.success(`Quick-Fill "${fill.label}" populated.`);
  };

  const toggleRecording = (field: 's'|'o'|'a'|'p') => {
      if (isRecording === field) {
          recognitionRef.current?.stop();
          setIsRecording(null);
          return;
      }
      if (isRecording) recognitionRef.current?.stop();
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          toast.error("Speech recognition not supported.");
          return;
      }
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
      return diff > (24 * 60 * 60 * 1000); // 24 hour lock
  };

  const handleSeal = async (entry: DentalChartEntry) => {
      if (entry.sealedHash) return;
      const { timestamp, isVerified } = await getTrustedTime();
      const contentToHash = `${entry.id}|${entry.notes}|${entry.author}|${timestamp}`;
      const hash = CryptoJS.SHA256(contentToHash).toString();
      
      onUpdateEntry({
          ...entry,
          sealedHash: hash,
          sealedAt: timestamp,
          isLocked: true
      });

      if (logAction) {
          logAction('SEAL_RECORD', 'ClinicalNote', entry.id, `Digitally Sealed & Signed note for non-repudiation. Hash: ${hash.substring(0, 8)}...`);
      }
      toast.success("Note digitally sealed and locked.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjective && !objective && !assessment && !plan) return;
    const combinedNotes = `S: ${subjective}\nO: ${objective}\nA: ${assessment}\nP: ${plan}`;

    if (editingId) {
        const originalEntry = entries.find(e => e.id === editingId);
        if (originalEntry) {
            if (isLocked(originalEntry)) {
                // Betterment: Create linked record for amendments to locked notes
                const amendment: DentalChartEntry = {
                    ...originalEntry,
                    id: `dc_amend_${Date.now()}`,
                    originalNoteId: originalEntry.id,
                    notes: `[AMENDMENT TO RECORD ${originalEntry.id}]\n${combinedNotes}`,
                    subjective, objective, assessment, plan,
                    date: new Date().toISOString().split('T')[0],
                    sealedHash: undefined, sealedAt: undefined, isLocked: false
                };
                onAddEntry(amendment);
                toast.success("Clinical amendment logged as new linked record.");
                if (logAction) logAction('AMEND_RECORD', 'ClinicalNote', originalEntry.id, `Created linked amendment note: ${amendment.id}`);
            } else {
                onUpdateEntry({ ...originalEntry, notes: combinedNotes, subjective, objective, assessment, plan });
                toast.success("Clinical note updated.");
            }
            setEditingId(null);
        }
    } else {
        const newEntry: DentalChartEntry = { 
            id: `dc_${Date.now()}`, toothNumber: (toothNum ? parseInt(toothNum) : 0), procedure: selectedProcedure || 'Clinical Note', status: 'Completed', notes: combinedNotes, subjective, objective, assessment, plan, price: charge ? parseFloat(charge) : 0, date: new Date().toISOString().split('T')[0], author: currentUser, materialBatchId: selectedBatchId || undefined 
        };
        onAddEntry(newEntry);
        toast.success(`Clinical note saved.`);
    }
    setSubjective(''); setObjective(''); setAssessment(''); setPlan(''); setToothNum(''); setSelectedProcedure(''); setCharge(''); setSelectedBatchId('');
  };

  const handleEdit = (entry: DentalChartEntry) => {
      if (isLocked(entry)) {
          toast.warning("Record is locked for non-repudiation. Amendment will be logged as a new linked entry.");
      }
      setEditingId(entry.id);
      setSubjective(entry.subjective || ''); setObjective(entry.objective || ''); setAssessment(entry.assessment || ''); setPlan(entry.plan || ''); setToothNum(entry.toothNumber?.toString() || ''); setSelectedProcedure(entry.procedure || '');
  };

  const SoapField = ({ label, value, onChange, field, placeholder }: { label: string, value: string, onChange: (v: string) => void, field: 's'|'o'|'a'|'p', placeholder: string }) => (
      <div className="relative group/field">
          <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</label>
              <button type="button" onClick={() => toggleRecording(field)} className={`p-1.5 rounded-lg transition-all ${isRecording === field ? 'bg-red-500 text-white animate-pulse' : 'text-slate-300 hover:text-teal-600 hover:bg-teal-50 opacity-0 group-hover/field:opacity-100'}`}>{isRecording === field ? <MicOff size={12}/> : <Mic size={12}/>}</button>
          </div>
          <textarea className={`w-full p-3 border rounded-xl text-xs h-24 bg-white focus:ring-2 transition-all outline-none ${isRecording === field ? 'border-red-400 ring-red-500/10 shadow-inner' : 'border-slate-200 focus:ring-teal-500/10 focus:border-teal-500 shadow-sm'}`} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      </div>
  );

  return (
    <div className="flex flex-col h-[850px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {!readOnly && (
          <div className={`border-b border-slate-200 p-6 ${editingId ? 'bg-amber-50/50' : 'bg-slate-50/50'}`}>
             <div className="flex justify-between items-center mb-4">
                 <h4 className="font-bold text-slate-700 flex items-center gap-2">{editingId ? <RotateCcw size={18}/> : <Plus size={18}/>} {editingId ? 'Amend Clinical Record' : 'SOAP Documentation'}</h4>
                 {editingId && <button onClick={() => setEditingId(null)} className="text-xs font-bold text-amber-700 hover:underline">Cancel Amendment</button>}
             </div>
             
             <div className="space-y-3 mb-6">
                 <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-100 flex items-center gap-1 shrink-0 uppercase tracking-tighter"><Zap size={12} className="fill-teal-500"/> Quick-Fill:</span>
                    {QUICK_FILLS.map(fill => (
                        <button key={fill.label} type="button" onClick={() => applyQuickFill(fill)} className="text-[10px] font-black px-4 py-1.5 bg-teal-600 text-white rounded-full shadow-md hover:bg-teal-700 transition-all whitespace-nowrap uppercase tracking-widest">{fill.label}</button>
                    ))}
                 </div>
             </div>

             <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tooth #</label>
                        <input type="number" className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none shadow-sm" value={toothNum} onChange={e => setToothNum(e.target.value)} disabled={!!editingId}/>
                     </div>
                     <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Clinical Procedure</label>
                        <select value={selectedProcedure} onChange={(e) => setSelectedProcedure(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white font-bold shadow-sm" disabled={!!editingId}>
                            <option value="">- Select -</option>
                            {procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Material Batch</label>
                        <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white font-medium shadow-sm">
                            <option value="">- No Supply Used -</option>
                            {safeInventory.map(item => (<option key={item.id} value={item.id}>{item.name} {item.expiryDate ? `(Exp: ${formatDate(item.expiryDate)})` : ''}</option>))}
                        </select>
                     </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <SoapField label="Subjective" value={subjective} onChange={setSubjective} field="s" placeholder="Patient reports..." />
                     <SoapField label="Objective" value={objective} onChange={setObjective} field="o" placeholder="Visible symptoms..." />
                     <SoapField label="Assessment" value={assessment} onChange={setAssessment} field="a" placeholder="Diagnosis..." />
                     <SoapField label="Plan" value={plan} onChange={setPlan} field="p" placeholder="Treatment performed..." />
                 </div>

                 <div className="flex gap-2 items-center">
                     <button type="submit" className={`flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.98] ${editingId ? 'bg-amber-600' : 'bg-teal-600 shadow-teal-600/20 hover:bg-teal-700'}`}>
                         {editingId ? <RotateCcw size={20} /> : <ShieldCheck size={20} />} 
                         <span>{editingId ? 'Commit Amendment' : 'Seal & Log Clinical Entry'}</span>
                     </button>
                 </div>
             </form>
          </div>
      )}

      <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 sticky top-0 z-10 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <tr className="divide-x divide-slate-200">
                      <th className="p-4 border-b w-24">Date</th>
                      <th className="p-4 border-b w-12 text-center">T#</th>
                      <th className="p-4 border-b w-1/4">Procedure</th>
                      <th className="p-4 border-b">Clinical Notes (SOAP)</th>
                      <th className="p-4 border-b w-24 text-right">Action</th>
                  </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                  {[...entries].sort((a,b) => new Date(b.date||'').getTime() - new Date(a.date||'').getTime()).map((entry, idx) => {
                      const locked = isLocked(entry);
                      return (
                      <tr key={idx} className={`${entry.isVoid ? 'bg-red-50/30' : 'bg-white'} hover:bg-teal-50/20 transition-colors group relative`}>
                          <td className="p-4 font-mono text-[10px] text-slate-500">{formatDate(entry.date)}</td>
                          <td className="p-4 text-center font-bold text-slate-700"><span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-xs">#{entry.toothNumber || '-'}</span></td>
                          <td className="p-4 font-bold text-slate-800">{entry.procedure}</td>
                          <td className="p-4 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                              <div className="bg-white/50 p-2 rounded-lg relative">
                                  {entry.notes}
                                  {entry.originalNoteId && (
                                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase">
                                          <GitCommit size={10}/> Amendment linked to record ID: {entry.originalNoteId}
                                      </div>
                                  )}
                              </div>
                              <div className="text-[9px] text-slate-400 mt-2 uppercase font-bold flex justify-between items-center px-1">
                                  <span className="flex items-center gap-1">
                                      {entry.sealedHash ? <div className="flex items-center gap-1 text-lilac-600"><Key size={10}/> DIGITALLY SEALED</div> : <ShieldCheck size={10} className="text-teal-500"/>}
                                      Verified by Dr. {entry.author}
                                  </span>
                                  {!readOnly && (
                                      <div className="flex gap-2">
                                          {!entry.sealedHash && <button onClick={() => handleSeal(entry)} className="opacity-0 group-hover:opacity-100 text-lilac-600 hover:bg-lilac-50 px-2 py-0.5 rounded transition-all font-bold border border-lilac-100">SIGN & SEAL</button>}
                                          <button onClick={() => handleEdit(entry)} className="opacity-0 group-hover:opacity-100 text-teal-600 hover:bg-teal-100 px-2 py-0.5 rounded transition-all font-bold">AMEND</button>
                                      </div>
                                  )}
                              </div>
                          </td>
                          <td className="p-4 text-right">
                              {locked && <Lock size={14} className="text-slate-300 ml-auto" title="Note Locked for Non-Repudiation" />}
                          </td>
                      </tr>
                  )})}
              </tbody>
          </table>
      </div>
    </div>
  );
};

export default Odontonotes;

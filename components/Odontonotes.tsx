import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DentalChartEntry, ProcedureItem, StockItem, User, AuditLogEntry } from '../types';
// Added AlertTriangle to lucide-react imports
import { Plus, Edit3, ShieldCheck, Lock, Clock, GitCommit, ArrowDown, AlertCircle, AlertTriangle, FileText, Zap, Box, RotateCcw, CheckCircle2, PackageCheck, Mic, MicOff, Volume2, Sparkles, DollarSign, ShieldAlert, Key, History, ChevronRight, ChevronDown, Award } from 'lucide-react';
import { formatDate, STAFF } from '../constants';
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
  logAction?: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], id: string, details: string) => void;
}

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
  const [isRecording, setIsRecording] = useState<string | null>(null); 
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedLineages, setExpandedLineages] = useState<Set<string>>(new Set());
  const recognitionRef = useRef<any>(null);

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
  }, [prefill, onClearPrefill]);

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
      return diff > (24 * 60 * 60 * 1000); // 24 hour clinical auto-lock
  };

  const handleSeal = async (entry: DentalChartEntry) => {
      if (entry.sealedHash) return;
      const { timestamp, isVerified } = await getTrustedTime();
      
      // Mini-blockchain link: Include previous version hash if it exists
      const prevVersionHash = entry.supersedesId ? entries.find(e => e.id === entry.supersedesId)?.sealedHash || 'NO_PREV' : 'GENESIS';
      const contentToHash = `${entry.id}|${entry.notes}|${entry.author}|${timestamp}|${prevVersionHash}|v${entry.version || 1}`;
      const hash = CryptoJS.SHA256(contentToHash).toString();
      
      onUpdateEntry({
          ...entry,
          sealedHash: hash,
          sealedAt: timestamp,
          isLocked: true,
          isVerifiedTime: isVerified
      });

      if (logAction) {
          logAction('SEAL_RECORD', 'ClinicalNote', entry.id, `Digitally Sealed clinical record (v${entry.version || 1}) with hash chain link.`);
      }
      toast.success("Clinical record digitally sealed.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjective && !objective && !assessment && !plan) return;
    const combinedNotes = `S: ${subjective}\nO: ${objective}\nA: ${assessment}\nP: ${plan}`;

    if (editingId) {
        const originalEntry = entries.find(e => e.id === editingId);
        if (originalEntry) {
            if (isLocked(originalEntry)) {
                // MEDIC-LEGAL VERSIONING: Create linked record, increment version, and supersede original
                const nextVersionNum = (originalEntry.version || 1) + 1;
                const amendment: DentalChartEntry = {
                    ...originalEntry,
                    id: `dc_v${nextVersionNum}_${Date.now()}`,
                    supersedesId: originalEntry.id,
                    version: nextVersionNum,
                    notes: combinedNotes,
                    subjective, objective, assessment, plan,
                    date: new Date().toISOString().split('T')[0],
                    sealedHash: undefined, sealedAt: undefined, isLocked: false,
                    isSuperseded: false
                };
                
                // 1. Mark original as Superseded
                onUpdateEntry({ ...originalEntry, isSuperseded: true });
                
                // 2. Add the new version
                onAddEntry(amendment);
                
                toast.success(`Amendment committed as Version ${nextVersionNum}. Original record archived.`);
                if (logAction) logAction('AMEND_RECORD', 'ClinicalNote', originalEntry.id, `Amended sealed record. New version: ${amendment.id}`);
            } else {
                // Simple update for un-sealed notes
                onUpdateEntry({ ...originalEntry, notes: combinedNotes, subjective, objective, assessment, plan, version: originalEntry.version || 1 });
                toast.success("Clinical note updated.");
            }
            setEditingId(null);
        }
    } else {
        const newEntry: DentalChartEntry = { 
            id: `dc_${Date.now()}`, 
            toothNumber: (toothNum ? parseInt(toothNum) : 0), 
            procedure: selectedProcedure || 'Clinical Note', 
            status: 'Completed', 
            notes: combinedNotes, 
            subjective, objective, assessment, plan, 
            price: charge ? parseFloat(charge) : 0, 
            date: new Date().toISOString().split('T')[0], 
            author: currentUser, 
            materialBatchId: selectedBatchId || undefined,
            version: 1 
        };
        onAddEntry(newEntry);
        toast.success(`Clinical record saved.`);
    }
    setSubjective(''); setObjective(''); setAssessment(''); setPlan(''); setToothNum(''); setSelectedProcedure(''); setCharge(''); setSelectedBatchId('');
  };

  const handleEdit = (entry: DentalChartEntry) => {
      if (isLocked(entry)) {
          toast.warning("Versioning Protocol Active: Changes to this sealed record will create a new timestamped version.");
      }
      setEditingId(entry.id);
      setSubjective(entry.subjective || ''); setObjective(entry.objective || ''); setAssessment(entry.assessment || ''); setPlan(entry.plan || ''); setToothNum(entry.toothNumber?.toString() || ''); setSelectedProcedure(entry.procedure || '');
  };

  const toggleLineage = (entryId: string) => {
      const next = new Set(expandedLineages);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      setExpandedLineages(next);
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

  // Group current and superseded versions
  const sortedAndGrouped = useMemo(() => {
      const currentVersions = entries.filter(e => !e.isSuperseded);
      return [...currentVersions].sort((a,b) => new Date(b.date||'').getTime() - new Date(a.date||'').getTime());
  }, [entries]);

  const getHistoryForLineage = (currentId: string) => {
      const history: DentalChartEntry[] = [];
      let nextId: string | undefined = entries.find(e => e.id === currentId)?.supersedesId;
      while(nextId) {
          const prev = entries.find(e => e.id === nextId);
          if (prev) {
              history.push(prev);
              nextId = prev.supersedesId;
          } else break;
      }
      return history;
  };

  return (
    <div className="flex flex-col h-[850px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {!readOnly && (
          <div className={`border-b border-slate-200 p-6 ${editingId ? 'bg-amber-50/50' : 'bg-slate-50/50'}`}>
             {editingId && entries.find(e => e.id === editingId && isLocked(e)) && (
                 <div className="bg-amber-100 border-2 border-amber-200 p-4 rounded-2xl mb-6 flex gap-4 items-start animate-in slide-in-from-top-4 duration-300">
                     <div className="bg-amber-600 text-white p-2 rounded-xl shrink-0"><AlertTriangle size={24}/></div>
                     <div>
                         <h4 className="font-black text-amber-900 uppercase tracking-tighter text-sm">Authenticated Amendment Protocol</h4>
                         <p className="text-xs text-amber-800 font-medium leading-relaxed mt-1">You are editing a <strong>sealed clinical record</strong>. Saving will not overwrite the original; instead, a new timestamped version (v{(entries.find(e => e.id === editingId)?.version || 1) + 1}) will be generated, and the current record will be archived as "Superseded" for medico-legal history.</p>
                     </div>
                 </div>
             )}

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
                         <span>{editingId && entries.find(e => e.id === editingId && isLocked(e)) ? 'Seal & Supersede Record' : editingId ? 'Commit Amendment' : 'Seal & Log Clinical Entry'}</span>
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
                      <th className="p-4 border-b">Clinical Narrative</th>
                      <th className="p-4 border-b w-24 text-right">Integrity</th>
                  </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                  {sortedAndGrouped.map((entry, idx) => {
                      const locked = isLocked(entry);
                      const clinician = STAFF.find(s => s.name.includes(entry.author || ''));
                      const history = getHistoryForLineage(entry.id);
                      const isExpanded = expandedLineages.has(entry.id);

                      return (
                      <React.Fragment key={entry.id}>
                        <tr className={`${entry.isVoid ? 'bg-red-50/30' : 'bg-white'} hover:bg-teal-50/20 transition-colors group relative`}>
                            <td className="p-4 font-mono text-[10px] text-slate-500">{formatDate(entry.date)}</td>
                            <td className="p-4 text-center font-bold text-slate-700"><span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-xs">#{entry.toothNumber || '-'}</span></td>
                            <td className="p-4 font-bold text-slate-800">
                                {entry.procedure}
                                {entry.version && entry.version > 1 && (
                                    <span className="ml-2 bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border border-teal-100 shadow-sm" title={`Amended from v${entry.version-1}`}>v{entry.version}</span>
                                )}
                            </td>
                            <td className="p-4 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                                <div className="bg-white/50 p-2 rounded-lg relative">
                                    {entry.notes}
                                    {entry.supersedesId && (
                                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase">
                                                <GitCommit size={10}/> Amendment linked to archived record
                                            </div>
                                            <button 
                                                onClick={() => toggleLineage(entry.id)}
                                                className="text-[9px] font-black text-teal-600 uppercase flex items-center gap-1 hover:underline"
                                            >
                                                {isExpanded ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
                                                {isExpanded ? 'Hide History' : `Show ${history.length} Previous Versions`}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="text-[9px] text-slate-400 mt-2 uppercase font-bold flex justify-between items-center px-1">
                                    <span className="flex items-center gap-1">
                                        {entry.sealedHash ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 text-lilac-600"><Key size={10}/> DIGITALLY SEALED</div>
                                                {entry.isVerifiedTime === false && (
                                                    <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100" title="Signed with Unverified System Time">
                                                        <Clock size={10}/> UNVERIFIED TIME
                                                    </div>
                                                )}
                                            </div>
                                        ) : <ShieldCheck size={10} className="text-teal-500"/>}
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

                        {isExpanded && history.map(h => (
                            <tr key={h.id} className="bg-slate-50 opacity-60 grayscale-[0.5] transition-all">
                                <td className="p-4 font-mono text-[9px] text-slate-400">{formatDate(h.date)}</td>
                                <td className="p-4 text-center font-bold text-slate-400">#{h.toothNumber || '-'}</td>
                                <td className="p-4 font-bold text-slate-400 line-through">
                                    {h.procedure}
                                    <span className="ml-2 bg-red-50 text-red-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase border border-red-100 shadow-sm">SUPERSEDED</span>
                                </td>
                                <td className="p-4 text-[11px] text-slate-400 italic">
                                    <div className="border-l-2 border-slate-200 pl-3">
                                        {h.notes}
                                        <div className="mt-1 flex items-center gap-1 text-[8px] font-bold uppercase">
                                            <History size={8}/> Version {h.version || 1} • Sealed at {h.sealedAt ? new Date(h.sealedAt).toLocaleTimeString() : 'N/A'}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <ShieldAlert size={12} className="text-slate-200 ml-auto" />
                                </td>
                            </tr>
                        ))}
                      </React.Fragment>
                  )})}
              </tbody>
          </table>
      </div>
    </div>
  );
};

export default Odontonotes;
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DentalChartEntry, ProcedureItem, StockItem, User, AuditLogEntry, AccessPurpose } from '../types';
import { Plus, Edit3, ShieldCheck, Lock, Clock, GitCommit, ArrowDown, AlertCircle, AlertTriangle, FileText, Zap, Box, RotateCcw, CheckCircle2, PackageCheck, Mic, MicOff, Volume2, Sparkles, DollarSign, ShieldAlert, Key, History, ChevronRight, ChevronDown, Award, ShieldOff } from 'lucide-react';
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
  logAction?: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], id: string, details: string, previousState?: any, newState?: any, accessPurpose?: AccessPurpose) => void;
  isLicenseExpired?: boolean;
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

const Odontonotes: React.FC<OdontonotesProps> = ({ entries, onAddEntry, onUpdateEntry, currentUser, readOnly, procedures, inventory = [], prefill, onClearPrefill, logAction, isLicenseExpired }) => {
  const toast = useToast();
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  
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

  const isFormBlocked = readOnly || isLicenseExpired;

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
        setIsFormVisible(true);
        if (onClearPrefill) onClearPrefill();
    }
  }, [prefill, onClearPrefill]);

  const applyQuickFill = (fill: ClinicalMacro) => {
      if (isFormBlocked) return;
      setSubjective(fill.s || '');
      setObjective(fill.o || '');
      setAssessment(fill.a || '');
      setPlan(fill.p || '');
      toast.success(`Quick-Fill "${fill.label}" populated.`);
  };

  const toggleRecording = (field: 's'|'o'|'a'|'p') => {
      if (isFormBlocked) return;
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
      if (isFormBlocked || entry.sealedHash) return;
      const { timestamp, isVerified } = await getTrustedTime();
      
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
          logAction('SEAL_RECORD', 'ClinicalNote', entry.id, `Digitally Sealed clinical record (v${entry.version || 1}).`);
      }
      toast.success("Clinical record digitally sealed.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormBlocked) {
        toast.error("Registry access blocked.");
        return;
    }
    if (!subjective && !objective && !assessment && !plan) return;
    const combinedNotes = `S: ${subjective}\nO: ${objective}\nA: ${assessment}\nP: ${plan}`;

    if (editingId) {
        const originalEntry = entries.find(e => e.id === editingId);
        if (originalEntry) {
            if (isLocked(originalEntry)) {
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
                onUpdateEntry({ ...originalEntry, isSuperseded: true });
                onAddEntry(amendment);
                toast.success(`Amendment committed (v${nextVersionNum}).`);
            } else {
                onUpdateEntry({ ...originalEntry, notes: combinedNotes, subjective, objective, assessment, plan, version: originalEntry.version || 1 });
                toast.success("Note updated.");
            }
            setEditingId(null);
            setIsFormVisible(false);
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
            author: currentUser.name, 
            materialBatchId: selectedBatchId || undefined,
            version: 1 
        };
        onAddEntry(newEntry);
        toast.success(`Record saved.`);
        setIsFormVisible(false);
    }
    setSubjective(''); setObjective(''); setAssessment(''); setPlan(''); setToothNum(''); setSelectedProcedure(''); setCharge(''); setSelectedBatchId('');
  };

  const handleEdit = (entry: DentalChartEntry) => {
      if (isFormBlocked) return;
      setEditingId(entry.id);
      setIsFormVisible(true);
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
          <textarea className={`w-full p-3 border rounded-xl text-xs h-24 bg-white focus:ring-2 transition-all outline-none ${isRecording === field ? 'border-red-400 ring-red-500/10 shadow-inner' : 'border-slate-200 focus:ring-teal-500/10 focus:border-teal-500 shadow-sm'} ${isFormBlocked ? 'opacity-50 cursor-not-allowed' : ''}`} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={isFormBlocked}/>
      </div>
  );

  const sortedAndGrouped = useMemo(() => {
      const currentVersions = entries.filter(e => !e.isSuperseded);
      return [...currentVersions].sort((a,b) => new Date(b.date||'').getTime() - new Date(a.date||'').getTime());
  }, [entries]);

  return (
    <div className="flex flex-col h-[850px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {isLicenseExpired && (
          <div className="bg-red-600 text-white p-4 flex items-center justify-center gap-3 shrink-0">
              <ShieldOff size={24}/>
              <h4 className="font-black uppercase tracking-widest text-sm">Registry Access Blocked: License Expired</h4>
          </div>
      )}

      <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center shrink-0">
          <h4 className="font-bold text-slate-700 flex items-center gap-2"><FileText size={18}/> Clinical Narrative History</h4>
          <div className="flex gap-2">
            <button onClick={() => setShowTechnicalDetails(!showTechnicalDetails)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${showTechnicalDetails ? 'bg-teal-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                {showTechnicalDetails ? 'Hide Forensic Data' : 'Technical Details'}
            </button>
            {!readOnly && !isLicenseExpired && (
                <button 
                    onClick={() => setIsFormVisible(!isFormVisible)} 
                    className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition-all ${isFormVisible ? 'bg-slate-800 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
                >
                    {isFormVisible ? 'Collapse Form' : 'Record New Entry'}
                </button>
            )}
          </div>
      </div>

      {!readOnly && !isLicenseExpired && isFormVisible && (
          <div className={`border-b border-slate-200 p-6 animate-in slide-in-from-top-4 duration-300 ${editingId ? 'bg-amber-50/50' : 'bg-white'}`}>
             <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tooth #</label>
                        <input type="number" className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold" value={toothNum} onChange={e => setToothNum(e.target.value)} disabled={!!editingId}/>
                     </div>
                     <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Procedure</label>
                        <select value={selectedProcedure} onChange={(e) => setSelectedProcedure(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white font-bold" disabled={!!editingId}>
                            <option value="">- Select -</option>
                            {procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Material Batch</label>
                        <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-medium">
                            <option value="">- No Supply Used -</option>
                            {safeInventory.map(item => (<option key={item.id} value={item.id}>{item.name}</option>))}
                        </select>
                     </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <SoapField label="Subjective" value={subjective} onChange={setSubjective} field="s" placeholder="Reports..." />
                     <SoapField label="Objective" value={objective} onChange={setObjective} field="o" placeholder="Findings..." />
                     <SoapField label="Assessment" value={assessment} onChange={setAssessment} field="a" placeholder="Diagnosis..." />
                     <SoapField label="Plan" value={plan} onChange={setPlan} field="p" placeholder="Action..." />
                 </div>

                 <div className="flex gap-2">
                     <button type="submit" className="flex-1 py-3 rounded-xl font-bold text-white bg-teal-600 shadow-lg hover:bg-teal-700 flex items-center justify-center gap-2">
                         <ShieldCheck size={20} />
                         <span>{editingId ? 'Update Record' : 'Seal & Log Entry'}</span>
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
                  {sortedAndGrouped.map((entry) => {
                      const locked = isLocked(entry);
                      return (
                      <React.Fragment key={entry.id}>
                        <tr className="hover:bg-slate-50/50 transition-colors group relative">
                            <td className="p-4 font-mono text-[10px] text-slate-500">{formatDate(entry.date)}</td>
                            <td className="p-4 text-center font-bold text-slate-700"><span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-xs">#{entry.toothNumber || '-'}</span></td>
                            <td className="p-4 font-bold text-slate-800">{entry.procedure}</td>
                            <td className="p-4 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                                {entry.notes}
                                {showTechnicalDetails && entry.sealedHash && (
                                    <div className="mt-2 text-[8px] font-mono text-teal-600 bg-teal-50 p-1.5 rounded truncate border border-teal-100 uppercase tracking-tighter">
                                        SHA-256 Hash: {entry.sealedHash}
                                    </div>
                                )}
                                <div className="text-[9px] text-slate-400 mt-2 uppercase font-bold flex justify-between items-center px-1">
                                    <span className="flex items-center gap-1">
                                        <ShieldCheck size={10} className="text-teal-500"/>
                                        Dr. {entry.author}
                                    </span>
                                    {!isFormBlocked && (
                                        <button onClick={() => handleEdit(entry)} className="opacity-0 group-hover:opacity-100 text-teal-600 hover:bg-teal-100 px-2 py-0.5 rounded transition-all font-bold">EDIT</button>
                                    )}
                                </div>
                            </td>
                            <td className="p-4 text-right">
                                {locked && <Lock size={14} className="text-slate-300 ml-auto" />}
                            </td>
                        </tr>
                      </React.Fragment>
                  )})}
              </tbody>
          </table>
      </div>
    </div>
  );
};

export default Odontonotes;

import React, { useState, useMemo } from 'react';
import { DentalChartEntry, ProcedureItem, StockItem, ICD10Code, Vitals } from '../types';
import { Plus, Edit3, ShieldCheck, Lock, Clock, GitCommit, ArrowDown, AlertCircle, FileText, Zap, Box, RotateCcw, Search, AlertTriangle, Activity, Thermometer, Heart } from 'lucide-react';
import { formatDate, ICD10_DENTAL } from '../constants';
import { useToast } from './ToastSystem';

interface OdontonotesProps {
  entries: DentalChartEntry[];
  onAddEntry: (entry: DentalChartEntry) => void;
  onUpdateEntry: (entry: DentalChartEntry) => void;
  currentUser: string;
  readOnly?: boolean;
  procedures: ProcedureItem[];
  inventory?: StockItem[]; 
}

const SOAP_TEMPLATES: Record<string, { s: string, o: string, a: string, p: string, icd?: string }> = {
    'Oral Prophylaxis': {
        s: 'Patient presents for routine hygiene maintenance.',
        o: 'Generalized mild plaque and calculus, localized in lower anterior. No mobility.',
        a: 'Gingivitis, localized.',
        p: 'Performed ultrasonic scaling, polishing, and flossing. Oral hygiene instructions delivered.',
        icd: 'K05.2'
    },
    'Restoration': {
        s: 'Patient complains of sensitivity to sweets in the affected tooth.',
        o: 'Clinical decay visible on the occlusal surface. No apical tenderness.',
        a: 'Caries, dentinal.',
        p: 'Administered local anesthesia. Cavity preparation, bonding, and composite restoration performed.',
        icd: 'K02.1'
    },
    'Extraction': {
        s: 'Patient reports persistent pain and swelling.',
        o: 'Severe coronal destruction, non-restorable. Negative for percussion.',
        a: 'Irreversible pulpitis / Non-restorable tooth.',
        p: 'Surgical extraction performed under local anesthesia. Hemostasis achieved. Post-op instructions given.',
        icd: 'K04.0'
    }
};

const Odontonotes: React.FC<OdontonotesProps> = ({ entries, onAddEntry, onUpdateEntry, currentUser, readOnly, procedures, inventory = [] }) => {
  const toast = useToast();
  
  const [toothNum, setToothNum] = useState<string>('');
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [icdCode, setIcdCode] = useState('');
  const [plan, setPlan] = useState('');
  const [charge, setCharge] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  
  // Vitals State
  const [bp, setBp] = useState('');
  const [hr, setHr] = useState('');
  const [temp, setTemp] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);

  const fefoStock = useMemo(() => {
      return [...inventory].sort((a, b) => {
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      });
  }, [inventory]);

  const applyTemplate = (procName: string) => {
      setSelectedProcedure(procName);
      const procDef = procedures.find(p => p.name === procName);
      if (procDef) {
          setCharge(procDef.price.toString());
      }
      const template = SOAP_TEMPLATES[procName];
      if (template) {
          setSubjective(template.s);
          setObjective(template.o);
          setAssessment(template.a);
          setPlan(template.p);
          if (template.icd) setIcdCode(template.icd);
          toast.success("Clinical template applied.");
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjective && !objective && !assessment && !plan) return;
    
    const procDef = procedures.find(p => p.name === selectedProcedure);
    if (procDef?.category === 'Surgery' && !selectedBatchId) {
        toast.error("Safety Protocol Violation: Sterilization Autoclave ID is mandatory for all surgical procedures.");
        return;
    }

    // High BP Alert logic for Extractions
    if (selectedProcedure === 'Extraction' || selectedProcedure === 'Surgery') {
        const bpSystolic = parseInt(bp.split('/')[0]);
        if (bpSystolic >= 160) {
            if (!window.confirm(`MANDATORY MALPRACTICE WARNING: Patient's recorded Blood Pressure (${bp}) is hypertensive (Systolic >= 160). Are you certain you want to proceed with extraction/surgery?`)) return;
        }
    }

    const vitals: Vitals = { bp, hr: hr ? parseInt(hr) : undefined, temp: temp ? parseFloat(temp) : undefined };
    const icdDesc = ICD10_DENTAL.find(i => i.code === icdCode)?.description || '';
    const combinedNotes = `S: ${subjective}\nO: ${objective}\nA: ${assessment} (${icdCode} - ${icdDesc})\nP: ${plan}`;

    if (editingId) {
        const originalEntry = entries.find(e => e.id === editingId);
        if (originalEntry) {
            const amendedEntry: DentalChartEntry = {
                ...originalEntry,
                notes: combinedNotes,
                subjective, objective, assessment, plan, icd10Code: icdCode,
                vitals,
                amendmentInfo: {
                    amends: originalEntry.id,
                    by: currentUser,
                    at: new Date().toISOString(),
                    previousNote: originalEntry.notes || ''
                }
            };
            onUpdateEntry(amendedEntry);
            toast.success("Clinical note amended with audit trail.");
            setEditingId(null);
        }
    } else {
        const newEntry: DentalChartEntry = { 
            id: `dc_${Date.now()}`, 
            toothNumber: (toothNum ? parseInt(toothNum) : 0), 
            procedure: selectedProcedure || 'Clinical Note', 
            status: 'Completed', 
            notes: combinedNotes,
            subjective, objective, assessment, plan, icd10Code: icdCode,
            vitals,
            price: charge ? parseFloat(charge) : 0, 
            date: new Date().toISOString().split('T')[0], 
            author: currentUser,
            materialBatchId: selectedBatchId || undefined 
        };
        onAddEntry(newEntry);
    }

    resetForm();
  };

  const resetForm = () => {
    setSubjective(''); setObjective(''); setAssessment(''); setPlan(''); setIcdCode(''); setToothNum(''); setSelectedProcedure(''); setCharge(''); setSelectedBatchId('');
    setBp(''); setHr(''); setTemp('');
  };

  const handleEdit = (entry: DentalChartEntry) => {
      setEditingId(entry.id);
      setSubjective(entry.subjective || '');
      setObjective(entry.objective || '');
      setAssessment(entry.assessment || '');
      setIcdCode(entry.icd10Code || '');
      setPlan(entry.plan || '');
      setToothNum(entry.toothNumber?.toString() || '');
      setSelectedProcedure(entry.procedure || '');
      setBp(entry.vitals?.bp || '');
      setHr(entry.vitals?.hr?.toString() || '');
      setTemp(entry.vitals?.temp?.toString() || '');
  };

  const sorted = [...entries].sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

  return (
    <div className="flex flex-col h-[650px] bg-white rounded-xl border border-slate-200 overflow-hidden">
      {!readOnly && (
          <div className={`border-b border-slate-200 p-4 ${editingId ? 'bg-amber-50' : 'bg-slate-50'}`}>
             <div className="flex justify-between items-center mb-3">
                 <h4 className="font-bold text-slate-700 flex items-center gap-2">
                     {editingId ? <><RotateCcw size={18} className="text-amber-600"/> Amend Clinical Note</> : <><Plus size={18}/> New Visit Entry</>}
                 </h4>
                 {editingId && <button onClick={() => setEditingId(null)} className="text-xs font-bold text-amber-700 hover:underline">Cancel Amendment</button>}
             </div>
             
             {/* QUICK VITALS WIDGET - PRC COMPLIANCE */}
             <div className="flex gap-2 mb-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm animate-in fade-in zoom-in-95">
                 <div className="flex items-center gap-2 px-2 border-r border-slate-100">
                    <Activity size={14} className="text-red-500" />
                    <input value={bp} onChange={e => setBp(e.target.value)} placeholder="BP (e.g. 120/80)" className="text-xs font-bold w-24 outline-none" />
                 </div>
                 <div className="flex items-center gap-2 px-2 border-r border-slate-100">
                    <Heart size={14} className="text-pink-500" />
                    <input value={hr} onChange={e => setHr(e.target.value)} placeholder="HR" className="text-xs font-bold w-12 outline-none" />
                 </div>
                 <div className="flex items-center gap-2 px-2">
                    <Thermometer size={14} className="text-orange-500" />
                    <input value={temp} onChange={e => setTemp(e.target.value)} placeholder="Temp" className="text-xs font-bold w-12 outline-none" />
                 </div>
                 <span className="ml-auto text-[10px] font-extrabold text-slate-300 uppercase tracking-tighter self-center">Visit Vitals</span>
             </div>

             <form onSubmit={handleSubmit} className="space-y-3">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                     <input type="number" placeholder="T#" className="p-2 rounded-lg border border-slate-300 text-sm w-full" value={toothNum} onChange={e => setToothNum(e.target.value)} disabled={!!editingId}/>
                     <select value={selectedProcedure} onChange={(e) => applyTemplate(e.target.value)} className="md:col-span-3 p-2 rounded-lg border border-slate-300 text-sm outline-none bg-white font-bold" disabled={!!editingId}>
                        <option value="">- Select Procedure (Apply Macro) -</option>
                        {procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                     </select>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <div><label className="text-[9px] font-bold text-slate-400 uppercase ml-1 tracking-widest">S (Subjective)</label><textarea placeholder="Patient complaint..." className="w-full p-2 border border-slate-300 rounded-lg text-xs h-12" value={subjective} onChange={e => setSubjective(e.target.value)}/></div>
                     <div><label className="text-[9px] font-bold text-slate-400 uppercase ml-1 tracking-widest">O (Objective)</label><textarea placeholder="Clinical findings..." className="w-full p-2 border border-slate-300 rounded-lg text-xs h-12" value={objective} onChange={e => setObjective(e.target.value)}/></div>
                     
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-teal-600 uppercase ml-1 tracking-widest flex items-center gap-1"><Search size={10}/> A (Assessment / ICD-10)</label>
                        <div className="flex gap-2">
                            <select value={icdCode} onChange={e => { setIcdCode(e.target.value); if(!assessment) setAssessment(ICD10_DENTAL.find(i => i.code === e.target.value)?.description || ''); }} className="w-24 p-2 border border-teal-300 rounded-lg text-xs font-bold bg-white">
                                <option value="">Code</option>
                                {ICD10_DENTAL.map(i => <option key={i.code} value={i.code}>{i.code}</option>)}
                            </select>
                            <textarea placeholder="Clinical diagnosis..." className="flex-1 p-2 border border-slate-300 rounded-lg text-xs h-12" value={assessment} onChange={e => setAssessment(e.target.value)}/>
                        </div>
                     </div>
                     
                     <div><label className="text-[9px] font-bold text-slate-400 uppercase ml-1 tracking-widest">P (Plan)</label><textarea placeholder="Treatment performed..." className="w-full p-2 border border-slate-300 rounded-lg text-xs h-12" value={plan} onChange={e => setPlan(e.target.value)}/></div>
                 </div>

                 <div className="flex flex-wrap gap-2 items-center">
                     <div className="flex-1 flex gap-2 min-w-[280px]">
                        {!editingId && <input type="number" placeholder="Fee ₱" value={charge} onChange={e => setCharge(e.target.value)} className="w-24 p-2 rounded-lg border border-slate-300 text-sm font-bold"/>}
                        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-2 relative group">
                            <Box size={14} className="text-slate-400"/>
                            <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} className="flex-1 py-2 text-[10px] font-bold outline-none bg-transparent" disabled={!!editingId}>
                                <option value="">- FEFO Material Traceability -</option>
                                {fefoStock.filter(s => s.batchNumber).map(s => {
                                    const isExpired = s.expiryDate && new Date(s.expiryDate) < new Date();
                                    return (
                                        <option key={s.id} value={s.batchNumber} className={isExpired ? 'text-red-600' : ''}>
                                            {s.name} (Lot: {s.batchNumber})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                     </div>
                     <button type="submit" className={`px-6 py-2 rounded-lg font-bold text-white flex items-center gap-2 shrink-0 shadow-lg ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-teal-600 hover:bg-teal-700'}`}>
                         {editingId ? <><RotateCcw size={18} /> Amend Note</> : <><ShieldCheck size={18} /> Commit Entry</>}
                     </button>
                 </div>
             </form>
          </div>
      )}

      <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 sticky top-0 z-10 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><tr className="divide-x divide-slate-200"><th className="p-3 border-b w-24">Date</th><th className="p-3 border-b w-12 text-center">T#</th><th className="p-3 border-b w-1/4">Procedure</th><th className="p-3 border-b">Clinical Notes & Vitals</th><th className="p-3 border-b w-24 text-right">Fee</th></tr></thead>
              <tbody className="text-sm divide-y">
                  {sorted.length === 0 ? (<tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">No clinical records found.</td></tr>) : (
                      sorted.map((entry, idx) => (
                          <tr key={idx} className={`${entry.isVoid ? 'bg-red-50/30' : 'bg-white'} hover:bg-blue-50/20 transition-colors group relative`}>
                              <td className="p-3 font-mono text-xs text-slate-500">
                                {formatDate(entry.date)}
                                {entry.isVerifiedTimestamp && <div className="text-[8px] text-green-600 font-bold flex items-center gap-0.5 mt-0.5"><ShieldCheck size={8}/> Verified Time</div>}
                              </td>
                              <td className="p-3 text-center font-bold text-slate-700">{entry.toothNumber || '-'}</td>
                              <td className="p-3 font-bold text-slate-800">
                                {entry.procedure}
                                {entry.icd10Code && <div className="text-[9px] text-purple-600 font-extrabold mt-1 border border-purple-100 bg-purple-50 px-1 rounded w-fit uppercase">ICD-10: {entry.icd10Code}</div>}
                                {entry.materialBatchId && <div className="text-[9px] text-teal-600 font-bold mt-1 uppercase flex items-center gap-1"><Box size={10}/> Lot: {entry.materialBatchId}</div>}
                              </td>
                              <td className="p-3 text-slate-600">
                                {entry.vitals?.bp && (
                                    <div className="mb-2 flex gap-3 text-[10px] font-bold bg-slate-50 p-1.5 rounded-lg border border-slate-100 w-fit">
                                        <span className="flex items-center gap-1"><Activity size={10} className="text-red-500"/> BP: {entry.vitals.bp}</span>
                                        {entry.vitals.hr && <span className="flex items-center gap-1"><Heart size={10} className="text-pink-500"/> HR: {entry.vitals.hr}</span>}
                                        {entry.vitals.temp && <span className="flex items-center gap-1"><Thermometer size={10} className="text-orange-500"/> T: {entry.vitals.temp}°C</span>}
                                    </div>
                                )}
                                {entry.amendmentInfo && (
                                    <div className="text-[10px] text-slate-400 line-through mb-2 italic bg-slate-50 p-2 rounded border-l-2 border-slate-200">
                                        {entry.amendmentInfo.previousNote}
                                        <div className="mt-1 font-bold">REDACTED BY AMENDMENT ON {formatDate(entry.amendmentInfo.at)}</div>
                                    </div>
                                )}
                                <div className="whitespace-pre-wrap leading-relaxed text-xs">{entry.notes}</div>
                                <div className="text-[9px] text-slate-400 mt-1 uppercase font-bold flex justify-between">
                                    <span>DR. {entry.author}</span>
                                    {!readOnly && (
                                        <button onClick={() => handleEdit(entry)} className="opacity-0 group-hover:opacity-100 text-teal-600 hover:underline flex items-center gap-1 transition-opacity">
                                            <Edit3 size={10}/> Amend
                                        </button>
                                    )}
                                </div>
                              </td>
                              <td className="p-3 text-right font-mono font-bold">₱{entry.price?.toLocaleString()}</td>
                          </tr>
                      ))
                  )}
              </tbody>
          </table>
      </div>
    </div>
  );
};

export default Odontonotes;


import React, { useState, useMemo } from 'react';
import { DentalChartEntry, ProcedureItem, StockItem } from '../types';
import { Plus, Edit3, ShieldCheck, Lock, Clock, GitCommit, ArrowDown, AlertCircle, FileText, Zap, Box, RotateCcw } from 'lucide-react';
import { formatDate } from '../constants';
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

const SOAP_TEMPLATES: Record<string, { s: string, o: string, a: string, p: string }> = {
    'Oral Prophylaxis': {
        s: 'Patient presents for routine hygiene maintenance.',
        o: 'Generalized mild plaque and calculus, localized in lower anterior. No mobility.',
        a: 'Gingivitis, localized.',
        p: 'Performed ultrasonic scaling, polishing, and flossing. Oral hygiene instructions delivered.'
    },
    'Restoration': {
        s: 'Patient complains of sensitivity to sweets in the affected tooth.',
        o: 'Clinical decay visible on the occlusal surface. No apical tenderness.',
        a: 'Caries, dentinal.',
        p: 'Administered local anesthesia. Cavity preparation, bonding, and composite restoration performed.'
    },
    'Extraction': {
        s: 'Patient reports persistent pain and swelling.',
        o: 'Severe coronal destruction, non-restorable. Negative for percussion.',
        a: 'Irreversible pulpitis / Non-restorable tooth.',
        p: 'Surgical extraction performed under local anesthesia. Hemostasis achieved. Post-op instructions given.'
    }
};

const Odontonotes: React.FC<OdontonotesProps> = ({ entries, onAddEntry, onUpdateEntry, currentUser, readOnly, procedures, inventory = [] }) => {
  const toast = useToast();
  
  const [toothNum, setToothNum] = useState<string>('');
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [charge, setCharge] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);

  const applyTemplate = (procName: string) => {
      setSelectedProcedure(procName);
      const template = SOAP_TEMPLATES[procName];
      if (template) {
          setSubjective(template.s);
          setObjective(template.o);
          setAssessment(template.a);
          setPlan(template.p);
          toast.success("Clinical template applied.");
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjective && !objective && !assessment && !plan) return;
    
    const combinedNotes = `S: ${subjective}\nO: ${objective}\nA: ${assessment}\nP: ${plan}`;

    if (editingId) {
        const originalEntry = entries.find(e => e.id === editingId);
        if (originalEntry) {
            const amendedEntry: DentalChartEntry = {
                ...originalEntry,
                notes: combinedNotes,
                subjective, objective, assessment, plan,
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
            subjective, objective, assessment, plan,
            price: charge ? parseFloat(charge) : 0, 
            date: new Date().toISOString().split('T')[0], 
            author: currentUser,
            materialBatchId: selectedBatchId || undefined 
        };
        onAddEntry(newEntry);
    }

    setSubjective(''); setObjective(''); setAssessment(''); setPlan(''); setToothNum(''); setSelectedProcedure(''); setCharge(''); setSelectedBatchId('');
  };

  const handleEdit = (entry: DentalChartEntry) => {
      if (entry.isLocked) {
          toast.error("Locked record: You must amend this note instead of editing directly.");
      }
      setEditingId(entry.id);
      setSubjective(entry.subjective || '');
      setObjective(entry.objective || '');
      setAssessment(entry.assessment || '');
      setPlan(entry.plan || '');
      setToothNum(entry.toothNumber?.toString() || '');
      setSelectedProcedure(entry.procedure || '');
  };

  const sorted = [...entries].sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border border-slate-200 overflow-hidden">
      {!readOnly && (
          <div className={`border-b border-slate-200 p-4 ${editingId ? 'bg-amber-50' : 'bg-slate-50'}`}>
             <div className="flex justify-between items-center mb-4">
                 <h4 className="font-bold text-slate-700 flex items-center gap-2">
                     {editingId ? <><RotateCcw size={18} className="text-amber-600"/> Amend Clinical Note</> : <><Plus size={18}/> New SOAP Entry</>}
                 </h4>
                 {editingId && <button onClick={() => setEditingId(null)} className="text-xs font-bold text-amber-700 hover:underline">Cancel Amendment</button>}
             </div>
             <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                     <input type="number" placeholder="Tooth #" className="p-2 rounded-lg border border-slate-300 text-sm" value={toothNum} onChange={e => setToothNum(e.target.value)} disabled={!!editingId}/>
                     <select value={selectedProcedure} onChange={(e) => applyTemplate(e.target.value)} className="col-span-2 p-2 rounded-lg border border-slate-300 text-sm outline-none bg-white" disabled={!!editingId}>
                        <option value="">- Select Procedure (Apply Macro) -</option>
                        {procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                     </select>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Subjective (Complaint)</label><textarea placeholder="..." className="w-full p-2 border border-slate-300 rounded-lg text-xs h-12" value={subjective} onChange={e => setSubjective(e.target.value)}/></div>
                     <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Objective (Findings)</label><textarea placeholder="..." className="w-full p-2 border border-slate-300 rounded-lg text-xs h-12" value={objective} onChange={e => setObjective(e.target.value)}/></div>
                     <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Assessment (Diagnosis)</label><textarea placeholder="..." className="w-full p-2 border border-slate-300 rounded-lg text-xs h-12" value={assessment} onChange={e => setAssessment(e.target.value)}/></div>
                     <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Plan (Treatment)</label><textarea placeholder="..." className="w-full p-2 border border-slate-300 rounded-lg text-xs h-12" value={plan} onChange={e => setPlan(e.target.value)}/></div>
                 </div>

                 <div className="flex gap-2 items-center">
                     <div className="flex-1 flex gap-2">
                        {!editingId && <input type="number" placeholder="Charge" value={charge} onChange={e => setCharge(e.target.value)} className="w-24 p-2 rounded-lg border border-slate-300 text-sm"/>}
                        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-2">
                            <Box size={14} className="text-slate-400"/>
                            <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} className="flex-1 py-2 text-xs outline-none bg-transparent" disabled={!!editingId}>
                                <option value="">- Trace Material Batch -</option>
                                {inventory.filter(s => s.batchNumber).map(s => <option key={s.id} value={s.batchNumber}>{s.name} (Lot: {s.batchNumber})</option>)}
                            </select>
                        </div>
                     </div>
                     <button type="submit" className={`px-6 py-2 rounded-lg font-bold text-white flex items-center gap-2 shrink-0 ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-teal-600 hover:bg-teal-700'}`}>
                         {editingId ? <><RotateCcw size={18} /> Apply Amendment</> : <><Plus size={18} /> Add SOAP Entry</>}
                     </button>
                 </div>
             </form>
          </div>
      )}

      <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 sticky top-0 z-10 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><tr className="divide-x divide-slate-200"><th className="p-3 border-b w-24">Date</th><th className="p-3 border-b w-12 text-center">T#</th><th className="p-3 border-b w-1/4">Procedure</th><th className="p-3 border-b">Clinical Notes (SOAP)</th><th className="p-3 border-b w-24 text-right">Fee</th></tr></thead>
              <tbody className="text-sm divide-y">
                  {sorted.length === 0 ? (<tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">No records found.</td></tr>) : (
                      sorted.map((entry, idx) => (
                          <tr key={idx} className={`${entry.isVoid ? 'bg-red-50/30' : 'bg-white'} hover:bg-blue-50/20 transition-colors group relative`}>
                              <td className="p-3 font-mono text-xs text-slate-500">{formatDate(entry.date)}</td>
                              <td className="p-3 text-center font-bold text-slate-700">{entry.toothNumber || '-'}</td>
                              <td className="p-3 font-bold text-slate-800">
                                {entry.procedure}
                                {entry.materialBatchId && <div className="text-[9px] text-teal-600 font-bold mt-1 uppercase flex items-center gap-1"><Box size={10}/> Lot: {entry.materialBatchId}</div>}
                                {entry.amendmentInfo && <div className="text-[9px] text-amber-600 font-bold mt-1 uppercase flex items-center gap-1"><RotateCcw size={10}/> Amended Record</div>}
                              </td>
                              <td className="p-3 text-slate-600">
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
                                            <Edit3 size={10}/> {entry.isLocked ? 'Amend' : 'Edit'}
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

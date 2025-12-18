
import React, { useState, useMemo, useEffect } from 'react';
import { DentalChartEntry, ProcedureItem, StockItem } from '../types';
import { Plus, Edit3, ShieldCheck, Lock, Clock, GitCommit, ArrowDown, AlertCircle, FileText, Zap, Box, RotateCcw, CheckCircle2, PackageCheck } from 'lucide-react';
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
  prefill?: Partial<DentalChartEntry> | null;
  onClearPrefill?: () => void;
}

const SMART_TAGS = [
    { label: 'LA 1:100k', text: 'Administered 1 carpule of Lidocaine 2% with Epinephrine 1:100k via infiltration.' },
    { label: 'Hemostasis', text: 'Achieved hemostasis via direct pressure and gauze.' },
    { label: 'Well Tolerated', text: 'Patient tolerated the procedure well.' },
    { label: 'OHI Given', text: 'Delivered Oral Hygiene Instructions.' }
];

const Odontonotes: React.FC<OdontonotesProps> = ({ entries, onAddEntry, onUpdateEntry, currentUser, readOnly, procedures, inventory = [], prefill, onClearPrefill }) => {
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
  
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeProcedureDef = useMemo(() => {
      return procedures.find(p => p.name === selectedProcedure);
  }, [selectedProcedure, procedures]);

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

  const injectTag = (text: string) => { setPlan(prev => prev ? `${prev}\n${text}` : text); toast.info("Clinical tag injected."); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjective && !objective && !assessment && !plan) return;
    
    const combinedNotes = `S: ${subjective}\nO: ${objective}\nA: ${assessment}\nP: ${plan}`;

    if (editingId) {
        const originalEntry = entries.find(e => e.id === editingId);
        if (originalEntry) {
            onUpdateEntry({ ...originalEntry, notes: combinedNotes, subjective, objective, assessment, plan });
            toast.success("Clinical note amended.");
            setEditingId(null);
        }
    } else {
        const newEntry: DentalChartEntry = { 
            id: `dc_${Date.now()}`, toothNumber: (toothNum ? parseInt(toothNum) : 0), procedure: selectedProcedure || 'Clinical Note', status: 'Completed', notes: combinedNotes, subjective, objective, assessment, plan, price: charge ? parseFloat(charge) : 0, date: new Date().toISOString().split('T')[0], author: currentUser, materialBatchId: selectedBatchId || undefined 
        };
        
        if (deductSupplies && activeProcedureDef?.billOfMaterials) {
            toast.success(`Procedure saved. Decremented ${activeProcedureDef.billOfMaterials.length} items from inventory.`);
        } else {
            toast.success(`Clinical note saved.`);
        }
        
        onAddEntry(newEntry);
    }
    setSubjective(''); setObjective(''); setAssessment(''); setPlan(''); setToothNum(''); setSelectedProcedure(''); setCharge(''); setSelectedBatchId('');
  };

  const handleEdit = (entry: DentalChartEntry) => {
      if (entry.isLocked) toast.error("Record locked. Amendment required.");
      setEditingId(entry.id);
      setSubjective(entry.subjective || ''); setObjective(entry.objective || ''); setAssessment(entry.assessment || ''); setPlan(entry.plan || ''); setToothNum(entry.toothNumber?.toString() || ''); setSelectedProcedure(entry.procedure || '');
  };

  const sorted = [...entries].sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

  return (
    <div className="flex flex-col h-[700px] bg-white rounded-xl border border-slate-200 overflow-hidden">
      {!readOnly && (
          <div className={`border-b border-slate-200 p-4 ${editingId ? 'bg-amber-50' : 'bg-slate-50'}`}>
             <div className="flex justify-between items-center mb-4">
                 <h4 className="font-bold text-slate-700 flex items-center gap-2">{editingId ? <RotateCcw size={18}/> : <Plus size={18}/>} {editingId ? 'Amend Clinical Note' : 'New SOAP Entry'}</h4>
                 {editingId && <button onClick={() => setEditingId(null)} className="text-xs font-bold text-amber-700">Cancel</button>}
             </div>
             <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                     <input type="number" placeholder="Tooth #" className="p-2 rounded-lg border border-slate-300 text-sm font-bold bg-white" value={toothNum} onChange={e => setToothNum(e.target.value)} disabled={!!editingId}/>
                     <select value={selectedProcedure} onChange={(e) => setSelectedProcedure(e.target.value)} className="col-span-2 p-2 rounded-lg border border-slate-300 text-sm outline-none bg-white font-bold" disabled={!!editingId}>
                        <option value="">- Select Procedure -</option>
                        {procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                     </select>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <div><label className="text-[10px] font-bold text-slate-400 uppercase">Subjective</label><textarea className="w-full p-2 border rounded-lg text-xs h-12 bg-white" value={subjective} onChange={e => setSubjective(e.target.value)}/></div>
                     <div><label className="text-[10px] font-bold text-slate-400 uppercase">Objective</label><textarea className="w-full p-2 border rounded-lg text-xs h-12 bg-white" value={objective} onChange={e => setObjective(e.target.value)}/></div>
                     <div><label className="text-[10px] font-bold text-slate-400 uppercase">Assessment</label><textarea className="w-full p-2 border rounded-lg text-xs h-12 bg-white" value={assessment} onChange={e => setAssessment(e.target.value)}/></div>
                     <div><label className="text-[10px] font-bold text-slate-400 uppercase">Plan</label><textarea className="w-full p-2 border rounded-lg text-xs h-12 bg-white" value={plan} onChange={e => setPlan(e.target.value)}/></div>
                 </div>

                 <div className="flex flex-wrap gap-2 py-1">
                     <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full border border-teal-100 flex items-center gap-1"><Zap size={10}/> Tags:</span>
                     {SMART_TAGS.map(tag => (<button key={tag.label} type="button" onClick={() => injectTag(tag.text)} className="text-[10px] font-bold px-2.5 py-1 bg-white border border-slate-200 rounded-full shadow-sm">+ {tag.label}</button>))}
                 </div>

                 {/* PROCEDURE SUPPLY LINKAGE UI */}
                 {!editingId && activeProcedureDef?.billOfMaterials && (
                     <div className="bg-lilac-50 border border-lilac-100 p-3 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                         <div className="flex items-center gap-3">
                             <div className="bg-lilac-500 text-white p-1.5 rounded-lg"><PackageCheck size={16}/></div>
                             <div>
                                 <div className="text-xs font-bold text-lilac-900">Clinical Supply Checklist</div>
                                 <div className="text-[9px] text-lilac-600">Expected: {activeProcedureDef.billOfMaterials.map(bm => inventory.find(i => i.id === bm.stockItemId)?.name).join(', ')}</div>
                             </div>
                         </div>
                         <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-lilac-200 shadow-sm">
                             <input type="checkbox" checked={deductSupplies} onChange={e => setDeductSupplies(e.target.checked)} className="w-4 h-4 accent-lilac-600" />
                             <span className="text-[10px] font-bold text-lilac-700">Deduct Stock</span>
                         </label>
                     </div>
                 )}

                 <div className="flex gap-2 items-center">
                     {!editingId && <input type="number" placeholder="Charge" value={charge} onChange={e => setCharge(e.target.value)} className="w-24 p-2 rounded-lg border text-sm font-bold bg-white"/>}
                     <button type="submit" className={`flex-1 px-6 py-2 rounded-lg font-bold text-white flex items-center justify-center gap-2 ${editingId ? 'bg-amber-600' : 'bg-teal-600 shadow-lg shadow-teal-600/20'}`}>{editingId ? <RotateCcw size={18} /> : <CheckCircle2 size={18} />} {editingId ? 'Apply Amendment' : 'Log Clinical Note'}</button>
                 </div>
             </form>
          </div>
      )}

      <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 sticky top-0 z-10 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><tr className="divide-x"><th className="p-3 border-b w-24">Date</th><th className="p-3 border-b w-12 text-center">T#</th><th className="p-3 border-b w-1/4">Procedure</th><th className="p-3 border-b">Clinical Notes (SOAP)</th><th className="p-3 border-b w-24 text-right">Fee</th></tr></thead>
              <tbody className="text-sm divide-y">
                  {sorted.length === 0 ? (<tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">No records.</td></tr>) : (
                      sorted.map((entry, idx) => (
                          <tr key={idx} className={`${entry.isVoid ? 'bg-red-50/30' : 'bg-white'} hover:bg-blue-50/20 transition-colors group relative`}>
                              <td className="p-3 font-mono text-xs text-slate-500">{formatDate(entry.date)}</td>
                              <td className="p-3 text-center font-bold text-slate-700">{entry.toothNumber || '-'}</td>
                              <td className="p-3 font-bold text-slate-800">{entry.procedure}</td>
                              <td className="p-3 text-slate-600 whitespace-pre-wrap leading-relaxed text-xs">{entry.notes}<div className="text-[9px] text-slate-400 mt-1 uppercase font-bold flex justify-between"><span>DR. {entry.author}</span>{!readOnly && <button onClick={() => handleEdit(entry)} className="opacity-0 group-hover:opacity-100 text-teal-600 hover:underline">Edit</button>}</div></td>
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


import React, { useState, useMemo } from 'react';
import { DentalChartEntry, ProcedureItem } from '../types';
import { Plus, Edit3, ShieldCheck, Lock, Clock, GitCommit, ArrowDown, AlertCircle, FileText } from 'lucide-react';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';

interface OdontonotesProps {
  entries: DentalChartEntry[];
  onAddEntry: (entry: DentalChartEntry) => void;
  onUpdateEntry: (entry: DentalChartEntry) => void;
  currentUser: string;
  readOnly?: boolean;
  procedures: ProcedureItem[];
}

// --- NEW: CLINICAL HISTORY MODAL ---
const ClinicalHistoryModal = ({ entry, allEntries, onClose }: { entry: DentalChartEntry, allEntries: DentalChartEntry[], onClose: () => void }) => {
    // 1. Build the History Chain (Backwards from current entry)
    const historyChain = useMemo(() => {
        const chain: DentalChartEntry[] = [entry];
        let current = entry;
        
        // Loop to find ancestors
        while (current.amendmentInfo?.amends) {
            const parent = allEntries.find(e => e.id === current.amendmentInfo!.amends);
            if (parent) {
                chain.push(parent);
                current = parent;
            } else {
                break; // Broken chain or parent purged
            }
        }
        return chain;
    }, [entry, allEntries]);

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
                {/* Header */}
                <div className="bg-teal-900 text-white p-6 shrink-0 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2"><Clock size={24} className="text-teal-300"/> Clinical Audit Timeline</h2>
                        <p className="text-xs text-teal-200 mt-1">Full revision history for Record ID: <span className="font-mono">{entry.id}</span></p>
                    </div>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"><div className="w-6 h-6 flex items-center justify-center font-bold">✕</div></button>
                </div>

                {/* Timeline Body */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50 relative">
                    <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-slate-200"></div>
                    
                    <div className="space-y-8 relative">
                        {historyChain.map((node, index) => {
                            const isCurrent = index === 0;
                            const isOriginal = index === historyChain.length - 1;
                            
                            return (
                                <div key={node.id} className="flex gap-6 relative group">
                                    {/* Timeline Node Icon */}
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-4 border-slate-50 shadow-sm
                                        ${isCurrent ? 'bg-teal-600 text-white' : 'bg-slate-300 text-slate-500'}
                                    `}>
                                        {isCurrent ? <ShieldCheck size={18}/> : <GitCommit size={18}/>}
                                    </div>

                                    {/* Content Card */}
                                    <div className={`flex-1 rounded-2xl border p-5 shadow-sm transition-all ${isCurrent ? 'bg-white border-teal-200 ring-4 ring-teal-500/5' : 'bg-slate-100 border-slate-200 opacity-80 hover:opacity-100'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${isCurrent ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-600'}`}>
                                                        {isCurrent ? 'Current Version' : 'Historical Record'}
                                                    </span>
                                                    {node.isVoid && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded uppercase">Voided</span>}
                                                </div>
                                                <div className="text-sm text-slate-500 mt-1 font-mono">
                                                    {new Date(node.timestamp || node.date).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-slate-400 uppercase">Author</div>
                                                <div className="text-sm font-bold text-slate-700">{node.author}</div>
                                            </div>
                                        </div>

                                        {/* Clinical Data Snapshot */}
                                        <div className="bg-white/50 rounded-xl p-3 border border-slate-200/50 mb-3 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-400 w-16 uppercase">Proc:</span>
                                                <span className="text-sm font-bold text-slate-800">{node.procedure} (#{node.toothNumber})</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="text-xs font-bold text-slate-400 w-16 uppercase mt-0.5">Notes:</span>
                                                <span className="text-sm text-slate-600 italic">"{node.notes}"</span>
                                            </div>
                                            {node.price !== undefined && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-400 w-16 uppercase">Fee:</span>
                                                    <span className="text-sm font-mono text-slate-700">₱{node.price.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Void Reason (If applicable) */}
                                        {node.voidedInfo && (
                                            <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-3">
                                                <AlertCircle size={16} className="text-red-500 mt-0.5"/>
                                                <div>
                                                    <div className="text-xs font-bold text-red-800 uppercase">Void Reason</div>
                                                    <div className="text-sm text-red-700">{node.voidedInfo.reason}</div>
                                                    <div className="text-[10px] text-red-500 mt-1">Voided by {node.voidedInfo.by} on {new Date(node.voidedInfo.at).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Amendment Meta (Why was this created?) */}
                                        {node.amendmentInfo && (
                                            <div className="mt-3 text-xs text-lilac-600 flex items-center gap-1 font-medium">
                                                <Edit3 size={12}/> Amended Record: {node.amendmentInfo.amends}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        
                        <div className="flex gap-6">
                            <div className="w-10 flex justify-center"><div className="w-2 h-2 bg-slate-300 rounded-full"></div></div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-1">End of Audit Trail</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AmendmentModal = ({ entry, onSave, onClose }: { entry: DentalChartEntry, onSave: (reason: string) => void, onClose: () => void }) => {
    const [reason, setReason] = useState('');
    return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                <div className="flex items-center gap-3 mb-4 text-lilac-700"><Edit3 size={24} /><h3 className="text-xl font-bold">Amend Clinical Note</h3></div>
                <p className="text-sm text-slate-500 mb-4">A mandatory reason is required for the audit log to correct this clinical record.</p>
                <textarea autoFocus placeholder="Reason for amendment..." className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-lilac-500 outline-none h-24 mb-4" value={reason} onChange={e => setReason(e.target.value)}/>
                <div className="flex gap-2"><button onClick={onClose} className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg">Cancel</button><button onClick={() => onSave(reason)} disabled={!reason.trim()} className="flex-[2] py-2 bg-lilac-600 text-white font-bold rounded-lg disabled:opacity-50">Confirm Amendment</button></div>
            </div>
        </div>
    );
};

const Odontonotes: React.FC<OdontonotesProps> = ({ entries, onAddEntry, onUpdateEntry, currentUser, readOnly, procedures }) => {
  const toast = useToast();
  const [noteText, setNoteText] = useState('');
  const [toothNum, setToothNum] = useState<string>('');
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [charge, setCharge] = useState<string>('');
  const [payment, setPayment] = useState<string>('');
  const [receipt, setReceipt] = useState('');
  
  // States for Amendment Flow
  const [amendmentEntry, setAmendmentEntry] = useState<DentalChartEntry | null>(null);
  const [pendingAmendmentParentId, setPendingAmendmentParentId] = useState<string | null>(null);
  
  // State for History Viewer
  const [viewingHistoryEntry, setViewingHistoryEntry] = useState<DentalChartEntry | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() && !selectedProcedure && !charge && !payment) return;
    
    const newEntry: DentalChartEntry = { 
        id: `dc_${Date.now()}`, 
        toothNumber: (toothNum ? parseInt(toothNum) : 0), 
        procedure: selectedProcedure || 'Clinical Note', 
        status: 'Completed', 
        notes: noteText, 
        price: charge ? parseFloat(charge) : 0, 
        payment: payment ? parseFloat(payment) : 0, 
        receiptNumber: receipt, 
        date: new Date().toISOString().split('T')[0], 
        author: currentUser,
        // --- LINKAGE: Attach the ID of the record this replaces ---
        amendmentInfo: pendingAmendmentParentId ? {
            amends: pendingAmendmentParentId,
            by: currentUser,
            at: new Date().toISOString()
        } : undefined
    };

    onAddEntry(newEntry);
    
    // Reset Form & State
    setNoteText(''); setToothNum(''); setSelectedProcedure(''); setCharge(''); setPayment(''); setReceipt('');
    setPendingAmendmentParentId(null); // Clear linking state
  };

  const handleAmend = (reason: string) => {
      if (!amendmentEntry) return;
      
      // 1. Void the original
      onUpdateEntry({ ...amendmentEntry, isVoid: true, voidedInfo: { by: currentUser, at: new Date().toISOString(), reason } });
      
      // 2. Pre-fill form for correction
      setNoteText(amendmentEntry.notes || ''); 
      setToothNum(amendmentEntry.toothNumber.toString()); 
      setSelectedProcedure(amendmentEntry.procedure); 
      setCharge(amendmentEntry.price?.toString() || '');
      
      // 3. Set Tracking ID for the Next Submit
      setPendingAmendmentParentId(amendmentEntry.id);
      
      setAmendmentEntry(null);
      toast.info("Original record voided. Please make corrections and save to create the amended entry.");
  };

  const sorted = [...entries].sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border border-slate-200 overflow-hidden">
      {!readOnly && (
          <div className={`border-b border-slate-200 p-4 transition-colors ${pendingAmendmentParentId ? 'bg-lilac-50' : 'bg-slate-50'}`}>
             {pendingAmendmentParentId && (
                 <div className="flex items-center gap-2 text-lilac-700 text-xs font-bold mb-3 animate-pulse">
                     <Edit3 size={14}/> AMENDING MODE: You are correcting a voided record.
                     <button onClick={() => { setPendingAmendmentParentId(null); setNoteText(''); setToothNum(''); }} className="ml-auto text-slate-400 hover:text-slate-600 underline">Cancel Amendment</button>
                 </div>
             )}
             <form onSubmit={handleSubmit} className="space-y-3">
                 <div className="flex gap-2">
                     <input type="number" placeholder="#" className="w-16 p-2 rounded-lg border border-slate-300 text-sm" value={toothNum} onChange={e => setToothNum(e.target.value)}/>
                     <select value={selectedProcedure} onChange={(e) => setSelectedProcedure(e.target.value)} className="flex-1 p-2 rounded-lg border border-slate-300 text-sm outline-none bg-white"><option value="">- Select Procedure -</option>{procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select>
                 </div>
                 <textarea placeholder="Clinical notes..." className="w-full p-3 rounded-lg border border-slate-300 text-sm h-16" value={noteText} onChange={e => setNoteText(e.target.value)}/>
                 <div className="flex gap-2">
                     <input type="number" placeholder="Charge" value={charge} onChange={e => setCharge(e.target.value)} className="flex-1 p-2 rounded-lg border border-slate-300 text-sm"/>
                     <button type="submit" className={`px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 text-white ${pendingAmendmentParentId ? 'bg-lilac-600 hover:bg-lilac-700' : 'bg-teal-600 hover:bg-teal-700'}`}>
                         <Plus size={18} /> {pendingAmendmentParentId ? 'Save Amendment' : 'Add Record'}
                     </button>
                 </div>
             </form>
          </div>
      )}

      <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 sticky top-0 z-10 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><tr className="divide-x divide-slate-200"><th className="p-3 border-b w-24">Date</th><th className="p-3 border-b w-12 text-center">T#</th><th className="p-3 border-b w-1/4">Procedure</th><th className="p-3 border-b">Clinical Findings & Notes</th><th className="p-3 border-b w-24 text-right">Fee</th><th className="p-3 border-b w-20 text-center">Actions</th></tr></thead>
              <tbody className="text-sm divide-y">
                  {sorted.length === 0 ? (<tr><td colSpan={6} className="p-10 text-center text-slate-400 italic">No clinical records found.</td></tr>) : (
                      sorted.map((entry, idx) => (
                          <tr key={idx} className={`${entry.isVoid ? 'bg-red-50/30' : entry.isLocked ? 'bg-slate-50/50' : 'bg-white'} hover:bg-blue-50/20 transition-colors group`}>
                              <td className="p-3 font-mono text-xs text-slate-500">{formatDate(entry.date)}</td>
                              <td className="p-3 text-center font-bold text-slate-700">{entry.toothNumber || '-'}</td>
                              <td className="p-3 font-bold text-slate-800">
                                  {entry.procedure}
                                  {entry.isVoid && <span className="ml-2 bg-red-100 text-red-600 text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-tighter">Void</span>}
                                  {entry.isLocked && <span className="ml-2 bg-teal-100 text-teal-700 text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-tighter flex items-center gap-1 w-fit mt-1"><ShieldCheck size={10}/> Sealed</span>}
                                  {entry.amendmentInfo && <span className="ml-2 bg-lilac-100 text-lilac-700 text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-tighter flex items-center gap-1 w-fit mt-1"><Edit3 size={10}/> Amended</span>}
                              </td>
                              <td className="p-3 text-slate-600">
                                  <div className={`${entry.isVoid ? 'line-through opacity-50 italic' : ''} whitespace-pre-wrap leading-relaxed`}>{entry.notes}</div>
                                  <div className="text-[9px] text-slate-400 mt-2 flex items-center gap-1 font-bold">BY: {entry.author} {entry.isLocked && <span className="text-teal-600">• SIGNED: {new Date(entry.lockedInfo!.at).toLocaleString()}</span>}</div>
                              </td>
                              <td className="p-3 text-right font-mono font-bold">₱{entry.price?.toLocaleString()}</td>
                              <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                      {/* AMEND BUTTON */}
                                      {!entry.isVoid && !entry.isLocked && !readOnly && (
                                          <button onClick={() => setAmendmentEntry(entry)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-lilac-600 hover:bg-lilac-50 rounded-lg transition-all" title="Amend Record"><Edit3 size={16}/></button>
                                      )}
                                      
                                      {/* HISTORY BUTTON (New Feature) */}
                                      {(entry.amendmentInfo || entry.isVoid) && (
                                          <button 
                                            onClick={() => setViewingHistoryEntry(entry)} 
                                            className="p-2 text-teal-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all" 
                                            title="View Audit Trail"
                                          >
                                              <Clock size={16}/>
                                          </button>
                                      )}
                                      
                                      {entry.isLocked && !entry.amendmentInfo && !entry.isVoid && (
                                          <Lock size={14} className="text-slate-300" />
                                      )}
                                  </div>
                              </td>
                          </tr>
                      ))
                  )}
              </tbody>
          </table>
      </div>
      
      {amendmentEntry && <AmendmentModal entry={amendmentEntry} onSave={handleAmend} onClose={() => setAmendmentEntry(null)} />}
      
      {/* HISTORY MODAL RENDERING */}
      {viewingHistoryEntry && (
          <ClinicalHistoryModal 
            entry={viewingHistoryEntry} 
            allEntries={entries} 
            onClose={() => setViewingHistoryEntry(null)} 
          />
      )}
    </div>
  );
};

export default Odontonotes;

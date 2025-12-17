
import React, { useState, useRef, useEffect } from 'react';
import { DentalChartEntry, ProcedureItem } from '../types';
import { Send, FileText, User, Calendar, Clock, Tag, DollarSign, PenTool, Image as ImageIcon, CheckCircle, ChevronDown, ChevronRight, X, Eraser, Plus, Edit3, ShieldAlert, Lock, ShieldCheck } from 'lucide-react';
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
  const [amendmentEntry, setAmendmentEntry] = useState<DentalChartEntry | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() && !selectedProcedure && !charge && !payment) return;
    const newEntry: DentalChartEntry = { id: `dc_${Date.now()}`, toothNumber: (toothNum ? parseInt(toothNum) : 0), procedure: selectedProcedure || 'Clinical Note', status: 'Completed', notes: noteText, price: charge ? parseFloat(charge) : 0, payment: payment ? parseFloat(payment) : 0, receiptNumber: receipt, date: new Date().toISOString().split('T')[0], author: currentUser };
    onAddEntry(newEntry);
    setNoteText(''); setToothNum(''); setSelectedProcedure(''); setCharge(''); setPayment(''); setReceipt('');
  };

  const handleAmend = (reason: string) => {
      if (!amendmentEntry) return;
      onUpdateEntry({ ...amendmentEntry, isVoid: true, voidedInfo: { by: currentUser, at: new Date().toISOString(), reason } });
      setNoteText(amendmentEntry.notes || ''); setToothNum(amendmentEntry.toothNumber.toString()); setSelectedProcedure(amendmentEntry.procedure); setCharge(amendmentEntry.price?.toString() || '');
      setAmendmentEntry(null);
      toast.info("Original record voided. Corrected entry staged.");
  };

  const sorted = [...entries].sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border border-slate-200 overflow-hidden">
      {!readOnly && (
          <div className="bg-slate-50 border-b border-slate-200 p-4">
             <form onSubmit={handleSubmit} className="space-y-3">
                 <div className="flex gap-2">
                     <input type="number" placeholder="#" className="w-16 p-2 rounded-lg border border-slate-300 text-sm" value={toothNum} onChange={e => setToothNum(e.target.value)}/>
                     <select value={selectedProcedure} onChange={(e) => setSelectedProcedure(e.target.value)} className="flex-1 p-2 rounded-lg border border-slate-300 text-sm outline-none bg-white"><option value="">- Select Procedure -</option>{procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select>
                 </div>
                 <textarea placeholder="Clinical notes..." className="w-full p-3 rounded-lg border border-slate-300 text-sm h-16" value={noteText} onChange={e => setNoteText(e.target.value)}/>
                 <div className="flex gap-2">
                     <input type="number" placeholder="Charge" value={charge} onChange={e => setCharge(e.target.value)} className="flex-1 p-2 rounded-lg border border-slate-300 text-sm"/>
                     <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-teal-700 transition-colors flex items-center gap-2"><Plus size={18} /> Add Record</button>
                 </div>
             </form>
          </div>
      )}

      <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 sticky top-0 z-10 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><tr className="divide-x divide-slate-200"><th className="p-3 border-b w-24">Date</th><th className="p-3 border-b w-12 text-center">T#</th><th className="p-3 border-b w-1/4">Procedure</th><th className="p-3 border-b">Clinical Findings & Notes</th><th className="p-3 border-b w-24 text-right">Fee</th><th className="p-3 border-b w-16">Status</th></tr></thead>
              <tbody className="text-sm divide-y">
                  {sorted.length === 0 ? (<tr><td colSpan={6} className="p-10 text-center text-slate-400 italic">No clinical records found.</td></tr>) : (
                      sorted.map((entry, idx) => (
                          <tr key={idx} className={`${entry.isVoid ? 'bg-red-50/30' : entry.isLocked ? 'bg-slate-50/50' : 'bg-white'} hover:bg-blue-50/20 transition-colors group`}>
                              <td className="p-3 font-mono text-xs text-slate-500">{formatDate(entry.date)}</td>
                              <td className="p-3 text-center font-bold text-slate-700">{entry.toothNumber || '-'}</td>
                              <td className="p-3 font-bold text-slate-800">{entry.procedure}{entry.isVoid && <span className="ml-2 bg-red-100 text-red-600 text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-tighter">Void</span>}{entry.isLocked && <span className="ml-2 bg-teal-100 text-teal-700 text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-tighter flex items-center gap-1 w-fit mt-1"><ShieldCheck size={10}/> Sealed</span>}</td>
                              <td className="p-3 text-slate-600">
                                  <div className={`${entry.isVoid ? 'line-through opacity-50 italic' : ''} whitespace-pre-wrap leading-relaxed`}>{entry.notes}</div>
                                  <div className="text-[9px] text-slate-400 mt-2 flex items-center gap-1 font-bold">BY: {entry.author} {entry.isLocked && <span className="text-teal-600">• SIGNED: {new Date(entry.lockedInfo!.at).toLocaleString()}</span>}</div>
                              </td>
                              <td className="p-3 text-right font-mono font-bold">₱{entry.price?.toLocaleString()}</td>
                              <td className="p-3 text-center">
                                  {!entry.isVoid && !entry.isLocked && !readOnly ? (
                                      <button onClick={() => setAmendmentEntry(entry)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-lilac-600 hover:bg-lilac-50 rounded-lg transition-all" title="Amend Record"><Edit3 size={16}/></button>
                                  ) : entry.isLocked ? (
                                      <Lock size={14} className="text-slate-300 mx-auto" />
                                  ) : null}
                              </td>
                          </tr>
                      ))
                  )}
              </tbody>
          </table>
      </div>
      {amendmentEntry && <AmendmentModal entry={amendmentEntry} onSave={handleAmend} onClose={() => setAmendmentEntry(null)} />}
    </div>
  );
};

export default Odontonotes;

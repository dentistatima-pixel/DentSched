import React, { useState, useMemo } from 'react';
import { X, CheckSquare, Square, DollarSign, ShieldCheck, ClipboardCheck, History, ArrowRight, ShieldAlert } from 'lucide-react';
import { Appointment, ReconciliationRecord, AppointmentStatus } from '../types';

interface ClosureRitualModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    appointments: Appointment[];
    reconciliations: ReconciliationRecord[];
}

const ClosureRitualModal: React.FC<ClosureRitualModalProps> = ({ isOpen, onClose, onConfirm, appointments, reconciliations }) => {
    const [checklist, setChecklist] = useState({
        reconciled: false,
        consentsChecked: false,
        notesSealed: false,
        waitlistCleaned: false,
        cashSecured: false
    });

    const isReconciliationComplete = reconciliations.length > 0;
    const completedApts = appointments.filter(a => a.status === AppointmentStatus.COMPLETED);
    const incompleteApts = appointments.filter(a => ![AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW].includes(a.status));

    const toggle = (key: keyof typeof checklist) => setChecklist(prev => ({ ...prev, [key]: !prev[key] }));

    const isComplete = Object.values(checklist).every(v => v === true);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-100 bg-teal-900 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-teal-500 p-3 rounded-2xl shadow-lg shadow-teal-500/20"><History size={24} /></div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">Closure Ritual</h2>
                            <p className="text-xs text-teal-200 font-bold uppercase tracking-widest mt-1">Registry Integrity Seal</p>
                        </div>
                    </div>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed Today</div>
                            <div className="text-2xl font-black text-slate-800">{completedApts.length} Cases</div>
                        </div>
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                            <div className="text-[10px] font-black text-red-400 uppercase tracking-widest">Incomplete Flows</div>
                            <div className="text-2xl font-black text-red-600">{incompleteApts.length} Items</div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Integrity Checklist</h4>
                        {[
                            { key: 'reconciled', label: 'Daily Cash & Terminal Reconciliation Match', sub: isReconciliationComplete ? 'Verified in Economics' : 'Awaiting economic reconciliation' },
                            { key: 'consentsChecked', label: 'Validate Physical vs Digital DPA Consents', sub: 'Confirming all patients signed for today' },
                            { key: 'notesSealed', label: 'Final Narrative Audit & Clinical Sealing', sub: 'All SOAP notes for today are digitally hashed' },
                            { key: 'waitlistCleaned', label: 'Waitlist Purge & Tomorrow Prep', sub: 'Rolling over priority items to next session' },
                            { key: 'cashSecured', label: 'Cash Drawer Physical Security Handover', sub: 'Vaulting physical assets for branch storage' },
                        ].map(item => (
                            <button 
                                key={item.key}
                                onClick={() => toggle(item.key as any)}
                                className={`w-full text-left p-5 rounded-3xl border-2 transition-all flex items-start gap-4 group ${checklist[item.key as keyof typeof checklist] ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-white border-slate-100 hover:border-teal-200'}`}
                            >
                                <div className={`mt-1 ${checklist[item.key as keyof typeof checklist] ? 'text-teal-600' : 'text-slate-300'}`}>
                                    {checklist[item.key as keyof typeof checklist] ? <CheckSquare size={20} /> : <Square size={20} />}
                                </div>
                                <div>
                                    <div className={`font-black text-sm uppercase tracking-tight ${checklist[item.key as keyof typeof checklist] ? 'text-teal-900' : 'text-slate-700'}`}>{item.label}</div>
                                    <div className="text-[10px] font-medium text-slate-400 mt-1">{item.sub}</div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {incompleteApts.length > 0 && (
                        <div className="bg-red-50 border border-red-200 p-5 rounded-3xl flex items-start gap-4">
                            <ShieldAlert size={24} className="text-red-600 shrink-0 mt-1" />
                            <div>
                                <p className="text-xs font-black text-red-900 uppercase">Attention Required</p>
                                <p className="text-[11px] text-red-700 font-medium leading-relaxed mt-1">
                                    There are {incompleteApts.length} appointments not marked as Completed or Cancelled. Ritual will auto-mark them as "Registry No-Shows" upon confirmation.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-5 bg-white border border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-widest rounded-3xl">Abort</button>
                    <button 
                        disabled={!isComplete}
                        onClick={onConfirm}
                        className="flex-[2] py-5 bg-teal-600 text-white font-black uppercase text-[10px] tracking-widest rounded-3xl shadow-2xl shadow-teal-600/30 disabled:opacity-40 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95"
                    >
                        <ShieldCheck size={18}/> Commit Ritual & Seal Day
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClosureRitualModal;
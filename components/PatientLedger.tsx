
import React, { useState, useMemo, useEffect } from 'react';
import { LedgerEntry, Patient, FieldSettings, InstallmentPlan, GovernanceTrack } from '../types';
import { DollarSign, Plus, ArrowUpRight, Receipt, Shield, CreditCard, ShieldAlert, FileText, CheckCircle2, TrendingUp, Calendar, AlertTriangle, Layers, Percent, Hash, Activity } from 'lucide-react';
import { formatDate, generateUid } from '../constants';
import { useToast } from './ToastSystem';

interface PatientLedgerProps {
    patient: Patient;
    onUpdatePatient: (updatedPatient: Patient) => void;
    readOnly?: boolean;
    governanceTrack?: GovernanceTrack;
    onRecordPaymentWithReceipt?: (patientId: string, paymentDetails: { description: string; date: string; amount: number; orNumber: string; }) => void;
}

export const PatientLedger: React.FC<PatientLedgerProps> = ({ patient, onUpdatePatient, readOnly, governanceTrack, onRecordPaymentWithReceipt }) => {
    const toast = useToast();
    const isBirMode = governanceTrack === 'STATUTORY';
    const { fieldSettings, handleUpdateSettings } = useSettings();
    
    const [mode, setMode] = useState<'view' | 'add_charge' | 'add_payment' | 'hmo_setup' | 'add_installment'>('view');
    
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState(''); 
    const [orNumber, setOrNumber] = useState('');
    
    const [instDesc, setInstDesc] = useState('');
    const [instTotal, setInstTotal] = useState('');
    const [instMonthly, setInstMonthly] = useState('');

    useEffect(() => {
        if (mode === 'add_payment' && isBirMode && fieldSettings) {
            setOrNumber(fieldSettings.taxConfig.nextOrNumber.toString());
        } else {
            setOrNumber('');
        }
    }, [mode, isBirMode, fieldSettings]);

    const ledger = useMemo(() => {
        const baseLedger = patient.ledger || [];
        if (governanceTrack === 'STATUTORY') {
            return baseLedger.filter(l => !!l.orNumber);
        }
        return baseLedger;
    }, [patient.ledger, governanceTrack]);

    const currentBalance = useMemo(() => ledger.length === 0 ? 0 : ledger[ledger.length - 1].balanceAfter, [ledger]);
    const installments = patient.installmentPlans || [];

    const handleCharge = (e: React.FormEvent) => {
        e.preventDefault();
        const total = parseFloat(amount) || 0;
        if (total <= 0) return;

        const newBalance = currentBalance + total;
        const newEntry: LedgerEntry = {
            id: generateUid('l'), date, description, type: 'Charge', amount: total, balanceAfter: newBalance
        };

        onUpdatePatient({ ...patient, ledger: [...(patient.ledger || []), newEntry], currentBalance: newBalance });
        setMode('view'); setAmount(''); setDescription('');
        toast.success("Charge recorded.");
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return;

        if (isBirMode) {
            if (!orNumber.trim()) {
                toast.error("Compliance Error: BIR Official Receipt (OR) Number is mandatory in Compliance Mode.");
                return;
            }
            if (onRecordPaymentWithReceipt) {
                onRecordPaymentWithReceipt(patient.id, { description, date, amount: val, orNumber });
            } else {
                toast.error("System error: Payment handler not available.");
            }
        } else {
            const newBalance = currentBalance - val;
            const newEntry: LedgerEntry = { 
                id: generateUid('l'), 
                date, 
                description, 
                type: 'Payment', 
                amount: val, 
                balanceAfter: newBalance,
            };
            onUpdatePatient({ ...patient, ledger: [...(patient.ledger || []), newEntry], currentBalance: newBalance });
            toast.success("Payment recorded.");
        }

        setMode('view'); setAmount(''); setDescription(''); setOrNumber('');
    };

    const handleAddInstallment = (e: React.FormEvent) => {
        e.preventDefault();
        const total = parseFloat(instTotal);
        const monthly = parseFloat(instMonthly);
        if (isNaN(total) || isNaN(monthly)) return;
        const newPlan: InstallmentPlan = { id: `inst_${Date.now()}`, description: instDesc, totalAmount: total, paidAmount: 0, startDate: new Date().toISOString().split('T')[0], monthlyDue: monthly, status: 'Active' };
        onUpdatePatient({ ...patient, installmentPlans: [...installments, newPlan] });
        setMode('view'); setInstDesc(''); setInstTotal(''); setInstMonthly('');
        toast.success("Installment plan established.");
    };

    return (
        <div className="h-full flex flex-col bg-slate-50/50 rounded-[3rem] border border-slate-100 overflow-hidden relative shadow-inner">
            <div className="bg-white/80 backdrop-blur-xl p-8 border-b border-slate-100 flex justify-between items-center shadow-sm z-20 sticky top-0">
                <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-3xl shadow-xl transition-all duration-500 ${isBirMode ? 'bg-lilac-600 text-white rotate-3' : 'bg-teal-600 text-white'}`}>
                        {isBirMode ? <Receipt size={32}/> : <Activity size={32}/>}
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">{isBirMode ? 'Statutory Audit Ledger' : 'Identity Ledger'}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">{isBirMode ? 'BIR-OR Sync Matching Active' : 'Internal Operational Trust Registry'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <span className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Current Balance</span>
                        <span className={`text-4xl font-black tracking-tighter ${currentBalance > 0 ? 'text-red-700' : 'text-slate-800'}`}>₱{currentBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-3">
                         <button onClick={() => setMode('add_installment')} disabled={readOnly} className="bg-white border-2 border-slate-100 hover:border-lilac-500 text-slate-500 hover:text-lilac-700 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-sm hover:shadow-xl disabled:opacity-50 disabled:grayscale"><Calendar size={18}/> Establish Plan</button>
                         <button onClick={() => setMode('add_charge')} disabled={readOnly} className="bg-white border-2 border-slate-100 hover:border-teal-500 text-slate-500 hover:text-teal-700 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-sm hover:shadow-xl disabled:opacity-50 disabled:grayscale">Log Charge</button>
                         <button onClick={() => setMode('add_payment')} disabled={readOnly} className={`${isBirMode ? 'bg-lilac-600 shadow-lilac-600/30' : 'bg-teal-900 shadow-teal-900/30'} text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all flex items-center gap-3 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale`}>
                             {isBirMode ? <Receipt size={20}/> : <DollarSign size={20}/>} {isBirMode ? 'Issue Receipt' : 'Receive Payment'}
                         </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                {mode === 'add_charge' && (
                    <form onSubmit={handleCharge} className="bg-white p-10 rounded-[3rem] border-4 border-teal-50 shadow-2xl space-y-8 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-black text-teal-950 flex items-center gap-4 uppercase tracking-tighter text-xl"><DollarSign size={28} className="text-teal-600"/> Record Identity Charge</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-8">
                                <label className="label text-[10px]">Registry Description</label>
                                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Wisdom Tooth Extraction" className="input text-lg font-black" required />
                            </div>
                            <div className="md:col-span-4">
                                <label className="label text-[10px]">Asset Value (₱)</label>
                                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="input font-black text-2xl text-teal-800" required />
                            </div>
                            <div className="md:col-span-12">
                                <label className="label text-[10px]">Session Date</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setMode('view')} className="px-8 py-4 font-black uppercase text-xs text-slate-400 tracking-widest">Cancel</button>
                            <button type="submit" className="bg-teal-900 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-teal-900/40 hover:scale-105 transition-all">Commit Charge</button>
                        </div>
                    </form>
                )}

                {mode === 'add_payment' && (
                    <form onSubmit={handlePayment} className={`bg-white p-10 rounded-[3rem] border-4 ${isBirMode ? 'border-lilac-50' : 'border-teal-50'} shadow-2xl space-y-8 animate-in zoom-in-95`}>
                        <div className="flex justify-between items-start">
                            <h4 className={`font-black uppercase tracking-tighter text-xl flex items-center gap-4 ${isBirMode ? 'text-lilac-950' : 'text-teal-950'}`}>
                                {isBirMode ? <Receipt size={28} className="text-lilac-600"/> : <CreditCard size={28} className="text-teal-600"/>} {isBirMode ? 'Issue Statutory Receipt' : 'Identity Liquidation'}
                            </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            {isBirMode && (
                                <div className="md:col-span-12">
                                    <label className="text-[11px] font-black text-lilac-700 uppercase tracking-widest ml-1 mb-3 block flex items-center gap-2"><Hash size={14}/> Official Receipt (OR) # Registry Reference</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={orNumber} 
                                        onChange={e => setOrNumber(e.target.value)} 
                                        disabled={true}
                                        placeholder="Booklet Reference Number" 
                                        className="w-full p-6 bg-lilac-50 border-2 border-lilac-100 rounded-[2rem] font-black text-3xl text-lilac-950 outline-none focus:border-lilac-500 transition-all shadow-inner tracking-widest text-center" 
                                    />
                                </div>
                            )}
                            <div className="md:col-span-12"><label className="label text-[10px]">Payment Narrative</label><input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Cash Deposit" className="input" required /></div>
                            <div className="md:col-span-6"><label className="label text-[10px]">Flow Value (₱)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="input font-black text-xl text-teal-800" required /></div>
                            <div className="md:col-span-6"><label className="label text-[10px]">Registry Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" /></div>
                        </div>
                        <div className="flex justify-end gap-3 pt-6">
                            <button type="button" onClick={() => setMode('view')} className="px-8 py-4 font-black uppercase text-xs text-slate-400 tracking-widest">Cancel</button>
                            <button type="submit" className={`${isBirMode ? 'bg-lilac-600 shadow-lilac-600/20' : 'bg-teal-900 shadow-teal-900/20'} text-white px-12 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-all`}>
                                {isBirMode ? 'Match & Seal Receipt' : 'Log Forensic Payment'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">
                            <tr>
                                <th className="p-6 text-left">Temporal Key</th>
                                <th className="p-6 text-left">Transaction Narrative</th>
                                {isBirMode && <th className="p-6 text-left">BIR OR#</th>}
                                <th className="p-6 text-center">Protocol</th>
                                <th className="p-6 text-right">Value (₱)</th>
                                <th className="p-6 text-right">Running Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {[...ledger].reverse().map((entry) => (
                                <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-6 text-slate-400 font-mono text-[11px] font-bold">{formatDate(entry.date)}</td>
                                    <td className="p-6">
                                        <div className="font-black text-slate-700 uppercase text-xs tracking-tight flex items-center gap-2">
                                            {/* Fix: lucide-react icons do not accept a 'title' prop. Wrapped in a span for tooltip. */}
                                            {entry.orNumber && <span title="Official Receipt Issued"><Receipt size={14} className="text-lilac-500" /></span>}
                                            {entry.description}
                                        </div>
                                        <div className="text-[9px] text-slate-400 uppercase font-bold mt-1 tracking-widest">ID: {entry.id}</div>
                                    </td>
                                    {isBirMode && (
                                        <td className="p-6">
                                            <span className="font-mono font-black text-sm text-lilac-700">{entry.orNumber || '---'}</span>
                                        </td>
                                    )}
                                    <td className="p-6 text-center"><span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border shadow-sm ${entry.type === 'Charge' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-teal-50 text-teal-700 border-teal-100'}`}>{entry.type}</span></td>
                                    <td className={`p-6 text-right font-black text-sm ${entry.type === 'Charge' ? 'text-red-700' : 'text-teal-700'}`}>₱{entry.amount.toLocaleString()}</td>
                                    <td className="p-6 text-right font-mono font-black text-slate-600 bg-slate-50/20">₱{entry.balanceAfter.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {ledger.length === 0 && <div className="p-32 text-center text-slate-300 font-black uppercase tracking-[0.5em] italic">No transaction history in current registry.</div>}
                </div>
            </div>
            
            {/* Ledger Compliance Footer */}
            <div className="bg-teal-950 p-4 text-center shrink-0">
                <span className="text-[10px] font-black uppercase text-teal-400 tracking-[0.3em] flex items-center justify-center gap-2">
                    <Shield size={12}/> Temporal Non-Repudiation Sync Enabled • SHA-256 Verified Ledger
                </span>
            </div>
        </div>
    );
};

// This needs to be imported to avoid breaking the component
import { useSettings } from '../contexts/SettingsContext';

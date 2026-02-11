import React, { useState, useMemo, useEffect } from 'react';
import { LedgerEntry, Patient, FieldSettings, InstallmentPlan, GovernanceTrack } from '../types';
import { DollarSign, Plus, ArrowUpRight, Receipt, Shield, CreditCard, ShieldAlert, FileText, CheckCircle2, TrendingUp, Calendar, AlertTriangle, Layers, Percent, Hash, Activity } from 'lucide-react';
import { formatDate, generateUid } from '../constants';
import { useToast } from './ToastSystem';
import { useSettings } from '../contexts/SettingsContext';

interface PatientLedgerProps {
    patient: Patient;
    onUpdatePatient: (updatedPatient: Partial<Patient>) => Promise<void>;
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

    const handleCharge = async (e: React.FormEvent) => {
        e.preventDefault();
        const total = parseFloat(amount) || 0;
        if (total <= 0) return;

        const newBalance = currentBalance + total;
        const newEntry: LedgerEntry = {
            id: generateUid('l'), date, description, type: 'Charge', amount: total, balanceAfter: newBalance
        };

        await onUpdatePatient({ ...patient, ledger: [...(patient.ledger || []), newEntry], currentBalance: newBalance });
        setMode('view'); setAmount(''); setDescription('');
        toast.success("Charge recorded.");
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return;

        const nextOrNumber = fieldSettings.taxConfig.nextOrNumber;
        const orNumStr = nextOrNumber.toString();

        if (isBirMode) {
            if (onRecordPaymentWithReceipt) {
                onRecordPaymentWithReceipt(patient.id, { description, date, amount: val, orNumber: orNumStr });
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
                orNumber: orNumStr,
                orDate: new Date().toISOString()
            };
            await onUpdatePatient({ ...patient, ledger: [...(patient.ledger || []), newEntry], currentBalance: newBalance });
            const nextOr = nextOrNumber + 1;
            await handleUpdateSettings({ ...fieldSettings, taxConfig: { ...fieldSettings.taxConfig, nextOrNumber: nextOr } });
            toast.success("Payment recorded with OR #" + orNumStr);
        }

        setMode('view'); setAmount(''); setDescription(''); setOrNumber('');
    };

    const handleAddInstallment = async (e: React.FormEvent) => {
        e.preventDefault();
        const total = parseFloat(instTotal);
        const monthly = parseFloat(instMonthly);
        if (isNaN(total) || isNaN(monthly)) return;
        const newPlan: InstallmentPlan = { id: `inst_${Date.now()}`, description: instDesc, totalAmount: total, paidAmount: 0, startDate: new Date().toISOString().split('T')[0], monthlyDue: monthly, status: 'Active' };
        await onUpdatePatient({ ...patient, installmentPlans: [...installments, newPlan] });
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
                        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mt-2">{isBirMode ? 'BIR-OR Sync Matching Active' : 'Internal Operational Trust Registry'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <span className="block text-sm font-black uppercase text-slate-400 tracking-widest mb-1">Current Balance</span>
                        <span className={`text-4xl font-black tracking-tighter ${currentBalance > 0 ? 'text-red-700' : 'text-slate-800'}`}>₱{currentBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-3">
                         <button onClick={() => setMode('add_installment')} disabled={readOnly} className="bg-white border-2 border-slate-100 hover:border-lilac-500 text-slate-500 hover:text-lilac-700 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 shadow-sm hover:shadow-xl disabled:opacity-50 disabled:grayscale"><Calendar size={18}/> Establish Plan</button>
                         <button onClick={() => setMode('add_charge')} disabled={readOnly} className="bg-white border-2 border-slate-100 hover:border-teal-500 text-slate-500 hover:text-teal-700 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 shadow-sm hover:shadow-xl disabled:opacity-50 disabled:grayscale">Log Charge</button>
                         <button onClick={() => setMode('add_payment')} disabled={readOnly} className={`${isBirMode ? 'bg-lilac-600 shadow-lilac-600/30' : 'bg-teal-900 shadow-teal-900/30'} text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all flex items-center gap-3 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale`}>
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
                                <label className="label">Registry Description</label>
                                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Wisdom Tooth Extraction" className="input text-lg font-black" required />
                            </div>
                            <div className="md:col-span-4">
                                <label className="label">Asset Value (₱)</label>
                                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="input text-lg font-black" required />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                            <button type="button" onClick={() => setMode('view')} className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-sm tracking-widest">Cancel</button>
                            <button type="submit" className="px-10 py-3 bg-teal-600 text-white rounded-xl font-black uppercase text-sm tracking-widest shadow-lg shadow-teal-600/20">Record Charge</button>
                        </div>
                    </form>
                )}

                {mode === 'add_payment' && (
                     <form onSubmit={handlePayment} className="bg-white p-10 rounded-[3rem] border-4 border-lilac-50 shadow-2xl space-y-8 animate-in zoom-in-95">
                         <div className="flex justify-between items-center mb-2">
                             <h4 className="font-black text-lilac-950 flex items-center gap-4 uppercase tracking-tighter text-xl"><Receipt size={28} className="text-lilac-600"/> Receive Payment</h4>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                             <div className="md:col-span-4">
                                 <label className="label">Date of Payment</label>
                                 <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input text-lg font-black" />
                             </div>
                             <div className="md:col-span-8">
                                 <label className="label">Payment Narrative</label>
                                 <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. GCash Payment for Crown" className="input text-lg font-black" required />
                             </div>
                              <div className="md:col-span-6">
                                 <label className="label">Payment Value (₱)</label>
                                 <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="input text-lg font-black" required />
                             </div>
                             {isBirMode && (
                                <div className="md:col-span-6">
                                    <label className="label flex items-center gap-2"><Hash size={14}/> Official Receipt #</label>
                                    <input type="text" value={orNumber} readOnly={true} className="input text-lg font-black bg-slate-100" />
                                </div>
                             )}
                         </div>
                         <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                             <button type="button" onClick={() => setMode('view')} className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-sm tracking-widest">Cancel</button>
                             <button type="submit" className="px-10 py-3 bg-lilac-600 text-white rounded-xl font-black uppercase text-sm tracking-widest shadow-lg shadow-lilac-600/20">Record Payment</button>
                         </div>
                     </form>
                )}
                
                {mode === 'add_installment' && (
                     <form onSubmit={handleAddInstallment} className="bg-white p-10 rounded-[3rem] border-4 border-blue-50 shadow-2xl space-y-8 animate-in zoom-in-95">
                         <div className="flex justify-between items-center mb-2">
                             <h4 className="font-black text-blue-950 flex items-center gap-4 uppercase tracking-tighter text-xl"><Calendar size={28} className="text-blue-600"/> Establish Installment Plan</h4>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                             <div className="md:col-span-12">
                                <label className="label">Plan Description</label>
                                <input type="text" value={instDesc} onChange={e => setInstDesc(e.target.value)} placeholder="e.g., Orthodontic Treatment Downpayment" className="input text-lg font-black" required />
                             </div>
                             <div className="md:col-span-6">
                                <label className="label">Total Amount (₱)</label>
                                <input type="number" value={instTotal} onChange={e => setInstTotal(e.target.value)} className="input text-lg font-black" required />
                             </div>
                             <div className="md:col-span-6">
                                <label className="label">Monthly Due (₱)</label>
                                <input type="number" value={instMonthly} onChange={e => setInstMonthly(e.target.value)} className="input text-lg font-black" required />
                             </div>
                         </div>
                         <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                             <button type="button" onClick={() => setMode('view')} className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-sm tracking-widest">Cancel</button>
                             <button type="submit" className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-sm tracking-widest shadow-lg shadow-blue-600/20">Establish Plan</button>
                         </div>
                     </form>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                     {/* Transaction History */}
                     <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                         <h4 className="font-black text-sm text-slate-500 uppercase tracking-[0.3em] mb-4">Transaction History</h4>
                         <div className="space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                             {ledger.map(entry => (
                                 <div key={entry.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                                     <div>
                                         <div className="font-bold text-slate-800 text-base leading-tight">{entry.description}</div>
                                         <div className="text-xs text-slate-400 font-bold uppercase mt-1">{formatDate(entry.date)}</div>
                                     </div>
                                     <div className="text-right">
                                         <div className={`text-lg font-black ${entry.type === 'Charge' ? 'text-red-700' : 'text-teal-700'}`}>
                                             {entry.type === 'Charge' ? '+' : '-'}₱{entry.amount.toLocaleString()}
                                         </div>
                                         <div className="text-xs text-slate-400 font-bold">Bal: ₱{entry.balanceAfter.toLocaleString()}</div>
                                     </div>
                                 </div>
                             ))}
                             {ledger.length === 0 && <div className="text-center p-12 text-slate-400 italic">No transactions recorded.</div>}
                         </div>
                     </div>
                     {/* Installment Plans */}
                     <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                         <h4 className="font-black text-sm text-slate-500 uppercase tracking-[0.3em] mb-4">Installment Plans</h4>
                          <div className="space-y-4">
                            {installments.map(plan => (
                                <div key={plan.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                    <div className="flex justify-between items-start">
                                        <div className="font-bold text-slate-800">{plan.description}</div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${plan.status === 'Active' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>{plan.status}</span>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex justify-between items-center text-xs text-slate-500 mb-1"><span className="font-bold">Progress</span><span className="font-bold">₱{plan.paidAmount.toLocaleString()} / ₱{plan.totalAmount.toLocaleString()}</span></div>
                                        <div className="w-full bg-slate-200 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${(plan.paidAmount/plan.totalAmount)*100}%`}}></div></div>
                                    </div>
                                    <div className="mt-3 text-right text-sm font-bold text-slate-600">Monthly: ₱{plan.monthlyDue.toLocaleString()}</div>
                                </div>
                            ))}
                            {installments.length === 0 && <div className="text-center p-12 text-slate-400 italic">No installment plans.</div>}
                          </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(PatientLedger);
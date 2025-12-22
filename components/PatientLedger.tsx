import React, { useState, useMemo, useEffect } from 'react';
import { LedgerEntry, Patient, FieldSettings, InstallmentPlan } from '../types';
import { DollarSign, Plus, ArrowUpRight, Receipt, Shield, CreditCard, ShieldAlert, FileText, CheckCircle2, TrendingUp, Calendar, AlertTriangle, Layers, Percent } from 'lucide-react';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';

interface PatientLedgerProps {
    patient: Patient;
    onUpdatePatient: (updatedPatient: Patient) => void;
    readOnly?: boolean;
    fieldSettings?: FieldSettings;
}

const PatientLedger: React.FC<PatientLedgerProps> = ({ patient, onUpdatePatient, readOnly, fieldSettings }) => {
    const toast = useToast();
    const [mode, setMode] = useState<'view' | 'add_charge' | 'add_payment' | 'hmo_setup' | 'add_installment'>('view');
    
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState(''); 
    
    const [instDesc, setInstDesc] = useState('');
    const [instTotal, setInstTotal] = useState('');
    const [instMonthly, setInstMonthly] = useState('');

    const ledger = useMemo(() => patient.ledger || [], [patient.ledger]);
    const currentBalance = useMemo(() => ledger.length === 0 ? 0 : ledger[ledger.length - 1].balanceAfter, [ledger]);
    const installments = patient.installmentPlans || [];

    const handleCharge = (e: React.FormEvent) => {
        e.preventDefault();
        const total = parseFloat(amount) || 0;
        if (total <= 0) return;

        const newBalance = currentBalance + total;
        const newEntry: LedgerEntry = {
            id: Math.random().toString(36).substr(2, 9), date, description, type: 'Charge', amount: total, balanceAfter: newBalance
        };

        onUpdatePatient({ ...patient, ledger: [...ledger, newEntry], currentBalance: newBalance });
        setMode('view'); setAmount(''); setDescription('');
        toast.success("Charge recorded.");
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return;
        const newBalance = currentBalance - val;
        const newEntry: LedgerEntry = { id: Math.random().toString(36).substr(2, 9), date, description, type: 'Payment', amount: val, balanceAfter: newBalance };
        onUpdatePatient({ ...patient, ledger: [...ledger, newEntry], currentBalance: newBalance });
        setMode('view'); setAmount(''); setDescription('');
        toast.success("Payment recorded.");
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
        <div className="h-full flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
            <div className="bg-white p-6 border-b flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4"><div className="bg-emerald-100 p-3 rounded-xl text-emerald-700"><DollarSign size={28}/></div><div><h3 className="font-bold text-lg">Financial Statement</h3><p className="text-xs text-slate-500">Billing & Account History</p></div></div>
                <div className="flex items-center gap-4">
                    <div className="text-right"><span className="block text-[10px] font-bold uppercase text-slate-400">Current Balance</span><span className={`text-2xl font-black ${currentBalance > 0 ? 'text-red-600' : 'text-slate-800'}`}>₱{currentBalance.toLocaleString()}</span></div>
                    {!readOnly && (
                        <div className="flex gap-2">
                             <button onClick={() => setMode('add_installment')} className="bg-lilac-100 hover:bg-lilac-200 text-lilac-700 px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-1"><Calendar size={16}/> Plan</button>
                             <button onClick={() => setMode('add_charge')} className="bg-slate-100 hover:bg-slate-200 border px-4 py-2 rounded-xl font-bold text-sm transition-colors">Charge</button>
                             <button onClick={() => setMode('add_payment')} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-all">Payment</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {mode === 'add_charge' && (
                    <form onSubmit={handleCharge} className="bg-white p-6 rounded-2xl border-2 border-teal-500 space-y-4 animate-in zoom-in-95 shadow-xl">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-black text-teal-900 flex items-center gap-2 uppercase tracking-widest text-sm"><DollarSign size={20}/> Record Patient Charge</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Description</label><input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Tooth Extraction" className="w-full p-3 rounded-xl border-slate-200 focus:border-teal-500 outline-none" required /></div>
                            <div><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Amount (₱)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full p-3 rounded-xl border-slate-200 focus:border-teal-500 outline-none font-bold" required /></div>
                            <div className="md:col-span-3"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 rounded-xl border-slate-200 outline-none" /></div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setMode('view')} className="px-4 py-2 font-bold text-slate-400">Cancel</button><button type="submit" className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-teal-600/20">Commit Charge</button></div>
                    </form>
                )}

                {mode === 'add_payment' && (
                    <form onSubmit={handlePayment} className="bg-white p-6 rounded-2xl border-2 border-emerald-500 space-y-4 animate-in zoom-in-95 shadow-xl">
                        <h4 className="font-bold text-emerald-900 flex items-center gap-2"><CreditCard size={20}/> Receive Payment</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (e.g. Cash Payment)" className="col-span-2 p-3 rounded-xl border" required />
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (₱)" className="p-3 rounded-xl border font-bold" required />
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-3 rounded-xl border" />
                        </div>
                        <div className="flex justify-end gap-2"><button type="button" onClick={() => setMode('view')} className="px-4 py-2 font-bold text-slate-400">Cancel</button><button type="submit" className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20">Log Payment</button></div>
                    </form>
                )}

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]"><tr><th className="p-4 text-left">Date</th><th className="p-4 text-left">Description</th><th className="p-4 text-left">Type</th><th className="p-4 text-right">Amount</th><th className="p-4 text-right">Balance</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {[...ledger].reverse().map((entry) => (
                                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-500 font-mono text-xs">{formatDate(entry.date)}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-700">{entry.description}</div>
                                    </td>
                                    <td className="p-4"><span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${entry.type === 'Charge' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{entry.type}</span></td>
                                    <td className={`p-4 text-right font-bold ${entry.type === 'Charge' ? 'text-red-600' : 'text-emerald-600'}`}>₱{entry.amount.toLocaleString()}</td>
                                    <td className="p-4 text-right font-mono font-bold text-slate-600 bg-slate-50/30">₱{entry.balanceAfter.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PatientLedger;

import React, { useState, useMemo } from 'react';
import { LedgerEntry, Patient } from '../types';
import { DollarSign, Plus, ArrowUpRight, ArrowDownLeft, Receipt, Calendar, CreditCard } from 'lucide-react';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';

interface PatientLedgerProps {
    patient: Patient;
    onUpdatePatient: (updatedPatient: Patient) => void;
    readOnly?: boolean;
}

const PatientLedger: React.FC<PatientLedgerProps> = ({ patient, onUpdatePatient, readOnly }) => {
    const toast = useToast();
    const [mode, setMode] = useState<'view' | 'add_charge' | 'add_payment'>('view');
    
    // Form State
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const ledger = useMemo(() => patient.ledger || [], [patient.ledger]);
    const currentBalance = useMemo(() => {
        if (ledger.length === 0) return 0;
        return ledger[ledger.length - 1].balanceAfter;
    }, [ledger]);

    const handleTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        if (!description.trim()) {
            toast.error("Please enter a description");
            return;
        }

        const type = mode === 'add_charge' ? 'Charge' : 'Payment';
        
        // Calculate new balance
        // Charge increases balance (Patient owes more)
        // Payment decreases balance (Patient owes less)
        const newBalance = type === 'Charge' 
            ? currentBalance + val 
            : currentBalance - val;

        const newEntry: LedgerEntry = {
            id: Math.random().toString(36).substr(2, 9),
            date,
            description,
            type,
            amount: val,
            balanceAfter: newBalance,
            notes: ''
        };

        const updatedLedger = [...ledger, newEntry];
        
        onUpdatePatient({
            ...patient,
            ledger: updatedLedger,
            currentBalance: newBalance
        });

        toast.success(`${type} recorded successfully`);
        setMode('view');
        setAmount('');
        setDescription('');
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            
            {/* Header / Stats */}
            <div className="bg-white p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-100 p-3 rounded-xl text-emerald-700">
                        <DollarSign size={28} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Financial Ledger</h3>
                        <p className="text-xs text-slate-500">Statement of Account & Payments</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <span className="block text-[10px] font-bold uppercase text-slate-400">Outstanding Balance</span>
                        <span className={`text-2xl font-bold ${currentBalance > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                            ₱{currentBalance.toLocaleString()}
                        </span>
                    </div>
                    {!readOnly && (
                        <div className="flex gap-2">
                             <button 
                                onClick={() => { setMode('add_charge'); setDescription(''); setAmount(''); }}
                                className="bg-white border border-slate-200 text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
                             >
                                <Plus size={16} /> Charge
                             </button>
                             <button 
                                onClick={() => { setMode('add_payment'); setDescription('Payment - Cash'); setAmount(''); }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
                             >
                                <CreditCard size={16} /> Payment
                             </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Area (Conditional) */}
            {mode !== 'view' && (
                <div className="p-4 bg-slate-100 border-b border-slate-200 animate-in slide-in-from-top-2">
                    <form onSubmit={handleTransaction} className="max-w-3xl mx-auto bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                        <div className="flex-[2]">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                            <input 
                                type="text" 
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                placeholder={mode === 'add_charge' ? "e.g. Consultation Fee" : "e.g. Cash Payment"}
                                className="w-full p-2 border rounded-lg text-sm"
                                autoFocus 
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount</label>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={e => setAmount(e.target.value)} 
                                placeholder="0.00"
                                className="w-full p-2 border rounded-lg text-sm font-bold text-right" 
                            />
                        </div>
                        <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors h-[38px]">
                            Save
                        </button>
                        <button type="button" onClick={() => setMode('view')} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg font-bold h-[38px]">
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            {/* Ledger Table */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {ledger.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                        <Receipt size={48} className="mb-2"/>
                        <p>No transactions recorded.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Description</th>
                                    <th className="p-4 text-center">Type</th>
                                    <th className="p-4 text-right">Amount</th>
                                    <th className="p-4 text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {[...ledger].reverse().map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                                            {formatDate(entry.date)}
                                        </td>
                                        <td className="p-4 font-medium text-slate-700">
                                            {entry.description}
                                        </td>
                                        <td className="p-4 text-center">
                                            {entry.type === 'Charge' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-600 text-[10px] font-bold uppercase">
                                                    <ArrowUpRight size={10} /> Charge
                                                </span>
                                            )}
                                            {entry.type === 'Payment' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase">
                                                    <ArrowDownLeft size={10} /> Payment
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right font-bold text-slate-700">
                                            ₱{entry.amount.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold text-slate-500 bg-slate-50/50 group-hover:bg-slate-100/50 transition-colors">
                                            ₱{entry.balanceAfter.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientLedger;

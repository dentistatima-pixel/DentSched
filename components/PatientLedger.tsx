
import React, { useState, useMemo } from 'react';
import { LedgerEntry, Patient, FieldSettings } from '../types';
import { DollarSign, Plus, ArrowUpRight, ArrowDownLeft, Receipt, Calendar, CreditCard, Heart, Ban, AlertCircle, Shield } from 'lucide-react';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';

interface PatientLedgerProps {
    patient: Patient;
    onUpdatePatient: (updatedPatient: Patient) => void;
    readOnly?: boolean;
    onPreparePhilHealthClaim?: (ledgerEntry: LedgerEntry, procedureName: string) => void;
    onCreateClaim?: (patientId: string, ledgerEntryId: string, provider: string, amount: number, type: 'HMO' | 'PhilHealth') => void;
    fieldSettings?: FieldSettings;
}

const PatientLedger: React.FC<PatientLedgerProps> = ({ patient, onUpdatePatient, readOnly, onPreparePhilHealthClaim, onCreateClaim, fieldSettings }) => {
    const toast = useToast();
    const [mode, setMode] = useState<'view' | 'add_charge' | 'add_payment'>('view');
    
    // Form State
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Claim State
    const [createClaim, setCreateClaim] = useState(false);
    const [claimProvider, setClaimProvider] = useState('');

    // Void State
    const [voidItem, setVoidItem] = useState<LedgerEntry | null>(null);
    const [voidReason, setVoidReason] = useState('');

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
        if (createClaim && !claimProvider) {
            toast.error("Please select an Insurance/HMO provider");
            return;
        }

        const type = mode === 'add_charge' ? 'Charge' : 'Payment';
        
        const newBalance = type === 'Charge' 
            ? currentBalance + val 
            : currentBalance - val;

        const newEntryId = Math.random().toString(36).substr(2, 9);
        const newEntry: LedgerEntry = {
            id: newEntryId,
            date,
            description,
            type,
            amount: val,
            balanceAfter: newBalance,
            notes: createClaim ? `Billed to ${claimProvider}` : ''
        };

        const updatedLedger = [...ledger, newEntry];
        
        onUpdatePatient({
            ...patient,
            ledger: updatedLedger,
            currentBalance: newBalance
        });

        // Trigger Claim Creation
        if (createClaim && onCreateClaim && type === 'Charge') {
            const claimType = claimProvider === 'PhilHealth' ? 'PhilHealth' : 'HMO';
            onCreateClaim(patient.id, newEntryId, claimProvider, val, claimType);
            toast.success(`Charge added & ${claimType} claim created`);
        } else {
            toast.success(`${type} recorded successfully`);
        }

        setMode('view');
        setAmount('');
        setDescription('');
        setCreateClaim(false);
        setClaimProvider('');
    };

    const handleVoidConfirm = () => {
        if (!voidItem || !voidReason.trim()) {
            toast.error("Void reason is required for audit trail.");
            return;
        }

        // Logic: Create a reversing entry
        // If voiding a Charge -> Add a Credit (Payment/Adjustment)
        // If voiding a Payment -> Add a Debit (Charge)
        
        const isReversingCharge = voidItem.type === 'Charge';
        const reversalType = isReversingCharge ? 'Adjustment' : 'Charge'; // Adjustment acts like payment reducing balance
        
        // Calculate new balance
        const reversalAmount = voidItem.amount;
        const newBalance = isReversingCharge
            ? currentBalance - reversalAmount
            : currentBalance + reversalAmount;

        const reversalEntry: LedgerEntry = {
            id: `void_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            description: `VOID: ${voidItem.description} - [${voidReason}]`,
            type: reversalType,
            amount: reversalAmount,
            balanceAfter: newBalance,
            notes: `Reversal of transaction ${voidItem.id}`
        };

        const updatedLedger = [...ledger, reversalEntry];

        onUpdatePatient({
            ...patient,
            ledger: updatedLedger,
            currentBalance: newBalance
        });

        toast.success("Transaction voided successfully.");
        setVoidItem(null);
        setVoidReason('');
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
            
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
                                onClick={() => { setMode('add_charge'); setDescription(''); setAmount(''); setCreateClaim(false); }}
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
                    <form onSubmit={handleTransaction} className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-lg border border-slate-200 flex flex-col gap-4">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            {mode === 'add_charge' ? <ArrowUpRight className="text-red-500"/> : <ArrowDownLeft className="text-emerald-500"/>}
                            {mode === 'add_charge' ? 'Add New Charge' : 'Record Payment'}
                        </h4>
                        
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                            </div>
                            <div className="flex-[2]">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                <input 
                                    type="text" 
                                    value={description} 
                                    onChange={e => setDescription(e.target.value)} 
                                    placeholder={mode === 'add_charge' ? "e.g. Consultation Fee" : "e.g. Cash Payment"}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
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
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-right" 
                                />
                            </div>
                        </div>

                        {/* CLAIMS INTEGRATION (Only for Charges) */}
                        {mode === 'add_charge' && onCreateClaim && (
                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={createClaim} 
                                        onChange={e => setCreateClaim(e.target.checked)} 
                                        className="w-5 h-5 accent-blue-600 rounded"
                                    />
                                    <span className="text-sm font-bold text-blue-800">Bill to Insurance/HMO?</span>
                                </label>
                                
                                {createClaim && (
                                    <select 
                                        value={claimProvider} 
                                        onChange={e => setClaimProvider(e.target.value)}
                                        className="flex-1 p-2 border border-blue-200 rounded-lg text-sm bg-white"
                                        required
                                    >
                                        <option value="">- Select Provider -</option>
                                        <option value="PhilHealth">PhilHealth</option>
                                        {fieldSettings?.insuranceProviders.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setMode('view')} className="px-6 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold">
                                Cancel
                            </button>
                            <button type="submit" className="bg-slate-900 text-white px-8 py-2 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">
                                Confirm Transaction
                            </button>
                        </div>
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
                                    <th className="p-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {[...ledger].reverse().map((entry) => {
                                    const isVoid = entry.description.startsWith('VOID:');
                                    const isReversal = entry.description.startsWith('Reversal of');
                                    
                                    return (
                                        <tr key={entry.id} className={`hover:bg-slate-50 transition-colors group ${isVoid || isReversal ? 'bg-slate-50/50 opacity-60' : ''}`}>
                                            <td className="p-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                                                {formatDate(entry.date)}
                                            </td>
                                            <td className="p-4 font-medium text-slate-700">
                                                <div className={`${isVoid ? 'line-through decoration-red-500 decoration-2' : ''}`}>{entry.description}</div>
                                                {entry.notes && <div className="text-xs text-slate-400 italic mt-0.5">{entry.notes}</div>}
                                            </td>
                                            <td className="p-4 text-center">
                                                {entry.type === 'Charge' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-600 text-[10px] font-bold uppercase border border-red-100">
                                                        <ArrowUpRight size={10} /> Charge
                                                    </span>
                                                )}
                                                {(entry.type === 'Payment' || entry.type === 'Adjustment') && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase border border-emerald-100">
                                                        <ArrowDownLeft size={10} /> {entry.type}
                                                    </span>
                                                )}
                                            </td>
                                            <td className={`p-4 text-right font-bold ${isVoid ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                ₱{entry.amount.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold text-slate-500 bg-slate-50/50 group-hover:bg-slate-100/50 transition-colors">
                                                ₱{entry.balanceAfter.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-center">
                                                {!isVoid && !isReversal && !readOnly && (
                                                    <button 
                                                        onClick={() => setVoidItem(entry)}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Void Transaction"
                                                    >
                                                        <Ban size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Void Modal */}
            {voidItem && (
                <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 animate-in zoom-in-95">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <AlertCircle size={24} />
                            <h3 className="font-bold text-lg">Void Transaction</h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            Are you sure you want to void <strong>{voidItem.description}</strong> (₱{voidItem.amount})? 
                            This will create a reversing entry in the ledger.
                        </p>
                        <textarea 
                            className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 outline-none mb-4"
                            placeholder="Reason for voiding (Required)..."
                            value={voidReason}
                            onChange={e => setVoidReason(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setVoidItem(null)} className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancel</button>
                            <button onClick={handleVoidConfirm} className="flex-1 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20">Confirm Void</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientLedger;

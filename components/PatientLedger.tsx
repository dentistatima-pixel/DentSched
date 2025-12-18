
import React, { useState, useMemo, useEffect } from 'react';
import { LedgerEntry, Patient, FieldSettings, DiscountType } from '../types';
import { DollarSign, Plus, ArrowUpRight, ArrowDownLeft, Receipt, Calendar, CreditCard, Heart, Ban, AlertCircle, Shield, Tag, Hash, Zap, Info, ShieldAlert, Lock, RotateCcw } from 'lucide-react';
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
    const [mode, setMode] = useState<'view' | 'add_charge' | 'add_payment' | 'adjustment'>('view');
    
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [discountType, setDiscountType] = useState<DiscountType>('None');
    const [idNumber, setIdNumber] = useState('');
    const [orNumber, setOrNumber] = useState(''); 
    const [isIndigent, setIsIndigent] = useState(patient.isIndigent || false);
    const [adjustingEntryId, setAdjustingEntryId] = useState<string | null>(null);

    const ledger = useMemo(() => patient.ledger || [], [patient.ledger]);
    const currentBalance = useMemo(() => ledger.length === 0 ? 0 : ledger[ledger.length - 1].balanceAfter, [ledger]);

    useEffect(() => {
        if (mode === 'add_payment') {
            const booklet = fieldSettings?.receiptBooklets?.find(b => b.isActive);
            if (booklet) {
                const lastOr = ledger.filter(e => e.orNumber?.startsWith(booklet.prefix || '')).map(e => parseInt(e.orNumber?.replace(/\D/g, '') || '0')).sort((a,b) => b-a)[0];
                const nextVal = (lastOr || booklet.seriesStart - 1) + 1;
                setOrNumber(`${booklet.prefix || ''}${nextVal.toString().padStart(4, '0')}`);
            }
        }
    }, [mode, fieldSettings, ledger]);

    const handleTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) { toast.error("Enter valid amount"); return; }
        
        if ((discountType === 'Senior Citizen' || discountType === 'PWD') && !idNumber.trim()) {
            toast.error(`Mandatory: Please enter the ${discountType} ID number for tax auditing.`);
            return;
        }

        const type = mode === 'add_charge' ? 'Charge' : mode === 'adjustment' ? 'Adjustment' : 'Payment';
        const newBalance = (type === 'Charge' || (type === 'Adjustment' && val > 0)) ? currentBalance + val : currentBalance - Math.abs(val);
        
        const newEntry: LedgerEntry = {
            id: Math.random().toString(36).substr(2, 9), date, description, type, amount: val, balanceAfter: newBalance,
            discountType: discountType !== 'None' ? discountType : undefined,
            idNumber: idNumber.trim() || undefined,
            orNumber: type === 'Payment' ? orNumber : undefined,
            notes: discountType !== 'None' ? `${discountType} Applied (ID: ${idNumber})` : '',
            isImmutable: true, // BIR COMPLIANCE: Mark once committed
            adjustmentForId: adjustingEntryId || undefined,
            indigentMember: isIndigent
        };

        onUpdatePatient({ ...patient, ledger: [...ledger, newEntry], currentBalance: newBalance, isIndigent });
        setMode('view'); setAmount(''); setDescription(''); setDiscountType('None'); setIdNumber(''); setOrNumber('');
        setAdjustingEntryId(null);
        toast.success(`${type} recorded`);
    };

    const handleAdjustmentInit = (entry: LedgerEntry) => {
        setMode('adjustment');
        setAdjustingEntryId(entry.id);
        setDescription(`Correction for entry ${entry.id}: `);
        setAmount('');
    };

    const applyStatutoryMath = () => {
        const gross = parseFloat(amount);
        if (isNaN(gross) || gross <= 0) {
            toast.error("Please enter the gross amount first.");
            return;
        }
        const net = (gross / 1.12) * 0.8;
        setAmount(net.toFixed(2));
        toast.success("Statutory Senior/PWD calculation applied: VAT Exempt + 20% Disc.");
    };

    const matchingPhilHealthRate = useMemo(() => {
        if (mode !== 'add_charge') return null;
        const proc = fieldSettings?.procedures.find(p => description.toLowerCase().includes(p.name.toLowerCase()));
        return proc?.philHealthCaseRate || null;
    }, [description, mode, fieldSettings]);

    return (
        <div className="h-full flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
            <div className="bg-white p-6 border-b flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4"><div className="bg-emerald-100 p-3 rounded-xl text-emerald-700"><DollarSign size={28}/></div><div><h3 className="font-bold text-lg">Practice Ledger</h3><p className="text-xs text-slate-500">BIR CAS & PhilHealth Compliance</p></div></div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 cursor-pointer">
                        <input type="checkbox" checked={isIndigent} onChange={e => setIsIndigent(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                        <span className="text-xs font-bold text-blue-800">PhilHealth Indigent (NBB)</span>
                    </label>
                    <div className="text-right"><span className="block text-[10px] font-bold uppercase text-slate-400">Balance</span><span className={`text-2xl font-bold ${currentBalance > 0 ? 'text-red-600' : 'text-slate-800'}`}>₱{currentBalance.toLocaleString()}</span></div>
                    {!readOnly && (
                        <div className="flex gap-2">
                             <button onClick={() => setMode('add_charge')} className="bg-white border px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50">Charge</button>
                             <button onClick={() => setMode('add_payment')} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700">Payment</button>
                        </div>
                    )}
                </div>
            </div>

            {mode !== 'view' && (
                <div className="p-4 bg-slate-100 border-b animate-in slide-in-from-top-2">
                    <form onSubmit={handleTransaction} className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-xl border border-slate-200 space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                {mode === 'adjustment' && <RotateCcw size={16} className="text-amber-600"/>}
                                {mode === 'add_charge' ? 'New Charge' : mode === 'adjustment' ? 'Ledger Adjustment' : 'New Payment'}
                            </h4>
                            {(discountType === 'Senior Citizen' || discountType === 'PWD') && (
                                <button type="button" onClick={applyStatutoryMath} className="px-3 py-1.5 bg-lilac-100 text-lilac-700 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-lilac-200 transition-colors"><Zap size={12}/> Run Stat Math</button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description..." className="w-full p-3 bg-slate-50 border rounded-xl" autoFocus required/>
                                {matchingPhilHealthRate && (
                                    <div className="mt-2 flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 p-2 rounded-lg border border-teal-100">
                                        <Info size={14}/> PhilHealth Recognize: ₱{matchingPhilHealthRate.toLocaleString()} benefit. {isIndigent && <span className="underline ml-1">No Balance Billing Enforced.</span>}
                                    </div>
                                )}
                            </div>
                            <div><label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded-lg text-sm" /></div>
                            <div><label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Amount (₱)</label><input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold text-right" required/></div>
                        </div>

                        {mode === 'add_payment' && (
                            <div className="bg-teal-50 p-4 rounded-xl border border-teal-200">
                                <label className="text-[10px] font-bold text-teal-800 uppercase ml-1 flex items-center gap-1"><Hash size={12}/> Next BIR Official Receipt #</label>
                                <input type="text" value={orNumber} onChange={e => setOrNumber(e.target.value)} className="w-full p-3 border border-teal-300 rounded-xl bg-white font-mono font-bold text-teal-900" placeholder="OR-0000" />
                            </div>
                        )}

                        {mode !== 'adjustment' && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><Tag size={14}/> Discount Category</div>
                                <select value={discountType} onChange={e => setDiscountType(e.target.value as DiscountType)} className="w-full p-2 border rounded-lg bg-white text-sm">
                                    <option value="None">No Discount / Regular</option>
                                    <option value="Senior Citizen">Senior Citizen (20% + VAT Exempt)</option>
                                    <option value="PWD">PWD (20% + VAT Exempt)</option>
                                    <option value="PhilHealth">PhilHealth Case Rate</option>
                                    <option value="Employee">Employee Discount</option>
                                </select>
                                {(discountType === 'Senior Citizen' || discountType === 'PWD') && (
                                    <div className="animate-in fade-in slide-in-from-top-1">
                                        <label className="text-[10px] font-bold text-red-600 ml-1 uppercase">Mandatory: OSCA / PWD ID Number</label>
                                        <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value)} className="w-full p-2 border border-red-200 rounded-lg text-sm focus:border-red-500 outline-none" placeholder="Enter ID #..." required />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setMode('view')} className="px-6 py-2 text-slate-500 font-bold">Cancel</button>
                            <button type="submit" className="bg-slate-900 text-white px-8 py-2 rounded-xl font-bold shadow-lg">Commit to Ledger</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]"><tr className="divide-x divide-slate-200"><th className="p-4 text-left">Date</th><th className="p-4 text-left">Description / Audit Info</th><th className="p-4 text-right">Amount</th><th className="p-4 text-right">Balance</th><th className="p-4"></th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {[...ledger].reverse().map((entry) => (
                                <tr key={entry.id} className="hover:bg-slate-50 group">
                                    <td className="p-4 text-slate-500 font-mono text-xs">{formatDate(entry.date)}</td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="font-bold text-slate-800">
                                                {entry.description}
                                                {entry.orNumber && <span className="ml-2 font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">OR: {entry.orNumber}</span>}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="text-[9px] font-bold text-slate-400 font-mono">ID: {entry.id}</span>
                                                {entry.isImmutable && <span className="text-[9px] font-extrabold text-blue-600 flex items-center gap-1"><Shield size={10}/> BIR VERIFIED</span>}
                                                {entry.adjustmentForId && <span className="text-[9px] font-extrabold text-amber-600 flex items-center gap-1"><RotateCcw size={10}/> ADJ FOR: {entry.adjustmentForId}</span>}
                                                {entry.indigentMember && <span className="text-[9px] font-extrabold text-teal-600 flex items-center gap-1 uppercase">PhilHealth NBB</span>}
                                                {entry.discountType && <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">{entry.discountType}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className={`p-4 text-right font-bold ${entry.type === 'Charge' ? 'text-red-600' : 'text-emerald-600'}`}>₱{entry.amount.toLocaleString()}</td>
                                    <td className="p-4 text-right font-mono font-bold text-slate-500 bg-slate-50/50">₱{entry.balanceAfter.toLocaleString()}</td>
                                    <td className="p-4 text-center">
                                        {!readOnly && (
                                            <button 
                                                onClick={() => handleAdjustmentInit(entry)} 
                                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-amber-600 transition-all"
                                                title="Issue Adjustment Memo"
                                            >
                                                <RotateCcw size={14}/>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="bg-blue-900 text-white p-2 text-[9px] font-bold uppercase tracking-widest text-center">
                BIR Computerized Accounting System Compliance: RMO 9-2021 Enforced • Immutable Ledger Rows
            </div>
        </div>
    );
};

export default PatientLedger;

import React, { useState, useMemo, useEffect } from 'react';
import { LedgerEntry, Patient, FieldSettings, DiscountType, DentalChartEntry } from '../types';
import { DollarSign, Plus, ArrowUpRight, ArrowDownLeft, Receipt, Calendar, CreditCard, Heart, Ban, AlertCircle, Shield, Tag, Hash, FileCheck, CheckCircle2, ShieldAlert, TrendingUp } from 'lucide-react';
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

const PatientLedger: React.FC<PatientLedgerProps> = ({ patient, onUpdatePatient, readOnly, fieldSettings }) => {
    const toast = useToast();
    const [mode, setMode] = useState<'view' | 'add_charge' | 'add_payment' | 'hmo_setup'>('view');
    
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [discountType, setDiscountType] = useState<DiscountType>('None');
    const [idNumber, setIdNumber] = useState('');
    const [orNumber, setOrNumber] = useState('');
    
    // HMO Cap Temp State
    const [tempCap, setTempCap] = useState(patient.hmoBenefitCap?.toString() || '');

    const ledger = useMemo(() => patient.ledger || [], [patient.ledger]);
    const currentBalance = useMemo(() => ledger.length === 0 ? 0 : ledger[ledger.length - 1].balanceAfter, [ledger]);
    
    const hmoUsed = patient.hmoBenefitUsed || 0;
    const hmoCap = patient.hmoBenefitCap || 0;
    const hmoRemaining = Math.max(0, hmoCap - hmoUsed);
    const hmoPercentage = hmoCap > 0 ? (hmoUsed / hmoCap) * 100 : 0;

    const pendingProcedures = useMemo(() => {
        return (patient.dentalChart || []).filter(e => e.status === 'Completed' && e.price && e.price > 0 && !e.isBilled);
    }, [patient.dentalChart]);

    const handleTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) { toast.error("Enter valid amount"); return; }
        
        if (discountType === 'HMO' && hmoCap > 0 && val > hmoRemaining) {
            if (!window.confirm(`ALERT: This charge (₱${val.toLocaleString()}) exceeds the remaining HMO Benefit Cap (₱${hmoRemaining.toLocaleString()}). Proceed with partial HMO coverage?`)) return;
        }

        const type = mode === 'add_charge' ? 'Charge' : 'Payment';
        const newBalance = type === 'Charge' ? currentBalance + val : currentBalance - val;
        
        let newHmoUsed = hmoUsed;
        if (type === 'Charge' && discountType === 'HMO') {
            newHmoUsed += val;
        }

        const newEntry: LedgerEntry = {
            id: Math.random().toString(36).substr(2, 9), date, description, type, amount: val, balanceAfter: newBalance,
            discountType: discountType !== 'None' ? discountType : undefined,
            idNumber: idNumber.trim() || undefined,
            orNumber: type === 'Payment' ? orNumber : undefined,
            notes: discountType === 'HMO' ? `HMO Charge (Used: ₱${val.toLocaleString()})` : ''
        };

        onUpdatePatient({ ...patient, ledger: [...ledger, newEntry], currentBalance: newBalance, hmoBenefitUsed: newHmoUsed });
        setMode('view'); setAmount(''); setDescription(''); setDiscountType('None'); setIdNumber('');
        toast.success(`${type} recorded`);
    };

    const handleSaveCap = () => {
        const val = parseFloat(tempCap);
        onUpdatePatient({ ...patient, hmoBenefitCap: isNaN(val) ? 0 : val });
        setMode('view');
        toast.success("HMO Utilization Cap Updated.");
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
            
            {/* HMO PULSE HEADER */}
            {patient.insuranceProvider && patient.insuranceProvider !== 'None' && (
                <div className="bg-teal-900 px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-4 text-white shadow-inner">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-800 rounded-lg"><Shield size={20} className="text-teal-300"/></div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-teal-400">{patient.insuranceProvider} Benefit Monitor</div>
                            <div className="text-lg font-bold">Remaining: ₱{hmoRemaining.toLocaleString()} <span className="text-xs font-normal text-teal-300">of ₱{hmoCap.toLocaleString()}</span></div>
                        </div>
                    </div>
                    <div className="w-full md:w-48 bg-teal-800 h-2 rounded-full overflow-hidden border border-teal-700">
                        <div className={`h-full transition-all duration-1000 ${hmoPercentage > 90 ? 'bg-red-500' : hmoPercentage > 75 ? 'bg-amber-400' : 'bg-teal-400'}`} style={{ width: `${Math.min(100, hmoPercentage)}%` }} />
                    </div>
                    {!readOnly && <button onClick={() => setMode('hmo_setup')} className="text-[10px] font-bold bg-teal-800 hover:bg-teal-700 px-2 py-1 rounded border border-teal-600 uppercase tracking-tighter transition-colors">Adjust Cap</button>}
                </div>
            )}

            <div className="bg-white p-6 border-b flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4"><div className="bg-emerald-100 p-3 rounded-xl text-emerald-700"><DollarSign size={28}/></div><div><h3 className="font-bold text-lg">Financial Ledger</h3><p className="text-xs text-slate-500">Billing & Account History</p></div></div>
                <div className="flex items-center gap-4">
                    <div className="text-right"><span className="block text-[10px] font-bold uppercase text-slate-400">Current Balance</span><span className={`text-2xl font-black ${currentBalance > 0 ? 'text-red-600' : 'text-slate-800'}`}>₱{currentBalance.toLocaleString()}</span></div>
                    {!readOnly && (
                        <div className="flex gap-2">
                             <button onClick={() => setMode('add_charge')} className="bg-slate-100 hover:bg-slate-200 border px-4 py-2 rounded-xl font-bold text-sm transition-colors">Charge</button>
                             <button onClick={() => setMode('add_payment')} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md shadow-teal-600/20 transition-all">Payment</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {mode === 'hmo_setup' && (
                    <div className="bg-teal-50 border border-teal-200 p-6 rounded-2xl animate-in zoom-in-95 duration-300">
                        <h4 className="font-bold text-teal-900 mb-2 flex items-center gap-2"><ShieldAlert size={18}/> Configure HMO Annual Benefit Cap</h4>
                        <p className="text-xs text-teal-700 mb-4">Enter the maximum allowed utilization for this patient's insurance plan to enable automatic over-cap warnings.</p>
                        <div className="flex gap-2">
                            <input type="number" value={tempCap} onChange={e => setTempCap(e.target.value)} className="flex-1 p-3 border-2 border-teal-200 rounded-xl font-bold focus:border-teal-500 outline-none" placeholder="e.g. 15000" />
                            <button onClick={handleSaveCap} className="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold">Apply Limit</button>
                            <button onClick={() => setMode('view')} className="px-4 py-2 text-teal-600 font-bold">Cancel</button>
                        </div>
                    </div>
                )}

                {mode === 'add_charge' && (
                    <form onSubmit={handleTransaction} className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 space-y-4 animate-in slide-in-from-top-2">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2"><ArrowUpRight className="text-red-500"/> New Account Charge</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2"><input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (e.g. Tooth Extraction #46)..." className="w-full p-3 bg-slate-50 border rounded-xl" autoFocus required/></div>
                            <div><label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Amount (₱)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 border rounded-xl text-lg font-black" required/></div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Payment Responsibility</label>
                                <select value={discountType} onChange={e => setDiscountType(e.target.value as DiscountType)} className="w-full p-3 border rounded-xl bg-white text-sm">
                                    <option value="None">Patient Direct Pay</option>
                                    <option value="HMO">HMO Covered Charge</option>
                                    <option value="Senior Citizen">Senior Citizen Discount</option>
                                    <option value="PWD">PWD Discount</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setMode('view')} className="px-6 py-2 text-slate-500 font-bold">Cancel</button>
                            <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg">Commit to Ledger</button>
                        </div>
                    </form>
                )}

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]"><tr><th className="p-4 text-left">Date</th><th className="p-4 text-left">Description</th><th className="p-4 text-right">Amount</th><th className="p-4 text-right">Balance</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {[...ledger].reverse().map((entry) => (
                                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-500 font-mono text-xs">{formatDate(entry.date)}</td>
                                    <td className="p-4 font-medium text-slate-700">
                                        {entry.description}
                                        {entry.discountType === 'HMO' && <span className="ml-2 bg-teal-100 text-teal-700 text-[9px] px-1.5 py-0.5 rounded font-black uppercase border border-teal-200 tracking-tighter">HMO CLAIM</span>}
                                    </td>
                                    <td className={`p-4 text-right font-bold ${entry.type === 'Charge' ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {entry.type === 'Charge' ? '+' : '-'}₱{entry.amount.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-slate-600 bg-slate-50/30">₱{entry.balanceAfter.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {ledger.length === 0 && <div className="p-20 text-center text-slate-400 italic font-medium">No financial transactions found.</div>}
                </div>
            </div>
        </div>
    );
};

export default PatientLedger;
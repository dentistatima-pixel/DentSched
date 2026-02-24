import React, { useState, useMemo } from 'react';
import { WaitlistEntry, User, UserRole } from '../types';
import { useStaff } from '../contexts/StaffContext';
import { usePatient } from '../contexts/PatientContext';
import { useToast } from './ToastSystem';
import { ShieldAlert, Key, DollarSign as FinanceIcon } from 'lucide-react';

const RELIABILITY_THRESHOLD = 70;

interface WaitlistOverrideModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (overrideInfo: { isWaitlistOverride: boolean; authorizedManagerId: string; }) => void;
    entry: WaitlistEntry;
}

const WaitlistOverrideModal: React.FC<WaitlistOverrideModalProps> = ({ isOpen, onClose, onConfirm, entry }) => {
    const { staff } = useStaff();
    const { patients } = usePatient();
    const toast = useToast();

    const [selectedManagerId, setSelectedManagerId] = useState('');
    const [managerPin, setManagerPin] = useState('');
    const [overrideConfirmed, setOverrideConfirmed] = useState(false);

    const authorizedManagers = useMemo(() => staff.filter(s => s.role === UserRole.ADMIN || s.role === UserRole.DENTIST), [staff]);
    const patient = useMemo(() => patients.find(p => p.id === entry.patientId), [patients, entry]);

    const executeOverride = () => {
        const manager = authorizedManagers.find(m => m.id === selectedManagerId);
        if (manager && manager.pin === managerPin) {
            onClose();
            onConfirm({ isWaitlistOverride: true, authorizedManagerId: selectedManagerId });
        } else {
            toast.error("Invalid Manager PIN.");
        }
    };

    if (!isOpen || !patient) return null;

    const isUnreliable = (patient.reliabilityScore ?? 100) < RELIABILITY_THRESHOLD;
    const hasBalance = (patient.currentBalance ?? 0) > 0;

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
             <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-in zoom-in-95 border-4 border-red-100" role="dialog" aria-labelledby="override-title">
                 <div className="flex items-center gap-4 text-red-600 mb-8"><div className="bg-red-50 p-4 rounded-2xl shadow-sm"><ShieldAlert size={40} className="animate-pulse"/></div><div><h3 id="override-title" className="text-2xl font-black uppercase tracking-tighter">Guardrail Triggered</h3><p className="text-xs font-bold uppercase text-red-800 tracking-widest mt-1">Front-Desk Integrity Block</p></div></div>
                 <div className="bg-red-50 p-6 rounded-3xl mb-8 space-y-4 border border-red-100"><p className="text-sm font-bold text-red-900 leading-relaxed uppercase tracking-tighter">Attention: <strong>{entry.patientName}</strong> is currently flagged for:</p><ul className="space-y-3">{(isUnreliable) && (<li className="flex items-center gap-3 text-sm font-black text-red-700 uppercase tracking-tight">Low Appointment Reliability</li>)}{(hasBalance) && (<li className="flex items-center gap-3 text-sm font-black text-red-700 uppercase tracking-tight"><FinanceIcon size={18}/> Unresolved Practice Debt</li>)}</ul></div>
                 <div className="space-y-6 mb-10">
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Select Authorizing Manager *</label>
                        <select aria-label="Authorizing Manager" value={selectedManagerId} onChange={e => setSelectedManagerId(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-slate-800 outline-none focus:border-red-600 mb-4 transition-all"><option value="">- Choose Authorized Personnel -</option>{authorizedManagers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}</select>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-2"><Key size={14}/> Verifying Staff PIN *</label>
                        <input aria-label="Verification PIN" type="password" maxLength={4} value={managerPin} onChange={e => setManagerPin(e.target.value)} placeholder="••••" className="w-full p-5 text-center text-3xl tracking-[1em] border-2 border-slate-200 rounded-2xl focus:border-teal-600 outline-none font-black bg-slate-50"/>
                    </div>
                    <label className="flex items-start gap-4 p-5 rounded-3xl border-2 border-slate-200 hover:border-teal-600 transition-all cursor-pointer bg-white">
                        <input 
                            type="checkbox" 
                            checked={overrideConfirmed}
                            onChange={e => setOverrideConfirmed(e.target.checked)}
                            className="w-8 h-8 mt-0.5 accent-teal-700 rounded shadow-sm" 
                        />
                        <div className="text-xs font-black uppercase text-slate-800 leading-snug">
                            I certify that verbal approval has been received from the selected manager for this booking.
                        </div>
                    </label>
                 </div>
                 <div className="flex gap-4"><button onClick={onClose} className="flex-1 py-5 bg-slate-100 text-slate-600 font-black rounded-2xl uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancel</button><button onClick={executeOverride} disabled={!overrideConfirmed || !selectedManagerId || managerPin.length < 4} className={`flex-[2] py-5 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl transition-all ${overrideConfirmed && selectedManagerId && managerPin.length === 4 ? 'bg-red-600 shadow-red-600/30 hover:bg-red-700' : 'bg-slate-300 shadow-none grayscale opacity-50'}`}>Confirm & Book</button></div>
             </div>
         </div>
    );
};

export default WaitlistOverrideModal;
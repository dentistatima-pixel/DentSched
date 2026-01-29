
import React, { useState, useMemo } from 'react';
import { X, Users, ShieldAlert, DollarSign as FinanceIcon, ShieldCheck, Key } from 'lucide-react';
import { WaitlistEntry, Patient, User } from '../types';
import { usePatient } from '../contexts/PatientContext';
import { useStaff } from '../contexts/StaffContext';
import { useToast } from './ToastSystem';

const RELIABILITY_THRESHOLD = 70;

interface WaitlistPanelProps {
    waitlist: WaitlistEntry[];
    onClose: () => void;
    onAssign: (entry: WaitlistEntry, overrideInfo?: { isWaitlistOverride: boolean; authorizedManagerId: string; }) => void;
}

const WaitlistPanel: React.FC<WaitlistPanelProps> = ({ waitlist, onClose, onAssign }) => {
    const { patients } = usePatient();
    const { staff } = useStaff();
    const toast = useToast();
    
    const [overrideTarget, setOverrideTarget] = useState<WaitlistEntry | null>(null);
    const [selectedManagerId, setSelectedManagerId] = useState('');
    const [managerPin, setManagerPin] = useState('');

    const getPatient = (id: string) => patients.find(p => p.id === id);

    const sortedWaitlist = useMemo(() => {
        const priorityOrder = { 'High': 1, 'Normal': 2, 'Low': 3 };
        return [...waitlist].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }, [waitlist]);
    
    const authorizedManagers = useMemo(() => {
        return staff.filter(s => s.role === 'Administrator' || s.role === 'Dentist');
    }, [staff]);

    const handleAssignClick = (entry: WaitlistEntry) => {
        const patient = getPatient(entry.patientId);
        const isReliable = (patient?.reliabilityScore ?? 100) >= RELIABILITY_THRESHOLD;
        const hasBalance = (patient?.currentBalance ?? 0) > 0;

        if (!isReliable || hasBalance) {
            setOverrideTarget(entry);
            setSelectedManagerId('');
            setManagerPin('');
        } else {
            onAssign(entry);
        }
    };
    
    const executeOverride = () => {
        const manager = authorizedManagers.find(m => m.id === selectedManagerId);
        if (overrideTarget && manager && manager.pin === managerPin) {
            onAssign(overrideTarget, { isWaitlistOverride: true, authorizedManagerId: selectedManagerId });
            toast.success("Manager Override Verified. Appointment Queued.");
            setOverrideTarget(null);
            setManagerPin('');
        } else {
            toast.error("Invalid Manager PIN.");
        }
    };

    return (
        <div className="fixed top-24 bottom-8 right-0 w-96 bg-white border-l border-slate-300 shadow-2xl z-40 transition-transform duration-500 ease-in-out translate-x-0" role="complementary" aria-label="Waitlist Management">
            <div className="h-full flex flex-col">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-teal-100 p-2 rounded-xl text-teal-800"><Users size={20}/></div>
                        <h3 className="font-black text-slate-800 uppercase tracking-tight">Waitlist Engine</h3>
                    </div>
                    <button onClick={onClose} aria-label="Close waitlist panel" className="p-2 text-slate-400 hover:text-slate-800 transition-colors"><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                    {sortedWaitlist.map(entry => {
                        const patient = getPatient(entry.patientId);
                        const isUnreliable = (patient?.reliabilityScore ?? 100) < RELIABILITY_THRESHOLD;
                        const hasBalance = (patient?.currentBalance ?? 0) > 0;
                        const isClear = !isUnreliable && !hasBalance;

                        return (
                            <div key={entry.id} className={`p-4 rounded-3xl border-2 transition-all group ${isClear ? 'bg-white border-slate-200 hover:border-teal-500 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-80 grayscale-[0.3] hover:opacity-100 hover:grayscale-0'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-black text-slate-800 uppercase text-sm leading-tight">{entry.patientName}</h4>
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            {isUnreliable && (
                                                <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-xs font-black uppercase border border-red-200">
                                                    {patient?.reliabilityScore}% Reliability
                                                </span>
                                            )}
                                            {hasBalance && (
                                                <div className="flex items-center gap-1 text-red-800 bg-red-100/50 px-2 py-0.5 rounded-full text-xs font-black uppercase border border-red-200">
                                                    <FinanceIcon size={10}/> ₱{patient?.currentBalance?.toLocaleString()}
                                                </div>
                                            )}
                                            {isClear && (
                                                <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-xs font-black uppercase border border-teal-200 flex items-center gap-1">
                                                    <ShieldCheck size={12}/> Verified Clear
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`text-xs font-black uppercase px-2 py-1 rounded ${entry.priority === 'High' ? 'bg-orange-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'}`}>{entry.priority}</span>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-xl mt-3 space-y-2 border border-slate-100">
                                    <div className="text-xs font-bold text-slate-600 flex justify-between uppercase tracking-tighter"><span>Procedure</span><span className="text-slate-900">{entry.procedure}</span></div>
                                    <div className="text-xs font-bold text-slate-600 flex justify-between uppercase tracking-tighter"><span>Duration</span><span className="text-slate-900">{entry.durationMinutes}m</span></div>
                                </div>

                                <button 
                                    onClick={() => handleAssignClick(entry)}
                                    className={`w-full mt-4 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 ${
                                        isClear ? 'bg-teal-600 text-white shadow-teal-600/20 hover:bg-teal-700' : 'bg-white text-red-700 border-2 border-red-200 shadow-red-600/5 hover:bg-red-50'
                                    }`}
                                    aria-label={isClear ? `Assign slot to ${entry.patientName}` : `Request override for ${entry.patientName}`}
                                >
                                    {isClear ? 'Assign Slot' : 'Request Override'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {overrideTarget && (
                 <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                     <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-in zoom-in-95 border-4 border-red-100" role="dialog" aria-labelledby="override-title">
                         <div className="flex items-center gap-4 text-red-600 mb-8"><div className="bg-red-50 p-4 rounded-2xl shadow-sm"><ShieldAlert size={40} className="animate-pulse"/></div><div><h3 id="override-title" className="text-2xl font-black uppercase tracking-tighter">Guardrail Triggered</h3><p className="text-xs font-bold uppercase text-red-800 tracking-widest mt-1">Front-Desk Integrity Block</p></div></div>
                         <div className="bg-red-50 p-6 rounded-3xl mb-8 space-y-4 border border-red-100"><p className="text-sm font-bold text-red-900 leading-relaxed uppercase tracking-tighter">Attention: <strong>{overrideTarget.patientName}</strong> is currently flagged for:</p><ul className="space-y-3">{(getPatient(overrideTarget.patientId)?.reliabilityScore ?? 100) < RELIABILITY_THRESHOLD && (<li className="flex items-center gap-3 text-sm font-black text-red-700 uppercase tracking-tight">Low Appointment Reliability</li>)}{(getPatient(overrideTarget.patientId)?.currentBalance ?? 0) > 0 && (<li className="flex items-center gap-3 text-sm font-black text-red-700 uppercase tracking-tight">Unresolved Practice Debt</li>)}</ul></div>
                         <div className="space-y-6 mb-10"><div><label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Select Authorizing Manager *</label><select aria-label="Authorizing Manager" value={selectedManagerId} onChange={e => setSelectedManagerId(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-slate-800 outline-none focus:border-red-600 mb-4 transition-all"><option value="">- Choose Authorized Personnel -</option>{authorizedManagers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}</select><label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-2"><Key size={14}/> Verifying Staff PIN *</label><input aria-label="Verification PIN" type="password" maxLength={4} value={managerPin} onChange={e => setManagerPin(e.target.value)} placeholder="••••" className="w-full p-5 text-center text-3xl tracking-[1em] border-2 border-slate-200 rounded-2xl focus:border-teal-600 outline-none font-black bg-slate-50"/></div></div>
                         <div className="flex gap-4"><button onClick={() => setOverrideTarget(null)} className="flex-1 py-5 bg-slate-100 text-slate-600 font-black rounded-2xl uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancel</button><button onClick={executeOverride} disabled={!selectedManagerId || managerPin.length < 4} className={`flex-[2] py-5 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl transition-all ${selectedManagerId && managerPin.length === 4 ? 'bg-red-600 shadow-red-600/30 hover:bg-red-700' : 'bg-slate-300 shadow-none grayscale opacity-50'}`}>Confirm & Book</button></div>
                     </div>
                 </div>
            )}
        </div>
    );
};

export default WaitlistPanel;

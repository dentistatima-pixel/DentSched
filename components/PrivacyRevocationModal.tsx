import React, { useState } from 'react';
import { ShieldAlert, X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Patient, ConsentCategory, User } from '../types';

interface PrivacyRevocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, notes: string) => void;
    patient: Patient;
    category: ConsentCategory;
}

const PrivacyRevocationModal: React.FC<PrivacyRevocationModalProps> = ({ isOpen, onClose, onConfirm, patient, category }) => {
    const [reason, setReason] = useState('Patient Request');
    const [notes, setNotes] = useState('');
    const [confirmationText, setConfirmationText] = useState('');

    if (!isOpen) return null;

    const isClinical = category === 'Clinical';
    const canConfirm = isClinical ? confirmationText === 'REVOKE' : true;

    const handleConfirm = () => {
        if (!canConfirm) return;
        onConfirm(reason, notes);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-4 border-red-200">
                <div className="p-6 border-b border-red-100 bg-red-50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-xl text-red-600"><ShieldAlert size={24} /></div>
                        <div>
                            <h2 className="text-xl font-black text-red-900 uppercase tracking-tight">Revoke {category} Consent</h2>
                            <p className="text-xs text-red-700 font-bold uppercase">High-Consequence Action</p>
                        </div>
                    </div>
                    <button onClick={onClose}><X size={24} className="text-red-300 hover:text-red-500" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {isClinical && (
                        <div className="bg-red-600 text-white p-6 rounded-3xl shadow-xl shadow-red-600/20 space-y-4 animate-in shake duration-500">
                            <div className="flex gap-4">
                                <AlertTriangle size={40} className="shrink-0 animate-pulse" />
                                <h3 className="text-lg font-black uppercase tracking-tighter leading-tight">CRITICAL IMPACT WARNING</h3>
                            </div>
                            <p className="text-sm font-medium leading-relaxed">
                                Revoking Clinical Processing Consent will immediately and permanently <strong>lock this patient's record to read-only</strong>. Staff will be unable to view the Odontogram, write Clinical Notes, or process Insurance Claims. This action may legally terminate the clinical relationship.
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Reason for Withdrawal</label>
                            <select 
                                value={reason} 
                                onChange={e => setReason(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-500/5"
                            >
                                <option>Patient Request</option>
                                <option>Moving to different clinic</option>
                                <option>Concerns over data security</option>
                                <option>Dispute over treatment</option>
                                <option>Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Internal Auditor Notes</label>
                            <textarea 
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Details regarding the revocation request..."
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[100px] outline-none focus:ring-4 focus:ring-teal-500/5"
                            />
                        </div>

                        {isClinical && (
                            <div>
                                <label className="text-[10px] font-black text-red-700 uppercase tracking-widest ml-1 mb-2 block">Type "REVOKE" to confirm</label>
                                <input 
                                    type="text"
                                    value={confirmationText}
                                    onChange={e => setConfirmationText(e.target.value)}
                                    className="w-full p-4 bg-red-50 border-2 border-red-200 rounded-2xl font-black text-xl text-center text-red-800 outline-none focus:border-red-500 tracking-[0.5em]"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-white flex gap-3 shrink-0">
                    <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-xs rounded-2xl">Cancel</button>
                    <button 
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        className="flex-[2] py-4 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-red-600/20 disabled:opacity-40 transition-all hover:bg-red-700"
                    >
                        Confirm Revocation
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyRevocationModal;

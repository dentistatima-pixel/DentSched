import React, { useState } from 'react';
import { ShieldAlert, CheckCircle } from 'lucide-react';
import { ClinicalProtocolRule } from '../types';

interface ProtocolOverrideModalProps {
    isOpen: boolean;
    rule: ClinicalProtocolRule;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

const ProtocolOverrideModal: React.FC<ProtocolOverrideModalProps> = ({ isOpen, rule, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = () => {
        if (!reason.trim()) {
            setError('An override reason is mandatory for the audit log.');
            return;
        }
        onClose();
        onConfirm(reason);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-red-100 bg-red-50 flex items-start gap-4">
                    <div className="bg-red-100 p-3 rounded-xl text-red-600 mt-1">
                        <ShieldAlert size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-red-900">Clinical Protocol Alert</h2>
                        <p className="text-sm text-red-800 mt-1">{rule.name}</p>
                    </div>
                </div>

                {/* Alert Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <p className="text-slate-600 leading-relaxed">{rule.alertMessage}</p>
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Reason for Override (Required)</label>
                        <textarea
                            value={reason}
                            onChange={(e) => { setReason(e.target.value); setError(''); }}
                            placeholder="e.g., Verbal confirmation from cardiologist received."
                            className={`w-full p-3 rounded-lg border text-sm focus:outline-none focus:ring-2
                                ${error ? 'border-red-400 ring-red-500/20' : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/20'}
                            `}
                            rows={3}
                            autoFocus
                        />
                        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                    </div>
                     <p className="text-xs text-slate-400 italic">
                        This action and the provided reason will be permanently recorded in the accountability log.
                     </p>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all">
                        Cancel Treatment
                    </button>
                    <button onClick={handleConfirm} className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center gap-2">
                        <CheckCircle size={20} /> Acknowledge & Proceed
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProtocolOverrideModal;

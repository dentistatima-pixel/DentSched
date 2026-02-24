
import React, { useState } from 'react';
import { X, FileWarning } from 'lucide-react';

interface VoidNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

const VoidNoteModal: React.FC<VoidNoteModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!reason.trim()) {
            setError('A reason is mandatory to amend a sealed record.');
            return;
        }
        onClose();
        onConfirm(reason);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-amber-100 bg-amber-50 flex items-center gap-4">
                    <FileWarning size={28} className="text-amber-600" />
                    <div>
                        <h2 className="text-xl font-black text-amber-900 uppercase tracking-tight">Amend Clinical Record</h2>
                        <p className="text-xs text-amber-700 font-bold uppercase">Medio-Legal Justification Required</p>
                    </div>
                </div>
                <div className="p-8 space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        You are about to amend a cryptographically sealed clinical note. The original note will be marked as 'Voided' and a new, editable version will be created. This action is irreversible and will be permanently logged.
                    </p>
                    <div>
                        <label className="label text-xs">Reason for Amendment *</label>
                        <textarea
                            value={reason}
                            onChange={(e) => { setReason(e.target.value); setError(''); }}
                            className={`input h-24 ${error ? 'border-red-500' : ''}`}
                            placeholder="e.g., Correction of clinical finding, addition of post-operative notes..."
                            autoFocus
                        />
                        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                    </div>
                </div>
                <div className="p-4 border-t bg-white flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                    <button onClick={handleConfirm} className="px-8 py-3 bg-amber-600 text-white rounded-xl font-bold">Confirm & Amend</button>
                </div>
            </div>
        </div>
    );
};

export default VoidNoteModal;

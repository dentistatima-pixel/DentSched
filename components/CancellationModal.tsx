import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const CancellationModal: React.FC<CancellationModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!reason.trim()) {
            setError('A reason for cancellation is required for the audit trail.');
            return;
        }
        onClose();
        onConfirm(reason);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-red-100 bg-red-50 flex items-center gap-3">
                    <AlertTriangle className="text-red-600" size={24}/>
                    <h2 className="text-xl font-black text-red-900 uppercase tracking-tight">Confirm Cancellation</h2>
                </div>
                <div className="p-8 space-y-4">
                    <p className="text-sm text-slate-600">Please provide a reason for cancelling this appointment. This will be recorded in the patient's communication log and the system audit trail.</p>
                    <textarea
                        value={reason}
                        onChange={e => { setReason(e.target.value); setError(''); }}
                        className={`input h-24 ${error ? 'border-red-500' : ''}`}
                        placeholder="e.g., Patient called to reschedule, No-show after 15-minute grace period..."
                        autoFocus
                    />
                    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                </div>
                <div className="p-4 border-t bg-white flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                    <button onClick={handleConfirm} className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold">Confirm Cancellation</button>
                </div>
            </div>
        </div>
    );
};

export default CancellationModal;

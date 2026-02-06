
import React from 'react';
import { X, Edit3 } from 'lucide-react';
import { Patient } from '../types';

interface IncompleteRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    drafts: { key: string; data: Partial<Patient> }[];
    onResume: (draftData: Partial<Patient>) => void;
    onDiscard: (draftKey: string) => void;
}

const IncompleteRegistrationModal: React.FC<IncompleteRegistrationModalProps> = ({ isOpen, onClose, drafts, onResume, onDiscard }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-black text-slate-800">Resume Incomplete Registrations</h2>
                    <button onClick={onClose}><X size={24} className="text-slate-500" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {drafts.map(draft => (
                        <div key={draft.key} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                            <div>
                                <p className="font-bold text-slate-800">{draft.data.firstName || draft.data.surname ? `${draft.data.firstName || ''} ${draft.data.surname || ''}`.trim() : 'Untitled Draft'}</p>
                                <p className="text-xs text-slate-500">Last saved: {new Date(draft.data.lastDigitalUpdate || Date.now()).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onDiscard(draft.key)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg">
                                    Discard
                                </button>
                                <button onClick={() => onResume(draft.data)} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                                    <Edit3 size={14} /> Resume
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="p-4 border-t bg-white flex justify-end">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Close</button>
                </div>
            </div>
        </div>
    );
};

export default IncompleteRegistrationModal;

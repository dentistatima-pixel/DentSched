
import React, { useState } from 'react';
import { X, Save, Phone } from 'lucide-react';
import { CommunicationChannel } from '../types';
import { usePatient } from '../contexts/PatientContext';
import { useToast } from './ToastSystem';

interface LogCommunicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    addCommunicationLog: (patientId: string, channel: CommunicationChannel, content: string) => Promise<void>;
}

const LogCommunicationModal: React.FC<LogCommunicationModalProps> = ({ isOpen, onClose, patientId, addCommunicationLog }) => {
    const { patients } = usePatient();
    const toast = useToast();
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const patient = patients.find(p => p.id === patientId);

    if (!isOpen || !patient) return null;

    const handleSave = async () => {
        if (!notes.trim()) {
            toast.error('Please enter some notes for the call log.');
            return;
        }
        setIsSaving(true);
        await addCommunicationLog(patientId, CommunicationChannel.CALL, notes);
        setIsSaving(false);
        setNotes('');
        toast.success("Call log saved.");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-3 rounded-xl text-blue-700"><Phone size={24} /></div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Log Call</h2>
                            <p className="text-sm text-slate-500">For: {patient.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose}><X size={24} className="text-slate-500" /></button>
                </div>
                <div className="p-8 space-y-4">
                    <label className="label">Call Notes</label>
                    <textarea 
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="input h-32"
                        placeholder="e.g., Left voicemail for recall reminder. Patient's spouse answered, will call back."
                        autoFocus
                    />
                </div>
                <div className="p-8 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-8 py-4 bg-teal-600 text-white rounded-xl font-bold flex items-center gap-2">
                        <Save size={16} /> {isSaving ? 'Saving...' : 'Save Log'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogCommunicationModal;

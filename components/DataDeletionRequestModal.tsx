import React, { useState } from 'react';
import { Patient, User, DataDeletionRequest } from '../types';
import { X, Trash2, ShieldAlert, Send } from 'lucide-react';
import { useToast } from './ToastSystem';
import { usePatient } from '../contexts/PatientContext';
import { useAppContext } from '../contexts/AppContext';

interface DataDeletionRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient;
}

const DataDeletionRequestModal: React.FC<DataDeletionRequestModalProps> = ({ isOpen, onClose, patient }) => {
    const toast = useToast();
    const { handleSavePatient } = usePatient();
    const { currentUser } = useAppContext();
    const [reason, setReason] = useState('Patient verbal request.');
    const [retention, setRetention] = useState(10); // Default DOH retention
    const [confirmationText, setConfirmationText] = useState('');

    if (!isOpen) return null;

    const handleFileRequest = async () => {
        if (confirmationText !== 'ERASURE') {
            toast.error('Type "ERASURE" to confirm this high-consequence action.');
            return;
        }

        const newRequest: DataDeletionRequest = {
            id: `delreq_${Date.now()}`,
            patientId: patient.id,
            requestedAt: new Date().toISOString(),
            requestedBy: currentUser!.id,
            reason: reason,
            status: 'Pending',
            retentionPeriod: retention
        };
        
        const updatedPatient = {
            ...patient,
            dataDeletionRequests: [...(patient.dataDeletionRequests || []), newRequest]
        };

        await handleSavePatient(updatedPatient);
        toast.success("Data Erasure Request filed. It is now pending DPO approval.");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
                <div className="p-6 border-b border-red-100 bg-red-50 flex items-center gap-4">
                    <Trash2 size={28} className="text-red-600"/>
                    <div>
                        <h2 className="text-xl font-black text-red-900 uppercase tracking-tight">Request Data Erasure</h2>
                        <p className="text-xs text-red-700 font-bold uppercase">Right to be Forgotten</p>
                    </div>
                </div>
                <div className="p-8 space-y-4">
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="text-amber-600"/>
                            <h3 className="font-bold text-amber-800">High-Consequence Action</h3>
                        </div>
                        <p className="text-sm text-amber-700 mt-2">
                           This will initiate a formal workflow to anonymize the patient's record after the legal retention period. This action is irreversible once approved by the DPO.
                        </p>
                    </div>
                    <div>
                        <label className="label text-xs">Reason for Request *</label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} className="input h-24"/>
                    </div>
                    <div>
                        <label className="label text-xs">Legal Retention Period (Years)</label>
                        <input type="number" value={retention} onChange={e => setRetention(parseInt(e.target.value) || 10)} className="input"/>
                    </div>
                    <div>
                        <label className="label text-xs">Type "ERASURE" to confirm</label>
                        <input type="text" value={confirmationText} onChange={e => setConfirmationText(e.target.value)} className="input text-center font-black text-lg tracking-widest"/>
                    </div>
                </div>
                 <div className="p-4 border-t bg-white flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                    <button onClick={handleFileRequest} disabled={confirmationText !== 'ERASURE'} className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
                        <Send size={16}/> File Request
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataDeletionRequestModal;
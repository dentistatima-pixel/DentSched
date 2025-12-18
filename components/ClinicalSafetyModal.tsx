
import React, { useState } from 'react';
import { ShieldAlert, FileCheck, ClipboardList, X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Patient, Appointment, FieldSettings } from '../types';

interface ClinicalSafetyModalProps {
    isOpen: boolean;
    patient: Patient;
    appointment: Appointment;
    onCancel: () => void;
    onProceed: (justification?: string) => void;
}

const ClinicalSafetyModal: React.FC<ClinicalSafetyModalProps> = ({ isOpen, patient, appointment, onCancel, onProceed }) => {
    const [mode, setMode] = useState<'decision' | 'override'>('decision');
    const [justification, setJustification] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleOverrideSubmit = () => {
        if (!justification.trim() || justification.length < 10) {
            setError('Please provide a detailed clinical justification (min. 10 chars).');
            return;
        }
        onProceed(justification);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                {/* Header */}
                <div className="bg-red-600 p-6 text-white flex items-center gap-4">
                    <ShieldAlert size={32} />
                    <div>
                        <h2 className="text-xl font-bold uppercase tracking-tight">Surgical Safety Alert</h2>
                        <p className="text-red-100 text-xs font-bold">High-Risk Patient Protocol Triggered</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Patient Context */}
                    <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-4">
                        <div className="bg-white p-2 rounded-xl text-red-600 h-fit shadow-sm"><AlertTriangle size={24}/></div>
                        <div>
                            <p className="text-sm text-red-900 leading-relaxed">
                                <strong>{patient.name}</strong> is scheduled for <strong>{appointment.type}</strong> but is flagged with:
                                <span className="block mt-1 font-bold text-red-700">
                                    {patient.medicalConditions?.filter(c => ['Diabetes', 'Heart Disease', 'High BP', 'Bleeding Issues'].includes(c)).join(', ')}
                                </span>
                            </p>
                        </div>
                    </div>

                    {mode === 'decision' ? (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-500">To proceed with this surgical procedure, Philippine clinical standards recommend a Medical Clearance from the patient's physician.</p>
                            
                            <div className="grid grid-cols-1 gap-3">
                                <button 
                                    onClick={() => setMode('override')}
                                    className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl text-left hover:border-teal-500 hover:bg-teal-50 transition-all group"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-slate-800">Professional Override</span>
                                        <div className="bg-slate-100 p-1 rounded group-hover:bg-teal-600 group-hover:text-white transition-colors"><ClipboardList size={14}/></div>
                                    </div>
                                    <p className="text-xs text-slate-500">I am managing this patient via pre-op optimization (e.g. 48h protocol) and accept clinical responsibility.</p>
                                </button>

                                <button 
                                    onClick={onCancel}
                                    className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl text-left hover:border-red-500 hover:bg-red-50 transition-all group"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-slate-800">Cancel & Defer Treatment</span>
                                        <div className="bg-slate-100 p-1 rounded group-hover:bg-red-600 group-hover:text-white transition-colors"><X size={14}/></div>
                                    </div>
                                    <p className="text-xs text-slate-500">Postpone the procedure until a formal Medical Clearance document is uploaded to the patient's file.</p>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in slide-in-from-right-4">
                            <label className="block text-sm font-bold text-slate-700">Override Justification Note (Required)</label>
                            <textarea 
                                autoFocus
                                value={justification}
                                onChange={(e) => { setJustification(e.target.value); setError(''); }}
                                placeholder="e.g., Patient blood sugar (HBA1C) verified stable; 48-hour pre-op antibiotic/insulin protocol followed."
                                className={`w-full p-4 border rounded-2xl text-sm h-32 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all ${error ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-teal-500'}`}
                            />
                            {error && <p className="text-xs text-red-600 font-bold flex items-center gap-1"><AlertTriangle size={12}/> {error}</p>}
                            
                            <div className="flex gap-2">
                                <button onClick={() => setMode('decision')} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl">Go Back</button>
                                <button onClick={handleOverrideSubmit} className="flex-[2] py-4 bg-teal-600 text-white font-bold rounded-2xl shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2">
                                    <CheckCircle size={20}/> Confirm Override & Sign Record
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-widest">This justification will be logged for regulatory audit.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClinicalSafetyModal;


import React, { useState, useMemo } from 'react';
import { Patient, Medication, FieldSettings } from '../types';
import { X, Pill, Printer, AlertTriangle } from 'lucide-react';

interface EPrescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient;
    fieldSettings: FieldSettings;
}

const EPrescriptionModal: React.FC<EPrescriptionModalProps> = ({ isOpen, onClose, patient, fieldSettings }) => {
    const [selectedMedId, setSelectedMedId] = useState<string>('');
    const [dosage, setDosage] = useState('');
    const [instructions, setInstructions] = useState('');
    const [quantity, setQuantity] = useState('');
    
    const medications = fieldSettings.medications || [];

    const handleMedicationSelect = (medId: string) => {
        setSelectedMedId(medId);
        const med = medications.find(m => m.id === medId);
        if (med) {
            setDosage(med.dosage);
            setInstructions(med.instructions);
        } else {
            setDosage('');
            setInstructions('');
        }
    };
    
    const allergyConflict = useMemo(() => {
        if (!selectedMedId || !patient.allergies) return null;
        const med = medications.find(m => m.id === selectedMedId);
        if (!med || !med.contraindicatedAllergies) return null;

        const patientAllergies = patient.allergies.map(a => a.toLowerCase());
        const conflict = med.contraindicatedAllergies.find(ca => patientAllergies.includes(ca.toLowerCase()));
        
        return conflict || null;
    }, [selectedMedId, patient.allergies, medications]);

    const handlePrint = () => {
        const med = medications.find(m => m.id === selectedMedId);
        if (!med) return;

        const content = `
            <div style="font-family: sans-serif; padding: 20px; width: 400px; border: 1px solid #ccc;">
                <h2 style="margin: 0;">Dr. Alexander Crentist</h2>
                <p style="margin: 0; font-size: 12px;">General Dentistry | PRC: 0123456</p>
                <hr style="margin: 15px 0;">
                <p style="font-size: 12px;"><strong>Patient:</strong> ${patient.name}</p>
                <p style="font-size: 12px;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                <div style="margin-top: 20px; border-top: 2px solid #000; padding-top: 10px;">
                    <strong style="font-size: 24px;">Rx:</strong>
                    <div style="margin-top: 10px;">
                        <p style="font-size: 18px; font-weight: bold; margin: 0;">${med.name} ${dosage}</p>
                        <p style="margin: 5px 0;"><strong>Dispense:</strong> #${quantity}</p>
                        <p style="margin: 0;"><strong>Sig:</strong> ${instructions}</p>
                    </div>
                </div>
            </div>
        `;
        const printWindow = window.open('', '_blank');
        printWindow?.document.write(content);
        printWindow?.document.close();
        printWindow?.print();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-teal-100 p-3 rounded-xl text-teal-700"><Pill size={24} /></div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">New e-Prescription</h2>
                            <p className="text-sm text-slate-500">For: {patient.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose}><X size={24} className="text-slate-500" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                    {allergyConflict && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-r-lg shadow-md" role="alert">
                            <div className="flex items-center gap-3">
                                <AlertTriangle size={24} />
                                <div>
                                    <p className="font-bold">Critical Allergy Alert</p>
                                    <p className="text-sm">Patient has a recorded allergy to <strong className="uppercase">{allergyConflict}</strong>.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="label">Medication</label>
                        <select value={selectedMedId} onChange={e => handleMedicationSelect(e.target.value)} className="input">
                            <option value="">Select from formulary...</option>
                            {medications.map(med => <option key={med.id} value={med.id}>{med.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="label">Dosage</label>
                            <input type="text" value={dosage} onChange={e => setDosage(e.target.value)} className="input" />
                        </div>
                        <div>
                            <label className="label">Quantity (#)</label>
                            <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="input" />
                        </div>
                    </div>

                    <div>
                        <label className="label">Instructions (Sig.)</label>
                        <textarea value={instructions} onChange={e => setInstructions(e.target.value)} className="input h-24" />
                    </div>
                </div>

                <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                    <button onClick={handlePrint} disabled={!selectedMedId || !quantity} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center gap-2">
                        <Printer size={20} /> Print Prescription
                    </button>
                </div>
            </div>
            <style>{`.label { font-size: 0.875rem; font-weight: 600; color: #334155; margin-bottom: 0.5rem; display: block; } .input { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; background: #fff; }`}</style>
        </div>
    );
};

export default EPrescriptionModal;


import React, { useState, useMemo } from 'react';
import { Patient, Medication, FieldSettings, User } from '../types';
import { X, Pill, Printer, AlertTriangle, ShieldAlert, Lock, AlertCircle, ShieldOff, Baby, Activity } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useToast } from './ToastSystem';

interface EPrescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient;
    fieldSettings: FieldSettings;
    currentUser: User;
}

const EPrescriptionModal: React.FC<EPrescriptionModalProps> = ({ isOpen, onClose, patient, fieldSettings, currentUser }) => {
    const toast = useToast();
    const [selectedMedId, setSelectedMedId] = useState<string>('');
    const [dosage, setDosage] = useState('');
    const [instructions, setInstructions] = useState('');
    const [quantity, setQuantity] = useState('');
    
    const medications = fieldSettings.medications || [];
    const selectedMed = useMemo(() => medications.find(m => m.id === selectedMedId), [selectedMedId, medications]);

    const isPediatric = (patient.age || 0) < 18;

    // --- CLINICAL INTERACTION ENGINE ---
    
    // 1. Allergy Cross-Reference
    const allergyConflict = useMemo(() => {
        if (!selectedMed || !patient.allergies) return null;
        return selectedMed.contraindicatedAllergies?.find(a => 
            patient.allergies?.some(pa => pa.toLowerCase().trim() === a.toLowerCase().trim())
        );
    }, [selectedMed, patient.allergies]);

    // 2. Drug-Drug Interaction Check
    const drugInteraction = useMemo(() => {
        if (!selectedMed || !patient.medicationDetails) return null;
        const currentMedsStr = patient.medicationDetails.toLowerCase();
        // Check if current selection has known conflicts with text in patient history
        return selectedMed.interactions?.find(conflictDrug => 
            currentMedsStr.includes(conflictDrug.toLowerCase())
        );
    }, [selectedMed, patient.medicationDetails]);

    const handleMedicationSelect = (medId: string) => {
        setSelectedMedId(medId);
        const med = medications.find(m => m.id === medId);
        if (med) { 
            setDosage(med.dosage); 
            setInstructions(med.instructions); 
            
            // Critical Safety Notifications
            if (med.contraindicatedAllergies?.some(a => patient.allergies?.includes(a))) {
                toast.error("ALLERGY BLOCK: Selection contraindicated.");
            }
        } else { 
            setDosage(''); 
            setInstructions(''); 
        }
    };
    
    const s2Violation = useMemo(() => {
        return selectedMed?.isS2Controlled && !currentUser.s2License;
    }, [selectedMed, currentUser.s2License]);

    const handlePrint = () => {
        if (!selectedMed || s2Violation || allergyConflict || drugInteraction) return;

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });

        if (selectedMed.isS2Controlled) {
            doc.setTextColor(240, 240, 240); 
            doc.setFontSize(28);
            doc.setFont('helvetica', 'bold');
            doc.text("CONTROLLED SUBSTANCE", 74, 100, { align: 'center', angle: 45 });
            doc.setTextColor(0, 0, 0);
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(currentUser.name.toUpperCase(), 74, 15, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`${currentUser.specialization || 'Dental Surgeon'}`, 74, 20, { align: 'center' });
        doc.text(`PRC: ${currentUser.prcLicense} | PTR: ${currentUser.ptrNumber}`, 74, 25, { align: 'center' });
        if (currentUser.s2License) doc.text(`S2: ${currentUser.s2License}`, 74, 29, { align: 'center' });

        doc.line(10, 32, 138, 32);

        doc.setFontSize(10);
        doc.text(`PATIENT: ${patient.name}`, 15, 40);
        doc.text(`AGE: ${patient.age || '-'}   SEX: ${patient.sex || '-'}`, 15, 45);
        doc.text(`DATE: ${new Date().toLocaleDateString()}`, 100, 40);

        doc.setFontSize(30);
        doc.setFont('times', 'italic');
        doc.text("Rx", 15, 60);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`${selectedMed.name.toUpperCase()} ${dosage}`, 25, 65);
        doc.setFont('helvetica', 'normal');
        doc.text(`Disp: #${quantity}`, 25, 75);
        doc.setFont('helvetica', 'italic');
        doc.text(`Sig: ${instructions}`, 25, 85);

        doc.line(80, 160, 130, 160);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text("Prescriber's Signature", 105, 164, { align: 'center' });

        doc.save(`Prescription_${patient.surname}_${selectedMed.name}.pdf`);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-teal-900 text-white rounded-t-3xl">
                    <div className="flex items-center gap-3"><Pill size={24}/><div><h2 className="text-xl font-bold">Clinical Prescription</h2><p className="text-xs text-teal-200">Patient: {patient.name} {isPediatric && '(Pediatric)'}</p></div></div>
                    <button onClick={onClose}><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                    {allergyConflict && (
                        <div className="bg-red-600 p-4 rounded-xl flex gap-3 text-white animate-in slide-in-from-top-4 shadow-lg">
                            <ShieldOff size={32} className="shrink-0"/>
                            <div><p className="font-bold text-lg">ALLERGY CONTRAINDICATION</p><p className="text-xs opacity-90">Patient allergic to <strong>{allergyConflict}</strong>. Prescription blocked for safety.</p></div>
                        </div>
                    )}

                    {drugInteraction && (
                        <div className="bg-orange-500 p-4 rounded-xl flex gap-3 text-white animate-in slide-in-from-left-4 shadow-lg">
                            <Activity size={32} className="shrink-0"/>
                            <div><p className="font-bold text-lg">DRUG-DRUG INTERACTION</p><p className="text-xs opacity-90">Potential conflict with current medication: <strong>{drugInteraction}</strong>. Review clinical compatibility before proceeding.</p></div>
                        </div>
                    )}

                    {isPediatric && selectedMed && selectedMed.pediatricDosage && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex gap-3 text-blue-800">
                            <Baby size={24} className="shrink-0 text-blue-600"/>
                            <div><p className="text-xs font-black uppercase tracking-widest">Pediatric Dose-Range Check</p><p className="text-sm font-medium mt-1">Recommended: <span className="underline decoration-blue-300 font-bold">{selectedMed.pediatricDosage}</span></p></div>
                        </div>
                    )}

                    {s2Violation && !allergyConflict && !drugInteraction && (
                        <div className="bg-amber-100 border border-amber-300 p-4 rounded-xl flex gap-3 text-amber-900 animate-pulse">
                            <ShieldAlert size={24} className="shrink-0"/>
                            <div><p className="font-bold">S2 License Verification Failed</p><p className="text-xs">S2 license missing from profile.</p></div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Medication Selection</label>
                        <select value={selectedMedId} onChange={e => handleMedicationSelect(e.target.value)} className={`w-full p-3 border rounded-xl bg-white outline-none focus:border-teal-500 ${(allergyConflict || drugInteraction) ? 'border-red-500 bg-red-50 ring-4 ring-red-500/10' : ''}`}>
                            <option value="">- Select Medication -</option>
                            {medications.map(m => {
                                const conflict = m.contraindicatedAllergies?.find(a => patient.allergies?.includes(a));
                                const int = m.interactions?.find(i => patient.medicationDetails?.toLowerCase().includes(i.toLowerCase()));
                                return (
                                    <option key={m.id} value={m.id}>
                                        {m.name} {conflict ? '⚠️ Allergy' : ''} {int ? '⚠️ Interaction' : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2"><label className="block text-sm font-bold text-slate-700 mb-1">Dosage</label><input type="text" value={dosage} onChange={e => setDosage(e.target.value)} className="w-full p-3 border rounded-xl" /></div>
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">Qty</label><input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full p-3 border rounded-xl" /></div>
                    </div>

                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Instructions</label><textarea value={instructions} onChange={e => setInstructions(e.target.value)} className="w-full p-3 border rounded-xl h-24" /></div>
                </div>

                <div className="p-4 border-t bg-white flex justify-end gap-3 rounded-b-3xl">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-100 font-bold rounded-xl">Cancel</button>
                    <button onClick={handlePrint} disabled={!selectedMedId || !!s2Violation || !!allergyConflict || !!drugInteraction} className="px-8 py-2 bg-teal-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all">
                        <Printer size={18}/> Print
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EPrescriptionModal;


import React, { useState, useMemo } from 'react';
import { Patient, Medication, FieldSettings, User } from '../types';
import { X, Pill, Printer, AlertTriangle, ShieldAlert, Lock, AlertCircle, ShieldOff } from 'lucide-react';
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

    const allergyConflict = useMemo(() => {
        if (!selectedMed || !patient.allergies) return null;
        return selectedMed.contraindicatedAllergies?.find(a => patient.allergies?.includes(a));
    }, [selectedMed, patient.allergies]);

    const handleMedicationSelect = (medId: string) => {
        setSelectedMedId(medId);
        const med = medications.find(m => m.id === medId);
        if (med) { 
            setDosage(med.dosage); 
            setInstructions(med.instructions); 
            const conflict = med.contraindicatedAllergies?.find(a => patient.allergies?.includes(a));
            if (conflict) {
                toast.error(`HARD-STOP: Patient is allergic to ${conflict}. ${med.name} cannot be prescribed.`);
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
        if (!selectedMed || s2Violation || allergyConflict) return;

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });

        if (selectedMed.isS2Controlled) {
            doc.setTextColor(240, 240, 240); 
            doc.setFontSize(28);
            doc.setFont('helvetica', 'bold');
            doc.text("CONTROLLED SUBSTANCE", 74, 100, { align: 'center', angle: 45 });
            doc.text("S2 LICENSE REQUIRED", 74, 130, { align: 'center', angle: 45 });
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

        // COMPLIANCE: R.A. 6675 - Generic Name Prominence
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(`${selectedMed.genericName.toUpperCase()} ${dosage}`, 25, 65);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text(`(${selectedMed.name})`, 25, 71);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Disp: #${quantity}`, 25, 80);
        doc.setFont('helvetica', 'italic');
        doc.text(`Sig: ${instructions}`, 25, 90);

        doc.line(80, 160, 130, 160);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text("Prescriber's Signature", 105, 164, { align: 'center' });

        if (selectedMed.isS2Controlled) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(150, 0, 0);
            doc.text("YELLOW PAD REQUIRED FOR DISPENSING", 74, 185, { align: 'center' });
        }

        doc.save(`Prescription_${patient.surname}_${selectedMed.name}.pdf`);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-teal-900 text-white rounded-t-3xl">
                    <div className="flex items-center gap-3"><Pill size={24}/><div><h2 className="text-xl font-bold">Clinical Prescription</h2><p className="text-xs text-teal-200">Patient: {patient.name}</p></div></div>
                    <button onClick={onClose}><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-widest">
                        Generics Act Compliance: R.A. 6675 Enforced
                    </div>

                    {allergyConflict && (
                        <div className="bg-red-600 p-4 rounded-xl flex gap-3 text-white animate-bounce shadow-lg">
                            <ShieldOff size={32} className="shrink-0"/>
                            <div><p className="font-bold text-lg">ALLERGY HARD-STOP</p><p className="text-xs opacity-90">Patient is allergic to <strong>{allergyConflict}</strong>. Prescription of this medication is blocked for clinical safety.</p></div>
                        </div>
                    )}

                    {s2Violation && !allergyConflict && (
                        <div className="bg-amber-100 border border-amber-300 p-4 rounded-xl flex gap-3 text-amber-900 animate-pulse">
                            <ShieldAlert size={24} className="shrink-0"/>
                            <div>
                                <p className="font-bold">PDEA S2 License HARD-BLOCK</p>
                                <p className="text-xs">This is a Controlled Substance. The "Print" function is disabled because your profile lacks a verified S2 License number.</p>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Medication (Generic Name prominence)</label>
                        <select value={selectedMedId} onChange={e => handleMedicationSelect(e.target.value)} className={`w-full p-3 border rounded-xl bg-white outline-none focus:border-teal-500 ${allergyConflict ? 'border-red-500 bg-red-50' : ''}`}>
                            <option value="">- Select Medication -</option>
                            {medications.map(m => {
                                const conflict = m.contraindicatedAllergies?.find(a => patient.allergies?.includes(a));
                                return (
                                    <option key={m.id} value={m.id} className={conflict ? 'text-red-500 font-bold' : ''}>
                                        {m.genericName.toUpperCase()} ({m.name}) {m.isS2Controlled ? '(Controlled)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {selectedMed && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                             <div className="text-xs font-bold text-slate-400 uppercase mb-1">Generic Name</div>
                             <div className="text-lg font-extrabold text-slate-800">{selectedMed.genericName}</div>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2"><label className="block text-sm font-bold text-slate-700 mb-1">Dosage</label><input type="text" value={dosage} onChange={e => setDosage(e.target.value)} className="w-full p-3 border rounded-xl" /></div>
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">Qty</label><input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full p-3 border rounded-xl" /></div>
                    </div>

                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Instructions</label><textarea value={instructions} onChange={e => setInstructions(e.target.value)} className="w-full p-3 border rounded-xl h-24" /></div>
                </div>

                <div className="p-4 border-t bg-white flex justify-end gap-3 rounded-b-3xl">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-100 font-bold rounded-xl">Cancel</button>
                    <button 
                        onClick={handlePrint} 
                        disabled={!selectedMedId || !!s2Violation || !!allergyConflict} 
                        className="px-8 py-2 bg-teal-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:grayscale flex items-center gap-2"
                    >
                        <Printer size={18}/> {selectedMed?.isS2Controlled ? 'Print Controlled Rx' : 'Print Prescription'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EPrescriptionModal;

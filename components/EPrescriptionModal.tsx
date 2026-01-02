
import React, { useState, useMemo, useRef } from 'react';
import { Patient, Medication, FieldSettings, User } from '../types';
import { X, Pill, Printer, AlertTriangle, ShieldAlert, Lock, AlertCircle, ShieldOff, Baby, Activity, Calendar, Camera, Upload, CheckCircle, Fingerprint, Scale } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useToast } from './ToastSystem';
import CryptoJS from 'crypto-js';

interface EPrescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient;
    fieldSettings: FieldSettings;
    currentUser: User;
    logAction?: (action: any, entity: any, id: string, details: string) => void;
}

const EPrescriptionModal: React.FC<EPrescriptionModalProps> = ({ isOpen, onClose, patient, fieldSettings, currentUser, logAction }) => {
    const toast = useToast();
    const [selectedMedId, setSelectedMedId] = useState<string>('');
    const [dosage, setDosage] = useState('');
    const [instructions, setInstructions] = useState('');
    const [quantity, setQuantity] = useState('');
    const [clinicalJustification, setClinicalJustification] = useState('');
    const [wetSignatureImage, setWetSignatureImage] = useState<string | null>(null);
    
    // Pediatric Safety State
    const [patientWeight, setPatientWeight] = useState<string>(patient.weightKg?.toString() || '');
    const [isDosageVerified, setIsDosageVerified] = useState(false);

    const medications = fieldSettings.medications || [];
    const selectedMed = useMemo(() => medications.find(m => m.id === selectedMedId), [selectedMedId, medications]);

    const isPediatric = (patient.age || 0) < 12;

    const allergyConflict = useMemo(() => {
        if (!selectedMed || !patient.allergies) return null;
        return selectedMed.contraindicatedAllergies?.find(a => 
            patient.allergies?.some(pa => pa.toLowerCase().trim() === a.toLowerCase().trim())
        );
    }, [selectedMed, patient.allergies]);

    const drugInteraction = useMemo(() => {
        if (!selectedMed || !patient.medicationDetails) return null;
        const currentMedsStr = patient.medicationDetails.toLowerCase();
        return selectedMed.interactions?.find(conflictDrug => currentMedsStr.includes(conflictDrug.toLowerCase()));
    }, [selectedMed, patient.medicationDetails]);

    const needsJustification = !!allergyConflict || !!drugInteraction;
    const isJustificationValid = clinicalJustification.trim().length >= 20;

    const isSafetyBlocked = isPediatric && (!patientWeight || !isDosageVerified);

    const handleMedicationSelect = (medId: string) => {
        setSelectedMedId(medId);
        const med = medications.find(m => m.id === medId);
        if (med) { setDosage(med.dosage); setInstructions(med.instructions); }
    };

    const s2Status = useMemo(() => {
        if (!selectedMed?.isS2Controlled) return { violation: false, reason: '' };
        if (!currentUser.s2License) return { violation: true, reason: 'License Missing' };
        if (currentUser.s2License && currentUser.s2Expiry && new Date(currentUser.s2Expiry) < new Date()) return { violation: true, reason: 'License Expired' };
        return { violation: false, reason: '' };
    }, [selectedMed, currentUser.s2License, currentUser.s2Expiry]);

    const handleS2Certify = () => {
        if (!selectedMed) return;
        if (logAction) logAction('CREATE', 'System', patient.id, `Manual S2 Yellow Prescription issuance certified for ${selectedMed.name} (Qty: ${quantity}) by Dr. ${currentUser.name} (PRC: ${currentUser.prcLicense})`);
        toast.success("S2 Issuance certified and logged.");
        onClose();
    };

    const handlePrint = () => {
        if (!selectedMed || s2Status.violation || isSafetyBlocked) return;
        if (needsJustification && !isJustificationValid) { toast.error("Narrative too short."); return; }
        if (selectedMed.isS2Controlled) {
            toast.error("Regulatory Restriction: Controlled substances require manual Yellow Prescription.");
            return;
        }

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text(currentUser.name.toUpperCase(), 74, 15, { align: 'center' });
        doc.setFontSize(9); doc.text(`${currentUser.specialization || 'Dental Surgeon'}`, 74, 20, { align: 'center' });
        doc.text(`PRC: ${currentUser.prcLicense} | PTR: ${currentUser.ptrNumber} | PDEA S2: ${currentUser.s2License || 'N/A'}`, 74, 25, { align: 'center' });
        doc.line(10, 32, 138, 32);

        doc.setFontSize(10); doc.text(`PATIENT: ${patient.name}`, 15, 40);
        doc.text(`AGE: ${patient.age || '-'}   SEX: ${patient.sex || '-'}`, 15, 45);
        if (isPediatric) doc.text(`WEIGHT: ${patientWeight} kg`, 100, 45);
        doc.text(`DATE: ${new Date().toLocaleDateString()}`, 100, 40);

        doc.setFontSize(30); doc.setFont('times', 'italic'); doc.text("Rx", 15, 60);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(`${selectedMed.name.toUpperCase()} ${dosage}`, 25, 65);
        doc.setFont('helvetica', 'normal'); doc.text(`Disp: #${quantity}`, 25, 75);
        doc.text(`Sig: ${instructions}`, 25, 85);
        
        if (needsJustification) { doc.setFontSize(7); doc.text(`Override: ${clinicalJustification}`, 25, 110, { maxWidth: 100 }); }

        doc.line(80, 160, 130, 160); doc.setFontSize(8); doc.text("Prescriber's Signature", 105, 164, { align: 'center' });

        const footerY = pageHeight - 20;
        doc.setFillColor(245, 245, 245); doc.rect(5, footerY, pageWidth - 10, 15, 'F');
        doc.setTextColor(150, 150, 150); doc.setFont('courier', 'bold'); doc.setFontSize(7); doc.text("FORENSIC RECORD INTEGRITY (CONTENT-HASHED)", 10, footerY + 5);
        const rawContent = `${selectedMed.id}|${dosage}|${quantity}|${patient.id}|${new Date().toDateString()}`;
        const integrityToken = CryptoJS.SHA256(rawContent).toString().toUpperCase().substring(0, 24);
        doc.text(`DIGITAL INTEGRITY TOKEN: ${integrityToken}`, 10, footerY + 8);
        doc.save(`Prescription_${patient.surname}_${selectedMed.name}.pdf`);
        if (logAction) logAction('EXPORT_RECORD', 'System', patient.id, `Printed E-Prescription for ${selectedMed.name}. Pediatric Weight: ${patientWeight}kg.`);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-teal-900 text-white rounded-t-3xl">
                    <div className="flex items-center gap-3"><Pill size={24}/><div><h2 className="text-xl font-bold">Clinical Prescription</h2><p className="text-xs text-teal-200">{patient.name}</p></div></div>
                    <button onClick={onClose}><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                    
                    {/* --- PEDIATRIC SAFETY GATE --- */}
                    {isPediatric && (
                        <div className="bg-red-50 border-2 border-red-200 p-5 rounded-3xl space-y-4 animate-in slide-in-from-top-4 shadow-lg ring-4 ring-red-500/5">
                            <div className="flex items-center gap-3 text-red-700">
                                <Baby size={28} />
                                <h3 className="font-black uppercase tracking-tight text-sm">Pediatric Safety Checklist</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-red-800 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-1"><Scale size={12}/> Current Weight (kg) *</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={patientWeight} 
                                        onChange={e => setPatientWeight(e.target.value)} 
                                        className="w-full p-3 bg-white border-2 border-red-100 rounded-xl font-black text-lg text-red-700 outline-none focus:border-red-500" 
                                        placeholder="0.0"
                                    />
                                </div>
                                <div className="flex items-end pb-1">
                                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${isDosageVerified ? 'bg-teal-50 border-teal-500 text-teal-900' : 'bg-white border-red-200 text-slate-400'}`}>
                                        <input type="checkbox" checked={isDosageVerified} onChange={e => setIsDosageVerified(e.target.checked)} className="w-5 h-5 accent-teal-600 rounded" />
                                        <span className="text-[9px] font-black uppercase tracking-tight leading-none">Dosage accuracy verified against weight</span>
                                    </label>
                                </div>
                            </div>
                            <p className="text-[10px] text-red-600 font-bold italic leading-tight">Requirement: Dosage must be calculated based on milligrams per kilogram (mg/kg). Verification is mandatory to prevent overdose liability.</p>
                        </div>
                    )}

                    {selectedMed?.isS2Controlled ? (
                        <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-3xl space-y-4 animate-in slide-in-from-top-4 shadow-lg">
                            <div className="flex items-center gap-3 text-amber-800">
                                <ShieldAlert size={32} />
                                <h3 className="font-black uppercase tracking-tight text-sm">Regulatory Restriction: S2 Issuance</h3>
                            </div>
                            <p className="text-xs text-amber-900 font-medium leading-relaxed">
                                Statutory Rule: S2 Drugs require a <strong>Manual Yellow Prescription</strong>. Digital PDF issuance for controlled substances is restricted to prevent unauthorized duplication.
                            </p>
                        </div>
                    ) : needsJustification && (
                        <div className="bg-white p-4 rounded-2xl border-2 border-orange-200 shadow-sm space-y-3 animate-in shake duration-500">
                            <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1"><ShieldAlert size={12}/> Prescriber's Justification (Allergy/Conflict) *</label>
                            <textarea value={clinicalJustification} onChange={e => setClinicalJustification(e.target.value)} placeholder="Forensic narrative required (Min 20 chars)..." className="w-full p-3 bg-orange-50 border border-orange-100 rounded-xl text-xs font-bold outline-none h-20" />
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Medication Selection</label>
                        <select value={selectedMedId} onChange={e => handleMedicationSelect(e.target.value)} className="w-full p-3 border-2 border-slate-100 rounded-xl bg-white outline-none focus:border-teal-500 font-bold">
                            <option value="">- Choose Medication -</option>
                            {medications.map(m => <option key={m.id} value={m.id}>{m.name} {m.isS2Controlled ? '💊 S2 CONTROLLED' : ''}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2"><label className="label">Dosage</label><input type="text" value={dosage} onChange={e => setDosage(e.target.value)} className="input" /></div>
                        <div><label className="label">Qty</label><input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="input font-bold" /></div>
                    </div>
                    <div><label className="label">Instructions (Sig)</label><textarea value={instructions} onChange={e => setInstructions(e.target.value)} className="input h-20" /></div>
                    
                    <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 flex items-center gap-3">
                        <Fingerprint size={20} className="text-slate-400"/>
                        <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight">
                            SHA-256 Content-Hashing active. Any alteration to dosage or quantity on the PDF will invalidate the digital validation token.
                        </p>
                    </div>
                </div>

                <div className="p-4 border-t bg-white flex justify-end gap-3 rounded-b-3xl shrink-0">
                    <button onClick={onClose} className="px-6 py-2 font-bold rounded-xl text-slate-400">Cancel</button>
                    {!selectedMed?.isS2Controlled && (
                        <button onClick={handlePrint} disabled={!selectedMedId || (needsJustification && !isJustificationValid) || isSafetyBlocked} className="px-10 py-3 bg-teal-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl shadow-teal-600/20 disabled:opacity-40 flex items-center gap-2 transition-all active:scale-95">
                            <Printer size={16}/> Print Hash-Bound Rx
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EPrescriptionModal;


import React, { useState, useMemo, useRef } from 'react';
import { Patient, Medication, FieldSettings, User } from '../types';
import { X, Pill, Printer, AlertTriangle, ShieldAlert, Lock, AlertCircle, ShieldOff, Baby, Activity, Calendar, Camera, Upload, CheckCircle, Fingerprint, Scale, Zap, ShieldOff as ShieldX, FileWarning, BookOpen, HeartPulse } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useToast } from './ToastSystem';
import CryptoJS from 'crypto-js';
import { useSettings } from '../contexts/SettingsContext';
import { calculateAge } from '../constants';

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
    const { fieldSettings: settings } = useSettings();
    const [selectedMedId, setSelectedMedId] = useState<string>('');
    const [dosage, setDosage] = useState('');
    const [instructions, setInstructions] = useState('');
    const [quantity, setQuantity] = useState('');
    const [clinicalJustification, setClinicalJustification] = useState('');
    const [yellowRxSerial, setYellowRxSerial] = useState('');
    const [consentAcknowledged, setConsentAcknowledged] = useState(false);
    
    // Pediatric Safety State
    const [patientWeight, setPatientWeight] = useState<string>(patient.weightKg?.toString() || '');
    const [isDosageVerified, setIsDosageVerified] = useState(false);

    const medications = fieldSettings.medications || [];
    const selectedMed = useMemo(() => medications.find(m => m.id === selectedMedId), [selectedMedId, medications]);
    
    const drugsAndMedsConsent = useMemo(() => {
        return settings.consentFormTemplates.find(t => t.id === 'DRUGS_MEDICATIONS')?.content_en || "Default drugs and medications warning text.";
    }, [settings.consentFormTemplates]);

    const isPediatric = (calculateAge(patient.dob) || 0) < 12;
    
    // --- PRC AUTHORITY HARD LOCK ---
    const isPrcExpired = useMemo(() => {
        if (!currentUser.prcExpiry) return false;
        return new Date(currentUser.prcExpiry) < new Date();
    }, [currentUser.prcExpiry]);

    const isAuthorityLocked = isPrcExpired; 

    // DIAGNOSIS ANCHOR LOGIC
    const linkedDiagnosis = useMemo(() => {
        if (!patient.dentalChart) return null;
        const today = new Date().toISOString().split('T')[0];
        return patient.dentalChart.find(entry => 
            entry.date === today && 
            entry.assessment && 
            entry.assessment.trim().length > 0 &&
            entry.sealedHash
        );
    }, [patient.dentalChart]);

    const safetyViolation = useMemo(() => {
        if (!isPediatric || !selectedMed || !patientWeight || !dosage) return null;
        const weight = parseFloat(patientWeight);
        if (isNaN(weight) || weight <= 0) return "Invalid Weight";
        
        const dosageMatch = dosage.match(/(\d+)/);
        if (!dosageMatch || !selectedMed.maxMgPerKg) return null;
        
        const doseMg = parseFloat(dosageMatch[1]);
        const maxSafeDose = selectedMed.maxMgPerKg * weight;
        
        if (doseMg > maxSafeDose) {
            return `Dosage (${doseMg}mg) exceeds pediatric safety threshold (${maxSafeDose.toFixed(1)}mg) for this weight.`;
        }
        return null;
    }, [isPediatric, selectedMed, patientWeight, dosage]);

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

    const needsJustification = !!allergyConflict || !!drugInteraction || !!safetyViolation;
    const isJustificationValid = clinicalJustification.trim().length >= 20;

    const isSafetyBlocked = isPediatric && (!patientWeight || !isDosageVerified || (safetyViolation && !isJustificationValid));

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

    const handleLogS2 = () => {
        if (!yellowRxSerial.trim() || !consentAcknowledged) return;
        if (logAction) {
            logAction('SECURITY_ALERT', 'ClinicalNote', patient.id, `PDEA S2 REGISTRY: Manual Yellow Prescription issued for ${selectedMed?.genericName}. Serial: ${yellowRxSerial}. Issued by Dr. ${currentUser.name}.`);
        }
        toast.success("S2 Issuance committed to digital logbook.");
        setYellowRxSerial('');
        onClose();
    };

    const handlePrint = () => {
        if (isAuthorityLocked) {
            toast.error("CLINICAL AUTHORITY LOCK: Prescription issuance is suspended due to an expired PRC License.");
            return;
        }

        if (!consentAcknowledged) {
            toast.error("MANDATORY DISCLOSURE: Patient must acknowledge the Drugs & Medications warning from Page 2.");
            return;
        }

        if (!linkedDiagnosis) {
            const proceed = window.confirm("PDA ETHICS ALERT: You are issuing a prescription without a corresponding recorded and SEALED clinical assessment (A) for today's session. This increases your malpractice liability exposure. Proceed at your own risk?");
            if (!proceed) return;
        }

        if (!selectedMed || s2Status.violation || isSafetyBlocked) {
            if (isPediatric && !patientWeight) toast.error("SAFETY BLOCK: Pediatric weight is mandatory for minor patients.");
            return;
        }
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
        doc.text(`AGE: ${calculateAge(patient.dob) || '-'}   SEX: ${patient.sex || '-'}`, 15, 45);
        if (isPediatric) doc.text(`WEIGHT: ${patientWeight} kg`, 100, 45);
        doc.text(`DATE: ${new Date().toLocaleDateString()}`, 100, 40);

        doc.setFontSize(30); doc.setFont('times', 'italic'); doc.text("Rx", 15, 60);
        
        const genericText = selectedMed.genericName.toUpperCase();
        const brandText = selectedMed.brandName ? `(${selectedMed.brandName})` : '';
        
        // RA 6675: Generic name MUST be more prominent (larger font)
        doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text(genericText, 25, 65);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(brandText, 25, 71);
        doc.setFontSize(12); doc.text(`Dosage: ${dosage}`, 25, 78);
        
        doc.setFont('helvetica', 'normal'); doc.text(`Disp: #${quantity}`, 25, 88);
        doc.text(`Sig: ${instructions}`, 25, 96);
        
        if (needsJustification) { doc.setFontSize(7); doc.text(`Override: ${clinicalJustification}`, 25, 115, { maxWidth: 100 }); }

        doc.line(80, 160, 130, 160); doc.setFontSize(8); doc.text("Prescriber's Signature", 105, 164, { align: 'center' });

        const footerY = pageHeight - 20;
        doc.setFillColor(245, 245, 245); doc.rect(5, footerY, pageWidth - 10, 15, 'F');
        doc.setTextColor(150, 150, 150); doc.setFont('courier', 'bold'); doc.setFontSize(7); doc.text("FORENSIC RECORD INTEGRITY (CONTENT-HASHED)", 10, footerY + 5);
        const rawContent = `${selectedMed.id}|${dosage}|${quantity}|${patient.id}|${new Date().toDateString()}`;
        const integrityToken = CryptoJS.SHA256(rawContent).toString().toUpperCase().substring(0, 24);
        doc.text(`DIGITAL INTEGRITY TOKEN: ${integrityToken}`, 10, footerY + 8);
        doc.save(`Prescription_${patient.surname}_${selectedMed.genericName}.pdf`);
        if (logAction) logAction('EXPORT_RECORD', 'System', patient.id, `Printed E-Prescription for ${selectedMed.genericName}. RA 6675 Prominence applied.`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4" role="dialog" aria-labelledby="rx-title" aria-modal="true">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-teal-900 text-white rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <Pill size={24} aria-hidden="true"/>
                        <div>
                            <h2 id="rx-title" className="text-xl font-bold">Clinical Prescription</h2>
                            <p className="text-xs text-teal-200 uppercase font-black tracking-widest">RA 6675 Generics Act Governance</p>
                        </div>
                    </div>
                    <button onClick={onClose} aria-label="Close prescription module"><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 no-scrollbar">
                    
                    {/* Verbatim Drugs & Medications Warning */}
                    <div className="bg-red-50 border-2 border-red-200 p-6 rounded-3xl space-y-4 shadow-sm animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3 text-red-700">
                            <HeartPulse size={24} className="animate-pulse" />
                            <h3 className="font-black uppercase tracking-tight text-xs">Mandatory Allergic Risk Disclosure</h3>
                        </div>
                        <p className="text-xs text-red-900 font-medium leading-relaxed italic">
                            "{drugsAndMedsConsent}"
                        </p>
                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${consentAcknowledged ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-white border-red-200'}`}>
                            <input type="checkbox" checked={consentAcknowledged} onChange={e => setConsentAcknowledged(e.target.checked)} className="w-6 h-6 accent-teal-600 rounded" />
                            <span className="text-[10px] font-black uppercase text-teal-950 tracking-widest">I acknowledge these potential adverse reactions *</span>
                        </label>
                    </div>

                    {isAuthorityLocked && (
                        <div className="bg-red-600 text-white p-6 rounded-3xl shadow-xl flex items-center gap-5 animate-in shake duration-500 mb-2 border-4 border-red-400" role="alert">
                            <Lock size={32} className="shrink-0" aria-hidden="true" />
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tighter">Clinical Authority Locked</h3>
                                <p className="text-xs font-bold opacity-90 leading-relaxed mt-1">Prescription functions are suspended for legal compliance due to an expired practitioner license.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center mb-2">
                        {linkedDiagnosis ? (
                            <div className="bg-teal-50 border border-teal-200 px-4 py-2 rounded-2xl flex items-center gap-2 animate-in fade-in zoom-in-95" role="status">
                                <CheckCircle size={16} className="text-teal-600" aria-hidden="true"/>
                                <span className="text-xs font-black text-teal-700 uppercase tracking-widest">Diagnosis Linked: #{linkedDiagnosis.id.substring(0,8)}</span>
                            </div>
                        ) : (
                            <div className="bg-orange-50 border border-orange-200 px-4 py-2 rounded-2xl flex items-center gap-2 animate-in shake duration-500" role="alert">
                                <FileWarning size={16} className="text-orange-600" aria-hidden="true"/>
                                <span className="text-xs font-black text-orange-700 uppercase tracking-widest">Ethics Alert: Assessment Missing Today</span>
                            </div>
                        )}
                    </div>

                    {isPediatric && (
                        <div className="bg-red-50 border-2 border-red-200 p-5 rounded-3xl space-y-4 animate-in slide-in-from-top-4 shadow-lg ring-4 ring-red-500/5" role="region" aria-label="Pediatric Safety Checks">
                            <div className="flex items-center gap-3 text-red-700">
                                <Baby size={28} aria-hidden="true" />
                                <h3 className="font-black uppercase tracking-tight text-sm">Pediatric Safety Checklist</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-red-800 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-1"><Scale size={12} aria-hidden="true"/> Current Weight (kg) *</label>
                                    <input 
                                        type="number" 
                                        required 
                                        aria-required="true"
                                        value={patientWeight} 
                                        onChange={e => setPatientWeight(e.target.value)} 
                                        className="w-full p-3 bg-white border-2 border-red-100 rounded-xl font-black text-lg text-red-700 outline-none focus:border-red-500" 
                                        placeholder="0.0"
                                    />
                                </div>
                                <div className="flex items-end pb-1">
                                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${isDosageVerified ? 'bg-teal-50 border-teal-500 text-teal-900' : 'bg-white border-red-200 text-slate-500'}`}>
                                        <input type="checkbox" checked={isDosageVerified} onChange={e => setIsDosageVerified(e.target.checked)} className="w-5 h-5 accent-teal-600 rounded" />
                                        <span className="text-xs font-black uppercase tracking-tight leading-none">Verified against weight</span>
                                    </label>
                                </div>
                            </div>
                            {safetyViolation && (
                                <div className="p-4 bg-red-600 text-white rounded-2xl flex items-start gap-3 animate-pulse border-2 border-white/20" role="alert">
                                    <ShieldAlert size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
                                    <div>
                                        <div className="font-black text-xs uppercase tracking-widest">Dosage Threshold Breach</div>
                                        <p className="text-xs font-bold leading-tight mt-1">{safetyViolation}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {selectedMed?.isS2Controlled ? (
                        <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-3xl space-y-4 animate-in slide-in-from-top-4 shadow-lg" role="alert">
                            <div className="flex items-center gap-3 text-amber-800">
                                <BookOpen size={32} aria-hidden="true" />
                                <h3 className="font-black uppercase tracking-tight text-sm">PDEA S2 Statutory Logbook</h3>
                            </div>
                            <p className="text-xs text-amber-900 font-bold leading-relaxed uppercase tracking-wide">
                                Controlled substances require a <strong>Physical Yellow Prescription</strong>. Record the serial number here to generate the mandatory digital audit trail.
                            </p>
                            <div className="space-y-2 pt-2">
                                <label className="text-[10px] font-black text-amber-800 uppercase tracking-widest ml-1 block">Yellow Rx Serial Number *</label>
                                <input 
                                    type="text"
                                    value={yellowRxSerial}
                                    onChange={e => setYellowRxSerial(e.target.value)}
                                    placeholder="SN-XXXXXXX"
                                    className="w-full p-4 bg-white border-2 border-amber-300 rounded-2xl font-black text-xl text-amber-900 outline-none focus:border-amber-600"
                                />
                            </div>
                            <button 
                                onClick={handleLogS2}
                                disabled={!yellowRxSerial.trim() || !consentAcknowledged}
                                className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-50"
                            >
                                Commit to Statutory Logbook
                            </button>
                        </div>
                    ) : needsJustification && (
                        <div className="bg-white p-4 rounded-2xl border-2 border-orange-200 shadow-sm space-y-3 animate-in shake duration-500">
                            <div className="flex items-center gap-2 text-orange-600 mb-1">
                                <Zap size={14} className="animate-pulse" aria-hidden="true"/>
                                <label className="text-xs font-black uppercase tracking-widest text-orange-800">Prescriber's Forensic Overrule Narrative *</label>
                            </div>
                            <textarea value={clinicalJustification} onChange={e => setClinicalJustification(e.target.value)} placeholder="Mandatory narrative justifying this high-risk prescription (Min 20 chars)..." className="w-full p-3 bg-orange-50 border border-orange-100 rounded-xl text-xs font-bold outline-none h-20" />
                        </div>
                    )}

                    {!selectedMed?.isS2Controlled && (
                        <>
                        <div>
                            <label className="block text-xs font-black uppercase text-slate-500 mb-2 tracking-widest">Medication Selection (RA 6675)</label>
                            <select 
                                aria-label="Select medication"
                                value={selectedMedId} 
                                onChange={e => handleMedicationSelect(e.target.value)} 
                                className="w-full p-3 border-2 border-slate-100 rounded-xl bg-white outline-none focus:border-teal-500 font-bold text-sm"
                            >
                                <option value="">- Choose Medication -</option>
                                {medications.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.genericName.toUpperCase()} {m.brandName ? `(${m.brandName})` : ''} {m.isS2Controlled ? ' 💊 S2' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedMed && (
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-inner flex flex-col items-center text-center gap-2 animate-in fade-in duration-500">
                                <div className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">{selectedMed.genericName}</div>
                                {selectedMed.brandName && <div className="text-xs font-bold text-slate-500 uppercase tracking-widest italic">Brand: {selectedMed.brandName}</div>}
                                <div className="mt-2 px-4 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-black uppercase tracking-widest border border-teal-100">RA 6675 Compliant Prominence</div>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="label font-black text-xs">Dosage Strength</label>
                                <input type="text" value={dosage} onChange={e => setDosage(e.target.value)} className="input text-sm" placeholder="e.g. 500mg" />
                            </div>
                            <div>
                                <label className="label font-black text-xs">Quantity</label>
                                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="input font-black text-sm" placeholder="#" />
                            </div>
                        </div>
                        <div>
                            <label className="label font-black text-xs">Instructions (Signa)</label>
                            <textarea value={instructions} onChange={e => setInstructions(e.target.value)} className="input h-20 text-sm" placeholder="Take as directed..." />
                        </div>
                        </>
                    )}
                    
                    <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 flex items-center gap-3">
                        <Fingerprint size={20} className="text-slate-500" aria-hidden="true"/>
                        <p className="text-xs font-bold text-slate-600 uppercase leading-tight tracking-tight">
                            SHA-256 Integrity Active. Generic prominence is structurally enforced for statutory compliance.
                        </p>
                    </div>
                </div>

                <div className="p-4 border-t bg-white flex justify-end gap-3 rounded-b-3xl shrink-0">
                    <button onClick={onClose} className="px-6 py-3 font-bold rounded-xl text-slate-500 uppercase text-xs tracking-widest hover:bg-slate-50 transition-colors">Cancel</button>
                    {!selectedMed?.isS2Controlled && (
                        <button 
                          onClick={handlePrint} 
                          disabled={!selectedMedId || (needsJustification && !isJustificationValid) || isSafetyBlocked || isAuthorityLocked || !consentAcknowledged} 
                          className={`px-10 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl flex items-center gap-3 transition-all active:scale-95 disabled:opacity-40 disabled:grayscale ${isAuthorityLocked ? 'bg-slate-300 text-slate-600 cursor-not-allowed' : 'bg-teal-600 text-white shadow-teal-600/20 hover:bg-teal-700'}`}
                        >
                            {isAuthorityLocked ? <Lock size={16} aria-hidden="true"/> : <Printer size={16} aria-hidden="true"/>} 
                            {isAuthorityLocked ? 'License Locked' : 'Print Prominent generic Rx'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EPrescriptionModal;

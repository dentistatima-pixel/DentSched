

import React, { useState, useRef, useEffect } from 'react';
import { Patient, InformedRefusal, User, SignatureChainEntry } from '../types';
import { XCircle, FileSignature, AlertTriangle, ShieldCheck, Square, CheckSquare, Eraser, CheckCircle, User as UserIcon, Shield } from 'lucide-react';
import { useToast } from './ToastSystem';
import { generateUid } from '../constants';
import { createSignatureEntry } from '../services/signatureVerification';
import { useStaff } from '../contexts/StaffContext';

interface InformedRefusalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (refusal: Omit<InformedRefusal, 'id' | 'patientId'>) => void;
    patient: Patient;
    currentUser: User;
    relatedEntity: InformedRefusal['relatedEntity'];
    risks: string[];
    alternatives: string[];
    recommendation: string;
}

const SignaturePad: React.FC<{
    title: string;
    onSign: (dataUrl: string) => void;
    disabled?: boolean;
    isSigned?: boolean;
}> = ({ title, onSign, disabled, isSigned }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isSigning, setIsSigning] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = 120;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
            }
        }
    }, []);
    
    const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const startSign = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (disabled || isSigned) return;
        if (e.pointerType === 'touch' && (e.width > 25 || e.height > 25)) {
            e.preventDefault();
            return;
        }
        setIsSigning(true);
        const { x, y } = getCoords(e);
        const ctx = e.currentTarget.getContext('2d');
        ctx?.beginPath();
        ctx?.moveTo(x, y);
    };

    const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isSigning || disabled || isSigned) return;
        const { x, y } = getCoords(e);
        const ctx = e.currentTarget.getContext('2d');
        ctx?.lineTo(x, y);
        ctx?.stroke();
    };

    const endSign = () => {
        if (isSigning && canvasRef.current) {
            onSign(canvasRef.current.toDataURL());
        }
        setIsSigning(false);
    };

    return (
        <div className={`relative ${isSigned ? 'opacity-50' : ''}`}>
            <label className="label text-sm">{title}</label>
            <canvas
                ref={canvasRef}
                className={`w-full touch-none bg-white rounded-lg border-2 border-dashed ${disabled || isSigned ? 'cursor-not-allowed bg-slate-100' : 'cursor-crosshair border-slate-300'}`}
                onPointerDown={startSign}
                onPointerMove={draw}
                onPointerUp={endSign}
                onPointerLeave={endSign}
            />
            {isSigned && <CheckCircle size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-500" />}
        </div>
    );
};


const InformedRefusalModal: React.FC<InformedRefusalModalProps> = ({
    isOpen, onClose, onSave, patient, currentUser, relatedEntity, risks, alternatives, recommendation
}) => {
    const toast = useToast();
    const { staff } = useStaff();
    
    const [acknowledgedRisks, setAcknowledgedRisks] = useState<string[]>([]);
    const [understandsConsequences, setUnderstandsConsequences] = useState(false);
    const [refusalReason, setRefusalReason] = useState('');
    
    const [patientSignatureChain, setPatientSignatureChain] = useState<SignatureChainEntry[]>([]);
    const [dentistSignatureChain, setDentistSignatureChain] = useState<SignatureChainEntry[]>([]);
    const [witnessSignatureChain, setWitnessSignatureChain] = useState<SignatureChainEntry[]>([]);
    
    const [showWitness, setShowWitness] = useState(false);
    const [witnessId, setWitnessId] = useState('');
    const [witnessPin, setWitnessPin] = useState('');
    
    useEffect(() => {
        if (isOpen) {
            setAcknowledgedRisks([]);
            setUnderstandsConsequences(false);
            setRefusalReason('');
            setPatientSignatureChain([]);
            setDentistSignatureChain([]);
            setWitnessSignatureChain([]);
            setShowWitness(false);
            setWitnessId('');
            setWitnessPin('');
        }
    }, [isOpen]);

    const allRisksAcknowledged = acknowledgedRisks.length === risks.length;
    
    const handleSave = () => {
        if (!allRisksAcknowledged || !understandsConsequences || !refusalReason.trim() || patientSignatureChain.length === 0 || dentistSignatureChain.length === 0) {
            toast.error("Please complete all required fields and signatures.");
            return;
        }

        onSave({
            relatedEntity, refusalReason,
            risksDisclosed: risks.map(r => ({ risk: r, acknowledged: acknowledgedRisks.includes(r) })),
            // FIX: The property 'alternativesOffered' did not exist on the type. Changed to 'alternativesDiscussed' and mapped to the correct object structure.
            alternativesDiscussed: alternatives.map(alt => ({ alternative: alt })),
            dentistRecommendation: recommendation,
            patientUnderstandsConsequences: understandsConsequences,
            patientSignatureChain,
            dentistSignatureChain,
            witnessSignatureChain: showWitness ? witnessSignatureChain : undefined,
            witnessName: showWitness ? staff.find(s => s.id === witnessId)?.name : undefined,
            formVersion: '1.0',
        });
        onClose();
    };

    const handleSign = async (signer: 'patient' | 'dentist' | 'witness', signatureDataUrl: string) => {
        let previousHash = '0';
        let metadata: Record<string, any> = {
            consentType: 'InformedRefusal',
            relatedEntity: relatedEntity.entityDescription,
        };

        const signerRole = signer === 'patient' 
            ? 'Patient' 
            : signer === 'dentist' 
            ? 'Dentist' 
            : 'Witness';

        const signerName = signer === 'patient' 
            ? patient.name 
            : signer === 'dentist' 
            ? currentUser.name
            : staff.find(s => s.id === witnessId)?.name || 'Unknown Witness';

        if(signer === 'witness') {
            const witnessUser = staff.find(s => s.id === witnessId);
            if (!witnessUser || witnessUser.pin !== witnessPin) {
                toast.error("Invalid witness PIN.");
                return;
            }
            metadata.witnessVerified = true;
        }

        const signatureEntry = await createSignatureEntry(signatureDataUrl, {
            signerName,
            signerRole,
            signatureType: signer,
            previousHash,
            metadata,
        });

        if (signer === 'patient') setPatientSignatureChain([signatureEntry]);
        if (signer === 'dentist') setDentistSignatureChain([signatureEntry]);
        if (signer === 'witness') setWitnessSignatureChain([signatureEntry]);
    };

    if (!isOpen) return null;
    
    const canSave = allRisksAcknowledged && understandsConsequences && refusalReason.trim() !== '' && patientSignatureChain.length > 0 && dentistSignatureChain.length > 0 && (!showWitness || witnessSignatureChain.length > 0);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-red-100 bg-red-50 flex items-center gap-3">
                    <XCircle size={28} className="text-red-600"/>
                    <div>
                        <h2 className="text-xl font-black text-red-900 uppercase tracking-tight">Informed Refusal of Treatment</h2>
                        <p className="text-xs text-red-700 font-bold uppercase">Medico-Legal Documentation</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-900 text-sm font-bold leading-relaxed flex items-start gap-3">
                        <AlertTriangle className="shrink-0 mt-1"/>
                        <span>This form documents that the patient has been informed of, understands, and accepts the risks of refusing the recommended dental treatment.</span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-500">Item Refused:</p>
                        <p className="font-bold text-slate-800">{relatedEntity.entityDescription}</p>
                    </div>
                    
                    <div>
                        <label className="label">Patient's Stated Reason for Refusal *</label>
                        <textarea value={refusalReason} onChange={e => setRefusalReason(e.target.value)} className="input h-20" disabled={patientSignatureChain.length > 0} />
                    </div>

                    <div className="p-4 rounded-xl border bg-white border-slate-200">
                        <h4 className="font-black text-slate-800 text-sm mb-3">Risks Disclosed & Acknowledged *</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {risks.map(risk => (
                                <label key={risk} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                                    <input type="checkbox" checked={acknowledgedRisks.includes(risk)} onChange={() => setAcknowledgedRisks(p => p.includes(risk) ? p.filter(r => r !== risk) : [...p, risk])} className="w-5 h-5 accent-teal-600 mt-0.5" disabled={patientSignatureChain.length > 0}/>
                                    <span className="text-sm font-medium text-slate-700">{risk}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    <label className="flex items-start gap-4 p-4 rounded-xl border-2 bg-white cursor-pointer">
                        <input type="checkbox" checked={understandsConsequences} onChange={e => setUnderstandsConsequences(e.target.checked)} className="w-6 h-6 accent-teal-600 mt-1" disabled={patientSignatureChain.length > 0}/>
                        <span className="font-bold text-slate-800">I attest that I understand the consequences and voluntarily refuse the recommended treatment. *</span>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                        <SignaturePad title="Patient Signature *" onSign={(data) => handleSign('patient', data)} disabled={!allRisksAcknowledged || !understandsConsequences} isSigned={patientSignatureChain.length > 0} />
                        <SignaturePad title="Dentist Signature *" onSign={(data) => handleSign('dentist', data)} disabled={patientSignatureChain.length === 0} isSigned={dentistSignatureChain.length > 0} />
                    </div>

                    <div className="pt-4 border-t">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={showWitness} onChange={e => setShowWitness(e.target.checked)} className="w-5 h-5 accent-teal-600"/>
                            <span className="font-bold text-sm">Add Witness Signature (Optional)</span>
                        </label>
                        {showWitness && (
                            <div className="mt-4 p-4 bg-slate-50 rounded-xl border space-y-4 animate-in fade-in">
                                <div className="grid grid-cols-2 gap-4">
                                    <select value={witnessId} onChange={e => setWitnessId(e.target.value)} className="input">
                                        <option value="">Select Witness...</option>
                                        {staff.filter(s => s.id !== currentUser.id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <input type="password" value={witnessPin} onChange={e => setWitnessPin(e.target.value)} className="input" placeholder="Witness PIN"/>
                                </div>
                                <SignaturePad title="Witness Signature" onSign={(data) => handleSign('witness', data)} disabled={!witnessId || witnessPin.length < 4} isSigned={witnessSignatureChain.length > 0} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t bg-white flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                    <button onClick={handleSave} disabled={!canSave} className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
                        <CheckCircle size={20}/> Attest & Save Refusal
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InformedRefusalModal;
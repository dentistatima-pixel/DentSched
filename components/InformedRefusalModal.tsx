import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Patient, InformedRefusal, User } from '../types';
import { XCircle, AlertTriangle, Eraser, CheckCircle } from 'lucide-react';
import { useToast } from './ToastSystem';

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

const InformedRefusalModal: React.FC<InformedRefusalModalProps> = ({
    isOpen, onClose, onSave, relatedEntity, risks, alternatives, recommendation
}) => {
    const patientCanvasRef = useRef<HTMLCanvasElement>(null);
    const dentistCanvasRef = useRef<HTMLCanvasElement>(null);
    const toast = useToast();
    
    const [acknowledgedRisks, setAcknowledgedRisks] = useState<string[]>([]);
    const [understandsConsequences, setUnderstandsConsequences] = useState(false);
    const [refusalReason, setRefusalReason] = useState('');
    const [isVoluntary, setIsVoluntary] = useState(false);
    
    const [patientSignatureData, setPatientSignatureData] = useState<string | null>(null);
    const [dentistSignatureData, setDentistSignatureData] = useState<string | null>(null);

    const allRisksAcknowledged = acknowledgedRisks.length === risks.length;
    const affirmationsChecked = allRisksAcknowledged && understandsConsequences && isVoluntary;
    const canPatientSign = affirmationsChecked && !patientSignatureData;
    const canDentistSign = !!patientSignatureData && !dentistSignatureData;
    const canSave = !!patientSignatureData && !!dentistSignatureData && refusalReason.trim() !== '';

    // --- START: Refactored Signature Logic ---
    const activeCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const isDrawingRef = useRef(false);
    const lastDrawTime = useRef(0);

    const getCoords = (e: PointerEvent) => {
        if (!activeCanvasRef.current) return { x: 0, y: 0, pressure: 0.5 };
        const canvas = activeCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure };
    };

    const draw = useCallback((e: PointerEvent) => {
        if (!isDrawingRef.current || !activeCanvasRef.current) return;
        e.preventDefault();

        const now = Date.now();
        if (now - lastDrawTime.current < 16) return;
        lastDrawTime.current = now;

        const canvas = activeCanvasRef.current;
        const { x, y, pressure } = getCoords(e);
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const isPen = e.pointerType === 'pen';
            const effectivePressure = isPen ? (pressure || 0.7) : 0.5;
            const baseWidth = isPen ? 1.5 : 2;
            ctx.lineWidth = Math.max(1, Math.min(4, effectivePressure * baseWidth * 2));
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }, []);

    const stopSign = useCallback((e: PointerEvent) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();
        
        if (activeCanvasRef.current === patientCanvasRef.current) {
            setPatientSignatureData(patientCanvasRef.current!.toDataURL());
        } else if (activeCanvasRef.current === dentistCanvasRef.current) {
            setDentistSignatureData(dentistCanvasRef.current!.toDataURL());
        }

        isDrawingRef.current = false;
        activeCanvasRef.current = null;
        window.removeEventListener('pointermove', draw);
        window.removeEventListener('pointerup', stopSign);
    }, [draw]);

    const startSign = (e: React.PointerEvent<HTMLCanvasElement>, signer: 'patient' | 'dentist') => {
        if (e.pointerType === 'touch' && e.width > 10) return;
        e.preventDefault();

        if ((signer === 'patient' && !canPatientSign) || (signer === 'dentist' && !canDentistSign)) return;
        
        isDrawingRef.current = true;
        activeCanvasRef.current = e.currentTarget;

        const { x, y } = getCoords(e.nativeEvent);
        const ctx = e.currentTarget.getContext('2d');
        ctx?.beginPath();
        ctx?.moveTo(x, y);

        window.addEventListener('pointermove', draw);
        window.addEventListener('pointerup', stopSign);
    };
    // --- END: Refactored Signature Logic ---

    const setupCanvas = (canvas: HTMLCanvasElement | null) => {
        if (canvas && canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = 100;
            const ctx = canvas.getContext('2d', { desynchronized: true });
            if (ctx) {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
            }
        }
    };
    
    useEffect(() => {
        if (isOpen) {
            setAcknowledgedRisks([]);
            setUnderstandsConsequences(false);
            setRefusalReason('');
            setIsVoluntary(false);
            setPatientSignatureData(null);
            setDentistSignatureData(null);
            setTimeout(() => {
                setupCanvas(patientCanvasRef.current);
                setupCanvas(dentistCanvasRef.current);
            }, 50);
        }
    }, [isOpen]);
    
    const clearCanvas = (signer: 'patient' | 'dentist') => {
        const canvasRef = signer === 'patient' ? patientCanvasRef : dentistCanvasRef;
        if ((signer === 'patient' && !patientSignatureData) || (signer === 'dentist' && !dentistSignatureData)) {
            const canvas = canvasRef.current;
            canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleSave = () => {
        if (!canSave) {
            toast.error("Please complete all fields and provide signatures.");
            return;
        }
        
        onSave({
            relatedEntity, refusalReason,
            risksDisclosed: risks.map(r => ({ risk: r, acknowledged: acknowledgedRisks.includes(r) })),
            alternativesOffered: alternatives,
            dentistRecommendation: recommendation,
            patientUnderstandsConsequences: understandsConsequences,
            patientSignature: patientSignatureData!,
            patientSignatureTimestamp: new Date().toISOString(),
            dentistSignature: dentistSignatureData!,
            dentistSignatureTimestamp: new Date().toISOString(),
            formVersion: '1.0',
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-red-100 bg-red-50 flex items-center gap-3">
                    <XCircle size={28} className="text-red-600"/>
                    <div>
                        <h2 className="text-xl font-black text-red-900 uppercase tracking-tight">Informed Refusal of Treatment</h2>
                        <p className="text-xs text-red-700 font-bold uppercase">Medico-Legal Documentation</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-900 text-sm font-bold leading-relaxed">
                        <AlertTriangle className="inline-block mr-2"/>
                        This form documents that the patient has been informed of, understands, and accepts the risks of refusing the recommended dental treatment.
                    </div>
                    
                    <div>
                        <label className="label">Patient's Stated Reason for Refusal</label>
                        <textarea value={refusalReason} onChange={e => setRefusalReason(e.target.value)} className="input h-20" disabled={!!patientSignatureData} />
                    </div>

                    <div className={`p-4 rounded-xl border transition-all ${patientSignatureData ? 'opacity-70 grayscale' : 'bg-slate-50 border-slate-200'}`}>
                        <h4 className="font-black text-slate-800 text-sm mb-3">Risks Disclosed & Acknowledged</h4>
                        {risks.map(risk => (
                            <label key={risk} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white cursor-pointer">
                                <input type="checkbox" checked={acknowledgedRisks.includes(risk)} onChange={() => setAcknowledgedRisks(p => p.includes(risk) ? p.filter(r => r !== risk) : [...p, risk])} className="w-5 h-5 accent-teal-600 mt-0.5" disabled={!!patientSignatureData}/>
                                <span className="text-sm font-medium text-slate-700">{risk}</span>
                            </label>
                        ))}
                    </div>

                    <label className={`flex items-start gap-4 p-4 rounded-xl border-2 bg-white cursor-pointer transition-all ${patientSignatureData ? 'opacity-70 grayscale' : 'border-slate-200'}`}>
                        <input type="checkbox" checked={understandsConsequences} onChange={e => setUnderstandsConsequences(e.target.checked)} className="w-6 h-6 accent-teal-600 mt-1" disabled={!!patientSignatureData}/>
                        <span className="font-bold text-slate-800">I attest that I have had the opportunity to ask questions, understand the consequences, and voluntarily refuse the recommended treatment.</span>
                    </label>

                    <label className={`flex items-start gap-4 p-4 rounded-xl border-2 bg-white cursor-pointer transition-all ${patientSignatureData ? 'opacity-70 grayscale' : 'border-slate-200'}`}>
                        <input type="checkbox" checked={isVoluntary} onChange={e => setIsVoluntary(e.target.checked)} className="w-6 h-6 accent-teal-600 mt-1" disabled={!!patientSignatureData}/>
                        <span className="font-bold text-slate-800">I am signing this form voluntarily after careful consideration.</span>
                    </label>

                    <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="font-bold text-slate-700 text-sm">Patient Signature</label>
                                {!patientSignatureData && <button onClick={() => clearCanvas('patient')} className="text-xs font-bold text-slate-400 hover:text-red-500"><Eraser size={12}/> Clear</button>}
                            </div>
                            <canvas ref={patientCanvasRef} className={`bg-white rounded-lg border-2 border-dashed border-slate-300 w-full touch-none ${!canPatientSign ? 'opacity-50 cursor-not-allowed' : 'cursor-crosshair'}`} onPointerDown={e => startSign(e, 'patient')} />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="font-bold text-slate-700 text-sm">Dentist Signature</label>
                                {!dentistSignatureData && <button onClick={() => clearCanvas('dentist')} className="text-xs font-bold text-slate-400 hover:text-red-500"><Eraser size={12}/> Clear</button>}
                            </div>
                            <canvas ref={dentistCanvasRef} className={`bg-white rounded-lg border-2 border-dashed border-slate-300 w-full touch-none ${!canDentistSign ? 'opacity-50 cursor-not-allowed' : 'cursor-crosshair'}`} onPointerDown={e => startSign(e, 'dentist')} />
                        </div>
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

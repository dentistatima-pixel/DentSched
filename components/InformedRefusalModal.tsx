
import React, { useState, useRef, useEffect } from 'react';
import { Patient, InformedRefusal, User } from '../types';
import { XCircle, FileSignature, AlertTriangle, ShieldCheck, Square, CheckSquare, Eraser, CheckCircle } from 'lucide-react';
import { useToast } from './ToastSystem';
import { generateUid } from '../constants';

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
    isOpen, onClose, onSave, patient, currentUser, relatedEntity, risks, alternatives, recommendation
}) => {
    const patientCanvasRef = useRef<HTMLCanvasElement>(null);
    const dentistCanvasRef = useRef<HTMLCanvasElement>(null);
    const toast = useToast();
    
    const [acknowledgedRisks, setAcknowledgedRisks] = useState<string[]>([]);
    const [understandsConsequences, setUnderstandsConsequences] = useState(false);
    const [refusalReason, setRefusalReason] = useState('');
    
    const [signingFor, setSigningFor] = useState<'patient' | 'dentist' | null>(null);

    useEffect(() => {
        if (isOpen) {
            setAcknowledgedRisks([]);
            setUnderstandsConsequences(false);
            setRefusalReason('');
            setTimeout(() => {
                setupCanvas(patientCanvasRef.current);
                setupCanvas(dentistCanvasRef.current);
            }, 50);
        }
    }, [isOpen]);
    
    const allRisksAcknowledged = acknowledgedRisks.length === risks.length;
    const canSave = allRisksAcknowledged && understandsConsequences && refusalReason.trim() !== '';

    const setupCanvas = (canvas: HTMLCanvasElement | null) => {
        if (canvas) {
            canvas.width = canvas.parentElement?.clientWidth || 300;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
            }
        }
    };
    
    const getCoords = (e: any, canvas: HTMLCanvasElement | null) => {
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startSign = (e: any, signer: 'patient' | 'dentist') => {
        e.preventDefault();
        setSigningFor(signer);
        const canvas = signer === 'patient' ? patientCanvasRef.current : dentistCanvasRef.current;
        const { x, y } = getCoords(e, canvas);
        canvas?.getContext('2d')?.beginPath();
        canvas?.getContext('2d')?.moveTo(x, y);
    };

    const draw = (e: any) => {
        if (!signingFor) return;
        e.preventDefault();
        const canvas = signingFor === 'patient' ? patientCanvasRef.current : dentistCanvasRef.current;
        const { x, y } = getCoords(e, canvas);
        canvas?.getContext('2d')?.lineTo(x, y);
        canvas?.getContext('2d')?.stroke();
    };
    
    const stopSign = (e: any) => { e.preventDefault(); setSigningFor(null); };
    const clearCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>) => canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    const handleSave = () => {
        if (!canSave || !patientCanvasRef.current || !dentistCanvasRef.current) {
            toast.error("Please complete all fields and provide signatures.");
            return;
        }
        
        const patientSignature = patientCanvasRef.current.toDataURL();
        const dentistSignature = dentistCanvasRef.current.toDataURL();

        onSave({
            relatedEntity,
            refusalReason,
            risksDisclosed: risks.map(r => ({ risk: r, acknowledged: acknowledgedRisks.includes(r) })),
            alternativesOffered: alternatives,
            dentistRecommendation: recommendation,
            patientUnderstandsConsequences: understandsConsequences,
            patientSignature,
            patientSignatureTimestamp: new Date().toISOString(),
            dentistSignature,
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
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-900 text-xs font-bold leading-relaxed">
                        <AlertTriangle className="inline-block mr-2"/>
                        This form documents that the patient has been informed of, understands, and accepts the risks of refusing the recommended dental treatment.
                    </div>
                    
                    <div>
                        <label className="label text-xs">Patient's Stated Reason for Refusal</label>
                        <textarea value={refusalReason} onChange={e => setRefusalReason(e.target.value)} className="input h-20" />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="font-black text-slate-800 text-sm mb-3">Risks Disclosed & Acknowledged</h4>
                        {risks.map(risk => (
                            <label key={risk} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white cursor-pointer">
                                <input type="checkbox" checked={acknowledgedRisks.includes(risk)} onChange={() => setAcknowledgedRisks(p => p.includes(risk) ? p.filter(r => r !== risk) : [...p, risk])} className="w-5 h-5 accent-teal-600 mt-0.5"/>
                                <span className="text-sm font-medium text-slate-700">{risk}</span>
                            </label>
                        ))}
                    </div>

                    <label className="flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 bg-white cursor-pointer">
                        <input type="checkbox" checked={understandsConsequences} onChange={e => setUnderstandsConsequences(e.target.checked)} className="w-6 h-6 accent-teal-600 mt-1"/>
                        <span className="font-bold text-slate-800">I attest that I have had the opportunity to ask questions, understand the consequences, and voluntarily refuse the recommended treatment.</span>
                    </label>

                    <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="font-bold text-slate-700 text-sm">Patient Signature</label>
                                <button onClick={() => clearCanvas(patientCanvasRef)} className="text-xs font-bold text-slate-400 hover:text-red-500"><Eraser size={12}/> Clear</button>
                            </div>
                            <canvas ref={patientCanvasRef} className="bg-white rounded-lg border-2 border-dashed border-slate-300 w-full touch-none" onMouseDown={e => startSign(e, 'patient')} onMouseMove={draw} onMouseUp={stopSign} onMouseLeave={stopSign} onTouchStart={e => startSign(e, 'patient')} onTouchMove={draw} onTouchEnd={stopSign}/>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="font-bold text-slate-700 text-sm">Dentist Signature</label>
                                <button onClick={() => clearCanvas(dentistCanvasRef)} className="text-xs font-bold text-slate-400 hover:text-red-500"><Eraser size={12}/> Clear</button>
                            </div>
                            <canvas ref={dentistCanvasRef} className="bg-white rounded-lg border-2 border-dashed border-slate-300 w-full touch-none" onMouseDown={e => startSign(e, 'dentist')} onMouseMove={draw} onMouseUp={stopSign} onMouseLeave={stopSign} onTouchStart={e => startSign(e, 'dentist')} onTouchMove={draw} onTouchEnd={stopSign}/>
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

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Patient, TreatmentPlan as TreatmentPlanType } from '../types';
import { X, CheckCircle, Eraser, DollarSign } from 'lucide-react';
import { usePatient } from '../contexts/PatientContext';
import { useToast } from './ToastSystem';

interface FinancialConsentModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient;
    plan: TreatmentPlanType;
}

const FinancialConsentModal: React.FC<FinancialConsentModalProps> = ({
    isOpen, onClose, patient, plan
}) => {
    const { handleApproveFinancialConsent } = usePatient();
    const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
    const toast = useToast();
    const [affirmations, setAffirmations] = useState({
        understood: false,
        responsible: false,
        discussed: false,
    });

    const allAffirmed = affirmations.understood && affirmations.responsible && affirmations.discussed;
    
    const planItems = useMemo(() => patient.dentalChart?.filter(item => item.planId === plan.id) || [], [patient.dentalChart, plan.id]);
    const planTotal = planItems.reduce((acc, item) => acc + (item.price || 0), 0);

    // --- START: Refactored Signature Logic ---
    const isDrawingRef = useRef(false);
    const lastDrawTime = useRef(0);

    const getCoords = (e: PointerEvent) => {
        const canvas = signatureCanvasRef.current;
        if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure };
    };

    const draw = useCallback((e: PointerEvent) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();

        const now = Date.now();
        if (now - lastDrawTime.current < 16) return; // ~60fps throttle
        lastDrawTime.current = now;

        const canvas = signatureCanvasRef.current;
        if (!canvas) return;
        const { x, y, pressure } = getCoords(e);
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const isPen = e.pointerType === 'pen';
            const effectivePressure = isPen ? (pressure || 0.7) : 0.5;
            const baseWidth = isPen ? 1.5 : 2.5;
            ctx.lineWidth = Math.max(1, Math.min(5, effectivePressure * baseWidth * 2));
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }, []);

    const stopSign = useCallback(() => {
        isDrawingRef.current = false;
        window.removeEventListener('pointermove', draw);
        window.removeEventListener('pointerup', stopSign);
    }, [draw]);

    const startSign = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!allAffirmed) return;
        if (e.pointerType === 'touch' && e.width > 10) return;
        e.preventDefault();

        isDrawingRef.current = true;
        const { x, y } = getCoords(e.nativeEvent);
        const ctx = e.currentTarget.getContext('2d');
        ctx?.beginPath();
        ctx?.moveTo(x, y);

        window.addEventListener('pointermove', draw);
        window.addEventListener('pointerup', stopSign);
    };
    // --- END: Refactored Signature Logic ---

    const setupCanvas = () => {
        const canvas = signatureCanvasRef.current;
        if (canvas && canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = 150;
            const ctx = canvas.getContext('2d', { desynchronized: true });
            if (ctx) {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
            }
        }
    };

    useEffect(() => {
        if (isOpen) {
           setTimeout(setupCanvas, 50);
           setAffirmations({ understood: false, responsible: false, discussed: false });
        }
    }, [isOpen]);
    
    const clearCanvas = () => { const canvas = signatureCanvasRef.current; const ctx = canvas?.getContext('2d'); if (canvas && ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); }};

    const handleSave = async () => {
        const signatureCanvas = signatureCanvasRef.current;
        if (!signatureCanvas || !allAffirmed) {
            toast.error("Please acknowledge all affirmations and provide a signature before saving.");
            return;
        };

        const signatureDataUrl = signatureCanvas.toDataURL('image/png');

        await handleApproveFinancialConsent(patient.id, plan.id, signatureDataUrl);
        if (window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
        onClose();
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 p-3 rounded-xl text-emerald-700">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Treatment Quote & Financial Consent</h2>
                            <p className="text-sm text-slate-500">Plan: {plan.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 space-y-6">
                    <div className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all ${allAffirmed ? 'opacity-70 grayscale' : ''}`}>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-2 font-bold text-slate-600">Procedure</th>
                                    <th className="text-center py-2 font-bold text-slate-600">Tooth #</th>
                                    <th className="text-right py-2 font-bold text-slate-600">Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {planItems.map((item, i) => (
                                    <tr key={i} className="border-b border-slate-100">
                                        <td className="py-3 font-medium text-slate-800">{item.procedure}</td>
                                        <td className="py-3 text-center text-slate-600">{item.toothNumber}</td>
                                        <td className="py-3 text-right font-mono text-slate-800">₱{(item.price || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={2} className="text-right py-4 font-bold text-lg text-slate-800">Total Estimate:</td>
                                    <td className="text-right py-4 font-bold text-lg text-teal-700">₱{planTotal.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 transition-all ${allAffirmed ? 'opacity-70 grayscale' : ''}`}>
                        <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input type="checkbox" checked={affirmations.understood} onChange={e => setAffirmations(p => ({...p, understood: e.target.checked}))} className="w-5 h-5 accent-teal-600 mt-0.5" disabled={allAffirmed}/>
                            <span className="text-sm font-medium text-slate-700">I understand the provided quote is an estimate and may change based on clinical findings.</span>
                        </label>
                        <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input type="checkbox" checked={affirmations.responsible} onChange={e => setAffirmations(p => ({...p, responsible: e.target.checked}))} className="w-5 h-5 accent-teal-600 mt-0.5" disabled={allAffirmed}/>
                            <span className="text-sm font-medium text-slate-700">I accept full financial responsibility for the total payment of all procedures performed.</span>
                        </label>
                        <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input type="checkbox" checked={affirmations.discussed} onChange={e => setAffirmations(p => ({...p, discussed: e.target.checked}))} className="w-5 h-5 accent-teal-600 mt-0.5" disabled={allAffirmed}/>
                            <span className="text-sm font-medium text-slate-700">I have had the opportunity to discuss payment options with the clinic staff.</span>
                        </label>
                    </div>
                    <div className={`bg-white p-4 rounded-xl border shadow-sm transition-all ${!allAffirmed ? 'opacity-50 grayscale' : 'border-teal-500'}`}>
                         <div className="flex justify-between items-center mb-2">
                             <h4 className="font-bold text-slate-700">Patient Signature</h4>
                             <button onClick={clearCanvas} className="text-xs font-bold text-slate-400 hover:text-red-500"><Eraser size={12}/> Clear</button>
                         </div>
                         <canvas ref={signatureCanvasRef} className={`bg-white rounded-lg border-2 border-dashed border-slate-300 w-full touch-none ${!allAffirmed ? 'cursor-not-allowed' : 'cursor-crosshair'}`} onPointerDown={startSign} />
                         <p className="text-sm text-slate-500 mt-2">By signing, I confirm I have reviewed this treatment plan quote and agree to be financially responsible for the estimated total cost.</p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                    <button onClick={handleSave} disabled={!allAffirmed} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale">
                        <CheckCircle size={20} /> I Agree & Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinancialConsentModal;

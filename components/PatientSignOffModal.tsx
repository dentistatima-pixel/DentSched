import React, { useState, useRef, useEffect } from 'react';
import { DentalChartEntry } from '../types';
import { X, CheckCircle, Eraser, FileSignature } from 'lucide-react';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';
import { checkSignatureQuality } from '../utils/signatureValidation';

interface PatientSignOffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (signature: string) => void;
    note: DentalChartEntry;
}

const PatientSignOffModal: React.FC<PatientSignOffModalProps> = ({ isOpen, onClose, onSave, note }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isSigning, setIsSigning] = useState(false);
    const [strokeCount, setStrokeCount] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const toast = useToast();

    const setupCanvas = () => {
        const canvas = canvasRef.current;
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
        const canvas = canvasRef.current;
        const touchHandler = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault(); };
        if (isOpen) {
            setTimeout(setupCanvas, 50);
            setStrokeCount(0);
            setStartTime(null);
            canvas?.addEventListener('touchstart', touchHandler, { passive: false });
        }
        return () => {
            canvas?.removeEventListener('touchstart', touchHandler);
        }
    }, [isOpen]);

    const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = e.currentTarget;
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure };
    };

    const startSign = (e: React.PointerEvent<HTMLCanvasElement>) => { 
        if (e.pointerType === 'touch' && (e.width > 25 || e.height > 25)) {
            e.preventDefault();
            return;
        }
        e.preventDefault(); 
        if (!isSigning) {
            setStrokeCount(prev => prev + 1);
            if (startTime === null) setStartTime(Date.now());
        }
        setIsSigning(true); 
        const { x, y } = getCoords(e); 
        const ctx = e.currentTarget.getContext('2d'); 
        ctx?.beginPath(); 
        ctx?.moveTo(x, y); 
    };
    const stopSign = (e: React.PointerEvent<HTMLCanvasElement>) => { e.preventDefault(); setIsSigning(false); };
    
    const lastDrawTime = useRef(0);
    const draw = (e: React.PointerEvent<HTMLCanvasElement>) => { 
        if (!isSigning) return; 
        e.preventDefault(); 
        
        const now = Date.now();
        if (now - lastDrawTime.current < 16) { // ~60fps throttle
            return;
        }
        lastDrawTime.current = now;

        const { x, y, pressure } = getCoords(e); 
        const ctx = e.currentTarget.getContext('2d'); 
        if(ctx){ 
            const isPen = e.pointerType === 'pen';
            const effectivePressure = isPen ? (pressure || 0.7) : 0.5;
            const baseWidth = isPen ? 1.5 : 2.5;
            ctx.lineWidth = Math.max(1, Math.min(5, effectivePressure * baseWidth * 2));
            ctx.lineTo(x, y); 
            ctx.stroke(); 
        } 
    };
    const clearCanvas = () => { 
        const canvas = canvasRef.current; 
        if(canvas){
            const ctx = canvas.getContext('2d'); 
            if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setStrokeCount(0);
        setStartTime(null);
    };
    
    const handleSave = () => {
        if (canvasRef.current) {
            const timeToSign = startTime ? Date.now() - startTime : 0;
            const qualityCheck = checkSignatureQuality(canvasRef.current, strokeCount, timeToSign);
            if (!qualityCheck.valid) {
                toast.error(qualityCheck.reason || "Signature quality is too low.");
                return;
            }
            const signature = canvasRef.current.toDataURL('image/png');
            onSave(signature);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-teal-100 bg-teal-50 flex items-center gap-4">
                    <FileSignature size={28} className="text-teal-600" />
                    <div>
                        <h2 className="text-xl font-black text-teal-900 uppercase tracking-tight">Patient Sign-Off</h2>
                        <p className="text-xs text-teal-700 font-bold uppercase">Acknowledge Treatment Completion</p>
                    </div>
                </div>
                <div className="p-8 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Procedure Completed</p>
                        <p className="text-lg font-black text-slate-800 mt-1">{note.procedure}</p>
                        <p className="text-sm font-bold text-slate-500">Tooth #{note.toothNumber} &bull; {formatDate(note.date)}</p>
                    </div>
                    <p className="text-sm text-center text-slate-600">
                        Please provide your signature to acknowledge that the procedure above has been completed to your satisfaction.
                    </p>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="label text-xs">Patient Signature *</label>
                            <button onClick={clearCanvas} className="text-xs font-bold text-slate-400 hover:text-red-500"><Eraser size={12}/> Clear</button>
                        </div>
                        <canvas ref={canvasRef} className="bg-white rounded-lg border-2 border-dashed border-slate-300 w-full touch-none cursor-crosshair" onPointerDown={startSign} onPointerUp={stopSign} onPointerLeave={stopSign} onPointerMove={draw}/>
                        <p className="text-[11px] text-slate-400 mt-2 font-bold uppercase">This signature applies ONLY to the information shown.</p>
                    </div>
                </div>
                <div className="p-4 border-t bg-white flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                    <button onClick={handleSave} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold flex items-center gap-2">
                        <CheckCircle size={20}/> Confirm & Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatientSignOffModal;
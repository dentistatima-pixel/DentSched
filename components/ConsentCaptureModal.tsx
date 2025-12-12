
import React, { useState, useRef, useEffect } from 'react';
import { Patient, Appointment, User, ConsentFormTemplate } from '../types';
import { X, CheckCircle, Eraser, FileSignature } from 'lucide-react';

interface ConsentCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (dataUrl: string) => void;
    patient: Patient;
    appointment: Appointment;
    provider?: User;
    template: ConsentFormTemplate;
}

const ConsentCaptureModal: React.FC<ConsentCaptureModalProps> = ({
    isOpen, onClose, onSave, patient, appointment, provider, template
}) => {
    const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isSigning, setIsSigning] = useState(false);

    const getProcessedContent = () => {
        let content = template.content;
        content = content.replace(/{PatientName}/g, patient.name);
        content = content.replace(/{DoctorName}/g, provider?.name || 'the attending dentist');
        content = content.replace(/{ProcedureList}/g, appointment.type);
        content = content.replace(/{Date}/g, new Date(appointment.date).toLocaleDateString());
        return content;
    };

    const setupCanvas = () => {
        const canvas = signatureCanvasRef.current;
        if (canvas) {
            canvas.width = canvas.parentElement?.clientWidth || 400;
            canvas.height = 150;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
            }
        }
    };

    useEffect(() => {
        if (isOpen) {
           setTimeout(setupCanvas, 50); // Delay slightly to ensure layout is complete
        }
    }, [isOpen]);
    
    // --- CANVAS DRAWING LOGIC ---
    const getCoords = (e: any) => {
        const canvas = signatureCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    const startSign = (e: any) => {
        e.preventDefault();
        setIsSigning(true);
        const { x, y } = getCoords(e);
        const ctx = signatureCanvasRef.current?.getContext('2d');
        ctx?.beginPath();
        ctx?.moveTo(x, y);
    };

    const stopSign = (e: any) => {
        e.preventDefault();
        setIsSigning(false);
    };

    const draw = (e: any) => {
        if (!isSigning) return;
        e.preventDefault();
        const { x, y } = getCoords(e);
        const ctx = signatureCanvasRef.current?.getContext('2d');
        ctx?.lineTo(x, y);
        ctx?.stroke();
    };
    
    const clearCanvas = () => {
        const canvas = signatureCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleSave = () => {
        const finalCanvas = document.createElement('canvas');
        const signatureCanvas = signatureCanvasRef.current;
        if (!signatureCanvas) return;
        
        finalCanvas.width = 600;
        finalCanvas.height = 800; // Standard document aspect ratio
        const ctx = finalCanvas.getContext('2d');
        if (!ctx) return;

        // White background
        ctx.fillStyle = '#FFF';
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        // Header
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('Informed Consent for Treatment', 30, 50);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`Patient: ${patient.name} (#${patient.id})`, 30, 80);
        ctx.fillText(`Procedure: ${appointment.type}`, 30, 100);
        ctx.fillText(`Date: ${new Date().toLocaleString()}`, 30, 120);
        
        // Line separator
        ctx.beginPath();
        ctx.moveTo(30, 140);
        ctx.lineTo(570, 140);
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();

        // Body text (simple line wrapping)
        ctx.fillStyle = '#1e293b';
        ctx.font = '14px serif';
        const content = getProcessedContent();
        const words = content.split(' ');
        let line = '';
        let y = 170;
        const maxWidth = 540;
        const lineHeight = 22;

        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, 30, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, 30, y);

        // Signature section
        y += 50;
        ctx.drawImage(signatureCanvas, 30, y, signatureCanvas.width, signatureCanvas.height);
        
        // Signature line
        y += signatureCanvas.height + 5;
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(30 + signatureCanvas.width, y);
        ctx.strokeStyle = '#94a3b8';
        ctx.stroke();
        
        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        ctx.fillText('Patient Signature', 30, y + 15);
        
        onSave(finalCanvas.toDataURL('image/png'));
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-lilac-100 p-3 rounded-xl text-lilac-700">
                            <FileSignature size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{template.name}</h2>
                            <p className="text-sm text-slate-500">Please review and sign below.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} className="text-slate-500" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm prose prose-sm max-w-none prose-p:text-slate-600 prose-headings:text-slate-800">
                        <p>{getProcessedContent()}</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                         <div className="flex justify-between items-center mb-2">
                             <h4 className="font-bold text-slate-700">Patient Signature</h4>
                             <button onClick={clearCanvas} className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1"><Eraser size={12}/> Clear</button>
                         </div>
                         <canvas
                             ref={signatureCanvasRef}
                             className="bg-white rounded-lg border-2 border-dashed border-slate-300 w-full touch-none cursor-crosshair"
                             onMouseDown={startSign} onMouseUp={stopSign} onMouseLeave={stopSign} onMouseMove={draw}
                             onTouchStart={startSign} onTouchEnd={stopSign} onTouchMove={draw}
                         />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all flex items-center gap-2">
                        <CheckCircle size={20} /> I Agree & Save Consent
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConsentCaptureModal;

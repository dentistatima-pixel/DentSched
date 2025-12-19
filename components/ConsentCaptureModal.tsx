
import React, { useState, useRef, useEffect } from 'react';
import { Patient, Appointment, User, ConsentFormTemplate, ProcedureItem } from '../types';
import { X, CheckCircle, Eraser, FileSignature, AlertTriangle, Baby, ShieldCheck } from 'lucide-react';

interface ConsentCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (dataUrl: string) => void;
    patient: Patient;
    appointment: Appointment;
    provider?: User;
    template: ConsentFormTemplate;
    procedure?: ProcedureItem;
}

const ConsentCaptureModal: React.FC<ConsentCaptureModalProps> = ({
    isOpen, onClose, onSave, patient, appointment, provider, template, procedure
}) => {
    const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isSigning, setIsSigning] = useState(false);

    const isMinor = (patient.age || 0) < 18;
    const requiresGuardian = isMinor || patient.isPwd;

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
           setTimeout(setupCanvas, 50);
        }
    }, [isOpen]);
    
    const getCoords = (e: any) => {
        const canvas = signatureCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    const startSign = (e: any) => { e.preventDefault(); setIsSigning(true); const { x, y } = getCoords(e); const ctx = signatureCanvasRef.current?.getContext('2d'); ctx?.beginPath(); ctx?.moveTo(x, y); };
    const stopSign = (e: any) => { e.preventDefault(); setIsSigning(false); };
    const draw = (e: any) => { if (!isSigning) return; e.preventDefault(); const { x, y } = getCoords(e); const ctx = signatureCanvasRef.current?.getContext('2d'); ctx?.lineTo(x, y); ctx?.stroke(); };
    const clearCanvas = () => { const canvas = signatureCanvasRef.current; const ctx = canvas?.getContext('2d'); if (canvas && ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); } };

    const handleSave = () => {
        const finalCanvas = document.createElement('canvas');
        const signatureCanvas = signatureCanvasRef.current;
        if (!signatureCanvas) return;
        
        finalCanvas.width = 600;
        finalCanvas.height = 800;
        const ctx = finalCanvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#FFF';
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('Electronic Informed Consent', 30, 50);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`Patient: ${patient.name} | Proc: ${appointment.type}`, 30, 80);
        if (requiresGuardian) ctx.fillText(`Guardian: ${patient.guardian} (${patient.relationshipToPatient})`, 30, 95);
        ctx.fillText(`Date: ${new Date().toLocaleString()}`, 30, 110);
        
        ctx.beginPath(); ctx.moveTo(30, 120); ctx.lineTo(570, 120); ctx.strokeStyle = '#e2e8f0'; ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.font = '13px serif';
        const content = getProcessedContent();
        let y = 150;
        const words = content.split(' ');
        let line = '';
        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            if (ctx.measureText(testLine).width > 540 && n > 0) {
                ctx.fillText(line, 30, y);
                line = words[n] + ' ';
                y += 20;
            } else { line = testLine; }
        }
        ctx.fillText(line, 30, y); y += 40;

        ctx.drawImage(signatureCanvas, 30, y, signatureCanvas.width, signatureCanvas.height);
        y += signatureCanvas.height + 5;
        ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(30 + signatureCanvas.width, y); ctx.strokeStyle = '#94a3b8'; ctx.stroke();
        ctx.fillStyle = '#64748b';
        ctx.fillText(requiresGuardian ? `Guardian Signature: ${patient.guardian} (${patient.relationshipToPatient})` : `Patient Signature: ${patient.name}`, 30, y + 15);
        
        onSave(finalCanvas.toDataURL('image/png'));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-teal-100 p-3 rounded-xl text-teal-700"><FileSignature size={24} /></div>
                        <div><h2 className="text-xl font-bold text-slate-800">{template.name}</h2><p className="text-sm text-slate-500">Legal Informed Consent Protocol</p></div>
                    </div>
                    <button onClick={onClose}><X size={24} className="text-slate-500" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 space-y-6">
                    {requiresGuardian && (
                        <div className="bg-lilac-50 border border-lilac-200 p-4 rounded-xl flex items-center gap-3 text-lilac-800">
                            <Baby size={20} className="text-lilac-600"/>
                            <div><p className="text-xs font-bold uppercase">Pediatric/PWD Case Detected</p><p className="text-[11px]">Guardian <strong>{patient.guardian}</strong> is authorized to sign for the patient.</p></div>
                        </div>
                    )}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600 leading-relaxed"><p>{getProcessedContent()}</p></div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                         <div className="flex justify-between items-center mb-2"><h4 className="font-bold text-slate-700">{requiresGuardian ? 'Authorized Guardian Signature' : 'Patient Signature'}</h4><button onClick={clearCanvas} className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1"><Eraser size={12}/> Clear</button></div>
                         <canvas ref={signatureCanvasRef} className="bg-white rounded-lg border-2 border-dashed border-slate-300 w-full touch-none cursor-crosshair" onMouseDown={startSign} onMouseUp={stopSign} onMouseLeave={stopSign} onMouseMove={draw} onTouchStart={startSign} onTouchEnd={stopSign} onTouchMove={draw}/>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                    <button onClick={handleSave} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 flex items-center gap-2"><CheckCircle size={20} /> Signed & Verified</button>
                </div>
            </div>
        </div>
    );
};

export default ConsentCaptureModal;

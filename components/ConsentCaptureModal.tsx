
import React, { useState, useRef, useEffect } from 'react';
import { Patient, Appointment, User, ConsentFormTemplate, ProcedureItem } from '../types';
// Added ShieldCheck to lucide-react imports
import { X, CheckCircle, Eraser, FileSignature, AlertTriangle, Users, FileUp, ShieldCheck } from 'lucide-react';
import { useToast } from './ToastSystem';

interface ConsentCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (dataUrl: string, relationship?: string) => void;
    patient: Patient;
    appointment: Appointment;
    provider?: User;
    template: ConsentFormTemplate;
    procedure?: ProcedureItem;
}

const ConsentCaptureModal: React.FC<ConsentCaptureModalProps> = ({
    isOpen, onClose, onSave, patient, appointment, provider, template, procedure
}) => {
    const toast = useToast();
    const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isSigning, setIsSigning] = useState(false);
    const [relationship, setRelationship] = useState(appointment.signatoryRelationship || 'Self');
    const isMinor = (patient.age || 0) < 18;

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
            if (ctx) { ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; }
        }
    };

    useEffect(() => { if (isOpen) setTimeout(setupCanvas, 50); }, [isOpen]);
    
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
        if (isMinor && relationship === 'Self') {
            toast.error("R.A. 9484 Protocol: Minor patients cannot sign their own clinical consent. Please select relationship.");
            return;
        }

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
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('Electronic Informed Consent (DPA Compliant)', 30, 50);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`Patient: ${patient.name} | Signatory: ${relationship} | Date: ${new Date().toLocaleString()}`, 30, 80);
        
        ctx.beginPath(); ctx.moveTo(30, 100); ctx.lineTo(570, 100); ctx.strokeStyle = '#e2e8f0'; ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.font = '12px serif';
        const content = getProcessedContent();
        let y = 130;
        const words = content.split(' ');
        let line = '';
        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            if (ctx.measureText(testLine).width > 540 && n > 0) {
                ctx.fillText(line, 30, y);
                line = words[n] + ' ';
                y += 18;
            } else { line = testLine; }
        }
        ctx.fillText(line, 30, y); y += 40;

        ctx.drawImage(signatureCanvas, 30, y, signatureCanvas.width, signatureCanvas.height);
        y += signatureCanvas.height + 5;
        ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(30 + signatureCanvas.width, y); ctx.strokeStyle = '#94a3b8'; ctx.stroke();
        ctx.fillStyle = '#64748b';
        ctx.fillText(`Signatory: ${relationship} (Authorized Representative/Data Subject)`, 30, y + 15);
        
        onSave(finalCanvas.toDataURL('image/png'), relationship);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0 bg-teal-900 text-white rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <FileSignature size={24} className="text-teal-300"/>
                        <div><h2 className="text-xl font-bold">{template.name}</h2><p className="text-xs text-teal-200">Legal Informed Consent Protocol</p></div>
                    </div>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 space-y-6">
                    {isMinor && (
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex gap-3 text-orange-900">
                            <Users size={24} className="shrink-0 text-orange-500"/>
                            <div className="space-y-3 w-full">
                                <p className="text-xs font-bold uppercase tracking-wider">Minor Signature Protocol Triggered:</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-orange-600 uppercase mb-1 block">Relationship to Minor</label>
                                        <select value={relationship} onChange={e => setRelationship(e.target.value)} className="w-full p-2 border border-orange-200 rounded-lg text-sm bg-white outline-none focus:border-orange-500">
                                            <option value="Father">Father</option>
                                            <option value="Mother">Mother</option>
                                            <option value="Legal Guardian">Legal Guardian</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-orange-600 uppercase mb-1 block">Proof of Authority</label>
                                        <button className="w-full flex items-center gap-2 p-2 border border-orange-200 rounded-lg text-[10px] font-bold bg-white text-orange-700 hover:bg-orange-100 transition-colors"><FileUp size={12}/> Upload PSA/Birth Cert</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-sm text-slate-600 leading-relaxed italic"><p>"{getProcessedContent()}"</p></div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                         <div className="flex justify-between items-center mb-2"><h4 className="font-bold text-slate-700">Digital Signature Capture</h4><button onClick={clearCanvas} className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1"><Eraser size={12}/> Clear</button></div>
                         <canvas ref={signatureCanvasRef} className="bg-white rounded-xl border-2 border-dashed border-slate-200 w-full touch-none cursor-crosshair" onMouseDown={startSign} onMouseUp={stopSign} onMouseLeave={stopSign} onMouseMove={draw} onTouchStart={startSign} onTouchEnd={stopSign} onTouchMove={draw}/>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0 rounded-b-3xl">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                    <button onClick={handleSave} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 flex items-center gap-2"><ShieldCheck size={20} /> Signed & Verified</button>
                </div>
            </div>
        </div>
    );
};

export default ConsentCaptureModal;

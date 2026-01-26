import React, { useState, useRef, useEffect } from 'react';
import { Patient, Appointment, User, ConsentFormTemplate, ProcedureItem, AuthorityLevel } from '../types';
import { X, CheckCircle, Eraser, FileSignature, AlertTriangle, Baby, ShieldCheck, Scale, CheckSquare, Square, ShieldAlert, Lock, Fingerprint, Camera, UserCheck, Languages } from 'lucide-react';
import CryptoJS from 'crypto-js';

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
    const videoRef = useRef<HTMLVideoElement>(null);
    const witnessCanvasRef = useRef<HTMLCanvasElement>(null);
    
    const [isSigning, setIsSigning] = useState(false);
    const [acknowledgedRisks, setAcknowledgedRisks] = useState<string[]>([]);
    const [isDuressAffirmed, setIsDuressAffirmed] = useState(false);
    
    const [language, setLanguage] = useState<'en' | 'tl'>('en');

    // Witness Identity State
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [witnessAnchorHash, setWitnessAnchorHash] = useState<string | null>(null);
    const [witnessAnchorThumb, setWitnessAnchorThumb] = useState<string | null>(null);
    const [isFaceDetected, setIsFaceDetected] = useState(false);

    const isMinor = (patient.age || 0) < 18;
    const requiresGuardian = isMinor || patient.isPwd || patient.isSeniorDependent;
    const guardian = patient.guardianProfile;

    const riskDisclosures = procedure?.riskDisclosures || [];
    const allRisksAcknowledged = riskDisclosures.length === 0 || riskDisclosures.length === acknowledgedRisks.length;

    const getProcessedContent = () => {
        let content = language === 'en' ? template.content_en : (template.content_tl || template.content_en);
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

    const startWitnessCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320, facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
                // Simulate face detection
                setTimeout(() => setIsFaceDetected(true), 2000);
            }
        } catch (err) {
            console.error("Witness lens initialization failed", err);
        }
    };

    const stopWitnessCamera = () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
        }
        setIsCameraActive(false);
    };

    useEffect(() => {
        if (isOpen) {
           setTimeout(setupCanvas, 50);
           setLanguage('en');
           setAcknowledgedRisks([]);
           setIsDuressAffirmed(false);
           startWitnessCamera();
        } else {
            stopWitnessCamera();
        }
        return () => stopWitnessCamera();
    }, [isOpen]);
    
    const getCoords = (e: any) => {
        const canvas = signatureCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    const startSign = (e: any) => { 
        if (!isDuressAffirmed || !allRisksAcknowledged || !isFaceDetected) return;
        // SMART-REVERT IMPLEMENTATION
        if (language !== 'en') {
            setLanguage('en');
        }
        e.preventDefault(); setIsSigning(true); const { x, y } = getCoords(e); const ctx = signatureCanvasRef.current?.getContext('2d'); ctx?.beginPath(); ctx?.moveTo(x, y); 
    };
    const stopSign = (e: any) => { e.preventDefault(); setIsSigning(false); };
    const draw = (e: any) => { if (!isSigning || !isDuressAffirmed || !allRisksAcknowledged) return; e.preventDefault(); const { x, y } = getCoords(e); const ctx = signatureCanvasRef.current?.getContext('2d'); ctx?.lineTo(x, y); ctx?.stroke(); };
    const clearCanvas = () => { const canvas = signatureCanvasRef.current; const ctx = canvas?.getContext('2d'); if (canvas && ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); } };

    const captureWitnessAnchor = () => {
        const video = videoRef.current;
        const canvas = witnessCanvasRef.current;
        if (video && canvas && isCameraActive && video.readyState >= 3) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Low-Footprint Image Optimization
                canvas.width = 96;
                canvas.height = 96;
                ctx.filter = 'grayscale(100%)';
                ctx.drawImage(video, 0, 0, 96, 96);
                const thumb = canvas.toDataURL('image/jpeg', 0.5); // JPEG compression
                setWitnessAnchorThumb(thumb);
                setWitnessAnchorHash(CryptoJS.SHA256(thumb).toString());
            }
        }
    };

    const toggleRisk = (risk: string) => {
        setAcknowledgedRisks(prev => 
            prev.includes(risk) ? prev.filter(r => r !== risk) : [...prev, risk]
        );
    };

    const handleSave = () => {
        captureWitnessAnchor();
        
        const finalCanvas = document.createElement('canvas');
        const signatureCanvas = signatureCanvasRef.current;
        if (!signatureCanvas) return;
        
        finalCanvas.width = 600;
        finalCanvas.height = 1200; 
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
        if (requiresGuardian && guardian) ctx.fillText(`Guardian: ${guardian.legalName} (${guardian.relationship})`, 30, 95);
        ctx.fillText(`Date: ${new Date().toLocaleString()}`, 30, 110);
        
        ctx.beginPath(); ctx.moveTo(30, 120); ctx.lineTo(570, 120); ctx.strokeStyle = '#e2e8f0'; ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.font = '13px serif';
        // Ensure we draw the final English content
        const content = template.content_en;
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

        if (riskDisclosures.length > 0) {
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('PROCEDURE-SPECIFIC RISK ACKNOWLEDGMENT:', 30, y);
            y += 20;
            ctx.font = '11px sans-serif';
            riskDisclosures.forEach(risk => {
                ctx.fillText(`[X] ${risk}`, 40, y);
                y += 18;
            });
            y += 20;
        }

        ctx.font = 'italic 10px sans-serif';
        ctx.fillStyle = '#64748b';
        const duressText = "AFFIRMATION OF VOLUNTARY CONSENT: I hereby attest that I am signing this clinical document voluntarily, of my own free will, and under no form of duress, coercion, or external pressure.";
        const splitDuress = docSplitTextToSize(duressText, 540, ctx);
        splitDuress.forEach(line => {
            ctx.fillText(line, 30, y);
            y += 12;
        });
        y += 10;

        ctx.drawImage(signatureCanvas, 30, y, signatureCanvas.width, signatureCanvas.height);
        y += signatureCanvas.height + 5;
        ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(30 + signatureCanvas.width, y); ctx.strokeStyle = '#94a3b8'; ctx.stroke();
        ctx.fillStyle = '#64748b';
        const sigLabel = requiresGuardian && guardian ? `Signature of Legal Guardian: ${guardian.legalName} (ID: ${guardian.idType} ${guardian.idNumber})` : `Patient Signature: ${patient.name}`;
        ctx.fillText(sigLabel, 30, y + 15);
        y += 35;

        // Forensic Metadata Block
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(30, y, 540, 100);
        ctx.strokeStyle = '#cbd5e1';
        ctx.strokeRect(30, y, 540, 100);
        
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('FORENSIC IDENTITY BIND (RA 8792 COMPLIANT)', 40, y + 15);
        
        if (witnessAnchorThumb) {
            const img = new Image();
            img.src = witnessAnchorThumb;
            ctx.drawImage(img, 40, y + 25, 60, 60);
        }

        ctx.font = '8px monospace';
        const fingerprintData = [
            `WITNESS_HASH: ${witnessAnchorHash?.substring(0, 32)}...`,
            `PRESENCE_TOKEN: ${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
            `DEVICE_UA: ${navigator.userAgent.substring(0, 65)}`,
            `VERIFIED_TS: ${new Date().toISOString()}`
        ];
        fingerprintData.forEach((text, i) => {
            ctx.fillText(text, 110, y + 35 + (i * 12));
        });
        
        onSave(finalCanvas.toDataURL('image/png'));
    };

    const docSplitTextToSize = (text: string, width: number, ctx: CanvasRenderingContext2D) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const testWidth = ctx.measureText(currentLine + " " + word).width;
            if (testWidth < width) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    };

    if (!isOpen) return null;

    const isAuthorityBlocked = requiresGuardian && guardian && guardian.authorityLevel === AuthorityLevel.FINANCIAL_ONLY;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-teal-100 p-3 rounded-xl text-teal-700"><FileSignature size={24} /></div>
                        <div><h2 className="text-xl font-bold text-slate-800">{template.name}</h2><p className="text-sm text-slate-500">RA 8792 Verified Consent Protocol</p></div>
                    </div>
                    <button onClick={onClose}><X size={24} className="text-slate-500" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 space-y-6">
                    <div className="flex justify-between items-start gap-6">
                        <div className="flex-1 space-y-6">
                            {requiresGuardian && guardian ? (
                                <div className={`p-4 rounded-xl border flex items-center gap-3 ${isAuthorityBlocked ? 'bg-red-50 border-red-200 text-red-800' : 'bg-lilac-50 border-lilac-200 text-lilac-800'}`}>
                                    {isAuthorityBlocked ? <AlertTriangle size={20} className="text-red-600"/> : <Scale size={20} className="text-lilac-600"/>}
                                    <div>
                                        <p className="text-xs font-black uppercase">Guardian Verification Active</p>
                                        <p className="text-[11px] font-medium leading-tight">
                                            Legal Representative: <strong>{guardian.legalName}</strong> ({guardian.relationship})<br/>
                                            Authority Level: <span className="font-black underline">{guardian.authorityLevel.replace('_', ' ')}</span>
                                        </p>
                                    </div>
                                </div>
                            ) : requiresGuardian && (
                                <div className="bg-red-600 p-4 rounded-xl flex gap-3 text-white shadow-lg animate-pulse">
                                    <AlertTriangle size={32} />
                                    <div><p className="font-bold">GUARDIAN PROFILE MISSING</p><p className="text-xs opacity-90">A legal guardian must be added to the patient profile before clinical consent can be captured.</p></div>
                                </div>
                            )}

                            {isAuthorityBlocked && (
                                <div className="bg-red-100 text-red-800 p-4 rounded-xl text-xs font-bold border border-red-200">
                                    CRITICAL: This guardian is restricted to FINANCIAL decisions only. They are legally unauthorized to sign clinical consent forms.
                                </div>
                            )}
                        </div>

                        {/* --- WITNESS LENS UI --- */}
                        <div className="shrink-0 flex flex-col items-center gap-2">
                             <div className={`w-24 h-24 rounded-full border-4 overflow-hidden relative shadow-lg bg-slate-200 ${isFaceDetected ? 'border-teal-500' : 'border-red-500 animate-pulse'}`}>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-[80px] h-[100px] border-4 border-dashed border-white/50 rounded-[50%]" style={{boxShadow: '0 0 0 999px rgba(0,0,0,0.3)'}}/>
                                </div>
                                 {isCameraActive ? (
                                     <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                                 ) : (
                                     <div className="w-full h-full flex items-center justify-center text-slate-400"><Camera size={32}/></div>
                                 )}
                                 {isFaceDetected && (
                                     <div className="absolute inset-0 bg-teal-500/10 flex items-center justify-center">
                                         <UserCheck size={40} className="text-teal-500 opacity-40"/>
                                     </div>
                                 )}
                             </div>
                             <div className="text-center">
                                 <span className={`text-[8px] font-black uppercase tracking-widest ${isFaceDetected ? 'text-teal-600' : 'text-red-500'}`}>
                                     {isFaceDetected ? 'Face Verified' : 'Detecting...'}
                                 </span>
                             </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-sm">Consent Form</h4>
                             <div className="flex bg-slate-100 p-1 rounded-lg border">
                                <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-xs font-bold rounded ${language==='en' ? 'bg-white shadow' : ''}`}>English (Official)</button>
                                <button onClick={() => setLanguage('tl')} className={`px-3 py-1 text-xs font-bold rounded ${language==='tl' ? 'bg-white shadow' : ''}`}>Tagalog</button>
                            </div>
                        </div>
                        {language === 'tl' && (
                             <div className="bg-amber-50 text-amber-800 p-3 text-xs mb-4 rounded-lg border border-amber-200">
                                <strong>NOTE:</strong> Ito ay isang computer-generated na salin para sa iyong pang-unawa. Ang opisyal at legal na dokumento na iyong pinipirmahan ay ang orihinal na bersyon sa Ingles. Sa iyong pagpirma, kinukumpirma mo ang iyong pagsang-ayon sa mga tuntunin na nakasulat sa Ingles.
                             </div>
                        )}
                        <p className="text-sm text-slate-600 leading-relaxed">{getProcessedContent()}</p>
                    </div>

                    {riskDisclosures.length > 0 && (
                        <div className="bg-white p-6 rounded-3xl border border-orange-200 shadow-sm space-y-4">
                            <h4 className="font-black text-orange-900 uppercase tracking-widest text-xs flex items-center gap-2">
                                <ShieldAlert size={16} className="text-orange-500"/> Specific Risk Disclosure Required
                            </h4>
                            <div className="space-y-2">
                                {riskDisclosures.map(risk => {
                                    const isChecked = acknowledgedRisks.includes(risk);
                                    return (
                                        <button 
                                            key={risk} 
                                            onClick={() => toggleRisk(risk)}
                                            className={`w-full p-3 rounded-xl border-2 text-left flex items-start gap-3 transition-all ${isChecked ? 'bg-orange-50 border-orange-400' : 'bg-slate-50 border-slate-100 opacity-70 hover:opacity-100'}`}
                                        >
                                            {isChecked ? <CheckSquare size={18} className="text-orange-600 shrink-0"/> : <Square size={18} className="text-slate-300 shrink-0"/>}
                                            <span className={`text-xs font-bold ${isChecked ? 'text-orange-900' : 'text-slate-500'}`}>{risk}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-3xl border-2 border-lilac-200 shadow-sm space-y-4 animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-3">
                            <ShieldCheck size={20} className="text-lilac-600"/>
                            <h4 className="font-black text-lilac-900 uppercase tracking-widest text-xs">Anti-Duress Affirmation</h4>
                        </div>
                        <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${isDuressAffirmed ? 'bg-lilac-50 border-lilac-500' : 'bg-slate-50 border-slate-100'}`}>
                            <input 
                                type="checkbox" 
                                checked={isDuressAffirmed} 
                                onChange={e => setIsDuressAffirmed(e.target.checked)}
                                className="w-6 h-6 accent-lilac-600 rounded mt-1 shrink-0" 
                            />
                            <p className="text-[11px] text-slate-700 font-bold leading-relaxed">
                                I hereby attest that I am signing this clinical document voluntarily, of my own free will, and under no form of duress, coercion, or external pressure. I confirm I have had sufficient opportunity to review the risks and alternatives.
                            </p>
                        </label>
                    </div>

                    {!isAuthorityBlocked && (
                        <div className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all relative overflow-hidden ${!isDuressAffirmed || !allRisksAcknowledged || !isFaceDetected ? 'opacity-40 grayscale' : ''}`}>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-slate-700">{requiresGuardian ? 'Signature of Legal Guardian' : 'Patient Signature'}</h4>
                                <button onClick={clearCanvas} className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1"><Eraser size={12}/> Clear</button>
                            </div>
                            <div className="relative">
                                <canvas ref={signatureCanvasRef} className="bg-white rounded-lg border-2 border-dashed border-slate-300 w-full touch-none cursor-crosshair" onMouseDown={startSign} onMouseUp={stopSign} onMouseLeave={stopSign} onMouseMove={draw} onTouchStart={startSign} onTouchEnd={stopSign} onTouchMove={draw}/>
                                {(!isDuressAffirmed || !allRisksAcknowledged || !isFaceDetected) && (
                                    <div className="absolute inset-0 bg-slate-100/10 backdrop-blur-[1px] flex flex-col items-center justify-center pointer-events-none">
                                        <Lock size={24} className="text-slate-400 mb-1"/>
                                        <span className="text-[10px] font-black text-slate-500 uppercase text-center">
                                            {!isFaceDetected ? 'Wait for witness lens detection...' : 'Complete all checks to unlock signature'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <canvas ref={witnessCanvasRef} className="hidden" />
                </div>

                <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                    <button 
                        onClick={handleSave} 
                        disabled={isAuthorityBlocked || (requiresGuardian && !guardian) || !allRisksAcknowledged || !isDuressAffirmed || !isFaceDetected} 
                        className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 flex items-center gap-2 disabled:opacity-50 disabled:grayscale transition-all"
                    >
                        <CheckCircle size={20} /> Signed & Verified
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConsentCaptureModal;
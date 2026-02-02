
import React, { useState, useRef, useEffect } from 'react';
import { Patient, Appointment, User, ConsentFormTemplate, ProcedureItem, AuthorityLevel, SignatureChainEntry, SignatureType, TreatmentPlanStatus, PediatricConsent } from '../types';
import { X, CheckCircle, Eraser, FileSignature, AlertTriangle, Baby, ShieldCheck, Scale, CheckSquare, Square, ShieldAlert, Lock, Fingerprint, Camera, UserCheck, Languages, ArrowRight, Key } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { useToast } from './ToastSystem';
import { generateUid, calculateAge, formatDate } from '../constants';
import { useStaff } from '../contexts/StaffContext';

interface ConsentCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (chain: SignatureChainEntry[], pediatricConsent?: PediatricConsent) => void;
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
    const witnessCanvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const guardianCanvasRef = useRef<HTMLCanvasElement>(null);

    const toast = useToast();
    const { staff } = useStaff();
    
    const [step, setStep] = useState<'id_capture' | 'review' | 'sign'>('review');
    const [isSigning, setIsSigning] = useState<false | 'patient' | 'witness'>(false);
    const [acknowledgedRisks, setAcknowledgedRisks] = useState<string[]>([]);
    const [isDuressAffirmed, setIsDuressAffirmed] = useState(false);
    const [isOpportunityAffirmed, setIsOpportunityAffirmed] = useState(false);
    const [isVoluntaryAffirmed, setIsVoluntaryAffirmed] = useState(false);
    const [language, setLanguage] = useState<'en' | 'tl'>('en');
    
    const [isWitnessRequired, setIsWitnessRequired] = useState(false);
    const [witnessId, setWitnessId] = useState('');
    const [witnessPin, setWitnessPin] = useState('');
    const [isWitnessPinVerified, setIsWitnessPinVerified] = useState(false);

    const needsGuardianVerification = !!patient.guardianProfile;
    const [guardianIdPhoto, setGuardianIdPhoto] = useState<string | null>(null);
    const [guardianIdHash, setGuardianIdHash] = useState<string | null>(null);
    const [isCameraLoading, setIsCameraLoading] = useState(false);

    const riskDisclosures = procedure?.riskDisclosures || [];
    const allRisksAcknowledged = riskDisclosures.length === 0 || riskDisclosures.length === acknowledgedRisks.length;
    const allAffirmationsChecked = allRisksAcknowledged && isDuressAffirmed && isOpportunityAffirmed && isVoluntaryAffirmed;
    
    // FIX: Strengthened validation to ensure guardian ID is captured for minors/dependents before proceeding.
    const canProceedToSign = allAffirmationsChecked && 
        (!needsGuardianVerification || (guardianIdPhoto && guardianIdHash));

    const startCamera = async () => {
        setIsCameraLoading(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            toast.error("Camera access is required for guardian verification.");
            console.error(err);
        } finally {
            setIsCameraLoading(false);
        }
    };
    
    const captureIdPhoto = () => {
        const video = videoRef.current;
        const canvas = guardianCanvasRef.current;
        if (video && canvas && video.readyState >= 3) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setGuardianIdPhoto(dataUrl);
            setGuardianIdHash(CryptoJS.SHA256(dataUrl).toString());
            const stream = video.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
        }
    };
    
    const getProcessedContent = () => {
        let content = language === 'en' ? template.content_en : (template.content_tl || template.content_en);
        content = content.replace(/{PatientName}/g, patient.name);
        content = content.replace(/{DoctorName}/g, provider?.name || 'the attending dentist');
        content = content.replace(/{ProcedureList}/g, appointment.type);
        content = content.replace(/{Date}/g, formatDate(appointment.date));
        return content;
    };

    const setupCanvas = (canvas: HTMLCanvasElement | null) => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = 200 * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `200px`;
      const ctx = canvas.getContext('2d', { desynchronized: true });
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 5.0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };

    useEffect(() => {
        if (isOpen) {
           setLanguage('en');
           setAcknowledgedRisks([]);
           setIsDuressAffirmed(false);
           setIsOpportunityAffirmed(false);
           setIsVoluntaryAffirmed(false);
           const witnessNeeded = !!procedure?.requiresWitness;
           setIsWitnessRequired(witnessNeeded);
           setWitnessId('');
           setWitnessPin('');
           setIsWitnessPinVerified(false);
           setGuardianIdPhoto(null);
           setGuardianIdHash(null);
           if (needsGuardianVerification) {
               setStep('id_capture');
               startCamera();
           } else {
               setStep('review');
           }
        } else {
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(t => t.stop());
            }
        }
    }, [isOpen, procedure, needsGuardianVerification]);
    
    useEffect(() => {
        const patientCanvas = signatureCanvasRef.current;
        const witnessCanvas = witnessCanvasRef.current;
        const touchHandler = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault(); };

        if (step === 'sign') {
            setTimeout(() => {
                setupCanvas(patientCanvas);
                if (isWitnessRequired) {
                    setupCanvas(witnessCanvas);
                }
            }, 50);
        }
        
        patientCanvas?.addEventListener('touchstart', touchHandler, { passive: false });
        witnessCanvas?.addEventListener('touchstart', touchHandler, { passive: false });
        
        return () => {
            patientCanvas?.removeEventListener('touchstart', touchHandler);
            witnessCanvas?.removeEventListener('touchstart', touchHandler);
        }
    }, [step, isWitnessRequired]);
    
    const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure };
    };

    const startSign = (e: React.PointerEvent<HTMLCanvasElement>, signer: 'patient' | 'witness') => { e.preventDefault(); setIsSigning(signer); const { x, y } = getCoords(e); const ctx = e.currentTarget.getContext('2d'); ctx?.beginPath(); ctx?.moveTo(x, y); };
    const stopSign = (e: React.PointerEvent<HTMLCanvasElement>) => { e.preventDefault(); setIsSigning(false); };
    const draw = (e: React.PointerEvent<HTMLCanvasElement>) => { if (!isSigning) return; e.preventDefault(); const canvas = e.currentTarget; const { x, y, pressure } = getCoords(e); const ctx = canvas.getContext('2d'); if(ctx){ ctx.lineWidth = Math.max(2, Math.min(8, (pressure || 0.5) * 10)); ctx.lineTo(x, y); ctx.stroke(); } };
    const clearCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>) => { const canvas = canvasRef.current; if (canvas) { const ctx = canvas.getContext('2d'); if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); } } };
    
    const handleVerifyWitnessPin = () => {
        const witness = staff.find(s => s.id === witnessId);
        if (witness && witness.pin === witnessPin) {
            setIsWitnessPinVerified(true);
            toast.success(`Witness ${witness.name} verified.`);
        } else {
            toast.error("Invalid witness PIN.");
            setIsWitnessPinVerified(false);
        }
    };

    const handleSave = () => {
        const patientCanvas = signatureCanvasRef.current;
        if (!patientCanvas) { toast.error("Signature canvas not available."); return; }

        const patientCtx = patientCanvas.getContext('2d');
        if (!patientCtx) { toast.error("Canvas context not available."); return; }
        const patientImageData = patientCtx.getImageData(0, 0, patientCanvas.width, patientCanvas.height).data;
        let patientPixelCount = 0;
        for (let i = 0; i < patientImageData.length; i += 4) {
            if (patientImageData[i+3] > 0) patientPixelCount++;
        }
        if (patientPixelCount < 100) {
            toast.error("Patient/Guardian signature is insufficient. Please provide a full signature.");
            return;
        }

        if (isWitnessRequired) {
            if (!witnessId) { toast.error("A witness must be selected."); return; }
            if (!isWitnessPinVerified) { toast.error("Witness PIN must be verified."); return; }
            
            const witnessCanvas = witnessCanvasRef.current;
            if (!witnessCanvas) { toast.error("Witness signature canvas not available."); return; }
            const witnessCtx = witnessCanvas.getContext('2d');
            if (!witnessCtx) { toast.error("Witness canvas context not available."); return; }
            const witnessImageData = witnessCtx.getImageData(0, 0, witnessCanvas.width, witnessCanvas.height).data;
            let witnessPixelCount = 0;
            for (let i = 0; i < witnessImageData.length; i += 4) {
                if (witnessImageData[i+3] > 0) witnessPixelCount++;
            }
            if (witnessPixelCount < 100) {
                toast.error("Witness signature is insufficient. Please provide a full signature.");
                return;
            }
        }

        const newChain: SignatureChainEntry[] = [...(appointment.consentSignatureChain || [])];
        const timestamp = new Date().toISOString();
        let previousHash = newChain.length > 0 ? newChain[newChain.length - 1].hash : '0';

        const patientSignatureDataUrl = patientCanvas.toDataURL();
        const patientPayload = {
            signatureDataUrl: patientSignatureDataUrl,
            timestamp,
            signer: needsGuardianVerification ? (patient.guardianProfile?.legalName || 'Guardian') : patient.name,
            affirmations: {
                acknowledgedRisks,
                isDuressAffirmed,
                isOpportunityAffirmed,
                isVoluntaryAffirmed
            }
        };
        const patientHash = CryptoJS.SHA256(JSON.stringify(patientPayload)).toString();
        
        const patientEntry: SignatureChainEntry = {
            id: generateUid('sig'),
            signatureType: needsGuardianVerification ? 'guardian' : 'patient',
            signatureDataUrl: patientSignatureDataUrl,
            timestamp,
            signerName: needsGuardianVerification ? (patient.guardianProfile?.legalName || 'Guardian') : patient.name,
            signerRole: needsGuardianVerification ? (patient.guardianProfile?.relationship || 'Legal Guardian') : 'Patient',
            hash: patientHash,
            previousHash,
            metadata: {
                deviceInfo: navigator.userAgent,
                consentType: template.name,
                procedureName: appointment.type,
                consentLanguage: language,
                ...(needsGuardianVerification && guardianIdHash && { guardianIdHash })
            }
        };
        newChain.push(patientEntry);
        previousHash = patientHash;

        if (isWitnessRequired && witnessId && witnessCanvasRef.current) {
            const witness = staff.find(s => s.id === witnessId);
            const witnessSignatureDataUrl = witnessCanvasRef.current.toDataURL();
            const witnessPayload = { signatureDataUrl: witnessSignatureDataUrl, timestamp, signer: witness?.name, witnessPinVerified: true };
            const witnessHash = CryptoJS.SHA256(JSON.stringify(witnessPayload)).toString();

            const witnessEntry: SignatureChainEntry = {
                id: generateUid('sig'),
                signatureType: 'witness',
                signatureDataUrl: witnessSignatureDataUrl,
                timestamp,
                signerName: witness?.name || 'Unknown Witness',
                signerRole: witness?.role,
                hash: witnessHash,
                previousHash,
                metadata: { deviceInfo: navigator.userAgent, consentType: `Witness to ${template.name}` }
            };
            newChain.push(witnessEntry);
        }
        
        if (window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
        onSave(newChain, undefined);
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-4xl h-[95vh] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3"><div className="bg-teal-100 p-3 rounded-xl text-teal-700"><FileSignature size={24} /></div><div><h2 className="text-xl font-bold text-slate-800">{template.name}</h2><p className="text-sm text-slate-500">for {patient.name}</p></div></div>
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg"><button onClick={() => setLanguage('en')} className={`px-3 py-1 text-xs font-bold rounded ${language === 'en' ? 'bg-white shadow' : ''}`}>English</button><button onClick={() => setLanguage('tl')} className={`px-3 py-1 text-xs font-bold rounded ${language === 'tl' ? 'bg-white shadow' : ''}`}>Tagalog</button></div>
                  <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-500" /></button>
              </div>

              {step === 'id_capture' && (
                  <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-50">
                     <h3 className="text-xl font-black text-slate-800 mb-2">Guardian ID Verification</h3>
                     <p className="text-sm text-slate-500 mb-6">Please capture a photo of the guardian's government-issued ID.</p>
                     <div className="w-full max-w-lg bg-black rounded-2xl overflow-hidden aspect-video relative">
                         <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${guardianIdPhoto ? 'hidden' : ''}`} />
                         {guardianIdPhoto && <img src={guardianIdPhoto} alt="Guardian ID" className="w-full h-full object-contain" />}
                         <canvas ref={guardianCanvasRef} className="hidden" />
                     </div>
                     <div className="flex gap-4 mt-6">
                         {guardianIdPhoto ? (
                            <>
                                <button onClick={() => { setGuardianIdPhoto(null); startCamera(); }} className="px-6 py-3 bg-slate-200 text-slate-800 rounded-xl font-bold">Retake</button>
                                <button onClick={() => setStep('review')} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold flex items-center gap-2"><ArrowRight/> Proceed</button>
                            </>
                         ) : (
                            <button onClick={captureIdPhoto} disabled={isCameraLoading} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2">
                                <Camera size={16}/> {isCameraLoading ? 'Starting Camera...' : 'Capture ID'}
                            </button>
                         )}
                     </div>
                  </div>
              )}

              {step === 'review' && (
                <>
                    <div className="flex-1 p-6 min-h-0 overflow-y-auto space-y-6">
                        <div className="flex-1 bg-slate-50 p-6 rounded-2xl border border-slate-200 h-64 overflow-y-auto"><pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans">{getProcessedContent()}</pre></div>
                        {riskDisclosures.length > 0 && (
                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200"><h4 className="font-bold text-sm text-amber-800 mb-2">Acknowledged Risks</h4><div className="space-y-2">{riskDisclosures.map(risk => (<label key={risk} className="flex items-center gap-3 p-2 bg-white rounded-lg cursor-pointer"><input type="checkbox" checked={acknowledgedRisks.includes(risk)} onChange={() => setAcknowledgedRisks(p => p.includes(risk) ? p.filter(r=>r!==risk) : [...p, risk])} className="w-5 h-5 accent-teal-600"/><span className="text-sm font-medium text-slate-700">{risk}</span></label>))}</div></div>
                        )}
                        <label className="flex items-start gap-3 p-4 bg-white rounded-2xl border-2 border-slate-200 cursor-pointer"><input type="checkbox" checked={isOpportunityAffirmed} onChange={e => setIsOpportunityAffirmed(e.target.checked)} className="w-6 h-6 accent-teal-600 mt-1"/><span className="text-sm font-bold text-slate-800">I had the opportunity to ask questions and they were answered to my satisfaction.</span></label>
                        <label className="flex items-start gap-3 p-4 bg-white rounded-2xl border-2 border-slate-200 cursor-pointer"><input type="checkbox" checked={isVoluntaryAffirmed} onChange={e => setIsVoluntaryAffirmed(e.target.checked)} className="w-6 h-6 accent-teal-600 mt-1"/><span className="text-sm font-bold text-slate-800">I voluntarily give my consent for the procedure(s) listed.</span></label>
                        <label className="flex items-start gap-3 p-4 bg-white rounded-2xl border-2 border-slate-200 cursor-pointer"><input type="checkbox" checked={isDuressAffirmed} onChange={e => setIsDuressAffirmed(e.target.checked)} className="w-6 h-6 accent-teal-600 mt-1"/><span className="text-sm font-bold text-slate-800">I affirm I am signing this consent form freely and without duress.</span></label>
                    </div>
                     <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0"><button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all">Cancel</button><button onClick={() => setStep('sign')} disabled={!canProceedToSign} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 flex items-center gap-2 disabled:opacity-50 disabled:grayscale"><ArrowRight size={16}/> Proceed to Sign</button></div>
                </>
              )} 
              
              {step === 'sign' && (
                <>
                    <div className="flex-1 p-6 min-h-0 overflow-y-auto space-y-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
                            <h3 className="text-lg font-black text-slate-800">Summary of Attestation</h3>
                            <p className="text-xs text-slate-500">For Patient: <span className="font-bold">{patient.name}</span> | Procedure: <span className="font-bold">{appointment.type}</span> | Date: <span className="font-bold">{formatDate(appointment.date)}</span></p>
                        </div>
                        <div className={`bg-white p-4 rounded-2xl border-2 shadow-sm transition-all border-teal-500`}>
                            <div className="flex justify-between items-center mb-2"><h4 className="font-bold text-slate-700">Patient/Guardian Signature (Required)</h4><button onClick={() => clearCanvas(signatureCanvasRef)} className="text-xs font-bold text-slate-400 hover:text-red-500"><Eraser size={12}/> Clear</button></div>
                            <canvas ref={signatureCanvasRef} className="bg-white rounded-lg border-2 border-dashed border-slate-300 w-full touch-none cursor-crosshair" onPointerDown={e => startSign(e, 'patient')} onPointerMove={draw} onPointerUp={stopSign} onPointerLeave={stopSign} />
                        </div>
                        {isWitnessRequired && (
                            <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-200 mt-6">
                                <h4 className="font-bold text-amber-800 flex items-center gap-2 mb-4"><ShieldCheck size={16}/> Witness Attestation (Required)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <select value={witnessId} onChange={e => { setWitnessId(e.target.value); setIsWitnessPinVerified(false); setWitnessPin(''); }} className="input">
                                        <option value="">Select Staff Witness...</option>
                                        {staff.filter(s => s.id !== provider?.id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <input type="password" value={witnessPin} onChange={e => setWitnessPin(e.target.value)} disabled={!witnessId} className="input w-full" placeholder="Witness PIN"/>
                                        <button onClick={handleVerifyWitnessPin} disabled={!witnessId || witnessPin.length < 4} className="px-4 bg-amber-500 text-white rounded-lg text-xs font-bold disabled:opacity-50">Verify</button>
                                    </div>
                                </div>
                                <div className={`mt-4 relative transition-all ${!isWitnessPinVerified ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="label text-xs">Witness Signature</label>
                                        <button onClick={() => clearCanvas(witnessCanvasRef)} className="text-xs font-bold text-slate-400 hover:text-red-500"><Eraser size={12}/> Clear</button>
                                    </div>
                                    <canvas ref={witnessCanvasRef} className="bg-white rounded-lg border-2 border-dashed border-slate-300 w-full touch-none cursor-crosshair" onPointerDown={e => startSign(e, 'witness')} onPointerMove={draw} onPointerUp={stopSign} onPointerLeave={stopSign} />
                                    {!isWitnessPinVerified && <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg"><Lock size={24} className="text-slate-500"/></div>}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
                        <button onClick={() => setStep('review')} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all">Back to Review</button>
                        <button onClick={handleSave} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 flex items-center gap-2"><CheckCircle size={20} /> Attest & Save Consent</button>
                    </div>
                </>
              )}
          </div>
      </div>
    );
};

export default ConsentCaptureModal;

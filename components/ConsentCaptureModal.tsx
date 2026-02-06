
import React, { useState, useRef, useEffect } from 'react';
import { Patient, Appointment, User, ConsentFormTemplate, ProcedureItem, SignatureChainEntry, PediatricConsent } from '../types';
import { X, CheckCircle, Eraser, FileSignature, AlertTriangle, ShieldCheck, ArrowRight, PenTool } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { useToast } from './ToastSystem';
import { generateUid, formatDate } from '../constants';

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
    const toast = useToast();
    
    const [step, setStep] = useState<'review' | 'sign'>('review');
    const [isSigning, setIsSigning] = useState(false);
    const [acknowledgedRisks, setAcknowledgedRisks] = useState<string[]>([]);
    const [isDuressAffirmed, setIsDuressAffirmed] = useState(false);
    const [isOpportunityAffirmed, setIsOpportunityAffirmed] = useState(false);
    const [isVoluntaryAffirmed, setIsVoluntaryAffirmed] = useState(false);
    const [language, setLanguage] = useState<'en' | 'tl'>('en');
    
    const isMinor = (calculateAge(patient.dob) || 18) < 18;
    const riskDisclosures = procedure?.riskDisclosures || [];
    const allRisksAcknowledged = riskDisclosures.length === 0 || riskDisclosures.length === acknowledgedRisks.length;
    const canProceedToSign = allRisksAcknowledged && isDuressAffirmed && isOpportunityAffirmed && isVoluntaryAffirmed;
    
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
      canvas.height = 250 * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `250px`;
      const ctx = canvas.getContext('2d', { desynchronized: true });
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4.0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };

    useEffect(() => {
        if (isOpen) {
           setStep('review');
           setLanguage('en');
           setAcknowledgedRisks([]);
           setIsDuressAffirmed(false);
           setIsOpportunityAffirmed(false);
           setIsVoluntaryAffirmed(false);
        }
    }, [isOpen]);
    
    useEffect(() => {
        if (step === 'sign') {
            setTimeout(() => setupCanvas(signatureCanvasRef.current), 50);
        }
    }, [step]);
    
    const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure };
    };

    const startSign = (e: React.PointerEvent<HTMLCanvasElement>) => { 
        if (e.pointerType === 'touch' && e.width > 20) return;
        e.preventDefault(); 
        setIsSigning(true); 
        const { x, y } = getCoords(e); 
        const ctx = e.currentTarget.getContext('2d'); 
        ctx?.beginPath(); ctx?.moveTo(x, y); 
        if (window.navigator.vibrate) window.navigator.vibrate(10);
    };

    const stopSign = () => setIsSigning(false);

    const draw = (e: React.PointerEvent<HTMLCanvasElement>) => { 
        if (!isSigning) return; 
        e.preventDefault(); 
        const canvas = e.currentTarget; 
        const { x, y, pressure } = getCoords(e); 
        const ctx = canvas.getContext('2d'); 
        if(ctx){ 
            ctx.lineWidth = Math.max(2, Math.min(8, (pressure || 0.5) * 10)); 
            ctx.lineTo(x, y); ctx.stroke(); 
        } 
    };

    const clearCanvas = () => { 
        const canvas = signatureCanvasRef.current; 
        if (canvas) { 
            const ctx = canvas.getContext('2d'); 
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); 
        } 
    };

    const handleSave = () => {
        const patientCanvas = signatureCanvasRef.current;
        if (!patientCanvas) return;
        const isPatientCanvasBlank = !patientCanvas.getContext('2d')!.getImageData(0, 0, patientCanvas.width, patientCanvas.height).data.some(channel => channel !== 0);
        if (isPatientCanvasBlank) { toast.error("Signature is required."); return; }

        const timestamp = new Date().toISOString();
        const signatureDataUrl = patientCanvas.toDataURL();
        const payload = { signatureDataUrl, timestamp, signer: patient.name };
        const signatureHash = CryptoJS.SHA256(JSON.stringify(payload)).toString();
        
        const entry: SignatureChainEntry = {
            id: generateUid('sig'),
            signatureType: isMinor ? 'guardian' : 'patient',
            signatureDataUrl,
            timestamp,
            signerName: isMinor ? (patient.guardianProfile?.legalName || 'Guardian') : patient.name,
            signerRole: isMinor ? (patient.guardianProfile?.relationship || 'Legal Guardian') : 'Patient',
            hash: signatureHash,
            previousHash: '0',
            metadata: { deviceInfo: navigator.userAgent, consentType: template.name }
        };

        if (window.navigator.vibrate) window.navigator.vibrate(50);
        onSave([entry]);
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-4xl h-[95vh] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                      <div className="bg-teal-100 p-3 rounded-xl text-teal-700"><FileSignature size={24} /></div>
                      <div>
                          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">{template.name}</h2>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Digital Consent for {patient.name}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                      <button onClick={() => setLanguage('en')} className={`px-4 py-1 text-xs font-black uppercase rounded ${language === 'en' ? 'bg-white shadow' : ''}`}>EN</button>
                      <button onClick={() => setLanguage('tl')} className={`px-4 py-1 text-xs font-black uppercase rounded ${language === 'tl' ? 'bg-white shadow' : ''}`}>TL</button>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button>
              </div>

              {step === 'review' ? (
                <>
                    <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-50/50">
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"><pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">{getProcessedContent()}</pre></div>
                        {riskDisclosures.length > 0 && (
                            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 space-y-3">
                                <h4 className="font-black text-xs text-amber-800 uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={14}/> Risk Acknowledgements</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {riskDisclosures.map(risk => (
                                        <label key={risk} className="flex items-center gap-3 p-3 bg-white rounded-xl cursor-pointer border border-transparent hover:border-amber-400 transition-all">
                                            <input type="checkbox" checked={acknowledgedRisks.includes(risk)} onChange={() => setAcknowledgedRisks(p => p.includes(risk) ? p.filter(r=>r!==risk) : [...p, risk])} className="w-6 h-6 accent-teal-600 rounded"/>
                                            <span className="text-sm font-bold text-slate-700">{risk}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex items-start gap-4 p-5 bg-white rounded-2xl border-2 border-slate-100 cursor-pointer hover:border-teal-500 transition-all">
                                <input type="checkbox" checked={isOpportunityAffirmed} onChange={e => setIsOpportunityAffirmed(e.target.checked)} className="w-8 h-8 accent-teal-600 shrink-0"/>
                                <span className="text-sm font-bold text-slate-800">I have had the opportunity to ask questions and they were answered.</span>
                            </label>
                            <label className="flex items-start gap-4 p-5 bg-white rounded-2xl border-2 border-slate-100 cursor-pointer hover:border-teal-500 transition-all">
                                <input type="checkbox" checked={isVoluntaryAffirmed} onChange={e => setIsVoluntaryAffirmed(e.target.checked)} className="w-8 h-8 accent-teal-600 shrink-0"/>
                                <span className="text-sm font-bold text-slate-800">I voluntarily give my consent for this procedure.</span>
                            </label>
                            <label className="flex items-start gap-4 p-5 bg-white rounded-2xl border-2 border-slate-100 cursor-pointer hover:border-teal-500 transition-all md:col-span-2">
                                <input type="checkbox" checked={isDuressAffirmed} onChange={e => setIsDuressAffirmed(e.target.checked)} className="w-8 h-8 accent-teal-600 shrink-0"/>
                                <span className="text-sm font-bold text-slate-800">I affirm I am signing this freely and without duress.</span>
                            </label>
                        </div>
                    </div>
                    <div className="p-6 border-t bg-white flex justify-end shrink-0">
                        <button onClick={() => setStep('sign')} disabled={!canProceedToSign} className="px-12 py-5 bg-teal-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-teal-600/30 flex items-center gap-3 disabled:opacity-50">
                            Proceed to Sign <ArrowRight size={20}/>
                        </button>
                    </div>
                </>
              ) : (
                <>
                    <div className="flex-1 p-8 flex flex-col gap-6 bg-slate-50/50">
                        <div className="bg-white p-8 rounded-[3rem] border-4 border-dashed border-teal-500 flex-1 flex flex-col relative overflow-hidden">
                            <div className="absolute top-6 left-8 flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] z-10 pointer-events-none">
                                <PenTool size={14} /> Official Signature Box
                            </div>
                            <button onClick={clearCanvas} className="absolute top-6 right-8 p-2 text-slate-300 hover:text-red-500 transition-all z-10"><Eraser size={24}/></button>
                            <canvas 
                                ref={signatureCanvasRef} 
                                className="w-full flex-1 bg-white cursor-crosshair rounded-[2rem] touch-none" 
                                onPointerDown={startSign} 
                                onPointerMove={draw} 
                                onPointerUp={stopSign} 
                                onPointerLeave={stopSign} 
                            />
                            <div className="text-center p-4 border-t border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">By signing here, you bind your clinical record to the terms agreed upon.</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t bg-white flex justify-between shrink-0">
                        <button onClick={() => setStep('review')} className="px-8 py-4 bg-slate-100 text-slate-600 font-black uppercase text-xs rounded-2xl">Back to Review</button>
                        <button onClick={handleSave} className="px-12 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-600/30 flex items-center gap-3">
                            <ShieldCheck size={20} /> Authorize & Save
                        </button>
                    </div>
                </>
              )}
          </div>
      </div>
    );
};

const calculateAge = (dob: string): number => {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
    return age;
};

export default ConsentCaptureModal;

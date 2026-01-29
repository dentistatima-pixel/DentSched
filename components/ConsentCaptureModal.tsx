import React, { useState, useRef, useEffect } from 'react';
import { Patient, Appointment, User, ConsentFormTemplate, ProcedureItem, AuthorityLevel, SignatureChainEntry, SignatureType, TreatmentPlanStatus, PediatricConsent } from '../types';
import { X, CheckCircle, Eraser, FileSignature, AlertTriangle, Baby, ShieldCheck, Scale, CheckSquare, Square, ShieldAlert, Lock, Fingerprint, Camera, UserCheck, Languages } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { useToast } from './ToastSystem';
import { generateUid, calculateAge } from '../constants';

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
    const videoRef = useRef<HTMLVideoElement>(null);
    const witnessCanvasRef = useRef<HTMLCanvasElement>(null);
    const toast = useToast();
    
    const [isSigning, setIsSigning] = useState(false);
    const [acknowledgedRisks, setAcknowledgedRisks] = useState<string[]>([]);
    const [isDuressAffirmed, setIsDuressAffirmed] = useState(false);
    
    const [language, setLanguage] = useState<'en' | 'tl'>('en');

    // Child Assent State
    const [childAssent, setChildAssent] = useState<PediatricConsent['childAssent']>({
        explanationGiven: false,
        understanding: 'None',
        agreement: false,
        dentistAttestation: '', // Dentist signature to be added on save
    });

    // Witness Identity State
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isFaceDetected, setIsFaceDetected] = useState(false);
    const [witnessName, setWitnessName] = useState('');
    const [witnessRole, setWitnessRole] = useState<'Staff' | 'Family' | 'Other'>('Staff');

    const isMinor = (calculateAge(patient.dob) || 18) < 18;
    const isOldEnoughForAssent = isMinor && (calculateAge(patient.dob) || 0) >= 7;
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
      if (!canvas) return;
      
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = 200 * dpr;
      
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `200px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 5.0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };

    const startWitnessCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320, facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
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
        const canvas = signatureCanvasRef.current;
        const touchStartHandler = (e: TouchEvent) => {
            if (e.touches.length > 1) { // Palm rejection
                e.preventDefault();
            }
        };

        if (isOpen) {
           setTimeout(setupCanvas, 50);
           setLanguage('en');
           setAcknowledgedRisks([]);
           setIsDuressAffirmed(false);
           setWitnessName('');
           setWitnessRole('Staff');
           setChildAssent({ explanationGiven: false, understanding: 'None', agreement: false, dentistAttestation: '' });
           startWitnessCamera();
           
           if (canvas) {
               canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
           }
        } else {
            stopWitnessCamera();
        }

        return () => {
            stopWitnessCamera();
            if (canvas) {
                canvas.removeEventListener('touchstart', touchStartHandler);
            }
        };
    }, [isOpen]);
    
    const getCoords = (e: any) => {
      const canvas = signatureCanvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    };

    const startSign = (e: any) => { 
        if (!isDuressAffirmed || !allRisksAcknowledged || !isFaceDetected || !witnessName.trim()) return;
        if (language !== 'en') setLanguage('en');
        e.preventDefault(); setIsSigning(true); const { x, y } = getCoords(e); const ctx = signatureCanvasRef.current?.getContext('2d'); ctx?.beginPath(); ctx?.moveTo(x, y); 
    };
    const stopSign = (e: any) => { e.preventDefault(); setIsSigning(false); };
    const draw = (e: any) => { if (!isSigning || !isDuressAffirmed || !allRisksAcknowledged) return; e.preventDefault(); const { x, y } = getCoords(e); const ctx = signatureCanvasRef.current?.getContext('2d'); ctx?.lineTo(x, y); ctx?.stroke(); };
    const clearCanvas = () => { const canvas = signatureCanvasRef.current; if (canvas) { const ctx = canvas.getContext('2d'); if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); } } };

    const validateWitnessPhoto = (): boolean => {
        const video = videoRef.current;
        const canvas = witnessCanvasRef.current;
        if (!video || !canvas || !isCameraActive || video.readyState < 3) {
            toast.error("Witness camera is not ready. Please ensure your face is visible and centered.");
            return false;
        }
        return true;
    };

    const handleSave = () => {
        if (!validateWitnessPhoto()) return;
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;

        const signatureDataUrl = canvas.toDataURL();

        let chain: SignatureChainEntry[] = [];
        
        onSave(chain, isOldEnoughForAssent ? { parentConsent: {} as any, childAssent } : undefined);
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-4xl h-[95vh] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                      <div className="bg-teal-100 p-3 rounded-xl text-teal-700">
                          <FileSignature size={24} />
                      </div>
                      <div>
                          <h2 className="text-xl font-bold text-slate-800">{template.name}</h2>
                          <p className="text-sm text-slate-500">for {patient.name}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-xs font-bold rounded ${language === 'en' ? 'bg-white shadow' : ''}`}>English</button>
                    <button onClick={() => setLanguage('tl')} className={`px-3 py-1 text-xs font-bold rounded ${language === 'tl' ? 'bg-white shadow' : ''}`}>Tagalog</button>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <X size={24} className="text-slate-500" />
                  </button>
              </div>

              {/* Main Content */}
              <div className="flex-1 grid grid-cols-12 gap-6 p-6 min-h-0">
                  {/* Left: Document & Risks */}
                  <div className="col-span-7 flex flex-col gap-6">
                      <div className="flex-1 bg-slate-50 p-6 rounded-2xl border border-slate-200 overflow-y-auto">
                          <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans">{getProcessedContent()}</pre>
                      </div>
                      {riskDisclosures.length > 0 && (
                          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                              <h4 className="font-bold text-sm text-amber-800 mb-2">Acknowledged Risks</h4>
                              <div className="space-y-2">
                                  {riskDisclosures.map(risk => (
                                      <label key={risk} className="flex items-center gap-3 p-2 bg-white rounded-lg cursor-pointer">
                                        <input type="checkbox" checked={acknowledgedRisks.includes(risk)} onChange={() => setAcknowledgedRisks(p => p.includes(risk) ? p.filter(r=>r!==risk) : [...p, risk])} className="w-5 h-5 accent-teal-600"/>
                                        <span className="text-sm font-medium text-slate-700">{risk}</span>
                                      </label>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Right: Affirmations & Signature */}
                  <div className="col-span-5 flex flex-col gap-6">
                       {/* Witness Section */}
                      <div className="bg-white p-4 rounded-2xl border-2 border-slate-200">
                          <h4 className="font-bold text-sm text-slate-700 mb-2">Witness Details</h4>
                          <div className="flex gap-4">
                              <div className="w-24 h-24 bg-slate-200 rounded-lg relative overflow-hidden">
                                 <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover scale-x-[-1] ${isCameraActive ? '' : 'hidden'}`}/>
                                 {!isCameraActive && <UserCheck size={32} className="text-slate-400 m-8"/>}
                                 {isFaceDetected && <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center"><CheckCircle size={40} className="text-white"/></div>}
                                 <canvas ref={witnessCanvasRef} className="hidden"/>
                              </div>
                              <div className="flex-1 space-y-2">
                                <input type="text" placeholder="Witness Name" value={witnessName} onChange={e => setWitnessName(e.target.value)} className="input" />
                                <select value={witnessRole} onChange={e => setWitnessRole(e.target.value as any)} className="input">
                                    <option>Staff</option><option>Family</option><option>Other</option>
                                </select>
                              </div>
                          </div>
                      </div>
                      
                       {isOldEnoughForAssent && (
                          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 space-y-2">
                              <h4 className="font-bold text-sm text-blue-800 flex items-center gap-2"><Baby size={16}/> Pediatric Assent (7-17 y.o.)</h4>
                              {/* Child assent form elements here */}
                          </div>
                       )}

                      <label className="flex items-start gap-3 p-4 bg-white rounded-2xl border-2 border-slate-200 cursor-pointer">
                        <input type="checkbox" checked={isDuressAffirmed} onChange={e => setIsDuressAffirmed(e.target.checked)} className="w-6 h-6 accent-teal-600 mt-1"/>
                        <span className="text-sm font-bold text-slate-800">I affirm I am signing this consent form freely and without duress.</span>
                      </label>
                      
                      <div className={`bg-white p-4 rounded-2xl border-2 shadow-sm transition-all ${!allRisksAcknowledged || !isDuressAffirmed || !isFaceDetected || !witnessName.trim() ? 'border-slate-200 opacity-50 grayscale' : 'border-teal-500'}`}>
                         <div className="flex justify-between items-center mb-2">
                             <h4 className="font-bold text-slate-700">Patient/Guardian Signature</h4>
                             <button onClick={clearCanvas} className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1"><Eraser size={12}/> Clear</button>
                         </div>
                         <canvas ref={signatureCanvasRef} className="bg-white rounded-lg border-2 border-dashed border-slate-300 w-full touch-none" onMouseDown={startSign} onMouseUp={stopSign} onMouseLeave={stopSign} onMouseMove={draw} onTouchStart={startSign} onTouchEnd={stopSign} onTouchMove={draw} />
                      </div>
                  </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                  <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
                  <button onClick={handleSave} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 flex items-center gap-2">
                      <CheckCircle size={20} /> Attest & Save Consent
                  </button>
              </div>
          </div>
      </div>
    );
};

export default ConsentCaptureModal;

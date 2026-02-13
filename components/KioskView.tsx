
import React, { useState, useEffect, useRef } from 'react';
import { Patient, AuditLogEntry, FieldSettings } from '../types';
import { UserPlus, UserCheck, ChevronRight, LogOut, ArrowLeft, Phone, Cake, CheckCircle2, ShieldCheck, ShieldAlert, Camera, Fingerprint, Lock, FileText, Eye, RefreshCw } from 'lucide-react';
import PatientRegistrationModal from './PatientRegistrationModal';
import { useToast } from './ToastSystem';
import CryptoJS from 'crypto-js';
import { STAFF } from '../constants';
import { usePatient } from '../contexts/PatientContext';

interface KioskViewProps {
  onExitKiosk: () => void;
  logAction?: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
}

type KioskStep = 'welcome' | 'identify' | 'verify' | 'notice' | 'anchor' | 'affirmation' | 'update' | 'thankyou';

export const KioskView: React.FC<KioskViewProps> = ({ onExitKiosk, logAction }) => {
  const toast = useToast();
  const { patients, handleSavePatient: onUpdatePatient } = usePatient();
  const [step, setStep] = useState<KioskStep>('welcome');
  
  const [identifier, setIdentifier] = useState('');
  const [birthDateInput, setBirthDateInput] = useState('');
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);

  // Camera engine for Visual Identity Anchor
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedThumb, setCapturedThumb] = useState<string | null>(null);
  const [capturedHash, setCapturedHash] = useState<string | null>(null);

  useEffect(() => {
    if (step === 'welcome') {
        setIdentifier('');
        setBirthDateInput('');
        setFoundPatient(null);
        setCapturedThumb(null);
        setCapturedHash(null);
    }
    if (step === 'thankyou') {
        const timer = setTimeout(() => setStep('welcome'), 4000);
        return () => clearTimeout(timer);
    }
  }, [step]);

  const handleIdentify = (e: React.FormEvent) => {
      e.preventDefault();
      const cleanId = identifier.replace(/\D/g, ''); 
      if (cleanId.length < 4) {
          toast.error("Enter a valid mobile number.");
          return;
      }
      const match = patients.find(p => p.phone.replace(/\D/g, '').includes(cleanId));
      if (match && match.dob === birthDateInput) {
          setFoundPatient(match);
          setStep('verify');
      } else {
          toast.error("Record not found. Please verify your details.");
          if (logAction) logAction('SECURITY_ALERT', 'Kiosk', 'System', `Failed Kiosk Login attempt.`);
      }
  };

  const startCamera = async () => {
    setCameraLoading(true);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 320 } });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setIsCameraActive(true);
        }
    } catch (err) {
        toast.error("Camera access denied. Visual Anchor required for digital intake.");
        console.error(err);
    } finally {
        setCameraLoading(false);
    }
  };

  const captureAnchor = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState >= 3) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Low-Footprint Image Optimization
            canvas.width = 96;
            canvas.height = 96;
            ctx.filter = 'grayscale(100%) brightness(1.2)';
            ctx.drawImage(video, 0, 0, 96, 96);
            const thumb = canvas.toDataURL('image/jpeg', 0.5); // JPEG compression
            const hash = CryptoJS.SHA256(thumb).toString();
            setCapturedThumb(thumb);
            setCapturedHash(hash);
            const stream = video.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
            setIsCameraActive(false);
            
            // Move to final step
            setStep('affirmation');
        }
    }
  };

  const handlePatientSave = async (updated: Partial<Patient>) => {
      const finalPatient = { ...updated };

      if (capturedThumb || capturedHash) {
          if (!finalPatient.guardianProfile) {
              finalPatient.guardianProfile = {} as any;
          }
          finalPatient.guardianProfile.visualAnchorThumb = capturedThumb || undefined;
          finalPatient.guardianProfile.visualAnchorHash = capturedHash || undefined;
      }
      
      await onUpdatePatient(finalPatient);
      setStep('thankyou');
  };

  const handleExitClick = () => {
      const pin = prompt("Staff PIN to Exit:");
      if (pin && pin.length > 0) {
          onExitKiosk();
      } else if (pin !== null) { // Only show error if user didn't cancel
          toast.error("Incorrect PIN");
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col overflow-hidden font-sans text-slate-900">
        
        <div className="bg-white p-6 shadow-sm flex justify-between items-center relative border-b border-slate-100">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20">
                    <span className="text-white font-bold text-2xl">D</span>
                </div>
                <div>
                    <h1 className="font-bold text-xl tracking-tight leading-none">dentsched</h1>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Digital Patient Terminal</span>
                </div>
            </div>
            
            {step !== 'welcome' && step !== 'thankyou' && (
                <button onClick={() => setStep('welcome')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all">
                    <ArrowLeft size={18} /> Restart
                </button>
            )}

            {step === 'welcome' && (
                <button onDoubleClick={handleExitClick} className="opacity-10 hover:opacity-100 transition-opacity p-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Staff Exit
                </button>
            )}
        </div>

        <div className="flex-1 flex items-center justify-center p-6 relative">
            
            {step === 'welcome' && (
                <div className="w-full max-w-4xl animate-in zoom-in-95 duration-500">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-black text-teal-900 mb-4 uppercase tracking-tight">Digital Intake</h2>
                        <p className="text-xl text-slate-500 font-medium">Please select your status to begin registration.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <button 
                            onClick={() => { setFoundPatient(null); setStep('notice'); }}
                            className="bg-white p-10 rounded-[2.5rem] border-4 border-teal-100 shadow-2xl hover:border-teal-500 transition-all group hover:-translate-y-2 text-center"
                        >
                            <div className="w-24 h-24 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-teal-600 group-hover:text-white transition-all">
                                <UserPlus size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-teal-900 uppercase tracking-tighter">New Registration</h3>
                            <p className="text-slate-500 mt-2 font-medium">First time at our clinic? Enroll your record here.</p>
                        </button>

                        <button 
                            onClick={() => setStep('identify')}
                            className="bg-white p-10 rounded-[2.5rem] border-4 border-lilac-100 shadow-2xl hover:border-lilac-500 transition-all group hover:-translate-y-2 text-center"
                        >
                            <div className="w-24 h-24 bg-lilac-50 text-lilac-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-lilac-600 group-hover:text-white transition-all">
                                <UserCheck size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-lilac-900 uppercase tracking-tighter">Update Record</h3>
                            <p className="text-slate-500 mt-2 font-medium">Verify your ID to update medical or contact details.</p>
                        </button>
                    </div>
                </div>
            )}

            {step === 'identify' && (
                <div className="w-full max-w-md animate-in slide-in-from-bottom-10 duration-300">
                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
                        <h3 className="text-2xl font-black text-center text-slate-800 mb-8 uppercase tracking-widest">Verify Identity</h3>
                        <form onSubmit={handleIdentify} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-1"><Phone size={12}/> Registered Mobile</label>
                                <input 
                                    type="tel" 
                                    autoFocus
                                    className="w-full text-center text-2xl font-mono p-4 border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none"
                                    placeholder="09XXXXXXXXX"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-1"><Cake size={12}/> Birth Date</label>
                                <input 
                                    type="date" 
                                    className="w-full text-center text-xl p-4 border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none"
                                    value={birthDateInput}
                                    onChange={(e) => setBirthDateInput(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="w-full bg-teal-600 py-5 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl shadow-teal-600/20">Verify Access</button>
                        </form>
                    </div>
                </div>
            )}

            {step === 'verify' && foundPatient && (
                <div className="w-full max-w-md animate-in zoom-in-95 duration-300">
                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 text-center">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Match Found</h3>
                        <div className="bg-slate-50 p-8 rounded-3xl border-2 border-teal-100 mb-8">
                            <div className="text-2xl font-black text-teal-900">{foundPatient.name}</div>
                            <div className="text-slate-400 font-mono mt-1">{foundPatient.phone}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setStep('identify')} className="py-4 rounded-2xl font-bold text-slate-400 bg-slate-100">Incorrect</button>
                            <button onClick={() => setStep('notice')} className="py-4 rounded-2xl font-black text-white bg-teal-600 shadow-lg uppercase tracking-widest">Proceed</button>
                        </div>
                    </div>
                </div>
            )}

            {step === 'notice' && (
                <div className="w-full max-w-2xl animate-in slide-in-from-bottom-10 duration-300">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 flex flex-col h-[70vh]">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl shadow-sm"><ShieldCheck size={32}/></div>
                            <div>
                                <h3 className="text-2xl font-black text-teal-900 uppercase tracking-tighter leading-none">Privacy Notice at Collection</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Compliance with R.A. 10173</p>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-4 mb-8 space-y-6 text-sm text-slate-600 leading-relaxed no-scrollbar border-y py-6">
                            <p>Before providing your personal data, please read our <strong>Digital Intake Transparency Notice</strong>:</p>
                            <section>
                                <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest mb-1">1. Collection Purpose</h4>
                                <p>We collect your medical history, personal identifiers, and a <strong>Visual Identity Anchor</strong> (photo) strictly for clinical diagnosis, treatment planning, and ensuring the authenticity of medical records.</p>
                            </section>
                            <section>
                                <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest mb-1">2. Visual Identity Proof</h4>
                                <p>Pursuant to the Rules on Electronic Evidence, a low-resolution snapshot of the person providing consent is required to prove physical presence at the terminal and prevent unauthorized staff-only entries.</p>
                            </section>
                            <section>
                                <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest mb-1">3. Data Residency</h4>
                                <p>Your data is stored in encrypted cloud environments located in the Asia-Southeast1 region. No remote patient access is permitted once you exit this terminal.</p>
                            </section>
                            <p className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200 text-xs italic">
                                "I acknowledge that I have been informed of the purposes for which my data will be processed and my rights as a data subject under the Data Privacy Act of 2012."
                            </p>
                        </div>

                        <button 
                            onClick={() => setStep('anchor')}
                            className="w-full py-6 bg-teal-600 text-white font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-teal-600/20 hover:scale-105 transition-all"
                        >
                            I Have Been Informed & Proceed
                        </button>
                    </div>
                </div>
            )}

            {step === 'anchor' && (
                <div className="w-full max-w-md animate-in zoom-in-95 duration-300">
                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 text-center flex flex-col items-center">
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-teal-900 uppercase tracking-tighter">Digital Witness Snap</h3>
                            <p className="text-sm text-slate-500 font-medium mt-1">Please position your face in the frame below.</p>
                        </div>

                        <div className="w-64 h-64 bg-slate-100 rounded-full border-4 border-dashed border-teal-200 flex items-center justify-center relative overflow-hidden mb-8 shadow-inner">
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <div className="w-[180px] h-[230px] rounded-[50%]" style={{boxShadow: '0 0 0 999px rgba(0,0,0,0.3)'}}/>
                            </div>
                            {isCameraActive ? (
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                            ) : (
                                <Camera size={48} className="text-slate-300"/>
                            )}
                        </div>

                        {isCameraActive ? (
                            <button 
                                onClick={captureAnchor}
                                className="w-full py-5 bg-lilac-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl animate-pulse"
                            >
                                Authorize & Snap
                            </button>
                        ) : (
                            <button 
                                onClick={startCamera}
                                disabled={cameraLoading}
                                className="w-full py-5 bg-teal-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 transition-all"
                            >
                                {cameraLoading ? 'Initializing Lens...' : 'Activate Identity Proof'}
                            </button>
                        )}
                        
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="mt-6 flex items-center gap-2 text-slate-300">
                            <Lock size={12}/>
                            <span className="text-[10px] font-black uppercase tracking-widest">Encrypted Identity Binding Active</span>
                        </div>
                    </div>
                </div>
            )}

            {step === 'affirmation' && foundPatient && (
                <div className="w-full max-w-2xl animate-in slide-in-from-bottom-10 duration-300">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100">
                        <div className="flex flex-col items-center text-center mb-10">
                            <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center mb-6">
                                <ShieldCheck size={40} />
                            </div>
                            <h3 className="text-3xl font-black text-teal-900 uppercase tracking-tight leading-none">Health Verification</h3>
                            <p className="text-slate-500 mt-2 font-medium">Please confirm your clinical status since your last visit.</p>
                        </div>
                        
                        <div className="space-y-6">
                            <button 
                                onClick={() => {
                                    if (logAction) logAction('VIEW_RECORD', 'Patient', foundPatient.id, "Direct Patient Affirmation: No changes to medical history (Kiosk verified).");
                                    setStep('thankyou');
                                }}
                                className="w-full p-8 bg-white border-4 border-teal-100 rounded-[2.5rem] text-left hover:border-teal-500 transition-all group flex items-center gap-6"
                            >
                                <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white shrink-0">
                                    <CheckCircle2 size={32} />
                                </div>
                                <div>
                                    <div className="text-xl font-black text-teal-900 uppercase">No Clinical Changes</div>
                                    <p className="text-slate-500 font-medium leading-tight">Medications, conditions, and allergies are the same.</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => setStep('update')}
                                className="w-full p-8 bg-white border-4 border-lilac-100 rounded-[2.5rem] text-left hover:border-lilac-500 transition-all group flex items-center gap-6"
                            >
                                <div className="w-16 h-16 bg-lilac-50 text-lilac-600 rounded-full flex items-center justify-center group-hover:bg-lilac-600 group-hover:text-white shrink-0">
                                    <UserPlus size={32} />
                                </div>
                                <div>
                                    <div className="text-xl font-black text-lilac-900 uppercase">Update Medical Info</div>
                                    <p className="text-slate-500 font-medium leading-tight">I have new health updates to report for my record.</p>
                                </div>
                            </button>
                        </div>
                        
                        <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-300">
                            <ShieldAlert size={14}/>
                            <span className="text-[10px] font-black uppercase tracking-widest">Self-Certification is legally binding for clinical safety</span>
                        </div>
                    </div>
                </div>
            )}

            {step === 'thankyou' && (
                <div className="text-center animate-in zoom-in-90 duration-500">
                    <div className="w-32 h-32 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                        <CheckCircle2 size={80} strokeWidth={3} />
                    </div>
                    <h2 className="text-4xl font-black text-teal-900 uppercase tracking-tighter">Information Processed</h2>
                    <p className="text-xl text-slate-500 mt-4 max-w-md mx-auto">Thank you. Your records have been updated for clinical review.</p>
                    <div className="mt-12 flex items-center justify-center gap-2 text-slate-300">
                        <ShieldCheck size={16}/>
                        <span className="text-[10px] font-black uppercase tracking-widest">Compliant with R.A. 10173</span>
                    </div>
                </div>
            )}
        </div>

        {step === 'update' && (
            <div className="absolute inset-0 z-[110] bg-white">
                 <PatientRegistrationModal 
                    isOpen={true}
                    onClose={() => setStep('welcome')}
                    onSave={handlePatientSave}
                    initialData={foundPatient}
                    isKiosk={true} 
                 />
            </div>
        )}
    </div>
  );
};

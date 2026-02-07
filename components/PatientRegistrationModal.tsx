
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { X, Save, User, Shield, Lock, FileText, Heart, Activity, CheckCircle, Scale, AlertTriangle, Camera, ArrowLeft, RefreshCw } from 'lucide-react';
import { Patient, FieldSettings, DentalChartEntry, RegistrationStatus } from '../types';
import RegistrationBasicInfo from './RegistrationBasicInfo';
import RegistrationMedical from './RegistrationMedical';
import RegistrationDental from './RegistrationDental';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import { useToast } from './ToastSystem';
import { generateUid, formatDate } from '../constants';
import { validatePatient } from '../services/validationService';
import { useSettings } from '../contexts/SettingsContext';
import { usePatient } from '../contexts/PatientContext';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { ActionButton } from './ActionButton';
import { FormStatusIndicator } from './FormStatusIndicator';
import { Odontogram } from './Odontogram';
import CryptoJS from 'crypto-js';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Partial<Patient>) => Promise<void>;
  readOnly?: boolean;
  initialData?: Patient | null;
  isKiosk?: boolean; 
  currentBranch?: string;
}

const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({ 
  isOpen, onClose, onSave, readOnly = false, initialData = null, isKiosk = false, currentBranch 
}) => {
  const toast = useToast();
  const { fieldSettings } = useSettings();
  const { patients } = usePatient();
  
  const [isSaving, setIsSaving] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  
  // Camera & Signature State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [identitySnap, setIdentitySnap] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [hasInk, setHasInk] = useState(false);

  const initialFormState: Partial<Patient> = useMemo(() => ({
    id: '', firstName: '', surname: '', dob: '', phone: '', email: '', 
    dpaConsent: false, registrationStatus: RegistrationStatus.PROVISIONAL,
    dentalChart: [], registryAnswers: {}, allergies: [], medicalConditions: []
  }), []);

  const [formData, setFormData] = useState<Partial<Patient>>(initialFormState);
  const { formStatus, clearSavedDraft } = useFormPersistence<Partial<Patient>>(
    `patient-reg-${initialData?.id || 'new'}`, formData, setFormData, readOnly
  );

  useEffect(() => {
    if (initialData) {
        setFormData({ ...initialFormState, ...initialData });
    } else {
        setFormData({ ...initialFormState, id: generateUid('p'), registrationBranch: currentBranch });
    }
  }, [initialData, currentBranch, initialFormState]);

  const handleChange = useCallback((e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const handleRegistryChange = (newRegistryAnswers: Record<string, any>) => {
    setFormData(prev => ({ ...prev, registryAnswers: { ...prev.registryAnswers, ...newRegistryAnswers } }));
  };

  const handleArrayChange = (category: 'allergies' | 'medicalConditions', value: string) => {
    setFormData(prev => ({
        ...prev, 
        [category]: (prev[category] as string[] || []).includes(value) 
            ? (prev[category] as string[]).filter(item => item !== value) 
            : [...(prev[category] as string[] || []), value]
    }));
  };

  const handleChartUpdate = (entry: DentalChartEntry) => {
    setFormData(prev => {
        const existingChart = prev.dentalChart || [];
        const isNew = !existingChart.some(e => e.id === entry.id);
        return { 
            ...prev, 
            dentalChart: isNew ? [...existingChart, { ...entry, isBaseline: true }] : existingChart.map(e => e.id === entry.id ? entry : e) 
        };
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320, facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      toast.error("Camera access denied. ID snap is required for Strategic Sealing.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setIsCameraActive(false);
  };

  const captureSnap = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            canvas.width = 96;
            canvas.height = 96;
            ctx.filter = 'grayscale(100%)';
            ctx.drawImage(video, 0, 0, 96, 96);
            setIdentitySnap(canvas.toDataURL('image/jpeg', 0.5));
            stopCamera();
        }
    }
  };

  const handleFinalize = async () => {
    const errors = validatePatient(formData);
    if (errors) {
        Object.values(errors).forEach(e => toast.error(e));
        return;
    }
    
    if (!identitySnap) {
        toast.error("Identity Snap Required. Please position in camera frame.");
        return;
    }

    if (!hasInk) {
        toast.error("Signature Required. Please sign the intake form.");
        return;
    }

    setIsSaving(true);
    try {
        const signature = signatureCanvasRef.current?.toDataURL();
        const finalData = { 
            ...formData, 
            registrationSignature: signature, 
            identitySnap,
            registrationStatus: RegistrationStatus.COMPLETE,
            registrationSignatureTimestamp: new Date().toISOString()
        };
        await onSave(finalData);
        clearSavedDraft();
        onClose();
    } catch (error) {
        toast.error("Failed to save record.");
    } finally {
        setIsSaving(false);
    }
  };

  // Canvas Drawing Logic
  const startDrawing = (e: any) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx?.beginPath();
    ctx?.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    canvas.onpointermove = (moveEvent) => {
        ctx?.lineTo(moveEvent.clientX - rect.left, moveEvent.clientY - rect.top);
        ctx?.stroke();
        setHasInk(true);
    };
  };

  useEffect(() => {
    if (isOpen) {
        startCamera();
        setTimeout(() => {
            const canvas = signatureCanvasRef.current;
            if (canvas) {
                canvas.width = canvas.parentElement?.clientWidth || 400;
                canvas.height = 120;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                }
            }
        }, 100);
    }
    return () => stopCamera();
  }, [isOpen]);

  if (!isOpen || !fieldSettings) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
        <header className="p-8 bg-teal-900 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Clinical Intake Registry</h2>
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mt-1">Unified Record Sealing Protocol</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-slate-50 no-scrollbar space-y-12 pb-32">
          <RegistrationBasicInfo formData={formData} handleChange={handleChange} handleCustomChange={() => {}} fieldSettings={fieldSettings} patients={patients} />
          
          <div className="bg-white p-10 rounded-[3rem] border-2 border-teal-100 shadow-sm space-y-8">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><Heart className="text-red-500" /> Medical & Risk Registry</h3>
            <RegistrationMedical formData={formData} onCustomChange={() => {}} registryAnswers={formData.registryAnswers || {}} onRegistryChange={handleRegistryChange} allergies={formData.allergies || []} onAllergyChange={handleArrayChange} medicalConditions={formData.medicalConditions || []} onConditionChange={handleArrayChange} fieldSettings={fieldSettings} />
          </div>

          <div className="bg-white p-10 rounded-[3rem] border-2 border-teal-100 shadow-sm space-y-8">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><Activity className="text-teal-600" /> Dental Narrative & Baseline</h3>
            <RegistrationDental formData={formData} handleChange={handleChange} fieldSettings={fieldSettings} registryAnswers={formData.registryAnswers || {}} onRegistryChange={handleRegistryChange} />
            <div className="pt-8 border-t border-slate-100">
                <Odontogram chart={formData.dentalChart || []} onChartUpdate={handleChartUpdate} onToothClick={() => {}} />
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border-4 border-teal-50 shadow-xl space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Identity Seal</h3>
                    <div className="aspect-square bg-slate-900 rounded-3xl overflow-hidden relative shadow-inner border-4 border-white">
                        {identitySnap ? (
                            <img src={identitySnap} className="w-full h-full object-cover grayscale" />
                        ) : (
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale scale-x-[-1]" />
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2">
                            <Lock size={12} className="text-teal-400"/>
                            <span className="text-[10px] font-black text-white uppercase">96px Grayscale Anchor</span>
                        </div>
                    </div>
                    {!identitySnap ? (
                        <button onClick={captureSnap} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-teal-600/30">Snap Identity Anchor</button>
                    ) : (
                        <button onClick={() => { setIdentitySnap(null); startCamera(); }} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2"><RefreshCw size={14}/> Retake Snap</button>
                    )}
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Record Affirmation</h3>
                    <div className="space-y-4">
                        <label className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 cursor-pointer">
                            <input type="checkbox" name="dpaConsent" checked={!!formData.dpaConsent} onChange={handleChange} className="w-6 h-6 accent-teal-600 mt-1" />
                            <span className="text-sm font-bold text-slate-700">I certify the medical data is true and consent to DPA processing.</span>
                        </label>
                        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-black uppercase text-slate-400">Digital Signature Pad</span>
                                <button onClick={() => { const c = signatureCanvasRef.current; c?.getContext('2d')?.clearRect(0,0,c.width,c.height); setHasInk(false); }} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                            </div>
                            <canvas ref={signatureCanvasRef} onPointerDown={startDrawing} onPointerUp={() => { if(signatureCanvasRef.current) signatureCanvasRef.current.onpointermove = null; }} className="w-full bg-white rounded-xl border border-slate-200 touch-none cursor-crosshair" />
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        <footer className="p-8 border-t border-slate-200 bg-white/80 backdrop-blur-md shrink-0 flex justify-between items-center">
          <FormStatusIndicator status={formStatus} />
          <div className="flex gap-4">
            <button onClick={onClose} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest">Discard</button>
            <ActionButton isLoading={isSaving} onClick={handleFinalize} className="px-16">Finalize & Seal Record</ActionButton>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PatientRegistrationModal;

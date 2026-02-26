
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Patient, Appointment } from '../types';
import { X, HeartPulse, CheckCircle, Eraser, AlertTriangle } from 'lucide-react';
import { useToast } from './ToastSystem';
import RegistrationMedical from './RegistrationMedical';
import { useSettings } from '../contexts/SettingsContext';
import { usePatient } from '../contexts/PatientContext';

interface MedicalHistoryAffirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (affirmationData: {
    affirmedAt: string;
    noChanges: boolean;
    notes?: string;
    signature?: string;
  }) => void;
  patient: Patient;
  appointment: Appointment;
}

const MedicalHistoryAffirmationModal: React.FC<MedicalHistoryAffirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  patient,
  appointment,
}) => {
  const [step, setStep] = useState<'question' | 'details'>('question');
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const toast = useToast();
  const { fieldSettings } = useSettings();
  const { handleSavePatient } = usePatient();
  
  const [formData, setFormData] = useState<Partial<Patient>>(patient);

  useEffect(() => {
      setFormData(patient);
  }, [patient]);

  const daysSinceUpdate = patient.lastDigitalUpdate ? Math.floor(
    (Date.now() - new Date(patient.lastDigitalUpdate).getTime()) / (1000 * 60 * 60 * 24)
  ) : null;
  
    // --- START: Refactored Signature Logic ---
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef({ x: 0, y: 0 });
    
    const getCoords = (e: PointerEvent) => {
        const canvas = signatureCanvasRef.current;
        if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure };
    };

    const draw = useCallback((e: PointerEvent) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;
        const { x, y, pressure } = getCoords(e);
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const isPen = e.pointerType === 'pen';
            const effectivePressure = isPen ? (pressure || 0.7) : 0.5;
            const baseWidth = isPen ? 1.5 : 2.5;
            
            ctx.beginPath();
            ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
            ctx.lineTo(x, y);
            ctx.lineWidth = Math.max(1, Math.min(5, effectivePressure * baseWidth * 2));
            ctx.stroke();
            
            lastPosRef.current = { x, y };
        }
    }, []);

    const stopSign = useCallback(() => {
        isDrawingRef.current = false;
        window.removeEventListener('pointermove', draw);
        window.removeEventListener('pointerup', stopSign);
    }, [draw]);

    const startSign = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (e.pointerType === 'touch' && e.width > 10) return;
        e.preventDefault();
        isDrawingRef.current = true;
        const { x, y } = getCoords(e.nativeEvent);
        lastPosRef.current = { x, y };

        window.addEventListener('pointermove', draw);
        window.addEventListener('pointerup', stopSign);
    };
    // --- END: Refactored Signature Logic ---

  const setupCanvas = () => {
    const canvas = signatureCanvasRef.current;
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
  
  const clearCanvas = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => { const canvas = canvasRef.current; if(canvas){const ctx = canvas.getContext('2d'); if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);} };

  useEffect(() => {
    if (isOpen && step === 'details') {
        setTimeout(setupCanvas, 50);
    }
  }, [isOpen, step]);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => {
        const newData = { ...prev };
        if (type === 'checkbox') { 
            const checked = (e.target as HTMLInputElement).checked; 
            (newData as any)[name] = checked;
        } else { 
            (newData as any)[name] = value; 
        }
        return newData;
    });
  }, []);

  const handleCustomChange = useCallback((fieldName: string, value: any, type: 'text' | 'checklist' | 'boolean') => {
      setFormData(prev => {
          const newCustomFields = { ...(prev.customFields || {}) };
          if (type === 'checklist') {
              const currentValues = (newCustomFields[fieldName] as string[] || []);
              const isChecked = currentValues.includes(value);
              if (isChecked) {
                  newCustomFields[fieldName] = currentValues.filter(v => v !== value);
              } else {
                  newCustomFields[fieldName] = [...currentValues, value];
              }
          } else {
              newCustomFields[fieldName] = value;
          }
          return { ...prev, customFields: newCustomFields };
      });
  }, []);

  const handleRegistryChange = useCallback((newRegistryAnswers: Record<string, any>) => {
    setFormData(prev => ({ ...prev, registryAnswers: { ...prev.registryAnswers, ...newRegistryAnswers } }));
  }, []);

  const handleArrayChange = useCallback((category: 'allergies' | 'medicalConditions', value: string) => {
    setFormData(prev => ({...prev, [category]: (prev[category] as string[] || []).includes(value) ? (prev[category] as string[]).filter(item => item !== value) : [...(prev[category] as string[] || []), value]}));
  }, []);


  const handleNoChanges = () => {
    onClose();
    onConfirm({
      affirmedAt: new Date().toISOString(),
      noChanges: true,
    });
  };

  const handleHasChanges = () => {
    setStep('details');
  };
  
  const handleConfirmChanges = async () => {
      const canvas = signatureCanvasRef.current;
      if (!canvas) {
          toast.error("Please sign to confirm.");
          return;
      }
      const isCanvasBlank = !canvas.getContext('2d')?.getImageData(0,0,canvas.width, canvas.height).data.some(channel => channel !== 0);
      if(isCanvasBlank) {
        toast.error("A signature is required to confirm changes.");
        return;
      }
      const signature = canvas.toDataURL('image/png');
      
      // Save the updated patient data
      await handleSavePatient({
          ...formData,
          lastDigitalUpdate: new Date().toISOString()
      });

      onClose();
      onConfirm({
          affirmedAt: new Date().toISOString(),
          noChanges: false,
          notes: "Medical history updated via pre-treatment affirmation.",
          signature: signature,
      });
  };

  if (!isOpen || !fieldSettings) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
      <div className={`bg-white w-full ${step === 'details' ? 'max-w-5xl h-[90vh]' : 'max-w-lg'} rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 border-4 border-amber-200 overflow-hidden transition-all`}>
        <div className="p-6 border-b border-amber-100 bg-amber-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
              <HeartPulse size={28} className="text-amber-600" />
              <div>
                <h2 className="text-xl font-black text-amber-900 uppercase tracking-tight">Medical History Affirmation</h2>
                <p className="text-xs text-amber-700 font-bold uppercase">Mandatory Pre-Treatment Verification</p>
              </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-amber-200 rounded-full transition-colors"><X size={24} className="text-amber-950" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {daysSinceUpdate && daysSinceUpdate > 180 && (
              <div className="bg-red-50 border-2 border-red-500 p-4 rounded-lg mb-4 text-center">
                  <AlertTriangle className="text-red-700 mx-auto mb-2"/>
                  <p className="font-bold text-red-900">
                      WARNING: Medical history last updated {daysSinceUpdate} days ago.
                  </p>
                  <p className="text-sm text-red-700">
                      Philippine Dental Association recommends updating medical history every 6 months.
                  </p>
              </div>
          )}
          {step === 'question' ? (
            <div className="text-center space-y-8 animate-in fade-in">
              <p className="text-lg font-bold text-slate-700 leading-relaxed">
                Has anything changed regarding your health, medical conditions, or medications since your last visit?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={handleHasChanges} className="p-8 bg-red-50 border-2 border-red-200 rounded-2xl text-red-800 font-black uppercase text-lg hover:bg-red-100 transition-colors">Yes, there are changes</button>
                <button onClick={handleNoChanges} className="p-8 bg-teal-50 border-2 border-teal-200 rounded-2xl text-teal-800 font-black uppercase text-lg hover:bg-teal-100 transition-colors">No Changes</button>
              </div>
            </div>
          ) : (
             <div className="space-y-8 animate-in slide-in-from-right-4">
                <RegistrationMedical 
                    formData={formData} 
                    handleChange={handleChange} 
                    onCustomChange={(fieldName, value) => handleCustomChange(fieldName, value, 'text')} 
                    registryAnswers={formData.registryAnswers || {}} 
                    onRegistryChange={handleRegistryChange} 
                    allergies={formData.allergies || []} 
                    onAllergyChange={handleArrayChange} 
                    medicalConditions={formData.medicalConditions || []} 
                    onConditionChange={handleArrayChange} 
                    readOnly={false} 
                    fieldSettings={fieldSettings} 
                />
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <label className="font-black text-slate-700 uppercase tracking-widest text-sm">Patient/Guardian Signature *</label>
                        <button onClick={() => clearCanvas(signatureCanvasRef as React.RefObject<HTMLCanvasElement | null>)} className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1"><Eraser size={14}/> Clear</button>
                    </div>
                    <canvas ref={signatureCanvasRef} className="bg-white rounded-xl border-2 border-dashed border-slate-300 w-full touch-none cursor-crosshair shadow-inner" onPointerDown={startSign} />
                    <p className="text-xs text-slate-500 mt-3 font-bold uppercase text-center">I certify that the updated medical history above is true and correct to the best of my knowledge.</p>
                </div>
             </div>
          )}
        </div>

        {step === 'details' && (
            <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
                <button onClick={() => setStep('question')} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Back</button>
                <button onClick={handleConfirmChanges} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 flex items-center gap-2 hover:bg-teal-700 transition-colors">
                    <CheckCircle size={20}/> Confirm & Save Update
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default MedicalHistoryAffirmationModal;

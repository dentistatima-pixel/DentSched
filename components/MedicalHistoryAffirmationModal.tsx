import React, { useState, useRef, useEffect } from 'react';
import { Patient, Appointment } from '../types';
import { X, HeartPulse, CheckCircle, Eraser, AlertTriangle } from 'lucide-react';
import { useToast } from './ToastSystem';

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
  const [notes, setNotes] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const toast = useToast();

  const daysSinceUpdate = patient.lastDigitalUpdate ? Math.floor(
    (Date.now() - new Date(patient.lastDigitalUpdate).getTime()) / (1000 * 60 * 60 * 24)
  ) : null;

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
  
  useEffect(() => {
      if(isOpen) {
        setStep('question');
        setNotes('');
      }
      if(isOpen && step === 'details') {
          setTimeout(setupCanvas, 50);
      }
  }, [isOpen, step]);

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure };
  };

  const startSign = (e: React.PointerEvent<HTMLCanvasElement>) => { 
    if (e.pointerType === 'touch' && e.width > 10) return;
    e.preventDefault(); 
    setIsSigning(true); 
    const { x, y } = getCoords(e); 
    const ctx = e.currentTarget.getContext('2d'); 
    ctx?.beginPath(); 
    ctx?.moveTo(x, y); 
  };
  const stopSign = (e: React.PointerEvent<HTMLCanvasElement>) => { e.preventDefault(); setIsSigning(false); };
  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => { 
    if (!isSigning) return; 
    e.preventDefault(); 
    const { x, y, pressure } = getCoords(e); 
    const ctx = e.currentTarget.getContext('2d'); 
    if(ctx){ 
        const isPen = e.pointerType === 'pen';
        const effectivePressure = isPen ? (pressure || 0.7) : 0.5;
        const baseWidth = isPen ? 1.5 : 2.5;
        ctx.lineWidth = Math.max(1, Math.min(5, effectivePressure * baseWidth * 2));
        ctx.lineTo(x, y); 
        ctx.stroke(); 
    } 
  };
  const clearCanvas = () => { const canvas = signatureCanvasRef.current; if(canvas){const ctx = canvas.getContext('2d'); if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);} };

  const handleNoChanges = () => {
    onConfirm({
      affirmedAt: new Date().toISOString(),
      noChanges: true,
    });
  };

  const handleHasChanges = () => {
    setStep('details');
  };
  
  const handleConfirmChanges = () => {
      const canvas = signatureCanvasRef.current;
      if (!notes.trim() || !canvas) {
          toast.error("Please provide notes on the changes and sign to confirm.");
          return;
      }
      const isCanvasBlank = !canvas.getContext('2d')?.getImageData(0,0,canvas.width, canvas.height).data.some(channel => channel !== 0);
      if(isCanvasBlank) {
        toast.error("A signature is required to confirm changes.");
        return;
      }
      const signature = canvas.toDataURL('image/png');
      
      onConfirm({
          affirmedAt: new Date().toISOString(),
          noChanges: false,
          notes: notes,
          signature: signature,
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border-4 border-amber-200">
        <div className="p-6 border-b border-amber-100 bg-amber-50 flex items-center gap-4">
          <HeartPulse size={28} className="text-amber-600" />
          <div>
            <h2 className="text-xl font-black text-amber-900 uppercase tracking-tight">Medical History Affirmation</h2>
            <p className="text-xs text-amber-700 font-bold uppercase">Mandatory Pre-Treatment Verification</p>
          </div>
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
             <div className="space-y-6 animate-in slide-in-from-right-4">
                <div>
                    <label className="label">Please describe the changes *</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input h-24" placeholder="e.g., New medication for blood pressure, diagnosed with..." />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="label">Patient/Guardian Signature *</label>
                        <button onClick={clearCanvas} className="text-xs font-bold text-slate-400 hover:text-red-500"><Eraser size={12}/> Clear</button>
                    </div>
                    <canvas ref={signatureCanvasRef} className="bg-white rounded-lg border-2 border-dashed border-slate-300 w-full touch-none cursor-crosshair" onPointerDown={startSign} onPointerUp={stopSign} onPointerLeave={stopSign} onPointerMove={draw}/>
                    <p className="text-xs text-slate-400 mt-2 font-bold uppercase">This signature applies ONLY to the information shown.</p>
                </div>
             </div>
          )}
        </div>

        {step === 'details' && (
            <div className="p-4 border-t bg-white flex justify-end gap-3 shrink-0">
                <button onClick={() => setStep('question')} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Back</button>
                <button onClick={handleConfirmChanges} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 flex items-center gap-2">
                    <CheckCircle size={20}/> Confirm & Save Update
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default MedicalHistoryAffirmationModal;
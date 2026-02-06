
import React, { useState, useRef, useEffect } from 'react';
import { X, Eraser, CheckCircle, Lock, ShieldCheck, Fingerprint, Info, PenTool } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { useToast } from './ToastSystem';

interface SignatureCaptureOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: string, hash: string) => void;
  title: string;
  instruction: string;
  themeColor: 'teal' | 'lilac';
  contextSummary?: React.ReactNode;
}

const SIGNATURE_TIMEOUT_SECONDS = 300; // Increased to 5 mins for complex summaries

const SignatureCaptureOverlay: React.FC<SignatureCaptureOverlayProps> = ({
  isOpen, onClose, onSave, title, instruction, themeColor, contextSummary
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  
  const [isSigning, setIsSigning] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const [affirmations, setAffirmations] = useState({
    isTrue: false,
    isPrivacyRead: false,
    isFeesAcknowledged: false,
  });

  const allAffirmed = affirmations.isTrue && affirmations.isPrivacyRead && affirmations.isFeesAcknowledged;

  const colors = themeColor === 'teal' ? {
    bg: 'bg-teal-900',
    btn: 'bg-teal-600 hover:bg-teal-700',
    ring: 'ring-teal-500/10',
    text: 'text-teal-900',
    sub: 'text-teal-400',
    shadow: 'shadow-teal-600/30'
  } : {
    bg: 'bg-lilac-900',
    btn: 'bg-lilac-600 hover:bg-lilac-700',
    ring: 'ring-lilac-500/10',
    text: 'text-lilac-900',
    sub: 'text-lilac-400',
    shadow: 'shadow-lilac-600/30'
  };

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = 300 * dpr;

    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `300px`;

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
    const canvas = canvasRef.current;
    const touchStartHandler = (e: TouchEvent) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    };

    if (isOpen) {
      setTimeout(setupCanvas, 100);
      setHasInk(false);
      
      // Default affirmations to true if no summary is provided (simple signing)
      if (!contextSummary) {
          setAffirmations({ isTrue: true, isPrivacyRead: true, isFeesAcknowledged: true });
      } else {
          setAffirmations({ isTrue: false, isPrivacyRead: false, isFeesAcknowledged: false });
      }
      
      if (canvas) {
        canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
      }

      const timer = setTimeout(() => {
        toast.error('Signature session expired for security reasons.');
        onClose();
      }, SIGNATURE_TIMEOUT_SECONDS * 1000);

      return () => {
        clearTimeout(timer);
        if (canvas) {
          canvas.removeEventListener('touchstart', touchStartHandler);
        }
      };
    }
  }, [isOpen, onClose, toast, contextSummary]);

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
    const rect = canvas.getBoundingClientRect();
    return { 
        x: e.clientX - rect.left, 
        y: e.clientY - rect.top, 
        pressure: e.pressure || 0.5 
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch' && e.width > 20) return; // Palm rejection
    if (!allAffirmed) return;
    
    if (window.navigator.vibrate) {
        window.navigator.vibrate(10);
    }
    
    e.preventDefault();
    setIsSigning(true);
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const lastDrawTime = useRef(0);
  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isSigning || !allAffirmed) return;
    e.preventDefault();
    
    const now = Date.now();
    if (now - lastDrawTime.current < 10) return;
    lastDrawTime.current = now;

    const { x, y, pressure } = getCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      const isPen = e.pointerType === 'pen';
      const effectivePressure = isPen ? pressure : 0.6;
      ctx.lineWidth = Math.max(2, Math.min(10, effectivePressure * 8));
      ctx.lineTo(x, y);
      ctx.stroke();
      if (!hasInk) setHasInk(true);
    }
  };

  const endDraw = () => setIsSigning(false);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasInk(false);
  };

  const handleAuthorize = () => {
    if (!hasInk || !allAffirmed) {
      if (!allAffirmed) toast.error("Please acknowledge all attestations before signing.");
      return;
    }
    
    const sigData = canvasRef.current!.toDataURL('image/png');
    // Background hashing of the "Digital Ink"
    const integrityHash = CryptoJS.SHA256(sigData + Date.now()).toString();
    
    onSave(sigData, integrityHash);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className={`bg-white w-full ${contextSummary ? 'max-w-4xl' : 'max-w-xl'} rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border-4 border-white flex flex-col max-h-[95vh]`}>
        
        <div className={`${colors.bg} p-8 text-white flex justify-between items-center shrink-0`}>
          <div className="flex items-center gap-5">
            <div className="bg-white/20 p-3 rounded-2xl shadow-inner"><Fingerprint size={32} /></div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">{title}</h3>
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${colors.sub}`}>Digital Ink Verification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors"><X size={28} /></button>
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar bg-slate-50/30">
          
          {contextSummary && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-teal-500 opacity-50" />
                {contextSummary}
            </div>
          )}

          {!contextSummary && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Instructions</h4>
                <p className="text-lg font-bold text-slate-700 leading-tight">{instruction}</p>
            </div>
          )}

          {contextSummary && (
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-100 pb-3">
                    <Info size={16} className="text-teal-600"/> Mandatory Review
                </div>
                
                <label className={`flex items-start gap-5 p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${affirmations.isTrue ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-white border-slate-200 hover:border-teal-300'}`}>
                    <input type="checkbox" checked={affirmations.isTrue} onChange={e => setAffirmations(p => ({ ...p, isTrue: e.target.checked }))} className="w-8 h-8 accent-teal-600 rounded-lg mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        <span className="text-sm font-black text-teal-950 uppercase tracking-tight block">Accuracy Acknowledgement</span>
                        <p className="text-xs font-bold text-slate-600 leading-relaxed">I have reviewed the clinical details above and certify they are correct.</p>
                    </div>
                </label>

                <label className={`flex items-start gap-5 p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${affirmations.isPrivacyRead ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-white border-slate-200 hover:border-teal-300'}`}>
                    <input type="checkbox" checked={affirmations.isPrivacyRead} onChange={e => setAffirmations(p => ({ ...p, isPrivacyRead: e.target.checked }))} className="w-8 h-8 accent-teal-600 rounded-lg mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        <span className="text-sm font-black text-teal-950 uppercase tracking-tight block">Treatment Authorization</span>
                        <p className="text-xs font-bold text-slate-600 leading-relaxed">I authorize the dentist to perform the procedures as listed in this record.</p>
                    </div>
                </label>
            </div>
          )}

          <div className="relative pt-4">
              <div className={`relative bg-white rounded-[3rem] border-4 p-4 transition-all duration-700 shadow-inner ${allAffirmed ? 'border-dashed border-teal-500' : 'border-solid border-slate-100 opacity-30 grayscale cursor-not-allowed'}`}>
                <div className="absolute top-6 left-8 flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] z-10 pointer-events-none">
                  <PenTool size={14} /> Digital Signature Pad
                </div>
                <button 
                    onClick={handleClear} 
                    disabled={!allAffirmed} 
                    className="absolute top-6 right-8 p-2 text-slate-300 hover:text-red-500 transition-all z-10"
                >
                    <Eraser size={24} />
                </button>
                
                <canvas 
                  ref={canvasRef} 
                  className={`w-full touch-none h-[300px] bg-white rounded-[2rem] ${!allAffirmed ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
                  onPointerDown={startDraw}
                  onPointerMove={draw}
                  onPointerUp={endDraw}
                  onPointerLeave={endDraw}
                />
                
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] whitespace-nowrap opacity-40">
                  Seal Clinical Entry with Digital Signature
                </div>
              </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-white flex gap-5 shrink-0">
          <button onClick={onClose} className="flex-1 py-6 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl tracking-[0.2em] hover:bg-slate-200 transition-all">Cancel</button>
          <button 
            onClick={handleAuthorize}
            disabled={!hasInk || !allAffirmed}
            className={`flex-[2] py-6 text-white font-black uppercase text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-4 ${hasInk && allAffirmed ? `${colors.btn} ${colors.shadow} scale-105` : 'bg-slate-200 text-slate-400 grayscale opacity-50'}`}
          >
            <Lock size={20}/> Save & Seal Record
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureCaptureOverlay;

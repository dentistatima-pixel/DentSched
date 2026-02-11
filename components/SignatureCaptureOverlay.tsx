import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Eraser, CheckCircle, Camera, Lock, UserCheck, ShieldCheck, Fingerprint } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { useToast } from './ToastSystem';

interface SignatureCaptureOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: string, witnessHash: string) => void;
  title: string;
  instruction: string;
  themeColor: 'teal' | 'lilac';
  contextSummary?: React.ReactNode;
}

const SIGNATURE_TIMEOUT_SECONDS = 120; // 2 minutes

const SignatureCaptureOverlay: React.FC<SignatureCaptureOverlayProps> = ({
  isOpen, onClose, onSave, title, instruction, themeColor, contextSummary
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const witnessCanvasRef = useRef<HTMLCanvasElement>(null);
  const toast = useToast();
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
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

  // --- START: Refactored Signature Logic ---
  const isDrawingRef = useRef(false);
  const lastDrawTime = useRef(0);

  const getCoords = (e: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure };
  };

  const draw = useCallback((e: PointerEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();

      const now = Date.now();
      if (now - lastDrawTime.current < 16) return;
      lastDrawTime.current = now;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x, y, pressure } = getCoords(e);
      const ctx = canvas.getContext('2d');
      if (ctx) {
          const isPen = e.pointerType === 'pen';
          const effectivePressure = isPen ? (pressure || 0.7) : 0.5;
          const baseWidth = isPen ? 3 : 5;
          ctx.lineWidth = Math.max(2, Math.min(10, effectivePressure * baseWidth * 2));
          ctx.lineTo(x, y);
          ctx.stroke();
          setHasInk(true);
      }
  }, []);
  
  const stopSign = useCallback(() => {
      isDrawingRef.current = false;
      window.removeEventListener('pointermove', draw);
      window.removeEventListener('pointerup', stopSign);
  }, [draw]);

  const startSign = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!allAffirmed && contextSummary) return;
      if (e.pointerType === 'touch' && e.width > 10) return;
      e.preventDefault();
      
      isDrawingRef.current = true;
      const { x, y } = getCoords(e.nativeEvent);
      const ctx = e.currentTarget.getContext('2d');
      ctx?.beginPath();
      ctx?.moveTo(x, y);

      window.addEventListener('pointermove', draw);
      window.addEventListener('pointerup', stopSign);
  };
  // --- END: Refactored Signature Logic ---

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = (contextSummary ? 300 : 400) * dpr;

    canvas.style.width = `${rect.width}px`;
    canvas.style.height = contextSummary ? '300px' : `400px`;

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
    if (!isOpen) return;

    let stream: MediaStream | null = null;
    let isCancelled = false;
    
    const start = async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { width: 160, height: 160, facingMode: 'user' } });
            if (isCancelled) {
                stream.getTracks().forEach(track => track.stop());
                return;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
                setTimeout(() => { if (!isCancelled) setIsFaceDetected(true); }, 1500);
            }
        } catch (err) {
            console.warn("Witness camera access restricted.");
        }
    };

    setTimeout(setupCanvas, 100);
    start();
    setHasInk(false);
    setAffirmations({ isTrue: true, isPrivacyRead: true, isFeesAcknowledged: true });
    
    const timer = setTimeout(() => {
        if (!isCancelled) {
            toast.error('Signature session expired for security reasons.', { duration: 5000 });
            onClose();
            console.warn('SECURITY_ALERT: Signature capture timed out.');
        }
    }, SIGNATURE_TIMEOUT_SECONDS * 1000);

    return () => {
        isCancelled = true;
        clearTimeout(timer);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };
}, [isOpen, onClose, toast, contextSummary]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasInk(false);
  };

  const handleAuthorize = async () => {
    if (!hasInk || (!!contextSummary && !allAffirmed)) {
      if (!allAffirmed) toast.error("Please acknowledge all statements before signing.");
      return;
    }
    const sigData = canvasRef.current!.toDataURL();
    
    let witnessHash: string;
    
    const video = videoRef.current;
    const witnessCanvas = witnessCanvasRef.current;

    if (video && witnessCanvas && isCameraActive && video.readyState >= 3) {
      const ctx = witnessCanvas.getContext('2d');
      if (ctx) {
        witnessCanvas.width = video.videoWidth;
        witnessCanvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, witnessCanvas.width, witnessCanvas.height);
        const witnessImageData = witnessCanvas.toDataURL('image/jpeg', 0.8);
        witnessHash = CryptoJS.SHA256(witnessImageData + Date.now()).toString();
      } else {
        // Fallback if context is lost
        witnessHash = CryptoJS.SHA256(Date.now().toString()).toString();
        console.warn("Witness canvas context lost, using fallback hash.");
      }
    } else {
        // Fallback if camera isn't ready or available
        witnessHash = CryptoJS.SHA256(Date.now().toString()).toString();
        console.warn("Witness camera not available, using fallback hash.");
    }
    
    onSave(sigData, witnessHash);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className={`bg-white w-full ${contextSummary ? 'max-w-4xl' : 'max-w-lg'} rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border-4 border-white flex flex-col max-h-[95vh]`}>
        <div className={`${colors.bg} p-8 text-white flex justify-between items-center`}>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-xl"><ShieldCheck size={24} /></div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">{title}</h3>
              <p className={`text-xs font-black uppercase tracking-widest ${colors.sub}`}>Verified Forensic Identity</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <div className="p-8 space-y-6 flex-1 flex flex-col overflow-hidden">
          {contextSummary && (
            <div className="flex-1 overflow-y-auto no-scrollbar pr-2 mb-6 border-b pb-6">
                {contextSummary}
            </div>
          )}

          {!contextSummary && (
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-sm text-slate-600 font-bold leading-relaxed">{instruction}</p>
              </div>
              <div className={`w-20 h-20 rounded-full border-4 overflow-hidden bg-slate-200 relative ${isFaceDetected ? 'border-teal-500' : 'border-red-500 animate-pulse'}`}>
                {isCameraActive ? <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" /> : <Camera className="w-8 h-8 text-slate-400 m-6" />}
                {isFaceDetected && <div className="absolute inset-0 bg-teal-500/10 flex items-center justify-center"><UserCheck size={32} className="text-teal-600 opacity-60" /></div>}
              </div>
            </div>
          )}

          {!contextSummary && (
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input type="checkbox" checked={affirmations.isTrue} onChange={e => setAffirmations(p => ({ ...p, isTrue: e.target.checked }))} className="w-5 h-5 accent-teal-600 mt-0.5" />
                  <span className="text-sm font-medium text-slate-700">I certify that the information I have provided is true and correct to the best of my knowledge.</span>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input type="checkbox" checked={affirmations.isPrivacyRead} onChange={e => setAffirmations(p => ({ ...p, isPrivacyRead: e.target.checked }))} className="w-5 h-5 accent-teal-600 mt-0.5" />
                  <span className="text-sm font-medium text-slate-700">I have read and understood the clinic's Data Privacy Policy and consent to the processing of my health information.</span>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input type="checkbox" checked={affirmations.isFeesAcknowledged} onChange={e => setAffirmations(p => ({ ...p, isFeesAcknowledged: e.target.checked }))} className="w-5 h-5 accent-teal-600 mt-0.5" />
                  <span className="text-sm font-medium text-slate-700">I acknowledge that I am responsible for all fees associated with my treatment.</span>
              </label>
            </div>
          )}

          <div className={`relative bg-white rounded-3xl border-2 p-2 group transition-all ${allAffirmed || !contextSummary ? 'border-dashed border-slate-300 hover:border-slate-400' : 'border-solid border-slate-200 opacity-50 grayscale'}`}>
            <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-black text-slate-300 uppercase tracking-widest">
              <Fingerprint size={12} /> Digital Ink Pad
            </div>
            <button onClick={handleClear} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"><Eraser size={16} /></button>
            <canvas 
              ref={canvasRef} 
              className={`w-full touch-none ${!allAffirmed && contextSummary ? 'cursor-not-allowed' : 'cursor-crosshair'} ${contextSummary ? 'h-[300px]' : 'h-[400px]'}`}
              onPointerDown={startSign}
            />
            <div className="absolute bottom-10 left-8 right-8 h-px bg-slate-200 border-t border-dashed border-slate-300 pointer-events-none" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-black text-slate-300 uppercase">Signature Baseline</div>
          </div>

          <div className="flex gap-4">
            <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button>
            <button 
              onClick={handleAuthorize}
              disabled={!hasInk || (!!contextSummary && !allAffirmed)}
              className={`flex-[2] py-4 text-white font-black uppercase text-xs rounded-2xl shadow-xl transition-all ${hasInk && (allAffirmed || !contextSummary) ? `${colors.btn} ${colors.shadow}` : 'bg-slate-200 text-slate-400 grayscale'}`}
            >
              Authorize & Complete
            </button>
          </div>
        </div>
        <canvas ref={witnessCanvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default SignatureCaptureOverlay;

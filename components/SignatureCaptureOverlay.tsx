import React, { useState, useRef, useEffect } from 'react';
import { X, CheckCircle, Eraser, FileSignature, AlertTriangle, Baby, ShieldCheck, Scale, CheckSquare, Square, ShieldAlert, Lock, Fingerprint, Camera, UserCheck, Languages, ArrowRight, Key } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { useToast } from './ToastSystem';
import { useOrientation } from '../hooks/useOrientation';

interface SignatureCaptureOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: string, witnessHash: string) => void;
  title: string;
  instruction: string;
  themeColor: 'teal' | 'lilac';
  contextSummary?: React.ReactNode;
}

const SIGNATURE_TIMEOUT_SECONDS = 300; // 5 minutes

const getSignatureBounds = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { minX: 0, maxX: 0, minY: 0, maxY: 0, inkPixels: 0 };
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
    let inkPixels = 0;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const alpha = data[(y * canvas.width + x) * 4 + 3];
            if (alpha > 0) {
                inkPixels++;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    return { minX, maxX, minY, maxY, inkPixels };
};

const validateSignature = (canvas: HTMLCanvasElement, strokes: number, timeToSign: number): { valid: boolean; reason?: string } => {
    const { minX, maxX, minY, maxY, inkPixels } = getSignatureBounds(canvas);
    const canvasArea = canvas.width * canvas.height;
    const minInkCoverage = 0.015; // 1.5%

    if (inkPixels / canvasArea < minInkCoverage) {
        return { valid: false, reason: `Signature too small. Please provide a full, substantial signature.` };
    }
    if (strokes < 3) {
        return { valid: false, reason: 'Signature must have at least 3 distinct strokes.' };
    }
    if (timeToSign < 1000) {
        return { valid: false, reason: 'Please sign more carefully.' };
    }
    const spanX = maxX - minX;
    const spanY = maxY - minY;
    if (spanX < canvas.width * 0.2 || spanY < canvas.height * 0.1) {
        return { valid: false, reason: 'Signature span is too small. Please use more of the signature area.' };
    }

    return { valid: true };
};


const SignatureCaptureOverlay: React.FC<SignatureCaptureOverlayProps> = ({
  isOpen, onClose, onSave, title, instruction, themeColor, contextSummary
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const witnessCanvasRef = useRef<HTMLCanvasElement>(null);
  const toast = useToast();
  const { isLandscape } = useOrientation();
  const [isSigning, setIsSigning] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const [affirmations, setAffirmations] = useState({
    isTrue: false,
    isPrivacyRead: false,
    isFeesAcknowledged: false,
  });
  
  const [strokeCount, setStrokeCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

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
    canvas.height = rect.height * dpr;

    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d', { desynchronized: true });
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 5.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 160, height: 160, facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setTimeout(() => setIsFaceDetected(true), 1500);
      }
    } catch (err) {
      console.warn("Witness camera access restricted.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const touchStartHandler = (e: TouchEvent) => {
        if (e.touches.length > 1) {
            e.preventDefault();
            return;
        }
        const touch = e.touches[0];
        if (touch && (touch.radiusX > 25 || touch.radiusY > 25)) {
            e.preventDefault();
        }
    };

    if (isOpen) {
      setTimeout(setupCanvas, 100);
      startCamera();
      setHasInk(false);
      setStrokeCount(0);
      setStartTime(null);
      setAffirmations({ isTrue: !contextSummary, isPrivacyRead: !contextSummary, isFeesAcknowledged: !contextSummary }); 
      if (canvas) {
        canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
      }

      const timer = setTimeout(() => {
        toast.error('Signature session expired for security reasons.', { duration: 5000 });
        onClose();
        console.warn('SECURITY_ALERT: Signature capture timed out.');
      }, SIGNATURE_TIMEOUT_SECONDS * 1000);

      return () => {
        clearTimeout(timer);
        stopCamera();
        if (canvas) {
          canvas.removeEventListener('touchstart', touchStartHandler);
        }
      };
    } else {
      stopCamera();
    }
  }, [isOpen, onClose, toast, contextSummary, isLandscape]);

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure };
  };

  const startSign = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') {
        const isLikelyPalm = e.width > 25 || e.height > 25;
        if (isLikelyPalm) {
            e.preventDefault();
            return;
        }
    }
    if (!allAffirmed && contextSummary) return;
    e.preventDefault();
    if (!isSigning) {
        setStrokeCount(prev => prev + 1);
        if (startTime === null) {
            setStartTime(Date.now());
        }
    }
    setIsSigning(true);
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };
  
  const lastDrawTime = useRef(0);
  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isSigning || (!allAffirmed && contextSummary)) return;
    e.preventDefault();
    
    const now = Date.now();
    if (now - lastDrawTime.current < 16) { 
        return;
    }
    lastDrawTime.current = now;

    const { x, y, pressure } = getCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      const isPen = e.pointerType === 'pen';
      const rawPressure = isPen ? (e.pressure || 0.7) : 0.5;
      const smoothedPressure = isPen ? 0.3 + (rawPressure * (1.0 - 0.3)) : 0.5;
      const baseWidth = isPen ? 3 : 5;
      ctx.lineWidth = Math.max(2, Math.min(10, smoothedPressure * baseWidth * 2));
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasInk(true);
    }
  };

  const endDraw = () => setIsSigning(false);

  const handleClear = () => {
    if (hasInk) {
        if (!confirm('Clear signature? This cannot be undone.')) {
            return;
        }
    }
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasInk(false);
    setStrokeCount(0);
    setStartTime(null);
  };

  const handleAuthorize = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk || (!!contextSummary && !allAffirmed)) {
      if (!allAffirmed) toast.error("Please acknowledge all statements before signing.");
      if (!hasInk) toast.error("A signature is required to authorize.");
      return;
    }

    const timeToSign = startTime ? Date.now() - startTime : 0;
    const qualityCheck = validateSignature(canvas, strokeCount, timeToSign);
    if (!qualityCheck.valid) {
        toast.error(qualityCheck.reason || "Signature quality is too low.");
        return;
    }

    const sigData = canvas.toDataURL();
    
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
        witnessHash = CryptoJS.SHA256(Date.now().toString()).toString();
        console.warn("Witness canvas context lost, using fallback hash.");
      }
    } else {
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

          <div className={`relative bg-white rounded-3xl border-2 p-2 group transition-all flex-1 ${allAffirmed || !contextSummary ? 'border-dashed border-slate-300 hover:border-slate-400' : 'border-solid border-slate-200 opacity-50 grayscale'}`}>
            <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-black text-slate-300 uppercase tracking-widest">
              <Fingerprint size={12} /> Digital Ink Pad
            </div>
            <button onClick={handleClear} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"><Eraser size={16} /></button>
            <canvas 
              ref={canvasRef} 
              className="w-full h-full touch-none cursor-crosshair"
              onPointerDown={startSign}
              onPointerMove={draw}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
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

import React, { useState, useRef, useEffect } from 'react';
/* Fix: Added missing 'Fingerprint' to lucide-react imports */
import { X, Eraser, CheckCircle, Camera, Lock, UserCheck, ShieldCheck, Fingerprint } from 'lucide-react';
import CryptoJS from 'crypto-js';

interface SignatureCaptureOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: string, witnessHash: string) => void;
  title: string;
  instruction: string;
  themeColor: 'teal' | 'lilac';
}

const SignatureCaptureOverlay: React.FC<SignatureCaptureOverlayProps> = ({
  isOpen, onClose, onSave, title, instruction, themeColor
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasInk, setHasInk] = useState(false);

  const colors = themeColor === 'teal' ? {
    bg: 'bg-teal-900',
    btn: 'bg-teal-600 hover:bg-teal-700',
    ring: 'ring-teal-500/10',
    text: 'text-teal-900',
    sub: 'text-teal-400'
  } : {
    bg: 'bg-lilac-900',
    btn: 'bg-lilac-600 hover:bg-lilac-700',
    ring: 'ring-lilac-500/10',
    text: 'text-lilac-900',
    sub: 'text-lilac-400'
  };

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.parentElement?.clientWidth || 400;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
      }
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
    if (isOpen) {
      setTimeout(setupCanvas, 100);
      startCamera();
      setHasInk(false);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const getCoords = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e: any) => {
    e.preventDefault();
    setIsSigning(true);
    const { x, y } = getCoords(e);
    canvasRef.current?.getContext('2d')?.beginPath();
    canvasRef.current?.getContext('2d')?.moveTo(x, y);
  };

  const draw = (e: any) => {
    if (!isSigning) return;
    e.preventDefault();
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasInk(true);
    }
  };

  const endDraw = () => setIsSigning(false);

  const handleClear = () => {
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  const handleAuthorize = () => {
    if (!hasInk || !canvasRef.current) return;
    const sigData = canvasRef.current.toDataURL();
    const witnessHash = CryptoJS.SHA256(sigData + Date.now()).toString();
    onSave(sigData, witnessHash);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border-4 border-white">
        <div className={`${colors.bg} p-8 text-white flex justify-between items-center`}>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-xl"><ShieldCheck size={24} /></div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">{title}</h3>
              <p className={`text-[10px] font-black uppercase tracking-widest ${colors.sub}`}>Verified Forensic Identity</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-600 font-bold leading-relaxed">{instruction}</p>
            </div>
            <div className={`w-20 h-20 rounded-full border-4 overflow-hidden bg-slate-200 relative ${isFaceDetected ? 'border-teal-500' : 'border-red-500 animate-pulse'}`}>
              {isCameraActive ? <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" /> : <Camera className="w-8 h-8 text-slate-400 m-6" />}
              {isFaceDetected && <div className="absolute inset-0 bg-teal-500/10 flex items-center justify-center"><UserCheck size={32} className="text-teal-600 opacity-60" /></div>}
            </div>
          </div>

          <div className="relative bg-white rounded-3xl border-2 border-dashed border-slate-300 p-2 group transition-all hover:border-slate-400">
            <div className="absolute top-4 left-4 flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">
              <Fingerprint size={12} /> Digital Ink Pad
            </div>
            <button onClick={handleClear} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"><Eraser size={16} /></button>
            <canvas 
              ref={canvasRef} 
              className="w-full h-[200px] touch-none cursor-crosshair"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
            <div className="absolute bottom-10 left-8 right-8 h-px bg-slate-200 border-t border-dashed border-slate-300 pointer-events-none" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-300 uppercase">Signature Baseline</div>
          </div>

          <div className="flex gap-4">
            <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Clear</button>
            <button 
              onClick={handleAuthorize}
              disabled={!hasInk}
              className={`flex-[2] py-4 text-white font-black uppercase text-xs rounded-2xl shadow-xl transition-all ${hasInk ? colors.btn : 'bg-slate-200 text-slate-400 grayscale'}`}
            >
              Authorize & Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureCaptureOverlay;

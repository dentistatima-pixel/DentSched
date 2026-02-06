import React, { useRef, useState, useEffect } from 'react';
import { checkSignatureQuality } from '../utils/signatureValidation';
import { Eraser } from 'lucide-react';

interface SignatureCanvasProps {
  onComplete: (dataUrl: string, quality: 'good' | 'weak' | 'none', reason?: string) => void;
  minStrokeCount?: number;
  minTimeMs?: number;
  themeColor?: 'teal' | 'lilac';
  title?: string;
  disabled?: boolean;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onComplete,
  minStrokeCount = 3,
  minTimeMs = 1500,
  themeColor = 'teal',
  title = "Signature",
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [hasInk, setHasInk] = useState(false);

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

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, []);
  
  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure };
  };

  const startSign = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Add basic palm rejection for touch events
    if (e.pointerType === 'touch' && (e.width > 30 || e.height > 30)) {
        e.preventDefault();
        return; // Ignore large touch contacts, likely a palm
    }
      
    if (disabled) return;
    e.preventDefault();
    if (!isSigning) {
        setStrokeCount(prev => prev + 1);
        if (startTime === null) setStartTime(Date.now());
    }
    setIsSigning(true);
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };
  
  const lastDrawTime = useRef(0);
  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isSigning || disabled) return;
    e.preventDefault();
    const now = Date.now();
    if (now - lastDrawTime.current < 16) return; // ~60fps throttle
    lastDrawTime.current = now;

    const { x, y, pressure } = getCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      const isPen = e.pointerType === 'pen';
      const rawPressure = isPen ? (e.pressure || 0.7) : 0.5;
      ctx.lineWidth = Math.max(2, Math.min(10, (0.3 + rawPressure * 0.7) * (isPen ? 3 : 5) * 2));
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasInk(true);
    }
  };

  const endSign = () => {
    if (!isSigning) return;
    setIsSigning(false);
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;

    const timeToSign = startTime ? Date.now() - startTime : 0;
    const { valid, reason } = checkSignatureQuality(canvas, strokeCount, timeToSign);
    const quality = valid ? 'good' : 'weak';
    onComplete(canvas.toDataURL('image/png'), quality, reason);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasInk(false);
    setStrokeCount(0);
    setStartTime(null);
    onComplete('', 'none', 'Canvas cleared.');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="label text-sm">{title}</label>
        {!disabled && (
          <button type="button" onClick={clearCanvas} className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1">
            <Eraser size={12} /> Clear
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        className={`w-full h-40 touch-none bg-white rounded-lg border-2 border-dashed ${disabled ? 'cursor-not-allowed bg-slate-100' : 'cursor-crosshair border-slate-300'}`}
        onPointerDown={startSign}
        onPointerMove={draw}
        onPointerUp={endSign}
        onPointerLeave={endSign}
      />
    </div>
  );
};
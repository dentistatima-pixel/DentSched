
import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, CheckCircle, X, ClipboardList, AlertTriangle, Camera, Eraser } from 'lucide-react';
import { Appointment } from '../types';
import { useToast } from './ToastSystem';

interface PostOpHandoverModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (handoverData: { signature: string; snap: string }) => Promise<void>;
    appointment: Appointment;
}

const PostOpHandoverModal: React.FC<PostOpHandoverModalProps> = ({ isOpen, onClose, onConfirm, appointment }) => {
    const toast = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [hasInk, setHasInk] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sigCanvasRef = useRef<HTMLCanvasElement>(null);

    const setupResources = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320 } });
            if (videoRef.current) videoRef.current.srcObject = stream;
            
            const c = sigCanvasRef.current;
            if (c) {
                c.width = c.parentElement?.clientWidth || 400; c.height = 100;
                const ctx = c.getContext('2d');
                if (ctx) { ctx.strokeStyle = '#000'; ctx.lineWidth = 2; }
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (isOpen) setupResources();
        return () => {
            if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        };
    }, [isOpen]);

    const handleConfirm = async () => {
        if (!hasInk) { toast.error("Patient signature required."); return; }
        setIsSaving(true);
        try {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            let snap = '';
            if (video && canvas) {
                canvas.width = 96; canvas.height = 96;
                const ctx = canvas.getContext('2d');
                ctx?.filter('grayscale(100%)');
                ctx?.drawImage(video, 0, 0, 96, 96);
                snap = canvas.toDataURL('image/jpeg', 0.5);
            }
            const signature = sigCanvasRef.current?.toDataURL() || '';
            await onConfirm({ signature, snap });
            onClose();
        } catch (error) {
            toast.error("Checkout failed.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 border-4 border-teal-100">
                <div className="p-8 text-center bg-slate-50/50">
                    <h2 className="text-2xl font-black text-teal-900 uppercase">Checkout Seal</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-1">Post-Op & Financial Release</p>
                </div>

                <div className="p-8 space-y-8">
                    <div className="flex gap-4">
                        <div className="w-24 h-24 bg-slate-900 rounded-2xl overflow-hidden border-2 border-white shadow-lg">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale scale-x-[-1]" />
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                        <div className="flex-1 space-y-2">
                             <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                "I have received my post-operative instructions and walkout statement. I am satisfied with today's treatment."
                             </p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Patient Signature Pad</span>
                            <button onClick={() => { const c = sigCanvasRef.current; c?.getContext('2d')?.clearRect(0,0,c.width,c.height); setHasInk(false); }} className="text-red-400"><Eraser size={14}/></button>
                        </div>
                        <canvas ref={sigCanvasRef} onPointerDown={(e) => {
                            const c = sigCanvasRef.current; if (!c) return;
                            const rect = c.getBoundingClientRect();
                            const ctx = c.getContext('2d');
                            ctx?.beginPath(); ctx?.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                            c.onpointermove = (m) => { ctx?.lineTo(m.clientX - rect.left, m.clientY - rect.top); ctx?.stroke(); setHasInk(true); };
                        }} onPointerUp={() => { if(sigCanvasRef.current) sigCanvasRef.current.onpointermove = null; }} className="w-full h-24 bg-white rounded-xl border border-slate-200 touch-none cursor-crosshair" />
                    </div>
                </div>

                <div className="p-6 border-t bg-white">
                    <button onClick={handleConfirm} disabled={isSaving || !hasInk} className="w-full py-5 bg-teal-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
                        <ShieldCheck size={20}/> Authorize Clinical Release
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostOpHandoverModal;

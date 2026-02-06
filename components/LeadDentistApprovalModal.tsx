

import React, { useState, useRef, useEffect } from 'react';
import { Patient, TreatmentPlan, SignatureChainEntry, User } from '../types';
import { X, CheckCircle, ShieldAlert, FileText, Eraser, Users } from 'lucide-react';
import { useToast } from './ToastSystem';
import { createSignatureEntry } from '../services/signatureVerification';
import { useStaff } from '../contexts/StaffContext';
import { formatDate } from '../constants';

interface LeadDentistApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: TreatmentPlan;
  patient: Patient;
  onConfirm: (planId: string, signatureChain: SignatureChainEntry[]) => void;
}

const LeadDentistApprovalModal: React.FC<LeadDentistApprovalModalProps> = ({
  isOpen, onClose, plan, patient, onConfirm
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const { staff } = useStaff();
  const toast = useToast();

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas && canvas.parentElement) {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; }
    }
  };

  useEffect(() => {
    if (isOpen) {
        setTimeout(setupCanvas, 50);
        setHasInk(false);
    }
  }, [isOpen]);

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startSign = (e: React.PointerEvent<HTMLCanvasElement>) => { e.preventDefault(); setIsSigning(true); const { x, y } = getCoords(e); const ctx = e.currentTarget.getContext('2d'); ctx?.beginPath(); ctx?.moveTo(x, y); };
  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => { if (!isSigning) return; e.preventDefault(); const { x, y } = getCoords(e); const ctx = e.currentTarget.getContext('2d'); ctx?.lineTo(x, y); ctx?.stroke(); setHasInk(true); };
  const endSign = () => setIsSigning(false);
  const clear = () => { const ctx = canvasRef.current?.getContext('2d'); if(ctx && canvasRef.current) ctx.clearRect(0,0, canvasRef.current.width, canvasRef.current.height); setHasInk(false); };

  const handleConfirm = async () => {
    if (!hasInk || !canvasRef.current) {
        toast.error("A signature is required to provide clinical approval.");
        return;
    }
    const signatureDataUrl = canvasRef.current.toDataURL();
    
    // In a real app, this would be the logged-in lead dentist
    const approver = staff.find(s => s.role === 'Lead Dentist');
    if (!approver) {
        toast.error("No Lead Dentist found to provide approval.");
        return;
    }

    // FIX: The 'createSignatureEntry' function is asynchronous and must be awaited.
    const signature = await createSignatureEntry(signatureDataUrl, {
        signerName: approver.name,
        signerRole: 'Lead Dentist',
        signatureType: 'dentist',
        previousHash: '0',
        metadata: {
            consentType: 'LeadDentistApproval',
            planId: plan.id,
        }
    });

    onConfirm(plan.id, [signature]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
        <div className="p-6 border-b border-amber-100 bg-amber-50 flex items-center gap-4">
          <ShieldAlert size={28} className="text-amber-600" />
          <div>
            <h2 className="text-xl font-black text-amber-900 uppercase tracking-tight">Lead Dentist Approval Required</h2>
          </div>
        </div>
        <div className="p-8 space-y-4 overflow-y-auto">
          <p className="text-sm text-slate-600">You are providing the final clinical seal of approval for <strong>{plan.name}</strong> for patient <strong>{patient.name}</strong>.</p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase">Clinical Rationale:</p>
            <p className="text-sm italic text-slate-700 mt-1">"{plan.clinicalRationale || 'No rationale provided.'}"</p>
          </div>

          {plan.consultations && plan.consultations.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h4 className="font-bold text-sm text-blue-800 flex items-center gap-2 mb-3"><Users size={16}/> Multi-Disciplinary Consultations</h4>
                <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                    {plan.consultations.map((consult, index) => (
                        <div key={index} className="p-3 bg-white rounded-lg border border-blue-100">
                            <p className="text-xs font-bold text-slate-500">
                                {formatDate(consult.consultDate)} - Dr. {consult.dentistName} ({consult.specialty})
                            </p>
                            <p className="text-sm text-slate-700 mt-1 italic">"{consult.recommendation}"</p>
                        </div>
                    ))}
                </div>
            </div>
          )}
          
          <div>
            <div className="flex justify-between items-center mb-2"><label className="label text-xs">Lead Dentist Signature *</label><button onClick={clear} className="text-xs font-bold text-slate-400 hover:text-red-500"><Eraser size={12}/> Clear</button></div>
            <canvas ref={canvasRef} className="bg-white rounded-lg border-2 border-dashed border-slate-300 w-full touch-none cursor-crosshair" onPointerDown={startSign} onPointerMove={draw} onPointerUp={endSign} onPointerLeave={endSign} />
          </div>
        </div>
        <div className="p-4 border-t bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
          <button onClick={handleConfirm} className="px-8 py-3 bg-amber-600 text-white rounded-xl font-bold flex items-center gap-2"><CheckCircle size={20}/> Approve & Seal</button>
        </div>
      </div>
    </div>
  );
};

export default LeadDentistApprovalModal;
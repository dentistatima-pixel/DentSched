
import React, { useState } from 'react';
import { Patient, TreatmentPlan } from '../types';
import { X, CheckCircle, XCircle, ShieldAlert, FileText } from 'lucide-react';

interface LeadDentistApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: TreatmentPlan;
  patient: Patient;
  onConfirm: (planId: string) => void;
  onReject: (planId: string, reason: string) => void;
}

const LeadDentistApprovalModal: React.FC<LeadDentistApprovalModalProps> = ({
  isOpen,
  onClose,
  plan,
  patient,
  onConfirm,
  onReject
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  if (!isOpen) return null;

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('A justification for rejection is mandatory for the audit trail.');
      return;
    }
    onReject(plan.id, rejectionReason);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-amber-100 bg-amber-50 flex items-center gap-4">
          <ShieldAlert size={28} className="text-amber-600" />
          <div>
            <h2 className="text-xl font-black text-amber-900 uppercase tracking-tight">Lead Dentist Approval</h2>
            <p className="text-xs text-amber-700 font-bold uppercase">Final Clinical Verification</p>
          </div>
        </div>

        <div className="p-8 space-y-4 flex-1 overflow-y-auto">
            <p className="text-sm text-slate-600">
                You are about to provide the final clinical seal of approval for <strong>{plan.name}</strong> for patient <strong>{patient.name}</strong>. Please review the details before proceeding.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase">Clinical Rationale Provided:</p>
                <p className="text-sm italic text-slate-700 mt-1">"{plan.clinicalRationale || 'No rationale provided.'}"</p>
            </div>
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase">Procedures in this Plan:</p>
                 <ul className="list-disc list-inside mt-2 text-sm text-slate-700">
                     {(patient.dentalChart || []).filter(item => item.planId === plan.id).map(item => (
                         <li key={item.id}>{item.procedure} (Tooth #{item.toothNumber})</li>
                     ))}
                 </ul>
            </div>
        </div>
        
        {isRejecting ? (
            <div className="p-6 border-t bg-white space-y-4 animate-in fade-in">
                <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Provide mandatory justification for rejection..." className="input h-24" autoFocus />
                <div className="flex gap-2">
                    <button onClick={() => setIsRejecting(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">Cancel</button>
                    <button onClick={handleReject} className="flex-1 py-3 bg-red-600 text-white rounded-lg text-xs font-bold">Confirm Rejection</button>
                </div>
            </div>
        ) : (
            <div className="p-4 border-t bg-white flex justify-end gap-3 shrink-0">
                <button onClick={() => setIsRejecting(true)} className="px-8 py-4 bg-red-100 text-red-700 rounded-xl font-black uppercase text-sm tracking-widest flex items-center gap-2">
                    <XCircle size={16}/> Reject
                </button>
                <button onClick={() => onConfirm(plan.id)} className="px-10 py-4 bg-teal-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-teal-600/30 flex items-center gap-2">
                    <CheckCircle size={16}/> Approve & Seal
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default LeadDentistApprovalModal;

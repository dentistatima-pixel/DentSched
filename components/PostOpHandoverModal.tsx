
import React, { useState } from 'react';
import { ShieldCheck, CheckCircle, X, ClipboardList, AlertTriangle, RotateCcw, CalendarPlus, FileText } from 'lucide-react';
import { Appointment } from '../types';
import { useToast } from './ToastSystem';

interface PostOpHandoverModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (handoverData: { instructions: string; followUpDays: number }) => Promise<void>;
    appointment: Appointment;
}

const PostOpHandoverModal: React.FC<PostOpHandoverModalProps> = ({ isOpen, onClose, onConfirm, appointment }) => {
    const toast = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [checks, setChecks] = useState({
        oral: false,
        written: false,
        emergency: false,
        medication: false,
    });
    const [instructions, setInstructions] = useState('');
    const [followUpDays, setFollowUpDays] = useState(7);


    if (!isOpen) return null;

    const allChecked = checks.oral && checks.written && checks.emergency && checks.medication;

    const handleConfirm = async () => {
        if (!allChecked) return;
        setIsSaving(true);
        try {
            await onConfirm({ instructions, followUpDays });
            toast.success("Post-Op Handover Verified and Logged.");
            onClose();
        } catch (error) {
            toast.error("Failed to update status. Please try again.");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 border-4 border-teal-100">
                <div className="p-8 border-b border-teal-50 bg-teal-50/50 flex flex-col items-center text-center">
                    <div className="bg-teal-600 text-white p-4 rounded-3xl shadow-lg shadow-teal-600/20 mb-4">
                        <ClipboardList size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-teal-900 uppercase tracking-tight">Clinical Handover Gate</h2>
                    <p className="text-[10px] text-teal-600 font-black uppercase tracking-widest mt-1">Post-Operative Instruction Verification</p>
                </div>

                <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                        <AlertTriangle size={24} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-900 font-bold leading-relaxed">
                            <strong>Liability Protection Gate:</strong> You must certify that the patient understands their post-treatment responsibilities before clinical release. This action is logged permanently.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${checks.oral ? 'bg-teal-50 border-teal-500' : 'bg-white border-slate-100'}`}>
                            <input type="checkbox" checked={checks.oral} onChange={e => setChecks({...checks, oral: e.target.checked})} className="w-6 h-6 accent-teal-600 rounded mt-0.5 shrink-0" />
                            <span className="text-sm font-bold text-slate-700">Oral instructions for home care delivered and understood by patient/guardian.</span>
                        </label>
                        <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${checks.medication ? 'bg-teal-50 border-teal-500' : 'bg-white border-slate-100'}`}>
                            <input type="checkbox" checked={checks.medication} onChange={e => setChecks({...checks, medication: e.target.checked})} className="w-6 h-6 accent-teal-600 rounded mt-0.5 shrink-0" />
                            <span className="text-sm font-bold text-slate-700">Medication dosage, schedule, and potential side effects explained.</span>
                        </label>
                        <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${checks.written ? 'bg-teal-50 border-teal-500' : 'bg-white border-slate-100'}`}>
                            <input type="checkbox" checked={checks.written} onChange={e => setChecks({...checks, written: e.target.checked})} className="w-6 h-6 accent-teal-600 rounded mt-0.5 shrink-0" />
                            <span className="text-sm font-bold text-slate-700">Written care card or digital equivalent provided to patient.</span>
                        </label>
                        <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${checks.emergency ? 'bg-teal-50 border-teal-500' : 'bg-white border-slate-100'}`}>
                            <input type="checkbox" checked={checks.emergency} onChange={e => setChecks({...checks, emergency: e.target.checked})} className="w-6 h-6 accent-teal-600 rounded mt-0.5 shrink-0" />
                            <span className="text-sm font-bold text-slate-700">Emergency contact protocol and when to call explained clearly.</span>
                        </label>
                    </div>

                    <div className="pt-6 border-t border-slate-200 space-y-4">
                        <div>
                           <label className="label text-xs flex items-center gap-1.5"><FileText size={14}/> Handover Instructions</label>
                           <textarea value={instructions} onChange={e => setInstructions(e.target.value)} className="input h-24" placeholder="e.g., Soft diet for 3 days, no strenuous activity."/>
                        </div>
                        <div>
                           <label className="label text-xs flex items-center gap-1.5"><CalendarPlus size={14}/> Schedule Follow-up (days)</label>
                           <input type="number" value={followUpDays} onChange={e => setFollowUpDays(parseInt(e.target.value))} className="input"/>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-white flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase text-[10px] tracking-widest rounded-2xl">Cancel</button>
                    <button 
                        onClick={handleConfirm} 
                        disabled={!allChecked || isSaving}
                        className={`flex-[2] py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${allChecked && !isSaving ? 'bg-teal-600 text-white shadow-teal-600/20 hover:scale-105' : 'bg-slate-200 text-slate-400 opacity-50'}`}
                    >
                        {isSaving ? (
                            <><RotateCcw size={16} className="animate-spin" /> Verifying...</>
                        ) : (
                            <><ShieldCheck size={16}/> Verify & Complete Session</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostOpHandoverModal;

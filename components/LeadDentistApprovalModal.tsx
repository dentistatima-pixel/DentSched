
import React, { useState, useMemo, useEffect } from 'react';
import { X, ShieldAlert, Key, CheckCircle, ArrowLeft, User as UserIcon, Lock } from 'lucide-react';
import { Appointment, ProcedureItem, Patient, User, UserRole } from '../types';
import { useStaff } from '../contexts/StaffContext';
import { useToast } from './ToastSystem';

interface LeadDentistApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (approvalData: { dentistId: string, timestamp: string, pinVerified: boolean }) => void;
  appointment: Appointment;
  procedure: ProcedureItem;
  patient: Patient;
}

const LeadDentistApprovalModal: React.FC<LeadDentistApprovalModalProps> = ({
  isOpen, onClose, onConfirm, appointment, procedure, patient
}) => {
  const { staff } = useStaff();
  const toast = useToast();

  const [selectedDentistId, setSelectedDentistId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // Eligible approvers: Admins, Architects, or Dentists (senior clinical staff)
  const eligibleApprovers = useMemo(() => 
    staff.filter(s => [UserRole.ADMIN, UserRole.DENTIST, UserRole.SYSTEM_ARCHITECT].includes(s.role) && s.status === 'Active'),
    [staff]
  );

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handlePinChange = (value: string) => {
    if (error) setError('');
    if (pin.length < 4) {
      setPin(prev => prev + value);
    }
  };

  const handleBackspace = () => {
    setError('');
    setPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (pin.length === 4) {
      const approver = eligibleApprovers.find(s => s.id === selectedDentistId);
      if (approver && approver.pin === pin) {
        onConfirm({
          dentistId: approver.id,
          timestamp: new Date().toISOString(),
          pinVerified: true
        });
        toast.success(`Clinical clearance granted by ${approver.name}.`);
      } else {
        setError('Invalid PIN');
        setTimeout(() => setPin(''), 500);
      }
    }
  }, [pin, selectedDentistId, eligibleApprovers, onConfirm, toast]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 border-4 border-lilac-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-8 bg-lilac-900 text-white flex flex-col items-center text-center shrink-0">
          <div className="bg-white/20 p-4 rounded-3xl shadow-lg mb-4">
            <Lock size={36} className="text-lilac-100" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Senior Authorization</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-lilac-300 mt-2">Clinical Governance Gate</p>
        </div>

        <div className="p-8 space-y-6 flex-1 overflow-y-auto no-scrollbar bg-slate-50/50">
          <div className="bg-white p-6 rounded-[2rem] border border-lilac-100 shadow-sm space-y-3">
             <div className="flex items-center gap-2 text-lilac-800 font-black uppercase text-[10px] tracking-widest border-b border-slate-50 pb-2">
                 <ShieldAlert size={14}/> Mandatory Protocol Review
             </div>
             <p className="text-sm font-bold text-slate-700 leading-relaxed">
               The procedure <strong>{procedure.name}</strong> is flagged as a high-risk clinical strategy. 
               Clearance from the Lead Dentist is required to unlock the treatment session for {patient.name}.
             </p>
          </div>

          {!selectedDentistId ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
               <label className="label text-[10px] font-black uppercase text-slate-400 ml-2 block">Select Authorizing Clinician</label>
               <div className="space-y-2">
                 {eligibleApprovers.map(s => (
                   <button 
                    key={s.id} 
                    onClick={() => setSelectedDentistId(s.id)}
                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-lilac-50 border border-slate-200 rounded-2xl transition-all group"
                   >
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-lilac-100 group-hover:text-lilac-600 transition-colors">
                         <UserIcon size={20}/>
                       </div>
                       <div className="text-left">
                         <p className="font-black text-slate-800 uppercase text-xs tracking-tight">{s.name}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.role}</p>
                       </div>
                     </div>
                     <CheckCircle size={20} className="text-slate-100 group-hover:text-lilac-200" />
                   </button>
                 ))}
               </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="flex items-center justify-between px-2">
                    <button onClick={() => setSelectedDentistId('')} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-all">
                        <ArrowLeft size={14}/> Back
                    </button>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verifying Identity</p>
                        <p className="text-sm font-black text-lilac-800 uppercase">{eligibleApprovers.find(s=>s.id===selectedDentistId)?.name}</p>
                    </div>
                </div>

                <div className="relative mb-6">
                    <div className={`flex justify-center gap-4 ${error ? 'animate-in shake' : ''}`}>
                        {[0,1,2,3].map(i => (
                            <div key={i} className={`w-14 h-20 rounded-2xl flex items-center justify-center text-5xl font-bold transition-all border-4 ${error ? 'bg-red-50 border-red-500 text-red-600' : pin[i] ? 'bg-white border-lilac-600 text-lilac-900 shadow-xl' : 'bg-slate-100 border-transparent text-slate-300'}`}>
                                {pin[i] ? <span className="inline-block animate-pop-in">•</span> : ''}
                            </div>
                        ))}
                    </div>
                    {error && <p className="text-center text-red-500 font-black uppercase tracking-widest mt-4 text-[10px] animate-pulse">{error}</p>}
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                        <button key={n} onClick={() => handlePinChange(n.toString())} className="h-20 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-lilac-400 hover:text-lilac-700 active:scale-95 transition-all text-2xl font-black text-slate-700 shadow-sm">{n}</button>
                    ))}
                    <div/>
                    <button onClick={() => handlePinChange('0')} className="h-20 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-lilac-400 hover:text-lilac-700 active:scale-95 transition-all text-2xl font-black text-slate-700 shadow-sm">0</button>
                    <button onClick={handleBackspace} className="h-20 bg-slate-100 rounded-[2rem] hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center text-slate-500">
                        <ArrowLeft size={28}/>
                    </button>
                </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-white">
          <button onClick={onClose} className="w-full py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-slate-200 transition-all">Abort Authorization</button>
        </div>
      </div>
    </div>
  );
};

export default LeadDentistApprovalModal;

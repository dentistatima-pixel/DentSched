
import React, { useState, useEffect, useRef } from 'react';
import { Patient, AuditLogEntry } from '../types';
// Add missing Edit icon to imports to fix "Cannot find name 'Edit'" error
import { UserPlus, UserCheck, ChevronRight, ArrowLeft, Phone, Cake, CheckCircle2, ShieldCheck, ShieldAlert, Lock, FileText, CheckSquare, Fingerprint, Edit } from 'lucide-react';
import PatientRegistrationModal from './PatientRegistrationModal';
import { useToast } from './ToastSystem';
import { STAFF } from '../constants';
import { usePatient } from '../contexts/PatientContext';

interface KioskViewProps {
  onExitKiosk: () => void;
  logAction?: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
}

type KioskStep = 'welcome' | 'identify' | 'verify' | 'notice' | 'affirmation' | 'update' | 'thankyou';

export const KioskView: React.FC<KioskViewProps> = ({ onExitKiosk, logAction }) => {
  const toast = useToast();
  const { patients, handleSavePatient: onUpdatePatient } = usePatient();
  const [step, setStep] = useState<KioskStep>('welcome');
  
  const [identifier, setIdentifier] = useState('');
  const [birthDateInput, setBirthDateInput] = useState('');
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (step === 'welcome') {
        setIdentifier('');
        setBirthDateInput('');
        setFoundPatient(null);
    }
    if (step === 'thankyou') {
        const timer = setTimeout(() => setStep('welcome'), 4000);
        return () => clearTimeout(timer);
    }
  }, [step]);

  const handleIdentify = (e: React.FormEvent) => {
      e.preventDefault();
      const cleanId = identifier.replace(/\D/g, ''); 
      if (cleanId.length < 4) {
          toast.error("Enter a valid mobile number.");
          return;
      }
      const match = patients.find(p => p.phone.replace(/\D/g, '').includes(cleanId));
      if (match && match.dob === birthDateInput) {
          setFoundPatient(match);
          setStep('verify');
      } else {
          toast.error("Record not found. Please verify your details.");
      }
  };

  const handlePatientSave = async (updated: Partial<Patient>) => {
      await onUpdatePatient(updated);
      setStep('thankyou');
  };

  const handleExitClick = () => {
      const pin = prompt("Staff PIN to Exit:");
      if (pin && STAFF.some(s => s.pin === pin)) {
          onExitKiosk();
      } else {
          toast.error("Incorrect PIN");
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col overflow-hidden font-sans text-slate-900">
        
        <div className="bg-white p-6 shadow-sm flex justify-between items-center border-b border-slate-100">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20">
                    <span className="text-white font-bold text-2xl">D</span>
                </div>
                <div>
                    <h1 className="font-bold text-xl tracking-tight leading-none">dentsched</h1>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Intake Terminal</span>
                </div>
            </div>
            
            {step !== 'welcome' && step !== 'thankyou' && (
                <button onClick={() => setStep('welcome')} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-600 font-black uppercase text-xs tracking-widest">
                    <ArrowLeft size={18} /> Restart
                </button>
            )}

            {step === 'welcome' && (
                <button onDoubleClick={handleExitClick} className="opacity-10 hover:opacity-100 transition-opacity p-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Secure Mode
                </button>
            )}
        </div>

        <div className="flex-1 flex items-center justify-center p-6 relative">
            
            {step === 'welcome' && (
                <div className="w-full max-w-4xl animate-in zoom-in-95 duration-500">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-black text-teal-900 mb-4 uppercase tracking-tighter">Welcome to our Practice</h2>
                        <p className="text-xl text-slate-500 font-medium">Please select an option below to continue.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <button 
                            onClick={() => { setFoundPatient(null); setStep('notice'); }}
                            className="bg-white p-12 rounded-[3.5rem] border-4 border-teal-100 shadow-2xl hover:border-teal-500 transition-all group hover:-translate-y-2 text-center"
                        >
                            <div className="w-24 h-24 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:bg-teal-600 group-hover:text-white transition-all">
                                <UserPlus size={48} />
                            </div>
                            <h3 className="text-3xl font-black text-teal-900 uppercase tracking-tighter">New Patient</h3>
                            <p className="text-slate-500 mt-3 font-medium">Register your record for the first time.</p>
                        </button>

                        <button 
                            onClick={() => setStep('identify')}
                            className="bg-white p-12 rounded-[3.5rem] border-4 border-lilac-100 shadow-2xl hover:border-lilac-500 transition-all group hover:-translate-y-2 text-center"
                        >
                            <div className="w-24 h-24 bg-lilac-50 text-lilac-600 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:bg-lilac-600 group-hover:text-white transition-all">
                                <UserCheck size={48} />
                            </div>
                            <h3 className="text-3xl font-black text-lilac-900 uppercase tracking-tighter">Returning</h3>
                            <p className="text-slate-500 mt-3 font-medium">Update your medical or contact details.</p>
                        </button>
                    </div>
                </div>
            )}

            {step === 'identify' && (
                <div className="w-full max-w-md animate-in slide-in-from-bottom-10 duration-300">
                    <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100">
                        <h3 className="text-2xl font-black text-center text-slate-800 mb-10 uppercase tracking-widest">Verify Access</h3>
                        <form onSubmit={handleIdentify} className="space-y-8">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-1 mb-2"><Phone size={12}/> Registered Mobile</label>
                                <input 
                                    type="tel" 
                                    autoFocus
                                    className="w-full text-center text-3xl font-mono p-5 border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none bg-slate-50 shadow-inner"
                                    placeholder="09XXXXXXXXX"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-1 mb-2"><Cake size={12}/> Birth Date</label>
                                <input 
                                    type="date" 
                                    className="w-full text-center text-2xl p-5 border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none bg-slate-50 shadow-inner"
                                    value={birthDateInput}
                                    onChange={(e) => setBirthDateInput(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="w-full bg-teal-600 py-6 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl shadow-teal-600/20 active:scale-95 transition-all">Verify My Record</button>
                        </form>
                    </div>
                </div>
            )}

            {step === 'verify' && foundPatient && (
                <div className="w-full max-w-md animate-in zoom-in-95 duration-300">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 text-center">
                        <h3 className="text-2xl font-black text-slate-800 mb-8 uppercase tracking-tighter">Is this you?</h3>
                        <div className="bg-teal-50 p-10 rounded-[2.5rem] border-2 border-teal-100 mb-10">
                            <div className="text-3xl font-black text-teal-900 leading-tight">{foundPatient.name}</div>
                            <div className="text-slate-400 font-mono mt-2 tracking-widest">{foundPatient.phone}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setStep('identify')} className="py-5 rounded-2xl font-black text-slate-400 bg-slate-100 uppercase text-xs tracking-widest">No, Incorrect</button>
                            <button onClick={() => setStep('notice')} className="py-5 rounded-2xl font-black text-white bg-teal-600 shadow-xl uppercase text-xs tracking-widest active:scale-95 transition-all">Yes, Proceed</button>
                        </div>
                    </div>
                </div>
            )}

            {step === 'notice' && (
                <div className="w-full max-w-3xl animate-in slide-in-from-bottom-10 duration-300">
                    <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 flex flex-col h-[75vh]">
                        <div className="flex items-center gap-6 mb-8">
                            <div className="p-5 bg-teal-50 text-teal-600 rounded-[2rem] shadow-sm"><ShieldCheck size={48}/></div>
                            <div>
                                <h3 className="text-3xl font-black text-teal-900 uppercase tracking-tighter leading-none">Transparency Notice</h3>
                                <p className="text-sm text-slate-400 font-black uppercase tracking-widest mt-2">Data Privacy Act (R.A. 10173)</p>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-6 mb-10 space-y-8 text-base text-slate-600 leading-relaxed no-scrollbar border-y py-8">
                            <p className="font-bold text-slate-800">Please acknowledge our data processing terms before continuing:</p>
                            <section>
                                <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-2">1. Why we process your data</h4>
                                <p>We collect and use your medical history, identifiers, and dental records exclusively for diagnosis, clinical safety, and statutory billing requirements.</p>
                            </section>
                            <section>
                                <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-2">2. Secure Digital Records</h4>
                                <p>This terminal uses end-to-end encryption to store your information directly in our clinical database. Your data is protected by organizational and technical safeguards.</p>
                            </section>
                            <section>
                                <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-2">3. Your Rights</h4>
                                <p>You have the right to access, rectify, or object to the processing of your data. For more information, please request to speak with our Data Protection Officer.</p>
                            </section>
                        </div>

                        <button 
                            onClick={() => setStep('affirmation')}
                            className="w-full py-7 bg-teal-600 text-white font-black uppercase tracking-widest rounded-3xl shadow-2xl shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all text-lg"
                        >
                            I Understand & Proceed
                        </button>
                    </div>
                </div>
            )}

            {step === 'affirmation' && foundPatient && (
                <div className="w-full max-w-3xl animate-in slide-in-from-bottom-10 duration-300">
                    <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 text-center">
                        <div className="flex flex-col items-center mb-12">
                            <div className="w-24 h-24 bg-teal-50 text-teal-600 rounded-[2rem] flex items-center justify-center mb-8">
                                <Fingerprint size={48} />
                            </div>
                            <h3 className="text-4xl font-black text-teal-900 uppercase tracking-tight leading-none">Health Status</h3>
                            <p className="text-xl text-slate-500 mt-3 font-medium">Has anything changed in your health since your last visit?</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <button 
                                onClick={() => setStep('thankyou')}
                                className="p-10 bg-white border-4 border-teal-100 rounded-[3rem] text-left hover:border-teal-500 transition-all group flex flex-col items-center gap-4 text-center"
                            >
                                <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white shrink-0 transition-all shadow-sm">
                                    <CheckCircle2 size={32} />
                                </div>
                                <div>
                                    <div className="text-xl font-black text-teal-900 uppercase tracking-tight">No Changes</div>
                                    <p className="text-slate-400 text-sm mt-1 font-bold">Health status is same</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => setStep('update')}
                                className="p-10 bg-white border-4 border-lilac-100 rounded-[3rem] text-left hover:border-lilac-500 transition-all group flex flex-col items-center gap-4 text-center"
                            >
                                <div className="w-16 h-16 bg-lilac-50 text-lilac-600 rounded-full flex items-center justify-center group-hover:bg-lilac-600 group-hover:text-white shrink-0 transition-all shadow-sm">
                                    <Edit size={32} />
                                </div>
                                <div>
                                    <div className="text-xl font-black text-lilac-900 uppercase tracking-tight">Update My Record</div>
                                    <p className="text-slate-400 text-sm mt-1 font-bold">I have new details to report</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 'thankyou' && (
                <div className="text-center animate-in zoom-in-90 duration-500">
                    <div className="w-40 h-40 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl">
                        <CheckCircle2 size={100} strokeWidth={3} />
                    </div>
                    <h2 className="text-5xl font-black text-teal-900 uppercase tracking-tighter">All Set!</h2>
                    <p className="text-2xl text-slate-500 mt-6 max-w-md mx-auto font-medium leading-relaxed">Thank you. Please have a seat in the lounge while our staff prepares your room.</p>
                </div>
            )}
        </div>

        {step === 'update' && (
            <div className="absolute inset-0 z-[110] bg-white">
                 <PatientRegistrationModal 
                    isOpen={true}
                    onClose={() => setStep('welcome')}
                    onSave={handlePatientSave}
                    initialData={foundPatient}
                    isKiosk={true} 
                 />
            </div>
        )}
    </div>
  );
};

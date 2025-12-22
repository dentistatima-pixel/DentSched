import React, { useState, useEffect } from 'react';
import { Patient, AuditLogEntry } from '../types';
import { UserPlus, UserCheck, ChevronRight, LogOut, ArrowLeft, Phone, Cake, CheckCircle2, ShieldCheck } from 'lucide-react';
import PatientRegistrationModal from './PatientRegistrationModal';
import { useToast } from './ToastSystem';

interface KioskViewProps {
  patients: Patient[];
  onUpdatePatient: (patient: Partial<Patient>) => void;
  onExitKiosk: () => void;
  fieldSettings: any;
  logAction?: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
}

type KioskStep = 'welcome' | 'identify' | 'verify' | 'update' | 'thankyou';

const KioskView: React.FC<KioskViewProps> = ({ patients, onUpdatePatient, onExitKiosk, fieldSettings, logAction }) => {
  const toast = useToast();
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
          if (logAction) logAction('SECURITY_ALERT', 'Kiosk', 'System', `Failed Kiosk Login attempt.`);
      }
  };

  const handlePatientSave = (updated: Partial<Patient>) => {
      onUpdatePatient(updated);
      setStep('thankyou');
  };

  const handleExitClick = () => {
      const pin = prompt("Staff PIN to Exit:");
      if (pin === '1234') onExitKiosk();
      else toast.error("Incorrect PIN");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col overflow-hidden font-sans text-slate-900">
        
        {/* HEADER */}
        <div className="bg-white p-6 shadow-sm flex justify-between items-center relative border-b border-slate-100">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20">
                    <span className="text-white font-bold text-2xl">D</span>
                </div>
                <div>
                    <h1 className="font-bold text-xl tracking-tight leading-none">dentsched</h1>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Digital Patient Terminal</span>
                </div>
            </div>
            
            {step !== 'welcome' && step !== 'thankyou' && (
                <button onClick={() => setStep('welcome')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all">
                    <ArrowLeft size={18} /> Restart
                </button>
            )}

            {step === 'welcome' && (
                <button onDoubleClick={handleExitClick} className="opacity-10 hover:opacity-100 transition-opacity p-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Staff Exit
                </button>
            )}
        </div>

        {/* CONTENT */}
        <div className="flex-1 flex items-center justify-center p-6 relative">
            
            {/* WELCOME: SELECTION */}
            {step === 'welcome' && (
                <div className="w-full max-w-4xl animate-in zoom-in-95 duration-500">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-black text-teal-900 mb-4 uppercase tracking-tight">Digital Registration</h2>
                        <p className="text-xl text-slate-500 font-medium">Please select your patient status to begin.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <button 
                            onClick={() => { setFoundPatient(null); setStep('update'); }}
                            className="bg-white p-10 rounded-[2.5rem] border-4 border-teal-100 shadow-2xl hover:border-teal-500 transition-all group hover:-translate-y-2 text-center"
                        >
                            <div className="w-24 h-24 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-teal-600 group-hover:text-white transition-all">
                                <UserPlus size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-teal-900 uppercase tracking-tighter">I am a New Patient</h3>
                            <p className="text-slate-500 mt-2 font-medium">First time here? Register your record.</p>
                        </button>

                        <button 
                            onClick={() => setStep('identify')}
                            className="bg-white p-10 rounded-[2.5rem] border-4 border-lilac-100 shadow-2xl hover:border-lilac-500 transition-all group hover:-translate-y-2 text-center"
                        >
                            <div className="w-24 h-24 bg-lilac-50 text-lilac-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-lilac-600 group-hover:text-white transition-all">
                                <UserCheck size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-lilac-900 uppercase tracking-tighter">I am an Existing Patient</h3>
                            <p className="text-slate-500 mt-2 font-medium">Verify your ID to update information.</p>
                        </button>
                    </div>
                </div>
            )}

            {/* IDENTIFY (SECURE 2FA) */}
            {step === 'identify' && (
                <div className="w-full max-w-md animate-in slide-in-from-bottom-10 duration-300">
                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
                        <h3 className="text-2xl font-black text-center text-slate-800 mb-8 uppercase tracking-widest">Verify Identity</h3>
                        <form onSubmit={handleIdentify} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-1"><Phone size={12}/> Registered Mobile</label>
                                <input 
                                    type="tel" 
                                    autoFocus
                                    className="w-full text-center text-2xl font-mono p-4 border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none"
                                    placeholder="09XXXXXXXXX"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-1"><Cake size={12}/> Birth Date</label>
                                <input 
                                    type="date" 
                                    className="w-full text-center text-xl p-4 border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none"
                                    value={birthDateInput}
                                    onChange={(e) => setBirthDateInput(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="w-full bg-teal-600 py-5 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl shadow-teal-600/20">Verify Access</button>
                        </form>
                    </div>
                </div>
            )}

            {/* VERIFY (CONFIRMATION) */}
            {step === 'verify' && foundPatient && (
                <div className="w-full max-w-md animate-in zoom-in-95 duration-300">
                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 text-center">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Match Found</h3>
                        <div className="bg-slate-50 p-8 rounded-3xl border-2 border-teal-100 mb-8">
                            <div className="text-2xl font-black text-teal-900">{foundPatient.name}</div>
                            <div className="text-slate-400 font-mono mt-1">{foundPatient.phone}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setStep('identify')} className="py-4 rounded-2xl font-bold text-slate-400 bg-slate-100">Incorrect</button>
                            <button onClick={() => setStep('update')} className="py-4 rounded-2xl font-black text-white bg-teal-600 shadow-lg uppercase tracking-widest">Update Information</button>
                        </div>
                    </div>
                </div>
            )}

            {/* THANK YOU / SUCCESS */}
            {step === 'thankyou' && (
                <div className="text-center animate-in zoom-in-90 duration-500">
                    <div className="w-32 h-32 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                        <CheckCircle2 size={80} strokeWidth={3} />
                    </div>
                    <h2 className="text-4xl font-black text-teal-900 uppercase tracking-tighter">Records Processed</h2>
                    <p className="text-xl text-slate-500 mt-4 max-w-md mx-auto">Thank you for updating your information. Please wait for your name to be called.</p>
                    <div className="mt-12 flex items-center justify-center gap-2 text-slate-300">
                        <ShieldCheck size={16}/>
                        <span className="text-[10px] font-black uppercase tracking-widest">Compliant with R.A. 10173</span>
                    </div>
                </div>
            )}
        </div>

        {/* UPDATE FORM MODAL */}
        {step === 'update' && (
            <div className="absolute inset-0 z-[110] bg-white">
                 <PatientRegistrationModal 
                    isOpen={true}
                    onClose={() => setStep('welcome')}
                    onSave={handlePatientSave}
                    initialData={foundPatient}
                    fieldSettings={fieldSettings}
                    isKiosk={true} 
                 />
            </div>
        )}
    </div>
  );
};

export default KioskView;
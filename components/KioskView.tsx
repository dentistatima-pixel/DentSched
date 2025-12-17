
import React, { useState, useEffect } from 'react';
import { Patient, Appointment, AppointmentStatus, AuditLogEntry } from '../types';
import { Phone, CheckCircle, User, Calendar, Activity, ChevronRight, LogOut, RefreshCw, ArrowLeft, Cake } from 'lucide-react';
import PatientRegistrationModal from './PatientRegistrationModal';
import { useToast } from './ToastSystem';

interface KioskViewProps {
  patients: Patient[];
  appointments: Appointment[];
  onCheckIn: (appointmentId: string) => void;
  onUpdatePatient: (patient: Partial<Patient>) => void;
  onExitKiosk: () => void;
  fieldSettings: any;
  logAction?: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
}

type KioskStep = 'welcome' | 'identify' | 'verify' | 'dashboard' | 'update';

const KioskView: React.FC<KioskViewProps> = ({ patients, appointments, onCheckIn, onUpdatePatient, onExitKiosk, fieldSettings, logAction }) => {
  const toast = useToast();
  const [step, setStep] = useState<KioskStep>('welcome');
  
  // Auth Inputs
  const [identifier, setIdentifier] = useState('');
  const [birthDateInput, setBirthDateInput] = useState('');
  
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [todaysApt, setTodaysApt] = useState<Appointment | null>(null);

  // Reset when returning to welcome
  useEffect(() => {
    if (step === 'welcome') {
        setIdentifier('');
        setBirthDateInput('');
        setFoundPatient(null);
        setTodaysApt(null);
    }
  }, [step]);

  const handleIdentify = (e: React.FormEvent) => {
      e.preventDefault();
      
      // 1. Verify Mobile Number
      const cleanId = identifier.replace(/\D/g, ''); 
      if (cleanId.length < 4) {
          toast.error("Please enter a valid mobile number.");
          return;
      }

      // 2. Find Patient Matching Phone
      const match = patients.find(p => {
          const pPhone = p.phone.replace(/\D/g, '');
          return pPhone.includes(cleanId);
      });

      // 3. Verify Birth Date (2-Factor Check)
      if (match) {
          if (!match.dob || match.dob !== birthDateInput) {
              // SECURITY: Do not reveal that the phone number was correct. Generic error.
              toast.error("Authentication Failed: Record not found matching these credentials.");
              if (logAction) logAction('SECURITY_ALERT', 'Kiosk', 'System', `Failed Kiosk Auth: Phone matched but DOB failed.`);
              return;
          }

          // SUCCESS
          setFoundPatient(match);
          const today = new Date().toLocaleDateString('en-CA');
          const apt = appointments.find(a => 
              a.patientId === match.id && 
              a.date === today && 
              a.status !== AppointmentStatus.CANCELLED
          );
          setTodaysApt(apt || null);
          setStep('verify');
          
      } else {
          toast.error("Record not found. Please ask staff for help.");
      }
  };

  const handleCheckIn = () => {
      if (todaysApt) {
          onCheckIn(todaysApt.id);
          toast.success("Checked in successfully! Please take a seat.");
          setTimeout(() => setStep('welcome'), 3000);
      }
  };

  const handlePatientSave = (updated: Partial<Patient>) => {
      onUpdatePatient(updated);
      toast.success("Information updated.");
      setStep('dashboard'); 
  };

  const handleExitClick = () => {
      const pin = prompt("Enter Staff PIN to Exit Kiosk:");
      if (pin === '1234') { // Mock PIN
          onExitKiosk();
      } else {
          toast.error("Incorrect PIN");
          if (logAction) {
              logAction('SECURITY_ALERT', 'Kiosk', 'System', `Failed Kiosk Exit Attempt: Incorrect PIN entered.`);
          }
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col overflow-hidden font-sans text-slate-900">
        
        {/* KIOSK HEADER */}
        <div className="bg-white p-6 shadow-sm flex justify-between items-center relative">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20">
                    <span className="text-white font-bold text-2xl">D</span>
                </div>
                <div>
                    <h1 className="font-bold text-xl tracking-tight leading-none">dentsched</h1>
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Self-Service Kiosk</span>
                </div>
            </div>
            
            {step !== 'welcome' && (
                <button 
                    onClick={() => setStep('welcome')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                >
                    <LogOut size={18} /> Cancel
                </button>
            )}

            {step === 'welcome' && (
                <button 
                    onDoubleClick={handleExitClick} 
                    className="opacity-20 hover:opacity-100 transition-opacity p-2 text-xs font-bold text-slate-400"
                    title="Staff: Double Click to Exit"
                >
                    Exit Kiosk
                </button>
            )}
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex items-center justify-center p-4">
            
            {/* STEP 1: WELCOME */}
            {step === 'welcome' && (
                <div className="text-center max-w-lg animate-in zoom-in-95 duration-500">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-teal-900 mb-6">Welcome to the Clinic</h2>
                    <p className="text-xl text-slate-500 mb-10">Please check in for your appointment or update your records.</p>
                    
                    <button 
                        onClick={() => setStep('identify')}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xl font-bold py-6 rounded-2xl shadow-xl shadow-teal-600/30 transition-transform active:scale-95 flex items-center justify-center gap-3"
                    >
                        Tap to Start <ChevronRight size={24} />
                    </button>
                    <div className="mt-8 text-sm text-slate-400 font-medium">
                        New patient? Please see the front desk.
                    </div>
                </div>
            )}

            {/* STEP 2: IDENTIFY (SECURE 2FA) */}
            {step === 'identify' && (
                <div className="w-full max-w-md animate-in slide-in-from-right-10 duration-300">
                    <button onClick={() => setStep('welcome')} className="mb-6 flex items-center gap-2 text-slate-500 font-bold hover:text-teal-600 transition-colors">
                        <ArrowLeft size={20} /> Back
                    </button>
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center">
                        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 text-teal-600">
                            <User size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Secure Verification</h3>
                        <p className="text-slate-500 mb-6">Please enter your details to verify your identity.</p>
                        
                        <form onSubmit={handleIdentify} className="space-y-4">
                            <div className="text-left">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Phone size={12}/> Mobile Number</label>
                                <input 
                                    type="tel" 
                                    autoFocus
                                    className="w-full text-center text-xl font-mono tracking-wider p-4 border-2 border-slate-200 rounded-2xl focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none text-slate-800 placeholder:text-slate-300 transition-all"
                                    placeholder="09XX..."
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                />
                            </div>

                            <div className="text-left">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Cake size={12}/> Birth Date</label>
                                <input 
                                    type="date" 
                                    className="w-full text-center text-xl p-4 border-2 border-slate-200 rounded-2xl focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none text-slate-800"
                                    value={birthDateInput}
                                    onChange={(e) => setBirthDateInput(e.target.value)}
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={identifier.length < 4 || !birthDateInput}
                                className="w-full bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-700 text-white text-lg font-bold py-4 rounded-xl shadow-lg transition-all mt-4"
                            >
                                Verify & Continue
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* STEP 3: VERIFY */}
            {step === 'verify' && foundPatient && (
                <div className="w-full max-w-md animate-in slide-in-from-right-10 duration-300">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Identity Verified</h3>
                        
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
                            <div className="text-2xl font-bold text-teal-900 mb-1">{foundPatient.name}</div>
                            <div className="text-slate-500">{foundPatient.phone}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setStep('identify')}
                                className="py-4 rounded-xl font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                                Incorrect
                            </button>
                            <button 
                                onClick={() => setStep('dashboard')}
                                className="py-4 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-lg transition-colors"
                            >
                                Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 4: PATIENT DASHBOARD */}
            {step === 'dashboard' && foundPatient && (
                <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-300">
                    
                    {/* Welcome Card */}
                    <div className="md:col-span-2">
                         <h2 className="text-3xl font-bold text-slate-800">Hi, {foundPatient.firstName}! 👋</h2>
                         <p className="text-slate-500">What would you like to do today?</p>
                    </div>

                    {/* Appointment Card */}
                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Calendar size={24} /></div>
                            <h3 className="font-bold text-lg">Today's Visit</h3>
                        </div>
                        
                        {todaysApt ? (
                            <div className="flex-1 flex flex-col">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 flex-1">
                                    <div className="text-4xl font-bold text-slate-800 mb-1">{todaysApt.time}</div>
                                    <div className="text-slate-500 font-medium mb-4">{todaysApt.type}</div>
                                    {todaysApt.status === AppointmentStatus.ARRIVED || todaysApt.status === AppointmentStatus.SEATED ? (
                                        <div className="bg-green-100 text-green-700 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                            <CheckCircle size={20} /> You are checked in!
                                        </div>
                                    ) : (
                                        <div className="text-sm text-orange-600 font-bold bg-orange-50 px-3 py-2 rounded-lg inline-block">
                                            Please check in upon arrival.
                                        </div>
                                    )}
                                </div>
                                {todaysApt.status === AppointmentStatus.SCHEDULED && (
                                    <button 
                                        onClick={handleCheckIn}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                                    >
                                        Check In Now
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                No appointment scheduled for today.
                            </div>
                        )}
                    </div>

                    {/* Update Info Card */}
                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-lilac-100 p-3 rounded-xl text-lilac-600"><Activity size={24} /></div>
                            <h3 className="font-bold text-lg">My Information</h3>
                        </div>
                        <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Keep your medical history and contact details up to date to ensure the best care.
                            </p>
                            <div className="mt-4 flex gap-2 flex-wrap">
                                {foundPatient.allergies && foundPatient.allergies.length > 0 && (
                                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
                                        {foundPatient.allergies.length} Allergies
                                    </span>
                                )}
                                <span className="bg-white border border-slate-200 text-slate-500 text-xs font-bold px-2 py-1 rounded">
                                    {foundPatient.phone}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setStep('update')}
                            className="w-full bg-lilac-600 hover:bg-lilac-700 text-white text-lg font-bold py-4 rounded-xl shadow-lg shadow-lilac-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={20} /> Update My Records
                        </button>
                    </div>

                    {/* Done Button */}
                    <div className="md:col-span-2 mt-4">
                        <button 
                            onClick={() => setStep('welcome')}
                            className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600 font-bold py-4 rounded-2xl transition-colors"
                        >
                            I'm Done
                        </button>
                    </div>

                </div>
            )}
        </div>

        {/* STEP 5: EDIT MODAL (Reusing component) */}
        {step === 'update' && foundPatient && (
            <div className="absolute inset-0 z-50 bg-slate-50">
                 <PatientRegistrationModal 
                    isOpen={true}
                    onClose={() => setStep('dashboard')}
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

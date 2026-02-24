import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertCircle, HeartPulse, Clock, CheckCircle } from 'lucide-react';
import { Patient, PatientAlert } from '../types';

interface SafetyTimeoutModalProps {
    patient: Patient;
    alerts: PatientAlert[];
    onConfirm: () => void;
    onClose: () => void;
}

const SafetyTimeoutModal: React.FC<SafetyTimeoutModalProps> = ({ patient, alerts, onConfirm, onClose }) => {
    const [secondsLeft, setSecondsLeft] = useState(5);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
            setProgress((prev) => Math.max(0, prev - (100 / 5)));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const criticalAlerts = alerts.filter(a => a.level === 'critical');

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border-4 border-red-500 animate-in zoom-in-95">
                <div className="bg-red-600 p-8 text-white flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl">
                        <ShieldAlert size={48} className="animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Chair-Side Safety Timeout</h2>
                        <p className="text-sm font-bold text-red-100 uppercase tracking-widest mt-2">Critical Review Mandate Active</p>
                    </div>
                </div>

                <div className="p-8 space-y-8 flex-1">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-red-600 font-black uppercase text-xs tracking-widest border-b border-red-50 pb-2">
                            <HeartPulse size={16}/> Critical Red Flags Detected
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {criticalAlerts.map((alert, idx) => (
                                <div key={idx} className="bg-red-50 border-2 border-red-200 p-6 rounded-2xl flex items-center gap-4 shadow-sm animate-in slide-in-from-left-4" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <alert.icon size={28} className="text-red-600" />
                                    <span className="text-2xl font-black text-red-900 uppercase tracking-tight">{alert.message}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 italic text-slate-600 text-sm leading-relaxed text-center">
                        "I verify that I have reviewed these critical risks and have implemented the necessary clinical precautions for {patient.name}'s treatment."
                    </div>
                </div>

                <div className="p-8 border-t border-slate-100 bg-white space-y-6">
                    <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className="absolute inset-0 bg-red-600 transition-all duration-1000 ease-linear" 
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <button 
                        onClick={() => { onClose(); onConfirm(); }}
                        disabled={secondsLeft > 0}
                        className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-widest text-lg shadow-2xl transition-all flex items-center justify-center gap-3 ${
                            secondsLeft > 0 
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                : 'bg-teal-600 text-white shadow-teal-600/30 hover:scale-105 active:scale-95'
                        }`}
                    >
                        {secondsLeft > 0 ? (
                            <>
                                <Clock size={24} /> 
                                Review required for {secondsLeft}s
                            </>
                        ) : (
                            <>
                                <CheckCircle size={24} />
                                Confirm Safety Review
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SafetyTimeoutModal;

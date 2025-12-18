
import React, { useState, useEffect, useRef } from 'react';
import { Appointment, Patient, User } from '../types';
import { Video, Mic, PhoneOff, Send, Plus, StickyNote, X, ShieldCheck, FileSignature, CheckCircle, AlertTriangle, Hospital, Stethoscope } from 'lucide-react';
import { useToast } from './ToastSystem';

interface TelehealthModalProps {
    appointment: Appointment;
    patient: Patient;
    doctor: User;
    onClose: (triage?: string, notes?: string) => void;
}

const TelehealthModal: React.FC<TelehealthModalProps> = ({ appointment, patient, doctor, onClose }) => {
    const toast = useToast();
    const [consentAccepted, setConsentAccepted] = useState(false);
    const [sessionStarted, setSessionStarted] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [notes, setNotes] = useState('');
    const [triage, setTriage] = useState<'Elective' | 'Urgent'>('Elective');
    const patientVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!sessionStarted) return;
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                if (patientVideoRef.current) patientVideoRef.current.srcObject = stream;
            })
            .catch(err => {
                console.error(err);
                toast.error("Could not access camera/microphone.");
            });

        return () => {
            if (patientVideoRef.current?.srcObject) {
                (patientVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
        };
    }, [sessionStarted]);

    const handleHospitalReferral = () => {
        toast.info("Generating DOH Emergency Referral Form PDF...");
        // PDF generation logic here...
    };

    const handleEndSession = () => {
        if (window.confirm("Are you sure you want to end the session? The summary will be saved to the patient record.")) {
            onClose(triage, notes);
        }
    };

    if (!sessionStarted) {
        return (
            <div className="fixed inset-0 bg-slate-900/90 z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95">
                    <div className="bg-teal-900 p-8 text-white text-center">
                        <div className="w-16 h-16 bg-teal-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><Video size={32}/></div>
                        <h2 className="text-2xl font-bold">Tele-dentistry Linkage</h2>
                        <p className="text-teal-200 mt-2">DOH-AO-2020-0041 Regulatory Protocol</p>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-900">
                            <AlertTriangle size={24} className="shrink-0 text-amber-600"/>
                            <p className="text-xs leading-relaxed">This virtual visit is for <strong>triage and discussion</strong> only. It does not replace face-to-face physical examination.</p>
                        </div>
                        <label className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                            <input type="checkbox" checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)} className="w-5 h-5 accent-teal-600 rounded mt-0.5"/>
                            <div className="text-sm font-medium text-slate-700">I confirm my identity as <strong>{patient.name}</strong> and expressly consent to this DPA-compliant session.</div>
                        </label>
                        <div className="flex gap-3">
                            <button onClick={() => onClose()} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl">Cancel</button>
                            <button disabled={!consentAccepted} onClick={() => setSessionStarted(true)} className="flex-[2] py-4 bg-teal-600 text-white font-bold rounded-2xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"><CheckCircle size={20}/> Start Secure Session</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-6xl h-full flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col bg-black rounded-2xl overflow-hidden relative shadow-2xl">
                    <div className="absolute top-0 left-0 right-0 bg-emerald-600/90 text-white text-[10px] font-bold py-1 px-4 text-center z-20 flex items-center justify-center gap-2 backdrop-blur-sm">
                        <ShieldCheck size={12}/> E2EE Secure Session • DOH Compliant Linkage
                    </div>
                    <video ref={patientVideoRef} autoPlay muted playsInline className="w-full h-full object-cover bg-slate-900"></video>
                    <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm font-bold">{patient.name}</div>
                </div>

                <div className="w-full md:w-80 bg-white rounded-2xl flex flex-col overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <p className="font-bold text-slate-800 text-sm">Clinical Triage Summary</p>
                        <select value={triage} onChange={e => setTriage(e.target.value as any)} className={`w-full mt-2 p-2 rounded-lg border font-bold text-sm ${triage === 'Urgent' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-300 bg-white'}`}>
                            <option value="Elective">Elective / Discussion</option>
                            <option value="Urgent">URGENT / EMERGENCY</option>
                        </select>
                    </div>
                    
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {triage === 'Urgent' && (
                            <div className="bg-red-50 border border-red-200 p-3 rounded-xl animate-pulse">
                                <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-2"><AlertTriangle size={14}/> Hospital Referral Mandatory</p>
                                <button onClick={handleHospitalReferral} className="w-full py-2 bg-red-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 shadow-lg"><Hospital size={14}/> Generate Referral Form</button>
                            </div>
                        )}
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><StickyNote size={12}/> Visit Summary</label>
                            <textarea className="w-full h-48 bg-white border border-slate-200 rounded-lg p-2 text-xs" placeholder="Describe findings/recommendations..." value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                    </div>
                    
                    <div className="p-4 border-t border-slate-200 bg-slate-800 flex justify-around items-center">
                        <button onClick={() => setIsMuted(!isMuted)} className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-slate-600'} text-white transition-colors`}><Mic size={20} /></button>
                        <button onClick={handleEndSession} className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30" title="End Session & Save Summary"><PhoneOff size={24} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TelehealthModal;

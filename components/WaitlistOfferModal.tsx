import React, { useState, useEffect } from 'react';
import { Appointment, WaitlistEntry } from '../types';
import { useClinicalOps } from '../contexts/ClinicalOpsContext';
import { usePatient } from '../contexts/PatientContext';
import { useSettings } from '../contexts/SettingsContext';
import { useModal } from '../contexts/ModalContext';
import { useToast } from './ToastSystem';
import { X, Send, User, Clock, AlertCircle } from 'lucide-react';
import { formatSmsTemplate, sanitizeSmsContent, sendSms } from '../services/smsService';

interface WaitlistOfferModalProps {
    appointment: Appointment;
}

const WaitlistOfferModal: React.FC<WaitlistOfferModalProps> = ({ appointment }) => {
    const { waitlist } = useClinicalOps();
    const { patients } = usePatient();
    const { fieldSettings } = useSettings();
    const { hideModal } = useModal();
    const toast = useToast();

    const [matches, setMatches] = useState<WaitlistEntry[]>([]);
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        // Find waitlist entries that match the cancelled appointment's duration
        // and ideally the procedure type (though we can be flexible)
        const potentialMatches = waitlist.filter(entry => {
            // Basic matching: duration should fit within the cancelled slot
            const durationFits = entry.durationMinutes <= appointment.durationMinutes;
            return durationFits;
        }).sort((a, b) => {
            // Sort by priority first, then by duration (closest fit)
            const priorityWeight = { 'High': 3, 'Normal': 2, 'Low': 1 };
            if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
                return priorityWeight[b.priority] - priorityWeight[a.priority];
            }
            return Math.abs(appointment.durationMinutes - a.durationMinutes) - Math.abs(appointment.durationMinutes - b.durationMinutes);
        });

        setMatches(potentialMatches);
    }, [waitlist, appointment]);

    const handleSendOffer = async () => {
        if (!selectedEntryId) return;
        
        const entry = matches.find(m => m.id === selectedEntryId);
        if (!entry) return;

        const patient = patients.find(p => p.id === entry.patientId);
        if (!patient || !patient.phone) {
            toast.error("Patient does not have a valid phone number.");
            return;
        }

        setIsSending(true);
        try {
            // In a real app, this template would be configurable in fieldSettings
            const template = fieldSettings.smsTemplates['waitlist_offer'] || {
                text: "Hi {PatientName}, a {Duration}min slot just opened up on {Date} at {Time} for your {Procedure}. Reply YES to claim it or call us. - {ClinicName}",
                enabled: true
            };

            const data = {
                PatientName: patient.firstName || patient.name.split(' ')[0],
                ClinicName: fieldSettings.clinicName || 'Clinic',
                Date: appointment.date,
                Time: appointment.time,
                Procedure: entry.procedure,
                Duration: entry.durationMinutes.toString()
            };

            const msg = formatSmsTemplate(template.text, data);
            await sendSms(patient.phone, sanitizeSmsContent(msg), fieldSettings.smsConfig);
            
            toast.success(`Waitlist offer sent to ${patient.name}`);
            hideModal();
        } catch (error) {
            console.error(error);
            toast.error("Failed to send SMS offer.");
        } finally {
            setIsSending(false);
        }
    };

    if (matches.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Waitlist Matching</h2>
                    <button onClick={hideModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button>
                </div>
                <div className="p-8 text-center">
                    <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} className="text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium">No suitable waitlist matches found for this {appointment.durationMinutes}min slot.</p>
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button onClick={hideModal} className="px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors">Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-teal-50 p-6 border-b border-teal-100 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-teal-900 uppercase tracking-tight">Waitlist Matches Found</h2>
                    <p className="text-sm text-teal-700 mt-1">A {appointment.durationMinutes}min slot opened up. Select a patient to offer it to.</p>
                </div>
                <button onClick={hideModal} className="p-2 hover:bg-teal-200 rounded-full transition-colors"><X size={20} className="text-teal-700"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                <div className="space-y-3">
                    {matches.map(entry => {
                        const isSelected = selectedEntryId === entry.id;
                        return (
                            <div 
                                key={entry.id}
                                onClick={() => setSelectedEntryId(entry.id)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-teal-500 bg-teal-50 shadow-md' : 'border-slate-200 bg-white hover:border-teal-300'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${isSelected ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{entry.patientName}</h3>
                                            <p className="text-sm text-slate-600">{entry.procedure}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-sm font-bold text-slate-700 justify-end">
                                            <Clock size={14} /> {entry.durationMinutes} mins
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full mt-2 inline-block ${
                                            entry.priority === 'High' ? 'bg-red-100 text-red-700' : 
                                            entry.priority === 'Normal' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            {entry.priority} Priority
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-white flex justify-between items-center">
                <button onClick={hideModal} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button 
                    onClick={handleSendOffer}
                    disabled={!selectedEntryId || isSending}
                    className="px-8 py-3 bg-teal-600 text-white font-black rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {isSending ? 'Sending...' : 'Send SMS Offer'} <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default WaitlistOfferModal;

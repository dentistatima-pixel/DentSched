
import React, { useState, useMemo } from 'react';
import { X, Send, MessageSquare, Loader2 } from 'lucide-react';
import { Patient, CommunicationChannel, SmsTemplateConfig } from '../types';
import { usePatient } from '../contexts/PatientContext';
import { useSettings } from '../contexts/SettingsContext';
import { sanitizeSmsContent, sendSms } from '../services/smsService';
import { useToast } from './ToastSystem';

interface SendSmsModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    addCommunicationLog: (patientId: string, channel: CommunicationChannel, content: string) => Promise<void>;
}

const SendSmsModal: React.FC<SendSmsModalProps> = ({ isOpen, onClose, patientId, addCommunicationLog }) => {
    const { patients } = usePatient();
    const { fieldSettings } = useSettings();
    const toast = useToast();
    const [selectedTemplateId, setSelectedTemplateId] = useState('recall_due');
    const [isSending, setIsSending] = useState(false);

    const patient = patients.find(p => p.id === patientId);

    const smsTemplates = useMemo(() => {
        return Object.values(fieldSettings.smsTemplates).filter(
            // FIX: Explicitly type `t` to resolve type inference issue.
            (t: SmsTemplateConfig) => t.category === 'Reputation' || t.category === 'Logistics'
        );
    }, [fieldSettings.smsTemplates]);

    const selectedTemplate = useMemo(() => {
        return fieldSettings.smsTemplates[selectedTemplateId];
    }, [selectedTemplateId, fieldSettings.smsTemplates]);

    const messagePreview = useMemo(() => {
        if (!selectedTemplate || !patient) return '';
        let text = selectedTemplate.text;
        text = text.replace(/{PatientName}/g, patient.name.split(' ')[0]);
        text = text.replace(/{ClinicName}/g, fieldSettings.clinicName);
        // Replace other placeholders if they exist
        text = text.replace(/{Date}/g, '[Date]');
        text = text.replace(/{Time}/g, '[Time]');
        return text;
    }, [selectedTemplate, patient, fieldSettings.clinicName]);

    if (!isOpen || !patient) return null;

    const handleSend = async () => {
        const sanitizedMessage = sanitizeSmsContent(messagePreview);
        setIsSending(true);
        const result = await sendSms(patient.phone, sanitizedMessage, fieldSettings.smsConfig);
        if (result.success) {
            await addCommunicationLog(patientId, CommunicationChannel.SMS, `SENT: "${sanitizedMessage}"`);
            setIsSending(false);
            toast.success("SMS sent and logged.");
            onClose();
        } else {
            setIsSending(false);
            toast.error(`Failed to send SMS: ${result.error}`);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-lilac-100 p-3 rounded-xl text-lilac-700"><MessageSquare size={24} /></div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Send SMS</h2>
                            <p className="text-sm text-slate-500">To: {patient.name} ({patient.phone})</p>
                        </div>
                    </div>
                    <button onClick={onClose}><X size={24} className="text-slate-500" /></button>
                </div>
                <div className="p-8 space-y-4">
                    <div>
                        <label className="label">SMS Template</label>
                        <select 
                            value={selectedTemplateId} 
                            onChange={e => setSelectedTemplateId(e.target.value)}
                            className="input"
                        >
                            {smsTemplates.map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Message Preview (Sanitized for Privacy)</label>
                        <textarea 
                            value={sanitizeSmsContent(messagePreview)}
                            readOnly
                            className="input h-32 bg-slate-50"
                        />
                    </div>
                </div>
                <div className="p-8 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                    <button onClick={handleSend} disabled={isSending} className="px-8 py-4 bg-teal-600 text-white rounded-xl font-bold flex items-center gap-2">
                        {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {isSending ? 'Sending...' : 'Send Message'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendSmsModal;


import React, { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { Appointment, AppointmentStatus, Patient, RegistrationStatus, TriageLevel, RecallStatus } from '../types';
import { useModal } from '../contexts/ModalContext';
import { useAppointments } from '../contexts/AppointmentContext';
import { usePatient } from '../contexts/PatientContext';
import { useAppContext } from '../contexts/AppContext';
import { generateUid } from '../constants';
import { useToast } from './ToastSystem';
import { validateMobile } from '../services/validationService';

interface QuickTriageModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentBranch: string;
}

const QuickTriageModal: React.FC<QuickTriageModalProps> = ({ isOpen, onClose, currentBranch }) => {
    const { showModal } = useModal();
    const { handleSaveAppointment } = useAppointments();
    const { handleSavePatient } = usePatient();
    const { currentUser } = useAppContext();
    const toast = useToast();
    
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [complaint, setComplaint] = useState('');
    const [isEmergency, setIsEmergency] = useState(false);

    const resetState = () => {
        setName(''); setPhone(''); setComplaint(''); setIsEmergency(false);
    };

    const handleSubmit = async () => {
        if (!name || !complaint || !currentUser) return;

        const phoneError = validateMobile(phone);
        if (phoneError) {
            toast.error(phoneError);
            return;
        }

        const provisionalPatient: Partial<Patient> = {
            id: generateUid('p'),
            name: name,
            firstName: name.split(' ')[0],
            surname: name.split(' ').slice(1).join(' ') || name.split(' ')[0],
            phone: phone,
            registrationStatus: RegistrationStatus.PROVISIONAL,
            lastVisit: new Date().toISOString(),
            nextVisit: null,
            recallStatus: RecallStatus.DUE,
        };

        await handleSavePatient(provisionalPatient);

        const createAppointment = (emergencyConsentData?: any) => {
            const triageAppointment: Appointment = {
                id: generateUid('apt'),
                patientId: provisionalPatient.id!,
                providerId: currentUser.id,
                branch: currentBranch,
                date: new Date().toLocaleDateString('en-CA'),
                time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                durationMinutes: 30,
                type: complaint,
                status: AppointmentStatus.ARRIVED,
                triageLevel: isEmergency ? 'Level 1: Trauma/Bleeding' : 'Level 2: Acute Pain/Swelling',
                entryMode: 'MANUAL',
                emergencyConsent: emergencyConsentData,
            };
            handleSaveAppointment(triageAppointment);
            resetState();
            onClose();
        };

        if (isEmergency) {
            showModal('emergencyConsent', {
                patient: provisionalPatient,
                currentUser,
                onSave: (consentData: any) => {
                    createAppointment(consentData);
                }
            });
        } else {
            createAppointment();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col border-4 border-blue-200 animate-in zoom-in-95 overflow-hidden">
                <div className="p-6 border-b border-blue-100 bg-blue-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-xl text-blue-700"><Zap size={24}/></div>
                        <div>
                            <h2 className="text-xl font-black text-blue-900 uppercase tracking-tight">Unregistered Patient</h2>
                            <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">Walk-In Intake</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-blue-100 rounded-full transition-colors"><X size={24} className="text-blue-400" /></button>
                </div>

                <div className="p-8 space-y-6">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Patient Full Name *" className="input" />
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Contact Number" className="input" />
                    <input type="text" value={complaint} onChange={e => setComplaint(e.target.value)} placeholder="Chief Complaint *" className="input" />
                    <label className="flex items-center gap-4 p-4 bg-red-100 rounded-2xl border-2 border-red-200 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={isEmergency}
                            onChange={e => setIsEmergency(e.target.checked)}
                            className="w-6 h-6 accent-red-600 rounded-md"
                        />
                        <span className="text-sm font-black text-red-900 uppercase tracking-wider">Mark as Emergency</span>
                    </label>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                    <button onClick={handleSubmit} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-600/20 hover:scale-105 transition-all">
                        Add to Queue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickTriageModal;

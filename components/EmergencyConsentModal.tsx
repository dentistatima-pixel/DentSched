
import React, { useState } from 'react';
import { Patient, User, EmergencyTreatmentConsent } from '../types';
import { X, Zap, CheckCircle } from 'lucide-react';
import { useToast } from './ToastSystem';
import { useStaff } from '../contexts/StaffContext';

interface EmergencyConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (consentData: Omit<EmergencyTreatmentConsent, 'patientId'>) => void;
  patient: Patient;
  currentUser: User;
}

const EmergencyConsentModal: React.FC<EmergencyConsentModalProps> = ({
  isOpen, onClose, onSave, patient, currentUser
}) => {
    const { staff } = useStaff();
    const toast = useToast();
    const [narrative, setNarrative] = useState('');
    const [witnessId, setWitnessId] = useState('');

    if (!isOpen) return null;
    
    const clinicalStaff = staff.filter(s => s.id !== currentUser.id);

    const handleSubmit = () => {
        if (!narrative.trim() || !witnessId) {
            toast.error("Narrative and a witness are required for verbal consent documentation.");
            return;
        }

        const consentData: Omit<EmergencyTreatmentConsent, 'patientId'> = {
            emergencyType: 'Trauma', // Simplified for now
            triageLevel: 'Level 1: Trauma/Bleeding',
            verbalConsentGiven: true,
            verbalConsentWitnessId: witnessId,
            verbalConsentTimestamp: new Date().toISOString(),
            signatureObtainedPostTreatment: false, // This would be updated later
            emergencyNarrative: narrative,
            authorizingDentistId: currentUser.id,
            authorizingDentistSignature: 'PENDING_SEAL', // System would seal this
            authorizationTimestamp: new Date().toISOString(),
        };
        
        onSave(consentData);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-red-100 bg-red-50 flex items-center gap-4">
                    <Zap size={28} className="text-red-600" />
                    <div>
                        <h2 className="text-xl font-black text-red-900 uppercase tracking-tight">Emergency Protocol Consent</h2>
                        <p className="text-xs text-red-700 font-bold uppercase">Document Verbal Authorization</p>
                    </div>
                </div>
                <div className="p-8 space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Use this form to document verbal consent obtained for emergency treatment when a written signature is not immediately possible. This creates a time-stamped, witnessed record.
                    </p>
                    <div>
                        <label className="label text-xs">Emergency Narrative *</label>
                        <textarea value={narrative} onChange={e => setNarrative(e.target.value)} className="input h-24" placeholder="Briefly describe the emergency situation and the treatment rendered..."/>
                    </div>
                    <div>
                        <label className="label text-xs">Verbal Consent Witness (Staff) *</label>
                         <select value={witnessId} onChange={e => setWitnessId(e.target.value)} className="input">
                            <option value="">Select a witness...</option>
                            {clinicalStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="p-4 border-t bg-white flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                    <button onClick={handleSubmit} className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold flex items-center gap-2">
                        <CheckCircle size={20}/> Log Emergency Consent
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmergencyConsentModal;

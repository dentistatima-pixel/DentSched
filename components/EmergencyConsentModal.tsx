import React, { useState } from 'react';
import { Patient, User, EmergencyTreatmentConsent } from '../types';
import { X, Zap, CheckCircle, ShieldAlert, AlertTriangle, UserPlus } from 'lucide-react';
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
    const [stabilizationConfirmed, setStabilizationConfirmed] = useState(false);
    const [emergencyType, setEmergencyType] = useState<EmergencyTreatmentConsent['emergencyType']>('Trauma');

    if (!isOpen) return null;
    
    // Witness must be clinical staff other than the authorizing dentist
    const eligibleWitnesses = staff.filter(s => s.id !== currentUser.id);

    const handleSubmit = () => {
        if (!narrative.trim()) {
            toast.error("Clinical narrative is mandatory for emergency exceptions.");
            return;
        }
        if (!witnessId) {
            toast.error("A verbal witness (Staff) is required for forensic documentation.");
            return;
        }
        if (!stabilizationConfirmed) {
            toast.error("Stabilization commitment must be checked.");
            return;
        }

        const consentData: Omit<EmergencyTreatmentConsent, 'patientId'> = {
            emergencyType: emergencyType,
            triageLevel: 'Level 1: Trauma/Bleeding',
            verbalConsentGiven: true,
            verbalConsentWitnessId: witnessId,
            verbalConsentTimestamp: new Date().toISOString(),
            signatureObtainedPostTreatment: false, // Tracks the loop closure requirement
            emergencyNarrative: narrative,
            authorizingDentistId: currentUser.id,
            authorizingDentistSignature: `EMERGENCY_OVERRIDE_BY_${currentUser.id}`,
            authorizationTimestamp: new Date().toISOString(),
        };
        
        onSave(consentData);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[210] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 border-4 border-red-500 overflow-hidden">
                
                {/* Emergency Warning Header */}
                <div className="p-8 border-b border-red-100 bg-red-600 text-white flex items-center gap-5 shrink-0">
                    <div className="bg-white/20 p-4 rounded-3xl shadow-lg animate-pulse"><Zap size={36} /></div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Emergency Protocol Gate</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mt-1">Rule on Evidence: Medical Exception Log</p>
                    </div>
                </div>

                <div className="p-10 space-y-8 flex-1 overflow-y-auto no-scrollbar bg-slate-50/50">
                    
                    {/* Legal Guardrail Banner */}
                    <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[2rem] flex items-start gap-5 shadow-sm">
                        <ShieldAlert size={32} className="text-red-600 shrink-0 mt-1" />
                        <div className="space-y-2">
                            <h4 className="font-black text-red-900 uppercase text-xs tracking-widest">Medicolegal Notice</h4>
                            <p className="text-xs text-red-900 font-bold leading-relaxed">
                                Written informed consent may only be waived in extreme emergencies where immediate treatment is necessary to prevent death or serious health impairment. This record serves as the required exception documentation.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="label text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Emergency Category</label>
                            <select 
                                value={emergencyType} 
                                onChange={e => setEmergencyType(e.target.value as any)}
                                className="input h-16 text-lg font-black bg-white"
                            >
                                <option value="Trauma">Trauma / AVULSION</option>
                                <option value="Bleeding">UNCONTROLLED BLEEDING</option>
                                <option value="Severe Pain">SEVERE ACUTE PAIN</option>
                                <option value="Infection">ACUTE INFECTION / SWELLING</option>
                            </select>
                        </div>

                        <div>
                            <label className="label text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Clinical Narrative (Justification) *</label>
                            <textarea 
                                value={narrative} 
                                onChange={e => setNarrative(e.target.value)} 
                                className="input min-h-[150px] p-5 text-sm font-bold bg-white leading-relaxed" 
                                placeholder="State clearly the nature of the emergency and why written consent could not be obtained (e.g. Patient in extreme distress, trauma stabilization required)..."
                            />
                        </div>

                        <div>
                            <label className="label text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Verbal Consent Witness (Staff Member) *</label>
                            <div className="relative">
                                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                                <select 
                                    value={witnessId} 
                                    onChange={e => setWitnessId(e.target.value)} 
                                    className="input pl-12 h-16 font-bold bg-white"
                                >
                                    <option value="">Select a witness...</option>
                                    {eligibleWitnesses.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Loop-Closure Commitment Guardrail */}
                    <div className="pt-4">
                        <label className={`flex items-start gap-5 p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer ${stabilizationConfirmed ? 'bg-teal-50 border-teal-500 shadow-lg' : 'bg-white border-red-200'}`}>
                            <input 
                                type="checkbox" 
                                checked={stabilizationConfirmed}
                                onChange={e => setStabilizationConfirmed(e.target.checked)}
                                className="w-10 h-10 accent-teal-600 rounded-xl mt-1 shrink-0"
                            />
                            <div className="space-y-1">
                                <span className="text-sm font-black text-teal-900 uppercase tracking-tight block">Stabilization Commitment *</span>
                                <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                                    I certify that this treatment is an emergency exception. I commit to obtaining a verified digital signature immediately upon patient stabilization to close the clinical governance loop.
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-slate-100 bg-white flex gap-5 shrink-0">
                    <button onClick={onClose} className="flex-1 py-6 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={!stabilizationConfirmed || !witnessId || !narrative.trim()}
                        className={`flex-[2] py-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 ${stabilizationConfirmed && witnessId && narrative.trim() ? 'bg-red-600 text-white shadow-red-600/30 hover:bg-red-700 hover:scale-105 active:scale-95' : 'bg-slate-200 text-slate-400 grayscale opacity-50'}`}
                    >
                        <CheckCircle size={24}/> Authorize Emergency Protocol
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmergencyConsentModal;
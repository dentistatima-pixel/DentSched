
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Save, User, Shield, Lock, FileText, Heart, Users, Award, CheckCircle } from 'lucide-react';
import { Patient, FieldSettings, DentalChartEntry } from '../types';
import RegistrationBasicInfo from './RegistrationBasicInfo';
import RegistrationMedical from './RegistrationMedical';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import SignatureCaptureOverlay from './SignatureCaptureOverlay';
import { useToast } from './ToastSystem';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Partial<Patient>) => void;
  readOnly?: boolean;
  initialData?: Patient | null;
  fieldSettings: FieldSettings; 
  isKiosk?: boolean; 
  patients?: Patient[]; 
}

const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({ isOpen, onClose, onSave, readOnly = false, initialData = null, fieldSettings, isKiosk = false, patients = [] }) => {
  const toast = useToast();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  
  const initialFormState: Partial<Patient> = {
    id: '', sex: undefined, goodHealth: true, allergies: [], medicalConditions: [], reportedMedications: [], firstName: '', middleName: '', surname: '', suffix: '', dob: '', age: undefined, homeAddress: '', barangay: '', city: '', occupation: '', responsibleParty: '', fatherName: '', fatherOccupation: '', motherName: '', motherOccupation: '', guardian: '', guardianMobile: '', insuranceProvider: '', insuranceNumber: '', phone: '', mobile2: '', email: '', previousDentist: '', lastVisit: '', notes: '', otherAllergies: '', otherConditions: '', bloodGroup: '', medicalTreatmentDetails: '', seriousIllnessDetails: '', lastHospitalizationDetails: '', lastHospitalizationDate: '', medicationDetails: '', underMedicalTreatment: false, seriousIllness: false, takingMedications: false, tobaccoUse: false, alcoholDrugsUse: false, pregnant: false, nursing: false, birthControl: false, dpaConsent: false, marketingConsent: false, practiceCommConsent: false, clinicalMediaConsent: false, thirdPartyDisclosureConsent: false, thirdPartyAttestation: false,
    takingBloodThinners: false, takingBisphosphonates: false, heartValveIssues: false, tookBpMedicationToday: true, anesthesiaReaction: false, respiratoryIssues: false,
    isPwd: false, guardianIdType: '', guardianIdNumber: '', relationshipToPatient: '',
    dentalChart: [],
    registrationSignature: '',
    registrationSignatureTimestamp: ''
  };

  const [formData, setFormData] = useState<Partial<Patient>>(initialFormState);

  useEffect(() => {
    if (isOpen) {
        if (initialData) { 
            setFormData({ ...initialData }); 
        } 
        else { 
            const generatedId = Math.floor(10000000 + Math.random() * 90000000).toString(); 
            setFormData({ ...initialFormState, id: generatedId }); 
        }
    }
  }, [isOpen, initialData]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (readOnly) return;
    const { name, value, type } = e.target;
    setFormData(prev => {
        const newData = { ...prev };
        if (type === 'checkbox') { 
            const checked = (e.target as HTMLInputElement).checked; 
            (newData as any)[name] = checked; 
        } 
        else { 
            (newData as any)[name] = value; 
        }
        
        if (name === 'dob' && value) {
            const [year, month, day] = value.split('-').map(Number);
            const birthDate = new Date(year, month - 1, day);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            newData.age = Math.max(0, age);
        }
        return newData;
    });
  }, [readOnly]);

  const handleArrayChange = useCallback((category: 'allergies' | 'medicalConditions' | 'reportedMedications', value: string) => {
    if (readOnly) return;
    setFormData(prev => {
        const currentArray = (prev[category] as string[]) || [];
        const nextArray = currentArray.includes(value)
            ? currentArray.filter(item => item !== value)
            : [...currentArray, value];
        return { ...prev, [category]: nextArray };
    });
  }, [readOnly]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    
    if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
        document.activeElement.blur();
    }

    setTimeout(() => {
        setFormData(current => {
            if (!current.dpaConsent) { 
                toast.error("Compliance Error: You must accept the Data Privacy Consent."); 
                return current; 
            }

            if (!current.firstName) { toast.error("Missing Field: First Name is mandatory."); return current; }
            if (!current.surname) { toast.error("Missing Field: Surname is mandatory."); return current; }
            if (!current.phone) { toast.error("Missing Field: Mobile Number is mandatory."); return current; }

            if (!current.registrationSignature) {
              setShowSignaturePad(true);
              return current;
            }

            savePatientRecord(current);
            return current;
        });
    }, 100);
  };

  const savePatientRecord = (data: Partial<Patient>) => {
    const fullName = `${data.firstName || ''} ${data.middleName || ''} ${data.surname || ''}`.replace(/\s+/g, ' ').trim();
    onSave({ ...data, name: fullName });
    onClose();
  };

  const handleSignatureCaptured = (sig: string, hash: string) => {
    const timestamp = new Date().toISOString();
    const updatedData = { ...formData, registrationSignature: sig, registrationSignatureTimestamp: timestamp };
    setFormData(updatedData);
    setShowSignaturePad(false);
    toast.success("Identity Anchor Linked. Record Verified.");
    
    // Auto-save after signature
    setTimeout(() => savePatientRecord(updatedData), 500);
  };

  if (!isOpen) return null;

  return (
    <div className={isKiosk ? "w-full h-full bg-white flex flex-col" : "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-end md:items-center p-0 md:p-4"}>
      <div className={isKiosk ? "flex-1 flex flex-col h-full bg-white overflow-hidden" : "bg-white w-full md:max-w-5xl h-[95vh] md:h-[90vh] md:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-20 duration-300 overflow-hidden"}>
        
        {/* PDA Branding Header */}
        <div className={`flex flex-col md:flex-row justify-between items-center p-6 border-b border-teal-800 bg-teal-900 text-white shrink-0 ${!isKiosk && 'md:rounded-t-3xl'}`}>
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="bg-white p-2 rounded-xl shadow-lg border-2 border-teal-500">
                <Award size={32} className="text-teal-900" />
            </div>
            <div>
                <h1 className="text-xl font-black uppercase tracking-tighter leading-tight">Philippine Dental Association</h1>
                <h2 className="text-xs font-black text-teal-300 uppercase tracking-[0.3em]">Standard Patient Information Record</h2>
            </div>
          </div>
          {!isKiosk && (
            <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">DENTAL CHART</p>
                    <p className="text-[10px] font-black text-teal-100 uppercase tracking-widest">RA 9484 ARTICLE IV COMPLIANT</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
            </div>
          )}
        </div>

        {/* Mega-Form Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 no-scrollbar">
            <div className="max-w-4xl mx-auto space-y-12 pb-48">
                
                {/* Section Gate: Data Privacy */}
                <div className="bg-white border-2 border-teal-100 p-6 rounded-3xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3"><div className="p-2 bg-teal-50 rounded-xl text-teal-600"><Lock size={20} /></div><h3 className="font-bold text-lg text-slate-800">DPA Statutory Consent</h3></div>
                      {formData.registrationSignature && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-black uppercase border border-teal-200">
                          <CheckCircle size={14} /> Signature Verified
                        </div>
                      )}
                    </div>
                    <label className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer border-2 transition-all ${formData.dpaConsent ? 'bg-teal-50 border-teal-500' : 'bg-white border-slate-200'}`}>
                        <input type="checkbox" name="dpaConsent" checked={formData.dpaConsent} onChange={handleChange} className="w-6 h-6 accent-teal-600 rounded mt-1 shrink-0" />
                        <div><span className="font-extrabold text-teal-900 uppercase text-xs">Primary Data Processing Consent *</span><p className="text-xs text-slate-600 mt-1 leading-relaxed">I authorize the Philippine Dental Association standard processing of my personal and sensitive personal information for clinical care and diagnosis.</p></div>
                    </label>
                </div>

                <div className="space-y-16">
                    {/* Section I: Identity & II: Guardianship Integration */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b-4 border-teal-600 pb-2">
                            <Users size={24} className="text-teal-700"/>
                            <h3 className="text-2xl font-black text-teal-900 uppercase tracking-tighter">Section I & II. Patient Identity & Guardianship</h3>
                        </div>
                        <RegistrationBasicInfo formData={formData} handleChange={handleChange} readOnly={readOnly} fieldSettings={fieldSettings} patients={patients} />
                    </div>

                    {/* Section III-V: Medical/Physician */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b-4 border-lilac-600 pb-2">
                            <Heart size={24} className="text-lilac-700"/>
                            <h3 className="text-2xl font-black text-lilac-900 uppercase tracking-tighter">Section V & VI. Clinical Medical History</h3>
                        </div>
                        <RegistrationMedical formData={formData} handleChange={handleChange} handleArrayChange={handleArrayChange} readOnly={readOnly} fieldSettings={fieldSettings} />
                    </div>
                </div>
            </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0 z-50">
            <button onClick={onClose} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold uppercase text-xs tracking-widest">Cancel</button>
            {!readOnly && (
                <button onClick={handleSubmit} className="flex items-center gap-3 px-12 py-4 bg-teal-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-teal-700 transition-all">
                    <Save size={20} /> {formData.registrationSignature ? 'Save PDA Registry Entry' : 'Verify & Sign'}
                </button>
            )}
        </div>
      </div>
      <PrivacyPolicyModal isOpen={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} />
      <SignatureCaptureOverlay 
        isOpen={showSignaturePad} 
        onClose={() => setShowSignaturePad(false)} 
        onSave={handleSignatureCaptured}
        title="PDA Statutory Digital Sign-off"
        instruction="By signing below, you provide statutory consent for data processing and clinical care under RA 10173."
        themeColor="teal"
      />
    </div>
  );
};

export default PatientRegistrationModal;

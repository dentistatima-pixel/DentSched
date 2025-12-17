
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, User, Phone, FileText, Heart, Shield, Check, ToggleLeft, ToggleRight, Zap, Lock, BookOpen } from 'lucide-react';
import { Patient, FieldSettings } from '../types';
import RegistrationBasicInfo from './RegistrationBasicInfo';
import RegistrationMedical from './RegistrationMedical';
import RegistrationDental from './RegistrationDental';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import { useToast } from './ToastSystem';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Partial<Patient>) => void;
  readOnly?: boolean;
  initialData?: Patient | null;
  fieldSettings: FieldSettings; 
  isKiosk?: boolean; 
}

const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({ isOpen, onClose, onSave, readOnly = false, initialData = null, fieldSettings, isKiosk = false }) => {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState<string>('basic');
  const [isQuickReg, setIsQuickReg] = useState(true);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  
  // Refs for scrolling
  const basicRef = useRef<HTMLDivElement>(null);
  const medicalRef = useRef<HTMLDivElement>(null);
  const dentalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initial state with defaults
  const initialFormState: Partial<Patient> = {
    id: '',
    sex: undefined,
    goodHealth: true,
    allergies: [],
    medicalConditions: [],
    treatments: [],
    firstName: '',
    middleName: '',
    surname: '',
    suffix: '',
    treatmentDetails: {},
    dob: '',
    age: undefined,
    homeAddress: '',
    barangay: '',
    occupation: '',
    responsibleParty: '',
    fatherName: '',
    fatherOccupation: '',
    motherName: '',
    motherOccupation: '',
    guardian: '',
    guardianMobile: '',
    insuranceProvider: '',
    insuranceNumber: '',
    phone: '',
    mobile2: '',
    email: '',
    previousDentist: '',
    lastVisit: '',
    notes: '',
    otherAllergies: '',
    otherConditions: '',
    bloodGroup: '',
    medicalTreatmentDetails: '',
    seriousIllnessDetails: '',
    lastHospitalizationDetails: '',
    medicationDetails: '',
    underMedicalTreatment: false,
    seriousIllness: false,
    takingMedications: false,
    tobaccoUse: false,
    alcoholDrugsUse: false,
    pregnant: false,
    nursing: false,
    birthControl: false,
    dpaConsent: false,
    marketingConsent: false
  };

  const [formData, setFormData] = useState<Partial<Patient>>(initialFormState);

  // Generate ID and Reset form when opened
  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            // Edit Mode
            setFormData({ ...initialData });
            setIsQuickReg(false); 
        } else {
            // New Mode
            const generatedId = Math.floor(10000000 + Math.random() * 90000000).toString();
            setFormData({
                ...initialFormState,
                id: generatedId
            });
            setIsQuickReg(true);
        }
        
        if (isKiosk) {
            setIsQuickReg(false);
        }

        setActiveSection('basic');
    }
  }, [isOpen, initialData, isKiosk]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (readOnly) return;
    const { name, value, type } = e.target;
    
    setFormData(prev => {
        const newData = { ...prev };
        
        if (type === 'checkbox') {
             const checked = (e.target as HTMLInputElement).checked;
             (newData as any)[name] = checked;
        } else {
            (newData as any)[name] = value;
        }

        // Auto-calculate age if DOB changes
        if (name === 'dob') {
            if (value) {
                const [year, month, day] = value.split('-').map(Number);
                const birthDate = new Date(year, month - 1, day);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                newData.age = Math.max(0, age);
            } else {
                newData.age = undefined;
            }
        }
        
        return newData;
    });
  };

  const handleArrayChange = (category: 'allergies' | 'medicalConditions' | 'treatments', value: string) => {
    if (readOnly) return;
    setFormData(prev => {
      if (value === 'None') {
          const wasSelected = (prev[category] || []).includes('None');
          return { ...prev, [category]: wasSelected ? [] : ['None'] };
      }
      let currentList = prev[category] || [];
      if (currentList.includes('None')) currentList = [];

      if (currentList.includes(value)) {
        return { ...prev, [category]: currentList.filter(item => item !== value) };
      } else {
        return { ...prev, [category]: [...currentList, value] };
      }
    });
  };

  const handleTreatmentSelect = (value: string) => {
      if (readOnly) return;
      setFormData(prev => ({ ...prev, treatments: value ? [value] : [] }));
  };

  const handleTreatmentDetailChange = (proc: string, value: string) => {
    if (readOnly) return;
    setFormData(prev => ({
        ...prev,
        treatmentDetails: { ...prev.treatmentDetails, [proc]: value }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    // LEGAL COMPLIANCE
    if (!formData.dpaConsent && !isQuickReg) {
        toast.error("Compliance Error: Patient must accept the Privacy Policy to proceed.");
        return;
    }
    if (!formData.firstName || !formData.surname || !formData.phone) {
        toast.error("First Name, Surname, and Mobile Number are required.");
        return;
    }

    const fullName = `${formData.firstName || ''} ${formData.middleName || ''} ${formData.surname || ''}`.replace(/\s+/g, ' ').trim();
    
    onSave({ ...formData, name: fullName, provisional: isQuickReg });
    onClose();
  };

  const scrollToSection = (section: string) => {
      setActiveSection(section);
      let ref = basicRef;
      if (section === 'medical') ref = medicalRef;
      if (section === 'dental') ref = dentalRef;
      
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!isOpen) return null;

  const containerClasses = isKiosk 
     ? "w-full h-full bg-white flex flex-col"
     : "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-end md:items-center p-0 md:p-4";

  const modalClasses = isKiosk
     ? "flex-1 flex flex-col h-full bg-white overflow-hidden"
     : "bg-white w-full md:max-w-4xl h-[95vh] md:h-[90vh] md:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-20 duration-300 overflow-hidden";

  return (
    <div className={containerClasses}>
      <div className={modalClasses}>
        
        {/* Header */}
        <div className={`flex justify-between items-center p-4 md:p-6 border-b border-slate-100 bg-teal-900 text-white shrink-0 ${!isKiosk && 'md:rounded-t-3xl'}`}>
          <div className="flex items-center gap-3">
            <div className="bg-lilac-500 p-2 rounded-xl shadow-lg shadow-lilac-500/20">
               <User size={24} className="text-white" />
            </div>
            <div>
               <h2 className="text-xl font-bold">{isKiosk ? 'My Information' : (initialData ? 'Edit Patient' : 'New Patient')}</h2>
               <p className="text-teal-200 text-xs hidden md:block">
                   {isKiosk ? 'Please review your details.' : (isQuickReg ? 'Quick Registration Mode' : 'Full Clinical Registration')}
               </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
              {!initialData && !isKiosk && (
                  <button 
                    onClick={() => setIsQuickReg(!isQuickReg)}
                    className="flex items-center gap-2 bg-teal-800 hover:bg-teal-700 px-3 py-1.5 rounded-full transition-colors border border-teal-600"
                  >
                      {isQuickReg ? <Zap size={16} className="text-yellow-300"/> : <FileText size={16} className="text-teal-300"/>}
                      <span className="text-xs font-bold uppercase">{isQuickReg ? 'Quick' : 'Full'}</span>
                  </button>
              )}
              {!isKiosk && (
                  <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <X size={24} />
                  </button>
              )}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 scroll-smooth">
            <form id="patientForm" onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
                
                <div ref={basicRef}><RegistrationBasicInfo formData={formData} handleChange={handleChange} readOnly={readOnly} fieldSettings={fieldSettings} /></div>

                {!isQuickReg && (
                    <>
                        <div ref={medicalRef}><RegistrationMedical formData={formData} handleChange={handleChange} handleArrayChange={handleArrayChange} readOnly={readOnly} fieldSettings={fieldSettings} /></div>
                        <div ref={dentalRef}><RegistrationDental formData={formData} handleChange={handleChange} handleArrayChange={handleArrayChange} handleTreatmentSelect={handleTreatmentSelect} handleTreatmentDetailChange={handleTreatmentDetailChange} readOnly={readOnly} fieldSettings={fieldSettings} /></div>

                        {/* LEGAL & CONSENT SECTION */}
                        <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <Lock size={20} />
                                <h3 className="font-bold text-lg">Data Privacy & Consent</h3>
                            </div>
                            <div className="space-y-4">
                                <label className="flex items-start gap-3 p-4 bg-slate-700 rounded-lg cursor-pointer border border-slate-600 has-[:checked]:border-teal-400 has-[:checked]:bg-teal-900/50 transition-all">
                                    <input type="checkbox" name="dpaConsent" checked={formData.dpaConsent} onChange={handleChange} className="w-5 h-5 accent-teal-500 rounded mt-1 shrink-0" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-teal-300">Privacy Policy (Required) *</span>
                                            <button 
                                                type="button" 
                                                onClick={(e) => { e.preventDefault(); setShowPrivacyPolicy(true); }}
                                                className="text-xs bg-slate-600 px-2 py-0.5 rounded hover:bg-slate-500 flex items-center gap-1"
                                            >
                                                <BookOpen size={10} /> Read Policy
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-300 mt-1">I consent to the collection and processing of my personal and medical data in accordance with the Data Privacy Act of 2012.</p>
                                    </div>
                                </label>
                                <label className="flex items-start gap-3 p-4 bg-slate-700 rounded-lg cursor-pointer border border-slate-600 has-[:checked]:border-teal-400 has-[:checked]:bg-teal-900/50 transition-all">
                                    <input type="checkbox" name="marketingConsent" checked={formData.marketingConsent} onChange={handleChange} className="w-5 h-5 accent-teal-500 rounded mt-1 shrink-0" />
                                    <div>
                                        <span className="font-bold">Communications (Optional)</span>
                                        <p className="text-xs text-slate-300 mt-1">I agree to receive SMS/email reminders, promotions, and other non-essential communications from the clinic.</p>
                                    </div>
                                </label>
                            </div>
                            
                            {/* DPO Footer */}
                            <div className="mt-6 pt-4 border-t border-slate-600 text-xs text-slate-400 flex flex-col gap-1">
                                <span className="font-bold uppercase tracking-wider text-slate-500">Data Protection Officer (DPO) Contact:</span>
                                <span>Atty. Compliance Officer</span>
                                <span>dpo@dentsched-clinic.com | (02) 8888-1234</span>
                            </div>
                        </div>
                    </>
                )}
            </form>
        </div>

        {/* Sticky Footer Actions */}
        <div className={`p-4 border-t border-slate-200 bg-white shrink-0 flex justify-between items-center z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] ${!isKiosk && 'md:rounded-b-3xl'}`}>
             {!isQuickReg ? (
                <div className="hidden md:flex gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
                    <button onClick={() => scrollToSection('basic')} className={`hover:text-teal-600 ${activeSection === 'basic' ? 'text-teal-600' : ''}`}>Profile</button>
                    <span>•</span>
                    <button onClick={() => scrollToSection('medical')} className={`hover:text-teal-600 ${activeSection === 'medical' ? 'text-teal-600' : ''}`}>Medical</button>
                    <span>•</span>
                    <button onClick={() => scrollToSection('dental')} className={`hover:text-teal-600 ${activeSection === 'dental' ? 'text-teal-600' : ''}`}>Dental</button>
                </div>
             ) : <div />}
            
            <div className="flex gap-2">
                 {(readOnly || isKiosk) && (
                     <button onClick={onClose} className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all">
                        {isKiosk ? 'Cancel' : 'Close'}
                    </button>
                 )}
                 {!readOnly && (
                    <button onClick={handleSubmit} className="flex items-center gap-2 px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 hover:scale-105 transition-all">
                        <Save size={20} /> 
                        {isKiosk ? 'Save Changes' : (isQuickReg ? 'Quick Register' : 'Save Full Record')}
                    </button>
                 )}
            </div>
        </div>
      </div>
      
      {/* Privacy Policy Modal Layer */}
      <PrivacyPolicyModal isOpen={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} />

      <style>{`
        .input { width: 100%; padding: 0.75rem 1rem; background-color: white; border: 1px solid #e2e8f0; border-radius: 0.75rem; outline: none; transition: all 0.2s; }
        .input:focus { border-color: #0d9488; box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.1); }
        .label { display: block; font-size: 0.875rem; font-weight: 600; color: #334155; margin-bottom: 0.375rem; }
      `}</style>
    </div>
  );
};

export default PatientRegistrationModal;



import React, { useState, useEffect, useRef } from 'react';
import { X, Save, User, Phone, FileText, Heart, Shield, Check, ToggleLeft, ToggleRight, Zap } from 'lucide-react';
import { Patient, FieldSettings } from '../types';
import RegistrationBasicInfo from './RegistrationBasicInfo';
import RegistrationMedical from './RegistrationMedical';
import RegistrationDental from './RegistrationDental';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Partial<Patient>) => void;
  readOnly?: boolean;
  initialData?: Patient | null;
  fieldSettings: FieldSettings; 
  isKiosk?: boolean; // New Prop for Kiosk Mode
}

const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({ isOpen, onClose, onSave, readOnly = false, initialData = null, fieldSettings, isKiosk = false }) => {
  const [activeSection, setActiveSection] = useState<string>('basic');
  const [isQuickReg, setIsQuickReg] = useState(true); // Default to Quick Mode for speed
  
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
    birthControl: false
  };

  const [formData, setFormData] = useState<Partial<Patient>>(initialFormState);

  // Generate ID and Reset form when opened
  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            // Edit Mode
            setFormData({ ...initialData });
            // In Kiosk mode, force full edit if editing, or rely on passed prop logic below
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
        
        // KIOSK OVERRIDE: If kiosk, force "Quick" off so they see everything in one go? Or keep quick?
        // Actually, if Kiosk + InitialData (Update Info), we want them to see Medical/Dental primarily.
        // Let's force isQuickReg to false in Kiosk mode to ensure they review everything.
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
             if ((e.target as HTMLInputElement).name === 'pregnant' || 
                 (e.target as HTMLInputElement).name === 'nursing' || 
                 (e.target as HTMLInputElement).name === 'birthControl' ||
                 (e.target as HTMLInputElement).name === 'tobaccoUse' ||
                 (e.target as HTMLInputElement).name === 'alcoholDrugsUse' ||
                 (e.target as HTMLInputElement).name === 'goodHealth') {
                 (newData as any)[name] = (e.target as HTMLInputElement).checked;
             }
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
    const fullName = `${formData.firstName || ''} ${formData.middleName || ''} ${formData.surname || ''}`.replace(/\s+/g, ' ').trim();
    // Force provisional false on full save
    onSave({ ...formData, name: fullName, provisional: false });
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

  // In Kiosk mode, we remove the fixed positioning overlay because it's rendered inside KioskView's container
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
              {/* Quick Toggle (Hidden in Kiosk) */}
              {(!initialData && !isKiosk) && (
                  <button 
                    onClick={() => setIsQuickReg(!isQuickReg)}
                    className="flex items-center gap-2 bg-teal-800 hover:bg-teal-700 px-3 py-1.5 rounded-full transition-colors border border-teal-600"
                  >
                      {isQuickReg ? <ToggleLeft size={20} className="text-teal-300"/> : <ToggleRight size={20} className="text-lilac-300"/>}
                      <span className="text-xs font-bold uppercase">{isQuickReg ? 'Quick Reg' : 'Full Reg'}</span>
                  </button>
              )}
              {/* Close Button (Optional in Kiosk, usually handled by footer) */}
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
                
                {/* SECTION 1: PROFILE & CONTACT (Merged) */}
                <div ref={basicRef} className="scroll-mt-6">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                        <User className="text-teal-600" size={20} />
                        <h3 className="font-bold text-lg text-slate-800">Patient Profile</h3>
                    </div>
                    <RegistrationBasicInfo 
                        formData={formData} 
                        handleChange={handleChange} 
                        readOnly={readOnly}
                        fieldSettings={fieldSettings}
                        isQuickReg={isQuickReg} // Passed down to hide extra fields
                    />
                </div>

                {/* SECTION 2: MEDICAL (Conditional) */}
                {!isQuickReg && (
                    <div ref={medicalRef} className="scroll-mt-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2 pt-4">
                            <Heart className="text-red-500" size={20} />
                            <h3 className="font-bold text-lg text-slate-800">Medical History</h3>
                        </div>
                        <RegistrationMedical 
                            formData={formData} 
                            handleChange={handleChange} 
                            handleArrayChange={handleArrayChange}
                            readOnly={readOnly}
                            fieldSettings={fieldSettings}
                        />
                    </div>
                )}

                {/* SECTION 3: DENTAL (Conditional) */}
                {!isQuickReg && (
                    <div ref={dentalRef} className="scroll-mt-6 animate-in fade-in slide-in-from-bottom-4">
                         <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2 pt-4">
                            <Shield className="text-blue-500" size={20} />
                            <h3 className="font-bold text-lg text-slate-800">Dental History</h3>
                        </div>
                        <RegistrationDental 
                            formData={formData}
                            handleChange={handleChange}
                            handleArrayChange={handleArrayChange}
                            handleTreatmentSelect={handleTreatmentSelect}
                            handleTreatmentDetailChange={handleTreatmentDetailChange}
                            readOnly={readOnly}
                            fieldSettings={fieldSettings}
                        />
                    </div>
                )}
            </form>
        </div>

        {/* Sticky Footer Actions */}
        <div className={`p-4 border-t border-slate-200 bg-white shrink-0 flex justify-between items-center z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] ${!isKiosk && 'md:rounded-b-3xl'}`}>
            <div className="flex gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
                 {!isQuickReg && (
                     <>
                        <button onClick={() => scrollToSection('basic')} className={`hover:text-teal-600 ${activeSection === 'basic' ? 'text-teal-600' : ''}`}>Profile</button>
                        <span>•</span>
                        <button onClick={() => scrollToSection('medical')} className={`hover:text-teal-600 ${activeSection === 'medical' ? 'text-teal-600' : ''}`}>Medical</button>
                        <span>•</span>
                        <button onClick={() => scrollToSection('dental')} className={`hover:text-teal-600 ${activeSection === 'dental' ? 'text-teal-600' : ''}`}>Dental</button>
                     </>
                 )}
            </div>
            
            <div className="flex gap-2">
                 {/* In Kiosk mode, we might want a cancel button to return to dashboard without saving */}
                 {(readOnly || isKiosk) && (
                     <button 
                        onClick={onClose}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                    >
                        {isKiosk ? 'Cancel' : 'Close'}
                    </button>
                 )}
                 {!readOnly && (
                    <button 
                        onClick={handleSubmit}
                        className="flex items-center gap-2 px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 hover:scale-105 transition-all"
                    >
                        <Save size={20} /> 
                        {isKiosk ? 'Save Changes' : (isQuickReg ? 'Quick Register' : 'Save Full Record')}
                    </button>
                 )}
            </div>
        </div>
      </div>
      
      <style>{`
        .input {
            width: 100%;
            padding: 0.75rem 1rem;
            background-color: white;
            border: 1px solid #e2e8f0;
            border-radius: 0.75rem;
            outline: none;
            transition: all 0.2s;
        }
        .input:focus {
            border-color: #0d9488;
            box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.1);
        }
        .label {
            display: block;
            font-size: 0.875rem;
            font-weight: 600;
            color: #334155;
            margin-bottom: 0.375rem;
        }
      `}</style>
    </div>
  );
};

export default PatientRegistrationModal;

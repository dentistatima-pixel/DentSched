import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, FileText, Heart, Shield, ArrowRight, ArrowLeft, Check } from 'lucide-react';
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
  fieldSettings: FieldSettings; // Added prop
}

const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({ isOpen, onClose, onSave, readOnly = false, initialData = null, fieldSettings }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  
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
            // Edit Mode: Load existing data
            setFormData({ ...initialData });
        } else {
            // New Mode: Generate ID and reset
            const generatedId = Math.floor(10000000 + Math.random() * 90000000).toString();
            setFormData({
                ...initialFormState,
                id: generatedId
            });
        }
        setActiveTab(0);
    }
  }, [isOpen, initialData]);

  const steps = [
    { id: 0, label: 'Basic Info', icon: User },
    { id: 1, label: 'Contact', icon: Phone },
    { id: 2, label: 'Medical History', icon: Heart },
    { id: 3, label: 'Dental History', icon: Shield }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (readOnly) return;
    const { name, value, type } = e.target;
    
    setFormData(prev => {
        const newData = { ...prev };
        
        if (type === 'checkbox') {
             // Handle boolean vs array vs radio logic
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
      // Special logic for "None" to make it exclusive
      if (value === 'None') {
          const wasSelected = (prev[category] || []).includes('None');
          return { ...prev, [category]: wasSelected ? [] : ['None'] };
      }

      let currentList = prev[category] || [];
      // If adding a normal item, remove 'None'
      if (currentList.includes('None')) {
          currentList = [];
      }

      if (currentList.includes(value)) {
        return { ...prev, [category]: currentList.filter(item => item !== value) };
      } else {
        return { ...prev, [category]: [...currentList, value] };
      }
    });
  };

  const handleTreatmentSelect = (value: string) => {
      if (readOnly) return;
      setFormData(prev => ({
          ...prev,
          treatments: value ? [value] : []
      }));
  };

  const handleTreatmentDetailChange = (proc: string, value: string) => {
    if (readOnly) return;
    setFormData(prev => ({
        ...prev,
        treatmentDetails: {
            ...prev.treatmentDetails,
            [proc]: value
        }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    const fullName = `${formData.firstName || ''} ${formData.middleName || ''} ${formData.surname || ''}`.replace(/\s+/g, ' ').trim();
    
    // Explicitly set provisional to false when saving from full form
    onSave({ ...formData, name: fullName, provisional: false });
    onClose();
  };

  const nextStep = () => setActiveTab(Math.min(activeTab + 1, steps.length - 1));
  const prevStep = () => setActiveTab(Math.max(activeTab - 1, 0));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-end md:items-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-4xl h-[95vh] md:h-[90vh] md:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-20 duration-300 overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-slate-100 bg-teal-900 text-white md:rounded-t-3xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-lilac-500 p-2 rounded-xl">
               <User size={24} className="text-white" />
            </div>
            <div>
               <h2 className="text-xl font-bold">{initialData ? 'Edit Patient' : 'New Patient Registration'}</h2>
               <p className="text-teal-200 text-xs hidden md:block">Please fill in all details carefully</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Progress Stepper */}
        <div className="bg-slate-50 border-b border-slate-200 overflow-x-auto shrink-0">
          <div className="flex md:grid md:grid-cols-4 min-w-max md:min-w-0">
             {steps.map((step, idx) => {
                 const isActive = activeTab === idx;
                 const isCompleted = activeTab > idx;
                 return (
                     <button 
                        key={step.id} 
                        onClick={() => setActiveTab(idx)}
                        className={`flex items-center gap-2 p-4 border-b-2 transition-colors min-w-[140px] md:min-w-0
                            ${isActive ? 'border-teal-600 text-teal-700 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}
                        `}
                     >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                            ${isActive ? 'bg-teal-600 text-white' : isCompleted ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-500'}
                        `}>
                            {isCompleted ? <Check size={16} /> : idx + 1}
                        </div>
                        <span className="font-medium text-sm whitespace-nowrap">{step.label}</span>
                     </button>
                 );
             })}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
            <form id="patientForm" onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                
                {activeTab === 0 && (
                    <RegistrationBasicInfo 
                        formData={formData} 
                        handleChange={handleChange} 
                        readOnly={readOnly}
                        fieldSettings={fieldSettings} // Passed down
                    />
                )}

                {activeTab === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-teal-50 p-6 rounded-2xl border border-teal-100 flex flex-col items-center text-center">
                            <Phone className="w-12 h-12 text-teal-600 mb-3" />
                            <h3 className="font-bold text-teal-900 text-lg">Contact Information</h3>
                            <p className="text-teal-700 text-sm">How can we reach this patient?</p>
                        </div>

                        <div>
                            <label className="label">Mobile Number *</label>
                            <input disabled={readOnly} required type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className="input text-lg font-mono disabled:bg-slate-100" placeholder="0912 345 6789" />
                        </div>
                        <div>
                            <label className="label">Secondary Mobile (Optional)</label>
                            <input disabled={readOnly} type="tel" name="mobile2" value={formData.mobile2 || ''} onChange={handleChange} className="input text-lg font-mono disabled:bg-slate-100" />
                        </div>
                        <div>
                            <label className="label">Email Address</label>
                            <input disabled={readOnly} type="email" name="email" value={formData.email || ''} onChange={handleChange} className="input disabled:bg-slate-100" placeholder="patient@example.com" />
                        </div>
                    </div>
                )}

                {activeTab === 2 && (
                    <RegistrationMedical 
                        formData={formData} 
                        handleChange={handleChange} 
                        handleArrayChange={handleArrayChange}
                        readOnly={readOnly}
                        fieldSettings={fieldSettings} // Passed down
                    />
                )}

                {activeTab === 3 && (
                    <RegistrationDental 
                        formData={formData}
                        handleChange={handleChange}
                        handleArrayChange={handleArrayChange}
                        handleTreatmentSelect={handleTreatmentSelect}
                        handleTreatmentDetailChange={handleTreatmentDetailChange}
                        readOnly={readOnly}
                        fieldSettings={fieldSettings} // Passed down
                    />
                )}

            </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white md:rounded-b-3xl shrink-0 flex justify-between items-center z-20">
            <button 
                onClick={prevStep}
                disabled={activeTab === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
                <ArrowLeft size={20} /> Back
            </button>
            
            <div className="flex gap-2">
                {activeTab < steps.length - 1 ? (
                    <button 
                        onClick={nextStep}
                        className="flex items-center gap-2 px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 hover:scale-105 transition-all"
                    >
                        Next <ArrowRight size={20} />
                    </button>
                ) : (
                    !readOnly && (
                        <button 
                            onClick={handleSubmit}
                            className="flex items-center gap-2 px-8 py-3 bg-lilac-600 text-white rounded-xl font-bold shadow-lg shadow-lilac-600/20 hover:bg-lilac-700 hover:scale-105 transition-all"
                        >
                            <Save size={20} /> {initialData ? 'Update Record' : 'Complete Registration'}
                        </button>
                    )
                )}
                 {readOnly && activeTab === steps.length - 1 && (
                     <button 
                        onClick={onClose}
                        className="flex items-center gap-2 px-8 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all"
                    >
                        <X size={20} /> Close
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
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default PatientRegistrationModal;
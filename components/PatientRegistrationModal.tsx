
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Save, User, Shield, Lock, FileText, Heart, Users, Award, CheckCircle, Scale, AlertTriangle, Activity, ArrowLeft, ArrowRight, FileSearch } from 'lucide-react';
import { Patient, FieldSettings, RegistrationStatus } from '../types';
import RegistrationBasicInfo from './RegistrationBasicInfo';
import RegistrationMedical from './RegistrationMedical';
import RegistrationDental from './RegistrationDental';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import SignatureCaptureOverlay from './SignatureCaptureOverlay';
import { useToast } from './ToastSystem';
import { generateUid, calculateAge, formatDate } from '../constants';
import { validatePatient } from '../services/validationService';
import { useSettings } from '../contexts/SettingsContext';
import { usePatient } from '../contexts/PatientContext';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { FormStatusIndicator } from './FormStatusIndicator';
import CryptoJS from 'crypto-js';


interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Partial<Patient>) => Promise<void>;
  readOnly?: boolean;
  initialData?: Patient | null;
  isKiosk?: boolean; 
  currentBranch?: string;
}

const stepsInfo = [
    { id: 1, label: "Consent & Identity", icon: FileText },
    { id: 2, label: "Medical History", icon: Heart },
    { id: 3, label: "Dental History", icon: Activity },
    { id: 4, label: "Review Summary", icon: FileSearch },
    { id: 5, label: "Finalize & Sign", icon: CheckCircle }
];

const RegistrationSummary: React.FC<{ formData: Partial<Patient>, fieldSettings: FieldSettings }> = ({ formData, fieldSettings }) => {
    const summaryData = useMemo(() => {
        const data: { label: string, value: any, section: string }[] = [];
        
        // Identity
        data.push({ label: 'Full Name', value: `${formData.firstName} ${formData.middleName || ''} ${formData.surname}`, section: 'Identity' });
        data.push({ label: 'Date of Birth', value: formatDate(formData.dob), section: 'Identity' });
        data.push({ label: 'Sex', value: formData.sex, section: 'Identity' });
        
        // Contact
        data.push({ label: 'Mobile', value: formData.phone, section: 'Contact' });
        data.push({ label: 'Email', value: formData.email, section: 'Contact' });
        data.push({ label: 'Address', value: `${formData.homeAddress}, ${formData.barangay}, ${formData.city}`, section: 'Contact' });
        
        // Medical
        data.push({ label: 'Allergies', value: (formData.allergies || []).join(', ') || 'None', section: 'Medical' });
        data.push({ label: 'Medical Conditions', value: (formData.medicalConditions || []).join(', ') || 'None', section: 'Medical' });
        
        // Registry Answers
        Object.entries(formData.registryAnswers || {}).forEach(([key, value]) => {
            if (!key.endsWith('_details') && !key.endsWith('_date')) {
                data.push({ label: key.replace('*',''), value: value, section: 'Medical Questionnaire' });
                if (value === 'Yes') {
                    if (formData.registryAnswers?.[`${key}_details`]) data.push({ label: `${key.replace('*','')} Details`, value: formData.registryAnswers[`${key}_details`], section: 'Medical Questionnaire'});
                    if (formData.registryAnswers?.[`${key}_date`]) data.push({ label: `${key.replace('*','')} Date`, value: formatDate(formData.registryAnswers[`${key}_date`]), section: 'Medical Questionnaire'});
                }
            }
        });

        return data.filter(d => d.value);
    }, [formData]);

    const sections = Array.from(new Set(summaryData.map(d => d.section)));

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in fade-in duration-500">
            <h3 className="text-xl font-black text-slate-800 mb-2">Record Summary for Verification</h3>
            <p className="text-sm text-slate-500 mb-8">Please review all the information you have provided. This compiled record will be sealed by your signature.</p>
            {sections.map(section => (
                <div key={section} className="mb-6">
                    <h4 className="font-bold text-sm text-teal-700 uppercase tracking-widest border-b-2 border-teal-100 pb-2 mb-4">{section}</h4>
                    <div className="space-y-3">
                        {summaryData.filter(d => d.section === section).map((item, index) => (
                            <div key={index} className="grid grid-cols-3 gap-4 text-sm p-2 rounded-lg hover:bg-slate-50">
                                <span className="font-bold text-slate-500 col-span-1">{item.label}:</span>
                                <span className="font-medium text-slate-800 col-span-2">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};


const useRegistrationWorkflow = ({ initialData, onSave, onClose, currentBranch, readOnly }: {
  initialData: Patient | null;
  onSave: (patient: Partial<Patient>) => Promise<void>;
  onClose: () => void;
  currentBranch?: string;
  readOnly?: boolean;
}) => {
  const toast = useToast();
  const { fieldSettings } = useSettings();
  const { patients } = usePatient();
  
  const [step, setStep] = useState(1);
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isViewingConsent, setIsViewingConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string> | null>(null);
  
  const [draftId] = useState(() => `new-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);

  const initialFormState: Partial<Patient> = useMemo(() => ({
    id: '', sex: undefined, allergies: [], medicalConditions: [], firstName: '', middleName: '', surname: '', suffix: '', dob: '', homeAddress: '', barangay: '', city: '', occupation: '', responsibleParty: '', insuranceProvider: '', insuranceNumber: '', insuranceEffectiveDate: '', phone: '', email: '', previousDentist: '', lastVisit: '', notes: '', otherAllergies: '', otherConditions: '', bloodGroup: '', medicalTreatmentDetails: '', seriousIllnessDetails: '', lastHospitalizationDetails: '', lastHospitalizationDate: '', medicationDetails: '', dpaConsent: false, marketingConsent: false, practiceCommConsent: false, clinicalMediaConsent: undefined, thirdPartyDisclosureConsent: false, thirdPartyAttestation: false,
    isPwd: false, dentalChart: [], perioChart: [], registrationSignature: '', registrationSignatureTimestamp: '', registryAnswers: {}, customFields: {}, registrationStatus: RegistrationStatus.PROVISIONAL
  }), []);

  const [formData, setFormData] = useState<Partial<Patient>>(initialFormState);

  const formPersistenceId = `patient-reg-${initialData?.id || draftId}`;
  const { formStatus, clearSavedDraft } = useFormPersistence<Partial<Patient>>(
    formPersistenceId,
    formData,
    setFormData,
    readOnly,
    initialData
  );
  
  const generalConsent = useMemo(() => fieldSettings.consentFormTemplates.find(t => t.id === 'GENERAL_AUTHORIZATION'), [fieldSettings.consentFormTemplates]);

  useEffect(() => {
    setStep(1);
    
    if (initialData) {
        // EDIT mode: Populate with initialData.
        setFormData({ ...initialFormState, ...initialData });
    } else {
        // NEW mode: reset the form state to prevent showing stale data from a previous edit session.
        // The `useFormPersistence` hook will then try to restore a draft if one exists for a new patient.
        setFormData({
            ...initialFormState,
            id: generateUid('p'),
            registrationBranch: currentBranch,
        });
    }
  }, [initialData, currentBranch, initialFormState]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (readOnly) return;
    setErrors(null);
    const { name, value, type } = e.target;
    setFormData(prev => {
        const newData = { ...prev };
        if (type === 'checkbox') { 
            const checked = (e.target as HTMLInputElement).checked; 
            if (name === 'clinicalMediaConsent') {
                if(checked) {
                    newData.clinicalMediaConsent = {
                        generalConsent: true,
                        consentVersion: fieldSettings.currentPrivacyVersion,
                        consentTimestamp: new Date().toISOString(),
                        consentSignature: '', 
                        permissions: { 
                            intraoralPhotos: true,
                            extraoralPhotos: true,
                            xrays: true,
                            videography: false,
                            caseStudyUse: false,
                            marketingUse: false,
                            thirdPartySharing: false,
                        },
                        mediaCapturedLogs: []
                    };
                } else {
                    newData.clinicalMediaConsent = undefined;
                }
            } else {
                (newData as any)[name] = checked;
            }
        } else { 
            (newData as any)[name] = value; 
        }
        return newData;
    });
  }, [readOnly, fieldSettings.currentPrivacyVersion]);

  const handleCustomChange = useCallback((fieldName: string, value: any, type: 'text' | 'checklist' | 'boolean') => {
      if (readOnly) return;
      setErrors(null);
      setFormData(prev => {
          const newCustomFields = { ...(prev.customFields || {}) };
          if (type === 'checklist') {
              const currentValues = (newCustomFields[fieldName] as string[] || []);
              const isChecked = currentValues.includes(value);
              if (isChecked) {
                  newCustomFields[fieldName] = currentValues.filter(v => v !== value);
              } else {
                  newCustomFields[fieldName] = [...currentValues, value];
              }
          } else {
              newCustomFields[fieldName] = value;
          }
          return { ...prev, customFields: newCustomFields };
      });
  }, [readOnly]);

  const handleRegistryChange = useCallback((newRegistryAnswers: Record<string, any>) => {
    if (readOnly) return;
    setErrors(null);
    setFormData(prev => ({ ...prev, registryAnswers: { ...prev.registryAnswers, ...newRegistryAnswers } }));
  }, [readOnly]);

  const handleArrayChange = useCallback((category: 'allergies' | 'medicalConditions', value: string) => {
    if (readOnly) return;
    setErrors(null);
    setFormData(prev => ({...prev, [category]: (prev[category] as string[] || []).includes(value) ? (prev[category] as string[]).filter(item => item !== value) : [...(prev[category] as string[] || []), value]}));
  }, [readOnly]);

  const savePatientRecord = async (data: Partial<Patient>) => {
    setIsSaving(true);
    try {
        const fullName = `${data.firstName || ''} ${data.middleName || ''} ${data.surname || ''}`.replace(/\s+/g, ' ').trim();
        await onSave({ ...data, name: fullName, registrationStatus: RegistrationStatus.COMPLETE });
        clearSavedDraft();
        onClose();
    } catch (error) {
    } finally {
        setIsSaving(false);
    }
  };

  const handleSignatureCaptured = async (sig: string, hash: string) => {
    const timestamp = new Date().toISOString();
    const photoHash = hash;
    const finalHash = CryptoJS.SHA256(photoHash + sig).toString();
    const updatedData = { ...formData, registrationSignature: sig, registrationSignatureTimestamp: timestamp, registrationPhotoHash: finalHash };
    setFormData(updatedData);
    toast.success("Identity Anchor Linked. Record Verified.");
    await savePatientRecord(updatedData);
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
        const validationErrors = validatePatient(formData, fieldSettings);
        if (validationErrors) {
            setErrors(validationErrors);
            toast.error("Please fill in all required fields, highlighted in red.");
            return false;
        }
    }
    setErrors(null);
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
        setAnimationDirection('forward');
        setStep(s => Math.min(s + 1, stepsInfo.length));
    }
  };

  const handleBack = () => {
      setAnimationDirection('backward');
      setStep(s => Math.max(s - 1, 1));
  };
  
  return {
      step, animationDirection, formData, isSaving, formStatus,
      showPrivacyPolicy, setShowPrivacyPolicy,
      isViewingConsent, setIsViewingConsent,
      generalConsent, fieldSettings, patients, errors,
      handleChange, handleCustomChange, handleRegistryChange, handleArrayChange,
      handleNext, handleBack, handleSignatureCaptured,
      setStep,
  };
};


const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({ isOpen, onClose, onSave, readOnly = false, initialData = null, isKiosk = false, currentBranch }) => {
  const workflow = useRegistrationWorkflow({ initialData, onSave, onClose, currentBranch, readOnly });
  const { 
      step, animationDirection, formData, isSaving, formStatus,
      showPrivacyPolicy, setShowPrivacyPolicy,
      isViewingConsent, setIsViewingConsent,
      generalConsent, fieldSettings, patients, errors,
      handleChange, handleCustomChange, handleRegistryChange, handleArrayChange,
      handleNext, handleBack, handleSignatureCaptured, setStep
  } = workflow;
  
  if (!isOpen || !fieldSettings) return null;

  return (
    <div className={isKiosk ? "w-full h-full bg-white flex flex-col" : "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4"}>
      <div className={isKiosk ? "flex-1 flex flex-col h-full bg-white overflow-hidden" : "bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-20 duration-300 overflow-hidden"}>
        
        {/* Refactored Slim Header Stepper */}
        <div className={`flex items-center justify-between h-14 px-6 border-b border-teal-800 bg-teal-900 text-white shrink-0 ${!isKiosk && 'rounded-t-3xl'}`}>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-teal-800 rounded-lg flex items-center justify-center font-black text-[10px] shadow-inner text-teal-400">DS</div>
             <h2 className="text-[10px] font-black uppercase tracking-widest hidden md:block opacity-60">Standard Patient Record</h2>
          </div>
          
          <div className="flex items-center gap-2">
            {stepsInfo.map((s, index) => {
              const isActive = step === s.id;
              const isPast = step > s.id;
              
              return (
                <React.Fragment key={s.id}>
                    {index > 0 && <div className={`w-4 h-0.5 rounded-full transition-colors duration-500 ${isActive || isPast ? 'bg-teal-400' : 'bg-teal-800'}`} />}
                    <button 
                        onClick={() => setStep(s.id)}
                        className={`flex items-center gap-2 transition-all duration-300 rounded-full py-1 ${isActive ? 'bg-white px-3 text-teal-900 shadow-lg scale-105' : 'text-teal-600 hover:text-teal-400'}`}
                    >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${isActive ? 'bg-teal-900 text-white' : isPast ? 'bg-teal-500 text-white' : 'bg-teal-800 text-teal-700'}`}>
                            {isPast ? <CheckCircle size={12} /> : s.id}
                        </div>
                        {isActive && <span className="text-[10px] font-black uppercase tracking-tight whitespace-nowrap">{s.label}</span>}
                    </button>
                </React.Fragment>
              )
            })}
          </div>

          <div className="flex items-center gap-4">
             {!isKiosk && (
                <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                    <X size={18} />
                </button>
             )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 no-scrollbar">
            <div className="max-w-4xl mx-auto space-y-12 pb-12">
                {step === 1 && (
                     <div key={1} className={animationDirection === 'forward' ? 'wizard-step-enter' : 'wizard-step-enter-back'}>
                        <div className="bg-white border-2 border-teal-100 p-8 rounded-[2.5rem] shadow-sm space-y-8">
                            <RegistrationBasicInfo formData={formData} handleChange={handleChange} handleCustomChange={handleCustomChange} onRegistryChange={handleRegistryChange} readOnly={readOnly} fieldSettings={fieldSettings} patients={patients} errors={errors} />
                            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-100">
                               <label className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer border-2 transition-all ${formData.dpaConsent ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-white'} ${errors?.dpaConsent ? 'border-red-500 ring-2 ring-red-200' : 'border-slate-200'}`}>
                                    <input type="checkbox" name="dpaConsent" checked={!!formData.dpaConsent} onChange={handleChange} className="w-8 h-8 accent-teal-600 rounded mt-1 shrink-0" />
                                    <div><span className="font-black text-teal-950 uppercase text-[10px] tracking-widest flex items-center gap-1"><Lock size={12}/> RA 10173 DPA CONSENT *</span><p className="text-[11px] text-slate-600 mt-1 font-bold">I authorize the standard processing of my personal data for clinical diagnosis and treatment planning.</p></div>
                               </label>
                               <label className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all ${formData.clinicalMediaConsent ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-white'} ${errors?.clinicalMediaConsent ? 'border-red-500 ring-2 ring-red-200' : 'border-slate-200'}`}>
                                    <input type="checkbox" name="clinicalMediaConsent" checked={!!formData.clinicalMediaConsent} onChange={handleChange} className="w-8 h-8 accent-teal-600 rounded mt-1 shrink-0" />
                                    <div>
                                        <span className="font-black text-teal-950 uppercase text-[10px] tracking-widest flex items-center gap-1"><Scale size={12}/> TREATMENT AUTHORIZATION *</span>
                                        <p className="text-[11px] text-slate-600 mt-1 font-bold">
                                            I certify that I have read the <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsViewingConsent(true); }} className="text-teal-600 underline font-black">General Authorization</button> and agree to the terms of clinical care and liability.
                                        </p>
                                    </div>
                               </label>
                            </div>
                        </div>
                    </div>
                )}
                {step === 2 && <div key={2} className={animationDirection === 'forward' ? 'wizard-step-enter' : 'wizard-step-enter-back'}><RegistrationMedical formData={formData} handleChange={handleChange} onCustomChange={handleCustomChange} registryAnswers={formData.registryAnswers || {}} onRegistryChange={handleRegistryChange} allergies={formData.allergies || []} onAllergyChange={handleArrayChange} medicalConditions={formData.medicalConditions || []} onConditionChange={handleArrayChange} readOnly={readOnly} fieldSettings={fieldSettings} /></div>}
                {step === 3 && <div key={3} className={animationDirection === 'forward' ? 'wizard-step-enter' : 'wizard-step-enter-back'}><RegistrationDental formData={formData} handleChange={handleChange} readOnly={readOnly} fieldSettings={fieldSettings} registryAnswers={formData.registryAnswers || {}} onRegistryChange={handleRegistryChange} /></div>}
                {step === 4 && <RegistrationSummary formData={formData} fieldSettings={fieldSettings} />}
                {step === 5 && (
                    <div key={5} className={animationDirection === 'forward' ? 'wizard-step-enter' : 'wizard-step-enter-back'}>
                        <SignatureCaptureOverlay 
                            isOpen={true} 
                            onClose={onClose} 
                            onSave={handleSignatureCaptured}
                            title="Finalize & Sign"
                            instruction="Please review the summary of your information above. Your signature below legally binds this record, including your consent to our Data Privacy Policy and terms of treatment."
                            themeColor="teal"
                            contextSummary={<RegistrationSummary formData={formData} fieldSettings={fieldSettings} />}
                        />
                    </div>
                )}
            </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-white/80 backdrop-blur-md shrink-0 flex justify-between items-center z-10">
            <div className="flex items-center gap-4">
                <button type="button" onClick={handleBack} disabled={step === 1} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-50 flex items-center gap-2"><ArrowLeft size={16}/> Back</button>
                <FormStatusIndicator status={formStatus} />
            </div>
            
            {step < stepsInfo.length ? (
                 <button type="button" onClick={handleNext} className="px-12 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                    {step === stepsInfo.length - 1 ? 'Proceed to Signature' : 'Next Step'} <ArrowRight size={16}/>
                 </button>
            ) : (
                <div/>
            )}
        </div>
      </div>

      {isViewingConsent && generalConsent && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[80vh]">
                  <div className="p-6 border-b flex justify-between items-center">
                      <h3 className="font-bold text-lg">{generalConsent.name}</h3>
                      <button onClick={() => setIsViewingConsent(false)}><X/></button>
                  </div>
                  <div className="p-8 overflow-y-auto text-sm text-slate-600">
                      <p style={{ whiteSpace: 'pre-wrap' }}>{generalConsent.content_en}</p>
                  </div>
                  <div className="p-4 border-t flex justify-end">
                      <button onClick={() => setIsViewingConsent(false)} className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold">Close</button>
                  </div>
              </div>
          </div>
      )}

      {showPrivacyPolicy && <PrivacyPolicyModal isOpen={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} />}
    </div>
  );
};

export default PatientRegistrationModal;

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Save, User, Shield, Lock, FileText, Heart, Users, Award, CheckCircle, Scale, AlertTriangle, Activity, ArrowLeft, ArrowRight, FileSearch, Eraser } from 'lucide-react';
import { Patient, FieldSettings, DentalChartEntry, PerioMeasurement, RegistrationStatus, ClinicalMediaConsent, TreatmentStatus } from '../types';
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
import { ActionButton } from './ActionButton';
import { FormStatusIndicator, FormStatus } from './FormStatusIndicator';
import { useModal } from '../contexts/ModalContext';
import { Odontogram } from './Odontogram';


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
    { id: 4, label: "Baseline Charting", icon: Award },
    { id: 5, label: "Review Summary", icon: FileSearch },
    { id: 6, label: "Finalize & Sign", icon: CheckCircle }
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
  
  const initialFormState: Partial<Patient> = useMemo(() => ({
    id: '', sex: undefined, allergies: [], medicalConditions: [], firstName: '', middleName: '', surname: '', suffix: '', dob: '', homeAddress: '', barangay: '', city: '', occupation: '', responsibleParty: '', insuranceProvider: '', insuranceNumber: '', phone: '', email: '', previousDentist: '', lastVisit: '', notes: '', otherAllergies: '', otherConditions: '', bloodGroup: '', medicalTreatmentDetails: '', seriousIllnessDetails: '', lastHospitalizationDetails: '', lastHospitalizationDate: '', medicationDetails: '', dpaConsent: false, marketingConsent: false, practiceCommConsent: false, clinicalMediaConsent: undefined, thirdPartyDisclosureConsent: false, thirdPartyAttestation: false,
    isPwd: false, dentalChart: [], perioChart: [], registrationSignature: '', registrationSignatureTimestamp: '', registryAnswers: {}, customFields: {}, registrationStatus: RegistrationStatus.PROVISIONAL
  }), []);

  const [formData, setFormData] = useState<Partial<Patient>>(initialFormState);

  const { formStatus, clearSavedDraft } = useFormPersistence<Partial<Patient>>(
    `patient-reg-${initialData?.id || 'new'}`,
    formData,
    setFormData,
    readOnly
  );
  
  const generalConsent = useMemo(() => fieldSettings.consentFormTemplates.find(t => t.id === 'GENERAL_AUTHORIZATION'), [fieldSettings.consentFormTemplates]);

  useEffect(() => {
    if (initialData) {
        setFormData({ ...initialFormState, ...initialData });
    } else {
        const generatedId = generateUid('p');
        setFormData({ ...initialFormState, id: generatedId, registrationBranch: currentBranch });
    }
    setStep(1);
  }, [initialData, currentBranch, initialFormState]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (readOnly) return;
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
                        consentSignature: '', // to be captured later
                        permissions: { // Default permissions
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
    setFormData(prev => ({ ...prev, registryAnswers: { ...prev.registryAnswers, ...newRegistryAnswers } }));
  }, [readOnly]);

  const handleArrayChange = useCallback((category: 'allergies' | 'medicalConditions', value: string) => {
    if (readOnly) return;
    setFormData(prev => ({...prev, [category]: (prev[category] as string[] || []).includes(value) ? (prev[category] as string[]).filter(item => item !== value) : [...(prev[category] as string[] || []), value]}));
  }, [readOnly]);
  
  const handleChartUpdate = useCallback((entry: DentalChartEntry) => {
    if (readOnly) return;
    setFormData(prev => {
        const existingChart = prev.dentalChart || [];
        const isNew = !existingChart.some(e => e.id === entry.id);

        let nextChart: DentalChartEntry[];

        if (isNew) {
            const baselineEntry: DentalChartEntry = { ...entry, isBaseline: true, status: ['Missing', 'Extraction'].some(p => entry.procedure.includes(p)) ? entry.status : 'Existing' };
            nextChart = [...existingChart, baselineEntry];
        } else {
            // Find and remove if it exists (toggle)
            const existingEntry = existingChart.find(e => e.toothNumber === entry.toothNumber && e.procedure === entry.procedure && e.surfaces === entry.surfaces);
            if(existingEntry) {
                 nextChart = existingChart.filter(e => e.id !== existingEntry.id);
            } else {
                 const baselineEntry: DentalChartEntry = { ...entry, isBaseline: true, status: ['Missing', 'Extraction'].some(p => entry.procedure.includes(p)) ? entry.status : 'Existing' };
                 nextChart = [...existingChart, baselineEntry];
            }
        }

        return { ...prev, dentalChart: nextChart };
    });
  }, [readOnly]);

  const savePatientRecord = async (data: Partial<Patient>) => {
    setIsSaving(true);
    try {
        const fullName = `${data.firstName || ''} ${data.middleName || ''} ${data.surname || ''}`.replace(/\s+/g, ' ').trim();
        await onSave({ ...data, name: fullName, registrationStatus: RegistrationStatus.COMPLETE });
        clearSavedDraft();
        onClose();
    } catch (error) {
        // Error toast is handled by dataContext
    } finally {
        setIsSaving(false);
    }
  };

  const handleSignatureCaptured = async (sig: string, hash: string) => {
    const timestamp = new Date().toISOString();
    const updatedData = { ...formData, registrationSignature: sig, registrationSignatureTimestamp: timestamp, registrationPhotoHash: hash };
    setFormData(updatedData);
    toast.success("Identity Anchor Linked. Record Verified.");
    await savePatientRecord(updatedData);
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
        const errors = validatePatient(formData);
        if (errors) {
            Object.values(errors).forEach(e => toast.error(e));
            return false;
        }
    }
    // Add validation for other steps if needed
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
      generalConsent, fieldSettings, patients,
      handleChange, handleCustomChange, handleRegistryChange, handleArrayChange, handleChartUpdate,
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
      generalConsent, fieldSettings, patients,
      handleChange, handleCustomChange, handleRegistryChange, handleArrayChange, handleChartUpdate,
      handleNext, handleBack, handleSignatureCaptured, setStep
  } = workflow;
  
  const [signatureData, setSignatureData] = useState<string | null>(null);

  if (!isOpen || !fieldSettings) return null;
  
  const handleFinalSubmit = () => {
      if(signatureData) {
          workflow.handleSignatureCaptured(signatureData, 'dummy-hash'); // Replace with real witness hash
      }
  };

  return (
    <div className={isKiosk ? "w-full h-full bg-white flex flex-col" : "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4"}>
      <div className={isKiosk ? "flex-1 flex flex-col h-full bg-white overflow-hidden" : "bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-20 duration-300 overflow-hidden"}>
        
        <div className={`flex flex-col p-6 border-b border-teal-800 bg-teal-900 text-white shrink-0 ${!isKiosk && 'rounded-t-3xl'}`}>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black uppercase tracking-tighter">Standard Patient Information Record</h2>
            {!isKiosk && <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>}
          </div>
          {/* Progress Bar */}
          <div className="flex items-center mt-4">
            {stepsInfo.map((s, index) => (
                <React.Fragment key={s.id}>
                    <button onClick={() => setStep(s.id)} className={`flex flex-col items-center text-center transition-all duration-500 ${step >= s.id ? 'text-white' : 'text-teal-600'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${step > s.id ? 'bg-teal-500 border-teal-400' : step === s.id ? 'bg-white border-teal-400 scale-110 shadow-2xl' : 'bg-teal-800 border-teal-700'}`}>
                            <s.icon size={20} className={step === s.id ? 'text-teal-900' : 'text-white'} />
                        </div>
                        <p className={`text-[10px] font-black uppercase mt-2 w-24 ${step === s.id ? 'text-white' : 'text-teal-400'}`}>{s.label}</p>
                    </button>
                    {index < stepsInfo.length - 1 && <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-500 ${step > s.id ? 'bg-teal-400' : 'bg-teal-700'}`} />}
                </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 no-scrollbar">
            <div className="max-w-4xl mx-auto space-y-12 pb-12">
                {step === 1 && (
                     <div key={1} className={animationDirection === 'forward' ? 'wizard-step-enter' : 'wizard-step-enter-back'}>
                        <div className="bg-white border-2 border-teal-100 p-8 rounded-[2.5rem] shadow-sm space-y-8">
                            <RegistrationBasicInfo formData={formData} handleChange={handleChange} handleCustomChange={() => {}} readOnly={readOnly} fieldSettings={fieldSettings} patients={patients} />
                            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-100">
                               <label className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer border-2 transition-all ${formData.dpaConsent ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-white border-slate-200'}`}>
                                    <input type="checkbox" name="dpaConsent" checked={!!formData.dpaConsent} onChange={handleChange} className="w-8 h-8 accent-teal-600 rounded mt-1 shrink-0" />
                                    <div><span className="font-black text-teal-950 uppercase text-[10px] tracking-widest flex items-center gap-1"><Lock size={12}/> RA 10173 DPA CONSENT *</span><p className="text-[11px] text-slate-600 mt-1 font-bold">I authorize the standard processing of my personal data for clinical diagnosis and treatment planning.</p></div>
                               </label>
                               <label className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all ${formData.clinicalMediaConsent ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-white border-slate-200'}`}>
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
                {step === 2 && <div key={2} className={animationDirection === 'forward' ? 'wizard-step-enter' : 'wizard-step-enter-back'}><RegistrationMedical formData={formData} onCustomChange={handleCustomChange} registryAnswers={formData.registryAnswers || {}} onRegistryChange={handleRegistryChange} allergies={formData.allergies || []} onAllergyChange={handleArrayChange} medicalConditions={formData.medicalConditions || []} onConditionChange={handleArrayChange} readOnly={readOnly} fieldSettings={fieldSettings} /></div>}
                {step === 3 && <div key={3} className={animationDirection === 'forward' ? 'wizard-step-enter' : 'wizard-step-enter-back'}><RegistrationDental formData={formData} handleChange={handleChange} readOnly={readOnly} fieldSettings={fieldSettings} registryAnswers={formData.registryAnswers || {}} onRegistryChange={handleRegistryChange} /></div>}
                {step === 4 && (
                    <div key={4} className={animationDirection === 'forward' ? 'wizard-step-enter' : 'wizard-step-enter-back'}>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 mb-2">Baseline Charting</h3>
                            <p className="text-sm text-slate-500 mb-8">Use the tools to mark existing conditions, missing teeth, and prior work. This will be saved as the patient's baseline odontogram.</p>
                            <Odontogram
                                chart={formData.dentalChart || []}
                                onChartUpdate={handleChartUpdate}
                                readOnly={readOnly}
                                onToothClick={() => {}}
                            />
                        </div>
                    </div>
                )}
                {step === 5 && <RegistrationSummary formData={formData} fieldSettings={fieldSettings} />}
                {step === 6 && (
                    <div key={6} className={animationDirection === 'forward' ? 'wizard-step-enter' : 'wizard-step-enter-back'}>
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



import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Save, User, Shield, Lock, FileText, Heart, Users, Award, CheckCircle, Scale, AlertTriangle, Activity, ArrowLeft, ArrowRight } from 'lucide-react';
import { Patient, FieldSettings, DentalChartEntry, PerioMeasurement } from '../types';
import RegistrationBasicInfo from './RegistrationBasicInfo';
// Fix: Change to named import for RegistrationMedical to resolve module export issue.
import { RegistrationMedical } from './RegistrationMedical';
import RegistrationDental from './RegistrationDental';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import SignatureCaptureOverlay from './SignatureCaptureOverlay';
import { useToast } from './ToastSystem';
// Fix: Removed unused import 'PDA_INFORMED_CONSENT_TEXTS' which was causing an error.
import { generateUid } from '../constants';
import { validatePatient } from '../services/validationService';
import { useSettings } from '../contexts/SettingsContext';
import { usePatient } from '../contexts/PatientContext';

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
    { id: 5, label: "Finalize & Sign", icon: CheckCircle }
];

const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({ isOpen, onClose, onSave, readOnly = false, initialData = null, isKiosk = false, currentBranch }) => {
  const toast = useToast();
  const { fieldSettings } = useSettings();
  const { patients } = usePatient();
  
  const [step, setStep] = useState(1);
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isViewingConsent, setIsViewingConsent] = useState(false);
  
  const initialFormState: Partial<Patient> = {
    id: '', sex: undefined, allergies: [], medicalConditions: [], firstName: '', middleName: '', surname: '', suffix: '', dob: '', age: undefined, homeAddress: '', barangay: '', city: '', occupation: '', responsibleParty: '', insuranceProvider: '', insuranceNumber: '', phone: '', email: '', previousDentist: '', lastVisit: '', notes: '', otherAllergies: '', otherConditions: '', bloodGroup: '', medicalTreatmentDetails: '', seriousIllnessDetails: '', lastHospitalizationDetails: '', lastHospitalizationDate: '', medicationDetails: '', dpaConsent: false, marketingConsent: false, practiceCommConsent: false, clinicalMediaConsent: false, thirdPartyDisclosureConsent: false, thirdPartyAttestation: false,
    isPwd: false, dentalChart: [], perioChart: [], registrationSignature: '', registrationSignatureTimestamp: '', registryAnswers: {}, customFields: {}, registrationStatus: 'Provisional'
  };

  const [formData, setFormData] = useState<Partial<Patient>>(initialFormState);
  
  const generalConsent = useMemo(() => fieldSettings.consentFormTemplates.find(t => t.id === 'GENERAL_AUTHORIZATION'), [fieldSettings.consentFormTemplates]);


  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setFormData({ ...initialFormState, ...initialData });
        } else {
            const generatedId = generateUid('p');
            setFormData({ ...initialFormState, id: generatedId, registrationBranch: currentBranch });
        }
        setStep(1); // Reset to first step when modal opens
    }
  }, [isOpen, initialData, currentBranch]);


  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (readOnly) return;
    const { name, value, type } = e.target;
    setFormData(prev => {
        const newData = { ...prev };
        if (type === 'checkbox') { 
            (newData as any)[name] = (e.target as HTMLInputElement).checked; 
        } else { 
            (newData as any)[name] = value; 
        }
        if (name === 'dob' && value) {
            const age = new Date().getFullYear() - new Date(value).getFullYear();
            newData.age = Math.max(0, age);
        }
        return newData;
    });
  }, [readOnly]);

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

  const handleRegistryChange = (newRegistryAnswers: Record<string, any>) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, registryAnswers: newRegistryAnswers }));
  };

  const handleArrayChange = useCallback((category: 'allergies' | 'medicalConditions', value: string) => {
    if (readOnly) return;
    setFormData(prev => ({...prev, [category]: (prev[category] as string[] || []).includes(value) ? (prev[category] as string[]).filter(item => item !== value) : [...(prev[category] as string[] || []), value]}));
  }, [readOnly]);

  const handlePerioChange = (toothNumber: number, index: number, value: string) => {
    if (readOnly) return;
    const numVal = value === '' ? null : parseInt(value);
    if (numVal !== null && (isNaN(numVal) || numVal < 0 || numVal > 15)) return;

    setFormData(prev => {
        let toothMeasurement = (prev.perioChart || []).find(m => m.toothNumber === toothNumber) || { toothNumber, pocketDepths: Array(6).fill(null), recession: Array(6).fill(null), bleeding: Array(6).fill(false), mobility: null };
        const newDepths = [...toothMeasurement.pocketDepths];
        newDepths[index] = numVal;
        const updatedMeasurement = { ...toothMeasurement, pocketDepths: newDepths, date: new Date().toISOString().split('T')[0] };
        const newChart = [...(prev.perioChart || []).filter(m => m.toothNumber !== toothNumber), updatedMeasurement];
        return { ...prev, perioChart: newChart };
    });
  };

  const savePatientRecord = async (data: Partial<Patient>) => {
    setIsSaving(true);
    try {
        const fullName = `${data.firstName || ''} ${data.middleName || ''} ${data.surname || ''}`.replace(/\s+/g, ' ').trim();
        await onSave({ ...data, name: fullName, registrationStatus: 'Complete' });
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
    setShowSignaturePad(false);
    toast.success("Identity Anchor Linked. Record Verified.");
    await savePatientRecord(updatedData);
  };
  
  const handleFinalSubmit = async () => {
    if (readOnly || isSaving) return;
    if (!formData.registrationSignature) {
      setShowSignaturePad(true);
      return;
    }
    await savePatientRecord(formData);
  };

  const validateStep = (currentStep: number) => {
    const errors: string[] = [];
    if (currentStep === 1) {
        if (!formData.firstName?.trim() || !formData.surname?.trim()) errors.push("First Name and Surname are required.");
        if (!formData.phone?.trim()) errors.push("Mobile Number is required.");
        if (!/^(09)\d{9}$/.test(formData.phone?.trim() || '')) errors.push("Please enter a valid 11-digit mobile number.");
        if (!formData.dpaConsent) errors.push("DPA Consent is mandatory.");
        if (!formData.clinicalMediaConsent) errors.push("Treatment Authorization is mandatory.");
    }
    // Add validation for other steps if needed
    if (errors.length > 0) {
        errors.forEach(e => toast.error(e));
        return false;
    }
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


  if (!isOpen || !fieldSettings) return null;

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
                    <div className={`flex flex-col items-center text-center transition-all duration-500 ${step >= s.id ? 'text-white' : 'text-teal-600'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${step > s.id ? 'bg-teal-500 border-teal-400' : step === s.id ? 'bg-white border-teal-400 scale-110 shadow-2xl' : 'bg-teal-800 border-teal-700'}`}>
                            <s.icon size={20} className={step === s.id ? 'text-teal-900' : 'text-white'} />
                        </div>
                        <p className={`text-[10px] font-black uppercase mt-2 w-24 ${step === s.id ? 'text-white' : 'text-teal-400'}`}>{s.label}</p>
                    </div>
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
                            <RegistrationBasicInfo formData={formData} handleChange={handleChange} handleCustomChange={handleCustomChange} readOnly={readOnly} fieldSettings={fieldSettings} patients={patients} />
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
                {step === 3 && <div key={3} className={animationDirection === 'forward' ? 'wizard-step-enter' : 'wizard-step-enter-back'}><RegistrationDental formData={formData} handleChange={handleChange} readOnly={readOnly} /></div>}
                {step === 4 && (
                    <div key={4} className={animationDirection === 'forward' ? 'wizard-step-enter' : 'wizard-step-enter-back'}>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-x-auto">
                            <p className="text-xs text-slate-500 mb-4 font-bold">Enter pocket depths for Ramfjord index teeth to establish a baseline. Leave blank if not applicable.</p>
                            <table className="w-full text-center">
                                <thead><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="p-2">Tooth</th><th className="p-2">Distobuccal</th><th className="p-2">Mid-Buccal</th><th className="p-2">Mesiobuccal</th><th className="p-2">Distolingual</th><th className="p-2">Mid-Lingual</th><th className="p-2">Mesiolingual</th></tr></thead>
                                <tbody>
                                    {[16, 21, 24, 36, 41, 44].map(toothNum => (
                                        <tr key={toothNum}>
                                            <td className="p-2 font-black text-lg text-slate-700">{toothNum}</td>
                                            {[0,1,2,3,4,5].map(i => (
                                                <td key={i} className="p-1"><input type="number" value={formData.perioChart?.find(p => p.toothNumber === toothNum)?.pocketDepths[i] ?? ''} onChange={(e) => handlePerioChange(toothNum, i, e.target.value)} min="0" max="15" className="input h-12 w-16 text-center font-black text-lg"/></td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {step === 5 && (
                    <div key={5} className={animationDirection === 'forward' ? 'wizard-step-enter' : 'wizard-step-enter-back'}>
                        <div className="bg-white p-10 rounded-[3rem] border-2 border-teal-100 shadow-xl space-y-8 text-center">
                            <Award size={48} className="text-teal-500 mx-auto"/>
                            <h3 className="text-3xl font-black text-teal-900 uppercase tracking-tighter">Registration Complete</h3>
                            <p className="text-slate-500 max-w-md mx-auto">Please review your information for accuracy. Provide your digital signature to finalize and secure your clinical record.</p>
                            {formData.registrationSignature && (
                                <div className="p-4 bg-teal-50 text-teal-700 rounded-2xl border border-teal-200 inline-flex items-center gap-2"><CheckCircle size={16}/> Signature Verified</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-white/80 backdrop-blur-md shrink-0 flex justify-between items-center z-10">
            <button type="button" onClick={handleBack} disabled={step === 1} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-50 flex items-center gap-2"><ArrowLeft size={16}/> Back</button>
            {step < stepsInfo.length ? (
                <button type="button" onClick={handleNext} className="px-12 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">Next Step <ArrowRight size={16}/></button>
            ) : (
                <button type="button" onClick={handleFinalSubmit} disabled={isSaving} className="px-12 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:grayscale">
                    <Save size={18}/> {isSaving ? 'Saving...' : 'Finalize & Sign'}
                </button>
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
      {showSignaturePad && <SignatureCaptureOverlay isOpen={showSignaturePad} onClose={() => setShowSignaturePad(false)} onSave={handleSignatureCaptured} title="Digital Identity Anchor" instruction="To ensure non-repudiation and forensic integrity, please provide your digital signature." themeColor="teal"/>}
    </div>
  );
};

export default PatientRegistrationModal;

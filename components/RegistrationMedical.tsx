import React from 'react';
import { Patient, FieldSettings } from '../types';
import { Check, AlertTriangle, Droplet, Heart, ShieldAlert, Pill, Stethoscope, Activity, Thermometer, ShieldCheck, Zap, AlertCircle, Edit3 } from 'lucide-react';

interface RegistrationMedicalProps {
  formData: Partial<Patient>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleArrayChange: (category: 'allergies' | 'medicalConditions' | 'reportedMedications', value: string) => void;
  readOnly?: boolean;
  fieldSettings: FieldSettings; 
}

const RegistrationMedical: React.FC<RegistrationMedicalProps> = ({ formData, handleChange, handleArrayChange, readOnly, fieldSettings }) => {
  
  const BooleanField = ({ label, name, checked, onToggle, alert = false, icon: Icon, children }: { label: string, name: string, checked?: boolean, onToggle: (val: boolean) => void, alert?: boolean, icon?: React.ElementType, children?: React.ReactNode }) => (
      <div className="space-y-3">
          <div className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${alert && checked ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-3 pr-4">
                  {Icon && <Icon size={18} className={alert && checked ? 'text-red-500' : 'text-slate-400'}/>}
                  <span className={`font-bold text-sm leading-tight ${alert && checked ? 'text-red-700' : 'text-slate-700'}`}>{label}</span>
              </div>
              <div className="flex gap-4 shrink-0 whitespace-nowrap">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input disabled={readOnly} type="radio" name={name} checked={checked === true} onChange={() => onToggle(true)} className="w-5 h-5 accent-teal-600" />
                        <span className="text-sm font-bold text-slate-600 group-hover:text-teal-700">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input disabled={readOnly} type="radio" name={name} checked={checked === false} onChange={() => onToggle(false)} className="w-5 h-5 accent-teal-600" />
                        <span className="text-sm font-bold text-slate-600 group-hover:text-teal-700">No</span>
                    </label>
              </div>
          </div>
          {checked && children && (
              <div className="px-2 animate-in slide-in-from-top-2 duration-300">
                  {children}
              </div>
          )}
      </div>
  );

  const handleBoolChange = (name: string, val: boolean) => {
      handleChange({ target: { name, value: val, type: 'checkbox', checked: val } } as any);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
        
        {/* PDA COMPLIANCE SECTION */}
        <div className="bg-white border-2 border-teal-100 p-6 rounded-3xl shadow-sm ring-4 ring-teal-500/5">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-teal-50 rounded-xl text-teal-600"><ShieldCheck size={20} /></div>
                <h3 className="font-bold text-lg text-slate-800">Clinical Data Authorization</h3>
            </div>
            <label className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer border-2 transition-all ${formData.dpaConsent ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-slate-50 border-slate-200 grayscale opacity-80'}`}>
                <input type="checkbox" name="thirdPartyDisclosureConsent" checked={formData.thirdPartyDisclosureConsent} onChange={handleChange} className="w-6 h-6 accent-teal-600 rounded mt-1 shrink-0" />
                <div>
                    <span className="font-extrabold text-teal-900 uppercase text-xs">Clinical Coordination Consent *</span>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">I authorize this clinic to process my medical data and share relevant details with my physicians for clinical clearance (PDA Rule 4).</p>
                </div>
            </label>
        </div>

        {/* 1. General Assessment */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-2"><Activity size={14} className="text-teal-600"/> General Assessment</h4>
            <div className="space-y-4">
                <BooleanField label="Are you in good health?" name="goodHealth" checked={formData.goodHealth} onToggle={(v) => handleBoolChange('goodHealth', v)} icon={ShieldCheck} />

                <BooleanField label="Are you under medical treatment?" name="underMedicalTreatment" checked={formData.underMedicalTreatment} onToggle={(v) => handleBoolChange('underMedicalTreatment', v)} icon={Stethoscope}>
                    <textarea name="medicalTreatmentDetails" value={formData.medicalTreatmentDetails || ''} onChange={handleChange} className="input h-20 resize-none" placeholder="Describe nature of treatment..." />
                </BooleanField>

                <BooleanField label="Had any serious illness or operation?" name="seriousIllness" checked={formData.seriousIllness} onToggle={(v) => handleBoolChange('seriousIllness', v)} icon={AlertCircle}>
                    <div className="space-y-4">
                        <textarea name="seriousIllnessDetails" value={formData.seriousIllnessDetails || ''} onChange={handleChange} className="input h-20 resize-none" placeholder="Specify illness/surgery and dates..." />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="label text-[10px]">Date of Last Hospitalization</label><input type="date" name="lastHospitalizationDate" value={formData.lastHospitalizationDate || ''} onChange={handleChange} className="input" /></div>
                            <div><label className="label text-[10px]">Reason</label><input type="text" name="lastHospitalizationDetails" value={formData.lastHospitalizationDetails || ''} onChange={handleChange} className="input" placeholder="e.g. Minor surgery" /></div>
                        </div>
                    </div>
                </BooleanField>
            </div>
        </div>

        {/* 2. STANDALONE MEDICATION SECTION */}
        <div className="bg-white p-6 rounded-3xl border-2 border-teal-50 shadow-md space-y-6">
            <h4 className="text-xs font-black uppercase text-teal-600 tracking-widest flex items-center gap-2 mb-2"><Pill size={16} /> Medication Management</h4>
            
            <BooleanField 
                label="Are you currently taking any medications, vitamins, or supplements?" 
                name="takingMedications" 
                checked={formData.takingMedications} 
                onToggle={(v) => handleBoolChange('takingMedications', v)} 
                icon={Pill}
            >
                <div className="space-y-6 pt-2">
                    <div>
                        <label className="label font-black text-teal-900 text-[9px] uppercase tracking-widest mb-3">Select Common Medications</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {(fieldSettings.medications || []).map(med => {
                                const isSelected = (formData.reportedMedications || []).includes(med.name);
                                return (
                                    <button key={med.id} type="button" onClick={() => handleArrayChange('reportedMedications', med.name)} disabled={readOnly} className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${isSelected ? 'bg-teal-50 border-teal-300 text-teal-900 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isSelected ? 'bg-teal-500 text-white border-teal-500' : 'bg-white border-slate-300'}`}>{isSelected && <Check size={12} strokeWidth={4} />}</div>
                                        <span className="text-[10px] font-bold leading-tight">{med.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <label className="label font-bold text-teal-800 text-[10px] flex items-center gap-2"><Edit3 size={12}/> Other Medications & Dosage Instructions</label>
                        <textarea name="medicationDetails" value={formData.medicationDetails || ''} onChange={handleChange} className="input h-32 resize-none" placeholder="List medications not found above, including dosage and frequency..." />
                    </div>
                </div>
            </BooleanField>
        </div>

        {/* 3. Clinical High Risk Checklist - NOW COMPACT */}
        <div className="bg-white p-6 rounded-3xl border-2 border-red-100 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-red-500" />
            <div className="flex items-center gap-2 mb-6">
                <ShieldAlert size={24} className="text-red-600" />
                <h4 className="font-black text-red-900 uppercase tracking-widest text-sm">Critical Clinical Guardrails</h4>
            </div>
            
            <div className="space-y-4">
                <BooleanField label="Are you taking Blood Thinners? (Aspirin, Warfarin, etc.)" name="takingBloodThinners" checked={formData.takingBloodThinners} onToggle={(v) => handleBoolChange('takingBloodThinners', v)} alert={true} icon={Droplet}>
                    <div className="flex gap-2 items-center px-4 py-3 bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200 animate-in zoom-in-95">
                        <AlertTriangle size={14} className="shrink-0"/> 
                        <span>MANDATORY: Verify INR/bleeding status before surgical procedures.</span>
                    </div>
                </BooleanField>

                <BooleanField label="Taking Bisphosphonates? (Fosamax, Zometa)" name="takingBisphosphonates" checked={formData.takingBisphosphonates} onToggle={(v) => handleBoolChange('takingBisphosphonates', v)} alert={true} icon={ShieldAlert}>
                    <div className="flex gap-2 items-center px-4 py-3 bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200 animate-in zoom-in-95">
                        <AlertTriangle size={14} className="shrink-0"/> 
                        <span>RISK: Increased risk of BRONJ (Osteonecrosis of the jaw).</span>
                    </div>
                </BooleanField>

                <BooleanField label="History of Heart Valve Issues or Rheumatic Fever?" name="heartValveIssues" checked={formData.heartValveIssues} onToggle={(v) => handleBoolChange('heartValveIssues', v)} alert={true} icon={Heart}>
                    <div className="flex gap-2 items-center px-4 py-3 bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200 animate-in zoom-in-95">
                        <AlertTriangle size={14} className="shrink-0"/> 
                        <span>MANDATORY: Check if antibiotic prophylaxis is required.</span>
                    </div>
                </BooleanField>

                <BooleanField label="Abnormal Reaction to Local Anesthesia?" name="anesthesiaReaction" checked={formData.anesthesiaReaction} onToggle={(v) => handleBoolChange('anesthesiaReaction', v)} alert={true} icon={Activity}>
                    <div className="flex gap-2 items-center px-4 py-3 bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200 animate-in zoom-in-95">
                        <AlertTriangle size={14} className="shrink-0"/> 
                        <span>MANDATORY: Use non-epinephrine or alternate anesthetic.</span>
                    </div>
                </BooleanField>

                <BooleanField label="Respiratory Issues? (Asthma, TB, Emphysema)" name="respiratoryIssues" checked={formData.respiratoryIssues} onToggle={(v) => handleBoolChange('respiratoryIssues', v)} alert={true} icon={Thermometer}>
                    <div className="flex gap-2 items-center px-4 py-3 bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200 animate-in zoom-in-95">
                        <AlertTriangle size={14} className="shrink-0"/> 
                        <span>CAUTION: Monitor oxygen levels during chair time.</span>
                    </div>
                </BooleanField>
            </div>
        </div>

        {/* 4. Lifestyle and Social */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-4"><Zap size={14} className="text-teal-600"/> Lifestyle Context</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BooleanField label="Do you smoke or use tobacco?" name="tobaccoUse" checked={formData.tobaccoUse} onToggle={(v) => handleBoolChange('tobaccoUse', v)} />
                <BooleanField label="Do you consume alcohol / recreational drugs?" name="alcoholDrugsUse" checked={formData.alcoholDrugsUse} onToggle={(v) => handleBoolChange('alcoholDrugsUse', v)} />
            </div>
        </div>

        {/* 5. Condition and Allergy Grids */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-orange-800 border-b border-orange-50 pb-3">
                <AlertTriangle size={20} />
                <h4 className="font-black uppercase text-sm tracking-widest">Medical Condition Registry</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {fieldSettings.medicalConditions.filter(c => c !== 'None').map(condition => {
                    const isSelected = (formData.medicalConditions || []).includes(condition);
                    const isHighRisk = ['HIV/AIDS', 'Hepatitis', 'Tuberculosis', 'Heart Disease', 'Bleeding Issues'].includes(condition);
                    return (
                        <button key={condition} type="button" onClick={() => handleArrayChange('medicalConditions', condition)} disabled={readOnly} className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${isSelected ? isHighRisk ? 'bg-red-50 border-red-300 text-red-900 shadow-md' : 'bg-orange-50 border-orange-300 text-orange-900' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isSelected ? isHighRisk ? 'bg-red-600 text-white border-red-600' : 'bg-orange-500 text-white border-orange-500' : 'bg-white border-slate-300'}`}>{isSelected && <Check size={12} strokeWidth={4} />}</div>
                            <span className="text-[10px] font-bold leading-tight">{condition}</span>
                        </button>
                    );
                })}
            </div>
            <div className="pt-2">
                <label className="label text-orange-800 font-black text-[9px] flex items-center gap-2"><Edit3 size={12}/> Other Condition Not Listed</label>
                <input type="text" name="otherConditions" value={formData.otherConditions || ''} onChange={handleChange} className="input border-orange-100 focus:border-orange-500" placeholder="Specify any rare or specific conditions..." />
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-teal-800 border-b border-teal-50 pb-3">
                <Pill size={20} />
                <h4 className="font-black uppercase text-sm tracking-widest">Allergy Registry</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {fieldSettings.allergies.filter(a => a !== 'None').map(allergy => {
                    const isSelected = (formData.allergies || []).includes(allergy);
                    return (
                        <button key={allergy} type="button" onClick={() => handleArrayChange('allergies', allergy)} disabled={readOnly} className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${isSelected ? 'bg-teal-50 border-teal-300 text-teal-900 shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isSelected ? 'bg-teal-500 text-white border-teal-500' : 'bg-white border-slate-300'}`}>{isSelected && <Check size={12} strokeWidth={4} />}</div>
                            <span className="text-[10px] font-bold leading-tight">{allergy}</span>
                        </button>
                    );
                })}
            </div>
            <div className="pt-2">
                <label className="label text-teal-800 font-black text-[9px] flex items-center gap-2"><Edit3 size={12}/> Other Allergy Not Listed</label>
                <input type="text" name="otherAllergies" value={formData.otherAllergies || ''} onChange={handleChange} className="input border-teal-100 focus:border-teal-500" placeholder="e.g. Food, Metal, Specific Preservatives..." />
            </div>
        </div>

        {/* 6. Chief Complaint */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-4"><Zap size={14} className="text-teal-600"/> Clinical Presentation</h4>
            <div>
                <label className="label font-bold text-teal-800">Reason for visit (Chief Complaint)</label>
                <textarea name="chiefComplaint" value={formData.chiefComplaint || ''} onChange={handleChange} className="input h-32 resize-none" placeholder="e.g. Pain in molar, bleeding gums, checkup..." />
            </div>
        </div>
    </div>
  );
};

export default RegistrationMedical;
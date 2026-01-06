import React from 'react';
import { Patient, FieldSettings } from '../types';
import { Check, AlertTriangle, Droplet, Heart, ShieldAlert, Pill, Stethoscope, Activity, Thermometer, ShieldCheck, Zap, AlertCircle, Edit3, EyeOff } from 'lucide-react';

interface RegistrationMedicalProps {
  formData: Partial<Patient>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleArrayChange: (category: 'allergies' | 'medicalConditions' | 'reportedMedications', value: string) => void;
  readOnly?: boolean;
  fieldSettings: FieldSettings; 
  isMasked?: boolean;
}

const RegistrationMedical: React.FC<RegistrationMedicalProps> = ({ formData, handleChange, handleArrayChange, readOnly, fieldSettings, isMasked = false }) => {
  
  const BooleanField = ({ label, name, checked, onToggle, alert = false, icon: Icon, children }: { label: string, name: string, checked?: boolean, onToggle: (val: boolean) => void, alert?: boolean, icon?: React.ElementType, children?: React.ReactNode }) => (
      <div className="space-y-3">
          <div className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${alert && checked ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-3 pr-4">
                  {Icon && <Icon size={18} className={alert && checked ? 'text-red-600' : 'text-slate-500'}/>}
                  <span className={`font-bold text-sm leading-tight ${alert && checked ? 'text-red-800' : 'text-slate-800'}`}>{label}</span>
              </div>
              <div className="flex gap-4 shrink-0 whitespace-nowrap">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input disabled={readOnly} type="radio" name={name} checked={checked === true} onChange={() => onToggle(true)} className="w-5 h-5 accent-teal-700" />
                        <span className="text-sm font-bold text-slate-700 group-hover:text-teal-800">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input disabled={readOnly} type="radio" name={name} checked={checked === false} onChange={() => onToggle(false)} className="w-5 h-5 accent-teal-700" />
                        <span className="text-sm font-bold text-slate-700 group-hover:text-teal-800">No</span>
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
                <div className="p-2 bg-teal-50 rounded-xl text-teal-700"><ShieldCheck size={20} /></div>
                <h3 className="font-bold text-lg text-slate-800">Clinical Data Sharing Authorization</h3>
            </div>
            <label className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer border-2 transition-all ${formData.thirdPartyDisclosureConsent ? 'bg-teal-50 border-teal-700 shadow-md' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                <input type="checkbox" name="thirdPartyDisclosureConsent" checked={formData.thirdPartyDisclosureConsent} onChange={handleChange} className="w-6 h-6 accent-teal-700 rounded mt-1 shrink-0" />
                <div>
                    <span className="font-extrabold text-teal-900 uppercase text-xs">Clinical Coordination Consent *</span>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">I authorize this clinic to process my medical data and share relevant details with external specialists for coordination of care.</p>
                </div>
            </label>
        </div>

        {/* 1. General Assessment */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2 mb-2"><Activity size={14} className="text-teal-700"/> Health Assessment</h4>
            <div className="space-y-4">
                <BooleanField label="In overall good health?" name="goodHealth" checked={formData.goodHealth} onToggle={(v) => handleBoolChange('goodHealth', v)} icon={ShieldCheck} />

                <BooleanField label="Currently under medical treatment?" name="underMedicalTreatment" checked={formData.underMedicalTreatment} onToggle={(v) => handleBoolChange('underMedicalTreatment', v)} icon={Stethoscope}>
                    <label htmlFor="medicalTreatmentDetails" className="label text-[10px]">Treatment Narrative</label>
                    <textarea id="medicalTreatmentDetails" name="medicalTreatmentDetails" value={formData.medicalTreatmentDetails || ''} onChange={handleChange} className="input h-20 resize-none" placeholder="Details of treatment..." />
                </BooleanField>

                <BooleanField label="Prior serious illness or surgeries?" name="seriousIllness" checked={formData.seriousIllness} onToggle={(v) => handleBoolChange('seriousIllness', v)} icon={AlertCircle}>
                    <div className="space-y-4">
                        <label htmlFor="seriousIllnessDetails" className="label text-[10px]">Medical History Detail</label>
                        <textarea id="seriousIllnessDetails" name="seriousIllnessDetails" value={formData.seriousIllnessDetails || ''} onChange={handleChange} className="input h-20 resize-none" placeholder="Specify history..." />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label htmlFor="lastHospitalDate" className="label text-[10px]">Hospitalization Date</label><input id="lastHospitalDate" type="date" name="lastHospitalizationDate" value={formData.lastHospitalizationDate || ''} onChange={handleChange} className="input" /></div>
                            <div><label htmlFor="hospitalReason" className="label text-[10px]">Hospitalization Reason</label><input id="hospitalReason" type="text" name="lastHospitalizationDetails" value={formData.lastHospitalizationDetails || ''} onChange={handleChange} className="input" placeholder="e.g. Major surgery" /></div>
                        </div>
                    </div>
                </BooleanField>
            </div>
        </div>

        {/* 2. Medication Management */}
        <div className="bg-white p-6 rounded-3xl border-2 border-teal-50 shadow-md space-y-6">
            <h4 className="text-xs font-black uppercase text-teal-700 tracking-widest flex items-center gap-2 mb-2"><Pill size={16} /> Current Medications</h4>
            
            <BooleanField 
                label="Are you taking any medications, vitamins, or supplements?" 
                name="takingMedications" 
                checked={formData.takingMedications} 
                onToggle={(v) => handleBoolChange('takingMedications', v)} 
                icon={Pill}
            >
                <div className="space-y-6 pt-2">
                    <div>
                        <span className="label font-black text-teal-900 text-[9px] uppercase tracking-widest mb-3 block">Common Systemic Medications</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {(fieldSettings.medications || []).map(med => {
                                const isSelected = (formData.reportedMedications || []).includes(med.name);
                                return (
                                    <button key={med.id} type="button" onClick={() => handleArrayChange('reportedMedications', med.name)} disabled={readOnly} className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 focus:ring-offset-2 ${isSelected ? 'bg-teal-50 border-teal-600 text-teal-900 shadow-sm' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-400'}`}>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isSelected ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-slate-300'}`}>{isSelected && <Check size={12} strokeWidth={4} />}</div>
                                        <span className="text-[10px] font-bold leading-tight">{med.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="med-details" className="label font-bold text-teal-900 text-[10px] flex items-center gap-2"><Edit3 size={12}/> Other Medications & Instructions</label>
                        <textarea id="med-details" name="medicationDetails" value={formData.medicationDetails || ''} onChange={handleChange} className="input h-32 resize-none" placeholder="List all current drugs and dosages..." />
                    </div>
                </div>
            </BooleanField>
        </div>

        {/* 3. Clinical High Risk Checklist */}
        <div className="bg-white p-6 rounded-3xl border-2 border-red-100 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-red-600" />
            <div className="flex items-center gap-2 mb-6">
                <ShieldAlert size={24} className="text-red-700" />
                <h4 className="font-black text-red-900 uppercase tracking-widest text-sm">Critical Clinical Red Flags</h4>
            </div>
            
            <div className="space-y-4">
                <BooleanField label="Taking Blood Thinners? (Aspirin, Warfarin, etc.)" name="takingBloodThinners" checked={formData.takingBloodThinners} onToggle={(v) => handleBoolChange('takingBloodThinners', v)} alert={true} icon={Droplet}>
                    <div className="flex gap-2 items-center px-4 py-3 bg-red-100 text-red-800 rounded-xl text-xs font-bold border border-red-200 animate-in zoom-in-95">
                        <AlertTriangle size={14} className="shrink-0"/> 
                        <span>MANDATORY: Verify INR levels before any surgical extraction.</span>
                    </div>
                </BooleanField>

                <BooleanField label="Taking Bisphosphonates? (Fosamax, Zometa)" name="takingBisphosphonates" checked={formData.takingBisphosphonates} onToggle={(v) => handleBoolChange('takingBisphosphonates', v)} alert={true} icon={ShieldAlert}>
                    <div className="flex gap-2 items-center px-4 py-3 bg-red-100 text-red-800 rounded-xl text-xs font-bold border border-red-200 animate-in zoom-in-95">
                        <AlertTriangle size={14} className="shrink-0"/> 
                        <span>RISK: Osteonecrosis alert. Review history before bone surgery.</span>
                    </div>
                </BooleanField>

                <BooleanField label="History of Heart Valve Issues or Rheumatic Fever?" name="heartValveIssues" checked={formData.heartValveIssues} onToggle={(v) => handleBoolChange('heartValveIssues', v)} alert={true} icon={Heart}>
                    <div className="flex gap-2 items-center px-4 py-3 bg-red-100 text-red-800 rounded-xl text-xs font-bold border border-red-200 animate-in zoom-in-95">
                        <AlertTriangle size={14} className="shrink-0"/> 
                        <span>PROTOCOL: Confirm if antibiotic prophylaxis is required.</span>
                    </div>
                </BooleanField>

                <BooleanField label="Allergy to Local Anesthesia?" name="anesthesiaReaction" checked={formData.anesthesiaReaction} onToggle={(v) => handleBoolChange('anesthesiaReaction', v)} alert={true} icon={Activity}>
                    <div className="flex gap-2 items-center px-4 py-3 bg-red-100 text-red-800 rounded-xl text-xs font-bold border border-red-200 animate-in zoom-in-95">
                        <AlertTriangle size={14} className="shrink-0"/> 
                        <span>MANDATORY: Use non-epinephrine substitute if applicable.</span>
                    </div>
                </BooleanField>

                <BooleanField label="Respiratory Conditions? (Asthma, TB, COPD)" name="respiratoryIssues" checked={formData.respiratoryIssues} onToggle={(v) => handleBoolChange('respiratoryIssues', v)} alert={true} icon={Thermometer}>
                    <div className="flex gap-2 items-center px-4 py-3 bg-red-100 text-red-800 rounded-xl text-xs font-bold border border-red-200 animate-in zoom-in-95">
                        <AlertTriangle size={14} className="shrink-0"/> 
                        <span>CAUTION: Use high-volume suction and monitor breathing.</span>
                    </div>
                </BooleanField>
            </div>
        </div>

        {/* 4. Lifestyle */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2 mb-4"><Zap size={14} className="text-teal-700"/> Lifestyle Indicators</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BooleanField label="History of smoking or tobacco use?" name="tobaccoUse" checked={formData.tobaccoUse} onToggle={(v) => handleBoolChange('tobaccoUse', v)} />
                <BooleanField label="Consumption of alcohol / recreational substances?" name="alcoholDrugsUse" checked={formData.alcoholDrugsUse} onToggle={(v) => handleBoolChange('alcoholDrugsUse', v)} />
            </div>
        </div>

        {/* 5. Condition and Allergy Registry */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-orange-900 border-b border-orange-50 pb-3">
                <AlertTriangle size={20} />
                <h4 className="font-black uppercase text-sm tracking-widest">Medical History Registry</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {fieldSettings.medicalConditions.filter(c => c !== 'None').map(condition => {
                    const isSelected = (formData.medicalConditions || []).includes(condition);
                    const isHighRisk = ['HIV/AIDS', 'Hepatitis', 'Tuberculosis', 'Heart Disease', 'Bleeding Issues'].includes(condition);
                    return (
                        <button key={condition} type="button" onClick={() => handleArrayChange('medicalConditions', condition)} disabled={readOnly} className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 focus:ring-offset-2 ${isSelected ? isHighRisk ? 'bg-red-50 border-red-600 text-red-900 shadow-md' : 'bg-orange-50 border-orange-600 text-orange-900' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-400'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isSelected ? isHighRisk ? 'bg-red-600 text-white border-red-600' : 'bg-orange-600 text-white border-orange-600' : 'bg-white border-slate-300'}`}>{isSelected && <Check size={12} strokeWidth={4} />}</div>
                            <span className="text-[10px] font-bold leading-tight">{condition}</span>
                        </button>
                    );
                })}
            </div>
            <div className="pt-2">
                <label htmlFor="other-conditions" className="label text-orange-900 font-black text-[9px] flex items-center gap-2"><Edit3 size={12}/> Other Rare/Chronic Condition</label>
                <input id="other-conditions" type="text" name="otherConditions" value={formData.otherConditions || ''} onChange={handleChange} className="input border-orange-100 focus:border-orange-600" placeholder="Specify any specific conditions..." />
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-teal-800 border-b border-teal-50 pb-3">
                <Pill size={20} />
                <h4 className="font-black uppercase text-sm tracking-widest">Allergy Watchlist</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {fieldSettings.allergies.filter(a => a !== 'None').map(allergy => {
                    const isSelected = (formData.allergies || []).includes(allergy);
                    return (
                        <button key={allergy} type="button" onClick={() => handleArrayChange('allergies', allergy)} disabled={readOnly} className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 focus:ring-offset-2 ${isSelected ? 'bg-teal-50 border-teal-600 text-teal-900 shadow-md' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-400'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isSelected ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-slate-300'}`}>{isSelected && <Check size={12} strokeWidth={4} />}</div>
                            <span className="text-[10px] font-bold leading-tight">{allergy}</span>
                        </button>
                    );
                })}
            </div>
            <div className="pt-2">
                <label htmlFor="other-allergies" className="label text-teal-800 font-black text-[9px] flex items-center gap-2"><Edit3 size={12}/> Other Allergy</label>
                <input id="other-allergies" type="text" name="otherAllergies" value={formData.otherAllergies || ''} onChange={handleChange} className="input border-teal-100 focus:border-teal-600" placeholder="e.g. Latex, Penicillin, specific foods..." />
            </div>
        </div>

        {/* 6. Chief Complaint */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2 mb-4"><Zap size={14} className="text-teal-700"/> Clinical Presentation</h4>
            <div>
                <label htmlFor="chief-complaint" className="label font-bold text-teal-900">Reason for visit (Chief Complaint) *</label>
                <textarea id="chief-complaint" name="chiefComplaint" value={formData.chiefComplaint || ''} onChange={handleChange} className="input h-32 resize-none" placeholder="Describe the current symptoms or reason for the visit..." />
            </div>
        </div>
    </div>
  );
};

export default RegistrationMedical;
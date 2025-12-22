import React, { useMemo } from 'react';
import { Patient, FieldSettings } from '../types';
import { Check, AlertTriangle, AlertOctagon, Droplet, Heart, ShieldAlert, Pill, Stethoscope, Activity, Thermometer, ShieldCheck, Lock, Cigarette, Beer, Zap, Baby, AlertCircle } from 'lucide-react';

interface RegistrationMedicalProps {
  formData: Partial<Patient>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleArrayChange: (category: 'allergies' | 'medicalConditions', value: string) => void;
  readOnly?: boolean;
  fieldSettings: FieldSettings; 
}

const RegistrationMedical: React.FC<RegistrationMedicalProps> = ({ formData, handleChange, handleArrayChange, readOnly, fieldSettings }) => {
  
  const isFemale = formData.sex === 'Female';

  const BooleanField = ({ label, name, checked, onToggle, alert = false, icon: Icon }: { label: string, name: string, checked?: boolean, onToggle: (val: boolean) => void, alert?: boolean, icon?: React.ElementType }) => (
      <div className={`flex justify-between items-center p-3 rounded-xl border transition-all ${alert && checked ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-3">
              {Icon && <Icon size={16} className={alert && checked ? 'text-red-500' : 'text-slate-400'}/>}
              <span className={`font-bold text-sm ${alert && checked ? 'text-red-700' : 'text-slate-700'}`}>{label}</span>
          </div>
          <div className="flex gap-4">
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
  );

  const handleBoolChange = (name: string, val: boolean) => {
      handleChange({ target: { name, value: val, type: 'checkbox', checked: val } } as any);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
        
        {/* RULE 4 PDA: Third-Party Medical Disclosure Consent */}
        <div className="bg-white border-2 border-teal-100 p-6 rounded-3xl shadow-sm ring-4 ring-teal-500/5 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-teal-50 rounded-xl text-teal-600"><ShieldCheck size={20} /></div>
                <h3 className="font-bold text-lg text-slate-800">Disclosure Consent (PDA Rule 4)</h3>
            </div>
            <label className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer border-2 transition-all ${formData.thirdPartyDisclosureConsent ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-slate-50 border-slate-200 grayscale opacity-80'}`}>
                <input type="checkbox" name="thirdPartyDisclosureConsent" checked={formData.thirdPartyDisclosureConsent} onChange={handleChange} className="w-6 h-6 accent-teal-600 rounded mt-1 shrink-0" />
                <div>
                    <span className="font-extrabold text-teal-900 uppercase text-xs">Medical Clearance Disclosure *</span>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">I expressly authorize the clinic to disclose my dental history and treatment plans to my designated medical physician(s) for the sole purpose of clinical coordination and medical clearance.</p>
                </div>
            </label>
        </div>

        {/* General Health Status */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-2"><Activity size={14} className="text-teal-600"/> General Health Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BooleanField label="Are you in good health?" name="goodHealth" checked={formData.goodHealth} onToggle={(v) => handleBoolChange('goodHealth', v)} icon={ShieldCheck} />
                <BooleanField label="Are you under medical treatment?" name="underMedicalTreatment" checked={formData.underMedicalTreatment} onToggle={(v) => handleBoolChange('underMedicalTreatment', v)} icon={Stethoscope} />
                <BooleanField label="Had any serious illness or operation?" name="seriousIllness" checked={formData.seriousIllness} onToggle={(v) => handleBoolChange('seriousIllness', v)} icon={AlertCircle} />
                <BooleanField label="Taking any medications / supplements?" name="takingMedications" checked={formData.takingMedications} onToggle={(v) => handleBoolChange('takingMedications', v)} icon={Pill} />
            </div>

            {(formData.seriousIllness || formData.underMedicalTreatment) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 animate-in slide-in-from-top-2">
                    <div>
                        <label className="label font-bold text-teal-800">Date of Last Hospitalization</label>
                        <input type="date" name="lastHospitalizationDate" value={formData.lastHospitalizationDate || ''} onChange={handleChange} className="input" />
                    </div>
                    <div>
                        <label className="label font-bold text-teal-800">Reason for Hospitalization</label>
                        <input type="text" name="lastHospitalizationDetails" value={formData.lastHospitalizationDetails || ''} onChange={handleChange} className="input" placeholder="e.g. Surgery, Illness name..." />
                    </div>
                </div>
            )}
        </div>

        {/* 0. Clinical Context */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-4"><Zap size={14} className="text-teal-600"/> Clinical Presentation</h4>
            <div className="space-y-4">
                <div>
                    <label className="label font-bold text-teal-800">Chief Complaint (Reason for Visit)</label>
                    <textarea name="chiefComplaint" value={formData.chiefComplaint || ''} onChange={handleChange} className="input h-24 resize-none" placeholder="e.g. Pain on upper left molar, Routine checkup..." />
                </div>
            </div>
        </div>

        {/* 1. Clinical High-Risk Safety Checklist */}
        <div className="bg-white p-6 rounded-3xl border-2 border-red-100 shadow-lg shadow-red-500/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-red-500" />
            <div className="flex items-center gap-2 mb-6">
                <ShieldAlert size={24} className="text-red-600" />
                <h4 className="font-black text-red-900 uppercase tracking-widest text-sm">Critical Clinical Safety Check</h4>
            </div>
            
            <div className="space-y-3">
                <div className="space-y-2">
                    <BooleanField label="Are you taking Blood Thinners? (Aspirin, Warfarin, etc.)" name="takingBloodThinners" checked={formData.takingBloodThinners} onToggle={(v) => handleBoolChange('takingBloodThinners', v)} alert={true} icon={Droplet}/>
                    {formData.takingBloodThinners && <div className="flex gap-2 items-center px-4 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-bold animate-pulse"><AlertTriangle size={14}/> MANDATORY: Monitor bleeding during surgical procedures.</div>}
                </div>
                <div className="space-y-2">
                    <BooleanField label="Taking Bisphosphonates? (Fosamax, Zometa)" name="takingBisphosphonates" checked={formData.takingBisphosphonates} onToggle={(v) => handleBoolChange('takingBisphosphonates', v)} alert={true} icon={ShieldAlert} />
                </div>
                <div className="space-y-2">
                    <BooleanField label="History of Heart Valve Issues or Rheumatic Fever?" name="heartValveIssues" checked={formData.heartValveIssues} onToggle={(v) => handleBoolChange('heartValveIssues', v)} alert={true} icon={Heart} />
                </div>
                <div className="space-y-2">
                    <BooleanField label="Abnormal Reaction to Local Anesthesia?" name="anesthesiaReaction" checked={formData.anesthesiaReaction} onToggle={(v) => handleBoolChange('anesthesiaReaction', v)} alert={true} icon={Activity} />
                </div>
                <div className="space-y-2">
                    <BooleanField label="Respiratory Issues? (Asthma, Emphysema, TB)" name="respiratoryIssues" checked={formData.respiratoryIssues} onToggle={(v) => handleBoolChange('respiratoryIssues', v)} alert={true} icon={Thermometer} />
                </div>
            </div>
        </div>

        {/* Lifestyle & Social History */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-4"><Activity size={14} className="text-teal-600"/> Lifestyle History</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BooleanField label="Do you smoke or use tobacco products?" name="tobaccoUse" checked={formData.tobaccoUse} onToggle={(v) => handleBoolChange('tobaccoUse', v)} icon={Cigarette} />
                <BooleanField label="Do you consume alcohol or recreational drugs?" name="alcoholDrugsUse" checked={formData.alcoholDrugsUse} onToggle={(v) => handleBoolChange('alcoholDrugsUse', v)} icon={Beer} />
            </div>
        </div>

        {/* Conditional Women's Health Section */}
        {isFemale && (
            <div className="bg-lilac-50 border-2 border-lilac-200 p-6 rounded-3xl shadow-lg ring-4 ring-lilac-500/5 animate-in slide-in-from-left-4 duration-500">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-lilac-600 text-white p-2 rounded-xl shadow-lg shadow-lilac-600/20"><Baby size={24}/></div>
                    <div>
                        <h4 className="font-black text-lilac-900 uppercase tracking-widest text-sm">Women's Clinical Health</h4>
                        <p className="text-[10px] text-lilac-600 font-bold uppercase mt-0.5">Critical for drug prescriptions & X-ray safety</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-2xl border transition-all ${formData.pregnant ? 'bg-lilac-100 border-lilac-300 shadow-md' : 'bg-white border-lilac-100'}`}>
                        <BooleanField label="Pregnant?" name="pregnant" checked={formData.pregnant} onToggle={(v) => handleBoolChange('pregnant', v)} />
                    </div>
                    <div className={`p-4 rounded-2xl border transition-all ${formData.nursing ? 'bg-lilac-100 border-lilac-300 shadow-md' : 'bg-white border-lilac-100'}`}>
                        <BooleanField label="Nursing?" name="nursing" checked={formData.nursing} onToggle={(v) => handleBoolChange('nursing', v)} />
                    </div>
                    <div className={`p-4 rounded-2xl border transition-all ${formData.birthControl ? 'bg-lilac-100 border-lilac-300 shadow-md' : 'bg-white border-lilac-100'}`}>
                        <BooleanField label="On Birth Control?" name="birthControl" checked={formData.birthControl} onToggle={(v) => handleBoolChange('birthControl', v)} />
                    </div>
                </div>
            </div>
        )}

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-orange-800 border-b border-orange-50 pb-3">
                <AlertTriangle size={20} />
                <h4 className="font-black uppercase text-sm tracking-widest">Diagnosed Medical Conditions</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {fieldSettings.medicalConditions.filter(c => c !== 'None').map(condition => {
                    const isSelected = (formData.medicalConditions || []).includes(condition);
                    const isHighRisk = ['HIV/AIDS', 'Hepatitis', 'Tuberculosis', 'Heart Disease', 'Bleeding Issues'].includes(condition);
                    return (
                        <button key={condition} type="button" onClick={() => handleArrayChange('medicalConditions', condition)} disabled={readOnly} className={`relative p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${isSelected ? isHighRisk ? 'bg-red-50 border-red-300 text-red-900 shadow-md' : 'bg-orange-50 border-orange-300 text-orange-900 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${isSelected ? isHighRisk ? 'bg-red-600 border-red-600 text-white' : 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-slate-300'}`}>{isSelected && <Check size={14} strokeWidth={4} />}</div>
                            <span className="text-xs font-bold leading-tight truncate">{condition}</span>
                        </button>
                    );
                })}
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-teal-800 border-b border-teal-50 pb-3">
                <Pill size={20} />
                <h4 className="font-black uppercase text-sm tracking-widest">Known Allergies</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {fieldSettings.allergies.filter(a => a !== 'None').map(allergy => {
                    const isSelected = (formData.allergies || []).includes(allergy);
                    return (
                        <button key={allergy} type="button" onClick={() => handleArrayChange('allergies', allergy)} disabled={readOnly} className={`relative p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${isSelected ? 'bg-teal-50 border-teal-300 text-teal-900 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${isSelected ? 'bg-teal-500 border-teal-500 text-white' : 'bg-white border-slate-300'}`}>{isSelected && <Check size={14} strokeWidth={4} />}</div>
                            <span className="text-xs font-bold leading-tight truncate">{allergy}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    </div>
  );
};

export default RegistrationMedical;
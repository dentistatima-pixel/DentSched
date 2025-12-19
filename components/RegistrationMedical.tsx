
import React from 'react';
import { Patient, FieldSettings } from '../types';
import { Check, AlertTriangle, AlertOctagon, Droplet, Heart, ShieldAlert, Pill, Stethoscope, Activity, Thermometer, ShieldCheck, Lock } from 'lucide-react';

interface RegistrationMedicalProps {
  formData: Partial<Patient>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleArrayChange: (category: 'allergies' | 'medicalConditions', value: string) => void;
  readOnly?: boolean;
  fieldSettings: FieldSettings; 
}

const RegistrationMedical: React.FC<RegistrationMedicalProps> = ({ formData, handleChange, handleArrayChange, readOnly, fieldSettings }) => {
  
  const BooleanField = ({ label, name, checked, onToggle, alert = false }: { label: string, name: string, checked?: boolean, onToggle: (val: boolean) => void, alert?: boolean }) => (
      <div className={`flex justify-between items-center p-3 rounded-xl border transition-all ${alert && checked ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
          <span className={`font-bold text-sm ${alert && checked ? 'text-red-700' : 'text-slate-700'}`}>{label}</span>
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
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
        
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

        {/* 1. Clinical High-Risk Safety Checklist */}
        <div className="bg-white p-6 rounded-3xl border-2 border-red-100 shadow-lg shadow-red-500/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-red-500" />
            <div className="flex items-center gap-2 mb-6">
                <ShieldAlert size={24} className="text-red-600" />
                <h4 className="font-black text-red-900 uppercase tracking-widest text-sm">Critical Clinical Safety Check</h4>
            </div>
            
            <div className="space-y-3">
                <div className="space-y-2">
                    <BooleanField label="Are you taking Blood Thinners? (Aspirin, Heparin, Warfarin, etc.)" name="takingBloodThinners" checked={formData.takingBloodThinners} onToggle={(v) => handleBoolChange('takingBloodThinners', v)} alert={true} />
                    {formData.takingBloodThinners && <div className="flex gap-2 items-center px-4 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-bold animate-pulse"><AlertTriangle size={14}/> MANDATORY: Monitor bleeding during procedure.</div>}
                </div>
                <div className="space-y-2">
                    <BooleanField label="Taking Bone Health Meds / Bisphosphonates? (Fosamax, Zometa)" name="takingBisphosphonates" checked={formData.takingBisphosphonates} onToggle={(v) => handleBoolChange('takingBisphosphonates', v)} alert={true} />
                </div>
                <div className="space-y-2">
                    <BooleanField label="History of Heart Valve Replacement or Rheumatic Fever?" name="heartValveIssues" checked={formData.heartValveIssues} onToggle={(v) => handleBoolChange('heartValveIssues', v)} alert={true} />
                </div>
            </div>
        </div>

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
    </div>
  );
};

export default RegistrationMedical;

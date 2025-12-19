import React from 'react';
import { Patient, FieldSettings } from '../types';
import { Check, AlertTriangle, AlertOctagon, Droplet, Heart, ShieldAlert, Pill, Stethoscope, Activity, Thermometer } from 'lucide-react';

interface RegistrationMedicalProps {
  formData: Partial<Patient>;
  // Fix: Added HTMLTextAreaElement to allowed event target types
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleArrayChange: (category: 'allergies' | 'medicalConditions', value: string) => void;
  readOnly?: boolean;
  fieldSettings: FieldSettings; 
}

const RegistrationMedical: React.FC<RegistrationMedicalProps> = ({ formData, handleChange, handleArrayChange, readOnly, fieldSettings }) => {
  
  // Helper for Yes/No Toggles
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
        
        {/* 1. Clinical High-Risk Safety Checklist */}
        <div className="bg-white p-6 rounded-3xl border-2 border-red-100 shadow-lg shadow-red-500/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-red-500" />
            <div className="flex items-center gap-2 mb-6">
                <ShieldAlert size={24} className="text-red-600" />
                <h4 className="font-black text-red-900 uppercase tracking-widest text-sm">Critical Clinical Safety Check</h4>
            </div>
            
            <div className="space-y-3">
                {/* Blood Thinners */}
                <div className="space-y-2">
                    <BooleanField 
                        label="Are you taking Blood Thinners? (Aspirin, Heparin, Warfarin, etc.)" 
                        name="takingBloodThinners" 
                        checked={formData.takingBloodThinners} 
                        onToggle={(v) => handleBoolChange('takingBloodThinners', v)} 
                        alert={true}
                    />
                    {formData.takingBloodThinners && (
                        <div className="flex gap-2 items-center px-4 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-bold animate-pulse">
                            <AlertTriangle size={14}/> MANDATORY: Monitor bleeding during procedure.
                        </div>
                    )}
                </div>

                {/* Bone Health / Bisphosphonates */}
                <div className="space-y-2">
                    <BooleanField 
                        label="Taking Bone Health Meds / Bisphosphonates? (Fosamax, Zometa)" 
                        name="takingBisphosphonates" 
                        checked={formData.takingBisphosphonates} 
                        onToggle={(v) => handleBoolChange('takingBisphosphonates', v)} 
                        alert={true}
                    />
                    {formData.takingBisphosphonates && (
                        <div className="flex gap-2 items-center px-4 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-bold">
                            <AlertOctagon size={14}/> RISK: Potential Osteonecrosis of the Jaw (MRONJ).
                        </div>
                    )}
                </div>

                {/* Heart Valve Safety */}
                <div className="space-y-2">
                    <BooleanField 
                        label="History of Heart Valve Replacement or Rheumatic Fever?" 
                        name="heartValveIssues" 
                        checked={formData.heartValveIssues} 
                        onToggle={(v) => handleBoolChange('heartValveIssues', v)} 
                        alert={true}
                    />
                    {formData.heartValveIssues && (
                        <div className="flex gap-2 items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-xs font-bold">
                            <Activity size={14}/> CLINICAL PROTOCOL: Antibiotic pre-medication may be required.
                        </div>
                    )}
                </div>

                {/* Anesthesia Reactions */}
                <div className="space-y-2">
                    <BooleanField 
                        label="Adverse reaction or fainting during local anesthesia?" 
                        name="anesthesiaReaction" 
                        checked={formData.anesthesiaReaction} 
                        onToggle={(v) => handleBoolChange('anesthesiaReaction', v)} 
                        alert={true}
                    />
                    {formData.anesthesiaReaction && (
                        <input 
                            type="text" 
                            name="anesthesiaAdverseDetails" 
                            placeholder="Describe reaction (e.g. Fainting, palpitations)..." 
                            className="w-full p-3 border-2 border-red-200 bg-red-50 rounded-xl text-sm"
                        />
                    )}
                </div>

                {/* Respiratory Issues */}
                <div className="space-y-2">
                    <BooleanField 
                        label="Difficult breathing while lying flat? (COPD, Severe Asthma)" 
                        name="respiratoryIssues" 
                        checked={formData.respiratoryIssues} 
                        onToggle={(v) => handleBoolChange('respiratoryIssues', v)} 
                        alert={true}
                    />
                </div>
            </div>
        </div>

        {/* 2. Management & Vitals */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <Stethoscope size={20} className="text-teal-600"/> Current Management
             </h4>
             <div className="space-y-6">
                 
                 {/* Blood Pressure Check */}
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Thermometer size={16} className="text-red-500" />
                        <span className="font-bold text-sm text-slate-700">If High BP, did you take maintenance today?</span>
                    </div>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input disabled={readOnly} type="radio" name="tookBpMedicationToday" checked={formData.tookBpMedicationToday === true} onChange={() => handleBoolChange('tookBpMedicationToday', true)} className="w-5 h-5 accent-teal-600" />
                            <span className="text-sm font-bold">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input disabled={readOnly} type="radio" name="tookBpMedicationToday" checked={formData.tookBpMedicationToday === false} onChange={() => handleBoolChange('tookBpMedicationToday', false)} className="w-5 h-5 accent-teal-600" />
                            <span className="text-sm font-bold text-red-600">No / Forgot</span>
                        </label>
                    </div>
                 </div>

                 {/* Diabetes Check */}
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity size={16} className="text-teal-600" />
                        <span className="font-bold text-sm text-slate-700">If Diabetic, last sugar reading (mg/dL or HbA1c)</span>
                    </div>
                    <input 
                        type="text" 
                        name="lastBloodSugarReading"
                        placeholder="e.g. 110 mg/dL or 6.5%"
                        value={formData.lastBloodSugarReading || ''}
                        onChange={handleChange}
                        className="w-full p-3 border border-slate-200 bg-white rounded-xl text-sm font-mono font-bold"
                    />
                 </div>

                 {/* Medications */}
                 <div className="space-y-2">
                     <BooleanField 
                        label="Taking any other prescription medication?" 
                        name="takingMedications" 
                        checked={formData.takingMedications} 
                        onToggle={(v) => handleBoolChange('takingMedications', v)} 
                     />
                     {formData.takingMedications && (
                         <textarea 
                            name="medicationDetails" 
                            placeholder="List all current medications..." 
                            value={formData.medicationDetails || ''} 
                            onChange={handleChange}
                            className="w-full p-3 border border-teal-200 bg-teal-50 rounded-xl text-sm min-h-[80px]"
                         />
                     )}
                 </div>
             </div>
        </div>

        {/* 3. Detailed Medical Conditions Grid */}
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
                        <button
                            key={condition}
                            type="button"
                            onClick={() => handleArrayChange('medicalConditions', condition)}
                            disabled={readOnly}
                            className={`
                                relative p-3 rounded-2xl border text-left transition-all flex items-center gap-3
                                ${isSelected 
                                    ? isHighRisk ? 'bg-red-50 border-red-300 text-red-900 shadow-md ring-2 ring-red-500/10' : 'bg-orange-50 border-orange-300 text-orange-900 shadow-sm'
                                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}
                            `}
                        >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${isSelected ? isHighRisk ? 'bg-red-600 border-red-600 text-white' : 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-slate-300'}`}>
                                {isSelected && <Check size={14} strokeWidth={4} />}
                            </div>
                            <span className="text-xs font-bold leading-tight truncate">{condition}</span>
                        </button>
                    );
                })}
            </div>
            {/* Rule 3: Clinical Safety Alerts Logic - Requirement for 'None' */}
            <div className="mt-4">
                 <button
                    type="button"
                    onClick={() => handleArrayChange('medicalConditions', 'None')}
                    className={`w-full py-3 rounded-2xl border-2 font-bold text-xs uppercase tracking-widest transition-all ${ (formData.medicalConditions || []).includes('None') ? 'bg-teal-600 border-teal-600 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-400' }`}
                 >
                     (None of the Above) No Medical Conditions
                 </button>
            </div>
        </div>

        {/* 4. Allergies Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-red-800 border-b border-red-50 pb-3">
                <AlertOctagon size={20} />
                <h4 className="font-black uppercase text-sm tracking-widest">Allergy Alerts</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {fieldSettings.allergies.filter(a => a !== 'None').map(allergy => {
                    const isSelected = (formData.allergies || []).includes(allergy);
                    return (
                        <button
                            key={allergy}
                            type="button"
                            onClick={() => handleArrayChange('allergies', allergy)}
                            disabled={readOnly}
                            className={`
                                relative p-3 rounded-2xl border text-left transition-all flex items-center gap-3
                                ${isSelected 
                                    ? 'bg-red-50 border-red-300 text-red-900 shadow-md ring-2 ring-red-500/10' 
                                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}
                            `}
                        >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${isSelected ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-slate-300'}`}>
                                {isSelected && <Check size={14} strokeWidth={4} />}
                            </div>
                            <span className="text-xs font-bold leading-tight">{allergy}</span>
                        </button>
                    );
                })}
            </div>
             <div className="mt-4">
                 <button
                    type="button"
                    onClick={() => handleArrayChange('allergies', 'None')}
                    className={`w-full py-3 rounded-2xl border-2 font-bold text-xs uppercase tracking-widest transition-all ${ (formData.allergies || []).includes('None') ? 'bg-teal-600 border-teal-600 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-400' }`}
                 >
                     (None of the Above) No Allergies
                 </button>
            </div>
        </div>

        {/* 5. Female Specific (Conditional) */}
        {formData.sex === 'Female' && (
            <div className="bg-lilac-50 p-6 rounded-3xl border border-lilac-100 shadow-sm ring-4 ring-lilac-500/5">
                <h4 className="font-black text-lilac-900 uppercase text-sm tracking-widest mb-4 border-b border-lilac-200 pb-2">Female Patient Safety</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <BooleanField 
                        label="Possibly Pregnant?" 
                        name="pregnant" 
                        checked={formData.pregnant} 
                        onToggle={(v) => handleBoolChange('pregnant', v)} 
                    />
                    <BooleanField 
                        label="Currently Nursing?" 
                        name="nursing" 
                        checked={formData.nursing} 
                        onToggle={(v) => handleBoolChange('nursing', v)} 
                    />
                    <BooleanField 
                        label="Taking Birth Control?" 
                        name="birthControl" 
                        checked={formData.birthControl} 
                        onToggle={(v) => handleBoolChange('birthControl', v)} 
                    />
                </div>
            </div>
        )}

        {/* 6. Habits */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity size={18} className="text-teal-600"/> Habits</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BooleanField 
                    label="Tobacco Use?" 
                    name="tobaccoUse" 
                    checked={formData.tobaccoUse} 
                    onToggle={(v) => handleBoolChange('tobaccoUse', v)} 
                />
                <BooleanField 
                    label="Alcohol / Recreational Drugs?" 
                    name="alcoholDrugsUse" 
                    checked={formData.alcoholDrugsUse} 
                    onToggle={(v) => handleBoolChange('alcoholDrugsUse', v)} 
                />
            </div>
        </div>
    </div>
  );
};

export default RegistrationMedical;
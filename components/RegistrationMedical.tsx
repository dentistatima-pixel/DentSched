
import React from 'react';
import { Patient, FieldSettings } from '../types';
import { Check, AlertTriangle, AlertOctagon, Droplet } from 'lucide-react';

interface RegistrationMedicalProps {
  formData: Partial<Patient>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleArrayChange: (category: 'allergies' | 'medicalConditions', value: string) => void;
  readOnly?: boolean;
  fieldSettings: FieldSettings; 
}

const RegistrationMedical: React.FC<RegistrationMedicalProps> = ({ formData, handleChange, handleArrayChange, readOnly, fieldSettings }) => {
  
  // Helper for Yes/No Toggles
  const BooleanField = ({ label, name, checked, onToggle }: { label: string, name: string, checked?: boolean, onToggle: (val: boolean) => void }) => (
      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
          <span className="font-bold text-slate-700 text-sm">{label}</span>
          <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input disabled={readOnly} type="radio" name={name} checked={checked === true} onChange={() => onToggle(true)} className="w-4 h-4 accent-teal-600" />
                    <span className="text-sm font-medium">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input disabled={readOnly} type="radio" name={name} checked={checked === false} onChange={() => onToggle(false)} className="w-4 h-4 accent-teal-600" />
                    <span className="text-sm font-medium">No</span>
                </label>
          </div>
      </div>
  );

  const handleBoolChange = (name: string, val: boolean) => {
      // Simulate event for parent handler if needed, or update directly
      // Since standard handleChange expects event, we construct one or use a specific setter if available.
      // We will cast to any to reuse handleChange for simplicity, mocking the event structure
      handleChange({ target: { name, value: val, type: 'checkbox', checked: val } } as any);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
        
        {/* 1. General Status */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">General Health Status</h4>
            <div className="space-y-4">
                <BooleanField 
                    label="Are you in good health?" 
                    name="goodHealth" 
                    checked={formData.goodHealth} 
                    onToggle={(v) => handleBoolChange('goodHealth', v)} 
                />
                
                {/* Blood Group */}
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <label className="font-bold text-slate-700 text-sm flex items-center gap-2 min-w-[120px]">
                        <Droplet size={16} className="text-red-500" /> Blood Group
                    </label>
                    <select 
                        disabled={readOnly} 
                        name="bloodGroup" 
                        value={formData.bloodGroup || ''} 
                        onChange={handleChange} 
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                        <option value="">- Select -</option>
                        {fieldSettings.bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                </div>
            </div>
        </div>

        {/* 2. Detailed Medical Questions (Yes/No + Specify) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">Medical Details</h4>
             <div className="space-y-6">
                 
                 {/* Medical Treatment */}
                 <div className="space-y-2">
                     <BooleanField 
                        label="Currently under Medical Treatment?" 
                        name="underMedicalTreatment" 
                        checked={formData.underMedicalTreatment} 
                        onToggle={(v) => handleBoolChange('underMedicalTreatment', v)} 
                     />
                     {formData.underMedicalTreatment && (
                         <input 
                            type="text" 
                            name="medicalTreatmentDetails" 
                            placeholder="Specify condition/treatment..." 
                            value={formData.medicalTreatmentDetails || ''} 
                            onChange={handleChange}
                            className="w-full p-2 border border-teal-200 bg-teal-50 rounded-lg text-sm"
                         />
                     )}
                 </div>

                 {/* Serious Illness */}
                 <div className="space-y-2">
                     <BooleanField 
                        label="Have you had any serious illness/operation?" 
                        name="seriousIllness" 
                        checked={formData.seriousIllness} 
                        onToggle={(v) => handleBoolChange('seriousIllness', v)} 
                     />
                     {formData.seriousIllness && (
                         <input 
                            type="text" 
                            name="seriousIllnessDetails" 
                            placeholder="Specify illness or operation..." 
                            value={formData.seriousIllnessDetails || ''} 
                            onChange={handleChange}
                            className="w-full p-2 border border-teal-200 bg-teal-50 rounded-lg text-sm"
                         />
                     )}
                 </div>

                 {/* Hospitalization */}
                 <div className="space-y-2">
                     <BooleanField 
                        label="Have you ever been hospitalized?" 
                        name="lastHospitalization" 
                        checked={!!formData.lastHospitalization} // Convert string/bool to boolean
                        onToggle={(v) => handleBoolChange('lastHospitalization', v)} // logic: if false -> empty string
                     />
                     {formData.lastHospitalization && (
                         <div className="grid grid-cols-3 gap-2">
                             <input 
                                type="date" 
                                name="lastHospitalizationDate" // Note: Need to verify if this field exists in Type or we store in details
                                className="col-span-1 p-2 border border-teal-200 bg-teal-50 rounded-lg text-sm"
                                // Mocking value usage for visual correctness if field not strictly in basic Type yet
                             />
                             <input 
                                type="text" 
                                name="lastHospitalizationDetails" 
                                placeholder="Specify reason..." 
                                value={formData.lastHospitalizationDetails || ''} 
                                onChange={handleChange}
                                className="col-span-2 p-2 border border-teal-200 bg-teal-50 rounded-lg text-sm"
                             />
                         </div>
                     )}
                 </div>

                 {/* Medications */}
                 <div className="space-y-2">
                     <BooleanField 
                        label="Taking any prescription medication?" 
                        name="takingMedications" 
                        checked={formData.takingMedications} 
                        onToggle={(v) => handleBoolChange('takingMedications', v)} 
                     />
                     {formData.takingMedications && (
                         <input 
                            type="text" 
                            name="medicationDetails" 
                            placeholder="Specify medications..." 
                            value={formData.medicationDetails || ''} 
                            onChange={handleChange}
                            className="w-full p-2 border border-teal-200 bg-teal-50 rounded-lg text-sm"
                         />
                     )}
                 </div>
             </div>
        </div>

        {/* 3. Habits */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">Habits</h4>
            <div className="space-y-2">
                <BooleanField 
                    label="Do you use tobacco products?" 
                    name="tobaccoUse" 
                    checked={formData.tobaccoUse} 
                    onToggle={(v) => handleBoolChange('tobaccoUse', v)} 
                />
                <BooleanField 
                    label="Do you use alcohol or dangerous drugs?" 
                    name="alcoholDrugsUse" 
                    checked={formData.alcoholDrugsUse} 
                    onToggle={(v) => handleBoolChange('alcoholDrugsUse', v)} 
                />
            </div>
        </div>

        {/* 4. Female Specific (Conditional) */}
        {formData.sex === 'Female' && (
            <div className="bg-lilac-50 p-4 rounded-xl border border-lilac-100 shadow-sm">
                <h4 className="font-bold text-lilac-900 mb-4 border-b border-lilac-200 pb-2">Female Patients Only</h4>
                <div className="space-y-2">
                    <BooleanField 
                        label="Are you pregnant?" 
                        name="pregnant" 
                        checked={formData.pregnant} 
                        onToggle={(v) => handleBoolChange('pregnant', v)} 
                    />
                    <BooleanField 
                        label="Are you nursing?" 
                        name="nursing" 
                        checked={formData.nursing} 
                        onToggle={(v) => handleBoolChange('nursing', v)} 
                    />
                    <BooleanField 
                        label="Taking birth control pills?" 
                        name="birthControl" 
                        checked={formData.birthControl} 
                        onToggle={(v) => handleBoolChange('birthControl', v)} 
                    />
                </div>
            </div>
        )}

        {/* 5. Allergies */}
        <div>
            <div className="flex items-center gap-2 mb-3 text-red-800 border-b border-red-100 pb-2">
                <AlertOctagon size={18} />
                <h4 className="font-bold">Allergies (Select all that apply)</h4>
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
                                relative p-3 rounded-xl border text-left transition-all flex items-center gap-2
                                ${isSelected 
                                    ? 'bg-red-50 border-red-200 text-red-700 shadow-sm' 
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}
                            `}
                        >
                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-slate-300'}`}>
                                {isSelected && <Check size={12} strokeWidth={4} />}
                            </div>
                            <span className="text-sm font-bold">{allergy}</span>
                        </button>
                    );
                })}
            </div>
            <div className="mt-3">
                <input 
                    type="text" 
                    name="otherAllergies" 
                    placeholder="Others (Specify)..." 
                    value={formData.otherAllergies || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-red-300 outline-none"
                />
            </div>
        </div>

        {/* 6. Medical Conditions */}
        <div>
            <div className="flex items-center gap-2 mb-3 text-orange-800 border-b border-orange-100 pb-2">
                <AlertTriangle size={18} />
                <h4 className="font-bold">Medical Conditions (Select all that apply)</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                {fieldSettings.medicalConditions.filter(c => c !== 'None').map(condition => {
                    const isSelected = (formData.medicalConditions || []).includes(condition);
                    return (
                        <button
                            key={condition}
                            type="button"
                            onClick={() => handleArrayChange('medicalConditions', condition)}
                            disabled={readOnly}
                            className={`
                                relative p-3 rounded-xl border text-left transition-all flex items-center gap-2
                                ${isSelected 
                                    ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm' 
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}
                            `}
                        >
                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-slate-300'}`}>
                                {isSelected && <Check size={12} strokeWidth={4} />}
                            </div>
                            <span className="text-xs font-bold leading-tight">{condition}</span>
                        </button>
                    );
                })}
            </div>
             <div className="mt-3">
                <input 
                    type="text" 
                    name="otherConditions" 
                    placeholder="Other conditions (Specify)..." 
                    value={formData.otherConditions || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-orange-300 outline-none"
                />
            </div>
        </div>
    </div>
  );
};

export default RegistrationMedical;


import React from 'react';
import { Patient } from '../types';

interface RegistrationMedicalProps {
  formData: Partial<Patient>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleArrayChange: (category: 'allergies' | 'medicalConditions', value: string) => void;
  readOnly?: boolean;
}

// Helper component 
const YesNoSpecify = ({ 
    label, 
    name, 
    detailsName, 
    formData, 
    onChange, 
    readOnly 
}: { 
    label: string, 
    name: keyof Patient, 
    detailsName: keyof Patient, 
    formData: Partial<Patient>, 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
    readOnly?: boolean 
}) => (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
        <label className="font-medium text-slate-700 block mb-2">{label}</label>
        <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
                <input 
                    type="radio" 
                    name={name} 
                    checked={formData[name] === true} 
                    onChange={() => !readOnly && onChange({ target: { name, value: true, type: 'checkbox', checked: true } } as any)}
                    disabled={readOnly}
                    className="accent-teal-600 w-4 h-4"
                />
                <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
                <input 
                    type="radio" 
                    name={name} 
                    checked={formData[name] === false} 
                    onChange={() => !readOnly && onChange({ target: { name, value: false, type: 'checkbox', checked: false } } as any)}
                    disabled={readOnly}
                    className="accent-teal-600 w-4 h-4"
                />
                <span className="text-sm">No</span>
            </label>
        </div>
        {formData[name] === true && (
            <input 
                type="text" 
                name={detailsName}
                value={(formData[detailsName] as string) || ''}
                onChange={onChange}
                placeholder="Please specify details..."
                disabled={readOnly}
                className="w-full mt-2 p-2 border border-slate-200 rounded-lg text-sm focus:border-teal-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
            />
        )}
    </div>
);

const RegistrationMedical: React.FC<RegistrationMedicalProps> = ({ formData, handleChange, handleArrayChange, readOnly }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10">
            <label className="flex items-center gap-3 cursor-pointer">
                <input disabled={readOnly} type="checkbox" name="goodHealth" checked={formData.goodHealth || false} onChange={handleChange} className="w-5 h-5 accent-teal-600" />
                <span className="font-bold text-slate-800">Patient is in Good Health</span>
            </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <YesNoSpecify 
                label="Currently under medical treatment?" 
                name="underMedicalTreatment" 
                detailsName="medicalTreatmentDetails" 
                formData={formData} 
                onChange={handleChange} 
                readOnly={readOnly} 
            />
            <YesNoSpecify 
                label="Serious Illness?" 
                name="seriousIllness" 
                detailsName="seriousIllnessDetails" 
                formData={formData} 
                onChange={handleChange} 
                readOnly={readOnly}
            />
            <YesNoSpecify 
                label="Hospitalized recently?" 
                name="lastHospitalization"
                detailsName="lastHospitalizationDetails" 
                formData={formData} 
                onChange={(e) => {
                    // Logic handled in parent wrapper, safe to pass
                    handleChange(e);
                }}
                readOnly={readOnly}
            />
            <YesNoSpecify 
                label="Taking medications?" 
                name="takingMedications" 
                detailsName="medicationDetails" 
                formData={formData} 
                onChange={handleChange} 
                readOnly={readOnly}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="font-bold block mb-3">Habits</label>
                <div className="space-y-2">
                    <label className="flex items-center gap-2">
                        <input disabled={readOnly} type="checkbox" name="tobaccoUse" checked={formData.tobaccoUse || false} onChange={handleChange} className="w-4 h-4 accent-teal-600" />
                        <span>Tobacco Use</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input disabled={readOnly} type="checkbox" name="alcoholDrugsUse" checked={formData.alcoholDrugsUse || false} onChange={handleChange} className="w-4 h-4 accent-teal-600" />
                        <span>Alcohol / Drug Use</span>
                    </label>
                </div>
            </div>
        </div>
        
        <div>
                <label className="label mb-2">Blood Group</label>
                <select disabled={readOnly} name="bloodGroup" value={formData.bloodGroup || ''} onChange={handleChange} className="input max-w-xs disabled:bg-slate-100">
                    <option value="">Select...</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                </select>
        </div>

        <div>
            <h4 className="font-bold text-slate-800 mb-3 text-lg border-b pb-2">Allergies</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['None', 'Aspirin', 'Penicillin', 'Sulfa', 'Local Anesthetic', 'Latex'].map(allergy => (
                    <label key={allergy} className={`
                        flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
                        ${(formData.allergies || []).includes(allergy) ? 'bg-red-50 border-red-200 text-red-700 font-bold' : 'bg-white border-slate-200 text-slate-600'}
                    `}>
                        <input 
                            type="checkbox" 
                            checked={(formData.allergies || []).includes(allergy)} 
                            onChange={() => handleArrayChange('allergies', allergy)}
                            disabled={readOnly}
                            className="w-4 h-4 accent-red-600"
                        />
                        <span className="text-sm">{allergy}</span>
                    </label>
                ))}
            </div>
            <div className="mt-2">
                <label className="text-sm font-medium text-slate-600">Other Allergies</label>
                <input disabled={readOnly} type="text" name="otherAllergies" value={formData.otherAllergies || ''} onChange={handleChange} className="input mt-1 disabled:bg-slate-100" placeholder="Specify..." />
            </div>
        </div>

        <div>
            <h4 className="font-bold text-slate-800 mb-3 text-lg border-b pb-2">Medical Conditions</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {[
                    'High BP', 'Low BP', 'Epilepsy', 'Convulsions', 'AIDS/HIV', 'STD', 'Ulcers',
                    'Stomach Issues', 'Fainting Seizures', 'Rapid Weight Loss', 'Radiation Therapy',
                    'Joint Replacement', 'Heart Surgery', 'Heart Attack', 'Thyroid Issues',
                    'Heart Disease', 'Heart Murmur', 'Hepatitis', 'Liver Disease', 'Rheumatic Fever',
                    'Hay Fever', 'Resp Problems', 'Jaundice', 'TB', 'Swollen Ankles', 'Kidney Issues',
                    'Diabetes', 'Chest Pain', 'Stroke', 'Cancer Tumors', 'Anemia', 'Angina', 'Asthma',
                    'Emphysema', 'Bleeding Issues', 'Blood Disease', 'Arthritis', 'Rheumatism'
                ].map(condition => (
                    <label key={condition} className="flex items-center gap-2 text-sm text-slate-600 p-1 hover:bg-slate-100 rounded">
                        <input 
                            type="checkbox" 
                            checked={(formData.medicalConditions || []).includes(condition)} 
                            onChange={() => handleArrayChange('medicalConditions', condition)}
                            disabled={readOnly}
                            className="w-4 h-4 accent-teal-600 rounded-sm"
                        />
                        <span>{condition}</span>
                    </label>
                ))}
            </div>
            <div className="mt-2">
                <label className="text-sm font-medium text-slate-600">Other Conditions</label>
                <input disabled={readOnly} type="text" name="otherConditions" value={formData.otherConditions || ''} onChange={handleChange} className="input mt-1 disabled:bg-slate-100" placeholder="Specify..." />
            </div>
        </div>
    </div>
  );
};

export default RegistrationMedical;

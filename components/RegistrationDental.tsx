import React from 'react';
import { Patient, RegistrationField } from '../types';
import { Activity } from 'lucide-react';

interface RegistrationDentalProps {
    formData: Partial<Patient>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleArrayChange: (category: 'allergies' | 'medicalConditions', value: string) => void;
    readOnly?: boolean;
    registrationFields: RegistrationField[];
}

// NOTE: DynamicFieldRenderer component mentioned in the prompt is not available.
// This section has been commented out to prevent compilation errors.
// const DynamicFieldRenderer = (props: any) => <div>Dynamic Field Placeholder</div>;


export const RegistrationDental: React.FC<RegistrationDentalProps> = ({
    formData, handleChange, handleArrayChange, readOnly, registrationFields
}) => {
    const dentalFields = registrationFields.filter(f => f.section === 'DENTAL');
    
    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-teal-800 flex items-center gap-2">
                <Activity size={24} /> Dental History
            </h3>
            
            {/* Previous Dentist */}
            <div>
                <label className="block font-bold text-slate-700 mb-2">
                    Previous Dentist (if any)
                </label>
                <input
                    type="text"
                    name="previousDentist"
                    value={formData.previousDentist || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="w-full h-14 px-4 rounded-xl border-2 border-slate-200 text-lg"
                    placeholder="Dr. Juan Dela Cruz"
                />
            </div>
            
            {/* Last Dental Visit */}
            <div>
                <label className="block font-bold text-slate-700 mb-2">
                    Last Dental Visit
                </label>
                <input
                    type="date"
                    name="lastDentalVisit"
                    value={formData.lastDentalVisit || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="w-full h-14 px-4 rounded-xl border-2 border-slate-200 text-lg"
                />
            </div>
            
            {/* Chief Complaint */}
            <div>
                <label className="block font-bold text-slate-700 mb-2">
                    Chief Complaint / Reason for Visit
                    <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                    name="chiefComplaint"
                    value={formData.chiefComplaint || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-lg"
                    placeholder="Please describe your dental concern..."
                />
            </div>
            
            {/* Dental-specific allergies */}
            <div>
                <label className="block font-bold text-slate-700 mb-3">
                    Dental-Specific Allergies
                </label>
                <div className="grid grid-cols-2 gap-4">
                    {['Latex', 'Anesthetic', 'Penicillin', 'Ibuprofen', 'Aspirin'].map(allergy => (
                        <label key={allergy} className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 cursor-pointer hover:bg-teal-50 transition-colors">
                            <input
                                type="checkbox"
                                checked={(formData.allergies || []).includes(allergy)}
                                onChange={() => handleArrayChange('allergies', allergy)}
                                disabled={readOnly}
                                className="w-8 h-8 rounded-lg"
                            />
                            <span className="text-lg font-medium">{allergy}</span>
                        </label>
                    ))}
                </div>
            </div>
            
            {/* Other dental allergies */}
            <div>
                <label className="block font-bold text-slate-700 mb-2">
                    Other Dental Allergies or Sensitivities
                </label>
                <input
                    type="text"
                    name="otherAllergies"
                    value={formData.otherAllergies || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="w-full h-14 px-4 rounded-xl border-2 border-slate-200 text-lg"
                    placeholder="e.g., Metal sensitivity, Fluoride intolerance"
                />
            </div>
            
            {/* 
            // TODO: DYNAMIC FIELDS from FieldManagement 
            // The DynamicFieldRenderer component needs to be implemented.
            {dentalFields.map(field => (
                <DynamicFieldRenderer 
                    key={field.id} 
                    field={field} 
                    formData={formData} 
                    handleChange={handleChange}
                    readOnly={readOnly}
                />
            ))}
            */}
        </div>
    );
};

export default RegistrationDental;

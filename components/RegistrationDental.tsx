import React from 'react';
import { Patient, FieldSettings } from '../types';
import { FileText, Calendar } from 'lucide-react';

interface RegistrationDentalProps {
  formData: Partial<Patient>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  readOnly?: boolean;
  fieldSettings: FieldSettings;
  isMasked?: boolean;
}

const RegistrationDental: React.FC<RegistrationDentalProps> = ({ 
    formData, handleChange, readOnly, fieldSettings, isMasked = false
}) => {

  const dentalFields = fieldSettings.identityFields.filter(f => f.section === 'DENTAL');
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dentalFields.map(field => {
                if (!field) return null;
                const isDate = field.type === 'date';
                const isTextarea = field.type === 'textarea';
                const value = (formData as any)[field.id] || '';
                const colSpan = field.width === 'full' ? 'md:col-span-2' : '';
                return (
                    <div key={field.id} className={colSpan}>
                        <label className="label flex items-center gap-2">
                            {isDate ? <Calendar size={14}/> : <FileText size={14}/>}
                            {field.label}
                        </label>
                        {isTextarea ? (
                            <textarea 
                                disabled={readOnly}
                                name={field.id}
                                value={value}
                                onChange={handleChange}
                                className="input h-32"
                            />
                        ) : (
                            <input 
                                disabled={readOnly} 
                                type={field.type} 
                                name={field.id} 
                                value={value} 
                                onChange={handleChange} 
                                className="input" 
                            />
                        )}
                    </div>
                );
            })}
        </div>
    </div>
  );
};

export default RegistrationDental;
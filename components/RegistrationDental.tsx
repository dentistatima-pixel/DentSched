import React from 'react';
import { Patient, FieldSettings } from '../types';
import { FileText, AlertCircle, EyeOff, Calendar } from 'lucide-react';

interface RegistrationDentalProps {
  formData: Partial<Patient>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onUpdateChart: (entry: any) => void;
  readOnly?: boolean;
  fieldSettings: FieldSettings;
  isMasked?: boolean;
}

const RegistrationDental: React.FC<RegistrationDentalProps> = ({ 
    formData, handleChange, onUpdateChart, readOnly, fieldSettings, isMasked = false
}) => {
  const handleDynamicAnswerChange = (q: string, val: string) => {
    const currentAnswers = { ...(formData.registryAnswers || {}) };
    currentAnswers[q] = val;
    handleChange({ target: { name: 'registryAnswers', value: currentAnswers } } as any);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fieldSettings.dentalHistoryRegistry.map(q => {
                const isDate = q.toLowerCase().includes('date');
                const isChecked = (formData.registryAnswers?.[q] as string) || '';
                return (
                    <div key={q}>
                        <label className="label flex items-center gap-2">
                            {isDate ? <Calendar size={14}/> : <FileText size={14}/>}
                            {q}
                        </label>
                        <input 
                            disabled={readOnly} 
                            type={isDate ? 'date' : 'text'} 
                            name={q} 
                            value={isChecked} 
                            onChange={(e) => handleDynamicAnswerChange(q, e.target.value)} 
                            className="input" 
                        />
                    </div>
                );
            })}
        </div>
        
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative overflow-hidden">
            <label className="label flex items-center gap-2">
                <FileText size={16} className="text-slate-500" />
                Detailed Dental History & Patient Concerns
            </label>
            <textarea 
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                disabled={readOnly}
                placeholder="List prior orthodontic work, restorations, extractions, or specific patient fears..."
                className="input h-48 resize-none bg-white"
            />
        </div>

        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 mt-6">
            <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 shrink-0 mt-1" size={20} />
                <div className="text-sm text-amber-900">
                    <p className="font-black uppercase tracking-tight mb-1">Clinical Record Verification</p>
                    <p className="text-xs opacity-80 leading-relaxed">By saving this form, you certify that the provided clinical history is true and accurate to the best of your knowledge for diagnostic purposes.</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default RegistrationDental;

import React from 'react';
import { Patient, FieldSettings } from '../types';
import { FileText, AlertCircle } from 'lucide-react';

interface RegistrationDentalProps {
  formData: Partial<Patient>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onUpdateChart: (entry: any) => void;
  readOnly?: boolean;
  fieldSettings: FieldSettings;
}

const RegistrationDental: React.FC<RegistrationDentalProps> = ({ 
    formData, handleChange, onUpdateChart, readOnly, fieldSettings 
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="label">Previous Dentist</label>
                <input disabled={readOnly} type="text" name="previousDentist" value={formData.previousDentist || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
            </div>
            <div>
                <label className="label">Last Visit Date</label>
                <input disabled={readOnly} type="date" name="lastVisit" value={formData.lastVisit || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
            </div>
        </div>
        
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <label className="label flex items-center gap-2">
                <FileText size={16} className="text-slate-500" />
                Dental History & Clinical Notes
            </label>
            <textarea 
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                disabled={readOnly}
                placeholder="Include any specific concerns, past treatments, orthodontic history, or dental fears..."
                className="input h-48 resize-none disabled:bg-slate-100"
            />
        </div>

        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 mt-6">
            <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 shrink-0 mt-1" size={20} />
                <div className="text-sm text-amber-900">
                    <p className="font-black uppercase tracking-tight mb-1">Clinical Verification</p>
                    <p className="text-xs opacity-80 leading-relaxed">By saving this record, you confirm the provided dental history is accurate for clinical documentation.</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default RegistrationDental;

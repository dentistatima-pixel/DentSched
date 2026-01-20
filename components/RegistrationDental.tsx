

import React from 'react';
import { Patient, FieldSettings } from '../types';
import { FileText, AlertCircle, EyeOff, Calendar } from 'lucide-react';

interface RegistrationDentalProps {
  previousDentist?: string;
  lastVisit?: string;
  notes?: string;
  onDentalChange: (field: 'previousDentist' | 'lastVisit' | 'notes', value: string) => void;
  readOnly?: boolean;
}

const RegistrationDental: React.FC<RegistrationDentalProps> = ({ 
    previousDentist, lastVisit, notes, onDentalChange, readOnly
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="label flex items-center gap-2">
                    <FileText size={14}/>
                    Previous Attending Dentist
                </label>
                <input 
                    disabled={readOnly} 
                    type="text" 
                    name="previousDentist" 
                    value={previousDentist || ''} 
                    onChange={(e) => onDentalChange('previousDentist', e.target.value)} 
                    className="input" 
                />
            </div>
            <div>
                <label className="label flex items-center gap-2">
                    <Calendar size={14}/>
                    Approximate Date of Last Visit
                </label>
                <input 
                    disabled={readOnly} 
                    type="date" 
                    name="lastVisit" 
                    value={lastVisit || ''} 
                    onChange={(e) => onDentalChange('lastVisit', e.target.value)} 
                    className="input" 
                />
            </div>
        </div>
        
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative overflow-hidden">
            <label className="label flex items-center gap-2">
                <FileText size={16} className="text-slate-500" />
                Detailed Dental History & Patient Concerns
            </label>
            <textarea 
                name="notes"
                value={notes || ''}
                onChange={(e) => onDentalChange('notes', e.target.value)}
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
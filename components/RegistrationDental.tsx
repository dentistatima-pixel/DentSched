
import React from 'react';
import { Patient } from '../types';
import { FileText, AlertCircle } from 'lucide-react';

interface RegistrationDentalProps {
  formData: Partial<Patient>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleArrayChange: (category: 'treatments', value: string) => void;
  handleTreatmentDetailChange: (proc: string, value: string) => void;
  readOnly?: boolean;
}

const RegistrationDental: React.FC<RegistrationDentalProps> = ({ 
    formData, handleChange, handleArrayChange, handleTreatmentDetailChange, readOnly 
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div>
            <label className="label">Previous Dentist</label>
            <input disabled={readOnly} type="text" name="previousDentist" value={formData.previousDentist || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
        </div>
        <div>
            <label className="label">Last Visit Date</label>
            <input disabled={readOnly} type="date" name="lastVisit" value={formData.lastVisit || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
        </div>
        
        <div>
            <h4 className="font-bold text-slate-800 mb-3">Past Treatments / Procedures</h4>
            <div className="space-y-3">
                {[
                    'Consultation', 'Oral Prophylaxis', 'Restoration', 'Extraction', 'Root Canal',
                    'Prosthodontics', 'Orthodontics', 'Surgery', 'Whitening', 'Denture Adjustments'
                ].map(proc => {
                    const isSelected = (formData.treatments || []).includes(proc);
                    return (
                        <div key={proc} className={`
                            rounded-xl border transition-all
                            ${isSelected ? 'bg-teal-50 border-teal-200 p-4' : 'bg-white border-slate-200 p-3'}
                        `}>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={() => handleArrayChange('treatments', proc)}
                                    disabled={readOnly}
                                    className="w-5 h-5 accent-teal-600"
                                />
                                <span className={`font-medium ${isSelected ? 'text-teal-900' : 'text-slate-700'}`}>{proc}</span>
                            </label>
                            
                            {isSelected && (
                                <div className="mt-2 ml-8 animate-in slide-in-from-top-2 fade-in">
                                    <input 
                                        type="text" 
                                        placeholder={`Details about ${proc}...`}
                                        value={formData.treatmentDetails?.[proc] || ''}
                                        onChange={(e) => handleTreatmentDetailChange(proc, e.target.value)}
                                        disabled={readOnly}
                                        className="w-full text-sm bg-white border border-teal-200 rounded-lg p-2 focus:ring-2 focus:ring-teal-500/20 outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="label flex items-center gap-2">
                <FileText size={16} className="text-slate-500" />
                General Notes
                </label>
                <textarea 
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                disabled={readOnly}
                placeholder="Add general patient notes here..."
                className="input h-32 resize-none disabled:bg-slate-100"
                />
            </div>

            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 mt-6">
                <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-600 shrink-0 mt-1" size={20} />
                <div className="text-sm text-yellow-800">
                    <p className="font-bold mb-1">Patient Signature on File</p>
                    <p>By saving this record, you confirm the patient has signed the physical intake form confirming the accuracy of this medical history.</p>
                    <div className="mt-4 border-b border-yellow-700/20 w-64 h-8 relative">
                        <span className="absolute bottom-1 text-xs text-yellow-700/50">Signature Placeholder</span>
                    </div>
                </div>
                </div>
            </div>
    </div>
  );
};

export default RegistrationDental;

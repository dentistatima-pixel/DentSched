import React from 'react';
import { Patient, FieldSettings } from '../types';
import { Activity, History, MessageSquare, ShieldAlert } from 'lucide-react';

const DentalHistoryQuestion: React.FC<{
    q: string;
    registryAnswers: Record<string, any>;
    onRegistryChange: (newAnswers: Record<string, any>) => void;
    readOnly?: boolean;
}> = ({ q, registryAnswers, onRegistryChange, readOnly }) => {
    const val = registryAnswers?.[q];
    const isYes = val === 'Yes';

    const handleAnswerChange = (answer: 'Yes' | 'No') => {
        if (readOnly) return;
        const newAnswers = { ...registryAnswers, [q]: answer };
        onRegistryChange(newAnswers);
    };

    return (
        <div className={`p-5 rounded-2xl border transition-all flex flex-col gap-4 bg-slate-50 border-slate-100`}>
            <div className="flex items-center gap-3">
                <Activity size={18} className="text-slate-500"/>
                <span className="font-black text-sm leading-tight uppercase tracking-tight text-slate-800">{q}</span>
            </div>
            <div className="flex gap-3 shrink-0">
                <button 
                    type="button" 
                    onClick={() => handleAnswerChange('Yes')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all font-black text-xs uppercase tracking-widest ${isYes ? 'bg-teal-600 border-teal-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}
                >
                    Yes
                </button>
                <button 
                    type="button" 
                    onClick={() => handleAnswerChange('No')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all font-black text-xs uppercase tracking-widest ${val === 'No' ? 'bg-slate-600 border-slate-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}
                >
                    No
                </button>
            </div>
        </div>
    );
};

interface RegistrationDentalProps {
    formData: Partial<Patient>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    readOnly?: boolean;
    fieldSettings: FieldSettings;
    registryAnswers: Record<string, any>;
    onRegistryChange: (newAnswers: Record<string, any>) => void;
}

const RegistrationDental: React.FC<RegistrationDentalProps> = ({
    formData, handleChange, readOnly, fieldSettings, registryAnswers, onRegistryChange
}) => {
    return (
        <div className="space-y-12">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl"><Activity size={24} /></div>
                    <h4 className="text-xl font-black uppercase text-slate-800 tracking-tight">Dental History</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="previousDentist" className="label text-xs flex items-center gap-2"><History size={14}/> Previous Dentist</label>
                        <input
                            id="previousDentist"
                            type="text"
                            name="previousDentist"
                            value={formData.previousDentist || ''}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="input bg-white"
                            placeholder="e.g., Dr. Jane Doe"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="lastDentalVisit" className="label text-xs">Last Dental Visit</label>
                        <input
                            id="lastDentalVisit"
                            type="date"
                            name="lastDentalVisit"
                            value={formData.lastDentalVisit || ''}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="input bg-white"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="chiefComplaint" className="label text-xs flex items-center gap-2"><MessageSquare size={14}/> Chief Complaint / Reason for Visit *</label>
                    <textarea
                        id="chiefComplaint"
                        name="chiefComplaint"
                        value={formData.chiefComplaint || ''}
                        onChange={handleChange}
                        disabled={readOnly}
                        rows={4}
                        className="input bg-white h-auto"
                        placeholder="Please describe your main dental concern..."
                        required
                    />
                </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                 <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
                    <div className="p-3 bg-lilac-50 text-lilac-600 rounded-2xl"><ShieldAlert size={24} /></div>
                    <h4 className="text-xl font-black uppercase text-slate-800 tracking-tight">Habits & Concerns</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(fieldSettings.dentalHistoryRegistry || []).map(question => (
                        <DentalHistoryQuestion
                            key={question}
                            q={question}
                            registryAnswers={registryAnswers || {}}
                            onRegistryChange={onRegistryChange}
                            readOnly={readOnly}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RegistrationDental;

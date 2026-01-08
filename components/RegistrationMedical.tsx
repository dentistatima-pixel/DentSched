import React from 'react';
import { Patient, FieldSettings } from '../types';
// Added missing Droplet and ShieldAlert imports
import { Check, ShieldAlert, Pill, Stethoscope, Activity, ShieldCheck, Zap, Edit3, ClipboardList, Baby, UserCircle, MapPin, Phone, Award, FileText, HeartPulse, Calendar, Droplet } from 'lucide-react';

interface RegistrationMedicalProps {
  formData: Partial<Patient>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleArrayChange: (category: 'allergies' | 'medicalConditions' | 'reportedMedications', value: string) => void;
  readOnly?: boolean;
  fieldSettings: FieldSettings; 
  isMasked?: boolean;
  designMode?: boolean;
  onFieldClick?: (fieldId: string, type: 'question' | 'condition' | 'allergy' | 'physician') => void;
  selectedFieldId?: string;
}

const RegistrationMedical: React.FC<RegistrationMedicalProps> = ({ 
    formData, handleChange, handleArrayChange, readOnly, fieldSettings,
    designMode = false, onFieldClick, selectedFieldId
}) => {
  
  const DesignWrapper = ({ id, type, children, className = "" }: { id: string, type: 'question' | 'condition' | 'allergy' | 'physician', children?: React.ReactNode, className?: string, key?: React.Key }) => {
    const isSelected = selectedFieldId === id;
    if (!designMode) return <div className={className}>{children}</div>;
    
    return (
        <div 
            onClick={(e) => { e.stopPropagation(); onFieldClick?.(id, type); }}
            className={`${className} relative group cursor-pointer transition-all duration-300 rounded-2xl border-2 ${isSelected ? 'border-lilac-500 bg-lilac-50/30 ring-4 ring-lilac-500/10' : 'border-transparent hover:border-teal-400 hover:bg-teal-50/20'}`}
        >
            <div className="absolute inset-0 z-20 cursor-pointer" />
            <div className="relative z-10 pointer-events-none">{children}</div>
            <div className={`absolute -top-3 -right-2 bg-lilac-600 text-white p-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-30 ${isSelected ? 'opacity-100' : ''}`}>
                <Edit3 size={12}/>
            </div>
        </div>
    );
  };

  const BooleanField = ({ label, q, icon: Icon, alert = false, type = 'question', className = "md:col-span-12", placeholder = "Specify condition, medication, or reason...", showDate = false }: { label: string, q: string, icon?: React.ElementType, alert?: boolean, type?: any, key?: React.Key, className?: string, placeholder?: string, showDate?: boolean }) => {
    const val = formData.registryAnswers?.[q];
    const isYes = val === 'Yes' || (typeof val === 'boolean' && val === true);
    const subVal = (formData.registryAnswers?.[`${q}_details`] as string) || '';
    const dateVal = (formData.registryAnswers?.[`${q}_date`] as string) || '';
    const needsDetails = q.includes('*');
    
    return (
        <DesignWrapper id={q} type={type} key={q} className={className}>
            <div className={`p-5 rounded-2xl border transition-all flex flex-col gap-4 ${alert && isYes ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-3 pr-4">
                    {Icon && <Icon size={18} className={alert && isYes ? 'text-red-600' : 'text-slate-500'}/>}
                    <span className={`font-black text-sm leading-tight uppercase tracking-tight ${alert && isYes ? 'text-red-800' : 'text-slate-800'}`}>{label}</span>
                </div>
                <div className="flex gap-3 shrink-0">
                    <button 
                        type="button" 
                        onClick={() => !readOnly && handleChange({ target: { name: 'registryAnswers', value: { ...(formData.registryAnswers || {}), [q]: 'Yes' } } } as any)} 
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all font-black text-xs uppercase tracking-widest ${isYes ? 'bg-teal-600 border-teal-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}
                    >
                        Yes
                    </button>
                    <button 
                        type="button" 
                        onClick={() => !readOnly && handleChange({ target: { name: 'registryAnswers', value: { ...(formData.registryAnswers || {}), [q]: 'No' } } } as any)} 
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all font-black text-xs uppercase tracking-widest ${val === 'No' ? 'bg-slate-600 border-slate-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}
                    >
                        No
                    </button>
                </div>
                {(isYes || designMode) && needsDetails && (
                    <div className="animate-in slide-in-from-top-1 border-t border-slate-100 pt-4 mt-1 space-y-4">
                        {showDate && (
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2 block flex items-center gap-2"><Calendar size={12}/> Approximate Date of Event</label>
                                <input 
                                    type="date"
                                    value={dateVal}
                                    onChange={(e) => !readOnly && handleChange({ target: { name: 'registryAnswers', value: { ...(formData.registryAnswers || {}), [`${q}_date`]: e.target.value } } } as any)}
                                    className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 shadow-inner"
                                />
                            </div>
                        )}
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2 block">Clinical Specification Narrative *</label>
                            <textarea 
                                value={subVal} 
                                onChange={(e) => !readOnly && handleChange({ target: { name: 'registryAnswers', value: { ...(formData.registryAnswers || {}), [`${q}_details`]: e.target.value } } } as any)}
                                placeholder={placeholder}
                                className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 shadow-inner"
                            />
                        </div>
                    </div>
                )}
            </div>
        </DesignWrapper>
    );
  };

  const renderSection = (id: string) => {
    if (id === 'core_physicianName') {
        return (
            <DesignWrapper id={id} type="physician" key={id} className="md:col-span-12 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2 mb-2"><UserCircle size={14}/> Physician Identification</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="label text-[10px]">Physician Name</label><input type="text" value={formData.physicianName || ''} name="physicianName" onChange={handleChange} disabled={readOnly} className="input bg-white" /></div>
                    <div><label className="label text-[10px]"><Award size={12} className="inline mr-1"/> Specialty</label><input type="text" value={formData.physicianSpecialty || ''} name="physicianSpecialty" onChange={handleChange} disabled={readOnly} className="input bg-white" /></div>
                    <div><label className="label text-[10px]"><MapPin size={12} className="inline mr-1"/> Office Address</label><input type="text" value={formData.physicianAddress || ''} name="physicianAddress" onChange={handleChange} disabled={readOnly} className="input bg-white" /></div>
                    <div><label className="label text-[10px]"><Phone size={12} className="inline mr-1"/> Office Number</label><input type="tel" value={formData.physicianNumber || ''} name="physicianNumber" onChange={handleChange} disabled={readOnly} className="input bg-white" /></div>
                </div>
            </DesignWrapper>
        );
    }

    if (id === 'core_bloodGroup') {
        return (
            <DesignWrapper id={id} type="question" key={id} className="md:col-span-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Blood Type</span>
                <select name="bloodGroup" value={formData.bloodGroup || ''} onChange={handleChange} disabled={readOnly} className="w-32 p-2 text-center border rounded-xl bg-white font-black text-xs focus:ring-2 focus:ring-teal-500 outline-none">
                    <option value="">Unknown</option>
                    {fieldSettings.bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
            </DesignWrapper>
        );
    }

    if (id === 'core_bloodPressure') {
        return (
            <DesignWrapper id={id} type="question" key={id} className="md:col-span-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Blood Pressure</span>
                <input type="text" value={formData.bloodPressure || ''} name="bloodPressure" onChange={handleChange} disabled={readOnly} className="w-24 p-2 text-center border rounded-xl bg-white font-mono text-sm" placeholder="120/80" />
            </DesignWrapper>
        );
    }

    if (fieldSettings.identityQuestionRegistry.includes(id)) {
        const label = id.replace('*', '');
        let placeholder = undefined;
        let showDate = false;

        if (id === 'Are you under medical treatment now?*') {
            placeholder = "Specify condition, or reason...";
        } else if (id === 'Have you ever had serious illness or surgical operation?*') {
            placeholder = "Specify illness, surgery or reason...";
            showDate = true;
        } else if (id === 'Have you ever been hospitalized?*') {
            placeholder = "Specify reason...";
            showDate = true;
        } else if (id === 'Are you taking any prescription/non-prescription medication?*') {
            placeholder = "Specify medication";
        }

        return <BooleanField key={id} label={label} q={id} icon={Stethoscope} placeholder={placeholder} showDate={showDate} />;
    }

    if (id.startsWith('al_')) {
        const allergy = id.replace('al_', '');
        const isSelected = (formData.allergies || []).includes(allergy);
        return (
            <DesignWrapper key={id} id={id} type="allergy" className="md:col-span-4">
                <button 
                    type="button" 
                    onClick={() => !readOnly && handleArrayChange('allergies', allergy)}
                    className={`w-full p-3 rounded-2xl border-2 text-left flex items-center gap-3 transition-all ${isSelected ? 'bg-red-600 border-red-600 text-white shadow-lg scale-105' : 'bg-white border-slate-100 hover:border-red-200'}`}
                >
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-white border-white' : 'bg-slate-50 border-slate-200'}`}>
                        {isSelected && <Check size={12} className="text-red-600"/>}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-tight leading-none ${isSelected ? 'text-white' : 'text-slate-600'}`}>{allergy}</span>
                </button>
            </DesignWrapper>
        );
    }

    if (id === 'field_otherAllergies') {
        return (
            <DesignWrapper key={id} id={id} type="allergy" className="md:col-span-12">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                    <label className="label text-[10px] flex items-center gap-2"><FileText size={12}/> Other Allergies (Question #8)</label>
                    <input 
                        type="text" 
                        name="otherAllergies" 
                        value={formData.otherAllergies || ''} 
                        onChange={handleChange} 
                        disabled={readOnly}
                        placeholder="Please specify other allergies..."
                        className="input bg-slate-50/50"
                    />
                </div>
            </DesignWrapper>
        );
    }

    return null;
  };

  const mainMedicalOrder = fieldSettings.medicalLayoutOrder.filter(id => 
    !id.startsWith('al_') && 
    id !== 'field_otherAllergies' && 
    id !== 'core_bloodGroup' && 
    id !== 'core_bloodPressure'
  );

  const bloodAndPressureOrder = fieldSettings.medicalLayoutOrder.filter(id => 
    id === 'core_bloodGroup' || id === 'core_bloodPressure'
  );

  const allergiesOrder = fieldSettings.medicalLayoutOrder.filter(id => 
    id.startsWith('al_') || id === 'field_otherAllergies'
  );

  return (
    <div className="space-y-8 pb-10">
        
        <div className="bg-white border-2 border-teal-100 p-6 rounded-3xl shadow-sm ring-4 ring-teal-500/5">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-teal-50 rounded-xl text-teal-700"><ShieldCheck size={20} /></div>
                <h3 className="font-bold text-lg text-slate-800">Clinical Data Sharing Authorization</h3>
            </div>
            <label className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${formData.practiceCommConsent ? 'bg-teal-50 border-teal-700 shadow-md' : 'bg-white border-slate-200'}`}>
                <input type="checkbox" name="practiceCommConsent" checked={formData.practiceCommConsent} onChange={handleChange} disabled={readOnly} className="w-6 h-6 accent-teal-700 rounded mt-1 shrink-0" />
                <div>
                    <span className="font-extrabold text-teal-900 uppercase text-xs">Clinical Coordination Consent *</span>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">I authorize clinical data sharing with relevant specialists for coordinated patient care.</p>
                </div>
            </label>
        </div>

        {/* MEDICAL HISTORY SECTION */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><HeartPulse size={24}/></div>
                <h4 className="text-xl font-black uppercase text-slate-800 tracking-tight">MEDICAL HISTORY</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {mainMedicalOrder.map(id => renderSection(id))}
            </div>
        </div>

        {/* BLOOD AND PRESSURE SECTION */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><Droplet size={24}/></div>
                <h4 className="text-xl font-black uppercase text-slate-800 tracking-tight">Blood and Pressure</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {bloodAndPressureOrder.map(id => renderSection(id))}
            </div>
        </div>

        {/* ALLERGIES SECTION */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
                <div className="p-3 bg-lilac-50 text-lilac-600 rounded-2xl"><ShieldAlert size={24}/></div>
                <h4 className="text-xl font-black uppercase text-slate-800 tracking-tight">Allergies</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {allergiesOrder.map(id => renderSection(id))}
            </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
                <div className="p-3 bg-slate-50 text-slate-700 rounded-2xl"><ClipboardList size={24}/></div>
                <h4 className="text-lg font-black uppercase text-slate-800 tracking-tight">Diagnostic Conditions Registry</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fieldSettings.medicalConditions.map(condition => {
                    const isSelected = (formData.medicalConditions || []).includes(condition);
                    return (
                        <DesignWrapper key={condition} id={condition} type="condition">
                            <button 
                                type="button" 
                                onClick={() => !readOnly && handleArrayChange('medicalConditions', condition)}
                                className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-3 transition-all ${isSelected ? 'bg-teal-600 border-teal-600 text-white shadow-lg scale-105' : 'bg-white border-slate-100 hover:border-teal-200'}`}
                            >
                                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-white border-white' : 'bg-slate-50 border-slate-200'}`}>
                                    {isSelected && <Check size={12} className="text-teal-600"/>}
                                </div>
                                <span className={`text-xs font-black uppercase tracking-tight leading-none ${isSelected ? 'text-white' : 'text-slate-600'}`}>{condition}</span>
                            </button>
                        </DesignWrapper>
                    );
                })}
            </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border-2 border-red-100 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-red-600" />
            <div className="flex items-center gap-3 mb-8">
                <ShieldAlert size={32} className="text-red-700" />
                <h4 className="font-black text-red-900 uppercase tracking-tight text-xl">Critical Clinical Red Flags</h4>
            </div>
            <div className="space-y-4">
                {fieldSettings.medicalRiskRegistry.map(q => {
                    const isRisk = q.startsWith('[RISK]');
                    const label = q.replace('[RISK] ', '').replace('*', '');
                    return <BooleanField key={q} label={label} q={q} alert={isRisk} icon={isRisk ? ShieldAlert : Activity} />;
                })}
            </div>
        </div>
    </div>
  );
};

export default RegistrationMedical;
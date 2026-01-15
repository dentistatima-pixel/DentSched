import React, { useMemo, useState, useEffect } from 'react';
/* Added missing types Patient and FieldSettings from ../types */
import { Patient, FieldSettings } from '../types';
import { Check, ShieldAlert, Pill, Stethoscope, Activity, ShieldCheck, Zap, Edit3, ClipboardList, Baby, UserCircle, MapPin, Phone, Award, FileText, HeartPulse, Calendar, Droplet, AlertTriangle, Shield } from 'lucide-react';

/**
 * REFACTORED: This is now a standard controlled textarea component.
 * It directly uses the `value` and `onChange` props from its parent.
 * The internal state and useEffect have been removed to prevent re-render loops.
 */
const ControlledTextarea: React.FC<{
  name: string;
  value: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}> = ({ name, value, placeholder, className, disabled, onChange }) => {
  return (
    <textarea
      name={name}
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
    />
  );
};

/**
 * REFACTORED: This is now a standard controlled input component.
 * It directly uses the `value` and `onChange` props from its parent.
 * The internal state and useEffect have been removed to prevent re-render loops.
 */
const ControlledInput: React.FC<{
  name: string;
  value: string;
  type?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ name, value, type = "text", placeholder, className, disabled, onChange }) => {
  return (
    <input
      name={name}
      type={type}
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
    />
  );
};

const DesignWrapper = ({ id, type, children, className = "", selectedFieldId, onFieldClick, designMode }: { id: string, type: 'question' | 'condition' | 'allergy' | 'physician', children?: React.ReactNode, className?: string, selectedFieldId?: string, onFieldClick?: any, designMode: boolean, key?: React.Key }) => {
  const isSelected = selectedFieldId === id;
  if (!designMode) return <div className={className}>{children}</div>;
  
  return (
      <div 
          onClick={(e) => { e.stopPropagation(); onFieldClick?.(id, type); }}
          className={`${className} relative group transition-all duration-300 rounded-2xl border-2 ${isSelected ? 'border-lilac-500 bg-lilac-50/30 ring-4 ring-lilac-500/10' : 'border-transparent hover:border-teal-400 hover:bg-teal-50/20'} p-1`}
      >
          <div className="relative z-10">{children}</div>
          <div className={`absolute top-2 right-2 bg-lilac-600 text-white p-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none ${isSelected ? 'opacity-100' : ''}`}>
              <Edit3 size={12}/>
          </div>
      </div>
  );
};

interface BooleanFieldProps {
    label: string;
    q: string;
    icon?: React.ElementType;
    alert?: boolean;
    type?: 'question' | 'condition' | 'allergy' | 'physician';
    className?: string;
    placeholder?: string;
    showDate?: boolean;
    formData: Partial<Patient>;
    handleChange: any;
    readOnly?: boolean;
    fieldSettings: FieldSettings;
    designMode: boolean;
    selectedFieldId?: string;
    onFieldClick?: any;
}

const BooleanField: React.FC<BooleanFieldProps> = ({ label, q, icon: Icon, alert = false, type = 'question', className = "md:col-span-12", placeholder = "Specify condition, medication, or reason...", showDate = false, formData, handleChange, readOnly, fieldSettings, designMode, selectedFieldId, onFieldClick }) => {
    const val = formData.registryAnswers?.[q];
    const isYes = val === 'Yes' || (typeof val === 'boolean' && val === true);
    const subVal = (formData.registryAnswers?.[`${q}_details`] as string) || '';
    const dateVal = (formData.registryAnswers?.[`${q}_date`] as string) || '';
    const needsDetails = q.includes('*');
    const isCritical = (fieldSettings.criticalRiskRegistry || []).includes(q);
    
    const resolvedType = type as 'question' | 'condition' | 'allergy' | 'physician';

    return (
        <DesignWrapper id={q} type={resolvedType} key={q} className={className} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
            <div className={`p-5 rounded-2xl border transition-all flex flex-col gap-4 ${alert && isYes ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-3 pr-4">
                    {Icon && <Icon size={18} className={alert && isYes ? 'text-red-600' : 'text-slate-500'}/>}
                    <span className={`font-black text-sm leading-tight uppercase tracking-tight flex items-center gap-2 ${alert && isYes ? 'text-red-800' : 'text-slate-800'}`}>
                        {label}
                        {isCritical && <ShieldAlert size={14} className="text-red-600 animate-pulse"/>}
                    </span>
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
                            <ControlledTextarea 
                                name={`${q}_details`}
                                value={subVal} 
                                onChange={(e: any) => !readOnly && handleChange({ target: { name: 'registryAnswers', value: { ...(formData.registryAnswers || {}), [`${q}_details`]: e.target.value } } } as any)}
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
  
  const renderSection = (id: string) => {
    const isCritical = (fieldSettings.criticalRiskRegistry || []).includes(id);

    if (id === 'core_physicianName') {
        return (
            <DesignWrapper id={id} type="physician" key={id} className="md:col-span-12 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4" selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2 mb-2"><UserCircle size={14}/> Physician Identification</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="label text-[10px]">Physician Name</label><ControlledInput type="text" value={formData.physicianName || ''} name="physicianName" onChange={handleChange} disabled={readOnly} className="input bg-white" /></div>
                    <div><label className="label text-[10px]"><Award size={12} className="inline mr-1"/> Specialty</label><ControlledInput type="text" value={formData.physicianSpecialty || ''} name="physicianSpecialty" onChange={handleChange} disabled={readOnly} className="input bg-white" /></div>
                    <div><label className="label text-[10px]"><MapPin size={12} className="inline mr-1"/> Office Address</label><ControlledInput type="text" value={formData.physicianAddress || ''} name="physicianAddress" onChange={handleChange} disabled={readOnly} className="input bg-white" /></div>
                    <div><label className="label text-[10px]"><Phone size={12} className="inline mr-1"/> Office Number</label><ControlledInput type="tel" value={formData.physicianNumber || ''} name="physicianNumber" onChange={handleChange} disabled={readOnly} className="input bg-white" /></div>
                </div>
            </DesignWrapper>
        );
    }

    if (id === 'core_bloodGroup') {
        return (
            <DesignWrapper id={id} type="question" key={id} className="md:col-span-6" selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                <div>
                    <label className="label flex items-center gap-1">Blood Type {isCritical && <Shield size={12} className="text-red-500"/>}</label>
                    <select name="bloodGroup" value={formData.bloodGroup || ''} onChange={handleChange} disabled={readOnly} className="input bg-white">
                        <option value="">Select Blood Type</option>
                        {fieldSettings.bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                </div>
            </DesignWrapper>
        );
    }

    if (id === 'core_bloodPressure') {
        return (
            <DesignWrapper id={id} type="question" key={id} className="md:col-span-6" selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                <div>
                    <label className="label flex items-center gap-1">Blood Pressure {isCritical && <Shield size={12} className="text-red-500"/>}</label>
                    <ControlledInput type="text" value={formData.bloodPressure || ''} name="bloodPressure" onChange={handleChange} disabled={readOnly} className="input bg-white font-mono" placeholder="120/80" />
                </div>
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

        return <BooleanField key={id} label={label} q={id} icon={Stethoscope} placeholder={placeholder} showDate={showDate} formData={formData} handleChange={handleChange} readOnly={readOnly} fieldSettings={fieldSettings} designMode={designMode} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} />;
    }

    if (id.startsWith('al_')) {
        const allergy = id.replace('al_', '');
        const isSelected = (formData.allergies || []).includes(allergy);
        return (
            <DesignWrapper key={id} id={id} type="allergy" className="md:col-span-4" selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                <button 
                    type="button" 
                    onClick={() => !readOnly && handleArrayChange('allergies', allergy)}
                    className={`w-full p-3 rounded-2xl border-2 text-left flex items-center gap-3 transition-all ${isSelected ? 'bg-red-600 border-red-600 text-white shadow-lg scale-105' : 'bg-white border-slate-100 hover:border-red-200'}`}
                >
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-white border-white' : 'bg-slate-50 border-slate-200'}`}>
                        {isSelected && <Check size={12} className="text-red-600"/>}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-tight leading-none ${isSelected ? 'text-white' : 'text-slate-600'}`}>{allergy} {isCritical && "🛡️"}</span>
                </button>
            </DesignWrapper>
        );
    }

    if (id === 'field_otherAllergies') {
        return (
            <DesignWrapper key={id} id={id} type="allergy" className="md:col-span-12" selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                    <label className="label text-[10px] flex items-center gap-2"><FileText size={12}/> Other Allergies (Question #8) {isCritical && <ShieldAlert size={10} className="text-red-500"/>}</label>
                    <ControlledInput 
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

    // Dynamic field headers or other types
    if (id.startsWith('field_')) {
        const fieldId = id.replace('field_', '');
        const field = fieldSettings.identityFields.find(f => f.id === fieldId);
        if (field?.type === 'header') {
            return (
                <DesignWrapper id={id} type="question" key={id} className="md:col-span-12 pt-6" selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                    <div className="flex items-center gap-3 border-b border-slate-200 pb-2 mb-4">
                        <HeartPulse size={18} className="text-teal-600"/>
                        <h5 className="font-black text-slate-800 uppercase tracking-widest text-xs">{field.label}</h5>
                    </div>
                </DesignWrapper>
            );
        }
    }

    return null;
  };

  const mainMedicalOrder = useMemo(() => fieldSettings.medicalLayoutOrder.filter(id => 
    !id.startsWith('al_') && 
    id !== 'field_otherAllergies' && 
    id !== 'core_bloodGroup' && 
    id !== 'core_bloodPressure'
  ), [fieldSettings.medicalLayoutOrder]);

  const bloodAndPressureOrder = useMemo(() => fieldSettings.medicalLayoutOrder.filter(id => 
    id === 'core_bloodGroup' || id === 'core_bloodPressure'
  ), [fieldSettings.medicalLayoutOrder]);

  const allergiesOrder = useMemo(() => fieldSettings.medicalLayoutOrder.filter(id => 
    id.startsWith('al_') || id === 'field_otherAllergies'
  ), [fieldSettings.medicalLayoutOrder]);

  const dynamicRedFlags = useMemo(() => {
    const flags: { label: string; details?: string; icon: any }[] = [];
    const critRegistry = fieldSettings.criticalRiskRegistry || [];
    
    (formData.allergies || []).filter(a => a !== 'None').forEach(a => {
        if (critRegistry.includes(`al_${a}`) || critRegistry.includes(a)) flags.push({ label: `ALLERGY: ${a}`, icon: Pill });
    });
    
    (formData.medicalConditions || []).filter(c => c !== 'None').forEach(c => {
        if (critRegistry.includes(c)) flags.push({ label: `CONDITION: ${c}`, icon: Activity });
    });

    fieldSettings.identityQuestionRegistry.forEach(q => {
        const val = formData.registryAnswers?.[q];
        const isYes = val === 'Yes' || (typeof val === 'boolean' && val === true);
        if (isYes && (q.includes('*') || critRegistry.includes(q))) {
            const details = formData.registryAnswers?.[`${q}_details`] as string;
            flags.push({ label: `ALERT: ${q.replace('*', '')}`, details: details || "Positive Finding", icon: ShieldAlert });
        }
    });

    return flags;
  }, [formData, fieldSettings]);

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
                    const isCritical = (fieldSettings.criticalRiskRegistry || []).includes(condition);
                    return (
                        <DesignWrapper key={condition} id={condition} type="condition" selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                            <button 
                                type="button" 
                                onClick={() => !readOnly && handleArrayChange('medicalConditions', condition)}
                                className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-3 transition-all ${isSelected ? 'bg-teal-600 border-teal-600 text-white shadow-lg scale-105' : 'bg-white border-slate-100 hover:border-teal-200'}`}
                            >
                                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-white border-white' : 'bg-slate-50 border-slate-200'}`}>
                                    {isSelected && <Check size={12} className="text-teal-600"/>}
                                </div>
                                <span className={`text-xs font-black uppercase tracking-tight leading-none flex items-center gap-2 ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                                    {condition}
                                    {isCritical && <ShieldAlert size={14} className={isSelected ? "text-white" : "text-red-500"}/>}
                                </span>
                            </button>
                        </DesignWrapper>
                    );
                })}
            </div>
        </div>

        {/* DYNAMIC CRITICAL RED FLAGS SECTION (Hidden in Design Mode) */}
        {!designMode && (
            <div className="bg-white p-10 rounded-[3rem] border-2 border-red-100 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-red-600" />
                <div className="flex items-center gap-3 mb-8">
                    <ShieldAlert size={32} className="text-red-700" />
                    <h4 className="font-black text-red-900 uppercase tracking-tight text-xl">Critical Clinical Red Flags</h4>
                </div>
                
                {dynamicRedFlags.length > 0 ? (
                    <div className="space-y-4 animate-in slide-in-from-bottom-2">
                        {dynamicRedFlags.map((flag, idx) => (
                            <div key={idx} className="p-5 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-4">
                                <div className="p-2 bg-red-100 rounded-xl text-red-700"><flag.icon size={20}/></div>
                                <div className="flex-1">
                                    <span className="font-black text-sm uppercase text-red-900 tracking-tight">{flag.label}</span>
                                    {flag.details && (
                                        <div className="mt-2 text-xs font-bold text-red-700 bg-white/50 p-3 rounded-xl border border-red-100 italic">
                                            Narrative: {flag.details}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-10 text-center text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        No critical markers identified based on current registry answers.
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default React.memo(RegistrationMedical);

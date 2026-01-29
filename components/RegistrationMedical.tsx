
import React, { useMemo, useState, useEffect } from 'react';
/* Added missing types Patient and FieldSettings from ../types */
import { Patient, FieldSettings, RegistrationField } from '../types';
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

const DesignWrapper = ({ id, type, children, className = "", selectedFieldId, onFieldClick, designMode }: { id: string, type: 'question' | 'condition' | 'allergy' | 'physician' | 'identity', children?: React.ReactNode, className?: string, selectedFieldId?: string, onFieldClick?: any, designMode: boolean, key?: React.Key }) => {
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
    registryAnswers: Record<string, any>;
    onRegistryChange: (newAnswers: Record<string, any>) => void;
    readOnly?: boolean;
    fieldSettings: FieldSettings;
    designMode: boolean;
    selectedFieldId?: string;
    onFieldClick?: any;
}

const BooleanField: React.FC<BooleanFieldProps> = ({ label, q, icon: Icon, alert = false, type = 'question', className = "md:col-span-12", placeholder = "Specify condition, medication, or reason...", showDate = false, registryAnswers, onRegistryChange, readOnly, fieldSettings, designMode, selectedFieldId, onFieldClick }) => {
    const val = registryAnswers?.[q];
    const isYes = val === 'Yes';
    const subVal = (registryAnswers?.[`${q}_details`] as string) || '';
    const dateVal = (registryAnswers?.[`${q}_date`] as string) || '';
    const needsDetails = q.includes('*');
    const isCritical = (fieldSettings.criticalRiskRegistry || []).includes(q);
    
    const resolvedType = type as 'question' | 'condition' | 'allergy' | 'physician';

    const handleAnswerChange = (answer: 'Yes' | 'No') => {
        if (readOnly) return;
        const newAnswers = { ...registryAnswers, [q]: answer };
        onRegistryChange(newAnswers);
    };

    const handleDetailChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, detailType: 'details' | 'date') => {
        if (readOnly) return;
        const newAnswers = { ...registryAnswers, [`${q}_${detailType}`]: e.target.value };
        onRegistryChange(newAnswers);
    };

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
                {(isYes || designMode) && needsDetails && (
                    <div className="animate-in slide-in-from-top-1 border-t border-slate-100 pt-4 mt-1 space-y-4">
                        {showDate && (
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2 block flex items-center gap-2"><Calendar size={12}/> Approximate Date of Event</label>
                                <input 
                                    type="date"
                                    value={dateVal}
                                    onChange={(e) => handleDetailChange(e, 'date')}
                                    className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 shadow-inner"
                                />
                            </div>
                        )}
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2 block">Clinical Specification Narrative *</label>
                            <ControlledTextarea 
                                name={`${q}_details`}
                                value={subVal} 
                                onChange={(e: any) => handleDetailChange(e, 'details')}
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
  onCustomChange: (fieldName: string, value: any, type: RegistrationField['type']) => void;
  registryAnswers: Record<string, any>;
  onRegistryChange: (newAnswers: Record<string, any>) => void;
  allergies: string[];
  onAllergyChange: (category: 'allergies', value: string) => void;
  medicalConditions: string[];
  onConditionChange: (category: 'medicalConditions', value: string) => void;
  readOnly?: boolean;
  fieldSettings: FieldSettings; 
  isMasked?: boolean;
  designMode?: boolean;
  onFieldClick?: (fieldId: string, type: 'question' | 'condition' | 'allergy' | 'physician' | 'identity') => void;
  selectedFieldId?: string;
}

const RegistrationMedical: React.FC<RegistrationMedicalProps> = ({ 
    formData,
    onCustomChange,
    registryAnswers,
    onRegistryChange,
    allergies,
    onAllergyChange,
    medicalConditions,
    onConditionChange,
    readOnly,
    fieldSettings,
    designMode = false,
    onFieldClick,
    selectedFieldId
}) => {
  
    const renderDynamicField = (field: RegistrationField) => {
        const value = formData.customFields?.[field.id];
        const colSpan = field.width === 'full' ? 'md:col-span-12' : field.width === 'third' ? 'md:col-span-4' : field.width === 'quarter' ? 'md:col-span-3' : 'md:col-span-6';
        
        return (
            <DesignWrapper id={`field_${field.id}`} type="identity" className={colSpan} key={field.id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                <label className="label">{field.label}</label>
                {/* Simplified renderer for now; expand as needed */}
                <input
                    type={field.type as any}
                    value={value || ''}
                    onChange={(e) => onCustomChange(field.id, e.target.value, field.type)}
                    disabled={readOnly}
                    className="input"
                />
            </DesignWrapper>
        )
    };
  
    const mainMedicalOrder = useMemo(() => fieldSettings.medicalLayoutOrder.filter(id => !id.startsWith('al_') && id !== 'field_otherAllergies' && id !== 'core_bloodGroup' && id !== 'core_bloodPressure' && !id.startsWith('core_physician')), [fieldSettings.medicalLayoutOrder]);
    const allergiesOrder = useMemo(() => fieldSettings.medicalLayoutOrder.filter(id => id.startsWith('al_') || id === 'field_otherAllergies'), [fieldSettings.medicalLayoutOrder]);
  
    const dynamicRedFlags = useMemo(() => {
        const flags: { label: string; details?: string; icon: any }[] = [];
        const critRegistry = fieldSettings.criticalRiskRegistry || [];
        (allergies || []).filter(a => a !== 'None').forEach(a => { if (critRegistry.includes(`al_${a}`) || critRegistry.includes(a)) flags.push({ label: `ALLERGY: ${a}`, icon: Pill }); });
        (medicalConditions || []).filter(c => c !== 'None').forEach(c => { if (critRegistry.includes(c)) flags.push({ label: `CONDITION: ${c}`, icon: Activity }); });
        fieldSettings.identityQuestionRegistry.forEach(q => {
            const val = registryAnswers?.[q];
            const isYes = val === 'Yes';
            if (isYes && (q.includes('*') || critRegistry.includes(q))) {
                const details = registryAnswers?.[`${q}_details`] as string;
                flags.push({ label: `ALERT: ${q.replace('*', '')}`, details: details || "Positive Finding", icon: ShieldAlert });
            }
        });
        return flags;
    }, [registryAnswers, allergies, medicalConditions, fieldSettings]);

    return (
        <div className="space-y-8 pb-10">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><HeartPulse size={24}/></div>
                    <h4 className="text-xl font-black uppercase text-slate-800 tracking-tight">MEDICAL HISTORY</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {mainMedicalOrder.map(id => {
                        if (id.startsWith('field_')) {
                            const field = fieldSettings.identityFields.find(f => f.id === id.replace('field_', ''));
                            return field ? renderDynamicField(field) : null;
                        }
                        if (fieldSettings.identityQuestionRegistry.includes(id)) {
                            const label = id.replace('*', '');
                            let placeholder, showDate = false;
                            if (id.includes('treatment')) placeholder = "Specify condition...";
                            if (id.includes('illness')) { placeholder = "Specify illness..."; showDate = true; }
                            if (id.includes('hospitalized')) { placeholder = "Specify reason..."; showDate = true; }
                            if (id.includes('medication')) placeholder = "Specify medication";
                            return <BooleanField key={id} label={label} q={id} icon={Stethoscope} placeholder={placeholder} showDate={showDate} registryAnswers={registryAnswers} onRegistryChange={onRegistryChange} readOnly={readOnly} fieldSettings={fieldSettings} designMode={designMode} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} />;
                        }
                        return null;
                    })}
                </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
                    <div className="p-3 bg-lilac-50 text-lilac-600 rounded-2xl"><ShieldAlert size={24}/></div>
                    <h4 className="text-xl font-black uppercase text-slate-800 tracking-tight">Allergies</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {allergiesOrder.map(id => {
                         if (id.startsWith('al_')) {
                            const allergy = id.replace('al_', '');
                            const isSelected = (allergies || []).includes(allergy);
                            return (
                                <DesignWrapper key={id} id={id} type="allergy" className="md:col-span-4" selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                                    <button type="button" onClick={() => !readOnly && onAllergyChange('allergies', allergy)} className={`w-full p-3 rounded-2xl border-2 text-left flex items-center gap-3 transition-all ${isSelected ? 'bg-red-600 border-red-600 text-white shadow-lg scale-105' : 'bg-white border-slate-100 hover:border-red-200'}`}>
                                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-white border-white' : 'bg-slate-50 border-slate-200'}`}>
                                            {isSelected && <Check size={12} className="text-red-600"/>}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-tight leading-none ${isSelected ? 'text-white' : 'text-slate-600'}`}>{allergy}</span>
                                    </button>
                                </DesignWrapper>
                            );
                        }
                        return null;
                    })}
                </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
                    <div className="p-3 bg-slate-50 text-slate-700 rounded-2xl"><ClipboardList size={24}/></div>
                    <h4 className="text-lg font-black uppercase text-slate-800 tracking-tight">Diagnostic Conditions Registry</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fieldSettings.medicalConditions.map(condition => {
                        const isSelected = (medicalConditions || []).includes(condition);
                        const isCritical = (fieldSettings.criticalRiskRegistry || []).includes(condition);
                        return (
                            <DesignWrapper key={condition} id={condition} type="condition" selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                                <button type="button" onClick={() => !readOnly && onConditionChange('medicalConditions', condition)} className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-3 transition-all ${isSelected ? 'bg-teal-600 border-teal-600 text-white shadow-lg scale-105' : 'bg-white border-slate-100 hover:border-teal-200'}`}>
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
                                        {flag.details && (<div className="mt-2 text-xs font-bold text-red-700 bg-white/50 p-3 rounded-xl border border-red-100 italic">Narrative: {flag.details}</div>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-10 text-center text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">No critical markers identified based on current registry answers.</div>
                    )}
                </div>
            )}
        </div>
    );
};
export default RegistrationMedical;

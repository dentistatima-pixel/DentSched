
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Patient, FieldSettings, AuthorityLevel, RegistrationField } from '../types';
import { Hash, MapPin, Briefcase, Users, CreditCard, Building2, Star, Search, User, Phone, Mail, Droplet, Heart, Shield, Award, Baby, FileText, Scale, Link, CheckCircle, ShieldCheck, ShieldAlert, Fingerprint, Bell, Image, Camera, RefreshCw, ShieldOff, Edit3, Lock, Check } from 'lucide-react';
import Fuse from 'fuse.js';

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

const DesignWrapper = ({ id, type, children, className = "", selectedFieldId, onFieldClick, designMode }: { id: string, type: 'identity' | 'question', children?: React.ReactNode, className?: string, selectedFieldId?: string, onFieldClick?: any, designMode: boolean, key?: React.Key }) => {
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

interface RegistrationBasicInfoProps {
  formData: Partial<Patient>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleCustomChange: (fieldName: string, value: any, type: RegistrationField['type']) => void;
  readOnly?: boolean;
  fieldSettings: FieldSettings;
  patients?: Patient[]; 
  isMasked?: boolean;
  designMode?: boolean;
  onFieldClick?: (fieldId: string, type: 'identity' | 'question') => void;
  selectedFieldId?: string;
}

const RegistrationBasicInfo: React.FC<RegistrationBasicInfoProps> = ({ 
    formData, handleChange, handleCustomChange, readOnly, fieldSettings, patients = [], isMasked = false,
    designMode = false, onFieldClick, selectedFieldId
}) => {
  const [refSearch, setRefSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const fuse = useMemo(() => new Fuse(patients, {
    keys: ['name', 'id'],
    threshold: 0.4,
    ignoreLocation: true,
  }), [patients]);

  useEffect(() => {
    const referredPatient = patients.find(p => p.id === formData.referredById);
    setRefSearch(referredPatient ? referredPatient.name : '');
  }, [formData.referredById, patients]);

  useEffect(() => {
    const isExactMatch = patients.some(p => p.id === formData.referredById && p.name === refSearch);
    
    if (refSearch && !isExactMatch) {
      const results = fuse.search(refSearch).map(result => result.item);
      setSearchResults(results.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }, [refSearch, fuse, formData.referredById, patients]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRefSearch(value);
    
    if (value === '') {
      handleChange({
        target: { name: 'referredById', value: undefined }
      } as any);
    }
  };

  const handleSelectReferral = (patient: Patient) => {
    handleChange({
      target: { name: 'referredById', value: patient.id }
    } as any);
    setRefSearch(patient.name);
    setSearchResults([]);
  };

  const isMinor = useMemo(() => formData.age !== undefined && formData.age < 18, [formData.age]);
  const showGuardian = isMinor || formData.isPwd || formData.isSeniorDependent || designMode;
  const showFemaleQuestions = formData.sex === 'Female' || designMode;

  const getLabel = (id: string, def: string) => fieldSettings.fieldLabels[id] || def;

  const femaleFieldMap: Record<string, string> = {
    'Are you pregnant?': 'pregnant',
    'Are you nursing?': 'nursing',
    'Are you taking birth control pills?': 'birthControl'
  };

  const renderDynamicField = (field: RegistrationField) => {
    const colSpan = field.width === 'full' ? 'col-span-12' : field.width === 'third' ? 'col-span-4' : field.width === 'quarter' ? 'col-span-3' : 'col-span-6';
    const value = formData.customFields?.[field.id];
    const isCriticalDyn = (fieldSettings.criticalRiskRegistry || []).includes(field.id) || field.isCritical;

    let fieldComponent;

    switch (field.type) {
        case 'boolean':
            fieldComponent = (
                <label className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer border-2 transition-all ${value ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-white border-slate-200'}`}>
                    <input type="checkbox" checked={!!value} onChange={(e) => handleCustomChange(field.id, e.target.checked, 'boolean')} disabled={readOnly} className="w-8 h-8 accent-teal-600 rounded mt-1 shrink-0" />
                    <div><span className="font-black text-teal-950 uppercase text-sm tracking-widest flex items-center gap-2">{field.label}{isCriticalDyn && <ShieldAlert size={12} className="text-red-500"/>}</span></div>
                </label>
            );
            break;
        
        case 'checklist':
            const options = field.registryKey ? (fieldSettings[field.registryKey as keyof FieldSettings] as string[] || []) : [];
            fieldComponent = (
                <div>
                    <label className="label">{field.label}</label>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        {options.map(opt => (
                            <label key={opt} className="flex items-center gap-2 p-2 bg-white rounded-lg">
                                <input type="checkbox" checked={(value as string[] || []).includes(opt)} onChange={() => handleCustomChange(field.id, opt, 'checklist')} disabled={readOnly} className="w-5 h-5 accent-teal-600"/>
                                <span className="text-sm font-medium">{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>
            );
            break;

        case 'conditional-text':
             const detailsValue = formData.customFields?.[`${field.id}_details`] || '';
             fieldComponent = (
                <div className={`p-5 rounded-2xl border transition-all flex flex-col gap-4 bg-slate-50 border-slate-100`}>
                     <div className="flex items-center gap-3 pr-4"><span className={`font-black text-sm leading-tight uppercase tracking-tight flex items-center gap-2 text-slate-800`}>{field.label}</span></div>
                     <div className="flex gap-3 shrink-0">
                         <button type="button" onClick={() => handleCustomChange(field.id, true, 'boolean')} className={`flex-1 px-3 py-2.5 rounded-xl border-2 transition-all font-black text-xs uppercase ${value ? 'bg-teal-600 text-white' : 'bg-white text-slate-400'}`}>Yes</button>
                         <button type="button" onClick={() => handleCustomChange(field.id, false, 'boolean')} className={`flex-1 px-3 py-2.5 rounded-xl border-2 transition-all font-black text-xs uppercase ${value === false ? 'bg-lilac-600 text-white' : 'bg-white text-slate-400'}`}>No</button>
                     </div>
                     {(value || designMode) && (
                         <div className="animate-in slide-in-from-top-1 border-t border-slate-200 pt-4 mt-1">
                             <textarea value={detailsValue} onChange={(e) => handleCustomChange(`${field.id}_details`, e.target.value, 'text')} placeholder="Please provide details..." className="input bg-white" />
                         </div>
                     )}
                 </div>
             );
             break;

        case 'dropdown':
             const dropdownOptions = field.registryKey ? (fieldSettings[field.registryKey as keyof FieldSettings] as string[] || []) : [];
             fieldComponent = (
                <>
                    <label className="label">{field.label}</label>
                    <select value={value || ''} onChange={(e) => handleCustomChange(field.id, e.target.value, 'dropdown')} className="input bg-white" disabled={readOnly}>
                        <option value="">Select {field.label}</option>
                        {dropdownOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </>
             );
             break;
        
        case 'textarea':
             fieldComponent = (
                <>
                    <label className="label">{field.label}</label>
                    <textarea value={value || ''} onChange={(e) => handleCustomChange(field.id, e.target.value, 'textarea')} className="input bg-white h-24" disabled={readOnly} />
                </>
             );
             break;
        
        default:
            fieldComponent = (
                <>
                    <label className="label">{field.label}</label>
                    <input type={field.type as any} value={value || ''} onChange={(e) => handleCustomChange(field.id, e.target.value, 'text')} className="input bg-white" disabled={readOnly}/>
                </>
            );
            break;
    }

    return (
        <DesignWrapper id={`field_${field.id}`} type="identity" className={colSpan} key={field.id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
            {fieldComponent}
        </DesignWrapper>
    );
  }

  const renderFieldById = (id: string) => {
      const isCritical = (fieldSettings.criticalRiskRegistry || []).includes(id);

      if (id.startsWith('core_')) {
          const coreId = id.replace('core_', '');
          const label = getLabel(coreId, coreId);
          
          if (coreId === 'firstName' || coreId === 'middleName' || coreId === 'surname') {
              return (
                <DesignWrapper id={id} type="identity" className="col-span-4" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                  <div><label className="label flex items-center gap-2">{label} * {isCritical && <ShieldAlert size={12} className="text-red-500"/>}</label><ControlledInput name={coreId} value={(formData as any)[coreId] || ''} onChange={handleChange} disabled={readOnly} placeholder={`Enter ${label}`} className="input bg-white" /></div>
                </DesignWrapper>
              );
          }
          if (coreId === 'suffix') {
              return (
                <DesignWrapper id={id} type="identity" className="col-span-3" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                  <div><label className="label">{label}</label><select name="suffix" value={formData.suffix || ''} onChange={handleChange} disabled={readOnly} className="input bg-white"><option value="">Select {label}</option>{fieldSettings.suffixes.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                </DesignWrapper>
              );
          }
          if (coreId === 'dob') { return (<DesignWrapper id={id} type="identity" className="col-span-4" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}><div><label className="label font-bold">{label}</label><input name="dob" type="date" value={formData.dob || ''} onChange={handleChange} disabled={readOnly} className="input bg-white" /></div></DesignWrapper>); }
          if (coreId === 'age') { return (<DesignWrapper id={id} type="identity" className="col-span-2" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}><div><label className="label">{label}</label><div className="input bg-slate-50 text-slate-400 font-black">{formData.age ?? '--'}</div></div></DesignWrapper>); }
          if (coreId === 'sex') { return (<DesignWrapper id={id} type="identity" className="col-span-3" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}><div><label className="label font-bold">{label}</label><select name="sex" value={formData.sex || ''} onChange={handleChange} disabled={readOnly} className="input bg-white"><option value="">Select {label}</option>{fieldSettings.sex.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div></DesignWrapper>); }
          if (coreId === 'civilStatus') { return (<DesignWrapper id={id} type="identity" className="col-span-12" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}><div><label className="label">{label}</label><select name="civilStatus" value={formData.civilStatus || ''} onChange={handleChange} disabled={readOnly} className="input bg-white"><option value="">Select {label}</option>{fieldSettings.civilStatus.map(s => <option key={s} value={s}>{s}</option>)}</select></div></DesignWrapper>); }
          if (coreId === 'homeAddress') { return (<DesignWrapper id={id} type="identity" className="col-span-12" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}><div><label className="label">{label}</label><ControlledInput name="homeAddress" value={formData.homeAddress || ''} onChange={handleChange} disabled={readOnly} placeholder="Street, Subdivision..." className="input bg-white" /></div></DesignWrapper>); }
          if (coreId === 'city' || coreId === 'barangay') { return (<DesignWrapper id={id} type="identity" className="col-span-6" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}><div><label className="label">{label}</label><ControlledInput name={coreId} value={(formData as any)[coreId] || ''} onChange={handleChange} disabled={readOnly} className="input bg-white" /></div></DesignWrapper>); }
          if (coreId === 'phone') { return (<DesignWrapper id={id} type="identity" className="col-span-6" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}><div><label className="label font-bold">{label} *</label><ControlledInput name="phone" value={formData.phone || ''} onChange={handleChange} disabled={readOnly} placeholder="09XXXXXXXXX" className="input bg-white" /></div></DesignWrapper>); }
          if (coreId === 'email') { return (<DesignWrapper id={id} type="identity" className="col-span-6" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}><div><label className="label">{label}</label><ControlledInput name="email" type="email" value={formData.email || ''} onChange={handleChange} disabled={readOnly} placeholder="example@domain.com" className="input bg-white" /></div></DesignWrapper>); }
      }

      if (id.startsWith('field_')) {
          const fieldId = id.replace('field_', '');
          const field = fieldSettings.identityFields.find(f => f.id === fieldId);
          if (!field) return null;

          if (field.type === 'header') {
            return (
                <DesignWrapper id={id} type="identity" className="col-span-12 pt-6" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                    <div className="flex items-center gap-3 border-b border-slate-200 pb-2 mb-4"><FileText size={18} className="text-lilac-600"/><h5 className="font-black text-slate-800 uppercase tracking-widest text-xs">{field.label}</h5></div>
                </DesignWrapper>
            );
          }
          
          return renderDynamicField(field);
      }
      return null;
  };

  const identityFields = useMemo(() => fieldSettings.identityLayoutOrder.filter(id => {
      if (id.startsWith('core_')) return true;
      const fieldId = id.replace('field_', '');
      const field = fieldSettings.identityFields.find(f => f.id === fieldId);
      return field && ['IDENTITY', 'CONTACT', 'INSURANCE'].includes(field.section);
  }), [fieldSettings.identityLayoutOrder, fieldSettings.identityFields]);
  
  return (
    <div className="space-y-12">
        <div className="orientation-grid gap-6">
            <div className="col-span-3">
                <label className="label flex items-center gap-2 text-slate-400 font-bold"><Hash size={14} /> System ID</label>
                <div className="input bg-slate-50 text-slate-400 font-mono text-sm border-slate-200">{formData.id || 'AUTO_GEN'}</div>
            </div>
            <div className="col-span-4 relative" ref={searchContainerRef}>
                <label className="label flex items-center gap-2 text-teal-800 font-bold"><Star size={14} fill="currentColor"/> Referral Source</label>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input type="text" placeholder="Search existing patient registry..." value={refSearch} onChange={handleSearchChange} disabled={readOnly} className="input pl-12 bg-white" autoComplete="off" />
                    {searchResults.length > 0 && (<div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-lg z-50 max-h-60 overflow-y-auto no-scrollbar"><ul className="divide-y divide-slate-100">{searchResults.map(patient => (<li key={patient.id}><button type="button" onClick={() => handleSelectReferral(patient)} className="w-full text-left p-4 hover:bg-teal-50 transition-colors"><span className="font-bold text-slate-800">{patient.name}</span><span className="text-xs text-slate-500 ml-2 font-mono">ID: {patient.id}</span></button></li>))}</ul></div>)}
                </div>
            </div>
            <div className="col-span-5">
                <label className="label flex items-center gap-2 text-lilac-800 font-bold"><Users size={14}/> Head of Household</label>
                <select name="familyGroupId" value={formData.familyGroupId || ''} onChange={handleChange} disabled={readOnly} className="input bg-white"><option value="">- None / Set as Head -</option>{patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            </div>
        </div>

        <div className={`bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8 ${designMode ? 'ring-4 ring-slate-100' : ''}`}>
            <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4"><div className="p-3 bg-teal-50 text-teal-600 rounded-2xl"><User size={24}/></div><h4 className="text-xl font-black uppercase text-slate-800 tracking-tight">PATIENT INFORMATION RECORD</h4></div>
            <div className="orientation-grid grid-cols-12 gap-6">
                {identityFields.map(id => renderFieldById(id))}
            </div>
        </div>
        
        {showGuardian && (
            <div className={`p-10 rounded-[3rem] border-2 space-y-8 animate-in slide-in-from-top-4 duration-500 ${designMode ? 'bg-lilac-50/20 border-lilac-200 border-dashed' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-center border-b border-slate-200 pb-4"><h4 className="text-lg font-black uppercase text-slate-800 tracking-tight flex items-center gap-3"><Users size={24} className="text-lilac-600"/> Legal Guardian Profile (For Minors)</h4>{designMode && <span className="text-[10px] font-black text-lilac-600 uppercase border border-lilac-200 px-2 py-0.5 rounded-full">Conditional Visibility (Minor/PWD)</span>}</div>
                <div className="orientation-grid grid-cols-12 gap-6">
                    <div className="col-span-4"><label className="label text-xs">Full Legal Name *</label><ControlledInput name="guardian_legalName" value={formData.guardianProfile?.legalName || ''} onChange={(e) => handleChange({ target: { name: 'guardianProfile', value: { ...formData.guardianProfile, legalName: e.target.value } } } as any)} disabled={readOnly} className="input bg-white" placeholder="Representative Name"/></div>
                    <div className="col-span-4"><label className="label text-xs">Mobile Number *</label><ControlledInput name="guardian_mobile" value={formData.guardianProfile?.mobile || ''} onChange={(e) => handleChange({ target: { name: 'guardianProfile', value: { ...formData.guardianProfile, mobile: e.target.value } } } as any)} disabled={readOnly} className="input bg-white" placeholder="09XXXXXXXXX"/></div>
                    <div className="col-span-4"><label className="label text-xs">Occupation</label><ControlledInput name="guardian_occupation" value={formData.guardianProfile?.occupation || ''} onChange={(e) => handleChange({ target: { name: 'guardianProfile', value: { ...formData.guardianProfile, occupation: e.target.value } } } as any)} disabled={readOnly} className="input bg-white" placeholder="Work/Trade"/></div>
                </div>
            </div>
        )}
    </div>
  );
};

export default React.memo(RegistrationBasicInfo);

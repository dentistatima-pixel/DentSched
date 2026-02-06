

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Patient, FieldSettings, AuthorityLevel, RegistrationField } from '../types';
import { Hash, MapPin, Briefcase, Users, CreditCard, Building2, Star, Search, User, Phone, Mail, Droplet, Heart, Shield, Award, Baby, FileText, Scale, Link, CheckCircle, ShieldCheck, ShieldAlert, Fingerprint, Bell, Image, Camera, RefreshCw, ShieldOff, Edit3, Lock, Check } from 'lucide-react';
import Fuse from 'fuse.js';
import { calculateAge } from '../constants';

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
// FIX: Add 'patientAge' to the props interface to accept the calculated age from the parent.
  patientAge?: number;
}

const RegistrationBasicInfoInternal: React.FC<RegistrationBasicInfoProps> = ({ 
    formData, handleChange, handleCustomChange, readOnly, fieldSettings, patients = [], isMasked = false,
    designMode = false, onFieldClick, selectedFieldId, patientAge
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

  const isMinor = useMemo(() => (patientAge || 18) < 18, [patientAge]);
  const showGuardian = isMinor || formData.isPwd || formData.isSeniorDependent || designMode;
  const showFemaleQuestions = formData.sex === 'Female' || designMode;

  const getLabel = (id: string, def: string) => fieldSettings.fieldLabels[id] || def;

  const femaleFieldMap: Record<string, string> = {
    'Are you pregnant?': 'pregnant',
    'Are you nursing?': 'nursing',
    'Are you taking birth control pills?': 'birthControl'
  };

  const renderFieldById = (id: string) => {
      const isCritical = (fieldSettings.criticalRiskRegistry || []).includes(id);

      if (id.startsWith('core_')) {
          const coreId = id.replace('core_', '');
          const label = getLabel(coreId, coreId);
          
          if (coreId === 'firstName' || coreId === 'middleName' || coreId === 'surname') {
              return (
                <DesignWrapper id={id} type="identity" className="col-span-1 md:col-span-4" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                  <div>
                      <label className="label flex items-center gap-2">{label} * {isCritical && <ShieldAlert size={12} className="text-red-500"/>}</label>
                      <ControlledInput name={coreId} value={(formData as any)[coreId] || ''} onChange={handleChange} disabled={readOnly} placeholder={`Enter ${label}`} className="input bg-white" />
                  </div>
                </DesignWrapper>
              );
          }
          if (coreId === 'suffix') {
              return (
                <DesignWrapper id={id} type="identity" className="col-span-1 md:col-span-3" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                  <div>
                      <label className="label">{label}</label>
                      <select name="suffix" value={formData.suffix || ''} onChange={handleChange} disabled={readOnly} className="input bg-white">
                        <option value="">Select {label}</option>
                        {fieldSettings.suffixes.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
                </DesignWrapper>
              );
          }
          if (coreId === 'dob') {
              return (
                <DesignWrapper id={id} type="identity" className="col-span-1 md:col-span-4" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                    <div><label className="label font-bold">{label}</label><input name="dob" type="date" value={formData.dob || ''} onChange={handleChange} disabled={readOnly} className="input bg-white" /></div>
                </DesignWrapper>
              );
          }
          if (coreId === 'age') {
              return (
                <DesignWrapper id={id} type="identity" className="col-span-1 md:col-span-2" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                    <div><label className="label">{label}</label><div className="input bg-slate-50 text-slate-400 font-black">{patientAge ?? '--'}</div></div>
                </DesignWrapper>
              );
          }
          if (coreId === 'sex') {
              return (
                <DesignWrapper id={id} type="identity" className="col-span-1 md:col-span-3" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                    <div>
                        <label className="label font-bold">{label}</label>
                        <select name="sex" value={formData.sex || ''} onChange={handleChange} disabled={readOnly} className="input bg-white">
                            <option value="">Select {label}</option>
                            {fieldSettings.sex.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </DesignWrapper>
              );
          }
          if (coreId === 'civilStatus') {
            return (
              <DesignWrapper id={id} type="identity" className="col-span-1 md:col-span-12" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                  <div>
                      <label className="label">{label}</label>
                      <select name="civilStatus" value={formData.civilStatus || ''} onChange={handleChange} disabled={readOnly} className="input bg-white">
                          <option value="">Select {label}</option>
                          {fieldSettings.civilStatus.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
              </DesignWrapper>
            );
          }
          if (coreId === 'homeAddress') {
              return (
                <DesignWrapper id={id} type="identity" className="col-span-1 md:col-span-12" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                    <div><label className="label">{label}</label><ControlledInput name="homeAddress" value={formData.homeAddress || ''} onChange={handleChange} disabled={readOnly} placeholder="Street, Subdivision..." className="input bg-white" /></div>
                </DesignWrapper>
              );
          }
          if (coreId === 'city' || coreId === 'barangay') {
              return (
                <DesignWrapper id={id} type="identity" className="col-span-1 md:col-span-6" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                    <div><label className="label">{label}</label><ControlledInput name={coreId} value={(formData as any)[coreId] || ''} onChange={handleChange} disabled={readOnly} className="input bg-white" /></div>
                </DesignWrapper>
              );
          }
          if (coreId === 'phone') {
              return (
                <DesignWrapper id={id} type="identity" className="col-span-1 md:col-span-6" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                    <div><label className="label font-bold">{label} *</label><ControlledInput name="phone" value={formData.phone || ''} onChange={handleChange} disabled={readOnly} placeholder="09XXXXXXXXX" className="input bg-white" /></div>
                </DesignWrapper>
              );
          }
          if (coreId === 'email') {
              return (
                <DesignWrapper id={id} type="identity" className="col-span-1 md:col-span-6" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                    <div><label className="label">{label}</label><ControlledInput name="email" type="email" value={formData.email || ''} onChange={handleChange} disabled={readOnly} placeholder="example@domain.com" className="input bg-white" /></div>
                </DesignWrapper>
              );
          }
      }

      if (id.startsWith('field_')) {
          const fieldId = id.replace('field_', '');
          const field = fieldSettings.identityFields.find(f => f.id === fieldId);
          if (!field) return null;

          if (field.type === 'header') {
            return (
                <DesignWrapper id={id} type="identity" className="col-span-1 md:col-span-12 pt-6" key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                    <div className="flex items-center gap-3 border-b border-slate-200 pb-2 mb-4">
                        <FileText size={18} className="text-lilac-600"/>
                        <h5 className="font-black text-slate-800 uppercase tracking-widest text-xs">{field.label}</h5>
                    </div>
                </DesignWrapper>
            );
          }

          const val = (formData as any)[field.id];
          const colSpan = field.width === 'full' ? 'col-span-1 md:col-span-12' : field.width === 'third' ? 'col-span-1 md:col-span-4' : field.width === 'quarter' ? 'col-span-1 md:col-span-3' : 'col-span-1 md:col-span-6';
          const isCriticalDyn = isCritical || field.isCritical;
          
          if (field.type === 'boolean') {
              return (
                  <DesignWrapper id={id} type="identity" className={colSpan} key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                      <label className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer border-2 transition-all ${!!val ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-white border-slate-200'}`}>
                          <input
                              type="checkbox"
                              name={field.id}
                              checked={!!val}
                              onChange={handleChange}
                              disabled={readOnly}
                              className="w-8 h-8 accent-teal-600 rounded mt-1 shrink-0"
                          />
                          <div>
                            <span className="font-black text-teal-950 uppercase text-sm tracking-widest flex items-center gap-2">
                                {field.label}
                                {isCriticalDyn && <ShieldAlert size={12} className="text-red-500 animate-pulse"/>}
                            </span>
                          </div>
                      </label>
                  </DesignWrapper>
              );
          }
          
          return (
              <DesignWrapper id={id} type="identity" className={colSpan} key={id} selectedFieldId={selectedFieldId} onFieldClick={onFieldClick} designMode={designMode}>
                  <label className="label">{field.label}</label>
                  {/* ... render other field types ... */}
              </DesignWrapper>
          );
      }
      return null;
  };
  
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
        <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl"><User size={24} /></div>
        <h4 className="text-xl font-black uppercase text-slate-800 tracking-tight">Identity & Contact</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-8 items-end">
        {fieldSettings.identityLayoutOrder.map(renderFieldById)}
      </div>
      
      {showGuardian && (
        <div className="pt-8 border-t-2 border-dashed border-slate-200 space-y-8">
          <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Baby size={24} /></div>
            <h4 className="text-xl font-black uppercase text-slate-800 tracking-tight">Guardian / Companion Information</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="label">Full Legal Name</label><input name="guardianProfile.legalName" value={formData.guardianProfile?.legalName || ''} onChange={handleChange} className="input"/></div>
            <div><label className="label">Relationship to Patient</label><select name="guardianProfile.relationship" value={formData.guardianProfile?.relationship || ''} onChange={handleChange} className="input"><option value="">Select...</option>{fieldSettings.relationshipTypes.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            <div><label className="label">Mobile Number</label><input name="guardianProfile.mobile" value={formData.guardianProfile?.mobile || ''} onChange={handleChange} className="input"/></div>
            <div><label className="label">Authority Level</label><select name="guardianProfile.authorityLevel" value={formData.guardianProfile?.authorityLevel || AuthorityLevel.LIMITED} onChange={handleChange} className="input font-bold text-xs uppercase"><option value={AuthorityLevel.LIMITED}>Limited (Companion)</option><option value={AuthorityLevel.FINANCIAL_ONLY}>Financial Only</option><option value={AuthorityLevel.FULL}>Full Medical and Financial</option></select></div>
          </div>
        </div>
      )}
    </div>
  );
};
export default RegistrationBasicInfoInternal;
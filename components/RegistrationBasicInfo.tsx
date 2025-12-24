import React, { useMemo, useState } from 'react';
import { Patient, FieldSettings, AuthorityLevel } from '../types';
import { Hash, MapPin, Briefcase, Users, CreditCard, Building2, Star, Search, User, Phone, Mail, Droplet, Heart, Shield, Award, Baby, FileText, Scale, Link, CheckCircle, ShieldCheck } from 'lucide-react';
import Fuse from 'fuse.js';

interface RegistrationBasicInfoProps {
  formData: Partial<Patient>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  readOnly?: boolean;
  fieldSettings: FieldSettings;
  patients?: Patient[]; 
}

const RegistrationBasicInfo: React.FC<RegistrationBasicInfoProps> = ({ formData, handleChange, readOnly, fieldSettings, patients = [] }) => {
  const [refSearch, setRefSearch] = useState('');
  const [guardianSearch, setGuardianSearch] = useState('');

  const isMinor = useMemo(() => formData.age !== undefined && formData.age < 18, [formData.age]);
  const isFemale = formData.sex === 'Female';
  const showGuardian = isMinor || formData.isPwd || formData.isSeniorDependent;

  const refResults = useMemo(() => {
      if (!refSearch) return [];
      const fuse = new Fuse(patients, { keys: ['name', 'phone'], threshold: 0.3 });
      return fuse.search(refSearch).map(r => r.item).slice(0, 5);
  }, [refSearch, patients]);

  const guardianResults = useMemo(() => {
      if (!guardianSearch) return [];
      const fuse = new Fuse(patients.filter(p => p.id !== formData.id), { keys: ['name', 'phone'], threshold: 0.3 });
      return fuse.search(guardianSearch).map(r => r.item).slice(0, 5);
  }, [guardianSearch, patients, formData.id]);

  const referredByName = patients.find(p => p.id === formData.referredById)?.name;

  const handleGuardianProfileChange = (field: string, value: any) => {
      const updatedProfile = { 
          ...(formData.guardianProfile || { 
              legalName: '', mobile: '', email: '', idType: '', idNumber: '', relationship: '', authorityLevel: AuthorityLevel.FULL 
          }), 
          [field]: value 
      };
      handleChange({ target: { name: 'guardianProfile', value: updatedProfile } } as any);
      
      // Mirror to legacy fields for backward compatibility
      if (field === 'legalName') handleChange({ target: { name: 'guardian', value } } as any);
      if (field === 'mobile') handleChange({ target: { name: 'guardianMobile', value } } as any);
      if (field === 'relationship') handleChange({ target: { name: 'relationshipToPatient', value } } as any);
      if (field === 'idType') handleChange({ target: { name: 'guardianIdType', value } } as any);
      if (field === 'idNumber') handleChange({ target: { name: 'guardianIdNumber', value } } as any);
  };

  const linkGuardianPatient = (p: Patient) => {
      handleGuardianProfileChange('legalName', p.name);
      handleGuardianProfileChange('mobile', p.phone);
      handleGuardianProfileChange('email', p.email);
      handleGuardianProfileChange('linkedPatientId', p.id);
      setGuardianSearch('');
  };

  const handleBoolChange = (name: string, val: boolean) => {
      handleChange({ target: { name, value: val, type: 'checkbox', checked: val } } as any);
  };

  const BooleanField = ({ label, name, checked, onToggle }: { label: string, name: string, checked?: boolean, onToggle: (val: boolean) => void }) => (
    <div className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-white">
        <span className="font-bold text-sm text-slate-700">{label}</span>
        <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                  <input disabled={readOnly} type="radio" name={name} checked={checked === true} onChange={() => onToggle(true)} className="w-5 h-5 accent-teal-600" />
                  <span className="text-sm font-bold text-slate-600 group-hover:text-teal-700">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                  <input disabled={readOnly} type="radio" name={name} checked={checked === false} onChange={() => onToggle(false)} className="w-5 h-5 accent-teal-600" />
                  <span className="text-sm font-bold text-slate-600 group-hover:text-teal-700">No</span>
              </label>
        </div>
    </div>
  );

  return (
    <div className="space-y-6">
        {/* Header Row: ID & Referral */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
                <label className="label flex items-center gap-2 text-slate-400 font-bold"><Hash size={14} /> System ID</label>
                <input type="text" readOnly value={formData.id || ''} className="input bg-slate-50 text-slate-500 font-mono text-sm border-slate-200" />
            </div>
            <div className="md:col-span-9">
                <label className="label flex items-center gap-2 text-teal-700 font-bold"><Star size={14} fill="currentColor"/> Referral Source</label>
                {referredByName ? (
                    <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-xl">
                        <span className="font-bold text-teal-900">{referredByName}</span>
                        <button type="button" onClick={() => handleChange({ target: { name: 'referredById', value: '' } } as any)} className="text-xs font-bold text-teal-600 hover:underline">Remove</button>
                    </div>
                ) : (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input type="text" placeholder="Search referrer by name or phone..." className="input pl-10" value={refSearch} onChange={e => setRefSearch(e.target.value)} />
                        {refSearch && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-2xl border border-slate-100 rounded-xl z-50 overflow-hidden">
                                {refResults.map(p => (
                                    <button key={p.id} type="button" onClick={() => { handleChange({ target: { name: 'referredById', value: p.id } } as any); setRefSearch(''); }} className="w-full text-left p-3 hover:bg-teal-50 flex justify-between items-center border-b last:border-0"><span className="font-bold text-slate-800 text-sm">{p.name}</span><span className="text-[10px] text-slate-400">{p.phone}</span></button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Primary Name Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-2"><User size={14}/> Legal Identity</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><label className="label text-teal-800 font-bold">First Name *</label><input disabled={readOnly} required type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} className="input font-bold" /></div>
                <div><label className="label">Middle Name</label><input disabled={readOnly} type="text" name="middleName" value={formData.middleName || ''} onChange={handleChange} className="input" /></div>
                <div><label className="label text-teal-800 font-bold">Surname *</label><input disabled={readOnly} required type="text" name="surname" value={formData.surname || ''} onChange={handleChange} className="input font-bold" /></div>
                <div><label className="label">Suffix</label><select name="suffix" value={formData.suffix || ''} onChange={handleChange} className="input">{['', ...fieldSettings.suffixes].map(s => <option key={s} value={s}>{s || '- None -'}</option>)}</select></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div><label className="label font-bold">Birth Date</label><input type="date" name="dob" value={formData.dob || ''} onChange={handleChange} className="input" /></div>
                <div><label className="label">Calculated Age</label><input type="text" readOnly value={formData.age ?? ''} className="input bg-slate-50 font-bold text-teal-700" /></div>
                <div><label className="label font-bold">Sex</label><select name="sex" value={formData.sex || ''} onChange={handleChange} className="input"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                <div><label className="label">Blood Group</label><select name="bloodGroup" value={formData.bloodGroup || ''} onChange={handleChange} className="input">{['', ...fieldSettings.bloodGroups].map(bg => <option key={bg} value={bg}>{bg || 'Unknown'}</option>)}</select></div>
            </div>
        </div>

        {/* Conditional Women's Health Section */}
        {isFemale && (
            <div className="bg-lilac-50 border-2 border-lilac-200 p-6 rounded-3xl shadow-lg ring-4 ring-lilac-500/5 animate-in slide-in-from-top-2 duration-500">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-lilac-600 text-white p-2 rounded-xl shadow-lg shadow-lilac-600/20"><Baby size={24}/></div>
                    <div>
                        <h4 className="font-black text-lilac-900 uppercase tracking-widest text-sm">Women's Clinical Health</h4>
                        <p className="text-[10px] text-lilac-600 font-bold uppercase mt-0.5">Critical for drug prescriptions & X-ray safety</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-2xl border transition-all ${formData.pregnant ? 'bg-lilac-100 border-lilac-300 shadow-md' : 'bg-white border-lilac-100'}`}>
                        <BooleanField label="Pregnant?" name="pregnant" checked={formData.pregnant} onToggle={(v) => handleBoolChange('pregnant', v)} />
                    </div>
                    <div className={`p-4 rounded-2xl border transition-all ${formData.nursing ? 'bg-lilac-100 border-lilac-300 shadow-md' : 'bg-white border-lilac-100'}`}>
                        <BooleanField label="Nursing?" name="nursing" checked={formData.nursing} onToggle={(v) => handleBoolChange('nursing', v)} />
                    </div>
                    <div className={`p-4 rounded-2xl border transition-all ${formData.birthControl ? 'bg-lilac-100 border-lilac-300 shadow-md' : 'bg-white border-lilac-100'}`}>
                        <BooleanField label="On Birth Control?" name="birthControl" checked={formData.birthControl} onToggle={(v) => handleBoolChange('birthControl', v)} />
                    </div>
                </div>
            </div>
        )}

        {/* Dependent Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.isPwd ? 'bg-lilac-50 border-lilac-400 shadow-md' : 'bg-white border-slate-100 opacity-60'}`}>
                <input type="checkbox" name="isPwd" checked={formData.isPwd} onChange={handleChange} className="w-6 h-6 accent-lilac-600 rounded" />
                <div><div className="font-bold text-slate-800 text-sm">Patient is PWD</div><p className="text-[10px] text-slate-400 font-bold uppercase">Requires Legal Representative</p></div>
            </label>
            <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.isSeniorDependent ? 'bg-teal-50 border-teal-400 shadow-md' : 'bg-white border-slate-100 opacity-60'}`}>
                <input type="checkbox" name="isSeniorDependent" checked={formData.isSeniorDependent} onChange={handleChange} className="w-6 h-6 accent-teal-600 rounded" />
                <div><div className="font-bold text-slate-800 text-sm">Senior Dependent</div><p className="text-[10px] text-slate-400 font-bold uppercase">Limited Capacity Processing</p></div>
            </label>
        </div>

        {/* Conditional Guardian Section (PDA Upgraded) */}
        {showGuardian && (
            <div className="bg-lilac-50 border-2 border-lilac-200 p-6 rounded-3xl shadow-lg ring-4 ring-lilac-500/5 animate-in slide-in-from-top-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-lilac-600 text-white p-2 rounded-xl shadow-lg shadow-lilac-600/20"><Baby size={24}/></div>
                        <div>
                            <h4 className="font-black text-lilac-900 uppercase tracking-widest text-sm">Legal Guardianship & Consent Authority</h4>
                            <p className="text-[10px] text-lilac-600 font-bold uppercase mt-0.5">Verified representative mandatory for this case</p>
                        </div>
                    </div>
                    {!formData.guardianProfile?.linkedPatientId && (
                        <div className="relative">
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-lilac-200">
                                <Search size={14} className="text-lilac-400"/>
                                <input 
                                    type="text" 
                                    placeholder="Link Existing Patient..." 
                                    className="bg-transparent border-none outline-none text-[10px] font-bold w-32"
                                    value={guardianSearch}
                                    onChange={e => setGuardianSearch(e.target.value)}
                                />
                            </div>
                            {guardianSearch && (
                                <div className="absolute right-0 top-full mt-1 w-64 bg-white shadow-2xl border border-lilac-100 rounded-xl z-50 overflow-hidden">
                                    {guardianResults.map(p => (
                                        <button key={p.id} type="button" onClick={() => linkGuardianPatient(p)} className="w-full text-left p-3 hover:bg-lilac-50 flex justify-between items-center border-b last:border-0"><span className="font-bold text-slate-800 text-xs">{p.name}</span><Link size={10} className="text-lilac-400"/></button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <label className="label text-lilac-800 font-black">Representative Full Legal Name *</label>
                        <input required={showGuardian} type="text" value={formData.guardianProfile?.legalName || ''} onChange={e => handleGuardianProfileChange('legalName', e.target.value)} className="input border-lilac-200 focus:border-lilac-500 focus:ring-lilac-500/20" placeholder="Full name of person signing consent" />
                        {formData.guardianProfile?.linkedPatientId && <div className="mt-2 flex items-center gap-1 text-[9px] font-black text-teal-600 uppercase"><CheckCircle size={10}/> Authenticated Registry Match (ID: {formData.guardianProfile.linkedPatientId})</div>}
                    </div>
                    <div>
                        <label className="label text-lilac-800 font-black">Consent Authority Level *</label>
                        <select required={showGuardian} value={formData.guardianProfile?.authorityLevel || AuthorityLevel.FULL} onChange={e => handleGuardianProfileChange('authorityLevel', e.target.value)} className="input border-lilac-200 focus:border-lilac-500">
                            <option value={AuthorityLevel.FULL}>FULL AUTHORITY</option>
                            <option value={AuthorityLevel.CLINICAL_ONLY}>CLINICAL ONLY</option>
                            <option value={AuthorityLevel.FINANCIAL_ONLY}>FINANCIAL ONLY</option>
                        </select>
                    </div>
                    <div>
                        <label className="label text-lilac-800 font-bold">Relationship *</label>
                        <input required={showGuardian} type="text" value={formData.guardianProfile?.relationship || ''} onChange={e => handleGuardianProfileChange('relationship', e.target.value)} className="input border-lilac-200 focus:border-lilac-500" placeholder="e.g. Parent, Child, SPA Holder" />
                    </div>
                    <div>
                        <label className="label text-lilac-800 font-bold">Mobile</label>
                        <input type="tel" value={formData.guardianProfile?.mobile || ''} onChange={e => handleGuardianProfileChange('mobile', e.target.value)} className="input border-lilac-200 focus:border-lilac-500" />
                    </div>
                    <div>
                        <label className="label text-lilac-800 font-bold">Email</label>
                        <input type="email" value={formData.guardianProfile?.email || ''} onChange={e => handleGuardianProfileChange('email', e.target.value)} className="input border-lilac-200 focus:border-lilac-500" />
                    </div>
                    <div>
                        <label className="label text-lilac-800 font-bold">Verified ID Type</label>
                        <input required={showGuardian} type="text" value={formData.guardianProfile?.idType || ''} onChange={e => handleGuardianProfileChange('idType', e.target.value)} className="input border-lilac-200 focus:border-lilac-500" placeholder="e.g. Passport, Driver's License" />
                    </div>
                    <div>
                        <label className="label text-lilac-800 font-bold">Verified ID Number</label>
                        <input required={showGuardian} type="text" value={formData.guardianProfile?.idNumber || ''} onChange={e => handleGuardianProfileChange('idNumber', e.target.value)} className="input border-lilac-200 focus:border-lilac-500" />
                    </div>
                </div>
            </div>
        )}

        {/* Address Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-2"><MapPin size={14} className="text-teal-600"/> Residential Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6"><label className="label">Home Address / House No. / Street</label><input disabled={readOnly} type="text" name="homeAddress" value={formData.homeAddress || ''} onChange={handleChange} className="input" /></div>
                <div className="md:col-span-3"><label className="label">City / Municipality</label><input disabled={readOnly} type="text" name="city" value={formData.city || ''} onChange={handleChange} className="input" placeholder="e.g. Makati City" /></div>
                <div className="md:col-span-3"><label className="label">Barangay</label><input disabled={readOnly} type="text" name="barangay" value={formData.barangay || ''} onChange={handleChange} className="input" placeholder="e.g. Bel-Air" /></div>
            </div>
        </div>

        {/* Contact & Professional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-2"><Phone size={14}/> Communication</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1"><label className="label font-bold text-teal-800">Mobile No. *</label><input required type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className="input" placeholder="09XX-XXX-XXXX" /></div>
                    <div className="col-span-2 md:col-span-1"><label className="label">Secondary Mobile</label><input type="tel" name="mobile2" value={formData.mobile2 || ''} onChange={handleChange} className="input" /></div>
                    <div className="col-span-2"><label className="label flex items-center gap-2"><Mail size={14} className="text-teal-600"/> Email Address</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="input" /></div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-2"><Briefcase size={14}/> Professional & Social</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1"><label className="label">Occupation</label><input type="text" name="occupation" value={formData.occupation || ''} onChange={handleChange} className="input" /></div>
                    <div className="col-span-2 md:col-span-1"><label className="label">Civil Status</label><select name="civilStatus" value={formData.civilStatus || ''} onChange={handleChange} className="input">{['', ...fieldSettings.civilStatus].map(cs => <option key={cs} value={cs}>{cs || 'Select'}</option>)}</select></div>
                </div>
            </div>
        </div>

        {/* Family Background Section (RESTORED & ALWAYS VISIBLE) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-2"><Users size={14} className="text-teal-600"/> Family Background</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1"><label className="label">Father's Name</label><input type="text" name="fatherName" value={formData.fatherName || ''} onChange={handleChange} className="input" placeholder="Full legal name" /></div>
                <div className="md:col-span-1"><label className="label">Father's Occupation</label><input type="text" name="fatherOccupation" value={formData.fatherOccupation || ''} onChange={handleChange} className="input" /></div>
                <div className="md:col-span-1"><label className="label">Mother's Name</label><input type="text" name="motherName" value={formData.motherName || ''} onChange={handleChange} className="input" placeholder="Full legal name" /></div>
                <div className="md:col-span-1"><label className="label">Mother's Occupation</label><input type="text" name="motherOccupation" value={formData.motherOccupation || ''} onChange={handleChange} className="input" /></div>
            </div>
        </div>

        {/* Insurance Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-2"><CreditCard size={14} className="text-teal-600"/> Financial Coverage</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">Primary HMO / Insurance Provider</label><select name="insuranceProvider" value={formData.insuranceProvider || ''} onChange={handleChange} className="input">{['', ...fieldSettings.insuranceProviders].map(ins => <option key={ins} value={ins}>{ins || '- Private Pay -'}</option>)}</select></div>
                <div><label className="label">Policy / Member Number</label><input type="text" name="insuranceNumber" value={formData.insuranceNumber || ''} onChange={handleChange} className="input" placeholder="e.g. 123-456-789" /></div>
            </div>
        </div>
    </div>
  );
};

export default RegistrationBasicInfo;
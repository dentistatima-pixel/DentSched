import React, { useMemo, useState } from 'react';
import { Patient, FieldSettings } from '../types';
import { Hash, MapPin, Briefcase, Users, CreditCard, Building2, Star, Search, User, Phone, Mail, Droplet, Heart, Shield, Award, Baby } from 'lucide-react';
import Fuse from 'fuse.js';

interface RegistrationBasicInfoProps {
  formData: Partial<Patient>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  readOnly?: boolean;
  fieldSettings: FieldSettings;
  patients?: Patient[]; 
}

const PH_CITY_DATA: Record<string, string[]> = {
    'Makati City': ['Bel-Air', 'San Lorenzo', 'Guadalupe Nuevo', 'Poblacion', 'Olympia', 'Bangkal'],
    'Quezon City': ['Batasan Hills', 'Commonwealth', 'Loyola Heights', 'Fairview', 'Diliman'],
    'Manila City': ['Binondo', 'Ermita', 'Malate', 'Paco', 'Sampaloc', 'Quiapo'],
    'Taguig City': ['Fort Bonifacio (BGC)', 'Pateros', 'Ususan', 'Tuktukan'],
    'Pasig City': ['San Antonio', 'Kapitolyo', 'Ugong', 'Ortigas Center'],
    'Cebu City': ['Lahug', 'Mabolo', 'Guadalupe', 'Banilad'],
};

const RegistrationBasicInfo: React.FC<RegistrationBasicInfoProps> = ({ formData, handleChange, readOnly, fieldSettings, patients = [] }) => {
  const [refSearch, setRefSearch] = useState('');

  const isMinor = useMemo(() => formData.age !== undefined && formData.age < 18, [formData.age]);
  const showGuardian = isMinor || formData.isPwd;

  const currentCity = useMemo(() => {
      const entry = Object.entries(PH_CITY_DATA).find(([city, brgys]) => brgys.includes(formData.barangay || ''));
      return entry ? entry[0] : '';
  }, [formData.barangay]);

  const handleCityChange = (city: string) => {
      const firstBrgy = PH_CITY_DATA[city]?.[0] || '';
      handleChange({ target: { name: 'barangay', value: firstBrgy } } as any);
  };

  const refResults = useMemo(() => {
      if (!refSearch) return [];
      const fuse = new Fuse(patients, { keys: ['name', 'phone'], threshold: 0.3 });
      return fuse.search(refSearch).map(r => r.item).slice(0, 5);
  }, [refSearch, patients]);

  const referredByName = patients.find(p => p.id === formData.referredById)?.name;

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
                    <div className="col-span-2 flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <input type="checkbox" id="isPwd" name="isPwd" checked={formData.isPwd} onChange={handleChange} className="w-5 h-5 accent-teal-600" />
                        <label htmlFor="isPwd" className="text-sm font-bold text-slate-700 cursor-pointer">Patient is a Person with Disability (PWD)</label>
                    </div>
                </div>
            </div>
        </div>

        {/* Address Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-2"><MapPin size={14} className="text-teal-600"/> Residential Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6"><label className="label">Home Address / House No. / Street</label><input disabled={readOnly} type="text" name="homeAddress" value={formData.homeAddress || ''} onChange={handleChange} className="input" /></div>
                <div className="md:col-span-3"><label className="label">City / Municipality</label><select value={currentCity} onChange={e => handleCityChange(e.target.value)} className="input">{Object.keys(PH_CITY_DATA).map(city => <option key={city} value={city}>{city}</option>)}</select></div>
                <div className="md:col-span-3"><label className="label">Barangay</label><select name="barangay" value={formData.barangay || ''} onChange={handleChange} className="input">{currentCity && PH_CITY_DATA[currentCity].map(brgy => <option key={brgy} value={brgy}>{brgy}</option>)}</select></div>
            </div>
        </div>

        {/* Conditional Guardian Section */}
        {showGuardian && (
            <div className="bg-lilac-50 border-2 border-lilac-200 p-6 rounded-3xl shadow-lg ring-4 ring-lilac-500/5 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-lilac-600 text-white p-2 rounded-xl shadow-lg shadow-lilac-600/20"><Baby size={24}/></div>
                    <div>
                        <h4 className="font-black text-lilac-900 uppercase tracking-widest text-sm">Responsible Party / Guardian</h4>
                        <p className="text-[10px] text-lilac-600 font-bold uppercase mt-0.5">Mandatory for Minors and PWD Clinical Records</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <label className="label text-lilac-800 font-black">Authorized Guardian Name *</label>
                        <input required={showGuardian} type="text" name="guardian" value={formData.guardian || ''} onChange={handleChange} className="input border-lilac-200 focus:border-lilac-500 focus:ring-lilac-500/20" placeholder="Full name of person signing consent" />
                    </div>
                    <div>
                        <label className="label text-lilac-800 font-black">Relationship *</label>
                        <input required={showGuardian} type="text" name="relationshipToPatient" value={formData.relationshipToPatient || ''} onChange={handleChange} className="input border-lilac-200 focus:border-lilac-500" placeholder="e.g. Mother, Father, Caregiver" />
                    </div>
                    <div>
                        <label className="label text-lilac-800 font-bold">Guardian Mobile</label>
                        <input type="tel" name="guardianMobile" value={formData.guardianMobile || ''} onChange={handleChange} className="input border-lilac-200 focus:border-lilac-500" />
                    </div>
                    <div>
                        <label className="label text-lilac-800 font-bold">Guardian ID Type</label>
                        <input type="text" name="guardianIdType" value={formData.guardianIdType || ''} onChange={handleChange} className="input border-lilac-200 focus:border-lilac-500" placeholder="e.g. Passport, UMID" />
                    </div>
                    <div>
                        <label className="label text-lilac-800 font-bold">Guardian ID Number</label>
                        <input type="text" name="guardianIdNumber" value={formData.guardianIdNumber || ''} onChange={handleChange} className="input border-lilac-200 focus:border-lilac-500" />
                    </div>
                </div>

                {isMinor && (
                    <div className="mt-6 pt-6 border-t border-lilac-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-1"><label className="label text-lilac-700">Father's Name</label><input type="text" name="fatherName" value={formData.fatherName || ''} onChange={handleChange} className="input border-lilac-100" /></div>
                        <div className="md:col-span-1"><label className="label text-lilac-700">Father's Occupation</label><input type="text" name="fatherOccupation" value={formData.fatherOccupation || ''} onChange={handleChange} className="input border-lilac-100" /></div>
                        <div className="md:col-span-1"><label className="label text-lilac-700">Mother's Name</label><input type="text" name="motherName" value={formData.motherName || ''} onChange={handleChange} className="input border-lilac-100" /></div>
                        <div className="md:col-span-1"><label className="label text-lilac-700">Mother's Occupation</label><input type="text" name="motherOccupation" value={formData.motherOccupation || ''} onChange={handleChange} className="input border-lilac-100" /></div>
                    </div>
                )}
            </div>
        )}

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

import React, { useMemo } from 'react';
import { Patient, FieldSettings } from '../types';
import { Hash, MapPin, Briefcase, Users, CreditCard, Building2 } from 'lucide-react';

interface RegistrationBasicInfoProps {
  formData: Partial<Patient>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  readOnly?: boolean;
  fieldSettings: FieldSettings;
}

const PH_CITY_DATA: Record<string, string[]> = {
    'Makati City': ['Bel-Air', 'San Lorenzo', 'Guadalupe Nuevo', 'Poblacion', 'Olympia', 'Bangkal'],
    'Quezon City': ['Batasan Hills', 'Commonwealth', 'Loyola Heights', 'Fairview', 'Diliman'],
    'Manila City': ['Binondo', 'Ermita', 'Malate', 'Paco', 'Sampaloc', 'Quiapo'],
    'Taguig City': ['Fort Bonifacio (BGC)', 'Pateros', 'Ususan', 'Tuktukan'],
    'Pasig City': ['San Antonio', 'Kapitolyo', 'Ugong', 'Ortigas Center'],
    'Cebu City': ['Lahug', 'Mabolo', 'Guadalupe', 'Banilad'],
};

const RegistrationBasicInfo: React.FC<RegistrationBasicInfoProps> = ({ formData, handleChange, readOnly, fieldSettings }) => {
  
  const currentCity = useMemo(() => {
      // Find which city's barangay list contains the current form value, or default to first if none
      const entry = Object.entries(PH_CITY_DATA).find(([city, brgys]) => brgys.includes(formData.barangay || ''));
      return entry ? entry[0] : '';
  }, [formData.barangay]);

  const handleCityChange = (city: string) => {
      // Default to first barangay in city when city changes
      const firstBrgy = PH_CITY_DATA[city]?.[0] || '';
      handleChange({ target: { name: 'barangay', value: firstBrgy } } as any);
  };

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3"><label className="label flex items-center gap-2 text-slate-400"><Hash size={14} /> ID</label><input type="text" readOnly value={formData.id || ''} className="input bg-slate-50 text-slate-500 font-mono text-sm border-slate-200" /></div>
             <div className="md:col-span-3"><label className="label">Suffix</label><select disabled={readOnly} name="suffix" value={formData.suffix || ''} onChange={handleChange} className="input disabled:bg-slate-100 py-2"><option value="">- None -</option>{fieldSettings.suffixes.map(s => (<option key={s} value={s}>{s}</option>))}</select></div>
            <div className="md:col-span-6"><label className="label">Sex</label><div className="flex gap-4 mt-2"><label className="flex items-center gap-2 cursor-pointer"><input disabled={readOnly} type="radio" name="sex" value="Male" checked={formData.sex === 'Male'} onChange={handleChange} className="w-5 h-5 accent-teal-600" /><span className="font-medium">Male</span></label><label className="flex items-center gap-2 cursor-pointer"><input disabled={readOnly} type="radio" name="sex" value="Female" checked={formData.sex === 'Female'} onChange={handleChange} className="w-5 h-5 accent-teal-600" /><span className="font-medium">Female</span></label></div></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label text-teal-800">First Name *</label><input disabled={readOnly} required type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} className="input font-bold text-slate-800 disabled:bg-slate-100" /></div>
            <div><label className="label">Middle Name</label><input disabled={readOnly} type="text" name="middleName" value={formData.middleName || ''} onChange={handleChange} className="input disabled:bg-slate-100" /></div>
            <div><label className="label text-teal-800">Surname *</label><input disabled={readOnly} required type="text" name="surname" value={formData.surname || ''} onChange={handleChange} className="input font-bold text-slate-800 disabled:bg-slate-100" /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-100/50 p-4 rounded-xl border border-slate-100">
            <div><label className="label">Birthdate</label><input disabled={readOnly} type="date" name="dob" value={formData.dob || ''} onChange={handleChange} className="input disabled:bg-slate-100" /></div>
            <div><label className="label">Age</label><input type="text" readOnly value={formData.age !== undefined ? formData.age : ''} className="input bg-slate-200 text-slate-600 font-bold" placeholder="Auto" /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="md:col-span-2"><label className="label flex items-center gap-1"><MapPin size={14} className="text-teal-600"/> Home Address (Street / Unit / Building)</label><input disabled={readOnly} type="text" name="homeAddress" value={formData.homeAddress || ''} onChange={handleChange} className="input disabled:bg-slate-100" placeholder="e.g. Unit 123, Tower A, Ayala Ave" /></div>
             
             {/* Address Intelligence: Barangay/City Lookup */}
             <div>
                 <label className="label flex items-center gap-1"><Building2 size={14} className="text-teal-600"/> City/Municipality</label>
                 <select value={currentCity} onChange={e => handleCityChange(e.target.value)} disabled={readOnly} className="input bg-white font-bold">
                     <option value="">- Select City -</option>
                     {Object.keys(PH_CITY_DATA).map(city => <option key={city} value={city}>{city}</option>)}
                 </select>
             </div>
             <div>
                 <label className="label flex items-center gap-1"><MapPin size={14} className="text-teal-600"/> Barangay</label>
                 <select disabled={readOnly || !currentCity} name="barangay" value={formData.barangay || ''} onChange={handleChange} className="input bg-white font-bold disabled:bg-slate-50">
                     <option value="">- Select Barangay -</option>
                     {currentCity && PH_CITY_DATA[currentCity].map(brgy => <option key={brgy} value={brgy}>{brgy}</option>)}
                 </select>
             </div>
             
             <div className="md:col-span-2"><label className="label">Occupation</label><input disabled={readOnly} type="text" name="occupation" value={formData.occupation || ''} onChange={handleChange} className="input disabled:bg-slate-100" /></div>
        </div>

        <div className="border-t border-slate-100 pt-4"><h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Users size={16}/> Parents / Guardian</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><label className="label text-slate-600">Father's Name</label><input disabled={readOnly} type="text" name="fatherName" value={formData.fatherName || ''} onChange={handleChange} className="input mb-2" /><label className="label text-slate-600">Father's Occupation</label><input disabled={readOnly} type="text" name="fatherOccupation" value={formData.fatherOccupation || ''} onChange={handleChange} className="input" /></div><div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><label className="label text-slate-600">Mother's Name</label><input disabled={readOnly} type="text" name="motherName" value={formData.motherName || ''} onChange={handleChange} className="input mb-2" /><label className="label text-slate-600">Mother's Occupation</label><input disabled={readOnly} type="text" name="motherOccupation" value={formData.motherOccupation || ''} onChange={handleChange} className="input" /></div></div></div>
        <div className="border-t border-slate-100 pt-4"><h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><CreditCard size={16}/> Insurance</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="label">Insurance Provider</label><select disabled={readOnly} name="insuranceProvider" value={formData.insuranceProvider || ''} onChange={handleChange} className="input disabled:bg-slate-100"><option value="">- None / Self-Pay -</option>{fieldSettings.insuranceProviders.map(p => (<option key={p} value={p}>{p}</option>))}</select></div><div><label className="label">Insurance Number</label><input disabled={readOnly} type="text" name="insuranceNumber" value={formData.insuranceNumber || ''} onChange={handleChange} className="input disabled:bg-slate-100" /></div></div></div>
    </div>
  );
};

export default RegistrationBasicInfo;

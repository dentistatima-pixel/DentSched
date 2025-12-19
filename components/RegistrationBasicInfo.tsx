
import React, { useMemo, useState } from 'react';
import { Patient, FieldSettings } from '../types';
import { Hash, MapPin, Briefcase, Users, CreditCard, Building2, Star, Search } from 'lucide-react';
import Fuse from 'fuse.js';

interface RegistrationBasicInfoProps {
  formData: Partial<Patient>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
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
  const [showRefSearch, setShowRefSearch] = useState(false);

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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3"><label className="label flex items-center gap-2 text-slate-400"><Hash size={14} /> ID</label><input type="text" readOnly value={formData.id || ''} className="input bg-slate-50 text-slate-500 font-mono text-sm border-slate-200" /></div>
            <div className="md:col-span-9">
                <label className="label flex items-center gap-2 text-teal-700 font-bold"><Star size={14} fill="currentColor"/> Internal Referral (Practice Growth)</label>
                {referredByName ? (
                    <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-xl">
                        <span className="font-bold text-teal-900">{referredByName}</span>
                        <button onClick={() => handleChange({ target: { name: 'referredById', value: '' } } as any)} className="text-xs font-bold text-teal-600 hover:underline">Remove</button>
                    </div>
                ) : (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input type="text" placeholder="Search referrer by name or phone..." className="input pl-10" value={refSearch} onChange={e => setRefSearch(e.target.value)} />
                        {refSearch && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-2xl border border-slate-100 rounded-xl z-50 overflow-hidden">
                                {refResults.map(p => (
                                    <button key={p.id} onClick={() => { handleChange({ target: { name: 'referredById', value: p.id } } as any); setRefSearch(''); }} className="w-full text-left p-3 hover:bg-teal-50 flex justify-between items-center border-b last:border-0"><span className="font-bold text-slate-800 text-sm">{p.name}</span><span className="text-[10px] text-slate-400">{p.phone}</span></button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label text-teal-800 font-bold">First Name *</label><input disabled={readOnly} required type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} className="input font-bold" /></div>
            <div><label className="label">Middle Name</label><input disabled={readOnly} type="text" name="middleName" value={formData.middleName || ''} onChange={handleChange} className="input" /></div>
            <div><label className="label text-teal-800 font-bold">Surname *</label><input disabled={readOnly} required type="text" name="surname" value={formData.surname || ''} onChange={handleChange} className="input font-bold" /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="md:col-span-2"><label className="label flex items-center gap-1"><MapPin size={14} className="text-teal-600"/> Home Address</label><input disabled={readOnly} type="text" name="homeAddress" value={formData.homeAddress || ''} onChange={handleChange} className="input" /></div>
             <div><label className="label">City</label><select value={currentCity} onChange={e => handleCityChange(e.target.value)} className="input">{Object.keys(PH_CITY_DATA).map(city => <option key={city} value={city}>{city}</option>)}</select></div>
             <div><label className="label">Barangay</label><select name="barangay" value={formData.barangay || ''} onChange={handleChange} className="input">{currentCity && PH_CITY_DATA[currentCity].map(brgy => <option key={brgy} value={brgy}>{brgy}</option>)}</select></div>
        </div>
    </div>
  );
};

export default RegistrationBasicInfo;


import React from 'react';
import { Patient, FieldSettings } from '../types';
import { Hash, AlertCircle, Phone, Mail, MapPin, Briefcase, Users, CreditCard, ShieldAlert, CheckCircle } from 'lucide-react';

interface RegistrationBasicInfoProps {
  formData: Partial<Patient>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  readOnly?: boolean;
  fieldSettings: FieldSettings;
  isQuickReg?: boolean; 
}

const RegistrationBasicInfo: React.FC<RegistrationBasicInfoProps> = ({ formData, handleChange, readOnly, fieldSettings, isQuickReg = false }) => {
  return (
    <div className="space-y-6">
        {/* --- DPA PROCESSING STATUS --- */}
        <div className={`p-4 rounded-2xl border flex justify-between items-center transition-colors ${formData.processingStatus === 'Suspended' ? 'bg-red-50 border-red-200' : 'bg-teal-50 border-teal-100'}`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${formData.processingStatus === 'Suspended' ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-600'}`}>
                    {formData.processingStatus === 'Suspended' ? <ShieldAlert size={20}/> : <CheckCircle size={20}/>}
                </div>
                <div>
                    <h4 className={`text-sm font-bold ${formData.processingStatus === 'Suspended' ? 'text-red-900' : 'text-teal-900'}`}>
                        Processing Status: {formData.processingStatus || 'Active'}
                    </h4>
                    <p className="text-[10px] font-medium text-slate-500 max-w-xs leading-tight">
                        {formData.processingStatus === 'Suspended' 
                            ? 'Record is locked for editing due to active Data Subject inquiry or dispute.' 
                            : 'Record is available for clinical and administrative processing.'}
                    </p>
                </div>
            </div>
            <select 
                disabled={readOnly}
                name="processingStatus" 
                value={formData.processingStatus || 'Active'} 
                onChange={handleChange}
                className={`text-xs font-bold px-3 py-2 rounded-xl border outline-none cursor-pointer ${formData.processingStatus === 'Suspended' ? 'border-red-300 text-red-700 bg-white' : 'border-teal-200 text-teal-700 bg-white'}`}
            >
                <option value="Active">Processing: Active</option>
                <option value="Suspended">Processing: Suspended</option>
            </select>
        </div>

        {/* --- 1. BASIC INFO --- */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* ID & Suffix */}
            <div className="md:col-span-3">
                <label className="label flex items-center gap-2 text-slate-400">
                    <Hash size={14} /> ID
                </label>
                <input 
                    type="text" 
                    readOnly 
                    value={formData.id || ''} 
                    className="input bg-slate-50 text-slate-500 font-mono text-sm border-slate-200" 
                />
            </div>
             <div className="md:col-span-3">
                <label className="label">Suffix</label>
                <select disabled={readOnly} name="suffix" value={formData.suffix || ''} onChange={handleChange} className="input disabled:bg-slate-100 py-2">
                    <option value="">- None -</option>
                    {fieldSettings.suffixes.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>
            
            {/* Sex (Tickbox Style) */}
            <div className="md:col-span-6">
                <label className="label">Sex</label>
                <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input disabled={readOnly} type="radio" name="sex" value="Male" checked={formData.sex === 'Male'} onChange={handleChange} className="w-5 h-5 accent-teal-600" />
                        <span className="font-medium">Male</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input disabled={readOnly} type="radio" name="sex" value="Female" checked={formData.sex === 'Female'} onChange={handleChange} className="w-5 h-5 accent-teal-600" />
                        <span className="font-medium">Female</span>
                    </label>
                </div>
            </div>
        </div>

        {/* Names */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label className="label text-teal-800">First Name *</label>
                <input disabled={readOnly} required type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} className="input font-bold text-slate-800 disabled:bg-slate-100" />
            </div>
            <div>
                <label className="label">Middle Name</label>
                <input disabled={readOnly} type="text" name="middleName" value={formData.middleName || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
            </div>
            <div>
                <label className="label text-teal-800">Surname *</label>
                <input disabled={readOnly} required type="text" name="surname" value={formData.surname || ''} onChange={handleChange} className="input font-bold text-slate-800 disabled:bg-slate-100" />
            </div>
        </div>

        {/* Vitals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-100/50 p-4 rounded-xl border border-slate-100">
            <div>
                <label className="label">Birthdate (dd/mm/yyyy)</label>
                <input disabled={readOnly} type="date" name="dob" value={formData.dob || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
            </div>
            <div>
                <label className="label">Age (Auto-calculated)</label>
                <input type="text" readOnly value={formData.age !== undefined ? formData.age : ''} className="input bg-slate-200 text-slate-600 font-bold" placeholder="Auto" />
            </div>
        </div>

        {/* Address & Occupation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                 <label className="label">Home Address</label>
                 <input disabled={readOnly} type="text" name="homeAddress" value={formData.homeAddress || ''} onChange={handleChange} className="input disabled:bg-slate-100" placeholder="Street, Unit, Village..." />
             </div>
             <div>
                 <label className="label">Barangay</label>
                 <input disabled={readOnly} type="text" name="barangay" value={formData.barangay || ''} onChange={handleChange} className="input disabled:bg-slate-100" placeholder="Brgy..." />
             </div>
             <div className="md:col-span-2">
                <label className="label">Occupation</label>
                <input disabled={readOnly} type="text" name="occupation" value={formData.occupation || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
             </div>
        </div>

        {/* --- 2. PARENTS & GUARDIAN --- */}
        <div className="border-t border-slate-100 pt-4">
            <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Users size={16}/> Parents / Guardian</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Father */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <label className="label text-slate-600">Father's Name</label>
                    <input disabled={readOnly} type="text" name="fatherName" value={formData.fatherName || ''} onChange={handleChange} className="input mb-2" />
                    <label className="label text-slate-600">Father's Occupation</label>
                    <input disabled={readOnly} type="text" name="fatherOccupation" value={formData.fatherOccupation || ''} onChange={handleChange} className="input" />
                </div>
                {/* Mother */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <label className="label text-slate-600">Mother's Name</label>
                    <input disabled={readOnly} type="text" name="motherName" value={formData.motherName || ''} onChange={handleChange} className="input mb-2" />
                    <label className="label text-slate-600">Mother's Occupation</label>
                    <input disabled={readOnly} type="text" name="motherOccupation" value={formData.motherOccupation || ''} onChange={handleChange} className="input" />
                </div>
            </div>

            {/* Guardian (Mandatory if Minor) */}
            {(formData.age !== undefined && formData.age < 18) && (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-2 mb-4 text-orange-700 font-bold text-sm">
                        <AlertCircle size={16} /> Patient is a minor (&lt; 18). Guardian details required.
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label text-orange-900">Guardian Name</label>
                            <input disabled={readOnly} type="text" name="guardian" value={formData.guardian || ''} onChange={handleChange} className="input border-orange-200 focus:border-orange-500" />
                        </div>
                        <div>
                            <label className="label text-orange-900">Guardian Mobile</label>
                            <input disabled={readOnly} type="text" name="guardianMobile" value={formData.guardianMobile || ''} onChange={handleChange} className="input border-orange-200 focus:border-orange-500" />
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* --- 3. INSURANCE --- */}
        <div className="border-t border-slate-100 pt-4">
             <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><CreditCard size={16}/> Insurance</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="label">Insurance Provider</label>
                    <select disabled={readOnly} name="insuranceProvider" value={formData.insuranceProvider || ''} onChange={handleChange} className="input disabled:bg-slate-100">
                        <option value="">- None / Self-Pay -</option>
                        {fieldSettings.insuranceProviders.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="label">Insurance Number</label>
                    <input disabled={readOnly} type="text" name="insuranceNumber" value={formData.insuranceNumber || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
                </div>
             </div>
        </div>

        {/* --- 4. CONTACT INFO --- */}
        <div className="border-t border-slate-100 pt-4">
             <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Phone size={16}/> Contact Details</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="label text-teal-800">Mobile Number *</label>
                    <input disabled={readOnly} required type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className="input font-mono text-lg tracking-wide disabled:bg-slate-100" placeholder="09xx xxx xxxx" />
                </div>
                <div>
                    <label className="label">Mobile 2 (Optional)</label>
                    <input disabled={readOnly} type="tel" name="mobile2" value={formData.mobile2 || ''} onChange={handleChange} className="input font-mono text-lg tracking-wide disabled:bg-slate-100" />
                </div>
                <div className="md:col-span-2">
                    <label className="label">Email Address (Optional)</label>
                    <input disabled={readOnly} type="email" name="email" value={formData.email || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
                </div>
             </div>
        </div>
    </div>
  );
};

export default RegistrationBasicInfo;

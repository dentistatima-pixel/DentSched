
import React from 'react';
import { Patient } from '../types';
import { Hash, AlertCircle, Shield } from 'lucide-react';

interface RegistrationBasicInfoProps {
  formData: Partial<Patient>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  readOnly?: boolean;
}

const RegistrationBasicInfo: React.FC<RegistrationBasicInfoProps> = ({ formData, handleChange, readOnly }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Auto Generated ID */}
        <div>
            <label className="label flex items-center gap-2">
                <Hash size={16} className="text-slate-400"/>
                Patient ID
            </label>
            <input 
                type="text" 
                readOnly 
                value={formData.id || ''} 
                className="input bg-slate-100 text-teal-800 font-bold font-mono tracking-wider text-lg border-teal-200" 
            />
        </div>

        <div>
            <label className="label">Suffix</label>
            <select disabled={readOnly} name="suffix" value={formData.suffix || ''} onChange={handleChange} className="input disabled:bg-slate-100">
                <option value="">-</option>
                <option value="Mr">Mr</option>
                <option value="Ms">Ms</option>
                <option value="Mrs">Mrs</option>
                <option value="Dr">Dr</option>
            </select>
        </div>
        <div>
            <label className="label">First Name *</label>
            <input disabled={readOnly} required type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
        </div>
        <div>
            <label className="label">Middle Name</label>
            <input disabled={readOnly} type="text" name="middleName" value={formData.middleName || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
        </div>
        <div>
            <label className="label">Surname *</label>
            <input disabled={readOnly} required type="text" name="surname" value={formData.surname || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
        </div>

        <div>
            <label className="label">Date of Birth</label>
            <input disabled={readOnly} type="date" name="dob" value={formData.dob || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
        </div>
        <div>
            <label className="label">Age</label>
            <input type="text" readOnly value={formData.age !== undefined ? formData.age : ''} className="input bg-slate-100 text-slate-500 font-bold" placeholder="Auto-calculated" />
        </div>

        {/* Guardian Information - Only if Minor */}
        {(formData.age !== undefined && formData.age < 18) && (
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-2 mb-4 text-orange-700 font-bold text-sm">
                    <AlertCircle size={16} /> Patient is a minor (&lt; 18). Guardian details required.
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="label text-orange-900">Guardian Name</label>
                        <input disabled={readOnly} type="text" name="guardian" value={formData.guardian || ''} onChange={handleChange} className="input border-orange-200 focus:border-orange-500 disabled:bg-orange-50/50" />
                    </div>
                    <div>
                        <label className="label text-orange-900">Guardian Mobile</label>
                        <input disabled={readOnly} type="text" name="guardianMobile" value={formData.guardianMobile || ''} onChange={handleChange} className="input border-orange-200 focus:border-orange-500 disabled:bg-orange-50/50" />
                    </div>
                </div>
            </div>
        )}

        <div>
            <label className="label">Sex</label>
            <div className="flex gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-xl bg-white has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50 transition-all flex-1">
                    <input disabled={readOnly} type="radio" name="sex" value="Male" checked={formData.sex === 'Male'} onChange={handleChange} className="accent-teal-600 w-5 h-5" />
                    <span className="font-medium text-slate-700">Male</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-xl bg-white has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50 transition-all flex-1">
                    <input disabled={readOnly} type="radio" name="sex" value="Female" checked={formData.sex === 'Female'} onChange={handleChange} className="accent-teal-600 w-5 h-5" />
                    <span className="font-medium text-slate-700">Female</span>
                </label>
            </div>
        </div>

        {/* Female Specific Fields */}
        {formData.sex === 'Female' && (
            <div className="bg-lilac-50 p-4 rounded-xl border border-lilac-100 animate-in fade-in slide-in-from-top-2">
                <label className="font-bold block mb-3 text-lilac-900">Female Specific</label>
                <div className="space-y-3">
                    <label className="flex items-center gap-2">
                        <input disabled={readOnly} type="checkbox" name="pregnant" checked={formData.pregnant || false} onChange={handleChange} className="w-5 h-5 accent-lilac-600 rounded" />
                        <span className="text-slate-800 font-medium">Pregnant</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input disabled={readOnly} type="checkbox" name="nursing" checked={formData.nursing || false} onChange={handleChange} className="w-5 h-5 accent-lilac-600 rounded" />
                        <span className="text-slate-800 font-medium">Nursing</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input disabled={readOnly} type="checkbox" name="birthControl" checked={formData.birthControl || false} onChange={handleChange} className="w-5 h-5 accent-lilac-600 rounded" />
                        <span className="text-slate-800 font-medium">Taking Birth Control</span>
                    </label>
                </div>
            </div>
        )}

        <div>
            <label className="label">Home Address</label>
            <input disabled={readOnly} type="text" name="homeAddress" value={formData.homeAddress || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
        </div>

        <div>
            <label className="label">Barangay</label>
            <input disabled={readOnly} type="text" name="barangay" value={formData.barangay || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
        </div>
        <div>
            <label className="label">Occupation</label>
            <input disabled={readOnly} type="text" name="occupation" value={formData.occupation || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
        </div>

        <div className="border-t border-slate-200 pt-4">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Shield size={16} className="text-teal-600"/> Parent Information
            </h4>
            <div className="space-y-4">
                <div>
                    <label className="label">Father's Name</label>
                    <input disabled={readOnly} type="text" name="fatherName" value={formData.fatherName || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
                </div>
                <div>
                    <label className="label">Father's Occupation</label>
                    <input disabled={readOnly} type="text" name="fatherOccupation" value={formData.fatherOccupation || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
                </div>
                <div>
                    <label className="label">Mother's Name</label>
                    <input disabled={readOnly} type="text" name="motherName" value={formData.motherName || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
                </div>
                <div>
                    <label className="label">Mother's Occupation</label>
                    <input disabled={readOnly} type="text" name="motherOccupation" value={formData.motherOccupation || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
                </div>
            </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">Financial & Insurance</h4>
            <div className="space-y-4">
                 <div>
                    <label className="label">Responsible Party</label>
                    <input disabled={readOnly} type="text" name="responsibleParty" value={formData.responsibleParty || ''} onChange={handleChange} className="input disabled:bg-slate-100" placeholder="If different from patient" />
                </div>
                <div>
                    <label className="label">Insurance Provider</label>
                    <input disabled={readOnly} type="text" name="insuranceProvider" value={formData.insuranceProvider || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
                </div>
                <div>
                    <label className="label">Insurance Number</label>
                    <input disabled={readOnly} type="text" name="insuranceNumber" value={formData.insuranceNumber || ''} onChange={handleChange} className="input disabled:bg-slate-100" />
                </div>
            </div>
        </div>
    </div>
  );
};

export default RegistrationBasicInfo;

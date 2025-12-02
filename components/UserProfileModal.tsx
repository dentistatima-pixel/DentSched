
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { X, Shield, Award, Calendar, Briefcase, CreditCard, Activity, Settings, MapPin, DollarSign, Lock, Server, Edit2, Save, RotateCcw } from 'lucide-react';

interface UserProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedUser: User) => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User>(user);

  useEffect(() => {
    setFormData(user);
    setIsEditing(false);
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: name === 'defaultConsultationFee' ? parseFloat(value) : value
    }));
  };

  const handleSave = () => {
      if (onSave) {
          onSave(formData);
      }
      setIsEditing(false);
  };

  const handleCancel = () => {
      setFormData(user);
      setIsEditing(false);
  };

  const InputField = ({ label, name, value, type = 'text', placeholder = '' }: { label: string, name: keyof User, value: any, type?: string, placeholder?: string }) => (
      <div className="mb-2">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>
          <input 
            type={type} 
            name={name}
            value={value || ''} 
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-teal-500 outline-none bg-white"
          />
      </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header Profile Card */}
        <div className="bg-teal-900 text-white p-6 relative shrink-0">
          <div className="absolute top-4 right-4 flex gap-2">
            {!isEditing && onSave && (
                <button 
                    onClick={() => setIsEditing(true)} 
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    title="Edit Profile"
                >
                    <Edit2 size={18} />
                </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
            </button>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-teal-500 shadow-xl mb-4 bg-white relative group">
                <img src={formData.avatar} alt={formData.name} className="w-full h-full rounded-full object-cover" />
                
                {isEditing ? (
                     <div className="absolute bottom-0 right-0">
                        <input 
                            type="color" 
                            name="colorPreference"
                            value={formData.colorPreference || '#14b8a6'}
                            onChange={handleChange}
                            className="w-8 h-8 rounded-full border-2 border-white shadow-md cursor-pointer overflow-hidden p-0"
                            title="Change Calendar Color"
                        />
                     </div>
                ) : (
                    formData.colorPreference && (
                        <div 
                            className="absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white shadow-md"
                            style={{ backgroundColor: formData.colorPreference }}
                            title="Calendar Color Preference"
                        />
                    )
                )}
            </div>

            {isEditing ? (
                <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange}
                    className="text-xl font-bold text-center text-teal-900 rounded px-2 py-1 mb-1 w-full"
                />
            ) : (
                <h2 className="text-2xl font-bold">{formData.name}</h2>
            )}
            
            <div className="flex items-center gap-2 mt-1">
                <span className="bg-teal-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{formData.role}</span>
                {isEditing ? (
                    <input 
                        type="text" 
                        name="specialization"
                        value={formData.specialization || ''}
                        onChange={handleChange}
                        placeholder="Specialization"
                        className="bg-white/10 border border-white/30 text-white px-2 py-0.5 rounded text-xs w-32"
                    />
                ) : (
                    formData.specialization && (
                        <span className="bg-lilac-600 px-3 py-1 rounded-full text-xs font-bold">{formData.specialization}</span>
                    )
                )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
            
            {/* 1. OPERATIONAL SETTINGS (Efficiency Fields) */}
            <div>
                 <div className="flex items-center gap-2 text-teal-800 font-bold border-b border-slate-100 pb-2 mb-3">
                    <Settings size={18} /> Operational Defaults
                </div>
                
                {isEditing ? (
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="Default Branch" name="defaultBranch" value={formData.defaultBranch} placeholder="e.g. Makati" />
                        {(formData.role === UserRole.DENTIST || formData.role === UserRole.ADMIN) && (
                            <InputField label="Consult Fee (₱)" name="defaultConsultationFee" value={formData.defaultConsultationFee} type="number" />
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><MapPin size={10}/> Default Branch</span>
                            <span className="font-bold text-slate-800 text-sm">{formData.defaultBranch || 'All Locations'}</span>
                        </div>

                        {(formData.role === UserRole.DENTIST || formData.role === UserRole.ADMIN) && (
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><DollarSign size={10}/> Standard Fee</span>
                                <span className="font-bold text-slate-800 text-sm">
                                    {formData.defaultConsultationFee ? `₱${formData.defaultConsultationFee.toFixed(2)}` : '-'}
                                </span>
                            </div>
                        )}

                        {formData.role === UserRole.HYGIENIST && (
                            <div className={`p-3 rounded-xl border ${formData.isReadOnly ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
                                <span className={`block text-[10px] font-bold uppercase mb-1 flex items-center gap-1 ${formData.isReadOnly ? 'text-orange-500' : 'text-green-600'}`}>
                                    <Lock size={10}/> System Access
                                </span>
                                <span className={`font-bold text-sm ${formData.isReadOnly ? 'text-orange-800' : 'text-green-800'}`}>
                                    {formData.isReadOnly ? 'Read-Only Mode' : 'Full Access'}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 2. ADMIN/DENTIST PROFILE - Regulatory Compliance */}
            {(formData.role === UserRole.DENTIST || formData.role === UserRole.ADMIN) && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-teal-800 font-bold border-b border-slate-100 pb-2">
                        <Shield size={18} /> Regulatory Compliance
                    </div>
                    
                    {isEditing ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="PRC License" name="prcLicense" value={formData.prcLicense} />
                                <InputField label="Valid Until" name="prcValidity" value={formData.prcValidity} type="date" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="PTR Number" name="ptrNumber" value={formData.ptrNumber} />
                                <InputField label="TIN" name="tin" value={formData.tin} />
                            </div>
                            <InputField label="S2 License (PDEA)" name="s2License" value={formData.s2License} />
                            
                            {formData.role === UserRole.DENTIST && (
                                <div className="grid grid-cols-2 gap-4">
                                     <InputField label="PDA Chapter" name="pdaChapter" value={formData.pdaChapter} />
                                     <InputField label="PDA ID" name="pdaId" value={formData.pdaId} />
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <span className="block text-xs text-slate-500 font-bold uppercase">PRC License</span>
                                    <span className="font-mono font-bold text-slate-800 text-lg">{formData.prcLicense || '---'}</span>
                                    <div className="text-[10px] text-green-600 mt-1">{formData.prcValidity ? `Valid until: ${formData.prcValidity}` : 'Permanent'}</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <span className="block text-xs text-slate-500 font-bold uppercase">PTR Number</span>
                                    <span className="font-mono font-bold text-slate-800 text-lg">{formData.ptrNumber || '---'}</span>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <span className="block text-xs text-slate-500 font-bold uppercase">Tax Identification (TIN)</span>
                                    <span className="font-mono font-medium text-slate-800">{formData.tin || 'Pending'}</span>
                                </div>
                                <CreditCard size={20} className="text-slate-300"/>
                            </div>

                            {formData.s2License && (
                                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Activity size={14} className="text-orange-600"/>
                                        <span className="text-xs text-orange-700 font-bold uppercase">S2 License (PDEA)</span>
                                    </div>
                                    <span className="font-mono font-medium text-slate-800">{formData.s2License}</span>
                                </div>
                            )}

                            {formData.role === UserRole.DENTIST && (
                                <div className="mt-4">
                                    <div className="text-xs text-slate-400 font-bold uppercase mb-2">Professional Affiliation</div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">PDA</div>
                                        <div>
                                            <div className="font-bold text-slate-800">{formData.pdaChapter || 'National Chapter'}</div>
                                            <div className="text-xs text-slate-500">ID: {formData.pdaId || '---'}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* 3. ADMIN PRIVILEGES */}
            {formData.role === UserRole.ADMIN && (
                 <div className="space-y-4">
                    <div className="flex items-center gap-2 text-red-800 font-bold border-b border-red-100 pb-2">
                        <Server size={18} /> System Privileges
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                            <span className="block text-[10px] text-red-400 font-bold uppercase mb-1">Data Access</span>
                            <span className="font-bold text-red-900 text-sm">Full Control</span>
                        </div>
                        <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                             <span className="block text-[10px] text-red-400 font-bold uppercase mb-1">Financials</span>
                             <span className="font-bold text-red-900 text-sm">Super Admin</span>
                        </div>
                    </div>
                 </div>
            )}

            {/* 4. ASSISTANT PROFILE - Operational */}
            {formData.role === UserRole.HYGIENIST && (
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-2 text-teal-800 font-bold border-b border-slate-100 pb-2 mb-3">
                            <Briefcase size={18} /> Employment Details
                        </div>
                        {isEditing ? (
                             <InputField label="Employee ID" name="employeeId" value={formData.employeeId} />
                        ) : (
                            <div className="bg-slate-50 p-3 rounded-lg mb-3">
                                <span className="block text-xs text-slate-500 font-bold uppercase">Employee ID</span>
                                <span className="font-mono font-bold text-slate-800">{formData.employeeId || 'TEMP-000'}</span>
                            </div>
                        )}
                        
                        {formData.assignedDoctors && formData.assignedDoctors.length > 0 && (
                             <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
                                <span className="block text-xs text-blue-600 font-bold uppercase mb-1">Assigned to Doctors</span>
                                <div className="flex flex-wrap gap-2">
                                    {formData.assignedDoctors.map(docId => (
                                        <span key={docId} className="bg-white px-2 py-1 rounded text-xs font-bold text-blue-800 border border-blue-100">
                                            {docId}
                                        </span>
                                    ))}
                                </div>
                             </div>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center gap-2 text-teal-800 font-bold border-b border-slate-100 pb-2 mb-3">
                            <Award size={18} /> Certifications & Skills
                        </div>
                        {formData.certifications && formData.certifications.length > 0 ? (
                            <ul className="space-y-2">
                                {formData.certifications.map(cert => (
                                    <li key={cert} className="flex items-center gap-2 text-sm text-slate-700 bg-teal-50 p-2 rounded-lg">
                                        <Award size={16} className="text-teal-600"/> {cert}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-slate-400 text-sm italic">No certifications recorded.</p>
                        )}
                    </div>
                </div>
            )}
            
            {/* Common Info */}
            <div className="pt-2">
                 <div className="flex items-center gap-2 text-teal-800 font-bold border-b border-slate-100 pb-2 mb-3">
                    <Calendar size={18} /> Schedule
                </div>
                {isEditing ? (
                    <InputField label="Clinic Hours" name="clinicHours" value={formData.clinicHours} />
                ) : (
                    <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600">
                        {formData.clinicHours || 'Standard Clinic Hours (Mon-Sat 9AM-6PM)'}
                    </div>
                )}
            </div>

             <div className="bg-slate-100 p-4 rounded-xl text-xs text-slate-400 text-center">
                User Profile & Compliance Viewer v1.2 <br/>
                Data Privacy Act of 2012 Compliant
            </div>
        </div>

        {/* Footer Actions (Only when editing) */}
        {isEditing && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3 animate-in slide-in-from-bottom-2">
                <button 
                    onClick={handleCancel}
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                >
                    <RotateCcw size={18} /> Cancel
                </button>
                <button 
                    onClick={handleSave}
                    className="flex-[2] py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Save size={18} /> Save Changes
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;


import React, { useState, useEffect } from 'react';
import { User, UserRole, FieldSettings, CpdEntry, LicenseCategory } from '../types';
import { X, Shield, Award, Calendar, Briefcase, CreditCard, Activity, Settings, MapPin, DollarSign, Lock, Server, Edit2, Save, RotateCcw, Sliders, Eye, Plus, Trash2, CheckCircle, GraduationCap, AlertCircle, Percent, UserCircle, Sparkles, Moon, Sun } from 'lucide-react';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';
import { useSettings } from '../contexts/SettingsContext';
import { useAppContext } from '../contexts/AppContext';

interface UserProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedUser: User) => void;
}

const ProfileField: React.FC<{ label: string; value: string | undefined | number; name?: keyof User; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; isEditing: boolean; type?: string; placeholder?: string; step?: string; }> = ({ label, value, name, onChange, isEditing, type = 'text', placeholder, step }) => (
    <div>
        <label htmlFor={name?.toString()} className="label text-xs">{label}</label>
        <input 
            id={name?.toString()}
            type={type}
            name={name?.toString()}
            value={value || ''}
            onChange={onChange}
            disabled={!isEditing}
            placeholder={placeholder}
            step={step}
            className="input"
        />
    </div>
);

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const toast = useToast();
  const { fieldSettings } = useSettings();
  const { theme, toggleTheme } = useAppContext();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User>(user);
  
  useEffect(() => {
    setFormData({ ...user, allowedBranches: user.allowedBranches || [] });
    setIsEditing(false);
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      let finalValue: any = value;
      if (type === 'number') {
        finalValue = value === '' ? null : parseFloat(value);
      }
      setFormData(prev => ({ ...prev, [name]: finalValue }));
  };
  
  const handleBranchChange = (branch: string, checked: boolean) => {
    setFormData(prev => {
        const currentBranches = prev.allowedBranches || [];
        const newBranches = checked
            ? [...currentBranches, branch]
            : currentBranches.filter(b => b !== branch);
        return { ...prev, allowedBranches: newBranches };
    });
  };

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };

  const handleValidationSave = () => {
      if (onSave) onSave(formData);
      setIsEditing(false);
  };

  const isClinicalStaff = [UserRole.DENTIST, UserRole.DENTAL_ASSISTANT].includes(formData.role);
  const isDentist = formData.role === UserRole.DENTIST;

  if (!isOpen || !fieldSettings) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-[90vh]">
        
        <div className="bg-teal-900 text-white p-6 relative shrink-0 flex justify-between items-center">
            <div>
                <input 
                    id="profile-name"
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    disabled={!isEditing}
                    className="bg-transparent text-xl font-black text-white outline-none w-full p-0 disabled:border-transparent"
                    placeholder="Enter Full Legal Name"
                />
                <p className="text-teal-300 text-xs font-bold uppercase tracking-wider mt-1">{formData.role}</p>
            </div>
          <button onClick={onClose} aria-label="Close Profile" className="p-2 hover:bg-white/20 rounded-full transition-colors focus:ring-offset-2 self-start"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-bg-tertiary">
            <div className="bg-bg-secondary p-6 rounded-[2rem] border border-border-primary shadow-inner">
                <div className="flex items-center gap-3 text-teal-800 dark:text-teal-300 font-black uppercase text-xs tracking-widest border-b border-border-secondary pb-3 mb-4">
                    <Server size={20} /> System Access
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="role" className="label text-xs">User Role</label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="input"
                        >
                            {Object.values(UserRole).map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label text-xs">Allowed Branches</label>
                        <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-border-secondary">
                            {(fieldSettings.branches || []).map(branch => (
                                <label key={branch} className="flex items-center gap-3 p-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.allowedBranches?.includes(branch)}
                                        onChange={(e) => handleBranchChange(branch, e.target.checked)}
                                        disabled={!isEditing}
                                        className="w-5 h-5 accent-teal-600 rounded"
                                    />
                                    <span className="text-sm font-bold text-text-primary">{branch}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            {isClinicalStaff && (
                <div className="bg-bg-secondary p-6 rounded-[2rem] border border-border-primary shadow-inner">
                    <div className="flex items-center gap-3 text-red-800 dark:text-red-300 font-black uppercase text-xs tracking-widest border-b border-border-secondary pb-3 mb-4">
                        <Shield size={20} /> Professional Verification
                    </div>
                    <div className="space-y-4">
                         <div>
                            <label htmlFor="license-category" className="label text-xs">Statutory License Category *</label>
                            <select id="license-category" name="licenseCategory" value={formData.licenseCategory || ''} onChange={handleChange} disabled={!isEditing} className="input">
                                <option value="">- SELECT SCOPE (RA 9484) -</option>
                                <option value="DENTIST">LICENSED DENTIST</option>
                                <option value="HYGIENIST">LICENSED DENTAL HYGIENIST</option>
                                <option value="TECHNOLOGIST">LICENSED DENTAL TECHNOLOGIST</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <ProfileField label="PRC Registered License" name="prcLicense" value={formData.prcLicense} onChange={handleChange} isEditing={isEditing} />
                            <ProfileField label="License Expiry" name="prcExpiry" value={formData.prcExpiry} onChange={handleChange} isEditing={isEditing} type="date" />
                        </div>
                        <ProfileField label="PTR Number" name="ptrNumber" value={formData.ptrNumber} onChange={handleChange} isEditing={isEditing} />
                        <div className="grid grid-cols-2 gap-4">
                            <ProfileField label="Malpractice Policy #" name="malpracticePolicy" value={formData.malpracticePolicy} onChange={handleChange} isEditing={isEditing}/>
                            <ProfileField label="Malpractice Insurance Expiry" name="malpracticeExpiry" value={formData.malpracticeExpiry} onChange={handleChange} isEditing={isEditing} type="date" />
                        </div>
                        {isDentist && (
                            <div className="pt-4 border-t border-border-secondary">
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Prescriber's Information (S2)</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <ProfileField label="S2 License #" name="s2License" value={formData.s2License} onChange={handleChange} isEditing={isEditing}/>
                                    <ProfileField label="S2 Expiry" name="s2Expiry" value={formData.s2Expiry} onChange={handleChange} isEditing={isEditing} type="date"/>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
             <div className="bg-bg-secondary p-6 rounded-[2rem] border border-border-primary shadow-inner">
                <div className="flex items-center gap-3 text-blue-800 dark:text-blue-300 font-black uppercase text-xs tracking-widest border-b border-border-secondary pb-3 mb-4">
                    <DollarSign size={20} /> Financial & Administrative
                </div>
                <div className="space-y-4">
                    <ProfileField label="TIN (Tax Identification Number)" name="tin" value={formData.tin} onChange={handleChange} isEditing={isEditing} />
                    {isDentist && (
                        <ProfileField label="Contracted Fee Split Rate" name="commissionRate" value={formData.commissionRate} onChange={handleChange} isEditing={isEditing} type="number" step="0.01" placeholder="e.g., 0.40 for 40%"/>
                    )}
                    <ProfileField label="Payout Handle" name="payoutHandle" value={formData.payoutHandle} onChange={handleChange} isEditing={isEditing} placeholder="e.g., GCash Number or Bank Account"/>
                </div>
            </div>
        </div>

        <div className="p-4 border-t border-border-primary bg-bg-secondary flex gap-2 shrink-0">
            {isEditing ? (
                <>
                    <button onClick={handleCancel} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold text-slate-500 dark:text-slate-300 uppercase text-[10px] tracking-widest focus:ring-offset-2">Cancel</button>
                    <button onClick={handleValidationSave} className="flex-[2] py-4 bg-teal-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-teal-600/20 hover:scale-[1.02] active:scale-95 transition-all focus:ring-offset-2">Update Secure Identity</button>
                </>
            ) : (
                <div className="w-full flex gap-2">
                    <button onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold text-slate-500 dark:text-slate-300 uppercase text-[10px] tracking-widest focus:ring-offset-2">Close</button>
                    {onSave && (
                        <button onClick={() => setIsEditing(true)} className="flex-[2] py-4 bg-teal-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-teal-600/20 hover:scale-[1.02] active:scale-95 transition-all focus:ring-offset-2 flex items-center justify-center gap-2"><Edit2 size={14}/> Edit Profile</button>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;

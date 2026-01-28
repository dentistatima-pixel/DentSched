import React, { useState, useEffect } from 'react';
import { User, UserRole, LicenseCategory } from '../types';
import { Save, Edit, X, Shield, Percent, Sparkles, MapPin, Power, PowerOff } from 'lucide-react';
import { useToast } from './ToastSystem';
import { useSettings } from '../contexts/SettingsContext';
import { useAppContext } from '../contexts/AppContext';
import { useFinancials } from '../contexts/FinancialContext';
import { useAuthorization } from '../hooks/useAuthorization';

interface PersonalProfileProps {
  currentUser: User;
  onSave: (updatedUser: User) => void;
}

const ProfileField: React.FC<{ label: string; value: string | undefined; name: keyof User; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; isEditing: boolean; type?: string; placeholder?: string; }> = ({ label, value, name, onChange, isEditing, type = 'text', placeholder }) => (
    <div>
        <label htmlFor={name.toString()} className="label text-xs">{label}</label>
        <input 
            id={name.toString()}
            type={type}
            name={name.toString()}
            value={value || ''}
            onChange={onChange}
            disabled={!isEditing}
            placeholder={placeholder}
            className="input"
        />
    </div>
);

const PersonalProfile: React.FC<PersonalProfileProps> = ({ currentUser, onSave }) => {
  const toast = useToast();
  const { fieldSettings } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User>(currentUser);
  
  const { currentBranch, setCurrentBranch } = useAppContext();
  const { handleStartCashSession, handleCloseCashSession, cashSessions } = useFinancials();
  const { can } = useAuthorization();

  useEffect(() => {
    setFormData(currentUser);
  }, [currentUser]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const assistantTitleRegex = /^(Dr\.|Doc|Doctor)/i;
    if (formData.role === UserRole.DENTAL_ASSISTANT && assistantTitleRegex.test(formData.name)) {
        toast.error("PDA RULE 1 BLOCK: Dental Assistants may not use 'Dr.' titles.");
        return;
    }
    if (formData.role !== UserRole.ADMIN && formData.role !== UserRole.SYSTEM_ARCHITECT && !formData.licenseCategory) {
        toast.error("STATUTORY REQUIREMENT: Licensed clinical staff must select their precise statutory category.");
        return;
    }

    onSave(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(currentUser);
    setIsEditing(false);
  };

  const handleStartSession = () => {
      const balanceStr = prompt("Enter opening cash balance for today's session:");
      const balance = parseFloat(balanceStr || '0');
      if (!isNaN(balance)) {
          handleStartCashSession(balance, currentBranch);
      }
  };

  const handleCloseSession = () => {
    const session = cashSessions.find(cs => cs.branch === currentBranch && cs.status === 'Open');
    if (session) {
        handleCloseCashSession(session.id);
    }
  };
  
  const isClinicalStaff = [UserRole.DENTIST, UserRole.DENTAL_ASSISTANT].includes(formData.role);
  const isDentist = formData.role === UserRole.DENTIST;

  const userAllowedBranches = can('manage:admin')
      ? (fieldSettings.branches || []) 
      : (currentUser.allowedBranches && currentUser.allowedBranches.length > 0)
          ? currentUser.allowedBranches
          : (fieldSettings.branches || []);

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter leading-none">Personal Profile</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-2">Manage your professional identity and session controls.</p>
        </div>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-teal-900/40 btn-tactile">
            <Edit size={14}/> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleCancel} className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest btn-tactile">
              <X size={14}/> Cancel
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-teal-900/40 btn-tactile">
              <Save size={14}/> Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="Full Legal Name" name="name" value={formData.name} onChange={handleChange} isEditing={isEditing} />
          <div>
            <label className="label text-sm">Role</label>
            <div className="input bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{formData.role}</div>
          </div>
        </div>
        
        {isClinicalStaff && (
          <div className="space-y-8 pt-8 border-t border-slate-200 dark:border-slate-700">
            <h4 className="label text-sm flex items-center gap-2"><Shield size={16}/> Professional Verification</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="md:col-span-2">
                    <label htmlFor="license-category" className="label text-xs">Statutory License Category *</label>
                    <select id="license-category" name="licenseCategory" value={formData.licenseCategory || ''} onChange={handleChange} disabled={!isEditing} className="input">
                        <option value="">- SELECT SCOPE (RA 9484) -</option>
                        <option value="DENTIST">LICENSED DENTIST</option>
                        <option value="HYGIENIST">LICENSED DENTAL HYGIENIST</option>
                        <option value="TECHNOLOGIST">LICENSED DENTAL TECHNOLOGIST</option>
                    </select>
                </div>
                <ProfileField label="PRC Registered License" name="prcLicense" value={formData.prcLicense} onChange={handleChange} isEditing={isEditing} placeholder="XXXXXXX" />
                <ProfileField label="License Expiry" name="prcExpiry" value={formData.prcExpiry} onChange={handleChange} isEditing={isEditing} type="date" />
                <ProfileField label="PTR Number" name="ptrNumber" value={formData.ptrNumber} onChange={handleChange} isEditing={isEditing} placeholder="PTR-XXXXXX" />
                <ProfileField label="Specialization" name="specialization" value={formData.specialization} onChange={handleChange} isEditing={isEditing} placeholder="e.g. General Dentistry"/>
                <ProfileField label="Malpractice Policy #" name="malpracticePolicy" value={formData.malpracticePolicy} onChange={handleChange} isEditing={isEditing} placeholder="MP-2024-XXXX"/>
                <ProfileField label="Malpractice Insurance Expiry" name="malpracticeExpiry" value={formData.malpracticeExpiry} onChange={handleChange} isEditing={isEditing} type="date" />
                
                {isDentist && (
                    <div className="md:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Prescriber's Information (S2)</h5>
                        <div className="grid grid-cols-2 gap-6">
                            <ProfileField label="S2 License #" name="s2License" value={formData.s2License} onChange={handleChange} isEditing={isEditing} placeholder="PDEA-S2-XXXX"/>
                            <ProfileField label="S2 Expiry" name="s2Expiry" value={formData.s2Expiry} onChange={handleChange} isEditing={isEditing} type="date"/>
                        </div>
                    </div>
                )}
                
                {isDentist && (
                    <div className="md:col-span-2">
                        <label htmlFor="commissionRate" className="label text-xs flex items-center gap-1"><Percent size={10}/> Contracted Fee Split Rate</label>
                        <input id="commissionRate" type="number" step="0.01" name="commissionRate" value={formData.commissionRate || 0} onChange={handleChange} disabled={!isEditing} className="input" placeholder="0.30"/>
                    </div>
                )}
            </div>
          </div>
        )}
        
         <div className="space-y-4 pt-8 border-t border-slate-200 dark:border-slate-700">
            <h4 className="label text-sm flex items-center gap-2"><Sparkles size={16}/> Interface Preferences</h4>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-700 p-4 rounded-xl">
                <div>
                    <h4 className="font-bold text-text-primary">Show Digital Docent</h4>
                    <p className="text-xs text-text-secondary">Show AI-powered help icons and panel.</p>
                </div>
                <div className="relative">
                    <input 
                        type="checkbox" 
                        id="user-docent-toggle"
                        checked={formData.showDigitalDocent ?? fieldSettings.features.enableDigitalDocent}
                        onChange={e => setFormData({...formData, showDigitalDocent: e.target.checked })}
                        disabled={!isEditing}
                        className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-slate-200 rounded-full peer-checked:bg-teal-600 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                </div>
            </div>
          </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <h4 className="label text-sm flex items-center gap-2"><MapPin size={16}/> Session & Location</h4>
          
          <div>
              <label htmlFor="branch-select" className="label text-xs">Registry Location</label>
              <select id="branch-select" aria-label="Switch branch location" value={currentBranch} onChange={(e) => setCurrentBranch(e.target.value)} className="input">
                  {userAllowedBranches.map(b => (<option key={b} value={b}>{b}</option>))}
              </select>
          </div>

          {can('manage:day-session') && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="label text-xs">Day Session Controls</h4>
                  <div className="grid grid-cols-2 gap-3">
                      <button onClick={handleStartSession} className="w-full flex items-center space-x-2 px-4 py-3 rounded-xl bg-green-100 text-green-800 hover:bg-green-200 transition-all focus:ring-offset-2 active:scale-95 group">
                          <Power size={16} />
                          <span className="font-black uppercase tracking-widest text-xs">Start of Day</span>
                      </button>
                      <button onClick={handleCloseSession} className="w-full flex items-center space-x-2 px-4 py-3 rounded-xl bg-red-100 text-red-800 hover:bg-red-200 transition-all focus:ring-offset-2 active:scale-95 group">
                          <PowerOff size={16} />
                          <span className="font-black uppercase tracking-widest text-xs">End of Day</span>
                      </button>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default PersonalProfile;
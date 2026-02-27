
import React, { useState, useEffect } from 'react';
import { User, UserRole, LicenseCategory, CpdEntry } from '../types';
import { Save, Edit, X, Shield, Percent, Sparkles, MapPin, Power, PowerOff, Briefcase, GraduationCap, CheckCircle } from 'lucide-react';
import { useToast } from './ToastSystem';
import { useSettings } from '../contexts/SettingsContext';
import { useAppContext } from '../contexts/AppContext';
import { useFinancials } from '../contexts/FinancialContext';
import { useAuthorization } from '../hooks/useAuthorization';
import { formatDate } from '../constants';
import { useModal } from '../contexts/ModalContext';

interface PersonalProfileProps {
  currentUser: User;
  onSave: (updatedUser: User) => void;
}

const ProfileField: React.FC<{ label: string; value: string | undefined | number; name: keyof User; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; isEditing: boolean; type?: string; placeholder?: string; step?: string; }> = ({ label, value, name, onChange, isEditing, type = 'text', placeholder, step }) => (
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
            step={step}
            className="input"
        />
    </div>
);

const PersonalProfile: React.FC<PersonalProfileProps> = ({ currentUser, onSave }) => {
  const toast = useToast();
  const { showModal } = useModal();
  const { fieldSettings } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User>(currentUser);
  
  const [newCpdTitle, setNewCpdTitle] = useState('');
  const [newCpdUnits, setNewCpdUnits] = useState('');

  const { currentBranch, setCurrentBranch } = useAppContext();
  const { handleStartCashSession, handleCloseCashSession, cashSessions } = useFinancials();
  const { can } = useAuthorization();

  useEffect(() => {
    setFormData(currentUser);
  }, [currentUser]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      let finalValue: any = value;
      if (type === 'number') {
        finalValue = value === '' ? null : parseFloat(value);
      }
      setFormData(prev => ({ ...prev, [name]: finalValue }));
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
      showModal('prompt', {
          title: 'Start Cash Session',
          message: "Enter opening cash balance for today's session:",
          onConfirm: (balanceStr: string) => {
              const balance = parseFloat(balanceStr || '0');
              if (!isNaN(balance)) {
                  handleStartCashSession(balance, currentBranch);
              }
          }
      });
  };

  const handleCloseSession = () => {
    const session = cashSessions.find(cs => cs.branch === currentBranch && cs.status === 'Open');
    if (session) {
        handleCloseCashSession(session.id);
    }
  };
  
  const isClinicalStaff = [UserRole.DENTIST, UserRole.DENTAL_ASSISTANT, UserRole.SYSTEM_ARCHITECT].includes(formData.role);
  const isDentist = formData.role === UserRole.DENTIST;

  const userAllowedBranches = can('manage:admin')
      ? (fieldSettings.branches || []) 
      : (currentUser.allowedBranches && currentUser.allowedBranches.length > 0)
          ? currentUser.allowedBranches
          : (fieldSettings.branches || []);

  const totalCpd = (formData.cpdEntries || []).reduce((s, e) => s + e.units, 0);
  const requiredCpd = formData.requiredCpdUnits || 15;
  const cpdProgress = Math.min(100, (totalCpd / requiredCpd) * 100);

  const addCpd = () => {
      if (!newCpdTitle || !newCpdUnits) return;
      const entry: CpdEntry = { id: `cpd_${Date.now()}`, date: new Date().toISOString().split('T')[0], title: newCpdTitle, units: parseFloat(newCpdUnits) };
      setFormData(prev => ({ ...prev, cpdEntries: [entry, ...(prev.cpdEntries || [])] }));
      setNewCpdTitle(''); setNewCpdUnits('');
  };

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
        <div className="grid grid-cols-1 landscape:grid-cols-2 gap-6">
          <ProfileField label="Full Legal Name" name="name" value={formData.name} onChange={handleChange} isEditing={isEditing} />
          <div>
            <label className="label text-sm">Role</label>
            <div className="input bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{formData.role}</div>
          </div>
        </div>
        
        {isClinicalStaff && (
          <div className="space-y-8 pt-8 border-t border-slate-200 dark:border-slate-700">
            <h4 className="label text-sm flex items-center gap-2"><Shield size={16}/> Professional Verification</h4>
            
            <div className="grid grid-cols-1 landscape:grid-cols-2 gap-6">
                 <div className="landscape:col-span-2">
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
                
                {(isDentist || formData.role === UserRole.SYSTEM_ARCHITECT) && (
                    <div className="landscape:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Prescriber's Information (S2)</h5>
                        <div className="grid grid-cols-2 gap-6">
                            <ProfileField label="S2 License #" name="s2License" value={formData.s2License} onChange={handleChange} isEditing={isEditing} placeholder="PDEA-S2-XXXX"/>
                            <ProfileField label="S2 Expiry" name="s2Expiry" value={formData.s2Expiry} onChange={handleChange} isEditing={isEditing} type="date"/>
                        </div>
                    </div>
                )}
            </div>
          </div>
        )}

        <div className="space-y-8 pt-8 border-t border-slate-200 dark:border-slate-700">
            <h4 className="label text-sm flex items-center gap-2"><Briefcase size={16}/> Administrative Details</h4>
            <div className="grid grid-cols-1 landscape:grid-cols-2 gap-6">
                <ProfileField label="TIN (Tax Identification Number)" name="tin" value={formData.tin} onChange={handleChange} isEditing={isEditing} placeholder="XXX-XXX-XXX-000" />
                <ProfileField label="Payout Handle" name="payoutHandle" value={formData.payoutHandle} onChange={handleChange} isEditing={isEditing} placeholder="e.g., GCash Number or Bank Account" />
                {(isDentist || formData.role === UserRole.SYSTEM_ARCHITECT) && (
                    <div className="landscape:col-span-2">
                        <ProfileField 
                            label="Contracted Fee Split Rate" 
                            name="commissionRate" 
                            value={formData.commissionRate} 
                            onChange={handleChange} 
                            isEditing={isEditing} 
                            type="number" 
                            step="0.01" 
                            placeholder="e.g., 0.40 for 40%"
                        />
                    </div>
                )}
            </div>
        </div>

        <div className="space-y-8 pt-8 border-t border-slate-200 dark:border-slate-700">
            <h4 className="label text-sm flex items-center gap-2"><GraduationCap size={16}/> CPD Tracking</h4>
            <div className="bg-bg-secondary p-6 rounded-2xl border border-teal-100 dark:border-teal-900 shadow-sm text-center">
                <div className="text-[10px] font-black uppercase text-text-secondary tracking-widest mb-4">PRC Renewal Readiness</div>
                <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-700" />
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * cpdProgress) / 100} className={`${cpdProgress >= 100 ? 'text-teal-700' : 'text-lilac-500'} transition-all duration-1000`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-2xl font-black text-text-primary">{totalCpd}</div>
                        <div className="text-[9px] font-bold text-text-secondary uppercase">Units of {requiredCpd}</div>
                    </div>
                </div>
                {cpdProgress >= 100 && <div className="mt-4 text-xs font-bold text-teal-700 flex items-center justify-center gap-1 uppercase"><CheckCircle size={14}/> Compliant for Renewal</div>}
            </div>
            {isEditing && (
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="label text-xs flex items-center gap-2">Log Professional Education</h4>
                    <input id="cpd-title" type="text" placeholder="Course/Seminar Title" className="input" value={newCpdTitle} onChange={e => setNewCpdTitle(e.target.value)} />
                    <div className="flex gap-2">
                        <input id="cpd-units" type="number" placeholder="Units" className="input flex-1" value={newCpdUnits} onChange={e => setNewCpdUnits(e.target.value)} />
                        <button onClick={addCpd} className="bg-teal-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-teal-700 transition-all focus:ring-offset-2">Add</button>
                    </div>
                </div>
            )}
             <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {(formData.cpdEntries || []).map(entry => (
                    <div key={entry.id} className="p-3 bg-bg-secondary border border-border-primary rounded-xl flex justify-between items-center group">
                        <div><div className="font-bold text-sm text-text-primary">{entry.title}</div><div className="text-[10px] text-text-secondary font-bold uppercase">{formatDate(entry.date)}</div></div>
                        <span className="text-sm font-black text-teal-700">+{entry.units}</span>
                    </div>
                ))}
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

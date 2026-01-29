
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

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const toast = useToast();
  const { fieldSettings } = useSettings();
  const { theme, toggleTheme } = useAppContext();

  const [activeTab, setActiveTab] = useState<'profile' | 'cpd'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User>(user);
  
  const [newCpdTitle, setNewCpdTitle] = useState('');
  const [newCpdUnits, setNewCpdUnits] = useState('');

  useEffect(() => {
    setFormData(user);
    setIsEditing(false);
  }, [user, isOpen]);

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };

  const handleValidationSave = () => {
      // --- PDA RULE 1: TITLE ENFORCEMENT ---
      const assistantTitleRegex = /^(Dr\.|Doc|Doctor)/i;
      if (formData.role === UserRole.DENTAL_ASSISTANT && assistantTitleRegex.test(formData.name)) {
          toast.error("PDA RULE 1 BLOCK: Dental Assistants may not use 'Dr.' titles. Professional registry requires dignified and accurate title usage.");
          return;
      }

      // --- RA 9484 ARTICLE III, SECTION 25: CATEGORY MANDATE ---
      if (formData.role !== UserRole.ADMIN && !formData.licenseCategory) {
          toast.error("STATUTORY REQUIREMENT: Licensed clinical staff must select their precise statutory category (Article III, Section 25).");
          return;
      }

      if (onSave) onSave(formData);
      setIsEditing(false);
  };

  if (!isOpen || !fieldSettings) return null;

  const totalCpd = (formData.cpdEntries || []).reduce((s, e) => s + e.units, 0);
  const requiredCpd = formData.requiredCpdUnits || 15;
  const cpdProgress = Math.min(100, (totalCpd / requiredCpd) * 100);

  const addCpd = () => {
      if (!newCpdTitle || !newCpdUnits) return;
      const entry: CpdEntry = { id: `cpd_${Date.now()}`, date: new Date().toISOString().split('T')[0], title: newCpdTitle, units: parseFloat(newCpdUnits) };
      setFormData(prev => ({ ...prev, cpdEntries: [entry, ...(prev.cpdEntries || [])] }));
      setNewCpdTitle(''); setNewCpdUnits('');
  };
  
  const handleDocentToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, showDigitalDocent: e.target.checked }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-[90vh]">
        
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

        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50" role="tablist">
            <button role="tab" aria-selected={activeTab === 'profile'} onClick={() => setActiveTab('profile')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all focus:ring-offset-2 ${activeTab === 'profile' ? 'text-teal-700 border-b-2 border-teal-700 bg-white dark:bg-slate-900' : 'text-slate-500'}`}>Security Profile</button>
            <button role="tab" aria-selected={activeTab === 'cpd'} onClick={() => setActiveTab('cpd')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all focus:ring-offset-2 ${activeTab === 'cpd' ? 'text-teal-700 border-b-2 border-teal-700 bg-white dark:bg-slate-900' : 'text-slate-500'}`}>CPD Tracking</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-bg-tertiary">
            {activeTab === 'profile' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-bg-secondary p-6 rounded-[2rem] border border-border-primary shadow-inner">
                        <div className="flex items-center gap-3 text-teal-800 dark:text-teal-300 font-black uppercase text-xs tracking-widest border-b border-border-secondary pb-3 mb-4">
                            <Shield size={20} /> Professional Verification
                        </div>
                        <div className="space-y-4">
                            {formData.role !== UserRole.ADMIN && (
                                <div>
                                    <label htmlFor="license-category" className="label text-xs">Statutory License Category *</label>
                                    <select 
                                        id="license-category"
                                        value={formData.licenseCategory || ''} 
                                        onChange={e => setFormData({...formData, licenseCategory: e.target.value as LicenseCategory})}
                                        disabled={!isEditing}
                                        className={`w-full input ${!isEditing ? 'disabled:opacity-100' : ''} ${!formData.licenseCategory ? 'border-red-300 bg-red-50 text-red-900 animate-pulse' : ''}`}
                                    >
                                        <option value="">- SELECT SCOPE (RA 9484) -</option>
                                        <option value="DENTIST">LICENSED DENTIST</option>
                                        <option value="HYGIENIST">LICENSED DENTAL HYGIENIST</option>
                                        <option value="TECHNOLOGIST">LICENSED DENTAL TECHNOLOGIST</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label htmlFor="prc-license" className="label text-xs">PRC Registered License</label>
                                <input 
                                    id="prc-license"
                                    type="text" 
                                    value={formData.prcLicense || ''} 
                                    onChange={e => setFormData({...formData, prcLicense: e.target.value})}
                                    disabled={!isEditing}
                                    className="input font-mono"
                                    placeholder="XXXXXXX"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="prc-expiry" className="label text-xs">License Expiry</label>
                                    <input 
                                        id="prc-expiry"
                                        type="date" 
                                        value={formData.prcExpiry || ''} 
                                        onChange={e => setFormData({...formData, prcExpiry: e.target.value})}
                                        disabled={!isEditing}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="ptr-number" className="label text-xs">PTR Number</label>
                                    <input 
                                        id="ptr-number"
                                        type="text" 
                                        value={formData.ptrNumber || ''} 
                                        onChange={e => setFormData({...formData, ptrNumber: e.target.value})}
                                        disabled={!isEditing}
                                        className="input font-mono"
                                        placeholder="PTR-XXXXXX"
                                    />
                                </div>
                            </div>

                            {formData.role === UserRole.DENTIST && (
                                <div className="pt-4 border-t border-border-secondary">
                                    <label htmlFor="commission-rate" className="label text-xs flex items-center gap-1"><Percent size={10}/> Contracted Fee Split Rate</label>
                                    <input 
                                        id="commission-rate"
                                        type="number"
                                        step="0.01"
                                        value={formData.commissionRate || 0}
                                        onChange={e => setFormData({...formData, commissionRate: parseFloat(e.target.value)})}
                                        disabled={!isEditing}
                                        className="input"
                                        placeholder="0.30"
                                    />
                                </div>
                            )}

                            <div>
                                <label htmlFor="malpractice-expiry" className="label text-xs">Malpractice Insurance Expiry</label>
                                <input 
                                    id="malpractice-expiry"
                                    type="date" 
                                    value={formData.malpracticeExpiry || ''} 
                                    onChange={e => setFormData({...formData, malpracticeExpiry: e.target.value})}
                                    disabled={!isEditing}
                                    className="input"
                                />
                            </div>
                        </div>
                    </div>

                     <div className="bg-bg-secondary p-6 rounded-[2rem] border border-border-primary shadow-inner">
                        <div className="flex items-center gap-3 text-lilac-800 dark:text-lilac-300 font-black uppercase text-xs tracking-widest border-b border-border-secondary pb-3 mb-4">
                            <Sparkles size={20} /> Interface Preferences
                        </div>
                         <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-text-primary">Interface Theme</h4>
                                    <p className="text-xs text-text-secondary">Switch between light and dark mode.</p>
                                </div>
                                <div className="relative">
                                    <input type="checkbox" id="theme-toggle-profile" checked={theme === 'dark'} onChange={toggleTheme} className="sr-only peer"/>
                                    <div className="w-14 h-8 bg-slate-200 dark:bg-slate-700 rounded-full peer-checked:bg-teal-600 transition-colors"></div>
                                    <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-text-primary">Show Digital Docent</h4>
                                    <p className="text-xs text-text-secondary">Show AI-powered help icons and panel.</p>
                                </div>
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        id="user-docent-toggle"
                                        checked={formData.showDigitalDocent ?? fieldSettings.features.enableDigitalDocent}
                                        onChange={handleDocentToggle}
                                        className="sr-only peer"
                                        disabled={!isEditing}
                                    />
                                    <div className="w-14 h-8 bg-slate-200 dark:bg-slate-700 rounded-full peer-checked:bg-teal-600 transition-colors peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                                    <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6 peer-disabled:cursor-not-allowed"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'cpd' && (
                <div className="space-y-6 animate-in fade-in duration-300">
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

                    <div className="bg-bg-secondary p-4 rounded-xl border border-border-primary space-y-3">
                        <h4 className="label text-xs flex items-center gap-2"><GraduationCap size={16}/> Log Professional Education</h4>
                        <input id="cpd-title" type="text" placeholder="Course/Seminar Title" className="input" value={newCpdTitle} onChange={e => setNewCpdTitle(e.target.value)} />
                        <div className="flex gap-2">
                            <input id="cpd-units" type="number" placeholder="Units" className="input flex-1" value={newCpdUnits} onChange={e => setNewCpdUnits(e.target.value)} />
                            <button onClick={addCpd} className="bg-teal-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-teal-700 transition-all focus:ring-offset-2">Add</button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {(formData.cpdEntries || []).map(entry => (
                            <div key={entry.id} className="p-3 bg-bg-secondary border border-border-primary rounded-xl flex justify-between items-center group">
                                <div><div className="font-bold text-sm text-text-primary">{entry.title}</div><div className="text-[10px] text-text-secondary font-bold uppercase">{formatDate(entry.date)}</div></div>
                                <span className="text-sm font-black text-teal-700">+{entry.units}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
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

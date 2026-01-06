
import React, { useState, useEffect } from 'react';
import { User, UserRole, FieldSettings, UserPreferences, CpdEntry, LicenseCategory } from '../types';
import { X, Shield, Award, Calendar, Briefcase, CreditCard, Activity, Settings, MapPin, DollarSign, Lock, Server, Edit2, Save, RotateCcw, Sliders, Eye, Plus, Trash2, CheckCircle, GraduationCap, AlertCircle, Percent } from 'lucide-react';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';

interface UserProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedUser: User) => void;
  fieldSettings?: FieldSettings; 
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, isOpen, onClose, onSave, fieldSettings }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'cpd'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User>(user);
  
  const [newCpdTitle, setNewCpdTitle] = useState('');
  const [newCpdUnits, setNewCpdUnits] = useState('');

  useEffect(() => {
    setFormData(user);
    setIsEditing(false);
  }, [user, isOpen]);

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
      onClose();
  };

  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-[90vh]">
        
        <div className="bg-teal-900 text-white p-6 relative shrink-0">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full border-4 border-teal-600 shadow-xl mb-4 bg-white relative group">
                <img src={formData.avatar} alt={formData.name} className="w-full h-full rounded-full object-cover" />
                <div className="absolute bottom-0 right-0">
                    <input 
                        type="color" 
                        name="colorPreference" 
                        value={formData.colorPreference || '#0d9488'} 
                        onChange={e => setFormData({...formData, colorPreference: e.target.value})} 
                        className="w-8 h-8 rounded-full border-2 border-white cursor-pointer p-0 shadow-lg focus:ring-offset-2"
                        aria-label="Brand Color Preference"
                    />
                </div>
            </div>
            
            <div className="w-full">
                <label htmlFor="profile-name" className="sr-only">Full Legal Name</label>
                <input 
                    id="profile-name"
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="bg-transparent border-b-2 border-white/20 focus:border-teal-400 text-2xl font-black text-center text-white outline-none w-full px-2"
                    placeholder="Enter Full Legal Name"
                />
            </div>
            
            <div className="flex items-center gap-2 mt-2">
                <span className="bg-teal-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-teal-600">{formData.role}</span>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close Profile" className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors focus:ring-offset-2"><X size={20} /></button>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50" role="tablist">
            <button role="tab" aria-selected={activeTab === 'profile'} onClick={() => setActiveTab('profile')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all focus:ring-offset-2 ${activeTab === 'profile' ? 'text-teal-700 border-b-2 border-teal-700 bg-white' : 'text-slate-500'}`}>Security Profile</button>
            <button role="tab" aria-selected={activeTab === 'cpd'} onClick={() => setActiveTab('cpd')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all focus:ring-offset-2 ${activeTab === 'cpd' ? 'text-teal-700 border-b-2 border-teal-700 bg-white' : 'text-slate-500'}`}>CPD Tracking</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'profile' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 shadow-inner">
                        <div className="flex items-center gap-3 text-teal-800 font-black uppercase text-xs tracking-widest border-b border-slate-200 pb-3 mb-4">
                            <Shield size={20} /> Professional Verification
                        </div>
                        <div className="space-y-4">
                            {formData.role !== UserRole.ADMIN && (
                                <div>
                                    <label htmlFor="license-category" className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Statutory License Category *</label>
                                    <select 
                                        id="license-category"
                                        value={formData.licenseCategory || ''} 
                                        onChange={e => setFormData({...formData, licenseCategory: e.target.value as LicenseCategory})}
                                        className={`w-full p-3 border-2 rounded-xl text-sm font-black outline-none transition-all ${!formData.licenseCategory ? 'border-red-300 bg-red-50 text-red-900 animate-pulse' : 'border-slate-100 bg-white focus:border-teal-700'}`}
                                    >
                                        <option value="">- SELECT SCOPE (RA 9484) -</option>
                                        <option value="DENTIST">LICENSED DENTIST</option>
                                        <option value="HYGIENIST">LICENSED DENTAL HYGIENIST</option>
                                        <option value="TECHNOLOGIST">LICENSED DENTAL TECHNOLOGIST</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label htmlFor="prc-license" className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">PRC Registered License</label>
                                <input 
                                    id="prc-license"
                                    type="text" 
                                    value={formData.prcLicense || ''} 
                                    onChange={e => setFormData({...formData, prcLicense: e.target.value})}
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-mono font-bold text-sm outline-none focus:border-teal-700"
                                    placeholder="XXXXXXX"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="prc-expiry" className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">License Expiry</label>
                                    <input 
                                        id="prc-expiry"
                                        type="date" 
                                        value={formData.prcExpiry || ''} 
                                        onChange={e => setFormData({...formData, prcExpiry: e.target.value})}
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-700"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="ptr-number" className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">PTR Number</label>
                                    <input 
                                        id="ptr-number"
                                        type="text" 
                                        value={formData.ptrNumber || ''} 
                                        onChange={e => setFormData({...formData, ptrNumber: e.target.value})}
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-mono text-sm outline-none focus:border-teal-700"
                                        placeholder="PTR-XXXXXX"
                                    />
                                </div>
                            </div>

                            {/* --- COMMISSION RATE FIELD (Rule 21 Restriction) --- */}
                            {formData.role === UserRole.DENTIST && (
                                <div className="pt-4 border-t border-slate-200">
                                    <label htmlFor="commission-rate" className="text-[9px] font-black text-teal-800 uppercase tracking-widest ml-1 mb-1 block flex items-center gap-1"><Percent size={10}/> Contracted Fee Split Rate</label>
                                    <input 
                                        id="commission-rate"
                                        type="number"
                                        step="0.01"
                                        value={formData.commissionRate || 0}
                                        onChange={e => setFormData({...formData, commissionRate: parseFloat(e.target.value)})}
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-teal-700"
                                        placeholder="0.30"
                                    />
                                    <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Percentage split for clinical production attribution.</p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="malpractice-expiry" className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Malpractice Insurance Expiry</label>
                                <input 
                                    id="malpractice-expiry"
                                    type="date" 
                                    value={formData.malpracticeExpiry || ''} 
                                    onChange={e => setFormData({...formData, malpracticeExpiry: e.target.value})}
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-700"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl flex items-start gap-3">
                        <AlertCircle size={18} className="text-teal-700 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-teal-900 font-medium leading-relaxed">
                            <strong>Note on Identity Registry:</strong> Changes to license categories and split rates are logged for statutory clinical attribution as per RA 9484.
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'cpd' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="bg-white p-6 rounded-2xl border border-teal-100 shadow-sm text-center">
                        <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">PRC Renewal Readiness</div>
                        <div className="relative w-32 h-32 mx-auto">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * cpdProgress) / 100} className={`${cpdProgress >= 100 ? 'text-teal-700' : 'text-lilac-500'} transition-all duration-1000`} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-2xl font-black text-slate-800">{totalCpd}</div>
                                <div className="text-[9px] font-bold text-slate-500 uppercase">Units of {requiredCpd}</div>
                            </div>
                        </div>
                        {cpdProgress >= 100 && <div className="mt-4 text-xs font-bold text-teal-700 flex items-center justify-center gap-1 uppercase"><CheckCircle size={14}/> Compliant for Renewal</div>}
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2"><GraduationCap size={16}/> Log Professional Education</h4>
                        <label htmlFor="cpd-title" className="sr-only">Course Title</label>
                        <input id="cpd-title" type="text" placeholder="Course/Seminar Title" className="w-full p-2 text-sm border rounded-lg focus:border-teal-700 outline-none" value={newCpdTitle} onChange={e => setNewCpdTitle(e.target.value)} />
                        <div className="flex gap-2">
                            <label htmlFor="cpd-units" className="sr-only">CPD Units</label>
                            <input id="cpd-units" type="number" placeholder="Units" className="flex-1 p-2 text-sm border rounded-lg focus:border-teal-700 outline-none" value={newCpdUnits} onChange={e => setNewCpdUnits(e.target.value)} />
                            <button onClick={addCpd} className="bg-teal-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-teal-700 transition-all focus:ring-offset-2">Add</button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {(formData.cpdEntries || []).map(entry => (
                            <div key={entry.id} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center group">
                                <div><div className="font-bold text-sm text-slate-800">{entry.title}</div><div className="text-[10px] text-slate-500 font-bold uppercase">{entry.date}</div></div>
                                <span className="text-sm font-black text-teal-700">+{entry.units}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex gap-2 shrink-0">
            <button onClick={onClose} className="flex-1 py-4 bg-slate-50 rounded-xl font-bold text-slate-500 uppercase text-[10px] tracking-widest focus:ring-offset-2">Cancel</button>
            <button onClick={handleValidationSave} className="flex-[2] py-4 bg-teal-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-teal-600/20 hover:scale-[1.02] active:scale-95 transition-all focus:ring-offset-2">Update Secure Identity</button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;

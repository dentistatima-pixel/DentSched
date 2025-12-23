
import React, { useState, useEffect } from 'react';
import { User, UserRole, FieldSettings, UserPreferences, CpdEntry } from '../types';
import { X, Shield, Award, Calendar, Briefcase, CreditCard, Activity, Settings, MapPin, DollarSign, Lock, Server, Edit2, Save, RotateCcw, Sliders, Eye, Plus, Trash2, CheckCircle, GraduationCap, Link, LogOut } from 'lucide-react';
import { formatDate } from '../constants';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface UserProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedUser: User) => void;
  fieldSettings?: FieldSettings; 
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, isOpen, onClose, onSave, fieldSettings }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'cpd'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User>(user);
  
  const [newCpdTitle, setNewCpdTitle] = useState('');
  const [newCpdUnits, setNewCpdUnits] = useState('');

  useEffect(() => {
    setFormData(user);
    setIsEditing(false);
  }, [user, isOpen]);

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

  const handleSignOut = async () => {
      await signOut(auth);
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-[90vh]">
        
        <div className="bg-teal-900 text-white p-6 relative shrink-0">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-teal-500 shadow-xl mb-4 bg-white relative group">
                <img src={formData.avatar} alt={formData.name} className="w-full h-full rounded-full object-cover" />
                {isEditing && <div className="absolute bottom-0 right-0"><input type="color" name="colorPreference" value={formData.colorPreference || '#14b8a6'} onChange={e => setFormData({...formData, colorPreference: e.target.value})} className="w-8 h-8 rounded-full border-2 border-white cursor-pointer p-0"/></div>}
            </div>
            <h2 className="text-2xl font-bold">{formData.name}</h2>
            <div className="flex items-center gap-2 mt-1">
                <span className="bg-teal-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{formData.role}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/10">
                <CheckCircle size={10} className="text-teal-400"/>
                <span className="text-[10px] font-bold text-teal-100 uppercase truncate max-w-[150px]">{auth.currentUser?.email}</span>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50">
            <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'text-teal-700 border-b-2 border-teal-600 bg-white' : 'text-slate-400'}`}>Profile</button>
            <button onClick={() => setActiveTab('cpd')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'cpd' ? 'text-teal-700 border-b-2 border-teal-600 bg-white' : 'text-slate-400'}`}>CPD Tracker</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'profile' && (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-2 text-teal-800 font-bold border-b border-slate-200 pb-2 mb-3"><Shield size={18} /> Compliance Status</div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm"><span>PRC License:</span><span className="font-mono font-bold">{formData.prcLicense || '---'}</span></div>
                            <div className="flex justify-between text-sm"><span>S2 License:</span><span className="font-mono font-bold">{formData.s2License || '---'}</span></div>
                        </div>
                    </div>

                    <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl flex flex-col gap-3">
                        <h4 className="text-[10px] font-black text-teal-900 uppercase tracking-widest flex items-center gap-2"><Link size={14}/> Identity Verification</h4>
                        <button className="w-full py-3 bg-white border border-teal-200 text-teal-700 font-bold text-xs rounded-xl hover:bg-teal-600 hover:text-white transition-all">Link Alternative Account</button>
                    </div>

                    <button onClick={handleSignOut} className="w-full py-4 border-2 border-red-100 text-red-600 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-red-50 transition-all">
                        <LogOut size={16}/> Revoke Session & Sign Out
                    </button>
                </div>
            )}

            {activeTab === 'cpd' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="bg-white p-6 rounded-2xl border border-teal-100 shadow-sm text-center">
                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">PRC Renewal Readiness</div>
                        <div className="relative w-32 h-32 mx-auto">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * cpdProgress) / 100} className={`${cpdProgress >= 100 ? 'text-teal-600' : 'text-lilac-500'} transition-all duration-1000`} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-2xl font-black text-slate-800">{totalCpd}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase">Units of {requiredCpd}</div>
                            </div>
                        </div>
                        {cpdProgress >= 100 && <div className="mt-4 text-xs font-bold text-teal-600 flex items-center justify-center gap-1 uppercase"><CheckCircle size={14}/> Compliant for Renewal</div>}
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2"><GraduationCap size={16}/> Log Professional Education</h4>
                        <input type="text" placeholder="Course/Seminar Title" className="w-full p-2 text-sm border rounded-lg" value={newCpdTitle} onChange={e => setNewCpdTitle(e.target.value)} />
                        <div className="flex gap-2">
                            <input type="number" placeholder="Units" className="flex-1 p-2 text-sm border rounded-lg" value={newCpdUnits} onChange={e => setNewCpdUnits(e.target.value)} />
                            <button onClick={addCpd} className="bg-teal-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-teal-700 transition-all">Add</button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {(formData.cpdEntries || []).map(entry => (
                            <div key={entry.id} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center group">
                                <div><div className="font-bold text-sm text-slate-800">{entry.title}</div><div className="text-[10px] text-slate-400 font-bold uppercase">{entry.date}</div></div>
                                <span className="text-sm font-black text-teal-600">+{entry.units}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
            <button onClick={onClose} className="flex-1 py-3 bg-white border rounded-xl font-bold text-slate-600">Cancel</button>
            <button onClick={() => onSave && onSave(formData)} className="flex-[2] py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg hover:bg-teal-700">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;

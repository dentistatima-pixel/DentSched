
import React, { useState, useEffect } from 'react';
import { User, UserRole, FieldSettings, UserPreferences, ImmunizationRecord, ProfessionalCertificate } from '../types';
import { X, Shield, Award, Calendar, Briefcase, CreditCard, Activity, Settings, MapPin, DollarSign, Lock, Server, Edit2, Save, RotateCcw, Sliders, Eye, Plus, Trash2, CheckCircle, FileCheck, ExternalLink } from 'lucide-react';
import { formatDate } from '../constants';

interface UserProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedUser: User) => void;
  fieldSettings?: FieldSettings; 
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, isOpen, onClose, onSave, fieldSettings }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User>(user);
  
  // Immunization temp state
  const [newImmType, setNewImmType] = useState('Hepatitis B');
  const [newImmDate, setNewImmDate] = useState('');

  // Cert temp state
  const [newCertType, setNewCertType] = useState<ProfessionalCertificate['type']>('BLS');
  const [newCertExpiry, setNewCertExpiry] = useState('');

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

  const handlePreferenceToggle = (prefKey: keyof UserPreferences) => {
      setFormData(prev => {
          const currentPrefs = prev.preferences || {};
          return {
              ...prev,
              preferences: {
                  ...currentPrefs,
                  [prefKey]: !currentPrefs[prefKey]
              }
          };
      });
  };

  const handleBranchToggle = (branch: string) => {
      setFormData(prev => {
          const currentBranches = prev.allowedBranches || [];
          if (currentBranches.includes(branch)) {
              return { ...prev, allowedBranches: currentBranches.filter(b => b !== branch) };
          } else {
              return { ...prev, allowedBranches: [...currentBranches, branch] };
          }
      });
  };

  const addImmunization = () => {
      if (!newImmDate) return;
      const newRec: ImmunizationRecord = { type: newImmType, date: newImmDate };
      setFormData(prev => ({ ...prev, immunizations: [...(prev.immunizations || []), newRec] }));
      setNewImmDate('');
  };

  const removeImmunization = (idx: number) => {
      setFormData(prev => ({ ...prev, immunizations: (prev.immunizations || []).filter((_, i) => i !== idx) }));
  };

  const addCertificate = () => {
      if (!newCertExpiry) return;
      const newCert: ProfessionalCertificate = { type: newCertType, expiry: newCertExpiry };
      setFormData(prev => ({ ...prev, certifications: [...(prev.certifications || []), newCert] }));
      setNewCertExpiry('');
  };

  const removeCertificate = (idx: number) => {
      setFormData(prev => ({ ...prev, certifications: (prev.certifications || []).filter((_, i) => i !== idx) }));
  };

  const handleSave = () => {
      if (onSave) onSave(formData);
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

  const TogglePreference = ({ label, prefKey }: { label: string, prefKey: keyof UserPreferences }) => {
      const isEnabled = formData.preferences?.[prefKey] ?? false;
      return (
          <div className={`flex justify-between items-center p-3 rounded-lg border transition-colors ${isEnabled ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-200'}`}>
              <span className="text-sm font-bold text-slate-700">{label}</span>
              <button 
                onClick={() => handlePreferenceToggle(prefKey)}
                disabled={!isEditing}
                className={`w-10 h-6 rounded-full p-1 transition-colors flex items-center ${isEnabled ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'} ${!isEditing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                  <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
          </div>
      );
  };

  const availableBranches = fieldSettings?.branches || ['Makati Branch', 'Quezon City Branch'];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        <div className="bg-teal-900 text-white p-6 relative shrink-0">
          <div className="absolute top-4 right-4 flex gap-2">
            {!isEditing && onSave && (
                <button onClick={() => setIsEditing(true)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors" title="Edit Profile">
                    <Edit2 size={18} />
                </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-teal-500 shadow-xl mb-4 bg-white relative group">
                <img src={formData.avatar} alt={formData.name} className="w-full h-full rounded-full object-cover" />
                {isEditing && <div className="absolute bottom-0 right-0"><input type="color" name="colorPreference" value={formData.colorPreference || '#14b8a6'} onChange={handleChange} className="w-8 h-8 rounded-full border-2 border-white shadow-md cursor-pointer overflow-hidden p-0"/></div>}
            </div>
            {isEditing ? <input type="text" name="name" value={formData.name} onChange={handleChange} className="text-xl font-bold text-center text-teal-900 rounded px-2 py-1 mb-1 w-full"/> : <h2 className="text-2xl font-bold">{formData.name}</h2>}
            <div className="flex items-center gap-2 mt-1">
                <span className="bg-teal-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{formData.role}</span>
                {isEditing ? <input type="text" name="specialization" value={formData.specialization || ''} onChange={handleChange} placeholder="Specialization" className="bg-white/10 border border-white/30 text-white px-2 py-0.5 rounded text-xs w-32"/> : formData.specialization && <span className="bg-lilac-600 px-3 py-1 rounded-full text-xs font-bold">{formData.specialization}</span>}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
            
            {/* DOH MANDATORY CREDENTIALS */}
            <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                 <div className="flex items-center gap-2 text-teal-800 font-bold border-b border-teal-200 pb-2 mb-3 text-sm">
                    <FileCheck size={18} /> DOH LTO Certifications
                </div>
                <div className="space-y-2">
                    {(formData.certifications || []).map((cert, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-teal-100 text-xs">
                            <div>
                                <span className="font-bold text-teal-900">{cert.type} Certification</span>
                                <div className={`font-bold mt-0.5 ${new Date(cert.expiry) < new Date() ? 'text-red-600' : 'text-slate-400'}`}>Expiry: {formatDate(cert.expiry)}</div>
                            </div>
                            {isEditing && <button onClick={() => removeCertificate(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>}
                        </div>
                    ))}
                    {isEditing && (
                        <div className="mt-3 pt-3 border-t border-teal-200 space-y-2">
                             <select value={newCertType} onChange={e => setNewCertType(e.target.value as any)} className="w-full p-2 text-[10px] border rounded-lg uppercase font-bold">
                                <option>BLS</option><option>Infection Control</option><option>Radiation Safety</option><option>Other</option>
                            </select>
                            <div className="flex gap-2">
                                <input type="date" value={newCertExpiry} onChange={e => setNewCertExpiry(e.target.value)} className="flex-1 p-2 text-xs border rounded-lg" />
                                <button onClick={addCertificate} className="bg-teal-600 text-white p-2 rounded-lg"><Plus size={14}/></button>
                            </div>
                        </div>
                    )}
                    {(!formData.certifications || formData.certifications.length === 0) && !isEditing && <p className="text-[10px] text-slate-400 italic text-center py-2">No LTO certs registered. Mandatory for renewal.</p>}
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-200 pb-2 mb-3 text-sm">
                    <CheckCircle size={18} /> Staff Immunization Record
                </div>
                <div className="space-y-2">
                    {(formData.immunizations || []).map((imm, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 text-xs">
                            <div><span className="font-bold text-slate-700">{imm.type}</span><div className="text-[10px] text-slate-400 font-bold uppercase">Date: {formatDate(imm.date)}</div></div>
                            {isEditing && <button onClick={() => removeImmunization(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>}
                        </div>
                    ))}
                    {isEditing && (
                        <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                            <select value={newImmType} onChange={e => setNewImmType(e.target.value)} className="w-full p-2 text-[10px] border rounded-lg font-bold">
                                <option>Hepatitis B</option><option>Influenza</option><option>COVID-19</option><option>Other</option>
                            </select>
                            <div className="flex gap-2">
                                <input type="date" value={newImmDate} onChange={e => setNewImmDate(e.target.value)} className="flex-1 p-2 text-xs border rounded-lg" />
                                <button onClick={addImmunization} className="bg-teal-600 text-white p-2 rounded-lg"><Plus size={14}/></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div>
                 <div className="flex items-center gap-2 text-teal-800 font-bold border-b border-slate-100 pb-2 mb-3 text-sm">
                    <Sliders size={18} /> Workflow Preferences
                </div>
                <div className="grid grid-cols-1 gap-2">
                    <TogglePreference label="Show Lab Case Alerts" prefKey="showLabAlerts" />
                    <TogglePreference label="Auto-Open Medical History" prefKey="autoOpenMedicalHistory" />
                    {(formData.role === UserRole.DENTIST || formData.role === UserRole.ADMIN) && (
                        <TogglePreference label="Show Financial Goals" prefKey="showFinancials" />
                    )}
                </div>
            </div>

            <div>
                 <div className="flex items-center gap-2 text-teal-800 font-bold border-b border-slate-100 pb-2 mb-3 text-sm">
                    <Settings size={18} /> Professional Details
                </div>
                {isEditing ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Practice Locations</label>
                            <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                {availableBranches.map(branch => (
                                    <label key={branch} className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={(formData.allowedBranches || []).includes(branch)} onChange={() => handleBranchToggle(branch)} className="w-4 h-4 accent-teal-600 rounded"/>
                                        <span className="text-sm font-medium text-slate-700">{branch}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Default Branch</label><select name="defaultBranch" value={formData.defaultBranch || ''} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-teal-500 outline-none bg-white">{(formData.allowedBranches || []).map(b => (<option key={b} value={b}>{b}</option>))}</select></div>
                            {(formData.role === UserRole.DENTIST || formData.role === UserRole.ADMIN) && <InputField label="Consult Fee (₱)" name="defaultConsultationFee" value={formData.defaultConsultationFee} type="number" />}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100"><span className="block text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><MapPin size={10}/> Branch Privileges</span><div className="flex flex-wrap gap-1">{(formData.allowedBranches || []).length > 0 ? formData.allowedBranches?.map(b => (<span key={b} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">{b}</span>)) : <span className="text-xs font-bold text-slate-800">{formData.defaultBranch || 'Main Office'}</span>}</div></div>
                    </div>
                )}
            </div>

            {(formData.role === UserRole.DENTIST || formData.role === UserRole.ADMIN) && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-teal-800 font-bold border-b border-slate-100 pb-2 text-sm"><Shield size={18} /> Compliance Licenses</div>
                    {isEditing ? (
                        <>
                            <div className="grid grid-cols-2 gap-4"><InputField label="PRC License" name="prcLicense" value={formData.prcLicense} /><InputField label="Valid Until" name="prcExpiry" value={formData.prcExpiry} type="date" /></div>
                            <div className="grid grid-cols-2 gap-4"><InputField label="PTR Number" name="ptrNumber" value={formData.ptrNumber} /><InputField label="TIN" name="tin" value={formData.tin} /></div>
                            <div className="grid grid-cols-2 gap-4"><InputField label="S2 License" name="s2License" value={formData.s2License} /><InputField label="PDA Chapter" name="pdaChapter" value={formData.pdaChapter} /></div>
                        </>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                            <div className="bg-slate-50 p-3 rounded-lg"><span className="block text-slate-500 font-bold uppercase">PRC License</span><span className="font-mono font-bold text-slate-800 text-sm">{formData.prcLicense || '---'}</span></div>
                            <div className="bg-slate-50 p-3 rounded-lg"><span className="block text-slate-500 font-bold uppercase">PTR Number</span><span className="font-mono font-bold text-slate-800 text-sm">{formData.ptrNumber || '---'}</span></div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {isEditing && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3 animate-in slide-in-from-bottom-2">
                <button onClick={handleCancel} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-sm"><RotateCcw size={18} /> Cancel</button>
                <button onClick={handleSave} className="flex-[2] py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 text-sm"><Save size={18} /> Save Changes</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;

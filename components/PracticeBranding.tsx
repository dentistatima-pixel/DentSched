
import React, { useState, useEffect, useMemo } from 'react';
import { FieldSettings, HospitalAffiliation, Branch, OperationalHours, DaySchedule } from '../types';
import { Sparkles, Save, Sun, Moon, MapPin, Building2, Plus, Trash2, X, Edit, Monitor, Languages, Loader2 } from 'lucide-react';
import { useToast } from './ToastSystem';
import { useAppContext } from '../contexts/AppContext';
import { useModal } from '../contexts/ModalContext';
import { translateToTagalog } from '../services/geminiService';

interface BranchEditorModalProps {
    branch: Partial<Branch> | null;
    onClose: () => void;
    onSave: (branch: Branch) => void;
}

const defaultHours: OperationalHours = {
    monday: { start: '08:00', end: '18:00', isClosed: false },
    tuesday: { start: '08:00', end: '18:00', isClosed: false },
    wednesday: { start: '08:00', end: '18:00', isClosed: false },
    thursday: { start: '08:00', end: '18:00', isClosed: false },
    friday: { start: '08:00', end: '18:00', isClosed: false },
    saturday: { start: '09:00', end: '16:00', isClosed: false },
    sunday: { start: '09:00', end: '12:00', isClosed: true },
};

const BranchEditorModal: React.FC<BranchEditorModalProps> = ({ branch, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Branch>>(branch || { operationalHours: defaultHours });
    
    useEffect(() => {
        if (branch) {
            setFormData({
                ...branch,
                operationalHours: branch.operationalHours || defaultHours
            });
        } else {
            setFormData({ operationalHours: defaultHours });
        }
    }, [branch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleHoursChange = (day: keyof OperationalHours, field: keyof DaySchedule, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            operationalHours: {
                ...(prev.operationalHours!),
                [day]: {
                    ...(prev.operationalHours![day]),
                    [field]: value
                }
            } as OperationalHours
        }));
    };
    
    const handleSave = () => {
        if (!formData.name || !formData.legalEntityName || !formData.address || !formData.contactNumber || !formData.email) {
            alert('Please fill all required fields.');
            return;
        }
        onSave({
            id: formData.id || `branch_${Date.now()}`,
            ...formData
        } as Branch);
    };

    if (!branch) return null;

    const days: (keyof OperationalHours)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{formData.id ? 'Edit Branch' : 'Add New Branch'}</h3>
                    <button onClick={onClose} className="text-slate-500 dark:text-slate-400"><X/></button>
                </div>
                <div className="p-8 space-y-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div><label className="label text-xs">Branch Display Name *</label><input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="input"/></div>
                        <div><label className="label text-xs">Legal Entity Name *</label><input type="text" name="legalEntityName" value={formData.legalEntityName || ''} onChange={handleChange} className="input"/></div>
                        <div><label className="label text-xs">Full Address *</label><input type="text" name="address" value={formData.address || ''} onChange={handleChange} className="input"/></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="label text-xs">Contact Number *</label><input type="text" name="contactNumber" value={formData.contactNumber || ''} onChange={handleChange} className="input"/></div>
                            <div><label className="label text-xs">Email Address *</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="input"/></div>
                            <div><label className="label text-xs">TIN</label><input type="text" name="tinNumber" value={formData.tinNumber || ''} onChange={handleChange} className="input"/></div>
                            <div><label className="label text-xs">DTI Permit #</label><input type="text" name="dtiPermitNumber" value={formData.dtiPermitNumber || ''} onChange={handleChange} className="input"/></div>
                        </div>
                    </div>
                     <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="label text-sm">Operational Hours</h4>
                        <div className="space-y-3">
                            {days.map(day => {
                                const schedule = formData.operationalHours?.[day];
                                const isClosed = schedule?.isClosed || false;
                                return (
                                    <div key={day} className="grid grid-cols-12 gap-4 items-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                                        <div className="col-span-3 font-black text-sm capitalize text-slate-800 dark:text-slate-100">{day}</div>
                                        <div className="col-span-3 flex items-center">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={!isClosed} onChange={e => handleHoursChange(day, 'isClosed', !e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-teal-600"></div>
                                                <span className="ml-3 text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">{isClosed ? 'Closed' : 'Open'}</span>
                                            </label>
                                        </div>
                                        <div className="col-span-3">
                                            <input type="time" value={schedule?.start || ''} onChange={e => handleHoursChange(day, 'start', e.target.value)} disabled={isClosed} className="input text-sm p-2" />
                                        </div>
                                        <div className="col-span-3">
                                            <input type="time" value={schedule?.end || ''} onChange={e => handleHoursChange(day, 'end', e.target.value)} disabled={isClosed} className="input text-sm p-2" />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-700"><button onClick={handleSave} className="w-full py-3 bg-teal-600 text-white rounded-lg font-bold">Save Branch</button></div>
            </div>
        </div>
    );
};

interface PracticeBrandingProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
}

const PracticeBranding: React.FC<PracticeBrandingProps> = ({ settings, onUpdateSettings }) => {
    const toast = useToast();
    const { theme, toggleTheme } = useAppContext();
    const { showModal } = useModal();
    const [activeTab, setActiveTab] = useState('identity');
    
    const [editingBranch, setEditingBranch] = useState<Partial<Branch> | null>(null);
    const [newAffiliation, setNewAffiliation] = useState<Partial<HospitalAffiliation>>({ name: '', location: '', hotline: '' });
    const [isTranslating, setIsTranslating] = useState(false);
    const [apiCheckStatus, setApiCheckStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

    const checkApiKey = async () => {
        setApiCheckStatus('checking');
        try {
            const result = await translateToTagalog("Hello");
            if (result && result !== "Translation failed" && !result.includes("API key missing") && !result.includes("unavailable")) {
                setApiCheckStatus('valid');
                toast.success("Gemini API Key is CORRECT and working!");
            } else {
                setApiCheckStatus('invalid');
                toast.error("Gemini API Key is INCORRECT or missing.");
            }
        } catch (error) {
            setApiCheckStatus('invalid');
            toast.error("Error checking API Key.");
        }
    };

    // FIX: Add local state for the identity form
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleIdentitySave = () => {
        onUpdateSettings(localSettings);
        toast.success("Global profile updated successfully.");
    };

    const handleTranslateKioskNotice = async () => {
        if (!localSettings.kioskSettings.privacyNotice_en.trim()) {
            toast.error("Please enter English notice first.");
            return;
        }

        setIsTranslating(true);
        try {
            const translation = await translateToTagalog(localSettings.kioskSettings.privacyNotice_en);
            setLocalSettings(prev => ({
                ...prev,
                kioskSettings: {
                    ...prev.kioskSettings,
                    privacyNotice_tl: translation
                }
            }));
            toast.success("Translation generated successfully.");
        } catch (error) {
            toast.error("Failed to generate translation.");
        } finally {
            setIsTranslating(false);
        }
    };


    const isIdentityChanged = useMemo(() => {
        return settings.clinicName !== localSettings.clinicName ||
               settings.clinicProfile !== localSettings.clinicProfile ||
               settings.sessionTimeoutMinutes !== localSettings.sessionTimeoutMinutes;
    }, [settings, localSettings]);

    const handleSaveBranch = (branchToSave: Branch) => {
        const isNew = !branchToSave.id || !settings.branchProfiles.some(b => b.id === branchToSave.id);
        const nextProfiles = isNew
            ? [...settings.branchProfiles, branchToSave]
            : settings.branchProfiles.map(b => b.id === branchToSave.id ? branchToSave : b);
        
        const nextBranchNames = nextProfiles.map(b => b.name);

        onUpdateSettings({ ...settings, branchProfiles: nextProfiles, branches: nextBranchNames });
        setEditingBranch(null);
        toast.success(`Branch "${branchToSave.name}" saved.`);
    };
    
    const handleRemoveBranch = (branchId: string) => {
        const branchToRemove = settings.branchProfiles.find(b => b.id === branchId);
        showModal('confirm', {
            title: 'Delete Branch',
            message: `Are you sure you want to delete the branch "${branchToRemove?.name}"?`,
            confirmText: 'Delete',
            isDestructive: true,
            onConfirm: () => {
                const nextProfiles = settings.branchProfiles.filter(b => b.id !== branchId);
                const nextBranchNames = nextProfiles.map(b => b.name);
                onUpdateSettings({ ...settings, branchProfiles: nextProfiles, branches: nextBranchNames });
                toast.info("Branch removed.");
            }
        });
    };
    
    const handleAddAffiliation = () => {
        if (newAffiliation.name) {
            const newAffiliations = [...settings.hospitalAffiliations, { ...newAffiliation, id: `hosp_${Date.now()}` } as HospitalAffiliation];
            onUpdateSettings({ ...settings, hospitalAffiliations: newAffiliations });
            setNewAffiliation({ name: '', location: '', hotline: '' });
        }
    };
    
    const handleRemoveAffiliation = (id: string) => {
        const newAffiliations = settings.hospitalAffiliations.filter(h => h.id !== id);
        onUpdateSettings({ ...settings, hospitalAffiliations: newAffiliations });
    };
    
    const tabs = [
        { id: 'identity', label: 'Global Profile', icon: Sparkles },
        { id: 'kiosk', label: 'Kiosk Setup', icon: Monitor },
        { id: 'branches', label: 'Branch Management', icon: MapPin },
        { id: 'referrals', label: 'Referral Network', icon: Building2 },
    ];

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter leading-none">My Profile</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-2">Manage global branding, locations, and network affiliations.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm self-start flex gap-2">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-teal-900 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400'}`}>
                        <tab.icon size={14}/> {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'identity' && (
                 <div className="bg-bg-secondary p-10 rounded-[2.5rem] border border-border-primary shadow-sm space-y-12">
                    {/* General Settings Section - Vertical Stack */}
                    <div className="space-y-8 max-w-2xl">
                        <div>
                            <label htmlFor="clinicName" className="label text-sm">Main Practice Name</label>
                            <input id="clinicName" type="text" value={localSettings.clinicName} onChange={(e) => setLocalSettings(prev => ({ ...prev, clinicName: e.target.value }))} className="input text-lg font-bold w-full"/>
                        </div>
                        <div>
                            <label htmlFor="clinicProfile" className="label text-sm">Clinic Profile Type</label>
                            <select id="clinicProfile" value={localSettings.clinicProfile} onChange={(e) => setLocalSettings(prev => ({ ...prev, clinicProfile: e.target.value as any }))} className="input text-lg font-bold w-full">
                                <option value="boutique">Boutique / Solo Practice</option>
                                <option value="corporate">Corporate / Multi-Branch</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="sessionTimeout" className="label text-sm">Session Timeout (Minutes)</label>
                            <input id="sessionTimeout" type="number" value={localSettings.sessionTimeoutMinutes} onChange={(e) => setLocalSettings(prev => ({ ...prev, sessionTimeoutMinutes: parseInt(e.target.value) || 30 }))} className="input text-lg font-bold w-full"/>
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-bg-tertiary p-6 rounded-2xl border border-border-secondary">
                                <div><h4 className="font-bold text-text-primary">Interface Theme</h4><p className="text-sm text-text-secondary">Current: <span className="font-bold capitalize">{theme}</span></p></div>
                        <div className="flex bg-slate-50 dark:bg-slate-900 p-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                            <button onClick={() => theme === 'dark' && toggleTheme()} className={`px-6 py-2 rounded-full text-xs font-black uppercase flex items-center gap-2 ${theme === 'light' ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-md' : 'text-slate-500 dark:text-slate-400'}`}><Sun size={14}/> Light</button>
                            <button onClick={() => theme === 'light' && toggleTheme()} className={`px-6 py-2 rounded-full text-xs font-black uppercase flex items-center gap-2 ${theme === 'dark' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-md' : 'text-slate-500 dark:text-slate-400'}`}><Moon size={14}/> Dark</button>
                        </div>
                    </div>
                     <div className="pt-8 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                        <button onClick={handleIdentitySave} disabled={!isIdentityChanged} className="px-8 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-600/30 disabled:opacity-50 disabled:grayscale flex items-center gap-3">
                            <Save size={16} /> Save Changes
                        </button>
                    </div>
                </div>
            )}
            
            {activeTab === 'kiosk' && (
                <div className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm space-y-12">
                    <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-3xl border border-teal-100 dark:border-teal-800 flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-teal-900 dark:text-teal-100">AI Translation Engine</h4>
                            <p className="text-sm text-teal-600 dark:text-teal-400">Verify if your Google Gemini API Key is correctly configured.</p>
                        </div>
                        <button 
                            onClick={checkApiKey} 
                            disabled={apiCheckStatus === 'checking'}
                            className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${
                                apiCheckStatus === 'valid' ? 'bg-green-500 text-white' : 
                                apiCheckStatus === 'invalid' ? 'bg-red-500 text-white' : 
                                'bg-teal-600 text-white hover:bg-teal-700'
                            }`}
                        >
                            {apiCheckStatus === 'checking' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            {apiCheckStatus === 'checking' ? 'Checking...' : 
                             apiCheckStatus === 'valid' ? 'API Key Valid' : 
                             apiCheckStatus === 'invalid' ? 'API Key Invalid' : 'Check API Key'}
                        </button>
                    </div>

                    <div className="space-y-8 max-w-4xl">
                        <div>
                            <label className="label text-sm">Welcome Message</label>
                            <input 
                                type="text" 
                                value={localSettings.kioskSettings.welcomeMessage} 
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, kioskSettings: { ...prev.kioskSettings, welcomeMessage: e.target.value } }))} 
                                className="input text-lg font-bold w-full"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="label text-sm">English</label>
                                <textarea 
                                    value={localSettings.kioskSettings.privacyNotice_en} 
                                    onChange={(e) => setLocalSettings(prev => ({ ...prev, kioskSettings: { ...prev.kioskSettings, privacyNotice_en: e.target.value } }))} 
                                    className="input h-64 resize-none font-mono text-xs"
                                    placeholder="Enter English privacy notice..."
                                />
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="label text-sm">Tagalog</label>
                                    <button 
                                        onClick={handleTranslateKioskNotice}
                                        disabled={isTranslating}
                                        className="text-[10px] font-black uppercase tracking-widest text-teal-600 hover:text-teal-700 flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {isTranslating ? <Loader2 size={10} className="animate-spin" /> : <Languages size={10} />}
                                        {isTranslating ? 'Translating...' : 'Auto-Translate'}
                                    </button>
                                </div>
                                <textarea 
                                    value={localSettings.kioskSettings.privacyNotice_tl} 
                                    readOnly
                                    className="input h-64 resize-none font-mono text-xs bg-slate-50 dark:bg-slate-900"
                                    placeholder="Tagalog translation will appear here..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                        <button 
                            onClick={handleIdentitySave} 
                            className="px-8 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-600/30 flex items-center gap-3"
                        >
                            <Save size={16} /> Save Kiosk Settings
                        </button>
                    </div>
                </div>
            )}
            
            {activeTab === 'branches' && (
                <div className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                    <div className="flex justify-end">
                        <button onClick={() => setEditingBranch({})} className="p-4 bg-teal-600 text-white rounded-2xl shadow-lg hover:bg-teal-700 flex items-center gap-2 text-xs font-black uppercase"><Plus size={16}/> Add Branch</button>
                    </div>
                    <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        {settings.branchProfiles.map(b => (
                            <div key={b.id} className="p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl flex justify-between items-center border border-slate-200 dark:border-slate-600 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center"><MapPin className="text-teal-600 dark:text-teal-400"/></div>
                                    <div>
                                        <div className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{b.name}</div>
                                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{b.address}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingBranch(b)} className="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600"><Edit size={16}/></button>
                                    <button onClick={() => handleRemoveBranch(b.id)} className="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'referrals' && (
                <div className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <input value={newAffiliation.name} onChange={e => setNewAffiliation({...newAffiliation, name: e.target.value})} placeholder="Hospital/Clinic Name" className="input"/>
                        <input value={newAffiliation.location} onChange={e => setNewAffiliation({...newAffiliation, location: e.target.value})} placeholder="Location" className="input"/>
                        <input value={newAffiliation.hotline} onChange={e => setNewAffiliation({...newAffiliation, hotline: e.target.value})} placeholder="Hotline" className="input"/>
                    </div>
                    <button onClick={handleAddAffiliation} className="w-full py-3 bg-teal-600 text-white rounded-xl font-black text-xs uppercase">Add Affiliation</button>
                    <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        {settings.hospitalAffiliations.map(h => (
                             <div key={h.id} className="p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl flex justify-between items-center border border-slate-200 dark:border-slate-600 group">
                                <div>
                                    <div className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{h.name}</div>
                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{h.location} &bull; {h.hotline}</div>
                                </div>
                                <button onClick={() => handleRemoveAffiliation(h.id)} className="text-slate-500 dark:text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {editingBranch && (
                <BranchEditorModal branch={editingBranch} onClose={() => setEditingBranch(null)} onSave={handleSaveBranch} />
            )}
        </div>
    );
};

export default PracticeBranding;

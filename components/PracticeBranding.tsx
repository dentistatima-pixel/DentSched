import React from 'react';
import { FieldSettings } from '../types';
import { Sparkles, Save } from 'lucide-react';
import { useToast } from './ToastSystem';

interface PracticeBrandingProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
}

const PracticeBranding: React.FC<PracticeBrandingProps> = ({ settings, onUpdateSettings }) => {
    const toast = useToast();

    const handleSave = () => {
        onUpdateSettings(settings);
        toast.success("Practice identity updated successfully.");
    };

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Practice Identity</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">Manage global branding and clinic profile.</p>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                <div className="flex items-center gap-4 text-teal-800 font-black uppercase text-xs tracking-[0.2em] border-b border-slate-100 pb-4">
                    <Sparkles size={24} />
                    Branding & Profile
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label htmlFor="clinicName" className="label text-sm">Official Clinic Name</label>
                        <input
                            id="clinicName"
                            type="text"
                            value={settings.clinicName}
                            onChange={(e) => onUpdateSettings({ ...settings, clinicName: e.target.value })}
                            className="input text-lg font-bold"
                        />
                    </div>
                    <div>
                        <label htmlFor="clinicProfile" className="label text-sm">Clinic Profile Type</label>
                        <select
                            id="clinicProfile"
                            value={settings.clinicProfile}
                            onChange={(e) => onUpdateSettings({ ...settings, clinicProfile: e.target.value as any })}
                            className="input text-lg font-bold"
                        >
                            <option value="boutique">Boutique / Solo Practice</option>
                            <option value="corporate">Corporate / Multi-Branch</option>
                        </select>
                    </div>
                </div>
                 <div className="pt-8 flex justify-end">
                    <button onClick={handleSave} className="bg-teal-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-600/30 flex items-center gap-3">
                        <Save size={16} />
                        Save Identity
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PracticeBranding;

import React from 'react';
import { FieldSettings } from '../types';
import { Sparkles } from 'lucide-react';

interface PracticeBrandingProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
}

const PracticeBranding: React.FC<PracticeBrandingProps> = ({ settings, onUpdateSettings }) => {
    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Practice Identity</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Manage global branding and clinic profile.</p>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 text-teal-800 font-black uppercase text-xs tracking-widest border-b border-slate-100 pb-3 mb-4">
                    <Sparkles size={20} />
                    Branding & Profile
                </div>
                <div>
                    <label className="label text-xs">Official Clinic Name</label>
                    <input
                        type="text"
                        value={settings.clinicName}
                        onChange={(e) => onUpdateSettings({ ...settings, clinicName: e.target.value })}
                        className="input"
                    />
                </div>
                <div>
                    <label className="label text-xs">Clinic Profile Type</label>
                    <select
                        value={settings.clinicProfile}
                        onChange={(e) => onUpdateSettings({ ...settings, clinicProfile: e.target.value as any })}
                        className="input"
                    >
                        <option value="boutique">Boutique / Solo Practice</option>
                        <option value="corporate">Corporate / Multi-Branch</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default PracticeBranding;

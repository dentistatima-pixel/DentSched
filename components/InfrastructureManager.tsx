import React, { useState } from 'react';
import { FieldSettings, ClinicResource, MaintenanceAsset, HospitalAffiliation, ResourceType } from '../types';
import { MapPin, Armchair, Box, Building2, Plus, Trash2, Save, ShieldCheck } from 'lucide-react';
import { useToast } from './ToastSystem';
import { generateUid } from '../constants';

interface InfrastructureManagerProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
    initialTab?: string;
}

const InfrastructureManager: React.FC<InfrastructureManagerProps> = ({ settings, onUpdateSettings, initialTab }) => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState(initialTab || 'branches');
    
    const [newBranchName, setNewBranchName] = useState('');

    const handleAddBranch = () => {
        if (newBranchName && !settings.branches.includes(newBranchName)) {
            onUpdateSettings({ ...settings, branches: [...settings.branches, newBranchName]});
            setNewBranchName('');
        }
    };
    
    const tabs = [
        { id: 'branches', label: 'Branches', icon: MapPin },
        { id: 'resources', label: 'Resources', icon: Armchair },
        { id: 'assets', label: 'Assets', icon: Box },
        { id: 'hospitalAffiliations', label: 'Referral Network', icon: Building2 },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'branches':
                return (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input value={newBranchName} onChange={e => setNewBranchName(e.target.value)} placeholder="New Branch Name" className="input flex-1"/>
                            <button onClick={handleAddBranch} className="bg-teal-600 text-white px-4 rounded-xl"><Plus size={20}/></button>
                        </div>
                        {settings.branches.map(b => <div key={b} className="p-3 bg-slate-50 rounded-lg font-bold">{b}</div>)}
                    </div>
                );
            case 'resources':
                 return (
                    <div className="space-y-4">
                        {settings.resources.map(r => <div key={r.id} className="p-3 bg-slate-50 rounded-lg font-bold">{r.name} ({r.branch})</div>)}
                    </div>
                );
            case 'assets':
                 return (
                    <div className="space-y-4">
                        {settings.assets.map(a => <div key={a.id} className="p-3 bg-slate-50 rounded-lg font-bold">{a.name} ({a.branch})</div>)}
                    </div>
                 );
            case 'hospitalAffiliations':
                return (
                    <div className="space-y-4">
                        {settings.hospitalAffiliations.map(h => <div key={h.id} className="p-3 bg-slate-50 rounded-lg font-bold">{h.name}</div>)}
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Infrastructure Management</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">Manage physical locations, assets, and external network.</p>
            </div>
            
            <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm self-start flex gap-2">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-teal-900 text-white shadow-lg' : 'text-slate-500'}`}>
                        <tab.icon size={14}/> {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                {renderContent()}
            </div>
        </div>
    );
};

export default InfrastructureManager;

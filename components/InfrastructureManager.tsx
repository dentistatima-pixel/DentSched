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

const BRANCH_PREFIXES: Record<string, string> = {
    'Makati Main': 'mkt',
    'Quezon City Satellite': 'qzc',
    'BGC Premium': 'bgc',
    'Alabang South': 'alb'
};

const InfrastructureManager: React.FC<InfrastructureManagerProps> = ({ settings, onUpdateSettings, initialTab }) => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState(initialTab || 'branches');
    const [editingResource, setEditingResource] = useState<Partial<ClinicResource> | null>(null);
    const [editingAsset, setEditingAsset] = useState<Partial<MaintenanceAsset> | null>(null);
    const [editingAffiliation, setEditingAffiliation] = useState<Partial<HospitalAffiliation> | null>(null);

    const generateResourceUid = (branch: string, existing: ClinicResource[]) => {
        const prefix = BRANCH_PREFIXES[branch] || branch.substring(0, 3).toLowerCase();
        const branchIds = existing.filter(r => r.id.startsWith(prefix)).map(r => parseInt(r.id.replace(prefix, ''))).filter(n => !isNaN(n));
        const nextNum = branchIds.length > 0 ? Math.max(...branchIds) + 1 : 1001;
        return `${prefix}${nextNum.toString().padStart(4, '0')}`;
    };

    const handleSaveResource = () => {
        if (!editingResource?.name || !editingResource.branch) return;
        const isNew = !editingResource.id;
        const newId = isNew ? generateResourceUid(editingResource.branch, settings.resources) : editingResource.id;
        const finalResource = { ...editingResource, id: newId } as ClinicResource;

        const next = isNew ? [...settings.resources, finalResource] : settings.resources.map(r => r.id === finalResource.id ? finalResource : r);
        onUpdateSettings({ ...settings, resources: next });
        setEditingResource(null);
    };

    const handleSaveAsset = () => {
        if (!editingAsset?.name) return;
        const next = editingAsset.id ? settings.assets.map(a => a.id === editingAsset.id ? a : a) : [...settings.assets, {...editingAsset, id: generateUid('ast')} as MaintenanceAsset];
        onUpdateSettings({ ...settings, assets: next });
        setEditingAsset(null);
    };
    
    const handleSaveAffiliation = () => {
        if (!editingAffiliation?.name) return;
        const next = editingAffiliation.id ? settings.hospitalAffiliations.map(a => a.id === editingAffiliation.id ? a : a) : [...settings.hospitalAffiliations, {...editingAffiliation, id: generateUid('hosp')} as HospitalAffiliation];
        onUpdateSettings({ ...settings, hospitalAffiliations: next });
        setEditingAffiliation(null);
    };
    
    const tabs = [
        { id: 'branches', label: 'Branches', icon: MapPin },
        { id: 'resources', label: 'Resources', icon: Armchair },
        { id: 'assets', label: 'Assets', icon: Box },
        { id: 'hospitalAffiliations', label: 'Referral Network', icon: Building2 },
    ];

    const renderContent = () => {
        // Content for each tab will go here
        return <div className="p-6 bg-white rounded-2xl border">{activeTab} content</div>;
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Infrastructure Management</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Manage physical locations, assets, and external network.</p>
            </div>
            
            <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm self-start flex gap-2">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-teal-900 text-white shadow-lg' : 'text-slate-500'}`}>
                        <tab.icon size={14}/> {tab.label}
                    </button>
                ))}
            </div>

            {/* Modals */}
            {editingResource && <div className="fixed inset-0 z-[100] flex justify-center items-center p-4"><div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingResource(null)}/><div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-6 animate-in zoom-in-95"><h3 className="text-xl font-black uppercase tracking-widest text-teal-900 border-b border-teal-50 pb-4 mb-2">Resource Detail</h3><div className="space-y-4"><div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 shadow-inner flex items-center justify-between"><div><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">SYSTEM ASSET UID</label><div className="text-2xl font-black font-mono text-teal-800 leading-none">{editingResource.id || '...'}</div></div><ShieldCheck size={32} className="text-teal-600 opacity-20"/></div><div><label className="label text-[10px]">Resource Narrative</label><input type="text" value={editingResource.name} onChange={e => setEditingResource({...editingResource, name: e.target.value})} className="input" placeholder="e.g. Chair Alpha" /></div><div className="grid grid-cols-2 gap-4"><div><label className="label text-[10px]">Classification</label><select value={editingResource.type} onChange={e => setEditingResource({...editingResource, type: e.target.value as any})} className="input"><option value={ResourceType.CHAIR}>Dental Chair</option><option value={ResourceType.XRAY}>Imaging Unit</option><option value={ResourceType.CONSULTATION}>Consultation</option></select></div><div><label className="label text-[10px]">Site</label><select value={editingResource.branch} onChange={e => setEditingResource({...editingResource, branch: e.target.value})} className="input">{settings.branches.map(b => <option key={b} value={b}>{b}</option>)}</select></div></div><div><label className="label text-[10px]">Hex Color Key</label><input type="color" value={editingResource.colorCode} onChange={e => setEditingResource({...editingResource, colorCode: e.target.value})} className="w-full h-12 rounded-xl" /></div></div><div className="flex gap-3 pt-4"><button onClick={() => setEditingResource(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button><button onClick={handleSaveResource} className="flex-[2] py-4 bg-teal-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-teal-600/20">Commit to Grid</button></div></div></div>}

        </div>
    );
};

export default InfrastructureManager;

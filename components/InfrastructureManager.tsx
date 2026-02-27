import React, { useState } from 'react';
import { FieldSettings, ClinicResource, MaintenanceAsset, ResourceType } from '../types';
import { Armchair, Box, Plus, Trash2 } from 'lucide-react';
import { useToast } from './ToastSystem';

interface InfrastructureManagerProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
    initialTab?: string;
}

const InfrastructureManager: React.FC<InfrastructureManagerProps> = ({ settings, onUpdateSettings, initialTab }) => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState(initialTab || 'resources');
    const [activeBranch, setActiveBranch] = useState(settings.branches[0] || '');

    const [isAddingResource, setIsAddingResource] = useState(false);
    const [newResource, setNewResource] = useState<Partial<ClinicResource>>({ name: '', type: ResourceType.CHAIR });
    
    const [isAddingAsset, setIsAddingAsset] = useState(false);
    const [newAsset, setNewAsset] = useState<Partial<MaintenanceAsset>>({ name: '', brand: '', serialNumber: '', frequencyMonths: 6 });

    const tabs = [
        { id: 'resources', label: 'Clinical Resources', icon: Armchair },
        { id: 'assets', label: 'Maintainable Assets', icon: Box },
    ];

    const handleSaveResource = () => {
        if (!newResource.name || !newResource.type) {
            toast.error("Resource name and type are required.");
            return;
        }
        const finalResource: ClinicResource = {
            id: `res_${Date.now()}`,
            name: newResource.name,
            type: newResource.type,
            branch: activeBranch,
        };
        handleUpdateList('resources', [...settings.resources, finalResource]);
        setIsAddingResource(false);
        setNewResource({ name: '', type: ResourceType.CHAIR });
        toast.success("Resource added.");
    };

    const handleSaveAsset = () => {
        if (!newAsset.name || !newAsset.serialNumber) {
            toast.error("Asset name and serial number are required.");
            return;
        }
        const finalAsset: MaintenanceAsset = {
            id: `asset_${Date.now()}`,
            name: newAsset.name,
            brand: newAsset.brand,
            serialNumber: newAsset.serialNumber,
            frequencyMonths: newAsset.frequencyMonths || 6,
            lastService: new Date().toISOString().split('T')[0],
            status: 'Ready',
            branch: activeBranch,
        };
        handleUpdateList('assets', [...settings.assets, finalAsset]);
        setIsAddingAsset(false);
        setNewAsset({ name: '', brand: '', serialNumber: '', frequencyMonths: 6 });
        toast.success("Asset added.");
    };

    const handleUpdateList = <T extends ClinicResource | MaintenanceAsset>(key: 'resources' | 'assets', newList: T[]) => {
        onUpdateSettings({ ...settings, [key]: newList });
    };

    const renderContent = () => {
        const branchTabs = (
            <div className="flex gap-2 border-b border-slate-200 mb-6">
                {settings.branches.map(branch => (
                    <button 
                        key={branch} 
                        onClick={() => setActiveBranch(branch)}
                        className={`px-6 py-3 text-sm font-black transition-all border-b-4 ${activeBranch === branch ? 'border-teal-500 text-teal-800' : 'border-transparent text-slate-400 hover:text-teal-600'}`}
                    >
                        {branch}
                    </button>
                ))}
            </div>
        );

        switch (activeTab) {
            case 'resources':
                const filteredResources = settings.resources.filter(r => r.branch === activeBranch);
                return (
                    <div>
                        {branchTabs}
                        <div className="flex justify-end mb-6">
                            <button onClick={() => setIsAddingResource(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold"><Plus size={14}/> Add Resource</button>
                        </div>
                        {isAddingResource && (
                            <div className="p-6 bg-teal-50 border-2 border-teal-100 rounded-2xl mb-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input value={newResource.name} onChange={e => setNewResource({...newResource, name: e.target.value})} placeholder="Resource Name (e.g., Operatory 1)" className="input"/>
                                    <select value={newResource.type} onChange={e => setNewResource({...newResource, type: e.target.value as ResourceType})} className="input">
                                        {Object.values(ResourceType).map(rt => <option key={rt} value={rt}>{rt}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setIsAddingResource(false)} className="px-4 py-2 text-xs font-bold">Cancel</button>
                                    <button onClick={handleSaveResource} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold">Save</button>
                                </div>
                            </div>
                        )}
                        <div className="space-y-3">
                            {filteredResources.map(r => (
                                <div key={r.id} className="p-4 bg-white rounded-xl flex justify-between items-center border border-slate-200 group">
                                    <div className="flex items-center gap-4">
                                        <Armchair size={20} className="text-teal-600"/>
                                        <div>
                                            <div className="font-black text-slate-800">{r.name}</div>
                                            <div className="text-xs font-bold text-slate-500 uppercase">{r.type}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleUpdateList('resources', settings.resources.filter(i => i.id !== r.id))} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'assets':
                const filteredAssets = settings.assets.filter(a => a.branch === activeBranch);
                return (
                     <div>
                        {branchTabs}
                        <div className="flex justify-end mb-6">
                            <button onClick={() => setIsAddingAsset(true)} className="flex items-center gap-2 px-4 py-2 bg-lilac-600 text-white rounded-lg text-xs font-bold"><Plus size={14}/> Add Asset</button>
                        </div>
                        {isAddingAsset && (
                            <div className="p-6 bg-lilac-50 border-2 border-lilac-100 rounded-2xl mb-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} placeholder="Asset Name (e.g., Autoclave 1)" className="input"/>
                                    <input value={newAsset.brand} onChange={e => setNewAsset({...newAsset, brand: e.target.value})} placeholder="Brand" className="input"/>
                                    <input value={newAsset.serialNumber} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})} placeholder="Serial Number" className="input"/>
                                    <input type="number" value={newAsset.frequencyMonths} onChange={e => setNewAsset({...newAsset, frequencyMonths: parseInt(e.target.value)})} placeholder="Service Freq (Months)" className="input"/>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setIsAddingAsset(false)} className="px-4 py-2 text-xs font-bold">Cancel</button>
                                    <button onClick={handleSaveAsset} className="px-4 py-2 bg-lilac-600 text-white rounded-lg text-xs font-bold">Save</button>
                                </div>
                            </div>
                        )}
                        <div className="space-y-3">
                            {filteredAssets.map(a => (
                                <div key={a.id} className="p-4 bg-white rounded-xl flex justify-between items-center border border-slate-200 group">
                                    <div className="flex items-center gap-4">
                                        <Box size={20} className="text-lilac-600"/>
                                        <div>
                                            <div className="font-black text-slate-800">{a.name}</div>
                                            <div className="text-xs font-bold text-slate-500 uppercase">S/N: {a.serialNumber} &bull; Brand: {a.brand}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleUpdateList('assets', settings.assets.filter(i => i.id !== a.id))} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                 );
            default: return null;
        }
    };

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Infrastructure Management</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">Manage physical resources and equipment assets by location.</p>
            </div>
            
            <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm self-start flex gap-2">
                {tabs.map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id)} 
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-teal-900 text-white shadow-lg' : 'text-slate-500'}`}
                    >
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

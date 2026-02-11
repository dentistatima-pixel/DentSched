import React, { useState } from 'react';
import { FieldSettings } from '../types';
import ProcedureCatalog from './ProcedureCatalog';
import PharmacyRegistry from './PharmacyRegistry';
import MaterialsRegistry from './MaterialsRegistry';
import { DollarSign, Pill, Layers } from 'lucide-react';

interface ClinicalCatalogHubProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
}

const ClinicalCatalogHub: React.FC<ClinicalCatalogHubProps> = ({ settings, onUpdateSettings }) => {
    const [activeTab, setActiveTab] = useState('procedures');
    
    const tabs = [
        { id: 'procedures', label: 'Procedure Catalog', icon: DollarSign },
        { id: 'medications', label: 'Pharmacy Registry', icon: Pill },
        { id: 'materials', label: 'Shade & Materials', icon: Layers },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'procedures':
                return <ProcedureCatalog settings={settings} onUpdateSettings={onUpdateSettings} />;
            case 'medications':
                return <PharmacyRegistry settings={settings} onUpdateSettings={onUpdateSettings} />;
            case 'materials':
                return <MaterialsRegistry settings={settings} onUpdateSettings={onUpdateSettings} />;
            default: return null;
        }
    };

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Clinical Catalog Hub</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">Manage all billable services and materials.</p>
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
            
            <div className="mt-8">
              {renderContent()}
            </div>
        </div>
    );
};

export default ClinicalCatalogHub;

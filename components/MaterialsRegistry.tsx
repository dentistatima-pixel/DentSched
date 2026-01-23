
import React from 'react';
import { FieldSettings } from '../types';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { useToast } from './ToastSystem';

interface MaterialsRegistryProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
}

const ListManager: React.FC<{ title: string, items: string[], onUpdate: (newItems: string[]) => void }> = ({ title, items, onUpdate }) => {
    const handleAdd = () => {
        const newItem = prompt(`Enter new ${title}:`);
        if (newItem && !items.includes(newItem)) {
            onUpdate([...items, newItem]);
        }
    };

    const handleRemove = (item: string) => {
        onUpdate(items.filter(i => i !== item));
    };

    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">{title}</h4>
                <button onClick={handleAdd} className="p-2 bg-teal-50 text-teal-600 rounded-lg"><Plus size={16}/></button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {items.map(item => (
                    <div key={item} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg group">
                        <span className="text-sm font-bold text-slate-700">{item}</span>
                        <button onClick={() => handleRemove(item)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={14}/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MaterialsRegistry: React.FC<MaterialsRegistryProps> = ({ settings, onUpdateSettings }) => {
    const toast = useToast();

    const handleUpdateList = (key: 'shadeGuides' | 'restorativeMaterials', newItems: string[]) => {
        onUpdateSettings({ ...settings, [key]: newItems });
        toast.success("Materials registry updated.");
    };

    return (
        <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ListManager 
                    title="Shade Guides"
                    items={settings.shadeGuides}
                    onUpdate={(newItems) => handleUpdateList('shadeGuides', newItems)}
                />
                <ListManager 
                    title="Restorative Materials"
                    items={settings.restorativeMaterials}
                    onUpdate={(newItems) => handleUpdateList('restorativeMaterials', newItems)}
                />
            </div>
        </div>
    );
};

export default MaterialsRegistry;

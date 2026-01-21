import React from 'react';
import { FieldSettings } from '../types';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from './ToastSystem';

interface FinancialSettingsProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
    initialTab?: string;
}

const ListManager: React.FC<{ title: string, items: string[], onUpdate: (newItems: string[]) => void }> = ({ title, items, onUpdate }) => {
    const handleAdd = () => {
        const newItem = prompt(`Enter new ${title}:`);
        if (newItem && !items.includes(newItem)) onUpdate([...items, newItem]);
    };
    const handleRemove = (item: string) => onUpdate(items.filter(i => i !== item));

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h4 className="label text-sm">{title}</h4>
                <button onClick={handleAdd} className="p-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100"><Plus size={16}/></button>
            </div>
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-60 overflow-y-auto">
                {items.map(item => (
                    <div key={item} className="flex justify-between items-center p-3 bg-white rounded-lg group border border-slate-100">
                        <span className="text-sm font-bold text-slate-700">{item}</span>
                        <button onClick={() => handleRemove(item)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
                            <Trash2 size={14}/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FinancialSettings: React.FC<FinancialSettingsProps> = ({ settings, onUpdateSettings, initialTab }) => {
    const toast = useToast();

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Financial & HR Catalogs</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">Configure financial transaction types and payroll components.</p>
            </div>
            
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ListManager 
                        title="Payment Modes" 
                        items={settings.paymentModes} 
                        onUpdate={(items) => { onUpdateSettings({...settings, paymentModes: items}); toast.success("Updated."); }}
                    />
                    <ListManager 
                        title="Expense Categories" 
                        items={settings.expenseCategories} 
                        onUpdate={(items) => { onUpdateSettings({...settings, expenseCategories: items}); toast.success("Updated."); }}
                    />
                 </div>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                 <h4 className="label text-sm border-b pb-3 border-slate-100">Tax Configuration</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <label className="label text-xs">VAT Rate (%)</label>
                        <input type="number" value={settings.taxConfig.vatRate} onChange={e => onUpdateSettings({...settings, taxConfig: {...settings.taxConfig, vatRate: +e.target.value}})} className="input"/>
                    </div>
                    <div>
                        <label className="label text-xs">Withholding Rate (%)</label>
                        <input type="number" value={settings.taxConfig.withholdingRate} onChange={e => onUpdateSettings({...settings, taxConfig: {...settings.taxConfig, withholdingRate: +e.target.value}})} className="input"/>
                    </div>
                    <div>
                        <label className="label text-xs">Next OR Number</label>
                        <input type="number" value={settings.taxConfig.nextOrNumber} onChange={e => onUpdateSettings({...settings, taxConfig: {...settings.taxConfig, nextOrNumber: +e.target.value}})} className="input"/>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default FinancialSettings;

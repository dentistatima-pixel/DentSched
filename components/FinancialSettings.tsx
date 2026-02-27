import React, { useState } from 'react';
import { FieldSettings, PayrollAdjustmentTemplate } from '../types';
import { Plus, Trash2, Banknote, Sliders, ClipboardList } from 'lucide-react';
import { useToast } from './ToastSystem';
import { useModal } from '../contexts/ModalContext';

interface FinancialSettingsProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
}

const ListManager: React.FC<{ title: string, items: string[], onUpdate: (newItems: string[]) => void }> = ({ title, items, onUpdate }) => {
    const { showModal } = useModal();
    const handleAdd = () => {
        showModal('prompt', {
            title: `Add ${title}`,
            message: `Enter new ${title}:`,
            onConfirm: (newItem: string) => {
                if (newItem && !items.includes(newItem)) onUpdate([...items, newItem]);
            }
        });
    };
    const handleRemove = (item: string) => onUpdate(items.filter(i => i !== item));

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h4 className="label text-sm">{title}</h4>
                <button onClick={handleAdd} className="p-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100"><Plus size={16}/></button>
            </div>
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
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

const FinancialSettings: React.FC<FinancialSettingsProps> = ({ settings, onUpdateSettings }) => {
    const toast = useToast();
    const { showModal } = useModal();
    const [activeTab, setActiveTab] = useState('paymentModes');

    const tabs = [
        { id: 'paymentModes', label: 'Payment & Tax', icon: Banknote },
        { id: 'payrollAdjustments', label: 'Adjustment Catalog', icon: Sliders },
        { id: 'expenseCategories', label: 'Expense Chart', icon: ClipboardList },
    ];

    const payrollTemplates = settings.payrollAdjustmentTemplates || [];
    
    const handleAddPayrollTemplate = () => {
        showModal('prompt', {
            title: 'Add Adjustment Template',
            message: 'Enter new adjustment template label:',
            onConfirm: (label: string) => {
                if (label) {
                    const newTemplate: PayrollAdjustmentTemplate = { id: `adj_${Date.now()}`, label, type: 'Credit', category: 'Other' };
                    onUpdateSettings({...settings, payrollAdjustmentTemplates: [...payrollTemplates, newTemplate]});
                }
            }
        });
    }
    const handleRemovePayrollTemplate = (id: string) => {
        onUpdateSettings({...settings, payrollAdjustmentTemplates: payrollTemplates.filter(t => t.id !== id)});
    }
    
    const renderContent = () => {
        switch(activeTab) {
            case 'paymentModes':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ListManager 
                            title="Payment Modes" 
                            items={settings.paymentModes} 
                            onUpdate={(items) => { onUpdateSettings({...settings, paymentModes: items}); toast.success("Updated."); }}
                        />
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                            <h4 className="label text-sm border-b pb-3 border-slate-100">Tax Configuration</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label text-xs">VAT Rate (%)</label>
                                    <input type="number" value={settings.taxConfig.vatRate} onChange={e => onUpdateSettings({...settings, taxConfig: {...settings.taxConfig, vatRate: +e.target.value}})} className="input"/>
                                </div>
                                <div>
                                    <label className="label text-xs">Withholding Rate (%)</label>
                                    <input type="number" value={settings.taxConfig.withholdingRate} onChange={e => onUpdateSettings({...settings, taxConfig: {...settings.taxConfig, withholdingRate: +e.target.value}})} className="input"/>
                                </div>
                                <div className="col-span-2">
                                    <label className="label text-xs">Next OR Number</label>
                                    <input type="number" value={settings.taxConfig.nextOrNumber} onChange={e => onUpdateSettings({...settings, taxConfig: {...settings.taxConfig, nextOrNumber: +e.target.value}})} className="input"/>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'expenseCategories':
                return <ListManager 
                            title="Expense Categories" 
                            items={settings.expenseCategories} 
                            onUpdate={(items) => { onUpdateSettings({...settings, expenseCategories: items}); toast.success("Updated."); }}
                        />;
            case 'payrollAdjustments':
                 return (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="label text-sm">Payroll Adjustment Templates</h4>
                            <button onClick={handleAddPayrollTemplate} className="p-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100"><Plus size={16}/></button>
                        </div>
                        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            {payrollTemplates.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded-lg group border border-slate-100">
                                    <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                    <button onClick={() => handleRemovePayrollTemplate(item.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                 );
            default:
                return null;
        }
    }


    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Financial & HR Hub</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">Configure financial transaction types and payroll components.</p>
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

            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                {renderContent()}
            </div>
        </div>
    );
};

export default FinancialSettings;
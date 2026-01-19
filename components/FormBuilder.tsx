import React, { useMemo, useState } from 'react';
import { FieldSettings, RegistrationField } from '../types';
import { Plus, X, ArrowUp, ArrowDown, MousePointer2, PlusCircle, Edit3 } from 'lucide-react';
import { useToast } from './ToastSystem';
import RegistrationBasicInfo from './RegistrationBasicInfo';
import RegistrationMedical from './RegistrationMedical';

interface FormBuilderProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ settings, onUpdateSettings }) => {
    const toast = useToast();
    const [selectedField, setSelectedField] = useState<{ id: string, type: string } | null>(null);
    const [activeSection, setActiveSection] = useState<'IDENTITY' | 'MEDICAL'>('IDENTITY');
    const [isAdding, setIsAdding] = useState(false);
    const [newEntryForm, setNewEntryForm] = useState<Partial<RegistrationField>>({
        label: '', type: 'text', section: 'IDENTITY', width: 'half', isCritical: false
    });
    
    const handleFieldClick = (id: string, type: string) => {
        setSelectedField({ id, type });
    };

    const handleUpdateLabelMap = (id: string, newTitle: string) => {
        const cleanId = id.startsWith('core_') ? id.replace('core_', '') : id;
        const newMap = { ...settings.fieldLabels, [cleanId]: newTitle };
        onUpdateSettings({ ...settings, fieldLabels: newMap });
    };

    const handleUpdateDynamicField = (id: string, updates: Partial<RegistrationField>) => {
        const cleanId = id.startsWith('field_') ? id.replace('field_', '') : id;
        const newFields = settings.identityFields.map(f => f.id === cleanId ? { ...f, ...updates } : f);
        onUpdateSettings({ ...settings, identityFields: newFields });
    };

    const toggleCriticalStatus = (id: string) => {
        const currentRegistry = settings.criticalRiskRegistry || [];
        const isCurrentlyCritical = currentRegistry.includes(id);
        let nextRegistry: string[];
        if (isCurrentlyCritical) {
            nextRegistry = currentRegistry.filter(i => i !== id);
            toast.info("Priority flag removed.");
        } else {
            nextRegistry = [...currentRegistry, id];
            toast.success("Marked as Critical Risk.");
        }
        onUpdateSettings({ ...settings, criticalRiskRegistry: nextRegistry });
    };

    const handleUpdateRegistryOptions = (key: string, nextOptions: string[]) => {
        onUpdateSettings({ ...settings, [key]: nextOptions });
        toast.success("Registry synchronized.");
    };

    const handleAddRegistryOption = (key: string) => {
        const val = prompt("Enter new dropdown option:");
        if (!val || !val.trim()) return;
        const current = (settings as any)[key] as string[];
        if (current.includes(val.trim())) {
            toast.error("Duplicate option detected.");
            return;
        }
        handleUpdateRegistryOptions(key, [...current, val.trim()]);
    };

    const handleRemoveRegistryOption = (key: string, option: string) => {
        const current = (settings as any)[key] as string[];
        handleUpdateRegistryOptions(key, current.filter(o => o !== option));
    };

    const moveElement = (direction: 'up' | 'down') => {
        if (!selectedField) return;
        const orderKey = activeSection === 'IDENTITY' ? 'identityLayoutOrder' : 'medicalLayoutOrder';
        const order = [...settings[orderKey]];
        const index = order.indexOf(selectedField.id);
        if (index === -1) return;
        if (direction === 'up' && index > 0) { [order[index], order[index - 1]] = [order[index - 1], order[index]]; } 
        else if (direction === 'down' && index < order.length - 1) { [order[index], order[index + 1]] = [order[index + 1], order[index]]; } 
        else return;
        onUpdateSettings({ ...settings, [orderKey]: order });
    };

    const handleRemoveSelected = () => {
        if (!selectedField) return;
        if (selectedField.id.startsWith('core_')) { toast.error("Core fields cannot be removed."); return; }
        const orderKey = activeSection === 'IDENTITY' ? 'identityLayoutOrder' : 'medicalLayoutOrder';
        const newOrder = settings[orderKey].filter(id => id !== selectedField.id);
        let newSettings = { ...settings, [orderKey]: newOrder };
        if (selectedField.id.startsWith('field_')) {
            newSettings.identityFields = settings.identityFields.filter(f => `field_${f.id}` !== selectedField.id);
        } else if (selectedField.type === 'question') {
            newSettings.identityQuestionRegistry = settings.identityQuestionRegistry.filter(q => q !== selectedField.id);
            newSettings.femaleQuestionRegistry = settings.femaleQuestionRegistry.filter(q => q !== selectedField.id);
        } else if (selectedField.type === 'allergy') {
            newSettings.allergies = settings.allergies.filter(a => a !== selectedField.id);
        } else if (selectedField.type === 'condition') {
            newSettings.medicalConditions = settings.medicalConditions.filter(c => c !== selectedField.id);
        }
        onUpdateSettings(newSettings);
        setSelectedField(null);
        toast.success("Element removed.");
    };

    const handleSaveNewEntry = () => {
        if (!newEntryForm.label?.trim()) return;
        let newSettings = { ...settings };
        const label = newEntryForm.label;
        const type = newEntryForm.type;
        const section = newEntryForm.section;
        const width = newEntryForm.width;
        if (type === 'header') {
            const id = `header_${Date.now()}`;
            newSettings.identityFields.push({ id, label, type: 'header', section: section as any, width: 'full' });
            if (section === 'MEDICAL') newSettings.medicalLayoutOrder.push(`field_${id}`);
            else newSettings.identityLayoutOrder.push(`field_${id}`);
        } else if (section === 'MEDICAL') {
            if (type === 'boolean') { newSettings.identityQuestionRegistry.push(label); newSettings.medicalLayoutOrder.push(label); } 
            else if (type === 'text') { newSettings.medicalConditions.push(label); newSettings.medicalLayoutOrder.push(label); }
        } else {
            const id = `dyn_${Date.now()}`;
            newSettings.identityFields.push({ id, label, type: type as any, section: section as any, width: width as any });
            newSettings.identityLayoutOrder.push(`field_${id}`);
        }
        if (newEntryForm.isCritical) { newSettings.criticalRiskRegistry = [...(newSettings.criticalRiskRegistry || []), label]; }
        onUpdateSettings(newSettings);
        setIsAdding(false);
        setNewEntryForm({ label: '', type: 'text', section: 'IDENTITY', width: 'half', isCritical: false });
        toast.success("Form element registered.");
    };

    return (
        <div className="flex h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-10 bg-slate-50/20 no-scrollbar">
                <div className="max-w-4xl mx-auto space-y-12 pb-32">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Admission Design Studio</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Configure clinical intake schema & data requirements</p>
                        </div>
                        <div className="flex bg-white p-1 rounded-2xl border-2 border-slate-100 shadow-sm">
                            <button onClick={() => setActiveSection('IDENTITY')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSection === 'IDENTITY' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500 hover:text-teal-600'}`}>I. Identity</button>
                            <button onClick={() => setActiveSection('MEDICAL')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSection === 'MEDICAL' ? 'bg-lilac-600 text-white shadow-lg' : 'text-slate-500 hover:text-lilac-600'}`}>II. Medical</button>
                        </div>
                    </div>

                    <div className="bg-white p-2 rounded-[3.5rem] shadow-2xl border-4 border-white min-h-[600px] relative">
                         {activeSection === 'IDENTITY' ? (
                            <div className="p-8">
                                <RegistrationBasicInfo 
                                    formData={{}} 
                                    handleChange={() => {}} 
                                    readOnly={true} 
                                    fieldSettings={settings} 
                                    designMode={true}
                                    onFieldClick={handleFieldClick}
                                    selectedFieldId={selectedField?.id}
                                />
                            </div>
                         ) : (
                            <div className="p-8">
                                <RegistrationMedical 
                                    formData={{}} 
                                    handleChange={() => {}} 
                                    handleArrayChange={() => {}} 
                                    readOnly={true} 
                                    fieldSettings={settings} 
                                    designMode={true}
                                    onFieldClick={handleFieldClick}
                                    selectedFieldId={selectedField?.id}
                                />
                            </div>
                         )}
                    </div>
                </div>
            </div>

            <div className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20 animate-in slide-in-from-right-10">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Element Properties</h4>
                    <button onClick={() => setSelectedField(null)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                    {selectedField ? (
                        <div className="space-y-6">
                            {/* ... (property panel logic) ... */}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30 py-20">
                            <MousePointer2 size={48} strokeWidth={1}/>
                            <p className="text-xs font-black uppercase tracking-widest leading-relaxed">Select a form element to<br/>configure properties</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-teal-900 shrink-0">
                    <button onClick={() => setIsAdding(true)} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-teal-950/50 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all">
                        <Plus size={18}/> New Form Element
                    </button>
                </div>
            </div>
             {isAdding && (
                <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300"><div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAdding(false)}/><div className="relative w-full max-w-lg bg-white h-full shadow-2xl border-l-8 border-lilac-500 flex flex-col animate-in slide-in-from-right-full"><div className="p-10 border-b bg-lilac-50"><h4 className="text-2xl font-black text-lilac-900 uppercase tracking-tight">New Form Entry Wizard</h4><p className="text-[10px] font-black text-lilac-600 uppercase tracking-widest mt-1">Registry Context: Builder Interface</p></div><div className="p-10 space-y-8 flex-1 overflow-y-auto no-scrollbar"><div className="space-y-6"><div><label className="label text-[10px]">Element Label *</label><input autoFocus type="text" value={newEntryForm.label} onChange={e => setNewEntryForm({...newEntryForm, label: e.target.value})} className="input text-lg font-black" placeholder="e.g. Current Medications" /></div><div className="grid grid-cols-2 gap-4"><div><label className="label text-[10px]">Registry Section</label><select value={newEntryForm.section} onChange={e => setNewEntryForm({...newEntryForm, section: e.target.value as any})} className="input text-sm font-bold"><option value="IDENTITY">Section I: Identity</option><option value="CONTACT">Section II: Contact</option><option value="MEDICAL">Section V: Medical</option><option value="DENTAL">Section IV: Dental</option></select></div><div><label className="label text-[10px]">Input Interaction</label><select value={newEntryForm.type} onChange={e => setNewEntryForm({...newEntryForm, type: e.target.value as any})} className="input text-sm font-bold"><option value="text">Short Text</option><option value="textarea">Narrative (Long Text)</option><option value="dropdown">Registry Dropdown</option><option value="boolean">Yes/No Toggle</option><option value="header">Section Card Header</option></select></div></div></div></div><div className="p-10 border-t bg-white flex gap-3"><button onClick={() => setIsAdding(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button><button onClick={handleSaveNewEntry} className="flex-[2] py-5 bg-teal-700 text-white font-black uppercase text-xs rounded-2xl shadow-xl hover:scale-[1.02] transition-all">Add to Registry</button></div></div></div>
            )}
        </div>
    );
};

export default FormBuilder;

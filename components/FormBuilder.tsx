
import React, { useMemo, useState } from 'react';
import { FieldSettings, RegistrationField } from '../types';
import { Plus, X, ArrowUp, ArrowDown, MousePointer2, PlusCircle, Edit3, Eye, Code, Trash2 } from 'lucide-react';
import { useToast } from './ToastSystem';
import RegistrationBasicInfo from './RegistrationBasicInfo';
// Fix: Change to named import for RegistrationMedical to resolve module export issue.
import { RegistrationMedical } from './RegistrationMedical';
import CoreFieldEditor from './form-builder/CoreFieldEditor';
import DynamicFieldEditor from './form-builder/DynamicFieldEditor';
import QuestionEditor from './form-builder/QuestionEditor';
import RegistryEditor from './form-builder/RegistryEditor';
import { generateUid } from '../constants';
import { useSettings } from '../contexts/SettingsContext';


const FormBuilder: React.FC = () => {
    const { fieldSettings: settings, handleUpdateSettings: onUpdateSettings } = useSettings();
    const toast = useToast();
    
    const [selectedField, setSelectedField] = useState<{ id: string, type: string } | null>(null);
    const [activeSection, setActiveSection] = useState<'IDENTITY' | 'MEDICAL'>('IDENTITY');
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    
    const handleFieldClick = (id: string, type: string) => {
        if(isPreviewMode) return;
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

    const handleUpdateQuestion = (oldQuestion: string, newQuestion: string) => {
        const updateRegistry = (registry: string[]) => registry.map(q => q === oldQuestion ? newQuestion : q);
        const newSettings = {
            ...settings,
            identityQuestionRegistry: updateRegistry(settings.identityQuestionRegistry),
            femaleQuestionRegistry: updateRegistry(settings.femaleQuestionRegistry),
            medicalLayoutOrder: updateRegistry(settings.medicalLayoutOrder),
            criticalRiskRegistry: updateRegistry(settings.criticalRiskRegistry),
        };
        onUpdateSettings(newSettings);
        setSelectedField({ id: newQuestion, type: 'question' }); // Update selection
    };

    const toggleCriticalStatus = (id: string) => {
        const currentRegistry = settings.criticalRiskRegistry || [];
        const isCurrentlyCritical = currentRegistry.includes(id);
        const nextRegistry = isCurrentlyCritical
            ? currentRegistry.filter(i => i !== id)
            : [...currentRegistry, id];
        onUpdateSettings({ ...settings, criticalRiskRegistry: nextRegistry });
        toast.info(`Critical risk status ${isCurrentlyCritical ? 'removed' : 'added'}.`);
    };

    const handleUpdateRegistryOptions = (key: keyof FieldSettings, nextOptions: string[]) => {
        onUpdateSettings({ ...settings, [key]: nextOptions });
    };

    const moveElement = (direction: 'up' | 'down') => {
        if (!selectedField) return;
        const orderKey = activeSection === 'IDENTITY' ? 'identityLayoutOrder' : 'medicalLayoutOrder';
        const order = [...(settings as any)[orderKey]];
        const index = order.indexOf(selectedField.id);

        if (index === -1) return;

        const swap = (arr: any[], i1: number, i2: number) => { [arr[i1], arr[i2]] = [arr[i2], arr[i1]]; };

        if (direction === 'up' && index > 0) swap(order, index, index - 1);
        else if (direction === 'down' && index < order.length - 1) swap(order, index, index + 1);
        else return;

        onUpdateSettings({ ...settings, [orderKey]: order });
    };

    const handleRemoveSelected = () => {
        if (!selectedField) return;
        if (selectedField.id.startsWith('core_')) {
            toast.error("Core fields cannot be removed for compliance reasons.");
            return;
        }
        
        const orderKey = activeSection === 'IDENTITY' ? 'identityLayoutOrder' : 'medicalLayoutOrder';
        let newSettings = { ...settings };
        
        (newSettings as any)[orderKey] = (settings as any)[orderKey].filter((id: string) => id !== selectedField.id);

        if (selectedField.id.startsWith('field_')) {
            newSettings.identityFields = settings.identityFields.filter(f => `field_${f.id}` !== selectedField.id);
        } else if (selectedField.type === 'question') {
            newSettings.identityQuestionRegistry = settings.identityQuestionRegistry.filter(q => q !== selectedField.id);
            newSettings.femaleQuestionRegistry = settings.femaleQuestionRegistry.filter(q => q !== selectedField.id);
        }
        
        onUpdateSettings(newSettings);
        setSelectedField(null);
        toast.success("Element removed from form.");
    };
    
    const handleAddNewField = () => {
        const newId = generateUid('field');
        
        const newField: RegistrationField = {
            id: newId,
            label: 'New Custom Field',
            type: 'text',
            section: activeSection === 'IDENTITY' ? 'IDENTITY' : 'MEDICAL',
            width: 'full'
        };
    
        const newIdentityFields = [...settings.identityFields, newField];
        
        let newSettingsUpdate: Partial<FieldSettings> = { identityFields: newIdentityFields };

        if (activeSection === 'IDENTITY') {
            newSettingsUpdate.identityLayoutOrder = [...settings.identityLayoutOrder, `field_${newId}`];
        } else { // MEDICAL
            newSettingsUpdate.medicalLayoutOrder = [...settings.medicalLayoutOrder, `field_${newId}`];
        }
        
        onUpdateSettings({ ...settings, ...newSettingsUpdate });
        
        toast.success(`New field added to the ${activeSection} section.`);
        setSelectedField({ id: `field_${newId}`, type: 'identity' }); // Select the new field
    };

    const renderPropertiesPanel = () => {
        if (!selectedField) {
            return (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30 py-20">
                    <MousePointer2 size={48} strokeWidth={1}/>
                    <p className="text-xs font-black uppercase tracking-widest leading-relaxed">Select a form element to<br/>configure its properties</p>
                </div>
            );
        }

        const { id, type } = selectedField;
        const isCritical = (settings.criticalRiskRegistry || []).includes(id);

        if (id.startsWith('core_')) {
            const fieldId = id.replace('core_', '');
            return <CoreFieldEditor label={settings.fieldLabels[fieldId] || fieldId} onUpdateLabel={(newLabel) => handleUpdateLabelMap(id, newLabel)} />;
        }

        if (id.startsWith('field_')) {
            const field = settings.identityFields.find(f => `field_${f.id}` === id);
            if (!field) return null;
            return <DynamicFieldEditor field={field} onUpdateField={(updates) => handleUpdateDynamicField(id, updates)} isCritical={isCritical} onToggleCritical={() => toggleCriticalStatus(id)} />;
        }
        
        if (type === 'question') {
            return <QuestionEditor question={id} onUpdateQuestion={handleUpdateQuestion} isCritical={isCritical} onToggleCritical={() => toggleCriticalStatus(id)} />;
        }
        
        if (type === 'condition') {
             return <RegistryEditor title="Medical Conditions" items={settings.medicalConditions} onAddItem={(item) => handleUpdateRegistryOptions('medicalConditions', [...settings.medicalConditions, item])} onRemoveItem={(item) => handleUpdateRegistryOptions('medicalConditions', settings.medicalConditions.filter(i => i !== item))} />
        }
         
        if (type === 'allergy') {
             return <RegistryEditor title="Allergies" items={settings.allergies.filter(a => a !== 'None')} onAddItem={(item) => handleUpdateRegistryOptions('allergies', [...settings.allergies, item])} onRemoveItem={(item) => handleUpdateRegistryOptions('allergies', settings.allergies.filter(i => i !== item))} />
        }

        return <div className="p-4 text-xs italic text-slate-400">This element type has no configurable properties.</div>
    };


    return (
        <div className="flex h-full overflow-hidden relative">
            <div className={`flex-1 overflow-y-auto p-10 bg-slate-50/20 no-scrollbar transition-all duration-500`}>
                <div className="max-w-4xl mx-auto space-y-12 pb-32">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Admission Design Studio</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Configure clinical intake schema & data requirements</p>
                        </div>
                        <div className="flex gap-2">
                             <div className="flex bg-white p-1 rounded-2xl border-2 border-slate-100 shadow-sm">
                                <button onClick={() => setActiveSection('IDENTITY')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSection === 'IDENTITY' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500 hover:text-teal-600'}`}>I. Identity</button>
                                <button onClick={() => setActiveSection('MEDICAL')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSection === 'MEDICAL' ? 'bg-lilac-600 text-white shadow-lg' : 'text-slate-500 hover:text-lilac-600'}`}>II. Medical</button>
                            </div>
                             <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${isPreviewMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 border-2 border-slate-100'}`}>
                                {isPreviewMode ? <Code size={14}/> : <Eye size={14}/>} {isPreviewMode ? 'Editor' : 'Preview'}
                            </button>
                        </div>
                    </div>

                    <div className={`bg-white p-2 rounded-[3.5rem] shadow-2xl border-4 border-white min-h-[600px] relative transition-all duration-500 ${isPreviewMode ? 'ring-8 ring-blue-500/10' : ''}`}>
                         {activeSection === 'IDENTITY' ? (
                            <div className="p-8">
                                <RegistrationBasicInfo 
                                    formData={{sex: 'Female', age: 16}} 
                                    handleChange={() => {}}
                                    handleCustomChange={() => {}}
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
                                    formData={{customFields: {}}}
                                    registryAnswers={{}}
                                    onRegistryChange={() => {}}
                                    allergies={[]}
                                    onAllergyChange={() => {}}
                                    medicalConditions={[]}
                                    onConditionChange={() => {}}
                                    readOnly={true} 
                                    fieldSettings={settings} 
                                    designMode={true}
                                    onFieldClick={handleFieldClick}
                                    selectedFieldId={selectedField?.id}
                                    onCustomChange={() => {}}
                                />
                            </div>
                         )}
                         
                         {!isPreviewMode && (
                             <div className="p-8">
                                 <button onClick={handleAddNewField} className="w-full py-6 border-4 border-dashed border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 rounded-[2.5rem] flex items-center justify-center gap-4 text-slate-400 hover:text-teal-600 transition-all">
                                     <PlusCircle size={24}/>
                                     <span className="font-black uppercase tracking-widest text-sm">Add New Field to this Section</span>
                                 </button>
                             </div>
                         )}
                    </div>
                </div>
            </div>

            <div className={`w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20 transition-all duration-500 ease-in-out transform shrink-0 ${isPreviewMode ? 'translate-x-[150%]' : 'translate-x-0'}`}>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Element Properties</h4>
                    <button onClick={() => setSelectedField(null)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                    {renderPropertiesPanel()}
                </div>

                {selectedField && (
                    <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-3">
                        <div className="flex gap-2">
                             <button onClick={() => moveElement('up')} className="flex-1 p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-teal-600 hover:border-teal-200"><ArrowUp size={16}/></button>
                             <button onClick={() => moveElement('down')} className="flex-1 p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-teal-600 hover:border-teal-200"><ArrowDown size={16}/></button>
                        </div>
                        <button onClick={handleRemoveSelected} className="w-full py-3 bg-red-50 text-red-700 rounded-lg font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 border border-red-100 hover:bg-red-100">
                            <Trash2 size={14}/> Remove Element
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormBuilder;

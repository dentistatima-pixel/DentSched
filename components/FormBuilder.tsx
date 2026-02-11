import React, { useMemo, useState, useRef, useEffect } from 'react';
import { FieldSettings, RegistrationField } from '../types';
import { Plus, X, ArrowUp, ArrowDown, MousePointer2, PlusCircle, Edit3, Eye, Code, Trash2, GripHorizontal, Type, AlignLeft, Phone, Mail, ChevronDown, ToggleRight, CheckSquare, Heading2, HelpCircle, Calendar, Activity } from 'lucide-react';
import { useToast } from './ToastSystem';
import RegistrationBasicInfo from './RegistrationBasicInfo';
import RegistrationMedical from './RegistrationMedical';
import RegistrationDental from './RegistrationDental';
import DynamicFieldEditor from './form-builder/DynamicFieldEditor';
import QuestionEditor from './form-builder/QuestionEditor';
import RegistryEditor from './form-builder/RegistryEditor';
import { generateUid } from '../constants';
import { useSettings } from '../contexts/SettingsContext';


const FormBuilder: React.FC = () => {
    const { fieldSettings: settings, handleUpdateSettings: onUpdateSettings } = useSettings();
    const toast = useToast();
    
    const [selectedField, setSelectedField] = useState<{ id: string, type: string } | null>(null);
    const [activeSection, setActiveSection] = useState<'IDENTITY' | 'MEDICAL' | 'DENTAL'>('IDENTITY');
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    
    // State for floating panel
    const [panelPosition, setPanelPosition] = useState(() => ({
        x: window.innerWidth - 424, // 96 * 4 (w-96) + 32 (padding)
        y: 20
    }));
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const panelRef = useRef<HTMLDivElement>(null);


    const handleFieldClick = (id: string, type: string) => {
        if(isPreviewMode) return;
        setSelectedField({ id, type });
    };

    const handleUpdateDynamicField = (id: string, updates: Partial<RegistrationField>) => {
        const fieldId = id.startsWith('core_') ? id.replace('core_', '') : id.startsWith('field_') ? id.replace('field_', '') : id;
        
        const newFields = settings.identityFields.map(f => {
            if ((f.patientKey && f.patientKey === fieldId) || f.id === fieldId) {
                // If label is changed, update fieldLabels map as well
                if (updates.label && f.isCore && f.patientKey) {
                    const newFieldLabels = { ...settings.fieldLabels, [f.patientKey]: updates.label };
                    onUpdateSettings({ ...settings, fieldLabels: newFieldLabels, identityFields: settings.identityFields.map(field => field.id === f.id ? { ...f, ...updates } : field) });
                    return { ...f, ...updates };
                }
                return { ...f, ...updates };
            }
            return f;
        });
        
        const finalSettings = { ...settings, identityFields: newFields };

        // Also update the label in fieldLabels for core fields for consistency
        if(updates.label && id.startsWith('core_')) {
            const patientKey = id.replace('core_', '');
            finalSettings.fieldLabels = { ...settings.fieldLabels, [patientKey]: updates.label };
        }
        
        onUpdateSettings(finalSettings);
    };

    const handleUpdateQuestion = (oldQuestion: string, newQuestion: string, registryKey: keyof FieldSettings) => {
        const updateRegistry = (registry: string[]) => registry.map(q => q === oldQuestion ? newQuestion : q);
        const newSettings = {
            ...settings,
            [registryKey]: updateRegistry(settings[registryKey] as string[]),
            medicalLayoutOrder: updateRegistry(settings.medicalLayoutOrder),
            dentalLayoutOrder: updateRegistry(settings.dentalLayoutOrder),
            criticalRiskRegistry: updateRegistry(settings.criticalRiskRegistry),
        };
        onUpdateSettings(newSettings);
        setSelectedField({ id: newQuestion, type: selectedField?.type || 'question' }); // Update selection
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
        const orderKey = activeSection === 'IDENTITY' ? 'identityLayoutOrder' : activeSection === 'MEDICAL' ? 'medicalLayoutOrder' : 'dentalLayoutOrder';
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
        
        const orderKey = activeSection === 'IDENTITY' ? 'identityLayoutOrder' : activeSection === 'MEDICAL' ? 'medicalLayoutOrder' : 'dentalLayoutOrder';
        let newSettings = { ...settings };
        
        (newSettings as any)[orderKey] = (settings as any)[orderKey].filter((id: string) => id !== selectedField.id);

        if (selectedField.id.startsWith('field_')) {
            newSettings.identityFields = settings.identityFields.filter(f => `field_${f.id}` !== selectedField.id);
        } else if (selectedField.type === 'question') {
            newSettings.identityQuestionRegistry = settings.identityQuestionRegistry.filter(q => q !== selectedField.id);
            newSettings.femaleQuestionRegistry = settings.femaleQuestionRegistry.filter(q => q !== selectedField.id);
        } else if (selectedField.type === 'dentalQuestion') {
            newSettings.dentalHistoryRegistry = settings.dentalHistoryRegistry.filter(q => q !== selectedField.id);
        }
        
        onUpdateSettings(newSettings);
        setSelectedField(null);
        toast.success("Element removed from form.");
    };
    
    const handleAddNewField = (fieldType: RegistrationField['type']) => {
        const newId = generateUid('field');
        
        const newField: RegistrationField = {
            id: newId,
            label: `New ${fieldType.charAt(0).toUpperCase() + fieldType.slice(1).replace('-', ' ')} Field`,
            type: fieldType,
            section: activeSection,
            width: 'full'
        };
    
        const newIdentityFields = [...settings.identityFields, newField];
        let newSettingsUpdate: Partial<FieldSettings> = { identityFields: newIdentityFields };

        const orderKey = activeSection === 'IDENTITY' ? 'identityLayoutOrder' : activeSection === 'MEDICAL' ? 'medicalLayoutOrder' : 'dentalLayoutOrder';
        (newSettingsUpdate as any)[orderKey] = [...(settings as any)[orderKey], `field_${newId}`];
        
        onUpdateSettings({ ...settings, ...newSettingsUpdate });
        
        toast.success(`New ${fieldType} field added to ${activeSection} section.`);
        setSelectedField({ id: `field_${newId}`, type: 'identity' });
    };
    
    const handleAddNewDentalQuestion = () => {
        const newQuestion = prompt("Enter the new dental history question:");
        if (newQuestion && newQuestion.trim()) {
            const trimmed = newQuestion.trim();
            if (settings.dentalHistoryRegistry.includes(trimmed)) {
                toast.error("This question already exists.");
                return;
            }
            const newSettings = {
                ...settings,
                dentalHistoryRegistry: [...settings.dentalHistoryRegistry, trimmed],
                dentalLayoutOrder: [...settings.dentalLayoutOrder, trimmed]
            };
            onUpdateSettings(newSettings);
            setSelectedField({ id: trimmed, type: 'dentalQuestion' });
        }
    };

    // --- DRAGGING LOGIC ---
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        dragOffset.current = {
            x: e.clientX - panelPosition.x,
            y: e.clientY - panelPosition.y,
        };
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !panelRef.current) return;
            let newX = e.clientX - dragOffset.current.x;
            let newY = e.clientY - dragOffset.current.y;

            // Constrain to viewport
            const panelWidth = panelRef.current.offsetWidth;
            newX = Math.max(8, Math.min(newX, window.innerWidth - panelWidth - 8));
            newY = Math.max(8, Math.min(newY, window.innerHeight - 60)); // 60px for footer/header clearance

            setPanelPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);


    const renderPropertiesPanel = () => {
        if (!selectedField) {
            const fieldTypes: { label: string; type: RegistrationField['type']; icon: React.ElementType }[] = [
                 { label: 'Short Text', type: 'text', icon: Type },
                 { label: 'Narrative', type: 'textarea', icon: AlignLeft },
                 { label: 'Date', type: 'date', icon: Calendar },
                 { label: 'Phone', type: 'tel', icon: Phone },
                 { label: 'Email', type: 'email', icon: Mail },
                 { label: 'Dropdown', type: 'dropdown', icon: ChevronDown },
                 { label: 'Yes/No Toggle', type: 'boolean', icon: ToggleRight },
                 { label: 'Checklist', type: 'checklist', icon: CheckSquare },
                 { label: 'Section Header', type: 'header', icon: Heading2 },
                 { label: 'Conditional Text', type: 'conditional-text', icon: HelpCircle },
            ];

            return (
                <div className="animate-in fade-in-50 duration-500">
                    <h4 className="label text-sm">Add Elements</h4>
                    <p className="text-xs text-slate-500 mb-6">Select a field type to add it to the current section.</p>
                    <div className="grid grid-cols-2 gap-2">
                        {activeSection !== 'DENTAL' ? fieldTypes.map(ft => (
                            <button key={ft.type} onClick={() => handleAddNewField(ft.type)} className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-teal-50 hover:text-teal-800 rounded-2xl text-slate-700 transition-all text-left border border-slate-100 hover:border-teal-200 hover:shadow-lg">
                                <ft.icon size={18} className="text-teal-600"/>
                                <span className="text-xs font-black uppercase tracking-wider">{ft.label}</span>
                            </button>
                        )) : (
                            <button onClick={handleAddNewDentalQuestion} className="col-span-2 flex items-center gap-3 p-4 bg-slate-50 hover:bg-teal-50 hover:text-teal-800 rounded-2xl text-slate-700 transition-all text-left border border-slate-100 hover:border-teal-200 hover:shadow-lg">
                                <PlusCircle size={18} className="text-teal-600"/>
                                <span className="text-xs font-black uppercase tracking-wider">Add Yes/No Question</span>
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        const { id, type } = selectedField;
        
        // --- UNIFIED FIELD LOGIC ---
        const fieldId = id.startsWith('core_') ? id.replace('core_', '') : id.startsWith('field_') ? id.replace('field_', '') : id;
        const field = settings.identityFields.find(f => (f.patientKey && f.patientKey === fieldId) || f.id === fieldId);

        if (field) {
            return <DynamicFieldEditor field={field} onUpdateField={(updates) => handleUpdateDynamicField(id, updates)} />;
        }
        
        if (type === 'question' || type === 'dentalQuestion') {
            const registryKey = type === 'question' ? 'identityQuestionRegistry' : 'dentalHistoryRegistry';
            const isCritical = (settings.criticalRiskRegistry || []).includes(id);
            return <QuestionEditor question={id} onUpdateQuestion={(old, newQ) => handleUpdateQuestion(old, newQ, registryKey)} isCritical={isCritical} onToggleCritical={() => toggleCriticalStatus(id)} />;
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
        <div className="relative">
            {/* Form Canvas Area */}
            <div className={`p-10 bg-slate-50/20 no-scrollbar`}>
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
                                <button onClick={() => setActiveSection('DENTAL')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSection === 'DENTAL' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-blue-600'}`}>III. Dental</button>
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
                                    formData={{sex: 'Female'}} 
                                    handleChange={() => {}}
                                    handleCustomChange={() => {}}
                                    onRegistryChange={() => {}}
                                    readOnly={true} 
                                    fieldSettings={settings} 
                                    designMode={!isPreviewMode}
                                    onFieldClick={handleFieldClick}
                                    selectedFieldId={selectedField?.id}
                                    errors={null}
                                />
                            </div>
                         ) : activeSection === 'MEDICAL' ? (
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
                                    designMode={!isPreviewMode}
                                    onFieldClick={handleFieldClick}
                                    selectedFieldId={selectedField?.id}
                                    onCustomChange={() => {}}
                                />
                            </div>
                         ) : (
                            <div className="p-8">
                                <RegistrationDental
                                    formData={{}}
                                    handleChange={() => {}}
                                    registryAnswers={{}}
                                    onRegistryChange={() => {}}
                                    readOnly={true}
                                    fieldSettings={settings}
                                    designMode={!isPreviewMode}
                                    onFieldClick={handleFieldClick}
                                    selectedFieldId={selectedField?.id}
                                />
                            </div>
                         )}
                    </div>
                </div>
            </div>

            {/* Floating Properties Panel */}
            <div 
                ref={panelRef}
                className={`fixed w-96 bg-white/80 backdrop-blur-xl border border-slate-200 flex flex-col shadow-2xl z-20 rounded-[2rem] overflow-hidden ${isPreviewMode ? 'hidden' : ''}`}
                style={{ top: panelPosition.y, left: panelPosition.x, cursor: isDragging ? 'grabbing' : 'default' }}
            >
                <div 
                    onMouseDown={handleMouseDown}
                    className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 cursor-grab active:cursor-grabbing"
                >
                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Element Properties</h4>
                    <div className="flex items-center gap-2">
                         <GripHorizontal size={20} className="text-slate-300"/>
                         <button onClick={() => setSelectedField(null)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                    {renderPropertiesPanel()}
                </div>

                {selectedField && (
                    <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-3">
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
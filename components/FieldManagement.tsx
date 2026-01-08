
import React, { useState, useMemo } from 'react';
import { 
  FieldSettings, User, UserRole, AuditLogEntry, Patient, ClinicalIncident, 
  RegistrationField
} from '../types';
import { 
  Plus, Trash2, Edit2, Sliders, Settings, ChevronRight, DollarSign, ToggleLeft, 
  Box, MapPin, User as UserIcon, Pill, 
  ShieldAlert, ShieldCheck, Shield, Database, Archive, Layers, Receipt, Activity, 
  Sparkles, Zap, Monitor, Wrench, ClipboardList, 
  Stethoscope, Save, UserCheck, Armchair, FileText, 
  Info, ArrowUp, ArrowDown, Layout, HelpCircle, X, ChevronLeft, LayoutPanelLeft, Move, Trash, PanelLeftClose, PanelLeftOpen, GripVertical, CheckCircle2, Circle
} from 'lucide-react';
import RegistrationBasicInfo from './RegistrationBasicInfo';
import RegistrationMedical from './RegistrationMedical';
import { useToast } from './ToastSystem';

interface FieldManagementProps {
  settings: FieldSettings;
  onUpdateSettings: (newSettings: FieldSettings) => void;
  staff: User[];
  auditLog: AuditLogEntry[];
  patients: Patient[];
  onPurgePatient: (id: string) => void;
  auditLogVerified: boolean | null;
  encryptionKey: string | null;
  incidents: ClinicalIncident[];
  onSaveIncident: (i: ClinicalIncident) => void;
}

const FieldManagement: React.FC<FieldManagementProps> = ({ 
  settings, onUpdateSettings, auditLogVerified, staff 
}) => {
    const toast = useToast();
    const [activeRegistry, setActiveRegistry] = useState<string>('branding');
    const [isAdding, setIsAdding] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Visual Builder States
    const [selectedField, setSelectedField] = useState<{ id: string, type: string } | null>(null);
    const [activeSection, setActiveSection] = useState<'IDENTITY' | 'MEDICAL' | 'DENTAL'>('IDENTITY');

    // Structured "New Entry" form state
    const [newEntryForm, setNewEntryForm] = useState<Partial<RegistrationField>>({
        label: '',
        type: 'text',
        section: 'IDENTITY',
        width: 'half',
        isCritical: false
    });

    const sidebarGroups = [
        { key: 'core', label: 'Practice Identity', icon: Activity, items: [
            { id: 'branding', label: 'Practice Identity', icon: Sparkles }
        ]},
        { key: 'form_builder', label: 'II. Admission Design', icon: Layout, items: [
            { id: 'patient_registry_form', label: 'Visual Form Builder', icon: LayoutPanelLeft }
        ]},
        { key: 'catalog', label: 'III. Clinical Catalog', icon: Box, items: [
            { id: 'procedures', label: 'Procedure Catalog', icon: DollarSign },
            { id: 'medications', label: 'Pharmacy Registry', icon: Pill },
            { id: 'shadeGuides', label: 'Shade Guides', icon: Layers }
        ]},
        { key: 'finance', label: 'IV. Financial & HR', icon: Receipt, items: [
            { id: 'paymentModes', label: 'Payment Modes', icon: DollarSign },
            { id: 'staff', label: 'Clinician Registry', icon: UserIcon }
        ]},
        { key: 'infrastructure', label: 'V. Infrastructure', icon: Wrench, items: [
            { id: 'branches', label: 'Branch Locations', icon: MapPin },
            { id: 'resources', label: 'Physical Resources', icon: Armchair }
        ]}
    ];

    // --- CORE TO REGISTRY MAPPING ---
    const coreToRegistryMap: Record<string, string> = {
        'core_suffix': 'suffixes',
        'core_sex': 'sex',
        'core_bloodGroup': 'bloodGroups',
        'core_civilStatus': 'civilStatus'
    };

    const handleFieldClick = (id: string, type: string) => {
        setSelectedField({ id, type });
        setIsSidebarCollapsed(false);
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
        toast.success("Option list synchronized.");
    };

    const handleAddRegistryOption = (key: string) => {
        const val = prompt("Enter new dropdown option:");
        if (!val) return;
        const current = (settings as any)[key] as string[];
        handleUpdateRegistryOptions(key, [...current, val]);
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

        if (direction === 'up' && index > 0) {
            [order[index], order[index - 1]] = [order[index - 1], order[index]];
        } else if (direction === 'down' && index < order.length - 1) {
            [order[index], order[index + 1]] = [order[index + 1], order[index]];
        } else return;

        onUpdateSettings({ ...settings, [orderKey]: order });
    };

    const handleRemoveSelected = () => {
        if (!selectedField) return;
        if (selectedField.id.startsWith('core_')) {
            toast.error("Core fields cannot be removed.");
            return;
        }

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
            if (type === 'boolean') {
                newSettings.identityQuestionRegistry.push(label);
                newSettings.medicalLayoutOrder.push(label);
            } else if (type === 'text') {
                // In medical, free text is usually an 'Allergy' or 'Condition' with narrative
                newSettings.medicalConditions.push(label);
                newSettings.medicalLayoutOrder.push(label);
            }
        } else {
            const id = `dyn_${Date.now()}`;
            newSettings.identityFields.push({ id, label, type: type as any, section: section as any, width: width as any });
            newSettings.identityLayoutOrder.push(`field_${id}`);
        }

        if (newEntryForm.isCritical) {
            newSettings.criticalRiskRegistry = [...(newSettings.criticalRiskRegistry || []), label];
        }

        onUpdateSettings(newSettings);
        setIsAdding(false);
        setNewEntryForm({ label: '', type: 'text', section: 'IDENTITY', width: 'half', isCritical: false });
        toast.success("Form element registered.");
    };

    const renderFormBuilder = () => {
        const selectedId = selectedField?.id;
        const isCore = selectedId?.startsWith('core_');
        const isDyn = selectedId?.startsWith('field_');
        const cleanId = isCore ? selectedId!.replace('core_', '') : (isDyn ? selectedId!.replace('field_', '') : selectedId);
        
        const coreFieldLabel = (isCore || isDyn) ? (settings.fieldLabels[cleanId!] || cleanId) : null;
        const dynamicField = isDyn ? settings.identityFields.find(f => f.id === cleanId) : null;
        
        const registryKey = isDyn ? dynamicField?.registryKey : (isCore ? coreToRegistryMap[selectedId!] : null);
        const registryOptions = registryKey ? (settings as any)[registryKey] as string[] : null;
        const isCritical = (settings.criticalRiskRegistry || []).includes(selectedId!);

        return (
            <div className="flex h-full animate-in fade-in duration-500 overflow-hidden bg-slate-50/50 relative">
                <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
                        <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl border-4 border-white overflow-hidden flex flex-col">
                            <div className="p-6 md:p-10 bg-teal-900 text-white shrink-0 relative">
                                <div className="flex items-center gap-4">
                                    <div className="bg-lilac-500 p-2 md:p-3 rounded-2xl shadow-lg"><LayoutPanelLeft size={28} className="md:w-8 md:h-8" /></div>
                                    <div>
                                        <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight leading-none">Admission Form</h2>
                                        <p className="text-[10px] md:text-xs font-black text-teal-300 uppercase tracking-[0.2em] mt-1 md:mt-2">Visual Layout Architect Mode</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all md:hidden"
                                >
                                    {isSidebarCollapsed ? <PanelLeftOpen size={20}/> : <PanelLeftClose size={20}/>}
                                </button>
                            </div>

                            <div className="bg-slate-50 px-4 md:px-8 border-b border-slate-200 flex gap-1 overflow-x-auto no-scrollbar">
                                {(['IDENTITY', 'MEDICAL'] as const).map(tab => (
                                    <button 
                                        key={tab}
                                        onClick={() => setActiveSection(tab)}
                                        className={`py-4 md:py-6 px-4 md:px-8 font-black text-[10px] md:text-xs uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${activeSection === tab ? 'border-teal-600 text-teal-900 bg-white' : 'border-transparent text-slate-400'}`}
                                    >
                                        {tab} Design
                                    </button>
                                ))}
                            </div>

                            <div className="p-4 md:p-10 bg-white min-h-[600px] md:min-h-[800px]">
                                {activeSection === 'IDENTITY' ? (
                                    <RegistrationBasicInfo 
                                        formData={{}} 
                                        handleChange={() => {}} 
                                        fieldSettings={settings} 
                                        designMode={true} 
                                        onFieldClick={handleFieldClick}
                                        selectedFieldId={selectedId}
                                    />
                                ) : (
                                    <RegistrationMedical 
                                        formData={{}} 
                                        handleChange={() => {}} 
                                        handleArrayChange={() => {}} 
                                        fieldSettings={settings} 
                                        designMode={true}
                                        onFieldClick={handleFieldClick}
                                        selectedFieldId={selectedId}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`
                    fixed md:relative right-0 top-0 bottom-0 z-50
                    bg-white border-l border-slate-200 shadow-2xl flex flex-col shrink-0 transition-all duration-500
                    ${isSidebarCollapsed ? 'w-0 overflow-hidden md:w-16' : 'w-80 md:w-96 lg:w-80'}
                `}>
                    {isSidebarCollapsed ? (
                        <div className="flex flex-col items-center py-8 gap-6 h-full">
                            <button onClick={() => setIsSidebarCollapsed(false)} className="p-3 text-lilac-600 bg-lilac-50 rounded-xl hover:bg-lilac-100 transition-all shadow-sm">
                                <PanelLeftOpen size={24}/>
                            </button>
                        </div>
                    ) : (
                        <>
                        <div className="p-6 border-b bg-lilac-50 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2 text-lilac-700 font-black uppercase text-[10px] tracking-widest mb-1"><Monitor size={14}/> Field Inspector</div>
                                <h4 className="text-sm font-black text-lilac-900 uppercase truncate max-w-[180px]">{selectedId || 'Select a field'}</h4>
                            </div>
                            <button onClick={() => setIsSidebarCollapsed(true)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                                <PanelLeftClose size={20}/>
                            </button>
                        </div>

                        <div className="p-6 space-y-8 flex-1 overflow-y-auto no-scrollbar">
                            {!selectedField ? (
                                <div className="py-20 text-center space-y-4 opacity-40">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner"><Move size={32} className="text-slate-300"/></div>
                                    <p className="text-xs font-bold text-slate-400 uppercase leading-relaxed px-4">Click any field in the form preview to edit.</p>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in slide-in-from-right-2">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Clinical Priority</span>
                                            <button 
                                                onClick={() => toggleCriticalStatus(selectedId!)}
                                                className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${isCritical ? 'bg-red-600 justify-end' : 'bg-slate-300 justify-start'}`}
                                            >
                                                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                                            </button>
                                        </div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase leading-tight">If active, this field generates an automated alert in the Clinical Command Center.</div>
                                    </div>

                                    <div>
                                        <label className="label text-[10px] font-black">Display Narrative</label>
                                        <input 
                                            type="text" 
                                            value={isDyn ? (dynamicField?.label || '') : (coreFieldLabel !== null ? coreFieldLabel : selectedId)}
                                            onChange={e => {
                                                if (isDyn) handleUpdateDynamicField(selectedId!, { label: e.target.value });
                                                else if (isCore) handleUpdateLabelMap(selectedId!, e.target.value);
                                            }}
                                            className="input text-sm font-bold shadow-inner"
                                            placeholder="Enter label..."
                                        />
                                    </div>

                                    {registryOptions && registryKey && (
                                        <div className="bg-white rounded-2xl border-2 border-teal-100 p-4 space-y-4 animate-in zoom-in-95">
                                            <div className="flex justify-between items-center border-b border-teal-50 pb-2 mb-2">
                                                <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest">Registry Options</span>
                                                <button onClick={() => handleAddRegistryOption(registryKey)} className="text-[10px] font-black text-teal-600 hover:text-teal-800 uppercase flex items-center gap-1"><Plus size={10}/> Add Option</button>
                                            </div>
                                            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                                                {registryOptions.map(opt => (
                                                    <div key={opt} className="flex items-center justify-between p-2 bg-teal-50/50 rounded-lg group/opt">
                                                        <span className="text-xs font-bold text-teal-900">{opt}</span>
                                                        <button onClick={() => handleRemoveRegistryOption(registryKey, opt)} className="opacity-0 group-hover/opt:opacity-100 text-red-400 hover:text-red-600 transition-all"><Trash size={12}/></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {isDyn && dynamicField && (
                                        <div>
                                            <label className="label text-[10px] font-black">Layout Width</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(['quarter', 'half', 'full'] as const).map(w => (
                                                    <button 
                                                        key={w} 
                                                        onClick={() => handleUpdateDynamicField(selectedId!, { width: w })}
                                                        className={`py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all shadow-sm ${dynamicField.width === w ? 'bg-lilac-600 border-lilac-600 text-white shadow-lilac-500/20' : 'bg-white border-slate-100 text-slate-400 hover:border-lilac-200'}`}
                                                    >
                                                        {w === 'quarter' ? '25%' : w === 'half' ? '50%' : '100%'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="label text-[10px] font-black">Hierarchy</label>
                                        <div className="flex gap-2">
                                            <button onClick={() => moveElement('up')} className="flex-1 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center hover:bg-teal-50 hover:border-teal-500 transition-all group">
                                                <ArrowUp size={24} className="text-slate-400 group-hover:text-teal-600 transition-all"/>
                                            </button>
                                            <button onClick={() => moveElement('down')} className="flex-1 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center hover:bg-teal-50 hover:border-teal-500 transition-all group">
                                                <ArrowDown size={24} className="text-slate-400 group-hover:text-teal-600 transition-all"/>
                                            </button>
                                        </div>
                                    </div>

                                    {!isCore && (
                                        <div className="pt-6 border-t border-slate-100">
                                            <button onClick={handleRemoveSelected} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                                <Trash size={14}/> Remove Element
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t bg-slate-50">
                            <button onClick={() => setIsAdding(true)} className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-teal-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"><Plus size={16}/> New Entry Wizard</button>
                        </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden relative">
            <div className={`
                ${isSidebarCollapsed && activeRegistry === 'patient_registry_form' ? 'w-16' : 'w-72 md:w-80'} 
                bg-teal-900 text-white flex flex-col shrink-0 shadow-2xl z-40 overflow-y-auto no-scrollbar transition-all duration-500
            `}>
                <div className="p-8 border-b border-white/10 shrink-0">
                    <h2 className={`text-sm font-black uppercase tracking-[0.3em] text-teal-400 ${isSidebarCollapsed && activeRegistry === 'patient_registry_form' ? 'hidden' : ''}`}>Settings Hub</h2>
                    {isSidebarCollapsed && activeRegistry === 'patient_registry_form' && <Settings size={24} className="mx-auto text-teal-400 opacity-50"/>}
                </div>
                <div className="p-4 space-y-8">
                    {sidebarGroups.map(group => (
                        <div key={group.key} className="space-y-2">
                            <h4 className={`px-4 text-[10px] font-black text-teal-500 uppercase tracking-widest ${isSidebarCollapsed && activeRegistry === 'patient_registry_form' ? 'hidden' : ''}`}>{group.label}</h4>
                            {group.items.map(item => (
                                <button key={item.id} onClick={() => setActiveRegistry(item.id)} className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between transition-all ${activeRegistry === item.id ? 'bg-white text-teal-900 font-bold shadow-xl' : 'hover:bg-white/5 text-teal-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <item.icon size={20} className="shrink-0"/>
                                        <span className={`text-xs font-black uppercase tracking-widest truncate ${isSidebarCollapsed && activeRegistry === 'patient_registry_form' ? 'hidden' : ''}`}>{item.label}</span>
                                    </div>
                                    <ChevronRight size={14} className={`${activeRegistry === item.id ? 'rotate-90' : ''} ${isSidebarCollapsed && activeRegistry === 'patient_registry_form' ? 'hidden' : ''}`}/>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 bg-white relative overflow-hidden flex flex-col">
                {activeRegistry === 'patient_registry_form' ? renderFormBuilder() : (
                    <div className="p-10 space-y-12 overflow-y-auto h-full">
                        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm space-y-6 max-w-xl">
                            <div><label className="label text-xs">Practice Legal Name</label><input type="text" value={settings.clinicName} onChange={e => onUpdateSettings({...settings, clinicName: e.target.value})} className="input text-xl font-black" /></div>
                            <div><label className="label text-xs">Module Toggles</label><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{(Object.entries(settings.features) as any).map(([k, v]: any) => (
                                <button key={k} onClick={() => onUpdateSettings({...settings, features: {...settings.features, [k]: !v}})} className={`p-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest ${v ? 'bg-teal-50 border-teal-500 text-teal-900' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{k.replace(/([A-Z])/g, ' $1')}</button>
                            ))}</div></div>
                        </div>
                    </div>
                )}
            </div>

            {isAdding && (
                <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAdding(false)}/>
                    <div className="relative w-full max-w-lg bg-white h-full shadow-2xl border-l-8 border-lilac-500 flex flex-col animate-in slide-in-from-right-full">
                        <div className="p-10 border-b bg-lilac-50">
                            <h4 className="text-2xl font-black text-lilac-900 uppercase tracking-tight">New Form Entry Wizard</h4>
                            <p className="text-[10px] font-black text-lilac-600 uppercase tracking-widest mt-1">Registry Context: Builder Interface</p>
                        </div>
                        <div className="p-10 space-y-8 flex-1 overflow-y-auto no-scrollbar">
                            <div className="space-y-6">
                                <div>
                                    <label className="label text-[10px]">Element Label *</label>
                                    <input autoFocus type="text" value={newEntryForm.label} onChange={e => setNewEntryForm({...newEntryForm, label: e.target.value})} className="input text-lg font-black" placeholder="e.g. Current Medications" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label text-[10px]">Registry Section</label>
                                        <select value={newEntryForm.section} onChange={e => setNewEntryForm({...newEntryForm, section: e.target.value as any})} className="input text-sm font-bold">
                                            <option value="IDENTITY">Section I: Identity</option>
                                            <option value="CONTACT">Section II: Contact</option>
                                            <option value="MEDICAL">Section V: Medical</option>
                                            <option value="DENTAL">Section IV: Dental</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label text-[10px]">Input Interaction</label>
                                        <select value={newEntryForm.type} onChange={e => setNewEntryForm({...newEntryForm, type: e.target.value as any})} className="input text-sm font-bold">
                                            <option value="text">Short Text</option>
                                            <option value="textarea">Narrative (Long Text)</option>
                                            <option value="dropdown">Registry Dropdown</option>
                                            <option value="boolean">Yes/No Toggle</option>
                                            <option value="header">Section Card Header</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${newEntryForm.isCritical ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-400'}`}>
                                                <ShieldAlert size={18}/>
                                            </div>
                                            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Clinical Risk Flag</span>
                                        </div>
                                        <button 
                                            onClick={() => setNewEntryForm({...newEntryForm, isCritical: !newEntryForm.isCritical})}
                                            className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${newEntryForm.isCritical ? 'bg-red-600 justify-end' : 'bg-slate-300 justify-start'}`}
                                        >
                                            <div className="w-4 h-4 bg-white rounded-full" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Marking as critical will automatically register positive findings in the clinical alert registry.</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-10 border-t bg-white flex gap-3">
                            <button onClick={() => setIsAdding(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button>
                            <button onClick={handleSaveNewEntry} className="flex-[2] py-5 bg-teal-700 text-white font-black uppercase text-xs rounded-2xl shadow-xl hover:scale-[1.02] transition-all">Add to Registry</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FieldManagement;

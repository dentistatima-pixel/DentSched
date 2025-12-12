
import React, { useState, useMemo } from 'react';
import { FieldSettings, ProcedureItem, FeatureToggles, User, SmsTemplates, OfficialReceiptBooklet, ClinicProfile, Medication, ConsentFormTemplate, ClinicalNoteTemplate, ClinicalProtocolRule } from '../types';
import { Plus, Trash2, Edit2, Check, X, Sliders, ChevronRight, DollarSign, ToggleLeft, ToggleRight, Box, Calendar, MapPin, User as UserIcon, MessageSquare, Tag, FileText, Heart, Activity, TrendingUp, Key, Shield, HardHat, Store, BookOpen, Pill, FileSignature, ClipboardPaste } from 'lucide-react';
import { useToast } from './ToastSystem';

interface FieldManagementProps {
  settings: FieldSettings;
  onUpdateSettings: (newSettings: FieldSettings) => void;
  staff?: User[];
  onUpdateStaff?: (updatedStaff: User[]) => void;
  auditLog: any[];
}

const FieldManagement: React.FC<FieldManagementProps> = ({ settings, onUpdateSettings, staff, onUpdateStaff, auditLog }) => {
    const toast = useToast();
    const [activeCategory, setActiveCategory] = useState<string>('features');
  
    // --- STATE MANAGEMENT ---
    const [newItemValue, setNewItemValue] = useState('');
    const [editingItem, setEditingItem] = useState<{ index: number, value: string } | null>(null);
    const [newProcName, setNewProcName] = useState('');
    const [newProcPrice, setNewProcPrice] = useState('');
    const [newProcCategory, setNewProcCategory] = useState('');
    const [editingProc, setEditingProc] = useState<{ index: number, name: string, price: string, category: string } | null>(null);
    const [newMed, setNewMed] = useState<Omit<Medication, 'id'>>({ name: '', dosage: '', instructions: '' });
    const [newConsent, setNewConsent] = useState<Omit<ConsentFormTemplate, 'id'>>({ name: '', content: '' });

    // --- MENU STRUCTURE ---
    const menuStructure = [
        { group: 'System Settings', icon: Sliders, items: [
            { key: 'features', label: 'System Features', icon: ToggleLeft },
            { key: 'roster', label: 'Staff Roster', icon: Calendar },
            { key: 'branches', label: 'Clinic Branches', icon: MapPin },
            { key: 'sms', label: 'Messaging & SMS', icon: MessageSquare },
            { key: 'receipts', label: 'BIR Receipt Booklets', icon: FileText },
        ]},
        { group: 'Clinical Content & Protocols', icon: BookOpen, items: [
            { key: 'procedures', label: 'Procedures & Prices', icon: DollarSign },
            { key: 'medications', label: 'Medication Formulary', icon: Pill },
            { key: 'consentForms', label: 'Consent Form Templates', icon: FileSignature },
            { key: 'noteTemplates', label: 'Clinical Note Templates', icon: ClipboardPaste },
            { key: 'protocolRules', label: 'Protocol Alert Rules', icon: Shield },
        ]},
        { group: 'Data Lists', icon: Tag, items: [
            { key: 'insuranceProviders', label: 'Insurance Providers', icon: Heart },
            { key: 'allergies', label: 'Common Allergies', icon: Activity },
            { key: 'medicalConditions', label: 'Medical Conditions', icon: Activity },
            { key: 'suffixes', label: 'Suffixes & Titles', icon: UserIcon },
        ]},
        { group: 'Accountability', icon: Key, items: [
            { key: 'auditLog', label: 'Audit Log', icon: Shield },
        ]},
    ];
    const activeItem = menuStructure.flatMap(g => g.items).find(i => i.key === activeCategory);
    const activeGroup = menuStructure.find(g => g.items.some(i => i.key === activeCategory));

    // --- GENERIC & FEATURE HANDLERS ---
    const handleProfileChange = (profile: ClinicProfile) => {
        const boutiqueDefaults: FeatureToggles = { ...settings.features, enableTreatmentPlanApprovals: false, enableAccountabilityLog: false, enableClinicalProtocolAlerts: false, enableAdvancedPermissions: false };
        const corporateDefaults: FeatureToggles = { ...settings.features, enableTreatmentPlanApprovals: true, enableAccountabilityLog: true, enableClinicalProtocolAlerts: true, enableAdvancedPermissions: true, enableMultiBranch: true };
        onUpdateSettings({ ...settings, clinicProfile: profile, features: profile === 'boutique' ? boutiqueDefaults : corporateDefaults });
        toast.success(`Clinic Profile set to ${profile}. Default features applied.`);
    };
    const handleToggleFeature = (feature: keyof FeatureToggles) => {
        onUpdateSettings({ ...settings, features: { ...settings.features, [feature]: !settings.features[feature] }});
    };
    
    // --- CONTENT MANAGEMENT HANDLERS ---
    const handleAddMedication = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMed.name || !newMed.dosage || !newMed.instructions) {
            toast.error("All medication fields are required.");
            return;
        }
        const newMedication: Medication = { id: `med_${Date.now()}`, ...newMed };
        onUpdateSettings({ ...settings, medications: [...(settings.medications || []), newMedication] });
        setNewMed({ name: '', dosage: '', instructions: '' });
    };
    const handleDeleteMedication = (id: string) => {
        onUpdateSettings({ ...settings, medications: (settings.medications || []).filter(m => m.id !== id) });
    };

    const handleAddConsent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newConsent.name || !newConsent.content) {
            toast.error("Template name and content are required.");
            return;
        }
        const newTemplate: ConsentFormTemplate = { id: `cft_${Date.now()}`, ...newConsent };
        onUpdateSettings({ ...settings, consentFormTemplates: [...(settings.consentFormTemplates || []), newTemplate] });
        setNewConsent({ name: '', content: '' });
    };
    const handleDeleteConsent = (id: string) => {
        onUpdateSettings({ ...settings, consentFormTemplates: (settings.consentFormTemplates || []).filter(c => c.id !== id) });
    };

    // --- RENDER FUNCTIONS ---
    const renderCurrentCategory = () => {
        switch(activeCategory) {
            case 'features': return renderFeatures();
            case 'medications': return renderMedications();
            case 'consentForms': return renderConsentForms();
            // Add other cases here...
            default: return (
                <div className="p-10 text-center text-slate-400">
                    <HardHat size={32} className="mx-auto mb-2" />
                    Management interface for this section is under construction.
                </div>
            );
        }
    };
    
    return (
        <div className="flex flex-col md:flex-row h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-full md:w-72 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-100 bg-teal-900 text-white">
                    <h2 className="text-lg font-bold flex items-center gap-2"><Sliders size={20} /> Clinic Settings</h2>
                </div>
                <nav className="flex-1 overflow-y-auto p-2">
                    {menuStructure.map(group => (
                        <div key={group.group} className="py-2">
                            <h3 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <group.icon size={14}/> {group.group}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map(item => (
                                    <button
                                        key={item.key}
                                        onClick={() => setActiveCategory(item.key)}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between transition-colors text-sm ${
                                            activeCategory === item.key 
                                            ? 'bg-teal-50 text-teal-800 font-bold' 
                                            : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon size={16} className={`${activeCategory === item.key ? 'text-teal-600' : 'text-slate-400'}`} />
                                            <span>{item.label}</span>
                                        </div>
                                        {activeCategory === item.key && <ChevronRight size={16} className="text-teal-500"/>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-2xl font-bold text-slate-800">{activeItem?.label}</h3>
                    <p className="text-slate-500 text-sm mt-1">{activeGroup?.group}</p>
                </div>
                {renderCurrentCategory()}
            </div>
        </div>
    );
    
    // --- SUB-RENDERERS ---
    function renderFeatures() {
        return (
            <div className="p-6 bg-slate-50 h-full overflow-y-auto space-y-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-3">Clinic Operating Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={() => handleProfileChange('boutique')} className={`p-4 rounded-lg border-2 text-left transition-all ${settings.clinicProfile === 'boutique' ? 'border-teal-500 bg-teal-50 shadow-md' : 'border-slate-200 hover:border-teal-300'}`}>
                            <div className="flex items-center gap-2 font-bold text-teal-800"><Store size={18}/> Solo / Boutique</div>
                            <p className="text-xs text-slate-500 mt-1">Optimized for speed. Disables multi-dentist governance features by default.</p>
                        </button>
                         <button onClick={() => handleProfileChange('corporate')} className={`p-4 rounded-lg border-2 text-left transition-all ${settings.clinicProfile === 'corporate' ? 'border-lilac-500 bg-lilac-50 shadow-md' : 'border-slate-200 hover:border-lilac-300'}`}>
                            <div className="flex items-center gap-2 font-bold text-lilac-800"><HardHat size={18}/> Corporate / Multi-Dentist</div>
                            <p className="text-xs text-slate-500 mt-1">Enables features for governance, standardization, and legal protection.</p>
                        </button>
                    </div>
                </div>
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider pt-4">Fine-Tune Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToggleItem label="Multi-Branch Management" featureKey="enableMultiBranch" icon={MapPin} />
                    <ToggleItem label="Treatment Plan Approvals" featureKey="enableTreatmentPlanApprovals" icon={Shield} />
                    <ToggleItem label="Clinical Protocol Alerts" featureKey="enableClinicalProtocolAlerts" icon={Shield} />
                    <ToggleItem label="Accountability Log" featureKey="enableAccountabilityLog" icon={Key} />
                    <ToggleItem label="E-Prescription Module" featureKey="enableEPrescription" icon={Pill} />
                    <ToggleItem label="Digital Consent Forms" featureKey="enableDigitalConsent" icon={FileSignature} />
                </div>
            </div>
        );
    }

    function renderMedications() {
        return (
            <div className="flex flex-col h-full bg-slate-50">
                <div className="p-4 border-b border-slate-200 bg-white">
                    <form onSubmit={handleAddMedication} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div className="md:col-span-1"><label className="text-xs font-bold text-slate-500">Name</label><input type="text" value={newMed.name} onChange={e => setNewMed({...newMed, name: e.target.value})} className="w-full p-2 border rounded-lg mt-1" placeholder="Amoxicillin" /></div>
                        <div className="md:col-span-1"><label className="text-xs font-bold text-slate-500">Dosage</label><input type="text" value={newMed.dosage} onChange={e => setNewMed({...newMed, dosage: e.target.value})} className="w-full p-2 border rounded-lg mt-1" placeholder="500mg" /></div>
                        <div className="md:col-span-2"><label className="text-xs font-bold text-slate-500">Instructions</label><input type="text" value={newMed.instructions} onChange={e => setNewMed({...newMed, instructions: e.target.value})} className="w-full p-2 border rounded-lg mt-1" placeholder="1 cap every 8 hrs..." /></div>
                        <button type="submit" className="md:col-start-4 bg-teal-600 text-white font-bold p-2 rounded-lg flex items-center justify-center gap-2"><Plus size={16}/> Add to Formulary</button>
                    </form>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {(settings.medications || []).map(med => (
                        <div key={med.id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-slate-800">{med.name} <span className="font-normal text-slate-500">{med.dosage}</span></p>
                                <p className="text-xs text-slate-500 italic">"{med.instructions}"</p>
                            </div>
                            <button onClick={() => handleDeleteMedication(med.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    function renderConsentForms() {
        return (
            <div className="flex flex-col h-full bg-slate-50">
                <div className="p-4 border-b border-slate-200 bg-white">
                    <form onSubmit={handleAddConsent} className="space-y-3">
                        <input type="text" value={newConsent.name} onChange={e => setNewConsent({...newConsent, name: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Template Name (e.g., 'Surgical Extraction Consent')" />
                        <textarea value={newConsent.content} onChange={e => setNewConsent({...newConsent, content: e.target.value})} className="w-full p-2 border rounded-lg h-24" placeholder="Enter template content. Use placeholders like {PatientName}, {DoctorName}, {ProcedureList}, {Date}." />
                        <button type="submit" className="w-full bg-teal-600 text-white font-bold p-2 rounded-lg flex items-center justify-center gap-2"><Plus size={16}/> Add Template</button>
                    </form>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {(settings.consentFormTemplates || []).map(c => (
                        <div key={c.id} className="bg-white p-3 rounded-xl border border-slate-200">
                             <div className="flex justify-between items-center mb-2">
                                <p className="font-bold text-slate-800">{c.name}</p>
                                <button onClick={() => handleDeleteConsent(c.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full"><Trash2 size={16}/></button>
                            </div>
                            <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 whitespace-pre-wrap font-mono">{c.content}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    function ToggleItem({ label, featureKey, icon: Icon }: { label: string, featureKey: keyof FeatureToggles, icon: React.ElementType }) {
        return (
          <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-teal-300 transition-colors">
              <div className="flex items-center gap-3">
                  <Icon className="text-teal-600" size={20} />
                  <span className="font-bold text-slate-700">{label}</span>
              </div>
              <button onClick={() => handleToggleFeature(featureKey)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${ settings.features[featureKey] ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200' }`}>
                  {settings.features[featureKey] ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                  {settings.features[featureKey] ? 'Enabled' : 'Disabled'}
              </button>
          </div>
        )
    }
};

export default FieldManagement;

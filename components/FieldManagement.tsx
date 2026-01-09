import React, { useState, useMemo, useCallback } from 'react';
import { 
  FieldSettings, User, UserRole, AuditLogEntry, Patient, ClinicalIncident, 
  RegistrationField, ProcedureItem, Medication, HospitalAffiliation, PayrollAdjustmentTemplate, ClinicResource, MaintenanceAsset, ResourceType, Appointment, DaySchedule, SmsTemplateConfig, DentalChartEntry
} from '../types';
import { 
  Plus, Trash2, Edit2, Sliders, Settings, ChevronRight, DollarSign, 
  Box, MapPin, User as UserIcon, Pill, 
  ShieldAlert, ShieldCheck, Shield, Database, Archive, Layers, Receipt, Activity, 
  Sparkles, Zap, Monitor, Wrench, ClipboardList, 
  Armchair, FileText, 
  ArrowUp, ArrowDown, X, LayoutPanelLeft, Move, PanelLeftClose, PanelLeftOpen, CheckCircle2, Pencil, Droplets, FlaskConical, Hash, HeartPulse, Building2, CreditCard, Percent, Banknote, Phone, AlertTriangle, Fingerprint, Search, ShieldCheck as VerifiedIcon, Scale, Globe, Lock, ShieldQuestion, FileSignature, Clock, RefreshCw, AlertCircle, Download, ArrowRight, Link, Smartphone, MessageSquare,
  MousePointer2, PlusCircle, Cloud, Server, Key, Printer, FileWarning, BarChart3, GraduationCap,
  Camera, Stethoscope, FileBox
} from 'lucide-react';
import RegistrationBasicInfo from './RegistrationBasicInfo';
import RegistrationMedical from './RegistrationMedical';
import { useToast } from './ToastSystem';
import { formatDate } from '../constants';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import CryptoJS from 'crypto-js';

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
  appointments: Appointment[];
}

const FieldManagement: React.FC<FieldManagementProps> = ({ 
  settings, onUpdateSettings, auditLogVerified, staff, auditLog, patients, onPurgePatient, appointments
}) => {
    const toast = useToast();
    const [activeRegistry, setActiveRegistry] = useState<string>('branding');
    const [isAdding, setIsAdding] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [auditSearchTerm, setAuditSearchTerm] = useState('');
    const [isVerifyingLogs, setIsVerifyingLogs] = useState(false);

    const pendingArchiveCount = useMemo(() => {
        return patients.filter(p => p.dentalChart?.some(e => e.status === 'Completed' && !e.isPrinted)).length;
    }, [patients]);

    const [selectedField, setSelectedField] = useState<{ id: string, type: string } | null>(null);
    const [activeSection, setActiveSection] = useState<'IDENTITY' | 'MEDICAL' | 'DENTAL'>('IDENTITY');

    const [newEntryForm, setNewEntryForm] = useState<Partial<RegistrationField>>({
        label: '', type: 'text', section: 'IDENTITY', width: 'half', isCritical: false
    });

    const [editingProcedure, setEditingProcedure] = useState<Partial<ProcedureItem> | null>(null);
    const [editingMedication, setEditingMedication] = useState<Partial<Medication> | null>(null);
    
    const sidebarGroups = [
        { key: 'core', label: 'Practice Identity', icon: Activity, items: [
            { id: 'branding', label: 'Practice Identity', icon: Sparkles },
            { id: 'sms_hub', label: 'SMS & Comms Hub', icon: Smartphone },
            { id: 'printouts_hub', label: 'Printouts & Report Hub', icon: Printer }
        ]},
        { key: 'form_builder', label: 'II. Admission Design', icon: Sliders, items: [
            { id: 'patient_registry_form', label: 'Visual Form Builder', icon: LayoutPanelLeft }
        ]},
        { key: 'catalog', label: 'III. Clinical Catalog', icon: Box, items: [
            { id: 'procedures', label: 'Procedure Catalog', icon: DollarSign },
            { id: 'medications', label: 'Pharmacy Registry', icon: Pill }
        ]},
        { key: 'finance', label: 'IV. Financial & HR', icon: Receipt, items: [
            { id: 'paymentModes', label: 'Payment & Tax', icon: Banknote },
            { id: 'staff', label: 'Clinician Registry', icon: UserIcon }
        ]},
        { key: 'infrastructure', label: 'V. Infrastructure', icon: Wrench, items: [
            { id: 'branches', label: 'Branch Locations', icon: MapPin }
        ]},
        { key: 'governance', label: 'VI. Governance & NPC', icon: ShieldCheck, items: [
            { id: 'npc_compliance', label: 'Compliance Center', icon: Shield }
        ]}
    ];

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
        } else {
            const id = `dyn_${Date.now()}`;
            newSettings.identityFields.push({ id, label, type: type as any, section: section as any, width: width as any });
            newSettings.identityLayoutOrder.push(`field_${id}`);
        }
        onUpdateSettings(newSettings);
        setIsAdding(false);
        setNewEntryForm({ label: '', type: 'text', section: 'IDENTITY', width: 'half', isCritical: false });
        toast.success("Form element registered.");
    };

    const handleUpdateHours = (day: string, updates: Partial<DaySchedule>) => {
        const next = { ...settings.operationalHours, [day]: { ...settings.operationalHours[day as keyof typeof settings.operationalHours], ...updates } };
        onUpdateSettings({ ...settings, operationalHours: next });
    };

    const handleSaveProcedure = () => {
        if (!editingProcedure?.name) return;
        const next = editingProcedure.id 
            ? settings.procedures.map(p => p.id === editingProcedure.id ? editingProcedure as ProcedureItem : p)
            : [...settings.procedures, { ...editingProcedure, id: `p_${Date.now()}` } as ProcedureItem];
        onUpdateSettings({ ...settings, procedures: next });
        setEditingProcedure(null);
    };

    const handleSaveMedication = () => {
        if (!editingMedication?.genericName) return;
        const next = editingMedication.id
            ? settings.medications.map(m => m.id === editingMedication.id ? editingMedication as Medication : m)
            : [...settings.medications, { ...editingMedication, id: `med_${Date.now()}` } as Medication];
        onUpdateSettings({ ...settings, medications: next });
        setEditingMedication(null);
    };

    const handleBatchPrint = () => {
        const targets = patients.filter(p => p.dentalChart?.some(e => e.status === 'Completed' && !e.isPrinted));
        if (targets.length === 0) { toast.info("No unprinted completions identified."); return; }
        toast.info(`Generating ${targets.length} separate Patient Archive Files...`);
        targets.forEach(p => {
            const doc = new jsPDF();
            doc.setFontSize(18); doc.text("PATIENT TREATMENT ARCHIVE", 105, 20, { align: 'center' });
            doc.setFontSize(10); doc.text(`Patient: ${p.name.toUpperCase()} (ID: ${p.id})`, 20, 35);
            const entries = p.dentalChart?.filter(e => e.status === 'Completed' && !e.isPrinted) || [];
            (doc as any).autoTable({
                startY: 45, head: [['Date', 'Tooth', 'Procedure', 'Clinical Narrative']],
                body: entries.map(e => [formatDate(e.date), e.toothNumber, e.procedure, e.notes || '']),
                theme: 'grid', styles: { fontSize: 8 }, headStyles: { fillColor: [15, 118, 110] }
            });
            doc.save(`Archive_${p.surname}_${Date.now()}.pdf`);
        });
        toast.success("Batch Print Complete.");
    };

    const renderFormBuilder = () => {
        return (
            <div className="flex flex-col 2xl:flex-row h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50/20 no-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-8 pb-32">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Admission Design Studio</h3>
                                <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Configure clinical intake schema & data requirements</p>
                            </div>
                            <div className="flex bg-white p-1 rounded-2xl border-2 border-slate-100 shadow-sm w-full sm:w-auto">
                                <button onClick={() => setActiveSection('IDENTITY')} className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSection === 'IDENTITY' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500 hover:text-teal-600'}`}>I. Identity</button>
                                <button onClick={() => setActiveSection('MEDICAL')} className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSection === 'MEDICAL' ? 'bg-lilac-600 text-white shadow-lg' : 'text-slate-500 hover:text-lilac-600'}`}>II. Medical</button>
                            </div>
                        </div>
                        <div className="bg-white p-2 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl border-4 border-white min-h-[600px] relative">
                             {activeSection === 'IDENTITY' ? (
                                <div className="p-4 md:p-8">
                                    <RegistrationBasicInfo formData={{}} handleChange={() => {}} readOnly={true} fieldSettings={settings} designMode={true} onFieldClick={handleFieldClick} selectedFieldId={selectedField?.id} />
                                </div>
                             ) : (
                                <div className="p-4 md:p-8">
                                    <RegistrationMedical formData={{}} handleChange={() => {}} handleArrayChange={() => {}} readOnly={true} fieldSettings={settings} designMode={true} onFieldClick={handleFieldClick} selectedFieldId={selectedField?.id} />
                                </div>
                             )}
                        </div>
                    </div>
                </div>
                <div className={`
                    ${selectedField ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}
                    fixed bottom-0 left-0 right-0 2xl:static 2xl:translate-y-0 2xl:opacity-100 2xl:pointer-events-auto
                    2xl:w-72 2xl:h-full bg-white border-t 2xl:border-t-0 2xl:border-l border-slate-200 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.1)] 2xl:shadow-2xl z-50 transition-all duration-500 ease-in-out
                    h-[60vh] 2xl:max-h-full
                `}>
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                        <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Element Properties</h4>
                        <button onClick={() => setSelectedField(null)} className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                        {selectedField ? (
                            <div className="space-y-6">
                                <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                                    <div className="text-[10px] font-black text-teal-700 uppercase tracking-widest mb-1">Target Element</div>
                                    <div className="text-sm font-black text-teal-900 uppercase truncate">{selectedField.id}</div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="label text-[10px]">Display Label</label>
                                        <input type="text" className="input bg-slate-50" value={selectedField.id.startsWith('core_') ? settings.fieldLabels[selectedField.id.replace('core_', '')] || '' : settings.identityFields.find(f => `field_${f.id}` === selectedField.id)?.label || (selectedField.type === 'question' ? selectedField.id : '')} onChange={(e) => { if (selectedField.id.startsWith('core_')) handleUpdateLabelMap(selectedField.id, e.target.value); else handleUpdateDynamicField(selectedField.id, { label: e.target.value }); }} />
                                    </div>
                                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                                        <button onClick={() => toggleCriticalStatus(selectedField.id)} className={`w-full py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${settings.criticalRiskRegistry?.includes(selectedField.id) ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-100 text-slate-400 hover:border-red-200'}`}>
                                            {settings.criticalRiskRegistry?.includes(selectedField.id) ? '🚩 Critical Priority' : 'Mark as Priority'}
                                        </button>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => moveElement('up')} className="p-3 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 hover:bg-teal-50 hover:text-teal-600 transition-all"><ArrowUp size={18}/></button>
                                            <button onClick={() => moveElement('down')} className="p-3 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 hover:bg-teal-50 hover:text-teal-600 transition-all"><ArrowDown size={18}/></button>
                                        </div>
                                        <button onClick={handleRemoveSelected} className="w-full py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Remove Element</button>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                    <div className="p-6 bg-teal-900 shrink-0 pb-safe">
                        <button onClick={() => setIsAdding(true)} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-teal-950/50 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all">
                            <Plus size={18}/> New Form Element
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderCatalogContent = () => {
        switch (activeRegistry) {
            case 'branding':
                return (
                    <div className="p-4 md:p-8 lg:p-10 space-y-12 overflow-y-auto h-full animate-in fade-in duration-500 no-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8 lg:gap-10">
                            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border-2 border-slate-100 shadow-sm space-y-6">
                                <h4 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em] border-b pb-4 mb-2">Practice Visual Identity</h4>
                                <div><label className="label text-xs">Practice Legal Name</label><input type="text" value={settings.clinicName} onChange={e => onUpdateSettings({...settings, clinicName: e.target.value})} className="input text-xl font-black" /></div>
                                <div><label className="label text-xs">Module Toggles</label><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{(Object.entries(settings.features) as any).map(([k, v]: any) => (
                                    <button key={k} onClick={() => onUpdateSettings({...settings, features: {...settings.features, [k]: !v}})} className={`p-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${v ? 'bg-teal-50 border-teal-500 text-teal-900' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{k.replace(/([A-Z])/g, ' $1')}</button>
                                ))}</div></div>
                            </div>

                            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border-2 border-lilac-100 shadow-sm space-y-6">
                                <h4 className="font-black text-lilac-900 uppercase text-xs tracking-[0.2em] border-b border-lilac-50 pb-4 mb-2">Global Operational Hours</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                                    {Object.entries(settings.operationalHours).map(([day, sched]: [string, any]) => (
                                        <div key={day} className="p-5 bg-slate-50 rounded-3xl border border-slate-200 group transition-all hover:bg-white hover:border-lilac-300 flex flex-col gap-4">
                                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                <div className="font-black uppercase text-xs text-teal-800 tracking-widest">{day}</div>
                                                <button 
                                                    onClick={() => handleUpdateHours(day, {isClosed: !sched.isClosed})}
                                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${sched.isClosed ? 'bg-red-50 border-red-500 text-red-700' : 'bg-teal-50 border-teal-500 text-teal-700'}`}
                                                >
                                                    {sched.isClosed ? 'Closed' : 'Open'}
                                                </button>
                                            </div>
                                            <div className="flex gap-4 items-center w-full">
                                                <div className="flex-1">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Start Time</label>
                                                    <input type="time" disabled={sched.isClosed} value={sched.start} onChange={e => handleUpdateHours(day, {start: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none disabled:opacity-30" />
                                                </div>
                                                <div className="pt-4 text-slate-300 font-black">-</div>
                                                <div className="flex-1">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">End Time</label>
                                                    <input type="time" disabled={sched.isClosed} value={sched.end} onChange={e => handleUpdateHours(day, {end: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none disabled:opacity-30" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'sms_hub':
                return (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">SMS & Communications Hub</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Multi-Channel SIM Gateway Configuration</p>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                             <div className={`bg-white p-8 rounded-[3rem] border-4 shadow-2xl space-y-6 transition-all duration-500 ${settings.smsConfig.mode === 'LOCAL' ? 'border-teal-500' : 'border-slate-100 opacity-60'}`}>
                                <div className="flex items-center gap-3 border-b border-teal-50 pb-4">
                                    <div className="p-2 bg-teal-50 text-teal-600 rounded-xl"><Smartphone size={24}/></div>
                                    <h4 className="font-black text-slate-800 uppercase text-sm">Local Server</h4>
                                </div>
                                <div className="space-y-4">
                                    <div><label className="label text-[10px]">Gateway URL</label><input type="text" value={settings.smsConfig.gatewayUrl} onChange={e => onUpdateSettings({...settings, smsConfig: {...settings.smsConfig, gatewayUrl: e.target.value}})} className="input font-mono text-xs" /></div>
                                    <div><label className="label text-[10px]">Security Key</label><input type="password" value={settings.smsConfig.apiKey} onChange={e => onUpdateSettings({...settings, smsConfig: {...settings.smsConfig, apiKey: e.target.value}})} className="input font-mono" /></div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default: return <div className="p-20 text-center opacity-30 italic">Module UI synchronizing...</div>;
        }
    };

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden relative">
            <div className={`w-64 md:w-72 xl:w-80 bg-teal-900 text-white flex flex-col shrink-0 shadow-2xl z-40 overflow-y-auto no-scrollbar transition-all duration-500`}>
                <div className="p-6 md:p-8 border-b border-white/10 shrink-0">
                    <h2 className={`text-sm font-black uppercase tracking-[0.3em] text-teal-400`}>Settings Hub</h2>
                </div>
                <div className="p-3 md:p-4 space-y-8">
                    {sidebarGroups.map(group => (
                        <div key={group.key} className="space-y-2">
                            <h4 className={`px-4 text-[10px] font-black text-teal-500 uppercase tracking-widest`}>{group.label}</h4>
                            {group.items.map(item => (
                                <button key={item.id} onClick={() => setActiveRegistry(item.id)} className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between transition-all ${activeRegistry === item.id ? 'bg-white text-teal-900 font-bold shadow-xl' : 'hover:bg-white/5 text-teal-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <item.icon size={20} className="shrink-0"/>
                                        <span className={`text-xs font-black uppercase tracking-widest truncate`}>{item.label}</span>
                                    </div>
                                    <ChevronRight size={14} className={`${activeRegistry === item.id ? 'rotate-90' : ''}`}/>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex-1 bg-white relative overflow-hidden flex flex-col">
                {activeRegistry === 'patient_registry_form' ? renderFormBuilder() : (
                    <div className="flex-1 p-4 md:p-6 lg:p-8 xl:p-10 bg-slate-50/20 overflow-y-auto no-scrollbar">
                        {renderCatalogContent()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FieldManagement;
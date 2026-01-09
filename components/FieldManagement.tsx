import React, { useState, useMemo } from 'react';
import { 
  Plus, Sliders, ChevronRight, DollarSign, 
  Box, MapPin, User as UserIcon, Pill, 
  ShieldCheck, Shield, Receipt, Activity, 
  Sparkles, Zap, Wrench, FileText, X, 
  LayoutPanelLeft, Banknote, ShieldAlert, 
  Search, Scale, Lock, Smartphone, Printer,
  LayoutGrid, ToggleRight, ToggleLeft
} from 'lucide-react';
import { 
  FieldSettings, User, AuditLogEntry, Patient, 
  RegistrationField, ProcedureItem, Medication, 
  DaySchedule, Appointment, DashboardConfig
} from '../types';
import RegistrationBasicInfo from './RegistrationBasicInfo';
import RegistrationMedical from './RegistrationMedical';
import { useToast } from './ToastSystem';
import { formatDate } from '../constants';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface FieldManagementProps {
  settings: FieldSettings;
  onUpdateSettings: (newSettings: FieldSettings) => void;
  staff: User[];
  auditLog: AuditLogEntry[];
  patients: Patient[];
  onPurgePatient: (id: string) => void;
  auditLogVerified: boolean | null;
  encryptionKey: string | null;
  incidents: any[];
  onSaveIncident: (i: any) => void;
  appointments: Appointment[];
}

const FieldManagement: React.FC<FieldManagementProps> = ({ 
  settings, onUpdateSettings, auditLogVerified, staff, auditLog, patients, onPurgePatient, appointments
}) => {
    const toast = useToast();
    const [activeRegistry, setActiveRegistry] = useState<string>('branding');
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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
            { id: 'dashboard_config', label: 'Dashboard Config', icon: LayoutGrid },
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
    };

    const handleUpdateLabelMap = (id: string, newTitle: string) => {
        const cleanId = id.startsWith('core_') ? id.replace('core_', '') : id;
        const newMap = { ...settings.fieldLabels, [cleanId]: newTitle };
        onUpdateSettings({ ...settings, fieldLabels: newMap });
    };

    const toggleDashboardWidget = (key: keyof DashboardConfig) => {
        const next = { ...settings.dashboardConfig, [key]: !settings.dashboardConfig[key] };
        onUpdateSettings({ ...settings, dashboardConfig: next });
        toast.success(`Dashboard widget updated.`);
    };

    const renderDashboardConfig = () => {
        const configGroups = [
            { label: 'High-Level Metrics', items: [
                { key: 'showYield', label: 'Practice Yield (YTD)', sub: 'Display gross clinical production' },
                { key: 'showRegulatoryHealth', label: 'Regulatory Health', sub: 'Audit scores and license tracking' },
                { key: 'showLogisticsIntegrity', label: 'Logistics Integrity', sub: 'Sterile sets and supply variance' },
                { key: 'showVelocity', label: 'Shift Velocity', sub: 'Daily completion percentages' }
            ]},
            { label: 'Clinical Operations', items: [
                { key: 'showSafetyRail', label: 'Safety Red Flag Rail', sub: 'High-visibility critical medical alerts' },
                { key: 'showIntakeQueue', label: 'Patient Intake Queue', sub: 'Real-time patient flow monitor' },
                { key: 'showWaitlistAlerts', label: 'Cancellation Recovery', sub: 'Waitlist gap-fill alerts' }
            ]},
            { label: 'Facility Logistics', items: [
                { key: 'showSterilizationShield', label: 'Sterilization Shield', sub: 'Biological trust and load success' },
                { key: 'showSupplyRisks', label: 'Supply Chain Watch', sub: 'Predictive lead-time risk alerts' },
                { key: 'showLabInFlow', label: 'Laboratory Tracker', sub: 'Expected prosthetic case arrivals' }
            ]},
            { label: 'Revenue & Compliance', items: [
                { key: 'showRevenueBridge', label: 'Revenue Bridge', sub: 'BIR Statutory match rate tracker' },
                { key: 'showInsurancePipeline', label: 'Insurance Pipeline', sub: 'Pending PhilHealth/HMO claims' },
                { key: 'showComplianceAlerts', label: 'Governance Watchdog', sub: 'License expiries and unsealed notes' }
            ]},
            { label: 'Post-Treatment Loop', items: [
                { key: 'showPostOpWellness', label: 'Surgical Follow-Up', sub: 'Post-op recovery call queue' },
                { key: 'showSessionStatus', label: 'Cash Session Guard', sub: 'Branch session open/closed status' }
            ]}
        ];

        return (
            <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl mx-auto">
                <div>
                    <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Dashboard configuration</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Select intelligence modules to surface on the command center</p>
                </div>

                <div className="grid grid-cols-1 gap-12">
                    {configGroups.map(group => (
                        <div key={group.label} className="space-y-6">
                            <h4 className="font-black text-lilac-800 uppercase text-[11px] tracking-[0.3em] border-b border-lilac-100 pb-2">{group.label}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {group.items.map(item => {
                                    const isActive = settings.dashboardConfig[item.key as keyof DashboardConfig];
                                    return (
                                        <button 
                                            key={item.key}
                                            onClick={() => toggleDashboardWidget(item.key as keyof DashboardConfig)}
                                            className={`p-6 rounded-[2.5rem] border-2 text-left flex items-center justify-between transition-all group ${isActive ? 'bg-white border-teal-500 shadow-xl shadow-teal-500/5' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                                        >
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className={`font-black text-sm uppercase tracking-tight mb-1 ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>{item.label}</div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">{item.sub}</p>
                                            </div>
                                            <div className={`shrink-0 transition-transform duration-500 ${isActive ? 'text-teal-600 scale-125 rotate-0' : 'text-slate-300 scale-100 rotate-0'}`}>
                                                {isActive ? <ToggleRight size={32} strokeWidth={2.5}/> : <ToggleLeft size={32} strokeWidth={2}/>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
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
            </div>
        );
    };

    const renderCatalogContent = () => {
        switch (activeRegistry) {
            case 'dashboard_config': return renderDashboardConfig();
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
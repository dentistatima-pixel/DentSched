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
  Camera, Stethoscope, FileBox, Check, Save, BarChart2
} from 'lucide-react';
import { useToast } from './ToastSystem';
import { formatDate } from '../constants';
import FormBuilder from './FormBuilder';
import ProcedureCatalog from './ProcedureCatalog';
import AuditTrailViewer from './AuditTrailViewer';
import SmsHub from './SmsHub';


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
  currentUser: User;
  onStartImpersonating: (user: User) => void;
}

const BRANCH_PREFIXES: Record<string, string> = {
    'Makati Main': 'mkt',
    'Quezon City Satellite': 'qzc',
    'BGC Premium': 'bgc',
    'Alabang South': 'alb'
};

const FieldManagement: React.FC<FieldManagementProps> = ({ 
  settings, onUpdateSettings, auditLogVerified, staff, auditLog, patients, onPurgePatient, appointments, currentUser, onStartImpersonating
}) => {
    const toast = useToast();
    const [activeRegistry, setActiveRegistry] = useState<string>('branding');
    
    // States for Modals/Forms that remain in this component
    const [editingMedication, setEditingMedication] = useState<Partial<Medication> | null>(null);
    const [editingAdjustment, setEditingAdjustment] = useState<Partial<PayrollAdjustmentTemplate> | null>(null);
    const [editingAffiliation, setEditingAffiliation] = useState<Partial<HospitalAffiliation> | null>(null);
    const [editingResource, setEditingResource] = useState<Partial<ClinicResource> | null>(null);
    const [editingAsset, setEditingAsset] = useState<Partial<MaintenanceAsset> | null>(null);

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
            { id: 'medications', label: 'Pharmacy Registry', icon: Pill },
            { id: 'shadeGuides', label: 'Shade & Materials', icon: Layers }
        ]},
        { key: 'finance', label: 'IV. Financial & HR', icon: Receipt, items: [
            { id: 'paymentModes', label: 'Payment & Tax', icon: Banknote },
            { id: 'payrollAdjustments', label: 'Adjustment Catalog', icon: Sliders },
            { id: 'expenseCategories', label: 'Expense Chart', icon: ClipboardList },
            { id: 'staff', label: 'Clinician Registry', icon: UserIcon }
        ]},
        { key: 'infrastructure', label: 'V. Infrastructure', icon: Wrench, items: [
            { id: 'branches', label: 'Branch Locations', icon: MapPin },
            { id: 'resources', label: 'Physical Resources', icon: Armchair },
            { id: 'assets', label: 'Equipment Assets', icon: Box },
            { id: 'hospitalAffiliations', label: 'Referral Network', icon: Building2 }
        ]},
        { key: 'governance', label: 'VI. Governance & NPC', icon: ShieldCheck, items: [
            { id: 'audit_trail', label: 'Forensic Audit Trail', icon: Fingerprint },
            { id: 'npc_compliance', label: 'Compliance Center', icon: Shield },
            { id: 'retention', label: 'Retention Monitor', icon: Archive }
        ]},
        { key: 'testing', label: 'VII. Testing', icon: Zap, items: [
            { id: 'privilege_elevation', label: 'Privilege Elevation', icon: Key }
        ]}
    ];

    const handleUpdateRegistryOptions = (key: string, nextOptions: string[]) => {
        onUpdateSettings({ ...settings, [key]: nextOptions });
        toast.success("Registry synchronized.");
    };

    const handleSaveMedication = () => {
        if (!editingMedication?.genericName) return;
        const next = editingMedication.id
            ? settings.medications.map(m => m.id === editingMedication.id ? editingMedication as Medication : m)
            : [...settings.medications, { ...editingMedication, id: `med_${Date.now()}` } as Medication];
        onUpdateSettings({ ...settings, medications: next });
        setEditingMedication(null);
    };

    const handleSaveAdjustment = () => {
        if (!editingAdjustment?.label) return;
        const next = editingAdjustment.id
            ? settings.payrollAdjustmentTemplates.map(a => a.id === editingAdjustment.id ? editingAdjustment as PayrollAdjustmentTemplate : a)
            : [...settings.payrollAdjustmentTemplates, { ...editingAdjustment, id: `adj_${Date.now()}` } as PayrollAdjustmentTemplate];
        onUpdateSettings({ ...settings, payrollAdjustmentTemplates: next });
        setEditingAdjustment(null);
    };

    const handleSaveAffiliation = () => {
        if (!editingAffiliation?.name) return;
        const next = editingAffiliation.id
            ? settings.hospitalAffiliations.map(a => a.id === editingAffiliation.id ? editingAffiliation as HospitalAffiliation : a)
            : [...settings.hospitalAffiliations, { ...editingAffiliation, id: `hosp_${Date.now()}` } as HospitalAffiliation];
        onUpdateSettings({ ...settings, hospitalAffiliations: next });
        setEditingAffiliation(null);
    };
     const generateResourceUid = (branch: string, existing: ClinicResource[]) => {
        const prefix = BRANCH_PREFIXES[branch] || branch.substring(0, 3).toLowerCase();
        const branchIds = existing
            .filter(r => r.branch === branch && r.id.startsWith(prefix))
            .map(r => {
                const numPart = r.id.replace(prefix, '');
                return parseInt(numPart);
            })
            .filter(n => !isNaN(n));
        
        const nextNum = branchIds.length > 0 ? Math.max(...branchIds) + 1 : 1001;
        return `${prefix}${nextNum.toString().padStart(4, '0')}`;
    };

    const handleSaveResource = () => {
        if (!editingResource?.name) return;
        const next = editingResource.id
            ? settings.resources.map(r => r.id === editingResource.id ? editingResource as ClinicResource : r)
            : [...settings.resources, { ...editingResource } as ClinicResource];
        onUpdateSettings({ ...settings, resources: next });
        setEditingResource(null);
        toast.success("Resource mapping updated.");
    };

    const handleSaveAsset = () => {
        if (!editingAsset?.name) return;
        const next = editingAsset.id
            ? settings.assets.map(a => a.id === editingAsset.id ? editingAsset as MaintenanceAsset : a)
            : [...settings.assets, { ...editingAsset, id: `ast_${Date.now()}` } as MaintenanceAsset];
        onUpdateSettings({ ...settings, assets: next });
        setEditingAsset(null);
        toast.success("Asset record synchronized.");
    };

    const renderContent = () => {
        switch (activeRegistry) {
            case 'patient_registry_form':
                return <FormBuilder settings={settings} onUpdateSettings={onUpdateSettings} />;
            case 'procedures':
                return <ProcedureCatalog settings={settings} onUpdateSettings={onUpdateSettings} />;
            case 'sms_hub':
                return <SmsHub settings={settings} onUpdateSettings={onUpdateSettings} />;
            case 'audit_trail':
                return <AuditTrailViewer auditLog={auditLog} auditLogVerified={auditLogVerified} />;
            // Other cases can be extracted similarly
            // Fallback for non-extracted components:
            default:
                return (
                    <div className="p-20 text-center">
                        <h3 className="text-xl font-bold text-slate-400">Component not extracted yet.</h3>
                        <p className="text-slate-500">The content for "{activeRegistry}" would be displayed here.</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden relative">
            <div className="w-72 md:w-80 bg-teal-900 text-white flex flex-col shrink-0 shadow-2xl z-40 overflow-y-auto no-scrollbar transition-all duration-500">
                <div className="p-8 border-b border-white/10 shrink-0">
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-teal-400">Settings Hub</h2>
                </div>
                <div className="p-4 space-y-8">
                    {sidebarGroups.map(group => (
                        <div key={group.key} className="space-y-2">
                            <h4 className="px-4 text-[10px] font-black text-teal-500 uppercase tracking-widest">{group.label}</h4>
                            {group.items.map(item => (
                                <button key={item.id} onClick={() => setActiveRegistry(item.id)} className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between transition-all ${activeRegistry === item.id ? 'bg-white text-teal-900 font-bold shadow-xl' : 'hover:bg-white/5 text-teal-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <item.icon size={20} className="shrink-0"/>
                                        <span className="text-xs font-black uppercase tracking-widest truncate">{item.label}</span>
                                    </div>
                                    <ChevronRight size={14} className={activeRegistry === item.id ? 'rotate-90' : ''}/>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 bg-white relative overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {renderContent()}
                </div>
            </div>

            {/* MODALS for non-extracted components */}
            {editingMedication && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center p-4"><div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingMedication(null)}/><div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-6 animate-in zoom-in-95"><h3 className="text-xl font-black uppercase tracking-widest text-lilac-900 border-b border-lilac-50 pb-4 mb-2">Pharmacy Entry</h3><div className="space-y-4"><div><label className="label text-[10px]">Generic Name (RA 6675)</label><input type="text" value={editingMedication.genericName} onChange={e => setEditingMedication({...editingMedication, genericName: e.target.value})} className="input text-lg font-black" /></div><div><label className="label text-[10px]">Commercial Brand Name</label><input type="text" value={editingMedication.brandName} onChange={e => setEditingMedication({...editingMedication, brandName: e.target.value})} className="input" placeholder="Optional" /></div><div className="grid grid-cols-2 gap-4"><div><label className="label text-[10px]">Dosage Form</label><input type="text" value={editingMedication.dosage} onChange={e => setEditingMedication({...editingMedication, dosage: e.target.value})} className="input" placeholder="e.g. 500mg" /></div><div><label className="label text-[10px]">S2 Controlled Substance</label><button onClick={() => setEditingMedication({...editingMedication, isS2Controlled: !editingMedication.isS2Controlled})} className={`w-full py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase ${editingMedication.isS2Controlled ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}>{editingMedication.isS2Controlled ? '💊 S2 Active' : 'Regular'}</button></div></div><div><label className="label text-[10px]">Default Sig (Instructions)</label><textarea value={editingMedication.instructions} onChange={e => setEditingMedication({...editingMedication, instructions: e.target.value})} className="input h-20 text-xs font-bold" /></div></div><div className="flex gap-3 pt-4"><button onClick={() => setEditingMedication(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button><button onClick={handleSaveMedication} className="flex-[2] py-4 bg-lilac-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-lilac-600/20">Register Drug</button></div></div></div>
            )}
            {editingResource && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center p-4"><div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingResource(null)}/><div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-6 animate-in zoom-in-95"><h3 className="text-xl font-black uppercase tracking-widest text-teal-900 border-b border-teal-50 pb-4 mb-2">Resource Detail</h3><div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 shadow-inner flex items-center justify-between">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">SYSTEM ASSET UID</label>
                            <div className="text-2xl font-black font-mono text-teal-800 leading-none">{editingResource.id}</div>
                        </div>
                        <ShieldCheck size={32} className="text-teal-600 opacity-20"/>
                    </div>
                    <div><label className="label text-[10px]">Resource Narrative</label><input type="text" value={editingResource.name} onChange={e => setEditingResource({...editingResource, name: e.target.value})} className="input" placeholder="e.g. Chair Alpha" /></div><div className="grid grid-cols-2 gap-4"><div><label className="label text-[10px]">Classification</label><select value={editingResource.type} onChange={e => setEditingResource({...editingResource, type: e.target.value as any})} className="input"><option value={ResourceType.CHAIR}>Dental Chair</option><option value={ResourceType.XRAY}>Imaging Unit</option><option value={ResourceType.CONSULTATION}>Consultation</option></select></div><div><label className="label text-[10px]">Site</label><select value={editingResource.branch} onChange={e => {
                        const newBranch = e.target.value;
                        const newId = generateResourceUid(newBranch, settings.resources);
                        setEditingResource({...editingResource, branch: newBranch, id: newId});
                    }} className="input">{settings.branches.map(b => <option key={b} value={b}>{b}</option>)}</select></div></div><div><label className="label text-[10px]">Hex Color Key</label><input type="color" value={editingResource.colorCode} onChange={e => setEditingResource({...editingResource, colorCode: e.target.value})} className="w-full h-12 rounded-xl" /></div></div><div className="flex gap-3 pt-4"><button onClick={() => setEditingResource(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button><button onClick={handleSaveResource} className="flex-[2] py-4 bg-teal-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-teal-600/20">Commit to Grid</button></div></div></div>
            )}
            {editingAsset && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center p-4"><div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingAsset(null)}/><div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-6 animate-in zoom-in-95"><h3 className="text-xl font-black uppercase tracking-widest text-lilac-900 border-b border-lilac-50 pb-4 mb-2">Asset Life-Cycle</h3><div className="space-y-4"><div><label className="label text-[10px]">Equipment Narrative</label><input type="text" value={editingAsset.name} onChange={e => setEditingAsset({...editingAsset, name: e.target.value})} className="input" /></div><div className="grid grid-cols-2 gap-4"><div><label className="label text-[10px]">Brand/Make</label><input type="text" value={editingAsset.brand} onChange={e => setEditingAsset({...editingAsset, brand: e.target.value})} className="input" /></div><div><label className="label text-[10px]">Serial Number (UID)</label><input type="text" value={editingAsset.serialNumber} onChange={e => setEditingAsset({...editingAsset, serialNumber: e.target.value})} className="input font-mono" /></div></div><div className="grid grid-cols-2 gap-4"><div><label className="label text-[10px]">Last Maintenance</label><input type="date" value={editingAsset.lastService} onChange={e => setEditingAsset({...editingAsset, lastService: e.target.value})} className="input" /></div><div><label className="label text-[10px]">Cycle Months</label><input type="number" value={editingAsset.frequencyMonths} onChange={e => setEditingAsset({...editingAsset, frequencyMonths: parseInt(e.target.value)})} className="input" /></div></div><div><label className="label text-[10px]">Operational Status</label><select value={editingAsset.status} onChange={e => setEditingAsset({...editingAsset, status: e.target.value as any})} className="input"><option value="Ready">Ready</option><option value="Service Due">Service Due</option><option value="Down">Down / Out-of-Service</option></select></div></div><div className="flex gap-3 pt-4"><button onClick={() => setEditingAsset(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button><button onClick={handleSaveAsset} className="flex-[2] py-4 bg-lilac-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-lilac-600/20">Sync Record</button></div></div></div>
            )}
        </div>
    );
};

export default FieldManagement;

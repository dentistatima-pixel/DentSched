import React, { useState, useMemo, useCallback } from 'react';
import { 
  FieldSettings, User, UserRole, AuditLogEntry, Patient, ClinicalIncident, 
  RegistrationField, ProcedureItem, Medication, HospitalAffiliation, PayrollAdjustmentTemplate, ClinicResource, MaintenanceAsset, ResourceType, Appointment
} from '../types';
import { 
  Plus, Trash2, Edit2, Sliders, Settings, ChevronRight, DollarSign, 
  Box, MapPin, User as UserIcon, Pill, 
  ShieldAlert, ShieldCheck, Shield, Database, Archive, Layers, Receipt, Activity, 
  Sparkles, Zap, Monitor, Wrench, ClipboardList, 
  Armchair, FileText, 
  ArrowUp, ArrowDown, X, LayoutPanelLeft, Move, PanelLeftClose, PanelLeftOpen, CheckCircle2, Pencil, Droplets, FlaskConical, Hash, HeartPulse, Building2, CreditCard, Percent, Banknote, Phone, AlertTriangle, Fingerprint, Search, ShieldCheck as VerifiedIcon, Scale, Globe, Lock, ShieldQuestion, FileSignature, Clock, RefreshCw, AlertCircle, Download, ArrowRight, Link
} from 'lucide-react';
import RegistrationBasicInfo from './RegistrationBasicInfo';
import RegistrationMedical from './RegistrationMedical';
import { useToast } from './ToastSystem';
import { formatDate } from '../constants';
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

    // Visual Builder States
    const [selectedField, setSelectedField] = useState<{ id: string, type: string } | null>(null);
    const [activeSection, setActiveSection] = useState<'IDENTITY' | 'MEDICAL' | 'DENTAL'>('IDENTITY');

    // Structured "New Entry" form state for Form Builder
    const [newEntryForm, setNewEntryForm] = useState<Partial<RegistrationField>>({
        label: '', type: 'text', section: 'IDENTITY', width: 'half', isCritical: false
    });

    // --- REGISTRY EDITORS ---
    const [editingProcedure, setEditingProcedure] = useState<Partial<ProcedureItem> | null>(null);
    const [editingMedication, setEditingMedication] = useState<Partial<Medication> | null>(null);
    const [editingAdjustment, setEditingAdjustment] = useState<Partial<PayrollAdjustmentTemplate> | null>(null);
    const [editingAffiliation, setEditingAffiliation] = useState<Partial<HospitalAffiliation> | null>(null);
    const [editingResource, setEditingResource] = useState<Partial<ClinicResource> | null>(null);
    const [editingAsset, setEditingAsset] = useState<Partial<MaintenanceAsset> | null>(null);
    
    const [resourceFilterBranch, setResourceFilterBranch] = useState<string>(settings.branches[0] || '');

    const [newShade, setNewShade] = useState('');
    const [newMaterial, setNewMaterial] = useState('');
    const [newExpenseCategory, setNewExpenseCategory] = useState('');

    const sidebarGroups = [
        { key: 'core', label: 'Practice Identity', icon: Activity, items: [
            { id: 'branding', label: 'Practice Identity', icon: Sparkles }
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
            { id: 'paymentModes', label: 'Payment Modes', icon: Banknote },
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
        ]}
    ];

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

    // --- GOVERNANCE LOGIC ---
    const verifyIntegrityChain = useCallback(() => {
        setIsVerifyingLogs(true);
        setTimeout(() => {
            if (auditLog.length <= 1) {
                toast.success("Chain integrity verified (Genesis record).");
                setIsVerifyingLogs(false);
                return;
            }
            const sorted = [...auditLog].reverse();
            let isValid = true;
            for (let i = 1; i < sorted.length; i++) {
                const current = sorted[i];
                const prev = sorted[i-1];
                const payload = `${current.timestamp}|${current.userId}|${current.action}|${current.entityId}|${prev.hash}`;
                const expectedHash = CryptoJS.SHA256(payload).toString();
                if (current.hash !== expectedHash || current.previousHash !== prev.hash) {
                    isValid = false;
                    break;
                }
            }
            if (isValid) toast.success("Forensic chain verified. No tampering detected.");
            else toast.error("CHAIN BREACH: Log integrity violation detected.");
            setIsVerifyingLogs(false);
        }, 1500);
    }, [auditLog]);

    const filteredAuditLog = useMemo(() => {
        if (!auditSearchTerm) return auditLog;
        return auditLog.filter(l => 
            l.details.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
            l.userName.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
            l.action.toLowerCase().includes(auditSearchTerm.toLowerCase())
        );
    }, [auditLog, auditSearchTerm]);

    const dataTransferRegistry = useMemo(() => {
        return appointments
            .filter(a => !!a.dataTransferId)
            .map(a => {
                const patient = patients.find(p => p.id === a.patientId);
                const vendor = settings.vendors.find(v => v.id === a.labDetails?.vendorId);
                return {
                    id: a.dataTransferId!,
                    date: a.date,
                    patientName: patient?.name || 'Unknown',
                    vendorName: vendor?.name || 'Direct Sub-processor',
                    procedure: a.type
                };
            }).sort((a,b) => b.date.localeCompare(a.date));
    }, [appointments, patients, settings.vendors]);

    const retentionStats = useMemo(() => {
        const now = new Date();
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        
        const active = patients.filter(p => !p.isAnonymized);
        const anonymized = patients.filter(p => p.isAnonymized);
        const nearingDestruction = patients.filter(p => {
            if (p.isAnonymized) return false;
            const lastVisit = p.lastVisit === 'First Visit' ? now.toISOString() : p.lastVisit;
            const visitDate = new Date(lastVisit);
            const destructionDate = new Date(visitDate);
            destructionDate.setFullYear(destructionDate.getFullYear() + 10);
            const diffDays = Math.ceil((destructionDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
            return diffDays <= 90;
        });

        return { activeCount: active.length, anonymizedCount: anonymized.length, destructionCount: nearingDestruction.length, nearingDestruction };
    }, [patients]);

    // --- REGISTRY SAVE HANDLERS ---
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

    const handleSaveResource = () => {
        if (!editingResource?.name) return;
        const next = editingResource.id
            ? settings.resources.map(r => r.id === editingResource.id ? editingResource as ClinicResource : r)
            : [...settings.resources, { ...editingResource, id: `res_${Date.now()}` } as ClinicResource];
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

    const renderCatalogContent = () => {
        switch (activeRegistry) {
            case 'audit_trail':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Forensic Audit Trail</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Immutable session and data change logs</p></div>
                            <div className="flex gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={18} />
                                    <input type="text" placeholder="Search logs..." value={auditSearchTerm} onChange={e => setAuditSearchTerm(e.target.value)} className="bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-3 font-bold text-xs uppercase tracking-widest text-slate-800 outline-none focus:border-teal-500 shadow-sm w-64" />
                                </div>
                                <button onClick={verifyIntegrityChain} disabled={isVerifyingLogs} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 ${isVerifyingLogs ? 'bg-slate-100 text-slate-400' : 'bg-teal-600 text-white shadow-teal-600/30 hover:scale-105 active:scale-95'}`}>
                                    {isVerifyingLogs ? <RefreshCw size={20} className="animate-spin"/> : <ShieldCheck size={20}/>} {isVerifyingLogs ? 'Validating Chain...' : 'Verify Chain Integrity'}
                                </button>
                            </div>
                        </div>
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                                    <tr><th className="p-6 text-left">Timestamp</th><th className="p-6 text-left">Entity Action</th><th className="p-6 text-left">User</th><th className="p-6 text-left">Narrative</th><th className="p-6 text-right">Integrity</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAuditLog.slice(0, 50).map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-6"><div className="text-xs font-mono font-bold text-slate-500">{new Date(log.timestamp).toLocaleString()}</div>{log.isVerifiedTimestamp && <div className="text-[8px] font-black text-teal-600 uppercase mt-0.5 flex items-center gap-1"><VerifiedIcon size={8}/> Trusted Clock</div>}</td>
                                            <td className="p-6"><span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border ${log.action === 'LOGIN' ? 'bg-blue-50 text-blue-700 border-blue-100' : log.action === 'SECURITY_ALERT' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{log.action}</span></td>
                                            <td className="p-6 font-black text-slate-800 text-xs uppercase tracking-tight">{log.userName}</td>
                                            <td className="p-6"><p className="text-xs font-bold text-slate-600 leading-relaxed max-w-md">{log.details}</p></td>
                                            <td className="p-6 text-right"><div className="flex justify-end gap-2" title={log.hash}><div className="bg-teal-50 text-teal-700 p-2 rounded-xl shadow-sm"><Fingerprint size={16}/></div></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredAuditLog.length === 0 && <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest italic">No matching logs identified in registry.</div>}
                        </div>
                    </div>
                );
            case 'npc_compliance':
                return (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Compliance Center</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">NPC Circular 16-01 & R.A. 10173 Status</p></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white p-8 rounded-[3rem] border-2 border-teal-100 shadow-lg shadow-teal-600/5 relative overflow-hidden flex flex-col justify-between">
                                <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12"><Globe size={120}/></div>
                                <div><div className="flex items-center gap-3 mb-6"><div className="bg-teal-50 p-3 rounded-2xl text-teal-600 shadow-sm"><ShieldCheck size={28}/></div><h4 className="font-black text-teal-950 uppercase tracking-tight">NPC Registration</h4></div><div className="text-3xl font-black text-slate-900 leading-none mb-2">ACTIVE</div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valid until Dec 2024 • PIC Registered</p></div>
                                <div className="mt-8 pt-6 border-t border-slate-50"><button className="text-xs font-black text-teal-600 uppercase hover:underline flex items-center gap-2">View Certificate <Download size={14}/></button></div>
                            </div>
                            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-lilac-500 transition-all">
                                <div><div className="flex items-center gap-3 mb-6"><div className="bg-lilac-50 p-3 rounded-2xl text-lilac-600 shadow-sm"><FileSignature size={28}/></div><h4 className="font-black text-lilac-950 uppercase tracking-tight">DSA Registry</h4></div><div className="text-3xl font-black text-slate-900 leading-none mb-2">{settings.vendors.filter(v => !!v.dsaSignedDate).length} / {settings.vendors.length}</div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Data Sharing Agreements</p></div>
                                <div className="mt-8 pt-6 border-t border-slate-50"><button onClick={() => setActiveRegistry('vendors')} className="text-xs font-black text-lilac-600 uppercase hover:underline flex items-center gap-2">Manage Vendors <ArrowRight size={14}/></button></div>
                            </div>
                            <div className="bg-white p-8 rounded-[3rem] border-2 border-red-100 shadow-xl shadow-red-600/5 flex flex-col justify-between relative">
                                <div className="absolute top-2 right-4"><div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" /></div>
                                <div><div className="flex items-center gap-3 mb-6"><div className="bg-red-50 p-3 rounded-2xl text-red-600 shadow-sm"><ShieldAlert size={28}/></div><h4 className="font-black text-red-950 uppercase tracking-tight">Breach Protocol</h4></div><p className="text-xs font-bold text-red-800 leading-relaxed uppercase">NPC Circular 16-03 mandates reporting within 72 hours of discovery.</p></div>
                                <div className="mt-8 pt-6 border-t border-red-50"><button onClick={() => toast.warning("Protocol Drill Initiated. Reference NPC Circular 16-03 Section 17.")} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95 transition-all">Trigger Compliance Drill</button></div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[3.5rem] border border-lilac-100 p-10 shadow-sm space-y-6">
                            <div className="flex items-center gap-3"><div className="bg-lilac-50 p-2 rounded-xl text-lilac-600"><Link size={24}/></div><h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Data Transfer Registry (Circular 16-01)</h4></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {dataTransferRegistry.map(xfer => (
                                    <div key={xfer.id} className="p-5 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-3 hover:bg-white hover:border-lilac-200 transition-all">
                                        <div className="flex justify-between text-[8px] font-black text-lilac-600 uppercase tracking-widest"><span>{formatDate(xfer.date)}</span><span>TRANSFER_ID: {xfer.id.split('-').pop()}</span></div>
                                        <div><div className="text-xs font-black text-slate-800 uppercase">{xfer.patientName}</div><div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">To: {xfer.vendorName}</div></div>
                                        <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-100 text-[10px] font-black text-slate-600 uppercase truncate">{xfer.procedure}</div>
                                    </div>
                                ))}
                                {dataTransferRegistry.length === 0 && <div className="col-span-full py-10 text-center opacity-30 italic font-bold uppercase text-xs tracking-widest">No active sub-processor data transfers recorded.</div>}
                            </div>
                        </div>

                        <section className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl space-y-8 relative overflow-hidden">
                            <div className="absolute bottom-0 right-0 opacity-10 scale-150 rotate-12"><Scale size={240}/></div>
                            <div className="flex items-center gap-4"><div className="bg-white/10 p-3 rounded-2xl"><ShieldCheck size={32} className="text-teal-400"/></div><div><h4 className="text-2xl font-black uppercase tracking-tight">Transparency Mandate</h4><p className="text-xs text-teal-400 font-bold uppercase tracking-[0.2em]">Mandatory Disclosure Statement</p></div></div>
                            <p className="text-sm font-medium leading-relaxed max-w-3xl opacity-80 italic">"The practice maintains a record of all Data Transfer IDs associated with laboratory sub-processing. Data subjects (patients) are provided with a visual identity anchor thumbnail and hash during digital intake to ensure forensic non-repudiation and temporal integrity of clinical records as required under the Revised Rules on Evidence."</p>
                            <div className="flex gap-4 pt-4"><button className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-teal-50 transition-all shadow-xl"><FileText size={18}/> View Privacy Impact Assessment</button><button className="bg-teal-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-teal-500 transition-all shadow-xl"><Lock size={18}/> Registry Encryption Standards</button></div>
                        </section>
                    </div>
                );
            case 'retention':
                return (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Retention Monitor</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">DOH & NPC Statutory Destruction Cycle</p></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                                <div className="flex items-center gap-4"><div className="bg-teal-50 p-4 rounded-3xl text-teal-600 shadow-sm"><Archive size={32}/></div><div><h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Destruction Forecast</h4><p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Mandatory 10-Year Clinical Hold</p></div></div>
                                <div className="space-y-6">
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"><span className="text-xs font-black text-slate-500 uppercase tracking-widest">Active Clinical Identity</span><span className="text-2xl font-black text-slate-900">{retentionStats.activeCount}</span></div>
                                    <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between group hover:border-amber-500 transition-all relative overflow-hidden"><div className="absolute inset-y-0 left-0 w-1 bg-amber-500" /><div className="flex-1"><span className="text-xs font-black text-amber-700 uppercase tracking-widest">Nearing Statutory Purge</span><p className="text-[10px] font-bold text-amber-600 uppercase mt-0.5">Inactive for &gt; 9.7 years</p></div><span className="text-2xl font-black text-amber-700">{retentionStats.destructionCount}</span></div>
                                    <div className="p-5 bg-lilac-50 rounded-2xl border border-lilac-100 flex items-center justify-between"><span className="text-xs font-black text-lilac-700 uppercase tracking-widest">Anonymized Records</span><span className="text-2xl font-black text-lilac-900">{retentionStats.anonymizedCount}</span></div>
                                </div>
                            </div>
                            <div className="bg-white p-10 rounded-[3rem] border-2 border-amber-100 shadow-xl shadow-amber-600/5 relative flex flex-col justify-between">
                                <div><div className="flex items-center gap-3 mb-8"><div className="bg-amber-50 p-3 rounded-2xl text-amber-600 shadow-sm"><ShieldAlert size={28}/></div><h4 className="font-black text-amber-900 uppercase tracking-tight">Purge Queue</h4></div>
                                <div className="space-y-4">{retentionStats.nearingDestruction.length > 0 ? retentionStats.nearingDestruction.map(p => (
                                    <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-amber-400 transition-all">
                                        <div><div className="font-black text-slate-800 uppercase text-xs truncate max-w-[120px]">{p.name}</div><div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Last Visit: {p.lastVisit}</div></div>
                                        <button onClick={() => onPurgePatient(p.id)} className="px-4 py-2 bg-red-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-red-600/20 hover:scale-105 active:scale-95 transition-all">Purge Now</button>
                                    </div>
                                )) : <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest italic opacity-40">No records scheduled for immediate destruction.</div>}</div></div>
                                <div className="mt-8 pt-6 border-t border-amber-50 text-[10px] font-bold text-amber-800 uppercase leading-relaxed text-center">Mandatory Retention (RA 9484): Records must be preserved for 10 years after last professional contact for judicial review.</div>
                            </div>
                        </div>
                    </div>
                );
            case 'branches':
                return (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Branch Locations</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Registry of active clinical sites</p></div>
                        <div className="flex flex-wrap gap-6 no-scrollbar">
                            {settings.branches.map(branch => (
                                <div key={branch} className="bg-white p-8 rounded-[3.5rem] border-4 border-slate-50 shadow-xl min-w-[320px] flex flex-col group hover:border-teal-500 transition-all hover:-translate-y-1 relative">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="bg-teal-50 p-4 rounded-3xl text-teal-600 shadow-sm"><MapPin size={32}/></div>
                                        <div><h4 className="font-black text-teal-900 uppercase text-xl leading-none">{branch}</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Licensed Clinical Site</p></div>
                                    </div>
                                    <div className="flex gap-2 justify-end pt-4 border-t border-slate-50">
                                        <button onClick={() => { const n = prompt("New branch name:", branch); if(n) handleUpdateRegistryOptions('branches', settings.branches.map(b => b === branch ? n : b)); }} className="text-[10px] font-black uppercase text-slate-400 hover:text-teal-600">Edit Details</button>
                                        <button onClick={() => handleUpdateRegistryOptions('branches', settings.branches.filter(b => b !== branch))} className="text-[10px] font-black uppercase text-slate-400 hover:text-red-500">Purge</button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => { const b = prompt("Branch name:"); if(b) handleUpdateRegistryOptions('branches', [...settings.branches, b]); }} className="bg-slate-50 border-4 border-dashed border-slate-200 p-8 rounded-[3.5rem] min-w-[320px] flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-teal-600 hover:border-teal-300 transition-all group">
                                <Plus size={48} className="group-hover:scale-110 transition-transform"/>
                                <span className="font-black text-sm uppercase tracking-[0.2em]">Add New Branch</span>
                            </button>
                        </div>
                    </div>
                );
            case 'resources':
                return (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Physical Resource Grid</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Map chairs and units to specific locations</p></div>
                            <div className="flex gap-3">
                                <select value={resourceFilterBranch} onChange={e => setResourceFilterBranch(e.target.value)} className="bg-white border-2 border-slate-100 rounded-2xl px-6 py-3 font-black text-xs uppercase tracking-widest text-teal-800 outline-none focus:border-teal-500 shadow-sm">
                                    {settings.branches.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                                <button onClick={() => setEditingResource({ name: '', branch: resourceFilterBranch, type: ResourceType.CHAIR, colorCode: '#14b8a6' })} className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> Register Resource</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {settings.resources.filter(r => r.branch === resourceFilterBranch).map(res => (
                                <div key={res.id} className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm group hover:border-teal-500 transition-all relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-12 h-12" style={{ backgroundColor: res.colorCode }} />
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-4 rounded-2xl shadow-sm" style={{ backgroundColor: `${res.colorCode}15`, color: res.colorCode }}>{res.type === ResourceType.CHAIR ? <Armchair size={32}/> : <Monitor size={32}/>}</div>
                                        <div><h4 className="font-black text-slate-900 uppercase text-lg leading-none">{res.name}</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{res.type}</p></div>
                                    </div>
                                    <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                                        <div className="flex gap-2"><div className="w-4 h-4 rounded-full border border-slate-200 shadow-inner" style={{ backgroundColor: res.colorCode }} /><span className="text-[10px] font-black uppercase text-slate-500">{res.colorCode}</span></div>
                                        <button onClick={() => setEditingResource(res)} className="p-2 text-slate-300 hover:text-teal-600 transition-colors opacity-0 group-hover:opacity-100"><Edit2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                            {settings.resources.filter(r => r.branch === resourceFilterBranch).length === 0 && <div className="col-span-full py-20 text-center opacity-30 italic uppercase font-black tracking-widest">No resources mapped to this location.</div>}
                        </div>
                    </div>
                );
            case 'assets':
                return (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Asset Status Dashboard</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Serialized high-value equipment tracking</p></div>
                            <button onClick={() => setEditingAsset({ name: '', brand: '', serialNumber: '', status: 'Ready', branch: settings.branches[0], frequencyMonths: 6, lastService: new Date().toISOString().split('T')[0] })} className="bg-lilac-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-lilac-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> New Asset Entry</button>
                        </div>
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                                    <tr><th className="p-6 text-left">Asset Narrative</th><th className="p-6 text-left">Registry Location</th><th className="p-6 text-center">Status</th><th className="p-6 text-right">Service Date</th><th className="p-6 text-right">Actions</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {settings.assets.map(asset => (
                                        <tr key={asset.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-6"><div className="font-black text-slate-800 uppercase tracking-tight">{asset.name}</div><div className="text-[10px] font-black text-slate-400 uppercase mt-0.5 tracking-tighter">SN: {asset.serialNumber} • {asset.brand}</div></td>
                                            <td className="p-6"><span className="text-[10px] font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tighter">{asset.branch}</span></td>
                                            <td className="p-6 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full animate-pulse ${asset.status === 'Ready' ? 'bg-teal-500' : asset.status === 'Service Due' ? 'bg-amber-500' : 'bg-red-600'}`} />
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${asset.status === 'Ready' ? 'text-teal-700' : asset.status === 'Service Due' ? 'text-amber-700' : 'text-red-700'}`}>{asset.status}</span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right font-mono text-xs text-slate-500">{formatDate(asset.lastService)}</td>
                                            {/* Fix: Changed 'Trash' to 'Trash2' on line 538 */}
                                            <td className="p-6 text-right opacity-0 group-hover:opacity-100 transition-opacity"><div className="flex justify-end gap-2"><button onClick={() => setEditingAsset(asset)} className="p-2 text-slate-400 hover:text-lilac-600"><Pencil size={16}/></button><button onClick={() => { if(confirm("Purge asset record?")) onUpdateSettings({...settings, assets: settings.assets.filter(a => a.id !== asset.id)}); }} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16}/></button></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {settings.assets.length === 0 && <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest italic">No assets registered in the infrastructure catalog.</div>}
                        </div>
                    </div>
                );
            case 'procedures':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Procedure Catalog</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Registry of diagnostic and therapeutic fees</p>
                            </div>
                            <button onClick={() => setEditingProcedure({ name: '', price: 0, category: 'General' })} className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> Add Procedure</button>
                        </div>
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                                    <tr><th className="p-5 text-left">Procedure Narrative</th><th className="p-5 text-left">Classification</th><th className="p-5 text-right">Standard Fee</th><th className="p-5 text-right">Actions</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {settings.procedures.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-5"><span className="font-black text-slate-800 uppercase tracking-tight">{p.name}</span></td>
                                            <td className="p-5"><span className="text-[10px] font-black text-teal-700 bg-teal-50 px-3 py-1 rounded-full uppercase border border-teal-100">{p.category}</span></td>
                                            <td className="p-5 text-right"><span className="text-lg font-black text-slate-900">₱{p.price.toLocaleString()}</span></td>
                                            {/* Fix: Changed 'Trash' to 'Trash2' on line 568 */}
                                            <td className="p-5 text-right opacity-0 group-hover:opacity-100 transition-opacity"><div className="flex justify-end gap-2"><button onClick={() => setEditingProcedure(p)} className="p-2 text-slate-400 hover:text-teal-600 transition-all"><Pencil size={16}/></button><button onClick={() => onUpdateSettings({...settings, procedures: settings.procedures.filter(x => x.id !== p.id)})} className="p-2 text-slate-400 hover:text-red-600 transition-all"><Trash2 size={16}/></button></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'medications':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Pharmacy Registry</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">RA 6675 Compliant Generic Drug List</p>
                            </div>
                            <button onClick={() => setEditingMedication({ genericName: '', brandName: '', dosage: '', instructions: '' })} className="bg-lilac-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-lilac-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> Add Entry</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {settings.medications.map(m => (
                                <div key={m.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-xl flex flex-col justify-between group hover:border-lilac-500 transition-all hover:-translate-y-1">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="text-xl font-black text-teal-800 uppercase tracking-tighter leading-none">{m.genericName}</div>
                                            <button onClick={() => setEditingMedication(m)} className="p-2 text-slate-300 hover:text-lilac-600 transition-colors opacity-0 group-hover:opacity-100"><Pencil size={16}/></button>
                                        </div>
                                        {m.brandName && <div className="text-xs font-bold text-slate-500 italic mb-4 uppercase">Brand: {m.brandName}</div>}
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400"><span>Standard Dosage</span><span className="text-slate-800">{m.dosage}</span></div>
                                            <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase">{m.instructions}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'paymentModes':
                return (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Collection Methods</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Configure active patient ledger entry modes</p></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {settings.paymentModes.map(mode => (
                                <div key={mode} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 flex flex-col items-center justify-center gap-4 group hover:border-teal-500 transition-all relative">
                                    <div className="bg-teal-50 p-4 rounded-full text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-sm"><CreditCard size={32}/></div>
                                    <span className="font-black text-slate-800 uppercase tracking-widest text-[10px]">{mode}</span>
                                    <button onClick={() => onUpdateSettings({...settings, paymentModes: settings.paymentModes.filter(m => m !== mode)})} className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><X size={16}/></button>
                                </div>
                            ))}
                            <button onClick={() => { const m = prompt("Payment Mode Label:"); if(m) handleUpdateRegistryOptions('paymentModes', [...settings.paymentModes, m]); }} className="border-4 border-dashed border-slate-100 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 text-slate-300 hover:text-teal-600 hover:border-teal-100 transition-all"><Plus size={32}/><span className="text-[10px] font-black uppercase tracking-widest">New Mode</span></button>
                        </div>
                    </div>
                );
            case 'payrollAdjustments':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Adjustment Catalog</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Registry of standardized payroll credits and debits</p></div>
                            <button onClick={() => setEditingAdjustment({ label: '', type: 'Credit', category: 'Incentives' })} className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> New Catalog Entry</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <section className="space-y-4"><h4 className="text-xs font-black text-teal-700 uppercase tracking-widest border-b border-teal-100 pb-2">Credits (+)</h4>{settings.payrollAdjustmentTemplates.filter(a => a.type === 'Credit').map(adj => (
                                <div key={adj.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group">
                                    <div><div className="font-black text-slate-800 uppercase tracking-tight text-sm">{adj.label}</div><div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{adj.category}</div></div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100"><button onClick={() => setEditingAdjustment(adj)} className="p-2 text-slate-300 hover:text-teal-600 transition-all"><Pencil size={14}/></button></div>
                                </div>
                            ))}</section>
                            <section className="space-y-4"><h4 className="text-xs font-black text-red-700 uppercase tracking-widest border-b border-red-100 pb-2">Debits (-)</h4>{settings.payrollAdjustmentTemplates.filter(a => a.type === 'Debit').map(adj => (
                                <div key={adj.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group">
                                    <div><div className="font-black text-slate-800 uppercase tracking-tight text-sm">{adj.label}</div><div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{adj.category}</div></div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100"><button onClick={() => setEditingAdjustment(adj)} className="p-2 text-slate-300 hover:text-red-600 transition-all"><Pencil size={14}/></button></div>
                                </div>
                            ))}</section>
                        </div>
                    </div>
                );
            case 'expenseCategories':
                return (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Chart of Accounts</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Classification tags for operational overhead</p></div>
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                            <div className="flex gap-2"><input type="text" value={newExpenseCategory} onChange={e => setNewExpenseCategory(e.target.value)} onKeyDown={e => e.key === 'Enter' && (()=>{ handleUpdateRegistryOptions('expenseCategories', [...settings.expenseCategories, newExpenseCategory]); setNewExpenseCategory(''); })()} placeholder="e.g. Software Subscriptions" className="input flex-1" /><button onClick={()=>{ handleUpdateRegistryOptions('expenseCategories', [...settings.expenseCategories, newExpenseCategory]); setNewExpenseCategory(''); }} className="bg-teal-600 text-white px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Add to Chart</button></div>
                            <div className="space-y-2">{settings.expenseCategories.map(cat => (
                                <div key={cat} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl group transition-all hover:bg-white hover:border hover:border-teal-100">
                                    <span className="font-black text-slate-800 uppercase tracking-tight text-xs">{cat}</span>
                                    <button onClick={() => handleUpdateRegistryOptions('expenseCategories', settings.expenseCategories.filter(c => c !== cat))} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                                </div>
                            ))}</div>
                        </div>
                    </div>
                );
            case 'hospitalAffiliations':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Referral Network</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Verified partner institutions for medical coordination</p></div>
                            <button onClick={() => setEditingAffiliation({ name: '', location: '', hotline: '' })} className="bg-lilac-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-lilac-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> Register Institution</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{settings.hospitalAffiliations.map(h => (
                            <div key={h.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-xl flex flex-col justify-between group hover:border-lilac-500 transition-all hover:-translate-y-1">
                                <div><div className="flex justify-between items-start mb-4"><div className="text-xl font-black text-lilac-900 uppercase tracking-tighter leading-none">{h.name}</div><button onClick={() => setEditingAffiliation(h)} className="p-2 text-slate-300 hover:text-lilac-600 opacity-0 group-hover:opacity-100 transition-all"><Pencil size={16}/></button></div><div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-4"><MapPin size={14}/> {h.location}</div></div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emergency Hotline</span><span className="text-sm font-black text-teal-700 flex items-center gap-2"><Phone size={14}/> {h.hotline}</span></div>
                            </div>
                        ))}</div>
                    </div>
                );
            case 'staff':
                return (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Clinician Registry</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Credentialed practitioners and fee-split tiers</p></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{staff.map(s => (
                            <div key={s.id} className="bg-white p-8 rounded-[3.5rem] border-4 border-slate-50 shadow-xl flex flex-col group hover:border-teal-500 transition-all hover:-translate-y-2">
                                <div className="flex items-center gap-6 mb-8"><img src={s.avatar} className="w-20 h-20 rounded-3xl border-4 border-white shadow-lg" /><div className="flex-1 min-w-0"><h4 className="font-black text-slate-900 uppercase tracking-tighter text-xl truncate leading-none mb-1">{s.name}</h4><div className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100 w-fit">{s.role}</div></div></div>
                                <div className="space-y-4">{s.role === UserRole.DENTIST && (<div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2"><div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission Split</span><span className="text-lg font-black text-teal-800">{(s.commissionRate || 0) * 100}%</span></div><div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payout ID</span><span className="text-xs font-mono font-bold text-slate-600">{s.payoutHandle || 'Not Configured'}</span></div></div>)}</div>
                            </div>
                        ))}</div>
                    </div>
                );
            case 'shadeGuides':
                return (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-8">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-6"><div className="flex items-center gap-4"><div className="bg-lilac-50 p-3 rounded-2xl text-lilac-600 shadow-sm"><Layers size={24}/></div><div><h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Shade Guide Registry</h4><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Restorative matching markers</p></div></div><div className="flex gap-2"><input type="text" value={newShade} onChange={e => setNewShade(e.target.value)} onKeyDown={e => e.key === 'Enter' && (()=>{ onUpdateSettings({...settings, shadeGuides: [...settings.shadeGuides, newShade]}); setNewShade(''); })()} placeholder="e.g. A1" className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold focus:border-lilac-500 outline-none w-32" /><button onClick={()=>{ onUpdateSettings({...settings, shadeGuides: [...settings.shadeGuides, newShade]}); setNewShade(''); }} className="bg-lilac-600 text-white p-2.5 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"><Plus size={20}/></button></div></div>
                            <div className="flex flex-wrap gap-2">{settings.shadeGuides.map(s => (<span key={s} className="bg-lilac-50 text-lilac-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-lilac-100 flex items-center gap-2 group shadow-sm hover:border-lilac-500 transition-all">{s} <button onClick={() => onUpdateSettings({...settings, shadeGuides: settings.shadeGuides.filter(x => x !== s)})} className="opacity-0 group-hover:opacity-100 text-lilac-400 hover:text-red-500 transition-all"><X size={14}/></button></span>))}</div>
                        </section>
                        <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-8">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-6"><div className="flex items-center gap-4"><div className="bg-teal-50 p-3 rounded-2xl text-teal-600 shadow-sm"><FlaskConical size={24}/></div><div><h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Restorative Materials</h4><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Clinical inventory categories</p></div></div><div className="flex gap-2"><input type="text" value={newMaterial} onChange={e => setNewMaterial(e.target.value)} onKeyDown={e => e.key === 'Enter' && (()=>{ onUpdateSettings({...settings, restorativeMaterials: [...settings.restorativeMaterials, newMaterial]}); setNewMaterial(''); })()} placeholder="e.g. Zirconia" className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold focus:border-teal-500 outline-none w-48" /><button onClick={()=>{ onUpdateSettings({...settings, restorativeMaterials: [...settings.restorativeMaterials, newMaterial]}); setNewMaterial(''); }} className="bg-teal-600 text-white p-2.5 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"><Plus size={20}/></button></div></div>
                            <div className="flex flex-wrap gap-2">{settings.restorativeMaterials.map(m => (<span key={m} className="bg-teal-50 text-teal-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-teal-100 flex items-center gap-2 group shadow-sm hover:border-teal-500 transition-all">{m} <button onClick={() => onUpdateSettings({...settings, restorativeMaterials: settings.restorativeMaterials.filter(x => x !== m)})} className="opacity-0 group-hover:opacity-100 text-teal-400 hover:text-red-500 transition-all"><X size={14}/></button></span>))}</div>
                        </section>
                    </div>
                );
            case 'branding':
            default:
                return (
                    <div className="p-10 space-y-12 overflow-y-auto h-full">
                        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm space-y-6 max-w-xl">
                            <div><label className="label text-xs">Practice Legal Name</label><input type="text" value={settings.clinicName} onChange={e => onUpdateSettings({...settings, clinicName: e.target.value})} className="input text-xl font-black" /></div>
                            <div><label className="label text-xs">Module Toggles</label><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{(Object.entries(settings.features) as any).map(([k, v]: any) => (
                                <button key={k} onClick={() => onUpdateSettings({...settings, features: {...settings.features, [k]: !v}})} className={`p-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest ${v ? 'bg-teal-50 border-teal-500 text-teal-900' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{k.replace(/([A-Z])/g, ' $1')}</button>
                            ))}</div></div>
                        </div>
                    </div>
                );
        }
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
                <div className="flex-1 overflow-y-auto no-scrollbar pb-32"><div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8"><div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl border-4 border-white overflow-hidden flex flex-col"><div className="p-6 md:p-10 bg-teal-900 text-white shrink-0 relative"><div className="flex items-center gap-4"><div className="bg-lilac-500 p-2 md:p-3 rounded-2xl shadow-lg"><LayoutPanelLeft size={28} className="md:w-8 md:h-8" /></div><div><h2 className="text-xl md:text-3xl font-black uppercase tracking-tight leading-none">Admission Form</h2><p className="text-[10px] md:text-xs font-black text-teal-300 uppercase tracking-[0.2em] mt-1 md:mt-2">Visual Layout Architect Mode</p></div></div><button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all md:hidden">{isSidebarCollapsed ? <PanelLeftOpen size={20}/> : <PanelLeftClose size={20}/>}</button></div><div className="bg-slate-50 px-4 md:px-8 border-b border-slate-200 flex gap-1 overflow-x-auto no-scrollbar">{(['IDENTITY', 'MEDICAL'] as const).map(tab => (<button key={tab} onClick={() => setActiveSection(tab)} className={`py-4 md:py-6 px-4 md:px-8 font-black text-[10px] md:text-xs uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${activeSection === tab ? 'border-teal-600 text-teal-900 bg-white' : 'border-transparent text-slate-400'}`}>{tab} Design</button>))}</div><div className="p-4 md:p-10 bg-white min-h-[600px] md:min-h-[800px]">{activeSection === 'IDENTITY' ? (<RegistrationBasicInfo formData={{}} handleChange={() => {}} fieldSettings={settings} designMode={true} onFieldClick={handleFieldClick} selectedFieldId={selectedId} />) : (<RegistrationMedical formData={{}} handleChange={() => {}} handleArrayChange={() => {}} fieldSettings={settings} designMode={true} onFieldClick={handleFieldClick} selectedFieldId={selectedId} />)}</div></div></div></div>
                <div className={`fixed md:relative right-0 top-0 bottom-0 z-50 bg-white border-l border-slate-200 shadow-2xl flex flex-col shrink-0 transition-all duration-500 ${isSidebarCollapsed ? 'w-0 overflow-hidden md:w-16' : 'w-80 md:w-96 lg:w-80'}`}>{isSidebarCollapsed ? (<div className="flex flex-col items-center py-8 gap-6 h-full"><button onClick={() => setIsSidebarCollapsed(false)} className="p-3 text-lilac-600 bg-lilac-50 rounded-xl hover:bg-lilac-100 transition-all shadow-sm"><PanelLeftOpen size={24}/></button></div>) : (<><div className="p-6 border-b bg-lilac-50 flex justify-between items-center"><div><div className="flex items-center gap-2 text-lilac-700 font-black uppercase text-[10px] tracking-widest mb-1"><Monitor size={14}/> Field Inspector</div><h4 className="text-sm font-black text-lilac-900 uppercase truncate max-w-[180px]">{selectedId || 'Select a field'}</h4></div><button onClick={() => setIsSidebarCollapsed(true)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><PanelLeftClose size={20}/></button></div><div className="p-6 space-y-8 flex-1 overflow-y-auto no-scrollbar">{!selectedField ? (<div className="py-20 text-center space-y-4 opacity-40"><div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner"><Move size={32} className="text-slate-300"/></div><p className="text-xs font-bold text-slate-400 uppercase leading-relaxed px-4">Click any field in the form preview to edit.</p></div>) : (<div className="space-y-6 animate-in slide-in-from-right-2"><div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4"><div className="flex items-center justify-between"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Clinical Priority</span><button onClick={() => toggleCriticalStatus(selectedId!)} className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${isCritical ? 'bg-red-600 justify-end' : 'bg-slate-300 justify-start'}`}><div className="w-4 h-4 bg-white rounded-full shadow-sm" /></button></div><div className="text-[9px] text-slate-400 font-bold uppercase leading-tight">If active, this field generates an automated alert in the Clinical Command Center.</div></div><div><label className="label text-[10px] font-black">Display Narrative</label><input type="text" value={isDyn ? (dynamicField?.label || '') : (coreFieldLabel !== null ? coreFieldLabel : selectedId)} onChange={e => { if (isDyn) handleUpdateDynamicField(selectedId!, { label: e.target.value }); else if (isCore) handleUpdateLabelMap(selectedId!, e.target.value); }} className="input text-sm font-bold shadow-inner" placeholder="Enter label..." /></div>{registryOptions && registryKey && (<div className="bg-white rounded-2xl border-2 border-teal-100 p-4 space-y-4 animate-in zoom-in-95"><div className="flex justify-between items-center border-b border-teal-50 pb-2 mb-2"><span className="text-[10px] font-black text-teal-700 uppercase tracking-widest">Registry Options</span><button onClick={() => handleAddRegistryOption(registryKey)} className="text-[10px] font-black text-teal-600 hover:text-teal-800 uppercase flex items-center gap-1"><Plus size={10}/> Add Option</button></div><div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">{registryOptions.map(opt => (<div key={opt} className="flex items-center justify-between p-2 bg-teal-50/50 rounded-lg group/opt"><span className="text-xs font-bold text-teal-900">{opt}</span><button onClick={() => handleRemoveRegistryOption(registryKey, opt)} className="opacity-0 group-hover/opt:opacity-100 text-red-400 hover:text-red-600 transition-all"><Trash2 size={12}/></button></div>))}</div></div>)}{isDyn && dynamicField && (<div><label className="label text-[10px] font-black">Layout Width</label><div className="grid grid-cols-3 gap-2">{(['quarter', 'half', 'full'] as const).map(w => (<button key={w} onClick={() => handleUpdateDynamicField(selectedId!, { width: w })} className={`py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all shadow-sm ${dynamicField.width === w ? 'bg-lilac-600 border-lilac-600 text-white shadow-lilac-500/20' : 'bg-white border-slate-100 text-slate-400 hover:border-lilac-200'}`}>{w === 'quarter' ? '25%' : w === 'half' ? '50%' : '100%'}</button>))}</div></div>)}<div><label className="label text-[10px] font-black">Hierarchy</label><div className="flex gap-2"><button onClick={() => moveElement('up')} className="flex-1 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center hover:bg-teal-50 hover:border-teal-500 transition-all group"><ArrowUp size={24} className="text-slate-400 group-hover:text-teal-600 transition-all"/></button><button onClick={() => moveElement('down')} className="flex-1 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center hover:bg-teal-50 hover:border-teal-500 transition-all group"><ArrowDown size={24} className="text-slate-400 group-hover:text-teal-600 transition-all"/></button></div></div>{!isCore && (<div className="pt-6 border-t border-slate-100"><button onClick={handleRemoveSelected} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={14}/> Remove Element</button></div>)}</div>)}</div><div className="p-6 border-t bg-slate-50"><button onClick={() => setIsAdding(true)} className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-teal-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"><Plus size={16}/> New Entry Wizard</button></div></>)}</div>
            </div>
        );
    };

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden relative">
            <div className={`
                ${isSidebarCollapsed && (activeRegistry === 'patient_registry_form' || activeRegistry === 'audit_trail') ? 'w-16' : 'w-72 md:w-80'} 
                bg-teal-900 text-white flex flex-col shrink-0 shadow-2xl z-40 overflow-y-auto no-scrollbar transition-all duration-500
            `}>
                <div className="p-8 border-b border-white/10 shrink-0">
                    <h2 className={`text-sm font-black uppercase tracking-[0.3em] text-teal-400 ${isSidebarCollapsed && (activeRegistry === 'patient_registry_form' || activeRegistry === 'audit_trail') ? 'hidden' : ''}`}>Settings Hub</h2>
                    {isSidebarCollapsed && (activeRegistry === 'patient_registry_form' || activeRegistry === 'audit_trail') && <Settings size={24} className="mx-auto text-teal-400 opacity-50"/>}
                </div>
                <div className="p-4 space-y-8">
                    {sidebarGroups.map(group => (
                        <div key={group.key} className="space-y-2">
                            <h4 className={`px-4 text-[10px] font-black text-teal-500 uppercase tracking-widest ${isSidebarCollapsed && (activeRegistry === 'patient_registry_form' || activeRegistry === 'audit_trail') ? 'hidden' : ''}`}>{group.label}</h4>
                            {group.items.map(item => (
                                <button key={item.id} onClick={() => setActiveRegistry(item.id)} className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between transition-all ${activeRegistry === item.id ? 'bg-white text-teal-900 font-bold shadow-xl' : 'hover:bg-white/5 text-teal-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <item.icon size={20} className="shrink-0"/>
                                        <span className={`text-xs font-black uppercase tracking-widest truncate ${isSidebarCollapsed && (activeRegistry === 'patient_registry_form' || activeRegistry === 'audit_trail') ? 'hidden' : ''}`}>{item.label}</span>
                                    </div>
                                    <ChevronRight size={14} className={`${activeRegistry === item.id ? 'rotate-90' : ''} ${isSidebarCollapsed && (activeRegistry === 'patient_registry_form' || activeRegistry === 'audit_trail') ? 'hidden' : ''}`}/>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 bg-white relative overflow-hidden flex flex-col">
                {activeRegistry === 'patient_registry_form' ? renderFormBuilder() : (
                    <div className="flex-1 p-10 bg-slate-50/20 overflow-y-auto no-scrollbar">
                        {renderCatalogContent()}
                    </div>
                )}
            </div>

            {/* Registry Editors */}
            {editingProcedure && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center p-4"><div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingProcedure(null)}/><div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-6 animate-in zoom-in-95"><h3 className="text-xl font-black uppercase tracking-widest text-teal-900 border-b border-teal-50 pb-4 mb-2">Procedure Metadata</h3><div className="space-y-4"><div><label className="label text-[10px]">Procedure Narrative</label><input type="text" value={editingProcedure.name} onChange={e => setEditingProcedure({...editingProcedure, name: e.target.value})} className="input" placeholder="e.g. Oral Prophylaxis" /></div><div><label className="label text-[10px]">Classification Category</label><select value={editingProcedure.category} onChange={e => setEditingProcedure({...editingProcedure, category: e.target.value})} className="input"><option>General</option><option>Preventive</option><option>Restorative</option><option>Surgery</option><option>Endodontics</option><option>Prosthodontics</option><option>Imaging</option></select></div><div><label className="label text-[10px]">Standard Fee (₱)</label><input type="number" value={editingProcedure.price} onChange={e => setEditingProcedure({...editingProcedure, price: parseFloat(e.target.value)})} className="input font-black text-lg" /></div></div><div className="flex gap-3 pt-4"><button onClick={() => setEditingProcedure(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button><button onClick={handleSaveProcedure} className="flex-[2] py-4 bg-teal-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-teal-600/20">Save to Catalog</button></div></div></div>
            )}

            {editingMedication && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center p-4"><div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingMedication(null)}/><div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-6 animate-in zoom-in-95"><h3 className="text-xl font-black uppercase tracking-widest text-lilac-900 border-b border-lilac-50 pb-4 mb-2">Pharmacy Entry</h3><div className="space-y-4"><div><label className="label text-[10px]">Generic Name (RA 6675)</label><input type="text" value={editingMedication.genericName} onChange={e => setEditingMedication({...editingMedication, genericName: e.target.value})} className="input text-lg font-black" /></div><div><label className="label text-[10px]">Commercial Brand Name</label><input type="text" value={editingMedication.brandName} onChange={e => setEditingMedication({...editingMedication, brandName: e.target.value})} className="input" placeholder="Optional" /></div><div className="grid grid-cols-2 gap-4"><div><label className="label text-[10px]">Dosage Form</label><input type="text" value={editingMedication.dosage} onChange={e => setEditingMedication({...editingMedication, dosage: e.target.value})} className="input" placeholder="e.g. 500mg" /></div><div><label className="label text-[10px]">S2 Controlled Substance</label><button onClick={() => setEditingMedication({...editingMedication, isS2Controlled: !editingMedication.isS2Controlled})} className={`w-full py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase ${editingMedication.isS2Controlled ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}>{editingMedication.isS2Controlled ? '💊 S2 Active' : 'Regular'}</button></div></div><div><label className="label text-[10px]">Default Sig (Instructions)</label><textarea value={editingMedication.instructions} onChange={e => setEditingMedication({...editingMedication, instructions: e.target.value})} className="input h-20 text-xs font-bold" /></div></div><div className="flex gap-3 pt-4"><button onClick={() => setEditingMedication(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button><button onClick={handleSaveMedication} className="flex-[2] py-4 bg-lilac-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-lilac-600/20">Register Drug</button></div></div></div>
            )}

            {editingAdjustment && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center p-4"><div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingAdjustment(null)}/><div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-6 animate-in zoom-in-95"><h3 className="text-xl font-black uppercase tracking-widest text-teal-900 border-b border-teal-50 pb-4 mb-2">Adjustment Template</h3><div className="space-y-4"><div><label className="label text-[10px]">Adjustment Narrative</label><input type="text" value={editingAdjustment.label} onChange={e => setEditingAdjustment({...editingAdjustment, label: e.target.value})} className="input" placeholder="e.g. Performance Bonus" /></div><div className="grid grid-cols-2 gap-4"><div><label className="label text-[10px]">Flow Type</label><select value={editingAdjustment.type} onChange={e => setEditingAdjustment({...editingAdjustment, type: e.target.value as any})} className="input"><option>Credit</option><option>Debit</option></select></div><div><label className="label text-[10px]">Registry Group</label><select value={editingAdjustment.category} onChange={e => setEditingAdjustment({...editingAdjustment, category: e.target.value as any})} className="input"><option>Incentives</option><option>Operational</option><option>Attendance</option><option>Statutory</option></select></div></div></div><div className="flex gap-3 pt-4"><button onClick={() => setEditingAdjustment(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button><button onClick={handleSaveAdjustment} className="flex-[2] py-4 bg-teal-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-teal-600/20">Commit to Catalog</button></div></div></div>
            )}

            {editingAffiliation && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center p-4"><div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingAffiliation(null)}/><div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-6 animate-in zoom-in-95"><h3 className="text-xl font-black uppercase tracking-widest text-lilac-900 border-b border-lilac-50 pb-4 mb-2">Hospital Credentials</h3><div className="space-y-4"><div><label className="label text-[10px]">Institution Legal Name</label><input type="text" value={editingAffiliation.name} onChange={e => setEditingAffiliation({...editingAffiliation, name: e.target.value})} className="input" placeholder="e.g. Makati Medical Center" /></div><div><label className="label text-[10px]">District/Location</label><input type="text" value={editingAffiliation.location} onChange={e => setEditingAffiliation({...editingAffiliation, location: e.target.value})} className="input" /></div><div><label className="label text-[10px]">Verified Emergency Hotline</label><input type="tel" value={editingAffiliation.hotline} onChange={e => setEditingAffiliation({...editingAffiliation, hotline: e.target.value})} className="input font-mono" /></div></div><div className="flex gap-3 pt-4"><button onClick={() => setEditingAffiliation(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button><button onClick={handleSaveAffiliation} className="flex-[2] py-4 bg-lilac-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-lilac-600/20">Save Institution</button></div></div></div>
            )}

            {editingResource && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center p-4"><div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingResource(null)}/><div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-6 animate-in zoom-in-95"><h3 className="text-xl font-black uppercase tracking-widest text-teal-900 border-b border-teal-50 pb-4 mb-2">Resource Detail</h3><div className="space-y-4"><div><label className="label text-[10px]">Resource Narrative</label><input type="text" value={editingResource.name} onChange={e => setEditingResource({...editingResource, name: e.target.value})} className="input" placeholder="e.g. Chair Alpha" /></div><div className="grid grid-cols-2 gap-4"><div><label className="label text-[10px]">Classification</label><select value={editingResource.type} onChange={e => setEditingResource({...editingResource, type: e.target.value as any})} className="input"><option value={ResourceType.CHAIR}>Dental Chair</option><option value={ResourceType.XRAY}>Imaging Unit</option><option value={ResourceType.CONSULTATION}>Consultation</option></select></div><div><label className="label text-[10px]">Site</label><select value={editingResource.branch} onChange={e => setEditingResource({...editingResource, branch: e.target.value})} className="input">{settings.branches.map(b => <option key={b} value={b}>{b}</option>)}</select></div></div><div><label className="label text-[10px]">Hex Color Key</label><input type="color" value={editingResource.colorCode} onChange={e => setEditingResource({...editingResource, colorCode: e.target.value})} className="w-full h-12 rounded-xl" /></div></div><div className="flex gap-3 pt-4"><button onClick={() => setEditingResource(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button><button onClick={handleSaveResource} className="flex-[2] py-4 bg-teal-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-teal-600/20">Commit to Grid</button></div></div></div>
            )}

            {editingAsset && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center p-4"><div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingAsset(null)}/><div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-6 animate-in zoom-in-95"><h3 className="text-xl font-black uppercase tracking-widest text-lilac-900 border-b border-lilac-50 pb-4 mb-2">Asset Life-Cycle</h3><div className="space-y-4"><div><label className="label text-[10px]">Equipment Narrative</label><input type="text" value={editingAsset.name} onChange={e => setEditingAsset({...editingAsset, name: e.target.value})} className="input" /></div><div className="grid grid-cols-2 gap-4"><div><label className="label text-[10px]">Brand/Make</label><input type="text" value={editingAsset.brand} onChange={e => setEditingAsset({...editingAsset, brand: e.target.value})} className="input" /></div><div><label className="label text-[10px]">Serial Number (UID)</label><input type="text" value={editingAsset.serialNumber} onChange={e => setEditingAsset({...editingAsset, serialNumber: e.target.value})} className="input font-mono" /></div></div><div className="grid grid-cols-2 gap-4"><div><label className="label text-[10px]">Last Maintenance</label><input type="date" value={editingAsset.lastService} onChange={e => setEditingAsset({...editingAsset, lastService: e.target.value})} className="input" /></div><div><label className="label text-[10px]">Cycle Months</label><input type="number" value={editingAsset.frequencyMonths} onChange={e => setEditingAsset({...editingAsset, frequencyMonths: parseInt(e.target.value)})} className="input" /></div></div><div><label className="label text-[10px]">Operational Status</label><select value={editingAsset.status} onChange={e => setEditingAsset({...editingAsset, status: e.target.value as any})} className="input"><option value="Ready">Ready</option><option value="Service Due">Service Due</option><option value="Down">Down / Out-of-Service</option></select></div></div><div className="flex gap-3 pt-4"><button onClick={() => setEditingAsset(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button><button onClick={handleSaveAsset} className="flex-[2] py-4 bg-lilac-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-lilac-600/20">Sync Record</button></div></div></div>
            )}

            {isAdding && activeRegistry === 'patient_registry_form' && (
                <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300"><div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAdding(false)}/><div className="relative w-full max-w-lg bg-white h-full shadow-2xl border-l-8 border-lilac-500 flex flex-col animate-in slide-in-from-right-full"><div className="p-10 border-b bg-lilac-50"><h4 className="text-2xl font-black text-lilac-900 uppercase tracking-tight">New Form Entry Wizard</h4><p className="text-[10px] font-black text-lilac-600 uppercase tracking-widest mt-1">Registry Context: Builder Interface</p></div><div className="p-10 space-y-8 flex-1 overflow-y-auto no-scrollbar"><div className="space-y-6"><div><label className="label text-[10px]">Element Label *</label><input autoFocus type="text" value={newEntryForm.label} onChange={e => setNewEntryForm({...newEntryForm, label: e.target.value})} className="input text-lg font-black" placeholder="e.g. Current Medications" /></div><div className="grid grid-cols-2 gap-4"><div><label className="label text-[10px]">Registry Section</label><select value={newEntryForm.section} onChange={e => setNewEntryForm({...newEntryForm, section: e.target.value as any})} className="input text-sm font-bold"><option value="IDENTITY">Section I: Identity</option><option value="CONTACT">Section II: Contact</option><option value="MEDICAL">Section V: Medical</option><option value="DENTAL">Section IV: Dental</option></select></div><div><label className="label text-[10px]">Input Interaction</label><select value={newEntryForm.type} onChange={e => setNewEntryForm({...newEntryForm, type: e.target.value as any})} className="input text-sm font-bold"><option value="text">Short Text</option><option value="textarea">Narrative (Long Text)</option><option value="dropdown">Registry Dropdown</option><option value="boolean">Yes/No Toggle</option><option value="header">Section Card Header</option></select></div></div><div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className={`p-2 rounded-xl ${newEntryForm.isCritical ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-400'}`}><ShieldAlert size={18}/></div><span className="text-xs font-black text-slate-700 uppercase tracking-widest">Clinical Risk Flag</span></div><button onClick={() => setNewEntryForm({...newEntryForm, isCritical: !newEntryForm.isCritical})} className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${newEntryForm.isCritical ? 'bg-red-600 justify-end' : 'bg-slate-300 justify-start'}`}><div className="w-4 h-4 bg-white rounded-full" /></button></div><p className="text-[10px] text-slate-500 font-medium leading-relaxed">Marking as critical will automatically register positive findings in the clinical alert registry.</p></div></div></div><div className="p-10 border-t bg-white flex gap-3"><button onClick={() => setIsAdding(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button><button onClick={handleSaveNewEntry} className="flex-[2] py-5 bg-teal-700 text-white font-black uppercase text-xs rounded-2xl shadow-xl hover:scale-[1.02] transition-all">Add to Registry</button></div></div></div>
            )}
        </div>
    );
};

export default FieldManagement;
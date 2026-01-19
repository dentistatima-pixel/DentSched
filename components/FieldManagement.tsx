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
    const [isAdding, setIsAdding] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [auditSearchTerm, setAuditSearchTerm] = useState('');
    const [isVerifyingLogs, setIsVerifyingLogs] = useState(false);

    // Add Site State
    const [isAddingBranch, setIsAddingBranch] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');

    // Add Payment Mode State
    const [isAddingPaymentMode, setIsAddingPaymentMode] = useState(false);
    const [newPaymentModeName, setNewPaymentModeName] = useState('');

    const [selectedField, setSelectedField] = useState<{ id: string, type: string } | null>(null);
    const [activeSection, setActiveSection] = useState<'IDENTITY' | 'MEDICAL' | 'DENTAL'>('IDENTITY');

    const [newEntryForm, setNewEntryForm] = useState<Partial<RegistrationField>>({
        label: '', type: 'text', section: 'IDENTITY', width: 'half', isCritical: false
    });

    const [editingProcedure, setEditingProcedure] = useState<Partial<ProcedureItem> | null>(null);
    // Fix: Add state to manage the price of the procedure being edited, as `ProcedureItem` no longer has a price property.
    const [editingProcedurePrice, setEditingProcedurePrice] = useState<number>(0);
    const [editingMedication, setEditingMedication] = useState<Partial<Medication> | null>(null);
    const [editingAdjustment, setEditingAdjustment] = useState<Partial<PayrollAdjustmentTemplate> | null>(null);
    const [editingAffiliation, setEditingAffiliation] = useState<Partial<HospitalAffiliation> | null>(null);
    const [editingResource, setEditingResource] = useState<Partial<ClinicResource> | null>(null);
    const [editingAsset, setEditingAsset] = useState<Partial<MaintenanceAsset> | null>(null);
    
    const [resourceFilterBranch, setResourceFilterBranch] = useState<string>(settings.branches[0] || '');

    const [newShade, setNewShade] = useState('');
    const [newMaterial, setNewMaterial] = useState('');
    const [newExpenseCategory, setNewExpenseCategory] = useState('');

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

    const handleUpdateHours = (day: string, updates: Partial<DaySchedule>) => {
        const next = { ...settings.operationalHours, [day]: { ...settings.operationalHours[day as keyof typeof settings.operationalHours], ...updates } };
        onUpdateSettings({ ...settings, operationalHours: next });
    };

    const handleSmsTest = async () => {
        const smsCfg = settings.smsConfig;
        const url = smsCfg.mode === 'LOCAL' ? smsCfg.gatewayUrl : smsCfg.cloudUrl;
        if (!url) { toast.error("Gateway URL missing."); return; }

        toast.info(`Triggering ${smsCfg.mode} Pulse Test...`);
        try {
            const payload = smsCfg.mode === 'LOCAL' 
                ? { to: '09170000000', message: "DENTSCHED_GATEWAY_TEST: Local SIM connection operational.", key: smsCfg.apiKey }
                : { username: smsCfg.username, password: smsCfg.password, device_id: smsCfg.deviceId, to: '09170000000', message: "DENTSCHED_GATEWAY_TEST: Cloud Gateway pulse operational." };

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) toast.success(`Pulse Test Confirmed via ${smsCfg.mode}.`);
            else toast.error("Gateway rejected request. Verify credentials.");
        } catch (e) {
            toast.error("Gateway failure. Check server status.");
        }
    };

    const filteredAuditLog = useMemo(() => {
        if (!auditSearchTerm) return auditLog;
        return auditLog.filter(l => 
            l.details.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
            l.userName.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
            l.action.toLowerCase().includes(auditSearchTerm.toLowerCase())
        );
    }, [auditLog, auditSearchTerm]);

    const verifyIntegrityChain = useCallback(() => {
        setIsVerifyingLogs(true);
        setTimeout(() => {
            if (auditLog.length <= 1) {
                toast.success("Chain integrity verified (Genesis record).");
                setIsVerifyingLogs(false);
                return;
            }
            const logsSorted = [...auditLog].reverse();
            let isValid = true;
            for (let i = 1; i < logsSorted.length; i++) {
                const current = logsSorted[i];
                const prev = logsSorted[i-1];
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

    const dataTransferRegistry = useMemo(() => {
        return appointments
            .filter(a => !!a.dataTransferId)
            .map(a => {
                const patientMatch = patients.find(p => p.id === a.patientId);
                const vendorMatch = settings.vendors.find(v => v.id === a.labDetails?.vendorId);
                return {
                    id: a.dataTransferId!,
                    date: a.date,
                    patientName: patientMatch?.name || 'Unknown',
                    vendorName: vendorMatch?.name || 'Direct Sub-processor',
                    procedure: a.type
                };
            }).sort((a,b) => b.date.localeCompare(a.date));
    }, [appointments, patients, settings.vendors]);

    // Fix: Updated handleSaveProcedure to manage price in priceBookEntries instead of ProcedureItem.
    const handleSaveProcedure = () => {
        if (!editingProcedure?.name) return;
    
        const isNew = !editingProcedure.id;
        const procedureId = editingProcedure.id || `p_${Date.now()}`;
        const newProcedureData: ProcedureItem = {
            ...editingProcedure,
            id: procedureId,
            name: editingProcedure.name,
            category: editingProcedure.category
        } as ProcedureItem;
    
        const nextProcedures = isNew
            ? [...settings.procedures, newProcedureData]
            : settings.procedures.map(p => p.id === procedureId ? newProcedureData : p);
        
        // Find default price book
        const defaultPriceBook = settings.priceBooks?.find(pb => pb.isDefault);
        const priceBookId = defaultPriceBook?.id || settings.priceBooks?.[0]?.id || 'pb_1';
    
        let nextPriceBookEntries = [...(settings.priceBookEntries || [])];
        const priceEntryIndex = nextPriceBookEntries.findIndex(pbe => pbe.procedureId === procedureId && pbe.priceBookId === priceBookId);
    
        if (priceEntryIndex > -1) {
            nextPriceBookEntries[priceEntryIndex].price = editingProcedurePrice;
        } else {
            nextPriceBookEntries.push({
                priceBookId: priceBookId,
                procedureId: procedureId,
                price: editingProcedurePrice
            });
        }
    
        onUpdateSettings({ 
            ...settings, 
            procedures: nextProcedures,
            priceBookEntries: nextPriceBookEntries 
        });
    
        setEditingProcedure(null);
        setEditingProcedurePrice(0);
    };
    
    // Fix: Added handler to open procedure edit modal and set price state.
    const handleOpenEditProcedure = (proc: ProcedureItem) => {
        setEditingProcedure(proc);
        const price = settings.priceBookEntries?.find(pbe => pbe.procedureId === proc.id)?.price ?? 0;
        setEditingProcedurePrice(price);
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

    const handleSaveNewPaymentMode = () => {
        const trimmed = newPaymentModeName.trim();
        if (!trimmed) return;
        if (settings.paymentModes.includes(trimmed)) {
            toast.error("Payment mode already registered.");
            return;
        }
        handleUpdateRegistryOptions('paymentModes', [...settings.paymentModes, trimmed]);
        setNewPaymentModeName('');
        setIsAddingPaymentMode(false);
    };

    const handleAddExpenseCategory = () => {
        const trimmed = newExpenseCategory.trim();
        if (!trimmed) return;
        if (settings.expenseCategories.includes(trimmed)) {
            toast.error("Category already registered.");
            return;
        }
        handleUpdateRegistryOptions('expenseCategories', [...settings.expenseCategories, trimmed]);
        setNewExpenseCategory('');
    };

    const handleAddShade = () => {
        const trimmed = newShade.trim();
        if (!trimmed) return;
        if (settings.shadeGuides.includes(trimmed)) {
            toast.error("Shade already registered.");
            return;
        }
        handleUpdateRegistryOptions('shadeGuides', [...settings.shadeGuides, trimmed]);
        setNewShade('');
    };

    const handleAddMaterial = () => {
        const trimmed = newMaterial.trim();
        if (!trimmed) return;
        if (settings.restorativeMaterials.includes(trimmed)) {
            toast.error("Material already registered.");
            return;
        }
        handleUpdateRegistryOptions('restorativeMaterials', [...settings.restorativeMaterials, trimmed]);
        setNewMaterial('');
    };

    const handleSaveNewBranch = () => {
        const trimmed = newBranchName.trim();
        if (!trimmed) return;
        if (settings.branches.includes(trimmed)) {
            toast.error("Branch already registered.");
            return;
        }
        onUpdateSettings({ ...settings, branches: [...settings.branches, trimmed] });
        setNewBranchName('');
        setIsAddingBranch(false);
        toast.success("New site registered.");
    };

    const pendingArchiveCount = useMemo(() => {
        return patients.filter(p => (p.dentalChart?.length || 0) > 0).length;
    }, [patients]);

    const handleBatchPrint = () => {
        toast.info("Generating bulk patient archive...");
    };

    const retentionStats = useMemo(() => {
        const now = new Date();
        const activeCount = patients.filter(p => !p.isAnonymized).length;
        const anonymizedCount = patients.filter(p => p.isAnonymized).length;
        
        const tenYearsAgo = new Date(now);
        tenYearsAgo.setFullYear(now.getFullYear() - 10);
        
        const nearingThreshold = new Date(tenYearsAgo);
        nearingThreshold.setDate(tenYearsAgo.getDate() + 90);

        const nearingDestruction = patients.filter(p => {
            if (!p.lastVisit || p.lastVisit === 'First Visit') return false;
            const lastVisitDate = new Date(p.lastVisit);
            if (isNaN(lastVisitDate.getTime())) return false;
            return lastVisitDate <= nearingThreshold;
        });

        return {
            activeCount,
            anonymizedCount,
            destructionCount: nearingDestruction.length,
            nearingDestruction
        };
    }, [patients]);

    const renderFormBuilder = () => {
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

                {!isSidebarCollapsed && (
                    <div className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20 animate-in slide-in-from-right-10">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Element Properties</h4>
                            <button onClick={() => setSelectedField(null)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
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
                                            <input 
                                                type="text" 
                                                className="input bg-slate-50"
                                                value={selectedField.id.startsWith('core_') 
                                                    ? settings.fieldLabels[selectedField.id.replace('core_', '')] || '' 
                                                    : settings.identityFields.find(f => `field_${f.id}` === selectedField.id)?.label || 
                                                      (selectedField.type === 'question' ? selectedField.id : '')}
                                                onChange={(e) => {
                                                    if (selectedField.id.startsWith('core_')) handleUpdateLabelMap(selectedField.id, e.target.value);
                                                    else handleUpdateDynamicField(selectedField.id, { label: e.target.value });
                                                }}
                                            />
                                        </div>

                                        {!selectedField.id.startsWith('core_') && selectedField.id.startsWith('field_') && (
                                            <div>
                                                <label className="label text-[10px]">Column Span</label>
                                                <select 
                                                    className="input bg-slate-50"
                                                    value={settings.identityFields.find(f => `field_${f.id}` === selectedField.id)?.width || 'half'}
                                                    onChange={(e) => handleUpdateDynamicField(selectedField.id, { width: e.target.value as any })}
                                                >
                                                    <option value="full">Full Width (12/12)</option>
                                                    <option value="half">Half Width (6/12)</option>
                                                    <option value="third">One Third (4/12)</option>
                                                </select>
                                            </div>
                                        )}

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
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30 py-20">
                                    <MousePointer2 size={48} strokeWidth={1}/>
                                    <p className="text-xs font-black uppercase tracking-widest leading-relaxed">Select a form element to<br/>configure properties</p>
                                </div>
                            )}

                            {selectedField && (selectedField.id === 'core_suffix' || selectedField.id === 'core_sex' || selectedField.id === 'core_bloodGroup' || selectedField.id === 'core_civilStatus') && (
                                <div className="pt-8 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Options Registry</h4>
                                        <button onClick={() => {
                                            const keyMap: any = { core_suffix: 'suffixes', core_sex: 'sex', core_bloodGroup: 'bloodGroups', core_civilStatus: 'civilStatus' };
                                            handleAddRegistryOption(keyMap[selectedField.id]);
                                        }} className="text-teal-600 hover:scale-110 transition-transform"><PlusCircle size={16}/></button>
                                    </div>
                                    <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                                        {(() => {
                                            const keyMap: any = { core_suffix: 'suffixes', core_sex: 'sex', core_bloodGroup: 'bloodGroups', core_civilStatus: 'civilStatus' };
                                            return (settings[keyMap[selectedField.id] as keyof FieldSettings] as string[]).map(opt => (
                                                <div key={opt} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                                    <span className="text-xs font-bold text-slate-700">{opt}</span>
                                                    <button onClick={() => handleRemoveRegistryOption(keyMap[selectedField.id], opt)} className="text-slate-300 hover:text-red-500 transition-all"><X size={14}/></button>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-teal-900 shrink-0">
                            <button onClick={() => setIsAdding(true)} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-teal-950/50 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all">
                                <Plus size={18}/> New Form Element
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderCatalogContent = () => {
        switch (activeRegistry) {
            case 'privilege_elevation':
                if (currentUser.role !== UserRole.SYSTEM_ARCHITECT) {
                  return (
                    <div className="p-10 space-y-4 text-center">
                      <ShieldAlert size={48} className="mx-auto text-red-500" />
                      <h3 className="text-xl font-black text-slate-800">Access Denied</h3>
                      <p className="text-slate-500">This feature is restricted to the System Architect role.</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-10 animate-in fade-in duration-500">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Privilege Elevation</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Temporarily assume the role of another user for testing.</p>
                    </div>
                    <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] flex items-start gap-4">
                      <AlertTriangle size={24} className="text-amber-600 shrink-0 mt-1"/>
                      <div>
                        <h4 className="font-black text-amber-900 uppercase tracking-tight text-sm">Forensic Logging Active</h4>
                        <p className="text-xs text-amber-800 font-bold leading-relaxed mt-1">All actions performed while impersonating are permanently recorded in the audit trail with your original identity as the actor. This feature is for authorized system verification only.</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {staff.filter(s => s.role !== UserRole.SYSTEM_ARCHITECT).map(member => (
                        <div key={member.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-teal-500 transition-all">
                          <div className="flex items-center gap-4">
                            <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full border-2 border-white shadow-md"/>
                            <div>
                              <h4 className="font-black text-slate-800 uppercase tracking-tight">{member.name}</h4>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{member.role}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => onStartImpersonating(member)}
                            className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all shadow-sm flex items-center gap-2"
                          >
                            <Key size={14}/> Assume Role
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
            case 'printouts_hub':
                return (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Print & Report Hub</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Practice Printing Press & Offline Filing Utility</p>
                            </div>
                            <div className="bg-teal-50 p-6 rounded-[2rem] border border-teal-100 shadow-sm flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-teal-700 uppercase tracking-widest">Pending Chart Archive</div>
                                    <div className="text-2xl font-black text-teal-950 leading-none mt-1">{pendingArchiveCount} Patients</div>
                                </div>
                                <button onClick={handleBatchPrint} className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"><Printer size={18}/> Bulk Archive</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 border-b pb-4"><div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><FileText size={20}/></div><h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">I. Administrative & Admission</h4></div>
                                <div className="space-y-2">
                                    <div className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between group hover:border-blue-300">
                                        <div className="flex items-center gap-3"><FileText size={16} className="text-slate-400"/><span className="text-[11px] font-black uppercase text-slate-700">Patient Registration Record</span></div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Per Patient</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between group hover:border-blue-300">
                                        <div className="flex items-center gap-3"><Camera size={16} className="text-slate-400"/><span className="text-[11px] font-black uppercase text-slate-700">Identity Anchor Sheet</span></div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">One Page</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between group hover:border-blue-300">
                                        <div className="flex items-center gap-3"><Shield size={16} className="text-slate-400"/><span className="text-[11px] font-black uppercase text-slate-700">DPA Summary</span></div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Plain Lang</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 border-b pb-4"><div className="p-2 bg-teal-50 text-teal-600 rounded-xl"><Stethoscope size={20}/></div><h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">II. Clinical & Diagnostic</h4></div>
                                <div className="space-y-2">
                                    <div className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between group hover:border-teal-300">
                                        <div className="flex items-center gap-3"><Activity size={16} className="text-slate-400"/><span className="text-[11px] font-black uppercase text-slate-700">Odontogram Snapshot</span></div>
                                        <button className="text-[9px] font-black text-teal-600 uppercase hover:underline">Print Grid</button>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between group hover:border-teal-300">
                                        <div className="flex items-center gap-3"><ClipboardList size={16} className="text-slate-400"/><span className="text-[11px] font-black uppercase text-slate-700">Medical Certificate</span></div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Template</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between group hover:border-teal-300">
                                        <div className="flex items-center gap-3"><BarChart3 size={16} className="text-slate-400"/><span className="text-[11px] font-black uppercase text-slate-700">Perio Progression Report</span></div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Diagnostic</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 border-b pb-4"><div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={20}/></div><h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">III. Financial & Statutory</h4></div>
                                <div className="space-y-2">
                                    <div className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between group hover:border-emerald-300">
                                        <div className="flex items-center gap-3"><Receipt size={16} className="text-slate-400"/><span className="text-[11px] font-black uppercase text-slate-700">Official Sales Journal</span></div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">BIR Books</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between group hover:border-emerald-300">
                                        <div className="flex items-center gap-3"><FileBox size={16} className="text-slate-400"/><span className="text-[11px] font-black uppercase text-slate-700">PhilHealth CF-2/CF-4</span></div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Statutory</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between group hover:border-emerald-300">
                                        <div className="flex items-center gap-3"><Link size={16} className="text-slate-400"/><span className="text-[11px] font-black uppercase text-slate-700">HMO Claim Summary</span></div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Cover Sheet</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 border-b pb-4"><div className="p-2 bg-orange-50 text-orange-600 rounded-xl"><ShieldCheck size={20}/></div><h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">IV. Maintenance & Compliance</h4></div>
                                <div className="space-y-2">
                                    <div className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between group hover:border-orange-300">
                                        <div className="flex items-center gap-3"><Activity size={16} className="text-slate-400"/><span className="text-[11px] font-black uppercase text-slate-700">Sterilization Load Log</span></div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">DOH Book</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between group hover:border-orange-300">
                                        <div className="flex items-center gap-3"><Fingerprint size={16} className="text-slate-400"/><span className="text-[11px] font-black uppercase text-slate-700">Forensic Audit Chain</span></div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">SHA-256 Log</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'sms_hub':
                return (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">SMS & Communications Hub</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Multi-Channel SIM Gateway Configuration</p>
                            </div>
                            <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
                                <button 
                                    onClick={() => onUpdateSettings({...settings, smsConfig: {...settings.smsConfig, mode: 'LOCAL'}})}
                                    className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${settings.smsConfig.mode === 'LOCAL' ? 'bg-white text-teal-800 shadow-lg' : 'text-slate-400 hover:text-teal-600'}`}
                                >
                                    <Server size={14}/> Local Server
                                </button>
                                <button 
                                    onClick={() => onUpdateSettings({...settings, smsConfig: {...settings.smsConfig, mode: 'CLOUD'}})}
                                    className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${settings.smsConfig.mode === 'CLOUD' ? 'bg-white text-lilac-800 shadow-lg' : 'text-slate-400 hover:text-lilac-600'}`}
                                >
                                    <Cloud size={14}/> Cloud Server
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className={`bg-white p-8 rounded-[3rem] border-4 shadow-2xl space-y-6 transition-all duration-500 ${settings.smsConfig.mode === 'LOCAL' ? 'border-teal-500 scale-105' : 'border-slate-100 opacity-60 scale-95 pointer-events-none'}`}>
                                <div className="flex items-center gap-3 border-b border-teal-50 pb-4">
                                    <div className={`p-2 rounded-xl ${settings.smsConfig.mode === 'LOCAL' ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 text-slate-400'}`}><Smartphone size={24}/></div>
                                    <h4 className="font-black text-slate-800 uppercase text-sm">Local Server Settings</h4>
                                </div>
                                <div className="space-y-4">
                                    <div><label className="label text-[10px]">Gateway URL (IP Address)</label><input type="text" value={settings.smsConfig.gatewayUrl} onChange={e => onUpdateSettings({...settings, smsConfig: {...settings.smsConfig, gatewayUrl: e.target.value}})} className="input font-mono text-xs" placeholder="http://192.168.1.188:8080/send" /></div>
                                    <div><label className="label text-[10px]">Security Key</label><input type="password" value={settings.smsConfig.apiKey} onChange={e => onUpdateSettings({...settings, smsConfig: {...settings.smsConfig, apiKey: e.target.value}})} className="input font-mono" placeholder="••••••••" /></div>
                                    {settings.smsConfig.mode === 'LOCAL' && <button onClick={handleSmsTest} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all">Pulse Test Local</button>}
                                </div>
                            </div>

                            <div className={`bg-white p-8 rounded-[3rem] border-4 shadow-2xl space-y-6 transition-all duration-500 ${settings.smsConfig.mode === 'CLOUD' ? 'border-lilac-500 scale-105' : 'border-slate-100 opacity-60 scale-95 pointer-events-none'}`}>
                                <div className="flex items-center gap-3 border-b border-lilac-50 pb-4">
                                    <div className={`p-2 rounded-xl ${settings.smsConfig.mode === 'CLOUD' ? 'bg-lilac-50 text-lilac-600' : 'bg-slate-50 text-slate-400'}`}><Cloud size={24}/></div>
                                    <h4 className="font-black text-slate-800 uppercase text-sm">Cloud Server Settings</h4>
                                </div>
                                <div className="space-y-3">
                                    <div><label className="label text-[10px]">Server Address</label><input type="text" value={settings.smsConfig.cloudUrl || ''} onChange={e => onUpdateSettings({...settings, smsConfig: {...settings.smsConfig, cloudUrl: e.target.value}})} className="input text-xs" placeholder="https://api.sms-cloud.ph" /></div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="label text-[10px]">Username</label><input type="text" value={settings.smsConfig.username || ''} onChange={e => onUpdateSettings({...settings, smsConfig: {...settings.smsConfig, username: e.target.value}})} className="input text-xs" /></div>
                                        <div><label className="label text-[10px]">Password</label><input type="password" value={settings.smsConfig.password || ''} onChange={e => onUpdateSettings({...settings, smsConfig: {...settings.smsConfig, password: e.target.value}})} className="input text-xs" /></div>
                                    </div>
                                    <div><label className="label text-[10px]">Device ID</label><input type="text" value={settings.smsConfig.deviceId || ''} onChange={e => onUpdateSettings({...settings, smsConfig: {...settings.smsConfig, deviceId: e.target.value}})} className="input font-mono text-xs" /></div>
                                    {settings.smsConfig.mode === 'CLOUD' && <button onClick={handleSmsTest} className="w-full py-4 bg-lilac-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all">Pulse Test Cloud</button>}
                                </div>
                            </div>

                            <div className="col-span-full bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-8">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                    <div className="p-2 bg-slate-50 text-slate-500 rounded-xl"><MessageSquare size={24}/></div>
                                    <h4 className="font-black text-slate-800 uppercase text-sm">Automated Operational Narratives</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(settings.smsTemplates).map(([key, config]: [string, any]) => (
                                        <div key={key} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-teal-500 transition-all group">
                                            <div className="flex justify-between items-center mb-3">
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-teal-700 tracking-widest">{config.label}</span>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{config.triggerDescription}</p>
                                                </div>
                                                <button onClick={() => onUpdateSettings({...settings, smsTemplates: {...settings.smsTemplates, [key]: {...config, enabled: !config.enabled}}})} className={`w-10 h-5 rounded-full p-1 transition-colors flex items-center ${config.enabled ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'}`}><div className="w-3 h-3 bg-white rounded-full"/></button>
                                            </div>
                                            <textarea 
                                                value={config.text} 
                                                onChange={e => onUpdateSettings({...settings, smsTemplates: {...settings.smsTemplates, [key]: {...config, text: e.target.value}}})}
                                                className="w-full p-3 text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-2xl outline-none h-20 focus:border-teal-500 shadow-inner"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
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
                                <div className="mt-8 pt-6 border-t border-slate-50"><button onClick={() => setActiveRegistry('npc_compliance')} className="text-xs font-black text-lilac-600 uppercase hover:underline flex items-center gap-2">Manage Vendors <ArrowRight size={14}/></button></div>
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
            case 'paymentModes':
                return (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Collection & Taxation</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Configure active patient ledger entry modes and statutory rates</p></div>
                            <div className="bg-lilac-50 p-6 rounded-[2rem] border-2 border-lilac-200 shadow-sm flex items-center gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-lilac-700 uppercase tracking-widest block">Standard VAT (%)</label>
                                    <input type="number" value={settings.taxConfig.vatRate} onChange={e => onUpdateSettings({...settings, taxConfig: {...settings.taxConfig, vatRate: parseFloat(e.target.value)}})} className="w-20 p-2 border-2 border-lilac-100 rounded-xl font-black text-lg text-lilac-900 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-lilac-700 uppercase tracking-widest block">Withholding (%)</label>
                                    <input type="number" value={settings.taxConfig.withholdingRate} onChange={e => onUpdateSettings({...settings, taxConfig: {...settings.taxConfig, withholdingRate: parseFloat(e.target.value)}})} className="w-20 p-2 border-2 border-lilac-100 rounded-xl font-black text-lg text-lilac-900 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-lilac-700 uppercase tracking-widest block">Next OR #</label>
                                    <input type="number" value={settings.taxConfig.nextOrNumber} onChange={e => onUpdateSettings({...settings, taxConfig: {...settings.taxConfig, nextOrNumber: parseInt(e.target.value)}})} className="w-32 p-2 border-2 border-lilac-100 rounded-xl font-black text-lg text-lilac-900 outline-none" />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {settings.paymentModes.map(mode => (
                                <div key={mode} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 flex flex-col items-center justify-center gap-4 group hover:border-teal-500 transition-all relative">
                                    <div className="bg-teal-50 p-4 rounded-full text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-sm"><CreditCard size={32}/></div>
                                    <span className="font-black text-slate-800 uppercase tracking-widest text-[10px]">{mode}</span>
                                    <button onClick={() => onUpdateSettings({...settings, paymentModes: settings.paymentModes.filter(m => m !== mode)})} className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><X size={16}/></button>
                                </div>
                            ))}
                            {isAddingPaymentMode ? (
                                <div className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-teal-500 flex flex-col items-center justify-center gap-3 animate-in zoom-in-95">
                                    <input 
                                        autoFocus
                                        type="text" 
                                        value={newPaymentModeName} 
                                        onChange={e => setNewPaymentModeName(e.target.value)}
                                        placeholder="Label..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-black uppercase text-center outline-none focus:border-teal-500 shadow-inner"
                                        onKeyDown={e => e.key === 'Enter' && handleSaveNewPaymentMode()}
                                    />
                                    <div className="flex gap-2 w-full">
                                        <button onClick={() => { setIsAddingPaymentMode(false); setNewPaymentModeName(''); }} className="flex-1 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-[9px] font-black uppercase">Cancel</button>
                                        <button onClick={handleSaveNewPaymentMode} className="flex-1 py-1.5 bg-teal-600 text-white rounded-lg text-[9px] font-black uppercase">Save</button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setIsAddingPaymentMode(true)} className="border-4 border-dashed border-slate-100 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 text-slate-300 hover:text-teal-600 hover:border-teal-100 transition-all">
                                    <Plus size={32}/>
                                    <span className="text-[10px] font-black uppercase tracking-widest">New Mode</span>
                                </button>
                            )}
                        </div>
                    </div>
                );
            case 'branding':
                return (
                    <div className="p-10 space-y-12 overflow-y-auto h-full animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm space-y-6">
                                <h4 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em] border-b pb-4 mb-2">Practice Visual Identity</h4>
                                <div><label className="label text-xs">Practice Legal Name</label><input type="text" value={settings.clinicName} onChange={e => onUpdateSettings({...settings, clinicName: e.target.value})} className="input text-xl font-black" /></div>
                                <div><label className="label text-xs">Module Toggles</label><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{(Object.entries(settings.features) as any).map(([k, v]: any) => (
                                    <button key={k} onClick={() => onUpdateSettings({...settings, features: {...settings.features, [k]: !v}})} className={`p-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest ${v ? 'bg-teal-50 border-teal-500 text-teal-900' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{k.replace(/([A-Z])/g, ' $1')}</button>
                                ))}</div></div>
                            </div>

                            <div className="bg-white p-8 rounded-[3rem] border-2 border-lilac-100 shadow-sm space-y-6">
                                <h4 className="font-black text-lilac-900 uppercase text-xs tracking-[0.2em] border-b border-lilac-50 pb-4 mb-2">Global Operational Hours</h4>
                                <div className="space-y-4">
                                    {Object.entries(settings.operationalHours).map(([day, sched]: [string, any]) => (
                                        <div key={day} className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:border-lilac-300">
                                            <div className="w-24 font-black uppercase text-[10px] text-slate-500 group-hover:text-lilac-700">{day}</div>
                                            <div className="flex gap-2 items-center flex-1">
                                                <input type="time" disabled={sched.isClosed} value={sched.start} onChange={e => handleUpdateHours(day, {start: e.target.value})} className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none disabled:opacity-30" />
                                                <span className="text-slate-300 font-bold">-</span>
                                                <input type="time" disabled={sched.isClosed} value={sched.end} onChange={e => handleUpdateHours(day, {end: e.target.value})} className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none disabled:opacity-30" />
                                            </div>
                                            <button 
                                                onClick={() => handleUpdateHours(day, {isClosed: !sched.isClosed})}
                                                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${sched.isClosed ? 'bg-red-50 border-red-500 text-red-700' : 'bg-teal-50 border-teal-500 text-teal-700'}`}
                                            >
                                                {sched.isClosed ? 'Closed' : 'Open'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'branches':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Branch Network</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Multi-site operational management</p></div>
                            <button onClick={() => setIsAddingBranch(true)} className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> Add Site</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {isAddingBranch && (
                                <div className="bg-white p-8 rounded-[3rem] border-2 border-dashed border-teal-500 shadow-xl flex flex-col justify-between animate-in zoom-in-95">
                                    <div>
                                        <div className="bg-teal-50 p-3 rounded-2xl text-teal-600 w-fit mb-4"><MapPin size={24}/></div>
                                        <input 
                                            autoFocus 
                                            type="text" 
                                            value={newBranchName} 
                                            onChange={e => setNewBranchName(e.target.value)}
                                            placeholder="Site Name..."
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-black outline-none focus:border-teal-500 shadow-inner"
                                            onKeyDown={e => e.key === 'Enter' && handleSaveNewBranch()}
                                        />
                                    </div>
                                    <div className="mt-6 flex gap-2">
                                        <button onClick={() => { setIsAddingBranch(false); setNewBranchName(''); }} className="flex-1 py-2 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-[10px]">Cancel</button>
                                        <button onClick={handleSaveNewBranch} className="flex-1 py-2 bg-teal-600 text-white rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-1"><Save size={12}/> Save</button>
                                    </div>
                                </div>
                            )}
                            {settings.branches.map(branch => (
                                <div key={branch} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-teal-500 transition-all">
                                    <div><div className="bg-teal-50 p-3 rounded-2xl text-teal-600 w-fit mb-4 shadow-sm"><MapPin size={24}/></div><h4 className="font-black text-slate-900 uppercase text-lg leading-none">{branch}</h4></div>
                                    <div className="mt-6 pt-4 border-t flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Site</span><button onClick={() => handleRemoveRegistryOption('branches', branch)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'resources':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Physical Resources</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Dental chairs and specialized operatory rooms</p></div>
                            <button onClick={() => {
                                const branch = resourceFilterBranch || settings.branches[0];
                                const newId = generateResourceUid(branch, settings.resources);
                                setEditingResource({ 
                                    id: newId, 
                                    name: '', 
                                    type: ResourceType.CHAIR, 
                                    branch: branch, 
                                    colorCode: '#14b8a6' 
                                });
                            }} className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> Register Resource</button>
                        </div>
                        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
                            {settings.branches.map(b => (
                                <button key={b} onClick={() => setResourceFilterBranch(b)} className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all ${resourceFilterBranch === b ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-500'}`}>{b}</button>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {settings.resources.filter(r => r.branch === resourceFilterBranch).map(res => (
                                <div key={res.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-teal-500 transition-all">
                                    <div><div className="p-3 rounded-2xl w-fit mb-4 shadow-lg text-white" style={{ backgroundColor: res.colorCode }}><Armchair size={24}/></div><h4 className="font-black text-slate-900 uppercase text-lg leading-none">{res.name}</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{res.type}</p></div>
                                    <div className="mt-6 pt-4 border-t flex justify-between items-center"><button onClick={() => setEditingResource(res)} className="text-teal-600 text-[10px] font-black uppercase hover:underline">Edit Detail</button><button onClick={() => onUpdateSettings({...settings, resources: settings.resources.filter(r => r.id !== res.id)})} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'assets':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Equipment Assets</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Maintenance tracking and operational readiness</p></div>
                            <button onClick={() => setEditingAsset({ name: '', status: 'Ready', branch: settings.branches[0], frequencyMonths: 6, lastService: new Date().toISOString().split('T')[0] })} className="bg-lilac-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-lilac-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> Register Equipment</button>
                        </div>
                        <div className="space-y-4">
                            {settings.assets.map(asset => {
                                const last = new Date(asset.lastService);
                                const next = new Date(last);
                                next.setMonth(next.getMonth() + asset.frequencyMonths);
                                const isDue = next < new Date();
                                return (
                                    <div key={asset.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between group hover:border-lilac-500 transition-all gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className={`p-4 rounded-2xl shadow-sm ${asset.status === 'Ready' ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-600'}`}><Monitor size={28}/></div>
                                            <div><h4 className="font-black text-slate-900 uppercase text-lg leading-none">{asset.name}</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{asset.brand} {asset.serialNumber && `• SN: ${asset.serialNumber}`}</p></div>
                                        </div>
                                        <div className="flex items-center gap-12">
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Service</div>
                                                <div className="text-sm font-bold text-slate-700 uppercase">{formatDate(asset.lastService)}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</div>
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase ${asset.status === 'Ready' ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{asset.status}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setEditingAsset(asset)} className="p-3 bg-slate-50 text-slate-400 hover:text-teal-600 rounded-xl transition-all shadow-sm"><Edit2 size={18}/></button>
                                                <button onClick={() => onUpdateSettings({...settings, assets: settings.assets.filter(a => a.id !== asset.id)})} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all shadow-sm"><Trash2 size={18}/></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            case 'procedures':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Procedure Catalog</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Standard service definitions and fees</p></div>
                            {/* Fix: Removed price property from new procedure object initialization. */}
                            <button onClick={() => { setEditingProcedure({ name: '', category: 'General' }); setEditingProcedurePrice(0); }} className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> Register Procedure</button>
                        </div>
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]"><tr className="text-left"><th className="p-6">Description</th><th className="p-6">Classification</th><th className="p-6 text-right">Standard Fee (₱)</th><th className="p-6 text-right">Actions</th></tr></thead>
                                <tbody className="divide-y divide-slate-50">
                                    {settings.procedures.map(proc => {
                                        // Fix: Get procedure price from priceBookEntries.
                                        const price = settings.priceBookEntries?.find(pbe => pbe.procedureId === proc.id)?.price ?? 0;
                                        return (
                                            <tr key={proc.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-6 font-black text-slate-800 text-xs uppercase tracking-tight">{proc.name}</td>
                                                <td className="p-6"><span className="text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-600 rounded-full uppercase border border-slate-200">{proc.category}</span></td>
                                                <td className="p-6 text-right font-black text-slate-900">₱{price.toLocaleString()}</td>
                                                <td className="p-6 text-right"><div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleOpenEditProcedure(proc)} className="p-3 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-all"><Edit2 size={16}/></button><button onClick={() => onUpdateSettings({...settings, procedures: settings.procedures.filter(p => p.id !== proc.id)})} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button></div></td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'medications':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Pharmacy Registry</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">RA 6675 Compliant Medication Library</p></div>
                            <button onClick={() => setEditingMedication({ genericName: '', dosage: '', instructions: '', interactions: [] })} className="bg-lilac-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-lilac-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> Register Drug</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {settings.medications.map(med => (
                                <div key={med.id} className={`bg-white p-8 rounded-[3.5rem] border-4 flex flex-col justify-between group transition-all hover:-translate-y-2 ${med.isS2Controlled ? 'border-amber-100 shadow-amber-600/5' : 'border-slate-50 shadow-sm'}`}>
                                    <div><div className="flex justify-between items-start mb-6"><div className={`p-4 rounded-3xl shadow-sm ${med.isS2Controlled ? 'bg-amber-100 text-amber-700' : 'bg-lilac-50 text-lilac-600'}`}><Pill size={32}/></div>{med.isS2Controlled && <span className="bg-amber-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-lg">S2 Controlled</span>}</div><h4 className="font-black text-slate-900 uppercase text-lg leading-tight mb-2">{med.genericName}</h4><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{med.brandName || 'GENERIC ONLY'}</p></div>
                                    <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center"><button onClick={() => setEditingMedication(med)} className="text-lilac-600 text-[10px] font-black uppercase hover:underline">Edit Entry</button><button onClick={() => onUpdateSettings({...settings, medications: settings.medications.filter(m => m.id !== med.id)})} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'payrollAdjustments':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Adjustment Catalog</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Standard credits and debits for practitioner statements</p></div>
                            <button onClick={() => setEditingAdjustment({ label: '', type: 'Credit', category: 'Incentives' })} className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> Register Template</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {settings.payrollAdjustmentTemplates.map(adj => (
                                <div key={adj.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-teal-500 transition-all">
                                    <div><div className="flex justify-between items-center mb-6"><div className={`p-4 rounded-3xl shadow-sm ${adj.type === 'Credit' ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-600'}`}><Receipt size={28}/></div><span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase ${adj.type === 'Credit' ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{adj.type}</span></div><h4 className="font-black text-slate-900 uppercase text-sm leading-tight mb-2">{adj.label}</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{adj.category}</p></div>
                                    <div className="mt-8 pt-4 border-t border-slate-50 flex justify-between items-center"><button onClick={() => setEditingAdjustment(adj)} className="text-teal-600 text-[10px] font-black uppercase hover:underline">Edit Entry</button><button onClick={() => onUpdateSettings({...settings, payrollAdjustmentTemplates: settings.payrollAdjustmentTemplates.filter(a => a.id !== adj.id)})} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'expenseCategories':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Expense Chart</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Classification for operational overhead tracking</p></div>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={newExpenseCategory} 
                                    onChange={e => setNewExpenseCategory(e.target.value)} 
                                    placeholder="Category Name..." 
                                    className="bg-white border-2 border-slate-100 px-6 py-3 rounded-2xl text-xs font-bold uppercase outline-none focus:border-teal-500 w-64 shadow-inner" 
                                    onKeyDown={e => e.key === 'Enter' && handleAddExpenseCategory()}
                                />
                                <button onClick={handleAddExpenseCategory} className="bg-teal-600 text-white p-3 rounded-2xl shadow-xl shadow-teal-600/20 hover:scale-105 transition-all"><Plus size={24}/></button>
                            </div>
                        </div>
                        <div className="bg-white rounded-[3rem] p-4 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {settings.expenseCategories.map(cat => (
                                <div key={cat} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:border-teal-300 transition-all shadow-sm"><span className="text-xs font-black text-slate-700 uppercase tracking-tight">{cat}</span><button onClick={() => handleRemoveRegistryOption('expenseCategories', cat)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button></div>
                            ))}
                        </div>
                    </div>
                );
            case 'hospitalAffiliations':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Referral Network</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Tertiary institutions for clinical escalation</p></div>
                            <button onClick={() => setEditingAffiliation({ name: '', location: '', hotline: '' })} className="bg-lilac-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-lilac-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> Register Affiliate</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {settings.hospitalAffiliations.map(hosp => (
                                <div key={hosp.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-lilac-500 transition-all">
                                    <div><div className="bg-lilac-50 p-3 rounded-2xl text-lilac-600 w-fit mb-4 shadow-sm"><Building2 size={24}/></div><h4 className="font-black text-slate-900 uppercase text-sm leading-tight mb-2">{hosp.name}</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1"><MapPin size={12}/> {hosp.location}</p><div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hotline</span><span className="text-xs font-black text-lilac-700 font-mono">{hosp.hotline}</span></div></div>
                                    <div className="mt-8 pt-4 border-t border-slate-50 flex justify-between items-center"><button onClick={() => setEditingAffiliation(hosp)} className="text-lilac-600 text-[10px] font-black uppercase hover:underline">Edit Details</button><button onClick={() => onUpdateSettings({...settings, hospitalAffiliations: settings.hospitalAffiliations.filter(a => a.id !== hosp.id)})} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'staff':
                return (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Clinician Registry</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Licensed practitioners and clinical support staff</p></div>
                            <button onClick={() => toast.info("Staff enrollment managed via main Security Profile module.")} className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> Enroll Clinician</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {staff.map(member => (
                                <div key={member.id} className="bg-white p-8 rounded-[3.5rem] border-4 border-slate-50 shadow-xl flex flex-col items-center text-center relative overflow-hidden group hover:border-teal-500 transition-all">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 group-hover:rotate-45 transition-transform"><Shield size={120}/></div>
                                    <div className="w-24 h-24 rounded-[2rem] border-4 border-white shadow-2xl mb-6 overflow-hidden relative"><img src={member.avatar} alt={member.name} className="w-full h-full object-cover" /><div className="absolute bottom-0 inset-x-0 h-1" style={{ backgroundColor: member.colorPreference }} /></div>
                                    <h4 className="font-black text-slate-900 uppercase text-lg leading-none mb-2">{member.name}</h4>
                                    <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-3 py-1 rounded-full uppercase tracking-widest border border-teal-100 mb-6">{member.role}</span>
                                    <div className="w-full grid grid-cols-2 gap-3 pt-6 border-t border-slate-50">
                                        <div className="text-left"><div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">PRC License</div><div className="text-xs font-black text-slate-800 font-mono truncate">{member.prcLicense || '---'}</div></div>
                                        <div className="text-right"><div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Commission</div><div className="text-xs font-black text-teal-700">{(member.commissionRate || 0) * 100}%</div></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'shadeGuides':
                return (
                    <div className="space-y-12 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3"><div className="bg-teal-50 p-2 rounded-xl text-teal-600"><FlaskConical size={24}/></div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Shade Registry</h3></div>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={newShade} 
                                            onChange={e => setNewShade(e.target.value)} 
                                            placeholder="Shade..." 
                                            className="bg-white border-2 border-slate-100 px-4 py-2 rounded-xl text-xs font-bold uppercase outline-none focus:border-teal-500 w-32" 
                                            onKeyDown={e => e.key === 'Enter' && handleAddShade()}
                                        />
                                        <button onClick={handleAddShade} className="bg-teal-600 text-white p-2.5 rounded-xl shadow-lg hover:scale-110 transition-all"><Plus size={20}/></button>
                                    </div>
                                </div>
                                <div className="bg-white rounded-[2.5rem] p-4 border border-slate-200 shadow-sm flex flex-wrap gap-2 max-h-64 overflow-y-auto no-scrollbar">
                                    {settings.shadeGuides.map(shade => (
                                        <div key={shade} className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 group hover:border-teal-300 transition-all"><span className="text-xs font-black text-slate-700 uppercase">{shade}</span><button onClick={() => handleRemoveRegistryOption('shadeGuides', shade)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><X size={14}/></button></div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3"><div className="bg-lilac-50 p-2 rounded-xl text-lilac-600"><Layers size={24}/></div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Material Classes</h3></div>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={newMaterial} 
                                            onChange={e => setNewMaterial(e.target.value)} 
                                            placeholder="Material..." 
                                            className="bg-white border-2 border-slate-100 px-4 py-2 rounded-xl text-xs font-bold uppercase outline-none focus:border-lilac-500 w-32" 
                                            onKeyDown={e => e.key === 'Enter' && handleAddMaterial()}
                                        />
                                        <button onClick={handleAddMaterial} className="bg-lilac-600 text-white p-2.5 rounded-xl shadow-lg hover:scale-110 transition-all"><Plus size={20}/></button>
                                    </div>
                                </div>
                                <div className="bg-white rounded-[2.5rem] p-4 border border-slate-200 shadow-sm space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                                    {settings.restorativeMaterials.map(mat => (
                                        <div key={mat} className="flex items-center justify-between p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 group hover:border-lilac-300 transition-all shadow-sm"><span className="text-xs font-black text-slate-700 uppercase tracking-tight">{mat}</span><button onClick={() => handleRemoveRegistryOption('restorativeMaterials', mat)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'retention':
                return (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Retention Monitor</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Lifecycle control for clinical records (DOH Compliance)</p></div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Statutory Period</div><div className="text-4xl font-black text-slate-900">10Y</div><p className="text-xs font-bold text-teal-700 uppercase mt-2">DOH Mandated</p></div>
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Active Records</div><div className="text-4xl font-black text-slate-900">{retentionStats.activeCount}</div><p className="text-xs font-bold text-slate-500 uppercase mt-2">Personal Identity Bound</p></div>
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Anonymized (DPA)</div><div className="text-4xl font-black text-slate-900">{retentionStats.anonymizedCount}</div><p className="text-xs font-bold text-lilac-700 uppercase mt-2">Right to Erasure Applied</p></div>
                            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-orange-200 shadow-lg shadow-orange-600/5"><div className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4">Pending Destruction</div><div className="text-4xl font-black text-orange-700">{retentionStats.destructionCount}</div><p className="text-xs font-black text-orange-500 uppercase mt-2 animate-pulse">Action Required &lt; 90D</p></div>
                        </div>
                        <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm space-y-6">
                            <div className="flex items-center gap-3"><div className="bg-orange-50 p-2 rounded-xl text-orange-600"><Clock size={24}/></div><h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Records Nearing 10-Year Purge Horizon</h4></div>
                            <div className="space-y-3">
                                {retentionStats.nearingDestruction.map(p => (
                                    <div key={p.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-between group hover:border-orange-500 transition-all">
                                        <div className="flex items-center gap-6"><div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm font-black text-orange-700">D</div><div><div className="text-sm font-black text-slate-900 uppercase">{p.name}</div><div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Last Clinical Session: {p.lastVisit}</div></div></div>
                                        <div className="flex items-center gap-4"><div className="text-right"><div className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Purge Window</div><div className="text-xs font-black text-orange-900 uppercase">Mandatory destruction due within 90 days</div></div><button onClick={() => onPurgePatient(p.id)} className="p-4 bg-orange-600 text-white rounded-2xl shadow-xl shadow-orange-600/20 hover:bg-orange-700 active:scale-95 transition-all"><Trash2 size={20}/></button></div>
                                    </div>
                                ))}
                                {retentionStats.nearingDestruction.length === 0 && <div className="py-20 text-center text-slate-300 italic font-black uppercase tracking-widest">No records currently approaching destruction threshold.</div>}
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
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

            {editingProcedure && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center p-4"><div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingProcedure(null)}/><div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-6 animate-in zoom-in-95"><h3 className="text-xl font-black uppercase tracking-widest text-teal-900 border-b border-teal-50 pb-4 mb-2">Procedure Metadata</h3><div className="space-y-4"><div><label className="label text-[10px]">Procedure Narrative</label><input type="text" value={editingProcedure.name} onChange={e => setEditingProcedure({...editingProcedure, name: e.target.value})} className="input" placeholder="e.g. Oral Prophylaxis" /></div><div><label className="label text-[10px]">Classification Category</label><select value={editingProcedure.category} onChange={e => setEditingProcedure({...editingProcedure, category: e.target.value})} className="input"><option>General</option><option>Preventive</option><option>Restorative</option><option>Surgery</option><option>Endodontics</option><option>Prosthodontics</option><option>Imaging</option></select></div><div><label className="label text-[10px]">Standard Fee (₱)</label><input type="number" value={editingProcedurePrice} onChange={e => setEditingProcedurePrice(parseFloat(e.target.value) || 0)} className="input font-black text-lg" /></div></div><div className="flex gap-3 pt-4"><button onClick={() => setEditingProcedure(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button><button onClick={handleSaveProcedure} className="flex-[2] py-4 bg-teal-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-teal-600/20">Save to Catalog</button></div></div></div>
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

            {isAdding && activeRegistry === 'patient_registry_form' && (
                <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300"><div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAdding(false)}/><div className="relative w-full max-w-lg bg-white h-full shadow-2xl border-l-8 border-lilac-500 flex flex-col animate-in slide-in-from-right-full"><div className="p-10 border-b bg-lilac-50"><h4 className="text-2xl font-black text-lilac-900 uppercase tracking-tight">New Form Entry Wizard</h4><p className="text-[10px] font-black text-lilac-600 uppercase tracking-widest mt-1">Registry Context: Builder Interface</p></div><div className="p-10 space-y-8 flex-1 overflow-y-auto no-scrollbar"><div className="space-y-6"><div><label className="label text-[10px]">Element Label *</label><input autoFocus type="text" value={newEntryForm.label} onChange={e => setNewEntryForm({...newEntryForm, label: e.target.value})} className="input text-lg font-black" placeholder="e.g. Current Medications" /></div><div className="grid grid-cols-2 gap-4"><div><label className="label text-[10px]">Registry Section</label><select value={newEntryForm.section} onChange={e => setNewEntryForm({...newEntryForm, section: e.target.value as any})} className="input text-sm font-bold"><option value="IDENTITY">Section I: Identity</option><option value="CONTACT">Section II: Contact</option><option value="MEDICAL">Section V: Medical</option><option value="DENTAL">Section IV: Dental</option></select></div><div><label className="label text-[10px]">Input Interaction</label><select value={newEntryForm.type} onChange={e => setNewEntryForm({...newEntryForm, type: e.target.value as any})} className="input text-sm font-bold"><option value="text">Short Text</option><option value="textarea">Narrative (Long Text)</option><option value="dropdown">Registry Dropdown</option><option value="boolean">Yes/No Toggle</option><option value="header">Section Card Header</option></select></div></div><div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className={`p-2 rounded-xl ${newEntryForm.isCritical ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-400'}`}><ShieldAlert size={18}/></div><span className="text-xs font-black text-slate-700 uppercase tracking-widest">Clinical Risk Flag</span></div><button onClick={() => setNewEntryForm({...newEntryForm, isCritical: !newEntryForm.isCritical})} className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${newEntryForm.isCritical ? 'bg-red-600 justify-end' : 'bg-slate-300 justify-start'}`}><div className="w-4 h-4 bg-white rounded-full" /></button></div><p className="text-[10px] text-slate-500 font-medium leading-relaxed">Marking as critical will automatically register positive findings in the clinical alert registry.</p></div></div></div><div className="p-10 border-t bg-white flex gap-3"><button onClick={() => setIsAdding(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button><button onClick={handleSaveNewEntry} className="flex-[2] py-5 bg-teal-700 text-white font-black uppercase text-xs rounded-2xl shadow-xl hover:scale-[1.02] transition-all">Add to Registry</button></div></div></div>
            )}
        </div>
    );
};

export default FieldManagement;

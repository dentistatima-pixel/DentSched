import React, { useState, useMemo, useCallback } from 'react';
import { 
  FieldSettings, User, UserRole, AuditLogEntry, Patient, ClinicalIncident, 
  RegistrationField, ProcedureItem, Medication, HospitalAffiliation, PayrollAdjustmentTemplate, ClinicResource, MaintenanceAsset, ResourceType, Appointment, DaySchedule, SmsTemplateConfig, DentalChartEntry, PriceBookEntry
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

    const [editingProcedure, setEditingProcedure] = useState<(Partial<ProcedureItem> & { price?: number }) | null>(null);
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

        const newField: RegistrationField = {
            id: newEntryForm.label.toLowerCase().replace(/\s+/g, '_'),
            ...newEntryForm
        } as RegistrationField;

        const newIdentityFields = [...settings.identityFields, newField];
        const orderKey = activeSection === 'IDENTITY' ? 'identityLayoutOrder' : 'medicalLayoutOrder';
        const newOrder = [...settings[orderKey], `field_${newField.id}`];

        onUpdateSettings({ ...settings, identityFields: newIdentityFields, [orderKey]: newOrder });
        setIsAdding(false);
        setNewEntryForm({ label: '', type: 'text', section: 'IDENTITY', width: 'half' });
        toast.success("New field added to registry.");
    };
    
    const handleSaveProcedure = () => {
        if (!editingProcedure || !editingProcedure.name) return;

        const { price, ...procedureData } = editingProcedure;
        const procedurePrice = parseFloat(String(price || 0));

        let updatedProcedures: ProcedureItem[];
        let updatedPriceBookEntries: PriceBookEntry[];

        const defaultPriceBookId = settings.priceBooks?.find(pb => pb.isDefault)?.id || 'pb_1';

        if (procedureData.id) { // Editing existing
            updatedProcedures = settings.procedures.map(p => p.id === procedureData.id ? (procedureData as ProcedureItem) : p);
            
            const priceEntryIndex = settings.priceBookEntries?.findIndex(pbe => pbe.procedureId === procedureData.id && pbe.priceBookId === defaultPriceBookId) ?? -1;

            if (priceEntryIndex > -1) {
                updatedPriceBookEntries = [...(settings.priceBookEntries || [])];
                updatedPriceBookEntries[priceEntryIndex] = { ...updatedPriceBookEntries[priceEntryIndex], price: procedurePrice };
            } else {
                updatedPriceBookEntries = [...(settings.priceBookEntries || []), {
                    priceBookId: defaultPriceBookId,
                    procedureId: procedureData.id,
                    price: procedurePrice
                }];
            }

        } else { // Adding new
            const newId = `proc_${Date.now()}`;
            const newProcedure = { ...procedureData, id: newId } as ProcedureItem;
            updatedProcedures = [...settings.procedures, newProcedure];

            const newPriceEntry: PriceBookEntry = {
                priceBookId: defaultPriceBookId,
                procedureId: newId,
                price: procedurePrice
            };
            updatedPriceBookEntries = [...(settings.priceBookEntries || []), newPriceEntry];
        }
        
        onUpdateSettings({ 
            ...settings, 
            procedures: updatedProcedures, 
            priceBookEntries: updatedPriceBookEntries 
        });

        setEditingProcedure(null);
        toast.success("Procedure saved.");
    };

    const handleSaveMedication = () => {
        if (!editingMedication || !editingMedication.genericName) return;
        const isNew = !editingMedication.id;
        const newMeds = isNew
            ? [...settings.medications, { ...editingMedication, id: `med_${Date.now()}` } as Medication]
            : settings.medications.map(m => m.id === editingMedication.id ? editingMedication as Medication : m);
        onUpdateSettings({ ...settings, medications: newMeds });
        setEditingMedication(null);
        toast.success("Medication registry updated.");
    };
    
    const renderContent = () => {
        // Placeholder for content based on activeRegistry
        return (
            <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm text-center">
                <div className="w-24 h-24 bg-teal-50 rounded-3xl flex items-center justify-center mx-auto mb-6"><Settings size={48} className="text-teal-300"/></div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Select a Registry</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">Choose a configuration from the sidebar to manage practice settings.</p>
            </div>
        )
    }

    return (
        <div className="h-full flex gap-8">
            {/* Sidebar */}
            <div className={`bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-24' : 'w-80'}`}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className={`flex items-center gap-3 transition-all ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                        <Settings size={24} className="text-teal-700"/>
                        <h2 className="font-black text-slate-800 text-lg uppercase tracking-tighter">Setup</h2>
                    </div>
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 text-slate-400 hover:text-teal-700 hover:bg-slate-50 rounded-lg">
                        {isSidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                    {sidebarGroups.map(group => (
                        <div key={group.key}>
                            {!isSidebarCollapsed && (
                                <h3 className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <group.icon size={16} /> {group.label}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {group.items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveRegistry(item.id)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl text-sm font-bold transition-all ${activeRegistry === item.id ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-600 hover:bg-teal-50 hover:text-teal-800'}`}
                                    >
                                        <item.icon size={20} strokeWidth={3} className={`${activeRegistry === item.id ? 'text-teal-300' : 'text-slate-400'}`} />
                                        {!isSidebarCollapsed && <span>{item.label}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
                {renderContent()}
            </div>
        </div>
    );
};

export default FieldManagement;
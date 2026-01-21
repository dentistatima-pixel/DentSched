import React, { useState } from 'react';
import { FieldSettings, User, AuditLogEntry, Patient, Appointment } from '../types';
import { 
  Sliders, Settings, ChevronRight, DollarSign, Box, MapPin, User as UserIcon, Pill, 
  ShieldCheck, Shield, Database, Archive, Layers, Receipt, Activity, 
  Sparkles, Zap, Wrench, ClipboardList, Armchair, LayoutPanelLeft, Fingerprint, Key, Printer,
  Smartphone, Banknote, Building2
} from 'lucide-react';

import FormBuilder from './FormBuilder';
import ProcedureCatalog from './ProcedureCatalog';
import AuditTrailViewer from './AuditTrailViewer';
import SmsHub from './SmsHub';
import PracticeBranding from './PracticeBranding';
import PharmacyRegistry from './PharmacyRegistry';
import MaterialsRegistry from './MaterialsRegistry';
import FinancialSettings from './FinancialSettings';
import StaffRegistry from './StaffRegistry';
import InfrastructureManager from './InfrastructureManager';
import ComplianceCenter from './ComplianceCenter';
import PrintoutsHub from './PrintoutsHub';
import { useModal } from '../contexts/ModalContext';

interface FieldManagementProps {
  settings: FieldSettings;
  onUpdateSettings: (newSettings: FieldSettings) => void;
  staff: User[];
  auditLog: AuditLogEntry[];
  patients: Patient[];
  onPurgePatient: (id: string) => void;
  auditLogVerified: boolean | null;
  encryptionKey: string | null;
  appointments: Appointment[];
  currentUser: User;
  onStartImpersonating: (user: User) => void;
  onDeactivateStaff: (userId: string) => void;
}

const FieldManagement: React.FC<FieldManagementProps> = (props) => {
    const { showModal } = useModal();
    const [activeRegistry, setActiveRegistry] = useState<string>('branding');

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
        { key: 'staff', label: 'VII. Staff Management', icon: UserIcon, items: [
            { id: 'staff', label: 'Clinician Registry', icon: UserIcon },
            { id: 'privilege_elevation', label: 'Privilege Elevation', icon: Key }
        ]}
    ];

    const handleOpenStaffModal = (staffMember: Partial<User> | null) => {
        showModal('userProfile', { user: staffMember || {}, isStaffEdit: true });
    };

    const renderContent = () => {
        switch (activeRegistry) {
            // Core Identity
            case 'branding':
                return <PracticeBranding settings={props.settings} onUpdateSettings={props.onUpdateSettings} />;
            case 'sms_hub':
                return <SmsHub settings={props.settings} onUpdateSettings={props.onUpdateSettings} />;
            case 'printouts_hub':
                return <PrintoutsHub />;

            // Admission Design
            case 'patient_registry_form':
                return <FormBuilder settings={props.settings} onUpdateSettings={props.onUpdateSettings} />;

            // Clinical Catalog
            case 'procedures':
                return <ProcedureCatalog settings={props.settings} onUpdateSettings={props.onUpdateSettings} />;
            case 'medications':
                return <PharmacyRegistry settings={props.settings} onUpdateSettings={props.onUpdateSettings} />;
            case 'shadeGuides':
                return <MaterialsRegistry settings={props.settings} onUpdateSettings={props.onUpdateSettings} />;

            // Financial & HR
            case 'paymentModes':
            case 'payrollAdjustments':
            case 'expenseCategories':
                return <FinancialSettings settings={props.settings} onUpdateSettings={props.onUpdateSettings} initialTab={activeRegistry} />;

            // Infrastructure
            case 'branches':
            case 'resources':
            case 'assets':
            case 'hospitalAffiliations':
                return <InfrastructureManager settings={props.settings} onUpdateSettings={props.onUpdateSettings} initialTab={activeRegistry} />;

            // Governance
            case 'audit_trail':
                return <AuditTrailViewer auditLog={props.auditLog} auditLogVerified={props.auditLogVerified} />;
            case 'npc_compliance':
            case 'retention':
                return <ComplianceCenter settings={props.settings} onUpdateSettings={props.onUpdateSettings} patients={props.patients} onPurgePatient={props.onPurgePatient} initialTab={activeRegistry} />;
            
            // Staff Management
            case 'staff':
            case 'privilege_elevation':
                return <StaffRegistry staff={props.staff} onStartImpersonating={props.onStartImpersonating} initialTab={activeRegistry} onDeactivateStaff={props.onDeactivateStaff} onOpenStaffModal={handleOpenStaffModal} />;

            default:
                return (
                    <div className="p-20 text-center flex flex-col items-center justify-center h-full">
                        <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                            <Settings size={48} className="text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-400">Settings Hub</h3>
                        <p className="text-slate-500 mt-2 max-w-sm">Select a configuration module from the sidebar to manage practice-wide settings and registries.</p>
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
        </div>
    );
};

export default FieldManagement;

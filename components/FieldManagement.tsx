import React, { useState } from 'react';
import { FieldSettings, User, AuditLogEntry, Patient, Appointment } from '../types';
import { 
  Settings, Box, User as UserIcon, 
  Sparkles, Wrench, LayoutPanelLeft, FileSignature, Printer, Smartphone, Receipt
} from 'lucide-react';



import SmsManager from './SmsManager';
import PracticeBranding from './PracticeBranding';
import FinancialSettings from './FinancialSettings';
import StaffRegistry from './StaffRegistry';
import InfrastructureManager from './InfrastructureManager';

import PrintManager from './PrintManager';


import ConsentFormManager from './ConsentFormManager';
import ClinicalCatalog from './ClinicalCatalog';

import { useStaff } from '../contexts/StaffContext';


interface FieldManagementProps {
  settings: FieldSettings;
  onUpdateSettings: (newSettings: FieldSettings) => void;
  auditLog: AuditLogEntry[];
  patients: Patient[];
  onPurgePatient: (id: string) => void;
  auditLogVerified: boolean | null;
  encryptionKey: string | null;
  appointments: Appointment[];
  currentUser: User;
  showModal: (type: string, props: any) => void;
}

import { useAppContext } from '../contexts/AppContext';

const FieldManagement: React.FC<FieldManagementProps> = (props) => {
    const { setFullScreenView } = useAppContext();
    const [activeRegistry, setActiveRegistry] = useState<string>('branding');
    const { handleSaveStaff, staff, handleDeactivateStaff, onDeleteStaff, onStartImpersonating } = useStaff();

    const sidebarItems = [
        { id: 'branding', label: 'Profile', icon: Sparkles },
        { id: 'patient_registry_form', label: 'Reg Form', icon: LayoutPanelLeft },
        { id: 'consent_forms', label: 'Consent', icon: FileSignature },
        { id: 'sms_manager', label: 'Comms', icon: Smartphone },
        { id: 'print_manager', label: 'Reports', icon: Printer },
        { id: 'staff_registry', label: 'Staff', icon: UserIcon },
        { id: 'clinical_catalog', label: 'Catalog', icon: Box },
        { id: 'finance_manager', label: 'Finance', icon: Receipt },
        { id: 'infrastructure', label: 'Equip', icon: Wrench },
    ];

    const handleOpenStaffModal = (staffMember: Partial<User> | null) => {
        props.showModal('userProfile', { user: staffMember || {}, onSave: handleSaveStaff });
    };

    const renderContent = () => {
        switch (activeRegistry) {
            // Core Identity
            case 'branding':
                return <PracticeBranding settings={props.settings} onUpdateSettings={props.onUpdateSettings} />;
            case 'consent_forms':
                return <ConsentFormManager settings={props.settings} onUpdateSettings={props.onUpdateSettings} />;
            case 'sms_manager':
                return <SmsManager settings={props.settings} onUpdateSettings={props.onUpdateSettings} />;
            case 'print_manager':
                return <PrintManager />;
            case 'staff_registry':
                return <StaffRegistry staff={staff} onStartImpersonating={onStartImpersonating} onDeactivateStaff={handleDeactivateStaff} onDeleteStaff={onDeleteStaff} onOpenStaffModal={handleOpenStaffModal} />;

            // Procedures & Catalog
            case 'clinical_catalog':
                return <ClinicalCatalog settings={props.settings} onUpdateSettings={props.onUpdateSettings} />;
            
            // Finance & Payroll
            case 'finance_manager':
                return <FinancialSettings settings={props.settings} onUpdateSettings={props.onUpdateSettings} />;

            // Infrastructure
            case 'infrastructure':
                return <InfrastructureManager settings={props.settings} onUpdateSettings={props.onUpdateSettings} initialTab={'resources'} />;
            
            default:
                return (
                    <div className="p-20 text-center flex flex-col items-center justify-center h-full">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6">
                            <Settings size={48} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-400 dark:text-slate-500">Settings</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">Select a configuration module from the top bar to manage practice-wide settings and registries.</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden relative">
            <div className="w-full bg-teal-900 text-white flex shrink-0 shadow-2xl z-40 overflow-x-auto no-scrollbar transition-all duration-500 border-b border-teal-800">
                <div className="flex p-2 gap-1 items-center">
                    {sidebarItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === 'patient_registry_form') {
                                    setFullScreenView({ 
                                        type: 'formBuilder', 
                                        props: {} 
                                    });
                                } else {
                                    setActiveRegistry(item.id);
                                }
                            }}
                            className={`whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeRegistry === item.id 
                                ? 'bg-teal-600 text-white shadow-lg' 
                                : 'text-teal-200 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <item.icon size={14} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {renderContent()}
            </div>
        </div>
    );
};

export default FieldManagement;

import React, { useState } from 'react';
import { FieldSettings, User, AuditLogEntry, Patient, Appointment } from '../types';
import { 
  Settings, ChevronRight, Box, User as UserIcon, 
  Sparkles, Wrench, LayoutPanelLeft, FileSignature, Printer, Smartphone, Receipt
} from 'lucide-react';



import SmsHub from './SmsHub';
import PracticeBranding from './PracticeBranding';
import FinancialSettings from './FinancialSettings';
import StaffRegistry from './StaffRegistry';
import InfrastructureManager from './InfrastructureManager';

import PrintoutsHub from './PrintoutsHub';


import ConsentFormManager from './ConsentFormManager';
import ClinicalCatalogHub from './ClinicalCatalogHub';

import { useStaff } from '../contexts/StaffContext';


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
  onDeleteStaff?: (userId: string) => void;
  showModal: (type: string, props: any) => void;
}

import { useAppContext } from '../contexts/AppContext';

const FieldManagement: React.FC<FieldManagementProps> = (props) => {
    const { setFullScreenView } = useAppContext();
    const [activeRegistry, setActiveRegistry] = useState<string>('branding');
    const { handleSaveStaff } = useStaff();

    const sidebarItems = [
        { id: 'branding', label: 'Global Profile', icon: Sparkles },
        { id: 'patient_registry_form', label: 'Registration Form', icon: LayoutPanelLeft },
        { id: 'consent_forms', label: 'Consent Forms', icon: FileSignature },
        { id: 'sms_hub', label: 'SMS & Comms Hub', icon: Smartphone },
        { id: 'printouts_hub', label: 'Printouts & Report Hub', icon: Printer },
        { id: 'staff_hub', label: 'Staff Management', icon: UserIcon },
        { id: 'catalog_hub', label: 'Clinical Catalog', icon: Box },
        { id: 'finance_hub', label: 'Financial Hub', icon: Receipt },
        { id: 'infrastructure', label: 'Infrastructure', icon: Wrench },
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
            case 'sms_hub':
                return <SmsHub settings={props.settings} onUpdateSettings={props.onUpdateSettings} />;
            case 'printouts_hub':
                return <PrintoutsHub />;
            case 'staff_hub':
                return <StaffRegistry staff={props.staff} onStartImpersonating={props.onStartImpersonating} onDeactivateStaff={props.onDeactivateStaff} onDeleteStaff={props.onDeleteStaff} onOpenStaffModal={handleOpenStaffModal} />;

            // Clinical Catalog Hub
            case 'catalog_hub':
                return <ClinicalCatalogHub settings={props.settings} onUpdateSettings={props.onUpdateSettings} />;
            
            // Financial Hub
            case 'finance_hub':
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
                        <h3 className="text-2xl font-black text-slate-400 dark:text-slate-500">Settings Hub</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">Select a configuration module from the sidebar to manage practice-wide settings and registries.</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-full overflow-hidden relative">
            <div className="w-64 bg-teal-900 text-white flex flex-col shrink-0 shadow-2xl z-40 overflow-y-auto no-scrollbar transition-all duration-500">
                <div className="p-8 border-b border-white/10 shrink-0">
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-teal-400">Settings Hub</h2>
                </div>
                <div className="flex-1 p-4 space-y-1">
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
                            className={`w-full flex justify-between items-center px-4 py-3 rounded-2xl text-left text-sm font-bold transition-all ${
                                activeRegistry === item.id 
                                ? 'bg-teal-600 text-white shadow-lg' 
                                : 'text-teal-200 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={18} />
                                <span>{item.label}</span>
                            </div>
                            {activeRegistry === item.id && <ChevronRight size={18}/>}
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

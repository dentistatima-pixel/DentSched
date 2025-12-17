
import React, { useState, useMemo } from 'react';
import { FieldSettings, ProcedureItem, FeatureToggles, User, SmsTemplates, OfficialReceiptBooklet, ClinicProfile, Medication, ConsentFormTemplate, ClinicalNoteTemplate, ClinicalProtocolRule, UserRole, RolePermissions, AuditLogEntry, Vendor, Patient } from '../types';
import { Plus, Trash2, Edit2, Check, X, Sliders, ChevronRight, DollarSign, ToggleLeft, ToggleRight, Box, Calendar, MapPin, User as UserIcon, MessageSquare, Tag, FileText, Heart, Activity, TrendingUp, Key, Shield, HardHat, Store, BookOpen, Pill, FileSignature, ClipboardPaste, Lock, Eye, AlertOctagon, Globe, AlertTriangle, Briefcase, Archive, AlertCircle, CheckCircle, DownloadCloud } from 'lucide-react';
import { useToast } from './ToastSystem';
import { formatDate } from '../constants';

interface FieldManagementProps {
  settings: FieldSettings;
  onUpdateSettings: (newSettings: FieldSettings) => void;
  staff?: User[];
  onUpdateStaff?: (updatedStaff: User[]) => void;
  auditLog: AuditLogEntry[];
  patients?: Patient[]; 
  onPurgePatient?: (id: string) => void; 
  onExportAuditLog?: () => void; // NEW
}

const DEFAULT_PERMISSIONS: Record<UserRole, RolePermissions> = {
    [UserRole.ADMIN]: { canVoidNotes: true, canEditFinancials: true, canDeletePatients: true, canOverrideProtocols: true, canManageInventory: true },
    [UserRole.DENTIST]: { canVoidNotes: true, canEditFinancials: false, canDeletePatients: false, canOverrideProtocols: true, canManageInventory: false },
    [UserRole.DENTAL_ASSISTANT]: { canVoidNotes: false, canEditFinancials: false, canDeletePatients: false, canOverrideProtocols: false, canManageInventory: true }
};

const FieldManagement: React.FC<FieldManagementProps> = ({ settings, onUpdateSettings, staff, onUpdateStaff, auditLog, patients = [], onPurgePatient, onExportAuditLog }) => {
    const toast = useToast();
    const [activeCategory, setActiveCategory] = useState<string>('features');

    const menuStructure = [
        { group: 'System Settings', icon: Sliders, items: [
            { key: 'features', label: 'System Features', icon: ToggleLeft },
            { key: 'permissions', label: 'Role Permissions', icon: Lock },
            { key: 'branches', label: 'Clinic Branches', icon: MapPin },
            { key: 'sms', label: 'Messaging & SMS', icon: MessageSquare },
            { key: 'receipts', label: 'BIR Receipt Booklets', icon: FileText },
        ]},
        { group: 'Clinical Content & Protocols', icon: BookOpen, items: [
            { key: 'procedures', label: 'Procedures & Prices', icon: DollarSign },
            { key: 'medications', label: 'Medication Formulary', icon: Pill },
            { key: 'consentForms', label: 'Consent Form Templates', icon: FileSignature },
            { key: 'protocolRules', label: 'Protocol Alert Rules', icon: Shield },
        ]},
        { group: 'Data Lists', icon: Tag, items: [
            { key: 'insuranceProviders', label: 'Insurance Providers', icon: Heart },
            { key: 'allergies', label: 'Common Allergies', icon: Activity },
            { key: 'medicalConditions', label: 'Medical Conditions', icon: Activity },
        ]},
        { group: 'Legal & Compliance', icon: Shield, items: [
            { key: 'auditLog', label: 'Audit Log', icon: Key },
            { key: 'vendors', label: 'Vendor Compliance', icon: Briefcase }, // NEW
            { key: 'retention', label: 'Data Retention & Disposal', icon: Archive }, // NEW
        ]},
    ];

    const handleTogglePermission = (role: UserRole, key: keyof RolePermissions) => {
        const currentPerms = settings.permissions || DEFAULT_PERMISSIONS;
        const newPerms = { ...currentPerms, [role]: { ...currentPerms[role], [key]: !currentPerms[role][key] } };
        onUpdateSettings({ ...settings, permissions: newPerms });
        toast.success(`Permissions updated for ${role}`);
    };

    const renderCurrentCategory = () => {
        switch(activeCategory) {
            case 'features': return renderFeatures();
            case 'permissions': return renderPermissions();
            case 'auditLog': return renderAuditLog();
            case 'vendors': return renderVendors();
            case 'retention': return renderDataRetention();
            default: return <div className="p-10 text-center text-slate-400"><HardHat size={32} className="mx-auto mb-2" /> Interface for this section is under construction.</div>;
        }
    };
    
    function renderFeatures() {
        return (
            <div className="p-6 bg-slate-50 h-full overflow-y-auto space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Store size={20} className="text-teal-600"/> Practice Environment Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={() => onUpdateSettings({ ...settings, clinicProfile: 'boutique' })} className={`p-4 rounded-xl border-2 text-left transition-all ${settings.clinicProfile === 'boutique' ? 'border-teal-500 bg-teal-50 shadow-md' : 'border-slate-200 hover:border-teal-300'}`}>
                            <div className="font-bold text-teal-800 text-lg">Solo / Boutique</div>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">Lean operations. Disables administrative oversight locks and multi-provider review queues.</p>
                        </button>
                        <button onClick={() => onUpdateSettings({ ...settings, clinicProfile: 'corporate' })} className={`p-4 rounded-xl border-2 text-left transition-all ${settings.clinicProfile === 'corporate' ? 'border-lilac-500 bg-lilac-50 shadow-md' : 'border-slate-200 hover:border-lilac-300'}`}>
                            <div className="font-bold text-lilac-800 text-lg">Multi-Doctor / Corporate</div>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">Enables maximum compliance: amendment workflows, plan approvals, and detailed audit logging.</p>
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToggleItem label="Multi-Branch Support" featureKey="enableMultiBranch" icon={MapPin} />
                    <ToggleItem label="Treatment Plan Approvals" featureKey="enableTreatmentPlanApprovals" icon={Shield} />
                    <ToggleItem label="Clinical Protocol Guard" featureKey="enableClinicalProtocolAlerts" icon={Shield} />
                    <ToggleItem label="Automated Supply Deduction" featureKey="enableInventory" icon={Box} />
                    <ToggleItem label="Patient Health Portal" featureKey="enablePatientPortal" icon={Globe} />
                </div>
            </div>
        );
    }

    function renderPermissions() {
        const perms = settings.permissions || DEFAULT_PERMISSIONS;
        const permissionLabels: Record<keyof RolePermissions, string> = {
            canVoidNotes: "Can Void/Amend Clinical Notes",
            canEditFinancials: "Can Manage Billing & Prices",
            canDeletePatients: "Can Delete/Archive Patient Files",
            canOverrideProtocols: "Can Force-Proceed on Protocol Alerts",
            canManageInventory: "Can Add/Edit Stock Items"
        };

        return (
            <div className="p-6 bg-slate-50 h-full overflow-y-auto space-y-8">
                <div className="bg-lilac-50 p-4 rounded-xl border border-lilac-100 flex gap-3 text-lilac-800">
                    <Lock size={20} className="shrink-0"/>
                    <p className="text-xs font-medium leading-relaxed">Define system boundaries to enforce dentist discipline and staff accountability. Changes are effective immediately for all active sessions.</p>
                </div>
                {Object.values(UserRole).map(role => (
                    <div key={role} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400"><UserIcon size={16}/></div>
                            <h4 className="font-bold text-slate-800">{role}</h4>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {Object.entries(permissionLabels).map(([key, label]) => (
                                <div key={key} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <span className="text-sm font-medium text-slate-700">{label}</span>
                                    <button 
                                        onClick={() => handleTogglePermission(role, key as keyof RolePermissions)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${perms[role][key as keyof RolePermissions] ? 'bg-teal-600' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${perms[role][key as keyof RolePermissions] ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    function renderAuditLog() {
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-4 bg-white border-b flex justify-between items-center shrink-0">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><Eye size={18} className="text-teal-600"/> Accountability Timeline</h4>
                    {onExportAuditLog && (
                        <button 
                            onClick={onExportAuditLog} 
                            className="text-xs font-bold text-teal-600 hover:text-white hover:bg-teal-600 border border-teal-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                        >
                            <DownloadCloud size={14} /> Export Secure Log
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {auditLog.length > 0 ? auditLog.map(log => {
                        const isSecurityAlert = log.action === 'SECURITY_ALERT';
                        const isDestruction = log.action === 'DESTRUCTION_CERTIFICATE';
                        return (
                            <div key={log.id} className={`bg-white p-4 rounded-xl border shadow-sm flex items-start gap-4 ${isSecurityAlert ? 'border-red-200 bg-red-50/50' : isDestruction ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200'}`}>
                                <div className={`p-2 rounded-lg shrink-0 ${isSecurityAlert ? 'bg-red-100 text-red-600' : isDestruction ? 'bg-amber-100 text-amber-600' : log.action === 'AMEND_RECORD' ? 'bg-lilac-100 text-lilac-600' : 'bg-slate-100 text-slate-600'}`}>
                                    {isSecurityAlert ? <AlertTriangle size={16}/> : isDestruction ? <Trash2 size={16}/> : <Activity size={16}/>}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <span className={`text-sm font-bold ${isSecurityAlert ? 'text-red-900' : isDestruction ? 'text-amber-900' : 'text-slate-800'}`}>{log.userName} <span className="text-slate-400 font-normal">executed</span> {log.action}</span>
                                        <div className="text-right">
                                            <span className="block text-[10px] font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                                            {log.isVerifiedTimestamp && <span className="text-[9px] text-green-600 font-bold flex items-center justify-end gap-1"><Check size={8}/> Verified Time</span>}
                                        </div>
                                    </div>
                                    <p className={`text-xs mt-1 italic ${isSecurityAlert ? 'text-red-700' : isDestruction ? 'text-amber-700' : 'text-slate-500'}`}>{log.details}</p>
                                    <div className="mt-2 flex gap-2">
                                        <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-500 uppercase">{log.entity}</span>
                                        <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-500 uppercase">{log.entityId}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : <div className="text-center py-20 text-slate-400 italic">No events recorded in the audit log.</div>}
                </div>
            </div>
        );
    }

    function renderVendors() {
        const vendors = settings.vendors || [];
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><Briefcase size={20} className="text-teal-600"/> Vendor Compliance Management</h4>
                    <p className="text-xs text-slate-500 mt-1">Manage Data Sharing Agreements (DSA) with third-party processors (Labs, HMOs) as per NPC Circular 16-02.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {vendors.length > 0 ? vendors.map(vendor => (
                        <div key={vendor.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-bold text-slate-800">{vendor.name}</h5>
                                    <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{vendor.type}</span>
                                </div>
                                <div className="text-sm text-slate-500 space-y-1">
                                    <div>Contact: {vendor.contactPerson} ({vendor.contactNumber})</div>
                                    <div>Email: {vendor.email}</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${vendor.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {vendor.status}
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">DSA Expiry</div>
                                    <div className={`font-mono text-sm font-bold ${new Date(vendor.dsaExpiryDate || '') < new Date() ? 'text-red-600' : 'text-slate-700'}`}>
                                        {formatDate(vendor.dsaExpiryDate)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : <div className="text-center py-20 text-slate-400">No vendors configured.</div>}
                </div>
            </div>
        );
    }

    function renderDataRetention() {
        // Filter patients older than 10 years (Mock logic: using 10 years ago from today)
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        
        // Find archived patients whose last visit was > 10 years ago
        const purgablePatients = patients.filter(p => {
            if (!p.isArchived) return false;
            const visitDate = new Date(p.lastVisit);
            return visitDate < tenYearsAgo;
        });

        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><Archive size={20} className="text-amber-600"/> Data Retention & Disposal</h4>
                    <p className="text-xs text-slate-500 mt-1">Manage compliance with the Storage Limitation Principle. Securely purge records exceeding the 10-year retention period.</p>
                </div>
                
                {purgablePatients.length > 0 ? (
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl mb-6">
                            <div className="flex items-center gap-2 text-amber-800 font-bold mb-1"><AlertCircle size={18}/> Action Required</div>
                            <p className="text-sm text-amber-700">Found {purgablePatients.length} archived records eligible for permanent disposal.</p>
                        </div>
                        
                        {purgablePatients.map(p => (
                            <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-red-200 transition-colors">
                                <div>
                                    <h5 className="font-bold text-slate-800">{p.name}</h5>
                                    <div className="text-xs text-slate-500 font-mono mt-1">ID: {p.id} • Last Visit: {formatDate(p.lastVisit)}</div>
                                </div>
                                <button 
                                    onClick={() => onPurgePatient && onPurgePatient(p.id)}
                                    className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                                >
                                    <Trash2 size={14}/> Secure Purge
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <CheckCircle size={48} className="mb-4 text-green-500 opacity-20"/>
                        <p className="font-bold text-slate-600">Compliance Status: Excellent</p>
                        <p className="text-sm">No records found exceeding the 10-year retention limit.</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-full md:w-72 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-100 bg-teal-900 text-white">
                    <h2 className="text-lg font-bold flex items-center gap-2"><Sliders size={20} /> Clinic Settings</h2>
                </div>
                <nav className="flex-1 overflow-y-auto p-2">
                    {menuStructure.map(group => (
                        <div key={group.group} className="py-2">
                            <h3 className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <group.icon size={12}/> {group.group}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map(item => (
                                    <button
                                        key={item.key}
                                        onClick={() => setActiveCategory(item.key)}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between transition-colors text-sm ${activeCategory === item.key ? 'bg-teal-50 text-teal-800 font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon size={16} className={`${activeCategory === item.key ? 'text-teal-600' : 'text-slate-400'}`} />
                                            <span>{item.label}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-white">
                    <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        {menuStructure.flatMap(g => g.items).find(i => i.key === activeCategory)?.label}
                    </h3>
                </div>
                {renderCurrentCategory()}
            </div>
        </div>
    );

    function ToggleItem({ label, featureKey, icon: Icon }: { label: string, featureKey: keyof FeatureToggles, icon: React.ElementType }) {
        return (
          <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-teal-300 transition-colors">
              <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-50 text-teal-600"><Icon size={18} /></div>
                  <span className="font-bold text-slate-700 text-sm">{label}</span>
              </div>
              <button onClick={() => onUpdateSettings({ ...settings, features: { ...settings.features, [featureKey]: !settings.features[featureKey] }})} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${ settings.features[featureKey] ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200' }`}>
                  {settings.features[featureKey] ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                  {settings.features[featureKey] ? 'Active' : 'Off'}
              </button>
          </div>
        )
    }
};

export default FieldManagement;

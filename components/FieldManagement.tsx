
import React, { useState, useMemo } from 'react';
import { FieldSettings, ProcedureItem, FeatureToggles, User, SmsTemplates, OfficialReceiptBooklet, ClinicProfile, Medication, ConsentFormTemplate, ClinicalNoteTemplate, ClinicalProtocolRule, UserRole, RolePermissions, AuditLogEntry, Vendor, Patient, ClinicalIncident, WasteLogEntry, AssetMaintenanceEntry } from '../types';
import { Plus, Trash2, Edit2, Check, X, Sliders, ChevronRight, DollarSign, ToggleLeft, ToggleRight, Box, Calendar, MapPin, User as UserIcon, MessageSquare, Tag, FileText, Heart, Activity, TrendingUp, Key, Shield, HardHat, Store, BookOpen, Pill, FileSignature, ClipboardPaste, Lock, Eye, AlertOctagon, Globe, AlertTriangle, Briefcase, Archive, AlertCircle, CheckCircle, DownloadCloud, Database, UploadCloud, Users, Droplet, Wrench, Radio } from 'lucide-react';
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
  onExportAuditLog?: () => void; 
  incidents?: ClinicalIncident[];
  wasteLogs?: WasteLogEntry[]; 
  assetLogs?: AssetMaintenanceEntry[]; 
}

const DEFAULT_PERMISSIONS: Record<UserRole, RolePermissions> = {
    [UserRole.ADMIN]: { canVoidNotes: true, canEditFinancials: true, canDeletePatients: true, canOverrideProtocols: true, canManageInventory: true },
    [UserRole.DENTIST]: { canVoidNotes: true, canEditFinancials: false, canDeletePatients: false, canOverrideProtocols: true, canManageInventory: false },
    [UserRole.DENTAL_ASSISTANT]: { canVoidNotes: false, canEditFinancials: false, canDeletePatients: false, canOverrideProtocols: false, canManageInventory: true }
};

const FieldManagement: React.FC<FieldManagementProps> = ({ settings, onUpdateSettings, staff = [], onUpdateStaff, auditLog, patients = [], onPurgePatient, onExportAuditLog, incidents = [], wasteLogs = [], assetLogs = [] }) => {
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
            { key: 'incidents', label: 'Clinical Incident Registry', icon: AlertOctagon }, 
        ]},
        { group: 'Data Lists', icon: Tag, items: [
            { key: 'insuranceProviders', label: 'Insurance Providers', icon: Heart },
            { key: 'allergies', label: 'Common Allergies', icon: Activity },
            { key: 'medicalConditions', label: 'Medical Conditions', icon: Activity },
        ]},
        { group: 'Legal & Compliance', icon: Shield, items: [
            { key: 'auditLog', label: 'Audit Log', icon: Key },
            { key: 'credentials', label: 'Credential Expiry Monitor', icon: CheckCircle }, 
            { key: 'vatSummary', label: 'BIR Senior/PWD VAT Summary', icon: TrendingUp }, 
            { key: 'radiologyLog', label: 'Radiology Request Log', icon: Radio }, // NEW: #1
            { key: 'wasteLogs', label: 'Bio-Medical Waste Log', icon: Droplet }, 
            { key: 'assetLogs', label: 'Asset Maintenance Registry', icon: Wrench }, 
            { key: 'vendors', label: 'Vendor Compliance', icon: Briefcase },
            { key: 'retention', label: 'Data Retention & Disposal', icon: Archive },
            { key: 'database', label: 'Database & Security', icon: Database }, 
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
            case 'database': return renderDatabaseManagement();
            case 'credentials': return renderCredentialsMonitor(); 
            case 'vatSummary': return renderVatSummary(); 
            case 'incidents': return renderIncidents(); 
            case 'wasteLogs': return renderWasteLogs(); 
            case 'assetLogs': return renderAssetLogs(); 
            case 'radiologyLog': return renderRadiologyLog(); // NEW: #1
            default: return <div className="p-10 text-center text-slate-400"><HardHat size={32} className="mx-auto mb-2" /> Interface for this section is under construction.</div>;
        }
    };

    function renderRadiologyLog() {
        const radiologyReferrals = useMemo(() => {
            const list: any[] = [];
            patients?.forEach(p => {
                p.referrals?.forEach(r => {
                    if (r.reason.toLowerCase().includes('x-ray') || r.reason.toLowerCase().includes('radiology')) {
                        list.push({ ...r, patientName: p.name });
                    }
                });
            });
            return list;
        }, [patients]);

        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><Radio size={20} className="text-teal-600"/> Radiology Request Log (DOH Ionizing Referral)</h4>
                    <p className="text-xs text-slate-500 mt-1">DOH regulatory register for external diagnostic requests. Tracks clinical justification and center referrals.</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-tighter">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Patient Name</th>
                                <th className="p-4">External Center</th>
                                <th className="p-4">Type/Reason</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {radiologyReferrals.length > 0 ? radiologyReferrals.map((req, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono text-slate-400">{formatDate(req.date)}</td>
                                    <td className="p-4 font-bold text-slate-800">{req.patientName}</td>
                                    <td className="p-4 text-teal-700 font-bold">{req.referredTo}</td>
                                    <td className="p-4 text-slate-500">{req.reason}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-0.5 rounded font-bold uppercase ${req.status === 'Completed' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-yellow-50 text-yellow-700 border border-yellow-100'}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">No external radiology requests found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    function renderWasteLogs() {
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-slate-700 flex items-center gap-2"><Droplet size={20} className="text-red-500"/> Bio-Medical Waste Log</h4>
                        <p className="text-xs text-slate-500 mt-1">DENR/DOH regulatory record for hazardous waste disposal and transport manifest tracking.</p>
                    </div>
                    <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md"><Plus size={14}/> Log Manifest</button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-tighter">
                            <tr><th className="p-4">Date</th><th className="p-4">Manifest #</th><th className="p-4">Waste Type</th><th className="p-4">Transporter</th><th className="p-4 text-right">Weight (kg)</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {wasteLogs.length > 0 ? wasteLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono text-slate-400">{formatDate(log.date)}</td>
                                    <td className="p-4 font-bold text-slate-800">{log.manifestNumber}</td>
                                    <td className="p-4"><span className="bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100 font-bold">{log.type}</span></td>
                                    <td className="p-4">{log.transporterName}</td>
                                    <td className="p-4 text-right font-mono font-bold">{log.weightKg} kg</td>
                                </tr>
                            )) : <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">No waste disposal manifests recorded.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    function renderAssetLogs() {
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-slate-700 flex items-center gap-2"><Wrench size={20} className="text-teal-600"/> Asset Maintenance Registry</h4>
                        <p className="text-xs text-slate-500 mt-1">Equipment health tracking (Dental Chairs, Autoclaves, Compressors) as required for DOH Licensing.</p>
                    </div>
                    <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md"><Plus size={14}/> Log Maintenance</button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-tighter">
                            <tr><th className="p-4">Date</th><th className="p-4">Equipment</th><th className="p-4">Type</th><th className="p-4">Technician</th><th className="p-4">Next Due</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {assetLogs.length > 0 ? assetLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono text-slate-400">{formatDate(log.date)}</td>
                                    <td className="p-4 font-bold text-slate-800">{log.assetName} <span className="text-[9px] text-slate-400 font-normal ml-1">S/N: {log.serialNumber}</span></td>
                                    <td className="p-4"><span className={`px-2 py-0.5 rounded border font-bold ${log.type === 'Preventive' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{log.type}</span></td>
                                    <td className="p-4">{log.technician}</td>
                                    <td className="p-4 font-bold text-teal-600">{formatDate(log.nextDueDate)}</td>
                                </tr>
                            )) : <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">No equipment maintenance records found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    function renderIncidents() {
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><AlertOctagon size={20} className="text-red-600"/> Clinical Incident Registry</h4>
                    <p className="text-xs text-slate-500 mt-1">Private repository for logging complications and adverse events for malpractice defense and peer review.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {incidents.length > 0 ? incidents.map(inc => (
                        <div key={inc.id} className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${inc.severity === 'Major' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>{inc.severity} Severity</span>
                                    <h5 className="font-bold text-slate-800 mt-1">{inc.category}</h5>
                                </div>
                                <div className="text-right text-xs text-slate-400 font-mono">{formatDate(inc.date)}</div>
                            </div>
                            <p className="text-xs text-slate-600 italic">"{inc.description}"</p>
                            <div className="mt-3 pt-3 border-t border-slate-100 text-xs">
                                <span className="font-bold text-slate-500 uppercase text-[9px] block mb-1">Management Action</span>
                                <p className="text-slate-700">{inc.managementTaken}</p>
                            </div>
                        </div>
                    )) : <div className="text-center py-20 text-slate-400 italic">No clinical incidents recorded. Excellent clinical safety record.</div>}
                </div>
            </div>
        );
    }

    function renderCredentialsMonitor() {
        const today = new Date();
        const thirtyDaysFromNow = new Date(); thirtyDaysFromNow.setDate(today.getDate() + 30);

        const dentists = staff.filter(s => s.role === UserRole.DENTIST || s.role === UserRole.ADMIN);

        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><CheckCircle size={20} className="text-teal-600"/> Credential Expiry Monitor</h4>
                    <p className="text-xs text-slate-500 mt-1">Audit active PRC, PTR, and S2 licenses to ensure legal authority to practice.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {dentists.map(dentist => {
                        const prcExp = dentist.prcExpiry ? new Date(dentist.prcExpiry) : null;
                        const s2Exp = dentist.s2Expiry ? new Date(dentist.s2Expiry) : null;
                        
                        const isPrcCritical = prcExp && prcExp < thirtyDaysFromNow;
                        const isS2Critical = s2Exp && s2Exp < thirtyDaysFromNow;

                        return (
                            <div key={dentist.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-teal-200 transition-colors">
                                <img src={dentist.avatar} className="w-12 h-12 rounded-full border-2 border-slate-100" />
                                <div className="flex-1">
                                    <h5 className="font-bold text-slate-800">{dentist.name}</h5>
                                    <p className="text-xs text-slate-500">{dentist.specialization}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-right">
                                        <div className="text-[9px] font-bold text-slate-400 uppercase">PRC Expiry</div>
                                        <div className={`text-xs font-bold ${isPrcCritical ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>{formatDate(dentist.prcExpiry)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] font-bold text-slate-400 uppercase">S2 Expiry</div>
                                        <div className={`text-xs font-bold ${isS2Critical ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>{formatDate(dentist.s2Expiry)}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    function renderVatSummary() {
        const vatExemptTransactions = useMemo(() => {
            const list: any[] = [];
            patients.forEach(p => {
                p.ledger?.forEach(entry => {
                    if (entry.discountType === 'Senior Citizen' || entry.discountType === 'PWD') {
                        list.push({
                            patientName: p.name,
                            idNumber: entry.idNumber,
                            type: entry.discountType,
                            date: entry.date,
                            basePrice: entry.amount / 0.8, // Estimate base from net
                            discountAmount: (entry.amount / 0.8) * 0.2,
                            netPrice: entry.amount
                        });
                    }
                });
            });
            return list;
        }, [patients]);

        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><TrendingUp size={20} className="text-teal-600"/> BIR Senior/PWD VAT Summary</h4>
                    <p className="text-xs text-slate-500 mt-1">Automated register for RR No. 7-2010. This data is mandatory during BIR tax examinations.</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-tighter">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">OSCA/PWD ID</th>
                                <th className="p-4 text-right">Base Price</th>
                                <th className="p-4 text-right">20% Discount</th>
                                <th className="p-4 text-right">Amount Paid</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {vatExemptTransactions.map((tx, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono text-slate-400">{formatDate(tx.date)}</td>
                                    <td className="p-4 font-bold text-slate-800">{tx.patientName}</td>
                                    <td className="p-4 font-mono text-teal-600 font-bold">{tx.idNumber}</td>
                                    <td className="p-4 text-right text-slate-400">₱{tx.basePrice.toLocaleString()}</td>
                                    <td className="p-4 text-right text-red-600 font-bold">-₱{tx.discountAmount.toLocaleString()}</td>
                                    <td className="p-4 text-right font-bold text-slate-800">₱{tx.netPrice.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

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
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        
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

    function renderDatabaseManagement() {
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><Database size={20} className="text-teal-600"/> Disaster Recovery</h4>
                    <p className="text-xs text-slate-500 mt-1">
                        Securely backup or restore the entire clinic database. 
                        <strong className="text-red-600 ml-1">Warning: Restore will overwrite all current data.</strong>
                    </p>
                </div>
                
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 mb-4">
                            <DownloadCloud size={24} />
                        </div>
                        <h5 className="font-bold text-slate-800 text-lg mb-2">Encrypted Backup</h5>
                        <p className="text-sm text-slate-500 mb-6">
                            Download a full copy of all patient records, appointments, and logs. 
                            The file is <strong>encrypted</strong> with your current password.
                        </p>
                        <button 
                            onClick={() => document.getElementById('trigger-db-backup')?.click()}
                            className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <DownloadCloud size={18} /> Download Backup
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-4">
                            <UploadCloud size={24} />
                        </div>
                        <h5 className="font-bold text-slate-800 text-lg mb-2">Restore Database</h5>
                        <p className="text-sm text-slate-500 mb-6">
                            Upload a <code>.db</code> file to restore.
                            <br/>
                            <strong className="text-red-500">Caution:</strong> This action permanently replaces all current data.
                        </p>
                        <button 
                            onClick={() => document.getElementById('restore-db-input')?.click()}
                            className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:border-amber-400 hover:text-amber-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <UploadCloud size={18} /> Upload & Restore
                        </button>
                    </div>
                </div>
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
            <button id="trigger-db-backup" style={{display: 'none'}} onClick={() => window.dispatchEvent(new CustomEvent('trigger-backup'))} />
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

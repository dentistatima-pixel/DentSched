
import React, { useState, useMemo } from 'react';
import { FieldSettings, User, UserRole, RolePermissions, AuditLogEntry, Patient, ClinicalIncident, LeaveRequest, StaffShift, FeatureToggles, SmsTemplateConfig, SmsCategory, SmsTemplates } from '../types';
import { Plus, Trash2, Edit2, Check, X, Sliders, ChevronRight, DollarSign, ToggleLeft, ToggleRight, Box, Calendar, MapPin, User as UserIcon, MessageSquare, Tag, FileText, Heart, Activity, TrendingUp, Key, Shield, HardHat, Store, BookOpen, Pill, FileSignature, ClipboardPaste, Lock, Eye, AlertOctagon, Globe, AlertTriangle, Briefcase, Archive, AlertCircle, CheckCircle, DownloadCloud, Database, UploadCloud, Users, Droplet, Wrench, Clock, Plane, CalendarDays, Smartphone, Zap } from 'lucide-react';
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
}

const DEFAULT_PERMISSIONS: Record<UserRole, RolePermissions> = {
    [UserRole.ADMIN]: { canVoidNotes: true, canEditFinancials: true, canDeletePatients: true, canOverrideProtocols: true, canOverrideMandatoryMedical: true, canManageInventory: true },
    [UserRole.DENTIST]: { canVoidNotes: true, canEditFinancials: false, canDeletePatients: false, canOverrideProtocols: true, canOverrideMandatoryMedical: true, canManageInventory: false },
    [UserRole.DENTAL_ASSISTANT]: { canVoidNotes: false, canEditFinancials: false, canDeletePatients: false, canOverrideProtocols: false, canOverrideMandatoryMedical: false, canManageInventory: true }
};

const FieldManagement: React.FC<FieldManagementProps> = ({ settings, onUpdateSettings, staff = [], onUpdateStaff, auditLog, patients = [], onPurgePatient, onExportAuditLog, incidents = [] }) => {
    const toast = useToast();
    const [activeCategory, setActiveCategory] = useState<string>('features');
    // FIX for Error #310: Move nested useState hooks to the top level of the component.
    const [activeSmsCat, setActiveSmsCat] = useState<SmsCategory>('Onboarding');

    const menuStructure = [
        { group: 'System Settings', icon: Sliders, items: [
            { key: 'features', label: 'System Features', icon: ToggleLeft },
            { key: 'sms', label: 'SMS Automation Engine', icon: Smartphone },
            { key: 'permissions', label: 'Role Permissions', icon: Lock },
            { key: 'roster', label: 'Staff Roster & Shifts', icon: CalendarDays },
            { key: 'leaves', label: 'Leave Management', icon: Plane },
            { key: 'branches', label: 'Clinic Branches', icon: MapPin },
        ]},
        { group: 'Clinical Content', icon: BookOpen, items: [
            { key: 'procedures', label: 'Procedures & Prices', icon: DollarSign },
            { key: 'medications', label: 'Medication Formulary', icon: Pill },
            { key: 'protocolRules', label: 'Protocol Alert Rules', icon: Shield },
        ]},
        { group: 'Legal & Compliance', icon: Shield, items: [
            { key: 'auditLog', label: 'Audit Log', icon: Key },
            { key: 'credentials', label: 'Credentials Monitor', icon: CheckCircle }, 
            { key: 'vendors', label: 'Vendor Compliance', icon: Briefcase },
            { key: 'retention', label: 'Data Retention', icon: Archive },
        ]},
    ];

    const handleTogglePermission = (role: UserRole, permission: keyof RolePermissions) => {
        const perms = settings.permissions || DEFAULT_PERMISSIONS;
        const updatedPerms = {
            ...perms,
            [role]: {
                ...perms[role],
                [permission]: !perms[role][permission]
            }
        };
        onUpdateSettings({ ...settings, permissions: updatedPerms });
    };

    const handleUpdateRoster = (newShift: StaffShift) => {
        const updatedShifts = [...(settings.shifts || []), newShift];
        onUpdateSettings({ ...settings, shifts: updatedShifts });
        toast.success(`Shift assigned to ${staff.find(s => s.id === newShift.staffId)?.name}`);
    };

    const handleUpdateLeave = (requestId: string, status: 'Approved' | 'Rejected') => {
        const updatedLeaves = (settings.leaveRequests || []).map(l => l.id === requestId ? { ...l, status } : l);
        onUpdateSettings({ ...settings, leaveRequests: updatedLeaves });
        toast.success(`Leave request ${status.toLowerCase()}.`);
    };

    const renderCurrentCategory = () => {
        switch(activeCategory) {
            case 'features': return renderFeatures();
            case 'sms': return renderSmsEngine();
            case 'permissions': return renderPermissions();
            case 'roster': return renderRoster();
            case 'leaves': return renderLeaves();
            case 'auditLog': return renderAuditLog();
            default: return <div className="p-10 text-center text-slate-400"><HardHat size={32} className="mx-auto mb-2" /> Interface for this section is under construction.</div>;
        }
    };

    function renderSmsEngine() {
        const templates = settings.smsTemplates;
        const categories: SmsCategory[] = ['Onboarding', 'Safety', 'Logistics', 'Recovery', 'Financial', 'Security', 'Efficiency'];

        const handleUpdateTemplate = (id: string, updates: Partial<SmsTemplateConfig>) => {
            const updated = { ...templates, [id]: { ...templates[id], ...updates } };
            onUpdateSettings({ ...settings, smsTemplates: updated });
        };

        const currentItems = (Object.values(templates) as SmsTemplateConfig[]).filter((t: SmsTemplateConfig) => t.category === activeSmsCat);

        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center shrink-0">
                    <div>
                        <h4 className="font-bold text-slate-700 flex items-center gap-2"><Smartphone size={20} className="text-teal-600"/> SMS Automation Logic</h4>
                        <p className="text-xs text-slate-500 mt-1">Configure professional automated messaging for all 32 clinical and practice triggers.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                        {categories.map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setActiveSmsCat(cat)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${activeSmsCat === cat ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:text-teal-600'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        {currentItems.map((tmpl: SmsTemplateConfig) => (
                            <div key={tmpl.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group">
                                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${tmpl.enabled ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-500'}`}>
                                            <Zap size={16}/>
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm">{tmpl.label}</div>
                                            <div className="text-[10px] text-slate-400 font-medium italic">{tmpl.triggerDescription}</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleUpdateTemplate(tmpl.id, { enabled: !tmpl.enabled })}
                                        className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase border transition-all ${tmpl.enabled ? 'bg-teal-600 text-white border-teal-500' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        {tmpl.enabled ? 'Automation Active' : 'Off'}
                                    </button>
                                </div>
                                <div className="p-4 flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Template Content</label>
                                        <textarea 
                                            value={tmpl.text}
                                            onChange={e => handleUpdateTemplate(tmpl.id, { text: e.target.value })}
                                            className="w-full mt-1 p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-teal-500 outline-none transition-all resize-none h-24"
                                            placeholder="Enter message text..."
                                        />
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {['{PatientName}', '{Doctor}', '{Date}', '{Time}', '{Branch}', '{Procedure}', '{Amount}'].map(tag => (
                                                <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-mono border border-slate-200">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="w-full md:w-64 bg-lilac-50 p-4 rounded-xl border border-lilac-100 flex flex-col">
                                        <span className="text-[9px] font-bold text-lilac-600 uppercase mb-2 block tracking-widest">Mobile Preview</span>
                                        <div className="flex-1 bg-white rounded-lg p-3 shadow-inner text-[11px] text-slate-600 leading-tight">
                                            {tmpl.text.replace(/{PatientName}/g, 'Michael Scott').replace(/{Date}/g, '12/25').replace(/{Time}/g, '2:00 PM').replace(/{Doctor}/g, 'Dr. Crentist')}
                                        </div>
                                        <span className="text-[9px] text-lilac-400 mt-2 italic">Standard carrier rates apply.</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    function renderRoster() {
        const shifts = settings.shifts || [];
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-slate-700 flex items-center gap-2"><CalendarDays size={20} className="text-teal-600"/> Advanced Staff Roster</h4>
                        <p className="text-xs text-slate-500 mt-1">Multi-branch shift rotation and On-Call tracking for optimized coverage.</p>
                    </div>
                    <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-teal-700 transition-all flex items-center gap-2"><Plus size={14}/> Assign Shift</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 gap-4">
                        {staff.map(member => {
                            const memberShifts = shifts.filter(s => s.staffId === member.id);
                            return (
                                <div key={member.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <img src={member.avatar} className="w-10 h-10 rounded-full border-2 border-slate-100" />
                                        <div>
                                            <div className="font-bold text-slate-800">{member.name}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase">{member.role}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {memberShifts.length > 0 ? memberShifts.map(s => (
                                            <div key={s.id} className={`px-3 py-1 rounded-lg border text-[10px] font-bold flex flex-col items-center ${s.isOnCall ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                                <span>{s.branch}</span>
                                                {s.isOnCall && <span className="text-[8px] animate-pulse">ON-CALL</span>}
                                            </div>
                                        )) : <span className="text-xs text-slate-300 italic">No shifts assigned.</span>}
                                    </div>
                                    <button className="opacity-0 group-hover:opacity-100 p-2 text-teal-600 transition-all"><Edit2 size={16}/></button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    function renderLeaves() {
        const leaves = settings.leaveRequests || [];
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><Plane size={20} className="text-lilac-600"/> Leave Management Registry</h4>
                    <p className="text-xs text-slate-500 mt-1">Review and manage vacation, sick, and emergency leave requests.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {leaves.length > 0 ? leaves.map(req => (
                        <div key={req.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex gap-4">
                                <div className={`p-3 rounded-xl shrink-0 ${req.status === 'Approved' ? 'bg-green-100 text-green-700' : req.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                    <Clock size={24}/>
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800">{req.staffName} <span className="text-xs font-normal text-slate-400">• {req.type} Leave</span></div>
                                    <div className="text-xs text-slate-500 font-mono mt-1">{formatDate(req.startDate)} → {formatDate(req.endDate)}</div>
                                    {req.reason && <p className="text-[10px] text-slate-400 italic mt-2">"{req.reason}"</p>}
                                </div>
                            </div>
                            {req.status === 'Pending' ? (
                                <div className="flex gap-2 items-center">
                                    <button onClick={() => handleUpdateLeave(req.id, 'Rejected')} className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg text-xs hover:bg-red-100 transition-colors">Reject</button>
                                    <button onClick={() => handleUpdateLeave(req.id, 'Approved')} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg text-xs shadow-md hover:bg-green-700 transition-all">Approve</button>
                                </div>
                            ) : (
                                <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase border self-center ${req.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {req.status}
                                </div>
                            )}
                        </div>
                    )) : <div className="text-center py-20 text-slate-400 italic">No active leave requests. Full attendance confirmed.</div>}
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
                        <button onClick={() => onUpdateSettings({ ...settings, clinicProfile: 'corporate' })} className={`p-4 rounded-xl border-2 text-left transition-all ${settings.clinicProfile === 'corporate' ? 'border-lilac-500 bg-lilac-50 shadow-md' : 'border-slate-200 hover:border-teal-300'}`}>
                            <div className="font-bold text-lilac-800 text-lg">Multi-Doctor / Corporate</div>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">Enables maximum compliance: amendment workflows, plan approvals, and detailed audit logging.</p>
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToggleItem label="Multi-Branch Support" featureKey="enableMultiBranch" icon={MapPin} />
                    <ToggleItem label="Treatment Plan Approvals" featureKey="enableTreatmentPlanApprovals" icon={Shield} />
                    <ToggleItem label="SMS Automation Engine" featureKey="enableSmsAutomation" icon={Smartphone} />
                    <ToggleItem label="Automated Supply Reordering" featureKey="enableInventory" icon={Box} />
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
            canOverrideMandatoryMedical: "Can Override Mandatory Medical Data",
            canOverrideClinicalSafety: "Can Override Clinical Safety Blocks",
            canManageInventory: "Can Add/Edit Stock Items"
        };

        return (
            <div className="p-6 bg-slate-50 h-full overflow-y-auto space-y-8">
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
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {auditLog.length > 0 ? auditLog.map(log => (
                        <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
                            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg shrink-0"><Activity size={16}/></div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-bold text-slate-800">{log.userName} <span className="text-slate-400 font-normal">executed</span> {log.action}</span>
                                    <span className="block text-[10px] font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-xs mt-1 italic text-slate-500">{log.details}</p>
                            </div>
                        </div>
                    )) : <div className="text-center py-20 text-slate-400 italic">No events recorded.</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-full md:w-72 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-100 bg-teal-900 text-white"><h2 className="text-lg font-bold flex items-center gap-2"><Sliders size={20} /> Settings</h2></div>
                <nav className="flex-1 overflow-y-auto p-2">
                    {menuStructure.map(group => (
                        <div key={group.group} className="py-2">
                            <h3 className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><group.icon size={12}/> {group.group}</h3>
                            <div className="space-y-1">
                                {group.items.map(item => (
                                    <button key={item.key} onClick={() => setActiveCategory(item.key)} className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between transition-colors text-sm ${activeCategory === item.key ? 'bg-teal-50 text-teal-800 font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                                        <div className="flex items-center gap-3"><item.icon size={16} className={`${activeCategory === item.key ? 'text-teal-600' : 'text-slate-400'}`} /><span>{item.label}</span></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">{renderCurrentCategory()}</div>
        </div>
    );

    function ToggleItem({ label, featureKey, icon: Icon }: { label: string, featureKey: keyof FeatureToggles, icon: React.ElementType }) {
        return (
          <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-teal-300 transition-colors">
              <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-teal-50 text-teal-600"><Icon size={18} /></div><span className="font-bold text-slate-700 text-sm">{label}</span></div>
              <button onClick={() => onUpdateSettings({ ...settings, features: { ...settings.features, [featureKey]: !settings.features[featureKey] }})} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${ settings.features[featureKey] ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200' }`}>
                  {settings.features[featureKey] ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                  {settings.features[featureKey] ? 'Active' : 'Off'}
              </button>
          </div>
        )
    }
};

export default FieldManagement;

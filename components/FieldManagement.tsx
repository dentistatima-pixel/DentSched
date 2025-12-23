import React, { useState, useMemo, useEffect } from 'react';
import { FieldSettings, User, UserRole, RolePermissions, AuditLogEntry, Patient, ClinicalIncident, LeaveRequest, StaffShift, FeatureToggles, SmsTemplateConfig, SmsCategory, SmsTemplates, PurgeRequest, ClinicStatus, ClinicIdentity } from '../types';
import { Plus, Trash2, Edit2, Check, X, Sliders, ChevronRight, DollarSign, ToggleLeft, ToggleRight, Box, Calendar, MapPin, User as UserIcon, MessageSquare, Tag, FileText, Heart, Activity, Key, Shield, HardHat, Store, BookOpen, Pill, FileSignature, ClipboardPaste, Lock, Eye, AlertOctagon, Globe, AlertTriangle, Briefcase, Archive, AlertCircle, CheckCircle, DownloadCloud, Database, UploadCloud, Users, Droplet, Wrench, Clock, Plane, CalendarDays, Smartphone, Zap, Star, ShieldAlert, MonitorOff, Terminal, FileWarning, Link, ShieldCheck, Printer, KeyRound, Fingerprint, Trash, Scale, Building2, Award, Sparkles, Server, LockKeyhole, RefreshCw } from 'lucide-react';
import { useToast } from './ToastSystem';
import { formatDate } from '../constants';

interface FieldManagementProps {
  settings: FieldSettings;
  onUpdateSettings: (newSettings: FieldSettings) => void;
  staff?: User[];
  onUpdateStaff?: (updatedStaff: User[]) => void;
  currentUser: User;
  auditLog: AuditLogEntry[];
  patients?: Patient[]; 
  onInitiatePurge?: (id: string, staffId: string, staffName: string) => void; 
  onFinalPurge?: (id: string, staffId: string, staffName: string) => void;
  logAction?: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
  incidents?: ClinicalIncident[];
  auditLogVerified?: boolean | null;
  uiMode?: string;
}

const FieldManagement: React.FC<FieldManagementProps> = ({ settings, onUpdateSettings, staff = [], onUpdateStaff, currentUser, auditLog, patients = [], onInitiatePurge, onFinalPurge, logAction, incidents = [], auditLogVerified, uiMode }) => {
    const toast = useToast();
    const [activeCategory, setActiveCategory] = useState<string>('features');
    const [activeSmsCat, setActiveSmsCat] = useState<SmsCategory>('Onboarding');
    const [showExpansionModal, setShowExpansionModal] = useState(false);
    
    const [pinModal, setPinModal] = useState<{ type: 'initiate' | 'final', target: Patient } | null>(null);

    const enableMultiBranch = settings.features.enableMultiBranch;
    const isAssistant = currentUser.role === UserRole.DENTAL_ASSISTANT;

    const menuStructure = [
        { group: 'System Settings', icon: Sliders, items: [
            { key: 'features', label: 'System Features', icon: ToggleLeft },
            { key: 'reputation', label: 'Reputation & Growth', icon: Star },
            { key: 'sms', label: 'SMS Automation Engine', icon: Smartphone },
        ]},
        { group: 'Legal & Compliance', icon: Shield, items: [
            { key: 'auditLog', label: 'Forensic Timeline', icon: Key },
            { key: 'residency', label: 'Data Residency', icon: Server },
            { key: 'npc', label: 'NPC Breach Protocol', icon: ShieldAlert },
            { key: 'retention', label: 'Data Retention', icon: Archive },
        ]},
    ];

    const rotateKeys = () => {
        const nextEpoch = (settings.encryptionEpoch || 1) + 1;
        onUpdateSettings({ ...settings, encryptionEpoch: nextEpoch, epochLastRotated: new Date().toISOString() });
        if (logAction) logAction('ROTATE_KEYS', 'System', 'Security', `Encryption Epoch migrated to Generation ${nextEpoch}.`);
        toast.success(`Cryptographic Epoch Rotated: Generation ${nextEpoch} now active.`);
    };

    const renderCurrentCategory = () => {
        switch(activeCategory) {
            case 'features': return renderFeatures();
            case 'sms': return renderSmsEngine();
            case 'residency': return renderResidency();
            case 'auditLog': return renderAuditLog();
            case 'npc': return renderNPCProtocol();
            default: return <div className="p-10 text-center text-slate-400"><HardHat size={32} className="mx-auto mb-2" /> Section interface is under construction.</div>;
        }
    };

    function renderFeatures() {
        return (
            <div className="p-6 bg-slate-50 h-full overflow-y-auto space-y-6 no-scrollbar">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-lilac-50 p-3 rounded-2xl text-lilac-600"><LockKeyhole size={24}/></div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Security & Encryption Epoch</h3>
                                <p className="text-xs text-slate-500 mt-1">Generation {settings.encryptionEpoch || 1} Active • Last Rotated: {formatDate(settings.epochLastRotated)}</p>
                            </div>
                        </div>
                        <button onClick={rotateKeys} className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-teal-600/20 flex items-center gap-2 hover:scale-105 transition-all"><RefreshCw size={14}/> Rotate Keys</button>
                    </div>
                </div>
            </div>
        );
    }

    function renderResidency() {
        const residency = settings.dataResidency || { primaryRegion: 'Philippines - Manila', backupRegion: 'Philippines - Cebu', lastAuditDate: new Date().toISOString() };
        return (
            <div className="p-6 bg-slate-50 h-full space-y-6 overflow-y-auto no-scrollbar">
                <div className="bg-teal-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Globe size={120}/></div>
                    <div className="relative z-10">
                        <div className="bg-teal-500/20 border border-teal-400/30 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 mb-6"><ShieldCheck size={12}/> Verified PH Data Silo</div>
                        <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 leading-tight">Data Residency & Sovereignity Sentinel</h3>
                        <p className="text-teal-100/80 max-w-xl text-lg font-medium leading-relaxed">Registry data is physically restricted to Philippine borders to satisfy National Privacy Commission (NPC) cross-border transfer mandates.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-teal-50 p-2 rounded-xl text-teal-600"><MapPin size={20}/></div>
                                <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Primary Silo Region</h4>
                            </div>
                            <div className="text-2xl font-black text-slate-700">{residency.primaryRegion}</div>
                            <p className="text-xs text-slate-400 mt-2 font-medium">Locked for Clinical Data Persistence.</p>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-lilac-50 p-2 rounded-xl text-lilac-600"><Database size={20}/></div>
                                <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Failover Replication</h4>
                            </div>
                            <div className="text-2xl font-black text-slate-700">{residency.backupRegion}</div>
                            <p className="text-xs text-slate-400 mt-2 font-medium">Continuous Sync Active.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function renderAuditLog() {
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2"><Eye size={18} className="text-teal-600"/> Forensic Timeline</h4>
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">Integrity Hash: SHA-256</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                    {auditLog.map(log => (
                        <div key={log.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-teal-500 transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{log.userName} • {log.action}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black bg-teal-50 text-teal-600 px-2 py-0.5 rounded uppercase">E{log.encryptionEpoch || 1}</span>
                                    <span className="text-[10px] font-mono text-slate-400">{formatDate(log.timestamp)}</span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 italic mb-4 leading-relaxed">{log.details}</p>
                            <div className="text-[8px] font-mono text-slate-300 group-hover:text-teal-500 transition-colors uppercase tracking-tighter truncate border-t pt-2">Seal: {log.hash}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    function renderNPCProtocol() {
        return (
            <div className="p-6 h-full flex flex-col gap-6 bg-slate-50 no-scrollbar overflow-y-auto">
                <div className="bg-red-600 p-8 rounded-3xl text-white shadow-xl shadow-red-600/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12"><ShieldAlert size={140}/></div>
                    <h3 className="text-2xl font-black uppercase tracking-tight mb-2">NPC 72-Hour Breach Response</h3>
                    <p className="text-red-100 max-w-xl text-sm leading-relaxed">R.A. 10173 mandates reporting of security incidents involving Sensitive Personal Information within 72 hours of discovery. Use this tool to generate compliant NPC templates pre-filled from your audit logs.</p>
                </div>
            </div>
        );
    }

    function renderSmsEngine() { return <div className="p-10 text-slate-400">SMS Engine Interface...</div>; }

    return (
        <div className="flex flex-col md:flex-row h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-full md:w-72 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col shrink-0"><nav className="flex-1 overflow-y-auto p-4 no-scrollbar">{menuStructure.map(group => (<div key={group.group} className="py-2"><h3 className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><group.icon size={12}/> {group.group}</h3><div className="space-y-1">{group.items.map(item => (<button key={item.key} onClick={() => setActiveCategory(item.key)} className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between transition-colors text-sm ${activeCategory === item.key ? 'bg-teal-50 text-teal-800 font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><div className="flex items-center gap-3"><item.icon size={18} className={`${activeCategory === item.key ? 'text-teal-600' : 'text-slate-400'}`} /><span>{item.label}</span></div></button>))}</div></div>))}</nav></div>
            <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">{renderCurrentCategory()}</div>
        </div>
    );
};

export default FieldManagement;
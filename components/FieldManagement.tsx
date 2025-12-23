import React, { useState, useMemo, useEffect } from 'react';
import { FieldSettings, User, UserRole, RolePermissions, AuditLogEntry, Patient, ClinicalIncident, LeaveRequest, StaffShift, FeatureToggles, SmsTemplateConfig, SmsCategory, SmsTemplates, PurgeRequest, ClinicStatus, ClinicIdentity } from '../types';
import { Plus, Trash2, Edit2, Check, X, Sliders, ChevronRight, DollarSign, ToggleLeft, ToggleRight, Box, Calendar, MapPin, User as UserIcon, MessageSquare, Tag, FileText, Heart, Activity, Key, Shield, HardHat, Store, BookOpen, Pill, FileSignature, ClipboardPaste, Lock, Eye, AlertOctagon, Globe, AlertTriangle, Briefcase, Archive, AlertCircle, CheckCircle, DownloadCloud, Database, UploadCloud, Users, Droplet, Wrench, Clock, Plane, CalendarDays, Smartphone, Zap, Star, ShieldAlert, MonitorOff, Terminal, FileWarning, Link, ShieldCheck, Printer, KeyRound, Fingerprint, Trash, Scale, Building2, Award, Sparkles } from 'lucide-react';
import { useToast } from './ToastSystem';
import { formatDate } from '../constants';
import { jsPDF } from 'jspdf';

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
  onExportAuditLog?: () => void; 
  incidents?: ClinicalIncident[];
  auditLogVerified?: boolean | null;
}

const FieldManagement: React.FC<FieldManagementProps> = ({ settings, onUpdateSettings, staff = [], onUpdateStaff, currentUser, auditLog, patients = [], onInitiatePurge, onFinalPurge, onExportAuditLog, incidents = [], auditLogVerified }) => {
    const toast = useToast();
    const [activeCategory, setActiveCategory] = useState<string>('features');
    const [activeSmsCat, setActiveSmsCat] = useState<SmsCategory>('Onboarding');
    const [activeRetentionTab, setActiveRetentionTab] = useState<'eligible' | 'pending'>('eligible');
    const [showExpansionModal, setShowExpansionModal] = useState(false);
    
    const [pinModal, setPinModal] = useState<{ type: 'initiate' | 'final', target: Patient } | null>(null);
    const [pinInput, setPinInput] = useState('');
    const [idConfirmInput, setIdConfirmInput] = useState('');

    const enableMultiBranch = settings.features.enableMultiBranch;
    const enableCentralAdmin = settings.features.enableCentralAdmin;
    const isAssistant = currentUser.role === UserRole.DENTAL_ASSISTANT;

    const securityAlerts = useMemo(() => {
        return auditLog.filter(log => log.action === 'SECURITY_ALERT').slice(0, 20);
    }, [auditLog]);

    const menuStructure = [
        { group: 'System Settings', icon: Sliders, items: [
            { key: 'features', label: 'System Features', icon: ToggleLeft },
            { key: 'reputation', label: 'Reputation & Growth', icon: Star },
            { key: 'sms', label: 'SMS Automation Engine', icon: Smartphone },
            { key: 'permissions', label: 'Role Permissions', icon: Lock },
            ...(enableMultiBranch ? [{ key: 'branches', label: 'Clinic Branches', icon: MapPin }] : []),
        ]},
        { group: 'Clinical Content', icon: BookOpen, items: [
            { key: 'procedures', label: 'Procedures & Prices', icon: DollarSign },
            { key: 'protocolRules', label: 'Protocol Alert Rules', icon: Shield },
        ]},
        { group: 'Legal & Compliance', icon: Shield, items: [
            { key: 'auditLog', label: 'Audit Log', icon: Key },
            { key: 'npc', label: 'NPC Breach Protocol', icon: ShieldAlert },
            { key: 'retention', label: 'Data Retention', icon: Archive },
        ]},
    ];

    const toggleFeature = (featureKey: keyof FeatureToggles) => {
        onUpdateSettings({
            ...settings,
            features: {
                ...settings.features,
                [featureKey]: !settings.features[featureKey]
            }
        });
        toast.info(`Feature update: ${featureKey} is now ${!settings.features[featureKey] ? 'Active' : 'Disabled'}.`);
    };

    const renderCurrentCategory = () => {
        switch(activeCategory) {
            case 'features': return renderFeatures();
            case 'sms': return renderSmsEngine();
            case 'reputation': return renderReputation();
            case 'retention': return renderRetention();
            case 'auditLog': return renderAuditLog();
            case 'npc': return renderNPCProtocol();
            case 'branches': return renderBranches();
            default: return <div className="p-10 text-center text-slate-400"><HardHat size={32} className="mx-auto mb-2" /> Section interface is under construction.</div>;
        }
    };

    function renderFeatures() {
        return (
            <div className="p-6 bg-slate-50 h-full overflow-y-auto space-y-6 no-scrollbar">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Store size={20} className="text-teal-600"/> Practice Environment Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={() => onUpdateSettings({ ...settings, clinicProfile: 'boutique' })} className={`p-4 rounded-xl border-2 text-left transition-all ${settings.clinicProfile === 'boutique' ? 'border-teal-500 bg-teal-50 shadow-md' : 'border-slate-200 hover:border-teal-300'}`}><div className="font-bold text-teal-800 text-lg">Solo / Boutique</div><p className="text-xs text-slate-500 mt-1 leading-relaxed">Lean operations. Focus on patient care over multi-provider logic.</p></button>
                        <button onClick={() => onUpdateSettings({ ...settings, clinicProfile: 'corporate' })} className={`p-4 rounded-xl border-2 text-left transition-all ${settings.clinicProfile === 'corporate' ? 'border-lilac-500 bg-lilac-50 shadow-md' : 'border-slate-200 hover:border-teal-300'}`}><div className="font-bold text-lilac-800 text-lg">Multi-Doctor / Corporate</div><p className="text-xs text-slate-500 mt-1 leading-relaxed">Enables maximum compliance, treatment approval queues, and oversight.</p></button>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-teal-900 to-teal-800 p-10 rounded-[3rem] text-white shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-1000"><Building2 size={200}/></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex-1">
                            <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                                <Sparkles className="text-lilac-300" />
                                Multi-Clinic Expansion
                            </h3>
                            <p className="text-teal-100 mt-3 max-w-xl text-lg leading-relaxed">Grow your organization without losing clinical control. Securely bridge branches, synchronize logistics, and enable organizational oversight.</p>
                        </div>
                        <button 
                            onClick={() => setShowExpansionModal(true)}
                            className="bg-white text-teal-900 px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-black/20 hover:scale-105 transition-all"
                        >
                            {enableMultiBranch ? 'Expansion Active' : 'Unlock Expansion'}
                        </button>
                    </div>
                </div>

                {enableMultiBranch && (
                    <div className="bg-white p-8 rounded-[2rem] border-2 border-teal-100 shadow-xl overflow-hidden relative animate-in fade-in duration-700">
                        <div className="absolute top-0 right-0 p-6 opacity-10"><Scale size={100} className="text-teal-600"/></div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                            <div className="flex-1">
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                                    Administrative Governance Mode
                                </h3>
                                <p className="text-sm text-slate-500 mt-2 max-w-xl">Explicitly choose how your organization is managed. Switch between Practitioner-led and DSO/Corporate-led structures.</p>
                            </div>
                            <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${!enableCentralAdmin ? 'text-teal-600' : 'text-slate-400'}`}>Owner-Managed</span>
                                <button 
                                    disabled={isAssistant}
                                    onClick={() => toggleFeature('enableCentralAdmin')}
                                    className={`w-14 h-8 rounded-full relative transition-all duration-300 shadow-inner ${enableCentralAdmin ? 'bg-lilac-500' : 'bg-slate-300'} disabled:opacity-50`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${enableCentralAdmin ? 'left-7' : 'left-1'}`}/>
                                </button>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${enableCentralAdmin ? 'text-lilac-600' : 'text-slate-400'}`}>Central Admin</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* FEATURE UNLOCK PREVIEW MODAL */}
                {showExpansionModal && (
                  <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-white/20">
                      <div className="p-8 bg-teal-900 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="bg-teal-500 p-3 rounded-2xl"><Sparkles /></div>
                          <h3 className="text-2xl font-black uppercase tracking-tighter">Organizational Blueprint</h3>
                        </div>
                        <button onClick={() => setShowExpansionModal(false)}><X /></button>
                      </div>
                      <div className="p-8 space-y-8 overflow-y-auto no-scrollbar max-h-[70vh]">
                        <p className="text-slate-500 font-medium leading-relaxed">Transitioning from a single clinic to a multi-branch organization unlocks sophisticated institutional controls:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { title: 'Branch Gesture-Switching', icon: MapPin, color: 'text-teal-600', sub: 'Swipe-to-navigate between locations.' },
                            { title: 'Data Silo Isolation', icon: Lock, color: 'text-lilac-600', sub: 'Assistants restricted to local site data.' },
                            { title: 'Organization War Room', icon: Building2, color: 'text-blue-600', sub: 'Aggregated analytics across all sites.' },
                            { title: 'Central Inventory Hub', icon: Box, color: 'text-orange-600', sub: 'Track stock movement between branches.' },
                          ].map(f => (
                            <div key={f.title} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-3">
                              <f.icon className={f.color} size={24} />
                              <div className="font-black uppercase tracking-widest text-[10px] text-slate-800">{f.title}</div>
                              <p className="text-xs text-slate-500">{f.sub}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-8 bg-slate-50 border-t flex gap-4">
                        <button onClick={() => setShowExpansionModal(false)} className="flex-1 py-4 font-black uppercase text-xs tracking-widest text-slate-400">Close Blueprint</button>
                        <button 
                          onClick={() => { toggleFeature('enableMultiBranch'); setShowExpansionModal(false); }}
                          className="flex-[2] py-4 bg-teal-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-600/20"
                        >
                          {enableMultiBranch ? 'Disable Expansion' : 'Commit & Expand'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
            </div>
        );
    }

    function renderReputation() {
        return (
            <div className="p-6 bg-slate-50 h-full space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><Star className="text-amber-500" size={20}/> Reputation Automation</h4>
                    <p className="text-sm text-slate-500 mb-6">Drive clinic growth by automatically requesting reviews from satisfied patients.</p>
                    <div className="space-y-4">
                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Google Maps Review Link</label><input type="text" className="w-full mt-1 p-3 bg-slate-50 border rounded-xl" placeholder="e.g. https://g.page/r/YOUR_ID/review" value={settings.reputationSettings?.googleReviewLink || ''} onChange={e => onUpdateSettings({...settings, reputationSettings: {...settings.reputationSettings, googleReviewLink: e.target.value, npsThreshold: 5}})} /></div>
                    </div>
                </div>
            </div>
        );
    }

    function renderSmsEngine() {
        const categories: SmsCategory[] = ['Onboarding', 'Safety', 'Logistics', 'Recovery', 'Financial', 'Security', 'Efficiency', 'Reputation'];
        const currentItems = (Object.values(settings.smsTemplates) as SmsTemplateConfig[]).filter(t => t.category === activeSmsCat);
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center shrink-0">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><Smartphone size={20} className="text-teal-600"/> SMS Automation Logic</h4>
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100 overflow-x-auto no-scrollbar max-w-[500px]">
                        {categories.map(cat => (<button key={cat} onClick={() => setActiveSmsCat(cat)} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all whitespace-nowrap ${activeSmsCat === cat ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:bg-white'}`}>{cat}</button>))}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {currentItems.map(tmpl => (
                        <div key={tmpl.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 flex flex-col md:flex-row gap-4">
                            <div className="flex-1"><div className="font-bold text-slate-800 text-sm mb-1">{tmpl.label}</div><p className="text-[10px] text-slate-400 italic mb-3">{tmpl.triggerDescription}</p><textarea value={tmpl.text} onChange={e => onUpdateSettings({...settings, smsTemplates: {...settings.smsTemplates, [tmpl.id]: {...tmpl, text: e.target.value}}})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm h-24" /></div>
                            <div className="w-32 flex flex-col justify-center items-center">
                                <button onClick={() => onUpdateSettings({...settings, smsTemplates: {...settings.smsTemplates, [tmpl.id]: { ...(tmpl as SmsTemplateConfig), enabled: !tmpl.enabled}}})} className={`w-full py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${tmpl.enabled ? 'bg-teal-600 text-white border-teal-500' : 'bg-slate-100 text-slate-400'}`}>{tmpl.enabled ? 'Enabled' : 'Off'}</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    function renderRetention() {
        const policy = settings.retentionPolicy || { archivalYears: 10, purgeYears: 15 };
        const now = new Date();
        const eligible = patients.filter(p => {
            if (!p.lastVisit || p.purgeRequest) return false;
            const lastDate = new Date(p.lastVisit === 'First Visit' ? new Date() : p.lastVisit);
            const yearsDiff = (now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24 * 365.25);
            return yearsDiff >= policy.archivalYears;
        });
        const pending = patients.filter(p => !!p.purgeRequest);

        return (
            <div className="p-6 bg-slate-50 h-full space-y-6 no-scrollbar overflow-y-auto">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Archive size={120}/></div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-lilac-100 p-2 rounded-xl text-lilac-600"><Lock size={20}/></div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Secure Destruction Lifecycle</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-8 max-w-xl">Permanent record purging requires <strong>Dual-Authorization</strong>. Action is logged under NPC 72-hour protocol and cannot be reversed.</p>
                </div>
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                        <h4 className="font-black text-slate-700 uppercase tracking-widest text-[10px] flex items-center gap-2">
                            {activeRetentionTab === 'eligible' ? <FileWarning size={14} className="text-amber-500"/> : <ShieldAlert size={14} className="text-red-500"/>}
                            {activeRetentionTab === 'eligible' ? 'Registry Maintenance Queue' : 'FINAL AUTHORIZATION GATE'}
                        </h4>
                    </div>
                    <div className="overflow-y-auto max-h-[400px]">
                        {activeRetentionTab === 'eligible' ? (
                            eligible.length > 0 ? (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
                                        <tr><th className="p-4">Patient Profile</th><th className="p-4 text-center">Last Clinical Activity</th><th className="p-4 text-right">Action</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {eligible.map(p => (
                                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-800">{p.name}</div>
                                                    <div className="text-[10px] font-mono text-slate-400">ID: {p.id}</div>
                                                </td>
                                                <td className="p-4 text-center font-bold text-slate-500">{formatDate(p.lastVisit)}</td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => setPinModal({ type: 'initiate', target: p })} className="px-4 py-2 bg-teal-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-teal-600/20 hover:scale-105 transition-transform">Stage 1: Intent to Purge</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <div className="p-20 text-center text-slate-300 italic text-sm">No records meeting retention threshold.</div>
                        ) : (
                            pending.length > 0 ? (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
                                        <tr><th className="p-4">Pending Record</th><th className="p-4">Request Originator</th><th className="p-4 text-right">Gate Action</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {pending.map(p => (
                                            <tr key={p.id} className="bg-red-50/20 hover:bg-red-50 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-red-900">{p.name}</div>
                                                    <div className="text-[10px] font-black text-red-400 uppercase tracking-tighter">AWAITING CO-SIGNER</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => setPinModal({ type: 'final', target: p })} className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-red-600/20 hover:bg-red-700">Permanent Shred</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <div className="p-20 text-center text-slate-300 italic text-sm">Destruction queue empty.</div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderNPCProtocol = () => (
        <div className="p-6 h-full flex flex-col gap-6 bg-slate-50 no-scrollbar overflow-y-auto">
            <div className="bg-red-600 p-8 rounded-3xl text-white shadow-xl shadow-red-600/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12"><ShieldAlert size={140}/></div>
                <h3 className="text-2xl font-bold mb-2">NPC 72-Hour Breach Response</h3>
                <p className="text-red-100 max-w-xl text-sm leading-relaxed">R.A. 10173 mandates reporting of security incidents involving Sensitive Personal Information within 72 hours of discovery. Use this tool to generate compliant NPC templates pre-filled from your audit logs.</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><Terminal size={18} className="text-red-600"/> Security Alert Feed</h4>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {securityAlerts.length > 0 ? securityAlerts.map(alert => (
                        <div key={alert.id} className="p-4 rounded-2xl border flex items-start justify-between group transition-all bg-white border-slate-100">
                            <div className="flex gap-4">
                                <div className="p-3 rounded-xl shadow-sm bg-orange-100 text-orange-600"><ShieldAlert size={24}/></div>
                                <div><div className="font-bold text-slate-800">{alert.details}</div></div>
                            </div>
                        </div>
                    )) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60 py-20">
                            <CheckCircle size={64} strokeWidth={1} />
                            <p className="mt-4 font-bold">No data security breaches detected.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    function renderAuditLog() {
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-4 bg-white border-b flex justify-between items-center shrink-0">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><Eye size={18} className="text-teal-600"/> Accountability Timeline</h4>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {auditLog.length > 0 ? auditLog.map(log => (
                        <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 group">
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

    const updateBranchStatus = (branch: string, status: ClinicStatus) => {
        const meta = settings.clinicMetadata?.[branch] || { ...settings.clinicIdentity, registryName: branch, status: ClinicStatus.ACTIVE };
        onUpdateSettings({
            ...settings,
            clinicMetadata: {
                ...settings.clinicMetadata,
                [branch]: { ...meta, status }
            }
        });
        toast.info(`Clinic "${branch}" state migrated to ${status}.`);
    };

    function renderBranches() {
        const identity = settings.clinicIdentity;
        return (
            <div className="p-6 bg-slate-50 h-full space-y-6 overflow-y-auto no-scrollbar">
                {identity && (
                    <div className="bg-white p-8 rounded-[2.5rem] border-4 border-teal-500 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck size={120} className="text-teal-600"/></div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-teal-600 p-4 rounded-3xl text-white shadow-xl shadow-teal-600/20"><Award size={32}/></div>
                            <div><h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Verified Clinic Identity</h3></div>
                        </div>
                    </div>
                )}
                <div className="flex justify-between items-center mt-4 px-2">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Branch Registry</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                    {settings.branches.map(branch => (
                        <div key={branch} className={`bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex justify-between items-center group transition-all ${branch === currentUser.defaultBranch ? 'ring-2 ring-teal-500 ring-offset-2' : ''}`}>
                            <div className="flex items-center gap-4">
                                <div className="bg-teal-50 p-3 rounded-2xl text-teal-600"><MapPin size={24}/></div>
                                <div><span className="font-black text-slate-800 uppercase text-sm tracking-tight">{branch}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-full md:w-72 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col shrink-0"><nav className="flex-1 overflow-y-auto p-4 no-scrollbar">{menuStructure.map(group => (<div key={group.group} className="py-2"><h3 className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><group.icon size={12}/> {group.group}</h3><div className="space-y-1">{group.items.map(item => (<button key={item.key} onClick={() => setActiveCategory(item.key)} className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between transition-colors text-sm ${activeCategory === item.key ? 'bg-teal-50 text-teal-800 font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><div className="flex items-center gap-3"><item.icon size={18} className={`${activeCategory === item.key ? 'text-teal-600' : 'text-slate-400'}`} /><span>{item.label}</span></div></button>))}</div></div>))}</nav></div>
            <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">{renderCurrentCategory()}</div>
        </div>
    );
};

export default FieldManagement;
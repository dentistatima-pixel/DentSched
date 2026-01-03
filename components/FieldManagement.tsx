
import React, { useState, useMemo } from 'react';
import { FieldSettings, User, UserRole, RolePermissions, AuditLogEntry, Patient, ClinicalIncident, LeaveRequest, StaffShift, FeatureToggles, SmsTemplateConfig, SmsCategory, SmsTemplates } from '../types';
import { Plus, Trash2, Edit2, Check, X, Sliders, ChevronRight, DollarSign, ToggleLeft, ToggleRight, Box, Calendar, MapPin, User as UserIcon, MessageSquare, Tag, FileText, Heart, Activity, Key, Shield, HardHat, Store, BookOpen, Pill, FileSignature, ClipboardPaste, Lock, Eye, AlertOctagon, Globe, AlertTriangle, Briefcase, Archive, AlertCircle, CheckCircle, DownloadCloud, Database, UploadCloud, Users, Droplet, Wrench, Clock, Plane, CalendarDays, Smartphone, Zap, Star, ShieldAlert, MonitorOff, Terminal, FileWarning, Link, ShieldCheck, Printer, ShieldOff, Receipt, ArrowRightLeft, Scale } from 'lucide-react';
import { useToast } from './ToastSystem';
import { formatDate, PDA_FORBIDDEN_COMMERCIAL_TERMS } from '../constants';
import { jsPDF } from 'jspdf';
import CryptoJS from 'crypto-js';

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
  auditLogVerified?: boolean | null;
  encryptionKey?: string | null; 
}

const FieldManagement: React.FC<FieldManagementProps> = ({ settings, onUpdateSettings, staff = [], onUpdateStaff, auditLog, patients = [], onPurgePatient, onExportAuditLog, incidents = [], auditLogVerified, encryptionKey }) => {
    const toast = useToast();
    const [activeCategory, setActiveCategory] = useState<string>('features');
    const [activeSmsCat, setActiveSmsCat] = useState<SmsCategory>('Onboarding');
    
    // Dignity Validation logic for clinic name
    const isClinicNameDignified = useMemo(() => {
        if (!settings.clinicName) return true;
        return !PDA_FORBIDDEN_COMMERCIAL_TERMS.some(word => settings.clinicName.toLowerCase().includes(word));
    }, [settings.clinicName]);

    const menuStructure = [
        { group: 'System Settings', icon: Sliders, items: [
            { key: 'features', label: 'Governance Features', icon: ToggleLeft },
            { key: 'reputation', label: 'Reputation & Growth', icon: Star },
            { key: 'sms', label: 'SMS Automation Engine', icon: Smartphone },
            { key: 'permissions', label: 'Role Permissions', icon: Lock },
            { key: 'branches', label: 'Clinic Branches', icon: MapPin },
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

    const generateBulkEndorsementExport = () => {
        // PDA Rule 13 compliance
        toast.info("Compiling Practice Transfer Portfolio...");
        const doc = new jsPDF();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text("PRACTICE TRANSFER ENDORSEMENT", 105, 30, { align: 'center' });
        doc.setFontSize(10);
        doc.text("VERIFIED CLINICAL RECORD COMPENDIUM (PDA RULE 13)", 105, 38, { align: 'center' });
        
        let y = 60;
        patients.slice(0, 10).forEach(p => {
            if (y > 270) { doc.addPage(); y = 30; }
            doc.setFont('helvetica', 'bold');
            doc.text(`${p.name} (ID: ${p.id})`, 20, y);
            y += 6;
            doc.setFont('helvetica', 'normal');
            doc.text(`Last Visit: ${formatDate(p.lastVisit)} | Balance: ${p.currentBalance}`, 25, y);
            y += 10;
        });

        doc.save(`PracticeTransfer_Portfolio_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success("Bulk Endorsement Portfolio generated.");
    };

    const generateForensicCSV = () => {
        if (auditLog.length === 0) {
            toast.error("Audit log is empty.");
            return;
        }

        const headers = ["ID", "Timestamp", "VerifiedTime", "UserID", "UserName", "Action", "Entity", "EntityID", "Details", "Hash", "PreviousHash"];
        const rows = auditLog.map(l => [
            l.id, l.timestamp, l.isVerifiedTimestamp ? "YES" : "NO", l.userId, l.userName, l.action, l.entity, l.entityId, `"${l.details.replace(/"/g, '""')}"`, l.hash || "", l.previousHash || ""
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        let finalData = csvContent;
        let fileExt = 'csv';

        if (encryptionKey) {
            finalData = CryptoJS.AES.encrypt(csvContent, encryptionKey).toString();
            fileExt = 'forensic';
        }

        const blob = new Blob([finalData], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `DENTSCHED_FORENSIC_AUDIT_${new Date().toISOString().split('T')[0]}.${fileExt}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        onUpdateSettings({ ...settings, lastHardExportDate: new Date().toISOString() });
        toast.success(`Forensic archive exported successfully.`);
    };

    const renderCurrentCategory = () => {
        switch(activeCategory) {
            case 'features': return renderFeatures();
            case 'sms': return renderSmsEngine();
            case 'reputation': return renderReputation();
            case 'retention': return renderRetention();
            case 'auditLog': return renderAuditLog();
            case 'npc': return renderNPCProtocol();
            case 'procedures': return renderProcedures();
            default: return <div className="p-10 text-center text-slate-400"><HardHat size={32} className="mx-auto mb-2" /> Section under construction.</div>;
        }
    };

    function renderSmsEngine() {
        const smsCategories: SmsCategory[] = ['Onboarding', 'Safety', 'Logistics', 'Recovery', 'Financial', 'Security', 'Efficiency', 'Reputation'];
        // Fix: Explicitly cast to SmsTemplateConfig[] to resolve 'unknown' property access errors
        const currentTemplates = (Object.values(settings.smsTemplates) as SmsTemplateConfig[]).filter(t => t.category === activeSmsCat);

        const validateSmsText = (text: string) => {
            const lowerText = text.toLowerCase();
            const foundForbidden = PDA_FORBIDDEN_COMMERCIAL_TERMS.filter(word => lowerText.includes(word));
            return { isCompliant: foundForbidden.length === 0, violations: foundForbidden };
        };

        const handleUpdateSms = (id: string, text: string) => {
            const { isCompliant } = validateSmsText(text);
            const updated = { ...settings.smsTemplates, [id]: { ...settings.smsTemplates[id], text, isPdaCompliant: isCompliant } };
            onUpdateSettings({ ...settings, smsTemplates: updated });
        };

        return (
            <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                <div className="p-6 border-b bg-white shrink-0">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-teal-100 p-2 rounded-xl text-teal-700"><Smartphone size={24}/></div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight">SMS Professionalism Filter</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">PDA Rule 15 & 16 Automated Governance</p>
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {smsCategories.map(cat => (
                            <button key={cat} onClick={() => setActiveSmsCat(cat)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeSmsCat === cat ? 'bg-teal-600 text-white border-teal-500 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-white'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {currentTemplates.map(template => {
                        const { isCompliant, violations } = validateSmsText(template.text);
                        return (
                            <div key={template.id} className={`bg-white p-6 rounded-[2rem] border-2 shadow-sm transition-all ${!isCompliant ? 'border-red-200 ring-4 ring-red-500/5' : 'border-slate-100'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${isCompliant ? 'bg-teal-50 text-teal-600' : 'bg-red-100 text-red-600 animate-pulse'}`}>
                                            {isCompliant ? <ShieldCheck size={20}/> : <ShieldAlert size={20}/>}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">{template.label}</h4>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">{template.triggerDescription}</p>
                                        </div>
                                    </div>
                                    {!isCompliant && (
                                        <div className="bg-red-600 text-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter">PDA RULE 15 VIOLATION</div>
                                    )}
                                </div>
                                
                                <div className="relative">
                                    <textarea 
                                        value={template.text} 
                                        onChange={e => handleUpdateSms(template.id, e.target.value)}
                                        className={`w-full p-4 rounded-2xl text-xs font-bold leading-relaxed outline-none transition-all h-24 ${isCompliant ? 'bg-slate-50 border border-slate-100 focus:border-teal-500' : 'bg-red-50 border-2 border-red-200 focus:border-red-500'}`}
                                    />
                                    {!isCompliant && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="text-[9px] font-black text-red-600 uppercase tracking-widest py-1">Flagged Commercial Terms:</span>
                                            {violations.map(v => (
                                                <span key={v} className="bg-red-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase">{v}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => onUpdateSettings({ ...settings, smsTemplates: { ...settings.smsTemplates, [template.id]: { ...template, enabled: !template.enabled } } })}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${template.enabled ? 'bg-teal-600' : 'bg-slate-300'}`}
                                        >
                                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${template.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </button>
                                        <span className="text-[9px] font-black text-slate-400 uppercase">Automation: {template.enabled ? 'Live' : 'Paused'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Zap size={10} className="text-teal-400"/>
                                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Compliant delivery route active</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    function renderProcedures() {
        return (
            <div className="p-6 bg-slate-50 h-full overflow-y-auto space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-teal-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-teal-100 p-2 rounded-xl text-teal-700"><FileText size={20}/></div>
                            <h3 className="font-bold text-slate-800 uppercase tracking-tight">Clinical Governance</h3>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${settings.features.enableMaterialTraceability ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <ShieldCheck size={18} className="text-teal-600"/>
                                    <span className="font-black text-teal-900 uppercase text-xs">Enforce Material Traceability</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase">Forces selection of an inventory batch number for restorative and surgical procedures to protect against product liability claims.</p>
                            </div>
                            <div className="shrink-0">
                                <button 
                                    onClick={() => onUpdateSettings({ ...settings, features: { ...settings.features, enableMaterialTraceability: !settings.features.enableMaterialTraceability } })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.features.enableMaterialTraceability ? 'bg-teal-600' : 'bg-slate-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.features.enableMaterialTraceability ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        );
    }

    function renderFeatures() {
        return (
            <div className="p-6 bg-slate-50 h-full overflow-y-auto space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Store size={20} className="text-teal-600"/> Practice Identity</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="label">Official Clinic Name (PDA Rule 15)</label>
                            <input 
                                type="text" 
                                value={settings.clinicName || ''} 
                                onChange={e => onUpdateSettings({...settings, clinicName: e.target.value})} 
                                className={`input ${!isClinicNameDignified ? 'border-red-400 bg-red-50' : ''}`}
                                placeholder="e.g. Ivory Dental Office"
                            />
                            {!isClinicNameDignified && (
                                <p className="text-[10px] text-red-600 font-black uppercase mt-2 flex items-center gap-1"><AlertTriangle size={10}/> Non-Compliant Name Detected: Avoid commercial solicitation patterns (PDA Rule 15).</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Receipt size={20} className="text-lilac-600"/> Dual-Track Modular Controls</h3>
                    <div className="space-y-4">
                        <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${settings.features.enableStatutoryBirTrack ? 'bg-lilac-50 border-lilac-500 shadow-md' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex-1">
                                <span className="font-black text-lilac-900 uppercase text-xs">Enable BIR Statutory Track</span>
                                <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase">Adds a regulatory layer to Financials for matching Official Receipts to bank deposits.</p>
                            </div>
                            <button 
                                onClick={() => onUpdateSettings({ ...settings, features: { ...settings.features, enableStatutoryBirTrack: !settings.features.enableStatutoryBirTrack } })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.features.enableStatutoryBirTrack ? 'bg-lilac-600' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.features.enableStatutoryBirTrack ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </label>
                        <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${settings.features.enableHmoInsuranceTrack ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex-1">
                                <span className="font-black text-teal-900 uppercase text-xs">Enable HMO & Insurance Track</span>
                                <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase">Activates PhilHealth and HMO modules. Disable if practice is strictly Private-Pay.</p>
                            </div>
                            <button 
                                onClick={() => onUpdateSettings({ ...settings, features: { ...settings.features, enableHmoInsuranceTrack: !settings.features.enableHmoInsuranceTrack } })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.features.enableHmoInsuranceTrack ? 'bg-teal-600' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.features.enableHmoInsuranceTrack ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </label>
                    </div>
                </div>
            </div>
        );
    }

    function renderAuditLog() {
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-4 bg-white border-b flex justify-between items-center shrink-0">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><Eye size={18} className="text-teal-600"/> Practice Oversight</h4>
                    <div className="flex gap-2">
                        <button onClick={generateBulkEndorsementExport} className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all"><ArrowRightLeft size={14} className="text-teal-400"/> Bulk Endorsement (Rule 13)</button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {auditLog.slice(0, 100).map(log => (
                        <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
                            <div className="p-2 bg-slate-100 text-slate-400 rounded-lg shrink-0"><Key size={16}/></div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-bold text-slate-800">{log.userName} executed {log.action}</span>
                                    <span className="block text-[10px] font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-xs mt-1 text-slate-500 italic">{log.details}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-6 bg-white border-t border-slate-200">
                    <button onClick={generateForensicCSV} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-3">
                        <DownloadCloud size={18} className="text-teal-400"/> Hard Audit Archive Export
                    </button>
                </div>
            </div>
        );
    }

    function renderRetention() {
        return (
            <div className="p-6 bg-slate-50 h-full space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Record Lifecycle Policy</h3>
                    <p className="text-sm text-slate-500 mb-6">System enforces 10-year retention (PRC/DOH mandate) before allowing permanent data subject erasure.</p>
                </div>
            </div>
        );
    }

    function renderReputation() { return <div className="p-6 bg-slate-50 h-full">Marketing settings locked.</div>; }
    function renderNPCProtocol() { return <div className="p-6 bg-slate-50 h-full">Breach protocol active.</div>; }

    return (
        <div className="flex flex-col md:flex-row h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-full md:w-72 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col shrink-0"><nav className="flex-1 overflow-y-auto p-2">{menuStructure.map(group => (<div key={group.group} className="py-2"><h3 className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><group.icon size={12}/> {group.group}</h3><div className="space-y-1">{group.items.map(item => (<button key={item.key} onClick={() => setActiveCategory(item.key)} className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between transition-colors text-sm ${activeCategory === item.key ? 'bg-teal-50 text-teal-800 font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><div className="flex items-center gap-3"><item.icon size={16} className={`${activeCategory === item.key ? 'text-teal-600' : 'text-slate-400'}`} /><span>{item.label}</span></div></button>))}</div></div>))}</nav></div>
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">{renderCurrentCategory()}</div>
        </div>
    );
};

export default FieldManagement;

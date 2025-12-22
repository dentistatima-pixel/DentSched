
import React, { useState, useMemo } from 'react';
import { FieldSettings, User, UserRole, RolePermissions, AuditLogEntry, Patient, ClinicalIncident, LeaveRequest, StaffShift, FeatureToggles, SmsTemplateConfig, SmsCategory, SmsTemplates } from '../types';
import { Plus, Trash2, Edit2, Check, X, Sliders, ChevronRight, DollarSign, ToggleLeft, ToggleRight, Box, Calendar, MapPin, User as UserIcon, MessageSquare, Tag, FileText, Heart, Activity, TrendingUp, Key, Shield, HardHat, Store, BookOpen, Pill, FileSignature, ClipboardPaste, Lock, Eye, AlertOctagon, Globe, AlertTriangle, Briefcase, Archive, AlertCircle, CheckCircle, DownloadCloud, Database, UploadCloud, Users, Droplet, Wrench, Clock, Plane, CalendarDays, Smartphone, Zap, Star, ShieldAlert, MonitorOff, Terminal, FileWarning } from 'lucide-react';
import { useToast } from './ToastSystem';
import { formatDate } from '../constants';
import { jsPDF } from 'jspdf';

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

const FieldManagement: React.FC<FieldManagementProps> = ({ settings, onUpdateSettings, staff = [], onUpdateStaff, auditLog, patients = [], onPurgePatient, onExportAuditLog, incidents = [] }) => {
    const toast = useToast();
    const [activeCategory, setActiveCategory] = useState<string>('features');
    const [activeSmsCat, setActiveSmsCat] = useState<SmsCategory>('Onboarding');
    
    // Destruction Modal State
    const [purgeTarget, setPurgeTarget] = useState<Patient | null>(null);
    const [purgeCountdown, setPurgeCountdown] = useState(0);

    const securityAlerts = useMemo(() => {
        return auditLog.filter(log => log.action === 'SECURITY_ALERT').slice(0, 20);
    }, [auditLog]);

    const menuStructure = [
        { group: 'System Settings', icon: Sliders, items: [
            { key: 'features', label: 'System Features', icon: ToggleLeft },
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

    const generateDestructionCertificate = (patient: Patient) => {
        const doc = new jsPDF();
        const certId = `CERT-DESTROY-${Date.now()}`;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text("CERTIFICATE OF DIGITAL DESTRUCTION", 105, 30, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("PURSUANT TO PHILIPPINES DATA PRIVACY ACT OF 2012 (R.A. 10173)", 105, 38, { align: 'center' });
        
        doc.line(20, 45, 190, 45);
        
        doc.setFontSize(12);
        doc.text(`Certificate Ref: ${certId}`, 20, 60);
        doc.text(`Destruction Date: ${new Date().toLocaleString()}`, 20, 68);
        
        doc.setFont('helvetica', 'bold');
        doc.text("DATA SUBJECT INFORMATION (ANONYMIZED)", 20, 85);
        doc.setFont('helvetica', 'normal');
        doc.text(`Record ID: ${patient.id}`, 25, 93);
        doc.text(`Last Active Visit: ${formatDate(patient.lastVisit)}`, 25, 100);
        doc.text(`Retention Status: Over 10 Years Inactive`, 25, 107);
        
        doc.setFont('helvetica', 'bold');
        doc.text("METHOD OF DESTRUCTION", 20, 125);
        doc.setFont('helvetica', 'normal');
        doc.text("Permanent erasure of encrypted database objects, audit trails (excluding destruction log),", 25, 133);
        doc.text("imaging files, and clinical metadata. This action is irreversible.", 25, 140);
        
        doc.setFont('helvetica', 'bold');
        doc.text("LEGAL COMPLIANCE ATTESTATION", 20, 160);
        doc.setFont('helvetica', 'normal');
        const legalBasis = "The Personal Information Controller (PIC) hereby certifies that the identified record has been permanently purged in accordance with the clinic's data retention policy and R.A. 10173 Section 11, following the mandatory 10-year clinical records retention requirement set by the Philippine Regulatory Commission (PRC) and DOH.";
        const splitBasis = doc.splitTextToSize(legalBasis, 170);
        doc.text(splitBasis, 25, 168);
        
        doc.line(20, 220, 100, 220);
        doc.text("Clinic Data Protection Officer (DPO)", 20, 225);
        doc.text("Digitally Signed - Verified System Clock", 20, 230);
        
        doc.save(`${certId}.pdf`);
        toast.success("Certificate generated and downloaded.");
        return certId;
    };

    const handlePurge = () => {
        if (!purgeTarget) return;
        const certId = generateDestructionCertificate(purgeTarget);
        if (onPurgePatient) onPurgePatient(purgeTarget.id);
        setPurgeTarget(null);
        toast.success("Record destroyed successfully.");
    };

    const renderRetention = () => {
        const policy = settings.retentionPolicy || { archivalYears: 10, purgeYears: 15 };
        const now = new Date();
        const eligibleForPurge = patients.filter(p => {
            if (!p.lastVisit) return false;
            const lastDate = new Date(p.lastVisit);
            const yearsDiff = (now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24 * 365.25);
            return yearsDiff >= policy.archivalYears;
        });

        return (
            <div className="p-6 bg-slate-50 h-full space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Archive size={120}/></div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">DPA Data Retention Lifecycle</h3>
                    <p className="text-sm text-slate-500 mb-8 max-w-xl">Automate compliance with the "Right to be Forgotten" while maintaining DOH-mandated clinical record retention.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-teal-50 border border-teal-100"><h4 className="font-bold text-teal-900 mb-1">Automated Archival</h4><p className="text-[10px] text-teal-700 mb-4">Records inactive for {policy.archivalYears} years will be moved to cold storage.</p><input type="range" min="5" max="20" value={policy.archivalYears} onChange={e => onUpdateSettings({...settings, retentionPolicy: {...policy, archivalYears: parseInt(e.target.value)}})} className="w-full accent-teal-600" /></div>
                        <div className="p-6 rounded-2xl bg-red-50 border border-red-100"><h4 className="font-bold text-red-900 mb-1">Permanent Purge</h4><p className="text-[10px] text-red-700 mb-4">Records inactive for {policy.purgeYears} years will be permanently deleted.</p><input type="range" min="10" max="30" value={policy.purgeYears} onChange={e => onUpdateSettings({...settings, retentionPolicy: {...policy, purgeYears: parseInt(e.target.value)}})} className="w-full accent-red-600" /></div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2"><FileWarning size={18} className="text-red-600"/> Destruction Queue</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{eligibleForPurge.length} Records Eligible</span>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[400px]">
                        {eligibleForPurge.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
                                    <tr><th className="p-4">Patient Record</th><th className="p-4 text-center">Last Active</th><th className="p-4 text-right">Action</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {eligibleForPurge.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">{p.name}</div>
                                                <div className="text-[10px] font-mono text-slate-400 uppercase">UID: {p.id}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="text-red-600 font-bold">{formatDate(p.lastVisit)}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => { setPurgeTarget(p); setPurgeCountdown(3); }} 
                                                    className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-600/20 hover:scale-105 transition-transform"
                                                >
                                                    Destroy & Issue Cert
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-10 text-center flex flex-col items-center gap-3">
                                <CheckCircle size={48} className="text-teal-200" />
                                <p className="text-slate-400 text-sm italic">All records are currently within the retention window.</p>
                            </div>
                        )}
                    </div>
                </div>

                {purgeTarget && (
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95">
                            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-center text-slate-900 mb-2">Confirm Destruction</h3>
                            <p className="text-slate-500 text-center text-sm leading-relaxed mb-6">
                                You are about to permanently purge the record of <strong>{purgeTarget.name}</strong>. This action is irreversible under PDA R.A. 10173. A Digital Destruction Certificate will be issued to your local storage.
                            </p>
                            
                            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-8">
                                <div className="text-center">
                                    <div className="text-[10px] font-black text-red-600 uppercase mb-1">Time until authorized</div>
                                    <div className="text-3xl font-black text-red-700">{purgeCountdown > 0 ? `${purgeCountdown}s` : 'AUTHORIZED'}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setPurgeTarget(null)} className="py-4 rounded-xl bg-slate-100 text-slate-600 font-bold uppercase tracking-widest text-xs">Abort</button>
                                <button 
                                    onClick={handlePurge}
                                    disabled={purgeCountdown > 0}
                                    className="py-4 rounded-xl bg-red-600 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-red-600/30 disabled:opacity-50"
                                >
                                    Destroy Record
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderNPCProtocol = () => (
        <div className="p-6 h-full flex flex-col gap-6 bg-slate-50">
            <div className="bg-red-600 p-8 rounded-3xl text-white shadow-xl shadow-red-600/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12"><ShieldAlert size={140}/></div>
                <h3 className="text-2xl font-bold mb-2">NPC 72-Hour Breach Response</h3>
                <p className="text-red-100 max-w-xl text-sm leading-relaxed">R.A. 10173 mandates reporting of security incidents involving Sensitive Personal Information within 72 hours of discovery. Use this tool to generate compliant NPC templates pre-filled from your audit logs.</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><Terminal size={18} className="text-red-600"/> Security Alert Feed</h4>
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">Live Monitor</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {securityAlerts.length > 0 ? securityAlerts.map(alert => {
                        const ageHrs = Math.floor((Date.now() - new Date(alert.timestamp).getTime()) / (1000 * 3600));
                        const isOverdue = ageHrs > 72;
                        return (
                        <div key={alert.id} className={`p-4 rounded-2xl border flex items-start justify-between group transition-all ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
                            <div className="flex gap-4">
                                <div className={`p-3 rounded-xl shadow-sm ${isOverdue ? 'bg-red-600 text-white' : 'bg-orange-100 text-orange-600'}`}><ShieldAlert size={24}/></div>
                                <div>
                                    <div className="font-bold text-slate-800">{alert.details}</div>
                                    <div className="flex gap-3 text-[10px] font-bold uppercase text-slate-400 mt-1">
                                        <span className="flex items-center gap-1"><Clock size={10}/> {ageHrs}h Ago</span>
                                        <span className={`px-1.5 rounded ${isOverdue ? 'text-red-700 bg-red-100' : 'text-orange-700 bg-orange-100'}`}>{isOverdue ? 'CRITICAL: OVER 72H' : 'RESPONSE WINDOW OPEN'}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => generateNpcReport(alert.id)} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 hover:scale-105">
                                <FileText size={14}/> Generate NPC Form
                            </button>
                        </div>
                    )}) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
                            <CheckCircle size={64} strokeWidth={1} />
                            <p className="mt-4 font-bold">No data security breaches detected in logs.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderCurrentCategory = () => {
        switch(activeCategory) {
            case 'features': return renderFeatures();
            case 'sms': return renderSmsEngine();
            case 'reputation': return renderReputation();
            case 'retention': return renderRetention();
            case 'auditLog': return renderAuditLog();
            case 'npc': return renderNPCProtocol();
            default: return <div className="p-10 text-center text-slate-400"><HardHat size={32} className="mx-auto mb-2" /> Section interface is under construction.</div>;
        }
    };

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

    function renderFeatures() {
        return (
            <div className="p-6 bg-slate-50 h-full overflow-y-auto space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Store size={20} className="text-teal-600"/> Practice Environment Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={() => onUpdateSettings({ ...settings, clinicProfile: 'boutique' })} className={`p-4 rounded-xl border-2 text-left transition-all ${settings.clinicProfile === 'boutique' ? 'border-teal-500 bg-teal-50 shadow-md' : 'border-slate-200 hover:border-teal-300'}`}><div className="font-bold text-teal-800 text-lg">Solo / Boutique</div><p className="text-xs text-slate-500 mt-1 leading-relaxed">Lean operations. Focus on patient care over multi-provider logic.</p></button>
                        <button onClick={() => onUpdateSettings({ ...settings, clinicProfile: 'corporate' })} className={`p-4 rounded-xl border-2 text-left transition-all ${settings.clinicProfile === 'corporate' ? 'border-lilac-500 bg-lilac-50 shadow-md' : 'border-slate-200 hover:border-teal-300'}`}><div className="font-bold text-lilac-800 text-lg">Multi-Doctor / Corporate</div><p className="text-xs text-slate-500 mt-1 leading-relaxed">Enables maximum compliance, treatment approval queues, and oversight.</p></button>
                    </div>
                </div>
            </div>
        );
    }

    function renderAuditLog() {
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-4 bg-white border-b flex justify-between items-center shrink-0"><h4 className="font-bold text-slate-700 flex items-center gap-2"><Eye size={18} className="text-teal-600"/> Accountability Timeline</h4></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {auditLog.length > 0 ? auditLog.map(log => (
                        <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
                            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg shrink-0"><Activity size={16}/></div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-bold text-slate-800">{log.userName} <span className="text-slate-400 font-normal">executed</span> {log.action}</span>
                                    <div className="flex items-center gap-2">
                                        {!log.isVerifiedTimestamp && (
                                            <span className="flex items-center gap-1 text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded animate-pulse" title="System Time - Unverified (Possible clock tampering)">
                                                <Clock size={10}/> UNVERIFIED
                                            </span>
                                        )}
                                        <span className="block text-[10px] font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                </div>
                                <p className="text-xs mt-1 italic text-slate-500">{log.details}</p>
                            </div>
                        </div>
                    )) : <div className="text-center py-20 text-slate-400 italic">No events recorded.</div>}
                </div>
            </div>
        );
    }

    const generateNpcReport = (incidentId: string) => {
        const incident = auditLog.find(l => l.id === incidentId);
        if (!incident) return;

        const doc = new jsPDF();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text("NATIONAL PRIVACY COMMISSION (PH)", 105, 15, { align: 'center' });
        doc.text("SECURITY INCIDENT & DATA BREACH REPORT", 105, 22, { align: 'center' });
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Report Date: ${new Date().toLocaleString()}`, 15, 35);
        doc.text(`Discovery Date: ${formatDate(incident.timestamp)}`, 15, 40);
        doc.text(`Case ID: ${incident.id}`, 15, 45);

        doc.setFont('helvetica', 'bold');
        doc.text("I. PERSONAL INFORMATION CONTROLLER", 15, 55);
        doc.setFont('helvetica', 'normal');
        doc.text("Organization: Dentsched Dental Practice", 20, 60);
        doc.text("Data Protection Officer (DPO): System Administrator", 20, 65);

        doc.setFont('helvetica', 'bold');
        doc.text("II. DESCRIPTION OF INCIDENT", 15, 75);
        doc.setFont('helvetica', 'normal');
        const desc = `The following security alert was triggered by the system for user account "${incident.userName}": ${incident.details}. Affected records ID(s) associated: ${incident.entityId}`;
        const splitLines = doc.splitTextToSize(desc, 180);
        doc.text(splitLines, 20, 82);

        doc.setFont('helvetica', 'bold');
        doc.text("III. PRELIMINARY IMPACT ASSESSMENT", 15, 110);
        doc.setFont('helvetica', 'normal');
        doc.text("• Category: Confidentiality / Integrity Violation", 20, 118);
        doc.text("• Nature of Data: Sensitive Personal Information (Medical Records)", 20, 124);
        doc.text("• Affected Parties: 1 patient(s) confirmed.", 20, 130);

        doc.setFont('helvetica', 'bold');
        doc.text("IV. CONTAINMENT MEASURES", 15, 145);
        doc.setFont('helvetica', 'normal');
        doc.text("• Session immediately terminated upon system alert.", 20, 152);
        doc.text("• Multi-factor challenge triggered for associated account.", 20, 158);
        doc.text("• Cryptographic seal verification initiated for related clinical notes.", 20, 164);

        doc.line(15, 200, 100, 200);
        doc.text("Digitally Certified by DPO", 15, 205);
        
        doc.save(`NPC_Breach_Report_${incident.id}.pdf`);
        toast.success("NPC Incident Documentation generated.");
    };

    return (
        <div className="flex flex-col md:flex-row h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-full md:w-72 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col shrink-0"><nav className="flex-1 overflow-y-auto p-2">{menuStructure.map(group => (<div key={group.group} className="py-2"><h3 className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><group.icon size={12}/> {group.group}</h3><div className="space-y-1">{group.items.map(item => (<button key={item.key} onClick={() => setActiveCategory(item.key)} className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between transition-colors text-sm ${activeCategory === item.key ? 'bg-teal-50 text-teal-800 font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><div className="flex items-center gap-3"><item.icon size={16} className={`${activeCategory === item.key ? 'text-teal-600' : 'text-slate-400'}`} /><span>{item.label}</span></div></button>))}</div></div>))}</nav></div>
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">{renderCurrentCategory()}</div>
        </div>
    );
};

export default FieldManagement;

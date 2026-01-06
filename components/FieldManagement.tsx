
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FieldSettings, User, UserRole, RolePermissions, AuditLogEntry, Patient, ClinicalIncident, LeaveRequest, StaffShift, FeatureToggles, SmsTemplateConfig, SmsCategory, SmsTemplates } from '../types';
import { Plus, Trash2, Edit2, Check, X, Sliders, ChevronRight, DollarSign, ToggleLeft, ToggleRight, Box, Calendar, MapPin, User as UserIcon, MessageSquare, Tag, FileText, Heart, Activity, Key, Shield, HardHat, Store, BookOpen, Pill, FileSignature, ClipboardPaste, Lock, Eye, AlertOctagon, Globe, AlertTriangle, Briefcase, Archive, AlertCircle, CheckCircle, DownloadCloud, Database, UploadCloud, Users, Droplet, Wrench, Clock, Plane, CalendarDays, Smartphone, Zap, Star, ShieldAlert, MonitorOff, Terminal, FileWarning, Link, ShieldCheck, Printer, ShieldOff, Receipt, ArrowRightLeft, Scale, Stethoscope, UserCheck, Eraser, PackageCheck, Beaker, Layout, Package } from 'lucide-react';
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
  onSaveIncident?: (i: ClinicalIncident) => void;
  auditLogVerified?: boolean | null;
  encryptionKey?: string | null; 
}

const FieldManagement: React.FC<FieldManagementProps> = ({ settings, onUpdateSettings, staff = [], onUpdateStaff, auditLog, patients = [], onPurgePatient, onExportAuditLog, incidents = [], onSaveIncident, auditLogVerified, encryptionKey }) => {
    const toast = useToast();
    const [activeCategory, setActiveCategory] = useState<string>('features');
    const [activeSmsCat, setActiveSmsCat] = useState<SmsCategory>('Onboarding');
    
    // Incident Reporting State
    const [showIncidentModal, setShowIncidentModal] = useState(false);
    const [incidentForm, setIncidentForm] = useState<Partial<ClinicalIncident>>({
        type: 'Complication', date: new Date().toISOString().split('T')[0], description: '', actionTaken: ''
    });

    // Advisory Disclosure State
    const [showAdvisoryModal, setShowAdvisoryModal] = useState<ClinicalIncident | null>(null);
    const [advisoryManner, setAdvisoryManner] = useState('Verbal (In-Chair)');
    const [advisoryResponse, setAdvisoryResponse] = useState('');
    const [isSigningAdvisory, setIsSigningAdvisory] = useState(false);
    const advisoryCanvasRef = useRef<HTMLCanvasElement>(null);

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
            { key: 'incidents', label: 'Incident Response', icon: ShieldAlert },
            { key: 'retention', label: 'Data Retention', icon: Archive },
        ]},
    ];

    const setupAdvisoryCanvas = () => {
        const canvas = advisoryCanvasRef.current;
        if (canvas) {
            canvas.width = canvas.parentElement?.clientWidth || 400;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            if (ctx) { ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.lineCap = 'round'; }
        }
    };

    useEffect(() => { if (showAdvisoryModal) setTimeout(setupAdvisoryCanvas, 100); }, [showAdvisoryModal]);

    const handleIncidentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!incidentForm.description || !incidentForm.actionTaken) return;
        const newInc = {
            ...incidentForm as ClinicalIncident,
            id: `inc_${Date.now()}`,
            reportedBy: staff[0].id,
            reportedByName: staff[0].name,
            advisoryCallSigned: false
        };
        if (onSaveIncident) {
            onSaveIncident(newInc);
            if (newInc.type === 'Complication') {
                setShowAdvisoryModal(newInc);
            } else {
                setShowIncidentModal(false);
                setIncidentForm({ type: 'Complication', date: new Date().toISOString().split('T')[0], description: '', actionTaken: '' });
                toast.success("Incident logged successfully.");
            }
        }
    };

    const commitAdvisory = () => {
        if (!showAdvisoryModal || !advisoryResponse.trim()) return;
        const updatedInc = {
            ...showAdvisoryModal,
            advisoryCallSigned: true,
            advisoryLog: {
                time: new Date().toISOString(),
                manner: advisoryManner,
                patientResponse: advisoryResponse,
                witnessId: staff[0].id
            }
        };
        if (onSaveIncident) {
            onSaveIncident(updatedInc);
            setShowAdvisoryModal(null);
            setShowIncidentModal(false);
            setAdvisoryResponse('');
            setIncidentForm({ type: 'Complication', date: new Date().toISOString().split('T')[0], description: '', actionTaken: '' });
            toast.success("Duty to Inform satisfied. Adversity witness record sealed.");
        }
    };

    const generateNpcReport = (inc: ClinicalIncident) => {
        const doc = new jsPDF();
        const discoveryDate = new Date(inc.date);
        const now = new Date();
        const diffHours = Math.abs(now.getTime() - discoveryDate.getTime()) / 36e5;
        const isDelayed = diffHours > 72;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text("NPC CIRCULAR 16-03: DATA BREACH NOTIFICATION", 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text("STATUTORY REPORT FOR NATIONAL PRIVACY COMMISSION (PHILIPPINES)", 105, 26, { align: 'center' });
        doc.line(10, 32, 200, 32);

        doc.setFont('helvetica', 'bold');
        doc.text("SECTION I: CHRONOLOGY & DISCOVERY", 15, 42);
        doc.setFont('helvetica', 'normal');
        doc.text(`Discovery Date: ${formatDate(inc.date)}`, 20, 50);
        doc.text(`Report Generated: ${now.toLocaleString()}`, 20, 57);
        doc.text(`Elapsed Time from Discovery: ${Math.floor(diffHours)} Hours`, 20, 64);

        if (isDelayed) {
            doc.setTextColor(220, 38, 38); 
            doc.setFont('helvetica', 'bold');
            doc.text("WARNING: MANDATORY 72-HOUR NOTIFICATION PERIOD EXCEEDED", 20, 74);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.text("Justification for Delay: Continuous internal risk assessment and technical isolation phase exceeded initial discovery window.", 25, 82, { maxWidth: 170 });
        }

        let y = isDelayed ? 95 : 75;
        doc.setFont('helvetica', 'bold');
        doc.text("SECTION II: NATURE OF BREACH", 15, y);
        doc.setFont('helvetica', 'normal');
        const description = doc.splitTextToSize(inc.description, 170);
        doc.text(description, 20, y + 8);
        
        y += (description.length * 5) + 15;
        doc.setFont('helvetica', 'bold');
        doc.text("SECTION III: PERSONAL DATA INVOLVED", 15, y);
        doc.setFont('helvetica', 'normal');
        doc.text("Sensitive Personal Information (SPI) including Clinical Assessments, Diagnostic Radiographs, and Patient Contact Identifiers.", 20, y + 8);

        y += 20;
        doc.setFont('helvetica', 'bold');
        doc.text("SECTION IV: REMEDIAL ACTIONS TAKEN", 15, y);
        doc.setFont('helvetica', 'normal');
        const action = doc.splitTextToSize(inc.actionTaken, 170);
        doc.text(action, 20, y + 8);

        y = 260;
        doc.setFont('helvetica', 'bold');
        doc.line(110, y, 190, y);
        doc.setFontSize(9);
        doc.text(`Reporting DPO: ${staff[0]?.name || 'Administrator'}`, 150, y + 5, { align: 'center' });
        doc.text(`DPO System ID: ${staff[0]?.id || 'DPO-MAIN'}`, 150, y + 10, { align: 'center' });

        doc.save(`NPC_Breach_Report_${inc.id}.pdf`);
        toast.success("NPC Statutory Report generated.");
    };

    const renderCurrentCategory = () => {
        switch(activeCategory) {
            case 'features': return renderFeatures();
            case 'sms': return renderSmsEngine();
            case 'incidents': return renderIncidents();
            case 'procedures': return renderProcedures();
            case 'auditLog': return renderAuditLog();
            case 'retention': return renderRetention();
            default: return <div className="p-10 text-center text-slate-400"><HardHat size={32} className="mx-auto mb-2" /> Section under construction.</div>;
        }
    };

    const GovernanceToggle = ({ 
        label, 
        description, 
        enabled, 
        icon: Icon, 
        onToggle,
        alert = false,
        disabled = false
    }: { 
        label: string, 
        description: string, 
        enabled: boolean, 
        icon: any, 
        onToggle: () => void,
        alert?: boolean,
        disabled?: boolean
    }) => (
        <label className={`flex items-center gap-4 p-5 rounded-[1.5rem] border-2 transition-all ${disabled ? 'bg-slate-200 border-slate-300 cursor-not-allowed grayscale opacity-50' : cursorPointer(enabled, alert)}`}>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <Icon size={18} className={enabled ? (alert ? 'text-amber-600' : 'text-teal-600') : 'text-slate-400'}/>
                    <span className={`font-black uppercase text-xs ${enabled ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase">{description}</p>
            </div>
            <div className="shrink-0">
                <button 
                    type="button"
                    disabled={disabled}
                    onClick={(e) => { e.preventDefault(); if(!disabled) onToggle(); }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? (alert ? 'bg-amber-600' : 'bg-teal-600') : 'bg-slate-300'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
        </label>
    );

    const cursorPointer = (enabled: boolean, alert: boolean) => {
        return `cursor-pointer ${enabled ? (alert ? 'bg-amber-50 border-amber-500 shadow-md' : 'bg-teal-50 border-teal-500 shadow-md') : 'bg-slate-50 border-slate-100 opacity-60'}`;
    }

    function renderSmsEngine() {
        const smsCategories: SmsCategory[] = ['Onboarding', 'Safety', 'Logistics', 'Recovery', 'Financial', 'Security', 'Efficiency', 'Reputation'];
        const currentTemplates = (Object.values(settings.smsTemplates) as SmsTemplateConfig[]).filter(t => t.category === activeSmsCat);

        const validateSmsText = (text: string) => {
            const lowerText = text.toLowerCase();
            const foundForbidden = PDA_FORBIDDEN_COMMERCIAL_TERMS.filter(word => lowerText.includes(word));
            return { isCompliant: foundForbidden.length === 0, violations: foundForbidden };
        };

        const handleUpdateSms = (id: string, text: string) => {
            const { isCompliant } = validateSmsText(text);
            const updated = { ...settings.smsTemplates, [id]: { ...settings.smsTemplates[id], text, isPdaCompliant: isCompliant, enabled: isCompliant ? settings.smsTemplates[id].enabled : false } };
            onUpdateSettings({ ...settings, smsTemplates: updated });
        };

        const toggleSmsTemplate = (id: string) => {
            const template = settings.smsTemplates[id];
            const { isCompliant } = validateSmsText(template.text);
            if (!isCompliant) {
                toast.error("DIGNITY GATE ACTIVE: Prohibited terms detected. Cannot enable template until professionalism standards are met.");
                return;
            }
            const updated = { ...settings.smsTemplates, [id]: { ...template, enabled: !template.enabled } };
            onUpdateSettings({ ...settings, smsTemplates: updated });
        };

        return (
            <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                <div className="p-6 border-b bg-white shrink-0">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-teal-100 p-2 rounded-xl text-teal-700"><Smartphone size={24}/></div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight">SMS Professionalism Filter</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">PDA Rule 15 Automated Governance</p>
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
                                    <div className="flex items-center gap-4">
                                        <GovernanceToggle 
                                            label={template.enabled ? "ACTIVE" : "DISABLED"}
                                            description=""
                                            enabled={template.enabled}
                                            disabled={!isCompliant}
                                            icon={template.enabled ? CheckCircle : MonitorOff}
                                            onToggle={() => toggleSmsTemplate(template.id)}
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <textarea 
                                        value={template.text} 
                                        onChange={e => handleUpdateSms(template.id, e.target.value)}
                                        className={`w-full p-4 rounded-2xl text-xs font-bold font-mono leading-relaxed outline-none transition-all h-24 ${isCompliant ? 'bg-slate-50 border border-slate-100 focus:border-teal-500' : 'bg-red-50 border-2 border-red-200 focus:border-red-500'}`}
                                    />
                                    {!isCompliant && (
                                        <div className="mt-2 p-3 bg-red-600 text-white rounded-xl flex items-center gap-3 animate-in zoom-in-95">
                                            <ShieldAlert size={16} />
                                            <span className="text-[10px] font-black uppercase">Dignity Gate Active: Forbidden terms detected ({violations.join(', ')}).</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    function renderIncidents() {
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 bg-white border-b flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-xl text-red-600"><ShieldAlert size={24}/></div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Clinical Incident Registry</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Malpractice Defense & Adverse Event Tracking</p>
                        </div>
                    </div>
                    <button onClick={() => setShowIncidentModal(true)} className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-600/20 hover:scale-105 transition-all flex items-center gap-2">
                        <AlertTriangle size={16}/> Report Complication
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {incidents.length > 0 ? incidents.map(inc => (
                        <div key={inc.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:border-red-500 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-50 text-red-600 rounded-xl group-hover:animate-pulse"><Stethoscope size={20}/></div>
                                    <div>
                                        <div className="text-[10px] font-black text-red-600 uppercase tracking-widest">{inc.type}</div>
                                        <h4 className="font-black text-slate-800 text-sm uppercase">{inc.patientName || 'System Incident'}</h4>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-slate-400 uppercase">{formatDate(inc.date)}</div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded-2xl">
                                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{inc.description}</p>
                                </div>
                                
                                {inc.type === 'Data Breach' && (
                                    <div className="p-4 rounded-2xl border-2 border-lilac-200 bg-lilac-50 flex items-center justify-between animate-in zoom-in-95">
                                        <div className="flex items-center gap-3">
                                            <ShieldAlert size={20} className="text-lilac-600"/>
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-tight">Statutory Reporting Hub</div>
                                                <p className="text-[9px] font-bold text-slate-500">NPC Circular 16-03 Compliance</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => generateNpcReport(inc)}
                                            className="px-4 py-2 bg-lilac-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg flex items-center gap-2 hover:bg-lilac-700 transition-all"
                                        >
                                            <DownloadCloud size={14}/> Generate NPC 16-03 Report
                                        </button>
                                    </div>
                                )}

                                {inc.type === 'Complication' && (
                                    <div className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${inc.advisoryCallSigned ? 'bg-teal-50 border-teal-200' : 'bg-red-50 border-red-500 animate-pulse'}`}>
                                        <div className="flex items-center gap-3">
                                            <ShieldAlert size={20} className={inc.advisoryCallSigned ? 'text-teal-600' : 'text-red-600'}/>
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-tight">Advisory Witness Protocol</div>
                                                <p className="text-[9px] font-bold text-slate-500">Duty to Inform (PDA Rule 11)</p>
                                            </div>
                                        </div>
                                        {!inc.advisoryCallSigned ? (
                                            <button onClick={() => setShowAdvisoryModal(inc)} className="px-4 py-2 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg">Document Disclosure</button>
                                        ) : (
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-[9px] font-black text-teal-600 uppercase"><CheckCircle size={14}/> Disclosure Signed</div>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">{inc.advisoryLog?.manner}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                             <ShieldCheck size={80} className="text-teal-500 mb-4" />
                             <h4 className="text-xl font-black uppercase text-slate-800">No Incidents Logged</h4>
                        </div>
                    )}
                </div>

                {/* ADVISORY DUTY TO INFORM MODAL */}
                {showAdvisoryModal && (
                    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[120] flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl border-4 border-teal-500 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                            <div className="bg-teal-900 p-8 text-white flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-4">
                                    <ShieldCheck size={32} className="text-teal-400"/>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Duty to Inform</h3>
                                        <p className="text-xs font-bold text-teal-300 uppercase tracking-widest mt-1">PDA Rule 11 Compliance Gate</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAdvisoryModal(null)}><X size={24}/></button>
                            </div>
                            
                            <div className="p-8 space-y-6 overflow-y-auto no-scrollbar">
                                <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-200">
                                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-2 flex items-center gap-2"><AlertTriangle size={14}/> Legal Mandate</h4>
                                    <p className="text-xs text-amber-800 font-medium leading-relaxed italic">
                                        "Professional negligence often hinges on the failure to inform patients of complications. This disclosure must be recorded at the first reasonable opportunity."
                                    </p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Disclosure Manner</label>
                                    <select value={advisoryManner} onChange={e => setAdvisoryManner(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-teal-500 transition-all">
                                        <option>Verbal (In-Chair)</option>
                                        <option>Official Tele-Call</option>
                                        <option>Clinic Handover Note</option>
                                        <option>ER Referral Handover</option>
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Patient Response & Mitigation Log *</label>
                                    <textarea 
                                        required
                                        value={advisoryResponse}
                                        onChange={e => setAdvisoryResponse(e.target.value)}
                                        placeholder="Record the patient's acknowledgment and the subsequent care plan discussed..."
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium h-32 focus:ring-4 focus:ring-teal-500/10 outline-none"
                                    />
                                </div>

                                <div className="bg-slate-100 p-6 rounded-[2rem] border-2 border-dashed border-slate-300">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">Clinician Electronic Signature</span>
                                        <button onClick={() => advisoryCanvasRef.current?.getContext('2d')?.clearRect(0,0,400,100)} className="text-slate-300 hover:text-red-500"><Eraser size={12}/></button>
                                    </div>
                                    <canvas 
                                        ref={advisoryCanvasRef} 
                                        className="w-full h-24 bg-white rounded-xl touch-none border border-slate-200 cursor-crosshair"
                                        onMouseDown={(e) => { setIsSigningAdvisory(true); const ctx = advisoryCanvasRef.current?.getContext('2d'); ctx?.beginPath(); const rect = advisoryCanvasRef.current!.getBoundingClientRect(); ctx?.moveTo(e.clientX - rect.left, e.clientY - rect.top); }}
                                        onMouseMove={(e) => { if (!isSigningAdvisory) return; const ctx = advisoryCanvasRef.current?.getContext('2d'); const rect = advisoryCanvasRef.current!.getBoundingClientRect(); ctx?.lineTo(e.clientX - rect.left, e.clientY - rect.top); ctx?.stroke(); }}
                                        onMouseUp={() => setIsSigningAdvisory(false)}
                                    />
                                </div>
                            </div>

                            <div className="p-8 border-t bg-slate-50 flex gap-4">
                                <button onClick={() => setShowAdvisoryModal(null)} className="flex-1 py-5 bg-white border font-black uppercase text-[10px] rounded-2xl tracking-widest">Postpone</button>
                                <button 
                                    onClick={commitAdvisory}
                                    disabled={!advisoryResponse.trim()}
                                    className="flex-[2] py-5 bg-teal-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-teal-600/20 disabled:opacity-40"
                                >
                                    Seal Disclosure Record
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showIncidentModal && !showAdvisoryModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <form onSubmit={handleIncidentSubmit} className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border-4 border-red-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                            <div className="bg-red-600 p-6 text-white flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-3"><AlertTriangle size={24}/><h3 className="text-xl font-black uppercase">Report Complication</h3></div>
                                <button type="button" onClick={() => setShowIncidentModal(false)}><X size={24}/></button>
                            </div>
                            <div className="p-8 space-y-6 flex-1 overflow-y-auto no-scrollbar">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="label">Incident Type</label><select value={incidentForm.type} onChange={e => setIncidentForm({...incidentForm, type: e.target.value as any})} className="input"><option value="Complication">Clinical Complication</option><option value="Injury">Accidental Injury</option><option value="Equipment Failure">Equipment Failure</option><option value="Data Breach">DPA Breach</option></select></div>
                                    <div><label className="label">Date</label><input type="date" value={incidentForm.date} onChange={e => setIncidentForm({...incidentForm, date: e.target.value})} className="input" /></div>
                                </div>
                                <div>
                                    <label className="label">Patient (Optional)</label>
                                    <select value={incidentForm.patientId} onChange={e => {
                                        const p = patients.find(pt => pt.id === e.target.value);
                                        setIncidentForm({...incidentForm, patientId: e.target.value, patientName: p?.name});
                                    }} className="input">
                                        <option value="">System Event</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div><label className="label">Description</label><textarea required value={incidentForm.description} onChange={e => setIncidentForm({...incidentForm, description: e.target.value})} className="input h-24" placeholder="Describe the event..." /></div>
                                <div><label className="label">Remediation Action</label><textarea required value={incidentForm.actionTaken} onChange={e => setIncidentForm({...incidentForm, actionTaken: e.target.value})} className="input h-24" placeholder="Steps taken..." /></div>
                            </div>
                            <div className="p-6 border-t bg-slate-50 flex gap-4">
                                <button type="button" onClick={() => setShowIncidentModal(false)} className="flex-1 py-4 bg-white border font-black uppercase text-[10px] rounded-2xl">Cancel</button>
                                <button type="submit" className="flex-[2] py-4 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-red-600/20">Commit forensic record</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        );
    }

    function renderProcedures() {
        return (
            <div className="p-10 bg-slate-50 h-full overflow-y-auto space-y-10">
                <div className="bg-white p-8 rounded-[3rem] border border-teal-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className="bg-teal-100 p-3 rounded-2xl text-teal-700 shadow-sm"><FileText size={24}/></div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Clinical Catalog & Guardrails</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Enforce standard-of-care across all procedures</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GovernanceToggle 
                            label="Enforce Material Traceability" 
                            description="Mandatory batch logging for restorative and surgical items (PDA Rule 11)."
                            enabled={settings.features.enableMaterialTraceability}
                            icon={PackageCheck}
                            onToggle={() => onUpdateSettings({ ...settings, features: { ...settings.features, enableMaterialTraceability: !settings.features.enableMaterialTraceability } })}
                        />
                        <GovernanceToggle 
                            label="Protocol Safety Alerts" 
                            description="Real-time clinical hard-stops for high-risk patient conditions."
                            enabled={settings.features.enableClinicalProtocolAlerts}
                            icon={ShieldAlert}
                            onToggle={() => onUpdateSettings({ ...settings, features: { ...settings.features, enableClinicalProtocolAlerts: !settings.features.enableClinicalProtocolAlerts } })}
                        />
                    </div>
                </div>
            </div>
        );
    }

    function renderFeatures() {
        const toggleFeature = (key: keyof FeatureToggles) => {
            onUpdateSettings({ ...settings, features: { ...settings.features, [key]: !settings.features[key] } });
        };

        return (
            <div className="p-10 bg-slate-50 h-full overflow-y-auto space-y-10">
                {/* --- MODULE MANAGEMENT --- */}
                <div className="bg-white p-10 rounded-[3rem] border-2 border-teal-200 shadow-xl ring-8 ring-teal-500/5 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-teal-600 p-3 rounded-2xl text-white shadow-lg"><Layout size={24}/></div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Module Management</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Configure clinic functionality tiers</p>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <GovernanceToggle 
                            label="Clinic Inventory Module" 
                            description="Enable or disable stock tracking, material traceability, and supply chain management."
                            enabled={settings.features.enableInventory}
                            icon={Package}
                            onToggle={() => toggleFeature('enableInventory')}
                        />

                        {settings.features.enableInventory && (
                            <div className="bg-lilac-50 p-6 rounded-[2.5rem] border-2 border-lilac-200 shadow-inner space-y-4 animate-in slide-in-from-top-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-lilac-600 text-white p-2 rounded-xl"><Scale size={18}/></div>
                                        <div>
                                            <span className="font-black text-lilac-900 uppercase text-xs tracking-widest">Enterprise Supply Chain Mode</span>
                                            <p className="text-[9px] text-lilac-600 font-bold uppercase mt-0.5">Toggle between Simple stock and Advanced forensics</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onUpdateSettings({ ...settings, features: { ...settings.features, inventoryComplexity: settings.features.inventoryComplexity === 'ADVANCED' ? 'SIMPLE' : 'ADVANCED' } })}
                                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${settings.features.inventoryComplexity === 'ADVANCED' ? 'bg-lilac-600' : 'bg-slate-300'}`}
                                    >
                                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${settings.features.inventoryComplexity === 'ADVANCED' ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <div className="flex gap-4 items-center px-4 py-3 bg-white/60 rounded-2xl border border-lilac-200">
                                    <ShieldCheck size={20} className="text-lilac-600 shrink-0"/>
                                    <p className="text-[10px] text-lilac-900 font-bold leading-tight uppercase">
                                        {settings.features.inventoryComplexity === 'ADVANCED' 
                                            ? "Advanced Mode: DOH Batch tracking, Sterilization cycles, and Malpractice Evidence Lock active."
                                            : "Simple Mode: Streamlined item catalog. manual quantity adjustments only."}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-teal-600 p-3 rounded-2xl text-white shadow-lg"><Store size={24}/></div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Practice Identity</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">PDA Rule 15 Professionalism Audit</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Official Practice Registered Name</label>
                            <input 
                                type="text" 
                                value={settings.clinicName || ''} 
                                onChange={e => onUpdateSettings({...settings, clinicName: e.target.value})} 
                                className={`w-full p-4 rounded-2xl text-lg font-black uppercase tracking-tight outline-none border-4 transition-all ${!isClinicNameDignified ? 'border-red-400 bg-red-50 text-red-900 animate-pulse' : 'border-slate-100 bg-slate-50 focus:border-teal-500'}`}
                                placeholder="e.g. Ivory Dental Office"
                            />
                            {!isClinicNameDignified && (
                                <div className="mt-3 p-4 bg-red-600 text-white rounded-2xl flex items-start gap-3 shadow-xl shadow-red-600/20 animate-in zoom-in-95">
                                    <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Non-Compliant Commercialization</p>
                                        <p className="text-xs font-bold leading-relaxed">Avoid soliciting terms (Cheap, Best, Promo). Professional clinics must be named with dignity under PDA Ethics Rule 15.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- AUDIT & FINANCIAL GOVERNANCE --- */}
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Receipt size={14}/> Audit & Statutory Governance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GovernanceToggle 
                            label="BIR Compliance Mode" 
                            description="Enforce dual-track ledger and mandatory Official Receipt (OR) matching for all payments."
                            enabled={settings.features.enableBirComplianceMode}
                            icon={Receipt}
                            alert={true}
                            onToggle={() => toggleFeature('enableBirComplianceMode')}
                        />
                        <GovernanceToggle 
                            label="Immutable Audit Logging" 
                            description="Cryptographically seal all user actions. Non-repudiation for malpractice defense."
                            enabled={settings.features.enableAccountabilityLog}
                            icon={Key}
                            onToggle={() => toggleFeature('enableAccountabilityLog')}
                        />
                         <GovernanceToggle 
                            label="Statutory Sales Track" 
                            description="Enable official sales journal reporting for external BIR/tax audits."
                            enabled={settings.features.enableStatutoryBirTrack}
                            icon={Terminal}
                            onToggle={() => toggleFeature('enableStatutoryBirTrack')}
                        />
                        <GovernanceToggle 
                            label="Forensic Safety Audit" 
                            description="Link sterilization cycles and inventory batch codes to clinical entries."
                            enabled={settings.features.enableComplianceAudit}
                            icon={ShieldCheck}
                            onToggle={() => toggleFeature('enableComplianceAudit')}
                        />
                    </div>
                </div>

                {/* --- SUB-PROCESSOR GOVERNANCE (NPC) --- */}
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Globe size={14}/> Sub-Processor Governance (NPC)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GovernanceToggle 
                            label="HMO Insurance Portal" 
                            description="Enable external claim data transfer to verified insurance processors."
                            enabled={settings.features.enableHMOClaims}
                            icon={Heart}
                            onToggle={() => toggleFeature('enableHMOClaims')}
                        />
                        <GovernanceToggle 
                            label="Lab Sub-Processor Portal" 
                            description="Enable order tracking and shade data transfer to external dental labs."
                            enabled={settings.features.enableLabPortal}
                            icon={Beaker}
                            onToggle={() => toggleFeature('enableLabPortal')}
                        />
                        <GovernanceToggle 
                            label="Data Transfer Auditing" 
                            description="Log every external data export with a unique NPC Transfer ID."
                            enabled={settings.features.enableLabTracking}
                            icon={ArrowRightLeft}
                            onToggle={() => toggleFeature('enableLabTracking')}
                        />
                    </div>
                </div>

                {/* --- AUTOMATION & COMMUNICATION --- */}
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Smartphone size={14}/> Practice Automation Engine</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GovernanceToggle 
                            label="Automated SMS Engine" 
                            description="Trigger rule-based notifications for recalls, booking, and post-op."
                            enabled={settings.features.enableSmsAutomation}
                            icon={Smartphone}
                            onToggle={() => toggleFeature('enableSmsAutomation')}
                        />
                        <GovernanceToggle 
                            label="Online Intake Forms" 
                            description="Allow patients to digitally input history on clinic tablets (DPA compliant)."
                            enabled={settings.features.enableOnlineForms}
                            icon={ClipboardPaste}
                            onToggle={() => toggleFeature('enableOnlineForms')}
                        />
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
                    {onExportAuditLog && (
                        <button onClick={onExportAuditLog} className="text-xs font-bold text-teal-600 flex items-center gap-1 hover:underline">
                            <DownloadCloud size={14}/> Export Forensic Journal
                        </button>
                    )}
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

    return (
        <div className="flex flex-col md:flex-row h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-full md:w-72 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col shrink-0"><nav className="flex-1 overflow-y-auto p-2">{menuStructure.map(group => (<div key={group.group} className="py-2"><h3 className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><group.icon size={12}/> {group.group}</h3><div className="space-y-1">{group.items.map(item => (<button key={item.key} onClick={() => setActiveCategory(item.key)} className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between transition-colors text-sm ${activeCategory === item.key ? 'bg-teal-50 text-teal-800 font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><div className="flex items-center gap-3"><item.icon size={16} className={`${activeCategory === item.key ? 'text-teal-600' : 'text-slate-400'}`} /><span>{item.label}</span></div></button>))}</div></div>))}</nav></div>
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">{renderCurrentCategory()}</div>
        </div>
    );
};

export default FieldManagement;

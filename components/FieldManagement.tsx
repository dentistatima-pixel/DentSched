
import React, { useState, useMemo } from 'react';
import { FieldSettings, ProcedureItem, FeatureToggles, User, SmsTemplates, OfficialReceiptBooklet, ClinicProfile, Medication, ConsentFormTemplate, ClinicalNoteTemplate, ClinicalProtocolRule, UserRole, RolePermissions, AuditLogEntry, Vendor, Patient, ClinicalIncident, WasteLogEntry, AssetMaintenanceEntry, AmendmentRequest, RadiationSafetyLog, SecurityIncident, DataAccessRequest } from '../types';
// Added Package to lucide-react imports
import { Plus, Trash2, Edit2, Check, X, Sliders, ChevronRight, DollarSign, ToggleLeft, ToggleRight, Box, Calendar, MapPin, User as UserIcon, MessageSquare, Tag, FileText, Heart, Activity, TrendingUp, Key, Shield, HardHat, Store, BookOpen, Pill, FileSignature, ClipboardPaste, Lock, Eye, AlertOctagon, Globe, AlertTriangle, Briefcase, Archive, AlertCircle, CheckCircle, DownloadCloud, Database, UploadCloud, Users, Droplet, Wrench, Radio, PenSquare, ShieldAlert, Monitor, UserCheck, ShieldOff, Inbox, CheckCircle2, Package } from 'lucide-react';
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
  onAddIncident?: (inc: Partial<ClinicalIncident>) => void;
  wasteLogs?: WasteLogEntry[]; 
  onAddWasteLog?: (log: Partial<WasteLogEntry>) => void;
  assetLogs?: AssetMaintenanceEntry[]; 
  onAddAssetLog?: (log: Partial<AssetMaintenanceEntry>) => void;
  amendmentRequests?: AmendmentRequest[];
  onActionAmendment?: (id: string, action: 'Approved' | 'Rejected') => void;
  radiationLogs?: RadiationSafetyLog[];
  onAddRadiationLog?: (log: Partial<RadiationSafetyLog>) => void;
  securityIncidents?: SecurityIncident[];
  onAddSecurityIncident?: (inc: Partial<SecurityIncident>) => void;
  accessRequests?: DataAccessRequest[]; // NEW NPC DSAR
  onFulfillAccess?: (id: string) => void; // NEW NPC DSAR
}

const DEFAULT_PERMISSIONS: Record<UserRole, RolePermissions> = {
    [UserRole.ADMIN]: { canVoidNotes: true, canEditFinancials: true, canDeletePatients: true, canOverrideProtocols: true, canManageInventory: true },
    [UserRole.DENTIST]: { canVoidNotes: true, canEditFinancials: false, canDeletePatients: false, canOverrideProtocols: true, canManageInventory: false },
    [UserRole.DENTAL_ASSISTANT]: { canVoidNotes: false, canEditFinancials: false, canDeletePatients: false, canOverrideProtocols: false, canManageInventory: true }
};

const FieldManagement: React.FC<FieldManagementProps> = ({ settings, onUpdateSettings, staff = [], onUpdateStaff, auditLog, patients = [], onPurgePatient, onExportAuditLog, incidents = [], onAddIncident, wasteLogs = [], onAddWasteLog, assetLogs = [], onAddAssetLog, amendmentRequests = [], onActionAmendment, radiationLogs = [], onAddRadiationLog, securityIncidents = [], onAddSecurityIncident, accessRequests = [], onFulfillAccess }) => {
    const toast = useToast();
    const [activeCategory, setActiveCategory] = useState<string>('features');

    const [showRadiationForm, setShowRadiationForm] = useState(false);
    const [showBreachForm, setShowBreachForm] = useState(false);
    const [showWasteForm, setShowWasteForm] = useState(false);

    const menuStructure = [
        { group: 'System Settings', icon: Sliders, items: [
            { key: 'features', label: 'System Features', icon: ToggleLeft },
            { key: 'permissions', label: 'Role Permissions', icon: Lock },
            { key: 'branches', label: 'Clinic Branches', icon: MapPin },
            { key: 'receipts', label: 'BIR Receipt Booklets', icon: FileText },
            { key: 'finance', label: 'Finance & Tax Rules', icon: DollarSign },
        ]},
        { group: 'Clinical Content & Protocols', icon: BookOpen, items: [
            { key: 'procedures', label: 'Procedures & Prices', icon: DollarSign },
            { key: 'medications', label: 'Medication Formulary', icon: Pill },
            { key: 'consentForms', label: 'Consent Form Templates', icon: FileSignature },
            { key: 'protocolRules', label: 'Protocol Alert Rules', icon: Shield },
            { key: 'incidents', label: 'Clinical Incident Registry', icon: AlertOctagon }, 
            { key: 'radiation', label: 'Radiation Safety Log', icon: Radio }, 
        ]},
        { group: 'Data Lists', icon: Tag, items: [
            { key: 'insuranceProviders', label: 'Insurance Providers', icon: Heart },
            { key: 'medicalConditions', label: 'Medical Conditions', icon: Activity },
        ]},
        { group: 'Legal & Compliance', icon: Shield, items: [
            { key: 'dpoDashboard', label: 'DPO Central Queue', icon: ShieldAlert },
            { key: 'breachResponse', label: 'Security Incident Manager', icon: ShieldOff }, 
            { key: 'amendments', label: 'Amendment Requests', icon: PenSquare },
            { key: 'staffHealth', label: 'Institutional Health Summary', icon: UserCheck },
            { key: 'auditLog', label: 'Audit Log', icon: Key },
            { key: 'credentials', label: 'Credential Expiry Monitor', icon: CheckCircle }, 
            { key: 'vatSummary', label: 'BIR Senior/PWD VAT Summary', icon: TrendingUp }, 
            { key: 'wasteLogs', label: 'Bio-Medical Waste Log', icon: Droplet }, 
            { key: 'assetLogs', label: 'Asset Maintenance Registry', icon: Wrench }, 
            { key: 'vendors', label: 'Vendor Compliance', icon: Briefcase },
            { key: 'retention', label: 'Data Retention & Disposal', icon: Archive },
            { key: 'database', label: 'Database & Security', icon: Database }, 
        ]},
    ];

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
            case 'finance': return renderFinanceRules();
            case 'procedures': return renderProcedures();
            case 'amendments': return renderAmendments();
            case 'dpoDashboard': return renderDPODashboard();
            case 'staffHealth': return renderStaffHealthSummary();
            case 'radiation': return renderRadiationSafety();
            case 'breachResponse': return renderBreachResponse();
            default: return <div className="p-10 text-center text-slate-400"><HardHat size={32} className="mx-auto mb-2" /> Interface for this section is under construction.</div>;
        }
    };

    function renderRadiationSafety() {
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-slate-700 flex items-center gap-2"><Radio size={20} className="text-teal-600"/> Radiation Protection Log</h4>
                        <p className="text-xs text-slate-500 mt-1">DOH Bureau of Health Devices & Tech (BHDT) mandatory records for Lead Aprons and X-Ray Calibration.</p>
                    </div>
                    <button onClick={() => setShowRadiationForm(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md"><Plus size={14}/> Log Check</button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-tighter">
                            <tr><th className="p-4">Date</th><th className="p-4">Equipment</th><th className="p-4">Check Type</th><th className="p-4">Result</th><th className="p-4">Inspector</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {radiationLogs?.length ? radiationLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono text-slate-400">{formatDate(log.date)}</td>
                                    <td className="p-4 font-bold text-slate-800">{log.assetName}</td>
                                    <td className="p-4">{log.type}</td>
                                    <td className="p-4"><span className={`px-2 py-0.5 rounded font-bold ${log.result === 'Pass' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>{log.result}</span></td>
                                    <td className="p-4">{log.inspector}</td>
                                </tr>
                            )) : <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">No radiation checks logged. Required for DOH LTO compliance.</td></tr>}
                        </tbody>
                    </table>
                </div>
                {showRadiationForm && <RadiationSafetyModal onSave={(log) => { onAddRadiationLog?.(log); setShowRadiationForm(false); }} onClose={() => setShowRadiationForm(false)} />}
            </div>
        );
    }

    function renderBreachResponse() {
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-slate-700 flex items-center gap-2"><ShieldOff size={20} className="text-red-600"/> NPC Data Breach Registry</h4>
                        <p className="text-xs text-slate-500 mt-1">NPC Circular 16-03 Compliance. All security incidents must be logged and reported within 72 hours if affecting sensitive data.</p>
                    </div>
                    <button onClick={() => setShowBreachForm(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md"><AlertCircle size={14}/> Report Incident</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {securityIncidents?.length ? securityIncidents.map(inc => (
                        <div key={inc.id} className="bg-white p-5 rounded-2xl border border-red-200 shadow-sm border-l-4 border-l-red-600">
                             <div className="flex justify-between items-start mb-3">
                                <h5 className="font-bold text-red-900">{inc.nature}</h5>
                                <span className="text-[10px] font-mono text-slate-400">{formatDate(inc.timestamp)}</span>
                             </div>
                             <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                                 <div><span className="block text-slate-400 uppercase font-bold text-[9px]">Data Affected</span><p className="text-slate-800">{inc.dataInvolved}</p></div>
                                 <div><span className="block text-slate-400 uppercase font-bold text-[9px]">Subjects Affected</span><p className="text-slate-800 font-bold">{inc.personsAffected} Individuals</p></div>
                             </div>
                             <div className="bg-slate-50 p-4 rounded-xl">
                                <span className="block text-slate-400 uppercase font-bold text-[9px] mb-1">Containment & Remediation</span>
                                <p className="text-xs text-slate-700 italic">"{inc.remediationSteps}"</p>
                             </div>
                        </div>
                    )) : <div className="text-center py-20 text-slate-400 italic">No security incidents recorded. (Maintain Zero-Breach target)</div>}
                </div>
                {showBreachForm && <BreachResponseModal onSave={(log) => { onAddSecurityIncident?.(log); setShowBreachForm(false); }} onClose={() => setShowBreachForm(false)} />}
            </div>
        );
    }

    function renderDPODashboard() {
        const suspendedPatients = patients.filter(p => p.processingStatus === 'Suspended');
        const pendingAmendments = amendmentRequests?.filter(r => r.status === 'Pending') || [];
        const pendingAccess = accessRequests?.filter(r => r.status === 'Pending') || [];

        return (
            <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100"><h5 className="text-[10px] font-bold text-red-400 uppercase">Suspended Records</h5><p className="text-3xl font-bold text-red-900">{suspendedPatients.length}</p></div>
                    <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100"><h5 className="text-[10px] font-bold text-yellow-400 uppercase">Pending Rectifications</h5><p className="text-3xl font-bold text-yellow-900">{pendingAmendments.length}</p></div>
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100"><h5 className="text-[10px] font-bold text-blue-400 uppercase">DSAR Access Req.</h5><p className="text-3xl font-bold text-blue-900">{pendingAccess.length}</p></div>
                    <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100"><h5 className="text-[10px] font-bold text-teal-400 uppercase">Fulfiment Rate</h5><p className="text-3xl font-bold text-teal-900">100%</p></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-sm flex items-center gap-2"><Inbox size={16}/> NPC DSAR Fulfillment Queue</div>
                        <div className="flex-1 overflow-y-auto max-h-[400px] divide-y">
                            {pendingAccess.map(req => (
                                <div key={req.id} className="p-4 flex justify-between items-center group hover:bg-blue-50">
                                    <div><div className="font-bold text-slate-800">{req.patientName}</div><div className="text-[10px] text-slate-400 font-mono">REQUEST TYPE: {req.type.toUpperCase()} • {formatDate(req.requestDate)}</div></div>
                                    <button onClick={() => onFulfillAccess?.(req.id)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-md hover:bg-blue-700 transition-all flex items-center gap-1"><CheckCircle2 size={12}/> Fulfill & Log</button>
                                </div>
                            ))}
                            {pendingAccess.length === 0 && <div className="p-8 text-center text-slate-400 italic text-xs">No pending data access requests.</div>}
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-sm flex items-center gap-2"><Shield size={16}/> Active DPA Suspensions</div>
                        <div className="flex-1 overflow-y-auto max-h-[400px] divide-y">
                            {suspendedPatients.map(p => (
                                <div key={p.id} className="p-4 flex justify-between items-center group hover:bg-red-50">
                                    <div><div className="font-bold text-slate-800">{p.name}</div><div className="text-[10px] text-slate-400 font-mono">DPA PROCESSING LOCK ACTIVE</div></div>
                                    <button onClick={() => setActiveCategory('features')} className="text-[10px] font-bold text-red-600 hover:underline">Revoke</button>
                                </div>
                            ))}
                            {suspendedPatients.length === 0 && <div className="p-8 text-center text-slate-400 italic text-xs">No records currently suspended.</div>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function renderStaffHealthSummary() {
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><UserCheck size={20} className="text-teal-600"/> Institutional Health Summary (DOH Compliance)</h4>
                    <p className="text-xs text-slate-500 mt-1">Audit staff immunization coverage and Professional Certification validity (BLS/Infection Control/RSO).</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-widest"><tr className="divide-x"><th className="p-4">Staff Member</th><th className="p-4">Hepatitis B</th><th className="p-4">BLS Cert</th><th className="p-4">Inf. Control</th><th className="p-4">RSO</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {staff.map(s => {
                                    const imm = s.immunizations || [];
                                    const hasHepB = imm.some(i => i.type.includes('Hepatitis'));
                                    const certs = s.certifications || [];
                                    const hasBLS = certs.some(c => c.type === 'BLS' && new Date(c.expiry) > new Date());
                                    const hasIC = certs.some(c => c.type === 'Infection Control' && new Date(c.expiry) > new Date());
                                    const hasRSO = certs.some(c => c.type === 'Radiation Safety' && new Date(c.expiry) > new Date());
                                    
                                    const Cell = ({val}: {val: boolean}) => (
                                        <td className="p-4 text-center">
                                            {val ? <CheckCircle size={16} className="text-green-500 mx-auto"/> : <AlertCircle size={16} className="text-red-400 mx-auto opacity-50"/>}
                                        </td>
                                    );

                                    return (
                                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 flex items-center gap-3"><img src={s.avatar} className="w-6 h-6 rounded-full"/><span className="font-bold text-slate-700">{s.name}</span></td>
                                            <Cell val={hasHepB}/><Cell val={hasBLS}/><Cell val={hasIC}/><Cell val={hasRSO}/>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    function renderAmendments() {
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><PenSquare size={20} className="text-teal-600"/> Rectification Approval Queue</h4>
                    <p className="text-xs text-slate-500 mt-1">DPA 2012 Right to Rectification requests submitted via the patient portal.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {amendmentRequests && amendmentRequests.length > 0 ? amendmentRequests.map(req => (
                        <div key={req.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h5 className="font-bold text-slate-800">{req.patientName}</h5>
                                    <p className="text-xs text-slate-500 font-mono">ID: {req.patientId} • Requested: {formatDate(req.dateRequested)}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                    req.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    req.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                    'bg-red-50 text-red-700 border-red-200'
                                }`}>{req.status}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4 bg-slate-50 p-4 rounded-xl text-xs">
                                <div><span className="block font-bold text-slate-400 uppercase text-[9px] mb-1">Field</span><span className="font-bold text-slate-800">{req.fieldToAmend}</span></div>
                                <div><span className="block font-bold text-slate-400 uppercase text-[9px] mb-1">Reason</span><span className="italic text-slate-600">"{req.reason}"</span></div>
                                <div className="border-t border-slate-200 pt-2"><span className="block font-bold text-slate-400 uppercase text-[9px] mb-1">Old Value</span><span className="text-red-600 line-through">{req.currentValue}</span></div>
                                <div className="border-t border-slate-200 pt-2"><span className="block font-bold text-slate-400 uppercase text-[9px] mb-1">New Value</span><span className="text-green-600 font-bold">{req.requestedValue}</span></div>
                            </div>
                            {req.status === 'Pending' && (
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => onActionAmendment?.(req.id, 'Rejected')} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-colors">Reject</button>
                                    <button onClick={() => onActionAmendment?.(req.id, 'Approved')} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition-shadow">Approve & Update Record</button>
                                </div>
                            )}
                            {req.status !== 'Pending' && (
                                <div className="text-[10px] text-slate-400 text-right font-medium">Actioned by {req.actionedBy} on {formatDate(req.actionedAt)}</div>
                            )}
                        </div>
                    )) : <div className="text-center py-20 text-slate-400 italic">No pending rectification requests.</div>}
                </div>
            </div>
        );
    }

    function renderFinanceRules() {
        return (
            <div className="p-6 bg-slate-50 h-full overflow-y-auto space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-4"><DollarSign size={20} className="text-teal-600"/> Finance & Statutory Rules</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Standard VAT Rate (%)</label>
                            <input 
                                type="number" 
                                value={(settings.vatRate || 0) * 100} 
                                onChange={e => onUpdateSettings({...settings, vatRate: parseFloat(e.target.value) / 100})}
                                className="w-full p-3 border rounded-xl"
                            />
                            <p className="text-[10px] text-slate-400 mt-1 italic">Default is 12% in the Philippines.</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Senior/PWD Discount Rate (%)</label>
                            <input 
                                type="number" 
                                value={(settings.seniorDiscountRate || 0) * 100} 
                                onChange={e => onUpdateSettings({...settings, seniorDiscountRate: parseFloat(e.target.value) / 100})}
                                className="w-full p-3 border rounded-xl"
                            />
                            <p className="text-[10px] text-slate-400 mt-1 italic">Default is 20% statutory discount.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function renderProcedures() {
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-slate-700 flex items-center gap-2"><DollarSign size={20} className="text-teal-600"/> Procedures Registry</h4>
                        <p className="text-xs text-slate-500 mt-1">Configure pricing, PhilHealth case rates, and supply requirements.</p>
                    </div>
                    <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md"><Plus size={14}/> New Procedure</button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-tighter">
                            <tr>
                                <th className="p-4">Procedure Name</th>
                                <th className="p-4">Category</th>
                                <th className="p-4 text-right">Standard Price</th>
                                <th className="p-4 text-right">PhilHealth Case Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {settings.procedures.map(proc => (
                                <tr key={proc.id} className="hover:bg-slate-50 group">
                                    <td className="p-4 font-bold text-slate-800">{proc.name}</td>
                                    <td className="p-4 text-slate-500">{proc.category}</td>
                                    <td className="p-4 text-right font-bold text-slate-800">₱{proc.price.toLocaleString()}</td>
                                    <td className="p-4 text-right font-bold text-teal-600">₱{(proc.philHealthCaseRate || 0).toLocaleString()}</td>
                                </tr>
                            ))}
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
                        <p className="text-xs text-slate-500 mt-1">DENR/DOH regulatory record for hazardous waste disposal tracking.</p>
                    </div>
                    <button onClick={() => setShowWasteForm(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md"><Plus size={14}/> Log Manifest</button>
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
                {showWasteForm && <WasteLogModal onSave={(log) => { onAddWasteLog?.(log); setShowWasteForm(false); }} onClose={() => setShowWasteForm(false)} />}
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
                </div>
            </div>
        );
    }

    function renderIncidents() {
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-slate-700 flex items-center gap-2"><AlertOctagon size={20} className="text-red-600"/> Clinical Incident Registry</h4>
                        <p className="text-xs text-slate-500 mt-1">Private repository for logging complications and adverse events for malpractice defense.</p>
                    </div>
                </div>
            </div>
        );
    }

    function renderCredentialsMonitor() {
        return <div className="p-10 text-center text-slate-400">Section under audit.</div>;
    }

    function renderVatSummary() {
        return <div className="p-10 text-center text-slate-400">Section under audit.</div>;
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ToggleItem label="Inventory & FEFO" featureKey="enableInventory" icon={Package} />
                    <ToggleItem label="HMO/PhilHealth Claims" featureKey="enablePhilHealthClaims" icon={Heart} />
                    <ToggleItem label="Statutory Accountability Log" featureKey="enableAccountabilityLog" icon={Key} />
                </div>
            </div>
        );
    }

    function renderPermissions() {
        return <div className="p-10 text-center text-slate-400">Permissions are fixed in Beta.</div>;
    }

    function renderAuditLog() {
        return (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                 <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
                    <div><h4 className="font-bold text-slate-700">Audit Trail</h4><p className="text-xs text-slate-500">Immutable log of system activity.</p></div>
                    <button onClick={onExportAuditLog} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2"><DownloadCloud size={14}/> Export Secure Log</button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-[10px]">
                        <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-tighter sticky top-0"><tr className="divide-x"><th className="p-3">Timestamp</th><th className="p-3">User</th><th className="p-3">Action</th><th className="p-3">Entity</th><th className="p-3">Details</th></tr></thead>
                        <tbody className="divide-y divide-slate-100 bg-white font-mono">
                            {auditLog.map(l => (
                                <tr key={l.id} className="hover:bg-slate-50">
                                    <td className="p-3 text-slate-400 whitespace-nowrap">{formatDate(l.timestamp)}</td>
                                    <td className="p-3 font-bold text-slate-600 whitespace-nowrap">{l.userName}</td>
                                    <td className="p-3"><span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-800">{l.action}</span></td>
                                    <td className="p-3 whitespace-nowrap">{l.entity} ({l.entityId})</td>
                                    <td className="p-3 text-slate-500 truncate max-w-md" title={l.details}>{l.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    function renderVendors() {
        return <div className="p-10 text-center text-slate-400 italic">Vendor repository under maintenance.</div>;
    }

    function renderDataRetention() {
        return <div className="p-10 text-center text-slate-400 italic">Retention policies locked by DPO.</div>;
    }

    function renderDatabaseManagement() {
        return (
            <div className="p-10 text-center space-y-4">
                <Database size={48} className="mx-auto text-teal-600 opacity-20" />
                <h4 className="font-bold text-lg">System Database Security</h4>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => window.dispatchEvent(new CustomEvent('trigger-backup'))} className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"><DownloadCloud size={18}/> Manual DB Backup</button>
                    <button onClick={() => document.getElementById('restore-db-input')?.click()} className="bg-white border-2 border-teal-600 text-teal-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2"><UploadCloud size={18}/> Restore DB</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-full md:w-72 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-100 bg-teal-900 text-white">
                    <h2 className="text-lg font-bold flex items-center gap-2"><Sliders size={20} /> Compliance Suite</h2>
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

const RadiationSafetyModal = ({ onSave, onClose }: { onSave: (log: Partial<RadiationSafetyLog>) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState({ assetName: '', type: 'Lead Apron Check', result: 'Pass', notes: '' });
    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95">
                <h3 className="font-bold text-lg text-teal-800 mb-4">Log Radiation Safety Check</h3>
                <div className="space-y-4">
                    <input className="w-full p-3 border rounded-xl" placeholder="Equipment Name (e.g. Apron #1)" value={formData.assetName} onChange={e => setFormData({...formData, assetName: e.target.value})} />
                    <select className="w-full p-3 border rounded-xl" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                        <option>Lead Apron Check</option><option>Machine Calibration</option><option>Area Monitoring</option>
                    </select>
                    <select className="w-full p-3 border rounded-xl font-bold" value={formData.result} onChange={e => setFormData({...formData, result: e.target.value as any})}>
                        <option value="Pass">PASSED</option><option value="Fail">FAILED</option>
                    </select>
                    <textarea className="w-full p-3 border rounded-xl h-24 text-sm" placeholder="Inspector notes..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl">Cancel</button>
                    <button onClick={() => onSave(formData)} className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-xl">Save Safety Log</button>
                </div>
            </div>
        </div>
    );
};

const BreachResponseModal = ({ onSave, onClose }: { onSave: (log: Partial<SecurityIncident>) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState({ nature: 'Unauthorized Access', dataInvolved: '', personsAffected: 1, remediationSteps: '' });
    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95">
                <div className="flex items-center gap-2 mb-4 text-red-600"><ShieldOff size={24}/><h3 className="font-bold text-lg">Report Security Incident</h3></div>
                <div className="space-y-4">
                    <select className="w-full p-3 border border-red-200 rounded-xl" value={formData.nature} onChange={e => setFormData({...formData, nature: e.target.value as any})}>
                        <option>Unauthorized Access</option><option>Loss of Device</option><option>Malware</option><option>Other</option>
                    </select>
                    <input className="w-full p-3 border rounded-xl" placeholder="Nature of data affected" value={formData.dataInvolved} onChange={e => setFormData({...formData, dataInvolved: e.target.value})} />
                    <input className="w-full p-3 border rounded-xl" type="number" placeholder="Approx persons affected" value={formData.personsAffected} onChange={e => setFormData({...formData, personsAffected: parseInt(e.target.value)})} />
                    <textarea className="w-full p-3 border rounded-xl h-24 text-sm" placeholder="Containment measures..." value={formData.remediationSteps} onChange={e => setFormData({...formData, remediationSteps: e.target.value})} />
                </div>
                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl">Cancel</button>
                    <button onClick={() => onSave(formData)} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg">Commit Report</button>
                </div>
            </div>
        </div>
    );
};

const WasteLogModal = ({ onSave, onClose }: { onSave: (log: Partial<WasteLogEntry>) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState({ manifestNumber: '', type: 'Bio-hazard (Yellow)', transporterName: '', weightKg: 0 });
    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95">
                <h3 className="font-bold text-lg text-teal-800 mb-4">Log Waste Disposal Manifest</h3>
                <div className="space-y-4">
                    <input className="w-full p-3 border rounded-xl" placeholder="Manifest Number" value={formData.manifestNumber} onChange={e => setFormData({...formData, manifestNumber: e.target.value})} />
                    <select className="w-full p-3 border rounded-xl" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                        <option>Sharps</option><option>Bio-hazard (Yellow)</option><option>Amalgam</option><option>General Medical</option>
                    </select>
                    <input className="w-full p-3 border rounded-xl" placeholder="Transporter Name" value={formData.transporterName} onChange={e => setFormData({...formData, transporterName: e.target.value})} />
                    <input className="w-full p-3 border rounded-xl" type="number" placeholder="Weight (kg)" value={formData.weightKg} onChange={e => setFormData({...formData, weightKg: parseFloat(e.target.value)})} />
                </div>
                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl">Cancel</button>
                    <button onClick={() => onSave(formData)} className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-xl">Save Manifest</button>
                </div>
            </div>
        </div>
    );
};

export default FieldManagement;

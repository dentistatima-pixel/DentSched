// Fix: Import useState from React.
import React, { useState, useEffect } from 'react';
// Fix: Import ShieldCheck icon from lucide-react.
import { ArrowLeft, Fingerprint, Scale, Shield, FileSignature, ShieldCheck, AlertTriangle, X, Save, Plus, Trash2 } from 'lucide-react';
import AuditTrailViewer from './AuditTrailViewer';
import LegalActionHub from './LegalActionHub';
import ComplianceCenter from './ComplianceCenter';
import ConsentFormManager from './ConsentFormManager';
import { Patient, AuditLogEntry, FieldSettings, ClinicalIncident, ConsentFormTemplate } from '../types';
import { useToast } from './ToastSystem';

interface BreachNotificationCountdownProps {
    incident: ClinicalIncident;
}

const BreachNotificationCountdown: React.FC<BreachNotificationCountdownProps> = ({ incident }) => {
    const breachDetails = incident.breachDetails;
    if (!breachDetails || !breachDetails.npcDeadline) return null;

    const [hoursRemaining, setHoursRemaining] = useState(0);

    useEffect(() => {
        const calculateRemaining = () => {
            const deadline = new Date(breachDetails.npcDeadline);
            const now = new Date();
            const remaining = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));
            setHoursRemaining(remaining);
        };
        calculateRemaining();
        const interval = setInterval(calculateRemaining, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [breachDetails.npcDeadline]);

    const isOverdue = hoursRemaining === 0 && !breachDetails.npcNotifiedAt;
    const isUrgent = hoursRemaining <= 24 && !breachDetails.npcNotifiedAt;
    const isFiled = breachDetails.npcNotifiedAt || breachDetails.npcNotificationStatus === 'Filed';

    const colorClasses = isOverdue ? 'bg-red-100 border-red-600' : isUrgent ? 'bg-amber-100 border-amber-600' : 'bg-slate-100 border-slate-300';
    const textClasses = isOverdue ? 'text-red-900' : isUrgent ? 'text-amber-900' : 'text-slate-900';
    const iconColor = isOverdue ? 'text-red-700' : isUrgent ? 'text-amber-700' : 'text-slate-700';

    return (
        <div className={`p-4 rounded-xl border-2 ${colorClasses}`}>
            <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={iconColor} />
                <h4 className="font-black">NPC Notification Deadline</h4>
            </div>

            {!isFiled ? (
                <p className={`font-mono text-2xl ${textClasses}`}>
                    {isOverdue ? 'OVERDUE' : `${hoursRemaining} hours remaining`}
                </p>
            ) : (
                <p className="font-bold text-teal-700">Filed on {new Date(breachDetails.npcNotifiedAt!).toLocaleDateString()}</p>
            )}
            
            {isOverdue && (
                <p className="text-xs text-red-700 mt-2">
                    WARNING: You are in violation of DPA 10173 Section 20(f). File NPC notification immediately to mitigate penalties.
                </p>
            )}
            
            {!isFiled && (
                <button
                    onClick={() => window.open(`https://privacy.gov.ph/data-breach-notification/?ref=${incident.id}`, '_blank')}
                    className="mt-3 bg-white border border-slate-300 px-4 py-2 rounded-lg text-xs font-bold text-slate-800 hover:bg-slate-50"
                >
                    File NPC Notification Now
                </button>
            )}
        </div>
    );
};

const ConsentTemplateEditor: React.FC<{ settings: FieldSettings; onUpdateSettings: (s: FieldSettings) => void }> = ({ settings, onUpdateSettings }) => {
    const [editingTemplate, setEditingTemplate] = useState<ConsentFormTemplate | null>(null);
    const toast = useToast();

    const handleSave = () => {
        if (!editingTemplate) return;
        const isNew = !settings.consentFormTemplates.some(t => t.id === editingTemplate.id);
        const nextTemplates = isNew
            ? [...settings.consentFormTemplates, editingTemplate]
            : settings.consentFormTemplates.map(t => t.id === editingTemplate.id ? editingTemplate : t);
        
        onUpdateSettings({ ...settings, consentFormTemplates: nextTemplates });
        toast.success(`Template "${editingTemplate.name}" saved.`);
        setEditingTemplate(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => setEditingTemplate({ id: `custom_${Date.now()}`, name: 'New Custom Form', content_en: '', content_tl: '' })} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><Plus/> Add Template</button>
            </div>
            <div className="space-y-2">
                {settings.consentFormTemplates.map(template => (
                    <div key={template.id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center group">
                        <span className="font-bold text-sm text-slate-800">{template.name}</span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                            <button onClick={() => setEditingTemplate(template)} className="p-2 text-slate-500 hover:text-teal-600">Edit</button>
                        </div>
                    </div>
                ))}
            </div>
            {editingTemplate && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl space-y-4">
                        <h3 className="font-bold">Edit Template</h3>
                        <input value={editingTemplate.name} onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })} className="input"/>
                        <textarea value={editingTemplate.content_en} onChange={e => setEditingTemplate({ ...editingTemplate, content_en: e.target.value })} className="input h-32" placeholder="English Content"/>
                        <textarea value={editingTemplate.content_tl} onChange={e => setEditingTemplate({ ...editingTemplate, content_tl: e.target.value })} className="input h-32" placeholder="Tagalog Content"/>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditingTemplate(null)} className="px-4 py-2 text-xs font-bold">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface GovernanceHubProps {
  patients: Patient[];
  showModal: (type: string, props: any) => void;
  auditLog: AuditLogEntry[];
  auditLogVerified: boolean | null;
  settings: FieldSettings;
  onUpdateSettings: (newSettings: FieldSettings) => void;
  onAnonymizePatient: (id: string) => void;
  onBack: () => void;
  incidents: ClinicalIncident[];
  handleRequestDataDeletion: any;
}

const GovernanceHub: React.FC<GovernanceHubProps> = (props) => {
  const [activeTab, setActiveTab] = useState('audit');

  const tabs = [
    { id: 'audit', label: 'Forensic Audit Trail', icon: Fingerprint, color: 'text-teal-600' },
    { id: 'compliance', label: 'Compliance Center', icon: Shield, color: 'text-blue-600' },
    { id: 'breaches', label: 'Breaches', icon: AlertTriangle, color: 'text-red-600' },
    { id: 'consent', label: 'Consent Forms', icon: FileSignature, color: 'text-lilac-600' },
    { id: 'legal', label: 'Legal Action Hub', icon: Scale, color: 'text-amber-600' },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'audit':
        return <AuditTrailViewer auditLog={props.auditLog} auditLogVerified={props.auditLogVerified} />;
      case 'compliance':
        return <ComplianceCenter settings={props.settings} onUpdateSettings={props.onUpdateSettings} patients={props.patients} onAnonymizePatient={props.onAnonymizePatient} />;
      case 'breaches':
        const breachIncidents = props.incidents.filter(i => i.isDataBreach);
        return (
            <div className="space-y-6">
                {breachIncidents.map(incident => (
                    <div key={incident.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="font-bold text-slate-800">Breach ID: {incident.id}</h4>
                        <p className="text-xs text-slate-500">Discovered: {new Date(incident.breachDetails!.discoveryTimestamp).toLocaleString()}</p>
                        <p className="text-sm my-2">{incident.description}</p>
                        <BreachNotificationCountdown incident={incident} />
                    </div>
                ))}
                {breachIncidents.length === 0 && <p className="text-center italic text-slate-400 p-8">No data breaches have been logged.</p>}
            </div>
        )
      case 'consent':
        // FIX: Replaced incorrect component call with an inline implementation to manage consent templates, resolving the props mismatch.
        return <ConsentTemplateEditor settings={props.settings} onUpdateSettings={props.onUpdateSettings} />;
      case 'legal':
        return <LegalActionHub patients={props.patients} showModal={props.showModal} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 animate-in fade-in duration-500 space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={props.onBack} className="bg-white p-4 rounded-full shadow-sm border hover:bg-slate-100 transition-all active:scale-90" aria-label="Back to Admin Hub">
            <ArrowLeft size={24} className="text-slate-600"/>
        </button>
        <div className="bg-lilac-600 p-4 rounded-3xl text-white shadow-xl"><ShieldCheck size={36} /></div>
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">Governance Hub</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Compliance, Audit, and Legal Documentation</p>
        </div>
      </div>
      
      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm self-start flex gap-2">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500'}`}
          >
            <tab.icon size={16} className={activeTab === tab.id ? tab.color : ''} /> {tab.label}
          </button>
        ))}
      </div>
      
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        {renderContent()}
      </div>
    </div>
  );
};

export default GovernanceHub;

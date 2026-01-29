
// Fix: Import useState from React.
import React, { useState } from 'react';
// Fix: Import ShieldCheck icon from lucide-react.
import { ArrowLeft, Fingerprint, Scale, Shield, FileSignature, ShieldCheck } from 'lucide-react';
import AuditTrailViewer from './AuditTrailViewer';
import LegalActionHub from './LegalActionHub';
import ComplianceCenter from './ComplianceCenter';
import ConsentFormManager from './ConsentFormManager';
import { Patient, AuditLogEntry, FieldSettings } from '../types';

interface GovernanceHubProps {
  patients: Patient[];
  showModal: (type: string, props: any) => void;
  auditLog: AuditLogEntry[];
  auditLogVerified: boolean | null;
  settings: FieldSettings;
  onUpdateSettings: (newSettings: FieldSettings) => void;
  onAnonymizePatient: (id: string) => void;
  onBack: () => void;
}

const GovernanceHub: React.FC<GovernanceHubProps> = (props) => {
  const [activeTab, setActiveTab] = useState('audit');

  const tabs = [
    { id: 'audit', label: 'Forensic Audit Trail', icon: Fingerprint, color: 'text-teal-600' },
    { id: 'compliance', label: 'Compliance Center', icon: Shield, color: 'text-blue-600' },
    { id: 'consent', label: 'Consent Forms', icon: FileSignature, color: 'text-lilac-600' },
    { id: 'legal', label: 'Legal Action Hub', icon: Scale, color: 'text-amber-600' },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'audit':
        return <AuditTrailViewer auditLog={props.auditLog} auditLogVerified={props.auditLogVerified} />;
      case 'compliance':
        return <ComplianceCenter settings={props.settings} onUpdateSettings={props.onUpdateSettings} patients={props.patients} onAnonymizePatient={props.onAnonymizePatient} />;
      case 'consent':
        return <ConsentFormManager settings={props.settings} onUpdateSettings={props.onUpdateSettings} />;
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

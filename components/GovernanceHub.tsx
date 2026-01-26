import React, { useState } from 'react';
import { Scale, Fingerprint, Shield, FileSignature } from 'lucide-react';
import LegalActionHub from './LegalActionHub';
import AuditTrailViewer from './AuditTrailViewer';
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
}

const GovernanceHub: React.FC<GovernanceHubProps> = (props) => {
  const [activeTab, setActiveTab] = useState('legal');

  const tabs = [
    { id: 'legal', label: 'Legal Action Hub', icon: Scale },
    { id: 'audit', label: 'Forensic Audit Trail', icon: Fingerprint },
    { id: 'compliance', label: 'Compliance Center', icon: Shield },
    { id: 'consent', label: 'Consent Forms', icon: FileSignature },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'legal':
        return <LegalActionHub patients={props.patients} showModal={props.showModal} />;
      case 'audit':
        return <AuditTrailViewer auditLog={props.auditLog} auditLogVerified={props.auditLogVerified} />;
      case 'compliance':
        return <ComplianceCenter settings={props.settings} onUpdateSettings={props.onUpdateSettings} patients={props.patients} onAnonymizePatient={props.onAnonymizePatient} initialTab="npc_compliance" />;
      case 'consent':
        return <ConsentFormManager settings={props.settings} onUpdateSettings={props.onUpdateSettings} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-500">
      <div>
        <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Governance Hub</h3>
        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">Manage compliance, audit trails, and legal documentation.</p>
      </div>
      
      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm self-start flex gap-2">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-teal-900 text-white shadow-lg' : 'text-slate-500'}`}
          >
            <tab.icon size={14}/> {tab.label}
          </button>
        ))}
      </div>
      
      <div className="mt-8 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        {renderContent()}
      </div>
    </div>
  );
};

export default GovernanceHub;
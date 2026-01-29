
import React, { useState, useMemo } from 'react';
import { FieldSettings, Patient } from '../types';
import { Shield, Archive, Trash2, Search, AlertTriangle } from 'lucide-react';
import { useToast } from './ToastSystem';
import { checkRetentionPolicy } from '../services/validationService';
import { formatDate } from '../constants';

interface ComplianceCenterProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
    patients: Patient[];
    onAnonymizePatient: (id: string) => void;
    initialTab?: string;
}

const ComplianceCenter: React.FC<ComplianceCenterProps> = ({ settings, onUpdateSettings, patients, onAnonymizePatient, initialTab }) => {
    const toast = useToast();
    const [patientSearch, setPatientSearch] = useState('');

    const { retentionPolicy } = settings;

    const recordsForPurge = useMemo(() => {
        if (!retentionPolicy || !patients) return [];
        return patients.filter(p => {
            const result = checkRetentionPolicy(p, retentionPolicy);
            return result.action === 'PURGE';
        });
    }, [patients, retentionPolicy]);
    
    const filteredPatients = patients.filter(p => !p.isAnonymized && p.name.toLowerCase().includes(patientSearch.toLowerCase()));

    const handleConfirmAnonymize = (patient: Patient) => {
        if (window.confirm(`WARNING: This action is irreversible.\n\nAre you sure you want to permanently anonymize all personally identifiable information for "${patient.name}"?`)) {
            onAnonymizePatient(patient.id);
            setPatientSearch('');
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
             <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Governance & Compliance</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Manage NPC, DOH, and BIR statutory requirements.</p>
            </div>
            
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                 <div className="flex items-center gap-3 text-lilac-800 font-black uppercase text-xs tracking-widest border-b border-slate-100 pb-3 mb-4">
                    <Shield size={20} /> NPC Compliance (RA 10173)
                </div>
                <div>
                    <label className="label text-xs">Current Data Privacy Consent Version</label>
                    <input 
                        type="text"
                        value={settings.currentPrivacyVersion}
                        onChange={e => onUpdateSettings({...settings, currentPrivacyVersion: e.target.value})}
                        className="input"
                    />
                </div>
                 <div className="bg-blue-50 p-6 rounded-2xl border-2 border-dashed border-blue-200">
                     <h4 className="font-bold text-sm text-blue-800 mb-2">Data Breach Reporter</h4>
                     <p className="text-xs text-blue-700 mb-4">In case of a data breach, use this module to document the incident and generate the mandatory 72-hour report for the National Privacy Commission.</p>
                     <button className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase shadow-lg">Report New Breach</button>
                 </div>
            </div>

             <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                 <div className="flex items-center gap-3 text-teal-800 font-black uppercase text-xs tracking-widest border-b border-slate-100 pb-3 mb-4">
                    <Archive size={20} /> Data Retention Policy
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label text-xs">Archival Period (Years)</label>
                        <input type="number" value={retentionPolicy.archivalYears} onChange={e => onUpdateSettings({...settings, retentionPolicy: {...settings.retentionPolicy, archivalYears: +e.target.value }})} className="input" />
                    </div>
                     <div>
                        <label className="label text-xs">Anonymization Period (Years)</label>
                        <input type="number" value={retentionPolicy.purgeYears} onChange={e => onUpdateSettings({...settings, retentionPolicy: {...settings.retentionPolicy, purgeYears: +e.target.value }})} className="input" />
                    </div>
                </div>

                {recordsForPurge.length > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <h4 className="font-bold text-amber-800 text-sm mb-2">{recordsForPurge.length} record(s) flagged for anonymization</h4>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {recordsForPurge.map(p => (
                            <div key={p.id} className="flex justify-between items-center p-2 bg-white rounded-md">
                                <div>
                                    <p className="font-bold text-xs">{p.name}</p>
                                    <p className="text-[10px] text-slate-500">Last visit: {formatDate(p.lastVisit)}</p>
                                </div>
                                <button onClick={() => handleConfirmAnonymize(p)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><Trash2 size={14}/></button>
                            </div>
                          ))}
                        </div>
                    </div>
                )}
                
                <div className="bg-red-50 p-6 rounded-2xl border-2 border-dashed border-red-200">
                    <h4 className="font-bold text-sm text-red-800 mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Right to Erasure (Anonymization)</h4>
                    <p className="text-xs text-red-700 mb-4">This action is irreversible and redacts all Personally Identifiable Information (PII) from a patient's record while retaining their non-identifiable clinical history for regulatory compliance. Use only to fulfill a data subject's formal request.</p>
                     <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input type="text" placeholder="Search patient to anonymize..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} className="input pl-10"/></div>
                     <div className="max-h-48 overflow-y-auto mt-2 space-y-1 pr-2">
                        {patientSearch && filteredPatients.map(p => (
                            <div key={p.id} className="flex justify-between items-center p-2 bg-white rounded-lg">
                                <span className="text-sm font-bold">{p.name}</span>
                                <button onClick={() => handleConfirmAnonymize(p) } className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><Trash2 size={14}/></button>
                            </div>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ComplianceCenter;

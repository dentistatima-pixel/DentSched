import React, { useState, useMemo } from 'react';
import { ArrowLeft, Fingerprint, Scale, Shield, FileSignature, ShieldCheck, AlertTriangle, X, Save, Plus, Trash2, Archive, User as UserIcon, FileText, Search } from 'lucide-react';
import AuditTrailViewer from './AuditTrailViewer';
import LegalActionHub from './LegalActionHub';
import ConsentFormManager from './ConsentFormManager';
import { Patient, AuditLogEntry, FieldSettings, ClinicalIncident, ConsentFormTemplate, PrivacyImpactAssessment } from '../types';
import { useToast } from './ToastSystem';
import { useModal } from '../contexts/ModalContext';
import { useStaff } from '../contexts/StaffContext';
import { formatDate } from '../constants';
import { checkRetentionPolicy } from '../services/validationService';

interface ComplianceCenterProps {
  settings: FieldSettings;
  onUpdateSettings: (newSettings: FieldSettings) => void;
  patients: Patient[];
  onAnonymizePatient: (id: string) => void;
  initialTab?: string;
}

const ComplianceCenter: React.FC<ComplianceCenterProps> = ({ settings, onUpdateSettings, patients, onAnonymizePatient, initialTab }) => {
    const toast = useToast();
    const { staff } = useStaff();
    const { openModal } = useModal();
    const [patientSearch, setPatientSearch] = useState('');
    const [showPiaForm, setShowPiaForm] = useState(false);
    const [newPia, setNewPia] = useState({ processName: '', description: '', risks: '', mitigation: '' });

    const { retentionPolicy } = settings;

    const dpoCandidates = useMemo(() => staff.filter(s => s.role === 'Administrator' || s.role === 'System Architect'), [staff]);

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

    const handleDpoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdateSettings({ ...settings, dataProtectionOfficerId: e.target.value });
    };
    
    const handlePiaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setNewPia({ ...newPia, [e.target.name]: e.target.value });
    };

    const handleSavePia = () => {
        const currentUser = staff.find(s => s.status === 'Active'); // A simplistic way to get a user
        if (!currentUser || !newPia.processName || !newPia.description) {
            toast.error("Process name and description are required for a PIA.");
            return;
        }
        const piaToAdd: PrivacyImpactAssessment = {
            id: `pia_${Date.now()}`,
            date: new Date().toISOString(),
            conductedBy: currentUser.id,
            ...newPia
        };
        const newPias = [...(settings.privacyImpactAssessments || []), piaToAdd];
        onUpdateSettings({ ...settings, privacyImpactAssessments: newPias });
        setShowPiaForm(false);
        setNewPia({ processName: '', description: '', risks: '', mitigation: '' });
        toast.success("Privacy Impact Assessment logged.");
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                 <div className="flex items-center gap-3 text-blue-800 font-black uppercase text-xs tracking-widest border-b border-slate-100 pb-3 mb-4">
                    <UserIcon size={20} /> Data Protection Officer (DPO)
                </div>
                <p className="text-xs text-slate-500 -mt-4">Designate a staff member as the official DPO for NPC correspondence.</p>
                <select value={settings.dataProtectionOfficerId || ''} onChange={handleDpoChange} className="input">
                    <option value="">-- Select DPO --</option>
                    {dpoCandidates.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                </select>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                    <h4 className="flex items-center gap-3 text-blue-800 font-black uppercase text-xs tracking-widest"><FileText size={20}/> Privacy Impact Assessments (PIA)</h4>
                    <button onClick={() => setShowPiaForm(!showPiaForm)} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold">{showPiaForm ? 'Cancel' : 'Add PIA'}</button>
                </div>
                
                {showPiaForm && (
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4 animate-in fade-in">
                        <input name="processName" value={newPia.processName} onChange={handlePiaChange} placeholder="Process Name (e.g., Online Registration)" className="input"/>
                        <textarea name="description" value={newPia.description} onChange={handlePiaChange} placeholder="Description of the process..." className="input h-20"/>
                        <textarea name="risks" value={newPia.risks} onChange={handlePiaChange} placeholder="Identified privacy risks..." className="input h-20"/>
                        <textarea name="mitigation" value={newPia.mitigation} onChange={handlePiaChange} placeholder="Mitigation measures..." className="input h-20"/>
                        <button onClick={handleSavePia} className="w-full py-3 bg-teal-600 text-white rounded-lg font-bold">Log PIA</button>
                    </div>
                )}
                
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {(settings.privacyImpactAssessments || []).map(pia => (
                        <div key={pia.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="font-bold text-sm text-slate-700">{pia.processName}</p>
                            <p className="text-xs text-slate-500">Conducted by {staff.find(s=>s.id === pia.conductedBy)?.name || 'Unknown'} on {formatDate(pia.date)}</p>
                        </div>
                    ))}
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
                    <p className="text-xs text-red-700 mb-4">This action redacts all PII from a patient's record while retaining their non-identifiable clinical history for regulatory compliance. Use to fulfill a data subject's formal request.</p>
                     <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input type="text" placeholder="Search patient..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} className="input pl-10"/></div>
                     <div className="max-h-48 overflow-y-auto mt-2 space-y-1 pr-2">
                        {patientSearch && filteredPatients.map(p => (
                            <div key={p.id} className="flex justify-between items-center p-2 bg-white rounded-lg">
                                <span className="text-sm font-bold">{p.name}</span>
                                <div className="flex gap-2">
                                  <button onClick={() => openModal('dataDeletionRequest', { patient: p })} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-xs font-black">Request</button>
                                  <button onClick={() => handleConfirmAnonymize(p) } className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ComplianceCenter;

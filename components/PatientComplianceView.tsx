
import React from 'react';
import { Patient, ConsentCategory, ClearanceRequest, InformedRefusal } from '../types';
import { ShieldCheck, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '../constants';

interface PatientComplianceViewProps {
    patient: Patient;
}

const DetailSection: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="flex items-center gap-3 text-sm font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">
            <Icon size={18} /> {title}
        </h3>
        {children}
    </div>
);

const PatientComplianceView: React.FC<PatientComplianceViewProps> = ({ patient }) => {
    const { consentLogs = [], clearanceRequests = [], informedRefusals = [] } = patient;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-4">
            <DetailSection title="Consent History" icon={ShieldCheck}>
                <div className="space-y-3">
                    {consentLogs.length > 0 ? consentLogs.map((log, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-bold text-slate-800">{log.category} Consent</p>
                                <p className="text-xs text-slate-500">Version {log.version} - {new Date(log.timestamp).toLocaleString()}</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${log.status === 'Given' ? 'bg-teal-100 text-teal-700' : 'bg-red-100 text-red-700'}`}>
                                {log.status === 'Given' ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                                {log.status}
                            </span>
                        </div>
                    )) : <p className="text-sm text-slate-400 italic text-center py-4">No consent history logged.</p>}
                </div>
            </DetailSection>

            <DetailSection title="Medical Clearances" icon={FileText}>
                <div className="space-y-3">
                    {clearanceRequests.length > 0 ? clearanceRequests.map(req => (
                        <div key={req.id} className="p-3 bg-slate-50 rounded-lg">
                            <div className="flex justify-between items-center">
                                <p className="font-bold text-slate-800">Clearance from {req.specialty}</p>
                                 <span className={`text-xs font-bold px-2 py-1 rounded-full ${req.status === 'Approved' ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-600'}`}>
                                    {req.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Requested: {formatDate(req.requestedAt)} | Approved: {formatDate(req.approvedAt)}</p>
                            {req.remarks && <p className="text-xs italic text-slate-600 mt-2 bg-white p-2 rounded">"{req.remarks}"</p>}
                        </div>
                    )) : <p className="text-sm text-slate-400 italic text-center py-4">No medical clearances on file.</p>}
                </div>
            </DetailSection>

            <DetailSection title="Informed Refusals" icon={AlertTriangle}>
                 <div className="space-y-3">
                    {informedRefusals.length > 0 ? informedRefusals.map(refusal => (
                        <div key={refusal.id} className="p-3 bg-red-50 rounded-lg border border-red-100">
                             <p className="font-bold text-red-800">Refusal of: {refusal.relatedEntity.entityDescription}</p>
                             <p className="text-xs text-red-600">Documented on: {formatDate(refusal.patientSignatureTimestamp)}</p>
                        </div>
                    )) : <p className="text-sm text-slate-400 italic text-center py-4">No informed refusals documented.</p>}
                </div>
            </DetailSection>
        </div>
    );
};

export default PatientComplianceView;

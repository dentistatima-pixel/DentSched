
import React from 'react';
import { Patient, Appointment, TreatmentPlan, SignatureChainEntry } from '../types';
import { formatDate, isExpired } from '../constants';
import { FileSignature, ShieldCheck, DollarSign, Stethoscope, ClipboardCheck, Lock, Hash, Check, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAppointments } from '../contexts/AppointmentContext';
import { validateSignatureChain } from '../services/signatureVerification';

interface ConsentTimelineProps {
    patient: Patient;
}

const isSignatureExpired = (entry: SignatureChainEntry) => {
    return entry.expiresAt && new Date(entry.expiresAt) < new Date();
}

const ConsentTimeline: React.FC<ConsentTimelineProps> = ({ patient }) => {
    const { appointments } = useAppointments();
    const patientAppointments = appointments.filter(a => a.patientId === patient.id);

    const timelineEvents = [
        ...(patient.privacyConsentChain || []).map(entry => ({
            id: `privacy-${entry.id}`,
            title: 'Privacy Consent Signed',
            timestamp: entry.timestamp,
            icon: FileSignature,
            details: `Signed by ${entry.signerName} (${entry.signerRole})`,
            chain: patient.privacyConsentChain
        })).slice(0, 1),

        ...(patient.treatmentPlans || [])
            .filter(plan => plan.financialConsentSignatureChain && plan.financialConsentSignatureChain.length > 0)
            .map(plan => ({
                id: `fin-${plan.id}`,
                title: `Financial Consent Approved`,
                timestamp: plan.financialConsentSignatureChain![0].timestamp,
                icon: DollarSign,
                details: `For Treatment Plan: ${plan.name}`,
                chain: plan.financialConsentSignatureChain,
            })),

        ...(patientAppointments)
            .filter(apt => apt.consentSignatureChain && apt.consentSignatureChain.length > 0)
            .map(apt => ({
                id: `proc-${apt.id}`,
                title: 'Procedure Consent Given',
                timestamp: apt.consentSignatureChain![0].timestamp,
                icon: Stethoscope,
                details: `For: ${apt.type}`,
                chain: apt.consentSignatureChain,
            })),
        
        ...(patientAppointments)
            .filter(apt => apt.postOpHandoverChain && apt.postOpHandoverChain.length > 0)
            .map(apt => ({
                id: `postop-${apt.id}`,
                title: 'Post-Op Handover Verified',
                timestamp: apt.postOpHandoverChain![0].timestamp,
                icon: ClipboardCheck,
                details: `After: ${apt.type}`,
                chain: apt.postOpHandoverChain,
            }))
    ].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest flex items-center gap-3"><ShieldCheck size={18} className="text-teal-600"/> Consent & Authorization Timeline</h4>
            <div className="relative pl-8">
                <div className="absolute top-0 bottom-0 left-[21px] w-0.5 bg-slate-200"></div>
                {timelineEvents.map((event) => {
                    const Icon = event.icon;
                    const validation = event.chain ? validateSignatureChain(event.chain) : { valid: true, errors: [] };
                    const ValidityIcon = validation.valid ? ShieldCheck : ShieldAlert;

                    return (
                        <div key={event.id} className="relative mb-8">
                            <div className={`absolute -left-4 top-1 w-8 h-8 bg-white border-4 rounded-full flex items-center justify-center ${validation.valid ? 'border-slate-200' : 'border-red-500 animate-pulse'}`}>
                                <Icon size={16} className={validation.valid ? 'text-slate-500' : 'text-red-600'}/>
                            </div>
                            <div className="pl-8">
                                <p className="text-xs font-bold text-slate-400">{new Date(event.timestamp).toLocaleString()}</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-800">{event.title}</p>
                                    <ValidityIcon size={16} className={validation.valid ? 'text-green-500' : 'text-red-500'} title={validation.valid ? 'Signature chain verified' : `Chain compromised: ${validation.errors.join(', ')}`}/>
                                </div>
                                <p className="text-sm text-slate-600">{event.details}</p>

                                {event.chain && event.chain.length > 0 && (
                                    <div className={`mt-3 space-y-3 p-4 rounded-xl border ${validation.valid ? 'bg-slate-50 border-slate-200' : 'bg-red-50 border-red-200'}`}>
                                        {!validation.valid && (
                                            <div className="text-xs text-red-700 font-bold p-2 bg-red-100 rounded-lg">
                                                <p>COMPROMISED: {validation.errors.join(', ')}</p>
                                            </div>
                                        )}
                                        {event.chain.map((entry) => (
                                            <div key={entry.id} className="text-xs relative pl-6">
                                                <div className="absolute top-1 left-0 w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center"><Check size={10} className="text-teal-600"/></div>
                                                <p className="font-black text-slate-800">{entry.signerName} <span className="text-slate-500 font-bold">({entry.signerRole || entry.signatureType})</span></p>
                                                <div className="font-mono text-[10px] text-slate-500 mt-1 space-y-1">
                                                    <p className="flex items-center gap-1"><Clock size={10}/> {new Date(entry.timestamp).toLocaleString()}</p>
                                                    <p className="flex items-center gap-1 text-teal-700 font-bold" title={entry.hash}><Lock size={10}/> Hash: {entry.hash.substring(0, 10)}...</p>
                                                    {isSignatureExpired(entry) && <p className="flex items-center gap-1 text-red-600 font-bold"><AlertTriangle size={10}/> EXPIRED on {formatDate(entry.expiresAt)}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                 {timelineEvents.length === 0 && <p className="text-center text-slate-400 italic py-8">No consent events logged.</p>}
            </div>
        </div>
    );
};

export default ConsentTimeline;


import React from 'react';
import { Patient, Appointment, TreatmentPlan } from '../types';
import { formatDate } from '../constants';
import { FileSignature, ShieldCheck, DollarSign, Stethoscope, ClipboardCheck } from 'lucide-react';
import { useAppointments } from '../contexts/AppointmentContext';

interface ConsentTimelineProps {
    patient: Patient;
}

const ConsentTimeline: React.FC<ConsentTimelineProps> = ({ patient }) => {
    const { appointments } = useAppointments();
    const patientAppointments = appointments.filter(a => a.patientId === patient.id);

    const timelineEvents = [
        // Registration
        ...(patient.registrationSignatureTimestamp ? [{
            id: 'reg',
            title: 'Patient Registration Signed',
            timestamp: patient.registrationSignatureTimestamp,
            icon: FileSignature,
            details: 'Initial record and identity verification.'
        }] : []),

        // Financial Consents from Plans
        ...(patient.treatmentPlans || [])
            .filter(plan => plan.financialConsentTimestamp)
            .map(plan => ({
                id: `fin-${plan.id}`,
                title: `Financial Consent Approved`,
                timestamp: plan.financialConsentTimestamp!,
                icon: DollarSign,
                details: `For Treatment Plan: ${plan.name}`
            })),

        // Procedural Consents from Appointments
        ...(patientAppointments)
            .filter(apt => apt.consentSignatureChain && apt.consentSignatureChain.length > 0)
            .map(apt => ({
                id: `proc-${apt.id}`,
                title: 'Procedure Consent Given',
                timestamp: apt.consentSignatureChain![0].timestamp,
                icon: Stethoscope,
                details: `For: ${apt.type}`
            })),
        
        // Post-Op Handovers
        ...(patientAppointments)
            .filter(apt => apt.postOpVerifiedAt)
            .map(apt => ({
                id: `postop-${apt.id}`,
                title: 'Post-Op Handover Verified',
                timestamp: apt.postOpVerifiedAt!,
                icon: ClipboardCheck,
                details: `After: ${apt.type}`
            }))
    ].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest flex items-center gap-3"><ShieldCheck size={18} className="text-teal-600"/> Consent & Authorization Timeline</h4>
            <div className="relative pl-8">
                {/* Timeline line */}
                <div className="absolute top-0 bottom-0 left-[21px] w-0.5 bg-slate-200"></div>
                {timelineEvents.map((event, i) => {
                    const Icon = event.icon;
                    return (
                        <div key={event.id} className="relative mb-8">
                            <div className="absolute -left-4 top-1 w-8 h-8 bg-white border-4 border-slate-200 rounded-full flex items-center justify-center">
                                <Icon size={16} className="text-slate-500"/>
                            </div>
                            <div className="pl-8">
                                <p className="text-xs font-bold text-slate-400">{new Date(event.timestamp).toLocaleString()}</p>
                                <p className="font-bold text-slate-800">{event.title}</p>
                                <p className="text-sm text-slate-600">{event.details}</p>
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

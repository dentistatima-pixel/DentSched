import React from 'react';
import { Patient, Appointment } from '../types';
import { verifyAllPatientSignatures } from '../services/signatureVerification';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface SignatureChainStatusProps {
    patient: Patient;
    appointments: Appointment[];
}

export const SignatureChainStatus: React.FC<SignatureChainStatusProps> = ({ patient, appointments }) => {
    const validationResult = verifyAllPatientSignatures(patient, appointments);
    
    if (validationResult.report.length === 0) {
        return null; // No signatures to verify
    }

    const containerClasses = validationResult.valid 
        ? "bg-teal-50 border-teal-200"
        : "bg-red-50 border-red-300";
    
    const iconClasses = validationResult.valid
        ? "text-teal-600"
        : "text-red-600";
        
    const textClasses = validationResult.valid
        ? "text-teal-900"
        : "text-red-900";

    return (
        <div className={`p-4 rounded-2xl border-2 ${containerClasses} animate-in fade-in`}>
            <h4 className={`font-black text-sm uppercase tracking-widest flex items-center gap-3 ${textClasses}`}>
                {validationResult.valid ? <ShieldCheck size={18} className={iconClasses} /> : <ShieldAlert size={18} className={`${iconClasses} animate-pulse`} />}
                Signature Chain Integrity
            </h4>
            {validationResult.valid ? (
                <p className={`text-sm mt-2 font-bold ${textClasses}`}>✓ All consent and authorization records are cryptographically verified and intact.</p>
            ) : (
                <div className={`text-sm mt-2`}>
                    <p className={`font-bold ${textClasses}`}>⚠ WARNING: Tampering detected in the following records:</p>
                    <ul className="list-disc ml-5 mt-2 text-red-800 text-xs font-mono">
                        {validationResult.report.filter(r => !r.valid).map(r => (
                            <li key={r.chain}>{r.chain}: {r.errors.join(', ')}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

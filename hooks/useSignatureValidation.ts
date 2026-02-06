
import { useEffect } from 'react';
import { Patient, Appointment } from '../types';
import { verifyAllPatientSignatures } from '../services/signatureVerification';
import { useToast } from '../components/ToastSystem';
import { useAppContext } from '../contexts/AppContext';

export const useSignatureValidation = (patient: Patient | null, appointments: Appointment[]) => {
    const toast = useToast();
    const { logAction } = useAppContext();

    useEffect(() => {
        if (!patient) return;

        const { valid, report } = verifyAllPatientSignatures(patient, appointments);

        if (!valid) {
            const compromisedChains = report.filter(r => !r.valid).map(r => r.chain).join(', ');
            const errorMessage = `SECURITY ALERT: Signature integrity compromised for chains: ${compromisedChains}.`;
            
            toast.error(errorMessage, { duration: 30000 });
            logAction('SECURITY_ALERT', 'System', patient.id, errorMessage);
        }
    }, [patient, appointments, toast, logAction]);
};
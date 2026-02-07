
import { Appointment, Patient, FieldSettings, User, UserRole, TreatmentPlanStatus } from '../types';
import { isExpired } from '../constants';
import { checkClinicalProtocols } from './protocolEnforcement';

export interface MedicolegalBlock {
    isBlocked: boolean;
    reason: string;
    modal?: {
        type: string;
        props: any;
    };
}

export const canStartTreatment = (
    appointment: Appointment,
    patient: Patient,
    provider: User,
    fieldSettings: FieldSettings,
): MedicolegalBlock => {
    // 1. Clinical Authority Check
    if (isExpired(provider.prcExpiry)) {
        return { isBlocked: true, reason: `PRC license for ${provider.name} has expired.` };
    }

    const procedure = fieldSettings.procedures.find(p => p.name === appointment.type);
    
    // 2. High-Risk Surgical Affirmation (Strategic Sealing)
    if (procedure?.category === 'Surgery') {
        if (!appointment.consentSignatureChain || appointment.consentSignatureChain.length === 0) {
            return { 
                isBlocked: true, 
                reason: 'Surgical procedure requires Red-Button Affirmation Seal.',
                modal: { 
                    type: 'consentCapture', 
                    props: { 
                        patient, 
                        appointment, 
                        template: fieldSettings.consentFormTemplates.find(t => t.id === 'GENERAL_AUTHORIZATION'), 
                        procedure 
                    } 
                } 
            };
        }
    }

    // 3. Medical History Verification Gate
    if (!appointment.medHistoryAffirmation) {
         return { 
             isBlocked: true, 
             reason: 'Medical history requires today\'s affirmation seal.', 
             modal: { type: 'medicalHistoryAffirmation', props: { patient, appointment } } 
         };
    }

    // 4. Financial Alignment Check
    if (appointment.planId) {
        const plan = patient.treatmentPlans?.find(p => p.id === appointment.planId);
        if (plan && plan.status === TreatmentPlanStatus.PENDING_FINANCIAL_CONSENT) {
            return { 
                isBlocked: true, 
                reason: 'Phase Estimate requires signature before proceeding.', 
                modal: { type: 'financialConsent', props: { patient, plan } } 
            };
        }
    }

    return { isBlocked: false, reason: '' };
};

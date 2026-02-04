import { Appointment, Patient, FieldSettings, User, UserRole, TreatmentPlanStatus, ProcedureItem, AppointmentStatus } from '../types';
import { isExpired } from '../constants';
import { checkClinicalProtocols } from './protocolEnforcement';
import { validateSignatureChain } from './signatureVerification';

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
    // 1. Practitioner License & Authority
    if (isExpired(provider.prcExpiry)) {
        return { isBlocked: true, reason: `CLINICAL AUTHORITY LOCK: Practitioner ${provider.name}'s PRC license has expired. Cannot start treatment.` };
    }
    const procedure = fieldSettings.procedures.find(p => p.name === appointment.type);
    
    if (!procedure && !appointment.isBlock) {
        return { isBlocked: true, reason: `Data Integrity Error: The procedure "${appointment.type}" does not exist in the clinical catalog. Cannot proceed.` };
    }
    
    if (procedure) {
        const highRiskCats = ['Surgery', 'Endodontics', 'Prosthodontics'];
        const isHighRisk = highRiskCats.includes(procedure.category || '');
        if (isHighRisk && isExpired(provider.malpracticeExpiry)) {
            return { isBlocked: true, reason: `INDEMNITY LOCK: ${provider.name}'s Malpractice Insurance has expired. High-risk procedure '${procedure.name}' cannot be started.` };
        }
        if (procedure.allowedLicenseCategories && !procedure.allowedLicenseCategories.includes(provider.licenseCategory!)) {
            return { isBlocked: true, reason: `Scope of Practice Violation: ${procedure.name} requires a ${procedure.allowedLicenseCategories.join('/')} license. ${provider.name} is a ${provider.licenseCategory}.`};
        }
    }
    
    // 2. Patient Registration Status
    if (patient.registrationStatus !== 'Complete') {
        return { isBlocked: true, reason: 'Patient registration is incomplete.', modal: { type: 'incompleteRegistration', props: { patient, missingItems: ['Signature', 'Medical History Section'], riskLevel: 'High' } } };
    }

    // 3. Medical History Affirmation for today's session
    if (!appointment.medHistoryAffirmation) {
         return { isBlocked: true, reason: 'Patient medical history must be affirmed for today\'s session.', modal: { type: 'medicalHistoryAffirmation', props: { patient, appointment } } };
    }

    // 4. Clinical Protocols
    if (fieldSettings.features.enableClinicalProtocolAlerts && procedure) {
        const { violations, rule } = checkClinicalProtocols(patient, procedure, fieldSettings.clinicalProtocolRules || []);
        if (violations.length > 0 && rule) {
            return { isBlocked: true, reason: violations[0], modal: { type: 'protocolOverride', props: { rule, appointment } } };
        }
    }

    // 5. Emergency Consent Pathway
    if (appointment.triageLevel === 'Level 1: Trauma/Bleeding') {
        if (!appointment.emergencyConsent) {
            return { 
                isBlocked: true, 
                reason: 'Emergency treatment requires verbal consent with two witnesses.',
                modal: { type: 'emergencyConsent', props: { patient, appointment } }
            };
        }
        if ((appointment.emergencyConsent.twoWitnessClinicians?.length || 0) < 2) {
            return {
                isBlocked: true,
                reason: 'Emergency protocol requires two clinical witnesses.',
                modal: { type: 'emergencyConsent', props: { patient, appointment } } // Re-open to add witnesses
            };
        }
        // If emergency consent is valid, bypass standard consent checks
        return { isBlocked: false, reason: '' };
    }

    // 6. Standard Consent
    if (procedure?.requiresConsent) {
        // FIX #4: Consent Form Template Validation
        const consentTemplate = fieldSettings.consentFormTemplates.find(
          t => t.id === 'GENERAL_AUTHORIZATION'
        );

        if (!consentTemplate || !consentTemplate.content_en || !consentTemplate.content_tl) {
          return { 
            isBlocked: true, 
            reason: 'SYSTEM ERROR: Consent template is missing or invalid. Cannot proceed.',
            modal: { 
              type: 'safetyAlert', 
              props: { 
                title: 'Configuration Error', 
                message: 'Required consent templates are not properly configured.' 
              } 
            }
          };
        }
        
        const latestConsent = appointment.consentSignatureChain?.[appointment.consentSignatureChain.length - 1];

        if (!latestConsent) {
            return { isBlocked: true, reason: 'Procedure requires signed consent.', modal: { type: 'consentCapture', props: { patient, appointment, template: consentTemplate, procedure } } };
        }
        
        if (latestConsent.expiresAt && new Date(latestConsent.expiresAt) < new Date()) {
            return { 
                isBlocked: true, 
                reason: 'Consent has expired. New consent required.',
                modal: { type: 'consentCapture', props: { patient, appointment, template: consentTemplate, procedure } }
            };
        }
        
        const chainValidation = validateSignatureChain(appointment.consentSignatureChain!);
        if (!chainValidation.valid) {
            return { 
                isBlocked: true, 
                reason: `CONSENT CHAIN COMPROMISED: ${chainValidation.errors.join(', ')}. Cannot proceed.`,
                modal: { type: 'safetyAlert', props: { title: 'Consent Chain Compromised', message: 'The consent signature chain has been tampered with.', errors: chainValidation.errors } }
            };
        }
    }
    
    // 7. WHO Safety Checklist
    if (procedure?.requiresSurgicalConsent) {
        if (!appointment.safetyChecklistChain || appointment.safetyChecklistChain.length === 0) {
            return {
                isBlocked: true,
                reason: 'WHO Surgical Safety Checklist required for this procedure.',
                modal: { type: 'safetyTimeout', props: { appointment, procedure } }
            };
        }
    }

    // 8. Sterilization
    if (fieldSettings.features.enableMaterialTraceability && procedure?.traySetup && procedure.traySetup.length > 0 && !appointment.sterilizationVerified) {
        return { isBlocked: true, reason: 'Procedure requires sterilization verification.', modal: { type: 'sterilizationVerification', props: { appointment, requiredSets: procedure.traySetup, instrumentSets: fieldSettings.instrumentSets || [], sterilizationCycles: fieldSettings.sterilizationCycles || [] } } };
    }

    // 9. Financial Consent for Plans
    if (appointment.planId) {
        const plan = patient.treatmentPlans?.find(p => p.id === appointment.planId);
        if (plan && plan.status === TreatmentPlanStatus.PENDING_FINANCIAL_CONSENT) {
            return { isBlocked: true, reason: 'Financial consent for the treatment plan must be captured.', modal: { type: 'financialConsent', props: { patient, plan } } };
        }
    }

    return { isBlocked: false, reason: '' };
};

export const canCompleteAppointment = (
    appointment: Appointment,
    patient: Patient,
    procedure: ProcedureItem | undefined
): MedicolegalBlock => {
    // If a procedure was performed, require post-op handover
    if (appointment.status === AppointmentStatus.TREATING && !appointment.isBlock) {
        if (!appointment.postOpHandoverChain || appointment.postOpHandoverChain.length === 0) {
            return {
                isBlocked: true,
                reason: 'Post-operative handover and patient instructions must be documented.',
                modal: { type: 'postOpHandover', props: { appointment, patient, procedure } }
            };
        }
    }
    
    return { isBlocked: false, reason: '' };
};

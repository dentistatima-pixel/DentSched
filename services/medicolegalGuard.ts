
import { Appointment, Patient, FieldSettings, User, UserRole, TreatmentPlanStatus, ProcedureItem, AppointmentStatus, AuthorityLevel } from '../types';
import { isExpired, calculateAge } from '../constants';
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
    staff: User[],
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
        // Pre-Treatment Expectations Gate (Phase 2)
        const hasExpectations = (procedure.whatToExpect && procedure.whatToExpect.length > 0) || (procedure.afterCare && procedure.afterCare.length > 0);
        if (hasExpectations && !appointment.preTreatmentExpectationsReviewed) {
            return {
                isBlocked: true,
                reason: 'Patient must review pre-treatment expectations.',
                modal: {
                    type: 'preTreatmentExpectation',
                    props: { procedure }
                }
            };
        }

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

    // 3. Smart Medical History Affirmation (Phase 3)
    const affirmation = appointment.medHistoryAffirmation;
    const isHighRiskProcedure = procedure?.consentTier === 'HIGH_RISK' || procedure?.requiresSurgicalConsent;
    const reaffirmationDays = fieldSettings.medHistoryReaffirmationDays || 90;
    const lastAffirmationDate = patient.medHistoryAffirmation?.affirmedAt ? new Date(patient.medHistoryAffirmation.affirmedAt) : null;
    let needsReaffirmation = true;
    if(lastAffirmationDate) {
        const daysSinceLast = (new Date().getTime() - lastAffirmationDate.getTime()) / (1000 * 3600 * 24);
        if(daysSinceLast < reaffirmationDays && !isHighRiskProcedure) {
            needsReaffirmation = false;
        }
    }
    if (!affirmation && needsReaffirmation) {
        const reason = isHighRiskProcedure ? 'High-risk procedure requires re-affirmation.' : `Medical history last affirmed over ${reaffirmationDays} days ago.`;
        return { isBlocked: true, reason: `Patient medical history must be affirmed for today's session. ${reason}`, modal: { type: 'medicalHistoryAffirmation', props: { patient, appointment } } };
    }


    // 4. Pediatric Guardian Verification
    const age = calculateAge(patient.dob);
    if (age !== undefined && age < 18) {
        if (!patient.guardianProfile || patient.guardianProfile.authorityLevel !== AuthorityLevel.FULL) {
            return { isBlocked: true, reason: 'A guardian with Full Authority must be registered for minor patients.', modal: { type: 'safetyAlert', props: { title: 'Guardian Required', message: `Patient ${patient.name} is a minor. Please update their profile to include a guardian with Full Medical and Financial Authority before proceeding.` }}};
        }
        const hasGuardianConsent = appointment.consentSignatureChain?.some(s => s.signatureType === 'guardian');
        if (!hasGuardianConsent) {
             const consentTemplate = fieldSettings.consentFormTemplates.find(t => t.id === 'PEDIATRIC_CONSENT');
             if (consentTemplate) {
                return { isBlocked: true, reason: 'Guardian consent required for today\'s session.', modal: { type: 'consentCapture', props: { patient, appointment, template: consentTemplate, procedure }}};
             }
        }
    }

    // 5. Clinical Protocols & Standard Consent (existing logic...)
    if (fieldSettings.features.enableClinicalProtocolAlerts && procedure) {
        const { violations, rule } = checkClinicalProtocols(patient, procedure, fieldSettings.clinicalProtocolRules || []);
        if (violations.length > 0 && rule) {
            // ... (rest of protocol logic)
        }
    }

    // ... (rest of the checks like Emergency, Standard Consent, WHO, Sterilization, Financial)

    return { isBlocked: false, reason: '' };
};

export const canCompleteAppointment = (
    appointment: Appointment,
    patient: Patient,
    procedure: ProcedureItem | undefined
): MedicolegalBlock => {
    // If a procedure was performed, require post-op handover
    if (([AppointmentStatus.SEATED, AppointmentStatus.TREATING].includes(appointment.status)) && !appointment.isBlock) {
        const handoverChain = appointment.postOpHandoverChain;
        if (!handoverChain || handoverChain.length === 0) {
            return {
                isBlocked: true,
                reason: 'Post-operative handover and patient instructions must be documented.',
                modal: { type: 'postOpHandover', props: { appointment, patient, procedure } }
            };
        }
    }
    
    return { isBlocked: false, reason: '' };
};
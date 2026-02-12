import { useMemo } from 'react';
import { User, Patient, Appointment, ClinicalIncident, UserRole, AuthorityLevel, ProcedureItem } from '../types';
import { calculateAge } from '../constants';

export const useClinicalNotePermissions = (
    currentUser: User, 
    patient: Patient | null, 
    activeAppointmentToday: Appointment | null,
    incidents: ClinicalIncident[],
    isArchitect: boolean,
    isAuthorityLocked: boolean,
    activeProcedureDef?: ProcedureItem
) => {
    const isPediatricBlocked = useMemo(() => {
        if (!patient || (calculateAge(patient.dob) || 18) >= 18 || isArchitect) return false;

        // Medico-legal check: Guardian profile must exist for a minor.
        if (!patient.guardianProfile) return true;

        // Medico-legal check: Guardian must have full authority profile.
        const hasFullGuardian = patient.guardianProfile?.authorityLevel === AuthorityLevel.FULL;
        if (!hasFullGuardian) return true; // Block if guardian authority is not full.

        const consentChain = activeAppointmentToday?.consentSignatureChain;
        if (!consentChain || consentChain.length === 0) return true; // Block if no consent chain exists for today.

        // Medico-legal check: At least one signature in the chain MUST be from a 'guardian'.
        const hasGuardianSignature = consentChain.some(sig => sig.signatureType === 'guardian');

        return !hasGuardianSignature;
    }, [patient, activeAppointmentToday, isArchitect]);

    const hasActiveComplication = useMemo(() => {
        if (!patient) return false;
        return incidents.some(i => i.patientId === patient.id && i.type === 'Complication' && !i.advisoryCallSigned);
    }, [incidents, patient]);
    
    const isMalpracticeExpired = useMemo(() => {
        if (!currentUser.malpracticeExpiry) return false;
        return new Date(currentUser.malpracticeExpiry) < new Date();
    }, [currentUser.malpracticeExpiry]);

    const isHighRiskProcedure = useMemo(() => {
        const highRiskCats = ['Surgery', 'Endodontics', 'Prosthodontics'];
        return highRiskCats.includes(activeProcedureDef?.category || '');
    }, [activeProcedureDef]);

    const isIndemnityLocked = isMalpracticeExpired && isHighRiskProcedure;

    const isLockedForAction = useMemo(() => 
        isAuthorityLocked || 
        isIndemnityLocked || 
        hasActiveComplication || 
        isPediatricBlocked || 
        (!activeAppointmentToday && !isArchitect),
    [isAuthorityLocked, isIndemnityLocked, hasActiveComplication, isPediatricBlocked, activeAppointmentToday, isArchitect]);

    const getLockReason = () => {
        if (isAuthorityLocked) return "Practitioner PRC license is expired. Update profile to restore authority.";
        if (isIndemnityLocked) return "Malpractice insurance is expired. High-risk procedures are suspended.";
        if (hasActiveComplication) return "Patient has an unresolved clinical complication that requires sign-off.";
        if (isPediatricBlocked) return "Minor patient requires a valid guardian consent signature for today's session.";
        if (!activeAppointmentToday && !isArchitect) return "No active appointment found for today. Notes can only be added during a session.";
        return "Mandatory clinical gate triggered. Commitment functions suspended for regulatory protocol.";
    };
    
    return {
        isLockedForAction,
        getLockReason,
    };
};
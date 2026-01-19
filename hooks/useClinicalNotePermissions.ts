import { useMemo } from 'react';
import { User, Patient, Appointment, ClinicalIncident, UserRole, AuthorityLevel, ProcedureItem } from '../types';

export const useClinicalNotePermissions = (
    currentUser: User, 
    patient: Patient | null, 
    activeAppointmentToday: Appointment | null,
    incidents: ClinicalIncident[],
    isArchitect: boolean,
    activeProcedureDef?: ProcedureItem
) => {
    const isPediatricBlocked = useMemo(() => {
        if (!patient || (patient.age || 0) >= 18 || isArchitect) return false;
        const hasTodayConsent = !!activeAppointmentToday?.signedConsentUrl;
        const hasFullGuardian = patient.guardianProfile?.authorityLevel === AuthorityLevel.FULL;
        return !hasTodayConsent || !hasFullGuardian;
    }, [patient, activeAppointmentToday, isArchitect]);

    const hasActiveComplication = useMemo(() => {
        if (!patient) return false;
        return incidents.some(i => i.patientId === patient.id && i.type === 'Complication' && !i.advisoryCallSigned);
    }, [incidents, patient]);

    const isPrcExpired = useMemo(() => {
        if (!currentUser.prcLicense || !currentUser.prcExpiry) return false;
        return new Date(currentUser.prcExpiry) < new Date();
    }, [currentUser.prcExpiry, currentUser.prcLicense]);
    
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
        isPrcExpired || 
        isIndemnityLocked || 
        hasActiveComplication || 
        isPediatricBlocked || 
        (!activeAppointmentToday && !isArchitect),
    [isPrcExpired, isIndemnityLocked, hasActiveComplication, isPediatricBlocked, activeAppointmentToday, isArchitect]);

    const getLockReason = () => {
        if (isPrcExpired) return "Practitioner PRC license is expired. Update profile to restore authority.";
        if (isIndemnityLocked) return "Malpractice insurance is expired. High-risk procedures are suspended.";
        if (hasActiveComplication) return "Patient has an unresolved clinical complication that requires sign-off.";
        if (isPediatricBlocked) return "Minor patient requires guardian consent for today's session.";
        if (!activeAppointmentToday && !isArchitect) return "No active appointment found for today. Notes can only be added during a session.";
        return "Mandatory clinical gate triggered. Commitment functions suspended for regulatory protocol.";
    };
    
    return {
        isLockedForAction,
        getLockReason,
    };
};

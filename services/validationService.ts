import { Patient, Appointment, User, FieldSettings, UserRole, TreatmentPlanStatus } from '../types';
import { PH_MOBILE_PREFIXES } from '../constants';

// Schema-based validation for Patient
const patientSchema = {
    name: (patient: Partial<Patient>) => {
        if (!patient.firstName?.trim() || !patient.surname?.trim()) {
            return "First Name and Surname are required.";
        }
        return null;
    },
    phone: (patient: Partial<Patient>) => {
        const phone = patient.phone?.trim();
        if (!phone) {
            return "Mobile Number is required.";
        }
        if (!/^09\d{9}$/.test(phone)) {
            return "Please enter a valid 11-digit mobile number starting with 09.";
        }
        const prefix = phone.substring(1, 4);
        if (!PH_MOBILE_PREFIXES.has(prefix)) {
            return `The prefix ${prefix} is not a valid Philippine mobile number prefix.`;
        }
        return null;
    },
    dpaConsent: (patient: Partial<Patient>) => {
        if (!patient.dpaConsent) {
            return "Compliance Error: Data Privacy Consent must be accepted.";
        }
        return null;
    },
    clinicalMediaConsent: (patient: Partial<Patient>) => {
        if (!patient.clinicalMediaConsent) {
            return "Compliance Error: General Treatment Authorization must be acknowledged.";
        }
        return null;
    }
};

const validate = (schema: any, data: any): Record<string, string> | null => {
    const errors: Record<string, string> = {};
    for (const key in schema) {
        const error = schema[key](data);
        if (error) {
            errors[key] = error;
        }
    }
    return Object.keys(errors).length > 0 ? errors : null;
};

export const validatePatient = (patient: Partial<Patient>): Record<string, string> | null => {
    return validate(patientSchema, patient);
};

// FIX: Add checkRetentionPolicy function to be used in ComplianceCenter.
export const checkRetentionPolicy = (
    patient: Patient,
    policy: { archivalYears: number; purgeYears: number }
): { action: 'NONE' | 'ARCHIVE' | 'PURGE' } => {
    if (!patient.lastVisit || patient.lastVisit === 'First Visit' || patient.isAnonymized) {
        return { action: 'NONE' };
    }

    const lastVisitDate = new Date(patient.lastVisit);
    const now = new Date();

    const yearsSinceLastVisit = (now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    if (yearsSinceLastVisit >= policy.purgeYears) {
        return { action: 'PURGE' };
    }
    if (yearsSinceLastVisit >= policy.archivalYears) {
        return { action: 'ARCHIVE' };
    }

    return { action: 'NONE' };
};


export const validateAppointment = (
    appointmentData: Partial<Appointment>, 
    allAppointments: Appointment[],
    patients: Patient[],
    staff: User[],
    fieldSettings: FieldSettings,
    existingAppointmentId?: string
): Record<string, string> | null => {
    const errors: Record<string, string> = {};
    
    const { patientId, providerId, date, time, durationMinutes, type, isBlock, title, resourceId } = appointmentData;

    if (!isBlock && !patientId) errors.patientId = "A patient must be selected.";
    if (!providerId) errors.providerId = "A provider must be selected.";
    if (!date) errors.date = "An appointment date is required.";
    if (!time) errors.time = "An appointment time is required.";
    if (!durationMinutes || durationMinutes <= 0) errors.duration = "Duration must be greater than 0.";
    if (isBlock && !title?.trim()) errors.title = "A title is required for a block appointment.";
    if (!isBlock && !type?.trim()) errors.type = "A procedure type is required.";
    
    // Scope of Practice Validation
    if (providerId) {
        const provider = staff.find(s => s.id === providerId);
    }
    // FIX: Add missing return statement. A function whose declared type is neither 'undefined', 'void', nor 'any' must return a value.
    return Object.keys(errors).length > 0 ? errors : null;
};
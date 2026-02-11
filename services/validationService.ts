import { Patient, Appointment, User, FieldSettings, UserRole, RegistrationField } from '../types';

// Valid 3-digit prefixes (after the initial '0')
const PH_MOBILE_PREFIXES = new Set([
    // Globe/TM
    '817', '904', '905', '906', '915', '916', '917', '926', '927', '935', 
    '936', '937', '945', '953', '954', '955', '956', '957', '958', '959', 
    '975', '976', '977', '978', '979', '994', '995', '996', '997',
    // Smart/TNT/Sun
    '813', '907', '908', '909', '910', '912', '918', '919', '920', '921', 
    '922', '923', '924', '925', '928', '929', '930', '931', '932', '933', 
    '934', '938', '939', '940', '941', '942', '943', '944', '946', '947', 
    '948', '949', '950', '951', '961', '963', '964', '965', '966', '967', 
    '968', '969', '970', '971', '980', '981', '989', '992', '998', '999'
]);

export const validatePatient = (patient: Partial<Patient>, fieldSettings: FieldSettings): Record<string, string> | null => {
    const errors: Record<string, string> = {};

    // --- Unified field validation ---
    fieldSettings.identityFields.forEach(field => {
        if (field.isRequired) {
            const value = field.patientKey ? patient[field.patientKey] : patient.customFields?.[field.id];
            
            const isMissing = value === undefined || value === null || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0);

            if (isMissing) {
                errors[field.id] = `${field.label} is a required field.`;
            }
        }
    });
    
    // --- Special format validations ---
    const phone = patient.phone?.trim();
    if (phone && !/^09\d{9}$/.test(phone)) {
        errors.phone = "Please enter a valid 11-digit mobile number starting with 09.";
    } else if (phone) {
        const prefix = phone.substring(1, 4);
        if (!PH_MOBILE_PREFIXES.has(prefix)) {
            errors.phone = `The prefix ${prefix} is not a valid mobile number prefix.`;
        }
    }

    // --- Consent validation ---
    if (!patient.dpaConsent) {
        errors.dpaConsent = "Compliance Error: Data Privacy Consent must be accepted.";
    }
    if (!patient.clinicalMediaConsent) {
        errors.clinicalMediaConsent = "Compliance Error: General Treatment Authorization must be acknowledged.";
    }

    return Object.keys(errors).length > 0 ? errors : null;
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
        if (!isBlock && type && provider?.role === UserRole.DENTAL_ASSISTANT) {
            const procedure = fieldSettings?.procedures.find(p => p.name === type);
            if (procedure?.allowedLicenseCategories && !procedure.allowedLicenseCategories.includes('HYGIENIST')) {
                errors.scope = `Scope Violation: Dental Assistants cannot be assigned to perform '${type}'.`;
            }
        }
    }

    // Conflict validation
    if (date && time && durationMinutes) {
        const proposedStart = new Date(`${date}T${time}`);
        const proposedEnd = new Date(proposedStart.getTime() + durationMinutes * 60000);

        const conflictingAppointment = allAppointments.find(apt => {
            if (existingAppointmentId && apt.id === existingAppointmentId) return false;
            if (apt.date !== date) return false;

            const existingStart = new Date(`${apt.date}T${apt.time}`);
            const existingEnd = new Date(existingStart.getTime() + apt.durationMinutes * 60000);
            
            const overlap = (proposedStart < existingEnd) && (proposedEnd > existingStart);
            if (!overlap) return false;

            if (!apt.isBlock && providerId && apt.providerId === providerId) return true;
            if (resourceId && apt.resourceId === resourceId) return true;
            if (!isBlock && !apt.isBlock && patientId && apt.patientId === patientId) return true;
            
            return false;
        });

        if (conflictingAppointment) {
            const conflictingProvider = staff.find(s => s.id === conflictingAppointment.providerId);
            const conflictingPatient = patients.find(p => p.id === conflictingAppointment.patientId);

            let errorMessage = "Scheduling Conflict: This time slot overlaps with another appointment.";

            if (!conflictingAppointment.isBlock && providerId && conflictingAppointment.providerId === providerId) {
                errorMessage = `Provider Conflict: ${conflictingProvider?.name || 'Provider'} is already booked for "${conflictingAppointment.type}" at ${conflictingAppointment.time}.`;
            } else if (resourceId && conflictingAppointment.resourceId === resourceId) {
                errorMessage = `Resource Conflict: The selected chair/resource is already booked at this time.`;
            } else if (!isBlock && !conflictingAppointment.isBlock && patientId && conflictingAppointment.patientId === patientId) {
                errorMessage = `Patient Conflict: ${conflictingPatient?.name || 'Patient'} already has an overlapping appointment for "${conflictingAppointment.type}" with ${conflictingProvider?.name || 'a provider'}.`;
            }
            
            errors.conflict = errorMessage;
        }
    }

    return Object.keys(errors).length > 0 ? errors : null;
};

export const checkRetentionPolicy = (patient: Patient, retentionPolicy: { archivalYears: number; purgeYears: number }): { action: 'PURGE' | 'ARCHIVE' | 'ACTIVE'; message: string | null } => {
  if (!patient.lastVisit || patient.lastVisit === 'First Visit' || patient.isAnonymized) {
      return { action: 'ACTIVE', message: null };
  }
  const lastVisitDate = new Date(patient.lastVisit);
  const today = new Date();
  const yearsSinceLastVisit = (today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  
  if (yearsSinceLastVisit >= retentionPolicy.purgeYears) {
    return { action: 'PURGE', message: `Patient inactive for ${retentionPolicy.purgeYears} years - anonymization required` };
  }

  if (yearsSinceLastVisit >= retentionPolicy.archivalYears) {
    return { action: 'ARCHIVE', message: `Patient inactive for ${retentionPolicy.archivalYears} years - archive recommended` };
  }
  
  return { action: 'ACTIVE', message: null };
};

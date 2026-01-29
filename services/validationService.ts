
import { Patient, Appointment, User, FieldSettings } from '../types';

export const validatePatient = (patient: Partial<Patient>): Record<string, string> | null => {
    const errors: Record<string, string> = {};

    if (!patient.firstName?.trim() || !patient.surname?.trim()) {
        errors.name = "First Name and Surname are required.";
    }
    if (!patient.phone?.trim()) {
        errors.phone = "Mobile Number is required.";
    } else if (!/^(09)\d{9}$/.test(patient.phone.trim())) {
        errors.phone = "Please enter a valid 11-digit mobile number (e.g., 09171234567).";
    }
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

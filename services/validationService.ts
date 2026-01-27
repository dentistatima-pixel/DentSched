import { Patient, Appointment, User } from '../types';

export const validatePatient = (patient: Partial<Patient>): Record<string, string> | null => {
    const errors: Record<string, string> = {};

    if (!patient.firstName?.trim()) errors.firstName = "First Name is mandatory.";
    if (!patient.surname?.trim()) errors.surname = "Surname is mandatory.";
    if (!patient.phone?.trim()) errors.phone = "Mobile Number is mandatory.";
    if (!patient.dpaConsent) errors.dpaConsent = "Compliance Error: Data Privacy Consent must be accepted.";
    if (!patient.clinicalMediaConsent) errors.clinicalMediaConsent = "Compliance Error: General Treatment Authorization must be acknowledged.";
    
    // Example of a more complex rule
    if (patient.phone && !/^(09)\d{9}$/.test(patient.phone.trim())) {
        errors.phone = "Please enter a valid 11-digit mobile number (e.g., 09171234567).";
    }

    return Object.keys(errors).length > 0 ? errors : null;
};

export const validateAppointment = (
    appointmentData: Partial<Appointment>, 
    allAppointments: Appointment[],
    existingAppointmentId?: string
): Record<string, string> | null => {
    const errors: Record<string, string> = {};
    
    const { patientId, providerId, date, time, durationMinutes, type, isBlock, title } = appointmentData;

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
            
            const existingStart = new Date(`${apt.date}T${apt.time}`);
            const existingEnd = new Date(existingStart.getTime() + apt.durationMinutes * 60000);
            
            const overlap = (proposedStart < existingEnd) && (proposedEnd > existingStart);
            if (!overlap) return false;

            // Check for resource conflict (e.g., chair)
            if (appointmentData.resourceId && apt.resourceId === appointmentData.resourceId) return true;
            // Check for provider conflict
            if (!apt.isBlock && apt.providerId === providerId) return true;
            
            return false;
        });

        if (conflictingAppointment) {
            errors.conflict = "Scheduling Conflict: This time slot overlaps with another appointment for the selected provider or resource.";
        }
    }


    return Object.keys(errors).length > 0 ? errors : null;
};

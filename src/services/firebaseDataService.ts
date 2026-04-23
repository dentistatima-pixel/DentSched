// Placeholder for Firebase services. This file will be expanded when Firebase is fully integrated.
import { Patient, Appointment, FieldSettings } from '../types';

const notImplemented = () => Promise.reject(new Error("Firebase service not implemented."));

export const FirebaseDataService = {
    getPatients: (): Promise<Patient[]> => notImplemented(),
    savePatient: (_patientData: Partial<Patient>): Promise<Patient> => notImplemented(),
    getAppointments: (): Promise<Appointment[]> => notImplemented(),
    saveAppointment: (_appointmentData: Appointment): Promise<Appointment> => notImplemented(),
    getSettings: (): Promise<FieldSettings> => notImplemented(),
    saveSettings: (_newSettings: FieldSettings): Promise<FieldSettings> => notImplemented(),
    uploadFile: (_file: File): Promise<string> => notImplemented(),
};

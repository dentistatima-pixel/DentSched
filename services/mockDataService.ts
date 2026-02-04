import { Patient, Appointment, FieldSettings, Branch } from '../types';
import { 
    PATIENTS, APPOINTMENTS, 
    DEFAULT_SETTINGS
} from '../constants';

// In-memory "database" to simulate a backend
let mockPatients: Patient[] = JSON.parse(JSON.stringify(PATIENTS));
let mockAppointments: Appointment[] = JSON.parse(JSON.stringify(APPOINTMENTS));
let mockSettings: FieldSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const MockDataService = {
    // PATIENTS
    getPatients: async (): Promise<Patient[]> => {
        return Promise.resolve(mockPatients);
    },
    savePatient: async (patientData: Partial<Patient>): Promise<Patient> => {
        const isNew = !patientData.id || !mockPatients.some(p => p.id === patientData.id);
        if (isNew) {
            const newPatient = { ...patientData, id: patientData.id || `p_${Date.now()}` } as Patient;
            mockPatients.push(newPatient);
            return Promise.resolve(newPatient);
        } else {
            let updatedPatient: Patient | undefined;
            mockPatients = mockPatients.map(p => {
                if (p.id === patientData.id) {
                    updatedPatient = { ...p, ...patientData };
                    return updatedPatient;
                }
                return p;
            });
            if (!updatedPatient) throw new Error("Patient not found for update.");
            return Promise.resolve(updatedPatient);
        }
    },
    
    // APPOINTMENTS
    getAppointments: async (): Promise<Appointment[]> => {
        return Promise.resolve(mockAppointments);
    },
    saveAppointment: async (appointmentData: Appointment): Promise<Appointment> => {
        const isNew = !mockAppointments.some(a => a.id === appointmentData.id);
        if (isNew) {
            mockAppointments.push(appointmentData);
        } else {
            mockAppointments = mockAppointments.map(a => a.id === appointmentData.id ? appointmentData : a);
        }
        return Promise.resolve(appointmentData);
    },

    // SETTINGS
    getSettings: async (): Promise<FieldSettings> => {
        return Promise.resolve(mockSettings);
    },
    saveSettings: async (newSettings: FieldSettings): Promise<FieldSettings> => {
        mockSettings = newSettings;
        return Promise.resolve(mockSettings);
    },

    // FILE UPLOAD (Logo)
    uploadFile: async (file: File): Promise<string> => {
        // In mock mode, we just convert the file to a base64 data URL
        if (!file.type.startsWith('image/')) {
            throw new Error("Only image files are allowed for logos.");
        }
        return blobToBase64(file);
    },
};
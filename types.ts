
export enum UserRole {
  ADMIN = 'Administrator',
  DENTIST = 'Dentist',
  HYGIENIST = 'Hygienist'
}

export enum AppointmentStatus {
  SCHEDULED = 'Scheduled',
  CONFIRMED = 'Confirmed',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  NO_SHOW = 'No Show'
}

export enum AppointmentType {
  CONSULTATION = 'Consultation',
  ORAL_PROPHYLAXIS = 'Oral Prophylaxis',
  RESTORATION = 'Restoration',
  EXTRACTION = 'Extraction',
  ROOT_CANAL = 'Root Canal',
  PROSTHODONTICS = 'Prosthodontics',
  ORTHODONTICS = 'Orthodontics',
  SURGERY = 'Surgery',
  WHITENING = 'Whitening',
  DENTURE_ADJUSTMENTS = 'Denture Adjustments'
}

export type TreatmentStatus = 'Planned' | 'Completed' | 'Existing';

export interface DentalChartEntry {
  toothNumber: number; // 1-32 (Universal System)
  procedure: string;
  status: TreatmentStatus;
  date?: string;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface Patient {
  id: string;
  provisional?: boolean; // True if created via "Lite" booking
  // Basic Info
  suffix?: string;
  name: string; // Full name for display
  firstName: string;
  middleName?: string;
  surname: string;
  homeAddress?: string;
  occupation?: string;
  responsibleParty?: string;
  fatherName?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  dob: string;
  age?: number;
  guardian?: string;
  guardianMobile?: string;
  sex?: 'Male' | 'Female';
  barangay?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;

  // Contact Info
  email: string;
  phone: string;
  mobile2?: string;

  // Dental History
  previousDentist?: string;
  lastVisit: string;
  nextVisit: string | null;
  notes: string;
  treatments?: string[]; 
  treatmentDetails?: Record<string, string>; 
  
  // New Visual Chart
  dentalChart?: DentalChartEntry[];

  // Medical History
  goodHealth?: boolean;
  underMedicalTreatment?: boolean;
  medicalTreatmentDetails?: string;
  seriousIllness?: boolean;
  seriousIllnessDetails?: string;
  lastHospitalization?: string; 
  lastHospitalizationDetails?: string;
  takingMedications?: boolean;
  medicationDetails?: string;
  tobaccoUse?: boolean;
  alcoholDrugsUse?: boolean;
  
  medicalHistoryReviewedBy?: string;
  medicalHistoryReviewedDate?: string;

  // Female Specific
  pregnant?: boolean;
  nursing?: boolean;
  birthControl?: boolean;

  // Lists
  allergies?: string[];
  otherAllergies?: string;
  medicalConditions?: string[];
  otherConditions?: string;
  
  bloodGroup?: string;
}

export interface Appointment {
  id: string;
  patientId: string; // If block, this might be empty or specific string
  providerId: string;
  date: string; // ISO Date string YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  
  // New features
  isBlock?: boolean; // Admin block (Lunch, Meeting)
  title?: string; // Title for blocks
  rescheduleHistory?: {
      previousDate: string;
      previousTime: string;
      reason: 'Reschedule' | 'Correction';
      timestamp: string;
  }[];
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}

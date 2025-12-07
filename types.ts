
export enum UserRole {
  ADMIN = 'Administrator',
  DENTIST = 'Dentist',
  DENTAL_ASSISTANT = 'Dental Assistant'
}

export enum AppointmentStatus {
  SCHEDULED = 'Scheduled',
  CONFIRMED = 'Confirmed',
  ARRIVED = 'Arrived',        // Patient in Lobby
  SEATED = 'Seated',          // Patient in Chair, Numbed/Prepped
  TREATING = 'Treating',      // Doctor is with Patient
  COMPLETED = 'Completed',    // Check out
  CANCELLED = 'Cancelled',
  NO_SHOW = 'No Show'
}

export enum LabStatus {
  NONE = 'None',
  PENDING = 'Pending',   // Sent to lab
  RECEIVED = 'Received'  // Back from lab, ready for insert
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

// --- Field Management Types ---
export interface ProcedureItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  traySetup?: string[]; // List of instruments needed
}

export interface FeatureToggles {
  enableLabTracking: boolean;
  enableComplianceAudit: boolean;
  enableMultiBranch: boolean;
  enableDentalAssistantFlow: boolean;
}

export interface FieldSettings {
  suffixes: string[];
  civilStatus: string[];
  insuranceProviders: string[];
  bloodGroups: string[];
  allergies: string[];
  medicalConditions: string[];
  procedures: ProcedureItem[]; 
  branches: string[];
  features: FeatureToggles;
}

export interface DentalChartEntry {
  toothNumber: number; // 1-32 (Universal System) or 11-48 (FDI)
  procedure: string;
  status: TreatmentStatus;
  surfaces?: string; // e.g. "MOD", "B", "L"
  price?: number; // Snapshot of price at time of charting (can be different from base price)
  date?: string;
  notes?: string;
  author?: string;
}

export interface UserPreferences {
  showTraySetup?: boolean;
  showPatientFlow?: boolean; // Arrived -> Seated -> Treating
  showFinancials?: boolean;
  showLabAlerts?: boolean;
  autoOpenMedicalHistory?: boolean;
  defaultDentition?: 'Adult' | 'Child';
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  email?: string;
  
  // Philippine Regulatory Compliance (Dentists)
  prcLicense?: string;
  prcValidity?: string;
  ptrNumber?: string;
  tin?: string;
  s2License?: string;
  pdaId?: string;
  pdaChapter?: string;
  specialization?: string;
  clinicHours?: string;
  
  // Operational (Assistants)
  employeeId?: string;
  certifications?: string[]; 
  assignedDoctors?: string[]; 
  canViewFinancials?: boolean;

  // Efficiency & Preferences
  allowedBranches?: string[]; 
  defaultBranch?: string; 
  colorPreference?: string; 
  defaultConsultationFee?: number; 
  isReadOnly?: boolean; 
  
  preferences?: UserPreferences; // NEW: Personal toggles
}

export interface Patient {
  id: string;
  provisional?: boolean; 
  // Basic Info
  suffix?: string;
  name: string; 
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
  
  // Visual Chart
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

  // COMPLIANCE TRACKING
  lastDigitalUpdate?: string; // ISO Date of last chart/history edit
  lastPrintedDate?: string | null; // ISO Date of last physical file print
}

export interface Appointment {
  id: string;
  patientId: string; 
  providerId: string;
  branch: string; 
  date: string; 
  time: string; 
  durationMinutes: number;
  type: string; 
  status: AppointmentStatus;
  labStatus?: LabStatus; // For Prostho/Ortho cases
  notes?: string;
  
  isBlock?: boolean; 
  title?: string; 
  rescheduleHistory?: {
      previousDate: string;
      previousTime: string;
      previousProviderId?: string; 
      reason: 'Reschedule' | 'Correction' | 'Provider Change';
      timestamp: string;
  }[];
}

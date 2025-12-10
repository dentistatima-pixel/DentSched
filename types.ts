

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

export type TreatmentStatus = 'Planned' | 'Completed' | 'Existing' | 'Condition';

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

export interface SmsTemplates {
  bookingConfirmation: string; // Sent immediately on save
  confirmationRequest: string; // Sent 48h before
  reminder24h: string;         // Sent 24h before
  postOpCheckup: string;       // Sent 2h after completion
  registrationWelcome: string; // Sent after new patient save
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
  smsTemplates: SmsTemplates; // NEW
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
  phase?: number; // NEW: Treatment Plan Phase (1, 2, 3...)
}

// NEW: Periodontal Data
export interface PerioMeasurement {
  toothNumber: number;
  // 6 points: [Facial-Distal, Facial-Mid, Facial-Mesial, Lingual-Distal, Lingual-Mid, Lingual-Mesial]
  pocketDepths: (number | null)[]; 
  recession: (number | null)[];    
  bleeding: boolean[];             
  mobility: 0 | 1 | 2 | 3 | null;
}

// NEW: Financial Ledger
export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: 'Charge' | 'Payment' | 'Adjustment';
  amount: number;
  balanceAfter: number; // Running balance at that point
  procedureId?: string; // Link to procedure if needed
  notes?: string;
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

  // GLOBAL STAFFING
  roster?: Record<string, string>; // Key: 'Mon', 'Tue'... Value: 'Makati Branch' or 'OFF'
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
  
  // NEW: Perio & Ledger
  perioChart?: PerioMeasurement[];
  ledger?: LedgerEntry[];
  currentBalance?: number;

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

export interface PinboardTask {
    id: string;
    text: string;
    isCompleted: boolean;
    isUrgent: boolean;
    assignedTo?: string; // User ID
    createdAt: number;
}

export interface WaitlistEntry {
    id: string;
    patientName: string;
    procedure: string;
    durationMinutes: number;
    priority: 'High' | 'Normal' | 'Low';
    notes?: string;
}
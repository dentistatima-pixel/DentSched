

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

// --- NEW: Corporate Module Types ---

export enum HMOClaimStatus {
  PREPARED = 'Prepared',
  SUBMITTED = 'Submitted',
  PENDING = 'Pending',
  PAID = 'Paid',
  REJECTED = 'Rejected'
}

export enum StockCategory {
  CONSUMABLES = 'Consumables',
  INSTRUMENTS = 'Instruments',
  RESTORATIVE = 'Restorative',
  PROSTHODONTIC = 'Prosthodontic',
  OFFICE = 'Office Supplies'
}

export interface HMOClaim {
  id: string;
  patientId: string;
  ledgerEntryId: string;
  hmoProvider: string;
  procedureName: string;
  amountClaimed: number;
  amountReceived?: number;
  status: HMOClaimStatus;
  dateSubmitted?: string;
  dateReceived?: string;
  notes?: string;
}

export interface OfficialReceiptBooklet {
  id: string;
  seriesStart: number;
  seriesEnd: number;
  prefix?: string;
  isActive: boolean;
}

export interface IssuedReceipt {
  orNumber: string;
  bookletId: string;
  patientId: string;
  amount: number;
  dateIssued: string;
  isVoid: boolean;
}

export interface StockItem {
  id: string;
  name: string;
  category: StockCategory;
  supplier?: string;
  quantity: number;
  lowStockThreshold: number;
  lastRestockDate?: string;
  expiryDate?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: 'Lab Fee' | 'Supplies' | 'Utilities' | 'Rent' | 'Salary' | 'Other';
  description: string;
  amount: number;
  branch: string;
}

// EXPANDED Audit Log for Governance
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'VIEW' | 'SUBMIT_PLAN' | 'APPROVE_PLAN' | 'REJECT_PLAN' | 'OVERRIDE_ALERT' | 'EXPORT_RECORD';
  entity: 'Patient' | 'Appointment' | 'Ledger' | 'Claim' | 'Stock' | 'TreatmentPlan' | 'ClinicalAlert';
  entityId: string;
  details: string;
}


// --- Field Management Types ---
export interface ProcedureItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  traySetup?: string[]; // List of instruments needed
  requiresConsent?: boolean; // NEW for hard stop
}

export interface FeatureToggles {
  // Foundational
  enableLabTracking: boolean;
  enableComplianceAudit: boolean;
  enableMultiBranch: boolean;
  enableDentalAssistantFlow: boolean;
  
  // Corporate Modules (Phase 1)
  enableHMOClaims: boolean;
  enableInventory: boolean;
  enableAnalytics: boolean;
  enableBIRCompliance: boolean;
  
  // Patient Experience (Phase 2)
  enablePatientPortal: boolean;
  enableDigitalConsent: boolean;
  enableAutomatedRecall: boolean;
  enableOnlineForms: boolean;

  // Advanced Clinical/Admin (Phase 2)
  enableEPrescription: boolean;
  enableAdvancedPermissions: boolean;
  enablePhilHealthClaims: boolean;
  enableLabPortal: boolean;
  enableDocumentManagement: boolean;
  enableClinicalProtocolAlerts: boolean;

  // NEW: Governance & Legal
  enableTreatmentPlanApprovals: boolean; 
  enableAccountabilityLog: boolean;

  // Business Growth (Phase 2)
  enableReferralTracking: boolean;
  enablePromotions: boolean;
}

export interface SmsTemplates {
  bookingConfirmation: string; // Sent immediately on save
  confirmationRequest: string; // Sent 48h before
  reminder24h: string;         // Sent 24h before
  postOpCheckup: string;       // Sent 2h after completion
  registrationWelcome: string; // Sent after new patient save
}

// NEW: Clinical Protocol Rules
export interface ClinicalProtocolRule {
    id: string;
    name: string;
    triggerProcedureCategories: string[]; // e.g., ['Surgery']
    requiresMedicalConditions: string[]; // e.g., ['High BP', 'Diabetes']
    requiresDocumentCategory: string; // e.g., 'Medical Clearance'
    alertMessage: string;
}

// --- NEW: CONTENT MANAGEMENT TYPES ---
export interface Medication {
    id: string;
    name: string;
    dosage: string; // e.g., "500mg"
    instructions: string; // e.g., "Take 1 tablet every 8 hours for 7 days"
}

export interface ConsentFormTemplate {
    id: string;
    name: string;
    content: string; // Markdown/text content with placeholders
}

export interface ClinicalNoteTemplate {
    id: string;
    name: string;
    content: string; // Default text for the note
}


export type ClinicProfile = 'boutique' | 'corporate';

export interface FieldSettings {
  clinicProfile: ClinicProfile;
  suffixes: string[];
  civilStatus: string[];
  insuranceProviders: string[];
  bloodGroups: string[];
  allergies: string[];
  medicalConditions: string[];
  procedures: ProcedureItem[]; 
  branches: string[];
  features: FeatureToggles;
  smsTemplates: SmsTemplates;
  // NEW Corporate Settings
  receiptBooklets?: OfficialReceiptBooklet[];
  stockCategories?: string[];
  expenseCategories?: string[];
  // NEW Document & Protocol Settings
  documentCategories?: string[];
  clinicalProtocolRules?: ClinicalProtocolRule[];
  // NEW Content Management
  medications?: Medication[];
  consentFormTemplates?: ConsentFormTemplate[];
  clinicalNoteTemplates?: ClinicalNoteTemplate[];
  postOpTemplates?: Record<string, string>;
  mediaConsentTemplate?: ConsentFormTemplate;
}

// NEW: Governance Types
export enum TreatmentPlanStatus {
    DRAFT = 'Draft',
    PENDING_REVIEW = 'Pending Review',
    APPROVED = 'Approved & Locked',
    REJECTED = 'Rejected'
}

export interface TreatmentPlan {
    id: string;
    patientId: string;
    name: string;
    createdAt: string;
    createdBy: string; // User's name
    status: TreatmentPlanStatus;
    reviewNotes?: string;
    reviewedBy?: string; // User's name
    reviewedAt?: string;
    // WATER TIGHT: Financial Consent
    signedQuoteUrl?: string;
    quoteSignedAt?: string;
}

// WATER TIGHT: Clinical Record Integrity
export interface DentalChartEntry {
  id: string; // Unique, immutable ID for each entry
  toothNumber: number; // 1-32 (Universal System) or 11-48 (FDI)
  procedure: string;
  status: TreatmentStatus;
  surfaces?: string; // e.g. "MOD", "B", "L"
  price?: number; // Snapshot of price at time of charting
  
  // Financial & Legal
  payment?: number;
  receiptNumber?: string;
  balance?: number;
  signature?: string; // Data URL for signature on this specific note
  drawing?: string; // Data URL for annotation
  
  date?: string;
  notes?: string;
  author?: string;
  planId?: string; // Link to a treatment plan

  // --- IMMUTABILITY & AMENDMENT FIELDS ---
  isVoid?: boolean;
  voidedInfo?: {
      by: string; // User's name
      at: string; // ISO Timestamp
      reason: string;
  };
  amendmentInfo?: {
      amends: string; // ID of the entry being amended
      by: string;     // User's name
      at: string;     // ISO Timestamp
  };
}

export interface PerioMeasurement {
  toothNumber: number;
  // 6 points: [Facial-Distal, Facial-Mid, Facial-Mesial, Lingual-Distal, Lingual-Mid, Lingual-Mesial]
  pocketDepths: (number | null)[]; 
  recession: (number | null)[];    
  bleeding: boolean[];             
  mobility: 0 | 1 | 2 | 3 | null;
}

export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: 'Charge' | 'Payment' | 'Adjustment';
  amount: number;
  balanceAfter: number; // Running balance at that point
  procedureId?: string; // Link to procedure if needed
  notes?: string;
  // NEW Corporate Links
  hmoClaimId?: string; // Link to an HMO Claim
  orNumber?: string; // Official Receipt Number
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
  
  preferences?: UserPreferences;

  // GLOBAL STAFFING
  roster?: Record<string, string>; // Key: 'Mon', 'Tue'... Value: 'Makati Branch' or 'OFF'
}

// NEW: Document Management Type
export interface PatientFile {
    id: string;
    patientId: string;
    title: string;
    category: string;
    fileType: 'image/jpeg' | 'image/png' | 'application/pdf' | 'data_url';
    url: string; // For mock, this will be a placeholder or data URL
    uploadedBy: string; // User ID
    uploadedAt: string; // ISO Date string
}

export interface Patient {
  id: string;
  provisional?: boolean; 
  isArchived?: boolean; // NEW FOR DATA LIFECYCLE
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
  chiefComplaint?: string;
  treatments?: string[]; 
  treatmentDetails?: Record<string, string>; 
  
  // Visual Chart
  dentalChart?: DentalChartEntry[];
  
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
  
  // NEW: Document Management
  files?: PatientFile[];
  
  // NEW: Governance
  treatmentPlans?: TreatmentPlan[];
  
  // NEW: Data Privacy Act Compliance
  dpaConsent?: boolean;
  marketingConsent?: boolean;
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
  
  // NEW: Governance
  signedConsentUrl?: string; // Replaced boolean with data URL for proof
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

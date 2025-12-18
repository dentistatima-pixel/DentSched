
export enum UserRole {
  ADMIN = 'Administrator',
  DENTIST = 'Dentist',
  DENTAL_ASSISTANT = 'Dental Assistant'
}

export enum AppointmentStatus {
  SCHEDULED = 'Scheduled',
  CONFIRMED = 'Confirmed',
  ARRIVED = 'Arrived',
  SEATED = 'Seated',
  TREATING = 'Treating',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  NO_SHOW = 'No Show'
}

export enum LabStatus {
  NONE = 'None',
  PENDING = 'Pending',
  RECEIVED = 'Received'
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
  DENTURE_ADJUSTMENTS = 'Denture Adjustments',
  TELE_DENTISTRY = 'Tele-dentistry Consultation'
}

export type TreatmentStatus = 'Planned' | 'Completed' | 'Existing' | 'Condition';

export enum HMOClaimStatus {
  PREPARED = 'Prepared',
  SUBMITTED = 'Submitted',
  PENDING = 'Pending',
  PAID = 'Paid',
  REJECTED = 'Rejected'
}

export enum PhilHealthClaimStatus {
    PREPARED = 'Prepared',
    SUBMITTED = 'Submitted',
    IN_PROCESS = 'In Process',
    RETURNED = 'Returned',
    PAID = 'Paid'
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

export interface PhilHealthClaim {
    id: string;
    patientId: string;
    ledgerEntryId: string;
    procedureName: string;
    caseRateCode?: string;
    amountClaimed: number;
    amountReceived?: number;
    status: PhilHealthClaimStatus;
    dateSubmitted?: string;
    dateReceived?: string;
    trackingNumber?: string;
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
  batchNumber?: string;
}

export interface SterilizationCycle {
    id: string;
    date: string;
    autoclaveName: string;
    cycleNumber: string;
    operator: string;
    passed: boolean;
}

export interface WasteLogEntry {
    id: string;
    date: string;
    type: 'Sharps' | 'Bio-hazard (Yellow)' | 'Amalgam' | 'General Medical';
    manifestNumber: string;
    transporterName: string;
    weightKg: number;
    collectedBy: string;
}

export interface AssetMaintenanceEntry {
    id: string;
    assetName: string;
    serialNumber: string;
    date: string;
    type: 'Preventive' | 'Repair' | 'Calibration';
    technician: string;
    notes: string;
    nextDueDate?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: 'Lab Fee' | 'Supplies' | 'Utilities' | 'Rent' | 'Salary' | 'Other';
  description: string;
  amount: number;
  branch: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  isVerifiedTimestamp?: boolean; 
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'VIEW' | 'SUBMIT_PLAN' | 'APPROVE_PLAN' | 'REJECT_PLAN' | 'OVERRIDE_ALERT' | 'EXPORT_RECORD' | 'AMEND_RECORD' | 'VOID_RECORD' | 'SIGN_OFF_RECORD' | 'VIEW_RECORD' | 'SECURITY_ALERT' | 'DESTRUCTION_CERTIFICATE' | 'LOG_INCIDENT' | 'CREATE_REFERRAL';
  entity: 'Patient' | 'Appointment' | 'Ledger' | 'Claim' | 'Stock' | 'TreatmentPlan' | 'ClinicalAlert' | 'Inventory' | 'ClinicalNote' | 'Kiosk' | 'System' | 'DataArchive' | 'Incident' | 'Referral';
  entityId: string;
  details: string;
}

export interface ClinicalIncident {
    id: string;
    patientId: string;
    date: string;
    severity: 'Minor' | 'Moderate' | 'Major';
    category: 'Anesthetic Reaction' | 'Instrument Breakage' | 'Unexpected Bleeding' | 'Post-op Infection' | 'Other';
    description: string;
    managementTaken: string;
    reportedBy: string;
}

export interface Referral {
    id: string;
    patientId: string;
    date: string;
    referredTo: string;
    reason: string;
    status: 'Pending' | 'Completed' | 'Declined';
    notes?: string;
}

export interface ProcedureItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  traySetup?: string[];
  requiresConsent?: boolean;
  riskDisclosures?: string[];
  billOfMaterials?: { stockItemId: string; quantity: number }[];
  isPhilHealthCovered?: boolean;
  riskAllergies?: string[]; // NEW: For CDS Drug-Allergy Interaction
}

export interface RolePermissions {
    canVoidNotes: boolean;
    canEditFinancials: boolean;
    canDeletePatients: boolean;
    canOverrideProtocols: boolean;
    canManageInventory: boolean;
}

export interface FeatureToggles {
  enableLabTracking: boolean;
  enableComplianceAudit: boolean;
  enableMultiBranch: boolean;
  enableDentalAssistantFlow: boolean;
  enableHMOClaims: boolean;
  enableInventory: boolean;
  enableAnalytics: boolean;
  enableBIRCompliance: boolean;
  enablePatientPortal: boolean;
  enableDigitalConsent: boolean;
  enableAutomatedRecall: boolean;
  enableOnlineForms: boolean;
  enableEPrescription: boolean;
  enableAdvancedPermissions: boolean;
  enablePhilHealthClaims: boolean;
  enableLabPortal: boolean;
  enableDocumentManagement: boolean;
  enableClinicalProtocolAlerts: boolean;
  enableTreatmentPlanApprovals: boolean; 
  enableAccountabilityLog: boolean;
  enableReferralTracking: boolean;
  enablePromotions: boolean;
}

export interface SmsTemplates {
  bookingConfirmation: string;
  confirmationRequest: string;
  reminder24h: string;
  postOpCheckup: string;
  registrationWelcome: string;
}

export interface ClinicalProtocolRule {
    id: string;
    name: string;
    triggerProcedureCategories: string[];
    requiresMedicalConditions: string[];
    requiresDocumentCategory: string;
    alertMessage: string;
}

export interface Medication {
    id: string;
    name: string;
    dosage: string;
    instructions: string;
    contraindicatedAllergies?: string[];
    isS2Controlled?: boolean;
}

export interface ConsentFormTemplate {
    id: string;
    name: string;
    content: string;
}

export interface ClinicalNoteTemplate {
    id: string;
    name: string;
    content: string;
}

export interface Vendor {
    id: string;
    name: string;
    type: 'Lab' | 'HMO' | 'Supplier' | 'Other';
    contactPerson: string;
    contactNumber: string;
    email: string;
    dsaSignedDate?: string; 
    dsaExpiryDate?: string;
    status: 'Active' | 'Suspended' | 'Pending Review';
    notes?: string;
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
  permissions?: Record<UserRole, RolePermissions>;
  receiptBooklets?: OfficialReceiptBooklet[];
  stockCategories?: string[];
  stockItems?: StockItem[];
  expenseCategories?: string[];
  documentCategories?: string[];
  clinicalProtocolRules?: ClinicalProtocolRule[];
  medications?: Medication[];
  consentFormTemplates?: ConsentFormTemplate[];
  clinicalNoteTemplates?: ClinicalNoteTemplate[];
  postOpTemplates?: Record<string, string>;
  mediaConsentTemplate?: ConsentFormTemplate;
  vendors?: Vendor[]; 
}

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
    createdBy: string;
    status: TreatmentPlanStatus;
    reviewNotes?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    signedQuoteUrl?: string;
    quoteSignedAt?: string;
}

export interface DentalChartEntry {
  id: string;
  toothNumber: number;
  procedure: string;
  status: TreatmentStatus;
  isBaseline?: boolean; 
  surfaces?: string;
  price?: number;
  payment?: number;
  receiptNumber?: string;
  balance?: number;
  signature?: string;
  drawing?: string;
  date?: string; 
  timestamp?: string; 
  isVerifiedTimestamp?: boolean; 
  notes?: string;
  subjective?: string; 
  objective?: string;  
  assessment?: string; 
  plan?: string;       
  author?: string;
  planId?: string;
  isVoid?: boolean;
  isLocked?: boolean; 
  isBilled?: boolean;
  materialBatchId?: string; 
  lockedInfo?: {
      by: string;
      at: string;
  };
  voidedInfo?: {
      by: string;
      at: string;
      reason: string;
  };
  amendmentInfo?: {
      amends: string;
      by: string;
      at: string;
      previousNote: string; // NEW: Strikethrough transparency
  };
}

export interface PerioMeasurement {
  toothNumber: number;
  pocketDepths: (number | null)[]; 
  recession: (number | null)[];    
  bleeding: boolean[];             
  mobility: 0 | 1 | 2 | 3 | null;
}

export type DiscountType = 'None' | 'Senior Citizen' | 'PWD' | 'PhilHealth' | 'HMO' | 'Employee' | 'Promotional';

export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: 'Charge' | 'Payment' | 'Adjustment';
  amount: number;
  balanceAfter: number;
  procedureId?: string;
  notes?: string;
  hmoClaimId?: string;
  philHealthClaimId?: string;
  orNumber?: string;
  discountType?: DiscountType; 
  idNumber?: string;          
}

export interface UserPreferences {
  showTraySetup?: boolean;
  showPatientFlow?: boolean;
  showFinancials?: boolean;
  showLabAlerts?: boolean;
  autoOpenMedicalHistory?: boolean;
  defaultDentition?: 'Adult' | 'Child';
}

export interface ImmunizationRecord {
    type: string;
    date: string;
    remarks?: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  email?: string;
  prcLicense?: string;
  prcExpiry?: string;    
  ptrNumber?: string;
  ptrExpiry?: string;    
  tin?: string;
  s2License?: string;
  s2Expiry?: string;     
  pdaId?: string;
  pdaChapter?: string;
  specialization?: string;
  clinicHours?: string;
  employeeId?: string;
  certifications?: string[]; 
  assignedDoctors?: string[]; 
  canViewFinancials?: boolean;
  allowedBranches?: string[]; 
  defaultBranch?: string; 
  colorPreference?: string; 
  defaultConsultationFee?: number; 
  isReadOnly?: boolean; 
  preferences?: UserPreferences;
  roster?: Record<string, string>;
  immunizations?: ImmunizationRecord[]; // NEW: DOH Compliance
}

export interface PatientFile {
    id: string;
    patientId: string;
    title: string;
    category: string;
    fileType: 'image/jpeg' | 'image/png' | 'application/pdf' | 'data_url';
    url: string;
    uploadedBy: string;
    uploadedAt: string;
}

export interface Patient {
  id: string;
  provisional?: boolean; 
  isArchived?: boolean;
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
  email: string;
  phone: string;
  mobile2?: string;
  previousDentist?: string;
  lastVisit: string;
  nextVisit: string | null;
  notes: string;
  chiefComplaint?: string;
  treatments?: string[]; 
  treatmentDetails?: Record<string, string>; 
  dentalChart?: DentalChartEntry[];
  perioChart?: PerioMeasurement[];
  ledger?: LedgerEntry[];
  currentBalance?: number;
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
  pregnant?: boolean;
  nursing?: boolean;
  birthControl?: boolean;
  allergies?: string[];
  otherAllergies?: string;
  medicalConditions?: string[];
  otherConditions?: string;
  bloodGroup?: string;
  lastDigitalUpdate?: string;
  lastPrintedDate?: string | null; 
  files?: PatientFile[];
  receipts?: IssuedReceipt[]; 
  treatmentPlans?: TreatmentPlan[];
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
  labStatus?: LabStatus;
  labDetails?: {
      shade?: string;
      material?: string;
      notes?: string;
      vendorId?: string; 
  };
  notes?: string;
  sterilizationCycleId?: string;
  sterilizationVerified?: boolean; 
  isBlock?: boolean; 
  title?: string; 
  rescheduleHistory?: {
      previousDate: string;
      previousTime: string;
      previousProviderId?: string; 
      reason: 'Reschedule' | 'Correction' | 'Provider Change';
      timestamp: string;
  }[];
  signedConsentUrl?: string;
}

export interface PinboardTask {
    id: string;
    text: string;
    isCompleted: boolean;
    isUrgent: boolean;
    assignedTo?: string;
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

export interface TelehealthRequest {
    id: string;
    patientId: string;
    patientName: string;
    chiefComplaint: string;
    dateRequested: string;
    status: 'Pending' | 'Scheduled' | 'Completed';
}

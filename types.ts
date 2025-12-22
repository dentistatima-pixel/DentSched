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

export enum HMOClaimStatus {
    SUBMITTED = 'Submitted',
    PAID = 'Paid',
    REJECTED = 'Rejected',
    PENDING = 'Pending'
}

export enum PhilHealthClaimStatus {
    SUBMITTED = 'Submitted',
    PAID = 'Paid',
    REJECTED = 'Rejected',
    PENDING = 'Pending'
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

export interface CpdEntry {
    id: string;
    date: string;
    title: string;
    units: number;
    certificateUrl?: string;
}

export interface InstallmentPlan {
    id: string;
    description: string;
    totalAmount: number;
    paidAmount: number;
    startDate: string;
    monthlyDue: number;
    status: 'Active' | 'Settled' | 'Default';
}

export interface MaintenanceAsset {
    id: string;
    name: string;
    brand?: string;
    lastService: string;
    frequencyMonths: number;
    status: 'Ready' | 'Service Due' | 'Down';
}

export interface ReconciliationRecord {
    id: string;
    date: string;
    branch: string;
    expectedTotal: number;
    actualCash: number;
    actualCard: number;
    actualEWallet: number;
    discrepancy: number;
    notes?: string;
    verifiedBy: string;
    timestamp: string;
}

export interface StockTransfer {
    id: string;
    date: string;
    itemId: string;
    itemName: string;
    fromBranch: string;
    toBranch: string;
    quantity: number;
    initiatedBy: string;
    status: 'Completed';
}

export interface ClearanceRequest {
    id: string;
    patientId: string;
    doctorName: string;
    specialty: string;
    requestedAt: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    approvedAt?: string;
    remarks?: string;
}

export interface TelehealthRequest {
    id: string;
    patientId: string;
    patientName: string;
    chiefComplaint: string;
    dateRequested: string;
    status: 'Pending' | 'Scheduled' | 'Completed';
}

export interface WaitlistEntry {
    id: string;
    patientName: string;
    procedure: string;
    durationMinutes: number;
    priority: 'High' | 'Normal' | 'Low';
    notes?: string;
}

export interface ClinicalIncident {
    id: string;
    date: string;
    type: 'Injury' | 'Equipment Failure' | 'Allergic Reaction' | 'Data Breach' | 'Other';
    patientId?: string;
    description: string;
    actionTaken: string;
    reportedBy: string;
    npcNotified?: boolean;
    npcRefNumber?: string;
}

export interface Referral {
    id: string;
    date: string;
    patientId: string;
    referredTo: string;
    reason: string;
    status: 'Pending' | 'Sent' | 'Completed';
}

export interface WasteLogEntry {
    id: string;
    date: string;
    type: 'Sharps' | 'Infectious' | 'Chemical' | 'General';
    quantity: string;
    disposalMethod: string;
    operator: string;
}

export enum StockCategory {
  CONSUMABLES = 'Consumables',
  INSTRUMENTS = 'Instruments',
  RESTORATIVE = 'Restorative',
  PROSTHODONTIC = 'ProsthodONTIC',
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
    claimFormType: 'CF-2' | 'CF-4';
    caseRateAmount?: number;
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
  branch?: string;
}

export interface SterilizationCycle {
    id: string;
    date: string;
    autoclaveName: string;
    cycleNumber: string;
    operator: string;
    passed: boolean;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  type: 'Sick' | 'Vacation' | 'Conference' | 'Emergency';
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason?: string;
}

export interface StaffShift {
  id: string;
  staffId: string;
  date: string;
  branch: string;
  isOnCall: boolean;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: 'Lab Fee' | 'Supplies' | 'Utilities' | 'Rent' | 'Salary' | 'Other';
  description: string;
  amount: number;
  branch: string;
  staffId?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  isVerifiedTimestamp?: boolean; 
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'VIEW' | 'SUBMIT_PLAN' | 'APPROVE_PLAN' | 'REJECT_PLAN' | 'OVERRIDE_ALERT' | 'EXPORT_RECORD' | 'AMEND_RECORD' | 'VOID_RECORD' | 'SIGN_OFF_RECORD' | 'VIEW_RECORD' | 'SECURITY_ALERT' | 'DESTRUCTION_CERTIFICATE' | 'LOG_INCIDENT' | 'CREATE_REFERRAL' | 'ORTHO_ADJUSTMENT' | 'CREATE_PO' | 'UPDATE_ROSTER' | 'SEND_SMS' | 'DAILY_RECONCILE' | 'STOCK_TRANSFER' | 'MD_CLEARANCE_REQUEST' | 'SEAL_RECORD' | 'NPC_BREACH_REPORT';
  entity: 'Patient' | 'Appointment' | 'Ledger' | 'Claim' | 'Stock' | 'TreatmentPlan' | 'ClinicalAlert' | 'Inventory' | 'ClinicalNote' | 'Kiosk' | 'System' | 'DataArchive' | 'Incident' | 'Referral' | 'OrthoRecord' | 'Procurement' | 'StaffRoster' | 'SmsQueue' | 'CashBox' | 'Credential';
  entityId: string;
  details: string;
}

export interface OrthoAdjustment {
    id: string;
    date: string;
    bracketType: string;
    archWireUpper?: string;
    archWireLower?: string;
    elastics?: string;
    notes?: string;
    dentist: string;
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
  riskAllergies?: string[]; 
}

export interface RolePermissions {
    canVoidNotes: boolean;
    canEditFinancials: boolean;
    canDeletePatients: boolean;
    canOverrideProtocols: boolean;
    canOverrideMandatoryMedical: boolean;
    canOverrideClinicalSafety?: boolean;
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
  enableSmsAutomation: boolean;
}

export type SmsCategory = 'Onboarding' | 'Safety' | 'Logistics' | 'Recovery' | 'Financial' | 'Security' | 'Efficiency' | 'Reputation';

export interface SmsTemplateConfig {
  id: string;
  label: string;
  text: string;
  enabled: boolean;
  category: SmsCategory;
  triggerDescription: string;
}

export type SmsTemplates = Record<string, SmsTemplateConfig>;

export interface ClinicalProtocolRule {
    id: string;
    name: string;
    triggerProcedureCategories: string[];
    requiresMedicalConditions: string[];
    requiresDocumentCategory: string;
    alertMessage: string;
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

export interface Medication {
    id: string;
    name: string;
    dosage: string;
    instructions: string;
    contraindicatedAllergies?: string[];
    interactions?: string[]; // Medication names it conflicts with
    pediatricDosage?: string; // age-based guidelines
    isS2Controlled?: boolean;
}

export interface ConsentFormTemplate {
    id: string;
    name: string;
    content: string;
}

export interface PurchaseOrderItem {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
}

export interface PurchaseOrder {
    id: string;
    vendorId: string;
    date: string;
    items: PurchaseOrderItem[];
    status: 'Pending' | 'Ordered' | 'Received';
    totalAmount: number;
}

export interface FieldSettings {
  clinicProfile: ClinicProfile;
  suffixes: string[];
  civilStatus: string[];
  insuranceProviders: string[];
  boundaryAlerts?: boolean;
  bloodGroups: string[];
  allergies: string[];
  medicalConditions: string[];
  procedures: ProcedureItem[]; 
  branches: string[];
  features: FeatureToggles;
  smsTemplates: SmsTemplates;
  permissions?: Record<UserRole, RolePermissions>;
  stockItems?: StockItem[];
  medications?: Medication[];
  consentFormTemplates?: ConsentFormTemplate[];
  vendors?: Vendor[]; 
  leaveRequests?: LeaveRequest[];
  shifts?: StaffShift[];
  reputationSettings?: {
      googleReviewLink?: string;
      npsThreshold: number;
  };
  retentionPolicy?: {
      archivalYears: number;
      purgeYears: number;
  };
  assets?: MaintenanceAsset[];
  stockCategories?: StockCategory[];
  expenseCategories?: string[];
  documentCategories?: string[];
  clinicalProtocolRules?: ClinicalProtocolRule[];
  postOpTemplates?: Record<string, string>;
  clinicalNoteTemplates?: any[];
  mediaConsentTemplate?: ConsentFormTemplate;
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
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNotes?: string;
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
  date?: string; 
  planId?: string;
  author?: string;
  notes?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  isLocked?: boolean;
  isVerifiedTime?: boolean; // Trust flag for non-repudiation
  materialBatchId?: string;
  isVoid?: boolean;
  sealedHash?: string;
  sealedAt?: string;
  originalNoteId?: string;
}

export interface PerioMeasurement {
  id?: string;
  date?: string;
  toothNumber: number;
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
  balanceAfter: number;
  discountType?: string; 
  idNumber?: string;          
  branch?: string;
  procedureId?: string;
}

export interface UserPreferences {
    showFinancials: boolean;
    showTraySetup: boolean;
    showPatientFlow: boolean;
    showLabAlerts: boolean;
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
  tin?: string;
  s2License?: string;
  s2Expiry?: string; 
  specialization?: string;
  defaultBranch?: string; 
  allowedBranches?: string[]; 
  colorPreference?: string; 
  defaultConsultationFee?: number; 
  commissionRate?: number;
  immunizations?: any[];
  preferences?: UserPreferences;
  cpdEntries?: CpdEntry[]; 
  requiredCpdUnits?: number;
  clinicHours?: string;
  roster?: Record<string, string>;
  employeeId?: string;
  assignedDoctors?: string[];
  isReadOnly?: boolean;
}

export interface PatientFile {
    id: string;
    patientId: string;
    title: string;
    category: string;
    fileType: string;
    url: string;
    uploadedBy: string;
    uploadedAt: string;
}

export type RecallStatus = 'Due' | 'Contacted' | 'No Response' | 'Booked';

export interface Patient {
  id: string;
  provisional?: boolean; 
  isArchived?: boolean;
  name: string; 
  firstName: string;
  surname: string;
  homeAddress?: string;
  barangay?: string;
  dob: string;
  age?: number;
  phone: string;
  email: string;
  lastVisit: string;
  nextVisit: string | null;
  notes: string;
  referredById?: string; 
  dentalChart?: DentalChartEntry[];
  perioChart?: PerioMeasurement[];
  ledger?: LedgerEntry[];
  installmentPlans?: InstallmentPlan[]; 
  currentBalance?: number;
  allergies?: string[];
  medicalConditions?: string[];
  treatmentPlans?: TreatmentPlan[];
  dpaConsent?: boolean;
  marketingConsent?: boolean;
  thirdPartyDisclosureConsent?: boolean;
  orthoHistory?: OrthoAdjustment[];
  clearanceRequests?: ClearanceRequest[];
  insuranceProvider?: string;
  sex?: 'Male' | 'Female';
  seriousIllness?: boolean;
  underMedicalTreatment?: boolean;
  chiefComplaint?: string;
  occupation?: string;
  insuranceNumber?: string;
  seriousIllnessDetails?: string;
  medicalTreatmentDetails?: string;
  lastHospitalizationDetails?: string;
  lastHospitalizationDate?: string;
  medicationDetails?: string;
  takingMedications?: boolean;
  tobaccoUse?: boolean;
  alcoholDrugsUse?: boolean;
  pregnant?: boolean;
  nursing?: boolean;
  birthControl?: boolean;
  takingBloodThinners?: boolean;
  takingBisphosphonates?: boolean;
  heartValveIssues?: boolean;
  tookBpMedicationToday?: boolean;
  anesthesiaReaction?: boolean;
  respiratoryIssues?: boolean;
  middleName?: string;
  suffix?: string;
  treatmentDetails?: Record<string, string>;
  responsibleParty?: string;
  fatherName?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  guardian?: string;
  guardianMobile?: string;
  previousDentist?: string;
  otherAllergies?: string;
  otherConditions?: string;
  bloodGroup?: string;
  files?: PatientFile[];
  recallStatus?: RecallStatus; 
  goodHealth?: boolean;
  treatments?: string[];
  mobile2?: string;
  isPwd?: boolean;
  guardianIdType?: string;
  guardianIdNumber?: string;
  relationshipToPatient?: string;
  philHealthCategory?: 'Direct' | 'Indirect' | 'Lifetime' | 'Senior Citizen' | 'PWD';
  philHealthMemberStatus?: 'Member' | 'Dependent';
  philHealthPIN?: string;
  lastDigitalUpdate?: string;
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
      vendorId?: string; 
  };
  notes?: string;
  sterilizationCycleId?: string;
  sterilizationVerified?: boolean; 
  isBlock?: boolean; 
  title?: string; 
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
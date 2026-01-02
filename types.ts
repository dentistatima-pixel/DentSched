
export enum UserRole {
  ADMIN = 'Administrator',
  DENTIST = 'Dentist',
  DENTAL_ASSISTANT = 'Dental Assistant'
}

export enum SystemStatus {
  OPERATIONAL = 'OPERATIONAL',
  DOWNTIME = 'DOWNTIME',
  RECONCILIATION = 'RECONCILIATION'
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

export enum ResourceType {
  CHAIR = 'Dental Chair',
  XRAY = 'Imaging Unit',
  CONSULTATION = 'Consultation Room',
  RECOVERY = 'Recovery Bay'
}

export interface ClinicResource {
  id: string;
  name: string;
  type: ResourceType;
  branch: string;
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
  DENTURE_ADJUSTMENTS = 'Denture Adjustments'
}

export type TriageLevel = 'Level 1: Trauma/Bleeding' | 'Level 2: Acute Pain/Swelling' | 'Level 3: Appliance/Maintenance';

export type TreatmentStatus = 'Planned' | 'Completed' | 'Existing' | 'Condition';

export interface SyncIntent {
    id: string;
    action: 'CREATE_APPOINTMENT' | 'UPDATE_APPOINTMENT' | 'UPDATE_PATIENT' | 'REGISTER_PATIENT' | 'UPDATE_STATUS';
    payload: any;
    timestamp: string;
}

export interface SyncConflict {
    id: string;
    entityType: 'Appointment' | 'Patient';
    localData: any;
    serverData: any;
    timestamp: string;
    resolved: boolean;
}

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
    verifiedByName?: string;
    explanation?: string; // Mandatory for variances
    timestamp: string;
}

export interface CashSession {
  id: string;
  branch: string;
  openedBy: string;
  openedByName: string;
  startTime: string;
  openingBalance: number;
  status: 'Open' | 'Closed';
  endTime?: string;
}

export enum PayrollStatus {
    OPEN = 'Open',
    CLOSED = 'Closed',
    LOCKED = 'Locked'
}

export interface PayrollAdjustment {
    id: string;
    periodId: string;
    amount: number;
    reason: string;
    requestedBy: string;
    status: 'Pending' | 'Approved';
    verifiedBy?: string;
    date: string;
}

export interface CommissionDispute {
    id: string;
    itemId: string; // appointmentId
    note: string;
    status: 'Open' | 'Resolved';
    date: string;
}

export interface PayrollPeriod {
    id: string;
    providerId: string;
    startDate: string;
    endDate: string;
    status: PayrollStatus;
    closedAt?: string;
    lockedAt?: string;
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

export interface WaitlistEntry {
    id: string;
    patientId: string; 
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
    claimFormType: 'CF-2' | 'CF-4';
    caseRateAmount?: number;
}

export interface StockItem {
  id: string;
  name: string;
  category: StockCategory;
  supplier?: string;
  quantity: number;
  physicalCount?: number; 
  lastVerifiedAt?: string; 
  lowStockThreshold: number;
  lastRestockDate?: string;
  expiryDate?: string;
  batchNumber?: string;
  branch?: string;
  isLockedForEvidence?: boolean; 
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
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'VIEW' | 'SUBMIT_PLAN' | 'APPROVE_PLAN' | 'REJECT_PLAN' | 'OVERRIDE_ALERT' | 'EXPORT_RECORD' | 'AMEND_RECORD' | 'VOID_RECORD' | 'SIGN_OFF_RECORD' | 'VIEW_RECORD' | 'SECURITY_ALERT' | 'DESTRUCTION_CERTIFICATE' | 'LOG_INCIDENT' | 'CREATE_REFERRAL' | 'ORTHO_ADJUSTMENT' | 'CREATE_PO' | 'UPDATE_ROSTER' | 'SEND_SMS' | 'DAILY_RECONCILE' | 'STOCK_TRANSFER' | 'MD_CLEARANCE_REQUEST' | 'SEAL_RECORD' | 'NPC_BREACH_REPORT' | 'WORKFLOW_ANOMALY' | 'RESOURCE_CONFLICT' | 'EMERGENCY_CONSUMPTION_BYPASS' | 'OPEN_CASH_DRAWER' | 'CLOSE_CASH_DRAWER' | 'RAISE_COMMISSION_DISPUTE' | 'APPROVE_COMMISSION_ADJUSTMENT' | 'LOCK_PAYROLL_PERIOD' | 'DOWNTIME_BYPASS';
  entity: 'Patient' | 'Appointment' | 'Ledger' | 'Claim' | 'Stock' | 'TreatmentPlan' | 'ClinicalAlert' | 'Inventory' | 'ClinicalNote' | 'Kiosk' | 'System' | 'DataArchive' | 'Incident' | 'Referral' | 'OrthoRecord' | 'Procurement' | 'StaffRoster' | 'SmsQueue' | 'CashBox' | 'Credential' | 'Resource' | 'Payroll';
  entityId: string;
  details: string;
  hash?: string;          
  previousHash?: string;  
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
  enableMaterialTraceability: boolean; 
  enableBirComplianceMode: boolean;
  enableStatutoryBirTrack: boolean; // Dual-track Modular toggle
  enableHmoInsuranceTrack: boolean; // Dual-track Modular toggle
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
    interactions?: string[]; 
    pediatricDosage?: string; 
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
  clinicName: string; // Mandatory Practice Identity
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
  complianceOfficerId?: string; 
  acknowledgedAlertIds?: string[]; 
  resources: ClinicResource[]; 
  currentPrivacyVersion: string; 
  lastHardExportDate?: string; 
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
  isVerifiedTime?: boolean; 
  witnessId?: string;
  witnessName?: string;
  materialBatchId?: string;
  isVoid?: boolean;
  sealedHash?: string;
  sealedAt?: string;
  originalNoteId?: string;
  entryMode?: 'AUTO' | 'MANUAL'; 
  reconciled?: boolean; 
  imageHashes?: string[]; 
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
  entryMode?: 'AUTO' | 'MANUAL'; 
  reconciled?: boolean; 
  orNumber?: string; 
  orDate?: string;   
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
    documentDate?: string; 
    justification?: string; // Rule 9: Indication for Radiograph/Document
}

export type RecallStatus = 'Due' | 'Contacted' | 'No Response' | 'Booked';

export type ConsentCategory = 'Clinical' | 'Marketing' | 'ThirdParty';
export type ConsentStatus = 'Granted' | 'Revoked';

export interface ConsentLogEntry {
    id: string;
    category: ConsentCategory;
    status: ConsentStatus;
    version: string;
    timestamp: string;
    reason?: string;
    staffId: string;
    staffName: string;
}

export enum AuthorityLevel {
    FULL = 'FULL',
    FINANCIAL_ONLY = 'FINANCIAL_ONLY',
    CLINICAL_ONLY = 'CLINICAL_ONLY'
}

export interface GuardianProfile {
    legalName: string;
    mobile: string;
    email: string;
    idType: string;
    idNumber: string;
    relationship: string;
    authorityLevel: AuthorityLevel;
    linkedPatientId?: string; 
    identityOath?: string;
    forensicFingerprint?: string;
    visualAnchorHash?: string; // SHA-256 hash of the captured ID snap
    visualAnchorThumb?: string; // Tiny Base64 thumbnail for visual confirmation
}

export interface DpaRequestEntry {
    timestamp: string;
    requestor: string;
    type: string;
    fulfillmentDate: string;
}

export interface Patient {
  id: string;
  provisional?: boolean; 
  isArchived?: boolean;
  isAnonymized?: boolean; 
  isSeniorDependent?: boolean; 
  isEmergencyCase?: boolean; // PDA Rule 2
  primaryDentistId?: string; // PDA Rule 2 (Dentist-of-Record)
  name: string; 
  firstName: string;
  surname: string;
  homeAddress?: string;
  barangay?: string;
  city?: string;
  dob: string;
  age?: number;
  weightKg?: number; // Clinical Safety: Pediatric dosing
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
  reportedMedications?: string[]; 
  treatmentPlans?: TreatmentPlan[];
  dpaConsent?: boolean;
  biometricConsent?: boolean;
  dpaRequestLog?: DpaRequestEntry[];
  marketingConsent?: boolean;
  practiceCommConsent?: boolean; 
  clinicalMediaConsent?: boolean; 
  thirdPartyDisclosureConsent?: boolean;
  thirdPartyAttestation?: boolean; 
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
  attendanceStats?: {
      totalBooked: number;
      completedCount: number;
      noShowCount: number;
      lateCancelCount: number;
  };
  reliabilityScore?: number;
  consentLogs?: ConsentLogEntry[]; 
  guardianProfile?: GuardianProfile; 
}

export interface Appointment {
  id: string;
  patientId: string; 
  providerId: string;
  resourceId?: string; 
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
  queuedAt?: string; 
  triageLevel?: TriageLevel; 
  isStale?: boolean; 
  isPendingSync?: boolean; 
  entryMode?: 'AUTO' | 'MANUAL'; 
  reconciled?: boolean; 
  isWaitlistOverride?: boolean; 
  authorizedManagerId?: string; 
  medHistoryVerified?: boolean; 
  medHistoryVerifiedAt?: string; 
}

export interface PinboardTask {
    id: string;
    text: string;
    isCompleted: boolean;
    isUrgent: boolean;
    assignedTo?: string;
    createdAt: number;
}

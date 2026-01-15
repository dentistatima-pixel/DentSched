export enum UserRole {
  ADMIN = 'Administrator',
  DENTIST = 'Dentist',
  DENTAL_ASSISTANT = 'Dental Assistant',
  SYSTEM_ARCHITECT = 'System Architect'
}

export type LicenseCategory = 'DENTIST' | 'HYGIENIST' | 'TECHNOLOGIST';

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

export type TriageLevel = 'Level 1: Trauma/Bleeding' | 'Level 2: Acute Pain/Swelling' | 'Level 3: Appliance/Maintenance';

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
  colorCode?: string;
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
  RECEIVED = 'Received',
  DELAYED = 'Delayed'
}

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
    serialNumber?: string;
    lastService: string;
    frequencyMonths: number;
    status: 'Ready' | 'Service Due' | 'Down';
    branch: string;
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
    explanation?: string; 
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

export interface PayrollAdjustmentTemplate {
    id: string;
    label: string;
    type: 'Credit' | 'Debit';
    defaultAmount?: number;
    category: 'Incentives' | 'Operational' | 'Attendance' | 'Statutory' | 'Other';
}

export interface CommissionDispute {
    id: string;
    itemId: string; 
    note: string;
    status: 'Open' | 'Resolved';
    date: string;
}

export interface PractitionerSignOff {
    timestamp: string;
    hash: string;
    ipAddress: string;
}

export interface PayrollPeriod {
    id: string;
    providerId: string;
    startDate: string;
    endDate: string;
    status: PayrollStatus;
    closedAt?: string;
    lockedAt?: string;
    practitionerSignOff?: PractitionerSignOff;
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

export enum VerificationMethod {
  DIGITAL_UPLOAD = 'Digital Upload',
  PHYSICAL_FILE_VERIFIED = 'Physical File Verified'
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
    verificationMethod?: VerificationMethod;
    verifiedByPractitionerId?: string;
    verifiedByPractitionerName?: string;
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
    type: string;
    patientId?: string;
    patientName?: string;
    description: string;
    actionTaken: string;
    reportedBy: string;
    reportedByName?: string;
    npcNotified?: boolean;
    npcRefNumber?: string;
    advisoryCallSigned?: boolean;
    advisoryLog?: {
        time: string;
        manner: string;
        patientResponse: string;
        witnessId?: string;
    };
}

export interface Referral {
    id: string;
    date: string;
    patientId: string;
    referredTo: string;
    reason: string;
    status: 'Pending' | 'Sent' | 'Completed';
    continuityStatementSigned?: boolean; 
    question?: string; 
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
  bulkUnit?: string;         
  dispensingUnit?: string;   
  conversionFactor?: number; 
  leadTimeDays?: number;
}

export interface InstrumentSet {
    id: string;
    name: string;
    status: 'Sterile' | 'Used' | 'Contaminated';
    lastCycleId?: string;
    branch: string;
}

export interface SterilizationCycle {
    id: string;
    date: string;
    autoclaveName: string;
    cycleNumber: string;
    operator: string;
    passed: boolean;
    sterilizationCapacity?: number;
    restockedItemId?: string;
    instrumentSetIds?: string[];
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  type: ' Sick' | ' Vacation' | 'Conference' | 'Emergency';
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
  category: string;
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
  action: string;
  entity: string;
  entityId: string;
  details: string;
  hash?: string;          
  previousHash?: string;
  impersonatingUser?: { id: string, name: string };
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
  requiresXray?: boolean;
  requiresWitness?: boolean;
  riskDisclosures?: string[];
  billOfMaterials?: { stockItemId: string; quantity: number }[];
  isPhilHealthCovered?: boolean;
  riskAllergies?: string[]; 
  allowedLicenseCategories?: LicenseCategory[];
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

export interface RegistrationField {
  id: string;
  label: string;
  type: 'text' | 'tel' | 'date' | 'email' | 'dropdown' | 'textarea' | 'boolean' | 'header';
  section: 'IDENTITY' | 'CONTACT' | 'INSURANCE' | 'FAMILY' | 'DENTAL' | 'MEDICAL';
  registryKey?: string; 
  width?: 'full' | 'half' | 'third' | 'quarter';
  isCritical?: boolean;
}

export interface FeatureToggles {
  enableLabTracking: boolean;
  enableComplianceAudit: boolean;
  enableMultiBranch: boolean;
  enableDentalAssistantFlow: boolean;
  enableHMOClaims: boolean;
  enableInventory: boolean;
  inventoryComplexity?: 'SIMPLE' | 'ADVANCED';
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
  enableStatutoryBirTrack: boolean; 
  enableHmoInsuranceTrack: boolean; 
}

export type SmsCategory = 'Onboarding' | 'Safety' | 'Logistics' | 'Recovery' | 'Financial' | 'Security' | 'Efficiency' | 'Reputation';

export interface SmsTemplateConfig {
  id: string;
  label: string;
  text: string;
  enabled: boolean;
  category: SmsCategory;
  triggerDescription: string;
  isPdaCompliant?: boolean;
}

export type SmsTemplates = Record<string, SmsTemplateConfig>;

export interface ScheduledSms {
  id: string;
  patientId: string;
  templateId: string;
  dueDate: string;
  data: Record<string, string>;
  status: 'Pending' | 'Sent';
}

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

export interface HospitalAffiliation {
    id: string;
    name: string;
    location: string;
    hotline: string;
}

export type ClinicProfile = 'boutique' | 'corporate';

export interface DaySchedule {
    start: string;
    end: string;
    isClosed: boolean;
}

export interface OperationalHours {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
}

export interface SmsConfig {
    mode: 'LOCAL' | 'CLOUD';
    gatewayUrl: string;
    apiKey: string;
    cloudUrl?: string;
    username?: string;
    password?: string;
    deviceId?: string;
    isPollingEnabled: boolean;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  licenseCategory?: LicenseCategory;
  avatar: string;
  specialization?: string;
  prcLicense?: string;
  prcExpiry?: string;
  s2License?: string;
  s2Expiry?: string;
  ptrNumber?: string;
  tin?: string;
  malpracticeExpiry?: string;
  malpracticePolicy?: string;
  defaultBranch: string;
  allowedBranches: string[];
  colorPreference: string;
  clinicHours?: string;
  roster?: Record<string, string>;
  defaultConsultationFee?: number;
  cpdEntries?: CpdEntry[];
  requiredCpdUnits?: number;
  commissionRate?: number;
  payoutHandle?: string;
}

export enum AppointmentType {
  CONSULTATION = 'Consultation',
  ROOT_CANAL = 'Root Canal',
  EXTRACTION = 'Extraction',
  SURGERY = 'Surgery',
  ORAL_PROPHYLAXIS = 'Oral Prophylaxis',
  WHITENING = 'Whitening'
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
  type: string | AppointmentType;
  status: AppointmentStatus;
  isBlock?: boolean;
  title?: string;
  notes?: string;
  labStatus?: LabStatus;
  labDetails?: {
    vendorId: string;
    materialLotNumber?: string;
    materialCertIssuer?: string;
    materialVerifiedBy?: string;
  };
  sterilizationCycleId?: string;
  sterilizationVerified?: boolean;
  isWaitlistOverride?: boolean;
  authorizedManagerId?: string;
  medHistoryVerified?: boolean;
  medHistoryVerifiedAt?: string;
  followUpConfirmed?: boolean;
  followUpConfirmedAt?: string;
  entryMode?: 'AUTO' | 'MANUAL';
  reconciled?: boolean;
  isPendingSync?: boolean;
  dataTransferId?: string;
  queuedAt?: string;
  isStale?: boolean;
  signedConsentUrl?: string;
  triageLevel?: TriageLevel;
  // Fix: Add missing optional 'postOpVerified' property to the Appointment interface
  postOpVerified?: boolean;
}

export interface Patient {
  id: string;
  name: string;
  firstName: string;
  surname: string;
  middleName?: string;
  suffix?: string;
  dob: string;
  age?: number;
  sex?: string;
  civilStatus?: string;
  bloodGroup?: string;
  bloodPressure?: string;
  phone: string;
  email: string;
  homeAddress?: string;
  city?: string;
  barangay?: string;
  occupation?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  lastVisit: string;
  nextVisit: string | null;
  chiefComplaint?: string;
  notes?: string;
  currentBalance?: number;
  recallStatus: RecallStatus;
  attendanceStats?: {
    totalBooked: number;
    completedCount: number;
    noShowCount: number;
    lateCancelCount: number;
  };
  reliabilityScore?: number;
  treatmentPlans?: TreatmentPlan[];
  dentalChart?: DentalChartEntry[];
  perioChart?: PerioMeasurement[];
  ledger?: LedgerEntry[];
  files?: PatientFile[];
  clearanceRequests?: ClearanceRequest[];
  consentLogs?: ConsentLogEntry[];
  guardianProfile?: {
    legalName: string;
    relationship: string;
    mobile: string;
    occupation?: string;
    idType?: string;
    idNumber?: string;
    authorityLevel: AuthorityLevel;
    visualAnchorThumb?: string;
    visualAnchorHash?: string;
  };
  isPwd?: boolean;
  isSeniorDependent?: boolean;
  marketingConsent?: boolean;
  practiceCommConsent?: boolean;
  dpaConsent?: boolean;
  lastDigitalUpdate?: string;
  weightKg?: number;
  medicationDetails?: string;
  allergies?: string[];
  medicalConditions?: string[];
  takingBloodThinners?: boolean;
  registryAnswers?: Record<string, any>;
  isAnonymized?: boolean;
  referredById?: string;
  orthoHistory?: OrthoAdjustment[];
  installmentPlans?: InstallmentPlan[];
  guardian?: string;
  guardianMobile?: string;
  goodHealth?: boolean;
  reportedMedications?: string[];
  responsibleParty?: string;
  fatherName?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  mobile2?: string;
  previousDentist?: string;
  otherAllergies?: string;
  otherConditions?: string;
  medicalTreatmentDetails?: string;
  seriousIllnessDetails?: string;
  lastHospitalizationDetails?: string;
  lastHospitalizationDate?: string;
  medicationDetails_old?: string;
  underMedicalTreatment?: boolean;
  seriousIllness?: boolean;
  takingMedications?: boolean;
  tobaccoUse?: boolean;
  alcoholDrugsUse?: boolean;
  pregnant?: boolean;
  nursing?: boolean;
  birthControl?: boolean;
  clinicalMediaConsent?: boolean;
  thirdPartyDisclosureConsent?: boolean;
  thirdPartyAttestation?: boolean;
  takingBisphosphonates?: boolean;
  heartValveIssues?: boolean;
  tookBpMedicationToday?: boolean;
  anesthesiaReaction?: boolean;
  respiratoryIssues?: boolean;
  guardianIdType?: string;
  guardianIdNumber?: string;
  relationshipToPatient?: string;
  physicianName?: string;
  physicianSpecialty?: string;
  physicianAddress?: string;
  physicianNumber?: string;
  philHealthPIN?: string;
  philHealthCategory?: string;
  philHealthMemberStatus?: string;
  registrationSignature?: string;
  registrationSignatureTimestamp?: string;
  registrationPhotoHash?: string;
}

export enum TreatmentPlanStatus {
  DRAFT = 'Draft',
  PENDING_REVIEW = 'Pending Review',
  APPROVED = 'Approved',
  COMPLETED = 'Completed',
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
  originalQuoteAmount?: number;
  isComplexityDisclosed?: boolean;
}

export interface PinboardTask {
  id: string;
  text: string;
  isCompleted: boolean;
  isUrgent: boolean;
  assignedTo: string;
}

export type TreatmentStatus = 'Planned' | 'Completed' | 'Existing' | 'Condition';

export interface DentalChartEntry {
  id: string;
  toothNumber: number;
  procedure: string;
  status: TreatmentStatus;
  surfaces?: string;
  date: string;
  price?: number;
  appointmentId?: string;
  author?: string;
  authorRole?: string;
  authorPrc?: string;
  authorPtr?: string;
  sealedHash?: string;
  sealedAt?: string;
  isLocked?: boolean;
  isPrinted?: boolean;
  notes?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  materialBatchId?: string;
  materialVariance?: number;
  instrumentSetId?: string;
  resourceId?: string;
  resourceName?: string;
  sterilizationCycleId?: string;
  imageHashes?: string[];
  boilerplateScore?: number;
  needsProfessionalismReview?: boolean;
  isVerifiedTime?: boolean;
  witnessId?: string;
  witnessName?: string;
  isPendingSupervision?: boolean;
  supervisorySeal?: {
    dentistId: string;
    dentistName: string;
    timestamp: string;
    hash: string;
  };
  originalNoteId?: string;
  isBaseline?: boolean;
  informedRefusal?: {
    reason: string;
    risks: string[];
    timestamp: string;
    signature: string;
  };
  originalPlannedProcedure?: string;
  deviationNarrative?: string;
  financialNarrative?: string;
  planId?: string;
  patientSignature?: string;
  patientSignatureTimestamp?: string;
}

export interface PerioMeasurement {
  date?: string;
  toothNumber: number;
  pocketDepths: (number | null)[];
  recession: (number | null)[];
  bleeding: boolean[];
  mobility: number | null;
}

export interface PatientFile {
  id: string;
  name: string;
  category: string;
  url: string;
  date: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: 'Charge' | 'Payment';
  amount: number;
  balanceAfter: number;
  orNumber?: string;
  orDate?: string;
}

export type ConsentCategory = 'Clinical' | 'Marketing' | 'ThirdParty';

export interface ConsentLogEntry {
  category: ConsentCategory;
  status: 'Given' | 'Revoked';
  timestamp: string;
  version: string;
}

export enum AuthorityLevel {
  FULL = 'Full Medical and Financial',
  FINANCIAL_ONLY = 'Financial Only',
  LIMITED = 'Limited'
}

export type RecallStatus = 'Due' | 'Booked' | 'Overdue' | 'Contacted';

export interface ConsentFormTemplate {
  id: string;
  name: string;
  content: string;
}

export interface PurchaseOrder {
  id: string;
  vendorId: string;
  date: string;
  items: PurchaseOrderItem[];
  status: 'Draft' | 'Sent' | 'Received';
}

export interface PurchaseOrderItem {
  itemId: string;
  quantity: number;
  unitPrice: number;
}

export interface FieldSettings {
  clinicName: string;
  clinicProfile: ClinicProfile;
  clinicLogo?: string;
  strictMode: boolean;
  editBufferWindowMinutes: number;
  suffixes: string[];
  civilStatus: string[];
  sex: string[];
  insuranceProviders: string[];
  bloodGroups: string[];
  nationalities: string[];
  religions: string[];
  relationshipTypes: string[];
  habitRegistry: string[];
  documentCategories: string[];
  allergies: string[];
  medicalConditions: string[];
  identityFields: RegistrationField[];
  fieldLabels: Record<string, string>;
  identityLayoutOrder: string[];
  medicalLayoutOrder: string[];
  identityQuestionRegistry: string[];
  femaleQuestionRegistry: string[];
  medicalRiskRegistry: string[];
  dentalHistoryRegistry: string[];
  criticalRiskRegistry: string[];
  procedures: ProcedureItem[];
  medications: Medication[];
  shadeGuides: string[];
  restorativeMaterials: string[];
  branches: string[];
  resources: ClinicResource[];
  assets: MaintenanceAsset[];
  vendors: Vendor[];
  hospitalAffiliations: HospitalAffiliation[];
  smsTemplates: SmsTemplates;
  smsConfig: SmsConfig;
  operationalHours: OperationalHours;
  consentFormTemplates: ConsentFormTemplate[];
  smartPhrases: any[];
  paymentModes: string[];
  taxConfig: {
    vatRate: number;
    withholdingRate: number;
    nextOrNumber: number;
  };
  features: FeatureToggles;
  permissions: Record<string, RolePermissions>;
  currentPrivacyVersion: string;
  acknowledgedAlertIds: string[];
  retentionPolicy: {
    archivalYears: number;
    purgeYears: number;
  };
  kioskSettings: {
    welcomeMessage: string;
    privacyNotice: string;
  };
  instrumentSets?: InstrumentSet[];
  stockItems?: StockItem[];
  payrollAdjustmentTemplates: PayrollAdjustmentTemplate[];
  expenseCategories: string[];
}

export interface Medication {
    id: string;
    genericName: string;
    brandName?: string;
    dosage: string;
    instructions: string;
    maxMgPerKg?: number;
    contraindicatedAllergies?: string[];
    interactions?: string[];
    isS2Controlled?: boolean;
}

import React from 'react';

export interface Branch {
  id: string;
  name: string;
  legalEntityName: string;
  address: string;
  contactNumber: string;
  email: string;
  tinNumber?: string;
  dtiPermitNumber?: string;
  logoUrl?: string;
  operationalHours: OperationalHours;
}

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

export interface AppNotification {
  id: string;
  type: 'critical' | 'action' | 'info';
  icon: React.ElementType;
  title: string;
  description: string;
  timestamp: string;
  actionType: 'navigate' | 'modal' | 'verify';
  payload: {
    tab?: string;
    entityId?: string;
    modal?: string;
    // other payload data
  };
}

// --- NEW ALERT TYPE ---
export type AlertType = 'medical' | 'allergy' | 'medication' | 'clearance' | 'social' | 'financial' | 'incomplete';

export interface PatientAlert {
  type: AlertType;
  level: 'critical' | 'warning' | 'info';
  message: string;
  icon: React.ElementType;
  colorClass: string;
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
    sessionId: string;
    resolutionStatus?: 'Pending Review' | 'Resolved';
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
    category: 'Incentives' | 'Operational' | 'Attendance' | 'Statutory' | 'Other';
    defaultAmount?: number;
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
    documentCategory?: string;
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
    isDataBreach?: boolean;
    breachDetails?: {
        affectedPatientIds: string[];
        dataTypesCompromised?: Array<'Medical History' | 'Contact Info' | 'Financial' | 'Images' | 'Insurance'>;
        
        discoveryTimestamp: string;
        npcDeadline: string;
        npcNotifiedAt?: string;
        npcRefNumber?: string;
        npcNotificationStatus?: 'Pending' | 'Filed' | 'Late Filing' | 'Exemption Claimed';
        exemptionReason?: string;
        
        patientsNotifiedAt?: string;
        notificationMethod?: 'SMS' | 'Email' | 'Registered Mail' | 'Personal Contact';
        notificationTemplateId?: string;
        
        breachSeverityLevel: 'Minor' | 'Moderate' | 'Severe';
        breachCause?: 'Hacking' | 'Theft' | 'Loss' | 'Unauthorized Access' | 'Accidental Disclosure' | 'Other';
        summary: string;
        
        remediationActions?: Array<{
          action: string;
          responsible: string; // user id
          completedAt?: string;
          status: 'Planned' | 'In Progress' | 'Completed';
        }>;
        rootCauseAnalysis?: string;
        preventiveMeasures?: string;
        
        // Kept from old for compatibility
        remediationSteps?: string[]; 
        dpoApproval?: {
            dpoName: string;
            approvedAt: string;
            signature: string;
        };
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
  rejectionReason?: string;
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
  category: string;
  description: string;
  amount: number;
  branch: string;
  staffId?: string;
  receiptNumber?: string;
  supplierTIN?: string;
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
  defaultDurationMinutes?: number;
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
  type: 'text' | 'tel' | 'date' | 'email' | 'dropdown' | 'textarea' | 'boolean' | 'header' | 'checklist' | 'conditional-text';
  section: 'IDENTITY' | 'CONTACT' | 'INSURANCE' | 'FAMILY' | 'DENTAL' | 'MEDICAL';
  registryKey?: string; 
  width?: 'full' | 'half' | 'third' | 'quarter';
  isCritical?: boolean;
  options?: string[];
  isRequired?: boolean;
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
  enableDigitalConsent: boolean;
  enableAutomatedRecall: boolean;
  enableOnlineForms: boolean;
  enableEPrescription: boolean;
  enableAdvancedPermissions: boolean;
  enablePhilHealthClaims: boolean;
  enableLabPortal: boolean;
  enableDocumentManagement: boolean;
  enableClinicalProtocolAlerts: boolean;
  enableTreatmentPlanApprovals: true; 
  enableAccountabilityLog: true;
  enableReferralTracking: boolean;
  enablePromotions: boolean;
  enableSmsAutomation: boolean;
  enableMaterialTraceability: true; 
  enableBirComplianceMode: boolean;
  enableStatutoryBirTrack: true; 
  enableHmoInsuranceTrack: true; 
  enableDigitalDocent: boolean;
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

export interface SmsLog {
    id: string;
    patientId: string;
    phoneNumber: string;
    message: string;
    templateId: string;
    sentAt: string;
    deliveredAt?: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    failureReason?: string;
    gatewayResponse?: string;
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
    priceBookId?: string;
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
    isPollingEnabled: boolean; // Start on boot

    // Local server config
    gatewayUrl: string; // Local Address
    publicAddress?: string;
    local_username?: string;
    local_password?: string; 
    local_deviceId?: string;

    // Cloud server config
    cloudUrl?: string; // Cloud Address
    cloud_username?: string;
    cloud_password?: string; 
    cloud_deviceId?: string; 
}

export interface PrivacyImpactAssessment {
    id: string;
    date: string;
    processName: string;
    description: string;
    risks: string;
    mitigation: string;
    conductedBy: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin?: string;
  licenseCategory?: LicenseCategory;
  avatar?: string;
  specialization?: string;
  prcLicense?: string;
  prcExpiry?: string;
  prcLicenseStatus?: 'Verified' | 'Unverified' | 'Invalid';
  prcVerificationDate?: string;
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
  status?: 'Active' | 'Inactive';
  payoutHandle?: string;
  showDigitalDocent?: boolean;
}

export type SignatureType = 'patient' | 'guardian' | 'dentist' | 'witness' | 'child';

export interface SignatureChainEntry {
  id: string;
  signatureType: SignatureType;
  signatureDataUrl: string;
  timestamp: string;
  signerName: string;
  signerRole?: string;
  hash: string;
  previousHash: string;
  metadata: {
    deviceInfo: string;
    [key: string]: any; // To embed childAssent data
  };
}

export interface EmergencyTreatmentConsent {
  patientId: string;
  emergencyType: 'Trauma' | 'Severe Pain' | 'Infection' | 'Bleeding';
  triageLevel: 'Level 1: Trauma/Bleeding';
  verbalConsentGiven: boolean;
  verbalConsentWitnessId: string;
  verbalConsentTimestamp: string;
  signatureObtainedPostTreatment: boolean;
  signatureTimestamp?: string;
  emergencyPhotos?: string[];
  emergencyNarrative: string;
  authorizingDentistId: string;
  authorizingDentistSignature: string;
  authorizationTimestamp: string;
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
  isBlock?: boolean;
  title?: string;
  notes?: string;
  planId?: string;
  labStatus?: LabStatus;
  labDetails?: {
    vendorId: string;
    materialLotNumber?: string;
    materialCertIssuer?: string;
    materialVerifiedBy?: string;
  };
  sterilizationCycleId?: string;
  sterilizationVerified?: boolean;
  linkedInstrumentSetIds?: string[];
  isWaitlistOverride?: boolean;
  authorizedManagerId?: string;
  medHistoryVerified?: boolean;
  medHistoryVerifiedAt?: string;
  medHistoryAffirmation?: {
    affirmedAt: string;
    noChanges: boolean;
    notes?: string;
    signature?: string;
  };
  followUpConfirmed?: boolean;
  followUpConfirmedAt?: string;
  entryMode?: 'AUTO' | 'MANUAL';
  reconciled?: boolean;
  isPendingSync?: boolean;
  dataTransferId?: string;
  queuedAt?: string;
  isStale?: boolean;
  consentSignatureChain?: SignatureChainEntry[];
  triageLevel?: TriageLevel;
  postOpVerified?: boolean;
  postOpVerifiedAt?: string;
  isLate?: boolean;
  recurrenceRule?: string;
  recurrenceId?: string;
  modifiedAt?: string;
  safetyChecklistVerified?: boolean;
  statusHistory?: {
      status: AppointmentStatus;
      timestamp: string;
      userId: string;
      userName: string;
  }[];
  cancellationReason?: string;
  emergencyConsent?: EmergencyTreatmentConsent;
}

export enum RegistrationStatus {
  PROVISIONAL = 'Provisional',
  COMPLETE = 'Complete',
}

export interface InformedRefusal {
  id: string;
  patientId: string;
  relatedEntity: {
    type: 'TreatmentPlan' | 'Procedure' | 'Medication' | 'Referral' | 'Diagnostic' | 'FollowUp';
    entityId: string;
    entityDescription: string;
  };
  refusalReason: string;
  risksDisclosed: Array<{
    risk: string;
    acknowledged: boolean;
  }>;
  alternativesOffered: string[];
  dentistRecommendation: string;
  patientUnderstandsConsequences: boolean;
  patientSignature: string;
  patientSignatureTimestamp: string;
  dentistSignature: string;
  dentistSignatureTimestamp: string;
  witnessSignature?: string;
  witnessName?: string;
  formVersion: string;
  printedAt?: string;
  printedByUserId?: string;
}

export interface EPrescription {
  id: string;
  patientId: string;
  medicationId: string; 
  dateIssued: string;
  dosage: string;
  instructions: string;
  quantity: number;
  drugClassification: 'OTC' | 'Rx' | 'S2-Controlled' | 'S3-Controlled';
  dohControlNumber?: string;
  prescriptionPadNumber?: string;
  dentistS2License?: string;
  isAntibiotic?: boolean;
  antibioticJustification?: string;
  overrideReason?: string;
  printedByUserId?: string;
  printedAt?: string;
  isArchived?: boolean;
}

export interface ClinicalMediaConsent {
  generalConsent: boolean;
  consentVersion: string;
  consentTimestamp: string;
  consentSignature: string;
  
  permissions: {
    intraoralPhotos: boolean;
    extraoralPhotos: boolean;
    xrays: boolean;
    videography: boolean;
    caseStudyUse: boolean;
    marketingUse: boolean;
    thirdPartySharing: boolean;
  };
  
  mediaCapturedLogs: Array<{
    sessionId: string;
    date: string;
    capturedBy: string;
    mediaType: 'Photo' | 'Video' | 'X-Ray';
    imageHashes: string[];
    procedure: string;
    device: string;
    consentReconfirmed: boolean;
    purpose: 'Diagnostic' | 'Treatment Planning' | 'Progress' | 'Complication' | 'Marketing';
  }>;
  
  consentRevoked?: boolean;
  revokedAt?: string;
  revocationScope?: 'All Media' | 'Marketing Only' | 'Future Only';
  revocationEvidence?: string;
}

export interface DataDeletionRequest {
  id: string;
  patientId: string;
  requestedAt: string;
  requestedBy: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string; // Lead dentist ID
  anonymizedAt?: string;
  retentionPeriod: number; // Years
}

export interface Patient {
  id: string;
  name: string;
  firstName: string;
  surname: string;
  middleName?: string;
  suffix?: string;
  nickname?: string;
  dob: string;
  sex?: string;
  civilStatus?: string;
  nationality?: string;
  religion?: string;
  bloodGroup?: string;
  bloodPressure?: string;
  phone: string;
  email: string;
  homeAddress?: string;
  city?: string;
  barangay?: string;
  homeNumber?: string;
  officeNumber?: string;
  faxNumber?: string;
  occupation?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  dentalInsurance?: string;
  insuranceEffectiveDate?: string;
  lastVisit: string;
  nextVisit: string | null;
  lastDentalVisit?: string;
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
  researchConsent?: boolean;
  dpaConsent?: boolean;
  lastDigitalUpdate?: string;
  weightKg?: number;
  medicationDetails?: string;
  allergies?: string[];
  medicalConditions?: string[];
  registryAnswers?: Record<string, any>;
  customFields?: { [key: string]: any };
  isAnonymized?: boolean;
  isLockedForInvestigation?: boolean;
  referredById?: string;
  orthoHistory?: OrthoAdjustment[];
  installmentPlans?: InstallmentPlan[];
  responsibleParty?: string;
  previousDentist?: string;
  otherAllergies?: string;
  otherConditions?: string;
  medicalTreatmentDetails?: string;
  seriousIllnessDetails?: string;
  lastHospitalizationDetails?: string;
  lastHospitalizationDate?: string;
  clinicalMediaConsent?: ClinicalMediaConsent;
  thirdPartyDisclosureConsent?: boolean;
  thirdPartyAttestation?: boolean;
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
  familyGroupId?: string;
  communicationLog?: CommunicationLogEntry[];
  registrationStatus?: RegistrationStatus;
  isPendingSync?: boolean;
  registrationBranch?: string;
  consentHistory?: {
      timestamp: string;
      consentType: string;
      granted: boolean;
      ipAddress: string;
      userAgent: string;
      witnessHash?: string;
      expiryDate?: string;
  }[];
  avatarUrl?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
    alternatePhone?: string;
  };
  pediatricConsent?: PediatricConsent;
  informedRefusals?: InformedRefusal[];
  prescriptions?: EPrescription[];
  dataDeletionRequests?: DataDeletionRequest[];
}

export enum TreatmentPlanStatus {
  DRAFT = 'Draft',
  PENDING_REVIEW = 'Pending Review',
  PENDING_FINANCIAL_CONSENT = 'Pending Financial Consent',
  APPROVED = 'Approved',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected',
  RECONFIRMED = 'Reconfirmed'
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
  approvalReason?: string;
  approvalJustification?: string;
  approvalSignature?: string;
  clinicalRationale?: string;
  originalQuoteAmount?: number;
  isComplexityDisclosed?: boolean;
  color?: string;
  financialConsentSignature?: string;
  financialConsentTimestamp?: string;
  discountAmount?: number;
  discountReason?: string;
  consultations?: {
      dentistId: string;
      dentistName: string;
      specialty: string;
      consultDate: string;
      recommendation: string;
      signature: string;
      prcLicense: string;
  }[];
  isMultiDisciplinary?: boolean;
  primaryDentistId?: string; // Lead dentist (final authority)
  reconfirmedBy?: string;
  reconfirmedAt?: string;
}

export interface PinboardTask {
  id: string;
  text: string;
  isCompleted: boolean;
  isUrgent: boolean;
  assignedTo: string;
  createdBy: string;
  patientId?: string;
  dueDate?: Date;
}

export type TreatmentStatus = 'Planned' | 'Completed' | 'Existing' | 'Condition';
export type DentalChartEntryType = 'Restorative' | 'General' | 'Perio' | 'Ortho';

export interface DentalChartEntry {
  id: string;
  toothNumber?: number;
  procedure: string;
  status: TreatmentStatus;
  surfaces?: string;
  date: string;
  price?: number;
  appointmentId?: string;
  author?: string;
  authorId?: string;
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
  imageMetadata?: Array<{
    hash: string;
    fileName: string;
    captureTimestamp: string;
    capturedBy: string;
    device: string;
    toothNumber?: number;
    viewAngle: 'Buccal' | 'Lingual' | 'Occlusal' | 'Lateral' | 'Intraoral' | 'Extraoral';
    consentVerified: boolean;
  }>;
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
  entryType?: DentalChartEntryType;
  isVoided?: boolean;
  voidDetails?: {
    reason: string;
    userId: string;
    userName: string;
    timestamp: string;
  };
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
  notes?: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: 'Charge' | 'Payment' | 'Discount';
  amount: number;
  balanceAfter: number;
  orNumber?: string;
  orDate?: string;
  allocations?: { chargeId: string; amount: number }[];
  paidAmount?: number;
  reconciliationId?: string;
  planId?: string;
}

export type ConsentCategory = 'Clinical' | 'Marketing' | 'ThirdParty';

export interface ConsentLogEntry {
  category: ConsentCategory;
  status: 'Given' | 'Revoked' | 'Expired';
  timestamp: string;
  version: string;
  expiryDate: string;
  renewalNoticeSentAt?: string;
}

export enum AuthorityLevel {
  FULL = 'Full Medical and Financial',
  FINANCIAL_ONLY = 'Financial Only',
  LIMITED = 'Limited'
}

export enum RecallStatus {
  DUE = 'Due',
  BOOKED = 'Booked',
  OVERDUE = 'Overdue',
  CONTACTED = 'Contacted',
}

export interface ConsentFormTemplate {
  id: string;
  name: string;
  content_en: string;
  content_tl: string;
  validityDays?: number;
  requiresRenewal?: boolean;
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
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export interface FamilyGroup {
  id: string;
  familyName: string;
  headOfFamilyId: string;
  memberIds: string[];
}

export interface PriceBook {
  id: string;
  name: string;
  isDefault?: boolean;
}
export interface PriceBookEntry {
  priceBookId: string;
  procedureId: string;
  price: number;
}

export enum CommunicationChannel {
  SMS = 'SMS',
  CALL = 'Call',
  EMAIL = 'Email',
  SYSTEM = 'System'
}
export interface CommunicationLogEntry {
  id: string;
  timestamp: string;
  channel: CommunicationChannel;
  authorId: string; // 'system' or user ID
  authorName: string;
  content: string;
}

export interface ClinicalMacro {
  id: string;
  label: string;
  s: string;
  o: string;
  a: string;
  p: string;
  associatedProcedures?: string[];
}

export interface CommunicationTemplate {
  id: string;
  category: string;
  title: string;
  content: string;
}

export interface FieldSettings {
  clinicName: string;
  clinicProfile: ClinicProfile;
  clinicLogo?: string;
  strictMode: boolean;
  editBufferWindowMinutes: number;
  sessionTimeoutMinutes: number;
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
  branchProfiles: Branch[];
  documentTemplates: Record<string, { name: string; content: string }>;
  communicationTemplates: CommunicationTemplate[];
  branchColors?: Record<string, string>;
  resources: ClinicResource[];
  assets: MaintenanceAsset[];
  vendors: Vendor[];
  hospitalAffiliations: HospitalAffiliation[];
  smsTemplates: SmsTemplates;
  smsConfig: SmsConfig;
  consentFormTemplates: ConsentFormTemplate[];
  smartPhrases: ClinicalMacro[];
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
  sterilizationCycles?: SterilizationCycle[];
  payrollAdjustmentTemplates: PayrollAdjustmentTemplate[];
  expenseCategories: string[];
  practitionerDelays?: Record<string, number>;
  priceBooks?: PriceBook[];
  priceBookEntries?: PriceBookEntry[];
  familyGroups?: FamilyGroup[];
  clinicalProtocolRules?: ClinicalProtocolRule[];
  savedViews?: SavedView[];
  dataProtectionOfficerId?: string;
  privacyImpactAssessments?: PrivacyImpactAssessment[];
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
    drugClassification?: 'OTC' | 'Rx' | 'S2-Controlled' | 'S3-Controlled';
}

export type GovernanceTrack = 'STATUTORY' | 'OPERATIONAL';

// --- NEW TYPES FOR BATCH PRINTING ---
export type PrintJobStatus = 'Pending' | 'Printed';
export type PrintJobReason = 'REGISTRATION_UPDATE' | 'PROCEDURE_COMPLETED' | 'RECEIPT_ISSUED' | 'PLAN_APPROVED';

export interface PrintJob {
  id: string;
  patientId: string;
  patientName: string;
  documentType: string; // e.g., 'Patient Information Sheet'
  templateId: string; // e.g., 'patient_info'
  reason: PrintJobReason;
  createdAt: string;
  status: PrintJobStatus;
  branch: string;
}

// --- NEW TYPES FOR SEARCH & FILTER ---
export interface SavedView {
  id: string;
  name: string;
  context: 'patients' | 'appointments'; // Which view this applies to
  filters: any; // The filter object
}

export interface CommandBarAction {
    id: string;
    name: string;
// FIX: Changed React.ElementType to a more specific ComponentType for better type safety with lucide-react icons.
    icon: React.ComponentType<{ size?: number }>;
    section: 'Actions';
    perform: () => void;
}

export interface PediatricConsent {
    parentConsent: {
        guardianName: string;
        signature: string;
        timestamp: string;
        witnessHash: string;
    };
    
    // NEW: Child's assent (if 7-17 years old)
    childAssent?: {
        childExplanationGiven: boolean; // Doctor explained in child-friendly terms
        childUnderstanding: 'Full' | 'Partial' | 'None';
        childAgreement: boolean; // Child verbally agreed
        childSignature?: string; // Optional for older children
        dentistAttestation: string; // Dentist certifies child was consulted
        timestamp: string;
    };
}

import { User, UserRole, Patient, Appointment, AppointmentType, AppointmentStatus, LabStatus, FieldSettings, HMOClaim, StockItem, StockCategory, Expense, TreatmentPlanStatus, AuditLogEntry, SterilizationCycle, Vendor, SmsTemplates, ResourceType, ClinicResource, InstrumentSet } from './types';

// Generators for mock data
const generateId = () => Math.random().toString(36).substring(2, 9);

// --- DATE UTILITY ---
const getTodayStr = () => new Date().toLocaleDateString('en-CA');
const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-CA');
}
const getPastDateStr = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toLocaleDateString('en-CA');
}
const getFutureDateStr = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('en-CA');
}

export const formatDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return '-';
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
};

export const PDA_FORBIDDEN_COMMERCIAL_TERMS = ['cheap', 'discount', 'best', 'sale', 'promo', 'off', 'free', 'bargain', 'limited time'];
export const CRITICAL_CLEARANCE_CONDITIONS = ['High BP', 'Heart Disease', 'Diabetes', 'Bleeding Issues'];

export const STAFF: User[] = [
  { 
      id: 'ARCHITECT_01', 
      name: 'System Architect (Lead Designer)', 
      role: UserRole.SYSTEM_ARCHITECT, 
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Architect',
      specialization: 'Technical Audit & Design Integrity',
      defaultBranch: 'Makati Branch',
      allowedBranches: ['Makati Branch', 'Quezon City Branch', 'BGC Branch', 'Alabang Branch'],
      colorPreference: '#c026d3', 
      clinicHours: '24/7 System Audit Mode',
  },
  { 
      id: 'admin1', 
      name: 'Sarah Connor', 
      role: UserRole.ADMIN, 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      specialization: 'Clinic Director',
      prcLicense: 'ADMIN-001', 
      ptrNumber: 'PTR-MAIN-001',
      tin: '123-111-222-000',
      defaultBranch: 'Makati Branch',
      allowedBranches: ['Makati Branch', 'Quezon City Branch', 'BGC Branch', 'Alabang Branch'],
      colorPreference: '#ef4444', 
      clinicHours: 'Mon-Sat 8:00AM - 6:00PM',
      roster: { 'Mon': 'Makati Branch', 'Tue': 'Makati Branch', 'Wed': 'Makati Branch', 'Thu': 'Makati Branch', 'Fri': 'Makati Branch' }
  },
  { 
      id: 'doc1', 
      name: 'Dr. Alexander Crentist', 
      role: UserRole.DENTIST, 
      licenseCategory: 'DENTIST',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      specialization: 'General Dentistry',
      prcLicense: '0123456',
      prcExpiry: getFutureDateStr(15), 
      s2License: 'PDEA-S2-8888',
      s2Expiry: getFutureDateStr(200),
      malpracticeExpiry: getFutureDateStr(90),
      malpracticePolicy: 'MP-2024-8891',
      defaultBranch: 'Makati Branch',
      allowedBranches: ['Makati Branch', 'Quezon City Branch'], 
      colorPreference: '#14b8a6', 
      defaultConsultationFee: 500.00,
      roster: { 'Mon': 'Makati Branch', 'Wed': 'Makati Branch', 'Fri': 'Makati Branch', 'Tue': 'Quezon City Branch' }
  }
];

export const PATIENTS: Patient[] = [
    {
        id: 'p_heavy_01',
        name: 'Michael Scott',
        firstName: 'Michael',
        surname: 'Scott',
        insuranceProvider: 'Maxicare',
        dob: '1965-03-15',
        age: 59,
        sex: 'Male',
        phone: '0917-111-2222',
        email: 'm.scott@dunder.com',
        occupation: 'Regional Manager',
        lastVisit: getPastDateStr(2),
        nextVisit: getTomorrowStr(),
        chiefComplaint: 'Checkup on my bridges.',
        notes: 'Very talkative. Loves jokes. Gag reflex.',
        currentBalance: 5000,
        recallStatus: 'Booked',
        attendanceStats: { totalBooked: 10, completedCount: 9, noShowCount: 1, lateCancelCount: 0 },
        reliabilityScore: 90,
        treatmentPlans: [
            { id: 'tp1', patientId: 'p_heavy_01', name: 'Phase 1 - Urgent Care', createdAt: getTodayStr(), createdBy: 'Dr. Alexander Crentist', status: TreatmentPlanStatus.PENDING_REVIEW, reviewNotes: 'Please check #16 for fracture lines before proceeding.' }
        ]
    }
];

export const APPOINTMENTS: Appointment[] = [
    { id: 'apt_today_01', patientId: 'p_heavy_01', providerId: 'doc1', resourceId: 'res_chair_01', branch: 'Makati Branch', date: getTodayStr(), time: '09:00', durationMinutes: 60, type: AppointmentType.CONSULTATION, status: AppointmentStatus.SCHEDULED }
];

export const MOCK_CLAIMS: HMOClaim[] = [
    { id: 'claim_1', patientId: 'p_heavy_01', ledgerEntryId: 'l1', hmoProvider: 'Maxicare', procedureName: 'Restoration', amountClaimed: 2000, status: 0 as any, dateSubmitted: getPastDateStr(1) }
];

export const MOCK_STOCK: StockItem[] = [
    { id: 'stk_1', name: 'Anesthetic Carpules', category: StockCategory.CONSUMABLES, quantity: 50, lowStockThreshold: 20, expiryDate: getFutureDateStr(60) }
];

export const MOCK_RESOURCES: ClinicResource[] = [
    { id: 'res_chair_01', name: 'Chair A', type: ResourceType.CHAIR, branch: 'Makati Branch' },
    { id: 'res_chair_02', name: 'Chair B', type: ResourceType.CHAIR, branch: 'Makati Branch' }
];

export const MOCK_INSTRUMENT_SETS: InstrumentSet[] = [
    { id: 'set_alpha_1', name: 'Surgery Set Alpha', status: 'Sterile', branch: 'Makati Branch' }
];

export const MOCK_STERILIZATION_CYCLES: SterilizationCycle[] = [
    { id: 'cycle_001', date: getPastDateStr(1), autoclaveName: 'Autoclave 1', cycleNumber: '2024-05-20-01', operator: 'Asst. Sarah', passed: true, instrumentSetIds: ['set_alpha_1'] }
];

export const MOCK_EXPENSES: Expense[] = [
    { id: 'exp_1', date: getPastDateStr(1), category: 'Lab Fee', description: 'Crown for M. Scott', amount: 4000, branch: 'Makati Branch' }
];

export const MOCK_AUDIT_LOG: AuditLogEntry[] = [
    { id: 'al1', timestamp: new Date().toISOString(), userId: 'admin1', userName: 'Sarah Connor', action: 'LOGIN', entity: 'System', entityId: 'System', details: 'System Initialized.' }
];

export const MOCK_VENDORS: Vendor[] = [
    { id: 'v1', name: 'Precision Dental Lab', type: 'Lab', contactPerson: 'John Smith', contactNumber: '0917-123-4567', email: 'orders@precisionlab.ph', status: 'Active', dsaSignedDate: '2023-01-15', dsaExpiryDate: '2025-01-15' }
];

const DEFAULT_SMS: SmsTemplates = {
    welcome: { id: 'welcome', label: 'Welcome to Practice', text: 'Welcome to dentsched, {PatientName}! Your digital health record is now active.', enabled: true, category: 'Onboarding', triggerDescription: 'New patient registration.' },
    booking: { id: 'booking', label: 'Booking Confirmation', text: 'Confirmed: {Procedure} on {Date} @ {Time} with {Doctor}.', enabled: true, category: 'Logistics', triggerDescription: 'Appointment scheduled.' }
};

export const DEFAULT_FIELD_SETTINGS: FieldSettings = {
  clinicName: 'Ivory Dental Office',
  clinicProfile: 'boutique',
  strictMode: true,
  editBufferWindowMinutes: 60,
  suffixes: ['Mr', 'Ms', 'Mrs', 'Dr', 'Jr', 'Sr', 'III'],
  civilStatus: ['Single', 'Married', 'Widowed', 'Separated'],
  insuranceProviders: ['Maxicare', 'Intellicare', 'PhilHealth', 'Medicard'],
  bloodGroups: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
  nationalities: ['Filipino', 'American', 'Chinese', 'Japanese', 'British'],
  religions: ['None', 'Roman Catholic', 'Christian', 'Islam', 'Iglesia ni Cristo'],
  // Fix: Removed duplicate relationshipTypes property (previously on line 171/172)
  relationshipTypes: ['Mother', 'Father', 'Legal Guardian', 'Spouse', 'Self'],
  habitRegistry: ['Tobacco Use', 'Alcohol Consumption', 'Vaping', 'Bruxism'],
  documentCategories: ['X-Ray', 'Medical Clearance', 'Lab Result', 'Consent Form'],
  allergies: ['None', 'Local Anesthetic (ex. Lidocaine)', 'Penicillin', 'Antibiotics', 'Sulfa drugs', 'Aspirin', 'Latex'],
  medicalConditions: [
    'High Blood Pressure', 'Low Blood Pressure', 'Epilepsy / Convulsions', 
    'AIDS or HIV Infection', 'Sexually Transmitted disease', 'Stomach Troubles / Ulcers', 
    'Fainting Seizure', 'Rapid Weight Loss', 'Radiation Therapy', 
    'Joint Replacement / Implant', 'Heart Surgery', 'Heart Attack', 'Thyroid Problem',
    'Heart Disease', 'Heart Murmur', 'Hepatitis / Disease', 'Rheumatic Fever', 
    'Hay Fever / Allergies', 'Respiratory Problems', 'Hepatitis / Jaundice', 
    'Tuberculosis', 'Swollen ankles', 'Kidney disease', 'Diabetes', 'Chest pain', 
    'Stroke', 'Cancer / Tumors', 'Anemia', 'Angina', 'Asthma', 'Emphysema', 
    'Bleeding Problems', 'Blood Diseases', 'Head Injuries', 'Arthritis / Rheumatism'
  ],
  // DEFAULT DYNAMIC REGISTRIES
  identityFields: [
    { id: 'nickname', label: 'Nickname', type: 'text', section: 'IDENTITY', width: 'half' },
    { id: 'religion', label: 'Religion', type: 'dropdown', section: 'IDENTITY', registryKey: 'religions', width: 'half' },
    { id: 'nationality', label: 'Nationality', type: 'dropdown', section: 'IDENTITY', registryKey: 'nationalities', width: 'half' },
    { id: 'occupation', label: 'Occupation', type: 'text', section: 'IDENTITY', width: 'half' },
    { id: 'homeNumber', label: 'Home Num', type: 'tel', section: 'CONTACT', width: 'quarter' },
    { id: 'officeNumber', label: 'Office Num', type: 'tel', section: 'CONTACT', width: 'quarter' },
    { id: 'faxNumber', label: 'Fax Num', type: 'tel', section: 'CONTACT', width: 'quarter' },
    { id: 'dentalInsurance', label: 'Dental Insurance', type: 'text', section: 'INSURANCE', width: 'half' },
    { id: 'insuranceEffectiveDate', label: 'Insurance Effective Date', type: 'date', section: 'INSURANCE', width: 'half' },
    { id: 'chiefComplaint', label: 'Reason for dental consultation', type: 'textarea', section: 'DENTAL', width: 'full' },
    { id: 'previousDentist', label: 'Previous Dentist', type: 'text', section: 'DENTAL', width: 'half' },
    { id: 'lastDentalVisit', label: 'Last Dental Visit', type: 'date', section: 'DENTAL', width: 'half' },
  ],
  fieldLabels: {
      firstName: 'First Name',
      middleName: 'Middle Name',
      surname: 'Surname',
      suffix: 'Suffix',
      dob: 'Birth Date',
      age: 'Age',
      sex: 'Sex (M/F)',
      bloodGroup: 'Blood Type',
      homeAddress: 'Home Address',
      city: 'City',
      barangay: 'Barangay',
      phone: 'Cel/Mobile No.',
      email: 'Email Add.',
      homeNumber: 'Home Num',
      officeNumber: 'Office Num',
      faxNumber: 'Fax Num'
  },
  identityLayoutOrder: [
      'core_firstName', 'core_middleName', 'core_surname', 'core_suffix',
      'core_dob', 'core_age', 'core_sex', 'field_nickname',
      'field_religion', 'field_nationality', 'field_occupation',
      'core_homeAddress', 'core_city', 'core_barangay',
      'field_homeNumber', 'field_officeNumber', 'field_faxNumber', 'core_phone', 'core_email',
      'field_dentalInsurance', 'field_insuranceEffectiveDate',
      'field_chiefComplaint',
      'field_previousDentist', 'field_lastDentalVisit'
  ],
  medicalLayoutOrder: [
      'core_physicianName', 'core_physicianSpecialty', 'core_physicianAddress', 'core_physicianNumber',
      'Are you in good health?',
      'Are you under medical treatment now?*',
      'Have you ever had serious illness or surgical operation?*',
      'Have you ever been hospitalized?*',
      'Are you taking any prescription/non-prescription medication?*',
      'Do you use tobacco products?',
      'Do you use alcohol, cocaine or other dangerous drugs?',
      'core_bloodGroup', 'core_bloodPressure',
      'al_None', 'al_Local Anesthetic (ex. Lidocaine)', 'al_Penicillin', 'al_Antibiotics', 'al_Sulfa drugs', 'al_Aspirin', 'al_Latex', 'field_otherAllergies'
  ],
  identityQuestionRegistry: [
    'Are you in good health?',
    'Are you under medical treatment now?*',
    'Have you ever had serious illness or surgical operation?*',
    'Have you ever been hospitalized?*',
    'Are you taking any prescription/non-prescription medication?*',
    'Do you use tobacco products?',
    'Do you use alcohol, cocaine or other dangerous drugs?'
  ],
  femaleQuestionRegistry: [
    'Are you pregnant?',
    'Are you nursing?',
    'Are you taking birth control pills?'
  ],
  medicalRiskRegistry: [
    '[RISK] Taking Blood Thinners? (Aspirin, Warfarin, etc.)',
    '[RISK] Taking Bisphosphonates? (Fosamax, Zometa)',
    '[RISK] History of Heart Valve Issues or Rheumatic Fever?',
    '[RISK] Allergy to Local Anesthesia?',
    '[RISK] Respiratory Conditions? (Asthma, TB, COPD)'
  ],
  dentalHistoryRegistry: [
    'Previous Attending Dentist',
    'Approximate Date of Last Visit'
  ],
  procedures: [
      { id: 'p1', name: 'Consultation', price: 500, category: 'General', allowedLicenseCategories: ['DENTIST'] },
      { id: 'p2', name: 'Restoration', price: 1500, category: 'Restorative', allowedLicenseCategories: ['DENTIST'] }
  ], 
  medications: [
      { id: 'med1', genericName: 'Amoxicillin', dosage: '500mg', instructions: '1 capsule every 8h for 7 days.' }
  ],
  shadeGuides: ['Vita Classical', 'Vita 3D Master', 'Ivoclar'],
  restorativeMaterials: ['Composite', 'Zirconia', 'IPS e.max', 'PFM'],
  branches: ['Makati Branch', 'Quezon City Branch'],
  resources: MOCK_RESOURCES,
  assets: [],
  vendors: MOCK_VENDORS,
  hospitalAffiliations: [
      { id: 'h1', name: 'St. Lukes Medical Center', contact: '02-8789-7700', emergencyHotline: '02-8789-7700' }
  ],
  smsTemplates: DEFAULT_SMS,
  consentFormTemplates: [
      { id: 'c1', name: 'General Consent', content: 'I, {PatientName}, authorize treatment.' }
  ],
  smartPhrases: [
      { id: 'sp1', label: 'Routine Checkup', text: 'Patient in for routine prophylaxis. No acute pain.', category: 'SOAP' }
  ],
  paymentModes: ['Cash', 'GCash', 'Credit Card', 'Check'],
  taxConfig: { vatRate: 12, withholdingRate: 10, nextOrNumber: 1001 },
  features: {
      enableLabTracking: true, enableComplianceAudit: true, enableMultiBranch: true,
      enableDentalAssistantFlow: true, enableHMOClaims: true, enableInventory: true,
      enableAnalytics: true, enablePatientPortal: false, enableDigitalConsent: true,
      enableAutomatedRecall: true, enableOnlineForms: true, enableEPrescription: true,
      enableAdvancedPermissions: true, enablePhilHealthClaims: true, enableLabPortal: true,
      enableDocumentManagement: true, enableClinicalProtocolAlerts: true,
      enableTreatmentPlanApprovals: true, enableAccountabilityLog: true,
      enableReferralTracking: true, enablePromotions: true, enableSmsAutomation: true,
      enableMaterialTraceability: true, enableBirComplianceMode: false,
      enableStatutoryBirTrack: true, enableHmoInsuranceTrack: true
  },
  permissions: {
      [UserRole.ADMIN]: { canVoidNotes: true, canEditFinancials: true, canDeletePatients: true, canOverrideProtocols: true, canOverrideMandatoryMedical: true, canManageInventory: true },
      [UserRole.DENTIST]: { canVoidNotes: false, canEditFinancials: false, canDeletePatients: false, canOverrideProtocols: false, canOverrideMandatoryMedical: false, canManageInventory: true },
      [UserRole.DENTAL_ASSISTANT]: { canVoidNotes: false, canEditFinancials: false, canDeletePatients: false, canOverrideProtocols: false, canOverrideMandatoryMedical: false, canManageInventory: true },
      [UserRole.SYSTEM_ARCHITECT]: { canVoidNotes: true, canEditFinancials: true, canDeletePatients: true, canOverrideProtocols: true, canOverrideMandatoryMedical: true, canManageInventory: true }
  },
  currentPrivacyVersion: '1.0',
  acknowledgedAlertIds: [],
  retentionPolicy: { archivalYears: 10, purgeYears: 15 },
  kioskSettings: { welcomeMessage: 'Welcome to Ivory Dental', privacyNotice: 'We process your data for clinical care.' }
};
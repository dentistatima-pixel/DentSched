import { User, UserRole, Patient, Appointment, AppointmentType, AppointmentStatus, LabStatus, FieldSettings, HMOClaim, StockItem, StockCategory, Expense, TreatmentPlanStatus, AuditLogEntry, SterilizationCycle, Vendor, SmsTemplates, ResourceType, ClinicResource, InstrumentSet, MaintenanceAsset, OperationalHours, SmsConfig, DashboardConfig } from './types';

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
      defaultBranch: 'Makati Main',
      allowedBranches: ['Makati Main', 'Quezon City Satellite', 'BGC Premium', 'Alabang South'],
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
      defaultBranch: 'Makati Main',
      allowedBranches: ['Makati Main', 'Quezon City Satellite', 'BGC Premium', 'Alabang South'],
      colorPreference: '#ef4444', 
      clinicHours: 'Mon-Sat 8:00AM - 6:00PM',
      roster: { 'Mon': 'Makati Main', 'Tue': 'Makati Main', 'Wed': 'Makati Main', 'Thu': 'Makati Main', 'Fri': 'Makati Main' }
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
      defaultBranch: 'Makati Main',
      allowedBranches: ['Makati Main', 'Quezon City Satellite'], 
      colorPreference: '#14b8a6', 
      defaultConsultationFee: 500.00,
      roster: { 'Mon': 'Makati Main', 'Wed': 'Makati Main', 'Fri': 'Makati Main', 'Tue': 'Quezon City Satellite' },
      commissionRate: 0.40
  },
  { 
      id: 'doc2', 
      name: 'Dr. Maria Clara', 
      role: UserRole.DENTIST, 
      licenseCategory: 'DENTIST',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
      specialization: 'Pediatric Dentistry',
      prcLicense: '0654321',
      defaultBranch: 'Quezon City Satellite',
      allowedBranches: ['Makati Main', 'Quezon City Satellite'], 
      colorPreference: '#c026d3', 
      commissionRate: 0.30
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
        nextVisit: getPastDateStr(-1),
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
    { id: 'apt_today_01', patientId: 'p_heavy_01', providerId: 'doc1', resourceId: 'res_chair_01', branch: 'Makati Main', date: getTodayStr(), time: '09:00', durationMinutes: 60, type: 'Initial Consultation & Treatment Planning', status: AppointmentStatus.SCHEDULED }
];

export const MOCK_CLAIMS: HMOClaim[] = [
    { id: 'claim_1', patientId: 'p_heavy_01', ledgerEntryId: 'l1', hmoProvider: 'Maxicare', procedureName: 'Composite Restoration (1 Surface)', amountClaimed: 1500, status: 0 as any, dateSubmitted: getPastDateStr(1) }
];

export const MOCK_STOCK: StockItem[] = [
    { id: 'stk_1', name: 'Anesthetic Carpules', category: StockCategory.CONSUMABLES, quantity: 50, lowStockThreshold: 20, expiryDate: getFutureDateStr(60) }
];

export const MOCK_RESOURCES: ClinicResource[] = [
    { id: 'res_chair_01', name: 'Operatory Chair A', type: ResourceType.CHAIR, branch: 'Makati Main', colorCode: '#14b8a6' },
    { id: 'res_chair_02', name: 'Operatory Chair B (Surg)', type: ResourceType.CHAIR, branch: 'Makati Main', colorCode: '#c026d3' },
    { id: 'res_xray_01', name: 'Imaging Suite 1', type: ResourceType.XRAY, branch: 'Makati Main', colorCode: '#3b82f6' }
];

export const MOCK_ASSETS: MaintenanceAsset[] = [
    { id: 'ast_1', name: 'Autoclave unit 01', brand: 'W&H', serialNumber: 'WH-88912-A', lastService: getPastDateStr(45), frequencyMonths: 6, status: 'Ready', branch: 'Makati Main' },
    { id: 'ast_2', name: 'Intraoral Scanner', brand: 'iTero', serialNumber: 'IT-552-XP', lastService: getPastDateStr(180), frequencyMonths: 12, status: 'Service Due', branch: 'Makati Main' }
];

export const MOCK_INSTRUMENT_SETS: InstrumentSet[] = [
    { id: 'set_alpha_1', name: 'Surgery Set Alpha', status: 'Sterile', branch: 'Makati Main' }
];

export const MOCK_STERILIZATION_CYCLES: SterilizationCycle[] = [
    { id: 'cycle_001', date: getPastDateStr(1), autoclaveName: 'Autoclave 1', cycleNumber: '2024-05-20-01', operator: 'Asst. Sarah', passed: true, instrumentSetIds: ['set_alpha_1'] }
];

export const MOCK_STERILIZATION_CYCLES_INITIALIZED: SterilizationCycle[] = MOCK_STERILIZATION_CYCLES;

export const MOCK_EXPENSES: Expense[] = [
    { id: 'exp_1', date: getPastDateStr(1), category: 'Lab Fee', description: 'Crown for M. Scott', amount: 4000, branch: 'Makati Main', staffId: 'doc1' }
];

export const MOCK_AUDIT_LOG: AuditLogEntry[] = [
    { id: 'al1', timestamp: new Date().toISOString(), userId: 'admin1', userName: 'Sarah Connor', action: 'LOGIN', entity: 'System', entityId: 'System', details: 'System Initialized.' }
];

export const MOCK_AUDIT_LOG_INITIALIZED: AuditLogEntry[] = MOCK_AUDIT_LOG;

export const MOCK_VENDORS: Vendor[] = [
    { id: 'v1', name: 'Precision Dental Lab', type: 'Lab', contactPerson: 'John Smith', contactNumber: '0917-123-4567', email: 'orders@precisionlab.ph', status: 'Active', dsaSignedDate: '2023-01-15', dsaExpiryDate: '2025-01-15' }
];

const DEFAULT_SMS: SmsTemplates = {
    welcome: { id: 'welcome', label: 'Welcome to Practice', text: 'Welcome to dentsched, {PatientName}! Your digital health record is now active.', enabled: true, category: 'Onboarding', triggerDescription: 'New patient registration.' },
    update_registration: { id: 'update_registration', label: 'Registration Updated', text: 'Hi {PatientName}, we have successfully updated your patient profile and medical records. Thank you for keeping your data current.', enabled: true, category: 'Efficiency', triggerDescription: 'Existing patient data update.' },
    booking: { id: 'booking', label: 'Booking Confirmation', text: 'Confirmed: {Procedure} on {Date} @ {Time} with {Doctor}.', enabled: true, category: 'Logistics', triggerDescription: 'Appointment scheduled.' },
    reschedule: { id: 'reschedule', label: 'Reschedule Alert', text: 'Your session has been moved. New Slot: {Date} @ {Time}. See you then!', enabled: true, category: 'Logistics', triggerDescription: 'Appointment date/time changed.' },
    cancellation: { id: 'cancellation', label: 'Cancellation Confirmation', text: 'Your appointment for {Date} has been cancelled. We look forward to seeing you in the future.', enabled: true, category: 'Logistics', triggerDescription: 'Appointment status set to Cancelled.' },
    treatment_signed: { id: 'treatment_signed', label: 'Clinical Note Receipt', text: 'Clinical Record Sealed: Your signature has been bound to today\'s session record for {Procedure}.', enabled: true, category: 'Safety', triggerDescription: 'Patient signs a clinical note.' },
    followup_1w: { id: 'followup_1w', label: '7-Day Post-Op Check', text: 'Hi {PatientName}, it has been a week since your {Procedure}. We hope you are healing well! Text us if you have any discomfort.', enabled: true, category: 'Recovery', triggerDescription: 'Automated 1-week follow-up after signed treatment.' },
    followup_1m: { id: 'followup_1m', label: '1-Month Wellness Check', text: 'Checking in: It has been a month since your {Procedure}. Don\'t forget to maintain good hygiene for lasting results!', enabled: true, category: 'Recovery', triggerDescription: 'Automated 1-month follow-up.' },
    followup_3m: { id: 'followup_3m', label: '3-Month Recall Preparation', text: 'Time flies! It has been 3 months since your last major procedure. We recommend a cleaning soon to protect your investment.', enabled: true, category: 'Recovery', triggerDescription: 'Automated 3-month follow-up.' },
    medical_clearance: { id: 'medical_clearance', label: 'Medical Clearance Request', text: 'Action Required: Your dentist requests medical clearance from your {Provider} specialist for your upcoming procedure.', enabled: true, category: 'Safety', triggerDescription: 'Practitioner requests physician clearance.' },
    referral_thanks: { id: 'referral_thanks', label: 'Referral Thank You', text: 'Thank you {PatientName}! We noticed you referred a new patient to our practice. We appreciate your trust!', enabled: true, category: 'Reputation', triggerDescription: 'New patient lists this patient as referral source.' },
    philhealth_status: { id: 'philhealth_status', label: 'PhilHealth Claim Update', text: 'PhilHealth Update: Your claim for {Procedure} is now {Provider}.', enabled: true, category: 'Financial', triggerDescription: 'PhilHealth claim status transition.' },
    lab_delay: { id: 'lab_delay', label: 'Laboratory Set Delay', text: 'Service Update: The lab set for your {Procedure} has been delayed. Please await further notice before visiting.', enabled: true, category: 'Logistics', triggerDescription: 'Lab status set to Delayed.' }
};

const DEFAULT_HOURS: OperationalHours = {
    monday: { start: '08:00', end: '18:00', isClosed: false },
    tuesday: { start: '08:00', end: '18:00', isClosed: false },
    wednesday: { start: '08:00', end: '18:00', isClosed: false },
    thursday: { start: '08:00', end: '18:00', isClosed: false },
    friday: { start: '08:00', end: '18:00', isClosed: false },
    saturday: { start: '08:00', end: '16:00', isClosed: false },
    sunday: { start: '09:00', end: '12:00', isClosed: true }
};

const DEFAULT_SMS_CONFIG: SmsConfig = {
    mode: 'LOCAL',
    gatewayUrl: 'http://192.168.1.188:8080/send',
    apiKey: '9EWSEOt4',
    cloudUrl: '',
    username: '',
    password: '',
    deviceId: '',
    isPollingEnabled: false
};

const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  showYield: true,
  showRegulatoryHealth: true,
  showLogisticsIntegrity: true,
  showVelocity: true,
  showSafetyRail: true,
  showIntakeQueue: true,
  showWaitlistAlerts: true,
  showSterilizationShield: true,
  showSupplyRisks: true,
  showLabInFlow: true,
  showRevenueBridge: true,
  showInsurancePipeline: true,
  showComplianceAlerts: true,
  showPostOpWellness: true,
  showSessionStatus: true
};

export const DEFAULT_FIELD_SETTINGS: FieldSettings = {
  clinicName: 'Ivory Dental Office',
  clinicProfile: 'boutique',
  strictMode: true,
  editBufferWindowMinutes: 60,
  suffixes: ['Mr', 'Ms', 'Mrs', 'Dr', 'Jr', 'Sr', 'III'],
  civilStatus: ['Single', 'Married', 'Widowed', 'Separated'],
  sex: ['Male', 'Female'],
  insuranceProviders: ['Maxicare', 'Intellicare', 'PhilHealth', 'Medicard'],
  bloodGroups: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
  nationalities: ['Filipino', 'American', 'Chinese', 'Japanese', 'British'],
  religions: ['None', 'Roman Catholic', 'Christian', 'Islam', 'Iglesia ni Cristo'],
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
    { id: 'homeNumber', label: 'Home Num', type: 'tel', section: 'CONTACT', width: 'third' },
    { id: 'officeNumber', label: 'Office Num', type: 'tel', section: 'CONTACT', width: 'third' },
    { id: 'faxNumber', label: 'Fax Num', type: 'tel', section: 'CONTACT', width: 'third' },
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
      sex: 'Sex',
      civilStatus: 'Civil Status',
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
      'core_dob', 'core_age', 'core_sex', 'core_civilStatus', 'field_nickname',
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
      'Taking Blood Thinners? (Aspirin, Warfarin, etc.)',
      'Taking Bisphosphonates? (Fosamax, Zometa)',
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
    'Do you use alcohol, cocaine or other dangerous drugs?',
    'Taking Blood Thinners? (Aspirin, Warfarin, etc.)',
    'Taking Bisphosphonates? (Fosamax, Zometa)'
  ],
  femaleQuestionRegistry: [
    'Are you pregnant?',
    'Are you nursing?',
    'Are you taking birth control pills?'
  ],
  medicalRiskRegistry: [],
  dentalHistoryRegistry: [
    'Previous Attending Dentist',
    'Approximate Date of Last Visit'
  ],
  criticalRiskRegistry: [],
  procedures: [
      { id: 'p1', name: 'Initial Consultation & Treatment Planning', price: 500, category: 'General', allowedLicenseCategories: ['DENTIST'] },
      { id: 'p2', name: 'Oral Examination & Digital Charting', price: 800, category: 'General', allowedLicenseCategories: ['DENTIST'] },
      { id: 'p3', name: 'Digital Periapical X-Ray', price: 500, category: 'Imaging', allowedLicenseCategories: ['DENTIST'] },
      { id: 'p4', name: 'Panoramic Radiograph (External Referral)', price: 1500, category: 'Imaging', allowedLicenseCategories: ['DENTIST'] },
      { id: 'p5', name: 'Oral Prophylaxis (Light/Routine)', price: 1200, category: 'General', allowedLicenseCategories: ['DENTIST', 'HYGIENIST'] },
      { id: 'p6', name: 'Oral Prophylaxis (Heavy/Stain Removal)', price: 1800, category: 'General', allowedLicenseCategories: ['DENTIST', 'HYGIENIST'] },
      { id: 'p7', name: 'Deep Scaling & Root Planing (per quadrant)', price: 2500, category: 'Periodontics', allowedLicenseCategories: ['DENTIST'] },
      { id: 'p8', name: 'Topical Fluoride Application', price: 1000, category: 'General', allowedLicenseCategories: ['DENTIST', 'HYGIENIST'] },
      { id: 'p9', name: 'Pit and Fissure Sealant (per tooth)', price: 1000, category: 'Preventive', allowedLicenseCategories: ['DENTIST'] },
      { id: 'p10', name: 'Composite Restoration (1 Surface)', price: 1500, category: 'Restorative', allowedLicenseCategories: ['DENTIST'] },
      { id: 'p11', name: 'Composite Restoration (2 Surfaces)', price: 2000, category: 'Restorative', allowedLicenseCategories: ['DENTIST'] },
      { id: 'p12', name: 'Composite Restoration (3+ Surfaces/Build-up)', price: 3000, category: 'Restorative', allowedLicenseCategories: ['DENTIST'] },
      { id: 'p13', name: 'Temporary Filling (IRM/GIC)', price: 800, category: 'Restorative', allowedLicenseCategories: ['DENTIST'] },
      { id: 'p14', name: 'Simple Extraction (Erupted Tooth)', price: 1500, category: 'Surgery', allowedLicenseCategories: ['DENTIST'], requiresWitness: true },
      { id: 'p15', name: 'Complicated Extraction (Bone Removal)', price: 3500, category: 'Surgery', allowedLicenseCategories: ['DENTIST'], requiresWitness: true },
      { id: 'p16', name: 'Surgical Extraction (Impacted/Wisdom Tooth)', price: 7500, category: 'Surgery', allowedLicenseCategories: ['DENTIST'], requiresWitness: true },
      { id: 'p17', name: 'Incision and Drainage (Abscess)', price: 2000, category: 'Surgery', allowedLicenseCategories: ['DENTIST'], requiresWitness: true },
      { id: 'p18', name: 'Root Canal Treatment (Anterior Tooth)', price: 8000, category: 'Endodontics', allowedLicenseCategories: ['DENTIST'] },
      { id: 'p19', name: 'Root Canal Treatment (Premolar)', price: 10000, category: 'Endodontics', allowedLicenseCategories: ['DENTIST'] },
      { id: 'p20', name: 'Root Canal Treatment (Molar)', price: 15000, category: 'Endodontics', allowedLicenseCategories: ['DENTIST'] },
      { id: 'p21', name: 'Zirconia Crown (High Translucency)', price: 20000, category: 'Prosthodontics', allowedLicenseCategories: ['DENTIST'], requiresXray: true },
      { id: 'p22', name: 'PFM (Porcelain Fused to Metal) Crown', price: 12000, category: 'Prosthodontics', allowedLicenseCategories: ['DENTIST'], requiresXray: true },
      { id: 'p23', name: 'IPS e.max (Lithium Disilicate) Veneer', price: 18000, category: 'Prosthodontics', allowedLicenseCategories: ['DENTIST'] },
      { id: 'p24', name: 'Full Upper/Lower Denture (Acrylic)', price: 15000, category: 'Prosthodontics', allowedLicenseCategories: ['DENTIST'] },
      { id: 'p25', name: 'Denture Repair/Relining', price: 3500, category: 'Prosthodontics', allowedLicenseCategories: ['DENTIST'] }
  ], 
  medications: [
      { id: 'm1', genericName: 'Amoxicillin', brandName: 'Amoxil', dosage: '500mg', instructions: '1 capsule every 8 hours for 7 days' },
      { id: 'm2', genericName: 'Clindamycin', brandName: 'Dalacin C', dosage: '300mg', instructions: '1 capsule every 8 hours for 5 days' },
      { id: 'm3', genericName: 'Co-Amoxiclav', brandName: 'Augmentin', dosage: '625mg', instructions: '1 tablet every 12 hours for 7 days' },
      { id: 'm4', genericName: 'Mefenamic Acid', brandName: 'Ponstan', dosage: '500mg', instructions: '1 capsule every 8 hours as needed for pain' },
      { id: 'm5', genericName: 'Ibuprofen', brandName: 'Advil', dosage: '400mg', instructions: '1 tablet every 6 hours as needed for pain' },
      { id: 'm6', genericName: 'Celecoxib', brandName: 'Celebrex', dosage: '200mg', instructions: '1 capsule every 12 hours for 3 to 5 days' },
      { id: 'm7', genericName: 'Paracetamol', brandName: 'Biogesic', dosage: '500mg', instructions: '1-2 tablets every 4 hours for fever/mild pain' },
      { id: 'm8', genericName: 'Chlorhexidine Gluconate', brandName: 'Orahex', dosage: '0.12%', instructions: 'Swish 15ml for 30 seconds twice daily' },
      { id: 'm9', genericName: 'Tranexamic Acid', brandName: 'Hemostan', dosage: '500mg', instructions: '1 capsule every 8 hours (for bleeding control)' }
  ],
  shadeGuides: [
      'A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D2', 'D3', 'D4',
      '1M1', '1M2', '2M1', '2M2', '2M3', '3M1', '3M2', '3M3', '4M1', '4M2', '4M3', '5M1', '5M2', '5M3',
      'BL1', 'BL2', 'BL3', 'BL4', 'Chromascop System'
  ],
  restorativeMaterials: [
      'Composite (Light-Cure Micro-Hybrid)',
      'Glass Ionomer Cement (GIC Type IX)',
      'Zirconia (Multi-layered/High Translucency)',
      'IPS e.max (Lithium Disilicate)',
      'PFM (Non-Precious/Semi-Precious)',
      'Acrylic Resin (Heat-Cured)',
      'Flexible Denture Material (Valplast)'
  ],
  payrollAdjustmentTemplates: [
      { id: 'adj1', label: 'Performance Bonus', type: 'Credit', category: 'Incentives' },
      { id: 'adj2', label: 'Lab Fee Reimbursement', type: 'Credit', category: 'Operational' },
      { id: 'adj3', label: 'Referral Incentive', type: 'Credit', category: 'Incentives' },
      { id: 'adj4', label: 'Continuing Education Subsidy', type: 'Credit', category: 'Incentives' },
      { id: 'adj5', label: 'Late Penalty', type: 'Debit', category: 'Attendance' },
      { id: 'adj6', label: 'Material Waste Charge', type: 'Debit', category: 'Operational' },
      { id: 'adj7', label: 'Statutory SSS/PhilHealth/Pag-IBIG', type: 'Debit', category: 'Statutory' },
      { id: 'adj8', label: 'Withholding Tax (10%)', type: 'Debit', category: 'Statutory', defaultAmount: 0.10 }
  ],
  expenseCategories: [
      'Dental Supplies (Consumables)',
      'Laboratory Fees (External)',
      'Medical Waste Disposal',
      'Equipment Maintenance',
      'Rent & Utilities',
      'Marketing & Advertising',
      'Software Subscriptions',
      'Staff Salaries & Benefits'
  ],
  branches: ['Makati Main', 'Quezon City Satellite', 'BGC Premium', 'Alabang South'],
  resources: MOCK_RESOURCES,
  assets: MOCK_ASSETS,
  vendors: MOCK_VENDORS,
  hospitalAffiliations: [
      { id: 'h1', name: 'St. Lukes Medical Center', location: 'Global City', hotline: '02-8789-7700' },
      { id: 'h2', name: 'Makati Medical Center', location: 'Makati', hotline: '02-8888-8999' }
  ],
  smsTemplates: DEFAULT_SMS,
  smsConfig: DEFAULT_SMS_CONFIG,
  operationalHours: DEFAULT_HOURS,
  consentFormTemplates: [
      { id: 'c1', name: 'General Consent', content: 'I, {PatientName}, authorize treatment.' }
  ],
  smartPhrases: [
      { id: 'sp1', label: 'Routine Checkup', text: 'Patient in for routine prophylaxis. No acute pain.', category: 'SOAP' }
  ],
  paymentModes: ['Cash', 'GCash', 'Maya', 'Bank Transfer', 'Credit Card', 'HMO Direct Payout', 'Check'],
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
  dashboardConfig: DEFAULT_DASHBOARD_CONFIG,
  get kioskSettings(): { welcomeMessage: string; privacyNotice: string; } {
      return { welcomeMessage: 'Welcome to Ivory Dental', privacyNotice: 'We process your data for clinical care.' };
  }
};
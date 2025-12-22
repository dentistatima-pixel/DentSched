import { User, UserRole, Patient, Appointment, AppointmentType, AppointmentStatus, LabStatus, FieldSettings, HMOClaim, StockItem, StockCategory, Expense, TreatmentPlanStatus, AuditLogEntry, SterilizationCycle, Vendor, SmsTemplates, ResourceType, ClinicResource, ClaimStatus } from './types';

// Generators for mock data
const generateId = () => Math.random().toString(36).substring(2, 9);

// --- DATE UTILITY (Dynamic for "Living Simulation") ---
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

export const STAFF: User[] = [
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
      preferences: {
          showFinancials: true,
          showTraySetup: false,
          showPatientFlow: false,
          showLabAlerts: true
      },
      roster: { 'Mon': 'Makati Branch', 'Tue': 'Makati Branch', 'Wed': 'Makati Branch', 'Thu': 'Makati Branch', 'Fri': 'Makati Branch' }
  },
  { 
      id: 'doc1', 
      name: 'Dr. Alexander Crentist', 
      role: UserRole.DENTIST, 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      specialization: 'General Dentistry',
      prcLicense: '0123456',
      prcExpiry: getFutureDateStr(15), 
      s2License: 'PDEA-S2-8888',
      s2Expiry: getFutureDateStr(200),
      defaultBranch: 'Makati Branch',
      allowedBranches: ['Makati Branch', 'Quezon City Branch'], 
      colorPreference: '#14b8a6', 
      defaultConsultationFee: 500.00,
      roster: { 'Mon': 'Makati Branch', 'Wed': 'Makati Branch', 'Fri': 'Makati Branch', 'Tue': 'Quezon City Branch' }
  },
  { 
      id: 'doc2', 
      name: 'Dr. Benjamin Molar', 
      role: UserRole.DENTIST, 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ben',
      specialization: 'Orthodontics',
      prcLicense: '0987654',
      prcExpiry: getFutureDateStr(365),
      defaultBranch: 'Quezon City Branch',
      allowedBranches: ['Quezon City Branch'],
      colorPreference: '#8b5cf6', 
      defaultConsultationFee: 800.00,
      roster: { 'Tue': 'Quezon City Branch', 'Thu': 'Quezon City Branch', 'Sat': 'Quezon City Branch' }
  },
  { id: 'doc3', name: 'Dr. Cassandra Filling', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cass', specialization: 'Pediatric Dentistry', prcLicense: '0112233', prcExpiry: getFutureDateStr(400), colorPreference: '#f43f5e', defaultBranch: 'Makati Branch', allowedBranches: ['Makati Branch'] },
  { id: 'doc4', name: 'Dr. David Crown', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dave', specialization: 'Prosthodontics', prcLicense: '0445566', prcExpiry: getFutureDateStr(50), colorPreference: '#f59e0b', defaultBranch: 'Quezon City Branch', allowedBranches: ['Quezon City Branch'] },
  { id: 'doc5', name: 'Dr. Elena Root', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', specialization: 'Endodontics', prcLicense: '0778899', prcExpiry: getFutureDateStr(600), colorPreference: '#10b981', defaultBranch: 'Makati Branch', allowedBranches: ['Makati Branch'] },
  
  { 
      id: 'asst1', 
      name: 'Asst. Sarah Sparkle', 
      role: UserRole.DENTAL_ASSISTANT, 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg1',
      employeeId: 'DA-2023-001',
      assignedDoctors: ['doc1', 'doc2'], 
      defaultBranch: 'Makati Branch',
      allowedBranches: ['Makati Branch', 'Quezon City Branch'],
      isReadOnly: false,
      roster: { 'Mon': 'Makati Branch', 'Tue': 'Quezon City Branch', 'Wed': 'Makati Branch', 'Thu': 'Quezon City Branch', 'Fri': 'Makati Branch' }
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
        medicationDetails: 'Warfarin, Lipitor',
        currentBalance: 5000,
        recallStatus: 'Booked',
        attendanceStats: { totalBooked: 10, completedCount: 9, noShowCount: 1, lateCancelCount: 0 },
        reliabilityScore: 90,
        treatmentPlans: [
            { id: 'tp1', patientId: 'p_heavy_01', name: 'Phase 1 - Urgent Care', createdAt: getTodayStr(), createdBy: 'Dr. Alexander Crentist', status: TreatmentPlanStatus.PENDING_REVIEW, reviewNotes: 'Please check #16 for fracture lines before proceeding.' },
            { id: 'tp2', patientId: 'p_heavy_01', name: 'Phase 2 - Prostho', createdAt: getTodayStr(), createdBy: 'Dr. Alexander Crentist', status: TreatmentPlanStatus.DRAFT }
        ],
        dentalChart: [
             { id: 'dc_heavy_01', toothNumber: 46, procedure: 'Restoration', status: 'Completed', surfaces: 'MO', price: 2500, payment: 0, date: getPastDateStr(2), author: 'Dr. Alex', notes: 'Deep caries.' },
             { id: 'dc_heavy_02', toothNumber: 47, procedure: 'Restoration', status: 'Completed', surfaces: 'O', price: 2500, payment: 2500, date: getPastDateStr(2), author: 'Dr. Alex' },
             { id: 'dc_heavy_03', toothNumber: 11, procedure: 'Crown', status: 'Completed', notes: 'PFM Crown', price: 12000, payment: 12000, date: getPastDateStr(35), author: 'Dr. Dave' },
             { id: 'dc_heavy_04', toothNumber: 21, procedure: 'Crown', status: 'Completed', notes: 'PFM Crown', price: 12000, payment: 12000, date: getPastDateStr(35), author: 'Dr. Dave' },
             { id: 'dc_heavy_05', toothNumber: 0, procedure: 'Oral Prophylaxis', status: 'Completed', price: 1500, payment: 1500, date: getPastDateStr(40), author: 'Asst. Sarah' },
             { id: 'dc_heavy_06', toothNumber: 36, procedure: 'Root Canal', status: 'Completed', notes: 'Cleaning & Shaping', price: 8000, payment: 8000, date: getPastDateStr(65), author: 'Dr. Elena' },
             { id: 'dc_heavy_07', toothNumber: 36, procedure: 'Root Canal', status: 'Completed', notes: 'Access Opening', price: 0, date: getPastDateStr(72), author: 'Dr. Elena' },
             { id: 'dc_heavy_08', toothNumber: 36, procedure: 'Root Canal', status: 'Completed', notes: 'Obturation', price: 0, date: getPastDateStr(79), author: 'Dr. Elena' },
             { id: 'dc_heavy_09', toothNumber: 18, procedure: 'Missing', status: 'Existing', date: '2020-01-01' },
             { id: 'dc_heavy_10', toothNumber: 28, procedure: 'Missing', status: 'Existing', date: '2020-01-01' },
             { id: 'dc_heavy_11', toothNumber: 38, procedure: 'Missing', status: 'Existing', date: '2020-01-01' },
             { id: 'dc_heavy_12', toothNumber: 48, procedure: 'Missing', status: 'Existing', date: '2020-01-01' },
             { id: 'dc_heavy_13', toothNumber: 14, procedure: 'Restoration', status: 'Existing', surfaces: 'MOD', date: '2022-05-10' },
             { id: 'dc_heavy_14', toothNumber: 24, procedure: 'Restoration', status: 'Existing', surfaces: 'DO', date: '2022-05-10' },
             { id: 'dc_heavy_15', toothNumber: 16, procedure: 'Crown', status: 'Planned', notes: 'Crack lines visible', price: 15000, date: getTomorrowStr(), planId: 'tp1' }
        ],
        ledger: [
            { id: 'l1', date: getPastDateStr(2), description: 'Restoration 46, 47', type: 'Charge', amount: 5000, balanceAfter: 5000, shadowCreditAmount: 2000, claimId: 'claim_1' },
            { id: 'l2', date: getPastDateStr(2), description: 'Partial Payment', type: 'Payment', amount: 2500, balanceAfter: 2500 },
            { id: 'l3', date: getPastDateStr(35), description: 'Crowns 11, 21', type: 'Charge', amount: 24000, balanceAfter: 26500 },
            { id: 'l4', date: getPastDateStr(35), description: 'Full Payment', type: 'Payment', amount: 24000, balanceAfter: 2500 }
        ],
        consentLogs: [
            { id: 'cl_1', category: 'Clinical', status: 'Granted', version: 'v1.0-2024', timestamp: getPastDateStr(365), staffId: 'admin1', staffName: 'Sarah Connor' }
        ]
    },
    {
        id: 'p_full_perio_02',
        name: 'Sofia Reyes',
        firstName: 'Sofia',
        surname: 'Reyes',
        insuranceProvider: 'Intellicare',
        dob: '1975-02-14',
        age: 49,
        sex: 'Female',
        phone: '0920-111-2222',
        email: 'sofia.reyes@email.com',
        occupation: 'Teacher',
        lastVisit: getPastDateStr(100),
        nextVisit: null,
        chiefComplaint: 'Bleeding gums.',
        notes: 'Generalized Stage III Periodontitis.',
        recallStatus: 'Due',
        attendanceStats: { totalBooked: 5, completedCount: 5, noShowCount: 0, lateCancelCount: 0 },
        reliabilityScore: 100,
        perioChart: [
            { toothNumber: 18, pocketDepths: [5,6,5, 6,7,6], recession: [1,1,1, 2,2,2], bleeding: [true,true,true,true,true,true], mobility: 1 },
            { toothNumber: 17, pocketDepths: [4,5,4, 5,5,5], recession: [0,0,0, 1,1,1], bleeding: [true,false,true,true,false,true], mobility: 0 },
            { toothNumber: 16, pocketDepths: [3,3,3, 4,4,4], recession: [0,0,0, 0,0,0], bleeding: [false,false,false,true,false,false], mobility: 0 },
            { toothNumber: 15, pocketDepths: [2,2,2, 2,3,2], recession: [0,0,0, 0,0,0], bleeding: [false,false,false,false,false,false], mobility: 0 },
            { toothNumber: 14, pocketDepths: [2,2,2, 2,2,2], recession: [0,0,0, 0,0,0], bleeding: [false,false,false,false,false,false], mobility: 0 },
            { toothNumber: 13, pocketDepths: [5,6,5, 4,4,4], recession: [2,3,2, 1,1,1], bleeding: [true,true,true,false,false,false], mobility: 1 },
            { toothNumber: 12, pocketDepths: [3,3,3, 3,3,3], recession: [1,1,1, 1,1,1], bleeding: [false,false,false,false,false,false], mobility: 0 },
            { toothNumber: 11, pocketDepths: [3,3,3, 3,3,3], recession: [1,1,1, 1,1,1], bleeding: [false,false,false,false,false,false], mobility: 0 },
            { toothNumber: 21, pocketDepths: [3,3,3, 3,3,3], recession: [1,1,1, 1,1,1], bleeding: [false,false,false,false,false,false], mobility: 0 },
            { toothNumber: 22, pocketDepths: [3,3,3, 3,3,3], recession: [1,1,1, 1,1,1], bleeding: [false,false,false,false,false,false], mobility: 0 },
            { toothNumber: 23, pocketDepths: [4,5,4, 4,4,4], recession: [2,2,2, 1,1,1], bleeding: [true,true,true,false,false,false], mobility: 0 },
            { toothNumber: 24, pocketDepths: [2,2,2, 2,2,2], recession: [0,0,0, 0,0,0], bleeding: [false,false,false,false,false,false], mobility: 0 },
            { toothNumber: 25, pocketDepths: [2,2,2, 2,2,2], recession: [0,0,0, 0,0,0], bleeding: [false,false,false,false,false,false], mobility: 0 },
            { toothNumber: 26, pocketDepths: [5,6,5, 5,5,5], recession: [1,1,1, 1,1,1], bleeding: [true,true,true,true,true,true], mobility: 1 },
            { toothNumber: 27, pocketDepths: [4,4,4, 4,4,4], recession: [0,0,0, 0,0,0], bleeding: [false,true,false,false,false,false], mobility: 0 },
            { toothNumber: 28, pocketDepths: [6,7,6, 6,7,6], recession: [2,2,2, 2,2,2], bleeding: [true,true,true,true,true,true], mobility: 2 },
            { toothNumber: 31, pocketDepths: [5,5,5, 4,4,4], recession: [1,1,1, 1,1,1], bleeding: [true, true, true, true, true, true], mobility: 1 },
            { toothNumber: 36, pocketDepths: [4,5,4, 3,3,3], recession: [0,0,0, 0,0,0], bleeding: [true,false,false,false,false,false], mobility: 0 },
            { toothNumber: 46, pocketDepths: [4,5,4, 5,6,5], recession: [0,0,0, 0,0,0], bleeding: [true, true, true, false, false, false], mobility: 1 }
        ],
        dentalChart: [
            { id: 'dc_perio_01', toothNumber: 0, procedure: 'Oral Prophylaxis', status: 'Planned', notes: 'Deep Scaling / Root Planing needed', price: 3500 }
        ],
        consentLogs: [
            { id: 'cl_2', category: 'Clinical', status: 'Granted', version: 'v1.0-2024', timestamp: getPastDateStr(200), staffId: 'admin1', staffName: 'Sarah Connor' }
        ]
    },
    { id: 'p_credit_03', name: 'Maria Clara', firstName: 'Maria', surname: 'Clara', dob: '1995-06-19', age: 29, sex: 'Female', phone: '0917-123-4567', email: 'mc@email.com', lastVisit: getPastDateStr(25), nextVisit: getTodayStr(), notes: 'Regular ortho adjustment.', currentBalance: -5000, attendanceStats: { totalBooked: 24, completedCount: 24, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100 },
    { id: 'p_surg_04', name: 'Juan Dela Cruz', firstName: 'Juan', surname: 'Dela Cruz', dob: '1980-12-30', age: 43, sex: 'Male', phone: '0919-987-6543', email: 'jdc@email.com', lastVisit: getPastDateStr(5), nextVisit: null, notes: 'Patient requires surgical extraction. Pre-medication needed due to High BP.', medicalConditions: ['High BP'], allergies: ['Penicillin'], attendanceStats: { totalBooked: 3, completedCount: 1, noShowCount: 2, lateCancelCount: 0 }, reliabilityScore: 33, files: [
        { id: 'f1', patientId: 'p_surg_04', title: 'Panoramic X-Ray', category: 'X-Ray', fileType: 'image/jpeg', url: '#', uploadedBy: 'doc1', uploadedAt: getPastDateStr(5) }
    ]},
    { 
        id: 'p_pedia_05', 
        name: 'Timothy Santos', 
        firstName: 'Timothy', 
        surname: 'Santos', 
        dob: '2016-05-15', 
        age: 8,
        phone: '0917-555-4444',
        email: 't.santos@email.com',
        lastVisit: getPastDateStr(10),
        nextVisit: null,
        notes: 'Pediatric patient. Accompanied by mother.',
        attendanceStats: { totalBooked: 2, completedCount: 2, noShowCount: 0, lateCancelCount: 0 },
        reliabilityScore: 100
    }
];

export const APPOINTMENTS: Appointment[] = [
    {
        id: 'a1',
        patientId: 'p_heavy_01',
        providerId: 'doc1',
        branch: 'Makati Branch',
        date: getTodayStr(),
        time: '09:00',
        durationMinutes: 60,
        type: 'Consultation',
        status: AppointmentStatus.SCHEDULED,
        resourceId: 'res1'
    }
];

export const DEFAULT_FIELD_SETTINGS: FieldSettings = {
    clinicProfile: 'boutique',
    suffixes: ['Jr.', 'Sr.', 'III'],
    civilStatus: ['Single', 'Married', 'Widowed', 'Separated'],
    insuranceProviders: ['Maxicare', 'Intellicare', 'Medicard', 'PhilHealth'],
    bloodGroups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    allergies: ['Penicillin', 'Sulfa', 'Latex', 'Aspirin'],
    medicalConditions: ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease'],
    procedures: [
        { id: 'proc1', name: 'Consultation', price: 500, category: 'General' },
        { id: 'proc2', name: 'Oral Prophylaxis', price: 1500, category: 'General' },
        { id: 'proc3', name: 'Restoration', price: 2500, category: 'Restorative' },
        { id: 'proc4', name: 'Extraction', price: 3000, category: 'Surgery' },
        { id: 'proc5', name: 'Root Canal', price: 8000, category: 'Endodontics' },
    ],
    branches: ['Makati Branch', 'Quezon City Branch'],
    features: {
        enableLabTracking: true,
        enableComplianceAudit: true,
        enableMultiBranch: true,
        enableDentalAssistantFlow: true,
        enableHMOClaims: true,
        enableInventory: true,
        enableAnalytics: true,
        enablePatientPortal: true,
        enableDigitalConsent: true,
        enableAutomatedRecall: true,
        enableOnlineForms: true,
        enableEPrescription: true,
        enableAdvancedPermissions: true,
        enablePhilHealthClaims: true,
        enableLabPortal: true,
        enableDocumentManagement: true,
        enableClinicalProtocolAlerts: true,
        enableTreatmentPlanApprovals: true,
        enableAccountabilityLog: true,
        enableReferralTracking: true,
        enablePromotions: true,
        enableSmsAutomation: true
    },
    smsTemplates: {
        'booking': { id: 'booking', label: 'Booking Confirmation', text: 'Hi {PatientName}, your appt is confirmed for {Date} at {Time} with {Doctor}.', enabled: true, category: 'Safety', triggerDescription: 'Sent when booking created' }
    },
    resources: [
        { id: 'res1', name: 'Chair 1', type: ResourceType.CHAIR, branch: 'Makati Branch' },
        { id: 'res2', name: 'Chair 2', type: ResourceType.CHAIR, branch: 'Makati Branch' }
    ],
    currentPrivacyVersion: '1.0-2024'
};

export const MOCK_AUDIT_LOG: AuditLogEntry[] = [];
export const MOCK_STOCK: StockItem[] = [];
export const MOCK_CLAIMS: HMOClaim[] = [];
export const MOCK_EXPENSES: Expense[] = [];
export const MOCK_STERILIZATION_CYCLES: SterilizationCycle[] = [
    { id: 'sc1', date: getTodayStr(), autoclaveName: 'Autoclave A', cycleNumber: 'C001', operator: 'Sarah Connor', passed: true }
];

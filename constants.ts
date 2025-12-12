

import { User, UserRole, Patient, Appointment, AppointmentType, AppointmentStatus, LabStatus, FieldSettings, HMOClaim, HMOClaimStatus, StockItem, StockCategory, Expense, TreatmentPlanStatus, AuditLogEntry } from './types';

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
      defaultBranch: 'Quezon City Branch',
      allowedBranches: ['Quezon City Branch'],
      colorPreference: '#8b5cf6', 
      defaultConsultationFee: 800.00,
      roster: { 'Tue': 'Quezon City Branch', 'Thu': 'Quezon City Branch', 'Sat': 'Quezon City Branch' }
  },
  { id: 'doc3', name: 'Dr. Cassandra Filling', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cass', specialization: 'Pediatric Dentistry', prcLicense: '0112233', colorPreference: '#f43f5e', defaultBranch: 'Makati Branch', allowedBranches: ['Makati Branch'] },
  { id: 'doc4', name: 'Dr. David Crown', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dave', specialization: 'Prosthodontics', prcLicense: '0445566', colorPreference: '#f59e0b', defaultBranch: 'Quezon City Branch', allowedBranches: ['Quezon City Branch'] },
  { id: 'doc5', name: 'Dr. Elena Root', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', specialization: 'Endodontics', prcLicense: '0778899', colorPreference: '#10b981', defaultBranch: 'Makati Branch', allowedBranches: ['Makati Branch'] },
  
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

// --- EXTENSIVE DUMMY PATIENTS ---
export const PATIENTS: Patient[] = [
    // 1. THE HEAVY CHART (Scrolling Stress Test, 3 Month History)
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
        treatmentPlans: [
            { id: 'tp1', patientId: 'p_heavy_01', name: 'Phase 1 - Urgent Care', createdAt: getTodayStr(), createdBy: 'Dr. Alexander Crentist', status: TreatmentPlanStatus.PENDING_REVIEW, reviewNotes: 'Please check #16 for fracture lines before proceeding.' },
            { id: 'tp2', patientId: 'p_heavy_01', name: 'Phase 2 - Prostho', createdAt: getTodayStr(), createdBy: 'Dr. Alexander Crentist', status: TreatmentPlanStatus.DRAFT }
        ],
        dentalChart: [
             // RECENT (Current Month)
             { id: 'dc_heavy_01', toothNumber: 46, procedure: 'Restoration', status: 'Completed', surfaces: 'MO', price: 2500, payment: 0, date: getPastDateStr(2), author: 'Dr. Alex', notes: 'Deep caries.' },
             { id: 'dc_heavy_02', toothNumber: 47, procedure: 'Restoration', status: 'Completed', surfaces: 'O', price: 2500, payment: 2500, date: getPastDateStr(2), author: 'Dr. Alex' },
             
             // LAST MONTH
             { id: 'dc_heavy_03', toothNumber: 11, procedure: 'Crown', status: 'Completed', notes: 'PFM Crown', price: 12000, payment: 12000, date: getPastDateStr(35), author: 'Dr. Dave' },
             { id: 'dc_heavy_04', toothNumber: 21, procedure: 'Crown', status: 'Completed', notes: 'PFM Crown', price: 12000, payment: 12000, date: getPastDateStr(35), author: 'Dr. Dave' },
             { id: 'dc_heavy_05', toothNumber: 0, procedure: 'Oral Prophylaxis', status: 'Completed', price: 1500, payment: 1500, date: getPastDateStr(40), author: 'Asst. Sarah' },

             // 2 MONTHS AGO
             { id: 'dc_heavy_06', toothNumber: 36, procedure: 'Root Canal', status: 'Completed', notes: 'Obturation', price: 8000, payment: 8000, date: getPastDateStr(65), author: 'Dr. Elena' },
             { id: 'dc_heavy_07', toothNumber: 36, procedure: 'Root Canal', status: 'Completed', notes: 'Cleaning & Shaping', price: 0, date: getPastDateStr(72), author: 'Dr. Elena' },
             { id: 'dc_heavy_08', toothNumber: 36, procedure: 'Root Canal', status: 'Completed', notes: 'Access Opening', price: 0, date: getPastDateStr(79), author: 'Dr. Elena' },

             // HISTORICAL / EXISTING
             { id: 'dc_heavy_09', toothNumber: 18, procedure: 'Missing', status: 'Existing', date: '2020-01-01' },
             { id: 'dc_heavy_10', toothNumber: 28, procedure: 'Missing', status: 'Existing', date: '2020-01-01' },
             { id: 'dc_heavy_11', toothNumber: 38, procedure: 'Missing', status: 'Existing', date: '2020-01-01' },
             { id: 'dc_heavy_12', toothNumber: 48, procedure: 'Missing', status: 'Existing', date: '2020-01-01' },
             { id: 'dc_heavy_13', toothNumber: 14, procedure: 'Restoration', status: 'Existing', surfaces: 'MOD', date: '2022-05-10' },
             { id: 'dc_heavy_14', toothNumber: 24, procedure: 'Restoration', status: 'Existing', surfaces: 'DO', date: '2022-05-10' },
             // PLANNED ITEMS MOVED TO TREATMENT PLAN
             { id: 'dc_heavy_15', toothNumber: 16, procedure: 'Crown', status: 'Planned', notes: 'Crack lines visible', price: 15000, date: getTomorrowStr(), planId: 'tp1' }
        ],
        ledger: [
            { id: 'l1', date: getPastDateStr(2), description: 'Restoration 46, 47', type: 'Charge', amount: 5000, balanceAfter: 5000 },
            { id: 'l2', date: getPastDateStr(2), description: 'Partial Payment', type: 'Payment', amount: 2500, balanceAfter: 2500 }, // Balance remaining
            { id: 'l3', date: getPastDateStr(35), description: 'Crowns 11, 21', type: 'Charge', amount: 24000, balanceAfter: 26500 },
            { id: 'l4', date: getPastDateStr(35), description: 'Full Payment', type: 'Payment', amount: 24000, balanceAfter: 2500 }
        ]
    },

    // 2. THE FULL MOUTH PERIO (Rendering Stress Test)
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
        ]
    },
    // ... other patients (shortened for brevity) ...
    { id: 'p_credit_03', name: 'Maria Clara', firstName: 'Maria', surname: 'Clara', dob: '1995-06-19', age: 29, sex: 'Female', phone: '0917-123-4567', email: 'mc@email.com', lastVisit: getPastDateStr(25), nextVisit: getTodayStr(), notes: 'Regular ortho adjustment.', currentBalance: -5000 },
    { id: 'p_surg_04', name: 'Juan Dela Cruz', firstName: 'Juan', surname: 'Dela Cruz', dob: '1980-12-30', age: 43, sex: 'Male', phone: '0919-987-6543', email: 'jdc@email.com', lastVisit: getPastDateStr(5), nextVisit: null, notes: 'Patient requires surgical extraction. Pre-medication needed due to High BP.', medicalConditions: ['High BP'], allergies: ['Penicillin'], files: [
        { id: 'f1', patientId: 'p_surg_04', title: 'Panoramic X-Ray', category: 'X-Ray', fileType: 'image/jpeg', url: '#', uploadedBy: 'doc1', uploadedAt: getPastDateStr(5) }
    ]},
    { id: 'p_pedia_05', name: 'Timothy Santos', firstName: 'Timothy', surname: 'Santos', dob: '2016-05-15', age: 8, sex: 'Male', phone: '0917-555-0101', email: 'parent@email.com', guardian: 'Mrs. Santos', lastVisit: getPastDateStr(180), nextVisit: null, notes: 'Pediatric patient, requires gentle approach.' },
    { id: 'p_prostho_06', name: 'Lola Nidora Zobel', firstName: 'Nidora', surname: 'Zobel', dob: '1950-08-20', age: 73, sex: 'Female', phone: '0918-999-8888', email: 'lola@email.com', lastVisit: getPastDateStr(7), nextVisit: getTomorrowStr(), notes: 'For denture fitting.' },
    { id: 'p_vip_07', name: 'Bella Hadid (Demo)', firstName: 'Bella', surname: 'Hadid', dob: '1996-10-09', age: 27, sex: 'Female', phone: '0917-VIP-0001', email: 'bella@email.com', lastVisit: getPastDateStr(90), nextVisit: getFutureDateStr(90), notes: 'VIP patient. Handle with care.' },
    { id: 'p_emerg_08', name: 'Mark Techy', firstName: 'Mark', surname: 'Techy', dob: '1990-01-01', age: 34, sex: 'Male', phone: '0922-333-4444', email: 'mark@email.com', lastVisit: getTodayStr(), nextVisit: null, notes: 'Emergency visit for toothache.' },
    { id: 'p_debt_09', name: 'Ronnie Runner', firstName: 'Ronnie', surname: 'Runner', dob: '1999-09-09', age: 24, sex: 'Male', phone: '0999-000-0000', email: 'ron@email.com', lastVisit: getPastDateStr(30), nextVisit: null, notes: 'Patient has a significant outstanding balance. Please collect payment before new treatment.', currentBalance: 15000 },
    { id: 'p_complex_10', name: 'Gary Grinder', firstName: 'Gary', surname: 'Grinder', dob: '1982-03-15', age: 42, sex: 'Male', phone: '0917-888-1234', email: 'gary@email.com', lastVisit: getPastDateStr(10), nextVisit: getFutureDateStr(10), notes: 'Complex case involving bruxism. Needs night guard.' },
];

export const APPOINTMENTS: Appointment[] = [
    // --- TODAY'S SCHEDULE (Packed Flow) ---
    { id: 'apt_today_01', patientId: 'p_credit_03', providerId: 'doc2', branch: 'Quezon City Branch', date: getTodayStr(), time: '09:00', durationMinutes: 30, type: AppointmentType.ORTHODONTICS, status: AppointmentStatus.COMPLETED },
    { id: 'apt_today_02', patientId: 'p_surg_04', providerId: 'doc1', branch: 'Makati Branch', date: getTodayStr(), time: '10:00', durationMinutes: 90, type: AppointmentType.SURGERY, status: AppointmentStatus.TREATING },
    { id: 'apt_today_03', patientId: 'p_pedia_05', providerId: 'doc3', branch: 'Makati Branch', date: getTodayStr(), time: '13:00', durationMinutes: 45, type: AppointmentType.CONSULTATION, status: AppointmentStatus.SEATED },
    { id: 'apt_today_04', patientId: 'p_emerg_08', providerId: 'doc5', branch: 'Makati Branch', date: getTodayStr(), time: '14:00', durationMinutes: 60, type: AppointmentType.ROOT_CANAL, status: AppointmentStatus.ARRIVED },
    { id: 'apt_today_05', patientId: 'p_heavy_01', providerId: 'doc1', branch: 'Makati Branch', date: getTodayStr(), time: '15:30', durationMinutes: 60, type: AppointmentType.RESTORATION, status: AppointmentStatus.CONFIRMED },
    // --- TOMORROW ---
    { id: 'apt_tom_01', patientId: 'p_prostho_06', providerId: 'doc4', branch: 'Quezon City Branch', date: getTomorrowStr(), time: '11:00', durationMinutes: 60, type: AppointmentType.PROSTHODONTICS, status: AppointmentStatus.SCHEDULED, labStatus: LabStatus.PENDING },
    { id: 'apt_tom_02', patientId: 'p_vip_07', providerId: 'doc1', branch: 'Makati Branch', date: getTomorrowStr(), time: '13:00', durationMinutes: 120, type: AppointmentType.PROSTHODONTICS, status: AppointmentStatus.CONFIRMED },
    // --- FUTURE ---
    { id: 'apt_future_01', patientId: 'p_credit_03', providerId: 'doc2', branch: 'Quezon City Branch', date: getFutureDateStr(30), time: '09:00', durationMinutes: 30, type: AppointmentType.ORTHODONTICS, status: AppointmentStatus.SCHEDULED },
    // --- PAST ---
    { id: 'apt_past_01', patientId: 'p_heavy_01', providerId: 'doc1', branch: 'Makati Branch', date: getPastDateStr(2), time: '10:00', durationMinutes: 60, type: AppointmentType.RESTORATION, status: AppointmentStatus.COMPLETED },
    { id: 'apt_past_02', patientId: 'p_debt_09', providerId: 'doc5', branch: 'Makati Branch', date: getPastDateStr(30), time: '15:00', durationMinutes: 60, type: AppointmentType.ROOT_CANAL, status: AppointmentStatus.COMPLETED },
    { id: 'apt_past_03', patientId: 'p_credit_03', providerId: 'doc2', branch: 'Quezon City Branch', date: getPastDateStr(60), time: '09:00', durationMinutes: 30, type: AppointmentType.ORTHODONTICS, status: AppointmentStatus.COMPLETED }
];

// --- NEW MOCK DATA FOR CORPORATE FEATURES ---
export const MOCK_CLAIMS: HMOClaim[] = [
    { id: 'claim_1', patientId: 'p_heavy_01', ledgerEntryId: 'l1', hmoProvider: 'Maxicare', procedureName: 'Restoration', amountClaimed: 2000, status: HMOClaimStatus.SUBMITTED, dateSubmitted: getPastDateStr(1) },
    { id: 'claim_2', patientId: 'p_full_perio_02', ledgerEntryId: 'some_id_1', hmoProvider: 'Intellicare', procedureName: 'Oral Prophylaxis', amountClaimed: 1000, status: HMOClaimStatus.PAID, dateSubmitted: getPastDateStr(30), dateReceived: getPastDateStr(5), amountReceived: 1000 },
    { id: 'claim_3', patientId: 'p_heavy_01', ledgerEntryId: 'some_id_2', hmoProvider: 'Maxicare', procedureName: 'Consultation', amountClaimed: 500, status: HMOClaimStatus.REJECTED, dateSubmitted: getPastDateStr(15), notes: 'Not covered' }
];

export const MOCK_STOCK: StockItem[] = [
    { id: 'stk_1', name: 'Anesthetic Carpules', category: StockCategory.CONSUMABLES, quantity: 50, lowStockThreshold: 20 },
    { id: 'stk_2', name: 'Gloves (Box)', category: StockCategory.CONSUMABLES, quantity: 15, lowStockThreshold: 10 },
    { id: 'stk_3', name: 'A2 Composite Syringe', category: StockCategory.RESTORATIVE, quantity: 5, lowStockThreshold: 2 },
    { id: 'stk_4', name: 'Mouth Mirror', category: StockCategory.INSTRUMENTS, quantity: 100, lowStockThreshold: 50 },
    { id: 'stk_5', name: 'Bond Paper (Ream)', category: StockCategory.OFFICE, quantity: 8, lowStockThreshold: 5 },
];

export const MOCK_EXPENSES: Expense[] = [
    { id: 'exp_1', date: getPastDateStr(1), category: 'Lab Fee', description: 'Crown for M. Scott', amount: 4000, branch: 'Makati Branch' },
    { id: 'exp_2', date: getPastDateStr(5), category: 'Supplies', description: 'Dental Depot Order', amount: 15000, branch: 'Makati Branch' },
    { id: 'exp_3', date: getPastDateStr(10), category: 'Utilities', description: 'Meralco Bill', amount: 8500, branch: 'Quezon City Branch' }
];

// NEW: Governance Audit Log
export const MOCK_AUDIT_LOG: AuditLogEntry[] = [
    { id: 'al1', timestamp: new Date().toISOString(), userId: 'doc1', userName: 'Dr. Alexander Crentist', action: 'SUBMIT_PLAN', entity: 'TreatmentPlan', entityId: 'tp1', details: 'Submitted "Phase 1 - Urgent Care" for review.' },
    { id: 'al2', timestamp: new Date().toISOString(), userId: 'admin1', userName: 'Sarah Connor', action: 'LOGIN', entity: 'Patient', entityId: 'p_heavy_01', details: 'Viewed patient record.' }
];

// Initial defaults
export const DEFAULT_FIELD_SETTINGS: FieldSettings = {
  clinicProfile: 'boutique', // New: Default clinic profile
  suffixes: ['Mr', 'Ms', 'Mrs', 'Dr', 'Engr', 'Atty', 'Ph.D', 'Jr', 'Sr', 'III'],
  civilStatus: ['Single', 'Married', 'Widowed', 'Separated', 'Divorced'],
  insuranceProviders: ['Maxicare', 'Intellicare', 'PhilHealth', 'Medicard', 'Etiqa', 'Pacific Cross', 'ValuCare'],
  bloodGroups: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
  allergies: ['None', 'Aspirin', 'Penicillin', 'Sulfa', 'Local Anesthetic', 'Latex', 'Ibuprofen', 'Seafood'],
  medicalConditions: [
    'None', 'High BP', 'Low BP', 'Epilepsy', 'Diabetes', 'Asthma', 'Heart Disease', 'Hepatitis', 'Kidney Issues', 'Bleeding Issues', 'Pregnancy', 'Thyroid Issues'
  ],
  procedures: [
      { id: 'p1', name: 'Consultation', price: 500, category: 'General' },
      { id: 'p2', name: 'Oral Prophylaxis', price: 1200, category: 'Preventive' },
      { id: 'p3', name: 'Restoration', price: 1500, category: 'Restorative' },
      { id: 'p4', name: 'Extraction', price: 1000, category: 'Surgery', requiresConsent: true },
      { id: 'p5', name: 'Root Canal', price: 8000, category: 'Endodontics', requiresConsent: true },
      { id: 'p6', name: 'Prosthodontics', price: 15000, category: 'Restorative' },
      { id: 'p7', name: 'Orthodontics', price: 50000, category: 'Orthodontics' },
      { id: 'p8', name: 'Surgery', price: 5000, category: 'Surgery', requiresConsent: true },
      { id: 'p9', name: 'Whitening', price: 20000, category: 'Cosmetic' },
      { id: 'p10', name: 'Denture Adjustments', price: 500, category: 'Prosthodontics' },
      { id: 'p11', name: 'Sealant', price: 1500, category: 'Pediatric' },
      { id: 'p12', name: 'Exam', price: 0, category: 'General' },
      { id: 'p13', name: 'Crown', price: 12000, category: 'Prosthodontics' },
      { id: 'p14', name: 'Missing', price: 0, category: 'General' },
      { id: 'p15', name: 'Communication Log', price: 0, category: 'General' }
  ], 
  branches: ['Makati Branch', 'Quezon City Branch', 'BGC Branch', 'Alabang Branch'],
  features: {
      enableLabTracking: true,
      enableComplianceAudit: true,
      enableDentalAssistantFlow: true,
      enableMultiBranch: true,
      enableHMOClaims: false,
      enableInventory: false,
      enableAnalytics: false,
      enableBIRCompliance: false,
      enablePatientPortal: false,
      enableDigitalConsent: false,
      enableAutomatedRecall: false,
      enableOnlineForms: false,
      enableEPrescription: false,
      enableAdvancedPermissions: false,
      enablePhilHealthClaims: false,
      enableLabPortal: false,
      enableReferralTracking: false,
      enablePromotions: false,
      enableDocumentManagement: false,
      enableClinicalProtocolAlerts: false,
      enableTreatmentPlanApprovals: false,
      enableAccountabilityLog: false,
  },
  smsTemplates: {
      bookingConfirmation: "Hi {PatientName}, confirmed: {Date} @ {Time} w/ {ProviderName} at {Branch}. Reply C to confirm.",
      confirmationRequest: "Hi {PatientName}, expecting you on {Date} @ {Time}. Reply C to Confirm.",
      reminder24h: "Reminder: Appt tomorrow {Date} @ {Time} at {Branch}. See you!",
      postOpCheckup: "Hi {PatientName}, checking in after your procedure. Any concerns?",
      registrationWelcome: "Welcome to dentsched, {PatientName}! Your record is ready."
  },
  // NEW Corporate Settings
  receiptBooklets: [{ id: 'rb1', seriesStart: 1, seriesEnd: 1000, prefix: 'A', isActive: true }],
  stockCategories: Object.values(StockCategory),
  expenseCategories: ['Lab Fee', 'Supplies', 'Utilities', 'Rent', 'Salary', 'Other'],
  // NEW Document & Protocol Settings
  documentCategories: ['X-Ray', 'Medical Clearance', 'Consent Form', 'Lab Result', 'Insurance Form', 'Media Consent', 'Other'],
  clinicalProtocolRules: [
    { 
        id: 'rule1',
        name: 'Surgery on Medically Compromised Patient',
        triggerProcedureCategories: ['Surgery'],
        requiresMedicalConditions: ['High BP', 'Diabetes', 'Heart Disease', 'Bleeding Issues'],
        requiresDocumentCategory: 'Medical Clearance',
        alertMessage: 'This patient has a critical medical condition. A recent Medical Clearance from their physician is required before proceeding with any surgical procedure. Acknowledge and proceed only if clearance has been verbally confirmed.'
    },
    {
        id: 'rule2',
        name: 'Surgical Extraction X-Ray',
        triggerProcedureCategories: ['Surgery'],
        requiresMedicalConditions: [], // Applies to all patients for this procedure
        requiresDocumentCategory: 'X-Ray',
        alertMessage: 'A recent X-ray is required for surgical extractions to assess root morphology and vital structures. Acknowledge and proceed only if an X-ray has been reviewed.'
    }
  ],
  // NEW: Content Management Mock Data
  medications: [
      { id: 'med1', name: 'Amoxicillin', dosage: '500mg', instructions: 'Take 1 capsule every 8 hours for 7 days.' },
      { id: 'med2', name: 'Mefenamic Acid', dosage: '500mg', instructions: 'Take 1 tablet every 6 hours as needed for pain.' },
  ],
  consentFormTemplates: [
      { id: 'cft1', name: 'General Consent', content: 'I, {PatientName}, consent to the dental treatment as discussed with {DoctorName} on {Date}.' },
      { id: 'cft2', name: 'Surgical Extraction Consent', content: 'I understand the risks of the surgical extraction of {ProcedureList}, including but not limited to...'},
  ],
  mediaConsentTemplate: {
    id: 'cft_media',
    name: 'Media Consent Form',
    content: 'I, {PatientName}, hereby grant permission to the clinic to use photographs and/or video of my dental treatment for educational and marketing purposes in print or electronic media. I understand that my name will not be used in any publication without my further specific consent.'
  },
  postOpTemplates: {
      'Extraction': 'POST-OP INSTRUCTIONS: EXTRACTION\n\n1. Bite on gauze for 30-45 mins.\n2. No spitting or rinsing for 24 hours.\n3. Soft diet for 24 hours.\n4. Take prescribed medication.\n5. Call us if bleeding persists.',
      'Surgery': 'POST-OP INSTRUCTIONS: SURGERY\n\n1. Apply ice pack for 15 mins on, 15 mins off.\n2. Rest and avoid strenuous activity.\n3. Follow medication schedule strictly.\n4. Report any excessive swelling, pain, or fever immediately.',
      'Root Canal': 'POST-OP INSTRUCTIONS: ROOT CANAL\n\n1. Avoid chewing on the treated tooth until it is fully restored.\n2. Some tenderness is normal.\n3. Maintain good oral hygiene.'
  },
  clinicalNoteTemplates: [
      { id: 'cnt1', name: 'Prophy SOAP', content: 'S: Patient presents for routine cleaning.\nO: Generalized light plaque and calculus.\nA: Oral Prophylaxis.\nP: Performed scaling and polishing. OHI given.'}
  ]
};

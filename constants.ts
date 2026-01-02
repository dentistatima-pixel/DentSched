
import { User, UserRole, Patient, Appointment, AppointmentType, AppointmentStatus, LabStatus, FieldSettings, HMOClaim, StockItem, StockCategory, Expense, TreatmentPlanStatus, AuditLogEntry, SterilizationCycle, Vendor, SmsTemplates, HMOClaimStatus, PhilHealthClaimStatus, ResourceType, ClinicResource } from './types';

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
            { id: 'l1', date: getPastDateStr(2), description: 'Restoration 46, 47', type: 'Charge', amount: 5000, balanceAfter: 5000 },
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
    { id: 'p_pedia_05', name: 'Timothy Santos', firstName: 'Timothy', surname: 'Santos', dob: '2016-05-15', age: 8, sex: 'Male', phone: '0917-555-0101', email: 'parent@email.com', lastVisit: getPastDateStr(180), nextVisit: null, notes: 'Pediatric patient, requires gentle approach.', recallStatus: 'Due' },
    { id: 'p_prostho_06', name: 'Lola Nidora Zobel', firstName: 'Nidora', surname: 'Zobel', dob: '1950-08-20', age: 73, sex: 'Female', phone: '0918-999-8888', email: 'lola@email.com', lastVisit: '2010-05-15', nextVisit: null, notes: 'For denture fitting.', isArchived: true },
    { id: 'p_vip_07', name: 'Bella Hadid (Demo)', firstName: 'Bella', surname: 'Hadid', dob: '1996-10-09', age: 27, sex: 'Female', phone: '0917-VIP-0001', email: 'bella@email.com', lastVisit: getPastDateStr(90), nextVisit: getFutureDateStr(90), notes: 'VIP patient. Handle with care.', attendanceStats: { totalBooked: 1, completedCount: 1, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100 },
    { id: 'p_emerg_08', name: 'Mark Techy', firstName: 'Mark', surname: 'Techy', dob: '1990-01-01', age: 34, sex: 'Male', phone: '0922-333-4444', email: 'mark@email.com', lastVisit: getTodayStr(), nextVisit: null, notes: 'Emergency visit for toothache.' },
    { id: 'p_debt_09', name: 'Ronnie Runner', firstName: 'Ronnie', surname: 'Runner', dob: '1999-09-09', age: 24, sex: 'Male', phone: '0999-000-0000', email: 'ron@email.com', lastVisit: getPastDateStr(30), nextVisit: null, notes: 'Patient has a significant outstanding balance. Please collect payment before new treatment.', currentBalance: 15000, ledger: [{ id: 'ldebt1', date: getPastDateStr(95), description: 'Root Canal Phase 1', type: 'Charge', amount: 15000, balanceAfter: 15000 }], attendanceStats: { totalBooked: 8, completedCount: 4, noShowCount: 4, lateCancelCount: 0 }, reliabilityScore: 50 },
    { id: 'p_complex_10', name: 'Gary Grinder', firstName: 'Gary', surname: 'Grinder', dob: '1982-03-15', age: 42, sex: 'Male', phone: '0917-888-1234', email: 'gary@email.com', lastVisit: getPastDateStr(10), nextVisit: getFutureDateStr(10), notes: 'Complex case involving bruxism. Needs night guard.' },
];

export const APPOINTMENTS: Appointment[] = [
    { id: 'apt_today_01', patientId: 'p_credit_03', providerId: 'doc2', resourceId: 'res_chair_02', branch: 'Quezon City Branch', date: getTodayStr(), time: '09:00', durationMinutes: 30, type: AppointmentType.ORTHODONTICS, status: AppointmentStatus.COMPLETED },
    { id: 'apt_today_02', patientId: 'p_surg_04', providerId: 'doc1', resourceId: 'res_chair_01', branch: 'Makati Branch', date: getTodayStr(), time: '10:00', durationMinutes: 90, type: AppointmentType.SURGERY, status: AppointmentStatus.TREATING, sterilizationCycleId: 'cycle_002' },
    { id: 'apt_today_03', patientId: 'p_pedia_05', providerId: 'doc3', resourceId: 'res_chair_03', branch: 'Makati Branch', date: getTodayStr(), time: '13:00', durationMinutes: 45, type: AppointmentType.CONSULTATION, status: AppointmentStatus.SEATED },
    { id: 'apt_today_04', patientId: 'p_emerg_08', providerId: 'doc5', resourceId: 'res_chair_01', branch: 'Makati Branch', date: getTodayStr(), time: '14:00', durationMinutes: 60, type: AppointmentType.ROOT_CANAL, status: AppointmentStatus.ARRIVED },
    { id: 'apt_today_05', patientId: 'p_heavy_01', providerId: 'doc1', resourceId: 'res_chair_02', branch: 'Makati Branch', date: getTodayStr(), time: '15:30', durationMinutes: 60, type: AppointmentType.RESTORATION, status: AppointmentStatus.CONFIRMED },
    { id: 'apt_today_06', patientId: 'p_vip_07', providerId: 'doc1', resourceId: 'res_xray_01', branch: 'Makati Branch', date: getTodayStr(), time: '17:00', durationMinutes: 30, type: AppointmentType.CONSULTATION, status: AppointmentStatus.SCHEDULED },
    { id: 'apt_tom_01', patientId: 'p_prostho_06', providerId: 'doc4', resourceId: 'res_chair_02', branch: 'Quezon City Branch', date: getTomorrowStr(), time: '11:00', durationMinutes: 60, type: AppointmentType.PROSTHODONTICS, status: AppointmentStatus.SCHEDULED, labStatus: LabStatus.PENDING, labDetails: { shade: 'A2', material: 'Zirconia' } },
    { id: 'apt_tom_02', patientId: 'p_vip_07', providerId: 'doc1', resourceId: 'res_chair_01', branch: 'Makati Branch', date: getTomorrowStr(), time: '13:00', durationMinutes: 120, type: AppointmentType.PROSTHODONTICS, status: AppointmentStatus.CONFIRMED, labStatus: LabStatus.PENDING, labDetails: { shade: 'A1', material: 'PFM' } },
    { id: 'apt_future_01', patientId: 'p_credit_03', providerId: 'doc2', resourceId: 'res_chair_02', branch: 'Quezon City Branch', date: getFutureDateStr(30), time: '09:00', durationMinutes: 30, type: AppointmentType.ORTHODONTICS, status: AppointmentStatus.SCHEDULED },
    { id: 'apt_past_01', patientId: 'p_heavy_01', providerId: 'doc1', resourceId: 'res_chair_01', branch: 'Makati Branch', date: getPastDateStr(2), time: '10:00', durationMinutes: 60, type: AppointmentType.RESTORATION, status: AppointmentStatus.COMPLETED },
    { id: 'apt_past_02', patientId: 'p_debt_09', providerId: 'doc5', resourceId: 'res_chair_01', branch: 'Makati Branch', date: getPastDateStr(30), time: '15:00', durationMinutes: 60, type: AppointmentType.ROOT_CANAL, status: AppointmentStatus.COMPLETED },
    { id: 'apt_past_03', patientId: 'p_credit_03', providerId: 'doc2', resourceId: 'res_chair_01', branch: 'Quezon City Branch', date: getPastDateStr(60), time: '09:00', durationMinutes: 30, type: AppointmentType.ORTHODONTICS, status: AppointmentStatus.COMPLETED }
];

export const MOCK_CLAIMS: HMOClaim[] = [
    { id: 'claim_1', patientId: 'p_heavy_01', ledgerEntryId: 'l1', hmoProvider: 'Maxicare', procedureName: 'Restoration', amountClaimed: 2000, status: HMOClaimStatus.SUBMITTED, dateSubmitted: getPastDateStr(1) },
    { id: 'claim_2', patientId: 'p_full_perio_02', ledgerEntryId: 'some_id_1', hmoProvider: 'Intellicare', procedureName: 'Oral Prophylaxis', amountClaimed: 1000, status: HMOClaimStatus.PAID, dateSubmitted: getPastDateStr(30), dateReceived: getPastDateStr(5), amountReceived: 1000 },
    { id: 'claim_3', patientId: 'p_heavy_01', ledgerEntryId: 'some_id_2', hmoProvider: 'Maxicare', procedureName: 'Consultation', amountClaimed: 500, status: HMOClaimStatus.REJECTED, dateSubmitted: getPastDateStr(15), notes: 'Not covered' }
];

export const MOCK_STOCK: StockItem[] = [
    { id: 'stk_1', name: 'Anesthetic Carpules', category: StockCategory.CONSUMABLES, quantity: 50, lowStockThreshold: 20, expiryDate: getFutureDateStr(60) },
    { id: 'stk_2', name: 'Gloves (Box)', category: StockCategory.CONSUMABLES, quantity: 15, lowStockThreshold: 10, expiryDate: getFutureDateStr(365) },
    { id: 'stk_3', name: 'A2 Composite Syringe', category: StockCategory.RESTORATIVE, quantity: 5, lowStockThreshold: 2, expiryDate: getPastDateStr(5) }, 
    { id: 'stk_4', name: 'Mouth Mirror', category: StockCategory.INSTRUMENTS, quantity: 100, lowStockThreshold: 50 },
    { id: 'stk_5', name: 'Bond Paper (Ream)', category: StockCategory.OFFICE, quantity: 8, lowStockThreshold: 5 },
    { id: 'stk_6', name: 'Expiring Bond', category: StockCategory.RESTORATIVE, quantity: 2, lowStockThreshold: 5, expiryDate: getFutureDateStr(15) }, 
    { id: 'stk_7', name: 'Endo Files Set', category: StockCategory.INSTRUMENTS, quantity: 4, lowStockThreshold: 5 }, 
    { id: 'stk_8', name: 'Gutta Percha Points', category: StockCategory.RESTORATIVE, quantity: 10, lowStockThreshold: 5 },
];

export const MOCK_RESOURCES: ClinicResource[] = [
    { id: 'res_chair_01', name: 'Chair A', type: ResourceType.CHAIR, branch: 'Makati Branch' },
    { id: 'res_chair_02', name: 'Chair B', type: ResourceType.CHAIR, branch: 'Makati Branch' },
    { id: 'res_chair_03', name: 'Chair C (Pedia)', type: ResourceType.CHAIR, branch: 'Makati Branch' },
    { id: 'res_xray_01', name: 'X-Ray Unit 1', type: ResourceType.XRAY, branch: 'Makati Branch' },
    { id: 'res_chair_q1', name: 'QC Chair 1', type: ResourceType.CHAIR, branch: 'Quezon City Branch' },
    { id: 'res_chair_q2', name: 'QC Chair 2', type: ResourceType.CHAIR, branch: 'Quezon City Branch' },
];

export const MOCK_STERILIZATION_CYCLES: SterilizationCycle[] = [
    { id: 'cycle_001', date: getPastDateStr(1), autoclaveName: 'Autoclave 1', cycleNumber: '2024-05-20-01', operator: 'Asst. Sarah', passed: true },
    { id: 'cycle_002', date: getTodayStr(), autoclaveName: 'Autoclave 1', cycleNumber: '2024-05-21-01', operator: 'Asst. Sarah', passed: true },
    { id: 'cycle_003', date: getTodayStr(), autoclaveName: 'Autoclave 2', cycleNumber: '2024-05-21-02', operator: 'Asst. Sarah', passed: false },
];

export const MOCK_EXPENSES: Expense[] = [
    { id: 'exp_1', date: getPastDateStr(1), category: 'Lab Fee', description: 'Crown for M. Scott', amount: 4000, branch: 'Makati Branch' },
    { id: 'exp_2', date: getPastDateStr(5), category: 'Supplies', description: 'Dental Depot Order', amount: 15000, branch: 'Makati Branch' },
    { id: 'exp_3', date: getPastDateStr(10), category: 'Utilities', description: 'Meralco Bill', amount: 8500, branch: 'Quezon City Branch' }
];

export const MOCK_AUDIT_LOG: AuditLogEntry[] = [
    { id: 'al1', timestamp: new Date().toISOString(), userId: 'doc1', userName: 'Dr. Alexander Crentist', action: 'SUBMIT_PLAN', entity: 'TreatmentPlan', entityId: 'tp1', details: 'Submitted "Phase 1 - Urgent Care" for review.' },
    { id: 'al2', timestamp: new Date().toISOString(), userId: 'admin1', userName: 'Sarah Connor', action: 'LOGIN', entity: 'Patient', entityId: 'p_heavy_01', details: 'Viewed patient record.' }
];

export const MOCK_VENDORS: Vendor[] = [
    { id: 'v1', name: 'Precision Dental Lab', type: 'Lab', contactPerson: 'John Smith', contactNumber: '0917-123-4567', email: 'orders@precisionlab.ph', status: 'Active', dsaSignedDate: '2023-01-15', dsaExpiryDate: '2024-01-15' },
    { id: 'v2', name: 'Maxicare HMO', type: 'HMO', contactPerson: 'Claims Dept', contactNumber: '02-8888-1111', email: 'claims@maxicare.com.ph', status: 'Active', dsaSignedDate: '2023-06-01', dsaExpiryDate: '2024-06-01' },
    { id: 'v3', name: 'Dental Depot Inc.', type: 'Supplier', contactPerson: 'Jane Doe', contactNumber: '0918-999-0000', email: 'sales@dentaldepot.ph', status: 'Suspended', dsaSignedDate: '2022-01-01', dsaExpiryDate: '2023-01-01' }
];

const DEFAULT_SMS: SmsTemplates = {
    welcome: { id: 'welcome', label: 'Welcome to Practice', text: 'Welcome to dentsched, {PatientName}! Your digital health record is now active. We look forward to seeing you.', enabled: true, category: 'Onboarding', triggerDescription: 'Triggered on new patient registration.' },
    provisional: { id: 'provisional', label: 'Full Enrollment Prompt', text: 'Hi! You’re currently in our Quick Register system. Please complete your full Medical History {HistoryLink} before arrival to save time.', enabled: true, category: 'Onboarding', triggerDescription: 'Manual or 48h before first visit.' },
    birthday: { id: 'birthday', label: 'Birthday Greeting', text: 'Happy Birthday, {PatientName}! Wishing you a healthy smile today. - From your team at dentsched.', enabled: true, category: 'Onboarding', triggerDescription: 'Automated on DOB matches current date.' },
    inactive: { id: 'inactive', label: 'Patient Re-engagement', text: 'Hi {PatientName}, we noticed it’s been over a year since your last visit. Routine checkups prevent major issues! Book here: {BookingLink}.', enabled: false, category: 'Onboarding', triggerDescription: 'Triggered if lastVisit > 12 months.' },
    sedation: { id: 'sedation', label: 'Sedation/NPO Protocol', text: 'IMPORTANT: For your {Procedure} tomorrow, do not eat or drink anything (including water) for 8 hours prior to your visit.', enabled: true, category: 'Safety', triggerDescription: 'Triggered by Surgery/Extraction type.' },
    antibiotic: { id: 'antibiotic', label: 'Antibiotic Prophylaxis', text: 'Reminder: Please take your prescribed antibiotic 1 hour before your appointment for your heart valve safety protocol.', enabled: true, category: 'Safety', triggerDescription: 'Triggered by specific Medical History flags.' },
    maintenance: { id: 'maintenance', label: 'Maintenance Meds Verification', text: 'Good morning {PatientName}! Please ensure you have taken your blood pressure maintenance medication before your visit today.', enabled: true, category: 'Safety', triggerDescription: 'Triggered by High BP flag.' },
    thinners: { id: 'thinners', label: 'Blood Thinner Instruction', text: 'Reminder: For your dental procedure, please follow your physician’s instructions regarding your anticoagulant (blood thinner) schedule.', enabled: true, category: 'Safety', triggerDescription: 'Triggered by Blood Thinner flag.' },
    booking: { id: 'booking', label: 'Instant Booking Confirmation', text: 'Confirmed: {Procedure} on {Date} @ {Time} with {Doctor} at {Branch}. Reply C to confirm.', enabled: true, category: 'Logistics', triggerDescription: 'Sent when appointment is scheduled.' },
    request: { id: 'request', label: 'Confirmation Request (48h)', text: 'Expecting you on {Date} @ {Time} for {Procedure}. Please reply C to confirm your attendance.', enabled: true, category: 'Logistics', triggerDescription: 'Sent 48 hours before slot.' },
    reminder: { id: 'reminder', label: 'Final Reminder (24h)', text: 'Reminder: Your visit is tomorrow {Date} @ {Time} at {Branch}. Maps: {MapLink}. See you!', enabled: true, category: 'Logistics', triggerDescription: 'Sent 24 hours before slot.' },
    reschedule: { id: 'reschedule', label: 'Reschedule Verification', text: 'Your appointment has been successfully moved to {Date} at {Time}. We have updated our records!', enabled: true, category: 'Logistics', triggerDescription: 'Sent on date/time change.' },
    cancel: { id: 'cancel', label: 'Cancellation Acknowledgment', text: 'Your appointment on {Date} has been cancelled. If this was an error, please call us immediately.', enabled: true, category: 'Logistics', triggerDescription: 'Sent on Cancel status.' },
    noshow: { id: 'noshow', label: 'No-Show Recovery', text: 'We missed you today, {PatientName}! We hope you are okay. You can easily reschedule your session here: {BookingLink}.', enabled: true, category: 'Logistics', triggerDescription: 'Sent 30m after missed slot.' },
    hemostasis: { id: 'hemostasis', label: 'Surgical Hemostasis (1h)', text: 'Post-Op: Keep firm pressure on the gauze for 30 more minutes. Avoid spitting or using straws to protect the blood clot.', enabled: true, category: 'Recovery', triggerDescription: '1h after Extraction checkout.' },
    monitor: { id: 'monitor', label: 'Infection Monitor (24h)', text: 'Hi {PatientName}, how are you feeling after your surgery? Please call us if you experience abnormal swelling or fever.', enabled: true, category: 'Recovery', triggerDescription: '24h after Surgery checkout.' },
    bitecheck: { id: 'bitecheck', label: 'Restorative Bite Check', text: 'Your filling may feel sensitive for a few days. If your bite feels "high" once anesthesia wears off, please call for a 2-min adjustment.', enabled: true, category: 'Recovery', triggerDescription: '4h after Restoration.' },
    endo: { id: 'endo', label: 'Endodontic Temporary Care', text: 'Important: Avoid chewing on the treated side until your temporary seal is replaced with a permanent crown to prevent fracture.', enabled: true, category: 'Recovery', triggerDescription: '2h after Root Canal.' },
    white: { id: 'white', label: 'Whitening White Diet', text: 'To maintain your results, please avoid "staining" foods (coffee, tea, soy sauce, red wine) for the next 48 hours.', enabled: true, category: 'Recovery', triggerDescription: '1h after Whitening.' },
    prostho: { id: 'prostho', label: 'Prosthodontic Adaptation', text: 'Sore spots are common with new dentures. If you notice persistent discomfort, please call us for a minor adjustment.', enabled: true, category: 'Recovery', triggerDescription: '48h after Denture Adjust.' },
    ortho: { id: 'ortho', label: 'Ortho Compliance', text: 'Evening Check-in: Some soreness is normal today. Remember to wear your elastics as instructed by Dr. {Doctor}!', enabled: true, category: 'Recovery', triggerDescription: 'Evening of Ortho adjustment.' },
    srp: { id: 'srp', label: 'SRP Comfort Protocol', text: 'After deep scaling, warm salt water rinses can help soothe gum tenderness. Avoid very spicy or acidic foods today.', enabled: true, category: 'Recovery', triggerDescription: '2h after Oral Prophylaxis.' },
    checkup: { id: 'checkup', label: 'Post-Op Standard Check', text: 'Hi {PatientName}, checking in after your procedure. Any concerns or questions for the doctor?', enabled: true, category: 'Recovery', triggerDescription: 'Standard 24h follow up.' },
    balance: { id: 'balance', label: 'Outstanding Balance', text: 'Friendly reminder of your outstanding balance of ₱{Amount}. Settling this before your next visit helps keep your care seamless.', enabled: true, category: 'Financial', triggerDescription: '3 days before visit if balance > 0.' },
    hmosubmit: { id: 'hmosubmit', label: 'HMO Claim Submission', text: 'We have submitted your claim for {Procedure} to {Provider}. We will notify you once they provide a resolution.', enabled: true, category: 'Financial', triggerDescription: 'On Claim Submission.' },
    hmoresolve: { id: 'hmoresolve', label: 'HMO Resolution Alert', text: 'Good news! {Provider} has processed your claim. Your remaining patient responsibility for this visit is ₱{Amount}.', enabled: true, category: 'Financial', triggerDescription: 'On Claim Paid/Rejected.' },
    philhealth: { id: 'philhealth', label: 'PhilHealth Case-Rate Update', text: 'Your PhilHealth benefit has been successfully applied to your treatment. View the updated ledger in your portal.', enabled: true, category: 'Financial', triggerDescription: 'On PhilHealth submission.' },
    security: { id: 'security', label: 'Contact Change Alert', text: 'Security Alert: Your contact information was updated. If this was not you, please contact the clinic immediately.', enabled: true, category: 'Security', triggerDescription: 'On Phone/Email change.' },
    waitlist: { id: 'waitlist', label: 'Waitlist Priority Opening', text: 'Hi {PatientName}! A slot just opened up today at {Time} for your {Procedure}. Tap here to grab it: {Link}.', enabled: true, category: 'Efficiency', triggerDescription: 'On Waitlist match + Cancellation.' },
    referral: { id: 'referral', label: 'Referral Follow-up', text: 'Hi {PatientName}, checking in to see if you’ve scheduled your consultation with the specialist we recommended last week.', enabled: false, category: 'Efficiency', triggerDescription: '7 days after Referral.' },
};

export const DEFAULT_FIELD_SETTINGS: FieldSettings = {
  clinicName: 'Practice Name',
  clinicProfile: 'boutique',
  suffixes: ['Mr', 'Ms', 'Mrs', 'Dr', 'Engr', 'Atty', 'Ph.D', 'Jr', 'Sr', 'III'],
  civilStatus: ['Single', 'Married', 'Widowed', 'Separated', 'Divorced'],
  insuranceProviders: ['Maxicare', 'Intellicare', 'PhilHealth', 'Medicard', 'Etiqa', 'Pacific Cross', 'ValuCare'],
  bloodGroups: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
  allergies: ['None', 'Aspirin', 'Penicillin', 'Sulfa', 'Local Anesthetic', 'Latex', 'Ibuprofen', 'Seafood'],
  medicalConditions: [
    'None', 'High BP', 'Low BP', 'Epilepsy', 'Diabetes', 'Asthma', 'Heart Disease', 'Hepatitis', 'Kidney Issues', 'Bleeding Issues', 'Pregnancy', 'Thyroid Issues', 'HIV/AIDS', 'Tuberculosis', 'Osteoporosis', 'Rheumatic Fever'
  ],
  procedures: [
      { id: 'p1', name: 'Consultation', price: 500, category: 'General' },
      { id: 'p2', name: 'Oral Prophylaxis', price: 1200, category: 'Preventive' },
      { id: 'p3', name: 'Restoration', price: 1500, category: 'Restorative', riskAllergies: ['Latex'], billOfMaterials: [ { stockItemId: 'stk_1', quantity: 1 }, { stockItemId: 'stk_2', quantity: 2 }, { stockItemId: 'stk_3', quantity: 1 }] },
      { id: 'p4', name: 'Extraction', price: 1000, category: 'Surgery', requiresConsent: true, riskAllergies: ['Latex', 'Penicillin'], riskDisclosures: ['Alveolar osteitis (dry socket)', 'Post-operative bleeding', 'Infection', 'Damage to adjacent teeth', 'Nerve paresthesia'], billOfMaterials: [ { stockItemId: 'stk_1', quantity: 2 }, { stockItemId: 'stk_2', quantity: 2 }] },
      { id: 'p5', name: 'Root Canal', price: 8000, category: 'Endodontics', requiresConsent: true, riskAllergies: ['Latex', 'Local Anesthetic'], riskDisclosures: ['Post-treatment sensitivity', 'Instrument separation', 'Re-infection', 'Tooth fracture', 'Sinus involvement'], billOfMaterials: [ { stockItemId: 'stk_7', quantity: 1 }, { stockItemId: 'stk_8', quantity: 4 }, { stockItemId: 'stk_1', quantity: 1 }] },
      { id: 'p6', name: 'Prosthodontics', price: 15000, category: 'Restorative' },
      { id: 'p7', name: 'Orthodontics', price: 50000, category: 'Orthodontics' },
      { id: 'p8', name: 'Surgery', price: 5000, category: 'Surgery', requiresConsent: true, riskAllergies: ['Latex', 'Penicillin', 'Local Anesthetic'], riskDisclosures: ['Jaw stiffness (trismus)', 'Nerve injury', 'Sinus perforation', 'Reaction to anesthetic'], billOfMaterials: [ { stockItemId: 'stk_1', quantity: 4 }, { stockItemId: 'stk_2', quantity: 2 }] },
      { id: 'p9', name: 'Whitening', price: 20000, category: 'Cosmetic' },
      { id: 'p10', name: 'Denture Adjustments', price: 500, category: 'Prosthodontics' },
      { id: 'p11', name: 'Sealant', price: 1500, category: 'Pediatric' },
      { id: 'p12', name: 'Exam', price: 0, category: 'General' },
      { id: 'p13', name: 'Crown', price: 12000, category: 'Prosthodontics', riskAllergies: ['Latex'] },
      { id: 'p14', name: 'Missing', price: 0, category: 'General' },
      { id: 'p15', name: 'Communication Log', price: 0, category: 'General' }
  ], 
  branches: ['Makati Branch', 'Quezon City Branch', 'BGC Branch', 'Alabang Branch'],
  features: {
      enableLabTracking: true,
      enableComplianceAudit: true,
      enableDentalAssistantFlow: true,
      enableMultiBranch: true,
      enableHMOClaims: true,
      enableInventory: true,
      enableAnalytics: true,
      enablePatientPortal: false, // MANDATORY: PATIENT HAS ZERO REMOTE ACCESS
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
      enableSmsAutomation: true,
      enableMaterialTraceability: true,
      enableBirComplianceMode: false,
      // Fixed missing FeatureToggles properties
      enableStatutoryBirTrack: true,
      enableHmoInsuranceTrack: true
  },
  smsTemplates: DEFAULT_SMS,
  stockCategories: Object.values(StockCategory),
  stockItems: MOCK_STOCK,
  expenseCategories: ['Lab Fee', 'Supplies', 'Utilities', 'Rent', 'Salary', 'Other'],
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
        requiresMedicalConditions: [],
        requiresDocumentCategory: 'X-Ray',
        alertMessage: 'A recent X-ray is required for surgical extractions to assess root morphology and vital structures. Acknowledge and proceed only if an X-ray has been reviewed.'
    }
  ],
  medications: [
      { 
          id: 'med1', 
          name: 'Amoxicillin', 
          dosage: '500mg', 
          instructions: 'Take 1 capsule every 8 hours for 7 days.', 
          contraindicatedAllergies: ['Penicillin'],
          interactions: ['Warfarin'],
          pediatricDosage: '20-40 mg/kg/day in divided doses every 8 hours.'
      },
      { 
          id: 'med2', 
          name: 'Mefenamic Acid', 
          dosage: '500mg', 
          instructions: 'Take 1 tablet every 6 hours as needed for pain.', 
          contraindicatedAllergies: ['Aspirin', 'Ibuprofen'],
          pediatricDosage: '6.5 mg/kg/dose. Not recommended for children under 14.'
      },
      { 
          id: 'med3', 
          name: 'Tramadol', 
          dosage: '50mg', 
          instructions: 'Take 1 capsule every 6 hours for severe pain.', 
          isS2Controlled: true,
          pediatricDosage: 'Not recommended for children under 12 years of age.'
      }
  ],
  consentFormTemplates: [
      { id: 'c1', name: 'General Dental Consent', content: 'I, {PatientName}, hereby authorize Dr. {DoctorName} to perform {ProcedureList} on {Date}. I have been informed of the risks and alternatives.' },
      { id: 'c2', name: 'Surgical Extraction Consent', content: 'I, {PatientName}, understand that the extraction of teeth involves risks including but not limited to dry socket, infection, and nerve injury. I authorize Dr. {DoctorName} to proceed.' }
  ],
  currentPrivacyVersion: '1.0',
  resources: MOCK_RESOURCES
};

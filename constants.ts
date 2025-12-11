
import { User, UserRole, Patient, Appointment, AppointmentType, AppointmentStatus, LabStatus, FieldSettings } from './types';

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
        dentalChart: [
             // RECENT (Current Month)
             { toothNumber: 46, procedure: 'Restoration', status: 'Completed', surfaces: 'MO', price: 2500, payment: 0, date: getPastDateStr(2), author: 'Dr. Alex', notes: 'Deep caries.' },
             { toothNumber: 47, procedure: 'Restoration', status: 'Completed', surfaces: 'O', price: 2500, payment: 2500, date: getPastDateStr(2), author: 'Dr. Alex' },
             
             // LAST MONTH
             { toothNumber: 11, procedure: 'Crown', status: 'Completed', notes: 'PFM Crown', price: 12000, payment: 12000, date: getPastDateStr(35), author: 'Dr. Dave' },
             { toothNumber: 21, procedure: 'Crown', status: 'Completed', notes: 'PFM Crown', price: 12000, payment: 12000, date: getPastDateStr(35), author: 'Dr. Dave' },
             { toothNumber: 0, procedure: 'Oral Prophylaxis', status: 'Completed', price: 1500, payment: 1500, date: getPastDateStr(40), author: 'Asst. Sarah' },

             // 2 MONTHS AGO
             { toothNumber: 36, procedure: 'Root Canal', status: 'Completed', notes: 'Obturation', price: 8000, payment: 8000, date: getPastDateStr(65), author: 'Dr. Elena' },
             { toothNumber: 36, procedure: 'Root Canal', status: 'Completed', notes: 'Cleaning & Shaping', price: 0, date: getPastDateStr(72), author: 'Dr. Elena' },
             { toothNumber: 36, procedure: 'Root Canal', status: 'Completed', notes: 'Access Opening', price: 0, date: getPastDateStr(79), author: 'Dr. Elena' },

             // HISTORICAL / EXISTING
             { toothNumber: 18, procedure: 'Missing', status: 'Existing', date: '2020-01-01' },
             { toothNumber: 28, procedure: 'Missing', status: 'Existing', date: '2020-01-01' },
             { toothNumber: 38, procedure: 'Missing', status: 'Existing', date: '2020-01-01' },
             { toothNumber: 48, procedure: 'Missing', status: 'Existing', date: '2020-01-01' },
             { toothNumber: 14, procedure: 'Restoration', status: 'Existing', surfaces: 'MOD', date: '2022-05-10' },
             { toothNumber: 24, procedure: 'Restoration', status: 'Existing', surfaces: 'DO', date: '2022-05-10' },
             { toothNumber: 16, procedure: 'Crown', status: 'Planned', notes: 'Crack lines visible', price: 15000, date: getTomorrowStr() }
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
            // UPPER RIGHT
            { toothNumber: 18, pocketDepths: [5,6,5, 6,7,6], recession: [1,1,1, 2,2,2], bleeding: [true,true,true,true,true,true], mobility: 1 },
            { toothNumber: 17, pocketDepths: [4,5,4, 5,5,5], recession: [0,0,0, 1,1,1], bleeding: [true,false,true,true,false,true], mobility: 0 },
            { toothNumber: 16, pocketDepths: [3,3,3, 4,4,4], recession: [0,0,0, 0,0,0], bleeding: [false,false,false,true,false,false], mobility: 0 },
            { toothNumber: 15, pocketDepths: [2,2,2, 2,3,2], recession: [0,0,0, 0,0,0], bleeding: [false,false,false,false,false,false], mobility: 0 },
            { toothNumber: 14, pocketDepths: [2,2,2, 2,2,2], recession: [0,0,0, 0,0,0], bleeding: [false,false,false,false,false,false], mobility: 0 },
            { toothNumber: 13, pocketDepths: [5,6,5, 4,4,4], recession: [2,3,2, 1,1,1], bleeding: [true,true,true,false,false,false], mobility: 1 },
            { toothNumber: 12, pocketDepths: [3,3,3, 3,3,3], recession: [1,1,1, 1,1,1], bleeding: [false,false,false,false,false,false], mobility: 0 },
            { toothNumber: 11, pocketDepths: [3,3,3, 3,3,3], recession: [1,1,1, 1,1,1], bleeding: [false,false,false,false,false,false], mobility: 0 },
            // UPPER LEFT
            { toothNumber: 21, pocketDepths: [3,3,3, 3,3,3], recession: [1,1,1, 1,1,1], bleeding: [false,false,false,false,false,false], mobility: 0 },
            { toothNumber: 22, pocketDepths: [3,3,3, 3,3,3], recession: [1,1,1, 1,1,1], bleeding: [false,false,false,false,false,false], mobility: 0 },
            { toothNumber: 23, pocketDepths: [4,5,4, 4,4,4], recession: [2,2,2, 1,1,1], bleeding: [true,true,true,false,false,false], mobility: 0 },
            { toothNumber: 24, pocketDepths: [2,2,2, 2,2,2], recession: [0,0,0, 0,0,0], bleeding: [false,false,false,false,false,false], mobility: 0 },
            { toothNumber: 25, pocketDepths: [2,2,2, 2,2,2], recession: [0,0,0, 0,0,0], bleeding: [false,false,false,false,false,false], mobility: 0 },
            { toothNumber: 26, pocketDepths: [5,6,5, 5,5,5], recession: [1,1,1, 1,1,1], bleeding: [true,true,true,true,true,true], mobility: 1 },
            { toothNumber: 27, pocketDepths: [4,4,4, 4,4,4], recession: [0,0,0, 0,0,0], bleeding: [false,true,false,false,false,false], mobility: 0 },
            { toothNumber: 28, pocketDepths: [6,7,6, 6,7,6], recession: [2,2,2, 2,2,2], bleeding: [true,true,true,true,true,true], mobility: 2 },
            // LOWER ARCH (Partial for brevity, but system handles full)
            { toothNumber: 31, pocketDepths: [5,5,5, 4,4,4], recession: [1,1,1, 1,1,1], bleeding: [true, true, true, true, true, true], mobility: 1 },
            { toothNumber: 36, pocketDepths: [4,5,4, 3,3,3], recession: [0,0,0, 0,0,0], bleeding: [true,false,false,false,false,false], mobility: 0 },
            { toothNumber: 46, pocketDepths: [4,5,4, 5,6,5], recession: [0,0,0, 0,0,0], bleeding: [true, true, true, false, false, false], mobility: 1 }
        ],
        dentalChart: [
            { toothNumber: 0, procedure: 'Oral Prophylaxis', status: 'Planned', notes: 'Deep Scaling / Root Planing needed', price: 3500 }
        ]
    },

    // 3. THE CREDIT BALANCE PATIENT (Overpayment Logic)
    {
        id: 'p_credit_03',
        name: 'Maria Clara',
        firstName: 'Maria',
        surname: 'Clara',
        dob: '1995-06-19',
        age: 29,
        sex: 'Female',
        phone: '0917-123-4567',
        email: 'maria.clara@email.com',
        occupation: 'Software Engineer',
        lastVisit: getPastDateStr(25),
        nextVisit: getTodayStr(),
        chiefComplaint: 'Wire poking upper right.',
        notes: 'Pre-paid for full Ortho package. Negative balance indicates credit.',
        currentBalance: -5000, // Credit
        dentalChart: [
             { toothNumber: 0, procedure: 'Orthodontics', status: 'Completed', notes: 'Downpayment', price: 10000, payment: 15000, date: getPastDateStr(90) },
             { toothNumber: 0, procedure: 'Orthodontics', status: 'Completed', notes: 'Adjustment', price: 1000, payment: 0, date: getPastDateStr(60) },
             { toothNumber: 0, procedure: 'Orthodontics', status: 'Completed', notes: 'Adjustment', price: 1000, payment: 0, date: getPastDateStr(30) },
             { toothNumber: 0, procedure: 'Orthodontics', status: 'Planned', notes: 'Adjustment', price: 1000, date: getTodayStr() }
        ],
        ledger: [
            { id: 'l1', date: getPastDateStr(90), description: 'Ortho Package Downpayment', type: 'Payment', amount: 15000, balanceAfter: -15000 },
            { id: 'l2', date: getPastDateStr(90), description: 'Initial Bonding Fee', type: 'Charge', amount: 10000, balanceAfter: -5000 },
            { id: 'l3', date: getPastDateStr(60), description: 'Adjustment Fee', type: 'Charge', amount: 1000, balanceAfter: -4000 },
            { id: 'l4', date: getPastDateStr(30), description: 'Adjustment Fee', type: 'Charge', amount: 1000, balanceAfter: -3000 },
            { id: 'l5', date: getPastDateStr(0), description: 'Advance Payment', type: 'Payment', amount: 2000, balanceAfter: -5000 }
        ]
    },

    // 4. THE SURGICAL CASE (Medical Alerts, High Risk)
    {
        id: 'p_surg_04',
        name: 'Juan Dela Cruz',
        firstName: 'Juan',
        surname: 'Dela Cruz',
        dob: '1980-12-30',
        age: 43,
        sex: 'Male',
        phone: '0919-987-6543',
        email: 'juan.dc@email.com',
        occupation: 'Architect',
        lastVisit: getPastDateStr(5),
        nextVisit: null,
        // Critical Medical History
        medicalConditions: ['High BP', 'Diabetes'],
        medicationDetails: 'Metformin 500mg, Amlodipine 5mg',
        underMedicalTreatment: true,
        allergies: ['Penicillin', 'Latex'],
        goodHealth: false,
        notes: 'Needs medical clearance for extraction. STOP anticoagulants 3 days prior.',
        chiefComplaint: 'Pain on lower right wisdom tooth.',
        dentalChart: [
            { toothNumber: 48, procedure: 'Extraction', status: 'Planned', notes: 'Horizontal Impaction', price: 15000, date: getTodayStr() },
            { toothNumber: 38, procedure: 'Missing', status: 'Existing', date: '2020-01-01' },
            { toothNumber: 48, procedure: 'Exam', status: 'Condition', notes: 'Pericoronitis present', date: getPastDateStr(5) }
        ],
        currentBalance: 0
    },

    // 5. THE PEDIATRIC PATIENT (Guardian Info, Mixed Dentition)
    {
        id: 'p_pedia_05',
        name: 'Timothy Santos',
        firstName: 'Timothy',
        surname: 'Santos',
        dob: '2016-05-15',
        age: 8,
        sex: 'Male',
        phone: '0917-555-0101',
        email: 'parent.timothy@email.com',
        guardian: 'Mrs. Santos (Mother)',
        guardianMobile: '0917-555-0101',
        lastVisit: getPastDateStr(60),
        nextVisit: getTodayStr(),
        notes: 'Anxious patient. Likes superheroes. Use "Sleepy Juice" for anesthesia.',
        chiefComplaint: 'Loose milk tooth.',
        dentalChart: [
            { toothNumber: 54, procedure: 'Extraction', status: 'Completed', notes: 'Topical only', price: 800, date: getPastDateStr(60) },
            { toothNumber: 16, procedure: 'Sealant', status: 'Planned', price: 1500, date: getTodayStr() },
            { toothNumber: 26, procedure: 'Sealant', status: 'Planned', price: 1500, date: getTodayStr() },
            { toothNumber: 36, procedure: 'Sealant', status: 'Planned', price: 1500, date: getTodayStr() },
            { toothNumber: 46, procedure: 'Sealant', status: 'Planned', price: 1500, date: getTodayStr() }
        ]
    },

    // 6. THE PROSTHO / LAB CASE (Lab Tracking)
    {
        id: 'p_prostho_06',
        name: 'Lola Nidora Zobel',
        firstName: 'Nidora',
        surname: 'Zobel',
        dob: '1950-08-20',
        age: 73,
        sex: 'Female',
        phone: '0918-999-8888',
        email: 'lola.nidoraz@email.com',
        lastVisit: getPastDateStr(7),
        nextVisit: getTomorrowStr(),
        occupation: 'Retired',
        medicalConditions: ['Arthritis'],
        notes: 'Upper and Lower Complete Denture in progress. Wants lighter shade.',
        chiefComplaint: 'Old dentures are loose.',
        dentalChart: [
             { toothNumber: 0, procedure: 'Prosthodontics', status: 'Completed', notes: 'Impressions taken', date: getPastDateStr(7) },
             { toothNumber: 0, procedure: 'Prosthodontics', status: 'Planned', notes: 'Trial Fitting', date: getTomorrowStr() }
        ],
        currentBalance: 15000
    },

    // 7. THE VIP / COSMETIC (High Value)
    {
        id: 'p_vip_07',
        name: 'Bella Hadid (Demo)',
        firstName: 'Bella',
        surname: 'Hadid',
        dob: '1996-10-09',
        age: 27,
        sex: 'Female',
        phone: '0917-VIP-0001',
        email: 'bella.hadid@email.com',
        lastVisit: getPastDateStr(3),
        nextVisit: getTomorrowStr(),
        occupation: 'Model',
        notes: 'VIP. Prefers quiet room. Emax Veneers 14-24.',
        chiefComplaint: 'Wants a brighter smile for photoshoot.',
        dentalChart: [
            { toothNumber: 11, procedure: 'Crown', status: 'Completed', surfaces: 'All', notes: 'Emax Veneer Prep', date: getPastDateStr(3) },
            { toothNumber: 12, procedure: 'Crown', status: 'Completed', surfaces: 'All', notes: 'Emax Veneer Prep', date: getPastDateStr(3) },
            { toothNumber: 21, procedure: 'Crown', status: 'Completed', surfaces: 'All', notes: 'Emax Veneer Prep', date: getPastDateStr(3) },
            { toothNumber: 22, procedure: 'Crown', status: 'Completed', surfaces: 'All', notes: 'Emax Veneer Prep', date: getPastDateStr(3) }
        ],
        currentBalance: 0
    },

    // 8. THE EMERGENCY WALK-IN (Pain)
    {
        id: 'p_emerg_08',
        name: 'Mark Techy',
        firstName: 'Mark',
        surname: 'Techy',
        dob: '1990-01-01',
        age: 34,
        sex: 'Male',
        phone: '0922-333-4444',
        email: 'mark.techy@email.com',
        occupation: 'IT Support',
        lastVisit: 'First Visit',
        nextVisit: getTodayStr(),
        chiefComplaint: 'Severe pain on upper right. Cannot sleep.',
        notes: 'Emergency walk-in. Swelling present.',
        dentalChart: [
            { toothNumber: 16, procedure: 'Root Canal', status: 'Planned', notes: 'Symptomatic Irreversible Pulpitis', price: 12000 }
        ]
    },

    // 9. THE BAD DEBTOR (Red Flags)
    {
        id: 'p_debt_09',
        name: 'Ronnie Runner',
        firstName: 'Ronnie',
        surname: 'Runner',
        dob: '1999-09-09',
        age: 24,
        sex: 'Male',
        phone: '0999-000-0000',
        email: 'ronnie.runner@email.com',
        lastVisit: getPastDateStr(30),
        nextVisit: null,
        notes: 'COLLECTION ALERT. Cheque bounced. Do not book until paid.',
        chiefComplaint: 'Needs checkup (Denied until payment)',
        currentBalance: 15000,
        ledger: [
            { id: 'l1', date: getPastDateStr(30), description: 'Root Canal 46', type: 'Charge', amount: 15000, balanceAfter: 15000 },
            { id: 'l2', date: getPastDateStr(30), description: 'Cheque Payment', type: 'Payment', amount: 15000, balanceAfter: 0 },
            { id: 'l3', date: getPastDateStr(28), description: 'Cheque Bounce Penalty', type: 'Charge', amount: 15000, balanceAfter: 15000 }
        ]
    },
    
    // 10. THE COMPLEX RESTORATIVE (Many existing fillings)
    {
        id: 'p_complex_10',
        name: 'Gary Grinder',
        firstName: 'Gary',
        surname: 'Grinder',
        dob: '1982-03-15',
        age: 42,
        sex: 'Male',
        phone: '0917-888-1234',
        email: 'gary.g@email.com',
        occupation: 'Chef',
        lastVisit: getPastDateStr(60),
        nextVisit: null,
        chiefComplaint: 'Sensitivity on cold.',
        notes: 'Bruxer. Night guard recommended.',
        dentalChart: [
            { toothNumber: 16, procedure: 'Restoration', status: 'Existing', surfaces: 'MOD', date: getPastDateStr(500) },
            { toothNumber: 26, procedure: 'Restoration', status: 'Existing', surfaces: 'DO', date: getPastDateStr(500) },
            { toothNumber: 36, procedure: 'Crown', status: 'Existing', date: getPastDateStr(400) },
            { toothNumber: 46, procedure: 'Missing', status: 'Existing', date: getPastDateStr(600) },
            { toothNumber: 14, procedure: 'Root Canal', status: 'Existing', date: getPastDateStr(300) },
            { toothNumber: 14, procedure: 'Crown', status: 'Planned', notes: 'Post-Endo Crown', price: 12000 }
        ]
    }
];

export const APPOINTMENTS: Appointment[] = [
    // --- TODAY'S SCHEDULE (Packed Flow) ---
    {
        id: 'apt_today_01',
        patientId: 'p_credit_03',
        providerId: 'doc2',
        branch: 'Quezon City Branch',
        date: getTodayStr(),
        time: '09:00',
        durationMinutes: 30,
        type: AppointmentType.ORTHODONTICS,
        status: AppointmentStatus.COMPLETED, // Already done
        notes: 'Morning Adjustment.'
    },
    {
        id: 'apt_today_02',
        patientId: 'p_surg_04',
        providerId: 'doc1',
        branch: 'Makati Branch',
        date: getTodayStr(),
        time: '10:00',
        durationMinutes: 90,
        type: AppointmentType.SURGERY,
        status: AppointmentStatus.TREATING, // Currently in chair
        notes: 'Wisdom tooth removal. Consent signed.'
    },
    {
        id: 'apt_today_03',
        patientId: 'p_pedia_05',
        providerId: 'doc3',
        branch: 'Makati Branch',
        date: getTodayStr(),
        time: '13:00',
        durationMinutes: 45,
        type: AppointmentType.CONSULTATION,
        status: AppointmentStatus.SEATED, // Prepped, waiting for doctor
        notes: 'Sealants and Fluoride.'
    },
    {
        id: 'apt_today_04',
        patientId: 'p_emerg_08',
        providerId: 'doc5',
        branch: 'Makati Branch',
        date: getTodayStr(),
        time: '14:00',
        durationMinutes: 60,
        type: AppointmentType.ROOT_CANAL,
        status: AppointmentStatus.ARRIVED, // Waiting in lobby
        notes: 'Emergency Pain. Walk-in.'
    },
    {
        id: 'apt_today_05',
        patientId: 'p_heavy_01',
        providerId: 'doc1',
        branch: 'Makati Branch',
        date: getTodayStr(),
        time: '15:30',
        durationMinutes: 60,
        type: AppointmentType.RESTORATION,
        status: AppointmentStatus.CONFIRMED, // Not yet arrived
        notes: 'Filling on 16.'
    },

    // --- TOMORROW (Prep Stats / Lab Watch) ---
    {
        id: 'apt_tom_01',
        patientId: 'p_prostho_06',
        providerId: 'doc4',
        branch: 'Quezon City Branch',
        date: getTomorrowStr(),
        time: '11:00',
        durationMinutes: 60,
        type: AppointmentType.PROSTHODONTICS,
        status: AppointmentStatus.SCHEDULED,
        labStatus: LabStatus.PENDING, // Triggers Lab Watch on Dashboard
        notes: 'Denture Try-in'
    },
    {
        id: 'apt_tom_02',
        patientId: 'p_vip_07',
        providerId: 'doc1',
        branch: 'Makati Branch',
        date: getTomorrowStr(),
        time: '13:00',
        durationMinutes: 120,
        type: AppointmentType.PROSTHODONTICS,
        status: AppointmentStatus.CONFIRMED,
        notes: 'Veneer Cementation'
    },

    // --- FUTURE (Next Month) ---
    {
        id: 'apt_future_01',
        patientId: 'p_credit_03',
        providerId: 'doc2',
        branch: 'Quezon City Branch',
        date: getFutureDateStr(30),
        time: '09:00',
        durationMinutes: 30,
        type: AppointmentType.ORTHODONTICS,
        status: AppointmentStatus.SCHEDULED,
        notes: 'Next Adjustment.'
    },

    // --- PAST HISTORY (Previous Month) ---
    {
        id: 'apt_past_01',
        patientId: 'p_heavy_01',
        providerId: 'doc1',
        branch: 'Makati Branch',
        date: getPastDateStr(2),
        time: '10:00',
        durationMinutes: 60,
        type: AppointmentType.RESTORATION,
        status: AppointmentStatus.COMPLETED,
        notes: 'Deep caries treated.'
    },
    {
        id: 'apt_past_02',
        patientId: 'p_debt_09',
        providerId: 'doc5',
        branch: 'Makati Branch',
        date: getPastDateStr(30),
        time: '15:00',
        durationMinutes: 60,
        type: AppointmentType.ROOT_CANAL,
        status: AppointmentStatus.COMPLETED,
        notes: 'Patient paid by cheque (Bounced later).'
    },
    {
        id: 'apt_past_03',
        patientId: 'p_credit_03',
        providerId: 'doc2',
        branch: 'Quezon City Branch',
        date: getPastDateStr(60),
        time: '09:00',
        durationMinutes: 30,
        type: AppointmentType.ORTHODONTICS,
        status: AppointmentStatus.COMPLETED,
        notes: 'Adjustment done.'
    }
];

// Initial defaults
export const DEFAULT_FIELD_SETTINGS: FieldSettings = {
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
      { id: 'p4', name: 'Extraction', price: 1000, category: 'Surgery' },
      { id: 'p5', name: 'Root Canal', price: 8000, category: 'Endodontics' },
      { id: 'p6', name: 'Prosthodontics', price: 15000, category: 'Restorative' },
      { id: 'p7', name: 'Orthodontics', price: 50000, category: 'Orthodontics' },
      { id: 'p8', name: 'Surgery', price: 5000, category: 'Surgery' },
      { id: 'p9', name: 'Whitening', price: 20000, category: 'Cosmetic' },
      { id: 'p10', name: 'Denture Adjustments', price: 500, category: 'Prosthodontics' },
      { id: 'p11', name: 'Sealant', price: 1500, category: 'Pediatric' },
      { id: 'p12', name: 'Exam', price: 0, category: 'General' },
      { id: 'p13', name: 'Crown', price: 12000, category: 'Prosthodontics' },
      { id: 'p14', name: 'Missing', price: 0, category: 'General' }
  ], 
  branches: ['Makati Branch', 'Quezon City Branch', 'BGC Branch', 'Alabang Branch'],
  features: {
      enableLabTracking: true,
      enableComplianceAudit: true,
      enableDentalAssistantFlow: true,
      enableMultiBranch: true
  },
  smsTemplates: {
      bookingConfirmation: "Hi {PatientName}, confirmed: {Date} @ {Time} w/ {ProviderName} at {Branch}. Reply C to confirm.",
      confirmationRequest: "Hi {PatientName}, expecting you on {Date} @ {Time}. Reply C to Confirm.",
      reminder24h: "Reminder: Appt tomorrow {Date} @ {Time} at {Branch}. See you!",
      postOpCheckup: "Hi {PatientName}, checking in after your procedure. Any concerns?",
      registrationWelcome: "Welcome to dentsched, {PatientName}! Your record is ready."
  }
};

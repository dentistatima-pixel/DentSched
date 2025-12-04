import { User, UserRole, Patient, Appointment, AppointmentType, AppointmentStatus, LabStatus, FieldSettings } from './types';

// Generators for mock data
const generateId = () => Math.random().toString(36).substring(2, 9);

// --- DATE UTILITY ---
export const formatDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return '-';
  
  // Handle ISO YYYY-MM-DD explicitly to avoid timezone shifts
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
  }

  // Handle standard Date objects or ISO strings with time
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
      }
  },
  { id: 'admin2', name: 'John Smith', role: UserRole.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', allowedBranches: ['Makati Branch'] },
  
  { 
      id: 'doc1', 
      name: 'Dr. Alexander Crentist', 
      role: UserRole.DENTIST, 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      specialization: 'General Dentistry',
      prcLicense: '0123456',
      prcValidity: '2025-10-15',
      ptrNumber: '8812391',
      tin: '123-456-789-000',
      pdaId: 'PDA-NCR-1029',
      pdaChapter: 'Makati Dental Chapter',
      clinicHours: 'MWF 9:00AM - 5:00PM',
      defaultBranch: 'Makati Branch',
      allowedBranches: ['Makati Branch', 'Quezon City Branch'], 
      colorPreference: '#14b8a6', 
      defaultConsultationFee: 500.00,
      preferences: {
          showFinancials: true,
          showTraySetup: true,
          showPatientFlow: false,
          showLabAlerts: true,
          defaultDentition: 'Adult'
      }
  },
  { 
      id: 'doc2', 
      name: 'Dr. Benjamin Molar', 
      role: UserRole.DENTIST, 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ben',
      specialization: 'Orthodontics',
      prcLicense: '0987654',
      prcValidity: '2026-03-20',
      ptrNumber: '8823412',
      tin: '222-333-444-000',
      pdaId: 'PDA-NCR-2045',
      pdaChapter: 'Quezon City Chapter',
      s2License: 'S2-001239-R',
      clinicHours: 'TThS 10:00AM - 6:00PM',
      defaultBranch: 'Quezon City Branch',
      allowedBranches: ['Quezon City Branch'],
      colorPreference: '#8b5cf6', 
      defaultConsultationFee: 800.00,
      preferences: {
        showFinancials: true,
        showLabAlerts: true
      }
  },
  { id: 'doc3', name: 'Dr. Cassandra Filling', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cass', specialization: 'Pediatric Dentistry', prcLicense: '0112233', colorPreference: '#f43f5e', defaultBranch: 'Makati Branch', allowedBranches: ['Makati Branch'], preferences: { defaultDentition: 'Child' } },
  { id: 'doc4', name: 'Dr. David Crown', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dave', specialization: 'Prosthodontics', prcLicense: '0445566', colorPreference: '#f59e0b', defaultBranch: 'Quezon City Branch', allowedBranches: ['Quezon City Branch'] },
  { id: 'doc5', name: 'Dr. Elena Root', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', specialization: 'Endodontics', prcLicense: '0778899', colorPreference: '#10b981', defaultBranch: 'Makati Branch', allowedBranches: ['Makati Branch'] },
  
  // Dental Assistants
  { 
      id: 'asst1', 
      name: 'Asst. Sarah Sparkle', 
      role: UserRole.DENTAL_ASSISTANT, 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg1',
      employeeId: 'DA-2023-001',
      certifications: ['Tesda NCII Dental Hygiene', 'X-Ray Safety Officer'],
      assignedDoctors: ['doc1', 'doc2'], 
      canViewFinancials: false,
      defaultBranch: 'Makati Branch',
      allowedBranches: ['Makati Branch', 'Quezon City Branch'],
      isReadOnly: false,
      preferences: {
          showTraySetup: true,
          showPatientFlow: true,
          showLabAlerts: true
      }
  },
  { 
      id: 'asst2', 
      name: 'Asst. Fred Floss', 
      role: UserRole.DENTAL_ASSISTANT, 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg2',
      employeeId: 'DA-2023-002',
      certifications: ['Basic Life Support', 'Infection Control'],
      assignedDoctors: ['doc3'], 
      canViewFinancials: false,
      defaultBranch: 'Makati Branch',
      allowedBranches: ['Makati Branch'],
      isReadOnly: true,
      preferences: {
          showTraySetup: true,
          showPatientFlow: true
      }
  },
  { id: 'asst3', name: 'Asst. Mary Mint', role: UserRole.DENTAL_ASSISTANT, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg3', assignedDoctors: ['doc4', 'doc5'], defaultBranch: 'Quezon City Branch', allowedBranches: ['Quezon City Branch'] }
];

export const PATIENTS: Patient[] = [
    {
        id: 'p_child_001',
        name: 'Timothy Santos',
        firstName: 'Timothy',
        surname: 'Santos',
        dob: '2016-05-15',
        age: 8,
        sex: 'Male',
        phone: '0917-555-0101',
        email: 'timothy.santos@email.com',
        lastVisit: '2023-10-15',
        nextVisit: null,
        notes: 'Patient is a bit anxious. Likes superheroes.',
        insuranceProvider: 'Maxicare'
    },
    {
        id: 'p_adult_002',
        name: 'Maria Clara',
        firstName: 'Maria',
        surname: 'Clara',
        dob: '1990-06-19',
        age: 33,
        sex: 'Female',
        phone: '0918-555-0202',
        email: 'maria.clara@email.com',
        lastVisit: '2023-11-20',
        nextVisit: '2024-05-20',
        notes: 'Allergic to Latex.',
        allergies: ['Latex'],
        insuranceProvider: 'PhilHealth',
        dentalChart: [
            { toothNumber: 18, procedure: 'Missing', status: 'Existing', date: '2020-01-01' },
            { toothNumber: 16, procedure: 'Composite Restoration (1 Surface)', surfaces: 'O', status: 'Completed', price: 1500, date: '2023-11-20' },
            { toothNumber: 26, procedure: 'Root Canal (Molar)', status: 'Planned', price: 12000, date: '2023-11-20' }
        ]
    },
    {
        id: 'p_adult_003',
        name: 'Juan Dela Cruz',
        firstName: 'Juan',
        surname: 'Dela Cruz',
        dob: '1985-12-30',
        age: 38,
        sex: 'Male',
        phone: '0919-555-0303',
        email: 'juan.delacruz@email.com',
        lastVisit: '2023-09-01',
        nextVisit: null,
        notes: 'Needs clearance for surgery.',
        medicalConditions: ['High BP'],
        insuranceProvider: 'Intellicare'
    }
];

export const APPOINTMENTS: Appointment[] = [
    {
        id: 'apt_001',
        patientId: 'p_child_001',
        providerId: 'doc1',
        branch: 'Makati Branch',
        date: new Date().toLocaleDateString('en-CA'), // Fixed: Use local date
        time: '09:00',
        durationMinutes: 60,
        type: AppointmentType.CONSULTATION,
        status: AppointmentStatus.SCHEDULED,
        notes: 'Regular checkup'
    },
    {
        id: 'apt_002',
        patientId: 'p_adult_002',
        providerId: 'doc1',
        branch: 'Makati Branch',
        date: new Date().toLocaleDateString('en-CA'), // Fixed: Use local date
        time: '10:00',
        durationMinutes: 60,
        type: AppointmentType.ROOT_CANAL,
        status: AppointmentStatus.CONFIRMED,
        notes: 'Start RCT tooth 26'
    },
    {
        id: 'apt_003',
        patientId: 'p_adult_003',
        providerId: 'doc2',
        branch: 'Quezon City Branch',
        date: new Date().toLocaleDateString('en-CA'), // Fixed: Use local date
        time: '14:00',
        durationMinutes: 45,
        type: AppointmentType.EXTRACTION,
        status: AppointmentStatus.SCHEDULED,
        notes: 'Simple extraction',
        labStatus: LabStatus.NONE
    }
];

// Initial defaults updated with prices and IDs
export const DEFAULT_FIELD_SETTINGS: FieldSettings = {
  suffixes: ['Mr', 'Ms', 'Mrs', 'Dr', 'Engr', 'Atty', 'Ph.D'],
  civilStatus: ['Single', 'Married', 'Widowed', 'Separated', 'Divorced'],
  insuranceProviders: ['Maxicare', 'Intellicare', 'PhilHealth', 'Medicard', 'Etiqa', 'Pacific Cross'],
  bloodGroups: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
  allergies: ['None', 'Aspirin', 'Penicillin', 'Sulfa', 'Local Anesthetic', 'Latex'],
  medicalConditions: [
    'None',
    'High BP', 
    'Low BP', 
    'Epilepsy',
    'Convulsions',
    'AIDS/HIV',
    'STD',
    'Ulcers',
    'Stomach Issues',
    'Fainting Seizures',
    'Rapid Weight Loss',
    'Radiation Therapy',
    'Joint Replacement',
    'Heart Surgery',
    'Heart Attack',
    'Thyroid Issues',
    'Heart Disease',
    'Heart Murmur',
    'Hepatitis',
    'Liver Disease',
    'Rheumatic Fever',
    'Hay Fever',
    'Respiratory Problems',
    'Jaundice',
    'Tuberculosis (TB)',
    'Swollen Ankles',
    'Kidney Issues',
    'Diabetes',
    'Chest Pain',
    'Stroke',
    'Cancer / Tumors',
    'Anemia',
    'Angina',
    'Asthma',
    'Emphysema',
    'Bleeding Issues',
    'Blood Disease',
    'Arthritis',
    'Rheumatism'
  ],
  procedures: [
      { id: 'p1', name: 'Consultation', price: 500 },
      { id: 'p2', name: 'Oral Prophylaxis', price: 1200 },
      { id: 'p3', name: 'Restoration', price: 1500 },
      { id: 'p4', name: 'Extraction', price: 1000 },
      { id: 'p5', name: 'Root Canal', price: 8000 },
      { id: 'p6', name: 'Prosthodontics', price: 15000 },
      { id: 'p7', name: 'Orthodontics', price: 50000 },
      { id: 'p8', name: 'Surgery', price: 5000 },
      { id: 'p9', name: 'Whitening', price: 20000 },
      { id: 'p10', name: 'Denture Adjustments', price: 500 }
  ], 
  branches: ['Makati Branch', 'Quezon City Branch', 'BGC Branch', 'Alabang Branch'],
  features: {
      enableLabTracking: true,
      enableComplianceAudit: true,
      enableDentalAssistantFlow: true,
      enableMultiBranch: true
  }
};
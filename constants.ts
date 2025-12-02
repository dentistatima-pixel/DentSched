
import { User, UserRole, Patient, Appointment, AppointmentType, AppointmentStatus } from './types';

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
      // Added fields to ensure profile is not empty
      specialization: 'Clinic Director',
      prcLicense: 'ADMIN-001', 
      ptrNumber: 'PTR-MAIN-001',
      tin: '123-111-222-000',
      defaultBranch: 'Main Office',
      colorPreference: '#ef4444', // Red for Admin
      clinicHours: 'Mon-Sat 8:00AM - 6:00PM'
  },
  { id: 'admin2', name: 'John Smith', role: UserRole.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
  
  // Dentists (Sample with detailed profiles)
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
      // New fields
      defaultBranch: 'Makati Branch',
      colorPreference: '#14b8a6', // Teal
      defaultConsultationFee: 500.00
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
      // New fields
      defaultBranch: 'Quezon City Branch',
      colorPreference: '#8b5cf6', // Violet
      defaultConsultationFee: 800.00
  },
  { id: 'doc3', name: 'Dr. Cassandra Filling', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cass', specialization: 'Pediatric Dentistry', prcLicense: '0112233', colorPreference: '#f43f5e', defaultBranch: 'Makati Branch' },
  { id: 'doc4', name: 'Dr. David Crown', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dave', specialization: 'Prosthodontics', prcLicense: '0445566', colorPreference: '#f59e0b', defaultBranch: 'Quezon City Branch' },
  { id: 'doc5', name: 'Dr. Elena Root', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', specialization: 'Endodontics', prcLicense: '0778899', colorPreference: '#10b981', defaultBranch: 'Makati Branch' },
  
  { id: 'doc6', name: 'Dr. Fiona Bridge', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fiona', colorPreference: '#6366f1' },
  { id: 'doc7', name: 'Dr. George Gum', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=George', colorPreference: '#ec4899' },
  { id: 'doc8', name: 'Dr. Hannah Enamel', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hannah', colorPreference: '#84cc16' },
  
  // Hygienists / Dental Assistants
  { 
      id: 'hyg1', 
      name: 'H. Sarah Sparkle', 
      role: UserRole.HYGIENIST, 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg1',
      employeeId: 'DA-2023-001',
      certifications: ['Tesda NCII Dental Hygiene', 'X-Ray Safety Officer'],
      assignedDoctors: ['doc1', 'doc2'], // Sarah works for Alex and Ben
      canViewFinancials: false,
      defaultBranch: 'Makati Branch',
      isReadOnly: false
  },
  { 
      id: 'hyg2', 
      name: 'H. Fred Floss', 
      role: UserRole.HYGIENIST, 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg2',
      employeeId: 'DA-2023-002',
      certifications: ['Basic Life Support', 'Infection Control'],
      assignedDoctors: ['doc3'], // Fred works for Cassandra
      canViewFinancials: false,
      defaultBranch: 'Makati Branch',
      isReadOnly: true // Fred is new, so he has read-only access
  },
  { id: 'hyg3', name: 'H. Mary Mint', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg3', assignedDoctors: ['doc4', 'doc5'], defaultBranch: 'Quezon City Branch' },
  { id: 'hyg4', name: 'H. Chris Clean', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg4' },
  { id: 'hyg5', name: 'H. Pat Polish', role: UserRole.HYGIENIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hyg5' },
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
        phone: '0917 123 4444',
        email: 'parent@email.com',
        insuranceProvider: 'Maxicare',
        insuranceNumber: 'MAX-998877',
        guardian: 'Maria Santos',
        guardianMobile: '0917 123 4444',
        homeAddress: '123 Acacia St, Makati City',
        barangay: 'San Lorenzo',
        lastVisit: '2023-11-20',
        nextVisit: null,
        notes: 'Very anxious child, likes Paw Patrol. Needs tell-show-do.',
        
        // Extensive Medical History (Child)
        goodHealth: false,
        allergies: ['Penicillin', 'Peanuts'],
        medicalConditions: ['Asthma'],
        underMedicalTreatment: true,
        medicalTreatmentDetails: 'Pediatrician monitoring asthma',
        seriousIllness: true,
        seriousIllnessDetails: 'Pneumonia (Hospitalized 2023)',
        lastHospitalization: '2023-10-01',
        lastHospitalizationDetails: 'Makati Med for Pneumonia',
        takingMedications: true,
        medicationDetails: 'Albuterol Inhaler (Ventolin)',
        
        dentalChart: [
            { toothNumber: 54, procedure: 'Extraction', status: 'Completed', date: '2023-11-20' }, // Deciduous
            { toothNumber: 55, procedure: 'Restoration', status: 'Planned' },
            { toothNumber: 65, procedure: 'Sealant', status: 'Planned' }
        ],
        treatments: ['Extraction'],
        treatmentDetails: { 'Extraction': 'Deciduous molar extraction due to abscess' }
    },
    {
        id: 'p_female_001',
        name: 'Maria Clara Reyes',
        firstName: 'Maria Clara',
        surname: 'Reyes',
        dob: '1995-02-14',
        age: 29,
        sex: 'Female',
        phone: '0918 555 6789',
        email: 'maria.clara@gmail.com',
        occupation: 'Call Center Agent',
        homeAddress: 'Unit 404 Condo, Mandaluyong',
        barangay: 'Highway Hills',
        lastVisit: '2024-01-10',
        nextVisit: '2024-07-10',
        notes: 'Currently pregnant, careful with x-rays and meds.',
        
        // Extensive Medical History (Female/Pregnant)
        goodHealth: false,
        pregnant: true,
        nursing: false,
        birthControl: false,
        allergies: ['Latex'],
        otherAllergies: 'Dust Mites',
        medicalConditions: ['Anemia', 'Low BP'],
        underMedicalTreatment: true,
        medicalTreatmentDetails: 'OB-GYN Checkups (Dr. Lim)',
        seriousIllness: false,
        takingMedications: true,
        medicationDetails: 'Prenatal Vitamins, Ferrous Sulfate, Folic Acid',
        lastHospitalization: '2023-12-05',
        lastHospitalizationDetails: 'Dehydration/Hyperemesis',
        
        dentalChart: [
             { toothNumber: 36, procedure: 'Root Canal', status: 'Existing' },
             { toothNumber: 36, procedure: 'Crown', status: 'Existing' },
             { toothNumber: 11, procedure: 'Veneer', status: 'Existing' },
             { toothNumber: 21, procedure: 'Veneer', status: 'Existing' },
             { toothNumber: 46, procedure: 'Restoration', status: 'Planned', notes: 'Wait until 2nd trimester' }
        ],
        treatments: ['Oral Prophylaxis'],
        treatmentDetails: { 'Oral Prophylaxis': 'Routine cleaning, bleeding gums noted' }
    },
    {
        id: 'p_male_001',
        name: 'Juan Dela Cruz',
        firstName: 'Juan',
        surname: 'Dela Cruz',
        dob: '1965-08-30',
        age: 58,
        sex: 'Male',
        phone: '0920 999 8888',
        email: 'juan.dc@yahoo.com',
        occupation: 'Retired',
        homeAddress: '456 Narra St, Quezon City',
        barangay: 'Diliman',
        lastVisit: '2023-09-15',
        nextVisit: null,
        notes: 'Patient gag reflex is strong. Pre-medication required for surgeries.',
        
        // Extensive Medical History (High Risk Male)
        goodHealth: false,
        tobaccoUse: true,
        alcoholDrugsUse: true,
        allergies: ['Aspirin', 'Sulfa'],
        otherAllergies: 'Shellfish',
        medicalConditions: ['High BP', 'Diabetes', 'Arthritis', 'Heart Disease'],
        otherConditions: 'High Cholesterol',
        underMedicalTreatment: true,
        medicalTreatmentDetails: 'Cardiologist (Dr. Santos) & Endocrinologist',
        seriousIllness: true,
        seriousIllnessDetails: 'Heart Attack (2021)',
        lastHospitalization: '2021-06-15',
        lastHospitalizationDetails: 'Angioplasty Stent Placement',
        takingMedications: true,
        medicationDetails: 'Metformin, Lisinopril, Atorvastatin, Clopidogrel',
        
        dentalChart: [
            { toothNumber: 18, procedure: 'Missing', status: 'Existing' },
            { toothNumber: 28, procedure: 'Missing', status: 'Existing' },
            { toothNumber: 38, procedure: 'Missing', status: 'Existing' },
            { toothNumber: 48, procedure: 'Missing', status: 'Existing' },
            { toothNumber: 46, procedure: 'Implant', status: 'Planned' },
            { toothNumber: 14, procedure: 'Root Canal', status: 'Completed', date: '2020-02-01' }
        ],
        treatments: ['Prosthodontics', 'Periodontics'],
        treatmentDetails: { 'Prosthodontics': 'Consulted for lower implants', 'Periodontics': 'Deep scaling Q3' }
    }
];

export const APPOINTMENTS: Appointment[] = [
    // Create some appointments for today for these dummy patients to populate the dashboard
    {
        id: 'apt_1',
        patientId: 'p_child_001',
        providerId: 'doc3', // Pediatric dentist
        date: new Date().toISOString().split('T')[0], // Today
        time: '10:00',
        durationMinutes: 60,
        type: AppointmentType.RESTORATION,
        status: AppointmentStatus.CONFIRMED,
        notes: 'Filling on tooth 55'
    },
    {
        id: 'apt_2',
        patientId: 'p_female_001',
        providerId: 'doc1', 
        date: new Date().toISOString().split('T')[0], // Today
        time: '13:00',
        durationMinutes: 30,
        type: AppointmentType.CONSULTATION,
        status: AppointmentStatus.SCHEDULED,
        notes: 'Check gum bleeding'
    },
    {
        id: 'apt_3',
        patientId: 'p_male_001',
        providerId: 'doc4', // Prostho
        date: new Date().toISOString().split('T')[0], // Today
        time: '15:00',
        durationMinutes: 90,
        type: AppointmentType.PROSTHODONTICS,
        status: AppointmentStatus.CONFIRMED,
        notes: 'Implant assessment'
    }
];

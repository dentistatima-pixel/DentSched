
import { User, UserRole, Patient, Appointment, AppointmentType, AppointmentStatus, LabStatus, FieldSettings } from './types';

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
  return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
};

export const STAFF: User[] = [
  { id: 'admin1', name: 'Sarah Connor', role: UserRole.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', specialization: 'Clinic Director', prcLicense: 'ADMIN-001', defaultBranch: 'Makati Branch', allowedBranches: ['Makati Branch', 'Quezon City Branch'], roster: { 'Mon': 'Makati Branch', 'Tue': 'Makati Branch', 'Wed': 'Makati Branch', 'Thu': 'Makati Branch', 'Fri': 'Makati Branch' } },
  { id: 'doc1', name: 'Dr. Alexander Crentist', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', specialization: 'General Dentistry', prcLicense: '0123456', defaultBranch: 'Makati Branch', allowedBranches: ['Makati Branch'], roster: { 'Mon': 'Makati Branch', 'Wed': 'Makati Branch', 'Fri': 'Makati Branch' } },
  { id: 'doc2', name: 'Dr. Benjamin Molar', role: UserRole.DENTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ben', specialization: 'Orthodontics', prcLicense: '0987654', defaultBranch: 'Quezon City Branch', allowedBranches: ['Quezon City Branch'], roster: { 'Tue': 'Quezon City Branch', 'Thu': 'Quezon City Branch' } }
];

export const PATIENTS: Patient[] = [
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
        lastVisit: getPastDateStr(2),
        nextVisit: getTomorrowStr(),
        chiefComplaint: 'Checkup on my bridges.',
        notes: 'Gag reflex.',
        currentBalance: 2500,
        dentalChart: [
             { toothNumber: 46, procedure: 'Restoration', status: 'Completed', surfaces: 'MO', price: 2500, payment: 0, date: getPastDateStr(2), author: 'Dr. Alex', notes: 'Deep caries.' },
             { toothNumber: 11, procedure: 'Crown', status: 'Completed', price: 12000, payment: 12000, date: getPastDateStr(35), author: 'Dr. Alex' }
        ],
        ledger: [
            { id: 'l1', date: getPastDateStr(2), description: 'Restoration 46', type: 'Charge', amount: 2500, balanceAfter: 2500 }
        ]
    },
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
        lastVisit: getPastDateStr(100),
        nextVisit: null,
        chiefComplaint: 'Bleeding gums.',
        notes: 'Stage III Periodontitis.',
        perioChart: [
            { toothNumber: 18, pocketDepths: [5,6,5, 6,7,6], recession: [1,1,1, 2,2,2], bleeding: [true,true,true,true,true,true], mobility: 1 }
        ]
    },
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
        lastVisit: getPastDateStr(25),
        nextVisit: getTodayStr(),
        chiefComplaint: 'Ortho adjustment.',
        // FIX: Added missing 'notes' property
        notes: '',
        currentBalance: -5000,
        ledger: [
            { id: 'l1', date: getPastDateStr(90), description: 'Payment', type: 'Payment', amount: 15000, balanceAfter: -15000 },
            { id: 'l2', date: getPastDateStr(90), description: 'Bonding Fee', type: 'Charge', amount: 10000, balanceAfter: -5000 }
        ]
    },
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
        lastVisit: getPastDateStr(5),
        nextVisit: getTodayStr(),
        medicalConditions: ['High BP', 'Diabetes'],
        allergies: ['Penicillin'],
        goodHealth: false,
        chiefComplaint: 'Impacted wisdom tooth.',
        notes: 'Needs medical clearance.'
    }
];

export const APPOINTMENTS: Appointment[] = [
    { id: 'a1', patientId: 'p_surg_04', providerId: 'doc1', branch: 'Makati Branch', date: getTodayStr(), time: '10:00', durationMinutes: 90, type: AppointmentType.SURGERY, status: AppointmentStatus.TREATING, notes: 'Wisdom tooth removal.' },
    { id: 'a2', patientId: 'p_credit_03', providerId: 'doc2', branch: 'Quezon City Branch', date: getTodayStr(), time: '09:00', durationMinutes: 30, type: AppointmentType.ORTHODONTICS, status: AppointmentStatus.COMPLETED },
    { id: 'a3', patientId: 'p_heavy_01', providerId: 'doc1', branch: 'Makati Branch', date: getTodayStr(), time: '15:30', durationMinutes: 60, type: AppointmentType.RESTORATION, status: AppointmentStatus.CONFIRMED }
];

export const DEFAULT_FIELD_SETTINGS: FieldSettings = {
  suffixes: ['Mr', 'Ms', 'Mrs', 'Dr', 'Jr', 'Sr'],
  civilStatus: ['Single', 'Married', 'Widowed'],
  insuranceProviders: ['Maxicare', 'Intellicare', 'PhilHealth'],
  bloodGroups: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
  allergies: ['None', 'Penicillin', 'Latex'],
  medicalConditions: ['None', 'High BP', 'Diabetes', 'Asthma'],
  procedures: [
      { id: 'p1', name: 'Consultation', price: 500, category: 'General' },
      { id: 'p2', name: 'Oral Prophylaxis', price: 1200, category: 'Preventive' },
      { id: 'p3', name: 'Restoration', price: 1500, category: 'Restorative' },
      { id: 'p4', name: 'Extraction', price: 1000, category: 'Surgery' },
      { id: 'p5', name: 'Orthodontics', price: 50000, category: 'Ortho' }
  ], 
  branches: ['Makati Branch', 'Quezon City Branch'],
  features: { enableLabTracking: true, enableComplianceAudit: true, enableDentalAssistantFlow: true, enableMultiBranch: true },
  smsTemplates: { bookingConfirmation: "Hi {PatientName}, appt confirmed: {Date} @ {Time}.", confirmationRequest: "Hi {PatientName}, confirm appt on {Date}?", reminder24h: "Reminder: Appt tomorrow {Date}.", postOpCheckup: "Checking in after your visit.", registrationWelcome: "Welcome to our clinic!" }
};

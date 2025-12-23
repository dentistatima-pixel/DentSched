import { User, UserRole, Patient, Appointment, AppointmentType, AppointmentStatus, LabStatus, FieldSettings, HMOClaim, StockItem, StockCategory, Expense, TreatmentPlanStatus, AuditLogEntry, SterilizationCycle, Vendor, SmsTemplates, ResourceType, ClinicResource, ClaimStatus, ClinicStatus } from './types';

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
      id: 'doc1', 
      name: 'Dr. Alexander Crentist', 
      role: UserRole.ADMIN, 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      specialization: 'General Dentistry',
      prcLicense: '0123456',
      prcExpiry: getFutureDateStr(45), // Trigger warning
      s2License: 'PDEA-S2-8888',
      s2Expiry: getFutureDateStr(200),
      defaultBranch: 'Your Clinic',
      allowedBranches: ['Your Clinic'], 
      colorPreference: '#14b8a6', 
      defaultConsultationFee: 500.00,
      roster: { 'Mon': 'Your Clinic', 'Wed': 'Your Clinic', 'Fri': 'Your Clinic', 'Tue': 'Your Clinic' },
      preferences: {
          showFinancials: true,
          showTraySetup: false,
          showPatientFlow: true,
          showLabAlerts: true
      }
  },
  { 
      id: 'asst1', 
      name: 'Pam Beesly', 
      role: UserRole.DENTAL_ASSISTANT, 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pam',
      specialization: 'Dental Assistant',
      defaultBranch: 'Your Clinic',
      allowedBranches: ['Your Clinic'],
      roster: { 'Mon': 'Your Clinic', 'Tue': 'Your Clinic', 'Wed': 'Your Clinic', 'Thu': 'Your Clinic', 'Fri': 'Your Clinic' }
  },
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
        nextVisit: getTodayStr(),
        chiefComplaint: 'Checkup on my bridges.',
        notes: 'Very talkative. Loves jokes. Gag reflex.',
        medicationDetails: 'Warfarin, Lipitor',
        currentBalance: 5000,
        reliabilityScore: 90,
        originatingBranch: 'Your Clinic',
        associatedBranches: ['Your Clinic'],
        dpaConsent: true,
        treatmentPlans: [
            { id: 'tp1', patientId: 'p_heavy_01', name: 'Standard Care', createdAt: getTodayStr(), createdBy: 'Dr. Alexander Crentist', status: TreatmentPlanStatus.APPROVED },
        ],
        dentalChart: [
             { id: 'dc_heavy_01', toothNumber: 46, procedure: 'Restoration', status: 'Completed', surfaces: 'MO', price: 2500, payment: 0, date: getPastDateStr(2), author: 'Dr. Alex', notes: 'Deep caries.' },
        ],
        ledger: [
            { id: 'l1', date: getPastDateStr(2), description: 'Restoration 46', type: 'Charge', amount: 5000, balanceAfter: 5000 },
        ],
    }
];

export const APPOINTMENTS: Appointment[] = [
    {
        id: 'a1',
        patientId: 'p_heavy_01',
        providerId: 'doc1',
        branch: 'Your Clinic',
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
    clinicMetadata: {
        'Your Clinic': {
            registryName: 'Your Dental Clinic Main',
            licenseNumber: 'LCN-12345-2024',
            dohPermit: 'DOH-NCR-9988',
            responsibleDentistId: 'doc1',
            certificationStatus: 'Verified',
            establishmentDate: '2010-01-01',
            status: ClinicStatus.ACTIVE
        }
    },
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
    ],
    branches: ['Your Clinic'],
    features: {
        enableLabTracking: false,
        enableComplianceAudit: true,
        enableMultiBranch: false,
        enableCentralAdmin: false,
        enableDentalAssistantFlow: true,
        enableHMOClaims: false,
        enableInventory: true,
        enableAnalytics: false,
        enablePatientPortal: false,
        enableDigitalConsent: true,
        enableAutomatedRecall: false,
        enableOnlineForms: false,
        enableEPrescription: false,
        enableAdvancedPermissions: false,
        enablePhilHealthClaims: false,
        enableLabPortal: false,
        enableDocumentManagement: true,
        enableClinicalProtocolAlerts: true,
        enableTreatmentPlanApprovals: false, 
        enableAccountabilityLog: true,
        enableReferralTracking: true,
        enablePromotions: false,
        enableSmsAutomation: false
    },
    smsTemplates: {
        'booking': { id: 'booking', label: 'Booking Confirmation', text: 'Hi {PatientName}, your appt is confirmed for {Date} at {Time} with {Doctor}.', enabled: true, category: 'Safety', triggerDescription: 'Sent when booking created' }
    },
    resources: [
        { id: 'res1', name: 'Dental Chair 1', type: ResourceType.CHAIR, branch: 'Your Clinic' },
        { id: 'res2', name: 'Dental Chair 2', type: ResourceType.CHAIR, branch: 'Your Clinic' }
    ],
    currentPrivacyVersion: '1.0-2024'
};

export const MOCK_AUDIT_LOG: AuditLogEntry[] = [];
export const MOCK_STOCK: StockItem[] = [];
export const MOCK_CLAIMS: HMOClaim[] = [];
export const MOCK_EXPENSES: Expense[] = [];
export const MOCK_STERILIZATION_CYCLES: SterilizationCycle[] = [];
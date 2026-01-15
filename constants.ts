
import { User, UserRole, Patient, Appointment, AppointmentType, AppointmentStatus, LabStatus, FieldSettings, HMOClaim, HMOClaimStatus, StockItem, StockCategory, Expense, TreatmentPlanStatus, AuditLogEntry, SterilizationCycle, Vendor, SmsTemplates, ResourceType, ClinicResource, InstrumentSet, MaintenanceAsset, OperationalHours, SmsConfig, AuthorityLevel, PatientFile, ClearanceRequest, VerificationMethod } from './types';

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
export const CRITICAL_CLEARANCE_CONDITIONS = ['High BP', 'Heart Disease', 'Diabetes', 'Bleeding Issues', 'High Blood Pressure'];

export const PDA_INFORMED_CONSENT_TEXTS = {
    GENERAL_AUTHORIZATION: "I understand that dentistry is not an exact science and that no dentist can properly guarantee accurate results all the time. I hereby authorize any of the doctors/dental auxiliaries to proceed with & perform the dental restorations & treatments as explained to me. I understand that these are subject to modification depending on undiagnosable circumstances that may arise during the course of treatment. I understand that regardless of any dental insurance coverage I may have, I am responsible for payment of dental fees, I agree to pay any attorney's fees, collection fee, or court costs that may be incurred to satisfy any obligation to this office. All treatment were properly explained to me & any untoward circumstances that may arise during the procedure, the attending dentist will not be held liable since it is my free will, with full trust & confidence in him/her, to undergo dental treatment under his/her care.",
    TREATMENT_DONE: "I understand and consent to have any treatment done by the dentist after the procedure, the risks & benefits & cost have been fully explained. These treatments include, but are not limited to, x-rays, cleanings, periodontal treatments, fillings, crowns, bridges, all types of extraction, root canals, &/or dentures, local anesthetics & surgical cases.",
    DRUGS_MEDICATIONS: "I understand that antibiotics, analgesics & other medications can cause allergic reactions like redness & swelling of tissues, pain, itching, vomiting, &/or anaphylactic shock.",
    TREATMENT_CHANGES: "I understand that during treatment it may be necessary to change/ add procedures because of conditions found while working on the teeth that was not discovered during examination. For example, root canal therapy may be needed following routine restorative procedures. I give my permission to the dentist to make any/all changes and additions as necessary w/ my responsibility to pay all the costs agreed.",
    RADIOGRAPH: "I understand that an x-ray shot or a radiograph maybe necessary as part of diagnostic aid to come up with tentative diagnosis of my dental problem and to make a good treatment plan, but, this will not give me a 100% assurance for the accuracy of the treatment since all dental treatments are subject to unpredictable complications that later on may lead to sudden change of treatment plan and subject to new charges.",
    EXTRACTION: "I understand that alternatives to tooth removal (root canal therapy, crowns & periodontal surgery, etc.) & I completely understand these alternatives, including their risk & benefits prior to authorizing the dentist to remove teeth & any other structures necessary for reasons above. I understand that removing teeth does not always remove all the infections, if present, & it may be necessary to have further treatment. I understand the risk involved in having teeth removed, such as pain, swelling, spread of infection, dry socket, fractured jaw, loss of feeling on the teeth, lips, tongue & surrounding tissue that can last for an indefinite period of time. I understand that I may need further treatment under a specialist if complications arise during or following treatment.",
    CROWNS_BRIDGES: "Preparing a tooth may irritate the nerve tissue in the center of the tooth, leaving the tooth extra sensitive to heat, cold & pressure. Treating such irritation may involve using special toothpastes, mouth rinses or root canal therapy. I understand that sometimes it is not possible to match the color of natural teeth exactly with artificial teeth. I further understand that I may be wearing temporary crowns, which may come off easily & that I must be careful to ensure that they are kept on until the permanent crowns are delivered. It is my responsibility to return for permanent cementation within 20 days from tooth preparation, as excessive days delay may allow for tooth movement, which may necessitate a remake of the crown, bridge/ cap. I understand there will be additional charges for remakes due to my delaying of permanent cementation, & I realize that final opportunity to make changes in my new crown, bridges or cap (including shape, fit, size, & color) will be before permanent cementation.",
    ROOT_CANAL: "I understand there is no guarantee that a root canal treatment will save a tooth & that complications can occur from the treatment & that occasionally root canal filling materials may extend through the tooth which does not necessarily effect the success of the treatment. I understand that endodontic files & drills are very fine instruments & stresses vented in their manufacture & calcifications present in teeth can cause them to break during use. I understand that referral to the endodontist for additional treatments may be necessary following any root canal treatment & I agree that I am responsible for any additional cost for treatment performed by the endodontist. I understand that a tooth may require removal in spite of all efforts to save it.",
    PERIODONTAL: "I understand that periodontal disease is a serious condition causing gum & bone inflammation &/or loss & that can lead eventually to the loss of my teeth. I understand the alternative treatment plans to correct periodontal disease, including gum surgery tooth extractions with or without replacement. I understand that undertaking any dental procedures may have future adverse effect on my periodontal Conditions.",
    FILLINGS: "I understand that care must be exercised in chewing on fillings, especially during the first 24 hours to avoid breakage. I understand that a more extensive filling or a crown may be required, as additional decay or fracture may become evident after initial excavation. I understand that significant sensitivity is a common, but usually temporary, after-effect of a newly placed filling. I further understand that filling a tooth may irritate the nerve tissue creating sensitivity & treating such sensitivity could require root canal therapy or extractions.",
    DENTURES: "I understand that wearing of dentures can be difficult. Sore spots, altered speech & difficulty in eating are common problems. Immediate dentures (placement of denture immediately after extractions) may be painful. Immediate dentures may require considerable adjusting & several relines. I understand that it is my responsibility to return for delivery of dentures. I understand that failure to keep my delivery appointment may result in poorly fitted dentures. If a remake is required due to my delays of more than 30 days, there will be additional charges. A permanent reline will be needed later, which is not included in the initial fee. I understand that all adjustment or alterations of any kind after this initial period is subject to charges."
};

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
        id: 'p_heavy_01', name: 'Michael Scott', firstName: 'Michael', surname: 'Scott', insuranceProvider: 'Maxicare', dob: '1965-03-15', age: 59, sex: 'Male', phone: '0917-111-2222', email: 'm.scott@dunder.com', occupation: 'Regional Manager', lastVisit: getPastDateStr(2), nextVisit: getFutureDateStr(1), chiefComplaint: 'Checkup on my bridges.', notes: 'Very talkative. Loves jokes. Gag reflex.', currentBalance: 5000, recallStatus: 'Booked',
        attendanceStats: { totalBooked: 10, completedCount: 9, noShowCount: 1, lateCancelCount: 0 }, reliabilityScore: 90,
        treatmentPlans: [{ id: 'tp1', patientId: 'p_heavy_01', name: 'Phase 1 - Urgent Care', createdAt: getTodayStr(), createdBy: 'Dr. Alexander Crentist', status: TreatmentPlanStatus.PENDING_REVIEW, reviewNotes: 'Please check #16 for fracture lines before proceeding.' }],
        ledger: [ {id: 'l1', date: getPastDateStr(30), description: 'Zirconia Crown', type: 'Charge', amount: 20000, balanceAfter: 20000}, {id: 'l2', date: getPastDateStr(29), description: 'GCash Payment', type: 'Payment', amount: 15000, balanceAfter: 5000} ],
        dentalChart: [ { id: 'dc1', toothNumber: 16, procedure: 'Zirconia Crown', status: 'Completed', date: getPastDateStr(30), price: 20000, planId: 'tp1' } ]
    },
    {
        id: 'p_reliable_01', name: 'Eleanor Shellstrop', firstName: 'Eleanor', surname: 'Shellstrop', dob: '1988-10-25', age: 35, sex: 'Female', phone: '0917-123-4567', email: 'e.shell@thegood.place', lastVisit: getPastDateStr(180), nextVisit: null, currentBalance: 0, recallStatus: 'Due',
        attendanceStats: { totalBooked: 5, completedCount: 5, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100
    },
    {
        id: 'p_risk_02',
        name: 'Chidi Anagonye PhD',
        firstName: 'Chidi',
        surname: 'Anagonye',
        middleName: 'Eleazar',
        suffix: 'PhD',
        dob: '1982-04-12',
        age: 42,
        sex: 'Male',
        civilStatus: 'Married',
        bloodGroup: 'O+',
        bloodPressure: '140/90',
        phone: '0918-234-5678',
        email: 'c.anagonye@thegood.place',
        homeAddress: '123 Philosophy Lane, The Good Place',
        city: 'Quezon City',
        barangay: 'Diliman',
        occupation: 'Ethics Professor',
        insuranceProvider: 'Intellicare',
        insuranceNumber: 'INTL-987654321',
        lastVisit: getPastDateStr(90),
        nextVisit: null,
        chiefComplaint: 'Debilitating anxiety about dental procedures.',
        notes: 'Patient exhibits extreme indecisiveness and requires constant reassurance. Prone to stomach aches.',
        currentBalance: 0,
        recallStatus: 'Contacted',
        attendanceStats: { totalBooked: 8, completedCount: 8, noShowCount: 0, lateCancelCount: 0 },
        reliabilityScore: 100,
        isPwd: true,
        guardianProfile: {
            legalName: 'Simone Garnett',
            relationship: 'Spouse',
            mobile: '0917-999-8888',
            authorityLevel: AuthorityLevel.FULL,
            occupation: 'Neuroscientist'
        },
        allergies: [
            'None', 'Local Anesthetic (ex. Lidocaine)', 'Penicillin', 'Antibiotics', 
            'Sulfa drugs', 'Aspirin', 'Latex'
        ],
        otherAllergies: 'Analysis Paralysis',
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
        otherConditions: 'Perpetual Stomach Ache',
        goodHealth: false,
        underMedicalTreatment: true,
        medicalTreatmentDetails: 'Currently undergoing treatment for anxiety and hypertension.',
        seriousIllness: true,
        seriousIllnessDetails: 'Coronary artery bypass graft (CABG) in 2018.',
        lastHospitalizationDetails: 'For the aforementioned heart surgery.',
        lastHospitalizationDate: '2018-05-20',
        takingMedications: true,
        medicationDetails: 'Lisinopril, Metformin, Warfarin.',
        takingBloodThinners: true,
        takingBisphosphonates: true,
        tobaccoUse: true,
        alcoholDrugsUse: true,
        pregnant: false,
        nursing: false,
        birthControl: false,
        previousDentist: 'Dr. Michael Realman',
        physicianName: 'Dr. Eleanor Shellstrop',
        physicianSpecialty: 'Cardiologist',
        physicianAddress: '456 Afterlife Ave, The Good Place',
        physicianNumber: '02-8-123-4567',
        lastDigitalUpdate: new Date().toISOString(),
        dpaConsent: true,
        marketingConsent: true,
        practiceCommConsent: true,
        clinicalMediaConsent: true,
        thirdPartyDisclosureConsent: true,
        thirdPartyAttestation: true,
        philHealthPIN: '01-123456789-0',
        philHealthCategory: 'Direct Contributor',
        philHealthMemberStatus: 'Active',
        registrationSignature: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMzAiPjxwYXRoIGQ9Ik0xMCAxNSBDIDI1IDAgMzUgMzAgNTUgMTUgNzAgMCA4NSAzMCA5NSAxNSIgc3Ryb2tlPSIjMDAwIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
        registrationSignatureTimestamp: new Date().toISOString(),
        files: [
            {
                id: 'file_pwd_1',
                name: 'PWD Certificate 2024.pdf',
                category: 'PWD Certificate',
                url: '#',
                date: getPastDateStr(30) // valid
            }
        ],
        clearanceRequests: [
            {
                id: 'cr_chidi_1',
                patientId: 'p_risk_02',
                doctorName: 'Dr. Eleanor Shellstrop',
                specialty: 'Cardiologist',
                requestedAt: getPastDateStr(200),
                status: 'Approved',
                approvedAt: getPastDateStr(190), // Expired (more than 3 months ago)
                remarks: 'Cleared for routine dental procedures.',
                verificationMethod: VerificationMethod.DIGITAL_UPLOAD,
                verifiedByPractitionerId: 'doc1',
                verifiedByPractitionerName: 'Dr. Alexander Crentist',
            },
            {
                id: 'cr_chidi_2',
                patientId: 'p_risk_02',
                doctorName: 'Dr. Eleanor Shellstrop',
                specialty: 'Cardiologist',
                requestedAt: getPastDateStr(30),
                status: 'Approved',
                approvedAt: getPastDateStr(25), // Valid (within 3 months)
                remarks: 'Cleared for non-invasive procedures. Re-evaluate for surgery.',
                verificationMethod: VerificationMethod.PHYSICAL_FILE_VERIFIED,
                verifiedByPractitionerId: 'doc1',
                verifiedByPractitionerName: 'Dr. Alexander Crentist',
            }
        ],
    },
    {
        id: 'p_credit_03', name: 'Maria Clara', firstName: 'Maria', surname: 'Clara', dob: '1995-06-19', age: 29, sex: 'Female', phone: '0920-345-6789', email: 'm.clara@noli.me', lastVisit: getPastDateStr(45), nextVisit: null, currentBalance: 2500, recallStatus: 'Due',
        attendanceStats: { totalBooked: 3, completedCount: 3, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100
    },
    {
        id: 'p_surg_04', name: 'Juan Dela Cruz', firstName: 'Juan', surname: 'Dela Cruz', dob: '1990-01-01', age: 34, sex: 'Male', phone: '0921-456-7890', email: 'juan.dc@example.com', lastVisit: getPastDateStr(7), nextVisit: null, currentBalance: 0, recallStatus: 'Due',
        attendanceStats: { totalBooked: 6, completedCount: 6, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        dentalChart: [ { id: 'dc_surg1', toothNumber: 38, procedure: 'Surgical Extraction (Impacted/Wisdom Tooth)', status: 'Planned', date: getPastDateStr(7), price: 7500 } ]
    },
    {
        id: 'p_pediatric_05', name: 'Tahani Al-Jamil', firstName: 'Tahani', surname: 'Al-Jamil', dob: '2014-09-01', age: 9, sex: 'Female', phone: '0922-567-8901', email: 'tahani.aj@thegood.place', lastVisit: getPastDateStr(120), nextVisit: null, currentBalance: 0, recallStatus: 'Due',
        guardianProfile: { legalName: 'Kamilah Al-Jamil', relationship: 'Mother', mobile: '0922-555-8888', authorityLevel: AuthorityLevel.FULL },
        attendanceStats: { totalBooked: 4, completedCount: 4, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100
    },
    {
        id: 'p_plan_06', name: 'Janet Della-Denunzio', firstName: 'Janet', surname: 'Della-Denunzio', dob: '1992-12-08', age: 31, sex: 'Female', phone: '0923-678-9012', email: 'janet@thegood.place', lastVisit: getPastDateStr(30), nextVisit: getFutureDateStr(30), currentBalance: 0, recallStatus: 'Booked',
        treatmentPlans: [{ id: 'tp_janet', patientId: 'p_plan_06', name: 'Restorative Phase', createdAt: getPastDateStr(30), createdBy: 'Dr. Maria Clara', status: TreatmentPlanStatus.APPROVED }],
        dentalChart: [ { id: 'dc_janet1', toothNumber: 14, procedure: 'Composite Restoration (2 Surfaces)', status: 'Planned', date: getPastDateStr(30), price: 2000, planId: 'tp_janet' }, { id: 'dc_janet2', toothNumber: 25, procedure: 'Composite Restoration (1 Surface)', status: 'Planned', date: getPastDateStr(30), price: 1500, planId: 'tp_janet' } ],
        attendanceStats: { totalBooked: 7, completedCount: 7, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100
    },
    {
        id: 'p_unreliable_08', name: 'Jason Mendoza', firstName: 'Jason', surname: 'Mendoza', dob: '1993-07-22', age: 30, sex: 'Male', phone: '0925-890-1234', email: 'j.mendoza@thegood.place', lastVisit: getPastDateStr(200), nextVisit: null, currentBalance: 800, recallStatus: 'Overdue', referredById: 'p_referrer_07',
        attendanceStats: { totalBooked: 10, completedCount: 4, noShowCount: 5, lateCancelCount: 1 }, reliabilityScore: 40
    },
    {
        id: 'p_referrer_07', name: 'Shawn Magtanggol', firstName: 'Shawn', surname: 'Magtanggol', dob: '1970-05-15', age: 54, sex: 'Male', phone: '0924-789-0123', email: 'shawn@thebad.place', lastVisit: getPastDateStr(5), nextVisit: null, currentBalance: 0, recallStatus: 'Due',
        attendanceStats: { totalBooked: 15, completedCount: 15, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100
    },
    {
        id: 'p_debt_09', name: 'Ronnie Runner', firstName: 'Ronnie', surname: 'Runner', dob: '1985-11-30', age: 38, sex: 'Male', phone: '0931-111-9999', email: 'r.runner@example.com', lastVisit: getPastDateStr(300), nextVisit: null, currentBalance: 15500, recallStatus: 'Overdue',
        attendanceStats: { totalBooked: 9, completedCount: 7, noShowCount: 1, lateCancelCount: 1 }, reliabilityScore: 68
    },
    {
        id: 'p_archive_10', name: 'Mindy St. Claire', firstName: 'Mindy', surname: 'St. Claire', dob: '1975-02-18', age: 49, sex: 'Female', phone: '0932-222-8888', email: 'mindy@themedium.place', lastVisit: '2010-01-15', nextVisit: null, currentBalance: 0, recallStatus: 'Overdue',
        attendanceStats: { totalBooked: 2, completedCount: 2, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100
    },
    {
        id: 'p_hmo_11', name: 'Derek Hofstetler', firstName: 'Derek', surname: 'Hofstetler', dob: '1998-08-08', age: 25, sex: 'Male', phone: '0933-333-7777', email: 'derek@thegood.place', lastVisit: getPastDateStr(60), nextVisit: null, currentBalance: 0, recallStatus: 'Due',
        insuranceProvider: 'Intellicare', philHealthPIN: '12-345678901-2', philHealthCategory: 'Direct Contributor',
        attendanceStats: { totalBooked: 3, completedCount: 3, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100
    },
    {
        id: 'p_new_clean_12', name: 'Pillboi', firstName: 'Pillboi', surname: '', dob: '1999-03-03', age: 25, sex: 'Male', phone: '0945-444-6666', email: 'pillboi@thegood.place', lastVisit: 'First Visit', nextVisit: null, currentBalance: 0, recallStatus: 'Due',
    },
    {
        id: 'p_full_perio_02', name: 'Sofia Reyes', firstName: 'Sofia', surname: 'Reyes', dob: '1991-04-10', age: 33, sex: 'Female', phone: '0919-987-6543', email: 'sofia.r@example.com', lastVisit: getPastDateStr(10), nextVisit: null, currentBalance: 0, recallStatus: 'Due',
        attendanceStats: { totalBooked: 8, completedCount: 8, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        perioChart: [
            { toothNumber: 18, date: getPastDateStr(180), pocketDepths: [3,2,3,3,2,3], recession: [1,1,1,1,1,1], bleeding: [false,true,false,false,true,false], mobility: 0 },
            { toothNumber: 17, date: getPastDateStr(180), pocketDepths: [4,3,4,3,3,4], recession: [1,1,1,1,1,1], bleeding: [true,true,true,true,true,true], mobility: 1 },
            { toothNumber: 18, date: getPastDateStr(10), pocketDepths: [2,2,2,2,2,2], recession: [1,1,1,1,1,1], bleeding: [false,false,false,false,false,false], mobility: 0 },
            { toothNumber: 17, date: getPastDateStr(10), pocketDepths: [3,2,3,2,2,3], recession: [1,1,1,1,1,1], bleeding: [false,true,false,false,false,false], mobility: 0 },
        ]
    }
];

export const APPOINTMENTS: Appointment[] = [
    // Today's appointments for various test cases
    { id: 'apt_today_01', patientId: 'p_heavy_01', providerId: 'doc1', resourceId: 'res_chair_01', branch: 'Makati Main', date: getTodayStr(), time: '09:00', durationMinutes: 60, type: 'Initial Consultation & Examination', status: AppointmentStatus.SCHEDULED },
    { id: 'apt_today_02', patientId: 'p_risk_02', providerId: 'doc1', resourceId: 'res_chair_02', branch: 'Makati Main', date: getTodayStr(), time: '10:00', durationMinutes: 60, type: 'Oral Prophylaxis (Heavy w/ Stain Removal)', status: AppointmentStatus.ARRIVED },
    { id: 'apt_today_03', patientId: 'p_reliable_01', providerId: 'doc2', branch: 'Quezon City Satellite', date: getTodayStr(), time: '11:00', durationMinutes: 30, type: 'Consultation', status: AppointmentStatus.CONFIRMED },
    { id: 'apt_today_04', patientId: 'p_pediatric_05', providerId: 'doc2', branch: 'Quezon City Satellite', date: getTodayStr(), time: '14:00', durationMinutes: 45, type: 'Topical Fluoride Application', status: AppointmentStatus.SEATED },
    { id: 'apt_today_05', patientId: 'p_surg_04', providerId: 'doc1', resourceId: 'res_chair_02', branch: 'Makati Main', date: getTodayStr(), time: '15:00', durationMinutes: 90, type: 'Surgical Extraction (Wisdom Tooth/Impacted)', status: AppointmentStatus.TREATING },

    // Past appointments
    { id: 'apt_past_01', patientId: 'p_heavy_01', providerId: 'doc1', branch: 'Makati Main', date: getPastDateStr(2), time: '10:00', durationMinutes: 60, type: 'Zirconia Crown (High Translucency)', status: AppointmentStatus.COMPLETED },
    { id: 'apt_past_02', patientId: 'p_unreliable_08', providerId: 'doc2', branch: 'Quezon City Satellite', date: getPastDateStr(30), time: '13:00', durationMinutes: 60, type: 'Composite Restoration (1 Surface)', status: AppointmentStatus.NO_SHOW },

    // Future appointments
    { id: 'apt_future_01', patientId: 'p_plan_06', providerId: 'doc2', branch: 'Quezon City Satellite', date: getFutureDateStr(7), time: '10:00', durationMinutes: 60, type: 'Composite Restoration (2 Surfaces)', status: AppointmentStatus.SCHEDULED },
    { id: 'apt_future_02', patientId: 'p_hmo_11', providerId: 'doc1', branch: 'Makati Main', date: getFutureDateStr(14), time: '16:00', durationMinutes: 60, type: 'Oral Prophylaxis (Light/Routine Cleaning)', status: AppointmentStatus.SCHEDULED },
    
    // Block time
    { id: 'apt_block_01', patientId: 'ADMIN_BLOCK', providerId: 'doc1', branch: 'Makati Main', date: getTodayStr(), time: '12:00', durationMinutes: 60, type: 'Clinical Block', isBlock: true, title: 'Staff Lunch', status: AppointmentStatus.SCHEDULED }
];

export const MOCK_CLAIMS: HMOClaim[] = [
    { id: 'claim_1', patientId: 'p_heavy_01', ledgerEntryId: 'l1', hmoProvider: 'Maxicare', procedureName: 'Composite Restoration (1 Surface)', amountClaimed: 1500, status: HMOClaimStatus.SUBMITTED, dateSubmitted: getPastDateStr(1) },
    { id: 'claim_2', patientId: 'p_hmo_11', ledgerEntryId: 'l_hmo_1', hmoProvider: 'Intellicare', procedureName: 'Oral Prophylaxis (Light/Routine)', amountClaimed: 1200, status: HMOClaimStatus.PENDING }
];

export const MOCK_STOCK: StockItem[] = [
    { id: 'stk_1', name: 'Anesthetic Carpules', category: StockCategory.CONSUMABLES, quantity: 50, lowStockThreshold: 20, expiryDate: getFutureDateStr(60), branch: 'Makati Main' },
    { id: 'stk_2', name: 'Composite Resin (A2)', category: StockCategory.RESTORATIVE, quantity: 15, lowStockThreshold: 10, expiryDate: getFutureDateStr(180), branch: 'Makati Main' },
    { id: 'stk_3', name: 'Examination Gloves (Box)', category: StockCategory.CONSUMABLES, quantity: 5, lowStockThreshold: 2, branch: 'Quezon City Satellite' }
];

export const MOCK_RESOURCES: ClinicResource[] = [
    { id: 'res_chair_01', name: 'Operatory Chair A', type: ResourceType.CHAIR, branch: 'Makati Main', colorCode: '#14b8a6' },
    { id: 'res_chair_02', name: 'Operatory Chair B (Surg)', type: ResourceType.CHAIR, branch: 'Makati Main', colorCode: '#c026d3' },
    { id: 'res_xray_01', name: 'Imaging Suite 1', type: ResourceType.XRAY, branch: 'Makati Main', colorCode: '#3b82f6' },
    { id: 'res_qc_chair_1', name: 'QC Chair 1', type: ResourceType.CHAIR, branch: 'Quezon City Satellite', colorCode: '#14b8a6' },
];

export const MOCK_ASSETS: MaintenanceAsset[] = [
    { id: 'ast_1', name: 'Autoclave unit 01', brand: 'W&H', serialNumber: 'WH-88912-A', lastService: getPastDateStr(45), frequencyMonths: 6, status: 'Ready', branch: 'Makati Main' },
    { id: 'ast_2', name: 'Intraoral Scanner', brand: 'iTero', serialNumber: 'IT-552-XP', lastService: getPastDateStr(180), frequencyMonths: 12, status: 'Service Due', branch: 'Makati Main' }
];

export const MOCK_INSTRUMENT_SETS: InstrumentSet[] = [
    { id: 'set_alpha_1', name: 'Surgery Set Alpha', status: 'Sterile', branch: 'Makati Main' },
    { id: 'set_prophy_1', name: 'Prophy Set A', status: 'Used', branch: 'Makati Main' },
    { id: 'set_qc_basic_1', name: 'QC Basic Kit 1', status: 'Contaminated', branch: 'Quezon City Satellite' }
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
    // I. Diagnostic & Preventive Care
    { id: 'proc_01', name: 'Initial Consultation & Examination', price: 800, category: 'Diagnostic & Preventive Care', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_02', name: 'Digital Periapical X-Ray (per shot)', price: 500, category: 'Diagnostic & Preventive Care', requiresXray: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_03', name: 'Panoramic X-Ray (OPG)', price: 1500, category: 'Diagnostic & Preventive Care', requiresXray: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_04', name: 'Cephalometric X-Ray', price: 1500, category: 'Diagnostic & Preventive Care', requiresXray: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_05', name: 'Oral Prophylaxis (Light/Routine Cleaning)', price: 1200, category: 'Diagnostic & Preventive Care', allowedLicenseCategories: ['DENTIST', 'HYGIENIST'] },
    { id: 'proc_06', name: 'Oral Prophylaxis (Heavy w/ Stain Removal)', price: 1800, category: 'Diagnostic & Preventive Care', allowedLicenseCategories: ['DENTIST', 'HYGIENIST'] },
    { id: 'proc_07', name: 'Topical Fluoride Application', price: 1000, category: 'Diagnostic & Preventive Care', allowedLicenseCategories: ['DENTIST', 'HYGIENIST'] },
    { id: 'proc_08', name: 'Pit and Fissure Sealant (per tooth)', price: 1000, category: 'Diagnostic & Preventive Care', allowedLicenseCategories: ['DENTIST'] },

    // II. Restorative Dentistry (Fillings)
    { id: 'proc_09', name: 'Composite Restoration (1 Surface)', price: 1500, category: 'Restorative Dentistry', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_10', name: 'Composite Restoration (2 Surfaces)', price: 2000, category: 'Restorative Dentistry', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_11', name: 'Composite Restoration (3+ Surfaces/Build-up)', price: 3000, category: 'Restorative Dentistry', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_12', name: 'Temporary Filling (IRM/GIC)', price: 800, category: 'Restorative Dentistry', allowedLicenseCategories: ['DENTIST'] },
    
    // III. Endodontics (Root Canal Treatment)
    { id: 'proc_13', name: 'Root Canal Treatment (Anterior Tooth)', price: 8000, category: 'Endodontics', requiresXray: true, requiresConsent: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_14', name: 'Root Canal Treatment (Premolar)', price: 10000, category: 'Endodontics', requiresXray: true, requiresConsent: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_15', name: 'Root Canal Treatment (Molar)', price: 15000, category: 'Endodontics', requiresXray: true, requiresConsent: true, allowedLicenseCategories: ['DENTIST'] },

    // IV. Periodontics (Gum Treatment)
    { id: 'proc_16', name: 'Deep Scaling & Root Planing (per quadrant)', price: 2500, category: 'Periodontics', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_17', name: 'Gingivectomy (per quadrant)', price: 6000, category: 'Periodontics', requiresConsent: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_18', name: 'Frenectomy (Lingual or Labial)', price: 7000, category: 'Periodontics', requiresConsent: true, requiresWitness: true, allowedLicenseCategories: ['DENTIST'] },
    
    // V. Prosthodontics (Crowns, Bridges, Dentures)
    { id: 'proc_19', name: 'PFM (Porcelain Fused to Metal) Crown', price: 12000, category: 'Prosthodontics', requiresXray: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_20', name: 'IPS E.max (All-Porcelain) Crown', price: 18000, category: 'Prosthodontics', requiresXray: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_21', name: 'Zirconia Crown (High Translucency)', price: 20000, category: 'Prosthodontics', requiresXray: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_22', name: 'Porcelain Veneer', price: 18000, category: 'Prosthodontics', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_23', name: 'Fixed Bridge (per unit)', price: 12000, category: 'Prosthodontics', requiresXray: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_24', name: 'Full Denture (Acrylic, per arch)', price: 15000, category: 'Prosthodontics', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_25', name: 'Partial Denture (Flexible, Valplast)', price: 18000, category: 'Prosthodontics', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_26', name: 'Denture Repair / Relining', price: 3500, category: 'Prosthodontics', allowedLicenseCategories: ['DENTIST'] },
    
    // VI. Oral Surgery (Extractions)
    { id: 'proc_27', name: 'Simple Extraction (Erupted Tooth)', price: 1500, category: 'Oral Surgery', requiresConsent: true, requiresWitness: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_28', name: 'Complicated Extraction (Requires sectioning)', price: 3500, category: 'Oral Surgery', requiresXray: true, requiresConsent: true, requiresWitness: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_29', name: 'Surgical Extraction (Wisdom Tooth/Impacted)', price: 10000, category: 'Oral Surgery', requiresXray: true, requiresConsent: true, requiresWitness: true, allowedLicenseCategories: ['DENTIST'] },
    
    // VII. Orthodontics
    { id: 'proc_30', name: 'Comprehensive Orthodontic Treatment (Braces Package)', price: 60000, category: 'Orthodontics', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_31', name: 'Monthly Orthodontic Adjustment', price: 1000, category: 'Orthodontics', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_32', name: 'Hawley/Essix Retainers (per arch)', price: 5000, category: 'Orthodontics', allowedLicenseCategories: ['DENTIST'] },
    
    // VIII. Cosmetic / Aesthetic Dentistry
    { id: 'proc_33', name: 'In-Office Teeth Whitening', price: 15000, category: 'Cosmetic Dentistry', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_34', name: 'Take-Home Whitening Kit', price: 8000, category: 'Cosmetic Dentistry', allowedLicenseCategories: ['DENTIST'] }
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
  kioskSettings: {
    welcomeMessage: 'Welcome to Ivory Dental. Please use this terminal to manage your patient record securely.',
    privacyNotice: 'Your data is protected under RA 10173. All entries are logged for security.'
  },
  instrumentSets: MOCK_INSTRUMENT_SETS,
  stockItems: MOCK_STOCK
};

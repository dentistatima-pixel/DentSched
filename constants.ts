
import { User, UserRole, Patient, Appointment, AppointmentStatus, LabStatus, FieldSettings, HMOClaim, HMOClaimStatus, StockItem, StockCategory, Expense, TreatmentPlanStatus, AuditLogEntry, SterilizationCycle, Vendor, SmsTemplates, ResourceType, ClinicResource, InstrumentSet, MaintenanceAsset, OperationalHours, SmsConfig, AuthorityLevel, PatientFile, ClearanceRequest, VerificationMethod, ProcedureItem, LicenseCategory, WaitlistEntry, FamilyGroup, CommunicationChannel, Branch, CommunicationTemplate, ConsentFormTemplate, RecallStatus, RegistrationStatus, SmsTemplateConfig } from './types';
import { Calendar, CheckCircle, UserCheck, Armchair, Activity, CheckCircle2 as CompletedIcon, XCircle, UserX, Droplet } from 'lucide-react';
import type { ElementType } from 'react';
import CryptoJS from 'crypto-js';

// Generators for mock data
export const generateUid = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

// --- DATE UTILITY ---
const getTodayStr = () => new Date().toLocaleDateString('en-CA');
const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-CA');
}
const getPastDateStr = (days: number, date = new Date()) => {
    const d = new Date(date);
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

export const calculateAge = (dob: string | null | undefined): number | undefined => {
    if (!dob) return undefined;
    try {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    } catch {
        return undefined;
    }
};

export const isExpired = (dateStr?: string | null): boolean => {
    if (!dateStr) return false;
    // Set to end of day to be inclusive of the expiry date
    const expiryDate = new Date(dateStr);
    expiryDate.setHours(23, 59, 59, 999);
    return expiryDate < new Date();
};

export const isWithin30Days = (dateStr?: string | null): boolean => {
    if (!dateStr) return false;
    const expiryDate = new Date(dateStr);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return expiryDate > today && expiryDate <= thirtyDaysFromNow;
};

export const APPOINTMENT_STATUS_WORKFLOW: AppointmentStatus[] = [
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.ARRIVED,
    AppointmentStatus.SEATED,
    AppointmentStatus.TREATING,
    AppointmentStatus.COMPLETED,
];

// CRITICAL FIX #9: Added VALID_TRANSITIONS to enforce workflow logic.
export const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.SCHEDULED]: [AppointmentStatus.CONFIRMED, AppointmentStatus.ARRIVED, AppointmentStatus.CANCELLED],
  [AppointmentStatus.CONFIRMED]: [AppointmentStatus.ARRIVED, AppointmentStatus.CANCELLED],
  [AppointmentStatus.ARRIVED]: [AppointmentStatus.SEATED, AppointmentStatus.NO_SHOW, AppointmentStatus.CANCELLED],
  [AppointmentStatus.SEATED]: [AppointmentStatus.TREATING, AppointmentStatus.ARRIVED], // Can go back
  [AppointmentStatus.TREATING]: [AppointmentStatus.COMPLETED, AppointmentStatus.SEATED], // Can go back
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [AppointmentStatus.SCHEDULED], // Can reschedule a cancelled appt
  [AppointmentStatus.NO_SHOW]: [AppointmentStatus.SCHEDULED] // Can reschedule a no-show
};


interface AppointmentStatusConfig {
    label: string;
    icon: ElementType;
    badgeClass: string;
}

const APPOINTMENT_STATUS_CONFIG: Record<AppointmentStatus, AppointmentStatusConfig> = {
    [AppointmentStatus.SCHEDULED]: {
        label: 'Scheduled',
        icon: Calendar,
        badgeClass: 'bg-slate-100 text-slate-700',
    },
    [AppointmentStatus.CONFIRMED]: {
        label: 'Confirmed',
        icon: CheckCircle,
        badgeClass: 'bg-blue-100 text-blue-700',
    },
    [AppointmentStatus.ARRIVED]: {
        label: 'Arrived',
        icon: UserCheck,
        badgeClass: 'bg-orange-100 text-orange-700',
    },
    [AppointmentStatus.SEATED]: {
        label: 'Seated',
        icon: Armchair,
        badgeClass: 'bg-lilac-100 text-lilac-700',
    },
    [AppointmentStatus.TREATING]: {
        label: 'Treating',
        icon: Activity,
        badgeClass: 'bg-lilac-200 text-lilac-800',
    },
    [AppointmentStatus.COMPLETED]: {
        label: 'Completed',
        icon: CompletedIcon,
        badgeClass: 'bg-teal-100 text-teal-700',
    },
    [AppointmentStatus.CANCELLED]: {
        label: 'Cancelled',
        icon: XCircle,
        badgeClass: 'bg-red-100 text-red-700',
    },
    [AppointmentStatus.NO_SHOW]: {
        label: 'No Show',
        icon: UserX,
        badgeClass: 'bg-red-200 text-red-800',
    },
};

export const getAppointmentStatusConfig = (status: AppointmentStatus): AppointmentStatusConfig => {
    return APPOINTMENT_STATUS_CONFIG[status];
};

export const PDA_FORBIDDEN_COMMERCIAL_TERMS = ['cheap', 'discount', 'best', 'sale', 'promo', 'off', 'free', 'bargain', 'limited time'];
export const CRITICAL_CLEARANCE_CONDITIONS = ['High BP', 'Heart Disease', 'Diabetes', 'Bleeding Issues', 'High Blood Pressure', 'Taking Blood Thinners? (Aspirin, Warfarin, etc.)'];

// For reference. Do NOT use these in the app.
export const STAFF_PINS = new Map([
    ['doc1', '1234'],
    ['doc2', '1111'],
    ['assist1', '2222'],
    ['admin1', '9999'],
    ['arch1', '0000']
]);

// FIX: Define and export STAFF mock data with hashed PINs
export const STAFF: User[] = [
    { id: 'doc1', name: 'Dr. Alexander Crentist', role: UserRole.LEAD_DENTIST, pin: CryptoJS.SHA256(STAFF_PINS.get('doc1')!).toString(), defaultBranch: 'Makati Main', allowedBranches: ['Makati Main', 'Quezon City Satellite'], colorPreference: '#1abc9c', prcLicense: '1234567', malpracticeExpiry: getFutureDateStr(365), prcExpiry: getFutureDateStr(180), licenseCategory: 'DENTIST', status: 'Active' },
    { id: 'doc2', name: 'Dr. Maria Santos', role: UserRole.DENTIST, pin: CryptoJS.SHA256(STAFF_PINS.get('doc2')!).toString(), defaultBranch: 'Makati Main', allowedBranches: ['Makati Main'], colorPreference: '#3498db', prcLicense: '2345678', prcExpiry: getFutureDateStr(200), licenseCategory: 'DENTIST', status: 'Active' },
    { id: 'assist1', name: 'John Doe', role: UserRole.DENTAL_ASSISTANT, pin: CryptoJS.SHA256(STAFF_PINS.get('assist1')!).toString(), defaultBranch: 'Makati Main', allowedBranches: ['Makati Main'], colorPreference: '#9b59b6', licenseCategory: 'HYGIENIST', status: 'Active' },
    { id: 'admin1', name: 'Sarah Connor', role: UserRole.ADMIN, pin: CryptoJS.SHA256(STAFF_PINS.get('admin1')!).toString(), defaultBranch: 'Makati Main', allowedBranches: ['Makati Main', 'Quezon City Satellite'], colorPreference: '#e74c3c', status: 'Active' },
    { id: 'arch1', name: 'Dr. Adam Architect', role: UserRole.SYSTEM_ARCHITECT, pin: CryptoJS.SHA256(STAFF_PINS.get('arch1')!).toString(), defaultBranch: 'Makati Main', allowedBranches: ['Makati Main', 'Quezon City Satellite'], colorPreference: '#f1c40f', status: 'Active' }
];

// FIX: Define and export PATIENTS mock data
export const PATIENTS: Patient[] = [
    { id: 'p_heavy_01', name: 'Michael Scott', firstName: 'Michael', surname: 'Scott', dob: '1965-08-15', phone: '09171234567', email: 'michael@dundermifflin.com', lastVisit: getPastDateStr(30), nextVisit: getTodayStr(), currentBalance: 5000, recallStatus: RecallStatus.DUE, registrationStatus: RegistrationStatus.COMPLETE, allergies: ['Penicillin'], medicalConditions: ['High BP'] },
    { id: 'p_reliable_01', name: 'Eleanor Shellstrop', firstName: 'Eleanor', surname: 'Shellstrop', dob: '1982-10-25', phone: '09209876543', email: 'eleanor@thegoodplace.com', lastVisit: getPastDateStr(180), nextVisit: null, currentBalance: 0, recallStatus: RecallStatus.OVERDUE, registrationStatus: RegistrationStatus.COMPLETE, reliabilityScore: 95 },
    { id: 'p_credit_03', name: 'Maria Clara', firstName: 'Maria', surname: 'Clara', dob: '1995-03-10', phone: '09181112222', email: 'mclara@historical.ph', lastVisit: 'First Visit', nextVisit: getTomorrowStr(), currentBalance: 0, recallStatus: RecallStatus.BOOKED, registrationStatus: RegistrationStatus.PROVISIONAL },
];

// FIX: Define and export APPOINTMENTS mock data
export const APPOINTMENTS: Appointment[] = [
    { id: 'apt_today_01', patientId: 'p_heavy_01', providerId: 'doc1', branch: 'Makati Main', date: getTodayStr(), time: '10:00', durationMinutes: 60, type: 'Zirconia Crown', status: AppointmentStatus.SCHEDULED },
    { id: 'apt_today_02', patientId: 'p_credit_03', providerId: 'doc2', branch: 'Makati Main', date: getTodayStr(), time: '11:00', durationMinutes: 30, type: 'Consultation', status: AppointmentStatus.ARRIVED },
    { id: 'apt_tomorrow_01', patientId: 'p_credit_03', providerId: 'doc2', branch: 'Makati Main', date: getTomorrowStr(), time: '14:00', durationMinutes: 45, type: 'Oral Prophylaxis', status: AppointmentStatus.CONFIRMED },
];

export const MOCK_AUDIT_LOG: AuditLogEntry[] = [
    { id: 'al_1', timestamp: getPastDateStr(1), userId: 'doc1', userName: 'Dr. Alexander Crentist', action: 'LOGIN', entity: 'System', entityId: 'doc1', details: 'User logged in successfully.' },
    { id: 'al_2', timestamp: getTodayStr(), userId: 'admin1', userName: 'Sarah Connor', action: 'CREATE', entity: 'Appointment', entityId: 'apt_today_01', details: 'Created new appointment for Michael Scott.' }
];

export const MOCK_STOCK: StockItem[] = [
    { id: 'item_01', name: 'Anesthetic Cartridge', category: StockCategory.CONSUMABLES, quantity: 200, lowStockThreshold: 50, branch: 'Makati Main' },
    { id: 'item_02', name: 'Composite Resin A2', category: StockCategory.RESTORATIVE, quantity: 20, lowStockThreshold: 5, branch: 'Makati Main' },
    { id: 'item_03', name: 'Examination Set', category: StockCategory.INSTRUMENTS, quantity: 15, lowStockThreshold: 5, branch: 'Makati Main' },
];

export const MOCK_STERILIZATION_CYCLES_INITIALIZED: SterilizationCycle[] = [
    { id: 'cycle_01', date: getPastDateStr(1), autoclaveName: 'Autoclave A', cycleNumber: 'C-2024-001', operator: 'John Doe', passed: true }
];

export const MOCK_CLAIMS: HMOClaim[] = [
    { id: 'claim_01', patientId: 'p_heavy_01', ledgerEntryId: 'l1', hmoProvider: 'Maxicare', procedureName: 'Zirconia Crown', amountClaimed: 20000, status: HMOClaimStatus.SUBMITTED, dateSubmitted: getPastDateStr(25) },
];

export const MOCK_EXPENSES: Expense[] = [
    { id: 'exp_01', date: getPastDateStr(5), category: 'Office Supplies', description: 'Bond paper and pens', amount: 1500, branch: 'Makati Main' },
];

export const MOCK_WAITLIST: WaitlistEntry[] = [
    { id: 'wl_1', patientId: 'p_reliable_01', patientName: 'Eleanor Shellstrop', procedure: 'Oral Prophylaxis', durationMinutes: 45, priority: 'Normal' },
    { id: 'wl_2', patientId: 'p_credit_03', patientName: 'Maria Clara', procedure: 'Consultation', durationMinutes: 30, priority: 'Low' },
];

export const PROCEDURE_TO_CONSENT_MAP: Record<string, string> = {
    'extraction': 'EXTRACTION',
    'root canal': 'ROOT_CANAL',
    'crown': 'CROWNS_BRIDGES',
    'bridge': 'CROWNS_BRIDGES',
    'cap': 'CROWNS_BRIDGES',
    'periodontal': 'PERIODONTAL',
    'filling': 'FILLINGS',
    'restoration': 'FILLINGS',
    'denture': 'DENTURES',
    'x-ray': 'RADIOGRAPH',
    'radiograph': 'RADIOGRAPH'
};

export const DEFAULT_CONSENT_FORM_TEMPLATES: ConsentFormTemplate[] = [
    { id: 'GENERAL_AUTHORIZATION', name: 'General Authorization', content_en: "I understand that dentistry is not an exact science and that no dentist can properly guarantee accurate results all the time. I hereby authorize any of the doctors/dental auxiliaries to proceed with & perform the dental restorations & treatments as explained to me. I understand that these are subject to modification depending on undiagnosable circumstances that may arise during the course of treatment. I understand that regardless of any dental insurance coverage I may have, I am responsible for payment of dental fees, I agree to pay any attorney's fees, collection fee, or court costs that may be incurred to satisfy any obligation to this office. All treatment were properly explained to me & any untoward circumstances that may arise during the procedure, the attending dentist will not be held liable since it is my free will, with full trust & confidence in him/her, to undergo dental treatment under his/her care.", content_tl: "[Pagsasalin sa Tagalog]: Nauunawaan ko na ang pagdedentista ay hindi isang eksaktong agham at walang dentista ang makakapaggarantiya ng tumpak na mga resulta sa lahat ng oras. Pinahihintulutan ko ang sinuman sa mga doktor/dental auxiliaries na magpatuloy at isagawa ang mga dental restoration at paggamot na ipinaliwanag sa akin. Nauunawaan ko na ang mga ito ay maaaring baguhin depende sa mga hindi inaasahang pangyayari na maaaring lumitaw sa panahon ng paggamot. Nauunawaan ko na, anuman ang aking dental insurance, ako ang may pananagutan sa pagbabayad ng mga bayarin sa ngipin, at sumasang-ayon akong bayaran ang anumang mga bayarin sa abogado, bayarin sa koleksyon, o gastos sa korte na maaaring magastos upang matugunan ang anumang obligasyon sa opisina na ito. Ang lahat ng paggamot ay ipinaliwanag nang maayos sa akin at anumang hindi inaasahang pangyayari na maaaring lumitaw sa panahon ng pamamaraan, ang dumadating na dentista ay hindi mananagot dahil ito ay aking malayang kalooban, na may buong tiwala at kumpiyansa sa kanya, na sumailalim sa paggamot sa ngipin sa ilalim ng kanyang pangangalaga." },
    { id: 'TREATMENT_DONE', name: 'Treatment To Be Done', content_en: "I understand and consent to have any treatment done by the dentist after the procedure, the risks & benefits & cost have been fully explained. These treatments include, but are not limited to, x-rays, cleanings, periodontal treatments, fillings, crowns, bridges, all types of extraction, root canals, &/or dentures, local anesthetics & surgical cases.", content_tl: "[Pagsasalin sa Tagalog]: Nauunawaan at pumapayag ako na isagawa ang anumang paggamot ng dentista pagkatapos ng pamamaraan, ang mga panganib at benepisyo at gastos ay ganap na naipaliwanag. Kasama sa mga paggamot na ito, ngunit hindi limitado sa, x-ray, paglilinis, paggamot sa periodontal, pasta, korona, tulay, lahat ng uri ng pagbunot, root canal, at/o pustiso, lokal na anestisya at mga kaso ng operasyon." },
    { id: 'DRUGS_MEDICATIONS', name: 'Drugs & Medications', content_en: "I understand that antibiotics, analgesics & other medications can cause allergic reactions like redness & swelling of tissues, pain, itching, vomiting, &/or anaphylactic shock.", content_tl: "[Pagsasalin sa Tagalog]: Nauunawaan ko na ang mga antibiotic, analgesic at iba pang mga gamot ay maaaring magdulot ng mga reaksiyong alerhiya tulad ng pamumula at pamamaga ng mga tisyu, sakit, pangangati, pagsusuka, at/o anaphylactic shock." },
    { id: 'TREATMENT_CHANGES', name: 'Changes in Treatment Plan', content_en: "I understand that during treatment it may be necessary to change/ add procedures because of conditions found while working on the teeth that was not discovered during examination. For example, root canal therapy may be needed following routine restorative procedures. I give my permission to the dentist to make any/all changes and additions as necessary w/ my responsibility to pay all the costs agreed.", content_tl: "[Pagsasalin sa Tagalog]: Nauunawaan ko na sa panahon ng paggamot maaaring kailanganing baguhin/magdagdag ng mga pamamaraan dahil sa mga kondisyon na natagpuan habang ginagawa ang mga ngipin na hindi natuklasan sa panahon ng pagsusuri. Halimbawa, maaaring kailanganin ang root canal therapy kasunod ng mga karaniwang pamamaraan ng pagpapanumbalik. Ibinibigay ko ang aking pahintulot sa dentista na gumawa ng anuman/lahat ng mga pagbabago at karagdagan kung kinakailangan kasama ang aking responsibilidad na bayaran ang lahat ng napagkasunduang gastos." },
    { id: 'RADIOGRAPH', name: 'Radiograph', content_en: "I understand that an x-ray shot or a radiograph maybe necessary as part of diagnostic aid to come up with tentative diagnosis of my dental problem and to make a good treatment plan, but, this will not give me a 100% assurance for the accuracy of the treatment since all dental treatments are subject to unpredictable complications that later on may lead to sudden change of treatment plan and subject to new charges.", content_tl: "[Pagsasalin sa Tagalog]: Nauunawaan ko na ang isang x-ray shot o radiograph ay maaaring kailanganin bilang bahagi ng tulong sa pag-diagnose upang makabuo ng pansamihang diagnosis ng aking problema sa ngipin at gumawa ng isang mahusay na plano sa paggamot, ngunit, hindi ito magbibigay sa akin ng 100% kasiguruhan para sa katumpakan ng paggamot dahil ang lahat ng paggamot sa ngipin ay napapailalim sa hindi mahuhulaan na mga komplikasyon na sa kalaunan ay maaaring humantong sa biglaang pagbabago ng plano sa paggamot at napapailalim sa mga bagong singil." },
    { id: 'EXTRACTION', name: 'Removal of Teeth', content_en: "I understand that alternatives to tooth removal (root canal therapy, crowns & periodontal surgery, etc.) & I completely understand these alternatives, including their risk & benefits prior to authorizing the dentist to remove teeth & any other structures necessary for reasons above. I understand that removing teeth does not always remove all the infections, if present, & it may be necessary to have further treatment. I understand the risk involved in having teeth removed, such as pain, swelling, spread of infection, dry socket, fractured jaw, loss of feeling on the teeth, lips, tongue & surrounding tissue that can last for an indefinite period of time. I understand that I may need further treatment under a specialist if complications arise during or following treatment.", content_tl: "[Pagsasalin sa Tagalog]: Nauunawaan ko ang mga alternatibo sa pagbunot ng ngipin (root canal therapy, korona at periodontal surgery, atbp.) at lubos kong nauunawaan ang mga alternatibong ito, kabilang ang kanilang mga panganib at benepisyo bago pahintulutan ang dentista na bunutin ang mga ngipin at anumang iba pang mga istraktura na kinakailangan para sa mga dahilan sa itaas. Nauunawaan ko na ang pagbunot ng mga ngipin ay hindi palaging nag-aalis ng lahat ng impeksyon, kung mayroon, at maaaring kailanganin na magkaroon ng karagdagang paggamot. Nauunawaan ko ang mga panganib na kasangkot sa pagbunot ng ngipin, tulad ng sakit, pamamaga, pagkalat ng impeksyon, dry socket, bali ng panga, pagkawala ng pakiramdam sa ngipin, labi, dila at nakapaligid na tisyu na maaaring tumagal nang walang katiyakan. Nauunawaan ko na maaaring kailanganin ko ng karagdagang paggamot sa ilalim ng isang espesyalista kung magkakaroon ng mga komplikasyon sa panahon o pagkatapos ng paggamot." },
    { id: 'CROWNS_BRIDGES', name: 'Crowns, Caps & Bridges', content_en: "Preparing a tooth may irritate the nerve tissue in the center of the tooth, leaving the tooth extra sensitive to heat, cold & pressure. Treating such irritation may involve using special toothpastes, mouth rinses or root canal therapy. I understand that sometimes it is not possible to match the color of natural teeth exactly with artificial teeth. I further understand that I may be wearing temporary crowns, which may come off easily & that I must be careful to ensure that they are kept on until the permanent crowns are delivered. It is my responsibility to return for permanent cementation within 20 days from tooth preparation, as excessive days delay may allow for tooth movement, which may necessitate a remake of the crown, bridge/ cap. I understand there will be additional charges for remakes due to my delaying of permanent cementation, & I realize that final opportunity to make changes in my new crown, bridges or cap (including shape, fit, size, & color) will be before permanent cementation.", content_tl: "[Pagsasalin sa Tagalog]: Ang paghahanda ng ngipin ay maaaring makairita sa tisyu ng nerbiyos sa gitna ng ngipin, na nag-iiwan sa ngipin na sobrang sensitibo sa init, lamig at presyon. Ang paggamot sa naturang pangangati ay maaaring kasangkot sa paggamit ng mga espesyal na toothpaste, mouth rinses o root canal therapy. Nauunawaan ko na kung minsan ay hindi posible na eksaktong tumugma sa kulay ng mga natural na ngipin sa mga artipisiyal na ngipin. Higit pa rito, nauunawaan ko na maaaring ako ay nagsusuot ng mga pansamihang korona, na maaaring madaling matanggal at dapat akong mag-ingat upang matiyak na mananatili ang mga ito hanggang sa maihatid ang mga permanenteng korona. Responsibilidad kong bumalik para sa permanenteng sementasyon sa loob ng 20 araw mula sa paghahanda ng ngipin, dahil ang labis na araw ng pagkaantala ay maaaring magbigay-daan para sa paggalaw ng ngipin, na maaaring mangailangan ng muling paggawa ng korona, tulay/ takip. Nauunawaan ko na magkakaroon ng mga karagdagang singil para sa muling paggawa dahil sa aking pagkaantala ng permanenteng sementasyon, at napagtanto ko na ang huling pagkakataon na gumawa ng mga pagbabago sa aking bagong korona, tulay o takip (kabilang ang hugis, sukat, laki, at kulay) ay bago ang permanenteng sementasyon." },
    { id: 'ROOT_CANAL', name: 'Endodontics (Root Canal)', content_en: "I understand there is no guarantee that a root canal treatment will save a tooth & that complications can occur from the treatment & that occasionally root canal filling materials may extend through the tooth which does not necessarily effect the success of the treatment. I understand that endodontic files & drills are very fine instruments & stresses vented in their manufacture & calcifications present in teeth can cause them to break during use. I understand that referral to the endodontist for additional treatments may be necessary following any root canal treatment & I agree that I am responsible for any additional cost for treatment performed by the endodontist. I understand that a tooth may require removal in spite of all efforts to save it.", content_tl: "[Pagsasalin sa Tagalog]: Nauunawaan ko na walang garantiya na ang isang root canal treatment ay makakapagligtas sa isang ngipin at maaaring magkaroon ng mga komplikasyon mula sa paggamot at na paminsan-minsan ang mga materyales sa pagpuno ng root canal ay maaaring lumampas sa ngipin na hindi kinakailangang makaapekto sa tagumpay ng paggamot. Nauunawaan ko na ang mga endodontic file at drill ay napakapinong mga instrumento at ang mga stress na ibinubuga sa kanilang paggawa at mga calcification na naroroon sa mga ngipin ay maaaring maging sanhi ng pagkasira nito sa panahon ng paggamit. Nauunawaan ko na ang referral sa endodontist para sa mga karagdagang paggamot ay maaaring kailanganin kasunod ng anumang root canal treatment at sumasang-ayon ako na ako ang may pananagutan para sa anumang karagdagang gastos para sa paggamot na ginawa ng endodontist. Nauunawaan ko na ang isang ngipin ay maaaring kailanganing tanggalin sa kabila ng lahat ng pagsisikap na iligtas ito." },
    { id: 'PERIODONTAL', name: 'Periodontal Disease', content_en: "I understand that periodontal disease is a serious condition causing gum & bone inflammation &/or loss & that can lead eventually to the loss of my teeth. I understand the alternative treatment plans to correct periodontal disease, including gum surgery tooth extractions with or without replacement. I understand that undertaking any dental procedures may have future adverse effect on my periodontal Conditions.", content_tl: "[Pagsasalin sa Tagalog]: Nauunawaan ko na ang periodontal disease ay isang seryesong kondisyon na nagdudulot ng pamamaga at/o pagkawala ng gilagid at buto at maaaring humantong sa pagkawala ng aking mga ngipin. Nauunawaan ko ang mga alternatibong plano sa paggamot upang itama ang periodontal disease, kabilang ang operasyon sa gilagid, pagbunot ng ngipin na mayroon o walang kapalit. Nauunawaan ko na ang pagsasagawa ng anumang mga pamamaraan sa ngipin ay maaaring magkaroon ng masamang epekto sa hinaharap sa aking mga kondisyon sa periodontal." },
    { id: 'FILLINGS', name: 'Fillings', content_en: "I understand that care must be exercised in chewing on fillings, especially during the first 24 hours to avoid breakage. I understand that a more extensive filling or a crown may be required, as additional decay or fracture may become evident after initial excavation. I understand that significant sensitivity is a common, but usually temporary, after-effect of a newly placed filling. I further understand that filling a tooth may irritate the nerve tissue creating sensitivity & treating such sensitivity could require root canal therapy or extractions.", content_tl: "[Pagsasalin sa Tagalog]: Nauunawaan ko na dapat mag-ingat sa pagnguya sa mga pasta, lalo na sa unang 24 na oras upang maiwasan ang pagkasira. Nauunawaan ko na maaaring kailanganin ang isang mas malawak na pasta o korona, dahil maaaring maging malinaw ang karagdagang pagkabulok o bali pagkatapos ng paunang paghuhukay. Nauunawaan ko na ang makabuluhang pagiging sensitibo ay isang karaniwan, ngunit kadalasang pansamantala, na epekto pagkatapos ng isang bagong inilagay na pasta. Higit pa rito, nauunawaan ko na ang pagpasta sa isang ngipin ay maaaring makairita sa tisyu ng nerbiyos na lumilikha ng pagiging sensitibo at ang paggamot sa naturang pagiging sensitibo ay maaaring mangailangan ng root canal therapy o pagbunot." },
    { id: 'DENTURES', name: 'Dentures', content_en: "I understand that wearing of dentures can be difficult. Sore spots, altered speech & difficulty in eating are common problems. Immediate dentures (placement of denture immediately after extractions) may be painful. Immediate dentures may require considerable adjusting & several relines. I understand that it is my responsibility to return for delivery of dentures. I understand that failure to keep my delivery appointment may result in poorly fitted dentures. If a remake is required due to my delays of more than 30 days, there will be additional charges. A permanent reline will be needed later, which is not included in the initial fee. I understand that all adjustment or alterations of any kind after this initial period is subject to charges.", content_tl: "[Pagsasalin sa Tagalog]: Nauunawaan ko na ang pagsusuot ng pustiso ay maaaring mahirap. Ang mga masakit na bahagi, nabagong pagsasalita at kahirapan sa pagkain ay mga karaniwang problema. Ang mga agarang pustiso (paglalagay ng pustiso kaagad pagkatapos ng pagbunot) ay maaaring masakit. Ang mga agarang pustiso ay maaaring mangailangan ng malaking pagsasaayos at ilang reline. Nauunawaan ko na responsibilidad kong bumalik para sa paghahatid ng pustiso. Nauunawaan ko na ang hindi pagtupad sa aking appointment sa paghahatid ay maaaring magresulta sa hindi magandang pagkakalagay ng pustiso. Kung kinakailangan ang muling paggawa dahil sa aking mga pagkaantala ng higit sa 30 araw, magkakaroon ng mga karagdagang singil. Kakailanganin ang isang permanenteng reline sa kalaunan, na hindi kasama sa paunang bayad. Nauunawaan ko na ang lahat ng pagsasaayos o pagbabago ng anumang uri pagkatapos ng paunang panahon na ito ay napapailalim sa mga singil." },
    { id: 'MEDIA_CONSENT', name: 'Clinical Media Consent', content_en: `I, the undersigned, hereby authorize the dental professionals at this clinic to capture, use, and store clinical photographs, radiographs (x-rays), and videos ("Media") related to my dental treatment.

1.  **Purpose**: I understand this Media is essential for diagnosis, treatment planning, documentation of my care, and for communication with other healthcare providers or dental laboratories as necessary.
2.  **Confidentiality**: I understand this Media is part of my confidential patient record and is protected under the Data Privacy Act of 2012 (R.A. 10173).
3.  **Educational Use (Optional)**: I may separately consent to the anonymized use of my Media for professional education, scientific publications, or case presentations. All my personal identifying information will be removed.
4.  **Patient Rights**: I have the right to inspect my Media. I also have the right to withdraw this consent for future use by providing a written request, though this will not affect Media already captured.

My signature below confirms that I have read, understood, and agree to these terms.`, content_tl: `[Pagsasalin sa Tagalog]: Ako, ang nakalagda, ay nagbibigay pahintulot sa mga propesyonal na dentista sa klinika na ito na kumuha, gumamit, at mag-imbak ng mga klinikal na litrato, radiograph (x-ray), at video ("Media") na may kaugnayan sa aking paggamot sa ngipin.

1.  **Layunin**: Nauunawaan ko na ang Media na ito ay mahalaga para sa diagnosis, pagpaplano ng paggamot, dokumentasyon ng aking pangangalaga, at para sa komunikasyon sa iba pang mga healthcare provider o dental laboratory kung kinakailangan.
2.  **Pagiging Kumpidensyal**: Nauunawaan ko na ang Media na ito ay bahagi ng aking kumpidensyal na talaan ng pasyente at protektado sa ilalim ng Data Privacy Act of 2012 (R.A. 10173).
3.  **Paggamit para sa Edukasyon (Opsyonal)**: Maaari akong magbigay ng hiwalay na pahintulot para sa hindi pagpapakilalang paggamit ng aking Media para sa propesyonal na edukasyon, mga siyentipikong publikasyon, o mga paglalahad ng kaso. Ang lahat ng aking personal na impormasyon sa pagkakakilanlan ay aalisin.
4.  **Mga Karapatan ng Pasyente**: May karapatan akong suriin ang aking Media. May karapatan din akong bawiin ang pahintulot na ito para sa paggamit sa hinaharap sa pamamagitan ng pagsusulat ng isang pormal na kahilingan, bagaman hindi nito maaapektuhan ang Media na nakuha na.

Ang aking lagda sa ibaba ay nagpapatunay na nabasa ko, naunawaan, at sumasang-ayon ako sa mga tuntuning ito.` },
    { id: 'FINANCIAL_AGREEMENT', name: 'Financial Agreement', content_en: `I acknowledge that I have been provided with an estimate of the costs for my proposed treatment plan. I understand and agree to the following:

1.  **Estimate vs. Actual Cost**: The provided quote is an estimate. Unforeseen clinical findings during treatment may require changes to the plan and associated costs. I will be informed of any significant changes.
2.  **Financial Responsibility**: I am fully responsible for the total payment of all procedures performed. I agree to pay for services at the time they are rendered unless other arrangements have been made in advance.
3.  **Insurance**: My dental insurance is a contract between me and my insurance provider. I understand that I am responsible for any remaining balance not covered by my insurance. This clinic will assist in processing claims, but ultimate responsibility for payment rests with me.
4.  **Patient Rights**: I have the right to ask for a detailed breakdown of costs and to discuss payment options with the clinic staff.
5.  **Withdrawal**: I understand that withdrawing from treatment after it has commenced does not absolve me of financial responsibility for services already rendered.`, content_tl: `[Pagsasalin sa Tagalog]: Kinikilala ko na nabigyan ako ng pagtatantya ng mga gastos para sa aking iminungkahing plano sa paggamot. Nauunawaan at sumasang-ayon ako sa mga sumusunod:

1.  **Tantya vs. Aktwal na Gastos**: Ang ibinigay na quote ay isang pagtatantya. Ang mga hindi inaasahang klinikal na natuklasan sa panahon ng paggamot ay maaaring mangailangan ng mga pagbabago sa plano at mga kaugnay na gastos. Ipapabatid sa akin ang anumang makabuluhang pagbabago.
2.  **Responsibilidad sa Pinansyal**: Ako ang may buong pananagutan para sa kabuuang bayad ng lahat ng mga pamamaraang isinagawa. Sumasang-ayon akong magbayad para sa mga serbisyo sa oras na ito ay isagawa maliban kung may ibang mga kasunduan na ginawa nang maaga.
3.  **Insurance**: Ang aking dental insurance ay isang kontrata sa pagitan ko at ng aking insurance provider. Nauunawaan ko na ako ang may pananagutan para sa anumang natitirang balanse na hindi sakop ng aking insurance. Tutulong ang klinika na ito sa pagproseso ng mga claim, ngunit ang pangunahing responsibilidad sa pagbabayad ay nasa akin.
4.  **Mga Karapatan ng Pasyente**: May karapatan akong humingi ng detalyadong breakdown ng mga gastos at talakayin ang mga opsyon sa pagbabayad sa mga kawani ng klinika.
5.  **Pag-atras**: Nauunawaan ko na ang pag-atras mula sa paggamot matapos itong magsimula ay hindi nag-aalis sa akin ng responsibilidad sa pananalapi para sa mga serbisyong naisagawa na.` },
    { id: 'PEDIATRIC_CONSENT', name: 'Consent for Treatment of a Minor', content_en: `As the parent or legal guardian of the minor patient, **{PatientName}**, I hereby authorize **{DoctorName}** and their designated staff to perform the necessary dental procedures as have been explained to me.

1.  **Informed Consent**: I confirm that the nature of the proposed treatment, potential risks, benefits, and reasonable alternatives have been explained to me in terms I can understand. I have had the opportunity to ask questions, and my questions have been answered to my satisfaction.
2.  **Anesthesia & Medications**: I consent to the use of local anesthetics, sedatives, or other medications as deemed necessary by the dentist for my child's safe and effective treatment.
3.  **Guardian's Rights**: I understand that I have the right to be present during treatment, where appropriate, and to make decisions on behalf of my child.
4.  **Withdrawal**: I can withdraw this consent at any time by notifying the dental staff, which will not affect any treatment already provided.

My signature confirms my authority to consent for this minor and my agreement to the above terms.`, content_tl: `[Pagsasalin sa Tagalog]: Bilang magulang o legal na tagapag-alaga ng menor de edad na pasyente, si **{PatientName}**, pinahihintulutan ko si **{DoctorName}** at ang kanilang mga itinalagang tauhan na isagawa ang mga kinakailangang pamamaraan sa ngipin na ipinaliwanag sa akin.

1.  **May Kaalamang Pahintulot**: Kinukumpirma ko na ang likas na katangian ng iminungkahing paggamot, mga potensyal na panganib, benepisyo, at makatwirang mga alternatibo ay ipinaliwanag sa akin sa mga terminong naiintindihan ko. Nagkaroon ako ng pagkakataong magtanong, at ang aking mga tanong ay nasagot nang kasiya-siya.
2.  **Anesthesia at mga Gamot**: Sumasang-ayon ako sa paggamit ng mga lokal na anestisya, pampakalma, o iba pang mga gamot na itinuturing na kinakailangan ng dentista para sa ligtas at epektibong paggamot ng aking anak.
3.  **Mga Karapatan ng Tagapag-alaga**: Nauunawaan ko na may karapatan akong dumalo sa panahon ng paggamot, kung naaangkop, at gumawa ng mga desisyon para sa aking anak.
4.  **Pagbawi**: Maaari kong bawiin ang pahintulot na ito anumang oras sa pamamagitan ng pag-abiso sa mga kawani ng ngipin, na hindi makakaapekto sa anumang paggamot na naibigay na.

Ang aking lagda ay nagpapatunay ng aking awtoridad na magbigay ng pahintulot para sa menor de edad na ito at ang aking pagsang-ayon sa mga tuntunin sa itaas.` }
];

export const MOCK_BRANCH_PROFILES: Branch[] = [
  {
    id: 'makati-main',
    name: 'Makati Main',
    legalEntityName: 'Ivory Dental Office Inc.',
    address: '123 Ayala Avenue, Makati City, Metro Manila 1226',
    contactNumber: '(02) 8888-1234',
    email: 'contact@ivorydental-makati.ph',
    tinNumber: '123-456-789-000',
    dtiPermitNumber: 'DTI-12345678',
    logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=dentsched&backgroundColor=134e4a',
    operationalHours: {
        monday: { start: '08:00', end: '18:00', isClosed: false },
        tuesday: { start: '08:00', end: '18:00', isClosed: false },
        wednesday: { start: '08:00', end: '18:00', isClosed: false },
        thursday: { start: '08:00', end: '18:00', isClosed: false },
        friday: { start: '08:00', end: '18:00', isClosed: false },
        saturday: { start: '08:00', end: '16:00', isClosed: false },
        sunday: { start: '09:00', end: '12:00', isClosed: true }
    }
  },
  {
    id: 'qc-satellite',
    name: 'Quezon City Satellite',
    legalEntityName: 'Ivory Dental QC Branch',
    address: '456 Katipunan Avenue, Quezon City, Metro Manila',
    contactNumber: '(02) 8987-6543',
    email: 'contact@ivorydental-qc.ph',
    tinNumber: '987-654-321-000',
    dtiPermitNumber: 'DTI-87654321',
    operationalHours: {
        monday: { start: '09:00', end: '17:00', isClosed: false },
        tuesday: { start: '09:00', end: '17:00', isClosed: false },
        wednesday: { start: '09:00', end: '17:00', isClosed: false },
        thursday: { start: '09:00', end: '17:00', isClosed: false },
        friday: { start: '09:00', end: '17:00', isClosed: false },
        saturday: { start: '09:00', end: '13:00', isClosed: true },
        sunday: { start: '09:00', end: '12:00', isClosed: true }
    }
  }
];

export const DEFAULT_DOCUMENT_TEMPLATES: Record<string, { name: string; content: string }> = {
  'med_cert': {
    name: 'Medical Certificate',
    content: `## MEDICAL CERTIFICATE

**Date:** {currentDate}

This is to certify that **{patientName}**, {patientAge} years old, of {patientAddress}, was seen and examined at **{clinicName}** on the date above with the following findings:

**Diagnosis:**
{diagnosis}

**Recommendations:**
{recommendations}

This certificate is issued upon the patient's request for whatever legal purpose it may serve.


---
**{practitionerName}**
*{practitionerSpecialty}*
PRC License No: {practitionerPrc}
Clinic Address: {clinicAddress}
`
  },
  'soa': {
    name: 'Statement of Account',
    content: `# STATEMENT OF ACCOUNT

**{clinicName}**
{clinicAddress}
TIN: {clinicTin}

---

**Patient:** {patientName}
**Patient ID:** {patientId}
**Date Issued:** {currentDate}

| Date       | Description          | Charge (PHP) | Payment (PHP) | Balance (PHP) |
|------------|----------------------|--------------|---------------|---------------|
{ledgerRows}

### Total Balance Due: PHP {patientBalance}
`
  },
  'rx': {
    name: 'Prescription',
    content: `
**{practitionerName}**
{practitionerSpecialty}
PRC: {practitionerPrc} | PTR: {practitionerPtr} | S2: {practitionerS2}

---

**Patient:** {patientName}
**Age:** {patientAge}
**Date:** {currentDate}

---

### Rx

**{medicationGenericName}**
({medicationBrandName})
Dosage: {medicationDosage}

Disp: #{medicationQuantity}

Sig: {medicationInstructions}
`
  },
  'patient_info': {
    name: 'Patient Information Sheet',
    content: `# Patient Information

**Name:** {patientName}
**ID:** {patientId}
**Date of Birth:** {patientDob}
**Age:** {patientAge}
**Sex:** {patientSex}

---

### Contact Details
**Mobile:** {patientPhone}
**Email:** {patientEmail}
**Address:** {patientAddress}

---

### Insurance
**Provider:** {insuranceProvider}
**Policy #:** {insuranceNumber}

---

### Medical Alerts
**Allergies:** {patientAllergies}
**Conditions:** {patientMedicalConditions}
`
  },
  'med_history': {
    name: 'Medical & Dental History Form',
    content: `# Medical and Dental History

**Patient Name:** _________________________
**Date:** {currentDate}

Please check (✓) any of the following that apply to you.

### Medical Conditions
- [ ] High Blood Pressure
- [ ] Heart Disease
- [ ] Diabetes
- [ ] Allergies: _________________________
- [ ] Other: _________________________

### Dental History
- [ ] Are you anxious about dental treatment?
- [ ] Do your gums bleed when brushing?
- [ ] Previous orthodontic treatment?

---
I certify that the above information is correct to the best of my knowledge.

**Signature:** _________________________
`
  },
  'consent_dpa': {
    name: 'General Consent & DPA Form',
    content: `# General Consent for Treatment and Data Privacy

I, **{patientName}**, hereby consent to undergo dental examination, treatment, and diagnostic procedures as deemed necessary by the dental professionals at **{clinicName}**.

I understand the risks and benefits associated with dental care. I have had the opportunity to ask questions and have received satisfactory answers.

**Data Privacy (RA 10173):** I consent to the collection, use, and processing of my personal and medical information for the purpose of my dental treatment, billing, and for compliance with healthcare regulations.

**Patient Signature:** _________________________
**Date:** {currentDate}
`
  },
  'appt_slip': {
    name: 'Appointment Slip',
    content: `## Your Next Appointment

**Patient:** {patientName}

Your next appointment is scheduled for:
**Date:** {appointmentDate}
**Time:** {appointmentTime}
**With:** {practitionerName}
**Procedure:** {appointmentType}

Please arrive 15 minutes early. Thank you!

**{clinicName}**
{clinicContactNumber}
`
  },
  'referral': {
    name: 'Referral Letter',
    content: `**{clinicName}**
{clinicAddress}
{clinicContactNumber}

**Date:** {currentDate}

**To:** _________________________ (Specialist Name)
**Clinic:** _________________________

---

**RE: {patientName} (DOB: {patientDob})**

Dear Doctor,

This is to refer the above-named patient for evaluation and management of:
{reasonForReferral}

**Pertinent Clinical Findings:**
{clinicalFindings}

Thank you for your professional courtesy.

Sincerely,

**{practitionerName}**
PRC License No: {practitionerPrc}
`
  },
  'post_op': {
    name: 'Post-Operative Instructions',
    content: `# Post-Operative Care Instructions

**Patient:** {patientName}
**Procedure:** {procedureType}
**Date:** {currentDate}

Please follow these instructions carefully to ensure proper healing:

1.  **Bleeding:** Bite gently on the provided gauze for 30-60 minutes.
2.  **Pain:** Take prescribed pain medication as directed.
3.  **Swelling:** Apply a cold pack to the area for 15 minutes on, 15 minutes off.
4.  **Diet:** Stick to soft foods for the first 24 hours.
5.  **Hygiene:** Do not rinse vigorously today. Tomorrow, you may gently rinse with warm salt water.

**Call our office at {clinicContactNumber} if you experience excessive bleeding, pain, or swelling.**
`
  },
  'eod_report': {
    name: 'End of Day (EOD) Report',
    content: `# End of Day Report

**Date:** {currentDate}
**Branch:** {branchName}

| Metric                 | Value |
|------------------------|-------|
| Total Production (PHP) | {totalProduction} |
| Total Collections (PHP)| {totalCollections} |
| Patients Seen          | {patientsSeen} |
| New Patients           | {newPatients} |
| No-Shows               | {noShows} |

**Notes:**
{reportNotes}

---
Generated by: {currentUser}
`
  },
  'collections_report': {
    name: 'Collections & Aging Report',
    content: `# Collections & Aging Report

**Date:** {currentDate}

| Patient Name     | Balance (PHP) | Days Overdue |
|------------------|---------------|--------------|
{agingRows}

`
  },
  'inventory_report': {
    name: 'Inventory & Stock Level Report',
    content: `# Inventory Report

**Date:** {currentDate}
**Branch:** {branchName}

| Item Name          | Category    | Qty on Hand | Low Stock Threshold | Status |
|--------------------|-------------|-------------|---------------------|--------|
{inventoryRows}

`
  },
  'excuse_letter': {
    name: 'Excuse Letter',
    content: `# EXCUSE LETTER

**Date:** {currentDate}
**To Whom It May Concern,**

This is to certify that **{patientName}** was seen and treated at our clinic, **{clinicName}**, on the date specified above.

Please excuse him/her from school/work for this period.

Should you have any questions, please feel free to contact our office at {clinicContactNumber}.

Sincerely,

---
**{practitionerName}**
PRC License No: {practitionerPrc}
`
  },
  'treatment_plan': {
    name: 'Treatment Plan',
    content: `# TREATMENT PLAN PROPOSAL

**Patient:** {patientName}
**Plan Name:** {planName}
**Date:** {currentDate}

This document outlines the proposed course of treatment. The fees listed are estimates and may be subject to change based on clinical findings during the procedure.

| Tooth # | Procedure Description | Fee (PHP) |
|---------|-----------------------|-----------|
{planItems}

---
**Total Estimated Cost:** **PHP {planTotal}**

I have read and understood the proposed treatment plan and associated costs.

**Patient Signature:** _________________________
`
  },
  'lab_order': {
    name: 'Lab Order Form',
    content: `# DENTAL LABORATORY ORDER FORM

**TO:** {labName}
**FROM:** {clinicName}
**DATE:** {currentDate}
**DUE DATE:** {dueDate}

---

**PATIENT:** {patientName}
**AGE:** {patientAge}
**SEX:** {patientSex}

---

### ORDER DETAILS

| Tooth # | Restoration Type | Shade |
|---------|------------------|-------|
| {toothNumber} | {restorationType} | {shade} |

**Instructions:**
{instructions}

Thank you,

**{practitionerName}**
PRC License No: {practitionerPrc}
`
  },
  'walkout_statement': {
    name: 'Walkout Statement',
    content: `# Walkout Statement

**Patient:** {patientName}
**Date:** {currentDate}

Thank you for your visit today! Here is a summary of today's transactions.

### Services Rendered Today
| Description | Amount (PHP) |
|-------------|--------------|
{todaysProcedures}

### Payments Made Today
| Description | Amount (PHP) |
|-------------|--------------|
{todaysPayments}

---

**Total Balance Due:** **PHP {patientBalance}**
`
  },
  'official_receipt': {
    name: 'Official Receipt (OR)',
    content: `# OFFICIAL RECEIPT

**{clinicName}**
{clinicAddress}
TIN: {clinicTin}

**OR No:** {orNumber}
**Date:** {currentDate}

---

**Received from:** {patientName}
**TIN:** {patientTin}
**Address:** {patientAddress}

The sum of **{amountInWords} pesos**.

### Payment Details
| Description | Amount (PHP) |
|-------------|--------------|
{paymentDetails}

---

**Total Amount Paid:** **PHP {totalAmountPaid}**

By: _________________________
(Authorized Representative)
`
  },
  'installment_agreement': {
    name: 'Installment Plan Agreement',
    content: `# INSTALLMENT PLAN AGREEMENT

This agreement is made on **{currentDate}** between **{clinicName}** ("the Clinic") and **{patientName}** ("the Patient").

The Clinic agrees to provide dental services totaling **PHP {totalAmount}**.

The Patient agrees to pay this amount in **{numberOfPayments}** monthly installments of **PHP {monthlyPayment}**, starting on **{startDate}**.

Payments are due on the same day each month. A late fee may be applied for payments overdue by more than 15 days.

**Patient Signature:** _________________________
**Date:** {currentDate}

**Clinic Representative:** _________________________
`
  },
  'hmo_claim_form': {
    name: 'HMO/Insurance Claim Form',
    content: `# STANDARD HMO CLAIM FORM

### PART I: MEMBER/PATIENT INFORMATION
**Member Name:** {patientName}
**HMO Provider:** {insuranceProvider}
**Policy Number:** {insuranceNumber}
**Date of Service:** {appointmentDate}

### PART II: PROVIDER INFORMATION
**Clinic Name:** {clinicName}
**Attending Dentist:** {practitionerName}
**PRC License No:** {practitionerPrc}

### PART III: SERVICES RENDERED
**Diagnosis / Chief Complaint:**
{chiefComplaint}

**Procedures Performed:**
{proceduresDone}

---
I certify that the foregoing information is true and correct.

**Dentist Signature:** _________________________
`
  },
  'practitioner_production_report': {
    name: 'Practitioner Production Report',
    content: `# PRACTITIONER PRODUCTION REPORT

**Practitioner:** {practitionerName}
**Date Range:** {startDate} to {endDate}

| Procedure Category | Count | Total Production (PHP) |
|--------------------|-------|------------------------|
{productionItems}

---
**Grand Total Production:** **PHP {totalProduction}**
`
  },
  'appointment_analysis_report': {
    name: 'Appointment Analysis Report',
    content: `# APPOINTMENT ANALYSIS REPORT

**Date Range:** {startDate} to {endDate}
**Branch:** {branchName}

### Key Metrics
| Metric | Value |
|-------------------------|-------|
| Total Appointments Booked | {totalAppointments} |
| Completed Appointments | {completedAppointments} |
| No-Shows | {noShowCount} |
| Cancellations | {cancellationCount} |

### Analysis
**Completion Rate:** {completionRate}%
**No-Show Rate:** {noShowRate}%
`
  },
  'bir_sales_report': { name: 'BIR Sales Report', content: '...' },
  'bir_discount_report': { name: 'BIR Discount Report', content: '...' },
};

// FIX: Complete the definition of DEFAULT_COMMUNICATION_TEMPLATES
export const DEFAULT_COMMUNICATION_TEMPLATES: CommunicationTemplate[] = [
  { id: 'recall_due', category: 'Recall', title: 'Recall Reminder', content: 'Hi {patientName}, this is a friendly reminder from {clinicName} that you are due for your regular check-up. Please call us at {clinicContactNumber} to book your appointment. Thank you!' },
  { id: 'appt_confirm', category: 'Appointment', title: 'Appointment Confirmation', content: 'Hi {patientName}, your appointment at {clinicName} is confirmed for {appointmentDate} at {appointmentTime}. We look forward to seeing you!' },
  { id: 'post_op_check', category: 'Follow-up', title: 'Post-Op Check-in', content: 'Hi {patientName}, this is {clinicName} checking in after your procedure on {appointmentDate}. We hope you are recovering well. Please do not hesitate to contact us if you have any concerns.' },
];

export const DEFAULT_SMS_TEMPLATES: Record<string, SmsTemplateConfig> = {
    'clearance_approved': {
        id: 'clearance_approved',
        label: 'Medical Clearance Approved',
        text: 'Hi {PatientName}, good news! Your medical clearance from {DoctorName} has been approved. You may now proceed with your scheduled treatment. - {ClinicName}',
        enabled: true,
        category: 'Safety',
        triggerDescription: 'Sent when a pending medical clearance is marked as approved.',
        isPdaCompliant: true,
    },
    'clearance_rejected': {
        id: 'clearance_rejected',
        label: 'Medical Clearance Rejected',
        text: 'Hi {PatientName}, please contact us at {ClinicContactNumber}. There is an update regarding your medical clearance from {DoctorName} that requires discussion. - {ClinicName}',
        enabled: true,
        category: 'Safety',
        triggerDescription: 'Sent when a pending medical clearance is rejected.',
        isPdaCompliant: true,
    },
    'appt_booking_confirmation': {
        id: 'appt_booking_confirmation',
        label: 'Appointment Booking Confirmation',
        text: 'Your appointment at {ClinicName} for {Procedure} with {ProviderName} on {Date} at {Time} is booked. Reply YES to confirm or call {ClinicContactNumber} to reschedule.',
        enabled: true,
        category: 'Logistics',
        triggerDescription: 'Sent when a new appointment is created in the system.',
        isPdaCompliant: true,
    }
};

// FIX: Define and export DEFAULT_SETTINGS
export const DEFAULT_SETTINGS: FieldSettings = {
    clinicName: 'dentsched',
    clinicProfile: 'corporate',
    strictMode: true,
    editBufferWindowMinutes: 5,
    sessionTimeoutMinutes: 15,
    suffixes: ['Jr.', 'Sr.', 'II', 'III', 'IV'],
    civilStatus: ['Single', 'Married', 'Widowed', 'Separated'],
    sex: ['Male', 'Female'],
    insuranceProviders: ['Maxicare', 'Intellicare', 'Medicard', 'PhilCare'],
    bloodGroups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    nationalities: ['Filipino'],
    religions: ['Roman Catholic', 'Christian', 'Muslim', 'Iglesia ni Cristo', 'Other'],
    relationshipTypes: ['Parent', 'Spouse', 'Child', 'Sibling', 'Guardian'],
    habitRegistry: ['Smoking', 'Drinking', 'Bruxism'],
    documentCategories: ['X-Ray', 'Lab Result', 'Medical Clearance', 'Insurance Form'],
    allergies: ['Penicillin', 'Aspirin', 'Latex', 'Nuts', 'None'],
    medicalConditions: ['High BP', 'Heart Disease', 'Diabetes', 'Asthma', 'Bleeding Issues', 'None', 'Taking Blood Thinners? (Aspirin, Warfarin, etc.)'],
    identityFields: [], // Let's keep this simple for now
    fieldLabels: {},
    identityLayoutOrder: [],
    medicalLayoutOrder: [],
    identityQuestionRegistry: [],
    femaleQuestionRegistry: [],
    medicalRiskRegistry: [],
    dentalHistoryRegistry: [],
    criticalRiskRegistry: CRITICAL_CLEARANCE_CONDITIONS,
    procedures: [
        { id: 'proc_1', name: 'Consultation', category: 'General', defaultDurationMinutes: 30 },
        { id: 'proc_2', name: 'Oral Prophylaxis', category: 'Preventive', defaultDurationMinutes: 45, allowedLicenseCategories: ['DENTIST', 'HYGIENIST'] },
        { id: 'proc_3', name: 'Composite Restoration', category: 'Restorative', defaultDurationMinutes: 60, requiresXray: true, allowedLicenseCategories: ['DENTIST'] },
        { id: 'proc_4', name: 'Simple Extraction', category: 'Surgery', defaultDurationMinutes: 45, requiresConsent: true, requiresSurgicalConsent: true, requiresXray: true, allowedLicenseCategories: ['DENTIST'], requiresWitness: true },
        { id: 'proc_5', name: 'Zirconia Crown', category: 'Prosthodontics', defaultDurationMinutes: 90, requiresConsent: true, allowedLicenseCategories: ['DENTIST'], requiresWitness: true }
    ],
    medications: [],
    shadeGuides: ['Vita Classical', 'Vita 3D-Master'],
    restorativeMaterials: ['Composite A2', 'Composite A3', 'Amalgam'],
    branches: ['Makati Main', 'Quezon City Satellite'],
    branchProfiles: MOCK_BRANCH_PROFILES,
    documentTemplates: DEFAULT_DOCUMENT_TEMPLATES,
    communicationTemplates: DEFAULT_COMMUNICATION_TEMPLATES,
    branchColors: { 'Makati Main': '#134e4a', 'Quezon City Satellite': '#c2410c' },
    resources: [
        { id: 'chair1', name: 'Chair 1', type: ResourceType.CHAIR, branch: 'Makati Main' },
        { id: 'chair2', name: 'Chair 2', type: ResourceType.CHAIR, branch: 'Makati Main' },
        { id: 'xray1', name: 'X-Ray Room', type: ResourceType.XRAY, branch: 'Makati Main' }
    ],
    assets: [],
    vendors: [],
    hospitalAffiliations: [],
    smsTemplates: DEFAULT_SMS_TEMPLATES as SmsTemplates,
    smsConfig: {} as SmsConfig,
    consentFormTemplates: DEFAULT_CONSENT_FORM_TEMPLATES,
    smartPhrases: [],
    paymentModes: ['Cash', 'Credit Card', 'GCash', 'Bank Transfer'],
    taxConfig: { vatRate: 12, withholdingRate: 5, nextOrNumber: 1001 },
    features: {
        enableLabTracking: true, enableComplianceAudit: true, enableMultiBranch: true,
        enableDentalAssistantFlow: false, enableHMOClaims: true, enableInventory: true,
        inventoryComplexity: 'ADVANCED', enableAnalytics: true, enableDigitalConsent: true,
        enableAutomatedRecall: true, enableOnlineForms: true, enableEPrescription: true,
        enableAdvancedPermissions: true, enablePhilHealthClaims: true, enableLabPortal: false,
        enableDocumentManagement: true, enableClinicalProtocolAlerts: true, enableTreatmentPlanApprovals: true,
        enableAccountabilityLog: true, enableReferralTracking: true, enablePromotions: false,
        enableSmsAutomation: true, enableMaterialTraceability: true, enableBirComplianceMode: true,
        enableStatutoryBirTrack: true, enableHmoInsuranceTrack: true, enableDigitalDocent: true
    },
    permissions: {},
    currentPrivacyVersion: '1.1',
    acknowledgedAlertIds: [],
    retentionPolicy: { archivalYears: 7, purgeYears: 10 },
    kioskSettings: { welcomeMessage: 'Welcome!', privacyNotice: 'Please review our privacy policy.' },
    payrollAdjustmentTemplates: [],
    expenseCategories: ['Office Supplies', 'Utilities', 'Lab Fees', 'Rent']
};

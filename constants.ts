// FIX: Imported missing financial types
import { User, UserRole, Patient, Appointment, AppointmentStatus, LabStatus, FieldSettings, StockItem, StockCategory, Expense, TreatmentPlanStatus, AuditLogEntry, SterilizationCycle, Vendor, SmsTemplates, ResourceType, ClinicResource, InstrumentSet, MaintenanceAsset, OperationalHours, SmsConfig, AuthorityLevel, PatientFile, ClearanceRequest, VerificationMethod, ProcedureItem, LicenseCategory, WaitlistEntry, FamilyGroup, CommunicationChannel, Branch, CommunicationTemplate, ConsentFormTemplate, RecallStatus, RegistrationStatus, Medication } from './types';
import { Calendar, CheckCircle, UserCheck, Armchair, Activity, CheckCircle2 as CompletedIcon, XCircle, UserX, Droplet } from 'lucide-react';
import type { ElementType } from 'react';
import CryptoJS from 'crypto-js';

// Helper for new patient ID format
const generateRandomAlpha = (length: number): string => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

// Generators for mock data
export const generateUid = (prefix = 'id') => {
    // The user wants a specific format for patient IDs.
    // New format: 8-digit number + 5 alpha characters, e.g. 17765432QASGT
    if (prefix === 'p') {
        const timestampPart = Date.now().toString().slice(-8);
        const randomAlphaPart = generateRandomAlpha(5);
        return `${timestampPart}${randomAlphaPart}`;
    }
    
    // Keep original format for other IDs (appointments, notes, etc.)
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
};

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
    { id: 'RADIOGRAPH', name: 'Radiograph', content_en: "I understand that an x-ray shot or a radiograph maybe necessary as part of diagnostic aid to come up with tentative diagnosis of my dental problem and to make a good treatment plan, but, this will not give me a 100% assurance for the accuracy of the treatment since all dental treatments are subject to unpredictable complications that later on may lead to sudden change of treatment plan and subject to new charges.", content_tl: "[Pagsasalin sa Tagalog]: Nauunawaan ko na ang isang x-ray shot o radiograph ay maaaring kailanganin bilang bahagi ng tulong sa pag-diagnose upang makabuo ng pansamantalang diagnosis ng aking problema sa ngipin at gumawa ng isang mahusay na plano sa paggamot, ngunit, hindi ito magbibigay sa akin ng 100% kasiguruhan para sa katumpakan ng paggamot dahil ang lahat ng paggamot sa ngipin ay napapailalim sa hindi mahuhulaan na mga komplikasyon na sa kalaunan ay maaaring humantong sa biglaang pagbabago ng plano sa paggamot at napapailalim sa mga bagong singil." },
    { id: 'EXTRACTION', name: 'Removal of Teeth', content_en: "I understand that alternatives to tooth removal (root canal therapy, crowns & periodontal surgery, etc.) & I completely understand these alternatives, including their risk & benefits prior to authorizing the dentist to remove teeth & any other structures necessary for reasons above. I understand that removing teeth does not always remove all the infections, if present, & it may be necessary to have further treatment. I understand the risk involved in having teeth removed, such as pain, swelling, spread of infection, dry socket, fractured jaw, loss of feeling on the teeth, lips, tongue & surrounding tissue that can last for an indefinite period of time. I understand that I may need further treatment under a specialist if complications arise during or following treatment.", content_tl: "[Pagsasalin sa Tagalog]: Nauunawaan ko ang mga alternatibo sa pagbunot ng ngipin (root canal therapy, korona at periodontal surgery, atbp.) at lubos kong nauunawaan ang mga alternatibong ito, kabilang ang kanilang mga panganib at benepisyo bago pahintulutan ang dentista na bunutin ang mga ngipin at anumang iba pang mga istraktura na kinakailangang para sa mga dahilan sa itaas. Nauunawaan ko na ang pagbunot ng mga ngipin ay hindi palaging nag-aalis ng lahat ng impeksyon, kung mayroon, at maaaring kailanganin na magkaroon ng karagdagang paggamot. Nauunawaan ko ang mga panganib na kasangkot sa pagbunot ng ngipin, tulad ng sakit, pamamaga, pagkalat ng impeksyon, dry socket, bali ng panga, pagkawala ng pakiramdam sa ngipin, labi, dila at nakapaligid na tisyu na maaaring tumagal nang walang katiyakan. Nauunawaan ko na maaaring kailanganin ko ng karagdagang paggamot sa ilalim ng isang espesyalista kung magkakaroon ng mga komplikasyon sa panahon o pagkatapos ng paggamot." },
    { id: 'CROWNS_BRIDGES', name: 'Crowns, Caps & Bridges', content_en: "Preparing a tooth may irritate the nerve tissue in the center of the tooth, leaving the tooth extra sensitive to heat, cold & pressure. Treating such irritation may involve using special toothpastes, mouth rinses or root canal therapy. I understand that sometimes it is not possible to match the color of natural teeth exactly with artificial teeth. I further understand that I may be wearing temporary crowns, which may come off easily & that I must be careful to ensure that they are kept on until the permanent crowns are delivered. It is my responsibility to return for permanent cementation within 20 days from tooth preparation, as excessive days delay may allow for tooth movement, which may necessitate a remake of the crown, bridge/ cap. I understand there will be additional charges for remakes due to my delaying of permanent cementation, & I realize that final opportunity to make changes in my new crown, bridges or cap (including shape, fit, size, & color) will be before permanent cementation.", content_tl: "[Pagsasalin sa Tagalog]: Ang paghahanda ng ngipin ay maaaring makairita sa tisyu ng nerbiyos sa gitna ng ngipin, na nag-iiwan sa ngipin na sobrang sensitibo sa init, lamig at presyon. Ang paggamot sa naturang pangangati ay maaaring kasangkot sa paggamit ng mga espesyal na toothpaste, mouth rinses o root canal therapy. Nauunawaan ko na kung minsan ay hindi posible na eksaktong tumugma sa kulay ng mga natural na ngipin sa mga artipisiyal na ngipin. Higit pa rito, nauunawaan ko na maaaring ako ay nagsusuot ng mga pansamantalang korona, na maaaring madaling matanggal at dapat akong mag-ingat upang matiyaky na mananatili ang mga ito hanggang sa maihatid ang mga permanenteng korona. Responsibilidad kong bumalik para sa permanenteng sementasyon sa loob ng 20 araw mula sa paghahanda ng ngipin, dahil ang labis na araw ng pagkaantala ay maaaring magbigay-daan para sa paggalaw ng ngipin, na maaaring mangailangan ng muling paggawa ng korona, tulay/ takip. Nauunawaan ko na magkakaroon ng mga karagdagang singil para sa muling paggawa dahil sa aking pagkaantala ng permanenteng sementasyon, at napagtanto ko na ang huling pagkakataon na gumawa ng mga pagbabago sa aking bagong korona, tulay o takip (kabilang ang hugis, sukat, laki, at kulay) ay bago ang permanenteng sementasyon." },
    { id: 'ROOT_CANAL', name: 'Endodontics (Root Canal)', content_en: "I understand there is no guarantee that a root canal treatment will save a tooth & that complications can occur from the treatment & that occasionally root canal filling materials may extend through the tooth which does not necessarily effect the success of the treatment. I understand that endodontic files & drills are very fine instruments & stresses vented in their manufacture & calcifications present in teeth can cause them to break during use. I understand that referral to the endodontist for additional treatments may be necessary following any root canal treatment & I agree that I am responsible for any additional cost for treatment performed by the endodontist. I understand that a tooth may require removal in spite of all efforts to save it.", content_tl: "[Pagsasalin sa Tagalog]: Nauunawaan ko na walang garantiya na ang isang root canal treatment ay makakapagligtas sa isang ngipin at maaaring magkakaroon ng mga komplikasyon mula sa paggamot at na paminsan-minsan ang mga materyales sa pagpuno ng root canal ay maaaring lumampas sa ngipin na hindi kinakailangang makaapekto sa tagumpay ng paggamot. Nauunawaan ko na ang mga endodontic file at drill ay napakapinong mga instrumento at ang mga stress na ibinubuga sa kanilang paggawa at mga calcification na naroroon sa mga ngipin ay maaaring maging sanhi ng pagkasira nito sa panahon ng paggamit. Nauunawaan ko na ang referral sa endodontist para sa mga karagdagang paggamot ay maaaring kailanganin kasunod ng anumang root canal treatment at sumasang-ayon ako na ako ang may pananagutan para sa anumang karagdagang gastos para sa paggamot na ginawa ng endodontist. Nauunawaan ko na ang isang ngipin ay maaaring kailanganing tanggalin sa kabila ng lahat ng pagsisikap na iligtas ito." },
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
    { id: 'FINANCIAL_CONSENT', name: 'Financial Consent', content_en: `I acknowledge that I have been provided with an estimate of the costs for my proposed treatment plan. I understand and agree to the following:

1.  **Estimate vs. Actual Cost**: The provided quote is an estimate. Unforeseen clinical findings during treatment may require changes to the plan and associated costs. I will be informed of any significant changes.
2.  **Financial Responsibility**: I am fully responsible for the total payment of all procedures performed. I agree to pay for services at the time they are rendered unless other arrangements have been made in advance.
3.  **Insurance**: My dental insurance is a contract between me and my insurance provider. I understand that I am responsible for any remaining balance not covered by my insurance. This clinic will assist in processing claims, but ultimate responsibility for payment rests with me.
4.  **Patient Rights**: I have the right to ask for a detailed breakdown of costs and to discuss payment options with the clinic staff.
5.  **Withdrawal**: I understand that withdrawing from treatment after it has commenced does not absolve me of financial responsibility for services already rendered.`, content_tl: `[Pagsasalin sa Tagalog]: Kinikilala ko na nabigyan ako ng pagtatantya ng mga gastos para sa aking iminungkahing plano sa paggamot. Nauunawaan at sumasang-ayon ako sa mga sumusunod:

1.  **Tantya vs. Aktwal na Gastos**: Ang ibinigay na quote ay isang pagtatantya. Ang mga hindi inaasahang klinikal na natuklasan sa panahon ng paggamot ay maaaring mangailangan ng mga pagbabago sa plano at mga kaugnay na gastos. Ipapabatid sa akin ang anumang makabuluhang pagbabago.
2.  **Responsibilidad sa Pinansyal**: Ako ang may buong pananagutan para sa kabuuang bayad ng lahat ng mga pamamaraang isinagawa. Sumasang-ayon akong magbayad para sa mga serbisyo sa oras na ito ay isagawa maliban kung may ibang mga kasunduan na ginawa nang maaga.
3.  **Insurance**: Ang aking dental insurance ay isang kontrata sa pagitan ko at ng aking insurance provider. Nauunawaan ko na ako ang may pananagutan para sa anumang natitirang balanse na hindi sakop ng aking insurance. Tutulong ang klinika na ito sa pagproseso ng mga claim, ngunit ang pangunahing responsibilidad sa pagbabayad ay nasa akin.
4.  **Mga Karapatan ng Pasyente**: May karapatan akong humingi ng detalyedong breakdown ng mga gastos at talakayin ang mga opsyon sa pagbabayad sa mga kawani ng klinika.
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
        sunday: { start: null, end: null, isClosed: true }
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
        saturday: { start: null, end: null, isClosed: true },
        sunday: { start: null, end: null, isClosed: true }
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

export const DEFAULT_COMMUNICATION_TEMPLATES: CommunicationTemplate[] = [
  // Chapter 1: Welcome Letters
  {
    id: 'welcome_adult_1',
    category: 'Welcome Letters',
    title: 'Welcome Letter to an Adult Patient',
    content: `Date: {currentDate}\n\nDear {patientName},\n\nOn behalf of our entire team, I would like to welcome you to {clinicName}. We are committed to providing you with the highest quality of dental care in a comfortable and friendly environment.\n\nWe look forward to seeing you for your first appointment on {appointmentDate} at {appointmentTime}. \n\nSincerely,\n{practitionerName}\n{clinicName}`
  },
  // Chapter 2: Appointments
  {
    id: 'appt_reminder',
    category: 'Appointments',
    title: 'Appointment Reminder',
    content: `Date: {currentDate}\n\nDear {patientName},\n\nThis is a friendly reminder of your upcoming dental appointment with {practitionerName} on {appointmentDate} at {appointmentTime}.\n\nPlease contact our office at {clinicContactNumber} if you need to reschedule. We look forward to seeing you.\n\nBest regards,\nThe team at {clinicName}`
  },
  {
    id: 'appt_missed',
    category: 'Appointments',
    title: 'Missed Appointment',
    content: `Date: {currentDate}\n\nDear {patientName},\n\nOur records show that you missed your appointment on {appointmentDate} at {appointmentTime}.\n\nWe understand that circumstances can change. Please call us at {clinicContactNumber} at your earliest convenience to reschedule. Consistent dental care is essential for maintaining your oral health.\n\nSincerely,\n{clinicName}`
  },
  // Chapter 4: Financial Letters
  {
    id: 'financial_new_policy',
    category: 'Financial Letters',
    title: 'New Payment Policy',
    content: `Date: {currentDate}\n\nDear {patientName},\n\nThis letter is to inform you of an update to our payment policy, effective [Effective Date].\n\n[Explain new payment policy here, e.g., "Payment is now due at the time of service."]\n\nWe have made this change to streamline our billing process and continue providing high-quality care. We accept cash, credit/debit cards, and [other payment methods].\n\nIf you have any questions, please do not hesitate to contact our office.\n\nThank you for your understanding,\n{clinicName}`
  },
];


export const STAFF: User[] = [
  { 
      id: 'ARCHITECT_01', 
      name: 'System Architect (Lead Designer)', 
      role: UserRole.SYSTEM_ARCHITECT, 
      pin: '0000',
      specialization: 'Technical Audit & Design Integrity',
      defaultBranch: 'Makati Main',
      allowedBranches: ['Makati Main', 'Quezon City Satellite', 'BGC Premium', 'Alabang South'],
      colorPreference: '#c026d3', 
      clinicHours: '24/7 System Audit Mode',
      status: 'Active',
  },
  { 
      id: 'admin1', 
      name: 'Sarah Connor', 
      role: UserRole.ADMIN, 
      pin: '1234',
      specialization: 'Clinic Director',
      prcLicense: 'ADMIN-001', 
      ptrNumber: 'PTR-MAIN-001',
      tin: '123-111-222-000',
      defaultBranch: 'Makati Main',
      allowedBranches: ['Makati Main', 'Quezon City Satellite', 'BGC Premium', 'Alabang South'],
      colorPreference: '#ef4444', 
      clinicHours: 'Mon-Sat 8:00AM - 6:00PM',
      roster: { 'Mon': 'Makati Main', 'Tue': 'Makati Main', 'Wed': 'Makati Main', 'Thu': 'Makati Main', 'Fri': 'Makati Main' },
      status: 'Active',
  },
  { 
      id: 'doc1', 
      name: 'Dr. Alexander Crentist', 
      role: UserRole.DENTIST, 
      pin: '4321',
      licenseCategory: 'DENTIST',
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
      commissionRate: 0.40,
      status: 'Active',
  },
  { 
      id: 'doc2', 
      name: 'Dr. Maria Clara', 
      role: UserRole.DENTIST, 
      pin: '5678',
      licenseCategory: 'DENTIST',
      specialization: 'Pediatric Dentistry',
      prcLicense: '0654321',
      defaultBranch: 'Quezon City Satellite',
      allowedBranches: ['Makati Main', 'Quezon City Satellite'], 
      colorPreference: '#c026d3', 
      commissionRate: 0.30,
      status: 'Active',
  },
  {
      id: 'asst1',
      name: 'John Doe',
      role: UserRole.DENTAL_ASSISTANT,
      pin: '1111',
      licenseCategory: 'HYGIENIST',
      specialization: 'Clinical Support',
      prcLicense: 'DA-098765',
      prcExpiry: getFutureDateStr(300),
      defaultBranch: 'Makati Main',
      allowedBranches: ['Makati Main'],
      colorPreference: '#3b82f6',
      status: 'Active',
  }
];

export const PATIENTS: Patient[] = [
    {
        id: 'p_master_01',
        name: 'Samantha Rose Del Rosario-Tan',
        firstName: 'Samantha Rose',
        surname: 'Del Rosario-Tan',
        middleName: 'Isabella',
        suffix: 'Jr.',
        nickname: 'Sammy',
        dob: '2007-07-15',
        sex: 'Female',
        civilStatus: 'Single',
        nationality: 'Filipino',
        religion: 'Roman Catholic',
        bloodGroup: 'AB-',
        bloodPressure: '130/85',
        phone: '0917-999-9999',
        email: 'samantha.master@example.com',
        homeAddress: '101 Master Test Ave, Stress Test Village',
        city: 'Makati City',
        barangay: 'Urdaneta',
        homeNumber: '(02) 8555-1234',
        officeNumber: '(02) 8888-9999',
        faxNumber: '(02) 8555-9012',
        occupation: 'Student',
        insuranceProvider: 'Maxicare',
        insuranceNumber: 'MAXI-MASTER-01',
        lastVisit: getPastDateStr(10),
        nextVisit: getFutureDateStr(20),
        lastDentalVisit: getPastDateStr(180),
        chiefComplaint: 'Multiple issues: toothache on lower right, bleeding gums, and checkup for braces.',
        notes: 'Extremely complex case. High medical risk. Patient is anxious but cooperative. Requires careful management and a multi-disciplinary approach. Guardian is always present.',
        currentBalance: 35000,
        recallStatus: RecallStatus.BOOKED,
        attendanceStats: { totalBooked: 15, completedCount: 12, noShowCount: 2, lateCancelCount: 1 },
        reliabilityScore: 80,
        referredById: 'p_heavy_01',
        familyGroupId: 'fam_scott_01',
        isPwd: true,
        guardianProfile: {
            legalName: 'Eleonor Del Rosario',
            relationship: 'Mother',
            mobile: '0918-111-2222',
            authorityLevel: AuthorityLevel.FULL,
            occupation: 'Lawyer'
        },
        allergies: ['Local Anesthetic (ex. Lidocaine)', 'Penicillin', 'Antibiotics', 'Sulfa drugs', 'Aspirin', 'Latex'],
        otherAllergies: 'Peanuts, Shellfish',
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
        otherConditions: 'Mild Scoliosis',
        registryAnswers: {
          'Are you in good health?': 'Yes',
          'Are you under medical treatment now?*': 'Yes',
          'Are you under medical treatment now?*_details': 'Gestational diabetes monitoring and hypertension management.',
          'Have you ever had serious illness or surgical operation?*': 'Yes',
          'Have you ever had serious illness or surgical operation?*_details': 'Tonsillectomy in 2018.',
          'Have you ever had serious illness or surgical operation?*_date': getPastDateStr(365 * 6),
          'Have you ever been hospitalized?*': 'Yes',
          'Have you ever been hospitalized?*_details': 'For a severe asthma attack in 2020.',
          'Have you ever been hospitalized?*_date': getPastDateStr(365 * 4),
          'Are you taking any prescription/non-prescription medication?*': 'Yes',
          'Are you taking any prescription/non-prescription medication?*_details': 'Methyldopa for hypertension, prenatal vitamins.',
          'Do you use tobacco products?': 'Yes',
          'Do you use alcohol, cocaine or other dangerous drugs?': 'Yes',
          'Taking Blood Thinners? (Aspirin, Warfarin, etc.)': 'Yes',
          'Taking Bisphosphonates? (Fosamax, Zometa)': 'Yes',
          'Are you pregnant?': 'Yes',
          'Are you nursing?': 'Yes',
          'Are you taking birth control pills?': 'Yes',
        },
        medicationDetails: 'Methyldopa for hypertension, prenatal vitamins.',
        previousDentist: 'Dr. Jane Doe',
        physicianName: 'Dr. Maria Santos',
        physicianSpecialty: 'OB-GYN',
        physicianAddress: 'Medical City, Ortigas',
        physicianNumber: '02-8-987-6543',
        dpaConsent: true, marketingConsent: true, practiceCommConsent: true, clinicalMediaConsent: {
            generalConsent: true,
            consentVersion: '1.0',
            consentTimestamp: getPastDateStr(10),
            consentSignature: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMzAiPjxwYXRoIGQ9Ik0xMCAxNSBDIDI1IDAgMzUgMzAgNTUgMTUgNzAgMCA4NSAzMCA5NSAxNSIgc3Ryb2tlPSIjMDAwIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
            permissions: {
                intraoralPhotos: true,
                extraoralPhotos: true,
                xrays: true,
                videography: false,
                caseStudyUse: false,
                marketingUse: false,
                thirdPartySharing: false,
            },
            mediaCapturedLogs: []
        }, thirdPartyDisclosureConsent: true, thirdPartyAttestation: true,
        registrationSignature: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMzAiPjxwYXRoIGQ9Ik0xMCAxNSBDIDI1IDAgMzUgMzAgNTUgMTUgNzAgMCA4NSAzMCA5NSAxNSIgc3Ryb2tlPSIjMDAwIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
        registrationSignatureTimestamp: new Date().toISOString(),
        files: [
            { id: 'file_master_pwd', name: 'PWD_ID_2024.pdf', category: 'PWD Certificate', url: '#', date: getPastDateStr(100) },
            { id: 'file_master_clearance', name: 'CardioClearance_Mar2024.pdf', category: 'Medical Clearance', url: '#', date: getPastDateStr(90) },
        ],
        clearanceRequests: [
            { id: 'cr_master_1', patientId: 'p_master_01', doctorName: 'Dr. cardio', specialty: 'Cardiologist', requestedAt: getPastDateStr(150), status: 'Approved', approvedAt: getPastDateStr(140), remarks: 'Expired clearance', verificationMethod: VerificationMethod.PHYSICAL_FILE_VERIFIED, verifiedByPractitionerId: 'doc1', verifiedByPractitionerName: 'Dr. Alexander Crentist' },
            { id: 'cr_master_2', patientId: 'p_master_01', doctorName: 'Dr. Maria Santos', specialty: 'OB-GYN', requestedAt: getPastDateStr(15), status: 'Approved', approvedAt: getPastDateStr(12), remarks: 'Cleared for routine procedures. Avoid lengthy appointments.', verificationMethod: VerificationMethod.DIGITAL_UPLOAD, verifiedByPractitionerId: 'doc1', verifiedByPractitionerName: 'Dr. Alexander Crentist' }
        ],
        treatmentPlans: [
            { id: 'tp_master_1', patientId: 'p_master_01', name: 'Phase 1: Urgent Care', createdAt: getPastDateStr(30), createdBy: 'Dr. Alexander Crentist', status: TreatmentPlanStatus.APPROVED },
            { id: 'tp_master_2', patientId: 'p_master_01', name: 'Phase 2: Restorative', createdAt: getPastDateStr(10), createdBy: 'Dr. Alexander Crentist', status: TreatmentPlanStatus.PENDING_REVIEW },
            { id: 'tp_master_3', patientId: 'p_master_01', name: 'Phase 3: Orthodontics', createdAt: getTodayStr(), createdBy: 'Dr. Maria Clara', status: TreatmentPlanStatus.DRAFT },
        ],
        dentalChart: [
            { id: 'dc_m_1', toothNumber: 16, procedure: 'Zirconia Crown', status: 'Completed', date: getPastDateStr(180), price: 25000 },
            { id: 'dc_m_2', toothNumber: 46, procedure: 'Surgical Extraction (Wisdom Tooth/Impacted)', status: 'Planned', date: getPastDateStr(10), price: 12000, planId: 'tp_master_1' },
            { id: 'dc_m_3', toothNumber: 25, procedure: 'Composite Restoration (2 Surfaces)', status: 'Planned', date: getPastDateStr(10), price: 2500, planId: 'tp_master_2' },
            { id: 'dc_m_4', toothNumber: 11, procedure: 'Caries', status: 'Condition', date: getPastDateStr(10), notes: 'Initial signs of mesial caries.' },
        ],
        perioChart: [
            { toothNumber: 16, date: getPastDateStr(10), pocketDepths: [3,4,3,3,4,3], recession: [1,1,1,1,1,1], bop: 2, mobility: 1 },
            { toothNumber: 36, date: getPastDateStr(10), pocketDepths: [5,4,5,4,4,5], recession: [2,1,2,1,1,2], bop: 3, mobility: 2 },
        ],
        ledger: [
            { id: 'l_m_1', date: getPastDateStr(180), description: 'Zirconia Crown #16', type: 'Charge', amount: 25000, balanceAfter: 25000 },
            { id: 'l_m_2', date: getPastDateStr(170), description: 'Initial Deposit', type: 'Payment', amount: 10000, balanceAfter: 15000 },
            { id: 'l_m_3', date: getPastDateStr(10), description: 'Surgical Extraction #46', type: 'Charge', amount: 12000, balanceAfter: 27000 },
            { id: 'l_m_4', date: getPastDateStr(5), description: 'Restorative Phase Deposit', type: 'Charge', amount: 8000, balanceAfter: 35000 },
        ],
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_heavy_01', name: 'Michael Scott', firstName: 'Michael', surname: 'Scott', insuranceProvider: 'Maxicare', dob: '1965-03-15', sex: 'Male', phone: '0917-111-2222', email: 'm.scott@dunder.com', occupation: 'Regional Manager', lastVisit: getPastDateStr(2), nextVisit: getFutureDateStr(1), chiefComplaint: 'Checkup on my bridges.', notes: 'Very talkative. Loves jokes. Gag reflex.', currentBalance: 5000, recallStatus: RecallStatus.BOOKED,
        attendanceStats: { totalBooked: 10, completedCount: 9, noShowCount: 1, lateCancelCount: 0 }, reliabilityScore: 90,
        treatmentPlans: [{ id: 'tp1', patientId: 'p_heavy_01', name: 'Phase 1 - Urgent Care', createdAt: getTodayStr(), createdBy: 'Dr. Alexander Crentist', status: TreatmentPlanStatus.PENDING_REVIEW, reviewNotes: 'Please check #16 for fracture lines before proceeding.' }],
        ledger: [ {id: 'l1', date: getPastDateStr(30), description: 'Zirconia Crown', type: 'Charge', amount: 20000, balanceAfter: 20000}, {id: 'l2', date: getPastDateStr(29), description: 'GCash Payment', type: 'Payment', amount: 15000, balanceAfter: 5000} ],
        dentalChart: [ { id: 'dc1', toothNumber: 16, procedure: 'Zirconia Crown', status: 'Completed', date: getPastDateStr(30), price: 20000, planId: 'tp1' } ],
        familyGroupId: 'fam_scott_01',
        registrationStatus: RegistrationStatus.COMPLETE,
        communicationLog: [
          { id: 'comm1', timestamp: getPastDateStr(30), channel: CommunicationChannel.SYSTEM, authorId: 'system', authorName: 'System', content: 'Welcome to the practice, Michael!' },
          { id: 'comm2', timestamp: getPastDateStr(2), channel: CommunicationChannel.SMS, authorId: 'admin1', authorName: 'Sarah Connor', content: 'Appointment reminder for tomorrow at 10 AM.' }
        ]
    },
     {
        id: 'p_fam_02', name: 'Dwight Schrute', firstName: 'Dwight', surname: 'Schrute', dob: '1970-01-20', sex: 'Male', phone: '0917-333-4444', email: 'd.schrute@dunder.com', lastVisit: getPastDateStr(365), nextVisit: null, currentBalance: 0, recallStatus: RecallStatus.OVERDUE,
        familyGroupId: 'fam_scott_01', attendanceStats: { totalBooked: 2, completedCount: 2, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_reliable_01', name: 'Eleanor Shellstrop', firstName: 'Eleanor', surname: 'Shellstrop', dob: '1988-10-25', sex: 'Female', phone: '0917-123-4567', email: 'e.shell@thegood.place', lastVisit: getPastDateStr(180), nextVisit: null, currentBalance: 0, recallStatus: RecallStatus.DUE,
        attendanceStats: { totalBooked: 5, completedCount: 5, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_risk_02',
        name: 'Chidi Anagonye PhD',
        firstName: 'Chidi',
        surname: 'Anagonye',
        middleName: 'Eleazar',
        suffix: 'PhD',
        dob: '1982-04-12',
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
        recallStatus: RecallStatus.CONTACTED,
        attendanceStats: { totalBooked: 8, completedCount: 8, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
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
        registryAnswers: {
          'Are you in good health?': 'No',
          'Are you under medical treatment now?*': 'Yes',
          'Are you under medical treatment now?*_details': 'Currently undergoing treatment for anxiety and hypertension.',
          'Have you ever had serious illness or surgical operation?*': 'Yes',
          'Have you ever had serious illness or surgical operation?*_details': 'Coronary artery bypass graft (CABG) in 2018.',
          'Have you ever been hospitalized?*': 'Yes',
          'Have you ever been hospitalized?*_details': 'For the aforementioned heart surgery.',
          'Have you ever been hospitalized?*_date': getPastDateStr(365 * 6),
          'Are you taking any prescription/non-prescription medication?*': 'Yes',
          'Are you taking any prescription/non-prescription medication?*_details': 'Lisinopril, Metformin, Warfarin.',
          'Do you use tobacco products?': 'Yes',
          'Do you use alcohol, cocaine or other dangerous drugs?': 'Yes',
          'Taking Blood Thinners? (Aspirin, Warfarin, etc.)': 'Yes',
          'Taking Bisphosphonates? (Fosamax, Zometa)': 'Yes',
          'Are you pregnant?': 'No',
          'Are you nursing?': 'No',
          'Are you taking birth control pills?': 'No',
        },
        medicationDetails: 'Lisinopril, Metformin, Warfarin.',
        previousDentist: 'Dr. Michael Realman',
        physicianName: 'Dr. Eleanor Shellstrop',
        physicianSpecialty: 'Cardiologist',
        physicianAddress: '456 Afterlife Ave, The Good Place',
        physicianNumber: '02-8-123-4567',
        lastDigitalUpdate: new Date().toISOString(),
        dpaConsent: true,
        marketingConsent: true,
        practiceCommConsent: true,
        clinicalMediaConsent: {
            generalConsent: true,
            consentVersion: '1.0',
            consentTimestamp: getPastDateStr(30),
            consentSignature: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMzAiPjxwYXRoIGQ9Ik0xMCAxNSBDIDI1IDAgMzUgMzAgNTUgMTUgNzAgMCA4NSAzMCA5NSAxNSIgc3Ryb2tlPSIjMDAwIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
            permissions: {
                intraoralPhotos: true,
                extraoralPhotos: true,
                xrays: true,
                videography: false,
                caseStudyUse: false,
                marketingUse: false,
                thirdPartySharing: false,
            },
            mediaCapturedLogs: []
        },
        thirdPartyDisclosureConsent: true,
        thirdPartyAttestation: true,
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
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_credit_03', name: 'Maria Clara', firstName: 'Maria', surname: 'Clara', dob: '1995-06-19', sex: 'Female', phone: '0920-345-6789', email: 'm.clara@noli.me', lastVisit: getPastDateStr(45), nextVisit: null, currentBalance: 2500, recallStatus: RecallStatus.DUE,
        attendanceStats: { totalBooked: 3, completedCount: 3, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_surg_04', name: 'Juan Dela Cruz', firstName: 'Juan', surname: 'Dela Cruz', dob: '1990-01-01', sex: 'Male', phone: '0921-456-7890', email: 'juan.dc@example.com', lastVisit: getPastDateStr(7), nextVisit: null, currentBalance: 0, recallStatus: RecallStatus.DUE,
        attendanceStats: { totalBooked: 6, completedCount: 6, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        dentalChart: [ { id: 'dc_surg1', toothNumber: 38, procedure: 'Surgical Extraction (Impacted/Wisdom Tooth)', status: 'Planned', date: getPastDateStr(7), price: 7500 } ],
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_pediatric_05', name: 'Tahani Al-Jamil', firstName: 'Tahani', surname: 'Al-Jamil', dob: '2014-09-01', sex: 'Female', phone: '0922-567-8901', email: 'tahani.aj@thegood.place', lastVisit: getPastDateStr(120), nextVisit: null, currentBalance: 0, recallStatus: RecallStatus.DUE,
        guardianProfile: { legalName: 'Kamilah Al-Jamil', relationship: 'Mother', mobile: '0922-555-8888', authorityLevel: AuthorityLevel.FULL },
        attendanceStats: { totalBooked: 4, completedCount: 4, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_plan_06', name: 'Janet Della-Denunzio', firstName: 'Janet', surname: 'Della-Denunzio', dob: '1992-12-08', sex: 'Female', phone: '0923-678-9012', email: 'janet@thegood.place', lastVisit: getPastDateStr(30), nextVisit: getFutureDateStr(30), currentBalance: 0, recallStatus: RecallStatus.BOOKED,
        treatmentPlans: [{ id: 'tp_janet', patientId: 'p_plan_06', name: 'Restorative Phase', createdAt: getPastDateStr(30), createdBy: 'Dr. Maria Clara', status: TreatmentPlanStatus.APPROVED }],
        dentalChart: [ { id: 'dc_janet1', toothNumber: 14, procedure: 'Composite Restoration (2 Surfaces)', status: 'Planned', date: getPastDateStr(30), price: 2000, planId: 'tp_janet' }, { id: 'dc_janet2', toothNumber: 25, procedure: 'Composite Restoration (1 Surface)', status: 'Planned', date: getPastDateStr(30), price: 1500, planId: 'tp_janet' } ],
        attendanceStats: { totalBooked: 7, completedCount: 7, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_unreliable_08', name: 'Jason Mendoza', firstName: 'Jason', surname: 'Mendoza', dob: '1993-07-22', sex: 'Male', phone: '0925-890-1234', email: 'j.mendoza@thegood.place', lastVisit: getPastDateStr(200), nextVisit: null, currentBalance: 800, recallStatus: RecallStatus.OVERDUE, referredById: 'p_referrer_07',
        attendanceStats: { totalBooked: 10, completedCount: 4, noShowCount: 5, lateCancelCount: 1 }, reliabilityScore: 40,
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_referrer_07', name: 'Shawn Magtanggol', firstName: 'Shawn', surname: 'Magtanggol', dob: '1970-05-15', sex: 'Male', phone: '0924-789-0123', email: 'shawn@thebad.place', lastVisit: getPastDateStr(5), nextVisit: null, currentBalance: 0, recallStatus: RecallStatus.DUE,
        attendanceStats: { totalBooked: 15, completedCount: 15, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_debt_09', name: 'Ronnie Runner', firstName: 'Ronnie', surname: 'Runner', dob: '1985-11-30', sex: 'Male', phone: '0931-111-9999', email: 'r.runner@example.com', lastVisit: getPastDateStr(300), nextVisit: null, currentBalance: 15500, recallStatus: RecallStatus.OVERDUE,
        attendanceStats: { totalBooked: 9, completedCount: 7, noShowCount: 1, lateCancelCount: 1 }, reliabilityScore: 68,
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_archive_10', name: 'Mindy St. Claire', firstName: 'Mindy', surname: 'St. Claire', dob: '1975-02-18', sex: 'Female', phone: '0932-222-8888', email: 'mindy@themedium.place', lastVisit: getPastDateStr(365 * 14), nextVisit: null, currentBalance: 0, recallStatus: RecallStatus.OVERDUE,
        attendanceStats: { totalBooked: 2, completedCount: 2, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_hmo_11', name: 'Derek Hofstetler', firstName: 'Derek', surname: 'Hofstetler', dob: '1998-08-08', sex: 'Male', phone: '0933-333-7777', email: 'derek@thegood.place', lastVisit: getPastDateStr(60), nextVisit: null, currentBalance: 0, recallStatus: RecallStatus.DUE,
        insuranceProvider: 'Intellicare',
        attendanceStats: { totalBooked: 3, completedCount: 3, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_new_clean_12', name: 'Pillboi', firstName: 'Pillboi', surname: '', dob: '1999-03-03', sex: 'Male', phone: '0945-444-6666', email: 'pillboi@thegood.place', lastVisit: 'First Visit', nextVisit: null, currentBalance: 0, recallStatus: RecallStatus.DUE,
        registrationStatus: RegistrationStatus.PROVISIONAL,
    },
    {
        id: 'p_full_perio_02', name: 'Sofia Reyes', firstName: 'Sofia', surname: 'Reyes', dob: '1991-04-10', sex: 'Female', phone: '0919-987-6543', email: 'sofia.r@example.com', lastVisit: getPastDateStr(10), nextVisit: null, currentBalance: 0, recallStatus: RecallStatus.DUE,
        attendanceStats: { totalBooked: 8, completedCount: 8, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        perioChart: [
            { toothNumber: 18, date: getPastDateStr(180), pocketDepths: [3,2,3,3,2,3], recession: [1,1,1,1,1,1], bop: 2, mobility: 0 },
            { toothNumber: 17, date: getPastDateStr(180), pocketDepths: [4,3,4,3,3,4], recession: [1,1,1,1,1,1], bop: 3, mobility: 1 },
            { toothNumber: 18, date: getPastDateStr(10), pocketDepths: [2,2,2,2,2,2], recession: [1,1,1,1,1,1], bop: 0, mobility: 0 },
            { toothNumber: 17, date: getPastDateStr(10), pocketDepths: [3,2,3,2,2,3], recession: [1,1,1,1,1,1], bop: 1, mobility: 0 },
        ],
        registrationStatus: RegistrationStatus.COMPLETE,
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
    { id: 'apt_past_01', patientId: 'p_heavy_01', providerId: 'doc1', branch: 'Makati Main', date: getPastDateStr(2), time: '10:00', durationMinutes: 60, type: 'Zirconia Crown (High Translucency)', status: AppointmentStatus.COMPLETED, labStatus: LabStatus.RECEIVED, labDetails: { vendorId: 'v1' } },
    { id: 'apt_past_02', patientId: 'p_unreliable_08', providerId: 'doc2', branch: 'Quezon City Satellite', date: getPastDateStr(30), time: '13:00', durationMinutes: 60, type: 'Composite Restoration (1 Surface)', status: AppointmentStatus.NO_SHOW },
    // A cancelled appointment
    { id: 'apt_past_03', patientId: 'p_reliable_01', providerId: 'doc1', branch: 'Makati Main', date: getPastDateStr(15), time: '10:00', durationMinutes: 30, type: 'Consultation', status: AppointmentStatus.CANCELLED, cancellationReason: 'Patient called to reschedule' },
    // Future appointments
    { id: 'apt_future_01', patientId: 'p_plan_06', providerId: 'doc2', branch: 'Quezon City Satellite', date: getFutureDateStr(30), time: '10:00', durationMinutes: 60, type: 'Composite Restoration (2 Surfaces)', status: AppointmentStatus.CONFIRMED, planId: 'tp_janet' },
    { id: 'apt_future_02', patientId: 'p_heavy_01', providerId: 'doc1', branch: 'Makati Main', date: getFutureDateStr(1), time: '10:00', durationMinutes: 30, type: 'Follow-up Check', status: AppointmentStatus.SCHEDULED },
    // Admin blocks
    { id: 'apt_block_01', patientId: 'ADMIN_BLOCK', providerId: 'doc1', branch: 'Makati Main', date: getTodayStr(), time: '12:00', durationMinutes: 60, type: 'Meeting', title: 'Staff Meeting', isBlock: true, status: AppointmentStatus.SCHEDULED },
    { id: 'apt_block_02', patientId: 'ADMIN_BLOCK', providerId: 'doc2', branch: 'Quezon City Satellite', date: getTodayStr(), time: '12:00', durationMinutes: 30, type: 'Lunch', title: 'Lunch Break', isBlock: true, status: AppointmentStatus.SCHEDULED },
];


// THIS IS THE MASTER SOURCE OF TRUTH FOR THE CLINICAL CATALOG.
// All procedures offered by the practice are defined here.
export const DEFAULT_PROCEDURES: ProcedureItem[] = [
  // A. Diagnostic & Preventive
  { id: 'proc_consult', name: 'Initial Consultation & Examination', category: 'Diagnostic & Preventive', defaultPrice: 800, defaultDurationMinutes: 30 },
  { id: 'proc_xray_pa', name: 'Periapical X-Ray (Single)', category: 'Diagnostic & Preventive', defaultPrice: 500, defaultDurationMinutes: 10, requiresImaging: true },
  { id: 'proc_xray_pano', name: 'Panoramic X-Ray', category: 'Diagnostic & Preventive', defaultPrice: 1500, defaultDurationMinutes: 15, requiresImaging: true },
  { id: 'proc_prophy_light', name: 'Oral Prophylaxis (Light to Moderate)', category: 'Diagnostic & Preventive', defaultPrice: 1200, defaultDurationMinutes: 45 },
  { id: 'proc_prophy_heavy', name: 'Oral Prophylaxis (Heavy w/ Stain Removal)', category: 'Diagnostic & Preventive', defaultPrice: 1800, defaultDurationMinutes: 60 },
  { id: 'proc_fluoride', name: 'Topical Fluoride Application', category: 'Diagnostic & Preventive', defaultPrice: 800, defaultDurationMinutes: 15 },
  { id: 'proc_sealant', name: 'Fissure Sealant (per tooth)', category: 'Diagnostic & Preventive', defaultPrice: 1000, defaultDurationMinutes: 20 },

  // B. Restorative Dentistry
  { id: 'proc_restor1', name: 'Composite Restoration (1 Surface)', category: 'Restorative', defaultPrice: 1500, defaultDurationMinutes: 45 },
  { id: 'proc_restor2', name: 'Composite Restoration (2 Surfaces)', category: 'Restorative', defaultPrice: 2500, defaultDurationMinutes: 60 },
  { id: 'proc_restor3', name: 'Composite Restoration (3+ Surfaces)', category: 'Restorative', defaultPrice: 3500, defaultDurationMinutes: 75 },
  { id: 'proc_temp_filling', name: 'Temporary Filling', category: 'Restorative', defaultPrice: 800, defaultDurationMinutes: 30 },

  // C. Endodontics (Root Canals)
  { id: 'proc_rct_ant', name: 'Anterior Root Canal Therapy', category: 'Endodontics', defaultPrice: 8000, defaultDurationMinutes: 90, requiresImaging: true },
  { id: 'proc_rct_pre', name: 'Premolar Root Canal Therapy', category: 'Endodontics', defaultPrice: 10000, defaultDurationMinutes: 90, requiresImaging: true },
  { id: 'proc_rct_mol', name: 'Molar Root Canal Therapy', category: 'Endodontics', defaultPrice: 12000, defaultDurationMinutes: 120, requiresLeadApproval: true, requiresImaging: true },
  { id: 'proc_pulpotomy', name: 'Pulpotomy (Primary Tooth)', category: 'Endodontics', defaultPrice: 3500, defaultDurationMinutes: 60, requiresImaging: true },

  // D. Surgery & Extractions
  { id: 'proc_ext_simple', name: 'Simple Extraction (Uncomplicated)', category: 'Surgery', defaultPrice: 1500, defaultDurationMinutes: 30, requiresImaging: true },
  { id: 'proc_ext_surg', name: 'Surgical Extraction (Complicated/Erupted)', category: 'Surgery', defaultPrice: 5000, defaultDurationMinutes: 60, requiresLeadApproval: true, requiresImaging: true },
  { id: 'proc_ext_imp', name: 'Surgical Extraction (Wisdom Tooth/Impacted)', category: 'Surgery', defaultPrice: 12000, defaultDurationMinutes: 90, requiresLeadApproval: true, requiresImaging: true },

  // E. Prosthodontics (Crowns, Bridges, Dentures)
  { id: 'proc_crown_pfm', name: 'Porcelain-Fused-to-Metal Crown', category: 'Prosthodontics', defaultPrice: 15000, defaultDurationMinutes: 60, requiresImaging: true },
  { id: 'proc_crown_zirc', name: 'Zirconia Crown (High Translucency)', category: 'Prosthodontics', defaultPrice: 25000, defaultDurationMinutes: 60, requiresLeadApproval: true, requiresImaging: true },
  { id: 'proc_bridge_3u_pfm', name: '3-Unit Bridge (PFM)', category: 'Prosthodontics', defaultPrice: 45000, defaultDurationMinutes: 120, requiresLeadApproval: true, requiresImaging: true },
  { id: 'proc_denture_comp', name: 'Complete Denture (per arch)', category: 'Prosthodontics', defaultPrice: 20000, defaultDurationMinutes: 60 },
];

const DEFAULT_MEDICATIONS: Medication[] = [
    // Analgesics
    { id: 'med_01', genericName: 'Mefenamic Acid', dosage: '250mg Capsule', instructions: 'Take 2 capsules now, then 1 capsule every 6 hours as needed for pain.', drugClassification: 'Rx' },
    { id: 'med_02', genericName: 'Mefenamic Acid', dosage: '500mg Tablet', instructions: 'Take 1 tablet now, then 1 tablet every 6 hours as needed for pain.', drugClassification: 'Rx' },
    { id: 'med_03', genericName: 'Ibuprofen', dosage: '200mg Tablet', instructions: 'Take 1-2 tablets every 4-6 hours with food as needed for pain.', drugClassification: 'OTC' },
    { id: 'med_04', genericName: 'Ibuprofen', dosage: '400mg Tablet', instructions: 'Take 1 tablet every 4-6 hours with food as needed for pain.', drugClassification: 'OTC' },
    { id: 'med_05', genericName: 'Celecoxib', dosage: '200mg Capsule', instructions: 'Take 1 capsule twice a day as needed for pain.', drugClassification: 'Rx' },
    { id: 'med_06', genericName: 'Paracetamol', brandName: 'Acetaminophen', dosage: '500mg Tablet', instructions: 'Take 1-2 tablets every 4-6 hours as needed. Do not exceed 8 tablets in 24 hours.', drugClassification: 'OTC' },
    // Antibiotics
    { id: 'med_07', genericName: 'Amoxicillin', dosage: '500mg Capsule', instructions: 'Take 1 capsule every 8 hours for 7 days.', contraindicatedAllergies: ['Penicillin'], drugClassification: 'Rx' },
    { id: 'med_08', genericName: 'Amoxicillin + Clavulanic Acid', brandName: 'Co-Amoxiclav', dosage: '625mg Tablet', instructions: 'Take 1 tablet every 12 hours for 7 days.', contraindicatedAllergies: ['Penicillin'], drugClassification: 'Rx' },
    { id: 'med_09', genericName: 'Clindamycin', dosage: '300mg Capsule', instructions: 'Take 1 capsule every 6 hours for 7 days.', drugClassification: 'Rx' },
    { id: 'med_10', genericName: 'Azithromycin', dosage: '500mg Tablet', instructions: 'Take 1 tablet once a day for 3 days.', drugClassification: 'Rx' },
    { id: 'med_11', genericName: 'Metronidazole', dosage: '500mg Tablet', instructions: 'Take 1 tablet every 8 hours for 7 days.', drugClassification: 'Rx' },
    // Steroids
    { id: 'med_12', genericName: 'Dexamethasone', dosage: '4mg Tablet', instructions: 'Take 1 tablet once a day for 3 days to manage severe inflammation.', drugClassification: 'Rx' },
    { id: 'med_13', genericName: 'Triamcinolone Acetonide in Orabase', brandName: 'Kenalog', dosage: '0.1% Ointment', instructions: 'Apply a thin film to the affected area (e.g., mouth ulcer) after meals and at bedtime.', drugClassification: 'Rx' },
    // Anxiolytics
    { id: 'med_14', genericName: 'Diazepam', dosage: '5mg Tablet', instructions: 'Take 1 tablet one hour before the dental appointment.', isS2Controlled: true, drugClassification: 'S2-Controlled' },
    // Rinses
    { id: 'med_15', genericName: 'Chlorhexidine Gluconate Mouthwash', dosage: '0.12% Solution', instructions: 'Rinse with 15mL for 30 seconds twice daily after brushing. Do not swallow.', drugClassification: 'Rx' },
    { id: 'med_16', genericName: 'Povidone-Iodine Mouthwash', dosage: '1% Solution', instructions: 'Dilute with an equal amount of water and rinse for 30 seconds before the procedure.', drugClassification: 'OTC' },
];

export const DEFAULT_SMS_TEMPLATES: SmsTemplates = {
    'appointment_reminder': { id: 'appointment_reminder', label: 'Appointment Reminder', text: 'Hi {PatientName}, this is a reminder for your appointment at {ClinicName} on {Date} at {Time}. Please reply YES to confirm or call us to reschedule.', enabled: true, category: 'Logistics', triggerDescription: '24 hours before a scheduled appointment' },
    'post_op_checkin': { id: 'post_op_checkin', label: 'Post-Op Check-in', text: 'Hi {PatientName}, this is {ClinicName} checking in. We hope you are recovering well from your procedure. Please contact us if you have any concerns.', enabled: true, category: 'Recovery', triggerDescription: '24 hours after a surgical procedure' },
    'recall_due': { id: 'recall_due', label: 'Recall Due', text: 'Hi {PatientName}, our records show you are due for your regular dental check-up at {ClinicName}. Please call us to book your next visit. Thank you!', enabled: true, category: 'Reputation', triggerDescription: 'When a patient\'s recall status becomes "Due"' },
    'payment_receipt': { id: 'payment_receipt', label: 'Payment Receipt', text: 'Thank you for your payment of {Amount} at {ClinicName} on {Date}. Your new balance is {Balance}. Ref: {ORNumber}.', enabled: false, category: 'Financial', triggerDescription: 'After a payment with an official receipt is recorded' },
};

export const DEFAULT_SETTINGS: FieldSettings = {
  clinicName: 'dentsched',
  clinicProfile: 'corporate',
  strictMode: true,
  editBufferWindowMinutes: 5,
  sessionTimeoutMinutes: 30,
  civilStatus: ['Single', 'Married', 'Widowed', 'Separated'],
  sex: ['Male', 'Female'],
  suffixes: ['Jr.', 'Sr.', 'II', 'III', 'IV'],
  bloodGroups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  nationalities: ['Filipino', 'American', 'Chinese', 'Japanese', 'Korean'],
  religions: ['Roman Catholic', 'Christian', 'Muslim', 'Iglesia ni Cristo', 'Other'],
  relationshipTypes: ['Parent', 'Spouse', 'Sibling', 'Guardian', 'Other'],
  habitRegistry: ['Smoking', 'Vaping', 'Alcohol Consumption', 'Betel Nut Chewing', 'Bruxism'],
  documentCategories: ['Medical Clearance', 'Imaging Results', 'Informed Consent', 'Insurance Documents', 'PWD Certificate'],
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
  identityFields: [
      { id: 'field_header_name', label: 'Patient Name', type: 'header', section: 'IDENTITY' },
      { id: 'firstName', label: 'First Name', type: 'text', section: 'IDENTITY', isCore: true, patientKey: 'firstName', isRequired: true, width: 'third' },
      { id: 'middleName', label: 'Middle Name', type: 'text', section: 'IDENTITY', isCore: true, patientKey: 'middleName', width: 'third' },
      { id: 'surname', label: 'Surname', type: 'text', section: 'IDENTITY', isCore: true, patientKey: 'surname', isRequired: true, width: 'third' },
      { id: 'suffix', label: 'Suffix', type: 'dropdown', section: 'IDENTITY', isCore: true, patientKey: 'suffix', registryKey: 'suffixes', width: 'half' },
      { id: 'nickname', label: 'Nickname', type: 'text', section: 'IDENTITY', isCore: true, patientKey: 'nickname', width: 'half' },
      
      { id: 'field_header_demographics', label: 'Demographics', type: 'header', section: 'IDENTITY' },
      { id: 'dob', label: 'Date of Birth', type: 'date', section: 'IDENTITY', isCore: true, patientKey: 'dob', isRequired: true, width: 'half' },
      { id: 'age', label: 'Age', type: 'text', section: 'IDENTITY', isCore: true, width: 'half' },
      { id: 'sex', label: 'Sex', type: 'dropdown', section: 'IDENTITY', isCore: true, patientKey: 'sex', registryKey: 'sex', width: 'half' },
      { id: 'civilStatus', label: 'Civil Status', type: 'dropdown', section: 'IDENTITY', isCore: true, patientKey: 'civilStatus', registryKey: 'civilStatus', width: 'half' },
      { id: 'religion', label: 'Religion', type: 'dropdown', section: 'IDENTITY', isCore: true, patientKey: 'religion', registryKey: 'religions', width: 'half' },
      { id: 'nationality', label: 'Nationality', type: 'dropdown', section: 'IDENTITY', isCore: true, patientKey: 'nationality', registryKey: 'nationalities', width: 'half' },

      { id: 'field_header_contact', label: 'Contact Information', type: 'header', section: 'CONTACT' },
      { id: 'homeAddress', label: 'Home Address', type: 'text', section: 'CONTACT', isCore: true, patientKey: 'homeAddress', width: 'full' },
      { id: 'barangay', label: 'Barangay', type: 'text', section: 'CONTACT', isCore: true, patientKey: 'barangay', width: 'half' },
      { id: 'city', label: 'City', type: 'text', section: 'CONTACT', isCore: true, patientKey: 'city', width: 'half' },
      { id: 'homeNumber', label: 'Home No.', type: 'tel', section: 'CONTACT', isCore: true, patientKey: 'homeNumber', width: 'third' },
      { id: 'officeNumber', label: 'Office No.', type: 'tel', section: 'CONTACT', isCore: true, patientKey: 'officeNumber', width: 'third' },
      { id: 'faxNumber', label: 'Fax No.', type: 'tel', section: 'CONTACT', isCore: true, patientKey: 'faxNumber', width: 'third' },
      { id: 'phone', label: 'Mobile Number', type: 'tel', section: 'CONTACT', isCore: true, patientKey: 'phone', isRequired: true, width: 'half' },
      { id: 'email', label: 'Email Address', type: 'email', section: 'CONTACT', isCore: true, patientKey: 'email', width: 'half' },

      { id: 'field_header_occupation', label: 'Occupation', type: 'header', section: 'IDENTITY' },
      { id: 'occupation', label: 'Occupation', type: 'text', section: 'IDENTITY', isCore: true, patientKey: 'occupation', width: 'full' },
      
      { id: 'field_header_insurance', label: 'Insurance', type: 'header', section: 'IDENTITY' },
      { id: 'insuranceProvider', label: 'Insurance Provider', type: 'text', section: 'IDENTITY', isCore: true, patientKey: 'insuranceProvider', width: 'half' },
      { id: 'insuranceNumber', label: 'Insurance No.', type: 'text', section: 'IDENTITY', isCore: true, patientKey: 'insuranceNumber', width: 'half' },

      // Dental Section Fields
      { id: 'previousDentist', label: 'Previous Dentist', type: 'text', section: 'DENTAL', isCore: true, patientKey: 'previousDentist' },
      { id: 'lastDentalVisit', label: 'Last Dental Visit', type: 'date', section: 'DENTAL', isCore: true, patientKey: 'lastDentalVisit' },
      { id: 'chiefComplaint', label: 'Chief Complaint', type: 'textarea', section: 'DENTAL', isCore: true, patientKey: 'chiefComplaint', isRequired: true },

      // Medical Section Fields
      { id: 'physicianName', label: 'Name of Physician', type: 'text', section: 'MEDICAL', isCore: true, patientKey: 'physicianName' },
      { id: 'physicianSpecialty', label: 'Specialty', type: 'text', section: 'MEDICAL', isCore: true, patientKey: 'physicianSpecialty' },
      { id: 'physicianAddress', label: 'Office Address', type: 'text', section: 'MEDICAL', isCore: true, patientKey: 'physicianAddress' },
      { id: 'physicianNumber', label: 'Office Number', type: 'text', section: 'MEDICAL', isCore: true, patientKey: 'physicianNumber' },
      { id: 'bloodGroup', label: 'Blood Type', type: 'dropdown', section: 'MEDICAL', isCore: true, patientKey: 'bloodGroup', registryKey: 'bloodGroups' },
      { id: 'bloodPressure', label: 'Blood Pressure', type: 'text', section: 'MEDICAL', isCore: true, patientKey: 'bloodPressure' },
  ],
  fieldLabels: {},
  identityLayoutOrder: [
      'field_header_name',
      'core_firstName', 'core_middleName', 'core_surname', 'core_suffix',
      'core_nickname',
      'field_header_demographics',
      'core_dob', 'core_age', 'core_sex', 'core_civilStatus',
      'core_religion', 'core_nationality',
      'field_header_contact',
      'core_homeAddress', 'core_barangay', 'core_city',
      'core_homeNumber', 'core_officeNumber', 'core_faxNumber',
      'core_phone', 'core_email',
      'field_header_occupation',
      'core_occupation',
      'field_header_insurance',
      'core_insuranceProvider',
      'core_insuranceNumber',
  ],
  medicalLayoutOrder: [
      'core_physicianName', 'core_physicianSpecialty', 'core_physicianAddress', 'core_physicianNumber',
      'core_bloodGroup', 'core_bloodPressure',
      'Are you in good health?',
      'Are you under medical treatment now?*',
      'Have you ever had serious illness or surgical operation?*',
      'Have you ever been hospitalized?*',
      'Are you taking any prescription/non-prescription medication?*',
      'Do you use tobacco products?',
      'Do you use alcohol, cocaine or other dangerous drugs?',
      'Taking Blood Thinners? (Aspirin, Warfarin, etc.)',
      'Taking Bisphosphonates? (Fosamax, Zometa)',
      'al_None', 'al_Local Anesthetic (ex. Lidocaine)', 'al_Penicillin', 'al_Antibiotics', 'al_Sulfa drugs', 'al_Aspirin', 'al_Latex',
  ],
  dentalLayoutOrder: [
      'core_previousDentist',
      'core_lastDentalVisit',
      'core_chiefComplaint',
      'Are you anxious about dental treatment?',
      'Do your gums bleed when you brush?',
      'Do you have sensitive teeth (hot, cold, sweet)?',
      'Do you clench or grind your teeth?',
      'Have you had previous orthodontic treatment?',
      'Are you satisfied with the appearance of your teeth?'
  ],
  identityQuestionRegistry: [
    'Are you in good health?',
    'Are you under medical treatment now?*',
    'Have you ever had serious illness or surgical operation?*',
    'Have you ever been hospitalized?*',
    'Are you taking any prescription/non-prescription medication?*',
    'Do you use tobacco products?',
    'Do you use alcohol, cocaine or other dangerous drugs?',
  ],
  femaleQuestionRegistry: [
      'Are you pregnant?',
      'Are you nursing?',
      'Are you taking birth control pills?'
  ],
  medicalRiskRegistry: [
      'Taking Blood Thinners? (Aspirin, Warfarin, etc.)',
      'Taking Bisphosphonates? (Fosamax, Zometa)',
  ],
  dentalHistoryRegistry: [
      'Are you anxious about dental treatment?',
      'Do your gums bleed when you brush?',
      'Do you have sensitive teeth (hot, cold, sweet)?',
      'Do you clench or grind your teeth?',
      'Have you had previous orthodontic treatment?',
      'Are you satisfied with the appearance of your teeth?'
  ],
  criticalRiskRegistry: CRITICAL_CLEARANCE_CONDITIONS,
  procedures: DEFAULT_PROCEDURES,
  medications: DEFAULT_MEDICATIONS,
  shadeGuides: ['Vita Classical', 'Vita 3D Master'],
  restorativeMaterials: ['Composite', 'Amalgam', 'Glass Ionomer', 'Zirconia', 'EMax'],
  branches: ['Makati Main', 'Quezon City Satellite'],
  branchProfiles: MOCK_BRANCH_PROFILES,
  documentTemplates: DEFAULT_DOCUMENT_TEMPLATES,
  communicationTemplates: DEFAULT_COMMUNICATION_TEMPLATES,
  resources: [
      { id: 'res_chair_01', name: 'Chair 1', type: ResourceType.CHAIR, branch: 'Makati Main' },
      { id: 'res_chair_02', name: 'Chair 2', type: ResourceType.CHAIR, branch: 'Makati Main' },
      { id: 'res_chair_qc_01', name: 'QC Chair 1', type: ResourceType.CHAIR, branch: 'Quezon City Satellite' },
      { id: 'res_xray_01', name: 'Imaging Room', type: ResourceType.XRAY, branch: 'Makati Main' },
  ],
  assets: [],
  vendors: [
      { id: 'v1', name: 'Ceramix Dental Lab', type: 'Lab', contactPerson: 'John Lab', contactNumber: '0917-111-2222', email: 'lab@ceramix.ph', status: 'Active' },
      { id: 'v2', name: 'Global Dental Supplies', type: 'Supplier', contactPerson: 'Jane Supplier', contactNumber: '0917-333-4444', email: 'sales@globaldental.ph', status: 'Active' },
  ],
  hospitalAffiliations: [],
  smsTemplates: DEFAULT_SMS_TEMPLATES,
  smsConfig: {
    mode: 'CLOUD',
    isPollingEnabled: false, // Start on boot

    // Local server config
    gatewayUrl: 'http://192.168.1.188:8080', // Local Address
    publicAddress: 'http://175.158.219.123:8080',
    local_username: 'sms',
    local_password: '9EWSEOt4', 
    local_deviceId: '00000000768614ef0000019a',

    // Cloud server config
    cloudUrl: 'https://api.sms-gate.app:443', // Cloud Address
    cloud_username: 'CSAAHI',
    cloud_password: 'ypcsxllu442tha', 
    cloud_deviceId: 'obd9qcsflj8YkCkPgbxDS' 
  },
  consentFormTemplates: DEFAULT_CONSENT_FORM_TEMPLATES,
  smartPhrases: [],
  paymentModes: ['Cash', 'Credit Card', 'GCash', 'Bank Transfer'],
  taxConfig: { vatRate: 12, withholdingRate: 5, nextOrNumber: 1001 },
  features: { 
      enableLabTracking: true,
      enableComplianceAudit: true,
      enableMultiBranch: true,
      enableDentalAssistantFlow: true,
      enableInventory: true,
      inventoryComplexity: 'ADVANCED',
      enableAnalytics: true,
      enableDigitalConsent: true,
      enableAutomatedRecall: true,
      enableOnlineForms: true,
      enableEPrescription: true,
      enableAdvancedPermissions: true,
      enableLabPortal: false,
      enableDocumentManagement: true,
      enableClinicalProtocolAlerts: true,
      enableTreatmentPlanApprovals: true, 
      enableAccountabilityLog: true,
      enableReferralTracking: true,
      enablePromotions: false,
      enableSmsAutomation: true,
      enableMaterialTraceability: true,
      enableBirComplianceMode: true,
      enableStatutoryBirTrack: true, 
      enableDigitalDocent: true,
  },
  permissions: {},
  currentPrivacyVersion: '1.2',
  acknowledgedAlertIds: [],
  retentionPolicy: { archivalYears: 10, purgeYears: 15 },
  kioskSettings: { welcomeMessage: 'Welcome to our clinic!', privacyNotice: 'Your data is safe with us.'},
  instrumentSets: [
      { id: 'set1', name: 'Basic Exam Set', status: 'Sterile', branch: 'Makati Main' },
      { id: 'set2', name: 'Surgical Set', status: 'Used', branch: 'Makati Main' },
  ],
  sterilizationCycles: MOCK_STERILIZATION_CYCLES_INITIALIZED,
  stockItems: [],
  payrollAdjustmentTemplates: [
      { id: 'adj1', label: 'Perfect Attendance Bonus', type: 'Credit', category: 'Incentives', defaultAmount: 500 },
      { id: 'adj2', label: 'Tardiness Deduction', type: 'Debit', category: 'Attendance' },
  ],
  expenseCategories: ['Office Supplies', 'Utilities', 'Lab Fees', 'Rent', 'Salaries'],
  familyGroups: [
    { id: 'fam_scott_01', familyName: 'Scott-Schrute', headOfFamilyId: 'p_heavy_01', memberIds: ['p_heavy_01', 'p_fam_02'] }
  ],
  clinicalProtocolRules: [],
  savedViews: [],
  dataProtectionOfficerId: undefined,
  privacyImpactAssessments: [],
};

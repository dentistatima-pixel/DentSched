// Fix: Import ProcedureItem to explicitly type DEFAULT_PROCEDURES.
// Fix: Add CommunicationChannel to imports for type safety.
import { User, UserRole, Patient, Appointment, AppointmentStatus, LabStatus, FieldSettings, HMOClaim, HMOClaimStatus, StockItem, StockCategory, Expense, TreatmentPlanStatus, AuditLogEntry, SterilizationCycle, Vendor, SmsTemplates, ResourceType, ClinicResource, InstrumentSet, MaintenanceAsset, OperationalHours, SmsConfig, AuthorityLevel, PatientFile, ClearanceRequest, VerificationMethod, ProcedureItem, LicenseCategory, WaitlistEntry, FamilyGroup, CommunicationChannel, Branch, CommunicationTemplate, ConsentFormTemplate, RecallStatus, RegistrationStatus } from './types';

// Generators for mock data
export const generateUid = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

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
export const CRITICAL_CLEARANCE_CONDITIONS = ['High BP', 'Heart Disease', 'Diabetes', 'Bleeding Issues', 'High Blood Pressure', 'Taking Blood Thinners? (Aspirin, Warfarin, etc.)'];

// New mapping for procedure-specific consent forms
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
    { id: 'EXTRACTION', name: 'Removal of Teeth', content_en: "I understand that alternatives to tooth removal (root canal therapy, crowns & periodontal surgery, etc.) & I completely understand these alternatives, including their risk & benefits prior to authorizing the dentist to remove teeth & any other structures necessary for reasons above. I understand that removing teeth does not always remove all the infections, if present, & it may be necessary to have further treatment. I understand the risk involved in having teeth removed, such as pain, swelling, spread of infection, dry socket, fractured jaw, loss of feeling on the teeth, lips, tongue & surrounding tissue that can last for an indefinite period of time. I understand that I may need further treatment under a specialist if complications arise during or following treatment.", content_tl: "[Pagsasalin sa Tagalog]: Nauunawaan ko ang mga alternatibo sa pagbunot ng ngipin (root canal therapy, korona at periodontal surgery, atbp.) at lubos kong nauunawaan ang mga alternatibong ito, kabilang ang kanilang mga panganib at benepisyo bago pahintulutan ang dentista na bunutin ang mga ngipin at anumang iba pang mga istraktura na kinakailangan para sa mga dahilan sa itaas. Nauunawaan ko na ang pagbunot ng mga ngipin ay hindi palaging nag-aalis ng lahat ng impeksyon, kung mayroon, at maaaring kailanganin na magkaroon ng karagdagang paggamot. Nauunawaan ko ang mga panganib na kasangkot sa pagbunot ng ngipin, tulad ng sakit, pamamaga, pagkalat ng impeksyon, dry socket, bali ng panga, pagkawala ng pakiramdam sa ngipin, labi, dila at nakapaligid na tisyu na maaaring tumagal nang walang katiyakan. Nauunawaan ko na maaaring kailanganin ko ng karagdagang paggamot sa ilalim ng isang espesyalista kung magkakaroon ng mga komplikasyon sa panahon o pagkatapos ng paggamot." },
    { id: 'CROWNS_BRIDGES', name: 'Crowns, Caps & Bridges', content_en: "Preparing a tooth may irritate the nerve tissue in the center of the tooth, leaving the tooth extra sensitive to heat, cold & pressure. Treating such irritation may involve using special toothpastes, mouth rinses or root canal therapy. I understand that sometimes it is not possible to match the color of natural teeth exactly with artificial teeth. I further understand that I may be wearing temporary crowns, which may come off easily & that I must be careful to ensure that they are kept on until the permanent crowns are delivered. It is my responsibility to return for permanent cementation within 20 days from tooth preparation, as excessive days delay may allow for tooth movement, which may necessitate a remake of the crown, bridge/ cap. I understand there will be additional charges for remakes due to my delaying of permanent cementation, & I realize that final opportunity to make changes in my new crown, bridges or cap (including shape, fit, size, & color) will be before permanent cementation.", content_tl: "[Pagsasalin sa Tagalog]: Ang paghahanda ng ngipin ay maaaring makairita sa tisyu ng nerbiyos sa gitna ng ngipin, na nag-iiwan sa ngipin na sobrang sensitibo sa init, lamig at presyon. Ang paggamot sa naturang pangangati ay maaaring kasangkot sa paggamit ng mga espesyal na toothpaste, mouth rinses o root canal therapy. Nauunawaan ko na kung minsan ay hindi posible na eksaktong tumugma sa kulay ng mga natural na ngipin sa mga artipisiyal na ngipin. Higit pa rito, nauunawaan ko na maaaring ako ay nagsusuot ng mga pansamantalang korona, na maaaring madaling matanggal at dapat akong mag-ingat upang matiyaky na mananatili ang mga ito hanggang sa maihatid ang mga permanenteng korona. Responsibilidad kong bumalik para sa permanenteng sementasyon sa loob ng 20 araw mula sa paghahanda ng ngipin, dahil ang labis na araw ng pagkaantala ay maaaring magbigay-daan para sa paggalaw ng ngipin, na maaaring mangailangan ng muling paggawa ng korona, tulay/ takip. Nauunawaan ko na magkakaroon ng mga karagdagang singil para sa muling paggawa dahil sa aking pagkaantala ng permanenteng sementasyon, at napagtanto ko na ang huling pagkakataon na gumawa ng mga pagbabago sa aking bagong korona, tulay o takip (kabilang ang hugis, sukat, laki, at kulay) ay bago ang permanenteng sementasyon." },
    { id: 'ROOT_CANAL', name: 'Endodontics (Root Canal)', content_en: "I understand there is no guarantee that a root canal treatment will save a tooth & that complications can occur from the treatment & that occasionally root canal filling materials may extend through the tooth which does not necessarily effect the success of the treatment. I understand that endodontic files & drills are very fine instruments & stresses vented in their manufacture & calcifications present in teeth can cause them to break during use. I understand that referral to the endodontist for additional treatments may be necessary following any root canal treatment & I agree that I am responsible for any additional cost for treatment performed by the endodontist. I understand that a tooth may require removal in spite of all efforts to save it.", content_tl: "[Pagsasalin sa Tagalog]: Nauunawaan ko na walang garantiya na ang isang root canal treatment ay makakapagligtas sa isang ngipin at maaaring magkaroon ng mga komplikasyon mula sa paggamot at na paminsan-minsan ang mga materyales sa pagpuno ng root canal ay maaaring lumampas sa ngipin na hindi kinakailangang makaapekto sa tagumpay ng paggamot. Nauunawaan ko na ang mga endodontic file at drill ay napakapinong mga instrumento at ang mga stress na ibinubuga sa kanilang paggawa at mga calcification na naroroon sa mga ngipin ay maaaring maging sanhi ng pagkasira nito sa panahon ng paggamit. Nauunawaan ko na ang referral sa endodontist para sa mga karagdagang paggamot ay maaaring kailanganin kasunod ng anumang root canal treatment at sumasang-ayon ako na ako ang may pananagutan para sa anumang karagdagang gastos para sa paggamot na ginawa ng endodontist. Nauunawaan ko na ang isang ngipin ay maaaring kailanganing tanggalin sa kabila ng lahat ng pagsisikap na iligtas ito." },
    { id: 'PERIODONTAL', name: 'Periodontal Disease', content_en: "I understand that periodontal disease is a serious condition causing gum & bone inflammation &/or loss & that can lead eventually to the loss of my teeth. I understand the alternative treatment plans to correct periodontal disease, including gum surgery tooth extractions with or without replacement. I understand that undertaking any dental procedures may have future adverse effect on my periodontal Conditions.", content_tl: "[Pagsasalin sa Tagalog]: Nauunawaan ko na ang periodontal disease ay isang seryesong kondisyon na nagdudulot ng pamamaga at/o pagkawala ng gilagid at buto at maaaring humantong sa pagkawala ng aking mga ngipin. Nauunawaan ko ang mga alternatibong plano sa paggamot upang itama ang periodontal disease, kabilang ang operasyon sa gilagid, pagbunot ng ngipin na mayroon o walang kapalit. Nauunawaan ko na ang pagsasagawa ng anumang mga pamamaraan sa ngipin ay maaaring magkaroon ng masamang epekto sa hinaharap sa aking mga kondisyon sa periodontal." },
    { id: 'FILLINGS', name: 'Fillings', content_en: "I understand that care must be exercised in chewing on fillings, especially during the first 24 hours to avoid breakage. I understand that a more extensive filling or a crown may be required, as additional decay or fracture may become evident after initial excavation. I understand that significant sensitivity is a common, but usually temporary, after-effect of a newly placed filling. I further understand that filling a tooth may irritate the nerve tissue creating sensitivity & treating such sensitivity could require root canal therapy or extractions.", content_tl: "[Pagsasalin sa Tagalog]: Nauunawaan ko na dapat mag-ingat sa pagnguya sa mga pasta, lalo na sa unang 24 na oras upang maiwasan ang pagkasira. Nauunawaan ko na maaaring kailanganin ang isang mas malawak na pasta o korona, dahil maaaring maging malinaw ang karagdagang pagkabulok o bali pagkatapos ng paunang paghuhukay. Nauunawaan ko na ang makabuluhang pagiging sensitibo ay isang karaniwan, ngunit kadalasang pansamantala, na epekto pagkatapos ng isang bagong inilagay na pasta. Higit pa rito, nauunawaan ko na ang pagpasta sa isang ngipin ay maaaring makairita sa tisyu ng nerbiyos na lumilikha ng pagiging sensitibo at ang paggamot sa naturang pagiging sensitibo ay maaaring mangailangan ng root canal therapy o pagbunot." },
    { id: 'DENTURES', name: 'Dentures', content_en: "I understand that wearing of dentures can be difficult. Sore spots, altered speech & difficulty in eating are common problems. Immediate dentures (placement of denture immediately after extractions) may be painful. Immediate dentures may require considerable adjusting & several relines. I understand that it is my responsibility to return for delivery of dentures. I understand that failure to keep my delivery appointment may result in poorly fitted dentures. If a remake is required due to my delays of more than 30 days, there will be additional charges. A permanent reline will be needed later, which is not included in the initial fee. I understand that all adjustment or alterations of any kind after this initial period is subject to charges.", content_tl: "[Pagsasalin sa Tagalog]: Nauunawaan ko na ang pagsusuot ng pustiso ay maaaring mahirap. Ang mga masakit na bahagi, nabagong pagsasalita at kahirapan sa pagkain ay mga karaniwang problema. Ang mga agarang pustiso (paglalagay ng pustiso kaagad pagkatapos ng pagbunot) ay maaaring masakit. Ang mga agarang pustiso ay maaaring mangailangan ng malaking pagsasaayos at ilang reline. Nauunawaan ko na responsibilidad kong bumalik para sa paghahatid ng pustiso. Nauunawaan ko na ang hindi pagtupad sa aking appointment sa paghahatid ay maaaring magresulta sa hindi magandang pagkakalagay ng pustiso. Kung kinakailangan ang muling paggawa dahil sa aking mga pagkaantala ng higit sa 30 araw, magkakaroon ng mga karagdagang singil. Kakailanganin ang isang permanenteng reline sa kalaunan, na hindi kasama sa paunang bayad. Nauunawaan ko na ang lahat ng pagsasaayos o pagbabago ng anumang uri pagkatapos ng paunang panahon na ito ay napapailalim sa mga singil." }
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
  }
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
        age: 17,
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
        dentalInsurance: 'Maxicare Dental Plan',
        insuranceEffectiveDate: '2023-01-01',
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
        dpaConsent: true, marketingConsent: true, practiceCommConsent: true, clinicalMediaConsent: true, thirdPartyDisclosureConsent: true, thirdPartyAttestation: true,
        philHealthPIN: '01-234567890-1',
        philHealthCategory: 'Dependent',
        philHealthMemberStatus: 'Active',
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
            { toothNumber: 16, date: getPastDateStr(10), pocketDepths: [3,4,3,3,4,3], recession: [1,1,1,1,1,1], bleeding: [false,true,false,false,true,false], mobility: 1 },
            { toothNumber: 36, date: getPastDateStr(10), pocketDepths: [5,4,5,4,4,5], recession: [2,1,2,1,1,2], bleeding: [true,true,true,true,true,true], mobility: 2 },
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
        id: 'p_heavy_01', name: 'Michael Scott', firstName: 'Michael', surname: 'Scott', insuranceProvider: 'Maxicare', dob: '1965-03-15', age: 59, sex: 'Male', phone: '0917-111-2222', email: 'm.scott@dunder.com', occupation: 'Regional Manager', lastVisit: getPastDateStr(2), nextVisit: getFutureDateStr(1), chiefComplaint: 'Checkup on my bridges.', notes: 'Very talkative. Loves jokes. Gag reflex.', currentBalance: 5000, recallStatus: RecallStatus.BOOKED,
        attendanceStats: { totalBooked: 10, completedCount: 9, noShowCount: 1, lateCancelCount: 0 }, reliabilityScore: 90,
        treatmentPlans: [{ id: 'tp1', patientId: 'p_heavy_01', name: 'Phase 1 - Urgent Care', createdAt: getTodayStr(), createdBy: 'Dr. Alexander Crentist', status: TreatmentPlanStatus.PENDING_REVIEW, reviewNotes: 'Please check #16 for fracture lines before proceeding.' }],
        ledger: [ {id: 'l1', date: getPastDateStr(30), description: 'Zirconia Crown', type: 'Charge', amount: 20000, balanceAfter: 20000}, {id: 'l2', date: getPastDateStr(29), description: 'GCash Payment', type: 'Payment', amount: 15000, balanceAfter: 5000} ],
        dentalChart: [ { id: 'dc1', toothNumber: 16, procedure: 'Zirconia Crown', status: 'Completed', date: getPastDateStr(30), price: 20000, planId: 'tp1' } ],
        familyGroupId: 'fam_scott_01',
        registrationStatus: RegistrationStatus.COMPLETE,
        communicationLog: [
          // Fix: Use CommunicationChannel enum for type safety.
          { id: 'comm1', timestamp: getPastDateStr(30), channel: CommunicationChannel.SYSTEM, authorId: 'system', authorName: 'System', content: 'Welcome to the practice, Michael!' },
          // Fix: Use CommunicationChannel enum for type safety.
          { id: 'comm2', timestamp: getPastDateStr(2), channel: CommunicationChannel.SMS, authorId: 'admin1', authorName: 'Sarah Connor', content: 'Appointment reminder for tomorrow at 10 AM.' }
        ]
    },
     {
        id: 'p_fam_02', name: 'Dwight Schrute', firstName: 'Dwight', surname: 'Schrute', dob: '1970-01-20', age: 54, sex: 'Male', phone: '0917-333-4444', email: 'd.schrute@dunder.com', lastVisit: getPastDateStr(365), nextVisit: null, currentBalance: 0, recallStatus: RecallStatus.OVERDUE,
        familyGroupId: 'fam_scott_01', attendanceStats: { totalBooked: 2, completedCount: 2, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_reliable_01', name: 'Eleanor Shellstrop', firstName: 'Eleanor', surname: 'Shellstrop', dob: '1988-10-25', age: 35, sex: 'Female', phone: '0917-123-4567', email: 'e.shell@thegood.place', lastVisit: getPastDateStr(180), nextVisit: null, currentBalance: 0, recallStatus: RecallStatus.DUE,
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
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_credit_03', name: 'Maria Clara', firstName: 'Maria', surname: 'Clara', dob: '1995-06-19', age: 29, sex: 'Female', phone: '0920-345-6789', email: 'm.clara@noli.me', lastVisit: getPastDateStr(45), nextVisit: null, currentBalance: 2500, recallStatus: RecallStatus.DUE,
        attendanceStats: { totalBooked: 3, completedCount: 3, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_surg_04', name: 'Juan Dela Cruz', firstName: 'Juan', surname: 'Dela Cruz', dob: '1990-01-01', age: 34, sex: 'Male', phone: '0921-456-7890', email: 'juan.dc@example.com', lastVisit: getPastDateStr(7), nextVisit: null, currentBalance: 0, recallStatus: RecallStatus.DUE,
        attendanceStats: { totalBooked: 6, completedCount: 6, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        dentalChart: [ { id: 'dc_surg1', toothNumber: 38, procedure: 'Surgical Extraction (Impacted/Wisdom Tooth)', status: 'Planned', date: getPastDateStr(7), price: 7500 } ],
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_pediatric_05', name: 'Tahani Al-Jamil', firstName: 'Tahani', surname: 'Al-Jamil', dob: '2014-09-01', age: 9, sex: 'Female', phone: '0922-567-8901', email: 'tahani.aj@thegood.place', lastVisit: getPastDateStr(120), nextVisit: null, currentBalance: 0, recallStatus: RecallStatus.DUE,
        guardianProfile: { legalName: 'Kamilah Al-Jamil', relationship: 'Mother', mobile: '0922-555-8888', authorityLevel: AuthorityLevel.FULL },
        attendanceStats: { totalBooked: 4, completedCount: 4, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_plan_06', name: 'Janet Della-Denunzio', firstName: 'Janet', surname: 'Della-Denunzio', dob: '1992-12-08', age: 31, sex: 'Female', phone: '0923-678-9012', email: 'janet@thegood.place', lastVisit: getPastDateStr(30), nextVisit: getFutureDateStr(30), currentBalance: 0, recallStatus: RecallStatus.BOOKED,
        treatmentPlans: [{ id: 'tp_janet', patientId: 'p_plan_06', name: 'Restorative Phase', createdAt: getPastDateStr(30), createdBy: 'Dr. Maria Clara', status: TreatmentPlanStatus.APPROVED }],
        dentalChart: [ { id: 'dc_janet1', toothNumber: 14, procedure: 'Composite Restoration (2 Surfaces)', status: 'Planned', date: getPastDateStr(30), price: 2000, planId: 'tp_janet' }, { id: 'dc_janet2', toothNumber: 25, procedure: 'Composite Restoration (1 Surface)', status: 'Planned', date: getPastDateStr(30), price: 1500, planId: 'tp_janet' } ],
        attendanceStats: { totalBooked: 7, completedCount: 7, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_unreliable_08', name: 'Jason Mendoza', firstName: 'Jason', surname: 'Mendoza', dob: '1993-07-22', age: 30, sex: 'Male', phone: '0925-890-1234', email: 'j.mendoza@thegood.place', lastVisit: getPastDateStr(200), nextVisit: null, currentBalance: 800, recallStatus: RecallStatus.OVERDUE, referredById: 'p_referrer_07',
        attendanceStats: { totalBooked: 10, completedCount: 4, noShowCount: 5, lateCancelCount: 1 }, reliabilityScore: 40,
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_referrer_07', name: 'Shawn Magtanggol', firstName: 'Shawn', surname: 'Magtanggol', dob: '1970-05-15', age: 54, sex: 'Male', phone: '0924-789-0123', email: 'shawn@thebad.place', lastVisit: getPastDateStr(5), nextVisit: null, currentBalance: 0, recallStatus: RecallStatus.DUE,
        attendanceStats: { totalBooked: 15, completedCount: 15, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_debt_09', name: 'Ronnie Runner', firstName: 'Ronnie', surname: 'Runner', dob: '1985-11-30', age: 38, sex: 'Male', phone: '0931-111-9999', email: 'r.runner@example.com', lastVisit: getPastDateStr(300), nextVisit: null, currentBalance: 15500, recallStatus: RecallStatus.OVERDUE,
        attendanceStats: { totalBooked: 9, completedCount: 7, noShowCount: 1, lateCancelCount: 1 }, reliabilityScore: 68,
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_archive_10', name: 'Mindy St. Claire', firstName: 'Mindy', surname: 'St. Claire', dob: '1975-02-18', age: 49, sex: 'Female', phone: '0932-222-8888', email: 'mindy@themedium.place', lastVisit: getPastDateStr(365 * 14), nextVisit: null, currentBalance: 0, recallStatus: RecallStatus.OVERDUE,
        attendanceStats: { totalBooked: 2, completedCount: 2, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_hmo_11', name: 'Derek Hofstetler', firstName: 'Derek', surname: 'Hofstetler', dob: '1998-08-08', age: 25, sex: 'Male', phone: '0933-333-7777', email: 'derek@thegood.place', lastVisit: getPastDateStr(60), nextVisit: null, currentBalance: 0, recallStatus: RecallStatus.DUE,
        insuranceProvider: 'Intellicare', philHealthPIN: '12-345678901-2', philHealthCategory: 'Direct Contributor',
        attendanceStats: { totalBooked: 3, completedCount: 3, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        registrationStatus: RegistrationStatus.COMPLETE,
    },
    {
        id: 'p_new_clean_12', name: 'Pillboi', firstName: 'Pillboi', surname: '', dob: '1999-03-03', age: 25, sex: 'Male', phone: '0945-444-6666', email: 'pillboi@thegood.place', lastVisit: 'First Visit', nextVisit: null, currentBalance: 0, recallStatus: RecallStatus.DUE,
        registrationStatus: RegistrationStatus.PROVISIONAL,
    },
    {
        id: 'p_full_perio_02', name: 'Sofia Reyes', firstName: 'Sofia', surname: 'Reyes', dob: '1991-04-10', age: 33, sex: 'Female', phone: '0919-987-6543', email: 'sofia.r@example.com', lastVisit: getPastDateStr(10), nextVisit: null, currentBalance: 0, recallStatus: RecallStatus.DUE,
        attendanceStats: { totalBooked: 8, completedCount: 8, noShowCount: 0, lateCancelCount: 0 }, reliabilityScore: 100,
        perioChart: [
            { toothNumber: 18, date: getPastDateStr(180), pocketDepths: [3,2,3,3,2,3], recession: [1,1,1,1,1,1], bleeding: [false,true,false,false,true,false], mobility: 0 },
            { toothNumber: 17, date: getPastDateStr(180), pocketDepths: [4,3,4,3,3,4], recession: [1,1,1,1,1,1], bleeding: [true,true,true,true,true,true], mobility: 1 },
            { toothNumber: 18, date: getPastDateStr(10), pocketDepths: [2,2,2,2,2,2], recession: [1,1,1,1,1,1], bleeding: [false,false,false,false,false,false], mobility: 0 },
            { toothNumber: 17, date: getPastDateStr(10), pocketDepths: [3,2,3,2,2,3], recession: [1,1,1,1,1,1], bleeding: [false,true,false,false,false,false], mobility: 0 },
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
    { id: 'apt_past_03', patientId: 'p_heavy_01', providerId: 'doc1', branch: 'Makati Main', date: getPastDateStr(7), time: '09:00', durationMinutes: 30, type: 'Consultation', status: AppointmentStatus.COMPLETED, recurrenceRule: 'weekly' },

    // Future appointments
    { id: 'apt_future_01', patientId: 'p_plan_06', providerId: 'doc2', branch: 'Quezon City Satellite', date: getFutureDateStr(7), time: '10:00', durationMinutes: 60, type: 'Composite Restoration (2 Surfaces)', status: AppointmentStatus.SCHEDULED },
    { id: 'apt_future_02', patientId: 'p_hmo_11', providerId: 'doc1', branch: 'Makati Main', date: getFutureDateStr(14), time: '16:00', durationMinutes: 60, type: 'Oral Prophylaxis (Light/Routine Cleaning)', status: AppointmentStatus.SCHEDULED },
    
    // Block time
    { id: 'apt_block_01', patientId: 'ADMIN_BLOCK', providerId: 'doc1', branch: 'Makati Main', date: getTodayStr(), time: '12:00', durationMinutes: 60, type: 'Clinical Block', isBlock: true, title: 'Staff Lunch', status: AppointmentStatus.SCHEDULED }
];

export const MOCK_WAITLIST: WaitlistEntry[] = [
    { id: 'wl_1', patientId: 'p_credit_03', patientName: 'Maria Clara', procedure: 'Restoration', durationMinutes: 60, priority: 'High', notes: 'Flexible anytime AM' },
    { id: 'wl_2', patientId: 'p_surg_04', patientName: 'Juan Dela Cruz', procedure: 'Extraction', durationMinutes: 30, priority: 'Normal', notes: 'Prefer afternoons' },
    { id: 'wl_3', patientId: 'p_full_perio_02', patientName: 'Sofia Reyes', procedure: 'Cleaning', durationMinutes: 45, priority: 'Low', notes: 'Short notice ok' },
    { id: 'wl_4', patientId: 'p_debt_09', patientName: 'Ronnie Runner', procedure: 'Root Canal', durationMinutes: 60, priority: 'High', notes: 'Emergency opening requested' },
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
    { id: 'exp_1', date: getPastDateStr(1), category: 'Lab Fee', description: 'Crown for M. Scott', amount: 4000, branch: 'Makati Main', staffId: 'doc1' },
    { id: 'exp_2', date: getPastDateStr(5), category: 'Dental Supplies (Consumables)', description: 'Order #4552 from Supplier', amount: 8500, branch: 'Makati Main', receiptNumber: 'OR-12345', supplierTIN: '123-456-789-000' }
];

export const MOCK_AUDIT_LOG: AuditLogEntry[] = [
    { id: 'al1', timestamp: new Date().toISOString(), userId: 'admin1', userName: 'Sarah Connor', action: 'LOGIN', entity: 'System', entityId: 'System', details: 'System Initialized.' }
];

export const MOCK_AUDIT_LOG_INITIALIZED: AuditLogEntry[] = MOCK_AUDIT_LOG;

export const MOCK_VENDORS: Vendor[] = [
    { id: 'v1', name: 'Precision Dental Lab', type: 'Lab', contactPerson: 'John Smith', contactNumber: '0917-123-4567', email: 'orders@precisionlab.ph', status: 'Active', dsaSignedDate: getPastDateStr(365), dsaExpiryDate: getFutureDateStr(365) },
    { id: 'v2', name: 'Intellicare', type: 'HMO', contactPerson: 'Jane Doe', contactNumber: '0918-987-6543', email: 'claims@intellicare.com.ph', status: 'Active', priceBookId: 'pb_hmo_1' }
];

const DEFAULT_SMS: SmsTemplates = {
    // Onboarding & Patient Management
    welcome: { id: 'welcome', label: 'Welcome to Practice', text: 'Welcome to {ClinicName}, {PatientName}! Your digital health record is now active.', enabled: true, category: 'Onboarding', triggerDescription: 'New patient registration.' },
    update_registration: { id: 'update_registration', label: 'Registration Updated', text: 'Hi {PatientName}, we have successfully updated your patient profile and medical records. Thank you for keeping your data current.', enabled: true, category: 'Efficiency', triggerDescription: 'Existing patient data update.' },
    yearly_data_verification: { id: 'yearly_data_verification', label: 'Yearly Data Verification', text: 'Hi {PatientName}, to ensure compliance with the Data Privacy Act, please tap this link to quickly verify or update your medical and personal information for the year: {Link}', enabled: true, category: 'Security', triggerDescription: 'Annual patient data verification request.' },
    
    // Appointments & Scheduling
    booking: { id: 'booking', label: 'Booking Confirmation', text: 'Confirmed: {Procedure} on {Date} @ {Time} with {Doctor}.', enabled: true, category: 'Logistics', triggerDescription: 'Appointment scheduled.' },
    appointment_reminder_24h: { id: 'appointment_reminder_24h', label: '24-Hour Reminder', text: 'Hi {PatientName}, this is a friendly reminder for your appointment tomorrow, {Date}, at {Time} with {Doctor}. If you need to reschedule, please call our clinic.', enabled: true, category: 'Logistics', triggerDescription: '24 hours before a scheduled appointment.' },
    reschedule: { id: 'reschedule', label: 'Reschedule Alert', text: 'Your session has been moved. New Slot: {Date} @ {Time}. See you then!', enabled: true, category: 'Logistics', triggerDescription: 'Appointment date/time changed.' },
    cancellation: { id: 'cancellation', label: 'Cancellation Confirmation', text: 'Your appointment for {Date} has been cancelled. We look forward to seeing you in the future.', enabled: true, category: 'Logistics', triggerDescription: 'Appointment status set to Cancelled.' },
    clinic_late: { id: 'clinic_late', label: 'Clinic Running Late', text: 'Hi {PatientName}, we are running slightly behind schedule at {ClinicName} today. We apologize for any inconvenience and appreciate your patience.', enabled: false, category: 'Logistics', triggerDescription: 'Manual trigger by front-desk for delays.' },
    ready_to_seat: { id: 'ready_to_seat', label: 'Ready to be Seated', text: 'Hi {PatientName}, we\'re ready for you! Please proceed to the reception desk to be seated for your appointment.', enabled: false, category: 'Logistics', triggerDescription: 'When patient is next in line from waiting room.' },
    missed_appointment: { id: 'missed_appointment', label: 'Missed Appointment', text: 'We missed you at your appointment today at {ClinicName}. Please call us at your earliest convenience to reschedule.', enabled: true, category: 'Logistics', triggerDescription: 'When appointment is marked as No-Show.' },
    waitlist_confirmation: { id: 'waitlist_confirmation', label: 'Waitlist Confirmation', text: 'You have been added to the waitlist at {ClinicName} for {Procedure}. We will notify you as soon as a slot that matches your preference becomes available.', enabled: true, category: 'Logistics', triggerDescription: 'Patient is added to the waitlist.' },
    waitlist_opening: { id: 'waitlist_opening', label: 'Waitlist Opening', text: 'Good news! A slot for {Procedure} has opened up at {ClinicName} on {Date} at {Time}. Please call us within the next hour if you would like to claim this appointment.', enabled: true, category: 'Logistics', triggerDescription: 'A suitable slot opens up for a waitlisted patient.' },
    
    // Clinical & Treatment
    treatment_signed: { id: 'treatment_signed', label: 'Clinical Note Receipt', text: 'Clinical Record Sealed: Your signature has been bound to today\'s session record for {Procedure}.', enabled: true, category: 'Safety', triggerDescription: 'Patient signs a clinical note.' },
    followup_1w: { id: 'followup_1w', label: '7-Day Post-Op Check', text: 'Hi {PatientName}, it has been a week since your {Procedure}. We hope you are healing well! Please call our clinic if you have any discomfort.', enabled: true, category: 'Recovery', triggerDescription: 'Automated 1-week follow-up after signed treatment.' },
    followup_1m: { id: 'followup_1m', label: '1-Month Wellness Check', text: 'Checking in: It has been a month since your {Procedure}. Don\'t forget to maintain good hygiene for lasting results!', enabled: true, category: 'Recovery', triggerDescription: 'Automated 1-month follow-up.' },
    followup_3m: { id: 'followup_3m', label: '3-Month Recall Preparation', text: 'Time flies! It has been 3 months since your last major procedure. We recommend a cleaning soon to protect your investment.', enabled: true, category: 'Recovery', triggerDescription: 'Automated 3-month follow-up.' },
    medical_clearance: { id: 'medical_clearance', label: 'Medical Clearance Request', text: 'Action Required: Your dentist requests medical clearance from your {Provider} specialist for your upcoming procedure.', enabled: true, category: 'Safety', triggerDescription: 'Practitioner requests physician clearance.' },
    lab_delay: { id: 'lab_delay', label: 'Laboratory Set Delay', text: 'Service Update: The lab set for your {Procedure} has been delayed. Please await further notice before visiting.', enabled: true, category: 'Logistics', triggerDescription: 'Lab status set to Delayed.' },
    lab_received: { id: 'lab_received', label: 'Lab Case Received', text: 'Good news! Your lab work (e.g., crown, denture) for {Procedure} has arrived at {ClinicName}. Please call us to schedule your fitting appointment.', enabled: true, category: 'Logistics', triggerDescription: 'Lab case status is marked as Received.' },
    new_prescription: { id: 'new_prescription', label: 'e-Prescription Issued', text: 'Your e-prescription from {Doctor} for {Medication} has been issued. Please check your email or pick up a printed copy at the clinic.', enabled: true, category: 'Safety', triggerDescription: 'An e-prescription is generated for the patient.' },
    treatment_plan_review: { id: 'treatment_plan_review', label: 'Treatment Plan Ready', text: 'Hi {PatientName}, your proposed treatment plan is ready for your review. Please visit the clinic to discuss the details.', enabled: true, category: 'Efficiency', triggerDescription: 'A new treatment plan is created for the patient.' },

    // Financial & Billing
    philhealth_status: { id: 'philhealth_status', label: 'PhilHealth Claim Update', text: 'PhilHealth Update: Your claim for {Procedure} is now {Provider}.', enabled: true, category: 'Financial', triggerDescription: 'PhilHealth claim status transition.' },
    hmo_claim_update: { id: 'hmo_claim_update', label: 'HMO Claim Update', text: 'HMO Update for {PatientName}: Your claim with {HMOProvider} for {Procedure} is now {Status}.', enabled: true, category: 'Financial', triggerDescription: 'HMO claim status is updated.' },
    payment_receipt: { id: 'payment_receipt', label: 'Payment Receipt', text: 'Thank you for your payment of {Amount} to {ClinicName} on {Date}. Your new balance is {Balance}. OR #: {ORNumber}', enabled: true, category: 'Financial', triggerDescription: 'A payment is recorded in the patient ledger.' },
    overdue_balance: { id: 'overdue_balance', label: 'Overdue Balance Reminder', text: 'Hi {PatientName}, a friendly reminder from {ClinicName} that you have an outstanding balance of {Balance}. Please contact us to settle your account.', enabled: true, category: 'Financial', triggerDescription: 'Patient has an overdue balance.' },
    installment_due: { id: 'installment_due', label: 'Installment Due Reminder', text: 'Hi {PatientName}, your monthly installment of {Amount} for your treatment plan is due on {DueDate}. Thank you.', enabled: true, category: 'Financial', triggerDescription: 'An installment plan payment is due soon.' },
    
    // Reputation & Patient Engagement
    referral_thanks: { id: 'referral_thanks', label: 'Referral Thank You', text: 'Thank you {PatientName}! We noticed you referred a new patient to our practice. We appreciate your trust!', enabled: true, category: 'Reputation', triggerDescription: 'New patient lists this patient as referral source.' },
    recall_prophylaxis: { id: 'recall_prophylaxis', label: 'Recall/Prophylaxis Reminder', text: 'Hi {PatientName}, it\'s time for your regular 6-month check-up and cleaning at {ClinicName}. Maintaining your oral health is key! Call us to book your visit.', enabled: true, category: 'Reputation', triggerDescription: 'Patient is due for their 6-month recall.' },
    post_visit_feedback: { id: 'post_visit_feedback', label: 'Post-Visit Feedback', text: 'Thank you for visiting {ClinicName} today. We\'d love to hear about your experience! Please take a moment to leave us a review: {Link}', enabled: true, category: 'Reputation', triggerDescription: 'Sent after an appointment is completed.' },
    birthday_greeting: { id: 'birthday_greeting', label: 'Birthday Greeting', text: 'The team at {ClinicName} wishes you a very happy birthday, {PatientName}! We hope you have a fantastic day.', enabled: true, category: 'Reputation', triggerDescription: 'On the patient\'s birthday.' },
};

const DEFAULT_SMS_CONFIG: SmsConfig = {
    mode: 'LOCAL',
    isPollingEnabled: false,

    // Local server config
    gatewayUrl: '192.168.1.188:8080',
    publicAddress: '175.158.219.112:8080',
    local_username: 'sms',
    local_password: '9EWSEOt4',
    local_deviceId: '00000000768614ef0000019a',

    // Cloud server config
    cloudUrl: 'api.sms-gate.app:443',
    cloud_username: 'CSAAHI',
    cloud_password: 'ypcsxllu442tha',
    cloud_deviceId: 'obd9qcsflj8YkCkPgbxDS'
};

// Fix: Explicitly type as ProcedureItem[] to ensure type compatibility.
const DEFAULT_PROCEDURES: ProcedureItem[] = [
    // I. Diags & Prev
    { id: 'proc_01', name: 'Initial Consultation & Examination', category: 'Diags & Prev', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_02', name: 'Digital Periapical X-Ray (per shot)', category: 'Diags & Prev', requiresXray: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_03', name: 'Panoramic X-Ray (OPG)', category: 'Diags & Prev', requiresXray: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_04', name: 'Cephalometric X-Ray', category: 'Diags & Prev', requiresXray: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_05', name: 'Oral Prophylaxis (Light/Routine Cleaning)', category: 'Diags & Prev', allowedLicenseCategories: ['DENTIST', 'HYGIENIST'] },
    { id: 'proc_06', name: 'Oral Prophylaxis (Heavy w/ Stain Removal)', category: 'Diags & Prev', allowedLicenseCategories: ['DENTIST', 'HYGIENIST'] },
    { id: 'proc_07', name: 'Topical Fluoride Application', category: 'Diags & Prev', allowedLicenseCategories: ['DENTIST', 'HYGIENIST'] },
    { id: 'proc_08', name: 'Pit and Fissure Sealant (per tooth)', category: 'Diags & Prev', allowedLicenseCategories: ['DENTIST'] },

    // II. Restorative
    { id: 'proc_09', name: 'Composite Restoration (1 Surface)', category: 'Restorative', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_10', name: 'Composite Restoration (2 Surfaces)', category: 'Restorative', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_11', name: 'Composite Restoration (3+ Surfaces/Build-up)', category: 'Restorative', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_12', name: 'Temporary Filling (IRM/GIC)', category: 'Restorative', allowedLicenseCategories: ['DENTIST'] },
    
    // III. Endodontics
    { id: 'proc_13', name: 'Root Canal Treatment (Anterior Tooth)', category: 'Endodontics', requiresXray: true, requiresConsent: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_14', name: 'Root Canal Treatment (Premolar)', category: 'Endodontics', requiresXray: true, requiresConsent: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_15', name: 'Root Canal Treatment (Molar)', category: 'Endodontics', requiresXray: true, requiresConsent: true, allowedLicenseCategories: ['DENTIST'] },

    // IV. Periodontics
    { id: 'proc_16', name: 'Deep Scaling & Root Planing (per quadrant)', category: 'Periodontics', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_17', name: 'Gingivectomy (per quadrant)', category: 'Periodontics', requiresConsent: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_18', name: 'Frenectomy (Lingual or Labial)', category: 'Periodontics', requiresConsent: true, requiresWitness: true, allowedLicenseCategories: ['DENTIST'] },
    
    // V. Prosthodontics
    { id: 'proc_19', name: 'PFM (Porcelain Fused to Metal) Crown', category: 'Prosthodontics', requiresXray: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_20', name: 'IPS E.max (All-Porcelain) Crown', category: 'Prosthodontics', requiresXray: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_21', name: 'Zirconia Crown (High Translucency)', category: 'Prosthodontics', requiresXray: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_22', name: 'Porcelain Veneer', category: 'Prosthodontics', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_23', name: 'Fixed Bridge (per unit)', category: 'Prosthodontics', requiresXray: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_24', name: 'Full Denture (Acrylic, per arch)', category: 'Prosthodontics', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_25', name: 'Partial Denture (Flexible, Valplast)', category: 'Prosthodontics', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_26', name: 'Denture Repair / Relining', category: 'Prosthodontics', allowedLicenseCategories: ['DENTIST'] },
    
    // VI. Oral Surgery
    { id: 'proc_27', name: 'Simple Extraction (Erupted Tooth)', category: 'Oral Surgery', requiresConsent: true, requiresWitness: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_28', name: 'Complicated Extraction (Requires sectioning)', category: 'Oral Surgery', requiresXray: true, requiresConsent: true, requiresWitness: true, allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_29', name: 'Surgical Extraction (Wisdom Tooth/Impacted)', category: 'Oral Surgery', requiresXray: true, requiresConsent: true, requiresWitness: true, allowedLicenseCategories: ['DENTIST'] },
    
    // VII. Orthodontics
    { id: 'proc_30', name: 'Comprehensive Orthodontic Treatment (Braces Package)', category: 'Orthodontics', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_31', name: 'Monthly Orthodontic Adjustment', category: 'Orthodontics', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_32', name: 'Hawley/Essix Retainers (per arch)', category: 'Orthodontics', allowedLicenseCategories: ['DENTIST'] },
    
    // VIII. Cosmetic
    { id: 'proc_33', name: 'In-Office Teeth Whitening', category: 'Cosmetic', allowedLicenseCategories: ['DENTIST'] },
    { id: 'proc_34', name: 'Take-Home Whitening Kit', category: 'Cosmetic', allowedLicenseCategories: ['DENTIST'] }
];

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
    { id: 'isPwd', label: 'Is the patient a Person with Disability (PWD)?', type: 'boolean', section: 'IDENTITY', width: 'full' },
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
      'core_dob', 'core_age', 'core_sex', 'core_civilStatus', 'field_isPwd',
      'field_nickname', 'field_religion', 'field_nationality', 'field_occupation',
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
  criticalRiskRegistry: CRITICAL_CLEARANCE_CONDITIONS,
  procedures: DEFAULT_PROCEDURES,
  medications: [
      { id: 'm1', genericName: 'Amoxicillin', brandName: 'Amoxil', dosage: '500mg', instructions: '1 capsule every 8 hours for 7 days', contraindicatedAllergies: ['Penicillin'] },
      { id: 'm2', genericName: 'Clindamycin', brandName: 'Dalacin C', dosage: '300mg', instructions: '1 capsule every 8 hours for 5 days' },
      { id: 'm3', genericName: 'Co-Amoxiclav', brandName: 'Augmentin', dosage: '625mg', instructions: '1 tablet every 12 hours for 7 days', contraindicatedAllergies: ['Penicillin'] },
      { id: 'm4', genericName: 'Mefenamic Acid', brandName: 'Ponstan', dosage: '500mg', instructions: '1 capsule every 8 hours as needed for pain' },
      { id: 'm5', genericName: 'Ibuprofen', brandName: 'Advil', dosage: '400mg', instructions: '1 tablet every 6 hours as needed for pain', interactions: ['Warfarin', 'Aspirin'] },
      { id: 'm6', genericName: 'Celecoxib', brandName: 'Celebrex', dosage: '200mg', instructions: '1 capsule every 12 hours for 3 to 5 days', interactions: ['Warfarin'] },
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
  permissions: {
      [UserRole.ADMIN]: { canVoidNotes: true, canEditFinancials: true, canDeletePatients: true, canOverrideProtocols: true, canOverrideMandatoryMedical: true, canManageInventory: true },
      [UserRole.DENTIST]: { canVoidNotes: false, canEditFinancials: false, canDeletePatients: false, canOverrideProtocols: false, canOverrideMandatoryMedical: false, canManageInventory: true },
      [UserRole.DENTAL_ASSISTANT]: { canVoidNotes: false, canEditFinancials: false, canDeletePatients: false, canOverrideProtocols: false, canOverrideMandatoryMedical: false, canManageInventory: true },
      [UserRole.SYSTEM_ARCHITECT]: { canVoidNotes: true, canEditFinancials: true, canDeletePatients: true, canOverrideProtocols: true, canOverrideMandatoryMedical: true, canManageInventory: true, canOverrideClinicalSafety: true }
  },
  currentPrivacyVersion: '1.0',
  acknowledgedAlertIds: [],
  retentionPolicy: { archivalYears: 10, purgeYears: 15 },
  kioskSettings: {
    welcomeMessage: 'Welcome to Ivory Dental. Please use this terminal to manage your patient record securely.',
    privacyNotice: 'Your data is protected under RA 10173. All entries are logged for security.'
  },
  instrumentSets: MOCK_INSTRUMENT_SETS,
  stockItems: MOCK_STOCK,
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
      'Staff Salaries & Benefits'
  ],
  branches: ['Makati Main', 'Quezon City Satellite', 'BGC Premium', 'Alabang South'],
  branchProfiles: MOCK_BRANCH_PROFILES,
  documentTemplates: DEFAULT_DOCUMENT_TEMPLATES,
  communicationTemplates: DEFAULT_COMMUNICATION_TEMPLATES,
  branchColors: {
    'Makati Main': '#0d9488', // teal-600
    'Quezon City Satellite': '#86198f', // lilac-700
    'BGC Premium': '#fbbf24', // amber-400
    'Alabang South': '#dc2626' // red-600
  },
  resources: MOCK_RESOURCES,
  assets: MOCK_ASSETS,
  vendors: MOCK_VENDORS,
  hospitalAffiliations: [
      { id: 'h1', name: 'St. Lukes Medical Center', location: 'Global City', hotline: '02-8789-7700' },
      { id: 'h2', name: 'Makati Medical Center', location: 'Makati', hotline: '02-8888-8999' }
  ],
  smsTemplates: DEFAULT_SMS,
  smsConfig: DEFAULT_SMS_CONFIG,
  consentFormTemplates: DEFAULT_CONSENT_FORM_TEMPLATES,
  smartPhrases: [
      { id: 'sp1', label: 'Routine Checkup', s: 'Patient in for routine prophylaxis. No acute pain.', o: 'No significant findings on visual examination. Plaque and calculus present on posterior teeth.', a: 'Generalized gingivitis.', p: 'Performed oral prophylaxis. Provided oral hygiene instructions.' },
      { id: 'sp2', label: 'Simple Restoration', s: 'Patient reports sensitivity on upper right quadrant.', o: 'Visual inspection reveals caries on tooth #16 occlusal surface.', a: 'Occlusal caries, tooth #16.', p: 'Administered local anesthesia. Placed composite restoration on #16-O. Advised patient on post-op sensitivity.' }
  ],
  paymentModes: ['Cash', 'GCash', 'Maya', 'Bank Transfer', 'Credit Card', 'HMO Direct Payout', 'Check'],
  taxConfig: {
    vatRate: 12,
    withholdingRate: 10,
    nextOrNumber: 1001,
  },
  features: {
      enableLabTracking: true,
      enableComplianceAudit: true,
      enableMultiBranch: true,
      enableDentalAssistantFlow: true,
      enableHMOClaims: true,
      enableInventory: true,
      inventoryComplexity: 'SIMPLE',
      enableAnalytics: true,
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
      enableStatutoryBirTrack: true, 
      enableHmoInsuranceTrack: true,
      enableDigitalDocent: true,
  },
  practitionerDelays: { 'doc1': 15 }, // For Gap 10
  priceBooks: [
      { id: 'pb_1', name: 'Standard Clinic Price', isDefault: true },
      { id: 'pb_hmo_1', name: 'Intellicare HMO Rates' }
  ],
  priceBookEntries: [
    ...DEFAULT_PROCEDURES.map(p => ({
        priceBookId: 'pb_1',
        procedureId: p.id,
        price: Math.floor(Math.random() * 5000) + 1000 // Dummy prices for now
    })),
    ...DEFAULT_PROCEDURES.map(p => ({
        priceBookId: 'pb_hmo_1',
        procedureId: p.id,
        price: Math.floor((Math.floor(Math.random() * 5000) + 1000) * 0.8) // 20% discount for HMO
    }))
  ],
  familyGroups: [
      { id: 'fam_scott_01', familyName: 'Scott-Schrute Family', headOfFamilyId: 'p_heavy_01', memberIds: ['p_heavy_01', 'p_fam_02'] }
  ],
  clinicalProtocolRules: [
    { 
        id: 'rule_surg_clearance', 
        name: 'Surgical Clearance Protocol (PDA Rule 4)', 
        triggerProcedureCategories: ['Oral Surgery'], 
        requiresMedicalConditions: CRITICAL_CLEARANCE_CONDITIONS, 
        requiresDocumentCategory: 'Medical Clearance', 
        alertMessage: "REFERRAL HARD-STOP: Medical clearance is REQUIRED for a high-risk patient before any surgical procedure. No valid clearance found on file within the last 3 months."
    }
  ]
};
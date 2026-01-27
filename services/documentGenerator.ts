
import { Patient, User, FieldSettings, Appointment, AppointmentStatus } from '../types';
import { formatDate } from '../constants';

export const generatePatientDocument = (templateContent: string, patient: Patient, practitioner: User, settings: FieldSettings, appointments: Appointment[]): string => {
    let content = templateContent;

    // Smart Branch Detection Logic
    const lastCompletedAppointment = appointments
        .filter(a => a.patientId === patient.id && a.status === AppointmentStatus.COMPLETED)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    const activeBranchName = lastCompletedAppointment?.branch || patient.registrationBranch || practitioner.defaultBranch;
    const activeBranchProfile = settings.branchProfiles.find(b => b.name === activeBranchName);
    
    const clinicName = activeBranchProfile?.legalEntityName || settings.clinicName || '';
    const clinicAddress = activeBranchProfile?.address || '';
    const clinicContactNumber = activeBranchProfile?.contactNumber || '';
    const clinicEmail = activeBranchProfile?.email || '';
    const clinicTin = activeBranchProfile?.tinNumber || '';
    const clinicLogo = activeBranchProfile?.logoUrl || settings.clinicLogo || '';

    // Basic replacements
    content = content.replace(/{patientName}/g, patient.name || '');
    content = content.replace(/{patientAge}/g, patient.age?.toString() || '');
    content = content.replace(/{patientSex}/g, patient.sex || '');
    content = content.replace(/{patientAddress}/g, patient.homeAddress || '');
    content = content.replace(/{patientPhone}/g, patient.phone || '');
    content = content.replace(/{patientEmail}/g, patient.email || '');
    content = content.replace(/{patientDob}/g, formatDate(patient.dob) || '');
    content = content.replace(/{patientId}/g, patient.id || '');
    content = content.replace(/{patientBalance}/g, patient.currentBalance?.toLocaleString() || '0.00');
    content = content.replace(/{insuranceProvider}/g, patient.insuranceProvider || 'N/A');
    content = content.replace(/{insuranceNumber}/g, patient.insuranceNumber || 'N/A');
    content = content.replace(/{patientAllergies}/g, patient.allergies?.join(', ') || 'None');
    content = content.replace(/{patientMedicalConditions}/g, patient.medicalConditions?.join(', ') || 'None');
    content = content.replace(/{chiefComplaint}/g, patient.chiefComplaint || 'N/A');

    content = content.replace(/{practitionerName}/g, practitioner.name || '');
    content = content.replace(/{practitionerPrc}/g, practitioner.prcLicense || '');
    content = content.replace(/{practitionerSpecialty}/g, practitioner.specialization || '');
    content = content.replace(/{practitionerPtr}/g, practitioner.ptrNumber || '');
    content = content.replace(/{practitionerS2}/g, practitioner.s2License || '');

    // Branch-specific replacements
    content = content.replace(/{clinicName}/g, clinicName);
    content = content.replace(/{clinicAddress}/g, clinicAddress);
    content = content.replace(/{clinicContactNumber}/g, clinicContactNumber);
    content = content.replace(/{clinicEmail}/g, clinicEmail);
    content = content.replace(/{clinicTin}/g, clinicTin);
    if (clinicLogo) {
      content = content.replace(/{clinicLogo}/g, `![Clinic Logo](${clinicLogo})`);
    } else {
      content = content.replace(/{clinicLogo}/g, '');
    }

    content = content.replace(/{currentDate}/g, formatDate(new Date().toISOString()));

    // Complex replacements
    if (content.includes('{ledgerRows}')) {
        const rows = (patient.ledger || []).map(entry => 
            `| ${formatDate(entry.date)} | ${entry.description} | ${entry.type === 'Charge' ? entry.amount.toFixed(2) : ''} | ${entry.type === 'Payment' ? entry.amount.toFixed(2) : ''} | ${entry.balanceAfter.toFixed(2)} |`
        ).join('\n');
        content = content.replace('{ledgerRows}', rows);
    }
    
    // Placeholder for other complex fields
    // e.g., for treatment plan items, appointment details, etc.

    return content;
};


export const generateAdminReport = (templateContent: string, params: any, data: { patients: Patient[], appointments: Appointment[] }, settings: FieldSettings): string => {
    let content = templateContent;

    const today = new Date();
    const startDate = params.startDate || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const endDate = params.endDate || today.toISOString().split('T')[0];

    content = content.replace(/{currentDate}/g, formatDate(today.toISOString()));
    content = content.replace(/{startDate}/g, formatDate(startDate));
    content = content.replace(/{endDate}/g, formatDate(endDate));
    content = content.replace(/{branchName}/g, params.branchName || 'All Branches');

    if (content.includes('{totalProduction}')) {
        // Dummy data for now
        content = content.replace('{totalProduction}', '125,000.00');
    }
    if (content.includes('{totalCollections}')) {
        // Dummy data for now
        content = content.replace('{totalCollections}', '110,000.00');
    }
     if (content.includes('{patientsSeen}')) {
        content = content.replace('{patientsSeen}', '25');
    }
    if (content.includes('{newPatients}')) {
        content = content.replace('{newPatients}', '5');
    }
    if (content.includes('{noShows}')) {
        content = content.replace('{noShows}', '2');
    }

    if (content.includes('{agingRows}')) {
        const rows = data.patients
            .filter(p => (p.currentBalance || 0) > 500)
            .slice(0, 10)
            .map(p => `| ${p.name} | ${(p.currentBalance || 0).toFixed(2)} | ${Math.floor(Math.random() * 90)} |`)
            .join('\n');
        content = content.replace('{agingRows}', rows);
    }

    if (content.includes('{inventoryRows}')) {
        const rows = (settings.stockItems || [])
            .slice(0, 10)
            .map(item => `| ${item.name} | ${item.category} | ${item.quantity} | ${item.lowStockThreshold} | ${item.quantity <= item.lowStockThreshold ? 'LOW' : 'OK'} |`)
            .join('\n');
        content = content.replace('{inventoryRows}', rows);
    }

    return content;
};

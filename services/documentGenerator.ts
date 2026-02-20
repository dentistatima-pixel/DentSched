

import { Patient, User, FieldSettings, Appointment, AppointmentStatus, TreatmentPlan, DentalChartEntry } from '../types';
import { formatDate, calculateAge } from '../constants';

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
    content = content.replace(/{patientAge}/g, calculateAge(patient.dob)?.toString() || '');
    content = content.replace(/{patientSex}/g, patient.sex || '');
    content = content.replace(/{patientAddress}/g, patient.homeAddress || '');
    content = content.replace(/{patientPhone}/g, patient.phone || '');
    content = content.replace(/{patientEmail}/g, patient.email || '');
    content = content.replace(/{patientDob}/g, formatDate(patient.dob) || '');
    content = content.replace(/{patientId}/g, patient.id || '');
    content = content.replace(/{patientBalance}/g, patient.currentBalance?.toLocaleString() || '0.00');
    content = content.replace(/{insuranceProvider}/g, patient.insuranceProvider || 'N/A');
    content = content.replace(/{insuranceNumber}/g, patient.insuranceNumber || 'N/A');
    content = content.replace(/{patientAllergies}/g, patient.allergies?.join(', ') || 'None reported');
    content = content.replace(/{patientMedicalConditions}/g, patient.medicalConditions?.join(', ') || 'None reported');
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

    // Complex replacements for new consolidated templates
    if (content.includes('{patientInfoSection}')) {
        let infoSection = '| Field | Details |\n|---|---|\n';
        infoSection += `| **Name** | ${patient.name} |\n`;
        infoSection += `| **Date of Birth** | ${formatDate(patient.dob)} (${calculateAge(patient.dob)} years old) |\n`;
        infoSection += `| **Sex** | ${patient.sex || 'N/A'} |\n`;
        infoSection += `| **Civil Status** | ${patient.civilStatus || 'N/A'} |\n`;
        infoSection += `| **Mobile** | ${patient.phone} |\n`;
        infoSection += `| **Email** | ${patient.email || 'N/A'} |\n`;
        infoSection += `| **Address** | ${[patient.homeAddress, patient.barangay, patient.city].filter(Boolean).join(', ')} |\n`;
        infoSection += `| **Occupation** | ${patient.occupation || 'N/A'} |\n`;
        infoSection += `| **Insurance** | ${patient.insuranceProvider || 'N/A'} - ${patient.insuranceNumber || 'N/A'} |\n`;
        content = content.replace('{patientInfoSection}', infoSection);
    }
    
    const generateQuestionnaireMarkdown = (questionKeys: string[]) => {
      return questionKeys.map(q => {
          const answer = patient.registryAnswers?.[q] || 'Not Answered';
          let details = '';
          if (answer === 'Yes') {
              details = patient.registryAnswers?.[`${q}_details`] ? `\n  - **Details:** ${patient.registryAnswers[`${q}_details`]}` : '';
          }
          return `* **${q.replace('*','')}**: ${answer}${details}`;
      }).join('\n');
    };

    if (content.includes('{medicalQuestionnaire}')) {
      const medicalQuestions = settings.identityQuestionRegistry.concat(settings.medicalRiskRegistry, patient.sex === 'Female' ? settings.femaleQuestionRegistry : []);
      content = content.replace('{medicalQuestionnaire}', generateQuestionnaireMarkdown(medicalQuestions));
    }
    
    if (content.includes('{dentalQuestionnaire}')) {
      content = content.replace('{dentalQuestionnaire}', generateQuestionnaireMarkdown(settings.dentalHistoryRegistry));
    }
    
    if (content.includes('{consentsSection}')) {
        let consents = '';
        consents += `* **Data Privacy Act (RA 10173):** ${patient.dpaConsent ? 'Agreed' : 'Not Agreed'}\n`;
        consents += `* **General Treatment Authorization:** ${patient.clinicalMediaConsent?.generalConsent ? 'Agreed' : 'Not Agreed'}\n`;
        consents += `* **Marketing Communications:** ${patient.marketingConsent ? 'Agreed' : 'Not Agreed'}\n`;
        content = content.replace('{consentsSection}', consents);
    }

    content = content.replace(/{patientRegistrationDate}/g, formatDate(patient.registrationSignatureTimestamp) || 'N/A');
    content = content.replace(/{patientRegistrationSignatureTimestamp}/g, patient.registrationSignatureTimestamp ? new Date(patient.registrationSignatureTimestamp).toLocaleString() : 'N/A');
    content = content.replace(/{patientRegistrationSignature}/g, patient.registrationSignature || '');

    if (content.includes('{clinicalNotesLoop}')) {
        let notesLoop = '';
        const patientAppointments = appointments.filter(a => a.patientId === patient.id)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const notesByAppointment = (patient.dentalChart || []).reduce((acc, note) => {
            if (note.appointmentId) {
                if (!acc[note.appointmentId]) acc[note.appointmentId] = [];
                acc[note.appointmentId].push(note);
            }
            return acc;
        }, {} as Record<string, DentalChartEntry[]>);

        patientAppointments.forEach(apt => {
            notesLoop += `### Appointment: ${formatDate(apt.date)} @ ${apt.time}\n`;
            notesLoop += `**Procedure:** ${apt.type}\n`;
            notesLoop += `**Status:** ${apt.status}\n\n`;
            
            const notesForApt = notesByAppointment[apt.id] || [];
            if (notesForApt.length > 0) {
                notesForApt.forEach(note => {
                    notesLoop += `**SOAP Note (Tooth #${note.toothNumber || 'N/A'})**\n\n`;
                    notesLoop += `* **S (Subjective):** ${note.subjective || 'N/A'}\n`;
                    notesLoop += `* **O (Objective):** ${note.objective || 'N/A'}\n`;
                    notesLoop += `* **A (Assessment):** ${note.assessment || 'N/A'}\n`;
                    notesLoop += `* **P (Plan):** ${note.plan || 'N/A'}\n\n`;
                    
                    if (note.patientSignature) {
                        notesLoop += `**Patient Sign-off:**\n`;
                        notesLoop += `![Patient Signature](${note.patientSignature})\n`;
                        notesLoop += `*Signed on: ${note.patientSignatureTimestamp ? new Date(note.patientSignatureTimestamp).toLocaleString() : 'N/A'}*\n\n`;
                    }
                });
            } else {
                notesLoop += `*No detailed clinical notes found for this appointment.*\n\n`;
            }
            notesLoop += '---\n\n';
        });

        content = content.replace('{clinicalNotesLoop}', notesLoop || 'No appointments found.');
    }

    if (content.includes('{ledgerRows}')) {
        const rows = (patient.ledger || []).map(entry => 
            `| ${formatDate(entry.date)} | ${entry.description} | ${entry.type === 'Charge' ? entry.amount.toFixed(2) : ''} | ${entry.type === 'Payment' ? entry.amount.toFixed(2) : ''} | ${entry.balanceAfter.toFixed(2)} |`
        ).join('\n');
        content = content.replace('{ledgerRows}', rows);
    }
    
    // Treatment Plan placeholders
    if (content.includes('{planItems}') || content.includes('{planName}') || content.includes('{planTotal}')) {
        // Assume the most recent plan if not specified otherwise
        const latestPlan = patient.treatmentPlans?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        
        if (latestPlan) {
            content = content.replace(/{planName}/g, latestPlan.name);
            const planItems = patient.dentalChart?.filter(item => item.planId === latestPlan.id);
            const rows = (planItems || []).map(item => 
                `| ${item.toothNumber || 'N/A'} | ${item.procedure} | ${(item.price || 0).toFixed(2)} |`
            ).join('\n');
            content = content.replace('{planItems}', rows);
            const total = (planItems || []).reduce((sum, item) => sum + (item.price || 0), 0);
            content = content.replace('{planTotal}', total.toLocaleString());
        }
    }
    
    // Placeholder for other complex fields

    return content;
};


export const generateAdminReport = (templateContent: string, params: any, data: { patients: Patient[], appointments: Appointment[] }, settings: FieldSettings): string => {
    let content = templateContent;

    const today = new Date();
    const startDateStr = params.startDate || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const endDateStr = params.endDate || today.toISOString().split('T')[0];
    const branchName = params.branchName || 'All Branches';

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    const relevantAppointments = data.appointments.filter(a => {
        const aptDate = new Date(a.date);
        const branchMatch = branchName === 'All Branches' || a.branch === branchName;
        return branchMatch && aptDate >= start && aptDate <= end;
    });

    const completedApts = relevantAppointments.filter(a => a.status === AppointmentStatus.COMPLETED);

    const totalProduction = completedApts.reduce((sum, apt) => {
        const proc = settings.procedures.find(p => p.name === apt.type);
        return sum + (proc?.defaultPrice || 0);
    }, 0);

    // Simplified collections logic for demo purposes
    const totalCollections = totalProduction * 0.9; 

    const patientsSeen = new Set(completedApts.map(a => a.patientId)).size;
    
    const newPatientIds = new Set(data.patients.filter(p => new Date(p.lastVisit) >= start).map(p => p.id));
    const newPatients = Array.from(new Set(relevantAppointments.filter(a => newPatientIds.has(a.patientId)).map(a => a.patientId))).length;

    const noShows = relevantAppointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;
    
    content = content.replace(/{currentDate}/g, formatDate(today.toISOString()));
    content = content.replace(/{startDate}/g, formatDate(startDateStr));
    content = content.replace(/{endDate}/g, formatDate(endDateStr));
    content = content.replace(/{branchName}/g, branchName);

    content = content.replace(/{totalProduction}/g, totalProduction.toLocaleString());
    content = content.replace(/{totalCollections}/g, totalCollections.toLocaleString());
    content = content.replace(/{patientsSeen}/g, patientsSeen.toString());
    content = content.replace(/{newPatients}/g, newPatients.toString());
    content = content.replace(/{noShows}/g, noShows.toString());

    // Placeholder for more complex row-based data
    content = content.replace(/{agingRows}/g, 'Aging report data not implemented.');
    content = content.replace(/{inventoryRows}/g, 'Inventory report data not implemented.');
    content = content.replace(/{productionItems}/g, 'Production items data not implemented.');
    content = content.replace(/{totalAppointments}/g, relevantAppointments.length.toString());
    content = content.replace(/{completedAppointments}/g, completedApts.length.toString());
    content = content.replace(/{noShowCount}/g, noShows.toString());
    content = content.replace(/{cancellationCount}/g, relevantAppointments.filter(a=> a.status === AppointmentStatus.CANCELLED).length.toString());
    const completionRate = relevantAppointments.length > 0 ? ((completedApts.length / relevantAppointments.length) * 100).toFixed(1) : "0.0";
    const noShowRate = relevantAppointments.length > 0 ? ((noShows / relevantAppointments.length) * 100).toFixed(1) : "0.0";
    content = content.replace(/{completionRate}/g, completionRate);
    content = content.replace(/{noShowRate}/g, noShowRate);

    return content;
};
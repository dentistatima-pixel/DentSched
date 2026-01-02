import React from 'react';
import { Patient, DentalChartEntry, User, Appointment, AppointmentStatus } from '../types';
import { FileText, Download, FileSignature, ShieldAlert, ShieldX } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { formatDate } from '../constants';

interface PhilHealthCF4GeneratorProps {
    patient: Patient;
    currentUser: User;
    odontogram: DentalChartEntry[];
    appointments: Appointment[];
}

const PhilHealthCF4Generator: React.FC<PhilHealthCF4GeneratorProps> = ({ patient, currentUser, odontogram, appointments }) => {
    
    const generateCF2 = () => {
        // --- ATTRIBUTION LOCK (CF-2) ---
        const myEntries = odontogram.filter(e => e.status === 'Completed' && e.author === currentUser.name);
        
        if (myEntries.length === 0) {
            alert(`PHILHEALTH ATTRIBUTION LOCK: You cannot generate a claim form for procedures you did not personally record. No completed records found for practitioner: ${currentUser.name}`);
            return;
        }

        const doc = new jsPDF();
        
        // CF-2 Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text("PHILHEALTH CLAIM FORM 2 (CF-2)", 105, 15, { align: 'center' });
        doc.setFontSize(8);
        doc.text("CLAIM FORM 2 - TO BE FILLED OUT BY THE HEALTH CARE PROVIDER", 105, 20, { align: 'center' });

        doc.setLineWidth(0.5);
        doc.line(10, 25, 200, 25);

        // PART I - MEMBER INFO
        doc.setFontSize(10);
        doc.text("PART I - MEMBER AND PATIENT INFORMATION", 10, 32);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`1. PhilHealth Identification No. (PIN): ${patient.philHealthPIN || '---'}`, 15, 40);
        doc.text(`2. Category: ${patient.philHealthCategory || '---'}`, 100, 40);
        doc.text(`3. Member Name: ${patient.surname}, ${patient.firstName} ${patient.middleName || ''}`, 15, 47);
        doc.text(`4. Patient Name: ${patient.surname}, ${patient.firstName} ${patient.middleName || ''}`, 15, 54);
        doc.text(`5. Relationship: ${patient.philHealthMemberStatus || 'Member'}`, 100, 54);

        // PART II - CLINICAL INFO
        doc.setFont('helvetica', 'bold');
        doc.text("PART II - CLINICAL INFORMATION", 10, 65);
        doc.setFont('helvetica', 'normal');
        doc.text(`6. Chief Complaint: ${patient.chiefComplaint || 'None reported'}`, 15, 73);
        
        const lastSoap = [...myEntries].filter(e => e.subjective || e.objective).sort((a,b) => new Date(b.date||'').getTime() - new Date(a.date||'').getTime())[0];
        doc.text("7. Diagnosis: Oral Manifestation of Systemic Condition", 15, 80);
        doc.setFontSize(8);
        const findings = lastSoap ? `${lastSoap.objective} ${lastSoap.assessment}` : "No clinical findings recorded.";
        const splitFindings = doc.splitTextToSize(`Clinical Findings: ${findings}`, 180);
        doc.text(splitFindings, 20, 85);

        // PART III - PROFESSIONAL FEES
        let y = 85 + (splitFindings.length * 5) + 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text("PART III - PROFESSIONAL FEES", 10, y);
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Attending Dentist: ${currentUser.name}`, 15, y);
        doc.text(`PRC License: ${currentUser.prcLicense || '---'}`, 100, y);
        y += 7;
        doc.text(`PTR Number: ${currentUser.ptrNumber || '---'}`, 15, y);
        doc.text(`TIN: ${currentUser.tin || '---'}`, 100, y);

        // Professional Fees Breakout
        y += 12;
        doc.setFont('helvetica', 'bold');
        doc.text("Statement of Account (Dental Procedures)", 15, y);
        y += 8;
        doc.setFont('helvetica', 'normal');
        
        let totalPF = 0;
        myEntries.slice(0, 5).forEach(c => {
            const price = c.price || 0;
            totalPF += price;
            doc.text(`${c.procedure} (#${c.toothNumber})`, 20, y);
            doc.text(`PHP ${price.toLocaleString()}`, 160, y, { align: 'right' });
            y += 6;
        });

        doc.line(110, y, 170, y);
        y += 6;
        doc.setFont('helvetica', 'bold');
        doc.text("TOTAL PROFESSIONAL FEES", 110, y);
        doc.text(`PHP ${totalPF.toLocaleString()}`, 160, y, { align: 'right' });

        // Certification
        y = 260;
        doc.setFontSize(8);
        doc.text("I certify that the information provided is true and correct based on clinical records.", 105, y, { align: 'center' });
        y += 10;
        doc.line(10, y, 90, y);
        doc.line(110, y, 190, y);
        doc.text("Signature of Patient/Member", 50, y + 5, { align: 'center' });
        doc.text("Signature of Attending Dentist", 150, y + 5, { align: 'center' });

        doc.save(`PhilHealth_CF2_${patient.surname}.pdf`);
    };

    const generateCF4 = () => {
        // --- SEAT VERIFICATION GATE (ANTI-GHOSTING LOGIC) ---
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const verifiedEntries = odontogram.filter(entry => {
            if (entry.status !== 'Completed') return false;
            
            // --- ATTRIBUTION LOCK (CF-4) ---
            if (entry.author !== currentUser.name) return false;
            
            // Procedure must have occurred within last 30 days
            const entryDate = new Date(entry.date || '');
            if (entryDate < thirtyDaysAgo) return false;

            // Must have a corresponding verified seat record (Completed Appointment)
            return appointments.some(apt => 
                apt.status === AppointmentStatus.COMPLETED && 
                apt.date === entry.date
            );
        });

        if (verifiedEntries.length === 0) {
            alert(`PHILHEALTH AUDIT GATE: No verified clinical procedures found for practitioner ${currentUser.name} within the last 30 days. All procedures must be personally recorded and linked to a verified 'Completed' appointment record.`);
            return;
        }

        const doc = new jsPDF();
        
        // CF-4 Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text("PHILHEALTH CLAIM FORM 4 (CF-4)", 105, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.text("CLINICAL RECORD FOR DENTAL PROCEDURES", 105, 20, { align: 'center' });

        doc.setLineWidth(0.5);
        doc.line(10, 25, 200, 25);

        // Section I: Patient Profile
        doc.setFontSize(11);
        doc.text("I. PATIENT IDENTIFICATION", 10, 32);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Patient Name: ${patient.surname}, ${patient.firstName} ${patient.middleName || ''}`, 15, 40);
        doc.text(`PhilHealth No: ${patient.philHealthPIN || '---'}`, 15, 45);
        doc.text(`DOB: ${formatDate(patient.dob)}`, 100, 45);
        doc.text(`Sex: ${patient.sex || '---'}`, 160, 45);

        // Section II: Clinical Data
        doc.setFont('helvetica', 'bold');
        doc.text("II. CLINICAL HISTORY & EXAMINATION", 10, 55);
        doc.setFont('helvetica', 'normal');
        doc.text(`Chief Complaint: ${patient.chiefComplaint || 'None reported'}`, 15, 63);
        
        const lastSoap = [...verifiedEntries].sort((a,b) => new Date(b.date||'').getTime() - new Date(a.date||'').getTime())[0];
        doc.text("Physical Examination / Oral Findings:", 15, 70);
        doc.setFontSize(9);
        const soapText = lastSoap ? `S: ${lastSoap.subjective}\nO: ${lastSoap.objective}\nA: ${lastSoap.assessment}` : "No verified clinical soap notes found.";
        const splitSoap = doc.splitTextToSize(soapText, 180);
        doc.text(splitSoap, 20, 75);

        // Section III: Course in the Ward (Treatment Logs)
        let y = 75 + (splitSoap.length * 5) + 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text("III. DENTAL PROCEDURES PERFORMED (VERIFIED BY ATTENDING)", 10, y);
        y += 8;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text("Date", 15, y);
        doc.text("Tooth #", 40, y);
        doc.text("Procedure / Treatment Description", 60, y);
        y += 5;
        doc.line(10, y, 200, y);
        y += 5;
        
        doc.setFont('helvetica', 'normal');
        verifiedEntries.slice(0, 15).forEach(c => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(formatDate(c.date), 15, y);
            doc.text(c.toothNumber.toString(), 40, y);
            doc.text(c.procedure, 60, y);
            y += 6;
        });

        // Footer / Certification
        if (y > 250) { doc.addPage(); y = 20; }
        y = 260;
        doc.setFontSize(8);
        doc.text("I certify that I personally performed and recorded the information provided above.", 105, y, { align: 'center' });
        y += 10;
        doc.line(110, y, 190, y);
        doc.text(`Dr. ${currentUser.name} (PRC: ${currentUser.prcLicense || '---'})`, 150, y + 5, { align: 'center' });

        doc.save(`PhilHealth_CF4_VERIFIED_${patient.surname}.pdf`);
    };

    return (
        <div className="flex gap-2">
            <button 
                onClick={generateCF2}
                className="bg-lilac-600 hover:bg-lilac-700 text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-lilac-600/20 transition-all active:scale-95"
            >
                <FileSignature size={14} /> Generate CF-2
            </button>
            <button 
                onClick={generateCF4}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-teal-600/20 transition-all active:scale-95"
            >
                <FileText size={14} /> Generate CF-4
            </button>
        </div>
    );
};

export default PhilHealthCF4Generator;
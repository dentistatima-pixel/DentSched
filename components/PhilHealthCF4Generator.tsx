
import React from 'react';
import { Patient, DentalChartEntry, User } from '../types';
import { FileText, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { formatDate } from '../constants';

interface PhilHealthCF4GeneratorProps {
    patient: Patient;
    currentUser: User;
    odontogram: DentalChartEntry[];
}

const PhilHealthCF4Generator: React.FC<PhilHealthCF4GeneratorProps> = ({ patient, currentUser, odontogram }) => {
    
    const generatePDF = () => {
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
        doc.text(`PhilHealth No: ${patient.insuranceNumber || '---'}`, 15, 45);
        doc.text(`DOB: ${formatDate(patient.dob)}`, 100, 45);
        doc.text(`Sex: ${patient.sex || '---'}`, 160, 45);

        // Section II: Clinical Data
        doc.setFont('helvetica', 'bold');
        doc.text("II. CLINICAL HISTORY & EXAMINATION", 10, 55);
        doc.setFont('helvetica', 'normal');
        doc.text(`Chief Complaint: ${patient.chiefComplaint || 'None reported'}`, 15, 63);
        
        // Findings from SOAP
        const lastSoap = odontogram.filter(e => e.subjective || e.objective).sort((a,b) => new Date(b.date||'').getTime() - new Date(a.date||'').getTime())[0];
        doc.text("Clinical Findings:", 15, 70);
        doc.setFontSize(9);
        const findings = lastSoap ? `${lastSoap.objective} ${lastSoap.assessment}` : "No recent findings recorded.";
        const splitFindings = doc.splitTextToSize(findings, 180);
        doc.text(splitFindings, 20, 75);

        // Section III: Dental Chart (Extracting Significant Findings)
        let y = 75 + (splitFindings.length * 5) + 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text("III. DENTAL CHART / ODONTOGRAM DATA", 10, y);
        y += 8;
        doc.setFont('helvetica', 'normal');
        const significantItems = odontogram.filter(e => e.status === 'Completed' || e.status === 'Condition').slice(0, 10);
        if (significantItems.length > 0) {
            significantItems.forEach(item => {
                doc.text(`• Tooth #${item.toothNumber}: ${item.procedure} (${item.status})`, 15, y);
                y += 5;
            });
        } else {
            doc.text("No specific tooth conditions recorded.", 15, y);
            y += 5;
        }

        // Section IV: Treatment Given
        y += 5;
        doc.setFont('helvetica', 'bold');
        doc.text("IV. TREATMENT GIVEN / PROCEDURES PERFORMED", 10, y);
        y += 8;
        doc.setFont('helvetica', 'normal');
        const completed = odontogram.filter(e => e.status === 'Completed').sort((a,b) => new Date(b.date||'').getTime() - new Date(a.date||'').getTime()).slice(0, 5);
        completed.forEach(c => {
            doc.text(`${formatDate(c.date)} - ${c.procedure} on Tooth #${c.toothNumber}`, 15, y);
            y += 5;
        });

        // Signatures
        y = 260;
        doc.line(10, y, 90, y);
        doc.line(110, y, 190, y);
        doc.text("Signature of Patient / Guardian", 50, y + 5, { align: 'center' });
        doc.text(`${currentUser.name} (PRC: ${currentUser.prcLicense})`, 150, y + 5, { align: 'center' });
        doc.text("Attending Dentist Signature", 150, y + 10, { align: 'center' });

        doc.save(`PhilHealth_CF4_${patient.surname}.pdf`);
    };

    return (
        <button 
            onClick={generatePDF}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl shadow-lg hover:bg-teal-700 transition-all"
            title="Generate PhilHealth CF-4 PDF"
        >
            <Download size={14}/> Generate CF-4
        </button>
    );
};

export default PhilHealthCF4Generator;

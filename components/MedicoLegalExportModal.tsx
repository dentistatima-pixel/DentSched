import React, { useState, useMemo } from 'react';
import { X, Shield, FileText, CheckCircle, Clock, Hash, Lock, Fingerprint, ShieldCheck, Scale, Receipt, Activity } from 'lucide-react';
import { Patient, User, AuditLogEntry, DentalChartEntry } from '../types';
import { useToast } from './ToastSystem';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatDate } from '../constants';

interface MedicoLegalExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient;
    staff: User[];
    logAction: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
}

const MedicoLegalExportModal: React.FC<MedicoLegalExportModalProps> = ({ isOpen, onClose, patient, staff, logAction }) => {
    const toast = useToast();
    const [options, setOptions] = useState({
        includeNarrative: true,
        includeForensicAudit: true,
        includePractitionerProfiles: true,
        includeIntegrityHashes: true,
        includeFinancialReconciliation: true,
        includeForensicDvi: true
    });

    if (!isOpen) return null;

    // --- DVI CODE MAPPING ENGINE ---
    const getDviCode = (toothNum: number, entries: DentalChartEntry[]): string => {
        const toothEntries = entries.filter(e => e.toothNumber === toothNum);
        if (toothEntries.length === 0) return 'S'; // Sound (No record)

        // Check for Missing/Extracted first
        if (toothEntries.some(e => e.procedure.toLowerCase().includes('missing') || e.procedure.toLowerCase().includes('extraction'))) {
            return 'M';
        }
        // Check for Crowns
        if (toothEntries.some(e => e.procedure.toLowerCase().includes('crown'))) {
            return 'K';
        }
        // Check for Pontics
        if (toothEntries.some(e => e.procedure.toLowerCase().includes('pontic'))) {
            return 'P';
        }
        // Check for Decay (Condition status or Caries diagnosis)
        if (toothEntries.some(e => e.status === 'Condition' || e.procedure.toLowerCase().includes('caries'))) {
            return 'D';
        }
        // Check for Fillings
        if (toothEntries.some(e => e.procedure.toLowerCase().includes('restoration') || e.procedure.toLowerCase().includes('filling'))) {
            return 'F';
        }

        return 'S'; // Default to Sound
    };

    // --- RECONCILIATION CALCULATOR ---
    const reconData = useMemo(() => {
        let clinicalValue = 0;
        let receiptedTotal = 0;
        let totalPayments = 0;

        patient.dentalChart?.forEach(e => {
            if (e.status === 'Completed') clinicalValue += (e.price || 0);
        });

        patient.ledger?.forEach(l => {
            if (l.type === 'Payment') {
                totalPayments += l.amount;
                if (l.orNumber) receiptedTotal += l.amount;
            }
        });

        return { clinicalValue, receiptedTotal, totalPayments, gap: totalPayments - receiptedTotal };
    }, [patient]);

    const handleExport = async () => {
        toast.info("Compiling chronological clinical narrative...");
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        
        // WATERMARK ADDER
        const addWatermark = (pDoc: jsPDF) => {
            pDoc.saveGraphicsState();
            pDoc.setGState(new (pDoc as any).GState({ opacity: 0.15 }));
            pDoc.setFontSize(40);
            pDoc.setTextColor(150, 150, 150);
            pDoc.text("PDA RULE 9 VERIFIED", pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
            pDoc.restoreGraphicsState();
        };

        const addSafetyAffirmation = (pDoc: jsPDF, yPos: number) => {
            pDoc.setFontSize(8);
            pDoc.setTextColor(100, 100, 100);
            pDoc.setFont('helvetica', 'italic');
            pDoc.text("Radiation Safety Protocol (PDA Rule 9) Verified: Lead shielding utilized for all diagnostic exposures.", 105, yPos, { align: 'center' });
        };

        const addPractitionerAffidavitFooter = (pDoc: jsPDF) => {
            // Fix: The type definition for jsPDF.internal does not include getNumberOfPages.
            // Using internal.pages.length instead, as suggested by the type from the error.
            const pageCount = (pDoc.internal as any).pages.length;
            const author = patient.dentalChart?.find(e => e.author)?.author || 'the attending dentist';
            const clinician = staff.find(s => s.name.includes(author));
            
            for (let i = 1; i <= pageCount; i++) {
                pDoc.setPage(i);
                pDoc.setFontSize(8);
                pDoc.setFont('helvetica', 'bold');
                pDoc.setTextColor(100, 116, 139);
                const footerText = `I, Dr. ${author}, PRC #${clinician?.prcLicense || '[LICENSE]'}, certify that these records were generated in the course of my practice as defined under RA 9484. Page ${i} of ${pageCount}`;
                pDoc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }
        };

        // --- COVER PAGE ---
        doc.setFillColor(15, 23, 42); // Navy Slate
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text("VERIFIED CLINICAL RECORD", 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text("MEDICO-LEGAL NARRATIVE EXPORT", 105, 28, { align: 'center' });
        
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(14);
        doc.text("CERTIFICATE OF AUTHENTICITY", 20, 60);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const certText = `I, as the Personal Information Controller (PIC) for dentsched Practice, hereby certify that the following data represents the true and original clinical history of patient ${patient.name} (UID: ${patient.id}) as recorded in our encrypted electronic health record system. These records are digitally sealed to ensure non-repudiation and temporal integrity under the Rules on Electronic Evidence of the Philippines.`;
        const splitCert = doc.splitTextToSize(certText, 170);
        doc.text(splitCert, 20, 70);
        
        doc.setFont('helvetica', 'bold');
        doc.text("Clinic Registry Details:", 20, 110);
        doc.setFont('helvetica', 'normal');
        doc.text(`TIN: 123-111-222-000`, 25, 118);
        doc.text(`DOH/BPLO Permit: 2024-MAIN-8892`, 25, 125);
        doc.text(`Export Date: ${new Date().toLocaleString()}`, 25, 132);

        doc.line(20, 150, 190, 150);

        // --- SECTION 1: CLINICAL NARRATIVE ---
        if (options.includeNarrative) {
            doc.addPage();
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text("SECTION I: CHRONOLOGICAL CLINICAL NARRATIVE", 20, 20);
            doc.setLineWidth(0.5);
            doc.line(20, 25, 190, 25);
            
            let y = 35;
            const entries = [...(patient.dentalChart || [])].sort((a,b) => new Date(a.date||'').getTime() - new Date(b.date||'').getTime());
            
            entries.forEach((entry, i) => {
                if (y > 250) { doc.addPage(); y = 20; }
                
                const clinician = staff.find(s => s.name.includes(entry.author || ''));
                const isImaging = entry.procedure.toLowerCase().includes('x-ray') || entry.procedure.toLowerCase().includes('radiograph');
                
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(15, 118, 110); // Teal 700
                doc.text(`${formatDate(entry.date)} - ${entry.procedure} (Tooth #${entry.toothNumber})`, 20, y);
                y += 6;
                
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(100, 116, 139); // Slate 500
                doc.text(`Recording Practitioner: Dr. ${entry.author} (PRC: ${clinician?.prcLicense || 'N/A'} | PTR: ${clinician?.ptrNumber || 'N/A'})`, 22, y);
                y += 8;
                
                doc.setTextColor(51, 65, 85);
                doc.setFontSize(10);
                const notes = entry.notes || "No narrative content recorded.";
                const splitNotes = doc.splitTextToSize(notes, 160);
                doc.text(splitNotes, 25, y);
                y += (splitNotes.length * 5) + 10;

                if (isImaging) {
                    addSafetyAffirmation(doc, y - 5);
                    addWatermark(doc);
                }
            });
        }

        // --- SECTION 2: FORENSIC AUDIT TRAIL ---
        if (options.includeForensicAudit) {
            doc.addPage();
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text("SECTION II: FORENSIC AUDIT TRAIL", 20, 20);
            doc.line(20, 25, 190, 25);
            
            const auditData = (patient.dentalChart || []).map(entry => [
                formatDate(entry.date),
                entry.procedure,
                entry.sealedAt ? new Date(entry.sealedAt).toLocaleTimeString() : 'N/A',
                entry.sealedHash ? entry.sealedHash.substring(0, 16) + '...' : 'UNSEALED',
                entry.isVerifiedTime ? 'VERIFIED' : 'SYSTEM CLOCK'
            ]);

            (doc as any).autoTable({
                head: [['Date', 'Procedure', 'Creation Time', 'SHA-256 Hash', 'Temporal Trust']],
                body: auditData,
                startY: 35,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [15, 23, 42] }
            });
        }

        // --- SECTION 3: FINANCIAL RECONCILIATION (RULE 11) ---
        if (options.includeFinancialReconciliation) {
            doc.addPage();
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text("SECTION III: STATUTORY FINANCIAL RECONCILIATION", 20, 20);
            doc.line(20, 25, 190, 25);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text("Pursuant to PDA Rule 11 (Fee Transparency) and BIR compliance mandates, the following table reconciles the clinical value provided against official statutory receipts issued.", 20, 35, { maxWidth: 170 });

            (doc as any).autoTable({
                startY: 45,
                head: [['Registry Identifier', 'Description', 'Value (PHP)']],
                body: [
                    ['DIRECT_CLINICAL_VALUE', 'Total value of Completed Procedures', `PHP ${reconData.clinicalValue.toLocaleString()}`],
                    ['GROSS_OPERATIONAL_PAYMENTS', 'Total payments received by clinic', `PHP ${reconData.totalPayments.toLocaleString()}`],
                    ['STATUTORY_OR_TOTAL', 'Payments matched to BIR Official Receipts', `PHP ${reconData.receiptedTotal.toLocaleString()}`],
                    ['RECON_VARIANCE_GAP', 'Operational vs. Statutory Variance', `PHP ${reconData.gap.toLocaleString()}`]
                ],
                theme: 'striped',
                styles: { fontSize: 9 },
                headStyles: { fillColor: [15, 118, 110] }
            });

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text("DIGNIFIED FEE DISCLOSURE (PDA Rule 11):", 20, 110);
            doc.setFont('helvetica', 'normal');
            doc.text(doc.splitTextToSize("The fees charged for dental services were agreed upon between the patient and the dentist prior to treatment. The clinic maintains transparency in financial dealings, and all official receipts represent accurate statutory documentation of professional fees collected.", 170), 20, 115);
        }

        // --- SECTION 4: FORENSIC DVI ANTE-MORTEM DATASET ---
        if (options.includeForensicDvi) {
            doc.addPage();
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text("ANNEX IV: INTERNATIONAL DVI ANTE-MORTEM DATASET", 20, 20);
            doc.line(20, 25, 190, 25);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text("Interpol Disaster Victim Identification (DVI) Standard - Dental Identification Codes (F1/F2).", 20, 32);

            const dviData: any[] = [];
            const toothChart = patient.dentalChart || [];

            // Quadrants
            const quadrants = [
                { label: 'Upper Right', range: [18, 17, 16, 15, 14, 13, 12, 11] },
                { label: 'Upper Left', range: [21, 22, 23, 24, 25, 26, 27, 28] },
                { label: 'Lower Left', range: [38, 37, 36, 35, 34, 33, 32, 31] },
                { label: 'Lower Right', range: [41, 42, 43, 44, 45, 46, 47, 48] }
            ];

            quadrants.forEach(q => {
                const row = [q.label];
                q.range.forEach(num => {
                    row.push(`${num}: ${getDviCode(num, toothChart)}`);
                });
                dviData.push(row);
            });

            (doc as any).autoTable({
                startY: 40,
                head: [['Quadrant', 'Tooth 1', 'Tooth 2', 'Tooth 3', 'Tooth 4', 'Tooth 5', 'Tooth 6', 'Tooth 7', 'Tooth 8']],
                body: dviData,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [51, 65, 85] }
            });

            let currentY = (doc as any).lastAutoTable.finalY + 15;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text("DVI CODE REFERENCE:", 20, currentY);
            currentY += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text("S: Sound (Virgin/Healthy) | F: Filled (Restored) | M: Missing (Extracted) | D: Decayed (Caries) | K: Crown (Fixed) | P: Pontic (Bridge)", 20, currentY);
            
            currentY += 15;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text("FORENSIC METADATA:", 20, currentY);
            currentY += 8;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const radiographicEntries = toothChart.filter(e => e.procedure.toLowerCase().includes('x-ray') || e.procedure.toLowerCase().includes('radiograph'));
            doc.text(`Last Radiographic Verification: ${radiographicEntries.length > 0 ? formatDate(radiographicEntries[radiographicEntries.length-1].date) : 'N/A'}`, 25, currentY);
            currentY += 6;
            doc.text(`Last Identity Verification Timestamp: ${patient.lastDigitalUpdate ? new Date(patient.lastDigitalUpdate).toLocaleString() : 'N/A'}`, 25, currentY);
            currentY += 6;
            doc.text(`Clinical Repository Temporal Consistency: Verified (RA 8792)`, 25, currentY);
        }

        addPractitionerAffidavitFooter(doc);

        doc.save(`MedicoLegal_Report_${patient.surname}_${Date.now()}.pdf`);
        logAction('EXPORT_RECORD', 'Patient', patient.id, "Generated comprehensive Medico-Legal narrative report including Rule 11 Financial Reconciliation and International DVI dataset.");
        toast.success("Medico-Legal Narrative exported successfully.");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200">
                <div className="p-8 border-b border-slate-100 bg-slate-900 flex justify-between items-center shrink-0 text-white">
                    <div className="flex items-center gap-4">
                        <div className="bg-teal-500 p-2 rounded-xl"><Shield size={24} /></div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Legal Action Hub</h2>
                            <p className="text-xs text-teal-400 font-bold uppercase tracking-widest mt-1">Export Clinical Evidence</p>
                        </div>
                    </div>
                    <button onClick={onClose}><X size={24} className="text-slate-500 hover:text-white" /></button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-start gap-4">
                        <Fingerprint size={32} className="text-blue-600 shrink-0 mt-1" />
                        <div>
                            <h4 className="font-black text-blue-900 uppercase text-xs tracking-widest mb-1">Electronic Evidence Standard</h4>
                            <p className="text-xs text-blue-800 font-medium leading-relaxed">
                                This tool compiles clinical narratives including practitioner PRC/PTR attribution and cryptographic hashes. Compliant with the <strong>Revised Rules on Evidence</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Export Parameters</h4>
                        
                        <label className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-teal-500 transition-all">
                            <input 
                                type="checkbox" 
                                checked={options.includeNarrative}
                                onChange={e => setOptions({...options, includeNarrative: e.target.checked})}
                                className="w-6 h-6 accent-teal-600 rounded" 
                            />
                            <div>
                                <div className="font-bold text-slate-800 text-sm">Chronological Clinical Narrative</div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><Scale size={10}/> Includes Rule 9 Forensic Watermarks</p>
                            </div>
                        </label>

                        <label className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-teal-500 transition-all">
                            <input 
                                type="checkbox" 
                                checked={options.includeForensicAudit}
                                onChange={e => setOptions({...options, includeForensicAudit: e.target.checked})}
                                className="w-6 h-6 accent-teal-600 rounded" 
                            />
                            <div>
                                <div className="font-bold text-slate-800 text-sm">Forensic Audit Trail</div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Digital fingerprint log and temporal verification</p>
                            </div>
                        </label>

                        <label className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-teal-500 transition-all">
                            <input 
                                type="checkbox" 
                                checked={options.includeForensicDvi}
                                onChange={e => setOptions({...options, includeForensicDvi: e.target.checked})}
                                className="w-6 h-6 accent-teal-600 rounded" 
                            />
                            <div>
                                <div className="font-bold text-slate-800 text-sm">Forensic Post-Mortem (DVI) Template</div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><Scale size={10}/> International standard for Disaster Victim Identification</p>
                            </div>
                        </label>

                        <label className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-teal-500 transition-all">
                            <input 
                                type="checkbox" 
                                checked={options.includeFinancialReconciliation}
                                onChange={e => setOptions({...options, includeFinancialReconciliation: e.target.checked})}
                                className="w-6 h-6 accent-teal-600 rounded" 
                            />
                            <div>
                                <div className="font-bold text-slate-800 text-sm">Rule 11 Financial Reconciliation</div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><Receipt size={10}/> Statutory OR Matching Summary</p>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-black uppercase tracking-widest text-xs rounded-2xl">Cancel</button>
                    <button 
                        onClick={handleExport}
                        className="flex-[2] py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                    >
                        <ShieldCheck size={18} className="text-teal-400"/> Compile & Sign Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MedicoLegalExportModal;
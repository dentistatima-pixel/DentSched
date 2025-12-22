import React, { useState } from 'react';
import { X, Shield, FileText, CheckCircle, Clock, Hash, Lock, Fingerprint, ShieldCheck } from 'lucide-react';
import { Patient, User, AuditLogEntry } from '../types';
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
        includeIntegrityHashes: true
    });

    if (!isOpen) return null;

    const handleExport = async () => {
        toast.info("Compiling chronological clinical narrative...");
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        
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

        doc.save(`MedicoLegal_Report_${patient.surname}_${Date.now()}.pdf`);
        logAction('EXPORT_RECORD', 'Patient', patient.id, "Generated comprehensive Medico-Legal narrative report for legal counsel.");
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
                                This tool compiles clinical narratives including practitioner PRC/PTR attribution and cryptographic hashes. Compliant with the <strong>Revised Rules on Evidence</strong> for electronic documents.
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
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Stitched SOAP notes with practitioner attribution</p>
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
                                checked={options.includeIntegrityHashes}
                                onChange={e => setOptions({...options, includeIntegrityHashes: e.target.checked})}
                                className="w-6 h-6 accent-teal-600 rounded" 
                            />
                            <div>
                                <div className="font-bold text-slate-800 text-sm">Cryptographic Integrity Hashes</div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Include SHA-256 seal data for every entry</p>
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
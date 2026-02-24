import React, { useState, useEffect } from 'react';
import { X, Printer, FileText, Loader } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Patient, User, Appointment } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { useAppContext } from '../contexts/AppContext';
import { usePatient } from '../contexts/PatientContext';
import { useAppointments } from '../contexts/AppointmentContext';
import { generatePatientDocument, generateAdminReport } from '../services/documentGenerator';

interface PrintPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    templateId: string;
    patient?: Patient;
    params?: any; // For admin reports
}

const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ isOpen, onClose, templateId, patient, params }) => {
    const { fieldSettings } = useSettings();
    const { currentUser } = useAppContext();
    const { patients } = usePatient();
    const { appointments } = useAppointments();

    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            const template = fieldSettings.documentTemplates[templateId];
            if (!template) {
                setContent(`# Error: Template "${templateId}" not found.`);
                setIsLoading(false);
                return;
            }

            try {
                if (patient && currentUser) {
                    const generatedContent = generatePatientDocument(template.content, patient, currentUser, fieldSettings, appointments);
                    setContent(generatedContent);
                } else if (params) {
                    const generatedContent = generateAdminReport(template.content, params, { patients, appointments }, fieldSettings);
                    setContent(generatedContent);
                } else {
                    setContent("# Error: Insufficient data for document generation.");
                }
            } catch (error) {
                console.error("Document generation error:", error);
                setContent("# Error: Failed to generate document.");
            }
            
            setIsLoading(false);
        }
    }, [isOpen, templateId, patient, params, currentUser, fieldSettings, patients, appointments]);

    const handlePrint = () => {
        const doc = new jsPDF();
        const finalY = (doc as any).lastAutoTable.finalY || 10;
        doc.html(document.getElementById('print-content')!, {
            callback: function (doc) {
                doc.save(`${templateId}_${patient?.name || 'report'}.pdf`);
            },
            x: 15,
            y: 15,
            width: 170,
            windowWidth: 650
        });
    };

    if (!isOpen) return null;

    const templateName = fieldSettings.documentTemplates[templateId]?.name || 'Document Preview';

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-3xl h-[90vh] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <FileText className="text-teal-600" size={20}/>
                        <h2 className="text-xl font-bold text-slate-800">{templateName}</h2>
                    </div>
                    <button onClick={onClose}><X size={24} className="text-slate-500" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 bg-slate-200">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full"><Loader className="animate-spin text-teal-600"/></div>
                    ) : (
                        <div id="print-content" className="bg-white p-12 rounded-lg shadow-lg mx-auto" style={{ width: '210mm', minHeight: '297mm', transform: 'scale(0.8)', transformOrigin: 'top center' }}>
                            <div className="prose prose-sm max-w-none">
                                <ReactMarkdown
                                    components={{
                                        // By default, react-markdown strips data-url images for security.
                                        // This override tells it to render img tags as-is, which allows
                                        // our base64-encoded SVG signatures to appear correctly.
                                        img: ({node, ...props}) => <img style={{maxWidth: '200px', maxHeight: '100px'}} {...props} alt={props.alt || 'Signature'} />
                                    }}
                                >
                                    {content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
                 <div className="p-4 border-t bg-white flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Close</button>
                    <button onClick={handlePrint} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 flex items-center gap-2">
                        <Printer size={16}/> Print to PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrintPreviewModal;
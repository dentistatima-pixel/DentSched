
import React, { useState, useMemo } from 'react';
// FIX: Aliased the User icon to UserIcon to prevent name collisions with the User type.
import { Printer, Edit, FileText, Users, DollarSign, Save, X, Info, BarChart2, Search, User as UserIcon } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from './ToastSystem';
import { Patient } from '../types';
import { usePatient } from '../contexts/PatientContext';
import Fuse from 'fuse.js';
import { useModal } from '../contexts/ModalContext';

const documentGroups = [
    {
        category: 'Patient & Registration',
        icon: Users,
        color: 'text-teal-600',
        documents: [
            { id: 'patient_info', name: 'Patient Information Sheet', isPatientSpecific: true },
            { id: 'med_history', name: 'Medical & Dental History Form', isPatientSpecific: true },
            { id: 'consent_dpa', name: 'General Consent & DPA Form', isPatientSpecific: true },
            { id: 'appt_slip', name: 'Appointment Slip', isPatientSpecific: true },
            { id: 'excuse_letter', name: 'Excuse Letter', isPatientSpecific: true },
        ]
    },
    {
        category: 'Clinical & Medico-Legal',
        icon: FileText,
        color: 'text-lilac-600',
        documents: [
            { id: 'med_cert', name: 'Medical Certificate', isPatientSpecific: true },
            { id: 'rx', name: 'Prescription (Rx)', isPatientSpecific: true },
            { id: 'referral', name: 'Referral Letter', isPatientSpecific: true },
            { id: 'treatment_plan', name: 'Treatment Plan', isPatientSpecific: true },
            { id: 'post_op', name: 'Post-Operative Instructions', isPatientSpecific: true },
            { id: 'lab_order', name: 'Lab Order Form', isPatientSpecific: true },
        ]
    },
    {
        category: 'Financial Documents',
        icon: DollarSign,
        color: 'text-amber-600',
        documents: [
            { id: 'soa', name: 'Statement of Account', isPatientSpecific: true },
            { id: 'walkout_statement', name: 'Walkout Statement', isPatientSpecific: true },
            { id: 'official_receipt', name: 'Official Receipt (OR)', isPatientSpecific: true },
            { id: 'installment_agreement', name: 'Installment Plan Agreement', isPatientSpecific: true },
            { id: 'hmo_claim_form', name: 'HMO/Insurance Claim Form', isPatientSpecific: true },
        ]
    },
    {
        category: 'Administrative Reports',
        icon: BarChart2,
        color: 'text-blue-600',
        documents: [
            { id: 'eod_report', name: 'End of Day (EOD) Report', isPatientSpecific: false },
            { id: 'collections_report', name: 'Collections & Aging Report', isPatientSpecific: false },
            { id: 'practitioner_production_report', name: 'Practitioner Production Report', isPatientSpecific: false },
            { id: 'inventory_report', name: 'Inventory & Stock Level Report', isPatientSpecific: false },
            { id: 'appointment_analysis_report', name: 'Appointment Analysis Report', isPatientSpecific: false },
        ]
    },
];

const placeholders = [
    { category: 'Patient', items: ['{patientName}', '{patientAge}', '{patientSex}', '{patientAddress}', '{patientPhone}', '{patientEmail}', '{patientDob}', '{patientId}', '{patientTin}'] },
    { category: 'Practitioner', items: ['{practitionerName}', '{practitionerPrc}', '{practitionerSpecialty}', '{practitionerPtr}', '{practitionerS2}'] },
    { category: 'Clinic', items: ['{clinicName}', '{clinicAddress}', '{clinicContactNumber}', '{clinicEmail}', '{clinicTin}'] },
    { category: 'General', items: ['{currentDate}'] },
    { category: 'Appointment', items: ['{appointmentDate}', '{appointmentTime}', '{appointmentType}', '{proceduresDone}'] },
    { category: 'Financial', items: ['{ledgerRows}', '{patientBalance}', '{todaysProcedures}', '{todaysPayments}', '{orNumber}', '{amountInWords}', '{paymentDetails}', '{totalAmountPaid}', '{totalAmount}', '{numberOfPayments}', '{monthlyPayment}', '{startDate}'] },
    { category: 'Clinical', items: ['{diagnosis}', '{recommendations}', '{medicationGenericName}', '{medicationBrandName}', '{medicationDosage}', '{medicationQuantity}', '{medicationInstructions}', '{reasonForReferral}', '{clinicalFindings}', '{procedureType}', '{planName}', '{planItems}', '{planTotal}'] },
];

const PrintoutsHub: React.FC = () => {
    const { fieldSettings, handleUpdateSettings } = useSettings();
    const { patients } = usePatient();
    // FIX: The useModal hook returns `openModal`, not `showModal`. Aliasing to match existing usage.
    const { openModal: showModal } = useModal();
    const toast = useToast();
    
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
    const [templateContent, setTemplateContent] = useState('');
    
    const patientFuse = useMemo(() => new Fuse(patients, { keys: ['name', 'id'], threshold: 0.3 }), [patients]);
    const [patientSearch, setPatientSearch] = useState('');
    const patientResults = useMemo(() => patientSearch ? patientFuse.search(patientSearch).map(r => r.item).slice(0, 5) : [], [patientSearch, patientFuse]);

    const handleEdit = (id: string) => {
        setEditingTemplateId(id);
        setTemplateContent(fieldSettings.documentTemplates[id].content);
    };

    const handleSave = () => {
        if (!editingTemplateId) return;
        const newTemplates = {
            ...fieldSettings.documentTemplates,
            [editingTemplateId]: { ...fieldSettings.documentTemplates[editingTemplateId], content: templateContent }
        };
        handleUpdateSettings({ ...fieldSettings, documentTemplates: newTemplates });
        toast.success("Template updated.");
        setEditingTemplateId(null);
    };

    const handlePrint = (doc: {id: string, name: string, isPatientSpecific: boolean}) => {
        if (doc.isPatientSpecific) {
            const patient = prompt("Enter patient name or ID to print for:");
            if (!patient) return;
            const result = patientFuse.search(patient);
            if (result.length > 0) {
                showModal('printPreview', { templateId: doc.id, patient: result[0].item });
            } else {
                toast.error("Patient not found.");
            }
        } else {
            showModal('printPreview', { templateId: doc.id, params: { branchName: 'Makati Main' }}); // Example params
        }
    };

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Printouts & Report Hub</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">Manage and generate all printable documents and reports.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {documentGroups.map(group => (
                    <div key={group.category} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <h4 className={`font-black text-sm uppercase tracking-[0.3em] mb-6 flex items-center gap-3 ${group.color}`}>
                            <group.icon size={20}/>
                            {group.category}
                        </h4>
                        <div className="space-y-3">
                            {group.documents.map(doc => (
                                <div key={doc.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        {doc.isPatientSpecific ? <UserIcon size={16} className="text-slate-400"/> : <BarChart2 size={16} className="text-slate-400"/>}
                                        <span className="font-bold text-sm text-slate-800">{doc.name}</span>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(doc.id)} className="p-2 text-slate-400 hover:text-blue-600 bg-white rounded-lg border border-slate-200"><Edit size={14}/></button>
                                        <button onClick={() => handlePrint(doc)} className="p-2 text-slate-400 hover:text-teal-600 bg-white rounded-lg border border-slate-200"><Printer size={14}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {editingTemplateId && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingTemplateId(null)}/>
                    <div className="relative bg-white w-full max-w-4xl h-[80vh] rounded-[3rem] shadow-2xl flex flex-col animate-in zoom-in-95">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">Edit Template: {fieldSettings.documentTemplates[editingTemplateId].name}</h3>
                            <button onClick={() => setEditingTemplateId(null)}><X/></button>
                        </div>
                        <div className="flex-1 grid grid-cols-2 min-h-0">
                            <textarea value={templateContent} onChange={e => setTemplateContent(e.target.value)} className="w-full h-full p-6 font-mono text-xs resize-none border-r outline-none"/>
                            <div className="p-6 overflow-y-auto space-y-4">
                                <h4 className="font-bold text-sm">Available Placeholders</h4>
                                {placeholders.map(group => (
                                    <div key={group.category}>
                                        <h5 className="font-bold text-xs uppercase text-slate-500">{group.category}</h5>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {group.items.map(item => <code key={item} className="text-xs bg-slate-100 p-1 rounded font-mono">{item}</code>)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-3"><button onClick={() => setEditingTemplateId(null)} className="px-6 py-3 bg-slate-100 rounded-xl font-bold">Cancel</button><button onClick={handleSave} className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold">Save Template</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrintoutsHub;

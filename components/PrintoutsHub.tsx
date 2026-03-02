

import React, { useState, useMemo } from 'react';
import { Printer, Edit, FileText, Users, DollarSign, Save, X, BarChart2, Search, User as UserIcon } from 'lucide-react';
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
            { id: 'registration_full', name: 'Complete Registration Form', isPatientSpecific: true },
            { id: 'clinical_notes_summary', name: 'Clinical History & Notes', isPatientSpecific: true },
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
    { category: 'Lab', items: ['{labName}', '{dueDate}', '{toothNumber}', '{restorationType}', '{shade}', '{instructions}'] },
    { category: 'Insurance', items: ['{insuranceProvider}', '{insuranceNumber}', '{chiefComplaint}'] },
    { category: 'Admin Reports', items: ['{startDate}', '{endDate}', '{branchName}', '{totalProduction}', '{totalCollections}', '{patientsSeen}', '{newPatients}', '{noShows}', '{agingRows}', '{inventoryRows}', '{productionItems}', '{totalAppointments}', '{completedAppointments}', '{noShowCount}', '{cancellationCount}', '{completionRate}', '{noShowRate}'] },
];


interface TemplateEditorModalProps {
    templateId: string;
    onClose: () => void;
}

const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({ templateId, onClose }) => {
    const { fieldSettings, handleUpdateSettings } = useSettings();
    const toast = useToast();
    const template = fieldSettings.documentTemplates[templateId];
    const [content, setContent] = useState(template?.content || '');

    if (!template) return null;
    
    const handleSave = () => {
        const newTemplates = {
            ...fieldSettings.documentTemplates,
            [templateId]: { ...template, content }
        };
        handleUpdateSettings({ ...fieldSettings, documentTemplates: newTemplates });
        toast.success(`Template "${template.name}" updated successfully.`);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Edit Template: {template.name}</h2>
                        <p className="text-sm text-slate-500">Use placeholders to dynamically insert data.</p>
                    </div>
                    <button onClick={onClose}><X size={24} className="text-slate-500" /></button>
                </div>
                <div className="flex-1 flex overflow-hidden">
                    <div className="w-2/3 p-4">
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-full p-4 border rounded-xl resize-none font-mono text-xs"
                        />
                    </div>
                    <div className="w-1/3 border-l bg-slate-50 overflow-y-auto p-4 space-y-4">
                        <h4 className="font-bold text-sm">Available Placeholders</h4>
                        {placeholders.map(group => (
                            <div key={group.category}>
                                <h5 className="text-xs font-bold uppercase text-slate-400 mb-2">{group.category}</h5>
                                <div className="flex flex-wrap gap-1">
                                    {group.items.map(item => (
                                        <button key={item} onClick={() => { setContent(c => c + item); toast.info(`Copied ${item}`) }} className="text-[10px] bg-white border px-2 py-0.5 rounded font-mono hover:bg-teal-50">
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                 <div className="p-4 border-t bg-white flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                    <button onClick={handleSave} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 flex items-center gap-2">
                        <Save size={16}/> Save Template
                    </button>
                </div>
            </div>
        </div>
    );
};

const PrintoutsHub: React.FC = () => {
    const { fieldSettings } = useSettings();
    const { showModal } = useModal();
    const { patients } = usePatient();
    
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
    const [patientSearch, setPatientSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    
    const patientFuse = useMemo(() => new Fuse(patients, { keys: ['name', 'id', 'phone'], threshold: 0.3 }), [patients]);

    const handlePatientSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPatientSearch(e.target.value);
        if (e.target.value) {
            setSearchResults(patientFuse.search(e.target.value).map(res => res.item).slice(0, 5));
        } else {
            setSearchResults([]);
            setSelectedPatient(null);
        }
    };
    
    const handleSelectPatient = (p: Patient) => {
        setSelectedPatient(p);
        setPatientSearch(p.name);
        setSearchResults([]);
    };

    const handleGenerate = (templateId: string, isPatientSpecific: boolean) => {
        if (isPatientSpecific) {
            if (selectedPatient) {
                showModal('printPreview', { templateId, patient: selectedPatient });
            }
        } else {
            // Logic for admin reports (e.g., prompt for date range)
            showModal('printPreview', { templateId, params: {} });
        }
    };

    return (
        <div className="p-10 space-y-12 animate-in fade-in duration-500">
            <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Printouts & Reports Hub</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">Generate patient documents and administrative reports.</p>
            </div>
            
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h4 className="label text-sm mb-4">Quick Print: Generate Patient Document</h4>
                {!selectedPatient ? (
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                        <input type="text" value={patientSearch} onChange={handlePatientSearch} placeholder="Search patient..." className="input pl-12"/>
                        {searchResults.length > 0 && (
                            <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                                {searchResults.map(p => <div key={p.id} onClick={() => handleSelectPatient(p)} className="p-3 hover:bg-teal-50 cursor-pointer">{p.name}</div>)}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-4 bg-teal-50 border-2 border-teal-200 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <UserIcon className="text-teal-700" size={20}/>
                            <span className="font-bold text-teal-900">{selectedPatient.name}</span>
                        </div>
                        <button onClick={() => { setSelectedPatient(null); setPatientSearch(''); }} className="text-slate-400 hover:text-red-500"><X size={18}/></button>
                    </div>
                )}
            </div>

            {documentGroups.map(group => (
                 <div key={group.category} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className={`flex items-center gap-3 font-black uppercase text-xs tracking-[0.2em] border-b border-slate-100 pb-4 mb-6 ${group.color}`}>
                        <group.icon size={20} />
                        {group.category}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.documents.map(doc => {
                            const templateExists = !!fieldSettings.documentTemplates[doc.id];
                            const isPrintDisabled = !templateExists || (doc.isPatientSpecific && !selectedPatient);
                            return (
                                <div key={doc.id} className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${templateExists ? 'bg-slate-50 border-slate-100' : 'bg-amber-50 border-amber-200'}`}>
                                    <div>
                                        <div className="font-bold text-sm text-slate-800">{doc.name}</div>
                                        {!templateExists && <div className="text-[9px] text-amber-700 font-bold uppercase mt-1">Template Missing</div>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleGenerate(doc.id, doc.isPatientSpecific)} disabled={isPrintDisabled} className="p-2 bg-white rounded-lg text-slate-500 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Print Preview"><Printer size={16}/></button>
                                        <button onClick={() => setEditingTemplateId(doc.id)} disabled={!templateExists} className="p-2 bg-white rounded-lg text-slate-500 hover:bg-lilac-50 hover:text-lilac-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Edit Template"><Edit size={16}/></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 </div>
            ))}
            
            {editingTemplateId && <TemplateEditorModal templateId={editingTemplateId} onClose={() => setEditingTemplateId(null)} />}
        </div>
    );
};

export default PrintoutsHub;
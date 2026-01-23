
import React, { useState } from 'react';
import { Printer, Edit, FileText, Users, DollarSign, Save, X, Info } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from './ToastSystem';

const documentGroups = [
    {
        category: 'Patient & Registration',
        icon: Users,
        color: 'text-teal-600',
        documents: [
            { id: 'patient_info', name: 'Patient Information Sheet' },
            { id: 'med_history', name: 'Medical & Dental History Form' },
            { id: 'consent_dpa', name: 'General Consent & DPA Form' },
            { id: 'soa', name: 'Statement of Account' },
            { id: 'appt_slip', name: 'Appointment Slip' },
        ]
    },
    {
        category: 'Clinical & Medico-Legal',
        icon: FileText,
        color: 'text-lilac-600',
        documents: [
            { id: 'med_cert', name: 'Medical Certificate' },
            { id: 'rx', name: 'Prescription (Rx)' },
            { id: 'referral', name: 'Referral Letter' },
            { id: 'post_op', name: 'Post-Operative Instructions' },
        ]
    },
    {
        category: 'Administrative Reports',
        icon: DollarSign,
        color: 'text-amber-600',
        documents: [
            { id: 'eod_report', name: 'End of Day (EOD) Report' },
            { id: 'collections_report', name: 'Collections & Aging Report' },
            { id: 'inventory_report', name: 'Inventory & Stock Level Report' },
        ]
    },
];

const placeholders = [
    { category: 'Patient', items: ['{patientName}', '{patientAge}', '{patientSex}', '{patientAddress}', '{patientPhone}', '{patientEmail}', '{patientDob}', '{patientId}'] },
    { category: 'Practitioner', items: ['{practitionerName}', '{practitionerPrc}', '{practitionerSpecialty}', '{practitionerPtr}', '{practitionerS2}'] },
    { category: 'Clinic', items: ['{clinicName}', '{clinicAddress}', '{clinicContactNumber}', '{clinicEmail}', '{clinicTin}'] },
    { category: 'General', items: ['{currentDate}'] },
    { category: 'Appointment', items: ['{appointmentDate}', '{appointmentTime}', '{appointmentType}'] },
    { category: 'Financial', items: ['{ledgerRows}', '{patientBalance}'] },
    { category: 'Clinical', items: ['{diagnosis}', '{recommendations}', '{medicationGenericName}', '{medicationBrandName}', '{medicationDosage}', '{medicationQuantity}', '{medicationInstructions}'] },
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
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

    return (
        <div className="p-10 space-y-12 animate-in fade-in duration-500">
            <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Printouts & Reports Hub</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">Configure templates for all printed documents and official reports.</p>
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
                            return (
                                <div key={doc.id} className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${templateExists ? 'bg-slate-50 border-slate-100' : 'bg-amber-50 border-amber-200'}`}>
                                    <div>
                                        <div className="font-bold text-sm text-slate-800">{doc.name}</div>
                                        {!templateExists && <div className="text-[9px] text-amber-700 font-bold uppercase mt-1">Template Missing</div>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button disabled className="p-2 bg-white rounded-lg text-slate-300 cursor-not-allowed" title="Print Preview (Coming Soon)"><Printer size={16}/></button>
                                        <button onClick={() => setEditingTemplateId(doc.id)} disabled={!templateExists} className="p-2 bg-white rounded-lg text-slate-500 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Edit Template"><Edit size={16}/></button>
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

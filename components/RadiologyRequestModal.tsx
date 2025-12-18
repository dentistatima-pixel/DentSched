
import React, { useState } from 'react';
import { X, FileText, Printer, ShieldCheck, MapPin, Radio, ClipboardList, CheckCircle } from 'lucide-react';
import { Patient, FieldSettings, Vendor, Referral } from '../types';
import { useToast } from './ToastSystem';

interface RadiologyRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient;
    fieldSettings: FieldSettings;
    onSave: (referral: Referral) => void;
}

const XRAY_TYPES = [
    'Panoramic X-ray',
    'Cephalometric X-ray',
    'Periapical X-ray (Targeted)',
    'Bitewing X-ray',
    'CBCT (3D Imaging)',
    'Hand-Wrist X-ray'
];

const RadiologyRequestModal: React.FC<RadiologyRequestModalProps> = ({ isOpen, onClose, patient, fieldSettings, onSave }) => {
    const toast = useToast();
    const [selectedType, setSelectedType] = useState('');
    const [selectedVendorId, setSelectedVendorId] = useState('');
    const [clinicalReason, setClinicalReason] = useState('');

    if (!isOpen) return null;

    const centers = fieldSettings.vendors?.filter(v => v.type === 'Lab' || v.type === 'Other') || [];

    const handleIssueRequest = () => {
        if (!selectedType || !selectedVendorId) {
            toast.error("Please select a diagnostic view and center.");
            return;
        }

        const vendor = centers.find(v => v.id === selectedVendorId);

        const newReferral: Referral = {
            id: `rad_${Date.now()}`,
            patientId: patient.id,
            date: new Date().toISOString().split('T')[0],
            referredTo: vendor?.name || 'External Center',
            reason: `${selectedType}: ${clinicalReason}`,
            status: 'Pending',
            notes: `Requested via dentsched clinical portal.`
        };

        onSave(newReferral);
        toast.success("Radiology Request Issued. Log entry auto-populated.");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-teal-900 text-white rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <Radio size={24} className="text-teal-300"/>
                        <div>
                            <h2 className="text-xl font-bold">Radiology Request</h2>
                            <p className="text-xs text-teal-200">Patient: {patient.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose}><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Required Diagnostic View</label>
                        <select 
                            value={selectedType} 
                            onChange={e => setSelectedType(e.target.value)}
                            className="w-full p-4 border-2 border-slate-200 rounded-2xl bg-white font-bold text-slate-700 focus:border-teal-500 outline-none"
                        >
                            <option value="">- Select X-Ray Type -</option>
                            {XRAY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">External Center (Radiology Vendor)</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <select 
                                value={selectedVendorId} 
                                onChange={e => setSelectedVendorId(e.target.value)}
                                className="w-full p-4 pl-12 border-2 border-slate-200 rounded-2xl bg-white font-bold text-slate-700 focus:border-teal-500 outline-none"
                            >
                                <option value="">- Select Referral Center -</option>
                                {centers.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Clinical Justification</label>
                        <textarea 
                            value={clinicalReason}
                            onChange={e => setClinicalReason(e.target.value)}
                            placeholder="e.g., Evaluation of wisdom tooth impaction relative to mandibular canal..."
                            className="w-full p-4 border-2 border-slate-200 rounded-2xl bg-white text-sm h-32 focus:border-teal-500 outline-none"
                        />
                    </div>

                    <div className="bg-teal-50 border border-teal-100 p-4 rounded-2xl flex gap-3 text-teal-800">
                        <CheckCircle size={20} className="shrink-0 mt-1"/>
                        <p className="text-xs leading-relaxed font-medium">
                            Issuing this request will automatically populate the <strong>DOH Radiology Request Log</strong> for audit compliance.
                        </p>
                    </div>
                </div>

                <div className="p-4 border-t bg-white flex justify-end gap-3 rounded-b-3xl">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 font-bold rounded-xl text-slate-600">Cancel</button>
                    <button 
                        onClick={handleIssueRequest}
                        className="px-8 py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all flex items-center gap-2"
                    >
                        <Printer size={18}/> Print & Log Request
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RadiologyRequestModal;

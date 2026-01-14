import React, { useState } from 'react';
import { Patient, User, ClearanceRequest, VerificationMethod } from '../types';
import { X, Save, ShieldCheck, User as UserIcon, Building2, Phone, Calendar, FileText } from 'lucide-react';
import { useToast } from './ToastSystem';

interface ClearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clearance: Omit<ClearanceRequest, 'id' | 'patientId'>) => void;
  patient: Patient;
  currentUser: User;
}

const ClearanceModal: React.FC<ClearanceModalProps> = ({ isOpen, onClose, onSave, patient, currentUser }) => {
    const toast = useToast();
    const [doctorName, setDoctorName] = useState(patient.physicianName || '');
    const [specialty, setSpecialty] = useState(patient.physicianSpecialty || '');
    const [contactNumber, setContactNumber] = useState(patient.physicianNumber || '');
    const [clinicName, setClinicName] = useState(patient.physicianAddress || '');
    const [approvedAt, setApprovedAt] = useState(new Date().toISOString().split('T')[0]);
    const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>(VerificationMethod.PHYSICAL_FILE_VERIFIED);
    const [remarks, setRemarks] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!doctorName || !approvedAt) {
            toast.error("Physician Name and Approval Date are mandatory.");
            return;
        }

        const combinedRemarks = [
            remarks,
            clinicName && `Clinic: ${clinicName}`,
            contactNumber && `Contact: ${contactNumber}`
        ].filter(Boolean).join(' | ');

        const newClearance: Omit<ClearanceRequest, 'id' | 'patientId'> = {
            doctorName,
            specialty,
            requestedAt: new Date().toISOString(),
            status: 'Approved',
            approvedAt,
            remarks: combinedRemarks,
            verificationMethod,
            verifiedByPractitionerId: currentUser.id,
            verifiedByPractitionerName: currentUser.name,
        };

        onSave(newClearance);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 border-4 border-white overflow-hidden">
                <div className="p-8 bg-lilac-600 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-2xl"><ShieldCheck size={28}/></div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">Log Medical Clearance</h2>
                            <p className="text-xs font-bold text-lilac-100 uppercase tracking-widest mt-1">Forensic Verification Record</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
                </div>

                <div className="p-8 space-y-6 flex-1 overflow-y-auto bg-slate-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label text-xs flex items-center gap-1.5"><UserIcon size={14}/> Physician Name *</label>
                            <input type="text" value={doctorName} onChange={e => setDoctorName(e.target.value)} className="input"/>
                        </div>
                        <div>
                            <label className="label text-xs">Specialty</label>
                            <input type="text" value={specialty} onChange={e => setSpecialty(e.target.value)} className="input"/>
                        </div>
                        <div>
                            <label className="label text-xs flex items-center gap-1.5"><Building2 size={14}/> Clinic / Hospital</label>
                            <input type="text" value={clinicName} onChange={e => setClinicName(e.target.value)} className="input"/>
                        </div>
                        <div>
                            <label className="label text-xs flex items-center gap-1.5"><Phone size={14}/> Contact Number</label>
                            <input type="text" value={contactNumber} onChange={e => setContactNumber(e.target.value)} className="input"/>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="label text-xs flex items-center gap-1.5"><Calendar size={14}/> Date of Approval *</label>
                                <input type="date" value={approvedAt} onChange={e => setApprovedAt(e.target.value)} className="input font-black"/>
                            </div>
                            <div>
                                <label className="label text-xs">Verification Method</label>
                                <select value={verificationMethod} onChange={e => setVerificationMethod(e.target.value as VerificationMethod)} className="input text-xs font-bold uppercase">
                                    <option value={VerificationMethod.PHYSICAL_FILE_VERIFIED}>Physical File Verified</option>
                                    <option value={VerificationMethod.DIGITAL_UPLOAD}>Digital Upload</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="label text-xs flex items-center gap-1.5"><FileText size={14}/> Remarks / Conditions</label>
                        <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="input h-24" placeholder="e.g. Cleared for non-invasive procedures only."/>
                    </div>
                </div>

                <div className="p-6 border-t bg-white flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
                    <button onClick={handleSubmit} className="px-12 py-4 bg-teal-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-teal-700 transition-all flex items-center gap-3">
                        <Save size={20} /> Commit to Registry
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClearanceModal;
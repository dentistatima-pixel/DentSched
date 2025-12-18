
import React, { useState, useMemo } from 'react';
import { Patient, Appointment, User, AppointmentType, LedgerEntry, TreatmentPlan, TreatmentPlanStatus, AuditLogEntry, AmendmentRequest, DataAccessRequest } from '../types';
import { LogOut, User as UserIcon, Calendar, DollarSign, Video, Send, CheckCircle, Receipt, Download, ArrowUpRight, ArrowDownLeft, FileText, ClipboardList, ShieldCheck, FileSignature, Sparkles, Database, AlertCircle, FileBox, ShieldAlert, MonitorOff, Eye, PenSquare, Clock, Inbox } from 'lucide-react';
import { formatDate } from '../constants';
import TelehealthModal from './TelehealthModal';
import { useToast } from './ToastSystem';
import { jsPDF } from 'jspdf';

interface PatientPortalProps {
    patient: Patient;
    appointments: Appointment[];
    staff: User[];
    auditLog?: AuditLogEntry[]; 
    onExit: () => void;
    onAddAmendmentRequest?: (req: Partial<AmendmentRequest>) => void;
    onAddAccessRequest?: (req: Partial<DataAccessRequest>) => void; // NEW
    amendmentRequests?: AmendmentRequest[];
    accessRequests?: DataAccessRequest[]; // NEW
}

const PatientPortal: React.FC<PatientPortalProps> = ({ patient, appointments, staff, auditLog = [], onExit, onAddAmendmentRequest, onAddAccessRequest, amendmentRequests = [], accessRequests = [] }) => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'appointments'|'ledger'|'logs'|'forms'|'amend'>('appointments');
    const [showSecurityModal, setShowSecurityModal] = useState<{ type: 'Full Record' | 'Clinical Abstract' } | null>(null);

    // Amendment Request state
    const [amendField, setAmendField] = useState('phone');
    const [amendValue, setAmendValue] = useState('');
    const [amendReason, setAmendReason] = useState('');

    const upcomingAppointments = appointments
        .filter(a => new Date(a.date) >= new Date(new Date().toDateString()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const privacyLogs = useMemo(() => {
        // Fixed typo: changed l.action to log.action
        return auditLog.filter(log => log.entityId === patient.id && (log.action === 'VIEW_RECORD' || log.action === 'UPDATE' || log.action === 'AMEND_RECORD' || log.action === 'FULFILL_ACCESS_REQUEST'));
    }, [auditLog, patient.id]);

    const handleConfirmDownload = () => {
        if (!showSecurityModal) return;
        
        // NPC COMPLIANCE: Fulfilment must be logged by the DPO
        onAddAccessRequest?.({
            id: `dsar_${Date.now()}`,
            patientId: patient.id,
            patientName: patient.name,
            requestDate: new Date().toISOString(),
            type: showSecurityModal.type,
            status: 'Pending'
        });

        toast.info("Request Submitted. Our Data Protection Officer will fulfill this within NPC statutory timelines.");
        setShowSecurityModal(null);
    };

    const handleAmendmentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amendValue.trim() || !amendReason.trim()) return;
        onAddAmendmentRequest?.({
            patientId: patient.id,
            patientName: patient.name,
            fieldToAmend: amendField,
            currentValue: (patient as any)[amendField] || 'N/A',
            requestedValue: amendValue,
            reason: amendReason
        });
        setAmendValue(''); setAmendReason('');
        toast.success("Amendment request sent for validation.");
    };

    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-20">
            <header className="bg-teal-900 p-4 shadow-md flex justify-between items-center text-white sticky top-0 z-50">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-lilac-500 rounded-xl flex items-center justify-center shadow-lg"><span className="text-white font-bold text-xl">D</span></div>
                    <div><h1 className="font-bold tracking-tight text-lg leading-none">Patient Health Portal</h1><span className="text-xs text-teal-200 font-medium">Verified: {patient.name}</span></div>
                 </div>
                 <button onClick={onExit} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-800 text-teal-100 text-sm font-bold"><LogOut size={16}/> Logout</button>
            </header>

            <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                         <div className="flex bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar">
                            {[
                                {id: 'appointments', label: 'Visits', icon: Calendar}, 
                                {id: 'logs', label: 'Privacy Log', icon: Eye},
                                {id: 'amend', label: 'Correct Info', icon: PenSquare},
                                {id: 'forms', label: 'My Records', icon: Inbox}
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === tab.id ? 'border-teal-600 text-teal-700 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}>
                                    <tab.icon size={16} /> {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="p-6">
                            {activeTab === 'appointments' && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-800 mb-4">Upcoming Appointments</h3>
                                    {upcomingAppointments.length > 0 ? upcomingAppointments.map(apt => (
                                        <div key={apt.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                                            <div><div className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1">{apt.type}</div><div className="text-xl font-bold text-slate-800">{formatDate(apt.date)} at {apt.time}</div></div>
                                        </div>
                                    )) : <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 italic">No upcoming visits.</div>}
                                </div>
                            )}

                            {activeTab === 'forms' && (
                                <div className="space-y-6">
                                     <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-900 mb-4">
                                        <ShieldCheck size={24} className="shrink-0 text-blue-600"/>
                                        <p className="text-xs leading-relaxed font-medium">Under the <strong>NPC Right of Access</strong>, you may request a copy of your records. All downloads must be verified by our Data Protection Officer for security.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                                            <div className="flex items-center gap-4 mb-4"><div className="p-3 bg-white rounded-xl text-lilac-600 shadow-sm"><Database size={24}/></div><div><h4 className="font-bold text-slate-800 text-sm">DPA Data Portability</h4><p className="text-[10px] text-slate-500 mt-0.5">Formal JSON export of all clinical data.</p></div></div>
                                            <button onClick={() => setShowSecurityModal({ type: 'Full Record' })} className="w-full px-4 py-2 bg-white border border-lilac-200 text-lilac-700 font-bold text-xs rounded-xl hover:bg-lilac-50 transition-colors">Request Records</button>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                                            <div className="flex items-center gap-4 mb-4"><div className="p-3 bg-white rounded-xl text-teal-600 shadow-sm"><FileBox size={24}/></div><div><h4 className="font-bold text-slate-800 text-sm">Clinical Abstract</h4><p className="text-[10px] text-slate-500 mt-0.5">Generated PDF summary of diagnoses.</p></div></div>
                                            <button onClick={() => setShowSecurityModal({ type: 'Clinical Abstract' })} className="w-full px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl hover:bg-teal-700 shadow-sm transition-colors">Generate PDF</button>
                                        </div>
                                    </div>

                                    {accessRequests.length > 0 && (
                                        <div className="mt-8 border-t border-slate-100 pt-6">
                                            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Clock size={16}/> Access Request Status</h4>
                                            <div className="space-y-3">
                                                {accessRequests.map(r => (
                                                    <div key={r.id} className="flex justify-between items-center p-4 bg-white border rounded-xl">
                                                        <div><div className="font-bold text-slate-800">{r.type}</div><div className="text-[10px] text-slate-400 font-mono">Requested: {formatDate(r.requestDate)}</div></div>
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${r.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{r.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ... Amend and Logs tabs ... */}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-teal-900 p-8 rounded-3xl shadow-xl text-white">
                             <h2 className="font-bold text-xl mb-4 flex items-center gap-2 text-teal-300"><Video size={24}/> Tele-dentistry</h2>
                             <p className="text-sm text-teal-100/70 mb-6 leading-relaxed">Book a DOH-compliant virtual consultation for triage or follow-up discussion.</p>
                             <button className="w-full bg-white text-teal-900 font-bold py-4 rounded-2xl hover:bg-teal-50 transition-colors">Enter Waiting Room</button>
                        </div>
                    </div>
                </div>
            </main>

            {/* SECURITY WARNING MODAL */}
            {showSecurityModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95">
                        <div className="flex items-center gap-3 text-red-600 mb-6"><ShieldAlert size={32} /><h3 className="text-2xl font-bold">Privacy Safety Check</h3></div>
                        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-red-900 space-y-4">
                            <div className="flex gap-3 items-start"><MonitorOff size={40} className="shrink-0 text-red-400"/><p className="text-sm font-medium leading-relaxed">Requesting medical records on a <strong>public computer or shared Wi-Fi</strong> is dangerous. Do not proceed unless you are on a private device.</p></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-8">
                            <button onClick={() => setShowSecurityModal(null)} className="py-4 rounded-xl bg-slate-100 text-slate-600 font-bold">Cancel</button>
                            <button onClick={handleConfirmDownload} className="py-4 rounded-xl bg-red-600 text-white font-bold shadow-lg">Confirm Request</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientPortal;

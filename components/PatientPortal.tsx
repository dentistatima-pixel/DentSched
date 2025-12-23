import React, { useState, useMemo } from 'react';
import { Patient, Appointment, User, AppointmentType, LedgerEntry, TreatmentPlan, TreatmentPlanStatus, AuditLogEntry } from '../types';
import { LogOut, User as UserIcon, Calendar, DollarSign, Video, Send, CheckCircle, Receipt, Download, ArrowUpRight, ArrowDownLeft, FileText, ClipboardList, ShieldCheck, FileSignature, Sparkles, Database, AlertCircle, Archive, ShieldAlert, MonitorOff, Eye } from 'lucide-react';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';
import { jsPDF } from 'jspdf';

interface PatientPortalProps {
    patient: Patient;
    appointments: Appointment[];
    staff: User[];
    auditLog?: AuditLogEntry[]; 
    onExit: () => void;
}

const PatientPortal: React.FC<PatientPortalProps> = ({ patient, appointments, staff, auditLog = [], onExit }) => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'appointments'|'ledger'|'logs'|'forms'>('appointments');
    const [showSecurityModal, setShowSecurityModal] = useState<{ type: 'data' | 'abstract' } | null>(null);

    const upcomingAppointments = appointments
        .filter(a => new Date(a.date) >= new Date(new Date().toDateString()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const privacyLogs = useMemo(() => {
        return auditLog.filter(log => log.entityId === patient.id && (log.action === 'VIEW_RECORD' || log.action === 'UPDATE' || log.action === 'AMEND_RECORD'));
    }, [auditLog, patient.id]);

    const handleConfirmDownload = () => {
        if (!showSecurityModal) return;
        if (showSecurityModal.type === 'data') execDataRequest();
        else execAbstractRequest();
        setShowSecurityModal(null);
    };

    const execDataRequest = () => {
        const dataToExport = {
            metadata: { exportedAt: new Date().toISOString(), compliantWith: "Data Privacy Act (PH)" },
            profile: { id: patient.id, name: patient.name, dob: patient.dob, email: patient.email },
            clinical: { history: patient.dentalChart || [] },
            appointments: appointments
        };
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `MedicalRecord_${patient.surname}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        toast.success("Download started.");
    };

    const execAbstractRequest = () => {
        const doc = new jsPDF();
        doc.setFont('helvetica', 'bold'); doc.text("CLINICAL ABSTRACT", 105, 20, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text(`Patient: ${patient.name}`, 20, 40);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
        doc.save(`Clinical_Abstract_${patient.surname}.pdf`);
        toast.success("Abstract generated.");
    };

    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-20">
            <header className="bg-teal-900 p-4 shadow-md flex justify-between items-center text-white sticky top-0 z-50">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-lilac-500 rounded-xl flex items-center justify-center shadow-lg"><span className="text-white font-bold text-xl">D</span></div>
                    <div><h1 className="font-bold tracking-tight text-lg leading-none">Patient Health Portal</h1><span className="text-xs text-teal-200 font-medium">Verified Access for {patient.name}</span></div>
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
                                {id: 'forms', label: 'Safety & Forms', icon: FileSignature}
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
                                        <div key={apt.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center hover:bg-slate-100 transition-colors">
                                            <div><div className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1">{apt.type}</div><div className="text-xl font-bold text-slate-800">{formatDate(apt.date)} at {apt.time}</div></div>
                                        </div>
                                    )) : <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 italic">No upcoming visits.</div>}
                                </div>
                            )}

                            {activeTab === 'logs' && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ShieldCheck className="text-teal-600" size={20}/> Transparency Log (Right to be Informed)</h3>
                                    <p className="text-xs text-slate-500 bg-teal-50 p-3 rounded-lg border border-teal-100">The Data Privacy Act of 2012 gives you the right to know who has accessed your health records. Below is a log of staff activity on your file.</p>
                                    <div className="divide-y divide-slate-100">
                                        {privacyLogs.length > 0 ? privacyLogs.map(log => (
                                            <div key={log.id} className="py-4 flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold text-sm text-slate-800">Record {log.action.toLowerCase().replace('_', ' ')} by {log.userName}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString()}</div>
                                                </div>
                                                <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase">{log.action === 'VIEW_RECORD' ? 'Clinical Review' : 'Data Entry'}</span>
                                            </div>
                                        )) : <div className="text-center py-10 text-slate-400 italic">No recent access events.</div>}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'forms' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
                                        <div className="flex items-center gap-4 mb-4"><div className="p-3 bg-white rounded-xl text-lilac-600 shadow-sm"><Database size={24}/></div><div><h4 className="font-bold text-slate-800 text-sm">DPA Data Portability</h4><p className="text-xs text-slate-500 mt-0.5">Download your clinical history in structured JSON format.</p></div></div>
                                        <button onClick={() => setShowSecurityModal({ type: 'data' })} className="w-full px-4 py-2 bg-white border border-lilac-200 text-lilac-700 font-bold text-xs rounded-xl hover:bg-lilac-50 transition-colors">Request My Data</button>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
                                        <div className="flex items-center gap-4 mb-4"><div className="p-3 bg-white rounded-xl text-teal-600 shadow-sm"><Archive size={24}/></div><div><h4 className="font-bold text-slate-800 text-sm">Clinical Abstract</h4><p className="text-xs text-slate-500 mt-0.5">Generate a formal PDF summary of your records.</p></div></div>
                                        <button onClick={() => setShowSecurityModal({ type: 'abstract' })} className="w-full px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl hover:bg-teal-700 shadow-sm transition-colors">Generate PDF</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-teal-900 p-8 rounded-3xl border-2 border-teal-800 shadow-xl text-white text-center">
                             <div className="w-16 h-16 bg-teal-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-teal-700">
                                <ShieldCheck size={32} className="text-teal-400"/>
                             </div>
                             <h2 className="font-bold text-lg mb-2">Verified Health Record</h2>
                             <p className="text-xs text-teal-200 opacity-80 leading-relaxed">Your data is secured with end-to-end encryption. Any access to your record is recorded in your transparency log.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* SECURITY WARNING MODAL */}
            {showSecurityModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95">
                        <div className="flex items-center gap-3 text-red-600 mb-6">
                            <ShieldAlert size={32} />
                            <h3 className="text-2xl font-bold">Privacy Warning</h3>
                        </div>
                        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-red-900 space-y-4">
                            <div className="flex gap-3 items-start"><MonitorOff size={40} className="shrink-0 text-red-400"/><p className="text-sm font-medium leading-relaxed">Are you using a <strong>public computer or shared Wi-Fi?</strong> Downloading your medical records on an insecure device puts your sensitive health data at risk.</p></div>
                            <p className="text-xs font-bold uppercase tracking-wider">Clinic Policy: Ensure you are on a private, password-protected device.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-8">
                            <button onClick={() => setShowSecurityModal(null)} className="py-4 rounded-xl bg-slate-100 text-slate-600 font-bold">Cancel Download</button>
                            <button onClick={handleConfirmDownload} className="py-4 rounded-xl bg-red-600 text-white font-bold shadow-lg">Yes, I'm Private</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientPortal;
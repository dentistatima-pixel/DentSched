
import React, { useState } from 'react';
import { Patient, Appointment, User, AppointmentType, LedgerEntry } from '../types';
import { LogOut, User as UserIcon, Calendar, DollarSign, Video, Send, CheckCircle, Receipt, Download, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { formatDate } from '../constants';
import TelehealthModal from './TelehealthModal';
import { useToast } from './ToastSystem';

interface PatientPortalProps {
    patient: Patient;
    appointments: Appointment[];
    staff: User[];
    onExit: () => void;
}

// Read-Only Ledger Component for Portal
const ReadOnlyLedger: React.FC<{ entries: LedgerEntry[] }> = ({ entries }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-xs">
                <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 text-center">Type</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4 text-right">Balance</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {[...entries].reverse().map((entry) => (
                    <tr key={entry.id}>
                        <td className="p-4 text-slate-500 font-mono text-xs whitespace-nowrap">{formatDate(entry.date)}</td>
                        <td className="p-4 font-medium text-slate-700">{entry.description}</td>
                        <td className="p-4 text-center">
                            {entry.type === 'Charge' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-600 text-[10px] font-bold uppercase"><ArrowUpRight size={10} /> Charge</span>}
                            {entry.type === 'Payment' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase"><ArrowDownLeft size={10} /> Payment</span>}
                        </td>
                        <td className="p-4 text-right font-bold text-slate-700">₱{entry.amount.toLocaleString()}</td>
                        <td className="p-4 text-right font-mono font-bold text-slate-500 bg-slate-50/50">₱{entry.balanceAfter.toLocaleString()}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


const PatientPortal: React.FC<PatientPortalProps> = ({ patient, appointments, staff, onExit }) => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'appointments'|'billing'|'ledger'>('appointments');
    const [isTelehealthModalOpen, setIsTelehealthModalOpen] = useState(false);
    const [activeCall, setActiveCall] = useState<{ appointment: Appointment, doctor: User } | null>(null);

    const upcomingAppointments = appointments
        .filter(a => new Date(a.date) >= new Date(new Date().toDateString()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
    const billingHistory = patient.receipts || [];
    const ledgerHistory = patient.ledger || [];

    const handleTelehealthRequest = () => {
        toast.success("Request sent! Our staff will contact you shortly to schedule your call.");
    };

    const handleJoinCall = (appointment: Appointment) => {
        const doctor = staff.find(s => s.id === appointment.providerId);
        if (doctor) {
            setActiveCall({ appointment, doctor });
        }
    };
    
    const handleEndCall = () => {
        toast.info("Tele-dentistry call has ended.");
        setActiveCall(null);
    }

    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
            {/* Header */}
            <header className="bg-white p-4 shadow-sm flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-xl">D</span>
                    </div>
                    <div>
                        <h1 className="font-bold tracking-tight text-lg leading-none">Patient Portal</h1>
                        <span className="text-xs text-slate-500 font-medium">Welcome, {patient.firstName}</span>
                    </div>
                 </div>
                 <button onClick={onExit} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200">
                     <LogOut size={16}/> Logout
                 </button>
            </header>

            {/* Main Content */}
            <main className="p-4 md:p-8 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Column */}
                    <div className="md:col-span-2 space-y-6">
                        
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                             <div className="flex border-b border-slate-200 mb-4">
                                <button onClick={() => setActiveTab('appointments')} className={`py-2 px-4 font-bold text-sm border-b-2 ${activeTab==='appointments' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500'}`}>Appointments</button>
                                <button onClick={() => setActiveTab('billing')} className={`py-2 px-4 font-bold text-sm border-b-2 ${activeTab==='billing' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500'}`}>Receipts</button>
                                <button onClick={() => setActiveTab('ledger')} className={`py-2 px-4 font-bold text-sm border-b-2 ${activeTab==='ledger' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500'}`}>Statement</button>
                            </div>
                            
                            {activeTab === 'appointments' && (
                                <div className="space-y-4">
                                    {upcomingAppointments.length > 0 ? upcomingAppointments.map(apt => {
                                        const provider = staff.find(s => s.id === apt.providerId);
                                        const isTelehealth = apt.type === AppointmentType.TELE_DENTISTRY;
                                        return (
                                            <div key={apt.id} className={`p-4 rounded-xl border-l-4 ${isTelehealth ? 'bg-blue-50 border-blue-400' : 'bg-slate-50 border-slate-300'}`}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-bold">{apt.type}</p>
                                                        <p className="text-sm text-slate-500">{formatDate(apt.date)} at {apt.time}</p>
                                                        <p className="text-xs text-slate-400">with {provider?.name}</p>
                                                    </div>
                                                    {isTelehealth && (
                                                        <button onClick={() => handleJoinCall(apt)} className="bg-blue-600 text-white px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 shadow-md hover:bg-blue-700"><Video size={16}/> Join Call</button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }) : <p className="text-slate-500 italic">No upcoming appointments.</p>}
                                </div>
                            )}

                            {activeTab === 'billing' && (
                                <div className="space-y-2">
                                    {billingHistory.length > 0 ? billingHistory.map(receipt => (
                                        <div key={receipt.orNumber} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                                            <div>
                                                <p className="font-bold text-sm">Official Receipt #{receipt.orNumber}</p>
                                                <p className="text-xs text-slate-500">{formatDate(receipt.dateIssued)} - ₱{receipt.amount.toLocaleString()}</p>
                                            </div>
                                            <button className="p-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100"><Download size={16}/></button>
                                        </div>
                                    )) : <p className="text-slate-500 italic text-sm">No receipts on file.</p>}
                                </div>
                            )}

                            {activeTab === 'ledger' && (
                                ledgerHistory.length > 0 ? <ReadOnlyLedger entries={ledgerHistory} /> : <p className="text-slate-500 italic text-sm">No transactions on file.</p>
                            )}
                        </div>
                    </div>

                    {/* Side Panel */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                             <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><DollarSign size={20} className="text-emerald-600"/> Account Balance</h2>
                             <p className={`text-4xl font-extrabold ${patient.currentBalance && patient.currentBalance > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                ₱{(patient.currentBalance || 0).toLocaleString()}
                             </p>
                             <p className="text-sm text-slate-500">outstanding</p>
                             <button className="mt-4 w-full bg-emerald-500 text-white font-bold py-3 rounded-lg hover:bg-emerald-600">
                                 Pay Online
                             </button>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                             <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><Video size={20} className="text-blue-600"/> Tele-dentistry</h2>
                             <p className="text-sm text-slate-500 mb-4">Need a quick follow-up or consultation? Request a virtual appointment.</p>
                             <button onClick={() => setIsTelehealthModalOpen(true)} className="w-full bg-blue-100 text-blue-700 font-bold py-3 rounded-lg hover:bg-blue-200">
                                 Request a Consult
                             </button>
                        </div>
                    </div>
                </div>
            </main>

            {isTelehealthModalOpen && (
                 <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="font-bold text-lg">Request a Virtual Consultation</h3>
                        <p className="text-sm text-slate-500 mt-1 mb-4">Describe your concern, and our team will contact you to schedule a call.</p>
                        <textarea className="w-full p-2 border rounded-lg h-24" placeholder="e.g., My gums are swollen..."></textarea>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setIsTelehealthModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-600 font-bold hover:bg-slate-100">Cancel</button>
                            <button onClick={() => { handleTelehealthRequest(); setIsTelehealthModalOpen(false); }} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold">Send Request</button>
                        </div>
                    </div>
                </div>
            )}
            
            {activeCall && (
                <TelehealthModal 
                    appointment={activeCall.appointment}
                    doctor={activeCall.doctor}
                    patient={patient}
                    onClose={handleEndCall}
                />
            )}
        </div>
    );
};

export default PatientPortal;

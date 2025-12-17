
import React, { useState } from 'react';
import { Patient, Appointment, User, AppointmentType, LedgerEntry, TreatmentPlan, TreatmentPlanStatus } from '../types';
import { LogOut, User as UserIcon, Calendar, DollarSign, Video, Send, CheckCircle, Receipt, Download, ArrowUpRight, ArrowDownLeft, FileText, ClipboardList, ShieldCheck, FileSignature, Sparkles, Database, AlertCircle, FileBox } from 'lucide-react';
import { formatDate } from '../constants';
import TelehealthModal from './TelehealthModal';
import { useToast } from './ToastSystem';
import { jsPDF } from 'jspdf';

interface PatientPortalProps {
    patient: Patient;
    appointments: Appointment[];
    staff: User[];
    onExit: () => void;
}

// ... ReadOnlyLedger component (unchanged) ...
const ReadOnlyLedger: React.FC<{ entries: LedgerEntry[] }> = ({ entries }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
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
    const [activeTab, setActiveTab] = useState<'appointments'|'billing'|'ledger'|'plans'|'forms'>('appointments');
    const [isTelehealthModalOpen, setIsTelehealthModalOpen] = useState(false);
    const [activeCall, setActiveCall] = useState<{ appointment: Appointment, doctor: User } | null>(null);
    const [consentModal, setConsentModal] = useState<{ appointment: Appointment, doctor: User } | null>(null);

    const upcomingAppointments = appointments
        .filter(a => new Date(a.date) >= new Date(new Date().toDateString()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
    const billingHistory = patient.receipts || [];
    const ledgerHistory = patient.ledger || [];
    const approvedPlans = patient.treatmentPlans?.filter(p => p.status === TreatmentPlanStatus.APPROVED) || [];

    const initiateCall = (appointment: Appointment) => {
        const doctor = staff.find(s => s.id === appointment.providerId);
        if (doctor) {
            // Show Consent First
            setConsentModal({ appointment, doctor });
        }
    };

    const confirmConsent = () => {
        if (consentModal) {
            setActiveCall(consentModal);
            setConsentModal(null);
        }
    };

    // --- DPA DATA PORTABILITY HANDLER ---
    const handleRequestData = () => {
        const dataToExport = {
            metadata: {
                exportedAt: new Date().toISOString(),
                source: "dentsched Practice Management",
                compliantWith: "Data Privacy Act (PH)"
            },
            profile: {
                id: patient.id,
                name: patient.name,
                dob: patient.dob,
                email: patient.email,
                phone: patient.phone
            },
            clinical: {
                history: patient.dentalChart || [],
                perio: patient.perioChart || []
            },
            financial: {
                ledger: patient.ledger || [],
                receipts: patient.receipts || []
            },
            appointments: appointments
        };

        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ClinicalData_${patient.surname}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Your clinical data has been prepared for download.");
    };

    // --- CLINICAL ABSTRACT GENERATOR ---
    const handleGenerateAbstract = () => {
        const doc = new jsPDF();
        
        // Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text("CLINICAL ABSTRACT", 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("Generated by dentsched EMR System", 105, 26, { align: 'center' });
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 32, { align: 'center' });

        // Line
        doc.setLineWidth(0.5);
        doc.line(20, 38, 190, 38);

        // Patient Info
        let y = 50;
        doc.setFont('helvetica', 'bold');
        doc.text("PATIENT INFORMATION", 20, y);
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${patient.name}`, 20, y);
        doc.text(`Date of Birth: ${formatDate(patient.dob)} (Age: ${patient.age})`, 120, y);
        y += 6;
        doc.text(`Sex: ${patient.sex}`, 20, y);
        doc.text(`Contact: ${patient.phone}`, 120, y);

        // Clinical Summary
        y += 15;
        doc.setFont('helvetica', 'bold');
        doc.text("CLINICAL SUMMARY", 20, y);
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.text(`Last Visit: ${formatDate(patient.lastVisit)}`, 20, y);
        y += 6;
        
        // Allergies & Conditions
        const allergies = (patient.allergies?.filter(a => a !== 'None') || []).join(', ') || 'None reported';
        const conditions = (patient.medicalConditions?.filter(c => c !== 'None') || []).join(', ') || 'None reported';
        
        doc.text(`Allergies: ${allergies}`, 20, y);
        y += 6;
        doc.text(`Medical Conditions: ${conditions}`, 20, y);
        y += 6;
        if (patient.seriousIllnessDetails) {
            doc.text(`History of Serious Illness: ${patient.seriousIllnessDetails}`, 20, y);
            y += 6;
        }

        // Treatment History (Last 5 procedures)
        y += 10;
        doc.setFont('helvetica', 'bold');
        doc.text("RECENT TREATMENT HISTORY", 20, y);
        y += 8;
        
        const recentProcs = (patient.dentalChart || [])
            .filter(e => e.status === 'Completed')
            .sort((a,b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
            .slice(0, 5);

        if (recentProcs.length > 0) {
            recentProcs.forEach(proc => {
                doc.setFont('helvetica', 'bold');
                doc.text(`${formatDate(proc.date)} - Tooth ${proc.toothNumber}: ${proc.procedure}`, 25, y);
                y += 6;
                if (proc.notes) {
                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(9);
                    doc.text(`Note: ${proc.notes}`, 30, y);
                    doc.setFontSize(10);
                    y += 6;
                }
            });
        } else {
            doc.setFont('helvetica', 'italic');
            doc.text("No recent completed treatments on file.", 25, y);
            y += 6;
        }

        // Footer
        y = 250;
        doc.setLineWidth(0.5);
        doc.line(20, y, 190, y);
        y += 5;
        doc.setFontSize(8);
        doc.text("This document is a computer-generated clinical abstract for informational purposes only.", 105, y, { align: 'center' });
        y += 4;
        doc.text("It does not replace a formal medical certificate signed by a physician.", 105, y, { align: 'center' });

        doc.save(`Clinical_Abstract_${patient.surname}.pdf`);
        toast.success("Clinical Abstract PDF generated.");
    };

    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-20">
            <header className="bg-teal-900 p-4 shadow-md flex justify-between items-center text-white sticky top-0 z-50">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-lilac-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xl">D</span>
                    </div>
                    <div>
                        <h1 className="font-bold tracking-tight text-lg leading-none">Patient Health Portal</h1>
                        <span className="text-xs text-teal-200 font-medium">Hello, {patient.firstName} {patient.surname}</span>
                    </div>
                 </div>
                 <button onClick={onExit} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-800 text-teal-100 text-sm font-bold hover:bg-teal-700 transition-all">
                     <LogOut size={16}/> Logout
                 </button>
            </header>

            <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
                
                {/* Stats Summary Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><DollarSign size={24}/></div>
                        <div><div className="text-[10px] font-bold text-slate-400 uppercase">Balance</div><div className={`text-xl font-extrabold ${patient.currentBalance && patient.currentBalance > 0 ? 'text-red-600' : 'text-slate-800'}`}>₱{(patient.currentBalance || 0).toLocaleString()}</div></div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Calendar size={24}/></div>
                        <div><div className="text-[10px] font-bold text-slate-400 uppercase">Visits</div><div className="text-xl font-extrabold">{appointments.length} Total</div></div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="bg-lilac-100 p-3 rounded-xl text-lilac-600"><ShieldCheck size={24}/></div>
                        <div><div className="text-[10px] font-bold text-slate-400 uppercase">Plans</div><div className="text-xl font-extrabold">{approvedPlans.length} Approved</div></div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="bg-orange-100 p-3 rounded-xl text-orange-600"><Sparkles size={24}/></div>
                        <div><div className="text-[10px] font-bold text-slate-400 uppercase">Care Status</div><div className="text-xl font-extrabold text-slate-800">Healthy</div></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                             <div className="flex bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar">
                                {[
                                    {id: 'appointments', label: 'Visits', icon: Calendar},
                                    {id: 'plans', label: 'My Treatment', icon: ClipboardList},
                                    {id: 'billing', label: 'Receipts', icon: Receipt},
                                    {id: 'ledger', label: 'Statement', icon: FileText},
                                    {id: 'forms', label: 'Tools & Forms', icon: FileSignature}
                                ].map(tab => (
                                    <button 
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)} 
                                        className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === tab.id ? 'border-teal-600 text-teal-700 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}
                                    >
                                        <tab.icon size={16} /> {tab.label}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="p-6">
                                {activeTab === 'appointments' && (
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-slate-800 mb-4">Upcoming Appointments</h3>
                                        {upcomingAppointments.length > 0 ? upcomingAppointments.map(apt => {
                                            const doctor = staff.find(s => s.id === apt.providerId);
                                            return (
                                                <div key={apt.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center hover:bg-slate-100 transition-colors">
                                                    <div>
                                                        <div className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1">{apt.type}</div>
                                                        <div className="text-xl font-bold text-slate-800">{formatDate(apt.date)} at {apt.time}</div>
                                                        <div className="text-sm text-slate-500 mt-1">with {doctor?.name} • {apt.branch}</div>
                                                    </div>
                                                    {apt.type.includes('Tele-dentistry') && (
                                                        <button onClick={() => initiateCall(apt)} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:scale-105 transition-transform"><Video size={18}/> Join Call</button>
                                                    )}
                                                </div>
                                            );
                                        }) : <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 italic">No upcoming appointments found.</div>}
                                    </div>
                                )}

                                {activeTab === 'plans' && (
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-slate-800 mb-4">Your Approved Care Plans</h3>
                                        {approvedPlans.length > 0 ? approvedPlans.map(plan => (
                                            <div key={plan.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="text-xl font-bold text-slate-800">{plan.name}</h4>
                                                        <p className="text-sm text-slate-500">Proposed on {formatDate(plan.createdAt)} by {plan.createdBy}</p>
                                                    </div>
                                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">APPROVED & READY</span>
                                                </div>
                                                <div className="flex gap-3">
                                                    <button className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"><FileText size={18}/> View Full Details</button>
                                                    {plan.signedQuoteUrl && (
                                                        <button className="flex-1 py-3 bg-lilac-100 text-lilac-700 border border-lilac-200 rounded-xl font-bold text-sm hover:bg-lilac-200 transition-colors flex items-center justify-center gap-2"><FileSignature size={18}/> Signed Estimate</button>
                                                    )}
                                                </div>
                                            </div>
                                        )) : <div className="text-center py-10 text-slate-400">No active treatment plans.</div>}
                                    </div>
                                )}

                                {activeTab === 'billing' && (
                                    <div className="space-y-3">
                                        {billingHistory.length > 0 ? billingHistory.map(receipt => (
                                            <div key={receipt.orNumber} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 hover:border-teal-300 transition-colors">
                                                <div>
                                                    <div className="font-bold text-slate-800 flex items-center gap-2"><Receipt size={16} className="text-teal-600"/> Official Receipt #{receipt.orNumber}</div>
                                                    <div className="text-xs text-slate-400 mt-1">{formatDate(receipt.dateIssued)} • ₱{receipt.amount.toLocaleString()}</div>
                                                </div>
                                                <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"><Download size={20}/></button>
                                            </div>
                                        )) : <div className="text-center py-10 text-slate-400">No digital receipts available.</div>}
                                    </div>
                                )}

                                {activeTab === 'ledger' && <ReadOnlyLedger entries={ledgerHistory} />}
                                
                                {activeTab === 'forms' && (
                                    <div className="space-y-6">
                                        <div className="bg-lilac-50 border border-lilac-100 rounded-2xl p-6 text-center">
                                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-lilac-600"><FileSignature size={32}/></div>
                                            <h3 className="text-xl font-bold text-lilac-900">Pre-Visit Health History</h3>
                                            <p className="text-sm text-lilac-700 mt-2 mb-6">Complete your medical history online to skip the paperwork at the front desk!</p>
                                            <button className="px-8 py-3 bg-lilac-600 text-white rounded-xl font-bold shadow-lg shadow-lilac-600/20 hover:scale-105 transition-all">Start Registration Form</button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* NEW: DPA DATA PORTABILITY TOOL */}
                                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="p-3 bg-white rounded-xl text-lilac-600 shadow-sm border border-slate-100"><Database size={24}/></div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-sm">Data Privacy Act (DPA) Request</h4>
                                                        <p className="text-xs text-slate-500 mt-0.5">Exercise your right to data portability. Download your structured history.</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={handleRequestData}
                                                    className="w-full px-4 py-2 bg-white border border-lilac-200 text-lilac-700 font-bold text-xs rounded-xl hover:bg-lilac-50 transition-colors"
                                                >
                                                    Request My Data
                                                </button>
                                            </div>

                                            {/* NEW: CLINICAL ABSTRACT */}
                                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="p-3 bg-white rounded-xl text-teal-600 shadow-sm border border-slate-100"><FileBox size={24}/></div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-sm">Clinical Abstract</h4>
                                                        <p className="text-xs text-slate-500 mt-0.5">Generate a formal PDF summary of your diagnosis and treatments.</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={handleGenerateAbstract}
                                                    className="w-full px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl hover:bg-teal-700 shadow-sm transition-colors"
                                                >
                                                    Generate PDF
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 opacity-50"></div>
                             <h2 className="font-bold text-xl mb-2 flex items-center justify-center gap-2"><DollarSign size={24} className="text-emerald-600"/> Rapid Pay</h2>
                             <p className="text-sm text-slate-500 mb-6">Settled your balance instantly via GCash or Credit Card.</p>
                             <div className="text-4xl font-extrabold text-slate-900 mb-6">₱{(patient.currentBalance || 0).toLocaleString()}</div>
                             <button className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95">Pay Now</button>
                        </div>
                        
                        <div className="bg-teal-900 p-8 rounded-3xl shadow-xl text-white">
                             <h2 className="font-bold text-xl mb-4 flex items-center gap-2 text-teal-300"><Video size={24}/> Tele-dentistry</h2>
                             <p className="text-sm text-teal-100/70 mb-6">Need a consultation or follow-up? Our dentists are available for virtual appointments.</p>
                             <button onClick={() => setIsTelehealthModalOpen(true)} className="w-full bg-white text-teal-900 font-bold py-4 rounded-2xl hover:bg-teal-50 transition-colors">Request a Virtual Call</button>
                        </div>
                    </div>
                </div>
            </main>

            {isTelehealthModalOpen && (
                 <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95">
                        <h3 className="font-bold text-2xl text-slate-800">Virtual Request</h3>
                        <p className="text-sm text-slate-500 mt-2 mb-6">Tell us about your dental concern and preferred time.</p>
                        <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-32 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g., I'm having sensitivity in my upper left molar..."></textarea>
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <button onClick={() => setIsTelehealthModalOpen(false)} className="py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold">Cancel</button>
                            <button onClick={() => { toast.success("Telehealth request sent!"); setIsTelehealthModalOpen(false); }} className="py-4 rounded-2xl bg-teal-600 text-white font-bold shadow-lg shadow-teal-600/20">Send Request</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* --- TELEHEALTH CONSENT MODAL --- */}
            {consentModal && (
                <div className="fixed inset-0 bg-slate-900/70 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
                        <div className="flex items-center gap-3 text-amber-600 mb-4">
                            <AlertCircle size={32} />
                            <h3 className="text-xl font-bold">Telemedicine Consent</h3>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-amber-900 leading-relaxed space-y-3">
                            <p>You are initiating a virtual consultation. Please be aware of the following:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>Limitations:</strong> Remote diagnosis is limited by lack of physical touch and inspection. It is not a substitute for an in-person exam.</li>
                                <li><strong>Connectivity:</strong> Call quality may depend on internet connection.</li>
                                <li><strong>Privacy:</strong> While we use secure channels, online communications carry inherent security risks.</li>
                            </ul>
                            <p className="font-bold mt-2">By proceeding, you acknowledge these limitations and consent to the remote consultation.</p>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setConsentModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl">Cancel</button>
                            <button onClick={confirmConsent} className="flex-[2] py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20">I Consent & Join Call</button>
                        </div>
                    </div>
                </div>
            )}

            {activeCall && <TelehealthModal appointment={activeCall.appointment} doctor={activeCall.doctor} patient={patient} onClose={() => setActiveCall(null)} />}
        </div>
    );
};

export default PatientPortal;

import React, { useMemo } from 'react';
import { Patient, Appointment } from '../types';
import { Clock, FileText, ShieldCheck, MessageSquare, Calendar, DollarSign, Printer, Activity } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface PatientTimelineProps {
    patient: Patient;
    appointments: Appointment[];
}

interface TimelineEvent {
    id: string;
    date: string;
    type: string;
    title: string;
    description: string;
    actor: string;
    icon: React.ElementType;
    color: string;
}

export const PatientTimeline: React.FC<PatientTimelineProps> = ({ patient, appointments }) => {
    const events = useMemo(() => {
        const evts: TimelineEvent[] = [];

        // 1. Clinical Notes
        patient.dentalChart?.forEach(entry => {
            const dateStr = entry.sealedAt || entry.date + 'T00:00:00.000Z';
            evts.push({
                id: entry.id,
                date: dateStr,
                type: 'Clinical',
                title: `Procedure: ${entry.procedure || 'Clinical Note'}`,
                description: `Status: ${entry.status}${entry.toothNumber ? ` | Tooth: ${entry.toothNumber}` : ''}`,
                actor: entry.author || 'Provider',
                icon: Activity,
                color: 'bg-teal-500'
            });
        });

        // 2. Consents
        patient.consentLogs?.forEach((log, index) => {
            evts.push({
                id: `consent_${index}_${log.timestamp}`,
                date: log.timestamp,
                type: 'Consent',
                title: `Consent ${log.status}`,
                description: `Category: ${log.category}`,
                actor: 'Patient',
                icon: ShieldCheck,
                color: 'bg-purple-500'
            });
        });

        // 3. Communications
        patient.communicationLog?.forEach(log => {
            evts.push({
                id: log.id,
                date: log.timestamp,
                type: 'Communication',
                title: `${log.channel} Communication`,
                description: log.content,
                actor: log.authorName || 'System',
                icon: MessageSquare,
                color: 'bg-blue-500'
            });
        });

        // 4. Appointments
        appointments.forEach(apt => {
            const dateStr = apt.date && apt.time ? `${apt.date}T${apt.time}:00.000Z` : apt.date + 'T00:00:00.000Z';
            evts.push({
                id: apt.id,
                date: dateStr,
                type: 'Appointment',
                title: `Appointment ${apt.status}`,
                description: `Type: ${apt.type}`,
                actor: 'System',
                icon: Calendar,
                color: 'bg-amber-500'
            });
        });

        // 5. Financials
        patient.ledger?.forEach(l => {
            const dateStr = l.orDate || l.date + 'T00:00:00.000Z';
            evts.push({
                id: l.id,
                date: dateStr,
                type: 'Financial',
                title: `${l.type}`,
                description: `${l.description} - ₱${l.amount.toLocaleString()}`,
                actor: 'System',
                icon: DollarSign,
                color: 'bg-emerald-500'
            });
        });

        return evts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [patient, appointments]);

    const handleExport = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(`Medico-Legal Timeline: ${patient.name}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

        const tableData = events.map(e => [
            new Date(e.date).toLocaleString(),
            e.type,
            e.title,
            e.description,
            e.actor
        ]);

        (doc as any).autoTable({
            startY: 30,
            head: [['Date/Time', 'Category', 'Event', 'Details', 'Actor']],
            body: tableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [15, 118, 110] }
        });

        doc.save(`Timeline_${patient.name.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50/50 rounded-[3rem] border border-slate-100 overflow-hidden relative shadow-inner">
            <div className="bg-white/80 backdrop-blur-xl p-8 border-b border-slate-100 flex justify-between items-center shadow-sm z-20 sticky top-0">
                <div className="flex items-center gap-6">
                    <div className="p-4 rounded-3xl shadow-xl bg-slate-800 text-white">
                        <Clock size={32}/>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Medico-Legal Timeline</h3>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Chronological Patient Record</p>
                    </div>
                </div>
                <button onClick={handleExport} className="bg-white border-2 border-slate-200 hover:border-slate-800 text-slate-600 hover:text-slate-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 shadow-sm hover:shadow-xl">
                    <Printer size={18}/> Export PDF
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                <div className="relative border-l-2 border-slate-200 ml-6 space-y-8 pb-12">
                    {events.length === 0 ? (
                        <div className="pl-10 text-slate-400 italic font-bold">No events recorded yet.</div>
                    ) : (
                        events.map((event, idx) => {
                            const Icon = event.icon;
                            return (
                                <div key={`${event.id}-${idx}`} className="relative pl-10 animate-in slide-in-from-left-4 fade-in duration-500" style={{ animationDelay: `${Math.min(idx * 50, 1000)}ms` }}>
                                    <div className={`absolute -left-3.5 top-1.5 w-7 h-7 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm ${event.color}`}>
                                        <Icon size={12} className="text-white" />
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest text-white ${event.color}`}>
                                                    {event.type}
                                                </span>
                                                <h4 className="font-bold text-slate-800 text-base">{event.title}</h4>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    {new Date(event.date).toLocaleDateString()}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                                    {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 font-medium">{event.description}</p>
                                        <div className="mt-3 pt-3 border-t border-slate-50 text-xs font-bold text-slate-400 flex items-center gap-1">
                                            <ShieldCheck size={12} /> Logged by: {event.actor}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

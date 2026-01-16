import React from 'react';
import { Patient, Appointment, AppointmentStatus } from '../types';
import { Calendar, Clock, ChevronRight, CalendarPlus, History, Info, Sparkles, Plus } from 'lucide-react';
import { formatDate } from '../constants';

interface PatientAppointmentsViewProps {
  patient: Patient | null;
  appointments: Appointment[];
  onBookAppointment: (id: string) => void;
  onSelectAppointment: (apt: Appointment) => void;
}

const PatientAppointmentsView: React.FC<PatientAppointmentsViewProps> = ({ patient, appointments, onBookAppointment, onSelectAppointment }) => {
  if (!patient) return null;

  const patientAppointments = appointments
    .filter(a => a.patientId === patient.id && !a.isBlock)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const upcoming = patientAppointments.filter(a => [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.ARRIVED].includes(a.status));
  const past = patientAppointments.filter(a => [AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW, AppointmentStatus.CANCELLED].includes(a.status));

  const StatusBadge = ({ status }: { status: AppointmentStatus }) => {
      let colors = 'bg-slate-100 text-slate-600';
      if (status === AppointmentStatus.ARRIVED) colors = 'bg-orange-100 text-orange-700';
      if (status === AppointmentStatus.COMPLETED) colors = 'bg-teal-100 text-teal-700';
      if (status === AppointmentStatus.NO_SHOW) colors = 'bg-red-100 text-red-700';
      return <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-black/5 ${colors}`}>{status}</span>;
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar">
        
        {/* NEXT STEPS */}
        <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 px-1"><Sparkles size={14} className="text-teal-600"/> Upcoming Engagements</h4>
            <div className="space-y-3">
                {upcoming.map(apt => (
                    <button 
                        key={apt.id}
                        onClick={() => onSelectAppointment(apt)}
                        className="w-full text-left p-5 bg-slate-50 border-2 border-transparent hover:border-teal-500 rounded-[2rem] transition-all group shadow-sm hover:shadow-xl"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-black text-teal-700">{formatDate(apt.date)}</span>
                            <StatusBadge status={apt.status} />
                        </div>
                        <div className="text-sm font-black text-slate-800 leading-tight uppercase group-hover:text-teal-900">{apt.type}</div>
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-200/50">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase"><Clock size={12}/> {apt.time}</div>
                            <div className="text-[10px] font-black text-slate-300 uppercase">{apt.durationMinutes}m duration</div>
                        </div>
                    </button>
                ))}
                {upcoming.length === 0 && (
                    <button 
                        onClick={() => onBookAppointment(patient.id)}
                        className="w-full p-8 text-center bg-teal-50 rounded-[2.5rem] border-2 border-dashed border-teal-100 group hover:border-teal-400 transition-all"
                    >
                        <CalendarPlus size={32} className="mx-auto text-teal-400 group-hover:scale-110 transition-transform mb-4"/>
                        <p className="text-[10px] font-black text-teal-800 uppercase tracking-widest">Establish Care Timeline</p>
                        <p className="text-[9px] text-teal-600 font-bold mt-1">Book first clinical session</p>
                    </button>
                )}
            </div>
        </div>

        {/* CLINICAL LOG */}
        <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 px-1"><History size={14} className="text-lilac-600"/> Session Archive</h4>
            <div className="space-y-2">
                {past.map(apt => (
                    <button 
                        key={apt.id}
                        onClick={() => onSelectAppointment(apt)}
                        className="w-full text-left p-4 hover:bg-slate-50 rounded-[1.5rem] transition-all flex justify-between items-center group border border-transparent hover:border-slate-100"
                    >
                        <div className="min-w-0">
                            <div className="text-[10px] font-black text-slate-400 uppercase">{formatDate(apt.date)}</div>
                            <div className="text-xs font-bold text-slate-700 truncate group-hover:text-teal-700 uppercase mt-0.5">{apt.type}</div>
                        </div>
                        <div className="bg-white p-2 rounded-xl shadow-sm group-hover:bg-teal-50 transition-all">
                            <ChevronRight size={14} className="text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5" />
                        </div>
                    </button>
                ))}
                {past.length === 0 && <div className="p-10 text-center text-slate-300 italic text-xs">No historical records found.</div>}
            </div>
        </div>
      </div>
      
      <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Clinical Visits: {patientAppointments.length}</p>
          </div>
          <button 
            onClick={() => onBookAppointment(patient.id)}
            className="p-2.5 bg-teal-600 text-white rounded-xl shadow-lg shadow-teal-600/20 hover:scale-110 active:scale-95 transition-all"
          >
            <Plus size={18}/>
          </button>
      </div>
    </div>
  );
};

export default PatientAppointmentsView;
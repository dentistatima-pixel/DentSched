import React from 'react';
import { Appointment, AppointmentStatus } from '../types';
import { Calendar, CheckCircle, XCircle, UserX, Armchair, UserCheck } from 'lucide-react';
import { formatDate } from '../constants';
import { useStaff } from '../contexts/StaffContext';

interface PatientAppointmentsViewProps {
  appointments: Appointment[];
}

const statusIcons: { [key in AppointmentStatus]: React.ElementType } = {
  [AppointmentStatus.SCHEDULED]: Calendar,
  [AppointmentStatus.CONFIRMED]: Calendar,
  [AppointmentStatus.ARRIVED]: UserCheck,
  [AppointmentStatus.TREATING]: Armchair,
  [AppointmentStatus.COMPLETED]: CheckCircle,
  [AppointmentStatus.CANCELLED]: XCircle,
  [AppointmentStatus.NO_SHOW]: UserX,
};

export const PatientAppointmentsView: React.FC<PatientAppointmentsViewProps> = ({ appointments }) => {
    const { staff } = useStaff();
    const sortedAppointments = [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.time.localeCompare(a.time));

    const upcoming = sortedAppointments.filter(a => new Date(a.date) >= new Date(new Date().toDateString()) && a.status !== AppointmentStatus.CANCELLED && a.status !== AppointmentStatus.COMPLETED && a.status !== AppointmentStatus.NO_SHOW);
    const past = sortedAppointments.filter(a => new Date(a.date) < new Date(new Date().toDateString()) || a.status === AppointmentStatus.COMPLETED || a.status === AppointmentStatus.CANCELLED || a.status === AppointmentStatus.NO_SHOW);

    const AppointmentCard: React.FC<{apt: Appointment, isUpcoming: boolean}> = ({ apt, isUpcoming }) => {
        const provider = staff.find(s => s.id === apt.providerId);
        const Icon = statusIcons[apt.status] || Calendar;
        const statusColor = apt.status === AppointmentStatus.COMPLETED ? 'bg-teal-100 text-teal-700' : 
                            apt.status === AppointmentStatus.CANCELLED || apt.status === AppointmentStatus.NO_SHOW ? 'bg-red-100 text-red-700' :
                            isUpcoming ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600';

        return (
            <div key={apt.id} className={`bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between ${!isUpcoming ? 'opacity-80' : ''}`}>
                <div className="flex items-center gap-4">
                    <Icon size={24} className={isUpcoming ? 'text-teal-600' : 'text-slate-400'}/>
                    <div>
                        <p className={`font-bold ${isUpcoming ? 'text-slate-800' : 'text-slate-600'}`}>{apt.type}</p>
                        <p className="text-xs text-slate-500">{formatDate(apt.date)} at {apt.time} with {provider?.name}</p>
                    </div>
                </div>
                <span className={`text-xs font-black px-3 py-1 rounded-full ${statusColor}`}>{apt.status}</span>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-6">
            <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4">Upcoming & Scheduled</h3>
                {upcoming.length > 0 ? (
                    <div className="space-y-3">
                        {upcoming.map(apt => <AppointmentCard key={apt.id} apt={apt} isUpcoming={true} />)}
                    </div>
                ) : <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-500 italic">No upcoming appointments found.</div>}
            </div>

            <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4">Appointment History</h3>
                 {past.length > 0 ? (
                    <div className="space-y-3">
                        {past.map(apt => <AppointmentCard key={apt.id} apt={apt} isUpcoming={false} />)}
                    </div>
                 ) : <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-500 italic">No past appointments in history.</div>}
            </div>
        </div>
    );
};
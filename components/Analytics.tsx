import React, { useMemo, useState } from 'react';
import { BarChart2, DollarSign, Users, Activity, Percent, UserCheck, User as UserIcon, Building2, ShieldAlert, TrendingUp, PieChart, CalendarX, UserPlus } from 'lucide-react';
import { Patient, Appointment, FieldSettings, AppointmentStatus, User as StaffUser } from '../types';

interface AnalyticsProps {
  patients: Patient[];
  appointments: Appointment[];
  fieldSettings?: FieldSettings;
  staff?: StaffUser[];
}

const K_ANONYMITY_THRESHOLD = 5;

const Analytics: React.FC<AnalyticsProps> = ({ patients, appointments, fieldSettings, staff = [] }) => {
    const [filterProvider, setFilterProvider] = useState('');
    const [filterBranch, setFilterBranch] = useState('');

    const stats = useMemo(() => {
        let filteredAppointments = appointments;
        if (filterProvider) {
            filteredAppointments = filteredAppointments.filter(a => a.providerId === filterProvider);
        }
        if (filterBranch) {
            filteredAppointments = filteredAppointments.filter(a => a.branch === filterBranch);
        }

        const ytdAppointments = filteredAppointments.filter(a => new Date(a.date).getFullYear() === new Date().getFullYear());
        const completedYtd = ytdAppointments.filter(a => a.status === AppointmentStatus.COMPLETED);
        
        const totalRevenue = completedYtd.reduce((sum, apt) => {
            const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
            if (!proc) return sum;
            const priceEntry = fieldSettings?.priceBookEntries?.find(pbe => pbe.procedureId === proc.id);
            return sum + (priceEntry?.price || 0);
        }, 0);

        const newPatientsYtd = patients.filter(p => new Date(p.lastVisit).getFullYear() === new Date().getFullYear() && p.attendanceStats?.totalBooked === 1).length;
        
        const noShowsYtd = ytdAppointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;
        const noShowRate = ytdAppointments.length > 0 ? (noShowsYtd / ytdAppointments.length) * 100 : 0;
        
        const procMix: Record<string, { count: number, revenue: number}> = {};
        completedYtd.forEach(apt => {
            const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
            if (!proc) return;
            const priceEntry = fieldSettings?.priceBookEntries?.find(pbe => pbe.procedureId === proc.id);
            const price = priceEntry?.price || 0;
            const category = proc.category || 'General';
            if (!procMix[category]) procMix[category] = { count: 0, revenue: 0 };
            procMix[category].count++;
            procMix[category].revenue += price;
        });
        const sortedMix = Object.entries(procMix).sort((a,b) => b[1].revenue - a[1].revenue);

        const practitionerProduction: Record<string, { revenue: number, patientCount: number, avg: number, name: string }> = {};
        staff.forEach(s => {
            if (s.role !== 'Dentist') return;
            const staffApts = completedYtd.filter(a => a.providerId === s.id);
            const revenue = staffApts.reduce((sum, apt) => {
                const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
                const priceEntry = fieldSettings?.priceBookEntries?.find(pbe => pbe.procedureId === proc?.id);
                return sum + (priceEntry?.price || 0);
            }, 0);
            practitionerProduction[s.id] = {
                name: s.name,
                revenue,
                patientCount: staffApts.length,
                avg: staffApts.length > 0 ? revenue / staffApts.length : 0
            };
        });
        const sortedPractitioners = Object.values(practitionerProduction).sort((a,b) => b.revenue - a.revenue);


        return { 
            totalRevenue, 
            newPatientsYtd, 
            noShowRate,
            procedureMix: sortedMix,
            practitionerProduction: sortedPractitioners,
        };
    }, [patients, appointments, fieldSettings, staff, filterProvider, filterBranch]);

    const StatCard = ({ title, value, icon: Icon, colorClass, unit = '' }: { title: string, value: string, icon: React.ElementType, colorClass: string, unit?: string }) => (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-6 relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
            <div className={`p-4 rounded-2xl shadow-lg ${colorClass}`} aria-hidden="true">
                <Icon size={28} className="text-white"/>
            </div>
            <div>
                <span className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{title}</span>
                <span className="text-4xl font-black tracking-tighter text-slate-800">
                    {value}
                    <span className="text-2xl font-bold ml-1">{unit}</span>
                </span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500 p-8" role="region" aria-label="Analytics Hub">
            <div>
                <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">Analytics Hub</h1>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Practice Performance Intelligence</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Total Production (YTD)" value={`₱${Math.round(stats.totalRevenue / 1000)}k`} icon={DollarSign} colorClass="bg-teal-600 shadow-teal-600/20" />
                <StatCard title="New Patients (YTD)" value={stats.newPatientsYtd.toString()} icon={UserPlus} colorClass="bg-blue-600 shadow-blue-600/20" />
                <StatCard title="Appointment No-Show Rate" value={stats.noShowRate.toFixed(1)} unit="%" icon={CalendarX} colorClass="bg-red-600 shadow-red-600/20" />
                <StatCard title="Completed Appointments" value={appointments.filter(a => a.status === 'Completed').length.toString()} icon={UserCheck} colorClass="bg-lilac-600 shadow-lilac-600/20" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-6 flex items-center gap-3"><Users size={20} className="text-blue-600"/> Practitioner Production</h3>
                    <div className="space-y-4">
                        {stats.practitionerProduction.map(p => {
                            const maxRevenue = Math.max(...stats.practitionerProduction.map(pr => pr.revenue), 1);
                            const percentage = (p.revenue / maxRevenue) * 100;
                            return (
                                <div key={p.name}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-sm font-bold text-slate-700">{p.name}</span>
                                        <span className="text-sm font-black text-blue-700">₱{p.revenue.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-4 border border-slate-200 shadow-inner">
                                        <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-6 flex items-center gap-3"><PieChart size={20} className="text-lilac-600"/> Procedure Mix by Revenue</h3>
                     <div className="space-y-4">
                        {stats.procedureMix.map(([category, data]) => {
                            const maxRevenue = Math.max(...stats.procedureMix.map(pm => pm[1].revenue), 1);
                            const percentage = (data.revenue / maxRevenue) * 100;
                            return (
                                <div key={category}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-sm font-bold text-slate-700">{category}</span>
                                        <span className="text-sm font-black text-lilac-700">₱{data.revenue.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-4 border border-slate-200 shadow-inner">
                                        <div className="bg-lilac-500 h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;

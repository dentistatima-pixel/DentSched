
import React, { useMemo, useState } from 'react';
import { BarChart2, DollarSign, Users, Activity, Percent, UserCheck, User, Building2 } from 'lucide-react';
import { Patient, Appointment, FieldSettings, AppointmentStatus, User as StaffUser } from '../types';

interface AnalyticsProps {
  patients: Patient[];
  appointments: Appointment[];
  fieldSettings?: FieldSettings;
  staff?: StaffUser[];
}

const Analytics: React.FC<AnalyticsProps> = ({ patients, appointments, fieldSettings, staff }) => {
    const [filterProvider, setFilterProvider] = useState('');
    const [filterBranch, setFilterBranch] = useState('');

    const stats = useMemo(() => {
        // --- FILTERING ---
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
            return sum + (proc?.price || 0);
        }, 0);

        const newPatientsYtd = patients.filter(p => p.lastVisit === 'First Visit' || (p.id.startsWith('p_new_'))).length;
        const avgRevenue = completedYtd.length > 0 ? totalRevenue / completedYtd.length : 0;
        
        const bookedMinutes = ytdAppointments.reduce((sum, apt) => apt.status !== AppointmentStatus.CANCELLED ? sum + apt.durationMinutes : sum, 0);
        const uniqueDays = new Set(ytdAppointments.map(a => a.date)).size;
        const totalCapacityMinutes = uniqueDays * 8 * 60; 
        const utilization = totalCapacityMinutes > 0 ? (bookedMinutes / totalCapacityMinutes) * 100 : 0;
        
        const patientsWithHistory = patients.filter(p => p.lastVisit !== 'First Visit');
        const returningPatients = patientsWithHistory.filter(p => (p.ledger?.length || 0) > 1).length;
        const retentionRate = patientsWithHistory.length > 0 ? (returningPatients / patientsWithHistory.length) * 100 : 0;

        const procMix: Record<string, { count: number, revenue: number}> = {};
        completedYtd.forEach(apt => {
            const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
            if (!proc) return;
            const category = proc.category || 'General';
            if (!procMix[category]) procMix[category] = { count: 0, revenue: 0 };
            procMix[category].count++;
            procMix[category].revenue += proc.price;
        });
        const sortedMix = Object.entries(procMix).sort((a,b) => b[1].revenue - a[1].revenue);

        return { totalRevenue, newPatientsYtd, avgRevenue, utilization, retentionRate, procedureMix: sortedMix };
    }, [patients, appointments, fieldSettings, filterProvider, filterBranch]);

    const StatCard = ({ title, value, icon: Icon, colorClass, unit = '' }: { title: string, value: string, icon: React.ElementType, colorClass: string, unit?: string}) => (
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4`}>
            <div className={`p-3 rounded-xl ${colorClass}`}><Icon size={24} className="text-white"/></div>
            <div>
                <span className="block text-sm font-bold text-slate-500">{title}</span>
                <span className="text-3xl font-bold text-slate-800">{value}<span className="text-xl font-bold">{unit}</span></span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6">
            {/* --- FILTERS --- */}
            <div className="flex gap-4 bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><User size={12}/> Provider</label>
                    <select value={filterProvider} onChange={e => setFilterProvider(e.target.value)} className="w-full bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1">
                        <option value="">All Providers</option>
                        {staff?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                 <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Building2 size={12}/> Branch</label>
                    <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="w-full bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1">
                        <option value="">All Branches</option>
                        {fieldSettings?.branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Revenue (YTD)" value={`₱${Math.round(stats.totalRevenue / 1000)}k`} icon={DollarSign} colorClass="bg-emerald-500" />
                <StatCard title="New Patients (YTD)" value={stats.newPatientsYtd.toString()} icon={Users} colorClass="bg-blue-500" />
                <StatCard title="Avg. Revenue / Visit" value={`₱${stats.avgRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})}`} icon={Activity} colorClass="bg-violet-500" />
                <StatCard title="Chair Utilization" value={stats.utilization.toFixed(1)} unit="%" icon={Percent} colorClass="bg-amber-500" />
                <StatCard title="Patient Retention" value={stats.retentionRate.toFixed(1)} unit="%" icon={UserCheck} colorClass="bg-teal-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-bold text-lg mb-4">Production vs. Collections</h3>
                     <div className="flex items-center justify-center h-full min-h-[250px] bg-slate-50 rounded-lg text-slate-400 italic">
                        Production vs Collections Chart Placeholder
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-bold text-lg mb-4">Procedure Mix (by Revenue)</h3>
                    <div className="space-y-4">
                        {stats.procedureMix.map(([category, data]) => {
                            const percentage = stats.totalRevenue > 0 ? (data.revenue / stats.totalRevenue) * 100 : 0;
                            return (
                                <div key={category}>
                                    <div className="flex justify-between text-sm font-bold mb-1">
                                        <span className="text-slate-600">{category}</span>
                                        <span className="text-slate-800">₱{data.revenue.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                                        <div className="bg-teal-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;

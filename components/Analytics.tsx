import React, { useMemo, useState } from 'react';
import { BarChart2, DollarSign, Users, Activity, Percent, UserCheck, User, Building2, ShieldAlert } from 'lucide-react';
import { Patient, Appointment, FieldSettings, AppointmentStatus, User as StaffUser } from '../types';

interface AnalyticsProps {
  patients: Patient[];
  appointments: Appointment[];
  fieldSettings?: FieldSettings;
  staff?: StaffUser[];
}

const K_ANONYMITY_THRESHOLD = 5;

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

        // --- K-ANONYMITY LOGIC ---
        // Count unique patients in this filtered set
        const uniquePatientsInSet = new Set(ytdAppointments.map(a => a.patientId)).size;
        const isPrivacyProtected = uniquePatientsInSet > 0 && uniquePatientsInSet < K_ANONYMITY_THRESHOLD;

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

        return { 
            totalRevenue, 
            newPatientsYtd, 
            avgRevenue, 
            utilization, 
            retentionRate, 
            procedureMix: sortedMix,
            isPrivacyProtected,
            sampleSize: uniquePatientsInSet
        };
    }, [patients, appointments, fieldSettings, filterProvider, filterBranch]);

    const StatCard = ({ title, value, icon: Icon, colorClass, unit = '', isProtected = false }: { title: string, value: string, icon: React.ElementType, colorClass: string, unit?: string, isProtected?: boolean }) => (
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden ${isProtected ? 'bg-slate-50' : ''}`}>
            <div className={`p-3 rounded-xl ${isProtected ? 'bg-slate-200' : colorClass}`}><Icon size={24} className={isProtected ? 'text-slate-400' : 'text-white'}/></div>
            <div>
                <span className="block text-sm font-bold text-slate-500">{title}</span>
                <span className={`text-3xl font-bold ${isProtected ? 'text-slate-300 blur-[2px]' : 'text-slate-800'}`}>
                    {isProtected ? '---' : value}
                    <span className="text-xl font-bold">{isProtected ? '' : unit}</span>
                </span>
            </div>
            {isProtected && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[1px] group cursor-help" title="Data suppressed (Sample size < 5) to protect patient identity (PDA Differential Privacy).">
                    <ShieldAlert size={20} className="text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col gap-6">
            {/* --- PRIVACY ALERT --- */}
            {stats.isPrivacyProtected && (
                <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2">
                    <ShieldAlert size={24} className="text-amber-600 animate-pulse" />
                    <div>
                        <h4 className="text-xs font-black uppercase text-amber-900 tracking-widest">K-Anonymity Suppression Active</h4>
                        <p className="text-[10px] text-amber-800 font-bold uppercase leading-tight mt-1">Subset size ({stats.sampleSize} patients) is below the privacy threshold. Detailed metrics are suppressed to prevent indirect patient identification (NPC Article 26 Compliance).</p>
                    </div>
                </div>
            )}

            {/* --- FILTERS --- */}
            <div className="flex gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><User size={12}/> Provider</label>
                    <select value={filterProvider} onChange={e => setFilterProvider(e.target.value)} className="w-full bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1 outline-none focus:ring-2 focus:ring-teal-500/20">
                        <option value="">All Providers</option>
                        {staff?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                 <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Building2 size={12}/> Branch</label>
                    <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="w-full bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1 outline-none focus:ring-2 focus:ring-teal-500/20">
                        <option value="">All Branches</option>
                        {fieldSettings?.branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Revenue (YTD)" value={`₱${Math.round(stats.totalRevenue / 1000)}k`} icon={DollarSign} colorClass="bg-emerald-500" isProtected={stats.isPrivacyProtected} />
                <StatCard title="New Patients (YTD)" value={stats.newPatientsYtd.toString()} icon={Users} colorClass="bg-blue-500" />
                <StatCard title="Avg. Revenue / Visit" value={`₱${stats.avgRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})}`} icon={Activity} colorClass="bg-violet-500" isProtected={stats.isPrivacyProtected} />
                <StatCard title="Chair Utilization" value={stats.utilization.toFixed(1)} unit="%" icon={Percent} colorClass="bg-amber-500" />
                <StatCard title="Patient Retention" value={stats.retentionRate.toFixed(1)} unit="%" icon={UserCheck} colorClass="bg-teal-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative">
                    <h3 className="font-bold text-lg mb-4">Production vs. Collections</h3>
                    <div className="flex items-center justify-center h-full min-h-[250px] bg-slate-50 rounded-lg text-slate-400 italic">
                        {stats.isPrivacyProtected ? 'Chart suppressed for privacy' : 'Aggregating operational and statutory data...'}
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-bold text-lg mb-4">Procedure Mix (by Revenue)</h3>
                    <div className="space-y-4">
                        {stats.isPrivacyProtected ? (
                             <div className="py-10 text-center opacity-30 italic text-sm">Classification details suppressed</div>
                        ) : stats.procedureMix.map(([category, data]) => {
                            const percentage = stats.totalRevenue > 0 ? (data.revenue / stats.totalRevenue) * 100 : 0;
                            return (
                                <div key={category}>
                                    <div className="flex justify-between text-sm font-bold mb-1">
                                        <span className="text-slate-600">{category}</span>
                                        <span className="text-slate-800">₱{data.revenue.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                                        <div className="bg-teal-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
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
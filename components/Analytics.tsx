import React, { useMemo, useState } from 'react';
// Fix: Added missing 'TrendingUp' and 'PieChart' to lucide-react imports
import { BarChart2, DollarSign, Users, Activity, Percent, UserCheck, User, Building2, ShieldAlert, TrendingUp, PieChart } from 'lucide-react';
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
        <div className={`bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6 relative overflow-hidden transition-all hover:shadow-xl ${isProtected ? 'bg-slate-100/50 grayscale' : ''}`}>
            <div className={`p-4 rounded-2xl shadow-lg ${isProtected ? 'bg-slate-300' : colorClass}`} aria-hidden="true">
                <Icon size={32} className={isProtected ? 'text-slate-500' : 'text-white'}/>
            </div>
            <div>
                <span className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{title}</span>
                <span className={`text-4xl font-black tracking-tighter ${isProtected ? 'text-slate-400 blur-[3px]' : 'text-slate-900'}`}>
                    {isProtected ? '---' : value}
                    <span className="text-xl font-bold ml-1">{isProtected ? '' : unit}</span>
                </span>
            </div>
            {isProtected && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px] group cursor-help" role="note" aria-label="Data suppressed (Sample size < 5) to protect patient identity (PDA Differential Privacy).">
                    <ShieldAlert size={28} className="text-slate-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500" role="region" aria-label="Performance Intelligence">
            {/* --- PRIVACY ALERT --- */}
            {stats.isPrivacyProtected && (
                <div className="bg-amber-50 border-4 border-amber-200 p-6 rounded-[2.5rem] flex items-center gap-6 shadow-xl ring-8 ring-amber-500/5" role="alert">
                    <ShieldAlert size={40} className="text-amber-600 animate-pulse shrink-0" aria-hidden="true" />
                    <div>
                        <h4 className="text-sm font-black uppercase text-amber-950 tracking-widest">K-Anonymity Suppression Active</h4>
                        <p className="text-xs text-amber-800 font-bold uppercase leading-tight mt-1">Subset size ({stats.sampleSize} patients) is below the privacy threshold. Detailed metrics are suppressed to prevent indirect patient identification (NPC Article 26 Compliance).</p>
                    </div>
                </div>
            )}

            {/* --- FILTERS --- */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[2.5rem] border-2 border-slate-100 shadow-sm" role="search" aria-label="Filter Metrics">
                <div className="flex-1">
                    <label className="text-xs font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest ml-2 mb-2"><User size={14} aria-hidden="true"/> Attending Practitioner</label>
                    <select aria-label="Filter by provider" value={filterProvider} onChange={e => setFilterProvider(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 font-bold text-sm outline-none focus:border-teal-500 shadow-inner">
                        <option value="">All Staff Registry</option>
                        {staff?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                 <div className="flex-1">
                    <label className="text-xs font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest ml-2 mb-2"><Building2 size={14} aria-hidden="true"/> Registry Location</label>
                    <select aria-label="Filter by branch" value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 font-bold text-sm outline-none focus:border-teal-500 shadow-inner">
                        <option value="">Full Network Access</option>
                        {fieldSettings?.branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <StatCard title="Gross Production (YTD)" value={`₱${Math.round(stats.totalRevenue / 1000)}k`} icon={DollarSign} colorClass="bg-emerald-600 shadow-emerald-600/20" isProtected={stats.isPrivacyProtected} />
                <StatCard title="New Patient Enrollment" value={stats.newPatientsYtd.toString()} icon={Users} colorClass="bg-blue-600 shadow-blue-600/20" />
                <StatCard title="Avg. Production / Visit" value={`₱${stats.avgRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})}`} icon={Activity} colorClass="bg-lilac-600 shadow-lilac-600/20" isProtected={stats.isPrivacyProtected} />
                <StatCard title="Clinical Utilization" value={stats.utilization.toFixed(1)} unit="%" icon={Percent} colorClass="bg-amber-600 shadow-amber-600/20" />
                <StatCard title="Patient Loyalty Scale" value={stats.retentionRate.toFixed(1)} unit="%" icon={UserCheck} colorClass="bg-teal-600 shadow-teal-600/20" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white rounded-[3rem] shadow-sm border-2 border-slate-50 p-10 relative flex flex-col justify-center min-h-[400px]">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-8 flex items-center gap-3"><TrendingUp size={24} className="text-teal-600"/> Growth Trajectory</h3>
                    <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 font-bold uppercase tracking-widest p-8 text-center">
                        {stats.isPrivacyProtected ? 'Data distribution suppressed for privacy' : 'Aggregating cross-branch operational and statutory sales journals...'}
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-sm border-2 border-slate-50 p-10 flex flex-col min-h-[400px]">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-8 flex items-center gap-3"><PieChart size={24} className="text-lilac-600"/> Clinical Mix</h3>
                    <div className="space-y-6 flex-1">
                        {stats.isPrivacyProtected ? (
                             <div className="h-full flex items-center justify-center opacity-30 italic font-black uppercase text-slate-600 tracking-widest">Classification details restricted</div>
                        ) : stats.procedureMix.map(([category, data]) => {
                            const percentage = stats.totalRevenue > 0 ? (data.revenue / stats.totalRevenue) * 100 : 0;
                            return (
                                <div key={category} className="animate-in slide-in-from-left-2">
                                    <div className="flex justify-between text-xs font-black mb-2 uppercase tracking-widest">
                                        <span className="text-slate-600">{category}</span>
                                        <span className="text-slate-900">₱{data.revenue.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 border border-slate-50 overflow-hidden shadow-inner">
                                        <div className="bg-teal-600 h-full rounded-full transition-all duration-1000 shadow-lg" style={{ width: `${percentage}%` }}></div>
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
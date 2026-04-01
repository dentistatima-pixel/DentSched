// Force rebuild
import React, { useMemo, useState } from 'react';
import { DollarSign, Users, PieChart, CalendarX, UserPlus, TrendingUp, Calculator, BarChart2, CheckSquare, Clock } from 'lucide-react';
import { Patient, Appointment, FieldSettings, AppointmentStatus, User as StaffUser, PriceBookEntry, StockItem, LedgerEntry } from '../types';
import { PricingIntelligence } from './financial/PricingIntelligence';

interface AnalyticsProps {
  patients: Patient[];
  appointments: Appointment[];
  fieldSettings?: FieldSettings;
  staff?: StaffUser[];
  stockItems?: StockItem[];
  ledger?: LedgerEntry[];
  providerId?: string;
}

const Analytics: React.FC<AnalyticsProps> = ({ patients, appointments, fieldSettings, staff = [], stockItems = [], ledger = [], providerId }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'pricing'>('overview');
    
    const stats = useMemo(() => {
        let filteredAppointments = appointments;
        if (providerId) {
            filteredAppointments = appointments.filter(a => a.providerId === providerId);
        }

        const ytdAppointments = filteredAppointments.filter(a => new Date(a.date).getFullYear() === new Date().getFullYear());
        const completedYtd = ytdAppointments.filter(a => a.status === AppointmentStatus.COMPLETED);
        
        const totalRevenue = completedYtd.reduce((sum, apt) => {
            const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
            if (!proc) return sum;
            const priceEntry = fieldSettings?.priceBookEntries?.find((pbe: PriceBookEntry) => pbe.procedureId === proc.id);
            return sum + (priceEntry?.price || 0);
        }, 0);

        const newPatientsYtd = patients.filter(p => new Date(p.lastVisit).getFullYear() === new Date().getFullYear() && p.attendanceStats?.totalBooked === 1).length;
        
        const noShowsYtd = ytdAppointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;
        const noShowRate = ytdAppointments.length > 0 ? (noShowsYtd / ytdAppointments.length) * 100 : 0;
        
        const procMix: Record<string, { count: number, revenue: number}> = {};
        completedYtd.forEach(apt => {
            const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
            if (!proc) return;
            const priceEntry = fieldSettings?.priceBookEntries?.find((pbe: PriceBookEntry) => pbe.procedureId === proc.id);
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
                const priceEntry = fieldSettings?.priceBookEntries?.find((pbe: PriceBookEntry) => pbe.procedureId === proc?.id);
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

        // Revenue Forecasting
        let projectedRevenue = 0;
        let totalProposedPlans = 0;
        let totalAcceptedPlans = 0;

        patients.forEach(p => {
            if (!p.treatmentPlans || !p.dentalChart) return;
            
            p.treatmentPlans.forEach(plan => {
                if (plan.status !== 'Draft') {
                    totalProposedPlans++;
                    if (['Approved', 'Completed', 'Reconfirmed'].includes(plan.status)) {
                        totalAcceptedPlans++;
                    }
                }
            });

            const activePlans = p.treatmentPlans.filter(tp => 
                tp.status === 'Approved' || 
                tp.status === 'Pending Financial Consent' || 
                tp.status === 'Pending Review' ||
                tp.status === 'Draft'
            );
            activePlans.forEach(plan => {
                const planItems = p.dentalChart!.filter(item => item.planId === plan.id && item.status !== 'Completed');
                projectedRevenue += planItems.reduce((sum, item) => sum + (item.price || 0), 0);
            });
        });

        const treatmentAcceptanceRate = totalProposedPlans > 0 ? (totalAcceptedPlans / totalProposedPlans) * 100 : 0;

        // Chair Time Utilization
        let totalScheduledMinutes = 0;
        let totalActualMinutes = 0;
        let appointmentsWithActualTimes = 0;

        completedYtd.forEach(apt => {
            if (apt.actualStartTime && apt.actualEndTime) {
                const start = new Date(apt.actualStartTime).getTime();
                const end = new Date(apt.actualEndTime).getTime();
                const actualDuration = (end - start) / (1000 * 60); // in minutes
                
                if (actualDuration > 0) {
                    totalScheduledMinutes += apt.durationMinutes;
                    totalActualMinutes += actualDuration;
                    appointmentsWithActualTimes++;
                }
            }
        });

        const chairTimeUtilization = totalScheduledMinutes > 0 ? (totalActualMinutes / totalScheduledMinutes) * 100 : 0;

        return { 
            totalRevenue, 
            newPatientsYtd, 
            noShowRate,
            procedureMix: sortedMix,
            practitionerProduction: sortedPractitioners,
            projectedRevenue,
            treatmentAcceptanceRate,
            chairTimeUtilization,
            appointmentsWithActualTimes
        };
    }, [patients, appointments, fieldSettings, staff, providerId]);

    const StatCard = ({ title, value, icon: Icon, colorClass, unit = '' }: { title: string, value: string, icon: React.ElementType, colorClass: string, unit?: string }) => (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-visible transition-all hover:shadow-xl hover:-translate-y-1 min-w-[240px]">
            <div className={`p-4 rounded-2xl shadow-lg ${colorClass} shrink-0`} aria-hidden="true">
                <Icon size={28} className="text-white"/>
            </div>
            <div className="min-w-0">
                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{title}</span>
                <span className="text-3xl font-black tracking-tighter text-slate-800 block">
                    {value}
                    <span className="text-xl font-bold ml-1">{unit}</span>
                </span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500 p-8" role="region" aria-label="Analytics">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">Analytics</h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Business Intelligence</p>
                </div>
                
                <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex gap-2 overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('overview')} 
                        className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <BarChart2 size={16} /> Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('pricing')} 
                        className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'pricing' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Calculator size={16} /> Pricing Breakdown
                    </button>
                </div>
            </div>

            {activeTab === 'overview' && (
                <>
                    <div className="grid grid-cols-1 gap-6 pr-8 overflow-visible">
                        <StatCard title="Total Production (YTD)" value={`₱${Math.round(stats.totalRevenue / 1000)}k`} icon={DollarSign} colorClass="bg-teal-600 shadow-teal-600/20" />
                        <StatCard title="Projected Revenue" value={`₱${Math.round(stats.projectedRevenue / 1000)}k`} icon={TrendingUp} colorClass="bg-emerald-600 shadow-emerald-600/20" />
                        <StatCard title="Treatment Acceptance" value={stats.treatmentAcceptanceRate.toFixed(1)} unit="%" icon={CheckSquare} colorClass="bg-indigo-600 shadow-indigo-600/20" />
                        <StatCard title="Chair Time Utilization" value={stats.chairTimeUtilization.toFixed(1)} unit="%" icon={Clock} colorClass="bg-amber-600 shadow-amber-600/20" />
                        <StatCard title="New PT (YTD)" value={stats.newPatientsYtd.toString()} icon={UserPlus} colorClass="bg-blue-600 shadow-blue-600/20" />
                        <StatCard title="No-Show Rate" value={stats.noShowRate.toFixed(1)} unit="%" icon={CalendarX} colorClass="bg-red-600 shadow-red-600/20" />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-6 flex items-center gap-3"><Users size={20} className="text-blue-600"/> Staff Performance</h3>
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
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-6 flex items-center gap-3"><PieChart size={20} className="text-lilac-600"/> Revenue by Procedure</h3>
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
                </>
            )}

            {activeTab === 'pricing' && (
                <PricingIntelligence 
                    procedures={fieldSettings?.procedures || []}
                    stockItems={stockItems}
                    ledger={ledger}
                />
            )}
        </div>
    );
};

export default Analytics;

import React, { useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { Appointment, LedgerEntry, Expense, ProcedureItem, User, TreatmentPlan } from '../../types';
import { ProviderPerformance } from './ProviderPerformance';
import { CaseAcceptance } from './CaseAcceptance';

interface FinancialAnalyticsDashboardProps {
    appointments: Appointment[];
    ledger: LedgerEntry[];
    expenses: Expense[];
    procedures: ProcedureItem[];
    staff: User[];
    treatmentPlans: TreatmentPlan[];
}

export const FinancialAnalyticsDashboard: React.FC<FinancialAnalyticsDashboardProps> = ({ 
    appointments, ledger, expenses, procedures, staff, treatmentPlans 
}) => {
    const metrics = useMemo(() => {
        // 1. Production vs Collections
        const totalProduction = ledger
            .filter(l => l.type === 'Charge')
            .reduce((sum, l) => sum + l.amount, 0);
            
        const totalCollections = ledger
            .filter(l => l.type === 'Payment')
            .reduce((sum, l) => sum + l.amount, 0);

        const collectionEfficiency = totalProduction > 0 
            ? (totalCollections / totalProduction) * 100 
            : 0;

        // 2. Expenses & Burn Rate
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const netIncome = totalCollections - totalExpenses;
        const profitMargin = totalCollections > 0 
            ? (netIncome / totalCollections) * 100 
            : 0;

        // 3. Procedure Profitability
        const procedureStats = procedures.map(proc => {
            const procLedgerEntries = ledger.filter(l => l.procedureId === proc.id && l.type === 'Charge');
            const revenue = procLedgerEntries.reduce((sum, l) => sum + l.amount, 0);
            const count = procLedgerEntries.length;
            
            // Calculate costs (Material + Lab)
            // Note: In a real app, we'd sum actual costs from ledger entries if available,
            // or estimate based on BOM. Here we use the ledger's cost fields if present.
            const cost = procLedgerEntries.reduce((sum, l) => sum + (l.materialCost || 0) + (l.labFee || 0), 0);
            
            return {
                name: proc.name,
                revenue,
                cost,
                profit: revenue - cost,
                count
            };
        }).sort((a, b) => b.revenue - a.revenue).slice(0, 5); // Top 5

        return {
            totalProduction,
            totalCollections,
            collectionEfficiency,
            totalExpenses,
            netIncome,
            profitMargin,
            procedureStats
        };
    }, [appointments, ledger, expenses, procedures]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Production</p>
                            <h3 className="text-2xl font-black text-slate-800 mt-1">₱{metrics.totalProduction.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Activity size={20} />
                        </div>
                    </div>
                    <div className="text-xs text-slate-500">Total value of services rendered</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collections</p>
                            <h3 className="text-2xl font-black text-emerald-600 mt-1">₱{metrics.totalCollections.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${metrics.collectionEfficiency >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {metrics.collectionEfficiency.toFixed(1)}% Efficiency
                        </span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expenses</p>
                            <h3 className="text-2xl font-black text-rose-600 mt-1">₱{metrics.totalExpenses.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                            <TrendingDown size={20} />
                        </div>
                    </div>
                    <div className="text-xs text-slate-500">Operational costs & overhead</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Income</p>
                            <h3 className={`text-2xl font-black mt-1 ${metrics.netIncome >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                                ₱{metrics.netIncome.toLocaleString()}
                            </h3>
                        </div>
                        <div className={`p-2 rounded-lg ${metrics.netIncome >= 0 ? 'bg-slate-100 text-slate-600' : 'bg-rose-50 text-rose-600'}`}>
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div className="text-xs text-slate-500">{metrics.profitMargin.toFixed(1)}% Profit Margin</div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Production vs Collections Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Overview</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Production', value: metrics.totalProduction },
                                { name: 'Collections', value: metrics.totalCollections },
                                { name: 'Expenses', value: metrics.totalExpenses }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} tickFormatter={(value: number) => `₱${value/1000}k`} />
                                <Tooltip 
                                    cursor={{fill: '#F1F5F9'}}
                                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {
                                        [metrics.totalProduction, metrics.totalCollections, metrics.totalExpenses].map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 2 ? '#F43F5E' : index === 1 ? '#10B981' : '#3B82F6'} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Procedures by Revenue */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Top Procedures (Revenue)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={metrics.procedureStats}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} tickFormatter={(value: number) => `₱${value/1000}k`} />
                                <YAxis dataKey="name" type="category" width={150} axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                                <Tooltip 
                                    cursor={{fill: '#F1F5F9'}}
                                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                />
                                <Bar dataKey="revenue" fill="#8884d8" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Provider Performance & Case Acceptance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProviderPerformance 
                    appointments={appointments} 
                    staff={staff} 
                    procedures={procedures} 
                />
                <CaseAcceptance 
                    treatmentPlans={treatmentPlans} 
                />
            </div>
        </div>
    );
};

import React, { useMemo } from 'react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import { TreatmentPlan, TreatmentPlanStatus } from '../../types';

interface CaseAcceptanceProps {
    treatmentPlans: TreatmentPlan[];
}

export const CaseAcceptance: React.FC<CaseAcceptanceProps> = ({ treatmentPlans }) => {
    const metrics = useMemo(() => {
        const stats = {
            presented: 0,
            accepted: 0,
            rejected: 0,
            pending: 0,
            unscheduledValue: 0,
            acceptedValue: 0
        };

        treatmentPlans.forEach(plan => {
            const value = plan.originalQuoteAmount || 0;
            stats.presented += value;

            if (plan.status === TreatmentPlanStatus.APPROVED || plan.status === TreatmentPlanStatus.COMPLETED) {
                stats.accepted += value;
                stats.acceptedValue += value;
            } else if (plan.status === TreatmentPlanStatus.REJECTED) {
                stats.rejected += value;
            } else {
                stats.pending += value;
                stats.unscheduledValue += value;
            }
        });

        const acceptanceRate = stats.presented > 0 ? (stats.acceptedValue / stats.presented) * 100 : 0;

        return { ...stats, acceptanceRate };
    }, [treatmentPlans]);

    const chartData = [
        { name: 'Accepted', value: metrics.acceptedValue, color: '#10B981' },
        { name: 'Pending', value: metrics.pending, color: '#F59E0B' },
        { name: 'Rejected', value: metrics.rejected, color: '#EF4444' },
    ];

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Case Acceptance</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="h-[250px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number | undefined) => `₱${(value || 0).toLocaleString()}`} />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="text-2xl font-black text-slate-800">{metrics.acceptanceRate.toFixed(1)}%</div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Acceptance</div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Presented</div>
                        <div className="text-xl font-black text-slate-800">₱{metrics.presented.toLocaleString()}</div>
                    </div>
                    
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Accepted Value</div>
                        <div className="text-xl font-black text-emerald-700">₱{metrics.acceptedValue.toLocaleString()}</div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Unscheduled Opportunity</div>
                        <div className="text-xl font-black text-amber-700">₱{metrics.unscheduledValue.toLocaleString()}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

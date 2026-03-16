import React, { useState, useMemo } from 'react';
import { 
    Search, TrendingUp, TrendingDown, Calculator, DollarSign, Clock 
} from 'lucide-react';
import { ProcedureItem, StockItem, LedgerEntry } from '../../types';

interface PricingIntelligenceProps {
    procedures: ProcedureItem[];
    stockItems: StockItem[];
    ledger: LedgerEntry[];
}

export const PricingIntelligence: React.FC<PricingIntelligenceProps> = ({ 
    procedures, stockItems, ledger 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [simulationMode, setSimulationMode] = useState(false);
    const [priceAdjustment, setPriceAdjustment] = useState<Record<string, number>>({});
    
    // Overhead Configuration
    const [monthlyFixedExpenses, setMonthlyFixedExpenses] = useState(150000); // Default placeholder
    const [monthlyClinicalHours, setMonthlyClinicalHours] = useState(160); // Default 40hrs/week
    
    const hourlyOverheadRate = useMemo(() => {
        return monthlyClinicalHours > 0 ? monthlyFixedExpenses / monthlyClinicalHours : 0;
    }, [monthlyFixedExpenses, monthlyClinicalHours]);

    const analysisData = useMemo(() => {
        return procedures.map(proc => {
            // 1. Calculate Average Realized Rate (ARR)
            const procLedgerEntries = ledger.filter(l => l.procedureId === proc.id && l.type === 'Charge');
            const totalRevenue = procLedgerEntries.reduce((sum, l) => sum + l.amount, 0);
            const volume = procLedgerEntries.length;
            const averageRealizedRate = volume > 0 ? totalRevenue / volume : proc.defaultPrice;

            // 2. Calculate Material Cost from BOM
            let materialCost = 0;
            if (proc.billOfMaterials) {
                materialCost = proc.billOfMaterials.reduce((sum, item) => {
                    const stockItem = stockItems.find(s => s.id === item.stockItemId);
                    return sum + (stockItem?.unitCost || 0) * item.quantity;
                }, 0);
            }

            // 3. Lab Fee Estimate
            const labFeeEstimate = proc.defaultLabFee || 0;

            // 4. Overhead Allocation
            // Overhead per procedure = (Duration in Hours) * Hourly Rate
            const overheadCost = (proc.defaultDurationMinutes / 60) * hourlyOverheadRate;

            // 5. True Margin
            const totalCost = materialCost + labFeeEstimate + overheadCost;
            const trueMargin = averageRealizedRate - totalCost;
            const marginPercentage = averageRealizedRate > 0 ? (trueMargin / averageRealizedRate) * 100 : 0;

            return {
                id: proc.id,
                name: proc.name,
                category: proc.category,
                standardFee: proc.defaultPrice,
                averageRealizedRate,
                materialCost,
                labFeeEstimate,
                overheadCost,
                totalCost,
                trueMargin,
                marginPercentage,
                volume
            };
        }).filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [procedures, stockItems, ledger, searchTerm, hourlyOverheadRate]);

    const handleSimulatedPriceChange = (id: string, newPrice: number) => {
        setPriceAdjustment(prev => ({ ...prev, [id]: newPrice }));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Calculator className="text-indigo-600" />
                        Pricing Intelligence
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Analyze profitability with overhead, lab fees, and material costs.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search procedures..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button 
                        onClick={() => setSimulationMode(!simulationMode)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            simulationMode 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {simulationMode ? 'Exit Simulation' : 'Simulate Pricing'}
                    </button>
                </div>
            </div>

            {/* Overhead Configuration Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <DollarSign size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Monthly Fixed Expenses</span>
                    </div>
                    <input 
                        type="number" 
                        value={monthlyFixedExpenses}
                        onChange={(e) => setMonthlyFixedExpenses(parseFloat(e.target.value) || 0)}
                        className="text-2xl font-black text-slate-800 bg-transparent border-none focus:ring-0 p-0 w-full"
                    />
                    <p className="text-xs text-slate-400 mt-1">Rent, Salaries, Utilities, etc.</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <Clock size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Monthly Clinical Hours</span>
                    </div>
                    <input 
                        type="number" 
                        value={monthlyClinicalHours}
                        onChange={(e) => setMonthlyClinicalHours(parseFloat(e.target.value) || 0)}
                        className="text-2xl font-black text-slate-800 bg-transparent border-none focus:ring-0 p-0 w-full"
                    />
                    <p className="text-xs text-slate-400 mt-1">Total hours available for treatment</p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-indigo-600 mb-2">
                        <Calculator size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Hourly Overhead Rate</span>
                    </div>
                    <div className="text-2xl font-black text-indigo-700">
                        ₱{hourlyOverheadRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-indigo-400 mt-1">Cost to keep the clinic open per hour</p>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Procedure</th>
                                <th className="px-6 py-4 text-right">Standard Fee</th>
                                <th className="px-6 py-4 text-right">Avg. Realized</th>
                                <th className="px-6 py-4 text-right text-rose-600">Material</th>
                                <th className="px-6 py-4 text-right text-rose-600">Lab Fee</th>
                                <th className="px-6 py-4 text-right text-rose-600">Overhead</th>
                                <th className="px-6 py-4 text-right">True Margin</th>
                                {simulationMode && <th className="px-6 py-4 text-right bg-indigo-50 text-indigo-700">Simulated Fee</th>}
                                {simulationMode && <th className="px-6 py-4 text-right bg-indigo-50 text-indigo-700">Proj. Margin</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {analysisData.map((proc) => {
                                const simulatedFee = priceAdjustment[proc.id] ?? proc.standardFee;
                                const projectedMargin = simulatedFee - proc.totalCost;
                                const marginChange = projectedMargin - proc.trueMargin;

                                return (
                                    <tr key={proc.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{proc.name}</div>
                                            <div className="text-xs text-slate-500">{proc.category} • {proc.volume} performed</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-600">
                                            ₱{proc.standardFee.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-medium text-slate-800">
                                            ₱{proc.averageRealizedRate.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-rose-600">
                                            ₱{proc.materialCost.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-rose-600">
                                            ₱{proc.labFeeEstimate.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-rose-600">
                                            ₱{proc.overheadCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className={`font-mono font-bold ${proc.trueMargin > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                ₱{proc.trueMargin.toLocaleString()}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                {proc.marginPercentage.toFixed(1)}%
                                            </div>
                                        </td>
                                        
                                        {simulationMode && (
                                            <td className="px-6 py-4 text-right bg-indigo-50/30">
                                                <input 
                                                    type="number" 
                                                    value={simulatedFee}
                                                    onChange={(e) => handleSimulatedPriceChange(proc.id, parseFloat(e.target.value) || 0)}
                                                    className="w-24 text-right px-2 py-1 rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-indigo-700 bg-white"
                                                />
                                            </td>
                                        )}
                                        {simulationMode && (
                                            <td className="px-6 py-4 text-right bg-indigo-50/30">
                                                <div className={`font-mono font-bold ${projectedMargin > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    ₱{projectedMargin.toLocaleString()}
                                                </div>
                                                {marginChange !== 0 && (
                                                    <div className={`text-[10px] flex items-center justify-end gap-1 ${marginChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {marginChange > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                        {marginChange > 0 ? '+' : ''}₱{marginChange.toLocaleString()}
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

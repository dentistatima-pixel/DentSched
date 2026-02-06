

import React, { useState, useMemo } from 'react';
import { PayrollPeriod, PayrollStatus, User, PayrollAdjustment, CommissionDispute, UserRole } from '../types';
import { DollarSign, Plus, CheckCircle, Clock, Lock, ShieldCheck, Flag, Edit, MessageSquare, ChevronRight, User as UserIcon } from 'lucide-react';
import { formatDate } from '../constants';
import { useModal } from '../contexts/ModalContext';

interface PayrollProps {
    payrollPeriods: PayrollPeriod[];
    payrollAdjustments: PayrollAdjustment[];
    commissionDisputes: CommissionDispute[];
    onUpdatePayrollPeriod: (p: PayrollPeriod) => void;
    onAddPayrollAdjustment: (a: PayrollAdjustment) => void;
    onApproveAdjustment: (id: string) => void;
    onAddCommissionDispute: (d: CommissionDispute) => void;
    onResolveCommissionDispute: (id: string) => void;
    staff: User[];
    currentUser: User;
    onAddPayrollPeriod?: (period: Omit<PayrollPeriod, 'id'>) => Promise<PayrollPeriod | undefined>;
}

const statusConfig: Record<PayrollStatus, { color: string; icon: React.ElementType }> = {
    [PayrollStatus.OPEN]: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
    [PayrollStatus.CLOSED]: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: CheckCircle },
    [PayrollStatus.LOCKED]: { color: 'bg-teal-100 text-teal-700 border-teal-200', icon: Lock },
};

const Payroll: React.FC<PayrollProps> = ({ payrollPeriods, payrollAdjustments, commissionDisputes, onUpdatePayrollPeriod, onAddPayrollAdjustment, staff, currentUser, onAddPayrollPeriod }) => {
    const { openModal } = useModal();
    const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(payrollPeriods[0]?.id || null);

    const handleCreatePeriod = async () => {
        if (!onAddPayrollPeriod) return;
        const startDate = prompt("Enter start date (YYYY-MM-DD):");
        const endDate = prompt("Enter end date (YYYY-MM-DD):");
        if (startDate && endDate) {
            await onAddPayrollPeriod({
                providerId: 'all', // Or implement provider-specific periods
                startDate,
                endDate,
                status: PayrollStatus.OPEN,
            });
        }
    };
    
    const openAdjustmentModal = () => {
        openModal('payrollAdjustment', { onSave: onAddPayrollAdjustment, periods: payrollPeriods, staff });
    };

    const selectedPeriod = useMemo(() => payrollPeriods.find(p => p.id === selectedPeriodId), [payrollPeriods, selectedPeriodId]);

    const practitioners = useMemo(() => staff.filter(s => s.role === UserRole.DENTIST), [staff]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full">
            <div className="md:col-span-4 lg:col-span-3 bg-slate-50 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center p-2">
                    <h3 className="font-black text-slate-600 uppercase tracking-widest text-sm">Periods</h3>
                    <button onClick={handleCreatePeriod} className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-teal-600"><Plus size={16}/></button>
                </div>
                {payrollPeriods.map(p => {
                    // FIX: Component names in JSX must start with an uppercase letter.
                    // Assign the icon component to an uppercase variable before rendering.
                    const Icon = statusConfig[p.status].icon;
                    return (
                        <button key={p.id} onClick={() => setSelectedPeriodId(p.id)} className={`w-full p-4 rounded-xl text-left border-2 transition-all ${selectedPeriodId === p.id ? 'bg-white border-teal-500 shadow-md' : 'bg-slate-100 border-transparent hover:border-slate-300'}`}>
                            <p className="font-bold text-slate-800">{formatDate(p.startDate)} - {formatDate(p.endDate)}</p>
                            <div className={`mt-2 text-xs font-black uppercase px-2 py-1 rounded-full inline-flex items-center gap-2 ${statusConfig[p.status].color}`}>
                                <Icon size={12} /> {p.status}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="md:col-span-8 lg:col-span-9">
                {selectedPeriod ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-800">Payroll for {formatDate(selectedPeriod.startDate)} to {formatDate(selectedPeriod.endDate)}</h2>
                            <button onClick={openAdjustmentModal} className="px-6 py-3 bg-lilac-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-lilac-900/20"><Plus size={14}/> Add Adjustment</button>
                        </div>
                        <div className="space-y-4">
                            {practitioners.map(practitioner => {
                                const adjustments = payrollAdjustments.filter(a => a.periodId === selectedPeriodId && a.staffId === practitioner.id);
                                const totalAdjustments = adjustments.reduce((sum, adj) => sum + adj.amount, 0);

                                return (
                                    <div key={practitioner.id} className="bg-white p-6 rounded-2xl border border-slate-200">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <UserIcon size={20} className="text-slate-500"/>
                                                <h4 className="font-bold text-lg text-slate-800">{practitioner.name}</h4>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-black text-teal-700">₱{((practitioner.commissionRate || 0.3) * 150000 + totalAdjustments).toLocaleString()}</span>
                                                <p className="text-xs font-bold text-slate-400">Net Payout (Est.)</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                                            <h5 className="text-xs font-bold text-slate-400 uppercase">Adjustments</h5>
                                            {adjustments.map(adj => (
                                                <div key={adj.id} className="flex justify-between text-sm p-2 bg-slate-50 rounded-lg">
                                                    <span>{adj.reason}</span>
                                                    <span className={`font-bold ${adj.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>₱{adj.amount.toLocaleString()}</span>
                                                </div>
                                            ))}
                                            {adjustments.length === 0 && <p className="text-xs italic text-slate-400">No adjustments for this period.</p>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : <div className="p-10 text-center text-slate-400">Select a payroll period to view details.</div>}
            </div>
        </div>
    );
};

export default Payroll;
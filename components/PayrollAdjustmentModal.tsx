
import React, { useState, useEffect } from 'react';
import { PayrollAdjustment, PayrollAdjustmentTemplate, User, PayrollPeriod } from '../types';
import { X, Save, DollarSign } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useStaff } from '../contexts/StaffContext';
import { useToast } from './ToastSystem';
// FIX: Import `formatDate` from constants to resolve 'Cannot find name' error.
import { generateUid, formatDate } from '../constants';

interface PayrollAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (adjustment: PayrollAdjustment) => void;
    periods: PayrollPeriod[];
    staff: User[];
}

const PayrollAdjustmentModal: React.FC<PayrollAdjustmentModalProps> = ({ isOpen, onClose, onSave, periods, staff }) => {
    const { fieldSettings } = useSettings();
    const toast = useToast();
    
    const [staffId, setStaffId] = useState('');
    const [periodId, setPeriodId] = useState('');
    const [templateId, setTemplateId] = useState('');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (templateId) {
            const template = fieldSettings.payrollAdjustmentTemplates.find(t => t.id === templateId);
            if (template) {
                setAmount(template.defaultAmount?.toString() || '');
                setReason(template.label);
            }
        }
    }, [templateId, fieldSettings.payrollAdjustmentTemplates]);

    if (!isOpen) return null;
    
    const handleSubmit = () => {
        if (!staffId || !periodId || !amount || !reason) {
            toast.error("All fields are required.");
            return;
        }
        
        const adjustment: PayrollAdjustment = {
            id: generateUid('adj'),
            periodId,
            staffId,
            amount: parseFloat(amount),
            reason,
            requestedBy: 'Admin', // In a real app, this would be the current user
            status: 'Approved',
            date: new Date().toISOString()
        };
        
        onSave(adjustment);
        onClose();
    };

    const openPeriods = periods.filter(p => p.status === 'Open');
    const practitioners = staff.filter(s => s.role === 'Dentist');

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-lilac-100 bg-lilac-50 flex items-center gap-4">
                    <DollarSign size={28} className="text-lilac-600"/>
                    <div>
                        <h2 className="text-xl font-black text-lilac-900 uppercase tracking-tight">New Payroll Adjustment</h2>
                    </div>
                </div>
                <div className="p-8 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="label text-xs">Practitioner</label>
                            <select value={staffId} onChange={e => setStaffId(e.target.value)} className="input">
                                <option value="">Select Staff...</option>
                                {practitioners.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label text-xs">Payroll Period</label>
                            <select value={periodId} onChange={e => setPeriodId(e.target.value)} className="input">
                                <option value="">Select Period...</option>
                                {openPeriods.map(p => <option key={p.id} value={p.id}>{formatDate(p.startDate)} - {formatDate(p.endDate)}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="label text-xs">Template</label>
                        <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="input">
                            <option value="">- Use Template (Optional) -</option>
                            {fieldSettings.payrollAdjustmentTemplates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label text-xs">Amount (₱)</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="input" placeholder="e.g. -500 or 1000"/>
                        </div>
                        <div>
                            <label className="label text-xs">Reason</label>
                            <input type="text" value={reason} onChange={e => setReason(e.target.value)} className="input" placeholder="e.g. Tardiness deduction"/>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t bg-white flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                    <button onClick={handleSubmit} className="px-8 py-3 bg-lilac-600 text-white rounded-xl font-bold flex items-center gap-2">
                        <Save size={16}/> Save Adjustment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PayrollAdjustmentModal;

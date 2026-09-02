import React, { useState, useMemo, useEffect } from 'react';
import { Patient, TreatmentPlan as TreatmentPlanType, DentalChartEntry } from '../types';
import { X, Save, ArrowLeft, ArrowRight, LayoutGrid } from 'lucide-react';
import { useToast } from './ToastSystem';

interface ManagePlanContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  plan: TreatmentPlanType;
  onSave: (updatedPatient: Partial<Patient>) => void;
}

const ProcedureItem: React.FC<{ item: DentalChartEntry; onAction: () => void; actionType: 'add' | 'remove' }> = ({ item, onAction, actionType }) => {
    const isAdd = actionType === 'add';
    return (
        <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl group">
            <div>
                <p className="font-bold text-sm text-slate-800">{item.procedure}</p>
                <p className="text-xs text-slate-500 font-mono">
                    {item.toothNumber ? `Tooth #${item.toothNumber}` : 'General'} | {item.status}
                </p>
            </div>
            <button onClick={onAction} className={`p-2 rounded-lg transition-colors ${isAdd ? 'bg-teal-50 text-teal-600 hover:bg-teal-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                {isAdd ? <ArrowLeft size={16}/> : <ArrowRight size={16}/>}
            </button>
        </div>
    );
};

const ManagePlanContentModal: React.FC<ManagePlanContentModalProps> = ({ isOpen, onClose, patient, plan, onSave }) => {
    const toast = useToast();
    const [chart, setChart] = useState<DentalChartEntry[]>(patient.dentalChart || []);

    useEffect(() => {
        if (isOpen) {
            setChart(patient.dentalChart || []);
        }
    }, [isOpen, patient.dentalChart]);

    const { assignedItems, unassignedItems } = useMemo(() => {
        const assigned = chart.filter(item => item.planId === plan.id);
        const unassigned = chart.filter(item => !item.planId);
        return { assignedItems: assigned, unassignedItems: unassigned };
    }, [chart, plan.id]);

    const handleMoveItem = (itemId: string, targetPlanId?: string) => {
        setChart(prevChart => prevChart.map(item => item.id === itemId ? { ...item, planId: targetPlanId } : item));
    };

    const handleSaveChanges = () => {
        onSave({ ...patient, dentalChart: chart });
        toast.success("Treatment plan content updated.");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-lilac-100 p-3 rounded-xl text-lilac-700"><LayoutGrid size={24} /></div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Manage Plan Content</h2>
                            <p className="text-sm text-slate-500 font-bold">{plan.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose}><X size={24} className="text-slate-500" /></button>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-6 p-6 min-h-0">
                    {/* Unassigned Procedures */}
                    <div className="flex flex-col bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <h3 className="font-black text-slate-600 uppercase tracking-widest text-xs p-2">Available Procedures</h3>
                        <div className="flex-1 overflow-y-auto space-y-2 p-2 no-scrollbar">
                            {unassignedItems.length > 0 ? unassignedItems.map(item => (
                                <ProcedureItem key={item.id} item={item} onAction={() => handleMoveItem(item.id, plan.id)} actionType="add" />
                            )) : <p className="text-center text-slate-400 text-sm italic p-10">No unassigned procedures.</p>}
                        </div>
                    </div>
                    {/* Assigned Procedures */}
                    <div className="flex flex-col bg-teal-50 p-4 rounded-2xl border-2 border-teal-200">
                        <h3 className="font-black text-teal-800 uppercase tracking-widest text-xs p-2">Procedures in this Plan</h3>
                        <div className="flex-1 overflow-y-auto space-y-2 p-2 no-scrollbar">
                            {assignedItems.length > 0 ? assignedItems.map(item => (
                                <ProcedureItem key={item.id} item={item} onAction={() => handleMoveItem(item.id, undefined)} actionType="remove" />
                            )) : <p className="text-center text-teal-700 text-sm italic p-10">Add procedures from the left.</p>}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-8 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest">Cancel</button>
                    <button onClick={handleSaveChanges} className="px-10 py-4 bg-teal-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-teal-600/30 flex items-center gap-2">
                        <Save size={16} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManagePlanContentModal;

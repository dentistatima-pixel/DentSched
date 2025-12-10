
import React, { useMemo } from 'react';
import { Patient, DentalChartEntry } from '../types';
import { ClipboardList, ArrowDown, ArrowUp, Printer, FileCheck } from 'lucide-react';
import { useToast } from './ToastSystem';

interface TreatmentPlanProps {
  patient: Patient;
  onUpdatePatient: (updatedPatient: Patient) => void;
  readOnly?: boolean;
}

const TreatmentPlan: React.FC<TreatmentPlanProps> = ({ patient, onUpdatePatient, readOnly }) => {
    const toast = useToast();
    const plannedItems = useMemo(() => {
        return (patient.dentalChart || []).filter(e => e.status === 'Planned');
    }, [patient.dentalChart]);

    // Group items by phase (default to 1)
    const phases = useMemo(() => {
        const groups: Record<number, DentalChartEntry[]> = { 1: [], 2: [], 3: [] };
        // Create an "Unassigned" bucket if needed, but we'll force default to 1
        
        plannedItems.forEach(item => {
            const p = item.phase || 1;
            if (!groups[p]) groups[p] = [];
            groups[p].push(item);
        });
        
        return groups;
    }, [plannedItems]);

    const handleMovePhase = (entry: DentalChartEntry, direction: 'up' | 'down') => {
        if (readOnly) return;
        const currentPhase = entry.phase || 1;
        const newPhase = direction === 'up' ? Math.max(1, currentPhase - 1) : Math.min(5, currentPhase + 1);
        
        if (currentPhase === newPhase) return;

        const updatedChart = patient.dentalChart?.map(e => {
            if (e === entry) {
                return { ...e, phase: newPhase };
            }
            return e;
        });

        onUpdatePatient({ ...patient, dentalChart: updatedChart });
    };

    const handlePrintEstimate = () => {
        toast.success(`Generated Treatment Plan Estimate for ${patient.name}`);
        // Mock download logic similar to PatientList
        const content = `TREATMENT PLAN ESTIMATE\nPatient: ${patient.name}\n\n` + 
            Object.keys(phases).map(p => {
                const num = parseInt(p);
                const items = phases[num];
                if (items.length === 0) return '';
                const total = items.reduce((sum, i) => sum + (i.price || 0), 0);
                return `PHASE ${p}\n` + items.map(i => `- ${i.procedure} (#${i.toothNumber}): ₱${i.price}`).join('\n') + `\nSubtotal: ₱${total}\n`;
            }).join('\n');
        
        const element = document.createElement("a");
        const file = new Blob([content], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `TreatmentPlan_${patient.surname}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const grandTotal = plannedItems.reduce((sum, item) => sum + (item.price || 0), 0);

    return (
        <div className="h-full flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-teal-100 p-2 rounded-lg text-teal-700">
                        <ClipboardList size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Treatment Plan</h3>
                        <p className="text-xs text-slate-500">Organize procedures by priority phases.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="bg-slate-100 px-4 py-2 rounded-xl text-right">
                        <span className="block text-[10px] font-bold uppercase text-slate-500">Grand Total</span>
                        <span className="font-bold text-lg text-slate-800">₱{grandTotal.toLocaleString()}</span>
                    </div>
                    <button 
                        onClick={handlePrintEstimate}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Printer size={18} /> Print Estimate
                    </button>
                </div>
            </div>

            {/* Phases Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {[1, 2, 3].map(phaseNum => {
                    const items = phases[phaseNum] || [];
                    const subtotal = items.reduce((sum, i) => sum + (i.price || 0), 0);
                    
                    if (items.length === 0 && phaseNum > 1 && plannedItems.length === 0) return null; // Hide empty later phases if chart is empty

                    return (
                        <div key={phaseNum} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                            {/* Phase Header */}
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">{phaseNum}</span>
                                    <h4 className="font-bold text-slate-700">Phase {phaseNum}</h4>
                                    <span className="text-xs text-slate-400 font-medium ml-2">
                                        {phaseNum === 1 ? '(Urgent / Priority)' : phaseNum === 2 ? '(Restorative / Functional)' : '(Esthetic / Maintenance)'}
                                    </span>
                                </div>
                                <span className="font-bold text-slate-800">₱{subtotal.toLocaleString()}</span>
                            </div>

                            {/* Items List */}
                            <div className="divide-y divide-slate-50">
                                {items.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 italic text-sm border-2 border-dashed border-slate-50 m-4 rounded-xl">
                                        No procedures assigned to Phase {phaseNum}.
                                    </div>
                                ) : (
                                    items.map((item, idx) => (
                                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm border border-teal-100">
                                                    #{item.toothNumber}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{item.procedure}</div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span>{item.surfaces ? `Surface: ${item.surfaces}` : 'General'}</span>
                                                        <span>•</span>
                                                        <span className="text-teal-600 font-bold">₱{item.price?.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {!readOnly && (
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleMovePhase(item, 'up')}
                                                        disabled={phaseNum === 1}
                                                        className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                                                        title="Move to Previous Phase"
                                                    >
                                                        <ArrowUp size={18} />
                                                    </button>
                                                    <div className="w-px h-6 bg-slate-200"></div>
                                                    <button 
                                                        onClick={() => handleMovePhase(item, 'down')}
                                                        disabled={phaseNum === 5}
                                                        className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                                                        title="Move to Next Phase"
                                                    >
                                                        <ArrowDown size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TreatmentPlan;

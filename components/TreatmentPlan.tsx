import React, { useState, useMemo } from 'react';
import { Patient, DentalChartEntry, TreatmentPlan as TreatmentPlanType, TreatmentPlanStatus, User, UserRole, FeatureToggles, AuditLogEntry, OrthoAdjustment, TreatmentStatus } from '../types';
import { ClipboardList, Printer, FileCheck, Plus, Send, ShieldCheck, XCircle, Edit, CheckCircle, Trash2, ArrowRight, X, ChevronDown, ChevronUp, Activity, History } from 'lucide-react';
import { useToast } from './ToastSystem';
import { formatDate } from '../constants';

interface TreatmentPlanProps {
  patient: Patient;
  onUpdatePatient: (updatedPatient: Patient) => void;
  readOnly?: boolean;
  currentUser: User;
  logAction: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
  featureFlags?: FeatureToggles;
}

const TreatmentPlan: React.FC<TreatmentPlanProps> = ({ patient, onUpdatePatient, readOnly, currentUser, logAction, featureFlags }) => {
    const toast = useToast();
    const isApprovalEnabled = featureFlags?.enableTreatmentPlanApprovals ?? false;

    // Local State
    const [isCreating, setIsCreating] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');
    const [rejectionModal, setRejectionModal] = useState<{ planId: string, planName: string } | null>(null);
    const [rejectionNotes, setRejectionNotes] = useState('');
    
    // Ortho Tracking State
    const [showOrtho, setShowOrtho] = useState(false);
    const [isAddingOrtho, setIsAddingOrtho] = useState(false);
    const [orthoForm, setOrthoForm] = useState<Partial<OrthoAdjustment>>({
        bracketType: 'MBT 0.022',
        archWireUpper: '',
        archWireLower: '',
        elastics: '',
        notes: ''
    });

    // --- DATA DERIVATION ---
    const allPlans = useMemo(() => patient.treatmentPlans || [], [patient.treatmentPlans]);
    const unassignedPlannedItems = useMemo(() => {
        return (patient.dentalChart || []).filter(e => e.status === 'Planned' && !e.planId);
    }, [patient.dentalChart]);

    // --- HANDLERS ---
    
    const handleAddOrthoAdjustment = () => {
        if (!orthoForm.bracketType) {
            toast.error("Bracket type is required.");
            return;
        }
        const newAdjustment: OrthoAdjustment = {
            id: `ortho_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            dentist: currentUser.name,
            ...orthoForm
        } as OrthoAdjustment;

        const updatedHistory = [newAdjustment, ...(patient.orthoHistory || [])];
        onUpdatePatient({ ...patient, orthoHistory: updatedHistory });
        logAction('ORTHO_ADJUSTMENT', 'OrthoRecord', patient.id, `Logged ortho adjustment: ${newAdjustment.archWireUpper}/${newAdjustment.archWireLower}`);
        setIsAddingOrtho(false);
        setOrthoForm({ bracketType: 'MBT 0.022', archWireUpper: '', archWireLower: '', elastics: '', notes: '' });
        toast.success("Ortho adjustment logged.");
    };

    // Plan Creation
    const handleCreatePlan = () => {
        if (!newPlanName.trim()) {
            toast.error("Please enter a name for the new plan.");
            return;
        }
        const newPlan: TreatmentPlanType = {
            id: `tp_${Date.now()}`,
            patientId: patient.id,
            name: newPlanName,
            createdAt: new Date().toISOString(),
            createdBy: currentUser.name,
            status: TreatmentPlanStatus.DRAFT,
        };
        const updatedPlans = [...allPlans, newPlan];
        onUpdatePatient({ ...patient, treatmentPlans: updatedPlans });
        logAction('CREATE', 'TreatmentPlan', newPlan.id, `Created plan "${newPlanName}".`);
        setNewPlanName('');
        setIsCreating(false);
    };
    
    // Plan Status Changes (Approval Workflow)
    const handlePlanAction = (planId: string, action: 'submit' | 'approve' | 'reject' | 'revert_to_draft' | 'delete') => {
        const plan = allPlans.find(p => p.id === planId);
        if (!plan) return;

        let updatedPlans: TreatmentPlanType[];

        if (action === 'delete') {
            if (!window.confirm(`Are you sure you want to delete the plan "${plan.name}"? This cannot be undone.`)) return;
            updatedPlans = allPlans.filter(p => p.id !== planId);
            // Also un-assign items from this plan
            const updatedChart = patient.dentalChart?.map(item => item.planId === planId ? { ...item, planId: undefined } : item);
            onUpdatePatient({ ...patient, treatmentPlans: updatedPlans, dentalChart: updatedChart });
            logAction('DELETE', 'TreatmentPlan', planId, `Deleted plan "${plan.name}".`);
            return;
        }

        updatedPlans = allPlans.map(p => {
            if (p.id === planId) {
                switch (action) {
                    case 'submit':
                        return { ...p, status: TreatmentPlanStatus.PENDING_REVIEW };
                    case 'approve':
                        return { ...p, status: TreatmentPlanStatus.APPROVED, reviewedBy: currentUser.name, reviewedAt: new Date().toISOString() };
                    case 'reject':
                        // Handled by modal save
                        return p;
                    case 'revert_to_draft':
                        return { ...p, status: TreatmentPlanStatus.DRAFT, reviewNotes: undefined };
                }
            }
            return p;
        });

        onUpdatePatient({ ...patient, treatmentPlans: updatedPlans });
        
        // Logging
        if (action === 'submit') logAction('SUBMIT_PLAN', 'TreatmentPlan', planId, `Submitted plan "${plan.name}" for review.`);
        if (action === 'approve') logAction('APPROVE_PLAN', 'TreatmentPlan', planId, `Approved plan "${plan.name}".`);
        if (action === 'revert_to_draft') logAction('UPDATE', 'TreatmentPlan', planId, `Reverted plan "${plan.name}" to draft.`);
    };
    
    const handleRejectSave = () => {
        if (!rejectionModal || !rejectionNotes.trim()) {
            toast.error("Rejection notes cannot be empty.");
            return;
        }
        const updatedPlans = allPlans.map(p => {
            if (p.id === rejectionModal.planId) {
                return { ...p, status: TreatmentPlanStatus.REJECTED, reviewNotes: rejectionNotes, reviewedBy: currentUser.name, reviewedAt: new Date().toISOString() };
            }
            return p;
        });
        onUpdatePatient({ ...patient, treatmentPlans: updatedPlans });
        logAction('REJECT_PLAN', 'TreatmentPlan', rejectionModal.planId, `Rejected plan "${rejectionModal.planName}" with notes: ${rejectionNotes}`);
        setRejectionModal(null);
        setRejectionNotes('');
    };
    
    // Assigning items to a plan
    const handleAssignItem = (chartEntry: DentalChartEntry, planId: string) => {
        const updatedChart = patient.dentalChart?.map(item => {
            if (item.date === chartEntry.date && item.toothNumber === chartEntry.toothNumber && item.procedure === chartEntry.procedure) {
                return { ...item, planId };
            }
            return item;
        });
        onUpdatePatient({ ...patient, dentalChart: updatedChart });
    };

    // Executing an item from an approved plan
    const handleMarkComplete = (itemToComplete: DentalChartEntry) => {
        if (readOnly) return;
        
        let newBalance = patient.currentBalance || 0;
        let newLedger = patient.ledger || [];

        // Add charge to ledger
        if (itemToComplete.price && itemToComplete.price > 0) {
            newBalance += itemToComplete.price;
            newLedger.push({
                id: `l_${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                description: `${itemToComplete.procedure} (#${itemToComplete.toothNumber})`,
                type: 'Charge',
                amount: itemToComplete.price,
                balanceAfter: newBalance,
                procedureId: `${itemToComplete.procedure}-${itemToComplete.toothNumber}`
            });
        }
        
        // Update chart item status
        const updatedChart = patient.dentalChart?.map(item => {
            if (item === itemToComplete) {
                // Fix: Cast explicitly to DentalChartEntry to ensure Literal 'Completed' is accepted as TreatmentStatus
                const updated: DentalChartEntry = { ...item, status: 'Completed' as TreatmentStatus, date: new Date().toISOString().split('T')[0] };
                return updated;
            }
            return item;
        });
        
        onUpdatePatient({ ...patient, dentalChart: updatedChart, ledger: newLedger, currentBalance: newBalance });
        toast.success(`${itemToComplete.procedure} marked as complete and charged to ledger.`);
        logAction('UPDATE', 'Patient', patient.id, `Completed procedure "${itemToComplete.procedure}" from plan.`);
    };

    const isAdmin = currentUser.role === UserRole.ADMIN;
    
    if (!isApprovalEnabled) {
        return (
            <div className="p-8 text-center bg-slate-100 rounded-xl text-slate-500">
                Treatment Plan Approvals are disabled. Enable this feature in Settings.
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col space-y-6">
            
            {/* --- ORTHODONTIC TRACKING --- */}
            <div className="bg-white rounded-2xl border border-teal-200 shadow-sm overflow-hidden">
                <button 
                    onClick={() => setShowOrtho(!showOrtho)}
                    className="w-full p-4 flex justify-between items-center bg-teal-50/50 hover:bg-teal-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-teal-600 text-white p-2 rounded-xl"><Activity size={18}/></div>
                        <div>
                            <h4 className="font-black text-teal-900 uppercase tracking-widest text-sm">Orthodontic Specialty Tracking</h4>
                            <p className="text-[10px] text-teal-600 font-bold uppercase mt-0.5">Wire Sequences & Elastic Protocols</p>
                        </div>
                    </div>
                    {showOrtho ? <ChevronUp size={20} className="text-teal-400"/> : <ChevronDown size={20} className="text-teal-400"/>}
                </button>

                {showOrtho && (
                    <div className="p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                        {isAddingOrtho ? (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h5 className="font-bold text-slate-700 text-sm">New Adjustment Record</h5>
                                    <button onClick={() => setIsAddingOrtho(false)} className="text-slate-400"><X size={16}/></button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Bracket Type</label>
                                        <select value={orthoForm.bracketType} onChange={e => setOrthoForm({...orthoForm, bracketType: e.target.value})} className="w-full p-2 border rounded-lg text-sm bg-white">
                                            <option>MBT 0.022</option><option>Roth 0.018</option><option>Damon Q2</option><option>Damon Clear</option><option>Ceramic</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Upper Archwire</label>
                                        <input type="text" placeholder="e.g. 0.014 Niti" value={orthoForm.archWireUpper} onChange={e => setOrthoForm({...orthoForm, archWireUpper: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Lower Archwire</label>
                                        <input type="text" placeholder="e.g. 0.012 Niti" value={orthoForm.archWireLower} onChange={e => setOrthoForm({...orthoForm, archWireLower: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Elastics / Auxiliaries</label>
                                    <input type="text" placeholder="e.g. 1/8 4.5oz Class II" value={orthoForm.elastics} onChange={e => setOrthoForm({...orthoForm, elastics: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                                </div>
                                <button onClick={handleAddOrthoAdjustment} className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-600/20">Commit Adjustment</button>
                            </div>
                        ) : !readOnly && (
                            <button onClick={() => setIsAddingOrtho(true)} className="w-full py-3 border-2 border-dashed border-teal-200 rounded-xl text-teal-600 font-bold text-xs uppercase tracking-widest hover:bg-teal-50 transition-all flex items-center justify-center gap-2">
                                <Plus size={14}/> Log Monthly Adjustment
                            </button>
                        )}

                        <div className="space-y-3">
                            {(patient.orthoHistory || []).length > 0 ? (patient.orthoHistory || []).map(adj => (
                                <div key={adj.id} className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex items-start gap-4">
                                    <div className="bg-slate-50 p-2 rounded-lg text-center shrink-0 border border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">{new Date(adj.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                                        <div className="text-lg font-black text-slate-800 leading-none">{new Date(adj.date).getDate()}</div>
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div><div className="text-[9px] font-bold text-slate-400 uppercase">Brackets</div><div className="text-xs font-bold text-slate-800">{adj.bracketType}</div></div>
                                        <div><div className="text-[9px] font-bold text-slate-400 uppercase">Upper Wire</div><div className="text-xs font-bold text-teal-700">{adj.archWireUpper || '-'}</div></div>
                                        <div><div className="text-[9px] font-bold text-slate-400 uppercase">Lower Wire</div><div className="text-xs font-bold text-teal-700">{adj.archWireLower || '-'}</div></div>
                                        <div><div className="text-[9px] font-bold text-slate-400 uppercase">Elastics</div><div className="text-xs font-bold text-lilac-700">{adj.elastics || '-'}</div></div>
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-300 uppercase shrink-0">Dr. {adj.dentist.split(' ')[1]}</div>
                                </div>
                            )) : <div className="text-center py-6 text-slate-400 text-xs italic">No orthodontic history on record.</div>}
                        </div>
                    </div>
                )}
            </div>

            {/* --- UNASSIGNED ITEMS --- */}
            {unassignedPlannedItems.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-500 text-sm mb-2 uppercase tracking-wider">Unassigned Planned Items</h4>
                    <div className="space-y-2">
                        {unassignedPlannedItems.map((item, i) => (
                            <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                                <div>
                                    <span className="font-bold text-slate-700">{item.procedure} (#{item.toothNumber})</span>
                                    <span className="text-xs text-slate-500 ml-2">₱{item.price?.toLocaleString()}</span>
                                </div>
                                <div className="flex gap-2">
                                    {allPlans.filter(p => p.status === TreatmentPlanStatus.DRAFT).map(plan => (
                                        <button 
                                            key={plan.id}
                                            onClick={() => handleAssignItem(item, plan.id)}
                                            className="px-2 py-1 text-[10px] font-bold bg-teal-100 text-teal-700 rounded hover:bg-teal-200"
                                        >
                                            Add to "{plan.name}"
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* --- TREATMENT PLANS LIST --- */}
            {allPlans.map(plan => {
                const planItems = (patient.dentalChart || []).filter(item => item.planId === plan.id);
                const planTotal = planItems.reduce((sum, i) => sum + (i.price || 0), 0);
                
                const statusStyles = {
                    [TreatmentPlanStatus.DRAFT]: 'bg-slate-100 text-slate-600 border-slate-200',
                    [TreatmentPlanStatus.PENDING_REVIEW]: 'bg-yellow-100 text-yellow-700 border-yellow-200 animate-pulse',
                    [TreatmentPlanStatus.APPROVED]: 'bg-green-100 text-green-700 border-green-200',
                    [TreatmentPlanStatus.REJECTED]: 'bg-red-100 text-red-700 border-red-200',
                };

                return (
                    <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* Plan Header */}
                        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start gap-2">
                            <div>
                                <h3 className="font-bold text-xl text-slate-800">{plan.name}</h3>
                                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                                    <span>Created by: {plan.createdBy}</span>
                                    {plan.reviewedBy && <span>Reviewed by: {plan.reviewedBy}</span>}
                                </div>
                                {plan.status === TreatmentPlanStatus.REJECTED && plan.reviewNotes && (
                                    <p className="text-xs text-red-700 mt-2 bg-red-50 p-2 rounded-lg border border-red-100">
                                        <span className="font-bold">Rejection Note:</span> {plan.reviewNotes}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${statusStyles[plan.status]}`}>{plan.status}</span>
                                <span className="font-bold text-slate-800 text-lg">₱{planTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Plan Body (Items) */}
                        <div className="divide-y divide-slate-100">
                            {planItems.map(item => (
                                <div key={`${item.procedure}-${item.toothNumber}-${item.date}`} className="p-3 flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${
                                            item.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                            #{item.toothNumber}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-slate-700">{item.procedure}</div>
                                            <div className="text-xs text-slate-500">₱{item.price?.toLocaleString()}</div>
                                        </div>
                                    </div>
                                    {plan.status === TreatmentPlanStatus.APPROVED && item.status !== 'Completed' && !readOnly && (
                                        <button 
                                            onClick={() => handleMarkComplete(item)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1"
                                        >
                                            <CheckCircle size={14} /> Mark Complete
                                        </button>
                                    )}
                                    {item.status === 'Completed' && (
                                        <span className="text-xs font-bold text-green-600 flex items-center gap-1"><FileCheck size={14}/> Completed</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {/* Plan Footer (Actions) */}
                        <div className="bg-slate-50/50 p-3 border-t border-slate-100 flex justify-end gap-2">
                            {plan.status === TreatmentPlanStatus.DRAFT && (
                                <>
                                    <button onClick={() => handlePlanAction(plan.id, 'delete')} className="px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                                    <button onClick={() => handlePlanAction(plan.id, 'submit')} className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-teal-700"><Send size={14}/> Submit for Review</button>
                                </>
                            )}
                            {plan.status === TreatmentPlanStatus.PENDING_REVIEW && isAdmin && (
                                <>
                                    <button onClick={() => setRejectionModal({ planId: plan.id, planName: plan.name })} className="px-4 py-2 bg-red-100 text-red-700 text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-red-200"><XCircle size={14}/> Reject</button>
                                    <button onClick={() => handlePlanAction(plan.id, 'approve')} className="px-4 py-2 bg-green-100 text-green-700 text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-green-200"><ShieldCheck size={14}/> Approve Plan</button>
                                </>
                            )}
                            {plan.status === TreatmentPlanStatus.REJECTED && (
                                <button onClick={() => handlePlanAction(plan.id, 'revert_to_draft')} className="px-4 py-2 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-yellow-200"><Edit size={14}/> Edit Plan</button>
                            )}
                        </div>
                    </div>
                );
            })}
            
            {/* Create New Plan Area */}
            {isCreating ? (
                 <div className="bg-white p-4 rounded-xl border-2 border-dashed border-slate-200 flex gap-2">
                     <input 
                        type="text" 
                        placeholder="Name for new plan (e.g., Phase 1)" 
                        className="flex-1 p-2 rounded-lg border border-slate-300"
                        value={newPlanName}
                        onChange={e => setNewPlanName(e.target.value)}
                        autoFocus
                     />
                     <button onClick={handleCreatePlan} className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg">Save</button>
                     <button onClick={() => setIsCreating(false)} className="p-2 text-slate-500"><X size={18}/></button>
                 </div>
            ) : (
                <button onClick={() => setIsCreating(true)} className="w-full py-4 text-center border-2 border-dashed border-slate-300 text-slate-500 rounded-2xl font-bold hover:bg-slate-50 hover:border-teal-400 hover:text-teal-600 transition-colors flex items-center justify-center gap-2">
                    <Plus size={18} /> Create New Treatment Plan
                </button>
            )}

            {/* Rejection Modal */}
            {rejectionModal && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
                        <h3 className="font-bold text-lg text-red-800">Reject Plan: {rejectionModal.planName}</h3>
                        <p className="text-sm text-slate-500 mt-1 mb-4">Please provide a reason for the rejection. This will be visible to the dentist.</p>
                        <textarea 
                            className="w-full p-2 border border-slate-300 rounded-lg min-h-[100px]"
                            value={rejectionNotes}
                            onChange={e => setRejectionNotes(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setRejectionModal(null)} className="px-4 py-2 rounded-lg text-slate-600 font-bold hover:bg-slate-100">Cancel</button>
                            <button onClick={handleRejectSave} className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold">Confirm Rejection</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TreatmentPlan;

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Patient, DentalChartEntry, TreatmentPlan as TreatmentPlanType, TreatmentPlanStatus, User, UserRole, FeatureToggles, AuditLogEntry, OrthoAdjustment, TreatmentStatus, FieldSettings, ConsentCategory, InformedRefusal } from '../types';
import { ClipboardList, Printer, FileCheck, Plus, Send, ShieldCheck, XCircle, Edit, CheckCircle, Trash2, ArrowRight, X, ChevronDown, ChevronUp, Activity, History, FileWarning, ShieldAlert, Key, Eraser, Camera, UserCheck, AlertTriangle, Scale, Receipt, Stethoscope, FileSearch, Lock, Sparkles, LayoutGrid } from 'lucide-react';
import { useToast } from './ToastSystem';
import { formatDate, isExpired } from '../constants';
import { useModal } from './ModalContext';

// Component for a single plan card
const PlanCard: React.FC<{
    plan: TreatmentPlanType;
    patient: Patient;
    currentUser: User;
    isApprovalEnabled: boolean;
    onPlanAction: (planId: string, action: 'submit' | 'approve' | 'reject' | 'revert_to_draft' | 'delete') => void;
    onEditPlanName: (planId: string, currentName: string) => void;
    onInitiateFinancialConsent: (plan: TreatmentPlanType) => void;
    onManageProcedures: (planId: string) => void;
    onDocumentRefusal: (plan: TreatmentPlanType) => void;
    onReconfirm: (planId: string) => void;
}> = ({ plan, patient, currentUser, isApprovalEnabled, onPlanAction, onEditPlanName, onInitiateFinancialConsent, onManageProcedures, onDocumentRefusal, onReconfirm }) => {
    const planItems = useMemo(() => patient.dentalChart?.filter(item => item.planId === plan.id) || [], [patient.dentalChart, plan.id]);
    const planTotal = useMemo(() => planItems.reduce((acc, item) => acc + (item.price || 0), 0), [planItems]);

    const statusMap: Record<TreatmentPlanStatus, { text: string, color: string, icon: React.ElementType }> = {
        [TreatmentPlanStatus.DRAFT]: { text: 'Draft', color: 'bg-slate-100 text-slate-600', icon: Edit },
        [TreatmentPlanStatus.PENDING_REVIEW]: { text: 'Pending Review', color: 'bg-amber-100 text-amber-800', icon: Send },
        [TreatmentPlanStatus.PENDING_FINANCIAL_CONSENT]: { text: 'Pending Financial Consent', color: 'bg-orange-100 text-orange-800', icon: Receipt },
        [TreatmentPlanStatus.APPROVED]: { text: 'Approved', color: 'bg-teal-100 text-teal-800', icon: ShieldCheck },
        [TreatmentPlanStatus.REJECTED]: { text: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
        [TreatmentPlanStatus.COMPLETED]: { text: 'Completed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
        [TreatmentPlanStatus.RECONFIRMED]: { text: 'Reconfirmed', color: 'bg-teal-700 text-white', icon: ShieldCheck },
    };

    const currentStatus = statusMap[plan.status];
    const isArchitect = currentUser.role === UserRole.SYSTEM_ARCHITECT;
    const isCreator = currentUser.name === plan.createdBy;
    const isApprover = isApprovalEnabled && (currentUser.role === UserRole.DENTIST || currentUser.role === UserRole.ADMIN) && !isCreator;
    const canEdit = (plan.status === TreatmentPlanStatus.DRAFT || plan.status === TreatmentPlanStatus.REJECTED) && (isCreator || isArchitect);
    const isLocked = [TreatmentPlanStatus.APPROVED, TreatmentPlanStatus.COMPLETED, TreatmentPlanStatus.PENDING_FINANCIAL_CONSENT, TreatmentPlanStatus.RECONFIRMED].includes(plan.status);


    return (
        <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-lg shadow-slate-500/5 overflow-hidden">
            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">{plan.name}</h4>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Created: {formatDate(plan.createdAt)} by {plan.createdBy}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase ${currentStatus.color}`}>
                        <currentStatus.icon size={14} />
                        {currentStatus.text}
                    </div>
                     <button onClick={() => onPlanAction(plan.id, 'delete')} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"><Trash2 size={16}/></button>
                </div>
            </div>
            
            {plan.status === TreatmentPlanStatus.APPROVED && plan.reviewedBy && (
                <div className="p-6 bg-teal-50 border-y-4 border-teal-200 flex items-center gap-6 animate-in fade-in shadow-inner">
                    <div className="bg-teal-600 text-white p-4 rounded-2xl shadow-lg shadow-teal-600/30"><ShieldCheck size={28} /></div>
                    <div>
                        <div className="text-[10px] font-black text-teal-800 uppercase tracking-widest">Lead Dentist Approval Seal</div>
                        <div className="text-base font-black text-slate-800">Approved by {plan.reviewedBy} on {formatDate(plan.reviewedAt || '')}</div>
                        <p className="text-xs text-slate-500 font-bold mt-1">This plan is now locked and cannot be edited without reverting to draft status.</p>
                    </div>
                </div>
            )}

            {plan.status === TreatmentPlanStatus.RECONFIRMED && plan.reconfirmedBy && (
                <div className="p-6 bg-teal-700 border-y-4 border-teal-800 flex items-center gap-6 animate-in fade-in shadow-inner text-white">
                    <div className="bg-white/20 p-4 rounded-2xl"><ShieldCheck size={28} /></div>
                    <div>
                        <div className="text-[10px] font-black text-teal-200 uppercase tracking-widest">Final Phase Reconfirmation</div>
                        <div className="text-base font-black">Reconfirmed by {plan.reconfirmedBy} on {formatDate(plan.reconfirmedAt || '')}</div>
                        <p className="text-xs font-bold text-teal-100 mt-1">This phase is permanently sealed as complete.</p>
                    </div>
                </div>
            )}
            
            {plan.status === TreatmentPlanStatus.REJECTED && plan.reviewNotes && (
                <div className="p-4 border-y border-red-200 bg-red-50 text-red-800">
                    <h5 className="font-black text-xs uppercase tracking-widest flex items-center gap-2"><FileWarning size={14}/> Reason for Rejection</h5>
                    <p className="text-sm italic mt-2">"{plan.reviewNotes}"</p>
                    <p className="text-right text-xs font-bold mt-2">-- {plan.reviewedBy} on {formatDate(plan.reviewedAt || '')}</p>
                </div>
            )}
            
            <div className="p-6">
                 <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200">
                            <th className="text-left py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Procedure</th>
                            <th className="text-center py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Tooth #</th>
                            <th className="text-center py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="text-right py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Cost (Est.)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {planItems.map(item => (
                            <tr key={item.id} className="border-b border-slate-100">
                                <td className="py-3 font-bold text-slate-700">{item.procedure}</td>
                                <td className="py-3 text-center text-slate-500 font-mono">{item.toothNumber || 'N/A'}</td>
                                <td className="py-3 text-center"><span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${item.status === 'Completed' ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'}`}>{item.status}</span></td>
                                <td className="py-3 text-right font-mono text-slate-800">₱{(item.price || 0).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
                 <div className="flex justify-end items-center mt-4 pt-4 border-t border-slate-100">
                    <span className="text-sm font-bold text-slate-500 uppercase">Total Estimate:</span>
                    <span className="text-2xl font-black text-teal-700 ml-4">₱{planTotal.toLocaleString()}</span>
                 </div>
            </div>

            <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex justify-end items-center gap-2">
                 {canEdit && (
                    <>
                        <button onClick={() => onDocumentRefusal(plan)} className="mr-auto px-4 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-black uppercase flex items-center gap-2 hover:bg-red-100"><XCircle size={14}/> Document Refusal</button>
                        <button onClick={() => onEditPlanName(plan.id, plan.name)} className="px-4 py-2 text-slate-500 rounded-lg text-xs font-black uppercase flex items-center gap-2 hover:bg-slate-200"><Edit size={14}/> Edit Name</button>
                        <button onClick={() => onManageProcedures(plan.id)} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg text-xs font-black uppercase flex items-center gap-2 hover:bg-slate-300 shadow-sm"><LayoutGrid size={14}/> Manage Content</button>
                        <button onClick={() => onPlanAction(plan.id, 'submit')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-black uppercase">Submit for Review</button>
                    </>
                )}

                {plan.status === TreatmentPlanStatus.PENDING_REVIEW && (
                    <>
                        {(isCreator || isArchitect) && (
                            <button onClick={() => onPlanAction(plan.id, 'revert_to_draft')} className="px-4 py-2 bg-slate-500 text-white rounded-lg text-xs font-black uppercase">Recall Submission</button>
                        )}
                        {(isApprover || isArchitect) && (
                            <>
                                <button onClick={() => onPlanAction(plan.id, 'reject')} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-black uppercase">Reject</button>
                                <button onClick={() => onPlanAction(plan.id, 'approve')} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-black uppercase">Approve Plan</button>
                            </>
                        )}
                    </>
                )}
                
                {plan.status === TreatmentPlanStatus.PENDING_FINANCIAL_CONSENT && (
                    <button onClick={() => onInitiateFinancialConsent(plan)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase">Capture Financial Consent</button>
                )}

                {plan.status === TreatmentPlanStatus.COMPLETED && (isCreator || isArchitect) && (
                     <button onClick={() => onReconfirm(plan.id)} className="px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-black uppercase flex items-center gap-2 hover:bg-teal-800">
                        <ShieldCheck size={14}/> Reconfirm Completion
                     </button>
                 )}
                
                {isLocked && (
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase"><Lock size={12}/> Plan Locked</div>
                )}
            </div>
        </div>
    );
};

interface TreatmentPlanProps {
  patient: Patient;
  onUpdatePatient: (updatedPatient: Partial<Patient>) => void;
  readOnly?: boolean;
  currentUser: User;
  logAction: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
  featureFlags?: FeatureToggles;
  fieldSettings?: FieldSettings;
  onOpenRevocationModal: (patient: Patient, category: ConsentCategory) => void;
  onInitiateFinancialConsent: (plan: TreatmentPlanType) => void;
}

const TreatmentPlanModule: React.FC<TreatmentPlanProps> = ({ patient, onUpdatePatient, readOnly, currentUser, logAction, featureFlags, fieldSettings, onOpenRevocationModal, onInitiateFinancialConsent }) => {
    const toast = useToast();
    const { showModal } = useModal();
    const isApprovalEnabled = featureFlags?.enableTreatmentPlanApprovals ?? true;

    const [isCreating, setIsCreating] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');

    const allPlans = useMemo(() => [...(patient.treatmentPlans || [])].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), [patient.treatmentPlans]);

    const handleCreatePlan = () => {
        if (!newPlanName.trim()) { toast.error("Strategy label required."); return; }
        const newPlan: TreatmentPlanType = { id: `tp_${Date.now()}`, patientId: patient.id, name: newPlanName, createdAt: new Date().toISOString(), createdBy: currentUser.name, status: TreatmentPlanStatus.DRAFT };
        onUpdatePatient({ ...patient, treatmentPlans: [...allPlans, newPlan] });
        logAction('CREATE', 'TreatmentPlan', newPlan.id, `Defined plan "${newPlanName}".`);
        setNewPlanName(''); setIsCreating(false);
    };

    const handleEditPlanName = (planId: string, currentName: string) => {
        const newName = window.prompt("Enter new plan name:", currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) {
            const updatedPlans = allPlans.map(p => 
                p.id === planId ? { ...p, name: newName.trim() } : p
            );
            onUpdatePatient({ ...patient, treatmentPlans: updatedPlans });
            logAction('UPDATE', 'TreatmentPlan', planId, `Plan renamed to "${newName.trim()}"`);
            toast.success("Plan name updated.");
        }
    };
    
    const handleManageProcedures = (planId: string) => {
        const plan = allPlans.find(p => p.id === planId);
        if (plan) {
            showModal('managePlanContent', {
                patient,
                plan,
                onSave: onUpdatePatient
            });
        }
    };

    const handlePlanAction = (planId: string, action: 'submit' | 'approve' | 'reject' | 'revert_to_draft' | 'delete') => {
        const plan = allPlans.find(p => p.id === planId); if (!plan) return;
        
        if (action === 'delete') {
            if (!window.confirm(`Are you sure you want to delete the plan "${plan.name}"? This will unlink all associated procedures.`)) return;
            const updatedPlans = allPlans.filter(p => p.id !== planId);
            const updatedChart = patient.dentalChart?.map(item => item.planId === planId ? { ...item, planId: undefined } : item);
            onUpdatePatient({ ...patient, treatmentPlans: updatedPlans, dentalChart: updatedChart });
            toast.info(`Plan "${plan.name}" deleted.`);
            return;
        }

        if (action === 'approve') {
            const malpracticeIsExpired = isExpired(currentUser.malpracticeExpiry);
            if (malpracticeIsExpired) {
                toast.error("INDEMNITY LOCK: Cannot approve treatment plan. Your malpractice insurance has expired.");
                return;
            }
        }

        if (action === 'reject') {
            const reason = window.prompt("Reason for rejection:");
            if (reason && reason.trim()) {
                const updatedPlans = allPlans.map(p => 
                    p.id === planId 
                    ? { ...p, status: TreatmentPlanStatus.REJECTED, reviewNotes: reason, reviewedBy: currentUser.name, reviewedAt: new Date().toISOString() } 
                    : p
                );
                onUpdatePatient({ ...patient, treatmentPlans: updatedPlans });
                toast.info(`Plan "${plan.name}" rejected.`);
                logAction('REJECT', 'TreatmentPlan', plan.id, `Rejected with reason: ${reason}`);
            } else {
                toast.warning("Rejection requires a reason.");
            }
            return;
        }

        const updatedPlans = allPlans.map(p => {
            if (p.id === planId) {
                switch (action) {
                    case 'submit': 
                        logAction('SUBMIT', 'TreatmentPlan', p.id, `Submitted for review.`);
                        return { ...p, status: TreatmentPlanStatus.PENDING_REVIEW, reviewNotes: undefined, reviewedBy: undefined, reviewedAt: undefined };
                    case 'approve':
                        const planTotal = patient.dentalChart?.filter(item => item.planId === planId).reduce((acc, item) => acc + (item.price || 0), 0) || 0;
                        logAction('APPROVE', 'TreatmentPlan', p.id, `Clinically approved.`);
                        if(planTotal > 0){
                           return { ...p, status: TreatmentPlanStatus.PENDING_FINANCIAL_CONSENT, reviewedBy: currentUser.name, reviewedAt: new Date().toISOString() };
                        }
                        return { ...p, status: TreatmentPlanStatus.APPROVED, reviewedBy: currentUser.name, reviewedAt: new Date().toISOString() };
                    case 'revert_to_draft': 
                        logAction('UPDATE', 'TreatmentPlan', p.id, `Reverted to draft.`);
                        return { ...p, status: TreatmentPlanStatus.DRAFT, reviewNotes: undefined, reviewedBy: undefined, reviewedAt: undefined };
                }
            }
            return p;
        });
        onUpdatePatient({ ...patient, treatmentPlans: updatedPlans });
    };

    const handleReconfirmPlan = (planId: string) => {
        const plan = allPlans.find(p => p.id === planId);
        if (!plan) return;

        const updatedPlans = allPlans.map(p =>
            p.id === planId
            ? {
                ...p,
                status: TreatmentPlanStatus.RECONFIRMED,
                reconfirmedBy: currentUser.name,
                reconfirmedAt: new Date().toISOString()
              }
            : p
        );

        onUpdatePatient({ ...patient, treatmentPlans: updatedPlans });
        logAction('RECONFIRM', 'TreatmentPlan', plan.id, `Final confirmation of completion for plan "${plan.name}".`);
        toast.success(`Plan "${plan.name}" has been reconfirmed as complete.`);
    };
    
    const handleDocumentRefusal = (plan: TreatmentPlanType) => {
        showModal('informedRefusal', {
            patient: patient,
            currentUser: currentUser,
            relatedEntity: {
                type: 'TreatmentPlan',
                entityId: plan.id,
                entityDescription: `Refusal of Treatment Plan: "${plan.name}"`,
            },
            risks: ['Progression of disease', 'Potential for complications', 'Future treatment may be more complex or costly'],
            alternatives: ['No treatment', 'Alternative conservative management'],
            recommendation: `Proceed with plan "${plan.name}" as recommended.`,
            onSave: (refusal: Omit<InformedRefusal, 'id' | 'patientId'>) => {
                const newRefusal: InformedRefusal = { ...refusal, id: `ref_${Date.now()}`, patientId: patient.id };
                const updatedPatient = { ...patient, informedRefusals: [...(patient.informedRefusals || []), newRefusal] };
                onUpdatePatient(updatedPatient);
                toast.success("Informed refusal has been documented and sealed.");
            }
        });
    };
    
    return (
        <div className="h-full flex flex-col space-y-8 pb-20 animate-in fade-in duration-500 p-6">
            <div className="flex justify-between items-center px-4">
                <div className="flex items-center gap-4">
                    <div className="bg-lilac-100 p-3 rounded-2xl text-lilac-700 shadow-sm"><ClipboardList size={28}/></div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Clinical Strategies</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Forensic Treatment Sequencing</p>
                    </div>
                </div>
                <button onClick={() => setIsCreating(true)} className="bg-teal-600 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> New Phase</button>
            </div>

            {isCreating && (
                <div className="bg-white p-8 rounded-[3rem] border-4 border-teal-50 shadow-2xl flex flex-col md:flex-row items-center gap-6 animate-in zoom-in-95">
                    <div className="flex-1 w-full">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Phase Narrative</label>
                        <select 
                            value={newPlanName} 
                            onChange={e => setNewPlanName(e.target.value)} 
                            className="input text-lg font-black" 
                            autoFocus
                        >
                            <option value="">-- Select a Standard Phase --</option>
                            <option value="Phase 1: Urgent Care">Phase 1: Urgent Care</option>
                            <option value="Phase 2: Disease Control">Phase 2: Disease Control</option>
                            <option value="Phase 3: Restorative Work">Phase 3: Restorative Work</option>
                            <option value="Phase 4: Elective / Cosmetic">Phase 4: Elective / Cosmetic</option>
                            <option value="Phase 5: Maintenance">Phase 5: Maintenance</option>
                            <option value="Orthodontic Phase">Orthodontic Phase</option>
                            <option value="Surgical Phase">Surgical Phase</option>
                            <option value="Prosthodontic Phase">Prosthodontic Phase</option>
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setIsCreating(false)} className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs">Cancel</button>
                        <button onClick={handleCreatePlan} className="px-8 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs flex items-center gap-2"><CheckCircle size={16}/> Define Strategy</button>
                    </div>
                </div>
            )}
            
            <div className="space-y-6">
                {allPlans.map(plan => (
                    <PlanCard 
                        key={plan.id}
                        plan={plan}
                        patient={patient}
                        currentUser={currentUser}
                        isApprovalEnabled={isApprovalEnabled}
                        onPlanAction={handlePlanAction}
                        onEditPlanName={handleEditPlanName}
                        onInitiateFinancialConsent={onInitiateFinancialConsent}
                        onManageProcedures={handleManageProcedures}
                        onDocumentRefusal={handleDocumentRefusal}
                        onReconfirm={handleReconfirmPlan}
                    />
                ))}
                {allPlans.length === 0 && !isCreating && (
                    <div className="text-center py-20 text-slate-300">
                        <ClipboardList size={48} className="mx-auto mb-4"/>
                        <p className="font-black text-slate-400 uppercase">No Treatment Plans Defined</p>
                        <p className="text-sm">Click "New Phase" to begin sequencing the patient's care.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TreatmentPlanModule;

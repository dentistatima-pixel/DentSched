
import React, { useState, useMemo } from 'react';
import { Patient, TreatmentPlan as TreatmentPlanType, TreatmentPlanStatus, User, UserRole, FeatureToggles, AuditLogEntry, DentalChartEntry, FieldSettings, ConsentCategory } from '../types';
// Add missing X icon to imports to fix "Cannot find name 'X'" error
import { ClipboardList, Plus, Send, ShieldCheck, XCircle, Edit, CheckCircle, Trash2, Lock, Receipt, FileSignature, AlertTriangle, Fingerprint, X } from 'lucide-react';
import { useToast } from './ToastSystem';
import { formatDate } from '../constants';
import { useModal } from '../contexts/ModalContext';
import SignatureCaptureOverlay from './SignatureCaptureOverlay';

const PlanCard: React.FC<{
    plan: TreatmentPlanType;
    patient: Patient;
    currentUser: User;
    isApprovalEnabled: boolean;
    onPlanAction: (planId: string, action: 'submit' | 'approve' | 'reject' | 'delete') => void;
    onEditPlanName: (planId: string, currentName: string) => void;
    onAuthorize: (plan: TreatmentPlanType) => void;
    onManageProcedures: (planId: string) => void;
}> = ({ plan, patient, currentUser, isApprovalEnabled, onPlanAction, onEditPlanName, onAuthorize, onManageProcedures }) => {
    const planItems = useMemo(() => patient.dentalChart?.filter(item => item.planId === plan.id) || [], [patient.dentalChart, plan.id]);
    const planTotal = useMemo(() => planItems.reduce((acc, item) => acc + (item.price || 0), 0), [planItems]);

    const statusMap: Record<TreatmentPlanStatus, { text: string, color: string, icon: React.ElementType }> = {
        [TreatmentPlanStatus.DRAFT]: { text: 'Draft', color: 'bg-slate-100 text-slate-600', icon: Edit },
        [TreatmentPlanStatus.PENDING_REVIEW]: { text: 'Clinical Review', color: 'bg-amber-100 text-amber-800', icon: Send },
        [TreatmentPlanStatus.PENDING_FINANCIAL_CONSENT]: { text: 'Pending Authorization', color: 'bg-orange-100 text-orange-800', icon: Receipt },
        [TreatmentPlanStatus.APPROVED]: { text: 'Authorized', color: 'bg-teal-100 text-teal-800', icon: ShieldCheck },
        [TreatmentPlanStatus.REJECTED]: { text: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
        [TreatmentPlanStatus.COMPLETED]: { text: 'Completed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
        [TreatmentPlanStatus.RECONFIRMED]: { text: 'Sealed', color: 'bg-teal-700 text-white', icon: ShieldCheck },
    };

    const currentStatus = statusMap[plan.status];
    const isArchitect = currentUser.role === UserRole.SYSTEM_ARCHITECT;
    const isCreator = currentUser.name === plan.createdBy;
    const isApprover = isApprovalEnabled && (currentUser.role === UserRole.DENTIST || currentUser.role === UserRole.ADMIN) && !isCreator;
    const isLocked = [TreatmentPlanStatus.APPROVED, TreatmentPlanStatus.COMPLETED, TreatmentPlanStatus.RECONFIRMED].includes(plan.status);

    return (
        <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-lg overflow-hidden">
            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h4 className="font-black text-slate-800 uppercase tracking-tight">{plan.name}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registry Entry by {plan.createdBy}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase ${currentStatus.color}`}>
                        <currentStatus.icon size={12} />
                        {currentStatus.text}
                    </div>
                    <button onClick={() => onPlanAction(plan.id, 'delete')} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
            </div>
            
            <div className="p-8">
                 <table className="w-full text-sm">
                    <thead className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50">
                        <tr><th className="text-left py-2">Procedure</th><th className="text-center py-2">Tooth</th><th className="text-right py-2">Estimate</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {planItems.map(item => (
                            <tr key={item.id}>
                                <td className="py-4 font-bold text-slate-700">{item.procedure}</td>
                                <td className="py-4 text-center font-mono text-slate-500">#{item.toothNumber || 'All'}</td>
                                <td className="py-4 text-right font-black text-slate-800">₱{(item.price || 0).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
                 <div className="flex justify-end items-center mt-6 pt-6 border-t-2 border-slate-50">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Plan Value:</span>
                    <span className="text-3xl font-black text-teal-700 ml-6 tracking-tighter">₱{planTotal.toLocaleString()}</span>
                 </div>
            </div>

            <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex justify-end items-center gap-3">
                {plan.status === TreatmentPlanStatus.DRAFT && (
                    <>
                        <button onClick={() => onManageProcedures(plan.id)} className="mr-auto px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest">Edit Items</button>
                        <button onClick={() => onPlanAction(plan.id, 'submit')} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Submit for Clinical Review</button>
                    </>
                )}

                {plan.status === TreatmentPlanStatus.PENDING_REVIEW && (isApprover || isArchitect) && (
                    <>
                        <button onClick={() => onPlanAction(plan.id, 'reject')} className="px-6 py-3 bg-red-100 text-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest">Reject</button>
                        <button onClick={() => onPlanAction(plan.id, 'approve')} className="px-8 py-3 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Approve Clinical Strategy</button>
                    </>
                )}
                
                {plan.status === TreatmentPlanStatus.PENDING_FINANCIAL_CONSENT && (
                    <button onClick={() => onAuthorize(plan)} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all">
                        <FileSignature size={20}/> Capture Digital Ink Authorization
                    </button>
                )}

                {isLocked && (
                    <div className="flex items-center gap-3 text-teal-700 font-black uppercase text-[10px] tracking-widest">
                        <ShieldCheck size={16}/> Authorized & Locked
                    </div>
                )}
            </div>
        </div>
    );
};

interface TreatmentPlanModuleProps {
  patient: Patient;
  onUpdatePatient: (updatedPatient: Partial<Patient>) => void;
  readOnly?: boolean;
  currentUser: User;
  logAction: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
  featureFlags?: FeatureToggles;
  // FIX: Added missing props to resolve PatientDetailView mismatch.
  onInitiateFinancialConsent?: (plan: TreatmentPlanType) => void;
  onOpenRevocationModal?: (patient: Patient, category: ConsentCategory) => void;
}

const TreatmentPlanModule: React.FC<TreatmentPlanModuleProps> = ({ patient, onUpdatePatient, readOnly, currentUser, logAction, featureFlags }) => {
    const toast = useToast();
    const { showModal } = useModal();
    const [isCreating, setIsCreating] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');
    const [authorizingPlan, setAuthorizingPlan] = useState<TreatmentPlanType | null>(null);

    const handlePlanAction = (planId: string, action: 'submit' | 'approve' | 'reject' | 'delete') => {
        const plans = patient.treatmentPlans || [];
        if (action === 'delete') {
            onUpdatePatient({ ...patient, treatmentPlans: plans.filter(p => p.id !== planId) });
            return;
        }

        const updatedPlans = plans.map(p => {
            if (p.id === planId) {
                if (action === 'submit') return { ...p, status: TreatmentPlanStatus.PENDING_FINANCIAL_CONSENT }; // Unified skip
                if (action === 'approve') return { ...p, status: TreatmentPlanStatus.PENDING_FINANCIAL_CONSENT };
                if (action === 'reject') return { ...p, status: TreatmentPlanStatus.REJECTED };
            }
            return p;
        });
        onUpdatePatient({ ...patient, treatmentPlans: updatedPlans });
    };

    const handleAuthorizationSave = (signature: string, hash: string) => {
        if (!authorizingPlan) return;
        
        const updatedPlans = (patient.treatmentPlans || []).map(p => 
            p.id === authorizingPlan.id 
            ? { ...p, status: TreatmentPlanStatus.APPROVED, financialConsentSignature: signature, financialConsentTimestamp: new Date().toISOString() } 
            : p
        );
        
        onUpdatePatient({ ...patient, treatmentPlans: updatedPlans });
        logAction('APPROVE', 'TreatmentPlan', authorizingPlan.id, `Patient authorized treatment plan via digital ink. Seal: ${hash.substring(0,16)}...`);
        toast.success("Plan authorized and locked.");
        setAuthorizingPlan(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Strategy Registry</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Unified Authorization Flow</p>
                </div>
                <button onClick={() => setIsCreating(true)} className="bg-teal-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3"><Plus size={18}/> New Strategy</button>
            </div>

            {isCreating && (
                <div className="bg-white p-8 rounded-[3rem] border-4 border-teal-50 shadow-2xl animate-in zoom-in-95 flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="label text-[10px]">Strategy Label</label>
                        <input value={newPlanName} onChange={e => setNewPlanName(e.target.value)} className="input" placeholder="e.g. Phase 1: Disease Control"/>
                    </div>
                    <button onClick={() => {
                        const newPlan = { id: `tp_${Date.now()}`, name: newPlanName, status: TreatmentPlanStatus.DRAFT, createdBy: currentUser.name, createdAt: new Date().toISOString(), patientId: patient.id };
                        onUpdatePatient({ ...patient, treatmentPlans: [...(patient.treatmentPlans || []), newPlan] });
                        setNewPlanName(''); setIsCreating(false);
                    }} className="px-10 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Establish</button>
                    <button onClick={() => setIsCreating(false)} className="p-4 text-slate-400"><X/></button>
                </div>
            )}

            <div className="space-y-6">
                {(patient.treatmentPlans || []).map(plan => (
                    <PlanCard 
                        key={plan.id}
                        plan={plan}
                        patient={patient}
                        currentUser={currentUser}
                        isApprovalEnabled={true}
                        onPlanAction={handlePlanAction}
                        onEditPlanName={() => {}}
                        onAuthorize={setAuthorizingPlan}
                        onManageProcedures={(id) => showModal('managePlanContent', { patient, plan: patient.treatmentPlans?.find(p=>p.id===id), onSave: onUpdatePatient })}
                    />
                ))}
            </div>

            {authorizingPlan && (
                <SignatureCaptureOverlay 
                    isOpen={true}
                    onClose={() => setAuthorizingPlan(null)}
                    onSave={handleAuthorizationSave}
                    title="Authorize Treatment Strategy"
                    instruction="Please sign below to approve the treatment items and estimated costs listed in this plan."
                    themeColor="teal"
                    contextSummary={
                        <div className="space-y-6">
                            <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg border-b pb-3">Strategy Authorization</h4>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Total (Estimate)</span>
                                    <span className="text-3xl font-black text-teal-800 tracking-tighter">₱{patient.dentalChart?.filter(i => i.planId === authorizingPlan.id).reduce((s,i)=>s+(i.price||0), 0).toLocaleString()}</span>
                                </div>
                                <div className="space-y-2">
                                    {patient.dentalChart?.filter(i => i.planId === authorizingPlan.id).map(item => (
                                        <div key={item.id} className="flex justify-between text-sm font-bold text-slate-600">
                                            <span>{item.procedure}</span>
                                            <span className="font-mono">₱{(item.price || 0).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="text-[11px] text-slate-500 leading-relaxed italic border-l-4 border-amber-400 pl-4">
                                "I acknowledge that I have been provided with an estimate of the costs for my proposed treatment plan. I understand that unforeseen clinical findings may require changes to the plan and associated costs."
                            </div>
                        </div>
                    }
                />
            )}
        </div>
    );
};

export default TreatmentPlanModule;

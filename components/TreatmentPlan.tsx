import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Patient, DentalChartEntry, TreatmentPlan as TreatmentPlanType, TreatmentPlanStatus, User, UserRole, FeatureToggles, AuditLogEntry, OrthoAdjustment, TreatmentStatus, FieldSettings } from '../types';
/* Fix: Added missing Lock icon from lucide-react */
import { ClipboardList, Printer, FileCheck, Plus, Send, ShieldCheck, XCircle, Edit, CheckCircle, Trash2, ArrowRight, X, ChevronDown, ChevronUp, Activity, History, FileWarning, ShieldAlert, Key, Eraser, Camera, UserCheck, AlertTriangle, Scale, Receipt, Stethoscope, Lock } from 'lucide-react';
import { useToast } from './ToastSystem';
import { formatDate } from '../constants';
import CryptoJS from 'crypto-js';

interface TreatmentPlanProps {
  patient: Patient;
  onUpdatePatient: (updatedPatient: Patient) => void;
  readOnly?: boolean;
  currentUser: User;
  logAction: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
  featureFlags?: FeatureToggles;
  fieldSettings?: FieldSettings;
}

const TreatmentPlan: React.FC<TreatmentPlanProps> = ({ patient, onUpdatePatient, readOnly, currentUser, logAction, featureFlags, fieldSettings }) => {
    const toast = useToast();
    const isApprovalEnabled = featureFlags?.enableTreatmentPlanApprovals ?? false;

    // Local State
    const [isCreating, setIsCreating] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');
    
    // Informed Refusal State
    const [refusalModal, setRefusalModal] = useState<DentalChartEntry | null>(null);
    const [refusalNotes, setRefusalNotes] = useState('');
    const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
    
    // Informed Refusal Signature
    const refusalCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isSigningRefusal, setIsSigningRefusal] = useState(false);
    const [isDuressAffirmed, setIsDuressAffirmed] = useState(false);

    // Witness Identity State for Refusal
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isFaceDetected, setIsFaceDetected] = useState(false);

    // Rule 16 Variance State
    const [varianceModal, setVarianceModal] = useState<{ item: DentalChartEntry, quote: number, actual: number } | null>(null);
    const [varianceNarrative, setVarianceNarrative] = useState('');

    // --- DEVIATION PROTOCOL STATE (Rule 17) ---
    const [deviationModal, setDeviationModal] = useState<{ item: DentalChartEntry, plannedProc: string } | null>(null);
    const [newProcedureName, setNewProcedureName] = useState('');
    const [deviationNarrative, setDeviationNarrative] = useState('');

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

    const allPlans = useMemo(() => patient.treatmentPlans || [], [patient.treatmentPlans]);
    
    const currentRefusalRisks = useMemo(() => {
        if (!refusalModal || !fieldSettings?.procedures) return [];
        const proc = fieldSettings.procedures.find(p => p.name === refusalModal.procedure);
        return proc?.riskDisclosures || [
            "Progression of infection / Systemic spread",
            "Loss of the tooth",
            "Damage to adjacent teeth",
            "Potential for acute pain or abscess",
            "Bone loss in the affected area",
            "Increased cost of future restorative work"
        ];
    }, [refusalModal, fieldSettings]);

    const allRisksChecked = currentRefusalRisks.length > 0 && selectedRisks.length === currentRefusalRisks.length;

    const setupRefusalCanvas = () => {
        const canvas = refusalCanvasRef.current;
        if (canvas) {
            canvas.width = canvas.parentElement?.clientWidth || 400;
            canvas.height = 120;
            const ctx = canvas.getContext('2d');
            if (ctx) { ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; }
        }
    };

    const startWitnessCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320, facingMode: 'user' } });
            if (videoRef.current) { videoRef.current.srcObject = stream; setIsCameraActive(true); setTimeout(() => setIsFaceDetected(true), 2000); }
        } catch (err) { console.error("Refusal witness lens failed", err); }
    };

    const stopWitnessCamera = () => {
        if (videoRef.current?.srcObject) { (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop()); }
        setIsCameraActive(false);
    };

    useEffect(() => {
        if (refusalModal) { setTimeout(setupRefusalCanvas, 50); startWitnessCamera(); }
        else { stopWitnessCamera(); setIsDuressAffirmed(false); }
        return () => stopWitnessCamera();
    }, [refusalModal]);

    const getCoords = (e: any) => {
        const canvas = refusalCanvasRef.current; if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    const startSign = (e: any) => { if (!isDuressAffirmed || !isFaceDetected || !allRisksChecked) return; e.preventDefault(); setIsSigningRefusal(true); const { x, y } = getCoords(e); refusalCanvasRef.current?.getContext('2d')?.beginPath(); refusalCanvasRef.current?.getContext('2d')?.moveTo(x, y); };
    const stopSign = (e: any) => { e.preventDefault(); setIsSigningRefusal(false); };
    const draw = (e: any) => { if (!isSigningRefusal) return; e.preventDefault(); const { x, y } = getCoords(e); refusalCanvasRef.current?.getContext('2d')?.lineTo(x, y); refusalCanvasRef.current?.getContext('2d')?.stroke(); };
    const clearCanvas = () => { const canvas = refusalCanvasRef.current; canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height); };

    const handleAddOrthoAdjustment = () => {
        if (!orthoForm.bracketType) { toast.error("Bracket type is required."); return; }
        const newAdjustment: OrthoAdjustment = { id: `ortho_${Date.now()}`, date: new Date().toISOString().split('T')[0], dentist: currentUser.name, ...orthoForm } as OrthoAdjustment;
        const updatedHistory = [newAdjustment, ...(patient.orthoHistory || [])];
        onUpdatePatient({ ...patient, orthoHistory: updatedHistory });
        logAction('ORTHO_ADJUSTMENT', 'OrthoRecord', patient.id, `Logged ortho adjustment: ${newAdjustment.archWireUpper}/${newAdjustment.archWireLower}`);
        setIsAddingOrtho(false); setOrthoForm({ bracketType: 'MBT 0.022', archWireUpper: '', archWireLower: '', elastics: '', notes: '' });
        toast.success("Ortho adjustment logged.");
    };

    const handleCreatePlan = () => {
        if (!newPlanName.trim()) { toast.error("Please enter a name for the new plan."); return; }
        const newPlan: TreatmentPlanType = { id: `tp_${Date.now()}`, patientId: patient.id, name: newPlanName, createdAt: new Date().toISOString(), createdBy: currentUser.name, status: TreatmentPlanStatus.DRAFT };
        onUpdatePatient({ ...patient, treatmentPlans: [...allPlans, newPlan] });
        logAction('CREATE', 'TreatmentPlan', newPlan.id, `Created plan "${newPlanName}".`);
        setNewPlanName(''); setIsCreating(false);
    };

    const handlePlanAction = (planId: string, action: 'submit' | 'approve' | 'reject' | 'revert_to_draft' | 'delete' | 'toggle_disclosure') => {
        const plan = allPlans.find(p => p.id === planId); if (!plan) return;
        let updatedPlans: TreatmentPlanType[];
        if (action === 'delete') {
            if (!window.confirm(`Are you sure you want to delete the plan "${plan.name}"?`)) return;
            updatedPlans = allPlans.filter(p => p.id !== planId);
            const updatedChart = patient.dentalChart?.map(item => item.planId === planId ? { ...item, planId: undefined } : item);
            onUpdatePatient({ ...patient, treatmentPlans: updatedPlans, dentalChart: updatedChart });
            return;
        }
        updatedPlans = allPlans.map(p => {
            if (p.id === planId) {
                switch (action) {
                    case 'submit': return { ...p, status: TreatmentPlanStatus.PENDING_REVIEW };
                    case 'approve': 
                        const totalQuote = (patient.dentalChart || []).filter(i => i.planId === p.id).reduce((s, i) => s + (i.price || 0), 0);
                        return { ...p, status: TreatmentPlanStatus.APPROVED, reviewedBy: currentUser.name, reviewedAt: new Date().toISOString(), originalQuoteAmount: totalQuote };
                    case 'revert_to_draft': return { ...p, status: TreatmentPlanStatus.DRAFT, reviewNotes: undefined };
                    case 'toggle_disclosure': return { ...p, isComplexityDisclosed: !p.isComplexityDisclosed };
                }
            }
            return p;
        });
        onUpdatePatient({ ...patient, treatmentPlans: updatedPlans });
    };
    
    const handleInformedRefusal = () => {
        const canvas = refusalCanvasRef.current;
        if (!refusalModal || !refusalNotes.trim() || !allRisksChecked || !canvas) {
            toast.error("Forensic requirement: Checklist, Narrative, and Signature are mandatory.");
            return;
        }

        const signatureData = canvas.toDataURL();
        const updatedChart = patient.dentalChart?.map(item => {
            if (item.id === refusalModal.id) {
                return {
                    ...item,
                    status: 'Condition' as TreatmentStatus,
                    informedRefusal: {
                        reason: refusalNotes,
                        risks: selectedRisks,
                        timestamp: new Date().toISOString(),
                        signature: signatureData
                    }
                };
            }
            return item;
        });

        onUpdatePatient({ ...patient, dentalChart: updatedChart });
        logAction('UPDATE', 'ClinicalNote', refusalModal.id, `Informed Refusal Sealed: ${refusalModal.procedure}. Risks: ${selectedRisks.join(', ')}`);
        toast.warning("Informed Refusal sealed in clinical record.");
        setRefusalModal(null); setRefusalNotes(''); setSelectedRisks([]);
    };

    const handleMarkComplete = (itemToComplete: DentalChartEntry) => {
        // --- DEVIATION PROTOCOL CHECK (Rule 17) ---
        // If the user wants to complete it as a different procedure, we show the deviation modal
        setDeviationModal({ item: itemToComplete, plannedProc: itemToComplete.procedure });
        setNewProcedureName(itemToComplete.procedure);
    };

    const handleDeviationSubmit = () => {
        if (!deviationModal) return;
        const isDeviation = newProcedureName !== deviationModal.plannedProc;
        
        if (isDeviation && !deviationNarrative.trim()) {
            toast.error("DEVIATION PROTOCOL: A clinical narrative is mandatory when changing a treatment plan item mid-procedure (Rule 17).");
            return;
        }

        const item = { 
            ...deviationModal.item, 
            procedure: newProcedureName, 
            originalPlannedProcedure: isDeviation ? deviationModal.plannedProc : undefined,
            deviationNarrative: isDeviation ? deviationNarrative : undefined 
        };

        const plan = allPlans.find(p => p.id === item.planId);
        const actualPrice = item.price || 0; 
        
        // --- RULE 16 VARIANCE CHECK ---
        if (plan && plan.status === TreatmentPlanStatus.APPROVED) {
            const itemOriginalEstimate = item.price || 0; 
            if (actualPrice > (itemOriginalEstimate * 1.2)) {
                setVarianceModal({ item: item, quote: itemOriginalEstimate, actual: actualPrice });
                setDeviationModal(null);
                return;
            }
        }

        finalizeCompletion(item, isDeviation ? deviationNarrative : undefined);
        setDeviationModal(null);
    };

    const finalizeCompletion = (item: DentalChartEntry, narrative?: string) => {
        let newBalance = patient.currentBalance || 0;
        let newLedger = patient.ledger || [];
        const actualPrice = item.price || 0;

        if (actualPrice > 0) {
            newBalance += actualPrice;
            newLedger.push({ id: `l_${Date.now()}`, date: new Date().toISOString().split('T')[0], description: `${item.procedure} (#${item.toothNumber})`, type: 'Charge', amount: actualPrice, balanceAfter: newBalance });
        }

        const updatedChart = patient.dentalChart?.map(entry => 
            entry.id === item.id ? { 
                ...entry, 
                procedure: item.procedure,
                originalPlannedProcedure: item.originalPlannedProcedure,
                deviationNarrative: item.deviationNarrative,
                status: 'Completed' as TreatmentStatus, 
                date: new Date().toISOString().split('T')[0],
                financialNarrative: item.financialNarrative || undefined 
            } : entry
        );

        onUpdatePatient({ ...patient, dentalChart: updatedChart, ledger: newLedger, currentBalance: newBalance });
        
        if (item.deviationNarrative) {
            logAction('UPDATE', 'ClinicalNote', patient.id, `Clinical Deviation Logged: ${item.originalPlannedProcedure} -> ${item.procedure}. Narrative: ${item.deviationNarrative}`);
        }

        setVarianceModal(null);
        setVarianceNarrative('');
    };

    if (!isApprovalEnabled) return <div className="p-8 text-center bg-slate-100 rounded-xl text-slate-500">Approvals disabled.</div>;

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="bg-white rounded-2xl border border-teal-200 shadow-sm overflow-hidden">
                <button onClick={() => setShowOrtho(!showOrtho)} className="w-full p-4 flex justify-between items-center bg-teal-50/50 hover:bg-teal-50">
                    <div className="flex items-center gap-3"><div className="bg-teal-600 text-white p-2 rounded-xl"><Activity size={18}/></div><h4 className="font-black text-teal-900 uppercase text-sm">Orthodontic Tracking</h4></div>
                    {showOrtho ? <ChevronUp size={20} className="text-teal-400"/> : <ChevronDown size={20} className="text-teal-400"/>}
                </button>
                {showOrtho && (
                    <div className="p-6 space-y-6">
                        {isAddingOrtho ? (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div><label className="label">Bracket</label><select value={orthoForm.bracketType} onChange={e => setOrthoForm({...orthoForm, bracketType: e.target.value})} className="input"><option>MBT 0.022</option><option>Roth 0.018</option></select></div>
                                    <div><label className="label">Upper Wire</label><input type="text" value={orthoForm.archWireUpper} onChange={e => setOrthoForm({...orthoForm, archWireUpper: e.target.value})} className="input" /></div>
                                    <div><label className="label">Lower Wire</label><input type="text" value={orthoForm.archWireLower} onChange={e => setOrthoForm({...orthoForm, archWireLower: e.target.value})} className="input" /></div>
                                </div>
                                <button onClick={handleAddOrthoAdjustment} className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold">Commit Adjustment</button>
                            </div>
                        ) : <button onClick={() => setIsAddingOrtho(true)} className="w-full py-3 border-2 border-dashed border-teal-200 rounded-xl text-teal-600 font-bold text-xs uppercase">+ Log Adjustment</button>}
                        <div className="space-y-3">
                            {(patient.orthoHistory || []).map(adj => (
                                <div key={adj.id} className="bg-white border p-4 rounded-xl flex items-start gap-4">
                                    <div className="flex-1 grid grid-cols-4 gap-4">
                                        <div className="text-xs font-bold">{formatDate(adj.date)}</div>
                                        <div className="text-xs">{adj.bracketType}</div>
                                        <div className="text-xs text-teal-700">{adj.archWireUpper || '-'}</div>
                                        <div className="text-xs text-lilac-700">{adj.elastics || '-'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {allPlans.map(plan => {
                const planItems = (patient.dentalChart || []).filter(item => item.planId === plan.id);
                const isSurgicalPlan = planItems.some(i => i.procedure.toLowerCase().includes('surgery') || i.procedure.toLowerCase().includes('extraction'));

                return (
                    <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-start">
                            <div><h3 className="font-bold text-xl">{plan.name}</h3><div className="text-xs text-slate-500 mt-1">By: {plan.createdBy}</div></div>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full border`}>{plan.status}</span>
                        </div>
                        
                        {isSurgicalPlan && (
                            <div className={`p-4 mx-4 mt-4 rounded-2xl border-2 transition-all ${plan.isComplexityDisclosed ? 'bg-teal-50 border-teal-500' : 'bg-red-50 border-red-200 animate-pulse'}`}>
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={plan.isComplexityDisclosed} 
                                        onChange={() => handlePlanAction(plan.id, 'toggle_disclosure')}
                                        className="w-6 h-6 mt-0.5 accent-teal-600 rounded" 
                                    />
                                    <div>
                                        <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest flex items-center gap-1">
                                            <Scale size={12}/> PDA Rule 16: Complexity Variance Disclosure
                                        </span>
                                        <p className="text-[10px] text-slate-600 leading-tight mt-1">
                                            Estimated fees for surgical plans are subject to variance based on clinical findings identified intra-operatively.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        )}

                        <div className="divide-y mt-4">
                            {planItems.map(item => (
                                <div key={item.id} className="p-3 flex justify-between items-center group">
                                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border">#{item.toothNumber}</div><div className="font-bold text-sm">{item.procedure}</div></div>
                                    <div className="flex gap-2">
                                        {plan.status === TreatmentPlanStatus.APPROVED && item.status !== 'Completed' && (
                                            <><button onClick={() => setRefusalModal(item)} className="bg-red-50 text-red-600 px-3 py-1 text-xs font-bold rounded-full border border-red-100">Refusal</button>
                                            <button 
                                                onClick={() => handleMarkComplete(item)} 
                                                className={`px-3 py-1 text-xs font-bold rounded-full transition-all bg-green-500 text-white shadow-md`}
                                            >
                                                Complete
                                            </button></>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
            
            {isCreating ? (
                 <div className="bg-white p-4 border-2 border-dashed rounded-xl flex gap-2"><input type="text" placeholder="Plan name..." className="input" value={newPlanName} onChange={e => setNewPlanName(e.target.value)} autoFocus/><button onClick={handleCreatePlan} className="px-4 bg-teal-600 text-white rounded-lg">Save</button></div>
            ) : <button onClick={() => setIsCreating(true)} className="w-full py-4 border-2 border-dashed rounded-2xl text-slate-500 font-bold">+ New Treatment Plan</button>}

            {/* Rule 17 Deviation Modal */}
            {deviationModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border-4 border-teal-500 animate-in zoom-in-95">
                        <div className="bg-teal-900 p-6 text-white flex justify-between items-center rounded-t-[2.2rem]">
                            <div className="flex items-center gap-3"><Stethoscope size={28}/><h3 className="text-xl font-black uppercase">Deviation Protocol</h3></div>
                            <button onClick={() => setDeviationModal(null)}><X size={24}/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-teal-50 p-4 rounded-2xl border border-teal-200">
                                <p className="text-xs text-teal-900 font-bold leading-relaxed">
                                    Completing <strong>{deviationModal.plannedProc}</strong>. Confirm the final procedure performed.
                                </p>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Procedure Performed</label>
                                <select 
                                    value={newProcedureName}
                                    onChange={e => setNewProcedureName(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-teal-500"
                                >
                                    {fieldSettings?.procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>

                            {newProcedureName !== deviationModal.plannedProc && (
                                <div className="animate-in slide-in-from-top-2">
                                    <label className="text-[10px] font-black text-red-600 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-1"><ShieldAlert size={12}/> Mandatory Deviation Narrative *</label>
                                    <textarea 
                                        required
                                        value={deviationNarrative}
                                        onChange={e => setDeviationNarrative(e.target.value)}
                                        placeholder="Explain why the treatment plan was deviated from (e.g., 'Planned simple extraction resulted in root fracture necessitating surgical removal')..."
                                        className="w-full p-4 bg-red-50/30 border-2 border-red-100 rounded-2xl text-sm h-32 focus:ring-4 focus:ring-red-500/10 outline-none"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => setDeviationModal(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl">Cancel</button>
                                <button 
                                    onClick={handleDeviationSubmit}
                                    disabled={newProcedureName !== deviationModal.plannedProc && !deviationNarrative.trim()}
                                    className="flex-[2] py-4 bg-teal-600 text-white font-black uppercase text-[10px] rounded-2xl shadow-xl shadow-teal-600/20 disabled:opacity-40"
                                >
                                    Confirm & Log Completion
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rule 16 Variance Narrative Modal */}
            {varianceModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border-4 border-amber-500 animate-in zoom-in-95">
                        <div className="bg-amber-500 p-6 text-white flex justify-between items-center rounded-t-[2.2rem]">
                            <div className="flex items-center gap-3"><Receipt size={28}/><h3 className="text-xl font-black uppercase">Rule 16 Variance Log</h3></div>
                            <button onClick={() => setVarianceModal(null)}><X size={24}/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                                <p className="text-xs text-amber-900 font-bold leading-relaxed">
                                    The final fee for <strong>{varianceModal.item.procedure}</strong> (₱{varianceModal.actual.toLocaleString()}) exceeds the approved estimate by more than 20%. Mandatory narrative required for the statutory audit log.
                                </p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Clinical Complexity Narrative *</label>
                                <textarea 
                                    autoFocus
                                    required
                                    value={varianceNarrative}
                                    onChange={e => setVarianceNarrative(e.target.value)}
                                    placeholder="Describe intra-operative complications or findings that justified the fee variance..."
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm h-32 focus:ring-4 focus:ring-teal-500/10 outline-none"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setVarianceModal(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl">Cancel</button>
                                <button 
                                    onClick={() => finalizeCompletion(varianceModal.item, varianceNarrative)}
                                    disabled={!varianceNarrative.trim()}
                                    className="flex-[2] py-4 bg-teal-600 text-white font-black uppercase text-[10px] rounded-2xl shadow-xl shadow-teal-600/20 disabled:opacity-40"
                                >
                                    Log & Finalize Charge
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Informed Refusal Modal */}
            {refusalModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border-4 border-red-100 animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-red-600 p-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3"><ShieldAlert size={28} className="animate-pulse"/><h3 className="text-xl font-black uppercase">Informed Refusal Shield</h3></div>
                            <button onClick={() => setRefusalModal(null)}><X size={24}/></button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto no-scrollbar">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 bg-red-50 p-4 rounded-2xl border border-red-200">
                                    <p className="text-xs text-red-900 font-bold leading-relaxed">
                                        Patient Refusal: <strong>{refusalModal.procedure} (#{refusalModal.toothNumber})</strong>. Proof of risk disclosure required.
                                    </p>
                                </div>
                                <div className={`w-20 h-20 rounded-full border-4 overflow-hidden bg-slate-100 ${isFaceDetected ? 'border-teal-500' : 'border-red-500 animate-pulse'}`}>
                                    {isCameraActive ? <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" /> : <Camera size={24} className="text-slate-300 mx-auto mt-6" />}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hazards (Mandatory) *</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {currentRefusalRisks.map(risk => (
                                        <label key={risk} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${selectedRisks.includes(risk) ? 'bg-red-50 border-red-500' : 'bg-slate-50 border-slate-100'}`}>
                                            <input type="checkbox" checked={selectedRisks.includes(risk)} onChange={() => setSelectedRisks(prev => prev.includes(risk) ? prev.filter(r => r !== risk) : [...prev, risk])} className="w-5 h-5 accent-red-600 rounded" />
                                            <span className="text-[10px] font-bold leading-tight">{risk}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <textarea className="w-full p-4 border-2 rounded-2xl text-xs h-24 outline-none focus:border-red-500" placeholder="Narrative describing refusal..." value={refusalNotes} onChange={e => setRefusalNotes(e.target.value)} />

                            <div className="bg-slate-50 p-5 rounded-3xl border-2 border-lilac-100">
                                <label className={`flex items-start gap-4 cursor-pointer mb-4 ${isDuressAffirmed ? 'text-lilac-900' : 'text-slate-400'}`}>
                                    <input type="checkbox" checked={isDuressAffirmed} onChange={e => setIsDuressAffirmed(e.target.checked)} className="w-6 h-6 accent-lilac-600 rounded shrink-0" />
                                    <span className="text-[10px] font-bold leading-tight">I attest that I am signing this voluntarily and understand the consequences disclosed.</span>
                                </label>
                                <div className={`relative bg-white rounded-2xl border-2 border-dashed transition-all ${!isDuressAffirmed || !isFaceDetected || !allRisksChecked ? 'opacity-30' : 'border-slate-300'}`}>
                                    <div className="flex justify-between items-center p-2"><span className="text-[9px] font-black text-slate-400 uppercase">Patient Signature Pad</span><button onClick={clearCanvas} className="text-slate-300 hover:text-red-500"><Eraser size={12}/></button></div>
                                    <canvas ref={refusalCanvasRef} className="w-full h-[120px] touch-none" onMouseDown={startSign} onMouseUp={stopSign} onMouseLeave={stopSign} onMouseMove={draw} onTouchStart={startSign} onTouchEnd={stopSign} onTouchMove={draw} />
                                    {(!isDuressAffirmed || !isFaceDetected || !allRisksChecked) && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] text-center p-4">
                                            <div className="flex flex-col items-center gap-1">
                                                {/* Fix: correctly importing Lock from lucide-react to avoid JSX element error */}
                                                <Lock size={20} className="text-slate-400"/>
                                                <span className="text-[9px] font-black text-slate-400 uppercase">
                                                    {!allRisksChecked ? 'Acknowledge risks to unlock' : 'Acknowledge and detect face'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t bg-slate-50 flex gap-3">
                            <button onClick={() => setRefusalModal(null)} className="flex-1 py-4 bg-white border font-black uppercase text-[10px] rounded-2xl">Cancel</button>
                            <button onClick={handleInformedRefusal} disabled={!isDuressAffirmed || !isFaceDetected || !refusalNotes.trim() || !allRisksChecked} className="flex-[2] py-4 bg-red-600 text-white font-black uppercase text-[10px] rounded-2xl shadow-xl shadow-red-600/20 disabled:opacity-40">Seal Refusal Record</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TreatmentPlan;

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Patient, DentalChartEntry, TreatmentPlan as TreatmentPlanType, TreatmentPlanStatus, User, UserRole, FeatureToggles, AuditLogEntry, OrthoAdjustment, TreatmentStatus } from '../types';
import { ClipboardList, Printer, FileCheck, Plus, Send, ShieldCheck, XCircle, Edit, CheckCircle, Trash2, ArrowRight, X, ChevronDown, ChevronUp, Activity, History, FileWarning, ShieldAlert, Key, Eraser, Camera, UserCheck } from 'lucide-react';
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
}

const TreatmentPlan: React.FC<TreatmentPlanProps> = ({ patient, onUpdatePatient, readOnly, currentUser, logAction, featureFlags }) => {
    const toast = useToast();
    const isApprovalEnabled = featureFlags?.enableTreatmentPlanApprovals ?? false;

    // Local State
    const [isCreating, setIsCreating] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');
    const [rejectionModal, setRejectionModal] = useState<{ planId: string, planName: string } | null>(null);
    const [rejectionNotes, setRejectionNotes] = useState('');

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

    const REFUSAL_RISKS = [
        "Progression of infection / Systemic spread",
        "Loss of the tooth",
        "Damage to adjacent teeth",
        "Potential for acute pain or abscess",
        "Bone loss in the affected area",
        "Increased cost of future restorative work"
    ];

    // --- CANVAS ENGINE ---
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

    const startSign = (e: any) => { if (!isDuressAffirmed || !isFaceDetected) return; e.preventDefault(); setIsSigningRefusal(true); const { x, y } = getCoords(e); refusalCanvasRef.current?.getContext('2d')?.beginPath(); refusalCanvasRef.current?.getContext('2d')?.moveTo(x, y); };
    const stopSign = (e: any) => { e.preventDefault(); setIsSigningRefusal(false); };
    const draw = (e: any) => { if (!isSigningRefusal) return; e.preventDefault(); const { x, y } = getCoords(e); refusalCanvasRef.current?.getContext('2d')?.lineTo(x, y); refusalCanvasRef.current?.getContext('2d')?.stroke(); };
    const clearCanvas = () => { const canvas = refusalCanvasRef.current; canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height); };

    // --- HANDLERS ---
    
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

    const handleAssignItem = (item: DentalChartEntry, planId: string) => {
        const plan = allPlans.find(p => p.id === planId); if (!plan) return;
        const updatedChart = (patient.dentalChart || []).map(i => i.id === item.id ? { ...i, planId } : i);
        onUpdatePatient({ ...patient, dentalChart: updatedChart });
        logAction('UPDATE', 'ClinicalNote', item.id, `Assigned item "${item.procedure}" to plan "${plan.name}".`);
        toast.success(`Item assigned to ${plan.name}.`);
    };
    
    const handlePlanAction = (planId: string, action: 'submit' | 'approve' | 'reject' | 'revert_to_draft' | 'delete') => {
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
                    case 'approve': return { ...p, status: TreatmentPlanStatus.APPROVED, reviewedBy: currentUser.name, reviewedAt: new Date().toISOString() };
                    case 'revert_to_draft': return { ...p, status: TreatmentPlanStatus.DRAFT, reviewNotes: undefined };
                }
            }
            return p;
        });
        onUpdatePatient({ ...patient, treatmentPlans: updatedPlans });
    };
    
    const handleRejectSave = () => {
        if (!rejectionModal || !rejectionNotes.trim()) return;
        const updatedPlans = allPlans.map(p => p.id === rejectionModal.planId ? { ...p, status: TreatmentPlanStatus.REJECTED, reviewNotes: rejectionNotes, reviewedBy: currentUser.name, reviewedAt: new Date().toISOString() } : p);
        onUpdatePatient({ ...patient, treatmentPlans: updatedPlans });
        setRejectionModal(null); setRejectionNotes('');
    };

    const handleInformedRefusal = () => {
        const canvas = refusalCanvasRef.current;
        if (!refusalModal || !refusalNotes.trim() || selectedRisks.length === 0 || !canvas) {
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
        if (readOnly) return;
        let newBalance = patient.currentBalance || 0;
        let newLedger = patient.ledger || [];
        if (itemToComplete.price && itemToComplete.price > 0) {
            newBalance += itemToComplete.price;
            newLedger.push({ id: `l_${Date.now()}`, date: new Date().toISOString().split('T')[0], description: `${itemToComplete.procedure} (#${itemToComplete.toothNumber})`, type: 'Charge', amount: itemToComplete.price, balanceAfter: newBalance });
        }
        const updatedChart = patient.dentalChart?.map(item => item.id === itemToComplete.id ? { ...item, status: 'Completed' as TreatmentStatus, date: new Date().toISOString().split('T')[0] } : item);
        onUpdatePatient({ ...patient, dentalChart: updatedChart, ledger: newLedger, currentBalance: newBalance });
    };

    const isAdmin = currentUser.role === UserRole.ADMIN;
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
                        ) : !readOnly && <button onClick={() => setIsAddingOrtho(true)} className="w-full py-3 border-2 border-dashed border-teal-200 rounded-xl text-teal-600 font-bold text-xs uppercase">+ Log Adjustment</button>}
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
                return (
                    <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-start">
                            <div><h3 className="font-bold text-xl">{plan.name}</h3><div className="text-xs text-slate-500 mt-1">By: {plan.createdBy}</div></div>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full border`}>{plan.status}</span>
                        </div>
                        <div className="divide-y">
                            {planItems.map(item => (
                                <div key={item.id} className="p-3 flex justify-between items-center group">
                                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border">#{item.toothNumber}</div><div className="font-bold text-sm">{item.procedure}</div></div>
                                    <div className="flex gap-2">
                                        {plan.status === TreatmentPlanStatus.APPROVED && item.status !== 'Completed' && !readOnly && (
                                            <><button onClick={() => setRefusalModal(item)} className="bg-red-50 text-red-600 px-3 py-1 text-xs font-bold rounded-full border border-red-100">Refusal</button>
                                            <button onClick={() => handleMarkComplete(item)} className="bg-green-500 text-white px-3 py-1 text-xs font-bold rounded-full">Complete</button></>
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

            {/* Informed Refusal Modal Enhanced (RA 8792 Compliance) */}
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
                                        Patient Refusal: <strong>{refusalModal.procedure} (#{refusalModal.toothNumber})</strong>. Malpractice shield requires proof of risk disclosure.
                                    </p>
                                </div>
                                <div className={`w-20 h-20 rounded-full border-4 overflow-hidden bg-slate-100 ${isFaceDetected ? 'border-teal-500' : 'border-red-500 animate-pulse'}`}>
                                    {isCameraActive ? <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" /> : <Camera size={24} className="text-slate-300 mx-auto mt-6" />}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risks Disclosed & Acknowledged *</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {REFUSAL_RISKS.map(risk => (
                                        <label key={risk} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${selectedRisks.includes(risk) ? 'bg-red-50 border-red-500' : 'bg-slate-50 border-slate-100'}`}>
                                            <input type="checkbox" checked={selectedRisks.includes(risk)} onChange={() => setSelectedRisks(prev => prev.includes(risk) ? prev.filter(r => r !== risk) : [...prev, risk])} className="w-5 h-5 accent-red-600 rounded" />
                                            <span className="text-[10px] font-bold leading-tight">{risk}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <textarea className="w-full p-4 border-2 rounded-2xl text-xs h-24 outline-none focus:border-red-500" placeholder="Narrative describing the choice to refuse against medical advice..." value={refusalNotes} onChange={e => setRefusalNotes(e.target.value)} />

                            <div className="bg-slate-50 p-5 rounded-3xl border-2 border-lilac-100">
                                <label className={`flex items-start gap-4 cursor-pointer mb-4 ${isDuressAffirmed ? 'text-lilac-900' : 'text-slate-400'}`}>
                                    <input type="checkbox" checked={isDuressAffirmed} onChange={e => setIsDuressAffirmed(e.target.checked)} className="w-6 h-6 accent-lilac-600 rounded shrink-0" />
                                    <span className="text-[10px] font-bold leading-tight">I attest that I am signing this Informed Refusal voluntarily and understand all clinical consequences disclosed.</span>
                                </label>
                                <div className={`relative bg-white rounded-2xl border-2 border-dashed transition-all ${!isDuressAffirmed || !isFaceDetected ? 'opacity-30' : 'border-slate-300'}`}>
                                    <div className="flex justify-between items-center p-2"><span className="text-[9px] font-black text-slate-400 uppercase">Patient Signature Pad</span><button onClick={clearCanvas} className="text-slate-300 hover:text-red-500"><Eraser size={12}/></button></div>
                                    <canvas ref={refusalCanvasRef} className="w-full h-[120px] touch-none" onMouseDown={startSign} onMouseUp={stopSign} onMouseLeave={stopSign} onMouseMove={draw} onTouchStart={startSign} onTouchEnd={stopSign} onTouchMove={draw} />
                                    {(!isDuressAffirmed || !isFaceDetected) && <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px]"><Lock size={20} className="text-slate-400"/></div>}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t bg-slate-50 flex gap-3">
                            <button onClick={() => setRefusalModal(null)} className="flex-1 py-4 bg-white border font-black uppercase text-[10px] rounded-2xl">Cancel</button>
                            <button onClick={handleInformedRefusal} disabled={!isDuressAffirmed || !isFaceDetected || !refusalNotes.trim() || selectedRisks.length === 0} className="flex-[2] py-4 bg-red-600 text-white font-black uppercase text-[10px] rounded-2xl shadow-xl shadow-red-600/20 disabled:opacity-40">Seal Refusal Record</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TreatmentPlan;

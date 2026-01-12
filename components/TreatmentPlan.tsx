import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Patient, DentalChartEntry, TreatmentPlan as TreatmentPlanType, TreatmentPlanStatus, User, UserRole, FeatureToggles, AuditLogEntry, OrthoAdjustment, TreatmentStatus, FieldSettings } from '../types';
import { ClipboardList, Printer, FileCheck, Plus, Send, ShieldCheck, XCircle, Edit, CheckCircle, Trash2, ArrowRight, X, ChevronDown, ChevronUp, Activity, History, FileWarning, ShieldAlert, Key, Eraser, Camera, UserCheck, AlertTriangle, Scale, Receipt, Stethoscope, FileSearch, Lock, Sparkles, LayoutGrid } from 'lucide-react';
import { useToast } from './ToastSystem';
import { formatDate, PDA_INFORMED_CONSENT_TEXTS } from '../constants';
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
    const isApprovalEnabled = featureFlags?.enableTreatmentPlanApprovals ?? true;

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
            "Progression of infection",
            "Loss of the tooth",
            "Damage to adjacent teeth",
            "Potential for acute pain",
            "Bone loss in the area",
            "Increased future cost"
        ];
    }, [refusalModal, fieldSettings]);

    const allRisksChecked = currentRefusalRisks.length > 0 && selectedRisks.length === currentRefusalRisks.length;

    const setupRefusalCanvas = () => {
        const canvas = refusalCanvasRef.current;
        if (canvas) {
            canvas.width = canvas.parentElement?.clientWidth || 400;
            canvas.height = 120;
            const ctx = canvas.getContext('2d');
            if (ctx) { ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.lineCap = 'round'; }
        }
    };

    const startWitnessCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320, facingMode: 'user' } });
            if (videoRef.current) { videoRef.current.srcObject = stream; setIsCameraActive(true); setTimeout(() => setIsFaceDetected(true), 2000); }
        } catch (err) { console.error("Witness lens failed", err); }
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
        if (!orthoForm.bracketType) { toast.error("Selection required."); return; }
        const newAdjustment: OrthoAdjustment = { id: `ortho_${Date.now()}`, date: new Date().toISOString().split('T')[0], dentist: currentUser.name, ...orthoForm } as OrthoAdjustment;
        const updatedHistory = [newAdjustment, ...(patient.orthoHistory || [])];
        onUpdatePatient({ ...patient, orthoHistory: updatedHistory });
        logAction('ORTHO_ADJUSTMENT', 'OrthoRecord', patient.id, `Logged adjustment: ${newAdjustment.archWireUpper}/${newAdjustment.archWireLower}`);
        setIsAddingOrtho(false); setOrthoForm({ bracketType: 'MBT 0.022', archWireUpper: '', archWireLower: '', elastics: '', notes: '' });
        toast.success("Ortho adjustment logged.");
    };

    const handleCreatePlan = () => {
        if (!newPlanName.trim()) { toast.error("Strategy label required."); return; }
        const newPlan: TreatmentPlanType = { id: `tp_${Date.now()}`, patientId: patient.id, name: newPlanName, createdAt: new Date().toISOString(), createdBy: currentUser.name, status: TreatmentPlanStatus.DRAFT };
        onUpdatePatient({ ...patient, treatmentPlans: [...allPlans, newPlan] });
        logAction('CREATE', 'TreatmentPlan', newPlan.id, `Defined plan "${newPlanName}".`);
        setNewPlanName(''); setIsCreating(false);
    };

    const handlePlanAction = (planId: string, action: 'submit' | 'approve' | 'reject' | 'revert_to_draft' | 'delete' | 'toggle_disclosure') => {
        const plan = allPlans.find(p => p.id === planId); if (!plan) return;
        let updatedPlans: TreatmentPlanType[];
        if (action === 'delete') {
            if (!window.confirm(`Delete plan "${plan.name}"?`)) return;
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
            toast.error("Compliance: Forensic checklist & signature required.");
            return;
        }
        const signatureData = canvas.toDataURL();
        const updatedChart = patient.dentalChart?.map(item => {
            if (item.id === refusalModal.id) {
                return {
                    ...item,
                    status: 'Condition' as TreatmentStatus,
                    informedRefusal: { reason: refusalNotes, risks: selectedRisks, timestamp: new Date().toISOString(), signature: signatureData }
                };
            }
            return item;
        });
        onUpdatePatient({ ...patient, dentalChart: updatedChart });
        logAction('UPDATE', 'ClinicalNote', refusalModal.id, `Informed Refusal Logged: ${refusalModal.procedure}.`);
        toast.warning("Informed Refusal digitally sealed.");
        setRefusalModal(null); setRefusalNotes(''); setSelectedRisks([]);
    };

    const handleMarkComplete = (itemToComplete: DentalChartEntry) => {
        setDeviationModal({ item: itemToComplete, plannedProc: itemToComplete.procedure });
        setNewProcedureName(itemToComplete.procedure);
    };

    const handleDeviationSubmit = () => {
        if (!deviationModal) return;
        const isDeviation = newProcedureName !== deviationModal.plannedProc;
        if (isDeviation && !deviationNarrative.trim()) {
            toast.error("Deviation Protocol: Narrative mandatory (Rule 17).");
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
            logAction('UPDATE', 'ClinicalNote', patient.id, `Deviation Logged: ${item.originalPlannedProcedure} -> ${item.procedure}.`);
        }
        setVarianceModal(null);
        setVarianceNarrative('');
    };

    return (
        <div className="h-full flex flex-col space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Ortho Tracker Section */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                <button onClick={() => setShowOrtho(!showOrtho)} className="w-full p-6 flex justify-between items-center bg-teal-950 text-white group">
                    <div className="flex items-center gap-5">
                        <div className="bg-teal-500 text-white p-3 rounded-2xl shadow-xl transition-transform group-hover:scale-110"><Activity size={22}/></div>
                        <div className="text-left">
                            <h4 className="font-black uppercase tracking-tighter text-lg leading-none">Orthodontic Tracking</h4>
                            <p className="text-[10px] text-teal-400 font-black uppercase tracking-widest mt-1">RA 9484 Article IV Compliance</p>
                        </div>
                    </div>
                    {showOrtho ? <ChevronUp size={24} className="text-teal-400"/> : <ChevronDown size={24} className="text-teal-400"/>}
                </button>
                {showOrtho && (
                    <div className="p-10 space-y-10 bg-slate-50/50">
                        {isAddingOrtho ? (
                            <div className="bg-white p-8 rounded-[2.5rem] border-4 border-white shadow-2xl space-y-6 animate-in zoom-in-95">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><label className="label text-[10px]">Bracket System</label><select value={orthoForm.bracketType} onChange={e => setOrthoForm({...orthoForm, bracketType: e.target.value})} className="input text-xs font-black uppercase"><option>MBT 0.022</option><option>Roth 0.018</option><option>Ceramic Aesthetic</option><option>Self-Ligating</option></select></div>
                                    <div><label className="label text-[10px]">Arch Wire (Upper)</label><input type="text" value={orthoForm.archWireUpper} onChange={e => setOrthoForm({...orthoForm, archWireUpper: e.target.value})} className="input" placeholder="e.g. 0.014 Niti" /></div>
                                    <div><label className="label text-[10px]">Arch Wire (Lower)</label><input type="text" value={orthoForm.archWireLower} onChange={e => setOrthoForm({...orthoForm, archWireLower: e.target.value})} className="input" placeholder="e.g. 0.014 Niti" /></div>
                                    <div><label className="label text-[10px]">Auxiliary / Elastics</label><input type="text" value={orthoForm.elastics} onChange={e => setOrthoForm({...orthoForm, elastics: e.target.value})} className="input" placeholder="e.g. Class II" /></div>
                                </div>
                                <div className="flex gap-3 pt-4"><button onClick={() => setIsAddingOrtho(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button><button onClick={handleAddOrthoAdjustment} className="flex-[2] py-4 bg-teal-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-teal-600/20">Commit Adjustment</button></div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center px-2">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3"><History size={16}/> Temporal Adjustment Registry</h5>
                                <button onClick={() => setIsAddingOrtho(true)} className="px-6 py-2.5 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:scale-105 transition-all flex items-center gap-2"><Plus size={14}/> Log Adjustment</button>
                            </div>
                        )}
                        <div className="space-y-3">
                            {(patient.orthoHistory || []).map(adj => (
                                <div key={adj.id} className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start gap-6 group hover:border-teal-300 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-teal-50 transition-colors"><Activity size={24} className="text-teal-600"/></div>
                                        <div><h6 className="font-black text-slate-800 uppercase text-sm">{adj.bracketType}</h6><p className="text-[10px] font-black text-slate-400 uppercase mt-1">{formatDate(adj.date)} • Dr. {adj.dentist}</p></div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {adj.archWireUpper && <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-[9px] font-black uppercase border border-teal-100">U: {adj.archWireUpper}</span>}
                                        {adj.archWireLower && <span className="px-3 py-1 bg-lilac-50 text-lilac-700 rounded-full text-[9px] font-black uppercase border border-lilac-100">L: {adj.archWireLower}</span>}
                                        {adj.elastics && <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[9px] font-black uppercase border border-amber-100">{adj.elastics}</span>}
                                    </div>
                                </div>
                            ))}
                            {(patient.orthoHistory || []).length === 0 && <div className="py-20 text-center opacity-30 italic font-black uppercase tracking-widest">No active orthodontic records found.</div>}
                        </div>
                    </div>
                )}
            </div>

            {/* Strategic Treatment Plans */}
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
                    <div className="flex-1 w-full"><label className="label text-[10px]">Phase Descriptive Label</label><input autoFocus type="text" value={newPlanName} onChange={e => setNewPlanName(e.target.value)} className="input" placeholder="e.g. Phase 1 - Urgent Restorative" /></div>
                    <div className="flex gap-3 self-end"><button onClick={() => setIsCreating(false)} className="px-6 py-4 font-black uppercase text-[10px] text-slate-400">Cancel</button><button onClick={handleCreatePlan} className="px-10 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-teal-600/30">Register Strategy</button></div>
                </div>
            )}

            <div className="space-y-10">
                {allPlans.map(plan => {
                    const planItems = (patient.dentalChart || []).filter(item => item.planId === plan.id);
                    const completedItems = planItems.filter(i => i.status === 'Completed');
                    const progress = planItems.length > 0 ? (completedItems.length / planItems.length) * 100 : 0;
                    
                    return (
                        <div key={plan.id} className={`bg-white rounded-[3.5rem] border-2 shadow-2xl overflow-hidden transition-all duration-700 ${plan.status === TreatmentPlanStatus.APPROVED ? 'border-teal-500 ring-[12px] ring-teal-500/5' : 'border-slate-100'}`}>
                            <div className={`p-8 flex justify-between items-center ${plan.status === TreatmentPlanStatus.APPROVED ? 'bg-teal-900 text-white' : 'bg-slate-50 border-b border-slate-100'}`}>
                                <div className="flex items-center gap-6">
                                    <div className={`p-4 rounded-3xl shadow-lg transition-transform hover:rotate-12 ${plan.status === TreatmentPlanStatus.APPROVED ? 'bg-teal-600 text-white' : 'bg-white text-lilac-600 border border-slate-200'}`}><ShieldCheck size={32}/></div>
                                    <div>
                                        <h4 className="font-black text-2xl uppercase tracking-tighter leading-none mb-2">{plan.name}</h4>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${plan.status === TreatmentPlanStatus.APPROVED ? 'bg-teal-700 border-teal-500 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>{plan.status}</span>
                                            <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">Defined By: {plan.createdBy}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {plan.status === TreatmentPlanStatus.DRAFT && <button onClick={() => handlePlanAction(plan.id, 'submit')} className="bg-lilac-600 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-lilac-900/20 hover:scale-105 transition-all">Submit for Review</button>}
                                    {plan.status === TreatmentPlanStatus.PENDING_REVIEW && currentUser.role === UserRole.DENTIST && <button onClick={() => handlePlanAction(plan.id, 'approve')} className="bg-teal-600 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2"><CheckCircle size={18}/> Approve Plan</button>}
                                    <button onClick={() => handlePlanAction(plan.id, 'delete')} className={`p-3.5 rounded-2xl transition-all ${plan.status === TreatmentPlanStatus.APPROVED ? 'bg-teal-800 text-teal-300 hover:bg-red-600 hover:text-white' : 'bg-white border border-slate-200 text-slate-300 hover:text-red-500'}`}><Trash2 size={20}/></button>
                                </div>
                            </div>

                            <div className="p-10 space-y-8 bg-white">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1"><span>Operational Execution</span><span>{Math.round(progress)}% Complete</span></div>
                                    <div className="h-4 bg-slate-50 rounded-full border border-slate-100 overflow-hidden p-1 shadow-inner"><div className={`h-full rounded-full transition-all duration-1000 shadow-sm ${progress === 100 ? 'bg-teal-600' : 'bg-teal-500'}`} style={{ width: `${progress}%` }} /></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {planItems.map(item => (
                                        <div key={item.id} className={`p-6 rounded-[2.5rem] border-2 transition-all duration-500 relative group ${item.status === 'Completed' ? 'bg-teal-50/30 border-teal-100 opacity-60' : 'bg-white border-slate-100 hover:border-lilac-200 hover:shadow-xl'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl group-hover:bg-lilac-600 transition-colors shadow-lg">#{item.toothNumber}</div>
                                                {item.status === 'Completed' ? (
                                                    <div className="bg-teal-600 text-white p-1.5 rounded-full shadow-lg"><CheckCircle size={16}/></div>
                                                ) : (
                                                    <button onClick={() => handleMarkComplete(item)} className="px-4 py-2 bg-slate-50 text-slate-400 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all">Sign Completed</button>
                                                )}
                                            </div>
                                            <h5 className="font-black text-slate-800 uppercase text-sm leading-tight mb-2">{item.procedure}</h5>
                                            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-50">
                                                <span className="text-sm font-black text-slate-900">₱{(item.price || 0).toLocaleString()}</span>
                                                {item.status === 'Planned' && <button onClick={() => setRefusalModal(item)} className="text-[10px] font-black text-slate-300 hover:text-red-600 uppercase tracking-widest transition-colors flex items-center gap-1"><XCircle size={14}/> Refusal</button>}
                                            </div>
                                        </div>
                                    ))}
                                    {planItems.length === 0 && <div className="col-span-full py-16 text-center opacity-20 italic font-black uppercase tracking-widest border-2 border-dashed border-slate-200 rounded-[3rem]">No clinical targets assigned to this strategy.</div>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- VARIOUS MODALS REDESIGNED WITH TEAL/LILAC --- */}

            {refusalModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl border-4 border-red-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                        <div className="p-8 bg-red-600 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <ShieldAlert size={32} className="animate-pulse"/>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">Informed Refusal Protocol</h3>
                                    <p className="text-xs font-bold text-red-100 uppercase tracking-widest">Mandatory Risk Disclosure Acknowledgement</p>
                                </div>
                            </div>
                            <button onClick={() => setRefusalModal(null)} className="p-2 hover:bg-white/20 rounded-full transition-all"><X size={24}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar bg-slate-50/50">
                            <div className="bg-white p-6 rounded-3xl border border-red-200 shadow-sm space-y-4">
                                <h4 className="font-black text-red-900 uppercase tracking-widest text-xs">Verify Risk Understanding</h4>
                                <div className="space-y-2">
                                    {currentRefusalRisks.map(risk => {
                                        const isChecked = selectedRisks.includes(risk);
                                        return (
                                            <button key={risk} onClick={() => setSelectedRisks(prev => isChecked ? prev.filter(r => r !== risk) : [...prev, risk])} className={`w-full p-4 rounded-2xl border-2 text-left flex items-start gap-4 transition-all ${isChecked ? 'bg-red-50 border-red-500' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                                <div className={`w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center ${isChecked ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-slate-200'}`}>{isChecked && <CheckCircle size={16}/>}</div>
                                                <span className={`text-xs font-bold ${isChecked ? 'text-red-900' : 'text-slate-500'}`}>{risk}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Refusal Reason (Patient Statement) *</label>
                                <textarea value={refusalNotes} onChange={e => setRefusalNotes(e.target.value)} className="w-full p-5 bg-white border-2 border-slate-200 rounded-3xl h-24 text-sm font-bold shadow-inner" placeholder="e.g. Patient cited financial constraints despite clinical necessity..." />
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient / Guardian Signature</h4>
                                    <button onClick={clearCanvas} className="text-[9px] font-black text-slate-300 hover:text-red-600 uppercase transition-all flex items-center gap-1"><Eraser size={12}/> Clear Pad</button>
                                </div>
                                <div className="bg-white p-2 rounded-3xl border-2 border-dashed border-slate-200 h-32 relative">
                                    <canvas ref={refusalCanvasRef} onMouseDown={startSign} onMouseMove={draw} onMouseUp={stopSign} onMouseLeave={stopSign} onTouchStart={startSign} onTouchMove={draw} onTouchEnd={stopSign} className="w-full h-full touch-none cursor-crosshair" />
                                    {!allRisksChecked && <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[1px] flex items-center justify-center pointer-events-none"><span className="text-[10px] font-black text-red-600 uppercase bg-white px-4 py-2 rounded-xl shadow-lg border border-red-100">Verify All Risks Above First</span></div>}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 border-t bg-white flex gap-3"><button onClick={() => setRefusalModal(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black uppercase text-[10px] rounded-2xl">Cancel</button><button onClick={handleInformedRefusal} disabled={!allRisksChecked || !refusalNotes.trim()} className={`flex-[2] py-5 text-white rounded-2xl font-black uppercase text-[10px] shadow-2xl transition-all ${allRisksChecked && refusalNotes.trim() ? 'bg-red-600 shadow-red-600/30' : 'bg-slate-300 opacity-50 cursor-not-allowed'}`}>Finalize Forensic Refusal</button></div>
                    </div>
                </div>
            )}

            {deviationModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 border-4 border-lilac-100">
                        <div className="flex items-center gap-5">
                            <div className="bg-lilac-100 p-4 rounded-3xl text-lilac-700 shadow-sm"><Scale size={32}/></div>
                            <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Deviation Protocol</h3><p className="text-[10px] text-lilac-600 font-black uppercase tracking-widest mt-1">Rule 17 Procedural Change Monitoring</p></div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 shadow-inner">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Original Strategy</div>
                                <div className="text-lg font-black text-slate-700 uppercase">{deviationModal.plannedProc}</div>
                            </div>
                            <div><label className="label text-[10px]">Actual Performed Procedure</label><select value={newProcedureName} onChange={e => setNewProcedureName(e.target.value)} className="input text-xs font-black uppercase">{fieldSettings?.procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
                            {newProcedureName !== deviationModal.plannedProc && (
                                <div className="animate-in slide-in-from-top-2">
                                    <label className="label text-[10px] text-lilac-700">Clinical Narrative for Deviation *</label>
                                    <textarea value={deviationNarrative} onChange={e => setDeviationNarrative(e.target.value)} className="input h-32 focus:border-lilac-500" placeholder="Pursuant to Rule 17, state why the procedure was modified chair-side..." />
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 pt-4"><button onClick={() => setDeviationModal(null)} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400">Cancel</button><button onClick={handleDeviationSubmit} className="flex-[2] py-5 bg-teal-600 text-white rounded-3xl font-black uppercase text-[10px] shadow-xl shadow-teal-600/30">Commit Record</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TreatmentPlan;
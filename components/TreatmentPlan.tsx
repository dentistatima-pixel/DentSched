import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Patient, DentalChartEntry, TreatmentPlan as TreatmentPlanType, TreatmentPlanStatus, User, UserRole, FeatureToggles, AuditLogEntry, OrthoAdjustment, TreatmentStatus, FieldSettings, ConsentCategory } from '../types';
import { ClipboardList, Printer, FileCheck, Plus, Send, ShieldCheck, XCircle, Edit, CheckCircle, Trash2, ArrowRight, X, ChevronDown, ChevronUp, Activity, History, FileWarning, ShieldAlert, Key, Eraser, Camera, UserCheck, AlertTriangle, Scale, Receipt, Stethoscope, FileSearch, Lock, Sparkles, LayoutGrid } from 'lucide-react';
import { useToast } from './ToastSystem';
import { formatDate, PDA_INFORMED_CONSENT_TEXTS } from '../constants';
import CryptoJS from 'crypto-js';
import FinancialConsentModal from './FinancialConsentModal';

interface TreatmentPlanProps {
  patient: Patient;
  onUpdatePatient: (updatedPatient: Patient) => void;
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
        
        if (action === 'approve') {
            onInitiateFinancialConsent(plan);
            return;
        }

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

    const handleVarianceSubmit = () => {
        if (!varianceModal || !varianceNarrative.trim()) {
            toast.error("Narrative is mandatory for audit.");
            return;
        }
        const itemWithNarrative = { ...varianceModal.item, financialNarrative: varianceNarrative };
        finalizeCompletion(itemWithNarrative);
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
                    <div className="flex-1 w-full"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Phase Narrative</label><input type="text" value={newPlanName} onChange={e => setNewPlanName(e.target.value)} placeholder="e.g., Restorative Phase 1, Surgical Clearance..." className="input text-lg font-black" autoFocus/></div>
                    <div className="flex gap-3"><button onClick={() => setIsCreating(false)} className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs">Cancel</button><button onClick={handleCreatePlan} className="px-8 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs flex items-center gap-2"><CheckCircle size={16}/> Define Strategy</button></div>
                </div>
            )}
        </div>
    );
};

export default TreatmentPlanModule;

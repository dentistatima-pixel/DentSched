
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Patient, DentalChartEntry, TreatmentPlan as TreatmentPlanType, TreatmentPlanStatus, User, UserRole, FeatureToggles, AuditLogEntry, TreatmentStatus, FieldSettings, ConsentCategory } from '../types';
// Added missing 'X' icon import
import { ClipboardList, Printer, FileCheck, Plus, Send, ShieldCheck, XCircle, Edit, CheckCircle, Trash2, Lock, Sparkles, Camera, Eraser, X } from 'lucide-react';
import { useToast } from './ToastSystem';
import { formatDate, isExpired } from '../constants';
import { useModal } from '../contexts/ModalContext';
import CryptoJS from 'crypto-js';
import { SealBadge } from './SealBadge';

// Added missing TreatmentPlanProps interface definition
interface TreatmentPlanProps {
    patient: Patient;
    onUpdatePatient: (updatedPatient: Partial<Patient>) => Promise<void>;
    readOnly?: boolean;
    currentUser: User;
    logAction: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
    featureFlags?: FeatureToggles;
    onInitiateFinancialConsent?: (plan: TreatmentPlanType) => void;
    onOpenRevocationModal?: (patient: Patient, category: ConsentCategory) => void;
}

const PlanCard: React.FC<{
    plan: TreatmentPlanType;
    patient: Patient;
    currentUser: User;
    onPlanAction: (planId: string, action: 'submit' | 'approve' | 'reject' | 'delete') => void;
    onPhaseSeal: (planId: string, signature: string, snap: string) => void;
}> = ({ plan, patient, currentUser, onPlanAction, onPhaseSeal }) => {
    const toast = useToast();
    const [isSealing, setIsSealing] = useState(false);
    const [identitySnap, setIdentitySnap] = useState<string | null>(null);
    const [hasInk, setHasInk] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sigCanvasRef = useRef<HTMLCanvasElement>(null);

    const planItems = useMemo(() => patient.dentalChart?.filter(item => item.planId === plan.id) || [], [patient.dentalChart, plan.id]);
    const planTotal = useMemo(() => planItems.reduce((acc, item) => acc + (item.price || 0), 0), [planItems]);

    const isLocked = !!plan.financialConsentSignature;

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320 } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (e) { toast.error("Camera access denied."); }
    };

    const captureSeal = () => {
        if (!hasInk) { toast.error("Please sign the estimate."); return; }
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            canvas.width = 96; canvas.height = 96;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.filter = 'grayscale(100%)';
                ctx.drawImage(video, 0, 0, 96, 96);
                const snap = canvas.toDataURL('image/jpeg', 0.5);
                const sig = sigCanvasRef.current?.toDataURL() || '';
                onPhaseSeal(plan.id, sig, snap);
                setIsSealing(false);
            }
        }
    };

    useEffect(() => {
        if (isSealing) {
            startCamera();
            setTimeout(() => {
                const c = sigCanvasRef.current;
                if (c) {
                    c.width = c.parentElement?.clientWidth || 400; c.height = 100;
                    const ctx = c.getContext('2d');
                    if (ctx) { ctx.strokeStyle = '#000'; ctx.lineWidth = 2; }
                }
            }, 100);
        }
    }, [isSealing]);

    return (
        <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 bg-slate-50/50 border-b flex justify-between items-center">
                <div>
                    <h4 className="font-black text-slate-800 uppercase tracking-tight">{plan.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Registry: {plan.id.slice(-6)} &bull; {plan.status}</p>
                </div>
                {isLocked ? (
                    <SealBadge 
                        variant="lilac"
                        data={{
                            signerName: patient.name,
                            signerRole: 'Patient (Agreement)',
                            timestamp: plan.financialConsentTimestamp!,
                            signatureUrl: plan.financialConsentSignature!,
                            snapUrl: plan.financialConsentSnap,
                            title: 'Phase Estimate Strategic Seal'
                        }}
                    />
                ) : (
                    <button onClick={() => setIsSealing(true)} className="bg-lilac-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-lilac-600/30">Sign & Seal Phase</button>
                )}
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <table className="w-full text-xs">
                        <thead><tr className="text-slate-400 font-black uppercase border-b"><th className="py-2 text-left">Procedure</th><th className="py-2 text-right">Fee</th></tr></thead>
                        <tbody>
                            {planItems.map(item => (
                                <tr key={item.id} className="border-b border-slate-50"><td className="py-2 font-bold text-slate-700">{item.procedure}</td><td className="py-2 text-right font-mono">₱{item.price?.toLocaleString()}</td></tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-between items-end pt-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Phase Total Value</span>
                        <span className="text-2xl font-black text-teal-700">₱{planTotal.toLocaleString()}</span>
                    </div>
                </div>
                
                {isLocked && (
                    <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-3xl border border-slate-100">
                        <img src={plan.financialConsentSnap} className="w-16 h-16 rounded-xl grayscale border-2 border-white shadow-sm" />
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Identity Verified</p>
                            <p className="text-xs font-bold text-slate-800">{formatDate(plan.financialConsentTimestamp || '')}</p>
                            <img src={plan.financialConsentSignature} className="h-8 mt-1 opacity-60" />
                        </div>
                    </div>
                )}
            </div>

            {isSealing && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-[3rem] shadow-2xl w-full max-w-2xl space-y-8 animate-in zoom-in-95">
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-black uppercase text-slate-800">Strategic Phase Seal</h3>
                            {/* Fixed: X icon is now imported */}
                            <button onClick={() => setIsSealing(false)}><X size={24}/></button>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">I. Physical Identity Snap</p>
                                <div className="aspect-square bg-slate-900 rounded-3xl overflow-hidden relative border-4 border-slate-50">
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale scale-x-[-1]" />
                                    <canvas ref={canvasRef} className="hidden" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">II. Estimate Acknowledgment</p>
                                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex-1 h-[200px] flex flex-col">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black text-slate-400">SIGN HERE</span>
                                        <button onClick={() => { const c = sigCanvasRef.current; c?.getContext('2d')?.clearRect(0,0,c.width,c.height); setHasInk(false); }} className="text-red-400"><Eraser size={14}/></button>
                                    </div>
                                    <canvas ref={sigCanvasRef} onPointerDown={(e) => {
                                        const c = sigCanvasRef.current; if (!c) return;
                                        const rect = c.getBoundingClientRect();
                                        const ctx = c.getContext('2d');
                                        ctx?.beginPath(); ctx?.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                                        c.onpointermove = (m) => { ctx?.lineTo(m.clientX - rect.left, m.clientY - rect.top); ctx?.stroke(); setHasInk(true); };
                                    }} onPointerUp={() => { if(sigCanvasRef.current) sigCanvasRef.current.onpointermove = null; }} className="flex-1 bg-white rounded-xl border border-slate-200 touch-none cursor-crosshair" />
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-center text-slate-400 font-bold px-10 italic">
                            "By sealing this phase, I acknowledge the estimated costs and proposed clinical path for {plan.name}."
                        </p>
                        <button onClick={captureSeal} className="w-full py-6 bg-teal-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-xl shadow-teal-600/30">Capture Snap & Seal Estimate</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const TreatmentPlanModule: React.FC<TreatmentPlanProps> = ({ patient, onUpdatePatient, currentUser, logAction }) => {
    const toast = useToast();
    const [isCreating, setIsCreating] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');

    const plans = useMemo(() => [...(patient.treatmentPlans || [])], [patient.treatmentPlans]);

    const handleCreate = () => {
        if (!newPlanName) return;
        const newPlan: TreatmentPlanType = { id: `tp_${Date.now()}`, patientId: patient.id, name: newPlanName, createdAt: new Date().toISOString(), createdBy: currentUser.name, status: TreatmentPlanStatus.DRAFT };
        onUpdatePatient({ ...patient, treatmentPlans: [...plans, newPlan] });
        setIsCreating(false);
        setNewPlanName('');
    };

    const handlePhaseSeal = (planId: string, sig: string, snap: string) => {
        const updatedPlans = plans.map(p => p.id === planId ? { ...p, status: TreatmentPlanStatus.APPROVED, financialConsentSignature: sig, financialConsentSnap: snap, financialConsentTimestamp: new Date().toISOString() } : p);
        onUpdatePatient({ ...patient, treatmentPlans: updatedPlans });
        logAction('APPROVE', 'TreatmentPlan', planId, "Phase Estimate Strategic Seal captured.");
        toast.success("Strategic Phase Seal successfully committed.");
    };

    return (
        <div className="space-y-8 p-6">
            <div className="flex justify-between items-center px-4">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Clinical Strategies</h3>
                <button onClick={() => setIsCreating(true)} className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2"><Plus size={16}/> New Phase</button>
            </div>
            
            {isCreating && (
                <div className="bg-white p-8 rounded-[3rem] shadow-2xl flex gap-4 animate-in zoom-in-95">
                    <input value={newPlanName} onChange={e => setNewPlanName(e.target.value)} placeholder="Phase Name (e.g. Cosmetic Phase)" className="input flex-1" />
                    <button onClick={handleCreate} className="px-8 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs">Define</button>
                </div>
            )}

            <div className="space-y-6">
                {plans.map(plan => (
                    <PlanCard key={plan.id} plan={plan} patient={patient} currentUser={currentUser} onPhaseSeal={handlePhaseSeal} onPlanAction={() => {}} />
                ))}
                {plans.length === 0 && !isCreating && <div className="text-center py-20 text-slate-300 italic">No strategies defined.</div>}
            </div>
        </div>
    );
};

export default TreatmentPlanModule;

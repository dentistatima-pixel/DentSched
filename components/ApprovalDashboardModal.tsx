
import React, { useState, useMemo } from 'react';
import { Patient, TreatmentPlan as TreatmentPlanType, DentalChartEntry, User, UserRole } from '../types';
import { X, CheckCircle, XCircle, FileText, Stethoscope, Activity, ImageIcon, Search, ArrowRight, User as UserIcon } from 'lucide-react';
import { Odontogram } from './Odontogram';
import { formatDate } from '../constants';
import { useModal } from '../contexts/ModalContext';
import { usePatient } from '../contexts/PatientContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAppContext } from '../contexts/AppContext';

interface ApprovalDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  plan: TreatmentPlanType;
  onConfirm: (planId: string) => void;
  onReject: (planId: string, reason: string) => void;
}

const ApprovalDashboardModal: React.FC<ApprovalDashboardModalProps> = ({ isOpen, onClose, patient, plan, onConfirm, onReject }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  const { showModal } = useModal();
  const { handleSaveInformedRefusal } = usePatient();
  const { fieldSettings } = useSettings();
  const { currentUser } = useAppContext();

  const planItems = useMemo(() => patient.dentalChart?.filter(item => item.planId === plan.id) || [], [patient.dentalChart, plan.id]);
  const planTotal = useMemo(() => planItems.reduce((acc, item) => acc + (item.price || 0), 0), [planItems]);
  const involvedTeeth = useMemo(() => Array.from(new Set(planItems.map(item => item.toothNumber).filter(Boolean))) as number[], [planItems]);
  const xrays = useMemo(() => patient.files?.filter(f => f.category === 'X-Ray') || [], [patient.files]);

  const canApprove = useMemo(() => {
    if (!currentUser) return false;
    const isArchitect = currentUser.role === UserRole.SYSTEM_ARCHITECT;
    const isLeadDentist = !!plan.primaryDentistId && currentUser.id === plan.primaryDentistId;
    const isCreator = currentUser.name === plan.createdBy;
    const isApprover = (currentUser.role === UserRole.DENTIST || currentUser.role === UserRole.ADMIN) && !isCreator;
    return isArchitect || isLeadDentist || (isApprover && !plan.primaryDentistId);
  }, [currentUser, plan]);

  if (!isOpen) return null;

  const handleReject = () => {
    if (!rejectionReason.trim()) {
        alert("A reason is required for rejection.");
        return;
    }
    
    if (window.confirm(
        "This rejection should be documented as an Informed Refusal. " +
        "Would you like to create the informed refusal form now?"
    )) {
        const planItems = patient.dentalChart?.filter(item => item.planId === plan.id) || [];
        const extractRisksFromPlan = (planItems: DentalChartEntry[]): string[] => {
            const risks = new Set<string>();
            planItems.forEach(item => {
                const procedure = fieldSettings.procedures.find(p => p.name === item.procedure);
                if (procedure?.riskDisclosures) {
                    procedure.riskDisclosures.forEach(risk => risks.add(risk));
                }
            });
            if (risks.size === 0) {
                risks.add("Progression of disease");
                risks.add("Potential for complications");
                risks.add("Future treatment may be more complex or costly");
            }
            return Array.from(risks);
        };

        const extractAlternativesFromPlan = (planItems: DentalChartEntry[]): string[] => {
            return ["No treatment", "Alternative conservative management", "Referral to specialist"];
        };
        
        showModal('informedRefusal', {
          patient,
          currentUser,
          relatedEntity: {
            type: 'TreatmentPlan',
            entityId: plan.id,
            entityDescription: `Rejection of Treatment Plan: "${plan.name}"`,
          },
          risks: extractRisksFromPlan(planItems),
          alternatives: extractAlternativesFromPlan(planItems),
          recommendation: plan.clinicalRationale || `Proceed with the treatment plan "${plan.name}" as recommended.`,
          onSave: (refusalData: any) => {
            handleSaveInformedRefusal(patient.id, refusalData);
            onReject(plan.id, rejectionReason);
            onClose(); 
          }
        });

    } else {
       onClose();
       onReject(plan.id, rejectionReason);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
        <div className="bg-slate-50 w-full max-w-6xl h-[95vh] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
          <div className="p-6 border-b border-slate-200 bg-white rounded-t-3xl flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Treatment Plan Review</h2>
              <p className="text-sm text-slate-500 font-bold">{patient.name} - Plan: {plan.name}</p>
            </div>
            <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-500" /></button>
          </div>

          <div className="flex-1 grid grid-cols-12 gap-6 p-6 min-h-0">
            {/* Left Column: Proposal & Rationale */}
            <div className="col-span-4 flex flex-col gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col">
                <h3 className="font-bold text-base text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><FileText size={16}/> Proposal</h3>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {planItems.map(item => (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-lg">
                      <p className="font-bold text-sm text-slate-800">{item.procedure}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-500">Tooth #{item.toothNumber}</p>
                        <p className="font-mono text-sm text-slate-600">₱{(item.price || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <span className="font-bold text-slate-600 uppercase">Total Estimate:</span>
                  <span className="text-2xl font-black text-teal-700">₱{planTotal.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-base text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><UserIcon size={16}/> Clinical Rationale</h3>
                 <p className="text-sm text-slate-600 italic">"{plan.clinicalRationale || 'No rationale provided.'}"</p>
                 <p className="text-right text-sm font-bold text-slate-400 mt-2">- {plan.createdBy}</p>
              </div>
            </div>

            {/* Middle Column: Visual Context */}
            <div className="col-span-5 flex flex-col gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-base text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Stethoscope size={16}/> Odontogram</h3>
                <div className="flex justify-center items-center p-4 bg-slate-50 rounded-xl">
                    {currentUser && <Odontogram chart={patient.dentalChart || []} readOnly={true} onToothClick={()=>{}} currentUser={currentUser}/>}
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-base text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={16}/> Perio Snapshot</h3>
                 {/* This would be a simplified perio view component */}
                 <div className="text-center p-8 bg-slate-50 rounded-xl text-sm text-slate-400 italic">Perio Chart view for teeth {involvedTeeth.join(', ')} would be displayed here.</div>
              </div>
            </div>

            {/* Right Column: Evidence */}
            <div className="col-span-3 flex flex-col gap-6">
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col">
                 <h3 className="font-bold text-base text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><ImageIcon size={16}/> Diagnostic Images</h3>
                 <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {xrays.map(img => (
                        <div key={img.id} onClick={() => setLightboxImage(img.url)} className="relative rounded-lg overflow-hidden group cursor-pointer">
                            <img src={img.url} alt={img.name} className="w-full h-auto"/>
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Search size={24} className="text-white"/>
                            </div>
                        </div>
                    ))}
                    {xrays.length === 0 && <p className="text-sm text-slate-400 italic text-center p-4">No X-Rays on file.</p>}
                 </div>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-base text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><ArrowRight size={16}/> Linked Findings</h3>
                 <div className="space-y-2 text-sm">
                    {planItems.map(item => {
                        const finding = patient.dentalChart?.find(f => f.toothNumber === item.toothNumber && f.status === 'Condition');
                        return (
                            <div key={item.id} className="p-2 bg-slate-50 rounded-md">
                                <p className="font-bold">{item.procedure} (#{item.toothNumber})</p>
                                <p className="text-slate-500">&rarr; Addresses: {finding?.procedure || 'N/A'}</p>
                            </div>
                        )
                    })}
                 </div>
               </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-200 bg-white/80 backdrop-blur-sm rounded-b-3xl flex justify-end gap-3 shrink-0">
            {isRejecting ? (
                <div className="w-full flex gap-3 items-center animate-in fade-in">
                    <input type="text" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Reason for rejection (required)..." className="input flex-1"/>
                    <button onClick={() => setIsRejecting(false)} className="px-4 py-2 text-sm font-bold">Cancel</button>
                    <button onClick={handleReject} disabled={!canApprove} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold disabled:opacity-50" title={!canApprove ? "Approval is reserved for the designated lead dentist or an administrator." : ""}>Confirm Rejection</button>
                </div>
            ) : (
                <>
                    <button onClick={() => setIsRejecting(true)} disabled={!canApprove} className="px-8 py-4 bg-red-100 text-red-700 rounded-xl font-black uppercase text-sm tracking-widest flex items-center gap-2 disabled:opacity-50" title={!canApprove ? "Approval is reserved for the designated lead dentist or an administrator." : ""}>
                        <XCircle size={16}/> Reject
                    </button>
                    <button onClick={() => { onClose(); onConfirm(plan.id); }} disabled={!canApprove} className="px-10 py-4 bg-teal-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-teal-600/30 flex items-center gap-2 disabled:opacity-50" title={!canApprove ? "Approval is reserved for the designated lead dentist or an administrator." : ""}>
                        <CheckCircle size={16}/> Approve Plan
                    </button>
                </>
            )}
          </div>
        </div>
      </div>
      {lightboxImage && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
            <img src={lightboxImage} alt="Radiograph" className="max-w-full max-h-full rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
            <button onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }} className="absolute top-4 right-4 text-white p-2.5 bg-black/30 rounded-full"><X/></button>
        </div>
      )}
    </>
  );
};

export default ApprovalDashboardModal;

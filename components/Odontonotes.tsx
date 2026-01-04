
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DentalChartEntry, ProcedureItem, StockItem, User, UserRole, FieldSettings, TreatmentStatus, ClinicalIncident, Patient, ResourceType, Appointment, AppointmentStatus, AuthorityLevel } from '../types';
import { Plus, Edit3, ShieldCheck, Lock, Clock, GitCommit, ArrowDown, AlertCircle, FileText, Zap, Box, RotateCcw, CheckCircle2, PackageCheck, Mic, MicOff, Volume2, Sparkles, DollarSign, ShieldAlert, Key, Camera, ImageIcon, Check, MousePointer2, UserCheck, X, EyeOff, Shield, Eraser, Activity, Heart, HeartPulse, Droplet, UserSearch, RotateCcw as Undo, Trash2, Armchair, Star } from 'lucide-react';
import { formatDate, STAFF, PDA_FORBIDDEN_COMMERCIAL_TERMS } from '../constants';
import { useToast } from './ToastSystem';
import CryptoJS from 'crypto-js';
import { getTrustedTime } from '../services/timeService';

interface ClinicalMacro {
    label: string;
    s: string;
    o: string;
    a: string;
    p: string;
}

const QUICK_FILLS: ClinicalMacro[] = [
    { label: 'Exam', s: 'Patient in for routine checkup. No pain reported.', o: 'Visual and tactile exam. Soft tissues normal.', a: 'Good oral hygiene maintained.', p: 'Recommended 6-month prophylaxis.' },
    { label: 'Filling', s: 'Sensitivity to cold in target quadrant.', o: 'Localized caries detected on target tooth surface.', a: 'Enamel/Dentin Caries.', p: 'Composite restoration performed. High-speed prep. Acid etch. Bond. Incremental fill.' },
    { label: 'SRP', s: 'Patient reports generalized bleeding when brushing.', o: 'Heavy subgingival calculus. Pockets 4-6mm.', a: 'Chronic Periodontitis.', p: 'Scaling and root planing performed by quadrant. Anesthesia administered.' }
];

const UNDO_WINDOW_SECONDS = 600; // 10 minutes

interface OdontonotesProps {
  entries: DentalChartEntry[];
  onAddEntry: (entry: DentalChartEntry) => void;
  onUpdateEntry: (entry: DentalChartEntry) => void;
  onDeleteEntry?: (id: string) => void;
  currentUser: User;
  readOnly?: boolean;
  procedures: ProcedureItem[];
  inventory?: StockItem[]; 
  prefill?: Partial<DentalChartEntry> | null;
  onClearPrefill?: () => void;
  logAction?: (action: any, entity: any, id: string, details: string) => void;
  fieldSettings?: FieldSettings; 
  patient?: Patient;
  appointments?: Appointment[];
  incidents?: ClinicalIncident[];
}

const Odontonotes: React.FC<OdontonotesProps> = ({ entries, onAddEntry, onUpdateEntry, onDeleteEntry, currentUser, readOnly, procedures, inventory = [], prefill, onClearPrefill, logAction, fieldSettings, patient, appointments = [], incidents = [] }) => {
  const toast = useToast();
  const inventoryEnabled = fieldSettings?.features.enableInventory || false;
  const isAdvancedInventory = fieldSettings?.features.inventoryComplexity === 'ADVANCED';
  
  const [toothNum, setToothNum] = useState<string>('');
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [charge, setCharge] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [isRecording, setIsRecording] = useState<string | null>(null); 
  const [clinicalPearl, setClinicalPearl] = useState('');
  
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const [showWitnessModal, setShowWitnessModal] = useState(false);
  const [witnessPin, setWitnessPin] = useState('');
  const [pendingSealEntry, setPendingSealEntry] = useState<DentalChartEntry | null>(null);
  const [pendingSealTimestamp, setPendingSealTimestamp] = useState<string>('');
  
  const [showSurgicalWitness, setShowSurgicalWitness] = useState(false);
  const [surgicalWitnessPin, setSurgicalWitnessPin] = useState('');
  const [pendingSurgicalEntry, setPendingSurgicalEntry] = useState<any>(null);

  const [now, setNow] = useState(Date.now());

  const isArchitect = currentUser.role === UserRole.SYSTEM_ARCHITECT;

  const activeAppointmentToday = useMemo(() => {
    if (!patient || !appointments) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    return appointments.find(a => 
        a.patientId === patient.id && 
        a.date === todayStr && 
        [AppointmentStatus.ARRIVED, AppointmentStatus.SEATED, AppointmentStatus.TREATING].includes(a.status)
    );
  }, [patient, appointments]);

  const isPediatricBlocked = useMemo(() => {
    if (!patient || (patient.age || 0) >= 18 || isArchitect) return false;
    const hasTodayConsent = !!activeAppointmentToday?.signedConsentUrl;
    const hasFullGuardian = patient.guardianProfile?.authorityLevel === AuthorityLevel.FULL;
    return !hasTodayConsent || !hasFullGuardian;
  }, [patient, activeAppointmentToday, isArchitect]);

  const hasActiveComplication = useMemo(() => {
    if (!patient) return false;
    return incidents.some(i => i.patientId === patient.id && i.type === 'Complication' && !i.advisoryCallSigned);
  }, [incidents, patient]);

  const isPrcExpired = useMemo(() => {
    if (!currentUser.prcLicense || !currentUser.prcExpiry) return false;
    return new Date(currentUser.prcExpiry) < new Date();
  }, [currentUser.prcExpiry, currentUser.prcLicense]);

  const isMalpracticeExpired = useMemo(() => {
    if (!currentUser.malpracticeExpiry) return false;
    return new Date(currentUser.malpracticeExpiry) < new Date();
  }, [currentUser.malpracticeExpiry]);

  const activeProcedureDef = useMemo(() => {
      return procedures.find(p => p.name === selectedProcedure);
  }, [selectedProcedure, procedures]);

  const isHighRiskProcedure = useMemo(() => {
    const highRiskCats = ['Surgery', 'Endodontics', 'Prosthodontics'];
    return highRiskCats.includes(activeProcedureDef?.category || '');
  }, [activeProcedureDef]);

  const isIndemnityLocked = isMalpracticeExpired && isHighRiskProcedure;

  const macroSnapshotRef = useRef<string>('');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isTraceabilityRequired = useMemo(() => {
      if (!isAdvancedInventory || !fieldSettings?.features.enableMaterialTraceability) return false;
      const categories = ['Restorative', 'Surgery', 'Endodontics', 'Prosthodontics'];
      return categories.includes(activeProcedureDef?.category || '');
  }, [activeProcedureDef, fieldSettings, isAdvancedInventory]);

  const isSurgicalProcedure = useMemo(() => {
      return activeProcedureDef?.category === 'Surgery' || selectedProcedure.toLowerCase().includes('extraction');
  }, [activeProcedureDef, selectedProcedure]);

  /* Suggestion 3: FIFO Expiry Guidance Logic */
  const fifoBatchId = useMemo(() => {
      if (!inventory || inventory.length === 0) return null;
      const validStock = inventory.filter(i => {
          if (!i.expiryDate) return false;
          return new Date(i.expiryDate) > new Date();
      });
      if (validStock.length === 0) return null;
      return [...validStock].sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime())[0].id;
  }, [inventory]);

  const isOperatoryRequired = selectedProcedure !== 'Communication Log' && selectedProcedure !== '';

  const allergyConflicts = useMemo(() => {
    if (!activeProcedureDef || !patient || !patient.allergies) return [];
    return activeProcedureDef.riskAllergies?.filter(riskAllergy => 
        patient.allergies?.some(pAllergy => pAllergy.toLowerCase() === riskAllergy.toLowerCase())
    ) || [];
  }, [activeProcedureDef, patient]);

  const pearlIsValid = useMemo(() => clinicalPearl.trim().length >= 20, [clinicalPearl]);

  const professionalismReviewRequired = useMemo(() => {
    const combinedText = `${subjective} ${objective} ${assessment} ${plan} ${clinicalPearl}`.toLowerCase();
    return PDA_FORBIDDEN_COMMERCIAL_TERMS.some(term => combinedText.includes(term.toLowerCase()));
  }, [subjective, objective, assessment, plan, clinicalPearl]);

  const uniquenessScore = useMemo(() => {
      const currentNarrative = (subjective + objective + assessment + plan).trim();
      if (!currentNarrative) return 0;
      if (!macroSnapshotRef.current) return 100;
      const template = macroSnapshotRef.current;
      let matches = 0;
      for (let i = 0; i < Math.min(currentNarrative.length, template.length); i++) {
          if (currentNarrative[i] === template[i]) matches++;
      }
      const similarity = (matches / Math.max(currentNarrative.length, template.length)) * 100;
      return Math.round(100 - similarity);
  }, [subjective, objective, assessment, plan]);

  const isAuthenticNarrative = uniquenessScore > 10;

  useEffect(() => {
    if (prefill) {
        setToothNum(prefill.toothNumber?.toString() || '');
        setSelectedProcedure(prefill.procedure || '');
        setSubjective(prefill.subjective || '');
        setObjective(prefill.objective || '');
        setAssessment(prefill.assessment || '');
        setPlan(prefill.plan || '');
        setSelectedResourceId(prefill.resourceId || '');
        setEditingId(null);
        if (onClearPrefill) onClearPrefill();
    }
  }, [prefill]);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setCapturedPhotos(prev => [...prev, event.target!.result as string]);
                  toast.success("Clinical photo linked.");
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const applyQuickFill = (fill: ClinicalMacro) => {
      const s = fill.s || ''; const o = fill.o || ''; const a = fill.a || ''; const p = fill.p || '';
      setSubjective(s); setObjective(o); setAssessment(a); setPlan(p);
      macroSnapshotRef.current = (s + o + a + p).trim();
  };

  const toggleRecording = (field: 's'|'o'|'a'|'p') => {
      if (isRecording === field) { recognitionRef.current?.stop(); setIsRecording(null); return; }
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      const recognition = new SpeechRecognition();
      recognition.onstart = () => setIsRecording(field);
      recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          const setter = field === 's' ? setSubjective : field === 'o' ? setObjective : field === 'a' ? setAssessment : setPlan;
          setter(prev => prev ? `${prev} ${transcript}` : transcript);
          setIsRecording(null);
      };
      recognition.onerror = () => setIsRecording(null);
      recognitionRef.current = recognition;
      recognition.start();
  };

  const isLocked = (entry: DentalChartEntry) => {
      if (entry.sealedHash) return true;
      if (!entry.date) return false;
      const diff = Date.now() - new Date(entry.date).getTime();
      return diff > (24 * 60 * 60 * 1000); 
  };

  const handleSeal = async (entry: DentalChartEntry) => {
      if (entry.sealedHash) return;
      if (entry.needsProfessionalismReview) return;
      const { timestamp, isVerified } = await getTrustedTime();
      if (!isVerified) { 
          setPendingSealEntry(entry); setPendingSealTimestamp(timestamp); setShowWitnessModal(true); return;
      }
      executeSeal(entry, timestamp, true);
  };

  const executeSeal = (entry: DentalChartEntry, timestamp: string, isVerified: boolean, witness?: User) => {
      const contentToHash = `${entry.id}|${entry.notes}|${entry.author}|${timestamp}|${entry.sterilizationCycleId || 'NONE'}|${entry.resourceId || 'NONE'}|${isVerified}${witness ? `|${witness.id}` : ''}`;
      const hash = CryptoJS.SHA256(contentToHash).toString();
      const updatedEntry: DentalChartEntry = { ...entry, sealedHash: hash, sealedAt: timestamp, isLocked: true, isVerifiedTime: isVerified, witnessId: witness?.id, witnessName: witness?.name };
      onUpdateEntry(updatedEntry);
      if (logAction) logAction('SEAL_RECORD', 'ClinicalNote', entry.id, `Digitally Sealed note.`);
      setShowWitnessModal(false); setWitnessPin(''); setPendingSealEntry(null);
  };

  const handleAdoptAndVerify = (entry: DentalChartEntry) => {
      const pin = prompt("RA 9484: Enter PIN to verify assistant notes:");
      if (pin === '1234') {
          const updated = { ...entry, isVerifiedByDentist: true, verifiedByDentistName: currentUser.name };
          onUpdateEntry(updated);
          toast.success("Clinical record adopted.");
      }
  };

  const handleUndoCommit = (entry: DentalChartEntry) => {
      handleEdit(entry);
      if (onDeleteEntry) onDeleteEntry(entry.id);
  };

  const handleVoidRecord = (entry: DentalChartEntry) => {
      const reason = prompt("VOID PROTOCOL: Reason for voiding?");
      if (!reason || reason.trim().length < 5) return;
      const updated = { ...entry, isVoid: true, voidReason: reason };
      onUpdateEntry(updated);
      if (logAction) logAction('VOID_RECORD', 'ClinicalNote', entry.id, `Record voided.`);
  };

  const handleWitnessVerify = () => {
      if (witnessPin === '1234' && pendingSealEntry) {
          const witness = STAFF.find(s => s.id !== currentUser.id);
          if (witness) executeSeal(pendingSealEntry, pendingSealTimestamp, false, witness);
      }
  };

  const handleSurgicalWitnessVerify = () => {
      if (surgicalWitnessPin === '1234' && pendingSurgicalEntry) {
          const witness = STAFF.find(s => s.id !== currentUser.id);
          if (witness) {
              const finalEntry = { ...pendingSurgicalEntry, witnessId: witness.id, witnessName: witness.name };
              if (editingId) {
                  const originalEntry = entries.find(e => e.id === editingId);
                  if (originalEntry && !isLocked(originalEntry)) onUpdateEntry({ ...originalEntry, ...finalEntry });
              } else onAddEntry(finalEntry);
              setShowSurgicalWitness(false); setSurgicalWitnessPin(''); setPendingSurgicalEntry(null); resetForm();
          }
      }
  };

  const resetForm = () => {
      setSubjective(''); setObjective(''); setAssessment(''); setPlan(''); setToothNum(''); setSelectedProcedure(''); setCharge(''); setSelectedBatchId(''); setSelectedResourceId(''); setSelectedCycleId(''); setCapturedPhotos([]); setClinicalPearl('');
      macroSnapshotRef.current = ''; setEditingId(null);
  };

  const handleEdit = (entry: DentalChartEntry) => {
      setEditingId(entry.id); setToothNum(entry.toothNumber?.toString() || ''); setSelectedProcedure(entry.procedure || '');
      setSubjective(entry.subjective || ''); setObjective(entry.objective || ''); setAssessment(entry.assessment || ''); setPlan(entry.plan || '');
      setCharge(entry.price?.toString() || ''); setSelectedBatchId(entry.materialBatchId || ''); setSelectedResourceId(entry.resourceId || '');
      setSelectedCycleId(entry.sterilizationCycleId || ''); setCapturedPhotos(entry.imageHashes || []);
      const pearlMatch = entry.notes?.match(/PEARL:\s*(.*?)(\[Batch:|$)/);
      setClinicalPearl(pearlMatch ? pearlMatch[1].trim() : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPrcExpired || isIndemnityLocked || hasActiveComplication || isPediatricBlocked || !pearlIsValid || !isAuthenticNarrative || (isOperatoryRequired && !selectedResourceId) || (!activeAppointmentToday && !isArchitect)) return;
    const batchSuffix = (isAdvancedInventory && selectedBatchId) ? ` [Batch: ${selectedBatchId}]` : '';
    const sterilizationSuffix = (isAdvancedInventory && selectedCycleId) ? ` [Autoclave Cycle: ${selectedCycleId}]` : '';
    const combinedNotes = `S: ${subjective}\nO: ${objective}\nA: ${assessment}\nP: ${plan}\nPEARL: ${clinicalPearl}${batchSuffix}${sterilizationSuffix}`;
    const selectedResource = fieldSettings?.resources?.find(r => r.id === selectedResourceId);
    const entryData = {
        notes: combinedNotes, subjective, objective, assessment, plan,
        materialBatchId: isAdvancedInventory ? (selectedBatchId || undefined) : undefined,
        resourceId: selectedResourceId || undefined, resourceName: selectedResource?.name || undefined,
        sterilizationCycleId: isAdvancedInventory ? (selectedCycleId || undefined) : undefined,
        appointmentId: activeAppointmentToday?.id, imageHashes: capturedPhotos, boilerplateScore: uniquenessScore,
        authorRole: currentUser.role, needsProfessionalismReview: professionalismReviewRequired,
        authorPrc: currentUser.prcLicense, authorPtr: currentUser.ptrNumber, committedAt: new Date().toISOString()
    };
    if (isSurgicalProcedure) {
        setPendingSurgicalEntry({ id: editingId || `dc_${Date.now()}`, toothNumber: (toothNum ? parseInt(toothNum) : 0), procedure: selectedProcedure || 'Clinical Note', status: 'Completed' as TreatmentStatus, ...entryData, price: charge ? parseFloat(charge) : 0, date: new Date().toISOString().split('T')[0], author: currentUser.name });
        setShowSurgicalWitness(true); return;
    }
    if (editingId) {
        const originalEntry = entries.find(e => e.id === editingId);
        if (originalEntry) {
            if (isLocked(originalEntry)) {
                onAddEntry({ ...originalEntry, id: `dc_amend_${Date.now()}`, originalNoteId: originalEntry.id, notes: `[AMENDMENT]\n${combinedNotes}`, subjective, objective, assessment, plan, date: new Date().toISOString().split('T')[0], sealedHash: undefined, sealedAt: undefined, isLocked: false, imageHashes: capturedPhotos, committedAt: new Date().toISOString() });
            } else onUpdateEntry({ ...originalEntry, ...entryData });
            setEditingId(null);
        }
    } else {
        onAddEntry({ id: `dc_${Date.now()}`, toothNumber: (toothNum ? parseInt(toothNum) : 0), procedure: selectedProcedure || 'Clinical Note', status: 'Completed' as TreatmentStatus, ...entryData, price: charge ? parseFloat(charge) : 0, date: new Date().toISOString().split('T')[0], author: currentUser.name });
    }
    resetForm();
  };

  const SoapField = ({ label, value, onChange, field, placeholder, disabled, watermark }: { label: string, value: string, onChange: (v: string) => void, field: 's'|'o'|'a'|'p', placeholder: string, disabled?: boolean, watermark?: string }) => (
      <div className="relative group/field">
          <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</label>
              {!disabled && <button type="button" onClick={() => toggleRecording(field)} className={`p-1.5 rounded-lg transition-all ${isRecording === field ? 'bg-red-50 text-white animate-pulse' : 'text-slate-300 hover:text-teal-600 opacity-0 group-hover/field:opacity-100'}`}>{isRecording === field ? <MicOff size={12}/> : <Mic size={12}/>}</button>}
          </div>
          <div className="relative">
              <textarea className={`w-full p-3 border rounded-xl text-xs h-20 bg-white outline-none ${disabled ? 'bg-slate-50 opacity-60' : 'border-slate-200 focus:border-teal-500 shadow-sm'}`} value={value} onChange={e => onChange(e.target.value)} placeholder={disabled ? '' : placeholder} disabled={disabled} />
              {disabled && <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-xl"><div className="flex flex-col items-center gap-1"><Lock size={16} className="text-slate-400"/><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{watermark || 'LOCKED'}</span></div></div>}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm relative">
      {professionalismReviewRequired && <div className="absolute top-4 left-4 z-50 animate-in slide-in-from-left-4"><div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 border-2 border-amber-300"><Zap size={20} className="animate-pulse" /><div><div className="text-[10px] font-black uppercase tracking-widest">Rule 15 Filter Active</div><div className="text-[9px] font-bold uppercase mt-0.5">Commercial solicitation detected. Sealing disabled.</div></div></div></div>}
      {(isPrcExpired || isIndemnityLocked || hasActiveComplication || isPediatricBlocked || (!activeAppointmentToday && !isArchitect)) && <div className="absolute inset-0 z-[60] bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center p-8 text-center animate-in fade-in"><div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-4 border-red-500 max-w-sm flex flex-col items-center gap-4"><ShieldAlert size={48} className="text-red-600 animate-bounce" /><h3 className="text-xl font-black uppercase text-red-900">Registry Locked</h3><p className="text-sm font-bold text-slate-600">Clinical commitment is suspended for legal/clinical safety protocols.</p></div></div>}
      {!readOnly && (
          <div className={`border-b border-slate-200 p-6 ${editingId ? 'bg-amber-50/50' : 'bg-slate-50/50'} overflow-y-auto max-h-[80%]`}>
             <div className="flex justify-between items-center mb-4">
                 <h4 className="font-bold text-slate-700 flex items-center gap-2">{editingId ? <RotateCcw size={18}/> : <Plus size={18}/>} Documentation</h4>
                 <div className="flex gap-2">
                    <div className="flex bg-slate-100 p-1 rounded-lg gap-1">{QUICK_FILLS.map(q => <button key={q.label} type="button" onClick={() => applyQuickFill(q)} className="px-2 py-1 bg-white text-[9px] font-black uppercase rounded border border-slate-200 hover:border-teal-500 transition-all">{q.label}</button>)}</div>
                    <input type="file" ref={photoInputRef} accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />
                    <button type="button" onClick={() => photoInputRef.current?.click()} className="px-3 py-1.5 bg-lilac-100 text-lilac-700 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 shadow-sm"><Camera size={14}/> Photos</button>
                    {editingId && <button onClick={() => setEditingId(null)} className="text-xs font-bold text-amber-700 hover:underline">Cancel</button>}
                 </div>
             </div>
             <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                     <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tooth #</label><input type="number" className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none" value={toothNum} onChange={e => setToothNum(e.target.value)} disabled={!!editingId}/></div>
                     <div className="md:col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Procedure</label><select value={selectedProcedure} onChange={(e) => setSelectedProcedure(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white font-bold" disabled={!!editingId}><option value="">- Select -</option>{procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
                     <div><label className="text-[10px] font-black uppercase ml-1 text-slate-400">Operatory</label><select value={selectedResourceId} onChange={e => setSelectedResourceId(e.target.value)} className="w-full p-2.5 rounded-xl border bg-white font-medium"><option value="">- Select Chair -</option>{fieldSettings?.resources?.filter(r => r.type === ResourceType.CHAIR || r.type === ResourceType.CONSULTATION).map(res => (<option key={res.id} value={res.id}>{res.name}</option>))}</select></div>
                     <div>
                        <label className="text-[10px] font-black uppercase ml-1 text-slate-400 flex items-center gap-1">Material Batch {isTraceabilityRequired && '*'}</label>
                        <select 
                            value={selectedBatchId} 
                            onChange={e => setSelectedBatchId(e.target.value)} 
                            className={`w-full p-2.5 rounded-xl border-2 text-xs outline-none bg-white font-medium shadow-sm transition-all ${isAdvancedInventory && isTraceabilityRequired && !selectedBatchId ? 'border-red-400 animate-pulse' : 'border-slate-200'}`}
                            disabled={!isAdvancedInventory || !!editingId}
                        >
                            <option value="">- Select Batch -</option>
                            {isAdvancedInventory && inventory.filter(i => !i.expiryDate || new Date(i.expiryDate) > new Date()).map(item => {
                                const isFifo = item.id === fifoBatchId;
                                return (
                                    <option key={item.id} value={item.id} className={isFifo ? 'bg-teal-50 font-black' : ''}>
                                        {isFifo && '⭐ '} {item.name} (Batch: {item.id}) {isFifo ? ' - (FIFO RECOMMENDATION)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                     </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <SoapField label="Subjective" value={subjective} onChange={setSubjective} field="s" placeholder="Symptoms..." />
                     <SoapField label="Objective" value={objective} onChange={setObjective} field="o" placeholder="Findings..." />
                     <SoapField label="Assessment" value={assessment} onChange={setAssessment} field="a" placeholder="Diagnosis..." />
                     <SoapField label="Plan" value={plan} onChange={setPlan} field="p" placeholder="Treatment..." />
                 </div>
                 <div className={`p-4 rounded-2xl animate-in slide-in-from-bottom-2 transition-colors ${pearlIsValid && isAuthenticNarrative ? 'bg-teal-50 border border-teal-200' : 'bg-red-50 border border-red-200'}`}>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-2"><Sparkles size={14}/> Forensic Clinical Pearl</label>
                    <input type="text" value={clinicalPearl} onChange={e => setClinicalPearl(e.target.value)} placeholder="Unique observation (Min 20 chars)..." className={`w-full p-3 rounded-xl border-2 text-sm outline-none ${pearlIsValid ? 'border-teal-500 bg-white' : 'border-red-300'}`} />
                 </div>
                 <button type="submit" disabled={isPrcExpired || isIndemnityLocked || hasActiveComplication || isPediatricBlocked || !pearlIsValid || !isAuthenticNarrative || (isAdvancedInventory && isTraceabilityRequired && !selectedBatchId) || (isOperatoryRequired && !selectedResourceId) || (!activeAppointmentToday && !isArchitect)} className="w-full py-4 rounded-xl font-black text-[11px] text-white flex items-center justify-center gap-3 shadow-lg bg-teal-600 hover:bg-teal-700 uppercase tracking-widest disabled:opacity-50">
                     <ShieldCheck size={20} /> Commit to Clinical History
                 </button>
             </form>
          </div>
      )}
      <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 sticky top-0 z-10 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><tr><th className="p-4 border-b w-24">Date</th><th className="p-4 border-b w-12 text-center">T#</th><th className="p-4 border-b">Narrative & Evidence</th><th className="p-4 border-b w-24 text-right">Status</th></tr></thead>
              <tbody className="text-sm divide-y divide-slate-100">
                  {[...entries].sort((a,b) => new Date(b.date||'').getTime() - new Date(a.date||'').getTime()).map((entry, idx) => (
                      <tr key={idx} className={`${entry.isVoid ? 'bg-slate-100 opacity-50 grayscale' : 'bg-white'} hover:bg-teal-50/20 group`}>
                          <td className="p-4 font-mono text-[10px] text-slate-500">{formatDate(entry.date)}</td>
                          <td className="p-4 text-center font-bold"><span className="bg-slate-50 border px-1.5 py-0.5 rounded text-xs">#{entry.toothNumber || '-'}</span></td>
                          <td className="p-4 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed"><div className="bg-white/50 p-2 rounded-lg">{entry.notes}{entry.sealedHash && <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[8px] text-slate-400 break-all">{entry.sealedHash}</div>}</div></td>
                          <td className="p-4 text-right">{entry.sealedHash ? <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-[10px] font-black border border-teal-200 uppercase">Sealed</span> : <div className="flex gap-2 justify-end"><button onClick={() => handleEdit(entry)} className="p-2 text-slate-400 hover:text-teal-600"><Edit3 size={16}/></button><button onClick={() => handleSeal(entry)} className="px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-lg bg-teal-600 text-white">Seal</button></div>}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
      {showWitnessModal && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4"><div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full animate-in zoom-in-95 text-center"><ShieldCheck size={48} className="mx-auto text-teal-600 mb-4"/><h3 className="text-xl font-black uppercase">Witness Verification</h3><p className="text-sm text-slate-500 mb-6">Staff witness required to seal record without trusted network time.</p><input type="password" value={witnessPin} onChange={e => setWitnessPin(e.target.value)} placeholder="Witness PIN" className="input text-center text-3xl mb-4" /><button onClick={handleWitnessVerify} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase">Verify</button></div></div>}
      {showSurgicalWitness && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4"><div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full animate-in zoom-in-95 text-center"><UserCheck size={48} className="mx-auto text-teal-600 mb-4"/><h3 className="text-xl font-black uppercase">Dual-Sign Signature</h3><p className="text-sm text-slate-500 mb-6">Surgical records require a second staff signature.</p><input type="password" value={surgicalWitnessPin} onChange={e => setSurgicalWitnessPin(e.target.value)} placeholder="Witness PIN" className="input text-center text-3xl mb-4" /><button onClick={handleSurgicalWitnessVerify} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase">Sign & Seal</button></div></div>}
    </div>
  );
};

export default Odontonotes;

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DentalChartEntry, ProcedureItem, StockItem, User, UserRole, FieldSettings, TreatmentStatus, ClinicalIncident, Patient, ResourceType, Appointment, AppointmentStatus, AuthorityLevel, InstrumentSet } from '../types';
import { Plus, Edit3, ShieldCheck, Lock, Clock, GitCommit, ArrowDown, AlertCircle, FileText, Zap, Box, RotateCcw, CheckCircle2, PackageCheck, Mic, MicOff, Volume2, Sparkles, DollarSign, ShieldAlert, Key, Camera, ImageIcon, Check, MousePointer2, UserCheck, X, EyeOff, Shield, Eraser, Activity, Heart, HeartPulse, Droplet, UserSearch, RotateCcw as Undo, Trash2, Armchair, Star, PlusCircle, MinusCircle, UserPlus, ShieldX, Verified } from 'lucide-react';
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
  const isAdvancedInventory = fieldSettings?.features.inventoryComplexity === 'ADVANCED';
  
  const [toothNum, setToothNum] = useState<string>('');
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [charge, setCharge] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedInstrumentSetId, setSelectedInstrumentSetId] = useState('');
  const [varianceCount, setVarianceCount] = useState(0); 
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

  const selectedSet = useMemo(() => {
    return fieldSettings?.instrumentSets?.find(s => s.id === selectedInstrumentSetId);
  }, [selectedInstrumentSetId, fieldSettings]);

  const isSetSterile = selectedSet?.status === 'Sterile';

  const macroSnapshotRef = useRef<string>('');

  const isTraceabilityRequired = useMemo(() => {
      if (!isAdvancedInventory || !fieldSettings?.features.enableMaterialTraceability) return false;
      const categories = ['Restorative', 'Surgery', 'Endodontics', 'Prosthodontics'];
      return categories.includes(activeProcedureDef?.category || '');
  }, [activeProcedureDef, fieldSettings, isAdvancedInventory]);

  const isSurgicalProcedure = useMemo(() => {
      return activeProcedureDef?.category === 'Surgery' || selectedProcedure.toLowerCase().includes('extraction');
  }, [activeProcedureDef, selectedProcedure]);

  const fifoBatchId = useMemo(() => {
      if (!inventory || inventory.length === 0) return null;
      const validStock = inventory.filter(i => {
          if (!i.expiryDate) return false;
          return new Date(i.expiryDate) > new Date();
      });
      if (validStock.length === 0) return null;
      return [...validStock].sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime())[0].id;
  }, [inventory]);

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

  // Fix: Implemented handlePhotoCapture for clinical image management
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result as string;
              setCapturedPhotos(prev => [...prev, base64String]);
              toast.info("Clinical image captured.");
          };
          reader.readAsDataURL(file);
      }
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

  const handleWitnessVerify = () => {
    if (!witnessPin || !pendingSealEntry) return;
    if (witnessPin === '1234') {
        const witness = STAFF.find(s => s.id !== currentUser.id) || STAFF[0];
        executeSeal(pendingSealEntry, pendingSealTimestamp, false, witness);
    } else {
        toast.error("Invalid Witness PIN.");
    }
  };

  const handleSurgicalWitnessVerify = () => {
    if (!surgicalWitnessPin || !pendingSurgicalEntry) return;
    if (surgicalWitnessPin === '1234') {
        onAddEntry({ 
            ...pendingSurgicalEntry, 
            witnessId: 'Verified_ID', 
            witnessName: 'Verified Clinical Staff' 
        });
        setShowSurgicalWitness(false);
        setSurgicalWitnessPin('');
        setPendingSurgicalEntry(null);
        resetForm();
        toast.success("Surgical record verified and committed.");
    } else {
        toast.error("Invalid Witness PIN.");
    }
  };

  const resetForm = () => {
      setSubjective(''); setObjective(''); setAssessment(''); setPlan(''); setToothNum(''); setSelectedProcedure(''); setCharge(''); setSelectedBatchId(''); setSelectedInstrumentSetId(''); setVarianceCount(0); setSelectedResourceId(''); setSelectedCycleId(''); setCapturedPhotos([]); setClinicalPearl('');
      macroSnapshotRef.current = ''; setEditingId(null);
  };

  const handleEdit = (entry: DentalChartEntry) => {
      setEditingId(entry.id); setToothNum(entry.toothNumber?.toString() || ''); setSelectedProcedure(entry.procedure || '');
      setSubjective(entry.subjective || ''); setObjective(entry.objective || ''); setAssessment(entry.assessment || ''); setPlan(entry.plan || '');
      setCharge(entry.price?.toString() || ''); setSelectedBatchId(entry.materialBatchId || ''); setVarianceCount(entry.materialVariance || 0); setSelectedResourceId(entry.resourceId || '');
      setSelectedInstrumentSetId(entry.instrumentSetId || '');
      setSelectedCycleId(entry.sterilizationCycleId || ''); setCapturedPhotos(entry.imageHashes || []);
      
      const pearlMatch = entry.notes?.match(/PEARL:\s*(.*?)(\[Batch:|$)/);
      setClinicalPearl(pearlMatch ? pearlMatch[1].trim() : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPrcExpired || isIndemnityLocked || hasActiveComplication || isPediatricBlocked || !pearlIsValid || !isAuthenticNarrative || (isTraceabilityRequired && !isSetSterile) || (!activeAppointmentToday && !isArchitect)) return;
    
    const batchSuffix = (isAdvancedInventory && selectedBatchId) ? ` [Batch: ${selectedBatchId}${varianceCount > 0 ? ` + ${varianceCount} variance` : ''}]` : '';
    const sterilizationSuffix = (isAdvancedInventory && selectedCycleId) ? ` [Autoclave Cycle: ${selectedCycleId}]` : '';
    const combinedNotes = `S: ${subjective}\nO: ${objective}\nA: ${assessment}\nP: ${plan}\nPEARL: ${clinicalPearl}${batchSuffix}${sterilizationSuffix}`;
    const selectedResource = fieldSettings?.resources?.find(r => r.id === selectedResourceId);
    
    const entryData = {
        notes: combinedNotes, subjective, objective, assessment, plan,
        materialBatchId: isAdvancedInventory ? (selectedBatchId || undefined) : undefined,
        materialVariance: varianceCount > 0 ? varianceCount : undefined,
        instrumentSetId: selectedInstrumentSetId || undefined,
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
                onAddEntry({ ...originalEntry, id: `dc_amend_${Date.now()}`, originalNoteId: originalEntry.id, notes: `[AMENDMENT]\n${combinedNotes}`, subjective, objective, assessment, plan, date: new Date().toISOString().split('T')[0], sealedHash: undefined, sealedAt: undefined, isLocked: false, imageHashes: capturedPhotos, committedAt: new Date().toISOString(), materialVariance: varianceCount });
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
          <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</label>
              {!disabled && <button type="button" onClick={() => toggleRecording(field)} className={`p-1.5 rounded-lg transition-all ${isRecording === field ? 'bg-red-50 text-red-600 animate-pulse' : 'text-slate-300 hover:text-teal-600 opacity-0 group-hover/field:opacity-100'}`}>{isRecording === field ? <MicOff size={12}/> : <Mic size={12}/>}</button>}
          </div>
          <div className="relative">
              <textarea className={`w-full p-4 border rounded-[1.5rem] text-sm h-24 bg-white outline-none transition-all ${disabled ? 'bg-slate-50 opacity-60' : 'border-slate-200 focus:border-teal-500 shadow-sm focus:shadow-teal-500/5'}`} value={value} onChange={e => onChange(e.target.value)} placeholder={disabled ? '' : placeholder} disabled={disabled} />
              {disabled && <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-[1.5rem]"><div className="flex flex-col items-center gap-1"><Lock size={20} className="text-slate-400"/><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{watermark || 'IMMUTABLE RECORD'}</span></div></div>}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm relative">
      {(isPrcExpired || isIndemnityLocked || hasActiveComplication || isPediatricBlocked || (!activeAppointmentToday && !isArchitect)) && (
          <div className="absolute inset-0 z-[60] bg-slate-900/10 backdrop-blur-[4px] flex items-center justify-center p-8 text-center animate-in fade-in">
              <div className="bg-white p-10 rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.2)] border-4 border-red-500 max-w-sm flex flex-col items-center gap-6 animate-in zoom-in-95">
                  <div className="bg-red-50 p-6 rounded-full ring-8 ring-red-50"><ShieldAlert size={64} className="text-red-600 animate-bounce" /></div>
                  <h3 className="text-2xl font-black uppercase text-red-900 tracking-tighter">Clinical Lock Active</h3>
                  <p className="text-sm font-bold text-slate-600 leading-relaxed">Mandatory clinical gate triggered. Commitment functions suspended for regulatory/patient safety protocol.</p>
              </div>
          </div>
      )}
      
      {!readOnly && (
          <div className={`border-b border-slate-200 p-8 ${editingId ? 'bg-amber-50/20' : 'bg-slate-50/30'} overflow-y-auto max-h-[85%] no-scrollbar`}>
             <div className="flex justify-between items-center mb-6">
                 <div className="flex flex-col">
                    <h4 className="text-lg font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">{editingId ? <Undo size={24} className="text-amber-600"/> : <Edit3 size={24} className="text-teal-600"/>} {editingId ? 'Amending Forensic Record' : 'Clinical Documentation'}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">RA 8792 Electronic Evidence Standard</p>
                 </div>
                 <div className="flex gap-3">
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 gap-1">{QUICK_FILLS.map(q => <button key={q.label} type="button" onClick={() => applyQuickFill(q)} className="px-3 py-1.5 bg-slate-50 text-[10px] font-black uppercase rounded-lg border border-slate-100 hover:border-teal-500 transition-all">{q.label}</button>)}</div>
                    <button type="button" onClick={() => photoInputRef.current?.click()} className="px-4 py-2 bg-lilac-100 text-lilac-700 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-sm border border-lilac-200 transition-all hover:scale-105"><Camera size={16}/> Imaging</button>
                    {editingId && <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase border border-red-100 hover:bg-red-600 hover:text-white transition-all">Cancel</button>}
                 </div>
             </div>
             <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                     <div className="bg-white p-2 rounded-2xl border-2 border-slate-100 focus-within:border-teal-500 transition-all"><label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Tooth</label><input type="number" className="w-full px-2 py-1.5 text-lg font-black outline-none bg-transparent" value={toothNum} onChange={e => setToothNum(e.target.value)} disabled={!!editingId} placeholder="FDI"/></div>
                     <div className="md:col-span-2 bg-white p-2 rounded-2xl border-2 border-slate-100 focus-within:border-teal-500 transition-all"><label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Procedure Catalog</label><select value={selectedProcedure} onChange={(e) => setSelectedProcedure(e.target.value)} className="w-full px-2 py-1.5 text-sm font-black outline-none bg-transparent" disabled={!!editingId}><option value="">- Select Verified Item -</option>{procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
                     <div className="bg-white p-2 rounded-2xl border-2 border-slate-100 focus-within:border-teal-500 transition-all"><label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Operatory</label><select value={selectedResourceId} onChange={e => setSelectedResourceId(e.target.value)} className="w-full px-2 py-1.5 text-sm font-bold outline-none bg-transparent"><option value="">- Chair -</option>{fieldSettings?.resources?.filter(r => r.type === ResourceType.CHAIR || r.type === ResourceType.CONSULTATION).map(res => (<option key={res.id} value={res.id}>{res.name}</option>))}</select></div>
                     
                     <div className="bg-white p-2 rounded-2xl border-2 transition-all border-slate-100">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Instrument Set</label>
                        <select 
                            value={selectedInstrumentSetId}
                            onChange={e => setSelectedInstrumentSetId(e.target.value)}
                            className={`w-full px-2 py-1.5 text-[10px] font-black outline-none bg-transparent ${selectedInstrumentSetId && !isSetSterile ? 'text-red-600' : isSetSterile ? 'text-teal-600' : ''}`}
                        >
                            <option value="">- Select Set -</option>
                            {fieldSettings?.instrumentSets?.map(set => (<option key={set.id} value={set.id}>{set.name} ({set.status})</option>))}
                        </select>
                     </div>

                     <div className="bg-white p-2 rounded-2xl border-2 border-slate-100">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Inventory Batch</label>
                        <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} className="w-full px-2 py-1.5 text-[10px] font-black outline-none bg-transparent" disabled={!isAdvancedInventory || !!editingId}>
                            <option value="">- Select Batch -</option>
                            {isAdvancedInventory && inventory.filter(i => !i.expiryDate || new Date(i.expiryDate) > new Date()).map(item => (<option key={item.id} value={item.id} className={item.id === fifoBatchId ? 'bg-teal-50' : ''}>{item.name}</option>))}
                        </select>
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <SoapField label="Subjective (S)" value={subjective} onChange={setSubjective} field="s" placeholder="Patient symptoms & reports..." />
                     <SoapField label="Objective (O)" value={objective} onChange={setObjective} field="o" placeholder="Clinical findings & tests..." />
                     <SoapField label="Assessment (A)" value={assessment} onChange={setAssessment} field="a" placeholder="Diagnosis / Clinical opinion..." />
                     <SoapField label="Plan (P)" value={plan} onChange={setPlan} field="p" placeholder="Procedures performed & materials..." />
                 </div>

                 <div className={`p-6 rounded-[2rem] border-2 transition-all duration-500 shadow-lg ${pearlIsValid && isAuthenticNarrative ? 'bg-teal-50/50 border-teal-500' : 'bg-red-50 border-red-200 animate-in slide-in-from-bottom-2'}`}>
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-[10px] font-black uppercase text-teal-800 tracking-widest flex items-center gap-2"><Sparkles size={16}/> Forensic Clinical Pearl (Mandatory)</label>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${pearlIsValid ? 'bg-teal-500 text-white' : 'bg-red-500 text-white animate-pulse'}`}>{pearlIsValid ? 'VALID' : 'MIN 20 CHARS'}</span>
                    </div>
                    <input type="text" value={clinicalPearl} onChange={e => setClinicalPearl(e.target.value)} placeholder="A unique clinical observation not found in templates..." className={`w-full p-4 rounded-2xl border-2 text-sm font-bold outline-none transition-all ${pearlIsValid ? 'border-teal-500 bg-white shadow-inner' : 'border-red-300 bg-white'}`} />
                 </div>

                 <button type="submit" disabled={isPrcExpired || isIndemnityLocked || hasActiveComplication || isPediatricBlocked || !pearlIsValid || !isAuthenticNarrative || (isAdvancedInventory && isTraceabilityRequired && !selectedBatchId) || (isTraceabilityRequired && !isSetSterile) || (!activeAppointmentToday && !isArchitect)} className="w-full py-5 rounded-[1.8rem] font-black text-xs text-white flex items-center justify-center gap-4 shadow-xl bg-teal-600 hover:bg-teal-700 uppercase tracking-widest disabled:opacity-50 hover:scale-[1.02] transition-all">
                     <ShieldCheck size={24} /> Seal and Archive Chronological Note
                 </button>
             </form>
          </div>
      )}

      <div className="flex-1 overflow-auto bg-white p-2">
          <table className="w-full text-left border-separate border-spacing-y-3 px-6 pb-20">
              <thead className="sticky top-0 z-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]"><tr><th className="p-4 w-32">Temporal Stamp</th><th className="p-4 w-16 text-center">FDI</th><th className="p-4">Clinical Evidence & Narrative</th><th className="p-4 w-32 text-right">Integrity Status</th></tr></thead>
              <tbody className="text-sm">
                  {[...entries].sort((a,b) => new Date(b.date||'').getTime() - new Date(a.date||'').getTime()).map((entry, idx) => (
                      <tr key={idx} className={`${entry.isVoid ? 'opacity-30' : ''} bg-slate-50/50 hover:bg-white transition-all duration-300 group rounded-[2rem]`}>
                          <td className="p-5 font-mono text-[9px] text-slate-400 rounded-l-[2rem] border-y border-l border-transparent group-hover:border-slate-100 group-hover:bg-white">{formatDate(entry.date)}</td>
                          <td className="p-5 text-center rounded-none group-hover:bg-white group-hover:border-y border-transparent group-hover:border-slate-100"><span className="bg-white border-2 border-slate-100 text-teal-700 px-3 py-1 rounded-xl text-xs font-black shadow-sm group-hover:border-teal-500 transition-colors">#{entry.toothNumber || 'A'}</span></td>
                          <td className="p-5 text-xs text-slate-600 group-hover:bg-white group-hover:border-y border-transparent group-hover:border-slate-100">
                            <div className="font-bold text-slate-800 text-sm mb-2 uppercase tracking-tight">{entry.procedure}</div>
                            <div className="leading-relaxed font-medium italic mb-4 whitespace-pre-wrap">"{entry.notes}"</div>
                            {entry.sealedHash && (
                                <div className="mt-4 p-4 bg-slate-900 rounded-2xl font-mono text-[8px] text-teal-400/60 break-all relative shadow-lg overflow-hidden group/seal">
                                    <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 group-hover/seal:scale-[2] transition-transform duration-1000"><Shield size={80}/></div>
                                    <div className="flex items-center gap-2 mb-2 text-teal-400"><Verified size={14}/> <span className="font-black uppercase tracking-widest">SHA-256 SECURED RECORD</span></div>
                                    {entry.sealedHash}
                                    {entry.supervisorySeal && (
                                        <div className="mt-4 pt-4 border-t border-teal-900/50 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <UserCheck size={14} className="text-teal-400"/>
                                                <span className="text-[9px] font-black uppercase text-white tracking-widest">Digital Supervisory Sign-Off: Dr. {entry.supervisorySeal.dentistName}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                          </td>
                          <td className="p-5 text-right rounded-r-[2rem] group-hover:bg-white group-hover:border-y group-hover:border-r border-transparent group-hover:border-slate-100">
                            {entry.sealedHash ? (
                                <div className="flex flex-col gap-2 items-end">
                                    <div className="flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-full text-[10px] font-black border-2 border-teal-200 uppercase tracking-widest animate-in fade-in duration-1000 shadow-sm shadow-teal-500/5">
                                        <CheckCircle2 size={16} fill="currentColor" className="text-white bg-teal-600 rounded-full" />
                                        Verified Seal
                                    </div>
                                    <p className="text-[8px] font-black text-slate-300 uppercase mt-1">Immutable Archive</p>
                                </div>
                            ) : (
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => handleEdit(entry)} className="p-3 text-slate-300 hover:text-teal-600 hover:bg-teal-50 rounded-2xl transition-all"><Edit3 size={18}/></button>
                                    <button onClick={() => handleSeal(entry)} className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg bg-teal-600 text-white hover:bg-teal-700 hover:-translate-y-1 transition-all active:scale-95">Sealing Auth</button>
                                </div>
                            )}
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      <input type="file" ref={photoInputRef} accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />
    </div>
  );
};

export default Odontonotes;
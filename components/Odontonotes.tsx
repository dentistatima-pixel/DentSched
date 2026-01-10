
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DentalChartEntry, ProcedureItem, StockItem, User, UserRole, FieldSettings, TreatmentStatus, ClinicalIncident, Patient, ResourceType, Appointment, AppointmentStatus, AuthorityLevel, InstrumentSet } from '../types';
import { Plus, Edit3, ShieldCheck, Lock, Clock, GitCommit, ArrowDown, AlertCircle, FileText, Zap, Box, RotateCcw, CheckCircle2, PackageCheck, Mic, MicOff, Volume2, Sparkles, DollarSign, ShieldAlert, Key, Camera, ImageIcon, Check, MousePointer2, UserCheck, X, EyeOff, Shield, Eraser, Activity, Heart, HeartPulse, Droplet, UserSearch, RotateCcw as Undo, Trash2, Armchair, Star, PlusCircle, MinusCircle, UserPlus, ShieldX, Verified, ShieldQuestion, Pill, Fingerprint } from 'lucide-react';
import { formatDate, STAFF, PDA_FORBIDDEN_COMMERCIAL_TERMS } from '../constants';
import { useToast } from './ToastSystem';
import EPrescriptionModal from './EPrescriptionModal';
import SignatureCaptureOverlay from './SignatureCaptureOverlay';
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
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [requireSignOff, setRequireSignOff] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [pendingEntryData, setPendingEntryData] = useState<any>(null);
  
  const recognitionRef = useRef<any>(null);

  const [showWitnessModal, setShowWitnessModal] = useState(false);
  const [witnessPin, setWitnessPin] = useState('');
  const [pendingSealEntry, setPendingSealEntry] = useState<DentalChartEntry | null>(null);
  const [pendingSealTimestamp, setPendingSealTimestamp] = useState<string>('');
  
  const [showSurgicalWitness, setShowSurgicalWitness] = useState(false);
  const [surgicalWitnessPin, setSurgicalWitnessPin] = useState('');
  const [pendingSurgicalEntry, setPendingSurgicalEntry] = useState<any>(null);

  const isArchitect = currentUser.role === UserRole.SYSTEM_ARCHITECT;

  const filteredProcedures = useMemo(() => {
    return procedures.filter(p => {
        if (!p.allowedLicenseCategories || p.allowedLicenseCategories.length === 0) return true;
        if (!currentUser.licenseCategory) return true;
        return p.allowedLicenseCategories.includes(currentUser.licenseCategory);
    });
  }, [procedures, currentUser.licenseCategory]);

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
  }, [prefill, onClearPrefill]);

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

  const handleSuperviseSeal = async (entry: DentalChartEntry) => {
      if (currentUser.role !== UserRole.DENTIST) return;
      const { timestamp } = await getTrustedTime();
      const contentToHash = `${entry.id}|SUPERVISION|${currentUser.id}|${timestamp}`;
      const hash = CryptoJS.SHA256(contentToHash).toString();
      
      const updatedEntry: DentalChartEntry = { 
          ...entry, 
          isPendingSupervision: false,
          supervisorySeal: { 
            dentistId: currentUser.id, 
            dentistName: currentUser.name, 
            timestamp, 
            hash 
          } 
      };
      onUpdateEntry(updatedEntry);
      if (logAction) logAction('VERIFY_ASSISTANT_NOTE', 'ClinicalNote', entry.id, `Applied Supervisory Seal (RA 9484 Article IV).`);
      toast.success("Supervisory Seal Applied. Note Validated.");
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
        commitEntry(pendingSurgicalEntry);
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
      macroSnapshotRef.current = ''; setEditingId(null); setRequireSignOff(false);
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

    const procDef = procedures.find(p => p.name === selectedProcedure);
    if (procDef?.allowedLicenseCategories && currentUser.licenseCategory && !procDef.allowedLicenseCategories.includes(currentUser.licenseCategory)) {
        toast.error(`SCOPE VIOLATION (RA 9484): Your license category (${currentUser.licenseCategory}) does not permit the recording of ${selectedProcedure}.`);
        return;
    }

    if (isPrcExpired || isIndemnityLocked || hasActiveComplication || isPediatricBlocked || !pearlIsValid || !isAuthenticNarrative || (isTraceabilityRequired && !isSetSterile) || (!activeAppointmentToday && !isArchitect)) return;
    
    const isAssistant = currentUser.role === UserRole.DENTAL_ASSISTANT;
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
        authorPrc: currentUser.prcLicense, authorPtr: currentUser.ptrNumber, committedAt: new Date().toISOString(),
        isPendingSupervision: isAssistant,
        id: editingId || `dc_${Date.now()}`,
        toothNumber: (toothNum ? parseInt(toothNum) : 0),
        procedure: selectedProcedure || 'Clinical Note',
        status: 'Completed' as TreatmentStatus,
        price: charge ? parseFloat(charge) : 0,
        date: new Date().toISOString().split('T')[0],
        author: currentUser.name
    };

    if (requireSignOff) {
      setPendingEntryData(entryData);
      setShowSignaturePad(true);
      return;
    }

    if (isSurgicalProcedure) {
        setPendingSurgicalEntry(entryData);
        setShowSurgicalWitness(true); 
        return;
    }

    commitEntry(entryData);
  };

  const commitEntry = (data: any) => {
    if (editingId) {
        const originalEntry = entries.find(e => e.id === editingId);
        if (originalEntry) {
            if (isLocked(originalEntry)) {
                onAddEntry({ ...data, id: `dc_ammend_${Date.now()}`, originalNoteId: originalEntry.id, notes: `[AMENDMENT]\n${data.notes}` });
            } else onUpdateEntry(data);
            setEditingId(null);
        }
    } else {
        onAddEntry(data);
    }
    resetForm();
  };

  const handlePatientSignatureCaptured = (sig: string, hash: string) => {
    const updatedData = { ...pendingEntryData, patientSignature: sig, patientSignatureTimestamp: new Date().toISOString() };
    setShowSignaturePad(false);
    
    if (isSurgicalProcedure) {
      setPendingSurgicalEntry(updatedData);
      setShowSurgicalWitness(true);
    } else {
      commitEntry(updatedData);
    }
  };

  const SoapField = ({ label, value, onChange, field, placeholder, disabled, watermark }: { label: string, value: string, onChange: (v: string) => void, field: 's'|'o'|'a'|'p', placeholder: string, disabled?: boolean, watermark?: string }) => (
      <div className="relative group/field">
          <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none">{label}</label>
              {!disabled && <button type="button" onClick={() => toggleRecording(field)} className={`p-1.5 rounded-lg transition-all ${isRecording === field ? 'bg-red-600 text-red-600 animate-pulse' : 'text-slate-400 hover:text-teal-600 opacity-0 group-hover/field:opacity-100'}`} aria-label={`Voice input for ${label}`}>{isRecording === field ? <MicOff size={12}/> : <Mic size={12}/>}</button>}
          </div>
          <div className="relative">
              <textarea className={`w-full p-4 border rounded-[1.5rem] text-sm h-24 bg-white outline-none transition-all ${disabled ? 'bg-slate-50 opacity-60 border-slate-100' : 'border-slate-200 focus:border-teal-500 shadow-sm focus:shadow-teal-500/5'}`} value={value} onChange={e => onChange(e.target.value)} placeholder={disabled ? '' : placeholder} disabled={disabled} aria-label={label} />
              {disabled && <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-[1.5rem] bg-white/10 backdrop-blur-[1px]"><div className="flex flex-col items-center gap-1"><Lock size={20} className="text-slate-400"/><span className="text-xs font-black text-slate-500 uppercase tracking-widest">{watermark || 'IMMUTABLE RECORD'}</span></div></div>}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm relative" role="region" aria-label="Clinical Notes and Audit Trail">
      {(isPrcExpired || isIndemnityLocked || hasActiveComplication || isPediatricBlocked || (!activeAppointmentToday && !isArchitect)) && (
          <div className="absolute inset-0 z-[60] bg-slate-900/10 backdrop-blur-[4px] flex items-center justify-center p-8 text-center animate-in fade-in" role="alert">
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
                    <h4 className="text-lg font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">{editingId ? <Undo size={24} className="text-amber-600" aria-hidden="true"/> : <Edit3 size={24} className="text-teal-600" aria-hidden="true"/>} {editingId ? 'Amending Forensic Record' : 'Clinical Documentation'}</h4>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-1">RA 8792 Electronic Evidence Standard</p>
                 </div>
                 <div className="flex gap-3">
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 gap-1" role="group" aria-label="Macro templates">{QUICK_FILLS.map(q => <button key={q.label} type="button" onClick={() => applyQuickFill(q)} className="px-3 py-1.5 bg-slate-50 text-xs font-black uppercase rounded-lg border border-slate-100 hover:border-teal-500 transition-all">{q.label}</button>)}</div>
                    <button type="button" onClick={() => photoInputRef.current?.click()} className="px-4 py-2 bg-lilac-100 text-lilac-700 rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-sm border border-lilac-200 transition-all hover:scale-105" aria-label="Upload clinical imaging"><Camera size={16}/> Imaging</button>
                    <button type="button" onClick={() => setIsRxModalOpen(true)} className="px-4 py-2 bg-teal-100 text-teal-700 rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-sm border border-teal-200 transition-all hover:scale-105" aria-label="Digital Prescriptions"><Pill size={16}/> Prescribe</button>
                    {editingId && <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-slate-100 rounded-xl text-slate-500 font-black uppercase text-xs">Cancel</button>}
                 </div>
             </div>

             <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                    <div><label className="label">Tooth #</label><input type="text" value={toothNum} onChange={e => setToothNum(e.target.value)} className="input" placeholder="e.g. 16" /></div>
                    <div><label className="label">Procedure</label><select value={selectedProcedure} onChange={e => setSelectedProcedure(e.target.value)} className="input">{filteredProcedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
                    <div><label className="label">Resource/Chair</label><select value={selectedResourceId} onChange={e => setSelectedResourceId(e.target.value)} className="input"><option value="">- Select -</option>{fieldSettings?.resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                    <div><label className="label">Fee (₱)</label><input type="number" value={charge} onChange={e => setCharge(e.target.value)} className="input font-bold" placeholder="0" /></div>
                </div>

                <SoapField label="Subjective (Symptoms)" value={subjective} onChange={setSubjective} field="s" placeholder="Patient reports..." />
                <SoapField label="Objective (Findings)" value={objective} onChange={setObjective} field="o" placeholder="Visual exam shows..." />
                <SoapField label="Assessment (Diagnosis)" value={assessment} onChange={setAssessment} field="a" placeholder="Caries, Gingivitis..." />
                <SoapField label="Plan (Treatment)" value={plan} onChange={setPlan} field="p" placeholder="Prep and fill..." />

                <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 mb-2"><Sparkles size={16} className="text-teal-600"/><span className="text-xs font-black uppercase tracking-widest text-slate-700">Clinical Pearl & Forensic Trace</span></div>
                    <textarea value={clinicalPearl} onChange={e => setClinicalPearl(e.target.value)} className={`w-full p-4 border-2 rounded-[2rem] text-sm h-20 outline-none transition-all ${pearlIsValid ? 'bg-white border-teal-100 focus:border-teal-500' : 'bg-red-50 border-red-100 focus:border-red-500'}`} placeholder="Record a unique detail about this session (Min 20 characters)..." />
                </div>

                {isAdvancedInventory && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <label className="label text-[10px] flex items-center gap-2"><PackageCheck size={14}/> Material Batch Log</label>
                            <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} className="input text-xs">{inventory.map(item => <option key={item.id} value={item.id}>{item.name} ({item.quantity})</option>)}</select>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <label className="label text-[10px] flex items-center gap-2"><ShieldCheck size={14}/> Sterile Instrument Set</label>
                            <select value={selectedInstrumentSetId} onChange={e => setSelectedInstrumentSetId(e.target.value)} className={`input text-xs ${selectedInstrumentSetId && !isSetSterile ? 'border-red-500 bg-red-50' : ''}`}><option value="">- Select Set -</option>{fieldSettings?.instrumentSets?.map(s => <option key={s.id} value={s.id}>{s.name} ({s.status})</option>)}</select>
                        </div>
                    </div>
                )}

                <div className="md:col-span-2 flex justify-between items-center bg-slate-50 p-4 rounded-[2rem] border border-slate-200">
                    <div className="flex gap-6 items-center">
                        <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uniqueness</span><span className={`text-lg font-black ${isAuthenticNarrative ? 'text-teal-700' : 'text-red-600'}`}>{uniquenessScore}%</span></div>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" checked={requireSignOff} onChange={e => setRequireSignOff(e.target.checked)} className="w-6 h-6 accent-lilac-600 rounded shadow-sm" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-600 group-hover:text-lilac-700 transition-colors">Require Patient Sign-off</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Forensic non-repudiation</span>
                          </div>
                        </label>
                    </div>
                    <button type="submit" disabled={!pearlIsValid || !isAuthenticNarrative || (isTraceabilityRequired && !isSetSterile)} className={`px-12 py-5 rounded-3xl font-black uppercase tracking-widest text-sm shadow-2xl transition-all flex items-center gap-4 ${pearlIsValid && isAuthenticNarrative ? 'bg-teal-600 text-white shadow-teal-600/20 hover:scale-105 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}><CheckCircle2 size={24}/> {requireSignOff ? 'Sign & Commit' : 'Commit Forensic Record'}</button>
                </div>
             </form>
          </div>
      )}

      <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar bg-white">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4"><History size={20} className="text-slate-400"/><h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Chronological Narrative Trail</h4></div>
          {[...entries].reverse().map(entry => (
              <div key={entry.id} className={`p-6 rounded-[2.2rem] border-2 transition-all relative overflow-hidden group ${entry.sealedHash ? 'bg-white border-slate-50' : 'bg-amber-50/20 border-amber-100 border-dashed shadow-lg'}`}>
                  {entry.isPendingSupervision && <div className="absolute top-0 left-0 right-0 bg-lilac-600 text-white text-[9px] font-black uppercase text-center py-1 tracking-widest">Awaiting Professional Supervision (RA 9484)</div>}
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                         <div className={`p-3 rounded-2xl ${entry.sealedHash ? 'bg-teal-50 text-teal-600' : 'bg-amber-100 text-amber-700 animate-pulse'}`}>{entry.sealedHash ? <ShieldCheck size={24}/> : <Clock size={24}/>}</div>
                         <div>
                            <h5 className="font-black text-slate-800 uppercase tracking-tight text-sm">{entry.procedure} (# {entry.toothNumber})</h5>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">By: {entry.author} • {formatDate(entry.date)}</p>
                         </div>
                      </div>
                      <div className="flex gap-2 items-center">
                         {entry.patientSignature && <div className="flex items-center gap-2 px-3 py-1 bg-lilac-50 text-lilac-700 rounded-full text-[9px] font-black uppercase border border-lilac-100"><Check size={14}/> Patient Signed</div>}
                         {!entry.sealedHash && !readOnly && currentUser.name === entry.author && <button onClick={() => handleEdit(entry)} className="p-2.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all" aria-label="Edit note"><Edit3 size={18}/></button>}
                         {entry.isPendingSupervision && !readOnly && currentUser.role === UserRole.DENTIST && <button onClick={() => handleSuperviseSeal(entry)} className="px-4 py-2 bg-lilac-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-lilac-600/20 flex items-center gap-2 hover:scale-105 transition-all"><Verified size={14}/> Supervise</button>}
                         {!entry.sealedHash && !readOnly && (currentUser.name === entry.author || isArchitect) && <button onClick={() => handleSeal(entry)} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-teal-600/20 flex items-center gap-2 hover:scale-105 transition-all"><Lock size={14}/> Seal Record</button>}
                      </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100/60 shadow-inner">
                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">{entry.notes}</p>
                  </div>
                  {entry.sealedHash && (
                      <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                          <div className="flex items-center gap-2 text-[8px] font-mono text-slate-300"><Fingerprint size={12}/> {entry.sealedHash.substring(0, 32)}...</div>
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-teal-600 uppercase tracking-widest"><ShieldCheck size={14}/> Forensic Integrity Verified</div>
                      </div>
                  )}
              </div>
          ))}
          {entries.length === 0 && <div className="py-20 text-center text-slate-400 italic">No clinical entries found in registry.</div>}
      </div>

      <input type="file" ref={photoInputRef} onChange={handlePhotoCapture} accept="image/*" className="hidden" />

      {isRxModalOpen && patient && fieldSettings && (
          <EPrescriptionModal isOpen={isRxModalOpen} onClose={() => setIsRxModalOpen(false)} patient={patient} fieldSettings={fieldSettings} currentUser={currentUser} logAction={logAction} />
      )}

      {showWitnessModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border-4 border-amber-500 animate-in zoom-in-95">
                  <div className="flex items-center gap-3 text-amber-700 mb-6"><ShieldQuestion size={32} className="animate-bounce"/><h3 className="text-2xl font-black uppercase">Temporal Witness Required</h3></div>
                  <p className="text-xs text-slate-600 font-bold uppercase tracking-tight leading-relaxed mb-6">Trusted clock unavailable. A staff member must verify the current clinical time to seal this record.</p>
                  <input type="password" value={witnessPin} onChange={e => setWitnessPin(e.target.value)} placeholder="Witness Staff PIN" className="w-full p-4 text-center text-3xl tracking-[1em] border-2 border-slate-200 rounded-2xl focus:border-amber-500 outline-none font-black bg-slate-50 mb-6" />
                  <div className="flex gap-2"><button onClick={() => setShowWitnessModal(false)} className="flex-1 py-4 font-black uppercase text-xs">Cancel</button><button onClick={handleWitnessVerify} className="flex-[2] py-4 bg-amber-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl">Verify & Seal</button></div>
              </div>
          </div>
      )}

      {showSurgicalWitness && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border-4 border-red-500 animate-in zoom-in-95">
                  <div className="flex items-center gap-3 text-red-700 mb-6"><ShieldAlert size={32} className="animate-pulse"/><h3 className="text-2xl font-black uppercase">Surgical Witness Protocol</h3></div>
                  <p className="text-xs text-slate-600 font-bold uppercase tracking-tight leading-relaxed mb-6">MANDATORY (PDA Rule 11): High-risk surgical entries require immediate physical witnessing by assisting staff for liability protection.</p>
                  <input type="password" value={surgicalWitnessPin} onChange={e => setSurgicalWitnessPin(e.target.value)} placeholder="Assisting Staff PIN" className="w-full p-4 text-center text-3xl tracking-[1em] border-2 border-slate-200 rounded-2xl focus:border-red-500 outline-none font-black bg-slate-50 mb-6" />
                  <div className="flex gap-2"><button onClick={() => setShowSurgicalWitness(false)} className="flex-1 py-4 font-black uppercase text-xs">Cancel</button><button onClick={handleSurgicalWitnessVerify} className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl">Witness & Commit</button></div>
              </div>
          </div>
      )}

      <SignatureCaptureOverlay 
        isOpen={showSignaturePad}
        onClose={() => setShowSignaturePad(false)}
        onSave={handlePatientSignatureCaptured}
        title="Odontonotes Patient Verification"
        instruction={`By signing, you confirm that the procedure "${pendingEntryData?.procedure}" performed today has been explained to you and correctly recorded.`}
        themeColor="lilac"
      />
    </div>
  );
};

export default Odontonotes;

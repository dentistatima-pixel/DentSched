import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DentalChartEntry, ProcedureItem, StockItem, User, UserRole, FieldSettings, TreatmentStatus, ClinicalIncident, Patient, ResourceType, Appointment, AppointmentStatus, AuthorityLevel, InstrumentSet, TreatmentPlan, SterilizationCycle, ClinicalMacro, ClinicalProtocolRule } from '../types';
import { Plus, Edit3, ShieldCheck, Lock, Clock, GitCommit, ArrowDown, AlertCircle, FileText, Zap, Box, RotateCcw, CheckCircle2, PackageCheck, Mic, MicOff, Volume2, Sparkles, DollarSign, ShieldAlert, Key, Camera, ImageIcon, Check, MousePointer2, UserCheck, X, EyeOff, Shield, Eraser, Activity, Heart, HeartPulse, Droplet, UserSearch, RotateCcw as Undo, Trash2, Armchair, Star, PlusCircle, MinusCircle, UserPlus, ShieldX, Verified, ShieldQuestion, Pill, Fingerprint, Scale, History, Link } from 'lucide-react';
import { formatDate, STAFF, PDA_FORBIDDEN_COMMERCIAL_TERMS, PDA_INFORMED_CONSENT_TEXTS } from '../constants';
import { useToast } from './ToastSystem';
import EPrescriptionModal from './EPrescriptionModal';
import SignatureCaptureOverlay from './SignatureCaptureOverlay';
import CryptoJS from 'crypto-js';
import { getTrustedTime } from '../services/timeService';
import { useClinicalNotePermissions } from '../hooks/useClinicalNotePermissions';
import { useDictation } from '../hooks/useDictation';


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
  sterilizationCycles?: SterilizationCycle[];
  onRequestProtocolOverride?: (rule: ClinicalProtocolRule, continuation: () => void) => void;
}

const Odontonotes: React.FC<OdontonotesProps> = ({ entries, onAddEntry, onUpdateEntry, onDeleteEntry, currentUser, readOnly, procedures, inventory = [], prefill, onClearPrefill, logAction, fieldSettings, patient, appointments = [], incidents = [], sterilizationCycles = [], onRequestProtocolOverride }) => {
  const toast = useToast();
  const isAdvancedInventory = fieldSettings?.features.inventoryComplexity === 'ADVANCED';
  
  const [toothNum, setToothNum] = useState<string>('');
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
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
  const [clinicalPearl, setClinicalPearl] = useState('');
  
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [requireSignOff, setRequireSignOff] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [pendingEntryData, setPendingEntryData] = useState<any>(null);

  const [showHardStopConsent, setShowHardStopConsent] = useState(false);
  const [hardStopText, setHardStopText] = useState('');
  const [hardStopChecked, setHardStopChecked] = useState(false);
    
  const [showWitnessModal, setShowWitnessModal] = useState(false);
  const [witnessPin, setWitnessPin] = useState('');
  const [pendingSealEntry, setPendingSealEntry] = useState<DentalChartEntry | null>(null);
  const [pendingSealTimestamp, setPendingSealTimestamp] = useState<string>('');
  
  const [showSurgicalWitness, setShowSurgicalWitness] = useState(false);
  const [surgicalWitnessPin, setSurgicalWitnessPin] = useState('');
  const [pendingSurgicalEntry, setPendingSurgicalEntry] = useState<any>(null);

  const [isBaseline, setIsBaseline] = useState(false);

  const { isRecording, toggleRecording } = useDictation({
    s: setSubjective,
    o: setObjective,
    a: setAssessment,
    p: setPlan,
  });

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

  const activeProcedureDef = useMemo(() => {
      return procedures.find(p => p.name === selectedProcedure);
  }, [selectedProcedure, procedures]);

  const { isLockedForAction, getLockReason } = useClinicalNotePermissions(
    currentUser,
    patient,
    activeAppointmentToday,
    incidents,
    isArchitect,
    activeProcedureDef
  );

  const isHighRiskProcedure = useMemo(() => {
    const highRiskCats = ['Surgery', 'Endodontics', 'Prosthodontics'];
    return highRiskCats.includes(activeProcedureDef?.category || '');
  }, [activeProcedureDef]);

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
    if (selectedProcedure && fieldSettings) {
        const proc = fieldSettings.procedures.find(p => p.name === selectedProcedure);
        if (proc) {
            const defaultPriceBook = fieldSettings.priceBooks?.find(pb => pb.isDefault) || fieldSettings.priceBooks?.[0];
            if (defaultPriceBook) {
                const priceEntry = fieldSettings.priceBookEntries?.find(pbe => pbe.procedureId === proc.id && pbe.priceBookId === defaultPriceBook.id);
                setCharge(priceEntry?.price.toString() || '0');
            } else {
                setCharge('0');
            }
        }
    }
  }, [selectedProcedure, fieldSettings]);

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

  const getHardStopText = (procedure: string): string => {
    const procLower = procedure.toLowerCase();
    if (procLower.includes('extraction') || procLower.includes('surgery')) return PDA_INFORMED_CONSENT_TEXTS.EXTRACTION;
    if (procLower.includes('root canal')) return PDA_INFORMED_CONSENT_TEXTS.ROOT_CANAL;
    if (procLower.includes('crown') || procLower.includes('bridge') || procLower.includes('veneer')) return PDA_INFORMED_CONSENT_TEXTS.CROWNS_BRIDGES;
    if (procLower.includes('denture')) return PDA_INFORMED_CONSENT_TEXTS.DENTURES;
    if (procLower.includes('scaling') || procLower.includes('perio')) return PDA_INFORMED_CONSENT_TEXTS.PERIODONTAL;
    if (procLower.includes('filling') || procLower.includes('restoration')) return PDA_INFORMED_CONSENT_TEXTS.FILLINGS;
    return '';
  };

  const applyQuickFill = (fill: ClinicalMacro) => {
      const s = fill.s || ''; const o = fill.o || ''; const a = fill.a || ''; const p = fill.p || '';
      setSubjective(s); setObjective(o); setAssessment(a); setPlan(p);
      macroSnapshotRef.current = (s + o + a + p).trim();
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result as string;
              setCapturedPhotos(prev => [...prev, base64String]);
              toast.info("Clinical imaging verified.");
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
      if (logAction) logAction('SEAL_RECORD', 'ClinicalNote', entry.id, `Digitally Sealed forensic record.`);
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
      setSubjective(''); setObjective(''); setAssessment(''); setPlan(''); setToothNum(''); setSelectedProcedure(''); setSelectedPlanId(''); setCharge(''); setSelectedBatchId(''); setSelectedInstrumentSetId(''); setVarianceCount(0); setSelectedResourceId(''); setSelectedCycleId(''); setCapturedPhotos([]); setClinicalPearl('');
      macroSnapshotRef.current = ''; setEditingId(null); setRequireSignOff(false); setHardStopChecked(false);
      setIsBaseline(false);
  };

  const handleEdit = (entry: DentalChartEntry) => {
      setEditingId(entry.id); setToothNum(entry.toothNumber?.toString() || ''); setSelectedProcedure(entry.procedure || '');
      setSubjective(entry.subjective || ''); setObjective(entry.objective || ''); setAssessment(entry.assessment || ''); setPlan(entry.plan || '');
      setCharge(entry.price?.toString() || ''); setSelectedBatchId(entry.materialBatchId || ''); setVarianceCount(entry.materialVariance || 0); setSelectedResourceId(entry.resourceId || '');
      setSelectedPlanId(entry.planId || '');
      setIsBaseline(entry.isBaseline || false);
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
    if (isLockedForAction || !pearlIsValid || !isAuthenticNarrative || (isTraceabilityRequired && !isSetSterile)) return;
    const stopText = getHardStopText(selectedProcedure);
    if (stopText && !hardStopChecked) {
        setHardStopText(stopText);
        setShowHardStopConsent(true);
        return;
    }
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
        author: currentUser.name,
        planId: selectedPlanId || undefined,
        isBaseline: isBaseline,
    };
    if (requireSignOff) { setPendingEntryData(entryData); setShowSignaturePad(true); return; }
    if (isSurgicalProcedure) { setPendingSurgicalEntry(entryData); setShowSurgicalWitness(true); return; }
    commitEntry(entryData);
  };

  const commitEntry = (data: any) => {
    if (editingId) {
        const originalEntry = entries.find(e => e.id === editingId);
        if (originalEntry) {
            if (isLocked(originalEntry)) { onAddEntry({ ...data, id: `dc_ammend_${Date.now()}`, originalNoteId: originalEntry.id, notes: `[AMENDMENT]\n${data.notes}` }); } 
            else onUpdateEntry(data);
            setEditingId(null);
        }
    } else { onAddEntry(data); }
    resetForm();
  };

  const handlePatientSignatureCaptured = (sig: string, hash: string) => {
    const updatedData = { ...pendingEntryData, patientSignature: sig, patientSignatureTimestamp: new Date().toISOString() };
    setShowSignaturePad(false);
    if (isSurgicalProcedure) { setPendingSurgicalEntry(updatedData); setShowSurgicalWitness(true); } 
    else { commitEntry(updatedData); }
  };

  const SoapField = ({ label, value, onChange, field, placeholder, disabled, watermark }: { label: string, value: string, onChange: (v: string) => void, field: 's'|'o'|'a'|'p', placeholder: string, disabled?: boolean, watermark?: string }) => (
      <div className="relative group/field">
          <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none ml-1">{label}</label>
              {!disabled && <button type="button" onClick={() => toggleRecording(field)} className={`p-1.5 rounded-lg transition-all ${isRecording === field ? 'bg-red-600 text-red-600 animate-pulse' : 'text-slate-300 hover:text-teal-600 opacity-0 group-hover/field:opacity-100'}`} aria-label={`Voice input for ${label}`}>{isRecording === field ? <MicOff size={12}/> : <Mic size={12}/>}</button>}
          </div>
          <div className="relative">
              <textarea className={`w-full p-5 border-2 rounded-[2rem] text-sm h-28 bg-white outline-none transition-all duration-300 ${disabled ? 'bg-slate-50 opacity-40 border-slate-100' : 'border-slate-100 focus:border-teal-500 shadow-inner focus:shadow-teal-900/5'}`} value={value} onChange={e => onChange(e.target.value)} placeholder={disabled ? '' : placeholder} disabled={disabled} aria-label={label} />
              {disabled && <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-[2rem] bg-white/5 backdrop-blur-[1px]"><div className="flex flex-col items-center gap-2"><Lock size={24} className="text-slate-300"/><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{watermark || 'FORENSIC LOCK'}</span></div></div>}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-[3rem] border border-slate-100 overflow-hidden shadow-inner relative" role="region" aria-label="Clinical Notes and Audit Trail">
      
      {isLockedForAction && (
          <div className="absolute inset-0 z-[60] bg-slate-900/10 backdrop-blur-[6px] flex items-center justify-center p-8 text-center animate-in fade-in" role="alert">
              <div className="bg-white p-12 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] border-4 border-red-500 max-w-sm flex flex-col items-center gap-8 animate-in zoom-in-95">
                  <div className="bg-red-50 p-6 rounded-[2.5rem] ring-[12px] ring-red-500/5 shadow-inner"><ShieldAlert size={64} className="text-red-600 animate-bounce" /></div>
                  <h3 className="text-2xl font-black uppercase text-red-900 tracking-tighter leading-none">Registry Lock</h3>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                      {getLockReason()}
                  </p>
              </div>
          </div>
      )}
      
      {!readOnly && (
          <div className={`border-b border-slate-100 p-10 ${editingId ? 'bg-amber-50/10' : 'bg-white'} overflow-y-auto max-h-[85%] no-scrollbar transition-all duration-500`}>
             <div className="flex justify-between items-center mb-8">
                 <div className="flex flex-col">
                    <h4 className="text-2xl font-black text-slate-800 flex items-center gap-4 uppercase tracking-tighter">{editingId ? <Undo size={32} className="text-amber-600"/> : <Edit3 size={32} className="text-teal-600"/>} {editingId ? 'Forensic Amendment' : 'Clinical Protocol'}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">RA 8792 Electronic Evidence • Section 17 Verified</p>
                 </div>
                 <div className="flex gap-3">
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200 gap-1" role="group">
                        {(fieldSettings?.smartPhrases || []).map(q => <button key={q.id} type="button" onClick={() => applyQuickFill(q)} className="px-4 py-2 bg-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-100 hover:border-teal-500 transition-all shadow-sm">{q.label}</button>)}
                    </div>
                    <button type="button" onClick={() => photoInputRef.current?.click()} className="px-6 py-3 bg-lilac-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-lilac-600/30 transition-all hover:scale-105"><Camera size={18}/> Imaging</button>
                    <button type="button" onClick={() => setIsRxModalOpen(true)} className="px-6 py-3 bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-teal-600/30 transition-all hover:scale-105"><Pill size={18}/> Rx</button>
                    {editingId && <button onClick={() => setEditingId(null)} className="px-5 py-3 bg-slate-100 rounded-2xl text-slate-400 font-black uppercase tracking-widest text-[10px]">Cancel</button>}
                 </div>
             </div>

             <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                    <div className="md:col-span-2"><label className="label text-[10px]">Tooth Unit</label><input type="text" value={toothNum} onChange={e => setToothNum(e.target.value)} className="input text-center text-xl font-black" placeholder="--" /></div>
                    <div className="md:col-span-4"><label className="label text-[10px]">Procedure Identification</label><select value={selectedProcedure} onChange={e => setSelectedProcedure(e.target.value)} className="input text-xs font-black uppercase tracking-tight">{filteredProcedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
                    <div className="md:col-span-3"><label className="label text-[10px]">Operating Unit</label><select value={selectedResourceId} onChange={e => setSelectedResourceId(e.target.value)} className="input text-xs font-black uppercase tracking-tight"><option value="">- AREA SELECT -</option>{fieldSettings?.resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                    <div className="md:col-span-3">
                        <label className="label text-[10px]">Registry Value (₱)</label>
                        <input type="text" value={`₱ ${parseFloat(charge).toLocaleString()}`} readOnly className="input font-black text-xl text-teal-800 bg-slate-50 border-slate-200" />
                    </div>
                    <div className="md:col-span-12">
                        <label className="label text-[10px] flex items-center gap-2"><Link size={14}/> Link to Strategy</label>
                        <select value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)} className="input text-xs font-black uppercase tracking-tight">
                            <option value="">- No Link / Standalone -</option>
                            {patient?.treatmentPlans?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                </div>

                <SoapField label="Subjective Narrative" value={subjective} onChange={setSubjective} field="s" placeholder="Patient reporting..." />
                <SoapField label="Objective Finding" value={objective} onChange={setObjective} field="o" placeholder="Visual observation..." />
                <SoapField label="Clinical Assessment" value={assessment} onChange={setAssessment} field="a" placeholder="Diagnostic result..." />
                <SoapField label="Execution Plan" value={plan} onChange={setPlan} field="p" placeholder="Procedural steps..." />

                <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center gap-3 mb-2 ml-1"><Sparkles size={18} className="text-teal-600"/><span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Forensic Identity Anchor (Mandatory)</span></div>
                    <textarea value={clinicalPearl} onChange={e => setClinicalPearl(e.target.value)} className={`w-full p-6 border-4 rounded-[2.5rem] text-sm h-24 outline-none transition-all duration-500 shadow-inner ${pearlIsValid ? 'bg-white border-teal-50 focus:border-teal-500' : 'bg-red-50 border-red-50 focus:border-red-500'}`} placeholder="Record a unique detail about this session to prove temporal presence..." />
                </div>

                {isAdvancedInventory && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 shadow-sm">
                            <label className="label text-[10px] flex items-center gap-2"><PackageCheck size={16}/> Material Traceability</label>
                            <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} className="input text-[10px] font-black uppercase">{inventory.map(item => <option key={item.id} value={item.id}>{item.name} (QTY: {item.quantity})</option>)}</select>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 shadow-sm">
                            <label className="label text-[10px] flex items-center gap-2"><ShieldCheck size={16}/> Sterile Protocol Set</label>
                            <select value={selectedInstrumentSetId} onChange={e => setSelectedInstrumentSetId(e.target.value)} className={`input text-[10px] font-black uppercase ${selectedInstrumentSetId && !isSetSterile ? 'border-red-500 bg-red-50 text-red-900 animate-pulse' : ''}`}><option value="">- SELECT STERILE LOAD -</option>{fieldSettings?.instrumentSets?.map(s => <option key={s.id} value={s.id}>{s.name} ({s.status})</option>)}</select>
                        </div>
                    </div>
                )}

                <div className="md:col-span-2 flex justify-between items-center bg-teal-950 p-6 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-900 to-transparent pointer-events-none" />
                    <div className="flex gap-10 items-center relative z-10">
                        <div className="flex flex-col"><span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Forensic Score</span><span className={`text-2xl font-black ${isAuthenticNarrative ? 'text-white' : 'text-red-400'}`}>{uniquenessScore}%</span></div>
                        <label className="flex items-center gap-4 cursor-pointer group">
                          <input type="checkbox" checked={isBaseline} onChange={e => setIsBaseline(e.target.checked)} className="w-8 h-8 accent-amber-400 rounded-xl shadow-lg" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-white tracking-[0.2em] group-hover:text-amber-400 transition-colors">Set as Baseline</span>
                            <span className="text-[8px] font-bold text-teal-500 uppercase tracking-tighter">Initial patient state record</span>
                          </div>
                        </label>
                        <label className="flex items-center gap-4 cursor-pointer group">
                          <input type="checkbox" checked={requireSignOff} onChange={e => setRequireSignOff(e.target.checked)} className="w-8 h-8 accent-lilac-500 rounded-xl shadow-lg" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-white tracking-[0.2em] group-hover:text-lilac-400 transition-colors">Patient Seal Required</span>
                            <span className="text-[8px] font-bold text-teal-500 uppercase tracking-tighter">Temporal Non-Repudiation active</span>
                          </div>
                        </label>
                    </div>
                    <button type="submit" disabled={!pearlIsValid || !isAuthenticNarrative || (isTraceabilityRequired && !isSetSterile)} className={`px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl transition-all flex items-center gap-4 relative z-10 ${pearlIsValid && isAuthenticNarrative ? 'bg-teal-500 text-white shadow-teal-500/20 hover:scale-105 active:scale-95' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}><CheckCircle2 size={24}/> {requireSignOff ? 'Seal & Capture' : 'Commit Record'}</button>
                </div>
             </form>
          </div>
      )}

      <div className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar bg-slate-50/50">
          <div className="flex items-center gap-4 mb-8 ml-2"><History size={24} className="text-slate-300"/><h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Chronological Registry</h4></div>
          {[...entries].reverse().map(entry => (
              <div key={entry.id} className={`p-8 rounded-[3rem] border-2 transition-all duration-700 relative overflow-hidden group ${entry.sealedHash ? 'bg-white border-slate-50 shadow-sm' : 'bg-white border-teal-100 border-dashed shadow-2xl shadow-teal-900/10'}`}>
                  {entry.isPendingSupervision && <div className="absolute top-0 left-0 right-0 bg-lilac-600 text-white text-[9px] font-black uppercase text-center py-2 tracking-[0.4em] z-10 shadow-lg animate-pulse">Awaiting Supervisory Seal (RA 9484)</div>}
                  <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="flex items-center gap-6">
                         <div className={`p-4 rounded-[1.5rem] shadow-lg transition-transform group-hover:scale-110 ${entry.sealedHash ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600 animate-pulse'}`}>{entry.sealedHash ? <ShieldCheck size={32}/> : <Clock size={32}/>}</div>
                         <div>
                            <h5 className="font-black text-slate-800 uppercase tracking-tighter text-xl leading-none">{entry.procedure} <span className="text-teal-600 mx-1">/</span> #{entry.toothNumber}</h5>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">ID: {entry.author} • {formatDate(entry.date)}</p>
                         </div>
                      </div>
                      <div className="flex gap-3 items-center">
                         {entry.patientSignature && <div className="flex items-center gap-2 px-4 py-2 bg-lilac-50 text-lilac-700 rounded-full text-[10px] font-black uppercase border border-lilac-100 tracking-widest"><Check size={16}/> Signed</div>}
                         {!entry.sealedHash && !readOnly && currentUser.name === entry.author && <button onClick={() => handleEdit(entry)} className="p-3 bg-slate-50 text-slate-400 hover:text-teal-600 hover:bg-white hover:shadow-lg rounded-xl transition-all" aria-label="Edit"><Edit3 size={20}/></button>}
                         {entry.isPendingSupervision && !readOnly && currentUser.role === UserRole.DENTIST && <button onClick={() => handleSuperviseSeal(entry)} className="px-6 py-3 bg-lilac-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-lilac-600/30 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"><Verified size={18}/> Verify</button>}
                         {!entry.sealedHash && !readOnly && (currentUser.name === entry.author || isArchitect) && <button onClick={() => handleSeal(entry)} className="px-6 py-3 bg-teal-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-teal-950/40 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"><Lock size={18}/> Seal</button>}
                      </div>
                  </div>
                  <div className="bg-slate-50/50 p-6 rounded-[2rem] border-2 border-white shadow-inner relative overflow-hidden group-hover:bg-white transition-colors duration-500">
                      <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-bold tracking-tight">{entry.notes}</p>
                  </div>
                  {entry.sealedHash && (
                      <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-3 text-[9px] font-mono text-slate-300 tracking-tighter"><Fingerprint size={14}/> {entry.sealedHash.toUpperCase()}</div>
                          <div className="flex items-center gap-2 text-[10px] font-black text-teal-600 uppercase tracking-[0.3em]"><ShieldCheck size={16}/> Forensic Trust</div>
                      </div>
                  )}
              </div>
          ))}
          {entries.length === 0 && <div className="py-24 text-center text-slate-300 font-black uppercase tracking-[0.5em] italic">Archive Registry Clean</div>}
      </div>

      <input type="file" ref={photoInputRef} onChange={handlePhotoCapture} accept="image/*" className="hidden" />

      {isRxModalOpen && patient && fieldSettings && (
          <EPrescriptionModal isOpen={isRxModalOpen} onClose={() => setIsRxModalOpen(false)} patient={patient} fieldSettings={fieldSettings} currentUser={currentUser} logAction={logAction} />
      )}

      {showWitnessModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border-4 border-amber-400 animate-in zoom-in-95">
                  <div className="flex items-center gap-4 text-amber-700 mb-8"><ShieldQuestion size={48} className="animate-bounce"/><h3 className="text-3xl font-black uppercase tracking-tighter">Temporal Seal Required</h3></div>
                  <p className="text-xs text-slate-500 font-black uppercase tracking-widest leading-relaxed mb-8 text-center">Trusted network clock unavailable. Staff witness required to verify clinical time.</p>
                  <input type="password" value={witnessPin} onChange={e => setWitnessPin(e.target.value)} placeholder="Witness PIN" className="w-full p-6 text-center text-4xl tracking-[0.8em] border-4 border-slate-50 rounded-[2.5rem] focus:border-amber-400 outline-none font-black bg-slate-50 mb-8" />
                  <div className="flex gap-3"><button onClick={() => setShowWitnessModal(false)} className="flex-1 py-5 font-black uppercase text-xs text-slate-400 tracking-widest">Cancel</button><button onClick={handleWitnessVerify} className="flex-[2] py-5 bg-amber-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl">Verify & Seal</button></div>
              </div>
          </div>
      )}

      <SignatureCaptureOverlay 
        isOpen={showSignaturePad}
        onClose={() => setShowSignaturePad(false)}
        onSave={handlePatientSignatureCaptured}
        title="Clinical Non-Repudiation"
        instruction={`Acknowledge that procedure "${pendingEntryData?.procedure}" has been correctly performed and recorded.`}
        themeColor="lilac"
      />
    </div>
  );
};

export default Odontonotes;
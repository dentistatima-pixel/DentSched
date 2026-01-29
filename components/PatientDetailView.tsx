
import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
// FIX: Add PerioMeasurement to imports
import { Patient, Appointment, User, FieldSettings, AuditLogEntry, ClinicalIncident, AuthorityLevel, TreatmentPlanStatus, ClearanceRequest, Referral, GovernanceTrack, ConsentCategory, PatientFile, SterilizationCycle, DentalChartEntry, ClinicalProtocolRule, StockItem, TreatmentPlan, AppointmentStatus, LedgerEntry, UserRole, PerioMeasurement } from '../types';
// FIX: Add UserSearch to lucide-react imports for PatientPlaceholder
// Fix: Add missing 'Droplet' icon import from lucide-react.
import { ShieldAlert, Phone, Mail, MapPin, Edit, Trash2, CalendarPlus, FileUp, Shield, BarChart, History, FileText, DollarSign, Stethoscope, Briefcase, BookUser, Baby, AlertCircle, Receipt, ClipboardList, User as UserIcon, X, ChevronRight, Sparkles, Heart, Activity, CheckCircle, ImageIcon, Plus, Zap, Camera, Search, UserCheck, ArrowLeft, ShieldCheck, Send, ClipboardCheck, UserSearch, Weight, Users, FileSignature, XCircle, FileEdit, CloudOff, Droplet, Calendar, MessageSquare } from 'lucide-react';
import { formatDate, generateUid } from '../constants';
import ClearanceModal from './ClearanceModal';
import { useToast } from './ToastSystem';
import PhilHealthCF4Generator from './PhilHealthCF4Generator';
import { summarizePatient } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { useAuthorization } from '../hooks/useAuthorization';
import { useRouter, useNavigate } from '../contexts/RouterContext';
import { usePatient } from '../contexts/PatientContext';
import { useAppContext } from '../contexts/AppContext';
import { useModal } from '../contexts/ModalContext';
import AuditTrailViewer from './AuditTrailViewer';
import CommunicationLog from './CommunicationLog';


// Lazy load heavy components
const Odontonotes = React.lazy(() => import('./Odontonotes').then(module => ({ default: module.Odontonotes })));
const Odontogram = React.lazy(() => import('./Odontogram'));
const PerioChart = React.lazy(() => import('./PerioChart'));
const TreatmentPlanModule = React.lazy(() => import('./TreatmentPlanModule'));
const PatientLedger = React.lazy(() => import('./PatientLedger'));
const PatientAppointmentsView = React.lazy(() => import('./PatientAppointmentsView'));


interface PatientDetailViewProps {
  patient: Patient | null;
  appointments: Appointment[];
  staff: User[];
  stock?: StockItem[];
  currentUser: User;
  onQuickUpdatePatient: (patient: Partial<Patient>) => void;
  onBookAppointment: (patientId: string) => void;
  onEditPatient: (patient: Patient) => void; 
  fieldSettings?: FieldSettings; 
  logAction: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
  incidents?: ClinicalIncident[];
  onSaveIncident?: (incident: Omit<ClinicalIncident, 'id'>) => void;
  referrals?: Referral[];
  onSaveReferral?: (referral: Omit<Referral, 'id'>) => void;
  onToggleTimeline?: () => void;
  onBack?: () => void;
  governanceTrack: GovernanceTrack;
  onOpenRevocationModal: (patient: Patient, category: ConsentCategory) => void;
  readOnly?: boolean;
  sterilizationCycles?: SterilizationCycle[];
  onUpdateSettings?: (settings: FieldSettings) => void;
  onRequestProtocolOverride: (rule: ClinicalProtocolRule, continuation: () => void) => void;
  onDeleteClinicalNote?: (patientId: string, noteId: string) => void;
  onInitiateFinancialConsent: (plan: TreatmentPlan) => void;
  onSupervisorySeal?: (note: DentalChartEntry) => void;
  onRecordPaymentWithReceipt: (patientId: string, paymentDetails: { description: string; date: string; amount: number; orNumber: string; }) => Promise<void>;
  onOpenPostOpHandover: (appointment: Appointment) => void;
  auditLog: AuditLogEntry[];
}

const TabLoader: React.FC = () => (
    <div className="flex items-center justify-center h-96 w-full bg-slate-50/50 rounded-2xl">
        <svg className="animate-spin h-8 w-8 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

const InfoItem: React.FC<{ label: string; value?: string | number | null | string[]; icon?: React.ElementType, isFlag?: boolean, isSpecial?: boolean }> = ({ label, value, icon: Icon, isFlag, isSpecial }) => {
    const displayValue = Array.isArray(value) && value.length > 0 ? value.join(', ') : Array.isArray(value) ? 'None' : (value || '---');
    return (
        <div className={`p-4 rounded-2xl flex items-start gap-4 ${
            isFlag ? 'bg-red-50 border-2 border-red-200' : 
            isSpecial ? 'bg-amber-50 border-2 border-amber-200' : 
            'bg-white border border-slate-100 shadow-sm'
        }`}>
            {Icon && <Icon size={18} className={`mt-1 shrink-0 ${
                isFlag ? 'text-red-600' : 
                isSpecial ? 'text-amber-600' : 
                'text-slate-400'
            }`} />}
            <div className="flex-1">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
                <div className={`text-sm font-bold mt-1 ${
                    isFlag ? 'text-red-800' : 
                    isSpecial ? 'text-amber-800' : 
                    'text-slate-800'
                }`}>{displayValue}</div>
            </div>
        </div>
    );
};

const DiagnosticGallery: React.FC<{
    patient: Patient,
    onQuickUpdatePatient: (p: Partial<Patient>) => void
}> = ({ patient, onQuickUpdatePatient }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [editingFile, setEditingFile] = useState<PatientFile | null>(null);
    
    const [primaryImageId, setPrimaryImageId] = useState<string | null>(null);
    const toast = useToast();

    const images = useMemo(() => 
        (patient.files?.filter(f => f.category === 'X-Ray') || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [patient.files]);

    useEffect(() => {
        if (images.length > 0 && !primaryImageId) {
            setPrimaryImageId(images[0].id);
        } else if (images.length > 0 && primaryImageId && !images.find(img => img.id === primaryImageId)) {
            // If the selected image was deleted, select the new first one
            setPrimaryImageId(images[0].id);
        } else if (images.length === 0) {
            setPrimaryImageId(null);
        }
    }, [images, primaryImageId]);

    const primaryImage = useMemo(() => images.find(img => img.id === primaryImageId), [images, primaryImageId]);

    const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        toast.info(`Uploading "${file.name}"...`);
        const base64String = await blobToBase64(file);
        
        const newFile: PatientFile = { 
            id: `file_${Date.now()}_${Math.random().toString(16).slice(2)}`, 
            name: file.name, 
            category: 'X-Ray', 
            url: base64String, 
            date: new Date().toISOString().split('T')[0] 
        };
        
        onQuickUpdatePatient({ id: patient.id, files: [...(patient.files || []), newFile] });
        setPrimaryImageId(newFile.id);
        toast.success(`"${file.name}" uploaded successfully.`);

        if(e.target) {
            e.target.value = '';
        }
    };

    const handleSaveEdit = (updatedFile: PatientFile) => {
        const updatedFiles = patient.files?.map(f => f.id === updatedFile.id ? updatedFile : f) || [];
        onQuickUpdatePatient({ id: patient.id, files: updatedFiles });
        setEditingFile(null);
        toast.success("Image details updated.");
    };
    
    return (
        <div className="animate-in fade-in duration-500 h-full flex flex-col gap-6">
            <div className="bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm shrink-0">
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    <button onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 w-32 h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-colors">
                        <Camera size={24}/>
                        <span className="text-xs font-bold mt-1">Upload</span>
                    </button>
                    {images.map(img => (
                        <div key={img.id} onClick={() => setPrimaryImageId(img.id)} className="flex-shrink-0 w-32 h-24 rounded-xl relative group overflow-hidden cursor-pointer border-4" style={{borderColor: primaryImageId === img.id ? '#14b8a6' : 'transparent'}}>
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover"/>
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                <button onClick={(e) => { e.stopPropagation(); setLightboxImage(img.url); }} className="p-2 bg-black/50 text-white rounded-full text-xs" title="View"><Search size={14}/></button>
                                <button onClick={(e) => { e.stopPropagation(); setEditingFile(img); }} className="p-2 bg-black/50 text-white rounded-full text-xs" title="Edit"><FileEdit size={14}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 bg-slate-900 rounded-[2.5rem] flex items-center justify-center p-4 relative">
                {primaryImage ? (
                    <>
                        <img src={primaryImage.url} alt={primaryImage.name} className="max-h-full max-w-full object-contain"/>
                        <div className="absolute top-4 right-4 flex gap-2">
                            <button onClick={() => setLightboxImage(primaryImage.url)} className="p-2 bg-black/30 text-white rounded-full"><Search/></button>
                            <button onClick={() => setEditingFile(primaryImage)} className="p-2 bg-black/30 text-white rounded-full"><FileEdit/></button>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 bg-black/50 p-4 rounded-xl backdrop-blur-sm">
                            <p className="font-bold text-white">{primaryImage.name}</p>
                            <p className="text-xs text-slate-300">{formatDate(primaryImage.date)}</p>
                            {primaryImage.notes && <p className="text-xs text-slate-200 mt-2 italic">"{primaryImage.notes}"</p>}
                        </div>
                    </>
                ) : (
                    <div className="text-center text-slate-500 flex flex-col items-center justify-center">
                        <ImageIcon size={48} className="mx-auto mb-4"/>
                        <h3 className="font-bold">Imaging Hub</h3>
                        <p className="text-sm mt-1 mb-6">Upload and manage diagnostic images.</p>
                         <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-3 bg-teal-600/20 text-teal-300 rounded-xl hover:bg-teal-600/40 transition-colors">
                            <Camera size={16}/> Upload First Image
                        </button>
                    </div>
                )}
            </div>
            
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

            {lightboxImage && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
                    <img src={lightboxImage} alt="Radiograph" className="max-w-full max-h-full rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
                    <button onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }} className="absolute top-4 right-4 text-white p-2 bg-black/30 rounded-full"><X/></button>
                </div>
            )}

            {editingFile && (
                <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
                        <h3 className="font-bold">Edit Image Details</h3>
                        <div>
                            <label className="text-xs font-bold">Label</label>
                            <input type="text" value={editingFile.name} onChange={e => setEditingFile({...editingFile, name: e.target.value})} className="input"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold">Notes</label>
                            <textarea value={editingFile.notes || ''} onChange={e => setEditingFile({...editingFile, notes: e.target.value})} className="input h-24"/>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingFile(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold">Cancel</button>
                            <button onClick={() => handleSaveEdit(editingFile)} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// FIX: Export PatientPlaceholder component
export const PatientPlaceholder: React.FC = () => {
    return (
        <div className="h-full flex flex-col items-center justify-center bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 text-center">
            <UserSearch size={64} className="text-slate-200 mb-6" />
            <h3 className="text-2xl font-black text-slate-400">Select a Patient</h3>
            <p className="text-slate-500 mt-2 max-w-sm">Choose a patient from the registry on the left to view their detailed clinical records.</p>
        </div>
    );
};

interface ComplianceTabProps {
    patient: Patient;
    onOpenRevocationModal: (patient: Patient, category: ConsentCategory) => void;
}

const ComplianceTab: React.FC<ComplianceTabProps> = ({ patient, onOpenRevocationModal }) => {
    const getStatus = (consentFlag?: boolean) => {
        return consentFlag ? 
            <span className="font-bold text-teal-700 flex items-center gap-1"><CheckCircle size={12}/> Given</span> : 
            <span className="font-bold text-red-700 flex items-center gap-1"><XCircle size={12}/> Not Given / Revoked</span>;
    };
    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4 flex items-center gap-3">
                    <Shield size={18} className="text-teal-600"/>
                    Data Privacy Act (RA 10173) Consent Registry
                </h4>
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-slate-700">Clinical Processing Consent</p>
                            <p className="text-xs text-slate-500">Status: {getStatus(patient.dpaConsent)}</p>
                        </div>
                        {patient.dpaConsent && <button onClick={() => onOpenRevocationModal(patient, 'Clinical')} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-xs font-black uppercase hover:bg-red-200 transition-colors">Revoke</button>}
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-slate-700">Marketing Communications Consent</p>
                            <p className="text-xs text-slate-500">Status: {getStatus(patient.marketingConsent)}</p>
                        </div>
                        {patient.marketingConsent && <button onClick={() => onOpenRevocationModal(patient, 'Marketing')} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-xs font-black uppercase hover:bg-red-200 transition-colors">Revoke</button>}
                    </div>
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-slate-700">Third-Party Disclosure Consent</p>
                            <p className="text-xs text-slate-500">Status: {getStatus(patient.thirdPartyDisclosureConsent)}</p>
                        </div>
                        {patient.thirdPartyDisclosureConsent && <button onClick={() => onOpenRevocationModal(patient, 'ThirdParty')} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-xs font-black uppercase hover:bg-red-200 transition-colors">Revoke</button>}
                    </div>
                </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm mt-8">
                <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4 flex items-center gap-3">
                    <FileSignature size={18} className="text-lilac-600"/>
                    Other Affirmations
                </h4>
                 <div className="space-y-4">
                    <InfoItem label="Treatment Authorization (General)" value={patient.clinicalMediaConsent ? "Affirmed" : "Not Given"} icon={patient.clinicalMediaConsent ? CheckCircle : AlertCircle} isFlag={!patient.clinicalMediaConsent} />
                    <InfoItem label="Third Party Attestation" value={patient.thirdPartyAttestation ? "Affirmed" : "Not Given"} icon={patient.thirdPartyAttestation ? CheckCircle : AlertCircle} isFlag={!patient.thirdPartyAttestation} />
                    {patient.registrationSignatureTimestamp && <InfoItem label="Registration Signature Date" value={new Date(patient.registrationSignatureTimestamp).toLocaleString()} icon={History} />}
                </div>
            </div>
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm mt-8">
                <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4 flex items-center gap-3">
                    <History size={18} className="text-teal-600"/>
                    Consent History Log
                </h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs uppercase text-slate-400">
                            <tr>
                                <th className="p-2 text-left">Timestamp</th>
                                <th className="p-2 text-left">Type</th>
                                <th className="p-2 text-left">Action</th>
                                <th className="p-2 text-left">Forensic Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(patient.consentHistory || []).map((log, i) => (
                                <tr key={i} className="border-t">
                                    <td className="p-2 font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="p-2 font-bold">{log.consentType}</td>
                                    <td className={`p-2 font-bold ${log.granted ? 'text-teal-600' : 'text-red-600'}`}>
                                        {log.granted ? 'Granted' : 'Revoked'}
                                    </td>
                                    <td className="p-2 font-mono text-xs text-slate-500" title={log.userAgent}>
                                        IP: {log.ipAddress} | Hash: {log.witnessHash?.substring(0,8)}...
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {(!patient.consentHistory || patient.consentHistory.length === 0) && (
                        <p className="text-center text-xs text-slate-400 italic py-8">No granular consent history logged.</p>
                     )}
                </div>
            </div>
        </div>
    );
};

const MedicalHistoryAnswers: React.FC<{ patient: Patient }> = ({ patient }) => {
    if (!patient.registryAnswers && !patient.medicalTreatmentDetails && !patient.seriousIllnessDetails && !patient.lastHospitalizationDetails) {
        return null;
    }

    const questions = {
        ...patient.registryAnswers
    };

    // Filter out detail/date fields to be handled with their parent question
    const mainQuestions = Object.keys(questions).filter(q => !q.endsWith('_details') && !q.endsWith('_date'));

    return (
        <div className="md:col-span-12">
            <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-4 px-4">Medical History Questionnaire</h4>
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mainQuestions.map(q => (
                    <div key={q} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <p className="font-bold text-slate-700 text-sm">{q.replace('*', '')}</p>
                        <p className={`font-black text-lg mt-1 ${questions[q] === 'Yes' ? 'text-red-700' : 'text-teal-700'}`}>{questions[q]}</p>
                        {questions[q] === 'Yes' && questions[`${q}_details`] && (
                            <p className="text-xs mt-2 p-3 bg-white rounded-lg border border-slate-200 text-slate-600 font-medium"><strong>Details:</strong> {questions[`${q}_details`]}</p>
                        )}
                        {questions[q] === 'Yes' && questions[`${q}_date`] && (
                            <p className="text-xs mt-2 p-3 bg-white rounded-lg border border-slate-200 text-slate-600 font-medium"><strong>Date:</strong> {formatDate(questions[`${q}_date`])}</p>
                        )}
                    </div>
                ))}
                {patient.medicalTreatmentDetails && <InfoItem label="Details of Medical Treatment" value={patient.medicalTreatmentDetails} icon={FileText} />}
                {patient.seriousIllnessDetails && <InfoItem label="Details of Serious Illness/Operation" value={patient.seriousIllnessDetails} icon={FileText} />}
                {patient.lastHospitalizationDetails && <InfoItem label="Details of Last Hospitalization" value={`${patient.lastHospitalizationDetails} on ${formatDate(patient.lastHospitalizationDate)}`} icon={FileText} />}
            </div>
        </div>
    );
};


const PatientDetailView: React.FC<PatientDetailViewProps> = ({ 
    patient, appointments, staff, stock = [], currentUser, onQuickUpdatePatient, onBookAppointment, onEditPatient, 
    fieldSettings, logAction, incidents = [], onSaveIncident, referrals = [], onSaveReferral, onBack,
    governanceTrack, onOpenRevocationModal, readOnly, sterilizationCycles, onUpdateSettings,
    onRequestProtocolOverride, onDeleteClinicalNote, onInitiateFinancialConsent, onSupervisorySeal,
    onRecordPaymentWithReceipt, onOpenPostOpHandover, auditLog
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [noteToAutoEdit, setNoteToAutoEdit] = useState<DentalChartEntry | null>(null);
  const toast = useToast();
  const { can } = useAuthorization();
  const navigate = useNavigate();
  const { patients } = usePatient();
  const { setFullScreenView } = useAppContext();
  const { showModal } = useModal();

  if (!patient || !fieldSettings) {
    return <PatientPlaceholder />;
  }
  
  const getCriticalFlags = (p: Patient) => {
    if (!p || !fieldSettings) return [];
    const flags: { type: string; value: string }[] = [];
    const criticalRegistry = fieldSettings?.criticalRiskRegistry || [];
    
    (p.medicalConditions || []).forEach(condition => {
        if (criticalRegistry.includes(condition)) {
            flags.push({ type: 'Condition', value: condition });
        }
    });

    (p.allergies || []).forEach(allergy => {
        if (criticalRegistry.includes(allergy)) {
            flags.push({ type: 'Allergy', value: allergy });
        }
    });
    
    if (p.registryAnswers) {
        Object.entries(p.registryAnswers).forEach(([question, answer]) => {
            if (answer === 'Yes' && criticalRegistry.includes(question)) {
                const simpleLabel = question.replace(/\?.*$/, '').replace(/\(.*\)/, '').trim();
                flags.push({ type: 'Alert', value: simpleLabel });
            }
        });
    }

    return flags;
  };
  
  const headerStyle = useMemo(() => {
    const flags = getCriticalFlags(patient);
    if (flags.length > 0) return { bg: 'bg-red-600', text: 'text-white', sub: 'text-red-200' };
    if (patient.isPwd) return { bg: 'bg-amber-500', text: 'text-white', sub: 'text-amber-100' };
    if ((patient.age || 18) < 18) return { bg: 'bg-blue-500', text: 'text-white', sub: 'text-blue-200' };
    return { bg: 'bg-teal-700', text: 'text-white', sub: 'text-teal-200' };
  }, [patient]);

  const tabs = [
      { id: 'summary', label: 'Details', icon: UserIcon },
      { id: 'appointments', label: 'Appointments', icon: Calendar },
      { id: 'comms', label: 'Comms', icon: MessageSquare },
      { id: 'notes', label: 'Notes', icon: ClipboardList },
      { id: 'odontogram', label: 'Chart', icon: Stethoscope },
      { id: 'perio', label: 'Perio', icon: Activity },
      { id: 'plans', label: 'Strategy', icon: Briefcase },
      { id: 'ledger', label: 'Ledger', icon: DollarSign },
      { id: 'images', label: 'Imaging', icon: ImageIcon },
      { id: 'compliance', label: 'Compliance', icon: Shield },
      { id: 'history', label: 'History', icon: History },
  ];
  
  const handleChartUpdate = (entry: DentalChartEntry) => {
      const isNew = !patient.dentalChart?.some(e => e.id === entry.id);
      const nextChart = isNew ? [...(patient.dentalChart || []), entry] : patient.dentalChart?.map(e => e.id === entry.id ? entry : e);
      onQuickUpdatePatient({ id: patient.id, dentalChart: nextChart });
      setActiveTab('notes');
      setNoteToAutoEdit(entry);
  };
  
  const handlePerioSave = (newData: PerioMeasurement[]) => {
      onQuickUpdatePatient({ id: patient.id, perioChart: newData });
  };
  
  const handleNoteAction = (action: 'add' | 'update' | 'delete', entry: DentalChartEntry) => {
      let nextChart: DentalChartEntry[] = patient.dentalChart ? [...patient.dentalChart] : [];
      if (action === 'add') {
          nextChart.push(entry);
      } else if (action === 'update') {
          nextChart = nextChart.map(e => e.id === entry.id ? entry : e);
      } else if (action === 'delete') {
          nextChart = nextChart.filter(e => e.id !== entry.id);
      }
      onQuickUpdatePatient({ id: patient.id, dentalChart: nextChart });
  };
  
  return (
    <div className="h-full w-full flex flex-col bg-bg-secondary rounded-[2.5rem] shadow-sm border border-border-primary">
        <header className={`p-6 flex items-center justify-between gap-4 shrink-0 rounded-t-[2.5rem] ${headerStyle.bg}`}>
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center font-black text-4xl text-white">{patient.firstName[0]}{patient.surname[0]}</div>
                <div>
                    <h2 className={`text-3xl font-black ${headerStyle.text}`}>{patient.name}</h2>
                    <p className={`text-sm font-bold uppercase tracking-widest ${headerStyle.sub}`}>ID: {patient.id}</p>
                </div>
                 {patient.isPendingSync && (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-lilac-600/50 text-white text-[10px] font-black uppercase tracking-widest animate-pulse">
                        <CloudOff size={10}/> Offline Record
                    </div>
                )}
            </div>
            <div className="flex gap-3">
                <button onClick={() => onBookAppointment(patient.id)} className="bg-white/20 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2"><CalendarPlus size={16}/> New Appt</button>
                <button onClick={() => onEditPatient(patient)} className="bg-white text-teal-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2"><Edit size={16}/> Edit Profile</button>
            </div>
        </header>
        
        <div className="p-2 border-b border-border-primary flex items-center gap-1 overflow-x-auto no-scrollbar bg-slate-50">
            {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white shadow text-teal-700' : 'text-slate-500 hover:bg-white/50'}`}>
                    <tab.icon size={14}/> {tab.label}
                </button>
            ))}
        </div>

        <div className="flex-1 overflow-auto no-scrollbar bg-bg-tertiary">
            {activeTab === 'summary' && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in duration-500">
                    <div className="md:col-span-12">
                        <div className="flex flex-wrap gap-3">
                            {getCriticalFlags(patient).slice(0, 4).map((f, i) => (
                                <div key={i} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full text-xs font-black uppercase border-2 border-red-200 shadow-sm"><ShieldAlert size={14}/> {f.value}</div>
                            ))}
                        </div>
                    </div>
                    <InfoItem label="Mobile" value={patient.phone} icon={Phone} />
                    <InfoItem label="Email" value={patient.email} icon={Mail} />
                    <div className="md:col-span-2"><InfoItem label="Address" value={`${patient.barangay}, ${patient.city}`} icon={MapPin} /></div>
                    <InfoItem label="Occupation" value={patient.occupation} icon={Briefcase} />
                    <InfoItem label="Guardian" value={patient.guardianProfile?.legalName} icon={Baby} isSpecial={!!patient.guardianProfile} />
                    <InfoItem label="Allergies" value={patient.allergies} icon={Droplet} isFlag={patient.allergies?.some(a => a.toLowerCase() !== 'none')} />
                    <div className="md:col-span-2"><InfoItem label="Medical Conditions" value={patient.medicalConditions} icon={Heart} isFlag={patient.medicalConditions?.some(a => a.toLowerCase() !== 'none')} /></div>
                    <InfoItem label="Weight" value={patient.weightKg ? `${patient.weightKg} kg` : null} icon={Weight} />
                    <MedicalHistoryAnswers patient={patient} />
                </div>
            )}
            
            {activeTab === 'appointments' && <Suspense fallback={<TabLoader/>}><PatientAppointmentsView appointments={appointments.filter(a => a.patientId === patient.id)} /></Suspense>}
            {activeTab === 'comms' && <CommunicationLog patient={patient} onUpdatePatient={(p: Patient) => onQuickUpdatePatient(p)} />}
            {activeTab === 'odontogram' && <Suspense fallback={<TabLoader/>}><Odontogram chart={patient.dentalChart || []} readOnly={readOnly} onToothClick={(tooth) => console.log(tooth)} onChartUpdate={handleChartUpdate} /></Suspense>}
            {activeTab === 'notes' && <Suspense fallback={<TabLoader/>}><Odontonotes entries={patient.dentalChart || []} onAddEntry={(e) => handleNoteAction('add', e)} onUpdateEntry={(e) => handleNoteAction('update', e)} onDeleteEntry={(id) => handleNoteAction('delete', {id} as DentalChartEntry)} currentUser={currentUser!} readOnly={readOnly} procedures={fieldSettings.procedures} treatmentPlans={patient.treatmentPlans} prefill={noteToAutoEdit} onClearPrefill={() => setNoteToAutoEdit(null)} onSwitchToPlanTab={() => setActiveTab('plans')} /></Suspense>}
            {activeTab === 'perio' && <Suspense fallback={<TabLoader/>}><PerioChart data={patient.perioChart || []} dentalChart={patient.dentalChart || []} onSave={handlePerioSave} readOnly={readOnly} /></Suspense>}
            {activeTab === 'plans' && <Suspense fallback={<TabLoader/>}><TreatmentPlanModule staff={staff} patient={patient} onUpdatePatient={onQuickUpdatePatient} readOnly={readOnly} currentUser={currentUser} logAction={logAction} featureFlags={fieldSettings.features} onInitiateFinancialConsent={onInitiateFinancialConsent} /></Suspense>}
            {activeTab === 'ledger' && <Suspense fallback={<TabLoader/>}><PatientLedger patient={patient} onUpdatePatient={(p: Patient) => onQuickUpdatePatient(p)} readOnly={readOnly} governanceTrack={governanceTrack} onRecordPaymentWithReceipt={onRecordPaymentWithReceipt}/></Suspense>}
            {activeTab === 'images' && <DiagnosticGallery patient={patient} onQuickUpdatePatient={onQuickUpdatePatient} />}
            {activeTab === 'compliance' && <ComplianceTab patient={patient} onOpenRevocationModal={onOpenRevocationModal} />}
            {activeTab === 'history' && <AuditTrailViewer auditLog={auditLog.filter(log => log.entityId === patient.id)} auditLogVerified={true}/>}
        </div>
    </div>
  );
};

export default PatientDetailView;
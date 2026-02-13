
import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { Patient, Appointment, User, FieldSettings, AuditLogEntry, ClinicalIncident, AuthorityLevel, TreatmentPlanStatus, ClearanceRequest, Referral, GovernanceTrack, ConsentCategory, PatientFile, SterilizationCycle, DentalChartEntry, ClinicalProtocolRule, StockItem, TreatmentPlan, AppointmentStatus, LedgerEntry, UserRole, PerioMeasurement, EPrescription, PatientAlert } from '../types';
import { ShieldAlert, Phone, Mail, MapPin, Edit, Trash2, CalendarPlus, FileUp, Shield, BarChart, History, FileText, DollarSign, Stethoscope, Briefcase, BookUser, Baby, AlertCircle, Receipt, ClipboardList, User as UserIcon, X, ChevronRight, Sparkles, Heart, Activity, CheckCircle, ImageIcon, Plus, Zap, Camera, Search, UserCheck, ArrowLeft, ShieldCheck, Send, ClipboardCheck, UserSearch, Weight, Users, FileSignature, XCircle, FileEdit, CloudOff, Droplet, Calendar, MessageSquare, Pill, HeartPulse, Book, ChevronDown, Loader } from 'lucide-react';
import { formatDate, generateUid, calculateAge } from '../constants';
import ClearanceModal from './ClearanceModal';
import { useToast } from './ToastSystem';
import { summarizePatient } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { useAuthorization } from '../hooks/useAuthorization';
import { useRouter, useNavigate } from '../contexts/RouterContext';
import { usePatient } from '../contexts/PatientContext';
import { useAppContext } from '../contexts/AppContext';
import { useModal } from '../contexts/ModalContext';
import AuditTrailViewer from './AuditTrailViewer';
import CommunicationLog from './CommunicationLog';
import { useAppointments } from '../contexts/AppointmentContext';
import { usePatientAlerts } from '../hooks/usePatientAlerts';
import { ErrorBoundary } from './ErrorBoundary';


// Lazy load heavy components
const Odontonotes = React.lazy(() => import('./Odontonotes').then(module => ({ default: module.Odontonotes })));
const Odontogram = React.lazy(() => import('./Odontogram').then(module => ({ default: module.Odontogram })));
const PerioChart = React.lazy(() => import('./PerioChart').then(module => ({ default: module.PerioChart })));
const TreatmentPlanModule = React.lazy(() => import('./TreatmentPlanModule'));
const PatientLedger = React.lazy(() => import('./PatientLedger').then(module => ({ default: module.PatientLedger })));
const PatientAppointmentsView = React.lazy(() => import('./PatientAppointmentsView').then(module => ({ default: module.PatientAppointmentsView })));
const DiagnosticGallery = React.lazy(() => import('./DiagnosticGallery'));


interface PatientDetailViewProps {
  patient: Patient | null;
  appointments: Appointment[];
  staff: User[];
  stock?: StockItem[];
  currentUser: User;
  onQuickUpdatePatient: (patient: Partial<Patient>) => Promise<void>;
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

type ThemeColor = 'blue' | 'indigo' | 'lilac' | 'orange' | 'red';

interface InfoItemProps { 
  label: string; 
  value?: string | number | null | string[]; 
  icon?: React.ElementType;
  isFlag?: boolean;
  isSpecial?: boolean;
  themeColor?: ThemeColor;
  isLargeValue?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value, icon: Icon, isFlag, isSpecial, themeColor, isLargeValue }) => {
    const displayValue = Array.isArray(value) && value.length > 0 ? value.join(', ') : Array.isArray(value) ? 'None' : (value || '---');

    const themeStyles = {
        blue: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-800',
            icon: 'text-blue-600',
        },
        indigo: {
            bg: 'bg-indigo-50',
            border: 'border-indigo-200',
            text: 'text-indigo-800',
            icon: 'text-indigo-600',
        },
        lilac: {
            bg: 'bg-lilac-50',
            border: 'border-lilac-200',
            text: 'text-lilac-800',
            icon: 'text-lilac-600',
        },
        orange: {
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            text: 'text-orange-800',
            icon: 'text-orange-600',
        },
        red: { 
             bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-800',
            icon: 'text-red-600',
        }
    };

    const containerClasses = isFlag 
        ? 'bg-red-50 border-2 border-red-200' 
        : isSpecial 
        ? 'bg-amber-50 border-2 border-amber-200' 
        : themeColor 
        ? `${themeStyles[themeColor].bg} border-2 ${themeStyles[themeColor].border}`
        : 'bg-white border border-slate-100 shadow-sm';
    
    const iconClasses = isFlag
        ? 'text-red-600'
        : isSpecial
        ? 'text-amber-600'
        : themeColor
        ? themeStyles[themeColor].icon
        : 'text-slate-400';

    const labelClasses = isFlag
        ? 'text-red-700'
        : isSpecial
        ? 'text-amber-700'
        : themeColor
        ? themeStyles[themeColor].text
        : 'text-slate-400';

    const valueColorClasses = isFlag
        ? 'text-red-800'
        : isSpecial
        ? 'text-amber-800'
        : 'text-slate-800';

    const valueSizeClasses = isLargeValue ? 'text-lg font-black tracking-tight' : 'text-sm font-bold';

    return (
        <div className={`p-4 rounded-2xl flex items-start gap-4 ${containerClasses}`}>
            {Icon && <Icon size={18} className={`mt-1 shrink-0 ${iconClasses}`} />}
            <div className="flex-1">
                <div className={`text-[10px] font-black uppercase tracking-widest ${labelClasses}`}>{label}</div>
                <div className={`${valueSizeClasses} mt-1 ${valueColorClasses}`}>{displayValue}</div>
            </div>
        </div>
    );
};


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
    
    const femaleQuestions = [
      'Are you pregnant?',
      'Are you nursing?',
      'Are you taking birth control pills?'
    ];

    const mainQuestions = Object.keys(questions)
        .filter(q => !q.endsWith('_details') && !q.endsWith('_date'))
        .filter(q => questions[q] === 'Yes' || q === 'Are you in good health?');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mainQuestions.map(q => {
                const isFemaleQuestion = femaleQuestions.includes(q);
                const isYes = questions[q] === 'Yes';
                const isSpecial = isFemaleQuestion && isYes;

                return (
                    <div key={q} className={`p-4 rounded-xl border ${isSpecial ? 'bg-amber-50 border-2 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                        <p className="font-bold text-slate-700 text-sm">{q.replace('*', '')}</p>
                        <p className={`font-black text-lg mt-1 ${isYes ? (isSpecial ? 'text-amber-800' : 'text-red-700') : 'text-teal-700'}`}>{questions[q]}</p>
                        {isYes && questions[`${q}_details`] && (
                            <p className="text-xs mt-2 p-3 bg-white rounded-lg border border-slate-200 text-slate-600 font-medium"><strong>Details:</strong> {questions[`${q}_details`]}</p>
                        )}
                        {isYes && questions[`${q}_date`] && (
                            <p className="text-xs mt-2 p-3 bg-white rounded-lg border border-slate-200 text-slate-600 font-medium"><strong>Date:</strong> {formatDate(questions[`${q}_date`])}</p>
                        )}
                    </div>
                );
            })}
            {patient.medicalTreatmentDetails && <InfoItem label="Details of Medical Treatment" value={patient.medicalTreatmentDetails} icon={FileText} />}
            {patient.seriousIllnessDetails && <InfoItem label="Details of Serious Illness/Operation" value={patient.seriousIllnessDetails} icon={FileText} />}
            {patient.lastHospitalizationDetails && <InfoItem label="Details of Last Hospitalization" value={`${patient.lastHospitalizationDetails} on ${formatDate(patient.lastHospitalizationDate)}`} icon={FileText} />}
        </div>
    );
};


export const PatientDetailView: React.FC<PatientDetailViewProps> = ({ 
    patient, appointments, staff, stock = [], currentUser, onQuickUpdatePatient, onBookAppointment, onEditPatient, 
    fieldSettings, logAction, incidents = [], onSaveIncident, referrals = [], onSaveReferral, onBack,
    governanceTrack, onOpenRevocationModal, readOnly, sterilizationCycles, onUpdateSettings,
    onRequestProtocolOverride, onDeleteClinicalNote, onInitiateFinancialConsent, onSupervisorySeal,
    onRecordPaymentWithReceipt, onOpenPostOpHandover, auditLog
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const { route, navigate } = useRouter();
  const [editingNote, setEditingNote] = useState<DentalChartEntry | null>(null);
  const toast = useToast();
  const { can } = useAuthorization();
  const { patients } = usePatient();
  const { setFullScreenView } = useAppContext();
  const { showModal } = useModal();
  const { handleSaveAppointment, handleUpdateAppointmentStatus } = useAppointments();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [summary, setSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  
  const alerts = usePatientAlerts(patient);

  const handleGenerateSummary = async () => {
    if (!patient) return;
    setIsSummaryLoading(true);
    setSummary('');
    try {
        const result = await summarizePatient(patient);
        setSummary(result);
    } catch(e) {
        toast.error("Failed to generate AI summary.");
    } finally {
        setIsSummaryLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moreMenuRef]);

  useEffect(() => {
    const prefillProcedure = route.query.get('prefill_procedure');
    if (prefillProcedure && patient) {
      const prefillNote: Partial<DentalChartEntry> = {
        procedure: prefillProcedure,
        status: 'Completed',
        appointmentId: appointments.find(a => a.patientId === patient.id && a.type === prefillProcedure && a.date === new Date().toLocaleDateString('en-CA'))?.id,
        resourceId: route.query.get('prefill_resourceId') || undefined,
      };
      startNewNote(prefillNote);
      // Clear query params
      navigate(`patients/${patient.id}`, { replace: true });
    }
  }, [route.query, patient?.id, navigate, appointments]);
  
  const startNewNote = (initialData?: Partial<DentalChartEntry>) => {
    const newNote: DentalChartEntry = {
      id: `note_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      procedure: '',
      status: 'Completed',
      author: currentUser.name,
      authorId: currentUser.id,
      authorRole: currentUser.role,
      authorPrc: currentUser.prcLicense,
      ...initialData
    };
    setEditingNote(newNote);
    setActiveTab('notes');
  };

  if (!patient || !fieldSettings) {
    return <PatientPlaceholder />;
  }
  
  const handlePerioSave = (newData: PerioMeasurement[]) => {
      onQuickUpdatePatient({ id: patient.id, perioChart: newData });
  };
  
  const headerStyle = useMemo(() => {
    const hasCritical = alerts.some(a => a.level === 'critical');
    if (hasCritical) return { bg: 'bg-red-600', text: 'text-white', sub: 'text-red-200' };
    if (patient.isPwd) return { bg: 'bg-amber-500', text: 'text-white', sub: 'text-amber-100' };
    if ((calculateAge(patient.dob) || 18) < 18) return { bg: 'bg-blue-500', text: 'text-white', sub: 'text-blue-200' };
    return { bg: 'bg-teal-700', text: 'text-white', sub: 'text-teal-200' };
  }, [patient, alerts]);

  const allTabs = useMemo(() => [
      { id: 'summary', label: 'Details', icon: UserIcon },
      { id: 'notes', label: 'Notes', icon: ClipboardList },
      { id: 'odontogram', label: 'Chart', icon: Stethoscope },
      { id: 'perio', label: 'Perio', icon: Activity },
      { id: 'images', label: 'Imaging', icon: ImageIcon },
      { id: 'plans', label: 'Strategy', icon: Briefcase },
      { id: 'ledger', label: 'Ledger', icon: DollarSign },
      { id: 'appointments', label: 'Appointments', icon: Calendar },
      { id: 'comms', label: 'Comms', icon: MessageSquare },
      { id: 'compliance', label: 'Compliance', icon: Shield },
      { id: 'history', label: 'History', icon: History },
  ], []);

  const primaryTabIds = ['summary', 'plans', 'notes', 'odontogram', 'perio', 'images', 'ledger'];
  const primaryTabs = primaryTabIds.map(id => allTabs.find(tab => tab.id === id)).filter(Boolean) as {id: string; label: string; icon: React.ElementType;}[];
  const secondaryTabs = allTabs.filter(t => !primaryTabIds.includes(t.id));

  const isMoreMenuActive = useMemo(() => secondaryTabs.some(t => t.id === activeTab), [activeTab, secondaryTabs]);
  
  const handleChartUpdate = (entry: DentalChartEntry) => {
      const isNew = !patient.dentalChart?.some(e => e.id === entry.id);
      const nextChart = isNew ? [...(patient.dentalChart || []), entry] : patient.dentalChart?.map(e => e.id === entry.id ? entry : e);
      onQuickUpdatePatient({ id: patient.id, dentalChart: nextChart });
      setActiveTab('notes');
      setEditingNote(entry);
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
  
  const handleSavePrescription = (prescription: EPrescription) => {
      const newPrescription: EPrescription = { ...prescription, id: generateUid('rx') };
      onQuickUpdatePatient({
          ...patient,
          prescriptions: [...(patient.prescriptions || []), newPrescription]
      });
      toast.success("Prescription saved to patient record.");
  };

  const referralSource = useMemo(() => {
      if (!patient.referredById) return null;
      return patients.find(p => p.id === patient.referredById)?.name || 'Unknown Source';
  }, [patient.referredById, patients]);

  const familyGroup = useMemo(() => {
    if (!patient.familyGroupId) return null;
    return fieldSettings.familyGroups?.find(g => g.id === patient.familyGroupId)?.familyName || 'Unknown Group';
  }, [patient.familyGroupId, fieldSettings.familyGroups]);

  const handleAssignToPlan = () => {
    setActiveTab('plans');
    toast.info('Note saved. Assign it to a treatment phase.');
  };

  return (
    <div className="h-full w-full flex flex-col bg-bg-secondary rounded-[2.5rem] shadow-sm border border-border-primary">
        <header className={`p-6 flex items-center justify-between gap-4 shrink-0 rounded-t-[2.5rem] ${headerStyle.bg}`}>
            <div className="flex items-center gap-6">
                {onBack && (
                    <button onClick={onBack} className="bg-white/10 text-white p-3 rounded-full hover:bg-white/20 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                )}
                <div>
                    <h2 className={`text-3xl font-black ${headerStyle.text}`}>{patient.name}</h2>
                    <div className="flex items-center gap-4 divide-x divide-white/20 mt-1">
                        <p className={`text-sm font-bold uppercase tracking-widest ${headerStyle.sub}`}>ID: {patient.id}</p>
                        <p className={`text-sm font-bold uppercase tracking-widest ${headerStyle.sub} pl-4 flex items-center gap-2`}><Phone size={12}/> {patient.phone}</p>
                    </div>
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
        
        <div className="p-2 border-b border-border-primary flex items-center gap-1 bg-slate-50 relative">
            {primaryTabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white shadow text-teal-700' : 'text-slate-500 hover:bg-white/50'}`}>
                    <tab.icon size={14}/> {tab.label}
                </button>
            ))}
            <div ref={moreMenuRef} className="relative">
                <button onClick={() => setIsMoreMenuOpen(prev => !prev)} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase flex items-center gap-2 transition-all whitespace-nowrap ${isMoreMenuActive ? 'bg-white shadow text-teal-700' : 'text-slate-500 hover:bg-white/50'}`}>
                    More <ChevronDown size={14}/>
                </button>
                {isMoreMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-50 p-2">
                        {secondaryTabs.map(tab => (
                            <button 
                                key={tab.id} 
                                onClick={() => { setActiveTab(tab.id); setIsMoreMenuOpen(false); }} 
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                <tab.icon size={14}/> {tab.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="flex-1 overflow-auto no-scrollbar bg-bg-tertiary">
            {alerts.length > 0 && (
                <div className="sticky top-0 z-10 bg-white/70 backdrop-blur-md p-4 border-b border-slate-200">
                    <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
                        {alerts.map((alert, i) => (
                            <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${alert.level === 'critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                                <alert.icon size={14} className={alert.colorClass} />
                                {alert.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <ErrorBoundary>
                {activeTab === 'summary' && (
                    <div className="p-6 space-y-8 animate-in fade-in duration-500">
                        <div className="bg-white p-8 rounded-[2.5rem] border-4 border-lilac-200 shadow-sm">
                             <div className="flex justify-between items-center mb-6">
                                <h4 className="font-bold text-sm text-lilac-600 uppercase tracking-widest flex items-center gap-3"><Sparkles size={18} /> AI Clinical Summary</h4>
                                <button onClick={handleGenerateSummary} disabled={isSummaryLoading} className="px-4 py-2 bg-lilac-600 text-white rounded-lg text-xs font-black uppercase flex items-center gap-2 disabled:opacity-50">
                                    {isSummaryLoading ? <Loader size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                                    {isSummaryLoading ? 'Generating...' : 'Generate Summary'}
                                </button>
                             </div>
                             {isSummaryLoading && <div className="text-center p-8"><Loader className="animate-spin text-lilac-500"/></div>}
                             {summary && <div className="prose prose-sm max-w-none"><ReactMarkdown>{summary}</ReactMarkdown></div>}
                        </div>
                        {/* Section for Medical Summary */}
                        <div className="bg-white p-8 rounded-[2.5rem] border-4 border-red-200 shadow-sm">
                            <h4 className="font-bold text-sm text-red-600 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4 flex items-center gap-3"><Heart size={18} className="text-red-600"/> Medical Summary</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={`p-6 rounded-2xl ${patient.allergies?.some(a => a.toLowerCase() !== 'none') ? 'bg-red-50 border-2 border-red-200' : 'bg-slate-50 border border-slate-100'}`}>
                                    <div className="flex items-center gap-2">
                                        <Droplet size={18} className={`${patient.allergies?.some(a => a.toLowerCase() !== 'none') ? 'text-red-600' : 'text-slate-500'}`}/>
                                        <h5 className={`font-black text-sm uppercase tracking-widest ${patient.allergies?.some(a => a.toLowerCase() !== 'none') ? 'text-red-800' : 'text-slate-600'}`}>Allergies</h5>
                                    </div>
                                    <p className={`text-sm font-bold mt-3 ${patient.allergies?.some(a => a.toLowerCase() !== 'none') ? 'text-red-900' : 'text-slate-800'}`}>
                                        {(patient.allergies && patient.allergies.length > 0 && !patient.allergies.every(a => a.toLowerCase() === 'none')) ? patient.allergies.filter(a => a.toLowerCase() !== 'none').join(', ') : 'None Reported'}
                                    </p>
                                </div>
                                
                                <div className={`p-6 rounded-2xl ${patient.medicalConditions?.some(c => c.toLowerCase() !== 'none') ? 'bg-red-50 border-2 border-red-200' : 'bg-slate-50 border border-slate-100'}`}>
                                    <div className="flex items-center gap-2">
                                        <Heart size={18} className={`${patient.medicalConditions?.some(c => c.toLowerCase() !== 'none') ? 'text-red-600' : 'text-slate-500'}`}/>
                                        <h5 className={`font-black text-sm uppercase tracking-widest ${patient.medicalConditions?.some(c => c.toLowerCase() !== 'none') ? 'text-red-800' : 'text-slate-600'}`}>Medical Conditions</h5>
                                    </div>
                                    <p className={`text-sm font-bold mt-3 ${patient.medicalConditions?.some(c => c.toLowerCase() !== 'none') ? 'text-red-900' : 'text-slate-800'}`}>
                                        {(patient.medicalConditions && patient.medicalConditions.length > 0 && !patient.medicalConditions.every(c => c.toLowerCase() === 'none')) ? patient.medicalConditions.filter(c => c.toLowerCase() !== 'none').join(', ') : 'None Reported'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-8 rounded-[2.5rem] border-4 border-red-200 shadow-sm">
                            <h4 className="font-bold text-sm text-red-600 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4 flex items-center gap-3"><Heart size={18} className="text-red-600"/> Medical History Questionnaire</h4>
                            <MedicalHistoryAnswers patient={patient} />
                        </div>
                        
                        {/* Section for Personal & Contact Info */}
                        <div className="bg-white p-8 rounded-[2.5rem] border-4 border-blue-200 shadow-sm">
                            <h4 className="font-bold text-sm text-blue-600 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4 flex items-center gap-3"><UserIcon size={18} className="text-blue-600"/> Personal & Contact Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InfoItem themeColor="blue" label="Email" value={patient.email} icon={Mail} />
                                {/* FIX: The error report indicated a problem with calling patient properties. 
    Switched to a robust method of joining address parts to prevent errors and avoid displaying 'undefined'. */}
<InfoItem themeColor="blue" label="Address" value={[patient.barangay, patient.city].filter(Boolean).join(', ')} icon={MapPin} />
                                <InfoItem themeColor="blue" label="Occupation" value={patient.occupation} icon={Briefcase} />
                                <InfoItem themeColor="blue" label="Civil Status" value={patient.civilStatus} icon={BookUser} />
                                <InfoItem themeColor="blue" label="Nationality" value={patient.nationality} icon={Briefcase} />
                                <InfoItem themeColor="blue" label="Religion" value={patient.religion} icon={BookUser} />
                                <InfoItem themeColor="blue" label="Blood Group" value={patient.bloodGroup} icon={Droplet} />
                                <InfoItem themeColor="blue" label="Weight" value={patient.weightKg ? `${patient.weightKg} kg` : null} icon={Weight} />
                                {patient.guardianProfile && <InfoItem themeColor="blue" label="Guardian" value={patient.guardianProfile?.legalName} icon={Baby} isSpecial />}
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border-4 border-indigo-200 shadow-sm">
                            <h4 className="font-bold text-sm text-indigo-600 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4 flex items-center gap-3"><Shield size={18} className="text-indigo-600"/> Insurance & Administrative</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InfoItem themeColor="indigo" label="Insurance Provider" value={patient.insuranceProvider} icon={Shield} />
                                <InfoItem themeColor="indigo" label="Insurance Policy #" value={patient.insuranceNumber} icon={FileText} />
                                {referralSource && <InfoItem themeColor="indigo" label="Referred By" value={referralSource} icon={Users} isSpecial />}
                                {familyGroup && <InfoItem themeColor="indigo" label="Family Group" value={familyGroup} icon={Users} isSpecial />}
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border-4 border-lilac-200 shadow-sm">
                            <h4 className="font-bold text-sm text-lilac-600 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4 flex items-center gap-3"><Users size={18} className="text-lilac-600"/> Associated Health Contacts</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="space-y-4">
                                    <InfoItem themeColor="lilac" label="Primary Physician" value={patient.physicianName} icon={HeartPulse} />
                                    <InfoItem themeColor="lilac" label="Physician's Specialty" value={patient.physicianSpecialty} icon={Stethoscope} />
                                    <InfoItem themeColor="lilac" label="Physician's Contact" value={patient.physicianNumber} icon={Phone} />
                                 </div>
                                 <div className="space-y-4">
                                    <InfoItem themeColor="lilac" label="Emergency Contact Name" value={patient.emergencyContact?.name} icon={UserIcon} isSpecial />
                                    <InfoItem themeColor="lilac" label="Relationship" value={patient.emergencyContact?.relationship} icon={Users} isSpecial />
                                    <InfoItem themeColor="lilac" label="Emergency Contact #" value={patient.emergencyContact?.phoneNumber} icon={Phone} isSpecial />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-8 rounded-[2.5rem] border-4 border-orange-200 shadow-sm">
                            <h4 className="font-bold text-sm text-orange-600 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4 flex items-center gap-3"><History size={18} className="text-orange-600"/> Dental History Summary</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoItem themeColor="orange" label="Previous Dentist" value={patient.previousDentist} icon={Book} />
                                <InfoItem themeColor="orange" label="Last Dental Visit" value={formatDate(patient.lastDentalVisit)} icon={Calendar} />
                            </div>
                        </div>

                        {/* Actions Section */}
                        <div className="bg-white p-8 rounded-[2.5rem] border-4 border-blue-200 shadow-sm">
                            <h4 className="font-bold text-sm text-blue-600 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4 flex items-center gap-3"><Zap size={18} className="text-blue-600"/> Quick Actions</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <button onClick={() => showModal('ePrescription', { patient, currentUser, fieldSettings, onSavePrescription: handleSavePrescription })} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-teal-50 rounded-2xl transition-colors border border-slate-200">
                                    <Pill size={24} className="text-teal-600"/>
                                    <span className="text-xs font-black text-slate-700 uppercase text-center">New Prescription</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'appointments' && <Suspense fallback={<TabLoader/>}><PatientAppointmentsView appointments={appointments.filter(a => a.patientId === patient.id)} /></Suspense>}
                {activeTab === 'comms' && <CommunicationLog patient={patient} onUpdatePatient={(p: Patient) => onQuickUpdatePatient(p)} />}
                {activeTab === 'odontogram' && <Suspense fallback={<TabLoader/>}><Odontogram chart={patient.dentalChart || []} readOnly={readOnly} onToothClick={(tooth) => { setActiveTab('notes'); setEditingNote({ ...editingNote, toothNumber: tooth } as DentalChartEntry); }} onChartUpdate={handleChartUpdate} currentUser={currentUser} /></Suspense>}
                {activeTab === 'notes' && <Suspense fallback={<TabLoader/>}><Odontonotes appointments={appointments} entries={patient.dentalChart || []} onAddEntry={(e) => handleNoteAction('add', e)} onUpdateEntry={(e) => handleNoteAction('update', e)} onUpdateAppointment={handleSaveAppointment} onDeleteEntry={(id) => handleNoteAction('delete', {id} as DentalChartEntry)} currentUser={currentUser!} readOnly={readOnly} procedures={fieldSettings.procedures} treatmentPlans={patient.treatmentPlans} onAssignToPlan={handleAssignToPlan} showModal={showModal} patient={patient} logAction={logAction} onQuickUpdatePatient={onQuickUpdatePatient} editingNote={editingNote} setEditingNote={setEditingNote} /></Suspense>}
                {activeTab === 'perio' && <Suspense fallback={<TabLoader/>}><PerioChart data={patient.perioChart || []} dentalChart={patient.dentalChart || []} onSave={handlePerioSave} readOnly={readOnly} /></Suspense>}
                {activeTab === 'plans' && <Suspense fallback={<TabLoader/>}><TreatmentPlanModule 
                    patient={patient} 
                    onUpdatePatient={onQuickUpdatePatient} 
                    readOnly={readOnly} 
                    currentUser={currentUser} 
                    logAction={logAction} 
                    featureFlags={fieldSettings.features} 
                    fieldSettings={fieldSettings}
                    onInitiateFinancialConsent={onInitiateFinancialConsent} 
                    onOpenRevocationModal={onOpenRevocationModal}
                /></Suspense>}
                {activeTab === 'ledger' && <Suspense fallback={<TabLoader/>}><PatientLedger patient={patient} onUpdatePatient={onQuickUpdatePatient} readOnly={readOnly} governanceTrack={governanceTrack} onRecordPaymentWithReceipt={onRecordPaymentWithReceipt}/></Suspense>}
                {activeTab === 'images' && <Suspense fallback={<TabLoader/>}><DiagnosticGallery patient={patient} onQuickUpdatePatient={onQuickUpdatePatient} /></Suspense>}
                {activeTab === 'compliance' && <ComplianceTab patient={patient} onOpenRevocationModal={onOpenRevocationModal} />}
                {activeTab === 'history' && <AuditTrailViewer auditLog={auditLog.filter(log => log.entityId === patient.id)} auditLogVerified={true}/>}
            </ErrorBoundary>
        </div>
    </div>
  );
};

export default PatientDetailView;

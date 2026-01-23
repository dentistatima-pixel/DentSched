import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { Patient, Appointment, User, FieldSettings, AuditLogEntry, ClinicalIncident, AuthorityLevel, TreatmentPlanStatus, ClearanceRequest, Referral, GovernanceTrack, ConsentCategory, PatientFile, SterilizationCycle, DentalChartEntry, ClinicalProtocolRule, StockItem, TreatmentPlan, AppointmentStatus, LedgerEntry, UserRole } from '../types';
// FIX: Add UserSearch to lucide-react imports for PatientPlaceholder
import { ShieldAlert, Phone, Mail, MapPin, Edit, Trash2, CalendarPlus, FileUp, Shield, BarChart, History, FileText, DollarSign, Stethoscope, Briefcase, BookUser, Baby, AlertCircle, Receipt, ClipboardList, User as UserIcon, X, ChevronRight, Download, Sparkles, Heart, Activity, CheckCircle, ImageIcon, Plus, Zap, Camera, Search, UserCheck, ArrowLeft, ShieldCheck, Send, ClipboardCheck, UserSearch } from 'lucide-react';
import { formatDate } from '../constants';
import ClearanceModal from './ClearanceModal';
import { useToast } from './ToastSystem';
import PhilHealthCF4Generator from './PhilHealthCF4Generator';
import { summarizePatient } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { useAuthorization } from '../hooks/useAuthorization';
import { useRouter, useNavigate } from '../contexts/RouterContext';

// Lazy load heavy components
const Odontonotes = React.lazy(() => import('./Odontonotes').then(module => ({ default: module.Odontonotes })));
const Odontogram = React.lazy(() => import('./Odontogram'));
const PerioChart = React.lazy(() => import('./PerioChart'));
const TreatmentPlanModule = React.lazy(() => import('./TreatmentPlan'));
const PatientLedger = React.lazy(() => import('./PatientLedger'));


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
    const displayValue = Array.isArray(value) ? value.join(', ') : (value || '---');
    return (
        <div className={`p-4 rounded-2xl flex items-start gap-4 ${
            isFlag ? 'bg-red-200 border border-red-300' : 
            isSpecial ? 'bg-amber-200 border border-amber-300' : 
            'bg-slate-50 border border-slate-100'
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

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const base64String = await blobToBase64(file);
        
        const newFile: PatientFile = {
            id: `file_${Date.now()}`,
            name: file.name,
            category: 'X-Ray',
            url: base64String,
            date: new Date().toISOString().split('T')[0],
        };
        const updatedPatient: Partial<Patient> = {
            id: patient.id,
            files: [...(patient.files || []), newFile]
        };
        onQuickUpdatePatient(updatedPatient);
    };

    const images = patient.files?.filter(f => f.category === 'X-Ray') || [];

    return (
        <div className="animate-in fade-in duration-500">
            <div className="grid gap-6 diagnostic-grid">
                {images.map(img => (
                    <div 
                        key={img.id}
                        onClick={() => setLightboxImage(img.url)}
                        className="bg-slate-900 aspect-video rounded-[2.5rem] border-4 border-teal-500/20 flex flex-col items-center justify-center group hover:border-teal-500 transition-all cursor-zoom-in relative overflow-hidden"
                    >
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60" />
                        <Search size={32} className="absolute text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                        <div className="absolute bottom-6 left-8 z-10">
                            <div className="text-[10px] font-black text-teal-400 uppercase tracking-widest">{img.name}</div>
                            <div className="text-white text-xs font-bold uppercase mt-1">{formatDate(img.date)}</div>
                        </div>
                    </div>
                ))}
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video rounded-[2.5rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-300 hover:text-teal-600 hover:border-teal-100 transition-all bg-white shadow-sm"
                >
                    <Camera size={48} strokeWidth={1} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Upload Radiograph</span>
                </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

            {lightboxImage && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
                    <img src={lightboxImage} alt="Radiograph" className="max-w-full max-h-full rounded-lg shadow-2xl" />
                    <button onClick={() => setLightboxImage(null)} className="absolute top-4 right-4 text-white p-2 bg-black/30 rounded-full"><X/></button>
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
                            <p className="text-xs text-slate-500">Status: <span className="font-bold text-teal-700">Given</span></p>
                        </div>
                        <button onClick={() => onOpenRevocationModal(patient, 'Clinical')} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-xs font-black uppercase hover:bg-red-200 transition-colors">Revoke</button>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-slate-700">Marketing Communications Consent</p>
                            <p className="text-xs text-slate-500">Status: <span className="font-bold text-teal-700">Given</span></p>
                        </div>
                        <button onClick={() => onOpenRevocationModal(patient, 'Marketing')} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-xs font-black uppercase hover:bg-red-200 transition-colors">Revoke</button>
                    </div>
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-slate-700">Third-Party Disclosure Consent</p>
                            <p className="text-xs text-slate-500">Status: <span className="font-bold text-teal-700">Given</span></p>
                        </div>
                        <button onClick={() => onOpenRevocationModal(patient, 'ThirdParty')} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-xs font-black uppercase hover:bg-red-200 transition-colors">Revoke</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const PatientDetailView: React.FC<PatientDetailViewProps> = ({ 
    patient, appointments, staff, stock = [], currentUser, onQuickUpdatePatient, onBookAppointment, onEditPatient, 
    fieldSettings, logAction, incidents = [], onSaveIncident, referrals = [], onSaveReferral, onBack,
    governanceTrack, onOpenRevocationModal, readOnly, sterilizationCycles, onUpdateSettings,
    onRequestProtocolOverride, onDeleteClinicalNote, onInitiateFinancialConsent, onSupervisorySeal,
    onRecordPaymentWithReceipt, onOpenPostOpHandover
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const toast = useToast();
  const { can } = useAuthorization();
  const navigate = useNavigate();

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
    const hasFlags = flags.length > 0;
    const isMinor = patient.age !== undefined && patient.age < 18;
    const isPwdOrMinor = patient.isPwd || isMinor;

    if (hasFlags) {
        return 'bg-red-200 border-red-300';
    }
    if (isPwdOrMinor) {
        return 'bg-amber-200 border-amber-300';
    }
    return 'border-slate-100';
  }, [patient, fieldSettings]);

  const patientAppointments = useMemo(() => {
      return appointments.filter(a => a.patientId === patient?.id);
  }, [appointments, patient]);

  const handleUpdateChart = (newEntry: DentalChartEntry) => {
    if (!patient) return;
    const existingIndex = patient.dentalChart?.findIndex(e => e.id === newEntry.id);
    let newChart: DentalChartEntry[];
    if (existingIndex !== undefined && existingIndex > -1) {
        newChart = [...(patient.dentalChart || [])];
        newChart[existingIndex] = newEntry;
    } else {
        newChart = [...(patient.dentalChart || []), newEntry];
    }
    onQuickUpdatePatient({ ...patient, dentalChart: newChart });
  };
  
  const handleUpdatePerioChart = (newData: DentalChartEntry[]) => {
      if (!patient) return;
      onQuickUpdatePatient({ ...patient, perioChart: newData as any[] });
  };

  const [summary, setSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const generateSummary = async () => {
      if (!patient) return;
      setIsSummaryLoading(true);
      try {
          const result = await summarizePatient(patient);
          setSummary(result || "Could not generate summary.");
      } catch (error) {
          setSummary("Error generating summary.");
      } finally {
          setIsSummaryLoading(false);
      }
  }

  const isProvisional = patient.registrationStatus === 'Provisional';

  const tabs = [
    { id: 'summary', label: 'Summary', icon: BarChart },
    { id: 'notes', label: 'Odontonotes', icon: FileText },
    { id: 'chart', label: 'Odontogram', icon: Stethoscope },
    { id: 'perio', label: 'Perio Chart', icon: History },
    { id: 'plan', label: 'Tx Plan', icon: ClipboardList },
    { id: 'ledger', label: 'Ledger', icon: DollarSign },
    { id: 'imaging', label: 'Imaging', icon: ImageIcon },
    { id: 'compliance', label: 'Compliance', icon: Shield },
  ];

  const renderContent = () => {
    switch(activeTab) {
        case 'summary':
            return (
                <div className="grid gap-6 animate-in fade-in duration-500 patient-summary-grid">
                    <div className="space-y-6 patient-summary-col-1">
                        <InfoItem label="Chief Complaint" value={patient.chiefComplaint} icon={AlertCircle} isFlag />
                        <InfoItem label="Allergies" value={patient.allergies} icon={AlertCircle} isFlag />
                        <InfoItem label="Medical Conditions" value={patient.medicalConditions} icon={AlertCircle} isFlag />
                        {patient.guardianProfile && <InfoItem label="Guardian" value={`${patient.guardianProfile.legalName} (${patient.guardianProfile.relationship})`} icon={Baby} isSpecial />}
                    </div>
                    <div className="space-y-6 patient-summary-col-2">
                        {can('use:ai-features') && (
                            <div className="bg-white p-6 rounded-2xl border border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-sm flex items-center gap-2"><Sparkles size={16} className="text-teal-500"/> AI Clinical Summary</h4>
                                    <button onClick={generateSummary} disabled={isSummaryLoading} className="text-xs font-bold text-teal-600 flex items-center gap-1">
                                        {isSummaryLoading ? 'Generating...' : <><Sparkles size={12}/> Generate</>}
                                    </button>
                                </div>
                                {isSummaryLoading ? <p>Loading...</p> : summary ? <ReactMarkdown className="text-sm prose">{summary}</ReactMarkdown> : <p className="text-sm text-slate-400 italic">Generate a summary for a quick overview.</p>}
                            </div>
                        )}
                        <InfoItem label="Patient Notes" value={patient.notes} icon={FileText} />
                    </div>
                    <div className="pt-6 border-t border-slate-100 patient-summary-col-3">
                        <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-4">Chronological History</h4>
                        <div className="space-y-3">
                            {patientAppointments.slice().reverse().slice(0, 5).map(apt => {
                                const provider = staff.find(s => s.id === apt.providerId);
                                const isSurgical = apt.type.toLowerCase().includes('surg') || apt.type.toLowerCase().includes('extract');
                                const isCompletedRecently = apt.status === AppointmentStatus.COMPLETED && new Date(apt.date) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
                                const needsHandover = isSurgical && isCompletedRecently && !apt.postOpVerified;

                                return (
                                    <div key={apt.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-800">{apt.type}</p>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{formatDate(apt.date)} @ {apt.time} with Dr. {provider?.surname || provider?.name}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border shadow-sm ${apt.status === AppointmentStatus.COMPLETED ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {apt.status}
                                            </span>
                                            {needsHandover && (
                                                <button onClick={() => onOpenPostOpHandover(apt)} className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 animate-pulse hover:animate-none transition-all shadow-lg shadow-amber-500/20">
                                                    <ShieldCheck size={14}/> Post-Op Handover
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )
        case 'notes': return <Suspense fallback={<TabLoader />}><Odontonotes entries={patient.dentalChart || []} onAddEntry={handleUpdateChart} onUpdateEntry={handleUpdateChart} onDeleteEntry={(id) => onDeleteClinicalNote && onDeleteClinicalNote(patient.id, id)} currentUser={currentUser} procedures={fieldSettings.procedures} inventory={stock} fieldSettings={fieldSettings} patient={patient} appointments={patientAppointments} incidents={incidents} sterilizationCycles={sterilizationCycles} onRequestProtocolOverride={onRequestProtocolOverride} onSupervisorySeal={onSupervisorySeal} /></Suspense>;
        case 'chart': return <Suspense fallback={<TabLoader />}><Odontogram chart={patient.dentalChart || []} onToothClick={()=>{}} onChartUpdate={handleUpdateChart} readOnly={readOnly}/></Suspense>;
        case 'perio': return <Suspense fallback={<TabLoader />}><PerioChart data={patient.perioChart || []} onSave={handleUpdatePerioChart} readOnly={readOnly}/></Suspense>;
        case 'plan': return <Suspense fallback={<TabLoader />}><TreatmentPlanModule patient={patient} onUpdatePatient={onQuickUpdatePatient} readOnly={readOnly} currentUser={currentUser} logAction={logAction} featureFlags={fieldSettings.features} fieldSettings={fieldSettings} onOpenRevocationModal={onOpenRevocationModal} onInitiateFinancialConsent={onInitiateFinancialConsent}/></Suspense>;
        case 'ledger': return <Suspense fallback={<TabLoader />}><PatientLedger patient={patient} onUpdatePatient={onQuickUpdatePatient} readOnly={readOnly} fieldSettings={fieldSettings} governanceTrack={governanceTrack} onRecordPaymentWithReceipt={onRecordPaymentWithReceipt} /></Suspense>;
        case 'imaging': return <DiagnosticGallery patient={patient} onQuickUpdatePatient={onQuickUpdatePatient} />;
        case 'compliance': return <ComplianceTab patient={patient} onOpenRevocationModal={onOpenRevocationModal} />;
        default: return null;
    }
  }

  return (
    <div className="h-full w-full flex flex-col bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className={`p-6 flex items-center justify-between gap-4 shrink-0 border-b transition-colors duration-300 ${headerStyle}`}>
            {isProvisional && (
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-amber-400 text-black px-4 py-1 rounded-b-lg text-[10px] font-black uppercase tracking-widest animate-pulse z-20">
                    Provisional Record
                </div>
            )}
            <div className="flex items-center gap-6">
                {onBack && (
                    <button onClick={onBack} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-600 transition-colors active:scale-90" aria-label="Back to Patient Registry">
                        <ArrowLeft size={20} />
                    </button>
                )}
                <div>
                    <h2 className="text-xl font-black text-slate-800">{patient.name}</h2>
                    <div className="text-sm text-slate-500 font-mono">ID: {patient.id} &bull; Age: {patient.age}</div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {isProvisional ? (
                    <button onClick={() => onEditPatient(patient)} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><Edit size={14}/> Complete Registration</button>
                ) : (
                    <button onClick={() => onEditPatient(patient)} className="p-3 text-slate-400 hover:text-teal-600 rounded-lg"><Edit size={20}/></button>
                )}
                <button onClick={() => onBookAppointment(patient.id)} className="bg-teal-600 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2"><CalendarPlus size={16}/> New Appt.</button>
            </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-2 border-b flex items-center justify-between">
                <div className="flex">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 ${activeTab === tab.id ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                            <tab.icon size={14}/> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={`flex-1 overflow-auto no-scrollbar ${activeTab === 'chart' || activeTab === 'perio' || activeTab === 'ledger' ? 'bg-slate-50 p-4' : 'p-6'}`}>
                {renderContent()}
            </div>
        </div>
    </div>
  );
};

export default PatientDetailView;

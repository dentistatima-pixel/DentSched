
import React, { useState, useRef, useEffect, useMemo, Suspense, useCallback } from 'react';
import { Patient, Appointment, User, FieldSettings, AuditLogEntry, ClinicalIncident, AuthorityLevel, TreatmentPlanStatus, ClearanceRequest, Referral, GovernanceTrack, ConsentCategory, PatientFile, SterilizationCycle, DentalChartEntry, ClinicalProtocolRule, StockItem, TreatmentPlan, AppointmentStatus, LedgerEntry, UserRole, PerioMeasurement, EPrescription, PatientAlert } from '../types';
import { ShieldAlert, Phone, Mail, MapPin, Edit, Trash2, CalendarPlus, FileUp, Shield, BarChart, History, FileText, DollarSign, Stethoscope, Briefcase, BookUser, Baby, AlertCircle, Receipt, ClipboardList, User as UserIcon, X, ChevronRight, Sparkles, Heart, Activity, CheckCircle, ImageIcon, Plus, Zap, Camera, Search, UserCheck, ArrowLeft, ShieldCheck, Send, MessageSquare, Pill, HeartPulse, Book, ChevronDown, Loader, MoreHorizontal, Image as ImageIconLucide, ChartPie, Users, Droplet, Scale, XCircle, HeartPulse as HeartPulseIcon } from 'lucide-react';
import { formatDate, generateUid, calculateAge } from '../constants';
import { useToast } from './ToastSystem';
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
const PatientComplianceView = React.lazy(() => import('./PatientComplianceView'));


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
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

const TabLoader: React.FC = () => (
    <div className="flex items-center justify-center h-96 w-full bg-slate-50/50 rounded-2xl">
        <Loader className="animate-spin h-8 w-8 text-teal-600" />
    </div>
);

export const PatientPlaceholder: React.FC = () => {
    return (
        <div className="flex h-full flex-col items-center justify-center bg-slate-50 p-8 text-center text-slate-400">
            <UserIcon size={48} className="mb-4 opacity-50" />
            <h3 className="text-lg font-black text-slate-500">No Patient Selected</h3>
            <p className="max-w-xs text-sm">Select a patient from the list to view their complete clinical record, charts, and financial ledger.</p>
        </div>
    );
};

const DetailSection: React.FC<{ title: string; icon?: React.ElementType; borderColor: string; children: React.ReactNode; }> = ({ title, icon: Icon, borderColor, children }) => (
  <div className={`bg-white rounded-3xl border-2 shadow-sm ${borderColor}`}>
    <h3 className={`flex items-center gap-3 p-4 text-xs font-black uppercase tracking-widest border-b-2 ${borderColor} bg-slate-50/50`}>
      {Icon && <Icon size={16} />} {title}
    </h3>
    <div className="p-6">
      {children}
    </div>
  </div>
);

const ValuePill: React.FC<{ icon?: React.ElementType; label: string; value: React.ReactNode; color: 'blue' | 'teal' | 'amber' | 'red' }> = ({ icon: Icon, label, value, color }) => (
    <div className={`bg-${color}-50 p-4 rounded-2xl border border-${color}-200`}>
        {Icon && (
            <div className={`flex items-center gap-2 text-${color}-700 text-xs font-bold uppercase`}>
                <Icon size={12} /> {label}
            </div>
        )}
        {!Icon && <div className={`text-${color}-700 text-xs font-bold uppercase`}>{label}</div>}
        <p className={`text-sm font-medium text-${color}-900 mt-1 break-words`}>{value || '--'}</p>
    </div>
);

const ConsentStatusPill: React.FC<{ label: string; consented?: boolean }> = ({ label, consented }) => (
    <div className={`flex items-center justify-between p-4 rounded-2xl border ${consented ? 'bg-teal-50 border-teal-200' : 'bg-red-50 border-red-200'}`}>
        <span className={`text-sm font-bold ${consented ? 'text-teal-800' : 'text-red-800'}`}>{label}</span>
        {consented ? (
            <div className="flex items-center gap-1 text-xs font-black text-teal-700"><CheckCircle size={14}/> GRANTED</div>
        ) : (
            <div className="flex items-center gap-1 text-xs font-black text-red-700"><XCircle size={14}/> NOT GRANTED</div>
        )}
    </div>
);

const QuestionnaireItem: React.FC<{ question: string; answer?: any; details?: string; }> = ({ question, answer, details }) => {
    const isYes = answer === 'Yes';
    const hasDetails = isYes && details;
    const color = isYes ? 'amber' : 'slate';

    return (
        <div className={`bg-${color}-50 p-4 rounded-2xl border border-${color}-200`}>
            <p className={`text-sm font-medium text-${color}-800 mb-2`}>{question.replace('*', '')}</p>
            <p className={`text-xl font-black text-${color}-900`}>{answer || 'N/A'}</p>
            {hasDetails && (
                <div className="mt-2 pt-2 border-t border-amber-200">
                    <p className="text-xs text-amber-700 font-bold">Details: {details}</p>
                </div>
            )}
        </div>
    );
};

const PatientDetailsTabContent: React.FC<{ patient: Patient; fieldSettings: FieldSettings; }> = ({ patient, fieldSettings }) => {
    const { patients } = usePatient();
    const medicalQuestions = [
        ...fieldSettings.identityQuestionRegistry,
        ...fieldSettings.medicalRiskRegistry,
    ];
    
    // Add female-specific questions if applicable
    if (patient.sex === 'Female') {
        medicalQuestions.push(...fieldSettings.femaleQuestionRegistry);
    }
    
    const dentalQuestions = fieldSettings.dentalHistoryRegistry || [];

    const familyHead = useMemo(() => {
        if (!patient.familyGroupId) return null;
        const familyGroup = fieldSettings.familyGroups?.find(fg => fg.id === patient.familyGroupId);
        if (!familyGroup) return null;
        return patients.find(p => p.id === familyGroup.headOfFamilyId);
    }, [patient.familyGroupId, fieldSettings.familyGroups, patients]);

    const medicalNarratives = [
        { label: "Medications Being Taken", value: patient.medicationDetails },
        { label: "Details on Past Medical Treatments", value: patient.medicalTreatmentDetails },
        { label: "Details on Serious Illnesses/Operations", value: patient.seriousIllnessDetails },
        { label: "Details on Last Hospitalization", value: patient.lastHospitalizationDetails },
    ];
    
    const consentFlags = [
        { label: 'Marketing Consent', value: patient.marketingConsent },
        { label: 'Research Consent', value: patient.researchConsent },
        { label: 'Data Privacy (DPA) Consent', value: patient.dpaConsent },
        { label: '3rd Party Disclosure Consent', value: patient.thirdPartyDisclosureConsent },
    ];

    return (
        <div className="space-y-6">
            <DetailSection title="Medical Summary & Narratives" icon={Heart} borderColor="border-red-300">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <ValuePill label="Allergies" value={(patient.allergies || []).join(', ') || 'None reported'} color="red" />
                    <ValuePill label="Other Allergies" value={patient.otherAllergies} color="red" />
                    <ValuePill label="Medical Conditions" value={(patient.medicalConditions || []).join(', ') || 'None reported'} color="red" />
                    <ValuePill label="Other Conditions" value={patient.otherConditions} color="red" />
                    <ValuePill icon={Droplet} label="Blood Group" value={patient.bloodGroup} color="red" />
                    <ValuePill icon={HeartPulseIcon} label="Blood Pressure" value={patient.bloodPressure} color="red" />
                    <ValuePill icon={Scale} label="Weight" value={patient.weightKg ? `${patient.weightKg} kg` : '--'} color="red" />
                 </div>
                 <div className="space-y-4">
                     {medicalNarratives.filter(n => n.value).map(narrative => (
                         <div key={narrative.label} className="bg-red-50 p-4 rounded-2xl border border-red-200">
                             <div className="text-red-700 text-xs font-bold uppercase">{narrative.label}</div>
                             <p className="text-sm font-medium text-red-900 mt-1">{narrative.value}</p>
                         </div>
                     ))}
                 </div>
            </DetailSection>

            <DetailSection title="Alerts & Status" icon={AlertCircle} borderColor="border-amber-300">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ConsentStatusPill label="PWD Status" consented={patient.isPwd} />
                    <ConsentStatusPill label="Senior Dependent" consented={patient.isSeniorDependent} />
                    <ValuePill label="Recall Status" value={patient.recallStatus} color="amber" />
                    <ValuePill label="Registration" value={patient.registrationStatus} color="amber" />
                </div>
                 <div className="mt-4">
                    <ValuePill label="General Notes" value={patient.notes} color="amber" />
                 </div>
            </DetailSection>

            <DetailSection title="Medical History Questionnaire" icon={FileText} borderColor="border-amber-300">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {medicalQuestions.map(q => (
                        <QuestionnaireItem 
                            key={q}
                            question={q} 
                            answer={patient.registryAnswers?.[q]} 
                            details={patient.registryAnswers?.[`${q}_details`]}
                        />
                    ))}
                </div>
            </DetailSection>
            
            <DetailSection title="Dental History" icon={Activity} borderColor="border-teal-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <ValuePill label="Previous Dentist" value={patient.previousDentist} color="teal" />
                    <ValuePill label="Last Dental Visit" value={formatDate(patient.lastDentalVisit)} color="teal" />
                    <ValuePill label="Last Clinic Visit" value={formatDate(patient.lastVisit)} color="teal" />
                    <ValuePill label="Next Clinic Visit" value={formatDate(patient.nextVisit)} color="teal" />
                </div>
                 <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                    <div className="text-amber-700 text-xs font-bold uppercase">Chief Complaint</div>
                    <p className="text-sm font-medium text-amber-900 mt-1">{patient.chiefComplaint || 'N/A'}</p>
                 </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                     {dentalQuestions.map(q => (
                        <QuestionnaireItem 
                            key={q}
                            question={q} 
                            answer={patient.registryAnswers?.[q]} 
                            details={patient.registryAnswers?.[`${q}_details`]}
                        />
                    ))}
                </div>
            </DetailSection>
            
            <DetailSection title="Attending Physician" icon={Stethoscope} borderColor="border-teal-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ValuePill label="Physician Name" value={patient.physicianName} color="teal" />
                    <ValuePill label="Specialty" value={patient.physicianSpecialty} color="teal" />
                    <ValuePill label="Address" value={patient.physicianAddress} color="teal" />
                    <ValuePill label="Contact No." value={patient.physicianNumber} color="teal" />
                </div>
            </DetailSection>
            
            {(patient.guardianProfile || patient.emergencyContact) && (
                <DetailSection title="Guardian & Emergency Contacts" icon={Users} borderColor="border-amber-300">
                    {patient.guardianProfile && (
                        <div className="space-y-4">
                            <h4 className="font-bold text-sm text-amber-800 uppercase tracking-widest border-b border-amber-200 pb-2 mb-4">Guardian Profile</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ValuePill icon={UserIcon} label="Legal Name" value={patient.guardianProfile.legalName} color="amber" />
                                <ValuePill icon={Users} label="Relationship" value={patient.guardianProfile.relationship} color="amber" />
                                <ValuePill icon={Phone} label="Mobile" value={patient.guardianProfile.mobile} color="amber" />
                                <ValuePill icon={ShieldCheck} label="Authority Level" value={patient.guardianProfile.authorityLevel} color="amber" />
                            </div>
                        </div>
                    )}
                    {patient.emergencyContact && (
                        <div className={`space-y-4 ${patient.guardianProfile ? 'mt-6 pt-6 border-t border-amber-200' : ''}`}>
                            <h4 className="font-bold text-sm text-red-800 uppercase tracking-widest border-b border-red-200 pb-2 mb-4">Emergency Contact</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <ValuePill label="Name" value={patient.emergencyContact.name} color="red" />
                                <ValuePill label="Relationship" value={patient.emergencyContact.relationship} color="red" />
                                <ValuePill label="Phone Number" value={patient.emergencyContact.phoneNumber} color="red" />
                            </div>
                        </div>
                    )}
                </DetailSection>
            )}

            <DetailSection title="Patient Profile & Contact" icon={Briefcase} borderColor="border-blue-300">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <ValuePill icon={UserIcon} label="DOB" value={`${formatDate(patient.dob)} (${calculateAge(patient.dob)} yrs)`} color="blue" />
                    <ValuePill icon={Users} label="Sex" value={patient.sex} color="blue" />
                    <ValuePill icon={BookUser} label="Civil Status" value={patient.civilStatus} color="blue" />
                    <ValuePill icon={Users} label="Nationality" value={patient.nationality} color="blue" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <ValuePill icon={Phone} label="Mobile" value={patient.phone} color="blue" />
                    <ValuePill icon={Mail} label="Email" value={patient.email} color="blue" />
                    <ValuePill icon={Phone} label="Home No." value={patient.homeNumber} color="blue" />
                    <ValuePill icon={Phone} label="Office No." value={patient.officeNumber} color="blue" />
                    <ValuePill icon={Phone} label="Fax No." value={patient.faxNumber} color="blue" />
                    <ValuePill icon={Briefcase} label="Occupation" value={patient.occupation} color="blue" />
                    <ValuePill icon={MapPin} label="Address" value={`${patient.homeAddress}, ${patient.barangay}, ${patient.city}`} color="blue" />
                    <ValuePill label="Insurance Provider" value={patient.insuranceProvider} color="blue" />
                    <ValuePill label="Insurance #" value={patient.insuranceNumber} color="blue" />
                    {familyHead && <ValuePill icon={Users} label="Head of Household" value={familyHead.name} color="blue" />}
                </div>
            </DetailSection>

            <DetailSection title="Consent Status" icon={ShieldCheck} borderColor="border-lilac-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {consentFlags.map(flag => (
                        <ConsentStatusPill key={flag.label} label={flag.label} consented={flag.value} />
                    ))}
                </div>
            </DetailSection>
        </div>
    );
};

export const PatientDetailView: React.FC<PatientDetailViewProps> = (props) => {
    const { patient, onBookAppointment, onEditPatient, fieldSettings, currentUser, onQuickUpdatePatient, activeTab, setActiveTab } = props;
    const toast = useToast();

    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const moreMenuRef = useRef<HTMLDivElement>(null);
    const [editingNote, setEditingNote] = useState<DentalChartEntry | null>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setIsMoreMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToothClick = useCallback((toothNumber: number) => {
        setActiveTab('notes');
        const newNote: DentalChartEntry = {
            id: `note_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            procedure: '',
            toothNumber: toothNumber,
            status: 'Completed',
            author: currentUser.name,
            authorId: currentUser.id,
            authorRole: currentUser.role,
            authorPrc: currentUser.prcLicense,
        };
        setEditingNote(newNote);
    }, [setActiveTab, currentUser]);

    if (!patient || !fieldSettings) return null;

    const mainTabs = [
        { id: 'details', label: 'Details', icon: FileText },
        { id: 'strategy', label: 'Strategy', icon: ClipboardList },
        { id: 'notes', label: 'Notes', icon: FileText },
        { id: 'chart', label: 'Chart', icon: Stethoscope },
        { id: 'perio', label: 'Perio', icon: Activity },
        { id: 'imaging', label: 'Imaging', icon: ImageIconLucide },
        { id: 'ledger', label: 'Ledger', icon: DollarSign },
    ];

    const moreTabs = [
        { id: 'appointments', label: 'Appointments', icon: History },
        { id: 'comms', label: 'Comms', icon: MessageSquare },
        { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
        { id: 'history', label: 'History', icon: Shield },
    ];
    
    const renderTabContent = () => {
        switch(activeTab) {
            case 'details': return <PatientDetailsTabContent patient={patient} fieldSettings={fieldSettings} />;
            case 'strategy': return <TreatmentPlanModule {...props} />;
            case 'notes': return <Odontonotes {...props} entries={patient.dentalChart || []} editingNote={editingNote} setEditingNote={setEditingNote} />;
            case 'chart': return <Odontogram chart={patient.dentalChart || []} onToothClick={handleToothClick} currentUser={currentUser} onChartUpdate={(entry) => onQuickUpdatePatient({ id: patient.id, dentalChart: [...(patient.dentalChart || []), entry] })} />;
            case 'perio': return <PerioChart data={patient.perioChart || []} dentalChart={patient.dentalChart || []} onSave={(newData) => onQuickUpdatePatient({ id: patient.id, perioChart: newData })} />;
            case 'imaging': return <DiagnosticGallery patient={patient} onQuickUpdatePatient={onQuickUpdatePatient} />;
            case 'ledger': return <PatientLedger {...props} />;
            case 'appointments': return <PatientAppointmentsView appointments={props.appointments.filter(a => a.patientId === patient.id)} />;
            case 'comms': return <CommunicationLog patient={patient} onUpdatePatient={onQuickUpdatePatient} />;
            case 'compliance': return <PatientComplianceView patient={patient} />;
            case 'history': return <AuditTrailViewer auditLog={props.auditLog.filter(l => l.entityId === patient.id)} />;
            default: return null;
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-100 animate-in fade-in duration-500">
            <header className="bg-red-600 text-white p-6 rounded-b-[2.5rem] shadow-2xl z-10 shrink-0 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={props.onBack} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black">{patient.name}</h2>
                        <div className="flex items-center gap-4 text-sm text-red-100 font-medium">
                            <span>ID: {patient.id}</span>
                            <span>&bull;</span>
                            <span>{patient.phone}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                     <button onClick={() => onBookAppointment(patient.id)} className="px-5 py-2.5 bg-white/90 text-red-700 rounded-xl text-xs font-black uppercase tracking-widest">New Appt</button>
                     <button onClick={() => onEditPatient(patient)} className="px-5 py-2.5 bg-transparent border-2 border-white text-white rounded-xl text-xs font-black uppercase tracking-widest">Edit Profile</button>
                </div>
            </header>

            <nav className="flex items-center gap-1 px-4 border-b bg-white shadow-sm shrink-0">
                {mainTabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold transition-all ${activeTab === tab.id ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                         <tab.icon size={16}/> {tab.label}
                    </button>
                ))}
                <div className="relative ml-auto" ref={moreMenuRef}>
                    <button onClick={() => setIsMoreMenuOpen(prev => !prev)} className="flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold border-transparent text-slate-500 hover:text-slate-800">
                        More <ChevronDown size={16}/>
                    </button>
                    {isMoreMenuOpen && (
                        <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-10 p-2">
                            {moreTabs.map(tab => (
                                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsMoreMenuOpen(false); }} className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold ${activeTab === tab.id ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>
                                    <tab.icon size={16}/> {tab.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </nav>

            <main className="flex-1 overflow-y-auto no-scrollbar p-6">
                <Suspense fallback={<TabLoader/>}>
                    <ErrorBoundary>
                        {renderTabContent()}
                    </ErrorBoundary>
                </Suspense>
            </main>
        </div>
    );
};

export default PatientDetailView;

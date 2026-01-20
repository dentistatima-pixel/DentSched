
import React, { useState, useRef, useEffect } from 'react';
// Fix: Add missing import for 'AppointmentStatus'.
import { Patient, Appointment, User, FieldSettings, AuditLogEntry, ClinicalIncident, AuthorityLevel, TreatmentPlanStatus, ClearanceRequest, Referral, GovernanceTrack, ConsentCategory, PatientFile, SterilizationCycle, DentalChartEntry, ClinicalProtocolRule, StockItem, TreatmentPlan, AppointmentStatus } from '../types';
import { ShieldAlert, Phone, Mail, MapPin, Edit, Trash2, CalendarPlus, FileUp, Shield, BarChart, History, FileText, DollarSign, Stethoscope, Briefcase, BookUser, Baby, AlertCircle, Receipt, ClipboardList, User as UserIcon, X, ChevronRight, Download, Sparkles, Heart, Activity, CheckCircle, ImageIcon, Plus, Zap, Camera, Search, UserCheck, ArrowLeft, ShieldCheck, Send } from 'lucide-react';
import { Odontonotes } from './Odontonotes';
// Fix: Import the Odontogram component.
import Odontogram from './Odontogram';
import PerioChart from './PerioChart';
import TreatmentPlanModule from './TreatmentPlan';
import PatientLedger from './PatientLedger';
import { formatDate } from '../constants';
import ClearanceModal from './ClearanceModal'; // Import the new modal
import { useToast } from './ToastSystem';
import PhilHealthCF4Generator from './PhilHealthCF4Generator';
import { summarizePatient } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';


interface PatientDetailViewProps {
  patient: Patient | null;
  appointments: Appointment[];
  staff: User[];
  stock?: StockItem[];
  currentUser: User;
  onQuickUpdatePatient: (patient: Patient) => void;
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
  onOpenMedicoLegalExport: (patient: Patient) => void;
  readOnly?: boolean;
  sterilizationCycles?: SterilizationCycle[];
  prefill?: Partial<DentalChartEntry> | null;
  onClearPrefill?: () => void;
  onPrefillNote?: (entry: DentalChartEntry) => void;
  onUpdateSettings?: (settings: FieldSettings) => void;
  onRequestProtocolOverride: (rule: ClinicalProtocolRule, continuation: () => void) => void;
  onDeleteClinicalNote?: (patientId: string, noteId: string) => void;
  onInitiateFinancialConsent: (plan: TreatmentPlan) => void;
  onSupervisorySeal?: (note: DentalChartEntry) => void;
}

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
    onQuickUpdatePatient: (p: Patient) => void
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
        const updatedPatient: Patient = {
            ...patient,
            files: [...(patient.files || []), newFile]
        };
        onQuickUpdatePatient(updatedPatient);
    };

    const images = patient.files?.filter(f => f.category === 'X-Ray') || [];

    return (
        <div className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

// Fix: Define the missing ComplianceTab component.
interface ComplianceTabProps {
    patient: Patient;
    incidents?: ClinicalIncident[];
    onSaveIncident?: (incident: Omit<ClinicalIncident, 'id'>) => void;
    referrals?: Referral[];
    onSaveReferral?: (referral: Omit<Referral, 'id'>) => void;
    currentUser: User;
    onOpenRevocationModal: (patient: Patient, category: ConsentCategory) => void;
}

const ComplianceTab: React.FC<ComplianceTabProps> = ({ patient, incidents = [], onSaveIncident, referrals = [], onSaveReferral, currentUser, onOpenRevocationModal }) => {
    const [showIncidentForm, setShowIncidentForm] = useState(false);
    const [incidentForm, setIncidentForm] = useState({ type: 'Complication', description: '', actionTaken: '' });

    const [showReferralForm, setShowReferralForm] = useState(false);
    const [referralForm, setReferralForm] = useState({ referredTo: '', reason: '' });

    const handleSaveIncident = () => {
        if (!onSaveIncident || !incidentForm.description) return;
        const newIncident: Omit<ClinicalIncident, 'id'> = {
            date: new Date().toISOString(),
            type: incidentForm.type,
            patientId: patient.id,
            patientName: patient.name,
            description: incidentForm.description,
            actionTaken: incidentForm.actionTaken,
            reportedBy: currentUser.id,
            reportedByName: currentUser.name,
        };
        onSaveIncident(newIncident);
        setShowIncidentForm(false);
        setIncidentForm({ type: 'Complication', description: '', actionTaken: '' });
    };

    const handleSaveReferral = () => {
        if (!onSaveReferral || !referralForm.referredTo || !referralForm.reason) return;
        const newReferral: Omit<Referral, 'id'> = {
            date: new Date().toISOString(),
            patientId: patient.id,
            referredTo: referralForm.referredTo,
            reason: referralForm.reason,
            status: 'Sent',
        };
        onSaveReferral(newReferral);
        setShowReferralForm(false);
        setReferralForm({ referredTo: '', reason: '' });
    };

    return (
        <div className="space-y-8">
            {/* Clinical Incidents */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2"><AlertCircle size={16} /> Clinical Incidents</h4>
                    <button onClick={() => setShowIncidentForm(!showIncidentForm)} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Plus size={14} /> Log Incident</button>
                </div>
                {showIncidentForm && (
                    <div className="space-y-3 p-4 bg-slate-50 rounded-2xl mb-4">
                        <select value={incidentForm.type} onChange={e => setIncidentForm({ ...incidentForm, type: e.target.value })} className="input"><option>Complication</option><option>Near Miss</option><option>Patient Complaint</option></select>
                        <textarea value={incidentForm.description} onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })} placeholder="Incident Description..." className="input h-20" />
                        <textarea value={incidentForm.actionTaken} onChange={e => setIncidentForm({ ...incidentForm, actionTaken: e.target.value })} placeholder="Immediate Action Taken..." className="input h-20" />
                        <div className="flex justify-end gap-2"><button onClick={() => setShowIncidentForm(false)} className="px-3 py-1 text-xs">Cancel</button><button onClick={handleSaveIncident} className="px-3 py-1 text-xs bg-amber-200 rounded">Save</button></div>
                    </div>
                )}
                {incidents?.filter(i => i.patientId === patient.id).map(inc => (
                    <div key={inc.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                        <strong>{formatDate(inc.date)} - {inc.type}:</strong> {inc.description} (Action: {inc.actionTaken})
                    </div>
                ))}
            </div>

            {/* Outgoing Referrals */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2"><Send size={16} /> Outgoing Referrals</h4>
                    <button onClick={() => setShowReferralForm(!showReferralForm)} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Plus size={14} /> New Referral</button>
                </div>
                {showReferralForm && (
                    <div className="space-y-3 p-4 bg-slate-50 rounded-2xl mb-4">
                        <input value={referralForm.referredTo} onChange={e => setReferralForm({ ...referralForm, referredTo: e.target.value })} placeholder="Referred To (Specialist/Clinic)" className="input" />
                        <textarea value={referralForm.reason} onChange={e => setReferralForm({ ...referralForm, reason: e.target.value })} placeholder="Reason for Referral..." className="input h-20" />
                        <div className="flex justify-end gap-2"><button onClick={() => setShowReferralForm(false)} className="px-3 py-1 text-xs">Cancel</button><button onClick={handleSaveReferral} className="px-3 py-1 text-xs bg-blue-200 rounded">Save</button></div>
                    </div>
                )}
                {referrals?.filter(r => r.patientId === patient.id).map(ref => (
                    <div key={ref.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                        <strong>{formatDate(ref.date)} to {ref.referredTo}:</strong> {ref.reason} (Status: {ref.status})
                    </div>
                ))}
            </div>

            {/* Data Privacy Consent */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Shield size={16} /> Data Privacy Consent</h4>
                <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium">Clinical Data Processing</span>
                        <button onClick={() => onOpenRevocationModal(patient, 'Clinical')} className="text-xs font-bold text-red-600">Revoke</button>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium">Marketing Communications</span>
                        <button onClick={() => onOpenRevocationModal(patient, 'Marketing')} className="text-xs font-bold text-red-600">Revoke</button>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium">Third-Party Data Sharing</span>
                        <button onClick={() => onOpenRevocationModal(patient, 'ThirdParty')} className="text-xs font-bold text-red-600">Revoke</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PatientDetailView: React.FC<PatientDetailViewProps> = (props) => {
  const { patient, stock, onBack, onEditPatient, onQuickUpdatePatient, currentUser, logAction, incidents, onSaveIncident, referrals, onSaveReferral, governanceTrack, onOpenRevocationModal, onOpenMedicoLegalExport, readOnly, sterilizationCycles, appointments, prefill, onClearPrefill, onPrefillNote, onUpdateSettings, onRequestProtocolOverride, onDeleteClinicalNote, onToggleTimeline, onInitiateFinancialConsent, onSupervisorySeal } = props;
  const [activePatientTab, setActivePatientTab] = useState('profile');
  const [activeChartSubTab, setActiveChartSubTab] = useState('odontogram');
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  useEffect(() => {
    // When patient changes, reset the active tab to profile
    setActivePatientTab('profile');
  }, [patient?.id]);

  const handleGenerateSummary = async () => {
    if (!patient) return;
    setIsLoadingSummary(true);
    setSummary('');
    const result = await summarizePatient(patient);
    setSummary(result || '');
    setIsLoadingSummary(false);
  };

  if (!patient) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-white rounded-[3rem] shadow-sm border border-slate-100 text-center p-12 transition-all duration-500">
        <div className="w-24 h-24 bg-teal-50 rounded-[2rem] flex items-center justify-center mb-8 animate-pulse">
            <UserIcon size={48} className="text-teal-200" />
        </div>
        <h3 className="text-3xl font-black text-slate-800 tracking-tight">Clinical Cockpit</h3>
        <p className="text-slate-400 mt-4 max-w-xs leading-relaxed font-medium">Select a patient from the clinical registry to initiate the identity session.</p>
      </div>
    );
  }

  const getCriticalFlags = (p: Patient) => {
    const flags: { type: string; value: string }[] = [];
    const criticalConditions = props.fieldSettings?.criticalRiskRegistry || [];
    (p.allergies || []).forEach(a => { if (a !== 'None') flags.push({ type: 'Allergy', value: a }); });
    (p.medicalConditions || []).forEach(c => { if (c !== 'None') flags.push({ type: 'Condition', value: c }); });
    if (p.registryAnswers?.['Taking Blood Thinners? (Aspirin, Warfarin, etc.)'] === 'Yes') flags.push({ type: 'Alert', value: 'Blood Thinners' });
    return flags;
  };
  
  const handleSaveClearance = (newClearance: Omit<ClearanceRequest, 'id' | 'patientId'>) => {
      const clearanceRequest: ClearanceRequest = {
          ...newClearance,
          id: `cr_${Date.now()}`,
          patientId: patient.id,
      };

      const updatedPatient: Patient = {
          ...patient,
          clearanceRequests: [...(patient.clearanceRequests || []), clearanceRequest],
      };

      onQuickUpdatePatient(updatedPatient);
      logAction('CREATE', 'ClearanceRequest', clearanceRequest.id, `Logged new medical clearance from ${clearanceRequest.doctorName}.`);
      setIsClearanceModalOpen(false);
  };

  const criticalFlags = getCriticalFlags(patient);
  const hasCriticalFlags = criticalFlags.length > 0;
  const isMinor = patient.age !== undefined && patient.age < 18;
  const isPwdOrMinor = patient.isPwd || isMinor;

  const todayStr = new Date().toLocaleDateString('en-CA');
  const activeAppointmentToday = appointments.find(a => 
      a.patientId === patient.id && 
      a.date === todayStr &&
      [AppointmentStatus.SEATED, AppointmentStatus.TREATING].includes(a.status)
  );
  
  const isSafetyClearedForCharting = hasCriticalFlags ? !!activeAppointmentToday?.safetyChecklistVerified : true;

  const headerClasses = `
    backdrop-blur-2xl border-b p-4 shadow-sm shrink-0 z-20 sticky top-0 transition-all duration-500
    ${readOnly
        ? 'bg-slate-600 border-slate-700'
        : hasCriticalFlags 
        ? 'bg-red-200 border-red-300' 
        : isPwdOrMinor 
        ? 'bg-amber-200 border-amber-300' 
        : 'bg-white/80 border-slate-100'}
  `;

  const patientChartTabs = [
    { id: 'profile', label: 'Profile', icon: BookUser },
    { id: 'planning', label: 'Treatments', icon: ClipboardList },
    { id: 'chart', label: 'Charts', icon: BarChart },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'gallery', label: 'Xrays', icon: ImageIcon },
    { id: 'financials', label: 'Ledger', icon: DollarSign },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
  ];

  const chartSubTabs = [
      { id: 'odontogram', label: 'Odontogram', icon: BarChart },
      { id: 'perio', label: 'Perio Matrix', icon: Activity },
  ];

  const renderTabContent = () => {
      switch(activePatientTab) {
          case 'chart':
              return (
                <div className="flex flex-col gap-6">
                    <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm self-start flex gap-2">
                         {chartSubTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveChartSubTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeChartSubTab === tab.id ? 'bg-teal-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-teal-600 border border-slate-200'}`}
                            >
                                <tab.icon size={14}/>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="overflow-hidden rounded-[2.5rem] bg-white border border-slate-100 shadow-inner p-1">
                        {activeChartSubTab === 'odontogram' && (
                            <Odontogram 
                                chart={patient.dentalChart || []} 
                                onToothClick={() => setActivePatientTab('notes')}
                                onChartUpdate={(entry) => {
                                    onQuickUpdatePatient({...patient, dentalChart: [...(patient.dentalChart || []), entry]});
                                    setActivePatientTab('notes');
                                    if (onPrefillNote) {
                                        onPrefillNote(entry);
                                    }
                                }}
                                readOnly={readOnly || !isSafetyClearedForCharting}
                            />
                        )}
                        {activeChartSubTab === 'perio' && (
                            <PerioChart 
                                data={patient.perioChart || []} 
                                onSave={(data) => props.onQuickUpdatePatient({...patient, perioChart: data})}
                                readOnly={readOnly || !isSafetyClearedForCharting}
                            />
                        )}
                    </div>
                </div>
              );
          case 'notes':
              return (
                  <div className="h-[800px] rounded-[3rem] overflow-hidden border border-slate-200">
                    <Odontonotes 
                        entries={patient.dentalChart || []}
                        onAddEntry={(e) => props.onQuickUpdatePatient({...patient, dentalChart: [...(patient.dentalChart || []), e]})}
                        onUpdateEntry={(e) => props.onQuickUpdatePatient({...patient, dentalChart: (patient.dentalChart || []).map(item => item.id === e.id ? e : item)})}
                        onDeleteEntry={(noteId) => onDeleteClinicalNote?.(patient.id, noteId)}
                        currentUser={props.currentUser}
                        procedures={props.fieldSettings?.procedures || []}
                        inventory={stock}
                        patient={patient}
                        logAction={props.logAction}
                        fieldSettings={props.fieldSettings}
                        readOnly={readOnly || !isSafetyClearedForCharting}
                        appointments={props.appointments}
                        sterilizationCycles={sterilizationCycles}
                        prefill={prefill}
                        onClearPrefill={onClearPrefill}
                        onRequestProtocolOverride={onRequestProtocolOverride}
                        onSupervisorySeal={onSupervisorySeal}
                    />
                  </div>
              );
          case 'gallery': return <DiagnosticGallery patient={patient} onQuickUpdatePatient={onQuickUpdatePatient} />;
          case 'planning':
              return (
                  <TreatmentPlanModule 
                      patient={patient}
                      onUpdatePatient={props.onQuickUpdatePatient}
                      currentUser={props.currentUser}
                      logAction={props.logAction}
                      featureFlags={props.fieldSettings?.features}
                      fieldSettings={props.fieldSettings}
                      onOpenRevocationModal={onOpenRevocationModal}
                      readOnly={readOnly}
                      onInitiateFinancialConsent={onInitiateFinancialConsent}
                  />
              );
          case 'financials':
              return (
                  <div className="h-[800px] rounded-[3rem] overflow-hidden border border-slate-200">
                    <PatientLedger 
                        patient={patient}
                        onUpdatePatient={props.onQuickUpdatePatient}
                        fieldSettings={props.fieldSettings}
                        governanceTrack={governanceTrack}
                        readOnly={readOnly}
                        onUpdateSettings={onUpdateSettings}
                    />
                  </div>
              );
          case 'compliance':
              return (
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <button
                            onClick={() => onOpenMedicoLegalExport(patient)}
                            className="bg-red-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-900/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                        >
                            <FileUp size={16}/> Export Medico-Legal Report
                        </button>
                        <PhilHealthCF4Generator 
                            patient={patient} 
                            currentUser={currentUser} 
                            odontogram={patient.dentalChart || []} 
                            appointments={appointments}
                        />
                    </div>
                    <ComplianceTab
                        patient={patient} 
                        incidents={incidents} 
                        onSaveIncident={onSaveIncident} 
                        referrals={referrals} 
                        onSaveReferral={onSaveReferral} 
                        currentUser={currentUser} 
                        onOpenRevocationModal={onOpenRevocationModal}
                    />
                </div>
              );
          case 'profile':
              const medicalQuestions = patient.registryAnswers ? Object.entries(patient.registryAnswers)
                .filter(([q]) => !q.endsWith('_details') && !q.endsWith('_date'))
                .map(([q, a]) => ({ q, a, d: patient.registryAnswers?.[`${q}_details`] }))
                : [];
              
              const sortedClearances = (patient.clearanceRequests || []).sort((a,b) => new Date(b.approvedAt || 0).getTime() - new Date(a.approvedAt || 0).getTime());
              const sixMonthsAgo = new Date();
              sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

              return (
                  <div className="space-y-12 animate-in fade-in duration-500">
                      { (
                          <div className="bg-white p-6 rounded-[2.5rem] border-2 border-teal-50 shadow-sm space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2"><Sparkles size={20} className="text-teal-600"/> Clinical AI Summary</h4>
                              <button onClick={handleGenerateSummary} disabled={isLoadingSummary} className="px-5 py-2.5 bg-teal-50 text-teal-800 rounded-xl font-black uppercase text-[10px] tracking-widest border border-teal-200 hover:bg-teal-100 transition-all flex items-center gap-2 disabled:opacity-50">
                                {isLoadingSummary ? 'Generating...' : 'Regenerate'}
                              </button>
                            </div>
                            {isLoadingSummary && <div className="text-center p-8 text-slate-400 italic">Analyzing patient record...</div>}
                            {summary && <div className="prose prose-sm max-w-none p-4 bg-slate-50 rounded-2xl border border-slate-100"><ReactMarkdown>{summary}</ReactMarkdown></div>}
                          </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InfoItem label="Patient ID" value={patient.id} icon={Shield} />
                        <InfoItem label="Contact" value={patient.phone} icon={Phone} />
                        <InfoItem label="Email" value={patient.email} icon={Mail} />
                        <InfoItem label="Address" value={patient.homeAddress} icon={MapPin} />
                        <InfoItem label="Occupation" value={patient.occupation} icon={Briefcase} />
                        <InfoItem label="Insurance" value={patient.insuranceProvider} icon={Stethoscope} />
                        {criticalFlags.map(f => <InfoItem key={f.value} label={f.type} value={f.value} icon={ShieldAlert} isFlag />)}
                        {isPwdOrMinor && <InfoItem label="Special Status" value={isMinor ? `Minor (Age ${patient.age})` : 'PWD'} icon={isMinor ? Baby : UserIcon} isSpecial />}
                        {patient.guardianProfile && <InfoItem label={`Guardian (${patient.guardianProfile.relationship})`} value={patient.guardianProfile.legalName} icon={BookUser} isSpecial />}
                      </div>
                      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                          <h4 className="font-bold mb-4">Medical Clearances</h4>
                          <button onClick={() => setIsClearanceModalOpen(true)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 mb-4"><Plus size={14}/> Log New Clearance</button>
                          <div className="space-y-2">
                              {sortedClearances.map(c => {
                                  const isExpired = c.approvedAt ? new Date(c.approvedAt) < sixMonthsAgo : true;
                                  return (
                                      <div key={c.id} className={`p-3 rounded-lg border flex justify-between items-center ${isExpired ? 'bg-slate-100' : 'bg-green-50 border-green-200'}`}>
                                          <div className="text-xs">
                                              <span className={`font-black ${isExpired ? 'text-slate-500' : 'text-green-800'}`}>{c.doctorName} ({c.specialty})</span>
                                              <span className="text-slate-500 ml-2">Approved: {formatDate(c.approvedAt)}</span>
                                          </div>
                                          {isExpired && <span className="text-xs font-bold text-red-600">EXPIRED</span>}
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                          <h4 className="font-bold mb-4">Medical Question Registry</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {medicalQuestions.map(({q, a, d}) => (
                                <div key={q} className={`p-3 rounded-lg border ${a === 'Yes' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                                    <p className="text-xs font-bold text-slate-700">{q}</p>
                                    <p className={`font-black text-sm ${a === 'Yes' ? 'text-amber-800' : 'text-slate-500'}`}>{a} {d && <span className="text-xs font-medium text-slate-500 italic">- {d}</span>}</p>
                                </div>
                              ))}
                          </div>
                      </div>
                  </div>
              );
          default:
              return null;
      }
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className={headerClasses}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="bg-white/50 p-3 rounded-2xl shadow-sm hover:bg-white transition-all active:scale-90"><ArrowLeft size={24} className="text-slate-600"/></button>
                    <div className="flex items-center gap-4">
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${patient.name}`} alt={patient.name} className="w-16 h-16 rounded-3xl border-4 border-white shadow-xl" />
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">{patient.name}</h2>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{patient.sex}, {patient.age} y/o</span>
                                {patient.reliabilityScore && <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reliability: {patient.reliabilityScore}%</span>}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onToggleTimeline} className="px-6 py-3 bg-white/50 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-white transition-all flex items-center gap-3"><History size={16}/> Timeline</button>
                    <button onClick={() => onEditPatient(patient)} className="px-6 py-3 bg-white/50 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-white transition-all flex items-center gap-3"><Edit size={16}/> Edit</button>
                    <button onClick={() => props.onBookAppointment(patient.id)} className="px-8 py-4 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-900/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><CalendarPlus size={20}/> Book</button>
                </div>
            </div>
            {hasCriticalFlags && (
                <div className="mt-4 p-3 bg-red-600 text-white rounded-xl flex items-center justify-between shadow-lg animate-pulse">
                    <div className="flex items-center gap-2">
                        <ShieldAlert size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">High-Risk Patient: {criticalFlags.map(f => f.value).join(', ')}</span>
                    </div>
                    {!isSafetyClearedForCharting && <span className="text-xs font-bold">SAFETY CHECKLIST PENDING</span>}
                </div>
            )}
        </div>

        <div className="flex-1 overflow-auto p-8 no-scrollbar bg-slate-50/50">
            <div className="flex items-start gap-8">
                <div className="w-56 shrink-0 sticky top-0">
                    <div className="space-y-2">
                        {patientChartTabs.map(tab => (
                            <button key={tab.id} onClick={() => setActivePatientTab(tab.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left font-black text-xs uppercase tracking-widest transition-all ${activePatientTab === tab.id ? 'bg-teal-900 text-white shadow-xl' : 'hover:bg-white hover:shadow-md'}`}>
                                <tab.icon size={20} className={activePatientTab === tab.id ? 'text-teal-400' : 'text-slate-400'}/>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    {renderTabContent()}
                </div>
            </div>
        </div>

        {isClearanceModalOpen && (
            <ClearanceModal 
                isOpen={isClearanceModalOpen}
                onClose={() => setIsClearanceModalOpen(false)}
                patient={patient}
                currentUser={currentUser}
                onSave={handleSaveClearance}
            />
        )}
    </div>
  );
};

export default PatientDetailView;

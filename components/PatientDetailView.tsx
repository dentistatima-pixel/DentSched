import React, { useState } from 'react';
import { Patient, Appointment, User, FieldSettings, AuditLogEntry, ClinicalIncident, AuthorityLevel, TreatmentPlanStatus } from '../types';
import { ShieldAlert, Phone, Mail, MapPin, Edit, Trash2, CalendarPlus, FileUp, Shield, BarChart, History, FileText, DollarSign, Stethoscope, Briefcase, BookUser, Baby, AlertCircle, Receipt, ClipboardList, User as UserIcon, X, ChevronRight, Download, Sparkles, Heart, Activity, CheckCircle, ImageIcon, Plus, Zap, Camera, Search, UserCheck, ArrowLeft } from 'lucide-react';
import Odontogram from './Odontogram';
import Odontonotes from './Odontonotes';
import PerioChart from './PerioChart';
import TreatmentPlan from './TreatmentPlan';
import PatientLedger from './PatientLedger';
import RegistrationBasicInfo from './RegistrationBasicInfo';
import RegistrationMedical from './RegistrationMedical';
import { formatDate } from '../constants';

interface PatientDetailViewProps {
  patient: Patient | null;
  appointments: Appointment[];
  staff: User[];
  currentUser: User;
  onQuickUpdatePatient: (patient: Patient) => void;
  onBookAppointment: (patientId: string) => void;
  fieldSettings?: FieldSettings; 
  logAction: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
  incidents?: ClinicalIncident[];
  onToggleTimeline?: () => void;
  onBack?: () => void; // New prop for returning to registry
}

const DiagnosticGallery: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
        <div className="bg-slate-900 aspect-video rounded-[2.5rem] border-4 border-teal-500/20 flex flex-col items-center justify-center group hover:border-teal-500 transition-all cursor-zoom-in relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60" />
            <Search size={32} className="text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
            <div className="absolute bottom-6 left-8 z-10">
                <div className="text-[10px] font-black text-teal-400 uppercase tracking-widest">PA X-RAY #16</div>
                <div className="text-white text-xs font-bold uppercase mt-1">May 12, 2024</div>
            </div>
        </div>
        <button className="aspect-video rounded-[2.5rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-300 hover:text-teal-600 hover:border-teal-100 transition-all bg-white shadow-sm">
            <Camera size={48} strokeWidth={1} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Capture Radiograph</span>
        </button>
    </div>
);

const FloatingActionDock: React.FC<{ onAction: (id: string) => void }> = ({ onAction }) => (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-2xl px-8 py-5 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.4)] flex items-center gap-6 z-50 border border-white/10 animate-in slide-in-from-bottom-10 duration-700">
        <button onClick={() => onAction('notes')} className="flex flex-col items-center gap-1.5 group">
            <div className="p-3 bg-white/10 rounded-2xl text-white group-hover:bg-teal-600 transition-all"><Edit size={22}/></div>
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest group-hover:text-teal-400">Add Note</span>
        </button>
        <div className="w-px h-10 bg-white/10" />
        <button onClick={() => onAction('book')} className="flex flex-col items-center gap-1.5 group">
            <div className="p-3 bg-white/10 rounded-2xl text-white group-hover:bg-lilac-600 transition-all"><CalendarPlus size={22}/></div>
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest group-hover:text-lilac-400">Schedule</span>
        </button>
        <div className="w-px h-10 bg-white/10" />
        <button onClick={() => onAction('xray')} className="flex flex-col items-center gap-1.5 group">
            <div className="p-3 bg-white/10 rounded-2xl text-white group-hover:bg-blue-600 transition-all"><Camera size={22}/></div>
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest group-hover:text-blue-400">Capture</span>
        </button>
    </div>
);

const PatientDetailView: React.FC<PatientDetailViewProps> = (props) => {
  const { patient, onBack } = props;
  const [activePatientTab, setActivePatientTab] = useState('profile');
  const [activeChartSubTab, setActiveChartSubTab] = useState('odontogram');

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
    if (p.takingBloodThinners) flags.push({ type: 'Alert', value: 'Blood Thinners' });
    return flags;
  };
  
  const criticalFlags = getCriticalFlags(patient);

  const patientChartTabs = [
    { id: 'profile', label: 'Profile', icon: BookUser },
    { id: 'chart', label: 'Charts', icon: BarChart },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'gallery', label: 'Xrays', icon: ImageIcon },
    { id: 'planning', label: 'Treatments', icon: ClipboardList },
    { id: 'financials', label: 'Ledger', icon: DollarSign }
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
                                onChartUpdate={(entry) => props.onQuickUpdatePatient({...patient, dentalChart: [...(patient.dentalChart || []), entry]})}
                            />
                        )}
                        {activeChartSubTab === 'perio' && (
                            <PerioChart 
                                data={patient.perioChart || []} 
                                onSave={(data) => props.onQuickUpdatePatient({...patient, perioChart: data})}
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
                        currentUser={props.currentUser}
                        procedures={props.fieldSettings?.procedures || []}
                        patient={patient}
                        logAction={props.logAction}
                        fieldSettings={props.fieldSettings}
                    />
                  </div>
              );
          case 'gallery': return <DiagnosticGallery />;
          case 'planning':
              return (
                  <TreatmentPlan 
                      patient={patient}
                      onUpdatePatient={props.onQuickUpdatePatient}
                      currentUser={props.currentUser}
                      logAction={props.logAction}
                      fieldSettings={props.fieldSettings}
                  />
              );
          case 'financials':
              return (
                  <div className="h-[800px] rounded-[3rem] overflow-hidden border border-slate-200">
                    <PatientLedger 
                        patient={patient}
                        onUpdatePatient={props.onQuickUpdatePatient}
                        fieldSettings={props.fieldSettings}
                    />
                  </div>
              );
          case 'profile':
              return (
                  <div className="space-y-12 animate-in fade-in duration-500">
                    {/* Identity Info Promoted */}
                    <div className="bg-white p-12 rounded-[3.5rem] border-2 border-teal-50 shadow-sm space-y-12">
                         <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                            <div className="bg-teal-50 p-3 rounded-2xl text-teal-600"><UserIcon size={32}/></div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Identity Confirmation</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Registry Data Verified: {formatDate(patient.lastDigitalUpdate)}</p>
                            </div>
                         </div>
                         
                         <RegistrationBasicInfo 
                            formData={patient} 
                            handleChange={(e) => props.onQuickUpdatePatient({...patient, [e.target.name]: e.target.value})} 
                            readOnly={true} 
                            fieldSettings={props.fieldSettings!} 
                         />
                         
                         <div className="flex items-center gap-4 border-b border-slate-100 pb-6 pt-6">
                            <div className="bg-lilac-50 p-3 rounded-2xl text-lilac-600"><Heart size={32}/></div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Clinical Risk Assessment</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Self-reported and clinician verified medical history</p>
                            </div>
                         </div>

                         <RegistrationMedical 
                            formData={patient} 
                            handleChange={() => {}} 
                            handleArrayChange={() => {}} 
                            readOnly={true} 
                            fieldSettings={props.fieldSettings!} 
                         />
                    </div>
                  </div>
              );
          default: return null;
      }
  }

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 overflow-hidden relative">
      
      {/* Dynamic Workspace Header */}
      <header className="bg-white/80 backdrop-blur-2xl border-b border-slate-100 p-8 shadow-sm shrink-0 z-20 sticky top-0">
        <div className="flex justify-between items-center max-w-[1400px] mx-auto">
          <div className="flex items-center gap-10">
            <button 
                onClick={onBack}
                className="bg-slate-100 hover:bg-teal-900 hover:text-white p-4 rounded-2xl text-slate-400 transition-all active:scale-90 group"
                title="Back to Registry"
            >
                <ArrowLeft size={32} className="group-hover:-translate-x-1 transition-transform"/>
            </button>

            <div className="relative group">
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${patient.name}`} alt={patient.name} className="w-24 h-24 rounded-[2.5rem] bg-white border-4 border-white shadow-2xl transition-transform group-hover:scale-105 duration-500"/>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-teal-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <CheckCircle size={16} className="text-white"/>
                </div>
            </div>
            <div>
                <div className="flex items-center gap-4">
                    <h2 className="text-6xl font-black text-slate-800 tracking-tighter truncate uppercase leading-none">{patient.name}</h2>
                    <button 
                        onClick={props.onToggleTimeline}
                        className="bg-slate-100 hover:bg-teal-50 p-3 rounded-2xl text-slate-400 hover:text-teal-600 transition-all active:scale-90"
                        title="Open Clinical Timeline"
                    >
                        <History size={28}/>
                    </button>
                </div>
                <div className="flex items-center gap-3 mt-4">
                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest">ID: {patient.id}</span>
                    <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full uppercase tracking-widest border border-teal-100">{patient.age} y/o {patient.sex}</span>
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border ${patient.currentBalance && patient.currentBalance > 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                        Balance: ₱{patient.currentBalance?.toLocaleString()}
                    </span>
                </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
              <div className="hidden xl:flex items-center gap-3">
                  {criticalFlags.slice(0, 3).map((flag, i) => (
                      <div key={i} className="flex items-center gap-2 bg-red-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20 animate-pulse">
                          <ShieldAlert size={14}/> {flag.value}
                      </div>
                  ))}
              </div>
          </div>
        </div>
      </header>

      {/* Cockpit Navigation */}
      <div className="bg-white/50 backdrop-blur-md border-b border-slate-100 px-8 sticky top-[152px] z-10" role="tablist">
          <div className="max-w-[1400px] mx-auto">
              <div className="flex gap-2 -mb-px">
                {patientChartTabs.map(tab => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activePatientTab === tab.id}
                        onClick={() => setActivePatientTab(tab.id)}
                        className={`flex items-center gap-3 px-6 py-5 rounded-t-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 border-b-4 ${activePatientTab === tab.id ? 'border-teal-600 text-teal-900' : 'border-transparent text-slate-500 hover:text-teal-700 hover:border-teal-200'}`}
                    >
                        <tab.icon size={16} strokeWidth={activePatientTab === tab.id ? 3 : 2} className={activePatientTab === tab.id ? 'text-teal-600' : ''}/> 
                        {tab.label}
                    </button>
                ))}
              </div>
          </div>
      </div>

      {/* Main Workspace - Natural Scroll */}
      <main className="flex-1 overflow-y-auto p-12 no-scrollbar scroll-smooth">
          <div className="max-w-[1400px] mx-auto animate-in fade-in zoom-in-[0.98] duration-700 pb-48">
              {renderTabContent()}
          </div>
      </main>

      <FloatingActionDock onAction={(id) => {
          if (id === 'notes') setActivePatientTab('notes');
          if (id === 'book') props.onBookAppointment(patient.id);
          if (id === 'xray') setActivePatientTab('gallery');
      }} />
    </div>
  );
};

export default PatientDetailView;
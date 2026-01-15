import React, { useState } from 'react';
import { Patient, Appointment, User, FieldSettings, AuditLogEntry, ClinicalIncident, AuthorityLevel, TreatmentPlanStatus, ClearanceRequest, Referral } from '../types';
import { ShieldAlert, Phone, Mail, MapPin, Edit, Trash2, CalendarPlus, FileUp, Shield, BarChart, History, FileText, DollarSign, Stethoscope, Briefcase, BookUser, Baby, AlertCircle, Receipt, ClipboardList, User as UserIcon, X, ChevronRight, Download, Sparkles, Heart, Activity, CheckCircle, ImageIcon, Plus, Zap, Camera, Search, UserCheck, ArrowLeft, ShieldCheck, Send } from 'lucide-react';
import Odontogram from './Odontogram';
import Odontonotes from './Odontonotes';
import PerioChart from './PerioChart';
import TreatmentPlan from './TreatmentPlan';
import PatientLedger from './PatientLedger';
import { formatDate } from '../constants';
import ClearanceModal from './ClearanceModal'; // Import the new modal

interface PatientDetailViewProps {
  patient: Patient | null;
  appointments: Appointment[];
  staff: User[];
  currentUser: User;
  onQuickUpdatePatient: (patient: Patient) => void;
  onBookAppointment: (patientId: string) => void;
  onEditPatient: (patient: Patient) => void; 
  fieldSettings?: FieldSettings; 
  logAction: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
  incidents?: ClinicalIncident[];
  onSaveIncident?: (incident: ClinicalIncident) => void;
  referrals?: Referral[];
  onSaveReferral?: (referral: Referral) => void;
  onToggleTimeline?: () => void;
  onBack?: () => void;
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

const PatientDetailView: React.FC<PatientDetailViewProps> = (props) => {
  const { patient, onBack, onEditPatient, onQuickUpdatePatient, currentUser, logAction, incidents, onSaveIncident, referrals, onSaveReferral } = props;
  const [activePatientTab, setActivePatientTab] = useState('profile');
  const [activeChartSubTab, setActiveChartSubTab] = useState('odontogram');
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);

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

  const headerClasses = `
    backdrop-blur-2xl border-b p-4 shadow-sm shrink-0 z-20 sticky top-0 transition-all duration-500
    ${hasCriticalFlags 
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
          case 'compliance':
              return <ComplianceTab patient={patient} incidents={incidents} onSaveIncident={onSaveIncident} referrals={referrals} onSaveReferral={onSaveReferral} currentUser={currentUser} />;
          case 'profile':
              const medicalQuestions = [
                  { q: 'Are you in good health?', a: patient.goodHealth },
                  { q: 'Under medical treatment now?', a: patient.underMedicalTreatment, d: patient.medicalTreatmentDetails },
                  { q: 'Had serious illness or surgical operation?', a: patient.seriousIllness, d: patient.seriousIllnessDetails },
                  { q: 'Ever been hospitalized?', a: patient.lastHospitalizationDetails, d: patient.lastHospitalizationDetails },
                  { q: 'Taking any prescription/non-prescription medication?', a: patient.takingMedications, d: patient.medicationDetails },
                  { q: 'Use tobacco products?', a: patient.tobaccoUse },
                  { q: 'Use alcohol or other dangerous drugs?', a: patient.alcoholDrugsUse },
                  { q: 'Taking Blood Thinners?', a: patient.takingBloodThinners },
                  { q: 'Taking Bisphosphonates?', a: patient.takingBisphosphonates },
                  { q: 'Pregnant?', a: patient.pregnant },
                  { q: 'Nursing?', a: patient.nursing },
                  { q: 'Taking birth control pills?', a: patient.birthControl },
              ];
              
              const sortedClearances = (patient.clearanceRequests || []).sort((a,b) => new Date(b.approvedAt || 0).getTime() - new Date(a.approvedAt || 0).getTime());
              const sixMonthsAgo = new Date();
              sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

              return (
                  <div className="space-y-12 animate-in fade-in duration-500">
                      <div className="bg-white p-12 rounded-[3.5rem] border-2 border-teal-50 shadow-sm space-y-12">

                          {/* I. Clinical Risk & Physician Profile */}
                          <div>
                              <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-8">
                                  <div className="bg-lilac-50 p-3 rounded-2xl text-lilac-600"><Heart size={32}/></div>
                                  <div>
                                      <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">I. Clinical Risk & Physician Profile</h3>
                                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Self-reported and clinician verified medical history</p>
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  <InfoItem label="Allergies" value={patient.allergies?.length ? patient.allergies : 'None'} icon={AlertCircle} isFlag={(patient.allergies?.length || 0) > 1 || patient.allergies?.[0] !== 'None'} />
                                  <InfoItem label="Other Reported Allergies" value={patient.otherAllergies} icon={AlertCircle} isFlag={!!patient.otherAllergies} />
                                  <InfoItem label="Medical Conditions" value={patient.medicalConditions?.length ? patient.medicalConditions : 'None'} icon={ShieldAlert} isFlag={(patient.medicalConditions?.length || 0) > 1 || patient.medicalConditions?.[0] !== 'None'} />
                                  {medicalQuestions.map((item, index) => {
                                      const displayValue = typeof item.a === 'boolean' ? (item.a ? 'Yes' : 'No') : item.a || 'No Answer';
                                      const fullValue = item.d ? `${displayValue} - ${item.d}` : displayValue;
                                      return (
                                          <InfoItem key={index} label={item.q} value={fullValue} isFlag={item.a === true || (typeof item.a === 'string' && item.a.length > 0)} />
                                      );
                                  })}
                                  <InfoItem label="Physician Name" value={patient.physicianName} icon={UserIcon} />
                                  <InfoItem label="Physician Specialty" value={patient.physicianSpecialty} icon={Stethoscope} />
                                  <InfoItem label="Physician Address" value={patient.physicianAddress} icon={MapPin} />
                                  <InfoItem label="Physician Number" value={patient.physicianNumber} icon={Phone} />
                              </div>
                              
                              <div className="mt-12 pt-8 border-t border-slate-100">
                                <div className="flex justify-between items-center mb-6">
                                  <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2"><ShieldCheck size={20} className="text-lilac-600"/> Medical Clearance Registry</h4>
                                  <button onClick={() => setIsClearanceModalOpen(true)} className="px-5 py-2.5 bg-lilac-50 text-lilac-800 rounded-xl font-black uppercase text-[10px] tracking-widest border border-lilac-200 hover:bg-lilac-100 transition-all flex items-center gap-2"><Plus size={14}/> Log New Clearance</button>
                                </div>
                                <div className="space-y-3">
                                  {sortedClearances.map(cr => {
                                      const isExpired = !cr.approvedAt || new Date(cr.approvedAt) < sixMonthsAgo;
                                      return (
                                        <div key={cr.id} className={`p-5 rounded-2xl border-2 flex items-center justify-between group ${isExpired ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-teal-50 border-teal-200 shadow-sm'}`}>
                                          <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${isExpired ? 'bg-slate-200 text-slate-500' : 'bg-teal-600 text-white shadow-lg'}`}><FileText size={20}/></div>
                                            <div>
                                              <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{cr.doctorName} ({cr.specialty})</div>
                                              <div className="text-xs text-slate-500 font-bold mt-1">Verified by: {cr.verifiedByPractitionerName}</div>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isExpired ? 'bg-white border-slate-200 text-slate-500' : 'bg-white border-teal-200 text-teal-700'}`}>
                                              {isExpired ? 'Expired' : 'Valid'}
                                            </div>
                                            <div className="text-[10px] font-black text-slate-400 mt-1">Approved: {formatDate(cr.approvedAt)}</div>
                                          </div>
                                        </div>
                                      );
                                  })}
                                  {sortedClearances.length === 0 && <p className="text-center text-xs text-slate-400 italic font-bold p-10 bg-slate-50 rounded-2xl border-dashed">No clearance records on file.</p>}
                                </div>
                              </div>
                          </div>

                          {/* II. Dental History */}
                          <div>
                              <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-8 pt-8">
                                  <div className="bg-teal-50 p-3 rounded-2xl text-teal-600"><Briefcase size={32}/></div>
                                  <div>
                                      <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">II. Dental History</h3>
                                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Previous Dental Care</p>
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  <InfoItem label="Previous Dentist" value={patient.previousDentist} icon={Briefcase} />
                                  <InfoItem label="Last Dental Visit" value={patient.lastVisit} icon={CalendarPlus} />
                              </div>
                          </div>
                          
                          {/* III. Patient Identity & Contact */}
                          <div>
                              <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-8 pt-8">
                                  <div className="bg-teal-50 p-3 rounded-2xl text-teal-600"><UserIcon size={32}/></div>
                                  <div>
                                      <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">III. Patient Identity & Contact</h3>
                                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Registry Data Verified: {formatDate(patient.lastDigitalUpdate)}</p>
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  <InfoItem label="Full Name" value={patient.name} icon={UserIcon} isSpecial={isPwdOrMinor} />
                                  <InfoItem label="Birth Date" value={formatDate(patient.dob)} icon={CalendarPlus} isSpecial={isPwdOrMinor} />
                                  <InfoItem label="Age" value={patient.age} isSpecial={isPwdOrMinor} />
                                  <InfoItem label="Sex" value={patient.sex} />
                                  <InfoItem label="Civil Status" value={patient.civilStatus} />
                                  <InfoItem label="Blood Group" value={patient.bloodGroup} icon={AlertCircle} isFlag={!!patient.bloodGroup} />
                                  <InfoItem label="Mobile" value={patient.phone} icon={Phone} />
                                  <InfoItem label="Email" value={patient.email} icon={Mail} />
                                  <InfoItem label="Address" value={patient.homeAddress} icon={MapPin} />
                                  <InfoItem label="Occupation" value={patient.occupation} icon={Briefcase} />
                              </div>
                          </div>

                      </div>
                  </div>
              );
          default: return null;
      }
  }

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 overflow-hidden relative">
      
      <ClearanceModal 
        isOpen={isClearanceModalOpen}
        onClose={() => setIsClearanceModalOpen(false)}
        onSave={handleSaveClearance}
        patient={patient}
        currentUser={currentUser}
      />

      {/* Dynamic Workspace Header */}
      <header className={headerClasses}>
        <div className="flex justify-between items-center max-w-[1400px] mx-auto">
          <div className="flex items-center gap-4">
            <button 
                onClick={onBack}
                className="bg-slate-100 hover:bg-teal-900 hover:text-white p-3 rounded-2xl text-slate-400 transition-all active:scale-90 group"
                title="Back to Registry"
            >
                <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform"/>
            </button>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter truncate uppercase leading-none">{patient.name}</h2>
            <button 
                onClick={() => onEditPatient(patient)}
                className="bg-slate-100 hover:bg-teal-50 p-2 rounded-xl text-slate-400 hover:text-teal-600 transition-all active:scale-90"
                title="Edit Patient Details"
            >
                <Edit size={20}/>
            </button>
            <button 
                onClick={props.onToggleTimeline}
                className="bg-slate-100 hover:bg-teal-50 p-2 rounded-xl text-slate-400 hover:text-teal-600 transition-all active:scale-90"
                title="Open Clinical Timeline"
            >
                <History size={20}/>
            </button>
          </div>

          <div className="flex items-center gap-12">
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                  <div className="flex items-center gap-2 text-sm">
                      <span className="font-black text-slate-400 uppercase tracking-widest">PAT ID -</span>
                      <span className="font-mono font-black text-slate-700">{patient.id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                      <Phone size={14} className="text-slate-400"/>
                      <span className="font-mono font-black text-slate-700">{patient.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                      <span className="font-black text-slate-400 uppercase tracking-widest">AGE -</span>
                      <span className="font-black text-slate-700">{patient.age} {patient.sex?.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                      <span className="font-black text-slate-400 uppercase tracking-widest">BAL -</span>
                      <span className={`font-black ${patient.currentBalance && patient.currentBalance > 0 ? 'text-red-600' : 'text-teal-600'}`}>
                          ₱{patient.currentBalance?.toLocaleString() || '0'}
                      </span>
                  </div>
              </div>

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
      <div className="bg-white/50 backdrop-blur-md border-b border-slate-100 px-8 sticky top-[80px] z-10" role="tablist">
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

    </div>
  );
};


const ComplianceTab: React.FC<{
    patient: Patient;
    incidents?: ClinicalIncident[];
    onSaveIncident?: (incident: ClinicalIncident) => void;
    referrals?: Referral[];
    onSaveReferral?: (referral: Referral) => void;
    currentUser: User;
}> = ({ patient, incidents = [], onSaveIncident, referrals = [], onSaveReferral, currentUser }) => {
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Clinical Incidents */}
            <div className="bg-white p-10 rounded-[3.5rem] border-2 border-red-50 shadow-sm space-y-8">
                <div className="flex items-center gap-4 border-b border-red-100 pb-6">
                    <div className="bg-red-50 p-3 rounded-2xl text-red-600"><AlertCircle size={32}/></div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Clinical Incidents</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Medico-Legal Event Log</p>
                    </div>
                </div>
                {/* Add Incident Form will go here */}
            </div>

            {/* Referrals */}
            <div className="bg-white p-10 rounded-[3.5rem] border-2 border-blue-50 shadow-sm space-y-8">
                 <div className="flex items-center gap-4 border-b border-blue-100 pb-6">
                    <div className="bg-blue-50 p-3 rounded-2xl text-blue-600"><Send size={32}/></div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Referral Tracker</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Continuity of Care Monitor</p>
                    </div>
                </div>
                 {/* Add Referral Form will go here */}
            </div>
        </div>
    )
};

export default PatientDetailView;
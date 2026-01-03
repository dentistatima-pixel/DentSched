import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, TrendingUp, Search, UserPlus, ChevronRight, CalendarPlus, ClipboardList, Beaker, 
  Repeat, ArrowRight, HeartPulse, PieChart, Activity, DollarSign, FileText, StickyNote, 
  Package, Sunrise, AlertCircle, Plus, CheckCircle, Circle, Trash2, Flag, User as UserIcon, 
  Building2, MapPin, Inbox, FileSignature, Video, ShieldAlert, Award, ShieldCheck, Phone, 
  Mail, Zap, X, AlertTriangle, ShieldX, Thermometer, Users, Eye, EyeOff, LayoutGrid, Clock, List, 
  History, Timer, Lock, Send, Armchair, Scale, Target, RefreshCcw, CloudOff, Database, ShieldCheck as VerifiedIcon, UserCheck, Stethoscope, FileWarning, MessageCircle, Heart
} from 'lucide-react';
import { 
  Appointment, AppointmentStatus, User, UserRole, Patient, LabStatus, FieldSettings, 
  PinboardTask, TreatmentPlanStatus, RecallStatus, SterilizationCycle, StockItem, TriageLevel, AuditLogEntry, ClinicResource, StockCategory, SyncConflict, SystemStatus 
} from '../types';
import Fuse from 'fuse.js';
import ConsentCaptureModal from './ConsentCaptureModal';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';

interface DashboardProps {
  appointments: Appointment[];
  allAppointments?: Appointment[];
  patientsCount: number;
  staffCount: number;
  staff?: User[];
  currentUser: User;
  patients: Patient[];
  onAddPatient: () => void;
  onPatientSelect: (patientId: string) => void;
  onBookAppointment: (patientId?: string) => void;
  onUpdateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onCompleteRegistration: (patientId: string) => void;
  onUpdatePatientRecall?: (patientId: string, status: RecallStatus) => void; 
  fieldSettings?: FieldSettings;
  onUpdateSettings?: (s: FieldSettings) => void;
  onViewAllSchedule?: () => void; 
  onChangeBranch?: (branch: string) => void;
  currentBranch: string;
  tasks?: PinboardTask[];
  onAddTask?: (text: string, isUrgent: boolean, assignedTo: string) => void;
  onToggleTask?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
  onSaveConsent: (appointmentId: string, consentUrl: string) => void;
  onQuickQueue?: (name: string, phone: string, complaint: string, triageLevel: TriageLevel) => void;
  auditLogVerified?: boolean | null;
  sterilizationCycles?: SterilizationCycle[];
  stock?: StockItem[];
  auditLog?: AuditLogEntry[];
  logAction?: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
  syncConflicts?: SyncConflict[];
  setSyncConflicts?: (c: SyncConflict[]) => void;
  systemStatus?: SystemStatus;
  onSwitchSystemStatus?: (status: SystemStatus) => void;
  onVerifyDowntimeEntry?: (id: string) => void;
  onVerifyMedHistory?: (appointmentId: string) => void;
  onConfirmFollowUp?: (appointmentId: string) => void;
}

interface ComplianceAlert {
    id: string;
    userId: string;
    userName: string;
    type: string;
    daysLeft: number;
    severity: 'low' | 'med' | 'high' | 'critical';
    isAcknowledged: boolean;
}

const TOLERANCE_MAP: Record<StockCategory, number> = {
    [StockCategory.CONSUMABLES]: 0.10,
    [StockCategory.RESTORATIVE]: 0.05,
    [StockCategory.INSTRUMENTS]: 0,
    [StockCategory.PROSTHODONTIC]: 0,
    [StockCategory.OFFICE]: 0.10
};

const MetricCard = ({ icon: Icon, color, label, value, subtext }: { icon: any, color: string, label: string, value: string, subtext?: string }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
    <div className={`p-4 rounded-2xl ${color} transition-transform group-hover:scale-110 duration-300`}>
      <Icon size={24} />
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
      <span className="text-3xl font-black text-slate-800 tracking-tight">{value}</span>
      {subtext && <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{subtext}</span>}
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ 
  appointments, allAppointments = [], patientsCount, staffCount, staff = [], currentUser, patients, onAddPatient, onPatientSelect, onBookAppointment,
  onUpdateAppointmentStatus, onCompleteRegistration, onUpdatePatientRecall, fieldSettings, onUpdateSettings, onViewAllSchedule, onChangeBranch, currentBranch,
  tasks = [], onAddTask, onToggleTask, onDeleteTask, onSaveConsent, onQuickQueue, auditLogVerified, sterilizationCycles = [], stock = [], auditLog = [], logAction,
  syncConflicts = [], setSyncConflicts, systemStatus = SystemStatus.OPERATIONAL, onSwitchSystemStatus, onVerifyDowntimeEntry, onVerifyMedHistory, onConfirmFollowUp
}) => {
  const toast = useToast();
  const [privacyMode, setPrivacyMode] = useState(false);
  
  const today = new Date().toLocaleDateString('en-CA');

  const getPatient = (id: string) => patients.find(pt => pt.id === id);

  const todaysAppointments = useMemo(() => appointments.filter(a => a.date === today && !a.isBlock), [appointments, today]);

  const postOpPatients = useMemo(() => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600000).toISOString();
    return allAppointments.filter(a => 
        ['Surgery', 'Extraction'].includes(a.type) && 
        a.status === AppointmentStatus.COMPLETED &&
        a.date >= twentyFourHoursAgo.split('T')[0] &&
        !a.followUpConfirmed
    );
  }, [allAppointments]);

  const highRiskDiagnosticGaps = useMemo(() => {
    return patients.filter(p => {
        const hasLevel1Trauma = appointments.some(a => a.patientId === p.id && a.triageLevel === 'Level 1: Trauma/Bleeding');
        const hasSurgicalPlan = (p.dentalChart || []).some(e => e.status === 'Planned' && e.procedure.toLowerCase().includes('surgery'));
        const hasXRay = (p.files || []).some(f => f.category === 'X-Ray');
        return (hasLevel1Trauma || hasSurgicalPlan) && !hasXRay;
    });
  }, [patients, appointments]);

  const realityScore = useMemo(() => {
    if (!stock || stock.length === 0) return 100;
    const branchStock = stock.filter(s => s.branch === currentBranch || !s.branch);
    if (branchStock.length === 0) return 100;
    const withinTolerance = branchStock.filter(s => {
        if (s.physicalCount === undefined) return true;
        const diff = Math.abs(s.quantity - s.physicalCount);
        const toleranceVal = s.quantity * (TOLERANCE_MAP[s.category] || 0);
        return diff <= toleranceVal;
    }).length;
    return Math.round((withinTolerance / branchStock.length) * 100);
  }, [stock, currentBranch]);

  const roleKPIs = useMemo(() => {
    const currentYear = new Date().getFullYear();
    
    const practiceProductionYTD = allAppointments
      .filter(a => a.status === AppointmentStatus.COMPLETED && new Date(a.date).getFullYear() === currentYear)
      .reduce((sum, apt) => {
        const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
        return sum + (proc?.price || 0);
      }, 0);

    let totalPlanned = 0;
    let totalAccepted = 0;
    patients.forEach(p => {
      p.dentalChart?.forEach(item => {
        if (item.status === 'Planned') totalPlanned++;
        if (item.status === 'Completed' && item.planId) totalAccepted++;
      });
    });
    const acceptanceRate = totalPlanned > 0 ? Math.round((totalAccepted / (totalPlanned + totalAccepted)) * 100) : 0;
    const totalARAging = patients.reduce((s, p) => s + (p.currentBalance || 0), 0);

    const completedToday = todaysAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    const shiftFlow = todaysAppointments.length > 0 ? Math.round((completedToday / todaysAppointments.length) * 100) : 0;
    const queueLatency = todaysAppointments.some(a => a.status === AppointmentStatus.ARRIVED) ? "14m" : "0m";

    return {
      admin: { production: `₱${(practiceProductionYTD / 1000).toFixed(1)}k`, acceptance: `${acceptanceRate}%`, aging: `₱${(totalARAging / 1000).toFixed(1)}k` },
      assistant: { latency: queueLatency, integrity: `${realityScore}%`, flow: `${shiftFlow}%` }
    };
  }, [allAppointments, todaysAppointments, patients, fieldSettings, currentUser, realityScore]);

  const complianceAlerts = useMemo(() => {
    const alerts: ComplianceAlert[] = [];
    const now = new Date();
    staff.forEach(s => {
      if (s.role === UserRole.DENTIST && s.prcExpiry) {
        const expiry = new Date(s.prcExpiry);
        const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (diff <= 60) {
          const alertId = `prc-${s.id}-${s.prcExpiry}`;
          const isAck = fieldSettings?.acknowledgedAlertIds?.includes(alertId) || false;
          let severity: ComplianceAlert['severity'] = diff <= 0 ? 'critical' : diff <= 15 ? 'high' : diff <= 30 ? 'med' : 'low';
          alerts.push({ id: alertId, userId: s.id, userName: s.name, type: 'PRC License', daysLeft: diff, severity, isAcknowledged: isAck });
        }
      }
    });
    return alerts;
  }, [staff, fieldSettings, currentUser]);

  const handleAcknowledgeAlert = (alertId: string) => {
    if (!onUpdateSettings || !fieldSettings) return;
    const newAcks = [...(fieldSettings.acknowledgedAlertIds || []), alertId];
    onUpdateSettings({ ...fieldSettings, acknowledgedAlertIds: newAcks });
  };

  const receptionPatientFlow = useMemo(() => {
    const arriving = todaysAppointments.filter(a => [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.ARRIVED].includes(a.status));
    const inTreatment = todaysAppointments.filter(a => [AppointmentStatus.SEATED, AppointmentStatus.TREATING].includes(a.status));
    const readyForBilling = todaysAppointments.filter(a => [AppointmentStatus.COMPLETED].includes(a.status));
    return { arriving, inTreatment, readyForBilling };
  }, [todaysAppointments]);

  const renderUnifiedKPIs = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard icon={TrendingUp} color="bg-teal-50 text-teal-600" label="Practice Production (YTD)" value={roleKPIs.admin.production} subtext="Gross Economic Value" />
        <MetricCard icon={Clock} color="bg-blue-50 text-blue-600" label="Queue Latency" value={roleKPIs.assistant.latency} subtext="Avg. Time Arrived to Seated" />
        <MetricCard icon={Scale} color="bg-teal-50 text-teal-600" label="Inventory Integrity" value={roleKPIs.assistant.integrity} subtext="PIC Audit Accuracy" />
        <MetricCard icon={Activity} color="bg-orange-50 text-orange-600" label="Shift Flow" value={roleKPIs.assistant.flow} subtext="Completed vs. Scheduled" />
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div><h2 className="text-xs font-black text-teal-600 uppercase tracking-widest mb-1">Unified Control Center</h2><h1 className="text-3xl font-black text-slate-800 tracking-tight">Practice Dashboard</h1></div>
        <div className="flex items-center gap-3">
            <button 
                onClick={onAddPatient}
                className="bg-teal-600 text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:scale-105 transition-all flex items-center gap-2"
            >
                <UserPlus size={18}/> New Patient
            </button>
            <button 
                onClick={() => onBookAppointment()}
                className="bg-lilac-600 text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-lilac-600/20 hover:scale-105 transition-all flex items-center gap-2"
            >
                <CalendarPlus size={18}/> Book Session
            </button>
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2 ml-2"><MapPin size={16} className="text-teal-500"/><span className="text-xs font-black text-slate-700 uppercase">{currentBranch}</span></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4 animate-in slide-in-from-top-4 mb-2">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl"><Zap size={20}/></div>
          <div className="flex-1">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinic Operations Action Center</h4>
              <div className="flex gap-4 mt-2">
                  <button onClick={onAddPatient} className="text-sm font-bold text-teal-700 hover:underline flex items-center gap-1.5"><Plus size={14}/> Register Patient</button>
                  <button onClick={() => onBookAppointment()} className="text-sm font-bold text-lilac-700 hover:underline flex items-center gap-1.5"><Calendar size={14}/> Schedule Procedure</button>
                  <button onClick={onViewAllSchedule} className="text-sm font-bold text-slate-600 hover:underline flex items-center gap-1.5"><List size={14}/> View All Active Slots</button>
              </div>
          </div>
      </div>

      <div className="space-y-6">
        {renderUnifiedKPIs()}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ARRIVING SOON COLUMN */}
          <div className="lg:col-span-3 bg-slate-100/50 rounded-[2.5rem] p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center px-2"><h4 className="font-black text-slate-500 uppercase tracking-widest text-[10px] flex items-center gap-2"><Clock size={16}/> Queue Monitor</h4></div>
            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar max-h-[400px]">
              {receptionPatientFlow.arriving.map(apt => (
                  <div key={apt.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200">
                      <div className="flex justify-between items-center mb-2"><span className="font-mono font-black text-teal-600 text-xs">{apt.time}</span></div>
                      <div className="font-bold text-slate-800 text-sm truncate">{getPatient(apt.patientId)?.name || 'Unknown'}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase mt-1">{apt.type}</div>
                      {apt.status === AppointmentStatus.ARRIVED && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                              <button onClick={() => onVerifyMedHistory?.(apt.id)} className={`w-full py-2 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 transition-all ${apt.medHistoryVerified ? 'bg-teal-50 text-teal-600 border border-teal-100' : 'bg-lilac-600 text-white shadow-lg'}`}>{apt.medHistoryVerified ? <CheckCircle size={10}/> : <Stethoscope size={10}/>} {apt.medHistoryVerified ? 'Verified' : 'Verify History'}</button>
                          </div>
                      )}
                  </div>
              ))}
            </div>
          </div>

          {/* IN TREATMENT / CENTER COLUMN */}
          <div className="lg:col-span-5 bg-teal-50 rounded-[2.5rem] p-4 flex flex-col gap-4 border border-teal-100/50">
              <div className="flex justify-between items-center px-2"><h4 className="font-black text-teal-700 uppercase tracking-widest text-[10px] flex items-center gap-2"><Activity size={16}/> Active Operatories</h4></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto no-scrollbar max-h-[400px]">
                  {receptionPatientFlow.inTreatment.map(apt => (
                      <div key={apt.id} className="bg-white p-5 rounded-[2rem] shadow-sm border-2 border-teal-200">
                          <div className="flex justify-between items-start mb-2"><div className="font-bold text-slate-800 leading-tight">{getPatient(apt.patientId)?.name || 'Unknown'}</div>{apt.medHistoryVerified && <VerifiedIcon size={14} className="text-teal-500"/>}</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase mt-1">{apt.type}</div>
                          <div className="mt-3 text-[9px] font-black text-teal-600 uppercase flex items-center gap-1"><Timer size={10}/> Seated: {apt.time}</div>
                      </div>
                  ))}
              </div>
          </div>

          {/* POST-OP VIGILANCE / RIGHT COLUMN */}
          <div className="lg:col-span-4 bg-lilac-50 rounded-[2.5rem] p-6 flex flex-col gap-4 border border-lilac-100/50 overflow-hidden">
              <div className="flex justify-between items-center"><h4 className="font-black text-lilac-700 uppercase tracking-widest text-[10px] flex items-center gap-2"><ShieldAlert size={18}/> Post-Op Vigilance (24h)</h4><span className="text-[9px] font-black bg-lilac-600 text-white px-2 py-0.5 rounded-full">{postOpPatients.length} Pending</span></div>
              <p className="text-[10px] text-lilac-600 font-bold uppercase leading-tight mb-2">Standard of Care: Patients requiring 24h follow-up following surgery.</p>
              <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar max-h-[300px]">
                  {postOpPatients.length > 0 ? postOpPatients.map(apt => (
                      <div key={apt.id} className="bg-white p-5 rounded-[2rem] border-2 border-lilac-200 shadow-sm animate-in slide-in-from-right-4">
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <div className="font-black text-slate-800 text-sm uppercase leading-tight">{getPatient(apt.patientId)?.name}</div>
                                  <p className="text-[9px] text-lilac-600 font-bold uppercase mt-0.5">{apt.type} compl. {formatDate(apt.date)}</p>
                              </div>
                              <div className="p-2 bg-lilac-50 rounded-xl text-lilac-700"><MessageCircle size={18}/></div>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={() => window.open(`tel:${getPatient(apt.patientId)?.phone}`)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 hover:bg-slate-200"><Phone size={10}/> Call</button>
                              <button 
                                  onClick={() => onConfirmFollowUp?.(apt.id)}
                                  className="flex-[2] py-2.5 bg-lilac-600 text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 shadow-lg shadow-lilac-600/20 hover:bg-lilac-700 transition-all"
                              >
                                  <Heart size={10} fill="currentColor"/> Log Follow-up
                              </button>
                          </div>
                      </div>
                  )) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                          <VerifiedIcon size={64} className="text-lilac-400 mb-4" />
                          <p className="text-[10px] font-black text-lilac-700 uppercase tracking-widest">Follow-ups Current</p>
                      </div>
                  )}
              </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2 mb-4"><FileWarning size={16}/> Diagnostic Yield Monitor</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {highRiskDiagnosticGaps.length > 0 ? highRiskDiagnosticGaps.map(p => (
                        <div key={p.id} onClick={() => onPatientSelect(p.id)} className="p-4 rounded-2xl bg-orange-50 border-2 border-orange-200 flex items-start gap-4 cursor-pointer hover:bg-orange-100 transition-all group">
                             <div className="p-2 bg-white rounded-xl text-orange-600 shadow-sm group-hover:scale-110 transition-transform"><ShieldAlert size={20}/></div>
                             <div><div className="font-black text-orange-900 text-xs uppercase">{p.name}</div><p className="text-[9px] text-orange-700 font-bold uppercase mt-1">Surgical items planned without documented X-Ray justification (Rule 9).</p></div>
                        </div>
                    )) : (
                        <div className="col-span-full bg-slate-50 p-6 rounded-[2rem] border border-slate-200 text-center py-12">
                            <ShieldCheck size={48} className="text-teal-500 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-teal-800 uppercase tracking-widest">Diagnostic Coverage Validated</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="xl:col-span-4 bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-xl">
               <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg flex items-center gap-2 text-teal-400"><ShieldCheck size={20}/> Compliance Pulse</h3></div>
               <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                  {complianceAlerts.map((alert) => (
                      <div key={alert.id} className={`p-4 border-2 rounded-2xl flex flex-col gap-3 transition-all ${alert.severity === 'critical' ? 'border-red-600 bg-red-600/10' : 'border-amber-500 bg-amber-500/10'} ${alert.isAcknowledged ? 'opacity-40' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-white/10 shrink-0"><Award size={20}/></div>
                          <div className="flex-1"><div className="font-black text-sm">{alert.userName}</div><div className="text-[10px] font-bold uppercase text-white/60">{alert.type} expiring in {alert.daysLeft}d</div></div>
                        </div>
                        {!alert.isAcknowledged && <button onClick={() => handleAcknowledgeAlert(alert.id)} className="w-full py-2 bg-lilac-600 text-white text-[9px] font-black uppercase rounded-lg shadow-lg">Acknowledge</button>}
                      </div>
                  ))}
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
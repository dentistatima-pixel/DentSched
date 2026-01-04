
import React, { useState, useMemo, useEffect } from 'react';
/* Fix: Added missing 'Sparkles' and 'Shield' to lucide-react imports */
import { 
  Calendar, TrendingUp, Search, UserPlus, ChevronRight, CalendarPlus, ClipboardList, Beaker, 
  Repeat, ArrowRight, HeartPulse, PieChart, Activity, DollarSign, FileText, StickyNote, 
  Package, Sunrise, AlertCircle, Plus, CheckCircle, Circle, Trash2, Flag, User as UserIcon, 
  Building2, MapPin, Inbox, FileSignature, Video, ShieldAlert, Award, ShieldCheck, Phone, 
  Mail, Zap, X, AlertTriangle, ShieldX, Thermometer, Users, Eye, EyeOff, LayoutGrid, Clock, List, 
  History, Timer, Lock, Send, Armchair, Scale, Target, RefreshCcw, CloudOff, Database, ShieldCheck as VerifiedIcon, UserCheck, Stethoscope, FileWarning, MessageCircle, Heart, Info, DollarSign as FinanceIcon, Sparkles, Shield
} from 'lucide-react';
import { 
  Appointment, AppointmentStatus, User, UserRole, Patient, LabStatus, FieldSettings, 
  PinboardTask, TreatmentPlanStatus, RecallStatus, SterilizationCycle, StockItem, TriageLevel, AuditLogEntry, ClinicResource, StockCategory, SyncConflict, SystemStatus 
} from '../types';
import Fuse from 'fuse.js';
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
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex items-center gap-6 group hover:shadow-xl hover:border-teal-100 transition-all duration-500">
    <div className={`p-5 rounded-[1.5rem] ${color} transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500 shadow-lg shadow-current/10`}>
      <Icon size={32} />
    </div>
    <div className="flex flex-col">
      <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">{label}</span>
      <span className="text-4xl font-black text-slate-800 tracking-tighter">{value}</span>
      {subtext && <span className="text-[10px] font-black text-teal-600 mt-2 uppercase tracking-widest">{subtext}</span>}
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
  const [activeHuddleId, setActiveHuddleId] = useState<string | null>(null);

  /* Fix: Implemented handleAcknowledgeAlert function */
  const handleAcknowledgeAlert = (alertId: string) => {
    if (fieldSettings && onUpdateSettings) {
      const currentAcks = fieldSettings.acknowledgedAlertIds || [];
      if (!currentAcks.includes(alertId)) {
        onUpdateSettings({
          ...fieldSettings,
          acknowledgedAlertIds: [...currentAcks, alertId]
        });
        toast.info("Alert acknowledged.");
      }
    }
  };
  
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

    const completedToday = todaysAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    const shiftFlow = todaysAppointments.length > 0 ? Math.round((completedToday / todaysAppointments.length) * 100) : 0;
    const queueLatency = todaysAppointments.some(a => a.status === AppointmentStatus.ARRIVED) ? "14m" : "0m";

    return {
      production: `₱${(practiceProductionYTD / 1000).toFixed(1)}k`,
      latency: queueLatency,
      integrity: `${realityScore}%`,
      flow: `${shiftFlow}%`
    };
  }, [allAppointments, todaysAppointments, fieldSettings, realityScore]);

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
    return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [staff, fieldSettings]);

  const receptionPatientFlow = useMemo(() => {
    const arriving = todaysAppointments.filter(a => [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.ARRIVED].includes(a.status));
    const inTreatment = todaysAppointments.filter(a => [AppointmentStatus.SEATED, AppointmentStatus.TREATING].includes(a.status));
    const readyForBilling = todaysAppointments.filter(a => [AppointmentStatus.COMPLETED].includes(a.status));
    return { arriving, inTreatment, readyForBilling };
  }, [todaysAppointments]);

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      
      {/* Dynamic Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h2 className="text-xs font-black text-teal-600 uppercase tracking-[0.3em] mb-2 flex items-center gap-2"><Sparkles size={14}/> Practice Intelligence Hub</h2>
            <h1 className="text-5xl font-black text-slate-800 tracking-tighter leading-none">Command Center</h1>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={onAddPatient}
                className="bg-white text-teal-700 border-2 border-teal-100 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-500/5 hover:scale-105 hover:bg-teal-50 transition-all flex items-center gap-3"
            >
                <UserPlus size={20}/> New Admission
            </button>
            <button 
                onClick={() => onBookAppointment()}
                className="bg-lilac-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-lilac-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
                <CalendarPlus size={20}/> Book Session
            </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricCard icon={TrendingUp} color="bg-teal-50 text-teal-600" label="Production Yield (YTD)" value={roleKPIs.production} subtext="Gross Economic Value" />
        <MetricCard icon={Clock} color="bg-blue-50 text-blue-600" label="Queue Latency" value={roleKPIs.latency} subtext="Avg. Time to Chair" />
        <MetricCard icon={Scale} color="bg-orange-50 text-orange-600" label="Inventory Integrity" value={roleKPIs.integrity} subtext="Forensic PIC Audit" />
        <MetricCard icon={Activity} color="bg-lilac-50 text-lilac-600" label="Operational Flow" value={roleKPIs.flow} subtext="Treatment Velocity" />
      </div>

      {/* Main Flow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* QUEUE MONITOR (LEFT) */}
          <div className="lg:col-span-3 bg-slate-100/30 rounded-[3.5rem] p-6 flex flex-col gap-6 border-2 border-slate-100 shadow-inner">
            <div className="flex justify-between items-center px-4">
                <h4 className="font-black text-slate-400 uppercase tracking-[0.2em] text-[10px] flex items-center gap-2"><History size={18}/> Queue Monitor</h4>
                <span className="text-[10px] font-black bg-white px-2 py-1 rounded-full text-slate-500 shadow-sm">{receptionPatientFlow.arriving.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar px-1">
              {receptionPatientFlow.arriving.length > 0 ? receptionPatientFlow.arriving.map(apt => {
                  const patient = getPatient(apt.patientId);
                  const isHuddleActive = activeHuddleId === apt.id;
                  
                  const hasLab = apt.labStatus === LabStatus.RECEIVED;
                  const balance = patient?.currentBalance || 0;
                  const hasClearance = patient?.clearanceRequests?.some(r => r.status === 'Approved');
                  const needsClearance = patient?.medicalConditions?.some(c => ['High BP', 'Heart Disease', 'Diabetes'].includes(c));
                  
                  return (
                    <div key={apt.id} className="relative animate-in slide-in-from-left-4 duration-300">
                        <div className={`bg-white p-5 rounded-[2.2rem] shadow-xl border-2 transition-all duration-500 group ${isHuddleActive ? 'border-teal-500 ring-8 ring-teal-500/5 scale-105 z-20' : 'border-white hover:border-teal-100'}`}>
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-black text-teal-600 text-[10px] bg-teal-50 px-2 py-1 rounded-lg uppercase tracking-widest">{apt.time}</span>
                                {apt.medHistoryVerified && <div className="text-teal-600"><ShieldCheck size={16}/></div>}
                            </div>
                            <button 
                                onClick={() => setActiveHuddleId(isHuddleActive ? null : apt.id)}
                                className="w-full text-left font-black text-slate-800 text-lg tracking-tight truncate hover:text-teal-600 transition-colors"
                            >
                                {patient?.surname?.toUpperCase() || 'UNKNOWN'}
                            </button>
                            <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1.5 opacity-60">{apt.type}</div>
                            
                            {isHuddleActive && (
                                <div className="mt-5 p-4 bg-slate-50 rounded-[1.8rem] border-2 border-dashed border-teal-200 animate-in zoom-in-95 duration-200">
                                    <div className="text-[9px] font-black text-teal-800 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Info size={12}/> Pre-Flight Huddle</div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Lab Sub-proc</span>
                                            {apt.labStatus === LabStatus.NONE ? <span className="text-[9px] text-slate-300 font-black uppercase italic">N/A</span> : (
                                                hasLab ? <CheckCircle size={14} className="text-teal-600"/> : <Clock size={14} className="text-orange-400"/>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Ledger Clear</span>
                                            {balance > 0 ? <div className="flex items-center gap-1 text-red-600 text-[10px] font-black">₱{balance.toLocaleString()}</div> : <CheckCircle size={14} className="text-teal-600"/>}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">MD Clearance</span>
                                            {!needsClearance ? <span className="text-[9px] text-slate-300 font-black uppercase italic">N/A</span> : (
                                                hasClearance ? <CheckCircle size={14} className="text-teal-600"/> : <ShieldX size={14} className="text-red-500"/>
                                            )}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onPatientSelect(apt.patientId)}
                                        className="w-full mt-4 py-3 bg-teal-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-800 transition-all"
                                    >
                                        Open Chart
                                    </button>
                                </div>
                            )}

                            {apt.status === AppointmentStatus.ARRIVED && !isHuddleActive && (
                                <div className="mt-4 pt-4 border-t border-slate-50">
                                    <button onClick={() => onVerifyMedHistory?.(apt.id)} className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${apt.medHistoryVerified ? 'bg-teal-50 text-teal-600 border border-teal-100' : 'bg-lilac-600 text-white shadow-xl shadow-lilac-500/20'}`}>{apt.medHistoryVerified ? <CheckCircle size={12}/> : <Stethoscope size={12}/>} {apt.medHistoryVerified ? 'VERIFIED' : 'Verify History'}</button>
                                </div>
                            )}
                        </div>
                    </div>
                  );
              }) : (
                <div className="h-40 flex flex-col items-center justify-center text-center opacity-20 group">
                    <Inbox size={48} className="text-slate-400 group-hover:scale-110 transition-transform duration-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest mt-4">Queue Empty</p>
                </div>
              )}
            </div>
          </div>

          {/* ACTIVE OPERATORIES (CENTER) */}
          <div className="lg:col-span-5 bg-teal-50/40 rounded-[3.5rem] p-8 flex flex-col gap-6 border-2 border-teal-100/50 shadow-inner">
              <div className="flex justify-between items-center px-4">
                  <h4 className="font-black text-teal-800 uppercase tracking-[0.3em] text-[10px] flex items-center gap-2"><Zap size={18} className="text-teal-500"/> Clinical Progress</h4>
                  <span className="text-[10px] font-black bg-teal-600 px-3 py-1 rounded-full text-white shadow-lg shadow-teal-600/20">{receptionPatientFlow.inTreatment.length} Active</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto no-scrollbar max-h-[600px] px-1 pb-4">
                  {receptionPatientFlow.inTreatment.length > 0 ? receptionPatientFlow.inTreatment.map(apt => (
                      <div key={apt.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border-4 border-white hover:border-teal-200 transition-all duration-500 animate-in zoom-in-95 group">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="font-black text-slate-800 text-xl tracking-tighter leading-tight">{getPatient(apt.patientId)?.surname?.toUpperCase() || 'UNKNOWN'}</div>
                                <div className="text-[10px] text-teal-600 font-black uppercase tracking-widest mt-1">{apt.type}</div>
                            </div>
                            {apt.medHistoryVerified && <div className="p-2 bg-teal-50 rounded-xl text-teal-600"><VerifiedIcon size={20}/></div>}
                          </div>
                          <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Timer size={12} className="text-teal-500 animate-pulse"/> {apt.time} SEAT</div>
                             <div className="bg-slate-100 px-2 py-0.5 rounded text-[8px] font-black text-slate-500 uppercase">{apt.durationMinutes}M SLOT</div>
                          </div>
                      </div>
                  )) : (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-30">
                        <Armchair size={64} className="text-teal-200 mb-6" />
                        <h4 className="text-sm font-black uppercase tracking-widest text-teal-800">Operatories Prepared</h4>
                    </div>
                  )}
              </div>
          </div>

          {/* POST-OP & COMPLIANCE (RIGHT) */}
          <div className="lg:col-span-4 flex flex-col gap-10">
              
              {/* Post-Op Vigilance */}
              <div className="bg-lilac-50/50 rounded-[3.5rem] p-8 flex flex-col gap-6 border-2 border-lilac-100 shadow-inner">
                  <div className="flex justify-between items-center px-2">
                      <h4 className="font-black text-lilac-800 uppercase tracking-[0.3em] text-[10px] flex items-center gap-2"><ShieldAlert size={20}/> Care Continuity</h4>
                      <span className="text-[10px] font-black bg-lilac-600 text-white px-3 py-1 rounded-full shadow-lg shadow-lilac-600/20">{postOpPatients.length} Required</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar max-h-[350px] px-1">
                      {postOpPatients.length > 0 ? postOpPatients.map(apt => (
                          <div key={apt.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-white hover:border-lilac-200 shadow-xl animate-in slide-in-from-right-10 duration-500 group">
                              <div className="flex justify-between items-start mb-6">
                                  <div>
                                      <div className="font-black text-slate-800 text-lg uppercase tracking-tighter leading-tight">{getPatient(apt.patientId)?.surname}</div>
                                      <p className="text-[10px] text-lilac-600 font-black uppercase mt-1 opacity-70">{apt.type} • {formatDate(apt.date)}</p>
                                  </div>
                                  <div className="p-3 bg-lilac-50 rounded-2xl text-lilac-600 group-hover:bg-lilac-600 group-hover:text-white transition-all"><MessageCircle size={22}/></div>
                              </div>
                              <div className="flex gap-3">
                                  <button onClick={() => window.open(`tel:${getPatient(apt.patientId)?.phone}`)} className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-all">CALL</button>
                                  <button 
                                      onClick={() => onConfirmFollowUp?.(apt.id)}
                                      className="flex-[2] py-3 bg-lilac-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-lilac-600/30 hover:bg-lilac-700 active:scale-95 transition-all"
                                  >
                                      <Heart size={14} fill="currentColor"/> Log Follow-up
                                  </button>
                              </div>
                          </div>
                      )) : (
                          <div className="h-full py-10 flex flex-col items-center justify-center text-center opacity-40">
                              <VerifiedIcon size={56} className="text-lilac-400 mb-4 animate-in zoom-in duration-500" />
                              <p className="text-[10px] font-black text-lilac-700 uppercase tracking-[0.2em]">Standard of Care: Current</p>
                          </div>
                      )}
                  </div>
              </div>

              {/* Compliance Pulse */}
              <div className="bg-slate-900 rounded-[3.5rem] p-8 text-white shadow-2xl relative overflow-hidden ring-8 ring-slate-900/5">
                 <div className="absolute top-0 right-0 p-8 opacity-5"><Shield size={120} /></div>
                 <div className="flex justify-between items-center mb-8 relative z-10">
                     <h3 className="font-black text-xl flex items-center gap-3 text-teal-400 uppercase tracking-tighter"><Lock size={24}/> Registry Defense</h3>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance Pulse</span>
                 </div>
                 <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar relative z-10">
                    {complianceAlerts.map((alert) => (
                        <div key={alert.id} className={`p-5 border-2 rounded-[2rem] flex flex-col gap-4 transition-all duration-500 animate-in slide-in-from-bottom-2 ${alert.daysLeft <= 0 ? 'border-red-600 bg-red-600/20' : alert.severity === 'high' ? 'border-orange-500 bg-orange-500/20' : 'border-teal-500/30 bg-teal-500/5'} ${alert.isAcknowledged ? 'opacity-30' : ''}`}>
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-2xl shrink-0 shadow-lg ${alert.daysLeft <= 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-white/10 text-white border border-white/20'}`}>{alert.daysLeft <= 0 ? <ShieldX size={24}/> : <Award size={24}/>}</div>
                            <div className="flex-1">
                              <div className="font-black text-lg tracking-tight uppercase">{alert.userName}</div>
                              <div className="text-[9px] font-black uppercase text-teal-400 tracking-widest mt-1">
                                  {alert.daysLeft <= 0 
                                      ? 'PRC EXPIRED - CLINICAL LOCK' 
                                      : `PRC RENEWAL DUE IN ${alert.daysLeft}D`}
                              </div>
                            </div>
                          </div>
                          {!alert.isAcknowledged && alert.daysLeft > 0 && (
                              <button onClick={() => handleAcknowledgeAlert(alert.id)} className="w-full py-3 bg-teal-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-teal-500/30 hover:bg-teal-700 transition-all">Acknowledge Countdown</button>
                          )}
                        </div>
                    ))}
                    {complianceAlerts.length === 0 && (
                        <div className="py-16 text-center opacity-20 flex flex-col items-center gap-4">
                            <ShieldCheck size={64}/>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Registry Validated</p>
                        </div>
                    )}
                 </div>
              </div>
          </div>
      </div>
      
      {/* Risk Gaps Section */}
      <div className="bg-white p-12 rounded-[4rem] border-2 border-orange-50 shadow-2xl shadow-orange-500/5">
          <div className="flex items-center justify-between mb-10">
              <div>
                <h4 className="text-xs font-black text-orange-600 uppercase tracking-[0.3em] flex items-center gap-3 mb-2"><FileWarning size={20}/> Statutory Safety Monitor</h4>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Diagnostic Coverage Discrepancies (Rule 9)</p>
              </div>
              <div className="text-[10px] font-black bg-orange-50 text-orange-700 px-4 py-1.5 rounded-full border border-orange-100">AUDIT TRIGGER ACTIVE</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {highRiskDiagnosticGaps.length > 0 ? highRiskDiagnosticGaps.map(p => (
                  <div key={p.id} onClick={() => onPatientSelect(p.id)} className="p-8 rounded-[3rem] bg-slate-50 border-2 border-slate-100 flex flex-col gap-6 cursor-pointer hover:border-orange-500 hover:bg-white transition-all group shadow-sm hover:shadow-2xl hover:shadow-orange-500/10">
                       <div className="flex justify-between items-start">
                            <div className="p-4 bg-orange-50 text-orange-600 rounded-[1.5rem] group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"><ShieldAlert size={32}/></div>
                            <button className="p-2 text-slate-300 hover:text-orange-500 transition-colors"><ArrowRight size={24}/></button>
                       </div>
                       <div>
                            <div className="font-black text-slate-800 text-xl tracking-tighter uppercase">{p.surname}, {p.firstName[0]}.</div>
                            <p className="text-[10px] text-orange-700 font-black uppercase tracking-widest mt-3 leading-relaxed">Surgical items planned without verified X-Ray justification record in registry.</p>
                       </div>
                  </div>
              )) : (
                  <div className="col-span-full py-16 text-center opacity-30 flex flex-col items-center gap-6">
                      <ShieldCheck size={80} className="text-teal-500 animate-in zoom-in duration-700" />
                      <p className="text-[11px] font-black text-teal-800 uppercase tracking-[0.3em]">Diagnostic Integrity Validated Across All Active Arches</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default Dashboard;


import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, TrendingUp, Search, UserPlus, ChevronRight, CalendarPlus, ClipboardList, Beaker, 
  Repeat, ArrowRight, HeartPulse, PieChart, Activity, DollarSign, FileText, StickyNote, 
  Package, Sunrise, AlertCircle, Plus, CheckCircle, Circle, Trash2, Flag, User as UserIcon, 
  Building2, MapPin, Inbox, FileSignature, Video, ShieldAlert, Award, ShieldCheck, Phone, 
  Mail, Zap, X, AlertTriangle, ShieldX, Thermometer, Users, Eye, EyeOff, LayoutGrid, Clock, List, 
  History, Timer, Lock, Send, Armchair, Scale, Target, RefreshCcw, CloudOff, Database, ShieldCheck as VerifiedIcon, UserCheck, Stethoscope, FileWarning, MessageCircle, Heart, Info, DollarSign as FinanceIcon, Sparkles, Shield, GraduationCap
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
  onSaveQuickQueue?: (name: string, phone: string, complaint: string, triageLevel: TriageLevel) => void;
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
    <div className={`p-5 rounded-[1.5rem] ${color} transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500 shadow-lg shadow-current/10`} aria-hidden="true">
      <Icon size={32} />
    </div>
    <div className="flex flex-col">
      <span className="text-xs font-black text-slate-600 uppercase tracking-[0.2em] leading-none mb-2">{label}</span>
      <span className="text-4xl font-black text-slate-800 tracking-tighter">{value}</span>
      {subtext && <span className="text-xs font-black text-teal-700 mt-2 uppercase tracking-widest">{subtext}</span>}
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ 
  appointments, allAppointments = [], patientsCount, staffCount, staff = [], currentUser, patients, onAddPatient, onPatientSelect, onBookAppointment,
  onUpdateAppointmentStatus, onCompleteRegistration, onUpdatePatientRecall, fieldSettings, onUpdateSettings, onViewAllSchedule, onChangeBranch, currentBranch,
  tasks = [], onAddTask, onToggleTask, onDeleteTask, onSaveConsent, auditLogVerified, sterilizationCycles = [], stock = [], auditLog = [], logAction,
  syncConflicts = [], setSyncConflicts, systemStatus = SystemStatus.OPERATIONAL, onSwitchSystemStatus, onVerifyDowntimeEntry, onVerifyMedHistory, onConfirmFollowUp
}) => {
  const toast = useToast();
  const [activeHuddleId, setActiveHuddleId] = useState<string | null>(null);

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

  const cpdComplianceStats = useMemo(() => {
    if (!staff) return [];
    const now = new Date();
    return staff
      .filter(s => s.role === UserRole.DENTIST)
      .map(s => {
        const totalUnits = (s.cpdEntries || []).reduce((sum, entry) => sum + entry.units, 0);
        const required = s.requiredCpdUnits || 15;
        const progress = Math.min(100, (totalUnits / required) * 100);
        
        const expiry = s.prcExpiry ? new Date(s.prcExpiry) : null;
        const daysToExpiry = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24)) : 999;
        
        const isRenewalRisk = totalUnits < required && daysToExpiry <= 90;
        const isCompliant = totalUnits >= required;

        return {
          id: s.id,
          name: s.name,
          avatar: s.avatar,
          prcLicense: s.prcLicense,
          prcExpiry: s.prcExpiry,
          totalUnits,
          required,
          progress,
          isRenewalRisk,
          isCompliant,
          daysToExpiry
        };
      })
      .sort((a, b) => {
          if (a.isRenewalRisk && !b.isRenewalRisk) return -1;
          if (!a.isRenewalRisk && b.isRenewalRisk) return 1;
          const gapA = a.required - a.totalUnits;
          const gapB = b.required - b.totalUnits;
          return gapB - gapA;
      });
  }, [staff]);

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
            <h2 className="text-sm font-black text-teal-700 uppercase tracking-[0.3em] mb-2 flex items-center gap-2"><Sparkles size={14} aria-hidden="true"/> Practice Intelligence Hub</h2>
            <h1 className="text-5xl font-black text-slate-800 tracking-tighter leading-none">Command Center</h1>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={onAddPatient}
                className="bg-white text-teal-800 border-2 border-teal-100 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-teal-500/5 hover:scale-105 hover:bg-teal-50 transition-all flex items-center gap-3 focus:ring-offset-2"
                aria-label="Register new patient admission"
            >
                <UserPlus size={20} aria-hidden="true"/> New Admission
            </button>
            <button 
                onClick={() => onBookAppointment()}
                className="bg-lilac-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-lilac-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 focus:ring-offset-2"
                aria-label="Book new clinical session"
            >
                <CalendarPlus size={20} aria-hidden="true"/> Book Session
            </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" role="region" aria-label="Key Performance Indicators">
        <MetricCard icon={TrendingUp} color="bg-teal-50 text-teal-700" label="Production Yield (YTD)" value={roleKPIs.production} subtext="Gross Economic Value" />
        <MetricCard icon={Clock} color="bg-blue-50 text-blue-700" label="Queue Latency" value={roleKPIs.latency} subtext="Avg. Time to Chair" />
        <MetricCard icon={Scale} color="bg-orange-50 text-orange-700" label="Inventory Integrity" value={roleKPIs.integrity} subtext="Forensic PIC Audit" />
        <MetricCard icon={Activity} color="bg-lilac-50 text-lilac-700" label="Operational Flow" value={roleKPIs.flow} subtext="Treatment Velocity" />
      </div>

      {/* Main Flow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* QUEUE MONITOR (LEFT) */}
          <section aria-labelledby="queue-header" className="lg:col-span-3 bg-slate-100/30 rounded-[3.5rem] p-6 flex flex-col gap-6 border-2 border-slate-100 shadow-inner">
            <div className="flex justify-between items-center px-4">
                <h4 id="queue-header" className="font-black text-slate-600 uppercase tracking-[0.2em] text-xs flex items-center gap-2"><History size={18} aria-hidden="true"/> Queue Monitor</h4>
                <span className="text-xs font-black bg-white px-2 py-1 rounded-full text-slate-700 shadow-sm" role="status" aria-label={`${receptionPatientFlow.arriving.length} patients in queue`}>{receptionPatientFlow.arriving.length}</span>
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
                        <div className={`bg-white p-5 rounded-[2.2rem] shadow-xl border-2 transition-all duration-500 group ${isHuddleActive ? 'border-teal-700 ring-8 ring-teal-500/5 scale-105 z-20' : 'border-white hover:border-teal-100'}`}>
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-black text-teal-700 text-xs bg-teal-50 px-2 py-1 rounded-lg uppercase tracking-widest">{apt.time}</span>
                                {apt.medHistoryVerified && <div className="text-teal-700" aria-label="Medical History Verified"><ShieldCheck size={18}/></div>}
                            </div>
                            <button 
                                onClick={() => setActiveHuddleId(isHuddleActive ? null : apt.id)}
                                aria-expanded={isHuddleActive}
                                className="w-full text-left font-black text-slate-800 text-xl tracking-tighter truncate hover:text-teal-700 transition-colors uppercase focus:ring-offset-2"
                            >
                                {patient?.surname || 'UNKNOWN'}
                            </button>
                            <div className="text-xs text-slate-600 font-black uppercase tracking-widest mt-1.5 opacity-80">{apt.type}</div>
                            
                            {isHuddleActive && (
                                <div className="mt-5 p-4 bg-slate-50 rounded-[1.8rem] border-2 border-dashed border-teal-200 animate-in zoom-in-95 duration-200" role="complementary" aria-label="Pre-flight checklist">
                                    <div className="text-xs font-black text-teal-800 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Info size={12} aria-hidden="true"/> Pre-Flight Huddle</div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">Lab Sub-proc</span>
                                            {apt.labStatus === LabStatus.NONE ? <span className="text-xs text-slate-500 font-black uppercase italic">N/A</span> : (
                                                hasLab ? <CheckCircle size={14} className="text-teal-700"/> : <Clock size={14} className="text-orange-400"/>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">Ledger Clear</span>
                                            {balance > 0 ? <div className="flex items-center gap-1 text-red-700 text-xs font-black">₱{balance.toLocaleString()}</div> : <CheckCircle size={14} className="text-teal-700"/>}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">MD Clearance</span>
                                            {!needsClearance ? <span className="text-xs text-slate-500 font-black uppercase italic">N/A</span> : (
                                                hasClearance ? <CheckCircle size={14} className="text-teal-700"/> : <ShieldX size={14} className="text-red-500"/>
                                            )}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onPatientSelect(apt.patientId)}
                                        className="w-full mt-4 py-3 bg-teal-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-800 transition-all"
                                    >
                                        Open Full Record
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                  );
              }) : <div className="p-20 text-center text-slate-400 italic text-sm">No arrivals recorded in pipeline.</div>}
            </div>
          </section>

          {/* MAIN CENTER FLOW */}
          <div className="lg:col-span-9 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  
                  {/* ACTIVE ADMISSIONS & DIAGNOSTIC GAPS */}
                  <section aria-labelledby="admissions-header" className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col h-fit">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-lilac-50 p-2 rounded-xl text-lilac-700"><Sunrise size={24}/></div>
                            <h3 id="admissions-header" className="text-lg font-black text-slate-800 uppercase tracking-tight">Active Admissions</h3>
                        </div>
                        <span className="text-[10px] font-black bg-lilac-100 px-2 py-1 rounded-full text-lilac-700 uppercase tracking-widest">{highRiskDiagnosticGaps.length} Risk Gaps</span>
                    </div>
                    <div className="space-y-4">
                        {highRiskDiagnosticGaps.length > 0 ? highRiskDiagnosticGaps.map(p => (
                            <div key={p.id} className="p-5 bg-slate-50 rounded-[2rem] border-2 border-white shadow-md flex items-center justify-between group hover:border-lilac-200 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="bg-red-100 text-red-600 p-3 rounded-2xl group-hover:animate-pulse"><Stethoscope size={20}/></div>
                                    <div>
                                        <div className="font-black text-slate-800 uppercase text-sm leading-none">{p.surname}</div>
                                        <div className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-1.5 flex items-center gap-1"><ShieldAlert size={10}/> Diagnostic Gap: X-Ray Required</div>
                                    </div>
                                </div>
                                <button onClick={() => onPatientSelect(p.id)} className="p-2.5 bg-white rounded-xl text-slate-400 hover:text-lilac-600 shadow-sm border border-slate-100 group-hover:translate-x-1 transition-all"><ArrowRight size={18}/></button>
                            </div>
                        )) : <div className="p-10 text-center opacity-30 italic text-sm">All active records have verified diagnostic alignment.</div>}
                    </div>
                  </section>

                  {/* TREATMENT FLOW MONITOR */}
                  <section aria-labelledby="treatment-header" className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col h-fit">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-blue-50 p-2 rounded-xl text-blue-700"><Armchair size={24}/></div>
                        <h3 id="treatment-header" className="text-lg font-black text-slate-800 uppercase tracking-tight">In-Treatment Flow</h3>
                    </div>
                    <div className="space-y-4">
                        {receptionPatientFlow.inTreatment.length > 0 ? receptionPatientFlow.inTreatment.map(apt => {
                            const patient = getPatient(apt.patientId);
                            const provider = staff.find(s => s.id === apt.providerId);
                            return (
                                <div key={apt.id} className="p-6 bg-slate-50 rounded-[2rem] border-2 border-white shadow-md space-y-4 group hover:border-blue-200 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <img src={provider?.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                                            <div>
                                                <div className="font-black text-slate-800 uppercase text-sm leading-none">{patient?.name}</div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{apt.type} with {provider?.name.split(' ')[1]}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-blue-700 animate-pulse"><Timer size={14}/><span className="text-[10px] font-black uppercase">Active Session</span></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => onUpdateAppointmentStatus(apt.id, AppointmentStatus.COMPLETED)} className="flex-1 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-blue-700 transition-all">Ready for Handover</button>
                                    </div>
                                </div>
                            );
                        }) : <div className="p-10 text-center opacity-30 italic text-sm">No clinical sessions currently in progress.</div>}
                    </div>
                  </section>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* BILLING HUB & CHECKOUT */}
                  <section aria-labelledby="billing-header" className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm h-fit">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-emerald-50 p-2 rounded-xl text-emerald-700"><FinanceIcon size={24}/></div>
                        <h3 id="billing-header" className="text-lg font-black text-slate-800 uppercase tracking-tight">Reception Billing Hub</h3>
                    </div>
                    <div className="space-y-4">
                        {receptionPatientFlow.readyForBilling.length > 0 ? receptionPatientFlow.readyForBilling.map(apt => {
                            const patient = getPatient(apt.patientId);
                            const hasLedger = (patient?.ledger || []).some(l => l.date === today && l.type === 'Charge');
                            return (
                                <div key={apt.id} className="p-6 bg-slate-50 rounded-[2.2rem] border-2 border-white shadow-lg flex items-center justify-between group hover:border-emerald-200 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${hasLedger ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600 animate-bounce'}`}>{hasLedger ? <CheckCircle size={20}/> : <FileWarning size={20}/>}</div>
                                        <div>
                                            <div className="font-black text-slate-800 uppercase text-sm leading-none">{patient?.surname}</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{hasLedger ? 'Ledger Balanced' : 'Charge Posting Required'}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => onPatientSelect(apt.patientId)} className="px-5 py-2.5 bg-white rounded-xl text-xs font-black text-emerald-700 border border-emerald-100 shadow-sm hover:bg-emerald-50 transition-all uppercase tracking-widest">Process Checkout</button>
                                </div>
                            );
                        }) : <div className="p-10 text-center opacity-30 italic text-sm">No patients currently awaiting checkout.</div>}
                    </div>
                  </section>

                  {/* POST-OP RECOVERY SHIELD */}
                  <section aria-labelledby="recovery-header" className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm h-fit">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-orange-50 p-2 rounded-xl text-orange-700"><Heart size={24}/></div>
                        <h3 id="recovery-header" className="text-lg font-black text-slate-800 uppercase tracking-tight">Post-Op Vigilance</h3>
                    </div>
                    <div className="space-y-4">
                        {postOpPatients.length > 0 ? postOpPatients.map(apt => (
                            <div key={apt.id} className="p-6 bg-slate-50 rounded-[2.2rem] border-2 border-white shadow-lg flex items-center justify-between group hover:border-orange-200 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="bg-orange-100 text-orange-700 p-3 rounded-2xl group-hover:rotate-12 transition-transform"><MessageCircle size={20}/></div>
                                    <div>
                                        <div className="font-black text-slate-800 uppercase text-sm leading-none">{getPatient(apt.patientId)?.surname}</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Surgery: {formatDate(apt.date)}</div>
                                    </div>
                                </div>
                                <button onClick={() => onConfirmFollowUp?.(apt.id)} className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-600/20 hover:scale-105 transition-all">Confirm Stable</button>
                            </div>
                        )) : <div className="p-10 text-center opacity-30 italic text-sm">All surgical handovers are current.</div>}
                    </div>
                  </section>
              </div>
          </div>
      </div>

      {/* STATUTORY CPD REGISTRY - RA 9484 Article III, Sec. 27 */}
      <section aria-labelledby="cpd-header" className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm animate-in slide-in-from-bottom-6 duration-1000">
          <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                  <div className="bg-lilac-100 p-4 rounded-3xl text-lilac-700 shadow-sm"><GraduationCap size={28}/></div>
                  <div>
                      <h3 id="cpd-header" className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Statutory CPD Registry</h3>
                      <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">RA 9484 Article III, Sec. 27 License Renewal Compliance</p>
                  </div>
              </div>
              <div className="hidden md:block text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Administrative Oversight</span>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">Verified PDS Audit</span>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cpdComplianceStats.map(stat => (
                  <div key={stat.id} className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 group relative overflow-hidden ${stat.isRenewalRisk ? 'bg-red-50 border-red-200 ring-8 ring-red-500/5' : 'bg-slate-50 border-slate-100 hover:border-teal-500 hover:bg-white hover:shadow-xl'}`}>
                      {stat.isRenewalRisk && <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12" aria-hidden="true"><ShieldAlert size={120}/></div>}
                      
                      <div className="flex items-center gap-5 mb-8 relative">
                          <img src={stat.avatar} alt="" className="w-16 h-16 rounded-[1.5rem] border-4 border-white shadow-lg" />
                          <div className="flex-1 min-w-0">
                              <h4 className="font-black text-slate-800 uppercase text-lg tracking-tight truncate leading-none">{stat.name}</h4>
                              <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PRC LICENSE: {stat.prcLicense || 'RECOGNITION PENDING'}</span>
                              </div>
                          </div>
                      </div>
                      
                      <div className="space-y-3">
                          <div className="flex justify-between items-end text-xs font-black uppercase tracking-widest">
                              <span className="text-slate-500">Statutory Units: {stat.totalUnits} / {stat.required}</span>
                              <span className={stat.isCompliant ? 'text-teal-700' : 'text-lilac-600'}>{Math.round(stat.progress)}%</span>
                          </div>
                          <div className="h-3 bg-white rounded-full overflow-hidden border border-slate-100 shadow-inner relative">
                              <div 
                                  className={`h-full transition-all duration-1000 shadow-sm ${stat.isCompliant ? 'bg-teal-600' : 'bg-lilac-500'}`} 
                                  style={{ width: `${stat.progress}%` }}
                              />
                          </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center">
                          <div className="flex flex-col">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">PRC EXPIRY DATE</span>
                              <span className={`text-xs font-black ${stat.daysToExpiry <= 90 ? 'text-red-700' : 'text-slate-700'}`}>
                                  {stat.prcExpiry ? formatDate(stat.prcExpiry) : '---'}
                              </span>
                          </div>
                          <div className="flex flex-col items-end">
                              <span className={`text-[9px] font-black px-3 py-1 rounded-full border shadow-sm transition-all uppercase tracking-widest ${
                                  stat.isRenewalRisk ? 'bg-red-600 text-white border-red-700 animate-bounce' : 
                                  stat.isCompliant ? 'bg-teal-50 text-teal-700 border-teal-200' : 
                                  'bg-lilac-50 text-lilac-700 border-lilac-100'
                              }`}>
                                  {stat.isRenewalRisk ? 'RENEWAL RISK' : stat.isCompliant ? 'STATUTORY COMPLIANT' : 'PENDING UNITS'}
                              </span>
                          </div>
                      </div>
                  </div>
              ))}
              {cpdComplianceStats.length === 0 && <div className="col-span-full py-20 text-center opacity-30 italic font-black text-slate-800 tracking-widest uppercase">No clinical practitioners registered in this branch.</div>}
          </div>
      </section>
    </div>
  );
};

export default Dashboard;

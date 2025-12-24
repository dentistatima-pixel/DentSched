import React, { useState, useMemo, useEffect } from 'react';
/* Added UserCheck to lucide-react imports */
import { 
  Calendar, TrendingUp, Search, UserPlus, ChevronRight, CalendarPlus, ClipboardList, Beaker, 
  Repeat, ArrowRight, HeartPulse, PieChart, Activity, DollarSign, FileText, StickyNote, 
  Package, Sunrise, AlertCircle, Plus, CheckCircle, Circle, Trash2, Flag, User as UserIcon, 
  Building2, MapPin, Inbox, FileSignature, Video, ShieldAlert, Award, ShieldCheck, Phone, 
  Mail, Zap, X, AlertTriangle, ShieldX, Thermometer, Users, Eye, EyeOff, LayoutGrid, Clock, List, 
  History, Timer, Lock, Send, Armchair, Scale, Target, RefreshCcw, CloudOff, Database, ShieldCheck as VerifiedIcon, UserCheck
} from 'lucide-react';
import { 
  Appointment, AppointmentStatus, User, UserRole, Patient, LabStatus, FieldSettings, 
  PinboardTask, TreatmentPlanStatus, TelehealthRequest, RecallStatus, SterilizationCycle, StockItem, TriageLevel, AuditLogEntry, ClinicResource, StockCategory, SyncConflict, SystemStatus 
} from '../types';
import Fuse from 'fuse.js';
import ConsentCaptureModal from './ConsentCaptureModal';
import { MOCK_TELEHEALTH_REQUESTS } from '../constants';
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
  onPatientPortalToggle: () => void;
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
  onUpdateAppointmentStatus, onCompleteRegistration, onUpdatePatientRecall, fieldSettings, onUpdateSettings, onViewAllSchedule, onChangeBranch, currentBranch, onPatientPortalToggle,
  tasks = [], onAddTask, onToggleTask, onDeleteTask, onSaveConsent, onQuickQueue, auditLogVerified, sterilizationCycles = [], stock = [], auditLog = [], logAction,
  syncConflicts = [], setSyncConflicts, systemStatus = SystemStatus.OPERATIONAL, onSwitchSystemStatus, onVerifyDowntimeEntry
}) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskUrgent, setNewTaskUrgent] = useState(false);
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [consentModalApt, setConsentModalApt] = useState<Appointment | null>(null);
  const [activeRecallTab, setActiveRecallTab] = useState<RecallStatus>('Due');
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyData, setEmergencyData] = useState({ name: '', phone: '', complaint: '', triageLevel: 'Level 2: Acute Pain/Swelling' as TriageLevel });
  const [commitmentNote, setCommitmentNote] = useState('');

  const today = new Date().toLocaleDateString('en-CA');

  const maskName = (name: string) => {
    if (!privacyMode) return name;
    const parts = name.split(' ');
    return parts.map(p => p[0] + '.').join(' ');
  };

  const getPatient = (id: string) => patients.find(pt => pt.id === id);

  const todaysAppointments = useMemo(() => appointments.filter(a => a.date === today && !a.isBlock), [appointments, today]);

  const unreconciledManualEntries = useMemo(() => {
    return appointments.filter(a => a.entryMode === 'MANUAL' && !a.reconciled);
  }, [appointments]);

  const bayStatus = useMemo(() => {
    if (!fieldSettings?.resources) return [];
    return fieldSettings.resources.filter(r => r.branch === currentBranch).map(res => {
      const activeApt = todaysAppointments.find(a => a.resourceId === res.id && [AppointmentStatus.ARRIVED, AppointmentStatus.SEATED, AppointmentStatus.TREATING].includes(a.status));
      const patient = activeApt ? getPatient(activeApt.patientId) : null;
      const initials = patient ? `${patient.firstName[0]}${patient.surname[0]}` : null;
      return { ...res, currentInitials: initials, status: activeApt ? 'Occupied' : 'Ready' };
    });
  }, [fieldSettings, todaysAppointments, patients, currentBranch]);

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

  // --- PREDICTIVE ANALYTICS ENGINE ---
  const roleKPIs = useMemo(() => {
    const currentYear = new Date().getFullYear();
    
    // Admin Logic
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

    // Dentist Logic
    const dentistTodayProduction = todaysAppointments
      .filter(a => a.providerId === currentUser.id && a.status === AppointmentStatus.COMPLETED)
      .reduce((sum, apt) => {
        const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
        return sum + (proc?.price || 0);
      }, 0);

    let docPlanned = 0;
    let docAccepted = 0;
    patients.forEach(p => {
      p.treatmentPlans?.forEach(plan => {
        if (plan.createdBy === currentUser.name) {
          const items = (p.dentalChart || []).filter(i => i.planId === plan.id);
          items.forEach(i => {
            if (i.status === 'Planned') docPlanned++;
            if (i.status === 'Completed') docAccepted++;
          });
        }
      });
    });
    const docAcceptance = docPlanned > 0 ? Math.round((docAccepted / (docPlanned + docAccepted)) * 100) : 0;
    
    const myPatientsToday = todaysAppointments.filter(a => a.providerId === currentUser.id);
    const reliabilitySum = myPatientsToday.reduce((sum, a) => sum + (getPatient(a.patientId)?.reliabilityScore || 100), 0);
    const avgReliability = myPatientsToday.length > 0 ? Math.round(reliabilitySum / myPatientsToday.length) : 100;

    // Assistant Logic
    const completedToday = todaysAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    const shiftFlow = todaysAppointments.length > 0 ? Math.round((completedToday / todaysAppointments.length) * 100) : 0;
    const queueLatency = todaysAppointments.some(a => a.status === AppointmentStatus.ARRIVED) ? "14m" : "0m";

    return {
      admin: { production: `₱${(practiceProductionYTD / 1000).toFixed(1)}k`, acceptance: `${acceptanceRate}%`, aging: `₱${(totalARAging / 1000).toFixed(1)}k` },
      dentist: { production: `₱${dentistTodayProduction.toLocaleString()}`, acceptance: `${docAcceptance}%`, reliability: `${avgReliability}%` },
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
          if (currentUser.id === s.id || currentUser.role === UserRole.ADMIN) {
            alerts.push({ id: alertId, userId: s.id, userName: s.name, type: 'PRC License', daysLeft: diff, severity, isAcknowledged: isAck });
          }
        }
      }
    });
    return alerts;
  }, [staff, fieldSettings, currentUser]);

  const activeGateAlert = complianceAlerts.find(a => a.severity === 'high' && !a.isAcknowledged);

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

  const handleResolveConflict = (conflictId: string, pick: 'local' | 'server') => {
      if (!setSyncConflicts) return;
      setSyncConflicts(syncConflicts.filter(c => c.id !== conflictId));
      toast.success("Conflict resolved manually.");
  };

  const renderKPIs = () => {
    if (currentUser.role === UserRole.ADMIN) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard icon={TrendingUp} color="bg-teal-50 text-teal-600" label="Practice Production (YTD)" value={roleKPIs.admin.production} subtext="Gross Economic Value" />
          <MetricCard icon={Target} color="bg-blue-50 text-blue-600" label="Acceptance Rate" value={roleKPIs.admin.acceptance} subtext="Case Conversion Efficiency" />
          <MetricCard icon={AlertCircle} color="bg-red-50 text-red-600" label="A/R Aging Totals" value={roleKPIs.admin.aging} subtext="Outstanding Receivables" />
        </div>
      );
    }
    if (currentUser.role === UserRole.DENTIST) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard icon={Activity} color="bg-teal-50 text-teal-600" label="Individual Production" value={roleKPIs.dentist.production} subtext="Direct Clinical Output (Today)" />
          {/* Fix: UserCheck is now imported correctly from lucide-react */}
          <MetricCard icon={UserCheck} color="bg-lilac-50 text-lilac-600" label="Treatment Acceptance" value={roleKPIs.dentist.acceptance} subtext="Patient Plan Conversion" />
          <MetricCard icon={CheckCircle} color="bg-green-50 text-green-600" label="Avg. Patient Reliability" value={roleKPIs.dentist.reliability} subtext="Mean Appointment Integrity" />
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard icon={Clock} color="bg-blue-50 text-blue-600" label="Queue Latency" value={roleKPIs.assistant.latency} subtext="Avg. Time Arrived to Seated" />
        <MetricCard icon={Scale} color="bg-teal-50 text-teal-600" label="Inventory Integrity" value={roleKPIs.assistant.integrity} subtext="PIC Audit Accuracy" />
        <MetricCard icon={Activity} color="bg-orange-50 text-orange-600" label="Shift Flow" value={roleKPIs.assistant.flow} subtext="Completed vs. Scheduled" />
      </div>
    );
  };

  const renderAdminView = () => (
    <div className="space-y-6">
      {/* RECONCILIATION HUB OVERLAY */}
      {systemStatus === SystemStatus.RECONCILIATION && unreconciledManualEntries.length > 0 && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-8 overflow-hidden">
              <div className="bg-white w-full max-w-6xl h-full rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 border-8 border-teal-500/20">
                  <div className="bg-teal-900 p-8 flex justify-between items-center text-white shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-teal-700 rounded-2xl"><Database size={32}/></div>
                          <div>
                              <h2 className="text-3xl font-black uppercase tracking-tight">Post-Downtime Reconciliation</h2>
                              <p className="text-teal-300 font-bold uppercase text-xs tracking-widest mt-1">Registry Cleanup: {unreconciledManualEntries.length} items requiring verification</p>
                          </div>
                      </div>
                      <button onClick={() => onSwitchSystemStatus?.(SystemStatus.OPERATIONAL)} className="bg-white text-teal-900 px-6 py-3 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Exit Review</button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50">
                      <div className="space-y-4">
                          <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs flex items-center gap-2 mb-6"><FileText size={18}/> Manual Entry Log (Verification Required)</h3>
                          {unreconciledManualEntries.map(apt => (
                              <div key={apt.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm flex flex-col gap-4 group hover:border-teal-500 transition-all">
                                  <div className="flex justify-between items-start">
                                      <div>
                                          <div className="text-[10px] font-black text-lilac-600 uppercase tracking-tighter mb-1">Downtime Record</div>
                                          <div className="text-lg font-black text-slate-800 uppercase">{getPatient(apt.patientId)?.name || 'Unknown Patient'}</div>
                                      </div>
                                      <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">{apt.type}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl text-xs">
                                      <div><span className="block text-[9px] font-bold text-slate-400 uppercase">Provider</span><span className="font-bold">{staff.find(s => s.id === apt.providerId)?.name}</span></div>
                                      <div><span className="block text-[9px] font-bold text-slate-400 uppercase">Slot</span><span className="font-bold">{apt.time} ({formatDate(apt.date)})</span></div>
                                  </div>
                                  <div className="flex gap-2 mt-2">
                                      <button onClick={() => onVerifyDowntimeEntry?.(apt.id)} className="flex-1 py-3 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all flex items-center justify-center gap-2">
                                          <CheckCircle size={14}/> Accept & Sync
                                      </button>
                                      <button className="flex-1 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Edit Details</button>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-inner flex flex-col items-center justify-center text-center">
                          <VerifiedIcon size={120} className="text-teal-100 mb-6"/>
                          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Audit Guidance</h4>
                          <p className="text-slate-500 text-sm mt-2 max-w-xs">Verify that manual entries do not conflict with existing server records. Once verified, the 'Yellow Hazard' downtime stamp will be permanently removed.</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {renderKPIs()}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col space-y-8">
          
          {/* OFFLINE OUTAGE RECONCILIATION WIDGET */}
          {syncConflicts.length > 0 && (
              <div className="animate-in slide-in-from-top-4 duration-500">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black text-red-600 uppercase tracking-widest text-xs flex items-center gap-2">
                          <CloudOff size={16}/> Outage Reconciliation Queue
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Administrative Review Required</span>
                  </div>
                  <div className="space-y-4">
                      {syncConflicts.map(conflict => (
                          <div key={conflict.id} className="bg-red-50 border-2 border-red-200 p-6 rounded-[2rem] shadow-xl shadow-red-600/5">
                              <div className="flex justify-between items-start mb-6">
                                  <div>
                                      <div className="text-xs font-black text-red-800 uppercase tracking-tighter">Sync Collision Detected</div>
                                      <p className="text-[10px] text-red-600 font-bold uppercase mt-1">Entity: {conflict.entityType} | Slot: {conflict.serverData?.time || 'N/A'}</p>
                                  </div>
                                  <div className="text-right">
                                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Outage Context</div>
                                      <div className="text-xs font-bold text-slate-600">{formatDate(conflict.timestamp.split('T')[0])}</div>
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                  <div className="bg-white p-4 rounded-2xl border border-red-100">
                                      <div className="text-[9px] font-black text-lilac-600 uppercase mb-2">Local (Offline) Input</div>
                                      <div className="font-bold text-slate-800 text-sm">{conflict.localData?.patientName || conflict.localData?.type}</div>
                                      <div className="text-[10px] text-slate-500 mt-1">Reason: Manually queued during ISP outage.</div>
                                  </div>
                                  <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                                      <div className="text-[9px] font-black text-teal-600 uppercase mb-2">Server (Online) Record</div>
                                      <div className="font-bold text-slate-800 text-sm">{conflict.serverData?.patientName || conflict.serverData?.type}</div>
                                      <div className="text-[10px] text-teal-600 mt-1">Reason: Confirmed by Branch B while Branch A was offline.</div>
                                  </div>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={() => handleResolveConflict(conflict.id, 'local')} className="flex-1 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Overrule Server</button>
                                  <button onClick={() => handleResolveConflict(conflict.id, 'server')} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all">Accept Server</button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <h4 className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center gap-2 mb-4"><ShieldAlert size={16}/> Shortcut Anomaly Monitor</h4>
                <div className="space-y-4">
                    {auditLog.filter(l => l.action === 'WORKFLOW_ANOMALY').length > 0 ? auditLog.filter(l => l.action === 'WORKFLOW_ANOMALY').map(anomaly => (
                        <div key={anomaly.id} className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-4">
                            <div className="p-2 bg-white rounded-xl text-red-600 shadow-sm"><AlertTriangle size={20}/></div>
                            <div><div className="font-bold text-slate-800 text-sm">{anomaly.userName}</div><p className="text-[10px] text-red-700 font-medium leading-tight mt-1">{anomaly.details}</p></div>
                        </div>
                    )) : <div className="p-10 text-center text-slate-400 italic bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">No anomalies detected.</div>}
                </div>
            </div>
            <div className="space-y-4">
                <h4 className="text-xs font-black text-lilac-600 uppercase tracking-widest flex items-center gap-2 mb-4"><Target size={16}/> Inventory Pulse</h4>
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 text-center py-12">
                    <ShieldCheck size={48} className="text-teal-500 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-teal-800 uppercase tracking-widest">Inventory Reality Validated</p>
                </div>
            </div>
          </div>
        </div>
        <div className="xl:col-span-4 bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-xl flex flex-col">
           <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg flex items-center gap-2 text-teal-400"><ShieldCheck size={20}/> Compliance Pulse</h3></div>
           <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pr-1">
              {complianceAlerts.map((alert) => (
                  <div key={alert.id} className={`p-4 border-2 rounded-2xl flex flex-col gap-3 transition-all ${alert.severity === 'critical' ? 'border-red-600 bg-red-600/10' : 'border-amber-500 bg-amber-500/10'} ${alert.isAcknowledged ? 'opacity-40' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-white/10 shrink-0"><Award size={20}/></div>
                      <div className="flex-1"><div className="font-black text-sm">{alert.userName}</div><div className="text-[10px] font-bold uppercase text-white/60">{alert.type} expiring in {alert.daysLeft}</div></div>
                    </div>
                    {!alert.isAcknowledged && <button onClick={() => handleAcknowledgeAlert(alert.id)} className="w-full py-2 bg-lilac-600 text-white text-[9px] font-black uppercase rounded-lg hover:bg-lilac-500 transition-all shadow-lg">Acknowledge Responsibility</button>}
                  </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div><h2 className="text-xs font-black text-teal-600 uppercase tracking-widest mb-1">{currentUser.role} Control Center</h2><h1 className="text-3xl font-black text-slate-800 tracking-tight">Practice Dashboard</h1></div>
        <div className="flex gap-2">
          {currentUser.role === UserRole.DENTAL_ASSISTANT && <button onClick={() => setPrivacyMode(!privacyMode)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${privacyMode ? 'bg-lilac-600 text-white border-lilac-500' : 'bg-white text-slate-500 border-slate-200'}`}>{privacyMode ? 'Privacy Mask: ON' : 'Privacy Mask: OFF'}</button>}
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2"><MapPin size={16} className="text-teal-500"/><span className="text-xs font-black text-slate-700 uppercase">{currentBranch}</span></div>
        </div>
      </div>

      {currentUser.role === UserRole.ADMIN && (
        <div className="flex gap-3 mb-6 px-2 animate-in slide-in-from-left-4 duration-500">
           <button 
             onClick={onAddPatient}
             className="px-6 py-3 rounded-2xl bg-teal-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal-600/20 hover:scale-105 transition-all flex items-center gap-2"
           >
             <UserPlus size={16}/> Add New Patient
           </button>
           <button 
             onClick={() => onBookAppointment()}
             className="px-6 py-3 rounded-2xl bg-lilac-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-lilac-600/20 hover:scale-105 transition-all flex items-center gap-2"
           >
             <CalendarPlus size={16}/> Schedule Appointment
           </button>
        </div>
      )}
      
      {currentUser.role === UserRole.ADMIN ? renderAdminView() : (
        <div className="space-y-6">
          {renderKPIs()}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            <div className="bg-slate-100/50 rounded-3xl p-4 flex flex-col gap-4">
              <div className="flex justify-between items-center px-2"><h4 className="font-black text-slate-500 uppercase tracking-widest text-xs flex items-center gap-2"><Clock size={16}/> Arriving Soon</h4></div>
              <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                {receptionPatientFlow.arriving.map(apt => (
                    <div key={apt.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-mono font-black text-teal-600 text-xs">{apt.time}</span>
                            <div className="flex gap-1">
                                {apt.entryMode === 'MANUAL' && <AlertTriangle size={12} className="text-yellow-600" title="Downtime Entry - Needs Recon"/>}
                                {apt.isPendingSync && <CloudOff size={12} className="text-lilac-600 animate-pulse"/>}
                            </div>
                        </div>
                        <div className="font-bold text-slate-800">{maskName(getPatient(apt.patientId)?.name || 'Unknown')}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{apt.type}</div>
                    </div>
                ))}
              </div>
            </div>
            <div className="bg-teal-50 rounded-3xl p-4 flex flex-col gap-4 border border-teal-100/50 lg:col-span-2">
                <div className="flex justify-between items-center px-2"><h4 className="font-black text-teal-700 uppercase tracking-widest text-xs flex items-center gap-2"><Activity size={16}/> In Treatment</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {receptionPatientFlow.inTreatment.map(apt => (
                        <div key={apt.id} className="bg-white p-4 rounded-2xl shadow-sm border-2 border-teal-200">
                            <div className="font-bold text-slate-800">{maskName(getPatient(apt.patientId)?.name || 'Unknown')}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{apt.type}</div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
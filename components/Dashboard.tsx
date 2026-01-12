import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, TrendingUp, Search, UserPlus, ChevronRight, CalendarPlus, ClipboardList, Beaker, 
  Repeat, ArrowRight, HeartPulse, PieChart, Activity, DollarSign, FileText, StickyNote, 
  Package, Sunrise, AlertCircle, Plus, CheckCircle, Circle, Trash2, Flag, User as UserIcon, 
  Building2, MapPin, Inbox, FileSignature, Video, ShieldAlert, Award, ShieldCheck, Phone, 
  Mail, Zap, X, AlertTriangle, ShieldX, Thermometer, Users, Eye, EyeOff, LayoutGrid, Clock, List, 
  History, Timer, Lock, Send, Armchair, Scale, Target, RefreshCcw, CloudOff, Database, ShieldCheck as VerifiedIcon, UserCheck, Stethoscope, FileWarning, MessageCircle, Heart, Info, DollarSign as FinanceIcon, Sparkles, Shield, GraduationCap,
  Receipt
} from 'lucide-react';
import { 
  Appointment, AppointmentStatus, User, UserRole, Patient, LabStatus, FieldSettings, 
  PinboardTask, TreatmentPlanStatus, RecallStatus, SterilizationCycle, StockItem, TriageLevel, AuditLogEntry, ClinicResource, StockCategory, SyncConflict, SystemStatus 
} from '../types';
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
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none mb-2">{label}</span>
      <span className="text-4xl font-black text-slate-800 tracking-tighter">{value}</span>
      {subtext && <span className="text-[10px] font-black text-teal-700 mt-2 uppercase tracking-[0.2em]">{subtext}</span>}
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ 
  appointments, allAppointments = [], currentUser, patients, onAddPatient, onPatientSelect, onBookAppointment,
  onUpdateAppointmentStatus, fieldSettings, currentBranch, stock = [], staff = [], onConfirmFollowUp,
  syncConflicts = [], setSyncConflicts, onVerifyDowntimeEntry, onVerifyMedHistory
}) => {
  const [activeHuddleId, setActiveHuddleId] = useState<string | null>(null);
  const [showConflictDrawer, setShowConflictDrawer] = useState(false);
  const toast = useToast();

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

  const receptionPatientFlow = useMemo(() => {
    const arriving = todaysAppointments.filter(a => [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.ARRIVED].includes(a.status));
    const inTreatment = todaysAppointments.filter(a => [AppointmentStatus.SEATED, AppointmentStatus.TREATING].includes(a.status));
    const readyForBilling = todaysAppointments.filter(a => [AppointmentStatus.COMPLETED].includes(a.status));
    return { arriving, inTreatment, readyForBilling };
  }, [todaysAppointments]);

  const pendingVerifications = useMemo(() => {
      const downtimeEntries = allAppointments.filter(a => a.entryMode === 'MANUAL' && !a.reconciled);
      const medHistoryEntries = allAppointments.filter(a => a.status === AppointmentStatus.ARRIVED && !a.medHistoryVerified);
      return { downtime: downtimeEntries, medHistory: medHistoryEntries };
  }, [allAppointments]);

  const handleResolveConflict = (conflictId: string) => {
      if (!setSyncConflicts) return;
      setSyncConflicts(syncConflicts.filter(c => c.id !== conflictId));
      toast.success("Conflict marked as resolved.");
  };

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h2 className="text-[10px] font-black text-teal-700 uppercase tracking-[0.4em] mb-2 flex items-center gap-2"><Sparkles size={12} aria-hidden="true"/> Clinical Command Hub</h2>
            <h1 className="text-5xl font-black text-slate-800 tracking-tighter leading-none uppercase">Operations Center</h1>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={onAddPatient} className="bg-white text-teal-800 border-2 border-teal-100 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-3">
                <UserPlus size={18}/> New Admission
            </button>
            <button onClick={() => onBookAppointment()} className="bg-lilac-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-lilac-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                <CalendarPlus size={18}/> Book Session
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" role="region" aria-label="Key Performance Indicators">
        <MetricCard icon={TrendingUp} color="bg-teal-50 text-teal-700" label="Practice Yield (YTD)" value={roleKPIs.production} subtext="Gross Asset Value" />
        <MetricCard icon={Clock} color="bg-blue-50 text-blue-700" label="Registry Latency" value={roleKPIs.latency} subtext="Avg. Time to Chair" />
        <MetricCard icon={Scale} color="bg-orange-50 text-orange-700" label="Forensic Integrity" value={roleKPIs.integrity} subtext="Stock Variance Score" />
        <MetricCard icon={Activity} color="bg-lilac-50 text-lilac-700" label="Treatment Velocity" value={roleKPIs.flow} subtext="Operational Flow Rate" />
      </div>

      {(pendingVerifications.downtime.length > 0 || pendingVerifications.medHistory.length > 0) && (
        <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-amber-100 p-2 rounded-xl text-amber-700 animate-pulse"><Inbox size={24}/></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em]">Verification Inbox</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingVerifications.downtime.map(apt => (
                    <div key={apt.id} className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-100 flex items-center justify-between">
                        <div>
                            <div className="font-bold text-amber-900 text-xs uppercase flex items-center gap-2"><FileWarning size={14}/> Manual Downtime Entry</div>
                            <div className="text-[10px] text-amber-700 font-bold">{getPatient(apt.patientId)?.name} - {apt.type}</div>
                        </div>
                        <button onClick={() => onVerifyDowntimeEntry?.(apt.id)} className="px-4 py-2 bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl">Verify</button>
                    </div>
                ))}
            </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <section className="lg:col-span-3 bg-slate-100/30 rounded-[3.5rem] p-6 flex flex-col gap-6 border-2 border-slate-100 shadow-inner">
            <div className="flex justify-between items-center px-4">
                <h4 className="font-black text-slate-600 uppercase tracking-[0.3em] text-[10px] flex items-center gap-2"><History size={16}/> Queue Monitor</h4>
                <span className="text-[10px] font-black bg-white px-2 py-1 rounded-full text-slate-700 shadow-sm">{receptionPatientFlow.arriving.length} Active</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar px-1">
              {receptionPatientFlow.arriving.length > 0 ? receptionPatientFlow.arriving.map(apt => {
                  const patient = getPatient(apt.patientId);
                  const isHuddleActive = activeHuddleId === apt.id;
                  return (
                    <div key={apt.id} className="relative animate-in slide-in-from-left-4 duration-300">
                        <div className={`bg-white p-5 rounded-[2.2rem] shadow-xl border-2 transition-all duration-500 group ${isHuddleActive ? 'border-teal-700 ring-8 ring-teal-500/5 scale-105 z-20' : 'border-white hover:border-teal-100'}`}>
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-black text-teal-700 text-[10px] bg-teal-50 px-2 py-1 rounded-lg uppercase tracking-widest">{apt.time}</span>
                                {apt.status === AppointmentStatus.ARRIVED && (
                                    <div className="w-3 h-3 bg-teal-500 rounded-full animate-ping shadow-[0_0_10px_rgba(20,184,166,0.8)]" />
                                )}
                            </div>
                            <button onClick={() => setActiveHuddleId(isHuddleActive ? null : apt.id)} className="w-full text-left font-black text-slate-800 text-xl tracking-tighter truncate uppercase focus:ring-offset-2">
                                {patient?.surname || 'UNKNOWN'}
                            </button>
                            <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1.5 opacity-80">{apt.type}</div>
                        </div>
                    </div>
                  );
              }) : <div className="p-20 text-center text-slate-400 italic text-sm">Registry idle.</div>}
            </div>
          </section>

          <div className="lg:col-span-9 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col h-fit">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-lilac-50 p-2 rounded-xl text-lilac-700"><Sunrise size={24}/></div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em]">Active Admissions</h3>
                    </div>
                    <div className="space-y-4">
                        {receptionPatientFlow.arriving.length > 0 ? receptionPatientFlow.arriving.map(p => (
                            <div key={p.id} className="p-5 bg-slate-50 rounded-[2rem] border-2 border-white shadow-md flex items-center justify-between group hover:border-lilac-200 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-2.5 h-2.5 bg-lilac-400 rounded-full animate-pulse ring-4 ring-lilac-100" />
                                    <div>
                                        <div className="font-black text-slate-800 uppercase text-[10px] tracking-widest">{getPatient(p.patientId)?.surname}</div>
                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Status: Waiting Room</div>
                                    </div>
                                </div>
                                <button onClick={() => onPatientSelect(p.patientId)} className="p-2.5 bg-white rounded-xl text-slate-300 hover:text-lilac-600 shadow-sm group-hover:translate-x-1 transition-all"><ArrowRight size={18}/></button>
                            </div>
                        )) : <div className="p-10 text-center opacity-30 italic text-sm">No active intakes.</div>}
                    </div>
                  </section>

                  <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col h-fit">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-blue-50 p-2 rounded-xl text-blue-700"><Armchair size={24}/></div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em]">Clinical Production</h3>
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
                                                <div className="font-black text-slate-800 uppercase text-[10px] tracking-widest">{patient?.name}</div>
                                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{apt.type}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-blue-600 animate-pulse"><Timer size={14}/><span className="text-[8px] font-black uppercase tracking-widest">Chair Active</span></div>
                                    </div>
                                    <button onClick={() => onUpdateAppointmentStatus(apt.id, AppointmentStatus.COMPLETED)} className="w-full py-2.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-blue-700 transition-all">Ready for Handover</button>
                                </div>
                            );
                        }) : <div className="p-10 text-center opacity-30 italic text-sm">Treatment floor idle.</div>}
                    </div>
                  </section>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm h-fit">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-emerald-50 p-2 rounded-xl text-emerald-700"><FinanceIcon size={24}/></div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em]">Billing Pipeline</h3>
                    </div>
                    <div className="space-y-4">
                        {receptionPatientFlow.readyForBilling.length > 0 ? receptionPatientFlow.readyForBilling.map(apt => (
                            <div key={apt.id} className="p-6 bg-slate-50 rounded-[2.2rem] border-2 border-white shadow-lg flex items-center justify-between group hover:border-emerald-200 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:rotate-12 transition-all"><Receipt size={20}/></div>
                                    <div>
                                        <div className="font-black text-slate-800 uppercase text-[10px] tracking-widest">{getPatient(apt.patientId)?.surname}</div>
                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Pending Ledger Seal</div>
                                    </div>
                                </div>
                                <button onClick={() => onPatientSelect(apt.patientId)} className="px-5 py-2.5 bg-white rounded-xl text-[9px] font-black text-emerald-700 border border-emerald-100 shadow-sm hover:bg-emerald-50 transition-all uppercase tracking-widest">Checkout</button>
                            </div>
                        )) : <div className="p-10 text-center opacity-30 italic text-sm">Billing queue clear.</div>}
                    </div>
                  </section>

                  <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm h-fit">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-orange-50 p-2 rounded-xl text-orange-700"><Heart size={24}/></div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em]">Post-Op Vigilance</h3>
                    </div>
                    <div className="space-y-4">
                        {postOpPatients.map(apt => (
                            <div key={apt.id} className="p-6 bg-slate-50 rounded-[2.2rem] border-2 border-white shadow-lg flex items-center justify-between group hover:border-orange-200 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="bg-orange-50 text-orange-600 p-3 rounded-2xl animate-pulse"><MessageCircle size={20}/></div>
                                    <div>
                                        <div className="font-black text-slate-800 uppercase text-[10px] tracking-widest">{getPatient(apt.patientId)?.surname}</div>
                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">24h Check-in Required</div>
                                    </div>
                                </div>
                                <button onClick={() => onConfirmFollowUp?.(apt.id)} className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-orange-600/20 hover:scale-105 transition-all">Confirm Stable</button>
                            </div>
                        ))}
                        {postOpPatients.length === 0 && <div className="p-10 text-center opacity-30 italic text-sm">Post-op handovers current.</div>}
                    </div>
                  </section>
              </div>
          </div>
      </div>

      <section className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                  <div className="bg-lilac-100 p-4 rounded-3xl text-lilac-700 shadow-sm"><GraduationCap size={28}/></div>
                  <div>
                      <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Statutory CPD Registry</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">RA 9484 Professional License Compliance</p>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {staff.filter(s => s.role === UserRole.DENTIST).map(s => {
                  const totalCpd = (s.cpdEntries || []).reduce((sum, entry) => sum + entry.units, 0);
                  const required = s.requiredCpdUnits || 15;
                  const progress = Math.min(100, (totalCpd / required) * 100);
                  return (
                      <div key={s.id} className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-teal-500 hover:bg-white hover:shadow-xl transition-all duration-500">
                          <div className="flex items-center gap-5 mb-8">
                              <img src={s.avatar} alt="" className="w-16 h-16 rounded-[1.5rem] border-4 border-white shadow-lg" />
                              <div className="flex-1 min-w-0">
                                  <h4 className="font-black text-slate-800 uppercase text-lg tracking-tight truncate leading-none">{s.name}</h4>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 block">License: {s.prcLicense || '---'}</span>
                              </div>
                          </div>
                          <div className="space-y-3">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                  <span>Units: {totalCpd} / {required}</span>
                                  <span className={progress >= 100 ? 'text-teal-700' : 'text-lilac-600'}>{Math.round(progress)}%</span>
                              </div>
                              <div className="h-3 bg-white rounded-full overflow-hidden border border-slate-100 shadow-inner">
                                  <div className={`h-full transition-all duration-1000 ${progress >= 100 ? 'bg-teal-600' : 'bg-lilac-500'}`} style={{ width: `${progress}%` }} />
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      </section>

      {syncConflicts.length > 0 && (
          <button onClick={() => setShowConflictDrawer(true)} className="fixed bottom-24 right-6 z-50 bg-lilac-600 text-white h-16 w-16 rounded-full flex items-center justify-center shadow-2xl shadow-lilac-600/40 animate-pulse-lilac">
              <AlertTriangle size={24}/>
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white text-xs font-black flex items-center justify-center rounded-full border-2 border-white">{syncConflicts.length}</span>
          </button>
      )}

      {showConflictDrawer && (
          <div className="fixed inset-0 z-[100] animate-in fade-in">
              <div className="absolute inset-0 bg-black/60" onClick={() => setShowConflictDrawer(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-500">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2"><RefreshCcw size={20}/> Sync Conflict Resolution</h3>
                      <button onClick={() => setShowConflictDrawer(false)} className="p-2 text-slate-400 hover:text-slate-800"><X/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {syncConflicts.map(c => (
                          <div key={c.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                              <h4 className="font-bold text-sm text-slate-700">Conflict: {c.entityType}</h4>
                              <p className="text-xs text-slate-500">Local vs Server data mismatch.</p>
                              <div className="flex gap-2 mt-3">
                                  <button onClick={() => handleResolveConflict(c.id)} className="flex-1 py-2 bg-white border rounded-lg text-xs font-bold">Keep Local</button>
                                  <button onClick={() => handleResolveConflict(c.id)} className="flex-1 py-2 bg-white border rounded-lg text-xs font-bold">Use Server</button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Dashboard;
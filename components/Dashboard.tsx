import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, TrendingUp, Search, UserPlus, ChevronRight, CalendarPlus, ClipboardList, Beaker, 
  Repeat, ArrowRight, HeartPulse, PieChart, Activity, DollarSign, FileText, StickyNote, 
  Package, Sunrise, AlertCircle, Plus, CheckCircle, Circle, Trash2, Flag, User as UserIcon, 
  Building2, MapPin, Inbox, FileSignature, Video, ShieldAlert, Award, ShieldCheck, Phone, 
  Mail, Zap, X, AlertTriangle, ShieldX, Thermometer, Users, Eye, EyeOff, LayoutGrid, Clock, List, 
  History, Timer, Lock, Send, Armchair, Scale, Target, RefreshCcw, CloudOff, Database, ShieldCheck as VerifiedIcon, UserCheck, Stethoscope, FileWarning, MessageCircle, Heart, Info, DollarSign as FinanceIcon, Sparkles, Shield, GraduationCap, Receipt
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
  <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex items-center gap-4 md:gap-6 group hover:shadow-xl hover:border-teal-100 transition-all duration-500">
    <div className={`p-3 md:p-4 lg:p-5 rounded-xl md:rounded-[1.5rem] ${color} transition-transform group-hover:scale-110 duration-500 shadow-lg shadow-current/10`} aria-hidden="true">
      <Icon size={24} className="md:w-6 md:h-6 lg:w-8 lg:h-8" />
    </div>
    <div className="flex flex-col min-w-0">
      <span className="text-[8px] md:text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.3em] leading-none mb-1 md:mb-2 truncate">{label}</span>
      <span className="text-xl md:text-3xl lg:text-4xl font-black text-slate-800 tracking-tighter leading-none">{value}</span>
      {subtext && <span className="text-[7px] md:text-[8px] lg:text-[10px] font-black text-teal-700 mt-1.5 md:mt-2 uppercase tracking-widest truncate">{subtext}</span>}
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ 
  appointments, allAppointments = [], currentUser, patients, onAddPatient, onPatientSelect, onBookAppointment,
  onUpdateAppointmentStatus, fieldSettings, currentBranch, stock = [], staff = [], onConfirmFollowUp
}) => {
  const [activeHuddleId, setActiveHuddleId] = useState<string | null>(null);

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

  return (
    <div className="space-y-6 md:space-y-10 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 md:gap-6">
        <div className="min-w-0">
            <h2 className="text-[8px] md:text-[10px] font-black text-teal-700 uppercase tracking-[0.4em] mb-1.5 flex items-center gap-2 truncate"><Sparkles size={10} aria-hidden="true"/> Clinical Command Hub</h2>
            <h1 className="text-2xl md:text-5xl font-black text-slate-800 tracking-tighter leading-none uppercase truncate">Operations</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
            <button onClick={onAddPatient} className="flex-1 sm:flex-none bg-white text-teal-800 border-2 border-teal-100 px-4 md:px-8 py-2.5 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 md:gap-3">
                <UserPlus size={16}/> Admission
            </button>
            <button onClick={() => onBookAppointment()} className="flex-1 sm:flex-none bg-lilac-600 text-white px-4 md:px-8 py-2.5 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-xl shadow-lilac-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 md:gap-3">
                <CalendarPlus size={16}/> Book
            </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8" role="region" aria-label="Key Performance Indicators">
        <MetricCard icon={TrendingUp} color="bg-teal-50 text-teal-700" label="Yield (YTD)" value={roleKPIs.production} subtext="Gross Asset" />
        <MetricCard icon={Clock} color="bg-blue-50 text-blue-700" label="Latency" value={roleKPIs.latency} subtext="Avg. Time" />
        <MetricCard icon={Scale} color="bg-orange-50 text-orange-700" label="Forensic Integrity" value={roleKPIs.integrity} subtext="Variance Score" />
        <MetricCard icon={Activity} color="bg-lilac-50 text-lilac-700" label="Velocity" value={roleKPIs.flow} subtext="Shift Flow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
          
          <section className="lg:col-span-3 bg-slate-100/30 rounded-3xl md:rounded-[3.5rem] p-4 md:p-6 flex flex-col gap-4 md:gap-6 border-2 border-slate-100 shadow-inner">
            <div className="flex justify-between items-center px-2">
                <h4 className="font-black text-slate-600 uppercase tracking-[0.3em] text-[8px] md:text-[10px] flex items-center gap-2"><History size={14}/> Queue</h4>
                <span className="text-[8px] md:text-[10px] font-black bg-white px-2 py-0.5 rounded-full text-slate-700 shadow-sm">{receptionPatientFlow.arriving.length} Active</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 md:space-y-4 no-scrollbar px-1 min-h-[200px] md:min-h-0">
              {receptionPatientFlow.arriving.length > 0 ? receptionPatientFlow.arriving.map(apt => {
                  const patient = getPatient(apt.patientId);
                  const isHuddleActive = activeHuddleId === apt.id;
                  return (
                    <div key={apt.id} className="relative animate-in slide-in-from-left-4 duration-300">
                        <div className={`bg-white p-4 md:p-5 rounded-2xl md:rounded-[2.2rem] shadow-lg border-2 transition-all duration-500 group ${isHuddleActive ? 'border-teal-700 ring-4 md:ring-8 ring-teal-500/5 scale-105 z-20' : 'border-white hover:border-teal-100'}`}>
                            <div className="flex justify-between items-center mb-2 md:mb-3">
                                <span className="font-black text-teal-700 text-[8px] md:text-[10px] bg-teal-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg uppercase tracking-widest">{apt.time}</span>
                                {apt.status === AppointmentStatus.ARRIVED && (
                                    <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-ping shadow-[0_0_10px_rgba(20,184,166,0.8)]" />
                                )}
                            </div>
                            <button onClick={() => setActiveHuddleId(isHuddleActive ? null : apt.id)} className="w-full text-left font-black text-slate-800 text-base md:text-xl tracking-tighter truncate uppercase focus:ring-offset-2">
                                {patient?.surname || 'UNKNOWN'}
                            </button>
                            <div className="text-[7px] md:text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1 opacity-80 truncate">{apt.type}</div>
                        </div>
                    </div>
                  );
              }) : <div className="py-12 md:py-20 text-center text-slate-400 italic text-xs md:text-sm">Registry idle.</div>}
            </div>
          </section>

          <div className="lg:col-span-9 space-y-6 md:space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                  <section className="bg-white rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 border border-slate-200 shadow-sm flex flex-col h-fit">
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                        <div className="bg-lilac-50 p-1.5 md:p-2 rounded-lg md:rounded-xl text-lilac-700"><Sunrise size={20} className="md:w-6 md:h-6"/></div>
                        <h3 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest md:tracking-[0.3em]">Active Admissions</h3>
                    </div>
                    <div className="space-y-3 md:space-y-4">
                        {receptionPatientFlow.arriving.length > 0 ? receptionPatientFlow.arriving.map(p => (
                            <div key={p.id} className="p-4 md:p-5 bg-slate-50 rounded-2xl md:rounded-[2rem] border-2 border-white shadow-md flex items-center justify-between group hover:border-lilac-200 transition-all">
                                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                    <div className="w-2 md:w-2.5 h-2 md:h-2.5 bg-lilac-400 rounded-full animate-pulse ring-2 md:ring-4 ring-lilac-100 shrink-0" />
                                    <div className="min-w-0">
                                        <div className="font-black text-slate-800 uppercase text-[9px] md:text-[10px] tracking-widest truncate">{getPatient(p.patientId)?.surname}</div>
                                        <div className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5 truncate">Status: Waiting Room</div>
                                    </div>
                                </div>
                                <button onClick={() => onPatientSelect(p.patientId)} className="p-2 md:p-2.5 bg-white rounded-lg md:rounded-xl text-slate-300 hover:text-lilac-600 shadow-sm group-hover:translate-x-1 transition-all shrink-0"><ArrowRight size={16}/></button>
                            </div>
                        )) : <div className="py-8 md:py-10 text-center opacity-30 italic text-xs md:text-sm">No active intakes.</div>}
                    </div>
                  </section>

                  <section className="bg-white rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 border border-slate-200 shadow-sm flex flex-col h-fit">
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                        <div className="bg-blue-50 p-1.5 md:p-2 rounded-lg md:rounded-xl text-blue-700"><Armchair size={20} className="md:w-6 md:h-6"/></div>
                        <h3 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest md:tracking-[0.3em]">Production</h3>
                    </div>
                    <div className="space-y-3 md:space-y-4">
                        {receptionPatientFlow.inTreatment.length > 0 ? receptionPatientFlow.inTreatment.map(apt => {
                            const patient = getPatient(apt.patientId);
                            const provider = staff.find(s => s.id === apt.providerId);
                            return (
                                <div key={apt.id} className="p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-[2rem] border-2 border-white shadow-md space-y-3 md:space-y-4 group hover:border-blue-200 transition-all">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                            <img src={provider?.avatar} alt="" className="w-8 md:w-10 h-8 md:h-10 rounded-full border-2 border-white shadow-sm shrink-0" />
                                            <div className="min-w-0">
                                                <div className="font-black text-slate-800 uppercase text-[9px] md:text-[10px] tracking-widest truncate">{patient?.name}</div>
                                                <div className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5 truncate">{apt.type}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-blue-600 animate-pulse shrink-0"><Timer size={12}/><span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Active</span></div>
                                    </div>
                                    <button onClick={() => onUpdateAppointmentStatus(apt.id, AppointmentStatus.COMPLETED)} className="w-full py-2 md:py-2.5 bg-blue-600 text-white text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg md:rounded-xl shadow-lg hover:bg-blue-700 transition-all">Handover</button>
                                </div>
                            );
                        }) : <div className="py-8 md:py-10 text-center opacity-30 italic text-xs md:text-sm">Treatment floor idle.</div>}
                    </div>
                  </section>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                  <section className="bg-white rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 border border-slate-200 shadow-sm h-fit">
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                        <div className="bg-emerald-50 p-1.5 md:p-2 rounded-lg md:rounded-xl text-emerald-700"><FinanceIcon size={20} className="md:w-6 md:h-6"/></div>
                        <h3 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest md:tracking-[0.3em]">Billing Pipeline</h3>
                    </div>
                    <div className="space-y-3 md:space-y-4">
                        {receptionPatientFlow.readyForBilling.length > 0 ? receptionPatientFlow.readyForBilling.map(apt => (
                            <div key={apt.id} className="p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-[2.2rem] border-2 border-white shadow-lg flex items-center justify-between group hover:border-emerald-200 transition-all">
                                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                    <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-emerald-50 text-emerald-600 group-hover:rotate-12 transition-all shrink-0"><Receipt size={16} className="md:w-5 md:h-5"/></div>
                                    <div className="min-w-0">
                                        <div className="font-black text-slate-800 uppercase text-[9px] md:text-[10px] tracking-widest truncate">{getPatient(apt.patientId)?.surname}</div>
                                        <div className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5 truncate">Pending Ledger</div>
                                    </div>
                                </div>
                                <button onClick={() => onPatientSelect(apt.patientId)} className="px-3 md:px-5 py-1.5 md:py-2.5 bg-white rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black text-emerald-700 border border-emerald-100 shadow-sm hover:bg-emerald-50 transition-all uppercase tracking-widest shrink-0">Checkout</button>
                            </div>
                        )) : <div className="py-8 md:py-10 text-center opacity-30 italic text-xs md:text-sm">Billing queue clear.</div>}
                    </div>
                  </section>

                  <section className="bg-white rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 border border-slate-200 shadow-sm h-fit">
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                        <div className="bg-orange-50 p-1.5 md:p-2 rounded-lg md:rounded-xl text-orange-700"><Heart size={20} className="md:w-6 md:h-6"/></div>
                        <h3 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest md:tracking-[0.3em]">Post-Op Vigilance</h3>
                    </div>
                    <div className="space-y-3 md:space-y-4">
                        {postOpPatients.map(apt => (
                            <div key={apt.id} className="p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-[2.2rem] border-2 border-white shadow-lg flex items-center justify-between group hover:border-orange-200 transition-all">
                                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                    <div className="bg-orange-50 text-orange-600 p-2 md:p-3 rounded-xl md:rounded-2xl animate-pulse shrink-0"><MessageCircle size={16} className="md:w-5 md:h-5"/></div>
                                    <div className="min-w-0">
                                        <div className="font-black text-slate-800 uppercase text-[9px] md:text-[10px] tracking-widest truncate">{getPatient(apt.patientId)?.surname}</div>
                                        <div className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5 truncate">24h Check-in</div>
                                    </div>
                                </div>
                                <button onClick={() => onConfirmFollowUp?.(apt.id)} className="px-3 md:px-5 py-1.5 md:py-2.5 bg-orange-600 text-white rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest shadow-lg shadow-orange-600/20 hover:scale-105 transition-all shrink-0">Stable</button>
                            </div>
                        ))}
                        {postOpPatients.length === 0 && <div className="py-8 md:py-10 text-center opacity-30 italic text-xs md:text-sm">Post-op handover current.</div>}
                    </div>
                  </section>
              </div>
          </div>
      </div>

      <section className="bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6 md:mb-10">
              <div className="flex items-center gap-3 md:gap-4">
                  <div className="bg-lilac-100 p-2 md:p-4 rounded-xl md:rounded-3xl text-lilac-700 shadow-sm shrink-0"><GraduationCap size={24} className="md:w-7 md:h-7"/></div>
                  <div>
                      <h3 className="text-lg md:text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">CPD Registry</h3>
                      <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">RA 9484 Compliance</p>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {staff.filter(s => s.role === UserRole.DENTIST).map(s => {
                  const totalCpd = (s.cpdEntries || []).reduce((sum, entry) => sum + entry.units, 0);
                  const required = s.requiredCpdUnits || 15;
                  const progress = Math.min(100, (totalCpd / required) * 100);
                  return (
                      <div key={s.id} className="p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-teal-500 hover:bg-white hover:shadow-xl transition-all duration-500">
                          <div className="flex items-center gap-4 md:gap-5 mb-5 md:mb-8">
                              <img src={s.avatar} alt="" className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] border-4 border-white shadow-lg shrink-0" />
                              <div className="flex-1 min-w-0">
                                  <h4 className="font-black text-slate-800 uppercase text-sm md:text-lg tracking-tight truncate leading-none">{s.name}</h4>
                                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 md:mt-2 block truncate">License: {s.prcLicense || '---'}</span>
                              </div>
                          </div>
                          <div className="space-y-2 md:space-y-3">
                              <div className="flex justify-between text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">
                                  <span>Units: {totalCpd} / {required}</span>
                                  <span className={progress >= 100 ? 'text-teal-700' : 'text-lilac-600'}>{Math.round(progress)}%</span>
                              </div>
                              <div className="h-2 md:h-3 bg-white rounded-full overflow-hidden border border-slate-100 shadow-inner">
                                  <div className={`h-full transition-all duration-1000 ${progress >= 100 ? 'bg-teal-600' : 'bg-lilac-500'}`} style={{ width: `${progress}%` }} />
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      </section>
    </div>
  );
};

export default Dashboard;
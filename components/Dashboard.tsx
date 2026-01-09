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
  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex items-start gap-5 group hover:shadow-xl hover:border-teal-100 transition-all duration-500">
    <div className={`p-5 rounded-[1.5rem] ${color} transition-transform group-hover:scale-110 duration-500 shadow-lg shadow-current/10 shrink-0`} aria-hidden="true">
      <Icon size={28} />
    </div>
    <div className="flex flex-col min-w-0 pt-1">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2 truncate block">{label}</span>
      <span className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter leading-none break-all">{value}</span>
      {subtext && <span className="text-[8px] font-black text-teal-700 mt-2 uppercase tracking-widest truncate">{subtext}</span>}
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
    <div className="space-y-6 md:space-y-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 md:gap-6">
        <div className="min-w-0">
            <h2 className="text-[8px] md:text-[9px] font-black text-teal-700 uppercase tracking-[0.4em] mb-1 flex items-center gap-2 truncate"><Sparkles size={10} aria-hidden="true"/> Clinical Command Hub</h2>
            <h1 className="text-xl md:text-3xl lg:text-4xl font-black text-slate-800 tracking-tighter leading-none uppercase truncate">Operations</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
            <button onClick={onAddPatient} className="flex-1 sm:flex-none bg-white text-teal-800 border-2 border-teal-100 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2">
                <UserPlus size={16}/> Admission
            </button>
            <button onClick={() => onBookAppointment()} className="flex-1 sm:flex-none bg-lilac-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-lilac-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
                <CalendarPlus size={16}/> Book
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-6" role="region" aria-label="Key Performance Indicators">
        <MetricCard icon={TrendingUp} color="bg-teal-50 text-teal-700" label="Yield (YTD)" value={roleKPIs.production} subtext="Gross Asset" />
        <MetricCard icon={Clock} color="bg-blue-50 text-blue-700" label="Latency" value={roleKPIs.latency} subtext="Avg. Time" />
        <MetricCard icon={Scale} color="bg-orange-50 text-orange-700" label="Forensic Integrity" value={roleKPIs.integrity} subtext="Variance Score" />
        <MetricCard icon={Activity} color="bg-lilac-50 text-lilac-700" label="Velocity" value={roleKPIs.flow} subtext="Shift Flow" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
          <div className="space-y-6 md:gap-8">
              <section className="bg-slate-100/30 rounded-3xl p-5 flex flex-col gap-4 border-2 border-slate-100 shadow-inner h-fit">
                <div className="flex justify-between items-center px-1">
                    <h4 className="font-black text-slate-600 uppercase tracking-[0.3em] text-[8px] md:text-[9px] flex items-center gap-2"><History size={14}/> Queue</h4>
                    <span className="text-[8px] font-black bg-white px-2 py-0.5 rounded-full text-slate-700 shadow-sm">{receptionPatientFlow.arriving.length} Active</span>
                </div>
                <div className="overflow-y-auto space-y-3 no-scrollbar min-h-[150px]">
                  {receptionPatientFlow.arriving.length > 0 ? receptionPatientFlow.arriving.map(apt => {
                      const patient = getPatient(apt.patientId);
                      const isHuddleActive = activeHuddleId === apt.id;
                      return (
                        <div key={apt.id} className="relative animate-in slide-in-from-left-4 duration-300">
                            <div className={`bg-white p-4 rounded-2xl shadow-md border-2 transition-all duration-500 group ${isHuddleActive ? 'border-teal-700 ring-4 ring-teal-500/5 scale-105 z-20' : 'border-white hover:border-teal-100'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-black text-teal-700 text-[8px] bg-teal-50 px-1.5 py-0.5 rounded-lg uppercase tracking-widest">{apt.time}</span>
                                    {apt.status === AppointmentStatus.ARRIVED && (
                                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-ping shadow-[0_0_10px_rgba(20,184,166,0.8)]" />
                                    )}
                                </div>
                                <button onClick={() => setActiveHuddleId(isHuddleActive ? null : apt.id)} className="w-full text-left font-black text-slate-800 text-sm md:text-base tracking-tighter truncate uppercase focus:ring-offset-2">
                                    {patient?.surname || 'UNKNOWN'}
                                </button>
                                <div className="text-[7px] md:text-[8px] text-slate-500 font-black uppercase tracking-widest mt-0.5 opacity-80 truncate">{apt.type}</div>
                            </div>
                        </div>
                      );
                  }) : <div className="py-10 text-center text-slate-400 italic text-xs">Registry idle.</div>}
                </div>
              </section>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
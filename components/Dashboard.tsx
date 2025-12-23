
import React, { useState, useMemo } from 'react';
import { 
  Calendar, Activity, DollarSign, Clock, Zap, AlertTriangle, ShieldCheck, 
  UserCheck, Armchair, ChevronRight, ShieldAlert, HeartPulse, Sparkles, 
  Target, Fingerprint, Lock, Shield, ArrowRight, AlertOctagon, TrendingUp, History, Building2, LayoutGrid, Users
} from 'lucide-react';
import { 
  Appointment, AppointmentStatus, User, UserRole, Patient, FieldSettings, 
  AuditLogEntry, SystemStatus, UIMode 
} from '../types';
import { formatDate } from '../constants';

interface DashboardProps {
  appointments: Appointment[];
  currentUser: User;
  patients: Patient[];
  onPatientSelect: (patientId: string) => void;
  onUpdateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  fieldSettings?: FieldSettings;
  currentBranch: string;
  auditLog?: AuditLogEntry[]; 
  systemStatus?: SystemStatus;
  onViewAllSchedule?: () => void;
  uiMode: UIMode;
  onOpenClosureRitual?: () => void;
  isAuditLogVerified?: boolean | null;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  appointments, currentUser, patients, onPatientSelect, 
  onUpdateAppointmentStatus, fieldSettings, currentBranch, auditLog = [], 
  systemStatus = SystemStatus.OPERATIONAL, onViewAllSchedule, uiMode, onOpenClosureRitual, isAuditLogVerified
}) => {
  const today = new Date().toLocaleDateString('en-CA');
  const isAdmin = currentUser.role === UserRole.ADMIN;

  const todaysAppointments = useMemo(() => 
    appointments.filter(a => a.date === today && !a.isBlock), 
    [appointments, today]
  );

  const getPatient = (id: string) => patients.find(pt => pt.id === id);

  const getUrgencyGradient = (value: number, threshold: number) => {
    if (value >= threshold) return 'bg-[linear-gradient(135deg,#ef4444,#dc2626)] text-white'; // Red
    if (value >= threshold * 0.7) return 'bg-[linear-gradient(135deg,#f59e0b,#d97706)] text-white'; // Amber
    return 'bg-white border-slate-100 text-slate-900'; // Default
  };

  const arrivals = useMemo(() => 
    todaysAppointments.filter(a => a.branch === currentBranch && [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.ARRIVED].includes(a.status)),
    [todaysAppointments, currentBranch]
  );

  const activeChairs = useMemo(() => 
    todaysAppointments.filter(a => a.branch === currentBranch && [AppointmentStatus.SEATED, AppointmentStatus.TREATING].includes(a.status)),
    [todaysAppointments, currentBranch]
  );

  const financialMetrics = useMemo(() => {
    const production = todaysAppointments
      .filter(a => a.status === AppointmentStatus.COMPLETED && a.branch === currentBranch)
      .reduce((sum, apt) => {
        const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
        return sum + (proc?.price || 0);
      }, 0);
    return { production };
  }, [todaysAppointments, fieldSettings, currentBranch]);

  // Clinical Fatigue Calculation
  const loadMinutes = currentUser.fatigueMetric || 0;
  const fatiguePercent = Math.min(100, (loadMinutes / 480) * 100);
  const fatigueColor = loadMinutes >= 480 ? 'bg-red-500 animate-pulse' : loadMinutes >= 360 ? 'bg-lilac-500' : 'bg-teal-500';

  const PatientCard = ({ apt }: { apt: Appointment }) => {
    const p = getPatient(apt.patientId);
    const [h, m] = apt.time.split(':').map(Number);
    const startTime = new Date(); startTime.setHours(h, m, 0);
    const elapsed = Math.max(0, Math.min(100, ((Date.now() - startTime.getTime()) / (apt.durationMinutes * 60000)) * 100));

    return (
      <button 
        onClick={() => onPatientSelect(apt.patientId)}
        className="shrink-0 w-[min(280px,85vw)] sm:w-72 h-44 bg-white p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-lg relative overflow-hidden group transition-all active:scale-95"
      >
        <div className="absolute top-0 right-0 p-4">
          <div className={`w-3 h-3 rounded-full ${apt.status === AppointmentStatus.ARRIVED ? 'bg-orange-500 animate-pulse' : 'bg-teal-500'}`} />
        </div>
        <div className="text-[10px] font-mono font-black text-teal-600 mb-1">{apt.time}</div>
        <div className="text-lg sm:text-xl font-black text-slate-800 truncate">{p?.name || 'Block'}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1 truncate">{apt.type}</div>
        
        <div className="mt-8">
          <div className="flex justify-between items-center mb-1.5">
            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${apt.status === AppointmentStatus.TREATING ? 'bg-lilac-100 text-lilac-600' : 'bg-slate-100 text-slate-500'}`}>
              {apt.status}
            </span>
            <span className="text-[8px] font-bold text-slate-400 uppercase">Progress</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 transition-all duration-1000" style={{ width: `${elapsed}%` }} />
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-700">
      
      {/* SECTION: PULSE INDICATOR */}
      <div className="flex justify-between items-end px-1 sm:px-2">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase leading-tight">Registry Pulse</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex-1 max-w-[200px]">
               <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 mb-1">
                  <span>Clinical Load Sentinel</span>
                  <span>{Math.round(loadMinutes / 60)}h {loadMinutes % 60}m</span>
               </div>
               <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${fatigueColor}`} style={{ width: `${fatiguePercent}%` }} />
               </div>
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Live: {currentBranch}</p>
          </div>
        </div>
        <button onClick={onOpenClosureRitual} className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl active:scale-90 transition-all shrink-0">
          <History size={20} className="text-teal-400" />
        </button>
      </div>

      {/* CAROUSEL: NEXT ARRIVALS */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex justify-between items-center px-1 sm:px-2">
          <h3 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Clock size={16} className="text-teal-600 flex-shrink-0"/> Queued Arrivals
          </h3>
          <span className="text-[8px] sm:text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full whitespace-nowrap">{arrivals.length} Waiting</span>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1 -mx-1 snap-x scroll-smooth">
          {arrivals.length > 0 ? arrivals.map(a => (
            <div key={a.id} className="snap-center"><PatientCard apt={a} /></div>
          )) : (
            <div className="w-full p-8 sm:p-10 text-center bg-slate-100/50 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Arrival feed empty</p>
            </div>
          )}
        </div>
      </div>

      {/* CAROUSEL: ACTIVE CHAIRS */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex justify-between items-center px-1 sm:px-2">
          <h3 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Armchair size={16} className="text-lilac-600 flex-shrink-0"/> Active Treatment Bays
          </h3>
          <span className="text-[8px] sm:text-[10px] font-bold text-lilac-600 bg-lilac-50 px-2 py-0.5 rounded-full whitespace-nowrap">{activeChairs.length} Chairs</span>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1 -mx-1 snap-x scroll-smooth">
          {activeChairs.length > 0 ? activeChairs.map(a => (
            <div key={a.id} className="snap-center"><PatientCard apt={a} /></div>
          )) : (
            <div className="w-full p-8 sm:p-10 text-center bg-slate-100/50 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No active chair sessions</p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION: ECONOMIC PULSE & LICENSE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 px-1 sm:px-2">
        <div className={`p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] shadow-xl border-2 transition-all ${getUrgencyGradient(financialMetrics.production, 25000)}`}>
          <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-3 sm:mb-4 opacity-70">Economic Pulse Today</div>
          <div className="text-3xl sm:text-4xl font-black tracking-tighter">₱{financialMetrics.production.toLocaleString()}</div>
          <div className="mt-4 sm:mt-6 flex items-center justify-between">
            <div className="text-[8px] sm:text-[9px] font-bold uppercase opacity-60">Target: ₱45,000</div>
            <TrendingUp size={24} className="opacity-20" />
          </div>
        </div>

        {currentUser.prcExpiry && (
          <div className={`p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] shadow-xl border-2 transition-all ${
            (new Date(currentUser.prcExpiry).getTime() - Date.now()) / 86400000 < 30 ? 'bg-red-600 text-white' : 'bg-white border-slate-100'
          }`}>
            <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-3 sm:mb-4 opacity-70">Practitioner Compliance</div>
            <div className="text-xl sm:text-2xl font-black tracking-tight uppercase line-clamp-1">License Renewal Due</div>
            <div className="text-[9px] sm:text-[10px] font-bold mt-1 opacity-60">{formatDate(currentUser.prcExpiry)}</div>
            <div className="mt-6 sm:mt-8 flex justify-end">
              <AlertOctagon size={32} className="opacity-10" />
            </div>
          </div>
        )}
      </div>

      {/* ADMIN OVERVIEW WIDGET */}
      {isAdmin && fieldSettings?.features.enableMultiBranch && (
        <div className="px-1 sm:px-2 pb-10">
          <div className="bg-white p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Org Overview</h3>
              <LayoutGrid size={16} className="text-teal-600" />
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {fieldSettings.branches.slice(0, 3).map(b => (
                <div key={b} className="text-center overflow-hidden">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 text-teal-600">
                    <Building2 size={20} sm:size={24} />
                  </div>
                  <div className="text-[7px] sm:text-[8px] font-black uppercase text-slate-800 truncate">{b}</div>
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

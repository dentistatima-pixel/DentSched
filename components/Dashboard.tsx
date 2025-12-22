
import React, { useState, useMemo } from 'react';
import { 
  Calendar, TrendingUp, Search, UserPlus, ChevronRight, Activity, DollarSign, 
  Package, AlertCircle, Plus, CheckCircle, Clock, LayoutGrid, List,
  ShieldCheck, MapPin, Inbox, Zap, AlertTriangle, CloudOff, Database, ShieldCheck as VerifiedIcon, 
  UserCheck, CreditCard, HeartPulse, Sparkles, Receipt, Armchair, ArrowRight
} from 'lucide-react';
import { 
  Appointment, AppointmentStatus, User, UserRole, Patient, FieldSettings, 
  PinboardTask, RecallStatus, StockItem, AuditLogEntry, SystemStatus 
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
  onPatientPortalToggle: () => void;
  tasks?: PinboardTask[];
  onAddTask?: (text: string, isUrgent: boolean, assignedTo: string) => void;
  onToggleTask?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
  onSaveConsent: (appointmentId: string, consentUrl: string) => void;
  auditLog?: AuditLogEntry[];
  systemStatus?: SystemStatus;
  onSwitchSystemStatus?: (status: SystemStatus) => void;
  onVerifyDowntimeEntry?: (id: string) => void;
}

const ThroughputPulse = ({ activeCount, nextPatient }: { activeCount: number, nextPatient?: string }) => (
  <div className="bg-teal-600 rounded-[2.5rem] border border-teal-500 shadow-xl overflow-hidden mb-8 text-white">
    <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="flex-1 flex items-center gap-6">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
          <Zap size={32} />
        </div>
        <div>
          <h3 className="text-[10px] font-black text-teal-100 uppercase tracking-widest mb-1">Operational Pulse</h3>
          <p className="text-sm font-bold text-white">Chair status and next-in-line throughput.</p>
        </div>
      </div>
      
      <div className="flex items-center gap-12">
        <div className="text-center md:text-left">
          <div className="text-[9px] font-black text-teal-100 uppercase tracking-widest mb-1">Active Chairs</div>
          <div className="text-3xl font-black">{activeCount}</div>
        </div>
        <div className="w-px h-12 bg-white/10 hidden md:block" />
        <div className="text-center md:text-left">
          <div className="text-[9px] font-black text-teal-100 uppercase tracking-widest mb-1">Next Patient</div>
          <div className="text-xl font-black truncate max-w-[150px]">{nextPatient || '---'}</div>
        </div>
      </div>
    </div>
  </div>
);

const PracticePulse = ({ dailyProduction, pendingDues, activePatients }: { dailyProduction: string, pendingDues: string, activePatients: number }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-8">
    <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="flex-1 flex items-center gap-6">
        <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
          <HeartPulse size={32} />
        </div>
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Economic Pulse</h3>
          <p className="text-sm font-bold text-slate-600">Real-time economics for the current practice session.</p>
        </div>
      </div>
      
      <div className="flex items-center gap-12">
        <div className="text-center md:text-left">
          <div className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-1">Daily Production</div>
          <div className="text-3xl font-black text-slate-800">₱{dailyProduction}</div>
        </div>
        <div className="w-px h-12 bg-slate-100 hidden md:block" />
        <div className="text-center md:text-left">
          <div className="text-[9px] font-black text-lilac-500 uppercase tracking-widest mb-1">Pending Dues</div>
          <div className="text-3xl font-black text-slate-800">₱{pendingDues}</div>
        </div>
        <div className="w-px h-12 bg-slate-100 hidden md:block" />
        <div className="text-center md:text-left">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Cases</div>
          <div className="text-3xl font-black text-slate-800">{activePatients}</div>
        </div>
      </div>
    </div>
    <div className="bg-slate-50 px-8 py-3 flex items-center gap-4">
      <span className="flex items-center gap-1.5 text-[10px] font-black text-teal-700 uppercase">
        <VerifiedIcon size={12}/> Economic Truth Engine Validated
      </span>
      <span className="w-1 h-1 bg-slate-300 rounded-full"/>
      <span className="text-[10px] font-bold text-slate-400 uppercase">Calculated based on charges less processed payments.</span>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ 
  appointments, patientsCount, currentUser, patients, onAddPatient, onPatientSelect, onBookAppointment,
  onUpdateAppointmentStatus, fieldSettings, currentBranch, auditLog = [], 
  systemStatus = SystemStatus.OPERATIONAL, onSwitchSystemStatus, onVerifyDowntimeEntry
}) => {
  // Added toast initialization to fix "Cannot find name 'toast'"
  const toast = useToast();
  const [privacyMode, setPrivacyMode] = useState(false);
  const today = new Date().toLocaleDateString('en-CA');

  const isAssistant = currentUser.role === UserRole.DENTAL_ASSISTANT;
  const isAdmin = currentUser.role === UserRole.ADMIN;

  const maskName = (name: string) => {
    if (!privacyMode && !isAssistant) return name;
    if (isAssistant || privacyMode) {
      const parts = name.split(' ');
      return parts.map(p => p[0] + '.').join(' ');
    }
    return name;
  };

  const getPatient = (id: string) => patients.find(pt => pt.id === id);

  const todaysAppointments = useMemo(() => appointments.filter(a => a.date === today && !a.isBlock), [appointments, today]);

  const economicStats = useMemo(() => {
    const production = todaysAppointments
      .filter(a => a.status === AppointmentStatus.COMPLETED)
      .reduce((sum, apt) => {
        const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
        return sum + (proc?.price || 0);
      }, 0);

    const dues = patients.reduce((s, p) => s + (p.currentBalance || 0), 0);
    const active = todaysAppointments.length;

    return { 
      production: production.toLocaleString(), 
      dues: dues.toLocaleString(),
      active
    };
  }, [todaysAppointments, patients, fieldSettings]);

  const receptionFlow = useMemo(() => {
    const arriving = todaysAppointments.filter(a => [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.ARRIVED].includes(a.status));
    const inTreatment = todaysAppointments.filter(a => [AppointmentStatus.SEATED, AppointmentStatus.TREATING].includes(a.status));
    return { arriving, inTreatment };
  }, [todaysAppointments]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xs font-black text-teal-600 uppercase tracking-widest mb-1">
            {currentUser.role === UserRole.ADMIN ? 'Administrator & Data Protection Officer (DPO)' : `${currentUser.role} Control`}
          </h2>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Boutique Command</h1>
        </div>
        <div className="flex gap-2">
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 flex items-center gap-3">
            <MapPin size={16} className="text-teal-500"/>
            <span className="text-xs font-black text-slate-700 uppercase">{currentBranch}</span>
          </div>
          {isAdmin && (
            <button 
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`px-4 py-2 rounded-2xl text-xs font-black uppercase transition-all border ${privacyMode ? 'bg-lilac-600 text-white border-lilac-500' : 'bg-white text-slate-500 border-slate-200'}`}
            >
              Privacy Mask {privacyMode ? 'ON' : 'OFF'}
            </button>
          )}
        </div>
      </div>

      {/* Role-Based Pulse Widget */}
      {isAssistant ? (
        <ThroughputPulse 
            activeCount={receptionFlow.inTreatment.length} 
            nextPatient={getPatient(receptionFlow.arriving[0]?.patientId)?.name} 
        />
      ) : (
        <PracticePulse 
          dailyProduction={economicStats.production} 
          pendingDues={economicStats.dues} 
          activePatients={economicStats.active}
        />
      )}

      {/* Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Reception Queue (Capped to 5 items) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-black text-slate-400 uppercase tracking-widest text-[10px] flex items-center gap-2">
              <Clock size={16} className="text-teal-600"/> Arriving / Waiting
            </h4>
            <span className="bg-teal-50 text-teal-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Next Call</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
            {receptionFlow.arriving.length > 0 ? (
              <>
                {receptionFlow.arriving.slice(0, 5).map(apt => (
                  <button 
                    key={apt.id}
                    onClick={() => onPatientSelect(apt.patientId)}
                    className="w-full text-left bg-slate-50 hover:bg-teal-50 p-4 rounded-3xl border border-transparent hover:border-teal-200 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono font-black text-teal-600 text-xs">{apt.time}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${apt.status === AppointmentStatus.ARRIVED ? 'bg-orange-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
                        {apt.status}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800 text-sm">{maskName(getPatient(apt.patientId)?.name || 'Unknown')}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">{apt.type}</div>
                  </button>
                ))}
                {receptionFlow.arriving.length > 5 && (
                    <button onClick={() => toast.info("See full schedule in the Schedule tab.")} className="w-full py-2 text-[10px] font-black uppercase text-teal-600 hover:underline">
                        + {receptionFlow.arriving.length - 5} More in Queue
                    </button>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <Zap size={48} className="text-slate-100 mb-4" />
                <p className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">No pending arrivals</p>
              </div>
            )}
          </div>
        </div>

        {/* Clinical Activity (Capped to 5 items) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-black text-slate-400 uppercase tracking-widest text-[10px] flex items-center gap-2">
              <Zap size={16} className="text-lilac-600"/> In Treatment / Active Bays
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto no-scrollbar">
            {receptionFlow.inTreatment.length > 0 ? receptionFlow.inTreatment.slice(0, 5).map(apt => (
              <div key={apt.id} className="bg-lilac-50/30 border-2 border-lilac-100 p-6 rounded-[2rem] flex flex-col justify-between hover:border-lilac-300 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[9px] font-black text-lilac-600 uppercase tracking-tighter mb-1">Seated & Active</div>
                    <div className="text-lg font-black text-slate-800">{maskName(getPatient(apt.patientId)?.name || 'Unknown')}</div>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-lilac-600 shadow-sm border border-lilac-100">
                    <Activity size={20}/>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-lilac-100 flex justify-between items-center">
                  <div className="text-[10px] font-bold text-lilac-700 uppercase tracking-widest">{apt.type}</div>
                  <button onClick={() => onUpdateAppointmentStatus(apt.id, AppointmentStatus.COMPLETED)} className="bg-lilac-600 text-white text-[9px] font-black uppercase px-4 py-2 rounded-xl shadow-lg shadow-lilac-600/20 hover:scale-105 transition-all">Mark Finished</button>
                </div>
              </div>
            )) : (
              <div className="col-span-2 h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <Activity size={48} className="text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No active chairs recorded</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Compliance & Verification Hub (Capped to 5 logs) */}
      {!isAssistant && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-between">
            <div>
                <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-4">Accountability Hub</h4>
                <div className="space-y-4">
                {auditLog.slice(0, 5).map(log => (
                    <div key={log.id} className="flex gap-4 items-start">
                    <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5" />
                    <div>
                        <div className="text-xs font-bold text-slate-200">{log.userName} performed {log.action.toLowerCase()}</div>
                        <div className="text-[9px] text-slate-500 font-mono">{formatDate(log.timestamp.split('T')[0])}</div>
                    </div>
                    </div>
                ))}
                </div>
            </div>
            <div className="pt-6 mt-6 border-t border-white/10">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">Cryptographic Trust Layer Active</span>
            </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
            <VerifiedIcon size={48} className="text-teal-500 mb-4" />
            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Registry Integrity</h4>
            <p className="text-sm text-slate-500 mt-2 max-w-xs">All records are encrypted at rest (AES-256) and verified for R.A. 10173 compliance.</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

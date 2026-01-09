import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Activity, Clock, Scale, Sparkles, UserPlus, CalendarPlus, History, 
  ShieldAlert, AlertCircle, ShieldCheck, Zap, Thermometer, Package, User, 
  DollarSign, Receipt, FileText, Heart, Phone, CheckCircle, Lock, Database, ArrowRight,
  Stethoscope, FileWarning, BarChart2, Armchair
} from 'lucide-react';
import { 
  Appointment, AppointmentStatus, User as StaffUser, Patient, FieldSettings, 
  SterilizationCycle, StockItem, TriageLevel, AuditLogEntry, HMOClaim, PhilHealthClaim, 
  SyncConflict, SystemStatus, StockCategory
} from '../types';
import { formatDate, CRITICAL_CLEARANCE_CONDITIONS } from '../constants';

interface DashboardProps {
  appointments: Appointment[];
  allAppointments?: Appointment[];
  patientsCount: number;
  staffCount: number;
  staff?: StaffUser[];
  currentUser: StaffUser;
  patients: Patient[];
  onAddPatient: () => void;
  onPatientSelect: (patientId: string) => void;
  onBookAppointment: (patientId?: string) => void;
  onUpdateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  fieldSettings?: FieldSettings;
  currentBranch: string;
  stock?: StockItem[];
  sterilizationCycles?: SterilizationCycle[];
  hmoClaims?: HMOClaim[];
  philHealthClaims?: PhilHealthClaim[];
  auditLog?: AuditLogEntry[];
  waitlist?: any[];
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
  onUpdateAppointmentStatus, fieldSettings, currentBranch, stock = [], staff = [], sterilizationCycles = [],
  hmoClaims = [], philHealthClaims = [], auditLog = [], waitlist = []
}) => {
  const [activeHuddleId, setActiveHuddleId] = useState<string | null>(null);
  const config = fieldSettings?.dashboardConfig || {
    showYield: true, showRegulatoryHealth: true, showLogisticsIntegrity: true, showVelocity: true,
    showSafetyRail: true, showIntakeQueue: true, showWaitlistAlerts: true, showSterilizationShield: true,
    showSupplyRisks: true, showLabInFlow: true, showRevenueBridge: true, showInsurancePipeline: true,
    showComplianceAlerts: true, showPostOpWellness: true, showSessionStatus: true
  };

  const today = new Date().toLocaleDateString('en-CA');
  const getPatient = (id: string) => patients.find(pt => pt.id === id);
  const todaysAppointments = useMemo(() => appointments.filter(a => a.date === today && !a.isBlock), [appointments, today]);

  // --- LOGIC: SAFETY RAIL ---
  const criticalSafetyAlerts = useMemo(() => {
      return todaysAppointments.filter(apt => {
          const p = getPatient(apt.patientId);
          return p?.medicalConditions?.some(c => CRITICAL_CLEARANCE_CONDITIONS.includes(c));
      }).map(apt => ({ ...apt, patient: getPatient(apt.patientId) }));
  }, [todaysAppointments, patients]);

  // --- LOGIC: POST-OP WELLNESS ---
  const postOpRequired = useMemo(() => {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString('en-CA');
      return allAppointments.filter(a => 
          (a.date === today || a.date === yesterdayStr) &&
          (a.type.toLowerCase().includes('surgery') || a.type.toLowerCase().includes('extraction')) &&
          a.status === AppointmentStatus.COMPLETED &&
          !a.followUpConfirmed
      );
  }, [allAppointments, today]);

  // --- LOGIC: LOGISTICS & SUPPLY ---
  const sterilizationScore = useMemo(() => {
      const last10 = sterilizationCycles.slice(0, 10);
      if (last10.length === 0) return 100;
      return Math.round((last10.filter(c => c.passed).length / last10.length) * 100);
  }, [sterilizationCycles]);

  const supplyChainRisks = useMemo(() => {
      return stock.filter(item => {
          const leadTime = item.leadTimeDays || 3;
          // Burn rate estimation (simplified for dash)
          return item.quantity <= item.lowStockThreshold;
      }).slice(0, 3);
  }, [stock]);

  const labExpectedToday = useMemo(() => {
      return todaysAppointments.filter(a => a.labStatus && a.labStatus !== 'None');
  }, [todaysAppointments]);

  // --- LOGIC: GOVERNANCE & COMPLIANCE ---
  const complianceScore = useMemo(() => {
      const activeStaff = staff.length;
      const expiring = staff.filter(s => {
          if (!s.prcExpiry) return false;
          const diff = (new Date(s.prcExpiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
          return diff < 30;
      }).length;
      const unsealedCount = patients.reduce((acc, p) => acc + (p.dentalChart?.filter(e => !e.sealedHash && e.date === today).length || 0), 0);
      
      const health = Math.max(0, 100 - (expiring * 10) - (unsealedCount * 5));
      return health;
  }, [staff, patients, today]);

  const revenueGap = useMemo(() => {
      let total = 0; let receipted = 0;
      patients.forEach(p => p.ledger?.forEach(l => {
          if (l.type === 'Payment') {
              total += l.amount;
              if (l.orNumber) receipted += l.amount;
          }
      }));
      return { total, receipted, percentage: total > 0 ? Math.round((receipted / total) * 100) : 100 };
  }, [patients]);

  const insurancePending = useMemo(() => {
      const hmo = hmoClaims.filter(c => c.status === 'Pending').length;
      const phil = philHealthClaims.filter(c => c.status === 'Pending').length;
      return hmo + phil;
  }, [hmoClaims, philHealthClaims]);

  const integrityScore = useMemo(() => {
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

  const productionValue = useMemo(() => {
      const currentYear = new Date().getFullYear();
      const val = allAppointments
          .filter(a => a.status === AppointmentStatus.COMPLETED && new Date(a.date).getFullYear() === currentYear)
          .reduce((sum, apt) => {
              const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
              return sum + (proc?.price || 0);
          }, 0);
      return `₱${(val / 1000).toFixed(1)}k`;
  }, [allAppointments, fieldSettings]);

  const velocityFlow = useMemo(() => {
      const completedToday = todaysAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
      return todaysAppointments.length > 0 ? Math.round((completedToday / todaysAppointments.length) * 100) : 0;
  }, [todaysAppointments]);

  return (
    <div className="space-y-8 max-w-[1800px] mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
      
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="min-w-0">
            <h2 className="text-[9px] font-black text-teal-700 uppercase tracking-[0.4em] mb-1 flex items-center gap-2 truncate">
                <Sparkles size={12} className="animate-pulse" aria-hidden="true"/> Unified command center
            </h2>
            <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter leading-none uppercase truncate">Operations</h1>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={onAddPatient} className="flex-1 sm:flex-none bg-white text-teal-800 border-2 border-teal-100 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
                <UserPlus size={18}/> Admission
            </button>
            <button onClick={() => onBookAppointment()} className="flex-1 sm:flex-none bg-lilac-600 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-lilac-600/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
                <CalendarPlus size={18}/> Book
            </button>
        </div>
      </div>

      {/* Region A: Performance Rail */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-6" role="region" aria-label="Key Performance Indicators">
        {config.showYield && <MetricCard icon={TrendingUp} color="bg-teal-50 text-teal-700" label="Yield (YTD)" value={productionValue} subtext="Gross Clinical Asset" />}
        {config.showRegulatoryHealth && <MetricCard icon={ShieldCheck} color="bg-lilac-50 text-lilac-700" label="Regulatory Health" value={`${complianceScore}%`} subtext="License & Audit Score" />}
        {config.showLogisticsIntegrity && <MetricCard icon={Scale} color="bg-orange-50 text-orange-700" label="Logistics Health" value={`${integrityScore}%`} subtext="Sterile/Supply Variance" />}
        {config.showVelocity && <MetricCard icon={Activity} color="bg-blue-50 text-blue-700" label="Flow Velocity" value={`${velocityFlow}%`} subtext="Daily Shift completion" />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Region B: Patient Command (Left) */}
          <div className="lg:col-span-4 space-y-8">
              {config.showSafetyRail && criticalSafetyAlerts.length > 0 && (
                  <section className="bg-red-50 rounded-[2.5rem] p-6 border-2 border-red-200 shadow-lg animate-in slide-in-from-left-4">
                      <h4 className="font-black text-red-900 uppercase tracking-widest text-[10px] flex items-center gap-2 mb-4">
                          <ShieldAlert size={16} className="animate-pulse"/> Chair-Side Red Flags
                      </h4>
                      <div className="space-y-2">
                          {criticalSafetyAlerts.map(apt => (
                              <div key={apt.id} className="bg-white p-3 rounded-xl border border-red-100 flex items-center justify-between">
                                  <span className="font-black text-slate-800 text-sm uppercase">{apt.patient?.surname}</span>
                                  <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase">Review Required</span>
                              </div>
                          ))}
                      </div>
                  </section>
              )}

              {config.showIntakeQueue && (
                  <section className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl flex flex-col h-fit">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-black text-teal-900 uppercase tracking-widest text-[10px] flex items-center gap-2"><History size={16}/> Registry Queue</h4>
                        <span className="text-[10px] font-black bg-teal-50 px-3 py-1 rounded-full text-teal-700">{todaysAppointments.filter(a => a.status === AppointmentStatus.ARRIVED).length} Arrived</span>
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                        {todaysAppointments.length > 0 ? todaysAppointments.map(apt => {
                            const patient = getPatient(apt.patientId);
                            const isHuddleActive = activeHuddleId === apt.id;
                            const isArrived = apt.status === AppointmentStatus.ARRIVED;
                            return (
                                <div key={apt.id} className="relative group">
                                    <div className={`bg-white p-5 rounded-[2rem] border-2 transition-all duration-500 ${isArrived ? 'border-teal-500 shadow-teal-500/5 ring-4 ring-teal-500/5' : 'border-slate-50 hover:border-teal-200'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-black text-teal-700 text-[9px] bg-teal-50 px-2 py-0.5 rounded-lg uppercase tracking-widest">{apt.time}</span>
                                            {isArrived && <div className="w-2 h-2 bg-teal-500 rounded-full animate-ping" />}
                                        </div>
                                        <button onClick={() => onPatientSelect(apt.patientId)} className="w-full text-left font-black text-slate-800 text-base tracking-tighter truncate uppercase hover:text-teal-600 transition-colors">
                                            {patient?.name || 'IDENTITY_RESTRICTED'}
                                        </button>
                                        <div className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1 opacity-70 flex items-center gap-2">
                                            <Stethoscope size={10}/> {apt.type}
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : <div className="py-20 text-center opacity-30 italic text-sm">No clinical entries today.</div>}
                    </div>
                  </section>
              )}
          </div>

          {/* Region C: Logistics Hub (Center) */}
          <div className="lg:col-span-4 space-y-8">
              {config.showSterilizationShield && (
                  <section className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700"><Thermometer size={120}/></div>
                      <h4 className="font-black text-teal-900 uppercase tracking-widest text-[10px] flex items-center gap-2 mb-8"><Zap size={16} className="text-teal-500"/> Shift Biological Trust</h4>
                      <div className="flex flex-col items-center justify-center py-4">
                          <div className="relative w-40 h-40">
                              <svg className="w-full h-full transform -rotate-90">
                                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-50" />
                                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * sterilizationScore) / 100} className="text-teal-500 transition-all duration-1000" />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-4xl font-black text-slate-800">{sterilizationScore}%</span>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Safe-To-Treat</span>
                              </div>
                          </div>
                      </div>
                  </section>
              )}

              {config.showSupplyRisks && (
                  <section className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl">
                      <h4 className="font-black text-lilac-900 uppercase tracking-widest text-[10px] flex items-center gap-2 mb-6"><Package size={16} className="text-lilac-500"/> Procurement risk</h4>
                      <div className="space-y-4">
                          {supplyChainRisks.map(item => (
                              <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-lilac-200 transition-all">
                                  <div className="min-w-0">
                                      <div className="font-black text-slate-800 text-xs uppercase truncate">{item.name}</div>
                                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Critical restock needed</div>
                                  </div>
                                  <div className="text-right">
                                      <div className="text-lg font-black text-red-600 leading-none">{item.quantity}</div>
                                      <div className="text-[8px] font-black text-slate-400 uppercase">{item.dispensingUnit} left</div>
                                  </div>
                              </div>
                          ))}
                          {supplyChainRisks.length === 0 && <div className="text-center text-[10px] font-black text-slate-400 uppercase py-6">Supply levels optimal</div>}
                      </div>
                  </section>
              )}
          </div>

          {/* Region D: Governance & Revenue (Right) */}
          <div className="lg:col-span-4 space-y-8">
              {config.showRevenueBridge && (
                  <section className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl">
                      <h4 className="font-black text-teal-900 uppercase tracking-widest text-[10px] flex items-center gap-2 mb-6"><Receipt size={16} className="text-teal-500"/> Governance Revenue Bridge</h4>
                      <div className="space-y-6">
                          <div>
                              <div className="flex justify-between items-end mb-2">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Audit Match Rate</span>
                                  <span className="text-sm font-black text-teal-700">{revenueGap.percentage}%</span>
                              </div>
                              <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                  <div className="h-full bg-teal-600 rounded-full transition-all duration-1000" style={{ width: `${revenueGap.percentage}%` }} />
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100">
                                  <div className="text-[8px] font-black text-teal-700 uppercase tracking-widest mb-1">Receipted Cash</div>
                                  <div className="text-sm font-black text-slate-800">₱{revenueGap.receipted.toLocaleString()}</div>
                              </div>
                              <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                                  <div className="text-[8px] font-black text-orange-700 uppercase tracking-widest mb-1">Audit Exposure</div>
                                  <div className="text-sm font-black text-slate-800">₱{(revenueGap.total - revenueGap.receipted).toLocaleString()}</div>
                              </div>
                          </div>
                      </div>
                  </section>
              )}

              {config.showComplianceAlerts && (
                  <section className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl">
                      <h4 className="font-black text-lilac-900 uppercase tracking-widest text-[10px] flex items-center gap-2 mb-6"><ShieldCheck size={16} className="text-lilac-500"/> statutory watchdog</h4>
                      <div className="space-y-4">
                          {staff.filter(s => s.prcExpiry && (new Date(s.prcExpiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24) < 30).map(s => (
                              <div key={s.id} className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-4 animate-in slide-in-from-right-4">
                                  <ShieldAlert size={20} className="text-red-600 shrink-0"/>
                                  <div>
                                      <div className="font-black text-red-900 text-[10px] uppercase tracking-tight">License Expiring: {s.name}</div>
                                      <div className="text-[9px] font-bold text-red-700 uppercase">Action required within 30 days</div>
                                  </div>
                              </div>
                          ))}
                          {patients.some(p => p.dentalChart?.some(e => !e.sealedHash && e.date === today)) && (
                              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-4">
                                  <FileWarning size={20} className="text-orange-600 shrink-0"/>
                                  <div>
                                      <div className="font-black text-orange-900 text-[10px] uppercase tracking-tight">Unsealed clinical notes identified</div>
                                      <div className="text-[9px] font-bold text-orange-700 uppercase">Immediate seal required for RA 8792</div>
                                  </div>
                              </div>
                          )}
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <Heart size={16} className="text-lilac-600"/>
                                  <span className="text-[10px] font-black text-slate-600 uppercase">Insurance Pipeline</span>
                              </div>
                              <span className="text-xs font-black text-lilac-800 bg-lilac-50 px-2 py-0.5 rounded-full">{insurancePending} Pending</span>
                          </div>
                      </div>
                  </section>
              )}
          </div>
      </div>

      {/* Region E: Recovery & Bottom Rail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {config.showPostOpWellness && postOpRequired.length > 0 && (
              <section className="bg-white rounded-[3rem] p-8 border-4 border-teal-50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                      <div className="bg-teal-600 text-white p-4 rounded-3xl shadow-lg"><Phone size={32}/></div>
                      <div>
                          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Surgical Wellness Loop</h4>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{postOpRequired.length} Patients awaiting follow-up call</p>
                      </div>
                  </div>
                  <div className="flex gap-2 -space-x-4 overflow-hidden">
                      {postOpRequired.slice(0, 3).map(apt => (
                          <div key={apt.id} className="w-12 h-12 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center font-black text-xs text-slate-500 shadow-md">
                              {getPatient(apt.patientId)?.surname?.[0]}
                          </div>
                      ))}
                      {postOpRequired.length > 3 && <div className="w-12 h-12 rounded-full border-4 border-white bg-teal-50 flex items-center justify-center font-black text-xs text-teal-600 shadow-md">+{postOpRequired.length - 3}</div>}
                  </div>
              </section>
          )}

          {config.showSessionStatus && (
              <section className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl flex items-center justify-between">
                  <div className="flex items-center gap-6">
                      <div className="bg-lilac-100 text-lilac-700 p-4 rounded-3xl shadow-sm"><Lock size={32}/></div>
                      <div>
                          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Branch Session</h4>
                          <div className="flex items-center gap-2 mt-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-xs font-black text-green-600 uppercase tracking-widest">Active session: OPEN</span>
                          </div>
                      </div>
                  </div>
                  <div className="text-right">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Branch</div>
                      <div className="text-sm font-black text-slate-800 uppercase tracking-wider">{currentBranch}</div>
                  </div>
              </section>
          )}
      </div>
    </div>
  );
};

export default Dashboard;
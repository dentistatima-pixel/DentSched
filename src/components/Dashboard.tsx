import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Calendar, UserPlus, CalendarPlus, Activity, DollarSign, Heart, FileBadge2, 
  ShieldAlert, CheckSquare, LogIn, Play, Check, UserCheck, UserX, CheckCircle, 
  Flag, Beaker, Clock, Zap, AlertCircle, Users, ChevronRight, AlertTriangle
} from 'lucide-react';
import { 
  Appointment, AppointmentStatus, Patient, 
  FieldSettings,
  RegistrationStatus,
  RecallStatus,
  LabStatus,
  UserRole
} from '../types';
import { formatDate } from '../constants';
import { useModal } from '../contexts/ModalContext';
import { useAppointments } from '../contexts/AppointmentContext';
import { useAppContext } from '../contexts/AppContext';
import { usePatient } from '../contexts/PatientContext';
import { useSettings } from '../contexts/SettingsContext';
import { useClinicalOps } from '../contexts/ClinicalOpsContext';
import { useInventory } from '../contexts/InventoryContext';
import { useNavigate } from '../contexts/RouterContext';
import { TrayPrepList } from './TrayPrepList';

const AnimatedCounter: React.FC<{ value: number; isCurrency?: boolean }> = React.memo(({ value, isCurrency }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const valueRef = useRef(0);

  const formatValue = useCallback((val: number) => {
    if (isCurrency) {
      return `₱${Math.round(val).toLocaleString()}`;
    }
    return Math.round(val).toLocaleString();
  }, [isCurrency]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const startValue = valueRef.current;
    const endValue = value;
    valueRef.current = value;

    if (startValue === endValue) {
      node.textContent = formatValue(endValue);
      return;
    }

    const duration = 800;
    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = startValue + (endValue - startValue) * easedProgress;
      node.textContent = formatValue(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        node.textContent = formatValue(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [value, formatValue]);

  return <span ref={ref}>{formatValue(0)}</span>;
});

const PIPELINE_STAGES: AppointmentStatus[] = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.ARRIVED,
  AppointmentStatus.IN_TREATMENT,
];

const StatusPipeline: React.FC<{ currentStatus: AppointmentStatus }> = ({ currentStatus }) => {
  const currentIdx = PIPELINE_STAGES.indexOf(currentStatus);
  return (
    <div className="flex items-center w-full max-w-[180px] my-1.5 gap-1">
      {PIPELINE_STAGES.map((stage, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <React.Fragment key={stage}>
            {idx > 0 && (
              <div 
                className={`flex-1 h-0.5 rounded-full transition-colors ${
                  isCompleted || isCurrent ? 'bg-[#1E7A63]' : 'bg-[#E2E4DD]'
                }`} 
              />
            )}
            <div
              className={`w-2 h-2 rounded-full transition-all flex-shrink-0 ${
                isCurrent 
                  ? 'bg-[#1E7A63] ring-2 ring-[#E4F1EC]' 
                  : isCompleted 
                    ? 'bg-[#1E7A63]' 
                    : 'bg-[#E2E4DD]'
              }`}
              title={stage}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
};

const AppointmentAlerts: React.FC<{ patient: Patient; settings?: FieldSettings }> = ({ patient, settings }) => {
  const alerts = useMemo(() => {
    const medicalAlerts = [
      ...(patient.allergies?.filter(a => a !== 'None') || []),
      ...(patient.medicalConditions?.filter(c => c !== 'None') || [])
    ];
    const hasBalance = (patient.currentBalance || 0) > 0;
    const isProvisional = patient.registrationStatus === RegistrationStatus.PROVISIONAL;
    const needsClearance = patient.medicalConditions?.some(c => (settings?.criticalRiskRegistry || []).includes(c)) && !patient.clearanceRequests?.some(r => r.status === 'Approved');

    const alertComponents = [];
    if (medicalAlerts.length > 0) {
      alertComponents.push(
        <span key="med" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F8E9E7] text-[#B14A42] text-[10.5px] font-semibold">
          <Heart size={10} /> Allergy: {medicalAlerts[0]}
        </span>
      );
    }
    if (hasBalance) {
      alertComponents.push(
        <span key="fin" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FBEEDF] text-[#B9762E] text-[10.5px] font-semibold">
          <DollarSign size={10} /> Bal: ₱{patient.currentBalance?.toLocaleString()}
        </span>
      );
    }
    if (isProvisional) {
      alertComponents.push(
        <span key="prov" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#E8EFF7] text-[#3E6FA8] text-[10.5px] font-semibold">
          <FileBadge2 size={10} /> Intake Incomplete
        </span>
      );
    }
    if (needsClearance) {
      alertComponents.push(
        <span key="clear" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#EDEAF7] text-[#7A6BB0] text-[10.5px] font-semibold">
          <ShieldAlert size={10} /> Clearance Req.
        </span>
      );
    }
    return alertComponents;
  }, [patient, settings]);

  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 pt-2 mt-2 border-t border-[#EBEDE7]">
      {alerts}
    </div>
  );
};

const TodaysTimeline: React.FC<{ 
  appointments: Appointment[], 
  patients: Patient[], 
  settings?: FieldSettings,
  onUpdateStatus: (id: string, status: AppointmentStatus, patient: Patient) => void,
  onEditAppointment: (appointment: Appointment) => void,
  disappearingApts: string[],
}> = ({ appointments, patients, settings, onUpdateStatus, onEditAppointment, disappearingApts }) => {
  const navigate = useNavigate();

  const NextActionButton: React.FC<{apt: Appointment, patient: Patient}> = ({ apt, patient }) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const actions: Partial<Record<AppointmentStatus, { label: string, icon: React.ElementType, nextStatus: AppointmentStatus, color: string }>> = {
      [AppointmentStatus.SCHEDULED]: { label: 'Confirm', icon: CheckSquare, nextStatus: AppointmentStatus.CONFIRMED, color: 'bg-[#3E6FA8] hover:bg-[#2F5888] text-white' },
      [AppointmentStatus.CONFIRMED]: { label: 'Check-In', icon: LogIn, nextStatus: AppointmentStatus.ARRIVED, color: 'bg-[#B9762E] hover:bg-[#975F22] text-white' },
      [AppointmentStatus.ARRIVED]: { label: 'Seat Patient', icon: Play, nextStatus: AppointmentStatus.IN_TREATMENT, color: 'bg-[#7A6BB0] hover:bg-[#635593] text-white' },
      [AppointmentStatus.IN_TREATMENT]: { label: 'Complete', icon: Check, nextStatus: AppointmentStatus.COMPLETED, color: 'bg-[#1E7A63] hover:bg-[#155945] text-white' },
    };
    const action = actions[apt.status];
    if (!action) return null;

    const Icon = action.icon;
    return (
      <>
        <button 
          onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }} 
          className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors active:scale-95 ${action.color}`}
        >
          <Icon size={13} /> 
          <span>{action.label}</span>
        </button>
        {showConfirm && (
          <div className="fixed inset-0 bg-[#0D231E]/60 backdrop-blur-xs z-[150] flex justify-center items-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl flex flex-col items-center p-5 text-center border border-[#E2E4DD]">
              <div className="w-10 h-10 bg-[#F4F5F1] text-[#1E7A63] rounded-full flex items-center justify-center mb-3 border border-[#E2E4DD]">
                <Icon size={20} />
              </div>
              <h3 className="font-serif font-bold text-base text-[#1D2620] mb-1">Update Status</h3>
              <p className="text-xs text-[#697169] mb-4">
                Advance this appointment to <strong className="text-[#1D2620]">{action.label}</strong>?
              </p>
              <div className="flex gap-2 w-full">
                <button 
                  onClick={() => setShowConfirm(false)} 
                  className="flex-1 py-1.5 bg-[#F4F5F1] hover:bg-[#EBEDE7] text-[#1D2620] rounded-lg text-xs font-semibold border border-[#E2E4DD]"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => { setShowConfirm(false); onUpdateStatus(apt.id, action.nextStatus, patient); }} 
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${action.color}`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E4DD] shadow-xs overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E2E4DD] flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-[#1E7A63]" />
          <h2 className="font-serif font-semibold text-sm sm:text-base text-[#1D2620]">
            Today's Clinical Schedule
          </h2>
        </div>
        <span className="text-[11px] font-medium text-[#697169] bg-[#F4F5F1] px-2 py-0.5 rounded border border-[#E2E4DD]">
          {appointments.length} active
        </span>
      </div>

      <div className="p-3 sm:p-4 space-y-2.5 max-h-[640px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#E2E4DD]">
        {appointments.length > 0 ? appointments.map(apt => {
          const isDisappearing = disappearingApts.includes(apt.id);
          const patient = apt.isBlock ? null : patients.find(p => p.id === apt.patientId);

          if (apt.isBlock) {
            return (
              <div key={apt.id} className="p-3 rounded-lg flex items-center gap-3 bg-[#FAFBF8] border border-[#E2E4DD]">
                <div className="w-14 sm:w-16 shrink-0 text-left">
                  <div className="font-mono font-medium text-xs text-[#1D2620]">{apt.time}</div>
                  <div className="text-[11px] text-[#697169]">{apt.durationMinutes}m</div>
                </div>
                <div className="flex-1 min-w-0 border-l-2 border-[#9CA39B] pl-3">
                  <span className="font-semibold text-xs text-[#1D2620] truncate block">{apt.title}</span>
                  <span className="text-[11px] text-[#697169]">Blocked Time ({apt.type})</span>
                </div>
              </div>
            );
          }

          if (!patient) return null;

          const statusAccent = {
            [AppointmentStatus.SCHEDULED]: 'border-l-[#3E6FA8]',
            [AppointmentStatus.CONFIRMED]: 'border-l-[#1E7A63]',
            [AppointmentStatus.ARRIVED]: 'border-l-[#B9762E]',
            [AppointmentStatus.IN_TREATMENT]: 'border-l-[#7A6BB0]',
            [AppointmentStatus.COMPLETED]: 'border-l-[#1E7A63]',
            [AppointmentStatus.NO_SHOW]: 'border-l-[#B14A42]',
            [AppointmentStatus.CANCELLED]: 'border-l-[#B14A42]',
          }[apt.status] || 'border-l-[#1E7A63]';

          return (
            <div 
              key={apt.id} 
              onClick={() => onEditAppointment(apt)}
              className={`p-3 rounded-lg transition-colors cursor-pointer bg-white hover:bg-[#FAFBF8] border border-[#E2E4DD] border-l-4 ${statusAccent} shadow-xs ${
                isDisappearing ? 'opacity-40 pointer-events-none' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                
                {/* Left: Time & Patient info */}
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="w-14 sm:w-16 shrink-0 text-left">
                    <div className="font-mono font-semibold text-xs text-[#1D2620] leading-tight">{apt.time}</div>
                    <div className="text-[10.5px] text-[#697169] mt-0.5">{apt.durationMinutes} min</div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate(`patients/${apt.patientId}`); }}
                        className="font-serif font-bold text-xs sm:text-sm text-[#1D2620] hover:text-[#1E7A63] transition-colors truncate text-left"
                      >
                        {patient.name}
                      </button>
                      <span className="text-[10.5px] uppercase font-bold tracking-wider text-[#697169] bg-[#F4F5F1] px-1.5 py-0.2 rounded border border-[#E2E4DD]">
                        {apt.type}
                      </span>
                    </div>

                    <StatusPipeline currentStatus={apt.status} />
                    <AppointmentAlerts patient={patient} settings={settings} />
                  </div>
                </div>

                {/* Right: Action Button */}
                <div className="shrink-0 pt-1 sm:pt-0 sm:pl-3 sm:border-l sm:border-[#EBEDE7]" onClick={e => e.stopPropagation()}>
                  <NextActionButton apt={apt} patient={patient} />
                </div>

              </div>
            </div>
          );
        }) : (
          <div className="py-12 text-center text-xs text-[#697169]">
            <Calendar size={24} className="mx-auto text-[#9CA39B] mb-2" />
            No active appointments scheduled for today.
          </div>
        )}
      </div>
    </div>
  );
};

const ActionWidgets: React.FC<{ 
  dailyKPIs: any, 
  myTasks: any[], 
  onToggleTask: any, 
  appointments: Appointment[], 
  patients: Patient[], 
  userRole: UserRole 
}> = ({ dailyKPIs, myTasks, onToggleTask, appointments, patients, userRole }) => {
  const { showModal } = useModal();
  const { stock } = useInventory();
  const todayStr = new Date().toLocaleDateString('en-CA');
  const completedToday = appointments.filter(a => a.date === todayStr && a.status === AppointmentStatus.COMPLETED);
  const noShowsToday = appointments.filter(a => a.date === todayStr && a.status === AppointmentStatus.NO_SHOW);

  const showCompletedList = () => {
    const patientList = completedToday.map(apt => {
      const p = patients.find(pt => pt.id === apt.patientId);
      return `- ${apt.time}: ${p?.name} (${apt.type})`;
    }).join('\n');
    showModal('infoDisplay', { title: "Today's Completed Appointments", content: patientList || 'No completed appointments yet.' });
  };

  const showNoShowList = () => {
    const patientList = noShowsToday.map(apt => {
      const p = patients.find(pt => pt.id === apt.patientId);
      return `- ${apt.time}: ${p?.name} (${apt.type})`;
    }).join('\n');
    showModal('infoDisplay', { title: "Today's No-Shows", content: patientList || 'No recorded no-shows for today.' });
  };

  const renderAssistantWidgets = () => {
    const activeApts = appointments.filter(a => a.date === todayStr && [AppointmentStatus.ARRIVED, AppointmentStatus.IN_TREATMENT].includes(a.status));
    const lowStock = stock.filter(s => s.quantity <= (s.lowStockThreshold || 0));

    return (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-[#E2E4DD] p-3.5 shadow-xs">
          <h4 className="text-[10.5px] font-bold text-[#697169] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Users size={13} className="text-[#1E7A63]" />
            Active Clinic Flow
          </h4>
          <div className="space-y-1.5">
            {activeApts.map(apt => {
              const p = patients.find(pt => pt.id === apt.patientId);
              const isArrived = apt.status === AppointmentStatus.ARRIVED;
              return (
                <div key={apt.id} className="flex items-center justify-between p-2 bg-[#FAFBF8] rounded-lg border border-[#E2E4DD]">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#1D2620] truncate">{p?.name}</p>
                    <p className="text-[11px] text-[#697169] truncate">{apt.type}</p>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    isArrived ? 'bg-[#FBEEDF] text-[#B9762E]' : 'bg-[#EDEAF7] text-[#7A6BB0]'
                  }`}>
                    {isArrived ? 'Waiting' : 'In Chair'}
                  </span>
                </div>
              );
            })}
            {activeApts.length === 0 && <p className="text-xs text-[#697169] italic py-2 text-center">No patients currently in chair.</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E4DD] p-3.5 shadow-xs">
          <h4 className="text-[10.5px] font-bold text-[#697169] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <AlertCircle size={13} className="text-[#B9762E]" />
            Low Stock Alerts
          </h4>
          <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-[#E2E4DD]">
            {lowStock.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-[#FBEEDF]/50 rounded-lg border border-[#FBEEDF]">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#1D2620] truncate">{item.name}</p>
                  <p className="text-[10.5px] text-[#697169] uppercase">{item.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-[#B9762E]">{item.quantity} {item.dispensingUnit}</p>
                  <p className="text-[10px] text-[#697169]">Min {item.lowStockThreshold}</p>
                </div>
              </div>
            ))}
            {lowStock.length === 0 && <p className="text-xs text-[#697169] italic py-2 text-center">Supplies are sufficient.</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {userRole === UserRole.DENTAL_ASSISTANT ? renderAssistantWidgets() : (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl border border-[#E2E4DD] p-3 shadow-xs">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#697169]">Production</div>
            <div className="font-serif font-bold text-base sm:text-lg text-[#1D2620] mt-1">
              <AnimatedCounter value={dailyKPIs.production} isCurrency={true} />
            </div>
          </div>
          <button 
            onClick={showCompletedList}
            className="bg-white hover:bg-[#FAFBF8] rounded-xl border border-[#E2E4DD] p-3 shadow-xs text-left transition-colors"
          >
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#697169]">Seen</div>
            <div className="font-serif font-bold text-base sm:text-lg text-[#1E7A63] mt-1">
              <AnimatedCounter value={dailyKPIs.patientsSeen} />
            </div>
          </button>
          <button 
            onClick={showNoShowList}
            className="bg-white hover:bg-[#FAFBF8] rounded-xl border border-[#E2E4DD] p-3 shadow-xs text-left transition-colors"
          >
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#697169]">No-Shows</div>
            <div className="font-serif font-bold text-base sm:text-lg text-[#B14A42] mt-1">
              <AnimatedCounter value={dailyKPIs.noShows} />
            </div>
          </button>
        </div>
      )}

      {/* Task List */}
      <div className="bg-white rounded-xl border border-[#E2E4DD] p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[10.5px] font-bold text-[#697169] uppercase tracking-wider">
            Pending Tasks ({myTasks.length})
          </h4>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-[#E2E4DD]">
          {myTasks.map(task => (
            <div key={task.id} className="flex items-start gap-2.5 p-2 hover:bg-[#FAFBF8] rounded-lg border border-transparent hover:border-[#E2E4DD] transition-colors">
              <button 
                onClick={() => onToggleTask && onToggleTask(task.id)} 
                className="mt-0.5 text-[#9CA39B] hover:text-[#1E7A63] transition-colors flex-shrink-0"
                aria-label="Complete task"
              >
                <CheckCircle size={15} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-[#1D2620] leading-snug">{task.text}</div>
                {task.isUrgent && (
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] bg-[#F8E9E7] text-[#B14A42] px-1.5 py-0.2 rounded font-semibold uppercase">
                    <Flag size={9} /> Urgent
                  </span>
                )}
              </div>
            </div>
          ))}
          {myTasks.length === 0 && <p className="text-xs text-[#697169] italic py-3 text-center">No pending tasks.</p>}
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { showModal } = useModal();
  const { appointments, handleUpdateAppointmentStatus, handleSaveAppointment } = useAppointments();
  const { currentUser, currentBranch } = useAppContext();
  const { patients, handleSavePatient } = usePatient();
  const { fieldSettings } = useSettings();
  const { tasks, handleToggleTask, handleAddToWaitlist, incidents } = useClinicalOps();
  
  const [disappearingApts, setDisappearingApts] = useState<string[]>([]);

  const handleStatusUpdate = (appointmentId: string, newStatus: AppointmentStatus, patient: Patient) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    if (newStatus === AppointmentStatus.COMPLETED) {
      showModal('postOpHandover', {
        appointment,
        patient,
        onConfirm: () => {
          showModal('clinicalCheckout', {
            appointment,
            patient,
            onSavePatient: handleSavePatient,
            onUpdateAppointmentStatus: (aptId: string, status: AppointmentStatus, additionalData: any, bypass: boolean) => {
              handleUpdateAppointmentStatus(aptId, status, additionalData, bypass);
              setDisappearingApts(prev => [...prev, aptId]);
              setTimeout(() => {
                setDisappearingApts(prev => prev.filter(id => id !== aptId));
              }, 1000);
            }
          });
        }
      });
    } else {
      handleUpdateAppointmentStatus(appointmentId, newStatus);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    showModal('appointment', { 
      onSave: handleSaveAppointment, 
      onAddToWaitlist: handleAddToWaitlist,
      currentBranch,
      existingAppointment: appointment,
    });
  };

  const todaysAppointments = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const nonTerminalStatuses = [
      AppointmentStatus.SCHEDULED,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.ARRIVED,
      AppointmentStatus.IN_TREATMENT
    ];
    return appointments
      .filter(a => a.date === todayStr && a.branch === currentBranch && (nonTerminalStatuses.includes(a.status) || disappearingApts.includes(a.id)))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, currentBranch, disappearingApts]);

  const allTodaysAppointments = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    return appointments.filter(a => a.date === todayStr && a.branch === currentBranch);
  }, [appointments, currentBranch]);

  const dailyKPIs = useMemo(() => {
    const completedToday = allTodaysAppointments.filter(a => a.status === AppointmentStatus.COMPLETED);
    const production = completedToday.reduce((sum, apt) => {
      const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
      return sum + (proc?.defaultPrice || 0);
    }, 0);
    return {
      production: production,
      patientsSeen: completedToday.length,
      noShows: allTodaysAppointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length
    };
  }, [allTodaysAppointments, fieldSettings]);

  const overdueRecalls = useMemo(() => patients.filter(p => p.recallStatus === RecallStatus.OVERDUE), [patients]);
  const pendingLabs = useMemo(() => appointments.filter(a => a.labStatus === LabStatus.PENDING), [appointments]);
  const unresolvedIncidents = useMemo(() => (incidents || []).filter(i => !i.advisoryCallSigned), [incidents]);
  const outstandingBalances = useMemo(() => patients.filter(p => p.currentBalance && p.currentBalance > 0), [patients]);

  const showOverdueRecalls = () => {
    const content = overdueRecalls.length > 0
      ? overdueRecalls.map(p => `- **${p.name}** (Last visit: ${formatDate(p.lastVisit)})`).join('\n')
      : 'No patients are currently overdue for recall.';
    showModal('infoDisplay', { title: `Overdue Recalls (${overdueRecalls.length})`, content });
  };

  const showPendingLabs = () => {
    const content = pendingLabs.length > 0
      ? pendingLabs.map(a => {
          const p = patients.find(pt => pt.id === a.patientId);
          return `- **${p?.name || 'Unknown'}**: *${a.type}* (Appointment: ${formatDate(a.date)})`;
        }).join('\n')
      : 'No lab cases are currently pending.';
    showModal('infoDisplay', { title: `Pending Lab Cases (${pendingLabs.length})`, content });
  };

  const showUnresolvedIncidents = () => {
    const content = unresolvedIncidents.length > 0
      ? unresolvedIncidents.map(i => `- **${i.type}** on ${formatDate(i.date)}: *${i.description.substring(0, 50)}...*`).join('\n')
      : 'No unresolved clinical incidents.';
    showModal('infoDisplay', { title: `Unresolved Incidents (${unresolvedIncidents.length})`, content });
  };

  const showOutstandingBalances = () => {
    const content = outstandingBalances.length > 0
      ? outstandingBalances.map(p => `- **${p.name}**: ₱${p.currentBalance?.toLocaleString()}`).join('\n')
      : 'No patients with outstanding balances.';
    showModal('infoDisplay', { title: `Patients with Balances (${outstandingBalances.length})`, content });
  };

  if (!currentUser) return null;

  const myTasks = useMemo(() => tasks.filter(t => t.assignedTo === currentUser.id && !t.isCompleted), [tasks, currentUser.id]);

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2E4DD] shadow-xs">
        <div>
          <h1 className="font-serif font-bold text-lg sm:text-xl text-[#1D2620] leading-tight">
            Schedule & Clinical Overview
          </h1>
          <p className="text-xs text-[#697169] mt-0.5">
            Active session for {currentUser.name} • {currentBranch}
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button 
            onClick={() => showModal('patientRegistration', { currentBranch, onSave: handleSavePatient })} 
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1E7A63] hover:bg-[#155945] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap active:scale-95"
          >
            <UserPlus size={14} /> 
            <span>New Patient</span>
          </button>
          <button 
            onClick={() => showModal('appointment', { onSave: handleSaveAppointment, onAddToWaitlist: handleAddToWaitlist, currentBranch })} 
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F4F5F1] hover:bg-[#EBEDE7] text-[#1D2620] rounded-lg text-xs font-semibold border border-[#E2E4DD] transition-colors whitespace-nowrap active:scale-95"
          >
            <CalendarPlus size={14} /> 
            <span>New Appointment</span>
          </button>
          <button 
            onClick={() => showModal('quickTriage', { currentBranch })} 
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F8E9E7] hover:bg-[#F0D5D2] text-[#B14A42] rounded-lg text-xs font-semibold border border-[#F8E9E7] transition-colors whitespace-nowrap active:scale-95"
          >
            <Zap size={14} /> 
            <span>Walk-In</span>
          </button>
        </div>
      </div>

      {/* Practice Vitals Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <button 
          onClick={showOverdueRecalls} 
          className="bg-white hover:bg-[#FAFBF8] border border-[#E2E4DD] p-3 rounded-xl shadow-xs text-left transition-colors flex items-center justify-between"
        >
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#697169]">Recalls Due</div>
            <div className="font-serif font-bold text-base sm:text-lg text-[#B9762E] mt-0.5">{overdueRecalls.length}</div>
          </div>
          <Clock size={16} className="text-[#B9762E]" />
        </button>

        <button 
          onClick={showPendingLabs} 
          className="bg-white hover:bg-[#FAFBF8] border border-[#E2E4DD] p-3 rounded-xl shadow-xs text-left transition-colors flex items-center justify-between"
        >
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#697169]">Pending Labs</div>
            <div className="font-serif font-bold text-base sm:text-lg text-[#3E6FA8] mt-0.5">{pendingLabs.length}</div>
          </div>
          <Beaker size={16} className="text-[#3E6FA8]" />
        </button>

        <button 
          onClick={showUnresolvedIncidents} 
          className="bg-white hover:bg-[#FAFBF8] border border-[#E2E4DD] p-3 rounded-xl shadow-xs text-left transition-colors flex items-center justify-between"
        >
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#697169]">Incidents</div>
            <div className="font-serif font-bold text-base sm:text-lg text-[#B14A42] mt-0.5">{unresolvedIncidents.length}</div>
          </div>
          <ShieldAlert size={16} className="text-[#B14A42]" />
        </button>

        <button 
          onClick={showOutstandingBalances} 
          className="bg-white hover:bg-[#FAFBF8] border border-[#E2E4DD] p-3 rounded-xl shadow-xs text-left transition-colors flex items-center justify-between"
        >
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#697169]">Balances</div>
            <div className="font-serif font-bold text-base sm:text-lg text-[#7A6BB0] mt-0.5">{outstandingBalances.length}</div>
          </div>
          <DollarSign size={16} className="text-[#7A6BB0]" />
        </button>
      </div>

      {/* Main Content Grid: Schedule (2/3) and Widgets (1/3) on desktop; clean stack on mobile/tablet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-8">
          {currentUser.role === UserRole.DENTAL_ASSISTANT ? (
            <TrayPrepList 
              appointments={todaysAppointments} 
              patients={patients} 
              settings={fieldSettings} 
            />
          ) : (
            <TodaysTimeline 
              appointments={todaysAppointments} 
              patients={patients} 
              settings={fieldSettings} 
              onUpdateStatus={handleStatusUpdate}
              onEditAppointment={handleEditAppointment}
              disappearingApts={disappearingApts}
            />
          )}
        </div>
        <div className="lg:col-span-4">
          <ActionWidgets 
            dailyKPIs={dailyKPIs} 
            myTasks={myTasks} 
            onToggleTask={handleToggleTask} 
            appointments={allTodaysAppointments} 
            patients={patients} 
            userRole={currentUser.role}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

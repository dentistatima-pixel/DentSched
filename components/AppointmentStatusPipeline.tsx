import React from 'react';
import { Appointment, AppointmentStatus } from '../types';
import { Check } from 'lucide-react';
import { APPOINTMENT_STATUS_WORKFLOW, getAppointmentStatusConfig } from '../constants';

interface AppointmentStatusPipelineProps {
  appointment: Appointment;
  onUpdateStatus: (status: AppointmentStatus) => void;
  readOnly?: boolean;
}

const AppointmentStatusPipeline: React.FC<AppointmentStatusPipelineProps> = ({ appointment, onUpdateStatus, readOnly = false }) => {
  const currentStatusIndex = APPOINTMENT_STATUS_WORKFLOW.indexOf(appointment.status);

  if (currentStatusIndex === -1) {
    // Handle non-pipeline statuses like Cancelled or No Show
    const config = getAppointmentStatusConfig(appointment.status);
    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black uppercase ${config.badgeClass}`}>
            <config.icon size={16} />
            <span>{config.label}</span>
        </div>
    );
  }

  return (
    <div className="flex items-center w-full">
      {APPOINTMENT_STATUS_WORKFLOW.map((status, index) => {
        const config = getAppointmentStatusConfig(status);
        const isCompleted = index < currentStatusIndex;
        const isCurrent = index === currentStatusIndex;
        const isFuture = index > currentStatusIndex;
        const canClick = !readOnly && isFuture;

        return (
          <React.Fragment key={status}>
            {index > 0 && (
              <div className={`flex-1 h-1 transition-all duration-500 ${isCompleted || isCurrent ? 'bg-teal-500' : 'bg-slate-200'}`} />
            )}
            <div
              onClick={() => canClick && onUpdateStatus(status)}
              className={`flex flex-col items-center gap-2 ${canClick ? 'cursor-pointer group' : ''}`}
              title={canClick ? `Advance to: ${config.label}` : config.label}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300
                ${isCurrent ? 'bg-lilac-600 border-white shadow-lg scale-110' : ''}
                ${isCompleted ? 'bg-teal-600 border-teal-200' : ''}
                ${isFuture ? 'bg-slate-200 border-slate-300 group-hover:bg-teal-100 group-hover:border-teal-300' : ''}
              `}>
                {isCompleted ? <Check size={20} className="text-white"/> : <config.icon size={20} className={isCurrent ? 'text-white' : 'text-slate-500'}/>}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors
                ${isCurrent ? 'text-lilac-700' : ''}
                ${isCompleted ? 'text-teal-700' : ''}
                ${isFuture ? 'text-slate-400 group-hover:text-teal-700' : ''}
              `}>{config.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default AppointmentStatusPipeline;
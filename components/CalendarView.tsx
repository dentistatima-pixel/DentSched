
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Filter, Lock, List, LayoutGrid, Clock, AlertTriangle, User as UserIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { Appointment, User, UserRole, AppointmentType, AppointmentStatus, Patient } from '../types';

interface CalendarViewProps {
  appointments: Appointment[];
  staff: User[];
  onAddAppointment: (date?: string, time?: string) => void;
  currentUser?: User; // Added prop
  patients?: Patient[]; // Need patients to show alerts/details
}

const CalendarView: React.FC<CalendarViewProps> = ({ appointments, staff, onAddAppointment, currentUser, patients = [] }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');
  
  // Default filter logic: If logged in as Dentist/Hygienist, show only their own column (or role).
  const [roleFilter, setRoleFilter] = useState<'All' | 'Dentist' | 'Hygienist' | 'MySchedule'>('All');

  useEffect(() => {
    if (currentUser) {
        if (currentUser.role === UserRole.DENTIST || currentUser.role === UserRole.HYGIENIST) {
            setRoleFilter('MySchedule');
        } else {
            setRoleFilter('All');
        }
    }
  }, [currentUser]);

  // Simple date navigation
  const nextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + 1);
    setSelectedDate(next);
  };

  const prevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(selectedDate.getDate() - 1);
    setSelectedDate(prev);
  };

  const formattedDate = selectedDate.toISOString().split('T')[0];
  // Standardize header date to MM/DD/YYYY
  const displayDate = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // Filter providers based on role selection
  const allProviders = staff.filter(u => u.role !== UserRole.ADMIN);
  const providers = allProviders.filter(p => {
      if (roleFilter === 'All') return true;
      if (roleFilter === 'Dentist') return p.role === UserRole.DENTIST;
      if (roleFilter === 'Hygienist') return p.role === UserRole.HYGIENIST;
      
      if (roleFilter === 'MySchedule' && currentUser) {
          // If Assistant/Hygienist, show them AND their assigned doctors
          if (currentUser.role === UserRole.HYGIENIST && currentUser.assignedDoctors?.length) {
              return p.id === currentUser.id || currentUser.assignedDoctors.includes(p.id);
          }
          // If Dentist, show just them
          return p.id === currentUser.id;
      }
      return true;
  });

  const todaysAppointments = appointments.filter(a => a.date === formattedDate);
  
  // Sort for Agenda View
  const sortedAppointments = [...todaysAppointments].sort((a, b) => 
    parseInt(a.time.replace(':','')) - parseInt(b.time.replace(':',''))
  );

  // Time slots for the day view (8 AM to 5 PM)
  const timeSlots = Array.from({ length: 10 }, (_, i) => i + 8); // 8, 9, ... 17

  const getPatient = (id: string) => patients.find(p => p.id === id);

  const isCritical = (p?: Patient) => {
      if (!p) return false;
      return (
          p.seriousIllness || 
          (p.allergies && p.allergies.length > 0 && !p.allergies.includes('None')) || 
          (p.medicalConditions && p.medicalConditions.length > 0 && !p.medicalConditions.includes('None'))
      );
  };

  // Helper for appointment styles
  const getAppointmentBaseStyle = (type: AppointmentType) => {
     switch(type) {
         case AppointmentType.ROOT_CANAL:
         case AppointmentType.EXTRACTION:
         case AppointmentType.SURGERY:
            return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', icon: 'text-red-500' };
         case AppointmentType.ORAL_PROPHYLAXIS:
         case AppointmentType.WHITENING:
            return { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900', icon: 'text-teal-500' };
         case AppointmentType.ORTHODONTICS:
         case AppointmentType.PROSTHODONTICS:
         case AppointmentType.DENTURE_ADJUSTMENTS:
            return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', icon: 'text-purple-500' };
         default: 
            return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', icon: 'text-blue-500' };
     }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Calendar Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl">
                <button onClick={prevDay} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600">
                    <ChevronLeft size={20} />
                </button>
                <h2 className="text-lg font-bold text-slate-800 min-w-[200px] text-center">{displayDate}</h2>
                <button onClick={nextDay} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600">
                    <ChevronRight size={20} />
                </button>
            </div>
            {/* View Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Grid View"
                >
                    <LayoutGrid size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('agenda')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'agenda' ? 'bg-white shadow text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Agenda View"
                >
                    <List size={18} />
                </button>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
           <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl">
                <span className="text-xs font-bold text-slate-400 px-2 uppercase tracking-wide">Filter</span>
                <button 
                    onClick={() => setRoleFilter('All')} 
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${roleFilter === 'All' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    All Staff
                </button>
                <button 
                    onClick={() => setRoleFilter('Dentist')} 
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${roleFilter === 'Dentist' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Dentists
                </button>
                {currentUser && currentUser.role !== UserRole.ADMIN && (
                    <button 
                        onClick={() => setRoleFilter('MySchedule')} 
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${roleFilter === 'MySchedule' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        My Schedule
                    </button>
                )}
           </div>
        </div>
      </div>

      {/* --- AGENDA VIEW --- */}
      {viewMode === 'agenda' ? (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
             {sortedAppointments.length === 0 ? (
                 <div className="text-center py-20 text-slate-400">
                     <Clock size={48} className="mx-auto mb-4 opacity-20" />
                     <p>No appointments scheduled for this day.</p>
                     <button onClick={() => onAddAppointment(formattedDate)} className="mt-4 text-teal-600 font-bold hover:underline">Book an appointment</button>
                 </div>
             ) : (
                 <div className="max-w-3xl mx-auto space-y-4">
                     {sortedAppointments.map(apt => {
                         const provider = staff.find(s => s.id === apt.providerId);
                         const patient = getPatient(apt.patientId);
                         const styles = getAppointmentBaseStyle(apt.type);
                         
                         return (
                             <div key={apt.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
                                 {/* Time Column */}
                                 <div className="bg-slate-50 p-4 w-full md:w-32 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
                                     <span className="text-xl font-bold text-slate-800">{apt.time}</span>
                                     <span className="text-xs text-slate-500 font-medium">{apt.durationMinutes} min</span>
                                 </div>
                                 
                                 {/* Content */}
                                 <div className="flex-1 p-4 flex flex-col justify-center">
                                     {apt.isBlock ? (
                                         <div className="flex items-center gap-2 text-slate-500">
                                             <Lock size={18} />
                                             <span className="font-bold italic">{apt.title}</span>
                                         </div>
                                     ) : (
                                         <>
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-lg text-slate-800">{patient ? patient.name : 'Unknown Patient'}</h3>
                                                    {isCritical(patient) && <AlertTriangle size={16} className="text-red-500 fill-red-100" />}
                                                </div>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                                                    apt.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                    {apt.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-xs px-2 py-0.5 rounded border ${styles.bg} ${styles.border} ${styles.text} font-semibold`}>
                                                    {apt.type}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-auto">
                                                <div className="flex items-center gap-1">
                                                    <UserIcon size={12} />
                                                    {provider?.name}
                                                </div>
                                                {apt.notes && (
                                                    <div className="italic">"{apt.notes}"</div>
                                                )}
                                            </div>
                                         </>
                                     )}
                                 </div>
                             </div>
                         );
                     })}
                 </div>
             )}
          </div>
      ) : (
      /* --- GRID VIEW --- */
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-white">
         <div className="min-w-max h-full flex flex-col">
            
            {/* Provider Header Row */}
            <div className="flex border-b border-slate-100">
                <div className="w-16 flex-shrink-0 bg-slate-50 border-r border-slate-100 sticky left-0 z-20"></div> 
                {providers.map(provider => (
                    <div key={provider.id} className="w-[220px] flex-shrink-0 p-3 border-r border-slate-100 text-center bg-slate-50">
                        <div className="flex flex-col items-center group">
                            <div className="relative">
                                <img src={provider.avatar} alt={provider.name} className="w-10 h-10 rounded-full mb-1 border-2 border-white shadow-sm group-hover:scale-110 transition-transform" />
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white
                                    ${provider.role === UserRole.DENTIST ? 'bg-teal-500' : 'bg-lilac-500'}
                                `}>
                                    {provider.role === UserRole.DENTIST ? 'D' : 'A'}
                                </div>
                            </div>
                            <span className="text-sm font-bold text-slate-800 truncate w-full mt-1">{provider.name}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Time Slots Grid */}
            <div className="flex-1 overflow-y-auto relative">
                {timeSlots.map(hour => (
                    <div key={hour} className="flex min-h-[140px] border-b border-slate-50">
                        {/* Time Label */}
                        <div className="w-16 flex-shrink-0 flex justify-center pt-3 border-r border-slate-100 bg-slate-50/90 backdrop-blur-sm text-xs font-bold text-slate-400 sticky left-0 z-10">
                            {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
                        </div>

                        {/* Cells for each provider */}
                        {providers.map(provider => {
                           const apt = todaysAppointments.find(a => 
                               a.providerId === provider.id && 
                               parseInt(a.time.split(':')[0]) === hour
                           );
                           
                           const patient = apt ? getPatient(apt.patientId) : undefined;
                           const styles = apt ? getAppointmentBaseStyle(apt.type) : undefined;

                           return (
                               <div 
                                 key={`${provider.id}-${hour}`} 
                                 className="w-[220px] flex-shrink-0 border-r border-slate-100 p-2 relative group bg-white hover:bg-slate-50/30 transition-colors"
                               >
                                  {apt ? (
                                      <div className={`
                                        h-full rounded-xl p-3 text-xs border cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col
                                        ${apt.isBlock ? 'bg-slate-100 border-slate-200 text-slate-500' : `${styles?.bg} ${styles?.border} ${styles?.text}`}
                                        ${apt.status === AppointmentStatus.CANCELLED ? 'opacity-60 grayscale' : ''}
                                      `}>
                                          {apt.isBlock ? (
                                              <div className="flex items-center justify-center h-full gap-2 font-bold italic">
                                                  <Lock size={14} /> {apt.title}
                                              </div>
                                          ) : (
                                              <>
                                                {/* Header: Time + Status */}
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold opacity-75 flex items-center gap-1">
                                                        <Clock size={10} /> {apt.time}
                                                    </span>
                                                    {apt.status === AppointmentStatus.CONFIRMED && <CheckCircle size={12} className="text-green-600" />}
                                                </div>
                                                
                                                {/* Patient Name */}
                                                <div className="font-bold text-sm mb-1 line-clamp-2 flex items-center gap-1">
                                                    {patient ? patient.name : `Patient ${apt.patientId}`}
                                                    {isCritical(patient) && <AlertTriangle size={12} className="text-red-500 fill-red-100 shrink-0" />}
                                                </div>

                                                {/* Procedure Badge */}
                                                <div className="mb-2">
                                                    <span className="bg-white/50 border border-black/5 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                                        {apt.type}
                                                    </span>
                                                </div>

                                                {/* Footer: Notes or ID */}
                                                <div className="mt-auto pt-2 border-t border-black/5 opacity-70 truncate text-[10px]">
                                                    {apt.notes || `ID: ${apt.id}`}
                                                </div>
                                              </>
                                          )}
                                      </div>
                                  ) : (
                                      <button 
                                        onClick={() => onAddAppointment(formattedDate, `${hour}:00`)}
                                        className="w-full h-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-teal-600 transition-all rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/30 gap-1"
                                      >
                                          <div className="bg-white p-2 rounded-full shadow-sm text-teal-500">
                                              <Clock size={16} />
                                          </div>
                                          <span className="text-xs font-bold">Book Slot</span>
                                      </button>
                                  )}
                               </div>
                           );
                        })}
                    </div>
                ))}
            </div>
         </div>
      </div>
      )}
    </div>
  );
};

export default CalendarView;

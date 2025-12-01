
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Filter, Lock } from 'lucide-react';
import { Appointment, User, UserRole, AppointmentType, AppointmentStatus } from '../types';

interface CalendarViewProps {
  appointments: Appointment[];
  staff: User[];
  onAddAppointment: (date?: string, time?: string) => void;
  currentUser?: User; // Added prop
}

const CalendarView: React.FC<CalendarViewProps> = ({ appointments, staff, onAddAppointment, currentUser }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
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
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  });

  // Filter providers based on role selection
  const allProviders = staff.filter(u => u.role !== UserRole.ADMIN);
  const providers = allProviders.filter(p => {
      if (roleFilter === 'All') return true;
      if (roleFilter === 'Dentist') return p.role === UserRole.DENTIST;
      if (roleFilter === 'Hygienist') return p.role === UserRole.HYGIENIST;
      if (roleFilter === 'MySchedule' && currentUser) return p.id === currentUser.id;
      return true;
  });

  const todaysAppointments = appointments.filter(a => a.date === formattedDate);

  // Time slots for the day view (8 AM to 5 PM)
  const timeSlots = Array.from({ length: 10 }, (_, i) => i + 8); // 8, 9, ... 17

  // Helper for appointment styles
  const getAppointmentStyle = (apt: Appointment) => {
     if (apt.status === AppointmentStatus.CANCELLED) {
         return 'bg-slate-50 border-slate-200 text-slate-400 opacity-75 line-through decoration-red-500 decoration-2';
     }

     if (apt.isBlock) {
         return 'bg-[repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9_10px,#e2e8f0_10px,#e2e8f0_20px)] border-slate-300 text-slate-600';
     }

     switch(apt.type) {
         case AppointmentType.ROOT_CANAL:
         case AppointmentType.EXTRACTION:
         case AppointmentType.SURGERY:
            return 'bg-red-50 border-red-200 text-red-800';
         case AppointmentType.ORAL_PROPHYLAXIS:
         case AppointmentType.WHITENING:
            return 'bg-teal-50 border-teal-200 text-teal-800';
         case AppointmentType.ORTHODONTICS:
         case AppointmentType.PROSTHODONTICS:
         case AppointmentType.DENTURE_ADJUSTMENTS:
            return 'bg-purple-50 border-purple-200 text-purple-800';
         default: // Consultation, Restoration, etc.
            return 'bg-lilac-50 border-lilac-200 text-lilac-800';
     }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Calendar Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex items-center gap-4 bg-slate-50 p-1 rounded-xl">
           <button onClick={prevDay} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600">
             <ChevronLeft size={20} />
           </button>
           <h2 className="text-lg font-bold text-slate-800 w-48 text-center">{displayDate}</h2>
           <button onClick={nextDay} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600">
             <ChevronRight size={20} />
           </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
           <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl">
                <span className="text-xs font-bold text-slate-400 px-2 uppercase tracking-wide">View</span>
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
                <button 
                    onClick={() => setRoleFilter('Hygienist')} 
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${roleFilter === 'Hygienist' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Hygienists
                </button>
                {currentUser && currentUser.role !== UserRole.ADMIN && (
                    <button 
                        onClick={() => setRoleFilter('MySchedule')} 
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${roleFilter === 'MySchedule' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        My Chair
                    </button>
                )}
           </div>
        </div>
      </div>

      {/* Calendar Grid (Horizontal Scroll for Providers) */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
         <div className="min-w-max h-full flex flex-col">
            
            {/* Provider Header Row */}
            <div className="flex border-b border-slate-100">
                <div className="w-16 flex-shrink-0 bg-slate-50 border-r border-slate-100 sticky left-0 z-20"></div> 
                {providers.map(provider => (
                    <div key={provider.id} className="w-[180px] flex-shrink-0 p-3 border-r border-slate-100 text-center bg-slate-50">
                        <div className="flex flex-col items-center group">
                            <div className="relative">
                                <img src={provider.avatar} alt={provider.name} className="w-10 h-10 rounded-full mb-1 border-2 border-white shadow-sm group-hover:scale-110 transition-transform" />
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white
                                    ${provider.role === UserRole.DENTIST ? 'bg-teal-500' : 'bg-lilac-500'}
                                `}>
                                    {provider.role === UserRole.DENTIST ? 'D' : 'H'}
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
                    <div key={hour} className="flex min-h-[100px] border-b border-slate-50">
                        {/* Time Label */}
                        <div className="w-16 flex-shrink-0 flex justify-center pt-2 border-r border-slate-100 bg-slate-50/90 backdrop-blur-sm text-xs font-semibold text-slate-400 sticky left-0 z-10 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                            {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
                        </div>

                        {/* Cells for each provider */}
                        {providers.map(provider => {
                           const apt = todaysAppointments.find(a => 
                               a.providerId === provider.id && 
                               parseInt(a.time.split(':')[0]) === hour
                           );

                           return (
                               <div 
                                 key={`${provider.id}-${hour}`} 
                                 className="w-[180px] flex-shrink-0 border-r border-slate-100 p-1 relative group bg-white hover:bg-slate-50/50 transition-colors"
                               >
                                  {apt ? (
                                      <div className={`
                                        h-full rounded-lg p-2 text-xs border cursor-pointer hover:shadow-md transition-all flex flex-col justify-between
                                        ${getAppointmentStyle(apt)}
                                      `}>
                                          <div>
                                            {apt.isBlock ? (
                                                <div className="font-bold truncate flex items-center gap-1">
                                                    <Lock size={12} /> {apt.title}
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="font-bold truncate">{apt.time}</div>
                                                    <div className="font-medium truncate opacity-90">{apt.type}</div>
                                                </>
                                            )}
                                          </div>
                                          {!apt.isBlock && (
                                            <div className="mt-1 truncate opacity-80 flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>
                                                Patient #{apt.patientId}
                                            </div>
                                          )}
                                      </div>
                                  ) : (
                                      <button 
                                        onClick={() => onAddAppointment(formattedDate, `${hour}:00`)}
                                        className="w-full h-full opacity-0 group-hover:opacity-100 hover:bg-slate-50 flex items-center justify-center text-teal-600 transition-all rounded-lg border-2 border-dashed border-transparent hover:border-teal-200"
                                      >
                                          <span className="text-xs font-bold bg-white px-2 py-1 rounded-full shadow-sm text-teal-600">+ Book</span>
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
    </div>
  );
};

export default CalendarView;

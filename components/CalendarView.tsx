import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, List, Clock, AlertTriangle, User as UserIcon, CheckCircle, Lock, Beaker } from 'lucide-react';
import { Appointment, User, UserRole, AppointmentType, AppointmentStatus, Patient, LabStatus, FieldSettings } from '../types';

interface CalendarViewProps {
  appointments: Appointment[];
  staff: User[];
  onAddAppointment: (date?: string, time?: string) => void;
  currentUser?: User;
  patients?: Patient[];
  currentBranch?: string;
  fieldSettings?: FieldSettings;
}

const CalendarView: React.FC<CalendarViewProps> = ({ appointments, staff, onAddAppointment, currentUser, patients = [], currentBranch, fieldSettings }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');
  
  // Date Navigation
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

  const formattedDate = selectedDate.toLocaleDateString('en-CA'); // Fixed: Use local date YYYY-MM-DD
  const displayDate = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // --- PROVIDER VISIBILITY LOGIC ---
  const getVisibleProviders = () => {
      if (!currentUser) return [];

      // 1. ADMIN: Sees ALL Dentists (The "God View")
      if (currentUser.role === UserRole.ADMIN) {
          if (currentBranch) {
              return staff.filter(u => u.role === UserRole.DENTIST && u.allowedBranches?.includes(currentBranch));
          }
          return staff.filter(u => u.role === UserRole.DENTIST);
      }

      // 2. DENTIST: Sees ONLY themselves
      if (currentUser.role === UserRole.DENTIST) {
          return [currentUser];
      }

      // 3. ASSISTANT: Sees ALL Dentists at the CURRENT BRANCH
      if (currentUser.role === UserRole.DENTAL_ASSISTANT) {
          if (!currentBranch) return [];
          return staff.filter(u => u.role === UserRole.DENTIST && u.allowedBranches?.includes(currentBranch));
      }

      return [];
  };

  const visibleProviders = getVisibleProviders();
  const visibleProviderIds = visibleProviders.map(p => p.id);

  const relevantAppointments = appointments.filter(a => 
      a.date === formattedDate && 
      (visibleProviderIds.includes(a.providerId) || a.isBlock)
  );
  
  const sortedAppointments = [...relevantAppointments].sort((a, b) => 
    parseInt(a.time.replace(':','')) - parseInt(b.time.replace(':',''))
  );

  // Time Slots: 7 AM (7) to 10 PM (22)
  // Length is 22 - 7 + 1 = 16 slots
  const timeSlots = Array.from({ length: 16 }, (_, i) => i + 7); 

  const getPatient = (id: string) => patients.find(p => p.id === id);

  const isCritical = (p?: Patient) => {
      if (!p) return false;
      return (
          p.seriousIllness || 
          (p.allergies && p.allergies.length > 0 && !p.allergies.includes('None')) || 
          (p.medicalConditions && p.medicalConditions.length > 0 && !p.medicalConditions.includes('None'))
      );
  };

  // Styles for Appointment Type
  const getAppointmentBaseStyle = (type: AppointmentType, status: AppointmentStatus) => {
     // Patient Flow Overrides
     if (status === AppointmentStatus.ARRIVED) return { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-900', icon: 'text-orange-600' };
     if (status === AppointmentStatus.SEATED) return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900', icon: 'text-blue-600' };
     if (status === AppointmentStatus.TREATING) return { bg: 'bg-lilac-50', border: 'border-lilac-300', text: 'text-lilac-900', icon: 'text-lilac-600' };

     // Default Type Styles
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
            return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-900', icon: 'text-slate-500' };
     }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Calendar Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
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
        
        {/* Helper Text */}
        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
            {currentBranch && <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded">{currentBranch}</span>}
            <span>
                {currentUser?.role === UserRole.ADMIN ? 'All Providers' : 
                currentUser?.role === UserRole.DENTIST ? 'My Personal Schedule' : 
                'Facility Schedule'}
            </span>
        </div>
      </div>

      {/* --- AGENDA VIEW --- */}
      {viewMode === 'agenda' ? (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
             {sortedAppointments.length === 0 ? (
                 <div className="text-center py-20 text-slate-400">
                     <Clock size={48} className="mx-auto mb-4 opacity-20" />
                     <p>No appointments scheduled for this view.</p>
                     <button onClick={() => onAddAppointment(formattedDate)} className="mt-4 text-teal-600 font-bold hover:underline">Book an appointment</button>
                 </div>
             ) : (
                 <div className="max-w-3xl mx-auto space-y-4">
                     {sortedAppointments.map(apt => {
                         const provider = staff.find(s => s.id === apt.providerId);
                         const patient = getPatient(apt.patientId);
                         const styles = getAppointmentBaseStyle(apt.type as AppointmentType, apt.status);
                         
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
                                                    {/* Lab Flag */}
                                                    {apt.labStatus && apt.labStatus !== LabStatus.NONE && (
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                                            <Beaker size={10} /> Lab: {apt.labStatus}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                                                    apt.status === AppointmentStatus.CONFIRMED ? 'bg-green-100 text-green-700' : 
                                                    apt.status === AppointmentStatus.ARRIVED ? 'bg-orange-100 text-orange-700' :
                                                    apt.status === AppointmentStatus.SEATED ? 'bg-blue-100 text-blue-700' :
                                                    apt.status === AppointmentStatus.TREATING ? 'bg-lilac-100 text-lilac-700' :
                                                    'bg-slate-100 text-slate-600'
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
      <div className="flex-1 overflow-x-auto overflow-y-auto bg-white">
         <div className="min-w-max h-full flex flex-col">
            
            {/* Provider Header Row */}
            <div className="flex border-b border-slate-100 sticky top-0 z-30 bg-white">
                <div className="w-16 flex-shrink-0 bg-slate-50 border-r border-slate-100 sticky left-0 z-40 shadow-sm"></div> 
                {visibleProviders.length > 0 ? (
                    visibleProviders.map(provider => (
                        <div key={provider.id} className="w-[240px] flex-shrink-0 p-3 border-r border-slate-100 text-center bg-slate-50">
                            <div className="flex flex-col items-center group">
                                <div className="relative">
                                    <img src={provider.avatar} alt={provider.name} className="w-10 h-10 rounded-full mb-1 border-2 border-white shadow-sm" />
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white
                                        ${provider.role === UserRole.DENTIST ? 'bg-teal-500' : 'bg-lilac-500'}
                                    `}>
                                        {provider.role === UserRole.DENTIST ? 'D' : 'A'}
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-slate-800 truncate w-full mt-1">{provider.name}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-sm text-slate-400 italic flex-1 text-center">
                        No providers scheduled for {currentBranch} on this day.
                    </div>
                )}
            </div>

            {/* Time Slots Grid */}
            <div className="flex-1 relative">
                {timeSlots.map(hour => (
                    <div key={hour} className="flex min-h-[140px] border-b border-slate-50">
                        {/* Time Label */}
                        <div className="w-16 flex-shrink-0 flex justify-center pt-3 border-r border-slate-100 bg-slate-50/90 backdrop-blur-sm text-xs font-bold text-slate-400 sticky left-0 z-20">
                            {hour > 12 ? hour - 12 : hour} {hour >= 12 && hour < 24 ? 'PM' : 'AM'}
                        </div>

                        {/* Cells */}
                        {visibleProviders.map(provider => {
                           // FIXED: Use filter instead of find to handle multiple appointments in same slot
                           const slotAppointments = relevantAppointments.filter(a => 
                               a.providerId === provider.id && 
                               parseInt(a.time.split(':')[0]) === hour
                           );
                           
                           return (
                               <div 
                                 key={`${provider.id}-${hour}`} 
                                 className="w-[240px] flex-shrink-0 border-r border-slate-100 p-2 relative group bg-white hover:bg-slate-50/30 transition-colors"
                               >
                                  {slotAppointments.length > 0 ? (
                                      <div className="flex flex-col gap-1 h-full overflow-y-auto max-h-[200px] no-scrollbar">
                                        {slotAppointments.map(apt => {
                                            const patient = getPatient(apt.patientId);
                                            const styles = getAppointmentBaseStyle(apt.type as AppointmentType, apt.status);

                                            return (
                                                <div key={apt.id} className={`
                                                    rounded-xl p-3 text-xs border cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col shrink-0
                                                    ${apt.isBlock ? 'bg-slate-100 border-slate-200 text-slate-500 min-h-[100px]' : `${styles?.bg} ${styles?.border} ${styles?.text} min-h-[120px]`}
                                                    ${apt.status === AppointmentStatus.CANCELLED ? 'opacity-60 grayscale' : ''}
                                                `}>
                                                    {apt.isBlock ? (
                                                        <div className="flex items-center justify-center h-full gap-2 font-bold italic">
                                                            <Lock size={14} /> {apt.title}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* Header: Time + Status */}
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="font-bold opacity-75 flex items-center gap-1">
                                                                    <Clock size={10} /> {apt.time}
                                                                </span>
                                                                {apt.labStatus && apt.labStatus !== LabStatus.NONE && (
                                                                    <div title="Lab Case">
                                                                        <Beaker size={12} className="text-amber-600" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Patient Name */}
                                                            <div className="font-bold text-sm mb-1 line-clamp-2 flex items-center gap-1">
                                                                {patient ? patient.name : `Patient ${apt.patientId}`}
                                                                {isCritical(patient) && <AlertTriangle size={12} className="text-red-500 fill-red-100 shrink-0" />}
                                                            </div>

                                                            <div className="mb-2">
                                                                <span className="bg-white/50 border border-black/5 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                                                    {apt.type}
                                                                </span>
                                                            </div>
                                                            
                                                            {/* Status Tag for Flow */}
                                                            <div className="mt-auto pt-2 border-t border-black/5 flex justify-between items-center">
                                                                <span className="font-bold uppercase text-[9px] opacity-70">{apt.status}</span>
                                                                {apt.status === AppointmentStatus.CONFIRMED && <CheckCircle size={10} />}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                      </div>
                                  ) : (
                                      /* BOOK BUTTON */
                                      (currentUser?.role === UserRole.ADMIN || 
                                       currentUser?.id === provider.id || 
                                       currentUser?.role === UserRole.DENTAL_ASSISTANT) && (
                                          <button 
                                            onClick={() => onAddAppointment(formattedDate, `${hour}:00`)}
                                            className="w-full h-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-teal-600 transition-all rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/30 gap-1"
                                          >
                                              <div className="bg-white p-2 rounded-full shadow-sm text-teal-500">
                                                  <Clock size={16} />
                                              </div>
                                              <span className="text-xs font-bold">Book Slot</span>
                                          </button>
                                      )
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
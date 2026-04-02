
import { FC, useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, User, Search, Filter, MoreVertical, Phone, MapPin
} from 'lucide-react';
import { useAppointments } from '../contexts/AppointmentContext';
import { usePatient } from '../contexts/PatientContext';
import { useAppContext } from '../contexts/AppContext';
import { useModal } from '../contexts/ModalContext';
import { AppointmentStatus, Appointment } from '../types';

export const MobileAppointmentView: FC = () => {
  const { appointments, handleSaveAppointment } = useAppointments();
  const { patients } = usePatient();
  const { currentBranch } = useAppContext();
  const { showModal } = useModal();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  const formattedDate = selectedDate.toLocaleDateString('en-CA');

  const dailyAppointments = useMemo(() => {
    return (appointments || [])
      .filter(a => a.date === formattedDate && a.branch === currentBranch && !a.isBlock)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, formattedDate, currentBranch]);

  const filteredAppointments = useMemo(() => {
    if (!searchQuery) return dailyAppointments;
    return dailyAppointments.filter(a => {
      const patient = patients.find(p => p.id === a.patientId);
      return patient?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             a.type.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [dailyAppointments, searchQuery, patients]);

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.ARRIVED: return 'text-orange-600 bg-orange-50 border-orange-100';
      case AppointmentStatus.IN_TREATMENT: return 'text-purple-600 bg-purple-50 border-purple-100';
      case AppointmentStatus.COMPLETED: return 'text-teal-600 bg-teal-50 border-teal-100';
      case AppointmentStatus.CANCELLED: return 'text-red-600 bg-red-50 border-red-100';
      case AppointmentStatus.NO_SHOW: return 'text-slate-600 bg-slate-100 border-slate-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-100';
    }
  };

  const handleNewAppointment = () => {
    showModal('appointment', {
      onSave: handleSaveAppointment,
      currentBranch,
      initialDate: formattedDate
    });
  };

  const handleEditAppointment = (apt: Appointment) => {
    showModal('appointment', {
      onSave: handleSaveAppointment,
      currentBranch,
      existingAppointment: apt
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Date Selector */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
          <ChevronLeft className="text-slate-400" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
          </span>
          <span className="text-lg font-bold text-slate-800">
            {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
          <ChevronRight className="text-slate-400" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text"
          placeholder="Search patient or procedure..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium"
        />
      </div>

      {/* Appointment List */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
            Appointments ({filteredAppointments.length})
          </h3>
          <button className="text-teal-600 text-xs font-bold flex items-center gap-1">
            <Filter size={14} /> Filter
          </button>
        </div>

        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((apt) => {
            const patient = patients.find(p => p.id === apt.patientId);
            const statusStyle = getStatusColor(apt.status);

            return (
              <div 
                key={apt.id}
                onClick={() => handleEditAppointment(apt)}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 active:scale-[0.98] transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                      <User size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 leading-tight">{patient?.name || 'Unknown Patient'}</h4>
                      <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                        <Clock size={12} />
                        <span>{apt.time} • {apt.durationMinutes}m</span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${statusStyle}`}>
                    {apt.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-xs font-bold border border-teal-100">
                    {apt.type}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex gap-4">
                    <button className="p-2 text-slate-400 hover:text-teal-600 transition-colors">
                      <Phone size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-teal-600 transition-colors">
                      <MapPin size={18} />
                    </button>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-teal-600 transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-3xl p-12 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <CalendarIcon size={32} />
            </div>
            <h4 className="font-bold text-slate-800 mb-1">No Appointments</h4>
            <p className="text-sm text-slate-400 max-w-[200px]">
              There are no appointments scheduled for this day.
            </p>
            <button 
              onClick={handleNewAppointment}
              className="mt-6 px-6 py-3 bg-teal-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-600/20 active:scale-95 transition-all"
            >
              Book Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

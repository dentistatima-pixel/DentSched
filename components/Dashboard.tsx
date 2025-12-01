
import React, { useState, useMemo } from 'react';
import { Calendar, CheckCircle, Clock, Users, TrendingUp, AlertCircle, ShieldAlert, AlertTriangle, Search, UserPlus, ChevronRight, CalendarPlus } from 'lucide-react';
import { Appointment, AppointmentStatus, User, UserRole, Patient } from '../types';
import Fuse from 'fuse.js';

interface DashboardProps {
  appointments: Appointment[];
  patientsCount: number;
  staffCount: number;
  currentUser: User;
  patients: Patient[];
  onAddPatient: () => void;
  onPatientSelect: (patientId: string) => void;
  onBookAppointment: (patientId?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  appointments, patientsCount, staffCount, currentUser, patients, onAddPatient, onPatientSelect, onBookAppointment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const today = new Date().toISOString().split('T')[0];
  // Exclude blocks from dashboard counts
  const todaysAppointments = appointments.filter(a => a.date === today && !a.isBlock);
  
  const stats = [
    { label: "Today's Appointments", value: todaysAppointments.length, icon: Calendar, color: 'text-lilac-600', bg: 'bg-lilac-100' },
    { label: "Pending Confirmation", value: todaysAppointments.filter(a => a.status === AppointmentStatus.SCHEDULED).length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: "Completed Today", value: todaysAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length, icon: CheckCircle, color: 'text-teal-600', bg: 'bg-teal-100' },
    { label: "Active Patients", value: patientsCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
  ];

  // Helper to check for critical conditions
  const isCritical = (patientId: string) => {
    const p = patients.find(pt => pt.id === patientId);
    if (!p) return false;
    return (
        p.seriousIllness || 
        (p.allergies && p.allergies.length > 0 && !p.allergies.includes('None')) || 
        (p.medicalConditions && p.medicalConditions.length > 0 && !p.medicalConditions.includes('None'))
    );
  };

  const getPatientName = (id: string) => {
      const p = patients.find(pt => pt.id === id);
      return p ? p.name : 'Unknown Patient';
  };

  // Search Logic
  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    const fuse = new Fuse(patients, {
      keys: ['name', 'email', 'phone', 'insuranceProvider'],
      threshold: 0.3,
    });
    return fuse.search(searchTerm).map(result => result.item).slice(0, 5);
  }, [patients, searchTerm]);

  // Calculate Unscheduled Treatments (Planned but not completed)
  const unscheduledTreatmentCount = useMemo(() => {
    let count = 0;
    patients.forEach(p => {
        if (p.dentalChart) {
            count += p.dentalChart.filter(e => e.status === 'Planned').length;
        }
    });
    return count;
  }, [patients]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">Practice Overview</h1>
            <p className="text-slate-500 mt-1">Welcome back, {currentUser.name}.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
            {/* Quick Patient Search */}
            <div className="relative z-20 w-full md:w-80">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search patient..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {/* Search Dropdown */}
                {searchTerm && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        {searchResults.length > 0 ? (
                            searchResults.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => onPatientSelect(p.id)}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center justify-between group"
                                >
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm group-hover:text-teal-700">{p.name}</div>
                                        <div className="text-xs text-slate-500">{p.phone}</div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-teal-500" />
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-slate-400">No patients found.</div>
                        )}
                    </div>
                )}
            </div>

            {/* New Appointment Button - DASHBOARD HEADER */}
            <button 
                onClick={() => onBookAppointment()}
                className="bg-lilac-500 hover:bg-lilac-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-sm shadow-lilac-500/20 flex items-center justify-center gap-2 whitespace-nowrap transition-all"
            >
                <CalendarPlus size={18} />
                <span className="hidden md:inline">Appointment</span>
            </button>

            {/* New Patient Button */}
            {currentUser.role !== UserRole.HYGIENIST && (
                <button 
                    onClick={onAddPatient}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-sm shadow-teal-600/20 flex items-center justify-center gap-2 whitespace-nowrap transition-all"
                >
                    <UserPlus size={18} />
                    <span className="hidden md:inline">New Patient</span>
                </button>
            )}

            <div className="hidden md:block text-xs px-3 py-1 bg-slate-200 rounded-full text-slate-600 font-bold self-center">
                <span className="text-teal-700">{currentUser.role}</span>
            </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-xl ${stat.bg} mb-3`}>
              <stat.icon className={`${stat.color}`} size={24} />
            </div>
            <span className="text-3xl font-bold text-slate-800">{stat.value}</span>
            <span className="text-sm font-medium text-slate-500 mt-1">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Quick Actions / Recent Activity Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${currentUser.role === UserRole.HYGIENIST ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Today's Schedule</h2>
            <button className="text-teal-600 font-medium hover:text-teal-700 text-sm">View All</button>
          </div>
          
          <div className="space-y-4">
            {todaysAppointments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 italic">No clinical appointments for today.</div>
            ) : (
                todaysAppointments.map(apt => (
                <div key={apt.id} className="flex items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 relative group">
                    <div className="w-16 text-center">
                    <div className="text-sm font-bold text-slate-800">{apt.time}</div>
                    <div className="text-xs text-slate-400">{apt.durationMinutes}m</div>
                    </div>
                    <div className="flex-1 ml-4 border-l-2 border-lilac-200 pl-4">
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                        {getPatientName(apt.patientId)}
                        {isCritical(apt.patientId) && (
                            <div className="text-red-500" title="Critical Medical Condition">
                                <AlertTriangle size={14} fill="currentColor" className="text-red-100 stroke-red-500" />
                            </div>
                        )}
                    </div>
                    <div className="text-xs text-teal-600 bg-teal-50 inline-block px-2 py-0.5 rounded-full mt-1">
                        {apt.type}
                    </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        apt.status === AppointmentStatus.CONFIRMED ? 'bg-green-100 text-green-700' :
                        apt.status === AppointmentStatus.SCHEDULED ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-600'
                    }`}>
                        {apt.status}
                    </span>
                    {/* Re-book Button in List */}
                    {!apt.isBlock && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onBookAppointment(apt.patientId); }}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Re-book"
                        >
                            <CalendarPlus size={16} />
                        </button>
                    )}
                    </div>
                </div>
                ))
            )}
          </div>
        </div>

        {/* Financial Data - HIDDEN FOR HYGIENISTS */}
        {currentUser.role !== UserRole.HYGIENIST ? (
            <div className="bg-teal-900 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                    <TrendingUp size={150} />
                </div>
                <h2 className="text-xl font-bold mb-4 relative z-10">Production Goals</h2>
                <div className="space-y-6 relative z-10">
                    <div>
                    <div className="flex justify-between text-sm mb-2 text-teal-200">
                        <span>Daily Hygiene</span>
                        <span>85%</span>
                    </div>
                    <div className="w-full bg-teal-800 rounded-full h-2">
                        <div className="bg-lilac-400 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    </div>
                    <div>
                    <div className="flex justify-between text-sm mb-2 text-teal-200">
                        <span>Doctor Production</span>
                        <span>62%</span>
                    </div>
                    <div className="w-full bg-teal-800 rounded-full h-2">
                        <div className="bg-teal-400 h-2 rounded-full" style={{ width: '62%' }}></div>
                    </div>
                    </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-teal-800 relative z-10">
                    <div className="flex items-start space-x-3">
                    <AlertCircle className="text-lilac-300 shrink-0" size={20} />
                    <p className="text-sm text-teal-100 leading-relaxed">
                        <strong className="text-white block mb-1">Unscheduled Treatment</strong>
                        You have <span className="font-bold text-white">{unscheduledTreatmentCount}</span> planned procedures across all patients that need booking.
                    </p>
                    </div>
                </div>
            </div>
        ) : (
            <div className="bg-slate-100 rounded-2xl shadow-inner p-6 flex flex-col items-center justify-center text-center border border-slate-200">
                <ShieldAlert size={48} className="text-slate-300 mb-2" />
                <h3 className="font-bold text-slate-400">Restricted Access</h3>
                <p className="text-xs text-slate-400 mt-1">Financial data is only available to Dentists and Administrators.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

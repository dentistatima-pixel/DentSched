
import React, { useState, useMemo } from 'react';
import { Calendar, CheckCircle, Clock, Users, TrendingUp, AlertTriangle, Search, UserPlus, ChevronRight, CalendarPlus, FileText, ArrowRight, ClipboardList, Beaker } from 'lucide-react';
import { Appointment, AppointmentStatus, User, UserRole, Patient, LabStatus, FieldSettings } from '../types';
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
  onUpdateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onCompleteRegistration: (patientId: string) => void;
  fieldSettings?: FieldSettings;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  appointments, patientsCount, staffCount, currentUser, patients, onAddPatient, onPatientSelect, onBookAppointment,
  onUpdateAppointmentStatus, onCompleteRegistration, fieldSettings
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openTrayId, setOpenTrayId] = useState<string | null>(null);
  
  // Feature Toggles
  const enableLab = fieldSettings?.features?.enableLabTracking ?? true;
  const enableAssistantFlow = fieldSettings?.features?.enableDentalAssistantFlow ?? true;

  const today = new Date().toISOString().split('T')[0];
  
  // VISIBILITY LOGIC (Updated for Branch-Centric Model)
  const visibleAppointments = appointments.filter(a => {
      // 1. ADMIN & ASSISTANT: See everything in this branch (Facility View)
      if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DENTAL_ASSISTANT) {
          return true;
      }
      // 2. DENTIST: Sees only their own appointments
      if (currentUser.role === UserRole.DENTIST) {
          return a.providerId === currentUser.id;
      }
      return false;
  });

  // Exclude blocks from dashboard counts
  const todaysAppointments = visibleAppointments.filter(a => a.date === today && !a.isBlock);
  
  // Short labels for slim view
  const stats = [
    { label: "Appts", value: todaysAppointments.length, icon: Calendar, color: 'text-lilac-600', bg: 'bg-lilac-100' },
    { label: "Pending", value: todaysAppointments.filter(a => a.status === AppointmentStatus.SCHEDULED).length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: "Done", value: todaysAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length, icon: CheckCircle, color: 'text-teal-600', bg: 'bg-teal-100' },
    { label: "Patients", value: patientsCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
  ];

  const getPatient = (id: string) => patients.find(pt => pt.id === id);

  // Helper to check for critical conditions
  const isCritical = (patientId: string) => {
    const p = getPatient(patientId);
    if (!p) return false;
    return (
        p.seriousIllness || 
        (p.allergies && p.allergies.length > 0 && !p.allergies.includes('None')) || 
        (p.medicalConditions && p.medicalConditions.length > 0 && !p.medicalConditions.includes('None'))
    );
  };

  // TRAY MAPPING (Simple mock logic)
  const getTrayItems = (type: string) => {
      const trays: Record<string, string[]> = {
          'Consultation': ['Mirror', 'Explorer', 'Probe', 'Cotton Pliers', 'Bib', 'Mask'],
          'Restoration': ['Mirror', 'Explorer', 'High Speed Handpiece', 'Bur Block (Composite)', 'Etch', 'Bond', 'Composite Gun', 'Curing Light', 'Articulating Paper'],
          'Extraction': ['Topical Anesthetic', 'Syringe (Lidocaine)', 'Elevators (S/M/L)', 'Forceps', 'Gauze', 'Suture Kit'],
          'Root Canal': ['Rubber Dam Kit', 'Endo Files (15-40)', 'Endo Motor', 'Apex Locator', 'Irrigation Syringe', 'Paper Points', 'Gutta Percha'],
          'Oral Prophylaxis': ['Ultrasonic Scaler', 'Polishing Cup', 'Prophy Paste', 'Floss'],
          'Prosthodontics': ['Impression Trays', 'Alginate/PVS', 'Shade Guide', 'Retraction Cord'],
      };
      return trays[type] || trays['Consultation'];
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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-3">
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                    {currentUser.role === UserRole.DENTIST ? 'My Practice' : `Hello, ${currentUser.name.split(' ')[0]}`}
                </p>
            </div>
            <div className="text-[10px] px-2 py-0.5 bg-slate-200 rounded text-slate-600 font-bold">
                {currentUser.role}
            </div>
        </div>
        
        <div className="flex flex-col gap-2 w-full">
            {/* Quick Patient Search */}
            <div className="relative z-20 w-full">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search patient..." 
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm text-sm"
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

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
                 <button 
                    onClick={() => onBookAppointment()}
                    className="flex-1 bg-lilac-600 active:bg-lilac-700 text-white px-3 py-2.5 rounded-xl font-bold shadow-sm shadow-lilac-600/20 flex items-center justify-center gap-1.5 whitespace-nowrap transition-all text-sm"
                >
                    <CalendarPlus size={18} />
                    <span>Appt</span>
                </button>
                <button 
                    onClick={onAddPatient}
                    className="flex-1 bg-teal-600 active:bg-teal-700 text-white px-3 py-2.5 rounded-xl font-bold shadow-sm shadow-teal-600/20 flex items-center justify-center gap-1.5 whitespace-nowrap transition-all text-sm"
                >
                    <UserPlus size={18} />
                    <span>Patient</span>
                </button>
            </div>
        </div>
      </header>

      {/* Stats - 2x2 GRID (Fixed Vertical, No Scrolling) */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
            <div className={`p-2 rounded-xl ${stat.bg}`}>
              <stat.icon className={`${stat.color}`} size={18} />
            </div>
            <div className="flex flex-col min-w-0">
                 <span className="text-xl font-bold text-slate-800 leading-none truncate">{stat.value}</span>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 truncate">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule List - COMPACT & DENSE */}
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-slate-50 bg-slate-50/50">
            <h2 className="text-base font-bold text-slate-800">
                {currentUser.role === UserRole.DENTIST ? 'Today\'s Schedule' : "Clinic Schedule"}
            </h2>
            <button className="text-teal-600 font-bold active:text-teal-800 text-[10px] uppercase tracking-wide">View All</button>
          </div>
          
          <div className="divide-y divide-slate-50">
            {todaysAppointments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 italic text-sm">
                    {currentUser.role === UserRole.DENTIST ? 'No appointments today.' : 'No clinical appointments.'}
                </div>
            ) : (
                todaysAppointments.map(apt => {
                    const patient = getPatient(apt.patientId);
                    const isProvisional = patient?.provisional;
                    const isDA = currentUser.role === UserRole.DENTAL_ASSISTANT;

                    return (
                        <div key={apt.id} className={`flex flex-col p-3 active:bg-slate-50 relative gap-2 ${isProvisional ? 'bg-orange-50/30' : ''}`}>
                            
                            <div className="flex justify-between items-start">
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm truncate">
                                        <span className="truncate">{patient?.name || 'Unknown'}</span>
                                        {isCritical(apt.patientId) && (
                                            <AlertTriangle size={14} className="text-red-500 fill-red-100 stroke-red-500 shrink-0" />
                                        )}
                                        {/* Lab Case Indicator */}
                                        {enableLab && apt.labStatus && apt.labStatus !== LabStatus.NONE && (
                                            <div className={`shrink-0 flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                                apt.labStatus === LabStatus.PENDING ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-green-100 text-green-700 border-green-200'
                                            }`}>
                                                <Beaker size={8} /> {apt.labStatus === LabStatus.PENDING ? 'Lab: Pend' : 'Lab: Recv'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                         <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                            {apt.time} ({apt.durationMinutes}m)
                                        </div>
                                        <div className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full truncate">
                                            {apt.type}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions / Status - COMPACT ROW */}
                            <div className="w-full mt-1">
                                {/* DENTAL ASSISTANT: PATIENT FLOW STEPPER */}
                                {isDA && enableAssistantFlow ? (
                                    <div className="flex items-center gap-1 p-0.5 rounded-lg w-full overflow-x-auto no-scrollbar">
                                        <button 
                                            onClick={() => onUpdateAppointmentStatus(apt.id, AppointmentStatus.ARRIVED)}
                                            className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all whitespace-nowrap px-1 border ${apt.status === AppointmentStatus.ARRIVED ? 'bg-orange-500 text-white border-orange-600' : 'bg-white border-slate-200 text-slate-400'}`}
                                        >
                                            Arrived
                                        </button>
                                        <ArrowRight size={10} className="text-slate-300 shrink-0" />
                                        <button 
                                            onClick={() => onUpdateAppointmentStatus(apt.id, AppointmentStatus.SEATED)}
                                            className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all whitespace-nowrap px-1 border ${apt.status === AppointmentStatus.SEATED ? 'bg-blue-500 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}
                                        >
                                            Seated
                                        </button>
                                        <ArrowRight size={10} className="text-slate-300 shrink-0" />
                                        <button 
                                            onClick={() => onUpdateAppointmentStatus(apt.id, AppointmentStatus.TREATING)}
                                            className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all whitespace-nowrap px-1 border ${apt.status === AppointmentStatus.TREATING ? 'bg-lilac-500 text-white border-lilac-600' : 'bg-white border-slate-200 text-slate-400'}`}
                                        >
                                            Treating
                                        </button>
                                        
                                        {/* Smart Tray Button */}
                                        <div className="relative ml-1 border-l border-slate-200 pl-1">
                                            <button 
                                                onClick={() => setOpenTrayId(openTrayId === apt.id ? null : apt.id)}
                                                className="p-1.5 bg-teal-50 text-teal-700 rounded border border-teal-100 active:bg-teal-100"
                                            >
                                                <ClipboardList size={14} />
                                            </button>
                                            {/* Tray Popover */}
                                            {openTrayId === apt.id && (
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-teal-200 shadow-xl rounded-xl z-50 p-3 animate-in fade-in zoom-in-95">
                                                    <div className="text-xs font-bold text-teal-800 uppercase mb-2 border-b border-teal-100 pb-1">Tray: {apt.type}</div>
                                                    <ul className="space-y-1">
                                                        {getTrayItems(apt.type).map((item, i) => (
                                                            <li key={i} className="text-xs text-slate-600 flex items-center gap-1.5">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div> {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* DENTIST/ADMIN OR ASSISTANT (No Flow): STANDARD SELECT */
                                    <div className="flex gap-2">
                                        <select 
                                            className={`flex-1 text-[10px] font-bold px-2 py-1.5 rounded-lg outline-none border ${
                                                apt.status === AppointmentStatus.CONFIRMED ? 'bg-green-50 text-green-700 border-green-200' :
                                                apt.status === AppointmentStatus.SCHEDULED ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                apt.status === AppointmentStatus.COMPLETED ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                apt.status === AppointmentStatus.ARRIVED ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                                apt.status === AppointmentStatus.SEATED ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                                apt.status === AppointmentStatus.TREATING ? 'bg-lilac-100 text-lilac-800 border-lilac-300' :
                                                'bg-slate-50 text-slate-600 border-slate-200'
                                            }`}
                                            value={apt.status}
                                            onChange={(e) => onUpdateAppointmentStatus(apt.id, e.target.value as AppointmentStatus)}
                                        >
                                            {Object.values(AppointmentStatus).map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                        
                                        {isProvisional && (
                                            <button 
                                                onClick={() => onCompleteRegistration(apt.patientId)}
                                                className="text-[10px] bg-teal-600 active:bg-teal-700 text-white px-2 py-1.5 rounded-lg font-bold flex items-center gap-1 shadow-sm transition-all"
                                            >
                                                <FileText size={10} /> Register
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
          </div>
        </div>

        {/* Financial Data - HIDDEN FOR DENTAL ASSISTANTS */}
        {currentUser.role !== UserRole.DENTAL_ASSISTANT ? (
            <div className="bg-teal-900 rounded-2xl shadow-lg p-5 text-white relative overflow-hidden mb-6">
                <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                    <TrendingUp size={120} />
                </div>
                <h2 className="text-sm font-bold mb-3 relative z-10 uppercase tracking-wider opacity-80">Daily Goals</h2>
                <div className="space-y-4 relative z-10">
                    <div>
                        <div className="flex justify-between text-xs mb-1 text-teal-100">
                            <span>Hygiene</span>
                            <span className="font-bold">85%</span>
                        </div>
                        <div className="w-full bg-teal-800/50 rounded-full h-1.5">
                            <div className="bg-lilac-400 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1 text-teal-100">
                            <span>Production</span>
                            <span className="font-bold">62%</span>
                        </div>
                        <div className="w-full bg-teal-800/50 rounded-full h-1.5">
                            <div className="bg-teal-400 h-1.5 rounded-full" style={{ width: '62%' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        ) : null}
      </div>
    </div>
  );
};

export default Dashboard;



import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, Search, UserPlus, ChevronRight, CalendarPlus, ClipboardList, Beaker, Repeat, ArrowRight, HeartPulse, PieChart, Activity, DollarSign, FileText, StickyNote, Package, Sunrise, AlertCircle, Plus, CheckCircle, Circle, Trash2, Flag, User as UserIcon } from 'lucide-react';
import { Appointment, AppointmentStatus, User, UserRole, Patient, LabStatus, FieldSettings, PinboardTask } from '../types';
import Fuse from 'fuse.js';

interface DashboardProps {
  appointments: Appointment[];
  patientsCount: number;
  staffCount: number;
  staff?: User[]; // Added staff list for assignment
  currentUser: User;
  patients: Patient[];
  onAddPatient: () => void;
  onPatientSelect: (patientId: string) => void;
  onBookAppointment: (patientId?: string) => void;
  onUpdateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onCompleteRegistration: (patientId: string) => void;
  fieldSettings?: FieldSettings;
  onViewAllSchedule?: () => void; 
  
  // Tasks Props (Lifted)
  tasks?: PinboardTask[];
  onAddTask?: (text: string, isUrgent: boolean, assignedTo: string) => void;
  onToggleTask?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  appointments, patientsCount, staffCount, staff, currentUser, patients, onAddPatient, onPatientSelect, onBookAppointment,
  onUpdateAppointmentStatus, onCompleteRegistration, fieldSettings, onViewAllSchedule,
  tasks = [], onAddTask, onToggleTask, onDeleteTask
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openTrayId, setOpenTrayId] = useState<string | null>(null);
  
  // New Task Inputs
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskUrgent, setNewTaskUrgent] = useState(false);
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  const handleAddTaskSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newTaskText.trim() || !onAddTask) return;
      
      onAddTask(newTaskText, newTaskUrgent, newTaskAssignee);
      
      setNewTaskText('');
      setNewTaskUrgent(false);
      setNewTaskAssignee('');
  };

  const sortedTasks = useMemo(() => {
      // Sort: Active First (Urgent top), then Completed
      return [...tasks].sort((a, b) => {
          if (a.isCompleted === b.isCompleted) {
              if (!a.isCompleted) {
                  // Both active: Urgent first
                  return (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0);
              }
              // Both completed: Newest completed first (roughly by creation ID for now)
              return parseInt(b.id) - parseInt(a.id);
          }
          return a.isCompleted ? 1 : -1;
      });
  }, [tasks]);

  // Dates
  const today = new Date().toLocaleDateString('en-CA');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString('en-CA');
  
  // VISIBILITY LOGIC
  const visibleAppointments = useMemo(() => appointments.filter(a => {
      // 1. ADMIN & ASSISTANT: See everything in this branch (Facility View)
      if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DENTAL_ASSISTANT) {
          return true;
      }
      // 2. DENTIST: Sees only their own appointments
      if (currentUser.role === UserRole.DENTIST) {
          return a.providerId === currentUser.id;
      }
      return false;
  }), [appointments, currentUser]);

  const todaysAppointments = visibleAppointments.filter(a => a.date === today && !a.isBlock);
  
  // Tomorrow's Prep Logic
  const tomorrowStats = useMemo(() => {
      const apts = visibleAppointments.filter(a => a.date === tomorrowStr);
      return {
          total: apts.length,
          newPatients: apts.filter(a => {
              const p = patients.find(pt => pt.id === a.patientId);
              return p?.provisional || (p?.lastVisit === 'First Visit');
          }).length,
          surgeries: apts.filter(a => ['Surgery', 'Implant', 'Extraction', 'Root Canal'].includes(a.type)).length
      };
  }, [visibleAppointments, patients, tomorrowStr]);

  // Incoming Lab Cases (Next 3 Days)
  const incomingLabCases = useMemo(() => {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      
      return visibleAppointments.filter(a => {
          if (a.labStatus !== LabStatus.PENDING) return false;
          const d = new Date(a.date);
          const todayDate = new Date();
          // Check if date is tomorrow or within 3 days
          return d > todayDate && d <= threeDaysFromNow;
      }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [visibleAppointments]);

  // Opportunities (Recall)
  const recallList = useMemo(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    return patients.filter(p => {
        if (!p.lastVisit) return false;
        // Mock logic: check if lastVisit is string date < sixMonthsAgo
        const d = new Date(p.lastVisit);
        return !isNaN(d.getTime()) && d < sixMonthsAgo && !p.nextVisit;
    }).slice(0, 5); // Limit to 5
  }, [patients]);

  const unscheduledTreatments = useMemo(() => {
      // Find patients with "Planned" chart entries who have no future appointments
      // Simplified: Just finding "Planned" entries for now
      return patients.filter(p => p.dentalChart?.some(e => e.status === 'Planned')).slice(0, 3);
  }, [patients]);

  // Helpers
  const getPatient = (id: string) => patients.find(pt => pt.id === id);
  const getTrayItems = (type: string) => {
      const trays: Record<string, string[]> = {
          'Consultation': ['Mirror', 'Explorer', 'Probe', 'Bib', 'Mask'],
          'Restoration': ['High Speed', 'Bur Block', 'Etch', 'Bond', 'Composite', 'Curing Light'],
          'Extraction': ['Topical', 'Lidocaine', 'Elevators', 'Forceps', 'Gauze'],
          'Root Canal': ['Rubber Dam', 'Files', 'Motor', 'Apex Locator', 'Irrigation'],
          'Oral Prophylaxis': ['Scaler', 'Polishing Cup', 'Paste', 'Floss'],
      };
      return trays[type] || trays['Consultation'];
  };

  const isCritical = (p?: Patient) => {
      if (!p) return false;
      return (
          p.seriousIllness || 
          p.underMedicalTreatment ||
          (p.allergies && p.allergies.length > 0 && !p.allergies.includes('None')) || 
          (p.medicalConditions && p.medicalConditions.length > 0 && !p.medicalConditions.includes('None'))
      );
  };

  // Search
  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    const fuse = new Fuse(patients, { keys: ['name', 'phone'], threshold: 0.3 });
    return fuse.search(searchTerm).map(result => result.item).slice(0, 5);
  }, [patients, searchTerm]);


  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* --- UNIFIED TOOLBAR --- */}
      <header className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            {/* Expanded Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search patients, treatments, or notes..." 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm font-medium transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                        {searchResults.length > 0 ? (
                            searchResults.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => onPatientSelect(p.id)}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 flex justify-between"
                                >
                                    <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                                    <ChevronRight size={16} className="text-slate-300" />
                                </button>
                            ))
                        ) : <div className="p-4 text-center text-sm text-slate-400">No patients found.</div>}
                    </div>
                )}
            </div>

            {/* Compact Action Buttons */}
            <div className="flex gap-2 shrink-0">
                 <button onClick={() => onBookAppointment()} className="h-11 px-4 bg-lilac-100 hover:bg-lilac-200 text-lilac-700 rounded-xl flex items-center justify-center gap-2 transition-colors" title="Book Appointment">
                    <CalendarPlus size={20} /> <span className="hidden md:inline font-bold text-sm">Book</span>
                </button>
                <button onClick={onAddPatient} className="h-11 px-4 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-xl flex items-center justify-center gap-2 transition-colors" title="Add Patient">
                    <UserPlus size={20} /> <span className="hidden md:inline font-bold text-sm">Add Patient</span>
                </button>
            </div>
      </header>

      {/* --- STACKED LAYOUT: SCHEDULE -> PREP -> LAB -> OPPORTUNITIES -> PINBOARD --- */}
      <div className="space-y-6">

          {/* 1. TODAY'S SCHEDULE */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-50">
                  <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <Calendar className="text-teal-600" size={20}/> Today's Schedule
                  </h2>
                  <button onClick={onViewAllSchedule} className="text-teal-600 text-xs font-bold uppercase tracking-wide hover:underline">View Calendar</button>
              </div>
              <div className="divide-y divide-slate-50">
                  {todaysAppointments.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 italic">No appointments for today.</div>
                  ) : (
                      todaysAppointments.map(apt => {
                          const patient = getPatient(apt.patientId);
                          const isProvisional = patient?.provisional;
                          const hasMedicalAlert = isCritical(patient);
                          
                          // DYNAMIC ROW STYLING based on Status
                          const getRowStyle = (s: string) => {
                              switch(s) {
                                  case AppointmentStatus.ARRIVED: 
                                      return 'bg-orange-50/60 border-l-4 border-l-orange-400 hover:bg-orange-100/50';
                                  case AppointmentStatus.SEATED: 
                                      return 'bg-blue-50/60 border-l-4 border-l-blue-400 hover:bg-blue-100/50';
                                  case AppointmentStatus.TREATING: 
                                      return 'bg-lilac-50/60 border-l-4 border-l-lilac-400 hover:bg-lilac-100/50';
                                  case AppointmentStatus.COMPLETED: 
                                      return 'bg-emerald-50/40 border-l-4 border-l-emerald-400 opacity-70 hover:opacity-100';
                                  default: 
                                      return 'bg-white border-l-4 border-l-transparent hover:bg-slate-50';
                              }
                          };
                          
                          const rowClass = getRowStyle(apt.status);
                          
                          // Determine status badge color
                          const getStatusColor = (s: string) => {
                              switch(s) {
                                  case AppointmentStatus.ARRIVED: return 'bg-orange-100 text-orange-700 border-orange-200';
                                  case AppointmentStatus.SEATED: return 'bg-blue-100 text-blue-700 border-blue-200';
                                  case AppointmentStatus.TREATING: return 'bg-lilac-100 text-lilac-700 border-lilac-200';
                                  case AppointmentStatus.COMPLETED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
                                  default: return 'bg-slate-100 text-slate-600 border-slate-200';
                              }
                          };

                          return (
                              <div key={apt.id} className={`p-3 transition-colors group relative flex items-start gap-3 ${rowClass}`}>
                                  
                                  {/* Column 1: Time */}
                                  <div className="bg-white/80 text-slate-600 px-2 py-0.5 rounded text-xs font-bold font-mono mt-0.5 shrink-0 shadow-sm border border-slate-100">
                                      {apt.time}
                                  </div>

                                  {/* Column 2: Name & Details Stack (Tight) */}
                                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                      {/* Name Row */}
                                      <div className="flex items-center gap-2">
                                          <button 
                                            onClick={() => onPatientSelect(apt.patientId)}
                                            className={`font-bold text-sm leading-none flex items-center gap-2 hover:underline text-left ${
                                                hasMedicalAlert ? 'text-red-600' : 
                                                apt.status === AppointmentStatus.COMPLETED ? 'text-slate-500' : 'text-slate-800'
                                            }`}
                                          >
                                              {patient?.name || 'Unknown'}
                                              {/* ALERTS */}
                                              {hasMedicalAlert && <HeartPulse size={14} className="text-red-500 fill-red-100 animate-pulse" />}
                                              {apt.labStatus === LabStatus.PENDING && <Beaker size={14} className="text-amber-500 fill-amber-100" />}
                                          </button>
                                          
                                          {isProvisional && <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 rounded uppercase tracking-wider">New</span>}
                                      </div>
                                      
                                      {/* Details Row */}
                                      <div className="flex items-center gap-2 text-xs text-slate-500 leading-none">
                                          <span className="truncate max-w-[200px] font-medium">{apt.type}</span>
                                          <span className="text-slate-300">•</span>
                                          <span>{apt.durationMinutes}m</span>
                                          
                                          {/* INLINE TRAY ICON */}
                                          {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DENTIST || (currentUser.role === UserRole.DENTAL_ASSISTANT && currentUser.preferences?.showTraySetup)) && (
                                              <div className="relative ml-1">
                                                  <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenTrayId(openTrayId === apt.id ? null : apt.id);
                                                    }}
                                                    className={`p-0.5 rounded hover:bg-teal-50 text-slate-400 hover:text-teal-600 transition-colors ${openTrayId === apt.id ? 'text-teal-600 bg-teal-50' : ''}`}
                                                    title="View Tray Setup"
                                                  >
                                                      <ClipboardList size={12} />
                                                  </button>
                                                  
                                                  {/* Tray Popup */}
                                                  {openTrayId === apt.id && (
                                                      <>
                                                        <div className="fixed inset-0 z-10 cursor-default" onClick={(e) => { e.stopPropagation(); setOpenTrayId(null); }} />
                                                        <div 
                                                            className="absolute left-0 top-full mt-1 bg-white shadow-xl border border-slate-100 p-3 rounded-xl z-20 text-xs w-48 text-left animate-in fade-in zoom-in-95 duration-200"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <h4 className="font-bold mb-1 border-b pb-1 text-slate-800">Setup: {apt.type}</h4>
                                                            <ul className="list-disc pl-4 text-slate-600">
                                                                {getTrayItems(apt.type).map(i => <li key={i}>{i}</li>)}
                                                            </ul>
                                                        </div>
                                                      </>
                                                  )}
                                              </div>
                                          )}
                                      </div>
                                  </div>

                                  {/* Column 3: Status Badge Selector */}
                                  <div className="relative shrink-0">
                                      <select 
                                          value={apt.status}
                                          onChange={(e) => onUpdateAppointmentStatus(apt.id, e.target.value as AppointmentStatus)}
                                          className={`appearance-none text-[10px] font-bold px-3 py-1 rounded-full uppercase border cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 ${getStatusColor(apt.status)}`}
                                          onClick={(e) => e.stopPropagation()}
                                      >
                                           {Object.values(AppointmentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                      </select>
                                  </div>
                              </div>
                          );
                      })
                  )}
              </div>
          </div>
          
          {/* 2. TOMORROW'S PREP */}
          <div className="bg-teal-900 rounded-2xl shadow-lg border border-teal-800 p-4 text-white flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                  <div className="bg-teal-800 p-2 rounded-xl">
                      <Sunrise size={24} className="text-teal-200" />
                  </div>
                  <div>
                      <h3 className="font-bold text-lg">Tomorrow's Prep</h3>
                      <p className="text-teal-300 text-xs">Get a head start on tray setups & sterilization.</p>
                  </div>
              </div>
              <div className="flex gap-4 md:gap-8">
                  <div className="text-center">
                      <div className="text-2xl font-bold">{tomorrowStats.total}</div>
                      <div className="text-[10px] text-teal-300 uppercase font-bold tracking-wider">Appointments</div>
                  </div>
                  <div className="w-px bg-teal-800"></div>
                  <div className="text-center">
                      <div className="text-2xl font-bold">{tomorrowStats.surgeries}</div>
                      <div className="text-[10px] text-teal-300 uppercase font-bold tracking-wider">Major Procs</div>
                  </div>
                  <div className="w-px bg-teal-800"></div>
                  <div className="text-center">
                      <div className="text-2xl font-bold">{tomorrowStats.newPatients}</div>
                      <div className="text-[10px] text-teal-300 uppercase font-bold tracking-wider">New Patients</div>
                  </div>
              </div>
          </div>

          {/* 3. INCOMING LAB CASES */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-50 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                        <Package className="text-blue-500" size={16} /> Incoming Lab Cases (Next 3 Days)
                    </h3>
                </div>
                <div className="p-2 space-y-1">
                    {incomingLabCases.length > 0 ? incomingLabCases.map(a => {
                        const p = getPatient(a.patientId);
                        const d = new Date(a.date);
                        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                        return (
                            <div key={a.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 text-blue-700 font-bold text-xs px-2 py-1 rounded uppercase w-10 text-center">
                                        {dayName}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-slate-700">{p?.name}</div>
                                        <div className="text-xs text-slate-500">{a.type}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                                    <AlertCircle size={10} /> PENDING
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="p-4 text-center text-xs text-slate-400 italic">No pending lab cases due soon.</div>
                    )}
                </div>
          </div>
          
          {/* 4. OPPORTUNITIES */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[350px]">
                <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Repeat className="text-purple-500" size={18} /> Opportunities
                    </h3>
                </div>
                <div className="p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    {/* Recall */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Recall List (Due for Hygiene)</h4>
                        <div className="space-y-2">
                            {recallList.length > 0 ? recallList.map(p => (
                                <div key={p.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 border border-slate-100 hover:bg-purple-50 hover:border-purple-100 rounded-xl cursor-pointer group transition-all" onClick={() => onPatientSelect(p.id)}>
                                    <span className="font-bold text-slate-700">{p.name}</span>
                                    <span className="text-xs text-purple-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Book Now</span>
                                </div>
                            )) : <div className="text-xs text-slate-400 italic">No patients due for recall.</div>}
                        </div>
                    </div>

                    {/* Unscheduled Treatment */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Unscheduled Treatment</h4>
                        <div className="space-y-2">
                            {unscheduledTreatments.length > 0 ? unscheduledTreatments.map(p => {
                                const tx = p.dentalChart?.find(e => e.status === 'Planned');
                                return (
                                    <div key={p.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 border border-slate-100 hover:bg-teal-50 hover:border-teal-100 rounded-xl cursor-pointer group transition-all" onClick={() => onPatientSelect(p.id)}>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700">{p.name}</span>
                                            <span className="text-[10px] text-slate-500">{tx?.procedure}</span>
                                        </div>
                                        <ArrowRight size={14} className="text-slate-300 group-hover:text-teal-500" />
                                    </div>
                                );
                            }) : <div className="text-xs text-slate-400 italic">No pending treatments found.</div>}
                        </div>
                    </div>
                </div>
          </div>
          
          {/* 5. CLINIC PINBOARD */}
          <div className="bg-yellow-50 rounded-2xl shadow-sm border border-yellow-200 overflow-hidden flex flex-col h-[350px]">
                <div className="px-4 py-3 border-b border-yellow-100 bg-yellow-100/50 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-yellow-800 flex items-center gap-2 text-sm">
                        <StickyNote size={16} /> Clinic Tasks
                    </h3>
                    <span className="text-[10px] text-yellow-600 font-bold uppercase">{sortedTasks.filter(t => !t.isCompleted).length} Active</span>
                </div>
                
                {/* Task List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {sortedTasks.map(task => {
                        const assigneeUser = staff?.find(s => s.id === task.assignedTo);
                        return (
                            <div key={task.id} className={`group flex items-center gap-2 p-2 rounded-lg border transition-all ${
                                task.isCompleted 
                                    ? 'bg-yellow-100/30 border-transparent opacity-60' 
                                    : 'bg-white border-yellow-100 shadow-sm hover:border-yellow-300'
                            }`}>
                                <button 
                                    onClick={() => onToggleTask && onToggleTask(task.id)}
                                    className={`p-1 rounded-full transition-colors ${
                                        task.isCompleted ? 'text-yellow-600' : 'text-slate-300 hover:text-yellow-600'
                                    }`}
                                >
                                    {task.isCompleted ? <CheckCircle size={18} /> : <Circle size={18} />}
                                </button>
                                
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm leading-tight ${task.isCompleted ? 'line-through text-yellow-800/50' : 'text-yellow-900 font-medium'}`}>
                                        {task.text}
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                        {task.isUrgent && !task.isCompleted && (
                                            <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <Flag size={8} fill="currentColor" /> Urgent
                                            </span>
                                        )}
                                        {assigneeUser && (
                                            <span className="text-[9px] font-bold bg-white text-slate-500 px-1.5 py-0.5 rounded border border-yellow-100 flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-slate-200 overflow-hidden">
                                                    <img src={assigneeUser.avatar} className="w-full h-full object-cover" alt="avatar" />
                                                </div>
                                                {assigneeUser.name.split(' ')[0]}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button 
                                    onClick={() => onDeleteTask && onDeleteTask(task.id)}
                                    className="p-1.5 text-yellow-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })}
                    {sortedTasks.length === 0 && (
                        <div className="p-8 text-center text-xs text-yellow-700/50 italic">
                            No tasks yet. Add one below!
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-3 bg-yellow-100/50 border-t border-yellow-200 shrink-0">
                    <form onSubmit={handleAddTaskSubmit} className="flex gap-2 items-center">
                        <div className="flex-1 relative">
                            <input 
                                type="text" 
                                value={newTaskText}
                                onChange={(e) => setNewTaskText(e.target.value)}
                                placeholder="Add new task..."
                                className="w-full pl-3 pr-8 py-2 bg-white border border-yellow-200 rounded-lg text-sm focus:outline-none focus:border-yellow-400 placeholder:text-yellow-800/30"
                            />
                            <button 
                                type="button"
                                onClick={() => setNewTaskUrgent(!newTaskUrgent)}
                                className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${newTaskUrgent ? 'text-red-500 bg-red-50' : 'text-slate-300 hover:text-red-400'}`}
                                title="Mark as Urgent"
                            >
                                <Flag size={14} fill={newTaskUrgent ? "currentColor" : "none"} />
                            </button>
                        </div>
                        
                        <div className="relative">
                            <select 
                                value={newTaskAssignee}
                                onChange={(e) => setNewTaskAssignee(e.target.value)}
                                className="w-10 h-9 bg-white border border-yellow-200 rounded-lg text-xs text-transparent focus:text-slate-700 focus:w-auto transition-all outline-none appearance-none cursor-pointer"
                                title="Assign to..."
                            >
                                <option value="">No one</option>
                                {staff?.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400">
                                <UserIcon size={16} />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={!newTaskText.trim()}
                            className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
                        >
                            <Plus size={18} />
                        </button>
                    </form>
                </div>
          </div>

      </div>
    </div>
  );
};

export default Dashboard;

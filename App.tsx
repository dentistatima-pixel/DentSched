import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import PatientList from './components/PatientList';
import AppointmentModal from './components/AppointmentModal';
import PatientRegistrationModal from './components/PatientRegistrationModal';
import FieldManagement from './components/FieldManagement';
import { STAFF, PATIENTS, APPOINTMENTS, DEFAULT_FIELD_SETTINGS } from './constants';
import { Appointment, User, Patient, FieldSettings, AppointmentType, UserRole, AppointmentStatus, PinboardTask } from './types';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // PERSISTENCE & INITIALIZATION
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('dentsched_appointments');
    return saved ? JSON.parse(saved) : APPOINTMENTS;
  });

  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('dentsched_patients');
    return saved ? JSON.parse(saved) : PATIENTS;
  });

  const [staff, setStaff] = useState<User[]>(() => {
    const saved = localStorage.getItem('dentsched_staff');
    return saved ? JSON.parse(saved) : STAFF;
  });
  
  const [fieldSettings, setFieldSettings] = useState<FieldSettings>(() => {
      const saved = localStorage.getItem('dentsched_fields');
      const parsed = saved ? JSON.parse(saved) : DEFAULT_FIELD_SETTINGS;
      
      // FORCE UPDATE: Overwrite lists with new constants to ensure users see updates
      return {
          ...parsed,
          allergies: DEFAULT_FIELD_SETTINGS.allergies,
          medicalConditions: DEFAULT_FIELD_SETTINGS.medicalConditions,
          procedures: DEFAULT_FIELD_SETTINGS.procedures,
          features: {
              ...(DEFAULT_FIELD_SETTINGS.features || {}),
              ...(parsed.features || {})
          }
      };
  });

  // Pinboard Tasks (Lifted State)
  const [tasks, setTasks] = useState<PinboardTask[]>(() => {
      const saved = localStorage.getItem('dentsched_pinboard_tasks');
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
      localStorage.setItem('dentsched_pinboard_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (text: string, isUrgent: boolean, assignedTo: string) => {
      const newTask: PinboardTask = {
          id: Date.now().toString(),
          text,
          isCompleted: false,
          isUrgent,
          assignedTo: assignedTo || undefined,
          createdAt: Date.now()
      };
      setTasks(prev => [newTask, ...prev]);
  };

  const handleToggleTask = (id: string) => {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  const handleDeleteTask = (id: string) => {
      setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Auth State
  const [currentUser, setCurrentUser] = useState<User>(staff[0]); 

  // BRANCH STATE
  const [currentBranch, setCurrentBranch] = useState<string>(
      (currentUser.allowedBranches && currentUser.allowedBranches.length > 0) 
      ? currentUser.allowedBranches[0] 
      : currentUser.defaultBranch || 'Makati Branch'
  );

  // Appointment Modal State
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<string | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState<string | undefined>(undefined);
  const [initialBookingPatientId, setInitialBookingPatientId] = useState<string | undefined>(undefined);
  // For Editing
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Patient Registration Modal State
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Navigation State
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('dentsched_appointments', JSON.stringify(appointments));
    localStorage.setItem('dentsched_patients', JSON.stringify(patients));
    localStorage.setItem('dentsched_staff', JSON.stringify(staff));
    localStorage.setItem('dentsched_fields', JSON.stringify(fieldSettings));
  }, [appointments, patients, staff, fieldSettings]);

  // Ensure currentUser reflects updates
  useEffect(() => {
    const updatedUser = staff.find(s => s.id === currentUser.id);
    if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(updatedUser);
        if (updatedUser.allowedBranches && !updatedUser.allowedBranches.includes(currentBranch)) {
            setCurrentBranch(updatedUser.allowedBranches[0] || 'Makati Branch');
        }
    }
  }, [staff, currentUser.id]);

  // FILTER LOGIC
  const branchAppointments = appointments.filter(a => a.branch === currentBranch);

  const handleOpenBooking = (date?: string, time?: string, patientId?: string, appointmentToEdit?: Appointment) => {
    setBookingDate(date);
    setBookingTime(time);
    setInitialBookingPatientId(patientId);
    setEditingAppointment(appointmentToEdit || null); // Set edit state
    setIsAppointmentModalOpen(true);
  };

  const handleSaveAppointment = (newAppointment: Appointment) => {
    const appointmentWithBranch = {
        ...newAppointment,
        branch: newAppointment.branch || currentBranch
    };

    setAppointments(prev => {
        const existingIndex = prev.findIndex(a => a.id === appointmentWithBranch.id);
        if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = appointmentWithBranch;
            return updated;
        } else {
            return [...prev, appointmentWithBranch];
        }
    });
  };

  // DRAG AND DROP / MOVE HANDLER
  const handleMoveAppointment = (appointmentId: string, newDate: string, newTime: string, newProviderId: string) => {
      setAppointments(prev => {
          const apt = prev.find(a => a.id === appointmentId);
          if (!apt) return prev;

          const updatedApt: Appointment = {
              ...apt,
              date: newDate,
              time: newTime,
              providerId: newProviderId,
              // Log the move in history
              rescheduleHistory: [
                  ...(apt.rescheduleHistory || []),
                  {
                      previousDate: apt.date,
                      previousTime: apt.time,
                      previousProviderId: apt.providerId,
                      reason: 'Reschedule', // Automated drag drop reason
                      timestamp: new Date().toISOString()
                  }
              ]
          };

          return prev.map(a => a.id === appointmentId ? updatedApt : a);
      });
  };

  const handleSavePatient = (newPatientData: Partial<Patient>) => {
    // COMPLIANCE: Update timestamp
    const dataWithTimestamp = {
        ...newPatientData,
        lastDigitalUpdate: new Date().toISOString()
    };

    if (editingPatient) {
        setPatients(prev => prev.map(p => p.id === newPatientData.id ? { ...p, ...dataWithTimestamp as Patient } : p));
        setEditingPatient(null);
    } else {
        const newPatient: Patient = {
            ...dataWithTimestamp as Patient,
            id: newPatientData.id || `p_new_${Date.now()}`,
            lastVisit: 'First Visit',
            nextVisit: null,
            notes: newPatientData.notes || ''
        };
        setPatients(prev => [...prev, newPatient]);
        if (!newPatient.provisional) {
            setSelectedPatientId(newPatient.id);
            setActiveTab('patients');
        }
    }
  };

  const handleSwitchUser = (userOrUpdatedUser: User) => {
      const existingIndex = staff.findIndex(s => s.id === userOrUpdatedUser.id);
      if (existingIndex >= 0) {
          const newStaff = [...staff];
          newStaff[existingIndex] = userOrUpdatedUser;
          setStaff(newStaff);
      }
      
      setCurrentUser(userOrUpdatedUser);
      
      if (userOrUpdatedUser.defaultBranch) {
          if (!userOrUpdatedUser.allowedBranches || userOrUpdatedUser.allowedBranches.includes(userOrUpdatedUser.defaultBranch)) {
               setCurrentBranch(userOrUpdatedUser.defaultBranch);
          }
      }
      
      if (userOrUpdatedUser.role !== UserRole.ADMIN && activeTab === 'field-mgmt') {
          setActiveTab('dashboard');
      }
  };

  const handleEditPatientClick = (patient: Patient) => {
      setEditingPatient(patient);
      setIsPatientModalOpen(true);
  };

  const handleQuickUpdatePatient = (updatedPatient: Patient) => {
      setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };
  
  const handleBulkUpdatePatients = (updatedPatients: Patient[]) => {
      setPatients(prev => {
          const newPatients = [...prev];
          updatedPatients.forEach(updated => {
              const idx = newPatients.findIndex(p => p.id === updated.id);
              if (idx !== -1) {
                  newPatients[idx] = updated;
              }
          });
          return newPatients;
      });
  };

  const handleDeletePatient = (patientId: string) => {
      setPatients(prev => prev.filter(p => p.id !== patientId));
      setAppointments(prev => prev.filter(a => a.patientId !== patientId));
      setSelectedPatientId(null);
  };

  const handlePatientSelectFromDashboard = (patientId: string) => {
      setSelectedPatientId(patientId);
      setActiveTab('patients');
  };

  const openNewPatientModal = () => {
      setEditingPatient(null);
      setIsPatientModalOpen(true);
  };

  const handleUpdateFieldSettings = (newSettings: FieldSettings) => {
      setFieldSettings(newSettings);
      if (!newSettings.branches.includes(currentBranch)) {
          setCurrentBranch(newSettings.branches[0] || 'Main Office');
      }
  };
  
  const handleUpdateAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => {
      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status } : a));
  };

  const handleCompleteRegistration = (patientId: string) => {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
          setEditingPatient(patient);
          setIsPatientModalOpen(true);
      }
  };

  // --- REPORT GENERATION (Business Intelligence) ---
  const handleGenerateReport = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // 1. Financials (YTD)
    const ytdCompleted = appointments.filter(a => 
        a.status === AppointmentStatus.COMPLETED && 
        new Date(a.date).getFullYear() === currentYear
    );
    
    const ytdRevenue = ytdCompleted.reduce((sum, apt) => {
        const proc = fieldSettings.procedures.find(p => p.name === apt.type);
        return sum + (proc?.price || 0);
    }, 0);

    // 2. Production Mix (By Procedure)
    const mix: Record<string, { count: number, revenue: number }> = {};
    ytdCompleted.forEach(apt => {
         const proc = fieldSettings.procedures.find(p => p.name === apt.type);
         const price = proc?.price || 0;
         if (!mix[apt.type]) {
             mix[apt.type] = { count: 0, revenue: 0 };
         }
         mix[apt.type].count++;
         mix[apt.type].revenue += price;
    });
    
    const mixList = Object.entries(mix)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .map(m => `- ${m.name.padEnd(25)} | Qty: ${m.count.toString().padEnd(4)} | Total: ₱${m.revenue.toLocaleString()}`)
      .join('\n');

    // 3. Efficiency Metrics (Utilization & No Show)
    const totalAppointments = appointments.length;
    const noShows = appointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;
    const noShowRate = totalAppointments > 0 ? ((noShows / totalAppointments) * 100).toFixed(1) : '0.0';
    
    // Utilization Estimate: (Booked Hours / Capacity)
    // Assume 8 hours/day capacity * 24 days/month = 192 hours/month per dentist
    // Simple Proxy: Average Appointments Per Day
    const uniqueDates = new Set(appointments.map(a => a.date)).size;
    const avgAptsPerDay = uniqueDates > 0 ? (totalAppointments / uniqueDates).toFixed(1) : '0';

    // 4. Demographics
    let males = 0, females = 0;
    patients.forEach(p => {
        if (p.sex === 'Male') males++;
        else if (p.sex === 'Female') females++;
    });
    const newPatientsCount = patients.filter(p => {
        // Simple heuristic: If ID starts with 'p_new_' or has recent lastDigitalUpdate
        return p.id.startsWith('p_new_') || (p.lastDigitalUpdate && new Date(p.lastDigitalUpdate).getFullYear() === currentYear);
    }).length;

    // BUILD PDF CONTENT
    const reportContent = `
%PDF-1.4
%DENT_SCHED_EXECUTIVE_REPORT
------------------------------------------------------------------
DENTAL PRACTICE EXECUTIVE REPORT (CONFIDENTIAL)
Generated: ${new Date().toLocaleString()}
By: ${currentUser.name}
------------------------------------------------------------------

1. FINANCIAL SNAPSHOT (YTD ${currentYear})
------------------------------------------
Total Revenue (Production):    ₱${ytdRevenue.toLocaleString()}
Total Visits (Completed):      ${ytdCompleted.length}
Avg Transaction Value:         ₱${ytdCompleted.length > 0 ? (ytdRevenue/ytdCompleted.length).toLocaleString(undefined, {maximumFractionDigits:0}) : 0}

2. PRACTICE EFFICIENCY
----------------------
No-Show Rate:                  ${noShowRate}%
Clinic Utilization:            ~${avgAptsPerDay} Appts / Day (Avg)
Total Appointments Logged:     ${totalAppointments}

3. PATIENT GROWTH & RETENTION
-----------------------------
Total Active Charts:           ${patients.length}
New Patients (This Year):      ${newPatientsCount}
Gender Ratio:                  ${males} Male / ${females} Female

4. PRODUCTION MIX (Top Revenue Drivers)
---------------------------------------
${mixList}

[End of Report]
------------------------------------------------------------------
    `;

    // Download
    const element = document.createElement("a");
    const file = new Blob([reportContent], {type: 'application/pdf'}); // Mock PDF mime type
    element.href = URL.createObjectURL(file);
    element.download = `Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
          appointments={branchAppointments} 
          allAppointments={appointments} // PASS ALL APPOINTMENTS FOR HQ MODE
          patientsCount={patients.length}
          staffCount={staff.length}
          staff={staff} 
          currentUser={currentUser}
          patients={patients}
          onAddPatient={openNewPatientModal}
          onPatientSelect={handlePatientSelectFromDashboard}
          onBookAppointment={(id) => handleOpenBooking(undefined, undefined, id)}
          onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
          onCompleteRegistration={handleCompleteRegistration}
          fieldSettings={fieldSettings}
          onViewAllSchedule={() => setActiveTab('schedule')} 
          tasks={tasks} 
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onChangeBranch={setCurrentBranch} // Allow branch switching from HQ mode
        />;
      case 'schedule':
        return <CalendarView 
          appointments={branchAppointments} 
          staff={staff} 
          onAddAppointment={handleOpenBooking}
          onMoveAppointment={handleMoveAppointment} 
          currentUser={currentUser}
          patients={patients}
          currentBranch={currentBranch} 
          fieldSettings={fieldSettings}
        />;
      case 'patients':
        return <PatientList 
          patients={patients} 
          appointments={appointments} 
          currentUser={currentUser}
          selectedPatientId={selectedPatientId}
          onSelectPatient={setSelectedPatientId}
          onAddPatient={openNewPatientModal}
          onEditPatient={handleEditPatientClick}
          onQuickUpdatePatient={handleQuickUpdatePatient}
          onBulkUpdatePatients={handleBulkUpdatePatients}
          onDeletePatient={handleDeletePatient}
          onBookAppointment={(id) => handleOpenBooking(undefined, undefined, id)}
          fieldSettings={fieldSettings} 
        />;
      case 'field-mgmt':
        if (currentUser.role !== UserRole.ADMIN) {
             return <Dashboard 
                appointments={branchAppointments} 
                allAppointments={appointments}
                patientsCount={patients.length}
                staffCount={staff.length}
                staff={staff}
                currentUser={currentUser}
                patients={patients}
                onAddPatient={openNewPatientModal}
                onPatientSelect={handlePatientSelectFromDashboard}
                onBookAppointment={(id) => handleOpenBooking(undefined, undefined, id)}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                onCompleteRegistration={handleCompleteRegistration}
                fieldSettings={fieldSettings}
                onViewAllSchedule={() => setActiveTab('schedule')}
                tasks={tasks}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onChangeBranch={setCurrentBranch}
              />;
        }
        return <FieldManagement 
          settings={fieldSettings}
          onUpdateSettings={handleUpdateFieldSettings}
        />;
      default:
        return <Dashboard 
          appointments={branchAppointments}
          allAppointments={appointments}
          patientsCount={patients.length}
          staffCount={staff.length}
          staff={staff}
          currentUser={currentUser}
          patients={patients}
          onAddPatient={openNewPatientModal}
          onPatientSelect={handlePatientSelectFromDashboard}
          onBookAppointment={(id) => handleOpenBooking(undefined, undefined, id)}
          onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
          onCompleteRegistration={handleCompleteRegistration}
          fieldSettings={fieldSettings}
          onViewAllSchedule={() => setActiveTab('schedule')}
          tasks={tasks}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onChangeBranch={setCurrentBranch}
        />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      onAddAppointment={() => handleOpenBooking()}
      currentUser={currentUser}
      onSwitchUser={handleSwitchUser}
      staff={staff}
      currentBranch={currentBranch}
      availableBranches={fieldSettings.branches}
      onChangeBranch={setCurrentBranch}
      fieldSettings={fieldSettings}
      onGenerateReport={handleGenerateReport}
      tasks={tasks} 
      onToggleTask={handleToggleTask} 
    >
      {renderContent()}

      <AppointmentModal 
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSave={handleSaveAppointment}
        onSavePatient={handleSavePatient}
        patients={patients}
        staff={staff}
        appointments={branchAppointments} 
        initialDate={bookingDate}
        initialTime={bookingTime}
        initialPatientId={initialBookingPatientId}
        existingAppointment={editingAppointment} 
        fieldSettings={fieldSettings}
      />

      <PatientRegistrationModal 
        isOpen={isPatientModalOpen}
        onClose={() => {
            setIsPatientModalOpen(false);
            setEditingPatient(null);
        }}
        onSave={handleSavePatient}
        readOnly={currentUser.role === 'Dental Assistant' && currentUser.isReadOnly} 
        initialData={editingPatient}
        fieldSettings={fieldSettings}
      />
    </Layout>
  );
}

export default App;
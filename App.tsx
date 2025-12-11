
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import PatientList from './components/PatientList';
import AppointmentModal from './components/AppointmentModal';
import PatientRegistrationModal from './components/PatientRegistrationModal';
import FieldManagement from './components/FieldManagement';
import KioskView from './components/KioskView';
import { STAFF, PATIENTS, APPOINTMENTS, DEFAULT_FIELD_SETTINGS } from './constants';
import { Appointment, User, Patient, FieldSettings, AppointmentType, UserRole, AppointmentStatus, PinboardTask } from './types';
import { useToast } from './components/ToastSystem';

// Increment this to force-clear user data and load the new dataset
const CURRENT_DATA_VERSION = 'stress_test_v2';

function App() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // INITIALIZATION WITH VERSION CHECK
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [fieldSettings, setFieldSettings] = useState<FieldSettings>(DEFAULT_FIELD_SETTINGS);
  const [tasks, setTasks] = useState<PinboardTask[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const savedVersion = localStorage.getItem('dentsched_data_version');
    
    if (savedVersion !== CURRENT_DATA_VERSION) {
        // FORCE REFRESH: Load constants and overwrite storage
        setAppointments(APPOINTMENTS);
        setPatients(PATIENTS);
        setStaff(STAFF);
        setFieldSettings(DEFAULT_FIELD_SETTINGS);
        setTasks([]);
        localStorage.setItem('dentsched_data_version', CURRENT_DATA_VERSION);
        console.log("App: Loaded new stress test dataset (v2)");
    } else {
        // LOAD SAVED: Check storage for each
        const sApts = localStorage.getItem('dentsched_appointments');
        const sPts = localStorage.getItem('dentsched_patients');
        const sStaff = localStorage.getItem('dentsched_staff');
        const sFields = localStorage.getItem('dentsched_fields');
        const sTasks = localStorage.getItem('dentsched_pinboard_tasks');

        if (sApts) setAppointments(JSON.parse(sApts));
        else setAppointments(APPOINTMENTS);

        if (sPts) setPatients(JSON.parse(sPts));
        else setPatients(PATIENTS);

        if (sStaff) setStaff(JSON.parse(sStaff));
        else setStaff(STAFF);

        if (sFields) setFieldSettings(JSON.parse(sFields));
        else setFieldSettings(DEFAULT_FIELD_SETTINGS);

        if (sTasks) setTasks(JSON.parse(sTasks));
    }
    setIsDataLoaded(true);
  }, []);

  // PERSISTENCE
  useEffect(() => {
    if (!isDataLoaded) return;
    localStorage.setItem('dentsched_appointments', JSON.stringify(appointments));
    localStorage.setItem('dentsched_patients', JSON.stringify(patients));
    localStorage.setItem('dentsched_staff', JSON.stringify(staff));
    localStorage.setItem('dentsched_fields', JSON.stringify(fieldSettings));
    localStorage.setItem('dentsched_pinboard_tasks', JSON.stringify(tasks));
  }, [appointments, patients, staff, fieldSettings, tasks, isDataLoaded]);

  // Auth State
  const [currentUser, setCurrentUser] = useState<User>(staff[0] || STAFF[0]); 

  // KIOSK MODE STATE
  const [isInKioskMode, setIsInKioskMode] = useState(false);

  // BRANCH STATE
  const [currentBranch, setCurrentBranch] = useState<string>('Makati Branch');

  useEffect(() => {
      if (staff.length > 0 && !currentUser.id) {
          setCurrentUser(staff[0]);
      }
  }, [staff]);

  const handleResetData = () => {
      if (window.confirm("This will wipe all changes and reload the original Stress Test Dataset. Proceed?")) {
          setAppointments(APPOINTMENTS);
          setPatients(PATIENTS);
          setFieldSettings(DEFAULT_FIELD_SETTINGS);
          setTasks([]);
          toast.success("Database Reset: Stress test data loaded.");
      }
  };

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

  // BRANCH LOGIC
  const branchAppointments = appointments.filter(a => a.branch === currentBranch);

  // MODAL STATES
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<string | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState<string | undefined>(undefined);
  const [initialBookingPatientId, setInitialBookingPatientId] = useState<string | undefined>(undefined);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const handleOpenBooking = (date?: string, time?: string, patientId?: string, appointmentToEdit?: Appointment) => {
    setBookingDate(date);
    setBookingTime(time);
    setInitialBookingPatientId(patientId);
    setEditingAppointment(appointmentToEdit || null);
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

  const handleMoveAppointment = (appointmentId: string, newDate: string, newTime: string, newProviderId: string) => {
      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, date: newDate, time: newTime, providerId: newProviderId } : a));
  };

  const handleSavePatient = (newPatientData: Partial<Patient>) => {
    if (editingPatient) {
        setPatients(prev => prev.map(p => p.id === newPatientData.id ? { ...p, ...newPatientData as Patient } : p));
        setEditingPatient(null);
    } else {
        const newPatient: Patient = {
            ...newPatientData as Patient,
            id: newPatientData.id || `p_${Date.now()}`,
            lastVisit: 'First Visit',
            nextVisit: null,
            notes: newPatientData.notes || ''
        };
        setPatients(prev => [...prev, newPatient]);
    }
  };

  const handleSwitchUser = (user: User) => {
      setCurrentUser(user);
      if (user.defaultBranch) setCurrentBranch(user.defaultBranch);
  };

  const handleGenerateReport = () => {
    toast.success("Executive report generated and downloaded.");
  };

  if (!isDataLoaded) return <div className="h-screen flex items-center justify-center font-bold text-teal-600">Initialising stress test data...</div>;

  if (isInKioskMode) {
      return <KioskView 
          patients={patients}
          appointments={appointments}
          onCheckIn={(id) => handleUpdateAppointmentStatus(id, AppointmentStatus.ARRIVED)}
          onUpdatePatient={handleQuickUpdatePatient}
          onExitKiosk={() => setIsInKioskMode(false)}
          fieldSettings={fieldSettings}
      />;
  }

  function handleQuickUpdatePatient(updatedPatient: Patient) {
      setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  }

  function handleUpdateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status } : a));
  }

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
      onEnterKioskMode={() => setIsInKioskMode(true)}
    >
      {activeTab === 'dashboard' && <Dashboard 
          appointments={branchAppointments} 
          patientsCount={patients.length}
          staffCount={staff.length}
          staff={staff} 
          currentUser={currentUser}
          patients={patients}
          onAddPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }}
          onPatientSelect={(id) => { setSelectedPatientId(id); setActiveTab('patients'); }}
          onBookAppointment={(id) => handleOpenBooking(undefined, undefined, id)}
          onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
          onCompleteRegistration={(id) => { setEditingPatient(patients.find(p => p.id === id) || null); setIsPatientModalOpen(true); }}
          fieldSettings={fieldSettings}
          onViewAllSchedule={() => setActiveTab('schedule')} 
          tasks={tasks} 
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
      />}
      {activeTab === 'schedule' && <CalendarView 
          appointments={branchAppointments} 
          staff={staff} 
          onAddAppointment={handleOpenBooking}
          onMoveAppointment={handleMoveAppointment} 
          currentUser={currentUser}
          patients={patients}
          currentBranch={currentBranch} 
          fieldSettings={fieldSettings}
      />}
      {activeTab === 'patients' && <PatientList 
          patients={patients} 
          appointments={appointments} 
          currentUser={currentUser}
          selectedPatientId={selectedPatientId}
          onSelectPatient={setSelectedPatientId}
          onAddPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }}
          onEditPatient={(p) => { setEditingPatient(p); setIsPatientModalOpen(true); }}
          onQuickUpdatePatient={handleQuickUpdatePatient}
          onDeletePatient={(id) => setPatients(prev => prev.filter(p => p.id !== id))}
          onBookAppointment={(id) => handleOpenBooking(undefined, undefined, id)}
          fieldSettings={fieldSettings} 
      />}
      {activeTab === 'field-mgmt' && <FieldManagement 
          settings={fieldSettings}
          onUpdateSettings={setFieldSettings}
          staff={staff}
          onUpdateStaff={setStaff}
          onResetData={handleResetData}
      />}

      <AppointmentModal 
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSave={handleSaveAppointment}
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
        onClose={() => setIsPatientModalOpen(false)}
        onSave={handleSavePatient}
        initialData={editingPatient}
        fieldSettings={fieldSettings}
      />
    </Layout>
  );
}

export default App;

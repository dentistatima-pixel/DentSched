import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import PatientList from './components/PatientList';
import AppointmentModal from './components/AppointmentModal';
import PatientRegistrationModal from './components/PatientRegistrationModal';
import FieldManagement from './components/FieldManagement';
import { STAFF, PATIENTS, APPOINTMENTS, DEFAULT_FIELD_SETTINGS } from './constants';
import { Appointment, User, Patient, FieldSettings, AppointmentType, UserRole, AppointmentStatus } from './types';

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
      // Merge defaults just in case features are missing from old storage
      const parsed = saved ? JSON.parse(saved) : DEFAULT_FIELD_SETTINGS;
      if (!parsed.features) {
          parsed.features = DEFAULT_FIELD_SETTINGS.features;
      }
      return parsed;
  });

  // Auth State
  // Defaulting to Administrator (Index 0 - Sarah Connor)
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

  const handleOpenBooking = (date?: string, time?: string, patientId?: string) => {
    setBookingDate(date);
    setBookingTime(time);
    setInitialBookingPatientId(patientId);
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
          appointments={branchAppointments} 
          patientsCount={patients.length}
          staffCount={staff.length}
          currentUser={currentUser}
          patients={patients}
          onAddPatient={openNewPatientModal}
          onPatientSelect={handlePatientSelectFromDashboard}
          onBookAppointment={(id) => handleOpenBooking(undefined, undefined, id)}
          onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
          onCompleteRegistration={handleCompleteRegistration}
          fieldSettings={fieldSettings}
          onViewAllSchedule={() => setActiveTab('schedule')} 
        />;
      case 'schedule':
        return <CalendarView 
          appointments={branchAppointments} 
          staff={staff} 
          onAddAppointment={handleOpenBooking}
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
                patientsCount={patients.length}
                staffCount={staff.length}
                currentUser={currentUser}
                patients={patients}
                onAddPatient={openNewPatientModal}
                onPatientSelect={handlePatientSelectFromDashboard}
                onBookAppointment={(id) => handleOpenBooking(undefined, undefined, id)}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                onCompleteRegistration={handleCompleteRegistration}
                fieldSettings={fieldSettings}
                onViewAllSchedule={() => setActiveTab('schedule')}
              />;
        }
        return <FieldManagement 
          settings={fieldSettings}
          onUpdateSettings={handleUpdateFieldSettings}
        />;
      default:
        return <Dashboard 
          appointments={branchAppointments}
          patientsCount={patients.length}
          staffCount={staff.length}
          currentUser={currentUser}
          patients={patients}
          onAddPatient={openNewPatientModal}
          onPatientSelect={handlePatientSelectFromDashboard}
          onBookAppointment={(id) => handleOpenBooking(undefined, undefined, id)}
          onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
          onCompleteRegistration={handleCompleteRegistration}
          fieldSettings={fieldSettings}
          onViewAllSchedule={() => setActiveTab('schedule')}
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
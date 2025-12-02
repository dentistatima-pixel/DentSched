
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import PatientList from './components/PatientList';
import AppointmentModal from './components/AppointmentModal';
import PatientRegistrationModal from './components/PatientRegistrationModal';
import FieldManagement from './components/FieldManagement';
import { STAFF, PATIENTS, APPOINTMENTS } from './constants';
import { Appointment, User, Patient, FieldSettings, AppointmentType, UserRole } from './types';

// Initial defaults based on current Enums and Constants
const DEFAULT_FIELD_SETTINGS: FieldSettings = {
  suffixes: ['Mr', 'Ms', 'Mrs', 'Dr', 'Engr', 'Atty', 'Ph.D'],
  civilStatus: ['Single', 'Married', 'Widowed', 'Separated', 'Divorced'],
  insuranceProviders: ['Maxicare', 'Intellicare', 'PhilHealth', 'Medicard', 'Etiqa', 'Pacific Cross'],
  bloodGroups: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
  allergies: ['Penicillin', 'Latex', 'Peanuts', 'Seafood', 'Aspirin', 'Sulfa', 'Local Anesthetic', 'Dust Mites'],
  medicalConditions: [
    'High BP', 'Low BP', 'Diabetes', 'Asthma', 'Heart Disease', 'Stroke', 
    'Epilepsy', 'Arthritis', 'Kidney Issues', 'Liver Disease', 'Thyroid Issues',
    'Anemia', 'Ulcers', 'Hepatitis', 'TB'
  ],
  procedures: Object.values(AppointmentType), // Default to enum values
  branches: ['Makati Branch', 'Quezon City Branch', 'BGC Branch', 'Alabang Branch']
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // PERSISTENCE & INITIALIZATION
  // Load initial state from local storage if available, else use constants
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('dentsched_appointments');
    return saved ? JSON.parse(saved) : APPOINTMENTS;
  });

  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('dentsched_patients');
    return saved ? JSON.parse(saved) : PATIENTS;
  });

  // Convert STAFF constant to state so profile edits persist
  const [staff, setStaff] = useState<User[]>(() => {
    const saved = localStorage.getItem('dentsched_staff');
    return saved ? JSON.parse(saved) : STAFF;
  });
  
  // NEW: Field Settings State
  const [fieldSettings, setFieldSettings] = useState<FieldSettings>(() => {
      const saved = localStorage.getItem('dentsched_fields');
      return saved ? JSON.parse(saved) : DEFAULT_FIELD_SETTINGS;
  });

  // Auth State (Defaulting to first Admin for demo)
  const [currentUser, setCurrentUser] = useState<User>(staff[0]);

  // Appointment Modal State
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<string | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState<string | undefined>(undefined);
  const [initialBookingPatientId, setInitialBookingPatientId] = useState<string | undefined>(undefined);

  // Patient Registration Modal State
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Navigation State (Lifted from PatientList)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('dentsched_appointments', JSON.stringify(appointments));
    localStorage.setItem('dentsched_patients', JSON.stringify(patients));
    localStorage.setItem('dentsched_staff', JSON.stringify(staff));
    localStorage.setItem('dentsched_fields', JSON.stringify(fieldSettings));
  }, [appointments, patients, staff, fieldSettings]);

  // Ensure currentUser reflects updates in staff list if they edit their own profile
  useEffect(() => {
    const updatedUser = staff.find(s => s.id === currentUser.id);
    if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(updatedUser);
    }
  }, [staff, currentUser.id]);

  const handleOpenBooking = (date?: string, time?: string, patientId?: string) => {
    setBookingDate(date);
    setBookingTime(time);
    setInitialBookingPatientId(patientId);
    setIsAppointmentModalOpen(true);
  };

  const handleSaveAppointment = (newAppointment: Appointment) => {
    // Check if updating existing
    setAppointments(prev => {
        const existingIndex = prev.findIndex(a => a.id === newAppointment.id);
        if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = newAppointment;
            return updated;
        } else {
            return [...prev, newAppointment];
        }
    });
  };

  const handleSavePatient = (newPatientData: Partial<Patient>) => {
    if (editingPatient) {
        // UPDATE EXISTING PATIENT (From Modal)
        setPatients(prev => prev.map(p => p.id === newPatientData.id ? { ...p, ...newPatientData as Patient } : p));
        setEditingPatient(null);
    } else {
        // CREATE NEW PATIENT
        const newPatient: Patient = {
            ...newPatientData as Patient,
            id: newPatientData.id || `p_new_${Date.now()}`, // Use generated ID or fallback
            lastVisit: 'First Visit',
            nextVisit: null,
            notes: newPatientData.notes || ''
        };
        setPatients(prev => [...prev, newPatient]);
        // Auto-select the new patient and switch to list if NOT provisional/lite
        if (!newPatient.provisional) {
            setSelectedPatientId(newPatient.id);
            setActiveTab('patients');
        }
    }
  };

  // Profile Update Handler (Updates Staff List)
  const handleSwitchUser = (userOrUpdatedUser: User) => {
      // Check if this is an update to an existing user
      const existingIndex = staff.findIndex(s => s.id === userOrUpdatedUser.id);
      if (existingIndex >= 0) {
          // Update the staff list
          const newStaff = [...staff];
          newStaff[existingIndex] = userOrUpdatedUser;
          setStaff(newStaff);
      }
      
      // Set as current user
      setCurrentUser(userOrUpdatedUser);
      
      // If user is not admin but currently on field-mgmt, redirect to dashboard
      if (userOrUpdatedUser.role !== UserRole.ADMIN && activeTab === 'field-mgmt') {
          setActiveTab('dashboard');
      }
  };

  // Opens the modal for full editing
  const handleEditPatientClick = (patient: Patient) => {
      setEditingPatient(patient);
      setIsPatientModalOpen(true);
  };

  // Updates patient data DIRECTLY without opening the modal (for Odontogram, Verification, etc.)
  const handleQuickUpdatePatient = (updatedPatient: Patient) => {
      setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const handleDeletePatient = (patientId: string) => {
      // 1. Delete Patient
      setPatients(prev => prev.filter(p => p.id !== patientId));
      
      // 2. Delete Associated Appointments (Fix Ghost Appointment Bug)
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
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
          appointments={appointments} 
          patientsCount={patients.length}
          staffCount={staff.length}
          currentUser={currentUser}
          patients={patients}
          onAddPatient={openNewPatientModal}
          onPatientSelect={handlePatientSelectFromDashboard}
          onBookAppointment={(id) => handleOpenBooking(undefined, undefined, id)}
        />;
      case 'schedule':
        return <CalendarView 
          appointments={appointments} 
          staff={staff} 
          onAddAppointment={handleOpenBooking}
          currentUser={currentUser}
          patients={patients}
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
          onDeletePatient={handleDeletePatient}
          onBookAppointment={(id) => handleOpenBooking(undefined, undefined, id)}
        />;
      case 'field-mgmt':
        // SECURITY CHECK: Only Admin can access
        if (currentUser.role !== UserRole.ADMIN) {
             return <Dashboard 
                appointments={appointments} 
                patientsCount={patients.length}
                staffCount={staff.length}
                currentUser={currentUser}
                patients={patients}
                onAddPatient={openNewPatientModal}
                onPatientSelect={handlePatientSelectFromDashboard}
                onBookAppointment={(id) => handleOpenBooking(undefined, undefined, id)}
              />;
        }
        return <FieldManagement 
          settings={fieldSettings}
          onUpdateSettings={handleUpdateFieldSettings}
        />;
      default:
        return <Dashboard 
          appointments={appointments}
          patientsCount={patients.length}
          staffCount={staff.length}
          currentUser={currentUser}
          patients={patients}
          onAddPatient={openNewPatientModal}
          onPatientSelect={handlePatientSelectFromDashboard}
          onBookAppointment={(id) => handleOpenBooking(undefined, undefined, id)}
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
      appointments={appointments}
      patients={patients}
    >
      {renderContent()}

      <AppointmentModal 
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSave={handleSaveAppointment}
        onSavePatient={handleSavePatient}
        patients={patients}
        staff={staff}
        appointments={appointments}
        initialDate={bookingDate}
        initialTime={bookingTime}
        initialPatientId={initialBookingPatientId}
        fieldSettings={fieldSettings} // NEW
      />

      <PatientRegistrationModal 
        isOpen={isPatientModalOpen}
        onClose={() => {
            setIsPatientModalOpen(false);
            setEditingPatient(null);
        }}
        onSave={handleSavePatient}
        readOnly={currentUser.role === 'Hygienist'}
        initialData={editingPatient}
        fieldSettings={fieldSettings} // NEW
      />
    </Layout>
  );
}

export default App;


import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import PatientList from './components/PatientList';
import AppointmentModal from './components/AppointmentModal';
import PatientRegistrationModal from './components/PatientRegistrationModal';
import { STAFF, PATIENTS, APPOINTMENTS } from './constants';
import { Appointment, User, Patient } from './types';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appointments, setAppointments] = useState<Appointment[]>(APPOINTMENTS);
  const [patients, setPatients] = useState<Patient[]>(PATIENTS);
  
  // Auth State (Defaulting to first Admin for demo)
  const [currentUser, setCurrentUser] = useState<User>(STAFF[0]);

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

  // Force sync with constants on mount to ensure hot-reload picks up data changes
  useEffect(() => {
    setPatients(PATIENTS);
    setAppointments(APPOINTMENTS);
  }, []);

  const handleOpenBooking = (date?: string, time?: string, patientId?: string) => {
    setBookingDate(date);
    setBookingTime(time);
    setInitialBookingPatientId(patientId);
    setIsAppointmentModalOpen(true);
  };

  const handleSaveAppointment = (newAppointment: Appointment) => {
    // Check if updating existing
    const existingIndex = appointments.findIndex(a => a.id === newAppointment.id);
    if (existingIndex >= 0) {
        const updated = [...appointments];
        updated[existingIndex] = newAppointment;
        setAppointments(updated);
    } else {
        setAppointments([...appointments, newAppointment]);
    }
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
      setPatients(prev => prev.filter(p => p.id !== patientId));
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
          appointments={appointments} 
          patientsCount={patients.length}
          staffCount={STAFF.length}
          currentUser={currentUser}
          patients={patients}
          onAddPatient={openNewPatientModal}
          onPatientSelect={handlePatientSelectFromDashboard}
          onBookAppointment={(id) => handleOpenBooking(undefined, undefined, id)}
        />;
      case 'schedule':
        return <CalendarView 
          appointments={appointments} 
          staff={STAFF} 
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
      default:
        return <Dashboard 
          appointments={appointments}
          patientsCount={patients.length}
          staffCount={STAFF.length}
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
      onSwitchUser={setCurrentUser}
      staff={STAFF}
    >
      {renderContent()}

      <AppointmentModal 
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSave={handleSaveAppointment}
        onSavePatient={handleSavePatient}
        patients={patients}
        staff={STAFF}
        initialDate={bookingDate}
        initialTime={bookingTime}
        initialPatientId={initialBookingPatientId}
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
      />
    </Layout>
  );
}

export default App;

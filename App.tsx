import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import PatientRegistryManager from './components/PatientRegistryManager';
import PatientDetailView from './components/PatientDetailView';
import PatientAppointmentsView from './components/PatientAppointmentsView';
import { AppointmentModal } from './components/AppointmentModal';
import PatientRegistrationModal from './components/PatientRegistrationModal';
import FieldManagement from './components/FieldManagement';
import KioskView from './components/KioskView';
import Inventory from './components/Inventory';
import Financials from './components/Financials';
import AdminHub from './components/AdminHub';
import PostOpHandoverModal from './components/PostOpHandoverModal';
import SafetyTimeoutModal from './components/SafetyTimeoutModal';
import QuickTriageModal from './components/QuickTriageModal';
import QuickAddPatientModal from './components/QuickAddPatientModal';
import RecallCenter from './components/RecallCenter';
import ReferralManager from './components/ReferralManager';
import { useStore } from './store';
import { AppointmentStatus, SystemStatus, AppNotification } from './types';
import { useToast } from './components/ToastSystem';
import { Lock, ShieldAlert, X } from 'lucide-react';

const GHOST_LOG_KEY = '_ds_ext_sys_0x1';

function App() {
  const toast = useToast();
  const state = useStore();
  const {
    isAuthenticated,
    loadSecureData,
    handleSwitchUser,
    handleSaveAppointment,
    handleSavePatient,
    handleSaveQuickAddPatient,
    handleQuickQueue,
    handleUpdateAppointmentStatus,
    handleQuickUpdatePatient,
    handleUpdatePhilHealthClaim,
    handleUpdateSettings,
    handleUpdateStock,
    handleAddCycle,
    handleToggleTask,
    handleSetSyncConflicts,
    handleSaveIncident,
    handleSaveReferral,
    handleSaveCashSession,
    handleSaveReconciliation,
    handlePerformTransfer,
    handleUpdatePayrollPeriod,
    handleAddPayrollAdjustment,
    handleApproveAdjustment,
    handleAddCommissionDispute,
    handleResolveCommissionDispute,
    handleUpdatePatientRecall,
    handleInstallApp,
    handleStartImpersonating,
    handleStopImpersonating,
  } = useStore.getState();

  const {
    appointments,
    patients,
    staff,
    stock,
    sterilizationCycles,
    fieldSettings,
    tasks,
    auditLog,
    isAuditLogVerified,
    incidents,
    referrals,
    reconciliations,
    cashSessions,
    transfers,
    payrollPeriods,
    payrollAdjustments,
    commissionDisputes,
    hmoClaims,
    philHealthClaims,
    isSessionLocked,
    currentUser,
    originalUser,
    isInKioskMode,
    currentBranch,
    isOnline,
    offlineQueue,
    systemStatus,
    deferredPrompt,
    encryptionKey,
    syncConflicts
  } = useStore();

  const activeTab = useStore(s => s.activeTab);
  const setActiveTab = useStore(s => s.setActiveTab);
  const selectedPatientId = useStore(s => s.selectedPatientId);
  const setSelectedPatientId = useStore(s => s.setSelectedPatientId);

  const [showTamperAlert, setShowTamperAlert] = useState(false);

  // Modal States - kept local as they are transient UI state
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isReconciliationMode, setIsReconciliationMode] = useState(false);
  const [isQuickTriageModalOpen, setIsQuickTriageModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<string | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState<string | undefined>(undefined);
  const [initialBookingPatientId, setInitialBookingPatientId] = useState<string | undefined>(undefined);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isQuickAddPatientModalOpen, setIsQuickAddPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any | null>(null);
  const [pendingPostOpAppointment, setPendingPostOpAppointment] = useState<any | null>(null);
  const [pendingSafetyTimeout, setPendingSafetyTimeout] = useState<{ appointmentId: string, status: AppointmentStatus, patient: any } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTimelineDrawerOpen, setIsTimelineDrawerOpen] = useState(false);


  useEffect(() => {
    if (isAuthenticated && encryptionKey) {
      loadSecureData();
      try {
        const shadowLogs = JSON.parse(localStorage.getItem(GHOST_LOG_KEY) || '[]');
        if (shadowLogs.length > 0 && auditLog.length === 0) {
            setShowTamperAlert(true);
            toast.error("NPC SECURITY BREACH: Primary audit log wiped while forensic shadow exists.");
        }
      } catch (e) { console.error("Integrity check failed"); }
    }
  }, [isAuthenticated, encryptionKey, loadSecureData, toast, auditLog]);

  const notifications = useMemo((): AppNotification[] => {
    const items: AppNotification[] = [];
    const now = new Date();
    if (syncConflicts.length > 0) {
      items.push({ id: 'sync', type: 'critical', icon: X, title: `${syncConflicts.length} Sync Conflicts`, description: 'Offline data conflicts require manual resolution.', timestamp: now.toISOString(), actionType: 'navigate', payload: { tab: 'admin' } });
    }
    const downtimeEntries = appointments.filter(a => a.entryMode === 'MANUAL' && !a.reconciled);
    if (downtimeEntries.length > 0) {
      items.push({ id: 'downtime', type: 'critical', icon: X, title: `${downtimeEntries.length} Downtime Entries`, description: 'Manual entries need verification and reconciliation.', timestamp: now.toISOString(), actionType: 'navigate', payload: { tab: 'dashboard' } });
    }
    staff.forEach(s => {
      if (s.prcExpiry && new Date(s.prcExpiry) < now) {
        const daysLeft = (new Date(s.prcExpiry).getTime() - now.getTime()) / (1000 * 3600 * 24);
        if (daysLeft < 30) {
          items.push({ id: `prc_${s.id}`, type: 'critical', icon: X, title: 'License Expiring', description: `${s.name}'s PRC license expires in ${Math.ceil(daysLeft)} days.`, timestamp: now.toISOString(), actionType: 'modal', payload: { modal: 'userProfile', entityId: s.id } });
        }
      }
    });
    const medHistoryNeeded = appointments.filter(a => a.status === AppointmentStatus.ARRIVED && !a.medHistoryVerified);
    if (medHistoryNeeded.length > 0) {
      items.push({ id: 'med_history', type: 'action', icon: X, title: 'Medical History', description: `${medHistoryNeeded.length} arrived patients need medical history verification.`, timestamp: now.toISOString(), actionType: 'navigate', payload: { tab: 'dashboard' } });
    }
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600000).toISOString();
    const postOpPatients = appointments.filter(a => ['Surgery', 'Extraction'].includes(a.type) && a.status === AppointmentStatus.COMPLETED && a.date >= twentyFourHoursAgo.split('T')[0] && !a.followUpConfirmed);
    if (postOpPatients.length > 0) {
      items.push({ id: 'post_op', type: 'action', icon: X, title: 'Post-Op Follow-Up', description: `${postOpPatients.length} surgical patients require follow-up calls.`, timestamp: now.toISOString(), actionType: 'navigate', payload: { tab: 'dashboard' } });
    }
    return items;
  }, [appointments, staff, syncConflicts]);

  const handleNotificationClick = (notification: AppNotification) => {
    if (notification.actionType === 'navigate' && notification.payload.tab) {
      setActiveTab(notification.payload.tab);
    }
    if (notification.actionType === 'modal' && notification.payload.modal === 'userProfile') {
      setIsProfileOpen(true);
    }
  };
  
  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);

  const effectiveUser = useMemo(() => ({
    ...currentUser,
    isReadOnly: false
  }), [currentUser]);
  
  const handleOpenReconciliationModal = (id: string) => {
    const apt = appointments.find(a => a.id === id);
    if (apt) {
        setEditingAppointment(apt);
        setIsReconciliationMode(true);
        setIsAppointmentModalOpen(true);
    }
  };
  
  const handleNavigateToPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('patients');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard 
          appointments={appointments} 
          allAppointments={appointments} 
          patientsCount={patients.length} 
          staffCount={staff.length} 
          staff={staff} 
          currentUser={effectiveUser} 
          patients={patients} 
          onAddPatient={() => setIsQuickAddPatientModalOpen(true)} 
          onPatientSelect={handleNavigateToPatient} 
          onAddAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }} 
          onUpdateAppointmentStatus={handleUpdateAppointmentStatus} 
          onCompleteRegistration={(id) => { const p = patients.find(pt => pt.id === id); if (p) { setEditingPatient(p); setIsPatientModalOpen(true); }}} 
          fieldSettings={fieldSettings} 
          tasks={tasks} 
          currentBranch={currentBranch} 
          syncConflicts={syncConflicts} 
          systemStatus={systemStatus} 
          onVerifyDowntimeEntry={handleOpenReconciliationModal} 
          onVerifyMedHistory={(id) => useStore.getState().verifyMedHistory(id)}
          onConfirmFollowUp={(id) => useStore.getState().confirmFollowUp(id)}
          onQuickQueue={() => setIsQuickTriageModalOpen(true)} />;
      case 'schedule': return <CalendarView appointments={appointments.filter(a => a.branch === currentBranch)} staff={staff} onAddAppointment={(d, t, pid, apt) => { setBookingDate(d); setBookingTime(t); setInitialBookingPatientId(pid); setEditingAppointment(apt || null); setIsAppointmentModalOpen(true); }} onMoveAppointment={(id, d, t, pr) => { const newApts = appointments.map(a => a.id === id ? { ...a, date: d, time: t, providerId: pr } : a); useStore.setState({ appointments: newApts }); }} onUpdateAppointmentStatus={handleUpdateAppointmentStatus} onPatientSelect={handleNavigateToPatient} currentUser={effectiveUser} patients={patients} currentBranch={currentBranch} fieldSettings={fieldSettings} />;
      case 'patients': 
        return (
          <div className="h-full bg-slate-50 relative overflow-hidden flex flex-col">
            {selectedPatientId ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                    <PatientDetailView
                        patient={selectedPatient}
                        appointments={appointments}
                        staff={staff}
                        currentUser={effectiveUser}
                        onQuickUpdatePatient={handleQuickUpdatePatient}
                        onBookAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }}
                        onEditPatient={(p: any) => { setEditingPatient(p); setIsPatientModalOpen(true); }}
                        fieldSettings={fieldSettings}
                        logAction={useStore.getState().logAction}
                        incidents={incidents.filter(i => i.patientId === selectedPatientId)}
                        onSaveIncident={handleSaveIncident}
                        referrals={referrals.filter(r => r.patientId === selectedPatientId)}
                        onSaveReferral={handleSaveReferral}
                        onToggleTimeline={() => setIsTimelineDrawerOpen(!isTimelineDrawerOpen)}
                        onBack={() => setSelectedPatientId(null)}
                    />
                    
                    <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-[100] transform transition-transform duration-500 ease-in-out border-l border-slate-200 flex flex-col ${isTimelineDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        <PatientAppointmentsView
                            patient={selectedPatient}
                            appointments={appointments}
                            onBookAppointment={(id) => { setInitialBookingPatientId(id); setIsAppointmentModalOpen(true); }}
                            onSelectAppointment={(apt) => { setEditingAppointment(apt); setIsAppointmentModalOpen(true); }}
                        />
                    </div>
                </div>
            ) : (
                <PatientRegistryManager
                    patients={patients}
                    appointments={appointments}
                    onSelectPatient={setSelectedPatientId}
                    onAddPatient={() => setIsQuickAddPatientModalOpen(true)}
                    onBookAppointment={() => { setInitialBookingPatientId(undefined); setIsAppointmentModalOpen(true); }}
                    fieldSettings={fieldSettings}
                />
            )}
          </div>
        );
      case 'admin': return <AdminHub onNavigate={(tab) => setActiveTab(tab)} />;
      case 'referrals': return <ReferralManager patients={patients} referrals={referrals} onSaveReferral={handleSaveReferral} staff={staff} />;
      case 'recall': return <RecallCenter patients={patients} onUpdatePatientRecall={handleUpdatePatientRecall} />;
      case 'inventory': return <Inventory stock={stock} onUpdateStock={handleUpdateStock} currentUser={effectiveUser} sterilizationCycles={sterilizationCycles} onAddCycle={handleAddCycle} currentBranch={currentBranch} availableBranches={fieldSettings.branches} transfers={transfers} onPerformTransfer={handlePerformTransfer} fieldSettings={fieldSettings} onUpdateSettings={handleUpdateSettings} appointments={appointments} logAction={useStore.getState().logAction} />;
      case 'financials': return <Financials claims={hmoClaims} expenses={[]} philHealthClaims={philHealthClaims} currentUser={effectiveUser} appointments={appointments} patients={patients} fieldSettings={fieldSettings} staff={staff} reconciliations={reconciliations} onSaveReconciliation={handleSaveReconciliation} onSaveCashSession={handleSaveCashSession} currentBranch={currentBranch} payrollPeriods={payrollPeriods} payrollAdjustments={payrollAdjustments} commissionDisputes={commissionDisputes} onUpdatePayrollPeriod={handleUpdatePayrollPeriod} onAddPayrollAdjustment={handleAddPayrollAdjustment} onApproveAdjustment={handleApproveAdjustment} onAddCommissionDispute={handleAddCommissionDispute} onResolveCommissionDispute={handleResolveCommissionDispute} onUpdatePhilHealthClaim={handleUpdatePhilHealthClaim} />;
      case 'field-mgmt': return <FieldManagement settings={fieldSettings} onUpdateSettings={handleUpdateSettings} staff={staff} auditLog={auditLog} patients={patients} onPurgePatient={() => {}} auditLogVerified={isAuditLogVerified} encryptionKey={encryptionKey} incidents={incidents} onSaveIncident={() => {}} appointments={appointments} currentUser={currentUser} onStartImpersonating={handleStartImpersonating} />;
      default: return null;
    }
  };

  return (
    <div className={isInKioskMode ? "kiosk-mode h-full" : "h-full"}>
        <Layout 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onAddAppointment={() => setIsAppointmentModalOpen(true)}
          currentUser={effectiveUser} 
          onSwitchUser={handleSwitchUser} 
          staff={staff} 
          currentBranch={currentBranch} 
          availableBranches={fieldSettings.branches} 
          onChangeBranch={(branch) => useStore.setState({ currentBranch: branch })} 
          fieldSettings={fieldSettings} 
          onGenerateReport={() => {}} 
          tasks={tasks} 
          onToggleTask={handleToggleTask} 
          onEnterKioskMode={() => useStore.setState({ isInKioskMode: true })}
          isOnline={isOnline}
          pendingSyncCount={offlineQueue.length}
          systemStatus={systemStatus}
          onSwitchSystemStatus={useStore.getState().setSystemStatus}
          installable={!!deferredPrompt}
          onInstall={handleInstallApp}
          impersonatingUser={originalUser}
          onStopImpersonating={handleStopImpersonating}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          isProfileOpen={isProfileOpen}
          onOpenProfile={() => setIsProfileOpen(true)}
          onCloseProfile={() => setIsProfileOpen(false)}
        >
        {showTamperAlert && (
            <div className="fixed top-0 left-0 right-0 z-[1000] bg-black text-red-50 p-4 flex items-center justify-center gap-4 animate-in slide-in-from-top-full duration-1000">
                <ShieldAlert size={32} className="animate-pulse" />
                <div className="text-center">
                    <h2 className="text-xl font-black uppercase tracking-tighter">NPC SECURITY ALERT: SYSTEM INTEGRITY VIOLATION</h2>
                    <p className="text-xs font-bold text-red-400">Primary audit log wiped while forensic shadow logs remain. Mandatory 72-hour NPC reporting protocol active.</p>
                </div>
                <button onClick={() => setShowTamperAlert(false)} className="bg-red-500 text-black px-4 py-1 rounded font-black">Dismiss</button>
            </div>
        )}
        
        {renderContent()}

        <QuickAddPatientModal
            isOpen={isQuickAddPatientModalOpen}
            onClose={() => setIsQuickAddPatientModalOpen(false)}
            onSave={handleSaveQuickAddPatient}
        />

        {isAppointmentModalOpen && (
            <AppointmentModal 
                isOpen={isAppointmentModalOpen} 
                onClose={() => {setIsAppointmentModalOpen(false); setIsReconciliationMode(false);}} 
                patients={patients} 
                staff={staff} 
                appointments={appointments} 
                onSave={handleSaveAppointment}
                onSavePatient={handleSavePatient}
                initialDate={bookingDate}
                initialTime={bookingTime}
                initialPatientId={initialBookingPatientId}
                existingAppointment={editingAppointment}
                fieldSettings={fieldSettings}
                sterilizationCycles={sterilizationCycles}
                isDowntime={systemStatus === SystemStatus.DOWNTIME}
            />
        )}

        {isPatientModalOpen && (
            <PatientRegistrationModal 
                isOpen={isPatientModalOpen} 
                onClose={() => setIsPatientModalOpen(false)} 
                onSave={handleSavePatient}
                initialData={editingPatient}
                fieldSettings={fieldSettings}
                patients={patients}
            />
        )}

        {isQuickTriageModalOpen && (
            <QuickTriageModal
                isOpen={isQuickTriageModalOpen}
                onClose={() => setIsQuickTriageModalOpen(false)}
                onSave={handleQuickQueue}
            />
        )}

        {pendingPostOpAppointment && (
            <PostOpHandoverModal 
                isOpen={!!pendingPostOpAppointment} 
                appointment={pendingPostOpAppointment} 
                onConfirm={async () => {
                    if (pendingPostOpAppointment) {
                        useStore.getState().confirmPostOp(pendingPostOpAppointment.id);
                        setPendingPostOpAppointment(null);
                    }
                }}
                onClose={() => setPendingPostOpAppointment(null)} 
            />
        )}

        {pendingSafetyTimeout && (
            <SafetyTimeoutModal 
                patient={pendingSafetyTimeout.patient} 
                onConfirm={() => {
                  handleUpdateAppointmentStatus(pendingSafetyTimeout.appointmentId, pendingSafetyTimeout.status);
                  setPendingSafetyTimeout(null);
                }} 
            />
        )}

        {isSessionLocked && (
            <div className="fixed inset-0 z-[300] bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-3xl p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto"><Lock size={40}/></div>
                    <h2 className="text-2xl font-black uppercase">Session Locked</h2>
                    <p className="text-slate-500">System locked due to inactivity. Enter your security credentials to resume.</p>
                    <button onClick={() => useStore.setState({ isSessionLocked: false })} className="w-full py-4 bg-teal-600 text-white font-black rounded-xl uppercase">Unlock</button>
                </div>
            </div>
        )}

        {isInKioskMode && (
            <KioskView 
                patients={patients} 
                onUpdatePatient={handleSavePatient} 
                onExitKiosk={() => useStore.setState({ isInKioskMode: false })} 
                fieldSettings={fieldSettings}
                logAction={useStore.getState().logAction}
            />
        )}

        </Layout>
    </div>
  );
}

export default App;
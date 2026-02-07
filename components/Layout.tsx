
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
    Calendar, Users, LayoutDashboard, Menu, X, PlusCircle, ChevronDown, UserCircle, 
    Settings, Sliders, MapPin, FileText, Download, ClipboardCheck, CheckCircle, Circle, 
    Flag, Monitor, Package, DollarSign, CloudOff, Cloud, RefreshCcw, AlertTriangle, 
    ShieldAlert, Shield, ShieldCheck, Lock, Bell, Smartphone, Users2, StickyNote, 
    Send, CheckSquare, Plus, Power, PowerOff, LogOut, Inbox, Trash2, Link as LinkIcon, User as UserIcon,
    Sun, Moon, Search, HelpCircle
} from 'lucide-react';
import { useModal } from '../contexts/ModalContext';
import { UserRole, SystemStatus, AppNotification, Patient } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { useStaff } from '../contexts/StaffContext';
import { useSettings } from '../contexts/SettingsContext';
import { useClinicalOps } from '../contexts/ClinicalOpsContext';
import { useRouter, useNavigate } from '../contexts/RouterContext';
import { useAuthorization } from '../hooks/useAuthorization';
import { usePatient } from '../contexts/PatientContext';
import { CommandBar } from './CommandBar';
import { useAppointments } from '../contexts/AppointmentContext';
import { useFinancials } from '../contexts/FinancialContext';
import { ErrorBoundary } from './ErrorBoundary';


interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children
}) => {
  const { showModal } = useModal();
  const { route } = useRouter();
  const navigate = useNavigate();
  const activeTab = route.path;
  const { can } = useAuthorization();

  const { 
    currentUser, isOnline, systemStatus, setSystemStatus, originalUser: impersonatingUser, 
    handleStopImpersonating, logout: handleLogout,
    currentBranch, setCurrentBranch, isAuthorityLocked, setIsInKioskMode,
    theme, toggleTheme,
    syncQueueCount, isSyncing,
  } = useAppContext();
  const { staff, handleSaveStaff } = useStaff();
  const { patients } = usePatient();
  const { appointments, handleSaveAppointment } = useAppointments();
  const { fieldSettings } = useSettings();
  const { tasks, handleAddTask, handleToggleTask, handleClearCompletedTasks, handleAddToWaitlist } = useClinicalOps();
  const { handleStartCashSession, handleCloseCashSession, cashSessions } = useFinancials();
  
  const [isTaskPopoverOpen, setIsTaskPopoverOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showDowntimeConfirm, setShowDowntimeConfirm] = useState(false);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  
  // New Pinboard State
  const [pinboardTab, setPinboardTab] = useState<'inbox' | 'sent'>('inbox');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskUrgent, setNewTaskUrgent] = useState(false);
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskPatientId, setNewTaskPatientId] = useState<string | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const taskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
        setNewTaskAssignee(currentUser.id);
    }
  }, [currentUser]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandBarOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        showModal('shortcutHelp');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  if (!currentUser) return null;

  const patientSearchResults = useMemo(() => {
    if (!patientSearch) return [];
    return patients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase())).slice(0, 3);
  }, [patientSearch, patients]);
  
  const features = fieldSettings?.features;
  const enableMultiBranch = features?.enableMultiBranch ?? true;
  
  const isDowntime = systemStatus === SystemStatus.DOWNTIME;

  const userAllowedBranches = can('manage:admin')
      ? (fieldSettings?.branches || []) 
      : (currentUser.allowedBranches && currentUser.allowedBranches.length > 0)
          ? currentUser.allowedBranches
          : (fieldSettings?.branches || []);

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, visible: true },
    { id: 'schedule', label: 'Calendar', icon: Calendar, visible: true },
    { id: 'patients', label: 'Registry', icon: Users, visible: true },
    { id: 'admin', label: 'Control', icon: Sliders, visible: can('manage:admin') },
  ].filter(item => item.visible);

  const myActiveTasks = tasks ? tasks.filter(t => t.assignedTo === currentUser.id && !t.isCompleted) : [];
  const branchColor = fieldSettings?.branchColors?.[currentBranch] || '#134e4a';

  const headerClass = isDowntime 
    ? "h-24 bg-amber-500 text-white flex items-center justify-between px-8 shadow-md z-50 sticky top-0 shrink-0 border-b-4 border-black/20"
    : "h-24 backdrop-blur-xl text-white flex items-center justify-between px-8 shadow-2xl z-50 sticky top-0 shrink-0 border-b border-black/20 dark:border-white/10 transition-all duration-500";

  const confirmDowntime = () => {
    setSystemStatus(SystemStatus.DOWNTIME);
    setShowDowntimeConfirm(false);
  };

  const handleAddNewTask = () => {
    if (handleAddTask && newTaskText.trim()) {
      handleAddTask(newTaskText, newTaskUrgent, newTaskAssignee, newTaskPatientId || undefined);
      setNewTaskText('');
      setNewTaskUrgent(false);
      setNewTaskPatientId(null);
      setPatientSearch('');
      taskInputRef.current?.focus();
    }
  };
  
  const openProfile = () => {
    setIsUserMenuOpen(false);
    showModal('userProfile', { user: currentUser, onSave: handleSaveStaff });
  };
  
  const inboxTasks = useMemo(() => tasks.filter(t => t.assignedTo === currentUser.id).sort((a, b) => (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0) || (a.isCompleted ? 1 : 0) - (b.isCompleted ? 1 : 0)), [tasks, currentUser.id]);
  const sentTasks = useMemo(() => tasks.filter(t => t.createdBy === currentUser.id && t.assignedTo !== currentUser.id).sort((a, b) => (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0) || (a.isCompleted ? 1 : 0) - (b.isCompleted ? 1 : 0)), [tasks, currentUser.id]);
  const currentTaskList = pinboardTab === 'inbox' ? inboxTasks : sentTasks;

  const handleCommandNavigation = (type: 'patient' | 'action', payload?: any) => {
    setIsCommandBarOpen(false); 
    if (type === 'patient') { navigate(`patients/${payload}`); } 
    else if (type === 'action' && payload === 'newPatient') { showModal('patientRegistration', { currentBranch }); } 
    else if (type === 'action' && payload === 'newAppointment') { showModal('appointment', { onSave: handleSaveAppointment, onAddToWaitlist: handleAddToWaitlist, currentBranch }); }
  };
  
  const todaysFullSchedule = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    return appointments
      .filter(a => a.date === todayStr && a.branch === currentBranch)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, currentBranch]);

  return (
    <div className={`h-[100dvh] bg-bg-primary text-text-primary font-sans flex flex-col overflow-hidden`}>
      
      {impersonatingUser && (
        <div className="bg-amber-400 text-black p-4 text-center font-black uppercase tracking-widest text-sm z-[100] flex justify-center items-center gap-4 shadow-2xl" role="alert">
          <ShieldAlert size={18} className="animate-pulse"/>
          <span>IMPERSONATION ACTIVE: <strong>{currentUser.name}</strong></span>
          <button onClick={handleStopImpersonating} className="bg-black/80 text-white px-6 py-2 rounded-xl text-xs hover:bg-black transition-all">TERMINATE SESSION</button>
        </div>
      )}

      {/* Connectivity Indicator */}
      <div className={`h-1.5 w-full shrink-0 transition-all duration-1000 ${isOnline ? 'bg-teal-500 shadow-[0_0_15px_rgba(13,148,136,0.6)]' : 'bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]'}`} />

      <header className={headerClass} style={{ backgroundColor: isDowntime ? undefined : `${branchColor}F2` }}>
             <div className="flex items-center gap-6">
                <div className="flex flex-col">
                     <span className={`font-black tracking-wider text-xl leading-none ${isDowntime ? 'text-black' : 'text-white'}`}>{isDowntime ? 'DOWNTIME ACTIVE' : fieldSettings?.clinicName || 'dentsched'}</span>
                     <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                        <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${isDowntime ? 'text-black' : 'text-teal-400'}`}>{currentUser.name}</span>
                     </div>
                </div>
             </div>
             
            <nav className="flex items-center gap-1 bg-black/10 p-1.5 rounded-[2rem]" role="tablist">
                {navItems.map((item) => (
                <button 
                    key={item.id} 
                    onClick={() => navigate(item.id)} 
                    className={`flex items-center h-14 px-8 rounded-[1.5rem] transition-all duration-500 group ${
                        activeTab === item.id 
                            ? 'bg-white text-teal-900 shadow-2xl scale-105' 
                            : 'text-teal-100 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    <div className="shrink-0"><item.icon size={22} strokeWidth={3} /></div>
                    <span className={`text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === item.id ? 'opacity-100 ml-3 w-auto' : 'opacity-0 w-0 overflow-hidden ml-0'}`}>{item.label}</span>
                </button>
                ))}
            </nav>

             <div className="flex items-center gap-3">
                 <button onClick={() => setIsCommandBarOpen(true)} className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all">
                    <Search size={22} strokeWidth={3} />
                 </button>

                <div className="relative">
                    <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className={`p-4 rounded-2xl transition-all ${isUserMenuOpen ? 'bg-black/40 shadow-inner' : 'bg-white/10 hover:bg-white/20'}`}>
                        <UserCircle size={22} strokeWidth={3} />
                    </button>
                     {isUserMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                            <div className="absolute right-0 top-full mt-4 w-64 bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl border border-border-primary overflow-hidden z-20 animate-in fade-in zoom-in-95 text-slate-800 dark:text-slate-100">
                                <div className="p-6 border-b border-border-primary bg-slate-50 dark:bg-slate-900/50">
                                    <p className="font-black text-xs uppercase tracking-widest text-slate-400">Current Session</p>
                                    <p className="font-black text-sm text-text-primary mt-1 truncate">{currentUser.name}</p>
                                </div>
                                <div className="p-4 space-y-1">
                                    <button onClick={openProfile} className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"><UserIcon size={16}/> Profile Registry</button>
                                    {can('manage:setup') && (
                                        <button onClick={() => { navigate('field-mgmt'); setIsUserMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"><Sliders size={16}/> Practice Studio</button>
                                    )}
                                    <button onClick={toggleTheme} className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />} Dark Mode</button>
                                </div>
                                <div className="p-4 border-t">
                                    <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black text-red-600 hover:bg-red-50 transition-all uppercase tracking-widest"><LogOut size={16}/> Logout</button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {isDowntime ? (
                    <button onClick={() => setSystemStatus(SystemStatus.OPERATIONAL)} className="p-4 rounded-2xl bg-red-600 text-white shadow-xl animate-pulse">
                        <AlertTriangle size={22} strokeWidth={3} />
                    </button>
                ) : (
                    <button onClick={() => setShowDowntimeConfirm(true)} className="p-4 rounded-2xl bg-amber-500 text-white shadow-lg btn-tactile">
                        <ShieldCheck size={22} strokeWidth={3} />
                    </button>
                )}
                 
                 <button onClick={() => setIsInKioskMode(true)} className="p-4 rounded-2xl bg-lilac-600 text-white shadow-lg btn-tactile">
                    <Monitor size={22} strokeWidth={3} />
                </button>
             </div>
      </header>
      
      {isAuthorityLocked && (
        <div className="bg-red-600 text-white p-6 text-center font-black uppercase tracking-widest text-sm z-[60] flex justify-center items-center gap-4 shadow-2xl" role="alert">
          <ShieldAlert size={24}/>
          <span>CLINICAL AUTHORITY EXPIRED: PRC LICENSE VERIFICATION REQUIRED</span>
          <button onClick={openProfile} className="ml-4 bg-white text-red-700 px-8 py-2 rounded-xl text-xs font-black shadow-lg">RENEW NOW</button>
        </div>
      )}

      <main className="flex-1 flex flex-col h-[calc(100dvh-96px)] overflow-hidden bg-bg-primary relative">
        <ErrorBoundary>
            <div className={`flex-1 ${activeTab === 'schedule' || activeTab === 'roster' ? 'overflow-hidden flex flex-col p-4' : 'overflow-auto p-8'} no-scrollbar`}>
                {children}
            </div>
        </ErrorBoundary>
      </main>

      {/* PDA COMPLIANCE FOOTER */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-border-primary px-8 py-3 z-40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
              <Shield size={16} className="text-teal-700"/>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                PDA ETHICS VERIFIED &bull; RA 10173 COMPLIANT &bull; STRATEGIC SEALING ACTIVE
              </p>
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              BUILD: V2.1.0-STABLE
          </div>
      </div>

      {showDowntimeConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[3rem] shadow-2xl p-10 border-4 border-amber-200 animate-in zoom-in-95 text-center">
                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg animate-pulse">
                    <AlertTriangle size={40} />
                </div>
                <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tight">Emergency Protocol?</h2>
                <p className="text-sm text-slate-500 leading-relaxed mt-4">
                    Activate manual offline registry? All entries will require verification once connectivity is restored.
                </p>
                <div className="flex gap-4 mt-10">
                    <button onClick={() => setShowDowntimeConfirm(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
                    <button onClick={confirmDowntime} className="flex-[2] py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Activate</button>
                </div>
            </div>
        </div>
      )}
      
      <CommandBar
        isOpen={isCommandBarOpen}
        onClose={() => setIsCommandBarOpen(false)}
        patients={patients}
        todaysAppointments={todaysFullSchedule}
        onNavigate={handleCommandNavigation}
      />
    </div>
  );
};

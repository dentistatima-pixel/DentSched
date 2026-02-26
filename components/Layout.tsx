
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
    Calendar, Users, LayoutDashboard, Menu, X, PlusCircle, ChevronDown, UserCircle, 
    Settings, Sliders, MapPin, FileText, Download, ClipboardCheck, CheckCircle, Circle, 
    Flag, Monitor, Package, DollarSign, CloudOff, Cloud, RefreshCcw, AlertTriangle, 
    ShieldAlert, Shield, ShieldCheck, Lock, Bell, Smartphone, Users2, StickyNote, 
    Send, CheckSquare, Plus, Power, PowerOff, LogOut, Inbox, Trash2, Link as LinkIcon, User as UserIcon,
    Sparkles, Sun, Moon, Search, HelpCircle
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
  const { patients, handleSavePatient } = usePatient();
  const { appointments, handleSaveAppointment } = useAppointments();
  const { fieldSettings } = useSettings();
  const { tasks, handleAddTask, handleToggleTask, handleClearCompletedTasks, handleAddToWaitlist } = useClinicalOps();
  const { handleStartCashSession, handleCloseCashSession, cashSessions } = useFinancials();
  
  const [isTaskPopoverOpen, setIsTaskPopoverOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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

  if (!currentUser) return null; // Or a loading/error state

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
    { id: 'patients', label: 'Patients', icon: Users, visible: true },
    { id: 'admin', label: 'Admin', icon: Sliders, visible: can('manage:admin') },
  ].filter(item => item.visible);

  const myActiveTasks = tasks ? tasks.filter(t => t.assignedTo === currentUser.id && !t.isCompleted) : [];
  
  const branchColor = fieldSettings?.branchColors?.[currentBranch] || '#134e4a';

  const headerClass = isDowntime 
    ? "h-16 bg-[repeating-linear-gradient(45deg,#fbbf24,#fbbf24_10px,#000_10px,#000_20px)] text-white flex items-center justify-between px-6 shadow-md z-50 sticky top-0 shrink-0 border-b-4 border-red-600"
    : "h-24 backdrop-blur-xl text-white flex items-center justify-between px-8 shadow-2xl z-50 sticky top-0 shrink-0 border-b border-black/20 dark:border-white/10 transition-all duration-500";

  const handleTaskSubmit = () => {
    if (newTaskText.trim()) {
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
    navigate('profile');
  };
  
  const inboxTasks = useMemo(() => tasks.filter(t => t.assignedTo === currentUser.id).sort((a, b) => (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0) || (a.isCompleted ? 1 : 0) - (b.isCompleted ? 1 : 0)), [tasks, currentUser.id]);
  const sentTasks = useMemo(() => tasks.filter(t => t.createdBy === currentUser.id && t.assignedTo !== currentUser.id).sort((a, b) => (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0) || (a.isCompleted ? 1 : 0) - (b.isCompleted ? 1 : 0)), [tasks, currentUser.id]);
  const currentTaskList = pinboardTab === 'inbox' ? inboxTasks : sentTasks;

  const handleCommandNavigation = (type: 'patient' | 'action', payload?: any) => {
    setIsCommandBarOpen(false); // Close modal first
    if (type === 'patient') {
      navigate(`patients/${payload}`);
    } else if (type === 'action' && payload === 'newPatient') {
      showModal('patientRegistration', { currentBranch, onSave: handleSavePatient });
    } else if (type === 'action' && payload === 'newAppointment') {
      showModal('appointment', { onSave: handleSaveAppointment, onAddToWaitlist: handleAddToWaitlist, currentBranch });
    }
  };
  
  const todaysFullSchedule = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    return appointments
      .filter(a => a.date === todayStr && a.branch === currentBranch)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, currentBranch]);

  return (
    <div className={`h-[100dvh] bg-bg-primary text-text-primary font-sans flex flex-col ${isDowntime ? 'ring-inset ring-8 ring-red-600/20' : ''}`}>
      
      {impersonatingUser && (
        <div className="bg-amber-400 text-black p-3 text-center font-black uppercase tracking-widest text-sm z-[100] flex justify-center items-center gap-4 shadow-2xl" role="alert">
          <ShieldAlert size={18} className="animate-pulse"/>
          <span>Warning: Impersonating <strong>{currentUser.name}</strong>.</span>
          <button onClick={handleStopImpersonating} className="ml-4 bg-black/80 text-white px-4 py-1.5 rounded-lg text-xs hover:bg-black transition-colors">Stop Impersonating</button>
        </div>
      )}
      
      {!isOnline && (
        <div className="bg-red-600 text-white p-3 text-center font-black uppercase tracking-widest text-sm z-[100] flex justify-center items-center gap-4 shadow-2xl" role="status">
            <AlertTriangle size={18} className="animate-pulse"/>
            <span>⚠️ No Internet Connection - Data will sync when online</span>
        </div>
      )}

      {currentUser.status === 'Inactive' && (
        <div className="bg-slate-800 text-amber-300 p-3 text-center font-black uppercase tracking-widest text-sm z-[100] flex justify-center items-center gap-4 shadow-2xl" role="alert">
          <ShieldAlert size={18} />
          <span>ACCOUNT DEACTIVATED. This session is in read-only mode.</span>
        </div>
      )}

      {/* Visual Connectivity Bar */}
      <div className={`h-1.5 w-full shrink-0 transition-all duration-1000 ${isOnline ? 'bg-teal-500 shadow-[0_0_15px_rgba(13,148,136,0.6)]' : 'bg-lilac-400 animate-pulse shadow-[0_0_15px_rgba(192,38,211,0.6)]'}`} />

      <header className={headerClass} style={{ backgroundColor: isDowntime ? undefined : `${branchColor}F2` }}>
             <div className="flex items-center gap-6">
                <div className="flex flex-col">
                     <span className={`font-black tracking-wider text-xl leading-none ${isDowntime ? 'text-black bg-yellow-400 px-2 py-0.5 rounded uppercase' : 'text-white'}`}>{isDowntime ? 'Downtime Protocol' : fieldSettings?.clinicName || 'dentsched'}</span>
                     <div className="flex items-center gap-2 mt-2">
                        <span className={`text-sm font-black uppercase tracking-widest leading-none ${isDowntime ? 'text-white drop-shadow-md' : 'text-teal-400'}`}>Logged In: {currentUser.name}</span>
                     </div>
                </div>
             </div>
             
            {/* --- Main Navigation --- */}
            <nav className="flex items-center gap-2" role="tablist" aria-label="Main Navigation">
                {navItems.map((item) => (
                <button 
                    key={item.id} 
                    role="tab"
                    aria-selected={activeTab === item.id}
                    aria-controls={`${item.id}-panel`}
                    onClick={() => navigate(item.id)} 
                    className={`flex items-center h-14 px-6 rounded-2xl transition-all duration-500 group focus:ring-offset-2 ${
                        activeTab === item.id 
                            ? 'bg-teal-600 text-white shadow-xl shadow-teal-600/30' 
                            : isDowntime
                                ? 'bg-black/50 text-white hover:bg-black/70'
                                : 'text-teal-200/70 hover:bg-white/10 hover:text-white'
                    }`}
                    aria-label={`Switch to ${item.label} view`}
                >
                    <div className="shrink-0"><item.icon size={22} strokeWidth={activeTab === item.id ? 3 : 2} className="transition-transform group-hover:scale-110" /></div>
                    <span className={`text-sm font-black uppercase tracking-widest transition-all ${activeTab === item.id ? 'opacity-100 ml-3 w-auto' : 'opacity-0 w-0 overflow-hidden ml-0'}`}>{item.label}</span>
                </button>
                ))}
            </nav>

             <div className="flex items-center gap-4">
                 <button
                    onClick={() => setIsCommandBarOpen(true)}
                    className={`p-4 rounded-2xl transition-all focus:ring-offset-2 ${
                        isDowntime
                            ? 'bg-black/50 text-white hover:bg-black/70'
                            : 'bg-white/10 hover:bg-white/20'
                    }`}
                    aria-label="Open Command Bar (Ctrl+K)"
                 >
                    <Search size={22} />
                 </button>

                 {/* Sync Status Indicator */}
                <div 
                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
                        isSyncing ? 'bg-blue-100 text-blue-700' :
                        syncQueueCount > 0 ? 'bg-lilac-100 text-lilac-700' :
                        'bg-teal-50 text-teal-700'
                    }`}
                    title={
                        isSyncing ? 'Syncing offline changes...' :
                        syncQueueCount > 0 ? `${syncQueueCount} change(s) pending sync` :
                        'All changes synced'
                    }
                >
                    {isSyncing ? (
                        <RefreshCcw size={16} className="animate-spin" />
                    ) : syncQueueCount > 0 ? (
                        <CloudOff size={16} />
                    ) : (
                        <Cloud size={16} />
                    )}
                    {syncQueueCount > 0 && !isSyncing && (
                        <span>{syncQueueCount}</span>
                    )}
                </div>

                {/* User Menu */}
                <div className="relative">
                    <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className={`p-4 rounded-2xl transition-all relative focus:ring-offset-2 ${
                            isUserMenuOpen
                                ? 'bg-black/40 shadow-inner'
                                : isDowntime
                                    ? 'bg-black/50 text-white hover:bg-black/70'
                                    : 'bg-white/10 hover:bg-white/20'
                        }`}
                        aria-label="User menu"
                        aria-haspopup="true"
                        aria-expanded={isUserMenuOpen}
                    >
                        <UserCircle size={22} />
                    </button>
                     {isUserMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                            <div className="absolute right-0 top-full mt-4 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-border-primary overflow-hidden z-20 animate-in fade-in zoom-in-95 text-slate-800 dark:text-slate-100" role="menu">
                                <div className="p-4 border-b border-border-primary bg-bg-tertiary">
                                    <p className="font-black text-sm text-text-primary truncate">{currentUser.name}</p>
                                    <p className="text-sm text-text-secondary font-bold">{currentUser.role}</p>
                                </div>
                                <div className="p-2 space-y-1">
                                    <button onClick={openProfile} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors" role="menuitem">
                                        <UserIcon size={16}/> My Profile
                                    </button>
                                    {can('manage:setup') && (
                                        <button onClick={() => { navigate('field-mgmt'); setIsUserMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors" role="menuitem">
                                            <Sliders size={16}/> Practice Setup
                                        </button>
                                    )}
                                    <button onClick={toggleTheme} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors" role="menuitem">
                                        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />} Theme ({theme})
                                    </button>
                                    <button onClick={() => showModal('shortcutHelp')} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors" role="menuitem">
                                        <HelpCircle size={16} /> Shortcuts
                                    </button>
                                </div>
                                <div className="p-2 border-t border-border-primary">
                                    <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors" role="menuitem">
                                        <LogOut size={16}/> Logout & Secure
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Pinboard */}
                 <div className="relative">
                    <button
                        onClick={() => setIsTaskPopoverOpen(!isTaskPopoverOpen)}
                        className={`p-4 rounded-2xl transition-all relative focus:ring-offset-2 ${
                            isTaskPopoverOpen 
                                ? 'bg-black/40 shadow-inner' 
                                : isDowntime
                                    ? 'bg-black/50 text-white hover:bg-black/70'
                                    : 'bg-white/10 hover:bg-white/20'
                        }`}
                        aria-label={`Tasks: ${myActiveTasks.length} pending`}
                        aria-expanded={isTaskPopoverOpen}
                    >
                        <StickyNote size={22} />
                        {myActiveTasks.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-sm font-black flex items-center justify-center rounded-full border-2" style={{borderColor: branchColor}}>{myActiveTasks.length}</span>}
                    </button>
                     {isTaskPopoverOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsTaskPopoverOpen(false)} />
                            <div className="absolute right-0 top-full mt-4 w-[28rem] bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-border-primary overflow-hidden z-20 animate-in fade-in zoom-in-95 text-slate-800 dark:text-slate-100" role="dialog" aria-labelledby="task-title">
                                <div className="bg-bg-tertiary border-b border-border-primary p-3 flex justify-between items-center">
                                    <div className="flex items-center p-1 bg-slate-200/50 dark:bg-slate-700/50 rounded-2xl">
                                        <button onClick={() => setPinboardTab('inbox')} className={`px-4 py-2 rounded-xl text-sm font-black uppercase flex items-center gap-2 ${pinboardTab === 'inbox' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}><Inbox size={14}/> Inbox</button>
                                        <button onClick={() => setPinboardTab('sent')} className={`px-4 py-2 rounded-xl text-sm font-black uppercase flex items-center gap-2 ${pinboardTab === 'sent' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}><Send size={14}/> Sent</button>
                                    </div>
                                    {pinboardTab === 'inbox' && <button onClick={() => handleClearCompletedTasks(currentUser.id)} className="text-sm font-black text-slate-400 hover:text-red-500 flex items-center gap-1"><Trash2 size={12}/> Clear Completed</button>}
                                </div>
                                <div className="max-h-96 overflow-y-auto p-3 no-scrollbar">
                                    <div className="space-y-2 p-2">
                                        {currentTaskList.map(task => {
                                            const patient = patients.find(p => p.id === task.patientId);
                                            const creator = staff.find(s => s.id === task.createdBy);
                                            const assignee = staff.find(s => s.id === task.assignedTo);

                                            return (
                                                <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${task.isCompleted ? 'bg-bg-tertiary opacity-60' : task.isUrgent ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-teal-50 dark:hover:bg-teal-900/20'}`}>
                                                    <button onClick={() => handleToggleTask(task.id)} className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center ${task.isCompleted ? 'bg-teal-600 border-teal-600' : 'border-slate-300 dark:border-slate-600'}`}>
                                                        {task.isCompleted && <CheckSquare size={14} className="text-white"/>}
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-bold text-sm leading-tight ${task.isCompleted ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{task.text}</p>
                                                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                            {task.isUrgent && <div className="flex items-center gap-1 text-[11px] text-red-700 bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded-full font-black uppercase"><Flag size={10}/> Urgent</div>}
                                                            {patient && <button onClick={() => navigate(`patients/${patient.id}`)} className="flex items-center gap-1 text-[11px] text-teal-700 bg-teal-50 dark:bg-teal-900/50 px-1.5 py-0.5 rounded-full font-black uppercase"><UserIcon size={10}/> {patient.name}</button>}
                                                            {pinboardTab === 'inbox' && creator && creator.id !== currentUser.id && <div className="text-[11px] text-slate-500 font-bold">from: {creator.name}</div>}
                                                            {pinboardTab === 'sent' && assignee && <div className="text-[11px] text-slate-500 font-bold">to: {assignee.name}</div>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {currentTaskList.length === 0 && <p className="text-center text-sm text-slate-400 italic py-8">No tasks here.</p>}
                                    </div>
                                </div>
                                <div className="p-4 border-t bg-bg-tertiary space-y-3">
                                    <div className="relative">
                                        <input ref={taskInputRef} type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleTaskSubmit()} placeholder="Add new task..." className="input w-full"/>
                                        <button onClick={handleTaskSubmit} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><Plus size={16}/></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 relative">
                                        <div>
                                            <select value={newTaskAssignee} onChange={e => setNewTaskAssignee(e.target.value)} className="w-full text-sm font-black uppercase p-2 border border-border-primary rounded-lg bg-white dark:bg-slate-700">
                                                <option value={currentUser.id}>Assign to: Me</option>
                                                {staff.filter(s => s.id !== currentUser.id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="relative">
                                            <input type="text" placeholder="Link Patient..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} className="w-full text-sm font-black uppercase p-2 border border-border-primary rounded-lg bg-white dark:bg-slate-700"/>
                                            {patientSearchResults.length > 0 && (
                                                <div className="absolute bottom-full mb-1 w-full bg-white dark:bg-slate-600 border border-border-primary rounded-lg shadow-lg z-30">
                                                    {patientSearchResults.map(p => <button key={p.id} onClick={() => { setNewTaskPatientId(p.id); setPatientSearch(p.name); }} className="block w-full text-left p-2 text-sm hover:bg-teal-50 dark:hover:bg-teal-900/50">{p.name}</button>)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                         <button onClick={() => setNewTaskUrgent(!newTaskUrgent)} className={`px-3 py-1.5 rounded-lg text-sm font-black flex items-center gap-1 border-2 ${newTaskUrgent ? 'bg-red-500 text-white border-red-500' : 'bg-white dark:bg-slate-700 border-transparent'}`}><Flag size={12}/> Urgent</button>
                                         {newTaskPatientId && <div className="text-sm font-bold text-teal-700 flex items-center gap-1"><LinkIcon size={12}/> Linked: {patientSearch}</div>}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                 </div>

                {isDowntime ? (
                    <button
                        onClick={() => setSystemStatus(SystemStatus.OPERATIONAL)}
                        className="p-4 rounded-2xl bg-red-600 text-white shadow-xl animate-pulse-red ring-4 ring-red-500/50 transition-all focus:ring-offset-2"
                        title="System Status: Emergency Mode Active. Click to return to Operational."
                        aria-label="System Status: Emergency Mode Active. Click to return to Operational."
                    >
                        <AlertTriangle size={22} />
                    </button>
                ) : (
                    <button
                        onClick={() => showModal('downtimeConfirm')}
                        className="p-4 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-900/30 transition-all focus:ring-offset-2 btn-tactile"
                        title="System Status: Operational. Click to activate Emergency Protocol."
                        aria-label="System Status: Operational. Click to activate Emergency Protocol."
                    >
                        <ShieldCheck size={22} />
                    </button>
                )}
                 
                 <button
                    onClick={() => setIsInKioskMode(true)}
                    className="p-4 rounded-2xl bg-lilac-600 text-white shadow-lg shadow-lilac-900/30 transition-all focus:ring-offset-2 btn-tactile"
                    title="Client Intake Terminal"
                    aria-label="Client Intake Terminal"
                >
                    <Monitor size={22} />
                </button>
             </div>
      </header>
      
      {isAuthorityLocked && (
        <div className="bg-red-600 text-white p-4 text-center font-black uppercase tracking-widest text-sm z-[60] flex justify-center items-center gap-4 shadow-2xl animate-pulse-red" role="alert">
          <ShieldAlert size={20}/>
          <span>CLINICAL AUTHORITY LOCKED: Your credentials have expired.</span>
          <button onClick={openProfile} className="ml-4 bg-white/90 text-red-700 px-6 py-2 rounded-lg text-sm hover:bg-white transition-colors">Update Profile</button>
        </div>
      )}

      <main className="flex-1 flex flex-col bg-bg-primary relative overflow-auto no-scrollbar" role="main">
        <ErrorBoundary>
            <div className={`flex-1 ${activeTab === 'schedule' || activeTab === 'roster' ? 'flex flex-col p-2' : 'p-6'}`}>
                {children}
            </div>
        </ErrorBoundary>
      </main>

      {/* PDA COMPLIANCE FOOTER */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-border-primary px-8 py-2 z-40 flex items-center justify-center gap-4 shrink-0" role="contentinfo">
          <Shield size={14} className="text-teal-700 dark:text-teal-400" aria-hidden="true"/>
          <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
            PDA ETHICS RULE 19 VERIFIED: Practitioner retains sole clinical liability for decision support output.
          </p>
      </div>
      
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
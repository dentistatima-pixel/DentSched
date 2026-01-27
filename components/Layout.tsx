import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
    Calendar, Users, LayoutDashboard, Menu, X, PlusCircle, ChevronDown, UserCircle, 
    Settings, Sliders, MapPin, FileText, Download, ClipboardCheck, CheckCircle, Circle, 
    Flag, Monitor, Package, DollarSign, CloudOff, Cloud, RefreshCcw, AlertTriangle, 
    ShieldAlert, Shield, ShieldCheck, Lock, Bell, Smartphone, Users2, StickyNote, 
    Send, CheckSquare, Plus, Power, PowerOff, LogOut, Inbox, Trash2, Link as LinkIcon, User as UserIcon
} from 'lucide-react';
import { useModal } from '../contexts/ModalContext';
import { UserRole, SystemStatus, AppNotification, Patient } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { useStaff } from '../contexts/StaffContext';
import { useSettings } from '../contexts/SettingsContext';
import { useClinicalOps } from '../contexts/ClinicalOpsContext';
import { useFinancials } from '../contexts/FinancialContext';
import { useRouter, useNavigate } from '../contexts/RouterContext';
import { useAuthorization } from '../hooks/useAuthorization';
import { usePatient } from '../contexts/PatientContext';

interface LayoutProps {
  children: React.ReactNode;
  onEnterKioskMode?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, onEnterKioskMode
}) => {
  const { showModal } = useModal();
  const { route } = useRouter();
  const navigate = useNavigate();
  const activeTab = route.path;
  const { can } = useAuthorization();

  const { 
    currentUser, isOnline, systemStatus, setSystemStatus, originalUser: impersonatingUser, 
    handleStopImpersonating, logout: handleLogout,
    currentBranch, setCurrentBranch, isAuthorityLocked
  } = useAppContext();
  const { staff } = useStaff();
  const { patients } = usePatient();
  const { fieldSettings } = useSettings();
  const { tasks, handleAddTask, handleToggleTask, handleClearCompletedTasks } = useClinicalOps();
  const { handleStartCashSession, handleCloseCashSession, cashSessions } = useFinancials();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTaskPopoverOpen, setIsTaskPopoverOpen] = useState(false);
  const [showDowntimeConfirm, setShowDowntimeConfirm] = useState(false);
  
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

  if (!currentUser) return null; // Or a loading/error state

  const patientSearchResults = useMemo(() => {
    if (!patientSearch) return [];
    return patients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase())).slice(0, 3);
  }, [patientSearch, patients]);

  const onLogout = () => {
      handleLogout();
      setIsMobileMenuOpen(false);
  };
  
  const features = fieldSettings?.features;
  const enableMultiBranch = features?.enableMultiBranch ?? true;
  const availableBranches = fieldSettings?.branches || [];
  
  const isDowntime = systemStatus === SystemStatus.DOWNTIME;

  const userAllowedBranches = can('manage:admin')
      ? availableBranches 
      : (currentUser.allowedBranches && currentUser.allowedBranches.length > 0)
          ? currentUser.allowedBranches
          : availableBranches;

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, visible: true },
    { id: 'schedule', label: 'Calendar', icon: Calendar, visible: true },
    { id: 'patients', label: 'Patients', icon: Users, visible: true },
    { id: 'admin', label: 'Admin', icon: Sliders, visible: can('manage:admin') },
    { id: 'field-mgmt', label: 'Setup', icon: Settings, visible: can('manage:setup') }
  ].filter(item => item.visible);

  const myActiveTasks = tasks ? tasks.filter(t => t.assignedTo === currentUser.id && !t.isCompleted) : [];
  
  const branchColor = fieldSettings?.branchColors?.[currentBranch] || '#134e4a';

  const headerClass = isDowntime 
    ? "h-16 bg-[repeating-linear-gradient(45deg,#fbbf24,#fbbf24_10px,#000_10px,#000_20px)] text-white flex items-center justify-between px-6 shadow-md z-50 sticky top-0 shrink-0 border-b-4 border-red-600"
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
  
  const handleStartSession = () => {
      const balanceStr = prompt("Enter opening cash balance for today's session:");
      const balance = parseFloat(balanceStr || '0');
      if (!isNaN(balance)) {
          handleStartCashSession(balance, currentBranch);
          setIsMobileMenuOpen(false);
      }
  };

  const handleCloseSession = () => {
    const session = cashSessions.find(cs => cs.branch === currentBranch && cs.status === 'Open');
    if (session) {
        handleCloseCashSession(session.id);
    }
    setIsMobileMenuOpen(false);
  };

  const openProfile = () => {
    showModal('userProfile', { user: currentUser });
    setIsMobileMenuOpen(false);
  };
  
  const inboxTasks = useMemo(() => tasks.filter(t => t.assignedTo === currentUser.id).sort((a, b) => (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0) || (a.isCompleted ? 1 : 0) - (b.isCompleted ? 1 : 0)), [tasks, currentUser.id]);
  const sentTasks = useMemo(() => tasks.filter(t => t.createdBy === currentUser.id && t.assignedTo !== currentUser.id).sort((a, b) => (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0) || (a.isCompleted ? 1 : 0) - (b.isCompleted ? 1 : 0)), [tasks, currentUser.id]);
  const currentTaskList = pinboardTab === 'inbox' ? inboxTasks : sentTasks;

  return (
    <div className={`h-[100dvh] bg-bg-primary text-text-primary font-sans flex flex-col overflow-hidden ${isDowntime ? 'ring-inset ring-8 ring-red-600/20' : ''}`}>
      
      {impersonatingUser && (
        <div className="bg-amber-400 text-black p-3 text-center font-black uppercase tracking-widest text-xs z-[100] flex justify-center items-center gap-4 shadow-2xl" role="alert">
          <ShieldAlert size={18} className="animate-pulse"/>
          <span>Warning: Impersonating <strong>{currentUser.name}</strong>.</span>
          <button onClick={handleStopImpersonating} className="ml-4 bg-black/80 text-white px-4 py-1.5 rounded-lg text-[10px] hover:bg-black transition-colors">Stop Impersonating</button>
        </div>
      )}
      
      {currentUser.status === 'Inactive' && (
        <div className="bg-slate-800 text-amber-300 p-3 text-center font-black uppercase tracking-widest text-xs z-[100] flex justify-center items-center gap-4 shadow-2xl" role="alert">
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
                        <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${isDowntime ? 'text-white drop-shadow-md' : 'text-teal-400'}`}>Logged In: {currentUser.name}</span>
                        {!isOnline && <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-lilac-600 text-[8px] font-black uppercase tracking-widest" role="status"><CloudOff size={8}/> Offline Continuity Mode</div>}
                     </div>
                </div>
             </div>
             
            {/* --- Main Navigation --- */}
            <nav className="hidden md:flex items-center gap-2" role="tablist" aria-label="Main Navigation">
                {navItems.map((item) => (
                <button 
                    key={item.id} 
                    role="tab"
                    aria-selected={activeTab === item.id}
                    aria-controls={`${item.id}-panel`}
                    onClick={() => navigate(item.id)} 
                    className={`flex items-center h-14 px-6 rounded-2xl transition-all duration-500 group focus:ring-offset-2 ${activeTab === item.id ? 'bg-teal-600 text-white shadow-xl shadow-teal-600/30' : 'text-teal-200/70 hover:bg-white/10 hover:text-white'}`}
                    aria-label={`Switch to ${item.label} view`}
                >
                    <div className="shrink-0"><item.icon size={22} strokeWidth={activeTab === item.id ? 3 : 2} className="transition-transform group-hover:scale-110" /></div>
                    <span className={`text-xs font-black uppercase tracking-widest transition-all ${activeTab === item.id ? 'opacity-100 ml-3 w-auto' : 'opacity-0 w-0 overflow-hidden ml-0'}`}>{item.label}</span>
                </button>
                ))}
            </nav>

             <div className="flex items-center gap-4">
                {isDowntime ? (
                    <button
                        onClick={() => setSystemStatus(SystemStatus.OPERATIONAL)}
                        className="p-3.5 rounded-2xl bg-red-600 text-white shadow-xl animate-pulse-red ring-4 ring-red-500/50 transition-all focus:ring-offset-2"
                        title="System Status: Emergency Mode Active. Click to return to Operational."
                        aria-label="System Status: Emergency Mode Active. Click to return to Operational."
                    >
                        <AlertTriangle size={22} />
                    </button>
                ) : (
                    <button
                        onClick={() => setShowDowntimeConfirm(true)}
                        className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-teal-300 hover:text-white transition-all focus:ring-offset-2"
                        title="System Status: Operational. Click to activate Emergency Protocol."
                        aria-label="System Status: Operational. Click to activate Emergency Protocol."
                    >
                        <ShieldCheck size={22} />
                    </button>
                )}

                {/* Pinboard */}
                 <div className="relative">
                    <button
                        onClick={() => setIsTaskPopoverOpen(!isTaskPopoverOpen)}
                        className={`p-3.5 rounded-2xl transition-all relative focus:ring-offset-2 ${isTaskPopoverOpen ? 'bg-black/40 shadow-inner' : 'bg-white/10 hover:bg-white/20'}`}
                        aria-label={`Tasks: ${myActiveTasks.length} pending`}
                        aria-expanded={isTaskPopoverOpen}
                    >
                        <StickyNote size={22} />
                        {myActiveTasks.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs font-black flex items-center justify-center rounded-full border-2" style={{borderColor: branchColor}}>{myActiveTasks.length}</span>}
                    </button>
                     {isTaskPopoverOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsTaskPopoverOpen(false)} />
                            <div className="absolute right-0 top-full mt-4 w-[28rem] bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-border-primary overflow-hidden z-20 animate-in fade-in zoom-in-95 text-slate-800 dark:text-slate-100" role="dialog" aria-labelledby="task-title">
                                <div className="bg-bg-tertiary border-b border-border-primary p-3 flex justify-between items-center">
                                    <div className="flex items-center p-1 bg-slate-200/50 dark:bg-slate-700/50 rounded-2xl">
                                        <button onClick={() => setPinboardTab('inbox')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 ${pinboardTab === 'inbox' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}><Inbox size={14}/> Inbox</button>
                                        <button onClick={() => setPinboardTab('sent')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 ${pinboardTab === 'sent' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}><Send size={14}/> Sent</button>
                                    </div>
                                    {pinboardTab === 'inbox' && <button onClick={() => handleClearCompletedTasks(currentUser.id)} className="text-xs font-black text-slate-400 hover:text-red-500 flex items-center gap-1"><Trash2 size={12}/> Clear Completed</button>}
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
                                                            {task.isUrgent && <div className="flex items-center gap-1 text-[9px] text-red-700 bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded-full font-black uppercase"><Flag size={10}/> Urgent</div>}
                                                            {patient && <button onClick={() => navigate(`patients/${patient.id}`)} className="flex items-center gap-1 text-[9px] text-teal-700 bg-teal-50 dark:bg-teal-900/50 px-1.5 py-0.5 rounded-full font-black uppercase"><UserIcon size={10}/> {patient.name}</button>}
                                                            {pinboardTab === 'inbox' && creator && creator.id !== currentUser.id && <div className="text-[9px] text-slate-500 font-bold">from: {creator.name}</div>}
                                                            {pinboardTab === 'sent' && assignee && <div className="text-[9px] text-slate-500 font-bold">to: {assignee.name}</div>}
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
                                        <input ref={taskInputRef} type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddNewTask()} placeholder="Add new task..." className="input w-full"/>
                                        <button onClick={handleAddNewTask} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><Plus size={16}/></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 relative">
                                        <div>
                                            <select value={newTaskAssignee} onChange={e => setNewTaskAssignee(e.target.value)} className="w-full text-xs font-black uppercase p-2 border border-border-primary rounded-lg bg-white dark:bg-slate-700">
                                                <option value={currentUser.id}>Assign to: Me</option>
                                                {staff.filter(s => s.id !== currentUser.id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="relative">
                                            <input type="text" placeholder="Link Patient..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} className="w-full text-xs font-black uppercase p-2 border border-border-primary rounded-lg bg-white dark:bg-slate-700"/>
                                            {patientSearchResults.length > 0 && (
                                                <div className="absolute bottom-full mb-1 w-full bg-white dark:bg-slate-600 border border-border-primary rounded-lg shadow-lg z-30">
                                                    {patientSearchResults.map(p => <button key={p.id} onClick={() => { setNewTaskPatientId(p.id); setPatientSearch(p.name); }} className="block w-full text-left p-2 text-xs hover:bg-teal-50 dark:hover:bg-teal-900/50">{p.name}</button>)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                         <button onClick={() => setNewTaskUrgent(!newTaskUrgent)} className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 border-2 ${newTaskUrgent ? 'bg-red-500 text-white border-red-500' : 'bg-white dark:bg-slate-700 border-transparent'}`}><Flag size={12}/> Urgent</button>
                                         {newTaskPatientId && <div className="text-xs font-bold text-teal-700 flex items-center gap-1"><LinkIcon size={12}/> Linked: {patientSearch}</div>}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                 </div>

                 <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                    className="p-3.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all shadow-lg focus:ring-offset-2"
                    aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isMobileMenuOpen}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
             </div>
      </header>
      
      {isAuthorityLocked && (
        <div className="bg-red-600 text-white p-4 text-center font-black uppercase tracking-widest text-sm z-[60] flex justify-center items-center gap-4 shadow-2xl animate-pulse-red" role="alert">
          <ShieldAlert size={20}/>
          <span>CLINICAL AUTHORITY LOCKED: Your credentials have expired.</span>
          <button onClick={openProfile} className="ml-4 bg-white/90 text-red-700 px-6 py-2 rounded-lg text-xs hover:bg-white transition-colors">Update Profile</button>
        </div>
      )}

      {isMobileMenuOpen && (
            <div className="fixed inset-0 top-24 bg-teal-950/95 backdrop-blur-xl text-white z-40 animate-in slide-in-from-top-5 flex flex-col" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
                <div className="p-8 space-y-6 overflow-y-auto flex-1 max-w-lg mx-auto w-full">
                    <div className="bg-teal-900/50 p-6 rounded-[2.5rem] flex items-center gap-6 border border-teal-800 shadow-2xl">
                        <div className="w-16 h-16 rounded-3xl border-4 border-lilac-500 shadow-xl bg-lilac-200 flex items-center justify-center">
                            <UserCircle size={40} className="text-lilac-700"/>
                        </div>
                        <div><div className="font-black text-2xl tracking-tighter uppercase">{currentUser.name}</div><div className="text-xs text-teal-300 uppercase font-black tracking-[0.2em] mt-1">{currentUser.role}</div></div>
                    </div>
                    {enableMultiBranch && (
                        <div className="bg-teal-900/50 p-6 rounded-[2.5rem] border border-teal-800 shadow-lg">
                            <label htmlFor="branch-select" className="flex items-center gap-2 text-teal-400 uppercase font-black text-xs tracking-widest mb-4"><MapPin size={16} /> Registry Location</label>
                            <select id="branch-select" aria-label="Switch branch location" value={currentBranch} onChange={(e) => setCurrentBranch(e.target.value)} className="w-full bg-teal-950 text-white border-2 border-teal-800 rounded-2xl p-4 text-sm font-black shadow-inner outline-none focus:border-teal-600 transition-all">{userAllowedBranches.map(b => (<option key={b} value={b}>{b}</option>))}</select>
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-3 pt-4">
                        <button onClick={openProfile} className="w-full flex items-center space-x-6 px-6 py-6 rounded-[2rem] bg-teal-900/50 hover:bg-teal-800 border border-teal-800/50 transition-all focus:ring-offset-2 active:scale-95"><div className="bg-teal-700 p-3 rounded-2xl shadow-lg"><UserCircle size={24} className="text-white" /></div><span className="font-black uppercase tracking-widest text-sm">Security Profile</span></button>
                        <button onClick={() => { onEnterKioskMode && onEnterKioskMode(); setIsMobileMenuOpen(false); }} className="w-full flex items-center space-x-6 px-6 py-6 rounded-[2rem] bg-lilac-600/20 hover:bg-lilac-600 border border-lilac-500/30 transition-all focus:ring-offset-2 active:scale-95 group"><div className="bg-lilac-600 p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform"><Monitor size={24} className="text-white" /></div><span className="font-black uppercase tracking-widest text-sm">Client Intake Terminal</span></button>
                        <button onClick={onLogout} className="w-full flex items-center space-x-6 px-6 py-6 rounded-[2rem] bg-red-600/20 hover:bg-red-600 border border-red-500/30 transition-all focus:ring-offset-2 active:scale-95 group"><div className="bg-red-600 p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform"><LogOut size={24} className="text-white" /></div><span className="font-black uppercase tracking-widest text-sm">Logout & Secure</span></button>
                    </div>

                    {can('manage:day-session') && (
                        <div className="pt-6 border-t border-teal-800/50 mt-6">
                            <h4 className="text-teal-400 uppercase font-black text-xs tracking-widest mb-4">Admin Controls</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={handleStartSession} className="w-full flex items-center space-x-4 px-6 py-5 rounded-[2rem] bg-green-600/20 hover:bg-green-600 border border-green-500/30 transition-all focus:ring-offset-2 active:scale-95 group">
                                    <div className="bg-green-600 p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform"><Power size={20} className="text-white" /></div>
                                    <span className="font-black uppercase tracking-widest text-xs">Start of Day</span>
                                </button>
                                <button onClick={handleCloseSession} className="w-full flex items-center space-x-4 px-6 py-5 rounded-[2rem] bg-red-600/20 hover:bg-red-600 border border-red-500/30 transition-all focus:ring-offset-2 active:scale-95 group">
                                    <div className="bg-red-600 p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform"><PowerOff size={20} className="text-white" /></div>
                                    <span className="font-black uppercase tracking-widest text-xs">End of Day</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
      )}

      <main className="flex-1 flex flex-col h-[calc(100dvh-96px)] overflow-hidden bg-bg-primary relative" role="main">
        <div className={`flex-1 ${activeTab === 'schedule' || activeTab === 'roster' ? 'overflow-hidden flex flex-col p-2' : activeTab === 'patients' ? 'overflow-hidden p-6' : 'overflow-auto p-6'} no-scrollbar`}>
            {children}
        </div>
      </main>

      {/* PDA COMPLIANCE FOOTER */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-border-primary px-8 py-2 z-40 flex items-center justify-center gap-4 shrink-0" role="contentinfo">
          <Shield size={14} className="text-teal-700 dark:text-teal-400" aria-hidden="true"/>
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
            PDA ETHICS RULE 19 VERIFIED: Practitioner retains sole clinical liability for decision support output.
          </p>
      </div>

      {/* Gap 7: Downtime Confirmation Modal */}
      {showDowntimeConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="downtime-title">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border-4 border-amber-200 dark:border-amber-700 animate-in zoom-in-95">
                <div className="text-center">
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
                        <AlertTriangle size={40} />
                    </div>
                    <h2 id="downtime-title" className="text-2xl font-black uppercase text-slate-800 dark:text-slate-100 tracking-tight">Activate Emergency Protocol?</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-4">
                        Activating this mode will flag all new appointments as manual entries requiring later reconciliation. Only proceed if you are experiencing a network outage or system failure.
                    </p>
                </div>
                <div className="flex gap-4 mt-8">
                    <button onClick={() => setShowDowntimeConfirm(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
                    <button onClick={confirmDowntime} className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-600/30">Confirm & Activate</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Layout;

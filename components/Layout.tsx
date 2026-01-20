import React, { useState, useRef } from 'react';
import { Calendar, Users, LayoutDashboard, Menu, X, PlusCircle, ChevronDown, UserCircle, Settings, Sliders, MapPin, FileText, Download, ClipboardCheck, CheckCircle, Circle, Flag, Monitor, Package, DollarSign, CloudOff, Cloud, RefreshCcw, AlertTriangle, ShieldAlert, Shield, ShieldCheck, Lock, Bell, Smartphone, Users2, StickyNote, Send, CheckSquare, Plus, Power, PowerOff } from 'lucide-react';
import UserProfileModal from './UserProfileModal';
import { User, Appointment, Patient, UserRole, FieldSettings, PinboardTask, SystemStatus, AppNotification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddAppointment: () => void;
  currentUser: User;
  onSwitchUser: (user: User) => void;
  staff: User[];
  currentBranch: string;
  availableBranches: string[];
  onChangeBranch: (branch: string) => void;
  fieldSettings?: FieldSettings; 
  onGenerateReport: () => void;
  tasks?: PinboardTask[];
  onAddTask?: (text: string, isUrgent: boolean, assignedTo: string) => void;
  onToggleTask?: (id: string) => void;
  onEnterKioskMode?: () => void;
  isOnline?: boolean;
  pendingSyncCount?: number;
  systemStatus?: SystemStatus;
  onSwitchSystemStatus?: (status: SystemStatus) => void;
  installable?: boolean;
  onInstall?: () => void;
  impersonatingUser?: User | null;
  onStopImpersonating?: () => void;
  notifications: AppNotification[];
  onNotificationClick: (notification: AppNotification) => void;
  isProfileOpen: boolean;
  onOpenProfile: () => void;
  onCloseProfile: () => void;
  onStartCashSession: (openingBalance: number) => void;
  onCloseCashSession: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, onAddAppointment, currentUser, onSwitchUser, staff,
  currentBranch, availableBranches, onChangeBranch, fieldSettings, onGenerateReport, tasks = [], onAddTask, onToggleTask, onEnterKioskMode,
  isOnline = true, pendingSyncCount = 0, systemStatus = SystemStatus.OPERATIONAL, onSwitchSystemStatus,
  installable = false, onInstall, impersonatingUser, onStopImpersonating,
  notifications, onNotificationClick, isProfileOpen, onOpenProfile, onCloseProfile,
  onStartCashSession, onCloseCashSession
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTaskPopoverOpen, setIsTaskPopoverOpen] = useState(false);
  const [isNotificationPopoverOpen, setIsNotificationPopoverOpen] = useState(false);
  const [showDowntimeConfirm, setShowDowntimeConfirm] = useState(false); // State for Gap 8
  const [newTaskText, setNewTaskText] = useState('');
  const taskInputRef = useRef<HTMLInputElement>(null);

  const features = fieldSettings?.features;
  const enableMultiBranch = features?.enableMultiBranch ?? true;

  const isDowntime = systemStatus === SystemStatus.DOWNTIME;

  const userAllowedBranches = (currentUser.role === UserRole.ADMIN) 
      ? availableBranches 
      : (currentUser.allowedBranches && currentUser.allowedBranches.length > 0)
          ? currentUser.allowedBranches
          : availableBranches;

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'schedule', label: 'Calendar', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
  ];
  
  if (features?.enableInventory || features?.enableHMOClaims || features?.enableAnalytics) {
      navItems.push({ id: 'admin', label: 'Admin', icon: Sliders });
  }
  navItems.push({ id: 'field-mgmt', label: 'Setup', icon: Settings });


  const handleProfileUpdate = (updatedUser: User) => onSwitchUser(updatedUser);
  const myActiveTasks = tasks ? tasks.filter(t => t.assignedTo === currentUser.id && !t.isCompleted) : [];
  
  const notificationCount = notifications.length;

  const prcExpiryDate = currentUser.prcExpiry ? new Date(currentUser.prcExpiry) : null;
  const isPrcExpired = prcExpiryDate && prcExpiryDate < new Date();
  
  const isMalpracticeExpired = currentUser.malpracticeExpiry && new Date(currentUser.malpracticeExpiry) < new Date();
  const isAuthorityLocked = isPrcExpired || isMalpracticeExpired;
  
  const branchColor = fieldSettings?.branchColors?.[currentBranch] || '#134e4a'; // Fallback to teal-900

  const headerClass = isDowntime 
    ? "h-16 bg-[repeating-linear-gradient(45deg,#fbbf24,#fbbf24_10px,#000_10px,#000_20px)] text-white flex items-center justify-between px-6 shadow-md z-50 sticky top-0 shrink-0 border-b-4 border-red-600"
    : "h-24 backdrop-blur-xl text-white flex items-center justify-between px-8 shadow-2xl z-50 sticky top-0 shrink-0 border-b border-black/20 transition-all duration-500";

  const confirmDowntime = () => {
    onSwitchSystemStatus?.(SystemStatus.DOWNTIME);
    setShowDowntimeConfirm(false);
  };

  const handleAddNewTask = () => {
    if (onAddTask && newTaskText.trim()) {
      onAddTask(newTaskText, false, currentUser.id);
      setNewTaskText('');
      taskInputRef.current?.focus();
    }
  };
  
  const handleStartSession = () => {
      const balanceStr = prompt("Enter opening cash balance for today's session:");
      const balance = parseFloat(balanceStr || '0');
      if (!isNaN(balance)) {
          onStartCashSession(balance);
          setIsMobileMenuOpen(false);
      }
  };

  return (
    <div className={`h-[100dvh] bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden ${isDowntime ? 'ring-inset ring-8 ring-red-600/20' : ''}`}>
      
      {impersonatingUser && (
        <div className="bg-amber-400 text-black p-3 text-center font-black uppercase tracking-widest text-xs z-[100] flex justify-center items-center gap-4 shadow-2xl" role="alert">
          <ShieldAlert size={18} className="animate-pulse"/>
          <span>Warning: Impersonating <strong>{currentUser.name}</strong>.</span>
          <button onClick={onStopImpersonating} className="ml-4 bg-black/80 text-white px-4 py-1.5 rounded-lg text-[10px] hover:bg-black transition-colors">Stop Impersonating</button>
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
            <nav className="flex items-center gap-2" role="tablist" aria-label="Main Navigation">
                {navItems.map((item) => (
                <button 
                    key={item.id} 
                    role="tab"
                    aria-selected={activeTab === item.id}
                    aria-controls={`${item.id}-panel`}
                    onClick={() => setActiveTab(item.id)} 
                    className={`flex items-center h-14 px-6 rounded-2xl transition-all duration-500 group focus:ring-offset-2 ${activeTab === item.id ? 'bg-teal-600 text-white shadow-xl shadow-teal-600/30' : 'text-teal-200/70 hover:bg-white/10 hover:text-white'}`}
                    aria-label={`Switch to ${item.label} view`}
                >
                    <div className="shrink-0"><item.icon size={22} strokeWidth={activeTab === item.id ? 3 : 2} className="transition-transform group-hover:scale-110" /></div>
                    <span className={`text-xs font-black uppercase tracking-widest transition-all ${activeTab === item.id ? 'opacity-100 ml-3 w-auto' : 'opacity-0 w-0 overflow-hidden ml-0'}`}>{item.label}</span>
                </button>
                ))}
            </nav>

             <div className="flex items-center gap-4">
                 <div className="hidden lg:flex bg-black/20 p-1 rounded-2xl border border-white/10 gap-1" role="group" aria-label="System status toggle">
                    <button 
                        onClick={() => onSwitchSystemStatus?.(SystemStatus.OPERATIONAL)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all focus:ring-offset-2 ${systemStatus === SystemStatus.OPERATIONAL ? 'bg-teal-600 text-white shadow-xl' : 'text-white/60 hover:text-white'}`}
                        aria-pressed={systemStatus === SystemStatus.OPERATIONAL}
                    >
                        Operational
                    </button>
                    <button 
                        onClick={() => setShowDowntimeConfirm(true)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all focus:ring-offset-2 ${systemStatus === SystemStatus.DOWNTIME ? 'bg-red-600 text-white shadow-xl animate-pulse' : 'text-white/60 hover:text-white'}`}
                        aria-pressed={systemStatus === SystemStatus.DOWNTIME}
                    >
                        Emergency
                    </button>
                 </div>

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
                            <div className="absolute right-0 top-full mt-4 w-96 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden z-20 animate-in fade-in zoom-in-95 text-slate-800" role="dialog" aria-labelledby="task-title">
                                <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center">
                                    <span id="task-title" className="font-black uppercase tracking-widest text-[10px] text-slate-600">My Pinboard</span>
                                </div>
                                <div className="max-h-96 overflow-y-auto p-3 no-scrollbar">
                                    <div className="space-y-2 p-2">
                                        {tasks.filter(t => t.assignedTo === currentUser.id).map(task => (
                                            <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${task.isCompleted ? 'bg-slate-50 opacity-50' : 'hover:bg-teal-50'}`}>
                                                <button onClick={() => onToggleTask?.(task.id)} className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center ${task.isCompleted ? 'bg-teal-600 border-teal-600' : 'border-slate-300'}`}>
                                                    {task.isCompleted && <CheckSquare size={14} className="text-white"/>}
                                                </button>
                                                <div className={`flex-1 min-w-0 font-bold text-sm ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.text}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-4 border-t bg-slate-50">
                                    <div className="relative">
                                        <input ref={taskInputRef} type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddNewTask()} placeholder="Add new task..." className="w-full bg-white rounded-xl p-3 pr-12 text-sm outline-none border-2 border-slate-200 focus:border-teal-500"/>
                                        <button onClick={handleAddNewTask} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><Plus size={16}/></button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                 </div>

                 {/* Notification Hub */}
                 <div className="relative">
                    <button
                        onClick={() => setIsNotificationPopoverOpen(!isNotificationPopoverOpen)}
                        className={`p-3.5 rounded-2xl transition-all relative focus:ring-offset-2 ${isNotificationPopoverOpen ? 'bg-black/40 shadow-inner' : 'bg-white/10 hover:bg-white/20'}`}
                        aria-label={`Notifications: ${notificationCount} unread`}
                        aria-expanded={isNotificationPopoverOpen}
                    >
                        <Bell size={22} />
                        {notificationCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-lilac-500 text-white text-xs font-black flex items-center justify-center rounded-full border-2" style={{borderColor: branchColor}}>{notificationCount}</span>}
                    </button>
                    {isNotificationPopoverOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsNotificationPopoverOpen(false)} />
                            <div className="absolute right-0 top-full mt-4 w-96 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden z-20 animate-in fade-in zoom-in-95 text-slate-800" role="dialog" aria-labelledby="notification-title">
                                <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center">
                                    <span id="notification-title" className="font-black uppercase tracking-widest text-[10px] text-slate-600">Action Center</span>
                                    <span className="text-[10px] bg-lilac-100 text-lilac-700 px-2 py-0.5 rounded-full font-black uppercase">{notificationCount} Items</span>
                                </div>
                                <div className="max-h-96 overflow-y-auto p-3 no-scrollbar">
                                    {notifications.length > 0 ? (
                                        <div className="space-y-2">
                                            {notifications.map(n => (
                                                <button key={n.id} onClick={() => { onNotificationClick(n); setIsNotificationPopoverOpen(false); }} className="w-full flex items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl group transition-all text-left">
                                                    <div className={`p-2 rounded-lg mt-1 ${n.type === 'critical' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}><n.icon size={18} /></div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-black text-sm leading-tight text-slate-800">{n.title}</div>
                                                        <p className="text-xs text-slate-500 leading-snug mt-1">{n.description}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : <div className="p-10 text-center text-slate-500 text-sm italic"><CheckCircle size={48} className="mx-auto opacity-10 mb-4 text-teal-600"/>No pending actions.</div>}
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
          <button onClick={onOpenProfile} className="ml-4 bg-white/90 text-red-700 px-6 py-2 rounded-lg text-xs hover:bg-white transition-colors">Update Profile</button>
        </div>
      )}

      {isMobileMenuOpen && (
            <div className="fixed inset-0 top-24 bg-teal-950/95 backdrop-blur-xl text-white z-40 animate-in slide-in-from-top-5 flex flex-col" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
                <div className="p-8 space-y-6 overflow-y-auto flex-1 max-w-lg mx-auto w-full">
                    <div className="bg-teal-900/50 p-6 rounded-[2.5rem] flex items-center gap-6 border border-teal-800 shadow-2xl">
                        <img src={currentUser.avatar} alt={`Avatar of ${currentUser.name}`} className="w-16 h-16 rounded-3xl border-4 border-lilac-500 shadow-xl" />
                        <div><div className="font-black text-2xl tracking-tighter uppercase">{currentUser.name}</div><div className="text-xs text-teal-300 uppercase font-black tracking-[0.2em] mt-1">{currentUser.role}</div></div>
                    </div>
                    {enableMultiBranch && (
                        <div className="bg-teal-900/50 p-6 rounded-[2.5rem] border border-teal-800 shadow-lg">
                            <label htmlFor="branch-select" className="flex items-center gap-2 text-teal-400 uppercase font-black text-xs tracking-widest mb-4"><MapPin size={16} /> Registry Location</label>
                            <select id="branch-select" aria-label="Switch branch location" value={currentBranch} onChange={(e) => onChangeBranch(e.target.value)} className="w-full bg-teal-950 text-white border-2 border-teal-800 rounded-2xl p-4 text-sm font-black shadow-inner outline-none focus:border-teal-600 transition-all">{userAllowedBranches.map(b => (<option key={b} value={b}>{b}</option>))}</select>
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-3 pt-4">
                        {installable && onInstall && (
                            <button onClick={onInstall} className="w-full flex items-center space-x-6 px-6 py-6 rounded-[2rem] bg-teal-600 hover:bg-teal-500 shadow-xl shadow-teal-900/40 transition-all focus:ring-offset-2 active:scale-95 group">
                                <div className="bg-white/20 p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                                    <Smartphone size={24} className="text-white" />
                                </div>
                                <span className="font-black uppercase tracking-widest text-sm">Install Practice App</span>
                            </button>
                        )}
                        <button onClick={() => { onOpenProfile(); setIsMobileMenuOpen(false); }} className="w-full flex items-center space-x-6 px-6 py-6 rounded-[2rem] bg-teal-900/50 hover:bg-teal-800 border border-teal-800/50 transition-all focus:ring-offset-2 active:scale-95"><div className="bg-teal-700 p-3 rounded-2xl shadow-lg"><UserCircle size={24} className="text-white" /></div><span className="font-black uppercase tracking-widest text-sm">Security Profile</span></button>
                        <button onClick={() => { onEnterKioskMode && onEnterKioskMode(); setIsMobileMenuOpen(false); }} className="w-full flex items-center space-x-6 px-6 py-6 rounded-[2rem] bg-lilac-600/20 hover:bg-lilac-600 border border-lilac-500/30 transition-all focus:ring-offset-2 active:scale-95 group"><div className="bg-lilac-600 p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform"><Monitor size={24} className="text-white" /></div><span className="font-black uppercase tracking-widest text-sm">Client Intake Terminal</span></button>
                    </div>

                    {currentUser.role === UserRole.ADMIN && (
                        <div className="pt-6 border-t border-teal-800/50 mt-6">
                            <h4 className="text-teal-400 uppercase font-black text-xs tracking-widest mb-4">Admin Controls</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={handleStartSession} className="w-full flex items-center space-x-4 px-6 py-5 rounded-[2rem] bg-green-600/20 hover:bg-green-600 border border-green-500/30 transition-all focus:ring-offset-2 active:scale-95 group">
                                    <div className="bg-green-600 p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform"><Power size={20} className="text-white" /></div>
                                    <span className="font-black uppercase tracking-widest text-xs">Start of Day</span>
                                </button>
                                <button onClick={() => { onCloseCashSession(); setIsMobileMenuOpen(false); }} className="w-full flex items-center space-x-4 px-6 py-5 rounded-[2rem] bg-red-600/20 hover:bg-red-600 border border-red-500/30 transition-all focus:ring-offset-2 active:scale-95 group">
                                    <div className="bg-red-600 p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform"><PowerOff size={20} className="text-white" /></div>
                                    <span className="font-black uppercase tracking-widest text-xs">End of Day</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
      )}

      <main className="flex-1 flex flex-col h-[calc(100dvh-96px)] overflow-hidden bg-slate-50 relative" role="main">
        <div className={`flex-1 ${activeTab === 'schedule' || activeTab === 'roster' ? 'overflow-hidden flex flex-col p-2' : activeTab === 'patients' ? 'overflow-hidden p-6' : 'overflow-auto p-6'} no-scrollbar`}>
            {children}
        </div>
      </main>

      {/* PDA COMPLIANCE FOOTER */}
      <div className="bg-white/80 backdrop-blur-md border-t border-slate-100 px-8 py-2 z-40 hidden md:flex items-center justify-center gap-4 shrink-0" role="contentinfo">
          <Shield size={14} className="text-teal-700" aria-hidden="true"/>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
            PDA ETHICS RULE 19 VERIFIED: Practitioner retains sole clinical liability for decision support output.
          </p>
      </div>

      <UserProfileModal user={currentUser} isOpen={isProfileOpen} onClose={onCloseProfile} onSave={handleProfileUpdate} fieldSettings={fieldSettings} />
      
      {/* Gap 7: Downtime Confirmation Modal */}
      {showDowntimeConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="downtime-title">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border-4 border-amber-200 animate-in zoom-in-95">
                <div className="text-center">
                    <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
                        <AlertTriangle size={40} />
                    </div>
                    <h2 id="downtime-title" className="text-2xl font-black uppercase text-slate-800 tracking-tight">Activate Emergency Protocol?</h2>
                    <p className="text-sm text-slate-500 leading-relaxed mt-4">
                        Activating this mode will flag all new appointments as manual entries requiring later reconciliation. Only proceed if you are experiencing a network outage or system failure.
                    </p>
                </div>
                <div className="flex gap-4 mt-8">
                    <button onClick={() => setShowDowntimeConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
                    <button onClick={confirmDowntime} className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-600/30">Confirm & Activate</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Layout;

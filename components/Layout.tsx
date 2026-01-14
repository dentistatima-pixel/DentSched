import React, { useState } from 'react';
import { Calendar, Users, LayoutDashboard, Menu, X, PlusCircle, ChevronDown, UserCircle, Settings, Sliders, MapPin, FileText, Download, ClipboardCheck, CheckCircle, Circle, Flag, Monitor, Package, DollarSign, CloudOff, Cloud, RefreshCcw, AlertTriangle, ShieldAlert, Shield, ShieldCheck, Lock, Bell, Smartphone } from 'lucide-react';
import UserProfileModal from './UserProfileModal';
import { User, Appointment, Patient, UserRole, FieldSettings, PinboardTask, SystemStatus } from '../types';

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
  onToggleTask?: (id: string) => void;
  onEnterKioskMode?: () => void;
  isOnline?: boolean;
  pendingSyncCount?: number;
  systemStatus?: SystemStatus;
  onSwitchSystemStatus?: (status: SystemStatus) => void;
  installable?: boolean;
  onInstall?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, onAddAppointment, currentUser, onSwitchUser, staff,
  currentBranch, availableBranches, onChangeBranch, fieldSettings, onGenerateReport, tasks, onToggleTask, onEnterKioskMode,
  isOnline = true, pendingSyncCount = 0, systemStatus = SystemStatus.OPERATIONAL, onSwitchSystemStatus,
  installable = false, onInstall
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTaskPopoverOpen, setIsTaskPopoverOpen] = useState(false);

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
      navItems.push({ id: 'financials', label: 'Admin', icon: Sliders });
  }
  navItems.push({ id: 'field-mgmt', label: 'Setup', icon: Settings });


  const handleProfileUpdate = (updatedUser: User) => onSwitchUser(updatedUser);
  const myActiveTasks = tasks ? tasks.filter(t => t.assignedTo === currentUser.id && !t.isCompleted) : [];
  const badgeCount = myActiveTasks.length;

  const prcExpiryDate = currentUser.prcExpiry ? new Date(currentUser.prcExpiry) : null;
  const isPrcExpired = prcExpiryDate && prcExpiryDate < new Date();
  
  const isMalpracticeExpired = currentUser.malpracticeExpiry && new Date(currentUser.malpracticeExpiry) < new Date();
  const isAuthorityLocked = isPrcExpired || isMalpracticeExpired;

  const headerClass = isDowntime 
    ? "h-16 bg-[repeating-linear-gradient(45deg,#fbbf24,#fbbf24_10px,#000_10px,#000_20px)] text-white flex items-center justify-between px-6 shadow-md z-50 sticky top-0 shrink-0 border-b-4 border-red-600"
    : "h-24 bg-teal-900/95 backdrop-blur-xl text-white flex items-center justify-between px-8 shadow-2xl z-50 sticky top-0 shrink-0 border-b border-teal-800/50 transition-all duration-500";

  return (
    <div className={`h-[100dvh] bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden ${isDowntime ? 'ring-inset ring-8 ring-red-600/20' : ''}`}>
      
      {/* Visual Connectivity Bar */}
      <div className={`h-1.5 w-full shrink-0 transition-all duration-1000 ${isOnline ? 'bg-teal-500 shadow-[0_0_15px_rgba(13,148,136,0.6)]' : 'bg-lilac-400 animate-pulse shadow-[0_0_15px_rgba(192,38,211,0.6)]'}`} />

      <header className={headerClass}>
             <div className="flex items-center gap-6">
                <div className="flex flex-col">
                     <span className={`font-black tracking-wider text-xl leading-none ${isDowntime ? 'text-black bg-yellow-400 px-2 py-0.5 rounded uppercase' : 'text-white'}`}>{isDowntime ? 'Downtime Protocol' : fieldSettings?.clinicName || 'dentsched'}</span>
                     <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${isDowntime ? 'text-white drop-shadow-md' : 'text-teal-400'}`}>Logged In: Dr. {currentUser.name.split(' ')[0]}</span>
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
                        onClick={() => onSwitchSystemStatus?.(SystemStatus.DOWNTIME)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all focus:ring-offset-2 ${systemStatus === SystemStatus.DOWNTIME ? 'bg-red-600 text-white shadow-xl animate-pulse' : 'text-white/60 hover:text-white'}`}
                        aria-pressed={systemStatus === SystemStatus.DOWNTIME}
                    >
                        Emergency
                    </button>
                 </div>

                 <div className="relative">
                    <button 
                        onClick={() => setIsTaskPopoverOpen(!isTaskPopoverOpen)} 
                        className={`p-3.5 rounded-2xl transition-all relative focus:ring-offset-2 ${isTaskPopoverOpen ? 'bg-teal-800 shadow-inner' : 'bg-white/10 hover:bg-white/20'}`} 
                        aria-label={`Task Registry: ${badgeCount} items pending`}
                        aria-expanded={isTaskPopoverOpen}
                    >
                        <ClipboardCheck size={22} />
                        {badgeCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-black flex items-center justify-center rounded-full border-2 border-teal-900 shadow-lg" aria-hidden="true">{badgeCount}</span>}
                    </button>
                    {isTaskPopoverOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsTaskPopoverOpen(false)} />
                            <div className="absolute right-0 top-full mt-4 w-80 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden z-20 animate-in fade-in zoom-in-95 text-slate-800" role="dialog" aria-labelledby="registry-title">
                                <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center">
                                    <span id="registry-title" className="font-black uppercase tracking-widest text-[10px]">Priority Registry</span>
                                    <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-black uppercase" role="status">{badgeCount} Open</span>
                                </div>
                                <div className="max-h-80 overflow-y-auto p-3 no-scrollbar">
                                    {myActiveTasks.length > 0 ? (
                                        <div className="space-y-2">
                                            {myActiveTasks.map(task => (
                                                <div key={task.id} className="flex items-start gap-3 p-4 hover:bg-teal-50 rounded-2xl group transition-all">
                                                    <button onClick={() => onToggleTask && onToggleTask(task.id)} className="mt-1 text-slate-400 hover:text-teal-700 transition-colors focus:ring-offset-2" aria-label={`Complete task: ${task.text}`}><Circle size={18} /></button>
                                                    <div className="flex-1 min-w-0"><div className="text-sm font-bold leading-tight text-slate-700">{task.text}</div>{task.isUrgent && <div className="mt-1 inline-flex items-center gap-1 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest"><Flag size={10} /> Emergency</div>}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <div className="p-10 text-center text-slate-500 text-sm italic"><CheckCircle size={48} className="mx-auto opacity-10 mb-4 text-teal-600"/>No pending tasks.</div>}
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
                        {installable && (
                            <button onClick={onInstall} className="w-full flex items-center space-x-6 px-6 py-6 rounded-[2rem] bg-teal-600 hover:bg-teal-500 shadow-xl shadow-teal-900/40 transition-all focus:ring-offset-2 active:scale-95 group">
                                <div className="bg-white/20 p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                                    <Smartphone size={24} className="text-white" />
                                </div>
                                <span className="font-black uppercase tracking-widest text-sm">Install Practice App</span>
                            </button>
                        )}
                        <button onClick={() => { setIsProfileOpen(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center space-x-6 px-6 py-6 rounded-[2rem] bg-teal-900/50 hover:bg-teal-800 border border-teal-800/50 transition-all focus:ring-offset-2 active:scale-95"><div className="bg-teal-700 p-3 rounded-2xl shadow-lg"><UserCircle size={24} className="text-white" /></div><span className="font-black uppercase tracking-widest text-sm">Security Profile</span></button>
                        <button onClick={() => { onEnterKioskMode && onEnterKioskMode(); setIsMobileMenuOpen(false); }} className="w-full flex items-center space-x-6 px-6 py-6 rounded-[2rem] bg-lilac-600/20 hover:bg-lilac-600 border border-lilac-500/30 transition-all focus:ring-offset-2 active:scale-95 group"><div className="bg-lilac-600 p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform"><Monitor size={24} className="text-white" /></div><span className="font-black uppercase tracking-widest text-sm">Client Intake Terminal</span></button>
                    </div>
                </div>
            </div>
      )}

      <main className="flex-1 flex flex-col h-[calc(100dvh-96px)] overflow-hidden bg-slate-50 relative" role="main">
        <div className={`flex-1 ${activeTab === 'schedule' ? 'overflow-hidden flex flex-col p-2' : activeTab === 'patients' ? 'overflow-hidden p-6' : 'overflow-auto p-6'} no-scrollbar`}>
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

      <UserProfileModal user={currentUser} isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onSave={handleProfileUpdate} fieldSettings={fieldSettings} />
    </div>
  );
};

export default Layout;
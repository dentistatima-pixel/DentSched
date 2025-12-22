import React, { useState } from 'react';
import { Calendar, Users, LayoutDashboard, Menu, X, PlusCircle, ChevronDown, UserCircle, Settings, Sliders, MapPin, FileText, Download, ClipboardCheck, CheckCircle, Circle, Flag, Monitor, Package, DollarSign, CloudOff, Cloud, RefreshCcw, AlertTriangle, ShieldAlert } from 'lucide-react';
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
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, onAddAppointment, currentUser, onSwitchUser, staff,
  currentBranch, availableBranches, onChangeBranch, fieldSettings, onGenerateReport, tasks, onToggleTask, onEnterKioskMode,
  isOnline = true, pendingSyncCount = 0, systemStatus = SystemStatus.OPERATIONAL, onSwitchSystemStatus
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
  ];

  if (features?.enableInventory) { navItems.push({ id: 'inventory', label: 'Inventory', icon: Package }); }
  if ((features?.enableHMOClaims || features?.enableAnalytics) && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DENTIST)) {
      navItems.push({ id: 'financials', label: 'Financials', icon: DollarSign });
  }
  if (currentUser.role === UserRole.ADMIN) { navItems.push({ id: 'field-mgmt', label: 'Settings', icon: Settings }); }

  const handleProfileUpdate = (updatedUser: User) => onSwitchUser(updatedUser);
  const myActiveTasks = tasks ? tasks.filter(t => t.assignedTo === currentUser.id && !t.isCompleted) : [];
  const badgeCount = myActiveTasks.length;

  const headerClass = isDowntime 
    ? "h-16 bg-[repeating-linear-gradient(45deg,#fbbf24,#fbbf24_10px,#000_10px,#000_20px)] text-white flex items-center justify-between px-4 shadow-md z-50 sticky top-0 shrink-0 border-b-4 border-red-600"
    : "h-16 bg-teal-900 text-white flex items-center justify-between px-4 shadow-md z-50 sticky top-0 shrink-0 transition-colors duration-500";

  return (
    <div className={`h-[100dvh] bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden ${isDowntime ? 'ring-inset ring-8 ring-red-600/20' : ''}`}>
      
      {/* Cloud Pulse Connectivity Bar */}
      <div className={`h-1.5 w-full shrink-0 transition-all duration-1000 ${isOnline ? 'bg-teal-500' : 'bg-lilac-500 animate-pulse shadow-[0_0_10px_rgba(192,38,211,0.5)]'}`} />

      <header className={headerClass}>
             <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all ${isDowntime ? 'bg-red-600' : 'bg-lilac-400'}`}>
                    <span className="text-white font-bold text-xl">{isDowntime ? '!' : 'D'}</span>
                </div>
                <div className="flex flex-col">
                     <span className={`font-black tracking-tight text-lg leading-none ${isDowntime ? 'text-black bg-yellow-400 px-1 rounded' : 'text-white'}`}>{isDowntime ? 'DOWNTIME ACTIVE' : 'dentsched'}</span>
                     <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[11px] font-bold uppercase tracking-wider leading-none ${isDowntime ? 'text-white drop-shadow-md' : 'text-teal-200'}`}>Hello {currentUser.name.split(' ')[0]}</span>
                        {!isOnline && <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-lilac-600 text-[8px] font-black uppercase"><CloudOff size={8}/> Offline</div>}
                     </div>
                </div>
             </div>
             
             <div className="flex items-center gap-2">
                 {/* SYSTEM STATUS SWITCHER (ADMIN/DENTIST) */}
                 {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DENTIST) && (
                     <div className="hidden lg:flex bg-black/20 p-1 rounded-xl border border-white/10 gap-1 mr-2">
                        <button 
                            onClick={() => onSwitchSystemStatus?.(SystemStatus.OPERATIONAL)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${systemStatus === SystemStatus.OPERATIONAL ? 'bg-teal-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                            Operational
                        </button>
                        <button 
                            onClick={() => onSwitchSystemStatus?.(SystemStatus.DOWNTIME)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${systemStatus === SystemStatus.DOWNTIME ? 'bg-red-600 text-white shadow-lg animate-pulse' : 'text-white/40 hover:text-white'}`}
                        >
                            Downtime
                        </button>
                     </div>
                 )}

                 {pendingSyncCount > 0 && (
                     <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-lilac-600/20 border border-lilac-400/30 rounded-xl text-[10px] font-black text-lilac-200 uppercase tracking-widest animate-pulse">
                         <RefreshCcw size={14} className="animate-spin duration-[3000ms]"/>
                         {pendingSyncCount} Actions Queued
                     </div>
                 )}

                 {/* TASK NOTIFICATION CENTER */}
                 <div className="relative">
                    <button onClick={() => setIsTaskPopoverOpen(!isTaskPopoverOpen)} className={`p-2 rounded-full transition-colors relative ${isTaskPopoverOpen ? 'bg-teal-800' : 'active:bg-teal-800'}`} title="My Tasks">
                        <ClipboardCheck size={24} />
                        {badgeCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-teal-900">{badgeCount}</span>}
                    </button>
                    {isTaskPopoverOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsTaskPopoverOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 animate-in fade-in zoom-in-95 text-slate-800">
                                <div className="bg-slate-50 border-b border-slate-100 p-3 flex justify-between items-center"><span className="font-bold text-sm">My Tasks</span><span className="text-xs text-slate-500 font-medium">{badgeCount} Active</span></div>
                                <div className="max-h-64 overflow-y-auto p-2">
                                    {myActiveTasks.length > 0 ? (
                                        <div className="space-y-1">
                                            {myActiveTasks.map(task => (
                                                <div key={task.id} className="flex items-start gap-2 p-2 hover:bg-slate-50 rounded-lg group">
                                                    <button onClick={() => onToggleTask && onToggleTask(task.id)} className="mt-0.5 text-slate-300 hover:text-green-500 transition-colors"><Circle size={16} /></button>
                                                    <div className="flex-1 min-w-0"><div className="text-sm font-medium leading-tight text-slate-700">{task.text}</div>{task.isUrgent && <div className="mt-1 inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold"><Flag size={8} /> Urgent</div>}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <div className="p-6 text-center text-slate-400 text-xs italic"><div className="mb-2"><CheckCircle size={24} className="mx-auto opacity-20"/></div>No active tasks.</div>}
                                </div>
                            </div>
                        </>
                    )}
                 </div>

                 <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 active:bg-teal-800 rounded-full transition-colors">{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
             </div>
      </header>

      {isMobileMenuOpen && (
            <div className="fixed inset-0 top-16 bg-teal-900/95 backdrop-blur-sm text-white z-40 animate-in slide-in-from-top-5 flex flex-col">
                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    <div className="bg-teal-800 p-4 rounded-2xl flex items-center gap-4 border border-teal-700">
                        <img src={currentUser.avatar} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-lilac-400" />
                        <div><div className="font-bold text-lg">{currentUser.name}</div><div className="text-xs text-teal-200 uppercase font-bold tracking-wider">{currentUser.role}</div></div>
                    </div>
                    {enableMultiBranch && (
                        <div className="bg-teal-800 p-4 rounded-2xl border border-teal-700">
                            <div className="flex items-center gap-2 text-teal-300 uppercase font-bold text-xs mb-3"><MapPin size={14} /> Current Location</div>
                            <select value={currentBranch} onChange={(e) => onChangeBranch(e.target.value)} className="w-full bg-teal-900 text-white border border-teal-600 rounded-xl p-3 text-sm font-bold shadow-sm">{userAllowedBranches.map(b => (<option key={b} value={b}>{b}</option>))}</select>
                        </div>
                    )}
                    <div className="space-y-2 pt-2">
                        <button onClick={() => { setIsProfileOpen(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center space-x-4 px-4 py-4 rounded-xl bg-teal-800/50 hover:bg-teal-800 border border-teal-700/50 transition-colors"><div className="bg-teal-700 p-2 rounded-lg"><UserCircle size={20} className="text-white" /></div><span className="font-bold">Account Profile</span></button>
                        <button onClick={() => { onEnterKioskMode && onEnterKioskMode(); setIsMobileMenuOpen(false); }} className="w-full flex items-center space-x-4 px-4 py-4 rounded-xl bg-teal-800/50 hover:bg-teal-800 border border-teal-700/50 transition-colors group"><div className="bg-lilac-600 p-2 rounded-lg group-hover:scale-110 transition-transform"><Monitor size={20} className="text-white" /></div><span className="font-bold">Enter Kiosk Mode</span></button>
                    </div>
                </div>
            </div>
      )}

      <main className="flex-1 flex flex-col h-[calc(100dvh-64px)] overflow-hidden bg-slate-50 relative">
        <div className={`flex-1 ${activeTab === 'schedule' ? 'overflow-hidden flex flex-col p-2' : 'overflow-auto p-4'} pb-24`}>
            {children}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 z-40 flex justify-around items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
            {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center p-2 rounded-2xl transition-all duration-300 ${activeTab === item.id ? 'text-teal-600 -translate-y-1' : 'text-slate-400'}`}>
                <div className={`p-1.5 rounded-xl mb-1 transition-colors ${activeTab === item.id ? 'bg-teal-50' : 'bg-transparent'}`}><item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} /></div>
                <span className={`text-[10px] font-bold ${activeTab === item.id ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{item.label}</span>
            </button>
            ))}
      </div>

      <UserProfileModal user={currentUser} isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onSave={handleProfileUpdate} fieldSettings={fieldSettings} />
    </div>
  );
};

export default Layout;
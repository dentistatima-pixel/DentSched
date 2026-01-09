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
  if (features?.enableHMOClaims || features?.enableAnalytics) {
      navItems.push({ id: 'financials', label: 'Financials', icon: DollarSign });
  }
  navItems.push({ id: 'field-mgmt', label: 'Settings', icon: Settings });

  const handleProfileUpdate = (updatedUser: User) => onSwitchUser(updatedUser);
  const myActiveTasks = tasks ? tasks.filter(t => t.assignedTo === currentUser.id && !t.isCompleted) : [];
  const badgeCount = myActiveTasks.length;

  const headerHeight = isDowntime ? "h-16" : "h-16 md:h-16"; 
  const headerClass = isDowntime 
    ? `h-16 bg-[repeating-linear-gradient(45deg,#fbbf24,#fbbf24_10px,#000_10px,#000_20px)] text-white flex items-center justify-between px-4 md:px-6 shadow-md z-50 sticky top-0 shrink-0 border-b-4 border-red-600`
    : `h-16 bg-teal-900/95 backdrop-blur-xl text-white flex items-center justify-between px-4 md:px-8 shadow-xl z-50 sticky top-0 shrink-0 border-b border-teal-800/50 transition-all duration-300`;

  return (
    <div className={`h-[100dvh] bg-slate-50 text-slate-900 font-sans flex flex-row overflow-hidden ${isDowntime ? 'ring-inset ring-8 ring-red-600/20' : ''}`}>
      
      {/* Sidebar - Optimized for Tablet Landscape: Rail mode extended to xl screens */}
      <aside className="hidden md:flex w-20 xl:w-20 2xl:w-56 bg-teal-950 flex-col shrink-0 z-50 border-r border-teal-900 transition-all duration-300">
          <div className="p-4 flex items-center gap-3 xl:px-4 xl:py-6 shrink-0">
             <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-xl bg-lilac-500 flex items-center justify-center shadow-lg shrink-0">
                <span className="text-white font-black text-xl xl:text-2xl">d</span>
             </div>
             <span className="hidden 2xl:block font-black text-xl tracking-tighter text-white uppercase truncate">{fieldSettings?.clinicName || 'dentsched'}</span>
          </div>

          <nav className="flex-1 px-3 space-y-2 mt-4 overflow-y-auto no-scrollbar" role="tablist">
              {navItems.map((item) => (
                <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-4 p-3 xl:px-4 xl:py-3.5 rounded-xl transition-all group ${activeTab === item.id ? 'bg-teal-600 text-white shadow-lg' : 'text-teal-400 hover:bg-white/5 hover:text-white'}`}
                    aria-selected={activeTab === item.id}
                    role="tab"
                >
                    <item.icon size={22} className="shrink-0 transition-transform group-hover:scale-110" />
                    <span className="hidden 2xl:block font-black uppercase text-xs tracking-widest truncate">{item.label}</span>
                </button>
              ))}
          </nav>

          <div className="p-4 mt-auto border-t border-teal-900 space-y-4">
              <button 
                  onClick={() => setIsProfileOpen(true)}
                  className="w-full flex items-center gap-4 p-3 xl:px-4 rounded-xl text-teal-400 hover:text-white transition-all group"
                  aria-label="View profile"
              >
                  <UserCircle size={22} className="shrink-0" />
                  <span className="hidden 2xl:block font-black uppercase text-[10px] tracking-widest truncate">My Identity</span>
              </button>
              
              <div className="hidden 2xl:block px-2">
                  <p className="text-[8px] font-black text-teal-700 uppercase tracking-widest leading-relaxed">
                    PDA ETHICS RULE 19 VERIFIED: Liability solely on practitioner.
                  </p>
              </div>
          </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className={headerClass}>
               <div className="flex items-center gap-3">
                  <div className="md:hidden w-10 h-10 rounded-xl bg-lilac-500 flex items-center justify-center shadow-lg">
                      <span className="text-white font-black text-xl">{isDowntime ? '!' : 'd'}</span>
                  </div>
                  <div className="flex flex-col">
                       <span className={`font-black tracking-[0.15em] text-sm md:text-base uppercase ${isDowntime ? 'text-black bg-yellow-400 px-1.5 rounded' : 'text-white'}`}>
                          {isDowntime ? 'Downtime Protocol' : fieldSettings?.clinicName || 'dentsched'}
                       </span>
                       <div className="flex items-center gap-2">
                          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-teal-400">Authenticated: Dr. {currentUser.name.split(' ')[0]}</span>
                          {!isOnline && <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-lilac-600 text-[7px] font-black uppercase tracking-widest"><CloudOff size={8}/> Offline</div>}
                       </div>
                  </div>
               </div>
               
               <div className="flex items-center gap-2 md:gap-4">
                   <div className="hidden sm:flex bg-black/20 p-1 rounded-xl border border-white/10 gap-1" role="group">
                      <button 
                          onClick={() => onSwitchSystemStatus?.(SystemStatus.OPERATIONAL)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${systemStatus === SystemStatus.OPERATIONAL ? 'bg-teal-600 text-white shadow-md' : 'text-white/50 hover:text-white'}`}
                      >Ops</button>
                      <button 
                          onClick={() => onSwitchSystemStatus?.(SystemStatus.DOWNTIME)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${systemStatus === SystemStatus.DOWNTIME ? 'bg-red-600 text-white shadow-md animate-pulse' : 'text-white/50 hover:text-white'}`}
                      >Emer</button>
                   </div>

                   <button 
                        onClick={() => setIsTaskPopoverOpen(!isTaskPopoverOpen)} 
                        className={`p-2.5 rounded-xl transition-all relative ${isTaskPopoverOpen ? 'bg-teal-800 shadow-inner' : 'bg-white/10 hover:bg-white/20'}`} 
                        aria-label="Tasks"
                    >
                        <ClipboardCheck size={20} />
                        {badgeCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border border-teal-900">{badgeCount}</span>}
                    </button>

                   <button 
                      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                      className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all shadow-lg"
                      aria-label="Menu"
                  >
                      {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>
               </div>
        </header>

        {isMobileMenuOpen && (
              <div className="fixed inset-0 top-16 bg-teal-950/98 backdrop-blur-xl text-white z-40 animate-in slide-in-from-top-5 flex flex-col" role="dialog" aria-modal="true">
                  <div className="p-6 space-y-6 overflow-y-auto flex-1 max-w-lg mx-auto w-full no-scrollbar pb-safe">
                      <div className="bg-teal-900/50 p-5 rounded-3xl flex items-center gap-4 border border-teal-800 shadow-xl">
                          <img src={currentUser.avatar} alt="" className="w-14 h-14 rounded-2xl border-2 border-lilac-500 shadow-md" />
                          <div><div className="font-black text-xl tracking-tight uppercase leading-none">{currentUser.name}</div><div className="text-[10px] text-teal-300 uppercase font-black tracking-widest mt-1">{currentUser.role}</div></div>
                      </div>
                      {enableMultiBranch && (
                          <div className="bg-teal-900/50 p-5 rounded-3xl border border-teal-800 shadow-lg">
                              <label className="flex items-center gap-2 text-teal-400 uppercase font-black text-[10px] tracking-widest mb-3"><MapPin size={14} /> Registry Location</label>
                              <select aria-label="Branch select" value={currentBranch} onChange={(e) => onChangeBranch(e.target.value)} className="w-full bg-teal-950 text-white border border-teal-800 rounded-xl p-3 text-sm font-black shadow-inner outline-none focus:border-teal-600 transition-all">{userAllowedBranches.map(b => (<option key={b} value={b}>{b}</option>))}</select>
                          </div>
                      )}
                      <div className="grid grid-cols-1 gap-2 pt-2">
                          <button onClick={() => { setIsProfileOpen(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-4 px-5 py-5 rounded-2xl bg-teal-900/50 hover:bg-teal-800 border border-teal-800/50 transition-all"><UserCircle size={20} className="text-teal-400" /><span className="font-black uppercase tracking-widest text-xs">Security Profile</span></button>
                          <button onClick={() => { onEnterKioskMode && onEnterKioskMode(); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-4 px-5 py-5 rounded-2xl bg-lilac-600/20 hover:bg-lilac-600 border border-lilac-500/30 transition-all"><Monitor size={20} className="text-lilac-400" /><span className="font-black uppercase tracking-widest text-xs">Client Intake Terminal</span></button>
                      </div>
                      <div className="pt-8 text-center px-4">
                          <p className="text-[9px] font-black text-teal-600 uppercase tracking-[0.2em] leading-relaxed">
                            PDA ETHICS RULE 19 VERIFIED: Practitioner retains sole clinical liability for decision support output.
                          </p>
                      </div>
                  </div>
              </div>
        )}

        <main className="flex-1 flex flex-col h-[calc(100dvh-64px)] overflow-hidden bg-slate-50 relative pb-16 md:pb-0" role="main">
          <div className={`flex-1 ${activeTab === 'schedule' ? 'overflow-hidden flex flex-col p-1 md:p-2' : 'overflow-auto p-4 md:p-6 lg:p-6'} no-scrollbar`}>
              {children}
          </div>
        </main>

        {/* Compact Bottom Nav - Mobile Only */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-4 z-40 flex md:hidden gap-1 justify-between items-center rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-safe" role="tablist" aria-label="Mobile Navigation">
              {navItems.map((item) => (
                <button 
                    key={item.id} 
                    onClick={() => setActiveTab(item.id)} 
                    className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all duration-300 ${activeTab === item.id ? 'text-teal-600 scale-110' : 'text-slate-400 hover:text-teal-500'}`}
                    aria-label={item.label}
                    role="tab"
                    aria-selected={activeTab === item.id}
                >
                    <item.icon size={22} strokeWidth={activeTab === item.id ? 3 : 2} />
                    <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${activeTab === item.id ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
                </button>
              ))}
        </nav>

        <UserProfileModal user={currentUser} isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onSave={handleProfileUpdate} fieldSettings={fieldSettings} />
      </div>
    </div>
  );
};

export default Layout;
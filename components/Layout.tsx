import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, Users, LayoutDashboard, Menu, X, ChevronDown, UserCircle, Settings, 
  MapPin, RefreshCcw, ClipboardCheck, Circle, Flag, Package, DollarSign, 
  CloudOff, Monitor, Info, ShieldAlert, Eye, Target, Scale, Zap, 
  ShieldCheck, ShieldX, Plus, ChevronLeft, ChevronRight
} from 'lucide-react';
import UserProfileModal from './UserProfileModal';
import { User, UserRole, FieldSettings, PinboardTask, SystemStatus, UIMode } from '../types';

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
  isOnline?: boolean;
  pendingSyncCount?: number;
  systemStatus?: SystemStatus;
  onSwitchSystemStatus?: (status: SystemStatus) => void;
  onEnterKiosk?: () => void;
  isCorporateReadOnly?: boolean;
  uiMode: UIMode;
  onChangeUiMode: (mode: UIMode) => void;
  isAuditLogVerified?: boolean | null;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, currentUser, onSwitchUser,
  currentBranch, availableBranches, onChangeBranch, fieldSettings, tasks, onToggleTask,
  isOnline = true, pendingSyncCount = 0, systemStatus = SystemStatus.OPERATIONAL, 
  onSwitchSystemStatus, onEnterKiosk, isCorporateReadOnly, uiMode, onChangeUiMode, isAuditLogVerified,
  onAddAppointment
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTaskPopoverOpen, setIsTaskPopoverOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const features = fieldSettings?.features;
  const isDowntime = systemStatus === SystemStatus.DOWNTIME;
  const isViewingRemoteBranch = currentBranch !== currentUser.defaultBranch;

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, alert: false },
    { id: 'schedule', label: 'Registry', icon: Calendar, alert: false },
    { id: 'patients', label: 'Patients', icon: Users, alert: false },
  ];

  if (features?.enableInventory) { navItems.push({ id: 'inventory', label: 'Logistics', icon: Package, alert: false }); }
  if ((features?.enableHMOClaims || features?.enableAnalytics) && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DENTIST)) {
      navItems.push({ id: 'financials', label: 'Economics', icon: DollarSign, alert: false });
  }

  // --- GESTURE LOGIC: SWIPE TO SWITCH BRANCH ---
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || availableBranches.length <= 1 || currentUser.role === UserRole.DENTAL_ASSISTANT) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 100) {
      const currentIndex = availableBranches.indexOf(currentBranch);
      let nextIndex = diff > 0 ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex >= availableBranches.length) nextIndex = 0;
      if (nextIndex < 0) nextIndex = availableBranches.length - 1;
      
      onChangeBranch(availableBranches[nextIndex]);
      if (navigator.vibrate) navigator.vibrate(10);
    }
    touchStartX.current = null;
  };

  const handleQuickAction = () => {
    if (activeTab === 'schedule' || activeTab === 'dashboard') onAddAppointment();
    // Contextual actions could go here
  };

  const myActiveTasks = tasks ? tasks.filter(t => t.assignedTo === currentUser.id && !t.isCompleted) : [];

  return (
    <div className={`h-[100dvh] bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden ${isDowntime ? 'ring-inset ring-8 ring-red-600/20' : ''}`}>
      {/* STATUS RIBBON */}
      <div className={`h-1 w-full shrink-0 transition-all duration-1000 ${isOnline ? 'bg-teal-500' : 'bg-lilac-500 animate-pulse'}`} />

      {/* HEADER / BRANCH RIBBON */}
      <header 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`h-14 shrink-0 flex items-center justify-between px-4 transition-colors relative z-50 ${isDowntime ? 'bg-red-900' : 'bg-white border-b border-slate-100'}`}
      >
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-400 hover:text-teal-600">
            <Menu size={22} />
          </button>
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-widest ${isDowntime ? 'text-red-200' : 'text-slate-400'}`}>
              {isDowntime ? 'System Offline' : 'Registry Active'}
            </span>
          </div>
        </div>

        {/* SWIPEABLE BRANCH SELECTOR */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 group cursor-ew-resize select-none">
          <ChevronLeft size={12} className="text-lilac-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex flex-col items-center">
            <span className={`text-xs font-black uppercase tracking-[0.2em] ${isDowntime ? 'text-white' : 'text-slate-900'}`}>
              {currentBranch}
            </span>
            {isViewingRemoteBranch && <span className="text-[8px] font-bold text-lilac-500 uppercase tracking-tighter">Remote Silo</span>}
          </div>
          <ChevronRight size={12} className="text-lilac-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="flex items-center gap-3">
          {pendingSyncCount > 0 && <RefreshCcw size={16} className="text-lilac-500 animate-spin" />}
          <div className={`w-8 h-8 rounded-full border-2 overflow-hidden transition-all ${isAuditLogVerified === false ? 'border-red-500 animate-pulse' : 'border-teal-500'}`}>
            <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-hidden bg-slate-50 relative pb-20">
        {isViewingRemoteBranch && (
          <div className="bg-lilac-600 text-white text-[9px] font-black uppercase py-1 text-center tracking-widest flex items-center justify-center gap-2 shadow-inner">
            <ShieldAlert size={10}/> Read-Only Mode: Branch Data Silo
          </div>
        )}
        <div className="h-full overflow-y-auto no-scrollbar p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* CONSOLIDATED ADAPTIVE BOTTOM NAV (GLASS-MORPHISM) */}
      <nav className="fixed bottom-4 left-4 right-4 h-16 bg-teal-950/80 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl flex items-center justify-around px-2 z-[60]">
        {navItems.slice(0, 2).map((item) => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === item.id ? 'text-teal-400 scale-110' : 'text-white/40 hover:text-white'}`}
          >
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}

        {/* FLOATING ACTION HUB */}
        <button 
          onClick={handleQuickAction}
          className="w-14 h-14 bg-lilac-500 rounded-full flex items-center justify-center -mt-12 shadow-xl shadow-lilac-500/30 border-4 border-slate-50 transition-transform active:scale-90"
        >
          <Plus size={28} className="text-white" />
        </button>

        {navItems.slice(2, 4).map((item) => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === item.id ? 'text-teal-400 scale-110' : 'text-white/40 hover:text-white'}`}
          >
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* COLLAPSIBLE SIDEBAR FOR TASKS & SETTINGS */}
      {isSidebarOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] animate-in fade-in" onClick={() => setIsSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-2xl z-[110] animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-teal-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center font-bold text-xl">D</div>
                <div>
                  <h3 className="font-black uppercase tracking-tighter">Practice Hub</h3>
                  <p className="text-[10px] text-teal-300 font-bold uppercase">{currentUser.role}</p>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)}><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3">Branch Management</h4>
                <div className="grid grid-cols-1 gap-2">
                  {availableBranches.map(b => (
                    <button 
                      key={b} 
                      onClick={() => { onChangeBranch(b); setIsSidebarOpen(false); }}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${currentBranch === b ? 'border-teal-500 bg-teal-50 text-teal-900' : 'border-slate-100 hover:border-teal-200 text-slate-600'}`}
                    >
                      <span className="text-sm font-bold uppercase">{b}</span>
                      {currentBranch === b && <ShieldCheck size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3">System Focus</h4>
                <div className="space-y-2">
                  <button onClick={() => { onChangeUiMode(UIMode.OPERATIONAL); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${uiMode === UIMode.OPERATIONAL ? 'bg-teal-600 text-white' : 'hover:bg-slate-50'}`}><Zap size={18}/><span className="text-sm font-bold">Operational Mode</span></button>
                  <button onClick={() => { onChangeUiMode(UIMode.REVIEW); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${uiMode === UIMode.REVIEW ? 'bg-teal-600 text-white' : 'hover:bg-slate-50'}`}><Target size={18}/><span className="text-sm font-bold">Clinical Review</span></button>
                  {currentUser.role === UserRole.ADMIN && (
                    <>
                      <button onClick={() => { onChangeUiMode(UIMode.AUDIT); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${uiMode === UIMode.AUDIT ? 'bg-teal-600 text-white' : 'hover:bg-slate-50'}`}><Scale size={18}/><span className="text-sm font-bold">Forensic Audit</span></button>
                      <button onClick={() => { setActiveTab('field-mgmt'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'field-mgmt' ? 'bg-teal-600 text-white' : 'hover:bg-slate-50'}`}><Settings size={18}/><span className="text-sm font-bold">Global Settings</span></button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => { onEnterKiosk?.(); setIsSidebarOpen(false); }}
                className="w-full py-4 bg-lilac-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-lilac-600/20"
              >
                <Monitor size={18}/> Launch Patient Kiosk
              </button>
            </div>
          </div>
        </>
      )}

      <UserProfileModal user={currentUser} isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onSave={onSwitchUser} fieldSettings={fieldSettings} />
    </div>
  );
};

export default Layout;
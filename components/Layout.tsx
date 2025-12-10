

import React, { useState } from 'react';
import { Calendar, Users, LayoutDashboard, Menu, X, PlusCircle, ChevronDown, UserCircle, Settings, Sliders, MapPin, FileText, Download, ClipboardCheck, CheckCircle, Circle, Flag, Monitor } from 'lucide-react';
import UserProfileModal from './UserProfileModal';
import { User, Appointment, Patient, UserRole, FieldSettings, PinboardTask } from '../types';

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
  onEnterKioskMode?: () => void; // Added
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, onAddAppointment, currentUser, onSwitchUser, staff,
  currentBranch, availableBranches, onChangeBranch, fieldSettings, onGenerateReport, tasks, onToggleTask, onEnterKioskMode
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Task Notification State
  const [isTaskPopoverOpen, setIsTaskPopoverOpen] = useState(false);

  // FEATURE TOGGLES
  const enableMultiBranch = fieldSettings?.features?.enableMultiBranch ?? true;

  // Filter available branches based on user's allowed branches
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

  // Add Settings tab for Admins so they can access it on Desktop
  if (currentUser.role === UserRole.ADMIN) {
      navItems.push({ id: 'field-mgmt', label: 'Settings', icon: Settings });
  }

  const handleProfileUpdate = (updatedUser: User) => {
      onSwitchUser(updatedUser);
  };

  // Task Logic
  const myActiveTasks = tasks ? tasks.filter(t => t.assignedTo === currentUser.id && !t.isCompleted) : [];
  const badgeCount = myActiveTasks.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      
      {/* Universal Mobile-Style Header */}
      <header className="h-16 bg-teal-900 text-white flex items-center justify-between px-4 shadow-md z-50 sticky top-0">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-lilac-400 rounded-xl flex items-center justify-center shadow-lg shadow-lilac-500/20">
                    <span className="text-white font-bold text-xl">D</span>
                </div>
                <div className="flex flex-col">
                     <span className="font-bold tracking-tight text-lg leading-none">dentsched</span>
                     <span className="text-[11px] text-teal-200 font-bold uppercase tracking-wider leading-none mt-1">Hello {currentUser.name.split(' ')[0]}</span>
                </div>
             </div>
             
             <div className="flex items-center gap-2">
                 {/* TASK NOTIFICATION CENTER */}
                 <div className="relative">
                    <button 
                        onClick={() => setIsTaskPopoverOpen(!isTaskPopoverOpen)}
                        className={`p-2 rounded-full transition-colors relative ${isTaskPopoverOpen ? 'bg-teal-800' : 'active:bg-teal-800'}`}
                        title="My Tasks"
                    >
                        <ClipboardCheck size={24} />
                        {badgeCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-teal-900">
                                {badgeCount}
                            </span>
                        )}
                    </button>

                    {/* Quick View Popover */}
                    {isTaskPopoverOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsTaskPopoverOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 animate-in fade-in zoom-in-95 text-slate-800">
                                <div className="bg-slate-50 border-b border-slate-100 p-3 flex justify-between items-center">
                                    <span className="font-bold text-sm">My Tasks</span>
                                    <span className="text-xs text-slate-500 font-medium">{badgeCount} Active</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto p-2">
                                    {myActiveTasks.length > 0 ? (
                                        <div className="space-y-1">
                                            {myActiveTasks.map(task => (
                                                <div key={task.id} className="flex items-start gap-2 p-2 hover:bg-slate-50 rounded-lg group">
                                                    <button 
                                                        onClick={() => onToggleTask && onToggleTask(task.id)}
                                                        className="mt-0.5 text-slate-300 hover:text-green-500 transition-colors"
                                                    >
                                                        <Circle size={16} />
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium leading-tight text-slate-700">{task.text}</div>
                                                        {task.isUrgent && (
                                                            <div className="mt-1 inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold">
                                                                <Flag size={8} /> Urgent
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center text-slate-400 text-xs italic">
                                            <div className="mb-2"><CheckCircle size={24} className="mx-auto opacity-20"/></div>
                                            No active tasks assigned to you.
                                        </div>
                                    )}
                                </div>
                                <div className="p-2 border-t border-slate-100 bg-slate-50">
                                    <button 
                                        onClick={() => { setActiveTab('dashboard'); setIsTaskPopoverOpen(false); }}
                                        className="w-full py-2 text-center text-xs font-bold text-teal-600 hover:bg-teal-50 rounded-lg"
                                    >
                                        Go to Dashboard Board
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                 </div>

                 <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 active:bg-teal-800 rounded-full transition-colors">
                     {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                 </button>
             </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
            <div className="fixed inset-0 top-16 bg-teal-900/95 backdrop-blur-sm text-white z-40 animate-in slide-in-from-top-5 flex flex-col">
                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    
                    {/* User Info Card */}
                    <div className="bg-teal-800 p-4 rounded-2xl flex items-center gap-4 border border-teal-700">
                        <img src={currentUser.avatar} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-lilac-400" />
                        <div>
                            <div className="font-bold text-lg">{currentUser.name}</div>
                            <div className="text-xs text-teal-200 uppercase font-bold tracking-wider">{currentUser.role}</div>
                        </div>
                    </div>

                    {/* Branch Switcher (Conditional) */}
                    {enableMultiBranch && (
                        <div className="bg-teal-800 p-4 rounded-2xl border border-teal-700">
                            <div className="flex items-center gap-2 text-teal-300 uppercase font-bold text-xs mb-3">
                                <MapPin size={14} /> Current Location
                            </div>
                            <select 
                                value={currentBranch}
                                onChange={(e) => onChangeBranch(e.target.value)}
                                className="w-full bg-teal-900 text-white border border-teal-600 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-lilac-500 shadow-sm"
                            >
                                {userAllowedBranches.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-2 pt-2">
                        <button 
                            onClick={() => { setIsProfileOpen(true); setIsMobileMenuOpen(false); }}
                            className="w-full flex items-center space-x-4 px-4 py-4 rounded-xl bg-teal-800/50 hover:bg-teal-800 border border-teal-700/50 transition-colors"
                        >
                            <div className="bg-teal-700 p-2 rounded-lg"><UserCircle size={20} className="text-white" /></div>
                            <span className="font-bold">Account Profile</span>
                        </button>

                        {/* REPORTS BUTTON (Admin/Dentist Only) */}
                        {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DENTIST) && (
                            <button 
                                onClick={() => { onGenerateReport(); setIsMobileMenuOpen(false); }}
                                className="w-full flex items-center space-x-4 px-4 py-4 rounded-xl bg-teal-800/50 hover:bg-teal-800 border border-teal-700/50 transition-colors"
                            >
                                <div className="bg-teal-700 p-2 rounded-lg"><Download size={20} className="text-white" /></div>
                                <span className="font-bold">Practice Reports</span>
                            </button>
                        )}

                        {/* KIOSK MODE BUTTON (Admin/Dentist/Assistant) */}
                        <button 
                            onClick={() => { onEnterKioskMode && onEnterKioskMode(); setIsMobileMenuOpen(false); }}
                            className="w-full flex items-center space-x-4 px-4 py-4 rounded-xl bg-teal-800/50 hover:bg-teal-800 border border-teal-700/50 transition-colors group"
                        >
                            <div className="bg-lilac-600 p-2 rounded-lg group-hover:scale-110 transition-transform"><Monitor size={20} className="text-white" /></div>
                            <span className="font-bold">Enter Kiosk Mode</span>
                        </button>
                    </div>
                    
                    {/* Demo User Switcher (Hidden in prod usually, but kept for demo) */}
                    <div className="mt-8 border-t border-teal-800 pt-6">
                        <div className="text-xs font-bold text-teal-500 uppercase mb-4 px-2">Switch Account (Demo)</div>
                        <div className="grid grid-cols-1 gap-2">
                            {staff.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => { onSwitchUser(u); setIsMobileMenuOpen(false); }}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm flex items-center gap-3 ${u.id === currentUser.id ? 'bg-teal-800 border border-teal-600 shadow-sm' : 'hover:bg-teal-800/50'}`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${u.id === currentUser.id ? 'bg-lilac-400' : 'bg-slate-500'}`}></div>
                                    <span className={u.id === currentUser.id ? 'font-bold text-white' : 'text-teal-200'}>{u.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 relative">
        <div className={`flex-1 ${activeTab === 'schedule' ? 'overflow-hidden flex flex-col p-2' : 'overflow-auto p-4'} pb-24`}>
            {children}
        </div>
      </main>

      {/* Universal Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 z-40 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
            {navItems.map((item) => (
            <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center p-2 rounded-2xl transition-all duration-300 ${activeTab === item.id ? 'text-teal-600 -translate-y-1' : 'text-slate-400'}`}
            >
                <div className={`p-1.5 rounded-xl mb-1 transition-colors ${activeTab === item.id ? 'bg-teal-50' : 'bg-transparent'}`}>
                    <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-bold ${activeTab === item.id ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{item.label}</span>
            </button>
            ))}
      </div>

      <UserProfileModal 
        user={currentUser} 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        onSave={handleProfileUpdate}
        fieldSettings={fieldSettings}
      />
    </div>
  );
};

export default Layout;


import React, { useState } from 'react';
import { Calendar, Users, LayoutDashboard, Menu, X, PlusCircle, ChevronDown, UserCircle, Settings, Sliders, Sparkles } from 'lucide-react';
import GeminiAssistant from './GeminiAssistant';
import UserProfileModal from './UserProfileModal';
import { User, Appointment, Patient, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddAppointment: () => void;
  currentUser: User;
  onSwitchUser: (user: User) => void;
  staff: User[];
  appointments: Appointment[]; // Added for AI Context
  patients: Patient[]; // Added for AI Context
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, onAddAppointment, currentUser, onSwitchUser, staff, appointments, patients
}) => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
  ];

  const handleUserSwitch = (user: User) => {
      onSwitchUser(user);
      setIsUserMenuOpen(false);
  };

  const handleProfileUpdate = (updatedUser: User) => {
      // Calls parent to update global state
      onSwitchUser(updatedUser);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-teal-900 text-teal-50 shadow-xl z-20 sticky top-0 h-screen">
        <div className="p-6 flex items-center space-x-2">
          <div className="w-8 h-8 bg-lilac-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <span className="text-2xl font-bold tracking-tight">dentsched</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-teal-700 text-white shadow-lg shadow-teal-900/20' 
                  : 'text-teal-200 hover:bg-teal-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
          
          {/* Field Management Link (Desktop) - ADMIN ONLY */}
          {currentUser.role === UserRole.ADMIN && (
              <button
                  onClick={() => setActiveTab('field-mgmt')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === 'field-mgmt' 
                      ? 'bg-teal-700 text-white shadow-lg shadow-teal-900/20' 
                      : 'text-teal-200 hover:bg-teal-800 hover:text-white'
                  }`}
                >
                  <Sliders size={20} />
                  <span className="font-medium">Field Mgmt</span>
              </button>
          )}
          
          <button 
                onClick={onAddAppointment}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-teal-200 hover:bg-teal-800 hover:text-white mt-4 border border-teal-700/50"
            >
                <PlusCircle size={20} />
                <span className="font-medium">New Appointment</span>
            </button>
        </nav>

        <div className="p-4 space-y-4">
           {/* User Switcher for Demo */}
           <div className="relative">
                <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-teal-800 transition-colors"
                >
                    <img src={currentUser.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-teal-200" />
                    <div className="flex-1 text-left overflow-hidden">
                        <div className="text-sm font-bold truncate">{currentUser.name}</div>
                        <div className="text-xs text-teal-300 truncate">{currentUser.role}</div>
                    </div>
                    <ChevronDown size={16} className="text-teal-400" />
                </button>

                {isUserMenuOpen && (
                    <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200 text-slate-800 z-50 animate-in fade-in slide-in-from-bottom-2">
                        <div className="p-2 border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Switch User (Demo)
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            {staff.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => handleUserSwitch(u)}
                                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 ${u.id === currentUser.id ? 'bg-teal-50 text-teal-700 font-bold' : ''}`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${u.id === currentUser.id ? 'bg-teal-500' : 'bg-slate-300'}`}></div>
                                    {u.name}
                                </button>
                            ))}
                        </div>
                        <div className="border-t border-slate-100 p-1">
                             <button 
                                onClick={() => { setIsProfileOpen(true); setIsUserMenuOpen(false); }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 rounded-lg"
                             >
                                 <UserCircle size={16} /> My Profile
                             </button>
                        </div>
                    </div>
                )}
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 relative">
        {/* Mobile Header - High Z-Index to stay on top */}
        <header className="md:hidden h-16 bg-teal-900 text-white flex items-center justify-between px-4 shadow-md z-50 relative">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-lilac-400 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">D</span>
                </div>
                <span className="font-bold tracking-tight text-lg">dentsched</span>
             </div>
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
                 {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
             </button>
        </header>

        {/* Mobile Menu Overlay - Z-Index 40 to cover Dashboard (z-20) */}
        {isMobileMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-teal-900 text-white z-40 shadow-xl border-t border-teal-800 animate-in slide-in-from-top-5">
                <div className="p-4 space-y-2">
                    {/* Navigation Items - Updated per request */}
                    <button 
                        onClick={() => { setIsProfileOpen(true); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-teal-800 transition-colors"
                    >
                        <UserCircle size={20} className="text-teal-200" />
                        <span className="font-medium">Account Profile</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-teal-800 transition-colors">
                        <Settings size={20} className="text-teal-200" />
                        <span className="font-medium">Settings</span>
                    </button>
                    
                    {/* Field Mgmt Mobile - ADMIN ONLY */}
                    {currentUser.role === UserRole.ADMIN && (
                        <button 
                            onClick={() => { setActiveTab('field-mgmt'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-teal-800 transition-colors ${activeTab === 'field-mgmt' ? 'bg-teal-800 text-white' : ''}`}
                        >
                            <Sliders size={20} className="text-teal-200" />
                            <span className="font-medium">Field Mgmt</span>
                        </button>
                    )}

                    <div className="pt-4 border-t border-teal-800 mt-2">
                        <div className="flex items-center gap-3 px-4 py-2">
                            <img src={currentUser.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-teal-200" />
                            <div>
                                <div className="font-bold">{currentUser.name}</div>
                                <div className="text-xs text-teal-300">{currentUser.role}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-8">
            {children}
        </div>

        {/* Mobile Tab Bar (Navigation) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 z-40 flex justify-around items-center pb-safe">
             {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === item.id ? 'text-teal-600' : 'text-slate-400'}`}
                >
                    <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                    <span className="text-[10px] font-medium mt-1">{item.label}</span>
                </button>
             ))}
        </div>

        {/* Assistant Button */}
        <button 
            onClick={() => setIsAssistantOpen(!isAssistantOpen)}
            className="fixed bottom-20 left-4 md:bottom-8 md:left-auto md:right-8 bg-teal-800 hover:bg-teal-700 text-white p-3 md:px-5 md:py-3 rounded-full md:rounded-2xl shadow-lg shadow-teal-900/20 z-30 flex items-center gap-2 transition-transform hover:scale-105"
        >
            <Sparkles size={20} className="text-yellow-300" />
            <span className="hidden md:inline font-bold">Ask AI Assistant</span>
        </button>

        {/* Modals */}
        {isAssistantOpen && (
            <GeminiAssistant 
                onClose={() => setIsAssistantOpen(false)} 
                appointments={appointments}
                patients={patients}
                staff={staff}
            />
        )}
        
        <UserProfileModal 
            user={currentUser} 
            isOpen={isProfileOpen} 
            onClose={() => setIsProfileOpen(false)} 
            onSave={handleProfileUpdate}
        />
      </main>
    </div>
  );
};

export default Layout;


import React, { useState } from 'react';
import { Calendar, Users, LayoutDashboard, MessageSquare, Menu, X, PlusCircle, LogOut, ChevronDown } from 'lucide-react';
import GeminiAssistant from './GeminiAssistant';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddAppointment: () => void;
  currentUser: User;
  onSwitchUser: (user: User) => void;
  staff: User[];
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, onAddAppointment, currentUser, onSwitchUser, staff 
}) => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
  ];

  const handleUserSwitch = (user: User) => {
      onSwitchUser(user);
      setIsUserMenuOpen(false);
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
        </nav>

        <div className="p-4 space-y-4">
           <button 
             onClick={onAddAppointment}
             className="w-full bg-lilac-500 hover:bg-lilac-600 text-white py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-transform active:scale-95"
           >
             <PlusCircle size={20} />
             <span>New Appointment</span>
           </button>

           {/* User Switcher for Demo */}
           <div className="relative">
                <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-teal-800 hover:bg-teal-700 transition-colors text-left"
                >
                    <img src={currentUser.avatar} alt="User" className="w-8 h-8 rounded-full border border-teal-200" />
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{currentUser.name}</div>
                        <div className="text-xs text-teal-200 truncate">{currentUser.role}</div>
                    </div>
                    <ChevronDown size={16} className="text-teal-200" />
                </button>

                {isUserMenuOpen && (
                    <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-xl overflow-hidden py-1 max-h-60 overflow-y-auto">
                        <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">Switch User (Demo)</div>
                        {staff.slice(0, 6).map(user => (
                            <button
                                key={user.id}
                                onClick={() => handleUserSwitch(user)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                            >
                                <div className={`w-2 h-2 rounded-full ${user.role === 'Administrator' ? 'bg-red-500' : user.role === 'Dentist' ? 'bg-teal-500' : 'bg-lilac-500'}`} />
                                <div>
                                    <div className="text-sm font-medium text-slate-800">{user.name}</div>
                                    <div className="text-xs text-slate-500">{user.role}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
           </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-teal-900 text-white p-4 sticky top-0 z-30 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-2">
           <div className="w-8 h-8 bg-lilac-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">D</span>
          </div>
          <span className="text-xl font-bold">dentsched</span>
        </div>
        <div className="flex items-center gap-2">
             <img src={currentUser.avatar} alt="User" className="w-8 h-8 rounded-full border border-teal-200" />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
      </header>
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-teal-900 z-20 pt-20 px-4 animate-in fade-in slide-in-from-top-10">
           <nav className="space-y-4">
             <div className="bg-teal-800 p-4 rounded-xl flex items-center gap-3 mb-6">
                 <img src={currentUser.avatar} alt="User" className="w-12 h-12 rounded-full border-2 border-lilac-400" />
                 <div>
                     <div className="font-bold text-white text-lg">{currentUser.name}</div>
                     <div className="text-teal-200">{currentUser.role}</div>
                 </div>
             </div>

            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-4 px-6 py-4 rounded-xl text-lg ${
                  activeTab === item.id 
                    ? 'bg-teal-800 text-white font-bold' 
                    : 'text-teal-200'
                }`}
              >
                <item.icon size={24} />
                <span>{item.label}</span>
              </button>
            ))}
             <button 
             onClick={() => {
                 onAddAppointment();
                 setIsMobileMenuOpen(false);
             }}
             className="w-full bg-lilac-500 text-white py-4 px-6 rounded-xl flex items-center justify-center space-x-2 mt-8 font-bold"
           >
             <PlusCircle size={24} />
             <span>New Appointment</span>
           </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
           {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 flex justify-around p-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center p-2 rounded-lg w-full ${
              activeTab === item.id ? 'text-teal-600' : 'text-slate-400'
            }`}
          >
            <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Floating Action Button for AI Assistant */}
      <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40">
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center group"
          aria-label="Open AI Assistant"
        >
          <MessageSquare size={28} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* AI Assistant Modal */}
      {isAssistantOpen && (
        <GeminiAssistant onClose={() => setIsAssistantOpen(false)} />
      )}
    </div>
  );
};

export default Layout;

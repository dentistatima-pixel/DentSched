
import React, { useState } from 'react';
import { Calendar, Users, LayoutDashboard, Menu, X, PlusCircle, ChevronDown, UserCircle, Settings, Sliders, MapPin } from 'lucide-react';
import UserProfileModal from './UserProfileModal';
import { User, Appointment, Patient, UserRole, FieldSettings } from '../types';

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
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, onAddAppointment, currentUser, onSwitchUser, staff,
  currentBranch, availableBranches, onChangeBranch, fieldSettings
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

  const handleProfileUpdate = (updatedUser: User) => {
      onSwitchUser(updatedUser);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      
      {/* Universal Mobile-Style Header */}
      <header className="h-16 bg-teal-900 text-white flex items-center justify-between px-4 shadow-md z-50 sticky top-0">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-lilac-400 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">D</span>
                </div>
                <span className="font-bold tracking-tight text-lg">dentsched</span>
             </div>
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 active:bg-teal-800 rounded-full transition-colors">
                 {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
             </button>
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
                        
                        {/* Settings / Field Mgmt Link - ADMIN ONLY */}
                        {currentUser.role === UserRole.ADMIN && (
                            <button 
                                onClick={() => { setActiveTab('field-mgmt'); setIsMobileMenuOpen(false); }}
                                className={`w-full flex items-center space-x-4 px-4 py-4 rounded-xl transition-colors ${activeTab === 'field-mgmt' ? 'bg-lilac-600 text-white shadow-lg' : 'bg-teal-800/50 hover:bg-teal-800 border border-teal-700/50'}`}
                            >
                                <div className={`${activeTab === 'field-mgmt' ? 'bg-lilac-500' : 'bg-teal-700'} p-2 rounded-lg`}><Settings size={20} className="text-white" /></div>
                                <span className="font-bold">System Settings</span>
                            </button>
                        )}
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
        <div className="flex-1 overflow-auto p-4 pb-24">
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

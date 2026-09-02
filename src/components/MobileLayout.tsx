
import React, { FC } from 'react';
import { Calendar, Plus, User, LogOut } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

interface MobileLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileLayout: FC<MobileLayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { logout, currentUser } = useAppContext();

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Mobile Header */}
      <header className="bg-teal-900 text-white p-4 shrink-0 flex justify-between items-center shadow-md">
        <div className="flex flex-col">
          <span className="font-black uppercase tracking-widest text-xs opacity-70">DentSched Mobile</span>
          <span className="font-bold text-lg leading-none">{currentUser?.name || 'User'}</span>
        </div>
        <button onClick={logout} className="p-2 bg-white/10 rounded-lg">
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-20 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
        <button 
          onClick={() => onTabChange('schedule')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'schedule' ? 'text-teal-600' : 'text-slate-400'}`}
        >
          <Calendar size={24} strokeWidth={activeTab === 'schedule' ? 3 : 2} />
          <span className="text-[10px] font-black uppercase tracking-widest">Schedule</span>
        </button>
        
        <button 
          onClick={() => onTabChange('new-appointment')}
          className="flex flex-col items-center justify-center -mt-10 w-16 h-16 bg-teal-600 text-white rounded-full shadow-xl shadow-teal-600/40 border-4 border-white active:scale-95 transition-all"
        >
          <Plus size={32} strokeWidth={3} />
        </button>

        <button 
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-teal-600' : 'text-slate-400'}`}
        >
          <User size={24} strokeWidth={activeTab === 'profile' ? 3 : 2} />
          <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
        </button>
      </nav>
    </div>
  );
};

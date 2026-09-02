
import { FC } from 'react';
import { 
  User, Settings, Shield, Bell, HelpCircle, 
  ChevronRight, LogOut, CreditCard, MapPin, 
  Phone, Mail, Star
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export const MobileProfileView: FC = () => {
  const { currentUser, logout, currentBranch } = useAppContext();

  const menuItems = [
    { icon: <Settings size={20} />, label: 'Settings', color: 'text-blue-600 bg-blue-50' },
    { icon: <CreditCard size={20} />, label: 'Billing', color: 'text-teal-600 bg-teal-50' },
    { icon: <Shield size={20} />, label: 'Security', color: 'text-purple-600 bg-purple-50' },
    { icon: <Bell size={20} />, label: 'Notifications', color: 'text-orange-600 bg-orange-50' },
    { icon: <HelpCircle size={20} />, label: 'Help & Support', color: 'text-slate-600 bg-slate-50' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-teal-600/5 -z-10"></div>
        <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-teal-600 mb-4 border-4 border-white relative">
          <User size={48} strokeWidth={1.5} />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg">
            <Star size={14} fill="currentColor" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">{currentUser?.name || 'User'}</h2>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">{currentUser?.role || 'Staff'}</p>
        
        <div className="flex gap-2 w-full mt-4">
          <div className="flex-1 bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Branch</span>
            <span className="text-xs font-bold text-slate-700">{currentBranch || 'Main'}</span>
          </div>
          <div className="flex-1 bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">ID</span>
            <span className="text-xs font-bold text-slate-700">#{currentUser?.id?.substring(0, 6) || '000000'}</span>
          </div>
        </div>
      </div>

      {/* Info List */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="flex items-center gap-4 p-3">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
            <Mail size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</span>
            <span className="text-sm font-bold text-slate-700">{currentUser?.email || 'N/A'}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 p-3">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
            <Phone size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</span>
            <span className="text-sm font-bold text-slate-700">+63 912 345 6789</span>
          </div>
        </div>
        <div className="flex items-center gap-4 p-3">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
            <MapPin size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location</span>
            <span className="text-sm font-bold text-slate-700">Manila, Philippines</span>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 flex flex-col">
        {menuItems.map((item, idx) => (
          <button 
            key={idx}
            className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                {item.icon}
              </div>
              <span className="text-sm font-bold text-slate-700">{item.label}</span>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <button 
        onClick={logout}
        className="w-full p-5 bg-red-50 text-red-600 rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 border border-red-100 active:scale-95 transition-all mb-8"
      >
        <LogOut size={18} />
        Log Out
      </button>
    </div>
  );
};

import React from 'react';
import { DollarSign, Package, ChevronRight, History, Send, Users2, UserX } from 'lucide-react';

interface AdminHubProps {
  onNavigate: (tab: 'financials' | 'inventory' | 'recall' | 'referrals' | 'roster' | 'leave') => void;
}

const AdminHub: React.FC<AdminHubProps> = ({ onNavigate }) => {
  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">Administration Hub</h1>
        <p className="text-lg text-slate-500 mt-2 font-medium">Select a module to manage practice resources.</p>
      </div>

      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Financials Card */}
        <button
          onClick={() => onNavigate('financials')}
          className="bg-white p-10 rounded-[3rem] border-4 border-teal-100 shadow-2xl hover:border-teal-500 transition-all group hover:-translate-y-2 text-left"
        >
          <div className="flex items-start justify-between">
            <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-6 group-hover:bg-teal-600 group-hover:text-white transition-all">
              <DollarSign size={40} />
            </div>
            <div className="p-4 bg-slate-100 rounded-full group-hover:bg-teal-600 transition-all">
                <ChevronRight size={24} className="text-slate-400 group-hover:text-white transition-all transform group-hover:translate-x-1" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-teal-900 uppercase tracking-tighter">Financials</h3>
          <p className="text-slate-500 mt-2 font-medium">Manage claims, expenses, and practitioner payroll.</p>
        </button>

        {/* Inventory Card */}
        <button
          onClick={() => onNavigate('inventory')}
          className="bg-white p-10 rounded-[3rem] border-4 border-lilac-100 shadow-2xl hover:border-lilac-500 transition-all group hover:-translate-y-2 text-left"
        >
          <div className="flex items-start justify-between">
            <div className="w-20 h-20 bg-lilac-50 text-lilac-600 rounded-full flex items-center justify-center mb-6 group-hover:bg-lilac-600 group-hover:text-white transition-all">
              <Package size={40} />
            </div>
             <div className="p-4 bg-slate-100 rounded-full group-hover:bg-lilac-600 transition-all">
                <ChevronRight size={24} className="text-slate-400 group-hover:text-white transition-all transform group-hover:translate-x-1" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-lilac-900 uppercase tracking-tighter">Inventory & Sterilization</h3>
          <p className="text-slate-500 mt-2 font-medium">Track stock levels and manage sterilization cycles.</p>
        </button>

        {/* Recall Center Card */}
        <button
          onClick={() => onNavigate('recall')}
          className="bg-white p-10 rounded-[3rem] border-4 border-blue-100 shadow-2xl hover:border-blue-500 transition-all group hover:-translate-y-2 text-left"
        >
          <div className="flex items-start justify-between">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <History size={40} />
            </div>
             <div className="p-4 bg-slate-100 rounded-full group-hover:bg-blue-600 transition-all">
                <ChevronRight size={24} className="text-slate-400 group-hover:text-white transition-all transform group-hover:translate-x-1" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">Recall Center</h3>
          <p className="text-slate-500 mt-2 font-medium">Manage patient retention and follow-up schedules.</p>
        </button>
        
        {/* Referral Hub Card */}
        <button
          onClick={() => onNavigate('referrals')}
          className="bg-white p-10 rounded-[3rem] border-4 border-amber-100 shadow-2xl hover:border-amber-500 transition-all group hover:-translate-y-2 text-left"
        >
          <div className="flex items-start justify-between">
            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-6 group-hover:bg-amber-600 group-hover:text-white transition-all">
              <Send size={40} />
            </div>
             <div className="p-4 bg-slate-100 rounded-full group-hover:bg-amber-600 transition-all">
                <ChevronRight size={24} className="text-slate-400 group-hover:text-white transition-all transform group-hover:translate-x-1" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-amber-900 uppercase tracking-tighter">Referral Hub</h3>
          <p className="text-slate-500 mt-2 font-medium">Monitor incoming patient sources and outgoing specialist referrals.</p>
        </button>

        {/* Roster Card */}
        <button
          onClick={() => onNavigate('roster')}
          className="bg-white p-10 rounded-[3rem] border-4 border-sky-100 shadow-2xl hover:border-sky-500 transition-all group hover:-translate-y-2 text-left"
        >
          <div className="flex items-start justify-between">
            <div className="w-20 h-20 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mb-6 group-hover:bg-sky-600 group-hover:text-white transition-all">
              <Users2 size={40} />
            </div>
             <div className="p-4 bg-slate-100 rounded-full group-hover:bg-sky-600 transition-all">
                <ChevronRight size={24} className="text-slate-400 group-hover:text-white transition-all transform group-hover:translate-x-1" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-sky-900 uppercase tracking-tighter">Staff Roster</h3>
          <p className="text-slate-500 mt-2 font-medium">Manage weekly schedules and on-call assignments.</p>
        </button>

        {/* Leave & Shift Mgt Card */}
        <button
          onClick={() => onNavigate('leave')}
          className="bg-white p-10 rounded-[3rem] border-4 border-rose-100 shadow-2xl hover:border-rose-500 transition-all group hover:-translate-y-2 text-left"
        >
          <div className="flex items-start justify-between">
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-6 group-hover:bg-rose-600 group-hover:text-white transition-all">
              <UserX size={40} />
            </div>
             <div className="p-4 bg-slate-100 rounded-full group-hover:bg-rose-600 transition-all">
                <ChevronRight size={24} className="text-slate-400 group-hover:text-white transition-all transform group-hover:translate-x-1" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-900 uppercase tracking-tighter">Leave &amp; Shift Mgt</h3>
          <p className="text-slate-500 mt-2 font-medium">Manage time-off requests and daily staffing roster.</p>
        </button>
      </div>
    </div>
  );
};

export default AdminHub;


import React from 'react';
import { DollarSign, Package, ChevronRight } from 'lucide-react';

interface AdminHubProps {
  onNavigate: (tab: 'financials' | 'inventory') => void;
}

const AdminHub: React.FC<AdminHubProps> = ({ onNavigate }) => {
  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">Administration Hub</h1>
        <p className="text-lg text-slate-500 mt-2 font-medium">Select a module to manage practice resources.</p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
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
      </div>
    </div>
  );
};

export default AdminHub;

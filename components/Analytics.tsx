
import React from 'react';
import { BarChart2, DollarSign, Users, Activity } from 'lucide-react';

interface AnalyticsProps {
  // Props will be added to feed data from App.tsx
}

const Analytics: React.FC<AnalyticsProps> = () => {

  const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string, icon: React.ElementType, colorClass: string}) => (
    <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4`}>
        <div className={`p-3 rounded-xl ${colorClass}`}>
            <Icon size={24} className="text-white"/>
        </div>
        <div>
            <span className="block text-sm font-bold text-slate-500">{title}</span>
            <span className="text-3xl font-bold text-slate-800">{value}</span>
        </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex-shrink-0">
        <div className="flex items-center gap-3">
            <div className="bg-lilac-100 p-3 rounded-2xl text-lilac-700">
                <BarChart2 size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Practice Analytics</h1>
                <p className="text-slate-500">High-level overview of clinic performance and growth.</p>
            </div>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Revenue (YTD)" value="₱1,250,400" icon={DollarSign} colorClass="bg-emerald-500" />
        <StatCard title="New Patients (YTD)" value="245" icon={Users} colorClass="bg-blue-500" />
        <StatCard title="Avg. Revenue / Visit" value="₱2,800" icon={Activity} colorClass="bg-lilac-500" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-bold text-lg mb-4">Revenue by Month</h3>
              <div className="flex items-center justify-center h-full bg-slate-50 rounded-lg text-slate-400 italic">
                  Monthly Revenue Chart Placeholder
              </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-bold text-lg mb-4">Procedure Mix</h3>
              <div className="flex items-center justify-center h-full bg-slate-50 rounded-lg text-slate-400 italic">
                  Procedure Breakdown Chart Placeholder
              </div>
          </div>
      </div>
    </div>
  );
};

export default Analytics;

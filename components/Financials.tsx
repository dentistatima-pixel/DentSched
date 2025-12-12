
import React, { useState } from 'react';
import { DollarSign, FileText, Package, BarChart2 } from 'lucide-react';
import { HMOClaim, Expense } from '../types';

interface FinancialsProps {
  claims: HMOClaim[];
  expenses: Expense[];
  // Add more props for receipts etc. as needed
}

const Financials: React.FC<FinancialsProps> = ({ claims, expenses }) => {
  const [activeTab, setActiveTab] = useState<'claims' | 'receipts' | 'expenses'>('claims');

  const tabs = [
    { id: 'claims', label: 'HMO Claims', icon: FileText },
    { id: 'receipts', label: 'BIR Receipts', icon: FileText },
    { id: 'expenses', label: 'Clinic Expenses', icon: Package },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'claims':
        return <div>HMO Claims Management Content</div>;
      case 'receipts':
        return <div>BIR Official Receipts Content</div>;
      case 'expenses':
        return <div>Clinic Expenses Tracking Content</div>;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex-shrink-0">
        <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-700">
                <DollarSign size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Financial Command Center</h1>
                <p className="text-slate-500">Manage claims, compliance, and operational costs.</p>
            </div>
        </div>
      </header>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-4">
            {tabs.map(tab => (
                 <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)} 
                    className={`py-4 px-4 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap
                    ${activeTab === tab.id ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    <tab.icon size={16} /> {tab.label}
                </button>
            ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Financials;

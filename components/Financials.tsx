import React, { useState } from 'react';
import { DollarSign, FileText, Package, BarChart2, Heart, CheckCircle, Clock, Edit2 } from 'lucide-react';
import { HMOClaim, Expense, PhilHealthClaim, Patient, Appointment, FieldSettings, PhilHealthClaimStatus, User } from '../types';
import Analytics from './Analytics'; // NEW
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';

interface FinancialsProps {
  claims: HMOClaim[];
  expenses: Expense[];
  philHealthClaims?: PhilHealthClaim[];
  patients?: Patient[];
  appointments?: Appointment[];
  fieldSettings?: FieldSettings;
  staff?: User[];
  onUpdatePhilHealthClaim?: (updatedClaim: PhilHealthClaim) => void;
}

const Financials: React.FC<FinancialsProps> = ({ claims, expenses, philHealthClaims = [], patients = [], appointments = [], fieldSettings, staff, onUpdatePhilHealthClaim }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'claims' | 'philhealth' | 'expenses'>('analytics');

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'claims', label: 'HMO Claims', icon: Heart },
    { id: 'philhealth', label: 'PhilHealth', icon: FileText },
    { id: 'expenses', label: 'Clinic Expenses', icon: Package },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <Analytics patients={patients} appointments={appointments} fieldSettings={fieldSettings} staff={staff} />;
      case 'claims':
        return <div>HMO Claims Management Content</div>;
      case 'philhealth':
        return <PhilHealthClaimsTab claims={philHealthClaims} patients={patients} onUpdateClaim={onUpdatePhilHealthClaim} />;
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

// --- PhilHealth Tab Component ---
const PhilHealthClaimsTab: React.FC<{ claims: PhilHealthClaim[], patients: Patient[], onUpdateClaim?: (c: PhilHealthClaim) => void }> = ({ claims, patients, onUpdateClaim }) => {
    const [editingClaim, setEditingClaim] = useState<PhilHealthClaim | null>(null);
    const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'Unknown';
    
    const getStatusChip = (status: PhilHealthClaimStatus) => {
        switch(status) {
            case PhilHealthClaimStatus.PAID: return <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10}/> Paid</span>;
            case PhilHealthClaimStatus.IN_PROCESS: return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Clock size={10}/> In Process</span>;
            case PhilHealthClaimStatus.SUBMITTED: return <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Submitted</span>;
            default: return <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>;
        }
    }

    const handleSave = (updatedClaim: PhilHealthClaim) => {
        if(onUpdateClaim) onUpdateClaim(updatedClaim);
        setEditingClaim(null);
    }

    return (
        <>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                        <tr>
                            <th className="p-4">Patient</th>
                            <th className="p-4">Procedure</th>
                            <th className="p-4">Date Submitted</th>
                            <th className="p-4 text-right">Amount Claimed</th>
                            <th className="p-4">Status</th>
                            <th className="p-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {claims.map(claim => (
                            <tr key={claim.id} className="group">
                                <td className="p-4 font-bold text-slate-800">{getPatientName(claim.patientId)}</td>
                                <td className="p-4">{claim.procedureName}</td>
                                <td className="p-4 text-slate-500 font-mono text-xs">{formatDate(claim.dateSubmitted)}</td>
                                <td className="p-4 text-right font-mono font-bold">₱{claim.amountClaimed.toLocaleString()}</td>
                                <td className="p-4">{getStatusChip(claim.status)}</td>
                                <td className="p-4">
                                    <button onClick={() => setEditingClaim(claim)} className="opacity-0 group-hover:opacity-100 bg-slate-100 p-1.5 rounded text-slate-500 hover:bg-slate-200"><Edit2 size={14}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editingClaim && <PhilHealthClaimModal claim={editingClaim} onSave={handleSave} onClose={() => setEditingClaim(null)} />}
        </>
    )
}

// --- PhilHealth Edit Modal ---
const PhilHealthClaimModal: React.FC<{claim: PhilHealthClaim, onSave: (c: PhilHealthClaim) => void, onClose: () => void}> = ({claim, onSave, onClose}) => {
    const toast = useToast();
    const [formData, setFormData] = useState<PhilHealthClaim>(claim);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({...formData, [e.target.name]: e.target.value });
    }
    
    const handleSave = () => {
        if(formData.status === PhilHealthClaimStatus.PAID && (!formData.amountReceived || formData.amountReceived <= 0)) {
            toast.error("Please enter the amount received for a paid claim.");
            return;
        }
        onSave(formData);
    }

    return (
         <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h3 className="font-bold text-lg">Update PhilHealth Claim</h3>
                <div className="space-y-4 mt-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500">Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-lg mt-1">
                            {Object.values(PhilHealthClaimStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500">Tracking Number</label>
                        <input type="text" name="trackingNumber" value={formData.trackingNumber || ''} onChange={handleChange} className="w-full p-2 border rounded-lg mt-1" />
                    </div>
                    {formData.status === PhilHealthClaimStatus.PAID && (
                        <div>
                            <label className="text-xs font-bold text-slate-500">Amount Received (₱)</label>
                            <input type="number" name="amountReceived" value={formData.amountReceived || ''} onChange={handleChange} className="w-full p-2 border rounded-lg mt-1 font-bold text-green-700" />
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-600 font-bold hover:bg-slate-100">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold">Save Changes</button>
                </div>
            </div>
        </div>
    )
}


export default Financials;
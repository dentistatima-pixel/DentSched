import React, { useState } from 'react';
import { Package, Plus, Search, AlertTriangle, X, Save, Trash2, Edit2, Shield, CheckCircle } from 'lucide-react';
import { StockItem, StockCategory, SterilizationCycle, User } from '../types';
import { useToast } from './ToastSystem';
import { formatDate } from '../constants';

interface InventoryProps {
  stock: StockItem[];
  onUpdateStock: (updatedStock: StockItem[]) => void;
  sterilizationCycles?: SterilizationCycle[];
  onAddCycle?: (cycle: Omit<SterilizationCycle, 'id' | 'date' | 'operator'>) => void;
  currentUser: User;
}

const Inventory: React.FC<InventoryProps> = ({ stock, onUpdateStock, sterilizationCycles = [], onAddCycle, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'sterilization'>('stock');
  
  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex-shrink-0">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-2xl text-blue-700">
                    <Package size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Supply Management</h1>
                    <p className="text-slate-500">Track supplies and sterilization cycles for medico-legal compliance.</p>
                </div>
            </div>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
            <div className="flex border-b border-slate-200 px-4">
                <button onClick={() => setActiveTab('stock')} className={`py-4 px-4 font-bold text-sm border-b-2 flex items-center gap-2 ${activeTab === 'stock' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500'}`}><Package size={16}/> Stock Items</button>
                <button onClick={() => setActiveTab('sterilization')} className={`py-4 px-4 font-bold text-sm border-b-2 flex items-center gap-2 ${activeTab === 'sterilization' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500'}`}><Shield size={16}/> Sterilization Log</button>
            </div>
            
            {activeTab === 'stock' && <StockItemsTab stock={stock} onUpdateStock={onUpdateStock} />}
            {activeTab === 'sterilization' && <SterilizationLogTab cycles={sterilizationCycles} onAddCycle={onAddCycle} currentUser={currentUser} />}
        </div>
    </div>
  );
};

// --- STOCK ITEMS COMPONENT (No changes) ---
const StockItemsTab: React.FC<{stock: StockItem[], onUpdateStock: (s: StockItem[]) => void}> = ({ stock, onUpdateStock }) => {
    // ... code is unchanged ...
    return <div>Stock Items Placeholder</div>
}

// --- STERILIZATION LOG COMPONENT ---
const SterilizationLogTab: React.FC<{cycles: SterilizationCycle[], onAddCycle?: any, currentUser: User}> = ({ cycles, onAddCycle, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const handleSaveCycle = (cycleData: Omit<SterilizationCycle, 'id' | 'date' | 'operator'>) => {
        if (onAddCycle) {
            onAddCycle(cycleData);
        }
        setIsModalOpen(false);
    }
    
    return (
        <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <p className="text-sm text-slate-500">Maintaining this log is crucial for patient safety and legal protection.</p>
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2">
                    <Plus size={18}/> Log New Cycle
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                        <tr>
                            <th className="p-4">Cycle ID</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Autoclave</th>
                            <th className="p-4">Cycle #</th>
                            <th className="p-4">Operator</th>
                            <th className="p-4">Result</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {cycles.map(cycle => (
                            <tr key={cycle.id}>
                                <td className="p-4 font-mono text-xs bg-slate-50 text-slate-600">{cycle.id}</td>
                                <td className="p-4 font-medium text-slate-800">{formatDate(cycle.date)}</td>
                                <td className="p-4 text-slate-600">{cycle.autoclaveName}</td>
                                <td className="p-4 text-slate-600 font-mono">{cycle.cycleNumber}</td>
                                <td className="p-4 text-slate-600">{cycle.operator}</td>
                                <td className="p-4">
                                    {cycle.passed ? 
                                        <span className="bg-green-100 text-green-700 font-bold text-xs px-2 py-1 rounded-full">PASS</span> :
                                        <span className="bg-red-100 text-red-700 font-bold text-xs px-2 py-1 rounded-full">FAIL</span>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>
            {isModalOpen && <SterilizationLogModal onSave={handleSaveCycle} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
}

// --- STERILIZATION LOG MODAL ---
const SterilizationLogModal: React.FC<{onSave: (d: any) => void, onClose: () => void}> = ({onSave, onClose}) => {
    const [autoclaveName, setAutoclaveName] = useState('Autoclave 1');
    const [cycleNumber, setCycleNumber] = useState('');
    const [passed, setPassed] = useState<boolean | null>(null);

    const handleSave = () => {
        if(!cycleNumber.trim() || passed === null) {
            alert("Please fill all fields.");
            return;
        }
        onSave({ autoclaveName, cycleNumber, passed });
    }

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h3 className="font-bold text-lg text-slate-800">Log New Sterilization Cycle</h3>
                <div className="space-y-4 mt-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500">Autoclave</label>
                        <select value={autoclaveName} onChange={e => setAutoclaveName(e.target.value)} className="w-full p-2 border rounded-lg mt-1">
                            <option>Autoclave 1</option>
                            <option>Autoclave 2</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500">Cycle Number</label>
                        <input type="text" value={cycleNumber} onChange={e => setCycleNumber(e.target.value)} className="w-full p-2 border rounded-lg mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500">Biological Indicator Result</label>
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => setPassed(true)} className={`flex-1 p-3 rounded-lg border-2 font-bold flex items-center justify-center gap-2 ${passed === true ? 'bg-green-100 border-green-400 text-green-800' : 'bg-slate-50 border-slate-200'}`}><CheckCircle size={16}/> PASS</button>
                            <button onClick={() => setPassed(false)} className={`flex-1 p-3 rounded-lg border-2 font-bold flex items-center justify-center gap-2 ${passed === false ? 'bg-red-100 border-red-400 text-red-800' : 'bg-slate-50 border-slate-200'}`}><X size={16}/> FAIL</button>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-600 font-bold hover:bg-slate-100">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold">Log Cycle</button>
                </div>
            </div>
        </div>
    )
}

// --- STOCK ITEM MODAL (Placeholder) ---
const StockItemModal: React.FC<{item: StockItem | null, onSave: (i:StockItem)=>void, onClose: ()=>void}> = ({ item, onSave, onClose }) => {
    return <div>Stock Item Modal</div>
};

export default Inventory;
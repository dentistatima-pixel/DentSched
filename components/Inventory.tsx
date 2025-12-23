
import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, AlertTriangle, X, Save, Edit2, Boxes, RefreshCcw, ArrowRightLeft, MapPin, Wrench, Shield, History, Scale, Zap, CheckCircle, TrendingDown, Info, UserX, UserMinus } from 'lucide-react';
import { StockItem, StockCategory, SterilizationCycle, User, StockTransfer, FieldSettings, AuditLogEntry, Appointment, Patient } from '../types';
import { useToast } from './ToastSystem';
import { formatDate } from '../constants';

interface InventoryProps {
  stock: StockItem[];
  onUpdateStock: (updatedStock: StockItem[]) => void;
  sterilizationCycles?: SterilizationCycle[];
  onAddCycle?: (cycle: any) => void;
  currentUser: User;
  currentBranch: string;
  availableBranches: string[];
  transfers?: StockTransfer[];
  fieldSettings?: FieldSettings;
  logAction?: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
  appointments?: Appointment[];
  patients?: Patient[];
  uiMode?: string;
}

const Inventory: React.FC<InventoryProps> = ({ 
    stock, onUpdateStock, sterilizationCycles = [], onAddCycle, currentBranch, availableBranches, transfers = [], fieldSettings, logAction, appointments = [], patients = []
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'stock' | 'transfers' | 'maintenance' | 'sterilization'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [editItem, setEditItem] = useState<Partial<StockItem> | null>(null);
  const [auditMode, setAuditMode] = useState(false);
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});
  const [recallAnalysis, setRecallAnalysis] = useState<StockItem | null>(null);

  const branchStock = useMemo(() => stock.filter(s => s.branch === currentBranch || !s.branch), [stock, currentBranch]);
  const filteredStock = branchStock.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const burnRateStats = useMemo<Record<string, { used: number, daysLeft: number }>>(() => {
    const projections: Record<string, { used: number, daysLeft: number }> = {};
    const next7Days = appointments.filter(a => {
        const d = new Date(a.date);
        const today = new Date();
        const diff = (d.getTime() - today.getTime()) / (1000 * 3600 * 24);
        return diff >= 0 && diff <= 7 && a.branch === currentBranch;
    });
    branchStock.forEach(item => {
        let projectedUsage = 0;
        next7Days.forEach(apt => {
            const procedure = fieldSettings?.procedures.find(p => p.name === apt.type);
            const bomItem = procedure?.billOfMaterials?.find(bom => bom.stockItemId === item.id);
            if (bomItem) projectedUsage += bomItem.quantity;
        });
        const daysLeft = projectedUsage > 0 ? Math.floor(item.quantity / (projectedUsage / 7)) : 999;
        projections[item.id] = { used: projectedUsage, daysLeft };
    });
    return projections;
  }, [appointments, branchStock, fieldSettings, currentBranch]);

  const affectedPatients = useMemo(() => {
      if (!recallAnalysis) return [];
      return patients.filter(p => p.dentalChart?.some(c => c.materialBatchId === recallAnalysis.id));
  }, [recallAnalysis, patients]);

  const handleRecallToggle = (item: StockItem) => {
    const nextVal = !item.isRecalled;
    onUpdateStock(stock.map(s => s.id === item.id ? { ...s, isRecalled: nextVal, recallDate: nextVal ? new Date().toISOString() : undefined } : s));
    toast.warning(`Material Recall ${nextVal ? 'Activated' : 'Revoked'} for ${item.name}`);
    if (logAction) logAction('UPDATE', 'Stock', item.id, `Recall status set to ${nextVal}`);
  };

  const handleEmergencyDecrement = (item: StockItem) => {
      const updatedStock = stock.map(s => s.id === item.id ? { ...s, quantity: Math.max(0, s.quantity - 1) } : s);
      onUpdateStock(updatedStock);
      if (logAction) logAction('EMERGENCY_CONSUMPTION_BYPASS', 'Stock', item.id, `Manual 1-unit decrement for ${item.name}.`);
      toast.info(`Usage Logged: ${item.name}`);
  };

  const getExpiryStatus = (item: StockItem) => {
      if (item.isRecalled) return { label: 'RECALLED', color: 'bg-red-600 text-white border-red-700 animate-pulse' };
      if (!item.expiryDate) return { label: 'STABLE', color: 'bg-green-50 text-green-700 border-green-100' };
      const now = new Date();
      const expiry = new Date(item.expiryDate);
      const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (diff < 0) return { label: 'EXPIRED', color: 'bg-red-600 text-white border-red-700' };
      if (diff <= 30) return { label: `DUE: ${diff}D`, color: 'bg-orange-100 text-orange-700 border-orange-200' };
      return { label: 'OK', color: 'bg-green-50 text-green-700 border-green-100' };
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex-shrink-0 flex justify-between items-start">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-2xl text-blue-700 shadow-sm"><Package size={32} /></div>
                <div><h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Clinic Logistics</h1><p className="text-slate-500">Stock integrity and sterilization compliance.</p></div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setAuditMode(!auditMode)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${auditMode ? 'bg-lilac-600 text-white border-lilac-500 shadow-lg' : 'bg-white border-slate-200 text-slate-500'}`}>
                    <Scale size={18} /> {auditMode ? 'Audit Mode Active' : 'Enter Stock Audit'}
                </button>
            </div>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
            <div className="flex border-b border-slate-200 px-4 shrink-0 bg-slate-50/50 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('stock')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'stock' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><Boxes size={18}/> Material Registry</button>
                <button onClick={() => setActiveTab('sterilization')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'sterilization' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><Shield size={18}/> Sterilization Log</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                {activeTab === 'stock' && (
                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-[2rem] border border-lilac-100 shadow-lg flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-lilac-50 p-3 rounded-2xl text-lilac-600"><TrendingDown size={24} /></div>
                                <div>
                                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Inventory Burn-Rate Monitor</h4>
                                    <p className="text-xs text-slate-500">Projected stockouts for upcoming surgeries.</p>
                                </div>
                            </div>
                            {stock.some(s => s.isRecalled) && (
                                <button onClick={() => toast.info("Filter for Recalled items in Registry.")} className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 animate-pulse"><AlertTriangle size={14}/> Active Recall Analysis</button>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="relative w-full md:w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search materials..." className="input pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
                            <button onClick={() => setEditItem({ branch: currentBranch })} className="bg-teal-600 text-white rounded-xl font-bold px-6 py-2 flex items-center gap-2 hover:bg-teal-700 shadow-md">New Item</button>
                        </div>
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                                    <tr><th className="p-4">Material Identity</th><th className="p-4 text-center">In-Stock</th><th className="p-4">Clinical Status</th><th className="p-4 text-right">Containment</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredStock.map(item => {
                                        const expiry = getExpiryStatus(item);
                                        return (
                                            <tr key={item.id} className={`group hover:bg-slate-50 transition-all ${item.isRecalled ? 'bg-red-50/50' : ''}`}>
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-800">{item.name}</div>
                                                    <div className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">{item.category}</div>
                                                </td>
                                                <td className="p-4 text-center font-black text-lg text-slate-700">{item.quantity}</td>
                                                <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-black border uppercase ${expiry.color}`}>{expiry.label}</span></td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleRecallToggle(item)} className={`p-2 rounded-xl transition-all ${item.isRecalled ? 'bg-red-600 text-white' : 'text-slate-300 hover:text-red-500'}`} title="Toggle Recall"><AlertTriangle size={16}/></button>
                                                        {item.isRecalled && <button onClick={() => setRecallAnalysis(item)} className="p-2 bg-lilac-100 text-lilac-600 rounded-xl hover:bg-lilac-200" title="Impact Analysis"><UserX size={16}/></button>}
                                                        <button onClick={() => setEditItem(item)} className="p-2 text-slate-400 hover:text-teal-600 transition-colors"><Edit2 size={16}/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
        
        {recallAnalysis && (
            <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-red-500/20">
                    <div className="p-8 bg-red-900 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="bg-red-600 p-3 rounded-2xl animate-pulse"><AlertTriangle /></div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Recall Impact Analysis</h3>
                                <p className="text-red-300 text-xs font-bold uppercase tracking-widest mt-1">{recallAnalysis.name} • Batch ID: {recallAnalysis.id}</p>
                            </div>
                        </div>
                        <button onClick={() => setRecallAnalysis(null)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
                    </div>
                    <div className="p-8 flex-1 overflow-y-auto no-scrollbar max-h-[60vh] space-y-4">
                        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 text-red-900">
                            <p className="text-sm font-bold leading-relaxed">Safety Protocol 12-A: The following patients have clinical records linked to this batch ID. Immediate clinical review and follow-up notification is required.</p>
                        </div>
                        <div className="space-y-2">
                            {affectedPatients.length > 0 ? affectedPatients.map(p => (
                                <div key={p.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex justify-between items-center">
                                    <div><div className="font-bold text-slate-800">{p.name}</div><div className="text-[10px] text-slate-400 font-mono">Mobile: {p.phone}</div></div>
                                    <button onClick={() => toast.info(`Queued Safety Alert for ${p.name}`)} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Queue Safety SMS</button>
                                </div>
                            )) : <div className="text-center py-10 text-slate-400 italic">No patients found linked to this batch.</div>}
                        </div>
                    </div>
                    <div className="p-8 bg-slate-50 border-t flex justify-end">
                        <button onClick={() => setRecallAnalysis(null)} className="px-8 py-4 bg-white border border-slate-200 rounded-[2rem] font-black text-xs uppercase tracking-widest text-slate-600">Close Analysis</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Inventory;

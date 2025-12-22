import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, AlertTriangle, X, Save, Edit2, Boxes, RefreshCcw, ArrowRightLeft, MapPin, Wrench, Shield, History, Scale, Zap, CheckCircle } from 'lucide-react';
import { StockItem, StockCategory, SterilizationCycle, User, StockTransfer, FieldSettings, AuditLogEntry } from '../types';
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
}

const TOLERANCE_MAP: Record<StockCategory, number> = {
    [StockCategory.CONSUMABLES]: 0.10,
    [StockCategory.RESTORATIVE]: 0.05,
    [StockCategory.INSTRUMENTS]: 0,
    [StockCategory.PROSTHODONTIC]: 0,
    [StockCategory.OFFICE]: 0.10
};

const Inventory: React.FC<InventoryProps> = ({ 
    stock, onUpdateStock, sterilizationCycles = [], onAddCycle, currentBranch, availableBranches, transfers = [], fieldSettings, logAction
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'stock' | 'transfers' | 'maintenance' | 'sterilization'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [editItem, setEditItem] = useState<Partial<StockItem> | null>(null);
  const [auditMode, setAuditMode] = useState(false);
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});

  const branchStock = useMemo(() => stock.filter(s => s.branch === currentBranch || !s.branch), [stock, currentBranch]);
  const filteredStock = branchStock.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleEmergencyDecrement = (item: StockItem) => {
      const updatedStock = stock.map(s => s.id === item.id ? { ...s, quantity: Math.max(0, s.quantity - 1) } : s);
      onUpdateStock(updatedStock);
      if (logAction) logAction('EMERGENCY_CONSUMPTION_BYPASS', 'Stock', item.id, `Manual 1-unit decrement for ${item.name}.`);
      toast.info(`Usage Logged: ${item.name}`);
  };

  const handleAuditSync = (item: StockItem) => {
      const physical = physicalCounts[item.id];
      if (physical === undefined) return;
      const updatedStock = stock.map(s => s.id === item.id ? { ...s, quantity: physical, physicalCount: physical, lastVerifiedAt: new Date().toISOString() } : s);
      onUpdateStock(updatedStock);
      if (logAction) logAction('UPDATE', 'Stock', item.id, `Inventory reconciled to physical count (${physical}).`);
      toast.success(`${item.name} reality check complete.`);
  };

  const getExpiryStatus = (expiryDate?: string) => {
      if (!expiryDate) return { label: 'STABLE', color: 'bg-green-50 text-green-700 border-green-100' };
      const now = new Date();
      const expiry = new Date(expiryDate);
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
                <button onClick={() => setActiveTab('maintenance')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'maintenance' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><Wrench size={18}/> Assets</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                {activeTab === 'stock' && (
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="relative w-full md:w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search materials..." className="input pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
                            <button onClick={() => setEditItem({ branch: currentBranch })} className="bg-teal-600 text-white rounded-xl font-bold px-6 py-2 flex items-center gap-2 hover:bg-teal-700 shadow-md">New Item</button>
                        </div>
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                                    <tr><th className="p-4">Material Identity</th><th className="p-4 text-center">In-Stock</th><th className="p-4">Clinical Expiry</th><th className="p-4 text-right">Actions</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredStock.map(item => {
                                        const expiry = getExpiryStatus(item.expiryDate);
                                        return (
                                            <tr key={item.id} className="group hover:bg-slate-50 transition-all">
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-800">{item.name}</div>
                                                    <div className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">{item.category}</div>
                                                </td>
                                                <td className="p-4">
                                                    {auditMode ? (
                                                        <div className="flex items-center gap-2 justify-center">
                                                            <input type="number" className="w-20 p-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-teal-700" value={physicalCounts[item.id] ?? item.quantity} onChange={e => setPhysicalCounts({...physicalCounts, [item.id]: parseInt(e.target.value)})}/>
                                                            <button onClick={() => handleAuditSync(item)} className="p-2 bg-teal-600 text-white rounded-xl"><RefreshCcw size={14}/></button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center font-black text-lg text-slate-700">{item.quantity}</div>
                                                    )}
                                                </td>
                                                <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-black border uppercase ${expiry.color}`}>{expiry.label}</span></td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleEmergencyDecrement(item)} className="p-2 text-teal-600 hover:bg-teal-50 rounded-xl transition-colors"><Zap size={16}/></button>
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
        {editItem && (
            <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 space-y-6 animate-in zoom-in-95">
                    <div className="flex justify-between items-center"><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Material Profile</h3><button onClick={() => setEditItem(null)}><X size={24}/></button></div>
                    <div className="space-y-4">
                        <div><label className="label">Item Name</label><input type="text" value={editItem.name || ''} onChange={e => setEditItem({...editItem, name: e.target.value})} className="input" /></div>
                        <div><label className="label">Category</label><select value={editItem.category || StockCategory.CONSUMABLES} onChange={e => setEditItem({...editItem, category: e.target.value as StockCategory})} className="input">{Object.values(StockCategory).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="label">Current Qty</label><input type="number" value={editItem.quantity || 0} onChange={e => setEditItem({...editItem, quantity: parseInt(e.target.value)})} className="input" /></div>
                            <div><label className="label">Low Threshold</label><input type="number" value={editItem.lowStockThreshold || 5} onChange={e => setEditItem({...editItem, lowStockThreshold: parseInt(e.target.value)})} className="input" /></div>
                        </div>
                        <div><label className="label">Expiry Date</label><input type="date" value={editItem.expiryDate || ''} onChange={e => setEditItem({...editItem, expiryDate: e.target.value})} className="input" /></div>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button onClick={() => setEditItem(null)} className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 rounded-2xl">Cancel</button>
                        <button onClick={() => { onUpdateStock(stock.find(s => s.id === editItem.id) ? stock.map(s => s.id === editItem.id ? (editItem as StockItem) : s) : [...stock, { ...editItem, id: `stk_${Date.now()}` } as StockItem]); setEditItem(null); }} className="flex-[2] py-4 bg-teal-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-teal-600/20">Save Profile</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Inventory;
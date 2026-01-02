import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, AlertTriangle, X, Save, Trash2, Edit2, Shield, CheckCircle, Boxes, Tag, Calendar, AlertCircle, FileText, ShoppingCart, Send, ArrowRight, ArrowRightLeft, MapPin, TrendingUp, Sparkles, Wrench, Clock, Activity, CalendarDays, LineChart, ChevronRight, Zap, Target, History, Scale } from 'lucide-react';
import { StockItem, StockCategory, SterilizationCycle, User, UserRole, PurchaseOrder, PurchaseOrderItem, StockTransfer, Patient, FieldSettings, MaintenanceAsset, Appointment, AuditLogEntry } from '../types';
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
  onPerformTransfer?: (t: StockTransfer) => void;
  patients?: Patient[];
  fieldSettings?: FieldSettings;
  onUpdateSettings?: (s: FieldSettings) => void;
  appointments?: Appointment[];
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
    stock, onUpdateStock, sterilizationCycles = [], onAddCycle, currentUser, 
    currentBranch, availableBranches, transfers = [], onPerformTransfer, patients = [], fieldSettings, onUpdateSettings,
    appointments = [], logAction
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'stock' | 'transfers' | 'forecasting' | 'maintenance' | 'sterilization'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [editItem, setEditItem] = useState<Partial<StockItem> | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  
  // RECONCILIATION STATE
  const [auditMode, setAuditMode] = useState(false);

  const branchStock = useMemo(() => {
      return stock.filter(s => s.branch === currentBranch || !s.branch);
  }, [stock, currentBranch]);

  const filteredStock = branchStock.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const realityScore = useMemo(() => {
    if (branchStock.length === 0) return 100;
    const withinTolerance = branchStock.filter(s => {
        if (s.physicalCount === undefined) return true;
        const diff = Math.abs(s.quantity - s.physicalCount);
        const toleranceVal = s.quantity * (TOLERANCE_MAP[s.category] || 0);
        return diff <= toleranceVal;
    }).length;
    return Math.round((withinTolerance / branchStock.length) * 100);
  }, [branchStock]);

  const handleDeleteItem = (item: StockItem) => {
      // --- MEDICO-LEGAL LOCK GUARD ---
      if (item.isLockedForEvidence) {
          toast.error("MEDICO-LEGAL LOCK: This item is linked to a sealed clinical record. Destruction is prohibited for 10 years to protect malpractice evidence.");
          return;
      }

      if (!window.confirm(`PERMANENT DELETION: Are you sure you want to remove "${item.name}" from the practice catalog?`)) return;
      onUpdateStock(stock.filter(s => s.id !== item.id));
      if (logAction) logAction('DELETE', 'Stock', item.id, `Permanently removed stock item catalog record.`);
      toast.success("Catalog entry purged.");
  };

  const handleSaveItem = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editItem) return;
      
      const itemToSave = {
          ...editItem,
          id: editItem.id || `stk_${Date.now()}`,
          branch: editItem.branch || currentBranch
      } as StockItem;

      if (editItem.id) {
          onUpdateStock(stock.map(s => s.id === editItem.id ? itemToSave : s));
          toast.success("Item updated.");
      } else {
          onUpdateStock([...stock, itemToSave]);
          toast.success("New item added to catalog.");
      }
      setEditItem(null);
  };

  const getExpiryStatus = (expiryDate?: string) => {
      if (!expiryDate) return { label: 'STABLE', color: 'bg-green-50 text-green-700 border-green-100', isExpired: false };
      const now = new Date();
      const expiry = new Date(expiryDate);
      const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
      
      if (diff < 0) return { label: 'EXPIRED', color: 'bg-red-600 text-white', isExpired: true };
      if (diff <= 30) return { label: `EXPIRING: ${diff}D`, color: 'bg-orange-100 text-orange-700 border-orange-200', isExpired: false };
      return { label: 'OK', color: 'bg-green-50 text-green-700 border-green-100', isExpired: false };
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex-shrink-0 flex justify-between items-start">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-2xl text-blue-700 shadow-sm"><Package size={32} /></div>
                <div><h1 className="text-3xl font-bold text-slate-800">Clinic Logistics</h1><p className="text-slate-500">Stock control and machine maintenance.</p></div>
            </div>
            <div className="flex gap-2">
                <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inventory Reality Score</div>
                        <div className={`text-xl font-black ${realityScore > 90 ? 'text-teal-600' : realityScore > 75 ? 'text-orange-500' : 'text-red-600'}`}>{realityScore}%</div>
                    </div>
                </div>
            </div>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
            <div className="flex border-b border-slate-200 px-4 shrink-0 bg-slate-50/50 overflow-x-auto no-scrollbar justify-between items-center">
                <div className="flex">
                    <button onClick={() => setActiveTab('stock')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'stock' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><Boxes size={18}/> Stock</button>
                    <button onClick={() => setActiveTab('forecasting')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'forecasting' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><LineChart size={18}/> Forecasting</button>
                    <button onClick={() => setActiveTab('sterilization')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'sterilization' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><Shield size={18}/> Sterilization</button>
                </div>
                
                {activeTab === 'stock' && (
                    <div className="pr-4 flex items-center gap-3">
                        <label className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer ${auditMode ? 'bg-lilac-600 border-lilac-500 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-50'}`}>
                            <input type="checkbox" checked={auditMode} onChange={e => setAuditMode(e.target.checked)} className="hidden"/>
                            <Scale size={16}/>
                            <span className="text-[10px] font-black uppercase tracking-widest">{auditMode ? 'Audit Active' : 'Enter Audit Mode'}</span>
                        </label>
                    </div>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                {activeTab === 'stock' && (
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search catalog..." 
                                    className="input pl-10" 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={() => setEditItem({ name: '', quantity: 0, lowStockThreshold: 5, category: StockCategory.CONSUMABLES })} 
                                className="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-teal-600/20"
                            >
                                <Plus size={18}/> Add New Item
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
                                    <tr>
                                        <th className="p-4 text-left">Item Name</th>
                                        <th className="p-4 text-left">Category</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-right">In Stock</th>
                                        <th className="p-4 text-right">Threshold</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredStock.map(item => {
                                        const expiry = getExpiryStatus(item.expiryDate);
                                        const isLow = item.quantity <= item.lowStockThreshold;
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50 group">
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-800">{item.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono uppercase">{item.batchNumber || item.id}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{item.category}</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${expiry.color}`}>{expiry.label}</span>
                                                        {item.isLockedForEvidence && (
                                                            <div className="flex items-center gap-1 text-[8px] font-black text-red-600 bg-red-50 px-1 rounded border border-red-200 uppercase" title="Hard-linked to sealed clinical record">
                                                                <Shield size={8}/> Clinical Evidence
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-black text-slate-800">
                                                    <span className={isLow ? 'text-red-600' : ''}>{item.quantity}</span>
                                                </td>
                                                <td className="p-4 text-right text-slate-400 font-bold">{item.lowStockThreshold}</td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => setEditItem(item)}
                                                            className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                                                            title="Edit Item"
                                                        >
                                                            <Edit2 size={14}/>
                                                        </button>
                                                        {currentUser.role === UserRole.ADMIN && (
                                                            <button 
                                                                onClick={() => handleDeleteItem(item)}
                                                                className={`p-2 rounded-lg transition-colors ${item.isLockedForEvidence ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                                                                title={item.isLockedForEvidence ? "Locked: Malpractice Evidence Protection" : "Delete from Catalog"}
                                                            >
                                                                <Trash2 size={14}/>
                                                            </button>
                                                        )}
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
                
                {activeTab === 'forecasting' && (
                    <div className="h-full flex items-center justify-center text-slate-400 italic py-20">
                        Consumption forecasting module is currently aggregating historical treatment data.
                    </div>
                )}

                {activeTab === 'sterilization' && (
                    <div className="h-full flex items-center justify-center text-slate-400 italic py-20">
                        Sterilization monitoring log is synchronizing with Autoclave IoT gateway.
                    </div>
                )}
            </div>
        </div>

        {/* Edit Modal */}
        {editItem && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
                <form onSubmit={handleSaveItem} className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                    <div className="bg-teal-900 p-6 text-white flex justify-between items-center">
                        <h3 className="text-xl font-bold uppercase tracking-tight">{editItem.id ? 'Edit Catalog Item' : 'New Catalog Item'}</h3>
                        <button type="button" onClick={() => setEditItem(null)}><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-4">
                        <div><label className="label">Item Name</label><input type="text" value={editItem.name || ''} onChange={e => setEditItem({...editItem, name: e.target.value})} className="input" required /></div>
                        <div>
                            <label className="label">Category</label>
                            <select value={editItem.category} onChange={e => setEditItem({...editItem, category: e.target.value as StockCategory})} className="input">
                                {Object.values(StockCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="label">Initial Stock</label><input type="number" value={editItem.quantity || ''} onChange={e => setEditItem({...editItem, quantity: parseInt(e.target.value)})} className="input" /></div>
                            <div><label className="label">Low Threshold</label><input type="number" value={editItem.lowStockThreshold || ''} onChange={e => setEditItem({...editItem, lowStockThreshold: parseInt(e.target.value)})} className="input" /></div>
                        </div>
                        <div><label className="label">Expiry Date (Optional)</label><input type="date" value={editItem.expiryDate || ''} onChange={e => setEditItem({...editItem, expiryDate: e.target.value})} className="input" /></div>
                    </div>
                    <div className="p-4 border-t bg-slate-50 flex gap-2">
                        <button type="button" onClick={() => setEditItem(null)} className="flex-1 py-4 font-bold text-slate-400">Cancel</button>
                        <button type="submit" className="flex-[2] py-4 bg-teal-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-teal-600/20">Save to Catalog</button>
                    </div>
                </form>
            </div>
        )}
    </div>
  );
};

export default Inventory;
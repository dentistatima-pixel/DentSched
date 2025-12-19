
import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, AlertTriangle, X, Save, Trash2, Edit2, Shield, CheckCircle, RefreshCcw, Boxes, TrendingDown, Tag, Calendar, AlertCircle, FileText, ShoppingCart, Send, ArrowRight, ArrowRightLeft, MapPin, TrendingUp, Sparkles, Wrench, Clock, Activity, CalendarDays } from 'lucide-react';
import { StockItem, StockCategory, SterilizationCycle, User, PurchaseOrder, PurchaseOrderItem, StockTransfer, Patient, FieldSettings, MaintenanceAsset } from '../types';
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
}

const Inventory: React.FC<InventoryProps> = ({ 
    stock, onUpdateStock, sterilizationCycles = [], onAddCycle, currentUser, 
    currentBranch, availableBranches, transfers = [], onPerformTransfer, patients = [], fieldSettings, onUpdateSettings
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'stock' | 'transfers' | 'forecasting' | 'maintenance' | 'sterilization'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [editItem, setEditItem] = useState<Partial<StockItem> | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const branchStock = useMemo(() => {
      return stock.filter(s => s.branch === currentBranch || !s.branch);
  }, [stock, currentBranch]);

  const filteredStock = branchStock.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getExpiryStatus = (expiryDate?: string) => {
      if (!expiryDate) return { label: 'STABLE', color: 'bg-green-50 text-green-700 border-green-100', isExpired: false, isUrgent: false };
      const now = new Date();
      const expiry = new Date(expiryDate);
      const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
      
      if (diff < 0) return { label: 'EXPIRED', color: 'bg-red-600 text-white border-red-700', isExpired: true, isUrgent: true };
      if (diff <= 30) return { label: `EXPIRING: ${diff}D`, color: 'bg-orange-100 text-orange-700 border-orange-200', isExpired: false, isUrgent: true };
      return { label: 'OK', color: 'bg-green-50 text-green-700 border-green-100', isExpired: false, isUrgent: false };
  };

  const handleUpdateAssetStatus = (assetId: string, status: MaintenanceAsset['status']) => {
      if (!fieldSettings || !onUpdateSettings) return;
      const updatedAssets = (fieldSettings.assets || []).map(a => a.id === assetId ? { ...a, status, lastService: status === 'Ready' ? new Date().toISOString().split('T')[0] : a.lastService } : a);
      onUpdateSettings({ ...fieldSettings, assets: updatedAssets });
      toast.success(`Asset status updated to ${status}.`);
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex-shrink-0 flex justify-between items-start">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-2xl text-blue-700 shadow-sm"><Package size={32} /></div>
                <div><h1 className="text-3xl font-bold text-slate-800">Clinic Logistics</h1><p className="text-slate-500">Stock control and machine maintenance.</p></div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setIsTransferModalOpen(true)} className="bg-lilac-100 hover:bg-lilac-200 text-lilac-700 px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm">
                    <ArrowRightLeft size={18} /><span className="font-bold text-sm">Transfer Stock</span>
                </button>
            </div>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
            <div className="flex border-b border-slate-200 px-4 shrink-0 bg-slate-50/50 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('stock')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'stock' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><Boxes size={18}/> Stock</button>
                <button onClick={() => setActiveTab('maintenance')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'maintenance' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><Wrench size={18}/> Maintenance Log</button>
                <button onClick={() => setActiveTab('transfers')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'transfers' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><ArrowRightLeft size={18}/> Transfers</button>
                <button onClick={() => setActiveTab('sterilization')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'sterilization' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><Shield size={18}/> Sterilization</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                {activeTab === 'stock' && (
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="relative w-full md:w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search stock..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
                            <button onClick={() => setEditItem({ branch: currentBranch })} className="bg-teal-600 text-white rounded-xl font-bold px-4 py-2 flex items-center gap-2 hover:bg-teal-700 shadow-md"><Plus size={18}/> Add Item</button>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-widest"><tr><th className="p-4">Item Name</th><th className="p-4 text-center">Available</th><th className="p-4">Stock Level</th><th className="p-4">Clinical Expiry</th><th className="p-4"></th></tr></thead>
                                <tbody className="divide-y divide-slate-100">{filteredStock.map(item => {
                                    const expiry = getExpiryStatus(item.expiryDate);
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 group transition-colors">
                                            <td className="p-4"><div className="font-bold text-slate-800">{item.name}</div><div className="text-[10px] text-slate-400 uppercase font-bold">{item.category}</div></td>
                                            <td className="p-4 text-center font-mono font-bold text-lg text-slate-700">{item.quantity}</td>
                                            <td className="p-4">{item.quantity <= item.lowStockThreshold ? <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-[10px] font-bold border border-red-100">LOW STOCK</span> : <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-[10px] font-bold border border-green-100">STABLE</span>}</td>
                                            <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-black border flex items-center gap-1 w-fit ${expiry.color}`}>{expiry.isUrgent && <AlertTriangle size={10}/>} {expiry.label}</span></td>
                                            <td className="p-4 text-right"><button onClick={() => setEditItem(item)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-teal-600"><Edit2 size={16}/></button></td>
                                        </tr>
                                    );
                                })}</tbody>
                            </table>
                        </div>
                    </div>
                )}
                {/* ... other tabs ... */}
            </div>
        </div>
        {editItem && <StockItemModal item={editItem} onSave={(i) => { onUpdateStock(stock.find(s => s.id === i.id) ? stock.map(s => s.id === i.id ? i : s) : [...stock, i]); setEditItem(null); }} onClose={() => setEditItem(null)} />}
    </div>
  );
};

const StockItemModal = ({ item, onSave, onClose }: { item: Partial<StockItem>, onSave: (i: StockItem) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<Partial<StockItem>>({ id: `stk_${Date.now()}`, name: '', category: StockCategory.CONSUMABLES, quantity: 0, lowStockThreshold: 5, expiryDate: '', ...item });
    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <form onSubmit={(e) => { e.preventDefault(); onSave(formData as StockItem); }} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-lg">{item.id ? 'Edit Item' : 'New Stock Item'}</h3><button type="button" onClick={onClose}><X size={20}/></button></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Item Name</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Category</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as StockCategory})} className="w-full p-3 border rounded-xl mt-1 outline-none bg-white">{Object.values(StockCategory).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Alert Threshold</label><input type="number" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl mt-1" /></div>
                </div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Expiration Date (Optional)</label><input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full p-3 border rounded-xl mt-1" /></div>
                <div className="flex gap-2 mt-6"><button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl text-slate-600">Cancel</button><button type="submit" className="flex-[2] py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20">Save Item</button></div>
            </form>
        </div>
    );
};

export default Inventory;

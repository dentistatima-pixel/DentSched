import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, AlertTriangle, X, Save, Trash2, Edit2, Shield, CheckCircle, RefreshCcw, Boxes, TrendingDown, Tag, Calendar, AlertCircle, FileText, ShoppingCart, Send, ArrowRight } from 'lucide-react';
import { StockItem, StockCategory, SterilizationCycle, User, PurchaseOrder, PurchaseOrderItem } from '../types';
import { useToast } from './ToastSystem';
import { formatDate } from '../constants';

interface InventoryProps {
  stock: StockItem[];
  onUpdateStock: (updatedStock: StockItem[]) => void;
  sterilizationCycles?: SterilizationCycle[];
  onAddCycle?: (cycle: any) => void;
  currentUser: User;
}

const StockItemModal = ({ item, onSave, onClose }: { item: Partial<StockItem>, onSave: (i: StockItem) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<Partial<StockItem>>({
        id: `stk_${Date.now()}`,
        name: '',
        category: StockCategory.CONSUMABLES,
        quantity: 0,
        lowStockThreshold: 5,
        expiryDate: '',
        supplier: '',
        ...item
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as StockItem);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg">{item.id ? 'Edit Item' : 'New Stock Item'}</h3>
                    <button type="button" onClick={onClose}><X size={20} className="text-slate-400"/></button>
                </div>
                
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Item Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Lidocaine 2%"/>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as StockCategory})} className="w-full p-3 border rounded-xl mt-1 outline-none bg-white">
                            {Object.values(StockCategory).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Alert Threshold</label>
                        <input type="number" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl mt-1" />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Preferred Supplier</label>
                    <input type="text" value={formData.supplier || ''} onChange={e => setFormData({...formData, supplier: e.target.value})} className="w-full p-3 border rounded-xl mt-1" placeholder="e.g. DentalDepot PH" />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Calendar size={12}/> Expiry Date (Optional)
                    </label>
                    <input 
                        type="date" 
                        value={formData.expiryDate || ''} 
                        onChange={e => setFormData({...formData, expiryDate: e.target.value})} 
                        className="w-full p-3 border rounded-xl mt-1" 
                    />
                </div>

                <div className="flex gap-2 mt-6">
                    <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl text-slate-600">Cancel</button>
                    <button type="submit" className="flex-[2] py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20">Save Item</button>
                </div>
            </form>
        </div>
    );
};

const PurchaseOrderList: React.FC<{ pos: PurchaseOrder[] }> = ({ pos }) => {
    return (
        <div className="space-y-4">
            {pos.length === 0 ? (
                <div className="p-10 text-center text-slate-400 italic bg-white rounded-2xl border-2 border-dashed border-slate-200">No active purchase orders.</div>
            ) : pos.map(po => (
                <div key={po.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-lilac-100 p-3 rounded-xl text-lilac-700"><FileText size={24}/></div>
                        <div>
                            <div className="font-bold text-slate-800">PO #{po.id.slice(-6).toUpperCase()}</div>
                            <div className="text-xs text-slate-500">{po.supplier} • {formatDate(po.date)}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-xs font-bold text-slate-400 uppercase">Items</div>
                            <div className="text-sm font-bold text-slate-700">{po.items.length} units requested</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                            po.status === 'Received' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                            {po.status}
                        </span>
                        <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><ArrowRight size={18}/></button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const Inventory: React.FC<InventoryProps> = ({ stock, onUpdateStock, sterilizationCycles = [], onAddCycle, currentUser }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'stock' | 'sterilization' | 'procurement'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [editItem, setEditItem] = useState<Partial<StockItem> | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  const filteredStock = stock.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const lowItems = stock.filter(s => s.quantity <= s.lowStockThreshold);
  const expiredItems = stock.filter(s => s.expiryDate && new Date(s.expiryDate) < new Date());

  const handleGeneratePOs = () => {
      if (lowItems.length === 0) {
          toast.info("No items below threshold.");
          return;
      }

      const groupedBySupplier: Record<string, StockItem[]> = {};
      lowItems.forEach(item => {
          const s = item.supplier || 'Unassigned Supplier';
          if (!groupedBySupplier[s]) groupedBySupplier[s] = [];
          groupedBySupplier[s].push(item);
      });

      const newPOs: PurchaseOrder[] = Object.entries(groupedBySupplier).map(([supplier, items]) => ({
          id: `PO-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          date: new Date().toISOString().split('T')[0],
          supplier,
          status: 'Sent',
          items: items.map(i => ({ itemId: i.id, name: i.name, quantity: i.lowStockThreshold * 2 })) // Restock to 2x threshold
      }));

      setPurchaseOrders(prev => [...newPOs, ...prev]);
      setActiveTab('procurement');
      toast.success(`Generated ${newPOs.length} Purchase Orders automatically.`);
  };

  const getExpiryStatus = (dateStr?: string) => {
      if (!dateStr) return null;
      const today = new Date();
      const exp = new Date(dateStr);
      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return { label: 'EXPIRED', color: 'bg-red-100 text-red-700 border-red-200' };
      if (diffDays <= 90) return { label: `Expiring: ${diffDays}d`, color: 'bg-orange-100 text-orange-700 border-orange-200' };
      return { label: 'Good', color: 'bg-green-50 text-green-700 border-green-200' };
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex-shrink-0 flex justify-between items-start">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-2xl text-blue-700 shadow-sm"><Package size={32} /></div>
                <div><h1 className="text-3xl font-bold text-slate-800">Operational Inventory</h1><p className="text-slate-500">Stock control and clinical sterilization records.</p></div>
            </div>
            <div className="flex gap-2">
                {lowItems.length > 0 && (
                    <button onClick={handleGeneratePOs} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-orange-600/20 animate-pulse transition-all">
                        <ShoppingCart size={18} />
                        <span className="font-bold text-sm">Automate Reorder ({lowItems.length})</span>
                    </button>
                )}
            </div>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
            <div className="flex border-b border-slate-200 px-4 shrink-0 bg-slate-50/50 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('stock')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'stock' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><Boxes size={18}/> Stock Management</button>
                <button onClick={() => setActiveTab('procurement')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'procurement' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><ShoppingCart size={18}/> Procurement & POs</button>
                <button onClick={() => setActiveTab('sterilization')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'sterilization' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><Shield size={18}/> Sterilization Log</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                {activeTab === 'stock' && (
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input type="text" placeholder="Search stock..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                            </div>
                            <button onClick={() => setEditItem({})} className="bg-teal-600 text-white rounded-xl font-bold px-4 py-2 flex items-center gap-2 hover:bg-teal-700 shadow-md"><Plus size={18}/> Add Stock Item</button>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                                    <tr><th className="p-4">Item Name</th><th className="p-4">Supplier</th><th className="p-4 text-center">Available</th><th className="p-4">Status</th><th className="p-4"></th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredStock.map(item => {
                                        const isLow = item.quantity <= item.lowStockThreshold;
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50 group transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-800">{item.name}</div>
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold">{item.category}</div>
                                                </td>
                                                <td className="p-4 text-slate-600 font-medium">{item.supplier || '-'}</td>
                                                <td className="p-4 text-center font-mono font-bold text-lg text-slate-700">{item.quantity}</td>
                                                <td className="p-4">
                                                    {isLow ? <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 w-fit border border-red-100">LOW STOCK</span> : <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 w-fit border border-green-100">STABLE</span>}
                                                </td>
                                                <td className="p-4 text-right"><button onClick={() => setEditItem(item)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-teal-600"><Edit2 size={16}/></button></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'procurement' && <PurchaseOrderList pos={purchaseOrders} />}
                
                {activeTab === 'sterilization' && <SterilizationLogTab cycles={sterilizationCycles} onAddCycle={onAddCycle} currentUser={currentUser} />}
            </div>
        </div>
        {editItem && <StockItemModal item={editItem} onSave={(i) => { onUpdateStock(stock.find(s => s.id === i.id) ? stock.map(s => s.id === i.id ? i : s) : [...stock, i]); setEditItem(null); }} onClose={() => setEditItem(null)} />}
    </div>
  );
};

const SterilizationLogTab: React.FC<{cycles: SterilizationCycle[], onAddCycle?: any, currentUser: User}> = ({ cycles, onAddCycle, currentUser }) => {
    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                        <tr><th className="p-4">Date</th><th className="p-4">Autoclave</th><th className="p-4">Cycle #</th><th className="p-4">Operator</th><th className="p-4">Result</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {[...cycles].reverse().map(cycle => (
                            <tr key={cycle.id} className="hover:bg-slate-50/50">
                                <td className="p-4 font-medium text-slate-800">{formatDate(cycle.date)}</td>
                                <td className="p-4 text-slate-600">{cycle.autoclaveName}</td>
                                <td className="p-4 text-slate-600 font-mono">{cycle.cycleNumber}</td>
                                <td className="p-4 text-slate-600">{cycle.operator}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${cycle.passed ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{cycle.passed ? 'PASS' : 'FAIL'}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Inventory;

import React, { useState } from 'react';
import { Package, Plus, Search, AlertTriangle, X, Save, Trash2, Edit2, Shield, CheckCircle, RefreshCcw, Boxes, TrendingDown, Tag } from 'lucide-react';
import { StockItem, StockCategory, SterilizationCycle, User } from '../types';
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
        ...item
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as StockItem);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
                <h3 className="font-bold text-lg">{item.id ? 'Edit Item' : 'New Stock Item'}</h3>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Item Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as StockCategory})} className="w-full p-3 border rounded-xl mt-1 outline-none">
                            {Object.values(StockCategory).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Threshold</label>
                        <input type="number" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl mt-1" />
                    </div>
                </div>
                <div className="flex gap-2 mt-6">
                    <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl">Cancel</button>
                    <button type="submit" className="flex-[2] py-3 bg-teal-600 text-white font-bold rounded-xl">Save Item</button>
                </div>
            </form>
        </div>
    );
};

const ReceiveStockModal = ({ items, onReceive, onClose }: { items: StockItem[], onReceive: (updates: Record<string, number>) => void, onClose: () => void }) => {
    const [counts, setCounts] = useState<Record<string, string>>({});
    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 flex flex-col max-h-[80vh]">
                <h3 className="font-bold text-xl mb-2 flex items-center gap-2 text-teal-700"><RefreshCcw size={20}/> Receive Stock Shipment</h3>
                <p className="text-sm text-slate-500 mb-6">Select items and enter quantities received to update inventory.</p>
                <div className="flex-1 overflow-y-auto space-y-3">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <div className="font-bold text-slate-800">{item.name}</div>
                                <div className="text-xs text-slate-400 uppercase font-bold tracking-tighter">Current: {item.quantity}</div>
                            </div>
                            <input 
                                type="number" 
                                placeholder="+ Qty"
                                className="w-24 p-2 text-right border border-slate-200 rounded-lg text-sm font-bold focus:border-teal-500 outline-none"
                                value={counts[item.id] || ''}
                                onChange={e => setCounts({...counts, [item.id]: e.target.value})}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl">Cancel</button>
                    <button 
                        onClick={() => {
                            const final: Record<string, number> = {};
                            // Added explicit cast and radix to fix TypeScript error on line 88/89
                            (Object.entries(counts) as [string, string][]).forEach(([id, val]) => { 
                                if (val) {
                                    final[id] = parseInt(val, 10); 
                                }
                            });
                            onReceive(final);
                        }} 
                        className="flex-[2] py-3 bg-teal-600 text-white font-bold rounded-xl"
                    >Update Inventory</button>
                </div>
            </div>
        </div>
    );
};

const Inventory: React.FC<InventoryProps> = ({ stock, onUpdateStock, sterilizationCycles = [], onAddCycle, currentUser }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'stock' | 'sterilization'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [editItem, setEditItem] = useState<Partial<StockItem> | null>(null);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);

  const filteredStock = stock.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const lowItems = stock.filter(s => s.quantity <= s.lowStockThreshold);

  const handleSaveItem = (item: StockItem) => {
      const exists = stock.find(s => s.id === item.id);
      if (exists) {
          onUpdateStock(stock.map(s => s.id === item.id ? item : s));
          toast.success(`Updated ${item.name}`);
      } else {
          onUpdateStock([...stock, item]);
          toast.success(`Added ${item.name} to inventory`);
      }
      setEditItem(null);
  };

  const handleReceiveBatch = (updates: Record<string, number>) => {
      const newStock = stock.map(s => {
          if (updates[s.id]) {
              return { ...s, quantity: s.quantity + updates[s.id], lastRestockDate: new Date().toISOString().split('T')[0] };
          }
          return s;
      });
      onUpdateStock(newStock);
      toast.success("Inventory updated from shipment");
      setIsReceiveOpen(false);
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex-shrink-0 flex justify-between items-start">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-2xl text-blue-700 shadow-sm"><Package size={32} /></div>
                <div><h1 className="text-3xl font-bold text-slate-800">Operational Inventory</h1><p className="text-slate-500">Stock control and clinical sterilization records.</p></div>
            </div>
            {lowItems.length > 0 && (
                <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-xl flex items-center gap-2 border border-orange-200 animate-pulse shadow-sm">
                    <AlertTriangle size={18} />
                    <span className="font-bold text-sm">{lowItems.length} Items Critical</span>
                </div>
            )}
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
            <div className="flex border-b border-slate-200 px-4 shrink-0 bg-slate-50/50">
                <button onClick={() => setActiveTab('stock')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all ${activeTab === 'stock' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><Boxes size={18}/> Stock Management</button>
                <button onClick={() => setActiveTab('sterilization')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all ${activeTab === 'sterilization' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><Shield size={18}/> Sterilization Log</button>
            </div>
            
            {activeTab === 'stock' ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="text" placeholder="Search stock..." className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button onClick={() => setIsReceiveOpen(true)} className="flex-1 md:flex-none px-4 py-2 bg-lilac-100 text-lilac-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-lilac-200 transition-colors"><RefreshCcw size={18}/> Receive Shipment</button>
                            <button onClick={() => setEditItem({})} className="flex-1 md:flex-none px-4 py-2 bg-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors shadow-sm"><Plus size={18}/> Add Item</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                         <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="p-4">Item Name</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4 text-center">Available</th>
                                    <th className="p-4">Last Restock</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredStock.map(item => {
                                    const isLow = item.quantity <= item.lowStockThreshold;
                                    return (
                                        <tr key={item.id} className="group hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4"><div className="font-bold text-slate-800">{item.name}</div><div className="text-[10px] text-slate-400 font-mono">{item.id}</div></td>
                                            <td className="p-4"><span className="flex items-center gap-1.5 text-slate-600"><Tag size={12} className="text-slate-300"/> {item.category}</span></td>
                                            <td className="p-4 text-center font-mono font-bold text-lg text-slate-700">{item.quantity}</td>
                                            <td className="p-4 text-slate-500">{item.lastRestockDate ? formatDate(item.lastRestockDate) : '-'}</td>
                                            <td className="p-4">
                                                {isLow ? <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 w-fit border border-red-100"><TrendingDown size={10}/> REORDER</span> : <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 w-fit border border-green-100"><CheckCircle size={10}/> STABLE</span>}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => setEditItem(item)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-teal-600 transition-all"><Edit2 size={16}/></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                         </table>
                    </div>
                </div>
            ) : (
                <SterilizationLogTab cycles={sterilizationCycles} onAddCycle={onAddCycle} currentUser={currentUser} />
            )}
        </div>
        {editItem && <StockItemModal item={editItem} onSave={handleSaveItem} onClose={() => setEditItem(null)} />}
        {isReceiveOpen && <ReceiveStockModal items={stock} onReceive={handleReceiveBatch} onClose={() => setIsReceiveOpen(false)} />}
    </div>
  );
};

const SterilizationLogTab: React.FC<{cycles: SterilizationCycle[], onAddCycle?: any, currentUser: User}> = ({ cycles, onAddCycle, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white shrink-0">
                <div>
                    <h3 className="font-bold text-slate-800">Clinical Sterilization Log</h3>
                    <p className="text-sm text-slate-500">Mandatory records for autoclave efficacy and patient safety compliance.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto bg-teal-600 text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-teal-700 shadow-sm">
                    <Plus size={18}/> Log New Cycle
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-widest sticky top-0">
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
                        {[...cycles].reverse().map(cycle => (
                            <tr key={cycle.id} className="hover:bg-slate-50/50">
                                <td className="p-4 font-mono text-xs bg-slate-50/50 text-slate-600">{cycle.id}</td>
                                <td className="p-4 font-medium text-slate-800">{formatDate(cycle.date)}</td>
                                <td className="p-4 text-slate-600">{cycle.autoclaveName}</td>
                                <td className="p-4 text-slate-600 font-mono">{cycle.cycleNumber}</td>
                                <td className="p-4 text-slate-600">{cycle.operator}</td>
                                <td className="p-4">
                                    {cycle.passed ? 
                                        <span className="bg-green-100 text-green-700 font-bold text-[10px] px-2 py-1 rounded-full border border-green-200">PASS</span> :
                                        <span className="bg-red-100 text-red-700 font-bold text-[10px] px-2 py-1 rounded-full border border-red-200">FAIL</span>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>
            {isModalOpen && <SterilizationLogModal onSave={(d) => { onAddCycle(d); setIsModalOpen(false); }} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
}

const SterilizationLogModal: React.FC<{onSave: (d: any) => void, onClose: () => void}> = ({onSave, onClose}) => {
    const [autoclaveName, setAutoclaveName] = useState('Autoclave 1');
    const [cycleNumber, setCycleNumber] = useState('');
    const [passed, setPassed] = useState<boolean | null>(null);

    const handleSave = () => {
        if(!cycleNumber.trim() || passed === null) { alert("Please fill all fields."); return; }
        onSave({ autoclaveName, cycleNumber, passed });
    }

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
                <h3 className="font-bold text-lg text-slate-800">Log New Sterilization Cycle</h3>
                <div className="space-y-4 mt-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Autoclave</label>
                        <select value={autoclaveName} onChange={e => setAutoclaveName(e.target.value)} className="w-full p-3 border rounded-xl mt-1 outline-none bg-slate-50">
                            <option>Autoclave 1 (Surgery Room)</option>
                            <option>Autoclave 2 (Main Prep)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Cycle Number / Batch ID</label>
                        <input type="text" value={cycleNumber} onChange={e => setCycleNumber(e.target.value)} className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. 2024-05-15-01" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Biological Indicator Result</label>
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => setPassed(true)} className={`flex-1 p-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${passed === true ? 'bg-green-100 border-green-400 text-green-800 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400'}`}><CheckCircle size={20}/> PASS</button>
                            <button onClick={() => setPassed(false)} className={`flex-1 p-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${passed === false ? 'bg-red-100 border-red-400 text-red-800 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400'}`}><X size={20}/> FAIL</button>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 mt-8">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl text-slate-600">Cancel</button>
                    <button onClick={handleSave} className="flex-[2] py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20">Log Cycle Result</button>
                </div>
            </div>
        </div>
    )
}

export default Inventory;


import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, AlertTriangle, X, Save, Trash2, Edit2, Shield, CheckCircle, RefreshCcw, Boxes, TrendingDown, Tag, Calendar, AlertCircle, FileText, ShoppingCart, Send, ArrowRight, ArrowRightLeft, MapPin, TrendingUp, Sparkles, Wrench, Clock, Activity, CalendarDays, LineChart, ChevronRight } from 'lucide-react';
import { StockItem, StockCategory, SterilizationCycle, User, PurchaseOrder, PurchaseOrderItem, StockTransfer, Patient, FieldSettings, MaintenanceAsset, Appointment } from '../types';
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
}

const Inventory: React.FC<InventoryProps> = ({ 
    stock, onUpdateStock, sterilizationCycles = [], onAddCycle, currentUser, 
    currentBranch, availableBranches, transfers = [], onPerformTransfer, patients = [], fieldSettings, onUpdateSettings,
    appointments = []
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

  // --- PREDICTIVE ANALYTICS ENGINE ---
  const forecastingData = useMemo(() => {
    if (!fieldSettings || !appointments) return { shortages: [], timeline: [] };
    
    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(now.getDate() + 7);

    // Filter appointments for next 7 days in this branch
    const upcoming = appointments.filter(a => {
        const aptDate = new Date(a.date);
        return a.branch === currentBranch && aptDate >= now && aptDate <= next7Days;
    });

    const usageMap: Record<string, { total: number, appointments: Appointment[] }> = {};

    upcoming.forEach(apt => {
        const procedureDef = fieldSettings.procedures.find(p => p.name === apt.type);
        if (procedureDef?.billOfMaterials) {
            procedureDef.billOfMaterials.forEach(bom => {
                if (!usageMap[bom.stockItemId]) usageMap[bom.stockItemId] = { total: 0, appointments: [] };
                usageMap[bom.stockItemId].total += bom.quantity;
                usageMap[bom.stockItemId].appointments.push(apt);
            });
        }
    });

    const shortages = Object.entries(usageMap).map(([id, data]) => {
        const stockItem = stock.find(s => s.id === id);
        if (!stockItem) return null;
        
        const remaining = stockItem.quantity - data.total;
        return {
            itemId: id,
            name: stockItem.name,
            current: stockItem.quantity,
            required: data.total,
            remaining,
            isShortage: remaining < 0,
            appointments: data.appointments
        };
    }).filter(s => s !== null);

    return { shortages, upcomingCount: upcoming.length };
  }, [appointments, fieldSettings, stock, currentBranch]);

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
                <button onClick={() => setActiveTab('forecasting')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'forecasting' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><LineChart size={18}/> Demand Forecasting</button>
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

                {activeTab === 'forecasting' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="bg-white p-8 rounded-3xl border border-teal-100 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp size={120}/></div>
                            <h3 className="text-2xl font-black text-teal-900 mb-2 uppercase tracking-tight">Predictive Resource Forecast</h3>
                            <p className="text-slate-500 text-sm max-w-xl mb-8">Analyzing upcoming appointments for the next 7 days to calculate material consumption and identify potential shortages before treatment.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-2xl bg-teal-50 border border-teal-200">
                                    <div className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">Upcoming Procedures</div>
                                    <div className="text-3xl font-black text-teal-900">{forecastingData.upcomingCount}</div>
                                    <div className="text-xs text-teal-700 mt-1">7-Day Outlook</div>
                                </div>
                                <div className="p-6 rounded-2xl bg-lilac-50 border border-lilac-200">
                                    <div className="text-[10px] font-black text-lilac-600 uppercase tracking-widest mb-1">Material Items Flagged</div>
                                    <div className="text-3xl font-black text-lilac-900">{forecastingData.shortages.length}</div>
                                    <div className="text-xs text-lilac-700 mt-1">At-risk supplies</div>
                                </div>
                                <div className="p-6 rounded-2xl bg-red-50 border border-red-200">
                                    <div className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Critical Shortages</div>
                                    <div className="text-3xl font-black text-red-900">{forecastingData.shortages.filter(s => s!.remaining < 0).length}</div>
                                    <div className="text-xs text-red-700 mt-1">Refill immediately</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-700 flex items-center gap-2 px-2"><Activity size={18} className="text-teal-600"/> Resource Allocation Summary</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {forecastingData.shortages.length > 0 ? forecastingData.shortages.map(item => item && (
                                    <div key={item.itemId} className={`bg-white p-6 rounded-3xl border transition-all shadow-sm flex flex-col justify-between ${item.remaining < 0 ? 'border-red-300 ring-4 ring-red-500/5 bg-red-50/20' : 'border-slate-100 hover:border-teal-300'}`}>
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h5 className="font-black text-slate-800 uppercase tracking-tight">{item.name}</h5>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Item ID: {item.itemId}</span>
                                                </div>
                                                {item.remaining < 0 ? (
                                                    <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 animate-pulse"><AlertCircle size={10}/> SHORTAGE</span>
                                                ) : (
                                                    <span className="bg-teal-50 text-teal-700 text-[10px] font-black px-3 py-1 rounded-full border border-teal-100">SAFE</span>
                                                )}
                                            </div>

                                            <div className="space-y-3 mb-6">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span className="text-slate-500">Scheduled Demand</span>
                                                    <span className="text-slate-800">{item.required} units</span>
                                                </div>
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span className="text-slate-500">Current Supply</span>
                                                    <span className="text-slate-800">{item.current} units</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                                                    <div 
                                                        className={`h-full transition-all duration-1000 ${item.remaining < 0 ? 'bg-red-500' : 'bg-teal-500'}`} 
                                                        style={{ width: `${Math.min(100, (item.current / (item.required || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                                {item.remaining < 0 && (
                                                    <p className="text-[10px] font-bold text-red-600 uppercase bg-red-50 p-2 rounded-lg border border-red-100">Missing {Math.abs(item.remaining)} units for upcoming procedures.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100">
                                            <h6 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Affected Scheduled Procedures:</h6>
                                            <div className="space-y-1">
                                                {item.appointments.slice(0, 2).map(apt => (
                                                    <div key={apt.id} className="flex justify-between items-center text-[10px] font-bold text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100">
                                                        <span className="truncate flex items-center gap-1"><ChevronRight size={8} className="text-teal-400"/> {apt.type} ({formatDate(apt.date)})</span>
                                                        <span className="text-slate-400">ID: {apt.id.slice(-4)}</span>
                                                    </div>
                                                ))}
                                                {item.appointments.length > 2 && <div className="text-[8px] font-bold text-slate-400 text-center italic mt-1">+ {item.appointments.length - 2} more appointments</div>}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-2 py-20 text-center flex flex-col items-center gap-4 bg-white rounded-3xl border border-dashed border-slate-200">
                                        <CheckCircle size={48} className="text-teal-200" />
                                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Inventory Fully Prepared for Next 7 Days</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
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

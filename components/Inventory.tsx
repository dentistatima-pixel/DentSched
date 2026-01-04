
import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, AlertTriangle, X, Save, Trash2, Edit2, Shield, CheckCircle, Boxes, Tag, Calendar, AlertCircle, FileText, ShoppingCart, Send, ArrowRight, ArrowRightLeft, MapPin, TrendingUp, Sparkles, Wrench, Clock, Activity, CalendarDays, LineChart, ChevronRight, Zap, Target, History, Scale, ShoppingBag, Download, User as UserIcon, ClipboardCheck, ArrowUpCircle, EyeOff, BarChart2 } from 'lucide-react';
import { StockItem, StockCategory, SterilizationCycle, User, UserRole, PurchaseOrder, PurchaseOrderItem, StockTransfer, Patient, FieldSettings, MaintenanceAsset, Appointment, AuditLogEntry, AppointmentStatus } from '../types';
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
  const complexity = fieldSettings?.features.inventoryComplexity || 'SIMPLE';
  const isAdvanced = complexity === 'ADVANCED';

  const [activeTab, setActiveTab] = useState<'stock' | 'transfers' | 'forecasting' | 'procurement' | 'sterilization'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [editItem, setEditItem] = useState<Partial<StockItem> | null>(null);
  const [auditMode, setAuditMode] = useState(false);
  
  // Suggestion 2: Blind Audit State
  const [sessionPhysicalCounts, setSessionPhysicalCounts] = useState<Record<string, number>>({});
  const [showVarianceReport, setShowVarianceReport] = useState(false);

  const [showCycleModal, setShowCycleModal] = useState(false);
  const [newCycle, setNewCycle] = useState<Partial<SterilizationCycle>>({
      autoclaveName: 'Autoclave 1', cycleNumber: `C${Date.now().toString().slice(-4)}`, passed: true, sterilizationCapacity: 1
  });

  const branchStock = useMemo(() => {
      return stock.filter(s => s.branch === currentBranch || !s.branch);
  }, [stock, currentBranch]);

  const filteredStock = branchStock.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const predictiveMetrics = useMemo(() => {
    const metrics: Record<string, { burnRate: number, daysLeft: number, isAtRisk: boolean }> = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const relevantApts = appointments?.filter(a => a.status === AppointmentStatus.COMPLETED && new Date(a.date) >= thirtyDaysAgo) || [];
    branchStock.forEach(item => {
        let totalConsumed = 0;
        relevantApts.forEach(apt => {
            const proc = fieldSettings?.procedures.find(p => p.name === apt.type);
            const bomItem = proc?.billOfMaterials?.find(b => b.stockItemId === item.id);
            if (bomItem) totalConsumed += bomItem.quantity;
        });
        const dailyBurn = totalConsumed / 30;
        const daysLeft = dailyBurn > 0 ? item.quantity / dailyBurn : 999;
        const leadTime = item.leadTimeDays || 3;
        const isAtRisk = dailyBurn > 0 && daysLeft <= leadTime;
        metrics[item.id] = { burnRate: dailyBurn, daysLeft, isAtRisk };
    });
    return metrics;
  }, [branchStock, appointments, fieldSettings]);

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

  const lowStockItemsBySupplier = useMemo(() => {
      const items = branchStock.filter(s => {
          const isPhysicallyLow = s.quantity <= s.lowStockThreshold;
          const isPredictivelyLow = predictiveMetrics[s.id]?.isAtRisk;
          return isPhysicallyLow || isPredictivelyLow;
      });
      const groups: Record<string, StockItem[]> = {};
      items.forEach(item => {
          const supplier = item.supplier || 'Unassigned Supplier';
          if (!groups[supplier]) groups[supplier] = [];
          groups[supplier].push(item);
      });
      return groups;
  }, [branchStock, predictiveMetrics]);

  const handleDeleteItem = (item: StockItem) => {
      if (isAdvanced && item.isLockedForEvidence) {
          toast.error("MEDICO-LEGAL LOCK: This item is linked to a sealed clinical record.");
          return;
      }
      if (!window.confirm(`PERMANENT DELETION: Remove "${item.name}"?`)) return;
      onUpdateStock(stock.filter(s => s.id !== item.id));
      if (logAction) logAction('DELETE', 'Stock', item.id, `Permanently removed stock item.`);
  };

  const handleSaveItem = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editItem) return;
      const itemToSave = { ...editItem, id: editItem.id || `stk_${Date.now()}`, branch: editItem.branch || currentBranch } as StockItem;
      if (editItem.id) onUpdateStock(stock.map(s => s.id === editItem.id ? itemToSave : s));
      else onUpdateStock([...stock, itemToSave]);
      toast.success("Catalog entry saved.");
      setEditItem(null);
  };

  const handleSaveCycle = () => {
    if (!newCycle.autoclaveName || !newCycle.operator) return;
    const cycle = { ...newCycle, id: `c_${Date.now()}`, date: new Date().toISOString().split('T')[0] } as SterilizationCycle;
    if (onAddCycle) onAddCycle(cycle);
    if (cycle.passed && cycle.restockedItemId && cycle.sterilizationCapacity) {
        onUpdateStock(stock.map(s => {
            if (s.id === cycle.restockedItemId) return { ...s, quantity: s.quantity + (cycle.sterilizationCapacity || 0) };
            return s;
        }));
        toast.success(`Lot tracked: Restored ${cycle.sterilizationCapacity} units.`);
    }
    setShowCycleModal(false);
    setNewCycle({ autoclaveName: 'Autoclave 1', cycleNumber: `C${Date.now().toString().slice(-4)}`, passed: true, sterilizationCapacity: 1 });
  };

  const updatePhysicalCount = (id: string, count: string) => {
      const val = parseInt(count);
      setSessionPhysicalCounts(prev => ({ ...prev, [id]: isNaN(val) ? 0 : val }));
  };

  const getExpiryStatus = (expiryDate?: string) => {
      if (!expiryDate) return { label: 'STABLE', color: 'bg-green-50 text-green-700 border-green-100' };
      const diff = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      if (diff < 0) return { label: 'EXPIRED', color: 'bg-red-600 text-white' };
      if (diff <= 30) return { label: `EXPIRING: ${diff}D`, color: 'bg-orange-100 text-orange-700' };
      return { label: 'OK', color: 'bg-green-50 text-green-700' };
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex-shrink-0 flex justify-between items-start">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-2xl text-blue-700 shadow-sm"><Package size={32} /></div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">{isAdvanced ? 'Clinic Logistics' : 'Stock Control'}</h1>
                    <p className="text-slate-500">Supply chain and material traceability.</p>
                </div>
            </div>
            {isAdvanced && (
                <div className="flex gap-2">
                    <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inventory Reality Score</div>
                            <div className={`text-xl font-black ${realityScore > 90 ? 'text-teal-600' : 'text-orange-500'}`}>{realityScore}%</div>
                        </div>
                    </div>
                </div>
            )}
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
            <div className="flex border-b border-slate-200 px-4 shrink-0 bg-slate-50/50 overflow-x-auto no-scrollbar justify-between items-center">
                <div className="flex">
                    <button onClick={() => setActiveTab('stock')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'stock' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><Boxes size={18}/> Stock</button>
                    {isAdvanced && (
                        <>
                            <button onClick={() => setActiveTab('procurement')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'procurement' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><ShoppingBag size={18}/> Procurement</button>
                            <button onClick={() => setActiveTab('forecasting')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'forecasting' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><LineChart size={18}/> Forecasting</button>
                            <button onClick={() => setActiveTab('sterilization')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'sterilization' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><Shield size={18}/> Sterilization</button>
                        </>
                    )}
                </div>
                {activeTab === 'stock' && isAdvanced && (
                    <div className="pr-4 flex items-center gap-3">
                        <label className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer ${auditMode ? 'bg-lilac-600 border-lilac-500 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500'}`}>
                            <input type="checkbox" checked={auditMode} onChange={e => setAuditMode(e.target.checked)} className="hidden"/>
                            <Scale size={16}/>
                            <span className="text-[10px] font-black uppercase tracking-widest">{auditMode ? 'Blind Audit Active' : 'Enter Audit Mode'}</span>
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
                                <input type="text" placeholder="Search items..." className="input pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            {auditMode ? (
                                <button onClick={() => setShowVarianceReport(true)} className="bg-lilac-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-lilac-600/20"><BarChart2 size={18}/> Analyze Audit Variance</button>
                            ) : (
                                <button onClick={() => setEditItem({ name: '', quantity: 0, lowStockThreshold: 5, category: StockCategory.CONSUMABLES, bulkUnit: 'Box', dispensingUnit: 'Unit', conversionFactor: 1, leadTimeDays: 3 })} className="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-teal-600/20"><Plus size={18}/> Add Item</button>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
                                    <tr><th className="p-4 text-left">Item Name</th>{isAdvanced && <th className="p-4 text-left">Category</th>}{isAdvanced && <th className="p-4 text-center">Status</th>}<th className="p-4 text-right">{auditMode ? 'Record Count (Blind)' : 'Inventory Level'}</th>{isAdvanced && <th className="p-4 text-right">Threshold</th>}<th className="p-4 text-right">Actions</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredStock.map(item => {
                                        const expiry = getExpiryStatus(item.expiryDate);
                                        const isPredictiveAtRisk = predictiveMetrics[item.id]?.isAtRisk;
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50 group">
                                                <td className="p-4"><div className="font-bold text-slate-800">{item.name}</div></td>
                                                {isAdvanced && (<td className="p-4"><span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{item.category}</span></td>)}
                                                {isAdvanced && (
                                                    <td className="p-4 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${expiry.color}`}>{expiry.label}</span>
                                                            {isPredictiveAtRisk && <span className="bg-lilac-100 text-lilac-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase border animate-pulse">Lead-Time Risk</span>}
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="p-4 text-right">
                                                    {auditMode ? (
                                                        <input 
                                                            type="number" 
                                                            value={sessionPhysicalCounts[item.id] ?? ''} 
                                                            onChange={e => updatePhysicalCount(item.id, e.target.value)}
                                                            className="w-24 p-2 text-right border-2 border-lilac-200 rounded-lg font-black text-lilac-900 focus:border-lilac-500 outline-none"
                                                            placeholder="0"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-black text-slate-800">{item.quantity} {item.dispensingUnit || 'Units'}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                {isAdvanced && <td className="p-4 text-right text-slate-400 font-bold">{item.lowStockThreshold}</td>}
                                                <td className="p-4 text-right"><div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setEditItem(item)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"><Edit2 size={14}/></button></div></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {/* Tab content for procurement, sterilization etc... */}
                {activeTab === 'procurement' && (
                     <div className="space-y-6">
                        <div className="bg-white p-10 rounded-3xl border text-center">
                            <ShoppingCart size={48} className="text-slate-200 mx-auto mb-4"/>
                            <p className="text-sm font-bold text-slate-400 uppercase">Automatic procurement bridge is aggregating demand...</p>
                        </div>
                     </div>
                )}
            </div>
        </div>

        {/* Suggestion 2: Variance Report Modal */}
        {showVarianceReport && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex justify-center items-center p-4">
                <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                    <div className="bg-lilac-900 p-8 text-white flex justify-between items-center rounded-t-[3rem]">
                        <div className="flex items-center gap-4">
                            <Scale size={32} className="text-lilac-300"/>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Inventory Variance Report</h3>
                                <p className="text-xs font-bold text-lilac-300 uppercase tracking-widest mt-1">Audit Mode Reconciliation Engine</p>
                            </div>
                        </div>
                        <button onClick={() => setShowVarianceReport(false)}><X size={24}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
                                    <tr><th className="p-4">Stock Item</th><th className="p-4 text-center">System Qty</th><th className="p-4 text-center">Physical Entry</th><th className="p-4 text-right">Variance</th><th className="p-4 text-center">Integrity Status</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {branchStock.map(item => {
                                        const actual = sessionPhysicalCounts[item.id] || 0;
                                        const diff = actual - item.quantity;
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-bold text-slate-700">{item.name}</td>
                                                <td className="p-4 text-center text-slate-400 font-bold">{item.quantity}</td>
                                                <td className="p-4 text-center text-lilac-600 font-black">{actual}</td>
                                                <td className={`p-4 text-right font-black ${diff < 0 ? 'text-red-600' : diff > 0 ? 'text-blue-600' : 'text-teal-600'}`}>{diff > 0 ? `+${diff}` : diff}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase border ${diff === 0 ? 'bg-teal-50 border-teal-200 text-teal-700' : diff < 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                                        {diff === 0 ? 'Verified Match' : diff < 0 ? 'Shrinkage Risk' : 'Surplus Logged'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="p-8 border-t bg-white rounded-b-[3rem] flex justify-end gap-4">
                        <button onClick={() => setShowVarianceReport(false)} className="px-8 py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Return to Audit</button>
                        <button onClick={() => { onUpdateStock(stock.map(s => sessionPhysicalCounts[s.id] !== undefined ? { ...s, quantity: sessionPhysicalCounts[s.id] } : s)); setShowVarianceReport(false); setAuditMode(false); setSessionPhysicalCounts({}); toast.success("Stock levels calibrated to audit counts."); }} className="px-8 py-4 bg-teal-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-teal-600/20">Calibrate & Seal Audit</button>
                    </div>
                </div>
            </div>
        )}

        {/* Modals for cycle and item editing... */}
        {showCycleModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95">
                    <h3 className="text-xl font-bold mb-6">Log Sterilization Load</h3>
                    <div className="space-y-4">
                        <input type="text" value={newCycle.autoclaveName} onChange={e => setNewCycle({...newCycle, autoclaveName: e.target.value})} className="input" placeholder="Autoclave Name" />
                        <select value={newCycle.restockedItemId || ''} onChange={e => setNewCycle({...newCycle, restockedItemId: e.target.value})} className="input">
                            <option value="">- Link Instrument Restock -</option>
                            {branchStock.filter(s => s.category === StockCategory.INSTRUMENTS).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <button onClick={handleSaveCycle} className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold">Save Cycle</button>
                    </div>
                </div>
            </div>
        )}

        {editItem && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
                <form onSubmit={handleSaveItem} className="bg-white w-full max-w-md rounded-3xl p-8 animate-in zoom-in-95">
                    <h3 className="text-xl font-bold mb-6">Catalog Entry</h3>
                    <div className="space-y-4">
                        <input type="text" value={editItem.name || ''} onChange={e => setEditItem({...editItem, name: e.target.value})} className="input" placeholder="Item Name" required />
                        <input type="number" value={editItem.quantity || ''} onChange={e => setEditItem({...editItem, quantity: parseInt(e.target.value)})} className="input" placeholder="Current Qty" />
                        <button type="submit" className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold">Save Item</button>
                    </div>
                </form>
            </div>
        )}
    </div>
  );
};

export default Inventory;

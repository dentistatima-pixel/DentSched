import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, AlertTriangle, X, Save, Trash2, Edit2, Shield, CheckCircle, Boxes, Tag, Calendar, AlertCircle, FileText, ShoppingCart, Send, ArrowRight, ArrowRightLeft, MapPin, TrendingUp, Sparkles, Wrench, Clock, Activity, CalendarDays, LineChart, ChevronRight, Zap, Target, History, Scale, ShoppingBag, Download, User as UserIcon, ClipboardCheck, ArrowUpCircle, EyeOff, BarChart2, Armchair, ShieldCheck, Thermometer, ArrowLeft } from 'lucide-react';
import { StockItem, StockCategory, SterilizationCycle, User, UserRole, PurchaseOrder, PurchaseOrderItem, StockTransfer, Patient, FieldSettings, MaintenanceAsset, Appointment, AuditLogEntry, AppointmentStatus, InstrumentSet } from '../types';
import { useToast } from './ToastSystem';
import { formatDate, STAFF } from '../constants';

interface InventoryProps {
  stock: StockItem[];
  onUpdateStock: (updatedStock: StockItem[]) => void;
  sterilizationCycles?: SterilizationCycle[];
  onAddCycle?: (cycle: any) => void;
  currentUser: User;
  currentBranch: string;
  availableBranches: string[];
  transfers: StockTransfer[];
  onPerformTransfer: (t: StockTransfer) => void;
  patients?: Patient[];
  fieldSettings?: FieldSettings;
  onUpdateSettings?: (s: FieldSettings) => void;
  appointments?: Appointment[];
  logAction?: (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], entityId: string, details: string) => void;
  onBack?: () => void;
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
    appointments = [], logAction, onBack
}) => {
  const toast = useToast();
  const complexity = fieldSettings?.features.inventoryComplexity || 'SIMPLE';
  const isAdvanced = complexity === 'ADVANCED';

  const [activeTab, setActiveTab] = useState<'stock' | 'transfers' | 'forecasting' | 'procurement' | 'sterilization'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [editItem, setEditItem] = useState<Partial<StockItem> | null>(null);
  const [auditMode, setAuditMode] = useState(false);
  
  // --- UPGRADE 1: SET MANAGEMENT STATE ---
  const [isManagingSets, setIsManagingSets] = useState(false);
  const [newSetName, setNewSetName] = useState('');

  const [sessionPhysicalCounts, setSessionPhysicalCounts] = useState<Record<string, number>>({});
  const [showVarianceReport, setShowVarianceReport] = useState(false);

  const [showCycleModal, setShowCycleModal] = useState(false);
  const [newCycle, setNewCycle] = useState<Partial<SterilizationCycle>>({
      autoclaveName: 'Autoclave 1', cycleNumber: `C${Date.now().toString().slice(-4)}`, passed: true, instrumentSetIds: []
  });

  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferData, setTransferData] = useState({ itemId: '', quantity: 1, toBranch: '' });

  const handleTransfer = () => {
    if (!transferData.itemId || transferData.quantity <= 0 || !transferData.toBranch) {
        toast.error("All transfer fields are required.");
        return;
    }
    const item = stock.find(s => s.id === transferData.itemId);
    if (!item) return;
    if (item.quantity < transferData.quantity) {
        toast.error("Insufficient stock for transfer.");
        return;
    }
    const newTransfer: StockTransfer = {
        id: `xfer_${Date.now()}`,
        date: new Date().toISOString(),
        itemId: item.id,
        itemName: item.name,
        fromBranch: currentBranch,
        toBranch: transferData.toBranch,
        quantity: transferData.quantity,
        initiatedBy: currentUser.name,
        status: 'Completed'
    };
    onPerformTransfer(newTransfer);
    setShowTransferForm(false);
    setTransferData({ itemId: '', quantity: 1, toBranch: '' });
    toast.success("Stock transfer logged.");
  };

  const branchStock = useMemo(() => {
      return stock.filter(s => s.branch === currentBranch || !s.branch);
  }, [stock, currentBranch]);

  const branchSets = useMemo(() => {
      return fieldSettings?.instrumentSets?.filter(s => s.branch === currentBranch) || [];
  }, [fieldSettings, currentBranch]);

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

  const handleFormChange = (field: keyof StockItem, value: any) => {
    if (editItem) {
        setEditItem({ ...editItem, [field]: value });
    }
  };

  const handleSaveItem = () => {
    if (!editItem || !editItem.name?.trim()) {
        toast.error("Item name is required.");
        return;
    }
    const updatedItem = { ...editItem, branch: currentBranch }; // Ensure branch is set

    const isNew = !updatedItem.id;
    const newStock = isNew
        ? [...stock, { ...updatedItem, id: `stk_${Date.now()}` } as StockItem]
        : stock.map(s => s.id === updatedItem.id ? updatedItem as StockItem : s);

    onUpdateStock(newStock);
    logAction?.(isNew ? 'CREATE' : 'UPDATE', 'StockItem', updatedItem.id || `stk_${Date.now()}`, `Item ${updatedItem.name} saved.`);
    setEditItem(null);
    toast.success(`Item "${updatedItem.name}" saved successfully.`);
  };

  const handleAddSet = () => {
      if (!newSetName.trim() || !onUpdateSettings || !fieldSettings) return;
      const newSet: InstrumentSet = { id: `set_${Date.now()}`, name: newSetName, status: 'Contaminated', branch: currentBranch };
      onUpdateSettings({ ...fieldSettings, instrumentSets: [...(fieldSettings.instrumentSets || []), newSet] });
      setNewSetName('');
      toast.success(`Instrument Set "${newSet.name}" added to registry.`);
  };

  const handleSaveCycle = () => {
    if (!newCycle.autoclaveName || !newCycle.operator || !onUpdateSettings || !fieldSettings) return;
    const cycle = { ...newCycle, id: `c_${Date.now()}`, date: new Date().toISOString().split('T')[0] } as SterilizationCycle;
    
    if (onAddCycle) onAddCycle(cycle);

    if (cycle.passed && cycle.instrumentSetIds && cycle.instrumentSetIds.length > 0) {
        const updatedSets = fieldSettings.instrumentSets?.map(set => 
            cycle.instrumentSetIds!.includes(set.id) ? { ...set, status: 'Sterile' as const, lastCycleId: cycle.id } : set
        );
        onUpdateSettings({ ...fieldSettings, instrumentSets: updatedSets });
        toast.success(`Load Result: ${cycle.instrumentSetIds.length} sets marked STERILE.`);
    }

    setShowCycleModal(false);
    setNewCycle({ autoclaveName: 'Autoclave 1', cycleNumber: `C${Date.now().toString().slice(-4)}`, passed: true, instrumentSetIds: [] });
  };

  const updatePhysicalCount = (id: string, count: string) => {
      const val = parseInt(count);
      setSessionPhysicalCounts(prev => ({ ...prev, [id]: isNaN(val) ? 0 : val }));
  };

  const getExpiryStatus = (expiryDate?: string) => {
      if (!expiryDate) return { label: 'STABLE', color: 'bg-green-50 text-teal-800 border-teal-100' };
      const diff = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      if (diff < 0) return { label: 'EXPIRED', color: 'bg-red-600 text-white border-red-700 shadow-md' };
      if (diff <= 30) return { label: `EXPIRING: ${diff}D`, color: 'bg-orange-100 text-orange-900 border-orange-200' };
      return { label: 'OK', color: 'bg-green-50 text-teal-800 border-teal-100' };
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20" role="main" aria-label="Supply Chain and Sterilization System">
        <header className="flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
                {onBack && (
                  <button onClick={onBack} className="bg-white p-4 rounded-full shadow-sm border hover:bg-slate-100 transition-all active:scale-90" aria-label="Back to Admin Hub">
                      <ArrowLeft size={24} className="text-slate-600"/>
                  </button>
                )}
                <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-xl" aria-hidden="true"><Package size={36} /></div>
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">{isAdvanced ? 'Clinic Logistics' : 'Stock Control'}</h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Supply chain and material traceability.</p>
                </div>
            </div>
            {isAdvanced && (
                <div className="flex gap-2">
                    <div className="bg-white px-6 py-3 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center gap-4 group hover:border-teal-500 transition-all">
                        <div className="text-right">
                            <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Inventory Integrity</div>
                            <div className={`text-2xl font-black leading-none mt-1 ${realityScore > 90 ? 'text-teal-700' : 'text-orange-700'}`}>{realityScore}%</div>
                        </div>
                        <Scale size={24} className={realityScore > 90 ? 'text-teal-500' : 'text-orange-500'} aria-hidden="true"/>
                    </div>
                </div>
            )}
        </header>

        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-900/5 border-2 border-white flex-1 flex flex-col overflow-hidden relative">
            <div className="flex border-b border-slate-100 px-8 shrink-0 bg-slate-50/50 overflow-x-auto no-scrollbar justify-between items-center" role="tablist" aria-label="Inventory Sections">
                <div className="flex gap-2 pt-2">
                    <button 
                        role="tab"
                        aria-selected={activeTab === 'stock' && !isManagingSets}
                        onClick={() => { setActiveTab('stock'); setIsManagingSets(false); }} 
                        className={`py-6 px-6 font-black text-xs uppercase tracking-widest border-b-4 flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === 'stock' && !isManagingSets ? 'border-teal-600 text-teal-900 bg-white' : 'border-transparent text-slate-500 hover:text-teal-700 hover:bg-white/50'}`}
                    >
                        <Boxes size={18} aria-hidden="true"/> Stock Registry
                    </button>
                    {isAdvanced && (
                        <>
                            <button 
                                role="tab"
                                aria-selected={activeTab === 'transfers'}
                                onClick={() => setActiveTab('transfers')} 
                                className={`py-6 px-6 font-black text-xs uppercase tracking-widest border-b-4 flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === 'transfers' ? 'border-teal-600 text-teal-900 bg-white' : 'border-transparent text-slate-500 hover:text-teal-700 hover:bg-white/50'}`}
                            >
                                <ArrowRightLeft size={18} aria-hidden="true"/> Stock Transfers
                            </button>
                            <button 
                                role="tab"
                                aria-selected={activeTab === 'stock' && isManagingSets}
                                onClick={() => { setActiveTab('stock'); setIsManagingSets(true); }} 
                                className={`py-6 px-6 font-black text-xs uppercase tracking-widest border-b-4 flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === 'stock' && isManagingSets ? 'border-lilac-600 text-lilac-900 bg-white' : 'border-transparent text-slate-500 hover:text-lilac-700 hover:bg-white/50'}`}
                            >
                                <Armchair size={18} aria-hidden="true"/> Set Management
                            </button>
                             <button 
                                role="tab"
                                aria-selected={activeTab === 'forecasting'}
                                onClick={() => setActiveTab('forecasting')} 
                                className={`py-6 px-6 font-black text-xs uppercase tracking-widest border-b-4 flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === 'forecasting' ? 'border-teal-600 text-teal-900 bg-white' : 'border-transparent text-slate-500 hover:text-teal-700 hover:bg-white/50'}`}
                            >
                                <TrendingUp size={18} aria-hidden="true"/> Forecasting
                            </button>
                            <button 
                                role="tab"
                                aria-selected={activeTab === 'procurement'}
                                onClick={() => setActiveTab('procurement')} 
                                className={`py-6 px-6 font-black text-xs uppercase tracking-widest border-b-4 flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === 'procurement' ? 'border-teal-600 text-teal-900 bg-white' : 'border-transparent text-slate-500 hover:text-teal-700 hover:bg-white/50'}`}
                            >
                                <ShoppingBag size={18} aria-hidden="true"/> Procurement
                            </button>
                            <button 
                                role="tab"
                                aria-selected={activeTab === 'sterilization'}
                                onClick={() => setActiveTab('sterilization')} 
                                className={`py-6 px-6 font-black text-xs uppercase tracking-widest border-b-4 flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === 'sterilization' ? 'border-teal-600 text-teal-900 bg-white' : 'border-transparent text-slate-500 hover:text-teal-700 hover:bg-white/50'}`}
                            >
                                <Shield size={18} aria-hidden="true"/> Sterilization
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 no-scrollbar">
                {activeTab === 'stock' && !isManagingSets && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="relative w-full md:w-96 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={20} />
                                <input type="text" placeholder="Search items..." aria-label="Search items" className="input pl-12" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <div className="flex gap-3">
                                {auditMode ? (
                                    <button onClick={() => setShowVarianceReport(true)} className="bg-lilac-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-lilac-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><BarChart2 size={20}/> Analyze Audit Variance</button>
                                ) : (
                                    <button onClick={() => setEditItem({ name: '', quantity: 0, lowStockThreshold: 5, category: StockCategory.CONSUMABLES, bulkUnit: 'Box', dispensingUnit: 'Unit', conversionFactor: 1, leadTimeDays: 3 })} className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> Register Item</button>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm" role="table" aria-label="Inventory Table">
                                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-500 tracking-[0.2em]">
                                    <tr><th className="p-5 text-left">Item Narrative</th>{isAdvanced && <th className="p-5 text-left">Classification</th>}{isAdvanced && <th className="p-5 text-center">Protocol Status</th>}<th className="p-5 text-right">{auditMode ? 'Blind Forensic Count' : 'Registry Level'}</th>{isAdvanced && <th className="p-5 text-right">Limit</th>}<th className="p-5 text-right">Actions</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredStock.map(item => {
                                        const expiry = getExpiryStatus(item.expiryDate);
                                        const isPredictiveAtRisk = predictiveMetrics[item.id]?.isAtRisk;
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50 group transition-colors">
                                                <td className="p-5"><div className="font-black text-slate-800 uppercase tracking-tight">{item.name}</div><div className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">UID: {item.id}</div></td>
                                                {isAdvanced && (<td className="p-5"><span className="text-xs font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tighter border border-slate-200">{item.category}</span></td>)}
                                                {isAdvanced && (
                                                    <td className="p-5 text-center">
                                                        <div className="flex flex-col items-center gap-1.5">
                                                            <span className={`text-[11px] font-black px-3 py-1 rounded-full border shadow-sm uppercase tracking-widest ${expiry.color}`}>{expiry.label}</span>
                                                            {isPredictiveAtRisk && <span className="bg-lilac-100 text-lilac-800 px-2 py-0.5 rounded-full text-[11px] font-black uppercase border-2 border-lilac-200 animate-pulse tracking-tighter">Supply-Chain Risk</span>}
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="p-5 text-right">
                                                    {auditMode ? (
                                                        <input 
                                                            type="number" 
                                                            aria-label={`Audit count for ${item.name}`}
                                                            value={sessionPhysicalCounts[item.id] ?? ''} 
                                                            onChange={e => updatePhysicalCount(item.id, e.target.value)}
                                                            className="w-28 p-3 text-right border-2 border-lilac-200 rounded-xl font-black text-xl text-lilac-900 focus:border-lilac-500 outline-none shadow-inner"
                                                            placeholder="0"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xl font-black text-slate-800 leading-none">{item.quantity}</span>
                                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{item.dispensingUnit || 'Units'}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                {isAdvanced && <td className="p-5 text-right text-slate-500 font-black text-sm uppercase">{item.lowStockThreshold}</td>}
                                                <td className="p-5 text-right"><div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setEditItem(item)} className="p-3 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-2xl transition-all" aria-label={`Edit ${item.name}`}><Edit2 size={18}/></button></div></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredStock.length === 0 && <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest opacity-40">No items found in branch registry.</div>}
                        </div>
                    </div>
                )}
                 {activeTab === 'transfers' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Stock Transfers</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Inter-Branch Logistics</p>
                            </div>
                            <button onClick={() => setShowTransferForm(true)} className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> New Transfer</button>
                        </div>
                        {showTransferForm && (
                            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-teal-100 shadow-2xl space-y-6 animate-in zoom-in-95">
                                <h4 className="font-black text-teal-800 uppercase tracking-widest text-sm">Initiate Transfer</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <select value={transferData.itemId} onChange={e => setTransferData({...transferData, itemId: e.target.value})} className="input md:col-span-2"><option value="">- Select Item -</option>{branchStock.map(i => <option key={i.id} value={i.id}>{i.name} (Available: {i.quantity})</option>)}</select>
                                    <input type="number" value={transferData.quantity} onChange={e => setTransferData({...transferData, quantity: parseInt(e.target.value)})} className="input" placeholder="Quantity"/>
                                </div>
                                <select value={transferData.toBranch} onChange={e => setTransferData({...transferData, toBranch: e.target.value})} className="input"><option value="">- Destination Branch -</option>{availableBranches.filter(b=>b !== currentBranch).map(b => <option key={b} value={b}>{b}</option>)}</select>
                                <div className="flex gap-4"><button onClick={() => setShowTransferForm(false)} className="flex-1 py-3 bg-slate-100 rounded-xl text-xs font-black uppercase">Cancel</button><button onClick={handleTransfer} className="flex-1 py-3 bg-teal-600 text-white rounded-xl text-xs font-black uppercase">Execute</button></div>
                            </div>
                        )}
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 tracking-widest">
                                    <tr><th className="p-4 text-left">Date</th><th className="p-4 text-left">Item</th><th className="p-4 text-center">Qty</th><th className="p-4 text-left">From</th><th className="p-4 text-left">To</th><th className="p-4 text-left">Initiated By</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {transfers.map(t => (
                                        <tr key={t.id} className="hover:bg-slate-50">
                                            <td className="p-4 font-mono text-xs">{formatDate(t.date)}</td>
                                            <td className="p-4 font-bold">{t.itemName}</td>
                                            <td className="p-4 font-black text-center">{t.quantity}</td>
                                            <td className="p-4">{t.fromBranch}</td>
                                            <td className="p-4">{t.toBranch}</td>
                                            <td className="p-4 text-xs font-bold uppercase text-slate-500">{t.initiatedBy}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                 )}
                 {activeTab === 'forecasting' && (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Supply Chain Forecasting</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {branchStock.map(item => {
                                const metric = predictiveMetrics[item.id];
                                return (
                                    <div key={item.id} className={`p-6 rounded-3xl border-2 shadow-sm ${metric.isAtRisk ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
                                        <div className="font-black text-slate-800 uppercase">{item.name}</div>
                                        <div className="flex justify-between items-end mt-4">
                                            <div>
                                                <div className="text-xs font-bold text-slate-500">Days Left</div>
                                                <div className={`text-3xl font-black ${metric.daysLeft < 999 ? 'text-teal-700' : 'text-slate-400'}`}>{metric.daysLeft < 999 ? Math.round(metric.daysLeft) : '∞'}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-slate-500">Burn Rate</div>
                                                <div className="text-lg font-bold text-slate-600">{metric.burnRate.toFixed(2)}/day</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                 )}
                 {activeTab === 'procurement' && (
                    <div className="space-y-6">
                         <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Procurement & Orders</h3>
                         <div className="bg-white p-8 rounded-3xl border shadow-sm">
                            <h4 className="font-bold text-lg mb-4">New Purchase Order</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <select className="input"><option>Select Vendor</option></select>
                                <input type="date" className="input" />
                            </div>
                            <div className="mt-4 border-t pt-4">
                                <p className="font-bold mb-2">Items</p>
                                <div className="flex gap-4 items-center">
                                    <select className="input flex-1"><option>Select Item</option></select>
                                    <input type="number" placeholder="Qty" className="input w-24"/>
                                    <button className="p-2 bg-teal-100 text-teal-700 rounded-lg"><Plus size={16}/></button>
                                </div>
                            </div>
                            <button onClick={() => toast.success("Purchase Order submitted.")} className="mt-6 bg-teal-600 text-white px-6 py-3 rounded-lg text-sm font-bold">Submit Purchase Order</button>
                         </div>
                    </div>
                 )}
            </div>
        </div>

        {editItem && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4 animate-in fade-in duration-300">
                <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="bg-teal-900 p-6 text-white flex justify-between items-center shrink-0 rounded-t-[2.5rem]">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-xl"><Package size={24} /></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">{editItem.id ? 'Edit Stock Item' : 'Register New Item'}</h3>
                                <p className="text-xs text-teal-300 font-bold uppercase tracking-widest">Supply Chain Registry</p>
                            </div>
                        </div>
                        <button onClick={() => setEditItem(null)}><X size={24} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50">
                        <div><label className="label">Item Narrative</label><input type="text" value={editItem.name || ''} onChange={e => handleFormChange('name', e.target.value)} className="input" /></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div><label className="label">Classification</label><select value={editItem.category} onChange={e => handleFormChange('category', e.target.value)} className="input">{Object.values(StockCategory).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                            <div><label className="label">Registry Level</label><input type="number" value={editItem.quantity ?? ''} onChange={e => handleFormChange('quantity', parseInt(e.target.value))} className="input" /></div>
                            <div><label className="label">Low Stock Threshold</label><input type="number" value={editItem.lowStockThreshold ?? ''} onChange={e => handleFormChange('lowStockThreshold', parseInt(e.target.value))} className="input" /></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div><label className="label">Expiry Date</label><input type="date" value={editItem.expiryDate || ''} onChange={e => handleFormChange('expiryDate', e.target.value)} className="input" /></div>
                            <div><label className="label">Batch Number</label><input type="text" value={editItem.batchNumber || ''} onChange={e => handleFormChange('batchNumber', e.target.value)} className="input" /></div>
                            <div><label className="label">Supplier</label><input type="text" value={editItem.supplier || ''} onChange={e => handleFormChange('supplier', e.target.value)} className="input" /></div>
                        </div>
                        {isAdvanced && (
                             <div className="pt-6 border-t border-slate-200 mt-6 space-y-6">
                                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Advanced Traceability</h4>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                     <div><label className="label text-xs">Bulk Unit</label><input type="text" value={editItem.bulkUnit || ''} onChange={e => handleFormChange('bulkUnit', e.target.value)} className="input" /></div>
                                     <div><label className="label text-xs">Dispensing Unit</label><input type="text" value={editItem.dispensingUnit || ''} onChange={e => handleFormChange('dispensingUnit', e.target.value)} className="input" /></div>
                                     <div><label className="label text-xs">Conversion</label><input type="number" value={editItem.conversionFactor ?? ''} onChange={e => handleFormChange('conversionFactor', parseFloat(e.target.value))} className="input" /></div>
                                     <div><label className="label text-xs">Lead Time (Days)</label><input type="number" value={editItem.leadTimeDays ?? ''} onChange={e => handleFormChange('leadTimeDays', parseInt(e.target.value))} className="input" /></div>
                                 </div>
                             </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0 rounded-b-[2.5rem]">
                        <button onClick={() => setEditItem(null)} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
                        <button onClick={handleSaveItem} className="px-12 py-4 bg-teal-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-teal-700 transition-all flex items-center gap-3">
                            <Save size={20} /> Save to Registry
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Inventory;

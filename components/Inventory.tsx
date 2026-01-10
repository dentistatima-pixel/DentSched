import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, AlertTriangle, X, Save, Trash2, Edit2, Shield, CheckCircle, Boxes, Tag, Calendar, AlertCircle, FileText, ShoppingCart, Send, ArrowRight, ArrowRightLeft, MapPin, TrendingUp, Sparkles, Wrench, Clock, Activity, CalendarDays, LineChart, ChevronRight, Zap, Target, History, Scale, ShoppingBag, Download, User as UserIcon, ClipboardCheck, ArrowUpCircle, EyeOff, BarChart2, Armchair, ShieldCheck, Thermometer } from 'lucide-react';
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
  
  // --- UPGRADE 1: SET MANAGEMENT STATE ---
  const [isManagingSets, setIsManagingSets] = useState(false);
  const [newSetName, setNewSetName] = useState('');

  const [sessionPhysicalCounts, setSessionPhysicalCounts] = useState<Record<string, number>>({});
  const [showVarianceReport, setShowVarianceReport] = useState(false);

  const [showCycleModal, setShowCycleModal] = useState(false);
  const [newCycle, setNewCycle] = useState<Partial<SterilizationCycle>>({
      autoclaveName: 'Autoclave 1', cycleNumber: `C${Date.now().toString().slice(-4)}`, passed: true, instrumentSetIds: []
  });

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
            cycle.instrumentSetIds!.includes(set.id) ? { ...set, status: 'Sterile', lastCycleId: cycle.id } : set
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
                                aria-selected={activeTab === 'stock' && isManagingSets}
                                onClick={() => { setActiveTab('stock'); setIsManagingSets(true); }} 
                                className={`py-6 px-6 font-black text-xs uppercase tracking-widest border-b-4 flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === 'stock' && isManagingSets ? 'border-lilac-600 text-lilac-900 bg-white' : 'border-transparent text-slate-500 hover:text-lilac-700 hover:bg-white/50'}`}
                            >
                                <Armchair size={18} aria-hidden="true"/> Set Management
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

                {isManagingSets && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="bg-white p-10 rounded-[3rem] border border-lilac-100 shadow-xl shadow-lilac-600/5 flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1 w-full">
                                <label className="text-xs font-black text-lilac-700 uppercase tracking-widest ml-1 mb-2 block">Define New Instrument Set</label>
                                <input 
                                    type="text" 
                                    value={newSetName}
                                    onChange={e => setNewSetName(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-slate-800 focus:border-lilac-500 outline-none transition-all shadow-inner"
                                    placeholder="e.g. Surgery Kit Alpha"
                                />
                            </div>
                            <button onClick={handleAddSet} className="w-full md:w-auto self-end px-12 py-5 bg-lilac-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-lilac-600/20 hover:scale-105 active:scale-95 transition-all">Register New Set</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {branchSets.map(set => (
                                <div key={set.id} className="bg-white p-8 rounded-[3.5rem] border-4 border-slate-50 shadow-xl flex flex-col justify-between group hover:border-lilac-500 transition-all hover:-translate-y-2">
                                    <div>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="bg-lilac-50 p-4 rounded-3xl text-lilac-600 group-hover:bg-lilac-600 group-hover:text-white transition-all shadow-sm"><Armchair size={32} aria-hidden="true"/></div>
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase border-2 shadow-sm tracking-widest ${
                                                set.status === 'Sterile' ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-red-50 border-red-200 text-red-700'
                                            }`}>
                                                {set.status}
                                            </span>
                                        </div>
                                        <h4 className="font-black text-slate-900 uppercase tracking-tighter text-xl leading-none mb-2">{set.name}</h4>
                                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">REGISTRY_ID: {set.id}</p>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                                        <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Last Cycle: <span className="text-teal-700 font-mono font-black">{set.lastCycleId || 'NONE'}</span></div>
                                    </div>
                                </div>
                            ))}
                            {branchSets.length === 0 && <div className="col-span-full py-20 text-center opacity-30 italic uppercase font-black text-slate-800 tracking-widest">No active instrument sets in registry.</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'sterilization' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="bg-white p-10 rounded-[3rem] border border-teal-100 shadow-xl shadow-teal-600/5 flex flex-col md:flex-row justify-between items-center gap-6">
                             <div className="flex items-center gap-6">
                                <div className="p-4 bg-teal-50 text-teal-600 rounded-3xl shadow-sm" aria-hidden="true"><Thermometer size={40}/></div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Sterilization Registry</h3>
                                    <p className="text-xs text-slate-500 font-black uppercase tracking-widest mt-1">Autoclave Biological & Physical Verification</p>
                                </div>
                             </div>
                             <button onClick={() => setShowCycleModal(true)} className="px-10 py-5 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> Register New Load</button>
                        </div>
                        <div className="space-y-4">
                            {sterilizationCycles.map(cycle => (
                                <div key={cycle.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-xl flex flex-col md:flex-row items-center justify-between group hover:border-teal-500 transition-all gap-8">
                                    <div className="flex items-center gap-8 w-full md:w-auto">
                                        <div className={`p-5 rounded-[2rem] shadow-lg transition-transform group-hover:scale-110 ${cycle.passed ? 'bg-teal-50 text-teal-600 border-2 border-teal-100' : 'bg-red-50 text-red-600 border-2 border-red-100 animate-pulse'}`}>
                                            {cycle.passed ? <CheckCircle size={32} aria-hidden="true"/> : <AlertTriangle size={32} aria-hidden="true"/>}
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-slate-500 uppercase tracking-widest">{formatDate(cycle.date)} • {cycle.autoclaveName}</div>
                                            <h4 className="font-black text-slate-800 text-2xl uppercase tracking-tighter leading-none mt-1">Cycle #{cycle.cycleNumber}</h4>
                                            {cycle.instrumentSetIds && cycle.instrumentSetIds.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {cycle.instrumentSetIds.map(sid => (
                                                        <span key={sid} className="bg-slate-50 text-[11px] font-black px-3 py-1 rounded-xl border border-slate-200 uppercase text-slate-600 tracking-tight shadow-sm">
                                                            {fieldSettings?.instrumentSets?.find(s => s.id === sid)?.name || sid}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-slate-50">
                                        <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Load Operator</div>
                                        <div className="text-lg font-black text-slate-800 uppercase mt-1 flex items-center justify-end gap-2"><UserIcon size={18} className="text-teal-600"/> {cycle.operator}</div>
                                    </div>
                                </div>
                            ))}
                            {sterilizationCycles.length === 0 && <div className="p-20 text-center opacity-30 italic font-black text-slate-800 tracking-widest uppercase">No sterilization cycles recorded in registry.</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {showCycleModal && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex justify-center items-center p-4 animate-in fade-in duration-200" role="dialog" aria-labelledby="load-modal-title" aria-modal="true">
                <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-4 border-teal-100">
                    <div className="bg-teal-900 p-8 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <ShieldCheck size={32} className="text-teal-400" aria-hidden="true"/>
                            <div>
                                <h3 id="load-modal-title" className="text-2xl font-black uppercase tracking-tighter leading-none">Register Cycle Load</h3>
                                <p className="text-xs font-bold text-teal-300 uppercase tracking-widest mt-1">Instrument Life-Cycle Traceability</p>
                            </div>
                        </div>
                        <button onClick={() => setShowCycleModal(false)} aria-label="Close load registration"><X size={24}/></button>
                    </div>

                    <div className="p-8 space-y-6 flex-1 overflow-y-auto no-scrollbar bg-slate-50/30">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="label text-xs">Autoclave Unit</label><select aria-label="Autoclave select" value={newCycle.autoclaveName} onChange={e => setNewCycle({...newCycle, autoclaveName: e.target.value})} className="input text-sm"><option>Autoclave 1</option><option>Autoclave 2</option></select></div>
                            <div><label className="label text-xs">Cycle Reference #</label><input type="text" value={newCycle.cycleNumber} onChange={e => setNewCycle({...newCycle, cycleNumber: e.target.value})} className="input text-sm font-mono" placeholder="AUTO_XXXX"/></div>
                        </div>
                        <div>
                            <label className="label text-xs">Operating Personnel</label>
                            <select aria-label="Operating Personnel" value={newCycle.operator} onChange={e => setNewCycle({...newCycle, operator: e.target.value})} className="input text-sm font-bold">
                                <option value="">- Select Verified Staff -</option>
                                {STAFF.map(s => <option key={s.id} value={s.name}>{s.name} ({s.role})</option>)}
                            </select>
                        </div>

                        <div className="space-y-3">
                             <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Armchair size={16} className="text-lilac-600"/> Load Composition Registry</label>
                             <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border-2 border-slate-100 rounded-2xl p-2 bg-white shadow-inner no-scrollbar">
                                 {branchSets.map(set => {
                                     const isSelected = newCycle.instrumentSetIds?.includes(set.id);
                                     return (
                                         <button 
                                            key={set.id}
                                            onClick={() => {
                                                const current = newCycle.instrumentSetIds || [];
                                                const next = current.includes(set.id) ? current.filter(i => i !== set.id) : [...current, set.id];
                                                setNewCycle({...newCycle, instrumentSetIds: next});
                                            }}
                                            className={`p-4 rounded-xl border-2 text-left flex justify-between items-center transition-all ${isSelected ? 'bg-teal-50 border-teal-500 shadow-sm' : 'bg-white border-slate-100 opacity-60 hover:opacity-100'}`}
                                         >
                                             <div>
                                                 <div className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none">{set.name}</div>
                                                 <div className="text-[11px] font-black text-slate-500 uppercase mt-1">Status: {set.status}</div>
                                             </div>
                                             {isSelected && <CheckCircle size={20} className="text-teal-600" aria-hidden="true"/>}
                                         </button>
                                     );
                                 })}
                             </div>
                        </div>

                        <label className={`flex items-center gap-4 p-5 rounded-3xl border-2 cursor-pointer transition-all shadow-sm ${newCycle.passed ? 'bg-teal-50 border-teal-500' : 'bg-red-50 border-red-500 animate-pulse'}`}>
                            <input type="checkbox" checked={newCycle.passed} onChange={e => setNewCycle({...newCycle, passed: e.target.checked})} className="w-8 h-8 accent-teal-600 rounded" />
                            <div>
                                <span className="font-black text-slate-950 uppercase text-xs tracking-widest">Biological Indicator Passed</span>
                                <p className="text-[11px] text-slate-700 leading-tight uppercase font-black mt-1">I certify that chemical/biological indicators confirm successful sterilization of this entire load.</p>
                            </div>
                        </label>
                    </div>

                    <div className="p-8 border-t bg-white flex gap-4 shrink-0">
                        <button onClick={() => setShowCycleModal(false)} className="flex-1 py-5 bg-slate-100 border font-black uppercase text-xs tracking-widest rounded-2xl text-slate-600">Cancel</button>
                        <button onClick={handleSaveCycle} className="flex-[2] py-5 bg-teal-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all">Finalize forensic cycle log</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Inventory;

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

    // --- UPGRADE 1: UPDATE INSTRUMENT SET STATUS ---
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
                    <button onClick={() => { setActiveTab('stock'); setIsManagingSets(false); }} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'stock' && !isManagingSets ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><Boxes size={18}/> Stock</button>
                    {isAdvanced && (
                        <>
                            <button onClick={() => { setActiveTab('stock'); setIsManagingSets(true); }} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'stock' && isManagingSets ? 'border-lilac-600 text-lilac-800 bg-white' : 'border-transparent text-slate-500 hover:text-lilac-600'}`}><Armchair size={18}/> Set Management</button>
                            <button onClick={() => setActiveTab('procurement')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'procurement' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><ShoppingBag size={18}/> Procurement</button>
                            <button onClick={() => setActiveTab('sterilization')} className={`py-4 px-6 font-bold text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'sterilization' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><Shield size={18}/> Sterilization</button>
                        </>
                    )}
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                {activeTab === 'stock' && !isManagingSets && (
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

                {/* --- UPGRADE 1: INSTRUMENT SET MANAGEMENT UI --- */}
                {isManagingSets && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-white p-6 rounded-3xl border border-lilac-100 shadow-sm flex items-center gap-4">
                            <div className="flex-1">
                                <label className="text-[10px] font-black text-lilac-700 uppercase tracking-widest ml-1 mb-2 block">Define New Set Identity</label>
                                <input 
                                    type="text" 
                                    value={newSetName}
                                    onChange={e => setNewSetName(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:border-lilac-500 outline-none"
                                    placeholder="e.g. Surgery Kit Alpha"
                                />
                            </div>
                            <button onClick={handleAddSet} className="self-end px-8 py-4 bg-lilac-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-lilac-600/20 hover:scale-105 transition-all">Register Set</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {branchSets.map(set => (
                                <div key={set.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex flex-col justify-between group hover:border-lilac-500 transition-all">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="bg-lilac-50 p-3 rounded-2xl text-lilac-600"><Armchair size={24}/></div>
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                                                set.status === 'Sterile' ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-red-50 border-red-200 text-red-600'
                                            }`}>
                                                {set.status}
                                            </span>
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{set.name}</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">ID: {set.id}</p>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Cycle: {set.lastCycleId || 'NONE'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'sterilization' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-[2.5rem] border border-teal-100 shadow-sm flex justify-between items-center">
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl"><Thermometer size={24}/></div>
                                <div>
                                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Sterilization Registry</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Autoclave Biological & Physical Verification</p>
                                </div>
                             </div>
                             <button onClick={() => setShowCycleModal(true)} className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-black text-xs uppercase shadow-xl shadow-teal-600/20 hover:scale-105 transition-all flex items-center gap-2"><Plus size={16}/> New Load</button>
                        </div>
                        <div className="space-y-4">
                            {sterilizationCycles.map(cycle => (
                                <div key={cycle.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 shadow-sm flex items-center justify-between group hover:border-teal-500 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className={`p-4 rounded-2xl ${cycle.passed ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-600 animate-pulse'}`}>
                                            {cycle.passed ? <CheckCircle size={28}/> : <AlertTriangle size={28}/>}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDate(cycle.date)} • {cycle.autoclaveName}</div>
                                            <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">Cycle #{cycle.cycleNumber}</h4>
                                            {cycle.instrumentSetIds && cycle.instrumentSetIds.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {cycle.instrumentSetIds.map(sid => (
                                                        <span key={sid} className="bg-slate-50 text-[8px] font-black px-2 py-0.5 rounded border border-slate-200 uppercase text-slate-500">
                                                            {fieldSettings?.instrumentSets?.find(s => s.id === sid)?.name || sid}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] font-black text-slate-400 uppercase">Operator</div>
                                        <div className="text-sm font-bold text-slate-700">{cycle.operator}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* --- UPGRADE 1: ADVANCED STERILIZATION MODAL --- */}
        {showCycleModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
                <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                    <div className="bg-teal-900 p-8 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <ShieldCheck size={32} className="text-teal-400"/>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Register Cycle Load</h3>
                                <p className="text-xs font-bold text-teal-300 uppercase tracking-widest mt-1">Instrument Life-Cycle Traceability</p>
                            </div>
                        </div>
                        <button onClick={() => setShowCycleModal(false)}><X size={24}/></button>
                    </div>

                    <div className="p-8 space-y-6 flex-1 overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="label">Autoclave Unit</label><select value={newCycle.autoclaveName} onChange={e => setNewCycle({...newCycle, autoclaveName: e.target.value})} className="input"><option>Autoclave 1</option><option>Autoclave 2</option></select></div>
                            <div><label className="label">Internal Cycle #</label><input type="text" value={newCycle.cycleNumber} onChange={e => setNewCycle({...newCycle, cycleNumber: e.target.value})} className="input" /></div>
                        </div>
                        <div>
                            <label className="label">Operating Personnel</label>
                            <select value={newCycle.operator} onChange={e => setNewCycle({...newCycle, operator: e.target.value})} className="input">
                                <option value="">- Select Staff -</option>
                                {STAFF.map(s => <option key={s.id} value={s.name}>{s.name} ({s.role})</option>)}
                            </select>
                        </div>

                        {/* MULTI-SELECT INSTRUMENT SETS */}
                        <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Armchair size={12}/> Sets Included in this Load</label>
                             <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
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
                                            className={`p-3 rounded-xl border-2 text-left flex justify-between items-center transition-all ${isSelected ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-white border-slate-100 opacity-70 hover:opacity-100'}`}
                                         >
                                             <div>
                                                 <div className="text-xs font-bold text-slate-800 uppercase">{set.name}</div>
                                                 <div className="text-[9px] font-black text-slate-400 uppercase">Current: {set.status}</div>
                                             </div>
                                             {isSelected && <CheckCircle size={18} className="text-teal-600"/>}
                                         </button>
                                     );
                                 })}
                             </div>
                        </div>

                        <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${newCycle.passed ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-red-50 border-red-200 shadow-lg'}`}>
                            <input type="checkbox" checked={newCycle.passed} onChange={e => setNewCycle({...newCycle, passed: e.target.checked})} className="w-8 h-8 accent-teal-600 rounded" />
                            <div>
                                <span className="font-extrabold text-slate-900 uppercase text-xs">Biological Indicator Passed</span>
                                <p className="text-[10px] text-slate-600 leading-tight uppercase font-bold">I certify that chemical/biological indicators confirm successful sterilization.</p>
                            </div>
                        </label>
                    </div>

                    <div className="p-8 border-t bg-slate-50 flex gap-4">
                        <button onClick={() => setShowCycleModal(false)} className="flex-1 py-4 bg-white border font-black uppercase text-[10px] rounded-2xl">Cancel</button>
                        <button onClick={handleSaveCycle} className="flex-[2] py-4 bg-teal-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-teal-600/20 hover:scale-105 transition-all">Finalize Load Entry</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Inventory;

import React, { useState, useEffect } from 'react';
import { FieldSettings, ProcedureItem, LicenseCategory, StockCategory } from '../types';
import { Plus, Edit2, Trash2, Stethoscope, Bone, Send, Package, PenTool } from 'lucide-react';
import { useToast } from './ToastSystem';
import { useModal } from '../contexts/ModalContext';
import { useInventory } from '../contexts/InventoryContext';

interface ProcedureCatalogProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
}

const CheckboxField: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; icon: React.ElementType }> = ({ label, checked, onChange, icon: Icon }) => (
    <label className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${checked ? 'bg-teal-50 border-teal-500' : 'bg-white border-slate-200'}`}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-5 h-5 accent-teal-600 rounded mt-0.5 shrink-0" />
        <div className="flex items-center gap-2">
            <Icon size={16} className={checked ? 'text-teal-700' : 'text-slate-400'}/>
            <span className={`text-xs font-black uppercase tracking-widest ${checked ? 'text-teal-800' : 'text-slate-600'}`}>{label}</span>
        </div>
    </label>
);

const abbreviateCategory = (category: string) => {
    const map: Record<string, string> = {
        'Diagnostic & Preventive': 'Diag/Prev',
        'Restorative': 'Resto',
        'Surgery': 'Surg',
        'Endodontics': 'Endo',
        'Prosthodontics': 'Prosth',
        'Orthodontics': 'Ortho',
        'Periodontics': 'Perio',
        'Pediatric': 'Pedia'
    };
    return map[category] || category;
};

const ProcedureCatalog: React.FC<ProcedureCatalogProps> = ({ settings, onUpdateSettings }) => {
    const toast = useToast();
    const { showModal } = useModal();
    const { stock } = useInventory();
    const [editingProcedure, setEditingProcedure] = useState<Partial<ProcedureItem> | null>(null);
    const [newBomItem, setNewBomItem] = useState<{stockItemId: string, quantity: number}>({stockItemId: '', quantity: 1});
    const [bomItemType, setBomItemType] = useState<'instrument' | 'consumable'>('instrument');

    useEffect(() => {
        if (!editingProcedure) {
            setNewBomItem({stockItemId: '', quantity: 1});
            setBomItemType('instrument');
        }
    }, [editingProcedure]);

    const handleSaveProcedure = () => {
        if (!editingProcedure?.name || !editingProcedure.category) {
            toast.error("Procedure Name and Category are required.");
            return;
        }

        const isNew = !editingProcedure.id;
        const procedureData: ProcedureItem = {
            id: editingProcedure.id || `proc_${Date.now()}`,
            name: editingProcedure.name,
            category: editingProcedure.category,
            defaultPrice: editingProcedure.defaultPrice || 0,
            defaultDurationMinutes: editingProcedure.defaultDurationMinutes || 30,
            requiresLeadApproval: !!editingProcedure.requiresLeadApproval,
            requiresImaging: !!editingProcedure.requiresImaging,
            triggersPostOpSequence: !!editingProcedure.triggersPostOpSequence,
            billOfMaterials: editingProcedure.billOfMaterials || [],
        };

        const nextProcedures = isNew
            ? [...settings.procedures, procedureData]
            : settings.procedures.map(p => p.id === procedureData.id ? procedureData : p);
        
        onUpdateSettings({ ...settings, procedures: nextProcedures });
        setEditingProcedure(null);
        toast.success(`Procedure "${procedureData.name}" saved.`);
    };
    
    const handleOpenEditModal = (proc: ProcedureItem) => {
        setEditingProcedure(proc);
    };

    const handleOpenNewModal = () => {
        setEditingProcedure({
            name: '',
            category: 'Diagnostic & Preventive',
            defaultPrice: 0,
            defaultDurationMinutes: 30,
            billOfMaterials: []
        });
    };
    
    const handleDeleteProcedure = (procedureId: string) => {
        showModal('confirm', {
            title: 'Delete Procedure',
            message: 'Are you sure you want to delete this procedure? This action cannot be undone.',
            confirmText: 'Delete',
            isDestructive: true,
            onConfirm: () => {
                const nextProcedures = settings.procedures.filter(p => p.id !== procedureId);
                onUpdateSettings({ ...settings, procedures: nextProcedures });
                toast.info("Procedure removed from catalog.");
            }
        });
    };

    const handleAddBomItem = () => {
        if (!newBomItem.stockItemId || newBomItem.quantity <= 0) return;
        const currentBom = editingProcedure?.billOfMaterials || [];
        
        if (currentBom.some(item => item.stockItemId === newBomItem.stockItemId)) {
            toast.error("Item already in Bill of Materials");
            return;
        }
        
        setEditingProcedure({
            ...editingProcedure,
            billOfMaterials: [...currentBom, newBomItem]
        });
        setNewBomItem({stockItemId: '', quantity: 1});
    };

    const handleRemoveBomItem = (stockItemId: string) => {
        const currentBom = editingProcedure?.billOfMaterials || [];
        setEditingProcedure({
            ...editingProcedure,
            billOfMaterials: currentBom.filter(item => item.stockItemId !== stockItemId)
        });
    };

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex justify-end mb-6">
                <button onClick={handleOpenNewModal} className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> Register Procedure</button>
            </div>
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]"><tr className="text-left"><th className="p-3">Description</th><th className="p-3">Classification</th><th className="p-3">Protocols</th><th className="p-3 text-right">Fee (₱)</th><th className="p-3 text-right w-24">Actions</th></tr></thead>
                    <tbody className="divide-y divide-slate-50">
                        {settings.procedures.map(proc => (
                            <tr key={proc.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-3 font-black text-slate-800 text-xs uppercase tracking-tight">{proc.name}</td>
                                <td className="p-3"><span className="text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-600 rounded-full uppercase border border-slate-200">{abbreviateCategory(proc.category)}</span></td>
                                <td className="p-3">
                                    <div className="flex gap-2">
                                        {proc.requiresLeadApproval && <span title="Lead Approval Required"><Stethoscope size={16} className="text-red-500"/></span>}
                                        {proc.requiresImaging && <span title="Imaging Required"><Bone size={16} className="text-blue-500"/></span>}
                                        {proc.triggersPostOpSequence && <span title="Triggers Post-Op SMS"><Send size={16} className="text-green-500"/></span>}
                                        {proc.billOfMaterials && proc.billOfMaterials.length > 0 && <span title="Has Bill of Materials"><Package size={16} className="text-amber-500"/></span>}
                                    </div>
                                </td>
                                <td className="p-3 text-right font-black text-slate-900">₱{proc.defaultPrice.toLocaleString()}</td>
                                <td className="p-3 text-right"><div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleOpenEditModal(proc)} className="p-2 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-all"><Edit2 size={16}/></button><button onClick={() => handleDeleteProcedure(proc.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingProcedure && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingProcedure(null)}/>
                    <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-black uppercase tracking-widest text-teal-900 border-b border-teal-50 pb-4 mb-2">Procedure Metadata</h3>
                        <div className="space-y-4">
                            <div><label className="label text-[10px]">Procedure Narrative</label><input type="text" value={editingProcedure.name} onChange={e => setEditingProcedure({...editingProcedure, name: e.target.value})} className="input" placeholder="e.g. Oral Prophylaxis" /></div>
                            <div className="grid grid-cols-3 gap-4">
                                <div><label className="label text-[10px]">Classification Category</label><select value={editingProcedure.category} onChange={e => setEditingProcedure({...editingProcedure, category: e.target.value as LicenseCategory})} className="input"><option>Diagnostic & Preventive</option><option>Restorative</option><option>Surgery</option><option>Endodontics</option><option>Prosthodontics</option></select></div>
                                <div><label className="label text-[10px]">Standard Fee (₱)</label><input type="number" value={editingProcedure.defaultPrice} onChange={e => setEditingProcedure({...editingProcedure, defaultPrice: parseFloat(e.target.value) || 0})} className="input font-black text-lg" /></div>
                                <div><label className="label text-[10px]">Duration (mins)</label><input type="number" step="5" value={editingProcedure.defaultDurationMinutes} onChange={e => setEditingProcedure({...editingProcedure, defaultDurationMinutes: parseInt(e.target.value) || 30})} className="input font-black text-lg" /></div>
                            </div>
                             <div className="pt-4 border-t border-slate-100">
                                <label className="label text-[10px]">Clinical Protocols & Automations</label>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                                    <CheckboxField label="Lead Dentist Approval" checked={!!editingProcedure.requiresLeadApproval} onChange={c => setEditingProcedure({...editingProcedure, requiresLeadApproval: c})} icon={Stethoscope}/>
                                    <CheckboxField label="Requires Imaging" checked={!!editingProcedure.requiresImaging} onChange={c => setEditingProcedure({...editingProcedure, requiresImaging: c})} icon={Bone}/>
                                    <CheckboxField label="Trigger Post-Op SMS" checked={!!editingProcedure.triggersPostOpSequence} onChange={c => setEditingProcedure({...editingProcedure, triggersPostOpSequence: c})} icon={Send}/>
                                </div>
                             </div>
                             
                             <div className="pt-4 border-t border-slate-100">
                                <label className="label text-[10px]">Bill of Materials</label>
                                <div className="mt-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    {/* Instruments Section */}
                                    <div className="mb-6">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <PenTool size={14} /> Tray Setup (Instruments)
                                        </h4>
                                        {editingProcedure.billOfMaterials && editingProcedure.billOfMaterials.filter(item => stock.find(s => s.id === item.stockItemId)?.category === StockCategory.INSTRUMENTS).length > 0 ? (
                                            <div className="space-y-2">
                                                {editingProcedure.billOfMaterials.filter(item => stock.find(s => s.id === item.stockItemId)?.category === StockCategory.INSTRUMENTS).map(item => {
                                                    const stockItem = stock.find(s => s.id === item.stockItemId);
                                                    return (
                                                        <div key={item.stockItemId} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-lilac-100 text-lilac-700 p-2 rounded-lg"><PenTool size={16}/></div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-slate-800">{stockItem?.name || 'Unknown Item'}</div>
                                                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{stockItem?.category}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{item.quantity} {stockItem?.dispensingUnit || 'units'}</span>
                                                                <button onClick={() => handleRemoveBomItem(item.stockItemId)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-3 bg-white rounded-xl border border-slate-200 text-slate-400 text-xs italic">No instruments linked to this procedure.</div>
                                        )}
                                    </div>

                                    {/* Consumables Section */}
                                    <div className="mb-6">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Package size={14} /> Required Materials (Consumables)
                                        </h4>
                                        {editingProcedure.billOfMaterials && editingProcedure.billOfMaterials.filter(item => stock.find(s => s.id === item.stockItemId)?.category !== StockCategory.INSTRUMENTS).length > 0 ? (
                                            <div className="space-y-2">
                                                {editingProcedure.billOfMaterials.filter(item => stock.find(s => s.id === item.stockItemId)?.category !== StockCategory.INSTRUMENTS).map(item => {
                                                    const stockItem = stock.find(s => s.id === item.stockItemId);
                                                    return (
                                                        <div key={item.stockItemId} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-teal-100 text-teal-700 p-2 rounded-lg"><Package size={16}/></div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-slate-800">{stockItem?.name || 'Unknown Item'}</div>
                                                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{stockItem?.category}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{item.quantity} {stockItem?.dispensingUnit || 'units'}</span>
                                                                <button onClick={() => handleRemoveBomItem(item.stockItemId)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-3 bg-white rounded-xl border border-slate-200 text-slate-400 text-xs italic">No consumables linked to this procedure.</div>
                                        )}
                                    </div>
                                    
                                    <div className="pt-4 border-t border-slate-200">
                                        <div className="flex gap-2 mb-3">
                                            <button 
                                                onClick={() => { setBomItemType('instrument'); setNewBomItem({...newBomItem, quantity: 1}); }}
                                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${bomItemType === 'instrument' ? 'bg-lilac-100 text-lilac-800' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                                            >
                                                Browse Instruments
                                            </button>
                                            <button 
                                                onClick={() => { setBomItemType('consumable'); setNewBomItem({...newBomItem, quantity: 1}); }}
                                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${bomItemType === 'consumable' ? 'bg-teal-100 text-teal-800' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                                            >
                                                Browse Consumables
                                            </button>
                                        </div>
                                        <div className="flex gap-2 items-end">
                                            <div className="flex-1">
                                                <label className="label text-[10px] mb-1">Add {bomItemType === 'instrument' ? 'Instrument' : 'Consumable'}</label>
                                                <select 
                                                    value={newBomItem.stockItemId} 
                                                    onChange={e => setNewBomItem({...newBomItem, stockItemId: e.target.value})}
                                                    className="input text-xs"
                                                >
                                                    <option value="">Select Item...</option>
                                                    {stock
                                                        .filter(s => bomItemType === 'instrument' ? s.category === StockCategory.INSTRUMENTS : s.category !== StockCategory.INSTRUMENTS)
                                                        .map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                                    }
                                                </select>
                                            </div>
                                            <div className="w-24">
                                                <label className="label text-[10px] mb-1">Qty</label>
                                                <input 
                                                    type="number" 
                                                    value={newBomItem.quantity} 
                                                    onChange={e => setNewBomItem({...newBomItem, quantity: parseFloat(e.target.value)})}
                                                    className="input text-xs"
                                                    min="0.1"
                                                    step="0.1"
                                                />
                                            </div>
                                            <button onClick={handleAddBomItem} disabled={!newBomItem.stockItemId} className="bg-slate-800 text-white p-3 rounded-xl hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-800/20"><Plus size={20}/></button>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>
                        <div className="flex gap-3 pt-4"><button onClick={() => setEditingProcedure(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button><button onClick={handleSaveProcedure} className="flex-[2] py-4 bg-teal-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-teal-600/20">Save to Catalog</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProcedureCatalog;

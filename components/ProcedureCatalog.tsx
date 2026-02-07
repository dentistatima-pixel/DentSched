
import React, { useState, useEffect } from 'react';
import { FieldSettings, ProcedureItem } from '../types';
import { Plus, Edit2, Trash2, DollarSign } from 'lucide-react';
import { useToast } from './ToastSystem';

interface ProcedureCatalogProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
}

const ProcedureCatalog: React.FC<ProcedureCatalogProps> = ({ settings, onUpdateSettings }) => {
    const toast = useToast();
    const [editingProcedure, setEditingProcedure] = useState<Partial<ProcedureItem> | null>(null);
    const [editingProcedurePrice, setEditingProcedurePrice] = useState<number>(0);

    const handleSaveProcedure = () => {
        if (!editingProcedure?.name) return;
    
        const isNew = !editingProcedure.id;
        const procedureId = editingProcedure.id || `p_${Date.now()}`;
        const newProcedureData: ProcedureItem = {
            ...editingProcedure,
            id: procedureId,
            name: editingProcedure.name,
            category: editingProcedure.category
        } as ProcedureItem;
    
        const nextProcedures = isNew
            ? [...settings.procedures, newProcedureData]
            : settings.procedures.map(p => p.id === procedureId ? newProcedureData : p);
        
        const defaultPriceBook = settings.priceBooks?.find(pb => pb.isDefault);
        const priceBookId = defaultPriceBook?.id || settings.priceBooks?.[0]?.id || 'pb_1';
    
        let nextPriceBookEntries = [...(settings.priceBookEntries || [])];
        const priceEntryIndex = nextPriceBookEntries.findIndex(pbe => pbe.procedureId === procedureId && pbe.priceBookId === priceBookId);
    
        if (priceEntryIndex > -1) {
            nextPriceBookEntries[priceEntryIndex].price = editingProcedurePrice;
        } else {
            nextPriceBookEntries.push({
                priceBookId: priceBookId,
                procedureId: procedureId,
                price: editingProcedurePrice
            });
        }
    
        onUpdateSettings({ 
            ...settings, 
            procedures: nextProcedures,
            priceBookEntries: nextPriceBookEntries 
        });
    
        setEditingProcedure(null);
        setEditingProcedurePrice(0);
        toast.success("Procedure saved.");
    };
    
    const handleOpenEditProcedure = (proc: ProcedureItem) => {
        setEditingProcedure(proc);
        const price = settings.priceBookEntries?.find(pbe => pbe.procedureId === proc.id)?.price ?? 0;
        setEditingProcedurePrice(price);
    };

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex justify-end mb-6">
                <button onClick={() => { setEditingProcedure({ name: '', category: 'General' }); setEditingProcedurePrice(0); }} className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> Register Procedure</button>
            </div>
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]"><tr className="text-left"><th className="p-6">Description</th><th className="p-6">Classification</th><th className="p-6 text-right">Standard Fee (₱)</th><th className="p-6 text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-slate-50">
                        {settings.procedures.map(proc => {
                            const price = settings.priceBookEntries?.find(pbe => pbe.procedureId === proc.id)?.price ?? 0;
                            return (
                                <tr key={proc.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-6 font-black text-slate-800 text-xs uppercase tracking-tight">{proc.name}</td>
                                    <td className="p-6"><span className="text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-600 rounded-full uppercase border border-slate-200">{proc.category}</span></td>
                                    <td className="p-6 text-right font-black text-slate-900">₱{price.toLocaleString()}</td>
                                    <td className="p-6 text-right"><div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleOpenEditProcedure(proc)} className="p-3 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-all"><Edit2 size={16}/></button><button onClick={() => onUpdateSettings({...settings, procedures: settings.procedures.filter(p => p.id !== proc.id)})} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button></div></td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {editingProcedure && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center p-4"><div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingProcedure(null)}/><div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-6 animate-in zoom-in-95"><h3 className="text-xl font-black uppercase tracking-widest text-teal-900 border-b border-teal-50 pb-4 mb-2">Procedure Metadata</h3><div className="space-y-4"><div><label className="label text-[10px]">Procedure Narrative</label><input type="text" value={editingProcedure.name} onChange={e => setEditingProcedure({...editingProcedure, name: e.target.value})} className="input" placeholder="e.g. Oral Prophylaxis" /></div><div><label className="label text-[10px]">Classification Category</label><select value={editingProcedure.category} onChange={e => setEditingProcedure({...editingProcedure, category: e.target.value})} className="input"><option>General</option><option>Preventive</option><option>Restorative</option><option>Surgery</option><option>Endodontics</option><option>Prosthodontics</option><option>Imaging</option></select></div><div><label className="label text-[10px]">Standard Fee (₱)</label><input type="number" value={editingProcedurePrice} onChange={e => setEditingProcedurePrice(parseFloat(e.target.value) || 0)} className="input font-black text-lg" /></div></div><div className="flex gap-3 pt-4"><button onClick={() => setEditingProcedure(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button><button onClick={handleSaveProcedure} className="flex-[2] py-4 bg-teal-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-teal-600/20">Save to Catalog</button></div></div></div>
            )}
        </div>
    );
};

export default ProcedureCatalog;

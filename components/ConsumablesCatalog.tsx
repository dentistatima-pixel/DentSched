import React, { useState, useMemo } from 'react';
import { StockItem, StockCategory } from '../types';
import { Search, Plus, Edit2, Save, X, Trash2 } from 'lucide-react';
import { useToast } from './ToastSystem';

interface ConsumablesCatalogProps {
  stock: StockItem[];
  onUpdateStock: (updatedStock: StockItem[]) => void;
}

const ConsumablesCatalog: React.FC<ConsumablesCatalogProps> = ({ stock, onUpdateStock }) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [editItem, setEditItem] = useState<Partial<StockItem> | null>(null);

  const consumables = useMemo(() => {
    return stock.filter(s => s.category !== StockCategory.INSTRUMENTS);
  }, [stock]);

  const filteredConsumables = useMemo(() => {
    return consumables.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [consumables, searchTerm]);

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
    
    // Calculate unitCost based on boxPrice and unitsPerBox
    const boxPrice = editItem.boxPrice || 0;
    const unitsPerBox = editItem.unitsPerBox || 1;
    const unitCost = unitsPerBox > 0 ? boxPrice / unitsPerBox : 0;
    
    const updatedItem = { ...editItem, unitCost } as StockItem;

    const isNew = !updatedItem.id;
    const newStock = isNew
      ? [...stock, { ...updatedItem, id: `stk_${Date.now()}` }]
      : stock.map(s => s.id === updatedItem.id ? updatedItem : s);

    onUpdateStock(newStock);
    setEditItem(null);
    toast.success(`Consumable "${updatedItem.name}" saved successfully.`);
  };

  const handleDeleteItem = (id: string) => {
    const newStock = stock.filter(s => s.id !== id);
    onUpdateStock(newStock);
    toast.success("Material deleted successfully.");
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Materials & Supply Costs</h3>
            <p className="text-slate-500 mt-1">Manage consumable costs for procedure calculations.</p>
          </div>
          <button 
            onClick={() => setEditItem({ category: StockCategory.CONSUMABLES, quantity: 0, lowStockThreshold: 0, boxPrice: 0, unitsPerBox: 1 })}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> Add Material
          </button>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search materials..." 
            className="input pl-12 w-full max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100">
                <th className="p-4 font-black text-xs uppercase tracking-widest text-slate-400">Item Name</th>
                <th className="p-4 font-black text-xs uppercase tracking-widest text-slate-400">Supplier</th>
                <th className="p-4 font-black text-xs uppercase tracking-widest text-slate-400">Category</th>
                <th className="p-4 font-black text-xs uppercase tracking-widest text-slate-400">Box Price (₱)</th>
                <th className="p-4 font-black text-xs uppercase tracking-widest text-slate-400">Units per Box</th>
                <th className="p-4 font-black text-xs uppercase tracking-widest text-slate-400">Cost per Unit (₱)</th>
                <th className="p-4 font-black text-xs uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredConsumables.map(item => (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-700">{item.name}</td>
                  <td className="p-4 text-slate-500 text-sm">{item.supplier || '-'}</td>
                  <td className="p-4 text-slate-500 text-sm">{item.category}</td>
                  <td className="p-4 text-slate-700 font-medium">₱{(item.boxPrice || (item.unitCost || 0) * (item.conversionFactor || 1)).toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ {item.bulkUnit || 'Box'}</span></td>
                  <td className="p-4 text-slate-700">{item.unitsPerBox || item.conversionFactor || 1} <span className="text-xs text-slate-400 font-normal">{item.dispensingUnit || 'pcs'}</span></td>
                  <td className="p-4 text-teal-600 font-bold">₱{(item.unitCost || 0).toFixed(2)}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setEditItem({
                          ...item,
                          boxPrice: item.boxPrice || (item.unitCost || 0) * (item.conversionFactor || 1),
                          unitsPerBox: item.unitsPerBox || item.conversionFactor || 1
                        })} 
                        className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Edit Material"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)} 
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Material"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredConsumables.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No materials found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-black text-slate-800 tracking-tighter">
                {editItem.id ? 'Edit Material' : 'New Material'}
              </h3>
              <button onClick={() => setEditItem(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Name</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    value={editItem.name || ''} 
                    onChange={e => handleFormChange('name', e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Supplier</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    placeholder="e.g. Dental Depot"
                    value={editItem.supplier || ''} 
                    onChange={e => handleFormChange('supplier', e.target.value)} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Category</label>
                <select 
                  className="input w-full" 
                  value={editItem.category || StockCategory.CONSUMABLES} 
                  onChange={e => handleFormChange('category', e.target.value)}
                >
                  {Object.values(StockCategory).filter(c => c !== StockCategory.INSTRUMENTS).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Bulk Unit (e.g. Box)</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    placeholder="Box, Jar, Pack"
                    value={editItem.bulkUnit || ''} 
                    onChange={e => handleFormChange('bulkUnit', e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Dispensing Unit (e.g. Piece)</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    placeholder="Piece, Capsule"
                    value={editItem.dispensingUnit || ''} 
                    onChange={e => handleFormChange('dispensingUnit', e.target.value)} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Box Price (₱)</label>
                  <input 
                    type="number" 
                    className="input w-full" 
                    value={editItem.boxPrice || 0} 
                    onChange={e => handleFormChange('boxPrice', parseFloat(e.target.value))} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Units per Box</label>
                  <input 
                    type="number" 
                    className="input w-full" 
                    value={editItem.unitsPerBox || 1} 
                    onChange={e => handleFormChange('unitsPerBox', parseInt(e.target.value))} 
                  />
                </div>
              </div>
              <div className="bg-teal-50 p-4 rounded-xl mt-4">
                <p className="text-sm text-teal-800 font-medium flex justify-between">
                  Calculated Unit Cost: 
                  <span className="font-bold">₱{((editItem.boxPrice || 0) / (editItem.unitsPerBox || 1)).toFixed(2)}</span>
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setEditItem(null)} className="btn bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSaveItem} className="btn btn-primary flex items-center gap-2">
                <Save size={18} /> Save Material
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumablesCatalog;

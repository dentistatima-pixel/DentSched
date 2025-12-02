
import React, { useState } from 'react';
import { FieldSettings } from '../types';
import { Plus, Trash2, Edit2, Save, X, Sliders, ChevronRight, Check } from 'lucide-react';

interface FieldManagementProps {
  settings: FieldSettings;
  onUpdateSettings: (newSettings: FieldSettings) => void;
}

const FieldManagement: React.FC<FieldManagementProps> = ({ settings, onUpdateSettings }) => {
  const [activeCategory, setActiveCategory] = useState<keyof FieldSettings>('insuranceProviders');
  const [newItemValue, setNewItemValue] = useState('');
  const [editingItem, setEditingItem] = useState<{ index: number, value: string } | null>(null);

  const categories: { key: keyof FieldSettings; label: string; description: string }[] = [
    { key: 'insuranceProviders', label: 'Insurance Providers', description: 'HMOs and Insurance Companies available for patient registration.' },
    { key: 'procedures', label: 'Dental Procedures', description: 'Treatments available for booking and charting.' },
    { key: 'allergies', label: 'Common Allergies', description: 'Standard allergy options in medical history.' },
    { key: 'medicalConditions', label: 'Medical Conditions', description: 'Systemic conditions for medical history checklist.' },
    { key: 'bloodGroups', label: 'Blood Groups', description: 'Standard blood types.' },
    { key: 'suffixes', label: 'Suffixes & Titles', description: 'Honorifics and titles (Mr, Dr, II, Jr).' },
    { key: 'civilStatus', label: 'Civil Status', description: 'Marital status options.' },
    { key: 'branches', label: 'Clinic Branches', description: 'Locations for staff assignment.' },
  ];

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemValue.trim()) return;

    const updatedList = [...settings[activeCategory], newItemValue.trim()];
    onUpdateSettings({
      ...settings,
      [activeCategory]: updatedList
    });
    setNewItemValue('');
  };

  const handleDeleteItem = (index: number) => {
    if (window.confirm('Are you sure you want to delete this option?')) {
        const updatedList = settings[activeCategory].filter((_, i) => i !== index);
        onUpdateSettings({
            ...settings,
            [activeCategory]: updatedList
        });
    }
  };

  const startEditing = (index: number, value: string) => {
      setEditingItem({ index, value });
  };

  const saveEdit = () => {
      if (!editingItem || !editingItem.value.trim()) return;
      
      const updatedList = [...settings[activeCategory]];
      updatedList[editingItem.index] = editingItem.value.trim();
      
      onUpdateSettings({
          ...settings,
          [activeCategory]: updatedList
      });
      setEditingItem(null);
  };

  const activeCategoryInfo = categories.find(c => c.key === activeCategory);

  return (
    <div className="flex flex-col md:flex-row h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 bg-teal-900 text-white">
            <h2 className="text-lg font-bold flex items-center gap-2">
                <Sliders size={20} /> Field Mgmt
            </h2>
            <p className="text-xs text-teal-200 mt-1">Configure drop-down lists</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
            {categories.map(cat => (
                <button
                    key={cat.key}
                    onClick={() => { setActiveCategory(cat.key); setEditingItem(null); setNewItemValue(''); }}
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-colors ${
                        activeCategory === cat.key 
                        ? 'bg-teal-50 text-teal-800 font-bold border border-teal-100' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <span className="text-sm">{cat.label}</span>
                    {activeCategory === cat.key && <ChevronRight size={16} className="text-teal-500"/>}
                </button>
            ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
         <div className="p-6 border-b border-slate-100">
             <h3 className="text-2xl font-bold text-slate-800">{activeCategoryInfo?.label}</h3>
             <p className="text-slate-500 text-sm mt-1">{activeCategoryInfo?.description}</p>
         </div>

         {/* Add New Bar */}
         <div className="p-4 bg-slate-50 border-b border-slate-100">
             <form onSubmit={handleAddItem} className="flex gap-2">
                 <input 
                    type="text" 
                    placeholder={`Add new ${activeCategoryInfo?.label.slice(0, -1)}...`}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                    value={newItemValue}
                    onChange={(e) => setNewItemValue(e.target.value)}
                 />
                 <button 
                    type="submit"
                    disabled={!newItemValue.trim()}
                    className="bg-teal-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                 >
                     <Plus size={18} /> Add
                 </button>
             </form>
         </div>

         {/* List */}
         <div className="flex-1 overflow-y-auto p-4">
             <div className="space-y-2">
                 {settings[activeCategory].map((item, idx) => (
                     <div key={idx} className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all bg-white shadow-sm">
                         {editingItem?.index === idx ? (
                             <div className="flex-1 flex gap-2 items-center">
                                 <input 
                                    type="text" 
                                    className="flex-1 px-3 py-1 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                    value={editingItem.value}
                                    onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                                    autoFocus
                                 />
                                 <button onClick={saveEdit} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Check size={16}/></button>
                                 <button onClick={() => setEditingItem(null)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><X size={16}/></button>
                             </div>
                         ) : (
                             <>
                                <span className="font-medium text-slate-700 ml-2">{item}</span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => startEditing(idx, item)}
                                        className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteItem(idx)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                             </>
                         )}
                     </div>
                 ))}

                 {settings[activeCategory].length === 0 && (
                     <div className="text-center py-10 text-slate-400 italic">
                         No items in this list yet. Add one above.
                     </div>
                 )}
             </div>
         </div>
      </div>
    </div>
  );
};

export default FieldManagement;

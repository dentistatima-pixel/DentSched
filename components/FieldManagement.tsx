
import React, { useState } from 'react';
import { FieldSettings, ProcedureItem, FeatureToggles } from '../types';
import { Plus, Trash2, Edit2, Check, X, Sliders, ChevronRight, DollarSign, ToggleLeft, ToggleRight, Box } from 'lucide-react';

interface FieldManagementProps {
  settings: FieldSettings;
  onUpdateSettings: (newSettings: FieldSettings) => void;
}

const FieldManagement: React.FC<FieldManagementProps> = ({ settings, onUpdateSettings }) => {
  const [activeCategory, setActiveCategory] = useState<keyof FieldSettings | 'features'>('features'); // Default to features
  
  // Standard List State
  const [newItemValue, setNewItemValue] = useState('');
  const [editingItem, setEditingItem] = useState<{ index: number, value: string } | null>(null);

  // Procedure List State
  const [newProcName, setNewProcName] = useState('');
  const [newProcPrice, setNewProcPrice] = useState('');
  const [editingProc, setEditingProc] = useState<{ index: number, name: string, price: string } | null>(null);

  const categories: { key: keyof FieldSettings | 'features'; label: string; description: string }[] = [
    { key: 'features', label: 'System Features', description: 'Enable or disable major application modules.' },
    { key: 'procedures', label: 'Dental Procedures & Prices', description: 'Treatments available for booking and charting, with base prices.' },
    { key: 'insuranceProviders', label: 'Insurance Providers', description: 'HMOs and Insurance Companies available for patient registration.' },
    { key: 'allergies', label: 'Common Allergies', description: 'Standard allergy options in medical history.' },
    { key: 'medicalConditions', label: 'Medical Conditions', description: 'Systemic conditions for medical history checklist.' },
    { key: 'bloodGroups', label: 'Blood Groups', description: 'Standard blood types.' },
    { key: 'suffixes', label: 'Suffixes & Titles', description: 'Honorifics and titles (Mr, Dr, II, Jr).' },
    { key: 'civilStatus', label: 'Civil Status', description: 'Marital status options.' },
    { key: 'branches', label: 'Clinic Branches', description: 'Locations for staff assignment.' },
  ];

  // --- FEATURE TOGGLE HANDLER ---
  const handleToggleFeature = (feature: keyof FeatureToggles) => {
      const currentFeatures = settings.features;
      onUpdateSettings({
          ...settings,
          features: {
              ...currentFeatures,
              [feature]: !currentFeatures[feature]
          }
      });
  };

  // --- SIMPLE LIST HANDLERS ---
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemValue.trim()) return;
    const updatedList = [...(settings[activeCategory as keyof FieldSettings] as string[]), newItemValue.trim()];
    onUpdateSettings({ ...settings, [activeCategory as keyof FieldSettings]: updatedList });
    setNewItemValue('');
  };

  const handleDeleteItem = (index: number) => {
    if (window.confirm('Are you sure you want to delete this option?')) {
        const updatedList = (settings[activeCategory as keyof FieldSettings] as any[]).filter((_, i) => i !== index);
        onUpdateSettings({ ...settings, [activeCategory as keyof FieldSettings]: updatedList });
    }
  };

  const startEditing = (index: number, value: string) => {
      setEditingItem({ index, value });
  };

  const saveEdit = () => {
      if (!editingItem || !editingItem.value.trim()) return;
      const updatedList = [...(settings[activeCategory as keyof FieldSettings] as string[])];
      updatedList[editingItem.index] = editingItem.value.trim();
      onUpdateSettings({ ...settings, [activeCategory as keyof FieldSettings]: updatedList });
      setEditingItem(null);
  };

  // --- PROCEDURE HANDLERS ---
  const handleAddProcedure = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newProcName.trim() || !newProcPrice) return;
      
      const newProc: ProcedureItem = {
          id: `proc_${Date.now()}`,
          name: newProcName.trim(),
          price: parseFloat(newProcPrice)
      };

      const updatedList = [...settings.procedures, newProc];
      onUpdateSettings({ ...settings, procedures: updatedList });
      setNewProcName('');
      setNewProcPrice('');
  };

  const saveProcEdit = () => {
      if (!editingProc || !editingProc.name.trim()) return;
      const updatedList = [...settings.procedures];
      updatedList[editingProc.index] = {
          ...updatedList[editingProc.index],
          name: editingProc.name.trim(),
          price: parseFloat(editingProc.price) || 0
      };
      onUpdateSettings({ ...settings, procedures: updatedList });
      setEditingProc(null);
  };


  const activeCategoryInfo = categories.find(c => c.key === activeCategory);

  const ToggleItem = ({ label, featureKey }: { label: string, featureKey: keyof FeatureToggles }) => (
      <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-teal-300 transition-colors">
          <div className="flex items-center gap-3">
              <Box className="text-teal-600" size={20} />
              <span className="font-bold text-slate-700">{label}</span>
          </div>
          <button 
            onClick={() => handleToggleFeature(featureKey)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                settings.features[featureKey] 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
              {settings.features[featureKey] ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
              {settings.features[featureKey] ? 'Enabled' : 'Disabled'}
          </button>
      </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 bg-teal-900 text-white">
            <h2 className="text-lg font-bold flex items-center gap-2">
                <Sliders size={20} /> Field Mgmt
            </h2>
            <p className="text-xs text-teal-200 mt-1">Configure system lists</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
            {categories.map(cat => (
                <button
                    key={cat.key}
                    onClick={() => { setActiveCategory(cat.key as any); setEditingItem(null); setNewItemValue(''); setEditingProc(null); }}
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

         {/* CONDITION: Features Tab */}
         {activeCategory === 'features' ? (
             <div className="p-6 bg-slate-50 h-full overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <ToggleItem label="Multi-Branch Management" featureKey="enableMultiBranch" />
                     <ToggleItem label="Compliance / Printing Audit" featureKey="enableComplianceAudit" />
                     <ToggleItem label="Dental Assistant Workflows (Tray/Stepper)" featureKey="enableDentalAssistantFlow" />
                     <ToggleItem label="Lab Case Tracking" featureKey="enableLabTracking" />
                 </div>
                 <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-100">
                     <strong>Note:</strong> Disabling features hides them from the interface to simplify the user experience. No data is deleted.
                 </div>
             </div>
         ) : activeCategory === 'procedures' ? (
             <>
                {/* ADD PROCEDURE FORM */}
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <form onSubmit={handleAddProcedure} className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Procedure Name (e.g. Composite Restoration)"
                            className="flex-[2] px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                            value={newProcName}
                            onChange={(e) => setNewProcName(e.target.value)}
                        />
                        <div className="relative flex-1">
                            <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                            <input 
                                type="number" 
                                placeholder="Price"
                                className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                                value={newProcPrice}
                                onChange={(e) => setNewProcPrice(e.target.value)}
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={!newProcName.trim()}
                            className="bg-teal-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                            <Plus size={18} /> Add
                        </button>
                    </form>
                </div>

                {/* PROCEDURE LIST */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                        {settings.procedures.map((proc, idx) => (
                            <div key={idx} className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all bg-white shadow-sm">
                                {editingProc?.index === idx ? (
                                    <div className="flex-1 flex gap-2 items-center">
                                        <input 
                                            type="text" 
                                            className="flex-[2] px-3 py-1 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                            value={editingProc.name}
                                            onChange={(e) => setEditingProc({ ...editingProc, name: e.target.value })}
                                            autoFocus
                                        />
                                        <input 
                                            type="number" 
                                            className="flex-1 px-3 py-1 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                            value={editingProc.price}
                                            onChange={(e) => setEditingProc({ ...editingProc, price: e.target.value })}
                                        />
                                        <button onClick={saveProcEdit} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Check size={16}/></button>
                                        <button onClick={() => setEditingProc(null)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><X size={16}/></button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 flex justify-between items-center pr-4">
                                            <span className="font-medium text-slate-700 ml-2">{proc.name}</span>
                                            <span className="font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded text-sm">₱{proc.price.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => setEditingProc({ index: idx, name: proc.name, price: proc.price.toString() })}
                                                className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteItem(idx)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                         {settings.procedures.length === 0 && (
                            <div className="text-center py-10 text-slate-400 italic">No procedures added yet.</div>
                        )}
                    </div>
                </div>
             </>
         ) : (
             <>
                {/* SIMPLE LIST FORM */}
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

                {/* SIMPLE LIST */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                        {(settings[activeCategory as keyof FieldSettings] as string[]).map((item, idx) => (
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
                        {(settings[activeCategory as keyof FieldSettings] as string[]).length === 0 && (
                            <div className="text-center py-10 text-slate-400 italic">No items yet.</div>
                        )}
                    </div>
                </div>
             </>
         )}
      </div>
    </div>
  );
};

export default FieldManagement;

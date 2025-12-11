
import React, { useState } from 'react';
import { FieldSettings, ProcedureItem, FeatureToggles, User, UserRole, SmsTemplates } from '../types';
import { Plus, Trash2, Edit2, Check, X, Sliders, ChevronRight, DollarSign, ToggleLeft, ToggleRight, Box, Calendar, MapPin, MessageSquare, Tag, Database, RefreshCcw, Info, Clock, User as UserIcon } from 'lucide-react';

interface FieldManagementProps {
  settings: FieldSettings;
  onUpdateSettings: (newSettings: FieldSettings) => void;
  staff?: User[];
  onUpdateStaff?: (updatedStaff: User[]) => void;
  onResetData?: () => void;
}

const FieldManagement: React.FC<FieldManagementProps> = ({ settings, onUpdateSettings, staff = [], onUpdateStaff, onResetData }) => {
  const [activeCategory, setActiveCategory] = useState<keyof FieldSettings | 'features' | 'roster' | 'sms' | 'system'>('features'); 
  
  // Procedure Form State
  const [isAddingProc, setIsAddingProc] = useState(false);
  const [newProc, setNewProc] = useState<Partial<ProcedureItem>>({ name: '', price: 0, category: 'General' });

  // Fix: Added missing state for newItemValue and setNewItemValue to handle branch input
  const [newItemValue, setNewItemValue] = useState('');

  const categories: { key: any; label: string; description: string; icon: any }[] = [
    { key: 'features', label: 'System Features', description: 'Enable or disable major application modules.', icon: Box },
    { key: 'roster', label: 'Staff Roster', description: 'Manage weekly schedule and branch assignments.', icon: Calendar },
    { key: 'sms', label: 'Messaging & SMS', description: 'Manage automated patient notifications.', icon: MessageSquare },
    { key: 'procedures', label: 'Procedures & Prices', description: 'Treatments available for booking and charting.', icon: Tag },
    { key: 'branches', label: 'Clinic Branches', description: 'Locations for staff assignment.', icon: MapPin },
    { key: 'system', label: 'Database Admin', description: 'Developer tools and database maintenance.', icon: Database },
  ];

  const handleToggleFeature = (feature: keyof FeatureToggles) => {
      onUpdateSettings({ ...settings, features: { ...settings.features, [feature]: !settings.features[feature] } });
  };

  const handleUpdateSms = (key: keyof SmsTemplates, value: string) => {
      onUpdateSettings({
          ...settings,
          smsTemplates: {
              ...settings.smsTemplates,
              [key]: value
          }
      });
  };

  const handleAddProcedure = () => {
      if (!newProc.name || !newProc.price) return;
      const updatedProcs = [...settings.procedures, { ...newProc, id: `proc_${Date.now()}` } as ProcedureItem];
      onUpdateSettings({ ...settings, procedures: updatedProcs });
      setNewProc({ name: '', price: 0, category: 'General' });
      setIsAddingProc(false);
  };

  const handleDeleteProcedure = (id: string) => {
      onUpdateSettings({ ...settings, procedures: settings.procedures.filter(p => p.id !== id) });
  };

  const handleUpdateRoster = (staffId: string, day: string, branch: string) => {
      if (!onUpdateStaff) return;
      const updatedStaff = staff.map(s => {
          if (s.id === staffId) {
              return {
                  ...s,
                  roster: { ...s.roster, [day]: branch }
              };
          }
          return s;
      });
      onUpdateStaff(updatedStaff);
  };

  const activeCategoryInfo = categories.find(c => c.key === activeCategory);

  return (
    <div className="flex flex-col md:flex-row h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-full md:w-64 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 bg-teal-900 text-white">
            <h2 className="text-lg font-bold flex items-center gap-2"><Sliders size={20} /> Settings</h2>
            <p className="text-xs text-teal-200 mt-1">Configure clinic operations</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
            {categories.map(cat => (
                <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-colors ${
                        activeCategory === cat.key ? 'bg-teal-50 text-teal-800 font-bold border border-teal-100' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <cat.icon size={18} className={activeCategory === cat.key ? 'text-teal-600' : 'text-slate-400'} />
                        <span className="text-sm">{cat.label}</span>
                    </div>
                    {activeCategory === cat.key && <ChevronRight size={14} />}
                </button>
            ))}
        </nav>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
         <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
             <h3 className="text-2xl font-bold text-slate-800">{activeCategoryInfo?.label}</h3>
             <p className="text-slate-500 text-sm mt-1">{activeCategoryInfo?.description}</p>
         </div>

         <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
             
             {/* --- SYSTEM FEATURES --- */}
             {activeCategory === 'features' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {Object.keys(settings.features).map((f) => (
                        <div key={f} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm">
                            <div>
                                <span className="font-bold text-slate-700 capitalize block mb-1">{f.replace(/([A-Z])/g, ' $1')}</span>
                                <p className="text-[10px] text-slate-400 font-medium">Toggle module availability clinic-wide.</p>
                            </div>
                            <button 
                                onClick={() => handleToggleFeature(f as any)} 
                                className={`relative w-12 h-6 rounded-full transition-colors flex items-center p-1 ${settings.features[f as keyof FeatureToggles] ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'}`}
                            >
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                            </button>
                        </div>
                     ))}
                 </div>
             )}

             {/* --- SMS TEMPLATES EDITOR --- */}
             {activeCategory === 'sms' && (
                 <div className="space-y-6">
                     <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 mb-6">
                         <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
                         <div className="text-sm text-blue-800">
                             <p className="font-bold mb-1">Variable Tags Guide</p>
                             <p className="opacity-80">Use these tags in your messages to automatically insert patient details:</p>
                             <div className="flex flex-wrap gap-2 mt-2">
                                 {['{PatientName}', '{Date}', '{Time}', '{ProviderName}', '{BranchName}'].map(tag => (
                                     <span key={tag} className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono text-[10px] font-bold">{tag}</span>
                                 ))}
                             </div>
                         </div>
                     </div>

                     <div className="grid grid-cols-1 gap-6">
                         {(Object.keys(settings.smsTemplates) as Array<keyof SmsTemplates>).map(key => (
                             <div key={key} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                 <label className="block text-sm font-bold text-slate-700 mb-2 capitalize">
                                     {key.replace(/([A-Z])/g, ' $1')} Template
                                 </label>
                                 <textarea 
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none resize-none h-24"
                                    value={settings.smsTemplates[key]}
                                    onChange={(e) => handleUpdateSms(key, e.target.value)}
                                    placeholder={`Enter template for ${key}...`}
                                 />
                                 <div className="mt-2 flex justify-between items-center">
                                     <span className="text-[10px] font-bold text-slate-400 uppercase">Automatic Trigger</span>
                                     <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded">Enabled</span>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {/* --- STAFF ROSTER --- */}
             {activeCategory === 'roster' && (
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                     <table className="w-full text-left border-collapse">
                         <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                             <tr>
                                 <th className="p-4">Staff Member</th>
                                 {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <th key={day} className="p-4 text-center">{day}</th>)}
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                             {staff.filter(s => s.role !== UserRole.ADMIN).map(s => (
                                 <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                     <td className="p-4">
                                         <div className="flex items-center gap-3">
                                             <img src={s.avatar} className="w-8 h-8 rounded-full border border-slate-200" alt="Avatar"/>
                                             <div>
                                                 <div className="font-bold text-sm text-slate-800">{s.name}</div>
                                                 <div className="text-[10px] text-slate-400 font-bold uppercase">{s.role}</div>
                                             </div>
                                         </div>
                                     </td>
                                     {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                         <td key={day} className="p-2">
                                             <select 
                                                value={s.roster?.[day] || 'OFF'}
                                                onChange={(e) => handleUpdateRoster(s.id, day, e.target.value)}
                                                className={`w-full text-[10px] font-bold p-1.5 rounded-lg border appearance-none text-center cursor-pointer transition-colors
                                                    ${s.roster?.[day] === 'OFF' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-teal-50 text-teal-700 border-teal-200'}
                                                `}
                                             >
                                                 <option value="OFF">OFF</option>
                                                 {settings.branches.map(b => <option key={b} value={b}>{b}</option>)}
                                             </select>
                                         </td>
                                     ))}
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             )}

             {/* --- PROCEDURES --- */}
             {activeCategory === 'procedures' && (
                 <div className="space-y-4">
                     <div className="flex justify-between items-center mb-4">
                         <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Procedure Catalog ({settings.procedures.length})</h4>
                         <button 
                            onClick={() => setIsAddingProc(true)}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-teal-600/20"
                         >
                             <Plus size={18} /> New Procedure
                         </button>
                     </div>

                     {isAddingProc && (
                         <div className="bg-white p-5 rounded-2xl border-2 border-teal-500 shadow-xl animate-in slide-in-from-top-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="md:col-span-1">
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                                 <input type="text" value={newProc.name} onChange={e => setNewProc({...newProc, name: e.target.value})} className="w-full p-2 border rounded-lg text-sm" placeholder="e.g. Tooth Extraction"/>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Base Price (₱)</label>
                                 <input type="number" value={newProc.price || ''} onChange={e => setNewProc({...newProc, price: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg text-sm font-bold" placeholder="0.00"/>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                                 <select value={newProc.category} onChange={e => setNewProc({...newProc, category: e.target.value})} className="w-full p-2 border rounded-lg text-sm">
                                     {['General', 'Preventive', 'Restorative', 'Surgery', 'Ortho', 'Cosmetic'].map(c => <option key={c} value={c}>{c}</option>)}
                                 </select>
                             </div>
                             <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t mt-2">
                                 <button onClick={() => setIsAddingProc(false)} className="px-4 py-2 text-slate-500 font-bold">Cancel</button>
                                 <button onClick={handleAddProcedure} className="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold">Add to List</button>
                             </div>
                         </div>
                     )}

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {settings.procedures.map(proc => (
                             <div key={proc.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-teal-200 transition-colors">
                                 <div>
                                     <div className="flex justify-between items-start mb-2">
                                         <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">{proc.category}</span>
                                         <button onClick={() => handleDeleteProcedure(proc.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                                     </div>
                                     <h5 className="font-bold text-slate-800 text-sm">{proc.name}</h5>
                                 </div>
                                 <div className="mt-4 flex items-baseline gap-1">
                                     <span className="text-teal-600 font-black text-lg">₱{proc.price.toLocaleString()}</span>
                                     <span className="text-[10px] text-slate-400 font-bold uppercase">Standard</span>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {/* --- CLINIC BRANCHES --- */}
             {activeCategory === 'branches' && (
                 <div className="space-y-4 max-w-md">
                     <div className="flex gap-2 mb-6">
                        <input 
                            type="text" 
                            className="flex-1 p-3 border border-slate-200 rounded-xl text-sm" 
                            placeholder="Add branch name..."
                            value={newItemValue}
                            onChange={e => setNewItemValue(e.target.value)}
                        />
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                if (!newItemValue.trim()) return;
                                onUpdateSettings({ ...settings, branches: [...settings.branches, newItemValue.trim()] });
                                setNewItemValue('');
                            }}
                            className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold"
                        >
                            Add
                        </button>
                     </div>
                     <div className="space-y-2">
                         {settings.branches.map(b => (
                             <div key={b} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center group">
                                 <div className="flex items-center gap-3">
                                     <MapPin size={18} className="text-slate-400" />
                                     <span className="font-bold text-slate-700">{b}</span>
                                 </div>
                                 <button onClick={() => onUpdateSettings({...settings, branches: settings.branches.filter(item => item !== b)})} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {/* --- DATABASE ADMIN --- */}
             {activeCategory === 'system' && (
                 <div className="space-y-6">
                     <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
                         <h4 className="text-red-800 font-bold text-lg mb-2 flex items-center gap-2">
                             <RefreshCcw size={20} /> Reset Stress Test Data
                         </h4>
                         <p className="text-red-700 text-sm mb-6 leading-relaxed">
                             If you have old data stuck in your browser from a previous session, click the button below to wipe everything and reload the comprehensive 3-Month Stress Test Dataset.
                         </p>
                         <button 
                            onClick={onResetData}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all active:scale-95"
                         >
                             Wipe & Reload Stress Data
                         </button>
                     </div>

                     <div className="bg-white p-6 rounded-2xl border border-slate-200">
                         <h4 className="font-bold text-slate-800 mb-4">System Information</h4>
                         <div className="grid grid-cols-2 gap-4 text-xs">
                             <div className="bg-slate-50 p-3 rounded-lg"><span className="text-slate-400 font-bold block mb-1">App Version</span><span className="font-mono font-bold">2.4.0 (Ortho-Ledger)</span></div>
                             <div className="bg-slate-50 p-3 rounded-lg"><span className="text-slate-400 font-bold block mb-1">Local Records</span><span className="font-mono font-bold">{staff.length + settings.procedures.length} entries</span></div>
                         </div>
                     </div>
                 </div>
             )}

         </div>
      </div>
    </div>
  );
};

export default FieldManagement;

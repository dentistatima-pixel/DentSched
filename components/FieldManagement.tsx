

import React, { useState, useMemo } from 'react';
import { FieldSettings, ProcedureItem, FeatureToggles, User, SmsTemplates } from '../types';
import { Plus, Trash2, Edit2, Check, X, Sliders, ChevronRight, DollarSign, ToggleLeft, ToggleRight, Box, Calendar, MapPin, User as UserIcon, MessageSquare, Tag } from 'lucide-react';

interface FieldManagementProps {
  settings: FieldSettings;
  onUpdateSettings: (newSettings: FieldSettings) => void;
  staff?: User[]; // Added
  onUpdateStaff?: (updatedStaff: User[]) => void; // Added
}

const FieldManagement: React.FC<FieldManagementProps> = ({ settings, onUpdateSettings, staff, onUpdateStaff }) => {
  const [activeCategory, setActiveCategory] = useState<keyof FieldSettings | 'features' | 'roster' | 'sms'>('features'); 
  
  // Standard List State
  const [newItemValue, setNewItemValue] = useState('');
  const [editingItem, setEditingItem] = useState<{ index: number, value: string } | null>(null);

  // Procedure List State
  const [newProcName, setNewProcName] = useState('');
  const [newProcPrice, setNewProcPrice] = useState('');
  const [newProcCategory, setNewProcCategory] = useState('');
  const [editingProc, setEditingProc] = useState<{ index: number, name: string, price: string, category: string } | null>(null);

  const categories: { key: keyof FieldSettings | 'features' | 'roster' | 'sms'; label: string; description: string }[] = [
    { key: 'features', label: 'System Features', description: 'Enable or disable major application modules.' },
    { key: 'roster', label: 'Staff Roster', description: 'Manage weekly schedule and branch assignments for staff.' },
    { key: 'sms', label: 'Messaging & SMS', description: 'Manage automated SMS templates for patient notifications.' },
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

  // --- SMS TEMPLATE HANDLER ---
  const handleSmsTemplateChange = (key: keyof SmsTemplates, value: string) => {
      onUpdateSettings({
          ...settings,
          smsTemplates: {
              ...settings.smsTemplates,
              [key]: value
          }
      });
  };

  // --- ROSTER HANDLER ---
  const handleRosterChange = (userId: string, day: string, branch: string) => {
      if (!staff || !onUpdateStaff) return;
      
      const updatedStaff = staff.map(u => {
          if (u.id === userId) {
              const currentRoster = u.roster || {};
              const newRoster = { ...currentRoster };
              
              if (branch === 'OFF') {
                  delete newRoster[day];
              } else {
                  newRoster[day] = branch;
              }
              
              return { ...u, roster: newRoster };
          }
          return u;
      });
      onUpdateStaff(updatedStaff);
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
          price: parseFloat(newProcPrice),
          category: newProcCategory.trim() || 'General'
      };

      const updatedList = [...settings.procedures, newProc];
      onUpdateSettings({ ...settings, procedures: updatedList });
      setNewProcName('');
      setNewProcPrice('');
      setNewProcCategory('');
  };

  const saveProcEdit = () => {
      if (!editingProc || !editingProc.name.trim()) return;
      const updatedList = [...settings.procedures];
      updatedList[editingProc.index] = {
          ...updatedList[editingProc.index],
          name: editingProc.name.trim(),
          price: parseFloat(editingProc.price) || 0,
          category: editingProc.category.trim() || 'General'
      };
      onUpdateSettings({ ...settings, procedures: updatedList });
      setEditingProc(null);
  };

  const existingCategories = useMemo(() => {
      const cats = new Set(settings.procedures.map(p => p.category || 'General'));
      return Array.from(cats).sort();
  }, [settings.procedures]);

  // Group procedures by category
  const groupedProcedures = useMemo(() => {
      const grouped: Record<string, { item: ProcedureItem, index: number }[]> = {};
      settings.procedures.forEach((proc, idx) => {
          const cat = proc.category || 'General';
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push({ item: proc, index: idx });
      });
      return grouped;
  }, [settings.procedures]);


  const activeCategoryInfo = categories.find(c => c.key === activeCategory);
  const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

  const SmsTemplateEditor = ({ label, templateKey, description }: { label: string, templateKey: keyof SmsTemplates, description: string }) => (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-2">
              <h4 className="font-bold text-slate-800 text-sm">{label}</h4>
              <p className="text-xs text-slate-500">{description}</p>
          </div>
          <textarea 
              value={settings.smsTemplates?.[templateKey] || ''}
              onChange={(e) => handleSmsTemplateChange(templateKey, e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:border-teal-500 outline-none h-24 resize-none"
              placeholder="Enter message template..."
          />
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

         {/* CONTENT SWTICH */}
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
         ) : activeCategory === 'sms' ? (
             /* --- SMS TEMPLATES --- */
             <div className="flex-1 overflow-auto p-4 bg-slate-50">
                 <div className="flex gap-4 mb-6">
                    <div className="flex-1 space-y-4">
                         <SmsTemplateEditor 
                            label="Immediate Validation (Booking Created)" 
                            templateKey="bookingConfirmation" 
                            description="Sent immediately when a new appointment is saved."
                         />
                         <SmsTemplateEditor 
                            label="48-Hour Shield (Confirmation Request)" 
                            templateKey="confirmationRequest" 
                            description="Sent 48 hours before the appointment. Asks for 'C' or 'R' reply."
                         />
                         <SmsTemplateEditor 
                            label="24-Hour Reminder" 
                            templateKey="reminder24h" 
                            description="Gentle reminder sent 1 day before the visit."
                         />
                         <SmsTemplateEditor 
                            label="Post-Op Care (After Completion)" 
                            templateKey="postOpCheckup" 
                            description="Sent 2 hours after appointment is marked 'Completed'."
                         />
                         <SmsTemplateEditor 
                            label="Registration Welcome" 
                            templateKey="registrationWelcome" 
                            description="Sent when a new patient file is created."
                         />
                    </div>
                    <div className="w-64 shrink-0">
                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-yellow-900 sticky top-0">
                            <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                                <MessageSquare size={16} /> Variables
                            </div>
                            <p className="text-xs mb-3">Use these codes to auto-fill data:</p>
                            <ul className="text-xs font-mono space-y-1">
                                <li>{'{PatientName}'}</li>
                                <li>{'{ProviderName}'}</li>
                                <li>{'{Date}'}</li>
                                <li>{'{Time}'}</li>
                                <li>{'{Branch}'}</li>
                                <li>{'{Procedure}'}</li>
                            </ul>
                        </div>
                    </div>
                 </div>
             </div>
         ) : activeCategory === 'roster' ? (
            /* --- ROSTER MATRIX --- */
            <div className="flex-1 overflow-auto p-4 bg-slate-50">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 border-b border-slate-200">
                                <tr>
                                    <th className="p-4 font-bold text-slate-600 sticky left-0 bg-slate-100 z-10 w-48">Staff Member</th>
                                    {WEEKDAYS.map(day => (
                                        <th key={day} className="p-4 font-bold text-slate-600 text-center min-w-[140px]">{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {staff?.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50/50">
                                        <td className="p-4 font-bold text-slate-800 sticky left-0 bg-white z-10 flex items-center gap-3 border-r border-slate-100">
                                            <img src={user.avatar} className="w-8 h-8 rounded-full bg-slate-200" alt="avatar" />
                                            <div>
                                                <div>{user.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">{user.role}</div>
                                            </div>
                                        </td>
                                        {WEEKDAYS.map(day => {
                                            const assignment = user.roster?.[day] || 'OFF';
                                            const isOff = assignment === 'OFF';
                                            return (
                                                <td key={day} className="p-2 text-center border-r border-slate-50 last:border-0">
                                                    <div className={`relative rounded-lg overflow-hidden border transition-colors ${isOff ? 'border-slate-200 bg-slate-50' : 'border-teal-200 bg-teal-50'}`}>
                                                        <select 
                                                            value={assignment}
                                                            onChange={(e) => handleRosterChange(user.id, day, e.target.value)}
                                                            className={`w-full p-2 text-xs font-bold appearance-none bg-transparent outline-none cursor-pointer text-center ${isOff ? 'text-slate-400' : 'text-teal-700'}`}
                                                        >
                                                            <option value="OFF">OFF</option>
                                                            {settings.branches.map(b => (
                                                                <option key={b} value={b}>{b}</option>
                                                            ))}
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-end pr-2 opacity-0 hover:opacity-100">
                                                            <MapPin size={10} className="text-slate-400" />
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="mt-4 p-4 text-xs text-slate-500 bg-slate-100 rounded-xl flex items-center gap-2">
                    <Calendar size={14} />
                    <span>Assignments set here will trigger conflict warnings if appointments are booked at incorrect locations.</span>
                </div>
            </div>
         ) : activeCategory === 'procedures' ? (
             <>
                {/* ADD PROCEDURE FORM */}
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <form onSubmit={handleAddProcedure} className="flex flex-col md:flex-row gap-2">
                        <div className="flex-1 flex gap-2">
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
                        </div>
                        <div className="flex gap-2">
                            <input 
                                list="proc-categories"
                                type="text" 
                                placeholder="Category"
                                className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white w-40"
                                value={newProcCategory}
                                onChange={(e) => setNewProcCategory(e.target.value)}
                            />
                            <datalist id="proc-categories">
                                {existingCategories.map(c => <option key={c} value={c} />)}
                            </datalist>
                            <button 
                                type="submit"
                                disabled={!newProcName.trim()}
                                className="bg-teal-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                            >
                                <Plus size={18} /> Add
                            </button>
                        </div>
                    </form>
                </div>

                {/* PROCEDURE LIST (GROUPED) */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="space-y-6">
                        {Object.keys(groupedProcedures).sort().map(category => (
                            <div key={category} className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-2 sticky top-0 bg-white/95 backdrop-blur-sm p-2 rounded-lg z-10">
                                    <Tag size={12} /> {category}
                                </h4>
                                {groupedProcedures[category].map(({ item: proc, index: originalIdx }) => (
                                    <div key={proc.id} className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all bg-white shadow-sm">
                                        {editingProc?.index === originalIdx ? (
                                            <div className="flex-1 flex gap-2 items-center">
                                                <input 
                                                    type="text" 
                                                    className="flex-[2] px-3 py-1 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm"
                                                    value={editingProc.name}
                                                    onChange={(e) => setEditingProc({ ...editingProc, name: e.target.value })}
                                                    autoFocus
                                                />
                                                <input 
                                                    type="number" 
                                                    className="w-24 px-3 py-1 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm"
                                                    value={editingProc.price}
                                                    onChange={(e) => setEditingProc({ ...editingProc, price: e.target.value })}
                                                />
                                                <input 
                                                    list="proc-categories"
                                                    type="text" 
                                                    className="w-32 px-3 py-1 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm"
                                                    value={editingProc.category}
                                                    onChange={(e) => setEditingProc({ ...editingProc, category: e.target.value })}
                                                />
                                                <button onClick={saveProcEdit} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Check size={16}/></button>
                                                <button onClick={() => setEditingProc(null)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><X size={16}/></button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex-1 flex justify-between items-center pr-4">
                                                    <span className="font-medium text-slate-700 ml-2 text-sm">{proc.name}</span>
                                                    <span className="font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded text-xs">₱{proc.price.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => setEditingProc({ index: originalIdx, name: proc.name, price: proc.price.toString(), category: proc.category || 'General' })}
                                                        className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteItem(originalIdx)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
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


import React, { useState, useMemo } from 'react';
import { FieldSettings, Patient, FamilyGroup } from '../types';
import { Users2, Plus, ArrowLeft, Search, X } from 'lucide-react';
import { useToast } from './ToastSystem';

interface FamilyGroupManagerProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
    patients: Patient[];
    onBack?: () => void;
}

const FamilyGroupManager: React.FC<FamilyGroupManagerProps> = ({ settings, onUpdateSettings, patients, onBack }) => {
    const toast = useToast();
    const [editingGroup, setEditingGroup] = useState<Partial<FamilyGroup> | null>(null);
    const [patientSearch, setPatientSearch] = useState('');

    const familyGroups = settings.familyGroups || [];
    const patientsNotInGroup = patients.filter(p => !p.familyGroupId);

    const filteredPatients = useMemo(() => {
        if (!patientSearch) return [];
        return patientsNotInGroup
            .filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()))
            .slice(0, 5);
    }, [patientSearch, patientsNotInGroup]);

    const handleSaveGroup = () => {
        if (!editingGroup || !editingGroup.familyName || !editingGroup.headOfFamilyId) {
            toast.error("Group Name and Head of Family are required.");
            return;
        }

        const isNew = !editingGroup.id;
        const groupId = editingGroup.id || `fam_${Date.now()}`;
        
        const newGroup: FamilyGroup = {
            id: groupId,
            familyName: editingGroup.familyName,
            headOfFamilyId: editingGroup.headOfFamilyId,
            memberIds: editingGroup.memberIds || [editingGroup.headOfFamilyId],
        };

        const nextGroups = isNew ? [...familyGroups, newGroup] : familyGroups.map(g => g.id === groupId ? newGroup : g);
        onUpdateSettings({ ...settings, familyGroups: nextGroups });
        setEditingGroup(null);
        toast.success(`Family group "${newGroup.familyName}" saved.`);
    };
    
    const handleAddMember = (groupId: string, patientId: string) => {
        const nextGroups = familyGroups.map(g => {
            if (g.id === groupId) {
                return { ...g, memberIds: [...g.memberIds, patientId] };
            }
            return g;
        });
        onUpdateSettings({ ...settings, familyGroups: nextGroups });
    };

    const handleRemoveMember = (groupId: string, patientId: string) => {
        const nextGroups = familyGroups.map(g => {
            if (g.id === groupId) {
                return { ...g, memberIds: g.memberIds.filter(id => id !== patientId) };
            }
            return g;
        });
        onUpdateSettings({ ...settings, familyGroups: nextGroups });
    };

    const handleRemoveGroup = (groupId: string) => {
        if (window.confirm("Are you sure you want to delete this family group?")) {
            const nextGroups = familyGroups.filter(g => g.id !== groupId);
            onUpdateSettings({ ...settings, familyGroups: nextGroups });
            toast.info("Family group removed.");
        }
    };

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                {onBack && (
                  <button onClick={onBack} className="bg-white p-4 rounded-full shadow-sm border hover:bg-slate-100 transition-all active:scale-90" aria-label="Back to Admin Hub">
                      <ArrowLeft size={24} className="text-slate-600"/>
                  </button>
                )}
                <div>
                    <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Family Group Manager</h3>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">Manage shared accounts and family units.</p>
                </div>
            </div>
            
            <div className="flex justify-end">
                <button onClick={() => setEditingGroup({ memberIds: [] })} className="bg-teal-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2">
                    <Plus size={16}/> New Family Group
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {familyGroups.map(group => {
                    const head = patients.find(p => p.id === group.headOfFamilyId);
                    const members = patients.filter(p => group.memberIds.includes(p.id));
                    return (
                        <div key={group.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                            <h4 className="font-black text-lg text-slate-800">{group.familyName}</h4>
                            <p className="text-xs font-bold text-slate-400">Head: {head?.name || 'N/A'}</p>
                            <div className="flex-1 mt-4 space-y-2">
                                {members.map(m => (
                                    <div key={m.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-lg">
                                        <span>{m.name}</span>
                                        {m.id !== head?.id && <button onClick={() => handleRemoveMember(group.id, m.id)} className="text-red-500"><X size={14}/></button>}
                                    </div>
                                ))}
                            </div>
                             <div className="relative mt-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                                <input type="text" onChange={e => setPatientSearch(e.target.value)} placeholder="Add member..." className="input text-xs pl-9"/>
                                {patientSearch && (
                                    <div className="absolute bottom-full mb-1 w-full bg-white border rounded-lg shadow-md z-10">
                                        {filteredPatients.map(p => <button key={p.id} onClick={() => handleAddMember(group.id, p.id)} className="block w-full text-left p-2 text-xs hover:bg-teal-50">{p.name}</button>)}
                                    </div>
                                )}
                            </div>
                            <button onClick={() => handleRemoveGroup(group.id)} className="mt-4 text-xs text-red-500 font-bold">Delete Group</button>
                        </div>
                    );
                })}
            </div>

            {editingGroup && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
                        <h3 className="font-bold text-lg">Family Group</h3>
                        <div>
                            <label className="label text-xs">Family Name</label>
                            <input type="text" value={editingGroup.familyName || ''} onChange={e => setEditingGroup({...editingGroup, familyName: e.target.value})} className="input"/>
                        </div>
                        <div>
                            <label className="label text-xs">Head of Family</label>
                            <select value={editingGroup.headOfFamilyId || ''} onChange={e => setEditingGroup({...editingGroup, headOfFamilyId: e.target.value})} className="input">
                                <option value="">Select Head...</option>
                                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingGroup(null)} className="px-4 py-2 text-xs font-bold">Cancel</button>
                            <button onClick={handleSaveGroup} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FamilyGroupManager;

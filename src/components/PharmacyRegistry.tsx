import React, { useState } from 'react';
import { FieldSettings, Medication } from '../types';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from './ToastSystem';
import { useModal } from '../contexts/ModalContext';

interface PharmacyRegistryProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
}

const PharmacyRegistry: React.FC<PharmacyRegistryProps> = ({ settings, onUpdateSettings }) => {
    const toast = useToast();
    const { showModal } = useModal();
    const [editingMedication, setEditingMedication] = useState<Partial<Medication> | null>(null);

    const handleSaveMedication = () => {
        if (!editingMedication?.genericName) return;
        const next = editingMedication.id
            ? settings.medications.map(m => m.id === editingMedication.id ? editingMedication as Medication : m)
            : [...settings.medications, { ...editingMedication, id: `med_${Date.now()}` } as Medication];
        onUpdateSettings({ ...settings, medications: next });
        setEditingMedication(null);
        toast.success("Pharmacy registry updated.");
    };

    const handleDeleteMedication = (e: React.MouseEvent, medId: string) => {
        e.stopPropagation(); // Prevent opening the edit modal
        showModal('confirm', {
            title: 'Delete Medication',
            message: 'Are you sure you want to delete this medication from the registry?',
            confirmText: 'Delete',
            isDestructive: true,
            onConfirm: () => {
                const next = settings.medications.filter(m => m.id !== medId);
                onUpdateSettings({ ...settings, medications: next });
                toast.info("Medication removed.");
            }
        });
    };

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex justify-end mb-6">
                <button onClick={() => setEditingMedication({})} className="bg-teal-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2"><Plus size={16}/> Add Medication</button>
            </div>
            
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 tracking-widest">
                        <tr>
                            <th className="p-4 text-left">Generic Name</th>
                            <th className="p-4 text-left">Brand Name</th>
                            <th className="p-4 text-left">Dosage</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {settings.medications.slice().sort((a, b) => a.genericName.localeCompare(b.genericName)).map(med => (
                            <tr key={med.id} onClick={() => setEditingMedication(med)} className="hover:bg-teal-50 cursor-pointer group">
                                <td className="p-4 font-bold text-slate-800">
                                    {med.genericName}
                                    {med.isS2Controlled && <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] tracking-widest uppercase font-black">💊 S2</span>}
                                </td>
                                <td className="p-4 text-slate-600">{med.brandName}</td>
                                <td className="p-4 text-slate-600">{med.dosage}</td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={(e) => handleDeleteMedication(e, med.id)} 
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingMedication && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingMedication(null)}/>
                    <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-6 animate-in zoom-in-95">
                        <h3 className="text-xl font-black uppercase tracking-widest text-lilac-900 border-b border-lilac-50 pb-4 mb-2">Pharmacy Entry</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="label text-[10px] text-slate-500">Generic Name (RA 6675)</label>
                                <input type="text" value={editingMedication.genericName || ''} onChange={e => setEditingMedication({...editingMedication, genericName: e.target.value})} className="input text-lg font-black" />
                            </div>
                            <div>
                                <label className="label text-[10px] text-slate-500">Commercial Brand Name</label>
                                <input type="text" value={editingMedication.brandName || ''} onChange={e => setEditingMedication({...editingMedication, brandName: e.target.value})} className="input" placeholder="Optional" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label text-[10px] text-slate-500">Dosage Form</label>
                                    <div className="flex gap-1.5 focus-within:ring-2 focus-within:ring-teal-500 rounded-xl">
                                        <input 
                                            type="text" 
                                            value={(editingMedication.dosage || '').match(/^([\d.]+)/)?.[1] || ''} 
                                            onChange={e => {
                                                // Extract the non-numeric suffix (the unit form) from the current dosage string, default to mg Capsule
                                                const currentForm = (editingMedication.dosage || '').replace(/^[\d.]+/, '') || 'mg Capsule';
                                                setEditingMedication({...editingMedication, dosage: `${e.target.value}${currentForm}`});
                                            }} 
                                            className="w-16 p-3 bg-slate-50 border border-slate-200 outline-none rounded-l-xl text-sm font-black text-center focus:bg-white" 
                                            placeholder="#" 
                                        />
                                        <select 
                                            value={(editingMedication.dosage || '').replace(/^[\d.]+/, '') || 'mg Capsule'}
                                            onChange={e => {
                                                // Extract the numeric prefix (strength) from the current dosage string
                                                const currentStrength = (editingMedication.dosage || '').match(/^([\d.]+)/)?.[1] || '';
                                                setEditingMedication({...editingMedication, dosage: `${currentStrength}${e.target.value}`});
                                            }}
                                            className="flex-1 p-3 bg-slate-50 border-y border-r border-slate-200 outline-none rounded-r-xl text-xs font-bold text-slate-700 focus:bg-white truncate"
                                        >
                                            <option value="mg Capsule">mg Capsule</option>
                                            <option value="mg Tablet">mg Tablet</option>
                                            <option value="g Tablet">g Tablet</option>
                                            <option value="mg/5ml Suspension">mg/5ml Suspension</option>
                                            <option value="mg/5ml Powder for Suspension">mg/5ml Pwd Susp.</option>
                                            <option value="mg/5ml Syrup">mg/5ml Syrup</option>
                                            <option value="mg/ml Drops">mg/ml Drops</option>
                                            <option value="% Solution">% Solution</option>
                                            <option value="% Ointment">% Ointment</option>
                                            <option value="mg/g Ointment">mg/g Ointment</option>
                                            <option value="mg/mL Injection">mg/mL Injection</option>
                                            {/* Support legacy/custom units already in the system but missing from the list above */}
                                            {!["mg Capsule", "mg Tablet", "g Tablet", "mg/5ml Suspension", "mg/5ml Powder for Suspension", "mg/5ml Syrup", "mg/ml Drops", "% Solution", "% Ointment", "mg/g Ointment", "mg/mL Injection", ""].includes((editingMedication.dosage || '').replace(/^[\d.]+/, '')) && (
                                                <option value={(editingMedication.dosage || '').replace(/^[\d.]+/, '')}>{(editingMedication.dosage || '').replace(/^[\d.]+/, '')} (Custom)</option>
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="label text-[10px] text-slate-500">S2 Controlled Substance</label>
                                    <button onClick={() => setEditingMedication({...editingMedication, isS2Controlled: !editingMedication.isS2Controlled})} className={`w-full py-3 h-11 rounded-xl border-2 transition-all font-black text-[10px] uppercase flex items-center justify-center ${editingMedication.isS2Controlled ? 'bg-amber-200 border-amber-500 text-amber-950 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                        {editingMedication.isS2Controlled ? '💊 S2 Active' : 'Regular'}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="label text-[10px] text-slate-500">Default Sig (Instructions)</label>
                                <textarea value={editingMedication.instructions || ''} onChange={e => setEditingMedication({...editingMedication, instructions: e.target.value})} className="input h-20 text-xs font-bold" />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setEditingMedication(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button>
                            <button onClick={handleSaveMedication} className="flex-[2] py-4 bg-lilac-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-lilac-600/20">Register Drug</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacyRegistry;

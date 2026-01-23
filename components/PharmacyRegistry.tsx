
import React, { useState } from 'react';
import { FieldSettings, Medication } from '../types';
import { Pill, Plus, Save } from 'lucide-react';
import { useToast } from './ToastSystem';

interface PharmacyRegistryProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
}

const PharmacyRegistry: React.FC<PharmacyRegistryProps> = ({ settings, onUpdateSettings }) => {
    const toast = useToast();
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
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {settings.medications.map(med => (
                            <tr key={med.id} onClick={() => setEditingMedication(med)} className="hover:bg-teal-50 cursor-pointer">
                                <td className="p-4 font-bold text-slate-800">{med.genericName}</td>
                                <td className="p-4 text-slate-600">{med.brandName}</td>
                                <td className="p-4 text-slate-600">{med.dosage}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingMedication && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center p-4"><div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingMedication(null)}/><div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-6 animate-in zoom-in-95"><h3 className="text-xl font-black uppercase tracking-widest text-lilac-900 border-b border-lilac-50 pb-4 mb-2">Pharmacy Entry</h3><div className="space-y-4"><div><label className="label text-[10px]">Generic Name (RA 6675)</label><input type="text" value={editingMedication.genericName} onChange={e => setEditingMedication({...editingMedication, genericName: e.target.value})} className="input text-lg font-black" /></div><div><label className="label text-[10px]">Commercial Brand Name</label><input type="text" value={editingMedication.brandName} onChange={e => setEditingMedication({...editingMedication, brandName: e.target.value})} className="input" placeholder="Optional" /></div><div className="grid grid-cols-2 gap-4"><div><label className="label text-[10px]">Dosage Form</label><input type="text" value={editingMedication.dosage} onChange={e => setEditingMedication({...editingMedication, dosage: e.target.value})} className="input" placeholder="e.g. 500mg" /></div><div><label className="label text-[10px]">S2 Controlled Substance</label><button onClick={() => setEditingMedication({...editingMedication, isS2Controlled: !editingMedication.isS2Controlled})} className={`w-full py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase ${editingMedication.isS2Controlled ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}>{editingMedication.isS2Controlled ? '💊 S2 Active' : 'Regular'}</button></div></div><div><label className="label text-[10px]">Default Sig (Instructions)</label><textarea value={editingMedication.instructions} onChange={e => setEditingMedication({...editingMedication, instructions: e.target.value})} className="input h-20 text-xs font-bold" /></div></div><div className="flex gap-3 pt-4"><button onClick={() => setEditingMedication(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl">Cancel</button><button onClick={handleSaveMedication} className="flex-[2] py-4 bg-lilac-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-lilac-600/20">Register Drug</button></div></div></div>
            )}
        </div>
    );
};

export default PharmacyRegistry;

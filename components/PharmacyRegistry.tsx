
import React, { useState, useEffect } from 'react';
import { FieldSettings, Medication } from '../types';
import { Pill, Plus, Save, X, ShieldAlert, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import { useToast } from './ToastSystem';

interface PharmacyRegistryProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
}

const PharmacyRegistry: React.FC<PharmacyRegistryProps> = ({ settings, onUpdateSettings }) => {
    const toast = useToast();
    const [editingMedication, setEditingMedication] = useState<Partial<Medication> | null>(null);

    // Local state for buffered inputs to prevent focus loss during global state updates
    const [localMed, setLocalMed] = useState<Partial<Medication>>({});

    useEffect(() => {
        if (editingMedication) {
            setLocalMed(editingMedication);
        }
    }, [editingMedication]);

    const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        setLocalMed(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSaveMedication = () => {
        if (!localMed.genericName) {
            toast.error("Generic name is mandatory for RA 6675 compliance.");
            return;
        }

        const medicationToSave = {
            ...localMed,
            id: localMed.id || `med_${Date.now()}`
        } as Medication;

        const nextMedications = localMed.id
            ? settings.medications.map(m => m.id === localMed.id ? medicationToSave : m)
            : [...settings.medications, medicationToSave];

        onUpdateSettings({ ...settings, medications: nextMedications });
        setEditingMedication(null);
        toast.success(`"${medicationToSave.genericName}" saved to practice registry.`);
    };

    const handleRemove = (id: string, name: string) => {
        if (window.confirm(`Permanently de-register "${name}" from the practice pharmacy?`)) {
            onUpdateSettings({ ...settings, medications: settings.medications.filter(m => m.id !== id) });
            toast.info("Medication removed.");
        }
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Drug Formulary</h4>
                    <p className="text-sm font-bold text-slate-500">Manage standardized generic medications for E-Prescribing.</p>
                </div>
                <button 
                    onClick={() => setEditingMedication({ genericName: '', brandName: '', dosage: '', instructions: '', isS2Controlled: false })} 
                    className="bg-teal-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                    <Plus size={20}/> Add Medication
                </button>
            </div>
            
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center px-8 py-5 shrink-0">
                    <div className="flex-1">Generic / Brand Name</div>
                    <div className="w-48 text-left px-4">Standard Dosage</div>
                    <div className="w-32 text-center">Status</div>
                    <div className="w-32 text-right">Actions</div>
                </div>

                <div className="divide-y divide-slate-50 overflow-y-auto no-scrollbar">
                    {settings.medications.map(med => (
                        <div key={med.id} className="flex items-center px-8 py-6 hover:bg-teal-50/50 transition-all group">
                            <div className="flex-1 min-w-0 pr-6">
                                <div className="font-black text-slate-900 text-base uppercase tracking-tight leading-none mb-1 group-hover:text-teal-900">{med.genericName}</div>
                                {med.brandName && <div className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">{med.brandName}</div>}
                            </div>
                            <div className="w-48 text-left px-4">
                                <span className="text-sm font-bold text-slate-600">{med.dosage}</span>
                            </div>
                            <div className="w-32 text-center">
                                {med.isS2Controlled ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-black uppercase border border-amber-200 shadow-sm" title="Yellow Rx Required">
                                        <ShieldAlert size={12}/> S2
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Regular</span>
                                )}
                            </div>
                            <div className="w-32 flex justify-end gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingMedication(med)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-teal-700 hover:border-teal-500 transition-all"><Edit2 size={16}/></button>
                                <button onClick={() => handleRemove(med.id, med.genericName)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-600 hover:border-red-500 transition-all"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                    {settings.medications.length === 0 && (
                        <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest italic">Formulary is empty.</div>
                    )}
                </div>
            </div>

            {editingMedication && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setEditingMedication(null)}/>
                    <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-0 animate-in zoom-in-95 duration-300 border-4 border-white overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-lilac-600 text-white p-3 rounded-2xl shadow-lg"><Pill size={24}/></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Drug Registry</h3>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">RA 6675 Compliance Mode</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingMedication(null)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                        </div>

                        <div className="p-8 space-y-6 flex-1 overflow-y-auto no-scrollbar">
                            <div>
                                <label className="label text-[10px]">Generic Name *</label>
                                <input name="genericName" type="text" value={localMed.genericName || ''} onChange={handleLocalChange} className="input text-lg font-black uppercase" placeholder="e.g. AMOXICILLIN" />
                            </div>
                            <div>
                                <label className="label text-[10px]">Commercial Brand Name</label>
                                <input name="brandName" type="text" value={localMed.brandName || ''} onChange={handleLocalChange} className="input font-bold" placeholder="Optional" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label text-[10px]">Dosage Form</label>
                                    <input name="dosage" type="text" value={localMed.dosage || ''} onChange={handleLocalChange} className="input" placeholder="e.g. 500mg Capsule" />
                                </div>
                                <div className="flex items-end pb-1">
                                    <label className={`w-full flex items-center justify-center gap-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${localMed.isS2Controlled ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                        <input 
                                            name="isS2Controlled" 
                                            type="checkbox" 
                                            checked={!!localMed.isS2Controlled} 
                                            onChange={handleLocalChange} 
                                            className="w-6 h-6 accent-amber-600 rounded" 
                                        />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{localMed.isS2Controlled ? '💊 S2 Active' : 'Regular'}</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="label text-[10px]">Default Sig (Instructions)</label>
                                <textarea name="instructions" value={localMed.instructions || ''} onChange={handleLocalChange} className="input h-24 text-sm font-bold leading-relaxed" placeholder="e.g. Take 1 capsule every 8 hours for 7 days." />
                            </div>
                            
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                                <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-blue-900 font-bold leading-relaxed">
                                    The Generics Act (RA 6675) requires the generic name to be written in a manner more prominent than the brand name on all prescriptions.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-white flex gap-3">
                            <button onClick={() => setEditingMedication(null)} className="flex-1 py-4 bg-slate-50 text-slate-500 font-black uppercase text-xs rounded-2xl tracking-widest">Discard</button>
                            <button onClick={handleSaveMedication} className="flex-[2] py-4 bg-teal-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-teal-600/30 hover:scale-[1.02] transition-all">Register Drug</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacyRegistry;

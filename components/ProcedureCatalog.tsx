
import React, { useState } from 'react';
import { FieldSettings, ProcedureItem, LicenseCategory } from '../types';
import { Plus, Edit2, Trash2, ShieldAlert, Check, Clock, FileSignature, Zap, Activity, ShieldCheck, Pill, Trash, AlertTriangle, Shield, User as UserIcon } from 'lucide-react';
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
            category: editingProcedure.category,
            requiresLeadApproval: editingProcedure.requiresLeadApproval || false,
            requiresConsent: editingProcedure.requiresConsent || false,
            requiresXray: editingProcedure.requiresXray || false,
            requiresWitness: editingProcedure.requiresWitness || false,
            defaultDurationMinutes: editingProcedure.defaultDurationMinutes || 30,
            riskDisclosures: editingProcedure.riskDisclosures || [],
            billOfMaterials: editingProcedure.billOfMaterials || [],
            allowedLicenseCategories: editingProcedure.allowedLicenseCategories || ['DENTIST']
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
        toast.success("Clinical registry synchronized.");
    };
    
    const handleOpenEditProcedure = (proc: ProcedureItem) => {
        setEditingProcedure({
            ...proc,
            riskDisclosures: proc.riskDisclosures || [],
            billOfMaterials: proc.billOfMaterials || [],
            allowedLicenseCategories: proc.allowedLicenseCategories || ['DENTIST']
        });
        const price = settings.priceBookEntries?.find(pbe => pbe.procedureId === proc.id)?.price ?? 0;
        setEditingProcedurePrice(price);
    };

    const handleAddRisk = () => {
        const risk = prompt("Enter standard risk disclosure:");
        if (risk && editingProcedure) {
            setEditingProcedure({
                ...editingProcedure,
                riskDisclosures: [...(editingProcedure.riskDisclosures || []), risk]
            });
        }
    };

    const handleAddBOM = (itemId: string) => {
        if (!editingProcedure) return;
        const currentBOM = editingProcedure.billOfMaterials || [];
        if (currentBOM.some(b => b.stockItemId === itemId)) return;
        
        setEditingProcedure({
            ...editingProcedure,
            billOfMaterials: [...currentBOM, { stockItemId: itemId, quantity: 1 }]
        });
    };

    const handleUpdateBOMQuantity = (itemId: string, qty: number) => {
        if (!editingProcedure) return;
        setEditingProcedure({
            ...editingProcedure,
            billOfMaterials: (editingProcedure.billOfMaterials || []).map(b => 
                b.stockItemId === itemId ? { ...b, quantity: qty } : b
            )
        });
    };

    const toggleLicense = (category: LicenseCategory) => {
        if (!editingProcedure) return;
        const current = editingProcedure.allowedLicenseCategories || [];
        const next = current.includes(category) 
            ? current.filter(c => c !== category) 
            : [...current, category];
        
        if (next.length === 0) return; // Must have at least one
        setEditingProcedure({ ...editingProcedure, allowedLicenseCategories: next });
    };

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Standardized Services</h4>
                    <p className="text-sm font-bold text-slate-500">Establish operational metadata and safety gates for clinical protocols.</p>
                </div>
                <button 
                    onClick={() => { 
                        setEditingProcedure({ 
                            name: '', 
                            category: 'General', 
                            requiresLeadApproval: false, 
                            requiresConsent: false,
                            requiresXray: false,
                            defaultDurationMinutes: 30,
                            allowedLicenseCategories: ['DENTIST'],
                            riskDisclosures: [],
                            billOfMaterials: []
                        }); 
                        setEditingProcedurePrice(0); 
                    }} 
                    className="bg-teal-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                    <Plus size={20}/> Register Procedure
                </button>
            </div>

            {/* Dense Clinical Matrix Root */}
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                
                {/* Fixed Header Row */}
                <div className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center px-8 py-5 shrink-0">
                    <div className="flex-1">Clinical definition & professional scope</div>
                    <div className="w-40 text-center">Protocol gates</div>
                    <div className="w-40 text-right">Standard fee</div>
                    <div className="w-32 text-right">Actions</div>
                </div>

                {/* Matrix Rows */}
                <div className="divide-y divide-slate-50 overflow-y-auto no-scrollbar">
                    {settings.procedures.map(proc => {
                        const price = settings.priceBookEntries?.find(pbe => pbe.procedureId === proc.id)?.price ?? 0;
                        return (
                            <div key={proc.id} className="flex items-center px-8 py-6 hover:bg-teal-50/50 transition-all group">
                                
                                {/* Identity Block (Vertical Stack) */}
                                <div className="flex-1 min-w-0 pr-6">
                                    <div className="font-black text-slate-900 text-base uppercase tracking-tight leading-none mb-2 truncate group-hover:text-teal-900">{proc.name}</div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[10px] font-black px-2 py-0.5 bg-white text-slate-500 rounded-full uppercase border border-slate-200">{proc.category}</span>
                                        <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] border-l border-slate-200 pl-2">
                                            <Clock size={12} className="text-slate-300"/> {proc.defaultDurationMinutes || 30}m
                                        </div>
                                        {proc.allowedLicenseCategories?.map(lc => (
                                            <div key={lc} className="flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-[9px] font-black uppercase border border-teal-100">
                                                <ShieldCheck size={10} /> {lc}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Governance Column (Icon-Based) */}
                                <div className="w-40 flex justify-center gap-3 shrink-0">
                                    {proc.requiresLeadApproval ? (
                                        <div className="bg-lilac-100 p-2.5 rounded-xl text-lilac-700 shadow-sm" title="Lead Authorization Required">
                                            <ShieldAlert size={20} />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl border border-slate-100 bg-slate-50/30" />
                                    )}
                                    {proc.requiresConsent ? (
                                        <div className="bg-teal-100 p-2.5 rounded-xl text-teal-700 shadow-sm" title="Mandatory Digital Consent">
                                            <FileSignature size={20} />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl border border-slate-100 bg-slate-50/30" />
                                    )}
                                </div>

                                {/* Pinned Fee Column */}
                                <div className="w-40 text-right shrink-0">
                                    <div className="font-black text-slate-900 text-xl tracking-tighter">₱{price.toLocaleString()}</div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base Rate</div>
                                </div>

                                {/* Pinned Action Column */}
                                <div className="w-32 flex justify-end gap-2 shrink-0">
                                    <button 
                                        onClick={() => handleOpenEditProcedure(proc)} 
                                        className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-teal-700 hover:border-teal-500 hover:shadow-lg hover:shadow-teal-900/5 transition-all active:scale-90"
                                        aria-label="Configure Procedure"
                                    >
                                        <Edit2 size={18}/>
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if(window.confirm(`De-register "${proc.name}" from the clinical catalog?`)) {
                                                onUpdateSettings({...settings, procedures: settings.procedures.filter(p => p.id !== proc.id)});
                                            }
                                        }} 
                                        className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-red-600 hover:border-red-500 hover:shadow-lg hover:shadow-red-900/5 transition-all active:scale-90"
                                        aria-label="Remove Procedure"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {settings.procedures.length === 0 && (
                    <div className="p-32 text-center flex flex-col items-center justify-center gap-6">
                        <Activity size={64} className="text-slate-100" />
                        <div>
                            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm">Registry Vacuum Detected</p>
                            <p className="text-slate-300 text-xs mt-2 font-bold uppercase">Begin populating the clinical catalog to enable scheduling.</p>
                        </div>
                    </div>
                )}
            </div>

            {editingProcedure && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setEditingProcedure(null)}/>
                    <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-0 animate-in zoom-in-95 duration-300 border-4 border-white overflow-hidden flex flex-col max-h-[90vh]">
                        
                        <div className="p-10 border-b border-slate-100 shrink-0 bg-slate-50/50">
                            <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-800 leading-none">Deep Registry Editor</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-600 mt-3 flex items-center gap-2"><Zap size={14}/> Forensic Metadata Configuration</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
                            {/* Operational Core */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                    <Activity size={20} className="text-teal-600"/>
                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Operational Metrics</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    <div className="md:col-span-6">
                                        <label className="label text-[10px]">Procedure Identification</label>
                                        <input type="text" value={editingProcedure.name} onChange={e => setEditingProcedure({...editingProcedure, name: e.target.value})} className="input font-black text-lg" placeholder="e.g. Surgical Extraction" />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="label text-[10px]">Registry Classification</label>
                                        <select value={editingProcedure.category} onChange={e => setEditingProcedure({...editingProcedure, category: e.target.value})} className="input font-bold">
                                            <option>General</option>
                                            <option>Preventive</option>
                                            <option>Restorative</option>
                                            <option>Surgery</option>
                                            <option>Endodontics</option>
                                            <option>Prosthodontics</option>
                                            <option>Imaging</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="label text-[10px]">Est. Duration (min)</label>
                                        <input type="number" value={editingProcedure.defaultDurationMinutes || 30} onChange={e => setEditingProcedure({...editingProcedure, defaultDurationMinutes: parseInt(e.target.value) || 0})} className="input font-black text-lg" />
                                    </div>
                                    <div className="md:col-span-12">
                                        <label className="label text-[10px]">Global Standard Fee (₱)</label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 group-focus-within:text-teal-600">₱</span>
                                            <input type="number" value={editingProcedurePrice} onChange={e => setEditingProcedurePrice(parseFloat(e.target.value) || 0)} className="input pl-10 font-black text-3xl text-slate-800" />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Safety Protocols */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                    <ShieldCheck size={20} className="text-lilac-600"/>
                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Safety & Compliance Gates</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${editingProcedure.requiresConsent ? 'bg-teal-50 border-teal-500' : 'bg-slate-50 border-slate-100'}`}>
                                        <input type="checkbox" checked={!!editingProcedure.requiresConsent} onChange={e => setEditingProcedure({...editingProcedure, requiresConsent: e.target.checked})} className="w-8 h-8 accent-teal-600 rounded mt-0.5" />
                                        <div><span className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Digital Consent Loop</span><p className="text-[11px] text-slate-500 font-bold mt-1">Enforce signed informed consent before status "TREATING".</p></div>
                                    </label>
                                    <label className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${editingProcedure.requiresLeadApproval ? 'bg-lilac-50 border-lilac-500' : 'bg-slate-50 border-slate-100'}`}>
                                        <input type="checkbox" checked={!!editingProcedure.requiresLeadApproval} onChange={e => setEditingProcedure({...editingProcedure, requiresLeadApproval: e.target.checked})} className="w-8 h-8 accent-lilac-600 rounded mt-0.5" />
                                        <div><span className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Lead Dentist Oversight</span><p className="text-[11px] text-slate-500 font-bold mt-1">Require a senior clinical pin-seal at chair-side.</p></div>
                                    </label>
                                    <label className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${editingProcedure.requiresXray ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-100'}`}>
                                        <input type="checkbox" checked={!!editingProcedure.requiresXray} onChange={e => setEditingProcedure({...editingProcedure, requiresXray: e.target.checked})} className="w-8 h-8 accent-blue-600 rounded mt-0.5" />
                                        <div><span className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Mandatory Radiograph</span><p className="text-[11px] text-slate-500 font-bold mt-1">Block treatment if no recent X-Ray is mapped to tooth.</p></div>
                                    </label>
                                    <label className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${editingProcedure.requiresWitness ? 'bg-orange-50 border-orange-500' : 'bg-slate-50 border-slate-100'}`}>
                                        <input type="checkbox" checked={!!editingProcedure.requiresWitness} onChange={e => setEditingProcedure({...editingProcedure, requiresWitness: e.target.checked})} className="w-8 h-8 accent-orange-600 rounded mt-0.5" />
                                        <div><span className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Staff Witness Signature</span><p className="text-[11px] text-slate-500 font-bold mt-1">Require a secondary staff signature for high-risk extraction.</p></div>
                                    </label>
                                </div>
                                
                                {editingProcedure.requiresConsent && (
                                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 animate-in slide-in-from-top-2">
                                        <div className="flex justify-between items-center mb-4">
                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Disclosure Registry</h5>
                                            <button onClick={handleAddRisk} className="text-teal-600 font-black text-[10px] uppercase flex items-center gap-1"><Plus size={12}/> Add Risk Item</button>
                                        </div>
                                        <div className="space-y-2">
                                            {(editingProcedure.riskDisclosures || []).map((risk, i) => (
                                                <div key={i} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl group">
                                                    <span className="text-xs font-bold text-slate-700">{risk}</span>
                                                    <button onClick={() => setEditingProcedure({...editingProcedure, riskDisclosures: editingProcedure.riskDisclosures?.filter((_, idx)=>idx!==i)})} className="text-slate-300 hover:text-red-500"><Trash size={14}/></button>
                                                </div>
                                            ))}
                                            {(!editingProcedure.riskDisclosures || editingProcedure.riskDisclosures.length === 0) && <p className="text-center text-[10px] text-slate-400 italic py-4">No risks defined. Consent will use general clinic terms.</p>}
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Professional Scope */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                    <UserIcon size={20} className="text-blue-600"/>
                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Scope of Practice (RA 9484)</h4>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    {(['DENTIST', 'HYGIENIST', 'TECHNOLOGIST'] as LicenseCategory[]).map(lc => {
                                        const isSelected = (editingProcedure.allowedLicenseCategories || []).includes(lc);
                                        return (
                                            <button 
                                                key={lc}
                                                onClick={() => toggleLicense(lc)}
                                                className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}
                                            >
                                                {lc} Authorized
                                            </button>
                                        )
                                    })}
                                </div>
                            </section>

                            {/* Inventory Bill of Materials */}
                            <section className="space-y-6 pb-10">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                    <Pill size={20} className="text-teal-600"/>
                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Logistics: Bill of Materials (BOM)</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Stock Registry Link</h5>
                                        <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar pr-2">
                                            {settings.stockItems?.filter(s => s.branch === 'Makati Main').map(item => (
                                                <button key={item.id} onClick={() => handleAddBOM(item.id)} className="w-full text-left p-3 rounded-xl hover:bg-teal-50 text-xs font-bold text-slate-700 flex justify-between items-center transition-all group">
                                                    {item.name}
                                                    <Plus size={14} className="text-teal-600 opacity-0 group-hover:opacity-100" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Active BOM (Auto-Depletion)</h5>
                                        {(editingProcedure.billOfMaterials || []).map(b => {
                                            const item = settings.stockItems?.find(s => s.id === b.stockItemId);
                                            return (
                                                <div key={b.stockItemId} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                                    <span className="flex-1 text-xs font-black text-slate-800 uppercase truncate">{item?.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <input type="number" value={b.quantity} onChange={e => handleUpdateBOMQuantity(b.stockItemId, parseFloat(e.target.value))} className="w-16 p-2 border rounded-lg text-center font-black text-xs" />
                                                        <button onClick={() => setEditingProcedure({...editingProcedure, billOfMaterials: editingProcedure.billOfMaterials?.filter(bom => bom.stockItemId !== b.stockItemId)})} className="text-slate-300 hover:text-red-500"><Trash size={14}/></button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {(editingProcedure.billOfMaterials || []).length === 0 && (
                                            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-[2rem]">
                                                <AlertTriangle size={24} className="mx-auto text-slate-200 mb-2"/>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No materials linked to this service.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="p-8 border-t border-slate-100 bg-white flex gap-4 shrink-0 shadow-2xl">
                            <button onClick={() => setEditingProcedure(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl tracking-widest hover:bg-slate-200 transition-all">Discard</button>
                            <button onClick={handleSaveProcedure} className="flex-[3] py-5 bg-teal-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-teal-600/30 hover:scale-[1.02] active:scale-95 transition-all">Commit to Clinical Catalog</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProcedureCatalog;

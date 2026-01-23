
import React, { useState, useMemo } from 'react';
import { Patient } from '../types';
import { Search, Scale, FileText, User, ChevronRight, X } from 'lucide-react';
import Fuse from 'fuse.js';

interface LegalActionHubProps {
    patients: Patient[];
    showModal: (type: string, props: any) => void;
}

const LegalActionHub: React.FC<LegalActionHubProps> = ({ patients, showModal }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    const fuse = useMemo(() => new Fuse(patients, {
        keys: ['name', 'id', 'phone'],
        threshold: 0.3,
    }), [patients]);

    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) return [];
        return fuse.search(searchTerm).map(result => result.item).slice(0, 5);
    }, [searchTerm, fuse]);

    const handleSelectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setSearchTerm('');
    };

    const handleOpenExport = () => {
        if (selectedPatient) {
            showModal('medicoLegalExport', { patient: selectedPatient });
        }
    };

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Legal Action Hub</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">Generate and manage medico-legal documentation.</p>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                <div className="flex items-center gap-4 text-lilac-800 font-black uppercase text-xs tracking-[0.2em] border-b border-slate-100 pb-4">
                    <Scale size={24} />
                    Patient Record Search
                </div>

                {!selectedPatient ? (
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search patient by name, ID, or phone..."
                            className="input w-full pl-16 py-6 text-xl"
                            autoFocus
                        />
                        {searchResults.length > 0 && (
                            <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-lg z-10">
                                {searchResults.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleSelectPatient(p)}
                                        className="w-full flex justify-between items-center p-4 text-left hover:bg-teal-50 transition-colors"
                                    >
                                        <div>
                                            <div className="font-bold text-slate-800">{p.name}</div>
                                            <div className="text-xs text-slate-500 font-mono">{p.id}</div>
                                        </div>
                                        <ChevronRight size={20} className="text-slate-400" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-teal-50 p-6 rounded-3xl border-2 border-teal-200 space-y-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-start">
                             <div className="flex items-center gap-4">
                                <div className="bg-teal-600 text-white p-3 rounded-2xl shadow-lg">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-teal-900 uppercase tracking-tight">{selectedPatient.name}</h4>
                                    <p className="text-xs text-teal-700 font-bold font-mono">ID: {selectedPatient.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedPatient(null)} className="p-2 text-slate-400 hover:text-red-600 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <button
                            onClick={handleOpenExport}
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                        >
                            <FileText size={18} /> Compile & Export Medico-Legal Report
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LegalActionHub;

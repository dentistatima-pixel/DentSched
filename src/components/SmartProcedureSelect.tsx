import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, X, Activity } from 'lucide-react';
import { ProcedureItem } from '../types';

interface SmartProcedureSelectProps {
    procedures: ProcedureItem[];
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

const SmartProcedureSelect: React.FC<SmartProcedureSelectProps> = ({ procedures, value, onChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Prevent body scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setSearchTerm(''); // Clear search on close
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Group procedures by category
    const categorized = procedures.reduce((acc, proc) => {
        if (!acc[proc.category]) acc[proc.category] = [];
        acc[proc.category].push(proc);
        return acc;
    }, {} as Record<string, ProcedureItem[]>);

    // Filter based on search term
    const filteredCategories = Object.keys(categorized).reduce((acc, cat) => {
        const filtered = categorized[cat].filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        if (filtered.length > 0) acc[cat] = filtered;
        return acc;
    }, {} as Record<string, ProcedureItem[]>);

    const handleSelect = (procName: string) => {
        onChange(procName);
        setIsOpen(false);
    };

    return (
        <>
            <div 
                className={`input flex justify-between items-center cursor-pointer ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => !disabled && setIsOpen(true)}
            >
                <div className="truncate font-bold text-slate-700">
                    {value || <span className="text-slate-400 font-medium tracking-wide">Search or select procedure...</span>}
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[99999] flex flex-col bg-slate-900/70 backdrop-blur-md p-4 xl:p-12 overflow-hidden animate-in fade-in duration-200">
                    <div className="bg-slate-50 w-full max-w-6xl mx-auto rounded-[2rem] shadow-2xl flex flex-col h-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 pointer-events-auto">
                        
                        {/* Header & Search Bar */}
                        <div className="p-4 md:p-8 bg-white border-b border-slate-200 flex items-center gap-4 shrink-0 shadow-sm z-10">
                            <div className="bg-teal-100 text-teal-700 p-4 rounded-2xl hidden md:flex items-center justify-center">
                                <Search size={28} strokeWidth={2.5} />
                            </div>
                            <Search size={24} className="text-slate-400 md:hidden" />
                            <input
                                type="text"
                                autoFocus
                                placeholder="Type procedure name (e.g., Crown, RCT, Extraction)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none outline-none w-full text-xl md:text-3xl font-black text-slate-800 placeholder:font-bold placeholder:text-slate-300 focus:ring-0 px-0 md:px-2"
                            />
                            <button 
                                onClick={() => setIsOpen(false)} 
                                className="ml-auto p-4 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors text-slate-500 shrink-0"
                            >
                                <X size={28} strokeWidth={2.5}/>
                            </button>
                        </div>

                        {/* Results List */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-slate-300">
                            {Object.keys(filteredCategories).length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center space-y-4">
                                    <Activity size={64} className="opacity-20" />
                                    <p className="text-2xl font-black text-slate-500">No procedures found for "{searchTerm}"</p>
                                    <p className="text-lg font-medium">Try a different clinical term or category.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
                                    {Object.entries(filteredCategories).map(([category, procs]) => (
                                        <div key={category} className="flex flex-col">
                                            <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-slate-200">
                                                <h3 className="text-xl font-black text-slate-800">{category}</h3>
                                                <span className="text-sm font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full">{procs.length}</span>
                                            </div>
                                            <div className="flex flex-col border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                                                {procs.map((proc, index) => (
                                                    <button
                                                        key={proc.id}
                                                        onClick={() => handleSelect(proc.name)}
                                                        className={`text-left w-full px-6 py-4 hover:bg-teal-50 hover:text-teal-900 transition-all group flex items-center justify-between gap-4 ${index !== procs.length - 1 ? 'border-b border-slate-100' : ''}`}
                                                    >
                                                        <span className="text-lg font-bold text-slate-700 group-hover:text-teal-900 leading-tight">
                                                            {proc.name}
                                                        </span>
                                                        {proc.requiresLeadApproval && (
                                                            <div className="px-3 py-1 bg-amber-100 text-amber-800 text-xs uppercase font-black tracking-widest rounded-lg shrink-0">
                                                                Auth Req
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default SmartProcedureSelect;

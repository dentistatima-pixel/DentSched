
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, User, Calendar, Plus, Command, X, CornerDownLeft } from 'lucide-react';
import { Patient, Appointment, CommandBarAction } from '../types';
import Fuse from 'fuse.js';

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  todaysAppointments: Appointment[];
  onNavigate: (type: 'patient' | 'action', payload?: any) => void;
}

type SearchResult =
  | { type: 'patient'; item: Patient }
  | { type: 'appointment'; item: Appointment }
  | { type: 'action'; item: CommandBarAction };

export const CommandBar: React.FC<CommandBarProps> = ({
  isOpen, onClose, patients, todaysAppointments, onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const patientFuse = useMemo(() => new Fuse(patients, { keys: ['name', 'id', 'phone', 'nickname'], threshold: 0.3 }), [patients]);
  
  const staticActions: CommandBarAction[] = useMemo(() => [
    { id: 'newPatient', name: 'New Patient Registration', icon: User, section: 'Actions', perform: () => onNavigate('action', 'newPatient') },
    { id: 'newAppointment', name: 'New Appointment Booking', icon: Calendar, section: 'Actions', perform: () => onNavigate('action', 'newAppointment') },
  ], [onNavigate]);

  const allResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const lowercasedTerm = searchTerm.toLowerCase();
    
    const patientResults: SearchResult[] = patientFuse.search(lowercasedTerm).map((r): SearchResult => ({ type: 'patient', item: r.item })).slice(0, 5);
    const appointmentResults: SearchResult[] = todaysAppointments
      .filter(apt => !apt.isBlock && patients.find(p => p.id === apt.patientId)?.name.toLowerCase().includes(lowercasedTerm))
      .map((apt): SearchResult => ({ type: 'appointment', item: apt }))
      .slice(0, 3);
    const actionResults: SearchResult[] = staticActions
      .filter(action => action.name.toLowerCase().includes(lowercasedTerm))
      .map((action): SearchResult => ({ type: 'action', item: action }));

    return [...patientResults, ...appointmentResults, ...actionResults];
  }, [searchTerm, patientFuse, todaysAppointments, patients, staticActions]);

  useEffect(() => {
    setActiveIndex(0);
  }, [allResults]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = allResults[activeIndex];
      if (selected) {
        if (selected.type === 'patient') onNavigate('patient', selected.item.id);
        else if (selected.type === 'appointment') onNavigate('patient', selected.item.patientId);
        else if (selected.type === 'action') selected.item.perform();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [activeIndex, allResults, onNavigate, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setTimeout(() => inputRef.current?.focus(), 100);
      window.addEventListener('keydown', handleKeyDown);
    } else {
      window.removeEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);
  
  useEffect(() => {
    resultsRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!isOpen) return null;

  const renderResult = (result: SearchResult, index: number) => {
    const isSelected = index === activeIndex;
    let content;

    switch (result.type) {
        case 'patient':
            content = <><User size={16} /><div><p>{result.item.name}</p><p className="text-xs text-slate-400">{result.item.id}</p></div></>;
            break;
        case 'appointment':
            const patient = patients.find(p => p.id === result.item.patientId);
            content = <><Calendar size={16} /><div><p>{patient?.name}</p><p className="text-xs text-slate-400">{result.item.time} - {result.item.type}</p></div></>;
            break;
        case 'action':
            const Icon = result.item.icon;
            content = <><Icon size={16} /><div><p>{result.item.name}</p></div></>;
            break;
    }

    return (
      <li key={`${result.type}-${result.item.id}`}>
        <button
          onClick={() => {
            if (result.type === 'patient') onNavigate('patient', result.item.id);
            if (result.type === 'appointment') onNavigate('patient', result.item.patientId);
            if (result.type === 'action') result.item.perform();
          }}
          className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors ${isSelected ? 'bg-teal-100' : 'hover:bg-slate-50'}`}
        >
          {content}
        </button>
      </li>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex justify-center p-4 pt-[15vh]" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 h-fit max-h-[70vh]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <Search size={20} className="text-slate-400 shrink-0 ml-2" />
          <input ref={inputRef} type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Find patients, appts, or actions..." className="w-full bg-transparent text-lg font-medium text-slate-800 placeholder:text-slate-400 outline-none" />
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg"><X size={20}/></button>
        </div>
        <div ref={resultsRef} className="flex-1 overflow-y-auto p-2">
            {allResults.length > 0 ? (
                <ul className="p-2 space-y-1">{allResults.map(renderResult)}</ul>
            ) : (
                <div className="p-16 text-center text-slate-400">
                    <Command size={48} className="mx-auto mb-4 opacity-50"/>
                    <p className="font-bold">Instant Command Center</p>
                    <p className="text-sm mt-1">Search patients by name, ID, or nickname.</p>
                </div>
            )}
        </div>
         <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center text-xs text-slate-400 font-bold">
            <div className="flex items-center gap-2 px-2"><span>Select</span><CornerDownLeft size={12}/></div>
            <div className="flex items-center gap-2 px-2"><span>Navigate</span><kbd>↑</kbd><kbd>↓</kbd></div>
         </div>
      </div>
    </div>
  );
};

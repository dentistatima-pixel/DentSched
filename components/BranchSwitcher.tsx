import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check, Building } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useSettings } from '../contexts/SettingsContext';
import { UserRole } from '../types';

export const BranchSwitcher: React.FC = () => {
  const { currentBranch, setCurrentBranch, currentUser } = useAppContext();
  const { fieldSettings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableBranches = fieldSettings.branchProfiles.filter(b => 
    currentUser?.allowedBranches.includes(b.id) || 
    currentUser?.role === UserRole.ADMIN || 
    currentUser?.role === UserRole.SYSTEM_ARCHITECT
  );

  const currentBranchProfile = fieldSettings.branchProfiles.find(b => b.id === currentBranch);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white border border-white/10"
      >
        <div className="p-1.5 bg-teal-500/20 rounded-lg">
            <MapPin size={16} className="text-teal-300" />
        </div>
        <div className="text-left hidden md:block">
            <p className="text-[10px] uppercase tracking-widest text-teal-200 font-bold leading-none mb-0.5">Current Location</p>
            <p className="text-sm font-bold leading-none">{currentBranchProfile?.name || currentBranch || 'Select Branch'}</p>
        </div>
        <ChevronDown size={14} className={`text-teal-200 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95">
            <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Switch Branch</p>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                {availableBranches.map(branch => (
                    <button
                        key={branch.id}
                        onClick={() => {
                            setCurrentBranch(branch.id);
                            setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors ${
                            currentBranch === branch.id 
                                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300' 
                                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                    >
                        <div className={`p-2 rounded-lg shrink-0 ${currentBranch === branch.id ? 'bg-teal-100 dark:bg-teal-900/50' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            <Building size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{branch.name}</p>
                            <p className="text-xs opacity-70 truncate">{branch.address}</p>
                        </div>
                        {currentBranch === branch.id && <Check size={16} className="shrink-0" />}
                    </button>
                ))}
                {availableBranches.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-sm italic">
                        No other branches available.
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

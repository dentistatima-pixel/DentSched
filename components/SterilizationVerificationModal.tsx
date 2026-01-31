import React, { useState, useMemo } from 'react';
import { Appointment, InstrumentSet, SterilizationCycle } from '../types';
import { X, CheckCircle, Shield, Thermometer, Info } from 'lucide-react';
import { useToast } from './ToastSystem';
import { formatDate } from '../constants';

interface SterilizationVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (instrumentSetIds: string[]) => void;
  appointment: Appointment;
  requiredSets: string[];
  instrumentSets: InstrumentSet[];
  sterilizationCycles: SterilizationCycle[];
}

const SterilizationVerificationModal: React.FC<SterilizationVerificationModalProps> = ({
  isOpen, onClose, onConfirm, appointment, requiredSets, instrumentSets, sterilizationCycles
}) => {
  const toast = useToast();
  const [selectedSets, setSelectedSets] = useState<Record<string, string>>({});

  const availableSterileSets = useMemo(() => {
    const sterile = instrumentSets.filter(set => set.status === 'Sterile');
    const grouped: Record<string, InstrumentSet[]> = {};
    sterile.forEach(set => {
      if (!grouped[set.name]) {
        grouped[set.name] = [];
      }
      grouped[set.name].push(set);
    });
    return grouped;
  }, [instrumentSets]);

  const allSetsAssigned = requiredSets.every(reqSet => selectedSets[reqSet]);

  const handleConfirm = () => {
    if (!allSetsAssigned) {
      toast.error("Please assign a sterile set for all required items.");
      return;
    }
    onConfirm(Object.values(selectedSets));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-blue-100 bg-blue-50 flex items-center gap-4">
          <Shield size={28} className="text-blue-600" />
          <div>
            <h2 className="text-xl font-black text-blue-900 uppercase tracking-tight">Sterilization Verification Gate</h2>
            <p className="text-xs text-blue-700 font-bold uppercase">Material Traceability Protocol</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-900 text-xs font-bold leading-relaxed">
            <Info className="inline-block mr-2"/>
            This procedure requires sterile instrument sets. Please select a verified sterile set for each item below to proceed.
          </div>

          <div className="space-y-4">
            {requiredSets.map(setName => {
              const options = availableSterileSets[setName] || [];
              return (
                <div key={setName}>
                  <label className="label text-sm">{setName}</label>
                  <select
                    value={selectedSets[setName] || ''}
                    onChange={e => setSelectedSets(prev => ({ ...prev, [setName]: e.target.value }))}
                    className={`input ${options.length === 0 ? 'border-red-500 bg-red-50' : ''}`}
                  >
                    <option value="">{options.length > 0 ? 'Select sterile set...' : 'NO STERILE SETS AVAILABLE'}</option>
                    {options.map(set => {
                      const cycle = sterilizationCycles.find(c => c.id === set.lastCycleId);
                      return (
                        <option key={set.id} value={set.id}>
                          {set.name} (ID: ...{set.id.slice(-4)}) - Cycle: {cycle?.cycleNumber} on {formatDate(cycle?.date)}
                        </option>
                      )
                    })}
                  </select>
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-4 border-t bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
          <button onClick={handleConfirm} disabled={!allSetsAssigned} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
            <CheckCircle size={20}/> Verify & Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

export default SterilizationVerificationModal;

import React from 'react';
import { X, ClipboardCheck, Package, Wrench } from 'lucide-react';

interface PreparationChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumables?: { name: string; quantity: number; unit: string }[];
  traySetup?: string[];
  procedureName?: string;
}

const PreparationChecklistModal: React.FC<PreparationChecklistModalProps> = ({ isOpen, onClose, consumables, traySetup, procedureName }) => {
  if (!isOpen) return null;

  const hasConsumables = consumables && consumables.length > 0;
  const hasTraySetup = traySetup && traySetup.length > 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-teal-100 p-3 rounded-xl text-teal-700"><ClipboardCheck size={24} /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Preparation Checklist</h2>
              <p className="text-sm font-medium text-slate-500">{procedureName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">
          {hasConsumables && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                <Package size={16} className="text-lilac-600" />
                Consumables (Bill of Materials)
              </h3>
              <ul className="space-y-2">
                {consumables.map((item, index) => (
                  <li key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="font-bold text-sm text-slate-800">{item.name}</span>
                    <span className="font-black text-sm text-teal-700">{item.quantity} {item.unit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasTraySetup && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                <Wrench size={16} className="text-teal-600" />
                Instrument Tray Setup
              </h3>
              <ul className="space-y-2">
                {traySetup.map((item, index) => (
                  <li key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-100 font-bold text-sm text-slate-800">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {(!hasConsumables && !hasTraySetup) && (
             <div className="text-center py-16 text-slate-400">
                <p className="font-bold">No specific preparation items found.</p>
                <p className="text-sm mt-1">This procedure does not have a defined Bill of Materials or Tray Setup.</p>
              </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold text-sm">Close</button>
        </div>
      </div>
    </div>
  );
};

export default PreparationChecklistModal;

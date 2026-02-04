
import React from 'react';
import { X, Command, CornerDownLeft } from 'lucide-react';

interface ShortcutHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ['⌘', 'K'], description: 'Open Command Bar for global search' },
  { keys: ['⌘', '/'], description: 'Show this keyboard shortcuts menu' },
  { keys: ['Alt', 'N'], description: 'Book a New Appointment' },
  { keys: ['Alt', 'P'], description: 'Start New Patient Registration' },
  { keys: ['ESC'], description: 'Close any open modal or pop-up' },
];

const ShortcutHelpModal: React.FC<ShortcutHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Command size={20} className="text-slate-600" />
            <h2 className="text-lg font-bold text-slate-800">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X size={24} className="text-slate-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
              <span className="text-sm font-medium text-slate-700">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map(key => (
                  <kbd key={key} className="px-2 py-1 bg-slate-200 text-slate-600 rounded-md text-xs font-mono font-bold">
                    {key === '⌘' ? <Command size={10} /> : key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex justify-center items-center text-xs text-slate-400 font-bold">
            <div className="flex items-center gap-2 px-2"><span>Select in Command Bar</span><CornerDownLeft size={12}/></div>
         </div>
      </div>
    </div>
  );
};

export default ShortcutHelpModal;

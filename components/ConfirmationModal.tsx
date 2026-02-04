
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmColor?: 'red' | 'teal';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", confirmColor = 'teal'
}) => {
  if (!isOpen) return null;

  const colorClasses = confirmColor === 'red' 
    ? { bg: 'bg-red-600', shadow: 'shadow-red-600/30' }
    : { bg: 'bg-teal-600', shadow: 'shadow-teal-600/30' };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border-4 border-amber-200 animate-in zoom-in-95">
        <div className="text-center">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={40} />
          </div>
          <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tight">{title}</h2>
          <p className="text-sm text-slate-500 leading-relaxed mt-4">{message}</p>
        </div>
        <div className="flex gap-4 mt-8">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-sm tracking-widest">
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-[2] py-4 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl ${colorClasses.bg} ${colorClasses.shadow}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

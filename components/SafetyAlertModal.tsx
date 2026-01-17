import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface SafetyAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const SafetyAlertModal: React.FC<SafetyAlertModalProps> = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 text-center border-4 border-red-500 animate-in zoom-in-95">
            <ShieldAlert size={48} className="text-red-600 mx-auto mb-6 animate-pulse" />
            <h2 className="text-2xl font-black uppercase text-red-900 tracking-tighter">{title}</h2>
            <p className="text-slate-600 mt-4 leading-relaxed font-medium">{message}</p>
            <button 
                onClick={onClose} 
                className="mt-8 w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-red-600/30"
            >
                Acknowledge
            </button>
        </div>
    </div>
  );
};

export default SafetyAlertModal;

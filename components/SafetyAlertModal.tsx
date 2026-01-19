import React from 'react';
import { ShieldAlert, Zap } from 'lucide-react';

interface SafetyAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onAction?: () => void; // Gap 6
  actionLabel?: string; // Gap 6
}

const SafetyAlertModal: React.FC<SafetyAlertModalProps> = ({ isOpen, onClose, title, message, onAction, actionLabel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 text-center border-4 border-red-500 animate-in zoom-in-95">
            <ShieldAlert size={48} className="text-red-600 mx-auto mb-6 animate-pulse" />
            <h2 className="text-2xl font-black uppercase text-red-900 tracking-tighter">{title}</h2>
            <p className="text-slate-600 mt-4 leading-relaxed font-medium">{message}</p>
            <div className="mt-8 flex flex-col gap-3">
                <button 
                    onClick={onClose} 
                    className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-red-600/30"
                >
                    Acknowledge
                </button>
                {onAction && actionLabel && (
                    <button 
                        onClick={() => {
                            onClose(); // Close this modal first
                            onAction();
                        }} 
                        className="w-full py-4 bg-teal-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2"
                    >
                        <Zap size={16}/> {actionLabel}
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default SafetyAlertModal;

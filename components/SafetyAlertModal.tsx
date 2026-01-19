import React from 'react';
import { ShieldAlert, Zap } from 'lucide-react';

interface SafetyAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onAction?: () => void;
  actionLabel?: string;
  onOverride?: () => void;
  overrideLabel?: string;
}

const SafetyAlertModal: React.FC<SafetyAlertModalProps> = ({ isOpen, onClose, title, message, onAction, actionLabel, onOverride, overrideLabel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 text-center border-4 border-red-500 animate-in zoom-in-95">
            <ShieldAlert size={48} className="text-red-600 mx-auto mb-6 animate-pulse" />
            <h2 className="text-2xl font-black uppercase text-red-900 tracking-tighter">{title}</h2>
            <p className="text-slate-600 mt-4 leading-relaxed font-medium">{message}</p>
            <div className="mt-8 flex flex-col gap-3">
                {onAction && actionLabel && (
                    <button 
                        onClick={() => {
                            onAction();
                            onClose(); // Close this modal after initiating action
                        }} 
                        className="w-full py-4 bg-teal-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2"
                    >
                        <Zap size={16}/> {actionLabel}
                    </button>
                )}
                 {onOverride && overrideLabel && (
                    <button 
                        onClick={() => {
                            onOverride();
                            onClose();
                        }}
                        className="w-full py-4 bg-orange-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
                    >
                        <ShieldAlert size={16}/> {overrideLabel}
                    </button>
                )}
                <button 
                    onClick={onClose} 
                    className={`w-full py-4 font-black uppercase tracking-widest rounded-2xl ${onAction || onOverride ? 'bg-slate-100 text-slate-500' : 'bg-red-600 text-white shadow-lg shadow-red-600/30'}`}
                >
                    {onAction || onOverride ? 'Cancel' : 'Acknowledge'}
                </button>
            </div>
        </div>
    </div>
  );
};

export default SafetyAlertModal;
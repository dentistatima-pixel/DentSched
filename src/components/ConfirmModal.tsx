import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    isDestructive = true
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex justify-center items-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}/>
            <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">{title}</h3>
                    <p className="text-sm font-bold text-slate-500 whitespace-pre-line leading-relaxed">
                        {message}
                    </p>
                </div>
                
                <div className="flex gap-3 mt-8">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-4 bg-slate-100 text-slate-600 font-black uppercase text-xs rounded-2xl hover:bg-slate-200 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }} 
                        className={`flex-1 py-4 text-white font-black uppercase text-xs rounded-2xl shadow-xl transition-transform active:scale-95 ${isDestructive ? 'bg-red-600 shadow-red-600/20 hover:bg-red-700' : 'bg-teal-600 shadow-teal-600/20 hover:bg-teal-700'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;

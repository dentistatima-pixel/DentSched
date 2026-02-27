import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface PromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (value: string) => void;
    title: string;
    message: string;
    defaultValue?: string;
    confirmText?: string;
    cancelText?: string;
}

const PromptModal: React.FC<PromptModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    defaultValue = '',
    confirmText = "Submit", 
    cancelText = "Cancel"
}) => {
    const [inputValue, setInputValue] = useState(defaultValue);

    useEffect(() => {
        if (isOpen) {
            setInputValue(defaultValue);
        }
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(inputValue);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex justify-center items-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}/>
            <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-teal-100 text-teal-600">
                        <HelpCircle size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">{title}</h3>
                    <p className="text-sm font-bold text-slate-500 whitespace-pre-line leading-relaxed">
                        {message}
                    </p>
                </div>
                
                <form onSubmit={handleSubmit} className="mt-6">
                    <input 
                        type="text" 
                        value={inputValue} 
                        onChange={(e) => setInputValue(e.target.value)} 
                        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:border-teal-500 transition-colors"
                        autoFocus
                    />
                    
                    <div className="flex gap-3 mt-8">
                        <button 
                            type="button"
                            onClick={onClose} 
                            className="flex-1 py-4 bg-slate-100 text-slate-600 font-black uppercase text-xs rounded-2xl hover:bg-slate-200 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 py-4 bg-teal-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-teal-600/20 hover:bg-teal-700 transition-transform active:scale-95"
                        >
                            {confirmText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PromptModal;

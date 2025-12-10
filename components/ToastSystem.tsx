
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    addToast: (message: string, type: ToastType) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return {
        success: (msg: string) => context.addToast(msg, 'success'),
        error: (msg: string) => context.addToast(msg, 'error'),
        warning: (msg: string) => context.addToast(msg, 'warning'),
        info: (msg: string) => context.addToast(msg, 'info'),
    };
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (message: string, type: ToastType) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            removeToast(id);
        }, 4000);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            {/* TOAST CONTAINER */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div 
                        key={toast.id}
                        className={`
                            pointer-events-auto min-w-[300px] max-w-[400px] p-4 rounded-xl shadow-xl border flex items-start gap-3 transform transition-all duration-300 animate-in slide-in-from-right-full
                            ${toast.type === 'success' ? 'bg-white border-green-100 text-slate-800' : ''}
                            ${toast.type === 'error' ? 'bg-white border-red-100 text-slate-800' : ''}
                            ${toast.type === 'warning' ? 'bg-white border-amber-100 text-slate-800' : ''}
                            ${toast.type === 'info' ? 'bg-white border-blue-100 text-slate-800' : ''}
                        `}
                    >
                        {/* ICON */}
                        <div className={`shrink-0 mt-0.5
                            ${toast.type === 'success' ? 'text-green-500' : ''}
                            ${toast.type === 'error' ? 'text-red-500' : ''}
                            ${toast.type === 'warning' ? 'text-amber-500' : ''}
                            ${toast.type === 'info' ? 'text-blue-500' : ''}
                        `}>
                            {toast.type === 'success' && <CheckCircle size={20} fill="currentColor" className="text-white" />}
                            {toast.type === 'error' && <AlertCircle size={20} fill="currentColor" className="text-white" />}
                            {toast.type === 'warning' && <AlertTriangle size={20} fill="currentColor" className="text-white" />}
                            {toast.type === 'info' && <Info size={20} fill="currentColor" className="text-white" />}
                        </div>

                        <div className="flex-1">
                            <h4 className={`font-bold text-sm capitalize ${
                                toast.type === 'success' ? 'text-green-800' : 
                                toast.type === 'error' ? 'text-red-800' : 
                                toast.type === 'warning' ? 'text-amber-800' : 'text-blue-800'
                            }`}>{toast.type}</h4>
                            <p className="text-sm text-slate-600 font-medium leading-tight mt-0.5">{toast.message}</p>
                        </div>

                        <button onClick={() => removeToast(toast.id)} className="text-slate-300 hover:text-slate-500 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

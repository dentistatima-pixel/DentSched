import React, { createContext, useContext, useState, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    onAction?: () => void;
    actionLabel?: string;
}

interface ToastOptions {
    duration?: number;
    onAction?: () => void;
    actionLabel?: string;
}

interface ToastContextType {
    addToast: (message: string, type: ToastType, options?: ToastOptions) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return {
        success: (msg: string, options?: ToastOptions) => context.addToast(msg, 'success', options),
        error: (msg: string, options?: ToastOptions) => context.addToast(msg, 'error', options),
        warning: (msg: string, options?: ToastOptions) => context.addToast(msg, 'warning', options),
        info: (msg: string, options?: ToastOptions) => context.addToast(msg, 'info', options),
    };
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (message: string, type: ToastType, options: ToastOptions = {}) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type, onAction: options.onAction, actionLabel: options.actionLabel }]);
        
        const duration = options.duration || 4000;
        
        if (!options.onAction) { // Don't auto-dismiss toasts with actions
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const icons: Record<ToastType, React.ElementType> = {
        success: CheckCircle,
        error: AlertCircle,
        warning: AlertTriangle,
        info: Info,
    };
    const colors: Record<ToastType, string> = {
        success: 'bg-teal-500 border-teal-600',
        error: 'bg-red-500 border-red-600',
        warning: 'bg-amber-500 border-amber-600',
        info: 'bg-blue-500 border-blue-600',
    };

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            {/* TOAST CONTAINER */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => {
                    const Icon = icons[toast.type];
                    return (
                        <div 
                            key={toast.id}
                            className={`
                                pointer-events-auto min-w-[300px] max-w-[400px] p-4 rounded-xl shadow-2xl text-white
                                flex items-center gap-3 border-b-4
                                ${colors[toast.type]}
                                animate-in slide-in-from-top-4 fade-in duration-300
                            `}
                        >
                            <Icon size={20} className="mt-0.5 shrink-0" />
                            <p className="flex-1 text-sm font-bold leading-snug">{toast.message}</p>
                            {toast.onAction && toast.actionLabel && (
                                <button
                                    onClick={() => {
                                        toast.onAction?.();
                                        removeToast(toast.id);
                                    }}
                                    className="ml-2 font-black uppercase text-xs bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors"
                                >
                                    {toast.actionLabel}
                                </button>
                            )}
                            <button onClick={() => removeToast(toast.id)} className="p-1 -mr-1 -mt-1 rounded-full hover:bg-white/20 transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};
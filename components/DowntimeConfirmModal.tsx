import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { SystemStatus } from '../types';

interface DowntimeConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DowntimeConfirmModal: React.FC<DowntimeConfirmModalProps> = ({ isOpen, onClose }) => {
    const { setSystemStatus } = useAppContext();

    const confirmDowntime = () => {
        setSystemStatus(SystemStatus.DOWNTIME);
        onClose();
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="downtime-title">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border-4 border-amber-200 dark:border-amber-700 animate-in zoom-in-95">
                <div className="text-center">
                    <div className="w-20 h-20 bg-amber-200 dark:bg-amber-900/50 text-amber-950 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
                        <AlertTriangle size={40} />
                    </div>
                    <h2 id="downtime-title" className="text-2xl font-black uppercase text-slate-800 dark:text-slate-100 tracking-tight">Activate Emergency Protocol?</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-4">
                        Activating this mode will flag all new appointments as manual entries requiring later reconciliation. Only proceed if you are experiencing a network outage or system failure.
                    </p>
                </div>
                <div className="flex gap-4 mt-8">
                    <button onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-2xl font-black uppercase text-sm tracking-widest">Cancel</button>
                    <button onClick={confirmDowntime} className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-red-600/30">Confirm & Activate</button>
                </div>
            </div>
        </div>
    );
};

export default DowntimeConfirmModal;
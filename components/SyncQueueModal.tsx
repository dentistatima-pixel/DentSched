import React, { useState, useEffect } from 'react';
import { X, CloudOff, RefreshCcw, Trash2, AlertTriangle } from 'lucide-react';
import { SyncIntent } from '../types';
import { db } from '../services/db';
import { useToast } from './ToastSystem';

interface SyncQueueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onForceSync: () => void;
    isSyncing: boolean;
}

const SyncQueueModal: React.FC<SyncQueueModalProps> = ({ isOpen, onClose, onForceSync, isSyncing }) => {
    const [queue, setQueue] = useState<SyncIntent[]>([]);
    const toast = useToast();

    useEffect(() => {
        if (isOpen) {
            db.getAll<SyncIntent>('actionQueue').then(setQueue);
        }
    }, [isOpen]);

    const handleClearQueue = async () => {
        if (window.confirm("Are you sure you want to clear the sync queue? This will discard all unsaved offline changes and cannot be undone.")) {
            try {
                const items = await db.getAll<SyncIntent>('actionQueue');
                for (const item of items) {
                    await db.del('actionQueue', item.id);
                }
                setQueue([]);
                toast.success("Offline sync queue has been cleared.");
                window.location.reload(); // Reload to reflect discarded changes
            } catch (error) {
                toast.error("Failed to clear sync queue.");
                console.error(error);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-lilac-100 p-3 rounded-xl text-lilac-700"><CloudOff size={24} /></div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800">Offline Sync Queue</h2>
                            <p className="text-sm text-slate-500">{queue.length} item(s) pending synchronization.</p>
                        </div>
                    </div>
                    <button onClick={onClose}><X size={24} className="text-slate-500" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {queue.length > 0 ? queue.map(item => (
                        <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <p className="font-bold text-sm text-slate-800 uppercase tracking-tight">{item.action.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-slate-500 font-mono mt-1">ID: {item.id}</p>
                            <p className="text-xs text-slate-500 mt-1">Queued at: {new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                    )) : (
                        <div className="text-center p-12 text-slate-400 italic">
                            The sync queue is empty. All changes are saved to the cloud.
                        </div>
                    )}
                </div>

                <div className="p-6 border-t bg-slate-50/50 flex justify-between items-center">
                    <button onClick={handleClearQueue} className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-700 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-200 transition-colors">
                        <AlertTriangle size={16}/> Clear Queue
                    </button>
                    <button onClick={onForceSync} disabled={isSyncing || queue.length === 0} className="flex items-center gap-2 px-8 py-4 bg-teal-600 text-white rounded-xl font-black uppercase text-sm tracking-widest shadow-lg shadow-teal-600/20 disabled:opacity-50 disabled:grayscale">
                        <RefreshCcw size={18} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'Syncing...' : 'Force Sync Now'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SyncQueueModal;
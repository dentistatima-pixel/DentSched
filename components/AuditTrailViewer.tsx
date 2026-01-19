import React, { useState, useMemo, useCallback } from 'react';
import { AuditLogEntry } from '../types';
import { Fingerprint, Search, ShieldCheck, RefreshCw } from 'lucide-react';
import { useToast } from './ToastSystem';
import CryptoJS from 'crypto-js';

interface AuditTrailViewerProps {
    auditLog: AuditLogEntry[];
    auditLogVerified: boolean | null;
}

const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({ auditLog, auditLogVerified }) => {
    const toast = useToast();
    const [auditSearchTerm, setAuditSearchTerm] = useState('');
    const [isVerifyingLogs, setIsVerifyingLogs] = useState(false);

    const filteredAuditLog = useMemo(() => {
        if (!auditSearchTerm) return auditLog;
        return auditLog.filter(l => 
            l.details.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
            l.userName.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
            l.action.toLowerCase().includes(auditSearchTerm.toLowerCase())
        );
    }, [auditLog, auditSearchTerm]);

    const verifyIntegrityChain = useCallback(() => {
        setIsVerifyingLogs(true);
        setTimeout(() => {
            if (auditLog.length <= 1) {
                toast.success("Chain integrity verified (Genesis record).");
                setIsVerifyingLogs(false);
                return;
            }
            const logsSorted = [...auditLog].reverse();
            let isValid = true;
            for (let i = 1; i < logsSorted.length; i++) {
                const current = logsSorted[i];
                const prev = logsSorted[i-1];
                const payload = `${current.timestamp}|${current.userId}|${current.action}|${current.entityId}|${prev.hash}`;
                const expectedHash = CryptoJS.SHA256(payload).toString();
                if (current.hash !== expectedHash || current.previousHash !== prev.hash) {
                    isValid = false;
                    break;
                }
            }
            if (isValid) toast.success("Forensic chain verified. No tampering detected.");
            else toast.error("CHAIN BREACH: Log integrity violation detected.");
            setIsVerifyingLogs(false);
        }, 1500);
    }, [auditLog, toast]);
    
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Forensic Audit Trail</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Immutable session and data change logs</p></div>
                <div className="flex gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={18} />
                        <input type="text" placeholder="Search logs..." value={auditSearchTerm} onChange={e => setAuditSearchTerm(e.target.value)} className="bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-3 font-bold text-xs uppercase tracking-widest text-slate-800 outline-none focus:border-teal-500 shadow-sm w-64" />
                    </div>
                    <button onClick={verifyIntegrityChain} disabled={isVerifyingLogs} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 ${isVerifyingLogs ? 'bg-slate-100 text-slate-400' : 'bg-teal-600 text-white shadow-teal-600/30 hover:scale-105 active:scale-95'}`}>
                        {isVerifyingLogs ? <RefreshCw size={20} className="animate-spin"/> : <ShieldCheck size={20}/>} {isVerifyingLogs ? 'Validating Chain...' : 'Verify Chain Integrity'}
                    </button>
                </div>
            </div>
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                        <tr><th className="p-6 text-left">Timestamp</th><th className="p-6 text-left">Entity Action</th><th className="p-6 text-left">User</th><th className="p-6 text-left">Narrative</th><th className="p-6 text-right">Integrity</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredAuditLog.slice(0, 50).map(log => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-6"><div className="text-xs font-mono font-bold text-slate-500">{new Date(log.timestamp).toLocaleString()}</div>{log.isVerifiedTimestamp && <div className="text-[8px] font-black text-teal-600 uppercase mt-0.5 flex items-center gap-1"><ShieldCheck size={8}/> Trusted Clock</div>}</td>
                                <td className="p-6"><span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border ${log.action === 'LOGIN' ? 'bg-blue-50 text-blue-700 border-blue-100' : log.action === 'SECURITY_ALERT' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{log.action}</span></td>
                                <td className="p-6 font-black text-slate-800 text-xs uppercase tracking-tight">{log.userName}</td>
                                <td className="p-6"><p className="text-xs font-bold text-slate-600 leading-relaxed max-w-md">{log.details}</p></td>
                                <td className="p-6 text-right"><div className="flex justify-end gap-2" title={log.hash}><div className="bg-teal-50 text-teal-700 p-2 rounded-xl shadow-sm"><Fingerprint size={16}/></div></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredAuditLog.length === 0 && <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest italic">No matching logs identified in registry.</div>}
            </div>
        </div>
    );
};

export default AuditTrailViewer;

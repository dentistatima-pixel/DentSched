import React, { useState, useMemo, useCallback } from 'react';
import { AuditLogEntry, User } from '../types';
import { Fingerprint, Search, ShieldCheck, RefreshCw, AlertTriangle, User as UserIcon } from 'lucide-react';
import { useToast } from './ToastSystem';
import CryptoJS from 'crypto-js';
import { useStaff } from '../contexts/StaffContext';

interface AuditTrailViewerProps {
    auditLog: AuditLogEntry[];
    auditLogVerified?: boolean | null; // This might be used from a higher level check
}

const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({ auditLog, auditLogVerified }) => {
    const toast = useToast();
    const { staff } = useStaff();
    const [searchTerm, setSearchTerm] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    
    const uniqueUsers = useMemo(() => {
        const userMap = new Map<string, string>();
        auditLog.forEach(log => {
            if (!userMap.has(log.userId)) {
                userMap.set(log.userId, log.userName);
            }
        });
        return Array.from(userMap.entries()).map(([id, name]) => ({ id, name }));
    }, [auditLog]);

    const uniqueActions = useMemo(() => Array.from(new Set(auditLog.map(l => l.action))), [auditLog]);

    const filteredAuditLog = useMemo(() => {
        return [...auditLog]
            .reverse()
            .filter(l => 
                (searchTerm === '' || 
                 l.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 l.entityId.toLowerCase().includes(searchTerm.toLowerCase())) &&
                (userFilter === '' || l.userId === userFilter) &&
                (actionFilter === '' || l.action === actionFilter)
            );
    }, [auditLog, searchTerm, userFilter, actionFilter]);

    const verifyIntegrityChain = useCallback(() => {
        setIsVerifying(true);
        setTimeout(() => {
            if (auditLog.length <= 1) {
                toast.success("Chain integrity verified (Genesis record).");
                setIsVerifying(false);
                return;
            }
            let isValid = true;
            let breachIndex = -1;
            // Iterate backwards from the most recent entry
            for (let i = auditLog.length - 1; i > 0; i--) {
                const current = auditLog[i];
                const prev = auditLog[i-1];
                
                // Verify the link
                if (current.previousHash !== prev.hash) {
                    isValid = false;
                    breachIndex = i;
                    break;
                }
                
                // Verify the current entry's hash
                const payload = `${current.timestamp}|${current.userId}|${current.action}|${current.entityId}|${current.previousHash}`;
                const expectedHash = CryptoJS.SHA256(payload).toString();
                if (current.hash !== expectedHash) {
                    isValid = false;
                    breachIndex = i;
                    break;
                }
            }
            
            if (isValid) {
                toast.success("Forensic chain verified. No tampering detected.");
            } else {
                toast.error(`CHAIN BREACH: Log integrity violation detected at record #${breachIndex}.`);
            }
            setIsVerifying(false);
        }, 1500);
    }, [auditLog, toast]);
    
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Forensic Audit Trail</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Immutable session and data change logs</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={verifyIntegrityChain} disabled={isVerifying} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 ${isVerifying ? 'bg-slate-100 text-slate-400' : 'bg-teal-600 text-white shadow-teal-600/30 hover:scale-105 active:scale-95'}`}>
                        {isVerifying ? <RefreshCw size={20} className="animate-spin"/> : <ShieldCheck size={20}/>} {isVerifying ? 'Validating Chain...' : 'Verify Chain Integrity'}
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative group md:col-span-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={18} />
                    <input type="text" placeholder="Search narrative..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input pl-12" />
                </div>
                <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="input"><option value="">All Users</option>{uniqueUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="input"><option value="">All Actions</option>{uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}</select>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                        <tr>
                            <th className="p-6 text-left">Timestamp</th>
                            <th className="p-6 text-left">User</th>
                            <th className="p-6 text-left">Action</th>
                            <th className="p-6 text-left">Narrative</th>
                            <th className="p-6 text-right">Integrity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredAuditLog.slice(0, 100).map(log => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-6">
                                    <div className="text-xs font-mono font-bold text-slate-500">{new Date(log.timestamp).toLocaleString()}</div>
                                    {log.isVerifiedTimestamp && <div className="text-[8px] font-black text-teal-600 uppercase mt-0.5 flex items-center gap-1"><ShieldCheck size={8}/> Trusted Clock</div>}
                                </td>
                                <td className="p-6">
                                    <div className="font-black text-slate-800 text-xs uppercase tracking-tight">{log.userName}</div>
                                    {log.impersonatingUser && <div className="text-[9px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><UserIcon size={10}/> via {log.impersonatingUser.name}</div>}
                                </td>
                                <td className="p-6"><span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border ${log.action.includes('SECURITY') || log.action.includes('IMPERSONATE') ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{log.action}</span></td>
                                <td className="p-6"><p className="text-xs font-bold text-slate-600 leading-relaxed max-w-md">{log.details}</p></td>
                                <td className="p-6 text-right"><div className="flex justify-end gap-2" title={log.hash}><div className="bg-teal-50 text-teal-700 p-2 rounded-xl shadow-sm"><Fingerprint size={16}/></div></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredAuditLog.length === 0 && <div className="p-20 text-center text-slate-300 font-black uppercase tracking-[0.5em] italic">No matching logs identified.</div>}
            </div>
        </div>
    );
};

export default AuditTrailViewer;

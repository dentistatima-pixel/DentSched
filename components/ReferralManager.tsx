import React, { useState, useMemo } from 'react';
import { Patient, Referral, User as Staff } from '../types';
import { Send, Users, UserCheck, ChevronRight, Plus } from 'lucide-react';
import { formatDate } from '../constants';

interface ReferralManagerProps {
    patients: Patient[];
    referrals: Referral[];
    onSaveReferral: (referral: Referral) => void;
    staff: Staff[];
}

const ReferralManager: React.FC<ReferralManagerProps> = ({ patients, referrals, onSaveReferral, staff }) => {
    const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

    const incomingStats = useMemo(() => {
        const referredPatients = patients.filter(p => p.referredById);
        const sourceCounts: Record<string, number> = {};
        
        referredPatients.forEach(p => {
            if (p.referredById) {
                sourceCounts[p.referredById] = (sourceCounts[p.referredById] || 0) + 1;
            }
        });

        const topSources = Object.entries(sourceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id, count]) => ({
                referrer: patients.find(p => p.id === id),
                count
            }));

        return {
            totalReferred: referredPatients.length,
            topSources,
            recentReferrals: referredPatients.slice(-10).reverse()
        };
    }, [patients]);

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500 pb-24">
            <div className="flex items-center gap-4">
                <div className="bg-amber-600 p-4 rounded-3xl text-white shadow-xl"><Send size={36} /></div>
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">Referral Hub</h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Practice Growth &amp; Network Analytics</p>
                </div>
            </div>

            <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm self-start flex gap-2">
                <button 
                    onClick={() => setActiveTab('incoming')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'incoming' ? 'bg-teal-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-teal-600 border border-slate-200'}`}
                >
                    <Users size={14}/> Incoming
                </button>
                <button 
                    onClick={() => setActiveTab('outgoing')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'outgoing' ? 'bg-lilac-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-lilac-600 border border-slate-200'}`}
                >
                    <UserCheck size={14}/> Outgoing
                </button>
            </div>

            {activeTab === 'incoming' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Referred Patients</div>
                            <div className="text-5xl font-black text-teal-700">{incomingStats.totalReferred}</div>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Top Referral Sources</h4>
                             {incomingStats.topSources.map(({ referrer, count }) => (
                                <div key={referrer?.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <span className="text-sm font-bold text-slate-700">{referrer?.name}</span>
                                    <span className="font-black text-teal-700">{count}</span>
                                </div>
                             ))}
                        </div>
                    </div>
                    <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Recent Incoming Referrals</h4>
                        <div className="space-y-3">
                            {incomingStats.recentReferrals.map(p => {
                                const source = patients.find(s => s.id === p.referredById);
                                return (
                                    <div key={p.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                                        <div className="font-bold text-slate-800">{p.name}</div>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <span className="text-xs uppercase">from</span>
                                            <span className="font-bold text-teal-700">{source?.name || 'Unknown'}</span>
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'outgoing' && (
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Outgoing Specialist Referrals</h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-black tracking-widest">
                                <tr>
                                    <th className="p-3 text-left">Date</th>
                                    <th className="p-3 text-left">Patient</th>
                                    <th className="p-3 text-left">Referred To</th>
                                    <th className="p-3 text-left">Reason</th>
                                    <th className="p-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {referrals.map(r => {
                                    const patient = patients.find(p => p.id === r.patientId);
                                    return (
                                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-mono text-xs text-slate-500">{formatDate(r.date)}</td>
                                            <td className="p-4 font-bold text-slate-800">{patient?.name}</td>
                                            <td className="p-4 text-slate-600">{r.referredTo}</td>
                                            <td className="p-4 text-slate-600">{r.reason}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                                    r.status === 'Completed' ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default ReferralManager;
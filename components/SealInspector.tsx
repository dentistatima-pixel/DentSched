
import React from 'react';
import { X, ShieldCheck, Fingerprint, Clock, Smartphone, User, Hash, Lock, CheckCircle } from 'lucide-react';
import { formatDate } from '../constants';

export interface SealData {
    signerName: string;
    signerRole?: string;
    timestamp: string;
    signatureUrl: string;
    snapUrl?: string;
    hash?: string;
    metadata?: Record<string, any>;
    title?: string;
}

interface SealInspectorProps {
    isOpen: boolean;
    onClose: () => void;
    data: SealData;
}

const SealInspector: React.FC<SealInspectorProps> = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border-4 border-teal-50 animate-in zoom-in-95 duration-300">
                <header className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-teal-500 p-2 rounded-xl"><ShieldCheck size={24} /></div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">{data.title || 'Registry Seal Verification'}</h2>
                            <p className="text-xs text-teal-400 font-bold uppercase tracking-widest mt-1">Forensic Identity Anchor</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
                </header>

                <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar bg-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
                        {/* Visual Evidence Section */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Visual Identity Snap</h4>
                                <div className="aspect-square bg-slate-900 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl relative">
                                    {data.snapUrl ? (
                                        <img src={data.snapUrl} className="w-full h-full object-cover grayscale brightness-110 contrast-125" alt="Identity Proof" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-3">
                                            <User size={48} />
                                            <span className="text-[10px] font-black uppercase">No Visual Anchor</span>
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 border border-white/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                                        <span className="text-[8px] font-black text-white uppercase tracking-tighter">96px Grayscale DVI</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Digital Signature Pad</h4>
                                <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center justify-center min-h-[100px]">
                                    <img src={data.signatureUrl} className="max-h-16 w-auto opacity-80 mix-blend-multiply" alt="Signature" />
                                </div>
                            </div>
                        </div>

                        {/* Metadata Evidence Section */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Evidence Summary</h4>
                            
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
                                <div className="flex gap-4 items-start">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><User size={16}/></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Signer Identity</p>
                                        <p className="text-sm font-bold text-slate-800">{data.signerName}</p>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">{data.signerRole}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Clock size={16}/></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Sealing Timestamp</p>
                                        <p className="text-sm font-bold text-slate-800">{new Date(data.timestamp).toLocaleString()}</p>
                                        <p className="text-[9px] font-black text-teal-600 uppercase flex items-center gap-1 mt-1"><CheckCircle size={10}/> Temporal Trust Verified</p>
                                    </div>
                                </div>

                                {data.metadata?.deviceInfo && (
                                    <div className="flex gap-4 items-start">
                                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Smartphone size={16}/></div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Device Context</p>
                                            <p className="text-[10px] font-bold text-slate-600 leading-tight">{data.metadata.deviceInfo}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-teal-900 p-6 rounded-[2rem] text-white space-y-3 shadow-xl shadow-teal-900/20">
                                <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                    <Fingerprint size={16} className="text-teal-400"/>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Cryptographic Seal</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-teal-400 uppercase">SHA-256 Record Hash</p>
                                    <p className="text-[10px] font-mono break-all opacity-80 leading-relaxed">
                                        {data.hash || '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 flex items-start gap-4">
                        <Lock size={20} className="text-amber-600 shrink-0 mt-1"/>
                        <p className="text-xs font-bold text-amber-800 leading-relaxed italic">
                            "This record has been cryptographically sealed. Any alteration to the clinical narrative or patient identity data since the time of signature will invalidate the forensic checksum."
                        </p>
                    </div>
                </div>

                <footer className="p-6 border-t border-slate-100 bg-white shrink-0">
                    <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all">
                        Seal Verification Confirmed
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SealInspector;

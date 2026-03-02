import React from 'react';
import { Check, Calendar, Clock } from 'lucide-react';

const LogoShowcase: React.FC = () => {
    return (
        <div className="p-10 space-y-12 bg-slate-50 min-h-screen animate-in fade-in duration-500">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Logo Concepts</h3>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">Modern, Flat, and Scalable Designs for DentSched.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Concept 1: The Integrated Check */}
                    <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center justify-center space-y-8 group hover:scale-[1.02] transition-transform">
                        <div className="w-32 h-32 relative">
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                <path 
                                    d="M20,30 Q20,10 50,10 Q80,10 80,30 Q80,60 50,90 Q20,60 20,30" 
                                    fill="none" 
                                    stroke="#0f172a" 
                                    strokeWidth="8" 
                                    strokeLinecap="round"
                                />
                                <path 
                                    d="M40,50 L50,60 L75,35" 
                                    fill="none" 
                                    stroke="#10b981" 
                                    strokeWidth="10" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                                <span className="text-slate-900">Dent</span>
                                <span className="text-slate-400 font-medium">Sched</span>
                            </h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">The Integrated Check</p>
                        </div>
                    </div>

                    {/* Concept 2: The Calendar Crown */}
                    <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center justify-center space-y-8 group hover:scale-[1.02] transition-transform">
                        <div className="w-32 h-32 relative">
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                {/* Tooth Base */}
                                <path 
                                    d="M30,50 Q30,90 50,90 Q70,90 70,50" 
                                    fill="none" 
                                    stroke="#0f172a" 
                                    strokeWidth="8" 
                                    strokeLinecap="round"
                                />
                                {/* Calendar Grid Top */}
                                <rect x="25" y="15" width="50" height="35" rx="6" fill="#0f172a" />
                                <circle cx="35" cy="25" r="2" fill="white" />
                                <circle cx="50" cy="25" r="2" fill="white" />
                                <circle cx="65" cy="25" r="2" fill="white" />
                                <circle cx="35" cy="35" r="2" fill="white" />
                                <circle cx="50" cy="35" r="2" fill="white" />
                                <circle cx="65" cy="35" r="2" fill="white" />
                                {/* Accent Check */}
                                <path 
                                    d="M75,10 L85,20 L100,5" 
                                    fill="none" 
                                    stroke="#10b981" 
                                    strokeWidth="6" 
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                                <span className="text-slate-900">Dent</span>
                                <span className="text-emerald-500 font-medium">Sched</span>
                            </h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">The Calendar Crown</p>
                        </div>
                    </div>

                    {/* Concept 3: The Modern Monogram */}
                    <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center justify-center space-y-8 group hover:scale-[1.02] transition-transform">
                        <div className="w-32 h-32 relative">
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                <path 
                                    d="M30,20 L30,80 Q30,80 40,80 L60,80 Q80,80 80,50 Q80,20 60,20 L40,20" 
                                    fill="none" 
                                    stroke="#0f172a" 
                                    strokeWidth="10" 
                                    strokeLinecap="round"
                                />
                                <path 
                                    d="M20,50 L45,50" 
                                    fill="none" 
                                    stroke="#10b981" 
                                    strokeWidth="10" 
                                    strokeLinecap="round"
                                />
                                <circle cx="30" cy="20" r="5" fill="#10b981" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                                <span className="text-slate-900">DENT</span>
                                <span className="text-slate-900 font-light">SCHED</span>
                            </h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">The Modern Monogram</p>
                        </div>
                    </div>

                    {/* Concept 4: The Negative Space Clock */}
                    <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center justify-center space-y-8 group hover:scale-[1.02] transition-transform">
                        <div className="w-32 h-32 relative">
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                <path 
                                    d="M50,10 Q85,10 85,45 Q85,80 50,90 Q15,80 15,45 Q15,10 50,10" 
                                    fill="#0f172a"
                                />
                                <circle cx="50" cy="40" r="20" fill="white" />
                                <path 
                                    d="M50,40 L50,30 M50,40 L60,40" 
                                    fill="none" 
                                    stroke="#10b981" 
                                    strokeWidth="4" 
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                                <span className="text-emerald-600">Dent</span>
                                <span className="text-slate-900">Sched</span>
                            </h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">The Negative Space Clock</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 text-white p-10 rounded-[3rem] space-y-4">
                    <h5 className="text-lg font-bold">Why these work:</h5>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
                        <li className="flex gap-3"><Check className="text-emerald-500 shrink-0" size={18}/> <strong>Scalability:</strong> Bold lines and simple shapes work at any size.</li>
                        <li className="flex gap-3"><Check className="text-emerald-500 shrink-0" size={18}/> <strong>Modernity:</strong> Flat design feels premium and high-tech.</li>
                        <li className="flex gap-3"><Check className="text-emerald-500 shrink-0" size={18}/> <strong>Clarity:</strong> One clear concept per logo (Check, Calendar, or Clock).</li>
                        <li className="flex gap-3"><Check className="text-emerald-500 shrink-0" size={18}/> <strong>Professionalism:</strong> Navy and Emerald are the "Gold Standard" for health-tech.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default LogoShowcase;

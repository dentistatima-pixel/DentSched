import React from 'react';
import { Printer, Wrench } from 'lucide-react';

const PrintoutsHub: React.FC = () => {
    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Printouts & Reports Hub</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">Configure templates for printed documents.</p>
            </div>
            <div className="bg-white p-20 rounded-[2.5rem] border-2 border-dashed border-slate-200 shadow-sm text-center flex flex-col items-center justify-center min-h-[400px]">
                 <div className="relative mb-8">
                    <Printer size={64} className="mx-auto text-slate-300" strokeWidth={1.5}/>
                    <div className="absolute -bottom-2 -right-2 bg-slate-800 text-white p-2 rounded-full border-4 border-white">
                        <Wrench size={20}/>
                    </div>
                 </div>
                 <h4 className="text-xl font-black text-slate-500 uppercase tracking-tight">Report Customization Engine</h4>
                 <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
                    This module is reserved for a future update that will allow administrators to customize the layout and content of official receipts, medical certificates, and other printable documents.
                 </p>
            </div>
        </div>
    );
};

export default PrintoutsHub;

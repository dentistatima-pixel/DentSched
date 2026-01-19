import React from 'react';
import { Printer } from 'lucide-react';

const PrintoutsHub: React.FC = () => {
    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Printouts & Reports Hub</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Configure templates for printed documents.</p>
            </div>
            <div className="bg-white p-20 rounded-[2rem] border border-slate-200 shadow-sm text-center">
                 <Printer size={48} className="mx-auto text-slate-300 mb-4" />
                 <h4 className="font-bold text-slate-500">Report Customization</h4>
                 <p className="text-sm text-slate-400">This module is under development.</p>
            </div>
        </div>
    );
};

export default PrintoutsHub;

import React from 'react';
import { ShieldOff } from 'lucide-react';

/**
 * DEPRECATED: Patient Portal is disabled. 
 * Patient access is strictly via Kiosk Mode in the physical clinic.
 * Data subject requests are fulfilled mediated by staff in PatientList.
 */
const PatientPortal: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md text-center">
                <ShieldOff size={80} className="text-red-500 mx-auto mb-6" />
                <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Access Restricted</h1>
                <p className="text-slate-500 mt-4 leading-relaxed">
                    dentsched patient portal access is restricted to the clinic physical terminal only. Remote viewing of clinical records is disabled for your protection.
                </p>
                <div className="mt-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    Security Protocol V1.2 Active
                </div>
            </div>
        </div>
    );
};

export default PatientPortal;
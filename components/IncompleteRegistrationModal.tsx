
import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

interface IncompleteRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    missingItems: string[];
    riskLevel: 'Low' | 'Medium' | 'High';
}

const IncompleteRegistrationModal: React.FC<IncompleteRegistrationModalProps> = ({ isOpen, onClose, missingItems, riskLevel }) => {
    if (!isOpen) return null;

    const riskConfig = {
        Low: { color: 'amber', icon: AlertTriangle, headerBg: 'bg-amber-50', headerBorder: 'border-amber-100', headerText: 'text-amber-900', subText: 'text-amber-700', button: 'bg-amber-600' },
        Medium: { color: 'orange', icon: AlertTriangle, headerBg: 'bg-orange-50', headerBorder: 'border-orange-100', headerText: 'text-orange-900', subText: 'text-orange-700', button: 'bg-orange-600' },
        High: { color: 'red', icon: ShieldAlert, headerBg: 'bg-red-50', headerBorder: 'border-red-100', headerText: 'text-red-900', subText: 'text-red-700', button: 'bg-red-600' },
    };
    const config = riskConfig[riskLevel] || riskConfig.Low;
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
            <div className={`bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col border-4 border-${config.color}-200 animate-in zoom-in-95`}>
                <div className={`p-6 border-b ${config.headerBorder} ${config.headerBg} flex items-center gap-4`}>
                    <Icon size={28} className={`text-${config.color}-600`} />
                    <div>
                        <h2 className={`text-xl font-black ${config.headerText} uppercase tracking-tight`}>Incomplete Record ({riskLevel} Risk)</h2>
                        <p className={`text-xs ${config.subText} font-bold uppercase`}>Treatment Cannot Proceed</p>
                    </div>
                </div>
                <div className="p-8 space-y-4">
                    <p className="text-sm font-bold text-slate-700">The following critical items are missing from the patient's record:</p>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 font-medium bg-slate-50 p-4 rounded-xl border border-slate-200">
                        {missingItems.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                    <p className="text-xs text-slate-500 italic">For patient safety and medico-legal compliance, these must be completed before treatment can begin.</p>
                </div>
                <div className="p-4 border-t bg-white flex justify-end gap-3">
                    <button onClick={onClose} className={`w-full py-4 ${config.button} text-white rounded-xl font-bold uppercase tracking-widest text-sm`}>
                        Acknowledge & Return
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncompleteRegistrationModal;

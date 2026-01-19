import React from 'react';
import { FieldSettings } from '../types';
import { Smartphone, Cloud, Server, MessageSquare } from 'lucide-react';
import { useToast } from './ToastSystem';

interface SmsHubProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
}

const SmsHub: React.FC<SmsHubProps> = ({ settings, onUpdateSettings }) => {
    const toast = useToast();
    
    const handleSmsTest = async () => {
        const smsCfg = settings.smsConfig;
        const url = smsCfg.mode === 'LOCAL' ? smsCfg.gatewayUrl : smsCfg.cloudUrl;
        if (!url) { toast.error("Gateway URL missing."); return; }

        toast.info(`Triggering ${smsCfg.mode} Pulse Test...`);
        try {
            const payload = smsCfg.mode === 'LOCAL' 
                ? { to: '09170000000', message: "DENTSCHED_GATEWAY_TEST: Local SIM connection operational.", key: smsCfg.apiKey }
                : { username: smsCfg.username, password: smsCfg.password, device_id: smsCfg.deviceId, to: '09170000000', message: "DENTSCHED_GATEWAY_TEST: Cloud Gateway pulse operational." };

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) toast.success(`Pulse Test Confirmed via ${smsCfg.mode}.`);
            else toast.error("Gateway rejected request. Verify credentials.");
        } catch (e) {
            toast.error("Gateway failure. Check server status.");
        }
    };
    
    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">SMS & Communications Hub</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Multi-Channel SIM Gateway Configuration</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
                    <button 
                        onClick={() => onUpdateSettings({...settings, smsConfig: {...settings.smsConfig, mode: 'LOCAL'}})}
                        className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${settings.smsConfig.mode === 'LOCAL' ? 'bg-white text-teal-800 shadow-lg' : 'text-slate-400 hover:text-teal-600'}`}
                    >
                        <Server size={14}/> Local Server
                    </button>
                    <button 
                        onClick={() => onUpdateSettings({...settings, smsConfig: {...settings.smsConfig, mode: 'CLOUD'}})}
                        className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${settings.smsConfig.mode === 'CLOUD' ? 'bg-white text-lilac-800 shadow-lg' : 'text-slate-400 hover:text-lilac-600'}`}
                    >
                        <Cloud size={14}/> Cloud Server
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={`bg-white p-8 rounded-[3rem] border-4 shadow-2xl space-y-6 transition-all duration-500 ${settings.smsConfig.mode === 'LOCAL' ? 'border-teal-500 scale-105' : 'border-slate-100 opacity-60 scale-95 pointer-events-none'}`}>
                    {/* ... Local Server Settings ... */}
                </div>

                <div className={`bg-white p-8 rounded-[3rem] border-4 shadow-2xl space-y-6 transition-all duration-500 ${settings.smsConfig.mode === 'CLOUD' ? 'border-lilac-500 scale-105' : 'border-slate-100 opacity-60 scale-95 pointer-events-none'}`}>
                    {/* ... Cloud Server Settings ... */}
                </div>

                <div className="col-span-full bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-8">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="p-2 bg-slate-50 text-slate-500 rounded-xl"><MessageSquare size={24}/></div>
                        <h4 className="font-black text-slate-800 uppercase text-sm">Automated Operational Narratives</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(settings.smsTemplates).map(([key, config]: [string, any]) => (
                            <div key={key} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-teal-500 transition-all group">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-teal-700 tracking-widest">{config.label}</span>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{config.triggerDescription}</p>
                                    </div>
                                    <button onClick={() => onUpdateSettings({...settings, smsTemplates: {...settings.smsTemplates, [key]: {...config, enabled: !config.enabled}}})} className={`w-10 h-5 rounded-full p-1 transition-colors flex items-center ${config.enabled ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'}`}><div className="w-3 h-3 bg-white rounded-full"/></button>
                                </div>
                                <textarea 
                                    value={config.text} 
                                    onChange={e => onUpdateSettings({...settings, smsTemplates: {...settings.smsTemplates, [key]: {...config, text: e.target.value}}})}
                                    className="w-full p-3 text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-2xl outline-none h-20 focus:border-teal-500 shadow-inner"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmsHub;

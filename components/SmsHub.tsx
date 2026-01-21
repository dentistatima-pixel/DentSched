
import React from 'react';
import { FieldSettings, SmsTemplates, SmsTemplateConfig } from '../types';
import { Smartphone, Cloud, Server, MessageSquare, Save, Zap } from 'lucide-react';
import { useToast } from './ToastSystem';

interface SmsHubProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
}

const SmsHub: React.FC<SmsHubProps> = ({ settings, onUpdateSettings }) => {
    const toast = useToast();
    const { smsConfig, smsTemplates } = settings;

    const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateSettings({ ...settings, smsConfig: { ...smsConfig, [e.target.name]: e.target.value } });
    };

    const handleTemplateChange = (id: string, field: keyof SmsTemplateConfig, value: any) => {
        const newTemplates = { ...smsTemplates, [id]: { ...smsTemplates[id], [field]: value } };
        onUpdateSettings({ ...settings, smsTemplates: newTemplates });
    };

    const handleSave = () => {
        toast.success("SMS configuration saved.");
    };

    return (
        <div className="p-10 space-y-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">SMS & Comms Hub</h3>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">Multi-Channel SIM Gateway Configuration</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
                    <button 
                        onClick={() => onUpdateSettings({...settings, smsConfig: {...smsConfig, mode: 'LOCAL'}})}
                        className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${smsConfig.mode === 'LOCAL' ? 'bg-white text-teal-800 shadow-lg' : 'text-slate-400 hover:text-teal-600'}`}>
                        <Server size={14}/> Local Server
                    </button>
                    <button 
                        onClick={() => onUpdateSettings({...settings, smsConfig: {...smsConfig, mode: 'CLOUD'}})}
                        className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${smsConfig.mode === 'CLOUD' ? 'bg-white text-lilac-800 shadow-lg' : 'text-slate-400 hover:text-lilac-600'}`}>
                        <Cloud size={14}/> Cloud Server
                    </button>
                </div>
            </div>
            
            {/* Config Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Local Server Config */}
                <div className={`bg-white p-8 rounded-[3rem] border-4 shadow-2xl space-y-6 transition-all duration-500 ${smsConfig.mode === 'LOCAL' ? 'border-teal-500 scale-105' : 'border-slate-100 opacity-60 scale-95 pointer-events-none'}`}>
                    <h4 className="label text-teal-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2"><Server size={16}/>Local Server (SIM Gateway)</h4>
                    <div><label className="label text-xs">Gateway URL</label><input type="text" name="gatewayUrl" value={smsConfig.gatewayUrl} onChange={handleConfigChange} className="input"/></div>
                    <div><label className="label text-xs">API Key</label><input type="text" name="apiKey" value={smsConfig.apiKey} onChange={handleConfigChange} className="input"/></div>
                </div>

                {/* Cloud Server Config */}
                <div className={`bg-white p-8 rounded-[3rem] border-4 shadow-2xl space-y-6 transition-all duration-500 ${smsConfig.mode === 'CLOUD' ? 'border-lilac-500 scale-105' : 'border-slate-100 opacity-60 scale-95 pointer-events-none'}`}>
                    <h4 className="label text-lilac-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2"><Cloud size={16}/>Cloud Server (API Provider)</h4>
                    <div><label className="label text-xs">API Endpoint URL</label><input type="text" name="cloudUrl" value={smsConfig.cloudUrl || ''} onChange={handleConfigChange} className="input"/></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="label text-xs">API Username</label><input type="text" name="username" value={smsConfig.username || ''} onChange={handleConfigChange} className="input"/></div>
                        <div><label className="label text-xs">API Password</label><input type="password" name="password" value={smsConfig.password || ''} onChange={handleConfigChange} className="input"/></div>
                    </div>
                </div>

                {/* Templates Section */}
                <div className="md:col-span-2 bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-8">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="p-2 bg-slate-50 text-slate-500 rounded-xl"><MessageSquare size={24}/></div>
                        <h4 className="font-black text-slate-800 uppercase text-sm">Automated Operational Narratives</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Fix: Add explicit type annotation for config to resolve property access errors. */}
                        {Object.entries(smsTemplates).map(([key, config]: [string, SmsTemplateConfig]) => (
                            <div key={key} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-teal-500 transition-all group">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-teal-700 tracking-widest">{config.label}</span>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{config.triggerDescription}</p>
                                    </div>
                                    <button onClick={() => handleTemplateChange(key, 'enabled', !config.enabled)} className={`w-10 h-5 rounded-full p-1 transition-colors flex items-center ${config.enabled ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'}`}><div className="w-3 h-3 bg-white rounded-full"/></button>
                                </div>
                                <textarea 
                                    value={config.text} 
                                    onChange={e => handleTemplateChange(key, 'text', e.target.value)}
                                    className="w-full p-3 text-xs font-mono text-slate-600 bg-white border border-slate-200 rounded-2xl outline-none h-24 focus:border-teal-500 shadow-inner"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
             <div className="pt-8 flex justify-end gap-4">
                <button onClick={() => toast.info("Pulse test sent.")} className="bg-white text-teal-800 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest border-2 border-slate-200 flex items-center gap-3">
                    <Zap size={16} />
                    Pulse Test
                </button>
                <button onClick={handleSave} className="bg-teal-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-600/30 flex items-center gap-3">
                    <Save size={16} />
                    Save Configuration
                </button>
            </div>
        </div>
    );
};

export default SmsHub;

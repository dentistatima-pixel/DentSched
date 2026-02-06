
import React, { useState, useEffect } from 'react';
import { FieldSettings, SmsTemplates, SmsTemplateConfig } from '../types';
import { Smartphone, Cloud, Server, MessageSquare, Save, Zap, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useToast } from './ToastSystem';
import { PDA_FORBIDDEN_COMMERCIAL_TERMS } from '../constants';

interface SmsHubProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
}

const SmsHub: React.FC<SmsHubProps> = ({ settings, onUpdateSettings }) => {
    const toast = useToast();
    const { smsConfig, smsTemplates, clinicName } = settings;
    const [isLocalPasswordVisible, setIsLocalPasswordVisible] = useState(false);
    const [isCloudPasswordVisible, setIsCloudPasswordVisible] = useState(false);

    // Local state to prevent focus loss during typing
    const [localConfig, setLocalConfig] = useState(smsConfig);
    const [localTemplates, setLocalTemplates] = useState(smsTemplates);

    // Sync local state when external settings change (e.g. from DB)
    useEffect(() => {
        setLocalConfig(smsConfig);
        setLocalTemplates(smsTemplates);
    }, [smsConfig, smsTemplates]);

    const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setLocalConfig(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleTemplateChange = (id: string, field: keyof SmsTemplateConfig, value: any) => {
        let valueToSave = value;
        if (field === 'text' && clinicName) {
            const escapedClinicName = clinicName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            valueToSave = value.replace(new RegExp(escapedClinicName, 'g'), '{ClinicName}');
        }
        setLocalTemplates(prev => ({ 
            ...prev, 
            [id]: { ...prev[id], [field]: valueToSave } 
        }));
    };

    const hasViolations = Object.values(localTemplates).some(config => 
        PDA_FORBIDDEN_COMMERCIAL_TERMS.some(term => (config as SmsTemplateConfig).text.toLowerCase().includes(term))
    );

    const handleSave = () => {
        if (hasViolations) {
            toast.error("Cannot save: One or more templates violate PDA advertising rules.");
            return;
        }
        onUpdateSettings({
            ...settings,
            smsConfig: localConfig,
            smsTemplates: localTemplates
        });
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
                        onClick={() => { setLocalConfig({...localConfig, mode: 'LOCAL'}); onUpdateSettings({...settings, smsConfig: {...localConfig, mode: 'LOCAL'}}); }}
                        className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${localConfig.mode === 'LOCAL' ? 'bg-white text-teal-800 shadow-lg' : 'text-slate-400 hover:text-teal-600'}`}>
                        <Server size={14}/> Local Server
                    </button>
                    <button 
                        onClick={() => { setLocalConfig({...localConfig, mode: 'CLOUD'}); onUpdateSettings({...settings, smsConfig: {...localConfig, mode: 'CLOUD'}}); }}
                        className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${localConfig.mode === 'CLOUD' ? 'bg-white text-lilac-800 shadow-lg' : 'text-slate-400 hover:text-lilac-600'}`}>
                        <Cloud size={14}/> Cloud Server
                    </button>
                </div>
            </div>
            
             <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-bold text-amber-800">SMS Preview Mode</h3>
                        <div className="mt-2 text-sm text-amber-700">
                            <p>The SMS gateway is not connected. All SMS actions are simulated and logged for now. No messages will be sent to patients.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Config Sections */}
            <div className="grid grid-cols-1 gap-8">
                {/* Local Server Config */}
                <div className={`bg-white p-8 rounded-[3rem] border-4 shadow-2xl space-y-6 transition-all duration-500 ${localConfig.mode === 'LOCAL' ? 'border-teal-500' : 'border-slate-100 opacity-50 scale-95 pointer-events-none'}`}>
                    <h4 className="label text-teal-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2"><Server size={16}/>Local Server (SIM Gateway)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="label text-xs">Local address</label><input type="text" name="gatewayUrl" value={localConfig.gatewayUrl} onChange={handleConfigChange} onBlur={handleSave} className="input"/></div>
                        <div><label className="label text-xs">Public address</label><input type="text" name="publicAddress" value={localConfig.publicAddress || ''} onChange={handleConfigChange} onBlur={handleSave} className="input"/></div>
                        <div><label className="label text-xs">Username</label><input type="text" name="local_username" value={localConfig.local_username || ''} onChange={handleConfigChange} onBlur={handleSave} className="input"/></div>
                        <div>
                            <label className="label text-xs">Password</label>
                            <div className="relative">
                                <input 
                                    type={isLocalPasswordVisible ? "text" : "password"} 
                                    name="local_password" 
                                    value={localConfig.local_password || ''} 
                                    onChange={handleConfigChange} 
                                    onBlur={handleSave}
                                    className="input pr-12"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setIsLocalPasswordVisible(!isLocalPasswordVisible)} 
                                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-600"
                                    aria-label={isLocalPasswordVisible ? "Hide password" : "Show password"}
                                >
                                    {isLocalPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        <div className="col-span-2"><label className="label text-xs">Device ID</label><input type="text" name="local_deviceId" value={localConfig.local_deviceId || ''} onChange={handleConfigChange} onBlur={handleSave} className="input"/></div>
                    </div>
                </div>

                {/* Cloud Server Config */}
                <div className={`bg-white p-8 rounded-[3rem] border-4 shadow-2xl space-y-6 transition-all duration-500 ${localConfig.mode === 'CLOUD' ? 'border-lilac-500' : 'border-slate-100 opacity-50 scale-95 pointer-events-none'}`}>
                    <h4 className="label text-lilac-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2"><Cloud size={16}/>Cloud Server (API Provider)</h4>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><label className="label text-xs">Server address</label><input type="text" name="cloudUrl" value={localConfig.cloudUrl || ''} onChange={handleConfigChange} onBlur={handleSave} className="input"/></div>
                        <div><label className="label text-xs">Username</label><input type="text" name="cloud_username" value={localConfig.cloud_username || ''} onChange={handleConfigChange} onBlur={handleSave} className="input"/></div>
                        <div>
                            <label className="label text-xs">Password</label>
                            <div className="relative">
                                <input 
                                    type={isCloudPasswordVisible ? "text" : "password"} 
                                    name="cloud_password" 
                                    value={localConfig.cloud_password || ''} 
                                    onChange={handleConfigChange} 
                                    onBlur={handleSave}
                                    className="input pr-12"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setIsCloudPasswordVisible(!isCloudPasswordVisible)} 
                                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-600"
                                    aria-label={isCloudPasswordVisible ? "Hide password" : "Show password"}
                                >
                                    {isCloudPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        <div className="col-span-2"><label className="label text-xs">Device ID</label><input type="text" name="cloud_deviceId" value={localConfig.cloud_deviceId || ''} onChange={handleConfigChange} onBlur={handleSave} className="input"/></div>
                    </div>
                </div>

                {/* Templates Section */}
                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-8">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="p-2 bg-slate-50 text-slate-500 rounded-xl"><MessageSquare size={24}/></div>
                        <h4 className="font-black text-slate-800 uppercase text-sm">Automated Operational Narratives</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        {Object.entries(localTemplates).map(([key, config]: [string, SmsTemplateConfig]) => {
                            const forbiddenTerm = PDA_FORBIDDEN_COMMERCIAL_TERMS.find(term => (config as SmsTemplateConfig).text.toLowerCase().includes(term));
                            const displayText = (config as SmsTemplateConfig).text.replace(/{ClinicName}/g, clinicName);
                            return (
                                <div key={key} className={`p-5 rounded-3xl border transition-all group ${forbiddenTerm ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-100 hover:border-teal-500'}`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${forbiddenTerm ? 'text-red-800' : 'text-teal-700'}`}>{config.label}</span>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{config.triggerDescription}</p>
                                        </div>
                                        <button onClick={() => { handleTemplateChange(key, 'enabled', !config.enabled); handleSave(); }} className={`w-10 h-5 rounded-full p-1 transition-colors flex items-center ${config.enabled ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'}`}><div className="w-3 h-3 bg-white rounded-full"/></button>
                                    </div>
                                    <textarea 
                                        value={displayText} 
                                        onChange={e => handleTemplateChange(key, 'text', e.target.value)}
                                        onBlur={handleSave}
                                        className={`w-full p-3 text-xs font-mono text-slate-600 bg-white border rounded-2xl outline-none h-24 shadow-inner ${forbiddenTerm ? 'border-red-300' : 'border-slate-200 focus:border-teal-500'}`}
                                    />
                                    {forbiddenTerm && (
                                        <div className="mt-2 p-3 bg-red-100/50 border border-red-200 rounded-xl text-xs text-red-800 font-bold flex items-center gap-2">
                                            <AlertTriangle size={14} /> PDA RULE 15 VIOLATION: The term "{forbiddenTerm}" is prohibited.
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            {/* Polling Toggle */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
                <label htmlFor="startOnBoot" className="font-black text-slate-800 uppercase text-sm cursor-pointer">Start on Boot</label>
                <div className="relative">
                    <input 
                        type="checkbox" 
                        id="startOnBoot"
                        name="isPollingEnabled"
                        checked={localConfig.isPollingEnabled}
                        onChange={(e) => { handleConfigChange(e); handleSave(); }}
                        className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-slate-200 rounded-full peer-checked:bg-teal-600 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                </div>
            </div>

             <div className="pt-8 flex justify-between items-center">
                <div className="px-8 py-4 bg-teal-100 text-teal-800 rounded-2xl font-black uppercase text-xs tracking-widest border-2 border-teal-200">
                    Status: ONLINE
                </div>
                <div className="flex gap-4">
                    <button onClick={() => toast.info("Pulse test sent.")} className="bg-white text-teal-800 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest border-2 border-slate-200 flex items-center gap-3">
                        <Zap size={16} />
                        Pulse Test
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={hasViolations}
                        className="bg-teal-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-600/30 flex items-center gap-3 disabled:bg-slate-300 disabled:shadow-none disabled:grayscale"
                    >
                        <Save size={16} />
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SmsHub;

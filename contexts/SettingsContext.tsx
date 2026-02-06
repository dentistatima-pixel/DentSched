
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { FieldSettings, ScheduledSms } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { useToast } from '../components/ToastSystem';
import { DataService } from '../services/dataService';

interface SettingsContextType {
    fieldSettings: FieldSettings;
    setFieldSettings: React.Dispatch<React.SetStateAction<FieldSettings>>;
    isLoading: boolean;
    scheduledSms: ScheduledSms[];
    addScheduledSms: (sms: Omit<ScheduledSms, 'id' | 'status'>) => void;
    handleUpdateSettings: (newSettings: FieldSettings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    const [fieldSettings, setFieldSettings] = useState<FieldSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [scheduledSms, setScheduledSms] = useState<ScheduledSms[]>([]);

    useEffect(() => {
        setIsLoading(true);
        DataService.getSettings().then(setFieldSettings).catch(err => {
            toast.error("Failed to load practice settings.");
            console.error(err);
        }).finally(() => setIsLoading(false));
    }, [toast]);

    const handleUpdateSettings = async (newSettings: FieldSettings) => {
        try {
            const updatedSettings = await DataService.saveSettings(newSettings);
            setFieldSettings(updatedSettings);
            toast.success("Settings updated successfully.");
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast.error("Could not save settings.");
        }
    };
    
    const addScheduledSms = (sms: Omit<ScheduledSms, 'id' | 'status'>) => {
        const newSms: ScheduledSms = {
            id: `sms_${Date.now()}`,
            status: 'Pending',
            ...sms
        };
        setScheduledSms(prev => [...prev, newSms]);
    };

    const value = { fieldSettings, setFieldSettings, isLoading, scheduledSms, addScheduledSms, handleUpdateSettings };
    
    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
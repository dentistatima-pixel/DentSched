
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { FieldSettings, ScheduledSms } from '../types';
// Fix: Corrected import name from DEFAULT_FIELD_SETTINGS to DEFAULT_SETTINGS.
import { DEFAULT_SETTINGS } from '../constants';
import { useToast } from '../components/ToastSystem';
import { DataService } from '../services/dataService';

interface SettingsContextType {
    fieldSettings: FieldSettings;
    setFieldSettings: React.Dispatch<React.SetStateAction<FieldSettings>>;
    scheduledSms: ScheduledSms[];
    addScheduledSms: (sms: Omit<ScheduledSms, 'id' | 'status'>) => void;
    handleUpdateSettings: (newSettings: FieldSettings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    // Fix: Used corrected import name DEFAULT_SETTINGS.
    const [fieldSettings, setFieldSettings] = useState<FieldSettings>(DEFAULT_SETTINGS);
    const [scheduledSms, setScheduledSms] = useState<ScheduledSms[]>([]);

    useEffect(() => {
        DataService.getSettings().then(setFieldSettings).catch(err => {
            toast.error("Failed to load practice settings.");
            console.error(err);
        });
    }, []);

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

    const value = { fieldSettings, setFieldSettings, scheduledSms, addScheduledSms, handleUpdateSettings };
    
    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
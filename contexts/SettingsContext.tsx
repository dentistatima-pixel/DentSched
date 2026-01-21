
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FieldSettings, ScheduledSms } from '../types';
import { DEFAULT_FIELD_SETTINGS } from '../constants';
import { useToast } from '../components/ToastSystem';

interface SettingsContextType {
    fieldSettings: FieldSettings;
    setFieldSettings: React.Dispatch<React.SetStateAction<FieldSettings>>;
    scheduledSms: ScheduledSms[];
    handleUpdateSettings: (newSettings: FieldSettings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    const [fieldSettings, setFieldSettings] = useState<FieldSettings>(DEFAULT_FIELD_SETTINGS);
    const [scheduledSms, setScheduledSms] = useState<ScheduledSms[]>([]);

    const handleUpdateSettings = async (newSettings: FieldSettings) => {
        setFieldSettings(newSettings);
        toast.success("Settings updated.");
    };

    const value = { fieldSettings, setFieldSettings, scheduledSms, handleUpdateSettings };
    
    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

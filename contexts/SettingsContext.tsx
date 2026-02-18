import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { FieldSettings, ScheduledSms, SmsCategory } from '../types';
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
    invalidateFutureRecalls: (patientId: string, newAppointmentDate: string) => void;
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

    const invalidateFutureRecalls = useCallback((patientId: string, newAppointmentDate: string) => {
        setScheduledSms(prevSmsList => {
            const smsToKeep = prevSmsList.filter(sms => {
                // Keep SMS if it's not for the current patient
                if (sms.patientId !== patientId) {
                    return true;
                }

                // Find the template for the SMS
                const template = fieldSettings.smsTemplates[sms.templateId];
                if (!template) {
                    // Keep if template not found
                    return true;
                }

                // Only invalidate recall-type messages
                if (template.category !== 'Reputation') {
                    return true;
                }

                const appointmentDate = new Date(newAppointmentDate);
                const smsDueDate = new Date(sms.dueDate);

                // If appointment is on or after the SMS date, the recall might still be relevant
                // Only cancel recalls that are scheduled *after* the new appointment date
                if (appointmentDate >= smsDueDate) {
                    return true;
                }
                
                // Invalidate this SMS
                toast.info(`Cancelled recall SMS for ${new Date(sms.dueDate).toLocaleDateString()} due to new appointment.`);
                return false;
            });

            if (smsToKeep.length < prevSmsList.length) {
                return smsToKeep;
            }
            return prevSmsList;
        });
    }, [fieldSettings.smsTemplates, toast]);

    const value = { fieldSettings, setFieldSettings, isLoading, scheduledSms, addScheduledSms, handleUpdateSettings, invalidateFutureRecalls };
    
    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
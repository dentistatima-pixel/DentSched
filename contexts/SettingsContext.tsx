import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { FieldSettings, ScheduledSms, SmsCategory } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { useToast } from '../components/ToastSystem';
import { DataService } from '../services/dataService';
import { database } from '../firebase';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { USE_FIREBASE } from '../config';

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
        
        if (USE_FIREBASE) {
            // Listen to scheduled SMS in Firebase Realtime Database
            const smsRef = ref(database, 'scheduled_sms');
            const unsubscribe = onValue(smsRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const smsList: ScheduledSms[] = Object.keys(data).map(key => ({
                        id: key,
                        ...data[key]
                    }));
                    setScheduledSms(smsList);
                } else {
                    setScheduledSms([]);
                }
            });

            return () => unsubscribe();
        }
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
        if (!USE_FIREBASE) {
            console.warn("Firebase is disabled. SMS scheduling is mocked.");
            return;
        }
        const smsRef = ref(database, 'scheduled_sms');
        const newSmsRef = push(smsRef);
        set(newSmsRef, {
            ...sms,
            status: 'Pending'
        }).catch(err => {
            console.error("Failed to schedule SMS:", err);
            toast.error("Failed to schedule SMS.");
        });
    };

    const invalidateFutureRecalls = useCallback((patientId: string, newAppointmentDate: string) => {
        if (!USE_FIREBASE) return;
        scheduledSms.forEach(sms => {
            if (sms.patientId === patientId) {
                const template = fieldSettings.smsTemplates[sms.templateId];
                if (template && template.category === 'Reputation') {
                    const appointmentDate = new Date(newAppointmentDate);
                    const smsDueDate = new Date(sms.dueDate);
                    if (appointmentDate < smsDueDate) {
                        const smsRef = ref(database, `scheduled_sms/${sms.id}`);
                        remove(smsRef).then(() => {
                            toast.info(`Cancelled recall SMS for ${new Date(sms.dueDate).toLocaleDateString()} due to new appointment.`);
                        }).catch(console.error);
                    }
                }
            }
        });
    }, [scheduledSms, fieldSettings.smsTemplates, toast]);

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
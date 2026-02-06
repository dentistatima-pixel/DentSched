
import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { SavedView } from '../types';
import { useSettings } from './SettingsContext';

// Define the shape of your filters for different contexts
interface PatientFilters {
    recallStatus?: string;
    hasBalance?: boolean;
    reliabilityScore?: { min: number, max: number };
    // ... other patient filters
}

interface AppointmentFilters {
    dateRange?: { start: string, end: string };
    status?: string[];
    providerId?: string;
    resourceId?: string;
    // ... other appointment filters
}

interface AllFilters {
    patients?: PatientFilters;
    appointments?: AppointmentFilters;
}

interface SearchContextType {
    filters: AllFilters;
    applyFilter: (context: keyof AllFilters, key: string, value: any) => void;
    clearFilters: (context: keyof AllFilters) => void;
    savedViews: SavedView[];
    saveCurrentView: (name: string, context: 'patients' | 'appointments') => void;
    applySavedView: (viewId: string) => void;
    deleteSavedView: (viewId: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { fieldSettings, handleUpdateSettings } = useSettings();
    const [filters, setFilters] = useState<AllFilters>({});

    const savedViews = useMemo(() => fieldSettings.savedViews || [], [fieldSettings.savedViews]);

    const applyFilter = useCallback((context: keyof AllFilters, key: string, value: any) => {
        setFilters(prev => ({
            ...prev,
            [context]: {
                ...prev[context],
                [key]: value,
            },
        }));
    }, []);

    const clearFilters = useCallback((context: keyof AllFilters) => {
        setFilters(prev => ({
            ...prev,
            [context]: undefined,
        }));
    }, []);

    const saveCurrentView = useCallback(async (name: string, context: 'patients' | 'appointments') => {
        const currentFilters = filters[context];
        if (!currentFilters || Object.keys(currentFilters).length === 0) return;

        const newView: SavedView = {
            id: `view_${Date.now()}`,
            name,
            context,
            filters: currentFilters,
        };
        
        const nextSavedViews = [...(fieldSettings.savedViews || []), newView];
        await handleUpdateSettings({ ...fieldSettings, savedViews: nextSavedViews });
    }, [filters, fieldSettings, handleUpdateSettings]);

    const applySavedView = useCallback((viewId: string) => {
        const view = savedViews.find(v => v.id === viewId);
        if (view) {
            setFilters(prev => ({
                ...prev,
                [view.context]: view.filters,
            }));
        }
    }, [savedViews]);

    const deleteSavedView = useCallback(async (viewId: string) => {
        const nextSavedViews = (fieldSettings.savedViews || []).filter(v => v.id !== viewId);
        await handleUpdateSettings({ ...fieldSettings, savedViews: nextSavedViews });
    }, [fieldSettings, handleUpdateSettings]);
    
    const value: SearchContextType = {
        filters,
        applyFilter,
        clearFilters,
        savedViews,
        saveCurrentView,
        applySavedView,
        deleteSavedView,
    };

    return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (context === undefined) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
};
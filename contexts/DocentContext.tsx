import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAppContext } from './AppContext';

interface DocentContextType {
    isDocentEnabled: boolean;
    isPanelOpen: boolean;
    togglePanel: () => void;
}

const DocentContext = createContext<DocentContextType | undefined>(undefined);

export const DocentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAppContext();
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // Relies solely on user's preference now, defaulting to true if not explicitly set.
    const isDocentEnabled = currentUser?.showDigitalDocent ?? true;

    const togglePanel = () => {
        if (isDocentEnabled) {
            setIsPanelOpen(prev => !prev);
        }
    };

    const value = { isDocentEnabled, isPanelOpen, togglePanel };

    return <DocentContext.Provider value={value}>{children}</DocentContext.Provider>;
};

export const useDocent = () => {
    const context = useContext(DocentContext);
    if (context === undefined) {
        throw new Error('useDocent must be used within a DocentProvider');
    }
    return context;
};

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DocentContextType {
    isDocentEnabled: boolean;
    setIsDocentEnabled: (enabled: boolean) => void;
}

const DocentContext = createContext<DocentContextType | undefined>(undefined);

export const DocentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isDocentEnabled, setIsDocentEnabled] = useState(true);

    return (
        <DocentContext.Provider value={{ isDocentEnabled, setIsDocentEnabled }}>
            {children}
        </DocentContext.Provider>
    );
};

export const useDocent = () => {
    const context = useContext(DocentContext);
    if (context === undefined) {
        throw new Error('useDocent must be used within a DocentProvider');
    }
    return context;
};

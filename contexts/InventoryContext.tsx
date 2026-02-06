
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StockItem, SterilizationCycle, StockTransfer } from '../types';
import { MOCK_STOCK, MOCK_STERILIZATION_CYCLES_INITIALIZED } from '../constants';
import { useToast } from '../components/ToastSystem';

interface InventoryContextType {
    stock: StockItem[];
    sterilizationCycles: SterilizationCycle[];
    transfers: StockTransfer[];
    onUpdateStock: (updatedStock: StockItem[]) => void;
    handleAddSterilizationCycle: (cycle: SterilizationCycle) => Promise<void>;
    handlePerformTransfer: (transfer: StockTransfer) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    const [stock, setStock] = useState<StockItem[]>(MOCK_STOCK);
    const [sterilizationCycles, setSterilizationCycles] = useState<SterilizationCycle[]>(MOCK_STERILIZATION_CYCLES_INITIALIZED);
    const [transfers, setTransfers] = useState<StockTransfer[]>([]);

    const createAsyncHandler = <T extends any[]>(handler: (...args: T) => void, successMsg?: string) => {
        return async (...args: T): Promise<void> => {
            try {
                handler(...args);
                if (successMsg) toast.success(successMsg);
            } catch (e: any) {
                toast.error(e.message || "An unexpected error occurred.");
            }
        };
    };
    
    const value = { 
        stock, 
        sterilizationCycles,
        transfers,
        onUpdateStock: setStock,
        handleAddSterilizationCycle: createAsyncHandler((cycle: SterilizationCycle) => setSterilizationCycles(c => [cycle, ...c])),
        handlePerformTransfer: createAsyncHandler((transfer: StockTransfer) => setTransfers(t => [...t, transfer]))
    };

    return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = () => {
    const context = useContext(InventoryContext);
    if (context === undefined) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
};
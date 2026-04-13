
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StockItem, StockTransfer, ProcedureItem } from '../types';
import { MOCK_STOCK } from '../constants';
import { useToast } from '../components/ToastSystem';

interface InventoryContextType {
    stock: StockItem[];
    transfers: StockTransfer[];
    onUpdateStock: (updatedStock: StockItem[]) => void;
    handlePerformTransfer: (transfer: StockTransfer) => Promise<void>;
    deductStockForProcedure: (procedure: ProcedureItem) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    const [stock, setStock] = useState<StockItem[]>(MOCK_STOCK);
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
    
    const deductStockForProcedure = (_procedure: ProcedureItem) => {
        // Consumables are no longer actively tracked by quantity (reducing balance).
        // They are only used for cost modeling and setup checklists.
        return;
    };
    
    const value = { 
        stock, 
        transfers,
        onUpdateStock: setStock,
        handlePerformTransfer: createAsyncHandler((transfer: StockTransfer) => setTransfers(t => [...t, transfer])),
        deductStockForProcedure
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

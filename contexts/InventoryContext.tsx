
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StockItem, StockTransfer, ProcedureItem, StockCategory } from '../types';
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
    
    const deductStockForProcedure = (procedure: ProcedureItem) => {
        if (!procedure.billOfMaterials) return;
        
        setStock(prevStock => {
            const newStock = [...prevStock];
            const lowStockItems: string[] = [];

            procedure.billOfMaterials!.forEach(bom => {
                const itemIndex = newStock.findIndex(s => s.id === bom.stockItemId);
                if (itemIndex > -1) {
                    const item = newStock[itemIndex];
                    // Only deduct if NOT an instrument
                    if (item.category !== StockCategory.INSTRUMENTS) {
                        const newQty = Number((item.quantity - bom.quantity).toFixed(2));
                        newStock[itemIndex] = {
                            ...item,
                            quantity: Math.max(0, newQty)
                        };

                        // Check for low stock alert
                        const reorderPoint = item.lowStockThreshold || 0;
                        if (newStock[itemIndex].quantity <= reorderPoint) {
                            lowStockItems.push(item.name);
                        }
                    }
                }
            });

            if (lowStockItems.length > 0) {
                toast.warning(`Low Stock Alert: ${lowStockItems.join(', ')}. Please reorder.`);
            }

            return newStock;
        });
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

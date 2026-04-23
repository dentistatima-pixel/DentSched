import { StockItem, StockCategory } from "../../types";

export const MEDICATIONS: StockItem[] = [
    { id: 'med_tranexamic_500', name: 'Tranexamic acid 500mg - Capsule', category: StockCategory.MEDICATIONS, quantity: 50, lowStockThreshold: 10, dispensingUnit: 'Capsule', location: 'Stock Room' },
    { id: 'med_cefalexin_500', name: 'Cefalexin 500mg - Capsule', category: StockCategory.MEDICATIONS, quantity: 50, lowStockThreshold: 10, dispensingUnit: 'Capsule', location: 'Stock Room' },
    { id: 'med_paracetamol_120', name: 'Paracetamol (2-6yrs old) 120mg/5ml suspension', category: StockCategory.MEDICATIONS, quantity: 10, lowStockThreshold: 2, dispensingUnit: 'Bottle', location: 'Stock Room' },
    { id: 'med_paracetamol_250', name: 'Paracetamol (7-12yrs old) 250mg/5ml suspension', category: StockCategory.MEDICATIONS, quantity: 10, lowStockThreshold: 2, dispensingUnit: 'Bottle', location: 'Stock Room' },
    { id: 'med_amoxicillin_125', name: 'Amoxicillin (2-6yrs old) 125mg/5ml powder for suspension', category: StockCategory.MEDICATIONS, quantity: 10, lowStockThreshold: 2, dispensingUnit: 'Bottle', location: 'Stock Room' },
    { id: 'med_amoxicillin_250', name: 'Amoxicillin (7-12yrs old) 250mg/5ml powder for suspension', category: StockCategory.MEDICATIONS, quantity: 10, lowStockThreshold: 2, dispensingUnit: 'Bottle', location: 'Stock Room' }
];

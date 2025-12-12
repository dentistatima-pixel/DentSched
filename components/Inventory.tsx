
import React, { useState } from 'react';
import { Package, Plus, Search, AlertTriangle } from 'lucide-react';
import { StockItem, StockCategory } from '../types';

interface InventoryProps {
  stock: StockItem[];
  onUpdateStock: (updatedStock: StockItem[]) => void;
}

const Inventory: React.FC<InventoryProps> = ({ stock, onUpdateStock }) => {
  
  const lowStockItems = stock.filter(item => item.quantity <= item.lowStockThreshold);

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex-shrink-0">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-2xl text-blue-700">
                    <Package size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Inventory Management</h1>
                    <p className="text-slate-500">Track clinical supplies and manage stock levels.</p>
                </div>
            </div>
        </header>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg shadow-sm">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="text-red-500" size={24}/>
                    <div>
                        <h4 className="font-bold text-red-800">Low Stock Alert</h4>
                        <p className="text-sm text-red-700">{lowStockItems.length} items need restocking soon.</p>
                    </div>
                </div>
            </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Search inventory..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl"/>
                </div>
                <button className="bg-teal-600 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2">
                    <Plus size={18}/> Add Item
                </button>
            </div>

            {/* Item List */}
            <div className="flex-1 overflow-y-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                        <tr>
                            <th className="p-4">Item Name</th>
                            <th className="p-4">Category</th>
                            <th className="p-4 text-center">Quantity</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {stock.map(item => {
                            const isLow = item.quantity <= item.lowStockThreshold;
                            return (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-bold text-slate-700">{item.name}</td>
                                    <td className="p-4 text-slate-500">{item.category}</td>
                                    <td className="p-4 text-center font-mono font-bold text-lg">{item.quantity}</td>
                                    <td className="p-4">
                                        {isLow ? 
                                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Low Stock</span> :
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">In Stock</span>
                                        }
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                 </table>
            </div>
        </div>
    </div>
  );
};

export default Inventory;

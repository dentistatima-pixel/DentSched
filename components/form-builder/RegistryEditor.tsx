
import React, { useState } from 'react';
import { List, Plus, Trash2 } from 'lucide-react';

interface RegistryEditorProps {
  title: string;
  items: string[];
  onAddItem: (item: string) => void;
  onRemoveItem: (item: string) => void;
}

const RegistryEditor: React.FC<RegistryEditorProps> = ({ title, items, onAddItem, onRemoveItem }) => {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onAddItem(newItem.trim());
      setNewItem('');
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="label text-sm flex items-center gap-2"><List size={14} /> Edit {title} Registry</h4>
      <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
        {items.map(item => (
          <div key={item} className="flex justify-between items-center p-2 bg-white rounded-md group">
            <span className="text-xs font-bold">{item}</span>
            <button onClick={() => onRemoveItem(item)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
              <Trash2 size={12}/>
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={newItem} 
          onChange={e => setNewItem(e.target.value)}
          placeholder="New option..."
          className="input flex-1 text-xs"
          onKeyPress={e => e.key === 'Enter' && handleAdd()}
        />
        <button onClick={handleAdd} className="p-3 bg-teal-600 text-white rounded-lg"><Plus size={16}/></button>
      </div>
    </div>
  );
};

export default RegistryEditor;

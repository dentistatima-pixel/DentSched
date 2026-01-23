
import React from 'react';
import { RegistrationField } from '../../types';
import { Edit, ShieldAlert } from 'lucide-react';

interface DynamicFieldEditorProps {
  field: RegistrationField;
  onUpdateField: (updates: Partial<RegistrationField>) => void;
  isCritical: boolean;
  onToggleCritical: () => void;
}

const DynamicFieldEditor: React.FC<DynamicFieldEditorProps> = ({ field, onUpdateField, isCritical, onToggleCritical }) => {
  return (
    <div className="space-y-4">
      <h4 className="label text-sm flex items-center gap-2"><Edit size={14} /> Edit Dynamic Field</h4>
      <div>
        <label className="label text-xs">Display Label</label>
        <input
          type="text"
          value={field.label}
          onChange={(e) => onUpdateField({ label: e.target.value })}
          className="input"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label text-xs">Input Type</label>
          <select value={field.type} onChange={e => onUpdateField({ type: e.target.value as any })} className="input text-xs font-bold">
            <option value="text">Short Text</option>
            <option value="textarea">Narrative</option>
            <option value="date">Date</option>
            <option value="tel">Phone Number</option>
            <option value="email">Email</option>
            <option value="dropdown">Dropdown</option>
          </select>
        </div>
        <div>
          <label className="label text-xs">Field Width</label>
          <select value={field.width} onChange={e => onUpdateField({ width: e.target.value as any })} className="input text-xs font-bold">
            <option value="full">Full Width</option>
            <option value="half">Half Width</option>
            <option value="third">One-Third</option>
            <option value="quarter">One-Quarter</option>
          </select>
        </div>
      </div>
       <button onClick={onToggleCritical} className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-xs font-black uppercase transition-all ${isCritical ? 'bg-red-50 border-red-500 text-red-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
        <ShieldAlert size={16} /> Mark as Critical Risk
      </button>
    </div>
  );
};

export default DynamicFieldEditor;

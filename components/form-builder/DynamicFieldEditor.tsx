
import React, { useState, useEffect } from 'react';
import { RegistrationField } from '../../types';
import { Edit, ShieldAlert } from 'lucide-react';

interface DynamicFieldEditorProps {
  field: RegistrationField;
  onUpdateField: (updates: Partial<RegistrationField>) => void;
  // FIX: Added 'isCritical' and 'onToggleCritical' to the interface.
  isCritical: boolean;
  onToggleCritical: () => void;
}

const DynamicFieldEditor: React.FC<DynamicFieldEditorProps> = ({ field, onUpdateField, isCritical, onToggleCritical }) => {
  const showRegistryKey = field.type === 'dropdown' || field.type === 'checklist';
  
  // Local buffer state
  const [localLabel, setLocalLabel] = useState(field.label);
  const [localRegistryKey, setLocalRegistryKey] = useState(field.registryKey || '');

  useEffect(() => {
    setLocalLabel(field.label);
    setLocalRegistryKey(field.registryKey || '');
  }, [field.id, field.label, field.registryKey]);

  const handleCommit = () => {
    onUpdateField({ 
        label: localLabel,
        registryKey: localRegistryKey
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="label text-sm flex items-center gap-2"><Edit size={14} /> Edit Dynamic Field</h4>
      <div>
        <label className="label text-xs">Display Label</label>
        <input
          type="text"
          value={localLabel}
          onChange={(e) => setLocalLabel(e.target.value)}
          onBlur={handleCommit}
          className="input"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label text-xs">Input Type</label>
          <select value={field.type} onChange={e => { onUpdateField({ type: e.target.value as any }); }} className="input text-xs font-bold">
            <option value="text">Short Text</option>
            <option value="textarea">Narrative</option>
            <option value="date">Date</option>
            <option value="tel">Phone Number</option>
            <option value="email">Email</option>
            <option value="dropdown">Dropdown</option>
            <option value="boolean">Yes/No Checkbox</option>
            <option value="checklist">Checklist (from registry)</option>
            <option value="conditional-text">Yes/No with Details</option>
          </select>
        </div>
        <div>
          <label className="label text-xs">Field Width</label>
          <select value={field.width} onChange={e => { onUpdateField({ width: e.target.value as any }); }} className="input text-xs font-bold">
            <option value="full">Full Width</option>
            <option value="half">Half Width</option>
            <option value="third">One-Third</option>
            <option value="quarter">One-Quarter</option>
          </select>
        </div>
      </div>
      {showRegistryKey && (
        <div>
          <label className="label text-xs">Registry Key</label>
          <input
            type="text"
            value={localRegistryKey}
            onChange={(e) => setLocalRegistryKey(e.target.value)}
            onBlur={handleCommit}
            className="input font-mono text-xs"
            placeholder="e.g. habitRegistry"
          />
           <p className="text-[10px] text-slate-400 mt-1 ml-1">The key for the options list in FieldSettings (e.g., 'religions').</p>
        </div>
      )}
       <button 
        onClick={onToggleCritical} 
        className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-xs font-black uppercase transition-all ${isCritical ? 'bg-red-50 border-red-500 text-red-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
      >
        <ShieldAlert size={16} /> 
        Mark as Critical Field
        <span className="ml-auto text-[9px] font-mono p-1 rounded-md bg-white">{isCritical ? 'ON' : 'OFF'}</span>
      </button>
      <p className="text-[10px] text-slate-400 -mt-2 ml-1">Critical fields are mandatory for patient safety and cannot be bypassed during intake.</p>
    </div>
  );
};

export default DynamicFieldEditor;

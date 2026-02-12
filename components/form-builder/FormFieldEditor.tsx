import React from 'react';
import { RegistrationField } from '../../types';
import { Edit, ShieldAlert, Check } from 'lucide-react';

interface FormFieldEditorProps {
  field: RegistrationField;
  onUpdateField: (updates: Partial<RegistrationField>) => void;
}

const FormFieldEditor: React.FC<FormFieldEditorProps> = ({ field, onUpdateField }) => {
  const showRegistryKey = field.type === 'dropdown' || field.type === 'checklist';
  
  return (
    <div className="space-y-4">
      <h4 className="label text-sm flex items-center gap-2"><Edit size={14} /> Edit {field.isCore ? 'Core' : 'Dynamic'} Field</h4>
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
          <select 
            value={field.type} 
            onChange={e => onUpdateField({ type: e.target.value as any })} 
            className="input text-xs font-bold"
            disabled={field.isCore}
          >
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
          <select value={field.width} onChange={e => onUpdateField({ width: e.target.value as any })} className="input text-xs font-bold">
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
            value={field.registryKey || ''}
            onChange={(e) => onUpdateField({ registryKey: e.target.value })}
            className="input font-mono text-xs"
            placeholder="e.g. habitRegistry"
          />
           <p className="text-[10px] text-slate-400 mt-1 ml-1">The key for the options list in FieldSettings (e.g., 'religions').</p>
        </div>
      )}

      <div>
        <label className="label text-xs">Validation Rules</label>
        <div className="space-y-2">
            <label className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${field.isRequired ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-white border-slate-200'}`}>
                <input
                    type="checkbox"
                    checked={!!field.isRequired}
                    onChange={(e) => onUpdateField({ isRequired: e.target.checked })}
                    className="w-6 h-6 accent-teal-600 rounded mt-0.5 shrink-0"
                />
                <div>
                    <span className="font-black text-teal-950 uppercase text-xs tracking-widest flex items-center gap-2">
                        <Check size={14}/> Make this field mandatory
                    </span>
                    <p className="text-xs text-slate-500 mt-1">The user will not be able to proceed if this field is empty.</p>
                </div>
            </label>
             <label className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${field.isCritical ? 'bg-red-50 border-red-500 shadow-md' : 'bg-white border-slate-200'}`}>
                <input
                    type="checkbox"
                    checked={!!field.isCritical}
                    onChange={(e) => onUpdateField({ isCritical: e.target.checked })}
                    className="w-6 h-6 accent-red-600 rounded mt-0.5 shrink-0"
                />
                <div>
                    <span className="font-black text-red-950 uppercase text-xs tracking-widest flex items-center gap-2">
                        <ShieldAlert size={14}/> Mark as a Critical Field
                    </span>
                    <p className="text-xs text-slate-500 mt-1">Flags this field as a high-risk indicator for patient safety alerts.</p>
                </div>
            </label>
        </div>
      </div>
    </div>
  );
};

export default FormFieldEditor;
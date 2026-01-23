
import React from 'react';
import { Edit } from 'lucide-react';

interface CoreFieldEditorProps {
  label: string;
  onUpdateLabel: (newLabel: string) => void;
}

const CoreFieldEditor: React.FC<CoreFieldEditorProps> = ({ label, onUpdateLabel }) => {
  return (
    <div className="space-y-4">
      <h4 className="label text-sm flex items-center gap-2"><Edit size={14} /> Edit Core Field</h4>
      <div>
        <label className="label text-xs">Display Label</label>
        <input
          type="text"
          value={label}
          onChange={(e) => onUpdateLabel(e.target.value)}
          className="input"
          autoFocus
        />
      </div>
    </div>
  );
};

export default CoreFieldEditor;

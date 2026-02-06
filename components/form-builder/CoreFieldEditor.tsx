
import React, { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';

interface CoreFieldEditorProps {
  label: string;
  onUpdateLabel: (newLabel: string) => void;
}

const CoreFieldEditor: React.FC<CoreFieldEditorProps> = ({ label, onUpdateLabel }) => {
  const [localLabel, setLocalLabel] = useState(label);

  useEffect(() => {
    setLocalLabel(label);
  }, [label]);

  return (
    <div className="space-y-4">
      <h4 className="label text-sm flex items-center gap-2"><Edit size={14} /> Edit Core Field</h4>
      <div>
        <label className="label text-xs">Display Label</label>
        <input
          type="text"
          value={localLabel}
          onChange={(e) => setLocalLabel(e.target.value)}
          onBlur={() => onUpdateLabel(localLabel)}
          className="input"
          autoFocus
        />
      </div>
    </div>
  );
};

export default CoreFieldEditor;

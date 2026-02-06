
import React, { useState, useEffect } from 'react';
import { Edit, ShieldAlert } from 'lucide-react';

interface QuestionEditorProps {
  question: string;
  onUpdateQuestion: (oldQuestion: string, newQuestion: string) => void;
  isCritical: boolean;
  onToggleCritical: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, onUpdateQuestion, isCritical, onToggleCritical }) => {
  const [localQuestion, setLocalQuestion] = useState(question);

  useEffect(() => {
    setLocalQuestion(question);
  }, [question]);

  return (
    <div className="space-y-4">
      <h4 className="label text-sm flex items-center gap-2"><Edit size={14} /> Edit Question</h4>
      <div>
        <label className="label text-xs">Question Text</label>
        <textarea
          value={localQuestion}
          onChange={(e) => setLocalQuestion(e.target.value)}
          onBlur={() => onUpdateQuestion(question, localQuestion)}
          className="input h-24"
          autoFocus
        />
      </div>
      <button onClick={onToggleCritical} className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-xs font-black uppercase transition-all ${isCritical ? 'bg-red-50 border-red-500 text-red-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
        <ShieldAlert size={16} /> Mark as Critical Risk
      </button>
    </div>
  );
};

export default QuestionEditor;

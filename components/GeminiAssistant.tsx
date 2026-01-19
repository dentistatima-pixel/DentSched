
import React, { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { chatWithAssistant } from '../services/geminiService';

interface GeminiAssistantProps {
    patientContext?: string;
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ patientContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleQuery = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setResponse('');
    const res = await chatWithAssistant(prompt, patientContext);
    setResponse(res || '');
    setIsLoading(false);
    setPrompt('');
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-teal-600 text-white p-4 rounded-full shadow-2xl hover:bg-teal-700 transition-transform hover:scale-110 animate-in zoom-in-95 z-50"
        aria-label="Open AI Assistant"
      >
        <Sparkles size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col h-96 animate-in zoom-in-95 z-50">
      <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-3xl">
        <h4 className="font-bold text-sm flex items-center gap-2"><Sparkles size={16} className="text-teal-500" /> Clinical Assistant</h4>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700" aria-label="Close AI Assistant">X</button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: response.replace(/\n/g, '<br />') || (isLoading ? 'Thinking...' : 'Ask a question...') }}></div>
      <div className="p-2 border-t">
        <div className="relative">
          <input 
            type="text" 
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleQuery()}
            placeholder="e.g., 'What are the risks?'"
            className="w-full bg-slate-100 rounded-lg p-2 pr-10 text-sm outline-none"
            aria-label="AI Assistant Prompt"
          />
          <button onClick={handleQuery} disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 disabled:opacity-50" aria-label="Send Prompt">
            <Send size={16}/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiAssistant;
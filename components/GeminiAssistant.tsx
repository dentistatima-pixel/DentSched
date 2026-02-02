import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Send, Loader } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getDocentExplanation } from '../services/geminiService';
import { useAppContext } from '../contexts/AppContext';
import { useRouter } from '../contexts/RouterContext';

interface GeminiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAppContext();
  const { route } = useRouter();
  const [chatHistory, setChatHistory] = useState<{ query: string; response: string; }[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleQuery = async () => {
    if (!query.trim() || isLoading || !currentUser) return;

    setIsLoading(true);
    const currentQuery = query;
    setQuery('');

    try {
      const context = `User is on the '${route.path}' page.`;
      const response = await getDocentExplanation(currentQuery, context, currentUser.role);
      setChatHistory(prev => [...prev, { query: currentQuery, response }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { query: currentQuery, response: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
        className={`fixed top-0 right-0 h-full w-96 bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-200 dark:border-slate-700 z-50 flex flex-col transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="docent-title"
    >
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
            <div className="bg-lilac-100 p-2 rounded-xl text-lilac-700"><Sparkles size={20}/></div>
            <h2 id="docent-title" className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Digital Docent</h2>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500"><X size={24}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="p-4 bg-teal-50 dark:bg-teal-900/50 border border-teal-100 dark:border-teal-800 rounded-xl text-sm text-teal-800 dark:text-teal-200">
            Ask me anything about the app, from "What is this button?" to "Explain RA 10173".
        </div>
        {chatHistory.map((chat, index) => (
          <div key={index} className="space-y-4">
            <div className="flex justify-end">
                <div className="bg-blue-600 text-white p-3 rounded-xl rounded-br-none max-w-xs">
                    <p className="text-sm">{chat.query}</p>
                </div>
            </div>
            <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-xl rounded-bl-none max-w-xs">
                     <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">{chat.response}</ReactMarkdown>
                </div>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-xl rounded-bl-none max-w-xs flex items-center gap-2">
                    <Loader size={16} className="animate-spin text-slate-500"/>
                    <span className="text-sm text-slate-500">Thinking...</span>
                </div>
            </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800">
        <div className="relative">
          <input 
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleQuery()}
            placeholder="Ask a question..."
            className="input w-full pr-12"
            disabled={isLoading}
          />
          <button onClick={handleQuery} disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-slate-300">
            <Send size={16}/>
          </button>
        </div>
      </div>
    </div>
  );
};

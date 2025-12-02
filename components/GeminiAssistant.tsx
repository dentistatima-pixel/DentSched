
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, Sparkles } from 'lucide-react';
import { chatWithAssistant } from '../services/geminiService';
import { Message, Appointment, Patient, User } from '../types';
import ReactMarkdown from 'react-markdown';

interface GeminiAssistantProps {
  onClose: () => void;
  appointments: Appointment[];
  patients: Patient[];
  staff: User[];
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ onClose, appointments, patients, staff }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am DentSched AI. How can I help you manage the practice today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Prepare history for API
    const historyForApi = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));

    // PASS CONTEXT DATA
    const contextData = { appointments, patients, staff };
    const responseText = await chatWithAssistant(input, historyForApi, contextData);
    
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-24 right-4 md:right-8 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 overflow-hidden font-sans">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Sparkles size={20} className="text-yellow-200" />
            </div>
            <div>
                <h3 className="font-bold text-lg">Assistant</h3>
                <p className="text-xs text-teal-100 opacity-90">Powered by Gemini</p>
            </div>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm ${
                 msg.role === 'user' 
                 ? 'bg-teal-600 text-white rounded-br-none' 
                 : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
             }`}>
                {msg.role === 'model' ? (
                   <div className="prose prose-sm prose-p:my-1 prose-headings:my-2 max-w-none">
                       <ReactMarkdown>{msg.text}</ReactMarkdown>
                   </div>
                ) : (
                   msg.text
                )}
             </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-white text-slate-500 border border-slate-100 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-lilac-400 rounded-full animate-bounce" style={{ animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-lilac-400 rounded-full animate-bounce" style={{ animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-lilac-400 rounded-full animate-bounce" style={{ animationDelay: '300ms'}}></div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative flex items-center">
            <input 
              type="text" 
              className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 pr-12 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-teal-500/50 focus:outline-none transition-all"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:hover:bg-teal-600 transition-colors"
            >
              <Send size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiAssistant;


import React, { useState } from 'react';
import { DentalChartEntry } from '../types';
import { Send, FileText, User, Calendar, Clock, Tag } from 'lucide-react';
import { formatDate } from '../constants';

interface OdontonotesProps {
  entries: DentalChartEntry[];
  onAddNote: (note: string, toothNumber?: number) => void;
  currentUser: string;
  readOnly?: boolean;
}

const Odontonotes: React.FC<OdontonotesProps> = ({ entries, onAddNote, currentUser, readOnly }) => {
  const [noteText, setNoteText] = useState('');
  const [toothNum, setToothNum] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    const tNum = toothNum ? parseInt(toothNum) : undefined;
    onAddNote(noteText, tNum);
    setNoteText('');
    setToothNum('');
  };

  // Sort entries by date desc (newest first)
  const sorted = [...entries].sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

  // Quick Tags
  const quickTags = ['Pain', 'Sensitivity', 'Swelling', 'Broken Tooth', 'Consultation', 'Prescription'];

  const addTag = (tag: string) => {
      setNoteText(prev => prev ? `${prev} [${tag}]` : `[${tag}]`);
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
      
      {/* Input Area */}
      {!readOnly && (
          <div className="p-4 bg-white border-b border-slate-200 shadow-sm z-10">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Tooth #"
                        className="w-24 p-3 rounded-xl border border-slate-200 text-sm focus:border-teal-500 outline-none font-mono"
                        value={toothNum}
                        onChange={e => setToothNum(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Type clinical note here..."
                        className="flex-1 p-3 rounded-xl border border-slate-200 text-sm focus:border-teal-500 outline-none"
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                    />
                    <button type="submit" className="bg-teal-600 text-white px-4 rounded-xl hover:bg-teal-700 transition-colors shadow-sm">
                        <Send size={20} />
                    </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {quickTags.map(tag => (
                        <button 
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg font-bold whitespace-nowrap flex items-center gap-1 transition-colors"
                        >
                            <Tag size={10} /> {tag}
                        </button>
                    ))}
                </div>
            </form>
          </div>
      )}

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {sorted.map((entry, idx) => (
            <div key={idx} className="flex gap-4 group">
                {/* Timeline Line */}
                <div className="flex flex-col items-center relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs z-10 shadow-sm border-2
                        ${entry.toothNumber ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-100 text-slate-500 border-slate-200'}
                    `}>
                        {entry.toothNumber || 'Gen'}
                    </div>
                    {idx < sorted.length - 1 && <div className="w-0.5 h-full bg-slate-200 absolute top-10 -bottom-6"></div>}
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="font-bold text-slate-800 text-sm block">{entry.procedure}</span>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                <span className="flex items-center gap-1"><Calendar size={10}/> {formatDate(entry.date)}</span>
                                {entry.status && (
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase
                                        ${entry.status === 'Completed' ? 'bg-green-50 text-green-600' : 
                                          entry.status === 'Planned' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}
                                    `}>
                                        {entry.status}
                                    </span>
                                )}
                            </div>
                        </div>
                        {entry.price && entry.price > 0 && (
                            <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded">₱{entry.price}</span>
                        )}
                    </div>
                    
                    {entry.notes && (
                        <div className="text-sm text-slate-700 bg-slate-50/50 p-2 rounded-lg border border-slate-50 mb-2">
                            {entry.notes}
                        </div>
                    )}
                    
                    {entry.surfaces && (
                         <div className="flex gap-1 mb-2">
                            {entry.surfaces.split('').map((s, i) => (
                                <span key={i} className="w-5 h-5 flex items-center justify-center bg-slate-200 text-slate-600 text-[10px] font-bold rounded">
                                    {s}
                                </span>
                            ))}
                         </div>
                    )}

                    <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        <User size={10} /> {entry.author || 'System'}
                    </div>
                </div>
            </div>
        ))}
        {sorted.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                <FileText size={48} className="mb-2"/>
                <p>No clinical notes recorded.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Odontonotes;

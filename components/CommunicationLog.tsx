
import React, { useState } from 'react';
import { Patient, CommunicationLogEntry, CommunicationChannel } from '../types';
import { MessageSquare, Phone, StickyNote, Send, Plus } from 'lucide-react';
import { formatDate } from '../constants';
import { useAppContext } from '../contexts/AppContext';

interface CommunicationLogProps {
  patient: Patient;
  onUpdatePatient: (patient: Patient) => void;
}

const channelIcons: Record<CommunicationChannel, React.ElementType> = {
  [CommunicationChannel.SMS]: MessageSquare,
  [CommunicationChannel.CALL]: Phone,
  [CommunicationChannel.SYSTEM]: StickyNote,
  [CommunicationChannel.EMAIL]: MessageSquare, // Using same for now
};

const CommunicationLog: React.FC<CommunicationLogProps> = ({ patient, onUpdatePatient }) => {
  const { currentUser } = useAppContext();
  const [newLogContent, setNewLogContent] = useState('');
  const [newLogChannel, setNewLogChannel] = useState<CommunicationChannel>(CommunicationChannel.CALL);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddLog = () => {
    if (!newLogContent.trim() || !currentUser) return;
    
    const newLog: CommunicationLogEntry = {
      id: `comm_${Date.now()}`,
      timestamp: new Date().toISOString(),
      channel: newLogChannel,
      authorId: currentUser.id,
      authorName: currentUser.name,
      content: newLogContent,
    };

    const updatedPatient: Patient = {
      ...patient,
      communicationLog: [newLog, ...(patient.communicationLog || [])],
    };

    onUpdatePatient(updatedPatient);
    setNewLogContent('');
    setIsAdding(false);
  };

  const sortedLogs = [...(patient.communicationLog || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-200">Communication History</h3>
          <button 
              onClick={() => setIsAdding(!isAdding)}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"
          >
              <Plus size={14}/> Log Interaction
          </button>
      </div>

      {isAdding && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in slide-in-from-top-4 duration-300">
              <div className="flex gap-2">
                  {/* FIX: Use enum member for comparison instead of string literal. */}
                  <button onClick={() => setNewLogChannel(CommunicationChannel.CALL)} className={`flex-1 p-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 ${newLogChannel === CommunicationChannel.CALL ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}><Phone size={14}/> Log Call</button>
                  {/* FIX: Use enum member for comparison instead of string literal. */}
                  <button onClick={() => setNewLogChannel(CommunicationChannel.SYSTEM)} className={`flex-1 p-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 ${newLogChannel === CommunicationChannel.SYSTEM ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}><StickyNote size={14}/> Log Note</button>
              </div>
              <textarea 
                  value={newLogContent}
                  onChange={e => setNewLogContent(e.target.value)}
                  placeholder="Enter notes about the communication..."
                  className="input w-full h-24"
              />
              <div className="flex justify-end gap-2">
                  <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-xs font-bold">Cancel</button>
                  <button onClick={handleAddLog} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold">Save Log</button>
              </div>
          </div>
      )}

      <div className="space-y-4">
        {sortedLogs.map(log => {
          const Icon = channelIcons[log.channel];
          return (
            <div key={log.id} className="flex items-start gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
              <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-full text-slate-500 dark:text-slate-300 mt-1">
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{log.content}</p>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  <span>{new Date(log.timestamp).toLocaleString()} by <strong>{log.authorName}</strong> via {log.channel}</span>
                </div>
              </div>
            </div>
          );
        })}
        {sortedLogs.length === 0 && (
          <div className="text-center py-20 text-slate-400 dark:text-slate-600">
            <MessageSquare size={40} className="mx-auto mb-4" />
            <p className="font-bold">No communication history.</p>
            <p className="text-sm">Log calls, notes, or sent SMS messages here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationLog;

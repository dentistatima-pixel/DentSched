import React, { useState } from 'react';
import { Patient } from '../types';
import { X, User, FileEdit, Trash2, Download, MessageSquare } from 'lucide-react';
import { useToast } from './ToastSystem';

interface DataSubjectRightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

const DataSubjectRightsModal: React.FC<DataSubjectRightsModalProps> = ({ isOpen, onClose, patient }) => {
  const [requestType, setRequestType] = useState<'access' | 'rectification' | 'erasure' | 'portability' | 'objection' | null>(null);
  const toast = useToast();

  if (!isOpen) return null;

  const handleSubmit = (type: string) => {
    toast.info(`Request for ${type} has been logged for DPO action.`);
    // In a real app, this would create a formal DataDeletionRequest or similar object
    setRequestType(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Data Subject Rights (DPA 10173)</h2>
            <p className="text-sm text-slate-500">For patient: {patient.name}</p>
          </div>
          <button onClick={onClose}><X size={24} className="text-slate-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <p className="text-sm text-slate-600 mb-4">
            As a data subject, you have the following rights under the Data Privacy Act of 2012:
          </p>
          
          <button onClick={() => setRequestType('access')} className="w-full text-left p-4 bg-white border rounded-xl hover:border-teal-500 transition-all">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><User size={16}/> Right to Access</h3>
            <p className="text-xs text-slate-600 pl-8">Request a copy of all personal data we hold about you.</p>
          </button>
          
          <button onClick={() => setRequestType('rectification')} className="w-full text-left p-4 bg-white border rounded-xl hover:border-teal-500 transition-all">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileEdit size={16}/> Right to Rectification</h3>
            <p className="text-xs text-slate-600 pl-8">Request correction of inaccurate or incomplete data.</p>
          </button>
          
          <button onClick={() => setRequestType('erasure')} className="w-full text-left p-4 bg-white border rounded-xl hover:border-teal-500 transition-all">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Trash2 size={16}/> Right to Erasure ("Right to be Forgotten")</h3>
            <p className="text-xs text-slate-600 pl-8">Request deletion of your personal data (subject to legal retention requirements).</p>
          </button>
          
          <button onClick={() => setRequestType('portability')} className="w-full text-left p-4 bg-white border rounded-xl hover:border-teal-500 transition-all">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Download size={16}/> Right to Data Portability</h3>
            <p className="text-xs text-slate-600 pl-8">Receive your data in a machine-readable format (PDF, JSON).</p>
          </button>
          
          <button onClick={() => setRequestType('objection')} className="w-full text-left p-4 bg-white border rounded-xl hover:border-teal-500 transition-all">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><MessageSquare size={16}/> Right to Object</h3>
            <p className="text-xs text-slate-600 pl-8">Object to processing of your data for marketing purposes.</p>
          </button>

          {requestType && (
            <div className="mt-6 p-4 bg-teal-50 rounded-xl border border-teal-200 animate-in fade-in">
              <p className="text-sm mb-4 font-bold text-teal-800">
                A request for <span className="uppercase">{requestType}</span> will be filed with the Data Protection Officer. This will be processed within 15 days as required by the NPC.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setRequestType(null)} className="flex-1 py-2 bg-slate-100 rounded-lg text-xs font-bold">Cancel</button>
                <button onClick={() => handleSubmit(requestType)} className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold">
                  Confirm Request
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t"><button onClick={onClose} className="w-full py-3 bg-slate-100 text-slate-700 rounded-lg font-bold">Close</button></div>
      </div>
    </div>
  );
};

export default DataSubjectRightsModal;

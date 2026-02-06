
import React from 'react';
import { X, CheckCircle, Clock, Activity, Shield } from 'lucide-react';
import { ProcedureItem } from '../types';

interface PreTreatmentExpectationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  procedure: ProcedureItem;
}

const ExpectationItem: React.FC<{ icon: React.ElementType; title: string; items: string[] | undefined }> = ({ icon: Icon, title, items }) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h4 className="font-black text-slate-700 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                <Icon size={16} className="text-teal-600" />
                {title}
            </h4>
            <ul className="space-y-2">
                {items.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <CheckCircle size={16} className="text-teal-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-slate-600">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};


const PreTreatmentExpectationModal: React.FC<PreTreatmentExpectationModalProps> = ({ isOpen, onClose, onConfirm, procedure }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Before We Begin...</h2>
            <button onClick={onClose}><X size={24} className="text-slate-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="text-center">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Procedure</p>
                <h3 className="text-3xl font-black text-teal-800 mt-1">{procedure.name}</h3>
                <p className="text-sm font-bold text-slate-500 mt-2">
                    <Clock size={14} className="inline-block -mt-1 mr-2"/>
                    Estimated Duration: {procedure.defaultDurationMinutes || 'N/A'} minutes
                </p>
            </div>
            
            <ExpectationItem icon={Activity} title="What to Expect During the Procedure" items={procedure.whatToExpect} />
            <ExpectationItem icon={Shield} title="After-Care Instructions" items={procedure.afterCare} />
        </div>

        <div className="p-4 border-t bg-white flex justify-end">
            <button onClick={onConfirm} className="px-8 py-4 bg-teal-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-teal-600/20">
                I Understand, Proceed to Consent
            </button>
        </div>
      </div>
    </div>
  );
};

export default PreTreatmentExpectationModal;

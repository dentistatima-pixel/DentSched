
import React from 'react';
import { X, AlertTriangle, FileText, Shield } from 'lucide-react';

interface CoolingOffModalProps {
  isOpen: boolean;
  onClose: () => void; // Reconsider
  onConfirm: () => void; // Still Decline
  recommendation: string;
  risks: string[];
  alternatives: string[];
}

const CoolingOffModal: React.FC<CoolingOffModalProps> = ({ isOpen, onClose, onConfirm, recommendation, risks, alternatives }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[130] flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-amber-100 bg-amber-50 flex items-center gap-4">
          <AlertTriangle size={28} className="text-amber-600" />
          <div>
            <h2 className="text-xl font-black text-amber-900 uppercase tracking-tight">Before You Decide...</h2>
            <p className="text-xs text-amber-700 font-bold uppercase">Please Reconsider This Important Decision</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <p className="text-sm text-slate-600 text-center">
            Refusing recommended dental care can have significant consequences for your health. Before finalizing your decision, please review the following summary one last time.
          </p>
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h4 className="font-black text-slate-700 uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                  <Shield size={16} className="text-teal-600" />
                  Our Recommendation
              </h4>
              <p className="text-sm text-slate-600">{recommendation}</p>
          </div>

          <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
              <h4 className="font-black text-red-700 uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Risks of Refusal
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-sm text-red-900">
                  {risks.map((risk, index) => <li key={index}>{risk}</li>)}
              </ul>
          </div>
          
           <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
              <h4 className="font-black text-blue-700 uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                  <FileText size={16} />
                  Alternatives Discussed
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-sm text-blue-900">
                  {alternatives.map((alt, index) => <li key={index}>{alt}</li>)}
              </ul>
          </div>
        </div>

        <div className="p-6 border-t bg-white flex gap-4">
            <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-xl font-black uppercase text-xs tracking-widest">
                I'd Like to Reconsider
            </button>
            <button onClick={onConfirm} className="flex-1 py-4 bg-red-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-600/20">
                I Still Decline
            </button>
        </div>
      </div>
    </div>
  );
};

export default CoolingOffModal;

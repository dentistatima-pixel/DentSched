import React from 'react';
import { Video, X } from 'lucide-react';

interface TelehealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TelehealthModal: React.FC<TelehealthModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Video /> Telehealth Session</h3>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="p-12 bg-slate-100 rounded-lg text-center text-slate-400">
          <p>Telehealth feature coming soon.</p>
        </div>
      </div>
    </div>
  );
};

export default TelehealthModal;
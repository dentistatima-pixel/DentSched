import React from 'react';
import { CheckCircle, AlertCircle, RefreshCw, Save } from 'lucide-react';

export type FormStatus = 'unsaved' | 'saving' | 'saved' | 'restoring';

interface FormStatusIndicatorProps {
  status: FormStatus;
}

export const FormStatusIndicator: React.FC<FormStatusIndicatorProps> = ({ status }) => {
  const statusConfig = {
    unsaved: { icon: AlertCircle, text: 'Unsaved Changes', color: 'text-amber-600', animate: false },
    saving: { icon: RefreshCw, text: 'Saving...', color: 'text-blue-600', animate: true },
    saved: { icon: CheckCircle, text: 'All changes saved', color: 'text-teal-600', animate: false },
    restoring: { icon: RefreshCw, text: 'Restoring draft...', color: 'text-blue-600', animate: true },
  };

  const current = statusConfig[status];
  if (!current) return null;
  
  const Icon = current.icon;

  return (
    <div className={`flex items-center gap-2 text-xs font-bold ${current.color} transition-colors duration-300`}>
      <Icon size={14} className={current.animate ? 'animate-spin' : ''} />
      <span>{current.text}</span>
    </div>
  );
};

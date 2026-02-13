
import React from 'react';
import { Users } from 'lucide-react';

const PatientRegistryManager: React.FC = () => {
  return (
    <div className="p-8 bg-slate-50 rounded-lg text-center">
      <Users size={48} className="mx-auto text-slate-300 mb-4" />
      <h3 className="font-bold text-slate-600">Patient Registry Manager</h3>
      <p className="text-sm text-slate-400">This feature is under development.</p>
    </div>
  );
};

export default PatientRegistryManager;

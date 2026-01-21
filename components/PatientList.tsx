import React, { useState, useMemo, useContext } from 'react';
import { Patient, AuthorityLevel } from '../types';
import { Search, UserPlus, ShieldAlert, ChevronRight, Baby, UserCircle, ArrowLeft, FileBadge2 } from 'lucide-react';
import Fuse from 'fuse.js';
import { useModal } from '../contexts/ModalContext';
import { usePatient } from '../contexts/PatientContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate } from '../contexts/RouterContext';

interface PatientListProps {
  selectedPatientId: string | null;
  isCollapsed?: boolean;
}

const PatientList: React.FC<PatientListProps> = ({ isCollapsed, selectedPatientId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { showModal } = useModal();
  const { patients } = usePatient();
  const { fieldSettings } = useSettings();
  const navigate = useNavigate();
  
  const fuse = useMemo(() => new Fuse(patients, {
    keys: ['name', 'id', 'phone'],
    threshold: 0.3,
  }), [patients]);

  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) {
      return patients;
    }
    return fuse.search(searchTerm).map(result => result.item);
  }, [patients, searchTerm, fuse]);

  const selectedPatient = useMemo(() => 
    patients.find(p => p.id === selectedPatientId), 
    [patients, selectedPatientId]
  );

  const onSelectPatient = (id: string | null) => {
    if (id) {
      navigate(`patients/${id}`);
    } else {
      navigate('patients');
    }
  };

  const getCriticalFlags = (patient: Patient) => {
    const flags: { type: string; value: string }[] = [];
    const criticalRegistry = fieldSettings?.criticalRiskRegistry || [];
    
    (patient.medicalConditions || []).forEach(condition => {
        if (criticalRegistry.includes(condition)) {
            flags.push({ type: 'Condition', value: condition });
        }
    });

    (patient.allergies || []).forEach(allergy => {
        if (criticalRegistry.includes(allergy)) {
            flags.push({ type: 'Allergy', value: allergy });
        }
    });
    
    if (patient.registryAnswers) {
        Object.entries(patient.registryAnswers).forEach(([question, answer]) => {
            if (answer === 'Yes' && criticalRegistry.includes(question)) {
                const simpleLabel = question.replace(/\?.*$/, '').replace(/\(.*\)/, '').trim();
                flags.push({ type: 'Alert', value: simpleLabel });
            }
        });
    }

    return flags;
  };

  if (isCollapsed && selectedPatient) {
    return (
        <div className="h-full w-full flex flex-col items-center bg-teal-900 dark:bg-slate-900 py-8 gap-10 animate-in fade-in slide-in-from-left-4 duration-500">
            <button 
                onClick={() => onSelectPatient(null)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all active:scale-90 shadow-lg"
                title="Back to Registry"
            >
                <ArrowLeft size={24}/>
            </button>

            <div className="flex flex-col items-center gap-4 group relative">
                 <div className="w-12 h-12 rounded-2xl border-2 border-teal-400 dark:border-teal-600 shadow-xl bg-teal-800 dark:bg-slate-700 flex items-center justify-center font-black text-white text-lg">
                    {selectedPatient.name.charAt(0)}
                </div>
                <div className="absolute left-full ml-4 px-3 py-1 bg-lilac-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                    ₱{selectedPatient.currentBalance?.toLocaleString()}
                </div>
            </div>

            <div className="flex-1 w-full flex flex-col items-center gap-4 overflow-y-auto no-scrollbar">
                {patients.filter(p => p.id !== selectedPatientId).slice(0, 8).map(p => (
                    <button 
                        key={p.id}
                        onClick={() => onSelectPatient(p.id)}
                        className="w-10 h-10 rounded-xl bg-teal-800/50 dark:bg-slate-700 hover:bg-teal-700 dark:hover:bg-slate-600 border border-white/5 flex items-center justify-center transition-all hover:scale-110"
                    >
                        <span className="text-white/40 font-black text-[10px] uppercase">{p.surname[0]}</span>
                    </button>
                ))}
            </div>
        </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-bg-secondary rounded-[2.5rem] shadow-sm border border-border-primary">
      <div className="p-6 flex items-center justify-between gap-4 shrink-0 border-b border-border-primary">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={20} />
          <input 
            type="text" 
            placeholder="Search registry..."
            className="input w-full pl-12"
            aria-label="Search patients"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => showModal('patientRegistration')}
          className="bg-teal-600 text-white p-3 rounded-2xl font-black shadow-lg shadow-teal-600/30 hover:bg-teal-700 active:scale-95 transition-all flex items-center"
          aria-label="New Patient Admission"
        >
          <UserPlus size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-auto no-scrollbar">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-bg-tertiary/80 dark:bg-bg-tertiary/90 backdrop-blur-sm z-10">
            <tr className="border-b border-border-primary">
              <th className="p-4 w-2"></th>
              <th className="p-4 text-left font-bold uppercase text-text-secondary text-xs tracking-wider">Name</th>
              <th className="p-4 text-right font-bold uppercase text-text-secondary text-xs tracking-wider">Balance</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-secondary">
            {filteredPatients.map(p => {
              const flags = getCriticalFlags(p);
              const hasFlags = flags.length > 0;
              const isMinor = p.age !== undefined && p.age < 18;
              const isPwdOrMinor = p.isPwd || isMinor;
              const isSelected = p.id === selectedPatientId;
              const isProvisional = p.registrationStatus === 'Provisional';

              return (
                  <tr 
                    key={p.id}
                    className={`cursor-pointer group relative transition-colors ${
                        isSelected 
                        ? 'bg-teal-100 dark:bg-teal-900/50'
                        : hasFlags 
                        ? 'bg-red-200 dark:bg-red-900/30 hover:bg-red-300 dark:hover:bg-red-900/50' 
                        : isPwdOrMinor 
                        ? 'bg-amber-200 dark:bg-amber-900/30 hover:bg-amber-300 dark:hover:bg-amber-900/50' 
                        : isProvisional
                        ? 'bg-blue-200 dark:bg-blue-900/30 hover:bg-blue-300 dark:hover:bg-blue-900/50'
                        : 'hover:bg-teal-50 dark:hover:bg-teal-900/20'
                    }`} 
                    onClick={() => onSelectPatient(p.id)}
                  >
                    <td className="p-0 w-2">
                      {hasFlags ? (
                          <div className="w-2 h-full absolute top-0 left-0 bg-red-500 shadow-lg group-hover:bg-red-600 transition-colors" />
                      ) : isPwdOrMinor ? (
                          <div className="w-2 h-full absolute top-0 left-0 bg-amber-500 shadow-lg group-hover:bg-amber-600 transition-colors" />
                      ) : isProvisional ? (
                          <div className="w-2 h-full absolute top-0 left-0 bg-blue-500 shadow-lg group-hover:bg-blue-600 transition-colors" />
                      ) : null}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary">{p.name}</span>
                        {isProvisional && <FileBadge2 size={14} className="text-blue-600 dark:text-blue-400" />}
                      </div>
                      <div className="text-xs font-mono text-text-secondary">{p.id}</div>
                    </td>
                    <td className={`p-4 text-right font-mono font-bold ${p.currentBalance && p.currentBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-text-primary'}`}>
                      ₱{p.currentBalance?.toLocaleString() || '0'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="w-6 h-6 flex items-center justify-center rounded-full group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                          <ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:text-teal-500 dark:group-hover:text-teal-400" size={16}/>
                      </div>
                    </td>
                  </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientList;
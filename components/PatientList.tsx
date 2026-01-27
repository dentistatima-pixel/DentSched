
import React, { useState, useMemo, useContext } from 'react';
import { Patient, AuthorityLevel } from '../types';
import { Search, UserPlus, ShieldAlert, ChevronRight, Baby, UserCircle, ArrowLeft, FileBadge2 } from 'lucide-react';
import Fuse from 'fuse.js';
import { useModal } from '../contexts/ModalContext';
import { usePatient } from '../contexts/PatientContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate } from '../contexts/RouterContext';
import { formatDate } from '../constants';
import { useAppContext } from '../contexts/AppContext';

interface PatientListProps {
  selectedPatientId: string | null;
}

const PatientList: React.FC<PatientListProps> = ({ selectedPatientId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { showModal } = useModal();
  const { patients } = usePatient();
  const { fieldSettings } = useSettings();
  const navigate = useNavigate();
  const { currentBranch } = useAppContext();
  
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
          onClick={() => showModal('patientRegistration', { currentBranch })}
          className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-600/30 hover:bg-teal-700 active:scale-95 transition-all flex items-center"
          aria-label="New Patient Registration"
        >
          New Registration
        </button>
      </div>
      
      <div className="flex-1 overflow-auto no-scrollbar">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-bg-tertiary/80 dark:bg-bg-tertiary/90 backdrop-blur-sm z-10">
            <tr className="border-b border-border-primary">
              <th className="p-4 w-2"></th>
              <th className="p-4 text-left font-bold uppercase text-text-secondary text-xs tracking-wider">Name</th>
              <th className="p-4 text-left font-bold uppercase text-text-secondary text-xs tracking-wider">Alerts</th>
              <th className="p-4 text-left font-bold uppercase text-text-secondary text-xs tracking-wider">Next Visit</th>
              <th className="p-4 text-left font-bold uppercase text-text-secondary text-xs tracking-wider">Last Visit</th>
              <th className="p-4 text-center font-bold uppercase text-text-secondary text-xs tracking-wider">Reliability</th>
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
                      <div>
                        <span className="font-bold text-text-primary">{p.name}</span>
                      </div>
                      <div className="text-xs font-mono text-text-secondary">{p.id}</div>
                    </td>
                    <td className="p-4">
                        <div className="flex items-center gap-2.5">
                            {hasFlags && <ShieldAlert size={16} className="text-red-600 dark:text-red-400" title="Critical Medical Alert"/>}
                            {isMinor && <Baby size={16} className="text-amber-600 dark:text-amber-400" title="Minor Patient"/>}
                            {p.isPwd && <UserCircle size={16} className="text-amber-600 dark:text-amber-400" title="PWD"/>}
                            {isProvisional && <FileBadge2 size={16} className="text-blue-600 dark:text-blue-400" title="Provisional Registration"/>}
                        </div>
                    </td>
                    <td className="p-4 text-left font-mono text-xs font-bold text-text-secondary whitespace-nowrap">
                        {p.nextVisit ? formatDate(p.nextVisit) : 'None'}
                    </td>
                    <td className="p-4 text-left font-mono text-xs font-bold text-text-secondary whitespace-nowrap">
                        {formatDate(p.lastVisit)}
                    </td>
                    <td className={`p-4 text-center font-black text-sm ${
                        (p.reliabilityScore ?? 100) >= 90 ? 'text-green-600 dark:text-green-400' :
                        (p.reliabilityScore ?? 100) >= 70 ? 'text-amber-600 dark:text-amber-400' :
                        'text-red-600 dark:text-red-400'
                    }`}>
                        {(p.reliabilityScore ?? 100)}%
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

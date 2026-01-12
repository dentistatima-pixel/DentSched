import React, { useState, useMemo } from 'react';
import { Patient, FieldSettings, AuthorityLevel } from '../types';
import { Search, UserPlus, ShieldAlert, ChevronRight, Baby, UserCircle, ArrowLeft } from 'lucide-react';

interface PatientListProps {
  patients: Patient[];
  selectedPatientId: string | null;
  onSelectPatient: (id: string | null) => void;
  onAddPatient: () => void;
  fieldSettings?: FieldSettings; 
  isCollapsed?: boolean;
}

const PatientList: React.FC<PatientListProps> = (props) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { isCollapsed, selectedPatientId, onSelectPatient } = props;
  
  const filteredPatients = useMemo(() => {
    if (!searchTerm) return props.patients;
    const lowercasedTerm = searchTerm.toLowerCase();
    return props.patients.filter(p =>
      p.name.toLowerCase().includes(lowercasedTerm) ||
      p.id.toLowerCase().includes(lowercasedTerm) ||
      p.phone.includes(lowercasedTerm)
    );
  }, [props.patients, searchTerm]);

  const selectedPatient = useMemo(() => 
    props.patients.find(p => p.id === selectedPatientId), 
    [props.patients, selectedPatientId]
  );

  const getCriticalFlags = (patient: Patient) => {
    const flags: { type: string; value: string }[] = [];
    const criticalConditions = props.fieldSettings?.criticalRiskRegistry || [];
    
    (patient.allergies || []).forEach(allergy => {
        if (criticalConditions.includes(allergy) || (patient.allergies || []).length > 1 && allergy !== 'None') {
            flags.push({ type: 'Allergy', value: allergy });
        }
    });

    (patient.medicalConditions || []).forEach(condition => {
        if (criticalConditions.includes(condition) || (patient.medicalConditions || []).length > 1 && condition !== 'None') {
            flags.push({ type: 'Condition', value: condition });
        }
    });

    if (patient.takingBloodThinners) {
        flags.push({ type: 'Alert', value: 'Taking Blood Thinners' });
    }

    return flags;
  };

  if (isCollapsed && selectedPatient) {
    return (
        <div className="h-full w-full flex flex-col items-center bg-teal-900 py-8 gap-10 animate-in fade-in slide-in-from-left-4 duration-500">
            <button 
                onClick={() => onSelectPatient(null)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all active:scale-90 shadow-lg"
                title="Back to Registry"
            >
                <ArrowLeft size={24}/>
            </button>

            <div className="flex flex-col items-center gap-4 group relative">
                <img 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedPatient.name}`} 
                    alt={selectedPatient.name} 
                    className="w-12 h-12 rounded-2xl border-2 border-teal-400 shadow-xl"
                />
                <div className="absolute left-full ml-4 px-3 py-1 bg-lilac-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                    ₱{selectedPatient.currentBalance?.toLocaleString()}
                </div>
            </div>

            <div className="flex-1 w-full flex flex-col items-center gap-4 overflow-y-auto no-scrollbar">
                {props.patients.filter(p => p.id !== selectedPatientId).slice(0, 8).map(p => (
                    <button 
                        key={p.id}
                        onClick={() => onSelectPatient(p.id)}
                        className="w-10 h-10 rounded-xl bg-teal-800/50 hover:bg-teal-700 border border-white/5 flex items-center justify-center transition-all hover:scale-110"
                    >
                        <span className="text-white/40 font-black text-[10px] uppercase">{p.surname[0]}</span>
                    </button>
                ))}
            </div>
        </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
      <div className="p-6 flex items-center justify-between gap-4 shrink-0 border-b">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
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
          onClick={props.onAddPatient}
          className="bg-teal-600 text-white p-3 rounded-2xl font-black shadow-lg shadow-teal-600/30 hover:bg-teal-700 active:scale-95 transition-all flex items-center"
          aria-label="New Patient Admission"
        >
          <UserPlus size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-auto no-scrollbar">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 z-10">
            <tr className="border-b">
              <th className="p-4 w-2"></th>
              <th className="p-4 text-left font-bold uppercase text-slate-500 text-xs tracking-wider">Name</th>
              <th className="p-4 text-right font-bold uppercase text-slate-500 text-xs tracking-wider">Balance</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPatients.map(p => {
              const flags = getCriticalFlags(p);
              const hasFlags = flags.length > 0;
              const isMinor = p.age !== undefined && p.age < 18;
              const isPwdOrMinor = p.isPwd || isMinor;
              const isSelected = p.id === props.selectedPatientId;

              return (
                  <tr 
                    key={p.id}
                    className={`cursor-pointer group relative transition-colors ${
                        isSelected 
                        ? 'bg-teal-100/70'
                        : hasFlags 
                        ? 'bg-red-50/70 hover:bg-red-100/70' 
                        : isPwdOrMinor 
                        ? 'bg-amber-50/70 hover:bg-amber-100/70' 
                        : 'hover:bg-teal-50/70'
                    }`} 
                    onClick={() => props.onSelectPatient(p.id)}
                  >
                    <td className="p-0 w-2">
                      {hasFlags ? (
                          <div className="w-2 h-full absolute top-0 left-0 bg-red-500 shadow-lg group-hover:bg-red-600 transition-colors" />
                      ) : isPwdOrMinor ? (
                          <div className="w-2 h-full absolute top-0 left-0 bg-amber-500 shadow-lg group-hover:bg-amber-600 transition-colors" />
                      ) : null}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{p.name}</div>
                      <div className="text-xs font-mono text-slate-500">{p.id}</div>
                    </td>
                    <td className={`p-4 text-right font-mono font-bold ${p.currentBalance && p.currentBalance > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                      ₱{p.currentBalance?.toLocaleString() || '0'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="w-6 h-6 flex items-center justify-center rounded-full group-hover:bg-slate-200 transition-colors">
                          <ChevronRight className="text-slate-300 group-hover:text-teal-500" size={16}/>
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
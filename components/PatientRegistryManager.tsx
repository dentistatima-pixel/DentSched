
import React, { useState, useMemo } from 'react';
import { Patient, Appointment, AppointmentStatus, FieldSettings } from '../types';
import { Search, UserPlus, CalendarPlus, Phone, Activity } from 'lucide-react';
import { formatDate } from '../constants';

interface PatientRegistryManagerProps {
  patients: Patient[];
  appointments: Appointment[];
  onSelectPatient: (id: string) => void;
  onAddPatient: () => void;
  onBookAppointment: () => void;
  fieldSettings?: FieldSettings;
}

const PatientRegistryManager: React.FC<PatientRegistryManagerProps> = ({ 
  patients, appointments, onSelectPatient, onAddPatient, onBookAppointment, fieldSettings
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getLastTreatment = (patientId: string) => {
    const lastApt = appointments
        .filter(a => a.patientId === patientId && a.status === AppointmentStatus.COMPLETED)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    return lastApt ? lastApt.date : null;
  };

  const getCriticalFlags = (patient: Patient) => {
    const flags: { type: string; value: string }[] = [];
    const criticalConditions = fieldSettings?.criticalRiskRegistry || [];
    
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

  const filteredPatients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return patients.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term) ||
      p.phone.includes(term)
    );
  }, [patients, searchTerm]);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      
      {/* Unified Command Bar */}
      <div className="bg-white p-6 shadow-sm z-20 flex flex-col md:flex-row items-center gap-6 border-b border-slate-100 shrink-0">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search registry by name, mobile, or identifier..."
              className="w-full bg-slate-100 border-2 border-transparent rounded-2xl py-4 pl-14 pr-6 text-slate-800 font-bold placeholder:text-slate-400 outline-none focus:border-teal-500 focus:bg-white transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <button 
                onClick={onAddPatient}
                className="flex-1 md:flex-none bg-teal-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-900/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                  <UserPlus size={18}/> New Admission
              </button>
              <button 
                onClick={onBookAppointment}
                className="flex-1 md:flex-none bg-lilac-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-lilac-900/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                  <CalendarPlus size={18}/> Book Session
              </button>
          </div>
      </div>

      {/* High-Density Registry Table */}
      <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                  <tr className="text-sm font-black uppercase text-slate-500 tracking-widest">
                      <th className="p-0 w-2"></th>
                      <th className="p-6 text-left">Patient ID</th>
                      <th className="p-6 text-left">Name</th>
                      <th className="p-6 text-left">Mobile</th>
                      <th className="p-6 text-right">Financials</th>
                      <th className="p-6 text-center">Last Treatment</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((p, index) => {
                      const lastVisit = getLastTreatment(p.id);
                      const hasDebt = (p.currentBalance || 0) > 0;

                      const flags = getCriticalFlags(p);
                      const hasFlags = flags.length > 0;
                      const isMinor = p.age !== undefined && p.age < 18;
                      const isPwdOrMinor = p.isPwd || isMinor;

                      return (
                          <tr 
                            key={p.id} 
                            onClick={() => onSelectPatient(p.id)}
                            className={`group relative cursor-pointer transition-colors ${
                                hasFlags 
                                ? 'bg-red-200 hover:bg-red-300' 
                                : isPwdOrMinor 
                                ? 'bg-amber-200 hover:bg-amber-300' 
                                : 'hover:bg-slate-100'
                            }`}
                          >
                              <td className="p-0 w-2">
                                {hasFlags ? (
                                    <div className="w-1.5 h-full absolute top-0 left-0 bg-red-500 shadow-lg group-hover:bg-red-600 transition-colors" />
                                ) : isPwdOrMinor ? (
                                    <div className="w-1.5 h-full absolute top-0 left-0 bg-amber-500 shadow-lg group-hover:bg-amber-600 transition-colors" />
                                ) : null}
                              </td>
                              <td className="p-6 font-mono text-xs font-black text-slate-400 group-hover:text-teal-700 transition-colors uppercase">
                                  {p.id}
                              </td>
                              <td className="p-6">
                                  <div className="font-black text-slate-800 text-base uppercase tracking-tight leading-tight group-hover:text-teal-900">{p.name}</div>
                                  <div className="text-[9px] text-slate-400 font-bold uppercase mt-1">Registry Record #{index + 1}</div>
                              </td>
                              <td className="p-6">
                                  <div className="flex items-center gap-2 text-slate-600 font-bold">
                                      <Phone size={14} className="text-slate-300"/>
                                      {p.phone}
                                  </div>
                              </td>
                              <td className={`p-6 text-right font-black text-base ${hasDebt ? 'text-red-600' : 'text-teal-600'}`}>
                                  ₱{p.currentBalance?.toLocaleString() || '0'}
                              </td>
                              <td className="p-6 text-center">
                                  {lastVisit ? (
                                      <div className="inline-flex flex-col items-center">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Completed</span>
                                          <span className="text-xs font-black text-slate-700 uppercase">{formatDate(lastVisit)}</span>
                                      </div>
                                  ) : (
                                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No clinical history</span>
                                  )}
                              </td>
                          </tr>
                      );
                  })}
              </tbody>
          </table>
          {filteredPatients.length === 0 && (
              <div className="p-32 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search size={48} className="text-slate-200" />
                  </div>
                  <h4 className="text-xl font-black text-slate-300 uppercase tracking-widest">No matching identities found</h4>
                  <p className="text-slate-400 mt-2 font-medium">Try broadening your search criteria or register a new admission.</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default PatientRegistryManager;

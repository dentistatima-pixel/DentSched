
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, User, Calendar, Plus, Command, X } from 'lucide-react';
import { Patient, Appointment } from '../types';
import Fuse from 'fuse.js';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  todaysAppointments: Appointment[];
  onNavigate: (type: 'patient' | 'action', payload?: any) => void;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  patients,
  todaysAppointments,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const patientFuse = useMemo(() => new Fuse(patients, {
    keys: ['name', 'id', 'phone'],
    threshold: 0.3,
  }), [patients]);

  const staticActions = useMemo(() => [
    { id: 'newPatient', name: 'New Patient Registration', icon: User },
    { id: 'newAppointment', name: 'New Appointment Booking', icon: Calendar },
  ], []);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return {
        patients: [],
        appointments: [],
        actions: [],
      };
    }

    const lowercasedTerm = searchTerm.toLowerCase();

    const patientResults = patientFuse.search(lowercasedTerm).map(r => r.item).slice(0, 5);
    const appointmentResults = todaysAppointments
      .filter(apt => {
        const patient = patients.find(p => p.id === apt.patientId);
        return patient && patient.name.toLowerCase().includes(lowercasedTerm);
      })
      .slice(0, 3);
    const actionResults = staticActions.filter(action =>
      action.name.toLowerCase().includes(lowercasedTerm)
    );

    return {
      patients: patientResults,
      appointments: appointmentResults,
      actions: actionResults,
    };
  }, [searchTerm, patientFuse, todaysAppointments, patients, staticActions]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const hasResults = searchResults.patients.length > 0 || searchResults.appointments.length > 0 || searchResults.actions.length > 0;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex justify-center p-4 pt-[15vh]" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 h-fit max-h-[70vh]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <Search size={20} className="text-slate-400 shrink-0 ml-2" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Find patients, appts, or actions..."
            className="w-full bg-transparent text-lg font-medium text-slate-800 placeholder:text-slate-400 outline-none"
          />
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {searchTerm.trim() && hasResults ? (
            <div className="p-2 space-y-4">
              {searchResults.patients.length > 0 && (
                <section>
                  <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Patients</h3>
                  <ul className="mt-2 space-y-1">
                    {searchResults.patients.map(p => (
                      <li key={p.id}>
                        <button onClick={() => onNavigate('patient', p.id)} className="w-full text-left flex items-center gap-4 p-3 rounded-lg hover:bg-teal-50 transition-colors">
                          <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold"><User size={16} /></div>
                          <div className="flex-1">
                            <div className="font-bold text-slate-800">{p.name}</div>
                            <div className="text-xs text-slate-500 font-mono">{p.id} &bull; {p.phone}</div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {searchResults.appointments.length > 0 && (
                 <section>
                    <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Schedule</h3>
                    <ul className="mt-2 space-y-1">
                        {searchResults.appointments.map(apt => {
                            const patient = patients.find(p => p.id === apt.patientId);
                            return (
                                <li key={apt.id}>
                                    <button onClick={() => onNavigate('patient', apt.patientId)} className="w-full text-left flex items-center gap-4 p-3 rounded-lg hover:bg-teal-50 transition-colors">
                                        <div className="w-8 h-8 bg-lilac-100 text-lilac-700 rounded-full flex items-center justify-center font-bold"><Calendar size={16} /></div>
                                        <div className="flex-1">
                                            <div className="font-bold text-slate-800">{patient?.name}</div>
                                            <div className="text-xs text-slate-500">{apt.time} - {apt.type}</div>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                 </section>
              )}
              {searchResults.actions.length > 0 && (
                <section>
                  <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</h3>
                  <ul className="mt-2 space-y-1">
                    {searchResults.actions.map(action => (
                      <li key={action.id}>
                        <button onClick={() => onNavigate('action', action.id)} className="w-full text-left flex items-center gap-4 p-3 rounded-lg hover:bg-teal-50 transition-colors">
                            <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold"><action.icon size={16} /></div>
                            <div className="font-bold text-slate-800">{action.name}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          ) : searchTerm.trim() && !hasResults ? (
            <div className="p-16 text-center text-slate-400">
                <p className="font-bold">No results found for "{searchTerm}"</p>
                <p className="text-sm mt-1">Try a different name, ID, or phone number.</p>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-400">
                <Command size={48} className="mx-auto mb-4 opacity-50"/>
                <p className="font-bold">Instant Command Center</p>
                <p className="text-sm mt-1">Quickly find patients, appts, and perform actions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;

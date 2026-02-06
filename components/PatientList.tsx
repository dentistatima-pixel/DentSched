import React, { useState, useMemo, useContext } from 'react';
import { Patient, AuthorityLevel, RecallStatus } from '../types';
import { Search, UserPlus, ShieldAlert, ChevronRight, Baby, UserCircle, ArrowLeft, FileBadge2, CloudOff, Calendar, DollarSign, FileWarning, Hospital } from 'lucide-react';
import Fuse from 'fuse.js';
import { useModal } from '../contexts/ModalContext';
import { usePatient } from '../contexts/PatientContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate } from '../contexts/RouterContext';
import { formatDate, calculateAge } from '../constants';
import { useAppContext } from '../contexts/AppContext';
import DocentSparkle from './DocentSparkle';
import { useDebounce } from '../hooks/useDebounce';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { useAppointments } from '../contexts/AppointmentContext';

type QuickFilterType = 'hasAppointmentToday' | 'overdueBalance' | 'incompleteConsent' | 'requiresClearance' | null;

interface PatientListProps {
  selectedPatientId: string | null;
}

export const PatientList: React.FC<PatientListProps> = ({ selectedPatientId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<QuickFilterType>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { openModal } = useModal();
  const { patients } = usePatient();
  const { appointments } = useAppointments();
  const { fieldSettings } = useSettings();
  const navigate = useNavigate();
  const { currentBranch } = useAppContext();
  
  const swipeHandlers = useSwipeGesture(
    () => navigate('schedule'), // Swipe left
    () => navigate('dashboard')     // Swipe right
  );
  
  const fuse = useMemo(() => new Fuse(patients, {
    keys: ['name', 'id', 'phone', 'nickname'],
    threshold: 0.3,
  }), [patients]);

  const filteredPatients = useMemo(() => {
    let patientPool = patients;

    // Apply quick filter first
    if (activeFilter) {
      const todayStr = new Date().toLocaleDateString('en-CA');
      switch (activeFilter) {
        case 'hasAppointmentToday':
          const patientIdsWithAppt = new Set(appointments.filter(a => a.date === todayStr).map(a => a.patientId));
          patientPool = patientPool.filter(p => patientIdsWithAppt.has(p.id));
          break;
        case 'overdueBalance':
          patientPool = patientPool.filter(p => (p.currentBalance || 0) > 0);
          break;
        case 'incompleteConsent':
           patientPool = patientPool.filter(p => p.recallStatus === RecallStatus.DUE || p.recallStatus === RecallStatus.OVERDUE);
          break;
        case 'requiresClearance':
          const criticalConditions = fieldSettings.criticalRiskRegistry || [];
          patientPool = patientPool.filter(p => 
            p.medicalConditions?.some(c => criticalConditions.includes(c)) &&
            !(p.clearanceRequests?.some(r => r.status === 'Approved'))
          );
          break;
      }
    }

    // Then apply search term
    if (!debouncedSearchTerm.trim()) {
      return patientPool.slice(0, 100);
    }
    const searchFuse = new Fuse(patientPool, { keys: ['name', 'id', 'phone', 'nickname'], threshold: 0.3 });
    return searchFuse.search(debouncedSearchTerm).map(result => result.item).slice(0, 100);
  }, [patients, debouncedSearchTerm, fuse, activeFilter, appointments, fieldSettings]);

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

  const QuickFilterChip: React.FC<{
    onClick: () => void;
    label: string;
    icon: React.ElementType;
    isActive: boolean;
  }> = ({ onClick, label, icon: Icon, isActive }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase transition-all shadow-sm border-2 ${
        isActive
          ? 'bg-teal-600 text-white border-teal-700 shadow-lg'
          : 'bg-white text-slate-500 border-slate-200 hover:bg-teal-50 hover:text-teal-700'
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );

  return (
    <div {...swipeHandlers} className="h-full w-full flex flex-col bg-bg-secondary rounded-[2.5rem] shadow-sm border border-border-primary">
      <div className="p-6 shrink-0 border-b border-border-primary space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={20} />
            <input 
              type="text" 
              placeholder="Search registry..."
              className="input w-full pl-12"
              aria-label="Search patients"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setActiveFilter(null); }}
            />
          </div>
          <button 
            onClick={() => openModal('patientRegistration', { currentBranch })}
            className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-600/30 hover:bg-teal-700 active:scale-95 transition-all flex items-center"
            aria-label="New Patient Registration"
          >
            New Registration
          </button>
        </div>
        <div className="flex items-center gap-2">
            <QuickFilterChip onClick={() => setActiveFilter(f => f === 'hasAppointmentToday' ? null : 'hasAppointmentToday')} label="Today's Patients" icon={Calendar} isActive={activeFilter === 'hasAppointmentToday'} />
            <QuickFilterChip onClick={() => setActiveFilter(f => f === 'overdueBalance' ? null : 'overdueBalance')} label="Outstanding Balance" icon={DollarSign} isActive={activeFilter === 'overdueBalance'} />
            <QuickFilterChip onClick={() => setActiveFilter(f => f === 'incompleteConsent' ? null : 'incompleteConsent')} label="Missing Consent" icon={FileWarning} isActive={activeFilter === 'incompleteConsent'} />
            <QuickFilterChip onClick={() => setActiveFilter(f => f === 'requiresClearance' ? null : 'requiresClearance')} label="Needs Clearance" icon={Hospital} isActive={activeFilter === 'requiresClearance'} />
        </div>
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
              <th className="p-4 text-center font-bold uppercase text-text-secondary text-xs tracking-wider flex items-center gap-1 justify-center">Reliability <DocentSparkle elementId="reliabilityScore" context="Patient Registry Table Header" /></th>
              <th className="p-4 text-right font-bold uppercase text-text-secondary text-xs tracking-wider">Balance</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-secondary">
            {filteredPatients.map(p => {
              const flags = getCriticalFlags(p);
              const hasFlags = flags.length > 0;
              const isMinor = (calculateAge(p.dob) || 99) < 18;
              const isPwdOrMinor = p.isPwd || isMinor;
              const isSelected = p.id === selectedPatientId;
              const isProvisional = p.registrationStatus === 'Provisional';
              const isPendingSync = p.isPendingSync;

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
                            {isPendingSync && <span title="Pending Sync"><CloudOff size={16} className="text-lilac-600 dark:text-lilac-400 animate-pulse"/></span>}
                            {hasFlags && <span title={`Critical Medical Alert: ${flags.map(f=>f.value).join(', ')}`}><ShieldAlert size={16} className="text-red-600 dark:text-red-400"/></span>}
                            {isMinor && <span title="Minor Patient"><Baby size={16} className="text-amber-600 dark:text-amber-400"/></span>}
                            {p.isPwd && <span title="PWD"><UserCircle size={16} className="text-amber-600 dark:text-amber-400"/></span>}
                            {isProvisional && <span title="Provisional Registration"><FileBadge2 size={16} className="text-blue-600 dark:text-blue-400"/></span>}
                        </div>
                    </td>
                    <td className="p-4 text-left font-mono text-xs font-bold">{formatDate(p.nextVisit)}</td>
                    <td className="p-4 text-left font-mono text-xs">{formatDate(p.lastVisit)}</td>
                    <td className="p-4 text-center">
                      <div className={`font-black text-lg ${p.reliabilityScore != null && p.reliabilityScore < 70 ? 'text-red-600' : p.reliabilityScore != null && p.reliabilityScore < 90 ? 'text-amber-600' : 'text-teal-600'}`}>
                        {p.reliabilityScore ?? 'N/A'}%
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-red-700">
                      {p.currentBalance && p.currentBalance > 0 ? `₱${p.currentBalance.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-4">
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
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
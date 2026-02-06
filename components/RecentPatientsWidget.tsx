import React, { useMemo } from 'react';
import { usePatient } from '../contexts/PatientContext';
import { useNavigate } from '../contexts/RouterContext';
import { History, User } from 'lucide-react';
import { formatDate } from '../constants';

export const RecentPatientsWidget: React.FC = () => {
    const { patients } = usePatient();
    const navigate = useNavigate();

    const recentPatients = useMemo(() => {
        return [...patients]
            .sort((a, b) => {
                const dateA = a.lastDigitalUpdate || a.lastVisit;
                const dateB = b.lastDigitalUpdate || b.lastVisit;
                if (dateA === 'First Visit') return 1;
                if (dateB === 'First Visit') return -1;
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            })
            .slice(0, 5);
    }, [patients]);

    return (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] flex items-center gap-3 mb-4">
                <History size={18} className="text-blue-600"/>
                Recent Patients
            </h3>
            <div className="space-y-3">
                {recentPatients.map(patient => (
                    <button 
                        key={patient.id}
                        onClick={() => navigate(`patients/${patient.id}`)}
                        className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                    >
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center font-black text-teal-700 dark:text-teal-400">
                            {patient.firstName[0]}{patient.surname[0]}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{patient.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Last activity: {formatDate(patient.lastDigitalUpdate || patient.lastVisit)}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
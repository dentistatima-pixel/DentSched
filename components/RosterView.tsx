import React from 'react';
import { User, FieldSettings, UserRole } from '../types';
import { Users2, MapPin, ArrowLeft } from 'lucide-react';

interface RosterViewProps {
  staff: User[];
  fieldSettings: FieldSettings;
  currentUser: User;
  onUpdateStaffRoster: (staffId: string, day: string, branch: string) => void;
  onBack?: () => void;
}

const RosterView: React.FC<RosterViewProps> = ({ staff, fieldSettings, currentUser, onUpdateStaffRoster, onBack }) => {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dentists = staff.filter(s => s.role === UserRole.DENTIST);
  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        {onBack && (
          <button onClick={onBack} className="bg-white p-4 rounded-full shadow-sm border hover:bg-slate-100 transition-all active:scale-90" aria-label="Back to Admin Hub">
              <ArrowLeft size={24} className="text-slate-600"/>
          </button>
        )}
        <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-xl">
          <Users2 size={36} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">
            Weekly Roster
          </h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
            Practitioner and staff branch assignments.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-500 tracking-[0.2em]">
              <tr>
                <th className="p-5 text-left">Practitioner</th>
                {weekDays.map(day => (
                  <th key={day} className="p-5 text-center">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dentists.map(dentist => (
                <tr key={dentist.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <img src={dentist.avatar} alt={dentist.name} className="w-10 h-10 rounded-full border-2 border-white shadow" />
                      <div>
                        <div className="font-black text-slate-800 uppercase tracking-tight">{dentist.name}</div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">{dentist.specialization}</div>
                      </div>
                    </div>
                  </td>
                  {weekDays.map(day => {
                    const assignment = dentist.roster?.[day];
                    return (
                      <td key={day} className="p-5 text-center">
                        {isAdmin ? (
                          <select
                            value={assignment || 'Off'}
                            onChange={(e) => onUpdateStaffRoster(dentist.id, day, e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg p-2 text-[10px] font-bold uppercase tracking-tight focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                          >
                            <option value="Off">Day Off</option>
                            {fieldSettings.branches.map(branch => (
                              <option key={branch} value={branch}>{branch}</option>
                            ))}
                          </select>
                        ) : (
                          assignment ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-800 rounded-full text-[10px] font-black uppercase border border-teal-100 shadow-sm">
                              <MapPin size={12} />
                              {assignment}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {dentists.length === 0 && (
          <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest opacity-40">
            No roster data available for practitioners.
          </div>
        )}
      </div>
    </div>
  );
};

export default RosterView;
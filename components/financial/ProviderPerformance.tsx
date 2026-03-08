import React, { useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { User, Appointment, AppointmentStatus, ProcedureItem, UserRole } from '../../types';

interface ProviderPerformanceProps {
    appointments: Appointment[];
    staff: User[];
    procedures: ProcedureItem[];
}

export const ProviderPerformance: React.FC<ProviderPerformanceProps> = ({ 
    appointments, staff, procedures 
}) => {
    const providerStats = useMemo(() => {
        const stats: Record<string, { 
            id: string; 
            name: string; 
            production: number; 
            patientCount: number; 
            completedCount: number;
        }> = {};

        // Initialize stats for all dentists
        staff.filter(u => u.role === UserRole.DENTIST).forEach(dentist => {
            stats[dentist.id] = {
                id: dentist.id,
                name: dentist.name,
                production: 0,
                patientCount: 0,
                completedCount: 0
            };
        });

        // Process appointments
        appointments.forEach(apt => {
            if (apt.status === AppointmentStatus.COMPLETED && stats[apt.providerId]) {
                stats[apt.providerId].completedCount++;
                
                // Estimate production based on procedure default price
                // In a real app, we would look up the specific price charged
                const procedure = procedures.find(p => p.name === apt.type);
                const price = procedure?.defaultPrice || 0;
                stats[apt.providerId].production += price;
            }
        });

        // Calculate unique patients per provider
        Object.values(stats).forEach(stat => {
            const uniquePatients = new Set(
                appointments
                    .filter(a => a.providerId === stat.id && a.status === AppointmentStatus.COMPLETED)
                    .map(a => a.patientId)
            );
            stat.patientCount = uniquePatients.size;
        });

        return Object.values(stats).sort((a, b) => b.production - a.production);
    }, [appointments, staff, procedures]);

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Provider Performance</h3>
            
            <div className="h-[350px] w-full mb-8">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={providerStats} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} tickFormatter={(value) => `₱${value/1000}k`} />
                        <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12, fontWeight: 500}} />
                        <Tooltip 
                            cursor={{fill: '#F1F5F9'}}
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            formatter={(value: number | undefined) => [`₱${(value || 0).toLocaleString()}`, 'Production']}
                        />
                        <Bar dataKey="production" name="Production" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={32} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                        <tr>
                            <th className="px-4 py-3 rounded-l-lg">Provider</th>
                            <th className="px-4 py-3 text-right">Patients Seen</th>
                            <th className="px-4 py-3 text-right">Completed Apts</th>
                            <th className="px-4 py-3 text-right rounded-r-lg">Est. Production</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {providerStats.map((stat) => (
                            <tr key={stat.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-800">{stat.name}</td>
                                <td className="px-4 py-3 text-right text-slate-600">{stat.patientCount}</td>
                                <td className="px-4 py-3 text-right text-slate-600">{stat.completedCount}</td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-indigo-600">
                                    ₱{stat.production.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

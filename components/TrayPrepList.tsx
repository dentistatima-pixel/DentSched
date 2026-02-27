import React, { useMemo } from 'react';
import { Appointment, AppointmentStatus, Patient, ProcedureItem, FieldSettings } from '../types';
import { ClipboardList, CheckSquare, Clock, AlertCircle, Package } from 'lucide-react';
import { formatDate } from '../constants';
import { useInventory } from '../contexts/InventoryContext';

interface TrayPrepListProps {
    appointments: Appointment[];
    patients: Patient[];
    settings: FieldSettings;
}

export const TrayPrepList: React.FC<TrayPrepListProps> = ({ appointments, patients, settings }) => {
    const { stock } = useInventory();
    
    const prepItems = useMemo(() => {
        // Filter for upcoming appointments today that are not yet completed or cancelled
        const upcoming = appointments.filter(a => 
            [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.ARRIVED].includes(a.status)
        ).sort((a, b) => a.time.localeCompare(b.time));

        return upcoming.map(apt => {
            const patient = patients.find(p => p.id === apt.patientId);
            const procedure = settings.procedures.find(p => p.name === apt.type);
            
            return {
                id: apt.id,
                time: apt.time,
                patientName: patient?.name || 'Unknown Patient',
                procedureName: apt.type,
                status: apt.status,
                traySetup: procedure?.traySetup || [],
                billOfMaterials: procedure?.billOfMaterials || [],
                notes: apt.notes
            };
        });
    }, [appointments, patients, settings]);

    if (prepItems.length === 0) {
        return (
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckSquare size={32} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-black text-slate-800">All Trays Prepared</h3>
                <p className="text-slate-500 text-sm mt-2">No upcoming appointments require tray setup at this time.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <ClipboardList className="text-teal-600" />
                    Clinical Tray Prep
                </h2>
                <div className="bg-teal-100 text-teal-800 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                    {prepItems.length} Setups Pending
                </div>
            </div>

            <div className="grid gap-6">
                {prepItems.map(item => (
                    <div key={item.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-mono text-lg font-black text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                                        {new Date(`2000-01-01T${item.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                        item.status === AppointmentStatus.ARRIVED ? 'bg-green-100 text-green-700 border-green-200' : 
                                        'bg-blue-100 text-blue-700 border-blue-200'
                                    }`}>
                                        {item.status}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">{item.patientName}</h3>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mt-1">{item.procedureName}</p>
                            </div>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Tools / Tray Setup */}
                            {item.traySetup.length > 0 ? (
                                <div>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <CheckSquare size={14} /> Required Instruments (Tools)
                                    </h4>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {item.traySetup.map((tool, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5" />
                                                <span className="font-medium">{tool}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
                                    <AlertCircle size={20} />
                                    <span className="text-sm font-bold">No standard instrument setup defined.</span>
                                </div>
                            )}

                            {/* Consumables / BOM */}
                            {item.billOfMaterials.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Package size={14} /> Required Consumables
                                    </h4>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {item.billOfMaterials.map((bom, idx) => {
                                            const stockItem = stock.find(s => s.id === bom.stockItemId);
                                            return (
                                                <li key={idx} className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-5 h-5 rounded-full bg-teal-100 border-2 border-teal-200 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-teal-700">
                                                            {bom.quantity}
                                                        </div>
                                                        <span className="font-medium">{stockItem?.name || 'Unknown Item'}</span>
                                                    </div>
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{stockItem?.dispensingUnit || 'units'}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                            
                            {item.notes && (
                                <div className="pt-6 border-t border-slate-100">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Clinical Notes</h4>
                                    <p className="text-sm text-slate-600 italic bg-yellow-50 p-4 rounded-xl border border-yellow-100">"{item.notes}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

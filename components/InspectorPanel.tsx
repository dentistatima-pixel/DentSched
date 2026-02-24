import React from 'react';
import { X, Droplet, Heart, ShieldCheck } from 'lucide-react';
import { Appointment, Patient, AppointmentStatus } from '../types';

interface InspectorPanelProps {
    inspected: { apt: Appointment, patient: Patient } | null;
    onClose: () => void;
    onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => void;
    onOpenChart: (patientId: string, prefill: any) => void;
}

const InspectorPanel: React.FC<InspectorPanelProps> = ({ inspected, onClose, onUpdateStatus, onOpenChart }) => {
    const hasMedicalAlerts = inspected && (
        (inspected.patient.allergies && inspected.patient.allergies.some(a => a.toLowerCase() !== 'none')) ||
        (inspected.patient.medicalConditions && inspected.patient.medicalConditions.some(c => c.toLowerCase() !== 'none'))
    );

    const handleOpenChartWithPrefill = () => {
        if (inspected) {
            const prefill = {
                prefill_procedure: inspected.apt.type,
                prefill_resourceId: inspected.apt.resourceId
            };
            onOpenChart(inspected.patient.id, prefill);
        }
    };
    
    return (
        <div className={`inspector-panel ${inspected ? 'open' : ''}`} role="dialog" aria-labelledby="inspector-title" aria-hidden={!inspected}>
          {inspected && (
              <div className="h-full flex flex-col p-6 animate-in fade-in">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
                      <h3 id="inspector-title" className="font-black text-xl uppercase tracking-tight text-slate-800 dark:text-slate-100">{inspected.patient.name}</h3>
                      <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500"><X/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar py-6 space-y-6">
                      <div>
                          <h4 className="label text-xs">Action Bar</h4>
                          <div className="grid grid-cols-2 gap-3">
                              <button onClick={() => onUpdateStatus(inspected.apt.id, AppointmentStatus.ARRIVED)} className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-black uppercase">Arrived</button>
                              <button onClick={() => onUpdateStatus(inspected.apt.id, AppointmentStatus.TREATING)} className="bg-lilac-100 text-lilac-800 p-3 rounded-lg text-xs font-black uppercase">Treat</button>
                              <button onClick={() => onUpdateStatus(inspected.apt.id, AppointmentStatus.COMPLETED)} className="bg-teal-100 text-teal-800 p-3 rounded-lg text-xs font-black uppercase col-span-2">Complete</button>
                          </div>
                      </div>
                       <div>
                          <h4 className="label text-xs">Alerts</h4>
                          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg space-y-2 border border-red-100 dark:border-red-800">
                                {(inspected.patient.allergies || []).filter(a => a !== 'None').map(a => <div key={a} className="flex items-center gap-2 text-xs font-bold text-red-800 dark:text-red-300"><Droplet size={14}/> {a}</div>)}
                                {(inspected.patient.medicalConditions || []).filter(c => c !== 'None').map(c => <div key={c} className="flex items-center gap-2 text-xs font-bold text-red-800 dark:text-red-300"><Heart size={14}/> {c}</div>)}
                          </div>
                          {hasMedicalAlerts && (
                            <div className="w-full mt-3 bg-red-100 text-red-700 p-3 rounded-lg text-xs font-black uppercase text-center">
                              ⚠️ Medical Alerts Present — Review Before Procedure
                            </div>
                          )}
                       </div>
                  </div>
                  <div className="shrink-0 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <button onClick={handleOpenChartWithPrefill} className="w-full py-4 bg-teal-600 text-white rounded-xl text-xs font-black uppercase">Open Full Chart</button>
                  </div>
              </div>
          )}
      </div>
    );
};

export default InspectorPanel;
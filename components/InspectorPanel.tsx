import React, { useState, useEffect } from 'react';
import { X, Droplet, Heart, Activity, Server, Database, Flag, User } from 'lucide-react';
import { Appointment, Patient, AppointmentStatus } from '../types';
import { useInventory } from '../contexts/InventoryContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAppContext } from '../contexts/AppContext';
import { useModal } from '../contexts/ModalContext';

interface InspectorPanelProps {
    inspected: { apt: Appointment, patient: Patient } | null;
    mode?: 'clinical' | 'system';
    onClose: () => void;
    onUpdateStatus?: (appointmentId: string, status: AppointmentStatus, additionalData?: any) => void;
    onOpenChart?: (patientId: string, prefill: any) => void;
}

const InspectorPanel: React.FC<InspectorPanelProps> = ({ inspected, mode = 'clinical', onClose, onUpdateStatus, onOpenChart }) => {
    const { transfers } = useInventory();
    const { fieldSettings } = useSettings();
    const { currentUser } = useAppContext();
    
    const { showModal } = useModal();
    
    // Mock audit log tail (in a real app, this would come from an audit service)
    const [auditTail, setAuditTail] = useState<string[]>([]);

    useEffect(() => {
        if (mode === 'system') {
            // Simulate fetching recent audit logs
            setAuditTail([
                `[${new Date().toLocaleTimeString()}] System: Inspector Panel opened`,
                `[${new Date(Date.now() - 60000).toLocaleTimeString()}] Sync: Inventory delta received`,
                `[${new Date(Date.now() - 120000).toLocaleTimeString()}] Auth: User ${currentUser?.name} active`,
            ]);
        }
    }, [mode, currentUser]);

    if (mode === 'system') {
        return (
            <div className={`inspector-panel open`} role="dialog" aria-labelledby="inspector-title">
                <div className="h-full flex flex-col p-6 animate-in fade-in bg-slate-900 text-slate-300">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-700 shrink-0">
                        <div className="flex items-center gap-2">
                            <Activity className="text-teal-400" />
                            <h3 id="inspector-title" className="font-black text-xl uppercase tracking-tight text-white">System Inspector</h3>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white"><X/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar py-6 space-y-6">
                        
                        {/* Sync Queue */}
                        <div>
                            <h4 className="label text-xs font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2"><Server size={12}/> Sync Queue</h4>
                            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                <div className="flex justify-between text-xs mb-2">
                                    <span>Pending Transfers:</span>
                                    <span className="font-mono text-teal-400">{transfers.filter(t => t.status !== 'Completed').length}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span>Last Sync:</span>
                                    <span className="font-mono text-slate-400">{new Date().toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Feature Flags */}
                        <div>
                            <h4 className="label text-xs font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2"><Flag size={12}/> Feature Flags</h4>
                            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-2">
                                {Object.entries(fieldSettings.features || {}).map(([key, value]) => (
                                    <div key={key} className="flex justify-between text-xs">
                                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                        <span className={`font-black ${value ? 'text-green-400' : 'text-red-400'}`}>{value ? 'ON' : 'OFF'}</span>
                                    </div>
                                ))}
                                {(!fieldSettings.features || Object.keys(fieldSettings.features).length === 0) && <span className="text-xs italic text-slate-500">No flags defined</span>}
                            </div>
                        </div>

                        {/* Context State */}
                        <div>
                            <h4 className="label text-xs font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2"><User size={12}/> Current Context</h4>
                            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-2 text-xs font-mono">
                                <div>User: {currentUser?.name} ({currentUser?.role})</div>
                                <div>Branch: {currentUser?.defaultBranch || 'N/A'}</div>
                                <div>Kiosk Mode: {window.location.pathname.includes('kiosk') ? 'Active' : 'Inactive'}</div>
                            </div>
                        </div>

                        {/* Audit Log Tail */}
                        <div>
                            <h4 className="label text-xs font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2"><Database size={12}/> Audit Log Tail</h4>
                            <div className="bg-black/50 p-4 rounded-lg border border-slate-700 font-mono text-[10px] space-y-1 h-32 overflow-y-auto">
                                {auditTail.map((log, i) => (
                                    <div key={i} className="text-slate-400 border-b border-slate-800 pb-1 mb-1 last:border-0">{log}</div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    const hasMedicalAlerts = inspected && (
        (inspected.patient.allergies && inspected.patient.allergies.some(a => a.toLowerCase() !== 'none')) ||
        (inspected.patient.medicalConditions && inspected.patient.medicalConditions.some(c => c.toLowerCase() !== 'none'))
    );

    const handleOpenChartWithPrefill = () => {
        if (inspected && onOpenChart) {
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
                              {onUpdateStatus && (
                                <>
                                  <button onClick={() => onUpdateStatus(inspected.apt.id, AppointmentStatus.ARRIVED)} className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-black uppercase">Arrived</button>
                                  <button onClick={() => onUpdateStatus(inspected.apt.id, AppointmentStatus.IN_TREATMENT)} className="bg-lilac-100 text-lilac-800 p-3 rounded-lg text-xs font-black uppercase">Treat</button>
                                  <button onClick={() => onUpdateStatus(inspected.apt.id, AppointmentStatus.COMPLETED)} className="bg-teal-100 text-teal-800 p-3 rounded-lg text-xs font-black uppercase col-span-2">Complete</button>
                                  <button onClick={() => showModal('ePrescription', { patient: inspected.patient })} className="bg-blue-100 text-blue-800 p-3 rounded-lg text-xs font-black uppercase col-span-2">Prescribe</button>
                                  <button onClick={() => showModal('cancellation', { appointment: inspected.apt, onConfirm: (reason: string) => onUpdateStatus(inspected.apt.id, AppointmentStatus.CANCELLED, { cancellationReason: reason }) })} className="bg-red-50 text-red-800 p-3 rounded-lg text-xs font-black uppercase col-span-2">Cancel</button>
                                </>
                              )}
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
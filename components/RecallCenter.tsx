
import React from 'react';
import { Patient, RecallStatus } from '../types';
import { Phone, MessageSquare, History, UserCheck, UserX, ArrowLeft } from 'lucide-react';
import { useModal } from '../contexts/ModalContext';

interface RecallCenterProps {
  patients: Patient[];
  onUpdatePatientRecall: (patientId: string, status: RecallStatus) => void;
  onBack?: () => void;
}

const RecallCenter: React.FC<RecallCenterProps> = ({ patients, onUpdatePatientRecall, onBack }) => {
  const { showModal } = useModal();

  const recallPatients = {
    due: patients.filter(p => p.recallStatus === RecallStatus.DUE),
    contacted: patients.filter(p => p.recallStatus === RecallStatus.CONTACTED),
    overdue: patients.filter(p => p.recallStatus === RecallStatus.OVERDUE),
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, patientId: string) => {
    e.dataTransfer.setData("patientId", patientId);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: RecallStatus) => {
    e.preventDefault();
    const patientId = e.dataTransfer.getData("patientId");
    onUpdatePatientRecall(patientId, status);
  };

  const allowDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const Column: React.FC<{ title: string, patients: Patient[], status: RecallStatus, icon: React.ElementType, color: string }> = ({ title, patients, status, icon: Icon, color }) => (
    <div 
      className="bg-slate-100 rounded-3xl p-4 flex flex-col min-w-[300px]"
      onDrop={(e) => handleDrop(e, status)}
      onDragOver={allowDrop}
    >
      <div className={`flex items-center gap-3 p-3 mb-4 rounded-2xl bg-white border-b-4 ${color}`}>
        <Icon size={20} />
        <h3 className="font-black text-sm uppercase tracking-widest text-slate-700">{title}</h3>
        <span className="ml-auto bg-slate-200 text-slate-600 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">{patients.length}</span>
      </div>
      <div className="space-y-3 overflow-y-auto no-scrollbar pb-2 flex-1">
        {patients.map(p => (
          <div 
            key={p.id} 
            draggable 
            onDragStart={(e) => handleDragStart(e, p.id)}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing"
          >
            <div className="font-bold text-slate-800">{p.name}</div>
            <div className="text-xs text-slate-500 mt-1">Last Visit: {p.lastVisit}</div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                <button onClick={() => showModal('logCommunication', { patientId: p.id })} className="flex items-center gap-1 text-xs text-slate-500 hover:text-teal-600"><Phone size={12}/> Log Call</button>
                <button onClick={() => showModal('sendSms', { patientId: p.id })} className="flex items-center gap-1 text-xs text-slate-500 hover:text-teal-600"><MessageSquare size={12}/> Send SMS</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
            {onBack && (
              <button onClick={onBack} className="bg-white p-4 rounded-full shadow-sm border hover:bg-slate-100 transition-all active:scale-90" aria-label="Back to Admin Hub">
                  <ArrowLeft size={24} className="text-slate-600"/>
              </button>
            )}
            <div className="bg-teal-600 p-4 rounded-3xl text-white shadow-xl"><History size={36} /></div>
            <div>
                <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">Recall Center</h1>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Patient Retention Workflow</p>
            </div>
        </div>
        <div className="flex-1 grid gap-6 admin-hub-grid pb-4">
            <Column title="Due for Recall" patients={recallPatients.due} status={RecallStatus.DUE} icon={UserCheck} color="border-teal-500" />
            <Column title="Contacted" patients={recallPatients.contacted} status={RecallStatus.CONTACTED} icon={Phone} color="border-blue-500" />
            <Column title="Overdue" patients={recallPatients.overdue} status={RecallStatus.OVERDUE} icon={UserX} color="border-red-500" />
        </div>
    </div>
  );
};

export default RecallCenter;

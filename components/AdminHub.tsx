import React from 'react';
import { DollarSign, Package, ChevronRight, History, Send, Users2, UserX, ArrowLeft, CloudOff, FileWarning, ShieldAlert, MessageSquare, FileBadge2, AlertTriangle, FileSearch, UserCheck, Timer, Shield, FileText, User as UserIcon, Check, Phone, Edit, MessageCircle, RefreshCcw } from 'lucide-react';
import { Appointment, Patient, SyncConflict, User, ClinicalIncident } from '../types';
import { formatDate } from '../constants';

interface AdminHubProps {
  adminQueue: string | null;
  appointments: Appointment[];
  patients: Patient[];
  incidents: ClinicalIncident[];
  staff: User[];
  onVerifyDowntime: (id: string) => void;
  onVerifyMedHistory: (id: string) => void;
  onConfirmFollowUp: (id: string) => void;
  onSavePatient: (patient: Partial<Patient>) => void;
  onResolveIncident: (id: string) => void;
  onShowModal: (type: string, props: any) => void;
  onNavigate: (path: string) => void;
}

const AdminHub: React.FC<AdminHubProps> = ({ 
  adminQueue,
  appointments,
  patients,
  incidents,
  staff,
  onVerifyDowntime,
  onVerifyMedHistory,
  onConfirmFollowUp,
  onSavePatient,
  onResolveIncident,
  onShowModal,
  onNavigate,
}) => {
  const syncConflicts: SyncConflict[] = []; // Placeholder

  const onEditPatient = (patient: Patient) => {
    onShowModal('patientRegistration', { initialData: patient });
  };
  
  const onClearProfessionalismReview = async (patientId: string, noteId: string) => {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;

      const updatedChart = patient.dentalChart?.map(note => 
        note.id === noteId ? { ...note, needsProfessionalismReview: false } : note
      );
      await onSavePatient({ ...patient, dentalChart: updatedChart });
  };

  const professionalismReviews = patients.flatMap(p => 
    (p.dentalChart || [])
        .filter(note => note.needsProfessionalismReview)
        .map(note => ({ ...note, patientName: p.name, patientId: p.id }))
  );

  const supervisionReviews = patients.flatMap(p => 
      (p.dentalChart || [])
          .filter(note => note.isPendingSupervision)
          .map(note => ({ ...note, patientName: p.name, patientId: p.id }))
  );

  const sealingDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const notesPastDeadline = patients.flatMap(p => 
      (p.dentalChart || [])
          .filter(note => !note.sealedHash && new Date(note.date) < sealingDeadline)
          .map(note => ({ ...note, patientName: p.name, patientId: p.id }))
  );

  const workQueues = {
    downtime: {
      title: 'Downtime Entries',
      icon: FileWarning,
      items: appointments.filter(a => a.entryMode === 'MANUAL' && !a.reconciled)
    },
    med_history: {
      title: 'Medical History Verifications',
      icon: ShieldAlert,
      items: appointments.filter(a => a.status === 'Arrived' && !a.medHistoryVerified)
    },
    post_op: {
      title: 'Post-Op Follow-Up',
      icon: MessageSquare,
      items: appointments.filter(a => ['Surgery', 'Extraction'].includes(a.type) && a.status === 'Completed' && !a.followUpConfirmed)
    },
    registrations: {
      title: 'Pending Registrations',
      icon: FileBadge2,
      items: patients.filter(p => p.registrationStatus === 'Provisional')
    },
    sync: {
      title: 'Sync Conflicts',
      icon: CloudOff,
      items: syncConflicts
    },
    incidents: {
        title: 'Clinical Incidents',
        icon: AlertTriangle,
        items: incidents.filter(i => !i.advisoryCallSigned)
    },
    professionalism: {
        title: 'Professionalism Review',
        icon: FileSearch,
        items: professionalismReviews
    },
    supervision: {
        title: 'Supervision Queue',
        icon: UserCheck,
        items: supervisionReviews
    },
    unsealed: {
        title: 'Unsealed Notes (Past 24h)',
        icon: Timer,
        items: notesPastDeadline
    },
  };

  const ActionCard = ({ title, icon: Icon, onClick, color }: { title: string, icon: React.ElementType, onClick: () => void, color: string }) => (
      <button onClick={onClick} className="bg-white p-4 rounded-2xl border-4 border-white shadow-lg flex items-center justify-between group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className={`${color} p-3 rounded-xl text-white shadow-md`}>
                <Icon size={22}/>
            </div>
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">{title}</h3>
          </div>
          <ChevronRight size={20} className="text-slate-300 group-hover:text-teal-500 transition-colors"/>
      </button>
  );

  if (adminQueue) {
      const queue = workQueues[adminQueue as keyof typeof workQueues];
      const items = queue ? queue.items : [];
      const getPatientName = (patientId: string) => patients.find(p => p.id === patientId)?.name || 'Unknown Patient';
      const getStaffName = (staffId: string) => staff.find(s => s.id === staffId)?.name || 'Unknown Staff';

      return (
          <div className="animate-in fade-in duration-500">
              <button onClick={() => onNavigate('admin')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-bold mb-6 hover:bg-slate-200 transition-colors">
                  <ArrowLeft size={16}/> Back to Hub
              </button>
              
              {queue && (
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-100 text-red-600 p-3 rounded-xl shadow-sm">
                            <queue.icon size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800">{queue.title}</h2>
                            <p className="text-sm font-bold text-slate-500">{items.length} item(s) requiring action</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {items.length === 0 && (
                            <div className="p-10 bg-slate-100 rounded-2xl text-center text-slate-500">
                                <p>This queue is empty.</p>
                            </div>
                        )}

                        {adminQueue === 'downtime' && items.map((apt: any) => (
                            <div key={apt.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center group">
                                <div className="flex items-center gap-4"><div className="bg-amber-100 text-amber-700 p-3 rounded-lg"><FileWarning size={20} /></div><div><div className="font-black text-slate-800 text-sm uppercase">{getPatientName(apt.patientId)}</div><div className="text-xs text-slate-500 font-bold">{apt.type} - {formatDate(apt.date)} @ {apt.time}</div></div></div>
                                <button onClick={() => onVerifyDowntime(apt.id)} className="px-4 py-2 bg-teal-100 text-teal-700 text-xs font-black uppercase rounded-lg flex items-center gap-2"><RefreshCcw size={14}/> Reconcile</button>
                            </div>
                        ))}
                        
                        {adminQueue === 'med_history' && items.map((apt: any) => (
                            <div key={apt.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center group">
                                <div className="flex items-center gap-4"><div className="bg-red-100 text-red-700 p-3 rounded-lg"><ShieldAlert size={20} /></div><div><div className="font-black text-slate-800 text-sm uppercase">{getPatientName(apt.patientId)}</div><div className="text-xs text-slate-500 font-bold">{apt.type} with {getStaffName(apt.providerId)}</div></div></div>
                                <button onClick={() => onVerifyMedHistory(apt.id)} className="px-4 py-2 bg-teal-100 text-teal-700 text-xs font-black uppercase rounded-lg flex items-center gap-2"><Check size={14}/> Verify</button>
                            </div>
                        ))}

                        {adminQueue === 'post_op' && items.map((apt: any) => (
                             <div key={apt.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center group">
                                <div className="flex items-center gap-4"><div className="bg-blue-100 text-blue-700 p-3 rounded-lg"><MessageCircle size={20} /></div><div><div className="font-black text-slate-800 text-sm uppercase">{getPatientName(apt.patientId)}</div><div className="text-xs text-slate-500 font-bold">{apt.type} on {formatDate(apt.date)}</div></div></div>
                                <button onClick={() => onConfirmFollowUp(apt.id)} className="px-4 py-2 bg-teal-100 text-teal-700 text-xs font-black uppercase rounded-lg flex items-center gap-2"><Phone size={14}/> Confirm Call</button>
                            </div>
                        ))}

                        {adminQueue === 'registrations' && items.map((p: any) => (
                            <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center group">
                                <div className="flex items-center gap-4"><div className="bg-violet-100 text-violet-700 p-3 rounded-lg"><FileBadge2 size={20} /></div><div><div className="font-black text-slate-800 text-sm uppercase">{p.name}</div><div className="text-xs text-slate-500 font-bold">{p.phone}</div></div></div>
                                <button onClick={() => onEditPatient(p)} className="px-4 py-2 bg-teal-100 text-teal-700 text-xs font-black uppercase rounded-lg flex items-center gap-2"><Edit size={14}/> Complete Form</button>
                            </div>
                        ))}
                        
                        {adminQueue === 'incidents' && items.map((i: any) => (
                            <div key={i.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center group">
                                <div className="flex items-center gap-4"><div className="bg-orange-100 text-orange-700 p-3 rounded-lg"><AlertTriangle size={20} /></div><div><div className="font-black text-slate-800 text-sm uppercase">{i.type} - {i.patientName || 'Practice'}</div><div className="text-xs text-slate-500 font-bold">{formatDate(i.date)} reported by {i.reportedByName}</div></div></div>
                                <button onClick={() => onResolveIncident(i.id)} className="px-4 py-2 bg-teal-100 text-teal-700 text-xs font-black uppercase rounded-lg flex items-center gap-2"><Check size={14}/> Resolve</button>
                            </div>
                        ))}

                        {adminQueue === 'professionalism' && items.map((note: any) => (
                            <div key={note.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center group">
                                <div className="flex items-center gap-4"><div className="bg-slate-100 text-slate-700 p-3 rounded-lg"><FileSearch size={20} /></div><div><div className="font-black text-slate-800 text-sm uppercase">{note.patientName}</div><div className="text-xs text-slate-500 font-bold">Note by {note.author} on {formatDate(note.date)}</div></div></div>
                                <div className="flex items-center gap-2"><button onClick={() => onClearProfessionalismReview(note.patientId, note.id)} className="px-4 py-2 bg-teal-100 text-teal-700 text-xs font-black uppercase rounded-lg">Clear Flag</button><button onClick={() => onNavigate(`patients/${note.patientId}`)} className="bg-slate-100 group-hover:bg-teal-600 p-3 rounded-xl transition-all"><ChevronRight size={20} className="text-slate-400 group-hover:text-white"/></button></div>
                            </div>
                        ))}

                        {adminQueue === 'supervision' && items.map((note: any) => (
                            <div key={note.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center group">
                                <div className="flex items-center gap-4"><div className="bg-blue-100 text-blue-700 p-3 rounded-lg"><UserCheck size={20} /></div><div><div className="font-black text-slate-800 text-sm uppercase">{note.patientName}</div><div className="text-xs text-slate-500 font-bold">Note by {note.author} on {formatDate(note.date)}</div></div></div>
                                <button onClick={() => onNavigate(`patients/${note.patientId}`)} className="bg-slate-100 group-hover:bg-teal-600 group-hover:text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase text-slate-700">Review & Seal <ChevronRight size={16} /></button>
                            </div>
                        ))}

                        {adminQueue === 'unsealed' && items.map((note: any) => {
                            const noteAgeDays = Math.floor((new Date().getTime() - new Date(note.date).getTime()) / (1000 * 3600 * 24));
                            return (
                                <div key={note.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center group">
                                    <div className="flex items-center gap-4"><div className="bg-amber-100 text-amber-700 p-3 rounded-lg"><FileText size={20} /></div><div><div className="font-black text-slate-800 text-sm uppercase">{note.patientName}</div><div className="text-xs text-slate-500 font-bold">{note.procedure}</div><div className="flex items-center gap-4 mt-2 text-xs text-slate-500"><span className="flex items-center gap-1.5 font-bold"><UserIcon size={12}/> {note.author}</span><span className="flex items-center gap-1.5"><Timer size={12}/> {noteAgeDays} days overdue</span></div></div></div>
                                    <button onClick={() => onNavigate(`patients/${note.patientId}`)} className="bg-slate-100 group-hover:bg-teal-600 p-3 rounded-xl transition-all"><ChevronRight size={20} className="text-slate-400 group-hover:text-white"/></button>
                                </div>
                            );
                        })}
                    </div>
                </div>
              )}
          </div>
      );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
          <div className="bg-lilac-600 p-4 rounded-3xl text-white shadow-xl"><History size={36} /></div>
          <div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">Admin Hub</h1>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Practice-wide Oversight & Management Queues</p>
          </div>
      </div>

      <div className="grid gap-6 admin-hub-grid">
          <ActionCard title="Financials" icon={DollarSign} onClick={() => onNavigate('financials')} color="bg-teal-600"/>
          <ActionCard title="Inventory" icon={Package} onClick={() => onNavigate('inventory')} color="bg-blue-600"/>
          <ActionCard title="Communications" icon={MessageSquare} onClick={() => onNavigate('communications')} color="bg-green-600"/>
          <ActionCard title="Referral Hub" icon={Send} onClick={() => onNavigate('referrals')} color="bg-amber-600"/>
          <ActionCard title="Recall Center" icon={History} onClick={() => onNavigate('recall')} color="bg-rose-600"/>
          <ActionCard title="Staff Roster" icon={Users2} onClick={() => onNavigate('roster')} color="bg-cyan-600"/>
          <ActionCard title="Leave Requests" icon={UserX} onClick={() => onNavigate('leave')} color="bg-violet-600"/>
          <button onClick={() => onShowModal('dataBreach', {})} className="bg-white p-4 rounded-2xl border-4 border-white shadow-lg flex items-center justify-between group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-4">
                  <div className="bg-red-600 p-3 rounded-xl text-white shadow-md"><Shield size={22}/></div>
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Data Breach Reporter</h3>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-red-500 transition-colors"/>
          </button>
      </div>

      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
           <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-6">Work Queues</h3>
           <div className="space-y-3">
              {Object.entries(workQueues).map(([key, queue]) => (
                  <div key={key} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <div className="bg-white p-2 rounded-lg text-slate-500 shadow-sm"><queue.icon size={20}/></div>
                          <div className="font-black text-slate-700 text-sm uppercase tracking-tight">{queue.title}</div>
                      </div>
                      <div className="flex items-center gap-4">
                          <span className={`font-black text-lg ${queue.items.length > 0 ? 'text-red-600' : 'text-slate-400'}`}>{queue.items.length}</span>
                          {queue.items.length > 0 && <button onClick={() => onNavigate(`admin/${key}`)} className="px-3 py-1 bg-white text-xs font-black uppercase rounded-lg shadow-sm border border-slate-200">View</button>}
                      </div>
                  </div>
              ))}
           </div>
      </div>
    </div>
  );
};

export default AdminHub;
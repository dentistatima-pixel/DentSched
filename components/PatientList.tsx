import React, { useState, useMemo, useEffect } from 'react';
import { Search, Phone, MessageSquare, ChevronRight, X, UserPlus, AlertTriangle, Shield, Heart, Activity, Hash, Plus, Trash2, CalendarPlus, Pencil, Printer, CheckCircle, FileCheck, ChevronDown, ChevronUp, AlertCircle, Download, Pill, Cigarette, Baby, User as UserIcon, MapPin, Briefcase, Users, CreditCard, Stethoscope, Mail, Clock, FileText, Grid, List, ClipboardList, DollarSign, StickyNote, PenLine } from 'lucide-react';
import { Patient, Appointment, User, UserRole, DentalChartEntry, TreatmentStatus, FieldSettings, PerioMeasurement } from '../types';
import Fuse from 'fuse.js';
import Odontogram from './Odontogram';
import Odontonotes from './Odontonotes';
import TreatmentPlan from './TreatmentPlan';
import PerioChart from './PerioChart'; 
import PatientLedger from './PatientLedger'; 
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';

interface PatientListProps {
  patients: Patient[];
  appointments: Appointment[];
  currentUser: User;
  selectedPatientId: string | null;
  onSelectPatient: (id: string | null) => void;
  onAddPatient: () => void;
  onEditPatient: (patient: Patient) => void;
  onQuickUpdatePatient: (patient: Patient) => void;
  onBulkUpdatePatients?: (patients: Patient[]) => void;
  onDeletePatient: (patientId: string) => void;
  onBookAppointment: (patientId: string) => void;
  fieldSettings?: FieldSettings; 
}

const downloadMockPDF = (filename: string, contentDescription: string) => {
    const content = `
    %PDF-1.4
    %DENT_SCHED_MOCK_PDF_HEADER
    
    OFFICIAL DENTAL RECORD
    ----------------------
    File: ${filename}
    Generated: ${new Date().toLocaleString()}
    
    ${contentDescription}
    
    [ This Is A Simulated PDF File For Demonstration Purposes. ]
    `;
    
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'application/pdf'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

const PatientList: React.FC<PatientListProps> = ({ 
    patients, 
    appointments, 
    currentUser, 
    selectedPatientId, 
    onSelectPatient,
    onAddPatient,
    onEditPatient,
    onQuickUpdatePatient,
    onBulkUpdatePatients,
    onDeletePatient,
    onBookAppointment,
    fieldSettings
}) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'medical' | 'chart' | 'perio' | 'plan' | 'ledger'>('info'); 
  const [showNeedsPrintingOnly, setShowNeedsPrintingOnly] = useState(false);
  const [chartViewMode, setChartViewMode] = useState<'visual' | 'notes'>('visual');
  const [editingTooth, setEditingTooth] = useState<number | null>(null);
  const [toothModalData, setToothModalData] = useState<{
      procedure: string;
      status: TreatmentStatus;
      notes: string;
      surfaces: string[]; 
      price: number;
  }>({ procedure: '', status: 'Planned', notes: '', surfaces: [], price: 0 });
  const [isEditingComplaint, setIsEditingComplaint] = useState(false);
  const [tempComplaint, setTempComplaint] = useState('');

  const enableCompliance = fieldSettings?.features?.enableComplianceAudit ?? true;

  const selectedPatient = useMemo(() => 
    patients.find(p => p.id === selectedPatientId) || null, 
  [patients, selectedPatientId]);

  useEffect(() => {
    if (selectedPatientId) {
        setActiveTab('info');
        setEditingTooth(null); 
    }
  }, [selectedPatientId]);

  const filteredPatients = useMemo(() => {
    let result = patients;
    if (showNeedsPrintingOnly && enableCompliance) {
        result = result.filter(p => {
             if (!p.lastDigitalUpdate) return false; 
             if (!p.lastPrintedDate) return true; 
             return new Date(p.lastDigitalUpdate) > new Date(p.lastPrintedDate);
        });
    }
    if (searchTerm) {
        const fuse = new Fuse(result, {
        keys: ['name', 'firstName', 'surname', 'email', 'phone', 'insuranceProvider', 'id'],
        threshold: 0.3,
        distance: 100,
        });
        result = fuse.search(searchTerm).map(r => r.item);
    }
    return result;
  }, [patients, searchTerm, showNeedsPrintingOnly, enableCompliance]);

  const isClinicalReadOnly = currentUser.role === UserRole.DENTAL_ASSISTANT;
  const canDelete = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DENTIST;

  const isCritical = (p: Patient) => {
    return (
        p.seriousIllness || 
        p.underMedicalTreatment ||
        p.takingMedications ||
        (p.allergies && p.allergies.length > 0 && !p.allergies.includes('None')) || 
        (p.medicalConditions && p.medicalConditions.length > 0 && !p.medicalConditions.includes('None'))
    );
  };

  const isPaperworkPending = (p: Patient) => {
      if (!enableCompliance) return false;
      if (!p.lastDigitalUpdate) return false;
      if (!p.lastPrintedDate) return true;
      return new Date(p.lastDigitalUpdate) > new Date(p.lastPrintedDate);
  }

  const critical = selectedPatient ? isCritical(selectedPatient) : false;

  const confirmDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (selectedPatient && window.confirm(`Are You Sure You Want To Delete ${selectedPatient.name}? This Cannot Be Undone.`)) {
          onDeletePatient(selectedPatient.id);
          toast.success(`Deleted Patient ${selectedPatient.name}`);
      }
  };

  const handlePrintRecord = () => {
      if (!selectedPatient) return;
      const filename = `ClinicalRecord_${selectedPatient.surname}_${selectedPatient.id}.pdf`;
      const desc = `Patient: ${selectedPatient.name}\nID: ${selectedPatient.id}\nIncludes: Odontogram, Perio Chart, Ledger, Medical History`;
      downloadMockPDF(filename, desc);
      if (enableCompliance) {
        onQuickUpdatePatient({
            ...selectedPatient,
            lastPrintedDate: new Date().toISOString()
        });
      }
      toast.success(`File Downloaded: ${filename}`);
  };

  const handlePerioUpdate = (newData: PerioMeasurement[]) => {
      if (!selectedPatient || isClinicalReadOnly) return;
      onQuickUpdatePatient({
          ...selectedPatient,
          perioChart: newData,
          lastDigitalUpdate: new Date().toISOString()
      });
      toast.success("Periodontal Chart Saved");
  };

  const handleToothClick = (tooth: number) => {
      if(!selectedPatient || isClinicalReadOnly) return;
      setEditingTooth(tooth);
      const firstProc = fieldSettings?.procedures?.[0];
      setToothModalData({ 
          procedure: firstProc?.name || 'Restoration', 
          status: 'Planned', 
          notes: '', 
          surfaces: [],
          price: firstProc?.price || 0
      });
  };

  const handleDirectChartUpdate = (entry: DentalChartEntry) => {
      if (!selectedPatient || isClinicalReadOnly) return;
      const procDef = fieldSettings?.procedures.find(p => p.name === entry.procedure);
      const entryWithPrice = {
          ...entry,
          price: procDef?.price || 0,
          author: currentUser.name,
          phase: entry.status === 'Planned' ? 1 : undefined
      };
      const updatedChart = [...(selectedPatient.dentalChart || []), entryWithPrice];
      onQuickUpdatePatient({ 
          ...selectedPatient, 
          dentalChart: updatedChart,
          lastDigitalUpdate: new Date().toISOString()
      });
      toast.success(`${entry.procedure} Added To Tooth #${entry.toothNumber}`);
  };

  const handleAddChartEntry = (newEntry: DentalChartEntry) => {
      if (!selectedPatient || isClinicalReadOnly) return;
      const updatedChart = [...(selectedPatient.dentalChart || []), newEntry];
      let updatedLedger = selectedPatient.ledger || [];
      let newBalance = selectedPatient.currentBalance || 0;
      if ((newEntry.price && newEntry.price > 0) || (newEntry.payment && newEntry.payment > 0)) {
          if (newEntry.price && newEntry.price > 0) {
              newBalance += newEntry.price;
              updatedLedger = [...updatedLedger, {
                  id: Math.random().toString(36).substr(2, 9),
                  date: newEntry.date || new Date().toISOString().split('T')[0],
                  description: `${newEntry.procedure} (Charge)`,
                  type: 'Charge',
                  amount: newEntry.price,
                  balanceAfter: newBalance,
                  notes: newEntry.notes
              }];
          }
          if (newEntry.payment && newEntry.payment > 0) {
              newBalance -= newEntry.payment;
              updatedLedger = [...updatedLedger, {
                  id: Math.random().toString(36).substr(2, 9),
                  date: newEntry.date || new Date().toISOString().split('T')[0],
                  description: `Payment ${newEntry.receiptNumber ? `(OR: ${newEntry.receiptNumber})` : ''}`,
                  type: 'Payment',
                  amount: newEntry.payment,
                  balanceAfter: newBalance,
                  notes: ''
              }];
          }
      }
      onQuickUpdatePatient({ 
          ...selectedPatient, 
          dentalChart: updatedChart,
          ledger: updatedLedger,
          currentBalance: newBalance,
          lastDigitalUpdate: new Date().toISOString()
      });
      toast.success("Entry Saved To Chart & Ledger");
  };

  const handleSaveComplaint = () => {
      if (!selectedPatient) return;
      onQuickUpdatePatient({ ...selectedPatient, chiefComplaint: tempComplaint });
      setIsEditingComplaint(false);
      toast.success("Chief Complaint Updated");
  };

  const handleAddLegacyEntry = () => {
      if (!selectedPatient || !editingTooth) return;
      const surfaceString = toothModalData.surfaces.sort().join('');
      const newEntry: DentalChartEntry = {
          toothNumber: editingTooth,
          procedure: toothModalData.procedure,
          status: toothModalData.status,
          notes: toothModalData.notes,
          surfaces: surfaceString,
          price: toothModalData.price,
          date: new Date().toISOString().split('T')[0],
          author: currentUser.name,
          phase: toothModalData.status === 'Planned' ? 1 : undefined
      };
      const updatedChart = [...(selectedPatient.dentalChart || []), newEntry];
      onQuickUpdatePatient({ 
          ...selectedPatient, 
          dentalChart: updatedChart,
          lastDigitalUpdate: new Date().toISOString()
      });
      setToothModalData(prev => ({ ...prev, notes: '', surfaces: [] }));
      setEditingTooth(null);
      toast.success("Entry Added To Chart");
  };

  const InfoRow = ({ icon: Icon, label, value, subValue }: { icon: any, label: string, value?: string | number, subValue?: string }) => (
      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm shrink-0">
            <Icon size={16} className="text-teal-600" />
          </div>
          <div className="min-w-0">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide truncate">{label}</div>
              <div className="font-semibold text-slate-800 text-sm truncate">{value || '-'}</div>
              {subValue && <div className="text-xs text-slate-500 truncate">{subValue}</div>}
          </div>
      </div>
  );

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className={`flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col ${selectedPatientId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center gap-2">
          <div className="flex-1">
             <h2 className="text-xl font-bold text-slate-800">Patients</h2>
          </div>
          <button onClick={onAddPatient} className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium shadow-sm">
                <UserPlus size={18} /> <span className="hidden sm:inline">New Patient</span>
          </button>
        </div>
        <div className="p-4 pt-2 space-y-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search Patients..." 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {enableCompliance && (
                <button 
                    onClick={() => setShowNeedsPrintingOnly(!showNeedsPrintingOnly)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold border transition-all ${
                        showNeedsPrintingOnly ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    <div className="flex items-center gap-2"><Printer size={16} /> Needs Printing</div>
                    {showNeedsPrintingOnly && <CheckCircle size={16} />}
                </button>
            )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-slate-400"><p>No Patients Found.</p></div>
          ) : (
            filteredPatients.map(patient => (
              <button
                key={patient.id}
                onClick={() => onSelectPatient(patient.id)}
                className={`w-full text-left p-4 hover:bg-slate-50 rounded-xl transition-all group flex items-center justify-between border border-transparent hover:border-slate-100 ${selectedPatientId === patient.id ? 'bg-teal-50 border-teal-100' : ''}`}
              >
                <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                        <h3 className={`font-semibold truncate whitespace-nowrap overflow-hidden text-ellipsis ${selectedPatientId === patient.id ? 'text-teal-800' : 'text-slate-800 group-hover:text-teal-700'}`}>{patient.name}</h3>
                        {isCritical(patient) && <AlertTriangle size={14} className="text-red-500 fill-red-100 shrink-0" />}
                        {isPaperworkPending(patient) && <Printer size={14} className="text-amber-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                        <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 flex items-center gap-1">
                            <Hash size={10} className="text-slate-400"/> {patient.id}
                        </span>
                        {patient.currentBalance && patient.currentBalance > 0 ? (
                            <span className="flex items-center gap-1 text-red-600 font-bold text-xs truncate">
                                <DollarSign size={10} /> Bal: ₱{patient.currentBalance.toLocaleString()}
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 truncate">
                                <Phone size={10} className="text-slate-400"/> {patient.phone}
                            </span>
                        )}
                    </div>
                </div>
                <ChevronRight size={18} className={`text-slate-300 group-hover:text-teal-500 shrink-0 ${selectedPatientId === patient.id ? 'text-teal-500' : ''}`} />
              </button>
            ))
          )}
        </div>
      </div>

      {selectedPatient ? (
        <div className="flex-[2] bg-white rounded-2xl shadow-sm border border-slate-100 p-0 relative animate-in slide-in-from-right-10 duration-300 overflow-hidden flex flex-col">
           <div 
                className={`pt-6 px-6 pb-6 border-b sticky top-0 z-10 transition-colors duration-300 ${
                    critical ? 'border-red-200 text-slate-900' : 'bg-white border-slate-100 text-slate-900'
                }`}
                style={{ backgroundColor: critical ? 'rgb(247, 185, 181)' : undefined }}
           >
                <button 
                    onClick={() => onSelectPatient(null)}
                    className={`md:hidden absolute top-4 right-4 p-2 rounded-full transition-colors ${
                        critical ? 'bg-white/50 hover:bg-white/70 text-black' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                >
                    <X size={20} />
                </button>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 pr-8">
                            <h2 className="text-2xl md:text-3xl font-bold truncate overflow-hidden whitespace-nowrap leading-tight">{selectedPatient.name}</h2>
                            <div className="flex gap-2 mt-1">
                                {selectedPatient.suffix && <span className="text-sm font-semibold opacity-70">{selectedPatient.suffix}</span>}
                                <span className="text-sm font-semibold opacity-70">({selectedPatient.sex}, {selectedPatient.age} Yrs)</span>
                            </div>
                        </div>
                        {enableCompliance && (
                            isPaperworkPending(selectedPatient) ? (
                                <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-amber-200 shadow-sm shrink-0">
                                    <Printer size={12} /> Pending
                                </div>
                            ) : (
                                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-green-200 shadow-sm shrink-0">
                                    <FileCheck size={12} /> OK
                                </div>
                            )
                        )}
                    </div>
                    <div className={`flex items-center gap-4 text-sm font-semibold mt-2 overflow-x-auto no-scrollbar whitespace-nowrap ${critical ? 'text-slate-900' : 'text-slate-500'}`}>
                        <span className="flex items-center gap-1.5 shrink-0"><Hash size={14} strokeWidth={2.5}/> {selectedPatient.id}</span>
                        <span className="flex items-center gap-1.5 shrink-0"><Phone size={14} strokeWidth={2.5}/> {selectedPatient.phone}</span>
                        {(selectedPatient.currentBalance || 0) > 0 && (
                            <span className="flex items-center gap-1.5 text-red-700 bg-red-100 px-2 rounded shrink-0"><DollarSign size={14} strokeWidth={2.5}/> Due: ₱{selectedPatient.currentBalance?.toLocaleString()}</span>
                        )}
                    </div>
                    {/* FIXED ACTION BAR FOR MOBILE: No wrap, horizontal scroll if needed */}
                    <div className="flex items-center gap-1.5 md:gap-2 mt-4 flex-nowrap overflow-x-auto no-scrollbar pb-1">
                        <a href={`tel:${selectedPatient.phone}`} className={`p-2.5 md:p-3 rounded-xl font-medium flex items-center justify-center transition-colors shrink-0 ${critical ? 'bg-white/40 hover:bg-white/60 text-black' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`} title="Call"><Phone size={18} /></a>
                        <a href={`sms:${selectedPatient.phone}`} className={`p-2.5 md:p-3 rounded-xl font-medium flex items-center justify-center transition-colors shrink-0 ${critical ? 'bg-white/40 hover:bg-white/60 text-black' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`} title="SMS"><MessageSquare size={18} /></a>
                        <button onClick={() => onBookAppointment(selectedPatient.id)} className={`p-2.5 md:p-3 rounded-xl font-medium flex items-center justify-center transition-colors shrink-0 ${critical ? 'bg-white/40 hover:bg-white/60 text-black' : 'bg-lilac-100 hover:bg-lilac-200 text-lilac-700'}`} title="Book"><CalendarPlus size={18} /></button>
                        <button onClick={() => onEditPatient(selectedPatient)} className={`p-2.5 md:p-3 rounded-xl font-medium flex items-center justify-center transition-colors shrink-0 ${critical ? 'bg-white/40 hover:bg-white/60 text-black' : 'bg-teal-100 hover:bg-teal-200 text-teal-700'}`} title="Edit"><Pencil size={18} /></button>
                        {enableCompliance && (
                            <button onClick={handlePrintRecord} className={`p-2.5 md:p-3 rounded-xl font-medium flex items-center justify-center transition-colors shrink-0 ${isPaperworkPending(selectedPatient) ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-700'}`} title="Print"><Download size={18} /></button>
                        )}
                        {canDelete && (
                            <button onClick={confirmDelete} className={`p-2.5 md:p-3 rounded-xl font-medium flex items-center justify-center transition-colors shrink-0 ${critical ? 'bg-white/40 hover:bg-white/60 text-black' : 'bg-red-100 hover:bg-red-200 text-red-700'}`} title="Delete"><Trash2 size={18} /></button>
                        )}
                    </div>
                </div>
           </div>
           <div className="bg-white px-6 border-b border-slate-200 flex gap-6 shrink-0 z-0 overflow-x-auto no-scrollbar">
                {['info', 'medical', 'chart', 'perio', 'plan', 'ledger'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)} 
                        className={`py-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap capitalize 
                        ${activeTab === tab ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        {tab === 'perio' ? 'Perio Chart' : tab === 'plan' ? 'Treatment Plan' : tab}
                    </button>
                ))}
           </div>
           <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 bg-slate-50/50">
                {['chart', 'perio', 'plan'].includes(activeTab) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 shadow-sm relative group">
                        <div className="flex items-center gap-2 mb-2 text-yellow-800 font-bold uppercase text-xs tracking-wider">
                            <StickyNote size={14} /> Chief Complaint / Alert
                        </div>
                        {isEditingComplaint ? (
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    autoFocus
                                    className="flex-1 bg-white border border-yellow-300 rounded p-2 text-sm"
                                    value={tempComplaint}
                                    onChange={(e) => setTempComplaint(e.target.value)}
                                    placeholder="Enter Chief Complaint..."
                                />
                                <button onClick={handleSaveComplaint} className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded font-bold text-xs hover:bg-yellow-500">Save</button>
                                <button onClick={() => setIsEditingComplaint(false)} className="px-3 py-1 bg-white text-yellow-900 border border-yellow-200 rounded font-bold text-xs">Cancel</button>
                            </div>
                        ) : (
                            <div className="flex justify-between items-start cursor-pointer" onClick={() => { setTempComplaint(selectedPatient.chiefComplaint || ''); setIsEditingComplaint(true); }}>
                                <p className={`text-sm ${selectedPatient.chiefComplaint ? 'text-slate-800 font-medium' : 'text-slate-400 italic'}`}>
                                    {selectedPatient.chiefComplaint || 'Click To Add Chief Complaint...'}
                                </p>
                                <PenLine size={14} className="text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'info' && (
                    <div className="space-y-6">
                        <section className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><UserIcon size={18} className="text-teal-600"/> Personal Demographics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoRow icon={UserIcon} label="Full Name" value={selectedPatient.name} subValue={`${selectedPatient.firstName} ${selectedPatient.middleName || ''} ${selectedPatient.surname} ${selectedPatient.suffix || ''}`} />
                                <InfoRow icon={Baby} label="Date Of Birth" value={formatDate(selectedPatient.dob)} subValue={`${selectedPatient.age} Years Old`} />
                                <InfoRow icon={Users} label="Sex" value={selectedPatient.sex} />
                                <InfoRow icon={Briefcase} label="Occupation" value={selectedPatient.occupation} />
                            </div>
                        </section>
                        <section className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><Phone size={18} className="text-teal-600"/> Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoRow icon={Phone} label="Mobile" value={selectedPatient.phone} />
                                <InfoRow icon={Phone} label="Secondary Mobile" value={selectedPatient.mobile2} />
                                <InfoRow icon={Mail} label="Email" value={selectedPatient.email} />
                                <InfoRow icon={MapPin} label="Home Address" value={selectedPatient.homeAddress} subValue={selectedPatient.barangay} />
                            </div>
                        </section>
                        <section className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><Users size={18} className="text-teal-600"/> Family & Guardian</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoRow icon={UserIcon} label="Father" value={selectedPatient.fatherName} subValue={selectedPatient.fatherOccupation} />
                                <InfoRow icon={UserIcon} label="Mother" value={selectedPatient.motherName} subValue={selectedPatient.motherOccupation} />
                                {selectedPatient.guardian && (
                                    <>
                                        <InfoRow icon={Shield} label="Guardian" value={selectedPatient.guardian} />
                                        <InfoRow icon={Phone} label="Guardian Contact" value={selectedPatient.guardianMobile} />
                                    </>
                                )}
                            </div>
                        </section>
                         <section className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><CreditCard size={18} className="text-teal-600"/> Insurance & Billing</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoRow icon={CreditCard} label="Insurance Provider" value={selectedPatient.insuranceProvider} />
                                <InfoRow icon={Hash} label="Insurance Number" value={selectedPatient.insuranceNumber} />
                                <InfoRow icon={UserIcon} label="Responsible Party" value={selectedPatient.responsibleParty} />
                            </div>
                        </section>
                    </div>
                )}
                {activeTab === 'medical' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-4 md:p-5 md:col-span-2">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Heart size={18} className="text-teal-600"/> Medical Overview</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                        <span className="text-sm text-slate-500">Overall Health</span>
                                        {selectedPatient.goodHealth ? (
                                            <span className="text-sm font-bold text-green-600 flex items-center gap-1"><CheckCircle size={14}/> Good</span>
                                        ) : (
                                            <span className="text-sm font-bold text-orange-600 flex items-center gap-1"><AlertCircle size={14}/> Issues Reported</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                        <span className="text-sm text-slate-500">Blood Type</span>
                                        <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2 rounded">{selectedPatient.bloodGroup || 'Unknown'}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Allergies</span>
                                        {(selectedPatient.allergies && selectedPatient.allergies.length > 0) || selectedPatient.otherAllergies ? (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedPatient.allergies?.map(a => (
                                                    <span key={a} className="bg-red-50 text-red-700 border border-red-100 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                                        <AlertTriangle size={10} /> {a}
                                                    </span>
                                                ))}
                                                {selectedPatient.otherAllergies && (
                                                    <span className="bg-red-50 text-red-700 border border-red-100 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                                        <AlertTriangle size={10} /> {selectedPatient.otherAllergies}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">No Allergies Reported.</span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Conditions</span>
                                        {(selectedPatient.medicalConditions && selectedPatient.medicalConditions.length > 0) || selectedPatient.otherConditions ? (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedPatient.medicalConditions?.map(c => (
                                                    <span key={c} className="bg-orange-50 text-orange-700 border border-orange-100 px-2 py-1 rounded text-xs font-bold">
                                                        {c}
                                                    </span>
                                                ))}
                                                {selectedPatient.otherConditions && (
                                                    <span className="bg-orange-50 text-orange-700 border border-orange-100 px-2 py-1 rounded text-xs font-bold">{selectedPatient.otherConditions}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">No Conditions Reported.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-4 md:p-5 md:col-span-2">
                             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Stethoscope size={18} className="text-teal-600"/> Detailed History</h3>
                             <div className="space-y-4">
                                {selectedPatient.underMedicalTreatment && (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Under Medical Treatment</span>
                                        <p className="font-medium text-slate-800 mt-1">{selectedPatient.medicalTreatmentDetails}</p>
                                    </div>
                                )}
                                {selectedPatient.takingMedications && (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Current Medications</span>
                                        <p className="font-medium text-slate-800 mt-1">{selectedPatient.medicationDetails}</p>
                                    </div>
                                )}
                             </div>
                        </section>
                     </div>
                )}
                {activeTab === 'chart' && (
                     <div className="space-y-6">
                         <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-slate-800 text-lg">Dental Chart</h4>
                                <p className="text-xs text-slate-400">Clinical Record & Notes</p>
                            </div>
                            <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                                <button 
                                    onClick={() => setChartViewMode('visual')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${chartViewMode === 'visual' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}
                                >
                                    <Grid size={16} /> <span className="hidden sm:inline">Visual</span>
                                </button>
                                <button 
                                    onClick={() => setChartViewMode('notes')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${chartViewMode === 'notes' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}
                                >
                                    <List size={16} /> <span className="hidden sm:inline">Notes</span>
                                </button>
                            </div>
                         </div>
                         {chartViewMode === 'visual' ? (
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="font-bold text-lg text-slate-800">Odontogram</h3>
                                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">FDI Notation</span>
                                        </div>
                                        <div className="text-xs text-slate-400 flex items-center gap-1">
                                            <Shield size={12}/> {isClinicalReadOnly ? 'Read Only' : 'Interactive'}
                                        </div>
                                    </div>
                                    <Odontogram 
                                        chart={selectedPatient.dentalChart || []} 
                                        readOnly={isClinicalReadOnly} 
                                        onToothClick={handleToothClick} 
                                        onChartUpdate={handleDirectChartUpdate}
                                    />
                                </div>
                         ) : (
                             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="font-bold text-lg text-slate-800 mb-1">Clinical Notes Log</h3>
                                    <p className="text-xs text-slate-500">Chronological History Of All Procedures And Notes.</p>
                                </div>
                                <div>
                                    <Odontonotes 
                                        entries={selectedPatient.dentalChart || []}
                                        onAddEntry={handleAddChartEntry}
                                        currentUser={currentUser.name}
                                        readOnly={isClinicalReadOnly}
                                        procedures={fieldSettings?.procedures || []}
                                    />
                                </div>
                             </div>
                         )}
                     </div>
                )}
                {activeTab === 'perio' && (
                    <PerioChart 
                        data={selectedPatient.perioChart || []}
                        onSave={handlePerioUpdate}
                        readOnly={isClinicalReadOnly}
                    />
                )}
                {activeTab === 'plan' && (
                     <TreatmentPlan 
                        patient={selectedPatient}
                        onUpdatePatient={onQuickUpdatePatient}
                        readOnly={isClinicalReadOnly}
                     />
                )}
                {activeTab === 'ledger' && (
                    <PatientLedger 
                        patient={selectedPatient}
                        onUpdatePatient={onQuickUpdatePatient}
                        readOnly={isClinicalReadOnly && !currentUser.canViewFinancials}
                    />
                )}
           </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-[2] items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
           <div className="text-center text-slate-400">
               <Shield size={48} className="mx-auto mb-2 opacity-20" />
               <p className="font-medium">Select A Patient To View Full Medical Record</p>
           </div>
        </div>
      )}
      {editingTooth && selectedPatient && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="bg-teal-900 text-white p-4 flex justify-between items-center">
                      <h3 className="font-bold text-lg flex items-center gap-2"><Shield size={20} /> Tooth #{editingTooth}</h3>
                      <button onClick={() => setEditingTooth(null)} className="p-1 hover:bg-white/20 rounded-full"><X size={20} /></button>
                  </div>
                  <div className="p-4 space-y-4">
                      <button onClick={handleAddLegacyEntry} className="w-full py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 shadow-sm flex items-center justify-center gap-2 mt-2"><Plus size={16} /> Add To Chart</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default PatientList;
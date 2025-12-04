
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Phone, MessageSquare, ChevronRight, X, UserPlus, AlertTriangle, Shield, Heart, Activity, Hash, Plus, Trash2, CalendarPlus, Pencil, Printer, CheckCircle, FileCheck, ChevronDown, ChevronUp, AlertCircle, Download, Pill, Cigarette, Baby, User as UserIcon, MapPin, Briefcase, Users, CreditCard, Stethoscope, Mail, Clock, FileText } from 'lucide-react';
import { Patient, Appointment, User, UserRole, DentalChartEntry, TreatmentStatus, FieldSettings } from '../types';
import Fuse from 'fuse.js';
import Odontogram from './Odontogram';
import { formatDate } from '../constants';

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
    
    [ This is a simulated PDF file for demonstration purposes. ]
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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'medical' | 'chart'>('info');
  const [showNeedsPrintingOnly, setShowNeedsPrintingOnly] = useState(false);

  // Charting Modal State (For "Cursor" mode legacy edits)
  const [editingTooth, setEditingTooth] = useState<number | null>(null);
  const [toothModalData, setToothModalData] = useState<{
      procedure: string;
      status: TreatmentStatus;
      notes: string;
      surfaces: string[]; 
      price: number;
  }>({ procedure: '', status: 'Planned', notes: '', surfaces: [], price: 0 });

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
      if (selectedPatient && window.confirm(`Are you sure you want to delete ${selectedPatient.name}? This cannot be undone.`)) {
          onDeletePatient(selectedPatient.id);
      }
  };

  const handlePrintRecord = () => {
      if (!selectedPatient) return;
      const filename = `ClinicalRecord_${selectedPatient.surname}_${selectedPatient.id}.pdf`;
      const desc = `Patient: ${selectedPatient.name}\nID: ${selectedPatient.id}\nIncludes: Odontogram, Medical History, Treatment Log`;
      downloadMockPDF(filename, desc);
      
      if (enableCompliance) {
        onQuickUpdatePatient({
            ...selectedPatient,
            lastPrintedDate: new Date().toISOString()
        });
      }
      alert(`File downloaded: ${filename}`);
  };

  const handleBatchPrint = () => {
      if (filteredPatients.length === 0) return;
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Batch_Clinical_Records_${dateStr}.pdf`;
      const names = filteredPatients.map(p => p.name).join(', ');
      const desc = `BATCH EXPORT\nPatients: ${filteredPatients.length}\nNames: ${names}`;
      downloadMockPDF(filename, desc);

      if (enableCompliance) {
          const updatedPatients = filteredPatients.map(p => ({
              ...p,
              lastPrintedDate: new Date().toISOString()
          }));
          if (onBulkUpdatePatients) {
              onBulkUpdatePatients(updatedPatients);
          } else {
              updatedPatients.forEach(p => onQuickUpdatePatient(p));
          }
      }
      alert(`Batch file downloaded: ${filename}`);
      setShowNeedsPrintingOnly(false); 
  };

  // --- CHARTING HANDLERS ---
  
  // 1. Legacy/Cursor Mode (Opens Modal)
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

  // 2. New Direct Tool Application
  const handleDirectChartUpdate = (entry: DentalChartEntry) => {
      if (!selectedPatient || isClinicalReadOnly) return;
      
      // Calculate price based on procedure name from settings
      const procDef = fieldSettings?.procedures.find(p => p.name === entry.procedure);
      const entryWithPrice = {
          ...entry,
          price: procDef?.price || 0
      };

      const updatedChart = [...(selectedPatient.dentalChart || []), entryWithPrice];
      onQuickUpdatePatient({ 
          ...selectedPatient, 
          dentalChart: updatedChart,
          lastDigitalUpdate: new Date().toISOString()
      });
  };

  const handleProcedureChange = (procName: string) => {
      const proc = fieldSettings?.procedures.find(p => p.name === procName);
      setToothModalData(prev => ({
          ...prev,
          procedure: procName,
          price: proc?.price || 0 
      }));
  }

  const toggleSurface = (surface: string) => {
      setToothModalData(prev => {
          const current = prev.surfaces;
          if (current.includes(surface)) {
              return { ...prev, surfaces: current.filter(s => s !== surface) };
          } else {
              return { ...prev, surfaces: [...current, surface] };
          }
      });
  }

  const handleAddChartEntry = () => {
      if (!selectedPatient || !editingTooth) return;
      const surfaceString = toothModalData.surfaces.sort().join('');
      const newEntry: DentalChartEntry = {
          toothNumber: editingTooth,
          procedure: toothModalData.procedure,
          status: toothModalData.status,
          notes: toothModalData.notes,
          surfaces: surfaceString,
          price: toothModalData.price,
          date: new Date().toISOString().split('T')[0]
      };
      const updatedChart = [...(selectedPatient.dentalChart || []), newEntry];
      onQuickUpdatePatient({ 
          ...selectedPatient, 
          dentalChart: updatedChart,
          lastDigitalUpdate: new Date().toISOString()
      });
      setToothModalData(prev => ({ ...prev, notes: '', surfaces: [] }));
      setEditingTooth(null);
  };

  const handleDeleteChartEntry = (indexToDelete: number, toothNum: number) => {
      if (!selectedPatient || !selectedPatient.dentalChart) return;
      const toothItems = selectedPatient.dentalChart.filter(e => e.toothNumber === toothNum);
      const itemToDelete = toothItems[indexToDelete];
      const updatedChart = selectedPatient.dentalChart.filter(e => e !== itemToDelete);
      onQuickUpdatePatient({ 
          ...selectedPatient, 
          dentalChart: updatedChart,
          lastDigitalUpdate: new Date().toISOString()
      });
  };

  const InfoRow = ({ icon: Icon, label, value, subValue }: { icon: any, label: string, value?: string | number, subValue?: string }) => (
      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm shrink-0">
            <Icon size={16} className="text-teal-600" />
          </div>
          <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</div>
              <div className="font-semibold text-slate-800 text-sm">{value || '-'}</div>
              {subValue && <div className="text-xs text-slate-500">{subValue}</div>}
          </div>
      </div>
  );

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* List Column */}
      <div className={`flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col ${selectedPatientId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center gap-2">
          <div className="flex-1">
             <h2 className="text-xl font-bold text-slate-800">Patients</h2>
          </div>
          <button onClick={onAddPatient} className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium shadow-sm">
                <UserPlus size={18} /> <span className="hidden sm:inline">New</span>
          </button>
        </div>
        
        <div className="p-4 pt-2 space-y-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search..." 
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
            <div className="text-center py-8 text-slate-400"><p>No patients found.</p></div>
          ) : (
            filteredPatients.map(patient => (
              <button
                key={patient.id}
                onClick={() => onSelectPatient(patient.id)}
                className={`w-full text-left p-4 hover:bg-slate-50 rounded-xl transition-all group flex items-center justify-between border border-transparent hover:border-slate-100 ${selectedPatientId === patient.id ? 'bg-teal-50 border-teal-100' : ''}`}
              >
                <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                        <h3 className={`font-semibold truncate ${selectedPatientId === patient.id ? 'text-teal-800' : 'text-slate-800 group-hover:text-teal-700'}`}>{patient.name}</h3>
                        {isCritical(patient) && <AlertTriangle size={14} className="text-red-500 fill-red-100 shrink-0" />}
                        {isPaperworkPending(patient) && <Printer size={14} className="text-amber-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                        <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 flex items-center gap-1">
                            <Hash size={10} className="text-slate-400"/> {patient.id}
                        </span>
                        <span className="flex items-center gap-1">
                            <Phone size={10} className="text-slate-400"/> {patient.phone}
                        </span>
                    </div>
                </div>
                <ChevronRight size={18} className={`text-slate-300 group-hover:text-teal-500 ${selectedPatientId === patient.id ? 'text-teal-500' : ''}`} />
              </button>
            ))
          )}
        </div>
        {enableCompliance && showNeedsPrintingOnly && filteredPatients.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-amber-50">
                <button onClick={handleBatchPrint} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-transform hover:scale-[1.02]">
                    <Download size={18} /> Download Batch PDF ({filteredPatients.length})
                </button>
            </div>
        )}
      </div>

      {/* Detail Column */}
      {selectedPatient ? (
        <div className="flex-[2] bg-white rounded-2xl shadow-sm border border-slate-100 p-0 relative animate-in slide-in-from-right-10 duration-300 overflow-hidden flex flex-col">
           
           {/* HEADER */}
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
                        <div>
                            <h2 className="text-3xl font-bold">{selectedPatient.name}</h2>
                            <div className="flex gap-2 mt-1">
                                {selectedPatient.suffix && <span className="text-sm font-semibold opacity-70">{selectedPatient.suffix}</span>}
                                <span className="text-sm font-semibold opacity-70">({selectedPatient.sex}, {selectedPatient.age} yrs)</span>
                            </div>
                        </div>
                        {enableCompliance && (
                            isPaperworkPending(selectedPatient) ? (
                                <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-amber-200 shadow-sm">
                                    <Printer size={12} /> Paperwork Pending
                                </div>
                            ) : (
                                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-green-200 shadow-sm">
                                    <FileCheck size={12} /> Compliant
                                </div>
                            )
                        )}
                    </div>
                    <div className={`flex flex-wrap gap-6 text-base font-semibold mt-2 ${critical ? 'text-slate-900' : 'text-slate-500'}`}>
                        <span className="flex items-center gap-2"><Hash size={16} strokeWidth={2.5}/> {selectedPatient.id}</span>
                        <span className="flex items-center gap-2"><Phone size={16} strokeWidth={2.5}/> {selectedPatient.phone}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                        <a href={`tel:${selectedPatient.phone}`} className={`p-3 rounded-xl font-medium flex items-center justify-center transition-colors ${critical ? 'bg-white/40 hover:bg-white/60 text-black' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`} title="Call"><Phone size={20} /></a>
                        <a href={`sms:${selectedPatient.phone}`} className={`p-3 rounded-xl font-medium flex items-center justify-center transition-colors ${critical ? 'bg-white/40 hover:bg-white/60 text-black' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`} title="SMS"><MessageSquare size={20} /></a>
                        <button onClick={() => onBookAppointment(selectedPatient.id)} className={`p-3 rounded-xl font-medium flex items-center justify-center transition-colors ${critical ? 'bg-white/40 hover:bg-white/60 text-black' : 'bg-lilac-100 hover:bg-lilac-200 text-lilac-700'}`} title="Book"><CalendarPlus size={20} /></button>
                        <button onClick={() => onEditPatient(selectedPatient)} className={`p-3 rounded-xl font-medium flex items-center justify-center transition-colors ${critical ? 'bg-white/40 hover:bg-white/60 text-black' : 'bg-teal-100 hover:bg-teal-200 text-teal-700'}`} title="Edit"><Pencil size={20} /></button>
                        {enableCompliance && (
                            <button onClick={handlePrintRecord} className={`p-3 rounded-xl font-medium flex items-center justify-center transition-colors ${isPaperworkPending(selectedPatient) ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-700'}`} title="Print Record"><Download size={20} /></button>
                        )}
                        {canDelete && (
                            <button onClick={confirmDelete} className={`p-3 rounded-xl font-medium flex items-center justify-center transition-colors ${critical ? 'bg-white/40 hover:bg-white/60 text-black' : 'bg-red-100 hover:bg-red-200 text-red-700'}`} title="Delete"><Trash2 size={20} /></button>
                        )}
                    </div>
                </div>
           </div>

           {/* Tabs */}
           <div className="bg-white px-6 border-b border-slate-200 flex gap-6 shrink-0 z-0 overflow-x-auto">
                <button onClick={() => setActiveTab('info')} className={`py-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${activeTab === 'info' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Info</button>
                <button onClick={() => setActiveTab('medical')} className={`py-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${activeTab === 'medical' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Medical Record</button>
                <button onClick={() => setActiveTab('chart')} className={`py-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${activeTab === 'chart' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Dental Chart</button>
           </div>

           {/* Content */}
           <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
                {activeTab === 'info' && (
                    <div className="space-y-6">
                        {/* 1. Demographics */}
                        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><UserIcon size={18} className="text-teal-600"/> Personal Demographics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoRow icon={UserIcon} label="Full Name" value={selectedPatient.name} subValue={`${selectedPatient.firstName} ${selectedPatient.middleName || ''} ${selectedPatient.surname} ${selectedPatient.suffix || ''}`} />
                                <InfoRow icon={Baby} label="Date of Birth" value={formatDate(selectedPatient.dob)} subValue={`${selectedPatient.age} years old`} />
                                <InfoRow icon={Users} label="Sex" value={selectedPatient.sex} />
                                <InfoRow icon={Briefcase} label="Occupation" value={selectedPatient.occupation} />
                            </div>
                        </section>

                        {/* 2. Contact */}
                        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><Phone size={18} className="text-teal-600"/> Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoRow icon={Phone} label="Mobile" value={selectedPatient.phone} />
                                <InfoRow icon={Phone} label="Secondary Mobile" value={selectedPatient.mobile2} />
                                <InfoRow icon={Mail} label="Email" value={selectedPatient.email} />
                                <InfoRow icon={MapPin} label="Home Address" value={selectedPatient.homeAddress} subValue={selectedPatient.barangay} />
                            </div>
                        </section>

                        {/* 3. Family / Guardian */}
                        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
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

                         {/* 4. Insurance */}
                         <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><CreditCard size={18} className="text-teal-600"/> Insurance & Billing</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoRow icon={CreditCard} label="Insurance Provider" value={selectedPatient.insuranceProvider} />
                                <InfoRow icon={Hash} label="Insurance Number" value={selectedPatient.insuranceNumber} />
                                <InfoRow icon={UserIcon} label="Responsible Party" value={selectedPatient.responsibleParty} />
                            </div>
                        </section>

                        {/* 5. Previous Dental History (Moved from Chart Tab) */}
                        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><Stethoscope size={18} className="text-teal-600"/> External Dental History</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <InfoRow icon={UserIcon} label="Previous Dentist" value={selectedPatient.previousDentist} />
                                 <InfoRow icon={CalendarPlus} label="Last Visit (External)" value={formatDate(selectedPatient.lastVisit)} />
                             </div>
                        </section>
                    </div>
                )}

                {activeTab === 'medical' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Alerts */}
                        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-5 md:col-span-2">
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
                                            <span className="text-sm text-slate-400 italic">No allergies reported.</span>
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
                                            <span className="text-sm text-slate-400 italic">No conditions reported.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Detailed Medical Questions */}
                        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-5 md:col-span-2">
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
                                {selectedPatient.seriousIllness && (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Serious Illness History</span>
                                        <p className="font-medium text-slate-800 mt-1">{selectedPatient.seriousIllnessDetails}</p>
                                    </div>
                                )}
                                {selectedPatient.lastHospitalization && (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Last Hospitalization</span>
                                        <p className="font-medium text-slate-800 mt-1">{selectedPatient.lastHospitalizationDetails}</p>
                                    </div>
                                )}
                                {!selectedPatient.underMedicalTreatment && !selectedPatient.takingMedications && !selectedPatient.seriousIllness && !selectedPatient.lastHospitalization && (
                                    <div className="text-center text-slate-400 italic py-4">No significant detailed history recorded.</div>
                                )}
                             </div>
                        </section>

                        {/* 2. Habits & Vitals */}
                        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-5 md:col-span-2">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity size={18} className="text-teal-600"/> Lifestyle & Specifics</h3>
                            
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row gap-2">
                                    <div className={`flex items-center gap-2 p-3 rounded-lg border flex-1 ${selectedPatient.tobaccoUse ? 'bg-slate-800 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                        <Cigarette size={16} />
                                        <span className="text-sm font-bold">Tobacco User</span>
                                        {selectedPatient.tobaccoUse ? <CheckCircle size={14} className="ml-auto text-green-400"/> : <X size={14} className="ml-auto"/>}
                                    </div>
                                    <div className={`flex items-center gap-2 p-3 rounded-lg border flex-1 ${selectedPatient.alcoholDrugsUse ? 'bg-slate-800 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                        <Pill size={16} />
                                        <span className="text-sm font-bold">Alcohol/Drug Use</span>
                                        {selectedPatient.alcoholDrugsUse ? <CheckCircle size={14} className="ml-auto text-green-400"/> : <X size={14} className="ml-auto"/>}
                                    </div>
                                </div>

                                {selectedPatient.sex === 'Female' && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Female Specific</span>
                                        <div className="flex gap-2">
                                            {selectedPatient.pregnant && <span className="bg-lilac-100 text-lilac-700 px-3 py-1 rounded text-sm font-bold flex items-center gap-1"><Baby size={14}/> Pregnant</span>}
                                            {selectedPatient.nursing && <span className="bg-lilac-50 text-lilac-600 px-3 py-1 rounded text-sm font-bold">Nursing</span>}
                                            {selectedPatient.birthControl && <span className="bg-lilac-50 text-lilac-600 px-3 py-1 rounded text-sm font-bold">Birth Control</span>}
                                            {!selectedPatient.pregnant && !selectedPatient.nursing && !selectedPatient.birthControl && <span className="text-sm text-slate-400 italic">None applicable</span>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* General Notes (Moved from Notes Tab) */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:col-span-2">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={18} className="text-teal-600"/> General Patient Notes</h3>
                            <p className="whitespace-pre-wrap text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                {selectedPatient.notes || "No general notes recorded."}
                            </p>
                        </section>
                     </div>
                )}

                {activeTab === 'chart' && (
                     <div className="space-y-6">
                         {/* Reported History */}
                         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                             <h4 className="font-bold text-slate-800 mb-2">Reported Dental History</h4>
                             {(selectedPatient.treatments && selectedPatient.treatments.length > 0) ? (
                                <div className="flex flex-col gap-2">
                                    {selectedPatient.treatments.map(t => {
                                        const details = selectedPatient.treatmentDetails?.[t];
                                        return (
                                            <div key={t} className="text-sm border-b border-slate-50 last:border-0 pb-1">
                                                <span className="font-bold text-teal-800">{t}</span>
                                                {details && <div className="text-slate-500 text-xs mt-0.5">{details}</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-slate-400 text-sm italic">No dental history reported.</div>
                            )}
                         </div>

                         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-slate-800">Odontogram (FDI)</h3>
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                    <Shield size={12}/> {isClinicalReadOnly ? 'Read Only View' : 'Select tool & click chart'}
                                </div>
                             </div>
                             
                             {/* UPDATED ODONTOGRAM IMPLEMENTATION */}
                             <Odontogram 
                                chart={selectedPatient.dentalChart || []} 
                                readOnly={isClinicalReadOnly} 
                                onToothClick={handleToothClick} 
                                onChartUpdate={handleDirectChartUpdate}
                             />
                         </div>
                         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                             <h4 className="font-bold text-slate-700 p-4 border-b border-slate-100">Chart History</h4>
                             <div className="max-h-60 overflow-y-auto">
                                 {(selectedPatient.dentalChart && selectedPatient.dentalChart.length > 0) ? (
                                     <table className="w-full text-sm text-left">
                                         <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                             <tr><th className="p-3">Tooth</th><th className="p-3">Procedure</th><th className="p-3">Surfaces</th><th className="p-3">Status</th><th className="p-3">Price</th><th className="p-3">Date</th></tr>
                                         </thead>
                                         <tbody>
                                             {selectedPatient.dentalChart.map((e, idx) => (
                                                 <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                                                     <td className="p-3 font-mono font-bold">{e.toothNumber}</td>
                                                     <td className="p-3">{e.procedure}</td>
                                                     <td className="p-3 font-mono text-xs">{e.surfaces || '-'}</td>
                                                     <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${e.status === 'Completed' ? 'bg-green-100 text-green-700' : e.status === 'Planned' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{e.status}</span></td>
                                                     <td className="p-3 font-bold text-slate-700">₱{e.price}</td>
                                                     <td className="p-3 text-slate-400 text-xs">{formatDate(e.date)}</td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 ) : (
                                     <div className="p-8 text-center text-slate-400 italic">No charting data available.</div>
                                 )}
                             </div>
                         </div>
                     </div>
                )}
           </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-[2] items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
           <div className="text-center text-slate-400">
               <Shield size={48} className="mx-auto mb-2 opacity-20" />
               <p className="font-medium">Select a patient to view full medical record</p>
           </div>
        </div>
      )}

      {/* TOOTH MODAL (Legacy/Detailed Edit) */}
      {editingTooth && selectedPatient && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="bg-teal-900 text-white p-4 flex justify-between items-center">
                      <h3 className="font-bold text-lg flex items-center gap-2"><Shield size={20} /> Tooth #{editingTooth}</h3>
                      <button onClick={() => setEditingTooth(null)} className="p-1 hover:bg-white/20 rounded-full"><X size={20} /></button>
                  </div>
                  <div className="p-4 space-y-4">
                      {/* List Existing & Add New Logic (Same as before) */}
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Current Status</label>
                          <div className="space-y-2">
                              {(selectedPatient.dentalChart || []).filter(e => e.toothNumber === editingTooth).length > 0 ? (
                                  (selectedPatient.dentalChart || []).filter(e => e.toothNumber === editingTooth).map((entry, idx) => (
                                      <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                          <div>
                                              <div className="font-bold text-sm text-slate-800 flex items-center gap-2">{entry.procedure} {entry.surfaces && <span className="text-[10px] bg-slate-200 px-1 rounded">{entry.surfaces}</span>}</div>
                                              <div className={`text-xs font-bold ${entry.status === 'Completed' ? 'text-green-600' : entry.status === 'Planned' ? 'text-red-500' : 'text-blue-500'}`}>{entry.status} {entry.price ? `(₱${entry.price})` : ''}</div>
                                          </div>
                                          <button onClick={() => handleDeleteChartEntry(idx, editingTooth)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                      </div>
                                  ))
                              ) : (
                                  <div className="text-sm text-slate-400 italic p-2">No data recorded.</div>
                              )}
                          </div>
                      </div>
                      <div className="border-t border-slate-100 pt-4">
                          <label className="block text-xs font-bold text-teal-600 uppercase mb-3">Add New Entry</label>
                          <div className="space-y-3">
                              <div><label className="block text-xs font-bold text-slate-500 mb-1">Procedure</label><select className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white" value={toothModalData.procedure} onChange={(e) => handleProcedureChange(e.target.value)}>{fieldSettings?.procedures.map(p => (<option key={p.id} value={p.name}>{p.name} (Suggested: ₱{p.price})</option>))}</select></div>
                              <div><label className="block text-xs font-bold text-slate-500 mb-1">Surfaces</label><div className="flex gap-2 justify-between">{['M', 'O', 'D', 'B', 'L'].map(surf => (<button key={surf} onClick={() => toggleSurface(surf)} className={`w-10 h-10 rounded-lg font-bold text-sm transition-all border ${toothModalData.surfaces.includes(surf) ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{surf}</button>))}</div></div>
                              <div><label className="block text-xs font-bold text-slate-500 mb-1">Status</label><div className="flex gap-2">{['Planned', 'Completed', 'Existing'].map(s => (<button key={s} onClick={() => setToothModalData({...toothModalData, status: s as TreatmentStatus})} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${toothModalData.status === s ? s === 'Planned' ? 'bg-red-50 border-red-200 text-red-700' : s === 'Completed' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{s}</button>))}</div></div>
                              <div><label className="block text-xs font-bold text-slate-500 mb-1">Price</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₱</span><input type="number" className="w-full pl-7 p-2 border border-slate-200 rounded-lg text-sm bg-white font-bold" value={toothModalData.price} onChange={(e) => setToothModalData({ ...toothModalData, price: parseFloat(e.target.value) || 0 })}/></div></div>
                              <button onClick={handleAddChartEntry} className="w-full py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 shadow-sm flex items-center justify-center gap-2 mt-2"><Plus size={16} /> Add to Chart</button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default PatientList;

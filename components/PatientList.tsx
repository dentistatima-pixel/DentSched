
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Phone, Mail, FileText, ChevronRight, X, UserPlus, Lock, AlertTriangle, MapPin, Briefcase, Heart, Activity, Shield, Calendar, Hash, Check, ChevronDown, ChevronUp, Pencil, Trash2, MessageSquare, CheckCircle, CalendarPlus } from 'lucide-react';
import { Patient, Appointment, User, UserRole, DentalChartEntry } from '../types';
import { summarizePatient } from '../services/geminiService';
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
  onEditPatient: (patient: Patient) => void;         // For opening the modal
  onQuickUpdatePatient: (patient: Patient) => void;  // For direct updates (Chart/Verify)
  onDeletePatient: (patientId: string) => void;
  onBookAppointment: (patientId: string) => void;
}

// Helpers defined outside component
const DetailRow = ({ label, value, icon: Icon }: { label: string, value?: string | number, icon?: any }) => {
    if (!value) return null;
    return (
        <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-slate-100 last:border-0">
            <span className="text-slate-500 text-sm flex items-center gap-2">
                {Icon && <Icon size={14} className="text-slate-400" />}
                {label}
            </span>
            <span className="font-medium text-slate-800 text-sm text-right">{value}</span>
        </div>
    );
};

const MedicalStatusRow = ({ label, value, details }: { label: string, value?: boolean | string, details?: string }) => {
    if (!value || value === 'No') return null;
    return (
        <div className="bg-red-50/80 p-3 rounded-lg border border-red-100 mb-2">
            <div className="flex items-center gap-2 font-bold text-red-800 text-sm">
                <Activity size={16} />
                {label}
            </div>
            {details && <div className="mt-1 text-sm text-slate-700 ml-6">{details}</div>}
        </div>
    );
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
    onDeletePatient,
    onBookAppointment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isDentalHistoryExpanded, setIsDentalHistoryExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'chart'>('details');

  // Derived selected patient object
  const selectedPatient = useMemo(() => 
    patients.find(p => p.id === selectedPatientId) || null, 
  [patients, selectedPatientId]);

  // Generate summary when patient is selected
  useEffect(() => {
    if (selectedPatient) {
        setSummary(null);
        setLoadingSummary(true);
        summarizePatient(selectedPatient, appointments).then(sum => {
            setSummary(sum || "No summary available.");
            setLoadingSummary(false);
        });
        setIsDentalHistoryExpanded(true);
        setActiveTab('details');
    }
  }, [selectedPatient, appointments]);

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;

    const fuse = new Fuse(patients, {
      keys: ['name', 'firstName', 'surname', 'email', 'phone', 'insuranceProvider'],
      threshold: 0.3,
      distance: 100,
    });

    return fuse.search(searchTerm).map(result => result.item);
  }, [patients, searchTerm]);

  const isReadOnly = currentUser.role === UserRole.HYGIENIST;

  const isCritical = (p: Patient) => {
    return (
        p.seriousIllness || 
        p.underMedicalTreatment ||
        p.takingMedications ||
        (p.allergies && p.allergies.length > 0 && !p.allergies.includes('None')) || 
        (p.medicalConditions && p.medicalConditions.length > 0 && !p.medicalConditions.includes('None'))
    );
  };

  const critical = selectedPatient ? isCritical(selectedPatient) : false;

  const confirmDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (selectedPatient && window.confirm(`Are you sure you want to delete ${selectedPatient.name}? This cannot be undone.`)) {
          onDeletePatient(selectedPatient.id);
      }
  };

  const handleVerifyMedical = () => {
    if (!selectedPatient) return;
    const updatedPatient = {
        ...selectedPatient,
        medicalHistoryReviewedBy: currentUser.name,
        medicalHistoryReviewedDate: new Date().toISOString()
    };
    onQuickUpdatePatient(updatedPatient);
  };

  // Updates the chart silently without opening the modal
  const handleToothClick = (tooth: number) => {
      if(!selectedPatient || isReadOnly) return;
      
      const currentChart = selectedPatient.dentalChart || [];
      const existingEntry = currentChart.find(c => c.toothNumber === tooth);
      
      let newChart: DentalChartEntry[];

      if (existingEntry) {
          // Cycle Status: Planned -> Completed -> Existing -> Clear
          if (existingEntry.status === 'Planned') {
              newChart = currentChart.map(c => c.toothNumber === tooth ? { ...c, status: 'Completed' } : c);
          } else if (existingEntry.status === 'Completed') {
              newChart = currentChart.map(c => c.toothNumber === tooth ? { ...c, status: 'Existing' } : c);
          } else {
               newChart = currentChart.filter(c => c.toothNumber !== tooth);
          }
      } else {
          // Default new to Planned
          newChart = [...currentChart, { toothNumber: tooth, status: 'Planned', procedure: 'Examination' }];
      }

      onQuickUpdatePatient({ ...selectedPatient, dentalChart: newChart });
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* List Column */}
      <div className={`flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col ${selectedPatientId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center gap-2">
          <div className="flex-1">
             <h2 className="text-xl font-bold text-slate-800">Patients</h2>
          </div>
          {!isReadOnly && (
            <button 
                onClick={onAddPatient}
                className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium shadow-sm"
            >
                <UserPlus size={18} />
                <span className="hidden sm:inline">New Patient</span>
            </button>
          )}
        </div>
        
        <div className="p-4 pt-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                type="text" 
                placeholder="Search patients..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No patients found.</p>
            </div>
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
                        {isCritical(patient) && (
                            <AlertTriangle size={14} className="text-red-500 fill-red-100 shrink-0" />
                        )}
                    </div>
                    <p className="text-sm text-slate-500 truncate">{patient.insuranceProvider}</p>
                </div>
                <ChevronRight size={18} className={`text-slate-300 group-hover:text-teal-500 ${selectedPatientId === patient.id ? 'text-teal-500' : ''}`} />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail Column */}
      {selectedPatient ? (
        <div className="flex-[2] bg-white rounded-2xl shadow-sm border border-slate-100 p-0 relative animate-in slide-in-from-right-10 duration-300 overflow-hidden flex flex-col">
           
           {/* HEADER (Sticky) */}
           <div 
                className={`pt-6 px-6 pb-6 border-b sticky top-0 z-10 transition-colors duration-300 ${
                    critical ? 'border-red-200 text-slate-900' : 'bg-white border-slate-100 text-slate-900'
                }`}
                style={{ backgroundColor: critical ? 'rgb(245, 147, 147)' : undefined }}
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
                    {/* Line 1: Name */}
                    <h2 className="text-3xl font-bold">
                        {selectedPatient.name}
                    </h2>
                    
                    {/* Line 2: ID and Mobile - SAME FONT SIZE AND STYLE */}
                    <div className={`flex flex-wrap gap-6 text-base font-semibold ${critical ? 'text-slate-900' : 'text-slate-500'}`}>
                        <span className="flex items-center gap-2"><Hash size={16} strokeWidth={2.5}/> {selectedPatient.id}</span>
                        <span className="flex items-center gap-2"><Phone size={16} strokeWidth={2.5}/> {selectedPatient.phone}</span>
                    </div>

                    {/* Line 3: Actions */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {isReadOnly ? (
                            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                                critical ? 'bg-white/80 text-slate-900 border border-slate-200' : 'text-orange-600 bg-orange-100'
                            }`}>
                                <Lock size={12} /> Read Only
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                                <a href={`tel:${selectedPatient.phone}`} className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm transition-colors ${critical ? 'bg-white/40 hover:bg-white/60 text-black' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`} title="Call">
                                    <Phone size={16} /> Call
                                </a>
                                <a href={`sms:${selectedPatient.phone}`} className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm transition-colors ${critical ? 'bg-white/40 hover:bg-white/60 text-black' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`} title="SMS">
                                    <MessageSquare size={16} /> SMS
                                </a>
                                <button 
                                    onClick={() => onBookAppointment(selectedPatient.id)}
                                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm transition-colors ${critical ? 'bg-white/40 hover:bg-white/60 text-black' : 'bg-lilac-100 hover:bg-lilac-200 text-lilac-700'}`} 
                                    title="Book Appointment"
                                >
                                    <CalendarPlus size={16} /> Book
                                </button>
                                <button 
                                    onClick={() => onEditPatient(selectedPatient)}
                                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm transition-colors ${critical ? 'bg-white/40 hover:bg-white/60 text-black' : 'bg-teal-100 hover:bg-teal-200 text-teal-700'}`} 
                                    title="Edit"
                                >
                                    <Pencil size={16} /> Edit
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm transition-colors ${critical ? 'bg-white/40 hover:bg-white/60 text-black' : 'bg-red-100 hover:bg-red-200 text-red-700'}`} 
                                    title="Delete"
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
           </div>

           {/* Line 4: Tab Selection - OUTSIDE OF HEADER */}
           <div className="bg-white px-6 border-b border-slate-200 flex gap-6 shrink-0 z-0">
                <button 
                    onClick={() => setActiveTab('details')}
                    className={`py-4 font-bold text-sm border-b-2 transition-all ${activeTab === 'details' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    Medical Record
                </button>
                <button 
                    onClick={() => setActiveTab('chart')}
                    className={`py-4 font-bold text-sm border-b-2 transition-all ${activeTab === 'chart' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    Dental Chart
                </button>
           </div>

           {/* Scrollable Content */}
           <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
                
                {activeTab === 'chart' ? (
                     <div className="space-y-6">
                         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-slate-800">Odontogram (FDI)</h3>
                                <span className="text-xs text-slate-400">Click teeth to toggle status</span>
                             </div>
                             <Odontogram 
                                chart={selectedPatient.dentalChart || []} 
                                readOnly={isReadOnly}
                                onToothClick={handleToothClick}
                             />
                         </div>
                     </div>
                ) : (
                    <>
                    {/* 1. INTERNAL DENTAL HISTORY (Practice History) - Collapsible */}
                    <section className="bg-white rounded-xl border border-teal-100 overflow-hidden shadow-sm">
                        <button 
                            onClick={() => setIsDentalHistoryExpanded(!isDentalHistoryExpanded)}
                            className="w-full flex items-center justify-between p-4 bg-teal-50/50 hover:bg-teal-50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Shield className="text-teal-600" size={20} />
                                <h3 className="text-lg font-bold text-teal-900">Practice Treatment History</h3>
                            </div>
                            {isDentalHistoryExpanded ? <ChevronUp size={20} className="text-teal-700"/> : <ChevronDown size={20} className="text-teal-700"/>}
                        </button>
                        
                        {isDentalHistoryExpanded && (
                            <div className="p-4 border-t border-teal-100/50">
                                <h4 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-3">Procedures done with us</h4>
                                {selectedPatient.treatments && selectedPatient.treatments.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedPatient.treatments.map(t => (
                                            <div key={t} className="bg-white p-3 rounded-lg border border-teal-100 shadow-sm">
                                                <div className="font-bold text-teal-800 text-sm flex items-center justify-between">
                                                    {t}
                                                    <Check size={14} />
                                                </div>
                                                {selectedPatient.treatmentDetails?.[t] && (
                                                    <div className="text-slate-600 text-xs mt-1 pl-2 border-l-2 border-teal-200">
                                                        "{selectedPatient.treatmentDetails[t]}"
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-slate-400 text-sm italic py-2">No treatments recorded at this practice yet.</div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* 2. CRITICAL ALERTS (Conditions & Allergies) */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
                            <AlertTriangle className="text-red-500" size={20} />
                            <h3 className="text-lg font-bold text-slate-800">Critical Alerts</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Allergies Pop-over / Badge */}
                            <div className="bg-white rounded-xl p-4 border border-red-100 shadow-sm">
                                <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    Allergies
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedPatient.allergies && selectedPatient.allergies.length > 0 ? (
                                        <>
                                            {selectedPatient.allergies.length > 3 ? (
                                                <div className="group relative">
                                                    <span className="text-sm font-bold bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-200 shadow-sm cursor-help">
                                                        {selectedPatient.allergies.length} Known Allergies (Hover)
                                                    </span>
                                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white p-3 rounded-lg shadow-xl border border-red-100 hidden group-hover:block z-20">
                                                        <ul className="list-disc pl-4 text-xs text-slate-700">
                                                            {selectedPatient.allergies.map(a => <li key={a}>{a}</li>)}
                                                            {selectedPatient.otherAllergies && <li>{selectedPatient.otherAllergies}</li>}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ) : (
                                                selectedPatient.allergies.map(a => (
                                                    <span key={a} className="text-sm font-bold bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-200 shadow-sm">
                                                        {a}
                                                    </span>
                                                ))
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-slate-500 text-sm italic">None recorded</span>
                                    )}
                                </div>
                            </div>

                            {/* Conditions */}
                            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    Diagnosed Conditions
                                </h4>
                                 <div className="flex flex-wrap gap-2">
                                    {selectedPatient.medicalConditions && selectedPatient.medicalConditions.length > 0 ? (
                                        <>
                                            {selectedPatient.medicalConditions.map(c => (
                                                <span key={c} className="text-sm font-medium bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                                    {c}
                                                </span>
                                            ))}
                                            {selectedPatient.otherConditions && (
                                                <span className="text-sm font-medium bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                                    {selectedPatient.otherConditions}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-slate-400 text-sm italic">None recorded</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. MEDICAL HISTORY (Third Priority) */}
                    <section>
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <Heart className="text-lilac-500" size={20} />
                                <h3 className="text-lg font-bold text-slate-800">Medical History</h3>
                            </div>
                            
                            {/* Verification Button */}
                            {!isReadOnly && (
                                <button 
                                    onClick={handleVerifyMedical}
                                    className="text-xs flex items-center gap-1 bg-white border border-slate-200 hover:border-teal-300 text-slate-600 hover:text-teal-700 px-3 py-1 rounded-full transition-all shadow-sm"
                                    title="Verify medical history with patient"
                                >
                                    {selectedPatient.medicalHistoryReviewedBy ? (
                                        <>
                                            <CheckCircle size={12} className="text-teal-500" />
                                            Verified by {selectedPatient.medicalHistoryReviewedBy} ({formatDate(selectedPatient.medicalHistoryReviewedDate)})
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={12} /> Mark Verified
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                {selectedPatient.goodHealth && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-800 border border-green-100 rounded-lg text-sm font-bold mb-4">
                                        <Activity size={16} /> Patient Reports Good Health
                                    </div>
                                )}
                                <MedicalStatusRow label="Under Medical Treatment" value={selectedPatient.underMedicalTreatment} details={selectedPatient.medicalTreatmentDetails} />
                                <MedicalStatusRow label="Serious Illness" value={selectedPatient.seriousIllness} details={selectedPatient.seriousIllnessDetails} />
                                <MedicalStatusRow label="Hospitalized Recently" value={selectedPatient.lastHospitalization ? true : false} details={typeof selectedPatient.lastHospitalization === 'string' ? formatDate(selectedPatient.lastHospitalization) : selectedPatient.lastHospitalizationDetails} />
                                <MedicalStatusRow label="Taking Medications" value={selectedPatient.takingMedications} details={selectedPatient.medicationDetails} />
                                {selectedPatient.bloodGroup && (
                                    <div className="bg-white p-3 rounded-lg border border-slate-200 mb-2 shadow-sm">
                                        <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                                            <Activity size={16} className="text-slate-400" />
                                            Blood Group
                                        </div>
                                        <div className="mt-1 text-lg font-bold text-slate-900 ml-6">{selectedPatient.bloodGroup}</div>
                                    </div>
                                )}
                            </div>

                             <div className="space-y-4">
                                {/* Habits */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <h5 className="font-bold text-slate-700 mb-2 text-sm">Habits</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedPatient.tobaccoUse ? (
                                            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold border border-slate-200">Tobacco User</span>
                                        ) : (
                                             <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">Non-Smoker</span>
                                        )}
                                        {selectedPatient.alcoholDrugsUse ? (
                                            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold border border-slate-200">Alcohol/Drug Use</span>
                                        ) : (
                                            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">No Alcohol/Drugs</span>
                                        )}
                                    </div>
                                </div>

                                {/* Female Specific */}
                                {selectedPatient.sex === 'Female' && (selectedPatient.pregnant || selectedPatient.nursing || selectedPatient.birthControl) && (
                                    <div className="bg-lilac-50 p-4 rounded-xl border border-lilac-100">
                                        <h5 className="font-bold text-lilac-700 mb-2 text-sm">Female Health</h5>
                                        <div className="flex flex-col gap-1 text-sm text-lilac-900">
                                            {selectedPatient.pregnant && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-lilac-500"></div>Pregnant</div>}
                                            {selectedPatient.nursing && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-lilac-500"></div>Nursing</div>}
                                            {selectedPatient.birthControl && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-lilac-500"></div>Birth Control</div>}
                                        </div>
                                    </div>
                                )}

                                 {/* AI Summary */}
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText size={16} className="text-blue-600" />
                                        <h4 className="text-sm font-bold text-blue-900">AI Summary</h4>
                                    </div>
                                    {loadingSummary ? (
                                        <div className="animate-pulse space-y-2">
                                            <div className="h-2 bg-blue-200 rounded w-3/4"></div>
                                            <div className="h-2 bg-blue-200 rounded w-full"></div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
                                            {summary}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 4. PERSONAL INFO (Bottom) including Previous Dental History */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
                            <UserPlus className="text-slate-400" size={20} />
                            <h3 className="text-lg font-bold text-slate-800">Personal Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <DetailRow label="Date of Birth" value={formatDate(selectedPatient.dob)} icon={Calendar} />
                                <DetailRow label="Age" value={`${selectedPatient.age} y/o`} />
                                <DetailRow label="Sex" value={selectedPatient.sex} />
                                {selectedPatient.suffix && <DetailRow label="Suffix" value={selectedPatient.suffix} />}
                                <DetailRow label="Email" value={selectedPatient.email} icon={Mail} />
                                <DetailRow label="Secondary Mobile" value={selectedPatient.mobile2} icon={Phone} />
                            </div>
                            <div className="space-y-1">
                                <DetailRow label="Address" value={selectedPatient.homeAddress} icon={MapPin} />
                                <DetailRow label="Barangay" value={selectedPatient.barangay} />
                                <DetailRow label="Occupation" value={selectedPatient.occupation} icon={Briefcase} />
                                <DetailRow label="Responsible Party" value={selectedPatient.responsibleParty} />
                                 <DetailRow label="Father" value={`${selectedPatient.fatherName || ''} ${selectedPatient.fatherOccupation ? `(${selectedPatient.fatherOccupation})` : ''}`} />
                                 <DetailRow label="Mother" value={`${selectedPatient.motherName || ''} ${selectedPatient.motherOccupation ? `(${selectedPatient.motherOccupation})` : ''}`} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div className="space-y-1">
                                 <DetailRow label="Insurance" value={selectedPatient.insuranceProvider} />
                                 <DetailRow label="Insurance #" value={selectedPatient.insuranceNumber} />
                            </div>
                            <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                <h5 className="text-xs font-bold text-slate-400 uppercase mb-2">Previous Dental History</h5>
                                <DetailRow label="Previous Dentist" value={selectedPatient.previousDentist} />
                                <DetailRow label="Last Visit (Outside)" value={formatDate(selectedPatient.lastVisit)} />
                            </div>
                        </div>
                        
                        {selectedPatient.guardian && (
                             <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mt-4">
                                 <div className="text-xs font-bold text-orange-800 uppercase mb-2">Guardian (Minor)</div>
                                 <div className="flex flex-col sm:flex-row gap-4">
                                     <div><span className="text-orange-900/60 text-xs uppercase block">Name</span><span className="font-bold text-slate-800">{selectedPatient.guardian}</span></div>
                                     <div><span className="text-orange-900/60 text-xs uppercase block">Contact</span><span className="font-bold text-slate-800">{selectedPatient.guardianMobile}</span></div>
                                 </div>
                             </div>
                        )}
                    </section>
                    
                    {/* Notes */}
                    <section className="pt-4 border-t border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-2">General Notes</h3>
                        <textarea 
                            className="w-full h-24 p-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:bg-slate-100 disabled:text-slate-500 resize-none shadow-sm"
                            defaultValue={selectedPatient.notes}
                            readOnly={isReadOnly}
                        />
                    </section>
                    </>
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
    </div>
  );
};

export default PatientList;

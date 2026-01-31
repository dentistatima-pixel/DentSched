
import React, { useState, useMemo } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { usePatient } from '../contexts/PatientContext';
import { Patient, CommunicationTemplate, CommunicationChannel } from '../types';
import { Search, Printer, User, X, ArrowLeft } from 'lucide-react';
import Fuse from 'fuse.js';
import jsPDF from 'jspdf';
import { useAppContext } from '../contexts/AppContext';
import { formatDate } from '../constants';
import { useNavigate } from '../contexts/RouterContext';

const CommunicationHub: React.FC = () => {
  const { fieldSettings } = useSettings();
  const { patients } = usePatient();
  const { currentUser } = useAppContext();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);

  const templates = fieldSettings.communicationTemplates || [];
  
  const templateFuse = useMemo(() => new Fuse(templates, {
    keys: ['title', 'category', 'content'],
    threshold: 0.4,
  }), [templates]);

  const patientFuse = useMemo(() => new Fuse(patients, {
    keys: ['name', 'id'],
    threshold: 0.3,
  }), [patients]);

  const categories = useMemo(() => {
      const categoryOrder = ['Welcome Letters', 'Appointments', 'Financial Letters'];
      const allCategories = Array.from(new Set(templates.map(t => t.category))) as string[];
      return allCategories.sort((a, b) => {
          const indexA = categoryOrder.indexOf(a);
          const indexB = categoryOrder.indexOf(b);
          if (indexA > -1 && indexB > -1) return indexA - indexB;
          if (indexA > -1) return -1;
          if (indexB > -1) return 1;
          return a.localeCompare(b);
      });
  }, [templates]);

  useMemo(() => {
      if (categories.length > 0 && !selectedCategory) {
          setSelectedCategory(categories[0]);
      }
  }, [categories, selectedCategory]);

  const filteredTemplates = useMemo(() => {
    if (searchTerm) {
      return templateFuse.search(searchTerm).map(r => r.item);
    }
    if (selectedCategory) {
      return templates.filter(t => t.category === selectedCategory);
    }
    return templates;
  }, [searchTerm, selectedCategory, templates, templateFuse]);

  const handlePatientSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPatientSearch(e.target.value);
    if (e.target.value) {
      setPatientResults(patientFuse.search(e.target.value).map(r => r.item).slice(0, 5));
    } else {
      setPatientResults([]);
      setSelectedPatient(null);
    }
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch(patient.name);
    setPatientResults([]);
  };

  const getPreviewContent = () => {
    if (!selectedTemplate) return 'Select a template and a patient to see a preview.';
    let content = selectedTemplate.content;
    
    // Basic replacements
    content = content.replace(/{currentDate}/g, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    content = content.replace(/{clinicName}/g, fieldSettings.clinicName || 'Our Clinic');
    content = content.replace(/{clinicContactNumber}/g, fieldSettings.branchProfiles[0]?.contactNumber || '[Clinic Number]');

    if (currentUser) {
        content = content.replace(/{practitionerName}/g, currentUser.name);
    }

    if (selectedPatient) {
        content = content.replace(/{patientName}/g, selectedPatient.name);
        // Simplified appointment details for now
        const nextApptDate = selectedPatient.nextVisit;
        content = content.replace(/{appointmentDate}/g, nextApptDate ? formatDate(nextApptDate) : '[APPOINTMENT DATE]');
        content = content.replace(/{appointmentTime}/g, '[APPOINTMENT TIME]');
    } else {
        content = content.replace(/{patientName}/g, '[PATIENT NAME]');
        content = content.replace(/{appointmentDate}/g, '[APPOINTMENT DATE]');
        content = content.replace(/{appointmentTime}/g, '[APPOINTMENT TIME]');
    }

    return content;
  };
  
  const handleGeneratePdf = () => {
    if (!selectedTemplate || !selectedPatient) {
        alert("Please select a template and a patient first.");
        return;
    };
    const doc = new jsPDF();
    const content = getPreviewContent();
    const splitContent = doc.splitTextToSize(content, 180);
    doc.text(splitContent, 15, 20);
    doc.save(`${selectedTemplate.title.replace(/\s/g, '_')}_${selectedPatient.name.replace(/\s/g, '_')}.pdf`);
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('admin')} className="bg-white p-4 rounded-full shadow-sm border hover:bg-slate-100 transition-all active:scale-90" aria-label="Back to Admin Hub">
                <ArrowLeft size={24} className="text-slate-600"/>
            </button>
            <h1 className="text-3xl font-black text-slate-800">Communications Hub</h1>
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
            {/* Left: Categories & Templates */}
            <div className="col-span-12 md:col-span-4 flex flex-col gap-4 bg-white p-6 rounded-[2rem] shadow-sm border">
                <input type="text" placeholder="Search templates..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setSelectedCategory(null); }} className="input"/>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button onClick={() => setSelectedCategory(null)} className={`px-4 py-1.5 text-xs font-black rounded-full transition-colors whitespace-nowrap ${!selectedCategory && !searchTerm ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>All</button>
                    {categories.map(c => <button key={c} onClick={() => { setSelectedCategory(c); setSearchTerm(''); }} className={`px-4 py-1.5 text-xs font-black rounded-full transition-colors whitespace-nowrap ${selectedCategory === c ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{c}</button>)}
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {filteredTemplates.map(t => (
                        <button key={t.id} onClick={() => setSelectedTemplate(t)} className={`w-full text-left p-4 rounded-xl transition-colors ${selectedTemplate?.id === t.id ? 'bg-teal-100' : 'hover:bg-slate-50'}`}>
                            <p className="font-bold text-sm text-slate-800">{t.title}</p>
                            <p className="text-xs text-slate-500 font-bold uppercase mt-1">{t.category}</p>
                        </button>
                    ))}
                </div>
            </div>
            {/* Right: Preview & Actions */}
            <div className="col-span-12 md:col-span-8 flex flex-col gap-4 bg-white p-6 rounded-[2rem] shadow-sm border">
                {selectedTemplate ? (
                    <>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">{selectedTemplate.title}</h2>
                            <div className="relative w-full md:w-64">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                {selectedPatient && <button onClick={() => { setSelectedPatient(null); setPatientSearch('');}} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><X size={16}/></button>}
                                <input type="text" value={patientSearch} onChange={handlePatientSearch} placeholder="Select patient..." className="input pl-12"/>
                                {patientResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                                        {patientResults.map(p => <div key={p.id} onClick={() => selectPatient(p)} className="p-3 hover:bg-slate-100 cursor-pointer text-sm font-medium">{p.name}</div>)}
                                    </div>
                                )}
                            </div>
                        </div>
                        <textarea readOnly value={getPreviewContent()} className="input flex-1 h-full resize-none font-mono text-sm bg-slate-50 shadow-inner"/>
                        <div className="flex justify-end">
                            <button onClick={handleGeneratePdf} disabled={!selectedPatient} className="bg-teal-600 text-white px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-teal-600/20 hover:bg-teal-700 disabled:opacity-50 disabled:grayscale transition-all">
                                <Printer size={18}/> Generate PDF
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-center text-slate-400">
                        <p className="font-bold text-lg">Select a template to begin.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
export default CommunicationHub;


import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Save, User, Phone, FileText, Heart, Shield, Check, ToggleLeft, ToggleRight, Zap, Lock, BookOpen, Users, Search, ChevronRight } from 'lucide-react';
import { Patient, FieldSettings } from '../types';
import RegistrationBasicInfo from './RegistrationBasicInfo';
import RegistrationMedical from './RegistrationMedical';
import RegistrationDental from './RegistrationDental';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import { useToast } from './ToastSystem';
import Fuse from 'fuse.js';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Partial<Patient>) => void;
  readOnly?: boolean;
  initialData?: Patient | null;
  fieldSettings: FieldSettings; 
  isKiosk?: boolean; 
  patients?: Patient[]; 
}

const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({ isOpen, onClose, onSave, readOnly = false, initialData = null, fieldSettings, isKiosk = false, patients = [] }) => {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState<string>('basic');
  const [isQuickReg, setIsQuickReg] = useState(true);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  
  // Family Linkage State
  const [familySearchTerm, setFamilySearchTerm] = useState('');
  const [showFamilySearch, setShowFamilySearch] = useState(false);

  const basicRef = useRef<HTMLDivElement>(null);
  const medicalRef = useRef<HTMLDivElement>(null);
  const dentalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialFormState: Partial<Patient> = {
    id: '', sex: undefined, goodHealth: true, allergies: [], medicalConditions: [], treatments: [], firstName: '', middleName: '', surname: '', suffix: '', treatmentDetails: {}, dob: '', age: undefined, homeAddress: '', barangay: '', occupation: '', responsibleParty: '', fatherName: '', fatherOccupation: '', motherName: '', motherOccupation: '', guardian: '', guardianMobile: '', insuranceProvider: '', insuranceNumber: '', phone: '', mobile2: '', email: '', previousDentist: '', lastVisit: '', notes: '', otherAllergies: '', otherConditions: '', bloodGroup: '', medicalTreatmentDetails: '', seriousIllnessDetails: '', lastHospitalizationDetails: '', medicationDetails: '', underMedicalTreatment: false, seriousIllness: false, takingMedications: false, tobaccoUse: false, alcoholDrugsUse: false, pregnant: false, nursing: false, birthControl: false, dpaConsent: false, marketingConsent: false
  };

  const [formData, setFormData] = useState<Partial<Patient>>(initialFormState);

  const familySearchResults = useMemo(() => {
    if (!familySearchTerm) return [];
    const fuse = new Fuse(patients, { keys: ['name', 'phone', 'surname'], threshold: 0.3 });
    return fuse.search(familySearchTerm).map(r => r.item).slice(0, 5);
  }, [familySearchTerm, patients]);

  useEffect(() => {
    if (isOpen) {
        if (initialData) { setFormData({ ...initialData }); setIsQuickReg(false); } 
        else { const generatedId = Math.floor(10000000 + Math.random() * 90000000).toString(); setFormData({ ...initialFormState, id: generatedId }); setIsQuickReg(true); }
        if (isKiosk) { setIsQuickReg(false); }
        setActiveSection('basic');
    }
  }, [isOpen, initialData, isKiosk]);

  const handleLinkFamily = (relative: Patient) => {
      setFormData(prev => ({
          ...prev,
          surname: relative.surname,
          homeAddress: relative.homeAddress,
          barangay: relative.barangay,
          guardian: relative.name,
          guardianMobile: relative.phone,
          responsibleParty: relative.name
      }));
      setShowFamilySearch(false);
      setFamilySearchTerm('');
      toast.info(`Auto-populated data from ${relative.name}'s record.`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (readOnly) return;
    const { name, value, type } = e.target;
    setFormData(prev => {
        const newData = { ...prev };
        if (type === 'checkbox') { const checked = (e.target as HTMLInputElement).checked; (newData as any)[name] = checked; } 
        else { (newData as any)[name] = value; }
        if (name === 'dob' && value) {
            const [year, month, day] = value.split('-').map(Number);
            const birthDate = new Date(year, month - 1, day);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            newData.age = Math.max(0, age);
        }
        return newData;
    });
  };

  const handleArrayChange = (category: 'allergies' | 'medicalConditions' | 'treatments', value: string) => {
    if (readOnly) return;
    setFormData(prev => {
      if (value === 'None') { const wasSelected = (prev[category] || []).includes('None'); return { ...prev, [category]: wasSelected ? [] : ['None'] }; }
      let currentList = prev[category] || [];
      if (currentList.includes('None')) currentList = [];
      if (currentList.includes(value)) return { ...prev, [category]: currentList.filter(item => item !== value) };
      else return { ...prev, [category]: [...currentList, value] };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!formData.dpaConsent) { toast.error("Compliance Error: Data Privacy Consent is required."); return; }
    if (!formData.firstName || !formData.surname || !formData.phone) { toast.error("First Name, Surname, and Mobile Number are required."); return; }
    const fullName = `${formData.firstName || ''} ${formData.middleName || ''} ${formData.surname || ''}`.replace(/\s+/g, ' ').trim();
    onSave({ ...formData, name: fullName, provisional: isQuickReg });
    onClose();
  };

  const scrollToSection = (section: string) => {
      setActiveSection(section);
      let ref = basicRef;
      if (section === 'medical') ref = medicalRef;
      if (section === 'dental') ref = dentalRef;
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!isOpen) return null;

  const containerClasses = isKiosk ? "w-full h-full bg-white flex flex-col" : "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-end md:items-center p-0 md:p-4";
  const modalClasses = isKiosk ? "flex-1 flex flex-col h-full bg-white overflow-hidden" : "bg-white w-full md:max-w-4xl h-[95vh] md:h-[90vh] md:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-20 duration-300 overflow-hidden";

  return (
    <div className={containerClasses}>
      <div className={modalClasses}>
        <div className={`flex justify-between items-center p-4 md:p-6 border-b border-slate-100 bg-teal-900 text-white shrink-0 ${!isKiosk && 'md:rounded-t-3xl'}`}>
          <div className="flex items-center gap-3">
            <div className="bg-lilac-500 p-2 rounded-xl shadow-lg shadow-lilac-500/20"><User size={24} className="text-white" /></div>
            <div><h2 className="text-xl font-bold">{isKiosk ? 'My Information' : (initialData ? 'Edit Patient' : 'New Patient')}</h2><p className="text-teal-200 text-xs hidden md:block">{isKiosk ? 'Please review your details.' : (isQuickReg ? 'Quick Registration Mode' : 'Full Clinical Registration')}</p></div>
          </div>
          <div className="flex items-center gap-4">
              {!initialData && !isKiosk && (
                  <button onClick={() => setShowFamilySearch(!showFamilySearch)} className="flex items-center gap-2 bg-lilac-600 hover:bg-lilac-700 px-4 py-1.5 rounded-full transition-all border border-lilac-400 shadow-lg text-xs font-bold uppercase"><Users size={16}/> Link Family</button>
              )}
              {!initialData && !isKiosk && (
                  <button onClick={() => setIsQuickReg(!isQuickReg)} className="flex items-center gap-2 bg-teal-800 hover:bg-teal-700 px-3 py-1.5 rounded-full transition-colors border border-teal-600">{isQuickReg ? <Zap size={16} className="text-yellow-300"/> : <FileText size={16} className="text-teal-300"/><span className="text-xs font-bold uppercase">{isQuickReg ? 'Quick' : 'Full'}</span>}</button>
              )}
              {!isKiosk && <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>}
          </div>
        </div>

        {showFamilySearch && (
            <div className="bg-lilac-50 border-b border-lilac-100 p-4 animate-in slide-in-from-top-2 duration-300">
                <div className="max-w-xl mx-auto relative">
                    <label className="block text-[10px] font-bold text-lilac-700 uppercase mb-2 ml-1">Link to existing family member (Auto-fills Surname & Address)</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lilac-400" size={18} />
                        <input type="text" placeholder="Search by name or phone..." className="w-full pl-10 pr-4 py-3 bg-white border-2 border-lilac-200 rounded-2xl focus:border-lilac-500 outline-none text-sm font-bold" value={familySearchTerm} onChange={e => setFamilySearchTerm(e.target.value)} autoFocus />
                    </div>
                    {familySearchTerm && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-lilac-100 overflow-hidden z-50">
                            {familySearchResults.length > 0 ? familySearchResults.map(p => (
                                <button key={p.id} onClick={() => handleLinkFamily(p)} className="w-full text-left p-4 hover:bg-lilac-50 flex justify-between items-center border-b border-slate-50 last:border-0 group">
                                    <div><div className="font-bold text-slate-800 group-hover:text-lilac-700">{p.name}</div><div className="text-xs text-slate-500">{p.phone} • {p.homeAddress}</div></div>
                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-lilac-500" />
                                </button>
                            )) : <div className="p-6 text-center text-slate-400 text-sm">No matching family records found.</div>}
                        </div>
                    )}
                </div>
            </div>
        )}

        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 scroll-smooth">
            <form id="patientForm" onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
                <div ref={basicRef}><RegistrationBasicInfo formData={formData} handleChange={handleChange} readOnly={readOnly} fieldSettings={fieldSettings} /></div>
                {!isQuickReg && (
                    <>
                        <div ref={medicalRef}><RegistrationMedical formData={formData} handleChange={handleChange} handleArrayChange={handleArrayChange} readOnly={readOnly} fieldSettings={fieldSettings} /></div>
                        <div ref={dentalRef}><RegistrationDental formData={formData} handleChange={handleChange} handleArrayChange={handleArrayChange} handleTreatmentSelect={(v) => setFormData(prev => ({ ...prev, treatments: v ? [v] : [] }))} handleTreatmentDetailChange={(proc, value) => setFormData(prev => ({ ...prev, treatmentDetails: { ...prev.treatmentDetails, [proc]: value } }))} readOnly={readOnly} fieldSettings={fieldSettings} /></div>
                    </>
                )}
                <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-3 mb-4"><Lock size={20} /><h3 className="font-bold text-lg">Data Privacy & Consent (DPA 2012)</h3></div>
                    <div className="space-y-4">
                        <label className="flex items-start gap-3 p-4 bg-slate-700 rounded-lg cursor-pointer border border-slate-600 has-[:checked]:border-teal-400 has-[:checked]:bg-teal-900/50 transition-all"><input type="checkbox" name="dpaConsent" checked={formData.dpaConsent} onChange={handleChange} className="w-5 h-5 accent-teal-500 rounded mt-1 shrink-0" /><div><div className="flex items-center gap-2"><span className="font-bold text-teal-300">Mandatory Data Processing *</span><button type="button" onClick={(e) => { e.preventDefault(); setShowPrivacyPolicy(true); }} className="text-xs bg-slate-600 px-2 py-0.5 rounded hover:bg-slate-500 flex items-center gap-1"><BookOpen size={10} /> Policy</button></div><p className="text-xs text-slate-300 mt-1">I expressly consent to the processing of my Sensitive Personal Information for clinical and regulatory purposes.</p></div></label>
                        <label className="flex items-start gap-3 p-4 bg-slate-700 rounded-lg cursor-pointer border border-slate-600 has-[:checked]:border-teal-400 has-[:checked]:bg-teal-900/50 transition-all"><input type="checkbox" name="marketingConsent" checked={formData.marketingConsent} onChange={handleChange} className="w-5 h-5 accent-teal-500 rounded mt-1 shrink-0" /><div><span className="font-bold">Optional Communications</span><p className="text-xs text-slate-300 mt-1">I agree to receive SMS reminders and clinic promotions.</p></div></label>
                    </div>
                </div>
            </form>
        </div>

        <div className={`p-4 border-t border-slate-200 bg-white shrink-0 flex justify-between items-center z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] ${!isKiosk && 'md:rounded-b-3xl'}`}>
             {!isQuickReg ? (<div className="hidden md:flex gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide"><button onClick={() => scrollToSection('basic')} className={`hover:text-teal-600 ${activeSection === 'basic' ? 'text-teal-600' : ''}`}>Profile</button><span>•</span><button onClick={() => scrollToSection('medical')} className={`hover:text-teal-600 ${activeSection === 'medical' ? 'text-teal-600' : ''}`}>Medical</button><span>•</span><button onClick={() => scrollToSection('dental')} className={`hover:text-teal-600 ${activeSection === 'dental' ? 'text-teal-600' : ''}`}>Dental</button></div>) : <div />}
            <div className="flex gap-2">{(readOnly || isKiosk) && (<button onClick={onClose} className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all">{isKiosk ? 'Cancel' : 'Close'}</button>)} {!readOnly && (<button onClick={handleSubmit} className="flex items-center gap-2 px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 hover:scale-105 transition-all"><Save size={20} /> {isKiosk ? 'Save Changes' : (isQuickReg ? 'Quick Register' : 'Save Full Record')}</button>)}</div>
        </div>
      </div>
      <PrivacyPolicyModal isOpen={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} />
      <style>{`.input { width: 100%; padding: 0.75rem 1rem; background-color: white; border: 1px solid #e2e8f0; border-radius: 0.75rem; outline: none; transition: all 0.2s; } .input:focus { border-color: #0d9488; box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.1); } .label { display: block; font-size: 0.875rem; font-weight: 600; color: #334155; margin-bottom: 0.375rem; }`}</style>
    </div>
  );
};

export default PatientRegistrationModal;

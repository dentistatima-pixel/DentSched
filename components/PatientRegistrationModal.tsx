
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Save, User, Phone, FileText, Heart, Shield, Check, ToggleLeft, ToggleRight, Zap, Lock, BookOpen, Users, Search, ChevronRight, AlertCircle, Baby, ShieldCheck } from 'lucide-react';
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
  const [isQuickReg, setIsQuickReg] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  
  const [familySearchTerm, setFamilySearchTerm] = useState('');
  const [showFamilySearch, setShowFamilySearch] = useState(false);

  const basicRef = useRef<HTMLDivElement>(null);
  const medicalRef = useRef<HTMLDivElement>(null);
  const dentalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialFormState: Partial<Patient> = {
    id: '', sex: undefined, goodHealth: true, allergies: [], medicalConditions: [], treatments: [], firstName: '', middleName: '', surname: '', suffix: '', treatmentDetails: {}, dob: '', age: undefined, homeAddress: '', barangay: '', occupation: '', responsibleParty: '', fatherName: '', fatherOccupation: '', motherName: '', motherOccupation: '', guardian: '', guardianMobile: '', insuranceProvider: '', insuranceNumber: '', phone: '', mobile2: '', email: '', previousDentist: '', lastVisit: '', notes: '', otherAllergies: '', otherConditions: '', bloodGroup: '', medicalTreatmentDetails: '', seriousIllnessDetails: '', lastHospitalizationDetails: '', medicationDetails: '', underMedicalTreatment: false, seriousIllness: false, takingMedications: false, tobaccoUse: false, alcoholDrugsUse: false, pregnant: false, nursing: false, birthControl: false, dpaConsent: false, marketingConsent: false,
    takingBloodThinners: false, takingBisphosphonates: false, heartValveIssues: false, tookBpMedicationToday: true, anesthesiaReaction: false, respiratoryIssues: false,
    isPwd: false, guardianIdType: '', guardianIdNumber: '', relationshipToPatient: ''
  };

  const [formData, setFormData] = useState<Partial<Patient>>(initialFormState);

  const isPediatric = useMemo(() => formData.age !== undefined && formData.age < 18, [formData.age]);
  const requiresGuardian = useMemo(() => isPediatric || formData.isPwd, [isPediatric, formData.isPwd]);

  const familySearchResults = useMemo(() => {
    if (!familySearchTerm) return [];
    const fuse = new Fuse(patients, { keys: ['name', 'phone', 'surname'], threshold: 0.3 });
    return fuse.search(familySearchTerm).map(r => r.item).slice(0, 5);
  }, [familySearchTerm, patients]);

  useEffect(() => {
    if (isOpen) {
        if (initialData) { 
            setFormData({ ...initialData }); 
            setIsQuickReg(false); 
        } 
        else { 
            const generatedId = Math.floor(10000000 + Math.random() * 90000000).toString(); 
            setFormData({ ...initialFormState, id: generatedId }); 
            setIsQuickReg(false); 
        }
        setActiveSection('basic');
    }
  }, [isOpen, initialData]);

  const handleLinkFamily = (relative: Patient) => {
      setFormData(prev => ({
          ...prev,
          surname: relative.surname,
          homeAddress: relative.homeAddress,
          barangay: relative.barangay,
          guardian: relative.name,
          guardianMobile: relative.phone,
          responsibleParty: relative.name,
          relationshipToPatient: 'Parent'
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
    
    if (!formData.dpaConsent) { 
        toast.error("Privacy Compliance: You must accept the Data Privacy Consent before continuing."); 
        setActiveSection('basic');
        basicRef.current?.scrollIntoView({ behavior: 'smooth' });
        return; 
    }

    if (requiresGuardian && (!formData.guardian || !formData.relationshipToPatient)) {
        toast.error("Compliance Check: Legal Guardian details and Proof of Relationship are mandatory for Minors/PWD.");
        setActiveSection('basic');
        return;
    }
    
    if (!isQuickReg) {
        if (!formData.allergies?.length) { toast.error("Clinical Safety: Record 'None' if no allergies."); setActiveSection('medical'); return; }
        if (!formData.medicalConditions?.length) { toast.error("Clinical Safety: Record 'None' if no conditions."); setActiveSection('medical'); return; }
    }

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

  return (
    <div className={isKiosk ? "w-full h-full bg-white flex flex-col" : "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-end md:items-center p-0 md:p-4"}>
      <div className={isKiosk ? "flex-1 flex flex-col h-full bg-white overflow-hidden" : "bg-white w-full md:max-w-4xl h-[95vh] md:h-[90vh] md:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-20 duration-300 overflow-hidden"}>
        <div className={`flex justify-between items-center p-4 md:p-6 border-b border-slate-100 bg-teal-900 text-white shrink-0 ${!isKiosk && 'md:rounded-t-3xl'}`}>
          <div className="flex items-center gap-3">
            <div className="bg-lilac-500 p-2 rounded-xl shadow-lg shadow-lilac-500/20"><User size={24} className="text-white" /></div>
            <div>
                <h2 className="text-xl font-bold">{isKiosk ? 'My Information' : (initialData ? 'Edit Patient' : 'New Patient')}</h2>
                <div className="flex items-center gap-2 mt-0.5"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isQuickReg ? 'bg-amber-400 text-amber-950' : 'bg-teal-700 text-teal-100'}`}>{isQuickReg ? 'Provisional Entry' : 'Full Clinical Enrollment'}</span></div>
            </div>
          </div>
          <div className="flex items-center gap-4">
              {!initialData && !isKiosk && (<button onClick={() => setShowFamilySearch(!showFamilySearch)} className="flex items-center gap-2 bg-lilac-600 hover:bg-lilac-700 px-4 py-1.5 rounded-full transition-all border border-lilac-400 shadow-lg text-xs font-bold uppercase"><Users size={16}/> Link Family</button>)}
              {!isKiosk && <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>}
          </div>
        </div>

        {showFamilySearch && (
            <div className="bg-lilac-50 border-b border-lilac-100 p-4 animate-in slide-in-from-top-2 duration-300">
                <div className="max-w-xl mx-auto relative">
                    <label className="block text-[10px] font-bold text-lilac-700 uppercase mb-2 ml-1">Link family member</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lilac-400" size={18} />
                        <input type="text" placeholder="Search by name or phone..." className="w-full pl-10 pr-4 py-3 bg-white border-2 border-lilac-200 rounded-2xl focus:border-lilac-500 outline-none text-sm font-bold" value={familySearchTerm} onChange={e => setFamilySearchTerm(e.target.value)} />
                    </div>
                </div>
            </div>
        )}

        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 scroll-smooth no-scrollbar">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="bg-white border-2 border-teal-100 p-6 rounded-3xl shadow-sm ring-4 ring-teal-500/5 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3 mb-4"><div className="p-2 bg-teal-50 rounded-xl text-teal-600"><Lock size={20} /></div><h3 className="font-bold text-lg text-slate-800">PDA Compliance & Privacy Notice</h3></div>
                    <label className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer border-2 transition-all ${formData.dpaConsent ? 'bg-teal-50 border-teal-500 shadow-md ring-2 ring-teal-500/10' : 'bg-slate-50 border-slate-200 grayscale opacity-80'}`}>
                        <input type="checkbox" name="dpaConsent" checked={formData.dpaConsent} onChange={handleChange} className="w-6 h-6 accent-teal-600 rounded mt-1 shrink-0" />
                        <div><div className="flex items-center gap-2 mb-1"><span className="font-extrabold text-teal-900 uppercase text-xs">Primary Clinical Consent *</span><button type="button" onClick={(e) => { e.preventDefault(); setShowPrivacyPolicy(true); }} className="text-[10px] font-bold bg-white text-teal-600 border border-teal-200 px-2 py-0.5 rounded-full hover:bg-teal-500 hover:text-white">Review Policy</button></div><p className="text-xs text-slate-600 leading-relaxed">I expressly consent to the processing of my Sensitive Personal Information (Medical & Dental History) in compliance with the Philippines Data Privacy Act of 2012.</p></div>
                    </label>
                </div>

                {requiresGuardian && (
                    <div className="bg-lilac-50 border-2 border-lilac-200 p-6 rounded-3xl shadow-sm animate-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-white rounded-xl text-lilac-600 shadow-sm"><Baby size={20}/></div><div><h3 className="font-bold text-lg text-lilac-900">Guardian Verification (Minor/PWD)</h3><p className="text-xs text-lilac-600 font-medium uppercase tracking-tight">Mandatory Proof of Representation under PDA Rule 4</p></div></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="label text-lilac-800">Guardian Full Name *</label><input type="text" name="guardian" value={formData.guardian || ''} onChange={handleChange} className="input border-lilac-200 focus:border-lilac-500" required /></div>
                            <div><label className="label text-lilac-800">Relationship *</label><select name="relationshipToPatient" value={formData.relationshipToPatient || ''} onChange={handleChange} className="input border-lilac-200 focus:border-lilac-500" required><option value="">- Select -</option><option>Mother</option><option>Father</option><option>Grandparent</option><option>Sibling (of age)</option><option>Legal Representative</option></select></div>
                            <div><label className="label">Guardian ID Type</label><select name="guardianIdType" value={formData.guardianIdType || ''} onChange={handleChange} className="input border-lilac-200"><option value="">- Select ID -</option><option>UMID</option><option>PhilID (National ID)</option><option>Passport</option><option>Driver's License</option></select></div>
                            <div><label className="label">Guardian ID Number</label><input type="text" name="guardianIdNumber" value={formData.guardianIdNumber || ''} onChange={handleChange} className="input border-lilac-200" /></div>
                        </div>
                    </div>
                )}

                <form id="patientForm" onSubmit={handleSubmit} className="space-y-8">
                    <div ref={basicRef}><RegistrationBasicInfo formData={formData} handleChange={handleChange} readOnly={readOnly} fieldSettings={fieldSettings} /></div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="isPwd" checked={formData.isPwd} onChange={handleChange} className="w-5 h-5 accent-lilac-500 rounded" /><div><span className="font-bold text-slate-700">Patient has PWD Status</span><p className="text-[10px] text-slate-400 font-bold uppercase">Triggers Guardian Verification Workflow</p></div></label></div>
                    {!isQuickReg && (
                        <>
                            <div ref={medicalRef}><RegistrationMedical formData={formData} handleChange={handleChange} handleArrayChange={handleArrayChange} readOnly={readOnly} fieldSettings={fieldSettings} /></div>
                            <div ref={dentalRef}><RegistrationDental formData={formData} handleChange={handleChange} handleArrayChange={handleArrayChange} handleTreatmentSelect={(v) => setFormData(prev => ({ ...prev, treatments: v ? [v] : [] }))} handleTreatmentDetailChange={(proc, value) => setFormData(prev => ({ ...prev, treatmentDetails: { ...prev.treatmentDetails, [proc]: value } }))} readOnly={readOnly} fieldSettings={fieldSettings} /></div>
                        </>
                    )}
                </form>
            </div>
        </div>

        <div className={`p-4 border-t border-slate-200 bg-white shrink-0 flex justify-between items-center z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] ${!isKiosk && 'md:rounded-b-3xl'}`}>
            <div />
            <div className="flex gap-2">
                {!readOnly && (<button onClick={handleSubmit} className="flex items-center gap-3 px-10 py-4 bg-teal-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-teal-600/30 hover:bg-teal-700 transition-all"><Save size={20} /> {isKiosk ? 'Submit Records' : (isQuickReg ? 'Process Intake' : 'Save Full Clinical Record')}</button>)}
            </div>
        </div>
      </div>
      <PrivacyPolicyModal isOpen={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} />
    </div>
  );
};

export default PatientRegistrationModal;

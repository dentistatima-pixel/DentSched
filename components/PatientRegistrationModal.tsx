import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Save, User, Heart, FileText, Lock } from 'lucide-react';
import { Patient, FieldSettings, DentalChartEntry } from '../types';
import RegistrationBasicInfo from './RegistrationBasicInfo';
import RegistrationMedical from './RegistrationMedical';
import RegistrationDental from './RegistrationDental';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import { useToast } from './ToastSystem';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Partial<Patient>) => void;
  readOnly?: boolean;
  initialData?: Patient | null;
  fieldSettings: FieldSettings; 
  patients?: Patient[]; 
  isKiosk?: boolean;
  currentBranch: string;
}

const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({ isOpen, onClose, onSave, readOnly = false, initialData = null, fieldSettings, patients = [], isKiosk = false, currentBranch }) => {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState<string>('basic');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  
  const basicRef = useRef<HTMLDivElement>(null);
  const medicalRef = useRef<HTMLDivElement>(null);
  const dentalRef = useRef<HTMLDivElement>(null);

  const initialFormState: Partial<Patient> = {
    id: '', sex: undefined, goodHealth: true, allergies: [], medicalConditions: [], treatments: [], firstName: '', middleName: '', surname: '', suffix: '', treatmentDetails: {}, dob: '', age: undefined, homeAddress: '', barangay: '', occupation: '', responsibleParty: '', fatherName: '', fatherOccupation: '', motherName: '', motherOccupation: '', guardian: '', guardianMobile: '', insuranceProvider: '', insuranceNumber: '', phone: '', mobile2: '', email: '', previousDentist: '', lastVisit: '', notes: '', otherAllergies: '', otherConditions: '', bloodGroup: '', medicalTreatmentDetails: '', seriousIllnessDetails: '', lastHospitalizationDetails: '', lastHospitalizationDate: '', medicationDetails: '', underMedicalTreatment: false, seriousIllness: false, takingMedications: false, tobaccoUse: false, alcoholDrugsUse: false, pregnant: false, nursing: false, birthControl: false, dpaConsent: false, marketingConsent: false,
    takingBloodThinners: false, takingBisphosphonates: false, heartValveIssues: false, tookBpMedicationToday: true, anesthesiaReaction: false, respiratoryIssues: false,
    isPwd: false, guardianIdType: '', guardianIdNumber: '', relationshipToPatient: '',
    dentalChart: []
  };

  const [formData, setFormData] = useState<Partial<Patient>>(initialFormState);

  const isPediatric = useMemo(() => formData.age !== undefined && formData.age < 18, [formData.age]);
  const requiresGuardian = useMemo(() => isPediatric || formData.isPwd, [isPediatric, formData.isPwd]);

  useEffect(() => {
    if (isOpen) {
        if (initialData) { 
            setFormData({ ...initialData }); 
        } 
        else { 
            const generatedId = Math.floor(10000000 + Math.random() * 90000000).toString(); 
            setFormData({ ...initialFormState, id: generatedId, originatingBranch: currentBranch }); 
        }
        setActiveSection('basic');
    }
  }, [isOpen, initialData, currentBranch]);

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

  const handleUpdateChart = (entry: DentalChartEntry) => {
      setFormData(prev => ({
          ...prev,
          dentalChart: [...(prev.dentalChart || []), entry]
      }));
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
        toast.error("Privacy Compliance: You must accept the Data Privacy Consent."); 
        setActiveSection('basic');
        return; 
    }

    if (requiresGuardian && (!formData.guardian || !formData.relationshipToPatient)) {
        toast.error("Guardian details are mandatory for Minors/PWD.");
        setActiveSection('basic');
        return;
    }
    
    if (!formData.firstName || !formData.surname || !formData.phone) { 
        toast.error("Required fields: First Name, Surname, and Mobile."); 
        return; 
    }

    const fullName = `${formData.firstName || ''} ${formData.middleName || ''} ${formData.surname || ''}`.replace(/\s+/g, ' ').trim();
    onSave({ ...formData, name: fullName });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[60] flex justify-center items-end md:items-center ${isKiosk ? 'p-0' : 'p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm'}`}>
      <div className={`bg-white w-full flex flex-col overflow-hidden ${isKiosk ? 'h-full' : 'md:max-w-5xl h-[95vh] md:h-[90vh] md:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-20 duration-300'}`}>
        <div className={`flex justify-between items-center p-4 md:p-6 border-b border-slate-100 text-white shrink-0 ${isKiosk ? 'bg-teal-600' : 'bg-teal-900 md:rounded-t-3xl'}`}>
          <div className="flex items-center gap-3">
            <div className="bg-lilac-500 p-2 rounded-xl shadow-lg shadow-lilac-500/20"><User size={24} className="text-white" /></div>
            <div>
                <h2 className="text-xl font-bold">{initialData ? 'Update Record' : 'New Registration'}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-black/10 text-white uppercase tracking-widest border border-white/20">Clinical Admission</span>
                </div>
            </div>
          </div>
          {!isKiosk && <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 scroll-smooth no-scrollbar">
            <div className="max-w-4xl mx-auto space-y-8 pb-10">
                <div className="bg-white border-2 border-teal-100 p-6 rounded-3xl shadow-sm ring-4 ring-teal-500/5 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3 mb-4"><div className="p-2 bg-teal-50 rounded-xl text-teal-600"><Lock size={20} /></div><h3 className="font-bold text-lg text-slate-800">DPA Protocol & Record Sovereignty</h3></div>
                    <label className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer border-2 transition-all ${formData.dpaConsent ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-slate-50 border-slate-200 grayscale opacity-80'}`}>
                        <input type="checkbox" name="dpaConsent" checked={formData.dpaConsent} onChange={handleChange} className="w-6 h-6 accent-teal-600 rounded mt-1 shrink-0" />
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-extrabold text-teal-900 uppercase text-xs">Primary Clinical Consent *</span>
                                <button type="button" onClick={(e) => { e.preventDefault(); setShowPrivacyPolicy(true); }} className="text-[10px] font-bold bg-white text-teal-600 border border-teal-200 px-2 py-0.5 rounded-full hover:bg-teal-500 hover:text-white">Review R.A. 10173</button>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                I consent to the collection of my SPI for diagnosis. I acknowledge this is a <strong>Clinic-Specific Record</strong>. Data is stored in branch-specific silos and only linked via explicit identifier consent.
                            </p>
                        </div>
                    </label>
                </div>

                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200 sticky top-0 z-20 overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveSection('basic')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeSection === 'basic' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><User size={16}/> Profile</button>
                    <button onClick={() => setActiveSection('medical')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeSection === 'medical' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Heart size={16}/> Medical</button>
                    <button onClick={() => setActiveSection('dental')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeSection === 'dental' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><FileText size={16}/> Dental History</button>
                </div>

                <form id="patientForm" onSubmit={handleSubmit} className="space-y-8">
                    {activeSection === 'basic' && (
                        <div ref={basicRef} className="animate-in slide-in-from-left-4 duration-300">
                             <RegistrationBasicInfo formData={formData} handleChange={handleChange} readOnly={readOnly} fieldSettings={fieldSettings} patients={patients} />
                        </div>
                    )}
                    {activeSection === 'medical' && (
                        <div ref={medicalRef} className="animate-in slide-in-from-right-4 duration-300">
                            <RegistrationMedical formData={formData} handleChange={handleChange} handleArrayChange={handleArrayChange} readOnly={readOnly} fieldSettings={fieldSettings} />
                        </div>
                    )}
                    {activeSection === 'dental' && (
                        <div ref={dentalRef} className="animate-in slide-in-from-bottom-4 duration-300">
                            <RegistrationDental formData={formData} handleChange={handleChange} onUpdateChart={handleUpdateChart} readOnly={readOnly} fieldSettings={fieldSettings} />
                        </div>
                    )}
                </form>
            </div>
        </div>

        <div className={`p-4 border-t border-slate-200 bg-white shrink-0 flex justify-between items-center z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] ${!isKiosk && 'md:rounded-b-3xl'}`}>
            <div className="hidden md:block">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Section {activeSection.toUpperCase()} in progress</span>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                {!isKiosk && <button onClick={onClose} className="flex-1 md:flex-none px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm uppercase">Cancel</button>}
                {!readOnly && (<button onClick={handleSubmit} className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-12 py-4 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all ${isKiosk ? 'bg-teal-600 shadow-teal-600/30' : 'bg-teal-900 shadow-teal-900/20 hover:bg-teal-800'}`}><Save size={20} /> {initialData ? 'Update and Submit' : 'Register and Submit'}</button>)}
            </div>
        </div>
      </div>
      <PrivacyPolicyModal isOpen={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} />
    </div>
  );
};

export default PatientRegistrationModal;
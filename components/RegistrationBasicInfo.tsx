import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Patient, FieldSettings, AuthorityLevel } from '../types';
import { Hash, MapPin, Briefcase, Users, CreditCard, Building2, Star, Search, User, Phone, Mail, Droplet, Heart, Shield, Award, Baby, FileText, Scale, Link, CheckCircle, ShieldCheck, ShieldAlert, Fingerprint, Bell, Image, Camera, RefreshCw, ShieldOff } from 'lucide-react';
import Fuse from 'fuse.js';
import CryptoJS from 'crypto-js';

interface RegistrationBasicInfoProps {
  formData: Partial<Patient>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  readOnly?: boolean;
  fieldSettings: FieldSettings;
  patients?: Patient[]; 
  isMasked?: boolean;
}

const RegistrationBasicInfo: React.FC<RegistrationBasicInfoProps> = ({ formData, handleChange, readOnly, fieldSettings, patients = [], isMasked = false }) => {
  const [refSearch, setRefSearch] = useState('');
  const [guardianSearch, setGuardianSearch] = useState('');

  // --- CAMERA ENGINE STATE ---
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isMinor = useMemo(() => formData.age !== undefined && formData.age < 18, [formData.age]);
  const isFemale = formData.sex === 'Female';
  const showGuardian = isMinor || formData.isPwd || formData.isSeniorDependent;

  useEffect(() => {
    if (showGuardian && !formData.guardianProfile?.forensicFingerprint) {
        const fp = `UA: ${navigator.userAgent.substring(0, 100)} | PLAT: ${navigator.platform} | LANG: ${navigator.language} | D-TS: ${new Date().toISOString()}`;
        handleGuardianProfileChange('forensicFingerprint', fp);
    }
  }, [showGuardian]);

  const refResults = useMemo(() => {
      if (!refSearch) return [];
      const fuse = new Fuse(patients, { keys: ['name', 'phone'], threshold: 0.3 });
      return fuse.search(refSearch).map(r => r.item).slice(0, 5);
  }, [refSearch, patients]);

  const guardianResults = useMemo(() => {
      if (!guardianSearch) return [];
      const fuse = new Fuse(patients.filter(p => p.id !== formData.id), { keys: ['name', 'phone'], threshold: 0.3 });
      return fuse.search(guardianSearch).map(r => r.item).slice(0, 5);
  }, [guardianSearch, patients, formData.id]);

  const referredByName = patients.find(p => p.id === formData.referredById)?.name;

  const handleGuardianProfileChange = (field: string, value: any) => {
      const updatedProfile = { 
          ...(formData.guardianProfile || { 
              legalName: '', mobile: '', email: '', idType: '', idNumber: '', relationship: '', authorityLevel: AuthorityLevel.FULL, identityOath: '', forensicFingerprint: '', visualAnchorHash: '', visualAnchorThumb: ''
          }), 
          [field]: value 
      };
      handleChange({ target: { name: 'guardianProfile', value: updatedProfile } } as any);
      
      if (field === 'legalName') handleChange({ target: { name: 'guardian', value } } as any);
      if (field === 'mobile') handleChange({ target: { name: 'guardianMobile', value } } as any);
      if (field === 'relationship') handleChange({ target: { name: 'relationshipToPatient', value } } as any);
      if (field === 'idType') handleChange({ target: { name: 'guardianIdType', value } } as any);
      if (field === 'idNumber') handleChange({ target: { name: 'guardianIdNumber', value } } as any);
  };

  // --- VISUAL IDENTITY ANCHOR LOGIC ---
  const startCamera = async () => {
    if (!formData.biometricConsent) return;
    setCameraLoading(true);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 320 } });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setIsCameraActive(true);
        }
    } catch (err) {
        console.error("Camera access failed", err);
    } finally {
        setCameraLoading(false);
    }
  };

  const captureAnchor = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Downsample to tiny forensic thumbnail
            canvas.width = 64;
            canvas.height = 64;
            ctx.filter = 'grayscale(100%) brightness(1.2)';
            ctx.drawImage(video, 0, 0, 64, 64);
            
            const thumb = canvas.toDataURL('image/jpeg', 0.5);
            const hash = CryptoJS.SHA256(thumb).toString();
            
            handleGuardianProfileChange('visualAnchorThumb', thumb);
            handleGuardianProfileChange('visualAnchorHash', hash);
            
            // Stop stream
            const stream = video.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
            setIsCameraActive(false);
        }
    }
  };

  const linkGuardianPatient = (p: Patient) => {
      handleGuardianProfileChange('legalName', p.name);
      handleGuardianProfileChange('mobile', p.phone);
      handleGuardianProfileChange('email', p.email);
      handleGuardianProfileChange('linkedPatientId', p.id);
      setGuardianSearch('');
  };

  const handleBoolChange = (name: string, val: boolean) => {
      handleChange({ target: { name, value: val, type: 'checkbox', checked: val } } as any);
  };

  const BooleanField = ({ label, name, checked, onToggle }: { label: string, name: string, checked?: boolean, onToggle: (val: boolean) => void }) => (
    <div className="flex justify-between items-center p-3 rounded-xl border border-slate-200 bg-white">
        <span className="font-bold text-sm text-slate-800">{label}</span>
        <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                  <input disabled={readOnly} type="radio" name={name} checked={checked === true} onChange={() => onToggle(true)} className="w-5 h-5 accent-teal-700" />
                  <span className="text-sm font-bold text-slate-700 group-hover:text-teal-700">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                  <input disabled={readOnly} type="radio" name={name} checked={checked === false} onChange={() => onToggle(false)} className="w-5 h-5 accent-teal-700" />
                  <span className="text-sm font-bold text-slate-700 group-hover:text-teal-700">No</span>
              </label>
        </div>
    </div>
  );

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-3">
                <label htmlFor="patient-id" className="label flex items-center gap-2 text-slate-600 font-bold"><Hash size={14} /> System ID</label>
                <input id="patient-id" type="text" readOnly aria-label="System patient ID" value={formData.id || ''} className="input bg-slate-50 text-slate-600 font-mono text-sm border-slate-300" />
            </div>
            <div className="md:col-span-9">
                <label htmlFor="referral-search" className="label flex items-center gap-2 text-teal-800 font-bold"><Star size={14} fill="currentColor"/> Referral Source</label>
                {referredByName ? (
                    <div className="flex items-center justify-between p-3 bg-teal-50 border-2 border-teal-200 rounded-xl shadow-sm">
                        <span className="font-bold text-teal-900">{referredByName}</span>
                        <button type="button" onClick={() => handleChange({ target: { name: 'referredById', value: '' } } as any)} className="text-xs font-black text-teal-700 hover:underline uppercase tracking-widest focus:ring-offset-2">Remove</button>
                    </div>
                ) : (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                        <input id="referral-search" type="text" placeholder="Search referrer by name or phone..." aria-label="Referral search" className="input pl-10" value={refSearch} onChange={e => setRefSearch(e.target.value)} />
                        {refSearch && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-2xl border-2 border-slate-200 rounded-xl z-50 overflow-hidden">
                                {refResults.map(p => (
                                    <button key={p.id} type="button" onClick={() => { handleChange({ target: { name: 'referredById', value: p.id } } as any); setRefSearch(''); }} className="w-full text-left p-4 hover:bg-teal-50 flex justify-between items-center border-b last:border-0 transition-colors"><span className="font-bold text-slate-900 text-sm">{p.name}</span><span className="text-xs text-slate-500 font-bold">{p.phone}</span></button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-xs font-black uppercase text-slate-600 tracking-widest flex items-center gap-2 mb-2"><User size={14}/> Legal Identity Registry</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><label htmlFor="reg-firstName" className="label text-teal-900 font-bold">First Name *</label><input id="reg-firstName" disabled={readOnly} required type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} className="input font-bold" /></div>
                <div><label htmlFor="reg-middleName" className="label">Middle Name</label><input id="reg-middleName" disabled={readOnly} type="text" name="middleName" value={formData.middleName || ''} onChange={handleChange} className="input" /></div>
                <div><label htmlFor="reg-surname" className="label text-teal-900 font-bold">Surname *</label><input id="reg-surname" disabled={readOnly} required type="text" name="surname" value={formData.surname || ''} onChange={handleChange} className="input font-bold" /></div>
                <div><label htmlFor="reg-suffix" className="label">Suffix</label><select id="reg-suffix" name="suffix" value={formData.suffix || ''} onChange={handleChange} className="input" aria-label="Suffix selection">{['', ...fieldSettings.suffixes].map(s => <option key={s} value={s}>{s || '- None -'}</option>)}</select></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div><label htmlFor="reg-dob" className="label font-bold">Birth Date</label><input id="reg-dob" type="date" name="dob" value={formData.dob || ''} onChange={handleChange} className="input" aria-label="Date of birth" /></div>
                <div><label htmlFor="reg-age" className="label">Calculated Age</label><input id="reg-age" type="text" readOnly value={formData.age ?? ''} className="input bg-slate-50 font-bold text-teal-800" aria-label="Patient age" /></div>
                <div><label htmlFor="reg-sex" className="label font-bold">Sex</label><select id="reg-sex" name="sex" value={formData.sex || ''} onChange={handleChange} className="input" aria-label="Sex selection"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                <div><label htmlFor="reg-bloodGroup" className="label">Blood Group</label><select id="reg-bloodGroup" name="bloodGroup" value={formData.bloodGroup || ''} onChange={handleChange} className="input" aria-label="Blood group selection">{['', ...fieldSettings.bloodGroups].map(bg => <option key={bg} value={bg}>{bg || 'Unknown'}</option>)}</select></div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border-2 border-lilac-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-lilac-800 tracking-widest flex items-center gap-2 mb-2"><ShieldCheck size={14} className="text-lilac-700"/> Digital Marketing & Communications</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer border-2 transition-all ${formData.practiceCommConsent ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-white border-slate-200'}`}>
                    <input type="checkbox" name="practiceCommConsent" checked={formData.practiceCommConsent} onChange={handleChange} className="w-6 h-6 accent-teal-700 rounded mt-1 shrink-0" />
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Bell size={14} className="text-teal-700"/>
                            <span className="font-extrabold text-teal-900 uppercase text-xs">Practice Updates</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-snug font-medium">I consent to receiving holiday greetings, and appointment availability alerts via SMS and Email.</p>
                    </div>
                </label>
                <label className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer border-2 transition-all ${formData.clinicalMediaConsent ? 'bg-lilac-50 border-lilac-500 shadow-md' : 'bg-white border-slate-200'}`}>
                    <input type="checkbox" name="clinicalMediaConsent" checked={formData.clinicalMediaConsent} onChange={handleChange} className="w-6 h-6 accent-lilac-600 rounded mt-1 shrink-0" />
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Image size={14} className="text-lilac-700"/>
                            <span className="font-extrabold text-lilac-900 uppercase text-xs">Clinical Media Release</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-snug font-medium">I consent to the use of my clinical photos for professional education and practice portfolios.</p>
                    </div>
                </label>
            </div>
        </div>

        {isFemale && (
            <div className="bg-lilac-50 border-2 border-lilac-300 p-6 rounded-3xl shadow-lg ring-8 ring-lilac-500/5 animate-in slide-in-from-top-2 duration-500">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-lilac-600 text-white p-2 rounded-xl shadow-lg shadow-lilac-600/20"><Baby size={24}/></div>
                    <div>
                        <h4 className="font-black text-lilac-900 uppercase tracking-widest text-sm">Women's Health Protocol</h4>
                        <p className="text-xs text-lilac-700 font-black uppercase mt-0.5">Mandatory for pharmaceutical & diagnostic safety</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-2xl border transition-all ${formData.pregnant ? 'bg-lilac-100 border-lilac-400 shadow-sm' : 'bg-white border-lilac-200'}`}>
                        <BooleanField label="Pregnant?" name="pregnant" checked={formData.pregnant} onToggle={(v) => handleBoolChange('pregnant', v)} />
                    </div>
                    <div className={`p-4 rounded-2xl border transition-all ${formData.nursing ? 'bg-lilac-100 border-lilac-400 shadow-sm' : 'bg-white border-lilac-200'}`}>
                        <BooleanField label="Nursing?" name="nursing" checked={formData.nursing} onToggle={(v) => handleBoolChange('nursing', v)} />
                    </div>
                    <div className={`p-4 rounded-2xl border transition-all ${formData.birthControl ? 'bg-lilac-100 border-lilac-400 shadow-sm' : 'bg-white border-lilac-200'}`}>
                        <BooleanField label="On Birth Control?" name="birthControl" checked={formData.birthControl} onToggle={(v) => handleBoolChange('birthControl', v)} />
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${formData.isPwd ? 'bg-lilac-100 border-lilac-500 shadow-md' : 'bg-white border-slate-200'}`}>
                <input type="checkbox" name="isPwd" checked={formData.isPwd} onChange={handleChange} className="w-6 h-6 accent-lilac-600 rounded" />
                <div><div className="font-black text-slate-900 text-sm uppercase tracking-tight">Patient is PWD</div><p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Requires Legal Representative</p></div>
            </label>
            <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${formData.isSeniorDependent ? 'bg-teal-100 border-teal-500 shadow-md' : 'bg-white border-slate-200'}`}>
                <input type="checkbox" name="isSeniorDependent" checked={formData.isSeniorDependent} onChange={handleChange} className="w-6 h-6 accent-teal-700 rounded" />
                <div><div className="font-black text-slate-900 text-sm uppercase tracking-tight">Senior Dependent</div><p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Managed Access Record</p></div>
            </label>
        </div>

        {showGuardian && (
            <div className="bg-lilac-50 border-2 border-lilac-300 p-8 rounded-[2.5rem] shadow-xl ring-8 ring-lilac-500/5 animate-in slide-in-from-top-4 duration-500">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-lilac-600 text-white p-3 rounded-2xl shadow-lg shadow-lilac-600/20"><Baby size={28}/></div>
                        <div>
                            <h4 className="font-black text-lilac-900 uppercase tracking-tighter text-lg leading-tight">Guardian & Consent Delegate</h4>
                            <p className="text-xs text-lilac-700 font-black uppercase mt-0.5 tracking-widest">Verified legal representative profile</p>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <label htmlFor="guardian-name" className="label text-lilac-900 font-black">Representative Legal Name *</label>
                        <input id="guardian-name" required={showGuardian} type="text" value={formData.guardianProfile?.legalName || ''} onChange={e => handleGuardianProfileChange('legalName', e.target.value)} className="input border-lilac-300 focus:border-lilac-600 focus:ring-lilac-600/20 py-4" placeholder="Full name of person signing consent" />
                        {formData.guardianProfile?.linkedPatientId && <div className="mt-2 flex items-center gap-1 text-xs font-black text-teal-700 uppercase tracking-widest"><CheckCircle size={12}/> Linked Registry Match (ID: {formData.guardianProfile.linkedPatientId})</div>}
                    </div>
                    <div>
                        <label htmlFor="guardian-authority" className="label text-lilac-900 font-black">Authority Level *</label>
                        <select id="guardian-authority" required={showGuardian} value={formData.guardianProfile?.authorityLevel || AuthorityLevel.FULL} onChange={e => handleGuardianProfileChange('authorityLevel', e.target.value)} className="input border-lilac-300 focus:border-lilac-600 py-4">
                            <option value={AuthorityLevel.FULL}>FULL CONSENT AUTHORITY</option>
                            <option value={AuthorityLevel.CLINICAL_ONLY}>CLINICAL ONLY</option>
                            <option value={AuthorityLevel.FINANCIAL_ONLY}>FINANCIAL ONLY</option>
                        </select>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t-2 border-lilac-200 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-[2rem] border-2 border-lilac-300 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldAlert size={20} className="text-lilac-700"/>
                            <label htmlFor="guardian-oath" className="font-black text-lilac-900 uppercase tracking-widest text-xs">Identity Affirmation Log</label>
                        </div>
                        <p className="text-xs text-slate-600 italic mb-4 leading-relaxed font-medium">
                            "I hereby swear that the identification provided is authentic and I am authorized to provide consent for the clinical data processing of this record."
                        </p>
                        <textarea 
                            id="guardian-oath"
                            required={showGuardian}
                            value={formData.guardianProfile?.identityOath || ''}
                            onChange={e => handleGuardianProfileChange('identityOath', e.target.value)}
                            placeholder="Transcribe affirmation to certify identity..."
                            className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-lilac-600 transition-all h-28"
                        />
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] border-2 border-dashed border-lilac-400 flex flex-col items-center justify-center relative overflow-hidden">
                        {!formData.biometricConsent ? (
                            <div className="text-center p-6 flex flex-col items-center gap-3">
                                <ShieldOff size={48} className="text-slate-400 mx-auto" />
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-snug">Biometric Consent Required for Camera Access</p>
                            </div>
                        ) : isCameraActive ? (
                            <div className="w-full h-full flex flex-col items-center gap-4">
                                <video ref={videoRef} autoPlay playsInline className="w-48 h-48 rounded-full border-4 border-lilac-600 object-cover shadow-2xl bg-black" />
                                <button type="button" onClick={captureAnchor} className="bg-lilac-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl animate-pulse focus:ring-offset-2">Snap Digital Proof</button>
                            </div>
                        ) : formData.guardianProfile?.visualAnchorThumb ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <img src={formData.guardianProfile.visualAnchorThumb} alt="Identity proof" className="w-32 h-32 rounded-full border-4 border-teal-700 shadow-inner grayscale opacity-90" />
                                    <div className="absolute inset-0 flex items-center justify-center"><ShieldCheck size={56} className="text-teal-700/60" /></div>
                                </div>
                                <div className="text-xs font-black text-teal-800 uppercase tracking-widest">Digital Identity Binding Secured</div>
                                <button type="button" onClick={startCamera} className="text-xs font-black text-slate-500 hover:text-lilac-700 uppercase flex items-center gap-2 transition-colors focus:ring-offset-2"><RefreshCw size={12}/> Retake Snap</button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-6 text-center">
                                <div className="p-5 bg-lilac-100 text-lilac-700 rounded-full shadow-inner"><Camera size={48} /></div>
                                <div>
                                    <h5 className="font-black text-lilac-900 uppercase text-xs tracking-widest">Visual Identity Anchor</h5>
                                    <p className="text-xs text-slate-600 mt-2 max-w-[200px] font-bold">Forensic proof of presence at terminal during intake.</p>
                                </div>
                                <button type="button" disabled={cameraLoading} onClick={startCamera} className="px-10 py-4 bg-lilac-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 transition-all focus:ring-offset-2">
                                    {cameraLoading ? 'Engaging Lens...' : 'Capture Proof'}
                                </button>
                            </div>
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t-2 border-lilac-200">
                    <label className={`flex items-start gap-5 p-6 rounded-3xl border-2 transition-all cursor-pointer ${formData.biometricConsent ? 'bg-teal-50 border-teal-700 shadow-md' : 'bg-white border-slate-300'}`}>
                        <input type="checkbox" name="biometricConsent" checked={formData.biometricConsent} onChange={handleChange} className="w-8 h-8 accent-teal-700 rounded mt-1 shrink-0" />
                        <div>
                            <span className="font-black text-teal-900 uppercase text-xs tracking-widest">Explicit Biometric & Image Processing Consent *</span>
                            <p className="text-xs text-slate-800 font-bold leading-relaxed mt-2 uppercase tracking-tight">I expressly consent to the capture of my visual image for forensic verification purposes in this patient registry. I understand this data is stored strictly for legal identity validation.</p>
                        </div>
                    </label>
                </div>
            </div>
        )}

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-xs font-black uppercase text-slate-600 tracking-widest flex items-center gap-2 mb-2"><MapPin size={14} className="text-teal-700"/> Location Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-6"><label htmlFor="reg-address" className="label">Home Address / House No. / Street</label><input id="reg-address" disabled={readOnly} type="text" name="homeAddress" value={formData.homeAddress || ''} onChange={handleChange} className="input" /></div>
                <div className="md:col-span-3"><label htmlFor="reg-city" className="label">City / Municipality</label><input id="reg-city" disabled={readOnly} type="text" name="city" value={formData.city || ''} onChange={handleChange} className="input" placeholder="e.g. Makati City" /></div>
                <div className="md:col-span-3"><label htmlFor="reg-barangay" className="label">Barangay</label><input id="reg-barangay" disabled={readOnly} type="text" name="barangay" value={formData.barangay || ''} onChange={handleChange} className="input" placeholder="e.g. Bel-Air" /></div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <h4 className="text-xs font-black uppercase text-slate-600 tracking-widest flex items-center gap-2 mb-2"><Phone size={14}/> Communication Hub</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1"><label htmlFor="reg-phone" className="label font-bold text-teal-900">Mobile Number *</label><input id="reg-phone" required type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className="input font-bold" placeholder="09XX-XXX-XXXX" /></div>
                    <div className="col-span-2 md:col-span-1"><label htmlFor="reg-mobile2" className="label">Secondary Phone</label><input id="reg-mobile2" type="tel" name="mobile2" value={formData.mobile2 || ''} onChange={handleChange} className="input" /></div>
                    <div className="col-span-2"><label htmlFor="reg-email" className="label flex items-center gap-2"><Mail size={14} className="text-teal-700"/> Official Email Address</label><input id="reg-email" type="email" name="email" value={formData.email || ''} onChange={handleChange} className="input font-bold" /></div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <h4 className="text-xs font-black uppercase text-slate-600 tracking-widest flex items-center gap-2 mb-2"><Briefcase size={14}/> Professional Profile</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1"><label htmlFor="reg-occupation" className="label">Occupation</label><input id="reg-occupation" type="text" name="occupation" value={formData.occupation || ''} onChange={handleChange} className="input" /></div>
                    <div className="col-span-2 md:col-span-1"><label htmlFor="reg-civilStatus" className="label">Civil Status</label><select id="reg-civilStatus" name="civilStatus" value={formData.civilStatus || ''} onChange={handleChange} className="input" aria-label="Civil status selection">{['', ...fieldSettings.civilStatus].map(cs => <option key={cs} value={cs}>{cs || 'Select'}</option>)}</select></div>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border-2 border-teal-100 shadow-sm space-y-6">
            <h4 className="text-xs font-black uppercase text-teal-800 tracking-widest flex items-center gap-2 mb-2"><Users size={14} className="text-teal-700"/> Family Registry context</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1"><label htmlFor="reg-fatherName" className="label">Father's Legal Name</label><input id="reg-fatherName" type="text" name="fatherName" value={formData.fatherName || ''} onChange={handleChange} className="input" placeholder="Full name" /></div>
                <div className="md:col-span-1"><label htmlFor="reg-fatherOccupation" className="label">Father's Occupation</label><input id="reg-fatherOccupation" type="text" name="fatherOccupation" value={formData.fatherOccupation || ''} onChange={handleChange} className="input" /></div>
                <div className="md:col-span-1"><label htmlFor="reg-motherName" className="label">Mother's Legal Name</label><input id="reg-motherName" type="text" name="motherName" value={formData.motherName || ''} onChange={handleChange} className="input" placeholder="Full name" /></div>
                <div className="md:col-span-1"><label htmlFor="reg-motherOccupation" className="label">Mother's Occupation</label><input id="reg-motherOccupation" type="text" name="motherOccupation" value={formData.motherOccupation || ''} onChange={handleChange} className="input" /></div>
            </div>
            
            <div className="pt-6 border-t-2 border-slate-100">
                <label className={`flex items-start gap-5 p-5 rounded-2xl cursor-pointer border-2 transition-all ${formData.thirdPartyAttestation ? 'bg-teal-50 border-teal-700 shadow-md' : 'bg-white border-slate-300'}`}>
                    <input type="checkbox" name="thirdPartyAttestation" checked={formData.thirdPartyAttestation} onChange={handleChange} className="w-8 h-8 accent-teal-700 rounded mt-1 shrink-0" />
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <ShieldAlert size={14} className="text-teal-700"/>
                            <span className="font-black text-teal-900 uppercase text-xs">Data Provision Certification *</span>
                        </div>
                        <p className="text-xs text-slate-800 font-bold leading-relaxed uppercase tracking-tight">I certify that I have the necessary authority from the family members listed above to provide their information for care coordination.</p>
                    </div>
                </label>
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-xs font-black uppercase text-slate-600 tracking-widest flex items-center gap-2 mb-2"><CreditCard size={14} className="text-teal-700"/> Insurance Registry</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label htmlFor="reg-insProvider" className="label">HMO / Primary Insurer</label><select id="reg-insProvider" name="insuranceProvider" value={formData.insuranceProvider || ''} onChange={handleChange} className="input" aria-label="Insurance provider selection">{['', ...fieldSettings.insuranceProviders].map(ins => <option key={ins} value={ins}>{ins || '- Private Pay -'}</option>)}</select></div>
                <div><label htmlFor="reg-insNumber" className="label">Policy Number</label><input id="reg-insNumber" type="text" name="insuranceNumber" value={formData.insuranceNumber || ''} onChange={handleChange} className="input font-bold" placeholder="e.g. 123-456-789" /></div>
            </div>
        </div>
    </div>
  );
};

export default RegistrationBasicInfo;
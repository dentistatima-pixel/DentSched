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

  const maskValue = (val: string | undefined | null) => {
      if (!isMasked || !val) return val || '';
      return '••••••••';
  };

  const BooleanField = ({ label, name, checked, onToggle }: { label: string, name: string, checked?: boolean, onToggle: (val: boolean) => void }) => (
    <div className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-white">
        <span className="font-bold text-sm text-slate-700">{label}</span>
        <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                  <input disabled={readOnly || isMasked} type="radio" name={name} checked={checked === true} onChange={() => onToggle(true)} className="w-5 h-5 accent-teal-600" />
                  <span className="text-sm font-bold text-slate-600 group-hover:text-teal-700">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                  <input disabled={readOnly || isMasked} type="radio" name={name} checked={checked === false} onChange={() => onToggle(false)} className="w-5 h-5 accent-teal-600" />
                  <span className="text-sm font-bold text-slate-600 group-hover:text-teal-700">No</span>
              </label>
        </div>
    </div>
  );

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
                <label className="label flex items-center gap-2 text-slate-400 font-bold"><Hash size={14} /> System ID</label>
                <input type="text" readOnly value={formData.id || ''} className="input bg-slate-50 text-slate-500 font-mono text-sm border-slate-200" />
            </div>
            <div className="md:col-span-9">
                <label className="label flex items-center gap-2 text-teal-700 font-bold"><Star size={14} fill="currentColor"/> Referral Source</label>
                {referredByName ? (
                    <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-xl">
                        <span className="font-bold text-teal-900">{referredByName}</span>
                        <button type="button" disabled={isMasked} onClick={() => handleChange({ target: { name: 'referredById', value: '' } } as any)} className="text-xs font-bold text-teal-600 hover:underline">Remove</button>
                    </div>
                ) : (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input type="text" disabled={isMasked} placeholder={isMasked ? "REDACTED" : "Search referrer by name or phone..."} className="input pl-10" value={refSearch} onChange={e => setRefSearch(e.target.value)} />
                        {refSearch && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-2xl border border-slate-100 rounded-xl z-50 overflow-hidden">
                                {refResults.map(p => (
                                    <button key={p.id} type="button" onClick={() => { handleChange({ target: { name: 'referredById', value: p.id } } as any); setRefSearch(''); }} className="w-full text-left p-3 hover:bg-teal-50 flex justify-between items-center border-b last:border-0"><span className="font-bold text-slate-800 text-sm">{p.name}</span><span className="text-[10px] text-slate-400">{p.phone}</span></button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-2"><User size={14}/> Legal Identity</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><label className="label text-teal-800 font-bold">First Name *</label><input disabled={readOnly || isMasked} required type="text" name="firstName" value={maskValue(formData.firstName)} onChange={handleChange} className="input font-bold" /></div>
                <div><label className="label">Middle Name</label><input disabled={readOnly || isMasked} type="text" name="middleName" value={maskValue(formData.middleName)} onChange={handleChange} className="input" /></div>
                <div><label className="label text-teal-800 font-bold">Surname *</label><input disabled={readOnly || isMasked} required type="text" name="surname" value={maskValue(formData.surname)} onChange={handleChange} className="input font-bold" /></div>
                <div><label className="label">Suffix</label><select disabled={isMasked} name="suffix" value={formData.suffix || ''} onChange={handleChange} className="input">{['', ...fieldSettings.suffixes].map(s => <option key={s} value={s}>{s || '- None -'}</option>)}</select></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div><label className="label font-bold">Birth Date</label><input disabled={isMasked} type="date" name="dob" value={formData.dob || ''} onChange={handleChange} className="input" /></div>
                <div><label className="label">Calculated Age</label><input type="text" readOnly value={formData.age ?? ''} className="input bg-slate-50 font-bold text-teal-700" /></div>
                <div><label className="label font-bold">Sex</label><select disabled={isMasked} name="sex" value={formData.sex || ''} onChange={handleChange} className="input"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                <div><label className="label">Blood Group</label><select disabled={isMasked} name="bloodGroup" value={formData.bloodGroup || ''} onChange={handleChange} className="input">{['', ...fieldSettings.bloodGroups].map(bg => <option key={bg} value={bg}>{bg || 'Unknown'}</option>)}</select></div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border-2 border-lilac-100 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-lilac-700 tracking-widest flex items-center gap-2 mb-2"><ShieldCheck size={14} className="text-lilac-600"/> Specific Marketing & Media Consents</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${formData.practiceCommConsent ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-white border-slate-100 opacity-60'}`}>
                    <input disabled={isMasked} type="checkbox" name="practiceCommConsent" checked={formData.practiceCommConsent} onChange={handleChange} className="w-6 h-6 accent-teal-600 rounded mt-1 shrink-0" />
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Bell size={14} className="text-teal-600"/>
                            <span className="font-extrabold text-teal-900 uppercase text-[10px]">Practice Communications</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-tight">I consent to receiving practice updates, holiday greetings, and appointment availability alerts via SMS and Email.</p>
                    </div>
                </label>
                <label className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${formData.clinicalMediaConsent ? 'bg-lilac-50 border-lilac-500 shadow-md' : 'bg-white border-slate-100 opacity-60'}`}>
                    <input disabled={isMasked} type="checkbox" name="clinicalMediaConsent" checked={formData.clinicalMediaConsent} onChange={handleChange} className="w-6 h-6 accent-lilac-600 rounded mt-1 shrink-0" />
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Image size={14} className="text-lilac-600"/>
                            <span className="font-extrabold lilac-900 uppercase text-[10px]">Clinical Media Release</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-tight">I consent to the use of my anonymized clinical photos/videos for practice education and social media portfolios.</p>
                    </div>
                </label>
            </div>
        </div>

        {isFemale && (
            <div className="bg-lilac-50 border-2 border-lilac-200 p-6 rounded-3xl shadow-lg ring-4 ring-lilac-500/5 animate-in slide-in-from-top-2 duration-500">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-lilac-600 text-white p-2 rounded-xl shadow-lg shadow-lilac-600/20"><Baby size={24}/></div>
                    <div>
                        <h4 className="font-black text-lilac-900 uppercase tracking-widest text-sm">Women's Clinical Health</h4>
                        <p className="text-[10px] text-lilac-600 font-bold uppercase mt-0.5">Critical for drug prescriptions & X-ray safety</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-2xl border transition-all ${formData.pregnant ? 'bg-lilac-100 border-lilac-300 shadow-md' : 'bg-white border-lilac-100'}`}>
                        <BooleanField label="Pregnant?" name="pregnant" checked={formData.pregnant} onToggle={(v) => handleBoolChange('pregnant', v)} />
                    </div>
                    <div className={`p-4 rounded-2xl border transition-all ${formData.nursing ? 'bg-lilac-100 border-lilac-300 shadow-md' : 'bg-white border-lilac-100'}`}>
                        <BooleanField label="Nursing?" name="nursing" checked={formData.nursing} onToggle={(v) => handleBoolChange('nursing', v)} />
                    </div>
                    <div className={`p-4 rounded-2xl border transition-all ${formData.birthControl ? 'bg-lilac-100 border-lilac-300 shadow-md' : 'bg-white border-lilac-100'}`}>
                        <BooleanField label="On Birth Control?" name="birthControl" checked={formData.birthControl} onToggle={(v) => handleBoolChange('birthControl', v)} />
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.isPwd ? 'bg-lilac-50 border-lilac-400 shadow-md' : 'bg-white border-slate-100 opacity-60'}`}>
                <input disabled={isMasked} type="checkbox" name="isPwd" checked={formData.isPwd} onChange={handleChange} className="w-6 h-6 accent-lilac-600 rounded" />
                <div><div className="font-bold text-slate-800 text-sm">Patient is PWD</div><p className="text-[10px] text-slate-400 font-bold uppercase">Requires Legal Representative</p></div>
            </label>
            <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.isSeniorDependent ? 'bg-teal-50 border-teal-400 shadow-md' : 'bg-white border-slate-100 opacity-60'}`}>
                <input disabled={isMasked} type="checkbox" name="isSeniorDependent" checked={formData.isSeniorDependent} onChange={handleChange} className="w-6 h-6 accent-teal-600 rounded" />
                <div><div className="font-bold text-slate-800 text-sm">Senior Dependent</div><p className="text-[10px] text-slate-400 font-bold uppercase">Limited Capacity Processing</p></div>
            </label>
        </div>

        {showGuardian && (
            <div className="bg-lilac-50 border-2 border-lilac-200 p-6 rounded-3xl shadow-lg ring-4 ring-lilac-500/5 animate-in slide-in-from-top-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-lilac-600 text-white p-2 rounded-xl shadow-lg shadow-lilac-600/20"><Baby size={24}/></div>
                        <div>
                            <h4 className="font-black text-lilac-900 uppercase tracking-widest text-sm">Legal Guardianship & Consent Authority</h4>
                            <p className="text-[10px] text-lilac-600 font-bold uppercase mt-0.5">Verified representative mandatory for this case</p>
                        </div>
                    </div>
                    {!formData.guardianProfile?.linkedPatientId && !isMasked && (
                        <div className="relative">
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-lilac-200">
                                <Search size={14} className="text-lilac-400"/>
                                <input 
                                    type="text" 
                                    placeholder="Link Existing Patient..." 
                                    className="bg-transparent border-none outline-none text-[10px] font-bold w-32"
                                    value={guardianSearch}
                                    onChange={e => setGuardianSearch(e.target.value)}
                                />
                            </div>
                            {guardianSearch && (
                                <div className="absolute right-0 top-full mt-1 w-64 bg-white shadow-2xl border border-lilac-100 rounded-xl z-50 overflow-hidden">
                                    {guardianResults.map(p => (
                                        <button key={p.id} type="button" onClick={() => linkGuardianPatient(p)} className="w-full text-left p-3 hover:bg-lilac-50 flex justify-between items-center border-b last:border-0"><span className="font-bold text-slate-800 text-xs">{p.name}</span><Link size={10} className="text-lilac-400"/></button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <label className="label text-lilac-800 font-black">Representative Full Legal Name *</label>
                        <input disabled={isMasked} required={showGuardian} type="text" value={maskValue(formData.guardianProfile?.legalName)} onChange={e => handleGuardianProfileChange('legalName', e.target.value)} className="input border-lilac-200 focus:border-lilac-500 focus:ring-lilac-500/20" placeholder="Full name of person signing consent" />
                        {formData.guardianProfile?.linkedPatientId && <div className="mt-2 flex items-center gap-1 text-[9px] font-black text-teal-600 uppercase"><CheckCircle size={10}/> Authenticated Registry Match (ID: {formData.guardianProfile.linkedPatientId})</div>}
                    </div>
                    <div>
                        <label className="label text-lilac-800 font-black">Consent Authority Level *</label>
                        <select disabled={isMasked} required={showGuardian} value={formData.guardianProfile?.authorityLevel || AuthorityLevel.FULL} onChange={e => handleGuardianProfileChange('authorityLevel', e.target.value)} className="input border-lilac-200 focus:border-lilac-500">
                            <option value={AuthorityLevel.FULL}>FULL AUTHORITY</option>
                            <option value={AuthorityLevel.CLINICAL_ONLY}>CLINICAL ONLY</option>
                            <option value={AuthorityLevel.FINANCIAL_ONLY}>FINANCIAL ONLY</option>
                        </select>
                    </div>
                    <div>
                        <label className="label text-lilac-800 font-bold">Relationship *</label>
                        <input disabled={isMasked} required={showGuardian} type="text" value={maskValue(formData.guardianProfile?.relationship)} onChange={e => handleGuardianProfileChange('relationship', e.target.value)} className="input border-lilac-200 focus:border-lilac-500" placeholder="e.g. Parent, Child, SPA Holder" />
                    </div>
                    <div>
                        <label className="label text-lilac-800 font-bold">Mobile</label>
                        <input disabled={isMasked} type="tel" value={maskValue(formData.guardianProfile?.mobile)} onChange={e => handleGuardianProfileChange('mobile', e.target.value)} className="input border-lilac-200 focus:border-lilac-500" />
                    </div>
                    <div>
                        <label className="label text-lilac-800 font-bold">Email</label>
                        <input disabled={isMasked} type="email" value={maskValue(formData.guardianProfile?.email)} onChange={e => handleGuardianProfileChange('email', e.target.value)} className="input border-lilac-200 focus:border-lilac-500" />
                    </div>
                    <div>
                        <label className="label text-lilac-800 font-bold">Verified ID Type</label>
                        <input disabled={isMasked} required={showGuardian} type="text" value={maskValue(formData.guardianProfile?.idType)} onChange={e => handleGuardianProfileChange('idType', e.target.value)} className="input border-lilac-200 focus:border-lilac-500" placeholder="e.g. Passport, Driver's License" />
                    </div>
                    <div>
                        <label className="label text-lilac-800 font-bold">Verified ID Number</label>
                        <input disabled={isMasked} required={showGuardian} type="text" value={maskValue(formData.guardianProfile?.idNumber)} onChange={e => handleGuardianProfileChange('idNumber', e.target.value)} className="input border-lilac-200 focus:border-lilac-500" />
                    </div>
                </div>

                {/* --- VISUAL IDENTITY ANCHOR (KIOSK CAMERA GATE) --- */}
                <div className="mt-6 pt-6 border-t border-lilac-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-[2rem] border-2 border-lilac-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <ShieldAlert size={18} className="text-lilac-600"/>
                            <span className="font-black text-lilac-900 uppercase tracking-widest text-[10px]">Mandatory Legal Oath of Identity</span>
                        </div>
                        <p className="text-[11px] text-slate-500 italic mb-4 leading-relaxed">
                            "I hereby swear under penalty of law that the identification provided is authentic, belongs to me as the lawful representative, and I am authorized to provide consent for the clinical data processing of this patient registry."
                        </p>
                        <textarea 
                            disabled={isMasked}
                            required={showGuardian}
                            value={formData.guardianProfile?.identityOath || ''}
                            onChange={e => handleGuardianProfileChange('identityOath', e.target.value)}
                            placeholder="Type the legal oath above exactly as written to certify your identity..."
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-lilac-500 transition-all h-24"
                        />
                    </div>

                    <div className="bg-white p-5 rounded-[2.5rem] border-2 border-dashed border-lilac-300 flex flex-col items-center justify-center relative overflow-hidden">
                        {!formData.biometricConsent ? (
                            <div className="text-center p-6 flex flex-col items-center gap-2">
                                <ShieldOff size={40} className="text-slate-300 mx-auto" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Explicit Biometric Consent Required to Unlock Camera</p>
                            </div>
                        ) : isCameraActive ? (
                            <div className="w-full h-full flex flex-col items-center gap-3">
                                <video ref={videoRef} autoPlay playsInline className="w-48 h-48 rounded-full border-4 border-lilac-400 object-cover shadow-xl bg-black" />
                                <button type="button" onClick={captureAnchor} className="bg-lilac-600 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg animate-pulse">Authorize & Snap ID Anchor</button>
                            </div>
                        ) : formData.guardianProfile?.visualAnchorThumb ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="relative">
                                    <img src={formData.guardianProfile.visualAnchorThumb} className="w-32 h-32 rounded-full border-4 border-teal-500 shadow-inner grayscale opacity-80" />
                                    <div className="absolute inset-0 flex items-center justify-center"><ShieldCheck size={48} className="text-teal-500/50" /></div>
                                </div>
                                <div className="text-[9px] font-black text-teal-600 uppercase tracking-widest">Digital Identity Linked</div>
                                <button type="button" onClick={startCamera} className="text-[8px] font-bold text-slate-400 hover:text-lilac-600 uppercase flex items-center gap-1"><RefreshCw size={8}/> Retake Snap</button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="p-4 bg-lilac-50 text-lilac-600 rounded-full"><Camera size={40} /></div>
                                <div>
                                    <h5 className="font-black text-lilac-900 uppercase text-[10px] tracking-widest">Visual Identity Anchor</h5>
                                    <p className="text-[10px] text-slate-400 mt-1 max-w-[150px]">Snapshot of legal representative required for non-repudiation.</p>
                                </div>
                                <button type="button" disabled={cameraLoading} onClick={startCamera} className="px-6 py-2.5 bg-lilac-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:scale-105 transition-all">
                                    {cameraLoading ? 'Initializing...' : 'Snap Identity'}
                                </button>
                            </div>
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                        {formData.guardianProfile?.visualAnchorHash && (
                            <div className="absolute bottom-2 left-0 right-0 text-center"><span className="text-[8px] font-mono text-lilac-300">HASH: {formData.guardianProfile.visualAnchorHash.substring(0, 16)}...</span></div>
                        )}
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-lilac-100">
                    <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.biometricConsent ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-white border-slate-100'}`}>
                        <input disabled={isMasked} type="checkbox" name="biometricConsent" checked={formData.biometricConsent} onChange={handleChange} className="w-6 h-6 accent-teal-600 rounded mt-1 shrink-0" />
                        <div>
                            <span className="font-extrabold text-teal-900 uppercase text-[10px]">Explicit Biometric/Visual Identity Consent *</span>
                            <p className="text-[10px] text-slate-600 font-medium leading-relaxed mt-1">I expressly consent to the capture and cryptographic hashing of my visual image for forensic non-repudiation purposes in this patient registry. I understand this data is stored strictly for legal identity validation.</p>
                        </div>
                    </label>
                </div>

                <div className="mt-4 p-4 bg-slate-100/50 rounded-2xl flex items-center gap-3">
                    <Fingerprint size={20} className="text-slate-400"/>
                    <div className="flex-1">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Temporal Forensic Fingerprint (Auto-Logged)</div>
                        <div className="text-[8px] font-mono text-slate-400 truncate mt-1">{formData.guardianProfile?.forensicFingerprint || 'PENDING INITIALIZATION...'}</div>
                    </div>
                </div>
            </div>
        )}

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-2"><MapPin size={14} className="text-teal-600"/> Residential Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6"><label className="label">Home Address / House No. / Street</label><input disabled={readOnly || isMasked} type="text" name="homeAddress" value={maskValue(formData.homeAddress)} onChange={handleChange} className="input" /></div>
                <div className="md:col-span-3"><label className="label">City / Municipality</label><input disabled={readOnly || isMasked} type="text" name="city" value={maskValue(formData.city)} onChange={handleChange} className="input" placeholder="e.g. Makati City" /></div>
                <div className="md:col-span-3"><label className="label">Barangay</label><input disabled={readOnly || isMasked} type="text" name="barangay" value={maskValue(formData.barangay)} onChange={handleChange} className="input" placeholder="e.g. Bel-Air" /></div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-2"><Phone size={14}/> Communication</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1"><label className="label font-bold text-teal-800">Mobile No. *</label><input disabled={isMasked} required type="tel" name="phone" value={maskValue(formData.phone)} onChange={handleChange} className="input" placeholder="09XX-XXX-XXXX" /></div>
                    <div className="col-span-2 md:col-span-1"><label className="label">Secondary Mobile</label><input disabled={isMasked} type="tel" name="mobile2" value={maskValue(formData.mobile2)} onChange={handleChange} className="input" /></div>
                    <div className="col-span-2"><label className="label flex items-center gap-2"><Mail size={14} className="text-teal-600"/> Email Address</label><input disabled={isMasked} type="email" name="email" value={maskValue(formData.email)} onChange={handleChange} className="input" /></div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-2"><Briefcase size={14}/> Professional & Social</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1"><label className="label">Occupation</label><input disabled={isMasked} type="text" name="occupation" value={maskValue(formData.occupation)} onChange={handleChange} className="input" /></div>
                    <div className="col-span-2 md:col-span-1"><label className="label">Civil Status</label><select disabled={isMasked} name="civilStatus" value={formData.civilStatus || ''} onChange={handleChange} className="input">{['', ...fieldSettings.civilStatus].map(cs => <option key={cs} value={cs}>{cs || 'Select'}</option>)}</select></div>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border-2 border-teal-50 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-teal-700 tracking-widest flex items-center gap-2 mb-2"><Users size={14} className="text-teal-600"/> Family Background & Secondary Data</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1"><label className="label">Father's Name</label><input disabled={isMasked} type="text" name="fatherName" value={maskValue(formData.fatherName)} onChange={handleChange} className="input" placeholder="Full legal name" /></div>
                <div className="md:col-span-1"><label className="label">Father's Occupation</label><input disabled={isMasked} type="text" name="fatherOccupation" value={maskValue(formData.fatherOccupation)} onChange={handleChange} className="input" /></div>
                <div className="md:col-span-1"><label className="label">Mother's Name</label><input disabled={isMasked} type="text" name="motherName" value={maskValue(formData.motherName)} onChange={handleChange} className="input" placeholder="Full legal name" /></div>
                <div className="md:col-span-1"><label className="label">Mother's Occupation</label><input disabled={isMasked} type="text" name="motherOccupation" value={maskValue(formData.motherOccupation)} onChange={handleChange} className="input" /></div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
                <label className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${formData.thirdPartyAttestation ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-white border-slate-100'}`}>
                    <input disabled={isMasked} type="checkbox" name="thirdPartyAttestation" checked={formData.thirdPartyAttestation} onChange={handleChange} className="w-6 h-6 accent-teal-600 rounded mt-1 shrink-0" />
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <ShieldAlert size={14} className="text-teal-600"/>
                            <span className="font-extrabold text-teal-900 uppercase text-[10px]">PDA Third-Party Attestation *</span>
                        </div>
                        <p className="text-[10px] text-slate-600 font-medium leading-relaxed">I certify that I have obtained the necessary authority and/or consent from the individuals listed above (Father/Mother/Guardian) to provide their Sensitive Personal Information to this clinic for the purpose of medical coordination and record documentation.</p>
                    </div>
                </label>
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-2"><CreditCard size={14} className="text-teal-600"/> Financial Coverage</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">Primary HMO / Insurance Provider</label><select disabled={isMasked} name="insuranceProvider" value={formData.insuranceProvider || ''} onChange={handleChange} className="input">{['', ...fieldSettings.insuranceProviders].map(ins => <option key={ins} value={ins}>{ins || '- Private Pay -'}</option>)}</select></div>
                <div><label className="label">Policy / Member Number</label><input disabled={isMasked} type="text" name="insuranceNumber" value={maskValue(formData.insuranceNumber)} onChange={handleChange} className="input" placeholder="e.g. 123-456-789" /></div>
            </div>
        </div>
    </div>
  );
};

export default RegistrationBasicInfo;
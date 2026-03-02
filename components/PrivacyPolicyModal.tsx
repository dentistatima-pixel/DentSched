import React from 'react';
import { X, Shield, Globe } from 'lucide-react';

interface PrivacyPolicyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0 bg-teal-900 text-white rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <Shield size={24} className="text-teal-300" />
                        <div>
                            <h2 className="text-xl font-bold">Data Privacy Policy</h2>
                            <p className="text-xs text-teal-200">Compliance with R.A. 10173 (Data Privacy Act of 2012)</p>
                        </div>
                    </div>
                    <button onClick={onClose}><X size={24} className="text-teal-200 hover:text-white" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 text-sm text-slate-600 leading-relaxed space-y-6">
                    <section>
                        <h3 className="font-bold text-slate-800 text-lg mb-2">1. Introduction</h3>
                        <p>dentsched ("we", "us", "our") is committed to protecting your personal data. This Privacy Policy outlines how we collect, use, store, and share your information in compliance with the Philippines Data Privacy Act of 2012 (R.A. 10173).</p>
                    </section>

                    <section className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Globe size={18} className="text-teal-600"/>
                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Data Residency & Cloud Processing</h3>
                        </div>
                        <p className="text-xs font-bold text-slate-700 leading-relaxed">
                            Pursuant to our commitment to transparency: Data is processed by Google Firebase in the Asia-Southeast1 region under a standard Global Data Processing Agreement compliant with R.A. 10173. While data is stored in the cloud, all clinical records are end-to-end encrypted before transmission.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-bold text-slate-800 text-lg mb-2">2. Information We Collect</h3>
                        <p>We collect Sensitive Personal Information (SPI) necessary for your dental care, including but not limited to:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Personal identifiers (Name, Age, Address, Contact Info).</li>
                            <li>Medical history, dental records, and x-rays.</li>
                            <li>Payment and insurance information.</li>
                            <li><strong>Biometric Data:</strong> A visual identity anchor (photo) for non-repudiation and record authenticity proof.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-slate-800 text-lg mb-2">3. Purpose of Collection</h3>
                        <p>Your data is processed for the following purposes:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Diagnosis and treatment planning.</li>
                            <li>Billing and processing of HMO/PhilHealth claims.</li>
                            <li>Compliance with regulatory requirements (PRC, DOH).</li>
                            <li>Communication regarding appointments and follow-ups.</li>
                            <li>Ensuring the authenticity and non-repudiation of clinical entries.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-slate-800 text-lg mb-2">4. Data Sharing & Disclosure</h3>
                        <p>We do not sell your data. We may share your information strictly with:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Healthcare Providers:</strong> Specialists or labs involved in your care.</li>
                            <li><strong>Government Agencies:</strong> DOH, PhilHealth, BIR (as required by law).</li>
                            <li><strong>Insurance Providers:</strong> For claim processing purposes.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-slate-800 text-lg mb-2">5. Security Measures</h3>
                        <p>We implement organizational, physical, and technical security measures (such as encryption and access controls) to protect your data against unauthorized access, alteration, or disclosure.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-slate-800 text-lg mb-2">6. Your Rights</h3>
                        <p>Under the DPA, you have the right to:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Be informed about how your data is used.</li>
                            <li>Access your personal data.</li>
                            <li>Rectify/Correct inaccurate data.</li>
                            <li>Object to processing (subject to medical necessity).</li>
                            <li><strong>Right to Erasure:</strong> Specifically, you may request the purging of your visual identity anchor image once it is no longer required for active clinical validation.</li>
                            <li>Data Portability (obtain a copy of your records).</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-slate-800 text-lg mb-2">7. Data Retention</h3>
                        <p>In accordance with DOH and PRC guidelines, clinical records are retained for ten (10) years. Visual Identity Anchor thumbnails are stored for clinical validation and will be purged upon valid request for erasure, while the cryptographic hash of that image is retained permanently for forensic record integrity.</p>
                    </section>
                </div>

                <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0 rounded-b-3xl">
                    <button onClick={onClose} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20">
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyModal;
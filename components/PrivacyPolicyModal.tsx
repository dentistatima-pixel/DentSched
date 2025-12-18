
import React, { useState } from 'react';
import { X, Shield, Lock, FileText, Languages } from 'lucide-react';

interface PrivacyPolicyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
    const [lang, setLang] = useState<'EN' | 'PH'>('EN');

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
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setLang(lang === 'EN' ? 'PH' : 'EN')}
                            className="flex items-center gap-2 bg-teal-800 px-3 py-1 rounded-full text-xs font-bold hover:bg-teal-700 transition-colors border border-teal-600"
                        >
                            <Languages size={14}/> {lang === 'EN' ? 'Tagalog Translation' : 'English Version'}
                        </button>
                        <button onClick={onClose}><X size={24} className="text-teal-200 hover:text-white" /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 text-sm text-slate-600 leading-relaxed space-y-6">
                    {lang === 'EN' ? (
                        <>
                            <section>
                                <h3 className="font-bold text-slate-800 text-lg mb-2">1. Introduction</h3>
                                <p>dentsched ("we", "us", "our") is committed to protecting your personal data. This Privacy Policy outlines how we collect, use, store, and share your information in compliance with the Philippines Data Privacy Act of 2012 (R.A. 10173).</p>
                            </section>

                            <section>
                                <h3 className="font-bold text-slate-800 text-lg mb-2">2. Information We Collect</h3>
                                <p>We collect Sensitive Personal Information (SPI) necessary for your dental care, including but not limited to:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Personal identifiers (Name, Age, Address, Contact Info).</li>
                                    <li>Medical history, dental records, and x-rays.</li>
                                    <li>Payment and insurance information.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="font-bold text-slate-800 text-lg mb-2">6. Your Rights</h3>
                                <p>Under the DPA, you have the right to:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Be informed about how your data is used.</li>
                                    <li>Access your personal data.</li>
                                    <li>Rectify/Correct inaccurate data.</li>
                                    <li>Object to processing (subject to medical necessity).</li>
                                    <li>Data Portability (obtain a copy of your records).</li>
                                </ul>
                            </section>
                        </>
                    ) : (
                        <>
                            <section>
                                <h3 className="font-bold text-slate-800 text-lg mb-2">1. Panimula</h3>
                                <p>Ang dentsched ay nangangako na protektahan ang iyong personal na impormasyon. Ang Patakaran sa Privacy na ito ay naglalayong ipaliwanag kung paano namin kinokolekta, ginagamit, at ibinabahagi ang iyong impormasyon alinsunod sa Data Privacy Act of 2012 (R.A. 10173) ng Pilipinas.</p>
                            </section>

                            <section>
                                <h3 className="font-bold text-slate-800 text-lg mb-2">2. Impormasyong Aming Kinokolekta</h3>
                                <p>Kinokolekta namin ang iyong "Sensitive Personal Information" na kailangan para sa iyong dental care:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Pangalan, Edad, Tirahan, at Impormasyon sa pakikipag-ugnayan.</li>
                                    <li>Medical history, record ng ngipin, at x-rays.</li>
                                    <li>Impormasyon sa pagbabayad at insurance.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="font-bold text-slate-800 text-lg mb-2">6. Ang Iyong Mga Karapatan</h3>
                                <p>Sa ilalim ng DPA, mayroon kang karapatan na:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Malaman kung paano ginagamit ang iyong data.</li>
                                    <li>Makuha ang kopya ng iyong personal na impormasyon.</li>
                                    <li>Magpa-tama ng maling impormasyon (Right to Rectification).</li>
                                    <li>Tumanggi sa pagproseso ng data (Object to processing).</li>
                                </ul>
                            </section>
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0 rounded-b-3xl">
                    <button onClick={onClose} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20">
                        {lang === 'EN' ? 'I Understand' : 'Nauunawaan Ko'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyModal;

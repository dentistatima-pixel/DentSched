import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import { useToast } from './ToastSystem';

interface QuickAddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (firstName: string, surname: string, phone: string) => void;
}

const QuickAddPatientModal: React.FC<QuickAddPatientModalProps> = ({ isOpen, onClose, onSave }) => {
    const toast = useToast();
    const [firstName, setFirstName] = useState('');
    const [surname, setSurname] = useState('');
    const [phone, setPhone] = useState('');

    const handleSubmit = () => {
        if (!firstName.trim() || !surname.trim() || !phone.trim()) {
            toast.error("All fields are required for provisional intake.");
            return;
        }
        onSave(firstName, surname, phone);
        onClose();
    };
    
    useEffect(() => {
        if (!isOpen) {
            setFirstName('');
            setSurname('');
            setPhone('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col border-4 border-teal-100 animate-in zoom-in-95 overflow-hidden">
                <div className="p-6 border-b border-teal-50 bg-teal-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-teal-100 p-2 rounded-xl text-teal-700"><UserPlus size={24}/></div>
                        <div>
                            <h2 className="text-xl font-black text-teal-900 uppercase tracking-tight">Quick Intake</h2>
                            <p className="text-xs text-teal-600 font-bold uppercase tracking-widest">Provisional Record Creation</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-teal-100 rounded-full transition-colors"><X size={24} className="text-teal-400" /></button>
                </div>

                <div className="p-8 space-y-6">
                    <p className="text-sm text-center text-slate-500 font-medium">Create a provisional record with essential details. The full registration can be completed later on the dashboard.</p>
                    <div>
                        <label className="label text-xs">First Name *</label>
                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Juan" className="input" autoFocus />
                    </div>
                     <div>
                        <label className="label text-xs">Surname *</label>
                        <input type="text" value={surname} onChange={e => setSurname(e.target.value)} placeholder="e.g. Dela Cruz" className="input" />
                    </div>
                    <div>
                        <label className="label text-xs">Mobile Number *</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="09XXXXXXXXX" className="input" />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                    <button onClick={handleSubmit} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-teal-600/20 hover:scale-105 transition-all flex items-center justify-center gap-2">
                        <Save size={16} /> Create & Queue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickAddPatientModal;

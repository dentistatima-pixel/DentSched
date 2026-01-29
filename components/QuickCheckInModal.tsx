
import React, { useState, useMemo } from 'react';
import { X, UserCheck, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { Patient, Appointment, AppointmentStatus } from '../types';
import { useToast } from './ToastSystem';

interface QuickCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  todaysAppointments: Appointment[];
  onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => void;
}

const QuickCheckInModal: React.FC<QuickCheckInModalProps> = ({ isOpen, onClose, patients, todaysAppointments, onUpdateStatus }) => {
    const toast = useToast();
    const [phone, setPhone] = useState('');
    const [foundAppointment, setFoundAppointment] = useState<Appointment | null>(null);
    const [foundPatient, setFoundPatient] = useState<Patient | null>(null);

    const handleSearch = () => {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 4) {
            toast.error("Enter at least 4 digits of the phone number.");
            return;
        }
        const patient = patients.find(p => p.phone.replace(/\D/g, '').includes(cleanPhone));
        if (patient) {
            const appointment = todaysAppointments.find(a => a.patientId === patient.id && a.status !== AppointmentStatus.ARRIVED);
            if (appointment) {
                setFoundPatient(patient);
                setFoundAppointment(appointment);
            } else {
                toast.warning(`${patient.name} has no pending appointments for today.`);
                setFoundPatient(null);
                setFoundAppointment(null);
            }
        } else {
            toast.error("No patient found with that phone number.");
            setFoundPatient(null);
            setFoundAppointment(null);
        }
    };

    const handleCheckIn = () => {
        if (foundAppointment) {
            onUpdateStatus(foundAppointment.id, AppointmentStatus.ARRIVED);
            toast.success(`${foundPatient?.name} has been checked in.`);
            onClose();
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-xl text-blue-700"><UserCheck size={24}/></div>
                        <div>
                            <h2 className="text-xl font-black text-blue-900 uppercase tracking-tight">Quick Check-In</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} className="text-slate-400" /></button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="flex gap-2">
                        <input 
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="Enter patient's mobile number..."
                            className="input flex-1"
                            autoFocus
                        />
                        <button onClick={handleSearch} className="px-4 bg-teal-600 text-white rounded-xl"><Search size={20}/></button>
                    </div>

                    {foundAppointment && foundPatient && (
                        <div className="bg-teal-50 p-6 rounded-2xl border-2 border-teal-200 animate-in fade-in space-y-4">
                            <h3 className="text-center font-black text-teal-900 uppercase">{foundPatient.name}</h3>
                            <div className="text-center">
                                <p className="text-sm text-slate-600">Appointment at <strong>{foundAppointment.time}</strong></p>
                                <p className="text-xs text-slate-500">{foundAppointment.type}</p>
                            </div>
                            <button onClick={handleCheckIn} className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2">
                                <CheckCircle size={16}/> Confirm Arrival
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuickCheckInModal;

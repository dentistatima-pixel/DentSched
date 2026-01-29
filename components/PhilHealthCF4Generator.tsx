
import React from 'react';
import { Patient, DentalChartEntry, User, Appointment, AppointmentStatus } from '../types';
import { FileText, Download, FileSignature, ShieldAlert, ShieldX } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { formatDate } from '../constants';

interface PhilHealthCF4GeneratorProps {
    patient: Patient;
    currentUser: User;
    odontogram: DentalChartEntry[];
    appointments: Appointment[];
}

const PhilHealthCF4Generator: React.FC<PhilHealthCF4GeneratorProps> = ({ patient, currentUser, odontogram, appointments }) => {
    
    // NOTE: This component's logic is a placeholder. A "Coming Soon" overlay is added.
    const generateCF2 = () => { /* ... existing logic ... */ };
    const generateCF4 = () => { /* ... existing logic ... */ };

    return (
        <div className="relative group">
            <div className="absolute inset-0 bg-blue-50/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 text-center p-4">
                <ShieldAlert size={32} className="text-blue-500 mb-4"/>
                <h4 className="font-black text-blue-800 uppercase tracking-tight">Feature Under Development</h4>
                <p className="text-sm text-blue-700 mt-1 font-medium">PhilHealth CF4 generation is coming soon.</p>
            </div>
            <div className="flex gap-2 filter grayscale pointer-events-none blur-sm" aria-hidden="true">
                <button 
                    disabled
                    className="bg-lilac-600 hover:bg-lilac-700 text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-lilac-600/20 transition-all active:scale-95"
                >
                    <FileSignature size={14} /> Generate CF-2
                </button>
                <button 
                    disabled
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-teal-600/20 transition-all active:scale-95"
                >
                    <FileText size={14} /> Generate CF-4
                </button>
            </div>
        </div>
    );
};

export default PhilHealthCF4Generator;


import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Stethoscope, Save, Search, AlertTriangle, Shield, AlertCircle, FileText, Lock } from 'lucide-react';
import { Patient, User as Staff, AppointmentType, UserRole, Appointment, AppointmentStatus } from '../types';
import Fuse from 'fuse.js';
import { formatDate } from '../constants';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  staff: Staff[];
  onSave: (appointment: any) => void;
  onSavePatient?: (patient: any) => void; // For saving new provisional patients
  initialDate?: string;
  initialTime?: string;
  initialPatientId?: string; // New prop for pre-selecting patient
  existingAppointment?: Appointment | null; // For editing
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ 
  isOpen, onClose, patients, staff, onSave, onSavePatient, initialDate, initialTime, initialPatientId, existingAppointment 
}) => {
  const [activeTab, setActiveTab] = useState<'existing' | 'new' | 'block'>('existing');
  
  // Common Fields
  const [providerId, setProviderId] = useState('');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(initialTime || '09:00');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');

  // Existing Patient Tab
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [procedureType, setProcedureType] = useState<AppointmentType>(AppointmentType.CONSULTATION);

  // New Patient Tab (Provisional)
  const [newPatientData, setNewPatientData] = useState({
      firstName: '',
      surname: '',
      phone: '',
      notes: ''
  });

  // Block Tab
  const [blockTitle, setBlockTitle] = useState('');

  // Reschedule Logic
  const [rescheduleReason, setRescheduleReason] = useState<'Correction' | 'Reschedule'>('Reschedule');

  const dentists = staff.filter(s => s.role === UserRole.DENTIST);
  const hygienists = staff.filter(s => s.role === UserRole.HYGIENIST);

  useEffect(() => {
      if (isOpen) {
          if (existingAppointment) {
              setProviderId(existingAppointment.providerId);
              setDate(existingAppointment.date);
              setTime(existingAppointment.time);
              setDuration(existingAppointment.durationMinutes);
              setNotes(existingAppointment.notes || '');
              
              if (existingAppointment.isBlock) {
                  setActiveTab('block');
                  setBlockTitle(existingAppointment.title || '');
              } else {
                  setActiveTab('existing');
                  setSelectedPatientId(existingAppointment.patientId);
                  setProcedureType(existingAppointment.type);
              }
          } else {
              // Reset for new booking
              setDate(initialDate || new Date().toISOString().split('T')[0]);
              setTime(initialTime || '09:00');
              setProviderId('');
              
              if (initialPatientId) {
                  setActiveTab('existing');
                  setSelectedPatientId(initialPatientId);
              } else {
                  setSelectedPatientId('');
                  setActiveTab('existing');
              }
              
              setSearchTerm('');
          }
      }
  }, [isOpen, initialDate, initialTime, initialPatientId, existingAppointment]);

  if (!isOpen) return null;

  // Search Logic
  const fuse = new Fuse(patients, { keys: ['name', 'phone', 'id'], threshold: 0.3 });
  const searchResults = searchTerm ? fuse.search(searchTerm).map(r => r.item).slice(0, 5) : [];
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Outstanding Treatment Logic
  const getPendingTreatments = (p: Patient) => {
      return p.dentalChart?.filter(e => e.status === 'Planned') || [];
  };

  const handleSave = () => {
      if (!providerId) {
          alert("Please select a provider");
          return;
      }

      let finalPatientId = selectedPatientId;
      let isBlock = false;
      let title = undefined;

      // Handle New Patient Creation
      if (activeTab === 'new') {
          if (!newPatientData.firstName || !newPatientData.surname || !newPatientData.phone) {
              alert("Please fill in required fields");
              return;
          }
          const newId = Math.floor(10000000 + Math.random() * 90000000).toString(); // Generate 8 digit ID
          const newPatient = {
              id: newId,
              name: `${newPatientData.firstName} ${newPatientData.surname}`,
              firstName: newPatientData.firstName,
              surname: newPatientData.surname,
              phone: newPatientData.phone,
              notes: newPatientData.notes,
              provisional: true, // Flag as provisional internally
              dob: '',
              email: ''
          };
          
          if (onSavePatient) onSavePatient(newPatient);
          finalPatientId = newId;
      } 
      
      // Handle Block
      if (activeTab === 'block') {
          isBlock = true;
          title = blockTitle || 'Blocked Time';
          finalPatientId = 'BLOCK';
      } else {
          if (!finalPatientId) {
              alert("Please select a patient");
              return;
          }
      }

      const appointmentData: any = {
          id: existingAppointment?.id || Math.random().toString(36).substr(2, 9),
          patientId: finalPatientId,
          providerId,
          date,
          time,
          durationMinutes: duration,
          type: activeTab === 'block' ? AppointmentType.CONSULTATION : procedureType, // Fallback type for block
          status: AppointmentStatus.SCHEDULED,
          notes,
          isBlock,
          title
      };

      // Reschedule History Logic
      if (existingAppointment) {
          if (existingAppointment.date !== date || existingAppointment.time !== time) {
              const history = existingAppointment.rescheduleHistory || [];
              history.push({
                  previousDate: existingAppointment.date,
                  previousTime: existingAppointment.time,
                  reason: rescheduleReason,
                  timestamp: new Date().toISOString()
              });
              appointmentData.rescheduleHistory = history;
          }
      }

      onSave(appointmentData);
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-end md:items-center p-0 md:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-20 duration-300 md:duration-200 md:zoom-in-95 max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <div className="md:hidden w-12 h-1 bg-slate-200 rounded-full mb-3 mx-auto"></div>
            <h2 className="text-xl font-bold text-slate-800">{existingAppointment ? 'Edit Appointment' : 'Book Appointment'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        {!existingAppointment && (
            <div className="flex border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('existing')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'existing' ? 'border-teal-600 text-teal-800 bg-teal-50/50' : 'border-transparent text-slate-500'}`}
                >
                    Find Existing
                </button>
                <button 
                    onClick={() => setActiveTab('new')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'new' ? 'border-teal-600 text-teal-800 bg-teal-50/50' : 'border-transparent text-slate-500'}`}
                >
                    New Patient
                </button>
                <button 
                    onClick={() => setActiveTab('block')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'block' ? 'border-slate-600 text-slate-800 bg-slate-50' : 'border-transparent text-slate-500'}`}
                >
                    Block / Admin
                </button>
            </div>
        )}

        <div className="p-6 space-y-5 pb-safe">
            
            {/* --- TAB CONTENT: EXISTING --- */}
            {activeTab === 'existing' && (
                <>
                    <div className="relative z-20">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Search Patient</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Name, Phone, or ID..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                value={selectedPatient ? selectedPatient.name : searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    if (selectedPatient) setSelectedPatientId('');
                                }}
                            />
                            {selectedPatient && (
                                <button 
                                    onClick={() => { setSelectedPatientId(''); setSearchTerm(''); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-slate-200 rounded-full hover:bg-slate-300"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        {/* Dropdown Results */}
                        {searchTerm && !selectedPatient && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-30">
                                {searchResults.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => { setSelectedPatientId(p.id); setSearchTerm(''); }}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="font-bold text-slate-800">{p.name}</div>
                                            <div className="text-xs text-slate-500">{p.phone} • {formatDate(p.dob)}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Context Card */}
                    {selectedPatient && (
                        <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                             <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-teal-900 flex items-center gap-2">
                                    <User size={16}/> {selectedPatient.name}
                                </h4>
                                <span className="text-xs text-teal-600 bg-white px-2 py-1 rounded-full border border-teal-100">
                                    Last: {formatDate(selectedPatient.lastVisit)}
                                </span>
                             </div>
                             
                             {/* Outstanding Treatments */}
                             {getPendingTreatments(selectedPatient).length > 0 && (
                                 <div className="mt-3 bg-white p-3 rounded-lg border border-teal-100">
                                     <div className="text-xs font-bold text-slate-500 uppercase mb-1">Outstanding Treatment</div>
                                     <ul className="space-y-1">
                                         {getPendingTreatments(selectedPatient).map((t, idx) => (
                                             <li key={idx} className="text-sm text-red-600 font-medium flex items-center gap-2">
                                                 <AlertCircle size={12}/> Tooth {t.toothNumber}: {t.procedure}
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                             )}

                             {/* Alerts */}
                             {(selectedPatient.medicalConditions?.length || 0) > 0 && (
                                 <div className="mt-2 text-xs text-red-600 font-bold flex items-center gap-1">
                                     <AlertTriangle size={12} /> Medical Alerts on file
                                 </div>
                             )}
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Procedure</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            value={procedureType}
                            onChange={(e) => setProcedureType(e.target.value as AppointmentType)}
                        >
                            {Object.values(AppointmentType).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            {/* --- TAB CONTENT: NEW PATIENT --- */}
            {activeTab === 'new' && (
                <div className="space-y-4 bg-teal-50/50 p-4 rounded-xl border border-teal-100">
                    <div className="flex items-start gap-2 text-teal-800 text-sm mb-2">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <p><strong>Quick Add</strong> for scheduling. Clinic staff to complete full registration details upon patient arrival.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">First Name *</label>
                            <input 
                                type="text"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:border-teal-500 outline-none bg-white"
                                value={newPatientData.firstName}
                                onChange={e => setNewPatientData({...newPatientData, firstName: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Surname *</label>
                            <input 
                                type="text"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:border-teal-500 outline-none bg-white"
                                value={newPatientData.surname}
                                onChange={e => setNewPatientData({...newPatientData, surname: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Mobile Number *</label>
                        <input 
                            type="tel"
                            placeholder="09xx xxx xxxx"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:border-teal-500 outline-none bg-white"
                            value={newPatientData.phone}
                            onChange={e => setNewPatientData({...newPatientData, phone: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Chief Complaint / Notes</label>
                        <input 
                            type="text"
                            placeholder="e.g. Toothache, Cleaning"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:border-teal-500 outline-none bg-white"
                            value={newPatientData.notes}
                            onChange={e => setNewPatientData({...newPatientData, notes: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Procedure</label>
                        <select 
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            value={procedureType}
                            onChange={(e) => setProcedureType(e.target.value as AppointmentType)}
                        >
                            {Object.values(AppointmentType).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* --- TAB CONTENT: BLOCK --- */}
            {activeTab === 'block' && (
                <div className="space-y-4 bg-slate-100 p-4 rounded-xl border border-slate-200">
                     <div className="flex items-start gap-2 text-slate-600 text-sm mb-2">
                        <Lock size={16} className="shrink-0 mt-0.5" />
                        <p>Blocks time on the calendar for administrative tasks, breaks, or meetings.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Block Title *</label>
                        <input 
                            type="text"
                            placeholder="e.g. Staff Meeting, Lunch, Vendor Demo"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
                            value={blockTitle}
                            onChange={(e) => setBlockTitle(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* Common Fields */}
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="date" 
                            required
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Time</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="time" 
                            required
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Duration (min)</label>
                    <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                    >
                        <option value={15}>15 mins</option>
                        <option value={30}>30 mins</option>
                        <option value={45}>45 mins</option>
                        <option value={60}>1 hour</option>
                        <option value={90}>1.5 hours</option>
                        <option value={120}>2 hours</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Provider</label>
                    <select 
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        value={providerId}
                        onChange={(e) => setProviderId(e.target.value)}
                    >
                        <option value="">Select Provider</option>
                        <optgroup label="Dentists">
                            {dentists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </optgroup>
                        <optgroup label="Hygienists">
                            {hygienists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </optgroup>
                    </select>
                </div>
            </div>

            {/* Reschedule Question */}
            {existingAppointment && (
                 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <label className="block text-sm font-bold text-blue-800 mb-2">Modification Reason</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="reason" 
                                value="Reschedule" 
                                checked={rescheduleReason === 'Reschedule'} 
                                onChange={() => setRescheduleReason('Reschedule')}
                                className="w-4 h-4 accent-blue-600"
                            />
                            <span className="text-sm">Reschedule (Log it)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="reason" 
                                value="Correction" 
                                checked={rescheduleReason === 'Correction'} 
                                onChange={() => setRescheduleReason('Correction')}
                                className="w-4 h-4 accent-blue-600"
                            />
                            <span className="text-sm">Correction (Oops)</span>
                        </label>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Internal Notes</label>
                <textarea 
                    placeholder="Notes visible to staff only..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 h-24 resize-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex gap-3 pb-8 md:pb-4 bg-white md:rounded-b-3xl sticky bottom-0 z-20">
            <button 
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={handleSave}
                className="flex-[2] py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
            >
                <Save size={20} />
                {existingAppointment ? 'Update Booking' : 'Confirm Booking'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default AppointmentModal;

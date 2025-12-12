
import React, { useState, useEffect, useRef } from 'react';
import { Appointment, Patient, User } from '../types';
import { Video, Mic, PhoneOff, Send, Plus, StickyNote, X } from 'lucide-react';

interface TelehealthModalProps {
    appointment: Appointment;
    patient: Patient;
    doctor: User;
    onClose: () => void;
}

const TelehealthModal: React.FC<TelehealthModalProps> = ({ appointment, patient, doctor, onClose }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [notes, setNotes] = useState('');
    const patientVideoRef = useRef<HTMLVideoElement>(null);
    const doctorVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Access camera and microphone
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                if (patientVideoRef.current) {
                    patientVideoRef.current.srcObject = stream;
                }
                if (doctorVideoRef.current) {
                    doctorVideoRef.current.srcObject = stream; // Use same stream for mock
                }
            })
            .catch(err => {
                console.error("Error accessing media devices.", err);
                alert("Could not access camera/microphone. Please check permissions.");
            });

        return () => {
            // Cleanup: stop media tracks
            if (patientVideoRef.current?.srcObject) {
                (patientVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
        };
    }, []);


    return (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-6xl h-full flex flex-col md:flex-row gap-4">
                
                {/* Main Video Feed */}
                <div className="flex-1 flex flex-col bg-black rounded-2xl overflow-hidden relative shadow-2xl">
                    <video ref={patientVideoRef} autoPlay muted playsInline className="w-full h-full object-cover"></video>
                    <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm font-bold">
                        {patient.name}
                    </div>

                    {/* Doctor's Picture-in-Picture */}
                    <div className="absolute top-4 right-4 w-1/4 max-w-[200px] aspect-video bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-600">
                        <video ref={doctorVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform -scale-x-100"></video>
                         <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-0.5 rounded text-xs font-bold">
                            {doctor.name}
                        </div>
                    </div>
                </div>

                {/* Controls & Notes Panel */}
                <div className="w-full md:w-80 bg-white rounded-2xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-200">
                        <p className="font-bold">{appointment.type}</p>
                        <p className="text-xs text-slate-500">with {patient.name}</p>
                    </div>
                    
                    <div className="flex-1 p-4 bg-slate-50 overflow-y-auto">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-2"><StickyNote size={14}/> Private Notes</label>
                        <textarea 
                            className="w-full h-full min-h-[150px] bg-white border border-slate-200 rounded-lg p-2 text-sm"
                            placeholder="Clinical observations..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                    
                    <div className="p-4 border-t border-slate-200 space-y-3">
                         <h4 className="text-xs font-bold text-slate-500 uppercase">Actions</h4>
                         <button className="w-full py-2 bg-teal-100 text-teal-700 font-bold text-sm rounded-lg flex items-center justify-center gap-2">
                             <Plus size={16}/> Create Treatment Plan
                         </button>
                         <button className="w-full py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-lg flex items-center justify-center gap-2">
                             <Send size={16}/> Book Follow-up
                         </button>
                    </div>

                    <div className="bg-slate-800 p-4 flex justify-around items-center">
                        <button onClick={() => setIsMuted(!isMuted)} className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-slate-600 text-white'}`}>
                            <Mic size={24} />
                        </button>
                         <button onClick={() => setIsVideoOff(!isVideoOff)} className={`p-3 rounded-full transition-colors ${isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-600 text-white'}`}>
                            <Video size={24} />
                        </button>
                        <button onClick={onClose} className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700">
                             <PhoneOff size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TelehealthModal;

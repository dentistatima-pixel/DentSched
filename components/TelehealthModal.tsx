import React, { useState, useEffect, useRef } from 'react';
import { Patient } from '../types';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, Clock, Loader } from 'lucide-react';
import { useToast } from './ToastSystem';

interface TelehealthModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient | null;
}

const TelehealthModal: React.FC<TelehealthModalProps> = ({ isOpen, onClose, patient }) => {
    const toast = useToast();
    const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<number | null>(null);

    const startCall = async () => {
        setCallStatus('connecting');
        setCallDuration(0);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            setCallStatus('connected');
            timerRef.current = window.setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Error accessing media devices:", error);
            toast.error("Camera/Mic access denied. Please check permissions.");
            endCall();
        }
    };

    const endCall = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCallStatus('ended');
        onClose();
    };
    
    useEffect(() => {
        if (isOpen) {
            startCall();
        } else {
            endCall();
        }

        return () => {
            endCall();
        };
    }, [isOpen]);

    const toggleMic = () => {
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMicMuted(prev => !prev);
        }
    };

    const toggleCamera = () => {
        if (streamRef.current) {
            streamRef.current.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsCameraOff(prev => !prev);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex justify-center items-center p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 w-full max-w-4xl h-[80vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border-4 border-teal-500/20 relative">

                {/* Remote Patient View */}
                <div className="flex-1 bg-black/50 flex items-center justify-center relative">
                    {callStatus === 'connecting' && (
                        <div className="text-center text-white flex flex-col items-center gap-4">
                            <Loader size={48} className="animate-spin text-teal-400" />
                            <p className="font-bold text-lg">Connecting to {patient?.name}...</p>
                        </div>
                    )}
                    {callStatus === 'connected' && (
                         <div className="w-48 h-48 rounded-full bg-teal-500/10 border-4 border-teal-500/20 flex items-center justify-center animate-pulse">
                            <img 
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${patient?.name}`} 
                                alt={patient?.name}
                                className="w-40 h-40 rounded-full opacity-50"
                            />
                        </div>
                    )}
                    <div className="absolute top-6 left-6 bg-black/30 backdrop-blur-md px-4 py-2 rounded-xl text-white font-bold text-sm">
                        {patient?.name}
                    </div>
                     {callStatus === 'connected' && (
                        <div className="absolute top-6 right-6 bg-black/30 backdrop-blur-md px-4 py-2 rounded-xl text-white font-mono text-lg flex items-center gap-2">
                           <Clock size={16} /> {formatDuration(callDuration)}
                        </div>
                    )}
                </div>

                {/* Local Practitioner View */}
                <div className="absolute bottom-28 right-8 w-64 h-40 bg-black rounded-2xl shadow-2xl border-2 border-white/10 overflow-hidden">
                    <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover scale-x-[-1] transition-opacity ${isCameraOff ? 'opacity-0' : 'opacity-100'}`} />
                    {isCameraOff && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                            <VideoOff size={32} className="text-slate-500"/>
                        </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs font-bold">
                        You
                    </div>
                </div>

                {/* Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 bg-black/30 backdrop-blur-lg p-3 rounded-full border border-white/10">
                    <button onClick={toggleMic} className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isMicMuted ? 'bg-lilac-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                        {isMicMuted ? <MicOff size={28}/> : <Mic size={28}/>}
                    </button>
                    <button onClick={toggleCamera} className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isCameraOff ? 'bg-lilac-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                        {isCameraOff ? <VideoOff size={28}/> : <Video size={28}/>}
                    </button>
                    <button onClick={endCall} className="w-24 h-16 rounded-full flex items-center justify-center bg-red-600 text-white hover:bg-red-700 transition-colors">
                        <PhoneOff size={28}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TelehealthModal;

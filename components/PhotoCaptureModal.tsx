
import React, { useState, useRef, useEffect } from 'react';
import { Patient, DentalChartEntry, User } from '../types';
import { X, Camera, CheckCircle, RefreshCw, Type, Maximize, Target, Link, Aperture, ShieldCheck } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { useToast } from './ToastSystem';

interface PhotoCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (metadata: DentalChartEntry['imageMetadata'][0], log: Patient['clinicalMediaConsent']['mediaCapturedLogs'][0]) => void;
    patient: Patient;
    chartEntry: DentalChartEntry;
    currentUser: User;
}

const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({
    isOpen, onClose, onSave, patient, chartEntry, currentUser
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const toast = useToast();

    const [isCameraActive, setIsCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [viewAngle, setViewAngle] = useState<'Buccal' | 'Lingual' | 'Occlusal' | 'Lateral' | 'Intraoral' | 'Extraoral'>('Intraoral');
    const [purpose, setPurpose] = useState<'Diagnostic' | 'Treatment Planning' | 'Progress' | 'Complication' | 'Marketing'>('Diagnostic');
    const [isLoading, setIsLoading] = useState(false);
    const [deviceInfo, setDeviceInfo] = useState('Unknown Device');
    const [canCapture, setCanCapture] = useState(false);

    const startCamera = async () => {
        setIsLoading(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                const videoTrack = stream.getVideoTracks()[0];
                const settings = videoTrack.getSettings();
                setDeviceInfo(`${settings.width}x${settings.height} ${videoTrack.label}`);
            }
            setIsCameraActive(true);
        } catch (err) {
            toast.error("Camera access failed. Please check permissions.");
            console.error(err);
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        setIsCameraActive(false);
    };
    
    useEffect(() => {
        if (isOpen && patient) {
            const consent = patient.clinicalMediaConsent;
            let canProceed = false;

            // FIX: Changed consentRevoked to consentRevocation to match interface property.
            if (consent && consent.generalConsent && !consent.consentRevocation) {
                if (consent.permissions.intraoralPhotos || consent.permissions.extraoralPhotos) {
                    canProceed = true;
                } else {
                    toast.error(`Patient has not consented to photography.`, { duration: 5000 });
                }
            } else {
                toast.error('Clinical Media Consent is missing or has been revoked.', { duration: 5000 });
            }

            setCanCapture(canProceed);

            if (canProceed) {
                startCamera();
            } else {
                setTimeout(onClose, 500); // Give user time to read toast
            }
        } else if (!isOpen) {
            stopCamera();
            setCapturedImage(null);
        }
        return () => stopCamera();
    }, [isOpen, patient]);

    const handleCapture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setCapturedImage(dataUrl);
            stopCamera();
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera();
    };

    const handleSave = () => {
        if (!capturedImage) return;

        const hash = CryptoJS.SHA256(capturedImage).toString();
        const timestamp = new Date().toISOString();

        const metadata: DentalChartEntry['imageMetadata'][0] = {
            hash,
            fileName: `patient_${patient.id}_${Date.now()}.jpg`,
            captureTimestamp: timestamp,
            capturedBy: currentUser.id,
            device: deviceInfo,
            toothNumber: chartEntry.toothNumber,
            viewAngle: viewAngle,
            consentVerified: true,
        };

        const log: Patient['clinicalMediaConsent']['mediaCapturedLogs'][0] = {
            sessionId: chartEntry.id,
            date: chartEntry.date,
            capturedBy: currentUser.id,
            mediaType: 'Photo',
            imageHashes: [hash],
            procedure: chartEntry.procedure,
            device: deviceInfo,
            consentReconfirmed: true,
            purpose: purpose,
        };

        onSave(metadata, log);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-lilac-100 p-3 rounded-xl text-lilac-700"><Camera size={24}/></div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Clinical Image Capture</h2>
                            <p className="text-sm text-slate-500">Attach verifiable media to clinical note.</p>
                        </div>
                    </div>
                    <button onClick={onClose}><X size={24} className="text-slate-500"/></button>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 min-h-0">
                    <div className="md:col-span-2 bg-slate-900 rounded-2xl flex items-center justify-center relative">
                        {isLoading && <p className="text-white">Initializing Camera...</p>}
                        <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-contain ${isCameraActive ? '' : 'hidden'}`} />
                        {capturedImage && <img src={capturedImage} alt="Captured" className="max-h-full max-w-full object-contain"/>}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                    <div className="space-y-6">
                        <div className="bg-green-50 border-l-4 border-green-500 p-4">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="text-green-600" size={18}/>
                            <span className="text-sm font-semibold text-green-800">Media Consent Verified</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            Patient consented on {patient.clinicalMediaConsent?.consentTimestamp ? new Date(patient.clinicalMediaConsent.consentTimestamp).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="label text-xs">View Angle</label>
                            <select value={viewAngle} onChange={e => setViewAngle(e.target.value as any)} className="input">
                                <option>Intraoral</option><option>Extraoral</option><option>Buccal</option><option>Lingual</option><option>Occlusal</option><option>Lateral</option>
                            </select>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="label text-xs">Purpose</label>
                             <select value={purpose} onChange={e => setPurpose(e.target.value as any)} className="input">
                                <option>Diagnostic</option><option>Treatment Planning</option><option>Progress</option><option>Complication</option><option>Marketing</option>
                            </select>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                             <div className="flex items-center gap-2"><Link size={14}/><strong>Linked To:</strong> Note #{chartEntry.id.slice(-6)}</div>
                             <div className="flex items-center gap-2"><Target size={14}/><strong>Target:</strong> Tooth #{chartEntry.toothNumber || 'General'}</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t bg-white flex justify-between items-center shrink-0">
                    {capturedImage ? (
                        <>
                             <button onClick={handleRetake} className="px-8 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2"><RefreshCw size={16}/> Retake</button>
                             <button onClick={handleSave} className="px-10 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-3">
                                <CheckCircle size={18}/> Save to Chart
                            </button>
                        </>
                    ) : (
                        <button onClick={handleCapture} disabled={!isCameraActive || !canCapture} className="w-full py-5 bg-lilac-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
                            <Aperture size={20}/> Capture Image
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PhotoCaptureModal;

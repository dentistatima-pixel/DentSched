import { useState, useRef, Dispatch, SetStateAction, useEffect } from 'react';
import { useToast } from '../components/ToastSystem';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from '@google/genai';

interface DictationSetters {
    s: Dispatch<SetStateAction<string>>;
    o: Dispatch<SetStateAction<string>>;
    a: Dispatch<SetStateAction<string>>;
    p: Dispatch<SetStateAction<string>>;
}

const DENTAL_TERMINOLOGY: Record<string, string> = {
    'numba': '#',
    'number': '#',
    'mesial': 'M',
    'distal': 'D',
    'occlusal': 'O',
    'buccal': 'B',
    'lingual': 'L',
    'palatal': 'P',
    'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'zero': '0'
};

const enhanceTranscript = (text: string): string => {
    let enhanced = text;
    Object.entries(DENTAL_TERMINOLOGY).forEach(([spoken, written]) => {
        const regex = new RegExp(`\\b${spoken}\\b`, 'gi');
        enhanced = enhanced.replace(regex, written);
    });
    return enhanced;
};


// Audio utility functions
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

export const useDictation = (setters: DictationSetters) => {
    const toast = useToast();
    const [isRecording, setIsRecording] = useState<keyof DictationSetters | null>(null);
    
    const sessionRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    
    const activeFieldRef = useRef<keyof DictationSetters | null>(null);
    useEffect(() => {
        activeFieldRef.current = isRecording;
    }, [isRecording]);
    
    const stopRecordingResources = () => {
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (sessionRef.current) {
            sessionRef.current.then(session => session.close()).catch(console.error);
            sessionRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
        setIsRecording(null);
    };

    const toggleRecording = async (field: keyof DictationSetters) => {
        if (isRecording) {
            stopRecordingResources();
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            
            setIsRecording(field);

            sessionRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: async () => {
                        try {
                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                            if (!audioContextRef.current || audioContextRef.current.state === 'closed') return; // Check if context was closed
                            mediaStreamRef.current = stream;
                            const source = audioContextRef.current.createMediaStreamSource(stream);
                            const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                            scriptProcessorRef.current = scriptProcessor;

                            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                                if (activeFieldRef.current && sessionRef.current) {
                                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                    const pcmBlob = createBlob(inputData);
                                    sessionRef.current.then(session => {
                                        session.sendRealtimeInput({ media: pcmBlob });
                                    }).catch(console.error);
                                }
                            };
                            source.connect(scriptProcessor);
                            scriptProcessor.connect(audioContextRef.current.destination);
                        } catch (err) {
                            toast.error("Microphone access denied.");
                            console.error(err);
                            stopRecordingResources();
                        }
                    },
                    onmessage: (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            if (text && activeFieldRef.current) {
                                const enhancedText = enhanceTranscript(text);
                                const setter = setters[activeFieldRef.current];
                                setter(prev => (prev ? `${prev} ${enhancedText}` : enhancedText).trim());
                            }
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        toast.error("Dictation service connection error.");
                        console.error("Live API Error:", e);
                        stopRecordingResources();
                    },
                    onclose: () => {
                        console.log("Live API connection closed.");
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO], // Mandatory
                    inputAudioTranscription: {},
                },
            });
        } catch (error) {
            toast.error("Failed to start dictation service.");
            console.error(error);
            stopRecordingResources();
        }
    };
    
    useEffect(() => {
        return () => {
            stopRecordingResources();
        };
    }, []);

    return { isRecording, toggleRecording };
};
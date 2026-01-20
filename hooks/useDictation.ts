
import { useState, useRef, Dispatch, SetStateAction } from 'react';
import { useToast } from '../components/ToastSystem';

interface DictationSetters {
    s: Dispatch<SetStateAction<string>>;
    o: Dispatch<SetStateAction<string>>;
    a: Dispatch<SetStateAction<string>>;
    p: Dispatch<SetStateAction<string>>;
}

export const useDictation = (setters: DictationSetters) => {
    const toast = useToast();
    const [isRecording, setIsRecording] = useState<keyof DictationSetters | null>(null);
    const recognitionRef = useRef<any>(null);

    const toggleRecording = (field: keyof DictationSetters) => {
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop();
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Speech recognition is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        recognition.onstart = () => setIsRecording(field);
        
        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result: any) => result.transcript)
                .join('');
            
            const setter = setters[field];
            setter(prev => prev ? `${prev} ${transcript}` : transcript);
        };
        
        recognition.onerror = (event: any) => {
            toast.error(`Speech recognition error: ${event.error}`);
            setIsRecording(null);
        };
        
        recognition.onend = () => {
            setIsRecording(null);
            recognitionRef.current = null;
        };

        recognition.start();
    };

    return { isRecording, toggleRecording };
};

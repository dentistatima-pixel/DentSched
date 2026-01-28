
import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface InfoDisplayModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content?: string;
    fetcher?: () => Promise<string>;
}

const InfoDisplayModal: React.FC<InfoDisplayModalProps> = ({ isOpen, onClose, title, content: staticContent, fetcher }) => {
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            if (staticContent) {
                setContent(staticContent);
                setIsLoading(false);
            } else if (fetcher) {
                setIsLoading(true);
                fetcher()
                    .then(data => setContent(data))
                    .catch(err => setContent(`Error: ${err.message}`))
                    .finally(() => setIsLoading(false));
            } else {
                setContent("No content provided.");
                setIsLoading(false);
            }
        }
    }, [isOpen, fetcher, staticContent]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-teal-100 p-2 rounded-xl text-teal-700"><Sparkles size={20}/></div>
                        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                    </div>
                    <button onClick={onClose}><X size={24} className="text-slate-500" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <svg className="animate-spin h-8 w-8 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    ) : (
                        <ReactMarkdown className="prose prose-sm max-w-none">
                            {content}
                        </ReactMarkdown>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold">Close</button>
                </div>
            </div>
        </div>
    );
};

export default InfoDisplayModal;

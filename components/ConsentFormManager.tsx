import React, { useState, useEffect } from 'react';
import { FieldSettings, ConsentFormTemplate } from '../types';
import { FileSignature, Edit, Save, X, Languages, RefreshCw } from 'lucide-react';
import { useToast } from './ToastSystem';
import { translateText } from '../services/geminiService';

interface ConsentFormManagerProps {
    settings: FieldSettings;
    onUpdateSettings: (newSettings: FieldSettings) => void;
}

const ConsentFormManager: React.FC<ConsentFormManagerProps> = ({ settings, onUpdateSettings }) => {
    const toast = useToast();
    const [selectedTemplate, setSelectedTemplate] = useState<ConsentFormTemplate | null>(null);
    const [editedContentEn, setEditedContentEn] = useState('');
    const [editedContentTl, setEditedContentTl] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        if (selectedTemplate) {
            setEditedContentEn(selectedTemplate.content_en);
            setEditedContentTl(selectedTemplate.content_tl);
        } else {
            setEditedContentEn('');
            setEditedContentTl('');
        }
    }, [selectedTemplate]);
    
    const handleTranslate = async () => {
        if (!editedContentEn) return;
        setIsTranslating(true);
        try {
            const translation = await translateText(editedContentEn, 'tl');
            setEditedContentTl(translation);
            toast.info("Mock translation generated.");
        } catch (error) {
            toast.error("Translation failed.");
        } finally {
            setIsTranslating(false);
        }
    };

    const handleSave = () => {
        if (!selectedTemplate) return;

        const updatedTemplates = settings.consentFormTemplates.map(t =>
            t.id === selectedTemplate.id ? { ...t, content_en: editedContentEn, content_tl: editedContentTl } : t
        );

        onUpdateSettings({ ...settings, consentFormTemplates: updatedTemplates });
        toast.success(`Consent form "${selectedTemplate.name}" has been updated.`);
        setSelectedTemplate(null);
    };

    return (
        <div className="animate-in fade-in duration-300 flex gap-8 h-[60vh]">
            <div className="w-1/3 flex flex-col">
                <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs p-4 border-b">
                    Consent Forms
                </h4>
                <div className="flex-1 overflow-y-auto space-y-2 p-4 bg-slate-50 rounded-b-xl">
                    {settings.consentFormTemplates.map(template => (
                        <button
                            key={template.id}
                            onClick={() => setSelectedTemplate(template)}
                            className={`w-full text-left p-4 rounded-xl transition-colors ${selectedTemplate?.id === template.id ? 'bg-teal-100' : 'hover:bg-slate-100'}`}
                        >
                            <p className="font-bold text-sm text-slate-800">{template.name}</p>
                            <p className="text-xs text-slate-500 truncate">{template.content_en.substring(0, 50)}...</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-2/3 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm">
                {selectedTemplate ? (
                    <>
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">{selectedTemplate.name}</h3>
                            <button onClick={handleTranslate} disabled={isTranslating} className="bg-lilac-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2">
                                {isTranslating ? <RefreshCw size={14} className="animate-spin" /> : <Languages size={14} />}
                                {isTranslating ? 'Translating...' : 'Update Tagalog Translation'}
                            </button>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-4 p-4 min-h-0">
                             <div className="flex flex-col">
                                <label className="label text-xs">English (Official)</label>
                                <textarea
                                    value={editedContentEn}
                                    onChange={(e) => setEditedContentEn(e.target.value)}
                                    className="w-full h-full p-4 border rounded-lg resize-none font-mono text-xs flex-1"
                                    spellCheck="false"
                                />
                             </div>
                             <div className="flex flex-col">
                                <label className="label text-xs">Tagalog (For Understanding)</label>
                                <textarea
                                    value={editedContentTl}
                                    readOnly
                                    className="w-full h-full p-4 border rounded-lg resize-none font-mono text-xs flex-1 bg-slate-50"
                                />
                             </div>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-3">
                            <button onClick={() => setSelectedTemplate(null)} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs uppercase">Cancel</button>
                            <button onClick={handleSave} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold text-xs uppercase flex items-center gap-2">
                                <Save size={14} /> Save Changes
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-10">
                        <FileSignature size={48} className="mb-4" />
                        <h4 className="font-bold text-slate-500">Select a form to edit</h4>
                        <p className="text-sm">Choose a consent form from the list to view and modify its content and translations.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsentFormManager;


import React, { useState } from 'react';
import { ConsentFormTemplate } from '../types';
import { FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from './ToastSystem';

interface ConsentFormManagerProps {
    settings: { consentFormTemplates: ConsentFormTemplate[] };
    onUpdateSettings: (s: any) => void;
}

const ConsentFormManager: React.FC<ConsentFormManagerProps> = ({ settings, onUpdateSettings }) => {
    const [editingTemplate, setEditingTemplate] = useState<Partial<ConsentFormTemplate> | null>(null);
    const toast = useToast();

    const handleSave = () => {
        if (!editingTemplate || !editingTemplate.name) {
            toast.error("Template name is required.");
            return;
        }

        const isNew = !settings.consentFormTemplates.some(t => t.id === editingTemplate.id);
        const nextTemplates = isNew
            ? [...settings.consentFormTemplates, editingTemplate as ConsentFormTemplate]
            : settings.consentFormTemplates.map(t => t.id === editingTemplate.id ? editingTemplate as ConsentFormTemplate : t);
        
        onUpdateSettings({ ...settings, consentFormTemplates: nextTemplates });
        toast.success(`Template "${editingTemplate.name}" saved.`);
        setEditingTemplate(null);
    };

    const handleRemove = (id: string) => {
        if (window.confirm("Are you sure you want to delete this template?")) {
            const nextTemplates = settings.consentFormTemplates.filter(t => t.id !== id);
            onUpdateSettings({ ...settings, consentFormTemplates: nextTemplates });
            toast.info("Template deleted.");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => setEditingTemplate({ id: `custom_${Date.now()}`, name: 'New Custom Form', content_en: '', content_tl: '' })} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><Plus/> Add Template</button>
            </div>
            <div className="space-y-2">
                {settings.consentFormTemplates.map(template => (
                    <div key={template.id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center group">
                        <span className="font-bold text-sm text-slate-800">{template.name}</span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                            <button onClick={() => setEditingTemplate(template)} className="p-2 text-slate-500 hover:text-teal-600"><Edit size={16}/></button>
                            <button onClick={() => handleRemove(template.id)} className="p-2 text-slate-500 hover:text-red-600"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
            {editingTemplate && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl space-y-4">
                        <h3 className="font-bold">Edit Template</h3>
                        <input value={editingTemplate.name} onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })} className="input"/>
                        <textarea value={editingTemplate.content_en} onChange={e => setEditingTemplate({ ...editingTemplate, content_en: e.target.value })} className="input h-32" placeholder="English Content"/>
                        <textarea value={editingTemplate.content_tl} onChange={e => setEditingTemplate({ ...editingTemplate, content_tl: e.target.value })} className="input h-32" placeholder="Tagalog Content"/>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditingTemplate(null)} className="px-4 py-2 text-xs font-bold">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsentFormManager;

import React, { useState } from 'react';
import { FieldSettings, RegistrationField } from '../types';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface PatientRegistryManagerProps {
  settings: FieldSettings;
  onUpdateSettings: (newSettings: FieldSettings) => void;
}

const PatientRegistryManager: React.FC<PatientRegistryManagerProps> = ({ settings, onUpdateSettings }) => {
    const [editingField, setEditingField] = useState<Partial<RegistrationField> | null>(null);

    const handleSave = () => {
        if (!editingField || !editingField.label) return;

        const isNew = !editingField.id;
        const newField: RegistrationField = {
            id: editingField.id || `field_${Date.now()}`,
            label: editingField.label,
            type: editingField.type || 'text',
            section: editingField.section || 'IDENTITY',
            width: editingField.width || 'full',
        };

        const newIdentityFields = isNew 
            ? [...settings.identityFields, newField]
            : settings.identityFields.map(f => f.id === newField.id ? newField : f);
        
        onUpdateSettings({ ...settings, identityFields: newIdentityFields });
        setEditingField(null);
    };

    const handleDelete = (fieldId: string) => {
        if (window.confirm("Are you sure you want to delete this custom field?")) {
            const newIdentityFields = settings.identityFields.filter(f => f.id !== fieldId);
            const newIdentityLayout = settings.identityLayoutOrder.filter(id => id !== `field_${fieldId}`);
            onUpdateSettings({ ...settings, identityFields: newIdentityFields, identityLayoutOrder: newIdentityLayout });
        }
    };
    
    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black">Patient Registry Fields</h2>
                <button onClick={() => setEditingField({})} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus/> Add Field</button>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-xs uppercase"><th className="p-3 text-left">Label</th><th className="p-3 text-left">Type</th><th className="p-3 text-left">Section</th><th className="p-3">Actions</th></tr>
                    </thead>
                    <tbody>
                        {settings.identityFields.map(field => (
                            <tr key={field.id} className="border-t">
                                <td className="p-3 font-bold">{field.label}</td>
                                <td className="p-3">{field.type}</td>
                                <td className="p-3">{field.section}</td>
                                <td className="p-3 text-center">
                                    <button onClick={() => setEditingField(field)} className="p-2 text-slate-400 hover:text-blue-600"><Edit size={16}/></button>
                                    <button onClick={() => handleDelete(field.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingField && (
                 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">
                        <h3 className="font-bold text-lg">{editingField.id ? "Edit Field" : "Add Field"}</h3>
                        <input value={editingField.label || ''} onChange={e => setEditingField({...editingField, label: e.target.value})} placeholder="Field Label" className="input" />
                        <select value={editingField.type || 'text'} onChange={e => setEditingField({...editingField, type: e.target.value as any})} className="input">
                            <option value="text">Text</option><option value="textarea">Text Area</option><option value="date">Date</option><option value="boolean">Checkbox</option>
                        </select>
                        <select value={editingField.section || 'IDENTITY'} onChange={e => setEditingField({...editingField, section: e.target.value as any})} className="input">
                            <option value="IDENTITY">Identity</option><option value="CONTACT">Contact</option><option value="INSURANCE">Insurance</option><option value="DENTAL">Dental</option><option value="MEDICAL">Medical</option>
                        </select>
                        <div className="flex justify-end gap-2"><button onClick={() => setEditingField(null)} className="px-4 py-2">Cancel</button><button onClick={handleSave} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Save</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientRegistryManager;

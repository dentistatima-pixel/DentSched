import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Patient, PatientFile } from '../types';
import { Camera, Search, FileEdit, X, ImageIcon } from 'lucide-react';
import { useToast } from './ToastSystem';
import { DataService } from '../services/dataService';
import { formatDate } from '../constants';

interface DiagnosticGalleryProps {
    patient: Patient,
    onQuickUpdatePatient: (p: Partial<Patient>) => void
}

const DiagnosticGallery: React.FC<DiagnosticGalleryProps> = ({ patient, onQuickUpdatePatient }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [editingFile, setEditingFile] = useState<PatientFile | null>(null);
    
    const [primaryImageId, setPrimaryImageId] = useState<string | null>(null);
    const toast = useToast();

    const images = useMemo(() => 
        (patient.files?.filter(f => f.category === 'X-Ray' || f.category === 'Clinical Photo') || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [patient.files]);

    useEffect(() => {
        if (images.length > 0 && !primaryImageId) {
            setPrimaryImageId(images[0].id);
        } else if (images.length > 0 && primaryImageId && !images.find(img => img.id === primaryImageId)) {
            // If the selected image was deleted, select the new first one
            setPrimaryImageId(images[0].id);
        } else if (images.length === 0) {
            setPrimaryImageId(null);
        }
    }, [images, primaryImageId]);

    const primaryImage = useMemo(() => images.find(img => img.id === primaryImageId), [images, primaryImageId]);

    const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        toast.info(`Uploading "${file.name}"...`);
        const base64String = await blobToBase64(file);
        
        const newFile: PatientFile = { 
            id: `file_${Date.now()}_${Math.random().toString(16).slice(2)}`, 
            name: file.name, 
            category: 'X-Ray', 
            url: base64String, 
            date: new Date().toISOString().split('T')[0] 
        };
        
        onQuickUpdatePatient({ id: patient.id, files: [...(patient.files || []), newFile] });
        setPrimaryImageId(newFile.id);
        toast.success(`"${file.name}" uploaded successfully.`);

        if(e.target) {
            e.target.value = '';
        }
    };

    const handleSaveEdit = (updatedFile: PatientFile) => {
        const updatedFiles = patient.files?.map(f => f.id === updatedFile.id ? updatedFile : f) || [];
        onQuickUpdatePatient({ id: patient.id, files: updatedFiles });
        setEditingFile(null);
        toast.success("Image details updated.");
    };
    
    return (
        <div className="animate-in fade-in duration-500 h-full flex flex-col gap-6">
            <div className="bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm shrink-0">
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    <button onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 w-32 h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-colors">
                        <Camera size={24}/>
                        <span className="text-xs font-bold mt-1">Upload</span>
                    </button>
                    {images.map(img => (
                        <div key={img.id} onClick={() => setPrimaryImageId(img.id)} className="flex-shrink-0 w-32 h-24 rounded-xl relative group overflow-hidden cursor-pointer border-4" style={{borderColor: primaryImageId === img.id ? '#14b8a6' : 'transparent'}}>
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover"/>
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                <button onClick={(e) => { e.stopPropagation(); setLightboxImage(img.url); }} className="p-2 bg-black/50 text-white rounded-full text-xs" title="View"><Search size={14}/></button>
                                <button onClick={(e) => { e.stopPropagation(); setEditingFile(img); }} className="p-2 bg-black/50 text-white rounded-full text-xs" title="Edit"><FileEdit size={14}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 bg-slate-900 rounded-[2.5rem] flex items-center justify-center p-4 relative">
                {primaryImage ? (
                    <>
                        <img src={primaryImage.url} alt={primaryImage.name} className="max-h-full max-w-full object-contain"/>
                        <div className="absolute top-4 right-4 flex gap-2">
                            <button onClick={() => setLightboxImage(primaryImage.url)} className="p-2 bg-black/30 text-white rounded-full"><Search/></button>
                            <button onClick={() => setEditingFile(primaryImage)} className="p-2 bg-black/30 text-white rounded-full"><FileEdit/></button>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 bg-black/50 p-4 rounded-xl backdrop-blur-sm">
                            <p className="font-bold text-white">{primaryImage.name}</p>
                            <p className="text-xs text-slate-300">{formatDate(primaryImage.date)}</p>
                            {primaryImage.notes && <p className="text-xs text-slate-200 mt-2 italic">"{primaryImage.notes}"</p>}
                        </div>
                    </>
                ) : (
                    <div className="text-center text-slate-500 flex flex-col items-center justify-center">
                        <ImageIcon size={48} className="mx-auto mb-4"/>
                        <h3 className="font-bold">Imaging Hub</h3>
                        <p className="text-sm mt-1 mb-6">Upload and manage diagnostic images.</p>
                         <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-3 bg-teal-600/20 text-teal-300 rounded-xl hover:bg-teal-600/40 transition-colors">
                            <Camera size={16}/> Upload First Image
                        </button>
                    </div>
                )}
            </div>
            
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

            {lightboxImage && (
                <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
                    <img src={lightboxImage} alt="Radiograph" className="max-w-full max-h-full rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
                    <button onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }} className="absolute top-4 right-4 text-white p-2 bg-black/30 rounded-full"><X/></button>
                </div>
            )}

            {editingFile && (
                <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
                        <h3 className="font-bold">Edit Image Details</h3>
                        <div>
                            <label className="text-xs font-bold">Label</label>
                            <input type="text" value={editingFile.name} onChange={e => setEditingFile({...editingFile, name: e.target.value})} className="input"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold">Notes</label>
                            <textarea value={editingFile.notes || ''} onChange={e => setEditingFile({...editingFile, notes: e.target.value})} className="input h-24"/>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingFile(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold">Cancel</button>
                            <button onClick={() => handleSaveEdit(editingFile)} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default DiagnosticGallery;
import React, { useState, useEffect } from 'react';
import { FileText, Stethoscope, Activity, ClipboardList, Lock } from 'lucide-react';
// FIX: Added missing import for `AppointmentStatus`.
import { Patient, Appointment, DentalChartEntry, LedgerEntry, TreatmentPlanStatus, AppointmentStatus } from '../types';
import { useToast } from './ToastSystem';
import { useSettings } from '../contexts/SettingsContext';
import { useAppContext } from '../contexts/AppContext';
import { useInventory } from '../contexts/InventoryContext';
import { generateUid } from '../constants';
import { Odontogram } from './Odontogram';
import { Odontonotes } from './Odontonotes';
import { PerioChart } from './PerioChart';
import TreatmentPlanModule from './TreatmentPlanModule';
import CryptoJS from 'crypto-js';
import { useModal } from '../contexts/ModalContext';

interface ClinicalCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient;
    appointment: Appointment;
    onSavePatient: (patientData: Partial<Patient>) => Promise<void>;
    onUpdateAppointmentStatus: (appointmentId: string, status: AppointmentStatus, additionalData?: Partial<Appointment>, bypassProtocol?: boolean) => Promise<void>;
}

const ClinicalCheckoutModal: React.FC<ClinicalCheckoutModalProps> = ({ isOpen, onClose, patient, appointment, onSavePatient, onUpdateAppointmentStatus }) => {
    const { currentUser, logAction } = useAppContext();
    const { fieldSettings } = useSettings();
    const { stock, onUpdateStock } = useInventory();
    const toast = useToast();
    const { showModal } = useModal();

    const [activeTab, setActiveTab] = useState('notes');
    const [tempPatient, setTempPatient] = useState<Patient>(patient);
    const [sessionNote, setSessionNote] = useState<DentalChartEntry | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Deep copy patient to avoid side effects
            const patientCopy = JSON.parse(JSON.stringify(patient));
            setTempPatient(patientCopy);

            const existingNote = patientCopy.dentalChart?.find((n: DentalChartEntry) => n.appointmentId === appointment.id);
            if (existingNote) {
                setSessionNote(existingNote);
            } else {
                const defaultProc = fieldSettings.procedures.find(p => p.name === appointment.type);
                const newNote: DentalChartEntry = {
                    id: generateUid('note'),
                    appointmentId: appointment.id,
                    date: new Date().toISOString().split('T')[0],
                    procedure: appointment.type,
                    price: defaultProc?.defaultPrice,
                    toothNumber: undefined, 
                    status: 'Completed',
                    author: currentUser?.name,
                    authorId: currentUser?.id,
                    authorRole: currentUser?.role,
                    authorPrc: currentUser?.prcLicense,
                };
                setSessionNote(newNote);
                setTempPatient(p => ({ ...p, dentalChart: [...(p.dentalChart || []), newNote] }));
            }
        }
    }, [isOpen, patient, appointment, currentUser]);

    const performSaveAndSeal = async () => {
        if (!sessionNote) return;
        setIsSaving(true);
        try {
            // 2. Sealing
            const sealedNote = { ...sessionNote };
            const contentToHash = JSON.stringify({
                obs: sealedNote.objective,
                proc: sealedNote.procedure, tooth: sealedNote.toothNumber, date: sealedNote.date
            });
            sealedNote.sealedHash = CryptoJS.SHA256(contentToHash).toString();
            sealedNote.sealedAt = new Date().toISOString();

            // 3. Update Patient Object
            const finalPatient = {
                ...tempPatient,
                dentalChart: tempPatient.dentalChart?.map(n => n.id === sealedNote.id ? sealedNote : n)
            };

            // Add to ledger if it's a completed procedure
            if (sealedNote.status === AppointmentStatus.COMPLETED) {
                const chargeAmount = sealedNote.price ?? fieldSettings.procedures.find(p => p.name === sealedNote.procedure)?.defaultPrice ?? 0;
                
                if (chargeAmount > 0) {
                    const newCharge: LedgerEntry = {
                        id: generateUid('l'),
                        date: new Date().toISOString().split('T')[0],
                        description: `${sealedNote.procedure}${sealedNote.toothNumber ? ` (#${sealedNote.toothNumber})` : ''}`,
                        type: 'Charge',
                        amount: chargeAmount,
                        balanceAfter: (finalPatient.currentBalance || 0) + chargeAmount,
                    };
                    finalPatient.ledger = [...(finalPatient.ledger || []), newCharge];
                    finalPatient.currentBalance = newCharge.balanceAfter;
                }
                
                // Update treatment plan
                if(sealedNote.planId) {
                    finalPatient.treatmentPlans = finalPatient.treatmentPlans?.map(p => {
                        if(p.id === sealedNote.planId) {
                            const planItems = finalPatient.dentalChart?.filter(item => item.planId === p.id);
                            const allCompleted = planItems?.every(item => item.status === 'Completed');
                            if (allCompleted) {
                                return { ...p, status: TreatmentPlanStatus.COMPLETED };
                            }
                        }
                        return p;
                    });
                }
            }

            // 4. Persist Changes
            await onSavePatient(finalPatient);
            
            // 5. Inventory Deduction
            const procedure = fieldSettings.procedures.find(p => p.name === appointment.type);
            if (procedure && procedure.billOfMaterials && procedure.billOfMaterials.length > 0) {
                const updatedStock = [...stock];
                let stockChanged = false;
                const lowStockItems: string[] = [];

                procedure.billOfMaterials.forEach(bomItem => {
                    const stockItemIndex = updatedStock.findIndex(s => s.id === bomItem.stockItemId);
                    if (stockItemIndex !== -1) {
                        const currentQty = updatedStock[stockItemIndex].quantity;
                        // Deduct
                        updatedStock[stockItemIndex] = {
                            ...updatedStock[stockItemIndex],
                            quantity: Math.max(0, currentQty - bomItem.quantity)
                        };
                        stockChanged = true;
                        
                        // Check for low stock alert (using minQuantity as Reorder Point)
                        const reorderPoint = updatedStock[stockItemIndex].minQuantity || updatedStock[stockItemIndex].lowStockThreshold || 0;
                        if (updatedStock[stockItemIndex].quantity <= reorderPoint) {
                             lowStockItems.push(updatedStock[stockItemIndex].name);
                        }
                    }
                });

                if (stockChanged) {
                    onUpdateStock(updatedStock);
                    if (lowStockItems.length > 0) {
                        toast.warning(`Low Stock Alert: ${lowStockItems.join(', ')}. Please reorder.`);
                    }
                }
            }

            // 6. Update Appointment Status
            await onUpdateAppointmentStatus(appointment.id, AppointmentStatus.COMPLETED, {}, true);

            toast.success("Session completed and record sealed.");
            onClose();

        } catch (error) {
            toast.error("Failed to save and seal the record.");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAndSeal = () => {
        if (!sessionNote) return;

        // 1. Validation
        if (!sessionNote.objective?.trim()) {
            showModal('confirm', {
                title: 'Empty Clinical Observations',
                message: 'Warning: The Clinical Observations field is empty. Are you sure you want to seal this note?',
                confirmText: 'Seal Note',
                isDestructive: false,
                onConfirm: performSaveAndSeal
            });
            return;
        }
        
        performSaveAndSeal();
    };
    
    const handleChartUpdate = (updatedNote: DentalChartEntry) => {
        setTempPatient(prev => {
            const chart = prev.dentalChart || [];
            const isNew = !chart.some(n => n.id === updatedNote.id);
            const newChart = isNew ? [...chart, updatedNote] : chart.map(n => n.id === updatedNote.id ? updatedNote : n);

            const updatedPatient = { ...prev, dentalChart: newChart };

            // Sync logic
            const oldNote = chart.find(n => n.id === updatedNote.id);
            if (updatedNote.status === 'Completed' && oldNote?.status !== 'Completed') {
                // Add to ledger
                const procedureInfo = fieldSettings.procedures.find(p => p.name === updatedNote.procedure);
                if (procedureInfo) {
                    const newCharge: LedgerEntry = {
                        id: generateUid('l'),
                        date: new Date().toISOString().split('T')[0],
                        description: `${updatedNote.procedure} (#${updatedNote.toothNumber})`,
                        type: 'Charge',
                        amount: procedureInfo.defaultPrice,
                        balanceAfter: (updatedPatient.currentBalance || 0) + procedureInfo.defaultPrice,
                    };
                    updatedPatient.ledger = [...(updatedPatient.ledger || []), newCharge];
                    updatedPatient.currentBalance = newCharge.balanceAfter;
                }
                
                // Update treatment plan
                if(updatedNote.planId) {
                    updatedPatient.treatmentPlans = updatedPatient.treatmentPlans?.map(p => {
                        if(p.id === updatedNote.planId) {
                            const planItems = updatedPatient.dentalChart?.filter(item => item.planId === p.id);
                            const allCompleted = planItems?.every(item => item.status === 'Completed');
                            if (allCompleted) {
                                return { ...p, status: TreatmentPlanStatus.COMPLETED };
                            }
                        }
                        return p;
                    });
                }
            }
            return updatedPatient;
        });
    };

    if (!isOpen || !sessionNote) return null;

    const tabs = [
        { id: 'notes', label: 'Notes', icon: FileText },
        { id: 'odontogram', label: 'Odontogram', icon: Stethoscope },
        { id: 'perio', label: 'Perio', icon: Activity },
        { id: 'strategy', label: 'Strategy', icon: ClipboardList },
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
            <div className="bg-slate-50 w-full h-full rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
                <header className="p-6 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Clinical Checkout</h2>
                        <p className="text-sm text-slate-500 font-bold">{patient.name} - {appointment.type}</p>
                    </div>
                     <div className="flex items-center gap-2">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-teal-100 text-teal-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                                <tab.icon size={16}/> {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                        <button onClick={handleSaveAndSeal} disabled={isSaving} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-teal-600/20">
                            <Lock size={16}/> {isSaving ? 'Sealing...' : 'Save & Seal'}
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">
                   <div className={activeTab === 'notes' ? '' : 'hidden'}>
                        <Odontonotes
                            entries={[sessionNote]}
                            appointments={[appointment]}
                            patient={tempPatient}
                            onAddEntry={() => {}}
                            onUpdateEntry={(note) => setSessionNote(note)}
                            onUpdateAppointment={async () => {}}
                            onQuickUpdatePatient={async (p) => setTempPatient(p as Patient)}
                            currentUser={currentUser!}
                            procedures={fieldSettings.procedures}
                            treatmentPlans={tempPatient.treatmentPlans}
                            showModal={() => {}}
                            logAction={logAction}
                            editingNote={sessionNote}
                            setEditingNote={setSessionNote}
                        />
                   </div>
                    <div className={activeTab === 'odontogram' ? 'p-6' : 'hidden'}>
                        <Odontogram 
                            chart={tempPatient.dentalChart || []} 
                            onToothClick={() => {}}
                            onChartUpdate={handleChartUpdate}
                            currentUser={currentUser!}
                        />
                    </div>
                     <div className={activeTab === 'perio' ? '' : 'hidden'}>
                        <PerioChart 
                            data={tempPatient.perioChart || []} 
                            dentalChart={tempPatient.dentalChart || []} 
                            onSave={(newData) => setTempPatient(p => ({ ...p, perioChart: newData }))}
                        />
                    </div>
                     <div className={activeTab === 'strategy' ? '' : 'hidden'}>
                        <TreatmentPlanModule 
                            patient={tempPatient}
                            onUpdatePatient={(p) => setTempPatient(p as Patient)}
                            currentUser={currentUser!}
                            logAction={logAction}
                            featureFlags={fieldSettings.features}
                            fieldSettings={fieldSettings}
                            onOpenRevocationModal={() => {}}
                            onInitiateFinancialConsent={() => {}}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ClinicalCheckoutModal;

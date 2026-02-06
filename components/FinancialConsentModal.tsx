
import React from 'react';
import { Patient, TreatmentPlan } from '../types';
import SignatureCaptureOverlay from './SignatureCaptureOverlay';
import { usePatient } from '../contexts/PatientContext';
import { useToast } from './ToastSystem';

interface FinancialConsentModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient;
    plan: TreatmentPlan;
}

const FinancialConsentModal: React.FC<FinancialConsentModalProps> = ({ isOpen, onClose, patient, plan }) => {
    const { handleApproveFinancialConsent } = usePatient();
    const toast = useToast();

    const handleSave = (signature: string, hash: string) => {
        handleApproveFinancialConsent(patient.id, plan.id, signature);
        toast.success("Financial authorization sealed.");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <SignatureCaptureOverlay 
            isOpen={isOpen}
            onClose={onClose}
            onSave={handleSave}
            title="Financial Authorization"
            instruction="Please sign below to authorize the treatment plan and acknowledge financial responsibility."
            themeColor="teal"
            contextSummary={
                <div className="space-y-4">
                    <h4 className="font-bold text-lg border-b pb-2">Plan: {plan.name}</h4>
                    <p className="text-sm">Patient: {patient.name}</p>
                    <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-xs font-bold uppercase text-slate-400">Total Estimate</p>
                        <p className="text-2xl font-black text-teal-700">₱{plan.originalQuoteAmount?.toLocaleString() || '0'}</p>
                    </div>
                </div>
            }
        />
    );
};

export default FinancialConsentModal;

import { useMemo } from 'react';
import { Patient, PatientAlert } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { Heart, Droplet, Pill, FileWarning, MessageSquare, DollarSign, FileBadge2 } from 'lucide-react';

export const usePatientAlerts = (patient: Patient | null): PatientAlert[] => {
    const { fieldSettings } = useSettings();

    const alerts = useMemo(() => {
        if (!patient) return [];

        const allAlerts: PatientAlert[] = [];
        const criticalRegistry = fieldSettings?.criticalRiskRegistry || [];

        // Medical Conditions
        (patient.medicalConditions || []).filter(c => c && c.toLowerCase() !== 'none').forEach(condition => {
            const isCritical = criticalRegistry.includes(condition);
            allAlerts.push({
                type: 'medical',
                level: isCritical ? 'critical' : 'warning',
                message: `Condition: ${condition}`,
                icon: Heart,
                colorClass: 'text-red-600',
            });
        });

        // Allergies
        (patient.allergies || []).filter(a => a && a.toLowerCase() !== 'none').forEach(allergy => {
            allAlerts.push({
                type: 'allergy',
                level: 'critical',
                message: `Allergy: ${allergy}`,
                icon: Droplet,
                colorClass: 'text-orange-600',
            });
        });
        
        // Current Medications
        if (patient.medicationDetails && patient.medicationDetails.trim().length > 0) {
            allAlerts.push({
                type: 'medication',
                level: 'warning',
                message: `Taking: ${patient.medicationDetails}`,
                icon: Pill,
                colorClass: 'text-yellow-600',
            });
        }
        
        // Financial
        if ((patient.currentBalance || 0) > 0) {
            allAlerts.push({
                type: 'financial',
                level: 'info',
                message: `Balance: ₱${patient.currentBalance?.toLocaleString()}`,
                icon: DollarSign,
                colorClass: 'text-purple-600',
            });
        }
        
        // Social / Notes
        if (patient.notes && (patient.notes.toLowerCase().includes('anxious') || patient.notes.toLowerCase().includes('anxiety'))) {
            allAlerts.push({
                type: 'social',
                level: 'info',
                message: 'Patient is anxious',
                icon: MessageSquare,
                colorClass: 'text-blue-600',
            });
        }

        // Incomplete Registration
        if (patient.registrationStatus === 'Provisional') {
            allAlerts.push({
                type: 'incomplete',
                level: 'warning',
                message: 'Incomplete Registration',
                icon: FileBadge2,
                colorClass: 'text-blue-500',
            });
        }

        // Clearance Status
        const needsClearance = (patient.medicalConditions || []).some(c => criticalRegistry.includes(c));
        if (needsClearance) {
            const validClearances = (patient.clearanceRequests || []).filter(r => {
                if (r.status !== 'Approved' || !r.approvedAt) return false;
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                return new Date(r.approvedAt) > threeMonthsAgo;
            });

            if (validClearances.length === 0) {
                 allAlerts.push({
                    type: 'clearance',
                    level: 'critical',
                    message: 'Medical Clearance Required',
                    icon: FileWarning,
                    colorClass: 'text-red-600',
                });
            }
        }
        
        // Sort by severity
        const levelOrder = { 'critical': 1, 'warning': 2, 'info': 3 };
        return allAlerts.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

    }, [patient, fieldSettings]);

    return alerts;
};
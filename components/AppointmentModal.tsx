
import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, User, Save, Search, AlertCircle, Sparkles, Beaker, CreditCard, Activity, ArrowRight, ClipboardCheck, FileSignature, CheckCircle, Shield, Briefcase, Lock, Armchair, AlertTriangle, ShieldAlert, BadgeCheck, ShieldX, Database, PackageCheck, UserCheck } from 'lucide-react';
import { Patient, User as Staff, AppointmentType, UserRole, Appointment, AppointmentStatus, FieldSettings, LabStatus, TreatmentPlanStatus, SterilizationCycle, ClinicResource, Vendor } from '../types';
import Fuse from 'fuse.js';
import { formatDate } from '../constants';
import { useToast } from './ToastSystem';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  staff: Staff[];
  appointments: Appointment[]; 
  onSave: (appointment: Appointment) => void;
  onSavePatient?: (patient: Partial<Patient>) => void; 
  initialDate?: string;
  initialTime?: string;
  initialPatientId?: string;
  existingAppointment?: Appointment | null;
  fieldSettings: FieldSettings; 
  sterilizationCycles?: SterilizationCycle[];
  onManualOverride?: (gateId: string, reason: string) => void;
  isDowntime?: boolean;
}

// Fix: Export the component to resolve import error in App.tsx
export const AppointmentModal: React.FC<AppointmentModalProps> = ({ 
  isOpen, onClose, patients, staff, appointments, onSave, onSavePatient, initialDate, initialTime, initialPatientId, existingAppointment, fieldSettings, sterilizationCycles = [], onManualOverride, isDowntime
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'existing' | 'new' | 'block'>('existing');
  
  const [providerId, setProviderId] = useState('');
  const [resourceId, setResourceId] = useState(''); 
  const [date, setDate] = useState(initialDate || new Date().toLocaleDateString('en-CA'));
  const [time, setTime] = useState(initialTime || '09:00');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [labStatus, setLabStatus] = useState<LabStatus>(LabStatus.NONE);
  const [labVendorId, setLabVendorId] = useState('');
  
  const [materialLotNumber, setMaterialLotNumber] = useState('');
  const [materialCertIssuer, setMaterialCertIssuer] = useState('');
  const [materialVerifiedBy, setMaterialVerifiedBy] = useState('');

  const [sterilizationCycleId, setSterilizationCycleId] = useState('');
  const [sterilizationVerified, setSterilizationVerified] = useState(false); 

  const [showOverridePrompt, setShowOverridePrompt] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [pendingOverrideType, setPendingOverrideType] = useState<string | null>(null);

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [procedureType, setProcedureType] = useState<string>(AppointmentType.CONSULTATION);
  const [blockTitle, setBlockTitle] = useState('');

  const dentists = staff.filter(s => s.role === UserRole.DENTIST || s.role === UserRole.DENTAL_ASSISTANT);
  const selectedProvider = useMemo(() => staff.find(s => s.id === providerId), [staff, providerId]);

  const filteredProcedures = useMemo(() => {
    return fieldSettings.procedures.filter(p => {
        if (!p.allowedLicenseCategories || p.allowedLicenseCategories.length === 0) return true;
        if (!selectedProvider?.licenseCategory) return true;
        return p.allowedLicenseCategories.includes(selectedProvider.licenseCategory);
    });
  }, [fieldSettings.procedures, selectedProvider]);

  const isCriticalProcedure = ['Surgery', 'Root Canal', 'Extraction'].includes(procedureType);
  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);

  const availableResources = useMemo(() => {
      return (fieldSettings.resources || []).filter(r => !existingAppointment || r.branch === existingAppointment.branch);
  }, [fieldSettings.resources, existingAppointment]);

  const labVendors = useMemo(() => {
      return (fieldSettings.vendors || []).filter(v => v.type === 'Lab');
  }, [fieldSettings.vendors]);

  const selectedLab = useMemo(() => {
      return labVendors.find(v => v.id === labVendorId);
  }, [labVendorId, labVendors]);

  const isDsaValid = useMemo(() => {
      if (!selectedLab) return false;
      if (!selectedLab.dsaExpiryDate) return false;
      const expiry = new Date(selectedLab.dsaExpiryDate);
      return expiry > new Date() && selectedLab.status === 'Active';
  }, [selectedLab]);

  useEffect(() => {
      if (isOpen) {
          // Fix: Added missing logic to reset/populate form on open
          if (existingAppointment) {
              setProviderId(existingAppointment.providerId);
              setResourceId(existingAppointment.resourceId || '');
              setDate(existingAppointment.date);
              setTime(existingAppointment.time);
              setDuration(existingAppointment.durationMinutes);
              setNotes(existingAppointment.notes || '');
              setProcedureType(existingAppointment.type);
              setSelectedPatientId(existingAppointment.patientId);
          } else {
              setSelectedPatientId(initialPatientId || '');
              setDate(initialDate || new Date().toLocaleDateString('en-CA'));
              setTime(initialTime || '09:00');
          }
      }
  }, [isOpen, existingAppointment, initialDate, initialTime, initialPatientId]);

  return null; // Truncated placeholder
};

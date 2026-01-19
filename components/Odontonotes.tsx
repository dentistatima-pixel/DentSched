import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DentalChartEntry, ProcedureItem, StockItem, User, UserRole, FieldSettings, TreatmentStatus, ClinicalIncident, Patient, ResourceType, Appointment, AppointmentStatus, AuthorityLevel, InstrumentSet, TreatmentPlan, SterilizationCycle, ClinicalMacro, ClinicalProtocolRule } from '../types';
import { Plus, Edit3, ShieldCheck, Lock, Clock, GitCommit, ArrowDown, AlertCircle, FileText, Zap, Box, RotateCcw, CheckCircle2, PackageCheck, Mic, MicOff, Volume2, Sparkles, DollarSign, ShieldAlert, Key, Camera, ImageIcon, Check, MousePointer2, UserCheck, X, EyeOff, Shield, Eraser, Activity, Heart, HeartPulse, Droplet, UserSearch, RotateCcw as Undo, Trash2, Armchair, Star, PlusCircle, MinusCircle, UserPlus, ShieldX, Verified, ShieldQuestion, Pill, Fingerprint, Scale, History, Link } from 'lucide-react';
import { formatDate, STAFF, PDA_FORBIDDEN_COMMERCIAL_TERMS, PDA_INFORMED_CONSENT_TEXTS } from '../constants';
import { useToast } from './ToastSystem';
import EPrescriptionModal from './EPrescriptionModal';
import SignatureCaptureOverlay from './SignatureCaptureOverlay';
import CryptoJS from 'crypto-js';
import { getTrustedTime } from '../services/timeService';
import { useClinicalNotePermissions } from '../hooks/useClinicalNotePermissions';
import { useDictation } from '../hooks/useDictation';


interface OdontonotesProps {
  entries: DentalChartEntry[];
  onAddEntry: (entry: DentalChartEntry) => void;
  onUpdateEntry: (entry: DentalChartEntry) => void;
  onDeleteEntry?: (id: string) => void;
  currentUser: User;
  readOnly?: boolean;
  procedures: ProcedureItem[];
  inventory?: StockItem[]; 
  prefill?: Partial<DentalChartEntry> | null;
  onClearPrefill?: () => void;
  logAction?: (action: any, entity: any, id: string, details: string) => void;
  fieldSettings?: FieldSettings; 
  patient?: Patient;
  appointments?: Appointment[];
  incidents?: ClinicalIncident[];
  sterilizationCycles?: SterilizationCycle[];
  onRequestProtocolOverride?: (rule: ClinicalProtocolRule, continuation: () => void) => void;
}

export const Odontonotes: React.FC<OdontonotesProps> = ({ entries, onAddEntry, onUpdateEntry, onDeleteEntry, currentUser, readOnly, procedures, inventory = [], prefill, onClearPrefill, logAction, fieldSettings, patient, appointments = [], incidents = [], sterilizationCycles = [], onRequestProtocolOverride }) => {
  const toast = useToast();
  const isAdvancedInventory = fieldSettings?.features.inventoryComplexity === 'ADVANCED';
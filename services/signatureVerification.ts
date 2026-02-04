import { SignatureChainEntry, Patient, Appointment } from '../types';
import CryptoJS from 'crypto-js';
import { generateUid } from '../constants';

export const validateSignatureChain = (chain: SignatureChainEntry[]): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!chain || chain.length === 0) {
      return { valid: true, errors: [] };
  }

  // Check first signature has no previous hash (or genesis hash)
  if (chain[0]?.previousHash && chain[0].previousHash !== '0') {
    errors.push('Invalid chain start: Genesis block previousHash is not "0".');
  }
  
  for (let i = 1; i < chain.length; i++) {
    // Check sequential hashes
    if (chain[i].previousHash !== chain[i-1].hash) {
      errors.push(`Hash chain broken at index ${i}. Expected previous hash ${chain[i-1].hash} but got ${chain[i].previousHash}.`);
    }
    
    // Check timestamps are sequential
    if (new Date(chain[i].timestamp) < new Date(chain[i-1].timestamp)) {
      errors.push(`Timestamp out of order at index ${i}.`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};


interface CreateSignatureParams {
    signerName: string;
    signerRole?: string;
    signatureType: SignatureChainEntry['signatureType'];
    previousHash: string;
    metadata: Record<string, any>;
    expiresInDays?: number;
}

export const createSignatureEntry = (
    signatureDataUrl: string,
    params: CreateSignatureParams
): SignatureChainEntry => {
    const timestamp = new Date().toISOString();
    let expiresAt: string | undefined = undefined;

    if (params.expiresInDays) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + params.expiresInDays);
        expiresAt = expiryDate.toISOString();
    }
    
    const nonce = generateUid('nonce');
    const payload = {
        signatureDataUrl,
        timestamp,
        signer: params.signerName,
        metadata: { ...params.metadata, nonce },
        expiresAt,
    };
    
    const hash = CryptoJS.SHA256(JSON.stringify(payload)).toString();

    return {
        id: generateUid('sig'),
        signatureType: params.signatureType,
        signatureDataUrl,
        timestamp,
        signerName: params.signerName,
        signerRole: params.signerRole,
        hash,
        previousHash: params.previousHash,
        metadata: {
            deviceInfo: navigator.userAgent,
            ...params.metadata,
            nonce,
        },
        expiresAt,
    };
};

export const verifyAllPatientSignatures = (patient: Patient, appointments: Appointment[]): {
    valid: boolean;
    report: { chain: string; valid: boolean; errors: string[] }[];
} => {
    const report: { chain: string; valid: boolean; errors: string[] }[] = [];
    
    // Check privacy consent
    if (patient.privacyConsentChain) {
        const result = validateSignatureChain(patient.privacyConsentChain);
        report.push({ chain: 'Privacy Consent', valid: result.valid, errors: result.errors });
    }
    
    // Check all appointment consents
    appointments.forEach(apt => {
        if (apt.patientId === patient.id) {
            if (apt.consentSignatureChain) {
                const result = validateSignatureChain(apt.consentSignatureChain);
                report.push({ chain: `Appt #${apt.id.slice(-4)} Consent`, valid: result.valid, errors: result.errors });
            }
            if (apt.postOpHandoverChain) {
                const result = validateSignatureChain(apt.postOpHandoverChain);
                report.push({ chain: `Appt #${apt.id.slice(-4)} Post-Op`, valid: result.valid, errors: result.errors });
            }
             if (apt.safetyChecklistChain) {
                const result = validateSignatureChain(apt.safetyChecklistChain);
                report.push({ chain: `Appt #${apt.id.slice(-4)} Safety`, valid: result.valid, errors: result.errors });
            }
        }
    });

    // Check Treatment Plan approvals
    patient.treatmentPlans?.forEach(plan => {
        if (plan.approvalSignatureChain) {
            const result = validateSignatureChain(plan.approvalSignatureChain);
            report.push({ chain: `Plan "${plan.name}" Approval`, valid: result.valid, errors: result.errors });
        }
        if (plan.financialConsentSignatureChain) {
            const result = validateSignatureChain(plan.financialConsentSignatureChain);
            report.push({ chain: `Plan "${plan.name}" Financial`, valid: result.valid, errors: result.errors });
        }
    });

    // Check Informed Refusals
    patient.informedRefusals?.forEach(refusal => {
        if (refusal.patientSignatureChain) {
             const result = validateSignatureChain(refusal.patientSignatureChain);
             report.push({ chain: `Refusal #${refusal.id.slice(-4)} Patient`, valid: result.valid, errors: result.errors });
        }
        if (refusal.dentistSignatureChain) {
             const result = validateSignatureChain(refusal.dentistSignatureChain);
             report.push({ chain: `Refusal #${refusal.id.slice(-4)} Dentist`, valid: result.valid, errors: result.errors });
        }
    });
    
    return {
        valid: report.every(r => r.valid),
        report
    };
};
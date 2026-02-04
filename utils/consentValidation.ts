import { Patient } from '../types';

export const checkConsentValidity = (patient: Patient, procedureType?: string): {
  isValid: boolean;
  message: string;
  expiresIn?: number; // days
} => {
  if (!patient.lastGeneralConsentDate) {
    return { isValid: false, message: 'No consent on file' };
  }

  const consentDate = new Date(patient.lastGeneralConsentDate);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - consentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // General consent: 1 year validity
  const generalExpiryDays = 365;
  
  if (daysSince > generalExpiryDays) {
    return { 
      isValid: false, 
      message: `General consent expired ${daysSince - generalExpiryDays} days ago` 
    };
  }

  const daysRemaining = generalExpiryDays - daysSince;
  
  // Warn if expiring within 30 days
  if (daysRemaining <= 30) {
    return {
      isValid: true,
      message: `Consent expiring in ${daysRemaining} days`,
      expiresIn: daysRemaining
    };
  }

  return { isValid: true, message: 'Consent valid', expiresIn: daysRemaining };
};

import { SmsConfig } from '../types';

// Per PDA guidelines, avoid specific clinical and financial terms in SMS.
const PDA_FORBIDDEN_KEYWORDS = [
    'extraction', 'root canal', 'implant', 'denture', 
    'cavity', 'crown', 'bridge', 'braces', 'surgery',
    'infection', 'pain', 'swelling', 'bleeding',
    'hiv', 'diabetes', 'hypertension', 'cancer',
    'aids', 'std', 'herpes', 'gonorrhea',
    'balance', 'debt', 'overdue', 'payment', 'unpaid', '₱', 'php'
];

export const sanitizeSmsContent = (message: string): string => {
    let sanitized = message;
    PDA_FORBIDDEN_KEYWORDS.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        if (regex.test(sanitized)) {
            console.warn(`⚠️ SMS Privacy Alert: Masking sensitive keyword "${term}"`);
            sanitized = sanitized.replace(regex, '[procedure/detail]');
        }
    });
    return sanitized;
};

// This is a conceptual service. No actual SMS will be sent.
export const sendSms = async (
  phoneNumber: string, 
  message: string, 
  config: SmsConfig
): Promise<{success: boolean; gatewayResponse?: string; error?: string}> => {
  
  console.log(`--- SIMULATING SMS ---`);
  console.log(`To: ${phoneNumber}`);
  console.log(`Message: ${message}`);
  console.log(`Using Gateway: ${config.mode}`);
  console.log(`--------------------`);

  // Simulate a successful API call
  return new Promise(resolve => {
      setTimeout(() => {
          resolve({ success: true, gatewayResponse: `mock_msg_id_${Date.now()}` });
      }, 500);
  });
};
